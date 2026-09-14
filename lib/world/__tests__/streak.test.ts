import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { FRIEND_STREAK, parseFriendStreak, streakTier, streakVisible } from '../streak';

function repoRoot(from: string): string {
  let dir = from;
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error('repo root not found');
}
const SQL = fs.readFileSync(
  path.join(repoRoot(__dirname), 'supabase/migrations/0103_mundo_friend_streak.sql'), 'utf8');

test('**rest days are free, automatic, and nobody is asked**', () => {
  // Anti-pattern 7 in one assertion. The client and the server agree on the
  // number, and the server spends them without a prompt or a purchase.
  assert.ok(FRIEND_STREAK.restDays > 0);
  assert.ok(new RegExp(`v_rest\\s+int\\s+:=\\s+${FRIEND_STREAK.restDays}`).test(SQL));
  assert.ok(!/freeze_cost|spend|semillas|confirm/i.test(SQL));
});

test('today being empty at nine in the morning is not a day lost', () => {
  assert.ok(/elsif i = 0 then[\s\S]*continue;/.test(SQL));
});

test('nothing is stored, so there is no counter to farm', () => {
  assert.ok(!/create table/i.test(SQL));
  assert.ok(!/insert into/i.test(SQL));
  // It is derived from completions that were already verified elsewhere.
  assert.ok(/activity_completions/.test(SQL));
  assert.ok(/counts_for_streak/.test(SQL));
});

test('it is between exactly two people, and ranks nobody', () => {
  assert.ok(!/order by[\s\S]*limit|rank\(\)|leaderboard/i.test(SQL));
  // One username in, one pair out.
  assert.ok(/world_friend_streak\(p_username text\)/.test(SQL));
});

test('a block makes the streak nothing, like everything else', () => {
  assert.ok(/user_blocks/.test(SQL));
});

test('the tiers are 7/14/30/50 and they buy nothing', () => {
  assert.deepEqual([...FRIEND_STREAK.tiers], [7, 14, 30, 50]);
  assert.equal(streakTier(0), 0);
  assert.equal(streakTier(6), 0);
  assert.equal(streakTier(7), 7);
  assert.equal(streakTier(29), 14);
  assert.equal(streakTier(50), 50);
  assert.equal(streakTier(999), 50);
});

test('two days is not a streak, and saying so would be noise', () => {
  assert.equal(streakVisible(0), false);
  assert.equal(streakVisible(FRIEND_STREAK.minVisibleDays - 1), false);
  assert.equal(streakVisible(FRIEND_STREAK.minVisibleDays), true);
});

test('a missing or broken blob is zero, never a throw', () => {
  for (const bad of [null, undefined, 'nope', 42, {}, { days: 'x' }]) {
    assert.deepEqual(parseFriendStreak(bad), { days: 0, restUsed: 0 });
  }
  assert.deepEqual(parseFriendStreak({ days: 12.7, restUsed: -3 }), { days: 12, restUsed: 0 });
});
