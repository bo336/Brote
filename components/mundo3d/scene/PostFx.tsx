'use client';

import { useMemo } from 'react';
import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing';
import { BlendFunction, Effect, ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';

import { POST } from '@/lib/world/config';
import { TIERS } from '@/lib/render/quality';
import type { QualityTier } from '@/lib/world/types';
import { useFxOverrides } from '../dev/fxOverrides';

/**
 * The lens, at T2 and up (`23-ART-DIRECTION-V2.md` §4).
 *
 * Soft ambient occlusion where things meet, bloom only on what is genuinely
 * bright (the sun on water, a flower in full light), AgX tone mapping, a grade
 * that pulls shadows toward canopy green and highlights toward dawn amber — the
 * brand gradient, as light — and a vignette you notice only when it is gone.
 *
 * T0 and T1 skip all of it: the renderer tone-maps on its own, and a cheap phone
 * spends its frame on the world rather than on a second pass over it.
 */
const GRADE_FRAG = /* glsl */ `
  uniform vec3 uShadowTint;
  uniform vec3 uHighlightTint;
  uniform float uSaturation;
  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec3 c = inputColor.rgb;
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
    c = mix(vec3(l), c, uSaturation);
    c += uShadowTint * (1.0 - smoothstep(0.0, 0.45, l));
    c += uHighlightTint * smoothstep(0.5, 1.0, l);
    outputColor = vec4(c, inputColor.a);
  }
`;

class GradeEffect extends Effect {
  constructor() {
    super('BroteGrade', GRADE_FRAG, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, THREE.Uniform>([
        ['uShadowTint', new THREE.Uniform(new THREE.Vector3(...POST.shadowTint))],
        ['uHighlightTint', new THREE.Uniform(new THREE.Vector3(...POST.highlightTint))],
        ['uSaturation', new THREE.Uniform(POST.saturation)],
      ]),
    });
  }
}

export function PostFx({ tier }: { tier: QualityTier }) {
  const grade = useMemo(() => new GradeEffect(), []);
  const fx = useFxOverrides((s) => s.fx);
  if (!TIERS[tier].postProcessing) return null;
  const high = tier >= 3;
  /**
   * **What the lens costs, measured (2026-09-15, La Arboleda at T3).** 4× MSAA
   * on the composer's buffer and full-resolution AO took 17 of a 31 ms frame.
   * Half-resolution AO upsampled against depth, and SMAA instead of MSAA, took
   * the frame to 18 ms — and side by side, at a 2× crop of the grass, the two
   * cannot be told apart. MSAA never smoothed the alpha-tested leaves anyway.
   */
  const ao = fx.ao ?? true;
  const aoHalf = fx.aoHalf ?? true;
  const bloom = fx.bloom ?? true;
  const msaa = fx.msaa ?? 0;
  const smaa = fx.smaa ?? high;
  const graded = fx.grade ?? true;
  return (
    <EffectComposer multisampling={msaa} enableNormalPass={false}>
      {ao ? (
        <N8AO
          halfRes={aoHalf}
          depthAwareUpsampling
          quality={high ? 'medium' : 'performance'}
          aoRadius={POST.aoRadiusM}
          distanceFalloff={POST.aoFalloff}
          intensity={POST.aoIntensity}
        />
      ) : <></>}
      {smaa ? <SMAA /> : <></>}
      {bloom ? (
        <Bloom mipmapBlur intensity={POST.bloomIntensity} luminanceThreshold={POST.bloomThreshold} luminanceSmoothing={0.2} />
      ) : <></>}
      <ToneMapping mode={ToneMappingMode.AGX} />
      {graded ? <primitive object={grade} dispose={null} /> : <></>}
      <Vignette offset={POST.vignetteOffset} darkness={POST.vignetteDarkness} />
    </EffectComposer>
  );
}
