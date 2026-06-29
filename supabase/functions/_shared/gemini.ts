// Shared Gemini helper (BUILD_SPEC §10.4): timeout, retry-once, JSON-fence
// stripping, and a typed fallback signal. Uses gemini-1.5-flash via REST so no
// SDK is needed in the Deno runtime. The API key lives only in function secrets.

const MODEL = 'gemini-1.5-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

export class GeminiUnavailable extends Error {}

export function parseJson<T>(text: string): T {
  let t = (text ?? '').trim();
  if (t.startsWith('```')) t = t.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
  return JSON.parse(t) as T;
}

/** Call Gemini expecting a JSON object back. Throws GeminiUnavailable on failure. */
export async function geminiJSON<T>(parts: GeminiPart[], opts?: { timeoutMs?: number; temperature?: number }): Promise<T> {
  const key = Deno.env.get('GEMINI_API_KEY');
  if (!key) throw new GeminiUnavailable('no_api_key');

  const attempt = async (): Promise<T> => {
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), opts?.timeoutMs ?? 20000);
    try {
      const res = await fetch(`${ENDPOINT}?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: { temperature: opts?.temperature ?? 0.4, responseMimeType: 'application/json' },
        }),
        signal: controller.signal,
      });
      if (!res.ok) throw new GeminiUnavailable(`status_${res.status}`);
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      return parseJson<T>(text);
    } finally {
      clearTimeout(to);
    }
  };

  try {
    return await attempt();
  } catch (_e) {
    // retry once
    try {
      return await attempt();
    } catch (e) {
      throw new GeminiUnavailable(e instanceof Error ? e.message : 'failed');
    }
  }
}
