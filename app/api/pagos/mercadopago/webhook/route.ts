import { NextResponse, type NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import {
  MP_API,
  claveEvento,
  firmaValida,
  idDeNotificacion,
  tipoDeEvento,
} from '@/lib/pagos/mercadopago';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * El webhook de MercadoPago: LA fuente de verdad del cobro (09 §4.3).
 *
 * Las cuatro reglas, en orden de importancia:
 *
 * 1. **Se valida la firma.** Sin `MP_WEBHOOK_SECRET` configurado, se rechaza
 *    todo: un webhook sin validar es una API pública para regalar
 *    suscripciones. Falla cerrado, siempre.
 * 2. **No se le cree al cuerpo.** Trae un id; con ese id se le pregunta a
 *    MercadoPago y ESA respuesta es la verdad.
 * 3. **Idempotencia.** El evento se registra con una llave única antes de
 *    hacer nada: el mismo aviso dos veces entra una sola vez. Y el estado se
 *    aplica igual dos veces sin avisar ni despublicar dos veces, porque la
 *    función de la base solo actúa cuando el estado CAMBIA.
 * 4. **200 rápido.** Lo que falle queda anotado sin `procesado_at` y lo
 *    reintenta el cron: MercadoPago no tiene por qué enterarse de que nuestra
 *    base tuvo un mal segundo.
 *
 * Este endpoint atiende también a Brote+ (personas). MercadoPago manda todo a
 * una sola URL: si la referencia externa es una empresa, es una suscripción de
 * empresa; si no, es una persona y sigue por `apply_subscription_event`, que
 * ya existía.
 */
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  let cuerpo: Record<string, unknown> = {};
  try {
    cuerpo = (await request.json()) as Record<string, unknown>;
  } catch {
    /* MercadoPago a veces avisa solo por querystring */
  }

  const tipo = String(cuerpo.type ?? cuerpo.topic ?? url.searchParams.get('type') ?? url.searchParams.get('topic') ?? '');
  const dataId = idDeNotificacion(cuerpo, url);
  if (!dataId) return NextResponse.json({ ok: true, ignorado: 'sin_id' });

  // 1. Firma.
  if (
    !firmaValida(process.env.MP_WEBHOOK_SECRET, {
      firma: request.headers.get('x-signature'),
      requestId: request.headers.get('x-request-id'),
      dataId,
    })
  ) {
    return NextResponse.json({ error: 'firma_invalida' }, { status: 401 });
  }

  const token = process.env.MP_ACCESS_TOKEN;
  if (!token || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'no_configurado' }, { status: 503 });
  }

  const supabase = createServiceClient();
  const clave = claveEvento(cuerpo, tipo, dataId);

  // 3. Idempotencia, antes de tocar nada.
  const { data: nuevo, error: errRegistro } = await supabase.rpc('pagos_evento_registrar', {
    p_clave: clave,
    p_tipo: tipo,
    p_data_id: dataId,
    p_payload: cuerpo as never,
  });
  if (errRegistro) return NextResponse.json({ error: 'no_registrado' }, { status: 500 });
  if (nuevo === false) return NextResponse.json({ ok: true, duplicado: true });

  try {
    const resultado = await procesar(supabase, token, tipo, dataId);
    await supabase.rpc('pagos_evento_cerrar', { p_clave: clave, p_resultado: resultado as never });
    return NextResponse.json({ ok: true, ...resultado });
  } catch (e) {
    // Queda sin cerrar a propósito: el cron lo reintenta.
    return NextResponse.json({ ok: true, pendiente: true, detalle: e instanceof Error ? e.message : 'error' });
  }
}

type Cliente = ReturnType<typeof createServiceClient>;

/**
 * Le pregunta a MercadoPago qué pasó de verdad y lo aplica. Exportada para que
 * el cron reintente exactamente lo mismo.
 */
export async function procesar(
  supabase: Cliente,
  token: string,
  tipo: string,
  dataId: string,
): Promise<Record<string, unknown>> {
  const clase = tipoDeEvento(tipo);
  const headers = { Authorization: `Bearer ${token}` };

  let preapprovalId = dataId;
  let pago: string | null = null;

  if (clase === 'authorized_payment') {
    // Un cobro del mes: dice a qué suscripción pertenece y si entró o no.
    const r = await fetch(`${MP_API}/authorized_payments/${dataId}`, { headers });
    if (!r.ok) throw new Error(`authorized_payment ${r.status}`);
    const ap = (await r.json()) as {
      preapproval_id?: string;
      status?: string;
      payment?: { status?: string };
    };
    preapprovalId = String(ap.preapproval_id ?? '');
    const estadoPago = ap.payment?.status ?? ap.status;
    pago = estadoPago === 'approved' || estadoPago === 'processed' ? 'approved' : 'rejected';
    if (!preapprovalId) return { ignorado: 'pago_sin_suscripcion' };
  } else if (clase === 'payment') {
    const r = await fetch(`${MP_API}/v1/payments/${dataId}`, { headers });
    if (!r.ok) throw new Error(`payment ${r.status}`);
    const p = (await r.json()) as { metadata?: { preapproval_id?: string }; status?: string };
    preapprovalId = String(p.metadata?.preapproval_id ?? '');
    if (!preapprovalId) return { ignorado: 'pago_suelto' };
    pago = p.status === 'approved' ? 'approved' : 'rejected';
  } else if (clase !== 'preapproval') {
    return { ignorado: tipo || 'tipo_desconocido' };
  }

  // 2. La verdad viene de acá, nunca del cuerpo del aviso.
  const r = await fetch(`${MP_API}/preapproval/${preapprovalId}`, { headers });
  if (!r.ok) throw new Error(`preapproval ${r.status}`);
  const sub = (await r.json()) as {
    id?: string;
    status?: string;
    external_reference?: string;
    next_payment_date?: string;
    reason?: string;
    auto_recurring?: { transaction_amount?: number; currency_id?: string };
  };

  const referencia = String(sub.external_reference ?? '');
  if (!referencia) return { ignorado: 'sin_referencia' };

  const { data: negocioId } = await supabase.rpc('pagos_negocio_de_referencia', { p_ref: referencia });

  if (!negocioId) {
    // No es una empresa: es Brote+ de una persona, que ya tenía su camino.
    const { error } = await supabase.rpc('apply_subscription_event', {
      p_user_id: referencia,
      p_external_id: String(sub.id ?? preapprovalId),
      p_status: String(sub.status ?? 'pending'),
      p_amount: sub.auto_recurring?.transaction_amount ?? null,
      p_currency: sub.auto_recurring?.currency_id ?? 'ARS',
      p_period_end: sub.next_payment_date ?? null,
      p_raw: sub as never,
    });
    if (error) throw new Error(error.message);
    return { destino: 'persona' };
  }

  const plan = planDeRazon(sub.reason);
  const { data, error } = await supabase.rpc('negocio_suscripcion_aplicar', {
    p_business: negocioId,
    p_external_id: String(sub.id ?? preapprovalId),
    p_estado: String(sub.status ?? 'pending'),
    p_pago: pago,
    p_plan: plan,
    p_monto: sub.auto_recurring?.transaction_amount ?? null,
    p_moneda: sub.auto_recurring?.currency_id ?? 'ARS',
    p_periodo_fin: sub.next_payment_date ?? null,
    p_raw: sub as never,
  });
  if (error) throw new Error(error.message);
  return { destino: 'negocio', resultado: data };
}

/** El plan viaja en el `reason` que escribimos nosotros al crear la suscripción. */
export function planDeRazon(reason: string | undefined): 'semilla' | 'raiz' | 'bosque' | null {
  const r = (reason ?? '').toLowerCase();
  if (r.includes('bosque')) return 'bosque';
  if (r.includes('raíz') || r.includes('raiz')) return 'raiz';
  if (r.includes('semilla')) return 'semilla';
  return null;
}
