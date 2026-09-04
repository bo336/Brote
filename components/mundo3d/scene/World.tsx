'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { PIP_HEIGHT_M, TERRAIN, VERB_TIMING, WIND, WOBBLE } from '@/lib/world/config';
import { seasonFor } from '@/lib/world/season';
import { haptic } from '@/lib/utils/haptics';
import { bakeHeightfield, bakeResolutionFor, sampleHeight } from '@/lib/world/terrain';
import { paletteFor } from '@/lib/render/palette';
import { TIERS, type QualityMonitor } from '@/lib/render/quality';
import { getFlatMaterial, getTexture } from '@/lib/render/materials';
import { BlobShadowPool, buildBlobTexture } from '@/lib/render/shadows';
import { fogRange } from '@/lib/render/materials/clay';
import { updateMood } from '@/lib/render/materials';
import type { Placement, QualityTier, TimeOfDay } from '@/lib/world/types';
import { SEMILLAS } from '@/lib/world/config';
import { CharacterController, type PropCollider } from '../control/CharacterController';
import { FollowCamera } from '../control/FollowCamera';
import { Pip, type PipHandle } from '../pip/Pip';
import { ProximityDetector } from '../interaction/ProximityDetector';
import { WorldCue } from '../interaction/WorldCue';
import { resetPlayerTransform, usePlayerStore } from '../state/usePlayerStore';
import { useSessionStore } from '../state/useSessionStore';
import { useWorldStore } from '../state/useWorldStore';
import { VerbRuntime, type VerbResult } from '../verbs/runtime';
import { useVerbSpots, type VerbSpot } from '../verbs/register';
import { Fauna } from './Fauna';
import { Island } from './Island';
import { Lights } from './Lights';
import { MistWall } from './MistWall';
import { Props } from './Props';
import { Sky } from './Sky';
import { Vegetation } from './Vegetation';
import { Water } from './Water';

/**
 * Everything inside the canvas, and the one `useFrame` that drives it.
 *
 * The order here is the load order from `07-RENDER-ARCHITECTURE.md` §3: the
 * heightfield and the ground first, so there is a first frame; then Pip and the
 * controller, so there is input; then vegetation and props.
 *
 * **The heightfield is baked once, at one fixed resolution**, and never
 * re-baked. The quality tier changes what the ground *looks* like, never where
 * it *is* — otherwise a promotion would move the floor under Pip mid-step.
 */
const EMPTY_PLACEMENTS: readonly Placement[] = [];

export function World({
  tier,
  timeOfDay,
  monitor,
  onTierChange,
  cameraRef,
  placements = EMPTY_PLACEMENTS,
  demoProps = false,
  onAdvanceTime,
}: {
  tier: QualityTier;
  timeOfDay: TimeOfDay;
  monitor: QualityMonitor;
  onTierChange: (tier: QualityTier) => void;
  cameraRef: React.MutableRefObject<FollowCamera | null>;
  placements?: readonly Placement[];
  demoProps?: boolean;
  /** `descansar` hands time forward; the route owns which preset comes next. */
  onAdvanceTime?: () => void;
}) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const scene = useThree((s) => s.scene);
  const invalidate = useThree((s) => s.invalidate);

  const config = useWorldStore((s) => s.config);
  const layout = useWorldStore((s) => s.layout);
  const biome = useWorldStore((s) => s.biome);
  const liveliness = useWorldStore((s) => s.liveliness);
  const mirror = useWorldStore((s) => s.mirror);

  const reducedMotion = useSessionStore((s) => s.reducedMotion);
  const setReady = useSessionStore((s) => s.setReady);
  const setPlayerState = usePlayerStore((s) => s.setState);

  const palette = useMemo(() => paletteFor(biome, timeOfDay), [biome, timeOfDay]);
  const pipRef = useRef<PipHandle>({ root: null, rig: null });
  /**
   * The ground is built at the tier the session started on and never rebuilt.
   * The tier table lists a terrain grid per tier, but the stronger rule wins:
   * **a tier change never re-creates geometry** (`07-RENDER-ARCHITECTURE.md`
   * §4.3), and re-tessellating the ground under a walking character would move
   * the floor mid-step.
   */
  const groundTier = useRef(tier).current;
  const lastStateRef = useRef(usePlayerStore.getState().state);
  const season = useMemo(() => seasonFor(new Date()), []);
  const addSemillas = usePlayerStore((s) => s.addSemillas);
  const setVerb = usePlayerStore((s) => s.setVerb);
  const setLockedHint = useSessionStore((s) => s.setLockedHint);

  // ── The heightfield, baked once, behind the loading state.
  const heightfield = useMemo(
    () => (layout ? bakeHeightfield(layout.terrain, bakeResolutionFor(layout.terrain)) : null),
    [layout],
  );

  // ── The controller and the camera. Both are plain classes in refs: neither is
  //    React state, and neither may ever be (`07-RENDER-ARCHITECTURE.md` §7).
  const controller = useMemo(
    () => (heightfield && layout ? new CharacterController({ heightfield, layout, config }) : null),
    [heightfield, layout, config],
  );

  /** Props become things you walk around, not things you walk through. */
  const onColliders = useCallback(
    (colliders: PropCollider[]) => controller?.setColliders(colliders),
    [controller],
  );

  useEffect(() => {
    if (!layout || !heightfield) return;
    const [sx, sz] = layout.spawn;
    resetPlayerTransform(sx, sampleHeight(heightfield, sx, sz), sz);
    const follow = new FollowCamera({ camera, reducedMotion });
    // The boom needs the ground so it can duck under the hillside.
    follow.setTerrain(heightfield);
    follow.snap();
    cameraRef.current = follow;
    setReady(true);
    return () => {
      cameraRef.current = null;
      setReady(false);
    };
  }, [layout, heightfield, camera, reducedMotion, cameraRef, setReady]);

  useEffect(() => {
    cameraRef.current?.setReducedMotion(reducedMotion);
  }, [reducedMotion, cameraRef]);

  // ── Blob shadows: one instanced mesh, one draw call, every shadow in the game.
  const shadowMaterial = useMemo(() => {
    const map = getTexture('blob-shadow', buildBlobTexture);
    return getFlatMaterial({ map, transparent: true, opacity: 0.32, depthWrite: false });
  }, []);
  const shadows = useMemo(() => new BlobShadowPool(shadowMaterial, TIERS[3].fauna + 4), [shadowMaterial]);
  useEffect(() => {
    scene.add(shadows.mesh);
    return () => {
      scene.remove(shadows.mesh);
      shadows.dispose();
    };
  }, [scene, shadows]);
  useEffect(() => {
    const root = pipRef.current.root;
    if (!root) return;
    const slot = shadows.attach(root, PIP_HEIGHT_M * 0.42);
    return () => shadows.detach(slot);
  }, [shadows]);

  // ── The mood: one object, ~11 uniforms, every clay material in the scene.
  useEffect(() => {
    // `mirror.fogFar` is already in metres (45 at zero impact, 110 at full).
    // Clamp it to what the tier is willing to draw, and let the near plane fall
    // out of that — an earlier version divided by the T3 distance and fogged
    // the whole island out at 24 m.
    const { near, far } = fogRange(Math.min(TIERS[tier].renderDistanceM, mirror.fogFar));
    updateMood({
      rimColor: palette.light.rimColor,
      fogColor: palette.fog,
      fogNear: near,
      fogFar: Math.max(near + 1, far),
      fogDensity: mirror.fogDensity,
      time: 0,
      // T0 turns the handmade wobble and the wind off entirely, by amplitude
      // rather than by rebuilding anything (`06-ART-DIRECTION.md` §5).
      wobbleAmp: TIERS[tier].wobble ? WOBBLE.amp : 0,
      windAmp: TIERS[tier].wind ? WIND.amp : 0,
    });
  }, [palette, tier, mirror]);

  /**
   * **Explicit invalidation on any state change** (`07-RENDER-ARCHITECTURE.md`
   * §5). Under `frameloop="demand"` React can finish building the scene after
   * the loop has already gone idle, and the result is a correctly-built world
   * that is never drawn — a blank screen with a working HUD. Anything that
   * changes what a frame would look like has to ask for one.
   */
  useEffect(() => {
    invalidate();
  }, [invalidate, layout, heightfield, palette, tier, timeOfDay, config, mirror]);

  /**
   * The verb runtime. Completing a verb pays semillas and **never XP** — the
   * one-way valve is the product's premise, and `no-xp.test.ts` greps this whole
   * tree to keep it that way (`11-GAME-LOOP.md` §1).
   */
  const onVerbFinish = useCallback(
    (result: VerbResult) => {
      setVerb(null);
      controller?.setLocked(false);
      if (!result.success) return;
      // Sound, motion and haptic together: one alone reads as a bug (`10` §6).
      haptic(result.verb === 'fish' ? 'success' : 'medium');
      if (result.verb === 'forage') addSemillas(SEMILLAS.forageMin);
      if (result.verb === 'log') addSemillas(SEMILLAS.censusFirst);
    },
    [controller, setVerb, addSemillas],
  );

  const runtime = useMemo(() => new VerbRuntime(onVerbFinish), [onVerbFinish]);

  /**
   * Using a verb. `sail` and `rest` change how movement works rather than
   * pausing it, so they go to the controller; everything else is a timed action.
   */
  const onUseVerb = useCallback(
    (spot: VerbSpot) => {
      if (!controller) return;
      setVerb(spot.verb);
      if (spot.verb === 'sail') {
        controller.boardBoat();
        return;
      }
      if (spot.verb === 'rest') {
        // Resting advances the time of day one preset — the only control over
        // time the player has (`10-CONTROLS-AND-CAMERA.md` §3).
        controller.setLocked(true);
        window.setTimeout(() => {
          controller.setLocked(false);
          setVerb(null);
          onAdvanceTime?.();
        }, VERB_TIMING.restAdvanceS * 1000);
        return;
      }
      controller.setLocked(true);
      runtime.begin(spot.verb, spot.id);
    },
    [controller, runtime, setVerb, onAdvanceTime],
  );

  useVerbSpots(layout, heightfield, config, timeOfDay, season, onUseVerb);

  useFrame((state, delta) => {
    // Clamp: a tab that was backgrounded must not teleport Pip across the island.
    const dt = Math.min(delta, TERRAIN.frameClampS);
    const follow = cameraRef.current;
    if (!controller || !follow || !heightfield) return;

    const next = controller.update(dt, follow.getYaw());
    // Only touch the store when the state actually changed: a per-frame write
    // would re-render the tree sixty times a second for nothing.
    if (next !== lastStateRef.current) {
      lastStateRef.current = next;
      setPlayerState(next);
    }
    follow.update(dt);
    shadows.update(heightfield);
    // A verb in progress is cancelled by walking away from what it was for.
    runtime.cancelIfTargetLost(useSessionStore.getState().active?.id ?? null);
    runtime.update(dt);

    // A soft barrier owes the player a sentence. The store setter is
    // identity-comparing, so repeating the same hint costs no re-render.
    const blocked = controller.takeBlocked();
    if (blocked) setLockedHint(blocked);

    const promoted = monitor.sample(delta * 1000, state.clock.elapsedTime * 1000);
    if (promoted !== null) onTierChange(promoted);
  });

  if (!layout || !heightfield) return null;
  return (
    <>
      <Lights timeOfDay={timeOfDay} liveliness={liveliness} />
      <Sky palette={palette} timeOfDay={timeOfDay} tier={tier} />
      <Island heightfield={heightfield} layout={layout} palette={palette} tier={groundTier} />
      <Water heightfield={heightfield} layout={layout} palette={palette} tier={tier} flow={mirror.riverFlow} />
      <Vegetation heightfield={heightfield} layout={layout} config={config} tier={tier} biome={biome} />
      <Props
        heightfield={heightfield}
        layout={layout}
        mirror={mirror}
        timeOfDay={timeOfDay}
        placements={placements}
        demo={demoProps}
        onColliders={onColliders}
      />
      <Fauna heightfield={heightfield} layout={layout} config={config} tier={tier} liveliness={liveliness} />
      <MistWall layout={layout} config={config} palette={palette} />
      <Pip handle={pipRef} />
      <ProximityDetector verbs={config.verbs} />
      <WorldCue />
    </>
  );
}
