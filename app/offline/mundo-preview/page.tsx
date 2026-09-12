'use client';

import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo } from 'react';

import { LoadingState } from '@/components/mundo3d/hud/LoadingState';
import { playerTransform, usePlayerStore } from '@/components/mundo3d/state/usePlayerStore';
import { useSessionStore } from '@/components/mundo3d/state/useSessionStore';
import { regionCentre } from '@/lib/world/regions';
import { isWater, snapToLand, terrainHeight } from '@/lib/world/terrain';
import { useWorldStore } from '@/components/mundo3d/state/useWorldStore';
import { mulberry32 } from '@/lib/world/rng';
import { PROP_IDS } from '@/lib/world/progression';
import { SPECIES } from '@/lib/world/species';
import { parseWorldPayload } from '@/lib/world/payload';
import * as THREE from 'three';

import { updateReveal } from '@/lib/render/materials';
import { liveGeometryKeys } from '@/lib/render/geometry';
import { listInteractables } from '@/components/mundo3d/interaction/InteractableRegistry';
import type { RegionId, TimeOfDay } from '@/lib/world/types';

/**
 * The world, without an account.
 *
 * `/mundo` needs a session, a profile and the `mundo_enabled()` flag, which
 * means the only people who can look at the 3D world are people who can sign
 * in. That makes it impossible to review — every art judgement in
 * `20-ACCEPTANCE.md` §2A and §3A is "look at it and say", and the person asking
 * for those judgements could not.
 *
 * So this route renders the same `MundoGame` against a fixed demo user with no
 * impact and no placements. It reads nothing and writes nothing: the id below
 * is a literal, the impact totals are zeros inside `MundoGame`, and there is no
 * Supabase call anywhere in the tree. What it exposes is the renderer.
 *
 * **It is under `/offline`, which `lib/supabase/middleware.ts` treats as
 * public.** That is deliberate and it is the whole point — but it does mean the
 * page ships. Phase 5's sweep should decide whether to keep it, gate it behind
 * an env var, or drop it once there is another way to review the world.
 *
 * Every parameter is in the URL so a screenshot can be reproduced exactly:
 *
 *   ?tier=1..11   the world tier (how much of the island exists)
 *   ?q=0..3       the quality tier, forced
 *   ?perf=1       the measurement overlay; off by default, so the art pass sees the world
 *   ?tod=         amanecer | dia | atardecer | noche
 *   ?world=       the world index, which picks the biome
 *   ?at=          a region id — drops Pip at its centre once the world is up
 *   ?props=1      lay one of each placeable prop out around the spawn
 *   ?impact=N     fixture impact totals, to drive the mirror and El Mojón
 *   ?seen=N       log the first N species of the tier, to review the Bitácora
 *   ?aged=N       pretend the island is N days old, for idle maturation
 *   ?proyectos=N  N commemorative project markers, to review the path of stones
 *   ?evento=id    play one of the six events on entry
 *   ?marchito=N   N overdue reviews, to review the wilting objects
 *   ?tierup=N     play tier N's ceremony on entry, as if it had just been reached
 *   ?first=1      run the first-session sequence, as somebody arriving for the first time
 *   ?rm=1         force reduced motion, for the cuts-instead-of-moves variant
 *
 * `?impact=` is how the four mirror channels get demonstrated without waiting
 * for somebody to log a year of real actions: 0 is a brand-new island, 1 is a
 * few weeks in, 2 is years of it. The figures are made up and stay in this
 * file — nothing else in the app may invent an impact number.
 */
const DEMO_USER = '3f1c0e2a-0000-4000-8000-000000000001';

const MundoGame = dynamic(() => import('@/components/mundo3d/MundoGame'), {
  ssr: false,
  loading: () => <LoadingState />,
});

/** Fixture totals, in the units `brote_user_impact` returns. */
const ZERO = { water_l: 0, co2_kg: 0, waste_kg: 0, energy_kwh: 0, actions: 0 };
const IMPACT_FIXTURES = [
  ZERO,
  // `actions` is what tier 8's ceremony line counts, so a fixture without it
  // reviews as "El monte se levantó con 0 acciones tuyas" — which is a sentence
  // the product should never be able to say.
  { water_l: 1240, co2_kg: 2.4, waste_kg: 3.1, energy_kwh: 12, actions: 86 },
  { water_l: 96000, co2_kg: 420, waste_kg: 310, energy_kwh: 2600, actions: 4120 },
];

function Preview() {
  const params = useSearchParams();
  const at = params.get('at') as RegionId | null;
  const eventoParam = params.get('evento');
  const tierUpParam = params.get('tierup');
  const tierUp = tierUpParam === null ? null : Number(tierUpParam);
  // A ceremony is for the tier being reached, so asking for one sets the world
  // to it — a tier-8 ceremony on a tier-2 island would frame a mountain that
  // does not exist yet.
  const tier = tierUp ?? Number(params.get('tier') ?? '2');
  const setReducedMotion = useSessionStore((state) => state.setReducedMotion);
  const forceReducedMotion = params.get('rm') === '1';

  useEffect(() => {
    if (forceReducedMotion) setReducedMotion(true);
  }, [forceReducedMotion, setReducedMotion]);

  /**
   * A payload built here rather than fetched, so the route needs no session.
   * It goes through the same parser the real page uses, which means the preview
   * cannot accidentally be looking at a shape the game will never receive.
   */
  const payload = useMemo(() => {
    const fixture = IMPACT_FIXTURES[Number(params.get('impact') ?? '0')] ?? ZERO;
    return parseWorldPayload(
      {
        userId: DEMO_USER,
        seed: 12345,
        // `celebrated_tier` is what decides whether a ceremony is owed. One
        // below the current tier queues exactly one, which is what `?tierup=`
        // asks for; equal to it queues none, which is the ordinary case.
        world: {
          seed: 12345,
          // Idle maturation reads the island's age off this. `?aged=` is how a
          // week of growth gets reviewed without waiting a week.
          created_at: new Date(
            Date.now() - Number(params.get('aged') ?? '0') * 24 * 3600 * 1000,
          ).toISOString(),
          celebrated_tier: tierUp !== null ? tierUp - 1 : tier,
          // The first session is opt-in here: `?first=1`. Without it the world
          // reads as already known, which is what every other review of this
          // route is about — an art pass spent looking at a tutorial ring is
          // an art pass that saw the tutorial and not the art.
          onboarded_at: params.get('first') === '1' ? null : '2020-01-01T00:00:00.000Z',
          layouts: [],
        },
        mundo: {
          rankTier: tier,
          structuralElements: ['soil'],
          worldIndex: Number(params.get('world') ?? '1'),
          liveliness: 0.8,
          palette: 'default',
        },
        impact: fixture,
        collectiveWaterL: fixture.water_l * 1000,
        semillas: 120,
        // Everything the tier has unlocked, so placement mode has a tray. On a
        // real island this is `user_cosmetics` — what somebody actually bought.
        ownedCosmetics: PROP_IDS,
        placements: [],
        // A census with something in it. The Bitácora's whole shape — a
        // silhouette next to a logged sighting — is invisible on an empty one.
        // Fixture memories. Real ones come from `world_project_markers`, which
        // only counts sessions somebody actually attended.
        projectMarkers: Array.from(
          { length: Number(params.get('proyectos') ?? '0') },
          (_, i) => ({
            id: `demo-${i}`,
            title: `Plantada en la plaza ${i + 1}`,
            place: i % 3 === 0 ? null : 'Chacarita',
            date: new Date(Date.now() - (i + 1) * 12 * 86400000).toISOString().slice(0, 10),
          }),
        ),
        dueReviews: Number(params.get('marchito') ?? '0'),
        journal: SPECIES.filter((sp) => sp.min_tier <= tier)
          .slice(0, Number(params.get('seen') ?? '0'))
          .map((sp) => ({
            species_slug: sp.slug,
            first_seen_at: '2026-09-01T12:00:00Z',
            region: sp.region,
            time_of_day: sp.time_of_day[0] ?? 'dia',
            count: 1,
          })),
      },
      DEMO_USER,
    );
  }, [params, tier, tierUp]);

  /**
   * `?at=` and a `window.__pipTo(region)` hook, for touring the island without
   * walking the whole way.
   *
   * **Prefer walking.** A jump moves `playerTransform` instantly while the rig
   * and the camera damp toward it, so for a second or two afterwards the camera
   * is aimed at one place and Pip is drawn in another. Screenshots taken in
   * that window are of a state the game never actually reaches — it is what
   * produced a run of "the camera is inside a tree" frames that turned out to
   * be nothing at all.
   */
  useEffect(() => {
    const w = window as unknown as {
      __pipTo?: (id: RegionId) => [number, number];
      __pipAt?: (x: number, z: number) => void;
      __hud?: (mode: string) => void;
      __tierup?: (n: number, kind?: 'tier' | 'world') => void;
      __ceremony?: () => unknown;
      __beat?: (beat: string) => void;
      __evento?: (id: string) => void;
      __geometries?: () => string[];
      __interactables?: () => unknown[];
      __pip?: () => unknown;
      __reveal?: (m: string, a: number, x: number, y: number, z: number, r: number, bare?: string) => void;
    };
    w.__pipTo = (id: RegionId) => {
      const [cx, cz] = regionCentre(id);
      // **Snapped to land.** El Río's centre is the lagoon, so `?at=rio` used
      // to park Pip floating on the water — which is not a bug in the game,
      // it is a bug in the tour, and it put a character standing on a river
      // into the middle of the art pass's own screenshots.
      const terrain = useWorldStore.getState().layout?.terrain;
      /**
       * **Snap only out of the water.**
       *
       * `snapToLand` looks for *plantable* ground — gentle slope, above water,
       * inside the coast — and a mountain summit is none of those. Snapping
       * unconditionally walked La Cumbre forty metres downhill to the nearest
       * flat spot, which is how the tour ended up photographing the rim while
       * claiming to be on the peak. El Río's centre is the lagoon and does need
       * the snap; the steep regions need to be left exactly where they are.
       */
      const [x, z] = (terrain && isWater(cx, cz, terrain)
        ? snapToLand(cx, cz, terrain, mulberry32(7))
        : null) ?? [cx, cz];
      playerTransform.x = x;
      playerTransform.z = z;
      // **And the height.** Writing x and z alone left Pip at whatever altitude
      // he was already at, which is fine on the flat regions and wrong on every
      // one that is not: on La Cumbre, El Monte and El Monumento he arrived
      // twenty metres under the mountain or twenty metres over it, the camera
      // followed him there, and the art pass's own screenshots of three of the
      // nine regions were a rectangle of sky.
      if (terrain) playerTransform.y = terrainHeight(x, z, terrain);
      return [x, z];
    };
    // Anywhere, not only a region centre — the Mojón sits on the path between
    // two of them and there is no region id for a path.
    w.__pipAt = (x: number, z: number) => {
      playerTransform.x = x;
      playerTransform.z = z;
    };
    // And open a sheet without walking to it, for reviewing the panel itself.
    w.__hud = (mode: string) => useSessionStore.getState().setHud(mode as 'play');
    // Hold beat 3 at a fixed point, so an arrival can be looked at rather than
    // watched. `updateReveal` is the same call the runner makes every frame.
    w.__reveal = (
      mode: string,
      amount: number,
      cx: number,
      cy: number,
      cz: number,
      radius: number,
      // The colour the world is coming FROM: bare rock for a snow line, the
      // previous biome's grass for a palette wash.
      bare = '#A8A296',
    ) => {
      const c = new THREE.Color(bare);
      updateReveal({
        mode: mode as 'uplift',
        centre: [cx, cy, cz],
        radius,
        amount,
        bare: [c.r, c.g, c.b],
      });
    };
    // What the ceremony thinks it is doing, for reviewing a beat rather than
    // guessing at one from a screenshot.
    w.__ceremony = () => {
      const st = useSessionStore.getState();
      return { ...st.ceremony, before: st.ceremony.before ? 'captured' : null, queue: st.ceremonyQueue, hud: st.hud };
    };
    // Everything you could walk up to, and where. The answer to "are the
    // chores in the world?" without walking the whole island to find out.
    w.__interactables = () => listInteractables();
    // Where Pip actually is, and what the button is currently offering.
    // …and what the controls harness needs to check a jump and a press of E.
    w.__pip = () => ({
      x: playerTransform.x, y: playerTransform.y, z: playerTransform.z,
      airborne: playerTransform.airborne, speed: playerTransform.speed,
      active: useSessionStore.getState().active?.id ?? null,
      note: useSessionStore.getState().note,
      verb: usePlayerStore.getState().verb,
    });
    // What shapes are actually live, for the perf protocol: a count says a
    // ceiling broke, the keys say which shape broke it.
    w.__geometries = () => liveGeometryKeys();
    // Park the HUD on one beat, so a card can be reviewed rather than caught.
    // The runner only writes the beat when ITS beat changes, so a value set
    // here survives until the clock crosses a boundary of its own.
    w.__beat = (b: string) => useSessionStore.getState().setCeremonyBeat(b as 'title');
    // Play an event without waiting for the server to pick one.
    w.__evento = (id: string) => useSessionStore.getState().startEvent(id as 'incendio');
    // Replay a ceremony without reloading, for stepping through the beats.
    w.__tierup = (t: number, kind: 'tier' | 'world' = 'tier') => {
      const store = useSessionStore.getState();
      store.queueCeremonies([{ kind, n: t }]);
      store.nextCeremony();
    };
    const evento = eventoParam;
    if (evento) useSessionStore.getState().startEvent(evento as 'incendio');
    if (!at) return;
    /**
     * Re-applied on a timer, and **it has to keep going**: the world finishes
     * building after the first jump and `World` calls `resetPlayerTransform`,
     * which puts Pip back at the spawn. An earlier version stopped the interval
     * once he had arrived, and every tour region quietly became a photograph of
     * El Claro.
     *
     * **The dependency array is the real fix here.** This effect had none, so
     * it re-ran on every render: each pass tore down the interval and started a
     * fresh one, and while the world hydrates, the quality monitor settles and
     * the camera invalidates, renders come faster than 1500 ms. The teleport
     * was a coin flip — which is where the run of impossible screenshots came
     * from, a summit in one shot and the spawn in the next, from one URL.
     */
    const id = setInterval(() => w.__pipTo?.(at), 1500);
    return () => clearInterval(id);
    /**
     * **Primitives, not `params`.**
     *
     * `useSearchParams()` hands back a fresh object on every render, so an
     * effect that depends on it depends on nothing: it re-ran every pass, tore
     * down the teleport interval and started another. While the world hydrates,
     * the quality monitor settles and the camera invalidates, renders come
     * faster than the interval's 1500 ms — so the jump was a coin flip, and the
     * tour's screenshots contradicted each other from one URL.
     */
  }, [at, eventoParam]);

  return (
    <MundoGame
      // Opt-in, because the art pass and the perf pass want different frames:
      // an overlay in the corner of every screenshot is the one thing that
      // stops a picture reading as a game.
      perf={params.get('perf') === '1'}
      // **Nothing here may write.** The route has no session, and a payload is
      // normally exactly the signal that says one exists — so without this the
      // autosave and `world_mark_celebrated` both fire against Supabase as an
      // anonymous caller, and the app bounces the reviewer to the login screen
      // in the middle of the thing they came to look at.
      readOnly
      forcedTier={Number(params.get('q') ?? '1')}
      payload={payload}
      timeOfDay={(params.get('tod') as TimeOfDay | null) ?? 'dia'}
      demoProps={params.get('props') === '1'}
      // A tour teleports Pip by writing the transform, which invalidates
      // nothing. Without this the loop idles, the camera never follows, and
      // every `?at=` screenshot is of the spawn.
      alwaysRender={at !== null}
    />
  );
}

export default function MundoPreviewPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <Preview />
    </Suspense>
  );
}
