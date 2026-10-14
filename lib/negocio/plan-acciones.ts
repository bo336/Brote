'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { cambiarPreapproval, configMp, crearPreapproval, urlApp } from '@/lib/pagos/mp-servidor';
import type { BizPlan } from '@/lib/negocio/plan';

/**
 * Server actions del plan (fase 4 §4 y §6).
 *
 * Nada de esto decide nada: el precio lo calcula la base, el estado lo decide
 * el webhook con lo que dice MercadoPago, y los permisos los vuelve a chequear
 * cada RPC. Acá se llama, se habla con Mercado Pago y se traduce el resultado.
 */

export type Resultado = { ok: true; init_point?: string } | { ok: false; error: string };

/**
 * Suscribir una empresa a un plan (semilla, raíz o bosque).
 *
 * Desde LANZAMIENTO F5 corre en el servidor de la app, como la tienda
 * (`suscribirVendedor`): una sola credencial de Mercado Pago, en Vercel. La
 * edge function `mp-negocio` quedó retirada. La cotización la hace la base con
 * la sesión de la persona (`negocio_plan_cotizar` exige ser dueña).
 */
export async function iniciarSuscripcion(negocioId: string, plan: BizPlan): Promise<Resultado> {
  if (!configMp().cobrar) return { ok: false, error: 'no_configurado' };
  const supabase = createClient();
  const elegido = plan === 'raiz' || plan === 'bosque' ? plan : 'semilla';
  const { data, error } = await supabase.rpc('negocio_plan_cotizar', { p_business: negocioId, p_plan: elegido });
  if (error) return { ok: false, error: 'sin_permiso' };
  const c = data as { ok: boolean; error?: string; monto?: number; moneda?: string; inicio?: string | null; razon?: string } | null;
  if (!c?.ok || !c.monto) return { ok: false, error: c?.error ?? 'sin_permiso' };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: 'no_autenticado' };

  const mp = await crearPreapproval({
    reason: c.razon,
    external_reference: negocioId,
    payer_email: user.email,
    back_url: `${urlApp()}/negocio/plan?estado=pendiente`,
    auto_recurring: {
      frequency: 1,
      frequency_type: 'months',
      transaction_amount: c.monto,
      currency_id: c.moneda ?? 'ARS',
      // Si todavía está en prueba, el primer cobro es cuando la prueba
      // termina: nadie paga dos veces el mismo mes.
      ...(c.inicio ? { start_date: c.inicio } : {}),
    },
    status: 'pending',
  });
  if (!mp.ok) return { ok: false, error: mp.error };

  const { error: errReg } = await createServiceClient().rpc('negocio_suscripcion_registrar', {
    p_business: negocioId,
    p_external_id: mp.data.id,
    p_plan: elegido,
    p_monto: c.monto,
    p_moneda: c.moneda ?? 'ARS',
    p_raw: mp.data as never,
  });
  if (errReg) return { ok: false, error: 'error' };
  return { ok: true, init_point: mp.data.init_point };
}

/** Darse de baja. El webhook confirma el estado; acá sólo se le pide a Mercado Pago. */
export async function cancelarSuscripcion(negocioId: string): Promise<Resultado> {
  const { data: externo, error } = await createClient().rpc('negocio_suscripcion_externa', { p_business: negocioId });
  if (error || !externo) return { ok: false, error: 'sin_suscripcion' };
  const ok = await cambiarPreapproval(String(externo), { status: 'cancelled' });
  if (!ok) return { ok: false, error: 'mp_error' };
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
