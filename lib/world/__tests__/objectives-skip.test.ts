import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { pickObjective, type ObjectiveThing } from '../objectives';
import type { RegionId } from '../types';

/**
 * **The fishing spot that was the objective forever** (2026-09-14). Fishing
 * spots never switch off, so after a fish was landed the card kept pointing at
 * the same spot and the guide never moved on.
 */
test('a thing that just paid out stops being the objective', () => {
  const things: ObjectiveThing[] = [
    { id: 'fish-0', position: [1, 0, 0], enabled: true, labelKey: 'verb.fish', verb: 'fish' },
    { id: 'log-trebol', position: [6, 0, 0], enabled: true, labelKey: 'verb.log', verb: 'log' },
  ];
  const input = { pip: { x: 0, z: 0 }, things, regions: [], visited: new Set<RegionId>(), firstRunBeat: null };
  assert.equal(pickObjective(input).targetId, 'fish-0');
  assert.equal(pickObjective({ ...input, skip: new Set(['fish-0']) }).targetId, 'log-trebol');
  // With everything nearby done, the card still says something rather than nothing.
  const after = pickObjective({ ...input, skip: new Set(['fish-0', 'log-trebol']) });
  assert.ok(after.titleKey.length > 0);
});

test('a chore done this session still counts toward today', () => {
  const chore = (id: string, x: number, enabled: boolean): ObjectiveThing =>
    ({ id, position: [x, 0, 0], enabled, labelKey: `chore.${id}` });
  const things = [chore('chore-a', 1, false), chore('chore-b', 2, true), chore('chore-c', 3, true)];
  const o = pickObjective({
    pip: { x: 0, z: 0 }, things, regions: [], visited: new Set<RegionId>(), firstRunBeat: null,
    skip: new Set(['chore-a']),
  });
  assert.equal(o.targetId, 'chore-b');
  assert.deepEqual(o.progress, { done: 1, total: 3 });
});
