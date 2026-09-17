import type { BusinessRole } from '@/lib/supabase/rows-negocio';

/**
 * Quién puede qué, en un solo lugar (fase 1 §3.2).
 *
 * Esto decide qué se MUESTRA. Lo que se PUEDE hacer lo decide la base: cada
 * RPC vuelve a chequear el rol con `brote_can_write`. Si esta tabla y la base
 * no coinciden, gana la base y la interfaz muestra un botón que falla.
 */
export const PERMISOS = {
  editar_negocio: ['owner', 'admin'],
  gestionar_equipo: ['owner'],
  gestionar_plan: ['owner'],
  crear_listado: ['owner', 'admin', 'editor'],
  gestionar_objetivos: ['owner', 'admin', 'editor'],
  eliminar_negocio: ['owner'],
} as const satisfies Record<string, readonly BusinessRole[]>;

export type AccionNegocio = keyof typeof PERMISOS;

export function puede(rol: BusinessRole | null | undefined, accion: AccionNegocio): boolean {
  if (!rol) return false;
  return (PERMISOS[accion] as readonly BusinessRole[]).includes(rol);
}
