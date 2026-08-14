import { Home, Leaf, Compass, Trophy, User, GraduationCap, type LucideIcon } from 'lucide-react';

export interface NavItem {
  key: 'hoy' | 'acciones' | 'explorar' | 'ranking' | 'perfil' | 'aprender';
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

/**
 * Sidebar-only destinations. The mobile bar keeps exactly five tabs because
 * its centre tab is visually elevated — a sixth would knock that off centre.
 * On mobile, Aprendé is reached from the card on the home screen instead.
 */
export const SECONDARY_NAV: NavItem[] = [{ key: 'aprender', href: '/aprender', icon: GraduationCap }];

/** Active-state matcher: exact for '/', prefix for the rest. */
export function isNavActive(itemHref: string, pathname: string): boolean {
  if (itemHref === '/') return pathname === '/';
  return pathname === itemHref || pathname.startsWith(itemHref + '/');
}
