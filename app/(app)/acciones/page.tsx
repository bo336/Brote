'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Pill } from '@/components/ui/pill';
import { Pip } from '@/components/pip/Pip';
import { ActivityCard } from '@/components/acciones/ActivityCard';
import { DomainIcon } from '@/components/icons/DomainIcon';
import { useSession } from '@/stores/session';
import { useCatalog, useCatalogCompletions, useDomainPoints } from '@/hooks/use-catalog';
import { scoreActivities } from '@/lib/recommendations';
import { DOMAINS } from '@/lib/domains';
import { cn } from '@/lib/utils/cn';
import type { ActivityRow } from '@/lib/supabase/rows';

export default function AccionesPage() {
  const t = useTranslations('acciones');
  const tc = useTranslations('common');
  const profile = useSession((s) => s.profile);

  const catalog = useCatalog();
  const completions = useCatalogCompletions(profile?.id);
  const domainPointsQ = useDomainPoints(profile?.id);

  const [search, setSearch] = useState('');
  const [domain, setDomain] = useState<string | null>(null);
  const [onlyDoable, setOnlyDoable] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const completionMap = completions.data;
  const completedIds = useMemo(() => {
    const s = new Set<string>();
    completionMap?.forEach((info, id) => {
      if (info.status === 'honor' || info.status === 'verified') s.add(id);
    });
    return s;
  }, [completionMap]);

  const scored = useMemo(() => {
    if (!catalog.data) return [];
    return scoreActivities(catalog.data, {
      interests: profile?.interests ?? [],
      totalXp: profile?.totalXp ?? 0,
      domainPoints: domainPointsQ.data ?? {},
      completedIds,
    });
  }, [catalog.data, profile?.interests, profile?.totalXp, domainPointsQ.data, completedIds]);

  const featured = useMemo(() => (catalog.data ?? []).filter((a) => a.is_featured), [catalog.data]);

  const filtering = search.trim() !== '' || domain !== null || onlyDoable || hideCompleted;

  const filtered = useMemo(() => {
    let list = scored;
    if (domain) list = list.filter((s) => s.activity.domain_slug === domain);
    if (onlyDoable) list = list.filter((s) => !s.locked);
    if (hideCompleted) list = list.filter((s) => !completedIds.has(s.activity.id));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.activity.title_es.toLowerCase().includes(q));
    }
    return list;
  }, [scored, domain, onlyDoable, hideCompleted, search, completedIds]);

  const byDomain = useMemo(() => {
    const map = new Map<string, ActivityRow[]>();
    for (const s of scored) {
      const arr = map.get(s.activity.domain_slug) ?? [];
      arr.push(s.activity);
      map.set(s.activity.domain_slug, arr);
    }
    return map;
  }, [scored]);

  if (catalog.isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[96px] w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search + filter toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full rounded-button border border-border bg-surface py-2.5 pl-9 pr-3 text-body outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            'inline-flex h-11 w-11 items-center justify-center rounded-button border border-border',
            showFilters ? 'bg-primary/10 text-primary' : 'bg-surface text-muted-foreground',
          )}
          aria-label={tc('filters')}
        >
          <SlidersHorizontal className="h-5 w-5" />
        </button>
      </div>

      {showFilters && (
        <Card className="space-y-3 p-3.5">
          <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
            <FilterChip active={domain === null} onClick={() => setDomain(null)}>
              {tc('all')}
            </FilterChip>
            {DOMAINS.map((d) => (
              <FilterChip key={d.slug} active={domain === d.slug} color={d.color} onClick={() => setDomain(domain === d.slug ? null : d.slug)}>
                {d.name_es}
              </FilterChip>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <ToggleChip active={onlyDoable} onClick={() => setOnlyDoable((v) => !v)}>
              {t('filterDoable')}
            </ToggleChip>
            <ToggleChip active={hideCompleted} onClick={() => setHideCompleted((v) => !v)}>
              {t('filterCompleted')}
            </ToggleChip>
          </div>
        </Card>
      )}

      {filtering ? (
        <section>
          <SectionHeader title={`${filtered.length} ${filtered.length === 1 ? 'acción' : 'acciones'}`} />
          <div className="space-y-2.5">
            {filtered.map((s) => (
              <ActivityCard
                key={s.activity.id}
                activity={s.activity}
                locked={s.locked}
                completed={completedIds.has(s.activity.id)}
              />
            ))}
            {filtered.length === 0 && (
              <Card className="flex items-center gap-3 p-4">
                <Pip size={44} mood="neutral" />
                <p className="text-small text-muted-foreground">No encontramos acciones con esos filtros.</p>
              </Card>
            )}
          </div>
        </section>
      ) : (
        <>
          {/* Para Vos */}
          <section>
            <SectionHeader title={t('paraVos')} subtitle={t('paraVosReason')} />
            <div className="space-y-2.5">
              {scored.slice(0, 5).map((s) => (
                <ActivityCard
                  key={s.activity.id}
                  activity={s.activity}
                  locked={s.locked}
                  completed={completedIds.has(s.activity.id)}
                  reason={s.reason}
                />
              ))}
            </div>
          </section>

          {/* Nuevas esta semana */}
          {featured.length > 0 && (
            <section>
              <SectionHeader title={t('newThisWeek')} />
              <div className="space-y-2.5">
                {featured.map((a) => (
                  <div key={a.id} className="relative">
                    <span className="absolute -left-1 -top-1 z-10 rounded-pill bg-brote-sun px-2 py-0.5 text-caption font-bold text-brote-ink shadow-soft">
                      Nuevo
                    </span>
                    <ActivityCard activity={a} completed={completedIds.has(a.id)} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Browse by domain */}
          <section>
            <SectionHeader title={t('browseByDomain')} />
            <div className="space-y-4">
              {DOMAINS.map((d) => {
                const items = byDomain.get(d.slug) ?? [];
                if (items.length === 0) return null;
                return (
                  <div key={d.slug}>
                    <button
                      onClick={() => {
                        setDomain(d.slug);
                        setShowFilters(true);
                      }}
                      className="mb-2 flex items-center gap-2"
                    >
                      <DomainIcon domain={d.slug} size={28} />
                      <span className="font-display text-h3 font-bold" style={{ color: d.color }}>
                        {d.name_es}
                      </span>
                      <span className="text-caption text-muted-foreground tnum">{items.length}</span>
                    </button>
                    <div className="space-y-2.5">
                      {items.slice(0, 3).map((a) => (
                        <ActivityCard key={a.id} activity={a} completed={completedIds.has(a.id)} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function FilterChip({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean;
  color?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} className="shrink-0">
      <Pill color={color} active={active} size="sm">
        {children}
      </Pill>
    </button>
  );
}

function ToggleChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}>
      <Pill active={active} size="sm">
        {active && <X className="h-3 w-3" />}
        {children}
      </Pill>
    </button>
  );
}
