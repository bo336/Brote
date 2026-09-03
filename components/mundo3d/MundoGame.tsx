'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { CAMERA, JOYSTICK, RENDER_LOOP } from '@/lib/world/config';
import { isNight } from '@/lib/utils/dates';
import { detailModeToTier, prefersReducedMotion, useSettings } from '@/stores/settings';
import { paletteForWorld } from '@/lib/render/palette';
import { createQualityMonitor, initialTier, TIERS } from '@/lib/render/quality';
import { disposeAll as disposeMaterials } from '@/lib/render/materials';
import { disposeAll as disposeGeometry } from '@/lib/render/geometry';
import type { QualityTier, TimeOfDay } from '@/lib/world/types';
import type { FollowCamera } from './control/FollowCamera';
import { resetInput, useKeyboardInput } from './control/useInput';
import { useCameraDrag } from './control/useCameraDrag';
import { HUD } from './hud/HUD';
import { SettingsSheet } from './hud/SettingsSheet';
import { clearInteractables } from './interaction/InteractableRegistry';
import { useSessionStore } from './state/useSessionStore';
import { useWorldStore } from './state/useWorldStore';
import { World } from './scene/World';

const DEV = process.env.NODE_ENV !== 'production';

/**
 * The perf harness is reached only from a branch the bundler folds away in
 * production — `DEV` is a literal `false` there, so these `import()` calls are
 * removed outright and shipped users never download the overlay.
 */
const PerfProbe = DEV
  ? dynamic(() => import('./dev/PerfOverlay').then((m) => m.PerfProbe), { ssr: false })
  : null;
const PerfOverlay = DEV
  ? dynamic(() => import('./dev/PerfOverlay').then((m) => m.PerfOverlay), { ssr: false })
  : null;

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
}: MundoGameProps) {
  const detailMode = useSettings((s) => s.detailMode);
  const reduceMotionSetting = useSettings((s) => s.reduceMotion);
  const autoCamera = useSettings((s) => s.autoCamera);
  const sensitivity = useSettings((s) => s.cameraSensitivityX);

  const hydrate = useWorldStore((s) => s.hydrate);
  const setTierInStore = useSessionStore((s) => s.setTier);
  const setReducedMotion = useSessionStore((s) => s.setReducedMotion);
  const hud = useSessionStore((s) => s.hud);
  const setHud = useSessionStore((s) => s.setHud);

  const [tier, setTier] = useState<QualityTier>(1);
  const [frameloop, setFrameloop] = useState<'always' | 'demand'>('always');
  const [derivedTimeOfDay] = useState<TimeOfDay>(() => (isNight() ? 'noche' : 'dia'));
  const timeOfDay = timeOfDayOverride ?? derivedTimeOfDay;
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<FollowCamera | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reducedMotion = prefersReducedMotion(reduceMotionSetting);
  const palette = useMemo(() => paletteForWorld(worldIndex, timeOfDay), [worldIndex, timeOfDay]);

  // ── The world, derived once from server state. It cannot change during play:
  //    a real action completes in the app, never in here.
  useEffect(() => {
    hydrate({
      userId,
      tier: worldTier,
      worldIndex,
      liveliness,
      // Phase 4 hands the real totals down from `brote_user_impact`.
      impact: { water_l: 0, co2_kg: 0, waste_kg: 0, energy_kwh: 0 },
    });
  }, [hydrate, userId, worldTier, worldIndex, liveliness]);

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
      if (DEV && gl) {
        const { geometries, textures } = gl.info.memory;
        if (geometries !== 0 || textures !== 0) {
          console.warn(`[mundo] leak on unmount: ${geometries} geometries, ${textures} textures`);
        }
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
      <Canvas
        frameloop={hud === 'play' ? frameloop : 'demand'}
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
          }}
        />
        <color attach="background" args={[palette.skyHorizon]} />
        <World
          tier={tier}
          timeOfDay={timeOfDay}
          monitor={monitor}
          onTierChange={onTierChange}
          cameraRef={cameraRef}
        />
        {perf && PerfProbe && <PerfProbe tier={tier} />}
      </Canvas>

      <HUD onOpenSettings={() => setHud('settings')} />
      <SettingsSheet open={hud === 'settings'} onClose={() => setHud('play')} />
      {perf && PerfOverlay && <PerfOverlay />}
    </div>
  );
}
