/**
 * The balance targets of `docs/MUNDO_JUEGO.md` §3.2, as a simulated player who
 * plays thirty minutes a day (`lib/world/game/sim.ts`). The bot is faster than
 * a person — it never reads, never looks around, never decorates — so the
 * bounds below are about the *shape*: never a dead end, never finished in a
 * week, semillas in a sane band, the story moving.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { simulate } from '../game/sim';

const WHO = '3d99b835-22a9-4dc4-a8c6-278f13a19721';

/** Progress by day: [startDay, tier] segments, divisions interpolated inside each. */
const seg = (spans: [number, number][]) => (d: number) => {
  for (let i = spans.length - 1; i >= 0; i--) {
    const [start, tier] = spans[i]!;
    if (d >= start) {
      const end = spans[i + 1]?.[0] ?? start + 120;
      return tier + Math.floor(Math.min(0.99, (d - start) / (end - start)) * 5) / 5;
    }
  }
  return 1;
};

test('an active player (rank-ups on days 3, 10, 25, 55) always has something, and the island keeps growing', () => {
  const rows = simulate(WHO, 60, seg([[0, 1], [3, 2], [10, 3], [25, 4], [55, 5]]));
  // Never a dead day: the bot always finds at least a few minutes of real work.
  for (const r of rows) assert.ok(r.busy >= 200, `day ${r.day}: only ${r.busy}s of things to do`);
  const mean = rows.reduce((a, r) => a + r.busy, 0) / rows.length;
  assert.ok(mean >= 600, `mean busy ${mean.toFixed(0)}s`);
  // Semillas in a band: enough to buy something most days, never the cap every day.
  const earned = rows.map((r) => r.earned);
  const avg = earned.reduce((a, b) => a + b, 0) / earned.length;
  assert.ok(avg >= 50 && avg <= 250, `average ${avg.toFixed(0)} semillas/day`);
  assert.ok(earned.filter((e) => e >= 400).length <= 6, 'the cap is a ceiling, not the norm');
  // A rank-up is never "finished" the same week: the new land takes days.
  for (const up of [3, 10, 25, 55]) {
    const after = rows[up + 2];
    if (!after) continue;
    const done = after.stages[5]! + after.stages[4]!;
    const total = after.stages.reduce((a, b) => a + b, 0);
    assert.ok(done < total, `day ${up + 2}: every parcel already alive`);
  }
  // The story moves: a dozen missions or more in two months.
  assert.ok(rows.reduce((a, r) => a + r.missions, 0) >= 25);
});

test('a veteran who first opens the world at rank 7 has weeks of land, not a wall', () => {
  const rows = simulate(WHO, 21, () => 7);
  const alive = rows.at(-1)!.stages[4]! + rows.at(-1)!.stages[5]!;
  const total = rows.at(-1)!.stages.reduce((a, b) => a + b, 0);
  assert.ok(alive > 5 && alive < total, `${alive} of ${total} alive after three weeks`);
  for (const r of rows.slice(1)) assert.ok(r.stageUps + r.missions > 0 || r.busy >= 600, `day ${r.day} went nowhere`);
});
