import { NextResponse, type NextRequest } from 'next/server';
import { CTX_COOKIE } from '@/lib/negocio/catalogo';

/**
 * Limpia una cookie de contexto que apunta a un negocio ajeno o que ya no
 * existe (03 §3.2) y vuelve al alta, que ofrece elegir uno propio o crear.
 *
 * Existe porque durante el render de un layout las cookies son de solo
 * lectura. Solo sabe dejar el contexto en "personal": no hay forma de usar
 * este enlace para meter a alguien en un negocio.
 */
export function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = '/negocio/alta';
  url.search = '';
  const res = NextResponse.redirect(url);
  res.cookies.set(CTX_COOKIE, 'personal', {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
