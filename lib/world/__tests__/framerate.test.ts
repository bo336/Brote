import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

/**
 * **30 fps and 60 fps must produce the same world** (`20-ACCEPTANCE.md` 2D).
 *
 * The acceptance line asks for a two-forced-frame-rate comparison, and it stayed
 * open for three phases because the browser pane throttles
 * `requestAnimationFrame` — every frame-rate observation taken there was an
 * observation of the throttle. It is checked here instead, which is stronger
 * than the comparison it replaces: an eyeball test passes once, on the machine
 * it was run on, and this fails the moment somebody writes `k * dt`.
 *
 * Two halves:
 *
 *  1. **The form is correct** — `1 - exp(-λ·dt)` converges to the same place at
 *     any step size, and the naive `λ·dt` does not. The second assertion is the
 *     one that matters: it shows the bug this rule exists to prevent is real.
 *  2. **Every damping site uses the form.** A grep, because the world has
 *     seventeen of them and a rule nobody checks is a rule that holds until the
 *     eighteenth.
 */
function repoRoot(from: string): string {
  let dir = from;
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error('repo root not found');
}
const ROOT = repoRoot(__dirname);
const ROOTS = ['components/mundo3d', 'lib/render', 'lib/world'];

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === '__tests__' || e.name === 'node_modules') continue;
      walk(full, out);
    } else if (['.ts', '.tsx'].includes(path.extname(e.name))) out.push(full);
  }
  return out;
}

const SOURCES = ROOTS.flatMap((r) => walk(path.join(ROOT, r))).map((f) => ({
  file: path.relative(ROOT, f),
  text: fs.readFileSync(f, 'utf8'),
}));

/**
 * Approach a target for exactly `seconds`, at about `dt` per step.
 *
 * The step is nudged so the run covers the whole second and not 1.03 of it:
 * comparing 45 fps against 60 fps otherwise compares two different amounts of
 * elapsed time, which would make this test fail for arithmetic reasons that
 * have nothing to do with the thing it is checking.
 */
function settle(weight: (dt: number) => number, dt: number, seconds: number): number {
  const steps = Math.max(1, Math.round(seconds / dt));
  const step = seconds / steps;
  let value = 0;
  for (let i = 0; i < steps; i++) value += (1 - value) * weight(step);
  return value;
}

const LAMBDA = 6;
const exponential = (dt: number) => 1 - Math.exp(-LAMBDA * dt);
const naive = (dt: number) => LAMBDA * dt;

test('**the same second of walking lands in the same place at 30 and at 60 fps**', () => {
  const at60 = settle(exponential, 1 / 60, 1);
  const at30 = settle(exponential, 1 / 30, 1);
  assert.ok(Math.abs(at60 - at30) < 0.002, `60fps ${at60} vs 30fps ${at30}`);
});

test('…and at 24, 90 and 144, because a phone picks its own rate', () => {
  const reference = settle(exponential, 1 / 60, 1);
  for (const fps of [24, 30, 45, 90, 120, 144]) {
    const got = settle(exponential, 1 / fps, 1);
    assert.ok(Math.abs(got - reference) < 0.004, `${fps}fps: ${got} vs ${reference}`);
  }
});

test('the naive form really is broken — this is the bug the rule prevents', () => {
  // A quarter second, which is about how long a camera takes to catch up — and
  // where the two curves are furthest apart. Over a whole second both forms
  // have converged on the target and the bug hides; a player never sees the
  // converged part, they see the quarter second after they let go.
  const at60 = settle(naive, 1 / 60, 0.25);
  const at30 = settle(naive, 1 / 30, 0.25);
  assert.ok(Math.abs(at60 - at30) > 0.01,
    `the counter-example stopped being one: ${at60} vs ${at30}`);
  // …and the exponential form, over the same window, does not move.
  assert.ok(Math.abs(settle(exponential, 1 / 60, 0.25) - settle(exponential, 1 / 30, 0.25)) < 0.002);
});

test('a dropped frame is caught up, not skipped past', () => {
  // One 100 ms hitch inside a second must land where sixty even steps would.
  let hitched = 0;
  const step = (dt: number) => { hitched += (1 - hitched) * exponential(dt); };
  for (let i = 0; i < 54; i++) step(1 / 60);
  step(0.1);
  for (let i = 0; i < 3; i++) step(1 / 60);
  const even = settle(exponential, 1 / 60, 54 / 60 + 0.1 + 3 / 60);
  assert.ok(Math.abs(hitched - even) < 0.01, `${hitched} vs ${even}`);
});

test('every damping site in the world uses the exponential form', () => {
  // The shape to look for: a weight multiplied by a raw delta. `Math.exp` on
  // the same line is the exemption, and it is the only one.
  const offenders: string[] = [];
  for (const { file, text } of SOURCES) {
    text.split('\n').forEach((line, i) => {
      const code = line.replace(/\/\/.*$/, '');
      if (!/\b(lerp|slerp|damp)\w*\(/.test(code)) return;
      if (/Math\.exp/.test(code)) return;
      // A weight that is a plain identifier was computed elsewhere; the smell
      // is arithmetic on the delta at the call site.
      if (/\*\s*(dt|delta)\b|\b(dt|delta)\s*\*/.test(code)) offenders.push(`${file}:${i + 1}`);
    });
  }
  assert.deepEqual(offenders, [], `frame-rate dependent damping: ${offenders.join(', ')}`);
});

test('the clamp that stops a backgrounded tab teleporting Pip is still there', () => {
  // Frame-rate independence has one limit: a tab that was away for a minute
  // must not resolve that minute in one step. `TERRAIN.frameClampS` is what
  // makes the catch-up above safe.
  // `path.relative` hands back backslashes on Windows.
  const world = SOURCES.find((s) => s.file.replace(/\\/g, '/').endsWith('scene/World.tsx'));
  assert.ok(world, 'World.tsx not found');
  assert.ok(/Math\.min\(delta, TERRAIN\.frameClampS\)/.test(world!.text));
});
