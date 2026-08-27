import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/** Routes that don't require authentication. */
// `/legal` must be public: the terms and privacy policy are linked from the
// login screen and have to be readable BEFORE anyone accepts them.
// `/feed/p/` is public because a shared link has to open for the person you
// shared it with — and because the Open Graph card is fetched by a crawler
// that has no session at all. What a signed-out visitor actually gets is a
// preview built from `feed_post_og`, which returns nothing for a teen author,
// a private profile or a held post. The gate is in the RPC, not here.
const PUBLIC_PREFIXES = [
  '/auth',
  '/legal',
  '/instalar',
  '/offline',
  '/_next',
  '/api/public',
  '/feed/p/',
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

/**
 * Gates app routes on the Supabase session (BUILD_SPEC §8.1). Deliberately does
 * NOT call supabase.auth.getUser() here: Next.js automatically prefetches every
 * visible <Link>, so a single page mount fires several concurrent middleware
 * invocations. getUser() proactively refreshes the access token, and Supabase
 * rotates + invalidates the refresh token on use — concurrent invocations
 * racing to refresh the SAME refresh token trip reuse detection and can kill
 * the whole session seconds after a successful login. The browser Supabase
 * client already refreshes tokens itself (with its own internal lock) and
 * writes the refreshed cookies, so the middleware only needs a local,
 * network-free read of the current session.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // No-op: this middleware never refreshes tokens (see comment above),
          // so it never has cookies to write.
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const isAuthenticated = !!session;

  const { pathname } = request.nextUrl;

  // Single auth gate: send signed-out users to login. We intentionally do NOT
  // bounce signed-in users away from /auth/login here — the login page handles
  // the "already signed in" case itself.
  if (!isAuthenticated && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  // Layouts cannot read the pathname, and the app shell needs it to know when
  // it is rendering a public permalink for somebody with no session.
  const headers = new Headers(request.headers);
  headers.set('x-pathname', pathname);
  return NextResponse.next({ request: { headers } });
}
