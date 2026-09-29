/**
 * What grows back: the native plants you set, the invasive ones you pull, the
 * parcel types, and the habitat that makes a parcel flourish.
 *
 * **Every plant here is native to Argentina and fits the place it is offered
 * for.** The yellow iris and the ligustro are in the catalogue too — as things
 * to *remove*: both are well-documented invaders here, and a restoration game
 * that let you plant them would be teaching the opposite of its job.
 *
 * A plant's `species` links it to the Bitácora (`lib/world/species.ts`), so a
 * restored parcel is also where its species can be logged. Its `tier` is when
 * the Descubrir axis (the real rank) reveals it; nothing here is bought with
 * semillas into existence.
 */
import type { RegionId } from '../types';

export type PlantLook = 'pasto' | 'flor' | 'arbusto' | 'arbol' | 'acuatica' | 'suculenta' | 'cojin';

export interface PlantDef {
  id: string;
  name: string;
  look: PlantLook;
  /** Rank tier that discovers it… */
  tier: number;
  /**
   * …and the division inside that tier (1..5, default 1). Divisions are how the
   * real-life axis keeps showing up between rank-ups that take months: every
   * fifth of a tier reveals something, and most of those somethings are plants.
   */
  div?: number;
  /** The Bitácora species it is, when it is one. */
  species?: string;
  /** Accent for its flowers or foliage in the restored parcel, and its icon. */
  color: string;
  /** One line for the vivero and the planting card: what it does for the place. */
  role: string;
}

export const PLANTS: Record<string, PlantDef> = {
  flechilla: {
    id: 'flechilla', name: 'Flechilla', look: 'pasto', tier: 1, species: 'flechilla', color: '#C9B77A',
    role: 'Pasto nativo que sujeta el suelo con raíces hondas.',
  },
  margarita_pampa: {
    id: 'margarita_pampa', name: 'Margarita de campo', look: 'flor', tier: 1, species: 'margarita_pampa', color: '#F4F1E6',
    role: 'Flor para los primeros polinizadores del claro.',
  },
  chilca: {
    id: 'chilca', name: 'Chilca', look: 'arbusto', tier: 1, species: 'chilca', color: '#7E9A56',
    role: 'Pionera: la primera en volver a un suelo pelado, y lo prepara para las demás.',
  },
  cortadera: {
    id: 'cortadera', name: 'Cortadera', look: 'pasto', tier: 2, species: 'cortadera', color: '#E6DEC9',
    role: 'Penacho alto que da refugio a aves del pastizal.',
  },
  verbena: {
    id: 'verbena', name: 'Verbena', look: 'flor', tier: 3, species: 'verbena', color: '#8C5BC7',
    role: 'Ramillete donde las mariposas se posan sin esfuerzo.',
  },
  lantana: {
    id: 'lantana', name: 'Lantana', look: 'flor', tier: 3, species: 'lantana', color: '#F2A33A',
    role: 'Flores que cambian de color cuando ya las visitaron.',
  },
  salvia_azul: {
    id: 'salvia_azul', name: 'Salvia azul', look: 'flor', tier: 3, species: 'salvia_azul', color: '#3F6FD8',
    role: 'Su flor tiene una palanca que le tira el polen al abejorro.',
  },
  jazmin_pais: {
    id: 'jazmin_pais', name: 'Jazmín del país', look: 'arbusto', tier: 3, species: 'jazmin_pais', color: '#FBF7EA',
    role: 'Perfuma de noche para las polillas que lo polinizan.',
  },
  tala: {
    id: 'tala', name: 'Tala', look: 'arbol', tier: 4, species: 'tala', color: '#6E8B3D',
    role: 'Árbol del talar: sus frutos alimentan a muchas aves.',
  },
  ceibo: {
    id: 'ceibo', name: 'Ceibo', look: 'arbol', tier: 4, species: 'ceibo', color: '#D7263D',
    role: 'Flor nacional; aguanta el suelo inundado.',
  },
  algarrobo: {
    id: 'algarrobo', name: 'Algarrobo', look: 'arbol', tier: 5, species: 'algarrobo', color: '#8BA35A',
    role: 'Sombra amplia y vainas dulces para la fauna.',
  },
  aguaribay: {
    id: 'aguaribay', name: 'Aguaribay', look: 'arbol', tier: 5, species: 'aguaribay', color: '#7FA05B',
    role: 'Sombra fresca y olor a pimienta que espanta insectos.',
  },
  junco: {
    id: 'junco', name: 'Junco', look: 'acuatica', tier: 7, species: 'junco', color: '#5E8C4A',
    role: 'Filtra el agua y sostiene la orilla.',
  },
  camalote: {
    id: 'camalote', name: 'Camalote', look: 'acuatica', tier: 7, species: 'camalote', color: '#9B7FD4',
    role: 'Balsas flotantes que son refugio de peces chicos.',
  },
  cardon: {
    id: 'cardon', name: 'Cardón', look: 'suculenta', tier: 8, species: 'cardon', color: '#5C7F4E',
    role: 'Crece un centímetro por año: plantarlo es pensar en décadas.',
  },
  chaguar: {
    id: 'chaguar', name: 'Chaguar', look: 'arbusto', tier: 8, species: 'chaguar', color: '#6F8F4F',
    role: 'Fija la ladera y da fibra que dura décadas.',
  },
  yareta: {
    id: 'yareta', name: 'Yareta', look: 'cojin', tier: 9, species: 'yareta', color: '#6FA356',
    role: 'Cojín de altura que tarda siglos: protegerla vale más que plantar.',
  },
  llareta_flor: {
    id: 'llareta_flor', name: 'Flor de altura', look: 'flor', tier: 9, species: 'llareta_flor', color: '#E8D25A',
    role: 'Florece pegada al suelo, lejos del viento.',
  },
  cachiyuyo: {
    id: 'cachiyuyo', name: 'Cachiyuyo', look: 'arbusto', tier: 10, species: 'cachiyuyo', color: '#9DAE8A',
    role: 'Aguanta la sal, fija la duna y frena al mar.',
  },
  // ── Discovered by divisions: natives that deepen what a parcel can hold ──
  margarita_punzo: {
    id: 'margarita_punzo', name: 'Margarita punzó', look: 'flor', tier: 1, div: 3, color: '#D9482B',
    role: 'Flor roja y amarilla del pastizal; aguanta sequía y sol pleno.',
  },
  espinillo: {
    id: 'espinillo', name: 'Espinillo', look: 'arbol', tier: 1, div: 5, color: '#E8C53A',
    role: 'Arbolito nativo de flores amarillas perfumadas; no confundir con la acacia negra invasora.',
  },
  paja_colorada: {
    id: 'paja_colorada', name: 'Paja colorada', look: 'pasto', tier: 2, div: 3, color: '#B7784A',
    role: 'Matas altas que dan refugio a aves y bichos del pastizal.',
  },
  cola_zorro: {
    id: 'cola_zorro', name: 'Cola de zorro', look: 'pasto', tier: 2, div: 5, color: '#D8C9A3',
    role: 'Pasto nativo de espigas plumosas que se mueven con el viento.',
  },
  mburucuya: {
    id: 'mburucuya', name: 'Mburucuyá', look: 'flor', tier: 3, div: 3, color: '#8E7CC3',
    role: 'Enredadera nativa de flor increíble; sus hojas alimentan orugas de mariposas.',
  },
  achira: {
    id: 'achira', name: 'Achira', look: 'flor', tier: 3, div: 5, color: '#F2D14A',
    role: 'Flor amarilla de lugares húmedos; le gusta el borde del agua.',
  },
  coronillo: {
    id: 'coronillo', name: 'Coronillo', look: 'arbol', tier: 4, div: 3, color: '#4F6B3A',
    role: 'Árbol del talar, muy resistente; de sus frutos comen muchas aves.',
  },
  sombra_de_toro: {
    id: 'sombra_de_toro', name: 'Sombra de toro', look: 'arbol', tier: 4, div: 5, color: '#5E7A45',
    role: 'Árbol nativo de hojas duras y punzantes; aguanta sequías y viento.',
  },
  sarandi: {
    id: 'sarandi', name: 'Sarandí', look: 'arbusto', tier: 5, div: 3, color: '#6D8F55',
    role: 'Arbusto de orilla: sus raíces sujetan la costa del río.',
  },
  molle: {
    id: 'molle', name: 'Molle', look: 'arbol', tier: 5, div: 5, color: '#6A8C4E',
    role: 'Árbol de las sierras; da sombra y frutos a aves.',
  },
  lapacho: {
    id: 'lapacho', name: 'Lapacho rosado', look: 'arbol', tier: 6, color: '#E27BB0',
    role: 'Florece rosa antes de echar hojas; sus flores alimentan picaflores.',
  },
  totora: {
    id: 'totora', name: 'Totora', look: 'acuatica', tier: 7, div: 3, color: '#7A8F4A',
    role: 'Planta de bañado: refugio de aves acuáticas y filtro del agua.',
  },
  duraznillo: {
    id: 'duraznillo', name: 'Duraznillo blanco', look: 'arbusto', tier: 7, div: 5, color: '#B9A6E0',
    role: 'Arbusto de los bañados, de flores lilas; marca dónde el suelo queda húmedo.',
  },
  jarilla: {
    id: 'jarilla', name: 'Jarilla', look: 'arbusto', tier: 8, div: 3, color: '#9AA84A',
    role: 'Arbusto del monte seco; huele a resina y aguanta casi sin agua.',
  },
  tabaquillo: {
    id: 'tabaquillo', name: 'Tabaquillo', look: 'arbol', tier: 8, div: 5, color: '#8A6C4E',
    role: 'Árbol de altura de corteza como papel; forma bosquecitos en las sierras.',
  },
  coiron: {
    id: 'coiron', name: 'Coirón', look: 'pasto', tier: 9, div: 3, color: '#C6B37E',
    role: 'Pasto de altura en matas que protegen el suelo del viento helado.',
  },
  espartillo: {
    id: 'espartillo', name: 'Espartillo', look: 'pasto', tier: 10, div: 3, color: '#A9B57A',
    role: 'Pasto de marisma que aguanta el agua salada y frena la erosión.',
  },
};

/** How far along the Descubrir axis a context is: tier 3, division 3 → 3.4. */
export function progressOf(tier: number, div = 1): number {
  return tier + (Math.min(5, Math.max(1, Math.floor(div))) - 1) / 5;
}

/** The progress value at which a plant (or anything with tier/div) is discovered. */
export function discoveredAt(x: { tier: number; div?: number }): number {
  return progressOf(x.tier, x.div ?? 1);
}

export const PLANT_IDS = Object.keys(PLANTS);

// ── Invasives ──────────────────────────────────────────────────────────────

export interface InvasiveDef {
  id: string;
  name: string;
  why: string;
  color: string;
  /** A shrub or a tree: pulled out, its wood is building material. The iris is only leaves. */
  woody?: boolean;
}

/**
 * Pulled from wild parcels. Each is a documented invader in Argentina, and the
 * line says what it does rather than that it is "bad".
 */
export const INVASIVES: Record<string, InvasiveDef> = {
  ligustro: {
    id: 'ligustro', name: 'Ligustro', color: '#2F5D3A', woody: true,
    why: 'Crece rápido, cierra la sombra y no deja brotar a las nativas. Los pájaros esparcen sus semillas.',
  },
  acacia_negra: {
    id: 'acacia_negra', name: 'Acacia negra', color: '#4B5A2E', woody: true,
    why: 'Invade el pastizal con espinas enormes. De chica sale fácil; de grande cuesta años.',
  },
  iris_amarillo: {
    id: 'iris_amarillo', name: 'Iris amarillo', color: '#E3C42B',
    why: 'Es lindo, pero en nuestros humedales es invasor y le quita el lugar al junco.',
  },
  pino: {
    id: 'pino', name: 'Pino', color: '#34533B', woody: true,
    why: 'Los pinos se escapan a las sierras, secan el pastizal y cambian el agua del suelo.',
  },
  tamarisco: {
    id: 'tamarisco', name: 'Tamarisco', color: '#8A8F6A', woody: true,
    why: 'Tolera la sal y avanza sobre la costa, donde deberían estar las plantas que fijan la duna.',
  },
};

// ── Parcel types ───────────────────────────────────────────────────────────

export interface ParcelTypeDef {
  id: RegionId;
  name: string;
  /** What it becomes when restored, in one line for the parcel card. */
  becomes: string;
  plants: string[];
  invasive: string;
  /** Habitat items that let it flourish. */
  habitats: string[];
  /** Stage 1→2 is fed with this (the mountain is steadied with stone, not compost). */
  soil: 'compost' | 'piedras';
  /**
   * From planted to alive: waterings on different days, and days since
   * planting. Trees ask for more of both than grass; a wetland is not watered
   * at all (it is wet — that is the lesson) and only needs time.
   */
  grow: { water: number; days: number };
}

export const PARCEL_TYPES: Record<RegionId, ParcelTypeDef> = {
  claro: {
    id: 'claro', name: 'Pradera de nativas', becomes: 'Pasto nativo, flores y chilcas',
    plants: ['flechilla', 'margarita_pampa', 'chilca', 'margarita_punzo', 'espinillo', 'verbena', 'tala', 'coronillo'],
    invasive: 'ligustro', habitats: ['posadero', 'bebedero'], soil: 'compost', grow: { water: 2, days: 1 },
  },
  pradera: {
    id: 'pradera', name: 'Pastizal', becomes: 'Pastizal alto donde anidan las aves',
    plants: ['flechilla', 'cortadera', 'margarita_pampa', 'chilca', 'margarita_punzo', 'paja_colorada', 'cola_zorro', 'espinillo'],
    invasive: 'acacia_negra', habitats: ['posadero', 'bebedero'], soil: 'compost', grow: { water: 2, days: 2 },
  },
  jardin: {
    id: 'jardin', name: 'Jardín de polinizadores', becomes: 'Flores para abejas nativas y mariposas',
    plants: ['verbena', 'lantana', 'salvia_azul', 'jazmin_pais', 'margarita_pampa', 'mburucuya', 'achira', 'margarita_punzo'],
    invasive: 'ligustro', habitats: ['hotel_chico', 'bebedero'], soil: 'compost', grow: { water: 2, days: 2 },
  },
  arboleda: {
    id: 'arboleda', name: 'Bosque nativo', becomes: 'Talas, ceibos y algarrobos con su sotobosque',
    plants: ['tala', 'ceibo', 'algarrobo', 'aguaribay', 'chilca', 'coronillo', 'sombra_de_toro', 'lapacho', 'molle'],
    invasive: 'ligustro', habitats: ['caja_nido', 'posadero'], soil: 'compost', grow: { water: 3, days: 4 },
  },
  rio: {
    id: 'rio', name: 'Humedal', becomes: 'Juncales y ceibos que limpian el agua',
    plants: ['junco', 'camalote', 'ceibo', 'cortadera', 'totora', 'duraznillo', 'sarandi', 'achira'],
    invasive: 'iris_amarillo', habitats: ['refugio_ranas', 'posadero'], soil: 'compost', grow: { water: 0, days: 2 },
  },
  monte: {
    id: 'monte', name: 'Monte serrano', becomes: 'Ladera firme con cardones y chaguar',
    plants: ['cardon', 'chaguar', 'chilca', 'flechilla', 'jarilla', 'tabaquillo', 'molle', 'cola_zorro'],
    invasive: 'pino', habitats: ['pirca'], soil: 'piedras', grow: { water: 1, days: 3 },
  },
  cumbre: {
    id: 'cumbre', name: 'Pastizal de altura', becomes: 'Cojines de yareta y flores al ras',
    plants: ['yareta', 'llareta_flor', 'flechilla', 'coiron', 'tabaquillo'],
    invasive: 'pino', habitats: ['pirca'], soil: 'piedras', grow: { water: 1, days: 4 },
  },
  islote: {
    id: 'islote', name: 'Duna costera', becomes: 'Duna fija con cachiyuyo',
    plants: ['cachiyuyo', 'cortadera', 'espartillo', 'paja_colorada'],
    invasive: 'tamarisco', habitats: ['posadero'], soil: 'compost', grow: { water: 1, days: 3 },
  },
  monumento: {
    id: 'monumento', name: 'Mirador', becomes: 'La cima en flor',
    plants: ['llareta_flor', 'yareta', 'flechilla', 'coiron', 'margarita_punzo'],
    invasive: 'pino', habitats: ['pirca', 'posadero'], soil: 'piedras', grow: { water: 1, days: 3 },
  },
};

/**
 * The plants a parcel accepts right now: its type's list, minus what the real
 * axis has not discovered yet. `progress` is `progressOf(tier, div)`.
 */
export function plantsFor(region: RegionId, progress: number): string[] {
  return PARCEL_TYPES[region].plants.filter((p) => PLANTS[p] && discoveredAt(PLANTS[p]!) <= progress + 1e-9);
}
