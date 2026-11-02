import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * El clic de un anuncio DIRECTO (0134): se cuenta y se redirige al sitio del
 * anunciante, con parámetros UTM para que vea de dónde llega la gente. El
 * destino nunca viaja al navegador antes del clic, y un anuncio pausado o que
 * no existe manda a Inicio.
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const inicio = new URL('/', request.url);
  if (!/^[0-9a-f-]{36}$/.test(params.id)) return NextResponse.redirect(inicio, 302);
  const { data } = await createClient().rpc('anuncio_clic', { p_id: params.id });
  if (typeof data !== 'string' || !/^https:\/\//.test(data)) return NextResponse.redirect(inicio, 302);
  const destino = new URL(data);
  const ubicacion = request.nextUrl.searchParams.get('u');
  if (!destino.searchParams.has('utm_source')) destino.searchParams.set('utm_source', 'brote');
  if (!destino.searchParams.has('utm_medium')) destino.searchParams.set('utm_medium', 'patrocinio');
  if (!destino.searchParams.has('utm_campaign')) destino.searchParams.set('utm_campaign', params.id.slice(0, 8));
  if (ubicacion && /^[a-z-]{2,30}$/.test(ubicacion) && !destino.searchParams.has('utm_content')) {
    destino.searchParams.set('utm_content', ubicacion);
  }
  return NextResponse.redirect(destino, 302);
}
