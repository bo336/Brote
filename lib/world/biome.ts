/**
 * Biome identity — and the bug fix at the centre of it.
 *
 * The old world decided which biome you were in by substring-matching a Spanish
 * display name (`n.includes('bosque')`, `'selva'`, `'costa'`…), which silently
 * degraded to "pradera" for every procedurally-named world from index 7 onward
 * (`02-AUDIT.md` §4). Species mix must come from an explicit `kind`, never from
 * a string match.
 *
 * This module WRAPS `lib/mundo.ts`'s `biomeFor` and never modifies it — that
 * file is contract-locked to Postgres (`01-RULES.md` §1).
 */
import { biomeFor, type BiomeTheme } from '../mundo';
import { CHALK_TARGET, CLAY } from './config';
import { hashInt } from './rng';
import type { BiomeKind } from './types';

/** The six curated biomes, in `lib/mundo.ts`'s order, mapped to their kind. */
const CURATED_KINDS: BiomeKind[] = ['pradera', 'bosque', 'costa', 'desierto', 'selva', 'tundra'];

export interface BiomeConfig extends BiomeTheme {
  /** The explicit identity. Never derived from `name`. */
  kind: BiomeKind;
  /** The same colours, desaturated toward the palette cream so biomes agree. */
  chalked: {
    ground: string;
    grass: string;
    leaf: string;
    leafDeep: string;
    accent: string;
    skyTop: string;
    skyHorizon: string;
    water: string;
  };
}

// ── Colour maths ────────────────────────────────────────────────────────────

function parseColor(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1]!, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Minimal `hsl(h, s%, l%)` support — `biomeFor` emits it for procedural worlds. */
function parseHsl(css: string): [number, number, number] | null {
  const m = /^hsl\(\s*(-?[\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)$/i.exec(css.trim());
  if (!m) return null;
  const h = ((Number(m[1]) % 360) + 360) % 360;
  const s = Number(m[2]) / 100;
  const l = Number(m[3]) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const mm = l - c / 2;
  const seg = Math.floor(h / 60) % 6;
  const rgb: [number, number, number][] = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ];
  const [r, g, b] = rgb[seg]!;
  return [(r + mm) * 255, (g + mm) * 255, (b + mm) * 255];
}

/**
 * Chalk: mix a colour toward the palette cream. Clay is pigment in a matte
 * binder, so nothing is fully saturated (`06-ART-DIRECTION.md` §2 rule 4). This
 * is the single function that makes free assets and six biome palettes read as
 * one material system. `lib/render/palette.ts` re-exports it — one implementation.
 */
export function chalk(color: string, amount: number = CLAY.chalkAmount): string {
  const src = parseColor(color) ?? parseHsl(color);
  if (!src) return color;
  const dst = parseColor(CHALK_TARGET)!;
  const t = Math.max(0, Math.min(1, amount));
  return toHex(
    src[0] + (dst[0] - src[0]) * t,
    src[1] + (dst[1] - src[1]) * t,
    src[2] + (dst[2] - src[2]) * t,
  );
}

// ── The wrapper ─────────────────────────────────────────────────────────────

/**
 * The kind of any world index. Curated worlds 1-6 map by position; beyond that
 * it is hashed from the index — deterministic, and never read off a name.
 */
export function biomeKind(worldIndex: number): BiomeKind {
  const i = Math.max(1, Math.floor(worldIndex));
  if (i <= CURATED_KINDS.length) return CURATED_KINDS[i - 1]!;
  return CURATED_KINDS[hashInt(`biome:${i}`) % CURATED_KINDS.length]!;
}

/** The biome for a world index, with its explicit kind and its chalked ramp. */
export function biomeConfig(worldIndex: number): BiomeConfig {
  const theme = biomeFor(Math.max(1, Math.floor(worldIndex)));
  return {
    ...theme,
    kind: biomeKind(worldIndex),
    chalked: {
      ground: chalk(theme.ground),
      grass: chalk(theme.grass),
      leaf: chalk(theme.leaf),
      leafDeep: chalk(theme.leafDeep),
      accent: chalk(theme.accent),
      skyTop: chalk(theme.skyTop),
      skyHorizon: chalk(theme.skyHorizon),
      water: chalk(theme.water),
    },
  };
}
