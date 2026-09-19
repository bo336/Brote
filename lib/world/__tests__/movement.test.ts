import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { MOVE, WATER_LEVEL } from '../config';
import { buildLayout, coastRadiusAt } from '../layout';
import { BODY_RADIUS, cameraRelative, MovementSolver, type Body, type MoveCollider, type StepInput } from '../movement';
import { cumulativeState } from '../progression';
import { mulberry32 } from '../rng';
import { bakeHeightfield, bakeResolutionFor, sampleHeight } from '../terrain';
import { SWIM_DEPTH_M } from '../traversal';

/**
 * **The playtest of 2026-09-12, as a test.**
 *
 * "The W does not always move forward from the camera, sometimes it just goes
 * anywhere, the same with all letters." "It sometimes gets stuck and I can't go
 * back from it." Neither is visible in a screenshot and both shipped, because
 * movement could only be run in a browser. This drives the real solver over
 * real generated islands — every tier that adds terrain — with bots that walk,
 * run, jump, strafe and turn the camera, and it asks the only question that
 * matters for being stuck: **from here, can a player still get out?**
 */
const DT = 1 / 30;

function island(tier: number) {
  const config = cumulativeState(tier);
  const layout = buildLayout(`movement-bot-${tier}`, config);
  const hf = bakeHeightfield(layout.terrain, bakeResolutionFor(layout.terrain));
  // Trunks and props, dense enough to make gaps a bot can wedge itself into.
  const colliders: MoveCollider[] = [];
  layout.scatter.forEach((p, i) => {
    if (i % 9 === 0 && !p.steep) colliders.push({ x: p.x, z: p.z, radius: 0.22 + p.roll * 0.4 });
  });
  // As `Props.tsx` does: every structure is a post in the way except the bridge,
  // which is a deck to walk over (`decks.ts`).
  for (const a of layout.anchors) if (a.feature !== 'bridge') colliders.push({ x: a.x, z: a.z, radius: 0.6 });
  return { config, layout, hf, colliders };
}

function bodyAt(hf: ReturnType<typeof island>['hf'], x: number, z: number): Body {
  return { x, y: sampleHeight(hf, x, z), z, yaw: 0, speed: 0, vx: 0, vz: 0, vy: 0, grounded: true, airborne: false };
}

const input = (x: number, z: number, jump = false, running = false): StepInput => ({
  x, z, magnitude: Math.min(1, Math.hypot(x, z)), running, jump,
});

test('W is away from the camera, S toward it, D to its right — at every yaw', () => {
  const out = new Float64Array(2);
  for (let i = 0; i < 24; i++) {
    const yaw = (i / 24) * Math.PI * 2 - Math.PI;
    const fx = Math.sin(yaw);
    const fz = Math.cos(yaw);
    // Screen-right is forward × up.
    const rx = -fz;
    const rz = fx;
    const near = (ax: number, az: number, bx: number, bz: number, what: string) =>
      assert.ok(Math.abs(ax - bx) < 1e-9 && Math.abs(az - bz) < 1e-9, `${what} at yaw ${yaw.toFixed(2)}`);
    cameraRelative(0, -1, yaw, out); near(out[0]!, out[1]!, fx, fz, 'W');
    cameraRelative(0, 1, yaw, out); near(out[0]!, out[1]!, -fx, -fz, 'S');
    cameraRelative(1, 0, yaw, out); near(out[0]!, out[1]!, rx, rz, 'D');
    cameraRelative(-1, 0, yaw, out); near(out[0]!, out[1]!, -rx, -rz, 'A');
  }
});

test('holding W on a real island walks straight away from the camera', () => {
  const { layout, hf, config } = island(2);
  for (let i = 0; i < 12; i++) {
    const yaw = (i / 12) * Math.PI * 2;
    const solver = new MovementSolver(hf, layout, config.verbs);
    const body = bodyAt(hf, layout.spawn[0], layout.spawn[1]);
    for (let t = 0; t < 0.5; t += DT) solver.step(body, input(0, -1), yaw, DT);
    const len = Math.hypot(body.vx, body.vz);
    const dot = (body.vx * Math.sin(yaw) + body.vz * Math.cos(yaw)) / len;
    assert.ok(len > MOVE.walkSpeed * 0.8, `barely moving at yaw ${yaw.toFixed(2)}: ${len}`);
    assert.ok(dot > Math.cos((6 * Math.PI) / 180), `W drifted ${((Math.acos(dot) * 180) / Math.PI).toFixed(1)}°`);
  }
});

test('Space jumps, lands, and the apex is the one the constants promise', () => {
  const { layout, hf, config } = island(2);
  const solver = new MovementSolver(hf, layout, config.verbs);
  const body = bodyAt(hf, layout.spawn[0], layout.spawn[1]);
  const start = body.y;
  let apex = start;
  let jumped = false;
  let landed = false;
  for (let t = 0; t < 1.5 && !landed; t += DT) {
    const r = solver.step(body, input(0, 0, t === 0), 0, DT);
    jumped ||= r.jumped;
    if (jumped && r.landed) landed = true;
    apex = Math.max(apex, body.y);
  }
  const expected = (MOVE.jumpSpeed * MOVE.jumpSpeed) / (2 * MOVE.gravity);
  assert.ok(jumped && landed, 'the jump never started or never came down');
  assert.ok(Math.abs(apex - start - expected) < 0.08, `apex ${(apex - start).toFixed(2)} vs ${expected.toFixed(2)}`);
});

/** From this exact state, does any direction get somewhere in a second and a half? */
function canEscape(solver: MovementSolver, body: Body, withJump: boolean): boolean {
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    const s = solver.clone();
    const b = { ...body };
    for (let t = 0; t < 1.5; t += DT) s.step(b, input(Math.cos(a), Math.sin(a), withJump && t < DT * 2), 0, DT);
    if (Math.hypot(b.x - body.x, b.z - body.z) > 0.5) return true;
  }
  return false;
}

for (const tier of [1, 4, 7, 8, 11]) {
  test(`tier ${tier}: bots walk the island for minutes and nobody is ever trapped`, () => {
    const { layout, hf, config, colliders } = island(tier);
    const canSwim = config.verbs.includes('swim');
    const starts = layout.scatter.filter((p) => !p.steep);
    const problems: string[] = [];
    let restores = 0;
    let stuckWithoutJump = 0;

    for (let bot = 0; bot < 14; bot++) {
      const rng = mulberry32(tier * 1000 + bot);
      const solver = new MovementSolver(hf, layout, config.verbs);
      solver.colliders = colliders;
      const p = starts[Math.floor(rng() * starts.length)]!;
      const body = bodyAt(hf, p.x, p.z);
      let yaw = rng() * Math.PI * 2;
      let ix = 0;
      let iz = -1;
      let run = false;
      let nextChange = 0;
      let jumpNow = false;

      for (let t = 0; t < 60; t += DT) {
        if (t >= nextChange) {
          const a = rng() * Math.PI * 2;
          const m = rng() < 0.15 ? 0 : 0.5 + rng() * 0.5;
          ix = Math.cos(a) * m;
          iz = Math.sin(a) * m;
          run = rng() < 0.3;
          jumpNow = rng() < 0.2;
          nextChange = t + 0.4 + rng() * 2.1;
        }
        yaw += (rng() - 0.5) * 0.08;
        const r = solver.step(body, input(ix, iz, jumpNow, run), yaw, DT);
        jumpNow = false;
        if (r.restored) restores++;

        const where = `bot ${bot} t=${t.toFixed(1)} at (${body.x.toFixed(2)}, ${body.z.toFixed(2)})`;
        if (!Number.isFinite(body.x + body.y + body.z)) problems.push(`${where}: non-finite`);
        if (!canSwim && solver.mode === 'ground' && WATER_LEVEL - sampleHeight(hf, body.x, body.z) > SWIM_DEPTH_M + 0.02) {
          problems.push(`${where}: in deep water without swim`);
        }
        const islet = layout.terrain.islet;
        const onIslet = islet !== null && Math.hypot(body.x - islet.x, body.z - islet.z) < islet.r * 1.2;
        if (!onIslet && Math.hypot(body.x, body.z) > coastRadiusAt(layout.coastline, Math.atan2(body.z, body.x)) + 0.01) {
          problems.push(`${where}: past the coastline`);
        }
        for (const c of colliders) {
          if (Math.hypot(body.x - c.x, body.z - c.z) < c.radius + BODY_RADIUS - 0.03) {
            problems.push(`${where}: inside a collider`);
            break;
          }
        }

        // Every few seconds, ask the real question.
        if (Math.round(t / DT) % 150 === 149 && solver.mode === 'ground' && !body.airborne) {
          if (!canEscape(solver, body, true)) problems.push(`${where}: TRAPPED — no direction escapes, even jumping`);
          else if (!canEscape(solver, body, false)) stuckWithoutJump++;
        }
        if (problems.length > 12) break;
      }
    }
    assert.deepEqual(problems.slice(0, 12), [], `tier ${tier}: ${problems.length} problems`);
    // Restores are the safety net, not the design: a handful per 14 bot-minutes.
    assert.ok(restores <= 14, `tier ${tier}: ${restores} restores — the ground is trapping bots, not just saving them`);
    assert.ok(stuckWithoutJump <= 2, `tier ${tier}: ${stuckWithoutJump} spots only a jump gets out of`);
  });
}
