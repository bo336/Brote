// Tipos de secuencia: `ordenar_secuencia`, `ranking_impacto`, `cadena_causal`.
//
// Los tres son tipos de PRODUCCIÓN, no de reconocimiento: hay que armar la
// respuesta, no elegirla. Cuesta más y se retiene mejor (dificultad deseable).
//
// `ordenar_secuencia` y `ranking_impacto` dan crédito parcial por distancia de
// Kendall — poner cuatro de cinco en orden demuestra algo. `cadena_causal` es
// todo o nada a propósito: media cadena causal no explica nada.
//
// `ranking_impacto` existe para atacar la idea más cara del ambientalismo
// cotidiano: que todas las acciones verdes pesan parecido. Por eso revela los
// números reales, con su fuente, después de contestar.

export default [
  // ── ordenar_secuencia ─────────────────────────────────────────────────────
  {
    slug: 'residuos.orden.jerarquia',
    tipo: 'ordenar_secuencia',
    titulo_interno: 'La jerarquía de residuos, en orden',
    enunciado_tpl: '{{marco.texto}}',
    variantes: [
      {
        consigna: 'Ordená las opciones de la mejor a la peor, según la jerarquía de gestión de residuos.',
        orden: ['Evitar que el residuo exista', 'Reducir la cantidad', 'Reutilizar', 'Reciclar o compostar', 'Enterrar en un relleno'],
        d: -0.1,
        explicacion:
          'Evitar, reducir, reutilizar, reciclar, y recién al final disponer. Reciclar es la cuarta opción: llega cuando las tres decisiones anteriores ya se perdieron.',
      },
    ],
    incidentales: {
      marco: [
        { k: 'general', texto: 'De mejor a peor:', region: 'general' },
        { k: 'caba', texto: 'De mejor a peor, según la jerarquía que usa la Ley Basura Cero:', region: 'rioplatense' },
      ],
    },
    conceptos: [['residuos.jerarquia_residuos', 1.0], ['residuos.evitar_es_primero', 0.6]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 1,
    dificultad_base: -0.1,
    fuente: 'epa',
  },

  {
    slug: 'agua.orden.potabilizacion',
    tipo: 'ordenar_secuencia',
    titulo_interno: 'El recorrido del agua potable',
    enunciado_tpl: '{{marco.texto}}',
    variantes: [
      {
        consigna: 'Ordená las etapas de potabilización, desde que el agua sale del río hasta que llega a tu casa.',
        orden: ['Toma del río', 'Coagulación y floculación', 'Sedimentación', 'Filtración', 'Cloración', 'Red de distribución'],
        d: 0.2,
        explicacion:
          'Primero se agrupan las partículas para que pesen (coagulación y floculación), después decantan (sedimentación), después se filtra lo que queda y por último se clora para que el agua siga siendo segura durante todo el recorrido por la red.',
      },
      {
        consigna: 'Ordená el recorrido del agua de lluvia que cae en una vereda de la ciudad hasta el río.',
        orden: ['Cae sobre pavimento', 'Va a la rejilla de la esquina', 'Entra al conducto pluvial', 'Sale por un arroyo entubado', 'Desemboca en el río'],
        d: 0.1,
        explicacion:
          'Lo que va a la rejilla NO va a una planta de tratamiento: el pluvial descarga al río. Por eso lo que se tira o se lava en la calle termina en el agua, y por eso el suelo impermeabilizado empeora las inundaciones.',
      },
    ],
    incidentales: {
      marco: [
        { k: 'general', texto: '', region: 'general' },
        { k: 'caba', texto: 'Acá, en el AMBA:', region: 'rioplatense' },
      ],
    },
    conceptos: [['agua.potabilizacion', 1.0], ['agua.rejilla_llega_al_rio', 0.6]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 1,
    dificultad_base: 0.15,
    fuente: 'acumar',
  },

  {
    slug: 'consumo.orden.circular',
    tipo: 'ordenar_secuencia',
    titulo_interno: 'Estrategias circulares, de más a menos valor conservado',
    enunciado_tpl: '{{marco.texto}}',
    variantes: [
      {
        consigna: 'Ordená las estrategias de la que conserva MÁS valor a la que conserva menos.',
        orden: ['No comprar: usar lo que ya tenés', 'Reparar', 'Reutilizar o revender', 'Reciclar el material', 'Recuperar energía quemándolo'],
        d: 0.4,
        explicacion:
          'Cuanto más cerca del uso original se cierra el ciclo, menos energía se pierde. Reparar conserva muchísimo más valor que fundir y rehacer: el producto sigue siendo un producto.',
      },
    ],
    incidentales: { marco: [{ k: 'general', texto: '', region: 'general' }] },
    conceptos: [['consumo.economia_circular', 1.0], ['consumo.derecho_a_reparar', 0.3]],
    age_groups: ['teen', 'adult'],
    anillo_min: 2,
    dificultad_base: 0.45,
    fuente: 'ellen-macarthur',
  },

  // ── ranking_impacto ───────────────────────────────────────────────────────
  {
    slug: 'alimentacion.ranking.co2_alimentos',
    tipo: 'ranking_impacto',
    titulo_interno: 'Huella de carbono por alimento',
    enunciado_tpl: '{{marco.texto}}',
    variantes: [
      {
        consigna: 'Ordená de MAYOR a MENOR emisión de CO₂ equivalente por kilo producido.',
        orden: [
          { texto: 'Carne vacuna', dominio: 'alimentacion', valor: 27, unidad: 'kg CO₂e/kg' },
          { texto: 'Queso', dominio: 'alimentacion', valor: 21, unidad: 'kg CO₂e/kg' },
          { texto: 'Pollo', dominio: 'alimentacion', valor: 6, unidad: 'kg CO₂e/kg' },
          { texto: 'Legumbres', dominio: 'alimentacion', valor: 0.9, unidad: 'kg CO₂e/kg' },
        ],
        d: 0.2,
        explicacion:
          'Entre la carne vacuna y las legumbres hay un factor de casi treinta. Por eso cambiar QUÉ comés mueve mucho más el número que cambiar de dónde viene.',
      },
    ],
    incidentales: {
      marco: [
        { k: 'general', texto: '', contexto: 'general' },
        { k: 'compra', texto: 'Cuatro cosas que podrías poner en el changuito.', contexto: 'compra' },
      ],
    },
    conceptos: [['alimentacion.huella_por_alimento', 1.0], ['tronco.no_todo_pesa_igual', 0.6]],
    age_groups: ['teen', 'adult'],
    anillo_min: 1,
    dificultad_base: 0.25,
    fuente: 'owid-alimentos',
  },

  {
    slug: 'agua.ranking.agua_virtual',
    tipo: 'ranking_impacto',
    titulo_interno: 'Agua virtual por producto',
    enunciado_tpl: '{{marco.texto}}',
    variantes: [
      {
        consigna: 'Ordená de MÁS a MENOS agua total necesaria para producirlo.',
        orden: [
          { texto: '1 kg de carne vacuna', dominio: 'agua', valor: 15000, unidad: 'litros' },
          { texto: 'Una remera de algodón', dominio: 'agua', valor: 2700, unidad: 'litros' },
          { texto: 'Una ducha de ocho minutos', dominio: 'agua', valor: 70, unidad: 'litros' },
          { texto: 'Cepillarte los dientes con la canilla cerrada', dominio: 'agua', valor: 1, unidad: 'litro' },
        ],
        d: 0.0,
        explicacion:
          'Las dos primeras son agua que no ves y las dos últimas son las que sí. Los gestos diarios construyen constancia; las compras mueven el número de una sola vez.',
      },
    ],
    incidentales: { marco: [{ k: 'general', texto: '', region: 'general' }] },
    conceptos: [['agua.agua_virtual', 1.0], ['agua.un_litro_no_vale_igual', 0.3]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 1,
    dificultad_base: 0.05,
    fuente: 'huella-hidrica',
  },

  {
    slug: 'movilidad.ranking.modos',
    tipo: 'ranking_impacto',
    titulo_interno: 'Emisiones por pasajero-kilómetro',
    enunciado_tpl: '{{marco.texto}}',
    variantes: [
      {
        consigna: 'Ordená de MÁS a MENOS emisiones por persona y por kilómetro recorrido.',
        orden: [
          { texto: 'Auto naftero con una sola persona', dominio: 'movilidad', valor: 4, unidad: 'referencia alta' },
          { texto: 'Auto eléctrico con una sola persona', dominio: 'movilidad', valor: 3, unidad: 'menor, pero sigue moviendo una tonelada' },
          { texto: 'Colectivo lleno', dominio: 'movilidad', valor: 2, unidad: 'reparte entre muchas personas' },
          { texto: 'Bicicleta', dominio: 'movilidad', valor: 1, unidad: 'casi cero en uso' },
        ],
        d: 0.1,
        explicacion:
          'Lo que define la huella del transporte no es solo el vehículo: es cuánta gente viaja en él. Un colectivo lleno reparte su consumo entre decenas de personas; un auto mueve más de una tonelada para trasladar a una.',
      },
    ],
    incidentales: {
      marco: [
        { k: 'general', texto: '', contexto: 'general' },
        { k: 'bici', texto: 'Vos que andás en bici, ya sabés dónde termina una:', contexto: 'bici' },
      ],
    },
    conceptos: [['movilidad.pasajero_km', 1.0], ['movilidad.piramide_movilidad', 0.6]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 1,
    dificultad_base: 0.15,
    fuente: 'icct-ev',
  },

  // ── cadena_causal ─────────────────────────────────────────────────────────
  // La competencia de "pensamiento sistémico" de UNESCO, hecha concreta. Los
  // señuelos son afirmaciones verdaderas que NO pertenecen a esta cadena: es la
  // forma honesta de hacerlo difícil.
  {
    slug: 'agua.cadena.inundacion',
    tipo: 'cadena_causal',
    titulo_interno: 'Por qué se inunda más una ciudad pavimentada',
    enunciado_tpl: '{{marco.texto}}',
    variantes: [
      {
        cadena: [
          'Se pavimenta y se construye sobre el suelo',
          'El agua de lluvia ya no puede infiltrarse',
          'Todo el volumen va junto a los conductos pluviales',
          'Los conductos se superan y el agua vuelve a la calle',
        ],
        decoys: [
          'Aumenta la temperatura media del planeta',
          'Los vecinos tiran basura en las rejillas',
        ],
        d: 0.4,
        explicacion:
          'La cadena es de uso del suelo, no de clima ni de basura. Las dos afirmaciones sobrantes son ciertas y agravan el problema, pero no son eslabones de ESTA cadena: el mecanismo central es que el suelo impermeabilizado no absorbe.',
      },
    ],
    incidentales: {
      marco: [
        { k: 'general', texto: 'Armá la cadena de causa y efecto:', region: 'general' },
        { k: 'caba', texto: 'Armá la cadena. Pensá en el AMBA:', region: 'rioplatense' },
      ],
    },
    conceptos: [['agua.suelo_impermeable', 1.0], ['agua.humedal_esponja', 0.3]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 2,
    dificultad_base: 0.4,
    fuente: 'acumar',
  },

  {
    slug: 'residuos.cadena.metano',
    tipo: 'cadena_causal',
    titulo_interno: 'De la cáscara al metano',
    enunciado_tpl: '{{marco.texto}}',
    variantes: [
      {
        cadena: [
          'Los restos de comida van al tacho común',
          'Terminan enterrados en un relleno sanitario',
          'Se descomponen sin oxígeno',
          'Se genera metano, un gas de efecto invernadero potente',
        ],
        decoys: [
          'El plástico del relleno se degrada en microplásticos',
          'Los camiones de recolección consumen gasoil',
        ],
        d: 0.3,
        explicacion:
          'La clave del mecanismo es "sin oxígeno": lo mismo que en una compostera, con aire, se descompone sin generar metano. Los dos señuelos son ciertos y también son impactos del sistema de residuos, pero no forman parte de esta cadena.',
      },
    ],
    incidentales: { marco: [{ k: 'general', texto: 'Armá la cadena de causa y efecto:', region: 'general' }] },
    conceptos: [['residuos.metano_de_relleno', 1.0], ['residuos.fraccion_organica', 0.6]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 2,
    dificultad_base: 0.35,
    fuente: 'ipcc-ar6',
  },

  {
    slug: 'movilidad.cadena.demanda_inducida',
    tipo: 'cadena_causal',
    titulo_interno: 'Por qué ensanchar una autopista no descongestiona',
    enunciado_tpl: '{{marco.texto}}',
    variantes: [
      {
        cadena: [
          'Se agregan carriles para descongestionar',
          'Viajar en auto se vuelve más rápido y más cómodo',
          'Más gente elige el auto y hace viajes que antes no hacía',
          'La congestión vuelve al nivel anterior, con más autos',
        ],
        decoys: [
          'Suben las emisiones por el uso de combustible',
          'Los colectivos tardan menos en el nuevo carril',
        ],
        d: 0.8,
        explicacion:
          'Se llama demanda inducida: la capacidad extra no se reparte entre los autos que ya estaban, atrae autos nuevos. El primer señuelo es una consecuencia del final de la cadena, no un eslabón; el segundo directamente no ocurre.',
      },
    ],
    incidentales: {
      marco: [
        { k: 'general', texto: 'Armá la cadena de causa y efecto:', contexto: 'general' },
        { k: 'auto', texto: 'Vos que manejás, armá la cadena:', contexto: 'auto' },
      ],
    },
    conceptos: [['movilidad.demanda_inducida', 1.0], ['tronco.efecto_rebote', 0.6]],
    age_groups: ['teen', 'adult'],
    anillo_min: 2,
    dificultad_base: 0.85,
    fuente: 'icct-ev',
  },
];
