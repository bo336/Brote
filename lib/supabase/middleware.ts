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

  // Best-effort token refresh (rotates + writes fresh cookies). We deliberately
  // IGNORE its result for gating: it's a cross-region network call that can flake
  // on the free tier, and a transient failure must NOT log a valid user out.
  await supabase.auth.getUser().catch(() => undefined);

  // Gate on the LOCAL session (decoded from cookies, no network) so the auth
  // decision is reliable. Data is still protected by RLS on every query, which
  // validates the JWT server-side regardless.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const isAuthenticated = !!session;

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

  // Single auth gate: send signed-out users to login. We intentionally do NOT
  // bounce signed-in users away from /auth/login here — that bounce, combined
  // with a transient getUser() miss, is what produced the redirect loop. The
  // login page handles the "already signed in" case itself.
  if (!isAuthenticated && !isPublic(pathname)) {
    return redirectTo('/auth/login', `?next=${encodeURIComponent(pathname)}`);
  }

  return response;
}
