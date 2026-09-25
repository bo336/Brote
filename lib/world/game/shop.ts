/**
 * La Tienda — el almacén de Don Beto.
 *
 * Everything costs **world semillas**, which only playing earns and nothing
 * outside the world can spend or see. Some things also ask for materials: a
 * bench of recycled plastic needs the plastic, which is the point of it.
 *
 * The whole catalogue is always visible (`11-GAME-LOOP.md` §4): what your rank
 * has not discovered yet shows with its lock and the level that opens it. No
 * rotation, no expiry, nothing random.
 *
 * Mirrored in SQL as `world_items` (slug, kind, price, tier) so the server can
 * check that what a save owns was affordable at that rank. A test keeps the
 * two lists equal.
 */
import type { MaterialId } from './types';

export type ShopKind = 'decor' | 'habitat' | 'sobre';

export interface ShopItem {
  slug: string;
  kind: ShopKind;
  name: string;
  /** One line under the name. */
  desc: string;
  price: number;
  /** Materials on top of the semillas, when the thing is made of them. */
  mats?: Partial<Record<MaterialId, number>>;
  /** Rank tier that discovers it, and the division inside it (default 1). */
  tier: number;
  div?: number;
  /** For `sobre`: the plant it gives one seedling of. */
  plant?: string;
}

/**
 * Decoration. The first ten are the props the island has always had (their
 * slugs are the old `cosmetics` rows, so existing placements keep working);
 * the rest are new.
 */
const DECOR: ShopItem[] = [
  { slug: 'mundo_comedero', kind: 'decor', name: 'Comedero de pájaros', desc: 'Un poste con techito. Los pájaros lo van a encontrar.', price: 60, mats: { ramas: 3 }, tier: 1 },
  { slug: 'mundo_banco', kind: 'decor', name: 'Banco del mirador', desc: 'Madera gastada mirando al agua.', price: 90, mats: { ramas: 6 }, tier: 1 },
  { slug: 'mundo_hamaca', kind: 'decor', name: 'Hamaca paraguaya', desc: 'Colgada entre dos postes, se mueve con el viento.', price: 150, tier: 1 },
  { slug: 'banco_reciclado', kind: 'decor', name: 'Banco de plástico reciclado', desc: 'Hecho con lo que separaste en el Punto Limpio.', price: 60, mats: { reciclado: 12 }, tier: 1 },
  { slug: 'maceta', kind: 'decor', name: 'Maceta de barro', desc: 'Una maceta con flores del claro.', price: 30, tier: 1 },
  { slug: 'cartel', kind: 'decor', name: 'Cartel de madera', desc: 'Para ponerle nombre a un lugar.', price: 40, mats: { ramas: 3 }, tier: 1 },
  { slug: 'sendero_piedra', kind: 'decor', name: 'Piedras de paso', desc: 'Un caminito para no pisar lo que crece.', price: 20, mats: { piedras: 6 }, tier: 1 },
  { slug: 'mundo_colmena', kind: 'decor', name: 'Colmena', desc: 'Cajones apilados y abejas dando vueltas.', price: 160, tier: 2 },
  { slug: 'mundo_farolitos', kind: 'decor', name: 'Farolitos', desc: 'Una guirnalda sobre el sendero. De noche se prende.', price: 150, mats: { reciclado: 4 }, tier: 2 },
  { slug: 'mundo_arco', kind: 'decor', name: 'Arco de flores', desc: 'Un arco cubierto de enredaderas en flor.', price: 180, mats: { ramas: 8 }, tier: 2 },
  { slug: 'cerco', kind: 'decor', name: 'Cerco de palos', desc: 'Un tramo de cerco rústico.', price: 25, mats: { ramas: 4 }, tier: 2 },
  { slug: 'mesa_picnic', kind: 'decor', name: 'Mesa de picnic', desc: 'Para comer afuera mirando lo que plantaste.', price: 120, mats: { ramas: 8 }, tier: 2 },
  { slug: 'mundo_huerta', kind: 'decor', name: 'Huerta', desc: 'Cuatro canteros con verduras creciendo en hilera.', price: 200, mats: { compost: 4 }, tier: 3 },
  { slug: 'mundo_totem', kind: 'decor', name: 'Tótem de piedra', desc: 'Piedras apiladas que alguien equilibró con paciencia.', price: 120, mats: { piedras: 10 }, tier: 3 },
  { slug: 'mundo_carpa', kind: 'decor', name: 'Carpa', desc: 'Armada junto al fuego, lista para quedarse a dormir.', price: 220, tier: 3 },
  { slug: 'farol_solar', kind: 'decor', name: 'Farol solar', desc: 'Carga de día, alumbra de noche. Sin cables.', price: 110, mats: { reciclado: 4 }, tier: 3 },
  { slug: 'mundo_molino', kind: 'decor', name: 'Molino de viento', desc: 'Gira de verdad, más rápido cuando sopla fuerte.', price: 320, mats: { ramas: 10 }, tier: 4 },
  { slug: 'hamaca_arbol', kind: 'decor', name: 'Hamaca de rama', desc: 'Una tabla y dos sogas.', price: 90, mats: { ramas: 4 }, tier: 4 },
  { slug: 'pergola', kind: 'decor', name: 'Pérgola', desc: 'Sombra de madera para que trepe algo.', price: 260, mats: { ramas: 12 }, tier: 5 },
  { slug: 'estanque', kind: 'decor', name: 'Estanque', desc: 'Un espejo de agua chico. Llegan ranas.', price: 300, mats: { piedras: 12 }, tier: 6 },
  { slug: 'mirador', kind: 'decor', name: 'Mirador de madera', desc: 'Una plataforma para ver la isla desde arriba.', price: 400, mats: { ramas: 20 }, tier: 8 },
];

/**
 * Habitat. Each one is also what makes a restored parcel flourish, if it suits
 * the place (`plants.ts` PARCEL_TYPES[...].habitats).
 */
const HABITAT: ShopItem[] = [
  { slug: 'posadero', kind: 'habitat', name: 'Posadero', desc: 'Un palo alto donde se paran las aves a mirar.', price: 40, mats: { ramas: 3 }, tier: 1 },
  { slug: 'bebedero', kind: 'habitat', name: 'Bebedero', desc: 'Agua baja y limpia para aves e insectos.', price: 80, mats: { piedras: 4 }, tier: 2 },
  { slug: 'hotel_chico', kind: 'habitat', name: 'Refugio de abejas', desc: 'Cañas huecas donde anidan abejas nativas solitarias.', price: 70, mats: { ramas: 4 }, tier: 3 },
  { slug: 'caja_nido', kind: 'habitat', name: 'Caja nido', desc: 'Una casita con agujero a medida de un ave chica.', price: 60, mats: { ramas: 4 }, tier: 5 },
  { slug: 'refugio_ranas', kind: 'habitat', name: 'Refugio de ranas', desc: 'Piedras húmedas y sombra junto al agua.', price: 70, mats: { piedras: 6 }, tier: 7 },
  { slug: 'pirca', kind: 'habitat', name: 'Pirca', desc: 'Pared de piedra seca: casa de lagartijas y chinchillones.', price: 60, mats: { piedras: 10 }, tier: 8 },
];

/** A seedling of one discovered species, for when the vivero cannot keep up. */
function sobre(plant: string, name: string, price: number, tier: number): ShopItem {
  return { slug: `sobre_${plant}`, kind: 'sobre', name: `Plantín de ${name}`, desc: 'Un plantín listo para plantar.', price, tier, plant };
}

const SOBRES: ShopItem[] = [
  sobre('flechilla', 'flechilla', 22, 1),
  sobre('margarita_pampa', 'margarita de campo', 22, 1),
  sobre('chilca', 'chilca', 25, 1),
  sobre('cortadera', 'cortadera', 27, 2),
  sobre('verbena', 'verbena', 29, 3),
  sobre('lantana', 'lantana', 29, 3),
  sobre('salvia_azul', 'salvia azul', 32, 3),
  sobre('jazmin_pais', 'jazmín del país', 32, 3),
  sobre('tala', 'tala', 43, 4),
  sobre('ceibo', 'ceibo', 47, 4),
  sobre('algarrobo', 'algarrobo', 50, 5),
  sobre('aguaribay', 'aguaribay', 50, 5),
  sobre('junco', 'junco', 36, 7),
  sobre('camalote', 'camalote', 36, 7),
  sobre('cardon', 'cardón', 54, 8),
  sobre('chaguar', 'chaguar', 43, 8),
  sobre('yareta', 'yareta', 65, 9),
  sobre('llareta_flor', 'flor de altura', 47, 9),
  sobre('cachiyuyo', 'cachiyuyo', 47, 10),
];

export const SHOP: ShopItem[] = [...DECOR, ...HABITAT, ...SOBRES];

export const SHOP_BY_SLUG: ReadonlyMap<string, ShopItem> = new Map(SHOP.map((i) => [i.slug, i]));

/** Decoration and habitat are things you own and place; a `sobre` becomes a seedling at once. */
export function isPlaceable(slug: string): boolean {
  const k = SHOP_BY_SLUG.get(slug)?.kind;
  return k === 'decor' || k === 'habitat';
}
