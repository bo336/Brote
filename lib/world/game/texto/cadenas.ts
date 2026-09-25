/**
 * The story chains, part one: El Claro, La Pradera, El Jardín, La Arboleda.
 *
 * One chain per region, opened by the rank tier that discovers it. Told by the
 * island's four voices (`lib/world/cast.ts`): Inés, a botanist thirty years on
 * this coast; Tuco, a fisherman; Mila, a kid from the barrio; Don Beto, who
 * kept the lighthouse. **Nobody is ever disappointed in the player**, nobody
 * nags, and every "done" line says why the thing mattered in under ~25 words.
 */
import type { ChainDef } from '../missions';
import { CHAINS_2 } from './cadenas2';

const claro: ChainDef = {
  id: 'claro', tier: 1, region: 'claro',
  missions: [
    {
      id: 'claro.1', who: 'don_beto', title: 'La isla que te espera',
      ask: 'Hablá con Don Beto. Está junto a la plataforma del Punto Limpio.',
      intro: 'Llegaste. Esta isla estuvo mucho tiempo sola: basura que trae el mar, pasto seco, yuyos que no son de acá. Si la cuidamos, vuelve. Empecemos por lo fácil.',
      done: 'Todo lo que hagas acá queda. Nada se pierde si un día no venís.',
      goal: { k: 'talk', who: 'don_beto' }, target: { to: 'cast', who: 'don_beto' },
      reward: { sem: 10 },
    },
    {
      id: 'claro.2', who: 'don_beto', title: 'Lo que trae el mar',
      ask: 'Juntá 6 residuos. Se levantan solos cuando pasás cerca.',
      done: 'Cada cosa que juntás es una que no termina en el agua.',
      goal: { k: 'event', match: { type: 'pickup', material: 'residuos' }, n: 6 }, target: { to: 'spawn', kind: 'residuos' },
      reward: { sem: 15 },
    },
    {
      id: 'claro.3', who: 'don_beto', title: 'Cada cosa en su lugar',
      ask: 'Llevá los residuos al Punto Limpio y separá 6 en el contenedor que corresponde.',
      done: 'Separado, casi todo se puede recuperar. Mezclado, casi nada.',
      goal: { k: 'event', match: { type: 'sorted' }, n: 6 }, target: { to: 'station', id: 'punto_limpio' },
      reward: { sem: 20, card: 'e:punto_limpio' },
    },
    {
      id: 'claro.4', who: 'don_beto', title: 'Lo que se hace, se guarda',
      ask: 'Lo reciclado va al galpón. Juntá 4 ramas del piso: para construir hacen falta las dos cosas.',
      done: 'Con ramas y reciclado se levanta casi todo en esta isla.',
      goal: { k: 'event', match: { type: 'pickup', material: 'ramas' }, n: 4 }, target: { to: 'spawn', kind: 'ramas' },
      reward: { sem: 15 },
    },
    {
      id: 'claro.5', who: 'ines', title: 'Inés',
      ask: 'Hablá con Inés. Está al lado de las parcelas secas.',
      intro: 'Soy Inés. Hace treinta años que anoto las plantas de esta costa. ¿Ves esas parcelas peladas? Antes de plantar, hay que limpiarlas.',
      done: 'Vamos de a una. Una parcela limpia ya es otra cosa.',
      goal: { k: 'talk', who: 'ines' }, target: { to: 'cast', who: 'ines' },
      reward: { sem: 10 },
    },
    {
      id: 'claro.6', who: 'ines', title: 'Limpiar el terreno',
      ask: 'Limpiá una parcela: juntá su basura y arrancá la invasora, si tiene una.',
      done: 'El ligustro crece rápido y no deja vivir a las nativas. Por eso lo sacamos primero.',
      goal: { k: 'state', test: { t: 'parcels', stage: 1, n: 1 } }, target: { to: 'parcel', stage: 0 },
      reward: { sem: 25, card: 'i:ligustro' },
    },
    {
      id: 'claro.7', who: 'ines', title: 'La compostera',
      ask: 'Construí la compostera en su plataforma. Te van a hacer falta ramas y algo de reciclado.',
      done: 'Hojas, yerba, cáscaras: todo eso vuelve a ser tierra acá adentro.',
      goal: { k: 'state', test: { t: 'station', id: 'compostera', lvl: 1 } }, target: { to: 'station', id: 'compostera' },
      reward: { sem: 20, card: 'e:compostera' },
    },
    {
      id: 'claro.8', who: 'ines', title: 'Tierra que respira',
      ask: 'Cargá la compostera con 6 orgánicos: hojas del piso o lo orgánico que separaste.',
      done: 'Ahora esperá un rato. El compost trabaja solo, aunque te vayas.',
      goal: { k: 'event', match: { type: 'deposited', station: 'compostera' }, n: 6 }, target: { to: 'station', id: 'compostera' },
      reward: { sem: 15 },
    },
    {
      id: 'claro.9', who: 'ines', title: 'Suelo vivo',
      ask: 'Retirá compost de la compostera y ponelo en tu parcela limpia.',
      done: 'Tierra oscura y suelta. Ahí adentro hay más vida que en todo el barrio.',
      goal: { k: 'state', test: { t: 'parcels', stage: 2, n: 1 } }, target: { to: 'parcel', stage: 1 },
      reward: { sem: 25, card: 'k:suelo' },
    },
    {
      id: 'claro.10', who: 'ines', title: 'Las primeras nativas',
      ask: 'Te di cuatro plantines. Plantalos en la parcela con suelo vivo.',
      done: 'La chilca es pionera: prepara el lugar para las que vienen después.',
      goal: { k: 'state', test: { t: 'parcels', stage: 3, n: 1 } }, target: { to: 'parcel', stage: 2 },
      gift: { sem: 0, plantines: { flechilla: 2, chilca: 2 } },
      reward: { sem: 25, card: 'p:chilca' },
    },
    {
      id: 'claro.11', who: 'don_beto', title: 'Agua de lluvia',
      ask: 'Construí el tanque de lluvia, cargá la regadera y regá lo que plantaste.',
      done: 'Agua que cae del cielo y no sale de ninguna canilla. La mejor.',
      goal: { k: 'event', match: { type: 'watered' }, n: 1 }, target: { to: 'station', id: 'tanque' },
      reward: { sem: 30, card: 'e:tanque' },
    },
    {
      id: 'claro.12', who: 'ines', title: 'Mañana, otra vez',
      ask: 'Lo plantado necesita agua en dos días distintos. Volvé otro día y regalo de nuevo.',
      done: 'Mirá eso. Así se ve un pedazo de tierra que alguien cuidó.',
      goal: { k: 'state', test: { t: 'parcels', stage: 4, n: 1 } }, target: { to: 'parcel', stage: 3 },
      reward: { sem: 50, inv: { mundo_banco: 1 } },
    },
    {
      id: 'claro.13', who: 'ines', title: 'El vivero',
      ask: 'Construí el vivero. Con los frutos de lo que ya creció, vas a criar tus propios plantines.',
      done: 'Plantas de acá, de semillas de acá. Así se guarda un lugar.',
      goal: { k: 'state', test: { t: 'station', id: 'vivero', lvl: 1 } }, target: { to: 'station', id: 'vivero' },
      reward: { sem: 30, card: 'e:vivero' },
    },
    {
      id: 'claro.14', who: 'ines', title: 'Plantines propios',
      ask: 'Cosechá frutos de una parcela viva, cargá el vivero y retirá 2 plantines.',
      done: 'Ya no dependés de nadie para plantar. La isla se reproduce sola, con tu ayuda.',
      goal: { k: 'event', match: { type: 'collected', station: 'vivero' }, n: 2 }, target: { to: 'station', id: 'vivero' },
      reward: { sem: 30 },
    },
    {
      id: 'claro.15', who: 'don_beto', title: 'El claro entero',
      ask: 'Dejá 4 parcelas vivas.',
      done: 'Esto no lo veía así desde que era pibe. Y recién empieza.',
      goal: { k: 'state', test: { t: 'parcels', stage: 4, n: 4 } }, target: { to: 'parcel', stage: 0 },
      reward: { sem: 80, inv: { posadero: 1 } },
    },
    {
      id: 'claro.16', who: 'ines', title: 'Que florezca',
      ask: 'Una parcela florece con tres especies distintas y un refugio para la fauna. Probá con el posadero.',
      done: 'Tres especies y un lugar donde pararse: así empieza a volver la fauna.',
      goal: { k: 'state', test: { t: 'parcels', stage: 5, n: 1 } }, target: { to: 'parcel', stage: 4 },
      reward: { sem: 60, card: 'k:diversidad' },
    },
  ],
};

const pradera: ChainDef = {
  id: 'pradera', tier: 2, region: 'pradera',
  missions: [
    {
      id: 'pradera.1', who: 'mila', title: 'Mila',
      ask: 'Hay alguien nuevo en La Pradera. Hablá con Mila.',
      intro: '¡Hola! Soy Mila, vengo después de la escuela. Inés dice que ahora que se abrió La Pradera van a volver los horneros. ¿Me ayudás?',
      done: '¡Dale! Yo te voy diciendo lo que me enseña Inés.',
      goal: { k: 'talk', who: 'mila' }, target: { to: 'cast', who: 'mila' },
      reward: { sem: 10 },
    },
    {
      id: 'pradera.2', who: 'mila', title: 'El pastizal',
      ask: 'Llevá una parcela de La Pradera hasta que esté viva.',
      done: 'Inés dice que el pastizal pampeano es de los ambientes que más se perdieron. ¡Y lo estamos trayendo!',
      goal: { k: 'state', test: { t: 'parcels', stage: 4, n: 1, region: 'pradera' } }, target: { to: 'parcel', stage: 0, region: 'pradera' },
      reward: { sem: 40, card: 'k:pastizal' },
    },
    {
      id: 'pradera.3', who: 'mila', title: 'Cortaderas',
      ask: 'Te traje dos cortaderas. Plantalas en La Pradera.',
      done: 'De lejos brillan. De cerca, ¡cuidado que cortan!',
      goal: { k: 'event', match: { type: 'planted', plant: 'cortadera' }, n: 2 }, target: { to: 'parcel', stage: 2, region: 'pradera' },
      gift: { sem: 0, plantines: { cortadera: 2 } },
      reward: { sem: 25 },
    },
    {
      id: 'pradera.4', who: 'mila', title: 'El charco',
      ask: 'Cargá la regadera en el charco de La Pradera.',
      done: 'El charco junta agua de lluvia. Los pájaros vienen a tomar ahí.',
      goal: { k: 'event', match: { type: 'filled' }, n: 1 }, target: { to: 'water' },
      reward: { sem: 15 },
    },
    {
      id: 'pradera.5', who: 'mila', title: 'Un bebedero',
      ask: 'Comprá un bebedero en la Tienda de Don Beto.',
      done: 'En verano, un poco de agua baja y limpia le salva el día a un montón de bichos.',
      goal: { k: 'event', match: { type: 'bought', item: 'bebedero' }, n: 1 }, target: { to: 'none' },
      reward: { sem: 30, card: 'k:bebedero' },
    },
    {
      id: 'pradera.6', who: 'mila', title: 'Casa de hornero',
      ask: 'Buscá un hornero y registralo en la Bitácora.',
      done: '¡La puerta del nido está del lado contrario al viento! Te lo dije.',
      goal: { k: 'event', match: { type: 'logged', species: 'hornero' }, n: 1 }, target: { to: 'region', id: 'pradera' },
      reward: { sem: 25 },
    },
    {
      id: 'pradera.7', who: 'mila', title: 'Pastizal floreciente',
      ask: 'Hacé florecer una parcela de La Pradera: tres especies y un bebedero o un posadero.',
      done: 'Ahora sí hay dónde anidar, dónde tomar agua y qué comer.',
      goal: { k: 'state', test: { t: 'parcels', stage: 5, n: 1, region: 'pradera' } }, target: { to: 'parcel', stage: 4, region: 'pradera' },
      reward: { sem: 70 },
    },
    {
      id: 'pradera.8', who: 'mila', title: 'Toda la pradera',
      ask: 'Dejá 6 parcelas de La Pradera vivas.',
      done: 'Mañana traigo a mi hermano. No me va a creer.',
      goal: { k: 'state', test: { t: 'parcels', stage: 4, n: 6, region: 'pradera' } }, target: { to: 'parcel', stage: 0, region: 'pradera' },
      reward: { sem: 100, inv: { mesa_picnic: 1 } },
    },
  ],
};

const jardin: ChainDef = {
  id: 'jardin', tier: 3, region: 'jardin',
  missions: [
    {
      id: 'jardin.1', who: 'ines', title: 'El Jardín',
      ask: 'Inés te espera en El Jardín.',
      intro: 'Este es el lugar de las flores. Pero las flores no son para nosotros: son para quienes las polinizan. Plantemos para ellos.',
      done: 'Empezá con verbena y salvia. Son las favoritas de acá.',
      goal: { k: 'talk', who: 'ines' }, target: { to: 'cast', who: 'ines' },
      reward: { sem: 10 },
    },
    {
      id: 'jardin.2', who: 'ines', title: 'Flores nativas',
      ask: 'Plantá 3 flores en El Jardín. Te dejé verbena y salvia.',
      done: 'La verbena es una pista de aterrizaje para mariposas.',
      goal: { k: 'event', match: { type: 'planted', region: 'jardin' }, n: 3 }, target: { to: 'parcel', stage: 2, region: 'jardin' },
      gift: { sem: 0, plantines: { verbena: 2, salvia_azul: 1 } },
      reward: { sem: 30, card: 'p:verbena' },
    },
    {
      id: 'jardin.3', who: 'ines', title: 'Hotel de insectos',
      ask: 'Construí el hotel de insectos en su plataforma de El Jardín.',
      done: 'La mayoría de las abejas nativas vive sola, en un hueco. Ahora tienen dónde.',
      goal: { k: 'state', test: { t: 'station', id: 'hotel_insectos', lvl: 1 } }, target: { to: 'station', id: 'hotel_insectos' },
      reward: { sem: 40, card: 'e:hotel_insectos' },
    },
    {
      id: 'jardin.4', who: 'mila', title: 'Abejas sin aguijón',
      ask: 'Registrá una abeja nativa en la Bitácora.',
      done: '¡No pica! Y poliniza mejor que la europea un montón de plantas de acá.',
      goal: { k: 'event', match: { type: 'logged', species: 'abeja_nativa' }, n: 1 }, target: { to: 'region', id: 'jardin' },
      reward: { sem: 25 },
    },
    {
      id: 'jardin.5', who: 'ines', title: 'Un jardín vivo',
      ask: 'Dejá 3 parcelas de El Jardín vivas.',
      done: 'Mezclado y variado: un cantero así se enferma menos.',
      goal: { k: 'state', test: { t: 'parcels', stage: 4, n: 3, region: 'jardin' } }, target: { to: 'parcel', stage: 0, region: 'jardin' },
      reward: { sem: 60 },
    },
    {
      id: 'jardin.6', who: 'ines', title: 'Refugio de abejas',
      ask: 'Hacé florecer una parcela de El Jardín con un refugio de abejas.',
      done: 'Cañas huecas y flores cerca. No hace falta más.',
      goal: { k: 'state', test: { t: 'parcels', stage: 5, n: 1, region: 'jardin' } }, target: { to: 'parcel', stage: 4, region: 'jardin' },
      reward: { sem: 70 },
    },
    {
      id: 'jardin.7', who: 'mila', title: 'La mariposa bandera',
      ask: 'Registrá una mariposa bandera argentina.',
      done: 'Sus orugas comen una sola planta. Si esa planta no está, la mariposa tampoco.',
      goal: { k: 'event', match: { type: 'logged', species: 'mariposa_bandera' }, n: 1 }, target: { to: 'region', id: 'jardin' },
      reward: { sem: 30, card: 'k:especialistas' },
    },
    {
      id: 'jardin.8', who: 'ines', title: 'El jardín entero',
      ask: 'Dejá 6 parcelas de El Jardín vivas.',
      done: 'Treinta años mirando flores y todavía me emociona un jardín así.',
      goal: { k: 'state', test: { t: 'parcels', stage: 4, n: 6, region: 'jardin' } }, target: { to: 'parcel', stage: 0, region: 'jardin' },
      reward: { sem: 100, inv: { mundo_arco: 1 } },
    },
  ],
};

const arboleda: ChainDef = {
  id: 'arboleda', tier: 4, region: 'arboleda',
  missions: [
    {
      id: 'arboleda.1', who: 'don_beto', title: 'Donde había monte',
      ask: 'Don Beto te espera en La Arboleda.',
      intro: 'Cuando yo era chico, acá había monte: talas, ceibos. Se cortaron para leña. Vamos a devolverlos, de a uno.',
      done: 'Un árbol tarda. Por eso conviene plantarlo hoy.',
      goal: { k: 'talk', who: 'don_beto' }, target: { to: 'cast', who: 'don_beto' },
      reward: { sem: 10 },
    },
    {
      id: 'arboleda.2', who: 'don_beto', title: 'El primer árbol',
      ask: 'Plantá un tala o un ceibo en La Arboleda. Te traje dos talas.',
      done: 'El tala da frutos para media docena de aves distintas.',
      goal: { k: 'event', match: { type: 'planted', plant: ['tala', 'ceibo'] }, n: 1 }, target: { to: 'parcel', stage: 2, region: 'arboleda' },
      gift: { sem: 0, plantines: { tala: 2 } },
      reward: { sem: 30, card: 'p:tala' },
    },
    {
      id: 'arboleda.3', who: 'don_beto', title: 'Un bosquecito',
      ask: 'Dejá 3 parcelas de La Arboleda vivas.',
      done: 'Ya da sombra. Y la sombra es otro clima, más fresco y más húmedo.',
      goal: { k: 'state', test: { t: 'parcels', stage: 4, n: 3, region: 'arboleda' } }, target: { to: 'parcel', stage: 0, region: 'arboleda' },
      reward: { sem: 60, card: 'k:sombra' },
    },
    {
      id: 'arboleda.4', who: 'ines', title: 'Ramas caídas',
      ask: 'Juntá 15 ramas secas del piso.',
      done: 'Las ramas caídas se juntan; los árboles vivos no se tocan. Y algunas se dejan: son casa de insectos.',
      goal: { k: 'event', match: { type: 'pickup', material: 'ramas' }, n: 15 }, target: { to: 'spawn', kind: 'ramas' },
      reward: { sem: 25, card: 'k:madera_muerta' },
    },
    {
      id: 'arboleda.5', who: 'mila', title: 'El zorzal',
      ask: 'Registrá un zorzal colorado.',
      done: 'Canta antes de que salga el sol. ¡Y cada uno tiene su canción!',
      goal: { k: 'event', match: { type: 'logged', species: 'zorzal' }, n: 1 }, target: { to: 'region', id: 'arboleda' },
      reward: { sem: 25 },
    },
    {
      id: 'arboleda.6', who: 'don_beto', title: 'Bosque nativo',
      ask: 'Dejá 6 parcelas de La Arboleda vivas.',
      done: 'Un monte que vuelve. Mi viejo no lo hubiera creído.',
      goal: { k: 'state', test: { t: 'parcels', stage: 4, n: 6, region: 'arboleda' } }, target: { to: 'parcel', stage: 0, region: 'arboleda' },
      reward: { sem: 100, inv: { hamaca_arbol: 1 } },
    },
  ],
};

export const CHAINS: Record<string, ChainDef> = {
  claro, pradera, jardin, arboleda, ...CHAINS_2,
};

export const CHAIN_ORDER: string[] = Object.values(CHAINS)
  .sort((a, b) => a.tier - b.tier)
  .map((c) => c.id);
