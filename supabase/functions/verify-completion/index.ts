// verify-completion (BUILD_SPEC §10.1, §11.3)
// Gemini-vision verification of a pending photo_ai completion. Resolves the
// newest pending completion for the authenticated user + activity, asks Gemini
// for a JSON verdict, then flips it via award_verified (verified/rejected).
// On any AI failure/quota → auto_approve_completion (honor level, no bonus).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';
import { corsHeaders, json } from '../_shared/cors.ts';
import { geminiJSON, GeminiUnavailable, type GeminiPart } from '../_shared/gemini.ts';

interface Verdict {
  plausible: boolean;
  confidence: number;
  matches_activity: boolean;
  looks_authentic: boolean;
  reasoning: string;
  flags: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(url, serviceKey);

  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return json({ error: 'no_auth' }, 401);
    const { data: userData } = await admin.auth.getUser(token);
    const user = userData.user;
    if (!user) return json({ error: 'invalid_auth' }, 401);

    const { activity_id, completion_id } = await req.json().catch(() => ({}));

    // Find the target pending completion.
    let q = admin
      .from('activity_completions')
      .select('id, activity_id, photo_url, user_id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('completed_at', { ascending: false })
      .limit(1);
    if (completion_id) q = admin.from('activity_completions').select('id, activity_id, photo_url, user_id').eq('id', completion_id);
    else if (activity_id) q = q.eq('activity_id', activity_id);

    const { data: comps } = await q;
    const comp = comps?.[0];
    if (!comp || comp.user_id !== user.id) return json({ ok: true, skipped: 'no_pending' });

    const { data: activity } = await admin.from('activities').select('title_es, description_es').eq('id', comp.activity_id).single();

    // Try Gemini vision. Any failure → honor-level fallback.
    try {
      if (!comp.photo_url) throw new GeminiUnavailable('no_photo');
      const { data: signed } = await admin.storage.from('verifications').createSignedUrl(comp.photo_url, 120);
      if (!signed?.signedUrl) throw new GeminiUnavailable('no_signed_url');
      const imgRes = await fetch(signed.signedUrl);
      const buf = new Uint8Array(await imgRes.arrayBuffer());
      const b64 = btoa(String.fromCharCode(...buf));

      const prompt =
        `Sos un verificador. Evaluá si la imagen muestra de forma plausible esta acción ambiental real: "${activity?.title_es}". ` +
        `Sé indulgente con intentos honestos y estricto con imágenes claramente falsas, de stock, generadas por IA, duplicadas o irrelevantes. ` +
        `Respondé SOLO un JSON con: plausible (bool), confidence (0-1), matches_activity (bool), looks_authentic (bool), reasoning (string corto en español), flags (array de strings).`;

      const parts: GeminiPart[] = [{ text: prompt }, { inlineData: { mimeType: 'image/jpeg', data: b64 } }];
      const verdict = await geminiJSON<Verdict>(parts, { timeoutMs: 20000 });

      const verified =
        !!verdict.plausible && !!verdict.matches_activity && !!verdict.looks_authentic && Number(verdict.confidence) >= 0.5;

      const { data: result } = await admin.rpc('award_verified', {
        p_completion_id: comp.id,
        p_ai_result: verdict,
        p_verified: verified,
      });
      return json({ ok: true, verified, result });
    } catch (e) {
      if (e instanceof GeminiUnavailable) {
        const { data: result } = await admin.rpc('auto_approve_completion', { p_completion_id: comp.id });
        return json({ ok: true, fallback: true, result });
      }
      throw e;
    }
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'failed' }, 500);
  }
});
