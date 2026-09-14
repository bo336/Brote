import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { markerLine, placeMarkers, type RawMarker } from '../markers';
import { MARKERS } from '../config';

const SPAWN = [0, 0] as const;

/** Strictly increasing dates, so "newest" is unambiguous in every assertion. */
function raw(n: number, place: string | null = 'Chacarita'): RawMarker {
  const day = new Date(Date.UTC(2024, 0, 1 + n));
  return {
    id: `p${n}`,
    title: `Plantada ${n}`,
    place,
    date: day.toISOString().slice(0, 10),
  };
}

function place(markers: RawMarker[], over: Partial<Parameters<typeof placeMarkers>[0]> = {}) {
  return placeMarkers({ markers, seed: 12345, spawn: SPAWN, radius: 60, ...over });
}

test('markers walk outward from the spawn, oldest first', () => {
  const got = place([raw(3), raw(1), raw(2)]);
  assert.equal(got.length, 3);
  const dates = got.map((m) => m.date);
  assert.deepEqual(dates, [...dates].sort(), 'oldest should be nearest the spawn');
  // …and each one further out than the last.
  const dist = got.map((m) => Math.hypot(m.x - SPAWN[0], m.z - SPAWN[1]));
  for (let i = 1; i < dist.length; i++) assert.ok(dist[i]! > dist[i - 1]!, `${dist}`);
});

test('the same island lays the same path every visit', () => {
  const a = place([raw(1), raw(2)]);
  const b = place([raw(1), raw(2)]);
  assert.deepEqual(a, b);
  // A different island points its path somewhere else.
  const other = place([raw(1), raw(2)], { seed: 999 });
  assert.notDeepEqual(a.map((m) => [m.x, m.z]), other.map((m) => [m.x, m.z]));
});

test('**a path, never a graveyard**', () => {
  // Forty projects have earned a walk, not a field of identical stones.
  const many = Array.from({ length: 40 }, (_, i) => raw(i));
  const got = place(many);
  assert.ok(got.length <= MARKERS.max, `${got.length} stones`);
  // And it is the most recent ones that are standing.
  const kept = new Set(got.map((m) => m.id));
  assert.ok(kept.has(many[many.length - 1]!.id), 'the newest memory should be there');
});

test('the line never walks off the island', () => {
  const got = place(Array.from({ length: MARKERS.max }, (_, i) => raw(i)), { radius: 18 });
  for (const m of got) {
    const d = Math.hypot(m.x - SPAWN[0], m.z - SPAWN[1]);
    assert.ok(d <= 18, `${m.id} is ${d.toFixed(1)}m out on an 18m island`);
  }
});

test('a stone that cannot stand anywhere is simply not placed', () => {
  assert.deepEqual(place([raw(1), raw(2)], { isGround: () => false }), []);
});

test('a project with no place still reads as a sentence', () => {
  const [withPlace] = place([raw(1, 'Chacarita')]);
  const [without] = place([raw(1, null)]);
  assert.equal(markerLine(withPlace!).key, 'marker.linePlace');
  assert.equal(markerLine(without!).key, 'marker.line');
  // Never a sentence with a hole in it.
  assert.equal(markerLine(without!).values.place, undefined);
  assert.equal(markerLine(withPlace!).values.place, 'Chacarita');
});

test('no markers means no stones and no crash', () => {
  assert.deepEqual(place([]), []);
});
