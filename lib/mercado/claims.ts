import { z } from 'zod';

/**
 * Las 16 afirmaciones ambientales del Mercado (referencia/RUBRICA_EVIDENCIA.md).
 *
 * UN SOLO LUGAR, consumido por el formulario (los campos de cada tipo), el
 * validador determinista, el screener de IA (el menú de lo que se puede
 * afirmar) y la UI pública (el texto que lee el usuario). Si esta
 * especificación se duplicara, las copias se desincronizarían y el sistema de
 * evidencia perdería su integridad en silencio.
 *
 * Lo que la base repite a propósito —los rechazos con consecuencia legal, la
 * lista negra, los tres conjuntos SIN_E*— lo compara un test contra
 * `supabase/migrations/0107_mercado.sql`.
 *
 * Nunca hay un campo de texto libre para LA AFIRMACIÓN: no hay dónde escribir
 * "es ecológico". Los campos de texto que existen son calificadores (qué parte,
 * qué material, dónde se recicla) y pasan por la misma lista negra.
 *
 * Relativo y sin alias: lo compila también el runner de tests.
 */

export const CLAIM_KINDS = [
  'organico',
  'reciclable',
  'contenido_reciclado',
  'compostable',
  'biodegradable',
  'libre_de',
  'no_toxico',
  'energia_renovable',
  'materiales_renovables',
  'reduccion_origen',
  'recargable',
  'huella_carbono',
  'bienestar_animal',
  'local_estacional',
  'comercio_justo',
  'certificacion_tercero',
] as const;

export type ClaimKind = (typeof CLAIM_KINDS)[number];
export type Nivel = 'e0' | 'e1' | 'e2' | 'e3' | 'e4';

/** Sin Nivel 1: arrancan en E2 (RUBRICA §7 y §12); `certificacion_tercero` solo existe en E3. */
export const SIN_E1: readonly ClaimKind[] = ['no_toxico', 'huella_carbono', 'certificacion_tercero'];
/** Sin Nivel 2. */
export const SIN_E2: readonly ClaimKind[] = ['certificacion_tercero'];
/** Sin Nivel 3: "no aplica — se queda en E2" (RUBRICA §10 y §11). */
export const SIN_E3: readonly ClaimKind[] = ['reduccion_origen', 'recargable'];

export const MAX_AFIRMACIONES = 5;

// ── Tipos ───────────────────────────────────────────────────────────────────

export type Datos = Record<string, unknown>;

export interface Opcion {
  valor: string;
  etiqueta: string;
}

interface CampoBase {
  clave: string;
  etiqueta: string;
  ayuda?: string;
  opcional?: boolean;
  /** Campo condicional: solo existe (y es obligatorio) si esto da true. */
  mostrarSi?: (d: Datos) => boolean;
}

export type Campo =
  | (CampoBase & { tipo: 'texto'; min?: number; max?: number; placeholder?: string })
  | (CampoBase & { tipo: 'numero'; min: number; max: number; sufijo?: string })
  | (CampoBase & { tipo: 'opcion'; opciones: Opcion[] })
  | (CampoBase & { tipo: 'si_no' })
  | (CampoBase & { tipo: 'meses' });

/** Una certificación del registro (`certifications`). */
export interface CertInfo {
  slug: string;
  nombre: string;
  emisor: string;
  claims: readonly ClaimKind[];
  tiene_numero: boolean;
  vence: boolean;
  activo?: boolean;
}

/** Una afirmación tal como se carga, se guarda o se muestra. */
export interface Afirmacion {
  kind: ClaimKind;
  alcance: string;
  datos: Datos;
  cert_slug?: string | null;
  cert_numero?: string | null;
  /** `YYYY-MM-DD`. */
  cert_vence?: string | null;
  /** Hay un documento de respaldo subido. */
  evidencia?: boolean;
  /** Nombre y emisor de la certificación, para el texto público. */
  cert?: { nombre: string; emisor: string } | null;
}

export type Alcance = { etiqueta: string; placeholder: string } | { desde: string } | { fijo: string };

export interface ClaimSpec {
  nombre: string;
  ayuda: string;
  alcance: Alcance;
  campos: Campo[];
  /** Schema Zod de `datos`: los campos más las reglas propias del tipo. */
  schema: z.ZodType<Datos>;
  e1: (a: Afirmacion) => boolean;
  e2: (a: Afirmacion) => boolean;
  e3: (a: Afirmacion, cert: CertInfo | null, hoy?: string) => boolean;
  textoPublico: (a: Afirmacion, nivel: Nivel) => string;
  /** El término en el texto libre SIN esta afirmación cargada: rechazo. */
  rechazos: RegExp[];
  /** Qué documento la sube a Nivel 2 ("→ sube a Nivel 2"). */
  documento: string;
}

// ── Utilidades ──────────────────────────────────────────────────────────────

const PROVINCIA_ALCANCE = { etiqueta: '¿A qué parte del producto aplica?', placeholder: 'El envase' };

function cap(s: string): string {
  const t = s.trim();
  return t ? t[0]!.toLocaleUpperCase('es-AR') + t.slice(1) : t;
}

function str(d: Datos, k: string): string {
  const v = d[k];
  return typeof v === 'string' ? v.trim() : '';
}

function num(d: Datos, k: string): number | null {
  const v = d[k];
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/** `2027-03-31` → `03/2027`. */
export function mesAnio(fecha: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})/.exec(fecha ?? '');
  return m ? `${m[2]}/${m[1]}` : '';
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre',
  'octubre', 'noviembre', 'diciembre'];

/** [3,4,5,6,7] → "marzo a julio"; [3,5,9] → "marzo, mayo y septiembre". */
export function rangoMeses(meses: unknown): string {
  const ms = Array.isArray(meses)
    ? [...new Set(meses.filter((m): m is number => typeof m === 'number' && m >= 1 && m <= 12))].sort((a, b) => a - b)
    : [];
  if (ms.length === 0) return '';
  if (ms.length === 12) return 'todo el año';
  const contiguos = ms.every((m, i) => i === 0 || m === ms[i - 1]! + 1);
  if (contiguos && ms.length > 2) return `${MESES[ms[0]! - 1]} a ${MESES[ms[ms.length - 1]! - 1]}`;
  const nombres = ms.map((m) => MESES[m - 1]!);
  return nombres.length === 1 ? nombres[0]! : `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`;
}

/** Que el certificado esté vigente hoy (o no venza). */
export function vigente(fecha: string | null | undefined, hoy = hoyISO()): boolean {
  return !!fecha && fecha >= hoy;
}

export function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** " · Certificado por X, Nº N, vigente hasta MM/AAAA". */
function sufijoCert(a: Afirmacion): string {
  if (!a.cert) return '';
  const partes = [`Certificado por ${a.cert.nombre}`];
  if (a.cert_numero) partes.push(`Nº ${a.cert_numero}`);
  if (a.cert_vence) partes.push(`vigente hasta ${mesAnio(a.cert_vence)}`);
  return ` · ${partes.join(', ')}`;
}

// ── Schemas ─────────────────────────────────────────────────────────────────

type Regla = (d: Datos, falla: (campo: string, codigo: string) => void) => void;

function schemaDe(campos: Campo[], regla?: Regla): z.ZodType<Datos> {
  const forma: Record<string, z.ZodTypeAny> = {};
  for (const c of campos) {
    let s: z.ZodTypeAny;
    const cod = `campo_invalido`;
    switch (c.tipo) {
      case 'texto':
        s = z.string({ invalid_type_error: cod, required_error: cod }).trim()
          .min(c.min ?? 2, { message: cod }).max(c.max ?? 160, { message: cod });
        break;
      case 'numero':
        s = z.number({ invalid_type_error: cod, required_error: cod }).int({ message: cod })
          .min(c.min, { message: cod }).max(c.max, { message: cod });
        break;
      case 'opcion': {
        const valores = c.opciones.map((o) => o.valor) as [string, ...string[]];
        s = z.enum(valores, { errorMap: () => ({ message: cod }) });
        break;
      }
      case 'si_no':
        s = z.boolean({ invalid_type_error: cod, required_error: cod });
        break;
      case 'meses':
        s = z.array(z.number().int().min(1).max(12), { invalid_type_error: cod }).min(1, { message: cod });
        break;
    }
    forma[c.clave] = c.opcional || c.mostrarSi ? s.optional() : s;
  }
  return z
    .object(forma)
    .passthrough()
    .superRefine((d, ctx) => {
      const falla = (campo: string, codigo: string) =>
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [campo], message: codigo });
      for (const c of campos) {
        if (c.mostrarSi && c.mostrarSi(d) && !c.opcional) {
          const v = (d as Datos)[c.clave];
          if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) falla(c.clave, 'campo_requerido');
        }
      }
      regla?.(d as Datos, falla);
    }) as unknown as z.ZodType<Datos>;
}

// ── Las 16 ──────────────────────────────────────────────────────────────────

function spec(
  kind: ClaimKind,
  s: Omit<ClaimSpec, 'schema' | 'e1' | 'e2' | 'e3'> & { regla?: Regla },
): ClaimSpec {
  const { regla, ...resto } = s;
  return {
    ...resto,
    schema: schemaDe(s.campos, regla),
    // Los campos ya la hacen específica: E1 es "declarada y calificada".
    e1: () => !SIN_E1.includes(kind),
    e2: (a) => !SIN_E2.includes(kind) && !!a.evidencia,
    e3: (a, cert, hoy = hoyISO()) =>
      !SIN_E3.includes(kind) &&
      !!cert &&
      cert.activo !== false &&
      cert.claims.includes(kind) &&
      (!cert.tiene_numero || !!a.cert_numero?.trim()) &&
      (!cert.vence || vigente(a.cert_vence, hoy)),
  };
}

const DISPONIBILIDAD: Opcion[] = [
  { valor: 'recoleccion_diferenciada_amplia', etiqueta: 'Hay recolección diferenciada amplia' },
  { valor: 'puntos_verdes_ciudad', etiqueta: 'En los puntos verdes de la ciudad' },
  { valor: 'cooperativa_local', etiqueta: 'A través de una cooperativa local' },
  { valor: 'retorno_al_comercio', etiqueta: 'Devolviéndolo al comercio' },
  { valor: 'consultar_en_tu_zona', etiqueta: 'Depende de la zona: hay que consultar' },
];

const FRASE_DISPONIBILIDAD: Record<string, string> = {
  recoleccion_diferenciada_amplia: 'donde haya recolección diferenciada',
  puntos_verdes_ciudad: 'en los puntos verdes de la ciudad',
  cooperativa_local: 'a través de cooperativas de reciclaje locales',
  retorno_al_comercio: 'devolviéndolo al comercio',
  consultar_en_tu_zona: 'según la recolección de cada zona (conviene consultar)',
};

export const CLAIMS: Record<ClaimKind, ClaimSpec> = {
  organico: spec('organico', {
    nombre: 'Orgánico',
    ayuda: 'Un insumo de producción orgánica. En Argentina lo certifica solo una entidad habilitada por SENASA.',
    alcance: { etiqueta: '¿Qué insumo o componente es orgánico?', placeholder: 'Harina de trigo' },
    campos: [
      { clave: 'porcentaje', etiqueta: 'Si es una parte del producto, ¿qué porcentaje?', tipo: 'numero', min: 1, max: 100, sufijo: '%', opcional: true },
    ],
    documento: 'factura o remito de un proveedor certificado',
    // En Argentina "orgánico" está regulado: sin certificación, el texto lo
    // dice. Es el único caso donde la etiqueta de nivel se refuerza (RUBRICA §1).
    textoPublico: (a, nivel) => {
      const p = num(a.datos, 'porcentaje');
      const cuerpo = p && p < 100 ? `${p}% de ${a.alcance.trim()}` : cap(a.alcance);
      return nivel === 'e3'
        ? `${cap(cuerpo)} de producción orgánica${sufijoCert(a)}`
        : `${cap(cuerpo)} de origen orgánico declarado · sin certificación orgánica`;
    },
    rechazos: [/\borg[aá]nic[oa]s?\b/i],
  }),

  reciclable: spec('reciclable', {
    nombre: 'Reciclable',
    ayuda: 'Qué parte se recicla y DÓNDE, en la práctica. En Argentina la recolección es desigual.',
    alcance: PROVINCIA_ALCANCE,
    campos: [
      { clave: 'material', etiqueta: '¿De qué material?', tipo: 'texto', placeholder: 'Papel kraft', min: 2, max: 80 },
      { clave: 'disponibilidad', etiqueta: '¿Dónde se recicla?', tipo: 'opcion', opciones: DISPONIBILIDAD },
    ],
    documento: 'foto del símbolo del material o ficha técnica del envase',
    textoPublico: (a, nivel) =>
      `${cap(a.alcance)} de ${str(a.datos, 'material')}, reciclable ${FRASE_DISPONIBILIDAD[str(a.datos, 'disponibilidad')] ?? ''}`.trim() +
      (nivel === 'e3' ? sufijoCert(a) : ''),
    rechazos: [/\breciclables?\b/i],
  }),

  contenido_reciclado: spec('contenido_reciclado', {
    nombre: 'Contenido reciclado',
    ayuda: 'Qué parte del producto está hecha con material recuperado, y en qué porcentaje.',
    alcance: PROVINCIA_ALCANCE,
    campos: [
      { clave: 'porcentaje', etiqueta: '¿Qué porcentaje?', tipo: 'numero', min: 1, max: 100, sufijo: '%' },
      { clave: 'post_consumo', etiqueta: '¿Es material post-consumo?', tipo: 'si_no', ayuda: 'Recuperado después de que alguien lo usó, no recortes de fábrica.' },
    ],
    documento: 'ficha técnica o declaración del proveedor del material',
    textoPublico: (a, nivel) =>
      `${cap(a.alcance)} con ${num(a.datos, 'porcentaje')}% de contenido reciclado${a.datos.post_consumo === true ? ' post-consumo' : ''}` +
      (nivel === 'e3' ? sufijoCert(a) : ''),
    rechazos: [/\breciclad[oa]s?\b/i],
  }),

  compostable: spec('compostable', {
    nombre: 'Compostable',
    ayuda: 'En compost de casa o solo en una planta industrial: no es lo mismo, y es lo que más se confunde.',
    alcance: PROVINCIA_ALCANCE,
    campos: [
      {
        clave: 'tipo_compostaje', etiqueta: '¿En qué compostaje?', tipo: 'opcion',
        opciones: [
          { valor: 'domiciliario', etiqueta: 'Domiciliario (en casa)' },
          { valor: 'industrial', etiqueta: 'Industrial (en planta, a alta temperatura)' },
        ],
      },
      { clave: 'plazo_meses', etiqueta: '¿En cuántos meses se degrada?', tipo: 'numero', min: 1, max: 60, sufijo: 'meses' },
    ],
    documento: 'ficha técnica del material',
    textoPublico: (a, nivel) => {
      const n = num(a.datos, 'plazo_meses') ?? 0;
      return `${cap(a.alcance)}, compostable en compostaje ${str(a.datos, 'tipo_compostaje')}, se degrada en ${n} ${n === 1 ? 'mes' : 'meses'}` +
        (nivel === 'e3' ? sufijoCert(a) : '');
    },
    rechazos: [/\bcompostables?\b/i],
  }),

  biodegradable: spec('biodegradable', {
    nombre: 'Biodegradable',
    ayuda: 'Se degrada por completo en un plazo razonable: un año como máximo, y en qué condiciones.',
    alcance: PROVINCIA_ALCANCE,
    campos: [
      { clave: 'plazo_meses', etiqueta: '¿En cuántos meses se biodegrada?', tipo: 'numero', min: 1, max: 999, sufijo: 'meses', ayuda: 'Doce como máximo.' },
      { clave: 'condiciones', etiqueta: '¿En qué condiciones?', tipo: 'texto', placeholder: 'Suelo húmedo', min: 4, max: 120 },
    ],
    documento: 'ensayo o ficha técnica del material',
    // El criterio FTC es descomposición completa en un plazo razonable,
    // referencia un año: más de 12 meses se rechaza duro (RUBRICA §5).
    regla: (d, falla) => {
      const p = num(d, 'plazo_meses');
      if (p !== null && p > 12) falla('plazo_meses', 'plazo_mayor_12');
    },
    textoPublico: (a, nivel) =>
      `${cap(a.alcance)}: se biodegrada en ${num(a.datos, 'plazo_meses')} meses en ${str(a.datos, 'condiciones').toLocaleLowerCase('es-AR')}` +
      (nivel === 'e3' ? sufijoCert(a) : ''),
    rechazos: [/\bbiodegradables?\b/i],
  }),

  libre_de: spec('libre_de', {
    nombre: 'Libre de…',
    ayuda: 'Una sustancia concreta, que no se agregó a propósito, y qué la reemplaza.',
    alcance: PROVINCIA_ALCANCE,
    campos: [
      { clave: 'sustancia', etiqueta: '¿Libre de qué sustancia?', tipo: 'texto', placeholder: 'Parabenos', min: 3, max: 60 },
      { clave: 'no_agregada_intencionalmente', etiqueta: 'Confirmo que no se agrega a propósito en ninguna etapa', tipo: 'si_no' },
      { clave: 'sustituto', etiqueta: '¿Qué la reemplaza?', tipo: 'texto', placeholder: 'Alcohol bencílico', min: 3, max: 80, ayuda: 'Si la reemplazaste por algo peor, se tiene que ver.' },
    ],
    documento: 'ficha de composición del producto',
    regla: (d, falla) => {
      if (d.no_agregada_intencionalmente !== true) falla('no_agregada_intencionalmente', 'falta_no_agregada');
      if (esSustanciaGenerica(str(d, 'sustancia'))) falla('sustancia', 'sustancia_generica');
    },
    textoPublico: (a, nivel) =>
      `${cap(a.alcance)}: sin ${str(a.datos, 'sustancia').toLocaleLowerCase('es-AR')} · en su lugar, ${str(a.datos, 'sustituto').toLocaleLowerCase('es-AR')}` +
      (nivel === 'e3' ? sufijoCert(a) : ''),
    rechazos: [/\blibre de\b/i, /\bsin (parabenos|sulfatos|siliconas|ftalatos|bpa|gluten|tacc|lactosa|plomo|cloro|fosfatos)\b/i],
  }),

  no_toxico: spec('no_toxico', {
    nombre: 'No tóxico',
    ayuda: 'Solo con ficha de seguridad o ensayo: esta afirmación no admite Nivel 1.',
    alcance: PROVINCIA_ALCANCE,
    campos: [
      {
        clave: 'para_quien', etiqueta: '¿No tóxico para quién?', tipo: 'opcion',
        opciones: [
          { valor: 'personas', etiqueta: 'Para las personas' },
          { valor: 'ambiente', etiqueta: 'Para el ambiente' },
          { valor: 'ambos', etiqueta: 'Para las personas y el ambiente' },
        ],
      },
      {
        clave: 'respaldo', etiqueta: '¿Con qué documento lo respaldás?', tipo: 'opcion',
        opciones: [
          { valor: 'ficha_seguridad', etiqueta: 'Ficha de seguridad (FDS/MSDS) del fabricante' },
          { valor: 'ensayo', etiqueta: 'Ensayo de laboratorio' },
        ],
      },
    ],
    documento: 'ficha de seguridad (FDS/MSDS) o ensayo',
    textoPublico: (a, nivel) => {
      const quien = { personas: 'las personas', ambiente: 'el ambiente', ambos: 'las personas y el ambiente' }[str(a.datos, 'para_quien')] ?? '';
      const segun = str(a.datos, 'respaldo') === 'ensayo' ? 'un ensayo de laboratorio' : 'la ficha de seguridad del fabricante';
      return `${cap(a.alcance)}: no tóxico para ${quien} según ${segun}` + (nivel === 'e3' ? sufijoCert(a) : '');
    },
    rechazos: [/\bno t[oó]xic[oa]s?\b/i, /\batóxic[oa]\b/i],
  }),

  energia_renovable: spec('energia_renovable', {
    nombre: 'Energía renovable',
    ayuda: 'Casi toda la producción —el 80% de los procesos o más— con una fuente renovable concreta.',
    alcance: { fijo: 'Procesos de producción' },
    campos: [
      {
        clave: 'fuente', etiqueta: '¿Qué fuente?', tipo: 'opcion',
        opciones: [
          { valor: 'solar', etiqueta: 'Solar' },
          { valor: 'eolica', etiqueta: 'Eólica' },
          { valor: 'hidro', etiqueta: 'Hidroeléctrica' },
          { valor: 'biomasa', etiqueta: 'Biomasa' },
          { valor: 'mixta', etiqueta: 'Varias fuentes renovables' },
        ],
      },
      { clave: 'porcentaje_procesos', etiqueta: '¿Qué porcentaje de los procesos?', tipo: 'numero', min: 1, max: 100, sufijo: '%' },
      {
        clave: 'certificados', etiqueta: 'Los certificados de energía renovable', tipo: 'opcion',
        opciones: [
          { valor: 'a_nombre_propio', etiqueta: 'Están a nombre de la empresa' },
          { valor: 'no_tiene', etiqueta: 'No tenemos certificados' },
          { valor: 'vendidos', etiqueta: 'Los vendimos' },
        ],
        ayuda: 'Generar renovable y vender los certificados, y aun así decir que la usás, es engañoso.',
      },
    ],
    documento: 'factura del proveedor de energía o foto de la instalación',
    regla: (d, falla) => {
      const p = num(d, 'porcentaje_procesos');
      if (p !== null && p < 80) falla('porcentaje_procesos', 'porcentaje_menor_80');
      if (d.certificados === 'vendidos') falla('certificados', 'certificados_vendidos');
    },
    textoPublico: (a, nivel) => {
      const fuente = { solar: 'solar', eolica: 'eólica', hidro: 'hidroeléctrica', biomasa: 'de biomasa', mixta: 'renovable de varias fuentes' }[str(a.datos, 'fuente')] ?? '';
      return `Producido con energía ${fuente} (${num(a.datos, 'porcentaje_procesos')}% de los procesos)` + (nivel === 'e3' ? sufijoCert(a) : '');
    },
    rechazos: [/\benerg[ií]a (solar|renovable|e[oó]lica|limpia|verde)\b/i],
  }),

  materiales_renovables: spec('materiales_renovables', {
    nombre: 'Materiales renovables',
    ayuda: 'Qué material, en qué proporción, y por qué se regenera.',
    alcance: { desde: 'material' },
    campos: [
      { clave: 'material', etiqueta: '¿Qué material?', tipo: 'texto', placeholder: 'Madera de pino de forestación', min: 3, max: 80 },
      { clave: 'porcentaje', etiqueta: '¿Qué porcentaje del producto?', tipo: 'numero', min: 1, max: 100, sufijo: '%' },
      { clave: 'por_que_renovable', etiqueta: '¿Por qué es renovable?', tipo: 'texto', placeholder: 'Viene de plantaciones que se replantan', min: 10, max: 160 },
    ],
    documento: 'ficha del material o del proveedor',
    textoPublico: (a, nivel) =>
      `${cap(str(a.datos, 'material'))}, ${num(a.datos, 'porcentaje')}% del producto · ${str(a.datos, 'por_que_renovable')}` +
      (nivel === 'e3' ? sufijoCert(a) : ''),
    rechazos: [/\bmateriales? renovables?\b/i],
  }),

  reduccion_origen: spec('reduccion_origen', {
    nombre: 'Reducción en origen',
    ayuda: 'Cuánto menos de qué, y comparado con QUÉ. Sin base de comparación no se puede afirmar.',
    alcance: { desde: 'que_se_redujo' },
    campos: [
      { clave: 'que_se_redujo', etiqueta: '¿Qué se redujo?', tipo: 'texto', placeholder: 'Plástico', min: 3, max: 60 },
      { clave: 'porcentaje', etiqueta: '¿En qué porcentaje?', tipo: 'numero', min: 1, max: 100, sufijo: '%' },
      {
        clave: 'comparado_con', etiqueta: '¿Comparado con qué?', tipo: 'opcion',
        opciones: [
          { valor: 'producto_anterior', etiqueta: 'Nuestro producto anterior' },
          { valor: 'estandar_categoria', etiqueta: 'El estándar de la categoría' },
          { valor: 'otro', etiqueta: 'Otra cosa' },
        ],
      },
      { clave: 'comparado_con_otro', etiqueta: '¿Con qué, exactamente?', tipo: 'texto', min: 3, max: 80, mostrarSi: (d) => d.comparado_con === 'otro' },
    ],
    documento: 'la especificación anterior y la actual',
    textoPublico: (a) => {
      const contra = {
        producto_anterior: 'nuestro producto anterior',
        estandar_categoria: 'el estándar de la categoría',
        otro: str(a.datos, 'comparado_con_otro'),
      }[str(a.datos, 'comparado_con')] ?? '';
      return `${num(a.datos, 'porcentaje')}% menos ${str(a.datos, 'que_se_redujo').toLocaleLowerCase('es-AR')} que ${contra}`;
    },
    rechazos: [/\b\d+ ?% menos\b/i, /\bmenos pl[aá]stico\b/i],
  }),

  recargable: spec('recargable', {
    nombre: 'Recargable',
    ayuda: 'Cómo se recarga y dónde. Sin las dos cosas, "recargable" no significa nada.',
    alcance: { etiqueta: '¿Qué se recarga?', placeholder: 'El envase' },
    campos: [
      { clave: 'mecanismo_recarga', etiqueta: '¿Cómo se recarga?', tipo: 'texto', placeholder: 'Con repuesto en bolsa o a granel', min: 5, max: 120 },
      { clave: 'donde_se_recarga', etiqueta: '¿Dónde?', tipo: 'texto', placeholder: 'En nuestro local de Vicente López y por envío', min: 3, max: 120 },
    ],
    documento: 'foto del sistema de recarga o del punto de venta a granel',
    textoPublico: (a) =>
      `${cap(a.alcance)} recargable: ${str(a.datos, 'mecanismo_recarga').toLocaleLowerCase('es-AR')} · ${str(a.datos, 'donde_se_recarga')}`,
    rechazos: [/\brecargables?\b/i],
  }),

  huella_carbono: spec('huella_carbono', {
    nombre: 'Huella de carbono',
    ayuda: 'Medida, reducida o compensada, con metodología. Arranca en Nivel 2: sin informe no hay afirmación.',
    alcance: { etiqueta: '¿Qué alcances cubre?', placeholder: 'Alcances 1 y 2' },
    campos: [
      {
        clave: 'tipo', etiqueta: '¿Qué afirmás?', tipo: 'opcion',
        opciones: [
          { valor: 'medida', etiqueta: 'Que la medimos' },
          { valor: 'reducida', etiqueta: 'Que la redujimos' },
          { valor: 'compensada', etiqueta: 'Que la compensamos' },
        ],
      },
      { clave: 'metodologia', etiqueta: '¿Con qué metodología?', tipo: 'texto', placeholder: 'GHG Protocol', min: 3, max: 80 },
      { clave: 'verificador', etiqueta: '¿Quién la verificó?', tipo: 'texto', min: 3, max: 80, opcional: true, ayuda: 'Obligatorio si la compensaste.' },
      { clave: 'registro', etiqueta: 'Registro de la compensación', tipo: 'texto', min: 3, max: 120, mostrarSi: (d) => d.tipo === 'compensada', ayuda: 'Dónde se puede identificar el crédito de carbono.' },
      { clave: 'no_exigido_por_ley', etiqueta: 'Confirmo que no compenso algo que ya me exige la ley', tipo: 'si_no', mostrarSi: (d) => d.tipo === 'compensada' },
    ],
    documento: 'informe de cálculo con la metodología citada',
    // "Carbono neutral" es la afirmación de mayor riesgo del catálogo: sin
    // verificación de tercero, rechazo. Sin excepciones (RUBRICA §12).
    regla: (d, falla) => {
      if (d.tipo === 'compensada') {
        if (str(d, 'verificador').length < 3) falla('verificador', 'falta_verificador');
        if (d.no_exigido_por_ley !== true) falla('no_exigido_por_ley', 'compensacion_exigida');
      }
    },
    textoPublico: (a, nivel) => {
      const verif = str(a.datos, 'verificador');
      return `Huella de carbono ${str(a.datos, 'tipo')} según ${str(a.datos, 'metodologia')}, ${a.alcance.trim().toLocaleLowerCase('es-AR')}` +
        (verif ? `, verificada por ${verif}` : '') + (nivel === 'e3' ? sufijoCert(a) : '');
    },
    rechazos: [/\bhuella de carbono\b/i, /\bco2\b/i, /\bcompensad[oa]s? en carbono\b/i],
  }),

  bienestar_animal: spec('bienestar_animal', {
    nombre: 'Bienestar animal',
    ayuda: 'Sin testeo, vegano, pastoreo o libre de jaulas. En "sin testeo", si es del producto o también de los ingredientes.',
    alcance: PROVINCIA_ALCANCE,
    campos: [
      {
        clave: 'tipo', etiqueta: '¿Qué afirmás?', tipo: 'opcion',
        opciones: [
          { valor: 'sin_testeo', etiqueta: 'Sin testeo en animales' },
          { valor: 'vegano', etiqueta: 'Vegano' },
          { valor: 'pastoreo', etiqueta: 'Animales de pastoreo' },
          { valor: 'libre_de_jaulas', etiqueta: 'Animales libres de jaulas' },
        ],
      },
      {
        clave: 'sin_testeo_alcance', etiqueta: '¿Sin testeo de qué?', tipo: 'opcion', mostrarSi: (d) => d.tipo === 'sin_testeo',
        opciones: [
          { valor: 'producto_terminado', etiqueta: 'Del producto terminado' },
          { valor: 'producto_e_ingredientes', etiqueta: 'Del producto terminado y de los ingredientes' },
        ],
      },
    ],
    documento: 'declaración de los proveedores o política escrita de la empresa',
    textoPublico: (a, nivel) => {
      const tipo = str(a.datos, 'tipo');
      const base =
        tipo === 'sin_testeo'
          ? `Sin testeo en animales, ${str(a.datos, 'sin_testeo_alcance') === 'producto_e_ingredientes' ? 'producto terminado e ingredientes' : 'producto terminado'}`
          : tipo === 'vegano'
            ? `${cap(a.alcance)}: vegano, sin ingredientes de origen animal`
            : tipo === 'pastoreo'
              ? `${cap(a.alcance)} de animales de pastoreo`
              : `${cap(a.alcance)} de animales libres de jaulas`;
      return base + (nivel === 'e3' ? sufijoCert(a) : '');
    },
    rechazos: [/\bcruelty[- ]?free\b/i, /\bsin testeo\b/i, /\blibre de crueldad\b/i, /\bveganos?\b/i, /\bveganas?\b/i],
  }),

  local_estacional: spec('local_estacional', {
    nombre: 'Local y de estación',
    ayuda: 'De dónde viene, a qué distancia, y en qué meses si es de estación.',
    alcance: { desde: 'origen' },
    campos: [
      { clave: 'origen', etiqueta: '¿Dónde se produce? (localidad)', tipo: 'texto', placeholder: 'Mar del Plata', min: 3, max: 80 },
      { clave: 'distancia_km', etiqueta: 'Distancia aproximada hasta tu punto de venta', tipo: 'numero', min: 0, max: 5000, sufijo: 'km', opcional: true },
      { clave: 'de_estacion', etiqueta: '¿Es de estación?', tipo: 'si_no', opcional: true },
      { clave: 'meses', etiqueta: '¿En qué meses?', tipo: 'meses', mostrarSi: (d) => d.de_estacion === true },
    ],
    documento: 'remito, factura del proveedor o foto del establecimiento',
    textoPublico: (a, nivel) => {
      const km = num(a.datos, 'distancia_km');
      const estacion = a.datos.de_estacion === true ? ` · De estación: ${rangoMeses(a.datos.meses)}` : '';
      return `Producido en ${str(a.datos, 'origen')}${km !== null ? `, a ${km} km` : ''}${estacion}` + (nivel === 'e3' ? sufijoCert(a) : '');
    },
    rechazos: [/\b(producto|producci[oó]n) local\b/i, /\bde estaci[oó]n\b/i, /\bkm ?0\b/i, /\bkil[oó]metro cero\b/i],
  }),

  comercio_justo: spec('comercio_justo', {
    nombre: 'Comercio justo',
    ayuda: 'Qué tipo de relación: precio justo, cooperativa, economía social o certificado.',
    alcance: PROVINCIA_ALCANCE,
    campos: [
      {
        clave: 'tipo', etiqueta: '¿Qué tipo de relación?', tipo: 'opcion',
        opciones: [
          { valor: 'precio_justo', etiqueta: 'Precio justo acordado con los productores' },
          { valor: 'cooperativa', etiqueta: 'Lo elabora una cooperativa' },
          { valor: 'economia_social', etiqueta: 'Lo elabora una organización de la economía social' },
          { valor: 'certificado', etiqueta: 'Comercio justo certificado' },
        ],
      },
      { clave: 'organizacion', etiqueta: '¿Qué organización?', tipo: 'texto', min: 3, max: 80, mostrarSi: (d) => d.tipo === 'cooperativa' || d.tipo === 'economia_social' },
      { clave: 'localidad', etiqueta: '¿De dónde?', tipo: 'texto', min: 3, max: 80, opcional: true },
    ],
    documento: 'documentación de la relación comercial o de la cooperativa',
    textoPublico: (a, nivel) => {
      const tipo = str(a.datos, 'tipo');
      const loc = str(a.datos, 'localidad');
      const base =
        tipo === 'cooperativa'
          ? `Elaborado por la cooperativa ${str(a.datos, 'organizacion')}${loc ? `, ${loc}` : ''}`
          : tipo === 'economia_social'
            ? `Elaborado por ${str(a.datos, 'organizacion')}, de la economía social${loc ? `, ${loc}` : ''}`
            : tipo === 'precio_justo'
              ? `${cap(a.alcance)}: comprado a sus productores a un precio acordado con ellos`
              : `${cap(a.alcance)}: comercio justo`;
      return base + (nivel === 'e3' ? sufijoCert(a) : '');
    },
    rechazos: [/\bcomercio justo\b/i, /\bfair ?trade\b/i],
  }),

  certificacion_tercero: spec('certificacion_tercero', {
    nombre: 'Certificación de tercero',
    ayuda: 'Una certificación del registro que no encaja en las otras. El alcance es todo: sobre qué certifica.',
    alcance: { etiqueta: '¿Qué certifica, exactamente?', placeholder: 'Sistema de gestión ambiental de la planta de Tandil' },
    campos: [],
    documento: 'el certificado',
    // El texto público SIEMPRE incluye el alcance: una ISO 14001 certifica un
    // sistema de gestión, no que un producto sea ecológico (RUBRICA §16).
    textoPublico: (a) =>
      [a.cert?.nombre, a.cert?.emisor, a.cert_numero ? `Nº ${a.cert_numero}` : '', a.cert_vence ? `vigente hasta ${mesAnio(a.cert_vence)}` : '',
        `Alcance: ${a.alcance.trim()}`]
        .filter(Boolean)
        .join(' · '),
    rechazos: [],
  }),
};

// ── La lista negra global ───────────────────────────────────────────────────

/**
 * Se rechaza en el validador determinista, en CUALQUIER campo de texto de un
 * listado (RUBRICA, lista negra global). Mismas palabras que
 * `brote_texto_prohibido()` en la base; un test lo comprueba.
 */
export const LISTA_NEGRA = {
  /** Absolutas sin sustento. */
  absolutos: [
    '100% ecologico', 'totalmente natural', 'no contamina', 'impacto cero', 'completamente sustentable',
    'amigable con el planeta', 'el mas ecologico', 'producto verde', 'eco friendly', 'biodegradable al 100%',
    'carbono neutral', 'carbono neutro', 'neutro en carbono',
  ],
  /** Afirmaciones de salud: competencia de ANMAT. Se rechazan tenga la certificación que tenga. */
  salud: [
    'cura', 'previene', 'trata', 'sana', 'desintoxica', 'detox', 'elimina toxinas', 'refuerza las defensas',
    'fortalece el sistema inmune', 'adelgaza', 'antitumoral', 'antiviral', 'sin efectos secundarios',
  ],
  /** Vagas: NO se rechazan, se marcan para el revisor (a veces son parte del nombre). */
  vagos: ['natural', 'sustentable', 'consciente', 'responsable', 'limpio', 'puro', 'verde'],
} as const;

/** Minúsculas, sin acentos, solo letras, números y %: igual que la base. */
export function normalizarTexto(s: string): string {
  const t = ` ${s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9%]+/g, ' ')
    .trim()} `;
  // "Se trata de" no es "trata" (tratar una dolencia).
  return t.replace(/ se trata del? /g, ' ');
}

/** La primera frase absoluta o de salud que aparezca, o null. */
export function buscarProhibido(texto: string): string | null {
  const t = normalizarTexto(texto);
  for (const termino of [...LISTA_NEGRA.absolutos, ...LISTA_NEGRA.salud]) {
    if (t.includes(` ${termino} `)) return termino;
  }
  return null;
}

/** Los términos vagos que aparecen, para el revisor. */
export function buscarVagos(texto: string): string[] {
  const t = normalizarTexto(texto);
  return LISTA_NEGRA.vagos.filter((v) => t.includes(` ${v} `) || t.includes(` ${v}s `) || t.includes(` ${v}a `));
}

// ── `libre_de`: sustancias genéricas e irrelevantes ─────────────────────────

/** "Libre de químicos" no dice nada: todo es químico. */
export const SUSTANCIAS_GENERICAS = [
  'quimicos', 'productos quimicos', 'sustancias quimicas', 'toxicos', 'toxinas', 'sustancias toxicas',
  'sustancias nocivas', 'contaminantes', 'venenos', 'cosas raras', 'aditivos quimicos', 'porquerias',
];

export function esSustanciaGenerica(s: string): boolean {
  const t = normalizarTexto(s).trim();
  return SUSTANCIAS_GENERICAS.includes(t) || SUSTANCIAS_GENERICAS.includes(t.replace(/^los? |^las? /, ''));
}

/**
 * Pares categoría → sustancia que NUNCA se usa ahí: afirmarla es técnicamente
 * cierto y completamente engañoso ("agua mineral sin gluten", RUBRICA §6). Los
 * CFC están prohibidos en todo el mundo (Protocolo de Montreal): "libre de CFC"
 * es el ejemplo de manual de afirmación vacía en cualquier categoría.
 */
export const SUSTANCIAS_IRRELEVANTES: Record<string, readonly string[]> = {
  '*': ['cfc', 'cfcs', 'clorofluorocarbonos', 'freon'],
  'limpieza-hogar': ['gluten', 'tacc', 'lactosa', 'colesterol', 'azucar', 'cafeina', 'grasas trans'],
  indumentaria: ['gluten', 'tacc', 'lactosa', 'colesterol', 'azucar', 'cafeina', 'grasas trans', 'sodio'],
  'hogar-y-deco': ['gluten', 'tacc', 'lactosa', 'colesterol', 'azucar', 'grasas trans'],
  movilidad: ['gluten', 'tacc', 'lactosa', 'colesterol', 'azucar', 'parabenos'],
  'servicios-profesionales': ['gluten', 'tacc', 'lactosa', 'colesterol', 'azucar'],
  'reparacion-y-reuso': ['gluten', 'tacc', 'lactosa', 'colesterol'],
  'jardin-y-huerta': ['colesterol', 'grasas trans', 'cafeina'],
  'cuidado-personal': ['colesterol', 'grasas trans'],
};

export function esSustanciaIrrelevante(sustancia: string, categoria: string | null | undefined): boolean {
  const t = normalizarTexto(sustancia).trim();
  const lista = [...SUSTANCIAS_IRRELEVANTES['*']!, ...(categoria ? SUSTANCIAS_IRRELEVANTES[categoria] ?? [] : [])];
  return lista.some((x) => t === x || t.startsWith(`${x} `) || t.endsWith(` ${x}`));
}

// ── Validación de una afirmación ────────────────────────────────────────────

export interface ErrorAfirmacion {
  campo: string;
  codigo: string;
}

/** Texto de cada código, para el formulario. Los mismos códigos que la base. */
export const MENSAJES: Record<string, string> = {
  campo_invalido: 'Revisá este dato.',
  campo_requerido: 'Completá este dato.',
  falta_alcance: 'Decí a qué parte del producto aplica.',
  plazo_mayor_12: 'Biodegradable exige hacerlo en 12 meses o menos. Si tarda más, no se puede afirmar.',
  porcentaje_menor_80: 'Hace falta que al menos el 80% de los procesos usen esa energía.',
  certificados_vendidos: 'Si vendiste los certificados, no podés decir que usás esa energía.',
  falta_no_agregada: 'Tenés que confirmar que no se agrega a propósito.',
  sustancia_generica: 'Nombrá una sustancia concreta: "químicos" o "tóxicos" no dicen nada.',
  sustancia_irrelevante: 'Esa sustancia nunca se usa en esta categoría: afirmarlo confunde más de lo que informa.',
  falta_documento: 'Esta afirmación necesita un documento: no admite Nivel 1.',
  falta_verificador: 'Una compensación de carbono necesita verificación de un tercero.',
  compensacion_exigida: 'Confirmá que no compensás algo que ya te exige la ley.',
  falta_certificacion: 'Elegí la certificación del registro.',
  cert_desconocida: 'Esa certificación no está en el registro.',
  cert_no_habilita: 'Esa certificación no respalda este tipo de afirmación.',
  falta_numero: 'Esa certificación tiene número: cargalo.',
  falta_vencimiento: 'Esa certificación vence: cargá la fecha.',
  cert_vencida: 'Esa certificación está vencida.',
  texto_prohibido: 'Hay una frase que no se puede publicar.',
};

/**
 * Valida una afirmación completa. `certs` es el registro (para saber si la
 * certificación elegida existe y habilita este tipo). Devuelve [] si está bien.
 */
export function validarAfirmacion(
  a: Afirmacion,
  opciones: { categoria?: string | null; certs?: readonly CertInfo[]; hoy?: string } = {},
): ErrorAfirmacion[] {
  const s = CLAIMS[a.kind];
  if (!s) return [{ campo: 'kind', codigo: 'campo_invalido' }];
  const errores: ErrorAfirmacion[] = [];
  const hoy = opciones.hoy ?? hoyISO();

  if (alcanceDe(a.kind, a.alcance, a.datos).trim().length < 3) errores.push({ campo: 'alcance', codigo: 'falta_alcance' });

  const r = s.schema.safeParse(a.datos);
  if (!r.success) {
    for (const i of r.error.issues) {
      errores.push({ campo: String(i.path[0] ?? 'datos'), codigo: i.message.includes(' ') ? 'campo_invalido' : i.message });
    }
  }

  if (a.kind === 'libre_de' && esSustanciaIrrelevante(str(a.datos, 'sustancia'), opciones.categoria)) {
    errores.push({ campo: 'sustancia', codigo: 'sustancia_irrelevante' });
  }

  // Sin E1: sin documento (o certificación) no hay afirmación.
  if ((a.kind === 'no_toxico' || a.kind === 'huella_carbono') && !a.evidencia && !a.cert_slug) {
    errores.push({ campo: 'evidencia', codigo: 'falta_documento' });
  }

  if (a.cert_slug) {
    const cert = opciones.certs?.find((c) => c.slug === a.cert_slug && c.activo !== false);
    if (!cert) errores.push({ campo: 'cert_slug', codigo: 'cert_desconocida' });
    else {
      if (!cert.claims.includes(a.kind)) errores.push({ campo: 'cert_slug', codigo: 'cert_no_habilita' });
      if (cert.tiene_numero && !a.cert_numero?.trim()) errores.push({ campo: 'cert_numero', codigo: 'falta_numero' });
      if (cert.vence && !a.cert_vence) errores.push({ campo: 'cert_vence', codigo: 'falta_vencimiento' });
    }
  }
  if (a.kind === 'certificacion_tercero') {
    if (!a.cert_slug) errores.push({ campo: 'cert_slug', codigo: 'falta_certificacion' });
    else if (a.cert_vence && !vigente(a.cert_vence, hoy)) errores.push({ campo: 'cert_vence', codigo: 'cert_vencida' });
  }
  if (a.kind === 'comercio_justo' && a.datos.tipo === 'certificado' && !a.cert_slug) {
    errores.push({ campo: 'cert_slug', codigo: 'falta_certificacion' });
  }

  // La lista negra mira también los calificadores: "cura" en el alcance es
  // tan afirmación de salud como en la descripción.
  const textos = [a.alcance, ...Object.values(a.datos).filter((v): v is string => typeof v === 'string')].join(' ');
  if (buscarProhibido(textos)) errores.push({ campo: 'alcance', codigo: 'texto_prohibido' });

  return errores;
}

/** El alcance efectivo, según cómo lo define el tipo. */
export function alcanceDe(kind: ClaimKind, alcance: string, datos: Datos): string {
  const a = CLAIMS[kind].alcance;
  if ('fijo' in a) return a.fijo;
  if ('desde' in a) return str(datos, a.desde);
  return alcance;
}

/** Los tipos cuyo término aparece en el texto sin estar cargados. */
export function terminosSinAfirmacion(
  texto: string,
  cargadas: readonly { kind: ClaimKind; cert_slug?: string | null }[],
): { kind: ClaimKind; termino: string }[] {
  const tipos = new Set(cargadas.map((c) => c.kind));
  const conCert = cargadas.some((c) => !!c.cert_slug);
  const faltan: { kind: ClaimKind; termino: string }[] = [];
  for (const kind of CLAIM_KINDS) {
    if (tipos.has(kind)) continue;
    for (const re of CLAIMS[kind].rechazos) {
      const m = re.exec(texto);
      if (m) {
        faltan.push({ kind, termino: m[0] });
        break;
      }
    }
  }
  // "Certificado" en el texto sin ninguna afirmación con certificación.
  const cert = /\bcertificad[oa]s?\b|\bcertificaci[oó]n\b/i.exec(texto);
  if (cert && !conCert) faltan.push({ kind: 'certificacion_tercero', termino: cert[0] });
  return faltan;
}
