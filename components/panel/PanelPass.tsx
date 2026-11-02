'use client';

import { CUENTA } from '@/lib/api/admin';

/**
 * El panel ya no usa contraseña: lo abre la sesión de la cuenta del dueño (0136).
 * Las funciones de la base siguen recibiendo `p_pass` (se ignora), así que esto
 * le da a cada pantalla el valor que tiene que pasar, sin que tenga que saberlo.
 */
export function usePanelPass() {
  return { pass: CUENTA };
}
