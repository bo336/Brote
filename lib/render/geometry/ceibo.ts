/**
 * El Ceibo — the one thing on the island that only real actions grow
 * (`docs/MUNDO_JUEGO.md` §3.10).
 *
 * The tree itself is a short gnarled trunk under a wide umbrella crown in the
 * ceibo's own greens; the flowers are separate instances, one per real action,
 * so the count on the tree is the count in the app — literally. Around its
 * roots, the four measured channels: a spring (water), a flowerbed where the
 * rubbish was (waste), paper lanterns (energy), and the crown itself for CO₂,
 * which is the air it cleans.
 */
import * as THREE from 'three';

import { mulberry32 } from '@/lib/world/rng';
import { CLAY, NATIVE } from '../palette';
import { bevelBox, mergePainted, paintFlat, paintVertical } from './build';
import { LEAF_TILE } from './leaf-atlas';
import { flower, smoothRock } from './scatter';
import { growTree, type TreeBuild } from './tree';

export const CEIBO_SEED = 1301;

/** The tree, at full size. The scene scales it by how many actions there are. */
export function ceiboTree(): TreeBuild {
  return growTree('oak', CEIBO_SEED, 0, {
    trunkH: 1.25, trunkR: 0.17, flare: 2.1, crown: 'umbrella', crownR: 1.75, crownH: 0.95,
    clusters: 62, cardSize: 0.5, cardsPerCluster: 4, tile: LEAF_TILE.broad,
    leaf: [NATIVE.ceiboLeafDeep, NATIVE.ceiboLeaf, NATIVE.ceiboLeafLight], bloom: 0,
    bark: [NATIVE.barkDark, NATIVE.bark],
  });
}

/**
 * One ceibo flower: the crest — a few long, curled scarlet petals and a
 * small green calyx. About fifteen centimetres; they hang in the crown's skin.
 */
export function ceiboFlower(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  // A short green stalk and cup…
  const stalk = new THREE.CylinderGeometry(0.005, 0.007, 0.05, 4, 1);
  stalk.translate(0, -0.025, 0);
  parts.push(paintFlat(stalk, NATIVE.ceiboLeafDeep));
  const cup = new THREE.SphereGeometry(0.014, 6, 5);
  cup.scale(1, 1.4, 1);
  parts.push(paintFlat(cup, NATIVE.ceiboLeafDeep));
  // …the big upright banner, curled back like a crest…
  const banner = new THREE.SphereGeometry(0.03, 8, 6);
  banner.scale(0.9, 1.9, 0.35);
  banner.translate(0, 0.045, -0.01);
  banner.rotateX(-0.35);
  parts.push(paintVertical(banner, '#A3122A', '#E8303F', 0.7));
  // …and the keel pointing forward, a darker red.
  const keel = new THREE.SphereGeometry(0.018, 6, 5);
  keel.scale(0.7, 0.8, 2.1);
  keel.translate(0, 0.012, 0.03);
  parts.push(paintFlat(keel, '#B3162E'));
  return mergePainted(parts);
}

/**
 * Where the flowers hang, taken from the foliage itself: points on the outer,
 * upper skin of the leaf cards, picked evenly through the crown so the first
 * dozen already read as "flowering" and the hundredth still lands somewhere
 * new. Relative to the tree's foot, at scale 1: `[x, y, z, rotY]`.
 */
export function ceiboFlowerPointsOn(leaves: THREE.BufferGeometry, n: number): [number, number, number, number][] {
  const pos = leaves.attributes.position as THREE.BufferAttribute | undefined;
  if (!pos || n <= 0) return [];
  leaves.computeBoundingBox();
  const box = leaves.boundingBox!;
  const maxR = Math.max(box.max.x, -box.min.x, box.max.z, -box.min.z);
  const skin: number[] = [];
  for (let i = 0; i < pos.count; i += 2) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const r = Math.hypot(x, z);
    const up = (y - box.min.y) / Math.max(1e-3, box.max.y - box.min.y);
    if (up > 0.35 && r > maxR * 0.35) skin.push(i);
  }
  if (skin.length === 0) return [];
  const rng = mulberry32(CEIBO_SEED + 11);
  const out: [number, number, number, number][] = [];
  for (let k = 0; k < n; k++) {
    // Golden-ratio stride: even coverage at any count, stable as the count grows.
    const i = skin[Math.floor(((k * 0.61803398875) % 1) * skin.length)]!;
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const r = Math.hypot(x, z) || 1;
    // A few centimetres out of the leaves, so they are not buried in them.
    out.push([x + (x / r) * 0.06, pos.getY(i) + 0.04, z + (z / r) * 0.06, rng() * Math.PI * 2]);
  }
  return out;
}

/** The spring at the roots: a pool whose size follows the water saved, ringed with stones. */
export function ceiboSpring(radius: number): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  // A shallow bowl rather than a disc: deep teal in the middle, clear at the rim.
  const pool = new THREE.CircleGeometry(radius, 32, 0, Math.PI * 2);
  pool.rotateX(-Math.PI / 2);
  const pp = pool.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(pp.count * 3);
  const deep = new THREE.Color('#2A7F8E');
  const rim = new THREE.Color('#8FDCDC');
  const c = new THREE.Color();
  for (let i = 0; i < pp.count; i++) {
    const r = Math.hypot(pp.getX(i), pp.getZ(i)) / radius;
    pp.setY(i, 0.035 - 0.025 * (1 - r * r));
    c.copy(deep).lerp(rim, Math.pow(r, 1.6));
    colors.set([c.r, c.g, c.b], i * 3);
  }
  pool.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  pool.computeVertexNormals();
  parts.push(pool);
  // A lip of wet soil under the stones.
  const lip = new THREE.RingGeometry(radius * 0.96, radius * 1.18, 32, 1);
  lip.rotateX(-Math.PI / 2);
  lip.translate(0, 0.02, 0);
  parts.push(paintFlat(lip, CLAY.soilDeep));
  const stones = Math.max(7, Math.round(radius * 16));
  for (let i = 0; i < stones; i++) {
    const a = (i / stones) * Math.PI * 2;
    const s = smoothRock(0.07 + (i % 3) * 0.02, CEIBO_SEED + i);
    s.translate(Math.cos(a) * (radius + 0.06), 0.02, Math.sin(a) * (radius + 0.06));
    parts.push(s);
  }
  return mergePainted(parts);
}

/** The flowerbed where the rubbish was: a low wooden border and `n` flowers in soil. */
export function ceiboBed(n: number): THREE.BufferGeometry {
  const rng = mulberry32(CEIBO_SEED + 3);
  const parts: THREE.BufferGeometry[] = [];
  const w = 1.1;
  const d = 0.55;
  const soil = new THREE.CylinderGeometry(1, 1, 0.06, 20, 1);
  soil.scale(w / 2, 1, d / 2);
  soil.translate(0, 0.03, 0);
  parts.push(paintFlat(soil, CLAY.soilDeep));
  for (const [x, z, len, rot] of [[0, d / 2, w, 0], [0, -d / 2, w, 0], [w / 2, 0, d, Math.PI / 2], [-w / 2, 0, d, Math.PI / 2]] as const) {
    const plank = bevelBox(len + 0.06, 0.1, 0.05, NATIVE.bark);
    plank.rotateY(rot);
    plank.translate(x, 0.05, z);
    parts.push(plank);
  }
  const accents = ['#F2C230', '#E8574B', '#8C5BC7', '#F4F1E6'];
  for (let i = 0; i < n; i++) {
    const f = flower(i + 3, accents[i % accents.length]!);
    f.scale(1.4, 1.4, 1.4);
    f.translate((rng() - 0.5) * (w - 0.18), 0.05, (rng() - 0.5) * (d - 0.14));
    parts.push(f);
  }
  return mergePainted(parts);
}

/** Paper lanterns on short posts, `n` of them in an arc; returns the posts and the glass separately. */
export function ceiboLanterns(n: number, radius: number): { posts: THREE.BufferGeometry; glass: THREE.BufferGeometry } {
  const posts: THREE.BufferGeometry[] = [];
  const glass: THREE.BufferGeometry[] = [];
  for (let i = 0; i < n; i++) {
    const a = Math.PI * 0.15 + (i / Math.max(1, n - 1)) * Math.PI * 0.7;
    const x = Math.cos(a) * radius;
    const z = Math.sin(a) * radius;
    const post = new THREE.CylinderGeometry(0.025, 0.035, 0.75, 6, 1);
    post.translate(x, 0.375, z);
    posts.push(paintFlat(post, NATIVE.barkDark));
    const hook = new THREE.CylinderGeometry(0.012, 0.012, 0.16, 4, 1);
    hook.rotateZ(Math.PI / 2);
    hook.translate(x + 0.08, 0.74, z);
    posts.push(paintFlat(hook, NATIVE.barkDark));
    // A paper lantern: a ribbed round body between a dark cap and a dark foot.
    const paper = new THREE.SphereGeometry(0.075, 16, 10);
    const pp = paper.attributes.position as THREE.BufferAttribute;
    for (let k = 0; k < pp.count; k++) {
      const px = pp.getX(k);
      const pz = pp.getZ(k);
      const rib = 1 + 0.07 * Math.cos(Math.atan2(pz, px) * 8);
      pp.setX(k, px * rib);
      pp.setZ(k, pz * rib);
    }
    paper.scale(1, 1.15, 1);
    paper.computeVertexNormals();
    paper.translate(x + 0.15, 0.6, z);
    glass.push(paintVertical(paper, '#E0772F', '#F7C267', 1));
    for (const [dy, r] of [[0.095, 0.035], [-0.09, 0.03]] as const) {
      const cap = new THREE.CylinderGeometry(r, r * 1.1, 0.025, 10, 1);
      cap.translate(x + 0.15, 0.6 + dy, z);
      posts.push(paintFlat(cap, NATIVE.barkDark));
    }
  }
  return { posts: mergePainted(posts.length ? posts : [new THREE.BufferGeometry()]), glass: mergePainted(glass.length ? glass : [new THREE.BufferGeometry()]) };
}
