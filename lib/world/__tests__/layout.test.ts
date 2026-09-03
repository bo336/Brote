import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { buildLayout, regionAt } from '../layout';
import { cumulativeState } from '../progression';
import { isPlantable } from '../terrain';

const USER = '3f1c0e2a-0000-4000-8000-000000000001';
const OTHER = '9b7d5a11-0000-4000-8000-000000000002';

function fingerprint(l: ReturnType<typeof buildLayout>): string {
  return JSON.stringify({
    seed: l.seed,
    radius: l.radius,
    coast: Array.from(l.coastline),
    scatter: l.scatter.map((s) => [s.x, s.z, s.region, s.roll]),
    anchors: l.anchors,
    caches: l.caches,
    spawn: l.spawn,
  });
}

test('the same (userId, tier) gives a byte-identical island, every time', () => {
  for (const tier of [1, 4, 7, 11]) {
    const cfg = cumulativeState(tier);
    assert.equal(fingerprint(buildLayout(USER, cfg)), fingerprint(buildLayout(USER, cfg)));
  }
});

test('a different user gets a different island', () => {
  const cfg = cumulativeState(7);
  assert.notEqual(fingerprint(buildLayout(USER, cfg)), fingerprint(buildLayout(OTHER, cfg)));
});

test('but the region structure is identical for everyone', () => {
  const cfg = cumulativeState(9);
  const a = buildLayout(USER, cfg).regions;
  const b = buildLayout(OTHER, cfg).regions;
  assert.deepEqual(a, b);
});

test('every scatter point lands on plantable ground', () => {
  for (const tier of [1, 5, 8, 11]) {
    const layout = buildLayout(USER, cumulativeState(tier));
    assert.ok(layout.scatter.length > 0, `tier ${tier} produced no scatter points`);
    for (const p of layout.scatter) {
      assert.ok(isPlantable(p.x, p.z, layout.terrain), `tier ${tier}: (${p.x}, ${p.z}) is not plantable`);
    }
  }
});

test('scatter points respect the minimum spacing and stay inside the island', () => {
  const layout = buildLayout(USER, cumulativeState(7));
  for (let i = 0; i < layout.scatter.length; i++) {
    const p = layout.scatter[i]!;
    assert.ok(Math.hypot(p.x, p.z) <= layout.radius);
    for (let j = i + 1; j < layout.scatter.length; j++) {
      const q = layout.scatter[j]!;
      assert.ok(Math.hypot(p.x - q.x, p.z - q.z) >= 0.339, 'two scatter points are on top of each other');
    }
  }
});

test('scatter points are tagged with an unlocked region', () => {
  const cfg = cumulativeState(3);
  const layout = buildLayout(USER, cfg);
  for (const p of layout.scatter) assert.ok(cfg.regions.includes(p.region));
});

test('the island grows by adding regions, never by scaling a disc', () => {
  let prevUnlocked = 0;
  for (let tier = 1; tier <= 11; tier++) {
    const layout = buildLayout(USER, cumulativeState(tier));
    assert.equal(layout.regions.length, 9, 'the full extent must exist in the data from day one');
    const unlocked = layout.regions.filter((r) => r.unlocked).length;
    assert.ok(unlocked >= prevUnlocked, `tier ${tier} lost a region`);
    prevUnlocked = unlocked;
  }
  assert.equal(prevUnlocked, 9);
});

test('anchors only exist for features the tier actually granted', () => {
  const t1 = buildLayout(USER, cumulativeState(1));
  assert.deepEqual(
    t1.anchors.map((a) => a.feature),
    ['mojon'],
  );
  const t11 = buildLayout(USER, cumulativeState(11)).anchors.map((a) => a.feature);
  for (const f of ['mojon', 'bench', 'treehouse', 'bridge', 'cave', 'telescope', 'monument', 'boat']) {
    assert.ok(t11.includes(f as never), `tier 11 is missing the ${f} anchor`);
  }
});

test('the river and the snow line appear exactly at their tiers', () => {
  assert.equal(buildLayout(USER, cumulativeState(6)).riverPath, null);
  assert.ok(buildLayout(USER, cumulativeState(7)).riverPath);
  assert.equal(buildLayout(USER, cumulativeState(8)).snowLine, null);
  assert.ok((buildLayout(USER, cumulativeState(9)).snowLine ?? 0) > 0);
});

test('traversal caches sit in unlocked regions and need a verb the player has', () => {
  const cfg = cumulativeState(6);
  const layout = buildLayout(USER, cfg);
  const perRegion = new Map<string, number>();
  for (const c of layout.caches) {
    assert.ok(cfg.regions.includes(c.region));
    assert.ok(cfg.verbs.includes(c.verb), `cache needs ${c.verb}, which tier 6 does not have`);
    perRegion.set(c.region, (perRegion.get(c.region) ?? 0) + 1);
  }
  for (const [region, n] of perRegion) assert.ok(n <= 10, `${region} has ${n} caches, over the cap of 10`);
});

test('the spawn is on plantable ground in El Claro', () => {
  const layout = buildLayout(USER, cumulativeState(1));
  assert.ok(isPlantable(layout.spawn[0], layout.spawn[1], layout.terrain));
  assert.equal(regionAt(layout.spawn[0], layout.spawn[1], layout.regions), 'claro');
});

test('the coastline is irregular — a perfect disc is what made it read as a widget', () => {
  const layout = buildLayout(USER, cumulativeState(5));
  const values = Array.from(layout.coastline);
  const min = Math.min(...values);
  const max = Math.max(...values);
  assert.ok(max - min > layout.radius * 0.1, 'the coastline is too close to a circle');
});
