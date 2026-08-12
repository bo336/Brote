import { NextResponse, type NextRequest } from 'next/server';
import { createRouteClient, safeNext } from '@/lib/supabase/route';

/**
 * OAuth + PKCE callback: exchanges the `code` for a session (BUILD_SPEC §8.1).
 *
 * Every failure path now carries a reason back to the login screen. Silently
 * redirecting to /auth/login on failure is what made a broken sign-in look
 * like an unexplained infinite loop.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = safeNext(searchParams.get('next'));

  // Google/Supabase can hand back an error directly (user cancelled, provider
  // misconfigured, redirect URL not allow-listed…). Surface it verbatim.
  const providerError = searchParams.get('error_description') ?? searchParams.get('error');
  if (providerError) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=provider&detail=${encodeURIComponent(providerError.slice(0, 200))}`,
    );
  }

  if (!code) {
    // Reaching the callback with no code usually means Supabase redirected
    // here without completing the flow — almost always an allow-list problem.
    return NextResponse.redirect(`${origin}/auth/login?error=nocode`);
  }

  // Bind the client to THIS response so the session cookies it writes are
  // guaranteed to travel with the redirect.
  const response = NextResponse.redirect(`${origin}${next}`);
  const supabase = createRouteClient(request, response);

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=exchange&detail=${encodeURIComponent(error.message.slice(0, 200))}`,
    );
  }

  return response;
}
