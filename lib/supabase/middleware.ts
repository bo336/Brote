import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/** Routes that don't require authentication. */
const PUBLIC_PREFIXES = ['/auth', '/instalar', '/offline', '/_next', '/api/public'];

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

/**
 * Refreshes the Supabase session on every request and gates app routes
 * (BUILD_SPEC §8.1). Any redirect we issue MUST carry over the refreshed auth
 * cookies, otherwise the session never stabilizes and the app redirect-loops.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // IMPORTANT: getUser() (not getSession) revalidates the token server-side.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  /** Build a redirect that preserves any refreshed auth cookies from `response`. */
  const redirectTo = (path: string, search = ''): NextResponse => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = search;
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  if (!user && !isPublic(pathname)) {
    return redirectTo('/auth/login', `?next=${encodeURIComponent(pathname)}`);
  }

  if (user && pathname === '/auth/login') {
    return redirectTo('/');
  }

  return response;
}
