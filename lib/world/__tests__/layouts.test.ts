import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { firstFreeSlot, loadable, slotName, slotOf, slots } from '../layouts';
import { LAYOUTS, placementCap } from '../config';
import type { Placement, WorldLayout } from '../types';

function saved(index: number, placements: Placement[] = []): WorldLayout {
  return { name: slotName(index), placements };
}

function p(over: Partial<Placement> = {}): Placement {
  return { prop_slug: 'mundo_banco', region: 'claro', x: 0, z: 0, rot_y: 0, variant: 0, ...over };
}

const CTX = {
  tier: 4,
  owned: ['mundo_banco', 'mundo_hamaca'],
  regionAt: () => 'claro' as const,
};

test('slot names round-trip', () => {
  for (let i = 0; i < LAYOUTS.maxSlots; i++) {
    assert.equal(slotOf({ name: slotName(i), placements: [] }), i);
  }
  // A layout named by hand, or by an older build, is not one of our slots and
  // must not be mistaken for one.
  assert.equal(slotOf({ name: 'mi jardín', placements: [] }), -1);
  assert.equal(slotOf({ name: `${LAYOUTS.slotPrefix}0`, placements: [] }), -1);
  assert.equal(slotOf({ name: `${LAYOUTS.slotPrefix}99`, placements: [] }), -1);
});

test('the bar draws one entry per slot, filled or empty', () => {
  const row = slots([saved(2)], 3);
  assert.equal(row.length, 3);
  assert.equal(row[0], null);
  assert.equal(row[1], null);
  assert.equal(row[2]?.name, slotName(2));
});

test('saving picks the first empty slot, and says so when there is none', () => {
  assert.equal(firstFreeSlot([], 3), 0);
  assert.equal(firstFreeSlot([saved(0)], 3), 1);
  assert.equal(firstFreeSlot([saved(0), saved(1), saved(2)], 3), -1);
  // A slot named outside our scheme occupies nothing.
  assert.equal(firstFreeSlot([{ name: 'otro', placements: [] }], 3), 0);
});

test('loading takes what still fits instead of refusing the lot', () => {
  const cap = placementCap(CTX.tier);
  const tooMany = saved(0, Array.from({ length: cap + 5 }, (_, i) => p({ x: i * 2 - 10 })));
  const got = loadable(tooMany, CTX);
  assert.equal(got.length, cap);
});

test('loading drops a prop the player no longer owns, and keeps the rest', () => {
  const layout = saved(0, [p({ prop_slug: 'mundo_banco' }), p({ prop_slug: 'mundo_molino', x: 3 })]);
  const got = loadable(layout, CTX);
  assert.equal(got.length, 1);
  assert.equal(got[0]!.prop_slug, 'mundo_banco');
});

test('loading re-derives the region from where the prop actually is', () => {
  // The saved region is not trusted: the island grows, and a spot that was in
  // el claro at tier 2 may be in la pradera by tier 5.
  const layout = saved(0, [p({ region: 'monte', x: 1, z: 1 })]);
  const got = loadable(layout, { ...CTX, regionAt: () => 'pradera' as const });
  assert.equal(got[0]!.region, 'pradera');
});
