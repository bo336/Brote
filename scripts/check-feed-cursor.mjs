#!/usr/bin/env node
/**
 * Walks the real feed and asserts the two things keyset pagination promises.
 *
 *   1. No id appears on two pages.
 *   2. Scores never go back up.
 *
 * Both are easy to break by accident — adding a ranking term that is not
 * deterministic, or letting `p_now` drift between pages, silently reintroduces
 * duplicates and nobody notices until a reader complains that the feed repeats
 * itself. This runs against the LIVE database so it can be re-run after any
 * change to `feed_timeline_v2`.
 *
 *   node scripts/check-feed-cursor.mjs                 # para_vos, to the very end
 *   node scripts/check-feed-cursor.mjs novedades 8     # novedades, first 8 pages
 *
 * Walking to the END matters: duplicates and score regressions show up where
 * many rows tie, which is deep in the archive, not on page 2.
 *
 * Needs, in .env.local (already there for the app):
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 * and a test account:
 *   QA_EMAIL, QA_PASSWORD   (or it falls back to the visual-qa account)
 */

import { readFileSync } from 'node:fs';

function loadEnv() {
  try {
    for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    /* env may come from the shell instead */
  }
}
loadEnv();

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const EMAIL = process.env.QA_EMAIL ?? 'visual-qa@brote.dev';
const PASSWORD = process.env.QA_PASSWORD ?? 'VisualQA2026!';

if (!URL_ || !KEY) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  process.exit(2);
}

const tab = process.argv[2] ?? 'para_vos';
// 0 = keep going until the feed says there is no next page.
const pages = Number(process.argv[3] ?? 0) || Infinity;

async function signIn() {
  const r = await fetch(`${URL_}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: KEY },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const j = await r.json();
  if (!j.access_token) {
    console.error('No se pudo iniciar sesión:', j.error_description ?? j.msg ?? JSON.stringify(j));
    process.exit(2);
  }
  return j.access_token;
}

async function page(token, cursor, now) {
  const r = await fetch(`${URL_}/rest/v1/rpc/feed_timeline_v2`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: KEY, Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      p_tab: tab,
      p_topic: null,
      p_limit: 20,
      // The same `now` on every page: recency decay is part of the score, so a
      // fresh timestamp would re-rank items the reader already passed.
      p_now: now,
      p_cursor_score: cursor?.score ?? null,
      p_cursor_created: cursor?.created_at ?? null,
      p_cursor_id: cursor?.id ?? null,
    }),
  });
  if (!r.ok) {
    console.error(`RPC ${r.status}:`, await r.text());
    process.exit(2);
  }
  return r.json();
}

const token = await signIn();
const now = new Date().toISOString();

const seen = new Map(); // id -> first page it appeared on
let cursor = null;
let lastScore = Infinity;
let total = 0;
const duplicates = [];
const regressions = [];

for (let i = 1; i <= pages; i++) {
  const res = await page(token, cursor, now);
  const items = res.items ?? [];
  if (items.length === 0) {
    console.log(`página ${i}: vacía — el feed se terminó`);
    break;
  }
  for (const it of items) {
    if (seen.has(it.id)) duplicates.push({ id: it.id, first: seen.get(it.id), again: i });
    else seen.set(it.id, i);
  }
  total += items.length;

  const c = res.next_cursor;
  if (c && c.score > lastScore) regressions.push({ page: i, score: c.score, previous: lastScore });
  if (c) lastScore = c.score;

  console.log(
    `página ${i}: ${items.length} items` +
      (c ? ` · cursor ${Number(c.score).toFixed(2)}` : ' · sin cursor (fin)'),
  );
  cursor = c;
  if (!cursor) break;
}

console.log('');
console.log(`tab           ${tab}`);
console.log(`items         ${total}`);
console.log(`únicos        ${seen.size}`);
console.log(`duplicados    ${duplicates.length}`);
console.log(`retrocesos    ${regressions.length}`);

if (duplicates.length) {
  console.error('\nDUPLICADOS:');
  for (const d of duplicates.slice(0, 10)) {
    console.error(`  ${d.id} — página ${d.first} y ${d.again}`);
  }
}
if (regressions.length) {
  console.error('\nEL PUNTAJE SUBIÓ ENTRE PÁGINAS:');
  for (const r of regressions) console.error(`  página ${r.page}: ${r.score} > ${r.previous}`);
}

if (duplicates.length || regressions.length) process.exit(1);
console.log('\nOK — sin duplicados y con puntajes estrictamente decrecientes.');
