'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cambiarAccion,
  fetchAccionesDeHoy,
  fetchMisCaminos,
  fetchSugeridas,
  type DiaDeAcciones,
} from '@/lib/api/acciones';
import { localDate } from '@/lib/utils/dates';
import type { MotivoCambio } from '@/lib/acciones/reglas';

export const KEY_DIA = () => ['acciones-de-hoy', localDate()] as const;

/** El set de hoy con sus motivos, los cambios que quedan y la efeméride. */
export function useAccionesDeHoy() {
  return useQuery({ queryKey: KEY_DIA(), queryFn: fetchAccionesDeHoy, staleTime: 5 * 60_000 });
}

/**
 * "Más acciones" para hoy o "Para vos" del catálogo. No se refresca con cada
 * acción marcada (ver lib/refresh.ts): así lo que hiciste sigue a la vista,
 * tachado, en vez de desaparecer de la lista.
 */
export function useSugeridas(tipo: 'daily' | 'catalog', limit = 6, enabled = true) {
  return useQuery({
    queryKey: ['sugeridas', tipo, limit, localDate()],
    queryFn: () => fetchSugeridas(tipo, limit),
    staleTime: 30 * 60_000,
    enabled,
  });
}

export function useMisCaminos(enabled = true) {
  return useQuery({ queryKey: ['mis-caminos'], queryFn: fetchMisCaminos, staleTime: 5 * 60_000, enabled });
}

/**
 * Cambiar una acción del día. La nueva ocupa el mismo lugar en la lista, sin
 * esperar a que se vuelva a pedir el día.
 */
export function useCambiarAccion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { activityId: string; motivo: MotivoCambio; contexto?: string | null }) =>
      cambiarAccion(v.activityId, v.motivo, v.contexto),
    onSuccess: (res, v) => {
      if (!res.ok) return;
      qc.setQueryData<DiaDeAcciones>(KEY_DIA(), (prev) => {
        if (!prev) return prev;
        const acciones = res.nueva
          ? prev.acciones.map((a) => (a.id === v.activityId ? res.nueva! : a))
          : prev.acciones.filter((a) => a.id !== v.activityId);
        return { ...prev, acciones, cambiosRestantes: res.cambiosRestantes ?? Math.max(0, prev.cambiosRestantes - 1) };
      });
      // Lo que se descartó puede cambiar lo que se sugiere y los caminos visibles.
      qc.invalidateQueries({ queryKey: ['sugeridas'] });
      if (res.contextoActualizado) qc.invalidateQueries({ queryKey: ['mis-caminos'] });
    },
  });
}
