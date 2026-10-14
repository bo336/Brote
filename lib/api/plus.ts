'use client';

import { createClient } from '@/lib/supabase/client';

export interface PrecioPlus {
  periodo: 'mes' | 'anio';
  usd: number;
  ars: number | null;
  tipo_cambio: number | null;
  fecha: string | null;
}

export interface EstadoPlus {
  ok: boolean;
  tipo: 'kid' | 'teen' | 'adult';
  es_plus: boolean;
  hasta: string | null;
  suscripcion: {
    estado: 'pending' | 'authorized' | 'paused' | 'cancelled' | 'expired';
    monto: number | null;
    moneda: string;
    proximo: string | null;
    periodo: 'mes' | 'anio';
  } | null;
  venta_activa: boolean;
  precios: { mes: PrecioPlus; anio: PrecioPlus };
  protectores: number;
}

export async function fetchEstadoPlus(): Promise<EstadoPlus | null> {
  const { data, error } = await createClient().rpc('plus_estado');
  if (error || !data || (data as { ok?: boolean }).ok === false) return null;
  return data as EstadoPlus;
}

export interface MesImpacto {
  mes: string;
  acciones: number;
  dias: number;
  agua_l: number;
  co2_kg: number;
  residuos_kg: number;
  energia_kwh: number;
  tema: string | null;
}

export async function fetchImpactoMensual(): Promise<{ plus: boolean; meses: MesImpacto[] }> {
  const { data, error } = await createClient().rpc('mi_impacto_mensual');
  if (error || !data) return { plus: false, meses: [] };
  const d = data as { plus?: boolean; meses?: MesImpacto[] };
  return { plus: !!d.plus, meses: d.meses ?? [] };
}
