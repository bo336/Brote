'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import { formatWater } from '@/lib/impact';
import { buildMojon } from '@/lib/world/mojon';
import type { ImpactTotals } from '@/lib/world/types';
import { cn } from '@/lib/utils/cn';

/**
 * El Mojón — the panel on the stone marker between El Claro and La Pradera.
 *
 * **This is the only place in the world a number appears** (`13-IMPACT-MIRROR.md`
 * §3). Everything else the impact data does, it does by changing what the
 * island looks like: the river's width, how far you can see, the debris on the
 * beach, the lanterns at night. A figure floating over a meadow would undo all
 * of that.
 *
 * The content comes from `lib/world/mojon.ts` so the rules that matter —
 * provenance on every figure, a range on every estimate, no offsetting language
 * — are tested rather than reviewed. This file is the shape of it.
 */
interface MojonSheetProps {
  open: boolean;
  onClose: () => void;
  totals: ImpactTotals;
  tier: number;
  collectiveWaterL: number;
}

function Badge({ kind }: { kind: 'medido' | 'estimado' }) {
  const t = useTranslations('mundo.mojon');
  return (
    <span
      className={cn(
        'rounded-pill px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        // Measured and modelled do not look alike. Somebody skimming should be
        // able to tell them apart without reading the word.
        kind === 'medido'
          ? 'bg-brote-green/15 text-brote-greenDeep'
          : 'bg-surface-2 text-muted-foreground',
      )}
    >
      {t(kind)}
    </span>
  );
}

export function MojonSheet({ open, onClose, totals, tier, collectiveWaterL }: MojonSheetProps) {
  const t = useTranslations('mundo.mojon');
  const [showMethod, setShowMethod] = useState(false);

  const panel = useMemo(
    () => buildMojon(totals, { tier, collectiveWaterL, formatWater }),
    [totals, tier, collectiveWaterL],
  );

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-10 flex items-end bg-brote-ink/50" onClick={onClose}>
      <div
        className="max-h-[85%] w-full overflow-y-auto rounded-t-[24px] bg-background p-5 pb-10"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t('title')}
      >
        <h2 className="text-body font-semibold">{t('title')}</h2>

        {panel.rows.length === 0 ? (
          // Nothing logged yet is not an error and not an empty state to
          // apologise for. It is simply the first day.
          <p className="mt-3 text-small text-muted-foreground">{t('vacio')}</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {panel.rows.map((row) => (
              <li key={row.key} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span aria-hidden>{row.emoji}</span>
                    <span className="text-small">{row.label}</span>
                  </div>
                  {row.equivalence && (
                    <p className="mt-0.5 text-caption text-muted-foreground">{row.equivalence}</p>
                  )}
                  {row.range && (
                    <p className="mt-0.5 text-caption text-muted-foreground">
                      {t('rango', { min: row.range[0], max: row.range[1] })}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-body font-semibold tabular-nums" style={{ color: row.color }}>
                    {row.value}
                  </span>
                  <Badge kind={row.provenance} />
                </div>
              </li>
            ))}
          </ul>
        )}

        {panel.born.length > 0 && (
          <p className="mt-4 text-small">{t('deesto', { lista: panel.born.join(', ') })}</p>
        )}

        {/* Collective framing, not individual guilt. The number is a real
            server-side aggregate, not this player's figure scaled up. */}
        {panel.collective && (
          <p className="mt-1 text-small text-muted-foreground">
            {t('juntos', { total: panel.collective })}
          </p>
        )}

        <button
          type="button"
          onClick={() => setShowMethod((v) => !v)}
          aria-expanded={showMethod}
          className="mt-4 text-caption font-semibold text-brote-greenDeep underline underline-offset-2"
        >
          {t('como')}
        </button>
        {showMethod && (
          <p className="mt-2 text-caption text-muted-foreground">
            {t('metodo', { v: panel.coefficientVersion })}
          </p>
        )}
      </div>
    </div>
  );
}
