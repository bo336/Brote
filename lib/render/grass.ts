/**
 * The grass: tens of thousands of blades, generated on the GPU.
 *
 * **Why this and not instanced tufts.** The old ground cover was a few hundred
 * four-blade tufts scattered on points — sparse spikes on a flat green, the
 * single most "generic" thing in the playtest's frames. Real long grass is
 * density and motion: the ground disappears under it and the wind moves across
 * it in waves. That needs blades by the tens of thousands, which is too many to
 * place from the CPU and exactly what a vertex shader is good at.
 *
 * One draw call. Every blade's position is derived in the shader from its
 * instance number and a window centred on Pip, **anchored to world cells** so a
 * blade stays put as the window slides. The ground height and a density-and-
 * colour mask come from two small textures baked once from the heightfield, so
 * blades sit exactly on the terrain, match the ground colour beneath them, and
 * never grow on paths, sand, rock, water or snow.
 *
 * The sun, the shadows and the sky light come from `MeshStandardMaterial`; on top:
 * gust bands that travel downwind, blades that part around Pip, dark roots, warm
 * tips, and light through the blade when you look toward the sun.
 */
import * as THREE from 'three';

import { GRASS, LOOK, WATER_LEVEL } from '@/lib/world/config';
import type { BiomeConfig } from '@/lib/world/biome';
import { coastRadiusAt, regionAt, type IslandLayout } from '@/lib/world/layout';
import { pathsFor, pathWeight } from '@/lib/world/paths';
import { REGION_CHARACTER } from '@/lib/world/regions';
import { fbm, sampleSlope, type Heightfield } from '@/lib/world/terrain';
import type { QualityTier } from '@/lib/world/types';
import { groundColor, moistureAt, patchAt, primeRamp, scratch } from './geometry/ground-paint';
import type { WorldPalette } from './palette';

export interface GrassField {
  mesh: THREE.Mesh<THREE.InstancedBufferGeometry, THREE.MeshStandardMaterial>;
  uniforms: Record<string, THREE.IUniform>;
  heightTex: THREE.DataTexture;
  maskTex: THREE.DataTexture;
}

/** The two baked textures: ground height, and where grass grows in what colour. */
export function bakeGrassTextures(
  hf: Heightfield, layout: IslandLayout, palette: WorldPalette, biome: BiomeConfig, worldTier: number,
): { heightTex: THREE.DataTexture; maskTex: THREE.DataTexture } {
  const { res, extent, step, data } = hf;
  const heights = new Uint16Array(res * res);
  const mask = new Uint8Array(res * res * 4);
  const seed = layout.seed * 0.001;
  const paths = pathsFor(layout);
  const islet = layout.terrain.islet;
  primeRamp(palette);

  for (let iz = 0; iz < res; iz++) {
    const z = -extent + iz * step;
    for (let ix = 0; ix < res; ix++) {
      const x = -extent + ix * step;
      const i = iz * res + ix;
      const h = data[i]!;
      heights[i] = THREE.DataUtils.toHalfFloat(h);

      const slope = sampleSlope(hf, x, z);
      const moisture = moistureAt(x, z, seed, layout);
      const patch = patchAt(x, z, seed);
      const path = pathWeight(x, z, paths);
      groundColor(scratch, x, z, h, slope, moisture, patch, layout.snowLine, path);

      let density = 0;
      // Tier 1 is bare warm earth by design (`08-WORLD-AND-PROGRESSION.md` §3).
      if (worldTier >= 2 && h > WATER_LEVEL + 0.08 && slope < GRASS.maxSlope) {
        const onIslet = islet !== null && Math.hypot(x - islet.x, z - islet.z) < islet.r * 0.9;
        const coast = coastRadiusAt(layout.coastline, Math.atan2(z, x));
        const inside = onIslet || Math.hypot(x, z) < coast - GRASS.coastClearM;
        const snowy = layout.snowLine !== null && h > layout.snowLine - 0.3;
        if (inside && !snowy) {
          const character = REGION_CHARACTER[regionAt(x, z, layout.regions)];
          density = Math.min(1, (character.grass / 1.2) * biome.mix.grassDensity);
          density *= 1 - path;
          const clearing = fbm(x * GRASS.clearingFreq + seed, z * GRASS.clearingFreq - seed, 3);
          density *= Math.min(1, Math.max(0, (clearing - 0.28) / 0.22));
        }
      }
      const o = i * 4;
      mask[o] = Math.min(255, scratch.r * 255);
      mask[o + 1] = Math.min(255, scratch.g * 255);
      mask[o + 2] = Math.min(255, scratch.b * 255);
      mask[o + 3] = Math.round(Math.min(1, Math.max(0, density)) * 255);
    }
  }

  const heightTex = new THREE.DataTexture(heights, res, res, THREE.RedFormat, THREE.HalfFloatType);
  heightTex.magFilter = heightTex.minFilter = THREE.LinearFilter;
  heightTex.needsUpdate = true;
  const maskTex = new THREE.DataTexture(mask, res, res, THREE.RGBAFormat, THREE.UnsignedByteType);
  maskTex.magFilter = maskTex.minFilter = THREE.LinearFilter;
  maskTex.needsUpdate = true;
  return { heightTex, maskTex };
}

/** One blade: a strip with `segments` bends and a single-vertex tip. */
function bladeGeometry(): THREE.InstancedBufferGeometry {
  const seg = GRASS.segments;
  const pos: number[] = [];
  const idx: number[] = [];
  for (let s = 0; s < seg; s++) {
    const y = s / seg;
    pos.push(-0.5, y, 0, 0.5, y, 0);
  }
  pos.push(0, 1, 0);
  for (let s = 0; s < seg - 1; s++) {
    const a = s * 2;
    idx.push(a, a + 1, a + 3, a, a + 3, a + 2);
  }
  const top = (seg - 1) * 2;
  idx.push(top, top + 1, seg * 2);
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(pos.length).fill(0).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
  geo.setIndex(idx);
  geo.instanceCount = 0;
  return geo;
}

const VERT_HEAD = /* glsl */ `
  uniform sampler2D uHeightTex;
  uniform sampler2D uMaskTex;
  uniform float uRes;
  uniform float uStep;
  uniform float uExtent;
  uniform vec2 uCenter;
  uniform float uSpacing;
  uniform float uGrid;
  uniform float uRadius;
  uniform float uBladeH;
  uniform float uBladeW;
  uniform float uTime;
  uniform vec3 uPip;
  uniform float uPushR;
  uniform float uWindAmp;
  uniform vec2 uWindDir;
  varying float vGrassT;
  varying vec3 vGrassCol;
  varying vec3 vGrassWorld;
  float bhHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float bhNoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(bhHash(i), bhHash(i + vec2(1.0, 0.0)), u.x), mix(bhHash(i + vec2(0.0, 1.0)), bhHash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
`;

const VERT_BLADE = /* glsl */ `
  float bhId = float(gl_InstanceID);
  vec2 bhCell = floor(uCenter / uSpacing) - floor(uGrid * 0.5) + vec2(mod(bhId, uGrid), floor(bhId / uGrid));
  float bhR1 = bhHash(bhCell);
  float bhR2 = bhHash(bhCell + 17.31);
  float bhR3 = bhHash(bhCell + 41.7);
  float bhR4 = bhHash(bhCell + 5.13);
  vec2 bhRoot = (bhCell + vec2(bhR1, bhR2)) * uSpacing;
  vec2 bhUV = ((bhRoot + uExtent) / uStep + 0.5) / uRes;
  float bhGround = texture2D(uHeightTex, bhUV).r;
  vec4 bhMask = texture2D(uMaskTex, bhUV);
  float bhFade = 1.0 - smoothstep(uRadius * 0.6, uRadius, length(bhRoot - uCenter));
  float bhKeep = step(bhR3, bhMask.a) * bhFade;
  float bhH = uBladeH * (0.5 + 0.85 * bhR4) * (0.6 + 0.4 * bhMask.a) * bhKeep;
  float bhAng = bhHash(bhCell + 9.7) * 6.2831853;
  vec2 bhFacing = vec2(cos(bhAng), sin(bhAng));
  vec2 bhSide = vec2(-bhFacing.y, bhFacing.x);
  float bhGust = bhNoise(bhRoot * 0.07 - uWindDir * uTime * 0.5);
  float bhSway = sin(uTime * 1.9 + bhRoot.x * 0.4 + bhRoot.y * 0.3 + bhR1 * 6.0) * 0.2;
  vec2 bhBend = uWindDir * (bhSway + bhGust * bhGust * 1.2) * uWindAmp + bhFacing * (0.22 + 0.25 * bhR3);
  vec2 bhAway = bhRoot - uPip.xz;
  float bhPD = length(bhAway);
  float bhPush = (1.0 - smoothstep(0.08, uPushR, bhPD)) * (1.0 - step(1.2, abs(uPip.y - bhGround)));
  bhBend += (bhAway / max(bhPD, 0.001)) * bhPush * 1.5;
  float bhT = position.y;
  vGrassT = bhT;
  // Not one green: some blades darker, and one in six gone to straw.
  vGrassCol = bhMask.rgb * (0.85 + 0.3 * bhR2);
  vGrassCol = mix(vGrassCol, vGrassCol * vec3(1.35, 1.12, 0.55), step(0.83, bhHash(bhCell + 23.9)) * 0.8);
  objectNormal = normalize(vec3(bhFacing.x * 0.4 + bhBend.x * 0.3, 1.0, bhFacing.y * 0.4 + bhBend.y * 0.3));
`;

const VERT_POSITION = /* glsl */ `
  vec3 transformed = vec3(0.0);
  float bhCurve = pow(bhT, 1.6);
  float bhBendLen = min(length(bhBend), 1.2);
  // Full width for most of the blade, then a rounded close — a leaf, not a needle.
  float bhTaper = 1.0 - smoothstep(0.35, 1.0, bhT) * 0.85;
  transformed.xz = bhRoot + bhSide * position.x * uBladeW * bhTaper + bhBend * bhCurve * bhH;
  transformed.y = bhGround + bhT * bhH * (1.0 - 0.35 * bhBendLen * bhCurve);
  vGrassWorld = transformed;
`;

const FRAG_HEAD = /* glsl */ `
  uniform vec3 uSunDirW;
  uniform vec3 uSunColor;
  uniform float uTranslucency;
  uniform vec3 uFogColor;
  uniform float uFogNear;
  uniform float uFogFar;
  uniform float uFogDensity;
  varying float vGrassT;
  varying vec3 vGrassCol;
  varying vec3 vGrassWorld;
`;

export function createGrassField(textures: { heightTex: THREE.DataTexture; maskTex: THREE.DataTexture }, hf: Heightfield): GrassField {
  const uniforms: Record<string, THREE.IUniform> = {
    uHeightTex: { value: textures.heightTex },
    uMaskTex: { value: textures.maskTex },
    uRes: { value: hf.res },
    uStep: { value: hf.step },
    uExtent: { value: hf.extent },
    uCenter: { value: new THREE.Vector2() },
    uSpacing: { value: GRASS.byTier[1].spacing },
    uGrid: { value: 1 },
    uRadius: { value: GRASS.byTier[1].radius },
    uBladeH: { value: GRASS.bladeHeightM },
    uBladeW: { value: GRASS.bladeWidthM },
    uTime: { value: 0 },
    uPip: { value: new THREE.Vector3() },
    uPushR: { value: GRASS.pushRadiusM },
    uWindAmp: { value: GRASS.windAmp },
    uWindDir: { value: new THREE.Vector2(...GRASS.windDir).normalize() },
    uSunDirW: { value: new THREE.Vector3(0.4, 0.8, 0.3).normalize() },
    uSunColor: { value: new THREE.Color(1, 0.9, 0.75) },
    uTranslucency: { value: LOOK.translucency },
    uFogColor: { value: new THREE.Color('#DCEBF2') },
    uFogNear: { value: 20 },
    uFogFar: { value: 80 },
    uFogDensity: { value: 0 },
  };

  const material = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.75, metalness: 0 });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${VERT_HEAD}`)
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>\n${VERT_BLADE}`)
      .replace('#include <begin_vertex>', VERT_POSITION);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${FRAG_HEAD}`)
      .replace('#include <color_fragment>', /* glsl */ `
        #include <color_fragment>
        // Richer than the ground it grows from: grass is pigment, the soil under it dust.
        vec3 bhC = vGrassCol;
        bhC = mix(vec3(dot(bhC, vec3(0.2126, 0.7152, 0.0722))), bhC, 1.4) * 0.88;
        diffuseColor.rgb = mix(bhC * 0.58, bhC * 1.1 + vec3(0.03, 0.028, -0.01), smoothstep(0.0, 1.0, vGrassT));
      `)
      .replace('#include <normal_fragment_begin>', /* glsl */ `
        #include <normal_fragment_begin>
        // One normal for both faces: a blade is lit the same from either side.
        #ifdef DOUBLE_SIDED
          normal *= faceDirection;
        #endif
      `)
      .replace('#include <lights_fragment_end>', /* glsl */ `
        #include <lights_fragment_end>
        reflectedLight.indirectDiffuse *= mix(0.55, 1.0, vGrassT);
        reflectedLight.directDiffuse *= mix(0.75, 1.0, vGrassT);
        vec3 bhV = normalize(cameraPosition - vGrassWorld);
        float bhBack = pow(clamp(dot(bhV, -uSunDirW), 0.0, 1.0), 2.5);
        reflectedLight.directDiffuse += diffuseColor.rgb * uSunColor * bhBack * uTranslucency * vGrassT;
      `)
      .replace('#include <dithering_fragment>', /* glsl */ `
        float bhFog = smoothstep(uFogNear, uFogFar, length(vGrassWorld - cameraPosition));
        gl_FragColor.rgb = mix(gl_FragColor.rgb, uFogColor, bhFog * uFogDensity);
        #include <dithering_fragment>
      `);
  };

  const mesh = new THREE.Mesh(bladeGeometry(), material);
  mesh.name = 'grassField';
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  // Every blade is placed by the shader, so no CPU bounding volume can describe them.
  mesh.frustumCulled = false;
  mesh.userData.cullingDisabledBecause = 'positions are computed in the vertex shader around Pip';
  return { mesh, uniforms, heightTex: textures.heightTex, maskTex: textures.maskTex };
}

/** A tier change: how dense and how far. Two uniforms and an instance count. */
export function setGrassTier(field: GrassField, tier: QualityTier): void {
  const { spacing, radius } = GRASS.byTier[tier];
  const grid = Math.ceil((radius * 2) / spacing);
  field.uniforms.uSpacing!.value = spacing;
  field.uniforms.uRadius!.value = radius;
  field.uniforms.uGrid!.value = grid;
  field.mesh.geometry.instanceCount = grid * grid;
}

/** One frame: follow Pip, advance the wind, take the sun and the fog. Allocates nothing. */
export function tickGrass(
  field: GrassField,
  pip: { x: number; y: number; z: number },
  timeS: number,
  sun: { dir: THREE.Vector3; color: THREE.Color },
  fog: { color: THREE.ColorRepresentation; near: number; far: number; density: number; windOn: boolean } | null,
): void {
  const u = field.uniforms;
  (u.uCenter!.value as THREE.Vector2).set(pip.x, pip.z);
  (u.uPip!.value as THREE.Vector3).set(pip.x, pip.y, pip.z);
  u.uTime!.value = timeS;
  (u.uSunDirW!.value as THREE.Vector3).copy(sun.dir);
  (u.uSunColor!.value as THREE.Color).copy(sun.color);
  if (fog) {
    (u.uFogColor!.value as THREE.Color).set(fog.color);
    u.uFogNear!.value = fog.near;
    u.uFogFar!.value = fog.far;
    u.uFogDensity!.value = fog.density;
    u.uWindAmp!.value = fog.windOn ? GRASS.windAmp : 0;
  }
}

export function disposeGrass(field: GrassField): void {
  field.mesh.geometry.dispose();
  field.mesh.material.dispose();
  field.heightTex.dispose();
  field.maskTex.dispose();
}
