import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { GIFT, maySendGift, parseArrivedGifts, parseGiftOptions, refusalOf } from '../gift';

function repoRoot(from: string): string {
  let dir = from;
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error('repo root not found');
}
const SQL = fs.readFileSync(
  path.join(repoRoot(__dirname), 'supabase/migrations/0101_mundo_gifts.sql'), 'utf8');

test('one per friend per day, and the button knows before the round trip', () => {
  assert.equal(GIFT.perFriendPerDay, 1);
  assert.equal(maySendGift(0), true);
  assert.equal(maySendGift(1), false);
  // …and the database says the same thing, as an index rather than a hope.
  assert.ok(/unique index[\s\S]*from_id, to_id, sent_on/.test(SQL));
});

test('**a gift is a copy, never a transfer**', () => {
  // The giver's row is never deleted and their balance is never touched. A game
  // that charges you for being generous teaches the opposite of the point.
  assert.ok(!/delete\s+from\s+user_cosmetics/i.test(SQL));
  assert.ok(!/semillas/i.test(SQL));
});

test('a gift buys nothing that matters', () => {
  for (const forbidden of ['xp', 'rank_tier', 'mundo_state', 'streak']) {
    assert.ok(!new RegExp(`update[\s\S]{0,200}${forbidden}`, 'i').test(SQL), forbidden);
  }
});

test('only between people who follow each other both ways', () => {
  assert.ok(/follower_id = v_me and f.followee_id = v_them/.test(SQL));
  assert.ok(/follower_id = v_them and f.followee_id = v_me/.test(SQL));
  assert.ok(SQL.includes("'not_friends'"));
});

test('a block stops a gift, and says the same thing as everything else', () => {
  assert.ok(/user_blocks/.test(SQL));
  assert.ok(SQL.includes("'not_found'"));
});

test('the options carry a name, so no slug reaches a button', () => {
  const parsed = parseGiftOptions({
    slugs: [{ slug: 'mundo_molino', name: 'Molino' }, { slug: 'x' }, 'nope', null],
    sentToday: 1,
  });
  assert.deepEqual(parsed.slugs, [
    { slug: 'mundo_molino', name: 'Molino' },
    { slug: 'x', name: 'x' },
  ]);
  assert.equal(parsed.sentToday, 1);
});

test('a missing or broken blob is an empty list, never a throw', () => {
  for (const bad of [null, undefined, 42, 'nope', {}, { slugs: 'no' }]) {
    assert.deepEqual(parseGiftOptions(bad), { slugs: [], sentToday: 0 });
    assert.deepEqual(parseArrivedGifts(bad), []);
  }
});

test('an unrecognised refusal is still a refusal', () => {
  assert.equal(refusalOf({ ok: true }, null), null);
  assert.equal(refusalOf({ ok: false, reason: 'not_friends' }, null), 'not_friends');
  assert.equal(refusalOf({ ok: false, reason: 'something_new' }, null), 'error');
  assert.equal(refusalOf(null, new Error('offline')), 'error');
});

test('the inbox is read once and marked seen in the same trip', () => {
  // No notification, no badge, no second chance to nag: the update *is* the
  // read (`04-RESEARCH-DESIGN.md` §9.9).
  assert.ok(/update public.world_gifts[\s\S]*set seen_at = now\(\)[\s\S]*seen_at is null/.test(SQL));
});
