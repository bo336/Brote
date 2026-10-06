import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import {
  apta,
  CONTEXTO_CLAVES,
  contextoEfectivo,
  ESTACIONES,
  LUGARES,
  FORMATOS,
  PUNTOS,
  REGIONES,
  type AccionReglas,
  type Estacion,
  type TipoCuenta,
} from '../reglas';

/**
 * El catálogo generado (scripts/acciones/catalogo.json, que sale de
 * scripts/acciones/generar.mjs) cumple las reglas del documento: descripción y
 * pasos en todas, puntos por tabla, vocabulario cerrado, nada de adultos para
 * chicos, caminos coherentes, y variedad suficiente para cualquier persona en
 * cualquier estación.
 */

function raiz(): string {
  let dir = __dirname;
  while (!fs.existsSync(path.join(dir, 'package.json'))) dir = path.dirname(dir);
  return dir;
}

interface Fila {
  slug: string;
  type: 'daily' | 'catalog';
  domain_slug: string;
  title_es: string;
  short_es: string;
  description_es: string;
  instructions_es: string;
  effort: 'easy' | 'medium' | 'hard';
  impact: 'low' | 'medium' | 'high';
  base_points: number;
  frequency: string;
  repeat_cooldown_hours: number;
  min_rank_slug: string;
  age_groups: string[];
  impact_water_l: number;
  impact_co2_kg: number;
  impact_waste_kg: number;
  impact_energy_kwh: number;
  routine_eligible: boolean;
  formato: string;
  minutos: number;
  requiere: string[];
  lugar: string;
  estaciones: string[];
  dias: 'habil' | 'finde' | null;
  regiones: string[];
  medida: { max: number; def: number; min: number; por: Record<string, number> } | null;
  fuente_url: string | null;
  camino_slug: string | null;
  camino_paso: number | null;
  tags: string[];
  otorga: string | null;
}

const { acciones, caminos } = JSON.parse(fs.readFileSync(path.join(raiz(), 'scripts/acciones/catalogo.json'), 'utf8')) as {
  acciones: Fila[];
  caminos: { slug: string; pasos: string[] }[];
};

test('the catalogue is big and every action explains itself', () => {
  assert.ok(acciones.length >= 400, `only ${acciones.length} actions`);
  for (const a of acciones) {
    assert.ok(a.description_es.length >= 60, `${a.slug}: description`);
    assert.ok(a.instructions_es.split('\n').length >= 1, `${a.slug}: steps`);
    assert.ok(a.short_es.length > 10, `${a.slug}: short`);
  }
});

test('slugs and titles are unique', () => {
  const s = new Set(acciones.map((a) => a.slug));
  assert.equal(s.size, acciones.length);
  const t = new Set(acciones.map((a) => a.title_es.toLowerCase()));
  assert.equal(t.size, acciones.length);
});

test('points come from the table, never by hand', () => {
  for (const a of acciones) assert.equal(a.base_points, PUNTOS[a.type][a.effort][a.impact], a.slug);
});

test('vocabulary is closed', () => {
  for (const a of acciones) {
    assert.ok((FORMATOS as readonly string[]).includes(a.formato), `${a.slug}: formato`);
    assert.ok((LUGARES as readonly string[]).includes(a.lugar), `${a.slug}: lugar`);
    for (const k of a.requiere) assert.ok((CONTEXTO_CLAVES as readonly string[]).includes(k), `${a.slug}: requiere ${k}`);
    for (const e of a.estaciones) assert.ok((ESTACIONES as readonly string[]).includes(e), `${a.slug}: estación ${e}`);
    for (const r of a.regiones) assert.ok((REGIONES as readonly string[]).includes(r), `${a.slug}: región ${r}`);
    if (a.otorga) assert.ok(['compost', 'huerta'].includes(a.otorga), a.slug);
  }
});

test('a kid never gets an action that needs a car, a job or children', () => {
  for (const a of acciones.filter((x) => x.age_groups.includes('kid'))) {
    for (const k of ['auto', 'trabajo', 'chicos']) assert.ok(!a.requiere.includes(k), `${a.slug} needs ${k}`);
  }
});

test('nothing in the catalogue is an investment or out of reach in a normal day', () => {
  const caras = /panel(es)? solar|bomba de calor|auto el[eé]ctrico|termostato inteligente|tarifa .* renovable|inodoro de doble descarga/i;
  for (const a of acciones) assert.ok(!caras.test(a.title_es), a.slug);
  for (const a of acciones.filter((x) => x.type === 'daily')) assert.ok(a.minutos <= 30, `${a.slug}: ${a.minutos} min`);
});

test('no anti-meat framing (owner decision, F1.2)', () => {
  const carne = /sin carne|a base de plantas|reduc[ií] (los )?l[aá]cteos|vegan/i;
  for (const a of acciones) assert.ok(!carne.test(`${a.title_es} ${a.short_es} ${a.description_es}`), a.slug);
});

test('impact is prudent: no single completion claims a fortune', () => {
  for (const a of acciones) {
    assert.ok(a.impact_water_l <= 3000 && a.impact_co2_kg <= 30 && a.impact_waste_kg <= 15 && a.impact_energy_kwh <= 60, a.slug);
    if (a.medida) {
      for (const [k, v] of Object.entries(a.medida.por)) {
        const tope = { water_l: 3000, co2_kg: 30, waste_kg: 15, energy_kwh: 60 }[k]!;
        assert.ok(v * a.medida.max <= tope, `${a.slug}: medida ${k}`);
      }
    }
  }
});

test('sources are links', () => {
  const con = acciones.filter((a) => a.fuente_url);
  assert.ok(con.length >= 120, `only ${con.length} with a source`);
  for (const a of con) assert.match(a.fuente_url!, /^https:\/\//, a.slug);
});

test('paths: 3 to 6 existing steps, in order, all year, one path per action', () => {
  const porSlug = new Map(acciones.map((a) => [a.slug, a]));
  const vistos = new Set<string>();
  assert.ok(caminos.length >= 15);
  for (const c of caminos) {
    assert.ok(c.pasos.length >= 3 && c.pasos.length <= 6, c.slug);
    c.pasos.forEach((s, i) => {
      const a = porSlug.get(s);
      assert.ok(a, `${c.slug}: ${s}`);
      assert.equal(a!.camino_slug, c.slug);
      assert.equal(a!.camino_paso, i + 1);
      assert.equal(a!.estaciones.length, 0, `${s} is seasonal`);
      assert.ok(!vistos.has(s), `${s} in two paths`);
      vistos.add(s);
    });
  }
});

test('the routine only takes day actions', () => {
  for (const a of acciones.filter((x) => x.routine_eligible)) assert.equal(a.type, 'daily', a.slug);
  assert.ok(acciones.filter((x) => x.routine_eligible).length >= 60);
});

test('every kind of person has enough to rotate, every season, every day of the week', () => {
  const personas: { nombre: string; cuenta: TipoCuenta; ctx: Record<string, unknown>; minimo: number }[] = [
    { nombre: 'adulto sin datos', cuenta: 'adult', ctx: {}, minimo: 110 },
    { nombre: 'adulto en un depto', cuenta: 'adult', ctx: { edificio: true, gas: true, trabajo: true }, minimo: 110 },
    { nombre: 'adolescente', cuenta: 'teen', ctx: {}, minimo: 110 },
    { nombre: 'chico', cuenta: 'kid', ctx: {}, minimo: 90 },
  ];
  for (const p of personas) {
    for (const estacion of ESTACIONES as readonly Estacion[]) {
      for (const dow of [2, 6]) {
        const perfil = { cuenta: p.cuenta, tier: 1, ctx: contextoEfectivo(p.ctx, p.cuenta), region: null, estacion, dow, intereses: [] };
        const n = acciones.filter(
          (a) => a.type === 'daily' && apta({ ...a, id: a.slug, min_rank_tier: 1 } as unknown as AccionReglas, perfil).ok,
        ).length;
        // 21 días sin repetir × 5 por día = 105: el piso es cerca de eso.
        assert.ok(n >= p.minimo, `${p.nombre} · ${estacion} · ${dow}: ${n}`);
      }
    }
  }
});

test('the generated migration carries every action and deactivates the rest', () => {
  const sql = fs.readFileSync(path.join(raiz(), 'supabase/migrations/0124_acciones_catalogo.sql'), 'utf8');
  for (const a of acciones) assert.ok(sql.includes(`('${a.slug}',`), a.slug);
  assert.match(sql, /update public\.activities set active = false\s+where active and slug not in \(/);
  assert.match(sql, /'accion-grupal-proyecto'\);/);
  assert.ok(!/\bbegin;|\bcommit;/i.test(sql), 'the migration runner already wraps it in a transaction');
});
