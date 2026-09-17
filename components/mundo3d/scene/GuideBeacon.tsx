'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { BRAND } from '@/lib/render/palette';
import { GUIDE } from '@/lib/world/config';
import { sampleHeight, type Heightfield } from '@/lib/world/terrain';
import { playerTransform } from '../state/usePlayerStore';
import { useSessionStore } from '../state/useSessionStore';
import { labelSlots } from '../hud/labelSlots';
import { hidePin, pinToScreen } from './screenPin';

/**
 * Where the objective is, seen from anywhere.
 *
 * Two marks. A soft column of warm light standing on the target — the kind of
 * thing you notice across a field and walk toward — which fades as you arrive.
 * And a label pinned over it (`hud/WorldLabels.tsx`) that names the task and says
 * how far; off screen it waits at the edge and points the way.
 *
 * The label replaced a chevron on the ground at Pip's feet. The 2026-09-16
 * playtest found the floor full of shapes nobody had explained, and an orange
 * arrowhead in the grass was the least explained of them.
 */
const beamVertex = /* glsl */ `
  varying float vH;
  varying vec3 vN;
  varying vec3 vToEye;
  uniform float uHeight;
  void main() {
    vH = position.y / uHeight;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vN = normalize(mat3(modelMatrix) * normal);
    vToEye = cameraPosition - wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const beamFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;
  varying float vH;
  varying vec3 vN;
  varying vec3 vToEye;
  void main() {
    float core = pow(abs(dot(normalize(vN), normalize(vToEye))), 2.2);
    float fade = pow(1.0 - clamp(vH, 0.0, 1.0), 1.8);
    float pulse = 0.72 + 0.28 * sin(uTime * 2.2 - vH * 7.0);
    gl_FragColor = vec4(uColor * 1.8, core * fade * pulse * uOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function GuideBeacon({ heightfield }: { heightfield: Heightfield }) {
  const objective = useSessionStore((s) => s.objective);
  const reducedMotion = useSessionStore((s) => s.reducedMotion);
  const beam = useRef<THREE.Mesh>(null);

  const beamGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(GUIDE.beamRadiusM, GUIDE.beamRadiusM * 1.6, GUIDE.beamHeightM, 24, 1, true);
    g.translate(0, GUIDE.beamHeightM / 2, 0);
    return g;
  }, []);
  const beamMat = useMemo(
    () => new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(BRAND.sun) },
        uOpacity: { value: 0 },
        uTime: { value: 0 },
        uHeight: { value: GUIDE.beamHeightM },
      },
      vertexShader: beamVertex,
      fragmentShader: beamFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }),
    [],
  );

  useEffect(() => () => {
    beamGeo.dispose();
    beamMat.dispose();
    hidePin(labelSlots.pin, labelSlots.pinArrow);
  }, [beamGeo, beamMat]);
  /** The metres last written into the pin, so the text changes only when the number does. */
  const shownM = useRef(-1);

  useFrame(({ clock, camera, size }) => {
    const target = objective?.target;
    const b = beam.current;
    if (!b) return;
    if (!target) {
      b.visible = false;
      hidePin(labelSlots.pin, labelSlots.pinArrow);
      return;
    }
    const p = playerTransform;
    const dist = Math.hypot(target.x - p.x, target.z - p.z);
    const ground = sampleHeight(heightfield, target.x, target.z);

    b.visible = true;
    b.position.set(target.x, ground, target.z);
    const near = THREE.MathUtils.smoothstep(dist, GUIDE.beamFadeNearM, GUIDE.beamFadeFarM);
    beamMat.uniforms.uOpacity!.value = near * GUIDE.beamOpacity;
    beamMat.uniforms.uTime!.value = reducedMotion ? 0 : clock.elapsedTime;

    const pin = labelSlots.pin;
    if (!pin) return;
    if (dist < GUIDE.pinHideNearM) {
      hidePin(pin, labelSlots.pinArrow);
      return;
    }
    pinToScreen(pin, camera, size, target.x, ground + GUIDE.pinHeightM, target.z, labelSlots.pinArrow);
    const m = Math.round(dist);
    if (m !== shownM.current && labelSlots.pinDistance) {
      shownM.current = m;
      labelSlots.pinDistance.textContent = `${m} m`;
    }
  });

  // Visibility is the frame loop's alone. As a JSX prop, every objective change
  // re-rendered the component and switched the mark back off.
  return (
    <>
      {/* Guidance, not scenery: left out of the poster (`PosterShot.tsx`). */}
      <mesh ref={beam} geometry={beamGeo} material={beamMat} renderOrder={6} frustumCulled={false} userData={{ posterHidden: true }} />
    </>
  );
}
