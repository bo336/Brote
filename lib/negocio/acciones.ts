'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { CTX_COOKIE } from '@/lib/negocio/catalogo';
import { esquemaPaso1, payloadDePaso } from '@/lib/negocio/esquemas';
import type { MiNegocio, VerificationMethod } from '@/lib/supabase/rows-negocio';

/**
 * Server actions del lado empresa.
 *
 * Devuelven `{ ok, error }` con un CÓDIGO de error, nunca texto de la base: la
 * interfaz lo traduce con `negocio.errores.*`. Ninguna confía en la cookie de
 * contexto: cada RPC vuelve a validar membresía y rol en Postgres.
 */

export type Resultado<T = object> = ({ ok: true } & T) | { ok: false; error: string; campo?: string };

const UN_ANIO = 60 * 60 * 24 * 365;

function escribirContexto(valor: string) {
  cookies().set(CTX_COOKIE, valor, {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    // El cliente la lee para pintar el selector (03 §3.1).
    httpOnly: false,
    maxAge: UN_ANIO,
  });
}

/** Los códigos que las RPC levantan a propósito; cualquier otro es genérico. */
const CODIGOS = new Set([
  'no_autenticado',
  'solo_adultos',
  'onboarding_pendiente',
  'email_sin_confirmar',
  'cuenta_nueva',
  'datos_invalidos',
  'limite_negocios',
]);

function codigoDe(mensaje: string | undefined): string {
  const m = (mensaje ?? '').trim();
  return CODIGOS.has(m) ? m : 'error';
}

/**
 * Cambia el contexto. Con `personal` siempre se puede; con un negocio, solo si
 * la persona es miembro — si no, la cookie no se toca. El que llama hace
 * `router.refresh()` o navega (nunca `window.location`, 03 §3.4).
 */
export async function setActiveContext(ctx: 'personal' | string): Promise<Resultado> {
  if (ctx === 'personal') {
    escribirContexto('personal');
    return { ok: true };
  }
  const { data, error } = await createClient().rpc('my_businesses');
  if (error) return { ok: false, error: 'error' };
  if (!((data ?? []) as MiNegocio[]).some((n) => n.id === ctx)) return { ok: false, error: 'sin_permiso' };
  escribirContexto(`biz:${ctx}`);
  return { ok: true };
}

/**
 * Paso 1 del alta de un negocio NUEVO: lo crea en borrador (la persona queda
 * como owner), guarda lo que `create_business` no recibe, y lo deja activo.
 */
export async function crearNegocio(
  valores: unknown,
): Promise<Resultado<{ id: string; aviso?: string; campo?: string }>> {
  const r = esquemaPaso1.safeParse(valores);
  if (!r.success) return { ok: false, error: 'datos_invalidos', campo: String(r.error.issues[0]?.path[0] ?? '') };

  const supabase = createClient();
  const { data, error } = await supabase.rpc('create_business', {
    p_nombre: r.data.nombre_comercial,
    p_rubro: r.data.rubro,
    p_tamano: r.data.tamano,
    p_provincia: r.data.provincia,
    p_ciudad: r.data.ciudad || null,
  });
  if (error || !data) return { ok: false, error: codigoDe(error?.message) };
  const id = data as string;

  // Activo ya mismo: si lo que sigue falla, el borrador existe y un reintento
  // tiene que editarlo, no crear un segundo negocio.
  escribirContexto(`biz:${id}`);

  const resto = payloadDePaso(1, r.data);
  if (resto) {
    const { data: g } = await supabase.rpc('negocio_guardar_alta', { p_business: id, p_datos: resto, p_paso: 2 });
    const res = g as { ok: boolean; error?: string; campo?: string } | null;
    if (!res?.ok) return { ok: true, id, aviso: res?.error ?? 'error', campo: res?.campo };
  }

  return { ok: true, id };
}

/** Guarda un paso ya existente (autoguardado al cambiar de paso). */
export async function guardarPasoAlta(
  negocioId: string,
  paso: 1 | 2 | 3 | 4,
  valores: unknown,
): Promise<Resultado> {
  const payload = payloadDePaso(paso, valores);
  if (!payload) return { ok: false, error: 'datos_invalidos' };
  const { data, error } = await createClient().rpc('negocio_guardar_alta', {
    p_business: negocioId,
    p_datos: payload,
    p_paso: Math.min(5, paso + 1),
  });
  if (error) return { ok: false, error: 'error' };
  const res = data as { ok: boolean; error?: string; campo?: string };
  return res.ok ? { ok: true } : { ok: false, error: res.error ?? 'error', campo: res.campo };
}

/** Envía la solicitud (o la reenvía después de "pedir más datos"). */
export async function enviarSolicitud(negocioId: string): Promise<Resultado<{ faltan?: string[] }>> {
  const { data, error } = await createClient().rpc('negocio_enviar', { p_business: negocioId });
  if (error) return { ok: false, error: 'error' };
  const res = data as { ok: boolean; error?: string; faltan?: string[] };
  if (res.ok) return { ok: true };
  return { ok: false, error: res.error === 'incompleta' ? `incompleta:${(res.faltan ?? []).join(',')}` : res.error ?? 'error' };
}

/** Crea o reutiliza la fila de un método y devuelve el token y el destino. */
export async function prepararVerificacion(
  negocioId: string,
  metodo: VerificationMethod,
): Promise<Resultado<{ token: string; target: string }>> {
  const { data, error } = await createClient().rpc('negocio_verificacion_preparar', {
    p_business: negocioId,
    p_method: metodo,
  });
  if (error) return { ok: false, error: 'error' };
  const res = data as { ok: boolean; error?: string; token?: string; target?: string };
  if (!res.ok || !res.token || !res.target) return { ok: false, error: res.error ?? 'error' };
  return { ok: true, token: res.token, target: res.target };
}

/** Registra la captura de Instagram ya subida a `business-evidence`. */
export async function registrarCaptura(negocioId: string, ruta: string): Promise<Resultado> {
  const { data, error } = await createClient().rpc('negocio_verificacion_captura', {
    p_business: negocioId,
    p_path: ruta,
  });
  if (error) return { ok: false, error: 'error' };
  const res = data as { ok: boolean; error?: string };
  return res.ok ? { ok: true } : { ok: false, error: res.error ?? 'error' };
}

/**
 * Deja registrado que esta persona aceptó los términos para empresas, con la
 * versión vigente (08 §10). Sin esta fila, la base no deja mandar la empresa a
 * revisión: la casilla de la pantalla es la cortesía, el trigger es la regla.
 */
export async function aceptarTerminos(negocioId: string): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await createClient().rpc('negocio_aceptar_terminos', { p_business: negocioId });
  if (error) return { ok: false, error: 'error' };
  const r = data as { ok?: boolean; error?: string } | null;
  return r?.ok ? { ok: true } : { ok: false, error: r?.error ?? 'error' };
}
