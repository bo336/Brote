/**
 * Walkable decks: surfaces above the ground that Pip can stand on. Today, the bridge.
 *
 * The heightfield was the only floor the movement solver knew, so a bridge was
 * a picture over a riverbed: Pip walked through its planks, down into the
 * channel and up the other side. A deck is a rotated rectangle with a height.
 * The solver stands on whichever is higher, the deck or the ground — but only
 * when the body is up at the deck's level, so the riverbed under a bridge can
 * still be waded. On the deck, its rails are walls.
 *
 * Pure, and allocation-free per query.
 */
import { BRIDGE, WATER_LEVEL } from './config';
import type { AnchorPoint, IslandLayout } from './layout';
import { sampleHeight, type Heightfield } from './terrain';

export interface Deck {
  x: number;
  z: number;
  /** Rotation about Y. The span runs along the rotated local X axis. */
  rotY: number;
  halfSpan: number;
  halfWidth: number;
  /** The structure's origin height. The deck's top is this, plus `BRIDGE.deckTopM`, plus the camber. */
  baseY: number;
}

/** A bridge anchor's deck, its ends resting on the higher bank so neither end is a lip. */
export function bridgeDeck(anchor: AnchorPoint, hf: Heightfield): Deck {
  const halfSpan = (anchor.span ?? BRIDGE.defaultSpanM) / 2;
  const c = Math.cos(anchor.rotY);
  const s = Math.sin(anchor.rotY);
  // Local X, in world space, is (cos θ, −sin θ).
  const a = sampleHeight(hf, anchor.x + c * halfSpan, anchor.z - s * halfSpan);
  const b = sampleHeight(hf, anchor.x - c * halfSpan, anchor.z + s * halfSpan);
  return {
    x: anchor.x,
    z: anchor.z,
    rotY: anchor.rotY,
    halfSpan,
    halfWidth: BRIDGE.deckWidthM / 2,
    // Resting on the higher bank — or, where both banks are under the water, lifted clear of it.
    baseY: Math.max(Math.max(a, b) - BRIDGE.sinkM, WATER_LEVEL + BRIDGE.minDeckClearM) - BRIDGE.deckTopM,
  };
}

export function decksFor(layout: IslandLayout, hf: Heightfield): Deck[] {
  return layout.anchors.filter((a) => a.feature === 'bridge').map((a) => bridgeDeck(a, hf));
}

/** The deck's top under a point, or null off every deck. */
export function deckTopAt(decks: readonly Deck[], x: number, z: number): number | null {
  for (let i = 0; i < decks.length; i++) {
    const d = decks[i]!;
    const c = Math.cos(d.rotY);
    const s = Math.sin(d.rotY);
    const dx = x - d.x;
    const dz = z - d.z;
    const lx = dx * c - dz * s;
    const lz = dx * s + dz * c;
    if (Math.abs(lx) > d.halfSpan || Math.abs(lz) > d.halfWidth) continue;
    const t = (lx + d.halfSpan) / (2 * d.halfSpan);
    return d.baseY + BRIDGE.deckTopM + Math.sin(t * Math.PI) * BRIDGE.camberM;
  }
  return null;
}

/**
 * Would a step from `(fx, fz)` to `(x, z)` at height `y` go **through** a rail?
 *
 * A rail is a line along each side of the deck, stopping short of its open
 * ends. Only crossing that line is refused: stepping off the side from the deck,
 * or climbing on through the side from beside it. It used to refuse any step
 * that ended near a side, which pinned a body that had landed there — every way
 * it could move, inward included, ended near the side.
 */
export function crossesRail(decks: readonly Deck[], fx: number, fz: number, x: number, z: number, y: number): boolean {
  for (let i = 0; i < decks.length; i++) {
    const d = decks[i]!;
    if (y < d.baseY + BRIDGE.deckTopM - BRIDGE.stepUpM) continue;
    const c = Math.cos(d.rotY);
    const s = Math.sin(d.rotY);
    const flx = (fx - d.x) * c - (fz - d.z) * s;
    const flz = (fx - d.x) * s + (fz - d.z) * c;
    const tlx = (x - d.x) * c - (z - d.z) * s;
    const tlz = (x - d.x) * s + (z - d.z) * c;
    // Past the rail's end on both sides of the step: the deck's open end.
    if (Math.min(Math.abs(flx), Math.abs(tlx)) > d.halfSpan - BRIDGE.railInsetM) continue;
    const line = d.halfWidth - BRIDGE.railInsetM * 0.5;
    const from = Math.abs(flz) <= line;
    const to = Math.abs(tlz) <= line;
    if (from && !to) return true;
    if (!from && to && Math.abs(flz) > d.halfWidth) return true;
  }
  return false;
}
