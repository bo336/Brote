'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

import { applyCosmetics, applyStage, buildPip, disposePip, type PipRoot } from '@/lib/render/geometry/pip';
import { getClayMaterial, getOverlayMaterial } from '@/lib/render/materials';
import { PIP } from '@/lib/world/config';
import { currentOf, openChains } from '@/lib/world/game/missions';
import type { GameSpots, Spot } from '@/lib/world/game/spots';
import { CHAINS } from '@/lib/world/game/texto/cadenas';
import { castName, CARDS } from '@/lib/world/game/texto/guia';
import { regionCentre } from '@/lib/world/regions';
import { isPlantable, sampleHeight, snapToLand, type Heightfield, type WorldLayout } from '@/lib/world/terrain';
import { mulberry32 } from '@/lib/world/rng';
import type { PipCosmetics } from '@/lib/world/types';
import type { PropCollider } from '../../control/CharacterController';
import { PRIORITY, registerInteractable } from '../../interaction/InteractableRegistry';
import { PipRig } from '../../pip/PipRig';
import { playSfx } from '../../audio/sfx';
import { playerTransform } from '../../state/usePlayerStore';
import { useGameStore } from '../useGameStore';
import { useGameUi } from '../useGameUi';
import { useTags } from '../tags';

/**
 * The island's four voices, standing somewhere you can walk up to.
 *
 * They are built from Pip's own body — the same clay, the same eyes — with
 * their own palettes, hats and sizes, so they belong to this world instead of
 * being dropped into it. Each one stands where they care about (Don Beto by the
 * Punto Limpio, Inés by the vivero, Mila in La Pradera, Tuco by the lagoon),
 * except when a chapter of the story needs them somewhere else: then they wait
 * there, with a "!" over their head.
 *
 * Talking is always optional and always short. When nobody has a chapter for
 * you, a character tells you one thing from the Field Guide, in their voice —
 * a lesson you walked over to ask for, which is the least intrusive kind.
 */
interface CastDef {
  who: string;
  cosmetics: PipCosmetics;
  scale: number;
  /** The rank tier from which they live on the island. */
  from: number;
}

const CAST: CastDef[] = [
  { who: 'don_beto', cosmetics: { body: 'glaciar', hat: 'gorro', glasses: 'redondos' }, scale: 1.3, from: 1 },
  { who: 'ines', cosmetics: { body: 'bosque', hat: 'sombrero', glasses: 'redondos' }, scale: 1.25, from: 1 },
  { who: 'mila', cosmetics: { body: 'coral', hat: 'flor' }, scale: 1.02, from: 2 },
  { who: 'tuco', cosmetics: { body: 'atardecer', hat: 'visera', glasses: 'sol' }, scale: 1.28, from: 7 },
];

const TALK_RADIUS_M = 2.4;

/** Where a character waits for the chapter of the story that needs them. */
function spotFor(who: string, home: Spot, pendingRegion: string | null, terrain: WorldLayout): Spot {
  if (!pendingRegion || pendingRegion === 'claro') return home;
  const [cx, cz] = regionCentre(pendingRegion as Parameters<typeof regionCentre>[0]);
  const x = cx * 0.88;
  const z = cz * 0.88;
  const snapped = isPlantable(x, z, terrain) ? [x, z] : snapToLand(x, z, terrain, mulberry32(who.length * 97));
  if (!snapped) return home;
  return { x: snapped[0]!, z: snapped[1]!, rotY: Math.atan2(-snapped[0]!, -snapped[1]!) };
}

export function Cast({
  spots,
  heightfield,
  terrain,
  tier,
  onColliders,
}: {
  spots: GameSpots;
  heightfield: Heightfield;
  terrain: WorldLayout;
  tier: number;
  onColliders: (c: PropCollider[]) => void;
}) {
  const solid = useMemo(
    () => getClayMaterial({ vertexColors: true, wobble: false, wind: false, ao: false, rimBoost: PIP.rimBoost }),
    [],
  );
  const overlay = useMemo(() => getOverlayMaterial(), []);
  const present = useMemo(() => CAST.filter((c) => c.from <= tier), [tier]);
  const bodies = useMemo(() => present.map((c) => {
    const root = buildPip(1) as PipRoot;
    const rig = new PipRig(root);
    applyCosmetics(root, c.cosmetics, { solid, overlay });
    applyStage(root, 'leafy');
    root.scale.setScalar(c.scale);
    return { def: c, root, rig };
  }), [present, solid, overlay]);
  useEffect(() => () => bodies.forEach((b) => disposePip(b.root)), [bodies]);

  const state = useGameStore((s) => s.state);
  // Who has a chapter waiting to be opened, and in which region.
  const pending = useMemo(() => {
    const out = new Map<string, string>();
    if (!state) return out;
    for (const chain of openChains(state, tier)) {
      const m = currentOf(state, chain);
      if (m?.goal.k === 'talk' && !state.missions.met.includes(m.id)) out.set(m.goal.who, CHAINS[chain]!.region);
    }
    return out;
  }, [state, tier]);

  const positions = useMemo(() => bodies.map((b) => {
    const home = spots.cast[b.def.who]!;
    const at = spotFor(b.def.who, home, pending.get(b.def.who) ?? null, terrain);
    return { ...at, y: sampleHeight(heightfield, at.x, at.z) };
  }), [bodies, spots, pending, terrain, heightfield]);

  useEffect(() => {
    bodies.forEach((b, i) => {
      const p = positions[i]!;
      b.root.position.set(p.x, p.y, p.z);
      b.root.rotation.y = p.rotY;
      b.rig.setState('idle');
    });
    onColliders(positions.map((p) => ({ x: p.x, z: p.z, radius: 0.35, cameraRadius: 0.5 })));
  }, [bodies, positions, onColliders]);

  const setMany = useTags((s) => s.setMany);
  useEffect(() => {
    setMany('cast:', bodies.map((b, i) => {
      const p = positions[i]!;
      return {
        id: `cast:${b.def.who}`, x: p.x, y: p.y + 1.25 * b.def.scale, z: p.z, tone: 'cast' as const,
        within: pending.has(b.def.who) ? 40 : 9, title: castName(b.def.who),
        badge: pending.has(b.def.who) ? '!' : undefined,
      };
    }));
  }, [bodies, positions, pending, setMany]);
  useEffect(() => () => useTags.getState().clearPrefix('cast:'), []);

  // Talking: the chapter if there is one, otherwise one thing they know.
  const facts = useRef(new Map<string, number>());
  useEffect(() => {
    const offs = bodies.map((b, i) => {
      const p = positions[i]!;
      return registerInteractable({
        id: `game-cast-${b.def.who}`,
        position: [p.x, p.y, p.z],
        radius: TALK_RADIUS_M,
        labelKey: 'accion.mojon',
        label: `Hablar con ${castName(b.def.who)}`,
        priority: pending.has(b.def.who) ? PRIORITY.event : PRIORITY.normal,
        enabled: true,
        onInteract: () => {
          playSfx('talk');
          const store = useGameStore.getState();
          const before = store.state;
          const chain = before ? openChains(before, tier).find((c) => {
            const m = currentOf(before, c);
            return m?.goal.k === 'talk' && m.goal.who === b.def.who && !before.missions.met.includes(m.id);
          }) : undefined;
          const opening = chain && before ? currentOf(before, chain) : null;
          store.dispatch({ t: 'talk', who: b.def.who }, [p.x, p.y, p.z]);
          if (opening) {
            const after = useGameStore.getState().state;
            const next = after && chain ? currentOf(after, chain) : null;
            useGameUi.getState().open({
              kind: 'dialogo',
              dialog: { who: b.def.who, lines: [opening.intro ?? opening.ask, ...(next ? [next.ask] : [])], close: 'Dale' },
            });
            return;
          }
          // No chapter: their own current mission as a reminder, or something they know.
          const mine = before ? openChains(before, tier).map((c) => currentOf(before, c)).find((m) => m?.who === b.def.who) : null;
          const known = CARDS.filter((c) => c.who === b.def.who);
          const n = facts.current.get(b.def.who) ?? Math.floor(Math.random() * Math.max(1, known.length));
          facts.current.set(b.def.who, n + 1);
          const fact = known.length ? known[n % known.length]! : null;
          useGameUi.getState().open({
            kind: 'dialogo',
            dialog: {
              who: b.def.who,
              lines: [mine ? mine.ask : null, fact ? fact.text : null].filter((l): l is string => !!l),
              close: 'Gracias',
            },
          });
        },
      });
    });
    return () => offs.forEach((off) => off());
  }, [bodies, positions, pending, tier]);

  useFrame((_, dt) => {
    const t = performance.now() / 1000;
    const pp = playerTransform;
    bodies.forEach((b, i) => {
      const p = positions[i]!;
      // Turn toward Pip when close: somebody who notices you is somebody you can talk to.
      const d = Math.hypot(pp.x - p.x, pp.z - p.z);
      if (d < 6) {
        const want = Math.atan2(pp.x - p.x, pp.z - p.z);
        let diff = want - b.root.rotation.y;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        b.root.rotation.y += diff * (1 - Math.exp(-dt * 4));
      }
      b.rig.update(dt, t + i * 1.3);
    });
  });

  return (
    <group name="cast">
      {bodies.map((b) => <primitive key={b.def.who} object={b.root} />)}
    </group>
  );
}
