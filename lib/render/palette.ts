/**
 * The palette. **The only place a hex literal exists** (`06-ART-DIRECTION.md` §3).
 *
 * Clay is pigment in a matte binder: every colour is desaturated toward the
 * cream by 8-15%, and nothing is a fully saturated primary. Warm light, cool
 * shadow. That single relationship does 80% of the work the old world's five
 * post-processing passes were attempting.
 *
 * The chalk function itself lives in `lib/world/biome.ts` — chalking is colour
 * maths, not rendering, and the pure layer needs it to build biome ramps. It is
 * re-exported here so the render layer has one obvious door and one implementation.
 */
import { biomeConfig, chalk, type BiomeConfig } from '@/lib/world/biome';
import type { TimeOfDay } from '@/lib/world/types';

export { chalk };
export type { BiomeConfig };

/** Brand anchors, verbatim from `tailwind.config.ts`. Do not re-pick these. */
export const BRAND = {
  green: '#1FB57A',
  greenDeep: '#0E7A52',
  ink: '#0C1A13',
  inkSoft: '#16261D',
  cream: '#F7F5EF',
  creamSoft: '#FFFFFF',
  sun: '#FFB23E',
  coral: '#FF6B5E',
  aqua: '#2DB4D4',
} as const;

/** The 13 canonical domain colours. Accents only — never terrain. */
export const DOMAIN_COLORS = {
  residuos: '#C2703D',
  agua: '#2DB4D4',
  energia: '#F4A62A',
  movilidad: '#5B6CF0',
  plantas: '#3CB371',
  animales: '#E8638C',
  alimentacion: '#9CC93B',
  consumo: '#B07CD6',
  digital: '#3DC1C1',
  comunidad: '#FF8A3D',
  agua_azul: '#1E88A8',
  aire_suelo: '#A38B6D',
  ciencia: '#6FBF73',
} as const;

/** The world ramp. Every surface in the game takes its colour from here. */
export const CLAY = {
  soil: '#B08A63', // bare earth, paths, cliff faces
  soilDeep: '#8A6A49', // soil in shadow, undercuts
  sand: '#D9C9A8', // beach, shoreline
  grass: '#6FBF73', // ground cover
  grassDeep: '#3E8C5C', // grass in shadow, dense patches
  leaf: '#3CB371', // canopy
  leafDeep: '#0E7A52', // canopy underside
  bark: '#8C6E52', // trunks, wood props
  stone: '#A8A296', // rock, mountain
  stoneDeep: '#7A756B', // cliff shadow, cave
  snow: '#F2EFE6', // snow, tier 9+
  water: '#2DB4D4', // water surface
  waterDeep: '#1E88A8', // water depth
  foam: '#EAF7FA', // shoreline foam line
} as const;

/** The four lights. Warm key, cool fill — the whole lighting model (`06` §6). */
export const LIGHT = {
  key: '#FFE2AE', // sun, warm
  fill: '#AFCBE0', // sky bounce, cool
  rim: '#FFD9A0', // rim / back light
  nightKey: '#8FA8D8', // moon
  nightFill: '#2A3A54', // night sky bounce
} as const;

/**
 * Pip's body palettes, as `[body, bodyDeep, leaf, leafDeep]`.
 *
 * The first six are the **free set, verbatim from `components/pip/Pip.tsx`** —
 * do not re-pick them, and do not let them drift: `pip.test.ts` reads both files
 * and fails if they disagree. They are duplicated here rather than imported
 * because `lib/render` may not import `components/**` (`07-RENDER` §2), and
 * because a 32 px avatar must never pull in the renderer.
 *
 * The last five are the paid set from the live `cosmetics` table
 * (`09-PIP.md` §4), derived in the same shape and chalked to the world ramp.
 * **Both sets must render** — the old 3D Pip was a green blob that ignored
 * customisation entirely (`02-AUDIT.md` §5).
 */
export const PIP_PALETTES: Record<string, readonly [string, string, string, string]> = {
  clasico: ['#9CC93B', '#6FBF73', '#1FB57A', '#0E7A52'],
  cielo: ['#7EC8E3', '#4FA3C7', '#2DB4D4', '#1E88A8'],
  coral: ['#FF8A76', '#E86A5A', '#FF6B5E', '#C74A3E'],
  lavanda: ['#B99AE8', '#9A7BD0', '#B07CD6', '#8A5CB8'],
  sol: ['#FFD27A', '#F4A62A', '#FFB23E', '#E8950E'],
  noche: ['#7B8AF5', '#5B6CF0', '#6FBF73', '#0E7A52'],
  aurora: ['#8FE3C2', '#5FC79E', '#B08CE8', '#6E4FA8'],
  bosque: ['#3E8C5C', '#2C6B45', '#1FB57A', '#0E7A52'],
  atardecer: ['#FFB07A', '#E8875A', '#FF8A3D', '#C75E28'],
  glaciar: ['#BFE4F0', '#8CC4D8', '#7EC8E3', '#3D7E96'],
  cosmos: ['#6B5AA8', '#4A3D7A', '#9A7BD0', '#3A2E5E'],
};

/** Tier 11 hard-overrides to the `sol` set with a slow shimmer (`09-PIP.md` §4). */
export const PIP_GOLDEN = PIP_PALETTES.sol!;

/** Pip's non-palette colours: eyes, mouth, cheeks, the aura. */
export const PIP_PARTS = {
  eye: '#0C1A13', // ink, so the face reads at 32 px and at 3 m
  shine: '#FFFFFF',
  mouth: '#0C1A13',
  cheek: '#FF8A76',
  aura: '#1FB57A',
  auraGolden: '#FFB23E',
  metal: '#A8A296',
  cloth: '#F7F5EF',
} as const;

/** The one allowed gradient, for the tier-up title card and nothing else in-world. */
export const HERO_GRADIENT = 'linear-gradient(115deg, #0E7A52 0%, #1FB57A 45%, #FFB23E 100%)';

export interface LightPreset {
  keyColor: string;
  keyIntensity: number;
  fillSky: string;
  fillGround: string;
  fillIntensity: number;
  rimColor: string;
  rimIntensity: number;
  ambientColor: string;
  ambientIntensity: number;
  /** Sun elevation in degrees, for the key light's direction. */
  keyElevationDeg: number;
}

/**
 * Four authored presets, cross-faded over ~2 s — not a continuous sun
 * simulation. Intensities follow `06-ART-DIRECTION.md` §6.
 */
export const PRESETS: Record<TimeOfDay, LightPreset> = {
  amanecer: {
    keyColor: LIGHT.key, keyIntensity: 0.9, fillSky: LIGHT.fill, fillGround: CLAY.soilDeep,
    fillIntensity: 0.6, rimColor: LIGHT.rim, rimIntensity: 0.45,
    ambientColor: LIGHT.key, ambientIntensity: 0.14, keyElevationDeg: 12,
  },
  dia: {
    keyColor: LIGHT.key, keyIntensity: 1.1, fillSky: LIGHT.fill, fillGround: CLAY.soilDeep,
    fillIntensity: 0.55, rimColor: LIGHT.rim, rimIntensity: 0.35,
    ambientColor: LIGHT.key, ambientIntensity: 0.12, keyElevationDeg: 35,
  },
  atardecer: {
    keyColor: BRAND.sun, keyIntensity: 1.0, fillSky: LIGHT.fill, fillGround: CLAY.soilDeep,
    fillIntensity: 0.5, rimColor: LIGHT.rim, rimIntensity: 0.5,
    ambientColor: LIGHT.rim, ambientIntensity: 0.14, keyElevationDeg: 8,
  },
  noche: {
    keyColor: LIGHT.nightKey, keyIntensity: 0.4, fillSky: LIGHT.nightFill, fillGround: BRAND.ink,
    fillIntensity: 0.4, rimColor: LIGHT.nightKey, rimIntensity: 0.28,
    ambientColor: LIGHT.nightFill, ambientIntensity: 0.16, keyElevationDeg: 45,
  },
};

export interface WorldPalette {
  ground: string;
  grass: string;
  leaf: string;
  leafDeep: string;
  accent: string;
  water: string;
  waterDeep: string;
  foam: string;
  skyTop: string;
  skyHorizon: string;
  /** Fog matches the sky horizon — fog is the depth cue in this game. */
  fog: string;
  light: LightPreset;
}

/**
 * The palette for a biome at a time of day. The biome's own hues come through
 * `chalk()`, so all six curated biomes and every procedural one beyond share a
 * single material feel.
 */
export function paletteFor(biome: BiomeConfig, tod: TimeOfDay): WorldPalette {
  const c = biome.chalked;
  const night = tod === 'noche';
  return {
    ground: c.ground,
    grass: c.grass,
    leaf: c.leaf,
    leafDeep: c.leafDeep,
    accent: c.accent,
    water: c.water,
    waterDeep: chalk(CLAY.waterDeep),
    foam: CLAY.foam,
    skyTop: night ? BRAND.inkSoft : c.skyTop,
    skyHorizon: night ? LIGHT.nightFill : c.skyHorizon,
    fog: night ? LIGHT.nightFill : c.skyHorizon,
    light: PRESETS[tod],
  };
}

/** The palette for a world index, without the caller reaching for `lib/mundo`. */
export function paletteForWorld(worldIndex: number, tod: TimeOfDay): WorldPalette {
  return paletteFor(biomeConfig(worldIndex), tod);
}
