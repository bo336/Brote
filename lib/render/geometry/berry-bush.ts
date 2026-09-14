/**
 * El calafate: the bush you forage from (`11-GAME-LOOP.md` §3.5).
 *
 * The forage nodes had no shape at all — the objective card said "there is
 * something to pick nearby" over a patch of grass. A player has to be able to
 * see the thing, from far enough away to walk toward it, and see that it is
 * picked.
 *
 * Built the way the trees are (`tree.ts`) so it belongs next to them: a few
 * woody stems, a low dome of leaf cards from the painted atlas with normals bent
 * out from the bush's centre, and — separately, so the scene can take them away
 * when the bush is picked — clusters of blue-black berries on the skin of the
 * dome, each with a pale bloom on top.
 */
import * as THREE from 'three';

import { mulberry32 } from '@/lib/world/rng';
import { NATIVE } from '../palette';
import { mergePainted, paintVertical } from './build';
import { LEAF_TILE, tileUV } from './leaf-atlas';
import { mergePieces, type Piece } from './tree';

const RADIUS = 0.5;
const HEIGHT = 0.58;
// Dense: at 22 clusters of the fine tile the bush was a see-through wisp with
// berries floating in it.
const CLUSTERS = 46;
const CARDS_PER_CLUSTER = 4;
const CARD_M = 0.3;
// Many small berries, not a few marbles: at 3 cm they read as black blobs.
const BERRY_CLUSTERS = 18;
const BERRIES_PER_CLUSTER = 6;
const BERRY_M = 0.017;

export interface BerryBush {
  leaves: THREE.BufferGeometry;
  wood: THREE.BufferGeometry;
  berries: THREE.BufferGeometry;
  height: number;
}

/** A point on the dome's skin: `u` around, `v` from the rim (0) to the crown (1). */
function onDome(u: number, v: number, inset: number, out: THREE.Vector3): THREE.Vector3 {
  const a = u * Math.PI * 2;
  const r = RADIUS * Math.sqrt(1 - v * v) * (1 - inset);
  return out.set(Math.cos(a) * r, 0.08 + v * HEIGHT * (1 - inset * 0.5), Math.sin(a) * r);
}

export function berryBush(seed = 1): BerryBush {
  const rng = mulberry32(seed * 4099 + 17);
  const centre = new THREE.Vector3(0, HEIGHT * 0.38, 0);

  // ── Stems: short, forking, mostly hidden — enough that the bush stands on something.
  const wood: Piece[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + rng() * 0.6;
    const tip = new THREE.Vector3(Math.cos(a) * RADIUS * 0.55, HEIGHT * (0.45 + rng() * 0.25), Math.sin(a) * RADIUS * 0.55);
    const dir = tip.clone();
    const len = dir.length();
    const geo = new THREE.CylinderGeometry(0.012, 0.026, len, 5, 1);
    const m = new THREE.Matrix4().compose(
      dir.clone().multiplyScalar(0.5),
      new THREE.Quaternion().setFromUnitVectors(up, dir.normalize()),
      new THREE.Vector3(1, 1, 1),
    );
    wood.push({ geo, matrix: m });
  }
  const woodGeo = paintVertical(mergePieces(wood), NATIVE.barkDark, NATIVE.bark, 0.8);
  for (const p of wood) p.geo.dispose();

  // ── Leaves: cards on a low dome, lit as one volume.
  const tile = tileUV(LEAF_TILE.broad);
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const c = new THREE.Color();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const p = new THREE.Vector3();
  const corner = new THREE.Vector3();
  const outward = new THREE.Vector3();
  let top = 0;
  for (let k = 0; k < CLUSTERS; k++) {
    onDome(rng(), Math.pow(rng(), 0.8), rng() * 0.18, p);
    for (let j = 0; j < CARDS_PER_CLUSTER; j++) {
      const size = CARD_M * (0.75 + rng() * 0.5);
      e.set(rng() * Math.PI, rng() * Math.PI * 2, rng() * Math.PI);
      q.setFromEuler(e);
      const cx = p.x + (rng() - 0.5) * size * 0.5;
      const cy = p.y + (rng() - 0.5) * size * 0.3;
      const cz = p.z + (rng() - 0.5) * size * 0.5;
      outward.set(cx - centre.x, cy - centre.y + 0.2, cz - centre.z).normalize();
      const h = THREE.MathUtils.clamp(cy / HEIGHT, 0, 1);
      c.set(h > 0.66 ? NATIVE.calafateLeafLight : h > 0.33 ? NATIVE.calafateLeaf : NATIVE.calafateLeafDeep)
        .offsetHSL((rng() - 0.5) * 0.02, 0, (rng() - 0.5) * 0.06);
      const base = pos.length / 3;
      for (const [x, y, u, v] of [
        [-0.5, -0.5, tile[0], tile[1]], [0.5, -0.5, tile[2], tile[1]],
        [0.5, 0.5, tile[2], tile[3]], [-0.5, 0.5, tile[0], tile[3]],
      ] as const) {
        corner.set(x * size, y * size, 0).applyQuaternion(q).add(p.set(cx, cy, cz));
        pos.push(corner.x, corner.y, corner.z);
        nor.push(outward.x, outward.y, outward.z);
        uv.push(u, v);
        col.push(c.r, c.g, c.b);
        top = Math.max(top, corner.y);
      }
      p.set(cx, cy, cz);
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  const leaves = new THREE.BufferGeometry();
  leaves.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  leaves.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  leaves.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  leaves.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  leaves.setIndex(idx);

  // ── Berries: small clusters sitting just proud of the leaves, mostly on the sunny side.
  const parts: THREE.BufferGeometry[] = [];
  for (let k = 0; k < BERRY_CLUSTERS; k++) {
    onDome(rng(), 0.25 + rng() * 0.65, -0.04, p);
    for (let j = 0; j < BERRIES_PER_CLUSTER; j++) {
      const r = BERRY_M * (0.8 + rng() * 0.4);
      const berry = new THREE.IcosahedronGeometry(r, 2);
      berry.translate(p.x + (rng() - 0.5) * 0.07, p.y + (rng() - 0.5) * 0.05, p.z + (rng() - 0.5) * 0.07);
      // Dark body, the dusty bloom on top: the look of a real calafate berry.
      parts.push(paintVertical(berry, NATIVE.calafateBerry, NATIVE.calafateBerryBloom, 1.8));
    }
  }
  const berries = mergePainted(parts);
  return { leaves, wood: woodGeo, berries, height: top };
}
