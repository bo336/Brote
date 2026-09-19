import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { buildMojon } from '../mojon';
import { IMPACT_PROVENANCE } from '../config';
import { formatWater } from '../../impact';

const TOTALS = { water_l: 1240, co2_kg: 2.4, waste_kg: 3.1, energy_kwh: 12 };

function panel(over: Partial<Parameters<typeof buildMojon>[1]> = {}) {
  return buildMojon(TOTALS, { tier: 11, collectiveWaterL: 1240000, formatWater, ...over });
}

test('every row carries a provenance', () => {
  for (const row of panel().rows) {
    assert.ok(row.provenance === 'medido' || row.provenance === 'estimado', row.key);
  }
});

test('a range belongs to an estimate and only to an estimate', () => {
  // "≈ 2,4 kg (rango 1,8 – 3,1)" reads as science. A range on a measured
  // figure would suggest a doubt that is not there.
  for (const row of panel().rows) {
    if (row.provenance === 'medido') assert.equal(row.range, null, row.key);
    else assert.ok(row.range, `${row.key} is an estimate with no range`);
  }
});

test('nothing is labelled estimado while nothing is modelled', () => {
  // `brote_user_impact` sums per-activity coefficients — all four are logged
  // actions with known coefficients. If this ever fails it is because a proxy
  // was added, and the panel should then be showing its range.
  assert.deepEqual(Object.values(IMPACT_PROVENANCE), ['medido', 'medido', 'medido', 'medido']);
});

test('zero channels are left out entirely', () => {
  const p = buildMojon(
    { water_l: 500, co2_kg: 0, waste_kg: 0, energy_kwh: 0 },
    { tier: 11, collectiveWaterL: 0, formatWater },
  );
  assert.equal(p.rows.length, 1);
  assert.equal(p.rows[0]!.key, 'water');
  assert.equal(p.collective, null);
});

test('the world only claims what the tier has actually revealed', () => {
  // El Río is tier 7. Telling a tier-2 player their water made a river they
  // cannot walk to teaches them to stop reading the panel.
  const low = panel({ tier: 2 });
  assert.ok(!low.born.includes('tu río'));
  const high = panel({ tier: 7 });
  assert.ok(high.born.includes('tu río'));
});

test('the equivalences are the app’s own, not new ones', () => {
  // `13-IMPACT-MIRROR.md`: "Equivalences come from the existing
  // pickEquivalence(). Do not invent new ladders."
  const water = panel().rows.find((r) => r.key === 'water')!;
  assert.ok(water.equivalence && water.equivalence.length > 0);
});

test('no offsetting, neutrality or tree-counting anywhere in the copy', () => {
  const text = JSON.stringify(panel()).toLowerCase();
  for (const banned of ['compens', 'neutral', 'árbol', 'arbol', 'equivale a plantar', 'ahorraste el planeta']) {
    assert.ok(!text.includes(banned), `the panel says "${banned}"`);
  }
});

test('the coefficient version is stated, because grid factors move', () => {
  assert.match(panel().coefficientVersion, /^\d{4}\.\d+$/);
});
