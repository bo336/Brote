/**
 * Content-based "Para Vos" scorer (BUILD_SPEC §10.2).
 *
 * Always-on, zero-AI ranking of catalog activities for a user. Guarantees a
 * good feed before/without the cached Gemini layer (which, when present, is
 * blended on top). Pure + deterministic given its inputs.
 */
import type { ActivityRow } from '@/lib/supabase/rows';
import { meetsRank, RANK_BY_SLUG } from '@/lib/ranks';
import { getDomainName, type DomainSlug } from '@/lib/domains';

export interface ScoreContext {
  interests: string[];
  totalXp: number;
  /** domain slug -> points (under-explored domains get a variety boost). */
  domainPoints: Partial<Record<DomainSlug, number>>;
  /** activity ids the user has already completed (honor/verified). */
  completedIds: Set<string>;
}

export interface ScoredActivity {
  activity: ActivityRow;
  score: number;
  reason: string;
  locked: boolean;
}

const IMPACT_WEIGHT = { low: 1, medium: 2, high: 3 } as const;

/** Score one activity. Higher = better fit. */
function scoreOne(a: ActivityRow, ctx: ScoreContext): { score: number; reason: string; locked: boolean } {
  const locked = !meetsRank(ctx.totalXp, a.min_rank_slug);
  let score = 0;
  let reason = '';

  // Interest-domain match (strongest signal).
  if (ctx.interests.includes(a.domain_slug)) {
    score += 40;
    reason = `Porque te interesa ${getDomainName(a.domain_slug)}`;
  }

  // Domain variety: boost under-explored domains.
  const dp = ctx.domainPoints[a.domain_slug] ?? 0;
  if (dp < 500) score += 12;

  // Novelty: down-weight already completed (still shown, lower).
  if (ctx.completedIds.has(a.id)) score -= 30;
  else score += 8;

  // Impact weighting (impact honesty — real impact ranks higher).
  score += IMPACT_WEIGHT[a.impact] * 5;

  // Effort fit: surface easy wins + a few stretch goals; mildly favor easy/medium.
  if (a.effort === 'easy') score += 6;
  else if (a.effort === 'medium') score += 4;

  // Freshness: featured ("nuevas esta semana") gets a boost.
  if (a.is_featured) {
    score += 20;
    if (!reason) reason = 'Nueva esta semana';
  }

  // Rank-eligibility: keep eligible actions above locked ones.
  if (locked) score -= 50;

  // Reasons for the non-interest cases.
  if (!reason) {
    if (a.impact === 'high') reason = 'Alto impacto';
    else if (dp < 500) reason = 'Algo nuevo para explorar';
    else reason = 'Recomendado para vos';
  }

  // Small deterministic tiebreaker by sort_order so the feed is stable.
  score -= a.sort_order * 0.01;

  return { score, reason, locked };
}

export function scoreActivities(activities: ActivityRow[], ctx: ScoreContext): ScoredActivity[] {
  return activities
    .map((activity) => {
      const { score, reason, locked } = scoreOne(activity, ctx);
      return { activity, score, reason, locked };
    })
    .sort((a, b) => b.score - a.score);
}

/** Label for an activity's required rank (used by lock badges). */
export function lockLabel(minRankSlug: string): string {
  return RANK_BY_SLUG[minRankSlug]?.name_es ?? minRankSlug;
}
