'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { CAMERA, RENDER_LOOP } from '@/lib/world/config';
import type { QualityTier } from '@/lib/world/types';
import { CLAY, PRESETS, paletteForWorld } from '@/lib/render/palette';
import { TIERS, initialTier } from '@/lib/render/quality';
import { islandRadius } from '@/lib/world/progression';
import { disposeAll as disposeMaterials, getClayMaterial, updateMood } from '@/lib/render/materials';
import { fogRange } from '@/lib/render/materials/clay';
import { disposeAll as disposeGeometry } from '@/lib/render/geometry';

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
 * The one `<Canvas>` in the entire app.
 *
 * Low-end Android caps WebGL contexts and silently drops the older one, so there
 * is exactly one renderer and it is mounted only on `/mundo`
 * (`07-RENDER-ARCHITECTURE.md` §1). Everything else in the app — the feed, both
 * profiles, onboarding — shows `<MundoPoster/>`, which is an `<img>`.
 *
 * At the end of phase 1 this holds the DPR cap, the four lights, one flat plane
 * and the perf overlay. **Nothing else.** The island arrives in phase 2.
 */

/** The four lights, forever. No environment map, no HDRI, no area lights. */
function LightRig({ tier }: { tier: QualityTier }) {
  const preset = PRESETS.dia;
  const elevation = (preset.keyElevationDeg * Math.PI) / 180;
  return (
    <>
      {/* Key: warm sun. Casts a real shadow only at T3. */}
      <directionalLight
        color={preset.keyColor}
        intensity={preset.keyIntensity}
        position={[Math.cos(elevation) * 12, Math.sin(elevation) * 12, 6]}
        castShadow={TIERS[tier].realShadows}
      />
      {/* Fill: sky to ground. Does the ambient-occlusion-ish work for free. */}
      <hemisphereLight
        color={preset.fillSky}
        groundColor={preset.fillGround}
        intensity={preset.fillIntensity}
      />
      {/* Rim: cool, from behind-left. Separates silhouettes from the sky. */}
      <directionalLight color={preset.rimColor} intensity={preset.rimIntensity} position={[-8, 5, -9]} />
      {/* Ambient: lifts the darkest band off pure black. */}
      <ambientLight color={preset.ambientColor} intensity={preset.ambientIntensity} />
    </>
  );
}

/**
 * The placeholder ground: one flat plane the size of the largest island, so the
 * camera framing and the light rig can be judged now. Phase 2 replaces it with
 * the baked heightfield.
 */
const GROUND_SPAN = islandRadius(11) * 2;

/** The tier-1 biome at midday. Fog matches the sky horizon (`06` §4). */
const PALETTE = paletteForWorld(1, 'dia');
const SKY = PALETTE.skyHorizon;

function FlatGround() {
  // `clay.soil`, not `clay.stone`: tier 1 is bare warm earth, and it has to sit
  // in a different value group from the sky behind it (`06` §2 rule 3).
  const material = useMemo(() => getClayMaterial({ vertexColors: false, color: CLAY.soil, wobble: false, ao: false }), []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={material}>
      <planeGeometry args={[GROUND_SPAN, GROUND_SPAN, 1, 1]} />
    </mesh>
  );
}

/**
 * Tone mapping is off on purpose: the palette is authored, and ACES only
 * desaturates it. The old world ran `ACESFilmicToneMapping` with five post
 * passes on top, which is why its FX read as stickers (`02-AUDIT.md` §3).
 *
 * The camera pitch is applied here too. `<Canvas camera>` only takes a position,
 * and a camera looking at the horizon shows a flat island edge-on. Phase 2's
 * `FollowCamera` takes ownership of this transform; until then this is the one
 * place that writes it.
 */
function SceneSetup({ onReady }: { onReady: (gl: THREE.WebGLRenderer) => void }) {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    gl.toneMapping = THREE.NoToneMapping;
    camera.rotation.set((CAMERA.pitchDeg * Math.PI) / 180, 0, 0);
    onReady(gl);
  }, [gl, camera, onReady]);
  return null;
}

export interface MundoGameProps {
  /** `?perf=1` — the measurement harness. */
  perf?: boolean;
  /** `?mundoTier=0..3` forces a tier, for testing. */
  forcedTier?: number | null;
  detailMode?: 'auto' | 'high' | 'low';
}

export default function MundoGame({ perf = false, forcedTier = null, detailMode = 'auto' }: MundoGameProps) {
  const [tier, setTier] = useState<QualityTier>(1);
  const [frameloop, setFrameloop] = useState<'always' | 'demand'>('always');
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Static hints may only LOWER the starting tier; a saved manual setting is the
  // one thing allowed to raise it (`07-RENDER-ARCHITECTURE.md` §4.1).
  useEffect(() => {
    setTier(
      initialTier({
        hardwareConcurrency: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : undefined,
        prefersReducedMotion:
          typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
        detailMode,
        forced: forcedTier,
      }),
    );
  }, [detailMode, forcedTier]);

  /** Continuous rendering when nothing moves is the cheapest waste there is. */
  const wake = useCallback(() => {
    setFrameloop('always');
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => setFrameloop('demand'), RENDER_LOOP.idleDemandDelayS * 1000);
  }, []);

  useEffect(() => {
    wake();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [wake]);

  /**
   * Everything is disposed. The old world leaked its module caches for the
   * app's lifetime across route changes (`02-AUDIT.md` §7); this effect and the
   * assertion under it are how that does not happen again.
   */
  useEffect(() => {
    return () => {
      disposeMaterials();
      disposeGeometry();
      const gl = rendererRef.current;
      if (DEV && gl) {
        // Read after dispose so a leak shows up in the console during dev, in
        // the same session that introduced it.
        const { geometries, textures } = gl.info.memory;
        if (geometries !== 0 || textures !== 0) {
          console.warn(`[mundo] leak on unmount: ${geometries} geometries, ${textures} textures`);
        }
      }
    };
  }, []);

  /**
   * One mood object drives every clay material's ~11 uniforms. Time of day and
   * biome shift the whole scene by changing these numbers — never by
   * re-creating a material, which is a shader compile and a visible hitch on
   * cheap Android (`06-ART-DIRECTION.md` §4).
   */
  useEffect(() => {
    const { near, far } = fogRange(TIERS[tier].renderDistanceM);
    updateMood({
      rimColor: PALETTE.light.rimColor,
      fogColor: PALETTE.fog,
      fogNear: near,
      fogFar: far,
      fogDensity: 1,
      time: 0,
    });
  }, [tier]);

  const params = TIERS[tier];
  // The real framing, from the first frame: 38° vertical at ~7 m, pitched down
  // 28°. Low FOV is what makes the island read as a miniature (`06` §9).
  const pitch = (CAMERA.pitchDeg * Math.PI) / 180;
  const cameraPosition: [number, number, number] = [
    0,
    -Math.sin(pitch) * CAMERA.distanceM,
    Math.cos(pitch) * CAMERA.distanceM,
  ];

  return (
    // Fixed, not `height: 100vh`: `vh` includes the collapsing mobile bottom bar
    // and causes layout jumps (`16-UI-AUDIO-A11Y.md` §6). Fixed inset also lets
    // the game fill the viewport without the app shell having to know about it.
    <div
      className="fixed inset-0 z-[70] touch-none select-none bg-brote-ink"
      onPointerDown={wake}
      onPointerMove={wake}
    >
      <Canvas
        frameloop={frameloop}
        dpr={params.dprCap}
        camera={{ fov: CAMERA.fov, position: cameraPosition }}
        gl={{
          antialias: params.antialias,
          alpha: false,
          powerPreference: 'high-performance',
          // No `preserveDrawingBuffer`: it costs memory and forces a copy every
          // frame. The poster capture renders one extra frame on demand instead.
          preserveDrawingBuffer: false,
        }}
      >
        <SceneSetup
          onReady={(gl) => {
            rendererRef.current = gl;
          }}
        />
        <color attach="background" args={[SKY]} />
        <LightRig tier={tier} />
        <FlatGround />
        {perf && PerfProbe && <PerfProbe tier={tier} />}
      </Canvas>
      {perf && PerfOverlay && <PerfOverlay />}
    </div>
  );
}
