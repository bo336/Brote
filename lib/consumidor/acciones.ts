'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { configMp } from '@/lib/pagos/mp-servidor';
import { arrepentimientoPlus, bajaNegocio, bajaPlus, datosCobro, marcar, pesos } from '@/lib/consumidor/ejecutar';
import type { Servicio, TipoPedido } from '@/lib/consumidor/reglas';

/**
 * El botón de arrepentimiento y el de baja (0147). `enviarPedido` y
 * `consultarPedido` andan sin cuenta, como pide la Disposición 954/2025; con la
 * sesión iniciada, además, lo contratado se da de baja en el momento.
 */

export type Respuesta = { ok: true; codigo: string; creada?: string; hecho?: boolean; mensaje?: string } | { ok: false; error: string };

export interface MisServicios {
  ok: boolean;
  tipo?: 'kid' | 'teen' | 'adult';
  email?: string;
  nombre?: string | null;
  es_plus?: boolean;
  brote_plus?: { estado: string; alta: string; monto: number | null; activa: boolean; en_plazo: boolean; ya_reembolsada: boolean } | null;
  negocios?: { id: string; nombre: string; plan: string; estado: string; alta: string; en_plazo: boolean }[];
  reembolso_auto?: boolean;
}

export interface EstadoPedido {
  ok: boolean;
  error?: string;
  codigo?: string;
  tipo?: TipoPedido;
  servicio?: Servicio;
  estado?: string;
  creada?: string;
  resuelta?: string | null;
  resolucion?: string | null;
}

export async function enviarPedido(input: {
  tipo: TipoPedido;
  servicio: Servicio;
  nombre: string;
  email: string;
  referencia?: string;
  mensaje?: string;
}): Promise<Respuesta> {
  const { data, error } = await createClient().rpc('consumidor_solicitar', {
    p_tipo: input.tipo,
    p_servicio: input.servicio,
    p_nombre: input.nombre,
    p_email: input.email,
    p_referencia: input.referencia ?? null,
    p_mensaje: input.mensaje ?? null,
  });
  if (error) return { ok: false, error: 'error' };
  const r = data as { ok: boolean; codigo?: string; creada?: string; error?: string };
  return r.ok && r.codigo ? { ok: true, codigo: r.codigo, creada: r.creada } : { ok: false, error: r.error ?? 'error' };
}

export async function consultarPedido(codigo: string, email: string): Promise<EstadoPedido> {
  const { data, error } = await createClient().rpc('consumidor_consultar', { p_codigo: codigo, p_email: email });
  if (error || !data) return { ok: false, error: 'error' };
  return data as EstadoPedido;
}

export async function misServicios(): Promise<MisServicios> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  const { data, error } = await supabase.rpc('consumidor_mis_servicios');
  if (error || !data) return { ok: false };
  return data as MisServicios;
}

async function nombreDeCuenta(ms: MisServicios): Promise<string> {
  const n = (ms.nombre ?? '').trim();
  if (n.length >= 2) return n.slice(0, 120);
  const e = (ms.email ?? '').split('@')[0] ?? '';
  return e.length >= 2 ? e.slice(0, 120) : 'Cuenta de Brote';
}

/** Con la sesión iniciada: el pedido de baja y la baja, en el mismo paso. */
export async function bajaAhora(servicio: 'brote_plus' | 'tienda' | 'empresa', negocioId?: string): Promise<Respuesta> {
  const ms = await misServicios();
  if (!ms.ok) return { ok: false, error: 'no_autenticado' };
  const pedido = await enviarPedido({
    tipo: 'baja',
    servicio,
    nombre: await nombreDeCuenta(ms),
    email: '',
    mensaje: negocioId ? `Negocio ${negocioId}` : undefined,
  });
  if (!pedido.ok) return pedido;

  const d = await datosCobro(pedido.codigo);
  if (!d || !configMp().cobrar) {
    await marcar(pedido.codigo, 'en_proceso', 'Lo hacemos nosotros dentro de las 24 h. No se te va a cobrar de nuevo.', { fallo: 'sin_datos' });
    return { ok: true, codigo: pedido.codigo, hecho: false, mensaje: 'Lo hacemos nosotros dentro de las 24 h.' };
  }

  const r = servicio === 'brote_plus' ? await bajaPlus(d, 'boton_baja') : await bajaNegocio(d, negocioId ?? '');
  if (r.ok) {
    const que = servicio === 'brote_plus' ? 'Brote+' : 'el plan de tu negocio';
    const msg = r.yaEstaba
      ? `Ya estaba dado de baja: no se te vuelve a cobrar ${que}.`
      : `Listo: diste de baja ${que}. No se te vuelve a cobrar; seguís con los beneficios hasta el final de lo que ya pagaste.`;
    await marcar(pedido.codigo, 'resuelta', msg, { ejecutada: 'al_instante' });
    revalidatePath('/brote-plus');
    return { ok: true, codigo: pedido.codigo, hecho: true, mensaje: msg };
  }
  const msg = 'Mercado Pago no respondió en este momento. Lo terminamos nosotros dentro de las 24 h y no se te va a cobrar de nuevo.';
  await marcar(pedido.codigo, 'en_proceso', msg, { fallo: r.error });
  return { ok: true, codigo: pedido.codigo, hecho: false, mensaje: msg };
}

/**
 * Con la sesión iniciada y Brote+ contratado hace 10 días o menos: se da de
 * baja, se devuelve lo cobrado y Brote+ termina ya. Una sola devolución
 * automática por persona; fuera de eso, el pedido queda para el dueño.
 */
export async function arrepentirmeAhora(): Promise<Respuesta> {
  const ms = await misServicios();
  if (!ms.ok) return { ok: false, error: 'no_autenticado' };
  const pedido = await enviarPedido({ tipo: 'arrepentimiento', servicio: 'brote_plus', nombre: await nombreDeCuenta(ms), email: '' });
  if (!pedido.ok) return pedido;

  const d = await datosCobro(pedido.codigo);
  const auto = !!(ms.reembolso_auto && ms.brote_plus?.en_plazo && d && !d.ya_reembolsada && configMp().cobrar);
  if (d && auto) {
    const r = await arrepentimientoPlus(d, 'boton_arrepentimiento');
    if (r.ok) {
      const msg =
        r.devuelto > 0
          ? `Listo: diste de baja Brote+ y te devolvimos ${pesos(r.devuelto)} por Mercado Pago. Puede tardar unos días en verse en tu medio de pago.`
          : 'Listo: diste de baja Brote+. No había cobros aprobados para devolver.';
      await marcar(pedido.codigo, 'resuelta', msg, { reembolsos: r.reembolsos, ejecutada: 'al_instante' });
      revalidatePath('/brote-plus');
      return { ok: true, codigo: pedido.codigo, hecho: true, mensaje: msg };
    }
    const msg = r.bajaHecha
      ? 'Ya no se te cobra más. La devolución la terminamos nosotros dentro de las 24 h hábiles y te avisamos acá.'
      : 'Lo terminamos nosotros dentro de las 24 h hábiles: la baja y la devolución. Te avisamos acá.';
    await marcar(pedido.codigo, 'en_proceso', msg, { fallo: r.error, ...(r.reembolsos.length ? { reembolsos: r.reembolsos } : {}) });
    return { ok: true, codigo: pedido.codigo, hecho: false, mensaje: msg };
  }

  // Sin devolución automática: que al menos no se cobre más, y lo demás lo mira el dueño.
  const baja = d ? await bajaPlus(d, 'boton_arrepentimiento') : { ok: false as const, error: 'sin_datos' };
  const msg = baja.ok
    ? 'Ya no se te cobra más. Revisamos la devolución y te respondemos acá dentro de las 24 h hábiles.'
    : 'Recibimos tu pedido. Te respondemos acá dentro de las 24 h hábiles.';
  await marcar(pedido.codigo, 'en_proceso', msg, baja.ok ? { renovacion_cancelada: true } : { fallo: baja.error });
  revalidatePath('/brote-plus');
  return { ok: true, codigo: pedido.codigo, hecho: false, mensaje: msg };
}
