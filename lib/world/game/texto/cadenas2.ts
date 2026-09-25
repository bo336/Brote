/**
 * The story chains, part two: from the undergrowth (tier 5) to the monument
 * (tier 11). Same voices and the same rules as `cadenas.ts`.
 */
import type { ChainDef } from '../missions';

const arbustos: ChainDef = {
  id: 'arbustos', tier: 5, region: 'arboleda',
  missions: [
    {
      id: 'arbustos.1', who: 'ines', title: 'Lo que hay abajo',
      ask: 'Hablá con Inés en La Arboleda.',
      intro: 'Un bosque no son sólo árboles. Abajo tiene que haber arbustos, flores, hojas caídas. Ahí vive casi todo lo que no ves.',
      done: 'Te traje un algarrobo. Es de los que más da.',
      goal: { k: 'talk', who: 'ines' }, target: { to: 'cast', who: 'ines' },
      reward: { sem: 10 },
    },
    {
      id: 'arbustos.2', who: 'ines', title: 'El algarrobo',
      ask: 'Plantá el algarrobo en La Arboleda.',
      done: 'Sus vainas fueron harina y bebida acá mucho antes que el trigo.',
      goal: { k: 'event', match: { type: 'planted', plant: 'algarrobo' }, n: 1 }, target: { to: 'parcel', stage: 4, region: 'arboleda' },
      gift: { sem: 0, plantines: { algarrobo: 1 } },
      reward: { sem: 30, card: 'p:algarrobo' },
    },
    {
      id: 'arbustos.3', who: 'mila', title: 'Cajas nido',
      ask: 'Comprá 2 cajas nido en la Tienda.',
      done: 'Los pájaros que anidan en huecos no encuentran árboles viejos. ¡Ahora sí!',
      goal: { k: 'event', match: { type: 'bought', item: 'caja_nido' }, n: 2 }, target: { to: 'none' },
      reward: { sem: 40, card: 'k:cavidades' },
    },
    {
      id: 'arbustos.4', who: 'ines', title: 'Bosque en flor',
      ask: 'Hacé florecer 2 parcelas de La Arboleda.',
      done: 'Tres especies, una caja nido y tiempo. Eso es un bosque.',
      goal: { k: 'state', test: { t: 'parcels', stage: 5, n: 2, region: 'arboleda' } }, target: { to: 'parcel', stage: 4, region: 'arboleda' },
      reward: { sem: 80 },
    },
    {
      id: 'arbustos.5', who: 'mila', title: 'El nido de barro',
      ask: 'Registrá un nido de hornero.',
      done: 'Nunca lo usa dos veces. El viejo se lo prestan a otros pájaros.',
      goal: { k: 'event', match: { type: 'logged', species: 'nido_hornero' }, n: 1 }, target: { to: 'region', id: 'arboleda' },
      reward: { sem: 25 },
    },
  ],
};

const dosel: ChainDef = {
  id: 'dosel', tier: 6, region: 'arboleda',
  missions: [
    {
      id: 'dosel.1', who: 'mila', title: 'La casa del árbol',
      ask: 'Mila te llama desde La Arboleda.',
      intro: '¡Hay una casita en el árbol grande! Don Beto dice que desde arriba se ve toda la isla. ¿Subimos?',
      done: 'Desde acá se ve todo lo que hicimos. ¡Es un montón!',
      goal: { k: 'talk', who: 'mila' }, target: { to: 'cast', who: 'mila' },
      reward: { sem: 10 },
    },
    {
      id: 'dosel.2', who: 'mila', title: 'El carpintero',
      ask: 'Registrá un carpintero real.',
      done: 'Los huecos que abre después son casa de loros, murciélagos y abejas.',
      goal: { k: 'event', match: { type: 'logged', species: 'carpintero_real' }, n: 1 }, target: { to: 'region', id: 'arboleda' },
      reward: { sem: 30 },
    },
    {
      id: 'dosel.3', who: 'ines', title: 'Lo que no se ve',
      ask: 'Registrá el hongo de yema.',
      done: 'Buena parte de un bosque come gracias a hongos que viven en las raíces.',
      goal: { k: 'event', match: { type: 'logged', species: 'hongo_yema' }, n: 1 }, target: { to: 'region', id: 'arboleda' },
      reward: { sem: 30, card: 'k:hongos' },
    },
    {
      id: 'dosel.4', who: 'ines', title: 'Más compost',
      ask: 'Mejorá la compostera al nivel 2.',
      done: 'Dos cajones: uno trabaja mientras el otro se llena.',
      goal: { k: 'state', test: { t: 'station', id: 'compostera', lvl: 2 } }, target: { to: 'station', id: 'compostera' },
      reward: { sem: 60 },
    },
    {
      id: 'dosel.5', who: 'don_beto', title: 'Diez en flor',
      ask: 'Tené 10 parcelas florecientes.',
      done: 'Diez lugares donde la vida se arregla sola. Ya casi no nos necesita.',
      goal: { k: 'state', test: { t: 'parcels', stage: 5, n: 10 } }, target: { to: 'parcel', stage: 4 },
      reward: { sem: 150, inv: { pergola: 1 } },
    },
  ],
};

const rio: ChainDef = {
  id: 'rio', tier: 7, region: 'rio',
  missions: [
    {
      id: 'rio.1', who: 'tuco', title: 'Tuco',
      ask: 'Hay un pescador en la orilla de La Laguna. Hablá con Tuco.',
      intro: 'Tuco. Pesco acá desde siempre. El río volvió, pero la orilla está pelada. Sin juncos, el agua se lleva todo.',
      done: 'Primero la orilla. Los peces vienen solos.',
      goal: { k: 'talk', who: 'tuco' }, target: { to: 'cast', who: 'tuco' },
      reward: { sem: 10 },
    },
    {
      id: 'rio.2', who: 'tuco', title: 'Juncos',
      ask: 'Plantá 3 juncos en el humedal. Te dejo tres.',
      done: 'El junco filtra el agua. Un juncal limpia más que cualquier máquina chica.',
      goal: { k: 'event', match: { type: 'planted', plant: 'junco' }, n: 3 }, target: { to: 'parcel', stage: 2, region: 'rio' },
      gift: { sem: 0, plantines: { junco: 3 } },
      reward: { sem: 30, card: 'p:junco' },
    },
    {
      id: 'rio.3', who: 'tuco', title: 'El iris amarillo',
      ask: 'Arrancá 2 invasoras del humedal.',
      done: 'Es lindo, sí. Pero donde crece el iris, el junco no vuelve.',
      goal: { k: 'state', test: { t: 'stat', key: 'pulled:rio', n: 2 } }, target: { to: 'parcel', stage: 0, region: 'rio' },
      reward: { sem: 40, card: 'i:iris_amarillo' },
    },
    {
      id: 'rio.4', who: 'tuco', title: 'Orilla viva',
      ask: 'Dejá 2 parcelas del humedal vivas.',
      done: 'Mirá el agua: ya se ve el fondo.',
      goal: { k: 'state', test: { t: 'parcels', stage: 4, n: 2, region: 'rio' } }, target: { to: 'parcel', stage: 0, region: 'rio' },
      reward: { sem: 60 },
    },
    {
      id: 'rio.5', who: 'don_beto', title: 'El puente',
      ask: 'Repará el puente viejo en su plataforma.',
      done: 'Pilotes nuevos y agua que pasa por abajo, como tiene que ser.',
      goal: { k: 'state', test: { t: 'station', id: 'puente', lvl: 1 } }, target: { to: 'station', id: 'puente' },
      reward: { sem: 60, card: 'e:puente' },
    },
    {
      id: 'rio.6', who: 'tuco', title: 'La primera mojarra',
      ask: 'Pescá algo en La Laguna.',
      done: 'Si es chica, se devuelve. Así el año que viene hay más.',
      goal: { k: 'event', match: { type: 'fished' }, n: 1 }, target: { to: 'region', id: 'rio' },
      reward: { sem: 25, card: 'k:pesca' },
    },
    {
      id: 'rio.7', who: 'tuco', title: 'El muelle',
      ask: 'Construí el muelle.',
      done: 'Desde acá se pesca en lo hondo. Y se ve el islote.',
      goal: { k: 'state', test: { t: 'station', id: 'muelle', lvl: 1 } }, target: { to: 'station', id: 'muelle' },
      reward: { sem: 60 },
    },
    {
      id: 'rio.8', who: 'tuco', title: 'Humedal entero',
      ask: 'Dejá 5 parcelas del humedal vivas.',
      done: 'Un humedal sano es una esponja: guarda agua cuando llueve y la larga cuando falta.',
      goal: { k: 'state', test: { t: 'parcels', stage: 4, n: 5, region: 'rio' } }, target: { to: 'parcel', stage: 0, region: 'rio' },
      reward: { sem: 120, inv: { refugio_ranas: 1 }, card: 'k:humedal' },
    },
  ],
};

const monte: ChainDef = {
  id: 'monte', tier: 8, region: 'monte',
  missions: [
    {
      id: 'monte.1', who: 'don_beto', title: 'La montaña',
      ask: 'Don Beto te espera al pie de El Monte.',
      intro: 'La montaña se levantó. Pero una ladera pelada se desarma con cada lluvia. Hay que sostenerla con piedra y con raíces.',
      done: 'Piedra primero, plantas después.',
      goal: { k: 'talk', who: 'don_beto' }, target: { to: 'cast', who: 'don_beto' },
      reward: { sem: 10 },
    },
    {
      id: 'monte.2', who: 'don_beto', title: 'Piedra sobre piedra',
      ask: 'Juntá 20 piedras.',
      done: 'Con estas armamos las pircas que sostienen la tierra.',
      goal: { k: 'event', match: { type: 'pickup', material: 'piedras' }, n: 20 }, target: { to: 'spawn', kind: 'piedras' },
      reward: { sem: 30 },
    },
    {
      id: 'monte.3', who: 'don_beto', title: 'Sostener la ladera',
      ask: 'Llevá 2 parcelas de El Monte hasta suelo firme (piedras en vez de compost).',
      done: 'Donde la ladera no se mueve, algo puede agarrarse.',
      goal: { k: 'state', test: { t: 'parcels', stage: 2, n: 2, region: 'monte' } }, target: { to: 'parcel', stage: 1, region: 'monte' },
      reward: { sem: 50, card: 'k:erosion' },
    },
    {
      id: 'monte.4', who: 'ines', title: 'Pinos que se escapan',
      ask: 'Arrancá 2 pinos invasores de El Monte.',
      done: 'Los pinos plantados se escapan a las sierras y secan el pastizal.',
      goal: { k: 'state', test: { t: 'stat', key: 'pulled:monte', n: 2 } }, target: { to: 'parcel', stage: 0, region: 'monte' },
      reward: { sem: 40, card: 'i:pino' },
    },
    {
      id: 'monte.5', who: 'ines', title: 'Cardones',
      ask: 'Plantá 2 cardones. Te traje dos.',
      done: 'Un centímetro por año. El que plantaste hoy lo van a ver tus nietos.',
      goal: { k: 'event', match: { type: 'planted', plant: 'cardon' }, n: 2 }, target: { to: 'parcel', stage: 2, region: 'monte' },
      gift: { sem: 0, plantines: { cardon: 2 } },
      reward: { sem: 40, card: 'p:cardon' },
    },
    {
      id: 'monte.6', who: 'don_beto', title: 'El refugio',
      ask: 'Construí el refugio de montaña.',
      done: 'Un techo, una estufa y la vista. No hace falta más.',
      goal: { k: 'state', test: { t: 'station', id: 'refugio', lvl: 1 } }, target: { to: 'station', id: 'refugio' },
      reward: { sem: 80, card: 'e:refugio' },
    },
    {
      id: 'monte.7', who: 'don_beto', title: 'Monte vivo',
      ask: 'Dejá 5 parcelas de El Monte vivas.',
      done: 'Ahora sí: la montaña retiene el agua en vez de largarla de golpe.',
      goal: { k: 'state', test: { t: 'parcels', stage: 4, n: 5, region: 'monte' } }, target: { to: 'parcel', stage: 0, region: 'monte' },
      reward: { sem: 130, inv: { pirca: 1 } },
    },
  ],
};

const cumbre: ChainDef = {
  id: 'cumbre', tier: 9, region: 'cumbre',
  missions: [
    {
      id: 'cumbre.1', who: 'ines', title: 'Arriba todo va despacio',
      ask: 'Inés subió a La Cumbre. Hablá con ella.',
      intro: 'Acá arriba todo va despacio. Una yareta tarda siglos. En la cumbre, cuidar lo que hay importa más que plantar.',
      done: 'Pisá por las piedras, no por las plantas.',
      goal: { k: 'talk', who: 'ines' }, target: { to: 'cast', who: 'ines' },
      reward: { sem: 10 },
    },
    {
      id: 'cumbre.2', who: 'ines', title: 'La yareta',
      ask: 'Plantá la yareta que te di.',
      done: 'Parece una piedra verde. Algunas tienen más de mil años.',
      goal: { k: 'event', match: { type: 'planted', plant: 'yareta' }, n: 1 }, target: { to: 'parcel', stage: 2, region: 'cumbre' },
      gift: { sem: 0, plantines: { yareta: 1 } },
      reward: { sem: 40, card: 'p:yareta' },
    },
    {
      id: 'cumbre.3', who: 'mila', title: 'El huemul',
      ask: 'Seguí los rastros y registrá un huemul.',
      done: '¡Quedan menos de dos mil! Y está en el escudo.',
      goal: { k: 'event', match: { type: 'logged', species: 'huemul' }, n: 1 }, target: { to: 'region', id: 'cumbre' },
      reward: { sem: 40, card: 'k:huemul' },
    },
    {
      id: 'cumbre.4', who: 'ines', title: 'Pastizal de altura',
      ask: 'Dejá 4 parcelas de La Cumbre vivas.',
      done: 'La nieve que se derrite acá es el agua del valle en verano.',
      goal: { k: 'state', test: { t: 'parcels', stage: 4, n: 4, region: 'cumbre' } }, target: { to: 'parcel', stage: 0, region: 'cumbre' },
      reward: { sem: 120, card: 'k:nieve' },
    },
  ],
};

const islote: ChainDef = {
  id: 'islote', tier: 10, region: 'islote',
  missions: [
    {
      id: 'islote.1', who: 'tuco', title: 'El islote',
      ask: 'Tuco te espera en el muelle.',
      intro: 'El islote. Hay que ir en bote. La duna se está yendo con el viento, y el faro de Don Beto está apagado hace años.',
      done: 'Vamos. Te llevo.',
      goal: { k: 'talk', who: 'tuco' }, target: { to: 'cast', who: 'tuco' },
      reward: { sem: 10 },
    },
    {
      id: 'islote.2', who: 'tuco', title: 'Duna firme',
      ask: 'Plantá 3 cachiyuyos en El Islote. Te dejo dos.',
      done: 'Aguanta la sal que mata a casi todo. Y sujeta la arena.',
      goal: { k: 'event', match: { type: 'planted', plant: 'cachiyuyo' }, n: 3 }, target: { to: 'parcel', stage: 2, region: 'islote' },
      gift: { sem: 0, plantines: { cachiyuyo: 2 } },
      reward: { sem: 40, card: 'p:cachiyuyo' },
    },
    {
      id: 'islote.3', who: 'ines', title: 'El tamarisco',
      ask: 'Arrancá el tamarisco invasor de El Islote.',
      done: 'Avanza sobre la costa y toma el lugar de las que fijan la duna.',
      goal: { k: 'state', test: { t: 'stat', key: 'pulled:islote', n: 1 } }, target: { to: 'parcel', stage: 0, region: 'islote' },
      reward: { sem: 30, card: 'i:tamarisco' },
    },
    {
      id: 'islote.4', who: 'don_beto', title: 'El faro',
      ask: 'Levantá el faro de Don Beto.',
      done: 'Cuarenta años sin luz. Y ahora la prende el sol.',
      goal: { k: 'state', test: { t: 'station', id: 'faro', lvl: 1 } }, target: { to: 'station', id: 'faro' },
      reward: { sem: 120, card: 'e:faro' },
    },
    {
      id: 'islote.5', who: 'mila', title: 'Lobos marinos',
      ask: 'Registrá un lobo marino.',
      done: '¡Duerme con medio cerebro por vez! Inés dice que es verdad.',
      goal: { k: 'event', match: { type: 'logged', species: 'lobo_marino' }, n: 1 }, target: { to: 'region', id: 'islote' },
      reward: { sem: 40 },
    },
  ],
};

const monumento: ChainDef = {
  id: 'monumento', tier: 11, region: 'monumento',
  missions: [
    {
      id: 'monumento.1', who: 'don_beto', title: 'Mirá para abajo',
      ask: 'Subí a El Monumento. Están todos ahí.',
      intro: 'Mirá para abajo. Todo esto lo hiciste vos, de a una parcela. Y cada flor de tu ceibo es algo que hiciste de verdad, afuera.',
      done: 'Nosotros ya no hacemos falta. Pero nos vamos a quedar igual.',
      goal: { k: 'talk', who: 'don_beto' }, target: { to: 'cast', who: 'don_beto' },
      reward: { sem: 20 },
    },
    {
      id: 'monumento.2', who: 'ines', title: 'La isla entera',
      ask: 'Tené 60 parcelas vivas.',
      done: 'Sesenta. Anoté cada una.',
      goal: { k: 'state', test: { t: 'parcels', stage: 4, n: 60 } }, target: { to: 'parcel', stage: 0 },
      reward: { sem: 300 },
    },
    {
      id: 'monumento.3', who: 'mila', title: 'Todo en flor',
      ask: 'Tené 30 parcelas florecientes.',
      done: 'Cuando sea grande voy a hacer esto de verdad. Ya sé cómo.',
      goal: { k: 'state', test: { t: 'parcels', stage: 5, n: 30 } }, target: { to: 'parcel', stage: 4 },
      reward: { sem: 400, inv: { mirador: 1 } },
    },
  ],
};

export const CHAINS_2: Record<string, ChainDef> = { arbustos, dosel, rio, monte, cumbre, islote, monumento };
