'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { BizPlan } from '@/lib/negocio/plan';

/**
 * Server actions del plan (fase 4 §4 y §6).
 *
 * Nada de esto decide nada: el precio lo calcula la base, el estado lo decide
 * el webhook con lo que dice MercadoPago, y los permisos los vuelve a chequear
 * cada RPC. Acá solo se llama y se traduce el resultado.
 */

export type Resultado = { ok: true; init_point?: string } | { ok: false; error: string };

export async function iniciarSuscripcion(negocioId: string, plan: BizPlan): Promise<Resultado> {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke('mp-negocio', {
    body: { negocio_id: negocioId, plan, accion: 'suscribir' },
  });
  if (error) {
    // Supabase envuelve el no-2xx: se rescata el mensaje propio de la función.
    let motivo = 'no_disponible';
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx) motivo = ((await ctx.json()) as { error?: string })?.error ?? motivo;
    } catch {
      /* el motivo genérico alcanza */
    }
    return { ok: false, error: motivo };
  }
  const r = data as { ok?: boolean; error?: string; init_point?: string } | null;
  if (!r?.ok || !r.init_point) return { ok: false, error: r?.error ?? 'no_disponible' };
  return { ok: true, init_point: r.init_point };
}

export async function cancelarSuscripcion(negocioId: string): Promise<Resultado> {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke('mp-negocio', {
    body: { negocio_id: negocioId, accion: 'cancelar' },
  });
  if (error) return { ok: false, error: 'no_disponible' };
  const r = data as { ok?: boolean; error?: string } | null;
  if (!r?.ok) return { ok: false, error: r?.error ?? 'no_disponible' };
  revalidatePath('/negocio/plan');
  return { ok: true };
}

export async function guardarAvisos(
  negocioId: string,
  avisos: { listados?: boolean; mejora?: boolean; cuenta?: boolean },
): Promise<Resultado> {
  const { data, error } = await createClient().rpc('negocio_avisos_guardar', {
    p_business: negocioId,
    p_avisos: avisos,
  });
  if (error) return { ok: false, error: 'error' };
  const r = data as { ok?: boolean; error?: string } | null;
  if (!r?.ok) return { ok: false, error: r?.error ?? 'error' };
  return { ok: true };
}

/** El historial público de mejora, objetivo por objetivo (fase 4 §8). */
export async function marcarObjetivoPublico(goalId: string, valor: boolean): Promise<Resultado> {
  const { data, error } = await createClient().rpc('objetivo_publico', { p_goal: goalId, p_valor: valor });
  if (error) return { ok: false, error: 'error' };
  const r = data as { ok?: boolean; error?: string } | null;
  if (!r?.ok) return { ok: false, error: r?.error ?? 'error' };
  revalidatePath(`/negocio/mejora/${goalId}`);
  return { ok: true };
}
