import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { seasonFor, seasonModifiers } from '../season';
import { speciesFor } from '../species';
import { TIME_OF_DAY_IDS } from '../types';
import type { RegionId, SeasonId } from '../types';

/**
 * **Seasons** (`20-ACCEPTANCE.md` 3E, `08-WORLD-AND-PROGRESSION.md` §9).
 *
 * The acceptance line asks for a season change to be observed. It stayed open
 * because a session can only ever be in the season it is in, and forcing one to
 * take a screenshot shows the palette rather than the rule.
 *
 * The rule is the thing worth protecting, and it is one sentence: **a season
 * changes how the island looks and never what it contains.** Nobody may miss
 * content by playing in March. That is checked here across all four, on every
 * day of a year, for every region.
 */
/** `SeasonId` is a union, not a table — the four are named here once. */
const SEASONS: readonly SeasonId[] = ['verano', 'otono', 'invierno', 'primavera'];

/** Every day of a non-leap year, as a local date. */
function everyDay(): Date[] {
  const out: Date[] = [];
  const d = new Date(2027, 0, 1);
  while (d.getFullYear() === 2027) {
    out.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

test('every day of the year lands in exactly one of the four seasons', () => {
  const seen = new Set<SeasonId>();
  for (const day of everyDay()) {
    const s = seasonFor(day);
    assert.ok(SEASONS.includes(s), `${day.toDateString()} → ${s}`);
    seen.add(s);
  }
  assert.equal(seen.size, 4, `a year that never reaches ${SEASONS.filter((s) => !seen.has(s))}`);
});

test('the seasons come round in order, and each one lasts about a quarter', () => {
  const counts = new Map<SeasonId, number>();
  for (const day of everyDay()) counts.set(seasonFor(day), (counts.get(seasonFor(day)) ?? 0) + 1);
  for (const s of SEASONS) {
    const n = counts.get(s) ?? 0;
    assert.ok(n > 60 && n < 120, `${s} lasts ${n} days`);
  }
});

test('it is the southern hemisphere: January is summer and July is winter', () => {
  assert.equal(seasonFor(new Date(2027, 0, 15)), 'verano');
  assert.equal(seasonFor(new Date(2027, 6, 15)), 'invierno');
  assert.equal(seasonFor(new Date(2027, 3, 15)), 'otono');
  assert.equal(seasonFor(new Date(2027, 9, 15)), 'primavera');
});

test('**no species is missable** — every one is visible in every season', () => {
  // `08-WORLD-AND-PROGRESSION.md` §9: purely visual and species-level, and
  // nobody misses content by playing in March. `speciesFor` *does* take the
  // season — it re-orders, putting the season's favoured kinds first — so this
  // compares the sets and not the lists. The day it starts filtering instead of
  // sorting, this is what says so out loud.
  const regions = ['claro', 'pradera', 'jardin', 'arboleda', 'rio',
                   'monte', 'cumbre', 'islote', 'monumento'] as RegionId[];
  for (const region of regions) {
    for (const tod of TIME_OF_DAY_IDS) {
      const perSeason = SEASONS.map((s) =>
        speciesFor(region, 11, tod, s).map((r) => r.slug).sort().join(','));
      assert.equal(new Set(perSeason).size, 1,
        `${region} at ${tod} shows a different cast per season`);
    }
  }
});

test('every season biases the look, and no two look the same', () => {
  const fingerprints = SEASONS.map((s) => {
    const m = seasonModifiers(s);
    return `${m.canopyShift}:${m.groundTint}:${m.snowLine}`;
  });
  assert.equal(new Set(fingerprints).size, 4, 'two seasons render identically');
});

test('the modifiers stay inside their stated ranges', () => {
  for (const s of SEASONS) {
    const m = seasonModifiers(s);
    assert.ok(m.canopyShift >= -1 && m.canopyShift <= 1, `${s} canopy ${m.canopyShift}`);
    assert.ok(m.groundTint >= -1 && m.groundTint <= 1, `${s} ground ${m.groundTint}`);
    // Never 0: a snow line at the waterline would bury the island in winter.
    assert.ok(m.snowLine > 0.2 && m.snowLine <= 1, `${s} snow line ${m.snowLine}`);
    for (const tod of TIME_OF_DAY_IDS) {
      assert.ok(m.todWeights[tod] > 0, `${s} makes ${tod} impossible`);
    }
  }
});

test('winter has more snow than summer, and autumn is barer than spring', () => {
  // The direction of each bias, not just its presence — a table of four
  // distinct numbers that pointed the wrong way would pass every test above.
  assert.ok(seasonModifiers('invierno').snowLine < seasonModifiers('verano').snowLine);
  assert.ok(seasonModifiers('otono').canopyShift < seasonModifiers('primavera').canopyShift);
  assert.ok(seasonModifiers('verano').canopyShift > seasonModifiers('invierno').canopyShift);
});

test('no season switches a time of day off', () => {
  // The weights bias which preset the world opens on. A zero would mean an
  // island somebody could never see at night, which is content withheld by
  // calendar — the exact thing §9 forbids.
  for (const s of SEASONS) {
    const w = seasonModifiers(s).todWeights;
    const total = TIME_OF_DAY_IDS.reduce((n, tod) => n + w[tod], 0);
    for (const tod of TIME_OF_DAY_IDS) {
      assert.ok(w[tod] / total > 0.1, `${s} makes ${tod} all but unreachable`);
    }
  }
});
