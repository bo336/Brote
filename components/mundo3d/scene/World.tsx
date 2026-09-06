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
import type { Placement, PropId, QualityTier, TimeOfDay } from '@/lib/world/types';
import { BLOB_SHADOW, INTERACT, SEMILLAS } from '@/lib/world/config';
import { registerInteractable } from '../interaction/InteractableRegistry';
import { PlacementMode, makeGroundTest } from '../placement/PlacementMode';
import { usePlacementEditor } from '../placement/usePlacementEditor';
import { placeableProps } from '@/lib/world/placement';
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
import { Debris } from './Debris';
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
const EMPTY_OWNED: readonly string[] = [];
/**
 * Static shadow slots: the T3 tree and rock budgets, plus the structures and
 * placed props. Sized once at the ceiling, like every other pool, so changing
 * tier never allocates.
 */
const STATIC_SHADOWS = TIERS[3].trees + TIERS[3].rocks + 64;
/**
 * Moving shadow slots: Pip, plus the two ground-walking fauna kinds at their T3
 * cap. Fliers and fish get none — a bird at 2.4 m is most of the way through
 * the height fade already and the fish are under the water.
 */
const MOVING_SHADOWS = TIERS[3].fauna * 2 + 4;

export function World({
  tier,
  timeOfDay,
  monitor,
  onTierChange,
  cameraRef,
  placements = EMPTY_PLACEMENTS,
  demoProps = false,
  onAdvanceTime,
  onOpenMojon,
  ownedCosmetics = EMPTY_OWNED,
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
  /** The arrangement changed and wants saving. Debounced by the caller. */
  onPlacementsChanged?: (placements: Placement[]) => void;
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

  // ── Blob shadows: one instanced mesh, one draw call, every shadow in the game.
  const shadowMaterial = useMemo(() => {
    const map = getTexture('blob-shadow', buildBlobTexture);
    return getFlatMaterial({
      map, transparent: true, opacity: BLOB_SHADOW.maxOpacity, depthWrite: false, polygonOffset: -4,
    });
  }, []);
  // Movers: Pip and the walking animals — two kinds of them at the T3 cap, plus
  // slack. Statics: every tree, rock, structure and placed prop on the island,
  // which are what made the world look like it was floating over its own ground.
  const shadows = useMemo(
    () => new BlobShadowPool(shadowMaterial, MOVING_SHADOWS, STATIC_SHADOWS),
    [shadowMaterial],
  );
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
    // A touch wider than Pip is, so the shadow reads past his own silhouette —
    // from behind at -28 degrees his body covers most of what sits under him.
    const slot = shadows.attach(root, PIP_HEIGHT_M * 0.5);
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

  /**
   * El Mojón, the one place a number lives.
   *
   * It is not a verb — it is a stone you read — so it registers itself rather
   * than going through `buildVerbSpots`, and it carries no verb at all, which
   * is what makes it available from tier 1 with nothing to unlock.
   */
  useEffect(() => {
    if (!layout || !heightfield || !onOpenMojon) return;
    const anchor = layout.anchors.find((a) => a.feature === 'mojon');
    if (!anchor) return;
    return registerInteractable({
      id: 'mojon',
      position: [anchor.x, sampleHeight(heightfield, anchor.x, anchor.z), anchor.z],
      radius: INTERACT.defaultRadiusM,
      labelKey: 'accion.mojon',
      enabled: true,
      onInteract: onOpenMojon,
    });
  }, [layout, heightfield, onOpenMojon]);

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

  // ── Placement mode.
  //
  // The editor lives here because this is where the layout, the heightfield and
  // the camera are. The controls live in the HUD, outside the canvas, and the
  // two halves meet through a summary in the session store — see there for why
  // the ghost itself does not make the trip.
  const editor = usePlacementEditor({
    layout,
    tier: config.tier,
    owned: ownedCosmetics,
    initial: placements,
    isGround: useMemo(() => (layout ? makeGroundTest(layout) : undefined), [layout]),
  });
  const placeInFront = useRef<((slug: PropId) => { x: number; z: number }) | null>(null);
  const setPlacement = useSessionStore((s) => s.setPlacement);
  const setPlacementActions = useSessionStore((s) => s.setPlacementActions);
  const editing = useSessionStore((s) => s.hud) === 'placement';

  const tray = useMemo(
    () => placeableProps(ownedCosmetics, config.props),
    [ownedCosmetics, config.props],
  );

  useEffect(() => {
    setPlacement({
      hasGhost: editor.ghost !== null,
      rejected: editor.ghost?.rejection != null,
      remaining: editor.remaining,
      canUndo: editor.canUndo,
      props: tray,
    });
  }, [setPlacement, editor.ghost, editor.remaining, editor.canUndo, tray]);

  useEffect(() => {
    setPlacementActions({
      pick: (slug) => {
        const at = placeInFront.current?.(slug) ?? { x: 0, z: 0 };
        editor.begin(slug, at.x, at.z);
        editor.moveGhost(at.x, at.z);
      },
      rotate: () => editor.rotate(1),
      commit: () => editor.commit(),
      cancel: () => editor.cancel(),
      undo: () => editor.undo(),
    });
    return () => setPlacementActions(null);
  }, [setPlacementActions, editor]);

  // The arrangement is reported up whenever it settles, never mid-drag: the
  // ghost is not part of it until it is put down.
  const committed = editor.placements;
  useEffect(() => {
    if (!editing) return;
    onPlacementsChanged?.(committed);
  }, [committed, editing, onPlacementsChanged]);

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
      {editing && (
        <PlacementMode
          layout={layout}
          heightfield={heightfield}
          ghost={editor.ghost}
          onMove={editor.moveGhost}
          onReady={(fn) => {
            placeInFront.current = fn;
          }}
        />
      )}
      <Props
        heightfield={heightfield}
        layout={layout}
        mirror={mirror}
        timeOfDay={timeOfDay}
        placements={editing ? editor.placements : placements}
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
      <MistWall layout={layout} config={config} palette={palette} />
      <Pip handle={pipRef} />
      <ProximityDetector verbs={config.verbs} />
      <WorldCue />
    </>
  );
}
