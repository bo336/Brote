'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { CAMERA, JOYSTICK, LOOK } from '@/lib/world/config';
import { isNight } from '@/lib/utils/dates';
import { detailModeToTier, prefersReducedMotion, useSettings } from '@/stores/settings';
import type { CeremonyScript } from '@/lib/world/ceremony';
import { paletteForWorld } from '@/lib/render/palette';
import { createQualityMonitor, initialTier, TIERS } from '@/lib/render/quality';
import {
  abrir,
  cerrarLimpio,
  lensAllowed,
  marcarEstable,
  maxAutoTier,
  olvidarFallos,
  registrarFallo,
  STABLE_AFTER_MS,
  volverAlFrente,
  type Arranque,
} from '@/lib/world/arranque';
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
import { useGameSession } from './game/useGameSession';
import { useGameUi } from './game/useGameUi';
import { MundoNoAbre } from './MundoSeguro';
import { reportarFalloMundo } from './reportar';

/** A world nobody owns has logged nothing. Stable, so the sheet never rebuilds. */
const EMPTY_JOURNAL: JournalEntry[] = [];

/**
 * How much bigger "texto grande" is. OURS: 1.25 is the smallest step that is
 * unmistakably different, and small enough that a caption still fits one line
 * on a narrow phone.
 */
const LARGE_TEXT_SCALE = 1.25;

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

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

  /**
   * A phone is a touch screen. It decides the ceiling of the quality monitor
   * and whether the lens may run (`lib/world/arranque.ts`).
   */
  const coarse = useMemo(
    () => typeof window !== 'undefined' && (window.matchMedia?.('(pointer: coarse)')?.matches ?? false),
    [],
  );
  /**
   * Did the last opening die? Read once, before anything heavy is built: a
   * crash mark from the previous visit means this one starts light (T1, or T0
   * after two) and stays there for the session.
   */
  const [arranque] = useState<Arranque>(() =>
    visit !== undefined || typeof window === 'undefined' ? { fallos: 0, liviano: null } : abrir(storage(), Date.now()),
  );

  const setTierInStore = useSessionStore((s) => s.setTier);
  const setReducedMotion = useSessionStore((s) => s.setReducedMotion);
  const hud = useSessionStore((s) => s.hud);
  // A station's panel or a conversation keeps the world moving behind it (`Framing`).
  const framed = useGameUi((s) => s.screen?.kind === 'estacion' || s.screen?.kind === 'dialogo');
  const setHud = useSessionStore((s) => s.setHud);
  const ceremonyRequest = useSessionStore((s) => s.ceremony.request);

  /**
   * **The starting tier, decided before the first render.** It used to start at
   * 1 and be corrected by an effect, so everything built once "at the tier the
   * session started on" — the ground, the plants — was built at T1 on a desktop.
   */
  const [tier, setTier] = useState<QualityTier>(() => initialTier({
    hardwareConcurrency: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : undefined,
    coarsePointer: coarse,
    prefersReducedMotion: prefersReducedMotion(reduceMotionSetting),
    detailMode,
    forced: forcedTier ?? arranque.liviano,
  }));
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

  // The game's save and its flush on leaving (`game/useGameSession.ts`).
  useGameSession({ who: world.userId, tier: world.tier, payload, frozen, visit: visit !== undefined });

  // ── Quality. **Start at T1**; static hints may only lower it, and a manual
  //    setting disables the monitor entirely (`07-RENDER-ARCHITECTURE.md` §4).
  // A tier forced from the URL is a manual choice too: the monitor used to
  // demote it within seconds, and a review of "q=3" was a review of T2.
  const forcedManual = forcedTier != null && forcedTier >= 0 && forcedTier <= 3
    ? (Math.floor(forcedTier) as QualityTier)
    : null;
  // A light start after a crash holds its tier like a manual setting would.
  const manual = forcedManual ?? arranque.liviano ?? detailModeToTier(detailMode);
  const maxAuto = maxAutoTier(coarse);
  const monitor = useMemo(() => createQualityMonitor({ start: 1, manual, maxAuto }), [manual, maxAuto]);

  useEffect(() => {
    const start = initialTier({
      hardwareConcurrency: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : undefined,
      coarsePointer: coarse,
      prefersReducedMotion: reducedMotion,
      detailMode,
      forced: forcedTier ?? arranque.liviano,
    });
    monitor.reset(start);
    setTier(start);
    setTierInStore(start);
  }, [detailMode, forcedTier, reducedMotion, monitor, setTierInStore, coarse, arranque.liviano]);

  /**
   * The crash mark's lifecycle. Going to the background or leaving cleanly is
   * not a crash, so it clears the mark; coming back sets it again. A minute and
   * a half of running without dying forgets past failures.
   */
  useEffect(() => {
    if (visit !== undefined) return;
    const store = storage();
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') cerrarLimpio(store);
      else volverAlFrente(store, Date.now());
    };
    const onPageHide = () => cerrarLimpio(store);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    const stable = window.setTimeout(() => marcarEstable(store), STABLE_AFTER_MS);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      window.clearTimeout(stable);
      cerrarLimpio(store);
    };
  }, [visit]);

  useEffect(() => {
    if (arranque.liviano !== null) {
      void reportarFalloMundo('arranque_liviano', `fallos previos: ${arranque.fallos}`, { tier: arranque.liviano });
    }
  }, [arranque]);

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
  // The canvas as state, not a ref: the lost-context listener has to attach
  // when the canvas exists. Reading `canvasRef.current` during render passed
  // null forever, so a phone that ran out of GPU memory got a frozen black
  // screen instead of the fallback.
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
  const worldState = useWorldState(canvasEl);
  useEffect(() => {
    if (worldState !== 'unsupported') return;
    registrarFallo(storage(), Date.now());
    void reportarFalloMundo('contexto_perdido', 'webglcontextlost sin restaurar', { tier });
    // `tier` is read once, at the moment it failed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worldState]);
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
    >
      {/* A measurement run holds the loop open: `demand` gaps are not frames,
          the probe rejects them, and a harness that samples nothing measures
          nothing (`07-RENDER-ARCHITECTURE.md` §6). */}
      <Canvas
        frameloop={ceremonyRequest !== null || perf || alwaysRender
          ? 'always'
          : hud !== 'play' && !framed ? 'demand' : frameloop}
        // A range, not a number: a number *forces* that ratio, so a 1080p screen at
        // DPR 1 was drawn at 1.75× — 3360×1890 — and ran at a tenth of its speed.
        dpr={[Math.min(1, params.dprCap), params.dprCap]}
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
            setCanvasEl(gl.domElement);
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
        {/* The lens runs on a phone only when the player picked "Alta". */}
        {lensAllowed(coarse, detailMode) && <PostFx tier={tier} />}
        {perf && PerfProbe && <PerfProbe tier={tier} />}
      </Canvas>

      {/* Offline, a lost drawing context, or a browser that cannot draw at
          all. None of the three is a dead end. */}
      <WorldStates state={worldState === 'unsupported' ? 'ok' : worldState} />
      {worldState === 'unsupported' && (
        <MundoNoAbre
          motivo="memoria"
          tier={world.tier}
          snapshotUrl={payload?.snapshotUrl}
          // The failure is counted, so the reload opens light.
          onRetry={() => window.location.reload()}
        />
      )}
      {arranque.liviano !== null && worldState === 'ok' && <AvisoLiviano />}
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

/**
 * One line on top when the world opened light because the last attempt died,
 * with the way to try the full one again. Gone after a few seconds: the light
 * world is still the world.
 */
function AvisoLiviano() {
  const t = useTranslations('mundo.liviano');
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const id = window.setTimeout(() => setVisible(false), 9000);
    return () => window.clearTimeout(id);
  }, []);
  if (!visible) return null;
  return (
    <div
      className="pointer-events-auto absolute inset-x-0 z-10 mx-auto flex w-fit max-w-[92%] items-center gap-3 rounded-pill bg-brote-ink/85 py-2 pl-4 pr-2 text-caption text-brote-cream shadow-soft-lg backdrop-blur-sm"
      style={{ top: 'calc(env(safe-area-inset-top) + 4.5rem)' }}
      role="status"
    >
      <span>{t('aviso')}</span>
      <button
        type="button"
        onClick={() => {
          olvidarFallos(storage());
          window.location.reload();
        }}
        className="shrink-0 rounded-pill bg-white/15 px-3 py-1 font-semibold"
      >
        {t('probar')}
      </button>
    </div>
  );
}
