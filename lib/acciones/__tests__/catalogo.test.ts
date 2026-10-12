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
import { SUBCATEGORIAS, esCategoria } from '../../mercado/categorias';

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
  hereda: string[];
  mercado: { categoria: string; subcategoria: string | null; texto: string } | null;
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

test('impact counts only what one completion really saves (§6)', () => {
  const total = (a: Fila) => a.impact_water_l + a.impact_co2_kg + a.impact_waste_kg + a.impact_energy_kwh;
  // Aprender u observar no mueve un recurso medible.
  for (const a of acciones.filter((x) => x.formato === 'aprender' || x.formato === 'observar')) assert.equal(total(a), 0, a.slug);
  // "Agua" es la de tu canilla: la huella hídrica de la comida o la ropa no se ahorra en tu casa.
  for (const a of acciones.filter((x) => x.domain_slug === 'alimentacion' || x.domain_slug === 'consumo')) {
    assert.equal(a.impact_water_l, 0, `${a.slug}: agua virtual`);
  }
  // Lo que se hace una vez cuenta 30 días de ahorro, no la vida útil del arreglo.
  for (const a of acciones.filter((x) => x.frequency === 'one_time')) {
    assert.ok(a.impact_water_l <= 750 && a.impact_co2_kg <= 5 && a.impact_waste_kg <= 2 && a.impact_energy_kwh <= 30, a.slug);
  }
  // Juntar basura es muy bueno, pero lo juntado va a la basura: no suma "residuos que no fueron a la basura".
  for (const s of [
    'recoge-un-poco-de-basura-que-viste-en-la-calle', 'participa-de-una-limpieza-de-costa-o-rio',
    'organiza-o-sumate-a-una-limpieza-del-barrio', 'disfruta-afuera-sin-generar-residuos', 'club-limpieza-cancha',
    'vac-cerro-basura', 'vac-camping-sin-rastro', 'agua-azul-juntar-tanza-y-anzuelos', 'azul-playa-sin-huella',
  ]) {
    const a = acciones.find((x) => x.slug === s);
    assert.ok(a, s);
    assert.equal(a.impact_waste_kg, 0, s);
    assert.equal(a.medida, null, `${s}: no se mide lo que no suma`);
  }
  // Empezar o cosechar el compost no se suma encima de lo que se compostó cada día.
  for (const s of ['empeza-a-compostar-en-casa', 'arma-una-compostera-con-lombrices-vermicompost', 'res-compost-cosecha', 'arma-un-cantero-alimentado-con-compost', 'res-recuperador-urbano']) {
    assert.equal(total(acciones.find((x) => x.slug === s)!), 0, s);
  }
  // Sin el aparato no hay ahorro.
  const pide = (s: string, k: string) => assert.ok(acciones.find((x) => x.slug === s)!.requiere.includes(k), `${s} pide ${k}`);
  pide('energia-ventilador-antes-aire', 'aire');
  pide('ene-aire-24', 'aire');
  pide('colga-la-ropa-al-aire-en-vez-de-usar-secadora', 'secarropas');
});

test('only actions that care for something real: no app growth, no digital myths', () => {
  const fuera = [
    'cuida-tu-mundo', 'com-sumar-a-alguien', 'com-contale-a-alguien', 'teen-dato-verificado', 'borra-mails-y-archivos-viejos-que-no-usas',
    'limpia-tu-nube-y-borra-archivos-viejos', 'desuscribite-de-newsletters-que-no-lees', 'dig-modo-oscuro', 'dig-tarde-sin-pantallas',
    'ene-cargar-celu-de-dia', 'agua-hielo-a-la-planta', 'ali-menos-ultraprocesados',
  ];
  const slugs = new Set(acciones.map((a) => a.slug));
  for (const s of fuera) assert.ok(!slugs.has(s), s);
  const mito = /sumarse a brote|tus redes|modo oscuro|borr[aá] (fotos|mails|archivos)|limpi[aá] tu nube|tu mundo|tu isla/i;
  for (const a of acciones) assert.ok(!mito.test(a.title_es), a.slug);
});

test('the Market button: only where a product is needed, never for kids only', () => {
  const con = acciones.filter((a) => a.mercado);
  assert.ok(con.length >= 30 && con.length <= 60, `${con.length} con Mercado: un botón en todas se lee como publicidad`);
  for (const a of con) {
    const m = a.mercado!;
    assert.ok(esCategoria(m.categoria), `${a.slug}: ${m.categoria}`);
    if (m.subcategoria) assert.ok(SUBCATEGORIAS[m.categoria as keyof typeof SUBCATEGORIAS].includes(m.subcategoria), `${a.slug}: ${m.subcategoria}`);
    assert.ok(m.texto.length >= 30 && m.texto.length <= 140, a.slug);
    assert.ok(a.age_groups.includes('adult'), `${a.slug}: sólo un adulto ve el Mercado`);
  }
  const sql = fs.readFileSync(path.join(raiz(), 'supabase/migrations/0124_acciones_catalogo.sql'), 'utf8');
  for (const a of con) assert.ok(sql.includes(`('${a.slug}','${a.mercado!.categoria}',`), a.slug);
  assert.match(sql, /update public\.activity_market_hints h set activo = false/);
  // En la base: sólo adultos, y nunca desde completar.
  const v2 = fs.readFileSync(path.join(raiz(), 'supabase/migrations/0123_acciones_v2.sql'), 'utf8');
  const fn = v2.slice(v2.indexOf('create or replace function public.mercado_para_accion'));
  assert.match(fn.slice(0, fn.indexOf('end $fn$')), /brote_mercado_cuenta\(\), 'adult'\) <> 'adult' then return null/);
  assert.ok(!/complete_activity/.test(fn.slice(0, fn.indexOf('end $fn$'))));
});

test('history is recalculated with the corrected numbers, and the game never counts', () => {
  const sql = fs.readFileSync(path.join(raiz(), 'supabase/migrations/0124_acciones_catalogo.sql'), 'utf8');
  assert.match(sql, /with herencia \(viejo, nuevo\) as \(values/);
  assert.match(sql, /update public\.activity_completions ac\s+set impact_water_l/);
  assert.match(sql, /update public\.world_collective set refreshed_at/);
  // Cada slug viejo va a una sola acción, que existe.
  const vistos = new Map<string, string>();
  const slugs = new Set(acciones.map((a) => a.slug));
  for (const a of acciones) for (const h of a.hereda) {
    assert.ok(!slugs.has(h), `${h} sigue siendo una acción`);
    assert.ok(!vistos.has(h), `${h} lo heredan ${vistos.get(h)} y ${a.slug}`);
    vistos.set(h, a.slug);
  }
  const v2 = fs.readFileSync(path.join(raiz(), 'supabase/migrations/0123_acciones_v2.sql'), 'utf8');
  assert.match(v2, /update public\.activities set active = false, tags = array\['interno','juego'\] where slug = 'cuida-tu-mundo'/);
  for (const f of ['brote_user_impact(p_uid uuid)', 'brote_user_impact_since(p_uid uuid', 'world_collective_impact()']) {
    const desde = v2.indexOf(`create or replace function public.${f}`);
    const cuerpo = v2.slice(desde, v2.indexOf('create or replace function', desde + 10));
    assert.match(cuerpo, /not \('juego' = any\(a\.tags\)\)/, f);
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
