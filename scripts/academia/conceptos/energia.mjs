// Rama `energia` — 32 conceptos, 7 gajos (4 en anillo 1, 3 en anillo 2).
// Archivo de datos puro: sin lógica, sin imports. Ver scripts/academia/CONTRATO.md.

export default {
  rama: 'energia',
  gajos: [
    // ───────────────────────────────────────────────────────────── anillo 1
    {
      slug: 'energia.kwh-y-factura',
      anillo: 1,
      titulo_es: 'Lo que mide la boleta',
      bajada_es: 'Qué es un kWh, qué dice la factura de luz y qué consume de verdad tu casa.',
      icono: 'Zap',
      age_groups: ['kid', 'teen', 'adult'],
      sort_order: 1,
      conceptos: [
        {
          slug: 'energia.energia_vs_potencia',
          titulo_es: 'Potencia y energía no son lo mismo',
          enunciado_es:
            'La potencia (kW) dice qué tan rápido consume un aparato; la energía (kWh) dice cuánto consumió en total, y es lo que se cobra.',
          detalle_es:
            'Un aparato de mucha potencia usado un ratito puede gastar menos energía que uno chiquito prendido todo el día.',
          fuente: 'iea-energia',
          anillo: 1,
          dificultad_base: -1.1,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [{ slug: 'tronco.stock_vs_flujo', fuerza: 0.5 }],
          misconceptions: [
            {
              slug: 'energia.mito_kw_es_kwh',
              creencia_es: 'kW y kWh son dos maneras de escribir lo mismo.',
              correccion_es:
                'La trampa es que se escriben casi igual y aparecen juntas en la misma boleta. Pero kW es velocidad de consumo y kWh es cantidad consumida: un aparato de 1 kW prendido una hora gasta 1 kWh, y el mismo aparato prendido seis minutos gasta la décima parte.',
              fuente: 'iea-energia',
            },
          ],
        },
        {
          slug: 'energia.el_kwh_cotidiano',
          titulo_es: 'Cuánto es un kWh',
          enunciado_es:
            'Un kilovatio hora es un aparato de 1000 watts funcionando una hora: con esa sola unidad se mide toda la energía eléctrica de una casa.',
          detalle_es:
            'Tener el kWh agarrado te deja comparar dos aparatos sin discutir de memoria.',
          fuente: 'iea-energia',
          anillo: 1,
          dificultad_base: -0.9,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['energia.energia_vs_potencia'],
        },
        {
          slug: 'energia.leer_la_factura',
          titulo_es: 'Leer la boleta de luz',
          enunciado_es:
            'La factura de luz muestra los kWh consumidos en un período: comparar ese número con el mismo período del año pasado dice mucho más que mirar el total en pesos.',
          detalle_es:
            'En el AMBA la boleta la emiten Edenor o Edesur. El precio se mueve por tarifas y subsidios; los kWh cuentan lo que pasó adentro de tu casa.',
          fuente: 'iea-energia',
          anillo: 1,
          dificultad_base: -0.6,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['energia.el_kwh_cotidiano', 'tronco.leer_un_numero'],
        },
        {
          slug: 'energia.consumo_fantasma',
          titulo_es: 'El consumo fantasma',
          enunciado_es:
            'Muchos aparatos siguen tomando un poco de electricidad mientras están apagados o en espera: es un consumo real, aunque chico.',
          detalle_es:
            'La lucecita roja del televisor y el cargador sin celular son el ejemplo clásico.',
          fuente: 'epa',
          anillo: 1,
          dificultad_base: -0.5,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['energia.el_kwh_cotidiano'],
          misconceptions: [
            {
              slug: 'energia.mito_cargador_enchufado',
              creencia_es: 'Dejar el cargador enchufado sin nada conectado no consume nada.',
              correccion_es:
                'Es tentador porque no se ve ni se escucha nada: el cargador no hace ruido, no se calienta casi y parece apagado. Igual sigue tomando un poquito de corriente mientras está enchufado. Chico, sí; cero, no.',
              fuente: 'epa',
            },
          ],
        },
        {
          slug: 'energia.donde_esta_el_grueso',
          titulo_es: 'Dónde está el grueso',
          enunciado_es:
            'En una casa, la climatización, el agua caliente y la heladera se llevan la mayor parte de la energía; los aparatos en espera son una porción chica.',
          detalle_es:
            'Saber esto te deja empezar por lo que mueve la aguja en vez de por lo que se ve más.',
          fuente: 'iea-energia',
          anillo: 1,
          dificultad_base: -0.3,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['energia.consumo_fantasma', 'tronco.no_todo_pesa_igual'],
          misconceptions: [
            {
              slug: 'energia.mito_standby_es_el_problema',
              creencia_es:
                'Con desenchufar todo lo que queda en espera alcanza para que baje la factura.',
              correccion_es:
                'Engancha porque es una acción visible, fácil y que se siente virtuosa, así que uno le atribuye un tamaño que no tiene. El standby existe pero es una porción chica: la aguja la mueven la climatización, el agua caliente y los equipos viejos. Desenchufá igual, y además revisá el aire y el termotanque.',
              fuente: 'iea-energia',
            },
          ],
        },
      ],
      hojas: [
        {
          slug: 'energia.kwh-y-factura.1',
          titulo_es: 'Rápido no es mucho',
          bajada_es: 'La diferencia entre kW y kWh, contada con aparatos de tu casa.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 1,
          conceptos: ['energia.energia_vs_potencia', 'energia.el_kwh_cotidiano'],
        },
        {
          slug: 'energia.kwh-y-factura.2',
          titulo_es: 'La boleta habla en kWh',
          bajada_es: 'Dónde mirar y con qué comparar.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 2,
          conceptos: ['energia.leer_la_factura', 'energia.el_kwh_cotidiano'],
        },
        {
          slug: 'energia.kwh-y-factura.3',
          titulo_es: 'Los que consumen dormidos',
          bajada_es: 'Qué es el standby y qué tamaño tiene de verdad.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 3,
          conceptos: ['energia.consumo_fantasma', 'energia.donde_esta_el_grueso'],
        },
        {
          slug: 'energia.kwh-y-factura.4',
          titulo_es: 'Por dónde empezar en tu casa',
          bajada_es: 'Tres cosas que podés mirar hoy con tu familia.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 4,
          conceptos: [
            'energia.donde_esta_el_grueso',
            'energia.leer_la_factura',
            'energia.energia_vs_potencia',
          ],
        },
      ],
    },

    {
      slug: 'energia.la-casa-que-abriga',
      anillo: 1,
      titulo_es: 'La casa que abriga',
      bajada_es: 'Antes de cambiar el equipo, tapar por dónde se escapa el calor.',
      icono: 'Thermometer',
      age_groups: ['kid', 'teen', 'adult'],
      sort_order: 2,
      conceptos: [
        {
          slug: 'energia.envolvente',
          titulo_es: 'La envolvente',
          enunciado_es:
            'Paredes, techo, ventanas y puertas son la envolvente de una casa: por ahí entra y sale el calor, y una casa bien aislada necesita mucha menos energía para estar cómoda.',
          detalle_es:
            'El techo suele ser el lugar donde más se gana aislando, porque el calor sube.',
          fuente: 'ipcc-ar6',
          anillo: 1,
          dificultad_base: -1.0,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [],
        },
        {
          slug: 'energia.puente_termico',
          titulo_es: 'Puentes térmicos',
          enunciado_es:
            'Hay puntos donde el calor cruza la envolvente mucho más rápido que en el resto —marcos de ventana, encuentros de losa, rendijas— y ahí se va buena parte de lo que gastás en climatizar.',
          detalle_es:
            'Un burlete en la puerta y una cortina pesada de noche son la versión barata de arreglar esto.',
          fuente: 'ipcc-ar6',
          anillo: 1,
          dificultad_base: -0.4,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['energia.envolvente'],
        },
        {
          slug: 'energia.termostato_24_20',
          titulo_es: '24 en verano, 20 en invierno',
          enunciado_es:
            'Poner el aire en 24 °C en verano y la calefacción en 20 °C en invierno deja la casa cómoda y consume bastante menos que llevar el equipo a temperaturas extremas.',
          detalle_es:
            'Cada grado que le pedís de más al equipo se paga en kWh todos los días de la temporada.',
          fuente: 'iea-energia',
          anillo: 1,
          dificultad_base: -0.7,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [{ slug: 'energia.energia_vs_potencia', fuerza: 0.5 }],
        },
        {
          slug: 'energia.agua_caliente',
          titulo_es: 'El agua caliente',
          enunciado_es:
            'Calentar agua es uno de los usos más grandes de una casa: el termotanque mantiene un tanque caliente todo el día, el calefón calienta solo cuando abrís la canilla y la bomba de calor entrega varias veces más calor que la electricidad que consume.',
          detalle_es:
            'Por eso una ducha más corta y un termotanque bien aislado compiten en serio con cambiar las lámparas.',
          fuente: 'iea-energia',
          anillo: 1,
          dificultad_base: -0.2,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: ['energia.donde_esta_el_grueso'],
        },
        {
          slug: 'energia.led_vs_incandescente',
          titulo_es: 'LED, halógena, incandescente',
          enunciado_es:
            'Una lámpara LED da la misma luz que una incandescente usando una fracción de la electricidad, y además dura mucho más.',
          detalle_es:
            'La incandescente se calienta porque buena parte de la energía se le va en calor en vez de en luz.',
          fuente: 'iea-energia',
          anillo: 1,
          dificultad_base: -1.2,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [],
        },
      ],
      hojas: [
        {
          slug: 'energia.la-casa-que-abriga.1',
          titulo_es: 'Por dónde se escapa el calor',
          bajada_es: 'La envolvente y sus agujeros, sin obra ni presupuesto.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 1,
          conceptos: ['energia.envolvente', 'energia.puente_termico'],
        },
        {
          slug: 'energia.la-casa-que-abriga.2',
          titulo_es: 'El número del control remoto',
          bajada_es: 'Qué pasa con cada grado que le pedís al aire.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 2,
          conceptos: ['energia.termostato_24_20', 'energia.envolvente'],
        },
        {
          slug: 'energia.la-casa-que-abriga.3',
          titulo_es: 'Duchas, tanques y bombas',
          bajada_es: 'Tres maneras de calentar agua y en qué se diferencian.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 3,
          conceptos: ['energia.agua_caliente', 'energia.termostato_24_20'],
        },
        {
          slug: 'energia.la-casa-que-abriga.4',
          titulo_es: 'Luz que no calienta',
          bajada_es: 'Por qué la LED gana y qué más podés cambiar el mismo día.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 4,
          conceptos: ['energia.led_vs_incandescente', 'energia.puente_termico'],
        },
      ],
    },

    {
      slug: 'energia.elegir-sin-adivinar',
      anillo: 1,
      titulo_es: 'Elegir sin adivinar',
      bajada_es: 'La etiqueta A–G, la cuenta de servilleta y la trampa del rebote.',
      icono: 'Tag',
      age_groups: ['kid', 'teen', 'adult'],
      sort_order: 3,
      conceptos: [
        {
          slug: 'energia.etiqueta_eficiencia',
          titulo_es: 'La etiqueta A–G',
          enunciado_es:
            'Los electrodomésticos que se venden en Argentina llevan una etiqueta de eficiencia energética con letras de la A a la G: la A consume menos que la G para hacer el mismo trabajo.',
          detalle_es:
            'La etiqueta también trae un consumo estimado en kWh: ese es el número comparable entre dos modelos.',
          fuente: 'iea-energia',
          anillo: 1,
          dificultad_base: -0.8,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['energia.el_kwh_cotidiano'],
        },
        {
          slug: 'energia.cuenta_de_servilleta',
          titulo_es: 'La cuenta de servilleta',
          enunciado_es:
            'Potencia por horas de uso te da los kWh: con esa cuenta estimás lo que consume cualquier aparato sin tener que creerle a nadie.',
          detalle_es:
            'No busques precisión: buscá el orden de magnitud, que es lo que decide si algo importa o no.',
          fuente: 'iea-energia',
          anillo: 1,
          dificultad_base: -0.3,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: ['energia.energia_vs_potencia', 'tronco.orden_de_magnitud'],
        },
        {
          slug: 'energia.rebote_energetico',
          titulo_es: 'El rebote',
          enunciado_es:
            'Cuando un equipo se vuelve más eficiente da ganas de usarlo más, y parte de lo ahorrado se va en ese uso extra.',
          detalle_es:
            'No es un argumento contra mejorar el equipo: es un motivo para mirar los kWh después del cambio.',
          fuente: 'iea-energia',
          anillo: 1,
          dificultad_base: -0.2,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: ['energia.etiqueta_eficiencia', 'tronco.efecto_rebote'],
        },
        {
          slug: 'energia.orden_de_las_decisiones',
          titulo_es: 'Primero no gastar',
          enunciado_es:
            'En energía el orden que más rinde es: no gastar lo que no hace falta, después usar mejor lo que ya tenés, después cambiar el equipo y recién ahí generar.',
          detalle_es:
            'Es el mismo orden que usan los planes de mitigación: evitar, mejorar, reemplazar.',
          fuente: 'ipcc-ar6',
          anillo: 1,
          dificultad_base: -0.4,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['tronco.jerarquia_decisiones', 'energia.donde_esta_el_grueso'],
        },
      ],
      hojas: [
        {
          slug: 'energia.elegir-sin-adivinar.1',
          titulo_es: 'Qué dice la letra',
          bajada_es: 'Leer una etiqueta de eficiencia como quien lee un precio.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 1,
          conceptos: ['energia.etiqueta_eficiencia', 'energia.cuenta_de_servilleta'],
        },
        {
          slug: 'energia.elegir-sin-adivinar.2',
          titulo_es: 'Ahorré y gasté igual',
          bajada_es: 'Qué es el rebote y cómo se lo detecta en tu propia boleta.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 2,
          conceptos: ['energia.rebote_energetico', 'energia.etiqueta_eficiencia'],
        },
        {
          slug: 'energia.elegir-sin-adivinar.3',
          titulo_es: 'El orden que rinde',
          bajada_es: 'Cuatro pasos, siempre en el mismo orden.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 3,
          conceptos: ['energia.orden_de_las_decisiones', 'energia.etiqueta_eficiencia'],
        },
        {
          slug: 'energia.elegir-sin-adivinar.4',
          titulo_es: 'La cuenta la hacés vos',
          bajada_es: 'Estimar el consumo de un aparato en treinta segundos.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 4,
          conceptos: ['energia.cuenta_de_servilleta', 'energia.rebote_energetico'],
        },
      ],
    },

    {
      slug: 'energia.de-donde-sale-la-luz',
      anillo: 1,
      titulo_es: 'De dónde sale la luz',
      bajada_es: 'La mezcla que hay detrás del enchufe argentino, y qué emite cada kWh.',
      icono: 'PlugZap',
      age_groups: ['kid', 'teen', 'adult'],
      sort_order: 4,
      conceptos: [
        {
          slug: 'energia.matriz_electrica_ar',
          titulo_es: 'La matriz eléctrica argentina',
          enunciado_es:
            'La electricidad argentina se genera con una mezcla: sobre todo centrales térmicas a gas, más hidroeléctricas, nuclear y una porción creciente de eólica y solar.',
          detalle_es:
            'Cuando enchufás algo no estás tomando de una sola fuente: estás tomando de esa mezcla, tal como esté en ese momento.',
          fuente: 'iea-energia',
          anillo: 1,
          dificultad_base: -0.6,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [],
        },
        {
          slug: 'energia.factor_emision_red',
          titulo_es: 'Cuánto emite un kWh',
          enunciado_es:
            'Cada kWh que tomás de la red trae emisiones asociadas según con qué se generó, y ese número —gramos de CO₂ por kWh— cambia según el país, la hora y la estación.',
          detalle_es:
            'Por eso la misma heladera "emite" distinto en dos países, y por eso electrificar rinde más a medida que la red se limpia.',
          fuente: 'ipcc-ar6',
          anillo: 1,
          dificultad_base: -0.25,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: ['energia.matriz_electrica_ar', 'tronco.leer_un_numero'],
        },
        {
          slug: 'energia.nuclear_bajas_emisiones',
          titulo_es: 'La nuclear y el CO₂',
          enunciado_es:
            'Medidas por kWh, las emisiones de CO₂ de la energía nuclear están en la misma banda baja que la eólica y la hidro: sus debates reales son los residuos, el costo y el riesgo de accidente.',
          detalle_es:
            'En Argentina generan Atucha I, Atucha II y Embalse.',
          fuente: 'ipcc-ar6',
          anillo: 1,
          dificultad_base: -0.2,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: ['energia.matriz_electrica_ar'],
          misconceptions: [
            {
              slug: 'energia.mito_nuclear_emisora',
              creencia_es: 'La energía nuclear es una de las que más CO₂ emite.',
              correccion_es:
                'La imagen ayuda a la confusión: las torres de refrigeración largan una columna blanca enorme que parece humo y es vapor de agua. Y como el tema nuclear pesa, uno tiende a colgarle todos los problemas juntos. Por kWh, sus emisiones están en la banda baja, con la eólica y la hidro. Discutir residuos, costo y riesgo tiene sentido; discutir su CO₂, no.',
              fuente: 'ipcc-ar6',
            },
          ],
        },
        {
          slug: 'energia.renovables_argentinas',
          titulo_es: 'Viento del sur, sol del norte',
          enunciado_es:
            'Argentina tiene dos recursos renovables de primera: el viento constante de la Patagonia y el sol de la Puna, donde está el parque solar de Cauchari, en Jujuy.',
          detalle_es:
            'Son lugares lejos del AMBA, así que la energía también necesita líneas que la traigan hasta acá.',
          fuente: 'iea-energia',
          anillo: 1,
          dificultad_base: -0.5,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['energia.matriz_electrica_ar'],
        },
      ],
      hojas: [
        {
          slug: 'energia.de-donde-sale-la-luz.1',
          titulo_es: 'La mezcla detrás del enchufe',
          bajada_es: 'Qué generó la luz que tenés prendida ahora.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 1,
          conceptos: ['energia.matriz_electrica_ar', 'energia.renovables_argentinas'],
        },
        {
          slug: 'energia.de-donde-sale-la-luz.2',
          titulo_es: 'Gramos por kilovatio hora',
          bajada_es: 'El número que traduce electricidad en emisiones.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 2,
          conceptos: ['energia.factor_emision_red', 'energia.matriz_electrica_ar'],
        },
        {
          slug: 'energia.de-donde-sale-la-luz.3',
          titulo_es: 'Nuclear: qué se discute de verdad',
          bajada_es: 'Separar el debate que corresponde del que no.',
          minutos: 6,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 3,
          conceptos: ['energia.nuclear_bajas_emisiones', 'energia.factor_emision_red'],
        },
        {
          slug: 'energia.de-donde-sale-la-luz.4',
          titulo_es: 'El mapa energético argentino',
          bajada_es: 'Dónde está cada cosa, de Jujuy a Chubut.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 4,
          conceptos: [
            'energia.renovables_argentinas',
            'energia.nuclear_bajas_emisiones',
            'energia.matriz_electrica_ar',
          ],
        },
      ],
    },

    // ───────────────────────────────────────────────────────────── anillo 2
    {
      slug: 'energia.la-red-que-respira',
      anillo: 2,
      titulo_es: 'La red que respira',
      bajada_es: 'La demanda sube y baja todo el día: ahí se juega el partido de las renovables.',
      icono: 'Activity',
      age_groups: ['teen', 'adult'],
      sort_order: 5,
      conceptos: [
        {
          slug: 'energia.demanda_pico',
          titulo_es: 'La hora pico de la red',
          enunciado_es:
            'La demanda eléctrica no es pareja: tiene picos —las tardes de calor, las noches de frío— y el sistema tiene que estar dimensionado para ese momento, no para el promedio.',
          detalle_es:
            'Por eso el promedio anual de consumo cuenta poco: lo que obliga a construir centrales es el rato más exigente del año.',
          fuente: 'iea-energia',
          anillo: 2,
          dificultad_base: 0.2,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: ['energia.matriz_electrica_ar', 'tronco.promedio_engana'],
        },
        {
          slug: 'energia.curva_del_pato',
          titulo_es: 'La curva del pato',
          enunciado_es:
            'Con mucha generación solar sobra energía al mediodía y la demanda salta al atardecer, justo cuando el sol se va: dibujada, esa curva parece un pato y describe el desafío de operar una red renovable.',
          detalle_es: null,
          fuente: 'iea-energia',
          anillo: 2,
          dificultad_base: 0.5,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: ['energia.demanda_pico', 'energia.renovables_argentinas'],
        },
        {
          slug: 'energia.intermitencia',
          titulo_es: 'Intermitencia, resuelta con sistema',
          enunciado_es:
            'El sol y el viento no están siempre, y por eso una red renovable se arma como sistema: mezcla de fuentes, parques repartidos en el territorio, demanda que se corre de horario y almacenamiento.',
          detalle_es:
            'La pregunta técnica no es "¿qué pasa si se nubla?", es "¿qué pasa si se nubla acá mientras sopla allá?".',
          fuente: 'iea-energia',
          anillo: 2,
          dificultad_base: 0.4,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: ['energia.curva_del_pato'],
          misconceptions: [
            {
              slug: 'energia.mito_sol_no_siempre_brilla',
              creencia_es:
                'Las renovables no funcionan porque el sol no siempre brilla y el viento no siempre sopla.',
              correccion_es:
                'La intuición arranca bien —de verdad no están siempre— pero se queda mirando un panel solo en vez de la red entera. No está nublado en toda la Argentina al mismo tiempo, en la Patagonia el viento sopla también de noche, parte de la demanda se puede correr de horario y las baterías guardan el excedente del mediodía. La intermitencia es un problema de ingeniería que se administra, no un veredicto sobre la tecnología.',
              fuente: 'iea-energia',
            },
          ],
        },
        {
          slug: 'energia.almacenamiento',
          titulo_es: 'Guardar electricidad',
          enunciado_es:
            'Las baterías de red guardan energía cuando sobra y la devuelven cuando falta: no generan nada, corren la energía en el tiempo.',
          detalle_es:
            'Por eso el almacenamiento no compite con la generación renovable: es lo que la vuelve utilizable a las nueve de la noche.',
          fuente: 'iea-energia',
          anillo: 2,
          dificultad_base: 0.5,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: ['energia.intermitencia', 'tronco.stock_vs_flujo'],
        },
        {
          slug: 'energia.generacion_distribuida',
          titulo_es: 'Generar desde tu techo',
          enunciado_es:
            'Un usuario con paneles puede inyectar a la red lo que le sobra y descontarlo de su factura: eso es generación distribuida con balance neto, habilitada en Argentina por la Ley 27.424.',
          detalle_es:
            'El medidor pasa a contar en los dos sentidos: lo que tomás y lo que entregás.',
          fuente: 'iea-energia',
          anillo: 2,
          dificultad_base: 0.4,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: ['energia.renovables_argentinas', 'energia.leer_la_factura'],
        },
      ],
      hojas: [
        {
          slug: 'energia.la-red-que-respira.1',
          titulo_es: 'La red no consume parejo',
          bajada_es: 'Picos, promedios y por qué se construyen centrales.',
          minutos: 5,
          age_groups: ['teen', 'adult'],
          sort_order: 1,
          conceptos: ['energia.demanda_pico', 'energia.curva_del_pato'],
        },
        {
          slug: 'energia.la-red-que-respira.2',
          titulo_es: 'El sol no siempre brilla',
          bajada_es: 'La objeción más común a las renovables, tomada en serio.',
          minutos: 6,
          age_groups: ['teen', 'adult'],
          sort_order: 2,
          conceptos: ['energia.intermitencia', 'energia.curva_del_pato'],
        },
        {
          slug: 'energia.la-red-que-respira.3',
          titulo_es: 'Guardar para después',
          bajada_es: 'Qué hace y qué no hace una batería de red.',
          minutos: 5,
          age_groups: ['teen', 'adult'],
          sort_order: 3,
          conceptos: ['energia.almacenamiento', 'energia.intermitencia'],
        },
        {
          slug: 'energia.la-red-que-respira.4',
          titulo_es: 'Tu techo también genera',
          bajada_es: 'Paneles, balance neto y un medidor que gira para los dos lados.',
          minutos: 6,
          age_groups: ['teen', 'adult'],
          sort_order: 4,
          conceptos: [
            'energia.generacion_distribuida',
            'energia.almacenamiento',
            'energia.demanda_pico',
          ],
        },
      ],
    },

    {
      slug: 'energia.el-gas-y-sus-debates',
      anillo: 2,
      titulo_es: 'El gas y sus debates',
      bajada_es: 'La fuente que sostiene la matriz argentina, con sus discusiones abiertas.',
      icono: 'Flame',
      age_groups: ['teen', 'adult'],
      sort_order: 6,
      conceptos: [
        {
          slug: 'energia.gas_en_la_matriz',
          titulo_es: 'Por qué acá todo pasa por el gas',
          enunciado_es:
            'El gas natural es la fuente principal de la energía argentina: mueve buena parte de la generación eléctrica y además calefacciona y calienta el agua de millones de hogares.',
          detalle_es:
            'Eso explica por qué en Argentina la discusión energética empieza casi siempre por el gas.',
          fuente: 'iea-energia',
          anillo: 2,
          dificultad_base: 0.1,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: ['energia.matriz_electrica_ar'],
        },
        {
          slug: 'energia.garrafa_y_red',
          titulo_es: 'Garrafa y red no salen lo mismo',
          enunciado_es:
            'La misma energía sale bastante más cara comprada en garrafa de GLP que traída por la red de gas natural, y no todos los barrios del conurbano tienen red.',
          detalle_es:
            'Es una desigualdad que no se ve en la tarifa: se ve en quién puede prender la estufa sin hacer cuentas.',
          fuente: 'iea-energia',
          anillo: 2,
          dificultad_base: 0.3,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: ['energia.gas_en_la_matriz'],
        },
        {
          slug: 'energia.pobreza_energetica',
          titulo_es: 'Pobreza energética',
          enunciado_es:
            'Hay pobreza energética cuando un hogar no puede acceder a la energía que necesita para estar sano y cómodo, o cuando pagarla le come una parte desproporcionada de sus ingresos.',
          detalle_es:
            'Una casa mal aislada convierte cualquier tarifa en un problema: por eso aislar techos también es política social.',
          fuente: 'iea-energia',
          anillo: 2,
          dificultad_base: 0.5,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: ['energia.garrafa_y_red', 'energia.envolvente'],
        },
        {
          slug: 'energia.vaca_muerta_debate',
          titulo_es: 'Vaca Muerta, en discusión',
          enunciado_es:
            'Vaca Muerta es un yacimiento de hidrocarburos no convencionales que se explota con fractura hidráulica, y se discuten a la vez su aporte a la energía y a la economía del país y sus impactos sobre el agua, el territorio y las emisiones.',
          detalle_es:
            'No hay veredicto simple. Es un caso para mirar qué evidencia trae cada lado antes de tomar posición.',
          fuente: 'epa',
          anillo: 2,
          dificultad_base: 0.6,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: ['energia.gas_en_la_matriz', 'tronco.evidencia_y_fuente'],
        },
      ],
      hojas: [
        {
          slug: 'energia.el-gas-y-sus-debates.1',
          titulo_es: 'La matriz que corre con gas',
          bajada_es: 'Dónde aparece el gas en tu día sin que lo notes.',
          minutos: 5,
          age_groups: ['teen', 'adult'],
          sort_order: 1,
          conceptos: ['energia.gas_en_la_matriz', 'energia.garrafa_y_red'],
        },
        {
          slug: 'energia.el-gas-y-sus-debates.2',
          titulo_es: 'Cuando la energía no alcanza',
          bajada_es: 'Garrafa, red y la desigualdad que se cuela en la boleta.',
          minutos: 6,
          age_groups: ['teen', 'adult'],
          sort_order: 2,
          conceptos: ['energia.pobreza_energetica', 'energia.garrafa_y_red'],
        },
        {
          slug: 'energia.el-gas-y-sus-debates.3',
          titulo_es: 'Un debate sin veredicto',
          bajada_es: 'Vaca Muerta con la evidencia de los dos lados sobre la mesa.',
          minutos: 6,
          age_groups: ['teen', 'adult'],
          sort_order: 3,
          conceptos: [
            'energia.vaca_muerta_debate',
            'energia.gas_en_la_matriz',
            'energia.pobreza_energetica',
          ],
        },
      ],
    },

    {
      slug: 'energia.contar-el-carbono',
      anillo: 2,
      titulo_es: 'Contar el carbono',
      bajada_es: 'Cómo se mide una huella de energía y qué hacés después con el número.',
      icono: 'Gauge',
      age_groups: ['teen', 'adult'],
      sort_order: 7,
      conceptos: [
        {
          slug: 'energia.co2_equivalente',
          titulo_es: 'CO₂ equivalente y el metano',
          enunciado_es:
            'Los gases de efecto invernadero se comparan en CO₂ equivalente según cuánto calientan: el metano calienta bastante más que el CO₂ en las primeras décadas, aunque dure menos tiempo en la atmósfera.',
          detalle_es:
            'Por eso una fuga de gas natural pesa mucho más de lo que sugiere su volumen.',
          fuente: 'ipcc-ar6',
          anillo: 2,
          dificultad_base: 0.3,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: ['tronco.no_todo_pesa_igual'],
        },
        {
          slug: 'energia.alcances_123',
          titulo_es: 'Alcances 1, 2 y 3',
          enunciado_es:
            'Una huella de carbono se ordena en tres alcances: lo que quemás vos (1), la electricidad que comprás (2) y todo lo demás de tu cadena, de proveedores a productos (3).',
          detalle_es:
            'El alcance 3 suele ser el más grande y el más fácil de dejar afuera de un informe: fijate siempre si está.',
          fuente: 'ipcc-ar6',
          anillo: 2,
          dificultad_base: 0.5,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: ['energia.factor_emision_red'],
        },
        {
          slug: 'energia.energia_incorporada',
          titulo_es: 'La energía que ya está adentro',
          enunciado_es:
            'Fabricar un aparato ya gastó energía y emitió antes de que lo enchufes, así que alargarle la vida al que tenés suele pesar más que afinar cómo lo usás.',
          detalle_es:
            'Es la razón por la que "quedate dos años más con el celular" compite con medidas mucho más vistosas.',
          fuente: 'carbon-brief',
          anillo: 2,
          dificultad_base: 0.5,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: ['energia.alcances_123', 'tronco.jerarquia_decisiones'],
        },
        {
          slug: 'energia.presupuesto_carbono',
          titulo_es: 'El presupuesto de carbono',
          enunciado_es:
            'El calentamiento depende del total acumulado de CO₂, así que existe un presupuesto: la cantidad que todavía se puede emitir si se quiere quedar cerca de 1,5 °C.',
          detalle_es:
            'Es un stock, no un flujo: por eso la fecha en que se baja importa tanto como el número final.',
          fuente: 'ipcc-ar6',
          anillo: 2,
          dificultad_base: 0.6,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: ['energia.co2_equivalente', 'tronco.stock_vs_flujo'],
        },
        {
          slug: 'energia.palanca_colectiva',
          titulo_es: 'Dónde está la palanca',
          enunciado_es:
            'Cambiar las lámparas de tu casa y empujar decisiones colectivas —normas de construcción, tarifas, obras de generación— no compiten: lo primero es la puerta de entrada a lo segundo, que es donde se mueven los kWh en serio.',
          detalle_es:
            'Un consorcio que aísla el techo del edificio mueve más que veinte personas desenchufando cargadores.',
          fuente: 'unesco-ods',
          anillo: 2,
          dificultad_base: 0.4,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: ['tronco.individual_y_colectivo', 'energia.orden_de_las_decisiones'],
        },
      ],
      hojas: [
        {
          slug: 'energia.contar-el-carbono.1',
          titulo_es: 'No todos los gases pesan igual',
          bajada_es: 'CO₂ equivalente, metano y por qué las fugas importan.',
          minutos: 5,
          age_groups: ['teen', 'adult'],
          sort_order: 1,
          conceptos: ['energia.co2_equivalente', 'energia.alcances_123'],
        },
        {
          slug: 'energia.contar-el-carbono.2',
          titulo_es: 'Los tres alcances',
          bajada_es: 'Leer un informe de huella y encontrar lo que falta.',
          minutos: 6,
          age_groups: ['teen', 'adult'],
          sort_order: 2,
          conceptos: ['energia.alcances_123', 'energia.energia_incorporada'],
        },
        {
          slug: 'energia.contar-el-carbono.3',
          titulo_es: 'Un presupuesto que se gasta una sola vez',
          bajada_es: 'Por qué el carbono se cuenta acumulado y no por año.',
          minutos: 6,
          age_groups: ['teen', 'adult'],
          sort_order: 3,
          conceptos: ['energia.presupuesto_carbono', 'energia.co2_equivalente'],
        },
        {
          slug: 'energia.contar-el-carbono.4',
          titulo_es: 'Dónde apoyás la palanca',
          bajada_es: 'De tu enchufe al consorcio, y del consorcio a la norma.',
          minutos: 6,
          age_groups: ['teen', 'adult'],
          sort_order: 4,
          conceptos: [
            'energia.palanca_colectiva',
            'energia.energia_incorporada',
            'energia.presupuesto_carbono',
          ],
        },
      ],
    },
  ],
};
