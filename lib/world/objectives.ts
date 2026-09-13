/**
 * **What should I do now?** One answer at a time.
 *
 * The 2026-09-12 playtest: "the mechanics aren't clear, I don't know how to
 * play, what to do." The island had chores, things to forage, species to log
 * and regions to find — and nothing on screen said so until you happened to
 * stand next to one. The spec banned quest lists from the HUD; the owner's
 * verdict overrides it for exactly this reason, and this is deliberately *not*
 * a list: it is the single next thing, picked from what the world already offers.
 *
 * Pure, so the order of priorities is tested rather than eyeballed:
 *
 *   1. the first session's current step,
 *   2. today's chores, nearest first, with how many are done,
 *   3. something ripe to gather or new to discover nearby,
 *   4. a region the player has not set foot in yet,
 *   5. somewhere to rest, or simply: walk.
 */
import type { RegionId, VerbId } from './types';

export interface ObjectiveThing {
  id: string;
  position: readonly [number, number, number];
  enabled: boolean;
  labelKey: string;
  verb?: VerbId;
}

export interface ObjectiveRegion {
  id: RegionId;
  x: number;
  z: number;
  radius: number;
  unlocked: boolean;
}

export type ObjectiveKind = 'move' | 'first' | 'chore' | 'gather' | 'discover' | 'explore' | 'rest' | 'free';

export interface Objective {
  kind: ObjectiveKind;
  /** Copy key under `mundo`, formatted with `{thing}`. */
  titleKey: string;
  /** Copy key under `mundo` for the thing itself, or null. */
  thingKey: string | null;
  target: { x: number; z: number } | null;
  targetId: string | null;
  progress: { done: number; total: number } | null;
  distanceM: number | null;
}

/** How far a gather or discover target may be before it stops counting as "nearby". */
export const NEARBY_M = 40;
/** Inside this fraction of a region's radius, the player has been there. */
export const VISIT_FRACTION = 0.6;

const GATHER = ['forage-', 'fish-'];
const DISCOVER = ['log-', 'track-', 'observe-', 'cave-'];

function thingKeyOf(t: ObjectiveThing): string {
  return t.verb ? `verb.${t.verb}` : t.labelKey;
}

function nearest<T extends { x: number; z: number }>(items: T[], px: number, pz: number): [T, number] | null {
  let best: T | null = null;
  let bestD = Infinity;
  for (const it of items) {
    const d = Math.hypot(it.x - px, it.z - pz);
    if (d < bestD) {
      bestD = d;
      best = it;
    }
  }
  return best ? [best, bestD] : null;
}

function asPoint(t: ObjectiveThing) {
  return { thing: t, x: t.position[0], z: t.position[2] };
}

export function hasVisited(region: ObjectiveRegion, x: number, z: number): boolean {
  return Math.hypot(region.x - x, region.z - z) < region.radius * VISIT_FRACTION;
}

export function pickObjective(input: {
  pip: { x: number; z: number };
  things: readonly ObjectiveThing[];
  regions: readonly ObjectiveRegion[];
  visited: ReadonlySet<RegionId>;
  firstRunBeat: string | null;
}): Objective {
  const { pip, things } = input;
  const base = { progress: null, distanceM: null } as const;

  // 1. The first session leads, and it leads by where to go.
  if (input.firstRunBeat === 'move') {
    return { ...base, kind: 'move', titleKey: 'goal.move', thingKey: null, target: null, targetId: null };
  }
  const firstSpot = things.find((t) => t.id === 'first-run-plant' && t.enabled);
  if (input.firstRunBeat === 'plant' && firstSpot) {
    const p = asPoint(firstSpot);
    return {
      kind: 'first', titleKey: 'goal.first', thingKey: thingKeyOf(firstSpot), target: { x: p.x, z: p.z },
      targetId: firstSpot.id, progress: null, distanceM: Math.hypot(p.x - pip.x, p.z - pip.z),
    };
  }

  // 2. Today's chores, nearest first.
  const chores = things.filter((t) => t.id.startsWith('chore-'));
  const open = chores.filter((t) => t.enabled).map(asPoint);
  const near = nearest(open, pip.x, pip.z);
  if (near) {
    const [p, d] = near;
    return {
      kind: 'chore', titleKey: 'goal.chore', thingKey: thingKeyOf(p.thing), target: { x: p.x, z: p.z },
      targetId: p.thing.id, progress: { done: chores.length - open.length, total: chores.length }, distanceM: d,
    };
  }

  // 3. Something to gather, then something to discover, if it is near enough to be worth the walk.
  for (const [kind, prefixes, titleKey] of [
    ['gather', GATHER, 'goal.gather'], ['discover', DISCOVER, 'goal.discover'],
  ] as const) {
    const pool = things.filter((t) => t.enabled && prefixes.some((pre) => t.id.startsWith(pre))).map(asPoint);
    const hit = nearest(pool, pip.x, pip.z);
    if (hit && hit[1] < NEARBY_M) {
      const [p, d] = hit;
      return {
        kind, titleKey, thingKey: thingKeyOf(p.thing), target: { x: p.x, z: p.z }, targetId: p.thing.id,
        progress: chores.length ? { done: chores.length, total: chores.length } : null, distanceM: d,
      };
    }
  }

  // 4. A region the player has not been to.
  const unexplored = input.regions.filter((r) => r.unlocked && r.id !== 'claro' && !input.visited.has(r.id));
  const far = nearest(unexplored, pip.x, pip.z);
  if (far) {
    const [r, d] = far;
    return {
      kind: 'explore', titleKey: 'goal.explore', thingKey: `region.${r.id}`, target: { x: r.x, z: r.z },
      targetId: `region-${r.id}`, progress: null, distanceM: d,
    };
  }

  // 5. Rest, or just walk.
  const rest = nearest(things.filter((t) => t.enabled && t.id.startsWith('rest-')).map(asPoint), pip.x, pip.z);
  if (rest) {
    const [p, d] = rest;
    return {
      kind: 'rest', titleKey: 'goal.rest', thingKey: thingKeyOf(p.thing), target: { x: p.x, z: p.z },
      targetId: p.thing.id, progress: null, distanceM: d,
    };
  }
  return { ...base, kind: 'free', titleKey: 'goal.free', thingKey: null, target: null, targetId: null };
}
