'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { BarChart3, CreditCard, LayoutDashboard, MessageCircleQuestion, Package, ShieldCheck, Store, Target, Trophy, type LucideIcon } from 'lucide-react';
import { ChipRail } from '@/components/ui/chip-rail';
import { cn } from '@/lib/utils/cn';
import { normalizarObjetivo, seccionesDe, type SeccionNegocio } from '@/lib/negocio/objetivo';

/**
 * Solo las secciones que existen, y solo las que corresponden a lo que la
 * empresa vino a hacer (0121): una tienda ve lo que vende; una empresa que
 * mejora, su programa y su liga (`lib/negocio/objetivo.ts`).
 */
type Seccion = { clave: SeccionNegocio; href: string; icono: LucideIcon };

const SECCION: Record<SeccionNegocio, Omit<Seccion, 'clave'>> = {
  resumen: { href: '/negocio', icono: LayoutDashboard },
  mejora: { href: '/negocio/mejora', icono: Target },
  liga: { href: '/negocio/liga', icono: Trophy },
  productos: { href: '/negocio/listados', icono: Package },
  preguntas: { href: '/negocio/preguntas', icono: MessageCircleQuestion },
  tienda: { href: '/negocio/tienda', icono: Store },
  analitica: { href: '/negocio/analitica', icono: BarChart3 },
  verificacion: { href: '/negocio/verificacion', icono: ShieldCheck },
  plan: { href: '/negocio/plan', icono: CreditCard },
};

type Props = { modelo?: string | null; objetivo?: string | null };

function secciones({ modelo, objetivo }: Props): Seccion[] {
  return seccionesDe(normalizarObjetivo(objetivo, modelo), modelo).map((clave) => ({ clave, ...SECCION[clave] }));
}

function activa(href: string, pathname: string): boolean {
  return href === '/negocio' ? pathname === '/negocio' : pathname === href || pathname.startsWith(`${href}/`);
}

/** Barra lateral de 220 px en escritorio. */
export function NavLateral(props: Props) {
  const t = useTranslations('negocio.nav');
  const pathname = usePathname();
  const SECCIONES = secciones(props);

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
export function NavChips(props: Props) {
  const t = useTranslations('negocio.nav');
  const pathname = usePathname();
  const router = useRouter();
  const SECCIONES = secciones(props);
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
