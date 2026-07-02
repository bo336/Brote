// pip-chat (IMPROVEMENT_PLAN F4) — Pip as a conversational eco-coach.
// Injects the user's real context (rank, streak, world, city, interests) into
// Gemini. Rate-limited per user/day via app_state. Graceful fallback when the
// GEMINI_API_KEY secret is missing or the call fails — the UI never breaks.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';
import { corsHeaders, json } from '../_shared/cors.ts';

const MODEL = 'gemini-1.5-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const DAILY_LIMIT = 30;

interface ChatMessage {
  role: 'user' | 'pip';
  text: string;
}

const FALLBACKS = [
  'Estoy descansando un ratito 🌱 Mientras tanto: ¿ya hiciste tu set de hoy?',
  'Se me enredaron las hojas 🍃 Probá de nuevo en un rato. ¡Tu racha te espera!',
  'Ahora mismo no puedo pensar mucho… pero una acción fácil de agua siempre suma 💧',
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return json({ error: 'no_auth' }, 401);
    const { data: userData } = await admin.auth.getUser(token);
    const user = userData.user;
    if (!user) return json({ error: 'invalid_auth' }, 401);

    const body = await req.json().catch(() => ({}));
    const messages: ChatMessage[] = Array.isArray(body.messages) ? body.messages.slice(-8) : [];
    if (messages.length === 0) return json({ error: 'no_messages' }, 400);

    // Per-user daily rate limit via app_state.
    const today = new Date().toISOString().slice(0, 10);
    const key = `pipchat:${user.id}`;
    const { data: rl } = await admin.from('app_state').select('value').eq('key', key).maybeSingle();
    const state = (rl?.value ?? {}) as { day?: string; count?: number };
    const count = state.day === today ? (state.count ?? 0) : 0;
    if (count >= DAILY_LIMIT) {
      return json({ reply: 'Por hoy charlamos un montón 🌱 Volvé mañana — mejor usá esa energía en una acción real 💪', limited: true });
    }

    // Real user context makes Pip feel alive.
    const { data: prof } = await admin
      .from('profiles')
      .select('display_name, city, interests, total_xp, current_rank_slug, current_streak, longest_streak, mundo_state, context')
      .eq('id', user.id)
      .maybeSingle();
    const mundo = (prof?.mundo_state ?? {}) as Record<string, unknown>;

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return json({ reply: FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)], fallback: true });
    }

    const persona =
      `Sos Pip, la mascota brote/hoja de la app argentina Brote (acciones ambientales gamificadas). ` +
      `Personalidad: cálido, curioso, motivador, un toque juguetón. Hablás español rioplatense (vos, che con moderación). ` +
      `Respuestas CORTAS (máx ~80 palabras), concretas y accionables. Emojis con moderación (🌱💧🚲♻️). ` +
      `NUNCA inventes datos de la app ni prometas premios. Si preguntan algo fuera de ambiente/hábitos/la app, redirigí con gracia. ` +
      `Contexto real del usuario: nombre=${prof?.display_name ?? '?'}; ciudad=${prof?.city ?? '?'}; ` +
      `rango=${prof?.current_rank_slug ?? 'semilla'}; puntos=${prof?.total_xp ?? 0}; racha=${prof?.current_streak ?? 0} días (récord ${prof?.longest_streak ?? 0}); ` +
      `mundo n°${mundo['worldIndex'] ?? 1} con ${mundo['worldGrowth'] ?? 0}/${mundo['worldGoal'] ?? 40} de crecimiento; ` +
      `intereses=${(prof?.interests ?? []).join(', ') || 'varios'}; contexto=${JSON.stringify(prof?.context ?? {})}. ` +
      `Usá el contexto solo cuando sume; no lo recites.`;

    const contents = [
      { role: 'user', parts: [{ text: persona }] },
      { role: 'model', parts: [{ text: '¡Entendido! Soy Pip 🌱 ¿En qué te ayudo?' }] },
      ...messages.map((m) => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: String(m.text).slice(0, 1000) }] })),
    ];

    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), 20000);
    let reply: string | null = null;
    try {
      const res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents, generationConfig: { temperature: 0.8, maxOutputTokens: 260 } }),
        signal: controller.signal,
      });
      if (res.ok) {
        const data = await res.json();
        reply = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
      }
    } finally {
      clearTimeout(to);
    }

    if (!reply) return json({ reply: FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)], fallback: true });

    await admin.from('app_state').upsert({ key, value: { day: today, count: count + 1 }, is_public: false });
    return json({ reply });
  } catch (e) {
    return json({ reply: FALLBACKS[0], fallback: true, error: e instanceof Error ? e.message : 'failed' });
  }
});
