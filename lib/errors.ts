/**
 * Turn anything thrown into something a person can act on (F15.5).
 *
 * Users were seeing raw infrastructure text — "supabase refused connection",
 * PostgREST codes, fetch failures. That tells them nothing, looks broken, and
 * leaks how the system is built. Every user-facing surface routes through
 * here; the original is kept for the console so debugging is unaffected.
 *
 * The allow-list is deliberate: only messages WE wrote (validation, business
 * rules, friendly refusals) reach the screen unchanged. Anything unrecognised
 * is replaced rather than passed through, so a new backend error can never
 * leak by default.
 */

/** Fragments that mark a message as internal, whatever else it says. */
const TECHNICAL_MARKERS = [
  'supabase', 'postgrest', 'pgrst', 'jwt', 'sql', 'syntax', 'relation ', 'column ',
  'constraint', 'duplicate key', 'violates', 'row-level security', 'rls',
  'fetch', 'network', 'econn', 'etimedout', 'enotfound', 'cors', 'timeout',
  'undefined', 'null', 'nan', 'stack', 'typeerror', 'referenceerror',
  'status code', 'http', '500', '502', '503', '504', 'internal server',
  'function', 'schema', 'permission denied', 'unauthorized', 'forbidden',
];

const FRIENDLY_DEFAULT = 'Algo no salió como esperábamos. Probá de nuevo en un momento.';

/** Specific, kinder wording for the few failures worth naming. */
const KNOWN: { test: RegExp; message: string }[] = [
  { test: /network|fetch|econn|etimedout|enotfound|offline/i,
    message: 'Parece que no hay conexión. Revisá tu internet y probá de nuevo.' },
  { test: /timeout|timed out/i,
    message: 'Está tardando más de lo normal. Probá de nuevo en un momento.' },
  { test: /jwt|token|session|unauthor/i,
    message: 'Tu sesión venció. Volvé a entrar para seguir.' },
  { test: /rate|too many|429/i,
    message: 'Fuiste muy rápido. Esperá unos segundos y probá otra vez.' },
  { test: /duplicate key|already exists|unique/i,
    message: 'Eso ya existe.' },
  { test: /row-level security|permission denied|forbidden|not allowed/i,
    message: 'No tenés permiso para hacer eso.' },
];

function looksTechnical(message: string): boolean {
  const m = message.toLowerCase();
  if (TECHNICAL_MARKERS.some((t) => m.includes(t))) return true;

  // Structural giveaways — JSON blobs, code, URLs.
  if (/[{}[\]<>]|::|=>/.test(message)) return true;
  // Stack frames: "at fnName (" as well as "at fnName."
  if (/\bat\s+\S+\s*[.(]/.test(message)) return true;
  // Anything carrying a URL or a file:line reference.
  if (/:\/\/|\.(ts|tsx|js|jsx|mjs|cjs):\d+/.test(message)) return true;
  // We never write a message that starts with indentation.
  if (/^\s{2,}/.test(message)) return true;
  // SCREAMING_CODE identifiers.
  if (/^[A-Z][A-Z0-9_]{3,}$/.test(message.trim())) return true;
  return false;
}

/**
 * The message to show a user. Pass anything: an Error, a string, an API
 * payload. The technical original is logged, never displayed.
 */
export function friendlyError(err: unknown, fallback = FRIENDLY_DEFAULT): string {
  const raw =
    err instanceof Error ? err.message
    : typeof err === 'string' ? err
    : err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message)
    : '';

  if (process.env.NODE_ENV !== 'production' && raw) {
    // eslint-disable-next-line no-console
    console.debug('[brote] original error:', err);
  }

  if (!raw.trim()) return fallback;

  for (const k of KNOWN) if (k.test.test(raw)) return k.message;
  if (looksTechnical(raw)) return fallback;

  // Ours: short, human, written in Spanish, no code smell.
  if (raw.length <= 160) return raw;
  return fallback;
}
