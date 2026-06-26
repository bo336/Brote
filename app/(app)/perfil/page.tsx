'use client';

import Link from 'next/link';
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
import { useSession } from '@/stores/session';

/** Perfil (BUILD_SPEC §8.7). Impact, logros, stats, objetivos land in step 10. */
export default function PerfilPage() {
  const t = useTranslations('perfil');
  const profile = useSession((s) => s.profile);
  const xp = profile?.totalXp ?? 0;

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
            <h1 className="truncate font-display text-h1 font-bold">
              {profile?.displayName ?? 'Tu perfil'}
            </h1>
            <p className="text-small text-muted-foreground">
              {profile?.username ? `@${profile.username}` : 'Iniciá sesión para empezar'}
              {profile?.neighborhood ? ` · ${profile.neighborhood}` : ''}
            </p>
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
