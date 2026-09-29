/**
 * La Guía de campo — what you learned, kept as cards.
 *
 * `docs/MUNDO_JUEGO.md` §3.9: the knowledge is the input of the verb (you sort
 * a battery into the special bin *because* you know), and the card is the
 * souvenir of having learned it. A card arrives as a small line, never a
 * modal, and the Guide is there to read or to ignore.
 *
 * Most cards are generated from the catalogues — every waste kind, invasive,
 * station and plant already carries its one-line lesson — so a new plant in
 * `plants.ts` is a new card with no second copy of its text. The `k:` cards
 * are the ones that are about an idea rather than a thing.
 */
import { INVASIVES, PLANTS } from '../plants';
import { STATIONS } from '../stations';
import { WASTE } from '../materials';
import type { StationId, WasteKind } from '../types';

export type CardCategory = 'residuos' | 'suelo' | 'agua' | 'plantas' | 'fauna' | 'invasoras' | 'energia';

export interface CardDef {
  id: string;
  title: string;
  text: string;
  who: string;
  cat: CardCategory;
}

const TOPICS: CardDef[] = [
  { id: 'k:plastico_mar', cat: 'residuos', who: 'tuco', title: 'De dónde viene', text: 'Casi toda la basura del mar viene de tierra firme: lo que queda en la calle llega al río, y del río al mar.' },
  { id: 'k:reducir', cat: 'residuos', who: 'don_beto', title: 'Antes que reciclar', text: 'Reciclar ayuda, pero lo mejor es no generar: una botella que se vuelve a llenar evita cientos de descartables.' },
  { id: 'k:suelo', cat: 'suelo', who: 'ines', title: 'Un suelo vivo', text: 'Un suelo sano es casi mitad poros, con aire y agua. El compost los abre y alimenta a millones de bichos que no vemos.' },
  { id: 'k:compost_mezcla', cat: 'suelo', who: 'ines', title: 'Verdes y secos', text: 'El compost anda mejor mezclando verdes (restos frescos) y secos (hojas, cartón). Sólo verdes, huele; sólo secos, no avanza.' },
  { id: 'k:erosion', cat: 'suelo', who: 'don_beto', title: 'Lo que sostiene una ladera', text: 'Sin raíces que la sujeten, la lluvia se lleva la tierra. Hacer suelo tarda siglos; perderlo, una tormenta.' },
  { id: 'k:regar_hora', cat: 'agua', who: 'ines', title: 'Cuándo regar', text: 'Regar temprano o al atardecer pierde menos agua por evaporación que regar al mediodía.' },
  { id: 'k:lluvia', cat: 'agua', who: 'don_beto', title: 'Un litro por milímetro', text: 'Cada milímetro de lluvia sobre un metro cuadrado de techo es un litro de agua. Un techo junta mucho más de lo que parece.' },
  { id: 'k:humedal', cat: 'agua', who: 'tuco', title: 'Una esponja', text: 'Un humedal guarda agua cuando llueve y la suelta despacio: frena inundaciones y sequías, y filtra el agua.' },
  { id: 'k:nieve', cat: 'agua', who: 'ines', title: 'Agua guardada', text: 'La nieve de la montaña se derrite de a poco y alimenta a los ríos durante el verano.' },
  { id: 'k:nativas', cat: 'plantas', who: 'ines', title: 'Por qué nativas', text: 'Las plantas nativas ya están adaptadas al clima de acá: necesitan menos riego y alimentan a la fauna del lugar.' },
  { id: 'k:diversidad', cat: 'plantas', who: 'ines', title: 'Muchas especies', text: 'Un lugar con muchas especies aguanta mejor una sequía o una plaga: si a una le va mal, otra ocupa su lugar.' },
  { id: 'k:pastizal', cat: 'plantas', who: 'mila', title: 'El pastizal', text: 'El pastizal pampeano es de los ambientes más transformados del país. Lo que queda de él vale muchísimo.' },
  { id: 'k:sombra', cat: 'plantas', who: 'don_beto', title: 'La sombra de un árbol', text: 'Bajo un árbol el suelo está varios grados más fresco. Una ciudad con árboles es una ciudad más fresca.' },
  { id: 'k:hongos', cat: 'plantas', who: 'ines', title: 'La red de abajo', text: 'Los hongos del suelo se unen a las raíces y cambian agua y minerales por azúcares. Un bosque también es una red.' },
  { id: 'k:polinizadores', cat: 'fauna', who: 'ines', title: 'Sin polinizadores', text: 'Sin polinizadores no hay frutos: buena parte de lo que comemos depende de abejas, mariposas y otros bichos.' },
  { id: 'k:especialistas', cat: 'fauna', who: 'ines', title: 'Una sola planta', text: 'Algunas mariposas dependen de una sola planta para sus orugas. Plantar nativas es darles lo único que pueden comer.' },
  { id: 'k:bebedero', cat: 'fauna', who: 'mila', title: 'Agua para todos', text: 'Un plato de agua baja con una piedra para pararse ayuda a aves y abejas. Cambiarla seguido evita mosquitos.' },
  { id: 'k:cavidades', cat: 'fauna', who: 'mila', title: 'Casas en huecos', text: 'Muchas aves anidan en huecos de árboles viejos. Donde no quedan árboles viejos, una caja nido los reemplaza.' },
  { id: 'k:madera_muerta', cat: 'fauna', who: 'ines', title: 'Madera muerta, vida', text: 'Un tronco caído es casa de hongos, escarabajos y lagartijas. Dejar algo de madera en el suelo es dejar vida.' },
  { id: 'k:pesca', cat: 'fauna', who: 'tuco', title: 'Pescar lo justo', text: 'Devolver los peces chicos les da tiempo de reproducirse. Por eso sigue habiendo peces al año siguiente.' },
  { id: 'k:huemul', cat: 'fauna', who: 'mila', title: 'El huemul', text: 'Es un ciervo andino en peligro. Protegerlo es proteger los bosques y pastizales donde vive.' },
  { id: 'k:luciernagas', cat: 'fauna', who: 'mila', title: 'Noches oscuras', text: 'Las luciérnagas necesitan noches oscuras: con luz artificial no se encuentran entre ellas.' },
  { id: 'k:invasoras', cat: 'invasoras', who: 'ines', title: 'Qué es una invasora', text: 'Una especie traída de otro lado que se expande sin control y desplaza a las de acá. No es mala: está fuera de lugar.' },
  { id: 'k:rebrote', cat: 'invasoras', who: 'ines', title: 'Vuelven a brotar', text: 'Las invasoras rebrotan de semillas que traen el viento y los pájaros. Se sacan de chicas, y cada tanto hay que mirar.' },
  { id: 'k:pulgones', cat: 'fauna', who: 'ines', title: 'Pulgones sin veneno', text: 'Donde hay vaquitas de San Antonio, los pulgones se controlan solos. Un veneno mataría a las dos.' },
  { id: 'k:viento', cat: 'residuos', who: 'don_beto', title: 'Lo que vuela', text: 'Una bolsa liviana viaja kilómetros con el viento hasta un río. Lo que no se ata, se vuela.' },
  { id: 'k:sequia', cat: 'agua', who: 'ines', title: 'Día de calor', text: 'Con calor, regá al pie de la planta y temprano: el agua llega a la raíz y no se pierde en el aire.' },
  { id: 'k:energia_solar', cat: 'energia', who: 'don_beto', title: 'Luz del sol', text: 'Un farol solar carga de día y alumbra de noche, sin cables y sin gastar nada que se acabe.' },
];

const CAST_NAME: Record<string, string> = { ines: 'Inés', tuco: 'Tuco', mila: 'Mila', don_beto: 'Don Beto' };

function build(): CardDef[] {
  const out: CardDef[] = [...TOPICS];
  for (const [k, w] of Object.entries(WASTE)) {
    out.push({ id: `w:${k}`, cat: 'residuos', who: 'don_beto', title: w.name, text: w.why });
  }
  for (const inv of Object.values(INVASIVES)) {
    out.push({ id: `i:${inv.id}`, cat: 'invasoras', who: 'ines', title: inv.name, text: inv.why });
  }
  for (const st of Object.values(STATIONS)) {
    out.push({ id: `e:${st.id}`, cat: st.id === 'faro' ? 'energia' : st.id === 'tanque' ? 'agua' : 'suelo', who: 'don_beto', title: st.name, text: st.teaches });
  }
  for (const p of Object.values(PLANTS)) {
    out.push({ id: `p:${p.id}`, cat: 'plantas', who: 'ines', title: p.name, text: p.role });
  }
  return out;
}

export const CARDS: CardDef[] = build();
export const CARD_BY_ID: ReadonlyMap<string, CardDef> = new Map(CARDS.map((c) => [c.id, c]));

export function castName(who: string): string {
  return CAST_NAME[who] ?? who;
}

export const wasteCard = (k: WasteKind) => `w:${k}`;
export const stationCard = (id: StationId) => `e:${id}`;
export const plantCard = (id: string) => `p:${id}`;
export const invasiveCard = (id: string) => `i:${id}`;
