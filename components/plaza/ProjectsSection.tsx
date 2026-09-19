'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Plus, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChipRail } from '@/components/ui/chip-rail';
import { Reveal } from '@/components/ui/reveal';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ProjectCard } from '@/components/plaza/ProjectCard';
import { useSession } from '@/stores/session';
import { fetchProjects, fetchProjectMinRankTier } from '@/lib/api/plaza';
import { getRank, RANK_BY_TIER } from '@/lib/ranks';
import { DOMAINS } from '@/lib/domains';

type ProjectSort = 'cerca' | 'proximos' | 'populares';

const SORT_OPTIONS: { value: ProjectSort; label: string }[] = [
  { value: 'proximos', label: 'Próximos' },
  { value: 'cerca', label: 'Cerca tuyo' },
  { value: 'populares', label: 'Populares' },
];

/**
 * The project list, lifted verbatim out of the old Explorar tab.
 *
 * It lives under Acciones now because a project IS an action — a group one —
 * so it belongs where people go to act, not where they go to read. Sharing a
 * tab with the news river also meant two unrelated products competing for the
 * same screen, and the feed lost.
 */
export function ProjectsSection() {
  const t = useTranslations('proyectos');
  const profile = useSession((s) => s.profile);
  const totalXp = profile?.totalXp ?? 0;

  // Both the gate and its label come from the server setting, so raising the
  // bar in /panel updates this screen without a deploy.
  const minTierQ = useQuery({ queryKey: ['project-min-tier'], queryFn: fetchProjectMinRankTier, staleTime: 300_000 });
  const minTier = minTierQ.data ?? 4;
  const canCreate = getRank(totalXp).tier >= minTier;
  const createRankName = RANK_BY_TIER[minTier]?.name_es ?? 'Retoño';

  const projectsQ = useQuery({ queryKey: ['projects', profile?.id], queryFn: () => fetchProjects(profile?.id) });

  const [sort, setSort] = useState<ProjectSort>('proximos');
  const [domain, setDomain] = useState<string>('all');

  const projects = useMemo(() => {
    let list = [...(projectsQ.data ?? [])];
    if (domain !== 'all') list = list.filter((p) => p.domain_slug === domain);
    if (sort === 'populares') list.sort((a, b) => b.upvotes - a.upvotes);
    else if (sort === 'proximos') list.sort((a, b) => (a.event_date ?? '9').localeCompare(b.event_date ?? '9'));
    else if (sort === 'cerca' && profile?.neighborhood) {
      const n = profile.neighborhood.toLowerCase();
      list.sort(
        (a, b) =>
          Number((b.neighborhood ?? '').toLowerCase() === n) - Number((a.neighborhood ?? '').toLowerCase() === n),
      );
    }
    return list;
  }, [projectsQ.data, sort, domain, profile?.neighborhood]);

  return (
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
            <Link href="/proyectos/nuevo">
              <Plus className="h-4 w-4" /> {t('createProject')}
            </Link>
          </Button>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-pill border border-border bg-surface-2 px-3 py-1 text-caption text-muted-foreground">
            <Lock className="h-3 w-3" /> {t('createGated', { rank: createRankName })}
          </span>
        )}
      </div>

      <ChipRail
        layoutId="proyectos-domain"
        value={domain}
        onChange={setDomain}
        options={[
          { value: 'all', label: 'Todos' },
          ...DOMAINS.map((d) => ({ value: d.slug, label: d.name_es, color: d.color })),
        ]}
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
                <Link href="/proyectos/nuevo">{t('createProject')}</Link>
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          {projects.map((p, i) => (
            <Reveal key={p.id} index={Math.min(i, 6)}>
              <ProjectCard project={p} totalXp={totalXp} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
