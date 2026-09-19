/**
 * What colour the ground is at a point.
 *
 * Split from `terrain.ts` for the 400-line rule (`01-RULES.md` §3.2), on a seam
 * that was already there: this file answers "what colour is the ground here",
 * and `terrain.ts` answers "what shape is it". Everything here is colour maths
 * over the heightfield — no geometry is built, and nothing runs per frame.
 *
 * The ramps are module-level and mutated by `primeRamp` before a bake, which is
 * why the palette is passed once rather than threaded through every vertex.
 */
import * as THREE from 'three';

import { WATER_LEVEL } from '@/lib/world/config';
import { regionAt, type IslandLayout } from '@/lib/world/layout';
import { REGION_CHARACTER } from '@/lib/world/regions';
import { fbm, sampleHeight, type Heightfield } from '@/lib/world/terrain';
import type { WorldPalette } from '../palette';
import { CLAY } from '../palette';

const scratch = new THREE.Color();
/**
 * A SECOND scratch colour, and the reason is worth writing down: `groundColor`
 * is called with `scratch` as its output, so using `scratch` again inside it as
 * a temporary silently overwrote the result. Every ground vertex came out as
 * the shadow tone — a green pradera rendered as flat mud, with nothing in the
 * shader to blame.
 */
const scratchMix = new THREE.Color();
const ramp = {
  sand: new THREE.Color(),
  soil: new THREE.Color(),
  soilDeep: new THREE.Color(),
  grass: new THREE.Color(),
  grassDeep: new THREE.Color(),
  stone: new THREE.Color(),
  snow: new THREE.Color(),
  path: new THREE.Color(),
  pathWorn: new THREE.Color(),
};

/** How high above water the beach gives way to grass, in metres. */
const SAND_TO_GRASS = 0.09;
/** How far the deep tones fold in with height, for value structure. */
const DEPTH_SHADE = 0.45;
/**
 * The height, in metres, at which that fold is complete.
 *
 * **Sixteen, not three.** Folding the deep tones in with height is what gives
 * the land value structure — low and bright at the shore, deep and quiet on the
 * uplands. At three metres the ramp saturated almost immediately: every surface
 * above knee height on a sixty-metre island got the *maximum* deep shift, so
 * El Monte's twenty-three-metre mass was painted at full depth from base to
 * peak. Compounded with the baked AO and the darkest light band, the mountain
 * rendered as a hole in the world at midday — which is how a peak that was
 * drawing correctly, with the camera ten metres above it, kept reading as "not
 * drawn at all".
 *
 * Sixteen spreads the same ramp over the island's actual relief instead of over
 * its first metre.
 */
const DEPTH_SPAN_M = 16;
/**
 * How strongly the fine patch mask breaks the ground up.
 *
 * Without it a big field is one flat wash, and no amount of lighting fixes
 * that: the band quantise works on the DIRECTIONAL term, and every fragment of
 * a near-flat plane shares one normal, so the whole field lands in a single
 * band. The variation has to be in the pigment, which is exactly what clay is
 * (`06-ART-DIRECTION.md` §2). Baked into the colour attribute, so it is free.
 */
/**
 * **0.85, not 0.34.** The band quantise is what forces this number up: three
 * bands on a nearly flat plane means the whole field lands inside one band and
 * every bit of geometric shading is rounded away, so the only structure the
 * ground can have is the pigment. At 0.34 the mask moved a vertex by about
 * seven percent either side of its base colour, which is under the threshold
 * where anything reads at eight metres — the island rendered as one flat green
 * with the variation present in the buffer and invisible on screen.
 */
const PATCH_SHADE = 0.55;
/** Metres per cycle of the two masks: broad damp/dry, and fine patchiness. */
const MOISTURE_FREQ = 0.06;
/**
 * **0.13, not 0.38.** At 0.38 the mask's features were about two and a half
 * metres across and the ground mesh samples it at roughly one and a third —
 * two samples per feature, which is not a patch, it is aliasing. The whole
 * island averaged out to one flat green, and the pigment variation the art
 * direction asks for was in the buffer and invisible on screen. Seven-metre
 * patches survive the sampling, and are what a diorama wants anyway: broad
 * soft areas of lighter and darker grass rather than per-metre noise nobody
 * can resolve from a camera eight metres up.
 */
const PATCH_FREQ = 0.13;
/**
 * How far a region's own character pulls the ground toward bare earth.
 *
 * Without this the nine regions shared one ground palette and the island read
 * as a single field with different props scattered on it — which is exactly
 * what `20-ACCEPTANCE.md` 3A asks it not to be. El Claro is *bare warm earth*;
 * La Cumbre is above the tree line; El Jardín is lush. That is a statement
 * about the ground itself, not only about what grows on it, and `bareness` is
 * already the number that says so.
 */
const REGION_DRYNESS = 0.55;
/** Slope above which ground reads as rock rather than cover. */
const ROCK_SLOPE = 0.42;
/** Ring offsets used by the AO probe, in metres. */
const AO_RADII = [0.6, 1.6, 3.2];
/**
 * How strongly a higher neighbour darkens a vertex, and how dark it may get.
 *
 * The first pass used a gain of 1.6 with no floor, which on rolling terrain
 * pushed the average vertex to about half brightness and turned a green pradera
 * into flat brown. AO is a *contact* cue — it belongs in the hollows and at the
 * foot of the cliff, not across the whole field.
 */
const AO_GAIN = 0.85;
const AO_FLOOR = 0.62;

/**
 * Approximate AO from the heightfield itself: a vertex surrounded by ground
 * higher than it sits in a hollow and is darker. Eight directions at three
 * radii is enough to read valleys, cliff bases and the inside of a bowl.
 */
function bakedAO(hf: Heightfield, x: number, z: number, h: number): number {
  let occlusion = 0;
  for (const r of AO_RADII) {
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      const dh = sampleHeight(hf, x + Math.cos(a) * r, z + Math.sin(a) * r) - h;
      if (dh > 0) occlusion += Math.min(1, dh / r);
    }
  }
  return Math.max(AO_FLOOR, 1 - (occlusion / (AO_RADII.length * 8)) * AO_GAIN);
}

/** The colour of the ground at a point, before AO. */
function groundColor(
  target: THREE.Color,
  x: number,
  z: number,
  h: number,
  slope: number,
  moisture: number,
  /** 0..1 fine break-up, so a field is painted rather than filled. */
  patch: number,
  snowLine: number | null,
  /** 0..1, how much of a worn path this point is (`lib/world/paths.ts`). */
  path = 0,
): void {
  const above = h - WATER_LEVEL;
  if (snowLine !== null && h > snowLine) {
    target.copy(ramp.snow);
    return;
  }
  if (slope > ROCK_SLOPE) {
    target.copy(ramp.stone);
    return;
  }
  if (above < SAND_TO_GRASS) {
    // The shoreline: sand fading into whatever the bank is made of.
    target.copy(ramp.sand).lerp(ramp.grass, Math.max(0, above / SAND_TO_GRASS) * moisture);
    return;
  }
  // Dry ground reads as soil, damp ground as grass; the mask does the mixing.
  target.copy(ramp.soil).lerp(ramp.grass, moisture);
  // Fold in the deep tones with height so the land has value structure rather
  // than one flat green (`06-ART-DIRECTION.md` §2 rule 3).
  const depth = Math.min(1, above / DEPTH_SPAN_M);
  scratchMix.copy(ramp.soilDeep).lerp(ramp.grassDeep, moisture);
  target.lerp(scratchMix, Math.min(1, depth * DEPTH_SHADE));
  /**
   * **The patch is a value change, not a hue change.**
   *
   * It used to be a second lerp toward the same deep tone, and that is why the
   * island rendered as one flat green whatever the number was set to: on a
   * damp region the deep tone *is* nearly the grass tone, so lerping between
   * them moved nothing. Multiplying cannot fail that way — it is relative to
   * whatever colour this biome's palette produced — and value structure is
   * what the ground was missing (`06-ART-DIRECTION.md` §2 rule 3).
   *
   * Centred on zero, so half the ground lifts and half sinks and the island's
   * average brightness is unchanged.
   */
  target.multiplyScalar(1 + (patch - 0.5) * PATCH_SHADE);
  // Tierra colorada where feet have worn the grass away — paler in the middle.
  if (path > 0) {
    scratchMix.copy(ramp.path).lerp(ramp.pathWorn, path * (0.4 + patch * 0.6));
    target.lerp(scratchMix, path * PATH_STRENGTH);
  }
}

/** How completely a path replaces the ground it crosses. */
const PATH_STRENGTH = 0.92;
/** Load the ramps for one bake. Called before any `groundColor` call. */
export function primeRamp(palette: WorldPalette): void {
  ramp.sand.set(CLAY.sand);
  ramp.soil.set(palette.ground);
  ramp.soilDeep.set(CLAY.soilDeep);
  ramp.grass.set(palette.grass);
  ramp.grassDeep.set(CLAY.grassDeep);
  ramp.stone.set(CLAY.stone);
  ramp.snow.set(CLAY.snow);
  ramp.path.set(CLAY.path);
  ramp.pathWorn.set(CLAY.pathWorn);
}

/** The moisture mask at a point, already dried by the region it stands in. */
export function moistureAt(x: number, z: number, seed: number, layout: IslandLayout): number {
  const base = Math.min(
    1,
    Math.max(0, fbm(x * MOISTURE_FREQ + seed, z * MOISTURE_FREQ - seed, 2) * 1.25 - 0.12),
  );
  return base * (1 - REGION_CHARACTER[regionAt(x, z, layout.regions)].bareness * REGION_DRYNESS);
}

/** The fine break-up mask at a point. */
export function patchAt(x: number, z: number, seed: number): number {
  return Math.min(1, Math.max(0, fbm(x * PATCH_FREQ - seed, z * PATCH_FREQ + seed, 2)));
}

/**
 * The cliff under the island, from rock at the waterline to dark soil in the
 * undercut. `t` runs 0 at the rim to 1 at the tip. It has to read as a
 * different value group from the ground on top of it.
 */
export function cliffColor(target: THREE.Color, t: number): void {
  target.copy(ramp.stone).lerp(ramp.soilDeep, t);
}

/** The island body is rock and soil only, so it primes just those two. */
export function primeCliffRamp(): void {
  ramp.stone.set(CLAY.stone);
  ramp.soilDeep.set(CLAY.soilDeep);
}

export { groundColor, bakedAO, scratch };
