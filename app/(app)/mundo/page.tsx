import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { parseMundoState } from '@/lib/mundo';
import { MundoClient } from './MundoClient';

/**
 * `/mundo` — the world, on its own route.
 *
 * The single most important structural change in the rebuild: the game leaves
 * the feed. A live WebGL canvas must never run inside a scrolling card, and
 * there is exactly one `<WebGLRenderer>` in the app, mounted only here
 * (`07-RENDER-ARCHITECTURE.md` §1).
 *
 * Two guards: you must be signed in, and the feature flag must be on. It ships
 * off (`15-DATA-MODEL.md` §7) and is turned on for one account first.
 */
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: { perf?: string; mundoTier?: string };
}

/**
 * `app_settings` has RLS on with no read policy, so the flag is read through a
 * `security definer` function — the same shape as the Academia's
 * `ac_setting_bool`. A missing function or any error reads as OFF, which is the
 * safe default and the one that matches the flag's own description.
 */
async function mundoEnabled(supabase: ReturnType<typeof createClient>): Promise<boolean> {
  const { data, error } = await supabase.rpc('mundo_enabled');
  if (error) return false;
  return data === true;
}

function parseTier(raw: string | undefined): number | null {
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 && n <= 3 ? n : null;
}

export default async function MundoPage({ searchParams }: PageProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  if (!(await mundoEnabled(supabase))) redirect('/perfil');

  // One read, on the server. `mundo_state` is computed by Postgres and the world
  // only ever reads it (`15-DATA-MODEL.md` §1). Phase 4 replaces this with the
  // single `world_bootstrap()` round trip.
  const { data: profile } = await supabase
    .from('profiles')
    .select('mundo_state')
    .eq('id', user.id)
    .maybeSingle();
  const mundo = parseMundoState(profile?.mundo_state);

  return (
    <MundoClient
      perf={searchParams.perf === '1'}
      forcedTier={parseTier(searchParams.mundoTier)}
      userId={user.id}
      tier={mundo.rankTier}
      worldIndex={mundo.worldIndex}
      liveliness={mundo.liveliness}
    />
  );
}
