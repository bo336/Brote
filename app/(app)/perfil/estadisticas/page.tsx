'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StreakFlame } from '@/components/brand/StreakFlame';
import { useSession } from '@/stores/session';
import { fetchImpact } from '@/lib/api/profile';
import { DOMAINS, getDomainColor } from '@/lib/domains';
import { formatPoints } from '@/lib/points';

export default function EstadisticasPage() {
  const t = useTranslations('perfil');
  const profile = useSession((s) => s.profile);

  const impactQ = useQuery({ queryKey: ['impact', profile?.id], queryFn: () => fetchImpact(profile!.id), enabled: !!profile?.id });

  const chartData = DOMAINS.map((d) => ({
    name: d.name_es.split(' ')[0],
    slug: d.slug,
    points: impactQ.data?.byDomain[d.slug] ?? 0,
  }))
    .filter((d) => d.points > 0)
    .sort((a, b) => b.points - a.points);

  return (
    <div className="space-y-4">
      <Link href="/perfil" className="inline-flex items-center gap-1.5 text-small text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> {t('title')}
      </Link>
      <h1 className="font-display text-h1 font-bold">{t('stats')}</h1>

      <div className="grid grid-cols-3 gap-2.5">
        <Stat label={t('currentStreak')}>
          <StreakFlame count={profile?.currentStreak ?? 0} size="md" showCount />
        </Stat>
        <Stat label={t('longestStreak')}>
          <span className="font-display text-h2 font-bold tnum">{profile?.longestStreak ?? 0}</span>
        </Stat>
        <Stat label={t('completions')}>
          <span className="font-display text-h2 font-bold tnum">{impactQ.data?.totalCompletions ?? 0}</span>
        </Stat>
      </div>

      <section>
        <h2 className="mb-2 font-display text-h3 font-bold">Puntos por tema</h2>
        {impactQ.isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : chartData.length === 0 ? (
          <Card className="p-6 text-center text-small text-muted-foreground">
            Completá acciones para ver tu desglose por tema.
          </Card>
        ) : (
          <Card className="p-3">
            <ResponsiveContainer width="100%" height={Math.max(180, chartData.length * 38)}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 12, fill: 'rgb(var(--muted-fg))' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgb(var(--surface-2))' }}
                  formatter={(v: number) => [formatPoints(v), 'Puntos']}
                  contentStyle={{ borderRadius: 12, border: '1px solid rgb(var(--border))', background: 'rgb(var(--surface))' }}
                />
                <Bar dataKey="points" radius={[0, 8, 8, 0]}>
                  {chartData.map((d) => (
                    <Cell key={d.slug} fill={getDomainColor(d.slug)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </section>
    </div>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Card className="flex flex-col items-center gap-1 p-3 text-center">
      <div className="flex h-8 items-center">{children}</div>
      <span className="text-caption text-muted-foreground">{label}</span>
    </Card>
  );
}
