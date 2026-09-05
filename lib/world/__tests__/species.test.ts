import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { SPECIES, speciesFor, spawnPoints } from '../species';
import type { RegionId, TimeOfDay } from '../types';

const REGIONS: RegionId[] = ['claro', 'pradera', 'jardin', 'arboleda', 'rio', 'monte', 'cumbre', 'islote'];

test('the catalogue holds exactly 64 species, each slug once', () => {
  assert.equal(SPECIES.length, 64);
  assert.equal(new Set(SPECIES.map((s) => s.slug)).size, 64);
});

test('every blurb is 12-18 words — the DB check constraint rejects anything else', () => {
  for (const s of SPECIES) {
    const words = s.blurb_es.trim().split(/\s+/).length;
    assert.ok(words >= 12 && words <= 18, `${s.slug}: ${words} words`);
  }
});

test('every row has a region, a tier, at least one time of day and a rarity', () => {
  for (const s of SPECIES) {
    assert.ok(REGIONS.includes(s.region), `${s.slug} has region ${s.region}`);
    assert.ok(s.min_tier >= 1 && s.min_tier <= 11);
    assert.ok(s.time_of_day.length >= 1);
    assert.ok(s.rarity >= 1 && s.rarity <= 4);
  }
});

test('species live in a region that exists by their own tier', () => {
  // A species you can never see is a content bug, not a rare one.
  const REGION_TIER: Record<string, number> = {
    claro: 1, pradera: 2, jardin: 3, arboleda: 4, rio: 7, monte: 8, cumbre: 9, islote: 10,
  };
  for (const s of SPECIES) assert.ok(s.min_tier >= REGION_TIER[s.region]!, `${s.slug} predates its region`);
});

test('speciesFor filters by region, tier and time of day, and never by a name match', () => {
  const dayJardin = speciesFor('jardin', 3, 'dia', 'verano');
  assert.ok(dayJardin.length > 0);
  for (const s of dayJardin) {
    assert.equal(s.region, 'jardin');
    assert.ok(s.min_tier <= 3);
    assert.ok(s.time_of_day.includes('dia'));
  }
  // The firefly is night-only; noon must not produce it.
  assert.ok(!dayJardin.some((s) => s.slug === 'luciernaga'));
  assert.ok(speciesFor('jardin', 3, 'noche', 'verano').some((s) => s.slug === 'luciernaga'));
});

test('a locked tier never sees a higher-tier species', () => {
  for (const tod of ['amanecer', 'dia', 'atardecer', 'noche'] as TimeOfDay[]) {
    for (const s of speciesFor('arboleda', 4, tod, 'otono')) assert.ok(s.min_tier <= 4);
  }
});

test('season re-orders but never removes — nobody misses content by playing in March', () => {
  const a = speciesFor('pradera', 2, 'dia', 'verano').map((s) => s.slug).sort();
  const b = speciesFor('pradera', 2, 'dia', 'invierno').map((s) => s.slug).sort();
  assert.deepEqual(a, b);
});

test('spawn points are deterministic and drawn from the candidates given', () => {
  const candidates: [number, number][] = Array.from({ length: 40 }, (_, i) => [i, -i]);
  const s = SPECIES[0]!;
  const a = spawnPoints(candidates, s, 1234);
  const b = spawnPoints(candidates, s, 1234);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, spawnPoints(candidates, s, 5678));
  for (const p of a) assert.ok(candidates.some((c) => c[0] === p[0] && c[1] === p[1]));
});
