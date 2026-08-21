'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { NAV_ITEMS, isNavActive } from './nav-items';
import { haptic } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils/cn';

/** Mobile bottom tab bar with an elevated center action (BUILD_SPEC §3.1). */
export function BottomTabBar() {
  const pathname = usePathname();
  const t = useTranslations('nav');

  return (
    <nav
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur-lg lg:hidden"
      aria-label="Navegación principal"
    >
      <ul className="mx-auto flex max-w-md items-end justify-around px-2 pt-1.5">
        {NAV_ITEMS.map((item) => {
          const active = isNavActive(item.href, pathname);
          const Icon = item.icon;

          if (item.elevated) {
            return (
              <li key={item.key} className="relative -mt-6">
                <Link
                  href={item.href}
                  prefetch={false}
                  onClick={() => haptic('light')}
                  aria-label={t(item.key)}
                  aria-current={active ? 'page' : undefined}
                  className="flex flex-col items-center"
                >
                  <span
                    className={cn(
                      'flex h-14 w-14 items-center justify-center rounded-full shadow-soft-lg ring-4 ring-surface transition-all duration-200 active:scale-95',
                      active ? 'bg-brote-green-deep shadow-glow' : 'bg-primary hover:-translate-y-0.5',
                    )}
                  >
                    <Icon className="h-7 w-7 text-primary-foreground" strokeWidth={2.4} />
                  </span>
                  <span className={cn('mt-0.5 text-caption font-medium', active ? 'text-primary' : 'text-muted-foreground')}>
                    {t(item.key)}
                  </span>
                </Link>
              </li>
            );
          }

          return (
            <li key={item.key}>
              <Link
                href={item.href}
                prefetch={false}
                onClick={() => haptic('light')}
                aria-current={active ? 'page' : undefined}
                className="group relative flex min-w-14 flex-col items-center gap-0.5 px-2 py-2"
              >
                {/*
                  A tinted pill that glides between tabs, rather than a 4px dot
                  pinned above the icon — the dot was easy to miss and sat half
                  outside the tap target.
                */}
                {active && (
                  <motion.span
                    layoutId="tab-pill"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    className="absolute inset-x-1 top-1 h-8 rounded-pill bg-primary/12"
                  />
                )}
                <Icon
                  className={cn(
                    'relative h-6 w-6 transition-all duration-200',
                    active ? 'scale-105 text-primary' : 'text-muted-foreground group-hover:text-foreground',
                  )}
                  strokeWidth={active ? 2.4 : 2}
                />
                <span
                  className={cn(
                    'relative text-caption font-medium transition-colors duration-200',
                    active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                  )}
                >
                  {t(item.key)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
