/**
 * The world material — everything solid in the game.
 *
 * **Art direction v2 (`23-ART-DIRECTION-V2.md`).** This was a Lambert material
 * with light quantised into three bands, and the owner's first playtest called
 * the result "basic and generic". The bands are gone. The base is now
 * `MeshStandardMaterial` — a real sun with real soft shadows, a sky that fills
 * the shade — and on top of it the handful of things that make it ours:
 *
 *  - vertex colours as the primary colour channel, still;
 *  - **translucency**: foliage and grass let the sun through when you look at
 *    them against it, which is most of what golden-hour light *is*;
 *  - baked vertical AO where things meet the ground;
 *  - the Fresnel rim, now reserved for Pip, who must read against any ground;
 *  - wind on foliage, the occluder dither, the tier-up reveal, and height fog
 *    that warms toward the sun.
 *
 * All uniforms are shared through one mood and one sun, so time of day shifts
 * the whole scene by changing numbers — never by rebuilding a material.
 */
import * as THREE from 'three';

import { CLAY, FOG, LOOK, WIND, WOBBLE } from '@/lib/world/config';
import { BRAND } from '../palette';
import {
  CLAY_FRAG_HEAD, CLAY_VERT_HEAD, FADE_FRAG, FADE_VERT, GROUND_DETAIL_FRAG, HEIGHT_FOG_FRAG, REVEAL_FRAG,
  REVEAL_VERT, WIND_VERT, WOBBLE_VERT,
} from './chunks';
import { REVEAL_OFF, revealModeIndex, type RevealState } from '../reveal';

export interface WorldMood {
  rimColor: THREE.ColorRepresentation;
  fogColor: THREE.ColorRepresentation;
  fogNear: number;
  fogFar: number;
  /** 0 clear … 1 the full haze the CO₂ channel asks for. */
  fogDensity: number;
  /** Seconds, for the wind term only. The wobble is deliberately static. */
  time: number;
  /** Amplitudes the quality tier zeroes at T0 — uniforms, so a tier change never recompiles. */
  wobbleAmp: number;
  windAmp: number;
}

export interface ClayOptions {
  /** Foliage sways; ground, rock and props do not. Foliage is also translucent. */
  wind?: boolean;
  /** Off at T0, and off on anything that moves. */
  wobble?: boolean;
  /** Amplitude is a fraction of the object's size — a mountain wobbles more. */
  wobbleScale?: number;
  heightFog?: boolean;
  /** Vertical AO darkens where an object meets the ground. The ground itself opts out. */
  ao?: boolean;
  /** The Fresnel rim. On a ground plane every fragment is grazing, so terrain opts out. */
  rim?: boolean;
  /** Multiply the rim on this material only — Pip, who must read against any ground. */
  rimBoost?: number;
  vertexColors?: boolean;
  /** This mesh **is** the ground, for the tier-up uplift (`../reveal.ts`). */
  ground?: boolean;
  transparent?: boolean;
  side?: THREE.Side;
  color?: THREE.ColorRepresentation;
  /** Pip's pattern atlas, used as an alpha mask over the body's own colour. */
  alphaMap?: THREE.Texture | null;
  /** 0 mirror … 1 chalk. Most of the world is near 1; wet and waxy things are lower. */
  roughness?: number;
  /** An albedo texture multiplied by the vertex colour — the leaf atlas. */
  map?: THREE.Texture | null;
  /** Cut-out threshold for `map`'s alpha. Leaf cards, not glass. */
  alphaTest?: number;
}

export interface ClayMaterial extends THREE.MeshStandardMaterial {
  /** The shared uniform block. Mutate these; never rebuild the material. */
  clayUniforms: Record<string, THREE.IUniform>;
}

/** The fog band for a render distance — near is a fraction of far. */
export function fogRange(renderDistanceM: number): { near: number; far: number } {
  return { near: renderDistanceM * FOG.nearFraction, far: renderDistanceM };
}

const CREAM = BRAND.cream;
const DEFAULT_FOG = fogRange(60);

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
    uBandFloor: { value: CLAY.bandFloor },
    uRimColor: { value: new THREE.Color('#FFD9A0') },
    uRimStrength: { value: CLAY.rimStrength },
    uRimPower: { value: CLAY.rimPower },
    uAOStrength: { value: CLAY.aoStrength },
    uAOHeight: { value: CLAY.aoHeightM },
    uFogColor: { value: new THREE.Color(CREAM) },
    uFogNear: { value: DEFAULT_FOG.near },
    uFogFar: { value: DEFAULT_FOG.far },
    // Zero until a mood says otherwise: a default that fogs every fragment white is a trap.
    uFogDensity: { value: 0 },
    uSunDirW: { value: new THREE.Vector3(0.4, 0.8, 0.3).normalize() },
    uSunColor: { value: new THREE.Color(1, 0.9, 0.75) },
    uTranslucency: { value: LOOK.translucency },
    uRevealCentre: { value: new THREE.Vector3() },
    uRevealBare: { value: new THREE.Color(0.45, 0.42, 0.4) },
    uRevealRadius: { value: 1 },
    uRevealAmount: { value: 1 },
    uRevealMode: { value: 0 },
  };
}

/** Replace a three.js shader-chunk anchor, and **shout if the anchor is gone**. */
function inject(source: string, anchor: string, replacement: string): string {
  const out = source.replace(anchor, replacement);
  if (out === source && process.env.NODE_ENV !== 'production') {
    console.error(`[mundo] world shader anchor missing: ${anchor} — three.js renamed a chunk.`);
  }
  return out;
}

/** Build one material. Callers go through `getClayMaterial` in `./index`, which caches. */
export function createClayMaterial(opts: ClayOptions = {}): ClayMaterial {
  const mat = new THREE.MeshStandardMaterial({
    vertexColors: opts.vertexColors ?? true,
    transparent: opts.transparent ?? false,
    side: opts.side ?? THREE.FrontSide,
    color: opts.color ?? 0xffffff,
    alphaMap: opts.alphaMap ?? null,
    map: opts.map ?? null,
    alphaTest: opts.alphaTest ?? 0,
    roughness: opts.roughness ?? LOOK.roughness,
    metalness: 0,
  }) as ClayMaterial;

  const uniforms = defaultUniforms();
  uniforms.uRimStrength!.value = CLAY.rimStrength * (opts.rimBoost ?? 1);
  uniforms.uWobbleScale!.value = opts.wobbleScale ?? 1;
  mat.clayUniforms = uniforms;

  const defines: string[] = [];
  if (opts.wobble ?? true) defines.push('#define BH_WOBBLE');
  if (opts.wind) defines.push('#define BH_WIND', '#define BH_TRANSLUCENT');
  if (opts.heightFog ?? true) defines.push('#define BH_HEIGHT_FOG');
  if (opts.ao ?? true) defines.push('#define BH_AO');
  // The rim is Pip's now: on everything else it read as a glow painted round the edges.
  if ((opts.rim ?? true) && (opts.rimBoost ?? 1) > 1) defines.push('#define BH_RIM');
  if (opts.ground) defines.push('#define BH_REVEAL_GROUND');
  // Leaf cards carry the crown's normal on both faces; the default flip darkens every back face.
  if (opts.map && opts.side === THREE.DoubleSide) defines.push('#define BH_CARD_NORMALS');
  const defineBlock = defines.join('\n');

  /**
   * **The defines are part of the program's identity.** three keys its program
   * cache on `onBeforeCompile.toString()`, and every world material shares this
   * one function's source — so two materials with the same base parameters
   * shared ONE compiled program, whichever compiled first, whatever their own
   * defines said. Pip and the bench were drawn with the ground's shader, whose
   * rock-on-steep-faces detail painted every vertical surface stone grey; and
   * Pip's own uniforms were never bound, which is why zeroing his rim did nothing.
   */
  mat.customProgramCacheKey = () => `bh-world:${defines.join('|')}`;

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
        #ifdef USE_INSTANCING
          bhWorld = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
        #endif
        vClayWorld = bhWorld;
        vAOBase = modelMatrix[3].y;
        #ifdef USE_INSTANCING
          vAOBase = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).y;
        #endif
        ${REVEAL_VERT}
        ${WOBBLE_VERT}
        ${WIND_VERT}
        ${FADE_VERT}
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
        '#include <lights_fragment_end>',
        /* glsl */ `
        #include <lights_fragment_end>
        #ifdef BH_AO
          float bhAO = mix(1.0 - uAOStrength, 1.0, smoothstep(0.0, uAOHeight, vClayWorld.y - vAOBase));
          reflectedLight.indirectDiffuse *= bhAO;
          reflectedLight.directDiffuse *= mix(1.0, bhAO, 0.5);
        #endif
        #ifdef BH_TRANSLUCENT
          // Light through a leaf: strongest seen against the sun, tinted by the leaf itself.
          vec3 bhV = normalize(cameraPosition - vClayWorld);
          float bhBack = pow(clamp(dot(bhV, -uSunDirW), 0.0, 1.0), 3.0);
          reflectedLight.directDiffuse += diffuseColor.rgb * uSunColor * bhBack * uTranslucency;
        #endif
        `,
      ),
      '#include <opaque_fragment>',
      /* glsl */ `
        ${FADE_FRAG}
        #ifdef BH_RIM
          vec3 bhViewDir = normalize(vViewPosition);
          float bhRim = pow(1.0 - clamp(dot(normalize(vNormal), bhViewDir), 0.0, 1.0), uRimPower);
          outgoingLight += uRimColor * bhRim * uRimStrength;
        #endif
        #include <opaque_fragment>
      `,
    );

    shader.fragmentShader = inject(
      shader.fragmentShader,
      '#include <color_fragment>',
      /* glsl */ `
        #include <color_fragment>
        ${REVEAL_FRAG}
        #ifdef BH_REVEAL_GROUND
          ${GROUND_DETAIL_FRAG}
        #endif
      `,
    );

    shader.fragmentShader = inject(
      shader.fragmentShader,
      '#include <normal_fragment_begin>',
      /* glsl */ `
        #include <normal_fragment_begin>
        #if defined(BH_CARD_NORMALS) && defined(DOUBLE_SIDED)
          normal *= faceDirection;
        #endif
      `,
    );

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

/** Push the arrival state in. Four numbers and two colours, zero recompiles. */
export function applyReveal(mat: ClayMaterial, reveal: RevealState): void {
  const u = mat.clayUniforms;
  (u.uRevealCentre!.value as THREE.Vector3).set(...reveal.centre);
  (u.uRevealBare!.value as THREE.Color).setRGB(...reveal.bare);
  u.uRevealRadius!.value = reveal.radius;
  u.uRevealAmount!.value = reveal.amount;
  u.uRevealMode!.value = revealModeIndex(reveal.mode);
}

export const CLAY_REVEAL_OFF = REVEAL_OFF;

/** Push one mood into a material's uniforms. Zero recompiles. */
export function applyMood(mat: ClayMaterial, mood: WorldMood): void {
  const u = mat.clayUniforms;
  (u.uRimColor!.value as THREE.Color).set(mood.rimColor);
  (u.uFogColor!.value as THREE.Color).set(mood.fogColor);
  u.uFogNear!.value = mood.fogNear;
  u.uFogFar!.value = mood.fogFar;
  u.uFogDensity!.value = mood.fogDensity;
  u.uTime!.value = mood.time;
  u.uWobbleAmp!.value = mood.wobbleAmp;
  u.uWindAmp!.value = mood.windAmp;
}

/** The sun, for translucency and the fog's warm side. Called every frame; allocates nothing. */
export function applySun(mat: ClayMaterial, dirW: THREE.Vector3, color: THREE.Color): void {
  const u = mat.clayUniforms;
  (u.uSunDirW!.value as THREE.Vector3).copy(dirW);
  (u.uSunColor!.value as THREE.Color).copy(color);
}
