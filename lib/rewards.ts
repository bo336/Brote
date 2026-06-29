'use client';

import { useRewards } from '@/stores/rewards';
import { useSession } from '@/stores/session';
import { toast } from '@/stores/toast';
import { computeMundoState } from '@/lib/mundo';
import type { CompleteActivityResult } from '@/lib/types';

/**
 * Orchestrates the feedback for a completion (BUILD_SPEC §5.3, §6.2):
 * optimistic session/world update + point toast + queued celebration moments.
 */
export function celebrateCompletion(result: CompleteActivityResult) {
  const { applyCompletion, profile, setProfile } = useSession.getState();
  const { enqueue } = useRewards.getState();

  // Optimistic session + world update (server already persisted precise state).
  if (result.status !== 'pending') {
    applyCompletion({ totalXp: result.new_total, streak: result.streak });
    const p = useSession.getState().profile;
    if (p) {
      setProfile({
        ...p,
        mundoState: computeMundoState({
          totalXp: result.new_total,
          currentStreak: result.streak,
          domainPoints: p.mundoState?.dominantDomain
            ? { [p.mundoState.dominantDomain]: 1 }
            : undefined,
        }),
      });
    }
  }

  if (result.status === 'pending') {
    toast.show({ variant: 'default', glyph: '📸', title: 'Verificando tu foto…', durationMs: 3000 });
    return;
  }
  if (result.status === 'rejected') {
    toast.error('No pudimos verificarla', 'Probá con otra foto.');
    return;
  }

  // Points toast (base + session bonus shown together).
  const total = result.points_awarded + result.session_bonus;
  if (total > 0) toast.points(total);

  const events: Parameters<typeof enqueue>[0] = [];
  if (result.first_time) events.push({ kind: 'firstAction' });
  if (result.rank_up && result.new_rank_slug) events.push({ kind: 'rankUp', rankSlug: result.new_rank_slug });
  for (const tt of result.new_titles ?? []) events.push({ kind: 'title', name: tt.name_es, rarity: tt.rarity });
  for (const bb of result.new_badges ?? []) events.push({ kind: 'badge', name: bb.name_es, rarity: bb.rarity });
  if (result.daily_set_complete) events.push({ kind: 'sessionBonus', points: result.session_bonus || 200 });
  if (events.length) enqueue(events);
}
