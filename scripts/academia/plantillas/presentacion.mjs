// Tipos de presentación: `microlectura` y `dato_vivo`.
//
// No se corrigen y no cuestan savia. La microlectura es el latido de enseñanza
// —una idea, 40–70 palabras, una línea destacada y su fuente a la vista— y el
// dato vivo es el momento de identidad de la sección: una medición de campo
// renderizada como un ticker de mercado.
//
// Ninguna de las dos ocupa una fila de `ac_entregas`: el compositor las devuelve
// con `entrega_id: null` porque no hay nada que corregir, y así no pueden quedar
// "sin responder" bloqueando el cierre de la sesión.

export default [
  {
    slug: 'tronco.microlectura.sistemas',
    tipo: 'microlectura',
    titulo_interno: 'Microlectura — un ecosistema son relaciones',
    enunciado_tpl: '{{marco.texto}}',
    variantes: [
      {
        cuerpo:
          'Cuando mirás una plaza ves pasto, árboles y algún bicho. Un ecosistema no es esa lista: es lo que se hacen entre sí. El árbol da sombra y baja la temperatura, la sombra deja que crezcan otras plantas, esas plantas alimentan insectos, los insectos polinizan y traen pájaros. Sacá una pieza y se mueven las otras.',
        destacado: 'Un ecosistema no es una colección. Es una red.',
      },
      {
        cuerpo:
          'Los ecosistemas hacen trabajo que nadie factura: filtran agua, polinizan lo que comés, guardan carbono, bajan la temperatura de una cuadra. Se llaman servicios ecosistémicos y tienen una característica incómoda: casi siempre se notan cuando faltan, no cuando están.',
        destacado: 'El trabajo mejor hecho es el que no se ve.',
      },
    ],
    incidentales: {
      marco: [
        { k: 'general', texto: 'Antes de arrancar', region: 'general' },
        { k: 'plaza', texto: 'Pensalo con la plaza de tu barrio', region: 'rioplatense' },
      ],
    },
    conceptos: [['tronco.que_es_ecosistema', 1.0], ['tronco.servicios_ecosistemicos', 0.3]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 1,
    dificultad_base: -1.2,
    fuente: 'naaee-guidelines',
  },

  {
    slug: 'agua.microlectura.virtual',
    tipo: 'microlectura',
    titulo_interno: 'Microlectura — el agua que no ves',
    enunciado_tpl: '{{marco.texto}}',
    variantes: [
      {
        cuerpo:
          'El agua que usás no es la que sale de tu canilla. La mayor parte se gastó antes, en otro lado, para producir lo que comprás y comés: se llama agua virtual. Un kilo de carne vacuna se lleva del orden de 15.000 litros contando toda la cadena. Una remera de algodón, unos 2.700.',
        destacado: 'La ducha se ve. Los 2.700 litros de la remera, no.',
      },
      {
        cuerpo:
          'La huella hídrica se parte en tres colores. La verde es agua de lluvia que el cultivo se toma del suelo. La azul es la que se saca de un río o de una napa. La gris es la que haría falta para diluir la contaminación que se generó. No son intercambiables: un litro azul en una zona seca no vale lo mismo que uno verde.',
        destacado: 'Verde, azul y gris. Un litro no vale igual que otro.',
      },
    ],
    incidentales: {
      marco: [
        { k: 'general', texto: 'Para empezar', contexto: 'general' },
        { k: 'compra', texto: 'La próxima vez que estés en la góndola', contexto: 'compra' },
      ],
    },
    conceptos: [['agua.agua_virtual', 1.0], ['agua.huella_verde_azul_gris', 0.3]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 1,
    dificultad_base: -0.6,
    fuente: 'huella-hidrica',
  },

  {
    slug: 'residuos.microlectura.jerarquia',
    tipo: 'microlectura',
    titulo_interno: 'Microlectura — el orden de las erres',
    enunciado_tpl: '{{marco.texto}}',
    variantes: [
      {
        cuerpo:
          'El orden importa y casi nunca se dice completo. Primero evitar que el residuo exista. Después reducir. Después reutilizar. Recién ahí reciclar y compostar. Después recuperar energía. Y al final, enterrar. Reciclar no es el primer paso: es el cuarto, y llega cuando las tres decisiones anteriores ya se perdieron.',
        destacado: 'El mejor residuo es el que no existe.',
      },
      {
        cuerpo:
          'En un relleno sanitario la basura queda enterrada durante décadas, y la parte orgánica se pudre sin oxígeno. Eso genera metano, un gas de efecto invernadero mucho más potente que el CO₂ en el corto plazo. Por eso compostar en casa no es un gesto decorativo: saca del relleno la fracción que más pesa.',
        destacado: 'Lo orgánico enterrado no desaparece: se convierte en metano.',
      },
    ],
    incidentales: {
      marco: [
        { k: 'general', texto: 'Una idea para arrancar', region: 'general' },
        { k: 'caba', texto: 'Acá, en el AMBA', region: 'rioplatense' },
      ],
    },
    conceptos: [['residuos.jerarquia_residuos', 1.0], ['residuos.evitar_es_primero', 0.3]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 1,
    dificultad_base: -0.8,
    fuente: 'epa',
  },

  {
    slug: 'animales.dato_vivo.reserva',
    tipo: 'dato_vivo',
    titulo_interno: 'Dato vivo — la Reserva Ecológica',
    enunciado_tpl: '{{marco.texto}}',
    variantes: [
      {
        valor: 343,
        unidad: 'especies de aves',
        que_significa:
          'Es alrededor de un tercio de todas las aves de la Argentina, en 350 hectáreas construidas sobre escombros de demolición. Nadie las plantó ahí: el ecosistema se rearmó solo durante décadas de abandono.',
      },
      {
        valor: 350,
        unidad: 'hectáreas',
        que_significa:
          'La Reserva Ecológica Costanera Sur está sobre un relleno de escombros de los años setenta que resultó imposible de edificar. Está protegida desde 1986 y es sitio Ramsar desde 2005.',
      },
    ],
    incidentales: {
      marco: [
        { k: 'general', texto: 'En la Reserva Ecológica Costanera Sur', region: 'general' },
        { k: 'caba', texto: 'A veinte minutos del Obelisco', region: 'rioplatense' },
      ],
    },
    conceptos: [['tronco.servicios_ecosistemicos', 1.0]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 1,
    dificultad_base: -1.0,
    fuente: 'reserva-costanera-sur',
  },

  {
    slug: 'digital.dato_vivo.centros_datos',
    tipo: 'dato_vivo',
    titulo_interno: 'Dato vivo — la nube consume',
    enunciado_tpl: '{{marco.texto}}',
    variantes: [
      {
        valor: 945,
        unidad: 'TWh hacia 2030',
        que_significa:
          'Es la proyección de la Agencia Internacional de Energía para la demanda eléctrica de los centros de datos: aproximadamente el doble de la actual, y algo menos del 3 % de la electricidad mundial.',
      },
    ],
    incidentales: {
      marco: [{ k: 'general', texto: 'La nube, medida en electricidad', region: 'general' }],
    },
    conceptos: [['tronco.orden_de_magnitud', 1.0]],
    age_groups: ['teen', 'adult'],
    anillo_min: 1,
    dificultad_base: 0.2,
    fuente: 'iea-energia',
  },

  {
    slug: 'animales.dato_vivo.sarem',
    tipo: 'dato_vivo',
    titulo_interno: 'Dato vivo — mamíferos argentinos evaluados',
    enunciado_tpl: '{{marco.texto}}',
    variantes: [
      {
        valor: 417,
        unidad: 'especies de mamíferos nativos',
        que_significa:
          'Es lo que evaluó la categorización de SAREM en 2019. De esas, 98 quedaron amenazadas y el 92,7 % enfrenta al menos una amenaza. La principal, lejos, es la pérdida y degradación del hábitat.',
      },
    ],
    incidentales: {
      marco: [{ k: 'general', texto: 'El estado de los mamíferos en la Argentina', region: 'general' }],
    },
    conceptos: [['tronco.leer_un_numero', 1.0]],
    age_groups: ['teen', 'adult'],
    anillo_min: 1,
    dificultad_base: 0.1,
    fuente: 'sarem-2019',
  },
];
