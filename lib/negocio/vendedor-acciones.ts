'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { CTX_COOKIE } from '@/lib/negocio/catalogo';
import { normalizarInstagram, normalizarSitio } from '@/lib/negocio/normalizar';
import { normalizarWhatsappAR, type EstadoPrueba, type EstadoVendedor, type RespuestaPrueba } from '@/lib/negocio/vendedor';
import { configMp, crearPreapproval, cambiarPreapproval, urlApp } from '@/lib/pagos/mp-servidor';

/**
 * Las acciones del alta de vendedores (Mercado v2, 0114). Cada una termina en
 * una RPC que vuelve a validar todo: acá se normaliza lo que la gente escribe
 * y se habla con Mercado Pago, nada más.
 */

export type Resultado<T = object> = ({ ok: true } & T) | { ok: false; error: string; campo?: string; termino?: string; falta?: string[] };

type Rpc = { ok?: boolean; error?: string; campo?: string; termino?: string; falta?: string[] } & Record<string, unknown>;

function r(data: unknown, error: { message: string } | null): Rpc {
  if (error) return { ok: false, error: 'error' };
  return (data ?? { ok: false, error: 'error' }) as Rpc;
}

function fallo(x: Rpc): { ok: false; error: string; campo?: string; termino?: string; falta?: string[] } {
  return {
    ok: false,
    error: x.error ?? 'error',
    ...(x.campo ? { campo: x.campo } : {}),
    ...(x.termino ? { termino: x.termino } : {}),
    ...(x.falta ? { falta: x.falta } : {}),
  };
}

export async function getEstadoVendedor(negocioId: string): Promise<EstadoVendedor | null> {
  const { data, error } = await createClient().rpc('vendedor_estado', { p_business: negocioId });
  if (error) return null;
  return (data ?? null) as EstadoVendedor | null;
}

/** Crea la tienda con su nombre y la deja activa en el selector de contexto. */
export async function crearTienda(nombre: string): Promise<Resultado<{ id: string }>> {
  const { data, error } = await createClient().rpc('vendedor_crear', { p_nombre: nombre.trim() });
  const x = r(data, error);
  if (!x.ok) return fallo(x);
  cookies().set(CTX_COOKIE, `biz:${String(x.id)}`, {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
  });
  return { ok: true, id: String(x.id) };
}

export interface DatosTienda {
  nombre_comercial?: string;
  tipo_vendedor?: 'persona' | 'empresa';
  categoria_principal?: string;
  provincia?: string;
  ciudad?: string;
  descripcion?: string;
  whatsapp?: string;
  sitio_web?: string;
  instagram?: string;
  contacto_preferido?: 'whatsapp' | 'web' | 'instagram' | null;
  cuit?: string;
  razon_social?: string;
  logo_url?: string | null;
}

/**
 * Normaliza lo que la gente escribe de verdad ("11 2233-4455", "@tienda",
 * "mitienda.com.ar/contacto") y lo guarda. Un campo que no se puede entender
 * vuelve con su nombre, para marcarlo en el formulario.
 */
export async function guardarTienda(negocioId: string, d: DatosTienda): Promise<Resultado> {
  const datos: Record<string, unknown> = { ...d };
  if (typeof d.whatsapp === 'string') {
    if (d.whatsapp.trim() === '') datos.whatsapp = '';
    else {
      const w = normalizarWhatsappAR(d.whatsapp);
      if (!w) return { ok: false, error: 'campo_invalido', campo: 'whatsapp' };
      datos.whatsapp = w;
    }
  }
  if (typeof d.instagram === 'string') {
    if (d.instagram.trim() === '') datos.instagram = '';
    else {
      const i = normalizarInstagram(d.instagram);
      if (!i) return { ok: false, error: 'campo_invalido', campo: 'instagram' };
      datos.instagram = i;
    }
  }
  if (typeof d.sitio_web === 'string') {
    if (d.sitio_web.trim() === '') datos.sitio_web = '';
    else {
      const s = normalizarSitio(d.sitio_web);
      if (!s) return { ok: false, error: 'campo_invalido', campo: 'sitio_web' };
      datos.sitio_web = s;
    }
  }
  const { data, error } = await createClient().rpc('vendedor_guardar', { p_business: negocioId, p_datos: datos });
  const x = r(data, error);
  if (!x.ok) return fallo(x);
  revalidatePath('/negocio', 'layout');
  return { ok: true };
}

export async function guardarCompromisos(
  negocioId: string,
  practicas: string[],
  fotoPractica: string | null,
  fotoPath: string | null,
): Promise<Resultado> {
  const { data, error } = await createClient().rpc('vendedor_compromisos', {
    p_business: negocioId,
    p_practicas: practicas,
    p_foto_practica: fotoPractica,
    p_foto_path: fotoPath,
  });
  const x = r(data, error);
  if (!x.ok) return fallo(x);
  revalidatePath('/negocio', 'layout');
  return { ok: true };
}

export async function empezarPrueba(negocioId: string): Promise<EstadoPrueba> {
  const { data, error } = await createClient().rpc('vendedor_prueba_empezar', { p_business: negocioId });
  if (error) return { ok: false, error: 'error', aprobada: false };
  return data as EstadoPrueba;
}

export async function responderPrueba(intentoId: string, preguntaId: string, opcionId: string): Promise<RespuestaPrueba | { ok: false; error: string }> {
  const { data, error } = await createClient().rpc('vendedor_prueba_responder', {
    p_intento: intentoId,
    p_pregunta: preguntaId,
    p_opcion: opcionId,
  });
  if (error) return { ok: false, error: 'error' };
  const x = data as RespuestaPrueba;
  if (x.estado === 'aprobada') revalidatePath('/negocio', 'layout');
  return x;
}

export async function aceptarTerminosVendedor(negocioId: string): Promise<Resultado> {
  const { data, error } = await createClient().rpc('negocio_aceptar_terminos', { p_business: negocioId });
  const x = r(data, error);
  return x.ok ? { ok: true } : fallo(x);
}

/** Con el cobro apagado, abrir la tienda no pasa por Mercado Pago. */
export async function abrirTienda(negocioId: string): Promise<Resultado> {
  const { data, error } = await createClient().rpc('vendedor_abrir', { p_business: negocioId });
  const x = r(data, error);
  if (!x.ok) return fallo(x);
  revalidatePath('/negocio', 'layout');
  return { ok: true };
}

export async function desvincularMp(negocioId: string): Promise<Resultado> {
  const { data, error } = await createClient().rpc('vendedor_mp_desvincular', { p_business: negocioId });
  const x = r(data, error);
  if (!x.ok) return fallo(x);
  revalidatePath('/negocio', 'layout');
  return { ok: true };
}

/**
 * La suscripción: USD 5 por mes, cobrados en pesos al dólar oficial del día.
 *
 * El monto lo calcula la base (`negocio_plan_cotizar`), nunca el cliente, y el
 * cobro va a la cuenta de Mercado Pago que se vinculó (su correo es el
 * `payer_email`). Queda anotada como pendiente ANTES de mandar a la persona a
 * pagar, así el webhook la encuentra aunque el aviso llegue en un segundo.
 */
export async function suscribirVendedor(negocioId: string): Promise<Resultado<{ init_point: string }>> {
  const config = configMp();
  if (!config.cobrar) return { ok: false, error: 'no_configurado' };

  const { data: cot, error: errCot } = await createClient().rpc('negocio_plan_cotizar', { p_business: negocioId, p_plan: 'vendedor' });
  const c = r(cot, errCot) as Rpc & { monto?: number; razon?: string; payer_email?: string };
  if (!c.ok) return fallo(c);
  if (!c.monto || !c.payer_email) return { ok: false, error: 'alta_incompleta' };

  const app = urlApp();
  const mp = await crearPreapproval({
    reason: c.razon,
    external_reference: negocioId,
    payer_email: c.payer_email,
    back_url: `${app}/negocio/alta?mp=volvio`,
    auto_recurring: { frequency: 1, frequency_type: 'months', transaction_amount: c.monto, currency_id: 'ARS' },
    status: 'pending',
  });
  if (!mp.ok) return { ok: false, error: mp.error };

  const { error } = await createServiceClient().rpc('negocio_suscripcion_registrar', {
    p_business: negocioId,
    p_external_id: mp.data.id,
    p_plan: 'vendedor',
    p_monto: c.monto,
    p_moneda: 'ARS',
    p_raw: mp.data,
  });
  if (error) return { ok: false, error: 'error' };
  return { ok: true, init_point: mp.data.init_point };
}

/** Darse de baja. El webhook confirma el estado; acá solo se le pide a Mercado Pago. */
export async function cancelarSuscripcionVendedor(negocioId: string): Promise<Resultado> {
  const { data: ext, error } = await createClient().rpc('negocio_suscripcion_externa', { p_business: negocioId });
  if (error || !ext) return { ok: false, error: 'sin_suscripcion' };
  const ok = await cambiarPreapproval(String(ext), { status: 'cancelled' });
  if (!ok) return { ok: false, error: 'mp_error' };
  revalidatePath('/negocio/plan');
  return { ok: true };
}

/** Si Mercado Pago está configurado del lado del servidor (para decirlo en pantalla, no para decidir). */
export async function estadoConfigMp(): Promise<{ vincular: boolean; cobrar: boolean }> {
  const c = configMp();
  return { vincular: c.vincular, cobrar: c.cobrar };
}
