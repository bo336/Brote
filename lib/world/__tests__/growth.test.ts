import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import {
  forageCycleHours, foragePhase, forageReturnsInHours, forageRipe, maturation, maturedScale,
} from '../growth';
import { FORAGE_RESPAWN, MATURATION } from '../config';

const SEED = 12345;
const NODES = ['forage-0', 'forage-1', 'forage-2', 'forage-3', 'forage-4', 'forage-5'];
const HOUR = 3_600_000;
const NOW = Date.UTC(2026, 8, 7, 12, 0, 0);

test('every node comes back inside the 4-8 hour window', () => {
  for (const id of NODES) {
    const h = forageCycleHours(id, SEED);
    assert.ok(h >= FORAGE_RESPAWN.minHours && h <= FORAGE_RESPAWN.maxHours, `${id}: ${h}h`);
  }
});

test('**the nodes are staggered, not synchronised**', () => {
  // Six nodes that all ripen together is one appointment, not six.
  const phases = NODES.map((id) => foragePhase(id, SEED, NOW));
  const spread = Math.max(...phases) - Math.min(...phases);
  assert.ok(spread > 0.2, `all six nodes sit within ${spread.toFixed(2)} of each other`);

  // And at a given moment some are carrying and some are not.
  const ripe = NODES.filter((id) => forageRipe(id, SEED, NOW)).length;
  assert.ok(ripe > 0 && ripe < NODES.length, `${ripe} of ${NODES.length} ripe`);
});

test('a node that is empty says how long until it is not', () => {
  for (const id of NODES) {
    const hours = forageReturnsInHours(id, SEED, NOW);
    if (forageRipe(id, SEED, NOW)) assert.equal(hours, 0);
    else assert.ok(hours > 0 && hours <= FORAGE_RESPAWN.maxHours, `${id}: ${hours}h`);
  }
});

test('a node harvested now is carrying again within its cycle', () => {
  // The appointment loop: the payoff waits, and it is never longer than the
  // window promises.
  for (const id of NODES) {
    const cycle = forageCycleHours(id, SEED);
    const later = NOW + cycle * HOUR;
    assert.equal(forageRipe(id, SEED, later), forageRipe(id, SEED, NOW), `${id} drifted`);
    // Somewhere inside one cycle it is definitely ripe.
    const anyRipe = Array.from({ length: 24 }, (_, i) =>
      forageRipe(id, SEED, NOW + (i / 24) * cycle * HOUR));
    assert.ok(anyRipe.includes(true), `${id} is never ripe`);
    assert.ok(anyRipe.includes(false), `${id} is always ripe`);
  }
});

test('two islands ripen differently', () => {
  const mine = NODES.map((id) => foragePhase(id, SEED, NOW));
  const yours = NODES.map((id) => foragePhase(id, 999, NOW));
  assert.notDeepEqual(mine, yours);
});

test('**maturation only ever adds**', () => {
  const start = Date.UTC(2026, 0, 1);
  let last = -1;
  for (const days of [0, 0.5, 1, 3, 7, 30, 365]) {
    const m = maturation(start, start + days * 24 * HOUR);
    assert.ok(m >= 0 && m <= 1, `${days}d -> ${m}`);
    assert.ok(m >= last, `${days}d went backwards`);
    last = m;
  }
  assert.equal(maturation(start, start), 0);
  assert.equal(maturation(start, start + MATURATION.daysToFull * 24 * HOUR), 1);
});

test('a clock that has gone backwards does not shrink the island', () => {
  const start = Date.UTC(2026, 0, 10);
  assert.equal(maturation(start, start - 5 * 24 * HOUR), 0);
  assert.equal(maturation(Number.NaN, start), 0);
});

test('a matured thing is bigger, and never by enough to block a path', () => {
  assert.equal(maturedScale(1, 0), 1);
  assert.equal(maturedScale(1, 1), 1 + MATURATION.scaleGain);
  assert.ok(MATURATION.scaleGain <= 0.15, 'growth this big would move colliders');
  // Out-of-range input cannot overdrive it.
  assert.equal(maturedScale(1, 5), 1 + MATURATION.scaleGain);
  assert.equal(maturedScale(1, -5), 1);
});
