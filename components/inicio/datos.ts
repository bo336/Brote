'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchMyImpact, fetchMyImpactSince } from '@/lib/api/impacto';
import { fetchMundoAbierto } from '@/lib/api/home';
import { fetchMapa } from '@/lib/api/academia';
import { fetchPulse } from '@/lib/api/feed';
import { getMercadoDestacado } from '@/lib/mercado/acciones';
import { esFallo, type Mapa, type UnidadDelMapa } from '@/lib/academia/modelo';
import { useSession } from '@/stores/session';

/**
 * The queries Inicio shares between its cards. Same keys as the sections they
 * lead to (`['academia','mapa']`, `['feed-pulse']`, `['mercado',…]`), so a card
 * on Inicio is also a prefetch: tapping it opens a section that is already
 * loaded.
 */

export function useImpactoTotal() {
  return useQuery({ queryKey: ['impact', 'total'], queryFn: fetchMyImpact, staleTime: 60_000 });
}

/** Today only (Buenos Aires day), for the "+70 L hoy" deltas. */
export function useImpactoHoy() {
  return useQuery({ queryKey: ['impact', 'today'], queryFn: () => fetchMyImpactSince(1), staleTime: 60_000 });
}

export function useMundoAbierto() {
  return useQuery({ queryKey: ['mundo-enabled'], queryFn: fetchMundoAbierto, staleTime: 10 * 60_000 });
}

export function useMapaAcademia(enabled = true) {
  return useQuery({ queryKey: ['academia', 'mapa'], queryFn: fetchMapa, staleTime: 60_000, enabled });
}

export function usePulsoPlaza(enabled = true) {
  return useQuery({ queryKey: ['feed-pulse'], queryFn: fetchPulse, staleTime: 5 * 60_000, enabled });
}

/** The Mercado's picks for this person — nothing for a kid account. */
export function useMercadoDestacado(enabled = true) {
  const tipo = useSession((s) => s.profile?.accountType);
  return useQuery({
    queryKey: ['mercado', 'destacados'],
    queryFn: () => getMercadoDestacado(4),
    staleTime: 5 * 60_000,
    enabled: enabled && !!tipo && tipo !== 'kid',
  });
}

/** Products for one domain (the action just done). Same key as `<EnElMercado>`. */
export function useMercadoDeTema(dominio: string | null) {
  const tipo = useSession((s) => s.profile?.accountType);
  return useQuery({
    queryKey: ['mercado', 'dominio', dominio],
    // Same limit as `<EnElMercado>`: one key, one shape of data.
    queryFn: () => getMercadoDestacado(10, dominio),
    staleTime: 10 * 60_000,
    enabled: !!dominio && !!tipo && tipo !== 'kid',
  });
}

export function mapaOk(data: unknown): Mapa | null {
  return data && !esFallo(data as Mapa) ? (data as Mapa) : null;
}

/**
 * The next unit worth opening in one branch (a domain): one in progress first,
 * then the first available. Null when the branch has nothing open.
 */
export function unidadEnRama(mapa: Mapa | null, rama: string | null): UnidadDelMapa | null {
  if (!mapa || !rama) return null;
  const r = mapa.ramas.find((x) => x.slug === rama);
  if (!r) return null;
  return (
    r.unidades.find((u) => u.estado === 'en_curso') ??
    r.unidades.find((u) => u.estado === 'disponible') ??
    null
  );
}
