import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import {
  ARRIVALS, beatAt, ceremonyFor, holdPoint, pendingCeremonies, queueFor, scriptFor, skipTo,
  worldCeremonyFor,
} from '../ceremony';
import { MAX_TIER, MIN_TIER, unlocksFor } from '../progression';
import { CEREMONY } from '../config';

const TIERS = Array.from({ length: MAX_TIER }, (_, i) => i + MIN_TIER);

test('every tier has a script, and it ends', () => {
  for (const tier of TIERS) {
    const s = ceremonyFor(tier);
    assert.equal(s.tier, tier);
    assert.ok(s.totalSeconds > 0, `t${tier} has no duration`);
    // Nobody should be held for a minute. The spec budgets ~40 s at the widest.
    assert.ok(s.totalSeconds <= 45, `t${tier} runs ${s.totalSeconds}s`);
    assert.equal(s.lineKey, `t${tier}`);
  }
});

test('the beats stay in the spec order', () => {
  // The order is the whole ceremony: frame it, capture the before, change the
  // world, name the rank, teach the verb, offer the card, hand control back.
  const ORDER = ['camera', 'before', 'arrival', 'title', 'verb', 'share', 'return'];
  for (const tier of TIERS) {
    const ids = ceremonyFor(tier).beats.map((b) => b.id);
    const ranks = ids.map((id) => ORDER.indexOf(id));
    assert.deepEqual(ranks, [...ranks].sort((a, b) => a - b), `t${tier}: ${ids.join(',')}`);
    assert.equal(ids[0], 'camera');
    assert.equal(ids[ids.length - 1], 'return');
    // The before-shot must exist and must come before anything moves.
    assert.ok(ids.includes('before'));
    assert.ok(ids.indexOf('before') < ids.indexOf('title'));
  }
});

test('an arrival beat exists exactly when something physical arrives', () => {
  for (const tier of TIERS) {
    const s = ceremonyFor(tier);
    const hasBeat = s.beats.some((b) => b.id === 'arrival');
    assert.equal(hasBeat, s.arrival !== null, `t${tier}`);
    // A held shot on nothing is worse than no held shot.
    assert.equal(hasBeat, ARRIVALS[tier] !== undefined, `t${tier}`);
  }
});

test('the arrival beat sits inside the spec window', () => {
  for (const tier of TIERS) {
    const beat = ceremonyFor(tier).beats.find((b) => b.id === 'arrival');
    if (!beat) continue;
    assert.ok(
      beat.seconds >= CEREMONY.featureMinS && beat.seconds <= CEREMONY.featureMaxS,
      `t${tier}: ${beat.seconds}s outside ${CEREMONY.featureMinS}-${CEREMONY.featureMaxS}`,
    );
  }
});

test('the verb beat teaches a verb the tier actually grants', () => {
  for (const tier of TIERS) {
    const s = ceremonyFor(tier);
    const taught = s.beats.some((b) => b.id === 'verb');
    const granted = unlocksFor(tier).verbs;
    assert.equal(taught, granted.length > 0, `t${tier}`);
    // "Ahora podés ___" with nothing in the blank is the failure this guards.
    if (taught) assert.ok(granted.includes(s.verbs[0]!), `t${tier}`);
  }
});

test('the camera frames the region the change happens in', () => {
  // Not the region the tier unlocks — tier 9 unlocks la cumbre and the snow
  // lands on it, but tier 5 unlocks nothing and still has to look somewhere.
  assert.equal(ceremonyFor(7).region, 'rio');
  assert.equal(ceremonyFor(8).region, 'monte');
  assert.equal(ceremonyFor(5).region, 'claro');
  assert.equal(ceremonyFor(11).region, 'monumento');
});

test('reduced motion keeps every beat and only shortens the camera move', () => {
  for (const tier of TIERS) {
    const full = ceremonyFor(tier);
    const calm = ceremonyFor(tier, { reducedMotion: true });
    assert.deepEqual(calm.beats.map((b) => b.id), full.beats.map((b) => b.id), `t${tier}`);
    for (let i = 1; i < full.beats.length; i++) {
      assert.equal(calm.beats[i]!.seconds, full.beats[i]!.seconds, `t${tier} beat ${i}`);
    }
    assert.ok(calm.beats[0]!.seconds < full.beats[0]!.seconds);
    // Somebody who needs reduced motion still gets the content, not a summary.
    assert.ok(calm.totalSeconds > full.totalSeconds - CEREMONY.takeCameraS - 0.001);
  }
});

test('beatAt walks the script and never falls off it', () => {
  const s = ceremonyFor(7);
  assert.equal(beatAt(s, 0).beat.id, 'camera');
  assert.equal(beatAt(s, -5).beat.id, 'camera');
  assert.equal(beatAt(s, CEREMONY.takeCameraS + 0.1).beat.id, 'arrival');
  assert.equal(beatAt(s, s.totalSeconds).beat.id, 'return');
  assert.equal(beatAt(s, s.totalSeconds + 60).beat.id, 'return');

  // Progress runs 0..1 inside every beat, and the index never goes backwards.
  let last = -1;
  for (let t = 0; t <= s.totalSeconds; t += 0.25) {
    const at = beatAt(s, t);
    assert.ok(at.progress >= 0 && at.progress <= 1, `progress ${at.progress} at ${t}`);
    assert.ok(at.index >= last, `index went back at ${t}`);
    last = at.index;
  }
});

test('skipping lands ON the card, not past it', () => {
  for (const tier of TIERS) {
    const s = ceremonyFor(tier);
    assert.equal(beatAt(s, skipTo(s)).beat.id, 'share', `t${tier}`);
  }
});

test('missed tier-ups queue oldest first', () => {
  assert.deepEqual(pendingCeremonies(0, 3), [1, 2, 3]);
  assert.deepEqual(pendingCeremonies(3, 3), []);
  // The world never regresses, so a celebrated count ahead of the tier is a
  // stale read, not a reason to replay anything.
  assert.deepEqual(pendingCeremonies(9, 4), []);
});

test('a world completion is short, teaches nothing, and still makes a card', () => {
  const s = worldCeremonyFor(4);
  assert.equal(s.kind, 'world');
  assert.equal(s.tier, 4);
  assert.equal(s.arrival, null);
  assert.deepEqual(s.verbs, []);
  // Eight seconds for the sequence itself (§7, "a small ceremony (~8 s)").
  // The share beat after it waits, exactly as the tier-up's does.
  const sequence = s.beats
    .filter((b) => b.id !== 'share' && b.id !== 'return')
    .reduce((sum, b) => sum + b.seconds, 0);
  assert.ok(Math.abs(sequence - CEREMONY.worldCompleteS) < 1e-9, `${sequence}s`);
  const ids = s.beats.map((b) => b.id);
  assert.ok(!ids.includes('verb'), 'a world completion grants no verb to teach');
  assert.ok(ids.includes('before'));
  assert.ok(ids.includes('share'));
  assert.equal(beatAt(s, skipTo(s)).beat.id, 'share');
});

test('every beat of a world completion has a non-negative length', () => {
  // The arrival beat is what is left after the camera and the title card, so a
  // config change that made those two longer than the whole thing would give
  // it a negative duration and `beatAt` would walk straight past it.
  for (const rm of [false, true]) {
    for (const b of worldCeremonyFor(2, { reducedMotion: rm }).beats) {
      assert.ok(b.seconds >= 0, `${b.id} is ${b.seconds}s`);
    }
  }
});

test('scriptFor dispatches on the request kind', () => {
  assert.equal(scriptFor({ kind: 'tier', n: 7 }).kind, 'tier');
  assert.equal(scriptFor({ kind: 'tier', n: 7 }).arrival, 'rio');
  assert.equal(scriptFor({ kind: 'world', n: 3 }).kind, 'world');
});

test('the queue is rank tiers oldest first, then the world', () => {
  assert.deepEqual(queueFor(1, 3, 2, 2), [
    { kind: 'tier', n: 2 },
    { kind: 'tier', n: 3 },
  ]);
  assert.deepEqual(queueFor(3, 3, 1, 2), [{ kind: 'world', n: 2 }]);
  assert.deepEqual(queueFor(1, 2, 1, 3), [
    { kind: 'tier', n: 2 },
    { kind: 'world', n: 3 },
  ]);
});

test('four worlds completed while away is one ceremony, not four', () => {
  // The island only ever looks like the world it is in now, so replaying the
  // three it passed through would be three cross-fades to nothing.
  const queue = queueFor(5, 5, 1, 5);
  assert.deepEqual(queue, [{ kind: 'world', n: 5 }]);
});

test('nobody is celebrated for world 1, which is where everyone starts', () => {
  assert.deepEqual(queueFor(1, 1, 0, 1), []);
});

test('every script parks on the share beat, never past it', () => {
  // The runner holds at `totalSeconds - epsilon` and expects to find the share
  // card there. That only works while the LAST beat with a real duration is
  // `share` — a zero-length one is invisible to `beatAt` for any t above zero,
  // and the card the whole ceremony exists to produce would never appear.
  const scripts = [
    ...TIERS.map((t) => ceremonyFor(t)),
    ...TIERS.map((t) => ceremonyFor(t, { reducedMotion: true })),
    worldCeremonyFor(3),
    worldCeremonyFor(3, { reducedMotion: true }),
  ];
  for (const s of scripts) {
    const at = beatAt(s, holdPoint(s));
    assert.equal(at.beat.id, 'share', `t${s.tier} ${s.kind} parked on ${at.beat.id}`);
  }
});
