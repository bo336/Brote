/**
 * The wood, rope and canvas props from `14-CONTENT.md` §3, built from
 * `carpentry.ts`. The garden ones are in `props-garden.ts`; the registry and the
 * specs are in `props.ts`. Split for the 400-line rule, along what they are made of.
 *
 * Every builder is deterministic (its own seeded `rng`), and its Spanish
 * description is still the brief.
 */
import * as THREE from 'three';

import { mulberry32 } from '@/lib/world/rng';
import { CLAY, DOMAIN_COLORS, NATIVE, PIP_PARTS } from '../palette';
import { bevelBox, mergePainted, paintFlat, paintVertical } from './build';
import { beamBetween, board, doubleSided, logBetween, nail, rope, v3, weather } from './carpentry';
import { smoothRock } from './scatter';

const METAL = PIP_PARTS.metal;
const ROPE = CLAY.sand;
/** The pale face of sawn wood, at the top of a post. */
const SAWN = CLAY.sand;
const UP = v3(0, 1, 0);

/** "Madera gastada mirando al agua." Separate boards, a braced frame, armrests, nails. */
export function banco(): THREE.BufferGeometry {
  const rng = mulberry32(101);
  const parts: THREE.BufferGeometry[] = [];
  const W = 1.12;
  const seatY = 0.44;
  const legX = 0.5;
  const front = 0.15;
  const back = -0.19;
  const legTop = 0.9;
  const lean = -0.07;
  const backZ = (y: number) => back + lean * (y / legTop);
  for (const side of [-1, 1]) {
    const x = side * legX;
    // Front legs run up to carry the armrest; back legs lean back to carry the backrest.
    parts.push(beamBetween(v3(x, 0, front), v3(x, 0.64, front), 0.06, 0.06, CLAY.barkDeep, rng));
    parts.push(beamBetween(v3(x, 0, back), v3(x, legTop, backZ(legTop)), 0.06, 0.06, CLAY.barkDeep, rng));
    // The rail the seat boards rest on, and the low stretcher that stops it racking.
    parts.push(beamBetween(v3(x, seatY - 0.055, front + 0.03), v3(x, seatY - 0.055, back - 0.03), 0.05, 0.07, CLAY.barkDeep, rng));
    parts.push(beamBetween(v3(x, 0.12, front), v3(x, 0.12, back), 0.04, 0.045, CLAY.barkDeep, rng));
    const arm = board(0.46, 0.08, 0.035, CLAY.bark, rng);
    arm.rotateY(Math.PI / 2);
    arm.translate(x, 0.66, -0.02);
    parts.push(arm, nail(v3(x, 0.68, 0.14), UP, METAL), nail(v3(x, 0.68, -0.17), UP, METAL));
  }
  for (let i = 0; i < 3; i++) {
    const z = front - 0.045 - i * 0.115;
    const seat = board(W, 0.1, 0.035, CLAY.bark, rng);
    seat.translate(0, seatY, z);
    parts.push(seat);
    for (const side of [-1, 1]) parts.push(nail(v3(side * legX, seatY + 0.018, z), UP, METAL));
  }
  for (let i = 0; i < 2; i++) {
    const y = 0.6 + i * 0.17;
    const rest = bevelBox(W, 0.085, 0.03, weather(CLAY.bark, rng), 0.93);
    rest.rotateX(Math.atan2(lean, legTop));
    rest.translate(0, y, backZ(y) + 0.045);
    parts.push(rest);
  }
  parts.push(beamBetween(v3(-legX, 0.12, back), v3(legX, 0.12, back), 0.04, 0.045, CLAY.barkDeep, rng));
  return mergePainted(parts);
}

/** The hammock's cloth: striped, sagging under its own weight, curling up at the sides. */
function hammockCloth(): THREE.BufferGeometry[] {
  const L = 1.46;
  const W = 0.62;
  const geo = new THREE.PlaneGeometry(L, W, 22, 8);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const stripes = [
    PIP_PARTS.cloth, DOMAIN_COLORS.energia, PIP_PARTS.cloth, DOMAIN_COLORS.consumo,
    PIP_PARTS.cloth, DOMAIN_COLORS.consumo, PIP_PARTS.cloth, DOMAIN_COLORS.energia, PIP_PARTS.cloth,
  ];
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const hang = Math.sin(((x + L / 2) / L) * Math.PI);
    const across = z / (W / 2);
    pos.setXYZ(i, x, 1.05 - hang * 0.28 + across * across * 0.09 * hang, z * (1 - 0.12 * hang));
    c.set(stripes[Math.min(stripes.length - 1, Math.floor(((z + W / 2) / W) * stripes.length))]!);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return doubleSided(geo);
}

/** "Colgada entre dos árboles, se mueve con el viento." Two posts, ropes, spreader bars, striped cloth. */
export function hamaca(): THREE.BufferGeometry {
  const rng = mulberry32(211);
  const parts: THREE.BufferGeometry[] = [...hammockCloth()];
  for (const side of [-1, 1]) {
    parts.push(...logBetween(v3(side * 1.0, -0.05, 0), v3(side * 1.06, 1.62, 0), 0.075, 0.06, NATIVE.bark, SAWN, rng));
    parts.push(beamBetween(v3(side * 0.73, 1.05, -0.33), v3(side * 0.73, 1.05, 0.33), 0.03, 0.03, CLAY.barkDeep, rng));
    for (const z of [-0.3, 0, 0.3]) parts.push(...rope(v3(side * 1.02, 1.46, 0), v3(side * 0.73, 1.07, z), 0.015, 0.007, ROPE, 5));
    // A wrap of rope round the post where it is tied.
    const wrap = new THREE.TorusGeometry(0.075, 0.012, 5, 12);
    wrap.rotateX(Math.PI / 2);
    wrap.translate(side * 1.05, 1.46, 0);
    parts.push(paintFlat(wrap, ROPE));
  }
  return mergePainted(parts);
}

/** "Una guirnalda sobre el sendero. De noche se prende." Two posts, a sagging cord, seven lanterns. */
export function farolitos(): THREE.BufferGeometry {
  const rng = mulberry32(263);
  const parts: THREE.BufferGeometry[] = [];
  const span = 2.2;
  const y = 1.62;
  const sag = 0.3;
  for (const x of [0, span]) parts.push(...logBetween(v3(x, -0.05, 0), v3(x, 1.76, 0), 0.045, 0.036, NATIVE.bark, SAWN, rng));
  parts.push(...rope(v3(0.02, y, 0), v3(span - 0.02, y, 0), sag, 0.008, CLAY.soilDeep, 16));
  for (let i = 1; i <= 7; i++) {
    const t = i / 8;
    const at = v3(t * span, y - Math.sin(t * Math.PI) * sag, 0);
    const string = new THREE.CylinderGeometry(0.004, 0.004, 0.08, 4);
    string.translate(at.x, at.y - 0.04, 0);
    parts.push(paintFlat(string, CLAY.soilDeep));
    const cap = new THREE.ConeGeometry(0.052, 0.045, 8);
    cap.translate(at.x, at.y - 0.09, 0);
    parts.push(paintFlat(cap, weather(METAL, rng, 0.4)));
    // The glass: warm at the bottom where the flame would be.
    const glass = new THREE.SphereGeometry(0.048, 10, 8);
    glass.scale(1, 1.2, 1);
    glass.translate(at.x, at.y - 0.15, 0);
    parts.push(paintVertical(glass, DOMAIN_COLORS.energia, PIP_PARTS.cloth, 1.4));
    const foot = new THREE.CylinderGeometry(0.02, 0.028, 0.02, 8);
    foot.translate(at.x, at.y - 0.21, 0);
    parts.push(paintFlat(foot, METAL));
  }
  return mergePainted(parts);
}

/** "Armada junto al fuego, lista para quedarse a dormir." A ridge tent on poles, guyed out, and its fire pit. */
export function carpa(): THREE.BufferGeometry {
  const rng = mulberry32(307);
  const parts: THREE.BufferGeometry[] = [];
  const half = 0.8;
  const ridge = 1.16;
  const base = 0.78;
  const canvas = DOMAIN_COLORS.comunidad;
  const tilt = Math.atan2(base, ridge);
  for (const side of [-1, 1]) {
    const wall = bevelBox(0.02, Math.hypot(base, ridge), half * 2, weather(canvas, rng, 0.5), 0.96);
    wall.rotateZ(side * tilt);
    wall.translate((side * base) / 2, ridge / 2, 0);
    const hem = bevelBox(0.026, 0.14, half * 2 + 0.01, weather(CLAY.soilDeep, rng, 0.5), 0.96);
    hem.rotateZ(side * tilt);
    hem.translate(side * base * (1 - 0.09 / ridge), 0.09, 0);
    parts.push(wall, hem);
  }
  const triangle = (w: number, h: number) => new THREE.ShapeGeometry(
    new THREE.Shape([new THREE.Vector2(-w, 0), new THREE.Vector2(w, 0), new THREE.Vector2(0, h)]),
  );
  for (const z of [-half, half]) {
    const gable = triangle(base, ridge);
    gable.translate(0, 0, z);
    parts.push(...doubleSided(paintFlat(gable, weather(canvas, rng, 0.6))));
    // A-frame poles, crossing just above the ridge.
    parts.push(...logBetween(v3(-base - 0.04, 0, z * 1.02), v3(0.03, ridge + 0.09, z * 1.02), 0.022, 0.018, NATIVE.bark, SAWN, rng));
    parts.push(...logBetween(v3(base + 0.04, 0, z * 1.02), v3(-0.03, ridge + 0.09, z * 1.02), 0.022, 0.018, NATIVE.bark, SAWN, rng));
    // Guy rope and stake.
    const out = Math.sign(z);
    parts.push(...rope(v3(0, ridge + 0.05, z + out * 0.08), v3(0, 0.08, z + out * 0.55), 0.03, 0.005, ROPE, 6));
    parts.push(beamBetween(v3(0, -0.05, z + out * 0.56), v3(0, 0.12, z + out * 0.53), 0.025, 0.025, CLAY.barkDeep, rng));
  }
  // The open door on the front, flap tied back.
  const door = triangle(0.3, 0.82);
  door.translate(0, 0.002, half + 0.008);
  parts.push(...doubleSided(paintFlat(door, PIP_PARTS.eye)));
  const flap = bevelBox(0.02, 0.56, 0.24, weather(canvas, rng), 0.9);
  flap.rotateZ(0.5);
  flap.translate(0.42, 0.34, half + 0.02);
  parts.push(flap);
  parts.push(...logBetween(v3(0, ridge + 0.02, -half - 0.1), v3(0, ridge + 0.02, half + 0.1), 0.02, 0.02, NATIVE.bark, SAWN, rng));
  const sheet = bevelBox(base * 2 + 0.1, 0.02, half * 2 + 0.1, CLAY.soilDeep, 0.95);
  sheet.translate(0, 0.01, 0);
  parts.push(sheet);

  // The fire: a ring of stones, ash, and three charred logs leaning in.
  const fz = half + 0.95;
  const ash = new THREE.CylinderGeometry(0.17, 0.19, 0.02, 14);
  ash.translate(0, 0.01, fz);
  parts.push(paintFlat(ash, CLAY.stoneDeep));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const stone = smoothRock(0.07 + rng() * 0.02, 300 + i);
    stone.scale(1, 0.7, 1);
    stone.translate(Math.cos(a) * 0.25, 0.03, fz + Math.sin(a) * 0.25);
    parts.push(stone);
  }
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.4;
    parts.push(...logBetween(
      v3(Math.cos(a) * 0.17, 0.02, fz + Math.sin(a) * 0.17), v3(0, 0.22, fz), 0.028, 0.02, NATIVE.barkDark, PIP_PARTS.eye, rng, 7,
    ));
  }
  return mergePainted(parts);
}

/**
 * "Gira de verdad, más rápido cuando sopla fuerte." The farm windmill of the
 * pampa: a braced steel lattice, a tail vane, and — separately, so the scene can
 * spin it — a wheel of pitched blades. The wheel mounts at the tower's `HEAD_Y`.
 */
export const HEAD_Y = 2.4;

export function molinoTower(): THREE.BufferGeometry {
  const rng = mulberry32(401);
  const parts: THREE.BufferGeometry[] = [];
  const top = 2.32;
  const foot = 0.4;
  const head = 0.07;
  const leg = (sx: number, sz: number, y: number) => {
    const r = foot + (head - foot) * (y / top);
    return v3(sx * r, y, sz * r);
  };
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const;
  for (const [sx, sz] of corners) {
    parts.push(beamBetween(leg(sx, sz, 0), leg(sx, sz, top), 0.045, 0.045, METAL, rng));
    const footing = bevelBox(0.15, 0.08, 0.15, weather(CLAY.stone, rng), 0.9);
    footing.translate(sx * foot, 0.02, sz * foot);
    parts.push(footing);
  }
  const levels = [0.1, 0.72, 1.36, 1.92];
  for (let l = 0; l < levels.length; l++) {
    for (let c = 0; c < 4; c++) {
      const [ax, az] = corners[c]!;
      const [bx, bz] = corners[(c + 1) % 4]!;
      const y0 = levels[l]!;
      parts.push(beamBetween(leg(ax, az, y0), leg(bx, bz, y0), 0.026, 0.026, METAL, rng));
      if (l < levels.length - 1) {
        const y1 = levels[l + 1]!;
        parts.push(beamBetween(leg(ax, az, y0), leg(bx, bz, y1), 0.015, 0.015, METAL, rng));
        parts.push(beamBetween(leg(bx, bz, y0), leg(ax, az, y1), 0.015, 0.015, METAL, rng));
      }
    }
  }
  const box = bevelBox(0.16, 0.16, 0.34, weather(METAL, rng, 0.3), 0.9);
  box.translate(0, HEAD_Y, 0.04);
  parts.push(box);
  parts.push(beamBetween(v3(0, HEAD_Y, -0.1), v3(0, HEAD_Y + 0.04, -0.85), 0.03, 0.03, METAL, rng));
  const vane = bevelBox(0.015, 0.34, 0.5, weather(PIP_PARTS.cloth, rng, 0.4), 0.95);
  vane.translate(0, HEAD_Y + 0.06, -0.95);
  parts.push(vane);
  parts.push(beamBetween(v3(0, 0.05, 0), v3(0, HEAD_Y - 0.1, 0), 0.012, 0.012, METAL, rng));
  return mergePainted(parts);
}

export function molinoBlades(): THREE.BufferGeometry {
  const rng = mulberry32(409);
  const parts: THREE.BufferGeometry[] = [];
  const blades = 14;
  for (let i = 0; i < blades; i++) {
    const blade = bevelBox(0.13, 0.5, 0.012, weather(i % 2 ? PIP_PARTS.cloth : METAL, rng, 0.4), 0.95);
    blade.rotateY(0.45);
    blade.translate(0, 0.66, 0);
    blade.rotateZ((i / blades) * Math.PI * 2);
    parts.push(blade);
  }
  for (const r of [0.42, 0.9]) parts.push(paintFlat(new THREE.TorusGeometry(r, 0.012, 5, 44), METAL));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    parts.push(beamBetween(v3(0, 0, 0), v3(Math.cos(a) * 0.9, Math.sin(a) * 0.9, 0), 0.014, 0.014, METAL, rng));
  }
  const hub = new THREE.CylinderGeometry(0.07, 0.08, 0.1, 12);
  hub.rotateX(Math.PI / 2);
  parts.push(paintFlat(hub, weather(METAL, rng, 0.3)));
  return mergePainted(parts);
}
