import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const CTX_COOKIE = 'brote_ctx';

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  // Sin sesión, `updateSession` ya mandó a `/auth/login?next=…`.
  if (response.headers.get('location')) return response;

  // Negocios (brote-negocios fase 1 §3.3). Solo redirects baratos: esto corre
  // en cada request, así que no consulta la base. Sin un negocio elegido en la
  // cookie no hay espacio de trabajo que abrir → al alta, que ofrece elegir uno
  // o crear. Que la cookie apunte a un negocio PROPIO, y que la cuenta sea
  // adulta, lo valida `app/(business)/layout.tsx` contra la base.
  const { pathname } = request.nextUrl;
  if (
    (pathname === '/negocio' || pathname.startsWith('/negocio/')) &&
    pathname !== '/negocio/alta' &&
    pathname !== '/negocio/contexto' &&
    !request.cookies.get(CTX_COOKIE)?.value.startsWith('biz:')
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/negocio/alta';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets, the manifest, icons, and
     * the service worker — so auth cookies refresh on every app navigation.
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons/|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)',
  ],
};
