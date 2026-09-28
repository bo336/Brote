/**
 * The game core (`lib/world/game`): determinism, the rules, and the one-way
 * valve between the world and the app.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { buildParcels, parcelAt, parcelRegion, parcelsAt } from '../game/parcels';
import { ceiboShape } from '../game/ceibo';
import { missionView, targetName } from '../game/targets';
import { ripe } from '../game/parcel-actions';
import { gameSpots } from '../game/spots';
import type { Spawn } from '../game/spawns';
import { newGame, sanitize, balance, bagCount, bagCap, dayOf } from '../game/state';
import { reduce, type GameAction } from '../game/reduce';
import { dailySpawns, parcelLitter } from '../game/spawns';
import { buildLayout, insideCoast } from '../layout';
import { cumulativeState, unlocksFor } from '../progression';
import { hashInt } from '../rng';
import { SHOP } from '../game/shop';
import { PLANTS, PARCEL_TYPES, INVASIVES } from '../game/plants';
import { CHAINS, CHAIN_ORDER } from '../game/texto/cadenas';
import { STATIONS } from '../game/stations';
import { SPECIES_BY_SLUG } from '../species';
import { DAILIES } from '../game/texto/diarias';
import { CARD_BY_ID } from '../game/texto/guia';
import type { GameContext } from '../game/types';

const WHO = '3f1c0e2a-0000-4000-8000-000000000001';
const SEED = hashInt(WHO);
const field = buildParcels(SEED);
const world = { field };
const ctx = (over: Partial<GameContext> = {}): GameContext => ({
  now: Date.UTC(2026, 9, 1, 22), day: '2026-10-01', tier: 1, div: 1, who: WHO, ...over,
});

test('parcels are deterministic and never on ground a later tier floods', () => {
  const again = buildParcels(SEED);
  assert.deepEqual(again.parcels.map((p) => [p.id, p.x, p.z, p.tier]), field.parcels.map((p) => [p.id, p.x, p.z, p.tier]));
  const counts = [1, 4, 7, 11].map((t) => parcelsAt(field, t).length);
  assert.ok(counts[0]! >= 6 && counts[0]! <= 16, `tier 1 has ${counts[0]} parcels`);
  assert.ok(counts[3]! >= 100, `tier 11 has ${counts[3]} parcels`);
  for (let i = 1; i < counts.length; i++) assert.ok(counts[i]! >= counts[i - 1]!, 'a tier only ever adds parcels');
  // Every parcel's own centre belongs to it.
  for (const p of field.parcels.slice(0, 40)) assert.equal(parcelAt(field, p.x, p.z)?.id, p.id);
});

test('a new game starts with the Punto Limpio standing and nothing else built', () => {
  const s = newGame(ctx());
  assert.equal(s.stations.punto_limpio?.lvl, 1);
  assert.equal(Object.keys(s.stations).length, 1);
  assert.ok(balance(s) > 0);
});

test('the reducer is pure: the input state is never mutated', () => {
  const s = newGame(ctx());
  const frozen = JSON.stringify(s);
  const layout = buildLayout(WHO, cumulativeState(1));
  const sp = dailySpawns({ seed: SEED, day: '2026-10-01', tier: 1, terrain: layout.terrain, coastline: layout.coastline })[0]!;
  reduce(s, { t: 'pickup', spawn: sp }, ctx(), world);
  assert.equal(JSON.stringify(s), frozen);
});

test('picking up, sorting and the galpón', () => {
  let s = newGame(ctx());
  const p = parcelsAt(field, 1)[0]!;
  for (const sp of parcelLitter(p, undefined)) s = reduce(s, { t: 'pickup', spawn: sp }, ctx(), world).state;
  assert.equal(s.bag.residuos.length, p.litter.length);
  const before = bagCount(s.bag);
  const r = reduce(s, { t: 'sort', bin: 'reciclable' }, ctx(), world);
  assert.equal(bagCount(r.state.bag), before - 1 + (r.state.bag.hojas > s.bag.hojas ? 1 : 0));
  assert.ok(r.events.some((e) => e.type === 'sorted'));
  assert.ok(r.events.some((e) => e.type === 'learned'), 'the first sort of a kind teaches its card');
});

test('a wild parcel cleans when its litter and invasive are gone, and only goes up', () => {
  let s = newGame(ctx());
  const p = parcelsAt(field, 1).find((x) => x.invasive)!;
  for (const sp of parcelLitter(p, undefined)) s = reduce(s, { t: 'pickup', spawn: sp }, ctx(), world).state;
  assert.equal(s.parcels[p.id]?.s, 0);
  s = reduce(s, { t: 'pull', parcel: p.id }, ctx(), world).state;
  assert.equal(s.parcels[p.id]?.s, 1);
  // A week away changes nothing that was done.
  const later = reduce(s, { t: 'tick' }, ctx({ day: '2026-10-08', now: Date.UTC(2026, 9, 8, 22) }), world).state;
  assert.equal(later.parcels[p.id]?.s, 1);
});

test('growing takes days, not clicks: a planted parcel needs waterings on different days', () => {
  let s = newGame(ctx());
  const p = parcelsAt(field, 1)[0]!;
  s.parcels[p.id] = { s: 3, lit: 255, inv: true, n: 0, plants: ['flechilla'], wet: [], at: 0, d: Math.floor(Date.UTC(2026, 9, 1) / 86_400_000), r: 'claro' };
  s.agua = 5;
  s = reduce(s, { t: 'water', parcel: p.id }, ctx(), world).state;
  const again = reduce(s, { t: 'water', parcel: p.id }, ctx(), world);
  assert.ok(again.events.some((e) => e.type === 'refused' && e.why === 'already_today'));
  assert.equal(again.state.parcels[p.id]?.s, 3);
  const tomorrow = ctx({ day: '2026-10-02', now: Date.UTC(2026, 9, 2, 22) });
  s = reduce(again.state, { t: 'water', parcel: p.id }, tomorrow, world).state;
  assert.equal(s.parcels[p.id]?.s, 4, 'two days, two waterings: alive');
});

test('a save survives any JSON, and never grows past its caps', () => {
  const junk = [null, 3, 'x', [], { v: 1, sem: { earned: -5, spent: 'a' }, bag: { residuos: ['nope', 'lata'], ramas: 1e12 }, parcels: { 'p1_1': { s: 99 } } }];
  for (const j of junk) {
    const s = sanitize(j, ctx());
    assert.ok(s.v >= 1);
    assert.ok(s.sem.earned >= 0);
    assert.ok(s.bag.ramas <= 999);
    for (const w of s.bag.residuos) assert.notEqual(w, 'nope');
    for (const ps of Object.values(s.parcels)) assert.ok(ps.s <= 5);
  }
});

test('the daily cap holds no matter what the rules pay', () => {
  let s = newGame(ctx());
  s.sem.earned = 0;
  const act: GameAction = { t: 'log', species: 'x' };
  for (let i = 0; i < 400; i++) s = reduce(s, { ...act, species: `sp${i}` }, ctx(), world).state;
  assert.ok(s.today.earned <= 400, `earned ${s.today.earned} in a day`);
});

test('every mission, daily, shop item, plant and card reference something real', () => {
  for (const chain of Object.values(CHAINS)) {
    for (const m of chain.missions) {
      if (m.reward.card) assert.ok(CARD_BY_ID.has(m.reward.card), `${m.id} card ${m.reward.card}`);
      for (const k of Object.keys(m.reward.inv ?? {})) assert.ok(SHOP.some((i) => i.slug === k), `${m.id} gives ${k}`);
      for (const k of Object.keys(m.gift?.plantines ?? {})) assert.ok(PLANTS[k], `${m.id} gifts ${k}`);
      assert.ok(m.ask.length > 8 && m.done.length > 8, `${m.id} has copy`);
    }
  }
  assert.ok(DAILIES.length >= 25, `${DAILIES.length} dailies`);
  for (const t of Object.values(PARCEL_TYPES)) {
    for (const pl of t.plants) assert.ok(PLANTS[pl], `${t.id} lists ${pl}`);
    assert.ok(INVASIVES[t.invasive], `${t.id} invasive`);
    for (const h of t.habitats) assert.ok(SHOP.some((i) => i.slug === h && i.kind === 'habitat'), `${t.id} habitat ${h}`);
  }
  for (const i of SHOP) if (i.kind === 'sobre') assert.ok(PLANTS[i.plant!], `${i.slug}`);
});

test('no plant offered for restoration is a known invader', () => {
  for (const id of Object.keys(PLANTS)) assert.ok(!(id in INVASIVES), `${id} is both`);
});

/**
 * The one-way valve (`docs/MUNDO_JUEGO.md` §3.11): nothing in the game reaches
 * the app's points, XP or semillas. Greps the whole game directory.
 */
test('the game never writes to the app: no XP, no app semillas, no activity calls', () => {
  const root = join(__dirname, '..', '..', '..', '..', 'lib', 'world', 'game');
  const files: string[] = [];
  const walk = (d: string) => {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (p.endsWith('.ts')) files.push(p);
    }
  };
  walk(root);
  assert.ok(files.length > 10);
  for (const f of files) {
    const src = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    for (const bad of ['brote_grant_semillas', 'complete_activity', 'total_xp', 'grant_xp', 'profiles.semillas', 'supabase']) {
      assert.ok(!src.includes(bad), `${f} mentions ${bad}`);
    }
  }
});

/** `world_items` (0115) is what the server checks a save's inventory against. */
test('the SQL shop catalogue is exactly the TS one', () => {
  const sql = readFileSync(join(__dirname, '..', '..', '..', '..', 'supabase', 'migrations', '0115_mundo_juego.sql'), 'utf8');
  const rows = [...sql.matchAll(/\('([a-z_]+)', '(decor|habitat|sobre)', (\d+), (\d+), (\d+)\)/g)]
    .map((m) => `${m[1]}|${m[2]}|${m[3]}|${m[4]}|${m[5]}`)
    .sort();
  const ts = SHOP.map((i) => `${i.slug}|${i.kind}|${i.price}|${i.tier}|${i.div ?? 1}`).sort();
  assert.deepEqual(rows, ts);
});

test('El Ceibo grows only with real impact: a pure function of the totals, out of the game\'s reach', () => {
  const zero = ceiboShape({ water_l: 0, co2_kg: 0, waste_kg: 0, energy_kwh: 0, actions: 0 });
  assert.equal(zero.flowers, 0);
  assert.equal(zero.springM, 0);
  assert.equal(zero.bedFlowers, 0);
  assert.equal(zero.lanterns, 0);
  let prev = zero;
  for (const n of [1, 3, 10, 40, 86, 300, 4120]) {
    const s = ceiboShape({ water_l: n * 15, co2_kg: n / 10, waste_kg: n / 20, energy_kwh: n / 5, actions: n });
    assert.ok(s.scale >= prev.scale && s.flowers >= prev.flowers && s.springM >= prev.springM, `shrank at ${n}`);
    assert.ok(s.bedFlowers >= prev.bedFlowers && s.lanterns >= prev.lanterns, `shrank at ${n}`);
    prev = s;
  }
  assert.equal(ceiboShape({ water_l: 0, co2_kg: 0, waste_kg: 0, energy_kwh: 0, actions: 12 }).flowers, 12, 'one flower per action');
  // Nothing in the game's rules can reach it: the reducer and the state never import it.
  for (const f of ['reduce', 'state', 'missions', 'production', 'parcel-actions']) {
    const src = readFileSync(join(__dirname, '..', 'game', `${f}.js`), 'utf8');
    assert.ok(!/ceibo'|ceibo"|\/ceibo/.test(src), `${f} imports the ceibo`);
  }
});

test('every chapter can be finished at the rank that opens it', () => {
  const verbsAt = (t: number) => new Set(Array.from({ length: t }, (_, i) => unlocksFor(i + 1).verbs).flat());
  const problems: string[] = [];
  for (const id of CHAIN_ORDER) {
    const chain = CHAINS[id]!;
    const verbs = verbsAt(chain.tier);
    for (const m of chain.missions) {
      const g = m.goal;
      if (g.k === 'event' && g.match.type === 'logged') {
        if (!verbs.has('log')) problems.push(`${m.id}: registrar se abre después`);
        const sp = SPECIES_BY_SLUG.get(String(g.match.species));
        if (!sp || sp.min_tier > chain.tier) problems.push(`${m.id}: ${String(g.match.species)} no está a este nivel`);
      }
      if (g.k === 'event' && g.match.type === 'fished' && !verbs.has('fish')) problems.push(`${m.id}: pescar se abre después`);
      if (g.k === 'event' && g.match.type === 'planted' && g.match.plant) {
        for (const pl of ([] as string[]).concat(g.match.plant as string | string[])) {
          if (!PLANTS[pl] || PLANTS[pl]!.tier > chain.tier) problems.push(`${m.id}: ${pl} no está a este nivel`);
        }
      }
      if (g.k === 'event' && g.match.type === 'bought' && g.match.item) {
        const item = SHOP.find((x) => x.slug === g.match.item);
        if (!item || item.tier > chain.tier) problems.push(`${m.id}: ${String(g.match.item)} no se vende a este nivel`);
      }
      if (g.k === 'state' && g.test.t === 'station' && STATIONS[g.test.id].tier > chain.tier) problems.push(`${m.id}: ${g.test.id} no existe a este nivel`);
    }
  }
  assert.deepEqual(problems, []);
});

test('the guide pin names what is at every kind of target', () => {
  assert.equal(targetName('game-station-compostera'), 'Compostera');
  assert.equal(targetName('game-invasive-p0_1'), 'Invasora para arrancar');
  assert.equal(targetName('2026-09-27:b:3'), 'Ramas');
  assert.equal(targetName('p0_1:l:2'), 'Basura');
  assert.equal(targetName('region-pradera'), 'La Pradera');
  assert.ok(targetName('game-cast-ines').length > 0);
});

test('a parcel waiting on compost never points at a compostera that cannot make any', () => {
  // The 2026-09-27 run: three organics loaded, four needed, none in the bag —
  // and the beacon sat on the compostera for fifteen minutes.
  const layout = buildLayout(WHO, cumulativeState(1));
  const at = {
    pip: { x: 0, z: 0 }, spots: gameSpots(WHO, layout), cast: new Map(), water: [],
    spawns: [{ id: 'x:h:0', kind: 'hojas', x: 4, z: 4 } as Spawn],
  };
  const s = newGame(ctx());
  s.missions.chain.claro = CHAINS.claro!.missions.findIndex((m) => m.title === 'Suelo vivo');
  const p = parcelsAt(field, 1)[0]!;
  s.parcels[p.id] = { s: 1, lit: 255, inv: true, n: 1, plants: [], wet: [], at: 0 };
  s.stations.compostera = { lvl: 1, paid: {}, queue: 3, since: 0, out: 0 };

  let v = missionView(s, world, ctx(), at);
  assert.equal(v.target?.id, 'x:h:0');
  assert.equal(v.need, 'Te falta 1 orgánico para el próximo compost');

  s.bag.hojas = 1;
  v = missionView(s, world, ctx(), at);
  assert.equal(v.target?.id, 'game-station-compostera');
  assert.equal(v.need, 'Primero, compost de la compostera');

  // Cooking: the card hands itself to something to do meanwhile…
  s.bag.hojas = 0;
  s.stations.compostera.queue = 4;
  v = missionView(s, world, ctx(), at);
  assert.ok(v.eyebrow.startsWith('Mientras el compost trabaja'), v.eyebrow);
  assert.ok(v.target && v.target.id !== 'game-station-compostera', JSON.stringify(v.target));
  // …and takes the story back once there is compost to take out.
  s.stations.compostera = { lvl: 1, paid: {}, queue: 0, since: 0, out: 1 };
  v = missionView(s, world, ctx(), at);
  assert.equal(v.title, 'Suelo vivo');
  assert.equal(v.target?.id, 'game-station-compostera');
});

test('everything to pick up or restore is ashore, where Pip can walk', () => {
  // 2026-09-28: a branch, a bottle and a whole parcel's stake floating in the
  // bay — land by the height function, but past the rim the island is drawn to.
  for (const who of [WHO, 'b7a1c2d3-0000-4000-8000-00000000000b', 'c0ffee00-0000-4000-8000-00000000000c']) {
    const f = buildParcels(hashInt(who));
    for (const tier of [1, 2, 3, 5, 8, 11]) {
      const layout = buildLayout(who, cumulativeState(tier));
      const at = (x: number, z: number, m: number) => insideCoast(x, z, layout.coastline, layout.terrain, m);
      for (const p of parcelsAt(f, tier)) {
        assert.ok(at(p.x, p.z, 1.9), `${who} T${tier}: parcel ${p.id} is in the sea`);
        for (const [x, z] of p.litter) assert.ok(at(x, z, 0.8), `${who} T${tier}: litter of ${p.id} is in the sea`);
        if (p.invasive) assert.ok(at(p.invasive[0], p.invasive[1], 0.8), `${who} T${tier}: invasive of ${p.id} is in the sea`);
      }
      for (const day of ['2026-09-27', '2026-09-28', '2026-10-01', '2026-12-24']) {
        const seed = layout.seed;
        for (const sp of dailySpawns({ seed, day, tier, terrain: layout.terrain, coastline: layout.coastline })) {
          assert.ok(at(sp.x, sp.z, 0.5), `${who} T${tier} ${day}: ${sp.id} is in the sea`);
        }
      }
    }
  }
});

test('a mission to load the compostera goes for organics even while a batch cooks', () => {
  // The 2026-09-28 run: five of six loaded, a batch cooking, an empty bag —
  // and the beacon said "wait here" for six minutes.
  const layout = buildLayout(WHO, cumulativeState(1));
  const at = {
    pip: { x: 0, z: 0 }, spots: gameSpots(WHO, layout), cast: new Map(), water: [],
    spawns: [{ id: 'x:h:0', kind: 'hojas', x: 4, z: 4 } as Spawn],
  };
  const s = newGame(ctx());
  s.missions.chain.claro = CHAINS.claro!.missions.findIndex((m) => m.title === 'Tierra que respira');
  s.stations.compostera = { lvl: 1, paid: {}, queue: 5, since: 1, out: 0 };
  let v = missionView(s, world, ctx(), at);
  assert.equal(v.target?.id, 'x:h:0');
  assert.equal(v.need, 'Juntá más orgánicos');
  // Organic waste in the bag: sort it first.
  s.bag.residuos = ['yerba'];
  v = missionView(s, world, ctx(), at);
  assert.equal(v.target?.id, 'game-station-punto_limpio');
  // Full: nothing fits until the compost is taken out.
  s.bag.residuos = [];
  s.stations.compostera = { lvl: 1, paid: {}, queue: 0, since: 0, out: 5 };
  v = missionView(s, world, ctx(), at);
  assert.equal(v.target?.id, 'game-station-compostera');
});

test('the guide finishes the parcel you started before a nearer, emptier one', () => {
  // 2026-09-28: two of three compost in one parcel, then the third went to a
  // nearer parcel cleaned meanwhile — and Suelo vivo never finished.
  const layout = buildLayout(WHO, cumulativeState(3));
  const s = newGame(ctx({ tier: 3 }));
  s.missions.chain.claro = CHAINS.claro!.missions.findIndex((m) => m.title === 'Suelo vivo');
  const [started, fresh] = parcelsAt(field, 1);
  s.parcels[started!.id] = { s: 1, lit: 255, inv: true, n: 2, plants: [], wet: [], at: 0 };
  s.parcels[fresh!.id] = { s: 1, lit: 255, inv: true, n: 0, plants: [], wet: [], at: 0 };
  s.bag.compost = 1;
  const at = { pip: { x: fresh!.x, z: fresh!.z }, spots: gameSpots(WHO, layout), cast: new Map(), water: [], spawns: [] };
  const v = missionView(s, world, ctx({ tier: 3 }), at);
  assert.equal(v.target?.id, `game-parcel-${started!.id}`);
});

test('a story that can only wait for tomorrow lets the next one play', () => {
  // 2026-09-28: at tier 3 the Claro reached "Mañana, otra vez" eight minutes
  // in, and the card kept pointing at a parcel already watered, with La
  // Pradera open and untouched.
  const layout = buildLayout(WHO, cumulativeState(3));
  const c = ctx({ tier: 3 });
  const s = newGame(c);
  s.missions.chain.claro = CHAINS.claro!.missions.findIndex((m) => m.title === 'Mañana, otra vez');
  const p = parcelsAt(field, 1)[0]!;
  s.parcels[p.id] = { s: 3, lit: 255, inv: true, n: 4, plants: ['flechilla', 'chilca'], wet: [dayOf(c.day)], at: 0, d: dayOf(c.day) };
  const at = { pip: { x: 0, z: 0 }, spots: gameSpots(WHO, layout), cast: new Map([['mila', { x: 3, z: 3 }]]), water: [], spawns: [] };
  const v = missionView(s, world, c, at);
  assert.equal(v.id, 'pradera.1');
  // Tomorrow the Claro's step can move again, and it takes the card back.
  const next = ctx({ tier: 3, day: '2026-10-02', now: Date.UTC(2026, 9, 2, 22) });
  assert.equal(missionView(s, world, next, at).id, 'claro.13');
});

test('every story step at every tier points somewhere', () => {
  // 2026-09-28: "Plantá 3 flores en El Jardín" with no Jardín parcel ready
  // had no target at all, and the card pointed nowhere for four minutes.
  const problems: string[] = [];
  for (const tier of [1, 3, 5, 8, 11]) {
    const layout = buildLayout(WHO, cumulativeState(tier));
    const at = { pip: { x: 0, z: 0 }, spots: gameSpots(WHO, layout), cast: new Map(), water: [], spawns: [] };
    for (const id of CHAIN_ORDER) {
      const chain = CHAINS[id]!;
      if (chain.tier > tier) continue;
      chain.missions.forEach((m, i) => {
        if (m.target.to === 'none' || m.target.to === 'cast' || m.target.to === 'spawn' || m.target.to === 'water') return;
        const s = newGame(ctx({ tier }));
        for (const other of CHAIN_ORDER) s.missions.chain[other] = CHAINS[other]!.missions.length;
        s.missions.chain[id] = i;
        const v = missionView(s, world, ctx({ tier }), at);
        if (v.id === m.id && !v.target) problems.push(`T${tier} ${m.id} (${m.title})`);
      });
    }
  }
  assert.deepEqual(problems, []);
});

test('waiting on compost with an upgrade already paid for suggests the upgrade', () => {
  const layout = buildLayout(WHO, cumulativeState(1));
  const s = newGame(ctx());
  s.missions.chain.claro = CHAINS.claro!.missions.findIndex((m) => m.title === 'Suelo vivo');
  const p = parcelsAt(field, 1)[0]!;
  s.parcels[p.id] = { s: 1, lit: 255, inv: true, n: 2, plants: [], wet: [], at: 0 };
  s.stations.compostera = { lvl: 1, paid: {}, queue: 4, since: 1, out: 0 };
  const at = { pip: { x: 0, z: 0 }, spots: gameSpots(WHO, layout), cast: new Map(), water: [], spawns: [] };
  assert.notEqual(missionView(s, world, ctx(), at).title, 'Mejorá la compostera');
  s.bag.ramas = 10;
  s.bag.reciclado = 6;
  s.sem.earned = s.sem.spent + 200;
  const v = missionView(s, world, ctx(), at);
  assert.equal(v.title, 'Mejorá la compostera');
  assert.equal(v.target?.id, 'game-station-compostera');
});

test('when one story waits for tomorrow and another for compost, the compost names the wait', () => {
  const layout = buildLayout(WHO, cumulativeState(3));
  const c = ctx({ tier: 3 });
  const s = newGame(c);
  for (const id of CHAIN_ORDER) s.missions.chain[id] = CHAINS[id]!.missions.length;
  s.missions.chain.claro = CHAINS.claro!.missions.findIndex((m) => m.title === 'Mañana, otra vez');
  s.missions.chain.pradera = CHAINS.pradera!.missions.findIndex((m) => m.title === 'El pastizal');
  const [claro] = parcelsAt(field, 1);
  s.parcels[claro!.id] = { s: 3, lit: 255, inv: true, n: 4, plants: ['flechilla'], wet: [dayOf(c.day)], at: 0, d: dayOf(c.day) };
  const pradera = parcelsAt(field, 3).find((p) => parcelRegion(p, undefined, 3) === 'pradera')!;
  s.parcels[pradera.id] = { s: 1, lit: 255, inv: true, n: 1, plants: [], wet: [], at: 0 };
  s.stations.compostera = { lvl: 1, paid: {}, queue: 4, since: 1, out: 0 };
  s.bag.ramas = 10;
  s.bag.reciclado = 6;
  s.sem.earned = s.sem.spent + 200;
  const at = { pip: { x: 0, z: 0 }, spots: gameSpots(WHO, layout), cast: new Map(), water: [], spawns: [] };
  const v = missionView(s, world, c, at);
  assert.equal(v.title, 'Mejorá la compostera', JSON.stringify(v));
});

test('soil ready to plant with nothing that grows there says where to get a seedling', () => {
  // 2026-09-28: a Pradera parcel ready for planting, only Jardín seedlings in
  // the bag, no vivero yet — the card pointed at the soil and said nothing.
  const layout = buildLayout(WHO, cumulativeState(3));
  const c = ctx({ tier: 3 });
  const s = newGame(c);
  for (const id of CHAIN_ORDER) s.missions.chain[id] = CHAINS[id]!.missions.length;
  s.missions.chain.pradera = CHAINS.pradera!.missions.findIndex((m) => m.title === 'El pastizal');
  const pradera = parcelsAt(field, 3).find((p) => parcelRegion(p, undefined, 3) === 'pradera')!;
  s.parcels[pradera.id] = { s: 2, lit: 255, inv: true, n: 0, plants: [], wet: [], at: 0 };
  s.bag.plantines = { verbena: 1 };
  const at = { pip: { x: 0, z: 0 }, spots: gameSpots(WHO, layout), cast: new Map(), water: [], spawns: [] };
  const v = missionView(s, world, c, at);
  assert.equal(v.target?.id, `game-parcel-${pradera.id}`);
  assert.match(v.need ?? '', /comprá un plantín de .+ en la Tienda/);
});

test('a full bag never sends the player to pick something up', () => {
  // A full bag refuses every pickup; the card says where to empty it instead.
  const layout = buildLayout(WHO, cumulativeState(1));
  const at = {
    pip: { x: 0, z: 0 }, spots: gameSpots(WHO, layout), cast: new Map(), water: [],
    spawns: [{ id: 'x:r:0', kind: 'residuos', waste: 'botella', x: 4, z: 4 } as Spawn],
  };
  const s = newGame(ctx());
  s.missions.chain.claro = CHAINS.claro!.missions.findIndex((m) => m.title === 'Lo que trae el mar');
  assert.equal(missionView(s, world, ctx(), at).target?.id, 'x:r:0');
  s.bag.residuos = Array.from({ length: bagCap(s) }, () => 'lata' as const);
  let v = missionView(s, world, ctx(), at);
  assert.equal(v.target?.id, 'game-station-punto_limpio');
  assert.match(v.need ?? '', /^Mochila llena/);
  // Full of branches: into a build the story has opened, before any upgrade.
  s.bag.residuos = [];
  s.bag.ramas = bagCap(s);
  s.missions.chain.claro = CHAINS.claro!.missions.findIndex((m) => m.title === 'La compostera');
  s.missions.met.push('claro.5');
  at.spawns = [{ id: 'x:b:0', kind: 'ramas', x: 4, z: 4 } as Spawn];
  v = missionView(s, world, ctx(), at);
  assert.equal(v.target?.id, 'game-station-compostera');
  // Asked to pick up branches with a bag full of them: into a site that takes them.
  s.missions.chain.claro = CHAINS.claro!.missions.findIndex((m) => m.title === 'Lo que se hace, se guarda');
  v = missionView(s, world, ctx(), at);
  assert.notEqual(v.target?.id, 'x:b:0');
  assert.match(v.need ?? '', /^Mochila llena: (entregá ramas en|una mochila más grande)/);
});

test('waiting with a bag heavy with rubbish suggests sorting it', () => {
  const layout = buildLayout(WHO, cumulativeState(1));
  const s = newGame(ctx());
  s.missions.chain.claro = CHAINS.claro!.missions.findIndex((m) => m.title === 'Suelo vivo');
  s.parcels[parcelsAt(field, 1)[0]!.id] = { s: 1, lit: 255, inv: true, n: 2, plants: [], wet: [], at: 0 };
  s.stations.compostera = { lvl: 1, paid: {}, queue: 4, since: 1, out: 0 };
  s.bag.residuos = Array.from({ length: 12 }, () => 'lata' as const);
  const at = { pip: { x: 0, z: 0 }, spots: gameSpots(WHO, layout), cast: new Map(), water: [], spawns: [] };
  const v = missionView(s, world, ctx(), at);
  assert.equal(v.title, 'Separá lo que juntaste');
  assert.equal(v.target?.id, 'game-station-punto_limpio');
});

test('every daily at every tier points somewhere', () => {
  const problems: string[] = [];
  const kinds = ['residuos', 'hojas', 'ramas', 'piedras'] as const;
  for (const tier of [1, 3, 5, 8, 11]) {
    const layout = buildLayout(WHO, cumulativeState(tier));
    const c = ctx({ tier });
    const at = {
      pip: { x: 0, z: 0 }, spots: gameSpots(WHO, layout), cast: new Map([['ines', { x: 6, z: 6 }]]), water: [{ x: 2, z: 2, id: 'game-water-tanque' }],
      spawns: kinds.map((kind, i) => ({ id: `x:${kind[0]}:${i}`, kind, waste: 'botella', x: 3 + i, z: 3 } as Spawn)),
      find: () => [{ x: 5, z: 5, id: 'fish-0' }],
    };
    for (const def of DAILIES) {
      if (def.minTier > tier) continue;
      const s = newGame(c);
      for (const id of CHAIN_ORDER) s.missions.chain[id] = CHAINS[id]!.missions.length;
      for (const id of Object.keys(STATIONS) as (keyof typeof STATIONS)[]) s.stations[id] = { lvl: 1, paid: {}, queue: 0, since: 0, out: 0 };
      s.missions.daily = { day: c.day, ids: [def.id], prog: [0], claimed: [false], bonus: false };
      const v = missionView(s, world, c, at);
      // A daily with nowhere to go (the Tienda) says on the card how to do it.
      if (v.id !== `daily:${def.id}` || (!v.target && !v.ask)) problems.push(`T${tier} ${def.id} → ${v.id} ${JSON.stringify(v.target)}`);
    }
  }
  assert.deepEqual(problems, []);
});

test('sorting with nothing of that kind in the bag goes for the rubbish first', () => {
  // 2026-09-28, touch run: "Separá 3 orgánicos" with an empty bag opened an
  // empty sort game a hundred and fifty times.
  const layout = buildLayout(WHO, cumulativeState(1));
  const c = ctx();
  const at = {
    pip: { x: 0, z: 0 }, spots: gameSpots(WHO, layout), cast: new Map(), water: [],
    spawns: [
      { id: 'x:r:0', kind: 'residuos', waste: 'lata', x: 2, z: 2 } as Spawn,
      { id: 'x:r:1', kind: 'residuos', waste: 'yerba', x: 9, z: 9 } as Spawn,
    ],
  };
  const s = newGame(c);
  for (const id of CHAIN_ORDER) s.missions.chain[id] = CHAINS[id]!.missions.length;
  s.missions.daily = { day: c.day, ids: ['d.organicos'], prog: [0], claimed: [false], bonus: false };
  let v = missionView(s, world, c, at);
  assert.equal(v.target?.id, 'x:r:1', 'the organic piece, not the nearer can');
  s.bag.residuos = ['lata'];
  assert.equal(missionView(s, world, c, at).target?.id, 'x:r:1');
  s.bag.residuos = ['lata', 'cascara'];
  v = missionView(s, world, c, at);
  assert.equal(v.target?.id, 'game-station-punto_limpio');
});

test('the vivero with no fruit sends the player to harvest, or waits for tomorrow', () => {
  const layout = buildLayout(WHO, cumulativeState(1));
  const at = { pip: { x: 0, z: 0 }, spots: gameSpots(WHO, layout), cast: new Map(), water: [], spawns: [] };
  const p = parcelsAt(field, 1)[0]!;
  // A day this parcel's fruit is ripe, and one it is not.
  const days = ['2026-10-01', '2026-10-02'].map((day, i) => ctx({ day, now: Date.UTC(2026, 9, 1 + i, 22) }));
  const ripeDay = days.find((c) => ripe(p.id, c))!;
  const bareDay = days.find((c) => !ripe(p.id, c))!;
  const step = CHAINS.claro!.missions.findIndex((m) => m.target.to === 'station' && m.target.id === 'vivero' && m.goal.k === 'event');
  const make = (c: typeof ripeDay) => {
    const s = newGame(c);
    for (const id of CHAIN_ORDER) s.missions.chain[id] = CHAINS[id]!.missions.length;
    s.missions.chain.claro = step;
    s.stations.vivero = { lvl: 1, paid: {}, queue: 0, since: 0, out: 0 };
    s.parcels[p.id] = { s: 4, lit: 255, inv: true, n: 0, plants: ['flechilla', 'chilca'], wet: [], at: 0 };
    return s;
  };
  assert.equal(missionView(make(ripeDay), world, ripeDay, at).target?.id, `game-parcel-${p.id}`);
  assert.notEqual(missionView(make(bareDay), world, bareDay, at).target?.id, 'game-station-vivero');
});

test('a daily that cannot be done today lets the next one go first', () => {
  const layout = buildLayout(WHO, cumulativeState(1));
  const c = ctx();
  const at = {
    pip: { x: 0, z: 0 }, spots: gameSpots(WHO, layout), cast: new Map(), water: [],
    spawns: [{ id: 'x:r:0', kind: 'residuos', waste: 'lata', x: 2, z: 2 } as Spawn],
  };
  const s = newGame(c);
  for (const id of CHAIN_ORDER) s.missions.chain[id] = CHAINS[id]!.missions.length;
  // No branch left on the ground today.
  s.missions.daily = { day: c.day, ids: ['d.ramas', 'd.residuos'], prog: [0, 0], claimed: [false, false], bonus: false };
  assert.equal(missionView(s, world, c, at).id, 'daily:d.residuos');
  at.spawns.push({ id: 'x:b:0', kind: 'ramas', x: 5, z: 5 } as Spawn);
  assert.equal(missionView(s, world, c, at).id, 'daily:d.ramas');
});
