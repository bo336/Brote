// refresh-news (F14.10 + F15.24)
//
// Sources declare a language. Spanish sources publish with no AI at all; a
// non-Spanish item is published ONLY if it was genuinely rewritten, so the
// feed can never silently degrade into another language (the original bug:
// 426 of 431 items were raw English headlines).
//
// F15.24: the mix was too heavy on fires and drought and too light on the
// things people actually enjoy reading — inventions, explainers, DIY. Two
// changes: the heuristic score now rewards those much harder and penalises
// pure disaster coverage, and an ON-TOPIC GUARD drops items that match no
// environmental domain at all, so broader science/lifestyle feeds can be
// included without dragging in Roman ruins or hair treatments.
//
// 2026-09-28: the picture. A feed's `media:content` is often a VIDEO (a YouTube
// or Vimeo player page), and the first `<img>` of a post is often a WordPress
// emoji — all stored as `image_url` and shown in the app as a broken picture.
// Every candidate now goes through `imagenSegura` (the same rules the app
// applies before loading one): a YouTube embed becomes its thumbnail, anything
// that is not a picture is skipped and the next candidate is tried.
//
// (This file was behind the deployed function — v3 lived only in Supabase. It
// is the deployed v3 plus the picture fix.)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';
import { XMLParser } from 'https://esm.sh/fast-xml-parser@4.5.0';
import { corsHeaders, json } from '../_shared/cors.ts';
import { geminiJSON } from '../_shared/gemini.ts';
import { imagenSegura } from '../_shared/imagen.ts';

interface FeedItem { title: string; link: string; description: string; pubDate?: string; image?: string }
interface Summary { title_es: string; summary_es: string; domain_tags: string[]; interest_score: number }
interface Feed { name: string; url: string; lang?: string }

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  agua: ['agua', 'water', 'río', 'rio', 'river', 'sequía', 'sequia', 'drought', 'acuífero', 'potable', 'riego'],
  energia: ['energía', 'energia', 'energy', 'solar', 'renovable', 'renewable', 'eólic', 'eolic', 'wind', 'carbon', 'emisi', 'emiss', 'co2', 'batería', 'bateria', 'battery', 'fotovoltaic', 'eficiencia energética', 'hidrógeno', 'nuclear', 'consumo eléctrico'],
  movilidad: ['transporte', 'transport', 'bici', 'bike', 'ciclis', 'vehículo', 'vehiculo', 'vehicle', 'coche eléctrico', 'auto eléctrico', 'movilidad', 'tren', 'metro', 'flight', 'vuelo', 'peatonal'],
  plantas: ['árbol', 'arbol', 'tree', 'forest', 'bosque', 'planta', 'plant', 'reforest', 'selva', 'huerto', 'jardín', 'jardin', 'semilla', 'hoja'],
  animales: ['animal', 'wildlife', 'especie', 'species', 'fauna', 'ave', 'bird', 'ballena', 'whale', 'biodiversidad', 'biodiversity', 'insecto', 'abeja', 'delfín', 'delfin', 'pájaro'],
  alimentacion: ['aliment', 'food', 'comida', 'dieta', 'diet', 'agricultur', 'granja', 'farm', 'cultivo', 'vegan', 'carne', 'cosecha', 'huerta'],
  residuos: ['residuo', 'waste', 'recicl', 'recycl', 'plástico', 'plastico', 'plastic', 'basura', 'vertedero', 'compost', 'envase', 'chatarra', 'reutiliz'],
  agua_azul: ['océano', 'oceano', 'ocean', 'mar ', 'sea ', 'coral', 'arrecife', 'reef', 'costa', 'coast', 'marino', 'pesca'],
  aire_suelo: ['aire', 'air quality', 'suelo', 'soil', 'contaminaci', 'pollution', 'smog', 'erosión', 'erosion', 'tierra'],
  comunidad: ['comunidad', 'community', 'voluntari', 'volunteer', 'vecin', 'barrio', 'activis', 'cooperativa'],
  ciencia: ['investiga', 'research', 'estudio', 'study', 'científic', 'cientific', 'scientist', 'universidad', 'descubr', 'nanomaterial'],
  consumo: ['consumo', 'consum', 'moda', 'fashion', 'compra', 'shopping', 'textil', 'reparar', 'segunda mano'],
  digital: ['digital', 'tecnolog', 'tech', 'inteligencia artificial', 'data center', 'centro de datos', 'e-waste', 'electrónic', 'electronic', 'innovación', 'innovacion'],
};

function tagByKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  const tags: string[] = [];
  for (const [slug, kws] of Object.entries(DOMAIN_KEYWORDS)) {
    if (kws.some((k) => lower.includes(k))) tags.push(slug);
  }
  return tags.slice(0, 3);
}

function stripHtml(s: string): string {
  return (s ?? '').replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim().slice(0, 500);
}

/** Every `<img src>` in the body, in order — the first one is often an emoji. */
function imagesFromHtml(html: string): string[] {
  const out: string[] = [];
  const re = /<img[^>]+src=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html ?? '')) && out.length < 6) out.push(m[1]);
  return out;
}

/** `media:content` can be one object or a list, and describe a video. */
function mediaCandidates(node: unknown): string[] {
  const list = Array.isArray(node) ? node : node ? [node] : [];
  const out: string[] = [];
  for (const m of list as Record<string, unknown>[]) {
    const url = m?.['@_url'];
    if (typeof url !== 'string') continue;
    const medium = String(m['@_medium'] ?? '');
    const type = String(m['@_type'] ?? '');
    if (medium && medium !== 'image') {
      // A video can still carry its own thumbnail.
      const thumb = (m['media:thumbnail'] as Record<string, unknown> | undefined)?.['@_url'];
      if (typeof thumb === 'string') out.push(thumb);
      if (medium === 'video') out.push(url); // a YouTube embed is rescued as a thumbnail
      continue;
    }
    if (type && !type.startsWith('image/')) continue;
    out.push(url);
  }
  return out;
}

/** The first candidate that is really a picture, rewritten to load safely. */
function pickImage(it: Record<string, unknown>, body: string): string | undefined {
  const enclosure = it.enclosure as Record<string, unknown> | undefined;
  const enclosureUrl =
    enclosure && String(enclosure['@_type'] ?? 'image/').startsWith('image/') ? (enclosure['@_url'] as string) : undefined;
  const group = it['media:group'] as Record<string, unknown> | undefined;
  const candidates = [
    ...mediaCandidates(it['media:content']),
    ...mediaCandidates(group?.['media:content']),
    (it['media:thumbnail'] as Record<string, unknown> | undefined)?.['@_url'] as string | undefined,
    (group?.['media:thumbnail'] as Record<string, unknown> | undefined)?.['@_url'] as string | undefined,
    enclosureUrl,
    ...imagesFromHtml(body),
  ];
  for (const c of candidates) {
    const safe = imagenSegura(c);
    if (safe) return safe;
  }
  return undefined;
}

/**
 * Heuristic interest score used when the AI step is unavailable.
 * Weighted to surface what people enjoy reading — an invention, a how-to, a
 * recovery — and to push down the disaster coverage that already dominated.
 */
function heuristicScore(text: string): number {
  const t = text.toLowerCase();
  let score = 50;

  // Inventions and breakthroughs: the single biggest draw.
  const invention = ['invent', 'innova', 'crea', 'diseñ', 'desarroll', 'nanomaterial', 'prototipo',
                     'patent', 'descubr', 'nuevo método', 'primera vez', 'récord', 'record', 'avance', 'logr'];
  // Practical, do-it-yourself, explainers.
  const practical = ['cómo ', 'como hacer', 'guía', 'truco', 'paso a paso', 'casero', 'hacelo',
                     'diy', 'reutiliz', 'reparar', 'consejo', 'aprend', 'qué es', 'por qué'];
  // Good news.
  const positive = ['recupera', 'restaura', 'renace', 'vuelve', 'salva', 'éxito', 'mejora', 'soluci', 'consigue'];
  // Pure catastrophe.
  const heavy = ['muert', 'catástrofe', 'catastrofe', 'tragedia', 'desastre', 'víctimas', 'victimas',
                 'colapso', 'devasta', 'incendio', 'sequía', 'inundaci', 'ola de calor'];

  for (const w of invention) if (t.includes(w)) score += 10;
  for (const w of practical) if (t.includes(w)) score += 8;
  for (const w of positive) if (t.includes(w)) score += 5;
  for (const w of heavy) if (t.includes(w)) score -= 12;

  return Math.max(5, Math.min(95, score));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: feedsRow } = await admin.from('app_state').select('value').eq('key', 'news_feeds').maybeSingle();
  const feeds = (feedsRow?.value ?? []) as Feed[];
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

  let inserted = 0;
  let skippedUntranslated = 0;
  let skippedOffTopic = 0;
  const PER_FEED = 4;

  for (const feed of feeds) {
    const isSpanish = (feed.lang ?? 'es') === 'es';
    try {
      const res = await fetch(feed.url, { headers: { 'User-Agent': 'BroteBot/1.0' }, signal: AbortSignal.timeout(12000) });
      if (!res.ok) continue;
      const xml = await res.text();
      const parsed = parser.parse(xml);
      const rawItems = parsed?.rss?.channel?.item ?? parsed?.feed?.entry ?? [];
      const items: FeedItem[] = (Array.isArray(rawItems) ? rawItems : [rawItems]).slice(0, 10).map((it: Record<string, unknown>) => {
        const body = String(it['content:encoded'] ?? it.description ?? it.summary ?? '');
        return {
          title: String((it.title as any)?.['#text'] ?? it.title ?? ''),
          link: String((it.link as any)?.['@_href'] ?? it.link ?? it.guid ?? ''),
          description: stripHtml(body),
          pubDate: (it.pubDate ?? it.published ?? it.updated) as string | undefined,
          image: pickImage(it, body),
        };
      });

      let perFeed = 0;
      for (const item of items) {
        if (perFeed >= PER_FEED || !item.link || !item.title) continue;
        const { data: exists } = await admin.from('news').select('id').eq('source_url', item.link).maybeSingle();
        if (exists) continue;

        const text = `${item.title} ${item.description}`;

        // On-topic guard: if nothing in the piece touches an environmental
        // domain, it does not belong in this feed no matter how good it is.
        // This is what lets broader science/lifestyle sources be included.
        const keywordTags = tagByKeywords(text);
        if (keywordTags.length === 0) { skippedOffTopic++; continue; }

        let summary: Summary | null = null;
        try {
          summary = await geminiJSON<Summary>(
            [{ text:
              `Reescribí esta noticia ambiental para una app en español rioplatense, en tono cercano y claro (no académico). Devolvé SOLO JSON con: ` +
              `title_es (titular propio, atractivo y entendible, NO copies el original), ` +
              `summary_es (1-2 oraciones originales que expliquen por qué importa en la vida cotidiana), ` +
              `domain_tags (array con los slugs que apliquen: ${Object.keys(DOMAIN_KEYWORDS).join(', ')}), ` +
              `interest_score (0-100; puntuá ALTO los inventos, avances, guías prácticas y buenas noticias, y BAJO lo puramente catastrófico).\n\n` +
              `Título: ${item.title}\nExtracto: ${item.description}` }],
            { timeoutMs: 15000 },
          );
        } catch (_e) {
          summary = null;
        }

        if (!summary) {
          if (!isSpanish) { skippedUntranslated++; continue; }
          summary = {
            title_es: item.title.slice(0, 160),
            summary_es: item.description.slice(0, 240),
            domain_tags: keywordTags,
            interest_score: heuristicScore(text),
          };
        }

        const tags = (summary.domain_tags ?? []).filter((t) => t in DOMAIN_KEYWORDS);
        await admin.from('news').upsert(
          {
            source: feed.name,
            source_url: item.link,
            original_title: item.title,
            title_es: summary.title_es,
            summary_es: summary.summary_es,
            image_url: item.image ?? null,
            domain_tags: tags.length ? tags : keywordTags,
            interest_score: Math.max(0, Math.min(100, Math.round(summary.interest_score ?? 55))),
            published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
            active: true,
          },
          { onConflict: 'source_url' },
        );
        inserted++;
        perFeed++;
      }
    } catch (_e) {
      continue;
    }
  }

  await admin
    .from('news')
    .update({ active: false })
    .lt('published_at', new Date(Date.now() - 30 * 86400000).toISOString());

  return json({ ok: true, inserted, skippedUntranslated, skippedOffTopic });
});
