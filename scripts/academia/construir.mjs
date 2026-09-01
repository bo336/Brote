// ─────────────────────────────────────────────────────────────────────────────
// Construcción y VALIDACIÓN del contenido de la Academia.
//
// Un solo lugar donde el contenido se carga, se valida y se ensambla, para que
// el emisor de SQL (`gen-academia-seed.mjs`) y el aplicador en vivo
// (`apply-academia-seed.mjs`) no puedan divergir nunca. Si divergieran, el
// archivo commiteado y la base viva dirían cosas distintas y nadie se enteraría.
//
// Valida contra `scripts/academia/CONTRATO.md` §8 y aborta con código 1 a la
// primera falla. Un seed que se aplica a medias es peor que uno que no se
// aplica: la validación es el producto acá, no un extra.
//
// El ensamblado de ítems es radicales × incidentales — el paso de "assembly" de
// Gierl & Lai. El rendimiento es el PRODUCTO de los ejes, no la suma.
// ─────────────────────────────────────────────────────────────────────────────

import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { FUENTES, FUENTE_SLUGS } from './fuentes.mjs';
import { ANILLOS, RAMAS, RAMA_SLUGS } from './estructura.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const TIPOS_GRADUADOS = [
  'opcion_multiple', 'mito_o_dato', 'ordenar_secuencia', 'clasificar_en_cestos',
  'emparejar', 'estimacion_numerica', 'ranking_impacto', 'elegir_la_accion',
  'cadena_causal', 'detectar_greenwashing', 'mapa_localizar', 'completar_frase',
];

// ── utilidades ───────────────────────────────────────────────────────────────

const errores = [];
const fallar = (msg) => errores.push(msg);

/** Comilla simple SQL. Null explícito, nunca la cadena "null". */
const q = (s) => (s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`);
/** Literal jsonb. */
const j = (o) => `${q(JSON.stringify(o))}::jsonb`;
/** Literal text[]. */
const arr = (a) => `'{${(a || []).map((x) => `"${String(x).replace(/"/g, '\\"')}"`).join(',')}}'::text[]`;

/**
 * FNV-1a de 64 bits. Determinista y estable entre corridas, que es lo único que
 * se le pide: `(plantilla_id, seed)` tiene que reconstruir SIEMPRE el mismo
 * ítem, o el registro de respuestas deja de significar algo.
 * Se recorta al rango positivo de bigint de Postgres.
 */
function hash64(str) {
  let h = 0xcbf29ce484222325n;
  const p = 0x100000001b3n;
  const m = (1n << 64n) - 1n;
  for (let i = 0; i < str.length; i++) {
    h = ((h ^ BigInt(str.charCodeAt(i))) * p) & m;
  }
  return h & 0x7fffffffffffffffn;
}

/** Baraja determinista (Fisher-Yates con PRNG sembrado). */
function barajar(a, semilla) {
  const out = [...a];
  let s = Number(semilla % 2147483647n) || 1;
  const rnd = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = out.length - 1; i > 0; i--) {
    const k = Math.floor(rnd() * (i + 1));
    [out[i], out[k]] = [out[k], out[i]];
  }
  return out;
}

/** Rellena `{{slot}}` y `{{slot.campo}}` desde un objeto de valores. */
function render(tpl, vals) {
  return String(tpl ?? '')
    .replace(/\{\{([a-z0-9_]+)(?:\.([a-z0-9_]+))?\}\}/gi, (_, slot, campo) => {
      const v = vals[slot];
      if (v == null) return '';
      if (campo) return String(v[campo] ?? '');
      return String(typeof v === 'object' ? (v.texto ?? '') : v);
    })
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Formatea un número al estilo argentino, conservando el sufijo del original. */
function perturbar(claveTexto, op) {
  const m = String(claveTexto).match(/^([\d.,]+)(.*)$/);
  if (!m) return null;
  const n = Number(m[1].replace(/\./g, '').replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  const sufijo = m[2];
  const ops = {
    '/100': n / 100, '/10': n / 10, x10: n * 10, x100: n * 100,
    '+50%': n * 1.5, '-50%': n * 0.5,
  };
  const r = ops[op];
  if (r == null) return null;
  const fmt = new Intl.NumberFormat('es-AR', { maximumFractionDigits: r < 10 ? 1 : 0 }).format(r);
  return `${fmt}${sufijo}`;
}

/** Producto cartesiano de los ejes incidentales. Siempre devuelve ≥1 combo. */
function combos(incidentales) {
  const claves = Object.keys(incidentales || {});
  if (!claves.length) return [{}];
  let out = [{}];
  for (const k of claves) {
    const siguiente = [];
    for (const base of out) for (const v of incidentales[k]) siguiente.push({ ...base, [k]: v });
    out = siguiente;
  }
  return out;
}

// ── carga de módulos ─────────────────────────────────────────────────────────

const modulos = [];
for (const f of readdirSync(join(__dirname, 'conceptos')).sort()) {
  if (!f.endsWith('.mjs')) continue;
  modulos.push((await import(`./conceptos/${f}`)).default);
}

const plantillas = [];
for (const f of readdirSync(join(__dirname, 'plantillas')).sort()) {
  if (!f.endsWith('.mjs')) continue;
  plantillas.push(...(await import(`./plantillas/${f}`)).default);
}

// ── aplanado ─────────────────────────────────────────────────────────────────

const gajos = [];
const hojas = [];
const conceptos = [];
const hojaConceptos = [];
const prereqs = [];
const misconceptions = [];

for (const m of modulos) {
  if (!RAMA_SLUGS.has(m.rama)) fallar(`rama desconocida: ${m.rama}`);
  for (const g of m.gajos) {
    gajos.push({ ...g, rama_slug: m.rama });
    for (const c of g.conceptos) {
      conceptos.push({ ...c, rama_slug: m.rama, gajo_slug: g.slug });
      for (const r of c.requiere || []) {
        const slug = typeof r === 'string' ? r : r.slug;
        const fuerza = typeof r === 'string' ? 1.0 : (r.fuerza ?? 1.0);
        prereqs.push({ concepto: c.slug, requiere: slug, fuerza });
      }
      for (const mc of c.misconceptions || []) misconceptions.push({ ...mc, concepto: c.slug });
    }
    for (const h of g.hojas) {
      hojas.push({ ...h, gajo_slug: g.slug });
      for (const cs of h.conceptos) hojaConceptos.push({ hoja: h.slug, concepto: cs });
    }
  }
}

const CONCEPTO = new Map(conceptos.map((c) => [c.slug, c]));
const GAJO = new Map(gajos.map((g) => [g.slug, g]));

// ── validación (CONTRATO §8) ─────────────────────────────────────────────────

function unicos(lista, etiqueta) {
  const vistos = new Set();
  for (const s of lista) {
    if (vistos.has(s)) fallar(`${etiqueta} duplicado: ${s}`);
    vistos.add(s);
  }
}
unicos(gajos.map((g) => g.slug), 'slug de gajo');
unicos(hojas.map((h) => h.slug), 'slug de hoja');
unicos(conceptos.map((c) => c.slug), 'slug de concepto');
unicos(misconceptions.map((m) => m.slug), 'slug de misconception');
unicos(plantillas.map((p) => p.slug), 'slug de plantilla');

for (const c of conceptos) {
  if (!c.fuente) fallar(`concepto sin fuente: ${c.slug}`);
  else if (!FUENTE_SLUGS.has(c.fuente)) fallar(`concepto ${c.slug}: fuente inexistente "${c.fuente}"`);
  // Regla dura de edad: lo sensible no es apto para cuentas infantiles.
  if (c.sensible && (c.age_groups || []).includes('kid')) {
    fallar(`concepto ${c.slug}: sensible:true no puede incluir 'kid' en age_groups`);
  }
  if (!(c.anillo >= 1 && c.anillo <= ANILLOS.length)) fallar(`concepto ${c.slug}: anillo fuera de rango`);
}
for (const m of misconceptions) {
  if (m.fuente && !FUENTE_SLUGS.has(m.fuente)) fallar(`misconception ${m.slug}: fuente inexistente "${m.fuente}"`);
}
for (const p of prereqs) {
  if (!CONCEPTO.has(p.requiere)) fallar(`prereq de ${p.concepto}: no existe el concepto "${p.requiere}"`);
  if (p.concepto === p.requiere) fallar(`prereq de ${p.concepto}: se requiere a sí mismo`);
}

// Aciclicidad. El trigger de la base también lo rechaza, pero fallar acá da un
// mensaje con nombres y no un error de inserción a mitad de camino.
{
  const salidas = new Map();
  for (const p of prereqs) {
    if (!salidas.has(p.concepto)) salidas.set(p.concepto, []);
    salidas.get(p.concepto).push(p.requiere);
  }
  const estado = new Map();
  const camino = [];
  const visitar = (n) => {
    if (estado.get(n) === 2) return;
    if (estado.get(n) === 1) {
      fallar(`ciclo de prerrequisitos: ${[...camino.slice(camino.indexOf(n)), n].join(' → ')}`);
      return;
    }
    estado.set(n, 1); camino.push(n);
    for (const s of salidas.get(n) || []) visitar(s);
    camino.pop(); estado.set(n, 2);
  };
  for (const c of conceptos) visitar(c.slug);
}

// Coherencia de edad: una hoja no puede ofrecer un concepto a una edad que el
// propio concepto no admite, o la RLS devolvería una hoja vacía.
for (const hc of hojaConceptos) {
  const h = hojas.find((x) => x.slug === hc.hoja);
  const c = CONCEPTO.get(hc.concepto);
  if (!c) { fallar(`hoja ${hc.hoja} nombra un concepto inexistente: ${hc.concepto}`); continue; }
  const g = GAJO.get(h.gajo_slug);
  for (const edad of h.age_groups || []) {
    if (!(g.age_groups || []).includes(edad)) fallar(`hoja ${h.slug}: age_groups no está contenido en el de su gajo`);
  }
}

// Plantillas
const porTipo = {};
for (const p of plantillas) {
  porTipo[p.tipo] = (porTipo[p.tipo] || 0) + 1;
  if (!p.fuente || !FUENTE_SLUGS.has(p.fuente)) fallar(`plantilla ${p.slug}: fuente inexistente "${p.fuente}"`);
  if (!p.variantes?.length) fallar(`plantilla ${p.slug}: sin variantes`);
  for (const [cs] of p.conceptos || []) {
    if (!CONCEPTO.has(cs)) fallar(`plantilla ${p.slug}: concepto inexistente "${cs}"`);
  }
}
for (const t of TIPOS_GRADUADOS) {
  if ((porTipo[t] || 0) < 3) fallar(`tipo "${t}": ${porTipo[t] || 0} plantillas, hacen falta al menos 3`);
}

if (errores.length) {
  console.error(`\n${errores.length} error(es) de validación:\n`);
  for (const e of errores) console.error('  ✗ ' + e);
  console.error('\nNo se emitió SQL.');
  process.exit(1);
}

// ── ensamblado de ítems (radicales × incidentales) ───────────────────────────

const items = [];

function construirItem(p, v, inc, vi, ci) {
  const vals = { ...inc, ...v };
  const semilla = hash64(`${p.slug}|${vi}|${ci}`);
  const enunciado = render(p.enunciado_tpl, vals);
  const dificultad = (p.dificultad_base ?? 0) + (v.d ?? 0);
  const base = { tipo: p.tipo, enunciado, ayuda: p.ayuda ?? null };
  let payload, solucion = { explicacion: v.explicacion ?? null };

  const tok = (pre, xs) => xs.map((x, i) => ({ id: `${pre}${i + 1}`, ...x }));

  switch (p.tipo) {
    case 'microlectura':
      payload = { ...base, cuerpo: v.cuerpo, destacado: v.destacado ?? null };
      solucion = {};
      break;

    case 'dato_vivo':
      payload = { ...base, valor: v.valor, unidad: v.unidad, que_significa: v.que_significa };
      solucion = {};
      break;

    case 'opcion_multiple':
    case 'elegir_la_accion': {
      let distractores = [];
      const est = p.distractores?.estrategia;
      if (est === 'perturbacion') {
        distractores = (p.distractores.ops || []).map((op) => perturbar(v.clave, op)).filter(Boolean);
      } else if (est === 'misconception') {
        distractores = (p.conceptos || [])
          .flatMap(([cs]) => (CONCEPTO.get(cs)?.misconceptions || []).map((m) => m.creencia_es));
      }
      if (!distractores.length) distractores = v.distractores || [];
      distractores = [...new Set(distractores)].filter((d) => d && d !== v.clave).slice(0, 3);
      if (distractores.length < 2) {
        fallar(`plantilla ${p.slug} variante ${vi}: no se pudieron armar distractores`);
        return null;
      }
      // El orden ALMACENADO también se baraja, no solo el de la entrega: si la
      // clave quedara siempre primera y algún día fallara el barajado por
      // entrega, la posición filtraría la respuesta.
      const opciones = tok('o', barajar([{ texto: v.clave, _clave: true }, ...distractores.map((d) => ({ texto: d }))], semilla));
      const claveId = opciones.find((o) => o._clave).id;
      const porOpcion = {};
      for (const o of opciones) {
        const nota = v.nota_por_opcion?.[o.texto];
        if (nota) porOpcion[o.id] = { nota };
      }
      payload = {
        ...base,
        ...(p.tipo === 'elegir_la_accion' ? { escenario: v.escenario } : {}),
        opciones: opciones.map(({ id, texto }) => ({ id, texto })),
      };
      solucion = { ...solucion, clave: [claveId], por_opcion: porOpcion };
      break;
    }

    case 'mito_o_dato':
      payload = { ...base, afirmacion: v.afirmacion };
      solucion = { ...solucion, es_dato: !!v.es_dato };
      break;

    case 'ordenar_secuencia': {
      const frag = tok('f', v.orden.map((t) => ({ texto: t })));
      payload = { ...base, consigna: v.consigna, fragmentos: barajar(frag, semilla) };
      solucion = { ...solucion, clave: frag.map((f) => f.id) };
      break;
    }

    case 'ranking_impacto': {
      const ops = tok('o', v.orden.map((o) => ({ texto: o.texto, dominio: o.dominio })));
      payload = { ...base, consigna: v.consigna, opciones: barajar(ops, semilla) };
      solucion = {
        ...solucion,
        clave: ops.map((o) => o.id),
        // Los números reales se revelan DESPUÉS de contestar. Ese es el momento
        // en que el ejercicio enseña; antes solo sería una pista.
        valores: v.orden.map((o, i) => ({ id: ops[i].id, valor: o.valor, unidad: o.unidad })),
      };
      break;
    }

    case 'cadena_causal': {
      const cadena = tok('f', v.cadena.map((t) => ({ texto: t })));
      const decoys = (v.decoys || []).map((t, i) => ({ id: `d${i + 1}`, texto: t }));
      payload = {
        ...base,
        fragmentos: barajar([...cadena, ...decoys], semilla),
        largo_cadena: cadena.length,
      };
      solucion = { ...solucion, clave: cadena.map((f) => f.id) };
      break;
    }

    case 'clasificar_en_cestos': {
      const cestos = tok('c', v.cestos.map((c) => ({ nombre: c.nombre, color: c.color ?? null })));
      const porNombre = new Map(v.cestos.map((c, i) => [c.nombre, cestos[i].id]));
      const fichas = tok('h', v.fichas.map((f) => ({ texto: f.texto, _cesto: porNombre.get(f.cesto) })));
      payload = {
        ...base,
        cestos,
        fichas: barajar(fichas.map(({ id, texto }) => ({ id, texto })), semilla),
      };
      solucion = { ...solucion, clave: Object.fromEntries(fichas.map((f) => [f.id, f._cesto])) };
      break;
    }

    case 'emparejar': {
      const izq = tok('i', v.pares.map(([a]) => ({ texto: a })));
      const der = tok('d', v.pares.map(([, b]) => ({ texto: b })));
      payload = { ...base, izquierda: izq, derecha: barajar(der, semilla) };
      solucion = { ...solucion, clave: Object.fromEntries(izq.map((x, i) => [x.id, der[i].id])) };
      break;
    }

    case 'estimacion_numerica':
      payload = {
        ...base,
        min: v.min, max: v.max, paso: v.paso, unidad: v.unidad, escala: v.escala ?? 'lineal',
      };
      solucion = { ...solucion, valor: v.valor, unidad: v.unidad };
      break;

    case 'detectar_greenwashing': {
      const spans = tok('s', v.spans.map((s) => ({ texto: s.texto, _sin: !!s.sin_respaldo })));
      payload = { ...base, claim: v.claim, spans: spans.map(({ id, texto }) => ({ id, texto })) };
      solucion = { ...solucion, clave: spans.filter((s) => s._sin).map((s) => s.id) };
      break;
    }

    case 'mapa_localizar': {
      // `alternativas` es obligatorio: es la versión sin mapa del mismo ejercicio
      // y sin ella el tipo no se puede completar con lector de pantalla.
      const alts = tok('a', barajar([{ texto: v.region, _clave: true },
        ...(v.alternativas || []).map((t) => ({ texto: t }))], semilla));
      payload = {
        ...base,
        centro: v.centro, zoom: v.zoom ?? 6, capa: 'ecorregiones',
        alternativas: alts.map(({ id, texto }) => ({ id, texto })),
      };
      solucion = { ...solucion, clave: [alts.find((a) => a._clave).id], region: v.region };
      break;
    }

    case 'completar_frase': {
      const banco = tok('b', barajar(v.banco.map((t) => ({ texto: t })), semilla));
      const idDe = (t) => banco.find((b) => b.texto === t)?.id;
      const clave = v.huecos.map(idDe);
      if (clave.some((x) => !x)) {
        fallar(`plantilla ${p.slug} variante ${vi}: un hueco no está en el banco`);
        return null;
      }
      payload = { ...base, frase: v.frase, banco: banco.map(({ id, texto }) => ({ id, texto })) };
      solucion = { ...solucion, clave };
      break;
    }

    default:
      fallar(`tipo desconocido en ${p.slug}: ${p.tipo}`);
      return null;
  }

  // Los valores de slot viajan con el ítem: son lo que le permite al compositor
  // elegir, entre isomorfos de igual dificultad, el que le habla a esta persona.
  const slotValores = { variante: vi };
  for (const [k, val] of Object.entries(inc)) {
    slotValores[k] = val.k ?? val;
    if (val.contexto) slotValores.contexto = val.contexto;
    if (val.region) slotValores.region = val.region;
    if (val.registro) slotValores.registro = val.registro;
  }

  return {
    plantilla: p.slug,
    seed: semilla.toString(),
    payload_publico: payload,
    solucion: { ...solucion, fuente: p.fuente },
    slot_valores: slotValores,
    age_groups: v.age_groups ?? p.age_groups,
    anillo_min: p.anillo_min ?? 1,
    dificultad,
  };
}

for (const p of plantillas) {
  const cs = combos(p.incidentales);
  p.variantes.forEach((v, vi) => {
    cs.forEach((inc, ci) => {
      const it = construirItem(p, v, inc, vi, ci);
      if (it) items.push(it);
    });
  });
}

if (errores.length) {
  console.error(`\n${errores.length} error(es) al ensamblar ítems:\n`);
  for (const e of errores) console.error('  ✗ ' + e);
  process.exit(1);
}


export {
  FUENTES, FUENTE_SLUGS, ANILLOS, RAMAS,
  gajos, hojas, conceptos, hojaConceptos, prereqs, misconceptions,
  plantillas, items, porTipo, q, j, arr,
};
