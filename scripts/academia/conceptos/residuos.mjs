// Rama `residuos` — 7 gajos (4 en anillo 1, 3 en anillo 2), 32 conceptos, 27 hojas.
// Puro dato. Ver scripts/academia/CONTRATO.md.

export default {
  rama: 'residuos',
  gajos: [
    // ─────────────────────────────────────────────────────────────────────
    {
      slug: 'residuos.separar-en-origen',
      anillo: 1,
      titulo_es: 'Separar en origen',
      bajada_es: 'Lo que decidís en la cocina define si el material se recicla o no.',
      icono: 'Trash2',
      age_groups: ['kid', 'teen', 'adult'],
      sort_order: 1,
      conceptos: [
        {
          slug: 'residuos.separar_en_origen',
          titulo_es: 'Separar es cosa de casa',
          enunciado_es:
            'Separar pasa en tu casa, no en la planta: una vez que todo se mezcló en la misma bolsa, el material reciclable ya se arruinó.',
          detalle_es:
            'Por eso el sistema se llama "separación en origen". El origen sos vos: la cocina, el aula, la oficina.',
          fuente: 'ley-1854-basura-cero',
          anillo: 1,
          dificultad_base: -1.2,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [],
        },
        {
          slug: 'residuos.humedos_y_secos',
          titulo_es: 'Húmedos y secos',
          enunciado_es:
            'En la Ciudad la basura se separa en dos: los secos —papel, cartón, plástico, vidrio y metal, limpios— van a la campana verde, y todo lo demás al contenedor negro.',
          detalle_es:
            'Regla corta para no dudar: si está limpio y seco, es seco. Si tiene comida o líquido, es húmedo.',
          fuente: 'ley-1854-basura-cero',
          anillo: 1,
          dificultad_base: -1.1,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['residuos.separar_en_origen'],
        },
        {
          slug: 'residuos.que_es_reciclable',
          titulo_es: 'Qué se recicla de verdad',
          enunciado_es:
            'Que un material sea reciclable en teoría no alcanza: se recicla lo que además llega limpio, se puede separar por tipo y tiene quién lo compre.',
          detalle_es:
            'Papel, cartón, vidrio, metales y algunos plásticos tienen circuito armado. Los envases mezclados y los plásticos livianos, casi nunca.',
          fuente: 'epa',
          anillo: 1,
          dificultad_base: -0.6,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [],
        },
        {
          slug: 'residuos.contaminacion_cruzada',
          titulo_es: 'Un frasco sucio arruina la bolsa',
          enunciado_es:
            'Un envase con restos de comida o líquido moja y ensucia el papel y el cartón que viajan con él, y un lote contaminado se termina enterrando.',
          detalle_es:
            'Un enjuague rápido con el agua que ya usaste para lavar los platos, y que entre seco a la bolsa. Ahí está la diferencia.',
          fuente: 'epa',
          anillo: 1,
          dificultad_base: -0.5,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['residuos.humedos_y_secos'],
          misconceptions: [
            {
              slug: 'residuos.mito_contenedor_recicla',
              creencia_es: 'Lo que tiro en el contenedor de reciclables se recicla.',
              correccion_es:
                'La trampa es buena porque desde la vereda el gesto se ve idéntico: la tapa se cierra igual con el frasco enjuagado que con el sucio, y la sensación de haber hecho lo correcto es la misma. Lo que decide viene después: la grasa, los restos de comida y el papel mojado bajan la calidad de todo el lote y pueden mandarlo entero a enterramiento. Seco y limpio es lo que convierte el gesto en reciclado.',
              fuente: 'epa',
            },
          ],
        },
        {
          slug: 'residuos.puntos_verdes',
          titulo_es: 'Puntos Verdes y campanas',
          enunciado_es:
            'Lo que no entra en la campana de la cuadra —aceite vegetal usado, aparatos electrónicos chicos, algunos materiales especiales— tiene su lugar en los Puntos Verdes.',
          detalle_es:
            'Fijate cuál te queda cerca y juntá durante la semana: con una sola vuelta alcanza.',
          fuente: 'ley-1854-basura-cero',
          anillo: 1,
          dificultad_base: -0.7,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [{ slug: 'residuos.humedos_y_secos', fuerza: 0.5 }],
        },
      ],
      hojas: [
        {
          slug: 'residuos.separar-en-origen.1',
          titulo_es: 'Separar es cosa de casa',
          bajada_es: 'El momento que decide es cuando abrís el tacho.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 1,
          conceptos: ['residuos.separar_en_origen', 'residuos.humedos_y_secos'],
        },
        {
          slug: 'residuos.separar-en-origen.2',
          titulo_es: 'Qué entra en la campana',
          bajada_es: 'Limpio y seco de un lado, comida del otro.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 2,
          conceptos: ['residuos.que_es_reciclable', 'residuos.contaminacion_cruzada'],
        },
        {
          slug: 'residuos.separar-en-origen.3',
          titulo_es: 'Dónde lo dejás',
          bajada_es: 'Campana verde, contenedor negro y Punto Verde: quién recibe qué.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 3,
          conceptos: ['residuos.puntos_verdes', 'residuos.separar_en_origen'],
        },
        {
          slug: 'residuos.separar-en-origen.4',
          titulo_es: 'El enjuague que cambia todo',
          bajada_es: 'Medio minuto de agua y un lote entero que se salva.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 4,
          conceptos: [
            'residuos.contaminacion_cruzada',
            'residuos.humedos_y_secos',
            'residuos.que_es_reciclable',
          ],
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────
    {
      slug: 'residuos.la-escalera',
      anillo: 1,
      titulo_es: 'La escalera de decisiones',
      bajada_es: 'Reciclar está en el medio de la lista. Arriba hay cosas que rinden más.',
      icono: 'ListOrdered',
      age_groups: ['kid', 'teen', 'adult'],
      sort_order: 2,
      conceptos: [
        {
          slug: 'residuos.jerarquia_residuos',
          titulo_es: 'El orden que rinde',
          enunciado_es:
            'Hay un orden: evitar, reducir, reutilizar, reciclar, recuperar energía y —recién al final— disponer. Cuanto más arriba actuás, menos material entra al sistema.',
          detalle_es: 'Reciclar es el cuarto escalón, no el primero.',
          fuente: 'unep',
          anillo: 1,
          dificultad_base: -0.9,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['tronco.jerarquia_decisiones'],
        },
        {
          slug: 'residuos.evitar_es_primero',
          titulo_es: 'El residuo que no existe',
          enunciado_es:
            'El envase que no aceptás es el único que después no hay que lavar, trasladar ni procesar: evitar está arriba de la escalera porque ahorra todo lo que viene después.',
          detalle_es:
            'La bolsa que ya tenías en la mochila, el vaso propio, el "sin sorbete, gracias".',
          fuente: 'ellen-macarthur',
          anillo: 1,
          dificultad_base: -0.8,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['residuos.jerarquia_residuos'],
        },
        {
          slug: 'residuos.reutilizar_alarga_la_vida',
          titulo_es: 'Usarlo otra vez',
          enunciado_es:
            'Reutilizar mantiene el objeto entero: no hay que triturarlo, fundirlo ni volver a fabricarlo, y por eso gasta muchísima menos energía que reciclarlo.',
          detalle_es:
            'Un frasco de mermelada que guarda tornillos ya dio más vueltas que uno que fue a la campana.',
          fuente: 'ellen-macarthur',
          anillo: 1,
          dificultad_base: -0.6,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [{ slug: 'residuos.jerarquia_residuos', fuerza: 0.6 }],
        },
        {
          slug: 'residuos.reciclar_no_es_infinito',
          titulo_es: 'Reciclar baja de categoría',
          enunciado_es:
            'El plástico pierde calidad en cada vuelta: una botella no vuelve a ser botella para siempre, termina en productos de menor valor y en algún momento sale del circuito.',
          detalle_es:
            'Por eso el reciclaje funciona como red de contención y no como solución: la palanca grande está más arriba, en evitar y en rediseñar el envase.',
          fuente: 'yale-reciclaje',
          anillo: 1,
          dificultad_base: -0.3,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [
            'residuos.jerarquia_residuos',
            { slug: 'residuos.que_es_reciclable', fuerza: 0.5 },
          ],
          misconceptions: [
            {
              slug: 'residuos.mito_reciclaje_resuelve',
              creencia_es: 'Reciclando bien el plástico, el problema del plástico está resuelto.',
              correccion_es:
                'Es tentador porque el reciclaje es lo único de toda la cadena que se ve y se hace con las manos: separás, dejás la bolsa y sentís que el círculo se cerró. Pero la mayor parte del plástico que se fabricó nunca se recicló, y el que sí baja de calidad en cada vuelta hasta salir del circuito. El reciclaje llega tarde, cuando el envase ya existe; lo que mueve la aguja es que se fabriquen menos envases y se diseñen mejor.',
              fuente: 'yale-reciclaje',
            },
          ],
        },
      ],
      hojas: [
        {
          slug: 'residuos.la-escalera.1',
          titulo_es: 'Los seis escalones',
          bajada_es: 'De evitar a enterrar, y por qué el orden no es un detalle.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 1,
          conceptos: ['residuos.jerarquia_residuos', 'residuos.evitar_es_primero'],
        },
        {
          slug: 'residuos.la-escalera.2',
          titulo_es: 'El que no compraste',
          bajada_es: 'Evitar y reutilizar, los dos escalones que más rinden.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 2,
          conceptos: ['residuos.evitar_es_primero', 'residuos.reutilizar_alarga_la_vida'],
        },
        {
          slug: 'residuos.la-escalera.3',
          titulo_es: 'Reciclar tiene techo',
          bajada_es: 'Qué le pasa al plástico en cada vuelta.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 3,
          conceptos: ['residuos.reciclar_no_es_infinito', 'residuos.jerarquia_residuos'],
        },
        {
          slug: 'residuos.la-escalera.4',
          titulo_es: 'Elegir el escalón',
          bajada_es: 'Un caso concreto y dónde conviene meter mano.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 4,
          conceptos: [
            'residuos.jerarquia_residuos',
            'residuos.reutilizar_alarga_la_vida',
            'residuos.reciclar_no_es_infinito',
          ],
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────
    {
      slug: 'residuos.compost-en-casa',
      anillo: 1,
      titulo_es: 'Compost en casa',
      bajada_es: 'Cáscaras, yerba y hojas secas pueden volver a ser tierra en tu balcón.',
      icono: 'Sprout',
      age_groups: ['kid', 'teen', 'adult'],
      sort_order: 3,
      conceptos: [
        {
          slug: 'residuos.fraccion_organica',
          titulo_es: 'Lo orgánico no es basura',
          enunciado_es:
            'Buena parte de lo que sale de una cocina —cáscaras, yerba, café, restos de verdura— no es basura: es materia orgánica que puede volver a ser tierra.',
          detalle_es:
            'Mezclada con el resto se pudre sin aire y da olor y líquido. Separada, se convierte en compost.',
          fuente: 'fao',
          anillo: 1,
          dificultad_base: -1.0,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['residuos.humedos_y_secos'],
        },
        {
          slug: 'residuos.compostaje_domiciliario',
          titulo_es: 'Compostar en casa',
          enunciado_es:
            'Compostar es dejar que microorganismos, hongos y bichitos coman tus restos de cocina con aire y humedad hasta convertirlos en tierra fértil.',
          detalle_es:
            'Entra en un balcón: una compostera chica, un puñado de tierra para arrancar y revolver cada tanto.',
          fuente: 'inta',
          anillo: 1,
          dificultad_base: -0.8,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [
            'residuos.fraccion_organica',
            { slug: 'tronco.ciclos_materia', fuerza: 0.6 },
          ],
        },
        {
          slug: 'residuos.verdes_y_marrones',
          titulo_es: 'Verdes y marrones',
          enunciado_es:
            'Una compostera necesita las dos cosas mezcladas: húmedos ricos en nitrógeno —cáscaras, yerba, restos de verdura— y secos ricos en carbono —hojas, cartón, aserrín—.',
          detalle_es:
            'Si huele feo, casi siempre falta seco y falta aire: agregá marrones y revolvé.',
          fuente: 'inta',
          anillo: 1,
          dificultad_base: -0.4,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['residuos.compostaje_domiciliario'],
        },
        {
          slug: 'residuos.vermicompostaje',
          titulo_es: 'Las lombrices trabajan gratis',
          enunciado_es:
            'En una vermicompostera son lombrices las que comen los restos y devuelven humus: ocupa poco, no huele y funciona bien puertas adentro.',
          detalle_es:
            'Quieren sombra, humedad de esponja escurrida y que no las inundes de cítricos ni de cebolla.',
          fuente: 'inta',
          anillo: 1,
          dificultad_base: -0.3,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [{ slug: 'residuos.compostaje_domiciliario', fuerza: 0.6 }],
        },
      ],
      hojas: [
        {
          slug: 'residuos.compost-en-casa.1',
          titulo_es: 'El tacho de la cocina',
          bajada_es: 'Qué hay ahí adentro y por qué no todo es basura.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 1,
          conceptos: ['residuos.fraccion_organica', 'residuos.compostaje_domiciliario'],
        },
        {
          slug: 'residuos.compost-en-casa.2',
          titulo_es: 'Armar la compostera',
          bajada_es: 'Aire, humedad y una mezcla que funciona.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 2,
          conceptos: ['residuos.verdes_y_marrones', 'residuos.compostaje_domiciliario'],
        },
        {
          slug: 'residuos.compost-en-casa.3',
          titulo_es: 'Cuando huele feo',
          bajada_es: 'Diagnóstico rápido: qué le falta a tu compost.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 3,
          conceptos: ['residuos.verdes_y_marrones', 'residuos.vermicompostaje'],
        },
        {
          slug: 'residuos.compost-en-casa.4',
          titulo_es: 'Lombrices en el balcón',
          bajada_es: 'Poco espacio, sin olor, y humus para las macetas.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 4,
          conceptos: ['residuos.vermicompostaje', 'residuos.fraccion_organica'],
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────
    {
      slug: 'residuos.a-donde-va',
      anillo: 1,
      titulo_es: 'A dónde va lo que tirás',
      bajada_es: 'El camión, el relleno, el líquido, el gas y el río.',
      icono: 'Truck',
      age_groups: ['kid', 'teen', 'adult'],
      sort_order: 4,
      conceptos: [
        {
          slug: 'residuos.relleno_sanitario',
          titulo_es: 'El relleno sanitario',
          enunciado_es:
            'Lo que va al contenedor negro no desaparece: viaja en camión hasta un relleno sanitario, donde se compacta y se entierra entre capas preparadas para aislarlo del suelo.',
          detalle_es:
            'Un relleno no es un pozo: es una obra de ingeniería con membranas abajo y sistemas para juntar el líquido y el gas.',
          fuente: 'epa',
          anillo: 1,
          dificultad_base: -1.0,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [],
        },
        {
          slug: 'residuos.ceamse_vida_util',
          titulo_es: 'El relleno tiene fondo',
          enunciado_es:
            'La basura del AMBA termina en los rellenos del CEAMSE, y cada tonelada enterrada ocupa un espacio que no se repone: por eso la ley porteña fija metas para enterrar cada vez menos.',
          detalle_es:
            'Cada bolsa que se evita, se composta o se recicla es lugar que el relleno no usa.',
          fuente: 'ley-1854-basura-cero',
          anillo: 1,
          dificultad_base: -0.5,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [
            'residuos.relleno_sanitario',
            { slug: 'tronco.stock_vs_flujo', fuerza: 0.5 },
          ],
        },
        {
          slug: 'residuos.lixiviados',
          titulo_es: 'El líquido del relleno',
          enunciado_es:
            'Cuando la lluvia atraviesa la basura enterrada arrastra un líquido oscuro y cargado, el lixiviado, que hay que captar y tratar para que no llegue al agua subterránea.',
          detalle_es:
            'Cuanto menos orgánico se entierra, menos lixiviado se genera: el compost también trabaja acá.',
          fuente: 'epa',
          anillo: 1,
          dificultad_base: -0.4,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: ['residuos.relleno_sanitario'],
        },
        {
          slug: 'residuos.metano_de_relleno',
          titulo_es: 'El gas que sale de la basura',
          enunciado_es:
            'La materia orgánica enterrada se descompone sin oxígeno y libera metano, un gas de efecto invernadero potente; en los rellenos se lo capta para quemarlo o generar energía.',
          detalle_es:
            'La misma cáscara que en una compostera se vuelve tierra, enterrada y sin aire se vuelve gas.',
          fuente: 'ipcc-ar6',
          anillo: 1,
          dificultad_base: -0.3,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: [
            'residuos.relleno_sanitario',
            { slug: 'tronco.ciclos_materia', fuerza: 0.5 },
          ],
        },
        {
          slug: 'residuos.del_rio_al_mar',
          titulo_es: 'De la vereda al río',
          enunciado_es:
            'La mayor parte de la basura que termina en el mar salió de tierra firme: se la llevan el viento y la lluvia por los desagües y los arroyos hasta los ríos.',
          detalle_es:
            'En el AMBA ese camino tiene nombres conocidos: la boca de tormenta de tu cuadra, el arroyo entubado, el Riachuelo, el Río de la Plata.',
          fuente: 'unep',
          anillo: 1,
          dificultad_base: -0.7,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [{ slug: 'tronco.escala_local_global', fuerza: 0.5 }],
        },
      ],
      hojas: [
        {
          slug: 'residuos.a-donde-va.1',
          titulo_es: 'Después del camión',
          bajada_es: 'El recorrido de la bolsa negra hasta el relleno.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 1,
          conceptos: ['residuos.relleno_sanitario', 'residuos.ceamse_vida_util'],
        },
        {
          slug: 'residuos.a-donde-va.2',
          titulo_es: 'La boca de tormenta',
          bajada_es: 'Lo que no llega al camión igual se va a algún lado.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 2,
          conceptos: ['residuos.del_rio_al_mar', 'residuos.relleno_sanitario'],
        },
        {
          slug: 'residuos.a-donde-va.3',
          titulo_es: 'Líquido y gas',
          bajada_es: 'Qué pasa adentro de una montaña de basura enterrada.',
          minutos: 5,
          age_groups: ['teen', 'adult'],
          sort_order: 3,
          conceptos: ['residuos.lixiviados', 'residuos.metano_de_relleno'],
        },
        {
          slug: 'residuos.a-donde-va.4',
          titulo_es: 'El espacio se gasta',
          bajada_es: 'Por qué cada tonelada que no se entierra vale doble.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 4,
          conceptos: ['residuos.ceamse_vida_util', 'residuos.del_rio_al_mar'],
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────
    {
      slug: 'residuos.los-plasticos',
      anillo: 2,
      titulo_es: 'Los plásticos por dentro',
      bajada_es: 'Los numeritos, las capas y las palabras que prometen de más.',
      icono: 'Package',
      age_groups: ['kid', 'teen', 'adult'],
      sort_order: 5,
      conceptos: [
        {
          slug: 'residuos.codigos_plasticos',
          titulo_es: 'Los números del triangulito',
          enunciado_es:
            'El número del 1 al 7 adentro del triangulito no dice "esto se recicla": dice de qué plástico está hecho el envase, para poder separarlo por tipo.',
          detalle_es: '1 PET, 2 HDPE, 3 PVC, 4 LDPE, 5 PP, 6 poliestireno, 7 otros.',
          fuente: 'epa',
          anillo: 2,
          dificultad_base: -0.2,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['residuos.que_es_reciclable'],
        },
        {
          slug: 'residuos.pet_y_hdpe',
          titulo_es: 'PET y HDPE, los que tienen mercado',
          enunciado_es:
            'El PET de las botellas (1) y el HDPE de bidones y envases de limpieza (2) son los plásticos con más circuito de reciclado: se identifican fácil y hay quien los compra.',
          detalle_es: 'Vacía, enjuagada y aplastada, una botella ocupa menos y viaja mejor.',
          fuente: 'epa',
          anillo: 2,
          dificultad_base: 0.0,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['residuos.codigos_plasticos'],
        },
        {
          slug: 'residuos.telgopor',
          titulo_es: 'El telgopor es casi todo aire',
          enunciado_es:
            'El poliestireno expandido (6) es casi todo aire: pesa poquísimo y ocupa mucho, así que juntarlo y transportarlo cuesta más de lo que vale y casi nunca encuentra circuito.',
          detalle_es:
            'Acá la palanca está arriba de la escalera: pedir la bandeja sin telgopor, llevar tu propio recipiente.',
          fuente: 'unep',
          anillo: 2,
          dificultad_base: 0.3,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['residuos.codigos_plasticos'],
        },
        {
          slug: 'residuos.tetrabrik_multicapa',
          titulo_es: 'El tetrabrik son tres materiales',
          enunciado_es:
            'Un envase de leche o jugo tipo tetrabrik es cartón, plástico y aluminio pegados en capas: reciclarlo exige una planta que sepa separarlas, y no todas pueden.',
          detalle_es:
            'Es el mejor ejemplo de que el diseño del envase decide, mucho antes que vos, si se va a poder reciclar.',
          fuente: 'ellen-macarthur',
          anillo: 2,
          dificultad_base: 0.2,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [
            'residuos.que_es_reciclable',
            { slug: 'residuos.codigos_plasticos', fuerza: 0.4 },
          ],
        },
        {
          slug: 'residuos.biodegradable_no_es_magia',
          titulo_es: '"Biodegradable" pide condiciones',
          enunciado_es:
            'La mayoría de los plásticos compostables solo se degradan en una planta industrial con temperatura y humedad controladas; en un relleno, en el suelo o en el agua se comportan como plástico común.',
          detalle_es:
            'Los "oxodegradables" son peor: no desaparecen, se parten en pedazos cada vez más chicos.',
          fuente: 'unep',
          anillo: 2,
          dificultad_base: 0.4,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [
            'residuos.compostaje_domiciliario',
            { slug: 'tronco.evidencia_y_fuente', fuerza: 0.5 },
          ],
          misconceptions: [
            {
              slug: 'residuos.mito_biodegradable',
              creencia_es: 'Si dice biodegradable, se deshace solo en cualquier lado.',
              correccion_es:
                'La palabra es tentadora porque suena a que la naturaleza se ocupa sola, y en el laboratorio es cierta: el material efectivamente se degrada, con temperatura, humedad y tiempo controlados. Enterrado sin oxígeno, tirado en la vereda o flotando en el río no tiene nada de eso y se queda ahí igual que cualquier plástico. La pregunta útil no es si es biodegradable, sino dónde termina.',
              fuente: 'unep',
            },
          ],
        },
      ],
      hojas: [
        {
          slug: 'residuos.los-plasticos.1',
          titulo_es: 'Los numeritos',
          bajada_es: 'Qué dice y qué no dice el triángulo con número adentro.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 1,
          conceptos: ['residuos.codigos_plasticos', 'residuos.pet_y_hdpe'],
        },
        {
          slug: 'residuos.los-plasticos.2',
          titulo_es: 'Aire y capas',
          bajada_es: 'Telgopor y tetrabrik: dos envases difíciles, por motivos distintos.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 2,
          conceptos: ['residuos.telgopor', 'residuos.tetrabrik_multicapa'],
        },
        {
          slug: 'residuos.los-plasticos.3',
          titulo_es: 'La palabra biodegradable',
          bajada_es: 'Dónde se degrada, con qué condiciones y en cuánto tiempo.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 3,
          conceptos: ['residuos.biodegradable_no_es_magia', 'residuos.codigos_plasticos'],
        },
        {
          slug: 'residuos.los-plasticos.4',
          titulo_es: 'Cuál sí, cuál no',
          bajada_es: 'Tres envases sobre la mesada y una decisión para cada uno.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 4,
          conceptos: [
            'residuos.pet_y_hdpe',
            'residuos.tetrabrik_multicapa',
            'residuos.telgopor',
          ],
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────
    {
      slug: 'residuos.quien-recicla',
      anillo: 2,
      titulo_es: 'Quién recicla en serio',
      bajada_es: 'Cartoneros, cooperativas y las reglas que deciden quién paga.',
      icono: 'Users',
      age_groups: ['kid', 'teen', 'adult'],
      sort_order: 6,
      conceptos: [
        {
          slug: 'residuos.recuperadores_urbanos',
          titulo_es: 'Quién abre la bolsa',
          enunciado_es:
            'En el AMBA buena parte del material que se recicla pasa antes por las manos de recuperadores urbanos, que separan en la calle y lo llevan a una planta.',
          detalle_es:
            'Cuando separás bien no solo reciclás: hacés que ese trabajo sea más rápido, más seguro y mejor pago.',
          fuente: 'faccyr',
          anillo: 2,
          dificultad_base: -0.4,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['residuos.separar_en_origen'],
        },
        {
          slug: 'residuos.cooperativas_faccyr',
          titulo_es: 'De changa a servicio',
          enunciado_es:
            'Los recuperadores se organizaron en cooperativas y federaciones —FACCyR es la más grande del país— y pasaron de trabajar sueltos a prestar el servicio de recolección de reciclables.',
          detalle_es:
            'Es un caso concreto de lo colectivo: lo que una persona sola no podía negociar, una federación sí.',
          fuente: 'faccyr',
          anillo: 2,
          dificultad_base: -0.1,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['residuos.recuperadores_urbanos'],
        },
        {
          slug: 'residuos.ley_basura_cero',
          titulo_es: 'Basura Cero, la ley porteña',
          enunciado_es:
            'La Ley 1854 de la Ciudad, conocida como Basura Cero, fija metas de reducción progresiva de lo que se manda a enterrar y prohíbe la disposición final de materiales reciclables y aprovechables.',
          detalle_es:
            '"Basura cero" no promete cero basura mañana: nombra una dirección y le pone metas con fecha.',
          fuente: 'ley-1854-basura-cero',
          anillo: 2,
          dificultad_base: 0.2,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: [
            'residuos.relleno_sanitario',
            { slug: 'tronco.presupuestos_minimos', fuerza: 0.5 },
          ],
        },
        {
          slug: 'residuos.rep_envases',
          titulo_es: 'Quien lo pone en el mercado se hace cargo',
          enunciado_es:
            'La Responsabilidad Extendida del Productor pone en cabeza de quien fabrica y vende el envase el costo de gestionarlo después del uso, en vez de dejarlo del lado del vecino y del municipio.',
          detalle_es:
            'En Argentina hay proyectos de ley de envases con REP en debate; la discusión es quién paga, quién controla y qué papel juegan las cooperativas.',
          fuente: 'rep-envases',
          anillo: 2,
          dificultad_base: 0.4,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: [
            'residuos.jerarquia_residuos',
            { slug: 'tronco.individual_y_colectivo', fuerza: 0.5 },
          ],
        },
        {
          slug: 'residuos.greenwashing_mobius',
          titulo_es: 'El triangulito no promete nada',
          enunciado_es:
            'El símbolo del triángulo de flechas no está certificado ni garantiza que ese envase se recicle donde vivís: muchas veces solo indica de qué material está hecho.',
          detalle_es:
            'Preguntá lo concreto: ¿lo recibe la campana de mi barrio?, ¿hay quién lo compre? Si no, el símbolo es decoración.',
          fuente: 'yale-reciclaje',
          anillo: 2,
          dificultad_base: 0.5,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: [
            'residuos.que_es_reciclable',
            { slug: 'tronco.evidencia_y_fuente', fuerza: 0.7 },
          ],
        },
      ],
      hojas: [
        {
          slug: 'residuos.quien-recicla.1',
          titulo_es: 'El trabajo que lo sostiene',
          bajada_es: 'Quiénes recuperan el material en el AMBA y cómo se organizaron.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 1,
          conceptos: ['residuos.recuperadores_urbanos', 'residuos.cooperativas_faccyr'],
        },
        {
          slug: 'residuos.quien-recicla.2',
          titulo_es: 'Las reglas de juego',
          bajada_es: 'Basura Cero y la responsabilidad de quien fabrica el envase.',
          minutos: 6,
          age_groups: ['teen', 'adult'],
          sort_order: 2,
          conceptos: ['residuos.ley_basura_cero', 'residuos.rep_envases'],
        },
        {
          slug: 'residuos.quien-recicla.3',
          titulo_es: 'Leer la etiqueta con lupa',
          bajada_es: 'Símbolos que prometen, leyes que obligan.',
          minutos: 6,
          age_groups: ['teen', 'adult'],
          sort_order: 3,
          conceptos: [
            'residuos.greenwashing_mobius',
            'residuos.rep_envases',
            'residuos.ley_basura_cero',
          ],
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────
    {
      slug: 'residuos.circular',
      anillo: 2,
      titulo_es: 'De lineal a circular',
      bajada_es: 'Que el material vuelva a entrar en vez de terminar enterrado.',
      icono: 'Recycle',
      age_groups: ['kid', 'teen', 'adult'],
      sort_order: 7,
      conceptos: [
        {
          slug: 'residuos.lineal_vs_circular',
          titulo_es: 'Línea recta o círculo',
          enunciado_es:
            'La economía lineal va derecho —extraer, fabricar, usar, tirar— y la circular busca que el material vuelva a entrar: reparación, reutilización, remanufactura y recuperación.',
          detalle_es:
            'En la naturaleza no existe el "tirar": lo que sobra de uno es alimento de otro.',
          fuente: 'ellen-macarthur',
          anillo: 2,
          dificultad_base: -0.1,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [
            'residuos.jerarquia_residuos',
            { slug: 'tronco.ciclos_materia', fuerza: 0.6 },
          ],
        },
        {
          slug: 'residuos.diseno_para_desmontaje',
          titulo_es: 'Diseñado para poder abrirse',
          enunciado_es:
            'Si un producto viene pegado, soldado o hecho de materiales mezclados, no se puede reparar ni separar: la decisión que define su final se tomó en la mesa de diseño.',
          detalle_es:
            'Tornillos en vez de pegamento, batería reemplazable y repuestos disponibles: eso es diseño para el desmontaje.',
          fuente: 'ellen-macarthur',
          anillo: 2,
          dificultad_base: 0.3,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['residuos.lineal_vs_circular'],
        },
        {
          slug: 'residuos.raee_y_metales',
          titulo_es: 'Los aparatos tienen mina adentro',
          enunciado_es:
            'Un celular guarda cobre, aluminio y metales críticos que salieron de una mina: en el tacho se pierden, y en un punto que recibe RAEE se pueden recuperar.',
          detalle_es:
            'El aparato que más ahorra es el que seguís usando: alargarle la vida pesa más que reciclarlo.',
          fuente: 'unep',
          anillo: 2,
          dificultad_base: 0.5,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [
            'residuos.lineal_vs_circular',
            { slug: 'residuos.peligrosos_domiciliarios', fuerza: 0.4 },
          ],
        },
        {
          slug: 'residuos.peligrosos_domiciliarios',
          titulo_es: 'Lo que no va al tacho',
          enunciado_es:
            'Pilas y baterías, termómetros de mercurio, restos de pintura, aceite de motor y lamparitas no van al contenedor ni a la campana: necesitan un punto de recepción especial.',
          detalle_es:
            'Si sos chico y encontrás una pila suelta o un termómetro roto, no lo toques: avisale a una persona adulta.',
          fuente: 'epa',
          anillo: 2,
          dificultad_base: 0.1,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['residuos.que_es_reciclable'],
        },
      ],
      hojas: [
        {
          slug: 'residuos.circular.1',
          titulo_es: 'Línea recta o círculo',
          bajada_es: 'Dos formas de pensar el mismo producto.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 1,
          conceptos: ['residuos.lineal_vs_circular', 'residuos.diseno_para_desmontaje'],
        },
        {
          slug: 'residuos.circular.2',
          titulo_es: 'Lo que no va al tacho',
          bajada_es: 'Pilas, pinturas y aparatos: dónde recibe cada uno.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 2,
          conceptos: ['residuos.peligrosos_domiciliarios', 'residuos.raee_y_metales'],
        },
        {
          slug: 'residuos.circular.3',
          titulo_es: 'El aparato que ya tenés',
          bajada_es: 'Reparar, alargar, y recién después reciclar.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 3,
          conceptos: ['residuos.raee_y_metales', 'residuos.diseno_para_desmontaje'],
        },
        {
          slug: 'residuos.circular.4',
          titulo_es: 'Cerrar el círculo',
          bajada_es: 'Del diseño al punto de recepción, la vuelta completa.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 4,
          conceptos: ['residuos.lineal_vs_circular', 'residuos.peligrosos_domiciliarios'],
        },
      ],
    },
  ],
};
