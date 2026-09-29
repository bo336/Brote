// Copia exacta del bloque marcado de `lib/imagen-segura.ts` (el edge runtime no
// puede importar de `lib/`). `lib/inicio/__tests__/imagen-segura.test.ts` falla
// si las dos se separan: cambiá las dos juntas.
//
// Decide qué URL de imagen de un feed vale guardar: un reproductor de YouTube o
// Vimeo, un emoji de WordPress o un video no son una foto de la noticia, y en la
// app se veían como el ícono de imagen rota.

// ── imagenSegura:start ──────────────────────────────────────────────────────
const YOUTUBE_ID = /(?:youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?(?:.*&)?v=|shorts\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i;

/** Hosts that never serve a picture of the story. */
const HOSTS_SIN_IMAGEN = [
  'player.vimeo.com',
  'vimeo.com',
  's.w.org',
  'videos.files.wordpress.com',
  'feeds.feedburner.com',
  'pixel.wp.com',
  'stats.wp.com',
  'gravatar.com',
  'secure.gravatar.com',
  'www.facebook.com',
  'platform.twitter.com',
];

const EXT_NO_IMAGEN = /\.(mp4|m4v|webm|mov|ogv|ogg|mp3|m4a|wav|pdf|html?|php)(?:$|[?#])/i;

/**
 * The URL to load, or null when there is nothing worth loading.
 *
 * - `https:` only (and same-origin paths): an `http:` image is blocked as mixed
 *   content on the deployed app and renders as broken.
 * - HTML entities left in by the feed (`&#038;`, `&amp;`) are decoded.
 * - A YouTube embed/watch URL becomes `i.ytimg.com/vi/<id>/hqdefault.jpg`.
 */
export function imagenSegura(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = String(raw).trim().replace(/&#0?38;/g, '&').replace(/&amp;/g, '&');
  if (!s) return null;
  // Same-origin assets (`/mundo/…`, `/demo/…`) and inline data are fine.
  if (s.startsWith('/') && !s.startsWith('//')) return s;
  if (s.startsWith('data:image/')) return s;
  if (s.startsWith('blob:')) return s;

  let url: URL;
  try {
    url = new URL(s.startsWith('//') ? `https:${s}` : s);
  } catch {
    return null;
  }
  if (url.protocol === 'http:') url.protocol = 'https:';
  if (url.protocol !== 'https:') return null;

  const host = url.hostname.toLowerCase();
  const yt = YOUTUBE_ID.exec(url.href);
  if (yt && (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com') || host === 'youtu.be')) {
    return `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg`;
  }
  if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) return null;
  if (HOSTS_SIN_IMAGEN.some((h) => host === h || host.endsWith(`.${h}`))) return null;
  if (EXT_NO_IMAGEN.test(url.pathname)) return null;
  // WordPress emoji and smilies, wherever they are hosted.
  if (/\/(?:wp-includes\/images\/smilies|images\/core\/emoji)\//i.test(url.pathname)) return null;
  return url.href;
}
// ── imagenSegura:end ────────────────────────────────────────────────────────
