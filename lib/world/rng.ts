/**
 * The only pseudo-random source in the world layer.
 *
 * `Math.random()` is banned in world generation (`01-RULES.md` §3.11): given the
 * same `(userId, tier, seed)` the island must be byte-identical on every device
 * and every load. Three copies of `mulberry32` used to live in the old world;
 * this is the one that replaces them.
 */

/** Seeded PRNG. Same seed → same sequence, forever, on every device. */
export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return function next(): number {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic 32-bit hash of a string — the bridge from `userId` to a seed. */
export function hashInt(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  // One extra avalanche round so short strings ('a', 'b') do not land adjacent.
  h ^= h >>> 16;
  h = Math.imul(h, 2246822507) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 3266489909) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

/** Deterministic 0..1 from a string — for "pick one of N" decisions. */
export function hash01(s: string): number {
  return hashInt(s) / 4294967296;
}

/** A PRNG seeded from a string. The usual entry point for layout generation. */
export function rngFrom(...parts: (string | number)[]): () => number {
  return mulberry32(hashInt(parts.join(':')));
}
