'use client';

/**
 * La sesión en curso, en memoria y en `sessionStorage`.
 *
 * POR QUÉ EXISTE. `academia_start_session` cobra la savia y devuelve los pasos
 * en la misma llamada. No hay forma de volver a pedirlos empezando de nuevo:
 * eso cobraría otra vez. Así que la pantalla que arranca la sesión tiene que
 * pasarle los pasos al jugador, y el jugador tiene que sobrevivir a un F5.
 *
 * `sessionStorage` y no `localStorage` a propósito: una sesión abandonada en
 * otra pestaña, o de ayer, no tiene por qué reaparecer. Y si el rescate falla,
 * el jugador cae en `academia_pendientes`, que es la fuente autoritativa —
 * esto es solo el atajo que evita el viaje.
 */

import { create } from 'zustand';
import type { PasoSesion, RespuestaCorregida, Sesion } from '@/lib/academia/types';

const CLAVE = 'brote.academia.sesion';

export interface EstadoJugada {
  sesion: Sesion | null;
  /** Índice del paso actual dentro de `sesion.pasos`. */
  indice: number;
  /** Corrección por `orden` de paso. Sobrevive a la recarga. */
  correcciones: Record<number, RespuestaCorregida>;
  /** Cuántas veces apareció Pip. Tope duro: 3 por sesión. */
  pipUsado: number;
}

interface Acciones {
  abrir: (sesion: Sesion) => void;
  reemplazarPasos: (pasos: PasoSesion[]) => void;
  agregarPasos: (pasos: PasoSesion[]) => void;
  corregir: (orden: number, r: RespuestaCorregida) => void;
  avanzar: () => void;
  irA: (i: number) => void;
  usarPip: () => void;
  cerrar: () => void;
  restaurar: (sesionId: string) => EstadoJugada | null;
}

const VACIO: EstadoJugada = { sesion: null, indice: 0, correcciones: {}, pipUsado: 0 };

function guardar(e: EstadoJugada) {
  if (typeof window === 'undefined' || !e.sesion) return;
  try {
    window.sessionStorage.setItem(CLAVE, JSON.stringify(e));
  } catch {
    // Modo privado, cuota llena, lo que sea. Se sigue jugando en memoria y el
    // rescate pasa a ser `academia_pendientes`.
  }
}

function borrar() {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(CLAVE);
  } catch {
    /* ídem */
  }
}

export const useJugada = create<EstadoJugada & Acciones>((set, get) => ({
  ...VACIO,

  abrir: (sesion) => {
    const e: EstadoJugada = { sesion, indice: 0, correcciones: {}, pipUsado: 0 };
    set(e);
    guardar(e);
  },

  reemplazarPasos: (pasos) => {
    const { sesion } = get();
    if (!sesion) return;
    set({ sesion: { ...sesion, pasos } });
    guardar({ ...get(), sesion: { ...sesion, pasos } });
  },

  agregarPasos: (pasos) => {
    const { sesion } = get();
    if (!sesion) return;
    // Un paso re-encolado puede llegar dos veces si se reintenta la consulta.
    const vistos = new Set(sesion.pasos.map((p) => p.entrega_id));
    const nuevos = pasos.filter((p) => p.entrega_id && !vistos.has(p.entrega_id));
    if (nuevos.length === 0) return;
    const actualizada = { ...sesion, pasos: [...sesion.pasos, ...nuevos] };
    set({ sesion: actualizada });
    guardar({ ...get(), sesion: actualizada });
  },

  corregir: (orden, r) => {
    const correcciones = { ...get().correcciones, [orden]: r };
    set({ correcciones });
    guardar({ ...get(), correcciones });
  },

  avanzar: () => {
    const indice = get().indice + 1;
    set({ indice });
    guardar({ ...get(), indice });
  },

  irA: (i) => {
    set({ indice: i });
    guardar({ ...get(), indice: i });
  },

  usarPip: () => {
    const pipUsado = get().pipUsado + 1;
    set({ pipUsado });
    guardar({ ...get(), pipUsado });
  },

  cerrar: () => {
    set(VACIO);
    borrar();
  },

  restaurar: (sesionId) => {
    if (typeof window === 'undefined') return null;
    let crudo: string | null = null;
    try {
      crudo = window.sessionStorage.getItem(CLAVE);
    } catch {
      return null;
    }
    if (!crudo) return null;
    try {
      const e = JSON.parse(crudo) as EstadoJugada;
      if (!e?.sesion || e.sesion.sesion_id !== sesionId) return null;
      set(e);
      return e;
    } catch {
      borrar();
      return null;
    }
  },
}));
