/**
 * The 64-species catalogue, verbatim from `14-CONTENT.md` §1.
 *
 * Columns map 1:1 to `world_species` (`15-DATA-MODEL.md` §3), so this file and
 * the seed cannot drift. Every `blurb_es` is 12-18 words — the DB enforces it
 * with a check constraint and `species.test.ts` enforces it here.
 *
 * Species are the Bitácora, and the Bitácora is the product's own tagline made
 * literal. Do not invent rows: if a species is missing, say so.
 */
import { hashInt, mulberry32 } from './rng';
import type { RegionId, SeasonId, SpeciesRow, TimeOfDay } from './types';

export const SPECIES: SpeciesRow[] = [
  // ── El Claro — tier 1 ─────────────────────────────────────────────────────
  { slug: 'tierra_viva', name_es: 'Tierra viva', kind: 'planta', region: 'claro', min_tier: 1,
    time_of_day: ['dia'], rarity: 1, domain_slug: 'aire_suelo',
    blurb_es: 'Suelo oscuro y suelto. Un puñado sano tiene más vida que todo el barrio junto.' },
  { slug: 'hormiga_negra', name_es: 'Hormiga negra', kind: 'insecto', region: 'claro', min_tier: 1,
    time_of_day: ['dia', 'atardecer'], rarity: 1, domain_slug: 'animales',
    blurb_es: 'Mueven semillas sin querer y así plantan medio campo. Trabajan mejor cuando no las mirás.' },

  // ── La Pradera — tier 2 ───────────────────────────────────────────────────
  { slug: 'flechilla', name_es: 'Flechilla', kind: 'planta', region: 'pradera', min_tier: 2,
    time_of_day: ['dia'], rarity: 1, domain_slug: 'plantas',
    blurb_es: 'Pasto de pampa. Sus semillas se enroscan solas en la tierra para enterrarse cuando llueve.' },
  { slug: 'cortadera', name_es: 'Cortadera', kind: 'planta', region: 'pradera', min_tier: 2,
    time_of_day: ['dia', 'atardecer'], rarity: 1, domain_slug: 'plantas',
    blurb_es: 'Penacho plateado que se mueve con todo el viento. De cerca corta, de lejos brilla.' },
  { slug: 'trebol_blanco', name_es: 'Trébol blanco', kind: 'planta', region: 'pradera', min_tier: 2,
    time_of_day: ['dia'], rarity: 1, domain_slug: 'alimentacion',
    blurb_es: 'Le devuelve nitrógeno al suelo. Donde hay trébol, después crece cualquier otra cosa mejor.' },
  { slug: 'chinita', name_es: 'Vaquita de San Antonio', kind: 'insecto', region: 'pradera', min_tier: 2,
    time_of_day: ['dia'], rarity: 1, domain_slug: 'animales',
    blurb_es: 'Se come cientos de pulgones por semana. Es control de plagas con patitas y sin veneno.' },
  { slug: 'hornero', name_es: 'Hornero', kind: 'ave', region: 'pradera', min_tier: 2,
    time_of_day: ['amanecer', 'dia'], rarity: 2, domain_slug: 'animales',
    blurb_es: 'Construye su horno de barro en dos meses, siempre con la puerta lejos del viento sur.' },
  { slug: 'tijerita', name_es: 'Tijereta', kind: 'ave', region: 'pradera', min_tier: 2,
    time_of_day: ['dia', 'atardecer'], rarity: 2, domain_slug: 'animales',
    blurb_es: 'Viaja desde el norte cada primavera. La cola larga le sirve para frenar en el aire.' },
  { slug: 'grillo_campo', name_es: 'Grillo de campo', kind: 'insecto', region: 'pradera', min_tier: 2,
    time_of_day: ['noche'], rarity: 1, domain_slug: 'animales',
    blurb_es: 'Canta frotando las alas. Cuanto más calor hace, más rápido le sale la misma canción.' },
  { slug: 'rocio_manana', name_es: 'Rocío de la mañana', kind: 'fenomeno', region: 'pradera', min_tier: 2,
    time_of_day: ['amanecer'], rarity: 2, domain_slug: 'agua',
    blurb_es: 'Agua que el aire deja caer sin llover. Muchas plantas del secano viven casi de esto.' },

  // ── El Jardín — tier 3 ────────────────────────────────────────────────────
  { slug: 'margarita_pampa', name_es: 'Margarita de campo', kind: 'planta', region: 'jardin', min_tier: 3,
    time_of_day: ['dia'], rarity: 1, domain_slug: 'plantas',
    blurb_es: 'Abre con el sol y cierra al atardecer. Le lleva el mismo tiempo todos los días.' },
  { slug: 'verbena', name_es: 'Verbena', kind: 'planta', region: 'jardin', min_tier: 3,
    time_of_day: ['dia'], rarity: 1, domain_slug: 'plantas',
    blurb_es: 'Flor chiquita en ramillete. Las mariposas la eligen porque pueden pararse sin esfuerzo encima.' },
  { slug: 'lantana', name_es: 'Lantana', kind: 'planta', region: 'jardin', min_tier: 3,
    time_of_day: ['dia', 'atardecer'], rarity: 1, domain_slug: 'plantas',
    blurb_es: 'Cambia de color mientras envejece. Amarilla es nueva, naranja ya fue visitada por alguien.' },
  { slug: 'salvia_azul', name_es: 'Salvia azul', kind: 'planta', region: 'jardin', min_tier: 3,
    time_of_day: ['dia'], rarity: 2, domain_slug: 'plantas',
    blurb_es: 'Su flor tiene una palanquita: cuando entra el abejorro, el polen le cae justo encima.' },
  { slug: 'jazmin_pais', name_es: 'Jazmín del país', kind: 'planta', region: 'jardin', min_tier: 3,
    time_of_day: ['atardecer', 'noche'], rarity: 2, domain_slug: 'plantas',
    blurb_es: 'Perfuma más de noche porque sus polinizadores son polillas y no abejas. Estrategia, no casualidad.' },
  { slug: 'abeja_nativa', name_es: 'Abeja nativa sin aguijón', kind: 'insecto', region: 'jardin', min_tier: 3,
    time_of_day: ['dia'], rarity: 2, domain_slug: 'animales',
    blurb_es: 'No pica y poliniza mejor que la europea en muchas plantas nuestras. Vive en troncos huecos.' },
  { slug: 'abejorro', name_es: 'Abejorro', kind: 'insecto', region: 'jardin', min_tier: 3,
    time_of_day: ['dia'], rarity: 2, domain_slug: 'animales',
    blurb_es: 'Vibra las flores a la frecuencia justa para que suelten el polen. Se llama polinización por zumbido.' },
  { slug: 'mariposa_bandera', name_es: 'Bandera argentina', kind: 'insecto', region: 'jardin', min_tier: 3,
    time_of_day: ['dia'], rarity: 2, domain_slug: 'animales',
    blurb_es: 'Celeste y blanca de verdad. Sus orugas comen una sola planta y no aceptan reemplazo.' },
  { slug: 'esperanza_verde', name_es: 'Esperanza', kind: 'insecto', region: 'jardin', min_tier: 3,
    time_of_day: ['noche'], rarity: 2, domain_slug: 'animales',
    blurb_es: 'Parece una hoja hasta que se mueve. El disfraz le funciona incluso con las nervaduras dibujadas.' },
  { slug: 'luciernaga', name_es: 'Luciérnaga', kind: 'insecto', region: 'jardin', min_tier: 3,
    time_of_day: ['noche'], rarity: 3, domain_slug: 'animales',
    blurb_es: 'Su luz es química y fría: casi no pierde energía en calor. Nosotros todavía no sabemos copiarla.' },

  // ── La Arboleda — tiers 4-6 ───────────────────────────────────────────────
  { slug: 'ceibo', name_es: 'Ceibo', kind: 'arbol', region: 'arboleda', min_tier: 4,
    time_of_day: ['dia'], rarity: 2, domain_slug: 'plantas',
    blurb_es: 'Flor nacional. Aguanta el suelo inundado que mataría a casi cualquier otro árbol del país.' },
  { slug: 'tala', name_es: 'Tala', kind: 'arbol', region: 'arboleda', min_tier: 4,
    time_of_day: ['dia'], rarity: 1, domain_slug: 'plantas',
    blurb_es: 'Arbolito espinoso del talar bonaerense. Sus frutos amarillos alimentan a media docena de aves distintas.' },
  { slug: 'zorzal', name_es: 'Zorzal colorado', kind: 'ave', region: 'arboleda', min_tier: 4,
    time_of_day: ['amanecer', 'dia'], rarity: 1, domain_slug: 'animales',
    blurb_es: 'Canta antes que salga el sol. Cada macho repite un repertorio propio que no comparte.' },
  { slug: 'benteveo', name_es: 'Benteveo', kind: 'ave', region: 'arboleda', min_tier: 4,
    time_of_day: ['dia'], rarity: 1, domain_slug: 'animales',
    blurb_es: 'Come de todo: insectos, frutas, hasta peces chicos. Por eso está en toda la ciudad.' },
  { slug: 'algarrobo', name_es: 'Algarrobo', kind: 'arbol', region: 'arboleda', min_tier: 5,
    time_of_day: ['dia'], rarity: 2, domain_slug: 'alimentacion',
    blurb_es: 'Sus vainas dulces fueron harina y bebida mucho antes de que existiera el trigo acá.' },
  { slug: 'aguaribay', name_es: 'Aguaribay', kind: 'arbol', region: 'arboleda', min_tier: 5,
    time_of_day: ['dia'], rarity: 2, domain_slug: 'plantas',
    blurb_es: 'Da sombra y espanta insectos con su olor a pimienta. Por eso está en tantas plazas.' },
  { slug: 'chilca', name_es: 'Chilca', kind: 'arbusto', region: 'arboleda', min_tier: 5,
    time_of_day: ['dia'], rarity: 1, domain_slug: 'plantas',
    blurb_es: 'Arbusto pionero: es el primero en volver a un terreno pelado y prepara el suelo.' },
  { slug: 'mora_silvestre', name_es: 'Mora silvestre', kind: 'arbusto', region: 'arboleda', min_tier: 5,
    time_of_day: ['dia'], rarity: 1, domain_slug: 'alimentacion',
    blurb_es: 'Fruto que tiñe los dedos. Los pájaros la comen y plantan el arbusto varios kilómetros después.' },
  { slug: 'nido_hornero', name_es: 'Nido de hornero', kind: 'estructura', region: 'arboleda', min_tier: 5,
    time_of_day: ['dia'], rarity: 2, domain_slug: 'animales',
    blurb_es: 'Nunca lo reusa dos veces. El del año pasado ya es departamento de golondrinas o gorriones.' },
  { slug: 'carpintero_real', name_es: 'Carpintero real', kind: 'ave', region: 'arboleda', min_tier: 6,
    time_of_day: ['dia'], rarity: 3, domain_slug: 'animales',
    blurb_es: 'Los huecos que abre terminan siendo casa de loros, murciélagos y abejas nativas después.' },
  { slug: 'hongo_yema', name_es: 'Hongo de yema', kind: 'hongo', region: 'arboleda', min_tier: 6,
    time_of_day: ['amanecer', 'dia'], rarity: 2, domain_slug: 'plantas',
    blurb_es: 'Crece sobre el tronco vivo. Buena parte del árbol come gracias a hongos que no vemos.' },
  { slug: 'liquen_pulmonar', name_es: 'Liquen pulmonar', kind: 'hongo', region: 'arboleda', min_tier: 6,
    time_of_day: ['dia'], rarity: 3, domain_slug: 'aire_suelo',
    blurb_es: 'Solo vive donde el aire está limpio. Si aparece, tu aire mejoró; no es decoración.' },

  // ── El Río y la Laguna — tier 7 ───────────────────────────────────────────
  { slug: 'junco', name_es: 'Junco', kind: 'planta', region: 'rio', min_tier: 7,
    time_of_day: ['dia'], rarity: 1, domain_slug: 'agua',
    blurb_es: 'Filtra el agua que lo atraviesa. Un juncal sano limpia más que cualquier máquina chica.' },
  { slug: 'camalote', name_es: 'Camalote', kind: 'planta', region: 'rio', min_tier: 7,
    time_of_day: ['dia'], rarity: 1, domain_slug: 'agua_azul',
    blurb_es: 'Flota en balsas enormes y viaja río abajo llevando bichos, semillas y a veces yararás.' },
  { slug: 'iris_amarillo', name_es: 'Iris de agua', kind: 'planta', region: 'rio', min_tier: 7,
    time_of_day: ['dia'], rarity: 2, domain_slug: 'agua',
    blurb_es: 'Sus raíces atrapan metales del agua. Se usa para limpiar zanjas que nadie querría tocar.' },
  { slug: 'mojarra', name_es: 'Mojarra', kind: 'pez', region: 'rio', min_tier: 7,
    time_of_day: ['dia'], rarity: 1, domain_slug: 'agua_azul',
    blurb_es: 'Vive en cardumen para confundir. Cuando el agua se enturbia, es la primera que desaparece.' },
  { slug: 'tararira', name_es: 'Tararira', kind: 'pez', region: 'rio', min_tier: 7,
    time_of_day: ['atardecer', 'noche'], rarity: 3, domain_slug: 'agua_azul',
    blurb_es: 'Cazadora de emboscada entre los juncos. Aguanta agua con poco oxígeno mejor que casi todos.' },
  { slug: 'bagre_sapo', name_es: 'Bagre sapo', kind: 'pez', region: 'rio', min_tier: 7,
    time_of_day: ['noche'], rarity: 2, domain_slug: 'agua_azul',
    blurb_es: 'Busca comida con los bigotes en el fondo oscuro. No necesita ver para encontrar nada.' },
  { slug: 'rana_criolla', name_es: 'Rana criolla', kind: 'anfibio', region: 'rio', min_tier: 7,
    time_of_day: ['atardecer', 'noche'], rarity: 2, domain_slug: 'animales',
    blurb_es: 'Respira también por la piel, así que el agua sucia la afecta antes que a nadie.' },
  { slug: 'libelula', name_es: 'Libélula', kind: 'insecto', region: 'rio', min_tier: 7,
    time_of_day: ['dia'], rarity: 2, domain_slug: 'animales',
    blurb_es: 'Pasó casi toda su vida bajo el agua. Lo que ves volando son sus últimas semanas.' },
  { slug: 'martin_pescador', name_es: 'Martín pescador', kind: 'ave', region: 'rio', min_tier: 7,
    time_of_day: ['dia'], rarity: 3, domain_slug: 'agua_azul',
    blurb_es: 'Corrige solo la refracción del agua antes de tirarse. Calcula dónde está el pez, no dónde parece.' },
  { slug: 'garza_blanca', name_es: 'Garza blanca', kind: 'ave', region: 'rio', min_tier: 7,
    time_of_day: ['amanecer', 'dia'], rarity: 2, domain_slug: 'agua_azul',
    blurb_es: 'Espera inmóvil hasta veinte minutos. La paciencia le sale más barata que perseguir.' },

  // ── El Monte — tier 8 ─────────────────────────────────────────────────────
  { slug: 'cardon', name_es: 'Cardón', kind: 'planta', region: 'monte', min_tier: 8,
    time_of_day: ['dia'], rarity: 2, domain_slug: 'plantas',
    blurb_es: 'Crece un centímetro por año. El que ves de tres metros es más viejo que tu abuela.' },
  { slug: 'chaguar', name_es: 'Chaguar', kind: 'planta', region: 'monte', min_tier: 8,
    time_of_day: ['dia'], rarity: 2, domain_slug: 'consumo',
    blurb_es: 'De sus fibras salen bolsos que duran décadas. Textil sin fábrica, sin agua y sin tintura industrial.' },
  { slug: 'musgo_cueva', name_es: 'Musgo de cueva', kind: 'planta', region: 'monte', min_tier: 8,
    time_of_day: ['dia', 'noche'], rarity: 2, domain_slug: 'aire_suelo',
    blurb_es: 'Vive con la luz que apenas entra por la boca de la cueva. Le alcanza.' },
  { slug: 'cuarzo_blanco', name_es: 'Cuarzo blanco', kind: 'mineral', region: 'monte', min_tier: 8,
    time_of_day: ['dia'], rarity: 1, domain_slug: 'ciencia',
    blurb_es: 'Se formó despacio, en grietas, con agua caliente. Cada veta es una fisura que se curó.' },
  { slug: 'mica', name_es: 'Mica', kind: 'mineral', region: 'monte', min_tier: 8,
    time_of_day: ['dia'], rarity: 2, domain_slug: 'ciencia',
    blurb_es: 'Se abre en láminas finísimas. Antes de que existiera el vidrio, las ventanas eran de esto.' },
  { slug: 'condor', name_es: 'Cóndor andino', kind: 'ave', region: 'monte', min_tier: 8,
    time_of_day: ['dia'], rarity: 4, domain_slug: 'animales',
    blurb_es: 'Planea horas sin batir las alas. Aprovecha el aire caliente que sube del roquedal.' },
  { slug: 'murcielago_frutero', name_es: 'Murciélago frutero', kind: 'mamifero', region: 'monte', min_tier: 8,
    time_of_day: ['noche'], rarity: 3, domain_slug: 'animales',
    blurb_es: 'Planta más árboles que cualquier ave: come fruta volando y suelta las semillas lejos.' },
  { slug: 'lagartija_roquera', name_es: 'Lagartija de las rocas', kind: 'reptil', region: 'monte', min_tier: 8,
    time_of_day: ['dia'], rarity: 2, domain_slug: 'animales',
    blurb_es: 'Regula su temperatura cambiando de piedra. Es calefacción y aire acondicionado sin enchufe.' },

  // ── La Cumbre Nevada — tier 9 ─────────────────────────────────────────────
  { slug: 'yareta', name_es: 'Yareta', kind: 'planta', region: 'cumbre', min_tier: 9,
    time_of_day: ['dia'], rarity: 4, domain_slug: 'plantas',
    blurb_es: 'Parece una piedra verde y crece un milímetro por año. Algunas tienen más de mil años.' },
  { slug: 'llareta_flor', name_es: 'Flor de altura', kind: 'planta', region: 'cumbre', min_tier: 9,
    time_of_day: ['dia'], rarity: 3, domain_slug: 'plantas',
    blurb_es: 'Crece pegada al suelo para escapar del viento. Arriba de diez centímetros ya hace mucho frío.' },
  { slug: 'nieve_polvo', name_es: 'Nieve polvo', kind: 'fenomeno', region: 'cumbre', min_tier: 9,
    time_of_day: ['amanecer', 'dia'], rarity: 2, domain_slug: 'agua',
    blurb_es: 'Es agua guardada. Lo que se derrite en octubre es lo que toma el valle en enero.' },
  { slug: 'escarcha', name_es: 'Escarcha', kind: 'fenomeno', region: 'cumbre', min_tier: 9,
    time_of_day: ['amanecer'], rarity: 2, domain_slug: 'agua',
    blurb_es: 'Vapor que pasa directo a hielo sin ser agua nunca. Se llama sublimación inversa.' },
  { slug: 'huemul', name_es: 'Huemul', kind: 'mamifero', region: 'cumbre', min_tier: 9,
    time_of_day: ['amanecer', 'atardecer'], rarity: 4, domain_slug: 'animales',
    blurb_es: 'Quedan menos de dos mil. Está en el escudo nacional y casi nadie lo vio nunca.' },
  { slug: 'zorro_gris', name_es: 'Zorro gris', kind: 'mamifero', region: 'cumbre', min_tier: 9,
    time_of_day: ['atardecer', 'noche'], rarity: 3, domain_slug: 'animales',
    blurb_es: 'Come fruta además de carne, y así dispersa semillas por lugares donde ningún pájaro llega.' },
  { slug: 'chinchillon', name_es: 'Chinchillón', kind: 'mamifero', region: 'cumbre', min_tier: 9,
    time_of_day: ['amanecer', 'atardecer'], rarity: 3, domain_slug: 'animales',
    blurb_es: 'Vive entre las rocas y toma sol en grupo. Su pelo es de los más densos del mundo.' },
  { slug: 'rastro_puma', name_es: 'Rastro de puma', kind: 'rastro', region: 'cumbre', min_tier: 9,
    time_of_day: ['amanecer', 'noche'], rarity: 4, domain_slug: 'animales',
    blurb_es: 'Huella redonda, sin garras marcadas. Si la ves, él ya te vio hace un rato.' },

  // ── El Islote — tier 10 ───────────────────────────────────────────────────
  { slug: 'cachiyuyo', name_es: 'Cachiyuyo', kind: 'planta', region: 'islote', min_tier: 10,
    time_of_day: ['dia'], rarity: 2, domain_slug: 'agua_azul',
    blurb_es: 'Aguanta la sal que mata a casi todo. Fija la duna y frena el avance del mar.' },
  { slug: 'alga_parda', name_es: 'Alga parda', kind: 'alga', region: 'islote', min_tier: 10,
    time_of_day: ['dia'], rarity: 2, domain_slug: 'agua_azul',
    blurb_es: 'Los bosques de algas guardan tanto carbono por hectárea como un monte en tierra firme.' },
  { slug: 'cangrejo_cavador', name_es: 'Cangrejo cavador', kind: 'crustaceo', region: 'islote', min_tier: 10,
    time_of_day: ['dia', 'atardecer'], rarity: 2, domain_slug: 'agua_azul',
    blurb_es: 'Sus cuevas oxigenan el barro. Sin ellos el cangrejal se pudre en pocas temporadas.' },
  { slug: 'gaviotin', name_es: 'Gaviotín', kind: 'ave', region: 'islote', min_tier: 10,
    time_of_day: ['dia'], rarity: 3, domain_slug: 'animales',
    blurb_es: 'Algunos hacen el viaje más largo del planeta: de un polo al otro, todos los años.' },
  { slug: 'lobo_marino', name_es: 'Lobo marino', kind: 'mamifero', region: 'islote', min_tier: 10,
    time_of_day: ['dia'], rarity: 3, domain_slug: 'animales',
    blurb_es: 'Duerme con medio cerebro por vez para seguir subiendo a respirar sin ahogarse.' },
  { slug: 'cruz_del_sur', name_es: 'Cruz del Sur', kind: 'astro', region: 'islote', min_tier: 10,
    time_of_day: ['noche'], rarity: 3, domain_slug: 'ciencia',
    blurb_es: 'Cuatro estrellas que apuntan al sur. Sirvió de brújula mucho antes de que existiera el GPS.' },
];

/** Index by slug — the Bitácora looks rows up constantly. */
export const SPECIES_BY_SLUG: ReadonlyMap<string, SpeciesRow> = new Map(SPECIES.map((s) => [s.slug, s]));

/** Seasons bias which species show up, but never gate a mechanic (`08` §9). */
const SEASON_BIAS: Record<SeasonId, SpeciesRow['kind'][]> = {
  primavera: ['insecto', 'planta'],
  verano: ['insecto', 'reptil'],
  otono: ['hongo', 'ave'],
  invierno: ['fenomeno', 'mamifero'],
};

/**
 * Which species can appear here, now. Region and tier are hard filters; time of
 * day is a hard filter too (a firefly at noon reads as a bug); season only
 * re-orders, so nobody misses content by playing in March.
 */
export function speciesFor(region: RegionId, tier: number, tod: TimeOfDay, season: SeasonId): SpeciesRow[] {
  const favoured = SEASON_BIAS[season];
  return SPECIES.filter(
    (s) => s.region === region && s.min_tier <= tier && s.time_of_day.includes(tod),
  ).sort((a, b) => {
    const fa = favoured.includes(a.kind) ? 0 : 1;
    const fb = favoured.includes(b.kind) ? 0 : 1;
    return fa - fb || a.rarity - b.rarity || a.slug.localeCompare(b.slug);
  });
}

/**
 * Deterministic spawn positions for one species inside a set of candidate
 * points. Rarer species get fewer sightings; the same seed gives the same spots.
 */
export function spawnPoints(
  candidates: readonly [number, number][],
  species: SpeciesRow,
  seed: number,
): [number, number][] {
  if (candidates.length === 0) return [];
  const rng = mulberry32(hashInt(species.slug) ^ seed);
  const wanted = Math.max(1, Math.round(candidates.length / (species.rarity * 6)));
  const picked: [number, number][] = [];
  const used = new Set<number>();
  for (let i = 0; i < wanted * 4 && picked.length < wanted; i++) {
    const k = Math.floor(rng() * candidates.length);
    if (used.has(k)) continue;
    used.add(k);
    picked.push(candidates[k]!);
  }
  return picked;
}
