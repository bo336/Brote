// send-push v2 (docs/LANZAMIENTO.md F3) — vacía la cola de avisos.
//
// No recibe textos: cualquier cuerpo del pedido se ignora. Toma de la base los
// avisos vencidos (`brote_push_tomar`), los manda por Web Push a cada
// dispositivo de esa persona y cierra cada uno (`brote_push_cerrar`). Así sólo
// se puede empujar lo que existe en `notifications`, que escribe la base.
//
// La llaman: el cron `brote-push` (cada minuto, sólo si hay algo vencido) y el
// trigger `notifications_push_despertar` (como mucho cada 10 s), sin clave:
// SE DESPLIEGA CON "Verify JWT" APAGADO. Es seguro porque no confía en nada del
// pedido: lo peor que puede hacer quien la llame es adelantar un envío que
// igual iba a salir.
//
// Claves VAPID: si están los secretos (VAPID_PUBLIC_KEY o
// NEXT_PUBLIC_VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY), mandan ellos y la pública
// se copia a `push_config` para que la app se suscriba con la misma. Si no hay
// secretos, la primera vez genera un par y lo guarda en `push_config` (tabla sin
// acceso desde el cliente). Nadie tiene que configurar nada para que funcione.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';
import webpush from 'npm:web-push@3.6.7';
import { corsHeaders, json } from '../_shared/cors.ts';

interface Aviso {
  id: string;
  user_id: string;
  titulo: string;
  cuerpo: string;
  url: string;
  etiqueta: string;
}
interface Sub {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

const LOTE = 200;
const SIMULTANEOS = 20;

// deno-lint-ignore no-explicit-any
async function claves(admin: any): Promise<{ publica: string; privada: string; sujeto: string } | null> {
  const envPub = Deno.env.get('VAPID_PUBLIC_KEY') ?? Deno.env.get('NEXT_PUBLIC_VAPID_PUBLIC_KEY');
  const envPriv = Deno.env.get('VAPID_PRIVATE_KEY');
  const sujeto = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:hola@brote.app';

  const { data: fila } = await admin.from('push_config').select('public_key, private_key, subject').eq('id', 1).maybeSingle();

  if (envPub && envPriv) {
    if (!fila || fila.public_key !== envPub) {
      await admin
        .from('push_config')
        .upsert({ id: 1, public_key: envPub, private_key: null, subject: sujeto, origen: 'secretos' });
    }
    return { publica: envPub, privada: envPriv, sujeto };
  }

  if (fila?.public_key && fila?.private_key) {
    return { publica: fila.public_key, privada: fila.private_key, sujeto: fila.subject ?? sujeto };
  }

  // Primera vez sin secretos: generar y guardar. Si dos llamadas compiten,
  // gana la primera inserción y la otra relee. Si quedó una fila de secretos
  // que ya no están (sin privada), se reemplaza: los dispositivos viejos se
  // vuelven a suscribir solos al abrir la app.
  const par = webpush.generateVAPIDKeys();
  const nueva = { id: 1, public_key: par.publicKey, private_key: par.privateKey, subject: sujeto, origen: 'generada' };
  if (fila) await admin.from('push_config').upsert(nueva);
  else await admin.from('push_config').insert(nueva);
  const { data: final } = await admin.from('push_config').select('public_key, private_key, subject').eq('id', 1).maybeSingle();
  if (!final?.public_key || !final?.private_key) return null;
  return { publica: final.public_key, privada: final.private_key, sujeto: final.subject ?? sujeto };
}

/** Corre `fn` sobre `items` con como mucho `n` a la vez. */
async function enParalelo<T>(items: T[], n: number, fn: (x: T) => Promise<void>) {
  let i = 0;
  const trabajadores = Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) {
      const x = items[i++]!;
      await fn(x);
    }
  });
  await Promise.all(trabajadores);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const k = await claves(admin);
    if (!k) return json({ ok: false, error: 'sin_claves' }, 500);
    webpush.setVapidDetails(k.sujeto, k.publica, k.privada);

    let enviadas = 0;
    let fallidas = 0;
    let vueltas = 0;
    const inicio = Date.now();

    // Hasta vaciar lo vencido o 40 segundos, lo que pase primero.
    while (vueltas < 10 && Date.now() - inicio < 40_000) {
      vueltas++;
      const { data: avisos, error } = await admin.rpc('brote_push_tomar', { p_limite: LOTE });
      if (error) return json({ ok: false, error: error.message }, 500);
      const lote = (avisos ?? []) as Aviso[];
      if (lote.length === 0) break;

      const personas = Array.from(new Set(lote.map((a) => a.user_id)));
      const { data: subsData } = await admin
        .from('push_subscriptions')
        .select('id, user_id, endpoint, p256dh, auth')
        .in('user_id', personas);
      const subs = (subsData ?? []) as Sub[];
      const porPersona = new Map<string, Sub[]>();
      for (const s of subs) porPersona.set(s.user_id, [...(porPersona.get(s.user_id) ?? []), s]);

      const resultados: { id: string; ok: boolean; detalle?: string }[] = [];
      const muertas: string[] = [];

      await enParalelo(lote, SIMULTANEOS, async (a) => {
        const destinos = porPersona.get(a.user_id) ?? [];
        if (destinos.length === 0) {
          resultados.push({ id: a.id, ok: false, detalle: 'sin_dispositivo' });
          return;
        }
        const payload = JSON.stringify({ title: a.titulo, body: a.cuerpo, url: a.url, tag: a.etiqueta, id: a.id });
        let alguna = false;
        let ultimo = '';
        for (const s of destinos) {
          try {
            await webpush.sendNotification(
              { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
              payload,
              { TTL: 60 * 60 * 12, urgency: a.etiqueta === 'admin' ? 'high' : 'normal' },
            );
            alguna = true;
          } catch (err) {
            const code = (err as { statusCode?: number }).statusCode;
            ultimo = `http_${code ?? 'x'}`;
            // 404/410: el navegador dio de baja la suscripción. 403: la clave
            // cambió desde que se suscribió (se volverá a suscribir al abrir).
            if (code === 404 || code === 410 || code === 403) muertas.push(s.id);
          }
        }
        resultados.push({ id: a.id, ok: alguna, detalle: alguna ? undefined : ultimo || 'error' });
      });

      if (muertas.length) await admin.from('push_subscriptions').delete().in('id', muertas);
      await admin.rpc('brote_push_cerrar', { p_resultados: resultados });
      enviadas += resultados.filter((r) => r.ok).length;
      fallidas += resultados.filter((r) => !r.ok).length;
      if (lote.length < LOTE) break;
    }

    return json({ ok: true, enviadas, fallidas });
  } catch (e) {
    return json({ ok: false, error: e instanceof Error ? e.message : 'error' }, 500);
  }
});
