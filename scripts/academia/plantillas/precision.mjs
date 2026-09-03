// Tipos de precisión: `estimacion_numerica`, `detectar_greenwashing`,
// `mapa_localizar` y `completar_frase`.
//
// `estimacion_numerica` es donde vive la intuición de magnitud, que es lo que
// casi nadie tiene: nadie sabe que un kilo de carne son del orden de 15.000
// litros de agua. Se corrige por bandas —±15 % completo, ±40 % parcial— porque
// el objetivo es la escala, no la cifra exacta.
//
// `detectar_greenwashing` es de los más originales del set y de los más útiles
// en un supermercado: se marcan las partes de una promesa que no tienen
// respaldo. Se corrige por span, y aprueba con ≥80 %.
//
// `mapa_localizar` SIEMPRE lleva `alternativas`: es la versión de opción
// múltiple con regiones nombradas, y es lo que hace que el ejercicio se pueda
// completar sin ver el mapa. Un tipo que no se puede completar con teclado y
// lector de pantalla no se publica.

export default [
  // ── estimacion_numerica ───────────────────────────────────────────────────
  {
    slug: 'agua.estimacion.carne',
    tipo: 'estimacion_numerica',
    titulo_interno: 'Estimar el agua de un kilo de carne',
    enunciado_tpl: '{{marco.texto}} ¿Cuánta agua, en total, hace falta para producir 1 kg de carne vacuna?',
    ayuda: 'Contá toda la cadena: la pastura, el forraje y los años del animal.',
    variantes: [
      {
        valor: 15000,
        unidad: 'L',
        min: 0,
        max: 40000,
        paso: 100,
        escala: 'log',
        d: 0.3,
        explicacion:
          'Del orden de 15.000 litros por kilo. El agua que el animal bebe es una fracción mínima: casi todo es el agua que necesitó la pastura y el forraje durante años.',
      },
    ],
    incidentales: {
      marco: [
        { k: 'general', texto: 'Estimá:', contexto: 'general' },
        { k: 'compra', texto: 'Estimá, pensando en la carnicería:', contexto: 'compra' },
      ],
    },
    conceptos: [['agua.agua_virtual', 1.0], ['tronco.orden_de_magnitud', 0.6]],
    age_groups: ['teen', 'adult'],
    anillo_min: 1,
    dificultad_base: 0.35,
    fuente: 'huella-hidrica',
  },

  {
    slug: 'agua.estimacion.remera',
    tipo: 'estimacion_numerica',
    titulo_interno: 'Estimar el agua de una remera de algodón',
    enunciado_tpl: '{{marco.texto}} ¿Cuánta agua hace falta para producir una remera de algodón?',
    variantes: [
      {
        valor: 2700,
        unidad: 'L',
        min: 0,
        max: 10000,
        paso: 50,
        escala: 'log',
        d: 0.2,
        explicacion:
          'Unos 2.700 litros: alrededor de 38 duchas. Por eso usar la ropa que ya tenés mueve mucho más el número que acortar la ducha.',
      },
    ],
    incidentales: {
      marco: [
        { k: 'general', texto: 'Estimá:', contexto: 'general' },
        { k: 'compra', texto: 'Estimá, con la remera en la mano:', contexto: 'compra' },
      ],
    },
    conceptos: [['agua.agua_virtual', 1.0], ['consumo.fast_fashion', 0.3]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 1,
    dificultad_base: 0.25,
    fuente: 'huella-hidrica',
  },

  {
    slug: 'animales.estimacion.aves_reserva',
    tipo: 'estimacion_numerica',
    titulo_interno: 'Estimar las aves de la Reserva Ecológica',
    enunciado_tpl:
      '{{marco.texto}} ¿Cuántas especies de aves se registraron en la Reserva Ecológica Costanera Sur?',
    variantes: [
      {
        valor: 343,
        unidad: 'especies',
        min: 0,
        max: 800,
        paso: 1,
        escala: 'lineal',
        d: 0.1,
        explicacion:
          'Se registraron 343 especies: alrededor de un tercio de todas las aves de la Argentina, en 350 hectáreas levantadas sobre escombros de demolición.',
      },
    ],
    incidentales: {
      marco: [
        { k: 'general', texto: 'Estimá:', region: 'general' },
        { k: 'caba', texto: 'Estimá, a veinte minutos del Obelisco:', region: 'rioplatense' },
      ],
    },
    conceptos: [['tronco.servicios_ecosistemicos', 1.0], ['tronco.orden_de_magnitud', 0.6]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 1,
    dificultad_base: 0.15,
    fuente: 'reserva-costanera-sur',
  },

  // ── detectar_greenwashing ─────────────────────────────────────────────────
  {
    slug: 'consumo.greenwashing.botella',
    tipo: 'detectar_greenwashing',
    titulo_interno: 'Promesa de una botella',
    enunciado_tpl: '{{marco.texto}}',
    variantes: [
      {
        claim: 'Botella 100% reciclable · Amigable con el planeta · Reducimos un 40% el agua por unidad desde 2020 · Elaborado con energía limpia',
        spans: [
          { texto: '100% reciclable', sin_respaldo: true },
          { texto: 'Amigable con el planeta', sin_respaldo: true },
          { texto: 'Reducimos un 40% el agua por unidad desde 2020', sin_respaldo: false },
          { texto: 'Elaborado con energía limpia', sin_respaldo: true },
        ],
        d: 0.4,
        explicacion:
          '"Reciclable" describe una posibilidad, no un hecho: depende de que exista el sistema que lo recicle. "Amigable con el planeta" y "energía limpia" no son medibles ni verificables. La única afirmación sólida es la que tiene número, alcance y fecha.',
      },
      {
        claim: 'Producto ecológico · Envase con 30% de material reciclado posconsumo · Certificado por un tercero independiente · Cuidamos el futuro de tus hijos',
        spans: [
          { texto: 'Producto ecológico', sin_respaldo: true },
          { texto: 'Envase con 30% de material reciclado posconsumo', sin_respaldo: false },
          { texto: 'Certificado por un tercero independiente', sin_respaldo: false },
          { texto: 'Cuidamos el futuro de tus hijos', sin_respaldo: true },
        ],
        d: 0.5,
        explicacion:
          '"Ecológico" a secas es vaguedad, y la apelación emocional no dice nada del producto. Las dos afirmaciones útiles son las que se pueden comprobar: un porcentaje concreto y una verificación externa.',
      },
    ],
    incidentales: {
      marco: [
        { k: 'general', texto: 'Marcá las partes que NO se pueden comprobar.', contexto: 'general' },
        { k: 'compra', texto: 'Estás en la góndola. Marcá lo que no se puede comprobar.', contexto: 'compra' },
      ],
    },
    conceptos: [['consumo.greenwashing', 1.0], ['consumo.pecados_del_greenwashing', 0.6]],
    age_groups: ['teen', 'adult'],
    anillo_min: 1,
    dificultad_base: 0.45,
    fuente: 'global-footprint',
  },

  {
    slug: 'residuos.greenwashing.mobius',
    tipo: 'detectar_greenwashing',
    titulo_interno: 'El símbolo de las flechitas',
    enunciado_tpl: '{{marco.texto}}',
    variantes: [
      {
        claim: 'Lleva el símbolo de las flechitas · Fabricado con plástico PET número 1 · Se recicla en todo el país · Biodegradable',
        spans: [
          { texto: 'Lleva el símbolo de las flechitas', sin_respaldo: true },
          { texto: 'Fabricado con plástico PET número 1', sin_respaldo: false },
          { texto: 'Se recicla en todo el país', sin_respaldo: true },
          { texto: 'Biodegradable', sin_respaldo: true },
        ],
        d: 0.4,
        explicacion:
          'El símbolo de Möbius no garantiza nada: muchas veces solo identifica el tipo de plástico. "Se recicla en todo el país" depende de que cada municipio tenga el sistema, y "biodegradable" sin decir en qué condiciones no significa casi nada. Lo único verificable es el tipo de resina.',
      },
    ],
    incidentales: { marco: [{ k: 'general', texto: 'Marcá lo que NO tiene respaldo.', region: 'general' }] },
    conceptos: [['residuos.greenwashing_mobius', 1.0], ['residuos.biodegradable_no_es_magia', 0.6]],
    age_groups: ['teen', 'adult'],
    anillo_min: 1,
    dificultad_base: 0.4,
    fuente: 'yale-reciclaje',
  },

  {
    slug: 'energia.greenwashing.carbono',
    tipo: 'detectar_greenwashing',
    titulo_interno: 'Promesa de carbono neutro',
    enunciado_tpl: '{{marco.texto}}',
    variantes: [
      {
        claim: 'Carbono neutro · Compensamos el 100% de nuestras emisiones · Redujimos un 18% las emisiones propias desde 2019 · Comprometidos con el planeta hacia 2050',
        spans: [
          { texto: 'Carbono neutro', sin_respaldo: true },
          { texto: 'Compensamos el 100% de nuestras emisiones', sin_respaldo: true },
          { texto: 'Redujimos un 18% las emisiones propias desde 2019', sin_respaldo: false },
          { texto: 'Comprometidos con el planeta hacia 2050', sin_respaldo: true },
        ],
        d: 0.7,
        explicacion:
          'Compensar no es evitar: traslada la emisión a un proyecto que puede tardar décadas en absorberla, si la absorbe. Una promesa para 2050 no compromete a nadie hoy. Lo único auditable es la reducción propia, con porcentaje y año base.',
      },
    ],
    incidentales: { marco: [{ k: 'general', texto: 'Marcá lo que NO se puede auditar.', region: 'general' }] },
    conceptos: [['tronco.compensacion_no_es_evitar', 1.0], ['consumo.promesas_a_futuro', 0.6]],
    age_groups: ['teen', 'adult'],
    anillo_min: 2,
    dificultad_base: 0.75,
    fuente: 'carbon-brief',
  },

  // ── mapa_localizar ────────────────────────────────────────────────────────
  {
    slug: 'plantas.mapa.ecorregiones',
    tipo: 'mapa_localizar',
    titulo_interno: 'Ubicar una ecorregión argentina',
    enunciado_tpl: '{{marco.texto}} {{pregunta.texto}}',
    variantes: [
      {
        region: 'Pampa',
        centro: [-36.5, -60.5],
        zoom: 5,
        alternativas: ['Selva Paranaense', 'Estepa Patagónica', 'Puna'],
        pregunta: { texto: '¿Dónde está el pastizal templado que ocupa la mayor parte de la provincia de Buenos Aires?' },
        d: -0.1,
        explicacion:
          'La Pampa es pastizal templado, con suelos entre los más fértiles del mundo. Es también el ecosistema más transformado del país: casi todo se convirtió en cultivo.',
      },
      {
        region: 'Selva Paranaense',
        centro: [-26.5, -54.3],
        zoom: 6,
        alternativas: ['Chaco Seco', 'Monte de Llanuras y Mesetas', 'Altos Andes'],
        pregunta: { texto: '¿Dónde está la selva subtropical más biodiversa del país?' },
        d: 0.2,
        explicacion:
          'La Selva Paranaense, en Misiones. Es la ecorregión con más biodiversidad de la Argentina y uno de los tres núcleos donde todavía queda yaguareté.',
      },
      {
        region: 'Delta e Islas del Paraná',
        centro: [-33.7, -59.2],
        zoom: 7,
        alternativas: ['Yungas', 'Espinal', 'Bosque Patagónico'],
        pregunta: { texto: '¿Dónde está el humedal de islas y arroyos que llega hasta el Río de la Plata?' },
        d: 0.1,
        explicacion:
          'El Delta e Islas del Paraná: humedal, bosque ribereño de monte blanco y el gran mamífero del humedal bonaerense, el ciervo de los pantanos.',
      },
    ],
    incidentales: {
      marco: [
        { k: 'general', texto: 'En el mapa de la Argentina:', region: 'general' },
        { k: 'caba', texto: 'En el mapa, desde donde estás vos:', region: 'rioplatense' },
      ],
    },
    conceptos: [['plantas.tu_ecorregion', 1.0], ['plantas.pastizal_pampeano', 0.3]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 1,
    dificultad_base: 0.05,
    fuente: 'ecorregiones-pba',
  },

  {
    slug: 'agua.mapa.cuenca',
    tipo: 'mapa_localizar',
    titulo_interno: 'Ubicar la Cuenca Matanza-Riachuelo',
    enunciado_tpl: '{{marco.texto}} {{pregunta.texto}}',
    variantes: [
      {
        region: 'Cuenca Matanza-Riachuelo',
        centro: [-34.7, -58.5],
        zoom: 10,
        alternativas: ['Cuenca del Río Reconquista', 'Delta del Paraná', 'Bahía de Samborombón'],
        pregunta: { texto: '¿Cuál es la cuenca que dio lugar al fallo Mendoza y a la creación de ACUMAR?' },
        d: 0.3,
        explicacion:
          'La Cuenca Matanza-Riachuelo. Viven alrededor de dos millones de personas en ella, y tras el fallo de la Corte Suprema en 2008 se creó ACUMAR, un organismo tripartito entre Nación, Provincia y Ciudad.',
      },
    ],
    incidentales: { marco: [{ k: 'general', texto: 'En el mapa del AMBA:', region: 'general' }] },
    conceptos: [['agua.cuenca_matanza_riachuelo', 1.0], ['agua.fallo_mendoza', 0.6]],
    age_groups: ['teen', 'adult'],
    anillo_min: 1,
    dificultad_base: 0.3,
    fuente: 'acumar',
  },

  {
    slug: 'agua_azul.mapa.reserva',
    tipo: 'mapa_localizar',
    titulo_interno: 'Ubicar la Reserva Ecológica Costanera Sur',
    enunciado_tpl: '{{marco.texto}} {{pregunta.texto}}',
    variantes: [
      {
        region: 'Reserva Ecológica Costanera Sur',
        centro: [-34.61, -58.35],
        zoom: 13,
        alternativas: ['Reserva Natural Lago Lugano', 'Parque Nacional Ciervo de los Pantanos', 'Bosques de Palermo'],
        pregunta: { texto: '¿Cuál es el sitio Ramsar urbano de 350 hectáreas sobre la costa del Río de la Plata?' },
        d: 0.2,
        explicacion:
          'La Reserva Ecológica Costanera Sur, sitio Ramsar desde 2005 y protegida desde 1986. Se armó sola sobre un relleno de escombros: es la mejor historia local de "la naturaleza vuelve si la dejás".',
      },
    ],
    incidentales: { marco: [{ k: 'general', texto: 'En el mapa de la Ciudad:', region: 'general' }] },
    conceptos: [['tronco.servicios_ecosistemicos', 1.0]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 1,
    dificultad_base: 0.2,
    fuente: 'reserva-costanera-sur',
  },

  // ── completar_frase ───────────────────────────────────────────────────────
  {
    slug: 'residuos.frase.jerarquia',
    tipo: 'completar_frase',
    titulo_interno: 'Cloze de la jerarquía',
    enunciado_tpl: '{{marco.texto}}',
    variantes: [
      {
        frase: 'En la jerarquía de residuos, {{0}} viene antes que reciclar, y el mejor residuo es {{1}}.',
        huecos: ['evitar', 'el que no existe'],
        banco: ['evitar', 'el que no existe', 'compostar', 'enterrar', 'separar', 'el que se recicla'],
        d: -0.2,
        explicacion:
          'Evitar, reducir, reutilizar y recién después reciclar. El residuo que no se genera no hay que transportarlo, ni clasificarlo, ni fundirlo.',
      },
    ],
    incidentales: { marco: [{ k: 'general', texto: 'Completá la frase:', region: 'general' }] },
    conceptos: [['residuos.evitar_es_primero', 1.0], ['residuos.jerarquia_residuos', 0.6]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 1,
    dificultad_base: -0.2,
    fuente: 'epa',
  },

  {
    slug: 'plantas.frase.ombu',
    tipo: 'completar_frase',
    titulo_interno: 'Cloze de flora nativa',
    enunciado_tpl: '{{marco.texto}}',
    variantes: [
      {
        frase: 'El {{0}} es la flor nacional argentina, y el {{1}} no es técnicamente un árbol sino una hierba gigante.',
        huecos: ['ceibo', 'ombú'],
        banco: ['ceibo', 'ombú', 'jacarandá', 'timbó', 'sauce criollo', 'palo borracho'],
        d: 0.0,
        explicacion:
          'El ceibo (Erythrina crista-galli) es la flor nacional. El ombú (Phytolacca dioica) tiene tronco blando y sin anillos de crecimiento: es una hierba gigante, no un árbol.',
      },
      {
        frase: 'Una especie {{0}} es la que evolucionó en el lugar, y una {{1}} es la exótica que además desplaza a las nativas.',
        huecos: ['nativa', 'invasora'],
        banco: ['nativa', 'invasora', 'exótica', 'endémica', 'naturalizada', 'ornamental'],
        d: 0.2,
        explicacion:
          'No toda exótica es invasora: muchas conviven sin problema. Invasora es la que se expande sola y desplaza a las nativas, como el ligustro o la acacia negra en el Delta.',
      },
    ],
    incidentales: { marco: [{ k: 'general', texto: 'Completá la frase:', region: 'general' }] },
    conceptos: [['plantas.ombu_no_es_arbol', 1.0], ['plantas.exotica_no_es_invasora', 0.6]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 1,
    dificultad_base: 0.1,
    fuente: 'plantas-nativas',
  },

  {
    slug: 'tronco.frase.stock',
    tipo: 'completar_frase',
    titulo_interno: 'Cloze de stock y flujo',
    enunciado_tpl: '{{marco.texto}}',
    variantes: [
      {
        frase: 'El CO₂ se {{0}} en la atmósfera, así que bajar las emisiones {{1}} la subida pero no la revierte.',
        huecos: ['acumula', 'frena'],
        banco: ['acumula', 'frena', 'disuelve', 'revierte', 'evapora', 'multiplica'],
        d: 0.5,
        explicacion:
          'Es un stock, no un caudal. La concentración solo se estabiliza cuando se emite tanto como se absorbe: hasta ahí, sigue subiendo aunque más despacio.',
      },
    ],
    incidentales: { marco: [{ k: 'general', texto: 'Completá la frase:', region: 'general' }] },
    conceptos: [['tronco.stock_vs_flujo', 1.0]],
    age_groups: ['teen', 'adult'],
    anillo_min: 2,
    dificultad_base: 0.5,
    fuente: 'ipcc-ar6',
  },
];
