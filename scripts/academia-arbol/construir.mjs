// ─────────────────────────────────────────────────────────────────────────────
// Construye el currículum del Árbol.
//
//   node scripts/academia-arbol/construir.mjs            valida y genera
//   node scripts/academia-arbol/construir.mjs --check    solo valida
//
// Lee `contenido/*.mjs` (una o más unidades por archivo), valida TODO, y
// escribe:
//   supabase/seed/academia-arbol/00-base.sql      fuentes y ramas
//   supabase/seed/academia-arbol/<rama>.sql        las unidades de cada rama
//   lib/academia/fuentes-academia.ts               la página de fuentes
//
// Un error de contenido FALLA la construcción: una pregunta con dos opciones
// iguales, una clave que no existe, una unidad sin desafío, una fuente que no
// está en la lista. Las advertencias se listan y no frenan.
// ─────────────────────────────────────────────────────────────────────────────

import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { RAMAS } from './ramas.mjs';
import { FUENTES } from './fuentes.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..');
const SOLO_CHEQUEO = process.argv.includes('--check');

const errores = [];
const avisos = [];
const err = (donde, msg) => errores.push(`${donde}: ${msg}`);
const aviso = (donde, msg) => avisos.push(`${donde}: ${msg}`);

const GRADUABLES = new Set([
  'opcion', 'multiple', 'vf', 'ordenar', 'ranking', 'cadena',
  'clasificar', 'emparejar', 'completar', 'numero', 'estimar', 'detectar',
]);
const PRESENTACION = new Set(['teoria', 'ejemplo']);
// Tipos que piden más que reconocer: suben un punto la dificultad por defecto.
const EXIGENTES = new Set(['numero', 'cadena', 'detectar', 'ranking', 'clasificar']);

const ramasPorSlug = new Map(RAMAS.map((r) => [r.slug, r]));
const fuentesPorSlug = new Map(FUENTES.map((f) => [f.slug, f]));

// ── 1 · Leer el contenido ────────────────────────────────────────────────────

const dirContenido = join(AQUI, 'contenido');
const archivos = readdirSync(dirContenido).filter((f) => f.endsWith('.mjs')).sort();
const unidades = [];
for (const a of archivos) {
  const mod = await import(pathToFileURL(join(dirContenido, a)).href);
  const lista = Array.isArray(mod.default) ? mod.default : [mod.default];
  for (const u of lista) unidades.push({ ...u, _archivo: a });
}

// ── 2 · Validación de texto ──────────────────────────────────────────────────

function texto(donde, s, { min = 1, max = 2000, campo = 'texto' } = {}) {
  if (typeof s !== 'string') return err(donde, `${campo} no es texto`);
  const t = s.trim();
  if (t.length < min) err(donde, `${campo} demasiado corto (${t.length} < ${min})`);
  if (t.length > max) err(donde, `${campo} demasiado largo (${t.length} > ${max})`);
  if (/undefined|null|TODO|XXX|\{\{\s*\}\}/.test(t)) err(donde, `${campo} tiene un marcador suelto: «${t.slice(0, 60)}»`);
  if (/\s{2,}/.test(t.replace(/\n/g, ' '))) aviso(donde, `${campo} tiene espacios dobles`);
  // Voseo: la sección habla de vos. Un "tú" o un "puedes" se cuela fácil.
  // Sin `\b`: en un regex sin la bandera `u`, "ú" no es letra y el borde de
  // palabra nunca cae después de "tú".
  if (/(^|[^a-záéíóúüñ])(tú|puedes|tienes|quieres|sabes|debes|eres|necesitas|haces|vives)(?=$|[^a-záéíóúüñ])/i.test(t))
    err(donde, `${campo} usa tuteo: «${t.slice(0, 80)}»`);
}

function unicos(donde, lista, campo) {
  const vistos = new Set();
  for (const x of lista) {
    const k = x.trim().toLowerCase();
    if (vistos.has(k)) err(donde, `${campo} repetido: «${x}»`);
    vistos.add(k);
  }
}

// ── 3 · Validación por tipo ──────────────────────────────────────────────────

const sesgoLargo = { total: 0, correctaMasLarga: 0 };

function validarPaso(donde, p) {
  const { tipo, payload: pl, solucion: s } = p;
  if (!GRADUABLES.has(tipo) && !PRESENTACION.has(tipo)) return err(donde, `tipo desconocido ${tipo}`);

  // Fuga de respuesta: nada de la solución puede estar en lo público.
  const publico = JSON.stringify(pl);
  for (const k of ['"clave"', '"explicacion"', '"por_opcion"', '"valores"', '"banda"', '"tolerancia"']) {
    if (publico.includes(k)) err(donde, `el payload público contiene ${k}`);
  }
  if ((tipo === 'numero' || tipo === 'estimar') && 'valor' in pl) err(donde, 'el payload público trae el valor');

  if (PRESENTACION.has(tipo)) {
    texto(donde, pl.titulo, { min: 3, max: 90, campo: 'titulo' });
    if (tipo === 'teoria') {
      if (!pl.cuerpo?.length) err(donde, 'teoría sin cuerpo');
      pl.cuerpo?.forEach((c, i) => texto(donde, c, { min: 20, max: 700, campo: `cuerpo[${i}]` }));
      const largo = (pl.cuerpo ?? []).join(' ').length;
      if (largo < 120) err(donde, `teoría muy corta (${largo} caracteres): una tarjeta de teoría enseña, no titula`);
      pl.lista?.forEach((x, i) => texto(donde, x, { min: 3, max: 240, campo: `lista[${i}]` }));
      if (pl.destacado) {
        texto(donde, String(pl.destacado.valor), { min: 1, max: 24, campo: 'destacado.valor' });
        texto(donde, pl.destacado.texto, { min: 5, max: 160, campo: 'destacado.texto' });
      }
    } else {
      texto(donde, pl.planteo, { min: 20, max: 600, campo: 'planteo' });
      if (!Array.isArray(pl.pasos) || pl.pasos.length < 2) err(donde, 'un ejemplo resuelto necesita al menos dos pasos');
      pl.pasos?.forEach((x, i) => texto(donde, x, { min: 5, max: 400, campo: `pasos[${i}]` }));
      texto(donde, pl.resultado, { min: 5, max: 300, campo: 'resultado' });
    }
    return;
  }

  texto(donde, s.explicacion, { min: 40, max: 900, campo: 'explicacion' });
  if (pl.contexto) texto(donde, pl.contexto, { min: 20, max: 900, campo: 'contexto' });
  if (pl.ayuda) texto(donde, pl.ayuda, { min: 5, max: 200, campo: 'ayuda' });
  if (pl.datos) {
    const d = pl.datos;
    if (d.tipo === 'barras') {
      if (!d.filas?.length || d.filas.some((f) => typeof f.valor !== 'number' || !Number.isFinite(f.valor)))
        err(donde, 'gráfico de barras con valores inválidos');
    } else if (d.tipo === 'tabla') {
      if (!d.columnas?.length || !d.filas?.length || d.filas.some((f) => f.length !== d.columnas.length))
        err(donde, 'tabla con filas que no coinciden con las columnas');
    } else err(donde, `datos de tipo desconocido ${d.tipo}`);
  }

  const idsDe = (arr) => new Set((arr ?? []).map((x) => x.id));

  switch (tipo) {
    case 'opcion': {
      texto(donde, pl.enunciado, { min: 8, max: 400, campo: 'enunciado' });
      if (pl.opciones.length < 3 || pl.opciones.length > 5) err(donde, `opción única con ${pl.opciones.length} opciones (3 a 5)`);
      pl.opciones.forEach((o, i) => texto(donde, o.texto, { min: 1, max: 220, campo: `opcion[${i}]` }));
      unicos(donde, pl.opciones.map((o) => o.texto), 'opción');
      const largos = pl.opciones.map((o) => o.texto.length);
      sesgoLargo.total += 1;
      if (largos[0] > Math.max(...largos.slice(1)) * 1.25) sesgoLargo.correctaMasLarga += 1;
      break;
    }
    case 'multiple': {
      texto(donde, pl.enunciado, { min: 8, max: 400, campo: 'enunciado' });
      if (pl.opciones.length < 4 || pl.opciones.length > 7) err(donde, `selección múltiple con ${pl.opciones.length} opciones (4 a 7)`);
      pl.opciones.forEach((o, i) => texto(donde, o.texto, { min: 1, max: 200, campo: `opcion[${i}]` }));
      unicos(donde, pl.opciones.map((o) => o.texto), 'opción');
      if (!s.clave.length) err(donde, 'selección múltiple sin correctas');
      if (s.clave.length === pl.opciones.length) err(donde, 'selección múltiple donde todas son correctas');
      break;
    }
    case 'vf': {
      texto(donde, pl.afirmacion, { min: 10, max: 400, campo: 'afirmacion' });
      if (typeof s.valor !== 'boolean') err(donde, 'vf sin valor booleano');
      if (pl.razones) {
        if (pl.razones.length < 2 || pl.razones.length > 4) err(donde, 'vf con razones: de 2 a 4');
        if (s.clave?.length !== 1) err(donde, 'vf con razones: exactamente una razón correcta');
        unicos(donde, pl.razones.map((r) => r.texto), 'razón');
      }
      break;
    }
    case 'ordenar':
    case 'ranking': {
      texto(donde, pl.enunciado, { min: 8, max: 400, campo: 'enunciado' });
      if (pl.items.length < 3 || pl.items.length > 7) err(donde, `${tipo} con ${pl.items.length} ítems (3 a 7)`);
      unicos(donde, pl.items.map((o) => o.texto), 'ítem');
      pl.items.forEach((o, i) => texto(donde, o.texto, { max: 160, campo: `item[${i}]` }));
      break;
    }
    case 'cadena': {
      texto(donde, pl.enunciado, { min: 8, max: 400, campo: 'enunciado' });
      if (pl.largo < 3) err(donde, 'una cadena causal necesita al menos tres eslabones');
      if (pl.items.length - pl.largo < 1) err(donde, 'una cadena causal necesita al menos un señuelo');
      unicos(donde, pl.items.map((o) => o.texto), 'eslabón');
      break;
    }
    case 'clasificar': {
      texto(donde, pl.enunciado, { min: 8, max: 400, campo: 'enunciado' });
      if (pl.grupos.length < 2 || pl.grupos.length > 4) err(donde, `clasificar con ${pl.grupos.length} grupos (2 a 4)`);
      if (pl.items.length < 4 || pl.items.length > 10) err(donde, `clasificar con ${pl.items.length} fichas (4 a 10)`);
      unicos(donde, pl.items.map((o) => o.texto), 'ficha');
      const usados = new Set(Object.values(s.clave));
      if (usados.size < pl.grupos.length) aviso(donde, 'hay un grupo sin ninguna ficha');
      break;
    }
    case 'emparejar': {
      texto(donde, pl.enunciado, { min: 8, max: 400, campo: 'enunciado' });
      if (pl.izquierda.length < 3 || pl.izquierda.length > 6) err(donde, `emparejar con ${pl.izquierda.length} pares (3 a 6)`);
      unicos(donde, pl.izquierda.map((o) => o.texto), 'izquierda');
      unicos(donde, pl.derecha.map((o) => o.texto), 'derecha');
      break;
    }
    case 'completar': {
      texto(donde, pl.enunciado, { min: 8, max: 300, campo: 'enunciado' });
      const n = (pl.texto.match(/\{\{\d+\}\}/g) ?? []).length;
      if (n < 1) err(donde, 'completar sin huecos');
      if (n !== s.clave.length) err(donde, 'completar: huecos y clave no coinciden');
      if (pl.banco.length < n + 2) err(donde, 'completar: el banco necesita al menos dos distractores');
      unicos(donde, pl.banco.map((o) => o.texto), 'palabra del banco');
      break;
    }
    case 'numero': {
      texto(donde, pl.enunciado, { min: 15, max: 500, campo: 'enunciado' });
      if (typeof s.valor !== 'number' || !Number.isFinite(s.valor)) err(donde, 'número sin valor finito');
      if (typeof pl.unidad !== 'string') err(donde, 'número sin unidad');
      if (!(s.tolerancia >= 0)) err(donde, 'número sin tolerancia');
      break;
    }
    case 'estimar': {
      texto(donde, pl.enunciado, { min: 15, max: 400, campo: 'enunciado' });
      if (!(pl.min < s.valor && s.valor < pl.max)) err(donde, `estimar: el valor ${s.valor} no está dentro de [${pl.min}, ${pl.max}]`);
      if (pl.escala === 'log' && pl.min <= 0) err(donde, 'estimar en escala log con mínimo ≤ 0');
      break;
    }
    case 'detectar': {
      texto(donde, pl.enunciado, { min: 8, max: 300, campo: 'enunciado' });
      if (pl.segmentos.length < 3) err(donde, 'detectar necesita al menos tres segmentos');
      if (!s.clave.length) err(donde, 'detectar sin segmentos marcables');
      if (s.clave.length === pl.segmentos.length) err(donde, 'detectar donde todo está mal');
      break;
    }
  }

  // La clave tiene que apuntar a fichas que existen.
  if (Array.isArray(s.clave)) {
    const campo = { opcion: 'opciones', multiple: 'opciones', vf: 'razones', ordenar: 'items', ranking: 'items', cadena: 'items', completar: 'banco', detectar: 'segmentos' }[tipo];
    const ids = idsDe(pl[campo]);
    for (const k of s.clave) if (!ids.has(k)) err(donde, `la clave apunta a ${k}, que no existe`);
  }
}

// ── 4 · Normalizar y validar la estructura ───────────────────────────────────

const slugsUnidad = new Set();
const porRama = new Map();
const norm = [];

for (const u of unidades) {
  const donde = `${u._archivo} · ${u.slug}`;
  if (!u.slug || !/^[a-z0-9_-]+$/.test(u.slug)) err(donde, 'slug de unidad inválido');
  if (slugsUnidad.has(u.slug)) err(donde, 'slug de unidad repetido');
  slugsUnidad.add(u.slug);
  if (!ramasPorSlug.has(u.rama)) err(donde, `rama desconocida ${u.rama}`);
  texto(donde, u.titulo, { min: 4, max: 60, campo: 'titulo' });
  texto(donde, u.bajada, { min: 20, max: 220, campo: 'bajada' });
  if (!Array.isArray(u.objetivos) || u.objetivos.length < 3) err(donde, 'una unidad necesita al menos tres objetivos');
  u.objetivos?.forEach((o, i) => texto(donde, o, { min: 10, max: 160, campo: `objetivo[${i}]` }));
  for (const f of u.fuentes ?? []) if (!fuentesPorSlug.has(f)) err(donde, `fuente desconocida ${f}`);
  if (!u.fuentes?.length) err(donde, 'una unidad sin fuentes no se publica');

  const lecs = u.lecciones ?? [];
  if (lecs.length < 5 || lecs.length > 10) err(donde, `una unidad tiene de 5 a 10 sesiones (tiene ${lecs.length})`);
  if (lecs.at(-1)?.tipo !== 'desafio') err(donde, 'la última sesión de una unidad es su desafío');
  if (lecs.filter((l) => l.tipo === 'desafio').length !== 1) err(donde, 'una unidad tiene exactamente un desafío');

  const lecciones = lecs.map((l, li) => {
    const lslug = `${u.slug}.s${li + 1}`;
    const ld = `${donde} · s${li + 1} «${l.titulo}»`;
    texto(ld, l.titulo, { min: 4, max: 70, campo: 'titulo' });
    texto(ld, l.bajada, { min: 15, max: 200, campo: 'bajada' });

    let pasos = [...(l.pasos ?? [])];
    if (l.tipo === 'practica' && !pasos.some((p) => p.tipo === 'teoria')) {
      pasos.unshift({
        tipo: 'teoria',
        payload: {
          tipo: 'teoria',
          titulo: 'Todo junto, a tu ritmo',
          cuerpo: [
            `Esta práctica mezcla lo de toda la unidad «${u.titulo}». No hay nada nuevo: es para que lo que aprendiste se quede.`,
            'Arranca por lo que más te costó en las sesiones anteriores y termina con algo más exigente. Si algo sale mal, vuelve al final para que lo arregles.',
          ],
        },
        solucion: {},
        dificultad: 1,
        concepto: null,
        repasable: false,
      });
    }

    const graduables = pasos.flatMap((p) => (p.variantes ? [p.variantes[0]] : [p])).filter((p) => GRADUABLES.has(p.tipo));
    const presentacion = pasos.filter((p) => PRESENTACION.has(p.tipo));
    const tiposDistintos = new Set(graduables.map((p) => p.tipo));

    if (l.tipo === 'leccion') {
      if (pasos[0]?.tipo !== 'teoria') err(ld, 'una lección empieza enseñando (primer paso: teoría)');
      if (presentacion.length < 2) err(ld, `una lección necesita al menos dos pasos de teoría o ejemplo (tiene ${presentacion.length})`);
      if (graduables.length < 10) err(ld, `una lección necesita al menos 10 ejercicios (tiene ${graduables.length})`);
      if (tiposDistintos.size < 4) err(ld, `una lección mezcla al menos 4 tipos de ejercicio (tiene ${tiposDistintos.size})`);
      if (PRESENTACION.has(pasos.at(-1)?.tipo)) err(ld, 'una lección termina en un ejercicio, no en teoría');
    }
    if (l.tipo === 'desafio' && graduables.length < 6) err(ld, `el desafío necesita al menos 6 ejercicios propios (tiene ${graduables.length})`);

    const nGrad = graduables.length;
    let iGrad = 0;
    const filas = [];
    pasos.forEach((p, pi) => {
      const orden = pi + 1;
      const grupo = `${lslug}.p${orden}`;
      const variantes = p.variantes ?? [p];
      const esGrad = GRADUABLES.has(variantes[0].tipo);
      const frac = esGrad ? iGrad / Math.max(1, nGrad - 1) : 0;
      if (esGrad) iGrad += 1;
      variantes.forEach((v, vi) => {
        const pd = `${ld} · p${orden}${variantes.length > 1 ? `v${vi + 1}` : ''} (${v.tipo})`;
        validarPaso(pd, v);
        let d = v.dificultad;
        if (d == null) {
          d = PRESENTACION.has(v.tipo) ? 1 : 1 + Math.floor(frac * 2.99);
          if (EXIGENTES.has(v.tipo)) d += 1;
          if (l.tipo === 'desafio') d += 1;
          d = Math.max(1, Math.min(5, d));
        }
        filas.push({
          slug: vi === 0 ? grupo : `${grupo}.v${vi + 1}`,
          orden,
          grupo,
          tipo: v.tipo,
          dificultad: d,
          concepto: v.concepto ?? null,
          repasable: PRESENTACION.has(v.tipo) ? false : v.repasable !== false,
          payload: v.payload,
          solucion: v.solucion,
        });
      });
    });

    const minutos =
      l.minutos ?? Math.max(4, Math.round(presentacion.length * 1.2 + graduables.length * 0.55 + (l.tipo === 'leccion' ? 1.5 : 0)));

    return { slug: lslug, orden: li + 1, tipo: l.tipo, titulo_es: l.titulo, bajada_es: l.bajada, minutos, pasos: filas };
  });

  const n = {
    slug: u.slug,
    rama: u.rama,
    orden: u.orden,
    nivel: u.nivel ?? (u.rama === 'tronco' ? 0 : 1),
    titulo_es: u.titulo,
    bajada_es: u.bajada,
    objetivos_es: u.objetivos ?? [],
    repasa: u.repasa ?? [],
    requiere_tronco: u.requiereTronco ?? (u.rama === 'tronco' ? 0 : 1),
    fuentes: u.fuentes ?? [],
    age_groups: u.edades ?? ['kid', 'teen', 'adult'],
    lecciones,
  };
  norm.push(n);
  if (!porRama.has(u.rama)) porRama.set(u.rama, []);
  porRama.get(u.rama).push(n);
}

// Referencias cruzadas, una vez que existen todas las unidades.
for (const u of norm) {
  for (const r of u.repasa) if (!slugsUnidad.has(r)) err(u.slug, `repasa una unidad que no existe: ${r}`);
  if (u.rama !== 'tronco' && u.requiere_tronco > 0) {
    const t = (porRama.get('tronco') ?? []).find((x) => x.orden === u.requiere_tronco);
    if (!t) err(u.slug, `requiere la unidad ${u.requiere_tronco} del tronco, que no existe`);
  }
}
for (const [rama, us] of porRama) {
  const ordenes = us.map((u) => u.orden).sort((a, b) => a - b);
  ordenes.forEach((o, i) => {
    if (o !== i + 1) err(rama, `los órdenes de unidad tienen que ser 1..n sin huecos (${ordenes.join(',')})`);
  });
  us.sort((a, b) => a.orden - b.orden);
}

// El mismo ejercicio escrito dos veces en todo el currículum es un descuido
// (o dos variantes de un cálculo que salieron con los mismos números). Una
// consigna repetida con otro contenido —«Uní cada concepto con su
// definición.»— es normal: solo se cuenta.
const ejercicios = new Map();
const enunciados = new Set();
let consignasRepetidas = 0;
for (const u of norm)
  for (const l of u.lecciones)
    for (const p of l.pasos) {
      const k = JSON.stringify(p.payload);
      if (ejercicios.has(k)) err(p.slug, `mismo ejercicio que ${ejercicios.get(k)}`);
      else ejercicios.set(k, p.slug);
      const e = (p.payload.enunciado ?? '') + '|' + (p.payload.afirmacion ?? '') + '|' + (p.payload.texto ?? '');
      if (e.length < 20) continue;
      if (enunciados.has(e)) consignasRepetidas += 1;
      else enunciados.add(e);
    }

// ── 5 · Informe ──────────────────────────────────────────────────────────────

const stats = { unidades: norm.length, sesiones: 0, pasos: 0, graduables: 0, teoria: 0, palabras: 0, porTipo: {} };
for (const u of norm)
  for (const l of u.lecciones) {
    stats.sesiones += 1;
    for (const p of l.pasos) {
      stats.pasos += 1;
      stats.porTipo[p.tipo] = (stats.porTipo[p.tipo] ?? 0) + 1;
      if (GRADUABLES.has(p.tipo)) stats.graduables += 1;
      else stats.teoria += 1;
      stats.palabras += JSON.stringify([p.payload, p.solucion.explicacion ?? ''])
        .replace(/"[a-z_]+":/g, ' ')
        .split(/\s+/)
        .filter((w) => /[a-záéíóúñ]/i.test(w)).length;
    }
  }

console.log(`\nÁrbol: ${stats.unidades} unidades · ${stats.sesiones} sesiones · ${stats.pasos} pasos (${stats.graduables} ejercicios, ${stats.teoria} de teoría) · ~${stats.palabras.toLocaleString('es-AR')} palabras`);
for (const r of RAMAS) {
  const us = porRama.get(r.slug) ?? [];
  if (!us.length) continue;
  const ses = us.reduce((a, u) => a + u.lecciones.length, 0);
  const pas = us.reduce((a, u) => a + u.lecciones.reduce((b, l) => b + l.pasos.length, 0), 0);
  console.log(`  ${r.slug.padEnd(13)} ${String(us.length).padStart(2)} unidades · ${String(ses).padStart(3)} sesiones · ${String(pas).padStart(4)} pasos`);
}
console.log('  por tipo:', Object.entries(stats.porTipo).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · '));
console.log(`  consignas repetidas con otro contenido: ${consignasRepetidas}`);
if (sesgoLargo.total) {
  const pct = Math.round((100 * sesgoLargo.correctaMasLarga) / sesgoLargo.total);
  console.log(`  opción única: la correcta es claramente la más larga en ${pct}% (${sesgoLargo.correctaMasLarga}/${sesgoLargo.total})`);
  if (pct > 30) aviso('sesgo', `la correcta es la más larga en ${pct}% de las opciones únicas: es una pista`);
}

if (avisos.length) {
  console.log(`\n${avisos.length} aviso(s):`);
  for (const a of avisos.slice(0, 60)) console.log('  · ' + a);
  if (avisos.length > 60) console.log(`  … y ${avisos.length - 60} más`);
}
if (errores.length) {
  console.error(`\n${errores.length} error(es):`);
  for (const e of errores.slice(0, 120)) console.error('  ✗ ' + e);
  if (errores.length > 120) console.error(`  … y ${errores.length - 120} más`);
  process.exit(1);
}
console.log('\nSin errores.');
if (SOLO_CHEQUEO) process.exit(0);

// ── 6 · Emitir ───────────────────────────────────────────────────────────────

const TAG = '$ac$';
function lit(obj) {
  const j = JSON.stringify(obj);
  if (j.includes(TAG)) throw new Error('el contenido contiene el delimitador $ac$');
  return `${TAG}${j}${TAG}::jsonb`;
}

const CABECERA = (que) =>
  `-- Generado por scripts/academia-arbol/construir.mjs — ${que}.\n-- No se edita a mano: se edita el contenido y se vuelve a construir.\n-- Idempotente: cargar dos veces deja lo mismo.\n\n`;

const dirSeed = join(RAIZ, 'supabase', 'seed', 'academia-arbol');
mkdirSync(dirSeed, { recursive: true });

// Solo las fuentes que alguna unidad cita.
const citadas = new Set(norm.flatMap((u) => u.fuentes));
let base = CABECERA('fuentes y ramas');
for (const f of FUENTES.filter((x) => citadas.has(x.slug))) {
  base += `select ac_cargar_fuente(${lit({ slug: f.slug, titulo: f.titulo, organizacion: f.organizacion, url: f.url, publicado: f.publicado ?? null, licencia: f.licencia ?? null, contenido: f.contenido ?? null })});\n`;
}
base += '\n';
for (const r of RAMAS) {
  base += `select ac_cargar_rama(${lit({ slug: r.slug, es_tronco: !!r.es_tronco, nombre_es: r.nombre_es, bajada_es: r.bajada_es, sort_order: r.sort_order })});\n`;
}
writeFileSync(join(dirSeed, '00-base.sql'), base);

const orden = ['tronco', ...RAMAS.filter((r) => r.slug !== 'tronco').map((r) => r.slug)];
orden.forEach((rama, i) => {
  const us = porRama.get(rama);
  if (!us?.length) return;
  let sql = CABECERA(`rama ${rama}`);
  for (const u of us) sql += `select ac_cargar_unidad(${lit(u)});\n`;
  writeFileSync(join(dirSeed, `${String(i + 1).padStart(2, '0')}-${rama}.sql`), sql);
});

writeFileSync(
  join(dirSeed, '99-cierre.sql'),
  CABECERA('cierre') +
    `-- Retira (no borra) las unidades que ya no están en el currículum.\nselect ac_retirar_unidades_fuera(array[${norm.map((u) => `'${u.slug}'`).join(', ')}]::text[]);\n`,
);

// La página de fuentes: agrupada por rama, con las unidades que citan cada una.
const fuentesTs = FUENTES.filter((f) => citadas.has(f.slug)).map((f) => ({
  slug: f.slug,
  titulo: f.titulo,
  organizacion: f.organizacion,
  url: f.url,
  publicado: f.publicado ?? null,
}));
const ramasTs = orden
  .filter((r) => porRama.get(r)?.length)
  .map((r) => ({
    slug: r,
    nombre: ramasPorSlug.get(r).nombre_es,
    unidades: porRama.get(r).map((u) => ({ slug: u.slug, titulo: u.titulo_es, fuentes: u.fuentes })),
  }));

const ts = `/**
 * Las fuentes del currículum de la Academia, para la página /legal/fuentes.
 *
 * GENERADO por scripts/academia-arbol/construir.mjs desde
 * scripts/academia-arbol/fuentes.mjs y el contenido. No se edita a mano.
 *
 * Solo títulos, organizaciones y links: ninguna respuesta de ningún ejercicio
 * pasa por acá, así que puede viajar al cliente sin riesgo.
 */

export interface FuenteAcademia {
  slug: string;
  titulo: string;
  organizacion: string;
  url: string;
  publicado: string | null;
}

export interface RamaFuentes {
  slug: string;
  nombre: string;
  unidades: { slug: string; titulo: string; fuentes: string[] }[];
}

export const FUENTES_ACADEMIA: FuenteAcademia[] = ${JSON.stringify(fuentesTs, null, 2)};

export const RAMAS_FUENTES: RamaFuentes[] = ${JSON.stringify(ramasTs, null, 2)};
`;
writeFileSync(join(RAIZ, 'lib', 'academia', 'fuentes-academia.ts'), ts);

console.log(`Escrito: supabase/seed/academia-arbol/ (${orden.filter((r) => porRama.get(r)?.length).length + 2} archivos) y lib/academia/fuentes-academia.ts`);
