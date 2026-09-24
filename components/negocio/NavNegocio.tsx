'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { BarChart3, CreditCard, LayoutDashboard, MessageCircleQuestion, Package, ShieldCheck, Store, Target, type LucideIcon } from 'lucide-react';
import { ChipRail } from '@/components/ui/chip-rail';
import { cn } from '@/lib/utils/cn';

/**
 * Solo las secciones que existen. Equipo llega con su fase: un enlace a una
 * pantalla que todavía no está es una promesa rota en el lugar más visible del
 * producto.
 */
type Seccion = {
  clave: 'resumen' | 'mejora' | 'listados' | 'analitica' | 'verificacion' | 'plan' | 'productos' | 'preguntas' | 'tienda';
  href: string;
  icono: LucideIcon;
};

const SECCIONES_LEGACY: Seccion[] = [
  { clave: 'resumen', href: '/negocio', icono: LayoutDashboard },
  { clave: 'mejora', href: '/negocio/mejora', icono: Target },
  { clave: 'listados', href: '/negocio/listados', icono: Store },
  { clave: 'analitica', href: '/negocio/analitica', icono: BarChart3 },
  { clave: 'verificacion', href: '/negocio/verificacion', icono: ShieldCheck },
  { clave: 'plan', href: '/negocio/plan', icono: CreditCard },
];

// Mercado v2: una tienda vive de sus productos y de responder. La verificación
// de sitio ya no es un paso (la hace Mercado Pago), y Mejora queda al final:
// es el programa para quien quiere ir más allá.
const SECCIONES_TIENDA: Seccion[] = [
  { clave: 'resumen', href: '/negocio', icono: LayoutDashboard },
  { clave: 'productos', href: '/negocio/listados', icono: Package },
  { clave: 'preguntas', href: '/negocio/preguntas', icono: MessageCircleQuestion },
  { clave: 'tienda', href: '/negocio/tienda', icono: Store },
  { clave: 'analitica', href: '/negocio/analitica', icono: BarChart3 },
  { clave: 'plan', href: '/negocio/plan', icono: CreditCard },
  { clave: 'mejora', href: '/negocio/mejora', icono: Target },
];

function secciones(modelo: 'vendedor' | 'legacy' | undefined): Seccion[] {
  return modelo === 'vendedor' ? SECCIONES_TIENDA : SECCIONES_LEGACY;
}

function activa(href: string, pathname: string): boolean {
  return href === '/negocio' ? pathname === '/negocio' : pathname === href || pathname.startsWith(`${href}/`);
}

/** Barra lateral de 220 px en escritorio. */
export function NavLateral({ modelo }: { modelo?: 'vendedor' | 'legacy' }) {
  const t = useTranslations('negocio.nav');
  const pathname = usePathname();
  const SECCIONES = secciones(modelo);

  return (
    <nav aria-label={t('aria')}>
      <ul className="flex flex-col gap-0.5">
        {SECCIONES.map((s) => {
          const on = activa(s.href, pathname);
          const Icono = s.icono;
          return (
            <li key={s.href} className="relative">
              {on && (
                <motion.span
                  layoutId="negocio-nav-activa"
                  className="absolute inset-0 rounded-button bg-primary/10"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <Link
                href={s.href}
                aria-current={on ? 'page' : undefined}
                className={cn(
                  'relative flex items-center gap-2.5 rounded-button px-3 py-2 text-small font-medium transition-colors duration-150',
                  on ? 'text-primary' : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground',
                )}
              >
                <Icono className="h-4 w-4" strokeWidth={on ? 2.4 : 2} />
                {t(s.clave)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** En móvil, la misma navegación como fila de chips con desplazamiento. */
export function NavChips({ modelo }: { modelo?: 'vendedor' | 'legacy' }) {
  const t = useTranslations('negocio.nav');
  const pathname = usePathname();
  const router = useRouter();
  const SECCIONES = secciones(modelo);
  const actual = SECCIONES.find((s) => activa(s.href, pathname))?.href ?? null;

  return (
    <nav aria-label={t('aria')} className="-mx-4 mb-5 border-b border-hairline px-4 pb-3 lg:hidden">
      <ChipRail
        layoutId="negocio-nav-chips"
        value={actual}
        onChange={(href) => router.push(href)}
        options={SECCIONES.map((s) => ({ value: s.href, label: t(s.clave) }))}
      />
    </nav>
  );
}
