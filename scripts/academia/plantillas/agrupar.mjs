// Tipos de agrupamiento: `clasificar_en_cestos` y `emparejar`.
//
// Los dos son "de arrastre" en la mayoría de las apps, y los dos tienen que
// funcionar SIN arrastrar: tocar para elegir y tocar para colocar es un camino
// de primera clase, no un plan B (11-exercise-types.md §5). El servidor no se
// entera de la diferencia — recibe la asignación final y nada más — así que la
// accesibilidad acá es enteramente una decisión de la fase 2, y esta forma de
// payload la deja abierta a propósito.
//
// `clasificar_en_cestos` da crédito por ficha y aprueba con ≥80 %: clasificar
// siete de ocho materiales demuestra que entendiste la taxonomía.
// `emparejar` es todo o nada: emparejar tres de cinco no demuestra la relación.

export default [
  // ── clasificar_en_cestos ──────────────────────────────────────────────────
  {
    slug: 'residuos.cestos.reciclable',
    tipo: 'clasificar_en_cestos',
    titulo_interno: 'Qué va a reciclables y qué no',
    enunciado_tpl: '{{marco.texto}}',
    variantes: [
      {
        cestos: [{ nombre: 'Reciclables (secos)' }, { nombre: 'No reciclables' }, { nombre: 'Orgánicos' }],
        fichas: [
          { texto: 'Botella de plástico enjuagada', cesto: 'Reciclables (secos)' },
          { texto: 'Lata de tomate enjuagada', cesto: 'Reciclables (secos)' },
          { texto: 'Diario seco', cesto: 'Reciclables (secos)' },
          { texto: 'Caja de pizza con grasa', cesto: 'No reciclables' },
          { texto: 'Ticket de compra (papel térmico)', cesto: 'No reciclables' },
          { texto: 'Servilleta usada', cesto: 'No reciclables' },
          { texto: 'Cáscaras de verdura', cesto: 'Orgánicos' },
          { texto: 'Yerba usada', cesto: 'Orgánicos' },
        ],
        d: 0.0,
        explicacion:
          'Las dos trampas son el cartón engrasado y el ticket. La grasa arruina la fibra del cartón, y la mayoría de los tickets son papel térmico, con un recubrimiento químico que impide reciclarlos. Lo demás va limpio, seco y separado.',
      },
      {
        cestos: [{ nombre: 'A la compostera' }, { nombre: 'Mejor no' }],
        fichas: [
          { texto: 'Cáscaras de fruta', cesto: 'A la compostera' },
          { texto: 'Yerba y café usados', cesto: 'A la compostera' },
          { texto: 'Hojas secas del patio', cesto: 'A la compostera' },
          { texto: 'Cartón de huevos sin tinta', cesto: 'A la compostera' },
          { texto: 'Restos de carne y pescado', cesto: 'Mejor no' },
          { texto: 'Lácteos', cesto: 'Mejor no' },
          { texto: 'Heces de perro o gato', cesto: 'Mejor no' },
        ],
        d: 0.3,
        explicacion:
          'En una compostera domiciliaria conviene evitar carne, pescado, lácteos y heces de mascotas: atraen plagas y pueden traer patógenos. El resto se equilibra mezclando verdes húmedos con marrones secos.',
      },
    ],
    incidentales: {
      marco: [
        { k: 'general', texto: 'Poné cada cosa donde va.', region: 'general' },
        { k: 'caba', texto: 'Poné cada cosa donde va, según la separación del AMBA.', region: 'rioplatense' },
      ],
    },
    conceptos: [['residuos.que_es_reciclable', 1.0], ['residuos.contaminacion_cruzada', 0.6]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 1,
    dificultad_base: 0.05,
    fuente: 'ley-1854-basura-cero',
  },

  {
    slug: 'plantas.cestos.nativa_exotica',
    tipo: 'clasificar_en_cestos',
    titulo_interno: 'Nativa, exótica o invasora',
    enunciado_tpl: '{{marco.texto}}',
    variantes: [
      {
        cestos: [{ nombre: 'Nativa' }, { nombre: 'Exótica invasora' }],
        fichas: [
          { texto: 'Ceibo', cesto: 'Nativa' },
          { texto: 'Sauce criollo', cesto: 'Nativa' },
          { texto: 'Aliso de río', cesto: 'Nativa' },
          { texto: 'Palo borracho', cesto: 'Nativa' },
          { texto: 'Ligustro', cesto: 'Exótica invasora' },
          { texto: 'Mora', cesto: 'Exótica invasora' },
          { texto: 'Acacia negra', cesto: 'Exótica invasora' },
        ],
        d: 0.2,
        explicacion:
          'El ligustro, la mora y la acacia negra están entre las invasoras que más presionan al monte blanco del Delta: crecen rápido, desplazan a las nativas y bajan la biodiversidad local. "Crece en cualquier lado" no es una virtud, es la definición del problema.',
      },
    ],
    incidentales: {
      marco: [
        { k: 'general', texto: 'Clasificá cada especie.', region: 'general' },
        { k: 'delta', texto: 'Clasificá cada especie. Pensá en el monte del Delta.', region: 'delta' },
      ],
    },
    conceptos: [['plantas.ligustro_mora_acacia', 1.0], ['plantas.que_es_nativa', 0.6]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 1,
    dificultad_base: 0.2,
    fuente: 'invasoras-mayds',
  },

  {
    slug: 'agua.cestos.huella_colores',
    tipo: 'clasificar_en_cestos',
    titulo_interno: 'Huella hídrica verde, azul y gris',
    enunciado_tpl: '{{marco.texto}}',
    variantes: [
      {
        cestos: [{ nombre: 'Verde' }, { nombre: 'Azul' }, { nombre: 'Gris' }],
        fichas: [
          { texto: 'Lluvia que el cultivo toma del suelo', cesto: 'Verde' },
          { texto: 'Humedad que la pastura consume sin riego', cesto: 'Verde' },
          { texto: 'Agua bombeada de una napa para regar', cesto: 'Azul' },
          { texto: 'Agua tomada de un río para una fábrica', cesto: 'Azul' },
          { texto: 'La que haría falta para diluir un vertido', cesto: 'Gris' },
          { texto: 'La necesaria para diluir fertilizante lixiviado', cesto: 'Gris' },
        ],
        d: 0.5,
        explicacion:
          'Verde es lluvia almacenada en el suelo, azul es agua superficial o subterránea que se extrae, y gris es la que haría falta para diluir la contaminación generada. No son intercambiables: un litro azul en una zona con estrés hídrico no vale lo mismo que uno verde.',
      },
    ],
    incidentales: { marco: [{ k: 'general', texto: 'Ubicá cada caso en su color.', region: 'general' }] },
    conceptos: [['agua.huella_verde_azul_gris', 1.0], ['agua.un_litro_no_vale_igual', 0.6]],
    age_groups: ['teen', 'adult'],
    anillo_min: 2,
    dificultad_base: 0.55,
    fuente: 'huella-hidrica',
  },

  // ── emparejar ─────────────────────────────────────────────────────────────
  {
    slug: 'plantas.emparejar.ley_bosques',
    tipo: 'emparejar',
    titulo_interno: 'Categorías del ordenamiento de bosques nativos',
    enunciado_tpl: '{{marco.texto}}',
    variantes: [
      {
        pares: [
          ['Categoría I (rojo)', 'Muy alto valor de conservación: no se transforma'],
          ['Categoría II (amarillo)', 'Valor medio: uso sostenible, sin desmonte'],
          ['Categoría III (verde)', 'Puede transformarse para otros usos'],
          ['OTBN', 'El mapa provincial que asigna las categorías'],
        ],
        d: 0.5,
        explicacion:
          'La Ley 26.331 obliga a cada provincia a hacer su Ordenamiento Territorial de Bosques Nativos. El color no es una opinión: define qué se puede y qué no en cada parcela, y por eso las recategorizaciones se discuten tanto.',
      },
    ],
    incidentales: { marco: [{ k: 'general', texto: 'Emparejá cada categoría con lo que permite.', region: 'general' }] },
    conceptos: [['plantas.ley_bosques', 1.0], ['plantas.otbn_es_un_mapa', 0.6]],
    age_groups: ['teen', 'adult'],
    anillo_min: 2,
    dificultad_base: 0.55,
    fuente: 'ley-bosques-26331',
  },

  {
    slug: 'tronco.emparejar.leyes',
    tipo: 'emparejar',
    titulo_interno: 'Leyes ambientales argentinas y qué protegen',
    enunciado_tpl: '{{marco.texto}}',
    variantes: [
      {
        pares: [
          ['Ley 26.331', 'Bosques nativos'],
          ['Ley 27.621', 'Educación ambiental integral'],
          ['Ley 22.421', 'Fauna silvestre'],
          ['Acuerdo de Escazú', 'Información, participación y justicia ambiental'],
        ],
        d: 0.6,
        explicacion:
          'Cuatro normas de alcance muy distinto: una protege un ecosistema, otra manda enseñar, otra regula el uso de la fauna y la cuarta garantiza que puedas enterarte y participar. Las cuatro se apoyan en el artículo 41 de la Constitución.',
      },
      {
        pares: [
          ['Artículo 41 de la Constitución', 'Derecho a un ambiente sano y deber de preservarlo'],
          ['Presupuestos mínimos', 'El piso de protección para todo el país'],
          ['Principio precautorio', 'La falta de certeza no justifica no actuar'],
          ['Ley 25.675', 'Ley marco: principios y evaluación de impacto'],
        ],
        d: 0.8,
        explicacion:
          'Los presupuestos mínimos fijan un piso: cada provincia puede exigir más, nunca menos. Y el principio precautorio es el que permite actuar frente a un riesgo grave antes de tener certeza científica completa.',
      },
    ],
    incidentales: { marco: [{ k: 'general', texto: 'Emparejá cada norma con lo que hace.', region: 'general' }] },
    conceptos: [['tronco.derecho_ambiente_sano', 1.0], ['tronco.presupuestos_minimos', 0.6]],
    age_groups: ['teen', 'adult'],
    anillo_min: 2,
    dificultad_base: 0.7,
    fuente: 'ley-25675-ambiente',
  },

  {
    slug: 'residuos.emparejar.materiales',
    tipo: 'emparejar',
    titulo_interno: 'Materiales y su destino',
    enunciado_tpl: '{{marco.texto}}',
    variantes: [
      {
        pares: [
          ['Vidrio', 'Se recicla indefinidamente sin perder calidad'],
          ['Plástico', 'Pierde calidad en cada ciclo de reciclado'],
          ['Tetrabrik', 'Multicapa: hay que separar cartón, aluminio y plástico'],
          ['Telgopor', 'Muy liviano y voluminoso: rara vez se recicla'],
        ],
        d: 0.3,
        explicacion:
          'No todos los materiales se reciclan igual. Al plástico conviene evitarlo antes que reciclarlo, justamente porque cada ciclo lo degrada y termina en productos de menor valor.',
      },
    ],
    incidentales: { marco: [{ k: 'general', texto: 'Emparejá cada material con lo que le pasa.', region: 'general' }] },
    conceptos: [['residuos.reciclar_no_es_infinito', 1.0], ['residuos.tetrabrik_multicapa', 0.6]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 1,
    dificultad_base: 0.3,
    fuente: 'yale-reciclaje',
  },
];
