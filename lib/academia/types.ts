/**
 * Tipos compartidos de la Academia (El Bosque).
 *
 * Espejo de lo que devuelven los RPC de `supabase/migrations/0078_academia_motor.sql`.
 * Nada de esto se inventa del lado del cliente: si un campo no está acá es
 * porque el servidor no lo manda.
 *
 * LO QUE NO EXISTE EN ESTE ARCHIVO, A PROPÓSITO: la respuesta correcta. Ni
 * `clave`, ni `solucion`, ni `explicacion`, ni la fuente. Todo eso llega recién
 * en la respuesta de `academia_answer`, después de contestar, y por eso vive en
 * `RespuestaCorregida` y no en `PasoSesion`. Si algún día aparece un campo de
 * solución en el payload de un paso, es un bug de seguridad, no un tipo faltante.
 */

export type TipoEjercicio =
  | 'microlectura'
  | 'dato_vivo'
  | 'opcion_multiple'
  | 'mito_o_dato'
  | 'ordenar_secuencia'
  | 'clasificar_en_cestos'
  | 'emparejar'
  | 'estimacion_numerica'
  | 'ranking_impacto'
  | 'elegir_la_accion'
  | 'cadena_causal'
  | 'detectar_greenwashing'
  | 'mapa_localizar'
  | 'completar_frase';

/** Los 12 que se corrigen. `microlectura` y `dato_vivo` solo se muestran. */
export const TIPOS_GRADUADOS = [
  'opcion_multiple',
  'mito_o_dato',
  'ordenar_secuencia',
  'clasificar_en_cestos',
  'emparejar',
  'estimacion_numerica',
  'ranking_impacto',
  'elegir_la_accion',
  'cadena_causal',
  'detectar_greenwashing',
  'mapa_localizar',
  'completar_frase',
] as const satisfies readonly TipoEjercicio[];

export type EstadoGajo = 'latente' | 'disponible' | 'en_curso' | 'frondoso' | 'marchito';

/**
 * Un token de una entrega. SIEMPRE `t1`, `t2`… y nunca el id real del ítem: se
 * reetiquetan y se barajan por entrega, así que quien ya vio el ejercicio no
 * puede reconocer la respuesta por el identificador.
 */
export type Token = string;

// ── Payloads por tipo ────────────────────────────────────────────────────────

interface PayloadBase {
  tipo: TipoEjercicio;
  enunciado: string;
  /** Pista opcional que no revela la respuesta. */
  ayuda: string | null;
}

export interface Opcion {
  id: Token;
  texto: string;
  /** Solo en `ranking_impacto`: el dominio para pintar el chip. */
  dominio?: string;
}

export interface PayloadMicrolectura extends PayloadBase {
  tipo: 'microlectura';
  cuerpo: string;
  destacado: string | null;
}

export interface PayloadDatoVivo extends PayloadBase {
  tipo: 'dato_vivo';
  valor: number;
  unidad: string;
  que_significa: string;
}

export interface PayloadOpcionMultiple extends PayloadBase {
  tipo: 'opcion_multiple';
  opciones: Opcion[];
}

export interface PayloadElegirLaAccion extends PayloadBase {
  tipo: 'elegir_la_accion';
  escenario: string;
  opciones: Opcion[];
}

export interface PayloadMitoODato extends PayloadBase {
  tipo: 'mito_o_dato';
  afirmacion: string;
}

export interface PayloadOrdenarSecuencia extends PayloadBase {
  tipo: 'ordenar_secuencia';
  consigna: string;
  fragmentos: Opcion[];
}

export interface PayloadRankingImpacto extends PayloadBase {
  tipo: 'ranking_impacto';
  consigna: string;
  opciones: Opcion[];
}

export interface PayloadCadenaCausal extends PayloadBase {
  tipo: 'cadena_causal';
  fragmentos: Opcion[];
  /** Cuántos de los fragmentos forman la cadena: el resto son señuelos. */
  largo_cadena: number;
}

export interface Cesto {
  id: string;
  nombre: string;
  color: string | null;
}

export interface PayloadClasificarEnCestos extends PayloadBase {
  tipo: 'clasificar_en_cestos';
  cestos: Cesto[];
  fichas: Opcion[];
}

export interface PayloadEmparejar extends PayloadBase {
  tipo: 'emparejar';
  /** Ids estables del ítem: su texto ya está a la vista. */
  izquierda: Opcion[];
  /** Barajada y reetiquetada por entrega. */
  derecha: Opcion[];
}

export interface PayloadEstimacionNumerica extends PayloadBase {
  tipo: 'estimacion_numerica';
  min: number;
  max: number;
  paso: number;
  unidad: string;
  escala: 'lineal' | 'log';
}

export interface PayloadDetectarGreenwashing extends PayloadBase {
  tipo: 'detectar_greenwashing';
  claim: string;
  spans: Opcion[];
}

export interface PayloadMapaLocalizar extends PayloadBase {
  tipo: 'mapa_localizar';
  centro: [number, number];
  zoom: number;
  capa: string;
  /**
   * La versión sin mapa del mismo ejercicio. No es un plan B: es lo que hace
   * que el tipo se pueda completar con teclado y lector de pantalla.
   */
  alternativas: Opcion[];
}

export interface PayloadCompletarFrase extends PayloadBase {
  tipo: 'completar_frase';
  /** Con `{{0}}`, `{{1}}`… donde van los huecos. */
  frase: string;
  banco: Opcion[];
}

export type PayloadEjercicio =
  | PayloadMicrolectura
  | PayloadDatoVivo
  | PayloadOpcionMultiple
  | PayloadElegirLaAccion
  | PayloadMitoODato
  | PayloadOrdenarSecuencia
  | PayloadRankingImpacto
  | PayloadCadenaCausal
  | PayloadClasificarEnCestos
  | PayloadEmparejar
  | PayloadEstimacionNumerica
  | PayloadDetectarGreenwashing
  | PayloadMapaLocalizar
  | PayloadCompletarFrase;

// ── Respuestas que manda el cliente ──────────────────────────────────────────

export type RespuestaEnviada =
  | { elegido: Token }
  | { es_dato: boolean }
  | { orden: Token[] }
  | { cadena: Token[] }
  | { asignacion: Record<Token, string> }
  | { pares: Record<string, Token> }
  | { valor: number }
  | { marcados: Token[] }
  | { region: Token }
  | { huecos: Token[] };

// ── El árbol ─────────────────────────────────────────────────────────────────

export interface GajoDelArbol {
  id: string;
  slug: string;
  titulo_es: string;
  bajada_es: string;
  icono: string | null;
  anillo: number;
  estado: EstadoGajo;
  /** 0..1 — maestría media por retrievability. Es la fuerza, no el avance. */
  progreso: number;
  conceptos: number;
  hojas_total: number;
  hojas_hechas: number;
  /** Solo si está latente: qué falta, con nombre. */
  falta: string | null;
  falta_slug: string | null;
}

export interface RamaDelArbol {
  slug: string;
  nombre_es: string;
  bajada_es: string;
  es_tronco: boolean;
  sort_order: number;
  gajos: GajoDelArbol[];
}

export interface SaviaEstado {
  restante: number;
  max: number;
  base: number;
  extra: number;
  /** Medianoche local, como instante real. */
  reset_at: string;
}

export interface StatsArbol {
  conceptos_frondosos: number;
  conceptos_vistos: number;
  conceptos_totales: number;
  anillo: number;
  anillo_nombre: string | null;
  hojas_completas: number;
  riegos: number;
}

export interface Arbol {
  ok: true;
  anillo: number;
  ramas: RamaDelArbol[];
  stats: StatsArbol;
  siguiente: { gajo: GajoDelArbol; razon: string } | null;
  marchitos: GajoDelArbol[];
  /** null cuando la persona tiene Brote+: la ausencia del medidor ES el beneficio. */
  savia: SaviaEstado | null;
  pro: boolean;
  /**
   * Racha y semillas viajan acá desde 0080. `academia_arbol` ya llamaba a
   * `academia_estado()` para la savia: devolver el resto de esa misma llamada
   * es lo que le permite a la pantalla del bosque hacer UN solo viaje
   * (15-ui-motion.md §1).
   */
  racha: number;
  semillas_hoy: number;
  semillas_tope: number;
  semillas_saldo: number;
}

// ── Un gajo por dentro ───────────────────────────────────────────────────────

export interface HojaDelGajo {
  id: string;
  slug: string;
  titulo_es: string;
  bajada_es: string;
  minutos: number;
  sort_order: number;
  mejor_score: number;
  intentos: number;
  completada: boolean;
  conceptos: string[];
}

export interface Fuente {
  titulo: string;
  organizacion: string;
  url: string;
  publicado: string | null;
}

export interface ConceptoDelGajo {
  slug: string;
  titulo_es: string;
  enunciado_es: string;
  /** maestría × retrievability: lo que se dibuja en el medidor de fuerza. */
  fuerza: number;
  mastery: number;
  fuente: Fuente | null;
}

export interface DetalleGajo {
  ok: true;
  gajo: {
    id: string;
    slug: string;
    titulo_es: string;
    bajada_es: string;
    icono: string | null;
    anillo: number;
    rama_slug: string;
  };
  hojas: HojaDelGajo[];
  conceptos: ConceptoDelGajo[];
}

// ── La sesión ────────────────────────────────────────────────────────────────

export interface PasoSesion {
  orden: number;
  /**
   * null en los pasos de presentación: no se corrigen, así que no tienen fila
   * de entrega y no pueden quedar "sin responder" bloqueando el cierre.
   */
  entrega_id: string | null;
  tipo: TipoEjercicio;
  payload: PayloadEjercicio;
}

export interface Sesion {
  ok: true;
  sesion_id: string;
  tipo: 'hoja' | 'riego';
  hoja: { id: string; slug: string; titulo_es: string; bajada_es: string } | null;
  rama_slug: string;
  pasos: PasoSesion[];
  total: number;
  savia_gastada: number;
  expires_at: string;
}

export interface RespuestaCorregida {
  ok: true;
  correcto: boolean;
  /** 0..1. Los tipos de crédito parcial devuelven algo entre medio. */
  parcial: number;
  /** Llega SIEMPRE, se haya acertado o no: la explicación es el contenido. */
  explicacion: string | null;
  /**
   * La clave, ya traducida a los tokens de ESTA entrega.
   * Array en los tipos de lista; objeto en `emparejar` (izquierda → token) y en
   * `clasificar_en_cestos` (token → cesto); null en los tipos sin colección.
   */
  clave: Token[] | Record<string, string> | null;
  /** Para los tipos sin colección (`mito_o_dato`, `estimacion_numerica`). */
  clave_cruda: unknown;
  /** Si picó una creencia falsa documentada, por qué es tentadora. */
  nota_opcion: string | null;
  misconception: string | null;
  fuerza_concepto: number;
  fuente: Fuente | null;
  /** Un error se re-encola UNA vez al final de la sesión. */
  reencolada: boolean;
  /** Tres seguidas mal: Pip aparece una vez, y solo una. */
  recuperacion: boolean;
}

export interface AccionSugerida {
  id: string;
  slug: string;
  titulo_es: string;
  short_es: string | null;
  domain_slug: string;
  base_points: number;
  icon: string | null;
  impact_water_l: number | null;
  impact_co2_kg: number | null;
  impact_waste_kg: number | null;
  impact_energy_kwh: number | null;
  equivalencia_es: string | null;
}

export interface ConceptoReforzado {
  slug: string;
  titulo_es: string;
  fuerza: number;
}

export interface ResultadoSesion {
  ok: true;
  score: number;
  aprobada: boolean;
  tipo: 'hoja' | 'riego';
  correctas: number;
  total: number;
  acierto_primera: number;
  xp: number;
  semillas: number;
  semillas_balance: number;
  primer_clear: boolean;
  gajo_completo: boolean;
  rama_completa: boolean;
  regado: boolean;
  racha: number;
  racha_sumo: boolean;
  conceptos: ConceptoReforzado[];
  /** null antes que una acción en enfriamiento o fuera de rango. Nunca se inventa. */
  accion: AccionSugerida | null;
  nuevos_titulos: unknown[];
  nuevas_insignias: unknown[];
}

export interface EstadoAcademia {
  ok: true;
  habilitada: boolean;
  pro: boolean;
  savia: SaviaEstado | null;
  semillas_hoy: number;
  semillas_tope: number;
  semillas_saldo: number;
  racha: number;
}

/** Todo RPC puede contestar que no. `error` es un código, `mensaje` es para leer. */
export interface FalloAcademia {
  ok: false;
  error: string;
  mensaje?: string;
  pendientes?: number;
}

export type Resultado<T> = T | FalloAcademia;

export function esFallo<T extends { ok: true }>(r: Resultado<T>): r is FalloAcademia {
  return r.ok === false;
}
