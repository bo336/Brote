'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Plus, Lock } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChipRail } from '@/components/ui/chip-rail';
import { Reveal } from '@/components/ui/reveal';
import { ProjectCard } from '@/components/explorar/ProjectCard';
import { NewsHero } from '@/components/explorar/NewsHero';
import { NewsBriefingRow } from '@/components/explorar/NewsBriefingRow';
import { PulseStrip } from '@/components/explorar/PulseStrip';
import { SectionTabs } from '@/components/explorar/SectionTabs';
import { AdSlot } from '@/components/ads/AdSlot';
import { feedAdIndices } from '@/lib/ads/policy';
import { useSession } from '@/stores/session';
import { fetchProjects, fetchNews } from '@/lib/api/explorar';
import { meetsRank } from '@/lib/ranks';
import { DOMAINS, getDomain } from '@/lib/domains';

type ProjectSort = 'cerca' | 'proximos' | 'populares';
type Section = 'novedades' | 'proyectos';

const SORT_OPTIONS: { value: ProjectSort; label: string }[] = [
  { value: 'proximos', label: 'Próximos' },
  { value: 'cerca', label: 'Cerca tuyo' },
  { value: 'populares', label: 'Populares' },
];

export default function ExplorarPage() {
  const t = useTranslations('explorar');
  const profile = useSession((s) => s.profile);
  const totalXp = profile?.totalXp ?? 0;
  const canCreate = meetsRank(totalXp, 'plantula');

  const [section, setSection] = useState<Section>('novedades');
  const projectsQ = useQuery({ queryKey: ['projects', profile?.id], queryFn: () => fetchProjects(profile?.id) });
  const newsQ = useQuery({
    queryKey: ['news', profile?.interests, profile?.accountType],
    queryFn: () => fetchNews(profile?.interests ?? [], profile?.accountType ?? 'adult'),
  });

  const [sort, setSort] = useState<ProjectSort>('proximos');
  const [domain, setDomain] = useState<string>('all');

  const projects = useMemo(() => {
    let list = [...(projectsQ.data ?? [])];
    if (domain !== 'all') list = list.filter((p) => p.domain_slug === domain);
    if (sort === 'populares') list.sort((a, b) => b.upvotes - a.upvotes);
    else if (sort === 'proximos')
      list.sort((a, b) => (a.event_date ?? '9').localeCompare(b.event_date ?? '9'));
    else if (sort === 'cerca' && profile?.neighborhood) {
      const n = profile.neighborhood.toLowerCase();
      list.sort((a, b) => Number((b.neighborhood ?? '').toLowerCase() === n) - Number((a.neighborhood ?? '').toLowerCase() === n));
    }
    return list;
  }, [projectsQ.data, sort, domain, profile?.neighborhood]);

  // Featured story + the calmer hairline briefing river beneath it.
  const news = newsQ.data ?? [];
  const featured = news[0];
  const briefing = news.slice(1);
  const adIndices = feedAdIndices(briefing.length);

  const pulse = useMemo(() => {
    const dayMs = 24 * 3_600_000;
    const today = news.filter((n) => n.published_at && Date.now() - new Date(n.published_at).getTime() < dayMs).length;
    const counts = new Map<string, number>();
    for (const n of news) for (const d of n.domain_tags) counts.set(d, (counts.get(d) ?? 0) + 1);
    let topSlug: string | null = null;
    let topCount = 0;
    for (const [slug, count] of counts) if (count > topCount) { topSlug = slug; topCount = count; }
    const topDomain = topSlug ? getDomain(topSlug) : undefined;
    return { today, total: news.length, trendingLabel: topDomain?.name_es ?? null, trendingColor: topDomain?.color };
  }, [news]);

  return (
    <div className="space-y-5">
      <SectionTabs
        value={section}
        onChange={(v) => setSection(v as Section)}
        options={[
          { value: 'novedades', label: t('novedades') },
          { value: 'proyectos', label: t('proyectos') },
        ]}
      />

      {section === 'novedades' && (
        <div className="space-y-5">
          {!newsQ.isLoading && news.length > 0 && (
            <PulseStrip
              today={pulse.today}
              total={pulse.total}
              trendingLabel={pulse.trendingLabel}
              trendingColor={pulse.trendingColor}
            />
          )}

          {newsQ.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-64 w-full rounded-card sm:h-80" />
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : news.length === 0 ? (
            <EmptyState message={t('newsEmpty')} />
          ) : (
            <>
              {featured && <NewsHero item={featured} />}
              <div className="divide-y divide-border">
                {briefing.flatMap((item, i) => {
                  const nodes = [
                    <Reveal key={item.id} index={i}>
                      <NewsBriefingRow item={item} />
                    </Reveal>,
                  ];
                  if (adIndices.includes(i)) {
                    nodes.push(
                      <div key={`ad-${i}`} className="py-3">
                        <AdSlot placement="news-feed" />
                      </div>,
                    );
                  }
                  return nodes;
                })}
              </div>
            </>
          )}
        </div>
      )}

      {section === 'proyectos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <ChipRail
              layoutId="proyectos-sort"
              value={sort}
              onChange={(v) => setSort(v as ProjectSort)}
              options={SORT_OPTIONS}
            />
            {canCreate ? (
              <Button size="sm" variant="primary" asChild className="shrink-0">
                <Link href="/explorar/proyectos/nuevo">
                  <Plus className="h-4 w-4" /> {t('createProject')}
                </Link>
              </Button>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-pill border border-border bg-surface-2 px-3 py-1 text-caption text-muted-foreground">
                <Lock className="h-3 w-3" /> {t('createGated', { rank: 'Plántula' })}
              </span>
            )}
          </div>

          <ChipRail
            layoutId="proyectos-domain"
            value={domain}
            onChange={setDomain}
            options={[{ value: 'all', label: 'Todos' }, ...DOMAINS.map((d) => ({ value: d.slug, label: d.name_es, color: d.color }))]}
          />

          {projectsQ.isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-44 w-full" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <EmptyState
              message={t('projectsEmpty')}
              action={
                canCreate && (
                  <Button variant="primary" asChild>
                    <Link href="/explorar/proyectos/nuevo">{t('createProject')}</Link>
                  </Button>
                )
              }
            />
          ) : (
            <div className="space-y-3">
              {projects.map((p, i) => (
                <Reveal key={p.id} index={i}>
                  <ProjectCard project={p} totalXp={totalXp} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
