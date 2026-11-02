import 'server-only';

import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

/**
 * La guía pública de acciones (0135). Se lee con la clave anónima, sin
 * sesión, y se cachea una hora: es contenido que cambia cuando cambia el
 * catálogo, no cuando alguien entra.
 */

export interface AccionGuia {
  slug: string;
  titulo: string;
  resumen: string | null;
  tema: string;
  minutos: number | null;
  costo: string | null;
  lugar: string | null;
  esfuerzo: string | null;
  agua_l: number;
  co2_kg: number;
  residuos_kg: number;
  energia_kwh: number;
}

export interface AccionGuiaDetalle extends AccionGuia {
  descripcion: string | null;
  pasos: string | null;
  ahorra: boolean;
  con_adulto: boolean;
  equivalencia: string | null;
  fuente: string | null;
  fuente_url: string | null;
  relacionadas: { slug: string; titulo: string; resumen: string | null }[];
}

function anon() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// Un error se lanza DENTRO del caché para que no se guarde: si la base no
// responde (o 0135 todavía no está aplicada), la próxima visita vuelve a
// preguntar en vez de servir una guía vacía durante una hora.
const guiaCache = unstable_cache(
  async (): Promise<AccionGuia[]> => {
    const s = anon();
    if (!s) throw new Error('sin supabase');
    const { data, error } = await s.rpc('guia_publica');
    if (error || !Array.isArray(data)) throw new Error(error?.message ?? 'guia_publica');
    return data as AccionGuia[];
  },
  ['guia-publica'],
  { revalidate: 3600 },
);

const accionCache = unstable_cache(
  async (slug: string): Promise<AccionGuiaDetalle | null> => {
    const s = anon();
    if (!s) throw new Error('sin supabase');
    const { data, error } = await s.rpc('guia_publica_accion', { p_slug: slug });
    if (error) throw new Error(error.message);
    return (data ?? null) as AccionGuiaDetalle | null;
  },
  ['guia-publica-accion'],
  { revalidate: 3600 },
);

export async function leerGuia(): Promise<AccionGuia[]> {
  try {
    return await guiaCache();
  } catch {
    return [];
  }
}

export async function leerAccionGuia(slug: string): Promise<AccionGuiaDetalle | null> {
  if (!/^[a-z0-9-]{2,80}$/.test(slug)) return null;
  try {
    return await accionCache(slug);
  } catch {
    return null;
  }
}

export const COSTO: Record<string, string> = {
  gratis: 'Gratis',
  bajo: 'Costo bajo',
};
