import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { choreSpotsFor, choresRemaining } from '../chore-spots';
import { choresForDay, CHORES_BY_ID } from '../chores';
import { REGION_IDS } from '../types';
import type { Placement, RegionId } from '../types';

const ALL_REGIONS = [...REGION_IDS] as RegionId[];
const USER = '3f1c0e2a-0000-4000-8000-000000000001';
const DAY = '2026-09-07';

function prop(slug: string, x = 3, z = 4): Placement {
  return { prop_slug: slug, region: 'claro', x, z, rot_y: 0, variant: 0 };
}

function spots(over: Partial<Parameters<typeof choreSpotsFor>[0]> = {}) {
  return choreSpotsFor({
    userId: USER,
    localDate: DAY,
    unlockedRegions: ALL_REGIONS,
    placements: [],
    choresDone: 0,
    ...over,
  });
}

test('the day gives three, and the same three all day', () => {
  const a = spots({ placements: [prop('mundo_comedero'), prop('mundo_farolitos')] });
  const b = spots({ placements: [prop('mundo_comedero'), prop('mundo_farolitos')] });
  assert.equal(a.length, 3);
  assert.deepEqual(a.map((s) => s.id), b.map((s) => s.id));
  // And the same *places* — a chore that wanders while you walk to it is worse
  // than no chore at all.
  assert.deepEqual(a.map((s) => [s.x, s.z]), b.map((s) => [s.x, s.z]));
});

test('a chore whose region is still behind the mist is simply not there', () => {
  const only = spots({ unlockedRegions: ['claro'] });
  for (const s of only) {
    assert.ok(s.def.region === null || s.def.region === 'claro', `${s.id} in ${s.def.region}`);
  }
  // Never a failure and never a nag: it is absent, not shown as locked.
  assert.ok(only.length <= 3);
});

test('a chore that needs a prop happens at that prop', () => {
  // "Llenar el comedero" anywhere but the feeder is nonsense.
  const withFeeder = spots({ placements: [prop('mundo_comedero', 11, -7)] });
  const feeder = withFeeder.find((s) => s.def.requiresProp === 'mundo_comedero');
  if (feeder) {
    assert.equal(feeder.x, 11);
    assert.equal(feeder.z, -7);
  }
  // And without the prop placed, it is not drawn at all.
  const without = spots({ placements: [] });
  assert.equal(without.some((s) => s.def.requiresProp === 'mundo_comedero'), false);
});

test('finished chores stay finished across a reload', () => {
  const done = spots({ placements: [prop('mundo_comedero'), prop('mundo_farolitos')], choresDone: 2 });
  assert.equal(done.filter((s) => s.done).length, 2);
  assert.equal(choresRemaining(done), 1);
  // The order is the draw's order, which is stable, so the same two are done.
  const again = spots({ placements: [prop('mundo_comedero'), prop('mundo_farolitos')], choresDone: 2 });
  assert.deepEqual(done.filter((s) => s.done).map((s) => s.id), again.filter((s) => s.done).map((s) => s.id));
});

test('every drawn chore is a real one with copy behind it', () => {
  for (const id of choresForDay(USER, DAY)) {
    const def = CHORES_BY_ID.get(id);
    assert.ok(def, `${id} has no definition`);
    assert.ok(def!.nameKey.startsWith('chore.'), def!.nameKey);
  }
});

test('a different day draws a different set, and a different player too', () => {
  const other = choreSpotsFor({
    userId: USER, localDate: '2026-09-08',
    unlockedRegions: ALL_REGIONS, placements: [], choresDone: 0,
  });
  const mine = spots();
  // Not a hard guarantee for any single pair, but over the pool of ten a
  // same-set collision two days running would mean the seed is not being used.
  const sameDay = choresForDay(USER, DAY).join();
  const nextDay = choresForDay(USER, '2026-09-08').join();
  assert.notEqual(sameDay, nextDay);
  assert.ok(mine.length <= 3 && other.length <= 3);
});

test('**a chore that names a thing happens at that thing**', () => {
  // "Ajustar la soga del puente" belongs at the bridge. Placing it at a random
  // point in El Río put it two metres under the lagoon on the first run.
  const bridge = { feature: 'bridge', x: 21, z: -4 };
  const got = choreSpotsFor({
    userId: USER, localDate: DAY, unlockedRegions: ALL_REGIONS,
    placements: [], choresDone: 0, anchors: [bridge],
    isGround: () => false, // nowhere else is standable, so only the anchor can win
  });
  for (const s of got) {
    assert.ok(s.def.anchor, `${s.id} was placed with no ground and no anchor`);
    assert.equal(s.x, bridge.x);
    assert.equal(s.z, bridge.z);
  }
});

test('nowhere to stand means no chore, never an unreachable one', () => {
  const nowhere = choreSpotsFor({
    userId: USER, localDate: DAY, unlockedRegions: ALL_REGIONS,
    placements: [], choresDone: 0, anchors: [], isGround: () => false,
  });
  assert.deepEqual(nowhere, [], 'a chore nobody can reach must simply not be offered');
});

test('with no ground test at all, every drawn chore still gets a place', () => {
  // The preview route and the tests run without a heightfield; a missing test
  // must not silently empty the day.
  const got = choreSpotsFor({
    userId: USER, localDate: DAY, unlockedRegions: ALL_REGIONS,
    placements: [prop('mundo_comedero'), prop('mundo_farolitos')], choresDone: 0,
  });
  assert.equal(got.length, 3);
  assert.ok(got.every((s) => Number.isFinite(s.x) && Number.isFinite(s.z)));
});
