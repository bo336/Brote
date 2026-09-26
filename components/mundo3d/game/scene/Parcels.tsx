'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

import { invasiveGeometry } from '@/lib/render/geometry/pickups';
import { parcelRibbon, parcelStake } from '@/lib/render/geometry/stations-game';
import { getGeometry } from '@/lib/render/geometry';
import { InstancePool } from '@/lib/render/instancing';
import { getClayMaterial } from '@/lib/render/materials';
import { careOf, type CareKind } from '@/lib/world/game/care';
import { parcelOffer } from '@/lib/world/game/next-action';
import { bagFree } from '@/lib/world/game/state';
import { parcelRegion, parcelsAt, type ParcelSpec } from '@/lib/world/game/parcels';
import { INVASIVES, PARCEL_TYPES } from '@/lib/world/game/plants';
import { sampleHeight, type Heightfield } from '@/lib/world/terrain';
import { PRIORITY, registerInteractable } from '../../interaction/InteractableRegistry';
import { useGameStore } from '../useGameStore';
import { useTags } from '../tags';

/**
 * Every parcel you can work: its stake, its invasive while it is wild, and the
 * one thing its marker offers right now (`lib/world/game/next-action.ts`).
 *
 * The stake's ribbon is the parcel's state at a glance — from a distance a
 * field of red ribbons is a field that needs you, and a field of green ones is
 * one you already cared for.
 */
const RIBBON: string[] = ['#D9534F', '#E7A33A', '#8C6239', '#9CC93B', '#2FA36B', '#F2C94C'];
/** A care of the day turns the ribbon to the alert colour. */
const RIBBON_ALERT = '#FFB23E';
const TAG_WITHIN_M = 7.5;
const ACT_RADIUS_M = 2.2;
const INV_RADIUS_M = 1.6;
const MAX_PARCELS = 180;

const color = new THREE.Color();

export function Parcels({ heightfield }: { heightfield: Heightfield }) {
  const field = useGameStore((s) => s.field);
  const state = useGameStore((s) => s.state);
  const base = useGameStore((s) => s.base);
  const ctx = useGameStore.getState().ctx();
  const tier = base?.tier ?? 1;
  const clearPrefix = useTags((s) => s.clearPrefix);

  const material = useMemo(() => getClayMaterial({ vertexColors: true, wind: false, wobble: false }), []);
  const foliage = useMemo(() => getClayMaterial({ vertexColors: true, wind: true, wobble: true }), []);
  const stakes = useMemo(() => {
    const pool = new InstancePool(getGeometry('game:stake', parcelStake), material, MAX_PARCELS, { name: 'parcel-stakes' });
    pool.mesh.castShadow = true;
    return pool;
  }, [material]);
  const ribbons = useMemo(
    () => new InstancePool(getGeometry('game:ribbon', parcelRibbon), foliage, MAX_PARCELS, { name: 'parcel-ribbons', colors: true }),
    [foliage],
  );
  const weeds = useMemo(() => {
    const pool = new InstancePool(invasiveGeometry(), foliage, MAX_PARCELS, { name: 'invasives' });
    pool.mesh.castShadow = true;
    return pool;
  }, [foliage]);
  useEffect(() => () => {
    stakes.dispose();
    ribbons.dispose();
    weeds.dispose();
  }, [stakes, ribbons, weeds]);

  const parcels = useMemo(() => (field ? parcelsAt(field, tier) : []), [field, tier]);
  const heights = useMemo(
    () => new Map(parcels.map((p) => [p.id, sampleHeight(heightfield, p.x, p.z)])),
    [parcels, heightfield],
  );

  // Stakes and invasives: rebuilt whenever a parcel changes stage.
  const stageKey = parcels.map((p) => `${state?.parcels[p.id]?.s ?? 0}${state?.parcels[p.id]?.inv ? 'i' : ''}`).join('');
  const careKey = state && field && ctx ? parcels.map((p) => careOf(state, field, p.id, ctx) ?? '-').join(',') : '';
  useEffect(() => {
    if (!state || !field) return;
    stakes.reset();
    ribbons.reset();
    weeds.reset();
    for (const p of parcels) {
      const ps = state.parcels[p.id];
      const stage = ps?.s ?? 0;
      const y = heights.get(p.id) ?? 0;
      const i = stakes.alloc();
      if (i < 0) break;
      const rot = (p.i * 1.7 + p.j) % (Math.PI * 2);
      stakes.place(i, p.x, y, p.z, rot, 1);
      const care = careKey.split(',')[parcels.indexOf(p)] as CareKind | '-';
      const r = ribbons.alloc();
      ribbons.place(r, p.x, y, p.z, rot, 1);
      ribbons.setColor(r, color.set(care && care !== '-' ? RIBBON_ALERT : RIBBON[stage]!));
      if (stage === 0 && p.invasive && !ps?.inv) {
        const w = weeds.alloc();
        const [ix, iz] = p.invasive;
        weeds.place(w, ix, sampleHeight(heightfield, ix, iz), iz, p.i + p.j, 1.1);
      }
      if (care === 'yuyo') {
        const w = weeds.alloc();
        weeds.place(w, p.x + 0.9, sampleHeight(heightfield, p.x + 0.9, p.z + 0.5), p.z + 0.5, p.i, 0.55);
      }
    }
    stakes.resize(stakes.count);
    ribbons.resize(ribbons.count);
    weeds.resize(weeds.count);
    stakes.commit();
    ribbons.commit();
    weeds.commit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageKey, careKey, parcels, heights, stakes, ribbons, weeds, field]);

  // What each marker offers, and its tag — recomputed only when something an
  // offer depends on changes (not on every piece of litter picked up).
  const bagFreeNow = state ? bagFree(state) > 0 : false;
  const sig = state
    ? JSON.stringify([
      state.parcels, state.bag.compost, state.bag.piedras, state.bag.plantines, state.agua,
      state.today.harvested, state.today.cared, state.today.day, state.inv, bagFreeNow,
    ])
    : '';
  const offers = useMemo(
    () => (state && field && ctx ? parcels.map((p) => ({ p, offer: parcelOffer(state, field, p, ctx) })) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sig, field, ctx?.day, parcels],
  );
  const setMany = useTags((s) => s.setMany);
  useEffect(() => {
    if (!state || !field) return;
    setMany('pc:', offers.map(({ p, offer }) => ({
      id: `pc:${p.id}`, x: p.x, y: (heights.get(p.id) ?? 0) + 1.05, z: p.z, tone: offer.urgent ? 'alert' : 'parcel',
      within: TAG_WITHIN_M, title: offer.title, lines: [offer.line],
    })));
    const offs: (() => void)[] = [];
    for (const { p, offer } of offers) {
      const y = heights.get(p.id) ?? 0;
      if (offer.action) {
        const action = offer.action;
        offs.push(registerInteractable({
          id: `game-parcel-${p.id}`,
          position: [p.x, y, p.z],
          radius: ACT_RADIUS_M,
          labelKey: 'accion.mojon',
          label: offer.label ?? 'Usar',
          priority: offer.urgent ? PRIORITY.chore : PRIORITY.normal,
          enabled: true,
          onInteract: () => useGameStore.getState().dispatch(action, [p.x, y, p.z]),
        }));
      }
      const ps = state.parcels[p.id];
      if ((ps?.s ?? 0) === 0 && p.invasive && !ps?.inv) {
        const [ix, iz] = p.invasive;
        const inv = INVASIVES[PARCEL_TYPES[parcelRegion(p, ps, tier)].invasive];
        offs.push(registerInteractable({
          id: `game-invasive-${p.id}`,
          position: [ix, sampleHeight(heightfield, ix, iz), iz],
          radius: INV_RADIUS_M,
          labelKey: 'accion.mojon',
          label: `Arrancar ${inv?.name.toLowerCase() ?? 'la invasora'}`,
          priority: PRIORITY.chore,
          enabled: true,
          onInteract: () => useGameStore.getState().dispatch({ t: 'pull', parcel: p.id }, [ix, 0, iz]),
        }));
      }
    }
    return () => offs.forEach((off) => off());
  }, [offers, heights, heightfield, tier, setMany]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => clearPrefix('pc:'), [clearPrefix]);

  return (
    <group name="parcels">
      <primitive object={stakes.mesh as THREE.Object3D} />
      <primitive object={ribbons.mesh as THREE.Object3D} />
      <primitive object={weeds.mesh as THREE.Object3D} />
    </group>
  );
}

export type { ParcelSpec };
