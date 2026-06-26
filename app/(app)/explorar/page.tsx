'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Plus, Lock } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/ui/pill';
import { ProjectCard } from '@/components/explorar/ProjectCard';
import { NewsCard } from '@/components/explorar/NewsCard';
import { useSession } from '@/stores/session';
import { fetchProjects, fetchNews } from '@/lib/api/explorar';
import { meetsRank } from '@/lib/ranks';
import { DOMAINS } from '@/lib/domains';

type ProjectSort = 'cerca' | 'proximos' | 'populares' | 'dominio';

export default function ExplorarPage() {
  const t = useTranslations('explorar');
  const profile = useSession((s) => s.profile);
  const totalXp = profile?.totalXp ?? 0;
  const canCreate = meetsRank(totalXp, 'plantula');

  const projectsQ = useQuery({ queryKey: ['projects', profile?.id], queryFn: () => fetchProjects(profile?.id) });
  const newsQ = useQuery({ queryKey: ['news', profile?.interests], queryFn: () => fetchNews(profile?.interests ?? []) });

  const [sort, setSort] = useState<ProjectSort>('proximos');
  const [domain, setDomain] = useState<string | null>(null);

  const projects = useMemo(() => {
    let list = [...(projectsQ.data ?? [])];
    if (domain) list = list.filter((p) => p.domain_slug === domain);
    if (sort === 'populares') list.sort((a, b) => b.upvotes - a.upvotes);
    else if (sort === 'proximos')
      list.sort((a, b) => (a.event_date ?? '9').localeCompare(b.event_date ?? '9'));
    else if (sort === 'cerca' && profile?.neighborhood) {
      const n = profile.neighborhood.toLowerCase();
      list.sort((a, b) => Number((b.neighborhood ?? '').toLowerCase() === n) - Number((a.neighborhood ?? '').toLowerCase() === n));
    }
    return list;
  }, [projectsQ.data, sort, domain, profile?.neighborhood]);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="proyectos">
        <TabsList className="w-full">
          <TabsTrigger value="novedades" className="flex-1">
            {t('novedades')}
          </TabsTrigger>
          <TabsTrigger value="proyectos" className="flex-1">
            {t('proyectos')}
          </TabsTrigger>
        </TabsList>

        {/* Proyectos */}
        <TabsContent value="proyectos" className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
              {(['proximos', 'cerca', 'populares'] as const).map((s) => (
                <button key={s} onClick={() => setSort(s)} className="shrink-0">
                  <Pill active={sort === s} size="sm">
                    {s === 'proximos' ? t('upcoming') : s === 'cerca' ? t('nearYou') : t('popular')}
                  </Pill>
                </button>
              ))}
            </div>
            {canCreate ? (
              <Button size="sm" variant="primary" asChild className="shrink-0">
                <Link href="/explorar/proyectos/nuevo">
                  <Plus className="h-4 w-4" /> {t('createProject')}
                </Link>
              </Button>
            ) : (
              <Pill size="sm" className="shrink-0 text-muted-foreground">
                <Lock className="h-3 w-3" /> {t('createGated', { rank: 'Plántula' })}
              </Pill>
            )}
          </div>

          <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
            <button onClick={() => setDomain(null)} className="shrink-0">
              <Pill active={domain === null} size="sm">
                Todos
              </Pill>
            </button>
            {DOMAINS.map((d) => (
              <button key={d.slug} onClick={() => setDomain(domain === d.slug ? null : d.slug)} className="shrink-0">
                <Pill color={d.color} active={domain === d.slug} size="sm">
                  {d.name_es}
                </Pill>
              </button>
            ))}
          </div>

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
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} totalXp={totalXp} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Novedades */}
        <TabsContent value="novedades" className="space-y-3">
          {newsQ.isLoading ? (
            [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)
          ) : (newsQ.data ?? []).length === 0 ? (
            <EmptyState message={t('newsEmpty')} />
          ) : (
            (newsQ.data ?? []).map((item) => <NewsCard key={item.id} item={item} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
