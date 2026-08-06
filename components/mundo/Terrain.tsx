'use client';

/**
 * Terrain + water rendering (v7).
 *
 * The ground is a real heightmap mesh: hills, mountain slopes, carved lake
 * basins and river channels — all from `terrainHeight`. Water is no longer a
 * flat disc: it is a surface sitting INSIDE its basin, with per-vertex depth
 * driving colour, transparency and shoreline foam, so you can see the bed
 * shelving away beneath it.
 */

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  WATER_LEVEL,
  fbm,
  slopeAt,
  terrainHeight,
  type WorldLayout,
} from '@/lib/mundo/terrain';

export interface TerrainColors {
  grass: string;
  grassDry: string;
  rock: string;
  sand: string;
  snow: string;
  water: string;
}

// ── Ground ──────────────────────────────────────────────────────────────────

/** Heightmap ground with blended grass / rock / sand / snow vertex colours. */
export function Ground({ layout, colors, snow }: { layout: WorldLayout; colors: TerrainColors; snow: boolean }) {
  const geo = useMemo(() => {
    const R = layout.R;
    const SEG = 132; // grid resolution across the diameter
    const step = (R * 2) / SEG;
    const positions: number[] = [];
    const colorArr: number[] = [];
    const indices: number[] = [];
    const index = new Map<string, number>();

    const cGrass = new THREE.Color(colors.grass);
    const cDry = new THREE.Color(colors.grassDry);
    const cRock = new THREE.Color(colors.rock);
    const cSand = new THREE.Color(colors.sand);
    const cSnow = new THREE.Color(colors.snow);
    const tmp = new THREE.Color();

    const vertexAt = (ix: number, iz: number): number => {
      const key = `${ix},${iz}`;
      const hit = index.get(key);
      if (hit !== undefined) return hit;
      const x = -R + ix * step;
      const z = -R + iz * step;
      const h = terrainHeight(x, z, layout);
      const id = positions.length / 3;
      positions.push(x, h, z);

      // Colour by height, slope and moisture.
      const slope = slopeAt(x, z, layout);
      const wet = h - WATER_LEVEL;
      tmp.copy(cGrass);
      // Patchy dryness so the meadow isn't one flat green.
      tmp.lerp(cDry, Math.min(1, Math.max(0, fbm(x * 0.9 + 3, z * 0.9 - 2, 3) * 1.3 - 0.25)));
      // Sand/mud ring at the waterline.
      if (wet < 0.14) tmp.lerp(cSand, Math.min(1, 1 - wet / 0.14));
      // Submerged bed: darker, siltier.
      if (wet < 0) tmp.lerp(cRock, Math.min(0.55, -wet * 1.1));
      // Rock takes over on steep faces.
      if (slope > 0.28) tmp.lerp(cRock, Math.min(1, (slope - 0.28) / 0.42));
      // Snow caps the peaks.
      if (snow && h > 0.72) tmp.lerp(cSnow, Math.min(1, (h - 0.72) / 0.3));
      colorArr.push(tmp.r, tmp.g, tmp.b);
      index.set(key, id);
      return id;
    };

    for (let iz = 0; iz < SEG; iz++) {
      for (let ix = 0; ix < SEG; ix++) {
        // Keep only cells whose centre is inside the island disc.
        const cx = -R + (ix + 0.5) * step;
        const cz = -R + (iz + 0.5) * step;
        if (Math.hypot(cx, cz) > R) continue;
        const a = vertexAt(ix, iz);
        const b = vertexAt(ix + 1, iz);
        const c = vertexAt(ix + 1, iz + 1);
        const d = vertexAt(ix, iz + 1);
        indices.push(a, c, b, a, d, c);
      }
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(colorArr, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, [layout, colors, snow]);

  useEffect(() => () => geo.dispose(), [geo]);

  return (
    <mesh geometry={geo} receiveShadow castShadow>
      <meshStandardMaterial vertexColors roughness={0.96} metalness={0} />
    </mesh>
  );
}

/** Rocky cliff wall + underside, so the island reads as a solid chunk of land. */
export function IslandBody({ layout, rock }: { layout: WorldLayout; rock: string }) {
  const geo = useMemo(() => {
    const R = layout.R;
    const SEG = 96;
    const positions: number[] = [];
    const indices: number[] = [];
    const rimH: number[] = [];

    // Rim ring follows the terrain so the cliff starts exactly at the ground.
    for (let i = 0; i <= SEG; i++) {
      const a = (i / SEG) * Math.PI * 2;
      const x = Math.cos(a) * R;
      const z = Math.sin(a) * R;
      rimH.push(terrainHeight(x, z, layout));
    }

    // Cliff: rim → flare out slightly → taper to a point underneath.
    const rings = [
      { r: 1.0, y: 0 },
      { r: 1.035, y: -0.34 },
      { r: 0.94, y: -0.9 },
      { r: 0.68, y: -1.6 },
      { r: 0.3, y: -2.35 },
      { r: 0.0, y: -3.0 },
    ];

    for (let ri = 0; ri < rings.length; ri++) {
      const ring = rings[ri]!;
      for (let i = 0; i <= SEG; i++) {
        const a = (i / SEG) * Math.PI * 2;
        // Irregular silhouette: rock doesn't come in perfect circles.
        const wob = 1 + (fbm(Math.cos(a) * 2 + ri, Math.sin(a) * 2 - ri, 3) - 0.5) * 0.12;
        const rr = R * ring.r * (ri === 0 ? 1 : wob);
        positions.push(Math.cos(a) * rr, (ri === 0 ? rimH[i]! : ring.y * (0.85 + wob * 0.2)), Math.sin(a) * rr);
      }
    }

    const rowLen = SEG + 1;
    for (let ri = 0; ri < rings.length - 1; ri++) {
      for (let i = 0; i < SEG; i++) {
        const a = ri * rowLen + i;
        const b = a + 1;
        const c = a + rowLen;
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, [layout]);

  useEffect(() => () => geo.dispose(), [geo]);

  return (
    <mesh geometry={geo} castShadow receiveShadow>
      <meshStandardMaterial color={rock} roughness={1} flatShading />
    </mesh>
  );
}

// ── Water ───────────────────────────────────────────────────────────────────

const waterVert = /* glsl */ `
  uniform float uTime;
  attribute float aDepth;
  varying float vDepth;
  varying vec2 vWorld;
  varying vec3 vNormalW;
  void main(){
    vDepth = aDepth;
    vWorld = vec2(position.x, position.z);
    // Two crossing swells + fine chop: a moving surface, not a flat plane.
    float w1 = sin(position.x * 3.1 + uTime * 1.05) * cos(position.z * 2.6 - uTime * 0.8);
    float w2 = sin(position.x * 7.3 - uTime * 1.7 + position.z * 5.1) * 0.45;
    float amp = clamp(vDepth * 2.2, 0.05, 1.0) * 0.022;
    vec3 p = position;
    p.y += (w1 + w2) * amp;
    // Approximate normal from the same wave field for lighting/specular.
    float dx = cos(position.x * 3.1 + uTime * 1.05) * 3.1;
    float dz = -sin(position.z * 2.6 - uTime * 0.8) * 2.6;
    vNormalW = normalize(vec3(-dx * amp, 1.0, -dz * amp));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const waterFrag = /* glsl */ `
  uniform float uTime;
  uniform vec3 uShallow;
  uniform vec3 uDeep;
  uniform vec3 uSun;
  varying float vDepth;
  varying vec2 vWorld;
  varying vec3 vNormalW;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1,0)), u.x), mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
  }

  void main(){
    // Depth drives colour: you can read the shelving bed through the water.
    float d = clamp(vDepth / 0.34, 0.0, 1.0);
    vec3 col = mix(uShallow, uDeep, pow(d, 0.7));

    // Caustic-ish shimmer, stronger where it is shallow.
    vec2 q = vWorld * 5.0;
    float caus = noise(q + vec2(uTime * 0.35, -uTime * 0.28));
    caus = pow(caus, 3.0);
    col += vec3(0.85, 0.95, 0.8) * caus * (1.0 - d) * 0.35;

    // Specular glints from the wave normal.
    float spec = pow(max(dot(normalize(vNormalW), normalize(uSun)), 0.0), 48.0);
    col += vec3(1.0) * spec * 0.55;

    // Shoreline foam: a soft band where the water meets land, animated.
    float foamEdge = smoothstep(0.085, 0.0, vDepth);
    float foamN = noise(vWorld * 14.0 + vec2(uTime * 0.5, uTime * 0.35));
    col = mix(col, vec3(0.95, 0.98, 0.97), foamEdge * (0.45 + foamN * 0.5));

    // Shallow water is more transparent than deep water.
    float alpha = mix(0.62, 0.93, d);
    alpha = mix(alpha, 0.85, foamEdge);
    gl_FragColor = vec4(col, alpha);
  }
`;

/** Builds a water surface mesh that exactly fills a carved basin. */
function useBasinGeometry(
  layout: WorldLayout,
  center: [number, number],
  radius: number,
): THREE.BufferGeometry {
  return useMemo(() => {
    const SEG = 56;
    const step = (radius * 2.2) / SEG;
    const positions: number[] = [];
    const depths: number[] = [];
    const indices: number[] = [];
    const index = new Map<string, number>();

    const vertexAt = (ix: number, iz: number): number | null => {
      const key = `${ix},${iz}`;
      const hit = index.get(key);
      if (hit !== undefined) return hit;
      const x = center[0] - radius * 1.1 + ix * step;
      const z = center[1] - radius * 1.1 + iz * step;
      const ground = terrainHeight(x, z, layout);
      const depth = WATER_LEVEL - ground;
      const id = positions.length / 3;
      positions.push(x, WATER_LEVEL, z);
      depths.push(Math.max(0, depth));
      index.set(key, id);
      return id;
    };

    for (let iz = 0; iz < SEG; iz++) {
      for (let ix = 0; ix < SEG; ix++) {
        // Only emit cells that actually have water in them.
        const cx = center[0] - radius * 1.1 + (ix + 0.5) * step;
        const cz = center[1] - radius * 1.1 + (iz + 0.5) * step;
        if (terrainHeight(cx, cz, layout) >= WATER_LEVEL) continue;
        const a = vertexAt(ix, iz);
        const b = vertexAt(ix + 1, iz);
        const c = vertexAt(ix + 1, iz + 1);
        const d = vertexAt(ix, iz + 1);
        if (a === null || b === null || c === null || d === null) continue;
        indices.push(a, c, b, a, d, c);
      }
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute('aDepth', new THREE.Float32BufferAttribute(depths, 1));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, [layout, center, radius]);
}

/** A lake: real water sitting in its basin. */
export function WaterBody({
  layout,
  center,
  radius,
  color,
  sunDir,
}: {
  layout: WorldLayout;
  center: [number, number];
  radius: number;
  color: string;
  sunDir: THREE.Vector3;
}) {
  const geo = useBasinGeometry(layout, center, radius);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uShallow: { value: new THREE.Color(color).lerp(new THREE.Color('#eaf6f2'), 0.45) },
      uDeep: { value: new THREE.Color(color).multiplyScalar(0.42) },
      uSun: { value: sunDir.clone().normalize() },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    uniforms.uShallow.value.set(color).lerp(new THREE.Color('#eaf6f2'), 0.45);
    uniforms.uDeep.value.set(color).multiplyScalar(0.42);
  }, [color, uniforms]);
  useEffect(() => {
    uniforms.uSun.value.copy(sunDir).normalize();
  }, [sunDir, uniforms]);
  useEffect(() => () => geo.dispose(), [geo]);

  useFrame(({ clock }) => {
    const u = matRef.current?.uniforms.uTime;
    if (u) u.value = clock.elapsedTime;
  });

  return (
    <mesh geometry={geo} renderOrder={2}>
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        uniforms={uniforms}
        vertexShader={waterVert}
        fragmentShader={waterFrag}
      />
    </mesh>
  );
}

/** Water filling every lake and river channel of the layout. */
export function AllWater({ layout, color, sunDir }: { layout: WorldLayout; color: string; sunDir: THREE.Vector3 }) {
  return (
    <group>
      {layout.lakes.map((l, i) => (
        <WaterBody key={`lake-${i}`} layout={layout} center={[l.x, l.z]} radius={l.r * 1.5} color={color} sunDir={sunDir} />
      ))}
      {layout.rivers.map((r, i) => {
        const cx = (r.from[0] + r.to[0]) / 2;
        const cz = (r.from[1] + r.to[1]) / 2;
        const half = Math.hypot(r.to[0] - r.from[0], r.to[1] - r.from[1]) / 2 + r.width;
        return (
          <WaterBody key={`river-${i}`} layout={layout} center={[cx, cz]} radius={half} color={color} sunDir={sunDir} />
        );
      })}
    </group>
  );
}
