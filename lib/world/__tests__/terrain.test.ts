import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { bakeHeightfield, makeLayout, sampleHeight, sampleNormal, terrainHeight } from '../terrain';

const LAYOUT = makeLayout(6, 24, true);

test('the same seed produces a byte-identical heightfield', () => {
  const a = bakeHeightfield(makeLayout(6, 24, true), 96);
  const b = bakeHeightfield(makeLayout(6, 24, true), 96);
  assert.equal(a.res, b.res);
  assert.equal(a.data.length, b.data.length);
  assert.deepEqual(Buffer.from(a.data.buffer), Buffer.from(b.data.buffer));
});

test('a different layout produces a different heightfield', () => {
  const a = bakeHeightfield(makeLayout(6, 24, true), 64);
  const b = bakeHeightfield(makeLayout(2, 24, true), 64);
  assert.notDeepEqual(Buffer.from(a.data.buffer), Buffer.from(b.data.buffer));
});

test('terrainHeight itself is pure — repeated calls agree exactly', () => {
  for (const [x, z] of [
    [0, 0],
    [3.5, -7.25],
    [-11.1, 4.4],
    [23.9, 0.1],
  ] as const) {
    assert.equal(terrainHeight(x, z, LAYOUT), terrainHeight(x, z, LAYOUT));
  }
});

test('sampleHeight reproduces the baked grid exactly at grid nodes', () => {
  const hf = bakeHeightfield(LAYOUT, 65);
  for (let i = 0; i < hf.res; i += 8) {
    const p = -hf.extent + i * hf.step;
    const expected = hf.data[i * hf.res + i]!;
    assert.ok(Math.abs(sampleHeight(hf, p, p) - expected) < 1e-5);
  }
});

test('sampleHeight tracks the real height function closely between nodes', () => {
  const hf = bakeHeightfield(LAYOUT, 192);
  let worst = 0;
  for (let i = 0; i < 400; i++) {
    // A deterministic sweep — no Math.random in a test that guards determinism.
    const a = (i / 400) * Math.PI * 2 * 7;
    const r = (i / 400) * LAYOUT.R * 0.9;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    worst = Math.max(worst, Math.abs(sampleHeight(hf, x, z) - terrainHeight(x, z, LAYOUT)));
  }
  assert.ok(worst < 0.05, `bilinear sampling drifted ${worst.toFixed(4)} from the source`);
});

test('sampling outside the field clamps instead of reading out of bounds', () => {
  const hf = bakeHeightfield(LAYOUT, 32);
  for (const [x, z] of [
    [-1e6, 0],
    [1e6, 0],
    [0, -1e6],
    [0, 1e6],
    [1e6, 1e6],
  ] as const) {
    assert.ok(Number.isFinite(sampleHeight(hf, x, z)));
  }
});

test('sampleNormal returns a unit vector that points up', () => {
  const hf = bakeHeightfield(LAYOUT, 96);
  for (const [x, z] of [
    [0, 0],
    [5, 5],
    [-8, 2],
  ] as const) {
    const n = sampleNormal(hf, x, z);
    assert.ok(Math.abs(Math.hypot(n[0], n[1], n[2]) - 1) < 1e-6);
    assert.ok(n[1] > 0);
  }
});

test('the heightfield covers the island plus its shoreline margin', () => {
  const hf = bakeHeightfield(LAYOUT, 64);
  assert.ok(hf.extent > LAYOUT.R);
  assert.equal(hf.data.length, hf.res * hf.res);
});
