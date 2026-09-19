// ─────────────────────────────────────────────────────────────────────────────
// Emisor del seed de la Academia (El Bosque).
//
//   node scripts/gen-academia-seed.mjs   → supabase/seed-academia.sql
//
// Sigue la convención de `scripts/gen-seed.mjs`: un script de Node que emite
// SQL, commiteado junto a su salida. Es el artefacto reproducible con el que se
// levanta una base desde cero.
//
// La carga, la validación y el ensamblado viven en `academia/construir.mjs`,
// compartidos con `apply-academia-seed.mjs`, que es el que aplica sobre la base
// viva. Un solo lugar donde se construye el contenido: si hubiera dos, el
// archivo commiteado y la base viva podrían decir cosas distintas.
//
// LO QUE NO EMITE, A PROPÓSITO. Los ítems derivados de cada concepto (su
// microlectura, las dos de opción múltiple con distractores de conceptos
// hermanos y el mito/dato de sus creencias documentadas) los genera
// `ac_sembrar_derivados()`, en la migración `0079_academia_semilla.sql`. Son
// miles de ítems que serían varios MB de SQL literal y que la base construye
// sola a partir de filas que ya tiene. Esa función es la que garantiza el
// criterio "se puede componer una sesión para cualquier gajo de anillo 1".
// ─────────────────────────────────────────────────────────────────────────────

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  FUENTES, ANILLOS, RAMAS,
  gajos, hojas, conceptos, hojaConceptos, prereqs, misconceptions,
  plantillas, items, porTipo, q, j, arr,
} from './academia/construir.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'supabase', 'seed-academia.sql');

// ── emisión ──────────────────────────────────────────────────────────────────
//
// Todo en INSERT de varias filas con un solo `on conflict` por tabla, y no una
// sentencia por fila. No es cosmético: la versión fila-por-fila pesaba 832 KB
// para 243 conceptos, casi todo repetición de la misma cláusula, y hay que
// poder mandar este archivo a la base por un canal remoto sin partirlo en
// treinta pedazos.
//
// Las claves foráneas se resuelven con subconsultas por slug dentro de cada
// fila: no hay un solo uuid hardcodeado, así que el archivo se puede aplicar
// sobre cualquier base, incluida una recién creada.

const L = [];
const push = (s) => L.push(s);
const LF = String.fromCharCode(10);

/** Emite un INSERT de varias filas, en tandas para no armar una sentencia gigante. */
function bloque(tabla, columnas, filas, conflicto, actualizar, tanda = 100) {
  if (!filas.length) return;
  for (let i = 0; i < filas.length; i += tanda) {
    const trozo = filas.slice(i, i + tanda);
    push(
      `insert into ${tabla} (${columnas.join(', ')}) values\n` +
        trozo.map((f) => '  (' + f.join(', ') + ')').join(',\n') +
        `\non conflict ${conflicto} do ${actualizar};`,
    );
  }
}

const fuenteId = (slug) => `(select id from ac_fuentes where slug = ${q(slug)})`;
const conceptoId = (slug) => `(select id from ac_conceptos where slug = ${q(slug)})`;

push(`-- Brote — seed de la Academia (El Bosque).
-- GENERADO por scripts/gen-academia-seed.mjs. No editar a mano: se regenera.
--
-- Idempotente: todo va con \`on conflict ... do update\` y las claves foráneas se
-- resuelven por slug, así que se puede volver a aplicar sobre una base que ya lo
-- tiene y sobre una base vacía, sin cambiar nada más.
--
-- Contenido: ${FUENTES.length} fuentes · ${ANILLOS.length} anillos · ${RAMAS.length} ramas ·
-- ${gajos.length} gajos · ${hojas.length} hojas · ${conceptos.length} conceptos ·
-- ${prereqs.length} prerrequisitos · ${misconceptions.length} misconceptions ·
-- ${plantillas.length} plantillas autoradas · ${items.length} ítems ensamblados.
--
-- DESPUÉS de aplicar esto hay que correr UNA vez:
--     select ac_sembrar_derivados();
-- Está en supabase/migrations/0079_academia_semilla.sql y es la que construye
-- los ítems derivados de CADA concepto. Sin ella solo tendrían ejercicios los
-- conceptos que toca una plantilla autorada, y la mayor parte del árbol quedaría
-- sin nada que servir.`);

push('\n-- ── Fuentes ────────────────────────────────────────────────────────────');
bloque('ac_fuentes',
  ['slug', 'titulo', 'organizacion', 'url', 'publicado', 'licencia', 'contenido'],
  FUENTES.map((f) => [q(f.slug), q(f.titulo), q(f.organizacion), q(f.url), q(f.publicado), q(f.licencia), q(f.contenido)]),
  '(slug)',
  `update set titulo = excluded.titulo, organizacion = excluded.organizacion, url = excluded.url,
  publicado = excluded.publicado, licencia = excluded.licencia, contenido = excluded.contenido`,
  40);

push('\n-- ── Anillos ────────────────────────────────────────────────────────────');
bloque('ac_anillos', ['n', 'nombre_es', 'descripcion_es', 'rubrica'],
  ANILLOS.map((a) => [a.n, q(a.nombre_es), q(a.descripcion_es), q(a.rubrica)]),
  '(n)',
  'update set nombre_es = excluded.nombre_es, descripcion_es = excluded.descripcion_es, rubrica = excluded.rubrica');

push('\n-- ── Ramas ──────────────────────────────────────────────────────────────');
bloque('ac_ramas', ['slug', 'es_tronco', 'nombre_es', 'bajada_es', 'sort_order'],
  RAMAS.map((r) => [q(r.slug), r.es_tronco, q(r.nombre_es), q(r.bajada_es), r.sort_order]),
  '(slug)',
  `update set es_tronco = excluded.es_tronco, nombre_es = excluded.nombre_es,
  bajada_es = excluded.bajada_es, sort_order = excluded.sort_order`);

push('\n-- ── Gajos ──────────────────────────────────────────────────────────────');
bloque('ac_gajos',
  ['slug', 'rama_slug', 'anillo', 'titulo_es', 'bajada_es', 'icono', 'age_groups', 'sort_order', 'status', 'origen'],
  gajos.map((g) => [q(g.slug), q(g.rama_slug), g.anillo, q(g.titulo_es), q(g.bajada_es), q(g.icono),
    arr(g.age_groups), g.sort_order ?? 0, `'aprobado'`, `'semilla'`]),
  '(slug)',
  `update set rama_slug = excluded.rama_slug, anillo = excluded.anillo, titulo_es = excluded.titulo_es,
  bajada_es = excluded.bajada_es, icono = excluded.icono, age_groups = excluded.age_groups,
  sort_order = excluded.sort_order, status = 'aprobado'`);

push('\n-- ── Conceptos ──────────────────────────────────────────────────────────');
bloque('ac_conceptos',
  ['slug', 'rama_slug', 'titulo_es', 'enunciado_es', 'detalle_es', 'fuente_id', 'anillo',
   'dificultad_base', 'age_groups', 'sensible', 'status'],
  conceptos.map((c) => [q(c.slug), q(c.rama_slug), q(c.titulo_es), q(c.enunciado_es), q(c.detalle_es),
    fuenteId(c.fuente), c.anillo, c.dificultad_base ?? 0, arr(c.age_groups), !!c.sensible, `'aprobado'`]),
  '(slug)',
  `update set rama_slug = excluded.rama_slug, titulo_es = excluded.titulo_es,
  enunciado_es = excluded.enunciado_es, detalle_es = excluded.detalle_es, fuente_id = excluded.fuente_id,
  anillo = excluded.anillo, dificultad_base = excluded.dificultad_base,
  age_groups = excluded.age_groups, sensible = excluded.sensible, status = 'aprobado'`,
  60);

push('\n-- ── Hojas ──────────────────────────────────────────────────────────────');
bloque('ac_hojas',
  ['slug', 'gajo_id', 'titulo_es', 'bajada_es', 'minutos', 'sort_order', 'age_groups', 'status'],
  hojas.map((h) => [q(h.slug), `(select id from ac_gajos where slug = ${q(h.gajo_slug)})`,
    q(h.titulo_es), q(h.bajada_es), h.minutos ?? 4, h.sort_order ?? 0, arr(h.age_groups), `'aprobado'`]),
  '(slug)',
  `update set gajo_id = excluded.gajo_id, titulo_es = excluded.titulo_es, bajada_es = excluded.bajada_es,
  minutos = excluded.minutos, sort_order = excluded.sort_order, age_groups = excluded.age_groups,
  status = 'aprobado'`,
  60);

// Estas dos tablas son pares de slugs y nada mas. Resolverlas con una
// subconsulta por celda costaba 186 KB de repetir la misma clausula; con un
// VALUES y dos JOIN son unos 45 KB y exactamente el mismo resultado.
function pares(tabla, columnas, filas, conflicto, actualizar, joins, tanda = 250) {
  if (!filas.length) return;
  for (let i = 0; i < filas.length; i += tanda) {
    const trozo = filas.slice(i, i + tanda);
    push(
      `insert into ${tabla} (${columnas.join(', ')})` + LF +
        `select ${joins.select}` + LF +
        `from (values` + LF +
        trozo.map((f) => '  (' + f.join(', ') + ')').join(',' + LF) + LF +
        `) as v(${joins.cols})` + LF +
        joins.from + LF +
        `on conflict ${conflicto} do ${actualizar};`,
    );
  }
}

push(LF + '-- Que ensena cada hoja');
pares('ac_hoja_conceptos', ['hoja_id', 'concepto_id'],
  hojaConceptos.map((x) => [q(x.hoja), q(x.concepto)]),
  '(hoja_id, concepto_id)', 'nothing',
  { select: 'h.id, c.id', cols: 'hs, cs',
    from: 'join ac_hojas h on h.slug = v.hs' + LF + 'join ac_conceptos c on c.slug = v.cs' });

push(LF + '-- El DAG de prerrequisitos');
pares('ac_concepto_prereq', ['concepto_id', 'requiere_id', 'fuerza'],
  prereqs.map((p) => [q(p.concepto), q(p.requiere), p.fuerza]),
  '(concepto_id, requiere_id)', 'update set fuerza = excluded.fuerza',
  { select: 'c.id, r.id, v.f', cols: 'cs, rs, f',
    from: 'join ac_conceptos c on c.slug = v.cs' + LF + 'join ac_conceptos r on r.slug = v.rs' });
push('\n-- ── Creencias falsas documentadas ──────────────────────────────────────');
bloque('ac_misconceptions', ['slug', 'concepto_id', 'creencia_es', 'correccion_es', 'fuente_id'],
  misconceptions.map((m) => [q(m.slug), conceptoId(m.concepto), q(m.creencia_es), q(m.correccion_es),
    m.fuente ? fuenteId(m.fuente) : 'null']),
  '(slug)',
  `update set concepto_id = excluded.concepto_id, creencia_es = excluded.creencia_es,
  correccion_es = excluded.correccion_es, fuente_id = excluded.fuente_id`,
  40);

push('\n-- ── Plantillas autoradas ───────────────────────────────────────────────');
bloque('ac_plantillas',
  ['tipo', 'titulo_interno', 'enunciado_tpl', 'slots', 'restricciones', 'solucion_tpl', 'distractores',
   'age_groups', 'anillo_min', 'dificultad_base', 'fuente_id', 'generator_hash', 'status'],
  plantillas.map((p) => [
    `${q(p.tipo)}::ac_tipo_ejercicio`, q(p.titulo_interno), q(p.enunciado_tpl),
    j({
      radicales: p.variantes.length,
      incidentales: Object.fromEntries(
        Object.entries(p.incidentales || {}).map(([k, vs]) => [k, vs.map((v) => v.k ?? v)]),
      ),
    }),
    j(p.restricciones || []), j({ estrategia: 'autorada', slug: p.slug }), j(p.distractores || {}),
    arr(p.age_groups), p.anillo_min ?? 1, p.dificultad_base ?? 0, fuenteId(p.fuente), q(p.slug), `'aprobado'`,
  ]),
  '(tipo, generator_hash)',
  `update set titulo_interno = excluded.titulo_interno, enunciado_tpl = excluded.enunciado_tpl,
  slots = excluded.slots, restricciones = excluded.restricciones, solucion_tpl = excluded.solucion_tpl,
  distractores = excluded.distractores, age_groups = excluded.age_groups,
  anillo_min = excluded.anillo_min, dificultad_base = excluded.dificultad_base,
  fuente_id = excluded.fuente_id, status = 'aprobado'`,
  30);

push('\n-- ── La Q-matrix ────────────────────────────────────────────────────────');
bloque('ac_plantilla_conceptos', ['plantilla_id', 'concepto_id', 'peso'],
  plantillas.flatMap((p) => (p.conceptos || []).map(([cs, peso]) =>
    [`(select id from ac_plantillas where generator_hash = ${q(p.slug)})`, conceptoId(cs), peso])),
  '(plantilla_id, concepto_id)', 'update set peso = excluded.peso', 100);

push('\n-- ── Ítems ensamblados (radicales × incidentales) ───────────────────────');
bloque('ac_items',
  ['plantilla_id', 'seed', 'payload_publico', 'solucion', 'slot_valores', 'age_groups', 'anillo_min',
   'dificultad', 'status'],
  items.map((it) => {
    const sol = { ...it.solucion };
    const fs = sol.fuente; delete sol.fuente;
    return [
      `(select id from ac_plantillas where generator_hash = ${q(it.plantilla)})`, it.seed,
      j(it.payload_publico),
      `${j(sol)} || jsonb_build_object('fuente_id', ${fuenteId(fs)})`,
      j(it.slot_valores), arr(it.age_groups), it.anillo_min, it.dificultad.toFixed(3), `'aprobado'`,
    ];
  }),
  '(plantilla_id, seed)',
  `update set payload_publico = excluded.payload_publico, solucion = excluded.solucion,
  slot_valores = excluded.slot_valores, age_groups = excluded.age_groups,
  anillo_min = excluded.anillo_min, dificultad = excluded.dificultad, status = 'aprobado'`,
  25);

push(`
-- Y ahora sí, los ítems derivados de cada concepto:
--     select ac_sembrar_derivados();`);

const sql = L.join('\n') + '\n';
writeFileSync(OUT, sql, 'utf8');

console.log(`seed-academia.sql escrito · ${(sql.length / 1024).toFixed(0)} KB · ${L.length} sentencias`);
console.log(`  fuentes ${FUENTES.length} · anillos ${ANILLOS.length} · ramas ${RAMAS.length}`);
console.log(`  gajos ${gajos.length} · hojas ${hojas.length} · conceptos ${conceptos.length}`);
console.log(`  prereqs ${prereqs.length} · misconceptions ${misconceptions.length}`);
console.log(`  plantillas autoradas ${plantillas.length} · ítems ensamblados ${items.length}`);
console.log('  por tipo:', Object.entries(porTipo).map(([t, n]) => `${t}=${n}`).join(' '));
