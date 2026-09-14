import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { LIGHT_PRESET_CROSSFADE_S, LIVELINESS } from '../config';
import { warmerBy } from '../liveliness';

/**
 * **The sun must not grow.**
 *
 * `applyLiveliness` used to do `key.intensity *= warmth` every frame, right
 * after the preset cross-fade — and the fade only pulls back a fraction of a
 * percent per frame. Measured in a running session: the key light went from
 * 6.8e18 to 5.1e75 in fourteen seconds, crossed the float limit between the
 * fifth and sixth, and every lit surface became NaN, which draws as black.
 * Players saw the screen go black after walking for a while; the art pass saw
 * a mountain that "rendered black" and chased the wrong causes for hours.
 *
 * `lib/render/lights.ts` imports three and path aliases this test build cannot
 * load, so the update is simulated here with the same constants and the real
 * `warmerBy`, and the shape of the real code is pinned by a grep.
 */
function repoRoot(from: string): string {
  let dir = from;
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error('repo root not found');
}
/** Comments stripped: the fix's own comment quotes the line it replaced. */
const LIGHTS_SRC = fs.readFileSync(path.join(repoRoot(__dirname), 'lib/render/lights.ts'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/\/\/[^\n]*/g, ' ');

/** Día's key intensity. The exact preset does not matter; stability does. */
const PRESET_KEY = 1.1;
/** The preview route's liveliness, the one the black screen was reproduced at. */
const LIVELINESS_VALUE = 0.8;

function simulate(form: 'compounding' | 'fixed', fps: number, seconds: number): number {
  const dt = 1 / fps;
  const k = 1 - Math.exp(-dt / LIGHT_PRESET_CROSSFADE_S);
  const warmth = warmerBy(LIVELINESS.keyWarmthGain, LIVELINESS_VALUE);
  let base = PRESET_KEY;
  let live = PRESET_KEY;
  for (let i = 0, n = Math.round(seconds * fps); i < n; i++) {
    if (form === 'compounding') {
      live += (PRESET_KEY - live) * k;
      live *= warmth;
    } else {
      base += (PRESET_KEY - base) * k;
      live = base * warmth;
    }
  }
  return live;
}

test('liveliness really does warm the light — otherwise this test proves nothing', () => {
  assert.ok(warmerBy(LIVELINESS.keyWarmthGain, LIVELINESS_VALUE) > 1,
    'warmth is not above 1, so the compounding counter-example below cannot fail');
});

test('the old form explodes: this is the black screen', () => {
  const after10s = simulate('compounding', 60, 10);
  assert.ok(!Number.isFinite(after10s) || after10s > 1e6, `stayed at ${after10s}`);
});

test('**the fixed form is bounded, at every frame rate, for a whole session**', () => {
  const expected = PRESET_KEY * warmerBy(LIVELINESS.keyWarmthGain, LIVELINESS_VALUE);
  for (const fps of [24, 30, 60, 100, 144]) {
    const after10min = simulate('fixed', fps, 600);
    assert.ok(Number.isFinite(after10min), `${fps} fps went non-finite`);
    assert.ok(Math.abs(after10min - expected) < 1e-9, `${fps} fps: ${after10min} vs ${expected}`);
  }
});

test('no light intensity in the rig is ever multiplied in place', () => {
  // `x.intensity *=` on a value that is also updated every frame is exactly
  // the shape of this bug. Assignment from a base is the only allowed form.
  assert.ok(!/intensity\s*\*=/.test(LIGHTS_SRC), 'lib/render/lights.ts multiplies an intensity in place');
});

test('liveliness is applied on top of the cross-faded base, not the live value', () => {
  assert.ok(/rig\.key\.intensity\s*=\s*rig\.current\.keyIntensity\s*\*/.test(LIGHTS_SRC),
    'applyLiveliness no longer assigns from rig.current.keyIntensity');
  assert.ok(/c\.keyIntensity\s*\+=\s*\(preset\.keyIntensity\s*-\s*c\.keyIntensity\)/.test(LIGHTS_SRC),
    'applyPreset no longer fades the base intensity');
});
