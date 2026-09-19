/**
 * Where each arrival happens, how far it reaches, and where the camera watches
 * it from.
 *
 * `lib/render/reveal.ts` says *how* a feature arrives; this says *where*. It is
 * derived entirely from the layout, so an island generated from a different
 * seed frames its own mountain rather than a remembered one — the ceremony has
 * no authored camera positions anywhere in it.
 */
import { CAMERA } from '@/lib/world/config';
import { sampleHeight, type Heightfield } from '@/lib/world/terrain';
import type { IslandLayout, RegionAnchor } from '@/lib/world/layout';
import type { ArrivalId } from '@/lib/world/ceremony';
import type { RegionId } from '@/lib/world/types';
import { burstEase, smoothEase, type CameraShot, type RevealState } from './reveal';

export interface ArrivalPlan {
  reveal: RevealState;
  /** 0..1 of the beat → 0..1 of the arrival. Where the *character* of it lives. */
  ease: (t: number) => number;
  shot: CameraShot;
}

/** How high above the ground the shot looks, as a fraction of what it frames. */
const LOOK_LIFT = 0.35;
/** How far back, as a multiple of the thing's radius. */
const FRAMING = 2.1;
const MIN_DISTANCE_M = 9;
/** Radians per second. Slow enough that it never reads as a turntable. */
const ORBIT_RATE = 0.055;

function anchorOf(layout: IslandLayout, region: RegionId): RegionAnchor | null {
  return layout.regions.find((r) => r.id === region) ?? null;
}

/**
 * A shot framing a circle on the ground.
 *
 * The yaw points the lens **inward from the coast**, so the island's mass is
 * behind what is arriving instead of the empty sea — the difference between a
 * mountain rising out of a landscape and one rising out of nothing.
 */
function frame(
  x: number,
  z: number,
  y: number,
  radius: number,
  orbit: number,
): CameraShot {
  const outward = Math.atan2(x, z);
  return {
    x,
    y: y + radius * LOOK_LIFT,
    z,
    distance: Math.max(MIN_DISTANCE_M, radius * FRAMING),
    // Behind the feature looking back at the island: `yaw` is where the lens
    // sits, and `outward` points away from the island's centre.
    yaw: outward,
    pitchDeg: CAMERA.ceremonyPitchDeg,
    orbit,
  };
}

/**
 * The plan for one arrival, or null when the layout has nothing to show — a
 * caller that gets null skips beat 3 rather than holding on an empty shot.
 */
export function arrivalPlan(
  arrival: ArrivalId,
  layout: IslandLayout,
  heightfield: Heightfield,
  opts: { reducedMotion?: boolean; bare?: [number, number, number] } = {},
): ArrivalPlan | null {
  // No screen-filling motion under reduced motion, and that includes the slow
  // drift: it is small, but it is the camera moving for its own sake.
  const orbit = opts.reducedMotion ? 0 : ORBIT_RATE;
  const bare = opts.bare ?? [0.45, 0.42, 0.4];

  switch (arrival) {
    case 'flores': {
      // "A wave of blooming races outward from Pip's feet" (§5 beat 3) — so it
      // starts where the player is standing, not at the garden's centre.
      const [sx, sz] = layout.spawn;
      const sy = sampleHeight(heightfield, sx, sz);
      const reach = layout.radius * 0.85;
      return {
        reveal: { mode: 'grow', centre: [sx, sy, sz], radius: reach, amount: 0, bare },
        ease: smoothEase,
        shot: frame(sx, sz, sy, reach * 0.42, orbit),
      };
    }
    case 'arbol': {
      const a = anchorOf(layout, 'arboleda');
      if (!a) return null;
      const y = sampleHeight(heightfield, a.x, a.z);
      return {
        reveal: { mode: 'grow', centre: [a.x, y, a.z], radius: a.radius * 1.15, amount: 0, bare },
        // Three accelerating bursts, not a ramp: the sapling pushes, holds, and
        // pushes again.
        ease: burstEase,
        shot: frame(a.x, a.z, y, a.radius, orbit),
      };
    }
    case 'rio': {
      const path = layout.riverPath;
      if (!path || path.length < 2) return null;
      const head = path[0]!;
      // The front travels as a distance from the head, so the reach has to be
      // the furthest the channel ever gets from it — not the path's length.
      let reach = 0;
      for (const [px, pz] of path) {
        const d = Math.hypot(px - head[0], pz - head[1]);
        if (d > reach) reach = d;
      }
      const mid = path[Math.floor(path.length / 2)]!;
      const y = sampleHeight(heightfield, mid[0], mid[1]);
      return {
        reveal: {
          mode: 'channel',
          centre: [head[0], sampleHeight(heightfield, head[0], head[1]), head[1]],
          radius: reach * 1.05,
          amount: 0,
          bare,
        },
        ease: smoothEase,
        // Framed on the middle of the channel so both the head it breaks from
        // and the pond it fills are in shot.
        shot: frame(mid[0], mid[1], y, reach * 0.6, orbit),
      };
    }
    case 'monte':
    case 'islote': {
      const region: RegionId = arrival === 'monte' ? 'monte' : 'islote';
      const a = anchorOf(layout, region);
      if (!a) return null;
      // The base the ground is pushed back down to. Sampling the rim rather
      // than the summit is what makes it a bulge from the surrounding land.
      const rim = sampleHeight(heightfield, a.x + a.radius, a.z);
      const peak = sampleHeight(heightfield, a.x, a.z);
      return {
        reveal: { mode: 'uplift', centre: [a.x, rim, a.z], radius: a.radius, amount: 0, bare },
        ease: smoothEase,
        shot: frame(a.x, a.z, Math.max(rim, peak * 0.5), a.radius, orbit),
      };
    }
    case 'nieve': {
      const a = anchorOf(layout, 'cumbre');
      const line = layout.snowLine;
      if (!a || line === null) return null;
      const peak = sampleHeight(heightfield, a.x, a.z);
      // How far the line has to fall. If the summit is already below the snow
      // line there is nothing to watch, and the caller skips the beat.
      const fall = peak - line;
      if (fall <= 0.05) return null;
      return {
        reveal: { mode: 'snowline', centre: [a.x, line, a.z], radius: fall, amount: 0, bare },
        ease: smoothEase,
        shot: frame(a.x, a.z, line, a.radius, orbit),
      };
    }
    default:
      return null;
  }
}
