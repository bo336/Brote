import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { EVENT_SCRIPTS, EVENT_SCRIPT_LIST, payoutFor, stageCount } from '../event-script';
import { EVENTS, EVENTS_BY_ID } from '../events';
import type { EventId } from '../types';

function repoRoot(from: string): string {
  let dir = from;
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error('repo root not found');
}
const ROOT = repoRoot(__dirname);
const ES = JSON.parse(fs.readFileSync(path.join(ROOT, 'messages', 'es.json'), 'utf8'));

function copy(dotted: string): unknown {
  let node: unknown = ES.mundo;
  for (const part of dotted.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return node;
}

test('all six events are scripted', () => {
  assert.equal(EVENT_SCRIPT_LIST.length, 6);
  for (const def of EVENTS) {
    assert.ok(EVENT_SCRIPTS[def.id], `${def.id} has a definition but no script`);
    assert.equal(EVENT_SCRIPTS[def.id].id, def.id);
  }
});

test('**no event can be failed destructively**', () => {
  // `11-GAME-LOOP.md` §3.7: failure is never punitive, nothing is permanently
  // lost, and the payout never reaches zero.
  for (const s of EVENT_SCRIPT_LIST) {
    assert.ok(s.payout > 0, `${s.id} pays nothing on a clean run`);
    assert.ok(s.payoutImperfect > 0, `${s.id} pays nothing after a mistake`);
    assert.ok(s.payoutImperfect <= s.payout, `${s.id} rewards getting it wrong`);
    assert.equal(payoutFor(s.id, 0), s.payout);
    assert.equal(payoutFor(s.id, 3), s.payoutImperfect);
  }
});

test('**no event can block**', () => {
  // A stage whose spots contain no correct one is a stage nobody finishes.
  for (const s of EVENT_SCRIPT_LIST) {
    assert.ok(s.stages.length > 0, `${s.id} has no stages`);
    for (const stage of s.stages) {
      assert.ok(stage.spots.length > 0, `${s.id}/${stage.id} has nowhere to go`);
      assert.ok(stage.correct.length > 0, `${s.id}/${stage.id} has no way to finish`);
      const ids = new Set(stage.spots.map((sp) => sp.id));
      for (const c of stage.correct) {
        assert.ok(ids.has(c), `${s.id}/${stage.id}: "${c}" is not one of its spots`);
      }
      assert.equal(ids.size, stage.spots.length, `${s.id}/${stage.id} has a duplicate spot`);
    }
  }
});

test('a wrong turn costs time, never progress', () => {
  for (const s of EVENT_SCRIPT_LIST) {
    assert.ok(s.wrongCostS >= 0, `${s.id} has a negative cost`);
    assert.ok(s.wrongCostS <= 20, `${s.id} costs ${s.wrongCostS}s, which is a punishment`);
  }
});

test('**every decision is a place, never a tapped option**', () => {
  // §5.1. A stage with exactly one spot is a destination; a stage with several
  // is a choice between places. Neither is a dialog.
  for (const s of EVENT_SCRIPT_LIST) {
    for (const stage of s.stages) {
      for (const spot of stage.spots) {
        assert.ok(spot.at.dist > 0, `${s.id}/${stage.id}/${spot.id} is on top of the player`);
        assert.ok(Number.isFinite(spot.at.angle));
        assert.ok(['region', 'anchor', 'spawn'].includes(spot.at.ref));
      }
    }
  }
});

test('a real choice offers more than one place', () => {
  // The three flagship decision points, the nest and the drought are choices;
  // the flood and the visitor are errands. Both are legitimate — but a stage
  // with a `wrongKey` and one spot would be a wrong answer nobody can give.
  for (const s of EVENT_SCRIPT_LIST) {
    for (const stage of s.stages) {
      if (stage.wrongKey) {
        assert.ok(stage.spots.length > 1, `${s.id}/${stage.id} warns about a choice it does not offer`);
        assert.ok(stage.correct.length < stage.spots.length, `${s.id}/${stage.id} has no wrong answer`);
      }
    }
  }
});

test('el incendio has its three decision points', () => {
  // The flagship, and the one the acceptance list names explicitly.
  assert.equal(stageCount('incendio'), 3);
  assert.equal(EVENT_SCRIPTS.incendio.learnKey, 'event.incendio.learn');
  for (const stage of EVENT_SCRIPTS.incendio.stages) {
    assert.equal(stage.spots.length, 2, `${stage.id} should be a two-way choice`);
    assert.equal(stage.correct.length, 1);
  }
});

test('residuos sorts twelve items into four bins', () => {
  assert.equal(stageCount('residuos'), 12);
  const bins = new Set(EVENT_SCRIPTS.residuos.stages[0]!.spots.map((s) => s.id));
  assert.equal(bins.size, 4);
  // Every item goes somewhere, and every bin is used by something.
  const used = new Set(EVENT_SCRIPTS.residuos.stages.flatMap((s) => s.correct));
  assert.equal(used.size, 4, 'a bin nothing belongs in is a bin nobody learns');
});

test('**every line an event can show has copy behind it**', () => {
  const missing: string[] = [];
  const check = (key: string | undefined) => {
    if (!key) return;
    if (typeof copy(key) !== 'string') missing.push(key);
  };
  for (const s of EVENT_SCRIPT_LIST) {
    check(s.titleKey);
    check(s.startKey);
    check(s.endKey);
    check(s.learnKey);
    for (const stage of s.stages) {
      check(stage.promptKey);
      check(stage.wrongKey);
      for (const spot of stage.spots) check(spot.labelKey);
    }
  }
  assert.deepEqual(missing, [], `event copy missing:\n${missing.join('\n')}`);
});

test('the scripts and the definitions agree about where events happen', () => {
  for (const s of EVENT_SCRIPT_LIST) {
    const def = EVENTS_BY_ID.get(s.id as EventId);
    assert.ok(def, `${s.id} has no definition`);
    assert.equal(s.region, def!.region, `${s.id} is scripted in the wrong region`);
    assert.equal(s.payout, def!.payout);
  }
});
