import { NextResponse, type NextRequest } from 'next/server';
import { createRouteClient, safeNext } from '@/lib/supabase/route';

export const dynamic = 'force-dynamic';

/**
 * Ingreso para el rastreador de AdSense (Mediapartners-Google).
 *
 * Casi todo Brote está detrás del login, y Google sólo muestra anuncios
 * acordes al contenido de las páginas que su rastreador puede leer. AdSense
 * deja cargarle un usuario: Cuenta → Acceso y autorización → Acceso del
 * rastreador, con esta URL, método POST y los parámetros `email` y `password`.
 *
 * Sólo funciona con la cuenta de `ADSENSE_CRAWLER_EMAIL` (una cuenta adulta
 * creada para eso, sin datos reales): no es otra puerta de ingreso para
 * cualquiera. Sin esa variable, responde 404.
 */
function habilitado(email: string): boolean {
  const permitido = (process.env.ADSENSE_CRAWLER_EMAIL ?? '').trim().toLowerCase();
  return !!permitido && email.trim().toLowerCase() === permitido;
}

export async function POST(request: NextRequest) {
  if (!process.env.ADSENSE_CRAWLER_EMAIL) return new NextResponse('Not found', { status: 404 });
  const form = await request.formData().catch(() => null);
  const email = String(form?.get('email') ?? '');
  const password = String(form?.get('password') ?? '');
  if (!habilitado(email) || !password) return new NextResponse('Forbidden', { status: 403 });

  const destino = new URL(safeNext(String(form?.get('next') ?? '/')), request.url);
  const response = NextResponse.redirect(destino, 303);
  const supabase = createRouteClient(request, response);
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) return new NextResponse('Forbidden', { status: 403 });
  return response;
}

export function GET() {
  if (!process.env.ADSENSE_CRAWLER_EMAIL) return new NextResponse('Not found', { status: 404 });
  return new NextResponse(
    '<!doctype html><meta charset="utf-8"><title>Brote</title><form method="post"><input name="email" type="email"><input name="password" type="password"><button>Entrar</button></form>',
    { headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex' } },
  );
}
