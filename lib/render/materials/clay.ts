/**
 * `clayMaterial` — everything solid in the game.
 *
 * `MeshLambertMaterial` (cheap, diffuse-only, no specular) extended through
 * `onBeforeCompile`. **Not `MeshStandardMaterial`**: PBR buys nothing in a
 * chalk-matte art direction and costs a lot (`18-DECISIONS.md` T4). Not
 * `MeshToonMaterial` either — a hand-rolled 3-band quantise gives more control
 * than a gradient-map lookup.
 *
 * It provides, in order of importance: vertex colours as the primary colour
 * channel, a 3-band diffuse quantise, an added Fresnel rim, baked vertical AO,
 * the global wobble, and height fog.
 *
 * All uniforms are driven from ONE mood object, so time of day and biome shift
 * the whole scene by changing ~11 numbers — never by re-creating a material.
 * Every new material is a shader compile, which is a visible hitch on cheap
 * Android (`06-ART-DIRECTION.md` §4).
 */
import * as THREE from 'three';

import { CLAY, FOG, WIND, WOBBLE } from '@/lib/world/config';
import { BRAND } from '../palette';
import { CLAY_FRAG_HEAD, CLAY_VERT_HEAD, HEIGHT_FOG_FRAG, WIND_VERT, WOBBLE_VERT } from './chunks';

export interface WorldMood {
  rimColor: THREE.ColorRepresentation;
  fogColor: THREE.ColorRepresentation;
  fogNear: number;
  fogFar: number;
  /** 0 clear … 1 the full haze the CO₂ channel asks for. */
  fogDensity: number;
  /** Seconds, for the wind term only. The wobble is deliberately static. */
  time: number;
}

export interface ClayOptions {
  /** Foliage sways; ground, rock and props do not. */
  wind?: boolean;
  /** Off at T0, and off on anything that moves. */
  wobble?: boolean;
  /** Amplitude is a fraction of the object's size — a mountain wobbles more. */
  wobbleScale?: number;
  heightFog?: boolean;
  /**
   * Vertical AO darkens where an object meets the ground. The GROUND is that
   * reference surface, so it opts out — otherwise the terrain darkens itself.
   */
  ao?: boolean;
  vertexColors?: boolean;
  transparent?: boolean;
  side?: THREE.Side;
  color?: THREE.ColorRepresentation;
}

export interface ClayMaterial extends THREE.MeshLambertMaterial {
  /** The shared uniform block. Mutate these; never rebuild the material. */
  clayUniforms: Record<string, THREE.IUniform>;
}

/** The fog band for a render distance — near is a fraction of far (`06` §4). */
export function fogRange(renderDistanceM: number): { near: number; far: number } {
  return { near: renderDistanceM * FOG.nearFraction, far: renderDistanceM };
}

const CREAM = BRAND.cream;

/** The T1 render distance, so an unmoodied material still has a sane fog band. */
const DEFAULT_FOG = fogRange(60);

/** The default uniform block, straight from `lib/world/config.ts`. */
function defaultUniforms(): Record<string, THREE.IUniform> {
  return {
    uTime: { value: 0 },
    uWobbleFreq: { value: WOBBLE.freq },
    uWobbleAmp: { value: WOBBLE.amp },
    uWobbleScale: { value: 1 },
    uWindAmp: { value: WIND.amp },
    uWindHz: { value: WIND.hz },
    uWindGustHz: { value: WIND.gustHz },
    uWindHeightBias: { value: WIND.heightBias },
    uBandCount: { value: CLAY.bandCount },
    uBandSoftness: { value: CLAY.bandSoftness },
    uRimColor: { value: new THREE.Color('#FFD9A0') },
    uRimStrength: { value: CLAY.rimStrength },
    uRimPower: { value: CLAY.rimPower },
    uAOStrength: { value: CLAY.aoStrength },
    uAOHeight: { value: CLAY.aoHeightM },
    uFogColor: { value: new THREE.Color(CREAM) },
    uFogNear: { value: DEFAULT_FOG.near },
    uFogFar: { value: DEFAULT_FOG.far },
    // Zero until a mood says otherwise. A material whose DEFAULT state paints
    // the world solid white is not a default, it is a trap: `near 0, far 1`
    // fogs every fragment at full strength the moment it is drawn.
    uFogDensity: { value: 0 },
  };
}

/**
 * Replace a three.js shader-chunk anchor, and **shout if the anchor is gone**.
 *
 * `String.replace` on a missing needle silently returns the input, so a chunk
 * that three renamed takes the whole clay read out of the material with no
 * error anywhere. That is exactly how the band quantise and the vertical AO
 * came to be missing while everything still "worked": the material compiled,
 * drew, and looked wrong. Never let that be silent again.
 */
function inject(source: string, anchor: string, replacement: string): string {
  const out = source.replace(anchor, replacement);
  if (out === source && process.env.NODE_ENV !== 'production') {
    console.error(`[mundo] clay shader anchor missing: ${anchor} — three.js renamed a chunk.`);
  }
  return out;
}

/**
 * Build one clay material. Callers go through `getClayMaterial` in `./index` so
 * the cache keeps the live-material count inside the budget of eight.
 */
export function createClayMaterial(opts: ClayOptions = {}): ClayMaterial {
  const mat = new THREE.MeshLambertMaterial({
    vertexColors: opts.vertexColors ?? true,
    transparent: opts.transparent ?? false,
    side: opts.side ?? THREE.FrontSide,
    color: opts.color ?? 0xffffff,
  }) as ClayMaterial;

  const uniforms = defaultUniforms();
  uniforms.uWobbleScale!.value = opts.wobbleScale ?? 1;
  mat.clayUniforms = uniforms;

  // The defines decide which chunks compile in at all, so a T0 device pays
  // nothing for a wobble it will never see.
  const defines: string[] = [];
  if (opts.wobble ?? true) defines.push('#define BH_WOBBLE');
  if (opts.wind) defines.push('#define BH_WIND');
  if (opts.heightFog ?? true) defines.push('#define BH_HEIGHT_FOG');
  if (opts.ao ?? true) defines.push('#define BH_AO');
  const defineBlock = defines.join('\n');

  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);

    shader.vertexShader = inject(
      inject(
        inject(shader.vertexShader, '#include <common>', `#include <common>
${defineBlock}
${CLAY_VERT_HEAD}`),
        '#include <begin_vertex>',
        /* glsl */ `
        #include <begin_vertex>
        vec3 bhWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
        vClayWorld = bhWorld;
        // The AO base is the object's own origin in world space, so a tall tree
        // and a low rock both darken over the same 0.6 m above the ground.
        vAOBase = modelMatrix[3].y;
        ${WOBBLE_VERT}
        ${WIND_VERT}
        `,
      ),
      '#include <fog_vertex>',
      /* glsl */ `
        #include <fog_vertex>
        vFogDepth = -mvPosition.z;
      `,
    );

    shader.fragmentShader = inject(
      inject(
        inject(shader.fragmentShader, '#include <common>', `#include <common>
${defineBlock}
${CLAY_FRAG_HEAD}`),
        // `lights_fragment_end` is where `reflectedLight` is finally accumulated.
        // (The old `lights_lambert_fragment` chunk this originally anchored on
        // has not existed in three for many versions — see `inject` below.)
        '#include <lights_fragment_end>',
        /* glsl */ `
        #include <lights_fragment_end>
        // 1. Quantise the diffuse light into bands — this IS the clay read.
        float bhLum = dot(reflectedLight.directDiffuse, vec3(0.2126, 0.7152, 0.0722));
        float bhBanded = bh_bands(clamp(bhLum, 0.0, 1.0));
        reflectedLight.directDiffuse *= bhLum > 0.0001 ? bhBanded / bhLum : 1.0;
        // 2. Baked vertical AO: darken the base of every object. Replaces SSAO.
        #ifdef BH_AO
          float bhAO = mix(1.0 - uAOStrength, 1.0, smoothstep(0.0, uAOHeight, vClayWorld.y - vAOBase));
          reflectedLight.indirectDiffuse *= bhAO;
        #endif
        `,
      ),
      // The rim goes in BEFORE the output encoding, in the same linear space as
      // the bands. Added, never multiplied.
      '#include <opaque_fragment>',
      /* glsl */ `
        vec3 bhViewDir = normalize(vViewPosition);
        float bhRim = pow(1.0 - clamp(dot(normalize(vNormal), bhViewDir), 0.0, 1.0), uRimPower);
        outgoingLight += uRimColor * bhRim * uRimStrength;
        #include <opaque_fragment>
      `,
    );

    // Height fog goes last, after three's own output encoding — the same place
    // three puts its fog, so the two agree about what a colour is.
    shader.fragmentShader = inject(
      shader.fragmentShader,
      '#include <dithering_fragment>',
      /* glsl */ `
        ${HEIGHT_FOG_FRAG}
        #include <dithering_fragment>
      `,
    );

    shader.vertexShader = shader.vertexShader.replace(
      'varying vec3 vClayWorld;',
      `varying vec3 vClayWorld;
varying float vAOBase;`,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      'varying vec3 vClayWorld;',
      `varying vec3 vClayWorld;
varying float vAOBase;`,
    );
  };

  return mat;
}

/** Push one mood into a material's uniforms. Eleven numbers, zero recompiles. */
export function applyMood(mat: ClayMaterial, mood: WorldMood): void {
  const u = mat.clayUniforms;
  (u.uRimColor!.value as THREE.Color).set(mood.rimColor);
  (u.uFogColor!.value as THREE.Color).set(mood.fogColor);
  u.uFogNear!.value = mood.fogNear;
  u.uFogFar!.value = mood.fogFar;
  u.uFogDensity!.value = mood.fogDensity;
  u.uTime!.value = mood.time;
}

