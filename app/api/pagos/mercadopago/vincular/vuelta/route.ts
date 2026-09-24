import { timingSafeEqual } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { evaluarCuentaMp, partirEstado } from '@/lib/pagos/mercadopago';
import { RUTA_VUELTA, configMp, intercambiarCodigo, urlApp, usuarioMp } from '@/lib/pagos/mp-servidor';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * La vuelta de Mercado Pago. En orden, y cualquier falla corta:
 *
 * 1. El `state` de la URL es el de la cookie (y la cookie es de esta tienda).
 * 2. Hay sesión, y es la misma persona que empezó (lo vuelve a mirar la base).
 * 3. El código se cambia por un token de la cuenta de quien vende.
 * 4. Con ese token, `/users/me`: cuenta argentina, activa, con identidad.
 * 5. El vínculo lo escribe la base con la clave de servicio —ninguna cuenta
 *    puede "vincularse" sola— y el token se descarta.
 */
export async function GET(request: NextRequest) {
  const volver = (q: string) => {
    const r = NextResponse.redirect(new URL(`/negocio/alta?${q}`, urlApp()));
    r.cookies.set('brote_mp_estado', '', { path: '/api/pagos/mercadopago/vincular', maxAge: 0 });
    return r;
  };

  const p = request.nextUrl.searchParams;
  if (p.get('error')) return volver('mp=error&motivo=cancelado');

  const guardado = partirEstado(request.cookies.get('brote_mp_estado')?.value);
  const state = p.get('state') ?? '';
  const code = p.get('code') ?? '';
  if (!guardado || state.length !== guardado.state.length || !code) return volver('mp=error&motivo=vencido');
  if (!timingSafeEqual(Buffer.from(state), Buffer.from(guardado.state))) return volver('mp=error&motivo=vencido');

  const config = configMp();
  if (!config.vincular || !process.env.SUPABASE_SERVICE_ROLE_KEY) return volver('mp=error&motivo=no_configurado');

  const {
    data: { user },
  } = await createClient().auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/auth/login?next=/negocio/alta', urlApp()));

  const token = await intercambiarCodigo(code, `${urlApp()}${RUTA_VUELTA}`);
  if (!token) return volver('mp=error&motivo=autorizacion');

  const cuenta = evaluarCuentaMp(await usuarioMp(token.access_token));
  if (!cuenta.ok) return volver(`mp=error&motivo=${cuenta.motivo}`);

  const { data, error } = await createServiceClient().rpc('vendedor_mp_vincular', {
    p_business: guardado.negocio,
    p_user: user.id,
    p_mp_user_id: cuenta.id,
    p_nickname: cuenta.nickname,
    p_email: cuenta.email,
    p_datos: cuenta.datos,
  });
  const r = data as { ok?: boolean; error?: string } | null;
  if (error || !r?.ok) return volver(`mp=error&motivo=${r?.error ?? 'error'}`);
  return volver('mp=ok');
}
