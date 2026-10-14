'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { cambiarPreapproval, configMp, crearPreapproval, urlApp } from '@/lib/pagos/mp-servidor';

/**
 * Brote+ desde el servidor de la app (LANZAMIENTO F5, D11).
 *
 * Antes lo hacía la edge function `mp-subscribe`, con el token de Mercado Pago
 * guardado en los secretos de Supabase, mientras el webhook lo leía de Vercel:
 * dos lugares para la misma credencial. Ahora todo el cobro —Brote+, tiendas y
 * empresas— vive acá y en el webhook, con las variables de Vercel.
 *
 * El monto lo decide la base (`plus_cotizar`), que además frena a menores, a
 * quien ya está suscripto y la venta cerrada.
 */

export type ResultadoPlus = { ok: true; init_point?: string } | { ok: false; error: string };

export async function iniciarBrotePlus(periodo: 'mes' | 'anio'): Promise<ResultadoPlus> {
  if (!configMp().cobrar) return { ok: false, error: 'no_configurado' };
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'no_autenticado' };

  const { data, error } = await supabase.rpc('plus_cotizar', { p_periodo: periodo });
  if (error) return { ok: false, error: 'error' };
  const c = data as { ok: boolean; error?: string; monto?: number; frecuencia?: number; email?: string; razon?: string };
  if (!c.ok || !c.monto) return { ok: false, error: c.error ?? 'error' };

  const app = urlApp();
  const mp = await crearPreapproval({
    reason: c.razon,
    external_reference: user.id,
    payer_email: c.email ?? user.email,
    back_url: `${app}/brote-plus?estado=volvio`,
    auto_recurring: {
      frequency: c.frecuencia ?? 1,
      frequency_type: 'months',
      transaction_amount: c.monto,
      currency_id: 'ARS',
    },
    status: 'pending',
  });
  if (!mp.ok) return { ok: false, error: mp.error };

  // Queda anotada como pendiente antes de mandar a pagar: el webhook la
  // encuentra aunque el aviso de Mercado Pago llegue en un segundo.
  await createServiceClient().rpc('apply_subscription_event', {
    p_user_id: user.id,
    p_external_id: mp.data.id,
    p_status: 'pending',
    p_amount: c.monto,
    p_currency: 'ARS',
    p_period_end: null,
    p_raw: mp.data as never,
  });
  return { ok: true, init_point: mp.data.init_point };
}

/** Darse de baja: se le pide a Mercado Pago; el webhook confirma y aplica. */
export async function cancelarBrotePlus(): Promise<ResultadoPlus> {
  const supabase = createClient();
  const { data: externo, error } = await supabase.rpc('plus_suscripcion_externa');
  if (error || !externo) return { ok: false, error: 'sin_suscripcion' };
  const ok = await cambiarPreapproval(String(externo), { status: 'cancelled' });
  if (!ok) return { ok: false, error: 'mp_error' };
  // No esperar al webhook para que la pantalla lo diga: se aplica igual que él.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await createServiceClient().rpc('apply_subscription_event', {
      p_user_id: user.id,
      p_external_id: String(externo),
      p_status: 'cancelled',
      p_amount: null,
      p_currency: 'ARS',
      p_period_end: null,
      p_raw: { cancelada_desde: 'app' } as never,
    });
  }
  revalidatePath('/brote-plus');
  return { ok: true };
}

/**
 * Qué falta configurar del lado del servidor, para el panel. Sólo dice SI
 * cada variable está, nunca su valor; y sólo a quien pasa la contraseña.
 */
export async function estadoCobroServidor(pass: string): Promise<{
  ok: boolean;
  mp_token?: boolean;
  mp_webhook?: boolean;
  mp_vincular?: boolean;
  service_role?: boolean;
  webhook_url?: string;
}> {
  const { data } = await createClient().rpc('admin_check', { p_pass: pass });
  if (data !== true) return { ok: false };
  return {
    ok: true,
    mp_token: !!process.env.MP_ACCESS_TOKEN,
    mp_webhook: !!process.env.MP_WEBHOOK_SECRET,
    mp_vincular: !!(process.env.MP_CLIENT_ID && process.env.MP_CLIENT_SECRET),
    service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    webhook_url: `${urlApp()}/api/pagos/mercadopago/webhook`,
  };
}
