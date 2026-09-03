import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

/**
 * The invariant grep.
 *
 * XP comes only from verified real-world actions; semillas only from in-game
 * play; there is no path between them (`11-GAME-LOOP.md` §1). If semillas could
 * ever buy XP the real-world currency is devalued and the product's premise
 * collapses — so it is enforced in code, not in a comment.
 *
 * The needles are assembled from fragments so that this file does not match
 * itself, and `__tests__` is skipped for the same reason.
 */
const FORBIDDEN = [
  ['complete', '_activity'],
  ['brote_grant', '_xp'],
  ['total', '_xp'],
  ['brote_grant', '_points'],
].map((parts) => parts.join(''));

const ROOTS = ['components/mundo3d', 'lib/world', 'lib/render', 'app/(app)/mundo'];
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.sql']);
/** The repo root, found by walking up to `package.json` — the tests run from a
 *  compiled `.test-out/` tree, so a fixed number of `..` would point at that. */
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

const REPO_ROOT = findRepoRoot(__dirname);

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
      walk(full, out);
    } else if (EXTENSIONS.has(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

test('no file in the world can grant XP', () => {
  const hits: string[] = [];
  let scanned = 0;
  for (const root of ROOTS) {
    for (const file of walk(path.join(REPO_ROOT, root))) {
      scanned++;
      const source = fs.readFileSync(file, 'utf8');
      for (const needle of FORBIDDEN) {
        if (source.includes(needle)) hits.push(`${path.relative(REPO_ROOT, file)} → ${needle}`);
      }
    }
  }
  assert.ok(scanned > 0, 'the invariant grep scanned nothing — check ROOTS');
  assert.deepEqual(hits, [], `XP leaked into the world:\n${hits.join('\n')}`);
});

test('the grep would actually catch a violation', () => {
  // A guard on the guard: if the needles ever stop matching, the test above
  // would pass on an empty check and nobody would notice.
  const sample = `await supabase.rpc('${FORBIDDEN[0]}', { p_activity_id: id });`;
  assert.ok(FORBIDDEN.some((needle) => sample.includes(needle)));
});

test('the poster never pulls the 3D bundle into the feed', () => {
  // Same shape of guarantee, different rule: `components/mundo3d/poster/**` is
  // loaded by the home feed, so a `three` import there costs every user the
  // whole renderer (`07-RENDER-ARCHITECTURE.md` §2).
  const posterDir = path.join(REPO_ROOT, 'components/mundo3d/poster');
  const files = walk(posterDir);
  assert.ok(files.length > 0, 'no poster files found');
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    assert.ok(!/from '(three|@react-three\/[a-z]+)'/.test(source), `${file} imports three`);
    assert.ok(!/from '@\/lib\/render/.test(source), `${file} imports lib/render`);
  }
});
