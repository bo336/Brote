'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { CAMERA, JOYSTICK, RENDER_LOOP } from '@/lib/world/config';
import { isNight } from '@/lib/utils/dates';
import { detailModeToTier, prefersReducedMotion, useSettings } from '@/stores/settings';
import type { CeremonyScript } from '@/lib/world/ceremony';
import { paletteForWorld } from '@/lib/render/palette';
import { createQualityMonitor, initialTier, TIERS } from '@/lib/render/quality';
import { disposeAll as disposeMaterials } from '@/lib/render/materials';
import { disposeAll as disposeGeometry } from '@/lib/render/geometry';
import type { JournalEntry, QualityTier, TimeOfDay, WorldPayload } from '@/lib/world/types';
import type { FollowCamera } from './control/FollowCamera';
import { resetInput, useKeyboardInput } from './control/useInput';
import { useCameraDrag } from './control/useCameraDrag';
import { HudLayer } from './hud/HudLayer';
import { usePlacementSave } from './placement/usePlacementSave';
import { useCelebrate } from './ceremony/useCelebrate';
import { useSnapshot } from './poster/useSnapshot';
import { clearInteractables } from './interaction/InteractableRegistry';
import { useSessionStore } from './state/useSessionStore';
import { useHydrateWorld } from './state/useHydrateWorld';
import { usePlayerStore } from './state/usePlayerStore';
import { World } from './scene/World';

/** A world nobody owns has logged nothing. Stable, so the sheet never rebuilds. */
const EMPTY_JOURNAL: JournalEntry[] = [];

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
 * Tone mapping is off on purpose: the palette is authored, and ACES only
 * desaturates it. The old world ran `ACESFilmicToneMapping` with five post
 * passes on top, which is why its FX read as stickers (`02-AUDIT.md` §3).
 */
function Renderer({ onReady }: { onReady: (gl: THREE.WebGLRenderer) => void }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    gl.toneMapping = THREE.NoToneMapping;
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
  payload,
  readOnly = false,
}: MundoGameProps) {
  const detailMode = useSettings((s) => s.detailMode);
  const reduceMotionSetting = useSettings((s) => s.reduceMotion);
  const autoCamera = useSettings((s) => s.autoCamera);
  const sensitivity = useSettings((s) => s.cameraSensitivityX);

  const setTierInStore = useSessionStore((s) => s.setTier);
  const setReducedMotion = useSessionStore((s) => s.setReducedMotion);
  const hud = useSessionStore((s) => s.hud);
  const setHud = useSessionStore((s) => s.setHud);
  const ceremonyRequest = useSessionStore((s) => s.ceremony.request);

  const [tier, setTier] = useState<QualityTier>(1);
  const [frameloop, setFrameloop] = useState<'always' | 'demand'>('always');
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
    readOnly: readOnly || !payload,
  });

  /**
   * A tier reached but not yet celebrated plays **the next time the player
   * enters `/mundo`** (`08-WORLD-AND-PROGRESSION.md` §5), which is here. The
   * queue is drained one at a time, oldest first, and `world_mark_celebrated`
   * is what stops it playing twice.
   */
  const celebrate = useCelebrate({ readOnly: readOnly || !payload });
  /**
   * El póster. Until this existed, every card in the app showed a generated
   * SVG of an island nobody owns; now the feed, both profiles and onboarding
   * show the world this player actually last stood in.
   */
  const poster = useSnapshot({
    userId: payload?.userId ?? userId,
    readOnly: readOnly || !payload,
  });
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<FollowCamera | null>(null);
  /** The live canvas, for the share card. See `share/ShareCard.ts`. */
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      prefersReducedMotion: reducedMotion,
      detailMode,
      forced: forcedTier,
    });
    monitor.reset(start);
    setTier(start);
    setTierInStore(start);
  }, [detailMode, forcedTier, reducedMotion, monitor, setTierInStore]);

  useEffect(() => setReducedMotion(reducedMotion), [reducedMotion, setReducedMotion]);
  useEffect(() => cameraRef.current?.setAutoRecentre(autoCamera), [autoCamera]);

  const onTierChange = useCallback(
    (next: QualityTier) => {
      setTier(next);
      setTierInStore(next);
    },
    [setTierInStore],
  );

  /** Continuous rendering when nothing moves is the cheapest waste there is. */
  const wake = useCallback(() => {
    setFrameloop('always');
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setFrameloop('demand'), RENDER_LOOP.idleDemandDelayS * 1000);
  }, []);

  useEffect(() => {
    wake();
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [wake]);

  useKeyboardInput({ onInteract: wake });
  const drag = useCameraDrag({ cameraRef, sensitivity, onInput: wake });

  /**
   * Everything is disposed. The old world leaked its module caches for the
   * app's lifetime across route changes (`02-AUDIT.md` §7); this effect and the
   * assertion under it are how that does not happen again.
   */
  useEffect(() => {
    return () => {
      clearInteractables();
      resetInput();
      disposeMaterials();
      disposeGeometry();
      const gl = rendererRef.current;
      // Development only: the assertion is a warning to whoever is working on
      // the scene, not something to run in a player's console.
      //
      // **Deferred by a task.** React tears an unmounting tree down parent
      // first, so this cleanup runs BEFORE the scene components' own — and
      // reading `gl.info.memory` here counted every geometry that was about to
      // be disposed a moment later. It reported ten leaked geometries on every
      // single unmount, which is worse than no assertion: an alarm that always
      // fires is an alarm nobody reads.
      if (gl && process.env.NODE_ENV !== 'production') {
        setTimeout(() => {
          const { geometries, textures } = gl.info.memory;
          if (geometries !== 0 || textures !== 0) {
            console.warn(`[mundo] leak on unmount: ${geometries} geometries, ${textures} textures`);
          }
        }, 0);
      }
    };
  }, []);

  const params = TIERS[tier];
  const pitch = (CAMERA.pitchDeg * Math.PI) / 180;

  return (
    // Fixed, not `height: 100vh`: `vh` includes the collapsing mobile bottom bar
    // and causes layout jumps (`16-UI-AUDIO-A11Y.md` §6).
    <div
      className="fixed inset-0 z-[70] touch-none select-none overscroll-none bg-brote-ink"
      style={{ paddingBottom: `env(safe-area-inset-bottom, ${JOYSTICK.safeAreaMinPx}px)` }}
      onPointerDown={(e) => {
        wake();
        drag.onPointerDown(e);
      }}
      onPointerMove={drag.onPointerMove}
      onPointerUp={drag.onPointerUp}
      onPointerCancel={drag.onPointerUp}
    >
      {/* A measurement run holds the loop open: `demand` gaps are not frames,
          the probe rejects them, and a harness that samples nothing measures
          nothing (`07-RENDER-ARCHITECTURE.md` §6). */}
      <Canvas
        frameloop={ceremonyRequest !== null || perf ? 'always' : hud !== 'play' ? 'demand' : frameloop}
        dpr={params.dprCap}
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
          projectMarkers={payload?.projectMarkers}
          previousBiome={world.previousBiome}
          readOnly={readOnly || !payload}
          onPlacementsChanged={save}
          onCelebrated={celebrate}
          onPoster={poster}
        />
        {perf && PerfProbe && <PerfProbe tier={tier} />}
      </Canvas>

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
        readOnly={readOnly || !payload}
        userId={world.userId}
        journal={payload?.journal ?? EMPTY_JOURNAL}
        perf={perf}
      />
    </div>
  );
}
