import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { canTransition, STATE_TRANSITIONS, VERB_TABLE, verbDef } from '../verbs';
import { cumulativeState, MAX_TIER, MIN_TIER, verbsFor } from '../progression';
import type { VerbId } from '../types';

/**
 * **The sixteen verbs, one by one** (`20-ACCEPTANCE.md` 3C).
 *
 * The acceptance line asks for each verb to be demonstrated in a running
 * session; two of the sixteen were, and the other fourteen have been open since
 * phase 3. Walking through them by hand answers "does it run today" and nothing
 * about tomorrow, so the properties that a demonstration would have shown are
 * asserted here instead: every verb reachable, every verb legal, every verb
 * named, every verb owned by a tier that also grants what it needs.
 *
 * What this cannot replace is how a verb *feels*, and that is said plainly in
 * `22-PROGRESS.md` rather than quietly counted as passed.
 */
function repoRoot(from: string): string {
  let dir = from;
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error('repo root not found');
}
const ROOT = repoRoot(__dirname);
const ES = JSON.parse(fs.readFileSync(path.join(ROOT, 'messages/es.json'), 'utf8'));

const VERBS = Object.keys(VERB_TABLE) as VerbId[];

test('there are sixteen of them, and the table is its own index', () => {
  assert.equal(VERBS.length, 16);
  for (const id of VERBS) assert.equal(VERB_TABLE[id].id, id, `${id} disagrees with its key`);
});

test('every verb has a state, a pose and a label', () => {
  for (const id of VERBS) {
    const def = verbDef(id);
    assert.ok(def.state, `${id} has no player state`);
    assert.ok(def.poseKey, `${id} has no pose`);
    assert.ok(def.labelKey?.startsWith('mundo.'), `${id} has no label key`);
  }
});

test('**every verb has Spanish copy** — a button with no word on it is not a verb', () => {
  for (const id of VERBS) {
    const key = verbDef(id).labelKey.replace(/^mundo\./, '');
    const text = key.split('.').reduce<unknown>((node, k) =>
      (typeof node === 'object' && node !== null ? (node as Record<string, unknown>)[k] : undefined), ES.mundo);
    assert.equal(typeof text, 'string', `${id}: no copy at mundo.${key}`);
    assert.ok((text as string).length > 0, `${id}: empty label`);
  }
});

test('a moving verb has a speed and a standing one does not', () => {
  for (const id of VERBS) {
    const def = verbDef(id);
    const moves = ['walk', 'climb', 'glide', 'swim'].includes(def.state);
    if (moves) assert.ok(typeof def.speed === 'number' && def.speed > 0, `${id} moves at ${def.speed}`);
    else assert.equal(def.speed, null, `${id} stands still but has a speed`);
  }
});

test("every verb's state is one the machine actually knows", () => {
  for (const id of VERBS) {
    assert.ok(verbDef(id).state in STATE_TRANSITIONS, `${id} → ${verbDef(id).state} is not a state`);
  }
});

test('**every verb is reachable from standing** — none is a state you fall into', () => {
  // Breadth-first from `idle`. A verb whose state cannot be entered is a verb
  // that exists only in the table.
  const seen = new Set(['idle']);
  const queue = ['idle'];
  while (queue.length) {
    const from = queue.shift()!;
    for (const to of STATE_TRANSITIONS[from as keyof typeof STATE_TRANSITIONS] ?? []) {
      if (!seen.has(to)) { seen.add(to); queue.push(to); }
    }
  }
  const stranded = VERBS.filter((id) => !seen.has(verbDef(id).state));
  assert.deepEqual(stranded, [], `unreachable: ${stranded.join(', ')}`);
});

test('…and every state can get back to standing, so nothing is a trap', () => {
  const states = Object.keys(STATE_TRANSITIONS) as (keyof typeof STATE_TRANSITIONS)[];
  for (const s of states) {
    const seen = new Set([s]);
    const queue = [s];
    let home = false;
    while (queue.length && !home) {
      const from = queue.shift()!;
      for (const to of STATE_TRANSITIONS[from] ?? []) {
        if (to === 'idle') home = true;
        if (!seen.has(to)) { seen.add(to); queue.push(to as typeof s); }
      }
    }
    assert.ok(home, `${s} cannot return to idle`);
  }
});

test('the transition table is not a free-for-all', () => {
  // If everything could become everything, `canTransition` would be decoration.
  const states = Object.keys(STATE_TRANSITIONS);
  const total = states.length * states.length;
  const legal = states.reduce((n, s) => n + (STATE_TRANSITIONS[s as 'idle']?.length ?? 0), 0);
  assert.ok(legal < total * 0.75, `${legal}/${total} transitions are legal — that is not a machine`);
  assert.equal(canTransition('idle', 'idle'), true);
});

test('**every verb is granted by some tier, and no tier grants one twice**', () => {
  const granted = new Set<VerbId>();
  for (let tier = MIN_TIER; tier <= MAX_TIER; tier++) {
    const here = verbsFor(tier);
    assert.equal(new Set(here).size, here.length, `tier ${tier} lists a verb twice`);
    for (const v of here) granted.add(v);
  }
  const never = VERBS.filter((v) => !granted.has(v));
  assert.deepEqual(never, [], `never granted by any tier: ${never.join(', ')}`);
});

test('the verb set only ever grows — a rank never takes a verb away', () => {
  let previous: VerbId[] = [];
  for (let tier = MIN_TIER; tier <= MAX_TIER; tier++) {
    const here = verbsFor(tier);
    const lost = previous.filter((v) => !here.includes(v));
    assert.deepEqual(lost, [], `tier ${tier} took away ${lost.join(', ')}`);
    previous = here;
  }
});

test('a verb that needs a feature is not granted before the feature is', () => {
  // `sail` without a boat is a button that cannot work. The ladder grants the
  // feature and the verb together or not at all.
  for (let tier = MIN_TIER; tier <= MAX_TIER; tier++) {
    const config = cumulativeState(tier);
    for (const id of verbsFor(tier)) {
      const need = verbDef(id).requiresFeature;
      if (!need) continue;
      assert.ok(
        (config.features as readonly string[]).includes(need),
        `tier ${tier} grants "${id}" but not its "${need}"`,
      );
    }
  }
});
