'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchCupoProyectos, fetchMiLiga } from '@/lib/api/ligas';
import { LIGA_POR_TIER } from '@/lib/ligas';
import { useSession } from '@/stores/session';

/** Mi liga de esta semana. Se comparte entre pantallas: es una sola consulta. */
export function useMiLiga() {
  const userId = useSession((s) => s.profile?.id);
  return useQuery({
    queryKey: ['mi-liga', userId],
    queryFn: fetchMiLiga,
    enabled: !!userId,
    staleTime: 60_000,
  });
}

/**
 * El nombre de una liga. Los nombres se editan en el panel: el espejo de
 * `lib/ligas.ts` es sólo lo que se muestra hasta que llega lo de la base.
 */
export function useNombreLiga(): (tier: number) => string {
  const { data } = useMiLiga();
  return (tier) => data?.ligas.find((l) => l.tier === tier)?.nombre ?? LIGA_POR_TIER[tier]?.nombre ?? '';
}

/** Cuántos proyectos puedo organizar ahora y cuántos me quedan (0137, 0142). */
export function useCupoProyectos() {
  const userId = useSession((s) => s.profile?.id);
  return useQuery({
    queryKey: ['proyecto-cupo', userId],
    queryFn: fetchCupoProyectos,
    enabled: !!userId,
    staleTime: 60_000,
  });
}
