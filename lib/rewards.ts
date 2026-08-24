'use client';

import { useRewards } from '@/stores/rewards';
import { useSession } from '@/stores/session';
import { toast } from '@/stores/toast';
import { computeMundoState } from '@/lib/mundo';
import { completionImpactLine, parseImpact } from '@/lib/impact';
import { localDate } from '@/lib/utils/dates';
import type { CompleteActivityResult } from '@/lib/types';

/**
 * Orchestrates the feedback for a completion (BUILD_SPEC §5.3, §6.2):
 * optimistic session/world update + point toast + queued celebration moments.
 */
export function celebrateCompletion(result: CompleteActivityResult) {
  const { applyCompletion, profile, setProfile } = useSession.getState();
  const { enqueue } = useRewards.getState();

  // Session + world update — prefer the authoritative server-computed mundo
  // (returned by complete_activity); fall back to a local recompute.
  if (result.status !== 'pending') {
    // A completion always keeps today's streak, so stamp it locally too.
    applyCompletion({ totalXp: result.new_total, streak: result.streak, streakDate: localDate() });
    const p = useSession.getState().profile;
    if (p) {
      setProfile({
        ...p,
        completionsCount: result.completions_count ?? p.completionsCount,
        // El saldo vuelve del servidor con la acción; sin esto la tienda y el
        // perfil mostrarían un número viejo hasta recargar la página.
        semillas: result.semillas_balance ?? p.semillas,
        mundoState:
          result.mundo ??
          computeMundoState({
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

  // Real impact of this single action — the "why it matters" beat (F12.2).
  const impactLine = result.impact ? completionImpactLine(parseImpact(result.impact)) : null;
  if (impactLine) {
    toast.show({ variant: 'default', glyph: '🌍', title: 'Impacto real', description: impactLine, durationMs: 4000 });
  }

  // Habit streak milestones (F12.6).
  if (result.habit?.streak) {
    const h = result.habit;
    if (h.bonus > 0) {
      toast.show({
        variant: 'default',
        glyph: '🔁',
        title: `¡Hábito de ${h.streak} días!`,
        description: `+${h.bonus} pts por sostener la rutina`,
      });
    }
  }

  const events: Parameters<typeof enqueue>[0] = [];
  // World completion leads the queue — it's the flagship moment.
  if (result.world_completed) {
    events.push({
      kind: 'worldComplete',
      completedIndex: result.world_completed.completed_index,
      newIndex: result.world_completed.new_index,
    });
  }
  if (result.first_time) events.push({ kind: 'firstAction' });
  if (result.rank_up && result.new_rank_slug) events.push({ kind: 'rankUp', rankSlug: result.new_rank_slug });
  for (const tt of result.new_titles ?? []) events.push({ kind: 'title', name: tt.name_es, rarity: tt.rarity });
  for (const bb of result.new_badges ?? []) events.push({ kind: 'badge', name: bb.name_es, rarity: bb.rarity });
  if (result.daily_set_complete) events.push({ kind: 'sessionBonus', points: result.session_bonus || 200 });
  if (events.length) enqueue(events);

  // Challenge completions (rewarded server-side) get their own celebration.
  for (const ch of result.challenges_completed ?? []) {
    toast.show({
      variant: 'default',
      glyph: '🏆',
      title: '¡Reto completado!',
      description: `${ch.title_es} · +${ch.reward_points} pts`,
    });
  }

  // Semillas (F11.2). Un solo aviso por acción aunque hayan entrado por varios
  // lados a la vez — el detalle de cada movimiento está en la tienda.
  const semillas = result.semillas_earned ?? 0;
  if (semillas > 0) {
    toast.show({
      variant: 'default',
      glyph: '🌱',
      title: `+${semillas} semillas`,
      description: 'Gastalas en la tienda',
      durationMs: 3600,
    });
  }
}
