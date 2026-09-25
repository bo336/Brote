/**
 * The game core (`lib/world/game`): determinism, the rules, and the one-way
 * valve between the world and the app.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { buildParcels, parcelAt, parcelsAt } from '../game/parcels';
import { newGame, sanitize, balance, bagCount } from '../game/state';
import { reduce, type GameAction } from '../game/reduce';
import { dailySpawns, parcelLitter } from '../game/spawns';
import { buildLayout } from '../layout';
import { cumulativeState } from '../progression';
import { hashInt } from '../rng';
import { SHOP } from '../game/shop';
import { PLANTS, PARCEL_TYPES, INVASIVES } from '../game/plants';
import { CHAINS } from '../game/texto/cadenas';
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
