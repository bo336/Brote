'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { terrainHeight, snapToLand, type WorldLayout } from '@/lib/mundo/terrain';

/**
 * Decoraciones compradas con semillas (F11.2).
 *
 * Cada una se ubica de forma DETERMINÍSTICA: el ángulo sale de un hash del
 * slug y de la semilla del layout, así que una decoración siempre cae en el
 * mismo lugar de tu isla y no salta de posición en cada render. Todas pasan por
 * snapToLand, que es lo que garantiza que nada termine flotando en un lago ni
 * clavado en un acantilado.
 *
 * Se dibujan con primitivas, como el resto del mundo: sin GLB, sin descargas.
 */

const WOOD = '#8b6a45';
const WOOD_DARK = '#5f4630';
const ROPE = '#c8a877';

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

/** A stable spot on the island for a given decoration. */
function useSpot(slug: string, layout: WorldLayout, radiusFactor = 0.6, margin = 0.4) {
  return useMemo(() => {
    const a = hash(slug + layout.seed) * Math.PI * 2;
    const r = layout.R * radiusFactor;
    let n = 0;
    const rng = () => {
      n += 1;
      return hash(slug + n);
    };
    return snapToLand(Math.cos(a) * r, Math.sin(a) * r, layout, rng, margin);
  }, [slug, layout, radiusFactor, margin]);
}

function Anchored({
  spot,
  layout,
  rotation = 0,
  children,
}: {
  spot: [number, number] | null;
  layout: WorldLayout;
  rotation?: number;
  children: React.ReactNode;
}) {
  const y = useMemo(() => (spot ? terrainHeight(spot[0], spot[1], layout) : 0), [spot, layout]);
  if (!spot) return null;
  return (
    <group position={[spot[0], y, spot[1]]} rotation={[0, rotation, 0]}>
      {children}
    </group>
  );
}

// ── Individual pieces ───────────────────────────────────────────────────────

function Comedero({ layout, night }: { layout: WorldLayout; night: boolean }) {
  const spot = useSpot('mundo_comedero', layout, 0.52);
  const bird = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!bird.current) return;
    const t = clock.elapsedTime * 0.6;
    // El pájaro se posa y se va: sólo está a la vista parte del ciclo.
    const perched = Math.sin(t) > 0.2;
    bird.current.visible = perched && !night;
    bird.current.position.y = 0.42 + Math.max(0, Math.sin(t * 6)) * 0.01;
  });
  return (
    <Anchored spot={spot} layout={layout} rotation={hash('comedero') * 6}>
      <mesh castShadow position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.022, 0.028, 0.4, 6]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={1} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.4, 0]}>
        <boxGeometry args={[0.19, 0.02, 0.15]} />
        <meshStandardMaterial color={WOOD} roughness={0.95} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} castShadow position={[0, 0.5, s * 0.04]} rotation={[s * 0.8, 0, 0]}>
          <boxGeometry args={[0.22, 0.015, 0.12]} />
          <meshStandardMaterial color="#a8543c" roughness={1} />
        </mesh>
      ))}
      <group ref={bird} position={[0.05, 0.42, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.026, 8, 6]} />
          <meshStandardMaterial color="#e8a33d" roughness={0.8} />
        </mesh>
        <mesh position={[0.022, 0.018, 0]}>
          <sphereGeometry args={[0.016, 8, 6]} />
          <meshStandardMaterial color="#f2c46a" roughness={0.8} />
        </mesh>
      </group>
    </Anchored>
  );
}

function Banco({ layout }: { layout: WorldLayout }) {
  const spot = useSpot('mundo_banco', layout, 0.58);
  // Mira hacia el centro de la isla, que es donde está lo que vale mirar.
  const rot = useMemo(() => (spot ? Math.atan2(-spot[0], -spot[1]) : 0), [spot]);
  return (
    <Anchored spot={spot} layout={layout} rotation={rot}>
      <mesh castShadow receiveShadow position={[0, 0.13, 0]}>
        <boxGeometry args={[0.42, 0.022, 0.14]} />
        <meshStandardMaterial color={WOOD} roughness={0.95} />
      </mesh>
      <mesh castShadow position={[0, 0.24, -0.06]} rotation={[0.22, 0, 0]}>
        <boxGeometry args={[0.42, 0.02, 0.1]} />
        <meshStandardMaterial color={WOOD} roughness={0.95} />
      </mesh>
      {[-0.16, 0.16].map((x) => (
        <group key={x}>
          <mesh castShadow position={[x, 0.065, 0]}>
            <boxGeometry args={[0.022, 0.13, 0.12]} />
            <meshStandardMaterial color={WOOD_DARK} roughness={1} />
          </mesh>
          <mesh castShadow position={[x, 0.19, -0.05]}>
            <boxGeometry args={[0.02, 0.12, 0.02]} />
            <meshStandardMaterial color={WOOD_DARK} roughness={1} />
          </mesh>
        </group>
      ))}
    </Anchored>
  );
}

function Hamaca({ layout }: { layout: WorldLayout }) {
  const spot = useSpot('mundo_hamaca', layout, 0.5, 0.55);
  const cloth = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (cloth.current) cloth.current.rotation.z = Math.sin(clock.elapsedTime * 0.9) * 0.09;
  });
  return (
    <Anchored spot={spot} layout={layout} rotation={hash('hamaca') * 6}>
      {[-0.3, 0.3].map((x) => (
        <mesh key={x} castShadow position={[x, 0.2, 0]}>
          <cylinderGeometry args={[0.028, 0.038, 0.4, 6]} />
          <meshStandardMaterial color={WOOD_DARK} roughness={1} />
        </mesh>
      ))}
      <group ref={cloth}>
        {/* La tela es una banda curvada: un plano recto se ve como una tabla. */}
        <mesh castShadow position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.3, 0.045, 6, 12, Math.PI * 0.62]} />
          <meshStandardMaterial color="#e08a55" roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </Anchored>
  );
}

function Colmena({ layout, night }: { layout: WorldLayout; night: boolean }) {
  const spot = useSpot('mundo_colmena', layout, 0.62);
  const bees = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!bees.current) return;
    bees.current.visible = !night;
    bees.current.rotation.y = clock.elapsedTime * 1.4;
    bees.current.position.y = 0.3 + Math.sin(clock.elapsedTime * 3) * 0.03;
  });
  return (
    <Anchored spot={spot} layout={layout} rotation={hash('colmena') * 6}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} castShadow receiveShadow position={[0, 0.07 + i * 0.075, 0]}>
          <boxGeometry args={[0.2 - i * 0.012, 0.07, 0.17 - i * 0.012]} />
          <meshStandardMaterial color={i % 2 ? '#e8d09a' : '#d8bb7e'} roughness={1} />
        </mesh>
      ))}
      <mesh castShadow position={[0, 0.3, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.15, 0.07, 4]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={1} />
      </mesh>
      <group ref={bees}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0.19, i * 0.035, 0]}>
            <sphereGeometry args={[0.012, 6, 5]} />
            <meshStandardMaterial color="#f2b33d" emissive="#a86d10" emissiveIntensity={0.3} />
          </mesh>
        ))}
      </group>
    </Anchored>
  );
}

function Farolitos({ layout, night }: { layout: WorldLayout; night: boolean }) {
  // Una guirnalda: postes en arco con la cuerda colgando entre ellos.
  const posts = useMemo(() => {
    const base = hash('mundo_farolitos' + layout.seed) * Math.PI * 2;
    const out: [number, number][] = [];
    for (let i = 0; i < 4; i++) {
      const a = base + (i - 1.5) * 0.36;
      const r = layout.R * 0.66;
      let n = 0;
      const rng = () => {
        n += 1;
        return hash('farol' + i + n);
      };
      const s = snapToLand(Math.cos(a) * r, Math.sin(a) * r, layout, rng, 0.3);
      if (s) out.push(s);
    }
    return out;
  }, [layout]);

  // El titileo va en la intensidad del material, no en la escala del grupo:
  // escalar la guirnalda entera movería los postes de lugar.
  const lamps = useRef<THREE.MeshStandardMaterial[]>([]);
  useFrame(({ clock }) => {
    const base = night ? 1.6 : 0.25;
    const flicker = base * (0.9 + Math.sin(clock.elapsedTime * 2.2) * 0.1);
    for (const m of lamps.current) if (m) m.emissiveIntensity = flicker;
  });

  return (
    <group>
      {posts.map((p, i) => {
        const y = terrainHeight(p[0], p[1], layout);
        return (
          <group key={i} position={[p[0], y, p[1]]}>
            <mesh castShadow position={[0, 0.17, 0]}>
              <cylinderGeometry args={[0.016, 0.022, 0.34, 5]} />
              <meshStandardMaterial color={WOOD_DARK} roughness={1} />
            </mesh>
            <mesh position={[0, 0.36, 0]}>
              <sphereGeometry args={[0.035, 8, 7]} />
              <meshStandardMaterial
                ref={(m) => {
                  if (m) lamps.current[i] = m;
                }}
                color="#ffe6a0"
                emissive="#ffc46a"
                emissiveIntensity={night ? 1.6 : 0.25}
              />
            </mesh>
            {night && <pointLight position={[0, 0.36, 0]} intensity={0.5} distance={1.1} color="#ffd27a" />}
          </group>
        );
      })}
      {/* Cuerda entre postes consecutivos. */}
      {posts.slice(0, -1).map((p, i) => {
        const q = posts[i + 1]!;
        const y1 = terrainHeight(p[0], p[1], layout) + 0.34;
        const y2 = terrainHeight(q[0], q[1], layout) + 0.34;
        const mid = new THREE.Vector3((p[0] + q[0]) / 2, (y1 + y2) / 2 - 0.05, (p[1] + q[1]) / 2);
        const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
        const dir = new THREE.Vector3(q[0] - p[0], y2 - y1, q[1] - p[1]).normalize();
        const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        return (
          <mesh key={i} position={mid} quaternion={quat}>
            <cylinderGeometry args={[0.004, 0.004, len, 4]} />
            <meshStandardMaterial color={ROPE} roughness={1} />
          </mesh>
        );
      })}
    </group>
  );
}

function Arco({ layout }: { layout: WorldLayout }) {
  const spot = useSpot('mundo_arco', layout, 0.55, 0.5);
  const rot = useMemo(() => (spot ? Math.atan2(-spot[0], -spot[1]) : 0), [spot]);
  const flowers = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => {
        const a = (i / 13) * Math.PI;
        return {
          p: [Math.cos(a) * 0.28, Math.sin(a) * 0.28 + 0.24, 0] as [number, number, number],
          c: hash('arco' + i) > 0.5 ? '#ff8fa3' : '#ffd87a',
          s: 0.022 + hash('arcos' + i) * 0.014,
        };
      }),
    [],
  );
  return (
    <Anchored spot={spot} layout={layout} rotation={rot}>
      <mesh castShadow position={[0, 0.24, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.28, 0.018, 6, 16, Math.PI]} />
        <meshStandardMaterial color={WOOD} roughness={0.95} />
      </mesh>
      {flowers.map((f, i) => (
        <mesh key={i} position={f.p}>
          <sphereGeometry args={[f.s, 6, 5]} />
          <meshStandardMaterial color={f.c} roughness={0.85} />
        </mesh>
      ))}
    </Anchored>
  );
}

function Huerta({ layout }: { layout: WorldLayout }) {
  const spot = useSpot('mundo_huerta', layout, 0.45, 0.6);
  return (
    <Anchored spot={spot} layout={layout} rotation={hash('huerta') * 6}>
      {[-0.16, -0.05, 0.06, 0.17].map((z, row) => (
        <group key={z}>
          <mesh receiveShadow position={[0, 0.02, z]}>
            <boxGeometry args={[0.44, 0.04, 0.08]} />
            <meshStandardMaterial color="#6b4b2e" roughness={1} />
          </mesh>
          {[-0.15, -0.05, 0.05, 0.15].map((x) => (
            <mesh key={x} castShadow position={[x, 0.075, z]}>
              <sphereGeometry args={[0.032, 7, 6]} />
              <meshStandardMaterial color={row % 2 ? '#4f9152' : '#5faa5c'} roughness={0.9} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh receiveShadow position={[0, 0.005, 0]}>
        <boxGeometry args={[0.5, 0.01, 0.46]} />
        <meshStandardMaterial color="#7a5636" roughness={1} />
      </mesh>
    </Anchored>
  );
}

function Totem({ layout }: { layout: WorldLayout }) {
  const spot = useSpot('mundo_totem', layout, 0.68);
  const stones = useMemo(
    () =>
      Array.from({ length: 5 }).map((_, i) => ({
        r: 0.09 - i * 0.014,
        h: 0.05 - i * 0.004,
        rot: hash('totem' + i) * Math.PI,
        tilt: (hash('tilt' + i) - 0.5) * 0.16,
      })),
    [],
  );
  return (
    <Anchored spot={spot} layout={layout}>
      {stones.map((s, i) => {
        const y = stones.slice(0, i).reduce((a, b) => a + b.h + 0.008, s.h / 2);
        return (
          <mesh key={i} castShadow receiveShadow position={[0, y, 0]} rotation={[s.tilt, s.rot, 0]}>
            <cylinderGeometry args={[s.r * 0.86, s.r, s.h, 7]} />
            <meshStandardMaterial color={i % 2 ? '#9a958c' : '#84807a'} roughness={1} flatShading />
          </mesh>
        );
      })}
    </Anchored>
  );
}

function Carpa({ layout, night }: { layout: WorldLayout; night: boolean }) {
  const spot = useSpot('mundo_carpa', layout, 0.5, 0.55);
  return (
    <Anchored spot={spot} layout={layout} rotation={hash('carpa') * 6}>
      <mesh castShadow receiveShadow position={[0, 0.13, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.26, 0.27, 4]} />
        <meshStandardMaterial color="#c9563c" roughness={0.95} flatShading />
      </mesh>
      {/* Boca de la carpa: un triángulo oscuro que le da profundidad. */}
      <mesh position={[0, 0.09, 0.16]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.075, 0.17, 3]} />
        <meshStandardMaterial color="#2a1e12" roughness={1} />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.08, 4]} />
        <meshStandardMaterial color={WOOD_DARK} />
      </mesh>
      {night && <pointLight position={[0, 0.12, 0.1]} intensity={0.35} distance={0.9} color="#ffb457" />}
    </Anchored>
  );
}

function Molino({ layout }: { layout: WorldLayout }) {
  const spot = useSpot('mundo_molino', layout, 0.6, 0.6);
  const blades = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (blades.current) blades.current.rotation.z += dt * 0.9;
  });
  return (
    <Anchored spot={spot} layout={layout} rotation={hash('molino') * 6}>
      <mesh castShadow receiveShadow position={[0, 0.26, 0]}>
        <cylinderGeometry args={[0.11, 0.16, 0.52, 8]} />
        <meshStandardMaterial color="#e5ded0" roughness={0.95} />
      </mesh>
      <mesh castShadow position={[0, 0.56, 0]} rotation={[0, Math.PI / 8, 0]}>
        <coneGeometry args={[0.15, 0.13, 8]} />
        <meshStandardMaterial color="#a8543c" roughness={1} />
      </mesh>
      <mesh position={[0, 0.16, 0.161]}>
        <boxGeometry args={[0.07, 0.13, 0.01]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.9} />
      </mesh>
      <group ref={blades} position={[0, 0.5, 0.14]}>
        {[0, 1, 2, 3].map((i) => (
          <group key={i} rotation={[0, 0, (i / 4) * Math.PI * 2]}>
            <mesh castShadow position={[0, 0.13, 0]}>
              <boxGeometry args={[0.035, 0.26, 0.008]} />
              <meshStandardMaterial color="#f2ead9" roughness={0.9} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 0.13, -0.006]}>
              <boxGeometry args={[0.006, 0.26, 0.006]} />
              <meshStandardMaterial color={WOOD} roughness={1} />
            </mesh>
          </group>
        ))}
        <mesh>
          <sphereGeometry args={[0.022, 8, 6]} />
          <meshStandardMaterial color={WOOD_DARK} />
        </mesh>
      </group>
    </Anchored>
  );
}

// ── Entry point ─────────────────────────────────────────────────────────────

const PIECES: Record<
  string,
  (p: { layout: WorldLayout; night: boolean }) => React.ReactElement | null
> = {
  mundo_comedero: Comedero,
  mundo_banco: ({ layout }) => <Banco layout={layout} />,
  mundo_hamaca: ({ layout }) => <Hamaca layout={layout} />,
  mundo_colmena: Colmena,
  mundo_farolitos: Farolitos,
  mundo_arco: ({ layout }) => <Arco layout={layout} />,
  mundo_huerta: ({ layout }) => <Huerta layout={layout} />,
  mundo_totem: ({ layout }) => <Totem layout={layout} />,
  mundo_carpa: Carpa,
  mundo_molino: ({ layout }) => <Molino layout={layout} />,
};

export function WorldDecorations({
  slugs,
  layout,
  night,
}: {
  slugs: string[];
  layout: WorldLayout;
  night: boolean;
}) {
  return (
    <>
      {slugs.map((slug) => {
        const Piece = PIECES[slug];
        return Piece ? <Piece key={slug} layout={layout} night={night} /> : null;
      })}
    </>
  );
}
