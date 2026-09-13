'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { CAMERA, JOYSTICK, LOOK } from '@/lib/world/config';
import { isNight } from '@/lib/utils/dates';
import { detailModeToTier, prefersReducedMotion, useSettings } from '@/stores/settings';
import type { CeremonyScript } from '@/lib/world/ceremony';
import { paletteForWorld } from '@/lib/render/palette';
import { createQualityMonitor, initialTier, TIERS } from '@/lib/render/quality';
import type { JournalEntry, QualityTier, TimeOfDay, WorldPayload } from '@/lib/world/types';
import type { FollowCamera } from './control/FollowCamera';
import { useKeyboardInput } from './control/useInput';
import { useCameraDrag } from './control/useCameraDrag';
import { HudLayer } from './hud/HudLayer';
import { WorldStates, useWorldState } from './hud/WorldStates';
import { usePlacementSave } from './placement/usePlacementSave';
import { useCelebrate } from './ceremony/useCelebrate';
import { useSnapshot } from './poster/useSnapshot';
import { installAudioLifecycle } from './audio/engine';
import { useSessionStore } from './state/useSessionStore';
import { useHydrateWorld } from './state/useHydrateWorld';
import { useFrameloop } from './state/useFrameloop';
import { useWorldTeardown } from './state/useWorldTeardown';
import { usePlayerStore } from './state/usePlayerStore';
import { World } from './scene/World';
import { PostFx } from './scene/PostFx';
import type { VisitSession } from './visit/useVisit';

/** A world nobody owns has logged nothing. Stable, so the sheet never rebuilds. */
const EMPTY_JOURNAL: JournalEntry[] = [];

/**
 * How much bigger "texto grande" is. OURS: 1.25 is the smallest step that is
 * unmistakably different, and small enough that a caption still fits one line
 * on a narrow phone.
 */
const LARGE_TEXT_SCALE = 1.25;

/** The four presets, in the order resting walks through them. */
const TIME_ORDER: TimeOfDay[] = ['amanecer', 'dia', 'atardecer', 'noche'];

/**
 * The perf harness, in its own chunk.
 *
 * This used to hang off a `process.env.NODE_ENV` branch so the bundler folded
 * it away entirely. That was the wrong lever: it meant the overlay did not
 * exist in a production build, which is the only build worth measuring and the
 * only one the preview route is reviewed in — every measurement run needed the
 * flag temporarily flipped and the build redone, and the numbers came from a
 * binary nobody would ship.
 *
 * `dynamic()` already gives what the branch was for: the chunk is a separate
 * file and is fetched only when something renders it. Nothing renders it unless
 * `perf` is on, and `perf` comes from a URL parameter, so a player never
 * downloads a byte of it.
 */
const PerfProbe = dynamic(() => import('./dev/PerfOverlay').then((m) => m.PerfProbe), { ssr: false });

/**
 * AgX tone mapping and soft shadow maps (`23-ART-DIRECTION-V2.md`): a sun bright
 * enough to model forms needs a curve that rolls its highlights off instead of
 * clipping them, and AgX keeps the palette's hues where ACES bends them.
 */
function Renderer({ onReady }: { onReady: (gl: THREE.WebGLRenderer) => void }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    gl.toneMapping = THREE.AgXToneMapping;
    gl.toneMappingExposure = LOOK.exposure;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    onReady(gl);
  }, [gl, onReady]);
  return null;
}

export interface MundoGameProps {
  /** `?perf=1` — the measurement harness (`07-RENDER-ARCHITECTURE.md` §6). */
  perf?: boolean;
  /** `?mundoTier=0..3` forces a quality tier, for testing. */
  forcedTier?: number | null;
  /** From `mundo_state`. The world reads this and never writes it. */
  userId?: string;
  tier?: number;
  worldIndex?: number;
  liveliness?: number;
  /**
   * Override the derived time of day. `rest` advances it, the ceremony sets it,
   * and the art pass screenshots each of the four presets through it.
   */
  timeOfDay?: TimeOfDay;
  /** Lay one of each placeable prop out around the spawn, for review. */
  demoProps?: boolean;
  /**
   * Hold the render loop open even when nothing is happening.
   *
   * The world idles into `frameloop="demand"`, which is right: continuous
   * rendering when nothing moves is the cheapest waste there is. But the
   * preview route's tour moves Pip by **writing `playerTransform` directly**,
   * and a direct write invalidates nothing — so the camera never followed, and
   * every screenshot of a region was a photograph of the spawn. That cost this
   * build a week of contradictory frames and two wrong diagnoses of a mountain
   * that was never broken.
   *
   * A player never needs this: walking, dragging and every state change the
   * world cares about already wake the loop. Only a synthetic teleport does.
   */
  alwaysRender?: boolean;
  /**
   * Everything the server sent, in one `world_bootstrap()` trip.
   *
   * Optional because the preview route drives the world from URL parameters
   * instead. When it is here it wins: the tier, the seed, the impact and the
   * placements are the player's real ones, and the loose props above are only
   * the fallback for a world nobody owns.
   */
  payload?: WorldPayload;
  /**
   * The bootstrap failed and `payload` is a filled-in default rather than this
   * player's island.
   *
   * It gates every write. An empty `placements` list from a failed read looks
   * exactly like an island somebody cleared on purpose, and autosaving it would
   * delete the real one. When this is true the world is a picture: walkable,
   * and unable to overwrite anything.
   */
  readOnly?: boolean;
  /**
   * The island belongs to somebody else (`18-DECISIONS.md` D8).
   *
   * It forces `readOnly` rather than trusting the caller to pass both: every
   * write in the world hangs off that one flag, and a visit that forgot it
   * would autosave a stranger's arrangement onto the visitor's own row.
   */
  visit?: VisitSession;
}

/**
 * The one `<Canvas>` in the entire app.
 *
 * Low-end Android caps WebGL contexts and silently drops the older one, so there
 * is exactly one renderer and it is mounted only on `/mundo`
 * (`07-RENDER-ARCHITECTURE.md` §1). Everything else — the feed, both profiles,
 * onboarding — shows `<MundoPoster/>`, which is one `<img>`.
 *
 * This file is composition and lifecycle only: the canvas, the quality monitor,
 * the frameloop, the HUD and the disposal. The scene and its frame loop live in
 * `scene/World.tsx`.
 */
export default function MundoGame({
  perf = false,
  forcedTier = null,
  userId = 'demo',
  tier: worldTier = 1,
  worldIndex = 1,
  liveliness = 0.5,
  timeOfDay: timeOfDayOverride,
  demoProps = false,
  alwaysRender = false,
  payload,
  readOnly = false,
  visit,
}: MundoGameProps) {
  const frozen = readOnly || visit !== undefined;
  const detailMode = useSettings((s) => s.detailMode);
  const largeText = useSettings((s) => s.largeText);
  const reduceMotionSetting = useSettings((s) => s.reduceMotion);
  const autoCamera = useSettings((s) => s.autoCamera);
  const sensitivity = useSettings((s) => s.cameraSensitivityX);

  const setTierInStore = useSessionStore((s) => s.setTier);
  const setReducedMotion = useSessionStore((s) => s.setReducedMotion);
  const hud = useSessionStore((s) => s.hud);
  const setHud = useSessionStore((s) => s.setHud);
  const ceremonyRequest = useSessionStore((s) => s.ceremony.request);

  const [tier, setTier] = useState<QualityTier>(1);
  const [derivedTimeOfDay, setDerivedTimeOfDay] = useState<TimeOfDay>(() => (isNight() ? 'noche' : 'dia'));
  const timeOfDay = timeOfDayOverride ?? derivedTimeOfDay;

  /**
   * `descansar` advances the time of day one preset — **the only control over
   * time the player has** (`10-CONTROLS-AND-CAMERA.md` §3).
   */
  const advanceTime = useCallback(() => {
    setDerivedTimeOfDay((current) => {
      const i = TIME_ORDER.indexOf(current);
      return TIME_ORDER[(i + 1) % TIME_ORDER.length]!;
    });
  }, []);
  /**
   * The autosave. Optimistic, debounced, and it keeps a failed write to retry —
   * `readOnly` is what stops it running at all when the bootstrap failed and
   * the arrangement on screen is a default rather than theirs.
   */
  const { save, state: saveState } = usePlacementSave({
    userId: payload?.userId ?? userId,
    readOnly: frozen || !payload,
  });

  /**
   * A tier reached but not yet celebrated plays **the next time the player
   * enters `/mundo`** (`08-WORLD-AND-PROGRESSION.md` §5), which is here. The
   * queue is drained one at a time, oldest first, and `world_mark_celebrated`
   * is what stops it playing twice.
   */
  const celebrate = useCelebrate({ readOnly: frozen || !payload });
  /**
   * El póster. Until this existed, every card in the app showed a generated
   * SVG of an island nobody owns; now the feed, both profiles and onboarding
   * show the world this player actually last stood in.
   */
  const poster = useSnapshot({
    userId: payload?.userId ?? userId,
    readOnly: frozen || !payload,
  });
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<FollowCamera | null>(null);
  /** The live canvas, for the share card. See `share/ShareCard.ts`. */
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const reducedMotion = prefersReducedMotion(reduceMotionSetting);
  const palette = useMemo(() => paletteForWorld(worldIndex, timeOfDay), [worldIndex, timeOfDay]);

  // Everything the payload does to the stores: the world, Pip's look, the
  // balance, and the queue of ceremonies owed.
  const world = useHydrateWorld({
    payload, userId, tier: worldTier, worldIndex, liveliness,
  });

  // ── Quality. **Start at T1**; static hints may only lower it, and a manual
  //    setting disables the monitor entirely (`07-RENDER-ARCHITECTURE.md` §4).
  const manual = detailModeToTier(detailMode);
  const monitor = useMemo(() => createQualityMonitor({ start: 1, manual }), [manual]);

  useEffect(() => {
    const start = initialTier({
      hardwareConcurrency: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : undefined,
      coarsePointer: typeof window !== 'undefined' && (window.matchMedia?.('(pointer: coarse)')?.matches ?? false),
      prefersReducedMotion: reducedMotion,
      detailMode,
      forced: forcedTier,
    });
    monitor.reset(start);
    setTier(start);
    setTierInStore(start);
  }, [detailMode, forcedTier, reducedMotion, monitor, setTierInStore]);

  useEffect(() => setReducedMotion(reducedMotion), [reducedMotion, setReducedMotion]);

  /**
   * The audio lifecycle: one context, the iOS unlock, and `visibilitychange`.
   *
   * Installed even though no sound ships yet (`public/mundo/CREDITS.md`), because
   * the parts that are hard to get right are these three and not the files —
   * and a second `AudioContext` created later, once assets exist, would be
   * silence on iOS for the rest of the session with nothing to point at.
   */
  useEffect(() => installAudioLifecycle(), []);

  /**
   * The connection and the drawing context. One restore attempt on a lost
   * context before falling back — a context that dies twice is a device out of
   * memory, and retrying forever is a battery drain with a black screen.
   */
  const worldState = useWorldState(canvasRef.current);
  useEffect(() => cameraRef.current?.setAutoRecentre(autoCamera), [autoCamera]);

  const onTierChange = useCallback(
    (next: QualityTier) => {
      setTier(next);
      setTierInStore(next);
    },
    [setTierInStore],
  );

  // Sleeps when idle, wakes on any input, and never sleeps while input is held.
  const { frameloop, wake } = useFrameloop();

  // E uses what is in front of Pip. It used to be wired to `wake` and nothing else.
  const interactNow = useCallback(() => {
    wake();
    useSessionStore.getState().interact?.();
  }, [wake]);
  useKeyboardInput({ onInteract: interactNow, onActivity: wake });
  const drag = useCameraDrag({ cameraRef, sensitivity, onInput: wake });

  useWorldTeardown(useCallback(() => rendererRef.current, []));

  const params = TIERS[tier];
  const pitch = (CAMERA.pitchDeg * Math.PI) / 180;

  return (
    // Fixed, not `height: 100vh`: `vh` includes the collapsing mobile bottom bar
    // and causes layout jumps (`16-UI-AUDIO-A11Y.md` §6).
    <div
      className="fixed inset-0 z-[70] touch-none select-none overscroll-none bg-brote-ink"
      style={{
        paddingBottom: `env(safe-area-inset-bottom, ${JOYSTICK.safeAreaMinPx}px)`,
        /**
         * The text-size setting (`16-UI-AUDIO-A11Y.md` §3), applied once at the
         * root so every in-world caption and sheet scales together. A per-
         * component override would be six places to forget.
         */
        fontSize: largeText ? `${LARGE_TEXT_SCALE * 100}%` : undefined,
      }}
      onPointerDown={(e) => {
        wake();
        drag.onPointerDown(e);
      }}
      onPointerMove={drag.onPointerMove}
      onPointerUp={drag.onPointerUp}
      onPointerCancel={drag.onPointerUp}
      onWheel={drag.onWheel}
    >
      {/* A measurement run holds the loop open: `demand` gaps are not frames,
          the probe rejects them, and a harness that samples nothing measures
          nothing (`07-RENDER-ARCHITECTURE.md` §6). */}
      <Canvas
        frameloop={ceremonyRequest !== null || perf || alwaysRender
          ? 'always'
          : hud !== 'play' ? 'demand' : frameloop}
        dpr={params.dprCap}
        shadows
        camera={{
          fov: CAMERA.fov,
          near: 0.1,
          far: 600,
          position: [0, -Math.sin(pitch) * CAMERA.distanceM, Math.cos(pitch) * CAMERA.distanceM],
        }}
        gl={{
          antialias: params.antialias,
          alpha: false,
          powerPreference: 'high-performance',
          // No `preserveDrawingBuffer`: it costs memory and forces a copy every
          // frame. The poster capture renders one extra frame on demand instead.
          preserveDrawingBuffer: false,
        }}
      >
        <Renderer
          onReady={(gl) => {
            rendererRef.current = gl;
            canvasRef.current = gl.domElement;
          }}
        />
        <color attach="background" args={[palette.skyHorizon]} />
        <World
          tier={tier}
          timeOfDay={timeOfDay}
          monitor={monitor}
          onTierChange={onTierChange}
          cameraRef={cameraRef}
          demoProps={demoProps}
          placements={payload?.placements}
          onAdvanceTime={advanceTime}
          onOpenMojon={() => setHud('mojon')}
          ownedCosmetics={payload?.ownedCosmetics}
          savedLayouts={payload?.layouts}
          userId={world.userId}
          daily={payload?.dailyState}
          createdAt={payload?.createdAt}
          onboardedAt={payload?.onboardedAt}
          projectMarkers={payload?.projectMarkers}
          dueReviews={payload?.dueReviews}
          previousBiome={world.previousBiome}
          readOnly={frozen || !payload}
          visit={visit}
          onPlacementsChanged={save}
          onCelebrated={celebrate}
          onPoster={poster}
        />
        <PostFx tier={tier} />
        {perf && PerfProbe && <PerfProbe tier={tier} />}
      </Canvas>

      {/* Offline, a lost drawing context, or a browser that cannot draw at
          all. None of the three is a dead end. */}
      <WorldStates state={worldState} />
      <HudLayer
        canvasRef={canvasRef}
        impact={world.impact}
        tier={world.tier}
        worldIndex={world.worldIndex}
        biomeName={world.biomeName}
        worldGrowth={payload?.worldGrowth ?? 0}
        worldGoal={payload?.worldGoal ?? 0}
        collectiveWaterL={payload?.collectiveWaterL ?? 0}
        saveState={saveState}
        readOnly={frozen || !payload}
        visit={visit}
        userId={world.userId}
        journal={payload?.journal ?? EMPTY_JOURNAL}
        perf={perf}
      />
    </div>
  );
}
