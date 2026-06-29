// refresh-news (BUILD_SPEC §10.3) — scheduled, shared across all users.
// Fetches free RSS feeds, AI-summarizes new items in Spanish (original summary
// only, no full-text reproduction), interest-scores them, and upserts `news`.
// Heuristic fallback keeps the feed populated if Gemini is unavailable.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';
import { XMLParser } from 'https://esm.sh/fast-xml-parser@4.5.0';
import { corsHeaders, json } from '../_shared/cors.ts';
import { geminiJSON } from '../_shared/gemini.ts';

interface FeedItem {
  title: string;
  link: string;
  description: string;
  pubDate?: string;
  image?: string;
}

interface Summary {
  title_es: string;
  summary_es: string;
  domain_tags: string[];
  interest_score: number;
}

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  agua: ['agua', 'water', 'río', 'river', 'sequía', 'drought'],
  energia: ['energía', 'energy', 'solar', 'renewable', 'carbon', 'emiss', 'co2'],
  movilidad: ['transporte', 'transport', 'bici', 'bike', 'vehicle', 'ev', 'flight'],
  plantas: ['árbol', 'tree', 'forest', 'bosque', 'plant', 'reforest'],
  animales: ['animal', 'wildlife', 'species', 'fauna', 'bird', 'whale', 'biodiversity', 'biodiversidad'],
  alimentacion: ['food', 'comida', 'diet', 'agricultur', 'farm'],
  residuos: ['waste', 'residuo', 'recycl', 'recicl', 'plastic', 'plástico'],
  agua_azul: ['ocean', 'océano', 'sea', 'mar', 'coral', 'reef', 'coast'],
  aire_suelo: ['air', 'aire', 'soil', 'suelo', 'pollution', 'contamina'],
  comunidad: ['community', 'comunidad', 'volunteer', 'activist'],
  ciencia: ['research', 'study', 'estudio', 'científic', 'scientist'],
  consumo: ['consum', 'fashion', 'moda', 'shopping'],
  digital: ['digital', 'tech', 'ai data center', 'e-waste'],
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
  return (s ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 500);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: feedsRow } = await admin.from('app_state').select('value').eq('key', 'news_feeds').maybeSingle();
  const feeds = (feedsRow?.value ?? []) as { name: string; url: string }[];
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

  let inserted = 0;
  const PER_FEED = 2;

  for (const feed of feeds) {
    try {
      const res = await fetch(feed.url, { headers: { 'User-Agent': 'BroteBot/1.0' }, signal: AbortSignal.timeout(12000) });
      if (!res.ok) continue;
      const xml = await res.text();
      const parsed = parser.parse(xml);
      const rawItems = parsed?.rss?.channel?.item ?? parsed?.feed?.entry ?? [];
      const items: FeedItem[] = (Array.isArray(rawItems) ? rawItems : [rawItems]).slice(0, 6).map((it: Record<string, unknown>) => ({
        title: String(it.title?.['#text'] ?? it.title ?? ''),
        link: String(it.link?.['@_href'] ?? it.link ?? it.guid ?? ''),
        description: stripHtml(String(it.description ?? it.summary ?? it['content:encoded'] ?? '')),
        pubDate: (it.pubDate ?? it.published ?? it.updated) as string | undefined,
        image:
          (it['media:content']?.['@_url'] as string) ??
          (it['media:thumbnail']?.['@_url'] as string) ??
          (it.enclosure?.['@_url'] as string) ??
          undefined,
      }));

      let perFeed = 0;
      for (const item of items) {
        if (perFeed >= PER_FEED || !item.link || !item.title) continue;
        const { data: exists } = await admin.from('news').select('id').eq('source_url', item.link).maybeSingle();
        if (exists) continue;

        let summary: Summary;
        try {
          summary = await geminiJSON<Summary>(
            [
              {
                text:
                  `Resumí esta noticia ambiental para una app en español rioplatense. Devolvé SOLO JSON con: ` +
                  `title_es (titular atractivo y original, NO copies el original literal), ` +
                  `summary_es (1-2 oraciones originales, sin reproducir el texto), ` +
                  `domain_tags (array de estos slugs si aplican: ${Object.keys(DOMAIN_KEYWORDS).join(', ')}), ` +
                  `interest_score (0-100 según qué tan interesante/relevante es).\n\n` +
                  `Título: ${item.title}\nExtracto: ${item.description}`,
              },
            ],
            { timeoutMs: 15000 },
          );
        } catch (_e) {
          // Heuristic fallback.
          const text = `${item.title} ${item.description}`;
          summary = {
            title_es: item.title.slice(0, 140),
            summary_es: item.description.slice(0, 220),
            domain_tags: tagByKeywords(text),
            interest_score: 50,
          };
        }

        await admin.from('news').upsert(
          {
            source: feed.name,
            source_url: item.link,
            original_title: item.title,
            title_es: summary.title_es,
            summary_es: summary.summary_es,
            image_url: item.image ?? null,
            domain_tags: summary.domain_tags ?? [],
            interest_score: Math.max(0, Math.min(100, Math.round(summary.interest_score ?? 50))),
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

  // Expire old items (keep the feed fresh).
  await admin
    .from('news')
    .update({ active: false })
    .lt('published_at', new Date(Date.now() - 30 * 86400000).toISOString());

  return json({ ok: true, inserted });
});
