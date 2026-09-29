import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// AGUA 6 — Agua y futuro.
// La punta de la rama. Las napas bajo presión, el arsénico y los nitratos,
// los glaciares que retroceden, las sequías y las nuevas fuentes. Cierra la
// rama mirando hacia adelante: qué se puede hacer para que alcance.

export default unidad({
  slug: 'agua-6',
  rama: 'agua',
  orden: 6,
  nivel: 3,
  requiereTronco: 3,
  titulo: 'Agua y futuro',
  bajada: 'Napas que bajan, arsénico, glaciares que retroceden, sequías y nuevas fuentes: los desafíos del agua que vienen y cómo prepararse.',
  objetivos: [
    'Explicar cómo se recargan y se sobreexplotan los acuíferos',
    'Reconocer los riesgos del arsénico y los nitratos en el agua subterránea',
    'Describir el valor de los glaciares y qué protege la Ley 26.639',
    'Distinguir tipos de sequía y cómo el cambio climático cambia los extremos',
    'Comparar nuevas fuentes de agua según su costo, energía e impacto',
  ],
  repasa: ['agua-5', 'agua-1', 'tronco-1', 'tronco-2'],
  fuentes: ['acuifero-puelche', 'nitratos-puelche', 'oms-agua-potable', 'ley-26639-glaciares', 'inventario-glaciares', 'ipcc-ar6', 'un-water', 'unep'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Las napas bajo presión', 'Recarga, extracción y el agua que tarda siglos en volver: cómo se agota un acuífero sin que nadie lo vea.', [
      teoria('Una cuenta bajo tierra', [
        'Un acuífero se recarga con la lluvia que se infiltra y con el agua de ríos y lagunas que se filtra hacia abajo. Se descarga por manantiales, por los ríos que alimenta y por los pozos que lo bombean.',
        'Si durante años se bombea más de lo que se recarga, el nivel de la napa baja. Como no se ve, el problema suele notarse tarde: cuando los pozos se secan, hay que perforar más hondo o el agua empieza a salir de peor calidad.',
      ]),
      op('¿Qué recarga un acuífero?', [ // e1
        'La lluvia que se infiltra en el suelo',
        'El agua que se bombea desde los pozos',
        ['El vapor de agua del aire que baja por las noches', 'La humedad del aire no recarga acuíferos de forma relevante: la recarga es por infiltración.'],
        'La sal que trae el mar hacia la costa',
      ], 'La infiltración es la entrada principal. Por eso impermeabilizar el suelo, además de inundar, recarga menos las napas.', { d: 1 }),
      teoria('El cono alrededor del pozo', [
        'Cuando un pozo bombea mucho, alrededor de él la napa baja formando una especie de embudo: el cono de depresión. Si hay muchos pozos juntos, los conos se suman y la napa baja en toda la zona.',
        'Cerca de la costa, bajar la napa dulce puede dejar entrar agua salada del mar por debajo: la intrusión salina. Una vez que el acuífero se saliniza, recuperarlo lleva muchísimo tiempo.',
      ]),
      cad('Armá la cadena de la intrusión salina en una ciudad costera.', [ // e2
        'La ciudad bombea cada vez más agua de la napa',
        'El nivel del agua dulce baja',
        'El agua salada del mar avanza por debajo',
        'Los pozos cercanos a la costa empiezan a dar agua salobre',
      ], ['La lluvia sala el acuífero'], 'La presión del agua dulce frena al mar. Si esa presión baja, el mar avanza.', { d: 2 }),
      teoria('Agua vieja', [
        'No todas las aguas se renuevan al mismo ritmo. El agua de un río se renueva en días o semanas; la de un lago, en años; la de un acuífero poco profundo, en años o décadas; y la de un acuífero profundo puede tener siglos o miles de años.',
        'Sacar agua de un acuífero muy profundo es, en la práctica, usar un recurso que no se repone en escala humana: se parece más al petróleo que a la lluvia.',
      ]),
      rank('Ordená estos depósitos por cuánto tarda en renovarse su agua, de más rápido a más lento.', [ // e3
        ['Un río', 'días a semanas'],
        ['Un lago grande', 'años'],
        ['Un acuífero poco profundo', 'años a décadas'],
        ['Un acuífero profundo', 'siglos o milenios'],
      ], 'Cuanto más lento se renueva, más cuidado hay que tener: lo que se saca de más no vuelve pronto.', { d: 2, extremos: ['Más rápido', 'Más lento'] }),
      numv(3, (i) => { // e4
        const rec = [40, 25, 60][i];
        const ext = [55, 35, 90][i];
        return {
          enunciado: `Un acuífero recibe ${rec} millones de m³ por año de recarga y se le extraen ${ext}. ¿Cuántos millones de m³ pierde por año?`,
          valor: ext - rec,
          unidad: 'millones de m³ por año',
          explicacion: `Entra ${rec}, sale ${ext}: pierde ${ext} − ${rec} = ${ext - rec} millones de m³ por año. Es la cuenta de uso contra reposición del tronco, bajo tierra.`,
        };
      }, { d: 2 }),
      vf('Como el agua subterránea no se ve, bombearla no afecta a ríos ni humedales.', false, 'Muchos ríos y humedales se alimentan de la napa. Si la napa baja, esos ríos pueden perder caudal y los humedales secarse, aunque nadie les haya sacado agua directamente.', { // e5
        razones: ['+Porque muchos ríos y humedales se alimentan de la napa', '-Porque el agua subterránea no está conectada con nada', '-Porque bombear una napa agrega agua a los ríos'],
        d: 3,
      }),
      clas('¿Esta acción aumenta la recarga del acuífero o aumenta su extracción?', { // e6
        'Aumenta la recarga': ['Conservar humedales y suelo permeable', 'Jardines de lluvia y veredas absorbentes', 'Recarga artificial con agua de lluvia filtrada'],
        'Aumenta la extracción': ['Perforar más pozos para riego', 'Una ciudad que crece sin red de agua superficial', 'Industrias que bombean sin medir'],
      }, 'La gestión de un acuífero trabaja las dos columnas: sumar recarga y controlar la extracción.', { d: 2 }),
      par('Uní cada problema de un acuífero con su causa.', [ // e7
        ['Pozos que se secan', 'Extracción mayor que la recarga'],
        ['Agua salobre cerca de la costa', 'Intrusión salina por bombeo excesivo'],
        ['Humedal que se seca sin obras cercanas', 'Descenso de la napa que lo alimentaba'],
        ['Nitratos en el agua de los pozos', 'Fertilizantes y pozos ciegos que se infiltran'],
      ], 'Cada síntoma señala una causa. El último es de calidad, no de cantidad: lo verás en la próxima sesión.', { d: 3 }),
      mult('¿Qué hace falta para gestionar bien un acuífero? Marcá todo lo necesario.', [ // e8
        '+Medir el nivel de la napa en pozos de control',
        '+Registrar cuántos pozos hay y cuánto extraen',
        '+Proteger las zonas donde se recarga',
        '-Perforar más hondo cada vez que un pozo se seca',
        '-Suponer que la lluvia siempre alcanza',
      ], 'Sin medir no se puede gestionar. Perforar más hondo es solo patear el problema hacia adelante.', { d: 2 }),
      comp('Completá.', 'Si durante años se bombea más de lo que se [recarga], la napa [baja]; cerca de la costa, puede entrar agua [salada].', ['evapora', 'sube', 'dulce'], 'Recarga contra extracción, y el mar esperando del otro lado.', { d: 2 }),
      det('Leé este comentario de un productor y marcá los errores.', [ // e10
        ['Mi pozo baja un metro por año desde hace diez años.', false],
        ['No hay problema: el acuífero es infinito porque llueve todos los años.', true, 'La lluvia recarga, pero si se saca más de lo que entra, el nivel baja.'],
        ['Voy a instalar un medidor para saber cuánto saco.', false],
        ['Si se seca, perforo más hondo y listo, el agua de abajo es igual.', true, 'El agua profunda suele renovarse mucho más lento y puede tener otra calidad.'],
      ], 'Una napa que baja todos los años es una señal de sobreexplotación, no de mala suerte.', { d: 3 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Arsénico y nitratos', 'Dos contaminantes del agua subterránea, uno natural y otro humano, y cómo se enfrentan.', [
      teoria('Arsénico: un problema natural', [
        'En gran parte de la llanura chaco-pampeana, el agua subterránea tiene arsénico de origen natural, que viene de las cenizas volcánicas y los sedimentos del suelo. No se ve, no tiene olor ni gusto.',
        'Tomar durante muchos años agua con arsénico por encima de los límites puede causar una enfermedad llamada HACRE (hidroarsenicismo crónico regional endémico), con lesiones en la piel y mayor riesgo de algunos cánceres. La Organización Mundial de la Salud recomienda un valor guía de 10 microgramos por litro.',
      ], { destacado: { valor: '10 µg/L', texto: 'es el valor guía de arsénico en agua de bebida que recomienda la OMS.' } }),
      op('¿De dónde viene el arsénico del agua subterránea de la llanura chaco-pampeana?', [ // e1
        'De cenizas volcánicas y sedimentos naturales del suelo',
        'De los fertilizantes que se usan en los campos',
        ['De los caños de plomo de las casas viejas', 'Los caños viejos pueden aportar plomo, pero el arsénico de la región es de origen natural.'],
        'De la sal que traen los ríos desde el mar',
      ], 'Es un problema natural, no una contaminación humana. Por eso la solución no es "dejar de contaminar" sino tratar el agua.', { d: 1 }),
      teoria('Cómo se enfrenta', [
        'El arsénico no se va hirviendo el agua: al contrario, hervirla concentra lo que queda. Se saca con tratamientos específicos, como la ósmosis inversa o procesos de coagulación y filtración con materiales que lo retienen.',
        'Muchas localidades tienen plantas de abatimiento de arsénico. Donde no hay red, se usan equipos domiciliarios o comunitarios, y se recomienda usar agua tratada al menos para tomar y cocinar.',
      ]),
      vf('Hervir el agua elimina el arsénico.', false, 'Hervir elimina microbios, pero no el arsénico. Al evaporarse parte del agua, el arsénico que queda incluso se concentra. Hacen falta tratamientos específicos.', { // e2
        razones: ['+Porque el arsénico no se evapora y queda más concentrado', '-Porque el arsénico se evapora a 100 °C', '-Porque el arsénico solo está en el hielo'],
        d: 2,
      }),
      numv(3, (i) => { // e3
        const v = [50, 30, 120][i];
        return {
          enunciado: `Un pozo tiene ${v} µg/L de arsénico. ¿Cuántas veces supera el valor guía de la OMS (10 µg/L)?`,
          valor: v / 10,
          unidad: 'veces',
          dec: 1,
          explicacion: `${v} ÷ 10 = ${(v / 10).toLocaleString('es-AR')} veces el valor guía. Esa agua necesita tratamiento para tomar y cocinar.`,
        };
      }, { d: 2 }),
      teoria('Nitratos: un problema humano', [
        'Los nitratos llegan a las napas desde los fertilizantes nitrogenados de los campos, los pozos ciegos y los corrales. En zonas del conurbano bonaerense y en áreas agrícolas intensivas, el acuífero Puelche y otros tienen sectores con nitratos altos.',
        'La OMS recomienda que el agua de bebida no supere 50 miligramos de nitrato por litro. Los más sensibles son los bebés: el exceso puede afectar el transporte de oxígeno en la sangre. Por eso el agua para preparar mamaderas tiene que ser segura.',
      ], { destacado: { valor: '50 mg/L', texto: 'de nitrato es el valor guía de la OMS para el agua de bebida.' } }),
      clas('¿El origen de este contaminante es natural o humano?', { // e4
        'Origen natural': ['Arsénico en la llanura chaco-pampeana', 'Flúor en exceso en algunas napas'],
        'Origen humano': ['Nitratos de fertilizantes', 'Nitratos de pozos ciegos', 'Restos de agroquímicos en la napa'],
      }, 'La diferencia importa: lo humano se puede prevenir en el origen; lo natural hay que tratarlo.', { d: 2 }),
      cad('Armá el camino de los nitratos hasta la mamadera de un bebé.', [ // e5
        'Se aplica más fertilizante del que el cultivo usa',
        'El sobrante se disuelve con la lluvia',
        'Se infiltra hasta la napa',
        'Un pozo familiar bombea esa agua',
        'Se usa para preparar la mamadera',
      ], ['El fertilizante se evapora y llueve en otra provincia'], 'Por eso ajustar la dosis de fertilizante protege el agua de muchas familias que ni siquiera viven cerca del campo.', { d: 3 }),
      par('Uní cada contaminante con quién es más sensible y qué conviene hacer.', [ // e6
        ['Nitratos altos', 'Bebés: usar agua segura para las mamaderas'],
        ['Arsénico alto', 'Toda la familia: agua tratada para tomar y cocinar'],
        ['Microbios', 'Toda la familia: desinfectar o hervir'],
      ], 'Cada contaminante tiene su grupo más vulnerable y su tratamiento. Hervir sirve solo para uno de los tres.', { d: 3 }),
      mult('¿Qué medidas reducen los nitratos que llegan a las napas? Marcá todas.', [ // e7
        '+Aplicar la dosis de fertilizante que el cultivo necesita',
        '+Conectar las casas a la red cloacal',
        '+Alejar los corrales y pozos ciegos de los pozos de agua',
        '-Hervir el agua de los pozos',
        '-Perforar el pozo más cerca del pozo ciego',
      ], 'Prevenir en el origen: dosis justa, cloacas y distancias. Hervir no saca nitratos.', { d: 2 }),
      op('En una casa rural el análisis del pozo da 80 mg/L de nitrato y nace un bebé. ¿Qué es lo más importante?', [ // e8
        'Usar agua segura, de red o tratada, para las mamaderas',
        'Hervir más tiempo el agua del pozo',
        ['Esperar a que el bebé crezca para cambiar el agua', 'Los bebés son justamente los más sensibles: el cambio tiene que ser ya.'],
        'Agregarle cloro al agua del pozo',
      ], 'El cloro y el hervor no sacan nitratos. Para el bebé, agua segura desde el primer día.', { d: 3 }),
      numv(3, (i) => { // e9
        const n = [80, 65, 120][i];
        return {
          enunciado: `Un pozo tiene ${n} mg/L de nitrato. ¿En qué porcentaje supera el valor guía de la OMS (50 mg/L)?`,
          valor: ((n - 50) / 50) * 100,
          unidad: '%',
          explicacion: `Excede ${n} − 50 = ${n - 50} mg/L sobre 50: ${n - 50} ÷ 50 × 100 = ${((n - 50) / 50) * 100} %. Porcentaje de exceso respecto del límite.`,
        };
      }, { d: 3 }),
      det('Leé estos consejos de un folleto y marcá los equivocados.', [ // e10
        ['El arsénico del agua de la región es de origen natural.', false],
        ['Si el agua es transparente y rica, seguro no tiene arsénico.', true, 'El arsénico no tiene color, olor ni gusto: solo se detecta con un análisis.'],
        ['Para las mamaderas, usá agua segura.', false],
        ['Hervir el agua del pozo elimina el arsénico y los nitratos.', true, 'Hervir no elimina ninguno de los dos, y concentra el arsénico.'],
      ], 'Lo invisible solo se ve con un análisis, y hervir no es una solución universal.', { d: 3 }),
      comp('Completá.', 'El [arsénico] de la llanura es natural; los [nitratos] vienen de fertilizantes y pozos ciegos; y [hervir] no elimina ninguno de los dos.', ['cloro', 'oxígeno', 'filtrar con tela'], 'Dos contaminantes distintos, un error común compartido.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Glaciares: reservas en retroceso', 'El agua congelada de la cordillera, por qué retrocede y qué protege la ley de glaciares.', [
      teoria('Qué es un glaciar', [
        'Un glaciar es una masa de hielo que se forma cuando la nieve se acumula año tras año, se compacta y fluye lentamente cuesta abajo. Además de los glaciares visibles, en la alta montaña hay ambiente periglacial: suelos congelados y glaciares de escombros, cubiertos de piedras, que también guardan hielo.',
        'El Inventario Nacional de Glaciares de Argentina identificó más de 16.000 cuerpos de hielo a lo largo de la cordillera. En las provincias andinas secas, en los veranos y en los años de poca nieve, el deshielo de glaciares y del ambiente periglacial aporta una parte importante del agua de los ríos.',
      ], { destacado: { valor: '+16.000', texto: 'cuerpos de hielo identificó el Inventario Nacional de Glaciares en la cordillera argentina.' } }),
      op('¿Cuándo es más importante el aporte de los glaciares a los ríos de cordillera?', [ // e1
        'En veranos secos y en años de poca nieve',
        'En los inviernos con mucha nieve',
        ['Cuando llueve mucho en la llanura', 'La lluvia en la llanura no depende de los glaciares: el aporte glaciar pesa cuando falta nieve en la montaña.'],
        'Nunca, porque el hielo no se derrite',
      ], 'Los glaciares funcionan como una reserva que se libera cuando más falta: en los veranos y en las sequías.', { d: 1 }),
      clas('¿Es parte del ambiente glaciar o periglacial, o no?', { // e2
        'Glaciar o periglacial': ['Un glaciar de escombros cubierto de piedras', 'Suelo congelado permanentemente en alta montaña', 'Un glaciar descubierto en un valle'],
        'No lo es': ['La nieve de una sola temporada que se derrite en primavera', 'Un lago de montaña sin hielo', 'La helada de una mañana de invierno'],
      }, 'Lo que define al ambiente glaciar y periglacial es el hielo que dura años. La nieve estacional es otra cosa, aunque también aporta agua.', { d: 2 }),
      teoria('Por qué retroceden', [
        'Con el calentamiento global, la gran mayoría de los glaciares del mundo pierde masa: se derrite más hielo del que se acumula como nieve. En los Andes, muchos glaciares retrocedieron de forma notable en las últimas décadas.',
        'Al principio, un glaciar que se derrite más rápido puede dar más agua a los ríos; pero cuando se achica lo suficiente, ese aporte empieza a bajar. Es una reserva que se está gastando.',
      ]),
      cad('Armá la cadena de lo que pasa con un río cuando su glaciar se achica.', [ // e3
        'El clima se calienta en la cordillera',
        'El glaciar se derrite más de lo que acumula',
        'Por un tiempo, el río recibe más agua de deshielo',
        'El glaciar se achica',
        'El aporte al río en los veranos secos baja',
      ], ['El glaciar crece con el calor'], 'Es un efecto con retraso: primero parece que hay más agua, y después falta. Los retrasos del tronco otra vez.', { d: 3 }),
      vf('Si un glaciar se derrite más rápido, los ríos van a tener más agua para siempre.', false, 'Hay más agua mientras el glaciar se está gastando, pero cuando se achica lo suficiente, el aporte baja. Es como gastar ahorros: un tiempo se tiene más, después menos.', { // e4
        razones: ['+Porque es una reserva que se agota: después el aporte baja', '-Porque los glaciares se regeneran solos en un verano', '-Porque el deshielo no llega a los ríos'],
        d: 3,
      }),
      teoria('La Ley de Glaciares', [
        'En 2010 se sancionó la Ley 26.639, de presupuestos mínimos para la preservación de los glaciares y del ambiente periglacial. Los declara bienes de carácter público, reservas estratégicas de agua, y prohíbe en ellos actividades que puedan afectarlos, como la minería y la exploración petrolera, la construcción de obras que no sean científicas o de rescate y la liberación de contaminantes.',
        'La ley creó también el Inventario Nacional de Glaciares, que realiza el IANIGLA (un instituto del CONICET), para saber dónde están y cómo cambian.',
      ]),
      mult('¿Qué establece la Ley 26.639? Marcá lo que corresponde.', [ // e5
        '+Protege glaciares y ambiente periglacial como reservas de agua',
        '+Prohíbe en ellos actividades como la minería',
        '+Crea el Inventario Nacional de Glaciares',
        '-Permite construir cualquier obra sobre los glaciares',
        '-Protege solo los glaciares que se ven desde las rutas',
      ], 'La ley protege también el hielo que no se ve, como los glaciares de escombros, porque también es reserva de agua.', { d: 2 }),
      par('Uní cada concepto con su descripción.', [ // e6
        ['Glaciar de escombros', 'Hielo cubierto por piedras y detritos'],
        ['Ambiente periglacial', 'Suelos de alta montaña con hielo'],
        ['Inventario Nacional de Glaciares', 'El registro de dónde están y cómo cambian'],
        ['Reserva estratégica de agua', 'Cómo los define la ley'],
      ], 'Cuatro conceptos que aparecen en cualquier debate sobre glaciares en Argentina.', { d: 2 }),
      numv(3, (i) => { // e7
        const a = [120, 80, 200][i];
        const b = [84, 60, 150][i];
        return {
          enunciado: `Un glaciar tenía ${a} hectáreas y hoy tiene ${b}. ¿Qué porcentaje de su superficie perdió?`,
          valor: ((a - b) / a) * 100,
          unidad: '%',
          explicacion: `Perdió ${a} − ${b} = ${a - b} ha de ${a}: ${a - b} ÷ ${a} × 100 = ${(((a - b) / a) * 100).toLocaleString('es-AR')} %. Se divide por el tamaño original.`,
        };
      }, { d: 2 }),
      op('¿Por qué la ley protege también los glaciares de escombros, que parecen solo piedras?', [ // e8
        'Porque bajo las piedras guardan hielo que aporta agua',
        'Porque las piedras son valiosas para la construcción',
        ['Porque la ley protege todas las piedras de la cordillera', 'No protege cualquier piedra: protege el hielo, aunque esté cubierto.'],
        'Porque son lugares turísticos muy visitados',
      ], 'En zonas muy secas, el hielo cubierto puede ser una reserva de agua tan importante como los glaciares descubiertos.', { d: 3 }),
      det('Leé este titular y marcá lo equivocado.', [ // e9
        ['Argentina tiene miles de glaciares a lo largo de la cordillera.', false],
        ['Como el hielo se derrite, es buena noticia: habrá más agua para siempre.', true, 'Más deshielo ahora significa menos reserva para después.'],
        ['La Ley 26.639 prohíbe actividades como la minería sobre los glaciares.', false],
        ['El ambiente periglacial no tiene hielo, así que no importa.', true, 'El ambiente periglacial tiene suelos congelados y glaciares de escombros con hielo.'],
      ], 'El deshielo acelerado es una reserva que se gasta, y el hielo escondido también cuenta.', { d: 3 }),
      comp('Completá.', 'La Ley [26.639] protege los glaciares y el ambiente [periglacial] como reservas estratégicas de [agua].', ['25.675', 'marino', 'minerales'], 'Número, alcance y propósito de la ley, en una línea.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Sequías y extremos', 'Cuando falta la lluvia: tipos de sequía, la bajante del Paraná, la sequía de 2022-2023 y cómo prepararse.', [
      teoria('No hay una sola sequía', [
        'Se habla de sequía meteorológica cuando llueve bastante menos que lo normal durante un período. Si esa falta de lluvia seca el suelo y afecta a los cultivos, es sequía agrícola. Si baja el caudal de los ríos, los embalses y las napas, es sequía hidrológica. Y cuando afecta la economía y la vida de la gente, se habla de sequía socioeconómica.',
        'Cada una llega con un retraso distinto: la lluvia falta primero, el suelo se seca después, y los ríos y las napas bajan más tarde.',
      ]),
      ord('Ordená cómo suele avanzar una sequía.', [ // e1
        'Llueve menos de lo normal durante meses',
        'El suelo se seca y los cultivos sufren',
        'Bajan los ríos, los embalses y las napas',
        'Se afectan la economía y el abastecimiento',
      ], 'Meteorológica, agrícola, hidrológica y socioeconómica: una cadena con retrasos.', { d: 2, extremos: ['Primero', 'Último'] }),
      par('Uní cada tipo de sequía con su señal.', [ // e2
        ['Meteorológica', 'Llueve mucho menos que el promedio'],
        ['Agrícola', 'El suelo no tiene humedad para los cultivos'],
        ['Hidrológica', 'Los ríos y embalses bajan de nivel'],
        ['Socioeconómica', 'Faltan agua o cosechas y se afecta el trabajo'],
      ], 'Distinguirlas ayuda a saber qué medir y qué hacer en cada etapa.', { d: 2 }),
      teoria('La bajante del Paraná', [
        'Entre 2019 y 2022 el río Paraná tuvo una bajante extraordinaria, con niveles que en 2021 fueron los más bajos en unos 77 años en Rosario. Se debió sobre todo a la falta de lluvias en su cuenca alta, en Brasil y Paraguay.',
        'La bajante afectó la navegación de barcos, las tomas de agua de ciudades que tuvieron que adaptarlas, la pesca y los humedales del Delta, que se secaron y se volvieron más vulnerables a los incendios.',
      ]),
      mult('¿Qué efectos tuvo la bajante del Paraná? Marcá todos.', [ // e3
        '+Dificultades para la navegación de barcos',
        '+Problemas en las tomas de agua de algunas ciudades',
        '+Humedales del Delta más secos y vulnerables al fuego',
        '-Más agua para el riego en la cuenca',
        '-Inundaciones en Rosario',
      ], 'Una sola causa —falta de lluvia río arriba— con efectos en transporte, abastecimiento, pesca y ecosistemas.', { d: 2 }),
      teoria('La sequía de 2022-2023', [
        'Entre 2022 y 2023, la región pampeana atravesó una de las sequías más graves de las últimas décadas, asociada a varios años seguidos del fenómeno La Niña, que suele traer menos lluvias a la región. Las cosechas de soja, maíz y trigo cayeron fuertemente y el impacto económico fue enorme.',
        'Los científicos advierten que, con el cambio climático, en muchas regiones se esperan extremos más intensos: sequías más fuertes y también lluvias más torrenciales. Prepararse para los dos es parte de la gestión del agua.',
      ]),
      cad('Armá la cadena de cómo una sequía en el campo llega a la economía de una ciudad.', [ // e4
        'Llueve mucho menos durante meses',
        'Los cultivos rinden mucho menos',
        'Caen la cosecha y las exportaciones',
        'Baja la actividad de los pueblos y ciudades que dependen del campo',
      ], ['Sube el caudal de los ríos'], 'El agua que falta en el suelo termina faltando en la economía. Es la sequía socioeconómica.', { d: 3 }),
      vf('El cambio climático solo trae sequías, nunca lluvias más intensas.', false, 'En muchas regiones se esperan extremos en los dos sentidos: sequías más fuertes y lluvias más intensas, porque un aire más caliente carga más vapor de agua.', { // e5
        razones: ['+Porque se esperan extremos en los dos sentidos', '-Porque el cambio climático no afecta las lluvias', '-Porque solo cambia la temperatura del mar'],
        d: 2,
      }),
      teoria('Prepararse', [
        'La gestión de sequías funciona mejor antes que durante: medir y pronosticar, tener reservas y planes de contingencia, reducir pérdidas en las redes para que cada litro rinda, diversificar las fuentes de agua y acordar reglas de reparto en años normales.',
        'En el campo, prácticas como la siembra directa con cobertura, la rotación de cultivos y el cuidado de la materia orgánica del suelo ayudan a que el suelo retenga más agua.',
      ], { lista: ['Pronóstico y alertas tempranas', 'Reservas y planes de contingencia', 'Menos pérdidas en redes', 'Fuentes diversas', 'Suelos que retienen agua'] }),
      clas('¿Esta medida se toma antes de la sequía o durante la sequía?', { // e6
        'Antes (preparación)': ['Reparar pérdidas de la red de agua', 'Acordar reglas de reparto entre usuarios', 'Cuidar la materia orgánica del suelo'],
        'Durante (respuesta)': ['Restringir el riego de jardines', 'Distribuir agua en camiones a zonas sin servicio', 'Campañas para reducir el consumo'],
      }, 'Las medidas de preparación son más baratas y efectivas. Las de respuesta hacen falta, pero llegan cuando el problema ya está.', { d: 2 }),
      numv(3, (i) => { // e7
        const res = [900, 600, 1500][i];
        const cons = [30, 25, 50][i];
        return {
          enunciado: `Una ciudad tiene ${res.toLocaleString('es-AR')} millones de litros en su embalse y consume ${cons} millones por día, sin lluvia. ¿Para cuántos días le alcanza?`,
          valor: res / cons,
          unidad: 'días',
          explicacion: `${res.toLocaleString('es-AR')} ÷ ${cons} = ${res / cons} días de reserva, sin contar la evaporación ni las pérdidas. Por eso se miden los días de reserva en las sequías.`,
        };
      }, { d: 2 }),
      numv(3, (i) => { // e8
        const res = [900, 600, 1500][i];
        const cons = [30, 25, 50][i];
        const baja = [20, 20, 30][i];
        const nuevo = cons * (1 - baja / 100);
        return {
          enunciado: `Si esa ciudad (reserva de ${res.toLocaleString('es-AR')} millones de litros, consumo de ${cons} millones por día) baja su consumo un ${baja} %, ¿cuántos días le alcanza ahora? Redondeá a un decimal.`,
          valor: Math.round((res / nuevo) * 10) / 10,
          unidad: 'días',
          dec: 1,
          tol: 0.2,
          explicacion: `Nuevo consumo: ${cons} × ${(1 - baja / 100).toLocaleString('es-AR')} = ${nuevo.toLocaleString('es-AR')} millones por día. ${res.toLocaleString('es-AR')} ÷ ${nuevo.toLocaleString('es-AR')} ≈ ${(Math.round((res / nuevo) * 10) / 10).toLocaleString('es-AR')} días: ahorrar compra tiempo.`,
        };
      }, { d: 3 }),
      det('Leé este comentario de un funcionario y marcá lo cuestionable.', [ // e9
        ['La sequía de este año es muy fuerte.', false],
        ['Como las sequías son naturales, no hay nada que prepararse.', true, 'Que sean naturales no quita que se puedan anticipar y mitigar.'],
        ['Vamos a arreglar las pérdidas de la red para que rinda cada litro.', false],
        ['Las pérdidas las arreglamos cuando vuelva a llover, que ahora no urge.', true, 'Justamente en la sequía cada litro perdido cuenta más.'],
      ], 'Preparar antes y actuar durante: esperar a que llueva es la peor estrategia.', { d: 3 }),
      comp('Completá.', 'En una sequía, primero falta la [lluvia], después se seca el [suelo] y más tarde bajan los [ríos] y las napas.', ['sol', 'aire', 'nubes'], 'La secuencia con retrasos que explica por qué una sequía se nota en etapas.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Nuevas fuentes y viejas soluciones', 'Reutilizar, desalinizar, juntar lluvia y dejar de perder: qué opciones hay para que el agua alcance, y cuánto cuestan.', [
      teoria('Primero, no perder', [
        'Antes de buscar agua nueva, conviene no perder la que ya se tiene. En muchas ciudades del mundo, una parte importante del agua potable se pierde en roturas y conexiones de la red antes de llegar a las casas. Reducir esas pérdidas es, muchas veces, la "fuente nueva" más barata.',
        'Lo mismo pasa en el riego: pasar de riego por inundación a goteo puede liberar enormes volúmenes de agua sin quitarle a nadie.',
      ]),
      op('Una ciudad pierde el 30 % del agua potable en la red. ¿Cuál es la primera medida que conviene evaluar?', [ // e1
        'Reparar la red para reducir esas pérdidas',
        'Construir una planta desalinizadora nueva',
        ['Buscar un río nuevo a 200 kilómetros', 'Puede hacer falta a futuro, pero perder un tercio del agua tratada es lo primero que hay que resolver.'],
        'Pedirle a la gente que tome menos agua',
      ], 'Cada litro que se pierde ya fue tratado y bombeado. Recuperarlo suele ser más barato que producir uno nuevo.', { d: 2 }),
      teoria('Reutilizar el agua tratada', [
        'El agua cloacal, después de un buen tratamiento, se puede reutilizar para riego de parques, cultivos, usos industriales o limpieza de calles. En algunos países con mucha escasez, incluso se trata hasta niveles potables.',
        'En casa, el agua gris de la ducha o el lavarropas, con cuidados, se puede usar para el inodoro o para regar. Reutilizar reduce tanto la extracción como lo que se vuelca a los ríos.',
      ]),
      teoria('Desalinizar', [
        'La desalinización saca la sal del agua de mar o de napas salobres, sobre todo con ósmosis inversa: el agua se empuja a presión a través de membranas que retienen la sal. Es una fuente casi ilimitada en zonas costeras, y varios países áridos dependen de ella.',
        'Tiene costos: necesita mucha energía (y si esa energía viene de combustibles fósiles, suma emisiones), y deja como residuo una salmuera muy concentrada que hay que devolver al mar con cuidado para no dañar la vida marina.',
      ]),
      clas('¿Es una ventaja o una desventaja de la desalinización?', { // e2
        'Ventaja': ['Fuente casi ilimitada en zonas costeras', 'No depende de las lluvias'],
        'Desventaja': ['Necesita mucha energía', 'Deja una salmuera muy concentrada', 'Es más cara que otras fuentes'],
      }, 'La desalinización es una herramienta valiosa en ciertos lugares, no una solución mágica para todos.', { d: 2 }),
      rank('Ordená estas fuentes de agua por cuánta energía suelen necesitar por litro, de más a menos.', [ // e3
        ['Desalinizar agua de mar', 'mucha energía'],
        ['Tratar agua cloacal para reutilizarla', 'energía media'],
        ['Potabilizar agua de un río cercano', 'poca energía'],
        ['Reducir las pérdidas de la red', 'casi ninguna por litro recuperado'],
      ], 'El orden típico, aunque cada caso cambia. El litro más barato en energía es el que no se pierde.', { d: 3 }),
      cad('Armá la cadena de cómo la desalinización puede sumar emisiones.', [ // e4
        'La planta necesita mucha energía para empujar el agua por las membranas',
        'La energía se genera quemando gas',
        'Quemar gas emite CO₂',
        'Cada litro desalinizado tiene una huella de carbono',
      ], ['Las membranas liberan CO₂ del agua de mar'], 'Agua y energía están conectadas: por eso algunas desalinizadoras nuevas se alimentan con energía solar o eólica.', { d: 3 }),
      teoria('Soluciones antiguas y naturales', [
        'Algunas de las mejores respuestas son antiguas: juntar agua de lluvia en tanques y aljibes, recargar acuíferos dejando que la lluvia se infiltre en zonas preparadas, y proteger los humedales y bosques de las nacientes, que regulan el agua gratis.',
        'Estas soluciones, combinadas con eficiencia y con tecnología donde hace falta, forman una cartera de opciones. Ninguna sola alcanza; juntas, muchas veces sí.',
      ]),
      par('Uní cada solución con su tipo.', [ // e5
        ['Reparar pérdidas de la red', 'Eficiencia'],
        ['Planta desalinizadora', 'Fuente nueva tecnológica'],
        ['Proteger el humedal de la naciente', 'Solución basada en la naturaleza'],
        ['Tanque para juntar lluvia', 'Fuente descentralizada'],
      ], 'Una buena estrategia combina tipos distintos, para no depender de una sola fuente.', { d: 2 }),
      mult('¿Qué conviene incluir en la estrategia de agua de una ciudad costera que sufre sequías? Marcá todo lo razonable.', [ // e6
        '+Reducir las pérdidas de la red',
        '+Reutilizar agua tratada para riego de parques',
        '+Evaluar una desalinizadora alimentada con renovables',
        '+Proteger las zonas de recarga del acuífero',
        '-Dejar que cada casa perfore su propio pozo sin control',
      ], 'Una cartera: eficiencia, reutilización, nueva fuente si hace falta y protección natural. Perforar sin control agrava la intrusión salina.', { d: 3 }),
      numv(3, (i) => { // e7
        const prod = [100, 80, 150][i];
        const perd = [30, 25, 40][i];
        const meta = [15, 10, 20][i];
        return {
          enunciado: `Una ciudad produce ${prod} millones de litros por día y pierde el ${perd} % en la red. Si baja las pérdidas al ${meta} %, ¿cuántos millones de litros por día más llegan a las casas?`,
          valor: (prod * (perd - meta)) / 100,
          unidad: 'millones de litros por día',
          explicacion: `Antes llegaba el ${100 - perd} %: ${(prod * (100 - perd)) / 100}. Después, el ${100 - meta} %: ${(prod * (100 - meta)) / 100}. Diferencia: ${(prod * (perd - meta)) / 100} millones de litros por día, sin producir un litro más.`,
        };
      }, { d: 3 }),
      vf('La desalinización resuelve la escasez de agua en cualquier lugar del país.', false, 'Sirve en zonas costeras (o con napas salobres), necesita mucha energía y deja salmuera. En el interior lejos del mar, llevar agua desalinizada sería carísimo. Es una opción más, no la solución universal.', { // e8
        razones: ['+Porque depende de la costa, la energía y el manejo de la salmuera', '-Porque el agua de mar ya es potable', '-Porque desalinizar no usa energía'],
        d: 3,
      }),
      det('Leé este plan de agua de un municipio y marcá lo cuestionable.', [ // e9
        ['Vamos a reducir las pérdidas de la red del 35 % al 20 %.', false],
        ['Y a construir una desalinizadora, aunque estamos a 600 km del mar.', true, 'Lejos del mar, desalinizar y transportar sería carísimo.'],
        ['Reutilizaremos el agua tratada para regar las plazas.', false],
        ['La salmuera de la desalinizadora no tiene ningún impacto.', true, 'La salmuera concentrada puede dañar la vida marina si se vuelca sin cuidado.'],
      ], 'Cada fuente tiene su lugar y su costo. Un buen plan lo reconoce.', { d: 4 }),
      comp('Completá.', 'Antes de buscar agua nueva conviene no [perder] la que ya hay; la desalinización necesita mucha [energía]; y reutilizar el agua [tratada] reduce la extracción.', ['beber', 'lluvia', 'salada'], 'Tres ideas para cualquier discusión sobre "nuevas fuentes".', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: agua y futuro', 'Napas, contaminantes, glaciares, sequías y nuevas fuentes, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: la ciudad sin lluvia', 'Una ciudad de la costa atlántica entra en su tercer verano seco. Con los números, armá el plan.', [
      teoria('El caso', [
        'Una ciudad costera de 200.000 habitantes toma el agua de un acuífero. Viene de dos veranos secos y el tercero pinta igual. En verano la población se duplica por el turismo. La red pierde el 30 % del agua que produce. En los pozos más cercanos al mar, el agua empezó a salir salobre.',
        'El municipio tiene que armar un plan. Estos son algunos datos: la ciudad produce 80 millones de litros por día en verano; el acuífero puede aportar de forma sostenible unos 60.',
      ]),
      num('¿Cuántos millones de litros por día se pierden en la red en verano?', 24, 'millones de litros por día', '30 % de 80 = 24 millones de litros por día. Es casi lo que la ciudad saca de más respecto de lo sostenible.', { ctx: 'Ciudad costera: produce 80 millones de L/día en verano, pierde el 30 % en la red, el acuífero aporta de forma sostenible 60 millones de L/día. Pozos costeros salobres.', d: 2 }),
      op('¿Qué señal indica que el acuífero ya está sobreexplotado?', [ // e2
        'Los pozos cercanos al mar dan agua salobre',
        'En verano hay más turistas en la playa',
        ['La factura de agua es más cara que el año pasado', 'El precio puede cambiar por muchas razones; la intrusión salina es una señal física directa.'],
        'Llueve poco en invierno en la ciudad',
      ], 'La intrusión salina muestra que la napa dulce bajó tanto que el mar avanza. Es la alarma más clara.', { ctx: 'Ciudad costera que toma agua de un acuífero; los pozos cercanos al mar empezaron a dar agua salobre.', d: 3 }),
      numv(3, (i) => { // e3
        const meta = [15, 10, 20][i];
        return {
          enunciado: `Si la ciudad baja sus pérdidas del 30 % al ${meta} % y quiere que llegue a las casas la misma agua que hoy (56 millones de litros por día), ¿cuántos millones de litros por día necesita producir? Redondeá a un decimal.`,
          valor: Math.round((56 / (1 - meta / 100)) * 10) / 10,
          unidad: 'millones de litros por día',
          dec: 1,
          tol: 0.2,
          explicacion: `Hoy llega el 70 % de 80 = 56. Con ${meta} % de pérdidas llega el ${100 - meta} %: hace falta producir 56 ÷ ${(1 - meta / 100).toLocaleString('es-AR')} ≈ ${(Math.round((56 / (1 - meta / 100)) * 10) / 10).toLocaleString('es-AR')} millones: menos que los 80 actuales y más cerca de los 60 sostenibles.`,
        };
      }, { d: 4 }),
      rank('Ordená las medidas del plan por prioridad razonable, empezando por la primera.', [ // e4
        ['Reparar la red para bajar pérdidas', 'rápida, barata y alivia el acuífero'],
        ['Reducir el bombeo en los pozos costeros salobres', 'frena la intrusión'],
        ['Reutilizar agua tratada para regar plazas y canchas', 'baja la demanda de agua potable'],
        ['Evaluar una desalinizadora con energía renovable', 'fuente nueva, cara y lenta de construir'],
      ], 'Primero lo que es rápido y barato y frena el daño; después lo que reduce demanda; y al final las fuentes nuevas grandes.', { d: 4 }),
      clas('Clasificá las propuestas que aparecen en el concejo.', { // e5
        'Ayudan al acuífero': ['Tarifa que premia el bajo consumo en verano', 'Prohibir el riego de jardines al mediodía', 'Controlar los pozos privados sin registro'],
        'Lo empeoran': ['Habilitar perforaciones libres en toda la costa', 'Llenar piletas con agua de red en plena sequía', 'Postergar la reparación de la red hasta el invierno'],
      }, 'Todo lo que aumenta la extracción cerca de la costa empuja la intrusión salina.', { d: 3 }),
      cad('Armá la cadena de por qué frenar el bombeo costero protege a toda la ciudad.', [ // e6
        'Se reduce el bombeo en los pozos cercanos al mar',
        'La napa dulce recupera nivel en esa zona',
        'La presión del agua dulce frena al mar',
        'La intrusión salina deja de avanzar tierra adentro',
        'Los pozos del resto de la ciudad siguen dando agua dulce',
      ], ['El mar retrocede porque bajó la marea'], 'Proteger el borde del acuífero es proteger a los pozos de adentro.', { d: 4 }),
      vf('Como la ciudad es costera, la mejor solución es construir ya una desalinizadora y seguir bombeando igual.', false, 'Una desalinizadora tarda años, cuesta mucho y necesita energía. Mientras tanto, seguir bombeando igual profundiza la intrusión salina. Primero hay que frenar el daño y reducir pérdidas.', { // e7
        razones: ['+Porque tarda años y mientras tanto la intrusión sigue avanzando', '-Porque la desalinización no funciona con agua de mar', '-Porque el acuífero se recupera solo aunque se siga bombeando'],
        d: 3,
      }),
      det('Un medio publica el plan. Marcá los errores.', [ // e8
        ['La red pierde 24 millones de litros por día en verano.', false],
        ['Los pozos salobres son un problema de los turistas, no del acuífero.', true, 'El agua salobre es intrusión salina por sobreexplotación del acuífero.'],
        ['El plan empieza por reparar la red y reducir el bombeo costero.', false],
        ['Con la desalinizadora ya no hará falta cuidar nunca más el agua.', true, 'Toda fuente tiene costos y límites: cuidar el agua sigue siendo necesario.'],
      ], 'Diagnóstico correcto y prioridades en orden: así se arma un plan de agua que aguante sequías.', { d: 4 }),
    ]),
  ],
});
