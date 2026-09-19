import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { atLeast, livelinessWarmth, warmerBy } from '../liveliness';
import { LIVELINESS } from '../config';

/** Every value the wire could ever hand us, including ones it should not. */
const INPUTS = [
  Number.NEGATIVE_INFINITY, -5, 0, 0.2, LIVELINESS.min, 0.5, 0.9, LIVELINESS.max, 2, 1e9,
  Number.NaN, Number.POSITIVE_INFINITY,
];

test('warmth is always inside 0..1, whatever the wire says', () => {
  for (const v of INPUTS) {
    const w = livelinessWarmth(v);
    assert.ok(w >= 0 && w <= 1, `${v} -> ${w}`);
  }
});

test('warmth rises with liveliness and never falls', () => {
  let last = -1;
  for (let v = 0; v <= 1.0001; v += 0.05) {
    const w = livelinessWarmth(v);
    assert.ok(w >= last, `went down at ${v}`);
    last = w;
  }
});

test('**absence never empties the island**', () => {
  // `01-RULES.md` §4.2. At the quietest an island still has its floor of
  // whatever this scales, and the floor is never zero.
  for (const floor of [LIVELINESS.faunaFloor, LIVELINESS.moteFloor]) {
    for (const v of INPUTS) {
      const share = atLeast(floor, v);
      assert.ok(share >= floor, `${v} fell below the floor: ${share}`);
      assert.ok(share <= 1, `${v} went over full: ${share}`);
    }
    // The quietest island still has most of what the liveliest one has.
    assert.ok(atLeast(floor, LIVELINESS.min) > 0, 'an empty island is a wilted island');
    assert.equal(atLeast(floor, LIVELINESS.max), 1);
  }
});

test('**light only ever gets warmer, never dimmer**', () => {
  for (const v of INPUTS) {
    const k = warmerBy(LIVELINESS.keyWarmthGain, v);
    assert.ok(k >= 1, `${v} dimmed the key light to ${k}`);
    assert.ok(k <= 1 + LIVELINESS.keyWarmthGain, `${v} overdrove it to ${k}`);
  }
  // Somebody who has been away is not punished with a darker island.
  assert.equal(warmerBy(LIVELINESS.keyWarmthGain, LIVELINESS.min), 1);
});

test('a negative gain cannot be smuggled in to make it dim', () => {
  assert.equal(warmerBy(-0.5, 1), 1);
});
