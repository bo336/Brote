'use client';

import { useTranslations } from 'next-intl';
import { Trophy, Flame, Users, CalendarCheck, GraduationCap, Repeat } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { CountUp } from '@/components/ui/count-up';
import { DOMAINS } from '@/lib/domains';
import { formatPoints } from '@/lib/points';
import type { ProfileStats as Stats, PublicProfileV2 } from '@/lib/api/perfil-publico';

/**
 * The reputation block: everything real that account has done.
 *
 * Every figure comes straight from `get_public_profile_v2`, which computes it
 * from the ledger. Nothing here is rounded into stars or badges-for-effort —
 * the whole premise is that a Brote profile cannot be faked, so the numbers
 * have to be the actual numbers.
 */
export function ProfileStats({ profile, stats }: { profile: PublicProfileV2; stats: Stats }) {
  const t = useTranslations('perfilPublico');

  const domainRows = DOMAINS.map((d) => ({ ...d, points: stats.domain_points?.[d.slug] ?? 0 }))
    .filter((d) => d.points > 0)
    .sort((a, b) => b.points - a.points);
  const maxPoints = domainRows[0]?.points ?? 1;

  return (
    <div className="space-y-5">
      {/* The one dark band on this screen. Impact is the headline claim, so it
          gets the terminal treatment. */}
      <section className="-mx-4 bg-brote-ink px-4 py-4 text-brote-cream lg:mx-0 lg:rounded-card">
        <span className="eyebrow text-brote-green">{t('realImpact')}</span>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          <ImpactFigure value={stats.impact.water_l} unit="L" label={t('water')} />
          <ImpactFigure value={stats.impact.co2_kg} unit="kg" label="CO₂" />
          <ImpactFigure value={stats.impact.waste_kg} unit="kg" label={t('waste')} />
          <ImpactFigure value={stats.impact.energy_kwh} unit="kWh" label={t('energy')} />
        </div>
        <p className="mt-2.5 text-caption text-brote-cream/60">
          {t('impactSince', { n: stats.completions_total })}
        </p>
      </section>

      {/* Headline counters. */}
      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile icon={<Trophy className="h-4 w-4" />} label={t('globalPos')} value={`#${stats.global_position}`} />
        <StatTile icon={<Flame className="h-4 w-4" />} label={t('longestStreak')} value={String(profile.longest_streak ?? 0)} />
        <StatTile icon={<CalendarCheck className="h-4 w-4" />} label={t('actions30d')} value={String(stats.completions_30d)} />
        <StatTile icon={<Users className="h-4 w-4" />} label={t('projectsJoined')} value={String(stats.projects_joined)} />
      </section>

      {/* Points per domain — 13 hairline bars in each domain's own colour.
          Exact values, not a rounded score. */}
      {domainRows.length > 0 && (
        <section>
          <span className="eyebrow block text-muted-foreground">{t('byTopic')}</span>
          <h2 className="mb-2.5 font-display text-h3 font-bold">{t('domainPoints')}</h2>
          <div className="space-y-2">
            {domainRows.map((d) => (
              <div key={d.slug} className="flex items-center gap-2.5">
                <span className="w-28 shrink-0 truncate text-caption" style={{ color: d.color }}>
                  {d.name_es}
                </span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-pill bg-muted">
                  <span
                    className="block h-full rounded-pill transition-[width] duration-700 ease-out"
                    style={{ width: `${Math.max(3, (d.points / maxPoints) * 100)}%`, backgroundColor: d.color }}
                  />
                </span>
                <span className="w-14 shrink-0 text-right text-caption text-muted-foreground tnum">
                  {formatPoints(d.points)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* League, habits, lessons, sessions — the rest of the receipt. */}
      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.league && (
          <StatTile icon={<Trophy className="h-4 w-4" />} label={t('league')} value={stats.league.name} small />
        )}
        <StatTile icon={<Repeat className="h-4 w-4" />} label={t('habits')} value={String(stats.habits_active)} />
        <StatTile icon={<GraduationCap className="h-4 w-4" />} label={t('lessons')} value={String(stats.lessons_completed)} />
        <StatTile icon={<CalendarCheck className="h-4 w-4" />} label={t('sessions')} value={String(stats.sessions_attended)} />
      </section>

      {/* Titles and badges. */}
      {(stats.titles.length > 0 || stats.badges.length > 0) && (
        <section>
          <span className="eyebrow block text-muted-foreground">{t('earned')}</span>
          <h2 className="mb-2.5 font-display text-h3 font-bold">{t('titlesAndBadges')}</h2>
          <div className="flex flex-wrap gap-1.5">
            {stats.titles.map((ti) => (
              <span
                key={ti.slug}
                className={
                  'inline-flex items-center gap-1 rounded-pill border px-2.5 py-1 text-caption font-medium ' +
                  (ti.equipped
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border bg-surface-2 text-muted-foreground')
                }
              >
                {ti.name_es}
              </span>
            ))}
            {stats.badges.map((b) => (
              <span
                key={b.slug}
                title={b.name_es}
                className="inline-flex items-center gap-1 rounded-pill border border-brote-sun/40 bg-brote-sun/10 px-2.5 py-1 text-caption font-medium text-brote-sun"
              >
                {b.name_es}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ImpactFigure({ value, unit, label }: { value: number; unit: string; label: string }) {
  return (
    <div>
      <p className="font-display text-h2 font-bold leading-none tnum">
        <CountUp value={Math.round(value)} />
        <span className="ml-0.5 text-small font-normal text-brote-cream/60">{unit}</span>
      </p>
      <p className="mt-0.5 text-caption text-brote-cream/60">{label}</p>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  small,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <Card className="p-3">
      <span className="flex items-center gap-1.5 text-muted-foreground">{icon}</span>
      <p className={'mt-1 font-display font-bold tnum ' + (small ? 'text-small' : 'text-h2')}>{value}</p>
      <p className="text-caption text-muted-foreground">{label}</p>
    </Card>
  );
}
