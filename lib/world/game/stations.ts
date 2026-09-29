/**
 * The stations: built on a pad by walking materials onto it, upgraded the same
 * way, and — for the ones that make something — working on wall-clock time
 * while nobody is looking. That last part is what makes the day end: a
 * compostera turns leaves into soil at its own pace, so a session can empty it
 * but never outrun it (`docs/MUNDO_JUEGO.md` §3.2).
 */
import type { MaterialId, StationId } from './types';

export type Cost = Partial<Record<MaterialId, number>> & { semillas?: number };

export interface StationLevel {
  /** What building (level 1) or upgrading to this level takes. */
  cost: Cost;
  /** Seconds per output, for the producers. */
  secs?: number;
  /** How many finished outputs it holds before it stops. */
  cap?: number;
  /** One line: what this level changes. */
  gain: string;
}

export interface StationDef {
  id: StationId;
  name: string;
  /** "la compostera", "el vivero": for sentences that name it. */
  article: 'el' | 'la';
  /** Rank tier that discovers it. */
  tier: number;
  /** The one-line lesson, shown in its panel. */
  teaches: string;
  /** What it does, for the pad before it exists. */
  does: string;
  /** Producers: what goes in, how many per output, what comes out. */
  makes?: { input: MaterialId; per: number; output: MaterialId | 'agua' };
  levels: StationLevel[];
}

export const STATIONS: Record<StationId, StationDef> = {
  punto_limpio: {
    id: 'punto_limpio', name: 'Punto Limpio', article: 'el', tier: 1,
    does: 'Separás los residuos: lo reciclable vuelve como material, lo orgánico va a compost.',
    teaches: 'Separar en casa es lo que hace posible reciclar: mezclado, casi nada se recupera.',
    levels: [
      { cost: { ramas: 4, piedras: 3 }, gain: 'Tres contenedores y un techito.' },
      { cost: { ramas: 8, reciclado: 10, semillas: 120 }, gain: 'Una prensa: cada reciclable rinde el doble.' },
      { cost: { ramas: 12, piedras: 10, reciclado: 20, semillas: 300 }, gain: 'Centro de reciclaje: cada acierto paga doble.' },
    ],
  },
  compostera: {
    id: 'compostera', name: 'Compostera', article: 'la', tier: 1,
    does: 'Los orgánicos se vuelven compost con el tiempo, aunque no estés.',
    teaches: 'Lo orgánico compostado vuelve a la tierra; en un relleno sanitario, se pudre y larga metano.',
    makes: { input: 'hojas', per: 4, output: 'compost' },
    levels: [
      { cost: { ramas: 6, reciclado: 2 }, secs: 360, cap: 5, gain: 'Un cajón de listones.' },
      { cost: { ramas: 10, reciclado: 6, semillas: 150 }, secs: 270, cap: 8, gain: 'Dos cajones: más rápido y más lugar.' },
      { cost: { ramas: 14, piedras: 8, reciclado: 10, semillas: 380 }, secs: 200, cap: 12, gain: 'Tres cajones con tapa: el compost no para.' },
    ],
  },
  tanque: {
    id: 'tanque', name: 'Tanque de lluvia', article: 'el', tier: 1,
    does: 'Junta el agua de lluvia del techo. Con ella cargás la regadera.',
    teaches: 'El agua de lluvia sirve para regar y no gasta agua potable.',
    makes: { input: 'hojas', per: 0, output: 'agua' },
    levels: [
      { cost: { reciclado: 4, ramas: 4 }, secs: 75, cap: 10, gain: 'Un tanque bajo una canaleta.' },
      { cost: { reciclado: 8, piedras: 6, semillas: 120 }, secs: 55, cap: 18, gain: 'Un segundo tanque conectado.' },
      { cost: { reciclado: 14, ramas: 8, semillas: 300 }, secs: 40, cap: 28, gain: 'Techo más grande: junta más rápido.' },
    ],
  },
  vivero: {
    id: 'vivero', name: 'Vivero', article: 'el', tier: 1,
    does: 'Con frutos y semillas criás plantines de la especie que elijas.',
    teaches: 'Un vivero de nativas guarda las plantas del lugar: se reproducen de semilla y no hay que traerlas de lejos.',
    makes: { input: 'frutos', per: 3, output: 'plantines' },
    levels: [
      { cost: { ramas: 8, reciclado: 6, piedras: 4 }, secs: 480, cap: 4, gain: 'Una media sombra y bandejas.' },
      { cost: { ramas: 12, reciclado: 10, semillas: 180 }, secs: 360, cap: 6, gain: 'Más bandejas y riego por goteo.' },
      { cost: { ramas: 16, piedras: 10, reciclado: 16, semillas: 420 }, secs: 260, cap: 9, gain: 'Un invernadero: los plantines salen solos.' },
    ],
  },
  hotel_insectos: {
    id: 'hotel_insectos', name: 'Hotel de insectos', article: 'el', tier: 3,
    does: 'Refugio para abejas nativas y otros polinizadores. Las parcelas cercanas dan más frutos.',
    teaches: 'Muchas abejas nativas viven solas en huecos de cañas y maderas: un hotel les da dónde anidar.',
    levels: [
      { cost: { ramas: 12, piedras: 6, hojas: 6 }, gain: 'Cañas, troncos agujereados y ladrillos.' },
      { cost: { ramas: 16, reciclado: 6, semillas: 200 }, gain: 'Más pisos: más huéspedes.' },
      { cost: { ramas: 20, piedras: 10, semillas: 400 }, gain: 'Un techo verde encima.' },
    ],
  },
  puente: {
    id: 'puente', name: 'Puente', article: 'el', tier: 7,
    does: 'Reparar el puente viejo para cruzar el río sin mojarse.',
    teaches: 'Un puente bien hecho deja pasar el agua y a los peces por debajo.',
    levels: [
      { cost: { ramas: 20, piedras: 12 }, gain: 'Tablones nuevos sobre los pilotes viejos.' },
      { cost: { ramas: 24, reciclado: 12, semillas: 260 }, gain: 'Barandas y faroles.' },
      { cost: { ramas: 30, piedras: 20, semillas: 520 }, gain: 'Un descanso para mirar el río.' },
    ],
  },
  muelle: {
    id: 'muelle', name: 'Muelle', article: 'el', tier: 7,
    does: 'Un muelle para pescar mejor. Más adelante, para el bote al islote.',
    teaches: 'Pescar lo justo y devolver lo chico deja peces para el año que viene.',
    levels: [
      { cost: { ramas: 18, piedras: 8 }, gain: 'Tablas sobre el agua.' },
      { cost: { ramas: 24, reciclado: 10, semillas: 240 }, gain: 'Más largo: se pesca en lo hondo.' },
      { cost: { ramas: 30, piedras: 14, semillas: 480 }, gain: 'Un techito para la siesta.' },
    ],
  },
  refugio: {
    id: 'refugio', name: 'Refugio de montaña', article: 'el', tier: 8,
    does: 'Un refugio de piedra en El Monte: descanso y mirador.',
    teaches: 'En la montaña, dejar el sendero marcado evita la erosión de la ladera.',
    levels: [
      { cost: { piedras: 30, ramas: 12 }, gain: 'Muros de piedra seca.' },
      { cost: { piedras: 40, ramas: 16, semillas: 320 }, gain: 'Un techo y una estufa.' },
      { cost: { piedras: 50, reciclado: 16, semillas: 600 }, gain: 'Paneles solares en el techo.' },
    ],
  },
  faro: {
    id: 'faro', name: 'Faro', article: 'el', tier: 10,
    does: 'El faro de Don Beto, prendido otra vez. Con energía del sol y del viento.',
    teaches: 'Una luz que usa sol y viento no gasta nada que se acabe.',
    levels: [
      { cost: { piedras: 40, ramas: 20, reciclado: 20 }, gain: 'La torre en pie.' },
      { cost: { piedras: 50, reciclado: 30, semillas: 400 }, gain: 'La lámpara, con paneles.' },
      { cost: { piedras: 60, reciclado: 40, semillas: 800 }, gain: 'Un molino: gira con el viento del mar.' },
    ],
  },
};

export const STATION_ORDER: StationId[] = [
  'punto_limpio', 'compostera', 'tanque', 'vivero', 'hotel_insectos', 'puente', 'muelle', 'refugio', 'faro',
];

/** The level definition that applies once a station is at `lvl` (1..3). */
export function levelDef(id: StationId, lvl: number): StationLevel | null {
  if (lvl < 1) return null;
  return STATIONS[id].levels[Math.min(lvl, STATIONS[id].levels.length) - 1] ?? null;
}

/** "la compostera", "el tanque de lluvia". */
export function named(id: StationId): string {
  return `${STATIONS[id].article} ${STATIONS[id].name.charAt(0).toLowerCase()}${STATIONS[id].name.slice(1)}`;
}

/** What the next build or upgrade costs, or null at the top level. */
export function nextCost(id: StationId, lvl: number): Cost | null {
  return STATIONS[id].levels[lvl]?.cost ?? null;
}
