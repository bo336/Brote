import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { decide, outboxKey, readOutbox, writeOutbox, type OutboxStore } from '../outbox';
import type { Placement } from '../types';

/** A `localStorage` that a test can break on purpose. */
function store(): OutboxStore & { data: Map<string, string>; fail: boolean } {
  const data = new Map<string, string>();
  const s = {
    data,
    fail: false,
    getItem(k: string) {
      if (s.fail) throw new Error('storage is not available');
      return data.get(k) ?? null;
    },
    setItem(k: string, v: string) {
      if (s.fail) throw new Error('storage is not available');
      data.set(k, v);
    },
    removeItem(k: string) {
      if (s.fail) throw new Error('storage is not available');
      data.delete(k);
    },
  };
  return s;
}

function p(over: Partial<Placement> = {}): Placement {
  return { prop_slug: 'mundo_banco', region: 'claro', x: 0, z: 0, rot_y: 0, variant: 0, ...over };
}

test('two accounts on one phone do not share a queue', () => {
  assert.notEqual(outboxKey('ana'), outboxKey('beto'));
  const s = store();
  writeOutbox(s, 'ana', { placements: [p()], at: 1 });
  assert.equal(readOutbox(s, 'beto'), null);
  assert.equal(readOutbox(s, 'ana')?.placements.length, 1);
});

test('**an arrangement survives a dropped connection**', () => {
  const s = store();
  const arrangement = [p({ x: 1 }), p({ x: 2, prop_slug: 'mundo_hamaca' })];

  // The save goes out, the network is gone, the decision is to keep it.
  const d = decide({ kind: 'offline' });
  assert.equal(d.keep, true);
  assert.equal(d.state, 'queued');
  writeOutbox(s, 'ana', { placements: arrangement, at: 1000 });

  // The tab closes and reopens: the arrangement is still there, intact.
  const restored = readOutbox(s, 'ana');
  assert.deepEqual(restored?.placements, arrangement);

  // The connection comes back, the write lands, the queue empties.
  assert.equal(decide({ kind: 'saved' }).keep, false);
  writeOutbox(s, 'ana', null);
  assert.equal(readOutbox(s, 'ana'), null);
  assert.equal(s.data.size, 0);
});

test('a batch the server refused is dropped, not retried forever', () => {
  // Over the cap, a locked region, a prop they do not own: the same batch will
  // be refused identically on every retry, and a queue that never empties is
  // how an autosave becomes a loop.
  const d = decide({ kind: 'rejected', reason: 'over_cap' });
  assert.equal(d.keep, false);
  assert.equal(d.state, 'error');
  assert.equal(d.reason, 'over_cap');
});

test('storage that refuses to work loses the queue and nothing else', () => {
  // A private window, cleared site data, a browser set to block it. Losing the
  // outbox is survivable; throwing on the way into the world is not.
  const s = store();
  s.fail = true;
  assert.doesNotThrow(() => writeOutbox(s, 'ana', { placements: [p()], at: 1 }));
  assert.equal(readOutbox(s, 'ana'), null);
});

test('a corrupt or foreign value reads as empty rather than as an arrangement', () => {
  const s = store();
  s.data.set(outboxKey('ana'), 'not json at all');
  assert.equal(readOutbox(s, 'ana'), null);
  s.data.set(outboxKey('ana'), JSON.stringify({ placements: 'a bench', at: 1 }));
  assert.equal(readOutbox(s, 'ana'), null);
  // A shape from an older build, missing its timestamp, still yields the work.
  s.data.set(outboxKey('ana'), JSON.stringify({ placements: [p()] }));
  assert.equal(readOutbox(s, 'ana')?.placements.length, 1);
});
