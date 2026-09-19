import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import {
  mayLeaveSticker, parseVisitPayload, payloadForVisit, STICKER_IDS, stickerSpot, VISIT,
} from '../visit';

/**
 * Visiting, held to `18-DECISIONS.md` D8 and `20-ACCEPTANCE.md` 5C.
 *
 * The three properties that matter are all absences — read-only, sticker-only,
 * no impact figures — and an absence is exactly the kind of thing that comes
 * back six months later when somebody adds a field "just for the visitor's
 * own use". So they are asserted rather than described.
 */
/** The compiled tests run out of `.test-out`, so the root is found, not guessed. */
function repoRoot(from: string): string {
  let dir = from;
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error('repo root not found');
}
const ROOT = repoRoot(__dirname);

const SNAPSHOT = {
  ok: true,
  tier: 7,
  seed: 12345,
  palette: 'default',
  worldIndex: 2,
  pipStyle: { palette: 'musgo' },
  displayName: 'Ana',
  placements: [
    { prop_slug: 'banco', region: 'claro', x: 1, z: 2, rot_y: 0.5, variant: 0 },
    { prop_slug: 'banco', region: 'no-such-region', x: 1, z: 2, rot_y: 0, variant: 0 },
  ],
  stickers: [
    { sticker: 'mate', region: 'claro', x: 3, z: 4, by_me: true },
    { sticker: 'no-such-sticker', region: 'claro', x: 0, z: 0, by_me: false },
  ],
  leftToday: 1,
};

test('a refusal is a payload, never a throw', () => {
  for (const bad of [null, undefined, 'nope', 42, {}, { ok: false, reason: 'not_found' }]) {
    const v = parseVisitPayload(bad, 'ana');
    assert.equal(v.ok, false);
    assert.equal(v.username, 'ana');
    assert.deepEqual(v.stickers, []);
  }
  assert.equal(parseVisitPayload({ ok: false, reason: 'no_world' }, 'ana').reason, 'no_world');
});

test('a block, a mute and a private profile are indistinguishable', () => {
  // The RPC answers `not_found` for all three; anything it does not recognise
  // reads the same way, so the client can never leak the difference either.
  assert.equal(parseVisitPayload({ ok: false, reason: 'blocked' }, 'ana').reason, 'not_found');
});

test('unknown props and unknown stickers are dropped, not repaired', () => {
  const v = parseVisitPayload(SNAPSHOT, 'ana');
  assert.equal(v.placements.length, 1);
  assert.equal(v.stickers.length, 1);
  assert.equal(v.stickers[0]!.sticker, 'mate');
  assert.equal(v.stickers[0]!.byMe, true);
});

test('**no impact figure survives a visit**', () => {
  const payload = payloadForVisit(parseVisitPayload(SNAPSHOT, 'ana'));
  assert.deepEqual(payload.impact, { water_l: 0, co2_kg: 0, waste_kg: 0, energy_kwh: 0, actions: 0 });
  assert.equal(payload.collectiveWaterL, 0);
  assert.equal(payload.semillas, 0);
  // Nor the census, nor what they have saved, nor what they went to.
  assert.deepEqual(payload.journal, []);
  assert.deepEqual(payload.projectMarkers, []);
  assert.deepEqual(payload.layouts, []);
  assert.equal(payload.dueReviews, 0);
});

test('a visit never queues somebody else ceremony', () => {
  const payload = payloadForVisit(parseVisitPayload(SNAPSHOT, 'ana'));
  assert.deepEqual(payload.pendingCeremonies, []);
  assert.equal(payload.celebratedTier, 0);
});

test('the visitor arrives as themselves', () => {
  const payload = payloadForVisit(parseVisitPayload(SNAPSHOT, 'ana'), { palette: 'coral' });
  assert.deepEqual(payload.pip, { palette: 'coral' });
  // …on the host's island, at the host's tier.
  assert.equal(payload.tier, 7);
  assert.equal(payload.seed, 12345);
});

test('there are exactly eight stickers, and the list is closed', () => {
  assert.equal(STICKER_IDS.length, 8);
  assert.equal(new Set(STICKER_IDS).size, 8);
});

test('every sticker is a thing you would leave, never a judgement', () => {
  const es = JSON.parse(fs.readFileSync(path.join(ROOT, 'messages/es.json'), 'utf8'));
  for (const id of STICKER_IDS) {
    const label = es.mundo.visit.sticker[id];
    assert.equal(typeof label, 'string', `${id} has no Spanish label`);
    assert.ok(label.split(/\s+/).length <= 3, `${id}: "${label}"`);
  }
});

test('one per island per day, and the picker knows before the round trip', () => {
  assert.equal(VISIT.stickersPerDay, 1);
  assert.equal(mayLeaveSticker(0), true);
  assert.equal(mayLeaveSticker(VISIT.stickersPerDay), false);
  assert.equal(mayLeaveSticker(99), false);
});

test('a sticker lands in front of the visitor, never under them', () => {
  const [x, z] = stickerSpot(10, 20, 0);
  assert.ok(Math.hypot(x - 10, z - 20) > 0.5);
  assert.ok(Math.abs(Math.hypot(x - 10, z - 20) - VISIT.stickerAheadM) < 1e-9);
});

test('the SQL enforces the same eight and the same one-a-day', () => {
  const sql = fs.readFileSync(
    path.join(ROOT, 'supabase/migrations/0100_mundo_stickers.sql'), 'utf8');
  for (const id of STICKER_IDS) {
    assert.ok(sql.includes(`'${id}'`), `${id} is not in the check constraint`);
  }
  assert.ok(/unique index[\s\S]*host_id, visitor_id, left_on/.test(sql));
  // And there is no column anywhere a person could type into.
  assert.ok(!/\btext\b[^\n]*note|message|comment/.test(sql));
});
