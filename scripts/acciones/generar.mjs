// ─────────────────────────────────────────────────────────────────────────────
// Genera el catálogo de acciones (docs/ACCIONES.md §3, §6).
//
//   node scripts/acciones/generar.mjs
//
// Lee `catalogo/*.mjs` y `caminos.mjs`, valida todo (falla con la lista de
// problemas si algo no cumple), pone los puntos por regla, arma la equivalencia
// de impacto y escribe:
//
//   supabase/migrations/0124_acciones_catalogo.sql   (upsert por slug + bajas)
//   scripts/acciones/catalogo.json                   (lo que miran los tests)
//
// Los slugs que siguen existiendo conservan su historia y sus rutinas. Los
// que se van se desactivan (nunca se borran: hay acciones hechas que los
// apuntan). `hereda` pasa a la acción nueva las rutinas y los puentes al
// Mercado de una vieja que se fusionó.
// ─────────────────────────────────────────────────────────────────────────────

import { readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { FUENTES } from './fuentes.mjs';
import { CAMINOS } from './caminos.mjs';

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = join(aqui, '..', '..');

const DOMINIOS = ['residuos', 'agua', 'energia', 'movilidad', 'plantas', 'animales', 'alimentacion', 'consumo', 'digital', 'comunidad', 'agua_azul', 'aire_suelo', 'ciencia'];
const FORMATOS = ['gesto', 'tarea', 'salida', 'social', 'observar', 'aprender', 'reto'];
const CONTEXTO = ['balcon', 'jardin', 'pileta', 'edificio', 'auto', 'bici', 'gas', 'aire', 'lena', 'parrilla', 'perro', 'gato', 'chicos', 'trabajo', 'estudio', 'campo', 'costa', 'compost', 'huerta', 'mascota'];
const SOLO_ADULTOS = ['auto', 'chicos', 'trabajo'];
const LUGARES = ['casa', 'calle', 'compras', 'trabajo', 'escuela', 'naturaleza', 'celular'];
const ESTACIONES = ['verano', 'otono', 'invierno', 'primavera'];
const REGIONES = ['centro', 'cuyo', 'noa', 'nea', 'patagonia'];
const RANGOS = ['semilla', 'brote', 'plantula', 'retono', 'arbusto', 'arbol'];
// Misma tabla que PUNTOS en lib/acciones/reglas.ts (un test las compara).
const PUNTOS = {
  daily: { easy: { low: 40, medium: 50, high: 60 }, medium: { low: 60, medium: 80, high: 100 }, hard: { low: 100, medium: 120, high: 150 } },
  catalog: { easy: { low: 80, medium: 100, high: 130 }, medium: { low: 130, medium: 170, high: 220 }, hard: { low: 220, medium: 300, high: 400 } },
};
// Enfriamiento por formato (horas) cuando la acción no dice el suyo.
const ENFRIAMIENTO = { gesto: 20, tarea: 720, salida: 168, social: 336, observar: 72, aprender: 720, reto: 168 };
// Slugs que existen por fuera del catálogo y no se tocan.
const INTOCABLES = new Set(['accion-grupal-proyecto']);

// ── Cargar ──────────────────────────────────────────────────────────────────

const dirCat = join(aqui, 'catalogo');
const archivos = readdirSync(dirCat).filter((f) => f.endsWith('.mjs')).sort();
const acciones = [];
for (const f of archivos) {
  const m = await import(pathToFileURL(join(dirCat, f)).href);
  for (const a of m.default) acciones.push({ ...a, _archivo: f });
}

// Una acción medible muestra, mientras nadie la hace, lo que suma con la
// cantidad por omisión: su impacto fijo sale de ahí, no se escribe a mano.
const CLAVE = { water_l: 'w', co2_kg: 'c', waste_kg: 'r', energy_kwh: 'e' };
for (const a of acciones) {
  if (!a.medida?.por) continue;
  const ef = { w: 0, c: 0, r: 0, e: 0 };
  for (const [k, v] of Object.entries(a.medida.por)) ef[CLAVE[k]] = Math.round(v * a.medida.def * 1000) / 1000;
  a.ef = ef;
}

// ── Validar ─────────────────────────────────────────────────────────────────

const problemas = [];
const mal = (a, msg) => problemas.push(`${a._archivo} · ${a.slug}: ${msg}`);
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const VACIAS = new Set(['de', 'la', 'el', 'los', 'las', 'en', 'y', 'a', 'un', 'una', 'que', 'tu', 'tus', 'con', 'del', 'al', 'o', 'por', 'para', 'no', 'lo', 'se', 'te', 'vez', 'mas']);
const fichas = (s) => new Set(norm(s).split(' ').filter((w) => w.length > 2 && !VACIAS.has(w)));

const slugs = new Map();
const titulos = new Map();
for (const a of acciones) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(a.slug) || a.slug.length > 60) mal(a, 'slug inválido');
  if (slugs.has(a.slug)) mal(a, `slug repetido (también en ${slugs.get(a.slug)})`);
  slugs.set(a.slug, a._archivo);
  const t = norm(a.titulo);
  if (titulos.has(t)) mal(a, `título repetido con ${titulos.get(t)}`);
  titulos.set(t, a.slug);

  if (!DOMINIOS.includes(a.dom)) mal(a, `tema "${a.dom}"`);
  if (!a.titulo || a.titulo.length > 70) mal(a, `título de ${a.titulo?.length} caracteres (máx. 70)`);
  if (!/^[A-ZÁÉÍÓÚÑ¿¡0-9]/.test(a.titulo ?? '')) mal(a, 'el título empieza en minúscula');
  if (!a.corto || a.corto.length > 120) mal(a, `corto de ${a.corto?.length} caracteres (máx. 120)`);
  if (!a.desc || a.desc.length < 60 || a.desc.length > 460) mal(a, `descripción de ${a.desc?.length} caracteres (60–460)`);
  if (!Array.isArray(a.pasos) || a.pasos.length < 1 || a.pasos.length > 4) mal(a, `${a.pasos?.length} pasos (1–4)`);
  for (const p of a.pasos ?? []) if (p.length > 220) mal(a, `un paso de ${p.length} caracteres`);
  if (!['easy', 'medium', 'hard'].includes(a.esf)) mal(a, `esfuerzo ${a.esf}`);
  if (!['low', 'medium', 'high'].includes(a.imp)) mal(a, `impacto ${a.imp}`);
  if (!FORMATOS.includes(a.formato)) mal(a, `formato ${a.formato}`);
  if (!(a.min >= 1 && a.min <= 600)) mal(a, `minutos ${a.min}`);
  if (a.tipo === 'daily' && a.min > 30) mal(a, 'una acción del día no puede llevar más de 30 minutos');
  if (a.tipo === 'daily' && a.frec !== 'daily') mal(a, 'una acción del día tiene frecuencia diaria');
  if (a.tipo === 'catalog' && !['one_time', 'weekly', 'recurring'].includes(a.frec)) mal(a, `frecuencia ${a.frec}`);
  if (a.rutina && a.tipo !== 'daily') mal(a, 'sólo una acción del día puede ir a la rutina');
  if (!a.edad.length) mal(a, 'sin edades');
  for (const k of a.req) if (!CONTEXTO.includes(k)) mal(a, `requiere "${k}"`);
  if (a.edad.includes('kid')) for (const k of a.req) if (SOLO_ADULTOS.includes(k)) mal(a, `un chico no tiene "${k}"`);
  if (!LUGARES.includes(a.lugar)) mal(a, `lugar ${a.lugar}`);
  for (const e of a.est) if (!ESTACIONES.includes(e)) mal(a, `estación ${e}`);
  if (a.est.length === 4) mal(a, 'las cuatro estaciones = todo el año: dejala vacía');
  for (const r of a.reg) if (!REGIONES.includes(r)) mal(a, `región ${r}`);
  if (a.dias && !['habil', 'finde'].includes(a.dias)) mal(a, `días ${a.dias}`);
  if (!['gratis', 'bajo'].includes(a.costo)) mal(a, `costo ${a.costo}`);
  if (!RANGOS.includes(a.rango)) mal(a, `rango ${a.rango}`);
  if (a.fuente && !FUENTES.has(a.fuente)) mal(a, `fuente "${a.fuente}" no está en fuentes.mjs`);
  if (a.adulto && !a.edad.includes('kid')) mal(a, '"con un adulto" sólo tiene sentido si la puede hacer un chico');
  if (a.medida) {
    const m = a.medida;
    if (!m.pregunta || !m.unidad || !m.unidades) mal(a, 'medida sin pregunta o unidad');
    if (!(m.max > m.min && m.def >= m.min && m.def <= m.max)) mal(a, 'medida: rango o valor por omisión inválido');
    if (!m.por || !Object.keys(m.por).length) mal(a, 'medida sin impacto por unidad');
    for (const k of Object.keys(m.por ?? {})) if (!CLAVE[k]) mal(a, `medida: impacto "${k}"`);
    const tope = Object.fromEntries(Object.entries(m.por ?? {}).map(([k, v]) => [CLAVE[k], v * m.max]));
    if ((tope.w ?? 0) > 3000 || (tope.c ?? 0) > 30 || (tope.r ?? 0) > 15 || (tope.e ?? 0) > 60) mal(a, `medida: el máximo suma demasiado ${JSON.stringify(tope)}`);
  }
  // Impacto prudente: topes por vez (lo medible se controla con su máximo).
  const ef = a.ef;
  if (ef.w > 3000 || ef.c > 30 || ef.r > 15 || ef.e > 60) mal(a, `impacto por vez demasiado alto ${JSON.stringify(ef)}`);
  if (a.tipo === 'daily' && (ef.w > 400 || ef.c > 6 || ef.r > 2 || ef.e > 12)) mal(a, `impacto diario demasiado alto ${JSON.stringify(ef)}`);
  for (const h of a.hereda) if (h === a.slug) mal(a, 'se hereda a sí misma');
  if (a.otorga && !['compost', 'huerta'].includes(a.otorga)) mal(a, `otorga "${a.otorga}"`);
  if (a.otorga && a.req.includes(a.otorga)) mal(a, 'otorga lo mismo que pide');
}

// Casi duplicados: mismo tema y casi las mismas palabras en el título.
const porTema = new Map();
for (const a of acciones) {
  const arr = porTema.get(a.dom) ?? [];
  arr.push(a);
  porTema.set(a.dom, arr);
}
for (const arr of porTema.values()) {
  for (let i = 0; i < arr.length; i++) {
    const fi = fichas(arr[i].titulo);
    for (let j = i + 1; j < arr.length; j++) {
      const fj = fichas(arr[j].titulo);
      const inter = [...fi].filter((w) => fj.has(w)).length;
      const union = new Set([...fi, ...fj]).size || 1;
      if (inter / union >= 0.75) mal(arr[j], `casi igual a ${arr[i].slug} ("${arr[i].titulo}")`);
    }
  }
}

// Caminos: pasos que existen, en orden, sin repetir, edades compatibles.
const enCamino = new Map();
for (const cam of CAMINOS) {
  if (!DOMINIOS.includes(cam.dom)) problemas.push(`camino ${cam.slug}: tema ${cam.dom}`);
  if (cam.pasos.length < 3 || cam.pasos.length > 6) problemas.push(`camino ${cam.slug}: ${cam.pasos.length} pasos (3–6)`);
  cam.pasos.forEach((s, i) => {
    const a = acciones.find((x) => x.slug === s);
    if (!a) return problemas.push(`camino ${cam.slug}: no existe la acción ${s}`);
    if (enCamino.has(s)) problemas.push(`camino ${cam.slug}: ${s} ya está en ${enCamino.get(s)}`);
    enCamino.set(s, cam.slug);
    a.camino = [cam.slug, i + 1];
    if (a.est.length) problemas.push(`camino ${cam.slug}: ${s} es de temporada (un camino tiene que poder hacerse todo el año)`);
    if (a.reg.length) problemas.push(`camino ${cam.slug}: ${s} es regional`);
  });
}

if (problemas.length) {
  console.error(`✗ ${problemas.length} problemas:\n` + problemas.map((p) => '  · ' + p).join('\n'));
  process.exit(1);
}

// ── Derivar ─────────────────────────────────────────────────────────────────

const fmt = (n, dec = 1) => n.toLocaleString('es-AR', { maximumFractionDigits: dec });
function cantidad(metric, v) {
  if (metric === 'w') return v >= 1000 ? `${fmt(v / 1000)} m³ de agua` : `${fmt(v, 0)} L de agua`;
  if (metric === 'c') return v < 1 ? `${fmt(v * 1000, 0)} g de CO₂` : `${fmt(v)} kg de CO₂`;
  if (metric === 'r') return v < 1 ? `${fmt(v * 1000, 0)} g de residuos` : `${fmt(v)} kg de residuos`;
  return `${fmt(v)} kWh de energía`;
}
const METRICA_TEMA = { agua: 'w', agua_azul: 'w', energia: 'e', residuos: 'r', consumo: 'r', alimentacion: 'c', movilidad: 'c', aire_suelo: 'c' };
function equivalencia(a) {
  if (a.equiv) return a.equiv;
  if (a.medida) {
    const [k, v] = Object.entries(a.medida.por)[0];
    const m = { water_l: 'w', co2_kg: 'c', waste_kg: 'r', energy_kwh: 'e' }[k];
    return `Cada ${a.medida.unidad}: ${cantidad(m, v)}`;
  }
  const ef = a.ef;
  const pref = METRICA_TEMA[a.dom];
  const orden = [pref, 'w', 'c', 'r', 'e'].filter(Boolean);
  const k = orden.find((m) => ef[m] > 0);
  if (!k) return null;
  return `Cada vez: ~${cantidad(k, ef[k])}`;
}

const filas = acciones.map((a, i) => {
  const f = a.fuente ? FUENTES.get(a.fuente) : null;
  return {
    slug: a.slug,
    type: a.tipo,
    domain_slug: a.dom,
    title_es: a.titulo,
    short_es: a.corto,
    description_es: a.desc,
    instructions_es: a.pasos.join('\n'),
    effort: a.esf,
    impact: a.imp,
    base_points: PUNTOS[a.tipo][a.esf][a.imp],
    frequency: a.frec,
    repeat_cooldown_hours: a.tipo === 'daily' ? 0 : a.frec === 'recurring' ? (a.cool ?? ENFRIAMIENTO[a.formato]) : 0,
    min_rank_slug: a.rango,
    age_groups: a.edad,
    impact_water_l: a.ef.w,
    impact_co2_kg: a.ef.c,
    impact_waste_kg: a.ef.r,
    impact_energy_kwh: a.ef.e,
    impact_equivalency_es: equivalencia(a),
    routine_eligible: a.rutina,
    formato: a.formato,
    minutos: a.min,
    costo: a.costo,
    ahorra: a.ahorra,
    requiere: a.req,
    lugar: a.lugar,
    estaciones: a.est,
    dias: a.dias,
    regiones: a.reg,
    con_adulto: a.adulto,
    medida: a.medida,
    fuente: f ? f.organizacion : null,
    fuente_url: f ? f.url : null,
    camino_slug: a.camino?.[0] ?? null,
    camino_paso: a.camino?.[1] ?? null,
    tags: a.tags,
    otorga: a.otorga,
    sort_order: i + 1,
    hereda: a.hereda,
  };
});

// ── Escribir ────────────────────────────────────────────────────────────────

const q = (v) => (v == null ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
const arr = (xs) => `array[${xs.map(q).join(',')}]::text[]`;
const num = (n) => (Number.isFinite(n) ? String(n) : '0');

const columnas = [
  'slug', 'type', 'domain_slug', 'title_es', 'short_es', 'description_es', 'instructions_es', 'effort', 'impact',
  'verification', 'base_points', 'frequency', 'repeat_cooldown_hours', 'icon', 'min_rank_slug', 'age_groups',
  'impact_water_l', 'impact_co2_kg', 'impact_waste_kg', 'impact_energy_kwh', 'impact_equivalency_es',
  'routine_eligible', 'formato', 'minutos', 'costo', 'ahorra', 'requiere', 'lugar', 'estaciones', 'dias',
  'regiones', 'con_adulto', 'medida', 'fuente', 'fuente_url', 'camino_slug', 'camino_paso', 'tags', 'otorga', 'active', 'sort_order',
];
const valores = (r) =>
  `(${[
    q(r.slug), `${q(r.type)}::activity_type`, q(r.domain_slug), q(r.title_es), q(r.short_es), q(r.description_es),
    q(r.instructions_es), `${q(r.effort)}::effort_level`, `${q(r.impact)}::impact_level`, `'honor'::verification_type`,
    num(r.base_points), `${q(r.frequency)}::frequency_type`, num(r.repeat_cooldown_hours), q(r.domain_slug),
    q(r.min_rank_slug), arr(r.age_groups), num(r.impact_water_l), num(r.impact_co2_kg), num(r.impact_waste_kg),
    num(r.impact_energy_kwh), q(r.impact_equivalency_es), r.routine_eligible, q(r.formato), num(r.minutos), q(r.costo),
    r.ahorra, arr(r.requiere), q(r.lugar), arr(r.estaciones), q(r.dias), arr(r.regiones), r.con_adulto,
    r.medida ? `${q(JSON.stringify(r.medida))}::jsonb` : 'null', q(r.fuente), q(r.fuente_url), q(r.camino_slug),
    r.camino_paso == null ? 'null' : num(r.camino_paso), arr(r.tags), q(r.otorga), 'true', num(r.sort_order),
  ].join(',')})`;

const porTipo = (t) => filas.filter((r) => r.type === t).length;
const resumen = DOMINIOS.map((d) => `--   ${d.padEnd(13)} ${String(filas.filter((r) => r.domain_slug === d).length).padStart(3)}`).join('\n');

let sql = `-- 0124 — El catálogo de acciones, reescrito (docs/ACCIONES.md).
-- GENERADO por scripts/acciones/generar.mjs desde scripts/acciones/catalogo/.
-- No editar a mano: cambiar los datos y volver a generar.
--
-- ${filas.length} acciones activas (${porTipo('daily')} del día, ${porTipo('catalog')} de catálogo) y ${CAMINOS.length} caminos.
${resumen}
--
-- Cada fila trae descripción, pasos, minutos, contexto que pide, estación,
-- región, fuente y puntos por regla (esfuerzo × impacto). Los slugs que ya
-- existían conservan su historia; lo que no está acá se desactiva (nunca se
-- borra). Requiere 0123.

-- ── Caminos ──
insert into public.caminos (slug, titulo_es, descripcion_es, domain_slug, orden, recompensa_puntos, active) values
${CAMINOS.map((c, i) => `(${q(c.slug)},${q(c.titulo)},${q(c.desc)},${q(c.dom)},${i + 1},${c.puntos ?? 300},true)`).join(',\n')}
on conflict (slug) do update set titulo_es = excluded.titulo_es, descripcion_es = excluded.descripcion_es,
  domain_slug = excluded.domain_slug, orden = excluded.orden, recompensa_puntos = excluded.recompensa_puntos, active = true;
update public.caminos set active = false where slug not in (${CAMINOS.map((c) => q(c.slug)).join(',')});

-- ── Acciones ──
-- Primero se suelta el camino de todo (una acción puede haber cambiado de camino).
update public.activities set camino_slug = null, camino_paso = null where camino_slug is not null;

insert into public.activities (${columnas.join(', ')}) values
${filas.map(valores).join(',\n')}
on conflict (slug) do update set
${columnas.filter((c) => c !== 'slug').map((c) => `  ${c} = excluded.${c}`).join(',\n')};

-- ── Lo que se fusionó: rutinas y puentes al Mercado pasan a la acción nueva ──
`;
for (const r of filas) {
  for (const viejo of r.hereda) {
    sql += `insert into public.activity_market_hints (activity_id, categoria, dominios, texto_puente, activo)
  select n.id, h.categoria, h.dominios, h.texto_puente, h.activo
    from public.activity_market_hints h join public.activities o on o.id = h.activity_id, public.activities n
   where o.slug = ${q(viejo)} and n.slug = ${q(r.slug)}
  on conflict (activity_id, categoria) do nothing;
update public.user_habits uh set activity_id = n.id
  from public.activities o, public.activities n
 where o.slug = ${q(viejo)} and n.slug = ${q(r.slug)} and uh.activity_id = o.id
   and not exists (select 1 from public.user_habits x where x.user_id = uh.user_id and x.activity_id = n.id);
`;
  }
}
sql += `
-- ── Bajas: lo que no está en el catálogo nuevo ──
update public.activities set active = false
 where active and slug not in (
${filas.map((r) => q(r.slug)).join(',')},
${[...INTOCABLES].map(q).join(',')});

-- La jornada de un proyecto es interna: se acredita al cerrar la jornada, no se ofrece.
update public.activities
   set tags = array['interno'], formato = 'social', minutos = 120, lugar = 'calle',
       description_es = 'Se suma sola cuando quien organiza un proyecto cierra una jornada a la que fuiste.',
       instructions_es = 'Sumate a un proyecto de tu zona.' || chr(10) || 'Andá a la jornada.' || chr(10) || 'Cuando quien organiza la cierra, se te acredita.'
 where slug = 'accion-grupal-proyecto';

-- Las rutinas de acciones que se dieron de baja se apagan (siguen en la historia).
update public.user_habits set active = false
 where active and activity_id in (select id from public.activities where not active);

-- "Nuevas esta semana" arranca con dos del catálogo nuevo.
update public.activities set is_featured = false, featured_week = null where is_featured;
update public.activities set is_featured = true, featured_week = (now() at time zone 'America/Argentina/Buenos_Aires')::date
 where slug in (${filas.filter((r) => r.type === 'catalog' && !r.estaciones.length && r.age_groups.includes('kid')).slice(0, 2).map((r) => q(r.slug)).join(',')});
`;

writeFileSync(join(raiz, 'supabase', 'migrations', '0124_acciones_catalogo.sql'), sql);
writeFileSync(
  join(aqui, 'catalogo.json'),
  JSON.stringify({ acciones: filas, caminos: CAMINOS }, null, 1) + '\n',
);

const kid = filas.filter((r) => r.age_groups.includes('kid')).length;
const conReq = filas.filter((r) => r.requiere.length).length;
const temporada = filas.filter((r) => r.estaciones.length).length;
const conFuente = filas.filter((r) => r.fuente).length;
const medibles = filas.filter((r) => r.medida).length;
console.log(`✓ ${filas.length} acciones (${porTipo('daily')} del día · ${porTipo('catalog')} catálogo) · ${CAMINOS.length} caminos`);
console.log(`  para chicos ${kid} · piden contexto ${conReq} · de temporada ${temporada} · con fuente ${conFuente} · medibles ${medibles}`);
console.log(resumen.replace(/-- {3}/g, '  '));
