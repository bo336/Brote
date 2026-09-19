import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { BANDS, forRegion, openGround, pick } from '../bands';
import { buildLayout } from '../layout';
import { cumulativeState } from '../progression';

/**
 * **The berry bush inside the ombú** (2026-09-14). Foraging and census spots came
 * from the same scatter points as the trees, so a spot could stand where a trunk
 * stands and the objective card pointed at something no player could reach.
 */
test('no spot a player walks up to shares a point with a tree', () => {
  const layout = buildLayout('open-ground', cumulativeState(11));
  const trees = new Set<object>();
  for (let v = 0; v < 3; v++) for (const p of forRegion(pick(layout.scatter, BANDS.trees, v, 3), 'trees')) trees.add(p);
  const open = openGround(layout.scatter);
  assert.ok(open.length > 0, 'nothing left to stand on');
  for (const p of open) assert.ok(!trees.has(p), `a spot at (${p.x.toFixed(1)}, ${p.z.toFixed(1)}) is a tree`);
  // La Arboleda is mostly trees, and still has somewhere to forage.
  assert.ok(openGround(layout.scatter.filter((p) => p.region === 'arboleda')).length >= 6);
});
