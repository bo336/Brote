// recommend-activities (BUILD_SPEC §10.2) — cold-start + daily cached Gemini
// shortlist of catalog slugs + one-line Spanish reasons, stored per user in
// app_state (key recs:<user_id>). The client blends this over the always-on
// content-based score. Degrades silently (content-based remains).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';
import { corsHeaders, json } from '../_shared/cors.ts';
import { geminiJSON } from '../_shared/gemini.ts';

interface RecResult {
  recommendations: { slug: string; reason: string }[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  try {
    let userId: string | undefined;
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (token) {
      const { data } = await admin.auth.getUser(token);
      userId = data.user?.id;
    }
    const body = await req.json().catch(() => ({}));
    userId = userId ?? body.user_id;
    if (!userId) return json({ error: 'no_user' }, 400);

    const { data: profile } = await admin
      .from('profiles')
      .select('interests, context, total_xp')
      .eq('id', userId)
      .single();

    const { data: catalog } = await admin
      .from('activities')
      .select('slug, title_es, domain_slug, impact, effort, min_rank_slug')
      .eq('type', 'catalog')
      .eq('active', true);

    const { data: doneRows } = await admin
      .from('activity_completions')
      .select('activity_id')
      .eq('user_id', userId)
      .eq('activity_type', 'catalog');
    const doneIds = new Set((doneRows ?? []).map((r: { activity_id: string }) => r.activity_id));

    const validSlugs = new Set((catalog ?? []).map((a: { slug: string }) => a.slug));

    try {
      const list = (catalog ?? [])
        .map((a: { slug: string; title_es: string; domain_slug: string; impact: string }) => `${a.slug} | ${a.title_es} | ${a.domain_slug} | impacto:${a.impact}`)
        .join('\n');
      const result = await geminiJSON<RecResult>(
        [
          {
            text:
              `Recomendá 8 acciones del catálogo para esta persona. Intereses: ${(profile?.interests ?? []).join(', ') || 'varios'}. ` +
              `Contexto: ${JSON.stringify(profile?.context ?? {})}. ` +
              `Elegí SOLO slugs de esta lista y devolvé SOLO JSON {recommendations:[{slug, reason}]} con reason = frase corta en español rioplatense (ej: "porque tenés balcón").\n\n${list}`,
          },
        ],
        { timeoutMs: 18000 },
      );

      const recs = (result.recommendations ?? [])
        .filter((r) => validSlugs.has(r.slug))
        .slice(0, 8);

      await admin.from('app_state').upsert({
        key: `recs:${userId}`,
        value: { recommendations: recs, ts: new Date().toISOString() },
        is_public: false,
      });
      return json({ ok: true, count: recs.length });
    } catch (_e) {
      return json({ ok: true, fallback: true, count: 0 });
    }
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'failed' }, 500);
  }
});
