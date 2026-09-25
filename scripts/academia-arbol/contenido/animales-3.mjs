import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// ANIMALES 3 — Especies en peligro.
// Cómo se mide el riesgo de extinción (la Lista Roja), qué especies
// argentinas están amenazadas, por qué algunas son más vulnerables, qué es
// una extinción y cómo se recupera una especie. Retoma la biodiversidad y
// las especies clave (animales-1) y la fauna urbana (animales-2).

export default unidad({
  slug: 'animales-3',
  rama: 'animales',
  orden: 3,
  nivel: 2,
  requiereTronco: 2,
  titulo: 'Especies en peligro',
  bajada: 'Del yaguareté al macá tobiano: cómo se mide el riesgo de extinción, qué hace a una especie vulnerable y cómo se recupera una población.',
  objetivos: [
    'Interpretar las categorías de la Lista Roja de la UICN',
    'Reconocer especies amenazadas de Argentina y sus causas',
    'Explicar qué características hacen más vulnerable a una especie',
    'Distinguir extinción local, en estado silvestre y global',
    'Describir estrategias para recuperar especies amenazadas',
  ],
  repasa: ['animales-1', 'animales-2', 'tronco-1'],
  fuentes: ['iucn-red-list', 'iucn-categorias', 'sarem-2019', 'aves-argentinas-amenazadas', 'ipbes-global', 'rewilding-argentina', 'parques-nacionales'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('La Lista Roja', 'Cómo la UICN clasifica el riesgo de extinción de las especies y qué dicen sus números.', [
      teoria('Un termómetro del riesgo', [
        'La Unión Internacional para la Conservación de la Naturaleza (UICN) evalúa el riesgo de extinción de las especies y lo publica en la Lista Roja. Usa categorías: Extinta (EX), Extinta en estado silvestre (EW), En peligro crítico (CR), En peligro (EN), Vulnerable (VU), Casi amenazada (NT) y Preocupación menor (LC). Cuando no hay datos suficientes, la especie queda como Datos insuficientes (DD).',
        'Las especies en las categorías CR, EN y VU se consideran amenazadas.',
      ], { lista: ['EX · Extinta', 'EW · Extinta en estado silvestre', 'CR · En peligro crítico', 'EN · En peligro', 'VU · Vulnerable', 'NT · Casi amenazada', 'LC · Preocupación menor'] }),
      ord('Ordená estas categorías de la Lista Roja de menor a mayor riesgo.', [ // e1
        'Preocupación menor (LC)',
        'Casi amenazada (NT)',
        'Vulnerable (VU)',
        'En peligro (EN)',
        'En peligro crítico (CR)',
      ], 'Cada escalón indica un riesgo de extinción mayor.', { d: 1, extremos: ['Menor riesgo', 'Mayor riesgo'] }),
      clas('¿Esta categoría cuenta como "amenazada" o no?', { // e2
        'Amenazada': ['En peligro crítico (CR)', 'En peligro (EN)', 'Vulnerable (VU)'],
        'No amenazada (todavía)': ['Casi amenazada (NT)', 'Preocupación menor (LC)'],
      }, 'Solo CR, EN y VU son "amenazadas". NT es una alerta: podría pasar a amenazada pronto.', { d: 2 }),
      teoria('Los criterios', [
        'Para asignar una categoría, la UICN usa criterios medibles: qué tan rápido disminuye la población, qué tan chica es su distribución, cuántos individuos adultos quedan y si esa población está fragmentada o en declive. Por ejemplo, una especie con menos de 50 individuos maduros califica como En peligro crítico, aunque no se conozcan otros datos.',
        'Así, la categoría no es una opinión: surge de datos y umbrales definidos.',
      ]),
      mult('¿Qué datos usa la UICN para evaluar el riesgo de una especie? Marcá todos.', [ // e3
        '+Qué tan rápido disminuye su población',
        '+El tamaño de su área de distribución',
        '+Cuántos individuos adultos quedan',
        '+Si la población está fragmentada',
        '-Qué tan linda es la especie',
      ], 'Criterios medibles, no la popularidad de la especie.', { d: 1 }),
      teoria('Los números', [
        'La Lista Roja ya evaluó más de 160.000 especies, y más de 45.000 están amenazadas: alrededor de una de cada cuatro. Algunos grupos están especialmente en riesgo: alrededor del 40 % de los anfibios y más de un tercio de los tiburones y rayas y de los corales de arrecife.',
        'Hay que recordar que solo se evaluó una parte chica de todas las especies del planeta.',
      ], {
        datos: barras('Especies amenazadas en algunos grupos evaluados (aproximado)', '% amenazado', [
          ['Corales de arrecife', 44],
          ['Anfibios', 41],
          ['Tiburones y rayas', 37],
          ['Mamíferos', 26],
          ['Aves', 12],
        ], 'Lista Roja de la UICN, valores aproximados de evaluaciones recientes.'),
      }),
      rank('Según la Lista Roja, ordená estos grupos por el porcentaje de especies amenazadas, de mayor a menor.', [ // e4
        ['Corales de arrecife', '≈ 44 %'],
        ['Anfibios', '≈ 41 %'],
        ['Mamíferos', '≈ 26 %'],
        ['Aves', '≈ 12 %'],
      ], 'Los anfibios y los corales están entre los grupos más amenazados del planeta.', { d: 2 }),
      numv(3, (i) => { // e5
        const ev = [160000, 150000, 166000][i];
        const am = [45000, 42000, 46000][i];
        return {
          enunciado: `Si se evaluaron ${ev.toLocaleString('es-AR')} especies y ${am.toLocaleString('es-AR')} están amenazadas, ¿qué porcentaje está amenazado? Redondeá al entero.`,
          valor: Math.round((am / ev) * 100),
          unidad: '%',
          tol: 1,
          explicacion: `${am.toLocaleString('es-AR')} ÷ ${ev.toLocaleString('es-AR')} × 100 ≈ ${Math.round((am / ev) * 100)} %: alrededor de una de cada cuatro especies evaluadas.`,
        };
      }, { d: 2 }),
      vf('Si una especie no aparece como amenazada en la Lista Roja, seguro está bien.', false, 'Puede que no haya sido evaluada, o que esté como Datos insuficientes. Solo una parte chica de las especies del planeta fue evaluada.', { // e6
        razones: ['+Porque muchas especies no fueron evaluadas o faltan datos', '-Porque la Lista Roja incluye todas las especies del planeta', '-Porque las especies no evaluadas son siempre abundantes'],
        d: 2,
      }),
      par('Uní cada categoría con su significado.', [ // e7
        ['EW', 'Solo sobrevive en cautiverio'],
        ['CR', 'Riesgo extremadamente alto de extinción'],
        ['NT', 'Cerca de ser amenazada'],
        ['DD', 'No hay datos suficientes para evaluarla'],
      ], 'Conocer las siglas permite leer cualquier ficha de especie.', { d: 2 }),
      det('Leé esta nota y marcá lo equivocado.', [ // e8
        ['La Lista Roja la publica la UICN.', false],
        ['Las especies "Casi amenazadas" cuentan como amenazadas.', true, 'Solo CR, EN y VU cuentan como amenazadas; NT es una alerta.'],
        ['Alrededor de un cuarto de las especies evaluadas está amenazado.', false],
        ['La categoría se decide según qué tan conocida es la especie.', true, 'Se decide con criterios medibles de población y distribución.'],
      ], 'La Lista Roja es una herramienta científica, no un ranking de popularidad.', { d: 2 }),
      op('Una rana fue vista pocas veces y nadie sabe cuántas quedan. ¿Qué categoría le corresponde hasta tener más datos?', [ // e10
        'Datos insuficientes (DD)',
        'Preocupación menor (LC), por ahora',
        ['Extinta (EX), por las dudas', 'Para declarar extinta a una especie hay que buscarla a fondo sin encontrarla.'],
        'En peligro crítico (CR), automáticamente',
      ], 'Sin datos no se puede asignar un nivel de riesgo. DD no significa "a salvo": muchas especies DD podrían estar amenazadas.', { d: 2 }),
      vf('Una especie que solo sobrevive en zoológicos y criaderos se considera Extinta en estado silvestre, no Extinta.', true, 'Mientras queden individuos en cautiverio es EW; todavía existe la posibilidad de reintroducirla en la naturaleza.', { // e11
        razones: ['+Porque todavía quedan individuos vivos en cautiverio', '-Porque los zoológicos cuentan como naturaleza', '-Porque EW y EX significan exactamente lo mismo'],
        d: 2,
      }),
      comp('Completá.', 'La Lista [Roja] la publica la UICN; las categorías amenazadas son CR, EN y [VU]; y alrededor de una de cada [cuatro] especies evaluadas está amenazada.', ['Verde', 'LC', 'diez'], 'Tres claves para leer la Lista Roja y cualquier ficha de especie.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Especies argentinas en peligro', 'Yaguareté, huemul, macá tobiano, cardenal amarillo y cauquén colorado: quiénes son y qué los amenaza.', [
      teoria('Evaluaciones nacionales', [
        'Además de la Lista Roja mundial, cada país evalúa sus especies. En Argentina, por ejemplo, la Sociedad Argentina para el Estudio de los Mamíferos (SAREM) y Aves Argentinas publicaron categorizaciones nacionales. Una especie puede estar menos amenazada a nivel mundial que en un país, si en ese país quedan pocos individuos.',
        'El yaguareté es un ejemplo: a nivel mundial está Casi amenazado, pero en Argentina está En peligro crítico, porque quedan pocos cientos de ejemplares y perdió la mayor parte de su distribución histórica.',
      ]),
      vf('Una especie puede estar en distinta categoría de riesgo a nivel mundial y a nivel nacional.', true, 'Sí: el yaguareté está Casi amenazado en el mundo, pero En peligro crítico en Argentina, donde quedan pocos cientos.', { // e1
        razones: ['+Porque su situación puede ser distinta en cada país', '-Porque las categorías son siempre idénticas', '-Porque solo existen evaluaciones mundiales'],
        d: 2,
      }),
      teoria('Algunos casos', [
        'El huemul, un ciervo de los bosques andino-patagónicos, está En peligro: quedan poblaciones chicas y aisladas, afectadas por la pérdida de hábitat, la caza, perros y enfermedades del ganado. El macá tobiano, un ave que solo vive en lagunas de la meseta de Santa Cruz, está En peligro crítico: lo afectan el visón americano, una especie invasora, las truchas introducidas que compiten por alimento y los cambios en las lagunas.',
        'El cardenal amarillo está En peligro por la captura para el comercio de aves de jaula y la pérdida de hábitat. Y el cauquén colorado, un ganso que migra entre la Patagonia y el sur bonaerense, está En peligro crítico en Argentina, con muy pocos ejemplares.',
      ]),
      par('Uní cada especie con su principal amenaza.', [ // e2
        ['Yaguareté', 'Pérdida de selva y caza'],
        ['Macá tobiano', 'Visón americano invasor y truchas introducidas'],
        ['Cardenal amarillo', 'Captura para aves de jaula'],
        ['Huemul', 'Poblaciones chicas y aisladas, perros y enfermedades del ganado'],
      ], 'Cada especie amenazada tiene su historia. Conocerla dice qué hacer.', { d: 2 }),
      clas('¿Dónde vive cada especie amenazada?', { // e3
        'Selva y bosques del norte': ['Yaguareté', 'Tatú carreta'],
        'Patagonia': ['Macá tobiano', 'Huemul'],
        'Pastizales y espinal del centro': ['Cardenal amarillo', 'Venado de las pampas'],
      }, 'Especies amenazadas en casi todas las regiones del país.', { d: 3 }),
      numv(3, (i) => { // e4
        const hist = [100, 80, 95][i];
        const hoy = [5, 4, 3][i];
        return {
          enunciado: `Si una especie ocupaba ${hist} unidades de territorio en Argentina y hoy ocupa ${hoy}, ¿qué porcentaje de su distribución histórica conserva? Redondeá a un decimal.`,
          valor: Math.round((hoy / hist) * 1000) / 10,
          unidad: '%',
          dec: 1,
          tol: 0.1,
          explicacion: `${hoy} ÷ ${hist} × 100 ≈ ${(Math.round((hoy / hist) * 1000) / 10).toLocaleString('es-AR')} %. El yaguareté, por ejemplo, perdió la gran mayoría de su distribución histórica en el país.`,
        };
      }, { d: 2 }),
      op('¿Por qué el macá tobiano es tan vulnerable?', [ // e5
        'Vive solo en algunas lagunas de Santa Cruz',
        'Porque está en todas las lagunas del país',
        ['Porque migra a Europa cada invierno', 'Migra dentro de la región patagónica y la costa; su problema es su distribución muy reducida.'],
        'Porque es una especie exótica',
      ], 'Una especie que vive en pocos lugares puede perderlo todo con pocos cambios. Es endémica de la meseta santacruceña.', { d: 2 }),
      cad('Armá la cadena de cómo el visón americano amenaza al macá tobiano.', [ // e6
        'Se trajeron visones americanos para criaderos de pieles',
        'Algunos escaparon y se establecieron en la Patagonia',
        'Llegaron a las lagunas donde anida el macá tobiano',
        'Depredan huevos, pichones y adultos',
        'La población de macá tobiano cae',
      ], ['Los macás aprendieron a comer visones'], 'Una especie exótica liberada puede poner en riesgo a una especie que solo vive allí.', { d: 2 }),
      mult('¿Qué especies argentinas están amenazadas a nivel nacional? Marcá todas.', [ // e7
        '+Yaguareté',
        '+Huemul',
        '+Macá tobiano',
        '+Cardenal amarillo',
        '-Paloma doméstica',
      ], 'La paloma doméstica es exótica y muy abundante: no está amenazada.', { d: 1 }),
      det('Leé este texto escolar y marcá lo equivocado.', [ // e8
        ['El huemul vive en los bosques andino-patagónicos.', false],
        ['El yaguareté está fuera de peligro en Argentina.', true, 'En Argentina está En peligro crítico; quedan pocos cientos.'],
        ['El cardenal amarillo sufre la captura para aves de jaula.', false],
        ['El macá tobiano vive en todas las lagunas del país.', true, 'Solo vive en algunas lagunas de la meseta de Santa Cruz.'],
      ], 'Conocer las especies de tu país es el primer paso para protegerlas.', { d: 2 }),
      comp('Completá.', 'En Argentina, el yaguareté está en peligro [crítico]; el macá tobiano vive en lagunas de [Santa Cruz]; y el cardenal amarillo sufre la captura para aves de [jaula].', ['leve', 'Misiones', 'corral'], 'Tres datos sobre especies argentinas amenazadas.', { d: 2 }),
      ord('Ordená el viaje anual del cauquén colorado, empezando en primavera.', [ // e10
        'Llega a la Patagonia austral a reproducirse',
        'Cría a sus pichones durante el verano',
        'En otoño vuela hacia el norte',
        'Pasa el invierno en el sur de Buenos Aires',
      ], 'Al migrar, una especie depende de varios lugares a la vez: si cualquiera se degrada, la población sufre.', { d: 2, extremos: ['Primavera', 'Invierno'] }),
      est('Estimá cuántos yaguaretés quedan en estado silvestre en Argentina.', 250, { min: 10, max: 100000, unidad: 'individuos', escala: 'log' }, 'Del orden de pocos cientos, según las estimaciones de los últimos años. Por eso está En peligro crítico en el país.', { d: 3 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Por qué algunas especies son más vulnerables', 'Tamaño, reproducción lenta, distribución reducida y dieta especializada: rasgos que aumentan el riesgo.', [
      teoria('Rasgos de riesgo', [
        'No todas las especies responden igual a las amenazas. Suelen ser más vulnerables las especies grandes, que necesitan mucho territorio; las que se reproducen lento, con pocas crías y mucho tiempo entre una y otra; las que viven en un área muy chica o en un solo tipo de ambiente (endémicas o de distribución restringida); y las especialistas, que dependen de un alimento o un hábitat muy particular.',
        'Las especies generalistas, que comen de todo y viven en muchos ambientes, suelen adaptarse mejor a los cambios.',
      ]),
      clas('¿Este rasgo aumenta o reduce la vulnerabilidad de una especie?', { // e1
        'Aumenta la vulnerabilidad': ['Tener una cría cada dos o tres años', 'Vivir en una sola laguna', 'Comer un solo tipo de alimento'],
        'Reduce la vulnerabilidad': ['Tener muchas crías por año', 'Vivir en muchos ambientes', 'Comer de todo'],
      }, 'La biología de cada especie define cuánto resiste los cambios.', { d: 2 }),
      par('Uní cada especie con el rasgo que la hace más vulnerable.', [ // e2
        ['Yaguareté', 'Necesita territorios enormes'],
        ['Macá tobiano', 'Distribución muy reducida'],
        ['Oso hormiguero', 'Dieta muy especializada en hormigas y termitas'],
        ['Cóndor andino', 'Se reproduce muy lento'],
      ], 'Cada rasgo es una debilidad frente a las amenazas humanas.', { d: 3 }),
      teoria('La reproducción lenta', [
        'El cóndor andino pone, en general, un solo huevo cada dos o tres años, y tarda varios años en llegar a la edad adulta. Si mueren adultos por envenenamiento, la población tarda muchísimo en recuperarse. Una especie de ratón, en cambio, puede tener varias camadas por año.',
      ]),
      numv(3, (i) => { // e3
        const anos = [20, 30, 10][i];
        const int = [2, 3, 2][i];
        return {
          enunciado: `Si una pareja de cóndores cría un pichón cada ${int} años, ¿cuántos pichones puede criar en ${anos} años de vida reproductiva, como máximo?`,
          valor: Math.floor(anos / int),
          unidad: 'pichones',
          explicacion: `${anos} ÷ ${int} = ${Math.floor(anos / int)} pichones como máximo. Por eso perder un solo adulto por envenenamiento es un golpe enorme para la población.`,
        };
      }, { d: 2 }),
      cad('Armá la cadena de por qué perder adultos es tan grave para el cóndor.', [ // e4
        'Un cebo envenenado mata a varios cóndores adultos',
        'Esos adultos ya no se reproducen',
        'Cada pareja cría un pichón cada dos o tres años',
        'Los pichones tardan años en ser adultos',
        'La población tarda décadas en recuperarse',
      ], ['Los cóndores ponen muchos huevos para compensar'], 'Especies de vida lenta necesitan que los adultos sobrevivan.', { d: 2 }),
      vf('Una especie que come de todo y vive en muchos ambientes suele adaptarse mejor a los cambios que una especialista.', true, 'Las generalistas tienen más opciones cuando su ambiente cambia; las especialistas dependen de recursos muy particulares.', { // e5
        razones: ['+Porque tiene más opciones cuando el ambiente cambia', '-Porque las generalistas no necesitan comer', '-Porque las especialistas se adaptan más rápido'],
        d: 2,
      }),
      teoria('Endémicas', [
        'Una especie endémica vive solo en un lugar del mundo. Argentina tiene muchas especies endémicas, como el macá tobiano, la ranita de Valcheta, que vive solo en unos arroyos termales de la meseta de Somuncurá, y muchas plantas de la Puna y de las sierras. Si su único lugar se degrada, no tienen a dónde ir.',
      ]),
      op('¿Qué significa que una especie sea endémica de Argentina?', [ // e6
        'Que vive naturalmente solo en Argentina',
        'Que está enferma',
        ['Que es muy abundante en todo el mundo', 'Endémica es lo contrario: vive en un solo lugar.'],
        'Que fue traída de otro país',
      ], 'Proteger las especies endémicas es una responsabilidad única: si desaparecen de acá, desaparecen del mundo.', { d: 1 }),
      rank('Ordená estas especies de más a menos vulnerable, según sus rasgos.', [ // e7
        ['Especie grande, endémica de una laguna, con una cría por año', 'muy vulnerable'],
        ['Especie grande de amplia distribución, con pocas crías', 'vulnerable'],
        ['Especie chica de amplia distribución, con varias crías', 'poco vulnerable'],
        ['Especie generalista que vive en ciudades y campos', 'muy poco vulnerable'],
      ], 'Tamaño, distribución y reproducción se combinan en el riesgo.', { d: 3, extremos: ['Más vulnerable', 'Menos vulnerable'] }),
      mult('¿Qué rasgos tiene una especie muy vulnerable? Marcá todos.', [ // e8
        '+Distribución muy reducida',
        '+Reproducción lenta',
        '+Dieta especializada',
        '+Necesidad de grandes territorios',
        '-Muchas crías por año',
      ], 'Estos rasgos no condenan a una especie, pero la hacen más frágil frente a las amenazas.', { d: 1 }),
      det('Leé este comentario y marcá lo equivocado.', [ // e9
        ['El cóndor andino se reproduce lento.', false],
        ['Las especies endémicas pueden mudarse a cualquier otro país si su hábitat se degrada.', true, 'Suelen depender de condiciones que solo existen en su lugar.'],
        ['El oso hormiguero tiene una dieta especializada.', false],
        ['Las especies grandes nunca están en riesgo porque son fuertes.', true, 'Suelen ser más vulnerables: necesitan mucho territorio y se reproducen lento.'],
      ], 'La biología de una especie ayuda a entender su riesgo.', { d: 2 }),
      op('Un zorro gris y un macá tobiano pierden parte de su ambiente. ¿Cuál corre más riesgo?', [ // e10
        'El macá, que depende de pocas lagunas',
        'El zorro, porque es más grande',
        ['Los dos igual, porque son animales', 'Sus rasgos son muy distintos: el zorro vive en muchos ambientes y come de todo.'],
        'Ninguno, porque se adaptan enseguida',
      ], 'El zorro gris es generalista y de amplia distribución; el macá tobiano es endémico y especialista.', { d: 2 }),
      comp('Completá.', 'Una especie que vive en un solo lugar del mundo es [endémica]; las que comen de todo son [generalistas]; y las de reproducción [lenta] se recuperan más despacio.', ['exótica', 'especialistas', 'rápida'], 'Tres rasgos que explican la vulnerabilidad.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('La extinción', 'Local, en estado silvestre o global: qué significa que una especie se extinga y qué dice la tasa actual.', [
      teoria('Grados de extinción', [
        'Una extinción local ocurre cuando una especie desaparece de una zona pero sobrevive en otras: el yaguareté, por ejemplo, desapareció de gran parte de la región pampeana, donde vivía en el siglo XIX. Una especie está extinta en estado silvestre cuando solo sobrevive en cautiverio. Y está extinta cuando no queda ningún individuo en el mundo.',
        'La extinción global es irreversible: no hay forma de traer de vuelta a una especie desaparecida.',
      ]),
      clas('¿Qué tipo de extinción es cada caso?', { // e1
        'Local': ['El yaguareté desaparecido de la región pampeana', 'El oso hormiguero desaparecido de Corrientes antes de su reintroducción'],
        'Global': ['El lobo de las Malvinas, extinto en el siglo XIX', 'El dodo de la isla Mauricio'],
      }, 'Lo local puede revertirse con reintroducciones; lo global es para siempre.', { d: 2 }),
      teoria('Extinciones en la historia', [
        'Siempre hubo extinciones: la mayoría de las especies que existieron ya no existen. Pero según la IPBES, la plataforma científica sobre biodiversidad, la tasa actual de extinción es al menos decenas o cientos de veces mayor que el promedio de los últimos diez millones de años, y alrededor de un millón de especies de animales y plantas están amenazadas de extinción, muchas en las próximas décadas.',
        'La diferencia con las grandes extinciones del pasado es que esta vez la causa principal son las actividades humanas.',
      ], { destacado: { valor: '≈ 1 millón', texto: 'de especies de animales y plantas estarían amenazadas de extinción, según la IPBES.' } }),
      est('Estimá cuántas especies de animales y plantas estarían amenazadas de extinción en el mundo, según la IPBES.', 1000000, { min: 1000, max: 100000000, unidad: 'especies', escala: 'log' }, 'Alrededor de un millón, según el informe global de la IPBES de 2019.', { d: 3 }),
      vf('Las extinciones actuales ocurren al mismo ritmo que en los últimos millones de años.', false, 'Según la IPBES, la tasa actual es al menos decenas o cientos de veces mayor que el promedio de los últimos diez millones de años.', { // e3
        razones: ['+Porque la tasa actual es decenas o cientos de veces mayor', '-Porque ya no se extingue ninguna especie', '-Porque las extinciones son siempre naturales'],
        d: 2,
      }),
      cad('Armá la cadena de cómo una especie llega a extinguirse.', [ // e4
        'Se pierde y fragmenta su hábitat',
        'Las poblaciones se achican y quedan aisladas',
        'Pierden diversidad genética',
        'Son más vulnerables a enfermedades y eventos extremos',
        'Las últimas poblaciones desaparecen',
      ], ['La especie se extingue de golpe sin ninguna señal previa'], 'La extinción suele ser un proceso: hay señales y tiempo para actuar.', { d: 2 }),
      teoria('El vórtice de extinción', [
        'Cuando una población se vuelve muy chica, entra en un círculo vicioso: pierde diversidad genética, hay más cruzas entre parientes, nacen menos crías sanas, la población se achica más, y así sucesivamente. Se lo llama vórtice de extinción. Por eso actuar a tiempo, cuando todavía hay poblaciones razonables, es mucho más efectivo que intentar salvar a los últimos individuos.',
      ]),
      numv(3, (i) => { // e5
        const n = [1000, 500, 2000][i];
        const baja = [10, 20, 15][i];
        return {
          enunciado: `Una población de ${n.toLocaleString('es-AR')} individuos baja un ${baja} % por año. ¿Cuántos quedan después de dos años? Redondeá al entero.`,
          valor: Math.round(n * (1 - baja / 100) ** 2),
          unidad: 'individuos',
          tol: 1,
          explicacion: `${n.toLocaleString('es-AR')} × ${(1 - baja / 100).toLocaleString('es-AR')} × ${(1 - baja / 100).toLocaleString('es-AR')} ≈ ${Math.round(n * (1 - baja / 100) ** 2).toLocaleString('es-AR')}. Una caída del mismo porcentaje cada año se acumula: en pocos años la población pierde una parte grande.`,
        };
      }, { d: 3 }),
      par('Uní cada concepto con su definición.', [ // e6
        ['Extinción local', 'Desaparece de una zona pero sobrevive en otras'],
        ['Extinta en estado silvestre', 'Solo sobrevive en cautiverio'],
        ['Extinción global', 'No queda ningún individuo en el mundo'],
        ['Vórtice de extinción', 'Círculo vicioso de poblaciones muy chicas'],
      ], 'Cuatro conceptos para entender el camino hacia la extinción.', { d: 2 }),
      op('¿Por qué conviene proteger una especie cuando todavía tiene poblaciones razonables?', [ // e7
        'Porque es más fácil y barato que salvar a los últimos',
        'Porque las especies abundantes nunca se extinguen',
        ['Porque así se evita estudiarla', 'Al contrario: estudiarla es parte de protegerla a tiempo.'],
        'Porque las especies raras no importan',
      ], 'Prevenir es más barato y más efectivo, como en casi todo lo ambiental.', { d: 2 }),
      det('Leé esta nota y marcá lo equivocado.', [ // e8
        ['La extinción global es irreversible.', false],
        ['Una especie extinta en el mundo se puede traer de vuelta fácilmente.', true, 'Una extinción global es para siempre.'],
        ['El yaguareté desapareció de gran parte de la región pampeana.', false],
        ['Las poblaciones muy chicas se recuperan solas sin ayuda.', true, 'Pueden caer en un vórtice de extinción si no se actúa.'],
      ], 'Entender la extinción ayuda a actuar antes.', { d: 2 }),
      mult('¿Qué pasa en una población atrapada en un vórtice de extinción? Marcá todo.', [ // e10
        '+Pierde diversidad genética',
        '+Aumentan las cruzas entre parientes',
        '+Nacen menos crías sanas',
        '-Se recupera sola sin ayuda',
        '-Gana diversidad genética nueva',
      ], 'Cada efecto empeora al siguiente. Por eso se actúa antes de que la población sea muy chica.', { d: 2 }),
      comp('Completá.', 'Si una especie desaparece de una zona pero vive en otras, es una extinción [local]; la extinción global es [irreversible]; y según la IPBES, alrededor de un [millón] de especies están amenazadas.', ['total', 'temporal', 'mil'], 'Las ideas clave para entender qué es una extinción y su ritmo actual.', { d: 2 }),
      rank('Ordená estas situaciones de menor a mayor gravedad.', [ // e11
        ['Una especie baja en una provincia pero abunda en el resto del país', 'menor'],
        ['Desaparece de una región entera', 'extinción local'],
        ['Solo quedan ejemplares en zoológicos', 'extinta en estado silvestre'],
        ['No queda ningún ejemplar en el mundo', 'extinción global'],
      ], 'Cada paso es más difícil de revertir. El último, imposible.', { d: 2, extremos: ['Menos grave', 'Más grave'] }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Recuperar especies', 'Proteger el hábitat, reducir amenazas, criar y liberar: cómo se ha logrado que especies en peligro vuelvan.', [
      teoria('Las herramientas', [
        'Recuperar una especie amenazada requiere combinar herramientas: proteger y restaurar su hábitat, reducir las amenazas directas (caza, venenos, invasoras), y a veces criar en cautiverio y liberar individuos, o trasladarlos para reintroducirlos donde desaparecieron. También hace falta investigación, monitoreo y trabajo con las comunidades locales.',
      ]),
      mult('¿Qué herramientas se usan para recuperar especies amenazadas? Marcá todas.', [ // e1
        '+Proteger y restaurar su hábitat',
        '+Reducir amenazas como venenos e invasoras',
        '+Cría en cautiverio y liberación',
        '+Trabajo con comunidades locales',
        '-Esperar sin hacer nada a que se recupere',
      ], 'La recuperación combina muchas herramientas a la vez.', { d: 1 }),
      teoria('Casos que funcionaron', [
        'La ballena franca austral, cazada casi hasta la extinción, se recuperó en buena medida desde que se prohibió su caza, y hoy se la ve cada año en Península Valdés. En los Esteros del Iberá, especies que habían desaparecido —como el oso hormiguero, el pecarí de collar, el guacamayo rojo y el yaguareté— volvieron gracias a proyectos de reintroducción. El Programa de Conservación del Cóndor Andino cría y libera cóndores y trabaja contra el envenenamiento.',
      ]),
      par('Uní cada caso con la herramienta principal que lo hizo posible.', [ // e2
        ['Ballena franca austral', 'Prohibición de la caza'],
        ['Oso hormiguero en Iberá', 'Reintroducción'],
        ['Cóndor andino', 'Cría, liberación y lucha contra venenos'],
        ['Macá tobiano', 'Control del visón y protección de lagunas'],
      ], 'Cada especie necesitó una estrategia distinta según su amenaza.', { d: 2 }),
      cad('Armá la cadena de cómo se reintroduce una especie.', [ // e3
        'Se verifica que la causa de su desaparición ya no existe',
        'Se preparan individuos, a veces criados en cautiverio',
        'Se liberan en el lugar con seguimiento',
        'Se monitorea si sobreviven y se reproducen',
        'Se forma una población silvestre estable',
      ], ['Se liberan animales sin verificar si la amenaza sigue'], 'Sin resolver la causa, cualquier liberación fracasa.', { d: 2 }),
      vf('Para reintroducir una especie alcanza con liberar individuos en el lugar donde vivía.', false, 'Primero hay que resolver la causa de su desaparición (caza, falta de hábitat, invasoras), y después liberar con seguimiento. Si no, la historia se repite.', { // e4
        razones: ['+Porque primero hay que resolver la causa y hacer seguimiento', '-Porque las especies liberadas nunca sobreviven', '-Porque no hace falta estudiar el lugar'],
        d: 2,
      }),
      teoria('El papel de las personas', [
        'Muchas amenazas dependen de decisiones humanas locales: cebos envenenados, caza, perros sueltos, compra de fauna silvestre, desmontes. Por eso los programas exitosos trabajan con productores, comunidades y escuelas, y ofrecen alternativas: por ejemplo, formas de proteger el ganado sin veneno, o ingresos por turismo de naturaleza que hacen más valiosa la especie viva.',
      ]),
      clas('¿Esta acción ayuda o perjudica a una especie amenazada?', { // e5
        'Ayuda': ['Proteger el ganado con perros guardianes en lugar de veneno', 'Turismo responsable de observación', 'Denunciar la venta de aves silvestres'],
        'Perjudica': ['Poner cebos envenenados', 'Soltar perros en zonas de fauna', 'Comprar un cardenal amarillo en una feria'],
      }, 'Las decisiones cotidianas de las personas pueden salvar o condenar a una especie.', { d: 1 }),
      numv(3, (i) => { // e6
        const n0 = [50, 30, 100][i];
        const crec = [10, 15, 8][i];
        return {
          enunciado: `Una población reintroducida de ${n0} individuos crece un ${crec} % por año. ¿Cuántos individuos hay después de 3 años? Redondeá al entero.`,
          valor: Math.round(n0 * (1 + crec / 100) ** 3),
          unidad: 'individuos',
          tol: 1,
          explicacion: `${n0} × ${(1 + crec / 100).toLocaleString('es-AR')}³ ≈ ${Math.round(n0 * (1 + crec / 100) ** 3)}. Con las amenazas controladas, una población puede crecer de forma sostenida.`,
        };
      }, { d: 3 }),
      op('En una zona ganadera se envenenan cóndores con cebos puestos para zorros. ¿Qué medida atiende la causa?', [ // e7
        'Trabajar con productores en alternativas al veneno',
        'Liberar más cóndores sin cambiar nada',
        ['Prohibir que los cóndores vuelen sobre los campos', 'Imposible y absurdo: la causa es el veneno, no el vuelo.'],
        'Esperar que los cóndores aprendan a evitar los cebos',
      ], 'Sin atacar la causa, liberar más cóndores solo agrega más víctimas.', { d: 2 }),
      rank('Ordená estas acciones de recuperación de la más de fondo a la más de emergencia.', [ // e8
        ['Proteger y restaurar el hábitat', 'de fondo'],
        ['Controlar las amenazas directas', 'clave'],
        ['Reintroducir en zonas recuperadas', 'cuando la causa se resolvió'],
        ['Criar en cautiverio a los últimos individuos', 'emergencia'],
      ], 'Lo de fondo sostiene todo; la cría en cautiverio es un salvavidas para los casos extremos.', { d: 3, extremos: ['Más de fondo', 'Más de emergencia'] }),
      det('Leé esta nota y marcá lo equivocado.', [ // e9
        ['La ballena franca austral se recuperó tras prohibirse su caza.', false],
        ['Las reintroducciones funcionan aunque la amenaza siga igual.', true, 'Sin resolver la causa, la especie vuelve a desaparecer.'],
        ['En Iberá se reintrodujeron especies desaparecidas.', false],
        ['Las comunidades locales no tienen ningún papel en la conservación.', true, 'Son clave: muchas amenazas dependen de decisiones locales.'],
      ], 'Recuperar especies es posible, y hay casos argentinos que lo muestran.', { d: 2 }),
      est('Estimá cuántos años pasaron entre la protección internacional de la ballena franca austral (1935) y 2025.', 90, { min: 10, max: 200, paso: 5, unidad: 'años' }, 'Unos 90 años. La recuperación de especies longevas lleva décadas: la ballena franca todavía no volvió a sus números originales.', { d: 2 }),
      comp('Completá.', 'Antes de reintroducir una especie hay que resolver la [causa] de su desaparición; la ballena franca se recuperó al prohibirse su [caza]; y en [Iberá] volvieron especies desaparecidas.', ['foto', 'observación', 'Ushuaia'], 'Las claves de la recuperación de especies.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: especies en peligro', 'Lista Roja, especies argentinas, vulnerabilidad, extinción y recuperación, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el plan para el macá tobiano', 'El macá tobiano vive solo en lagunas de la meseta de Santa Cruz. Con los datos, priorizá las acciones para salvarlo.', [
      teoria('La situación', [
        'Quedan pocos cientos de macás tobianos, en unas pocas lagunas de la meseta santacruceña. Sus amenazas principales son el visón americano, que depreda huevos y pichones; las truchas introducidas en algunas lagunas, que compiten por el alimento; gaviotas que aumentaron cerca de basurales; y cambios en las lagunas por el clima y el viento.',
        'Un equipo de conservación puede instalar guardianes en las colonias durante la temporada de cría, controlar visones, evitar nuevas siembras de truchas y monitorear las lagunas.',
      ]),
      num('Si en una colonia había 80 nidos y con guardianes y control de visones el éxito de cría sube del 30 % al 60 %, ¿cuántos nidos más tienen éxito?', 24, 'nidos', 'Antes: 80 × 30 % = 24. Después: 80 × 60 % = 48. Diferencia: 24 nidos más con éxito en una sola temporada.', { ctx: '80 nidos; éxito de cría del 30 % al 60 %.', d: 2 }),
      rank('Ordená las acciones por urgencia, de la más urgente a la menos.', [ // e2
        ['Guardianes y control de visones en las colonias', 'frena la mortalidad ya'],
        ['No sembrar truchas en lagunas con macá', 'evita una amenaza nueva'],
        ['Controlar basurales que atraen gaviotas', 'reduce otra amenaza'],
        ['Investigar cómo cambia el clima en la meseta', 'clave a largo plazo'],
      ], 'Primero se frena la mortalidad directa; después se reducen las otras amenazas y se estudia lo de fondo.', { d: 4 }),
      clas('Clasificá las amenazas del macá tobiano.', { // e3
        'Especies introducidas': ['Visón americano', 'Truchas sembradas'],
        'Efectos humanos indirectos': ['Gaviotas que aumentaron por basurales', 'Cambios en las lagunas por el clima'],
      }, 'Varias amenazas a la vez: por eso hace falta un plan con varias acciones.', { d: 3 }),
      op('¿Por qué no alcanza con proteger una sola laguna?', [ // e4
        'Porque la especie depende de varias lagunas',
        'Porque el macá tobiano vive en todo el país',
        ['Porque una laguna protegida atrae más visones', 'No es el motivo: la especie usa varias lagunas a lo largo de los años.'],
        'Porque las lagunas no se pueden proteger',
      ], 'Las especies con poblaciones chicas y fragmentadas necesitan que se protejan todos sus sitios clave.', { d: 3 }),
      mult('¿Qué debería incluir el plan? Marcá todo.', [ // e5
        '+Guardianes en las colonias durante la cría',
        '+Control del visón americano',
        '+Evitar nuevas siembras de truchas en lagunas con macá',
        '+Monitoreo anual de la población',
        '-Capturar todos los macás y llevarlos a un zoológico lejos',
      ], 'Proteger en su lugar, controlar amenazas y medir resultados.', { d: 3 }),
      vf('Como el macá tobiano está En peligro crítico, ya no hay nada que hacer.', false, 'Hay casos de especies que se recuperaron desde situaciones críticas. Con acciones bien dirigidas, la población puede estabilizarse y crecer.', { // e6
        razones: ['+Porque especies en situación crítica se han recuperado con acción', '-Porque las especies CR se extinguen siempre', '-Porque la categoría no se puede cambiar nunca'],
        d: 2,
      }),
      det('El equipo escribe el plan. Marcá lo que no conviene.', [ // e7
        ['Pondremos guardianes en las colonias durante la cría.', false],
        ['Sembraremos truchas para que los pescadores apoyen el proyecto.', true, 'Las truchas compiten por el alimento del macá.'],
        ['Controlaremos visones en las lagunas clave.', false],
        ['No mediremos la población para no molestar a las aves.', true, 'Sin monitoreo no se sabe si el plan funciona; se puede medir sin molestar.'],
      ], 'Un buen plan ataca las causas, se sostiene en el tiempo y se mide.', { d: 3 }),
    ]),
  ],
});
