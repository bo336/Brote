'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Bell } from 'lucide-react';
import { useSession } from '@/stores/session';
import { RankBadge } from '@/components/brand/RankBadge';
import { PointsBadge } from '@/components/brand/PointsBadge';
import { StreakFlame } from '@/components/brand/StreakFlame';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { isStreakAtRisk } from '@/lib/streak';

/**
 * Contextual top bar (BUILD_SPEC §3.3). Always shows the user's rank badge +
 * points (reinforces progression), a notifications bell, and the streak flame.
 */
export function TopBar() {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const tn = useTranslations('topbar');
  const profile = useSession((s) => s.profile);
  const unread = useSession((s) => s.unreadNotifications);

  const totalXp = profile?.totalXp ?? 0;
  const streak = profile?.currentStreak ?? 0;
  const atRisk = isStreakAtRisk(profile?.lastStreakDate ?? null, streak);

  const title = (() => {
    if (pathname === '/') return null; // Home shows the logo
    if (pathname.startsWith('/acciones')) return t('acciones');
    if (pathname.startsWith('/explorar')) return t('explorar');
    if (pathname.startsWith('/ranking')) return t('ranking');
    if (pathname.startsWith('/perfil')) return t('perfil');
    return null;
  })();

  return (
    <header className="pt-safe sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-2 px-4">
        <div className="flex min-w-0 items-center gap-2">
          {title ? (
            <h1 className="truncate font-display text-h2 font-bold">{title}</h1>
          ) : (
            <Logo size={26} />
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <StreakFlame count={streak} atRisk={atRisk} size="sm" />
          <Link href="/perfil" prefetch={false} aria-label={`${tn('streakLabel')} · ${totalXp}`} className="hidden xs:flex">
            <PointsBadge value={totalXp} size="sm" animate />
          </Link>
          <Link href="/perfil" prefetch={false} aria-label="Rango" className="ml-0.5">
            <RankBadge totalXp={totalXp} size={36} />
          </Link>
          <Link
            href="/notificaciones"
            prefetch={false}
            aria-label={tn('notifications')}
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-brote-coral ring-2 ring-background" />
            )}
          </Link>
          <ThemeToggle className="hidden sm:inline-flex" />
        </div>
      </div>
    </header>
  );
}
