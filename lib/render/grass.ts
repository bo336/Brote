/**
 * The grass: hundreds of thousands of thin blades, generated on the GPU.
 *
 * **Three rings around Pip.** Up close, dense thin blades with five bends each;
 * a few metres out, sparser blades with three; far out, a carpet of single
 * triangles. Each ring owns an annulus and cross-fades into the next, so the
 * field looks equally full from the ground and from above, and the triangle
 * budget goes where the eye can resolve it. A quality tier moves spacings, radii
 * and instance counts — never geometry.
 *
 * Every blade's position is derived in the vertex shader from its instance
 * number and a window centred on Pip, **anchored to world cells** so blades stay
 * put as the window slides. Ground height and a density-and-colour mask come from
 * two small textures baked once from the heightfield, so blades sit exactly on
 * the terrain and never grow on paths, sand, rock, water or snow. The mask is
 * also handed to the ground material, which darkens under dense grass so the
 * gaps between blades read as depth rather than as bare floor.
 *
 * The look itself — taper, twist, rolled normal, tones, gusts, translucency — is
 * in `grass-shader.ts`.
 */
import * as THREE from 'three';

import { GRASS, WATER_LEVEL } from '@/lib/world/config';
import type { BiomeConfig } from '@/lib/world/biome';
import { coastRadiusAt, regionAt, type IslandLayout } from '@/lib/world/layout';
import { pathsFor, pathWeight } from '@/lib/world/paths';
import { REGION_CHARACTER } from '@/lib/world/regions';
import { fbm, sampleSlope, type Heightfield } from '@/lib/world/terrain';
import type { QualityTier } from '@/lib/world/types';
import { groundColor, moistureAt, patchAt, primeRamp, scratch } from './geometry/ground-paint';
import { pathInfo } from './geometry/path-map';
import { heightTextureFor } from './height-texture';
import {
  GRASS_FRAG_COLOR, GRASS_FRAG_FOG, GRASS_FRAG_HEAD, GRASS_FRAG_LIGHT, GRASS_VERT_BLADE, GRASS_VERT_HEAD,
  GRASS_VERT_POSITION,
} from './grass-shader';
import type { WorldPalette } from './palette';

export interface GrassTextures {
  heightTex: THREE.DataTexture;
  maskTex: THREE.DataTexture;
}

interface GrassRing {
  mesh: THREE.Mesh<THREE.InstancedBufferGeometry, THREE.MeshStandardMaterial>;
  uniforms: Record<string, THREE.IUniform>;
}

export interface GrassSystem {
  group: THREE.Group;
  rings: GrassRing[];
  /** Shared by every ring: the textures, time, Pip, the sun and the fog. */
  common: Record<string, THREE.IUniform>;
  textures: GrassTextures;
}

/** The two baked textures: ground height, and where grass grows in what colour. */
export function bakeGrassTextures(
  hf: Heightfield, layout: IslandLayout, palette: WorldPalette, biome: BiomeConfig, worldTier: number,
): GrassTextures {
  const { res, extent, step, data } = hf;
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

  // Shared with the water, which measures its depth against it.
  const heightTex = heightTextureFor(hf, layout);
  const maskTex = new THREE.DataTexture(mask, res, res, THREE.RGBAFormat, THREE.UnsignedByteType);
  maskTex.magFilter = maskTex.minFilter = THREE.LinearFilter;
  maskTex.needsUpdate = true;
  return { heightTex, maskTex };
}

/** One blade: a strip with `segments` bends and a single-vertex point. */
function bladeGeometry(segments: number): THREE.InstancedBufferGeometry {
  const pos: number[] = [];
  const idx: number[] = [];
  for (let s = 0; s < segments; s++) {
    const y = s / segments;
    pos.push(-0.5, y, 0, 0.5, y, 0);
  }
  pos.push(0, 1, 0);
  for (let s = 0; s < segments - 1; s++) {
    const a = s * 2;
    idx.push(a, a + 1, a + 3, a, a + 3, a + 2);
  }
  const top = (segments - 1) * 2;
  idx.push(top, top + 1, segments * 2);
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(pos.map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
  geo.setIndex(idx);
  geo.instanceCount = 0;
  return geo;
}

function createRing(segments: number, common: Record<string, THREE.IUniform>): GrassRing {
  const uniforms: Record<string, THREE.IUniform> = {
    uSpacing: { value: 1 },
    uGrid: { value: 1 },
    uInner: { value: 0 },
    uOuter: { value: 0 },
    uBladeW: { value: GRASS.bladeWidthM },
  };
  const material = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.55, metalness: 0 });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, common, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${GRASS_VERT_HEAD}`)
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>\n${GRASS_VERT_BLADE}`)
      .replace('#include <begin_vertex>', GRASS_VERT_POSITION);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${GRASS_FRAG_HEAD}`)
      .replace('#include <color_fragment>', `#include <color_fragment>\n${GRASS_FRAG_COLOR}`)
      .replace('#include <normal_fragment_begin>', `#include <normal_fragment_begin>
        #ifdef DOUBLE_SIDED
          normal *= faceDirection;
        #endif`)
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>\n${GRASS_FRAG_LIGHT}`)
      .replace('#include <dithering_fragment>', `${GRASS_FRAG_FOG}\n#include <dithering_fragment>`);
  };
  // Every ring shares one program; only its uniforms differ.
  material.customProgramCacheKey = () => 'bh-grass';

  const mesh = new THREE.Mesh(bladeGeometry(segments), material);
  mesh.name = `grass${segments}`;
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  mesh.frustumCulled = false;
  mesh.userData.cullingDisabledBecause = 'blade positions are computed in the vertex shader around Pip';
  return { mesh, uniforms };
}

export function createGrassSystem(textures: GrassTextures, hf: Heightfield, pathMap: THREE.Texture): GrassSystem {
  const common: Record<string, THREE.IUniform> = {
    uHeightTex: { value: textures.heightTex },
    uMaskTex: { value: textures.maskTex },
    uPathMap: { value: pathMap },
    uPathInfo: { value: pathInfo(hf.extent, new THREE.Vector4()) },
    uRes: { value: hf.res },
    uStep: { value: hf.step },
    uExtent: { value: hf.extent },
    uCenter: { value: new THREE.Vector2() },
    uRingFade: { value: GRASS.ringFadeM },
    uBladeH: { value: GRASS.bladeHeightM },
    uTime: { value: 0 },
    uPip: { value: new THREE.Vector3() },
    uPushR: { value: GRASS.pushRadiusM },
    uWindAmp: { value: GRASS.windAmp },
    uWindDir: { value: new THREE.Vector2(...GRASS.windDir).normalize() },
    uSunDirW: { value: new THREE.Vector3(0.4, 0.8, 0.3).normalize() },
    uSunColor: { value: new THREE.Color(1, 0.9, 0.75) },
    uTranslucency: { value: GRASS.translucency },
    uFogColor: { value: new THREE.Color('#DCEBF2') },
    uFogNear: { value: 20 },
    uFogFar: { value: 80 },
    uFogDensity: { value: 0 },
  };
  const group = new THREE.Group();
  group.name = 'grass';
  const rings = GRASS.ringSegments.map((segments) => createRing(segments, common));
  for (const ring of rings) group.add(ring.mesh);
  return { group, rings, common, textures };
}

/** A tier change: spacing, reach and instance counts per ring. No geometry is rebuilt. */
export function setGrassTier(system: GrassSystem, tier: QualityTier): void {
  GRASS.byTier[tier].forEach((cfg, i) => {
    const ring = system.rings[i];
    if (!ring) return;
    const grid = cfg.outer > 0 ? Math.ceil((cfg.outer * 2) / cfg.spacing) : 0;
    ring.uniforms.uSpacing!.value = cfg.spacing;
    ring.uniforms.uGrid!.value = Math.max(1, grid);
    ring.uniforms.uInner!.value = cfg.inner;
    ring.uniforms.uOuter!.value = cfg.outer;
    ring.uniforms.uBladeW!.value = GRASS.bladeWidthM * cfg.width;
    ring.mesh.geometry.instanceCount = grid * grid;
    ring.mesh.visible = grid > 0;
  });
}

/** One frame: follow Pip, advance the wind, take the sun and the fog. Allocates nothing. */
export function tickGrass(
  system: GrassSystem,
  pip: { x: number; y: number; z: number },
  timeS: number,
  sun: { dir: THREE.Vector3; color: THREE.Color },
  fog: { color: THREE.ColorRepresentation; near: number; far: number; density: number; windOn: boolean } | null,
): void {
  const u = system.common;
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

export function disposeGrass(system: GrassSystem): void {
  for (const ring of system.rings) {
    ring.mesh.geometry.dispose();
    ring.mesh.material.dispose();
  }
  // The height texture is shared and belongs to the texture cache.
  system.textures.maskTex.dispose();
}
