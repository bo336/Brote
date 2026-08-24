'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Settings, Target, Award, BarChart3, Layers, Wand2, Sparkles, Sprout, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { RankBadge } from '@/components/brand/RankBadge';
import { PointsBadge } from '@/components/brand/PointsBadge';
import { StreakFlame } from '@/components/brand/StreakFlame';
import { Mundo } from '@/components/mundo/Mundo';
import { ImpactBenchmark } from '@/components/impacto/ImpactBenchmark';
import { AccountTypeBadge } from '@/components/perfil/AccountTypeBadge';
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
      <Card className="relative overflow-hidden p-4">
        {/* Faint rank-coloured wash so the identity card is not a plain box. */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative flex items-center gap-4">
          <Avatar name={profile?.displayName} src={profile?.avatarUrl} size={64} />
          <div className="min-w-0 flex-1">
            {profile?.equippedTitle && <span className="eyebrow block text-primary">{profile.equippedTitle}</span>}
            <h1 className="truncate font-display text-h1 font-bold leading-tight">
              {profile?.displayName ?? 'Tu perfil'}
            </h1>
            <p className="mt-0.5 truncate text-small text-muted-foreground">
              {profile?.username ? `@${profile.username}` : 'Sin usuario'}
              {profile?.city ? ` · ${profile.city}` : ''}
            </p>
            <AccountTypeBadge type={profile?.accountType} className="mt-1.5" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <Link href="/perfil/rangos" aria-label="Ver todos los rangos" className="transition-transform hover:-translate-y-0.5">
            <RankBadge totalXp={xp} variant="full" size={56} />
          </Link>
          <div className="flex flex-col items-end gap-1">
            <PointsBadge value={xp} />
            <StreakFlame count={profile?.currentStreak ?? 0} size="sm" />
          </div>
        </div>
        {/* La tienda va acá arriba y con el saldo a la vista: si el saldo vive
            escondido en otra pantalla, nadie se entera de que junta algo. */}
        <Link
          href="/tienda"
          className="press group mt-3 flex items-center gap-2.5 rounded-button border border-primary/30 bg-primary/8 px-3 py-2.5 text-small font-semibold text-primary hover:bg-primary/12"
        >
          <Sprout className="h-4 w-4 shrink-0" />
          <span className="tabular-nums">{profile?.semillas ?? 0} semillas</span>
          <span className="min-w-0 flex-1 truncate font-medium text-muted-foreground">
            para gastar en la tienda
          </span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>

        {/* These were text buttons carrying an ASCII "→" and a 🌱, with no
            hover beyond a colour change. Icons + a real press state instead. */}
        <div className="mt-2 grid grid-cols-2 gap-2">
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
        <div className="overflow-hidden rounded-card shadow-soft-lg">
          <Mundo mundo={profile?.mundoState} height={320} />
        </div>
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
    </div>
  );
}
