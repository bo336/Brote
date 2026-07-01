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
                      'flex h-14 w-14 items-center justify-center rounded-full shadow-soft-lg transition-transform active:scale-95',
                      active ? 'bg-brote-green-deep' : 'bg-primary',
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
                className="relative flex min-w-14 flex-col items-center gap-0.5 px-2 py-2"
              >
                <Icon
                  className={cn('h-6 w-6 transition-colors', active ? 'text-primary' : 'text-muted-foreground')}
                  strokeWidth={active ? 2.4 : 2}
                />
                <span className={cn('text-caption font-medium transition-colors', active ? 'text-primary' : 'text-muted-foreground')}>
                  {t(item.key)}
                </span>
                {active && (
                  <motion.span
                    layoutId="tab-dot"
                    className="absolute -top-0.5 h-1 w-1 rounded-full bg-primary"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
