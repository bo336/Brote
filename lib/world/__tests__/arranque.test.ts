import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  abrir,
  cerrarLimpio,
  CRASH_MARK_TTL_MS,
  FAILURES_TTL_MS,
  lensAllowed,
  marcarEstable,
  maxAutoTier,
  olvidarFallos,
  registrarFallo,
  volverAlFrente,
  type KeyValue,
} from '../arranque';
import { createQualityMonitor } from '../../render/quality';
import { QUALITY_MONITOR } from '../config';

function memoria(): KeyValue & { m: Map<string, string> } {
  const m = new Map<string, string>();
  return { m, getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
}

test('a clean first opening starts normal', () => {
  const s = memoria();
  assert.deepEqual(abrir(s, 1_000), { fallos: 0, liviano: null });
});

test('an opening that never closed is a crash: the next one starts at T1, then T0', () => {
  const s = memoria();
  abrir(s, 1_000); // dies here — no cerrarLimpio
  assert.deepEqual(abrir(s, 60_000), { fallos: 1, liviano: 1 });
  // dies again
  assert.deepEqual(abrir(s, 120_000), { fallos: 2, liviano: 0 });
});

test('going to the background or leaving is not a crash', () => {
  const s = memoria();
  abrir(s, 1_000);
  cerrarLimpio(s);
  assert.equal(abrir(s, 60_000).liviano, null);
  // background, come back, then leave cleanly
  cerrarLimpio(s);
  volverAlFrente(s, 70_000);
  cerrarLimpio(s);
  assert.equal(abrir(s, 80_000).liviano, null);
});

test('an old mark is not a crash, and old failures expire', () => {
  const s = memoria();
  abrir(s, 1_000);
  assert.equal(abrir(s, 1_000 + CRASH_MARK_TTL_MS + 1).liviano, null);
  registrarFallo(s, 10_000);
  registrarFallo(s, 10_000);
  cerrarLimpio(s);
  assert.equal(abrir(s, 10_000 + FAILURES_TTL_MS + 1).liviano, null);
});

test('running stably forgets failures; the player can ask for the full world', () => {
  const s = memoria();
  registrarFallo(s, 1_000);
  marcarEstable(s);
  assert.equal(abrir(s, 2_000).liviano, null);
  registrarFallo(s, 3_000);
  olvidarFallos(s);
  cerrarLimpio(s);
  assert.equal(abrir(s, 4_000).liviano, null);
});

test('no storage at all: nothing breaks, nothing is guarded', () => {
  assert.deepEqual(abrir(null, 1), { fallos: 0, liviano: null });
  assert.equal(registrarFallo(null, 1), 0);
});

test('a phone never promotes past T2; a desktop can reach T3', () => {
  assert.equal(maxAutoTier(true), 2);
  assert.equal(maxAutoTier(false), 3);
  const fast = 1000 / 120;
  const run = (maxAuto: 0 | 1 | 2 | 3) => {
    const m = createQualityMonitor({ start: 1, maxAuto });
    let t = 0;
    let tier = 1;
    // Ten simulated minutes of frames with lots of headroom.
    for (let i = 0; i < 120 * 600; i++) {
      t += fast;
      const next = m.sample(fast, t);
      if (next !== null) tier = next;
    }
    return tier;
  };
  assert.ok(QUALITY_MONITOR.promoteAfterS < 600);
  assert.equal(run(2), 2);
  assert.equal(run(3), 3);
});

test('the lens runs on a phone only when the player chose "Alta"', () => {
  assert.equal(lensAllowed(true, 'auto'), false);
  assert.equal(lensAllowed(true, 'mid'), false);
  assert.equal(lensAllowed(true, 'high'), true);
  assert.equal(lensAllowed(false, 'auto'), true);
});
