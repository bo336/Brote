'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchCupoProyectos, fetchMiRango } from '@/lib/api/rangos';
import { RANGO_POR_TIER } from '@/lib/rangos';
import { useSession } from '@/stores/session';

/** Mi rango de este período. Se comparte entre pantallas: es una sola consulta. */
export function useMiRango() {
  const userId = useSession((s) => s.profile?.id);
  return useQuery({
    queryKey: ['mi-rango', userId],
    queryFn: fetchMiRango,
    enabled: !!userId,
    staleTime: 60_000,
  });
}

/**
 * El nombre de un rango. Los nombres se editan en el panel: el espejo de
 * `lib/rangos.ts` es sólo lo que se muestra hasta que llega lo de la base.
 */
export function useNombreRango(): (tier: number) => string {
  const { data } = useMiRango();
  return (tier) => data?.rangos.find((r) => r.tier === tier)?.nombre ?? RANGO_POR_TIER[tier]?.nombre ?? '';
}

/** Cuántos proyectos puedo organizar ahora y cuántos me quedan (0137). */
export function useCupoProyectos() {
  const userId = useSession((s) => s.profile?.id);
  return useQuery({
    queryKey: ['proyecto-cupo', userId],
    queryFn: fetchCupoProyectos,
    enabled: !!userId,
    staleTime: 60_000,
  });
}
