'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { FONDO_LUGAR, SIDEBAR_NAV, TEXTO_LUGAR, isNavActive } from './nav-items';
import { Logo } from '@/components/brand/Logo';
import { useSession } from '@/stores/session';
import { useSumar } from '@/stores/sumar';
import { cn } from '@/lib/utils/cn';

/**
 * La barra lateral del escritorio: Sumar arriba (el verbo de la app) y todos
 * los lugares con nombre y su color (docs/REESTRUCTURA.md D1, D3).
 */
export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const esKid = useSession((x) => x.profile?.accountType) === 'kid';
  const abrir = useSumar((s) => s.abrir);

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-surface px-3 py-5 lg:flex">
      <Link href="/" className="px-3 pb-5">
        <Logo size={30} />
      </Link>

      <button
        type="button"
        onClick={() => abrir('dia')}
        aria-label={t('sumarAria')}
        className="press mb-4 flex items-center justify-center gap-2 rounded-pill bg-hecho px-4 py-2.5 text-body font-semibold text-hecho-foreground shadow-crisp hover:-translate-y-0.5"
      >
        <Plus className="h-5 w-5" strokeWidth={2.6} />
        {t('sumar')}
      </button>

      <nav aria-label="Navegación principal" className="min-h-0 flex-1 overflow-y-auto no-scrollbar">
        <ul className="flex flex-col gap-0.5">
          {SIDEBAR_NAV.filter((item) => !(item.soloAdultos && esKid)).map((item) => {
            const active = isNavActive(item.href, pathname, item.incluye);
            const Icon = item.icon;
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  prefetch={false}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group flex items-center gap-3 rounded-button px-3 py-2.5 text-body font-medium transition-colors duration-150',
                    active
                      ? cn(FONDO_LUGAR[item.lugar], TEXTO_LUGAR[item.lugar])
                      : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground',
                  )}
                >
                  <Icon
                    className={cn('h-5 w-5 transition-colors', !active && cn('group-hover:opacity-100', TEXTO_LUGAR[item.lugar], 'opacity-70'))}
                    strokeWidth={active ? 2.4 : 2}
                  />
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
