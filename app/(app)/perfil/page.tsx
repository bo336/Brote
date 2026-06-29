'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Settings, Target, Award, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { RankBadge } from '@/components/brand/RankBadge';
import { PointsBadge } from '@/components/brand/PointsBadge';
import { StreakFlame } from '@/components/brand/StreakFlame';
import { Mundo } from '@/components/mundo/Mundo';
import { SectionHeader } from '@/components/ui/section';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/stores/session';
import { fetchImpact } from '@/lib/api/profile';
import { formatPoints } from '@/lib/points';

const ImpactGlobe = dynamic(() => import('@/components/perfil/ImpactGlobe'), { ssr: false, loading: () => null });

export default function PerfilPage() {
  const t = useTranslations('perfil');
  const profile = useSession((s) => s.profile);
  const xp = profile?.totalXp ?? 0;

  const impactQ = useQuery({ queryKey: ['impact', profile?.id], queryFn: () => fetchImpact(profile!.id), enabled: !!profile?.id });

  const links = [
    { href: '/perfil/logros', icon: Award, label: t('logros') },
    { href: '/perfil/objetivos', icon: Target, label: t('objetivos') },
    { href: '/perfil/estadisticas', icon: BarChart3, label: t('stats') },
    { href: '/perfil/ajustes', icon: Settings, label: t('settings') },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Avatar name={profile?.displayName} src={profile?.avatarUrl} size={64} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-h1 font-bold">{profile?.displayName ?? 'Tu perfil'}</h1>
            <p className="text-small text-muted-foreground">
              {profile?.username ? `@${profile.username}` : 'Sin usuario'}
              {profile?.neighborhood ? ` · ${profile.neighborhood}` : ''}
            </p>
            {profile?.equippedTitle && <p className="text-caption font-medium text-primary">{profile.equippedTitle}</p>}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <RankBadge totalXp={xp} variant="full" size={56} />
          <div className="flex flex-col items-end gap-1">
            <PointsBadge value={xp} />
            <StreakFlame count={profile?.currentStreak ?? 0} size="sm" />
          </div>
        </div>
      </Card>

      <section>
        <SectionHeader title="Tu mundo" />
        <Mundo mundo={profile?.mundoState} height={260} />
      </section>

      {/* Impacto / handprint */}
      <section>
        <SectionHeader title={t('impact')} />
        <Card className="overflow-hidden">
          <div className="relative h-40 bg-gradient-to-b from-domain-agua_azul/20 to-transparent">
            <ImpactGlobe markerCount={Math.max(6, impactQ.data?.totalCompletions ?? 6)} />
          </div>
          {impactQ.isLoading ? (
            <div className="p-4">
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (impactQ.data?.handprint.length ?? 0) === 0 ? (
            <p className="p-4 text-center text-small text-muted-foreground">
              Completá acciones y mirá crecer tu huella positiva. 🌍
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-px bg-border">
              {impactQ.data!.handprint.map((m) => (
                <div key={m.label} className="flex items-center gap-2.5 bg-surface p-3.5">
                  <span className="text-2xl">{m.glyph}</span>
                  <div>
                    <p className="font-display text-h3 font-bold tnum">
                      {formatPoints(m.value)}
                      {m.unit && <span className="ml-0.5 text-small font-normal text-muted-foreground">{m.unit}</span>}
                    </p>
                    <p className="text-caption text-muted-foreground">{m.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <p className="mt-1.5 text-center text-caption text-muted-foreground">Valores estimados · tu huella positiva</p>
      </section>

      <div className="grid grid-cols-2 gap-2.5">
        {links.map((l) => {
          const Icon = l.icon;
          return (
            <Button key={l.href} variant="secondary" asChild className="h-auto justify-start py-3.5">
              <Link href={l.href}>
                <Icon className="h-5 w-5 text-primary" />
                {l.label}
              </Link>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
