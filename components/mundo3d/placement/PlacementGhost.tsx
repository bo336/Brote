'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { buildProp } from '@/lib/render/geometry';
import { getClayMaterial, getOverlayMaterial } from '@/lib/render/materials';
import { DOMAIN_COLORS } from '@/lib/render/palette';
import { sampleHeight, sampleNormal, type Heightfield } from '@/lib/world/terrain';
import type { Ghost } from './usePlacementEditor';

/**
 * The prop being placed, and the ring under it.
 *
 * Two jobs. It shows **where the thing will land** — snapped to the terrain's
 * height and tilted to its normal, so a bench on a slope looks like a bench on
 * a slope before you commit to it. And it shows **whether it will land at all**,
 * through the colour of the ring: green for yes, coral for no.
 *
 * The refusal is a colour and never a message. `08-WORLD-AND-PROGRESSION.md` §8
 * asks for a soft nudge rather than an error, and a modal that says "no puede
 * ir ahí" would undo the whole point of a direct-manipulation editor.
 */
const RING_SEGMENTS = 28;
/** How far the ghost floats while it is still in hand. */
const HOVER_M = 0.04;

export function PlacementGhost({
  ghost,
  heightfield,
}: {
  ghost: Ghost | null;
  heightfield: Heightfield;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  // The prop's own material. Placement is not a different art style.
  const solid = useMemo(() => getClayMaterial({ vertexColors: true, wind: false, wobble: true }), []);
  const overlay = useMemo(() => getOverlayMaterial(), []);

  /**
   * A flat ring, carrying its colour and alpha per vertex so it rides the same
   * shared overlay material the sky and the interaction cue use.
   */
  const ring = useMemo(() => {
    const geo = new THREE.RingGeometry(0.52, 0.62, RING_SEGMENTS);
    geo.rotateX(-Math.PI / 2);
    const count = (geo.getAttribute('position') as THREE.BufferAttribute).count;
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 4).fill(1), 4));
    return geo;
  }, []);
  useEffect(() => () => ring.dispose(), [ring]);

  // Pulled out as plain values so the dependency arrays below are honest: the
  // ghost object is replaced on every pointer move, and depending on it would
  // rebuild the geometry and repaint the ring sixty times a second.
  const slug = ghost?.slug ?? null;
  const rejection = ghost?.rejection ?? null;
  const active = ghost !== null;

  const geometry = useMemo(() => (slug ? buildProp(slug) : null), [slug]);

  /** Paint the ring when the verdict changes, not every frame. */
  useEffect(() => {
    if (!active) return;
    const attr = ring.getAttribute('color') as THREE.BufferAttribute;
    const colour = new THREE.Color(rejection ? DOMAIN_COLORS.animales : DOMAIN_COLORS.plantas);
    const array = attr.array as Float32Array;
    for (let i = 0; i < array.length; i += 4) {
      array[i] = colour.r;
      array[i + 1] = colour.g;
      array[i + 2] = colour.b;
      array[i + 3] = 0.75;
    }
    attr.needsUpdate = true;
  }, [active, rejection, ring]);

  /**
   * Follow the terrain. Height every frame because the ghost moves with a
   * finger, and the normal so it lies along the slope rather than through it.
   */
  useFrame(() => {
    const group = groupRef.current;
    if (!group || !ghost) return;
    const y = sampleHeight(heightfield, ghost.x, ghost.z);
    group.position.set(ghost.x, y + HOVER_M, ghost.z);

    const [nx, ny, nz] = sampleNormal(heightfield, ghost.x, ghost.z);
    // Tilt is the ground's, yaw is the player's — composing them in that order
    // keeps a rotated bench rotated when it moves onto a slope.
    group.rotation.set(Math.atan2(nz, ny), ghost.rot, -Math.atan2(nx, ny), 'ZXY');

    const pulse = ringRef.current;
    if (pulse) pulse.rotation.y += 0.004;
  });

  if (!ghost || !geometry) return null;
  return (
    <group ref={groupRef} name="placementGhost">
      <mesh geometry={geometry} material={solid} />
      <mesh ref={ringRef} geometry={ring} material={overlay} position={[0, 0.02, 0]} />
    </group>
  );
}

/**
 * Where a screen point lands on the ground.
 *
 * A ray against **one mathematical plane**, not against the scene. Placement
 * happens at Pip's height, the ground is close to flat over a prop's footprint,
 * and intersecting a plane is a divide — a scene raycast against a hundred
 * thousand triangles to answer the same question would be a frame's work per
 * pointer move.
 */
export function useGroundPointer(heightfield: Heightfield) {
  const camera = useThree((s) => s.camera);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const ndc = useMemo(() => new THREE.Vector2(), []);
  const hit = useMemo(() => new THREE.Vector3(), []);

  return useMemo(
    () =>
      (clientX: number, clientY: number, rect: DOMRect, atHeight: number): [number, number] | null => {
        ndc.set(
          ((clientX - rect.left) / rect.width) * 2 - 1,
          -((clientY - rect.top) / rect.height) * 2 + 1,
        );
        raycaster.setFromCamera(ndc, camera);
        plane.constant = -atHeight;
        if (!raycaster.ray.intersectPlane(plane, hit)) return null;
        // One correction pass: the plane was at Pip's height, the ground where
        // the finger landed may not be. Sampling there and re-intersecting puts
        // the ghost on the hillside instead of on the plane through it.
        const y = sampleHeight(heightfield, hit.x, hit.z);
        plane.constant = -y;
        if (!raycaster.ray.intersectPlane(plane, hit)) return [hit.x, hit.z];
        return [hit.x, hit.z];
      },
    [camera, raycaster, plane, ndc, hit, heightfield],
  );
}
