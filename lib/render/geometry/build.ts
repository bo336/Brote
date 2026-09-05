/**
 * The shared geometry toolkit: paint a shape, merge shapes, one implementation
 * each.
 *
 * Everything in this build is generated rather than loaded, so nearly every
 * builder needs the same two operations — put a colour in `attributes.color`,
 * and fold a pile of transformed primitives into one buffer. Three files had
 * grown their own copy of both; this is the one that replaces them.
 *
 * Colour lives per vertex because the art direction has almost no textures
 * (`06-ART-DIRECTION.md` §4.1): zero texture memory, free per-vertex variation,
 * and one material can draw a whole scene.
 */
import * as THREE from 'three';

const scratchA = new THREE.Color();
const scratchB = new THREE.Color();

/** Paint every vertex one colour. */
export function paintFlat(geo: THREE.BufferGeometry, hex: string): THREE.BufferGeometry {
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  scratchA.set(hex);
  for (let i = 0; i < pos.count; i++) {
    colors[i * 3] = scratchA.r;
    colors[i * 3 + 1] = scratchA.g;
    colors[i * 3 + 2] = scratchA.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

/**
 * Paint a vertical ramp: `low` at the base, `high` at the top. `softness` below
 * 1 biases toward the top colour, which is usually what a plant wants — a blade
 * that is dark for most of its length reads as a stem, not as grass.
 */
export function paintVertical(
  geo: THREE.BufferGeometry,
  low: string,
  high: string,
  softness = 1,
): THREE.BufferGeometry {
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  geo.computeBoundingBox();
  const box = geo.boundingBox!;
  const span = Math.max(1e-4, box.max.y - box.min.y);
  scratchA.set(low);
  scratchB.set(high);
  for (let i = 0; i < pos.count; i++) {
    const t = Math.pow(Math.min(1, Math.max(0, (pos.getY(i) - box.min.y) / span)), softness);
    colors[i * 3] = scratchA.r + (scratchB.r - scratchA.r) * t;
    colors[i * 3 + 1] = scratchA.g + (scratchB.g - scratchA.g) * t;
    colors[i * 3 + 2] = scratchA.b + (scratchB.b - scratchA.b) * t;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

/**
 * Merge already-transformed, already-painted geometries into one buffer.
 *
 * Every input is disposed: they are throwaway primitives, and leaving them
 * alive is exactly the leak the old world shipped (`02-AUDIT.md` §7).
 */
export function mergePainted(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  let total = 0;
  const flattened = parts.map((p) => (p.index ? p.toNonIndexed() : p));
  for (const g of flattened) total += (g.attributes.position as THREE.BufferAttribute).count;

  const position = new Float32Array(total * 3);
  const normal = new Float32Array(total * 3);
  const color = new Float32Array(total * 3);
  let offset = 0;

  for (let k = 0; k < flattened.length; k++) {
    const g = flattened[k]!;
    const gp = g.attributes.position as THREE.BufferAttribute;
    const gn = g.attributes.normal as THREE.BufferAttribute | undefined;
    const gc = g.attributes.color as THREE.BufferAttribute | undefined;
    for (let i = 0; i < gp.count; i++) {
      const o = (offset + i) * 3;
      position[o] = gp.getX(i);
      position[o + 1] = gp.getY(i);
      position[o + 2] = gp.getZ(i);
      normal[o] = gn ? gn.getX(i) : 0;
      normal[o + 1] = gn ? gn.getY(i) : 1;
      normal[o + 2] = gn ? gn.getZ(i) : 0;
      color[o] = gc ? gc.getX(i) : 1;
      color[o + 1] = gc ? gc.getY(i) : 1;
      color[o + 2] = gc ? gc.getZ(i) : 1;
    }
    offset += gp.count;
    if (g !== parts[k]) g.dispose();
    parts[k]!.dispose();
  }

  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(position, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(normal, 3));
  out.setAttribute('color', new THREE.BufferAttribute(color, 3));
  return out;
}

/**
 * A bevelled box. **Clay has no corners** (`06-ART-DIRECTION.md` §2 rule 1), so
 * planks, benches and posts are built from this rather than from `BoxGeometry`.
 * A rounded box is a squashed sphere with enough segments to keep its edges.
 */
export function bevelBox(w: number, h: number, d: number, hex: string): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(0.5, 10, 6);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  // Push the sphere out toward a cube, leaving the corners rounded.
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const m = Math.max(Math.abs(x), Math.abs(y), Math.abs(z)) || 1;
    const k = 0.72;
    pos.setXYZ(i, (x / m) * 0.5 * k + x * (1 - k), (y / m) * 0.5 * k + y * (1 - k), (z / m) * 0.5 * k + z * (1 - k));
  }
  geo.scale(w, h, d);
  geo.computeVertexNormals();
  return paintFlat(geo, hex);
}

/** A rounded post standing on the ground, its base at y = 0. */
export function post(radius: number, height: number, hex: string, segments = 6): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(radius * 0.85, radius, height, segments, 1);
  geo.translate(0, height / 2, 0);
  return paintFlat(geo, hex);
}
