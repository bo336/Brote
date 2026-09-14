import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { FEATURE_IDS, THING_IDS, thingDescKey, thingNameKey } from '../things';
import { PROP_IDS } from '../progression';
import { SPECIES } from '../species';

/** The repo root, found by walking up — the tests run from `.test-out/`. */
function repoRoot(from: string): string {
  let dir = from;
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  throw new Error('repo root not found');
}

const ROOT = repoRoot(__dirname);

function messages(locale: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'messages', `${locale}.json`), 'utf8'));
}

function lookup(bundle: Record<string, unknown>, dotted: string): unknown {
  let node: unknown = (bundle.mundo as Record<string, unknown>) ?? {};
  for (const part of dotted.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return node;
}

test('**every prop and every feature has a name and a description**', () => {
  // The density rule (`11-GAME-LOOP.md` §3.3). Species already had theirs; this
  // is the half that was missing.
  const es = messages('es');
  const missing: string[] = [];
  for (const id of THING_IDS) {
    for (const key of [thingNameKey(id), thingDescKey(id)]) {
      const value = lookup(es, key);
      if (typeof value !== 'string' || value.trim() === '') missing.push(key);
    }
  }
  assert.deepEqual(missing, [], `copy missing:\n${missing.join('\n')}`);
});

test('the list covers every prop and every feature the world can build', () => {
  for (const id of PROP_IDS) assert.ok(THING_IDS.includes(id), `${id} is not in THING_IDS`);
  assert.equal(new Set(THING_IDS).size, THING_IDS.length, 'a thing is listed twice');
  assert.equal(FEATURE_IDS.length, 19, 'the ladder has nineteen structural features');
});

test('descriptions read like the species blurbs, not like labels', () => {
  // 12-18 words, two short sentences. A one-word "description" would pass the
  // check above and fail the rule it exists for.
  const es = messages('es');
  for (const id of THING_IDS) {
    const desc = lookup(es, thingDescKey(id)) as string;
    const words = desc.split(/\s+/).filter(Boolean).length;
    assert.ok(words >= 10 && words <= 20, `${id}: ${words} words — "${desc}"`);
    assert.ok(/[.!?]$/.test(desc.trim()), `${id} does not end in a full stop`);
  }
});

test('**nothing tells the player off**', () => {
  // `14-CONTENT.md`: no character is disappointed in the player, nothing is
  // loss-framed. These are the words that would do it.
  const banned = [
    'no hiciste', 'te olvidaste', 'deberías', 'tendrías que', 'te falta',
    'perdiste', 'fallaste', 'abandonaste', 'descuidaste', 'lástima',
  ];
  const es = messages('es');
  const hits: string[] = [];
  for (const id of THING_IDS) {
    const text = `${lookup(es, thingNameKey(id))} ${lookup(es, thingDescKey(id))}`.toLowerCase();
    for (const word of banned) if (text.includes(word)) hits.push(`${id} → ${word}`);
  }
  assert.deepEqual(hits, [], `loss-framed copy:\n${hits.join('\n')}`);
});

test('the English bundle has the same keys, so a locale switch is not a blank', () => {
  const en = messages('en');
  const missing = THING_IDS.flatMap((id) =>
    [thingNameKey(id), thingDescKey(id)].filter((k) => typeof lookup(en, k) !== 'string'));
  assert.deepEqual(missing, []);
});

test('species still carry theirs — this did not replace them', () => {
  for (const s of SPECIES) {
    assert.ok(s.name_es.trim().length > 0, `${s.slug} has no name`);
    assert.ok(s.blurb_es.split(/\s+/).length >= 8, `${s.slug} has a thin blurb`);
  }
});
