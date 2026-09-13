import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { PATHS } from '../config';
import { buildLayout } from '../layout';
import { pathDistance, pathsFor, pathWeight } from '../paths';
import { cumulativeState } from '../progression';

/**
 * The worn paths are how a new player finds the regions (`lib/world/paths.ts`).
 * They have to exist for every open region, start where the player starts, and
 * be the same paths on every device.
 */
test('the same island lays the same paths', () => {
  const a = pathsFor(buildLayout('paths-a', cumulativeState(11)));
  const b = pathsFor(buildLayout('paths-a', cumulativeState(11)));
  assert.deepEqual(Array.from(a.segments), Array.from(b.segments));
});

test('tier 1 has only El Claro, so it has no paths', () => {
  assert.equal(pathsFor(buildLayout('paths-t1', cumulativeState(1))).count, 0);
});

test('every open region past the spawn has a path that starts at the spawn and arrives near it', () => {
  const layout = buildLayout('paths-t11', cumulativeState(11));
  const paths = pathsFor(layout);
  assert.ok(paths.count > 0);
  assert.equal(pathWeight(layout.spawn[0], layout.spawn[1], paths), 1, 'the spawn is not on a path');
  for (const region of layout.regions) {
    if (!region.unlocked || region.id === 'claro') continue;
    const d = Math.hypot(region.x - layout.spawn[0], region.z - layout.spawn[1]);
    if (d < 3) continue;
    // Somewhere within the region's own radius of its centre, a path is underfoot.
    let best = 0;
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2;
      for (const f of [0.2, 0.4, 0.6]) {
        best = Math.max(best, pathWeight(region.x + Math.cos(a) * region.radius * f, region.z + Math.sin(a) * region.radius * f, paths));
      }
    }
    assert.ok(best > 0.5, `no path reaches ${region.id}`);
  }
});

test('far from every path the ground is not path', () => {
  const layout = buildLayout('paths-t4', cumulativeState(4));
  assert.equal(pathWeight(1000, 1000, pathsFor(layout)), 0);
});

test('the distance map and the weight agree on where a path is', () => {
  const layout = buildLayout('paths-t11', cumulativeState(11));
  const paths = pathsFor(layout);
  assert.equal(pathDistance(layout.spawn[0], layout.spawn[1], paths), 0, 'a path starts at the spawn');
  assert.equal(pathDistance(0, 0, pathsFor(buildLayout('paths-t1', cumulativeState(1)))), Infinity);
  for (let k = 0; k < 200; k++) {
    const x = Math.sin(k * 12.9898) * 40;
    const z = Math.cos(k * 78.233) * 40;
    const d = pathDistance(x, z, paths);
    const w = pathWeight(x, z, paths);
    if (d <= PATHS.widthM * 0.5) assert.equal(w, 1);
    if (d >= PATHS.widthM * 0.5 + PATHS.edgeM) assert.equal(w, 0);
  }
});
