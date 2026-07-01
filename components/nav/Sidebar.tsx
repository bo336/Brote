'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { NAV_ITEMS, isNavActive } from './nav-items';
import { Logo } from '@/components/brand/Logo';
import { cn } from '@/lib/utils/cn';

/** Desktop left sidebar (BUILD_SPEC §3.1). Hidden on mobile. */
export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations('nav');

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-surface px-3 py-5 lg:flex">
      <Link href="/" className="px-3 pb-6">
        <Logo size={30} />
      </Link>
      <nav aria-label="Navegación principal">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isNavActive(item.href, pathname);
            const Icon = item.icon;
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  prefetch={false}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-button px-3 py-2.5 text-body font-medium transition-colors',
                    active ? 'bg-primary/12 text-primary' : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground',
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
                  {t(item.key)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
