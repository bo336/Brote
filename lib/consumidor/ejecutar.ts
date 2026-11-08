import 'server-only';

import { createServiceClient } from '@/lib/supabase/server';
import { cambiarPreapproval, pagosDeSuscripcion, reembolsarPago } from '@/lib/pagos/mp-servidor';

/**
 * Lo que de verdad hace cada pedido (0147): dar de baja en Mercado Pago,
 * devolver lo cobrado y cerrar el pedido con su código. Lo usan el botón (con
 * la sesión de quien pide) y el panel (con la del dueño). Todo con la clave de
 * servicio: nada de esto pasa por el navegador.
 */

export interface DatosCobro {
  codigo: string;
  tipo: 'arrepentimiento' | 'baja';
  servicio: string;
  estado: string;
  user_id: string | null;
  plus: { external_id: string | null; estado: string; alta: string; monto: number | null } | null;
  ya_reembolsada: boolean;
  negocios: { id: string; external_id: string | null; estado: string }[];
}

export interface Reembolso {
  pago: string;
  id: string;
  monto: number | null;
}

const ACTIVA = ['authorized', 'paused', 'pending'];
const NEGOCIO_ACTIVA = ['activa', 'en_gracia', 'pendiente'];

export const pesos = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n).replace(/\s/g, ' ');

export async function datosCobro(codigo: string): Promise<DatosCobro | null> {
  const { data, error } = await createServiceClient().rpc('consumidor_datos_cobro', { p_codigo: codigo });
  if (error || !data) return null;
  return data as DatosCobro;
}

export async function marcar(codigo: string, estado: 'en_proceso' | 'resuelta' | 'rechazada', resolucion: string, detalle: Record<string, unknown> = {}) {
  await createServiceClient().rpc('consumidor_marcar', {
    p_codigo: codigo,
    p_estado: estado,
    p_resolucion: resolucion,
    p_detalle: detalle as never,
  });
}

/** Baja de Brote+: no se cobra más y sigue hasta el final de lo pagado. */
export async function bajaPlus(d: DatosCobro, desde: string): Promise<{ ok: true; yaEstaba: boolean } | { ok: false; error: string }> {
  if (!d.user_id || !d.plus?.external_id) return { ok: false, error: 'sin_suscripcion' };
  if (!ACTIVA.includes(d.plus.estado)) return { ok: true, yaEstaba: true };
  const ok = await cambiarPreapproval(d.plus.external_id, { status: 'cancelled' });
  if (!ok) return { ok: false, error: 'mp_error' };
  await createServiceClient().rpc('apply_subscription_event', {
    p_user_id: d.user_id,
    p_external_id: d.plus.external_id,
    p_status: 'cancelled',
    p_amount: null,
    p_currency: 'ARS',
    p_period_end: null,
    p_raw: { cancelada_desde: desde } as never,
  });
  return { ok: true, yaEstaba: false };
}

/**
 * Arrepentimiento de Brote+: se da de baja, se devuelve todo lo cobrado de esa
 * suscripción y Brote+ termina en el momento. Si una devolución falla, lo ya
 * devuelto queda anotado y el resto lo termina el dueño.
 */
export async function arrepentimientoPlus(
  d: DatosCobro,
  desde: string,
): Promise<{ ok: true; devuelto: number; reembolsos: Reembolso[] } | { ok: false; error: string; reembolsos: Reembolso[]; bajaHecha: boolean }> {
  const baja = await bajaPlus(d, desde);
  if (!baja.ok) return { ok: false, error: baja.error, reembolsos: [], bajaHecha: false };

  const pagos = await pagosDeSuscripcion(d.plus!.external_id!);
  if (pagos === null) return { ok: false, error: 'mp_pagos', reembolsos: [], bajaHecha: true };

  const reembolsos: Reembolso[] = [];
  for (const p of pagos.filter((x) => x.estado === 'approved')) {
    const r = await reembolsarPago(p.id);
    if (!r.ok) return { ok: false, error: r.error, reembolsos, bajaHecha: true };
    reembolsos.push({ pago: p.id, id: r.id, monto: r.monto ?? p.monto });
  }
  await createServiceClient().rpc('plus_revocar', { p_user: d.user_id });
  const devuelto = reembolsos.reduce((n, r) => n + (r.monto ?? 0), 0);
  return { ok: true, devuelto, reembolsos };
}

/** Baja del plan de una tienda o una empresa de la que esta persona es dueña. */
export async function bajaNegocio(d: DatosCobro, negocioId: string): Promise<{ ok: true; yaEstaba: boolean } | { ok: false; error: string }> {
  const n = d.negocios.find((x) => x.id === negocioId);
  if (!n?.external_id) return { ok: false, error: 'sin_suscripcion' };
  if (!NEGOCIO_ACTIVA.includes(n.estado)) return { ok: true, yaEstaba: true };
  const ok = await cambiarPreapproval(n.external_id, { status: 'cancelled' });
  // El webhook de Mercado Pago aplica el estado nuevo, como en la baja desde /negocio/plan.
  return ok ? { ok: true, yaEstaba: false } : { ok: false, error: 'mp_error' };
}
