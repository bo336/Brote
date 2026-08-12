import 'server-only';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Supabase client for auth Route Handlers, bound to a concrete response.
 *
 * WHY THIS EXISTS: the generic server client writes cookies through
 * `cookies()` from `next/headers` and swallows failures in a try/catch. That
 * is fine in Server Actions, but in a Route Handler that returns its own
 * `NextResponse.redirect(...)`, a failed or dropped cookie write is invisible
 * — the session silently never persists, the user is bounced back to the
 * login screen, and it looks like an infinite login loop with no error.
 *
 * Here we set the session cookies DIRECTLY on the response we are about to
 * return, so persistence does not depend on framework-level merging.
 */
export function createRouteClient(request: NextRequest, response: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );
}

/**
 * Sanitise the post-login destination. Only same-site paths are allowed, so a
 * crafted `?next=https://evil.example` can never turn our own callback into an
 * open redirect.
 */
export function safeNext(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return '/';
  return next;
}
