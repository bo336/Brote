'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

import { getGeometry } from '@/lib/render/geometry';
import { ceiboBed, ceiboFlower, ceiboFlowerPointsOn, ceiboLanterns, ceiboSpring, ceiboTree } from '@/lib/render/geometry/ceibo';
import { buildLeafAtlas } from '@/lib/render/geometry/leaf-atlas';
import { InstancePool } from '@/lib/render/instancing';
import { getClayMaterial, getTexture } from '@/lib/render/materials';
import { CEIBO, ceiboShape } from '@/lib/world/game/ceibo';
import type { GameSpots } from '@/lib/world/game/spots';
import type { ImpactTotals } from '@/lib/world/types';
import { sampleHeight, type Heightfield } from '@/lib/world/terrain';
import type { PropCollider } from '../../control/CharacterController';
import { PRIORITY, registerInteractable } from '../../interaction/InteractableRegistry';
import { useSessionStore } from '../../state/useSessionStore';
import { useWorldStore } from '../../state/useWorldStore';
import { useTags } from '../tags';

/**
 * Tu Ceibo — real impact, and nothing else (`docs/MUNDO_JUEGO.md` §3.10).
 *
 * The game never touches it: no mission, no semilla, no parcel moves it. It
 * grows with the actions you log in Brote, one red flower for each, and around
 * its roots the four measured channels take a shape: a spring for the water
 * saved, a flowerbed where the rubbish was, lanterns for the energy, and the
 * crown itself for the air. Walking up to it opens El Mojón, where the numbers
 * are, with their method.
 *
 * It stands by where you arrive, so it is the first thing you see and the
 * last thing that ever looks the same two weeks running.
 */
export function Ceibo({
  spots,
  heightfield,
  night,
  interactive,
  onColliders,
}: {
  spots: GameSpots;
  heightfield: Heightfield;
  night: boolean;
  interactive: boolean;
  onColliders: (c: PropCollider[]) => void;
}) {
  const impact: ImpactTotals = useWorldStore((s) => s.impact);
  const shape = useMemo(() => ceiboShape(impact), [impact]);
  const at = spots.ceibo;
  const y = useMemo(() => sampleHeight(heightfield, at.x, at.z), [heightfield, at.x, at.z]);

  const tree = useMemo(() => {
    let built: ReturnType<typeof ceiboTree> | null = null;
    const make = () => (built ??= ceiboTree());
    return {
      wood: getGeometry('ceibo:wood', () => make().wood),
      leaves: getGeometry('ceibo:leaves', () => make().leaves),
    };
  }, []);
  const treeHeight = useMemo(() => {
    tree.leaves.computeBoundingBox();
    return tree.leaves.boundingBox?.max.y ?? 3;
  }, [tree]);

  const materials = useMemo(() => ({
    wood: getClayMaterial({ vertexColors: true, wind: false, wobble: false }),
    leaves: getClayMaterial({
      vertexColors: true, wind: true, wobble: false, side: THREE.DoubleSide, alphaTest: 0.5,
      map: getTexture('leaf-atlas', buildLeafAtlas),
    }),
    // Lit paper at night: unlit, so the bloom pass does the glowing.
    glow: new THREE.MeshBasicMaterial({ color: new THREE.Color('#FFC46B').multiplyScalar(1.6), toneMapped: false }),
  }), []);
  useEffect(() => () => materials.glow.dispose(), [materials]);

  // One flower per real action, up to the cap; past it, the crown is simply full.
  const flowers = useMemo(() => {
    const pool = new InstancePool(getGeometry('ceibo:flower', ceiboFlower), materials.wood, CEIBO.maxFlowers, { name: 'ceibo-flowers' });
    return pool;
  }, [materials]);
  useEffect(() => () => flowers.dispose(), [flowers]);
  useEffect(() => {
    flowers.reset();
    const pts = ceiboFlowerPointsOn(tree.leaves, shape.flowers);
    for (const [fx, fy, fz, rot] of pts) {
      const i = flowers.alloc();
      if (i < 0) break;
      flowers.place(i, at.x + fx * shape.scale, y + fy * shape.scale, at.z + fz * shape.scale, rot, CEIBO.flowerScale, 0.25, 0);
    }
    flowers.resize(flowers.count);
    flowers.commit();
  }, [flowers, shape, tree, at.x, at.z, y]);

  const spring = useMemo(
    () => (shape.springM > 0 ? getGeometry(`ceibo:spring:${Math.round(shape.springM * 100)}`, () => ceiboSpring(shape.springM)) : null),
    [shape.springM],
  );
  const bed = useMemo(
    () => (shape.bedFlowers > 0 ? getGeometry(`ceibo:bed:${shape.bedFlowers}`, () => ceiboBed(shape.bedFlowers)) : null),
    [shape.bedFlowers],
  );
  const lanterns = useMemo(() => {
    if (shape.lanterns <= 0) return null;
    let built: ReturnType<typeof ceiboLanterns> | null = null;
    const make = () => (built ??= ceiboLanterns(shape.lanterns, CEIBO.lanternRingM));
    return {
      posts: getGeometry(`ceibo:posts:${shape.lanterns}`, () => make().posts),
      glass: getGeometry(`ceibo:glass:${shape.lanterns}`, () => make().glass),
    };
  }, [shape.lanterns]);

  useEffect(() => {
    onColliders([{ x: at.x, z: at.z, radius: CEIBO.trunkRadiusM * shape.scale, cameraRadius: CEIBO.crownRadiusM * shape.scale }]);
  }, [onColliders, at.x, at.z, shape.scale]);

  // A name over it, and El Mojón when you walk up.
  const setTag = useTags((s) => s.set);
  const removeTag = useTags((s) => s.remove);
  useEffect(() => {
    setTag({
      id: 'ceibo', x: at.x, y: y + treeHeight * shape.scale + 0.3, z: at.z, tone: 'cast', within: CEIBO.tagWithinM,
      title: CEIBO.copy.title, lines: [CEIBO.copy.line(impact.actions ?? 0)],
    });
    return () => removeTag('ceibo');
  }, [setTag, removeTag, at.x, at.z, y, treeHeight, shape.scale, impact.actions]);
  useEffect(() => {
    if (!interactive) return;
    return registerInteractable({
      id: 'game-ceibo',
      position: [at.x, y, at.z],
      radius: CEIBO.interactRadiusM,
      labelKey: 'accion.mojon',
      label: CEIBO.copy.verb,
      priority: PRIORITY.normal,
      enabled: true,
      onInteract: () => useSessionStore.getState().setHud('mojon'),
    });
  }, [interactive, at.x, at.z, y]);

  const s = shape.scale;
  return (
    <group name="ceibo">
      <group position={[at.x, y, at.z]} scale={[s, s, s]}>
        <mesh geometry={tree.wood} material={materials.wood} castShadow receiveShadow />
        <mesh geometry={tree.leaves} material={materials.leaves} castShadow />
      </group>
      <primitive object={flowers.mesh} />
      {spring && (
        <mesh geometry={spring} material={materials.wood} position={[at.x + CEIBO.springAt[0], y - 0.01, at.z + CEIBO.springAt[1]]} receiveShadow />
      )}
      {bed && (
        <mesh geometry={bed} material={materials.wood} position={[at.x + CEIBO.bedAt[0], y, at.z + CEIBO.bedAt[1]]} rotation={[0, 0.5, 0]} receiveShadow />
      )}
      {lanterns && (
        <group position={[at.x, y, at.z]}>
          <mesh geometry={lanterns.posts} material={materials.wood} castShadow />
          <mesh geometry={lanterns.glass} material={night ? materials.glow : materials.wood} />
        </group>
      )}
    </group>
  );
}
