'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { FONDO_LUGAR, NAV_ITEMS, TEXTO_LUGAR, isNavActive } from './nav-items';
import { useSumar } from '@/stores/sumar';
import { haptic } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils/cn';

/**
 * La barra del celular: Hoy · Explorar · (+) · Plaza · Liga
 * (docs/REESTRUCTURA.md D3).
 *
 * Cada pestaña activa se prende con el color de su lugar —la Plaza en coral,
 * la Liga en índigo—, así la barra misma dice que Brote es un pueblo de
 * lugares distintos. El centro es el único verde fuerte: Sumar, el verbo de la
 * app, abre una hoja desde cualquier pantalla en vez de llevar a otra.
 */
export function BottomTabBar() {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const abrir = useSumar((s) => s.abrir);
  const abierta = useSumar((s) => s.abierta);

  return (
    <nav
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur-lg lg:hidden"
      aria-label="Navegación principal"
    >
      <ul className="mx-auto flex max-w-md items-end justify-around px-2 pt-1.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;

          if (item.elevated) {
            return (
              <li key={item.key} className="relative -mt-6">
                <button
                  type="button"
                  onClick={() => {
                    haptic('light');
                    abrir('dia');
                  }}
                  aria-label={t('sumarAria')}
                  aria-haspopup="dialog"
                  aria-expanded={abierta}
                  className="group flex flex-col items-center"
                >
                  <span
                    className={cn(
                      'flex h-14 w-14 items-center justify-center rounded-full bg-hecho text-hecho-foreground shadow-soft-lg ring-4 ring-surface transition-all duration-200 group-hover:-translate-y-0.5 group-active:scale-95',
                      abierta && 'rotate-45',
                    )}
                  >
                    <Icon className="h-7 w-7" strokeWidth={2.6} />
                  </span>
                  <span className="mt-0.5 text-caption font-semibold text-foreground">{t(item.key)}</span>
                </button>
              </li>
            );
          }

          const active = isNavActive(item.href, pathname, item.incluye);
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                prefetch={false}
                onClick={() => haptic('light')}
                aria-current={active ? 'page' : undefined}
                className="group relative flex min-w-14 flex-col items-center gap-0.5 px-2 py-2"
              >
                {active && (
                  <motion.span
                    layoutId="tab-pill"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    className={cn('absolute inset-x-1 top-1 h-8 rounded-pill', FONDO_LUGAR[item.lugar])}
                  />
                )}
                <Icon
                  className={cn(
                    'relative h-6 w-6 transition-all duration-200',
                    active ? cn('scale-105', TEXTO_LUGAR[item.lugar]) : 'text-muted-foreground group-hover:text-foreground',
                  )}
                  strokeWidth={active ? 2.4 : 2}
                />
                <span
                  className={cn(
                    'relative text-caption font-medium transition-colors duration-200',
                    active ? TEXTO_LUGAR[item.lugar] : 'text-muted-foreground group-hover:text-foreground',
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
