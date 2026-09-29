import { notFound, redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { parseVisitPayload } from '@/lib/world/visit';
import { VisitClient } from './VisitClient';
import { MundoCerrado } from '../../MundoCerrado';

/**
 * `/mundo/visitar/<username>` — somebody else's island, rendered here.
 *
 * `18-DECISIONS.md` D8: the island arrives as JSON and **the visitor's own
 * client draws it**. There is no second renderer, no server authority to argue
 * with, and no real-time anything. It is the same world code with a different
 * seed and every write turned off.
 *
 * `world_visit` wraps `world_snapshot_for`, so the three ways to be invisible —
 * a block, a mute, a private profile — are decided in one place and all three
 * answer the same thing: not found. Telling somebody they have been blocked is
 * telling them something that is not theirs to know.
 */
export const dynamic = 'force-dynamic';

interface PageProps {
  params: { username: string };
  searchParams: { perf?: string };
}

async function mundoEnabled(supabase: ReturnType<typeof createClient>): Promise<boolean> {
  const { data, error } = await supabase.rpc('mundo_enabled');
  if (error) return false;
  return data === true;
}

export default async function VisitPage({ params, searchParams }: PageProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');
  if (!(await mundoEnabled(supabase))) return <MundoCerrado />;

  const username = decodeURIComponent(params.username);
  // Their island, and the visitor's own Pip — a visit where you arrive as
  // somebody else's default blob is a visit you are not in.
  const [{ data, error }, mine, gifts, streak] = await Promise.all([
    supabase.rpc('world_visit', { p_username: username }),
    supabase.from('profiles').select('pip_style').eq('id', user.id).maybeSingle(),
    // What of yours they do not have yet. Worked out in Postgres so their
    // inventory never leaves it (`11-GAME-LOOP.md` §8).
    supabase.rpc('world_gift_options', { p_username: username }),
    // "Los dos, hoy" — derived from real completions, never stored, and never
    // a ranking (`11-GAME-LOOP.md` §8).
    supabase.rpc('world_friend_streak', { p_username: username }),
  ]);
  const visit = parseVisitPayload(error ? null : data, username);
  // `no_world` is somebody who has never opened `/mundo`. There is nothing to
  // walk around, and inventing a default island for them would be showing a
  // visitor a place that does not exist.
  if (!visit.ok) notFound();

  return (
    <VisitClient
      visit={visit}
      myPip={(mine.data?.pip_style as Record<string, unknown> | null) ?? null}
      gifts={gifts.error ? null : gifts.data}
      streak={streak.error ? null : streak.data}
      perf={searchParams.perf === '1'}
    />
  );
}
