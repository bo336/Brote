'use client';

import { create } from 'zustand';

/**
 * La hoja "Sumar" (el botón del centro de la barra): se abre desde cualquier
 * pantalla. `modo` elige con qué arranca: la lista del día o el formulario de
 * una acción propia (docs/REESTRUCTURA.md D3, D6).
 */
export type ModoSumar = 'dia' | 'propia';

interface SumarState {
  abierta: boolean;
  modo: ModoSumar;
  abrir: (modo?: ModoSumar) => void;
  cerrar: () => void;
}

export const useSumar = create<SumarState>((set) => ({
  abierta: false,
  modo: 'dia',
  abrir: (modo = 'dia') => set({ abierta: true, modo }),
  cerrar: () => set({ abierta: false }),
}));
