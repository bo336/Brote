import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import {
  hasSelfRecovered, mayShowFact, mayShowReview, nextFact, wiltingVisible, words,
  type LearningState,
} from '../learning';
import { LEARNING } from '../config';

function root(from: string): string {
  let dir = from;
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error('repo root not found');
}
const ES = JSON.parse(fs.readFileSync(path.join(root(__dirname), 'messages', 'es.json'), 'utf8'));
const FACTS: string[] = Object.values(ES.mundo.fact);

const FRESH: LearningState = {
  sessionMs: 5 * 60_000, learningMs: 0, lastWasLearning: false, reviewsToday: 0,
};
const FACT_MS = 4000;

test('**never two learning beats in a row**', () => {
  // The one a player would actually feel: two facts back to back is a lecture,
  // whatever the percentages say.
  assert.equal(mayShowFact({ ...FRESH, lastWasLearning: true }, FACT_MS), 'back_to_back');
  assert.equal(mayShowReview({ ...FRESH, lastWasLearning: true }), 'back_to_back');
  assert.equal(mayShowFact(FRESH, FACT_MS), null);
});

test('**learning stays under a tenth of the session**', () => {
  const session = 10 * 60_000;
  const budget = session * LEARNING.sessionShareMax;
  assert.equal(mayShowFact({ ...FRESH, sessionMs: session, learningMs: budget - FACT_MS - 1 }, FACT_MS), null);
  assert.equal(mayShowFact({ ...FRESH, sessionMs: session, learningMs: budget }, FACT_MS), 'over_share');
});

test('the first fact of a session is not refused by arithmetic', () => {
  // One beat divided by three seconds of session is 100%, and the honest
  // reading of "≤10% of session time" is about a session, not its first breath.
  assert.equal(mayShowFact({ ...FRESH, sessionMs: 3000 }, FACT_MS), null);
});

test('**at most five review items a day**', () => {
  assert.equal(mayShowReview({ ...FRESH, reviewsToday: LEARNING.reviewItemsPerDay - 1 }), null);
  assert.equal(mayShowReview({ ...FRESH, reviewsToday: LEARNING.reviewItemsPerDay }), 'daily_cap');
  assert.equal(mayShowReview({ ...FRESH, reviewsToday: 99 }), 'daily_cap');
});

test('**at most three wilting objects, however many are due**', () => {
  // The island must never look like a to-do list. Somebody back after a month
  // finds three quiet plants, not a field of them.
  assert.equal(wiltingVisible(0), 0);
  assert.equal(wiltingVisible(2), 2);
  assert.equal(wiltingVisible(40), LEARNING.wiltingVisibleMax);
  assert.equal(wiltingVisible(-5), 0);
});

test('**a wilting object recovers on its own, whatever the player does**', () => {
  const start = Date.UTC(2026, 0, 1);
  const day = 86_400_000;
  assert.equal(hasSelfRecovered(start, start + day), false);
  assert.equal(hasSelfRecovered(start, start + LEARNING.wiltingSelfRecoverDays * day), true);
  // Never a permanent state, and never one a missing timestamp can pin open.
  assert.equal(hasSelfRecovered(0, start), true);
  assert.equal(hasSelfRecovered(Number.NaN, start), true);
});

test('the same fact is never shown twice, and the pool ends rather than repeats', () => {
  const pool = ['a', 'b', 'c'];
  assert.equal(nextFact(pool, new Set()), 'a');
  assert.equal(nextFact(pool, new Set(['a'])), 'b');
  assert.equal(nextFact(pool, new Set(['a', 'b', 'c'])), null);
});

test('**every micro-fact is 12 to 18 words**', () => {
  // §3.1, and §2's note that a skip rate above 20% means the copy is too long.
  assert.ok(FACTS.length >= 20, `${FACTS.length} facts`);
  const bad = FACTS.map((f, i) => [i, words(f)] as const)
    .filter(([, n]) => n < LEARNING.microFactMinWords || n > LEARNING.microFactMaxWords);
  assert.deepEqual(bad, [], `facts outside 12-18 words: ${JSON.stringify(bad)}`);
});

test('**no micro-fact is about the player**', () => {
  // Learning that comments on behaviour is a scolding with a citation.
  const banned = [
    'no hiciste', 'deberías', 'tendrías que', 'te olvidaste', 'estás gastando',
    'desperdiciás mucho', 'mal hecho', 'te falta', 'racha',
  ];
  const hits: string[] = [];
  FACTS.forEach((f, i) => {
    const lower = f.toLowerCase();
    for (const w of banned) if (lower.includes(w)) hits.push(`${i}: ${w}`);
  });
  assert.deepEqual(hits, []);
});

test('no fact is repeated in the pool itself', () => {
  assert.equal(new Set(FACTS).size, FACTS.length);
});
