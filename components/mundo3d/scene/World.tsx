'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { TERRAIN, WIND, WOBBLE } from '@/lib/world/config';
import { seasonFor } from '@/lib/world/season';
import { localDate } from '@/lib/utils/dates';
import { bakeHeightfield, bakeResolutionFor, isPlantable, sampleHeight } from '@/lib/world/terrain';
import { paletteFor } from '@/lib/render/palette';
import { TIERS, type QualityMonitor } from '@/lib/render/quality';
import { fogRange } from '@/lib/render/materials/clay';
import { updateMood } from '@/lib/render/materials';
import type { CeremonyScript } from '@/lib/world/ceremony';
import type { WorldDailyState } from '@/lib/world/types';
import type { Placement, QualityTier, TimeOfDay, WorldLayout } from '@/lib/world/types';
import { CeremonyStage } from '../ceremony/CeremonyStage';

import { PlacementMode } from '../placement/PlacementMode';
import { usePlacementBridge } from '../placement/usePlacementBridge';
import { CharacterController, type PropCollider } from '../control/CharacterController';
import { FollowCamera } from '../control/FollowCamera';
import { Pip, type PipHandle } from '../pip/Pip';
import { ProximityDetector } from '../interaction/ProximityDetector';
import { WorldCue } from '../interaction/WorldCue';
import { resetPlayerTransform, usePlayerStore } from '../state/usePlayerStore';
import { useSessionStore } from '../state/useSessionStore';
import { useWorldStore } from '../state/useWorldStore';
import { useChores } from '../verbs/useChores';
import { useWorldVerbs } from '../verbs/useWorldVerbs';
import { useBlobShadows } from './useBlobShadows';
import { Debris } from './Debris';
import { Fauna } from './Fauna';
import { Island } from './Island';
import { Lights } from './Lights';
import { MistWall } from './MistWall';
import { PosterShot } from './PosterShot';
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
const EMPTY_OWNED: readonly string[] = [];
/** A world nobody owns has done nothing today. Stable, so nothing rebuilds. */
const EMPTY_DAILY: WorldDailyState = {
  chores_done: 0, forage_done: 0, event_done: false, event_slug: null, semillas_awarded: 0,
};

export function World({
  tier,
  timeOfDay,
  monitor,
  onTierChange,
  cameraRef,
  placements = EMPTY_PLACEMENTS,
  demoProps = false,
  onAdvanceTime,
  onCelebrated,
  previousBiome,
  onPoster,
  onOpenMojon,
  ownedCosmetics = EMPTY_OWNED,
  savedLayouts,
  userId = 'demo',
  daily = EMPTY_DAILY,
  readOnly = false,
  onPlacementsChanged,
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
  /** Opens El Mojón. The world knows where the stone is; the HUD owns the sheet. */
  onOpenMojon?: () => void;
  /** What the player owns, for the placement tray. */
  ownedCosmetics?: readonly string[];
  /** Saved arrangements from `world_bootstrap`. */
  savedLayouts?: readonly WorldLayout[];
  /** Whose island it is, for the deterministic chore draw. */
  userId?: string;
  /** Today's counters from `world_daily`, so a done chore stays done. */
  daily?: WorldDailyState;
  /** The bootstrap failed and this island is a default. Nothing may write. */
  readOnly?: boolean;
  /** The arrangement changed and wants saving. Debounced by the caller. */
  onPlacementsChanged?: (placements: Placement[]) => void;
  /** A ceremony finished playing. The route persists it. */
  onCelebrated?: (script: CeremonyScript) => void;
  /** The ground colour of the world being left, for the palette wash. */
  previousBiome?: string;
  /** Take the poster. Handed a canvas holding a frame that was just drawn. */
  onPoster?: (canvas: HTMLCanvasElement) => void;
}) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
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
  /** Stable for the session: a chore must not move when the clock ticks over. */
  const today = useMemo(() => localDate(), []);
  /** The same test the scatter plants with, so a chore lands where grass does. */
  const choreGround = useMemo(
    () => (layout ? (x: number, z: number) => isPlantable(x, z, layout.terrain) : undefined),
    [layout],
  );
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

  /**
   * Props and trees become things you walk around, not through — and things the
   * camera refuses to sit inside.
   *
   * Two sources, one list, because they answer the same two questions. Trees
   * were in neither: you walked through the trunks, and standing in La Arboleda
   * put the lens inside one, filling the frame with bark.
   */
  const propColliders = useRef<PropCollider[]>([]);
  const treeColliders = useRef<PropCollider[]>([]);
  const pushColliders = useCallback(() => {
    const all = [...propColliders.current, ...treeColliders.current];
    controller?.setColliders(all);
    cameraRef.current?.setOccluders(all);
  }, [controller, cameraRef]);
  const onColliders = useCallback(
    (colliders: PropCollider[]) => {
      propColliders.current = colliders;
      pushColliders();
    },
    [pushColliders],
  );
  const onTreeColliders = useCallback(
    (colliders: PropCollider[]) => {
      treeColliders.current = colliders;
      pushColliders();
    },
    [pushColliders],
  );

  useEffect(() => {
    if (!layout || !heightfield) return;
    const [sx, sz] = layout.spawn;
    resetPlayerTransform(sx, sampleHeight(heightfield, sx, sz), sz);
    const follow = new FollowCamera({ camera, reducedMotion });
    // The boom needs the ground so it can duck under the hillside…
    follow.setTerrain(heightfield);
    // …and whatever is standing on it. Handed over here as well as in
    // `pushColliders`, because React runs a child's effects before its parent's:
    // Vegetation and Props have already reported by the time this camera
    // exists, and their calls found `cameraRef.current` still null.
    follow.setOccluders([...propColliders.current, ...treeColliders.current]);
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

  // Movers: Pip and the walking animals. Statics: every tree, rock, structure
  // and placed prop on the island — what made the world look like it was
  // floating over its own ground before they existed.
  const shadows = useBlobShadows(pipRef);

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
   * The day's three chores, as places you walk past (`11-GAME-LOOP.md` §3.4).
   * The date comes from the same timezone helper every other daily surface in
   * the app uses, so the client and `world_daily_chore` agree on what "today"
   * is without a second definition.
   */
  useChores({
    layout,
    heightfield,
    userId,
    localDate: today,
    unlockedRegions: config.regions,
    // The server-known arrangement, not the editor's live one: a chore sits
    // at a prop that is actually down, never at one mid-drag.
    placements,
    daily,
    readOnly,
    isGround: choreGround,
  });

  // The verbs, the semillas they pay, and El Mojón, which is not a verb.
  const runtime = useWorldVerbs({
    controller, layout, heightfield, config, timeOfDay, season, readOnly,
    onAdvanceTime, onOpenMojon,
  });

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

  // ── Placement mode. The editor lives here because this is where the layout,
  //    the heightfield and the camera are; the controls live in the HUD.
  const arrange = usePlacementBridge({
    layout, config, ownedCosmetics, placements, savedLayouts, readOnly, onPlacementsChanged,
  });

  if (!layout || !heightfield) return null;
  return (
    <>
      <Lights timeOfDay={timeOfDay} liveliness={liveliness} />
      <Sky palette={palette} timeOfDay={timeOfDay} tier={tier} />
      <Island heightfield={heightfield} layout={layout} palette={palette} tier={groundTier} />
      <Water heightfield={heightfield} layout={layout} palette={palette} tier={tier} flow={mirror.riverFlow} />
      <Vegetation
        heightfield={heightfield}
        layout={layout}
        config={config}
        tier={tier}
        biome={biome}
        shadows={shadows}
        onColliders={onTreeColliders}
      />
      {arrange.editing && (
        <PlacementMode
          layout={layout}
          heightfield={heightfield}
          ghost={arrange.ghost}
          placements={arrange.placements}
          onMove={arrange.moveGhost}
          onPickUp={arrange.pickUp}
          onReady={arrange.setPlaceInFront}
        />
      )}
      <Props
        heightfield={heightfield}
        layout={layout}
        mirror={mirror}
        timeOfDay={timeOfDay}
        placements={arrange.editing ? arrange.placements : placements}
        demo={demoProps}
        onColliders={onColliders}
        shadows={shadows}
      />
      {/* La Costa: the waste channel, and the only system that starts worse. */}
      <Debris
        heightfield={heightfield}
        layout={layout}
        debrisCount={mirror.debrisCount}
        shadows={shadows}
      />
      <Fauna
        heightfield={heightfield}
        layout={layout}
        config={config}
        tier={tier}
        liveliness={liveliness}
        shadows={shadows}
      />
      {/* The tier-up ceremony's beat clock and the marker it leaves behind.
          Inside the canvas because both are made of time and geometry; the
          cards it shows are in the HUD. */}
      <CeremonyStage
        layout={layout}
        heightfield={heightfield}
        cameraRef={cameraRef}
        controller={controller}
        reducedMotion={reducedMotion}
        previousBiome={previousBiome}
        onCelebrated={onCelebrated}
      />
      {onPoster && <PosterShot onShoot={onPoster} />}
      <MistWall layout={layout} config={config} palette={palette} />
      <Pip handle={pipRef} />
      <ProximityDetector verbs={config.verbs} />
      <WorldCue />
    </>
  );
}
