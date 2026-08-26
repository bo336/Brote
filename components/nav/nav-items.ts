import { Home, Leaf, MessagesSquare, Trophy, User, GraduationCap, type LucideIcon } from 'lucide-react';

export interface NavItem {
  key: 'hoy' | 'acciones' | 'plaza' | 'ranking' | 'perfil' | 'aprender';
  href: string;
  icon: LucideIcon;
  /** The center action tab is visually elevated. */
  elevated?: boolean;
}

/**
 * Still exactly five tabs, centre elevated. "Explorar" became "Plaza" (`/feed`)
 * — the same slot, but it is now the social timeline instead of a news river
 * sharing a tab with Projects. Projects moved under Acciones, because a project
 * IS an action (a group one), so it belongs where people go to act rather than
 * where they go to read.
 */
export const NAV_ITEMS: NavItem[] = [
  { key: 'hoy', href: '/', icon: Home },
  { key: 'ranking', href: '/ranking', icon: Trophy },
  { key: 'acciones', href: '/acciones', icon: Leaf, elevated: true },
  { key: 'plaza', href: '/feed', icon: MessagesSquare },
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
