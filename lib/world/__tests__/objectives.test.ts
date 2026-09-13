import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { hasVisited, pickObjective, type ObjectiveRegion, type ObjectiveThing } from '../objectives';
import type { RegionId } from '../types';

/**
 * "I don't know what to do" — the objective is the answer, and its priorities
 * are the design. First steps, then today's chores, then what is near, then
 * what is unexplored, and never nothing.
 */
const thing = (id: string, x: number, z: number, enabled = true, verb?: ObjectiveThing['verb']): ObjectiveThing => ({
  id, position: [x, 0, z], enabled, labelKey: `chore.${id}`, verb,
});
const region = (id: RegionId, x: number, z: number, unlocked = true): ObjectiveRegion => ({ id, x, z, radius: 10, unlocked });
const regions = [region('claro', 0, 0), region('pradera', 30, 0), region('jardin', -30, 0), region('monte', 0, 60, false)];
const none = new Set<RegionId>();

test('the first session leads: move first, then the marked spot', () => {
  assert.equal(pickObjective({ pip: { x: 0, z: 0 }, things: [], regions, visited: none, firstRunBeat: 'move' }).kind, 'move');
  const o = pickObjective({
    pip: { x: 0, z: 0 }, things: [thing('first-run-plant', 3, 0), thing('chore-a', 1, 0)], regions, visited: none, firstRunBeat: 'plant',
  });
  assert.equal(o.kind, 'first');
  assert.deepEqual(o.target, { x: 3, z: 0 });
});

test("today's chores come next, nearest first, and count what is done", () => {
  const o = pickObjective({
    pip: { x: 0, z: 0 },
    things: [thing('chore-far', 20, 0), thing('chore-near', 4, 0), thing('chore-done', 1, 0, false)],
    regions, visited: none, firstRunBeat: null,
  });
  assert.equal(o.kind, 'chore');
  assert.equal(o.targetId, 'chore-near');
  assert.deepEqual(o.progress, { done: 1, total: 3 });
});

test('with the chores done, something near to gather or discover', () => {
  const o = pickObjective({
    pip: { x: 0, z: 0 },
    things: [thing('chore-a', 1, 0, false), thing('forage-1', 8, 0, true, 'forage'), thing('log-hornero', 5, 0, true, 'log')],
    regions, visited: none, firstRunBeat: null,
  });
  assert.equal(o.kind, 'gather');
  assert.equal(o.thingKey, 'verb.forage');
});

test('then an unvisited region, never the spawn and never a locked one', () => {
  const o = pickObjective({ pip: { x: 0, z: 0 }, things: [], regions, visited: new Set<RegionId>(['pradera']), firstRunBeat: null });
  assert.equal(o.kind, 'explore');
  assert.equal(o.thingKey, 'region.jardin');
});

test('and when everything is done and seen, it still says something', () => {
  const o = pickObjective({ pip: { x: 0, z: 0 }, things: [], regions, visited: new Set<RegionId>(['pradera', 'jardin']), firstRunBeat: null });
  assert.equal(o.kind, 'free');
  assert.equal(o.target, null);
});

test('visiting a region means walking well into it', () => {
  assert.ok(hasVisited(region('pradera', 30, 0), 27, 0));
  assert.ok(!hasVisited(region('pradera', 30, 0), 22, 0));
});
