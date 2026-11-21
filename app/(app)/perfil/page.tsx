'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  Award,
  BarChart3,
  Bookmark,
  ChevronRight,
  Heart,
  Layers,
  Settings,
  Sparkles,
  Store,
  Target,
  Wand2,
  type LucideIcon,
} from 'lucide-react';
import { RankBadge } from '@/components/brand/RankBadge';
import { ChipLiga } from '@/components/ranking/ChipLiga';
import { PointsBadge } from '@/components/brand/PointsBadge';
import { StreakFlame } from '@/components/brand/StreakFlame';
import { MundoPoster } from '@/components/mundo3d/poster/MundoPoster';
import { AccountTypeBadge } from '@/components/perfil/AccountTypeBadge';
import { ProfileHeader } from '@/components/perfil/ProfileHeader';
import { ProfileTabs } from '@/components/perfil/ProfileTabs';
import { TarjetaImpacto } from '@/components/explorar/TarjetasLugar';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/stores/session';
import { fetchPublicProfileV2 } from '@/lib/api/perfil-publico';
import { BotonesConsumidor } from '@/components/legal/BotonesConsumidor';

interface Atajo {
  href: string;
  icon: LucideIcon;
  label: string;
}

/**
 * Vos — tu perfil (docs/REESTRUCTURA.md D3).
 *
 * Se llega desde tu rango, arriba a la derecha. El encabezado, los números y
 * las pestañas son los MISMOS componentes que ven los demás: lo que revisás acá
 * es lo que otros ven. Debajo, lo que es sólo tuyo, en orden: cómo venís
 * (rango, puntos, racha, liga), tu isla, tu impacto en una frase y los atajos.
 * Antes eran seis botones apilados en una tarjeta; ahora es una grilla.
 */
export default function PerfilPage() {
  const t = useTranslations('perfil');
  const tp = useTranslations('perfilPublico');
  const router = useRouter();
  const profile = useSession((s) => s.profile);
  const xp = profile?.totalXp ?? 0;
  const tipo = profile?.accountType;
  const isKid = tipo === 'kid';

  // Read your own profile through the public RPC so the header shows exactly
  // the numbers other people see — no locally-computed shadow copy to drift.
  const publicQ = useQuery({
    queryKey: ['public-profile', profile?.username],
    queryFn: () => fetchPublicProfileV2(profile!.username!),
    enabled: !!profile?.username,
    staleTime: 60_000,
  });

  const atajos: Atajo[] = [
    { href: '/perfil/logros', icon: Award, label: t('logros') },
    { href: '/perfil/objetivos', icon: Target, label: t('objetivos') },
    { href: '/perfil/estadisticas', icon: BarChart3, label: t('stats') },
    { href: '/perfil/rangos', icon: Layers, label: 'Los rangos' },
    { href: '/perfil/pip', icon: Wand2, label: 'Personalizá a Pip' },
    // Kids have no feed to save from, nor a Mercado (08 §9).
    ...(!isKid
      ? [
          { href: '/perfil/guardados', icon: Bookmark, label: tp('tabSaved') },
          { href: '/mercado/guardados', icon: Heart, label: 'Guardados del Mercado' },
        ]
      : []),
    // La puerta a Negocios: los menores no pueden tener una empresa (08 §9).
    ...(tipo === 'adult' ? [{ href: '/negocio', icon: Store, label: 'Tu negocio en Brote' }] : []),
    { href: '/perfil/ajustes', icon: Settings, label: t('settings') },
  ];

  return (
    <div className="space-y-6">
      {publicQ.data?.ok && publicQ.data.profile ? (
        <ProfileHeader profile={publicQ.data.profile} viewer={publicQ.data.viewer!} onEdit={() => router.push('/perfil/ajustes')} />
      ) : (
        <Skeleton className="h-52 w-full" />
      )}

      {/* Cómo venís: rango de por vida, puntos, racha y la liga de la semana. */}
      <section aria-label="Cómo venís" className="rounded-card border border-border bg-surface p-4 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <Link href="/perfil/rangos" aria-label="Ver todos los rangos" className="transition-transform duration-200 hover:-translate-y-0.5">
            <RankBadge totalXp={xp} variant="full" size={56} />
          </Link>
          <div className="flex flex-col items-end gap-1">
            <PointsBadge value={xp} />
            <StreakFlame count={profile?.currentStreak ?? 0} size="sm" />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-hairline pt-3">
          <AccountTypeBadge type={tipo} />
          {profile?.id && <ChipLiga userId={profile.id} />}
        </div>
      </section>

      <section aria-labelledby="perfil-mundo">
        <div className="mb-2 flex items-end justify-between gap-3">
          <div>
            <span className="eyebrow block text-lugar-mundo">Tu isla</span>
            <h2 id="perfil-mundo" className="mt-0.5 font-display text-h2 font-bold">
              Tu mundo
            </h2>
          </div>
          <Link href="/mundo" className="inline-flex items-center gap-0.5 text-small font-semibold text-lugar-mundo hover:underline">
            Entrar <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <MundoPoster mundo={profile?.mundoState} snapshotUrl={profile?.worldSnapshotUrl} height={280} className="shadow-soft-lg" />
      </section>

      {/* Tu impacto: la frase, como puerta a /impacto (ahí están el detalle y la comparación). */}
      <section id="impacto" className="scroll-mt-20">
        <TarjetaImpacto />
      </section>

      <nav aria-label="Atajos de tu perfil">
        <ul className="grid grid-cols-2 gap-2.5">
          {atajos.map((a) => {
            const Icon = a.icon;
            return (
              <li key={a.href}>
                <Link
                  href={a.href}
                  prefetch={false}
                  className="press group flex h-full items-center gap-2.5 rounded-button border border-border bg-surface px-3 py-3 text-small font-medium shadow-soft hover:-translate-y-0.5 hover:border-foreground/20"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-foreground/80 transition-colors group-hover:text-foreground">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 leading-tight">{a.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Link
        href="/brote-plus"
        className="press group flex items-center justify-center gap-2 rounded-button border border-brote-sun/40 bg-brote-sun/10 px-3 py-3 text-center text-small font-semibold text-foreground hover:bg-brote-sun/15 hover:shadow-sun-glow"
      >
        <Sparkles className="h-4 w-4 text-brote-sun" />
        Brote+ · sin anuncios y con extras
        <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
      </Link>

      {/* Kids have no social feed at all (08 §2), so no tabs to show. */}
      {!isKid && profile?.id && <ProfileTabs userId={profile.id} isMe displayName={profile.displayName ?? null} />}

      <BotonesConsumidor className="border-t border-hairline pt-4" centrado />
    </div>
  );
}
