'use client';

import { INTERACT } from '@/lib/world/config';
import type { Interactable, VerbId } from '@/lib/world/types';

/**
 * Every interactable in the world, and the rule for picking one.
 *
 * **Distance checks, not raycasts** (`10-CONTROLS-AND-CAMERA.md` §5). Raycasting
 * from the camera makes interaction depend on precise aim, which is miserable
 * on a phone. Tapping the object still works — that is the one place a raycast
 * belongs, and R3F gives it free.
 *
 * The scoring below is the part that matters: **ties break by facing angle, not
 * by distance alone**, so standing between two objects while looking at one
 * picks the one you are looking at.
 */
/**
 * How loudly a thing asks to be the one offered.
 *
 * Everything in range competes for the single action button, and distance
 * alone gets it wrong: standing between a bird you could log and the firebreak
 * you are meant to cut, the bird wins on centimetres and the event stalls with
 * no way to explain itself. So the thing that is *asking something of the
 * player right now* outranks scenery, and within a rank the nearest wins.
 */
export const PRIORITY = {
  /** Anything the world just put in front of you and is waiting on. */
  event: 30,
  /** Today's three. Asked for, but not urgent. */
  chore: 20,
  /** Verbs, El Mojón, the ordinary business of the island. */
  normal: 10,
  /** "This is a bench." Never worth interrupting anything else. */
  flavour: 0,
} as const;

export interface RegisteredInteractable extends Interactable {
  onInteract: () => void;
}

const registry = new Map<string, RegisteredInteractable>();

export function registerInteractable(item: RegisteredInteractable): () => void {
  registry.set(item.id, item);
  return () => {
    registry.delete(item.id);
  };
}

export function clearInteractables(): void {
  registry.clear();
}

/**
 * Everything currently registered, for the perf and review protocols.
 *
 * A count says the world built; the ids and positions say *what* it built and
 * where to walk to reach it — which is the difference between "chores exist"
 * and "chores exist somewhere I could not find".
 */
export function listInteractables(): {
  id: string; position: [number, number, number]; enabled: boolean; priority: number; radius: number;
}[] {
  return [...registry.values()].map((i) => ({
    id: i.id,
    position: i.position,
    enabled: i.enabled,
    priority: i.priority ?? PRIORITY.normal,
    radius: i.radius,
  }));
}

export function getInteractable(id: string): RegisteredInteractable | undefined {
  return registry.get(id);
}

/**
 * The nearest usable interactable, or `null`. Called every third frame, so it
 * allocates nothing and iterates a map that is never long.
 */
export function findActive(x: number, z: number, yaw: number, verbs: readonly VerbId[]): RegisteredInteractable | null {
  let best: RegisteredInteractable | null = null;
  let bestScore = Infinity;
  let bestRank = -Infinity;
  // Pip's facing, as a direction on the ground plane.
  const fx = Math.sin(yaw);
  const fz = Math.cos(yaw);

  for (const item of registry.values()) {
    if (!item.enabled) continue;
    // No verb means no unlock gates it — see `Interactable.verb`.
    if (item.verb && !verbs.includes(item.verb)) continue;
    const dx = item.position[0] - x;
    const dz = item.position[2] - z;
    const distance = Math.hypot(dx, dz);
    if (distance > item.radius) continue;

    // 0 when Pip faces the object, 1 when it is directly behind them.
    const facing = distance < 0.001 ? 0 : (1 - (dx * fx + dz * fz) / distance) / 2;
    const score = distance / item.radius + facing * INTERACT.facingWeight;
    const rank = item.priority ?? PRIORITY.normal;
    // Priority first, then the nearest thing you are facing within that rank.
    if (rank > bestRank || (rank === bestRank && score < bestScore)) {
      bestRank = rank;
      bestScore = score;
      best = item;
    }
  }
  return best;
}
