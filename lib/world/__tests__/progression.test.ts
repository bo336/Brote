import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { ISLAND_RADIUS_BY_TIER } from '../config';
import { MAX_TIER, MIN_TIER, cumulativeState, islandRadius, unlocksFor, verbsFor } from '../progression';
import { SPECIES } from '../species';
import { VERB_TABLE } from '../verbs';
import type { WorldConfig } from '../types';

const LIST_FIELDS = ['regions', 'features', 'verbs', 'species', 'props'] as const;

function totalSize(c: WorldConfig): number {
  return LIST_FIELDS.reduce((n, f) => n + c[f].length, 0);
}

test('the ladder covers all eleven tiers', () => {
  for (let t = MIN_TIER; t <= MAX_TIER; t++) {
    const u = unlocksFor(t);
    assert.equal(u.tier, t);
    assert.equal(u.copyKey, `mundo.tierup.t${t}`);
  }
});

test('every tier grants at least one new verb — scenery alone stops mattering by tier 4', () => {
  for (let t = MIN_TIER; t <= MAX_TIER; t++) {
    assert.ok(unlocksFor(t).verbs.length >= 1, `tier ${t} grants no verb`);
  }
});

test('all sixteen verbs are reachable, and every one is in VERB_TABLE', () => {
  const all = verbsFor(MAX_TIER);
  assert.equal(all.length, 16);
  assert.equal(new Set(all).size, 16);
  for (const v of all) assert.ok(VERB_TABLE[v], `${v} missing from VERB_TABLE`);
});

test('cumulativeState(n) is a superset of cumulativeState(n-1) in every field', () => {
  for (let t = MIN_TIER + 1; t <= MAX_TIER; t++) {
    const prev = cumulativeState(t - 1);
    const next = cumulativeState(t);
    for (const field of LIST_FIELDS) {
      const after: readonly string[] = next[field];
      for (const item of prev[field]) {
        assert.ok(after.includes(item), `tier ${t} lost ${field}: ${item}`);
      }
    }
  }
});

test('and it is strictly larger — every tier adds something, nothing is a re-skin', () => {
  for (let t = MIN_TIER + 1; t <= MAX_TIER; t++) {
    assert.ok(
      totalSize(cumulativeState(t)) > totalSize(cumulativeState(t - 1)),
      `tier ${t} adds nothing at all`,
    );
  }
});

test('the world never regresses: radius is non-decreasing and matches the table', () => {
  for (let t = MIN_TIER; t <= MAX_TIER; t++) {
    assert.equal(islandRadius(t), ISLAND_RADIUS_BY_TIER[t - 1]);
    if (t > MIN_TIER) assert.ok(islandRadius(t) >= islandRadius(t - 1));
  }
  assert.equal(islandRadius(1), 18);
  assert.equal(islandRadius(11), 60);
});

test('no field ever contains a duplicate', () => {
  for (let t = MIN_TIER; t <= MAX_TIER; t++) {
    const c = cumulativeState(t);
    for (const field of LIST_FIELDS) {
      assert.equal(new Set(c[field]).size, c[field].length, `tier ${t} duplicates in ${field}`);
    }
  }
});

test('all 64 species are reachable by tier 11, and each exactly once', () => {
  const reachable = cumulativeState(MAX_TIER).species;
  assert.equal(SPECIES.length, 64);
  assert.equal(reachable.length, 64);
  assert.equal(new Set(reachable).size, 64);
});

test('tiers out of range clamp instead of throwing', () => {
  assert.equal(cumulativeState(0).tier, MIN_TIER);
  assert.equal(cumulativeState(99).tier, MAX_TIER);
  assert.equal(cumulativeState(Number.NaN).tier, MIN_TIER);
});
