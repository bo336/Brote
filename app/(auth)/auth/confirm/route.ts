import { NextResponse, type NextRequest } from 'next/server';
import { type EmailOtpType } from '@supabase/supabase-js';
import { createRouteClient, safeNext } from '@/lib/supabase/route';

/**
 * Magic-link / email OTP verification (BUILD_SPEC §8.1).
 *
 * Supabase sends either `token_hash` + `type` (the modern link format) or, on
 * older templates, a `code` to exchange — both are handled so an email that
 * was generated before a template change still works.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const code = searchParams.get('code');
  const next = safeNext(searchParams.get('next'));

  const providerError = searchParams.get('error_description') ?? searchParams.get('error');
  if (providerError) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=provider&detail=${encodeURIComponent(providerError.slice(0, 200))}`,
    );
  }

  const response = NextResponse.redirect(`${origin}${next}`);
  const supabase = createRouteClient(request, response);

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) {
      return NextResponse.redirect(
        `${origin}/auth/login?error=link&detail=${encodeURIComponent(error.message.slice(0, 200))}`,
      );
    }
    return response;
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        `${origin}/auth/login?error=link&detail=${encodeURIComponent(error.message.slice(0, 200))}`,
      );
    }
    return response;
  }

  return NextResponse.redirect(`${origin}/auth/login?error=nolink`);
}
