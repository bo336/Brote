import { randomBytes } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { urlAutorizacion } from '@/lib/pagos/mercadopago';
import { RUTA_VUELTA, configMp, urlApp } from '@/lib/pagos/mp-servidor';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Paso 4 del alta: "Vincular Mercado Pago". Arranca el OAuth y manda a la
 * persona a Mercado Pago a autorizar a Brote.
 *
 * - Solo la DUEÑA de la tienda (se pregunta a la base con su sesión).
 * - El `state` es aleatorio y viaja en una cookie httpOnly, atado a la tienda:
 *   la vuelta lo compara, así nadie puede pegarle a otra persona una cuenta de
 *   Mercado Pago que no autorizó.
 */
export async function GET(request: NextRequest) {
  const destino = (motivo: string) =>
    NextResponse.redirect(new URL(`/negocio/alta?mp=error&motivo=${motivo}`, urlApp()));

  const negocio = request.nextUrl.searchParams.get('negocio') ?? '';
  if (!/^[0-9a-f-]{36}$/.test(negocio)) return destino('datos');

  const config = configMp();
  if (!config.vincular || !config.clientId) return destino('no_configurado');

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL(`/auth/login?next=/negocio/alta`, urlApp()));

  const { data: estado } = await supabase.rpc('vendedor_estado', { p_business: negocio });
  if ((estado as { rol?: string } | null)?.rol !== 'owner') return destino('solo_owner');

  const state = randomBytes(32).toString('hex');
  const r = NextResponse.redirect(
    urlAutorizacion({ clientId: config.clientId, redirectUri: `${urlApp()}${RUTA_VUELTA}`, state }),
  );
  r.cookies.set('brote_mp_estado', `${state}.${negocio}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/pagos/mercadopago/vincular',
    maxAge: 600,
  });
  return r;
}
