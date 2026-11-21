import {
  Compass,
  GraduationCap,
  Home,
  Leaf,
  MessagesSquare,
  Plus,
  Sprout,
  Store,
  TreePine,
  Trophy,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { Lugar } from '@/lib/lugares';

export interface NavItem {
  key:
    | 'hoy'
    | 'explorar'
    | 'sumar'
    | 'plaza'
    | 'liga'
    | 'acciones'
    | 'aprender'
    | 'mercado'
    | 'mundo'
    | 'proyectos'
    | 'impacto'
    | 'perfil';
  href: string;
  icon: LucideIcon;
  /** El lugar: da el color de la pestaña activa (lib/lugares.ts). */
  lugar: Lugar;
  /** El centro de la barra: no es una página, abre la hoja Sumar. */
  elevated?: boolean;
  /** Menores: el Mercado no existe para una cuenta de chico (08 §9). */
  soloAdultos?: boolean;
  /**
   * Rutas que también prenden esta pestaña. Explorar es el mapa del pueblo:
   * estando en la Academia o en el Mercado, la barra dice que estás ahí.
   */
  incluye?: string[];
}

/**
 * La barra del celular (docs/REESTRUCTURA.md D3): Hoy · Explorar · (+) · Plaza · Liga.
 *
 * El centro dejó de ser una página (el catálogo) y pasó a ser el verbo: Sumar
 * abre una hoja desde cualquier pantalla. La Liga —lo más importante de la
 * semana— tiene pestaña con nombre propio. Explorar junta los lugares que no
 * estaban en la barra (Academia, Tu mundo, Mercado, Acciones, Proyectos). El
 * perfil va al avatar de la barra de arriba.
 */
export const NAV_ITEMS: NavItem[] = [
  { key: 'hoy', href: '/', icon: Home, lugar: 'hoy' },
  {
    key: 'explorar',
    href: '/lugares',
    icon: Compass,
    lugar: 'explorar',
    incluye: ['/acciones', '/aprender', '/mundo', '/mercado', '/proyectos', '/competencias', '/impacto'],
  },
  { key: 'sumar', href: '#sumar', icon: Plus, lugar: 'acciones', elevated: true },
  { key: 'plaza', href: '/feed', icon: MessagesSquare, lugar: 'plaza', incluye: ['/buscar'] },
  { key: 'liga', href: '/ranking', icon: Trophy, lugar: 'liga' },
];

/**
 * La barra lateral (escritorio): todos los lugares con nombre, en el orden del
 * día — lo tuyo, hacer, la gente, aprender y crecer, comprar.
 */
export const SIDEBAR_NAV: NavItem[] = [
  { key: 'hoy', href: '/', icon: Home, lugar: 'hoy' },
  { key: 'explorar', href: '/lugares', icon: Compass, lugar: 'explorar' },
  { key: 'acciones', href: '/acciones', icon: Leaf, lugar: 'acciones', incluye: ['/competencias'] },
  { key: 'plaza', href: '/feed', icon: MessagesSquare, lugar: 'plaza', incluye: ['/buscar'] },
  { key: 'liga', href: '/ranking', icon: Trophy, lugar: 'liga' },
  { key: 'aprender', href: '/aprender', icon: GraduationCap, lugar: 'academia' },
  { key: 'mundo', href: '/mundo', icon: TreePine, lugar: 'mundo' },
  { key: 'proyectos', href: '/acciones?tab=proyectos', icon: Users, lugar: 'proyectos', incluye: ['/proyectos'] },
  { key: 'mercado', href: '/mercado', icon: Store, lugar: 'mercado', soloAdultos: true },
  { key: 'impacto', href: '/impacto', icon: Sprout, lugar: 'impacto' },
  { key: 'perfil', href: '/perfil', icon: User, lugar: 'vos' },
];

function coincide(href: string, pathname: string): boolean {
  const base = href.split('?')[0]!;
  if (base === '/') return pathname === '/';
  return pathname === base || pathname.startsWith(base + '/');
}

/** Active-state matcher: exact for '/', prefix for the rest, plus the item's `incluye`. */
export function isNavActive(itemHref: string, pathname: string, incluye?: string[]): boolean {
  if (coincide(itemHref, pathname)) return true;
  return (incluye ?? []).some((h) => coincide(h, pathname));
}

/**
 * La clase de color de un lugar para texto. Escrita entera (no armada) para
 * que Tailwind la encuentre al compilar.
 */
export const TEXTO_LUGAR: Record<Lugar, string> = {
  hoy: 'text-foreground',
  explorar: 'text-foreground',
  impacto: 'text-foreground',
  vos: 'text-foreground',
  marca: 'text-lugar-acciones',
  acciones: 'text-lugar-acciones',
  plaza: 'text-lugar-plaza',
  liga: 'text-lugar-liga',
  academia: 'text-lugar-academia',
  mundo: 'text-lugar-mundo',
  mercado: 'text-lugar-mercado',
  proyectos: 'text-lugar-proyectos',
};

/** Lo mismo para un fondo tenue (la píldora de la pestaña activa). */
export const FONDO_LUGAR: Record<Lugar, string> = {
  hoy: 'bg-foreground/[0.08]',
  explorar: 'bg-foreground/[0.08]',
  impacto: 'bg-foreground/[0.08]',
  vos: 'bg-foreground/[0.08]',
  marca: 'bg-lugar-acciones/12',
  acciones: 'bg-lugar-acciones/12',
  plaza: 'bg-lugar-plaza/12',
  liga: 'bg-lugar-liga/12',
  academia: 'bg-lugar-academia/12',
  mundo: 'bg-lugar-mundo/12',
  mercado: 'bg-lugar-mercado/12',
  proyectos: 'bg-lugar-proyectos/12',
};

/** Y uno sólido, para íconos sobre color (Explorar, la fila de lugares). */
export const SOLIDO_LUGAR: Record<Lugar, string> = {
  hoy: 'bg-foreground text-background',
  explorar: 'bg-foreground text-background',
  impacto: 'bg-foreground text-background',
  vos: 'bg-foreground text-background',
  marca: 'bg-lugar-acciones text-white dark:text-brote-ink',
  acciones: 'bg-lugar-acciones text-white dark:text-brote-ink',
  plaza: 'bg-lugar-plaza text-white dark:text-brote-ink',
  liga: 'bg-lugar-liga text-white dark:text-brote-ink',
  academia: 'bg-lugar-academia text-white dark:text-brote-ink',
  mundo: 'bg-lugar-mundo text-white dark:text-brote-ink',
  mercado: 'bg-lugar-mercado text-white dark:text-brote-ink',
  proyectos: 'bg-lugar-proyectos text-white dark:text-brote-ink',
};
