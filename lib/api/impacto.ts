'use client';

import { createClient } from '@/lib/supabase/client';
import { parseImpact, type ImpactTotals } from '@/lib/impact';

/** Lifetime real impact (litres, kg CO₂, kg waste, kWh). */
export async function fetchMyImpact(): Promise<ImpactTotals> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return parseImpact(null);
  const { data, error } = await supabase.rpc('brote_user_impact', { p_uid: user.id });
  if (error) throw error;
  return parseImpact(data);
}

/** Impact within the last N days (default 7) — powers "tu semana". */
export async function fetchMyImpactSince(days = 7): Promise<ImpactTotals> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return parseImpact(null);
  const { data, error } = await supabase.rpc('brote_user_impact_since', { p_uid: user.id, p_days: days });
  if (error) throw error;
  return parseImpact(data);
}

export interface WeeklyPoints {
  points: number;
  actions: number;
  since: string;
}

/** Competition points for the rolling week (never lifetime XP). */
export async function fetchMyWeeklyPoints(): Promise<WeeklyPoints> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('my_weekly_points');
  if (error) throw error;
  const d = (data ?? {}) as Partial<WeeklyPoints>;
  return { points: Number(d.points ?? 0), actions: Number(d.actions ?? 0), since: String(d.since ?? '') };
}

/**
 * Lo que la comunidad ya hizo de verdad (0126): sólo totales, sin cuentas de
 * prueba ni lo del juego, recalculado como mucho cada 10 minutos.
 */
export async function fetchPulsoPublico(): Promise<{ personas: number; acciones: number; agua_l: number; co2_kg: number; residuos_kg: number } | null> {
  const { data, error } = await createClient().rpc('brote_pulso_publico');
  if (error || !data) return null;
  const d = data as Record<string, unknown>;
  const n = (v: unknown) => Number(v ?? 0) || 0;
  return { personas: n(d.personas), acciones: n(d.acciones), agua_l: n(d.agua_l), co2_kg: n(d.co2_kg), residuos_kg: n(d.residuos_kg) };
}
