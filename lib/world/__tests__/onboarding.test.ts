import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import {
  BEATS, CARE_CHIPS, FIRST_RUN, hasMoved, needsFirstRun, nextBeat, plantSpot, propForChip,
} from '../onboarding';
import { PROP_IDS } from '../progression';

function repoRoot(from: string): string {
  let dir = from;
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error('repo root not found');
}
const ROOT = repoRoot(__dirname);
const COPY = JSON.parse(fs.readFileSync(path.join(ROOT, 'messages/es.json'), 'utf8')).mundo.first;

test('the beat sheet is the four world beats, in order, and never branches', () => {
  assert.deepEqual([...BEATS], ['move', 'plant', 'care', 'promise', 'act']);
  let beat = BEATS[0]!;
  const walked = [beat];
  for (;;) {
    const next = nextBeat(beat);
    if (!next) break;
    walked.push(next);
    beat = next;
  }
  assert.deepEqual(walked, [...BEATS], 'the sequence does not reach its own end');
  assert.equal(nextBeat('act'), null);
});

test('**nothing is asked before something is given**', () => {
  // Movement, then a seed in the ground, and only then the one question. A
  // first session that opens with a form is one most people do not finish.
  assert.ok(BEATS.indexOf('care') > BEATS.indexOf('plant'));
  assert.ok(BEATS.indexOf('plant') > BEATS.indexOf('move'));
  // …and the ask is last, after all of it.
  assert.equal(BEATS[BEATS.length - 1], 'act');
});

test('the move beat ends on distance walked, never on a timer', () => {
  assert.ok(FIRST_RUN.moveDistanceM > 0);
  assert.equal(hasMoved(0), false);
  assert.equal(hasMoved(FIRST_RUN.moveDistanceM - 0.01), false);
  assert.equal(hasMoved(FIRST_RUN.moveDistanceM), true);
});

test('every answer to the one question puts a real, keepable prop down', () => {
  assert.equal(CARE_CHIPS.length, 3);
  for (const chip of CARE_CHIPS) {
    const slug = propForChip(chip);
    assert.ok(PROP_IDS.includes(slug), `${chip} → ${slug} is not a placeable prop`);
  }
  // Three different objects: three chips that all give the same thing is one
  // chip wearing a costume.
  assert.equal(new Set(CARE_CHIPS.map(propForChip)).size, 3);
});

test('the marked spot is in front of the spawn, in plain sight', () => {
  const [x, z] = plantSpot(10, -4);
  assert.ok(Math.hypot(x - 10, z + 4) > 2);
  assert.ok(Math.hypot(x - 10, z + 4) < 12, 'too far to see from where you start');
});

test('it runs once ever, and never for somebody already playing', () => {
  assert.equal(needsFirstRun(0, 1), true);
  assert.equal(needsFirstRun(Date.now(), 1), false, 'a finished tutorial replayed');
  assert.equal(needsFirstRun(0, 11), false, 'rank 11 was told how to walk');
});

test('the flag lives in Postgres, not in the browser', () => {
  const sql = fs.readFileSync(
    path.join(ROOT, 'supabase/migrations/0102_mundo_first_run.sql'), 'utf8');
  assert.ok(/add column if not exists onboarded_at/.test(sql));
  // Calling twice cannot move the date forward.
  assert.ok(/onboarded_at = coalesce\(onboarded_at, now\(\)\)/.test(sql));
  // And an island somebody has already been playing on is marked, not taught.
  assert.ok(/update public.user_world[\s\S]*where onboarded_at is null/.test(sql));
});

test('every beat has a Spanish line, and none of them tells anybody off', () => {
  for (const beat of BEATS) {
    const line = COPY[beat];
    assert.equal(typeof line, 'string', `${beat} has no line`);
    assert.ok(line.split(/\s+/).length <= 25, `${beat} is over 25 words`);
  }
  for (const chip of CARE_CHIPS) assert.equal(typeof COPY.chip[chip], 'string');
  const all = JSON.stringify(COPY).toLowerCase();
  for (const bad of ['deberías', 'tenés que', 'primero tenés', 'obligatorio']) {
    assert.ok(!all.includes(bad), bad);
  }
});

test('the last beat asks, and does not gate', () => {
  // `11-GAME-LOOP.md` §5: no "do a real action to keep playing". There is a way
  // past it, and the way past it is a word rather than a hidden tap.
  assert.equal(typeof COPY.later, 'string');
  assert.equal(typeof COPY.skip, 'string');
});
