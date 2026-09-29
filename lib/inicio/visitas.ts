'use client';

import { localDate } from '@/lib/utils/dates';
import type { Destino } from './puentes';

/**
 * Qué secciones abrió hoy esta persona desde Inicio — una comodidad de este
 * navegador (localStorage), no un dato que importe perder: sin almacenamiento
 * la tarjeta simplemente no reordena.
 */
const KEY = 'brote.inicio.visitas.v1';

export function leerVisitasDeHoy(): Destino[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const v = JSON.parse(raw) as { dia?: string; destinos?: Destino[] };
    return v.dia === localDate() && Array.isArray(v.destinos) ? v.destinos : [];
  } catch {
    return [];
  }
}

export function marcarVisita(d: Destino): void {
  try {
    const hoy = leerVisitasDeHoy().filter((x) => x !== d);
    localStorage.setItem(KEY, JSON.stringify({ dia: localDate(), destinos: [...hoy, d] }));
  } catch {
    /* private mode: nothing to remember */
  }
}
