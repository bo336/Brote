'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { getFlatMaterial } from '@/lib/render/materials';
import { BRAND } from '@/lib/render/palette';
import { GUIDE } from '@/lib/world/config';
import { sampleHeight, type Heightfield } from '@/lib/world/terrain';
import { playerTransform } from '../state/usePlayerStore';
import { useSessionStore } from '../state/useSessionStore';

/** Guidance is left out of the poster (`PosterShot`). */
const POSTER_HIDDEN = { posterHidden: true };

/**
 * Where the objective is, seen from anywhere.
 *
 * Two marks. A soft column of warm light standing on the target — the kind of
 * thing you notice across a field and walk toward — which fades as you arrive.
 * And a small chevron on the ground at Pip's feet, turning to point the way,
 * for when the target is behind a hill or behind the camera.
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
  const arrow = useRef<THREE.Mesh>(null);

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

  const arrowGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.26);
    shape.lineTo(0.2, -0.06);
    shape.lineTo(0.07, -0.01);
    shape.lineTo(0, 0.1);
    shape.lineTo(-0.07, -0.01);
    shape.lineTo(-0.2, -0.06);
    shape.closePath();
    const g = new THREE.ShapeGeometry(shape);
    g.rotateX(Math.PI / 2);
    const c = new THREE.Color(BRAND.sun);
    const n = (g.attributes.position as THREE.BufferAttribute).count;
    const colors = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) colors.set([c.r, c.g, c.b, 0.9], i * 4);
    g.setAttribute('color', new THREE.BufferAttribute(colors, 4));
    return g;
  }, []);
  const arrowMat = useMemo(
    () => getFlatMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide }),
    [],
  );

  useEffect(() => () => {
    beamGeo.dispose();
    beamMat.dispose();
    arrowGeo.dispose();
  }, [beamGeo, beamMat, arrowGeo]);

  useFrame(({ clock }) => {
    const target = objective?.target;
    const b = beam.current;
    const a = arrow.current;
    if (!b || !a) return;
    if (!target) {
      b.visible = false;
      a.visible = false;
      return;
    }
    const p = playerTransform;
    const dx = target.x - p.x;
    const dz = target.z - p.z;
    const dist = Math.hypot(dx, dz);

    b.visible = true;
    b.position.set(target.x, sampleHeight(heightfield, target.x, target.z), target.z);
    const near = THREE.MathUtils.smoothstep(dist, GUIDE.beamFadeNearM, GUIDE.beamFadeFarM);
    beamMat.uniforms.uOpacity!.value = near * GUIDE.beamOpacity;
    beamMat.uniforms.uTime!.value = reducedMotion ? 0 : clock.elapsedTime;

    a.visible = dist > GUIDE.arrowMinM;
    if (a.visible) {
      const ux = dx / dist;
      const uz = dz / dist;
      const ax = p.x + ux * GUIDE.arrowAheadM;
      const az = p.z + uz * GUIDE.arrowAheadM;
      const bob = reducedMotion ? 0 : (Math.sin(clock.elapsedTime * 3) * 0.5 + 0.5) * GUIDE.arrowNudgeM;
      a.position.set(ax + ux * bob, sampleHeight(heightfield, ax, az) + GUIDE.arrowLiftM, az + uz * bob);
      a.rotation.set(0, Math.atan2(ux, uz), 0);
    }
  });

  // Visibility is the frame loop's alone. As a JSX prop, every objective change
  // re-rendered the component and switched both marks back off.
  return (
    <>
      <mesh ref={beam} geometry={beamGeo} material={beamMat} renderOrder={6} frustumCulled={false} userData={POSTER_HIDDEN} />
      <mesh ref={arrow} geometry={arrowGeo} material={arrowMat} renderOrder={6} scale={GUIDE.arrowScale} userData={POSTER_HIDDEN} />
    </>
  );
}
