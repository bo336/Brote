'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Settings, Target, Award, BarChart3, Layers, Wand2, Sparkles, ChevronRight, Bookmark } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { RankBadge } from '@/components/brand/RankBadge';
import { PointsBadge } from '@/components/brand/PointsBadge';
import { StreakFlame } from '@/components/brand/StreakFlame';
import { MundoPoster } from '@/components/mundo3d/poster/MundoPoster';
import { ImpactBenchmark } from '@/components/impacto/ImpactBenchmark';
import { AccountTypeBadge } from '@/components/perfil/AccountTypeBadge';
import { ProfileHeader } from '@/components/perfil/ProfileHeader';
import { ProfileTabs } from '@/components/perfil/ProfileTabs';
import { SectionHeader } from '@/components/ui/section';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/stores/session';
import { fetchImpact } from '@/lib/api/profile';
import { fetchPublicProfileV2 } from '@/lib/api/perfil-publico';
import { formatPoints } from '@/lib/points';
import { getRank } from '@/lib/ranks';

const ImpactGlobe = dynamic(() => import('@/components/perfil/ImpactGlobe'), { ssr: false, loading: () => null });

/**
 * Your own profile.
 *
 * The header, the counts and the tabs are the *same components* everyone else
 * sees on your profile — one implementation, so what you check here is what
 * others actually get. Below that comes the half only you see: your world, your
 * handprint and the shortcuts into the rest of the app.
 */
export default function PerfilPage() {
  const t = useTranslations('perfil');
  const tp = useTranslations('perfilPublico');
  const router = useRouter();
  const profile = useSession((s) => s.profile);
  const xp = profile?.totalXp ?? 0;
  const isKid = profile?.accountType === 'kid';

  const impactQ = useQuery({
    queryKey: ['impact', profile?.id],
    queryFn: () => fetchImpact(profile!.id),
    enabled: !!profile?.id,
  });

  // Read your own profile through the public RPC so the header shows exactly
  // the numbers other people see — no locally-computed shadow copy to drift.
  const publicQ = useQuery({
    queryKey: ['public-profile', profile?.username],
    queryFn: () => fetchPublicProfileV2(profile!.username!),
    enabled: !!profile?.username,
    staleTime: 60_000,
  });

  const links = [
    { href: '/perfil/logros', icon: Award, label: t('logros') },
    { href: '/perfil/objetivos', icon: Target, label: t('objetivos') },
    { href: '/perfil/estadisticas', icon: BarChart3, label: t('stats') },
    { href: '/perfil/ajustes', icon: Settings, label: t('settings') },
  ];

  return (
    <div className="space-y-6">
      {publicQ.data?.ok && publicQ.data.profile ? (
        <ProfileHeader
          profile={publicQ.data.profile}
          viewer={publicQ.data.viewer!}
          onEdit={() => router.push('/perfil/ajustes')}
        />
      ) : (
        <Skeleton className="h-52 w-full" />
      )}

      <Card className="relative overflow-hidden p-4">
        {/* Faint rank-coloured wash so the identity card is not a plain box. */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative flex items-center justify-between gap-3">
          <Link href="/perfil/rangos" aria-label="Ver todos los rangos" className="transition-transform hover:-translate-y-0.5">
            <RankBadge totalXp={xp} variant="full" size={56} />
          </Link>
          <div className="flex flex-col items-end gap-1">
            <PointsBadge value={xp} />
            <StreakFlame count={profile?.currentStreak ?? 0} size="sm" />
          </div>
        </div>
        <AccountTypeBadge type={profile?.accountType} className="relative mt-3" />
        {/* These were text buttons carrying an ASCII "→" and a 🌱, with no
            hover beyond a colour change. Icons + a real press state instead. */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link
            href="/perfil/rangos"
            className="press group flex items-center justify-center gap-1.5 rounded-button border border-border bg-surface-2 px-3 py-2.5 text-small font-medium text-muted-foreground hover:border-primary/30 hover:text-foreground"
          >
            <Layers className="h-4 w-4" />
            Los rangos
            <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/perfil/pip"
            className="press group flex items-center justify-center gap-1.5 rounded-button border border-border bg-surface-2 px-3 py-2.5 text-small font-medium text-muted-foreground hover:border-primary/30 hover:text-foreground"
          >
            <Wand2 className="h-4 w-4" />
            Personalizá a Pip
          </Link>
        </div>
        {/* Kids have no feed to save from, so the shortcut would lead nowhere. */}
        {!isKid && (
          <Link
            href="/perfil/guardados"
            className="press group mt-2 flex items-center justify-center gap-1.5 rounded-button border border-border bg-surface-2 px-3 py-2.5 text-small font-medium text-muted-foreground hover:border-primary/30 hover:text-foreground"
          >
            <Bookmark className="h-4 w-4" />
            {tp('tabSaved')}
            <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        )}
        <Link
          href="/brote-plus"
          className="press group mt-2 flex items-center justify-center gap-2 rounded-button border border-brote-sun/40 bg-brote-sun/10 px-3 py-2.5 text-center text-small font-semibold text-brote-sun hover:bg-brote-sun/15 hover:shadow-sun-glow"
        >
          <Sparkles className="h-4 w-4" />
          Brote+ · sin anuncios y con extras
          <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </Card>

      <section>
        <SectionHeader eyebrow="Tu progreso" title="Tu mundo" />
        <MundoPoster mundo={profile?.mundoState} height={320} className="shadow-soft-lg" />
      </section>

      {/* Impacto / handprint */}
      <section>
        <SectionHeader eyebrow="En la vida real" title={t('impact')} />
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

      {/* The motivational half: the same savings, next to a real person's use. */}
      <section>
        <ImpactBenchmark days={30} />
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

      {/* Kids have no social feed at all (08 §2), so no tabs to show. */}
      {!isKid && profile?.id && (
        <ProfileTabs userId={profile.id} isMe displayName={profile.displayName ?? null} />
      )}
    </div>
  );
}
