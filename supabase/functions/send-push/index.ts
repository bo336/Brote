// send-push (BUILD_SPEC §12.4) — Web Push via VAPID (free). Sends a notification
// to all of a user's push subscriptions; prunes dead ones. Called by other
// functions / cron with { user_id, title, body, url? }.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';
import webpush from 'npm:web-push@3.6.7';
import { corsHeaders, json } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const publicKey = Deno.env.get('NEXT_PUBLIC_VAPID_PUBLIC_KEY') ?? Deno.env.get('VAPID_PUBLIC_KEY');
  const privateKey = Deno.env.get('VAPID_PRIVATE_KEY');
  const subject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:hola@brote.app';
  if (!publicKey || !privateKey) return json({ error: 'no_vapid' }, 500);
  webpush.setVapidDetails(subject, publicKey, privateKey);

  try {
    const { user_id, title, body, url } = await req.json();
    if (!user_id || !title) return json({ error: 'missing_fields' }, 400);

    const { data: subs } = await admin
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', user_id);

    let sent = 0;
    for (const s of (subs ?? []) as { id: string; endpoint: string; p256dh: string; auth: string }[]) {
      const subscription = { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } };
      const payload = JSON.stringify({ title, body: body ?? '', url: url ?? '/' });
      try {
        await webpush.sendNotification(subscription, payload);
        sent++;
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await admin.from('push_subscriptions').delete().eq('id', s.id);
      }
    }
    return json({ ok: true, sent });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'failed' }, 500);
  }
});
