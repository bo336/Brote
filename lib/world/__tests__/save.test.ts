import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { placementCap } from '../config';
import { buildLayout } from '../layout';
import { cumulativeState } from '../progression';
import { deserializePlacements, serializePlacements, snapRotation, validateBatch, validatePlacement } from '../save';
import type { Placement } from '../types';

const USER = '3f1c0e2a-0000-4000-8000-000000000001';
const OWNED = ['mundo_banco', 'mundo_comedero', 'mundo_hamaca', 'mundo_farolitos'];

function placement(over: Partial<Placement> = {}): Placement {
  return { prop_slug: 'mundo_banco', region: 'claro', x: 1, z: 1, rot_y: 0, variant: 0, ...over };
}

test('a legal placement is accepted', () => {
  const cfg = cumulativeState(3);
  assert.deepEqual(validatePlacement(placement(), cfg, OWNED), { ok: true });
});

test('rejects a prop the player does not own', () => {
  const r = validatePlacement(placement({ prop_slug: 'mundo_molino' }), cumulativeState(4), OWNED);
  assert.deepEqual(r, { ok: false, reason: 'not_owned' });
});

test('rejects a locked region', () => {
  const r = validatePlacement(placement({ region: 'rio' }), cumulativeState(3), OWNED);
  assert.deepEqual(r, { ok: false, reason: 'region_locked' });
});

test('rejects over the cap of 4 + tier × 3', () => {
  const cfg = cumulativeState(2);
  const cap = placementCap(cfg.tier);
  assert.equal(cap, 10);
  assert.deepEqual(validatePlacement(placement(), cfg, OWNED, { existingCount: cap - 1 }), { ok: true });
  assert.deepEqual(validatePlacement(placement(), cfg, OWNED, { existingCount: cap }), {
    ok: false,
    reason: 'over_cap',
  });
});

test('rejects an off-island placement', () => {
  const cfg = cumulativeState(1);
  assert.deepEqual(validatePlacement(placement({ x: 999, z: 0 }), cfg, OWNED), {
    ok: false,
    reason: 'off_island',
  });
  assert.deepEqual(validatePlacement(placement({ x: Number.NaN, z: 0 }), cfg, OWNED), {
    ok: false,
    reason: 'off_island',
  });
});

test('rejects unplantable ground when the terrain is supplied', () => {
  const cfg = cumulativeState(7);
  const layout = buildLayout(USER, cfg);
  const lake = layout.terrain.lakes[0];
  assert.ok(lake, 'tier 7 should have carved a lake');
  const r = validatePlacement(
    placement({ region: 'rio', x: lake.x, z: lake.z }),
    cfg,
    OWNED,
    { terrain: layout.terrain },
  );
  assert.deepEqual(r, { ok: false, reason: 'not_plantable' });
});

test('rejects a placement inside another prop footprint, with a nudgeable reason', () => {
  const cfg = cumulativeState(3);
  const r = validatePlacement(placement({ x: 1, z: 1 }), cfg, OWNED, {
    others: [placement({ x: 1.1, z: 1.05 })],
  });
  assert.deepEqual(r, { ok: false, reason: 'overlaps' });
});

test('a batch is rejected whole on any single failure — as the RPC does', () => {
  const cfg = cumulativeState(3);
  const good = placement({ x: 0, z: 0 });
  const bad = placement({ region: 'monte' });
  assert.deepEqual(validateBatch([good], cfg, OWNED), { ok: true });
  assert.deepEqual(validateBatch([good, bad], cfg, OWNED), { ok: false, reason: 'region_locked' });
});

test('a batch longer than the cap is rejected before anything else', () => {
  const cfg = cumulativeState(1);
  const many = Array.from({ length: placementCap(1) + 1 }, (_, i) => placement({ x: i * 2, z: 0 }));
  assert.deepEqual(validateBatch(many, cfg, OWNED), { ok: false, reason: 'over_cap' });
});

test('rotation snaps to 15 degrees', () => {
  const step = (15 * Math.PI) / 180;
  assert.ok(Math.abs(snapRotation(step * 2.4) - step * 2) < 1e-9);
  assert.equal(snapRotation(0), 0);
});

test('serialise → deserialise round-trips a placement', () => {
  const input: Placement[] = [placement({ x: 1.23456, z: -4.5678, rot_y: 0.3 })];
  const out = deserializePlacements(serializePlacements(input));
  assert.equal(out.length, 1);
  assert.equal(out[0]!.prop_slug, 'mundo_banco');
  assert.ok(Math.abs(out[0]!.x - 1.235) < 1e-9);
  assert.ok(Math.abs(out[0]!.z + 4.568) < 1e-9);
});

test('deserialising junk drops rows instead of throwing — a placement is never lost to a crash', () => {
  assert.deepEqual(deserializePlacements(null), []);
  assert.deepEqual(deserializePlacements('nope'), []);
  assert.deepEqual(deserializePlacements([{ prop_slug: 'x' }]), []);
  assert.equal(deserializePlacements([placement(), { junk: true }]).length, 1);
});
