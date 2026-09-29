import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

/**
 * "Tu impacto real" can only move by doing a real action.
 *
 * The panel on Inicio sums `activity_completions` (brote_user_impact). So the
 * promise "only the daily actions, the routine and the Acciones section change
 * it — nothing from the game, the Academia, the Plaza or the Mercado" is a
 * promise about WHO WRITES that table. Three layers, each checked here:
 *
 *   1. SQL: the only functions that insert a completion are complete_activity
 *      and complete_project_session; the only ones that change one are the
 *      photo-verification paths (award_verified, auto_approve_completion).
 *   2. Grants: since 0117 the client has no INSERT/UPDATE/DELETE on the table.
 *   3. Client: nothing writes the table directly, and `complete_activity` is
 *      reached only from the day's set, the routine, Acciones and onboarding's
 *      first action — never from the world, the Academia, the Plaza or the
 *      Mercado.
 *
 * Needles are built from fragments so this file does not match itself.
 */
const TABLA = ['activity', '_completions'].join('');

function findRepoRoot(from: string): string {
  let dir = from;
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  throw new Error('repo root not found from ' + from);
}
const ROOT = findRepoRoot(__dirname);

function walk(dir: string, exts: Set<string>, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === '__tests__' || e.name === 'node_modules' || e.name.startsWith('.')) continue;
      walk(full, exts, out);
    } else if (exts.has(path.extname(e.name))) out.push(full);
  }
  return out;
}

/** Every `create function` in the migrations, with the text up to the next one. */
function sqlFunctions(): { file: string; name: string; body: string }[] {
  const dir = path.join(ROOT, 'supabase/migrations');
  const out: { file: string; name: string; body: string }[] = [];
  const re = /create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?([a-z0-9_]+)\s*\(/gi;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.sql')).sort()) {
    const s = fs.readFileSync(path.join(dir, f), 'utf8').replace(/--[^\n]*/g, '');
    const marks: [number, string][] = [];
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(s))) marks.push([m.index, m[1]!.toLowerCase()]);
    marks.forEach(([i, name], k) => out.push({ file: f, name, body: s.slice(i, k + 1 < marks.length ? marks[k + 1]![0] : s.length) }));
  }
  return out;
}

test('only complete_activity and complete_project_session insert a completion', () => {
  const allowed = new Set(['complete_activity', 'complete_project_session']);
  const ins = new RegExp(`insert\\s+into\\s+(public\\.)?${TABLA}\\b`, 'i');
  const fns = sqlFunctions();
  assert.ok(fns.length > 50, 'the migration scan found almost no functions — check the parser');
  const writers = fns.filter((f) => ins.test(f.body));
  assert.ok(writers.some((w) => w.name === 'complete_activity'), 'complete_activity should be found as a writer');
  const bad = writers.filter((w) => !allowed.has(w.name)).map((w) => `${w.file} → ${w.name}`);
  assert.deepEqual(bad, [], `something other than an action writes completions:\n${bad.join('\n')}`);
});

test('only the verification paths change an existing completion', () => {
  const allowed = new Set(['award_verified', 'auto_approve_completion', 'daily_maintenance']);
  const upd = new RegExp(`(update\\s+(public\\.)?${TABLA}\\b|delete\\s+from\\s+(public\\.)?${TABLA}\\b)`, 'i');
  const bad = sqlFunctions()
    .filter((f) => upd.test(f.body) && !allowed.has(f.name))
    .map((f) => `${f.file} → ${f.name}`);
  assert.deepEqual(bad, [], `unexpected functions rewrite completions:\n${bad.join('\n')}`);
});

test('0117 takes client writes away from the completions table', () => {
  const sql = fs.readFileSync(path.join(ROOT, 'supabase/migrations/0117_perfil_y_puntos_solo_por_rpc.sql'), 'utf8');
  assert.match(sql, new RegExp(`revoke insert, update, delete, truncate on public\\.${TABLA} from anon, authenticated`));
  assert.match(sql, /drop policy if exists "completions owner all"/);
  // …and account_type is not in the columns a client may update.
  const grant = /grant update \(([^)]*)\) on public\.profiles to authenticated/.exec(sql);
  assert.ok(grant, 'profiles column grant not found');
  for (const col of ['account_type', 'total_xp', 'plan', 'onboarding_completed', 'equipped_title_id', 'semillas']) {
    assert.ok(!grant![1]!.includes(col), `${col} must not be client-writable`);
  }
});

test('no client code writes the completions table', () => {
  const files = ['app', 'components', 'lib', 'hooks', 'stores'].flatMap((d) =>
    walk(path.join(ROOT, d), new Set(['.ts', '.tsx'])),
  );
  const hits: string[] = [];
  const from = new RegExp(`from\\(['"]${TABLA}['"]\\)([\\s\\S]{0,200})`, 'g');
  for (const f of files) {
    const s = fs.readFileSync(f, 'utf8');
    let m: RegExpExecArray | null;
    while ((m = from.exec(s))) {
      if (/\.(insert|update|upsert|delete)\(/.test(m[1]!.split(/\n\s*\n/)[0]!)) hits.push(path.relative(ROOT, f));
    }
  }
  assert.deepEqual(hits, []);
});

test('complete_activity is only reached from real-action screens', () => {
  const allowedPrefixes = [
    'lib/api/activities.ts', // the one RPC call
    'hooks/use-daily-set.ts', // the mutation
    'app/(app)/page.tsx', // Inicio: the day's set and the routine
    'app/(app)/acciones/', // the Acciones section
    'components/inicio/', // Inicio's own pieces
    'components/onboarding/', // the first daily action
  ].map((p) => p.split('/').join(path.sep));
  const needles = [
    `rpc('${['complete', '_activity'].join('')}'`,
    `${['complete', 'Activity'].join('')}(`,
    `${['useComplete', 'Activity'].join('')}(`,
  ];
  const files = ['app', 'components', 'lib', 'hooks', 'stores'].flatMap((d) =>
    walk(path.join(ROOT, d), new Set(['.ts', '.tsx'])),
  );
  const bad: string[] = [];
  let seen = 0;
  for (const f of files) {
    const rel = path.relative(ROOT, f);
    const s = fs.readFileSync(f, 'utf8');
    if (!needles.some((n) => s.includes(n))) continue;
    seen++;
    if (!allowedPrefixes.some((p) => rel.startsWith(p))) bad.push(rel);
  }
  assert.ok(seen >= 3, 'expected to find the completion call sites');
  assert.deepEqual(bad, [], `an action completion is reachable from a non-action screen:\n${bad.join('\n')}`);
});
