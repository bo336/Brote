import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { MIRROR_RANGE } from '../config';
import { mirrorFrom } from '../impact';
import type { ImpactTotals, MirrorParams } from '../types';

const FIELDS = Object.keys(MIRROR_RANGE) as (keyof MirrorParams)[];

/** The spec's fixtures: 0, 1, 100, 10⁴, 10⁹ — plus the values that break things. */
const FIXTURES: ImpactTotals[] = [
  { water_l: 0, co2_kg: 0, waste_kg: 0, energy_kwh: 0 },
  { water_l: 1, co2_kg: 1, waste_kg: 1, energy_kwh: 1 },
  { water_l: 100, co2_kg: 100, waste_kg: 100, energy_kwh: 100 },
  { water_l: 1e4, co2_kg: 1e4, waste_kg: 1e4, energy_kwh: 1e4 },
  { water_l: 1e9, co2_kg: 1e9, waste_kg: 1e9, energy_kwh: 1e9 },
  { water_l: -50, co2_kg: -1, waste_kg: -0.1, energy_kwh: -1e6 },
  { water_l: Number.NaN, co2_kg: Number.POSITIVE_INFINITY, waste_kg: Number.NaN, energy_kwh: Number.NaN },
];

function within(value: number, range: readonly [number, number]): boolean {
  const lo = Math.min(range[0], range[1]);
  const hi = Math.max(range[0], range[1]);
  // A hair of slack for float error at the endpoints only.
  return value >= lo - 1e-9 && value <= hi + 1e-9;
}

test('every MirrorParams field is inside its clamp for every fixture', () => {
  for (const totals of FIXTURES) {
    const m = mirrorFrom(totals);
    for (const f of FIELDS) {
      assert.ok(Number.isFinite(m[f]), `${f} is not finite for ${JSON.stringify(totals)}`);
      assert.ok(
        within(m[f], MIRROR_RANGE[f]),
        `${f} = ${m[f]} outside ${JSON.stringify(MIRROR_RANGE[f])} for ${JSON.stringify(totals)}`,
      );
    }
  }
});

test('zero impact sits exactly at the low end of every range', () => {
  const m = mirrorFrom({ water_l: 0, co2_kg: 0, waste_kg: 0, energy_kwh: 0 });
  for (const f of FIELDS) assert.equal(m[f], MIRROR_RANGE[f][0], `${f} does not start at its range floor`);
});

test('the mapping is monotonic, so no world system can ever regress', () => {
  const steps = [0, 10, 200, 5_000, 500_000, 1e9];
  let prev = mirrorFrom({ water_l: 0, co2_kg: 0, waste_kg: 0, energy_kwh: 0 });
  for (const v of steps.slice(1)) {
    const next = mirrorFrom({ water_l: v, co2_kg: v, waste_kg: v, energy_kwh: v });
    for (const f of FIELDS) {
      const ascending = MIRROR_RANGE[f][1] >= MIRROR_RANGE[f][0];
      assert.ok(
        ascending ? next[f] >= prev[f] : next[f] <= prev[f],
        `${f} moved the wrong way between impact steps`,
      );
    }
    prev = next;
  }
});

test('the debris field only ever shrinks, and reaches zero', () => {
  const start = mirrorFrom({ water_l: 0, co2_kg: 0, waste_kg: 0, energy_kwh: 0 });
  const end = mirrorFrom({ water_l: 0, co2_kg: 0, waste_kg: 1e9, energy_kwh: 0 });
  assert.equal(start.debrisCount, 40);
  assert.equal(end.debrisCount, 0);
});

test('instance counts are integers — you cannot render 7.4 lanterns', () => {
  for (const totals of FIXTURES) {
    const m = mirrorFrom(totals);
    for (const f of ['debrisCount', 'lanternCount', 'fireflyCount'] as const) {
      assert.ok(Number.isInteger(m[f]), `${f} = ${m[f]} is not an integer`);
    }
  }
});

test('each metric drives only its own channel', () => {
  const base = mirrorFrom({ water_l: 0, co2_kg: 0, waste_kg: 0, energy_kwh: 0 });
  const waterOnly = mirrorFrom({ water_l: 1e6, co2_kg: 0, waste_kg: 0, energy_kwh: 0 });
  assert.notEqual(waterOnly.riverWidth, base.riverWidth);
  assert.equal(waterOnly.fogFar, base.fogFar);
  assert.equal(waterOnly.debrisCount, base.debrisCount);
  assert.equal(waterOnly.lanternCount, base.lanternCount);
});
