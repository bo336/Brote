// ─────────────────────────────────────────────────────────────────────────────
// Aplica el seed de la Academia sobre la base VIVA.
//
//   node scripts/apply-academia-seed.mjs
//
// Lee exactamente el mismo `academia/construir.mjs` que usa el emisor de SQL, y
// escribe con la clave `service_role` a través de PostgREST. No hay una segunda
// copia de la lógica de contenido: si la hubiera, el archivo commiteado y la
// base viva podrían decir cosas distintas y nadie se enteraría.
//
// POR QUÉ NO SE APLICA EL .sql DIRECTAMENTE. `supabase/seed-academia.sql` son
// ~800 KB, y crece a varios MB cuando el árbol está completo. Es el artefacto
// para levantar una base desde cero (`supabase db reset`), y para eso está
// commiteado. Para la base viva conviene esto: mismos datos, misma fuente,
// idempotente, y con el mismo `on conflict` que el SQL.
//
// La clave `service_role` saltea RLS por diseño. Este script es la única cosa
// del repo que la usa, corre a mano, y nunca se ejecuta desde el navegador ni
// desde una función servida. No la imprime ni la loguea.
//
// Al final llama a `ac_sembrar_derivados()`, definida en la migración 0079, que
// es la que arma los ítems derivados de cada concepto dentro de Postgres.
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

import {
  FUENTES, ANILLOS, RAMAS,
  gajos, hojas, conceptos, hojaConceptos, prereqs, misconceptions,
  plantillas, items,
} from './academia/construir.mjs';

// ── credenciales ─────────────────────────────────────────────────────────────

function env() {
  const out = {};
  try {
    for (const linea of readFileSync('.env.local', 'utf8').split('\n')) {
      const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    /* sin .env.local: se usa el entorno del proceso */
  }
  return { ...out, ...process.env };
}

const E = env();
const URL = E.NEXT_PUBLIC_SUPABASE_URL;
const KEY = E.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY (.env.local o entorno).');
  process.exit(1);
}

const db = createClient(URL, KEY, { auth: { persistSession: false } });

// ── helpers ──────────────────────────────────────────────────────────────────

const LOTE = 400;

async function upsert(tabla, filas, onConflict) {
  if (!filas.length) return 0;
  for (let i = 0; i < filas.length; i += LOTE) {
    const trozo = filas.slice(i, i + LOTE);
    const { error } = await db.from(tabla).upsert(trozo, { onConflict, defaultToNull: false });
    if (error) {
      console.error(`\n✗ ${tabla} [${i}..${i + trozo.length}]: ${error.message}`);
      if (error.details) console.error('  ' + error.details);
      process.exit(1);
    }
  }
  process.stdout.write(`  ${tabla.padEnd(24)} ${String(filas.length).padStart(5)}\n`);
  return filas.length;
}

/** slug → id, para resolver las claves foráneas sin un solo uuid hardcodeado. */
async function mapa(tabla, columna = 'slug', valor = 'id') {
  const out = new Map();
  let desde = 0;
  for (;;) {
    const { data, error } = await db.from(tabla).select(`${columna},${valor}`).range(desde, desde + 999);
    if (error) { console.error(`✗ leyendo ${tabla}: ${error.message}`); process.exit(1); }
    for (const r of data) out.set(r[columna], r[valor]);
    if (data.length < 1000) break;
    desde += 1000;
  }
  return out;
}

// ── aplicación, en orden de dependencias ─────────────────────────────────────

console.log(`\nAplicando el seed de la Academia sobre ${URL}\n`);

await upsert('ac_fuentes', FUENTES.map((f) => ({
  slug: f.slug, titulo: f.titulo, organizacion: f.organizacion, url: f.url,
  publicado: f.publicado ?? null, licencia: f.licencia ?? null, contenido: f.contenido ?? null,
})), 'slug');

await upsert('ac_anillos', ANILLOS.map((a) => ({
  n: a.n, nombre_es: a.nombre_es, descripcion_es: a.descripcion_es, rubrica: a.rubrica, activo: true,
})), 'n');

await upsert('ac_ramas', RAMAS.map((r) => ({
  slug: r.slug, es_tronco: r.es_tronco, nombre_es: r.nombre_es,
  bajada_es: r.bajada_es, sort_order: r.sort_order,
})), 'slug');

const F = await mapa('ac_fuentes');

await upsert('ac_gajos', gajos.map((g) => ({
  slug: g.slug, rama_slug: g.rama_slug, anillo: g.anillo, titulo_es: g.titulo_es,
  bajada_es: g.bajada_es, icono: g.icono ?? null, age_groups: g.age_groups,
  sort_order: g.sort_order ?? 0, status: 'aprobado', origen: 'semilla',
})), 'slug');

await upsert('ac_conceptos', conceptos.map((c) => ({
  slug: c.slug, rama_slug: c.rama_slug, titulo_es: c.titulo_es, enunciado_es: c.enunciado_es,
  detalle_es: c.detalle_es ?? null, fuente_id: F.get(c.fuente) ?? null, anillo: c.anillo,
  dificultad_base: c.dificultad_base ?? 0, age_groups: c.age_groups,
  sensible: !!c.sensible, status: 'aprobado',
})), 'slug');

const G = await mapa('ac_gajos');

await upsert('ac_hojas', hojas.map((h) => ({
  slug: h.slug, gajo_id: G.get(h.gajo_slug), titulo_es: h.titulo_es, bajada_es: h.bajada_es,
  minutos: h.minutos ?? 4, sort_order: h.sort_order ?? 0, age_groups: h.age_groups, status: 'aprobado',
})), 'slug');

const H = await mapa('ac_hojas');
const C = await mapa('ac_conceptos');

await upsert('ac_hoja_conceptos', hojaConceptos.map((x) => ({
  hoja_id: H.get(x.hoja), concepto_id: C.get(x.concepto),
})), 'hoja_id,concepto_id');

await upsert('ac_concepto_prereq', prereqs.map((p) => ({
  concepto_id: C.get(p.concepto), requiere_id: C.get(p.requiere), fuerza: p.fuerza,
})), 'concepto_id,requiere_id');

await upsert('ac_misconceptions', misconceptions.map((m) => ({
  slug: m.slug, concepto_id: C.get(m.concepto), creencia_es: m.creencia_es,
  correccion_es: m.correccion_es, fuente_id: m.fuente ? (F.get(m.fuente) ?? null) : null,
})), 'slug');

await upsert('ac_plantillas', plantillas.map((p) => ({
  tipo: p.tipo,
  titulo_interno: p.titulo_interno,
  enunciado_tpl: p.enunciado_tpl,
  slots: {
    radicales: p.variantes.length,
    incidentales: Object.fromEntries(
      Object.entries(p.incidentales || {}).map(([k, vs]) => [k, vs.map((v) => v.k ?? v)]),
    ),
  },
  restricciones: p.restricciones || [],
  solucion_tpl: { estrategia: 'autorada', slug: p.slug },
  distractores: p.distractores || {},
  age_groups: p.age_groups,
  anillo_min: p.anillo_min ?? 1,
  dificultad_base: p.dificultad_base ?? 0,
  fuente_id: F.get(p.fuente) ?? null,
  generator_hash: p.slug,
  status: 'aprobado',
})), 'tipo,generator_hash');

const P = await mapa('ac_plantillas', 'generator_hash');

await upsert('ac_plantilla_conceptos', plantillas.flatMap((p) =>
  (p.conceptos || []).map(([cs, peso]) => ({
    plantilla_id: P.get(p.slug), concepto_id: C.get(cs), peso,
  })),
), 'plantilla_id,concepto_id');

await upsert('ac_items', items.map((it) => {
  const sol = { ...it.solucion };
  const fuenteSlug = sol.fuente; delete sol.fuente;
  return {
    plantilla_id: P.get(it.plantilla),
    seed: it.seed,
    payload_publico: it.payload_publico,
    solucion: { ...sol, fuente_id: F.get(fuenteSlug) ?? null },
    slot_valores: it.slot_valores,
    age_groups: it.age_groups,
    anillo_min: it.anillo_min,
    dificultad: Number(it.dificultad.toFixed(3)),
    status: 'aprobado',
  };
}), 'plantilla_id,seed');

// ── los ítems derivados los arma Postgres ────────────────────────────────────

process.stdout.write('\n  ac_sembrar_derivados() … ');
const { data: res, error: errSem } = await db.rpc('ac_sembrar_derivados');
if (errSem) { console.error(`\n✗ ${errSem.message}`); process.exit(1); }
console.log('listo');
console.log('   ', JSON.stringify(res));
console.log('\nSeed aplicado.\n');
