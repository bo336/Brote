import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { parseWorldPayload } from '@/lib/world/payload';
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

  // **One round trip.** `world_bootstrap()` creates the row on a first visit and
  // returns the ladder, the island, the placements, the bitácora, the balance
  // and today's counters together (`15-DATA-MODEL.md` §2). During play there are
  // no further Supabase calls except the debounced autosave and the interaction
  // RPCs — a WebGL frame budget has no room for a waterfall of queries.
  const { data, error } = await supabase.rpc('world_bootstrap');

  // A failed bootstrap is not a broken page. The parser fills every field, so
  // the player still gets their tier-1 island and can walk around it; what they
  // lose is their placements, which the autosave must therefore never treat an
  // empty list as authoritative for. `MundoClient` is told, so the HUD can say
  // so rather than silently pretending the island is new.
  const payload = parseWorldPayload(data, user.id);

  return (
    <MundoClient
      perf={searchParams.perf === '1'}
      forcedTier={parseTier(searchParams.mundoTier)}
      payload={payload}
      degraded={!!error}
    />
  );
}
