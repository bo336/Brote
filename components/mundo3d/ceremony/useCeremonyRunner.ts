'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { beatAt, ceremonyFor, type BeatId, type CeremonyScript } from '@/lib/world/ceremony';
import { arrivalPlan, type ArrivalPlan } from '@/lib/render/arrivals';
import { REVEAL_OFF } from '@/lib/render/reveal';
import { updateReveal } from '@/lib/render/materials';
import { CLAY } from '@/lib/render/palette';
import { SHARE_CARD, TERRAIN } from '@/lib/world/config';
import { sampleHeight, type Heightfield } from '@/lib/world/terrain';
import type { IslandLayout } from '@/lib/world/layout';
import type { CameraShot } from '@/lib/render/reveal';
import type { FollowCamera } from '../control/FollowCamera';
import type { CharacterController } from '../control/CharacterController';
import { useSessionStore } from '../state/useSessionStore';
import { playerTransform } from '../state/usePlayerStore';

/**
 * The beat clock.
 *
 * Driven by `useFrame` rather than by timers, for two reasons that both matter.
 * A `setTimeout` keeps running while the tab is backgrounded, so a player who
 * switches away comes back to a ceremony that happened without them; and the
 * renderer runs on `frameloop="demand"`, where a timer would fire beats nobody
 * ever sees drawn. Frame time is the only clock this world actually has.
 *
 * The store learns about **beats**, which change six times in forty seconds.
 * Elapsed time never leaves this hook.
 */
export interface CeremonyRunner {
  /** The script in play, for the overlay that renders its cards. */
  script: CeremonyScript | null;
  /** Where the new verb is first usable, for the world-space marker. */
  verbSpot: [number, number, number] | null;
}

/**
 * How far short of the end the clock parks. Small enough to be inside the last
 * beat, large enough that no float rounding can push it past.
 */
const HOLD_EPSILON = 0.001;

/** The un-snowed rock, for the snow line to retreat across. */
const BARE = new THREE.Color(CLAY.stone);

/** Where beat 5 pushes to, once the verb has a place (§5 beat 5). */
function verbShot(x: number, y: number, z: number, orbit: number): CameraShot {
  return { x, y: y + 1.1, z, distance: 7.5, yaw: Math.atan2(x, z), pitchDeg: 10, orbit };
}

export function useCeremonyRunner({
  layout,
  heightfield,
  cameraRef,
  controller,
  reducedMotion,
  onCelebrated,
}: {
  layout: IslandLayout | null;
  heightfield: Heightfield | null;
  cameraRef: React.MutableRefObject<FollowCamera | null>;
  controller: CharacterController | null;
  reducedMotion: boolean;
  /** The tier finished playing. Persisting that is the caller's business. */
  onCelebrated?: (tier: number) => void;
}): CeremonyRunner {
  const gl = useThree((s) => s.gl);
  const tier = useSessionStore((s) => s.ceremony.tier);
  const skipped = useSessionStore((s) => s.ceremony.skipped);
  const setCeremonyBeat = useSessionStore((s) => s.setCeremonyBeat);
  const setCeremonyBefore = useSessionStore((s) => s.setCeremonyBefore);

  const script = useMemo(
    () => (tier === null ? null : ceremonyFor(tier, { reducedMotion })),
    [tier, reducedMotion],
  );

  const plan = useMemo<ArrivalPlan | null>(() => {
    if (!script?.arrival || !layout || !heightfield) return null;
    return arrivalPlan(script.arrival, layout, heightfield, {
      reducedMotion,
      bare: [BARE.r, BARE.g, BARE.b],
    });
  }, [script, layout, heightfield, reducedMotion]);

  /**
   * Where the new verb is first usable. Beat 5 pushes the camera there and
   * leaves a marker behind until first use.
   *
   * The region's own anchor, not the verb-spot registry: the spots are built by
   * a hook that runs alongside this one, and a ceremony that reads a list
   * another effect has not filled in yet would frame the origin on the first
   * tier-up and the right place on every one after. The anchor is where the
   * spots are placed around anyway.
   */
  const verbSpot = useMemo<[number, number, number] | null>(() => {
    if (!script || script.verbs.length === 0 || !layout || !heightfield) return null;
    const anchor = layout.regions.find((r) => r.id === script.region);
    if (!anchor) return null;
    return [anchor.x, sampleHeight(heightfield, anchor.x, anchor.z), anchor.z];
  }, [script, layout, heightfield]);

  const elapsed = useRef(0);
  const lastBeat = useRef<BeatId | null>(null);
  /** The arrival has been handed back. Guards a per-frame no-op uniform write. */
  const settled = useRef(false);

  // A ceremony starts from zero with the world in its "before" state, so beat 1
  // frames something that has not happened yet.
  useEffect(() => {
    elapsed.current = 0;
    lastBeat.current = null;
    settled.current = false;
    if (!script) {
      updateReveal(REVEAL_OFF);
      return;
    }
    if (plan) updateReveal({ ...plan.reveal, amount: 0 });
    controller?.setLocked(true);
    // Captured now: by the time this cleanup runs the world may already have
    // torn the rig down, and releasing a camera that no longer exists is not
    // the same as releasing the one this ceremony took.
    const follow = cameraRef.current;
    return () => {
      // Whatever happened — finished, skipped, or the player left `/mundo`
      // mid-ceremony — the world is put back the way tomorrow expects it and
      // the player gets their input returned.
      updateReveal(REVEAL_OFF);
      controller?.setLocked(false);
      follow?.release();
    };
  }, [script, plan, controller, cameraRef]);

  /**
   * The before-shot.
   *
   * Read from the live canvas rather than from a second offscreen render: there
   * is no `preserveDrawingBuffer`, so what sits in the buffer here is the frame
   * that was just drawn — which is the framed shot beat 1 has been holding
   * still on for two seconds. One frame stale, and identical.
   */
  const capture = useCallback(() => {
    try {
      setCeremonyBefore(gl.domElement.toDataURL('image/jpeg', SHARE_CARD.captureQuality));
    } catch {
      // A tainted or zero-sized canvas. Not worth failing a ceremony over; the
      // card falls back to the "after" alone.
      setCeremonyBefore(null);
    }
  }, [gl, setCeremonyBefore]);

  useFrame((_, delta) => {
    if (!script) return;
    const follow = cameraRef.current;

    /**
      * The clock stops on the share card and waits.
      *
      * §5 budgets beat 6 at "~2 s", which is the time it takes to *compose* the
      * card — not a window to act in. Tearing the only artefact the ceremony
      * produces off the screen two seconds after offering it, with "one tap to
      * share" as the requirement, would make the tap impossible; and a skip,
      * which is supposed to keep the card, would show it for no time at all.
      * So the last beat holds until the player dismisses it, and **that** tap is
      * what returns control (beat 7).
      */
    const hold = script.totalSeconds - HOLD_EPSILON;
    // Skipping jumps straight to it. Nothing is lost: beat 2 already took the
    // before-shot and the overlay composes the after from the live canvas.
    if (skipped) elapsed.current = hold;
    else elapsed.current = Math.min(hold, elapsed.current + Math.min(delta, TERRAIN.frameClampS));

    const at = beatAt(script, elapsed.current);
    if (at.beat.id !== lastBeat.current) {
      lastBeat.current = at.beat.id;
      setCeremonyBeat(at.beat.id);
      switch (at.beat.id) {
        case 'camera':
          // Reduced motion cuts to the shot rather than lifting into it.
          if (follow && plan) follow.takeOver(plan.shot, reducedMotion);
          break;
        case 'before':
          capture();
          break;
        case 'verb':
          if (follow && verbSpot) {
            const drift = reducedMotion ? 0 : 0.03;
            follow.takeOver(verbShot(verbSpot[0], verbSpot[1], verbSpot[2], drift), reducedMotion);
          }
          break;
        case 'share':
          // Shown is shown. Marking it here rather than on dismissal means a
          // player who closes the tab on the card still never sees it twice.
          onCelebrated?.(script.tier);
          // Control comes back with the card, so the world behind it is alive
          // again while they decide whether to share.
          follow?.release();
          controller?.setLocked(false);
          playerTransform.speed = 0;
          break;
        default:
          break;
      }
    }

    if (at.beat.id === 'arrival' && plan) {
      updateReveal({ ...plan.reveal, amount: plan.ease(at.progress) });
      settled.current = false;
    } else if (!settled.current && at.beat.id !== 'camera' && at.beat.id !== 'before') {
      // Past the arrival the world is its finished self, and the uniforms are
      // not touched again until the next ceremony.
      updateReveal(REVEAL_OFF);
      settled.current = true;
    }

  });

  return { script, verbSpot };
}
