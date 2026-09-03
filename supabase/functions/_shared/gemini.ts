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

// ─────────────────────────────────────────────────────────────────────────────
// La Academia, fase 3 — el lote y los embeddings.
//
// Extensión del cliente que ya existe, NO un segundo cliente: mismo manejo de
// clave, mismo `GeminiUnavailable`, mismo `parseJson`. La generación de
// contenido nunca es sensible a la latencia, así que va por la Batch API: 24 h
// de vuelta y aproximadamente la mitad del costo. Eso es plata gratis.
// ─────────────────────────────────────────────────────────────────────────────

const BASE = 'https://generativelanguage.googleapis.com/v1beta';

/** El modelo que genera. Se guarda en cada fila que produce. */
export const MODELO_GEN = 'gemini-2.0-flash';
/** El de embeddings. 768 dimensiones, que es lo que espera `ac_items.embedding`. */
export const MODELO_EMB = 'text-embedding-004';

function clave(): string {
  const k = Deno.env.get('GEMINI_API_KEY');
  if (!k) throw new GeminiUnavailable('no_api_key');
  return k;
}

export interface PedidoLote {
  /** Vuelve tal cual en la respuesta: así se sabe qué salió de qué. */
  key: string;
  prompt: string;
  schema?: unknown;
  temperature?: number;
}

export interface RespuestaLote {
  key: string;
  text: string | null;
  error: string | null;
  tokensIn: number;
  tokensOut: number;
}

/**
 * Manda un lote. Devuelve el nombre de la operación, que es lo que después se
 * consulta. No espera: para eso está `geminiBatchPoll`.
 */
export async function geminiBatchSubmit(
  pedidos: PedidoLote[],
  opts?: { displayName?: string; timeoutMs?: number },
): Promise<string> {
  const k = clave();
  const body = {
    batch: {
      display_name: opts?.displayName ?? `brote-academia-${Date.now()}`,
      input_config: {
        requests: pedidos.map((p) => ({
          request: {
            contents: [{ role: 'user', parts: [{ text: p.prompt }] }],
            generation_config: {
              temperature: p.temperature ?? 0.6,
              response_mime_type: 'application/json',
              ...(p.schema ? { response_schema: p.schema } : {}),
            },
          },
          metadata: { key: p.key },
        })),
      },
    },
  };

  const res = await fetch(`${BASE}/models/${MODELO_GEN}:batchGenerateContent?key=${k}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(opts?.timeoutMs ?? 30000),
  });
  if (!res.ok) throw new GeminiUnavailable(`batch_submit_${res.status}:${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const name = data?.name;
  if (!name) throw new GeminiUnavailable('batch_sin_nombre');
  return name as string;
}

/** Consulta un lote. `listo: false` significa "todavía no", no un error. */
export async function geminiBatchPoll(
  name: string,
  opts?: { timeoutMs?: number },
): Promise<{ listo: boolean; respuestas: RespuestaLote[] }> {
  const k = clave();
  const res = await fetch(`${BASE}/${name}?key=${k}`, {
    signal: AbortSignal.timeout(opts?.timeoutMs ?? 30000),
  });
  if (!res.ok) throw new GeminiUnavailable(`batch_poll_${res.status}`);
  const data = await res.json();
  if (!data?.done) return { listo: false, respuestas: [] };

  const crudas = data?.response?.inlinedResponses?.inlinedResponses ?? [];
  const respuestas: RespuestaLote[] = crudas.map((r: Record<string, unknown>, i: number) => {
    const meta = r.metadata as { key?: string } | undefined;
    const resp = r.response as Record<string, unknown> | undefined;
    const cand = (resp?.candidates as Record<string, unknown>[] | undefined)?.[0];
    const parts = (cand?.content as { parts?: { text?: string }[] } | undefined)?.parts;
    const usage = resp?.usageMetadata as Record<string, number> | undefined;
    return {
      key: meta?.key ?? String(i),
      text: parts?.[0]?.text ?? null,
      error: r.error ? JSON.stringify(r.error).slice(0, 400) : null,
      tokensIn: usage?.promptTokenCount ?? 0,
      tokensOut: usage?.candidatesTokenCount ?? 0,
    };
  });
  return { listo: true, respuestas };
}

/**
 * Embeddings para deduplicar. 768 dimensiones porque es lo que la columna
 * espera; pedir otra cosa haría fallar el insert, no degradarse.
 */
export async function geminiEmbed(textos: string[]): Promise<number[][]> {
  if (textos.length === 0) return [];
  const k = clave();
  const res = await fetch(`${BASE}/models/${MODELO_EMB}:batchEmbedContents?key=${k}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: textos.map((t) => ({
        model: `models/${MODELO_EMB}`,
        content: { parts: [{ text: t.slice(0, 8000) }] },
        outputDimensionality: 768,
      })),
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new GeminiUnavailable(`embed_${res.status}`);
  const data = await res.json();
  return (data?.embeddings ?? []).map((e: { values: number[] }) => e.values);
}

/**
 * Costo aproximado en centavos de dólar, para el presupuesto.
 *
 * Es una ESTIMACIÓN y está declarada como tal: la factura real la tiene Google.
 * Sirve para que el tope corte antes de gastar de más, que es para lo único que
 * se usa. Precios de gemini-2.0-flash en lote (mitad del interactivo).
 */
export function costoCentavos(tokensIn: number, tokensOut: number): number {
  const IN_POR_MILLON = 0.5 / 2;
  const OUT_POR_MILLON = 1.5 / 2;
  return ((tokensIn / 1e6) * IN_POR_MILLON + (tokensOut / 1e6) * OUT_POR_MILLON) * 100;
}
