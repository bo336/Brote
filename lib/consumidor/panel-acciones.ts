'use server';

import { createClient } from '@/lib/supabase/server';
import { configMp } from '@/lib/pagos/mp-servidor';
import { arrepentimientoPlus, bajaNegocio, bajaPlus, datosCobro, marcar, pesos } from '@/lib/consumidor/ejecutar';

/**
 * Los botones del panel para los pedidos de arrepentimiento y baja (0147).
 * Sólo los usa la cuenta del dueño: `admin_check` mira la sesión (0136).
 */

type Hecho = { ok: true; mensaje: string } | { ok: false; error: string };

async function esDueno(): Promise<boolean> {
  const { data } = await createClient().rpc('admin_check', { p_pass: '' });
  return data === true;
}

const ERRORES: Record<string, string> = {
  sin_suscripcion: 'No encontramos una suscripción de esa cuenta en Mercado Pago.',
  mp_error: 'Mercado Pago no aceptó la baja. Probá de nuevo o hacelo desde tu cuenta de Mercado Pago.',
  mp_pagos: 'Mercado Pago no devolvió la lista de cobros. Probá de nuevo en un rato.',
  no_configurado: 'Falta MP_ACCESS_TOKEN en Vercel.',
};

const explicar = (e: string) => ERRORES[e] ?? `Mercado Pago respondió: ${e}. Si sigue, devolvé el pago a mano desde Mercado Pago → Actividad.`;

/** Devolver todo lo cobrado de Brote+ y terminarlo ya. */
export async function panelArrepentimientoPlus(codigo: string): Promise<Hecho> {
  if (!(await esDueno())) return { ok: false, error: 'Sin acceso' };
  if (!configMp().cobrar) return { ok: false, error: ERRORES.no_configurado! };
  const d = await datosCobro(codigo);
  if (!d) return { ok: false, error: 'No encontramos el pedido.' };
  const r = await arrepentimientoPlus(d, 'panel');
  if (!r.ok) {
    if (r.reembolsos.length) await marcar(codigo, 'en_proceso', 'Estamos terminando la devolución.', { reembolsos: r.reembolsos, fallo: r.error });
    return { ok: false, error: explicar(r.error) };
  }
  const msg =
    r.devuelto > 0
      ? `Te devolvimos ${pesos(r.devuelto)} por Mercado Pago y diste de baja Brote+. Puede tardar unos días en verse en tu medio de pago.`
      : 'Diste de baja Brote+. No había cobros aprobados para devolver.';
  await marcar(codigo, 'resuelta', msg, { reembolsos: r.reembolsos, ejecutada: 'panel' });
  return { ok: true, mensaje: msg };
}

/** Dar de baja Brote+ sin devolver (sigue hasta el final de lo pagado). */
export async function panelBajaPlus(codigo: string): Promise<Hecho> {
  if (!(await esDueno())) return { ok: false, error: 'Sin acceso' };
  if (!configMp().cobrar) return { ok: false, error: ERRORES.no_configurado! };
  const d = await datosCobro(codigo);
  if (!d) return { ok: false, error: 'No encontramos el pedido.' };
  const r = await bajaPlus(d, 'panel');
  if (!r.ok) return { ok: false, error: explicar(r.error) };
  const msg = r.yaEstaba
    ? 'Ya estaba dado de baja: no se te vuelve a cobrar.'
    : 'Diste de baja Brote+. No se te vuelve a cobrar; seguís con los beneficios hasta el final de lo pagado.';
  await marcar(codigo, 'resuelta', msg, { ejecutada: 'panel' });
  return { ok: true, mensaje: msg };
}

/** Dar de baja el plan de una tienda o empresa de esa cuenta. */
export async function panelBajaNegocio(codigo: string, negocioId: string): Promise<Hecho> {
  if (!(await esDueno())) return { ok: false, error: 'Sin acceso' };
  if (!configMp().cobrar) return { ok: false, error: ERRORES.no_configurado! };
  const d = await datosCobro(codigo);
  if (!d) return { ok: false, error: 'No encontramos el pedido.' };
  const r = await bajaNegocio(d, negocioId);
  if (!r.ok) return { ok: false, error: explicar(r.error) };
  const msg = r.yaEstaba ? 'El plan ya estaba dado de baja.' : 'Diste de baja el plan de tu negocio. No se te vuelve a cobrar.';
  await marcar(codigo, 'resuelta', msg, { ejecutada: 'panel', negocio: negocioId });
  return { ok: true, mensaje: msg };
}
