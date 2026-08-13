'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Plus, Lock } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChipRail } from '@/components/ui/chip-rail';
import { BackToTop } from '@/components/ui/back-to-top';
import { Reveal } from '@/components/ui/reveal';
import { ProjectCard } from '@/components/explorar/ProjectCard';
import { SectionTabs } from '@/components/explorar/SectionTabs';
import { FeedCard } from '@/components/feed/FeedCard';
import { Composer } from '@/components/feed/Composer';
import { ThreadSheet } from '@/components/feed/ThreadSheet';
import { AdSlot } from '@/components/ads/AdSlot';
import { feedAdIndices } from '@/lib/ads/policy';
import { useSession } from '@/stores/session';
import { fetchProjects } from '@/lib/api/explorar';
import { fetchFeed, deletePost, type FeedItem } from '@/lib/api/feed';
import { toast } from '@/stores/toast';
import { meetsRank } from '@/lib/ranks';
import { DOMAINS } from '@/lib/domains';

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

  // Novedades is the landing section: it is the reason most people open
  // Explorar, so it should never take an extra tap to reach (F14.2).
  const [section, setSection] = useState<Section>('novedades');
  const qc = useQueryClient();
  const projectsQ = useQuery({ queryKey: ['projects', profile?.id], queryFn: () => fetchProjects(profile?.id) });

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

  // Topic filter, applied server-side by feed_timeline (F14.10/F14.11).
  const [newsTopic, setNewsTopic] = useState<string>('all');
  const [threadId, setThreadId] = useState<string | null>(null);

  const feedQ = useQuery({
    queryKey: ['feed', newsTopic],
    queryFn: () => fetchFeed(newsTopic),
    staleTime: 60_000,
  });
  const feed = feedQ.data ?? [];
  const adIndices = feedAdIndices(feed.length);

  // Only offer topics that currently have something behind them — an empty
  // filter chip is a dead end. Derived from the unfiltered fetch so the rail
  // does not collapse to one chip as soon as a filter is applied.
  const allFeedQ = useQuery({
    queryKey: ['feed', 'all'],
    queryFn: () => fetchFeed('all'),
    staleTime: 60_000,
  });
  const topicOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const n of allFeedQ.data ?? []) for (const d of n.domain_tags) counts.set(d, (counts.get(d) ?? 0) + 1);
    const available = DOMAINS.filter((d) => (counts.get(d.slug) ?? 0) > 0)
      .sort((a, b) => (counts.get(b.slug) ?? 0) - (counts.get(a.slug) ?? 0))
      .map((d) => ({ value: d.slug, label: d.name_es, color: d.color }));
    return [{ value: 'all', label: 'Todo' }, ...available];
  }, [allFeedQ.data]);

  function refreshFeed() {
    qc.invalidateQueries({ queryKey: ['feed'] });
  }

  async function removePost(item: FeedItem) {
    const res = await deletePost(item.id);
    if (res.ok) refreshFeed();
    else toast.error('No se pudo borrar', res.error);
  }

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
        <div className="space-y-3">
          {/* Say something of your own — the feed is a conversation, not a wire. */}
          <div className="rounded-card border border-border bg-surface p-3">
            <Composer placeholder="¿Qué viste, hiciste o pensaste hoy? 🌱" onPosted={refreshFeed} compact />
          </div>

          {topicOptions.length > 1 && (
            <ChipRail layoutId="news-topic" value={newsTopic} onChange={setNewsTopic} options={topicOptions} />
          )}

          {feedQ.isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          ) : feed.length === 0 ? (
            <EmptyState message={t('newsEmpty')} />
          ) : (
            <div className="divide-y divide-border">
              {feed.flatMap((item, i) => {
                const nodes = [
                  <Reveal key={item.id} index={i}>
                    <FeedCard item={item} onReply={(it) => setThreadId(it.id)} onDelete={removePost} />
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
          )}

          <ThreadSheet postId={threadId} open={!!threadId} onClose={() => setThreadId(null)} />
          <BackToTop />
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
