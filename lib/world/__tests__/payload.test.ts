import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { parseWorldPayload } from '../payload';
import { MAX_TIER, MIN_TIER } from '../progression';

const UID = '3f1c0e2a-0000-4000-8000-000000000001';

/**
 * A `mundo_state` as Postgres actually writes it.
 *
 * `parseMundoState` is contract-locked and rejects anything without both
 * `rankTier` and `structuralElements`, falling back to a tier-1 state. A
 * fixture missing either is testing the fallback, not the parser.
 */
function mundo(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    rankTier: 5,
    structuralElements: ['soil', 'grass'],
    worldIndex: 2,
    liveliness: 0.8,
    palette: 'lush',
    dominantDomain: 'agua',
    ...over,
  };
}

/** The shape `world_bootstrap()` actually returns, trimmed to what is parsed. */
function bootstrap(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    userId: UID,
    world: { seed: 12345, celebrated_tier: 2, celebrated_world: 0, layouts: [] },
    mundo: mundo(),
    pip: { body: 'verde' },
    ownedCosmetics: ['mundo_banco'],
    semillas: 40,
    impact: { water_l: 120, co2_kg: 3, waste_kg: 1, energy_kwh: 8, actions: 12 },
    placements: [],
    journal: [],
    dailyState: { chores_done: 1, forage_done: 2, event_done: false },
    ...over,
  };
}

test('a well-formed payload survives the round trip', () => {
  const p = parseWorldPayload(bootstrap(), UID);
  assert.equal(p.userId, UID);
  assert.equal(p.seed, 12345);
  assert.equal(p.tier, 5);
  assert.equal(p.worldIndex, 2);
  assert.equal(p.liveliness, 0.8);
  assert.equal(p.palette, 'lush');
  assert.equal(p.semillas, 40);
  assert.equal(p.impact.water_l, 120);
  assert.equal(p.dailyState.forage_done, 2);
});

test('nothing at all still produces a buildable world', () => {
  // The whole point of the parser: a world of radius NaN does not throw at the
  // boundary, it fails twenty frames later with nothing pointing at the cause.
  const p = parseWorldPayload(null, UID);
  assert.equal(p.userId, UID);
  assert.ok(Number.isFinite(p.seed));
  assert.ok(Number.isFinite(p.liveliness));
  assert.equal(p.tier, MIN_TIER);
  assert.deepEqual(p.placements, []);
  assert.deepEqual(p.journal, []);
});

test('a nonsense tier is clamped, never trusted', () => {
  assert.equal(parseWorldPayload(bootstrap({ mundo: mundo({ rankTier: 9999 }) }), UID).tier, MAX_TIER);
  assert.equal(parseWorldPayload(bootstrap({ mundo: mundo({ rankTier: -4 }) }), UID).tier, MIN_TIER);
  // A non-numeric tier never reaches the clamp: `parseMundoState` rejects the
  // whole state and hands back a tier-1 fallback, which is the safe island.
  assert.equal(parseWorldPayload(bootstrap({ mundo: mundo({ rankTier: 'siete' }) }), UID).tier, MIN_TIER);
});

test('NaN and Infinity never reach the world', () => {
  const p = parseWorldPayload(
    bootstrap({
      semillas: Number.NaN,
      impact: { water_l: Number.POSITIVE_INFINITY, co2_kg: Number.NaN },
      mundo: mundo({ rankTier: 3, liveliness: Number.NaN }),
    }),
    UID,
  );
  assert.equal(p.semillas, 0);
  assert.ok(Number.isFinite(p.impact.water_l));
  assert.ok(Number.isFinite(p.impact.co2_kg));
  assert.ok(Number.isFinite(p.liveliness));
});

test('a placement with an unknown prop or region is dropped, not repaired', () => {
  const p = parseWorldPayload(
    bootstrap({
      placements: [
        { prop_slug: 'mundo_banco', region: 'jardin', x: 1, z: 2, rot_y: 0.5, variant: 1 },
        { prop_slug: 'mundo_banco', region: 'atlantis', x: 1, z: 2 },
        { prop_slug: 'trono_de_hierro', region: 'jardin', x: 1, z: 2 },
        'not even an object',
      ],
    }),
    UID,
  );
  // Guessing a region would move somebody's bench somewhere they did not put it.
  assert.equal(p.placements.length, 1);
  assert.equal(p.placements[0]!.region, 'jardin');
  assert.equal(p.placements[0]!.rot_y, 0.5);
});

test('pending ceremonies are derived when the server does not send them', () => {
  const p = parseWorldPayload(
    bootstrap({ world: { seed: 1, celebrated_tier: 2 }, mundo: mundo({ rankTier: 5 }) }),
    UID,
  );
  assert.deepEqual(p.pendingCeremonies, [3, 4, 5]);
});

test('…and the server list wins when it is there', () => {
  const p = parseWorldPayload(bootstrap({ pendingCeremonies: [4, 5] }), UID);
  assert.deepEqual(p.pendingCeremonies, [4, 5]);
});

test('nothing celebrated and nothing reached means no ceremony', () => {
  const p = parseWorldPayload(
    bootstrap({ world: { seed: 1, celebrated_tier: 5 }, mundo: mundo({ rankTier: 5 }) }),
    UID,
  );
  assert.deepEqual(p.pendingCeremonies, []);
});

test('a journal row keeps its count and its time of day', () => {
  const p = parseWorldPayload(
    bootstrap({
      journal: [
        { species_slug: 'hornero', region: 'pradera', time_of_day: 'amanecer', count: 3 },
        { species_slug: 'hornero', region: 'pradera', time_of_day: 'siesta', count: 0 },
      ],
    }),
    UID,
  );
  assert.equal(p.journal.length, 2);
  assert.equal(p.journal[0]!.time_of_day, 'amanecer');
  // An unknown time of day falls back rather than dropping the sighting.
  assert.equal(p.journal[1]!.time_of_day, 'dia');
  assert.equal(p.journal[1]!.count, 1);
});
