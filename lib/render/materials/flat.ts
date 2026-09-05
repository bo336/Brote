/**
 * `flatMaterial` — UI-in-world, particles and decals.
 *
 * `MeshBasicMaterial` with `toneMapped: false` for sparkles, blob-shadow decals
 * and world-space markers. **Keep it to a handful of objects.** The old world's
 * failure was FX stickers scattered through a tone-mapped scene: they sat inside
 * an ACES pipeline and read as stickers (`02-AUDIT.md` §3).
 *
 * The new canvas uses `NoToneMapping`, so a flat material and a clay material
 * finally agree about what a colour is.
 */
import * as THREE from 'three';

export interface FlatOptions {
  color?: THREE.ColorRepresentation;
  /** The sky, the mist wall and the stars carry their colour per vertex. */
  vertexColors?: boolean;
  map?: THREE.Texture | null;
  transparent?: boolean;
  opacity?: number;
  depthWrite?: boolean;
  side?: THREE.Side;
}

export function createFlatMaterial(opts: FlatOptions = {}): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: opts.color ?? 0xffffff,
    vertexColors: opts.vertexColors ?? false,
    map: opts.map ?? null,
    transparent: opts.transparent ?? true,
    opacity: opts.opacity ?? 1,
    depthWrite: opts.depthWrite ?? false,
    side: opts.side ?? THREE.DoubleSide,
    toneMapped: false,
  });
}
