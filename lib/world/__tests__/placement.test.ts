import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { checkBatch, checkPlacement, nudgeClear, propAt, remainingSlots, snapRotation } from '../placement';
import { placementCap } from '../config';
import type { Placement } from '../types';

const OWNED = ['mundo_banco', 'mundo_hamaca'];

function p(over: Partial<Placement> = {}): Placement {
  return { prop_slug: 'mundo_banco', region: 'claro', x: 0, z: 0, rot_y: 0, variant: 0, ...over };
}

test('rotation snaps to 15 degrees', () => {
  const step = (15 * Math.PI) / 180;
  assert.equal(snapRotation(0), 0);
  assert.ok(Math.abs(snapRotation(step * 2.4) - step * 2) < 1e-9);
  assert.ok(Math.abs(snapRotation(step * 2.6) - step * 3) < 1e-9);
});

test('a snapped rotation round-trips inside one turn', () => {
  // A saved rotation has to come back as the same number, or a bench rotates
  // itself a little every time the island is reloaded.
  for (const a of [-0.1, -7, 7, 100]) {
    const once = snapRotation(a);
    assert.equal(snapRotation(once), once);
    assert.ok(once >= 0 && once < Math.PI * 2, String(once));
  }
});

test('the cap is four plus three a tier', () => {
  assert.equal(placementCap(1), 7);
  assert.equal(placementCap(11), 37);
  assert.equal(remainingSlots(1, 7), 0);
  assert.equal(remainingSlots(1, 99), 0);
  assert.equal(remainingSlots(1, 2), 5);
});

test('an overlap is nudged clear, not refused', () => {
  const others = [{ x: 0, z: 0, radius: 0.6 }];
  const out = nudgeClear(0.1, 0, 0.6, others);
  assert.ok(out, 'the nudge gave up on a single obstacle');
  assert.ok(out!.moved);
  assert.ok(Math.hypot(out!.x, out!.z) >= 1.2, 'still overlapping after the nudge');
});

test('a clear spot is left exactly where it was', () => {
  const out = nudgeClear(5, 5, 0.6, [{ x: 0, z: 0, radius: 0.6 }]);
  assert.deepEqual(out, { x: 5, z: 5, moved: false });
});

test('dead centre on another prop still nudges somewhere finite', () => {
  // No "away" direction exists here; the result must still be a number.
  const out = nudgeClear(0, 0, 0.6, [{ x: 0, z: 0, radius: 0.6 }]);
  assert.ok(out);
  assert.ok(Number.isFinite(out!.x) && Number.isFinite(out!.z));
});

test('boxed in on all sides, it gives up rather than looping', () => {
  const ring = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ring.push({ x: Math.cos(a) * 0.5, z: Math.sin(a) * 0.5, radius: 1.2 });
  }
  assert.equal(nudgeClear(0, 0, 0.6, ring, 2), null);
});

test('the four refusals match the server, in the server’s order', () => {
  const base = { tier: 3, owned: OWNED, placedCount: 0 };
  assert.equal(checkPlacement(p(), base), null);
  assert.equal(checkPlacement(p(), { ...base, placedCount: placementCap(3) }), 'over_cap');
  assert.equal(checkPlacement(p({ prop_slug: 'mundo_molino' }), base), 'not_owned');
  assert.equal(checkPlacement(p({ region: 'arboleda' }), base), 'region_locked');
  assert.equal(checkPlacement(p({ x: 999 }), base), 'off_island');
});

test('the cap is checked before ownership, like the RPC', () => {
  // Order matters: the reason shown to the player should be the reason the
  // save would have failed with, not a different true statement.
  const reason = checkPlacement(p({ prop_slug: 'mundo_molino' }), {
    tier: 3,
    owned: OWNED,
    placedCount: 99,
  });
  assert.equal(reason, 'over_cap');
});

test('ground is consulted when the caller can answer', () => {
  const base = { tier: 3, owned: OWNED, placedCount: 0, isGround: () => false };
  assert.equal(checkPlacement(p(), base), 'no_ground');
});

test('a batch is checked as a batch, not item by item against the cap', () => {
  const ctx = { tier: 1, owned: OWNED };
  const seven = Array.from({ length: placementCap(1) }, () => p());
  assert.equal(checkBatch(seven, ctx), null);
  assert.equal(checkBatch([...seven, p()], ctx), 'over_cap');
});

test('one bad item rejects the whole batch', () => {
  // The RPC rejects the batch, so the client must not send one it knows is bad.
  assert.equal(
    checkBatch([p(), p({ region: 'cumbre' })], { tier: 3, owned: OWNED }),
    'region_locked',
  );
});

test('a tap lifts the prop under it, and nothing when there is none', () => {
  const list = [
    p({ prop_slug: 'mundo_banco', x: 0, z: 0 }),
    p({ prop_slug: 'mundo_hamaca', x: 4, z: 0 }),
  ];
  const footprint = () => 0.5;
  assert.equal(propAt(0.1, 0.1, list, footprint), 0);
  assert.equal(propAt(4, 0.2, list, footprint), 1);
  // Between them is empty ground, and a tap there must start a drag rather
  // than silently lift whichever bench happens to be nearer.
  assert.equal(propAt(2, 0, list, footprint), -1);
  assert.equal(propAt(0, 0, [], footprint), -1);
});

test('overlapping footprints still resolve to exactly one prop', () => {
  // The nudge can leave two things closer than the sum of their radii; the
  // tap has to pick the one whose centre is nearer, not both and not neither.
  const list = [p({ x: 0, z: 0 }), p({ x: 0.3, z: 0 })];
  assert.equal(propAt(0.05, 0, list, () => 0.5), 0);
  assert.equal(propAt(0.28, 0, list, () => 0.5), 1);
});
