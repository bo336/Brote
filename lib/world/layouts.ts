/**
 * Saved arrangements.
 *
 * `08-WORLD-AND-PROGRESSION.md` §8 asks for named layouts a player can switch
 * between. `world_save_layout` already stores them, caps them by plan, and
 * validates every placement with the same function the autosave uses.
 *
 * **The slots are numbered, not named.** A text input in a 3D HUD is a keyboard
 * over the world, on a phone, to solve a problem nobody has: three slots do not
 * need names to be told apart, and "Guardado 2" is a better label than whatever
 * somebody types once and never reads again.
 */
import { LAYOUTS } from './config';
import { checkPlacement, remainingSlots } from './placement';
import type { Placement, RegionId, WorldLayout } from './types';

/** The stored name for a slot. Stable, so saving twice overwrites. */
export function slotName(index: number): string {
  return `${LAYOUTS.slotPrefix}${index + 1}`;
}

/** Which slot a stored layout sits in, or -1 if its name is not one of ours. */
export function slotOf(layout: WorldLayout): number {
  if (!layout.name.startsWith(LAYOUTS.slotPrefix)) return -1;
  const n = Number(layout.name.slice(LAYOUTS.slotPrefix.length));
  return Number.isInteger(n) && n >= 1 && n <= LAYOUTS.maxSlots ? n - 1 : -1;
}

/** The slots as the bar draws them: each either holds a layout or is empty. */
export function slots(layouts: readonly WorldLayout[], count = LAYOUTS.freeSlots): (WorldLayout | null)[] {
  const out: (WorldLayout | null)[] = new Array(Math.max(0, count)).fill(null);
  for (const layout of layouts) {
    const i = slotOf(layout);
    if (i >= 0 && i < out.length) out[i] = layout;
  }
  return out;
}

/** The first empty slot, or -1 when they are all full. */
export function firstFreeSlot(layouts: readonly WorldLayout[], count = LAYOUTS.freeSlots): number {
  return slots(layouts, count).findIndex((s) => s === null);
}

/**
 * What of a saved layout can actually be put down right now.
 *
 * Not all of it, necessarily: the cap is `4 + tier×3`, and a layout saved on a
 * bigger island — or holding a prop the player has since had removed from their
 * cosmetics — has to load as **what still fits** rather than be refused whole.
 * Losing three benches out of twenty is a worse outcome than losing all twenty,
 * and a refusal with no explanation is the worst of the three.
 */
export function loadable(
  layout: WorldLayout,
  ctx: {
    tier: number;
    owned: readonly string[];
    regionAt: (x: number, z: number) => RegionId;
    isGround?: (x: number, z: number) => boolean;
  },
): Placement[] {
  const cap = remainingSlots(ctx.tier, 0);
  const out: Placement[] = [];
  for (const item of layout.placements) {
    if (out.length >= cap) break;
    const region = ctx.regionAt(item.x, item.z);
    const rejection = checkPlacement(
      { prop_slug: item.prop_slug, region, x: item.x, z: item.z },
      { tier: ctx.tier, owned: ctx.owned, placedCount: out.length, isGround: ctx.isGround },
    );
    if (rejection) continue;
    out.push({ ...item, region });
  }
  return out;
}
