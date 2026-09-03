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
  // Pip's facing, as a direction on the ground plane.
  const fx = Math.sin(yaw);
  const fz = Math.cos(yaw);

  for (const item of registry.values()) {
    if (!item.enabled) continue;
    if (!verbs.includes(item.verb)) continue;
    const dx = item.position[0] - x;
    const dz = item.position[2] - z;
    const distance = Math.hypot(dx, dz);
    if (distance > item.radius) continue;

    // 0 when Pip faces the object, 1 when it is directly behind them.
    const facing = distance < 0.001 ? 0 : (1 - (dx * fx + dz * fz) / distance) / 2;
    const score = distance / item.radius + facing * INTERACT.facingWeight;
    if (score < bestScore) {
      bestScore = score;
      best = item;
    }
  }
  return best;
}
