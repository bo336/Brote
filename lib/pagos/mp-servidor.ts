import 'server-only';

import { headers } from 'next/headers';
import { MP_API, type UsuarioMp } from '@/lib/pagos/mercadopago';

/**
 * Las llamadas a Mercado Pago que hace el servidor de Brote, sin SDK. Todo lo
 * secreto vive en variables de entorno de Vercel y nunca sale de acá:
 *
 *   MP_ACCESS_TOKEN   el token de la cuenta de Brote (crea y cambia suscripciones)
 *   MP_CLIENT_ID      el número de la aplicación (vincular cuentas)
 *   MP_CLIENT_SECRET  su secreto (cambiar el código de autorización por un token)
 *   MP_WEBHOOK_SECRET el de la firma del webhook
 */

export interface ConfigMp {
  accessToken: string | null;
  clientId: string | null;
  clientSecret: string | null;
  /** Se puede vincular una cuenta (OAuth). */
  vincular: boolean;
  /** Se puede crear una suscripción. */
  cobrar: boolean;
}

export function configMp(): ConfigMp {
  const accessToken = process.env.MP_ACCESS_TOKEN || null;
  const clientId = process.env.MP_CLIENT_ID || null;
  const clientSecret = process.env.MP_CLIENT_SECRET || null;
  return {
    accessToken,
    clientId,
    clientSecret,
    vincular: !!(clientId && clientSecret),
    cobrar: !!(accessToken && process.env.SUPABASE_SERVICE_ROLE_KEY),
  };
}

/** La URL pública de la app: la variable si está, si no, la del pedido. */
export function urlApp(): string {
  const env = process.env.NEXT_PUBLIC_APP_URL;
  if (env && /^https?:\/\//.test(env)) return env.replace(/\/+$/, '');
  const h = headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

export const RUTA_VUELTA = '/api/pagos/mercadopago/vincular/vuelta';

async function json<T>(r: Response): Promise<T | null> {
  try {
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

/** El código de autorización, cambiado por un token de la cuenta de quien vende. */
export async function intercambiarCodigo(code: string, redirectUri: string): Promise<{ access_token: string } | null> {
  const c = configMp();
  if (!c.clientId || !c.clientSecret) return null;
  const r = await fetch(`${MP_API}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: c.clientId,
      client_secret: c.clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
    cache: 'no-store',
  });
  if (!r.ok) return null;
  const d = await json<{ access_token?: string }>(r);
  return d?.access_token ? { access_token: d.access_token } : null;
}

/**
 * Quién es la cuenta. El token de quien vende se usa para ESTA consulta y se
 * descarta: Brote no guarda credenciales de nadie.
 */
export async function usuarioMp(accessToken: string): Promise<UsuarioMp | null> {
  const r = await fetch(`${MP_API}/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!r.ok) return null;
  return json<UsuarioMp>(r);
}

export interface Preapproval {
  id: string;
  init_point: string;
}

/** Una suscripción nueva, pendiente hasta que la persona la autoriza en Mercado Pago. */
export async function crearPreapproval(cuerpo: Record<string, unknown>): Promise<{ ok: true; data: Preapproval & Record<string, unknown> } | { ok: false; error: string }> {
  const token = configMp().accessToken;
  if (!token) return { ok: false, error: 'no_configurado' };
  const r = await fetch(`${MP_API}/preapproval`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(cuerpo),
    cache: 'no-store',
  });
  const d = await json<Record<string, unknown>>(r);
  if (!r.ok || !d?.id) return { ok: false, error: 'mp_error' };
  const init = (d.init_point ?? d.sandbox_init_point) as string | undefined;
  if (!init) return { ok: false, error: 'mp_error' };
  return { ok: true, data: { ...d, id: String(d.id), init_point: init } };
}

/** Cambia una suscripción: darla de baja o ajustar el monto del mes siguiente. */
export async function cambiarPreapproval(id: string, cuerpo: Record<string, unknown>): Promise<boolean> {
  const token = configMp().accessToken;
  if (!token) return false;
  const r = await fetch(`${MP_API}/preapproval/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(cuerpo),
    cache: 'no-store',
  });
  return r.ok;
}
