import { NextResponse, type NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { procesar } from '@/app/api/pagos/mercadopago/webhook/route';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * El cobro diario (fase 4 §4.4), como respaldo de `pg_cron` —que ya lo corre a
 * las 02:00 AR— y, sobre todo, como el lugar donde se REINTENTA lo que el
 * webhook no pudo terminar: para volver a preguntarle a MercadoPago hace falta
 * el access token, y eso vive acá, no en la base.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: true, skipped: 'no_service_key' });
  }

  const supabase = createServiceClient();
  const salida: Record<string, unknown> = {};

  const { data, error } = await supabase.rpc('brote_negocios_cobro');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  salida.cobro = data;

  const token = process.env.MP_ACCESS_TOKEN;
  if (token) {
    const { data: pendientes } = await supabase.rpc('pagos_eventos_pendientes', { p_limit: 20 });
    const lista = (pendientes ?? []) as { clave: string; tipo: string; data_id: string }[];
    let ok = 0;
    for (const e of lista) {
      try {
        const resultado = await procesar(supabase, token, e.tipo, e.data_id);
        await supabase.rpc('pagos_evento_cerrar', { p_clave: e.clave, p_resultado: resultado as never });
        ok += 1;
      } catch {
        // Queda pendiente con un intento más; a los 6 se abandona.
        await supabase.rpc('pagos_evento_cerrar', { p_clave: e.clave, p_resultado: null as never });
      }
    }
    salida.reintentos = { total: lista.length, ok };
  }

  return NextResponse.json({ ok: true, ...salida });
}
