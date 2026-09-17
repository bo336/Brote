import type { DomainSlug } from '@/lib/domains';

/**
 * Los tipos de Mejora. Sin dependencias de React ni de Supabase a propósito:
 * este módulo lo compila también el runner de tests (`tsconfig.test.json`).
 */

/** `goal_horizon` — 0106_mejora. */
export type Horizonte = 'trimestral' | 'semestral' | 'anual';
/** `goal_ambition` — 0106_mejora. */
export type Ambicion = 'basico' | 'intermedio' | 'avanzado';
/** `baseline_origin` — 0106_mejora. */
export type OrigenBase = 'factura' | 'medicion' | 'estimado' | 'a_medir';
/** `goal_status` — 0106_mejora. */
export type EstadoObjetivo =
  | 'propuesto'
  | 'activo'
  | 'en_riesgo'
  | 'en_revision'
  | 'logrado'
  | 'logrado_parcial'
  | 'incumplido'
  | 'descartado';

export type Inversion = 'ninguna' | 'baja' | 'media';
export type Confianza = 'alta' | 'media' | 'baja';

/**
 * Qué clase de objetivo es. Decide qué reglas del validador aplican: una
 * medición no puede fallar por "ambición insignificante" porque no reduce nada.
 */
export type MetricaTipo = 'reduccion' | 'medicion' | 'sustitucion';

/** Los seis instrumentos que una PyME ya tiene (05 §5.2, R8). */
export type MetodoTipo = 'factura' | 'conteo' | 'pesaje' | 'remito' | 'planilla' | 'foto_fechada';

export type TipoCheckin = 'no_llego' | 'ya_hecho' | 'no_aplica' | 'mas_tiempo' | 'avance' | 'nota';

/**
 * Un número que la empresa puede no saber. `null` = todavía no contestó;
 * `'no_se'` = contestó que no sabe, que es información (fase 2 §4.1) y dispara
 * objetivos de medición en lugar de reducción.
 */
export type NumeroODesconocido = number | 'no_se' | null;

/** Un sí/no con la misma distinción: `null` es "todavía no contestó". */
export type BooleanODesconocido = boolean | 'no_se' | null;

export type Presupuesto = 'ninguno' | 'hasta_x' | 'caso_por_caso';

export interface BloqueOperacion {
  que_produce: string;
  volumen: string;
  estacionalidad: string;
}
export interface BloqueEnergia {
  suministro: 'electrico' | 'electrico_gas' | 'otro' | 'no_se' | null;
  tiene_factura: BooleanODesconocido;
  consumo_mensual: NumeroODesconocido;
  equipos: string;
}
export interface BloqueResiduos {
  que_tiran: string;
  bolsas_semana: NumeroODesconocido;
  separa: BooleanODesconocido;
  retiro_reciclables: BooleanODesconocido;
}
export interface BloqueAgua {
  es_relevante: BooleanODesconocido;
  medicion: 'medidor' | 'canilla_libre' | 'no_se' | null;
  consumo_mensual: NumeroODesconocido;
}
export interface BloqueInsumos {
  principales: string;
  proveedores_clave: NumeroODesconocido;
  puede_cambiar_proveedores: BooleanODesconocido;
}
export interface BloqueLogistica {
  como_llega: string;
  flota: 'propia' | 'tercerizada' | 'retiran' | 'no_aplica' | 'no_se' | null;
  viajes_mes: NumeroODesconocido;
}
export interface BloqueRestricciones {
  presupuesto: Presupuesto;
  presupuesto_monto: NumeroODesconocido;
  horas_mes_disponibles: number;
  local: 'alquilado' | 'propio' | 'no_aplica' | null;
}

export interface Dossier {
  operacion: BloqueOperacion;
  energia: BloqueEnergia;
  residuos: BloqueResiduos;
  agua: BloqueAgua;
  insumos: BloqueInsumos;
  logistica: BloqueLogistica;
  ya_hecho: string;
  restricciones: BloqueRestricciones;
  completitud: number;
}

/** Los ocho bloques, en el orden en que se completan. */
export const BLOQUES = [
  'operacion',
  'energia',
  'residuos',
  'agua',
  'insumos',
  'logistica',
  'ya_hecho',
  'restricciones',
] as const;
export type BloqueClave = (typeof BLOQUES)[number];

/** Datos mínimos del negocio que necesitan el generador y las plantillas. */
export interface NegocioParaMejora {
  id: string;
  nombre_comercial: string;
  rubro: string;
  tamano: string;
  ciudad: string | null;
  provincia: string | null;
  descripcion: string | null;
}

/**
 * Un objetivo antes de guardarse: lo que devuelve el generador (por reglas o
 * por IA) y lo que entra al validador de realismo.
 */
export interface ObjetivoPropuesto {
  titulo: string;
  porque: string;
  dominio: DomainSlug;
  palanca_slug: string | null;
  metrica: string;
  unidad: string;
  linea_base: number | null;
  origen_base: OrigenBase;
  objetivo: number | null;
  horizonte: Horizonte;
  ambicion: Ambicion;
  esfuerzo_horas_mes: number;
  inversion: Inversion;
  es_evento_unico: boolean;
  metrica_tipo: MetricaTipo;
  metodo_tipo: MetodoTipo;
  /** Alcance GEI: 1 propio, 2 electricidad comprada, 3 cadena de valor (05 §5.2, R9). */
  alcance: 1 | 2 | 3;
  como_medir: string;
  pasos: string[];
  evidencia_requerida: string;
  si_no_llegas: string;
  confianza: Confianza;
  supuestos: string[];
}

/** Lo que el validador necesita saber del negocio además del dossier. */
export interface ContextoValidacion {
  dossier: Dossier;
  /** Objetivos activos hoy: cuántos son y cuánto esfuerzo suman. */
  activos: { esfuerzo_horas_mes: number }[];
}

export interface ResultadoValidacion {
  valido: boolean;
  fallos: string[];
}
