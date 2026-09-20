// mp-negocio — suscripción de una EMPRESA a un plan de Brote (fase 4 §4.1).
//
// Se llama `mp-negocio` y no `mp-subscribe` porque `mp-subscribe` ya existe y
// es el de Brote+ (personas): pisarlo dejaría a las personas sin poder
// suscribirse. Las dos funciones hablan con la misma cuenta de MercadoPago y
// las dos avisan al mismo webhook, que distingue por `external_reference`.
//
// Sin SDK (09 §4.2): `fetch` contra la API REST. El access token vive sólo del
// lado del servidor y el precio SIEMPRE lo calcula la base
// (`negocio_plan_cotizar`), nunca el cliente.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';
import { corsHeaders, json } from '../_shared/cors.ts';

const MP_API = 'https://api.mercadopago.com';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = Deno.env.get('SUPABASE_URL')!;
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const token = Deno.env.get('MP_ACCESS_TOKEN');
  const appUrl = Deno.env.get('APP_URL') ?? 'https://brote-ft7m.vercel.app';

  try {
    const auth = req.headers.get('Authorization') ?? '';
    const jwt = auth.replace('Bearer ', '');
    if (!jwt) return json({ ok: false, error: 'no_autenticado' }, 401);

    const { data: userData } = await admin.auth.getUser(jwt);
    const user = userData.user;
    if (!user) return json({ ok: false, error: 'no_autenticado' }, 401);

    // Todo lo que decide permisos se pregunta CON LA SESIÓN DE LA PERSONA: si
    // no es dueña de esa empresa, la base contesta que no.
    const comoPersona = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });

    const body = (await req.json().catch(() => ({}))) as {
      negocio_id?: string;
      plan?: string;
      accion?: 'suscribir' | 'cancelar';
    };
    const negocioId = body.negocio_id;
    if (!negocioId) return json({ ok: false, error: 'falta_negocio' }, 400);

    if (body.accion === 'cancelar') {
      const { data: externo } = await comoPersona.rpc('negocio_suscripcion_externa', { p_business: negocioId });
      if (!externo) return json({ ok: false, error: 'sin_suscripcion' }, 404);
      if (!token) return json({ ok: false, error: 'no_configurado' }, 503);
      const r = await fetch(`${MP_API}/preapproval/${externo}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      if (!r.ok) return json({ ok: false, error: 'mp_error', detalle: await r.text() }, 502);
      // El webhook confirma el estado; acá no se toca la base.
      return json({ ok: true, cancelada: true });
    }

    const plan = body.plan === 'raiz' || body.plan === 'bosque' ? body.plan : 'semilla';
    const { data: cotizacion, error: errCot } = await comoPersona.rpc('negocio_plan_cotizar', {
      p_business: negocioId,
      p_plan: plan,
    });
    if (errCot) return json({ ok: false, error: 'sin_permiso' }, 403);
    const c = cotizacion as {
      ok: boolean;
      error?: string;
      monto?: number;
      moneda?: string;
      inicio?: string | null;
      razon?: string;
    } | null;
    if (!c?.ok) return json({ ok: false, error: c?.error ?? 'sin_permiso' }, 400);
    if (!token) return json({ ok: false, error: 'no_configurado' }, 503);

    const preapproval: Record<string, unknown> = {
      reason: c.razon,
      external_reference: negocioId, // ← el hilo que conecta todo
      payer_email: user.email,
      back_url: `${appUrl}/negocio/plan?estado=pendiente`,
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
    };

    const r = await fetch(`${MP_API}/preapproval`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(preapproval),
    });
    const data = await r.json();
    if (!r.ok) return json({ ok: false, error: 'mp_error', detalle: data?.message ?? data }, 502);

    // Queda anotada como pendiente para que el webhook la encuentre por su id.
    await admin.rpc('negocio_suscripcion_registrar', {
      p_business: negocioId,
      p_external_id: String(data.id),
      p_plan: plan,
      p_monto: c.monto,
      p_moneda: c.moneda ?? 'ARS',
      p_raw: data,
    });

    return json({ ok: true, id: data.id, init_point: data.init_point ?? data.sandbox_init_point });
  } catch (e) {
    return json({ ok: false, error: 'falló', detalle: e instanceof Error ? e.message : 'desconocido' }, 500);
  }
});
