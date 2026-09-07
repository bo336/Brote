'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

import { RANK_BY_TIER } from '@/lib/ranks';
import { formatWater } from '@/lib/impact';
import { scriptFor } from '@/lib/world/ceremony';
import { IMPACT_PROVENANCE } from '@/lib/world/config';
import type { ImpactTotals } from '@/lib/world/types';
import { cn } from '@/lib/utils/cn';
import { composeTierUpCard, shareCard, type ShareMeta } from '../share/ShareCard';
import { useSessionStore } from '../state/useSessionStore';

/**
 * The tier-up ceremony's cards.
 *
 * Beats 4, 5 and 6 (`08-WORLD-AND-PROGRESSION.md` §5): the rank name with one
 * Spanish line tying it to something the player actually did, the new verb
 * taught in one sentence, and the share card.
 *
 * **Nothing else is on this screen.** No upsell, no interstitial, no "next
 * goal", no streak nag (anti-pattern 10). The skip control is the only other
 * thing here, and it is deliberately quiet: it has to be findable without
 * competing with the thing it would skip.
 */
interface TierUpOverlayProps {
  /** The live WebGL canvas, for the "after" half of the card. */
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  totals: ImpactTotals;
  worldIndex: number;
  biomeName: string;
  growth: number;
  goal: number;
  streakDays?: number;
}

/** Where the site name on the card comes from. */
const SITE_LABEL = 'brote.app';

export function TierUpOverlay({
  canvasRef,
  totals,
  worldIndex,
  biomeName,
  growth,
  goal,
  streakDays,
}: TierUpOverlayProps) {
  const t = useTranslations('mundo.tierup');
  const tVerb = useTranslations('mundo.verb');
  const ceremony = useSessionStore((s) => s.ceremony);
  const reducedMotion = useSessionStore((s) => s.reducedMotion);
  const skipCeremony = useSessionStore((s) => s.skipCeremony);
  const nextCeremony = useSessionStore((s) => s.nextCeremony);
  const [sharing, setSharing] = useState(false);
  /** Read by the Escape handler, which must not re-bind on every beat. */
  const beatRef = useRef(ceremony.beat);
  beatRef.current = ceremony.beat;

  const request = ceremony.request;
  const script = useMemo(
    () => (request === null ? null : scriptFor(request, { reducedMotion })),
    [request, reducedMotion],
  );

  /**
   * The line, with its figure filled in.
   *
   * Two of the eleven carry a number, and both are `medido` — real litres and
   * real actions, straight from the impact aggregate. Nothing here is modelled,
   * so nothing here needs a range or an `estimado` badge; if that ever changes,
   * `IMPACT_PROVENANCE` is what says so and the badge has to come with it.
   */
  const line = useMemo(() => {
    if (!script) return '';
    // A world completing has no impact figure to cite: it counts actions, not
    // litres, and inventing one for symmetry would be exactly the kind of
    // decorative number `13-IMPACT-MIRROR.md` forbids.
    if (script.kind === 'world') return t('worldline', { n: script.tier });
    const key = script.lineKey as 't1';
    if (script.tier === 7) return t(key, { litros: formatWater(totals.water_l) });
    if (script.tier === 8) return t(key, { acciones: Math.max(0, Math.round(totals.actions ?? 0)) });
    return t(key);
  }, [script, t, totals]);

  const measured = script?.kind === 'tier' && (script.tier === 7 || script.tier === 8);

  const meta = useMemo<ShareMeta>(
    () => ({
      worldIndex,
      biomeName,
      growth,
      goal,
      streakDays,
      line,
      siteLabel: SITE_LABEL,
      beforeLabel: t('antes'),
      afterLabel: t('ahora'),
    }),
    [worldIndex, biomeName, growth, goal, streakDays, line, t],
  );

  const onShare = useCallback(
    async (format: 'portrait' | 'square') => {
      const canvas = canvasRef.current;
      if (!canvas || sharing) return;
      setSharing(true);
      try {
        const blob = await composeTierUpCard(canvas, ceremony.before, meta, format);
        if (blob) await shareCard(blob, `brote-${script?.kind ?? ''}-${script?.tier ?? ''}.png`);
      } finally {
        setSharing(false);
      }
    },
    [canvasRef, ceremony.before, meta, script, sharing],
  );

  // Escape skips, the same as the button. A ceremony that cannot be dismissed
  // from a keyboard is a ceremony that traps somebody.
  useEffect(() => {
    if (request === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (beatRef.current === 'share' || beatRef.current === 'return') nextCeremony();
      else skipCeremony();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [request, skipCeremony, nextCeremony]);

  if (!script || request === null) return null;
  const rank = RANK_BY_TIER[script.tier];
  const beat = ceremony.beat;
  const heading = script.kind === 'world' ? t('worldtitle', { n: script.tier }) : t('title', { rank: rank?.name_es ?? '' });

  return (
    <div
      className="pointer-events-none absolute inset-0 flex flex-col justify-end p-6"
      role="status"
      aria-live="polite"
    >
      {/* Skip. Present from the first frame and never in the way — one tap
          jumps to the end, and the card is still made (§5). */}
      {beat !== 'share' && beat !== 'return' && (
        <button
          type="button"
          onClick={skipCeremony}
          className="pointer-events-auto absolute right-4 top-4 rounded-pill bg-brote-ink/60 px-4 py-2 text-caption font-semibold text-brote-cream"
        >
          {t('skip')}
        </button>
      )}

      {beat === 'title' && (
        <Card>
          {/* The one allowed gradient in the game, on the one word it is for. */}
          <h2 className="bg-gradient-to-r from-brote-green to-brote-lime bg-clip-text text-display text-transparent">
            {heading}
          </h2>
          <p className="mt-2 text-body text-brote-cream">{line}</p>
          {measured && (
            <span className="mt-3 inline-block rounded-pill bg-brote-green/20 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brote-lime">
              {IMPACT_PROVENANCE.water}
            </span>
          )}
        </Card>
      )}

      {beat === 'verb' && script.verbs[0] && (
        <Card>
          <p className="text-h2 text-brote-cream">
            {t('newverb', { verbo: tVerb(script.verbs[0]) })}
          </p>
        </Card>
      )}

      {(beat === 'share' || beat === 'return') && (
        <Card>
          <div className="flex flex-wrap gap-3">
            {/* Dismissing is beat 7. It is a real button rather than a timeout
                because the card is the one thing the player might want to act
                on, and nothing else is competing for this screen. */}
            <button
              type="button"
              onClick={() => onShare('portrait')}
              disabled={sharing}
              className={cn(
                'pointer-events-auto rounded-pill bg-brote-green px-5 py-3 text-body font-semibold text-white',
                sharing && 'opacity-60',
              )}
            >
              {t('share')}
            </button>
            <button
              type="button"
              onClick={() => onShare('square')}
              disabled={sharing}
              className="pointer-events-auto rounded-pill bg-brote-cream/95 px-5 py-3 text-body font-semibold text-brote-ink"
            >
              {t('square')}
            </button>
            <button
              type="button"
              onClick={nextCeremony}
              className="pointer-events-auto rounded-pill px-5 py-3 text-body font-semibold text-brote-cream underline"
            >
              {t('volver')}
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}

/** One card, one message. The ceremony never stacks two. */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-none mx-auto w-full max-w-md rounded-2xl bg-brote-ink/80 p-5 backdrop-blur-sm">
      {children}
    </div>
  );
}
