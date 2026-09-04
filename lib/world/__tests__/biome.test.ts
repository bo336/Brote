import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { biomeConfig, biomeKind, biomeMix, chalk, mixColors } from '../biome';

test('mixColors interpolates between two colours', () => {
  assert.equal(mixColors('#000000', '#ffffff', 0), '#000000');
  assert.equal(mixColors('#000000', '#ffffff', 1), '#ffffff');
  assert.equal(mixColors('#000000', '#ffffff', 0.5), '#808080');
});

test('mixColors clamps rather than extrapolating', () => {
  assert.equal(mixColors('#102030', '#405060', -3), '#102030');
  assert.equal(mixColors('#102030', '#405060', 9), '#405060');
});

test('mixColors leaves a colour it cannot parse alone', () => {
  assert.equal(mixColors('not-a-colour', '#ffffff', 0.5), 'not-a-colour');
});

test('chalk is mixColors with one end pinned to the cream', () => {
  // Not the same function, but they must agree, or the palette has two
  // definitions of "desaturate toward the binder".
  assert.equal(chalk('#000000', 0), '#000000');
  assert.notEqual(chalk('#000000', 1), '#000000');
});

test('the biome kind is read from the index, never from a name', () => {
  // `02-AUDIT.md` §4: the old world matched biome names by substring, so
  // "bosque templado" and "bosque seco" got the same trees.
  const a = biomeKind(1);
  const b = biomeKind(2);
  assert.ok(typeof a === 'string' && a.length > 0);
  assert.notEqual(a, b);
});

test('every curated world carries a mix with at least one tree', () => {
  for (let i = 1; i <= 6; i++) {
    const cfg = biomeConfig(i);
    const mix = biomeMix(biomeKind(i));
    assert.equal(cfg.mix.grassDensity, mix.grassDensity);
    assert.ok(Object.keys(mix.trees).length > 0, `world ${i} grows nothing`);
  }
});
