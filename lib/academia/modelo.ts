/**
 * El Árbol de la Academia: los tipos de lo que devuelven los RPC de
 * `supabase/migrations/0111_academia_arbol_motor.sql`.
 *
 * Jerarquía: Árbol → Rama → Unidad → Sesión → Paso.
 *
 * LO QUE NO EXISTE ACÁ, A PROPÓSITO: la respuesta correcta. Un `Paso` trae su
 * payload barajado y reetiquetado, y nada más. La clave, la explicación y los
 * valores de un ranking llegan en `Correccion`, que el servidor devuelve
 * DESPUÉS de responder. Si alguna vez aparece un campo de solución en un
 * payload, es un bug de seguridad, no un tipo que falta.
 */

// ── Pasos ────────────────────────────────────────────────────────────────────

export type TipoPaso =
  | 'teoria'
  | 'ejemplo'
  | 'opcion'
  | 'multiple'
  | 'vf'
  | 'ordenar'
  | 'ranking'
  | 'cadena'
  | 'clasificar'
  | 'emparejar'
  | 'completar'
  | 'numero'
  | 'estimar'
  | 'detectar';

export const TIPOS_PRESENTACION: readonly TipoPaso[] = ['teoria', 'ejemplo'];

/** Una ficha tocable. Su id es un token de ESTA entrega (`t1`, `t2`…). */
export interface Ficha {
  id: string;
  texto: string;
}

/** Un gráfico chico que acompaña a una pregunta. */
export type Datos =
  | { tipo: 'barras'; titulo: string; unidad: string; filas: { etiqueta: string; valor: number }[]; nota?: string }
  | { tipo: 'tabla'; titulo: string; columnas: string[]; filas: string[][]; nota?: string };

interface Adjuntos {
  /** Un caso: el texto que da contexto a la pregunta. */
  contexto?: string;
  datos?: Datos;
  ayuda?: string;
}

export interface PayloadTeoria {
  tipo: 'teoria';
  titulo: string;
  cuerpo: string[];
  destacado?: { valor: string; texto: string };
  lista?: string[];
  nota?: string;
  datos?: Datos;
}

export interface PayloadEjemplo {
  tipo: 'ejemplo';
  titulo: string;
  planteo: string;
  pasos: string[];
  resultado: string;
  datos?: Datos;
}

export interface PayloadOpcion extends Adjuntos {
  tipo: 'opcion';
  enunciado: string;
  opciones: Ficha[];
}

export interface PayloadMultiple extends Adjuntos {
  tipo: 'multiple';
  enunciado: string;
  opciones: Ficha[];
}

export interface PayloadVF extends Adjuntos {
  tipo: 'vf';
  enunciado: string;
  afirmacion: string;
  /** Si viene, además de verdadero/falso hay que elegir por qué. */
  razones?: Ficha[];
}

export interface PayloadOrden extends Adjuntos {
  tipo: 'ordenar' | 'ranking';
  enunciado: string;
  items: Ficha[];
  extremos?: [string, string];
}

export interface PayloadCadena extends Adjuntos {
  tipo: 'cadena';
  enunciado: string;
  items: Ficha[];
  /** Cuántos eslabones tiene la cadena: el resto son señuelos. */
  largo: number;
  extremos?: [string, string];
}

export interface PayloadClasificar extends Adjuntos {
  tipo: 'clasificar';
  enunciado: string;
  grupos: { id: string; nombre: string }[];
  items: Ficha[];
}

export interface PayloadEmparejar extends Adjuntos {
  tipo: 'emparejar';
  enunciado: string;
  /** Ids estables: su texto ya está a la vista y no revela nada. */
  izquierda: Ficha[];
  /** Barajada y reetiquetada por entrega. */
  derecha: Ficha[];
}

export interface PayloadCompletar extends Adjuntos {
  tipo: 'completar';
  enunciado: string;
  /** Con `{{0}}`, `{{1}}`… donde van los huecos. */
  texto: string;
  banco: Ficha[];
}

export interface PayloadNumero extends Adjuntos {
  tipo: 'numero';
  enunciado: string;
  unidad: string;
  decimales: number;
}

export interface PayloadEstimar extends Adjuntos {
  tipo: 'estimar';
  enunciado: string;
  min: number;
  max: number;
  paso: number;
  unidad: string;
  escala: 'lineal' | 'log';
}

export interface PayloadDetectar extends Adjuntos {
  tipo: 'detectar';
  enunciado: string;
  /** En orden: juntos arman el texto. */
  segmentos: Ficha[];
}

export type Payload =
  | PayloadTeoria
  | PayloadEjemplo
  | PayloadOpcion
  | PayloadMultiple
  | PayloadVF
  | PayloadOrden
  | PayloadCadena
  | PayloadClasificar
  | PayloadEmparejar
  | PayloadCompletar
  | PayloadNumero
  | PayloadEstimar
  | PayloadDetectar;

export type PayloadGraduable = Exclude<Payload, PayloadTeoria | PayloadEjemplo>;

// ── Respuestas ───────────────────────────────────────────────────────────────

export type Respuesta =
  | { elegido: string }
  | { marcados: string[] }
  | { valor: boolean; razon?: string }
  | { orden: string[] }
  | { asignacion: Record<string, string> }
  | { pares: Record<string, string> }
  | { huecos: string[] }
  | { valor: number };

export interface Correccion {
  correcto: boolean;
  /** 0..1: los tipos de crédito parcial devuelven algo entre medio. */
  parcial: number;
  /** Llega siempre, se haya acertado o no: la explicación es el contenido. */
  explicacion: string | null;
  /**
   * Lo correcto en tokens de esta entrega. Array en los tipos de lista;
   * objeto en `emparejar` (izquierda → token) y `clasificar` (token → grupo).
   */
  clave: string[] | Record<string, string> | null;
  /** Para `vf`, `numero` y `estimar`. */
  clave_cruda: { valor: boolean | number; unidad?: string } | null;
  /** Lo que solo se muestra después: los valores reales de un ranking. */
  revela: Record<string, string> | null;
  /** Por qué tentaba la opción elegida, si el contenido lo explica. */
  nota: string | null;
  fuerza?: number;
  /** El error vuelve UNA vez al final de la sesión. */
  reencolada: boolean;
  /** Tres seguidas mal: Pip aparece, una vez. */
  recuperacion: boolean;
}

// ── La sesión ────────────────────────────────────────────────────────────────

export interface Paso {
  orden: number;
  entrega_id: string;
  tipo: TipoPaso;
  graduable: boolean;
  dificultad: number;
  /** Si es un repaso, de qué unidad viene. */
  repaso: { unidad: string; rama_slug: string } | null;
  requeue: boolean;
  payload: Payload;
  respondido: boolean;
  /** Solo al retomar una sesión: la corrección de lo ya respondido. */
  correccion: Correccion | null;
}

export type TipoSesion = 'leccion' | 'practica' | 'desafio' | 'repaso';

export interface Sesion {
  ok: true;
  intento_id: string;
  tipo: TipoSesion;
  leccion: { id: string; slug: string; titulo_es: string; bajada_es: string; orden: number; tipo: TipoSesion } | null;
  unidad: { id: string; slug: string; titulo_es: string; rama_slug: string; orden: number } | null;
  rama_slug: string;
  pasos: Paso[];
  savia_gastada: number;
  expires_at: string;
  terminado: boolean;
}

// ── El árbol ─────────────────────────────────────────────────────────────────

export type EstadoUnidad = 'bloqueada' | 'disponible' | 'en_curso' | 'completa' | 'repasar';
export type EstadoLeccion = 'bloqueada' | 'disponible' | 'completa';

export interface LeccionDelMapa {
  id: string;
  orden: number;
  tipo: Exclude<TipoSesion, 'repaso'>;
  estado: EstadoLeccion;
  titulo_es: string;
  minutos: number;
  mejor_score: number;
}

export interface UnidadDelMapa {
  id: string;
  slug: string;
  orden: number;
  /** 0 tronco · 1 básico · 2 intermedio · 3 avanzado. */
  nivel: number;
  titulo_es: string;
  bajada_es: string;
  estado: EstadoUnidad;
  /** Qué falta para abrirla: `unidad:<título>` o `tronco:<título>`. */
  falta: string | null;
  hechas: number;
  total: number;
  /** maestría × retrievability promedio, 0..1. */
  fuerza: number;
  lecciones: LeccionDelMapa[];
}

export interface RamaDelMapa {
  slug: string;
  nombre_es: string;
  bajada_es: string;
  es_tronco: boolean;
  sort_order: number;
  unidades: UnidadDelMapa[];
}

export interface SaviaEstado {
  restante: number;
  max: number;
  base: number;
  extra: number;
  reset_at: string;
}

export type MotivoSiguiente = 'continuar' | 'tronco' | 'interes' | 'siguiente';

export interface Siguiente {
  motivo: MotivoSiguiente;
  unidad: { id: string; slug: string; titulo_es: string; rama_slug: string; orden: number };
  leccion: { id: string; slug: string; titulo_es: string; bajada_es: string; orden: number; tipo: Exclude<TipoSesion, 'repaso'>; minutos: number };
}

export interface Mapa {
  ok: true;
  ramas: RamaDelMapa[];
  siguiente: Siguiente | null;
  /** Grupos de pasos que se están olvidando. */
  repaso: number;
  stats: {
    unidades_completas: number;
    unidades_total: number;
    lecciones_completas: number;
    lecciones_total: number;
    para_repasar: number;
    ramas_abiertas: number;
  };
  pro: boolean;
  /** null con Brote+: la ausencia del medidor ES el beneficio. */
  savia: SaviaEstado | null;
  racha: number;
  semillas_hoy: number;
  semillas_tope: number;
  semillas_saldo: number;
}

// ── Una unidad por dentro ────────────────────────────────────────────────────

export interface LeccionDeUnidad {
  id: string;
  slug: string;
  orden: number;
  tipo: Exclude<TipoSesion, 'repaso'>;
  titulo_es: string;
  bajada_es: string;
  minutos: number;
  estado: EstadoLeccion;
  mejor_score: number;
  intentos: number;
  /** Ejercicios escritos (sin contar los repasos que se suman al jugar). */
  pasos: number;
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

export interface DetalleUnidad {
  ok: true;
  unidad: {
    id: string;
    slug: string;
    orden: number;
    nivel: number;
    titulo_es: string;
    bajada_es: string;
    objetivos_es: string[];
    estado: EstadoUnidad;
    falta: string | null;
    hechas: number;
    total: number;
    fuerza: number;
  };
  rama: { slug: string; nombre_es: string; es_tronco: boolean; unidades: number };
  lecciones: LeccionDeUnidad[];
  repasa: { slug: string; titulo_es: string; rama_slug: string }[];
  siguiente: { slug: string; titulo_es: string } | null;
  estado: EstadoAcademia;
}

// ── El resultado ─────────────────────────────────────────────────────────────

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

export interface Resultado {
  ok: true;
  tipo: TipoSesion;
  score: number;
  umbral: number;
  aprobada: boolean;
  correctas: number;
  total: number;
  repasados: number;
  xp: number;
  semillas: number;
  semillas_balance: number;
  primer_clear: boolean;
  leccion: { id: string; titulo_es: string; tipo: TipoSesion; orden: number } | null;
  unidad: {
    id: string;
    slug: string;
    titulo_es: string;
    rama_slug: string;
    orden: number;
    hechas: number;
    total: number;
    /** Se completó CON esta sesión. */
    completa: boolean;
  } | null;
  unidad_desbloqueada: { slug: string; titulo_es: string; rama_slug: string; estado: EstadoUnidad } | null;
  /** Se completó la primera unidad del tronco: se abrieron las ramas. */
  ramas_abiertas: boolean;
  siguiente: { id: string; titulo_es: string; tipo: TipoSesion; orden: number } | null;
  racha: number;
  racha_sumo: boolean;
  accion: AccionSugerida | null;
  nuevos_titulos: unknown[] | null;
  nuevas_insignias: unknown[] | null;
}

// ── Fallos ───────────────────────────────────────────────────────────────────

/** Todo RPC puede contestar que no. `error` es un código; `mensaje`, para leer. */
export interface Fallo {
  ok: false;
  error: string;
  mensaje?: string;
  pendientes?: number;
}

export type Res<T> = T | Fallo;

export function esFallo<T extends { ok: true }>(r: Res<T>): r is Fallo {
  return r.ok === false;
}

/** El motivo de un bloqueo, ya separado de su prefijo. */
export function leerFalta(falta: string | null): { tipo: 'unidad' | 'tronco'; titulo: string } | null {
  if (!falta) return null;
  const i = falta.indexOf(':');
  if (i < 0) return null;
  const tipo = falta.slice(0, i);
  return { tipo: tipo === 'tronco' ? 'tronco' : 'unidad', titulo: falta.slice(i + 1) };
}
