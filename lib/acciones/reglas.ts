/**
 * Acciones v2 · el vocabulario y las reglas (docs/ACCIONES.md §3–§6).
 *
 * Este archivo es el espejo en TypeScript de lo que decide la base en
 * `0123_acciones_v2.sql`: qué acción le sirve a quién (`apta`), cuánto pesa
 * cada señal (`puntaje`) y cómo se arma el día (`armarDia`). La base es la
 * autoridad; este espejo existe para que las pantallas filtren igual que el
 * servidor y para que los tests fijen las reglas (y vigilen que el SQL no se
 * aparte de ellas).
 *
 * Nada acá toca la red: funciones puras, deterministas con sus entradas.
 */

// ── Formatos ─────────────────────────────────────────────────────────────────

export const FORMATOS = ['gesto', 'tarea', 'salida', 'social', 'observar', 'aprender', 'reto'] as const;
export type Formato = (typeof FORMATOS)[number];

export const FORMATO_ES: Record<Formato, string> = {
  gesto: 'Gesto',
  tarea: 'En casa',
  salida: 'Salida',
  social: 'Con otros',
  observar: 'Observar',
  aprender: 'Averiguar',
  reto: 'Reto',
};

// ── Contexto de la persona ───────────────────────────────────────────────────

export const CONTEXTO_CLAVES = [
  'balcon',
  'jardin',
  'pileta',
  'edificio',
  'auto',
  'bici',
  'gas',
  'aire',
  'lena',
  'parrilla',
  'perro',
  'gato',
  'chicos',
  'trabajo',
  'estudio',
  'campo',
  'costa',
] as const;
export type ContextoClave = (typeof CONTEXTO_CLAVES)[number];

export type GrupoContexto = 'casa' | 'moverse' | 'energia' | 'vida' | 'lugar';

export const GRUPOS_CONTEXTO: { grupo: GrupoContexto; titulo: string }[] = [
  { grupo: 'casa', titulo: 'Tu casa' },
  { grupo: 'moverse', titulo: 'Cómo te movés' },
  { grupo: 'energia', titulo: 'Lo que usás' },
  { grupo: 'vida', titulo: 'Tu día' },
  { grupo: 'lugar', titulo: 'Dónde vivís' },
];

export interface ContextoInfo {
  clave: ContextoClave;
  /** Lo que se marca: "Bici". */
  label: string;
  grupo: GrupoContexto;
  /** El motivo cuando una acción está en tu día por esto: "Porque tenés bici". */
  porque: string;
  /** Lo que se dice al descartar: "No tengo bici". */
  noTengo: string;
  /** Una cuenta de chico no ve esta opción (no maneja, no tiene hijos, no trabaja). */
  adultos?: boolean;
}

export const CONTEXTO: ContextoInfo[] = [
  { clave: 'balcon', label: 'Balcón, terraza o patio', grupo: 'casa', porque: 'Para tu balcón o patio', noTengo: 'No tengo balcón ni patio' },
  { clave: 'jardin', label: 'Jardín o tierra propia', grupo: 'casa', porque: 'Para tu jardín', noTengo: 'No tengo jardín' },
  { clave: 'pileta', label: 'Pileta o pelopincho', grupo: 'casa', porque: 'Para tu pileta', noTengo: 'No tengo pileta' },
  { clave: 'edificio', label: 'Vivo en un edificio', grupo: 'casa', porque: 'Para tu edificio', noTengo: 'No vivo en un edificio' },
  { clave: 'auto', label: 'Auto o moto', grupo: 'moverse', porque: 'Para tu auto o moto', noTengo: 'No tengo auto ni moto', adultos: true },
  { clave: 'bici', label: 'Bici', grupo: 'moverse', porque: 'Porque tenés bici', noTengo: 'No tengo bici' },
  { clave: 'gas', label: 'Calefón, termotanque o estufa a gas', grupo: 'energia', porque: 'Para tu calefón o estufa', noTengo: 'No tengo artefactos a gas' },
  { clave: 'aire', label: 'Aire acondicionado', grupo: 'energia', porque: 'Para tu aire acondicionado', noTengo: 'No tengo aire acondicionado' },
  { clave: 'lena', label: 'Leña (salamandra, hogar, cocina)', grupo: 'energia', porque: 'Para tu estufa a leña', noTengo: 'No uso leña' },
  { clave: 'parrilla', label: 'Parrilla', grupo: 'energia', porque: 'Para el asado', noTengo: 'No hago asado' },
  { clave: 'perro', label: 'Perro', grupo: 'vida', porque: 'Para vos y tu perro', noTengo: 'No tengo perro' },
  { clave: 'gato', label: 'Gato', grupo: 'vida', porque: 'Para vos y tu gato', noTengo: 'No tengo gato' },
  { clave: 'chicos', label: 'Chicos en casa', grupo: 'vida', porque: 'Para hacer con los chicos', noTengo: 'No vivo con chicos', adultos: true },
  { clave: 'trabajo', label: 'Trabajo fuera de casa', grupo: 'vida', porque: 'Para el trabajo', noTengo: 'No trabajo fuera de casa', adultos: true },
  { clave: 'estudio', label: 'Escuela o facultad', grupo: 'vida', porque: 'Para la escuela', noTengo: 'No voy a la escuela ni a la facu' },
  { clave: 'campo', label: 'Campo o pueblo chico', grupo: 'lugar', porque: 'Para el campo', noTengo: 'No vivo en el campo' },
  { clave: 'costa', label: 'Cerca del mar, un río o una laguna', grupo: 'lugar', porque: 'Cerca del agua', noTengo: 'No vivo cerca del agua' },
];

export const CONTEXTO_POR_CLAVE = Object.fromEntries(CONTEXTO.map((c) => [c.clave, c])) as Record<ContextoClave, ContextoInfo>;

export type TipoCuenta = 'kid' | 'teen' | 'adult';

/**
 * El contexto que cuenta para decidir. `true` = lo tiene; cualquier otra cosa
 * (false, ausente, basura) = no. Un chico o un adolescente va a la escuela
 * salvo que diga lo contrario.
 */
export function contextoEfectivo(ctx: Record<string, unknown> | null | undefined, cuenta: TipoCuenta): Record<string, unknown> {
  const base = { ...(ctx ?? {}) };
  if ((cuenta === 'kid' || cuenta === 'teen') && !('estudio' in base)) base.estudio = true;
  return base;
}

/** ¿Tiene todo lo que la acción pide? Una acción sin requisitos le sirve a cualquiera. */
export function contextoTiene(ctx: Record<string, unknown>, requiere: readonly string[]): boolean {
  return requiere.every((k) => ctx[k] === true);
}

// ── Dónde, cuándo ────────────────────────────────────────────────────────────

export const LUGARES = ['casa', 'calle', 'compras', 'trabajo', 'escuela', 'naturaleza', 'celular'] as const;
export type Lugar = (typeof LUGARES)[number];
export const LUGAR_ES: Record<Lugar, string> = {
  casa: 'En casa',
  calle: 'En la calle',
  compras: 'De compras',
  trabajo: 'En el trabajo',
  escuela: 'En la escuela',
  naturaleza: 'Al aire libre',
  celular: 'Con el celu',
};

export const ESTACIONES = ['verano', 'otono', 'invierno', 'primavera'] as const;
export type Estacion = (typeof ESTACIONES)[number];
export const ESTACION_ES: Record<Estacion, string> = { verano: 'verano', otono: 'otoño', invierno: 'invierno', primavera: 'primavera' };

/** Hemisferio sur: verano dic–feb, otoño mar–may, invierno jun–ago, primavera sep–nov. */
export function estacionDe(fecha: Date | string): Estacion {
  const m = mesDe(fecha);
  if (m === 12 || m <= 2) return 'verano';
  if (m <= 5) return 'otono';
  if (m <= 8) return 'invierno';
  return 'primavera';
}

export const REGIONES = ['centro', 'cuyo', 'noa', 'nea', 'patagonia'] as const;
export type Region = (typeof REGIONES)[number];
export const REGION_ES: Record<Region, string> = {
  centro: 'Centro',
  cuyo: 'Cuyo',
  noa: 'Noroeste',
  nea: 'Noreste',
  patagonia: 'Patagonia',
};

/** Provincia (`profiles.city`, F15.4) → región. Las regiones del INDEC, con CABA en el Centro. */
export const REGION_DE_PROVINCIA: Record<string, Region> = {
  'Ciudad Autónoma de Buenos Aires': 'centro',
  'Buenos Aires': 'centro',
  Córdoba: 'centro',
  'Santa Fe': 'centro',
  'Entre Ríos': 'centro',
  'La Pampa': 'centro',
  Mendoza: 'cuyo',
  'San Juan': 'cuyo',
  'San Luis': 'cuyo',
  Jujuy: 'noa',
  Salta: 'noa',
  Tucumán: 'noa',
  Catamarca: 'noa',
  'Santiago del Estero': 'noa',
  'La Rioja': 'noa',
  Misiones: 'nea',
  Corrientes: 'nea',
  Chaco: 'nea',
  Formosa: 'nea',
  Neuquén: 'patagonia',
  'Río Negro': 'patagonia',
  Chubut: 'patagonia',
  'Santa Cruz': 'patagonia',
  'Tierra del Fuego': 'patagonia',
};

export function regionDe(provincia: string | null | undefined): Region | null {
  return (provincia && REGION_DE_PROVINCIA[provincia]) || null;
}

// ── Efemérides ───────────────────────────────────────────────────────────────

export interface Efemeride {
  mes: number;
  dia: number;
  slug: string;
  nombre: string;
  dominios: string[];
  tags: string[];
}

/** Fechas fijas. Una efeméride empuja su tema dos días antes y dos después. */
export const EFEMERIDES: Efemeride[] = [
  { mes: 1, dia: 26, slug: 'educacion-ambiental', nombre: 'Día de la Educación Ambiental', dominios: ['ciencia', 'comunidad'], tags: [] },
  { mes: 2, dia: 2, slug: 'humedales', nombre: 'Día Mundial de los Humedales', dominios: ['agua_azul'], tags: ['humedal'] },
  { mes: 3, dia: 3, slug: 'vida-silvestre', nombre: 'Día Mundial de la Vida Silvestre', dominios: ['animales'], tags: [] },
  { mes: 3, dia: 21, slug: 'bosques', nombre: 'Día Internacional de los Bosques', dominios: ['plantas'], tags: ['arbol'] },
  { mes: 3, dia: 22, slug: 'agua', nombre: 'Día Mundial del Agua', dominios: ['agua'], tags: [] },
  { mes: 4, dia: 22, slug: 'tierra', nombre: 'Día de la Tierra', dominios: ['aire_suelo', 'plantas'], tags: [] },
  { mes: 4, dia: 29, slug: 'animal', nombre: 'Día del Animal', dominios: ['animales'], tags: ['perro', 'gato'] },
  { mes: 5, dia: 17, slug: 'reciclaje', nombre: 'Día Mundial del Reciclaje', dominios: ['residuos'], tags: ['reciclaje'] },
  { mes: 5, dia: 20, slug: 'abejas', nombre: 'Día Mundial de las Abejas', dominios: ['plantas'], tags: ['polinizadores'] },
  { mes: 5, dia: 22, slug: 'biodiversidad', nombre: 'Día de la Diversidad Biológica', dominios: ['ciencia', 'animales'], tags: [] },
  { mes: 6, dia: 3, slug: 'bicicleta', nombre: 'Día Mundial de la Bicicleta', dominios: ['movilidad'], tags: ['bici'] },
  { mes: 6, dia: 5, slug: 'medio-ambiente', nombre: 'Día Mundial del Medio Ambiente', dominios: ['residuos', 'consumo'], tags: ['plastico'] },
  { mes: 6, dia: 8, slug: 'oceanos', nombre: 'Día Mundial de los Océanos', dominios: ['agua_azul'], tags: [] },
  { mes: 6, dia: 17, slug: 'desertificacion', nombre: 'Día de Lucha contra la Desertificación', dominios: ['aire_suelo'], tags: ['suelo'] },
  { mes: 7, dia: 3, slug: 'sin-bolsas', nombre: 'Día Internacional Libre de Bolsas de Plástico', dominios: ['consumo'], tags: ['bolsa', 'plastico'] },
  { mes: 7, dia: 7, slug: 'suelo-ar', nombre: 'Día Nacional de la Conservación del Suelo', dominios: ['aire_suelo'], tags: ['suelo', 'compost'] },
  { mes: 8, dia: 1, slug: 'pachamama', nombre: 'Día de la Pachamama', dominios: ['aire_suelo', 'plantas'], tags: ['suelo', 'semillas'] },
  { mes: 8, dia: 29, slug: 'arbol', nombre: 'Día del Árbol', dominios: ['plantas'], tags: ['arbol'] },
  { mes: 9, dia: 22, slug: 'sin-auto', nombre: 'Día Mundial sin Auto', dominios: ['movilidad'], tags: [] },
  { mes: 9, dia: 27, slug: 'conciencia-ambiental', nombre: 'Día Nacional de la Conciencia Ambiental', dominios: ['comunidad'], tags: [] },
  { mes: 9, dia: 29, slug: 'desperdicio', nombre: 'Día contra la Pérdida y el Desperdicio de Alimentos', dominios: ['alimentacion'], tags: ['desperdicio'] },
  { mes: 10, dia: 16, slug: 'alimentacion', nombre: 'Día Mundial de la Alimentación', dominios: ['alimentacion'], tags: [] },
  { mes: 10, dia: 21, slug: 'ahorro-energia', nombre: 'Día Mundial del Ahorro de Energía', dominios: ['energia'], tags: [] },
  { mes: 11, dia: 6, slug: 'parques-nacionales', nombre: 'Día de los Parques Nacionales', dominios: ['animales', 'plantas'], tags: ['nativas'] },
  { mes: 11, dia: 30, slug: 'mate', nombre: 'Día Nacional del Mate', dominios: [], tags: ['mate'] },
  { mes: 12, dia: 5, slug: 'suelo', nombre: 'Día Mundial del Suelo', dominios: ['aire_suelo'], tags: ['suelo', 'compost'] },
];

/** La efeméride más cercana a esta fecha, si hay una a dos días o menos. */
export function efemerideDe(fecha: Date | string): (Efemeride & { dias: number }) | null {
  const f = fechaUTC(fecha);
  const anio = f.getUTCFullYear();
  let mejor: (Efemeride & { dias: number; t: number }) | null = null;
  for (const e of EFEMERIDES) {
    for (const a of [anio - 1, anio, anio + 1]) {
      const t = Date.UTC(a, e.mes - 1, e.dia);
      const dias = Math.round((t - f.getTime()) / 86_400_000);
      if (Math.abs(dias) > 2) continue;
      if (!mejor || Math.abs(dias) < Math.abs(mejor.dias) || (Math.abs(dias) === Math.abs(mejor.dias) && t < mejor.t)) {
        mejor = { ...e, dias, t };
      }
    }
  }
  if (!mejor) return null;
  const { t: _t, ...resto } = mejor;
  return resto;
}

// ── Puntos ───────────────────────────────────────────────────────────────────

export type Esfuerzo = 'easy' | 'medium' | 'hard';
export type Impacto = 'low' | 'medium' | 'high';
export type TipoAccion = 'daily' | 'catalog';

/** §6: esfuerzo × impacto, una tabla para el día y otra para el catálogo. */
export const PUNTOS: Record<TipoAccion, Record<Esfuerzo, Record<Impacto, number>>> = {
  daily: {
    easy: { low: 40, medium: 50, high: 60 },
    medium: { low: 60, medium: 80, high: 100 },
    hard: { low: 100, medium: 120, high: 150 },
  },
  catalog: {
    easy: { low: 80, medium: 100, high: 130 },
    medium: { low: 130, medium: 170, high: 220 },
    hard: { low: 220, medium: 300, high: 400 },
  },
};

export function puntosPorRegla(tipo: TipoAccion, esfuerzo: Esfuerzo, impacto: Impacto): number {
  return PUNTOS[tipo][esfuerzo][impacto];
}

/** Lo que suma terminar un camino (además de cada paso). */
export const PUNTOS_CAMINO = 300;

// ── Reglas del día ───────────────────────────────────────────────────────────

export interface Pesos {
  interes: number;
  afinidad: number;
  nueva: number;
  temporada: number;
  efemeride: number;
  contexto: number;
  impacto_medio: number;
  impacto_alto: number;
  ofrecida: number;
  hoy_no: number;
  hecha_reciente: number;
  azar: number;
}

export interface Reglas {
  tamano: number;
  rapidas_min: number;
  rapida_minutos: number;
  larga_minutos: number;
  max_largas: number;
  max_por_dominio: number;
  ventana_dias: number;
  cambios_por_dia: number;
  ya_lo_hago_dias: number;
  hoy_no_dias: number;
  hecha_reciente_dias: number;
  pesos: Pesos;
}

/**
 * Los valores por omisión. La base guarda los mismos en
 * `brote_acciones_reglas()` y deja pisarlos desde el panel
 * (`app_settings.acciones_reglas`); un test compara los dos.
 */
export const REGLAS: Reglas = {
  tamano: 5,
  rapidas_min: 3,
  rapida_minutos: 5,
  larga_minutos: 15,
  max_largas: 1,
  max_por_dominio: 1,
  ventana_dias: 21,
  cambios_por_dia: 3,
  ya_lo_hago_dias: 60,
  hoy_no_dias: 7,
  hecha_reciente_dias: 3,
  pesos: {
    interes: 30,
    afinidad: 15,
    nueva: 20,
    temporada: 12,
    efemeride: 25,
    contexto: 10,
    impacto_medio: 5,
    impacto_alto: 10,
    ofrecida: 25,
    hoy_no: 15,
    hecha_reciente: 15,
    azar: 20,
  },
};

export function mezclarReglas(guardadas: Partial<Reglas> & { pesos?: Partial<Pesos> } | null | undefined): Reglas {
  const g = guardadas ?? {};
  return { ...REGLAS, ...g, pesos: { ...REGLAS.pesos, ...(g.pesos ?? {}) } } as Reglas;
}

// ── ¿Le sirve? ───────────────────────────────────────────────────────────────

/** Lo que una acción declara sobre sí misma (columnas de `activities`). */
export interface AccionReglas {
  id: string;
  type: TipoAccion;
  domain_slug: string;
  impact: Impacto;
  min_rank_tier?: number;
  age_groups: readonly string[];
  minutos: number;
  requiere: readonly string[];
  estaciones: readonly string[];
  regiones: readonly string[];
  dias: 'habil' | 'finde' | null;
  tags: readonly string[];
}

/** Lo que sabemos de la persona hoy. */
export interface PerfilReglas {
  cuenta: TipoCuenta;
  tier: number;
  /** Ya pasado por `contextoEfectivo`. */
  ctx: Record<string, unknown>;
  region: Region | null;
  estacion: Estacion;
  /** 0 = domingo … 6 = sábado. */
  dow: number;
  intereses: readonly string[];
}

export type MotivoNoApta = 'edad' | 'rango' | 'contexto' | 'estacion' | 'region' | 'dia';

/** La misma pregunta que `brote_accion_apta` en la base, con el motivo. */
export function apta(a: AccionReglas, p: PerfilReglas): { ok: true } | { ok: false; motivo: MotivoNoApta } {
  if (!a.age_groups.includes(p.cuenta)) return { ok: false, motivo: 'edad' };
  if ((a.min_rank_tier ?? 1) > p.tier) return { ok: false, motivo: 'rango' };
  if (!contextoTiene(p.ctx, a.requiere)) return { ok: false, motivo: 'contexto' };
  if (a.estaciones.length > 0 && !a.estaciones.includes(p.estacion)) return { ok: false, motivo: 'estacion' };
  if (a.regiones.length > 0 && (!p.region || !a.regiones.includes(p.region))) return { ok: false, motivo: 'region' };
  if (a.dias === 'habil' && (p.dow === 0 || p.dow === 6)) return { ok: false, motivo: 'dia' };
  if (a.dias === 'finde' && p.dow >= 1 && p.dow <= 5) return { ok: false, motivo: 'dia' };
  return { ok: true };
}

// ── Puntaje y motivo ─────────────────────────────────────────────────────────

/** Lo que pasó entre esta persona y esta acción. */
export interface HistorialAccion {
  /** La hizo alguna vez. */
  hecha: boolean;
  /** Días desde la última vez (0 = hoy), o null. */
  diasDesdeUltima: number | null;
  /** Se la ofrecimos en el set dentro de la ventana. */
  ofrecida: boolean;
  /** La cambió por "hoy no" dentro de `hoy_no_dias`. */
  hoyNo: boolean;
}

export type Razon =
  | { r: 'efemeride' }
  | { r: 'temporada'; e: Estacion }
  | { r: 'contexto'; k: string }
  | { r: 'interes'; d: string }
  | { r: 'nueva' }
  | { r: 'impacto' }
  | { r: 'variedad' };

export interface Senales {
  /** Parte (0–1) de sus acciones de 60 días en este tema. */
  afinidad: number;
  efemeride: Efemeride | null;
  /** 0 … pesos.azar, estable por persona y día (en la base: md5). */
  azar: number;
}

function enEfemeride(a: AccionReglas, efe: Efemeride | null): boolean {
  return !!efe && (efe.dominios.includes(a.domain_slug) || a.tags.some((t) => efe.tags.includes(t)));
}

export function puntaje(a: AccionReglas, p: PerfilReglas, h: HistorialAccion, s: Senales, reglas: Reglas = REGLAS): number {
  const w = reglas.pesos;
  let n = 0;
  if (p.intereses.includes(a.domain_slug)) n += w.interes;
  n += Math.round(w.afinidad * Math.min(1, s.afinidad * 3));
  if (!h.hecha) n += w.nueva;
  if (a.estaciones.length > 0) n += w.temporada;
  if (enEfemeride(a, s.efemeride)) n += w.efemeride;
  if (a.requiere.length > 0) n += w.contexto;
  if (a.impact === 'high') n += w.impacto_alto;
  else if (a.impact === 'medium') n += w.impacto_medio;
  if (h.ofrecida) n -= w.ofrecida;
  if (h.hoyNo) n -= w.hoy_no;
  if (h.diasDesdeUltima != null && h.diasDesdeUltima <= reglas.hecha_reciente_dias) n -= w.hecha_reciente;
  return n + s.azar;
}

/** Por qué está en tu día: la señal más fuerte, en este orden. */
export function razon(a: AccionReglas, p: PerfilReglas, h: HistorialAccion, s: Senales): Razon {
  if (enEfemeride(a, s.efemeride)) return { r: 'efemeride' };
  if (a.estaciones.length > 0) return { r: 'temporada', e: p.estacion };
  if (a.requiere.length > 0) return { r: 'contexto', k: a.requiere[0]! };
  if (p.intereses.includes(a.domain_slug)) return { r: 'interes', d: a.domain_slug };
  if (!h.hecha) return { r: 'nueva' };
  if (a.impact === 'high') return { r: 'impacto' };
  return { r: 'variedad' };
}

// ── El día ───────────────────────────────────────────────────────────────────

export interface Candidata {
  id: string;
  /** dominio */
  d: string;
  /** minutos */
  m: number;
  /** nunca la hizo */
  n: boolean;
  /** puntaje */
  s: number;
}

/**
 * §5 · Composición. Las candidatas ya pasaron `apta` y las exclusiones (hecha
 * hoy, descartada, en la rutina). Se recorren por puntaje (empate: id) y se
 * aceptan respetando los topes; si no alcanza, se relajan en orden.
 *
 *   0. Si no hay ninguna nueva y existe una que no sea larga, va primero.
 *   1. Tope por tema + mezcla (rápidas mínimas, largas máximas).
 *   2. Tope por tema 2 + mezcla.
 *   3. Tope por tema 2, sin mezcla.
 *   4. Sin topes.
 */
export function armarDia(
  candidatas: readonly Candidata[],
  reglas: Reglas = REGLAS,
  mantener: readonly Candidata[] = [],
): string[] {
  const orden = [...candidatas].sort((x, y) => y.s - x.s || (x.id < y.id ? -1 : x.id > y.id ? 1 : 0));
  const elegidas: Candidata[] = [];
  const porDominio = new Map<string, number>();
  let rapidas = 0;
  let largas = 0;
  const sumar = (c: Candidata) => {
    elegidas.push(c);
    porDominio.set(c.d, (porDominio.get(c.d) ?? 0) + 1);
    if (c.m <= reglas.rapida_minutos) rapidas++;
    if (c.m > reglas.larga_minutos) largas++;
  };
  // Lo que se mantiene (al cambiar una) cuenta para los topes como cualquier otra.
  for (const c of mantener) sumar(c);

  const ya = (c: Candidata) => elegidas.some((e) => e.id === c.id);

  if (!elegidas.some((e) => e.n) && elegidas.length < reglas.tamano) {
    const nueva = orden.find((c) => c.n && c.m <= reglas.larga_minutos && !ya(c));
    if (nueva) sumar(nueva);
  }

  const pasadas: { maxDom: number; mezcla: boolean }[] = [
    { maxDom: reglas.max_por_dominio, mezcla: true },
    { maxDom: Math.max(reglas.max_por_dominio, 2), mezcla: true },
    { maxDom: Math.max(reglas.max_por_dominio, 2), mezcla: false },
    { maxDom: Number.POSITIVE_INFINITY, mezcla: false },
  ];
  for (const pasada of pasadas) {
    for (const c of orden) {
      if (elegidas.length >= reglas.tamano) break;
      if (ya(c)) continue;
      if ((porDominio.get(c.d) ?? 0) >= pasada.maxDom) continue;
      if (pasada.mezcla) {
        if (c.m > reglas.larga_minutos && largas >= reglas.max_largas) continue;
        if (c.m > reglas.rapida_minutos) {
          const faltan = Math.max(0, reglas.rapidas_min - rapidas);
          const libres = reglas.tamano - elegidas.length;
          if (libres - 1 < faltan) continue;
        }
      }
      sumar(c);
    }
    if (elegidas.length >= reglas.tamano) break;
  }
  return elegidas.map((e) => e.id);
}

// ── Cambiar ──────────────────────────────────────────────────────────────────

export const MOTIVOS_CAMBIO = ['hoy_no', 'no_aplica', 'ya_lo_hago', 'no_me_gusta'] as const;
export type MotivoCambio = (typeof MOTIVOS_CAMBIO)[number];

export const MOTIVO_CAMBIO_ES: Record<MotivoCambio, { titulo: string; detalle: string }> = {
  hoy_no: { titulo: 'Hoy no puedo', detalle: 'Te damos otra. Esta vuelve otro día.' },
  no_aplica: { titulo: 'No aplica a mí', detalle: 'No te la mostramos más.' },
  ya_lo_hago: { titulo: 'Ya lo hago siempre', detalle: 'Genial. Podés sumarla a tu rutina, donde cuenta igual.' },
  no_me_gusta: { titulo: 'No me interesa', detalle: 'No vuelve. Lo podés deshacer en Ajustes.' },
};

/** Los motivos que la sacan para siempre (hasta que la persona lo deshaga). */
export function motivoOculta(m: MotivoCambio): boolean {
  return m === 'no_aplica' || m === 'no_me_gusta';
}

// ── Utilidades de fecha ──────────────────────────────────────────────────────

function fechaUTC(f: Date | string): Date {
  if (typeof f === 'string') {
    const [y, m, d] = f.slice(0, 10).split('-').map(Number);
    return new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1));
  }
  return new Date(Date.UTC(f.getFullYear(), f.getMonth(), f.getDate()));
}

function mesDe(f: Date | string): number {
  return fechaUTC(f).getUTCMonth() + 1;
}
