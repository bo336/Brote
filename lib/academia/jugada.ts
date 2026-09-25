'use client';

/**
 * La sesión en curso, en memoria y en `sessionStorage`.
 *
 * `academia_empezar` cobra la savia y devuelve los pasos en la misma llamada:
 * volver a pedirlos empezando de nuevo cobraría otra vez. Así que la pantalla
 * que arranca la sesión le pasa los pasos al jugador por acá, y el jugador
 * sobrevive a un F5 leyendo `sessionStorage`. Si eso falla (modo privado,
 * otra pestaña), `academia_retomar` es la fuente autoritativa y trae además
 * las correcciones de lo ya respondido.
 *
 * `sessionStorage` y no `localStorage`: una sesión abandonada ayer o en otra
 * pestaña no tiene por qué reaparecer.
 */

import { create } from 'zustand';
import type { Correccion, Paso, Sesion } from '@/lib/academia/modelo';

const CLAVE = 'brote.academia.jugada.v2';

export interface EstadoJugada {
  sesion: Sesion | null;
  /** Índice del paso actual dentro de `sesion.pasos`. */
  indice: number;
  /** Corrección por `entrega_id`. */
  correcciones: Record<string, Correccion>;
  /** Cuántas veces apareció Pip por una racha de errores. Tope: una. */
  pipUsado: number;
}

interface Acciones {
  abrir: (sesion: Sesion) => void;
  /** Suma pasos nuevos (un re-encolado) sin duplicar los que ya están. */
  sumarPasos: (pasos: Paso[]) => void;
  corregir: (entregaId: string, c: Correccion) => void;
  avanzar: () => void;
  usarPip: () => void;
  cerrar: () => void;
  restaurar: (intentoId: string) => boolean;
}

const VACIO: EstadoJugada = { sesion: null, indice: 0, correcciones: {}, pipUsado: 0 };

function guardar(e: EstadoJugada) {
  if (typeof window === 'undefined' || !e.sesion) return;
  try {
    window.sessionStorage.setItem(CLAVE, JSON.stringify(e));
  } catch {
    // Cuota llena o modo privado: se sigue en memoria y el rescate es el RPC.
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

/**
 * Dónde retomar una sesión que viene del servidor con parte respondida: en el
 * primer paso corregible sin responder, pero mostrando antes la teoría que lo
 * precede si todavía no se pasó por ella.
 */
export function indiceParaRetomar(pasos: Paso[]): number {
  const i = pasos.findIndex((p) => p.graduable && !p.respondido);
  if (i < 0) return Math.max(0, pasos.length - 1);
  let j = i;
  while (j > 0 && !pasos[j - 1]!.graduable) j -= 1;
  // Si esa teoría está después del último respondido, se muestra; si no, no.
  const ultimoRespondido = pasos.reduce((m, p, k) => (p.respondido ? k : m), -1);
  return j > ultimoRespondido ? j : i;
}

export const useJugada = create<EstadoJugada & Acciones>((set, get) => ({
  ...VACIO,

  abrir: (sesion) => {
    const correcciones: Record<string, Correccion> = {};
    for (const p of sesion.pasos) if (p.correccion) correcciones[p.entrega_id] = p.correccion;
    const algoRespondido = sesion.pasos.some((p) => p.respondido);
    const e: EstadoJugada = {
      sesion,
      indice: algoRespondido ? indiceParaRetomar(sesion.pasos) : 0,
      correcciones,
      pipUsado: 0,
    };
    set(e);
    guardar(e);
  },

  sumarPasos: (pasos) => {
    const { sesion } = get();
    if (!sesion) return;
    const vistos = new Set(sesion.pasos.map((p) => p.entrega_id));
    const nuevos = pasos.filter((p) => !vistos.has(p.entrega_id));
    if (!nuevos.length) return;
    const actualizada = { ...sesion, pasos: [...sesion.pasos, ...nuevos].sort((a, b) => a.orden - b.orden) };
    set({ sesion: actualizada });
    guardar({ ...get(), sesion: actualizada });
  },

  corregir: (entregaId, c) => {
    const correcciones = { ...get().correcciones, [entregaId]: c };
    set({ correcciones });
    guardar({ ...get(), correcciones });
  },

  avanzar: () => {
    const indice = get().indice + 1;
    set({ indice });
    guardar({ ...get(), indice });
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

  restaurar: (intentoId) => {
    if (typeof window === 'undefined') return false;
    try {
      const crudo = window.sessionStorage.getItem(CLAVE);
      if (!crudo) return false;
      const e = JSON.parse(crudo) as EstadoJugada;
      if (!e?.sesion || e.sesion.intento_id !== intentoId) return false;
      set(e);
      return true;
    } catch {
      borrar();
      return false;
    }
  },
}));
