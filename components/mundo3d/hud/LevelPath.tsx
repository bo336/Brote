'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Lock, MapPin } from 'lucide-react';

import { RANK_BY_TIER } from '@/lib/ranks';
import { MAX_TIER, unlocksFor } from '@/lib/world/progression';
import { cn } from '@/lib/utils/cn';

/**
 * Tu camino: the eleven levels of the island, and the worlds after them.
 *
 * The 2026-09-14 playtest asked for "different levels, infinite play" — and both
 * already existed, invisibly. The ladder is eleven ranks, each bringing a region
 * and the verbs to use it; the worlds cycle the island's biome forever, one every
 * few dozen real actions. Nothing in the game said so. **The player can always
 * see the future** (`08-WORLD-AND-PROGRESSION.md` §1): here it is, in the sheet
 * they already opened, never on the HUD (`16-UI-AUDIO-A11Y.md` §1).
 *
 * Counted up, never down, and never a nag: what a level brings is described, how
 * to reach it is one sentence, and nothing here tells anybody what they lack.
 */
export function LevelPath({
  tier,
  worldIndex,
  growth,
  goal,
}: {
  tier: number;
  worldIndex: number;
  /** Real actions into the current world, and how many it takes. */
  growth: number;
  goal: number;
}) {
  const t = useTranslations('mundo.bitacora');
  const tRegion = useTranslations('mundo.region');
  const tVerb = useTranslations('mundo.verb');

  const levels = useMemo(
    () => Array.from({ length: MAX_TIER }, (_, i) => {
      const u = unlocksFor(i + 1);
      return { tier: u.tier, rank: RANK_BY_TIER[u.tier]?.name_es ?? '', regions: u.regions, verbs: u.verbs };
    }),
    [],
  );
  const share = goal > 0 ? Math.min(1, growth / goal) : 0;

  return (
    <section className="mt-6" aria-label={t('pathTitle')}>
      <h3 className="text-h3 font-semibold text-brote-cream">{t('pathTitle')}</h3>
      <p className="mt-0.5 text-caption text-brote-cream/70">
        {t('pathLevel', { n: tier, max: MAX_TIER, rank: RANK_BY_TIER[tier]?.name_es ?? '' })}
      </p>

      <ol className="mt-3 space-y-1.5">
        {levels.map((level) => {
          const reached = level.tier <= tier;
          const current = level.tier === tier;
          const next = level.tier === tier + 1;
          const things = [
            ...level.regions.map((r) => tRegion(r)),
            ...level.verbs.filter((v) => v !== 'walk').map((v) => tVerb(v)),
          ];
          return (
            <li
              key={level.tier}
              className={cn(
                'flex items-start gap-3 rounded-2xl p-3',
                current ? 'bg-brote-green/20 ring-1 ring-brote-lime/40' : 'bg-brote-cream/[0.06]',
                !reached && !next && 'opacity-55',
              )}
            >
              <span
                className={cn(
                  'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-caption font-bold',
                  reached ? 'bg-brote-lime/25 text-brote-lime' : 'bg-brote-cream/10 text-brote-cream/60',
                )}
                aria-hidden
              >
                {current ? <MapPin className="h-3.5 w-3.5" /> : reached ? <Check className="h-3.5 w-3.5" /> : next ? level.tier : <Lock className="h-3 w-3" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className={cn('text-body font-semibold', reached || next ? 'text-brote-cream' : 'text-brote-cream/70')}>
                    {level.tier}. {level.rank}
                  </span>
                  {(current || next) && (
                    <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-brote-sun">
                      {current ? t('pathNow') : t('pathNext')}
                    </span>
                  )}
                </div>
                {things.length > 0 && (
                  <p className="mt-0.5 text-caption leading-relaxed text-brote-cream/70">{things.join(' · ')}</p>
                )}
                {next && <p className="mt-1 text-caption leading-relaxed text-brote-cream/55">{t('pathHow')}</p>}
              </div>
            </li>
          );
        })}
      </ol>

      {/* After the eleventh level the island does not stop: the worlds go on. */}
      <div className="mt-4 rounded-2xl bg-brote-cream/[0.06] p-3">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-body font-semibold text-brote-cream">{t('pathWorld', { n: worldIndex })}</span>
          <span className="tnum shrink-0 text-caption text-brote-cream/70">
            {t('pathWorldProgress', { growth: Math.min(growth, goal), goal })}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-brote-cream/10" aria-hidden>
          <div className="h-full rounded-full bg-brote-lime" style={{ width: `${Math.round(share * 100)}%` }} />
        </div>
        <p className="mt-2 text-caption leading-relaxed text-brote-cream/60">{t('pathWorldInfinite')}</p>
      </div>
    </section>
  );
}
