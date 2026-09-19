// Tipos de elección: `opcion_multiple`, `mito_o_dato`, `elegir_la_accion`.
//
// La regla que decide la calidad está en 11-exercise-types.md §2: los
// distractores NO se inventan. Salen, en este orden de preferencia:
//   1. de una creencia falsa documentada (`estrategia: 'misconception'`),
//   2. de una perturbación estructurada del número correcto (×10, ÷10, unidad),
//   3. de un vecino semántico, y solo como último recurso.
// Un modelo produce respuestas incorrectas *válidas*; lo que no produce son las
// incorrectas que la gente realmente elige. Por eso el inventario de mitos es el
// combustible principal, y cuando alguien pica un distractor de esos, la
// explicación puede hablarle de ESA creencia y no de una genérica.

export default [
  // ── opcion_multiple ───────────────────────────────────────────────────────
  {
    slug: 'agua.om.huella_alimento',
    tipo: 'opcion_multiple',
    titulo_interno: 'Agua virtual por alimento',
    enunciado_tpl: '{{marco.texto}}, ¿cuánta agua hace falta para producir 1 kg de {{alimento.texto}}?',
    ayuda: 'Pensá en toda la cadena, no en el agua que le das de tomar al animal.',
    // RADICALES: cambian el ítem y su dificultad.
    variantes: [
      {
        alimento: { texto: 'carne vacuna' },
        clave: '15.000 litros',
        d: 0.2,
        explicacion:
          'Del orden de 15.000 litros por kilo, contando el agua de la pastura y del forraje que el animal comió durante años. El agua que bebe el animal es una fracción mínima del total.',
        nota_por_opcion: {
          '150 litros': 'Esa es, más o menos, el agua de beber del animal. La cadena entera es mil veces más.',
        },
      },
      {
        alimento: { texto: 'algodón, para una remera' },
        clave: '2.700 litros',
        d: 0.1,
        explicacion:
          'Una remera de algodón se lleva alrededor de 2.700 litros. Por eso usar la ropa que ya tenés mueve más el número que acortar la ducha.',
      },
    ],
    // INCIDENTALES: la misma pregunta con otra ropa. Multiplican el rendimiento
    // sin cambiar la dificultad, y son lo que hace que dos personas distintas no
    // vean la misma sesión.
    incidentales: {
      marco: [
        { k: 'general', texto: 'Aproximadamente', contexto: 'general' },
        { k: 'compra', texto: 'Cuando lo ponés en el changuito', contexto: 'compra' },
      ],
    },
    distractores: { estrategia: 'perturbacion', ops: ['/100', '/10', 'x10'] },
    conceptos: [['agua.agua_virtual', 1.0], ['agua.huella_hidrica', 0.3]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 1,
    dificultad_base: 0.15,
    fuente: 'huella-hidrica',
  },

  {
    slug: 'residuos.om.jerarquia',
    tipo: 'opcion_multiple',
    titulo_interno: 'Qué va primero en la jerarquía de residuos',
    enunciado_tpl: '{{marco.texto}} {{situacion.texto}} ¿Cuál es la mejor decisión?',
    variantes: [
      {
        situacion: { texto: 'Comprás algo que viene con mucho envase.' },
        clave: 'Elegir, la próxima vez, una opción con menos envase',
        distractores: [
          'Reciclar el envase',
          'Reutilizarlo como recipiente',
          'Separarlo bien y llevarlo a un Punto Verde',
        ],
        d: 0.0,
        explicacion:
          'Evitar está antes que reutilizar y mucho antes que reciclar. Las otras tres opciones están bien, pero todas actúan cuando el residuo YA existe.',
        nota_por_opcion: {
          'Reciclar el envase':
            'Es lo que casi todo el mundo contesta. La trampa está en que reciclar es la cuarta opción de la jerarquía, no la primera.',
        },
      },
      {
        situacion: { texto: 'Se te rompió el cierre de una campera que todavía está entera.' },
        clave: 'Arreglar el cierre y seguir usándola',
        distractores: [
          'Llevarla a un contenedor de textiles',
          'Comprar una nueva y donar esta',
          'Cortarla para usar de trapo',
        ],
        d: 0.3,
        explicacion:
          'Alargar la vida útil conserva mucho más valor que cualquier reciclado: no hay que fundir, rehacer ni transportar nada. Reparar es la forma más barata de circularidad.',
      },
    ],
    incidentales: {
      marco: [
        { k: 'general', texto: 'Situación:', region: 'general' },
        { k: 'caba', texto: 'En tu casa, en el AMBA:', region: 'rioplatense' },
      ],
    },
    distractores: { estrategia: 'lista' },
    conceptos: [['residuos.jerarquia_residuos', 1.0], ['residuos.evitar_es_primero', 0.3]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 1,
    dificultad_base: 0.0,
    fuente: 'epa',
  },

  {
    slug: 'alimentacion.om.huella_comida',
    tipo: 'opcion_multiple',
    titulo_interno: 'Qué mueve más la huella de la comida',
    enunciado_tpl: '{{marco.texto}} ¿Qué cambio reduce más la huella de carbono de lo que comés?',
    variantes: [
      {
        clave: 'Reemplazar algunas comidas con carne por legumbres',
        distractores: [
          'Comprar todo de producción local',
          'Evitar los productos con envase plástico',
          'Elegir siempre la marca con sello verde',
        ],
        d: 0.2,
        explicacion:
          'El transporte es una fracción chica de las emisiones de la mayoría de los alimentos. QUÉ comés pesa mucho más que cuánto viajó: la carne vacuna ronda los 27 kg de CO₂ equivalente por kilo y las legumbres andan por 0,9.',
        nota_por_opcion: {
          'Comprar todo de producción local':
            'Es la respuesta más intuitiva y es la que más se repite. Comprar local tiene otras ventajas reales, pero en emisiones el transporte casi nunca es lo que define.',
        },
      },
    ],
    incidentales: {
      marco: [
        { k: 'general', texto: '', contexto: 'general' },
        { k: 'compra', texto: 'Estás armando la compra de la semana.', contexto: 'compra' },
      ],
    },
    distractores: { estrategia: 'lista' },
    conceptos: [['alimentacion.transporte_es_poco', 1.0], ['alimentacion.que_comes_vs_donde', 0.6]],
    age_groups: ['teen', 'adult'],
    anillo_min: 1,
    dificultad_base: 0.25,
    fuente: 'owid-alimentos',
  },

  {
    slug: 'tronco.om.stock_flujo',
    tipo: 'opcion_multiple',
    titulo_interno: 'Bajar emisiones vs bajar concentración',
    enunciado_tpl:
      'Un país baja sus emisiones un {{recorte.texto}} y las mantiene ahí durante años. ¿Qué pasa con la concentración de CO₂ en la atmósfera?',
    variantes: [
      {
        recorte: { texto: '20 %' },
        clave: 'Sigue subiendo, un poco más lento',
        distractores: ['Baja un 20 %', 'Se mantiene igual', 'Baja, pero más despacio'],
        d: 0.7,
        explicacion:
          'El CO₂ se acumula. Mientras se siga emitiendo más de lo que el planeta absorbe, la concentración sigue creciendo: emitir menos frena la subida, no la revierte. Es un stock, no un caudal.',
        nota_por_opcion: {
          'Se mantiene igual':
            'Sería cierto si la atmósfera fuera un caudal. Es una bañadera: mientras entre más de lo que sale, el nivel sube igual aunque abras menos la canilla.',
        },
      },
      {
        recorte: { texto: '50 %' },
        clave: 'Sigue subiendo, bastante más lento',
        distractores: ['Baja a la mitad', 'Se mantiene igual', 'Baja lentamente'],
        d: 0.9,
        explicacion:
          'Aunque el recorte sea grande, mientras las emisiones netas sean positivas la concentración sigue subiendo. Solo se estabiliza cuando se emite tanto como se absorbe.',
      },
    ],
    incidentales: {
      marco: [{ k: 'general', texto: '', region: 'general' }],
    },
    distractores: { estrategia: 'lista' },
    conceptos: [['tronco.stock_vs_flujo', 1.0], ['tronco.orden_de_magnitud', 0.3]],
    age_groups: ['teen', 'adult'],
    anillo_min: 2,
    dificultad_base: 0.8,
    fuente: 'ipcc-ar6',
  },

  // ── mito_o_dato ───────────────────────────────────────────────────────────
  // El tipo más en misión de todos: consume directamente el inventario de mitos
  // documentados. La afirmación se enuncia tal como la dice la gente.
  {
    slug: 'residuos.mito.reciclaje',
    tipo: 'mito_o_dato',
    titulo_interno: 'Mitos de reciclaje',
    enunciado_tpl: '{{marco.texto}}',
    variantes: [
      {
        afirmacion: 'Si lo ponés en el contenedor de reciclables, se recicla.',
        es_dato: false,
        d: -0.2,
        explicacion:
          'La contaminación cruzada —grasa, restos de comida, papel mojado, materiales mezclados— puede mandar un lote entero al relleno. Limpio, seco y separado es la diferencia entre reciclar y hacer teatro.',
      },
      {
        afirmacion: 'El vidrio se puede reciclar una cantidad indefinida de veces sin perder calidad.',
        es_dato: true,
        d: 0.1,
        explicacion:
          'El vidrio es el caso más noble. El plástico, en cambio, se degrada en cada ciclo y termina en productos de menor valor, y por eso conviene evitarlo antes que reciclarlo.',
      },
      {
        afirmacion: 'Los productos "biodegradables" se degradan en cualquier lado, incluso en un relleno.',
        es_dato: false,
        d: 0.3,
        explicacion:
          'La mayoría de los bioplásticos compostables necesitan compostaje industrial: temperatura alta y condiciones controladas. En un relleno o en el mar se portan mal, y los "oxo-degradables" muchas veces solo se fragmentan en microplásticos.',
      },
    ],
    incidentales: {
      marco: [
        { k: 'general', texto: '¿Mito o dato?', region: 'general' },
        { k: 'caba', texto: '¿Mito o dato, acá en el AMBA?', region: 'rioplatense' },
      ],
    },
    distractores: { estrategia: 'misconception' },
    conceptos: [['residuos.contaminacion_cruzada', 1.0], ['residuos.reciclar_no_es_infinito', 0.6]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 1,
    dificultad_base: 0.0,
    fuente: 'yale-reciclaje',
  },

  {
    slug: 'movilidad.mito.electricos',
    tipo: 'mito_o_dato',
    titulo_interno: 'Mitos de movilidad eléctrica',
    enunciado_tpl: '{{marco.texto}}',
    variantes: [
      {
        afirmacion: 'Los autos eléctricos no contaminan.',
        es_dato: false,
        d: 0.1,
        explicacion:
          'No tienen emisiones por el caño de escape, que no es lo mismo que no tener emisiones: fabricar la batería y generar la electricidad sí emiten. Aun así, en el ciclo de vida completo emiten bastante menos que un auto de combustión comparable en prácticamente toda red estudiada.',
      },
      {
        afirmacion:
          'Aun contando la fabricación de la batería, un auto eléctrico emite menos que uno naftero comparable a lo largo de su vida.',
        es_dato: true,
        d: 0.4,
        explicacion:
          'Es la conclusión de los análisis de ciclo de vida: la desventaja inicial de fabricar la batería se compensa durante el uso, y cuanto más limpia la red, más rápido se compensa.',
      },
      {
        afirmacion: 'Las renovables no sirven porque el sol no siempre brilla y el viento no siempre sopla.',
        es_dato: false,
        d: 0.3,
        explicacion:
          'La intermitencia es un problema de ingeniería, y se resuelve con mezcla de fuentes, dispersión geográfica, gestión de la demanda y almacenamiento. Es un desafío de diseño de sistema, no una razón para descartarlas.',
      },
    ],
    incidentales: {
      marco: [
        { k: 'general', texto: '¿Mito o dato?', contexto: 'general' },
        { k: 'auto', texto: 'Vos que manejás: ¿mito o dato?', contexto: 'auto' },
      ],
    },
    distractores: { estrategia: 'misconception' },
    conceptos: [['movilidad.electrico_sin_tubo_de_escape', 1.0], ['movilidad.ciclo_de_vida', 0.6]],
    age_groups: ['teen', 'adult'],
    anillo_min: 1,
    dificultad_base: 0.2,
    fuente: 'icct-ev',
  },

  {
    slug: 'tronco.mito.ozono_clima',
    tipo: 'mito_o_dato',
    titulo_interno: 'Ozono y clima son dos problemas distintos',
    enunciado_tpl: '{{marco.texto}}',
    variantes: [
      {
        afirmacion: 'El agujero de la capa de ozono es lo que causa el calentamiento global.',
        es_dato: false,
        d: 0.2,
        explicacion:
          'Son dos problemas distintos. El ozono se agota por los CFC, pasa en la estratósfera y afecta la radiación ultravioleta que llega a la superficie. El calentamiento lo causan los gases de efecto invernadero, pasa en la tropósfera y atrapa calor. Es la confusión más persistente que hay en la enseñanza de temas ambientales.',
      },
      {
        afirmacion: 'Un invierno muy frío pone en duda el calentamiento global.',
        es_dato: false,
        d: 0.0,
        explicacion:
          'Tiempo no es clima. Una ola de frío es un dato en una serie ruidosa; la tendencia se mide en décadas y sobre todo el planeta, no en una semana y en tu ciudad.',
      },
    ],
    incidentales: {
      marco: [{ k: 'general', texto: '¿Mito o dato?', region: 'general' }],
    },
    distractores: { estrategia: 'misconception' },
    conceptos: [['tronco.evidencia_y_fuente', 1.0], ['tronco.consenso_cientifico', 0.3]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 1,
    dificultad_base: 0.1,
    fuente: 'ncse-ozono',
  },

  {
    slug: 'consumo.mito.bolsas',
    tipo: 'mito_o_dato',
    titulo_interno: 'Papel vs plástico',
    enunciado_tpl: '{{marco.texto}}',
    variantes: [
      {
        afirmacion: 'Una bolsa de papel siempre es mejor para el ambiente que una de plástico.',
        es_dato: false,
        d: 0.3,
        explicacion:
          'La bolsa de papel arrastra más energía, más agua y más peso en el transporte por unidad. Gana solo si la reusás varias veces o la compostás. La que gana de verdad es la reutilizable usada muchas decenas de veces.',
      },
      {
        afirmacion:
          'Cambiar el material de un envase, sin cambiar cuántos envases usás, casi nunca alcanza.',
        es_dato: true,
        d: 0.5,
        explicacion:
          'Es el fondo del asunto: la decisión que más pesa es la cantidad, no el material. Sustituir es la tercera opción de la jerarquía; evitar y reducir están antes.',
      },
    ],
    incidentales: {
      marco: [
        { k: 'general', texto: '¿Mito o dato?', contexto: 'general' },
        { k: 'compra', texto: 'En la caja del súper: ¿mito o dato?', contexto: 'compra' },
      ],
    },
    distractores: { estrategia: 'misconception' },
    conceptos: [['consumo.cambiar_material_no_alcanza', 1.0], ['consumo.la_compra_evitada', 0.3]],
    age_groups: ['teen', 'adult'],
    anillo_min: 1,
    dificultad_base: 0.35,
    fuente: 'yale-reciclaje',
  },

  // ── elegir_la_accion ──────────────────────────────────────────────────────
  // Decisión con compensaciones reales: las cuatro opciones son legítimas y las
  // cuatro se explican con números. Es el tipo que desemboca naturalmente en el
  // gancho de acción de la pantalla de resultados.
  {
    slug: 'agua.accion.canilla',
    tipo: 'elegir_la_accion',
    titulo_interno: 'Dónde conviene poner el esfuerzo en agua',
    enunciado_tpl: '{{marco.texto}}',
    variantes: [
      {
        escenario:
          'Querés bajar en serio tu consumo de agua este año y tenés tiempo para una sola cosa. ¿Cuál elegís?',
        clave: 'Revisar y arreglar las pérdidas de la casa',
        distractores: [
          'Acortar la ducha dos minutos',
          'Cerrar la canilla mientras te cepillás',
          'Juntar el agua fría de la ducha en un balde',
        ],
        d: 0.1,
        explicacion:
          'Las tres alternativas suman y construyen hábito. Pero una pérdida que gotea todo el día, todos los días, corre sin que nadie la mire: arreglarla es lo único de la lista que no depende de acordarse cada vez.',
      },
      {
        escenario:
          'Tu consorcio quiere reducir el consumo de agua del edificio. ¿Por dónde conviene empezar?',
        clave: 'Medir primero: dónde y cuánto se está yendo',
        distractores: [
          'Poner carteles en los baños',
          'Cambiar todas las canillas por unas nuevas',
          'Pedirle a cada departamento que acorte las duchas',
        ],
        d: 0.6,
        explicacion:
          'Sin medición no sabés si el problema son las pérdidas, el riego, el lavadero o una sola unidad. Cambiar canillas antes de medir es caro y puede no tocar el problema real.',
      },
    ],
    incidentales: {
      marco: [
        { k: 'general', texto: '', contexto: 'general' },
        { k: 'jardin', texto: 'Tenés jardín, así que el riego también cuenta.', contexto: 'jardin' },
      ],
    },
    distractores: { estrategia: 'lista' },
    conceptos: [['agua.perdidas_y_medicion', 1.0], ['tronco.no_todo_pesa_igual', 0.3]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 1,
    dificultad_base: 0.2,
    fuente: 'acumar',
  },

  {
    slug: 'energia.accion.factura',
    tipo: 'elegir_la_accion',
    titulo_interno: 'Dónde está el grueso del consumo eléctrico',
    enunciado_tpl: '{{marco.texto}}',
    variantes: [
      {
        escenario:
          'Te llegó una factura de luz alta y querés bajarla de verdad. ¿Qué atacás primero?',
        clave: 'La climatización: cuántas horas y a qué temperatura',
        distractores: [
          'Desenchufar los cargadores que quedan enchufados',
          'Cambiar las últimas lámparas que quedan incandescentes',
          'Apagar la tele del todo en vez de dejarla en espera',
        ],
        d: 0.3,
        explicacion:
          'Las tres opciones descartadas son reales y valen la pena, pero son chicas. El grueso de una factura doméstica está en climatizar y en calentar agua: ahí se mueve el número.',
        nota_por_opcion: {
          'Desenchufar los cargadores que quedan enchufados':
            'El consumo en espera existe de verdad, pero es la punta del iceberg al revés: mucha atención para poca energía.',
        },
      },
    ],
    incidentales: {
      marco: [{ k: 'general', texto: '', region: 'general' }],
    },
    distractores: { estrategia: 'lista' },
    conceptos: [['energia.donde_esta_el_grueso', 1.0], ['energia.consumo_fantasma', 0.6]],
    age_groups: ['teen', 'adult'],
    anillo_min: 1,
    dificultad_base: 0.3,
    fuente: 'epa',
  },

  {
    slug: 'plantas.accion.plantar',
    tipo: 'elegir_la_accion',
    titulo_interno: 'Qué plantar y dónde',
    enunciado_tpl: '{{marco.texto}}',
    variantes: [
      {
        escenario:
          'Tenés lugar para plantar un árbol y querés que sirva para la fauna del lugar. ¿Qué elegís?',
        clave: 'Una especie nativa de tu ecorregión',
        distractores: [
          'La que crezca más rápido',
          'Un ligustro, que agarra en cualquier lado',
          'La que dé más sombra, sea cual sea',
        ],
        d: 0.2,
        explicacion:
          'Plantar cualquier cosa no es automáticamente bueno. El ligustro, la mora y la acacia negra invaden ecosistemas nativos y bajan la biodiversidad local. Una nativa de tu ecorregión sostiene a los insectos y aves que ya viven ahí.',
        nota_por_opcion: {
          'Un ligustro, que agarra en cualquier lado':
            'Justamente por eso es un problema: "agarra en cualquier lado" es la definición de una invasora.',
        },
      },
    ],
    incidentales: {
      marco: [
        { k: 'general', texto: '', contexto: 'general' },
        { k: 'balcon', texto: 'Aunque sea en una maceta grande del balcón:', contexto: 'balcon' },
        { k: 'jardin', texto: 'En tu jardín:', contexto: 'jardin' },
      ],
    },
    distractores: { estrategia: 'lista' },
    conceptos: [['plantas.plantar_la_correcta', 1.0], ['plantas.que_es_nativa', 0.6]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 1,
    dificultad_base: 0.1,
    fuente: 'plantas-nativas',
  },
];
