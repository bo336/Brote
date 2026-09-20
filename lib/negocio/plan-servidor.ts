import 'server-only';

import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { EstadoPlan } from '@/lib/negocio/plan';
import type { DatosSugerencias } from '@/lib/negocio/sugerencias';

/**
 * Lecturas del plan y de la analítica, en el servidor y siempre por RPC: quién
 * puede ver qué lo decide la base, no la pantalla.
 */

export interface Analitica {
  dias: number;
  plan: 'semilla' | 'raiz' | 'bosque';
  completa: boolean;
  totales: {
    impresiones: number;
    salidas: number;
    tasa: number | null;
    reportes_resueltos: number;
  };
  listados: {
    id: string;
    titulo: string;
    slug: string;
    status: string;
    impresiones: number;
    salidas: number;
  }[];
  origenes: Record<string, number> | null;
  serie: { dia: string; impresiones: number; salidas: number }[] | null;
}

export const getEstadoPlan = cache(async (negocioId: string): Promise<EstadoPlan | null> => {
  const { data } = await createClient().rpc('negocio_plan_estado', { p_business: negocioId });
  return (data as EstadoPlan | null) ?? null;
});

export const getAnalitica = cache(async (negocioId: string, dias = 30): Promise<Analitica | null> => {
  const { data } = await createClient().rpc('negocio_analitica', { p_business: negocioId, p_dias: dias });
  return (data as Analitica | null) ?? null;
});

export const getDatosSugerencias = cache(async (negocioId: string): Promise<DatosSugerencias | null> => {
  const { data } = await createClient().rpc('negocio_sugerencias_datos', { p_business: negocioId });
  return (data as DatosSugerencias | null) ?? null;
});
