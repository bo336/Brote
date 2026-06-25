import { Home, Leaf, Compass, Trophy, User, type LucideIcon } from 'lucide-react';

export interface NavItem {
  key: 'hoy' | 'acciones' | 'explorar' | 'ranking' | 'perfil';
  href: string;
  icon: LucideIcon;
  /** The center action tab is visually elevated. */
  elevated?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'hoy', href: '/', icon: Home },
  { key: 'ranking', href: '/ranking', icon: Trophy },
  { key: 'acciones', href: '/acciones', icon: Leaf, elevated: true },
  { key: 'explorar', href: '/explorar', icon: Compass },
  { key: 'perfil', href: '/perfil', icon: User },
];

/** Active-state matcher: exact for '/', prefix for the rest. */
export function isNavActive(itemHref: string, pathname: string): boolean {
  if (itemHref === '/') return pathname === '/';
  return pathname === itemHref || pathname.startsWith(itemHref + '/');
}
