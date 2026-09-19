/**
 * The arrival driver — how a feature *happens* rather than appears.
 *
 * `08-WORLD-AND-PROGRESSION.md` §5 beat 3 is unusually specific: the physical
 * event is "a scripted animation over existing geometry, **never a fade-in**,
 * never new content loaded mid-shot". So the world is already built at the new
 * tier before the ceremony starts, and this is what holds the new part *back*
 * and then lets it arrive.
 *
 * It is four uniforms on materials that already exist. Nothing here allocates,
 * nothing recompiles a shader, and outside a ceremony `mode` is `none` and every
 * shader takes a uniform branch that is coherent across the whole draw — which
 * is why this can be compiled into every clay material in the game rather than
 * into a ninth one bought out of a budget of eight.
 */

/**
 * The four ways something arrives.
 *
 * - `uplift` — the ground buckles and pushes up out of itself (monte, islote).
 * - `snowline` — a line descends the peak and snow settles below it (nieve).
 * - `grow` — a front races outward and everything it passes grows from its own
 *   base (flores, árbol; the difference between them is the easing, which the
 *   ceremony owns, not the shader).
 * - `channel` — water breaks through at a head and cuts downhill (río).
 * - `repaint` — the new world's palette washes outward over the old one, for
 *   the world-completion ceremony (`08` §7, "the palette cross-fades").
 */
/**
 * A framed shot, for the tier-up ceremony.
 *
 * The ceremony is the one time the camera stops following and starts *looking*
 * (`08-WORLD-AND-PROGRESSION.md` §5 beat 1). Everything about it is authored —
 * where it looks, from how far, and how slowly it drifts around — because a
 * damped follow rig pointed at a mountain does not compose a shot.
 *
 * It lives in `lib/render` rather than next to the camera that consumes it
 * because `arrivals.ts` composes these from the layout, and `lib/render` may
 * not depend on a layer above it.
 */
export interface CameraShot {
  /** What to look at, in world metres. */
  x: number;
  y: number;
  z: number;
  distance: number;
  /** Where the lens sits around the target. Radians. */
  yaw: number;
  pitchDeg: number;
  /** Radians per second of slow drift. **Zero under reduced motion** (XAG 117). */
  orbit: number;
}

export type RevealMode = 'none' | 'uplift' | 'snowline' | 'grow' | 'channel' | 'repaint';

const MODE_INDEX: Record<RevealMode, number> = {
  none: 0, uplift: 1, snowline: 2, grow: 3, channel: 4, repaint: 5,
};

export interface RevealState {
  mode: RevealMode;
  /** Where the event happens, in world metres. `y` is its base height. */
  centre: [number, number, number];
  /** How far it reaches. For `snowline`, how far the line falls. */
  radius: number;
  /** 0 → not yet, 1 → arrived. The ceremony eases this; the shader does not. */
  amount: number;
  /**
   * What the ground looked like *before*.
   *
   * `snowline` needs it: the baked ground already has its snow painted in, so
   * the animation is the un-snowed rock retreating downhill rather than white
   * being added on top. Ending on the baked colour exactly is the point — a
   * ceremony that leaves the world a shade off from where it will be tomorrow
   * is a ceremony that lied.
   */
  bare: [number, number, number];
}

/**
 * The whole island, for the events that are not local to one region.
 *
 * `repaint` sweeps from wherever the player is standing to the far shore, so
 * its radius is the island rather than a feature.
 */
export const ISLAND_WIDE = 1.15;

export const REVEAL_OFF: RevealState = {
  mode: 'none',
  centre: [0, 0, 0],
  radius: 1,
  amount: 1,
  bare: [0.45, 0.42, 0.4],
};

export function revealModeIndex(mode: RevealMode): number {
  return MODE_INDEX[mode];
}

/**
 * Three accelerating bursts, for the sapling (§5 beat 3, "árbol").
 *
 * A plain ease would read as a balloon inflating. Steps with a held beat between
 * them read as something pushing, resting, and pushing again — which is what the
 * spec asks for and what a growing plant actually looks like in time-lapse.
 */
export function burstEase(t: number, bursts = 3): number {
  const x = Math.min(1, Math.max(0, t));
  const step = Math.min(bursts - 1, Math.floor(x * bursts));
  const within = x * bursts - step;
  // Each burst covers more ground than the last, and eases out inside itself.
  const weight = (step + 1) / ((bursts * (bursts + 1)) / 2);
  const done = (step * (step + 1)) / 2 / ((bursts * (bursts + 1)) / 2);
  return Math.min(1, done + weight * (1 - Math.pow(1 - within, 3)));
}

/** A smooth 0→1 with no overshoot, for the events that are not sudden. */
export function smoothEase(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}
