'use client';

import { MOVE, VERB_MOTION } from '@/lib/world/config';
import { sampleHeight, sampleSlope, type Heightfield } from '@/lib/world/terrain';
import type { IslandLayout } from '@/lib/world/layout';

/**
 * The five verbs that take over movement: **trepar, escalar, planear, nadar,
 * navegar**.
 *
 * `10-CONTROLS-AND-CAMERA.md` §3 is explicit that none of these may be an
 * animation. Gliding needs real air control. Climbing needs a real surface test.
 * Swimming needs real water movement and a shallow-shore exit. So each one here
 * is a small solver over the heightfield, and the controller switches between
 * them rather than playing a clip.
 *
 * **Pip never drowns, never falls to their death, never gets hurt.** There is no
 * failure state in traversal (`16-UI-AUDIO-A11Y.md` §3) — the worst outcome of
 * any of these is that you end up back on the ground.
 */
export type TraversalMode = 'ground' | 'swim' | 'climb' | 'glide' | 'boat';

/** How far ahead the mantle test looks for a ledge, in metres. */
const MANTLE_PROBE_M = 0.55;
/** A ledge has to be at least this tall to be worth mantling rather than walking. */
const MANTLE_MIN_M = 0.25;
/** Slope above which a face counts as a wall you could scale. */
const CLIMBABLE_SLOPE = 0.55;
/** How far above the ground Pip must be for gliding to be offered. */
const GLIDE_MIN_DROP_M = VERB_MOTION.glideMinLedgeM;
/** Depth at which water becomes swimmable rather than waded. */
export const SWIM_DEPTH_M = 0.35;
/** Below this depth the shore is shallow enough to walk out of. */
const SHORE_EXIT_DEPTH_M = 0.18;

export interface TraversalProbe {
  heightfield: Heightfield;
  layout: IslandLayout;
}

/**
 * **Trepar** — a real surface test, not a proximity check.
 *
 * Looks a short way along the direction of travel and asks whether the ground
 * there is a step Pip could pull themselves onto: high enough to be a ledge, low
 * enough to mantle, and with clear ground on top. Returns the height to snap to,
 * or `null`.
 */
export function mantleTarget(
  probe: TraversalProbe,
  x: number,
  z: number,
  yaw: number,
  currentY: number,
): number | null {
  const fx = x + Math.sin(yaw) * MANTLE_PROBE_M;
  const fz = z + Math.cos(yaw) * MANTLE_PROBE_M;
  const ahead = sampleHeight(probe.heightfield, fx, fz);
  const rise = ahead - currentY;
  if (rise < MANTLE_MIN_M || rise > VERB_MOTION.mantleMaxHeightM) return null;
  // The top has to be walkable, or this is a wall and not a ledge.
  const beyond = sampleHeight(
    probe.heightfield,
    x + Math.sin(yaw) * MANTLE_PROBE_M * 2,
    z + Math.cos(yaw) * MANTLE_PROBE_M * 2,
  );
  if (Math.abs(beyond - ahead) > VERB_MOTION.mantleMaxHeightM * 0.5) return null;
  return ahead;
}

/**
 * **Escalar** — is this a face Pip can climb?
 *
 * Steep enough to be a wall, and part of the mountain mass rather than a random
 * hillside: the marked faces are the ones on El Monte, which is what makes the
 * verb tied to the tier that unlocks the region.
 */
export function isClimbable(probe: TraversalProbe, x: number, z: number): boolean {
  if (sampleSlope(probe.heightfield, x, z) < CLIMBABLE_SLOPE) return false;
  for (const m of probe.layout.terrain.mountains) {
    if (Math.hypot(x - m.x, z - m.z) < m.r) return true;
  }
  return false;
}

/**
 * The wall's outward normal on the ground plane, so climbing movement can be
 * rotated into the wall's own frame rather than the camera's.
 */
export function wallNormal(probe: TraversalProbe, x: number, z: number): [number, number] {
  const e = probe.heightfield.step;
  const dx = sampleHeight(probe.heightfield, x + e, z) - sampleHeight(probe.heightfield, x - e, z);
  const dz = sampleHeight(probe.heightfield, x, z + e) - sampleHeight(probe.heightfield, x, z - e);
  const len = Math.hypot(dx, dz) || 1;
  return [-dx / len, -dz / len];
}

/**
 * **Planear** — may Pip glide from here?
 *
 * Only from a real drop: more than four metres of air below. That is what makes
 * the treehouse worth climbing and stops gliding from replacing walking.
 */
export function canGlide(probe: TraversalProbe, x: number, z: number, y: number): boolean {
  return y - sampleHeight(probe.heightfield, x, z) >= GLIDE_MIN_DROP_M;
}

export interface GlideState {
  vy: number;
}

/**
 * One glide step. Fall speed clamps to 1.8 m/s and horizontal control runs at
 * 3.2 m/s — **real air control**, so where you land is a decision rather than an
 * outcome. Ends on ground contact, always safely.
 */
export function stepGlide(
  probe: TraversalProbe,
  state: GlideState,
  pos: { x: number; y: number; z: number },
  inputX: number,
  inputZ: number,
  dt: number,
): boolean {
  state.vy = Math.max(state.vy - MOVE.accel * dt, -VERB_MOTION.glideFallSpeed);
  pos.y += state.vy * dt;
  pos.x += inputX * VERB_MOTION.glideHorizontalSpeed * dt;
  pos.z += inputZ * VERB_MOTION.glideHorizontalSpeed * dt;
  const ground = sampleHeight(probe.heightfield, pos.x, pos.z);
  if (pos.y <= ground) {
    pos.y = ground;
    state.vy = 0;
    return true; // landed
  }
  return false;
}

/**
 * **Nadar** — how deep is the water here, and can Pip get out?
 *
 * Buoyancy holds Pip at the surface; the exit needs a shallow shore, which is
 * what stops swimming from being a way to leave the island.
 */
export function waterDepth(probe: TraversalProbe, x: number, z: number): number {
  return Math.max(0, -sampleHeight(probe.heightfield, x, z));
}

export function isShallowShore(probe: TraversalProbe, x: number, z: number): boolean {
  return waterDepth(probe, x, z) < SHORE_EXIT_DEPTH_M;
}

/**
 * **Navegar** — boat steering.
 *
 * Control changes shape: the stick steers rather than pointing. Turning is
 * damped and speed is fixed, so a boat feels like a boat and not like a faster
 * Pip. The boat only floats where the water is deep enough to swim in.
 */
export interface BoatState {
  heading: number;
  speed: number;
}

const BOAT_TURN_RATE = 1.4;
const BOAT_ACCEL_LAMBDA = 1.1;

export function stepBoat(
  probe: TraversalProbe,
  state: BoatState,
  pos: { x: number; y: number; z: number },
  steer: number,
  throttle: number,
  dt: number,
): void {
  state.heading += steer * BOAT_TURN_RATE * dt;
  const target = throttle * VERB_MOTION.sailSpeed;
  state.speed += (target - state.speed) * (1 - Math.exp(-BOAT_ACCEL_LAMBDA * dt));

  const nx = pos.x + Math.sin(state.heading) * state.speed * dt;
  const nz = pos.z + Math.cos(state.heading) * state.speed * dt;
  // Refuse to beach: a boat that can be driven onto the grass is a bug, and a
  // soft stop is kinder than a wall.
  if (waterDepth(probe, nx, nz) > SHORE_EXIT_DEPTH_M) {
    pos.x = nx;
    pos.z = nz;
  } else {
    state.speed *= 0.4;
  }
  pos.y = -0.05;
}
