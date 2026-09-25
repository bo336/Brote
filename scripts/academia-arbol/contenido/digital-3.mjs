import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// DIGITAL 3 — Centros de datos e inteligencia artificial.
// Qué hay dentro de un centro de datos y cómo se mide su eficiencia, el agua
// y el lugar donde se construyen, cuánta energía usa la IA de verdad, la
// carrera entre eficiencia y demanda, y qué se puede exigir. Retoma internet
// es física (digital-1), la tecnología que ayuda y sus límites (digital-2) y
// la electricidad (energia-3).

export default unidad({
  slug: 'digital-3',
  rama: 'digital',
  orden: 3,
  nivel: 2,
  requiereTronco: 2,
  titulo: 'Centros de datos e inteligencia artificial',
  bajada: 'Servidores, refrigeración, agua y la energía de la IA: qué pasa detrás de cada consulta, qué números son reales y qué se puede exigir a quienes construyen la nube.',
  objetivos: [
    'Describir las partes de un centro de datos y calcular su PUE',
    'Explicar cómo se enfrían los centros de datos y por qué importa dónde se construyen',
    'Dimensionar la energía de la IA con datos recientes y sin exageraciones',
    'Analizar la carrera entre mejoras de eficiencia y crecimiento de la demanda',
    'Proponer exigencias de transparencia y buenas prácticas para la infraestructura digital',
  ],
  repasa: ['digital-1', 'digital-2', 'energia-3', 'ciencia-3'],
  fuentes: ['iea-energia-ia', 'iea-datacenters', 'uptime-2024', 'google-ia-2025', 'carbon-brief', 'iea-streaming'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Dentro de un centro de datos', 'Servidores, almacenamiento, redes, refrigeración y respaldo, y el número que mide cuánta energía se pierde en el camino.', [
      teoria('Qué hay adentro', [
        'Un centro de datos es un edificio con miles de servidores (computadoras que funcionan todo el día), sistemas de almacenamiento y equipos de red. Pero no toda la electricidad va a las computadoras: una parte se usa para enfriarlas, para los sistemas de respaldo que evitan cortes, para convertir la energía eléctrica y para la iluminación y los edificios.',
      ]),
      clas('¿Esta parte de un centro de datos es equipo informático o infraestructura de apoyo?', { // e1
        'Equipo informático': ['Servidores que procesan datos', 'Discos de almacenamiento', 'Equipos de red que conectan los servidores'],
        'Infraestructura de apoyo': ['Equipos de refrigeración', 'Baterías y generadores de respaldo', 'Iluminación del edificio'],
      }, 'Toda la energía de apoyo es necesaria, pero cuanto menos haga falta, más eficiente es el centro de datos.', { d: 1 }),
      teoria('El PUE', [
        'Para medir la eficiencia de la instalación se usa el PUE (por sus siglas en inglés, efectividad en el uso de la energía): la energía total del centro de datos dividida por la energía que usan los equipos informáticos. Un PUE de 1 sería perfecto: toda la energía iría a las computadoras. Según la encuesta 2024 del Uptime Institute, el promedio de la industria es de 1,56 y lleva cinco años sin mejorar, aunque muchos centros nuevos logran 1,3 o menos.',
      ], { destacado: { valor: '1,56', texto: 'es el PUE promedio de los centros de datos según la encuesta 2024 del Uptime Institute: por cada kWh de cómputo, 0,56 kWh extra.' } }),
      numv(3, (i) => { // e2
        const [total, it] = [[15, 10], [13, 10], [24, 20]][i];
        return {
          enunciado: `Un centro de datos consume ${total} MW en total y sus equipos informáticos ${it} MW. ¿Cuál es su PUE? Redondeá a dos decimales.`,
          valor: Math.round((total / it) * 100) / 100,
          unidad: '',
          dec: 2,
          tol: 0.01,
          explicacion: `PUE = ${total} ÷ ${it} = ${(Math.round((total / it) * 100) / 100).toLocaleString('es-AR')}. Cuanto más cerca de 1, menos energía se va en refrigeración y apoyo.`,
          ctx: `Consumo total ${total} MW; equipos informáticos ${it} MW.`,
        };
      }, { d: 2 }),
      numv(3, (i) => { // e3
        const [it, pue] = [[10, 1.5], [8, 1.6], [20, 1.2]][i];
        return {
          enunciado: `Los servidores de un centro de datos usan ${it} MW y su PUE es ${pue.toLocaleString('es-AR')}. ¿Cuántos MW se usan en refrigeración y apoyo? Redondeá a un decimal.`,
          valor: Math.round(it * (pue - 1) * 10) / 10,
          unidad: 'MW',
          dec: 1,
          tol: 0.1,
          explicacion: `Total: ${it} × ${pue.toLocaleString('es-AR')} = ${(it * pue).toLocaleString('es-AR')} MW. Apoyo: ${(it * pue).toLocaleString('es-AR')} − ${it} = ${(Math.round(it * (pue - 1) * 10) / 10).toLocaleString('es-AR')} MW.`,
          ctx: `Equipos ${it} MW; PUE ${pue}.`,
        };
      }, { d: 3 }),
      op('Un centro de datos tiene un PUE de 1,1 y otro de 1,8. ¿Qué significa?', [ // e4
        'El primero pierde mucha menos energía en apoyo',
        'El segundo tiene computadoras más potentes',
        ['El primero consume menos energía en total, seguro', 'Depende de cuántos servidores tenga: el PUE mide eficiencia, no tamaño.'],
        'Los dos son igual de eficientes',
      ], 'El PUE no dice cuánto consume un centro de datos, sino qué parte se va en cosas que no son cómputo.', { d: 2 }),
      vf('Un PUE bajo significa que un centro de datos consume poca energía.', false, 'El PUE mide la proporción de energía que se va en apoyo, no el consumo total. Un centro enorme con PUE excelente puede consumir muchísimo.', { // e5
        razones: ['+Porque el PUE mide proporción, no consumo total', '-Porque el PUE mide la velocidad de internet', '-Porque un PUE bajo es siempre malo'],
        d: 3,
      }),
      teoria('Todo el día, todo el año', [
        'Los centros de datos funcionan las 24 horas, los 365 días. Un equipo de 10 MW que funciona un año entero consume 10 × 8.760 horas = 87.600 MWh, más lo que agregue su PUE. Por eso incluso mejoras pequeñas de eficiencia, multiplicadas por todas las horas del año, representan mucha energía.',
      ]),
      numv(3, (i) => { // e6
        const [mw, pue] = [[10, 1.5], [5, 1.3], [20, 1.4]][i];
        return {
          enunciado: `Los servidores de un centro de datos usan ${mw} MW todo el año (8.760 horas) y su PUE es ${pue.toLocaleString('es-AR')}. ¿Cuántos MWh consume en total por año?`,
          valor: Math.round(mw * 8760 * pue),
          unidad: 'MWh',
          tol: 1,
          explicacion: `${mw} × 8.760 × ${pue.toLocaleString('es-AR')} = ${Math.round(mw * 8760 * pue).toLocaleString('es-AR')} MWh por año. Un hogar argentino típico usa del orden de 3 MWh por año.`,
          ctx: `${mw} MW; 8.760 horas; PUE ${pue}.`,
        };
      }, { d: 3 }),
      cad('Armá el recorrido de la energía en un centro de datos.', [ // e7
        'La electricidad llega de la red',
        'Se convierte y pasa por sistemas de respaldo',
        'Alimenta a los servidores que procesan datos',
        'Los servidores la transforman en calor',
        'La refrigeración usa más energía para sacar ese calor',
      ], ['Los servidores convierten el calor en electricidad de nuevo'], 'Toda la energía que usan las computadoras termina como calor que hay que sacar.', { d: 2 }),
      rank('Ordená estos centros de datos del más eficiente al menos eficiente, según su PUE.', [ // e7b
        ['Centro nuevo en clima frío', 'PUE 1,1'],
        ['Centro nuevo típico', 'PUE 1,3'],
        ['Promedio de la industria', 'PUE 1,56'],
        ['Sala de servidores vieja en una oficina', 'PUE 2,0'],
      ], 'Un PUE de 2 significa que por cada kWh de cómputo se gasta otro kWh en apoyo.', { d: 1, extremos: ['Más eficiente', 'Menos eficiente'] }),
      par('Uní cada término con su definición.', [ // e8
        ['Servidor', 'Computadora que funciona todo el día'],
        ['PUE', 'Energía total dividida por la de los equipos'],
        ['Respaldo', 'Baterías y generadores que evitan cortes'],
        ['Refrigeración', 'Saca el calor que generan los equipos'],
      ], 'Vocabulario básico para hablar de centros de datos.', { d: 1 }),
      det('Leé este informe de una empresa y marcá lo equivocado.', [ // e9
        ['Nuestro PUE es de 1,2, mejor que el promedio de la industria.', false],
        ['Con PUE 1,2, toda nuestra energía va a los servidores.', true, 'Un 20 % extra va a refrigeración y apoyo.'],
        ['Los servidores funcionan las 24 horas.', false],
        ['Como nuestro PUE es bajo, nuestro consumo total es bajo.', true, 'El PUE no dice nada del consumo total.'],
      ], 'Un número bien entendido evita conclusiones equivocadas.', { d: 2 }),
      comp('Completá.', 'El número que compara la energía total con la de los equipos es el [PUE]; el promedio de la industria es de [1,56]; y toda la energía de los servidores termina como [calor].', ['IVA', '0,56', 'luz'], 'Tres claves para medir la eficiencia de un centro de datos.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Agua, clima y lugar', 'Cómo se enfrían los centros de datos, cuánta agua usan y por qué importa tanto dónde se construyen.', [
      teoria('Enfriar', [
        'Hay varias formas de sacar el calor. Con aire acondicionado, que usa mucha electricidad. Con enfriamiento evaporativo, que evapora agua para enfriar el aire: usa menos electricidad, pero consume agua. Con líquido que circula cerca de los chips, más eficiente para equipos muy potentes. Y, en climas fríos, con aire exterior la mayor parte del año, casi sin gasto extra.',
        'Hay un intercambio: ahorrar electricidad puede costar agua, y ahorrar agua puede costar electricidad. Qué conviene depende del lugar.',
      ]),
      par('Uní cada forma de enfriar con su característica.', [ // e1
        ['Aire acondicionado', 'Usa mucha electricidad'],
        ['Enfriamiento evaporativo', 'Ahorra electricidad pero consume agua'],
        ['Refrigeración líquida', 'Eficiente para chips muy potentes'],
        ['Aire exterior en climas fríos', 'Enfría casi sin gasto extra'],
      ], 'Cada método tiene su costo; ninguno es gratis en todos los lugares.', { d: 2 }),
      teoria('El agua', [
        'Un centro de datos usa agua de dos formas: directamente, para enfriar, y de forma indirecta, en las centrales que generan su electricidad (las térmicas usan agua para enfriarse). En zonas con sequía o poca agua, un centro de datos grande puede competir con el consumo de la población y del riego. Por eso importa medir y publicar cuánta agua usa, en litros por kWh, y de qué fuente la toma.',
      ]),
      clas('¿Uso de agua directo o indirecto?', { // e2
        'Directo': ['Agua evaporada en las torres de enfriamiento', 'Agua para humidificar el aire de las salas'],
        'Indirecto': ['Agua que usa la central térmica que genera su electricidad', 'Agua usada para fabricar sus chips'],
      }, 'Mirar solo el agua directa esconde una parte de la huella hídrica.', { d: 2 }),
      cad('Armá la cadena de un conflicto por el agua.', [ // e3
        'Se instala un centro de datos grande en una zona seca',
        'Usa enfriamiento evaporativo en verano',
        'Su consumo de agua es máximo cuando hace más calor',
        'Coincide con el pico de consumo de la población y del riego',
        'Crece la tensión por el agua disponible',
      ], ['En verano el centro de datos usa menos agua'], 'Lo viste con la huella hídrica: no es lo mismo un litro en una cuenca con agua que en una con sequía.', { d: 2 }),
      teoria('Dónde y cuándo', [
        'La huella de un centro de datos depende mucho de dónde está. En un lugar frío puede enfriar con aire exterior; con una red eléctrica con muchas renovables, emite menos por cada kWh; con agua abundante, el enfriamiento evaporativo genera menos tensión. Además, algunas tareas que no son urgentes, como entrenar modelos o procesar copias de seguridad, pueden programarse para las horas en que hay más energía renovable disponible.',
      ]),
      mult('¿Qué hace más adecuado un lugar para un centro de datos? Marcá todo.', [ // e4
        '+Clima fresco que permita enfriar con aire exterior',
        '+Red eléctrica con muchas renovables',
        '+Agua disponible sin competir con la población',
        '-Una zona con sequía crónica',
        '-Una red eléctrica basada en carbón',
      ], 'El mismo centro de datos puede tener una huella muy distinta según el lugar.', { d: 1 }),
      numv(3, (i) => { // e5
        const [mwh, ga, gb] = [[100000, 0.1, 0.5], [50000, 0.05, 0.4], [80000, 0.15, 0.6]][i];
        return {
          enunciado: `Un centro de datos consume ${mwh.toLocaleString('es-AR')} MWh por año. En una región la red emite ${ga.toLocaleString('es-AR')} t de CO₂ por MWh y en otra ${gb.toLocaleString('es-AR')}. ¿Cuántas toneladas de CO₂ por año se evitan en la región más limpia?`,
          valor: Math.round(mwh * (gb - ga)),
          unidad: 't de CO₂',
          tol: 1,
          explicacion: `${mwh.toLocaleString('es-AR')} × (${gb.toLocaleString('es-AR')} − ${ga.toLocaleString('es-AR')}) = ${Math.round(mwh * (gb - ga)).toLocaleString('es-AR')} toneladas por año. La ubicación puede pesar más que muchas mejoras técnicas.`,
          ctx: `${mwh} MWh por año; redes de ${ga} y ${gb} t/MWh.`,
        };
      }, { d: 3 }),
      teoria('El calor que sobra', [
        'Todo el calor que sacan los centros de datos se puede aprovechar en lugar de tirarlo al aire. En algunos países del norte de Europa, ese calor se usa para calentar agua y viviendas a través de redes de calefacción urbana. Aprovechar el calor residual convierte un desperdicio en un recurso.',
      ]),
      vf('El calor que producen los centros de datos no tiene ningún uso posible.', false, 'Puede aprovecharse para calefacción de viviendas o procesos industriales, como ya se hace en algunas ciudades del norte de Europa.', { // e6
        razones: ['+Porque puede usarse para calefacción u otros procesos', '-Porque los servidores no producen calor', '-Porque el calor residual es tóxico'],
        d: 2,
      }),
      vf('Enfriar con agua evaporada siempre es peor que enfriar con aire acondicionado.', false, 'Depende del lugar: el evaporativo ahorra electricidad, lo que puede ser mejor donde sobra agua; donde el agua escasea, conviene otra opción.', { // e6b
        razones: ['+Porque el balance entre agua y electricidad depende del lugar', '-Porque el aire acondicionado no usa electricidad', '-Porque el enfriamiento evaporativo no usa agua'],
        d: 3,
      }),
      op('¿Qué tareas de un centro de datos se pueden mover a las horas con más energía renovable?', [ // e7
        'Entrenar modelos o hacer copias de seguridad',
        'Responder una videollamada en vivo',
        ['Procesar un pago con tarjeta en el momento', 'Un pago necesita respuesta inmediata: no puede esperar.'],
        'Cargar una página web que alguien pidió',
      ], 'Las tareas que no necesitan respuesta inmediata pueden esperar al momento más limpio.', { d: 2 }),
      det('Leé esta propuesta de una empresa y marcá lo que preocupa.', [ // e8
        ['Usaremos aire exterior para enfriar la mayor parte del año.', false],
        ['Tomaremos agua subterránea de una cuenca en sequía sin publicar cuánta.', true, 'Compite con la población y no es transparente.'],
        ['Contrataremos energía renovable para cubrir nuestro consumo.', false],
        ['El calor sobrante lo tiraremos al aire aunque haya un barrio que necesita calefacción.', true, 'Se desperdicia un recurso que podría aprovecharse.'],
      ], 'Un centro de datos responsable elige bien el lugar, cuida el agua y aprovecha su calor.', { d: 2 }),
      comp('Completá.', 'Enfriar evaporando agua ahorra [electricidad] pero consume agua; en climas fríos se puede enfriar con aire [exterior]; y el calor que sobra se puede usar para [calefacción].', ['dinero', 'caliente', 'iluminación'], 'Tres ideas para pensar el agua y el lugar de un centro de datos.', { d: 1 }),
      rank('Ordená estos lugares del más al menos adecuado para un nuevo centro de datos grande.', [ // e10
        ['Clima frío, red renovable y agua abundante', 'ideal'],
        ['Clima templado, red renovable y agua suficiente', 'bueno'],
        ['Clima cálido, red con gas y agua escasa', 'problemático'],
        ['Clima caluroso, red a carbón y sequía crónica', 'el peor'],
      ], 'Clima, energía y agua se combinan: el lugar define gran parte de la huella.', { d: 2, extremos: ['Más adecuado', 'Menos adecuado'] }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('La energía de la IA', 'Entrenar y usar modelos, cuánto consume una consulta y cuánto crece la demanda de los centros de datos.', [
      teoria('Entrenar y usar', [
        'Un modelo de inteligencia artificial tiene dos etapas que consumen energía. El entrenamiento, en el que el modelo aprende a partir de enormes cantidades de datos, usa miles de chips especializados durante semanas o meses. La inferencia es el uso: cada vez que alguien hace una consulta, el modelo calcula una respuesta. Una consulta consume poco, pero con miles de millones de consultas por día, el uso puede superar al entrenamiento.',
      ]),
      clas('¿Es entrenamiento o inferencia?', { // e1
        'Entrenamiento': ['El modelo aprende de grandes cantidades de datos durante semanas', 'Se ajusta un modelo con nuevos ejemplos'],
        'Inferencia': ['Alguien le pide un resumen a un asistente', 'Una app traduce un texto al instante', 'Se genera una imagen a partir de una descripción'],
      }, 'El entrenamiento es un gasto grande y concentrado; la inferencia, uno chico multiplicado por millones de usos.', { d: 1 }),
      teoria('Cuánto gasta una consulta', [
        'Durante años circularon estimaciones muy distintas. En 2025, Google publicó mediciones de su propio servicio: la consulta de texto mediana a su asistente de IA usó 0,24 Wh de energía y 0,26 mililitros de agua, y ese consumo había bajado 33 veces en un año gracias a mejoras de software y hardware. Otras estimaciones independientes para consultas de texto dan valores del mismo orden o algo mayores; generar imágenes o video usa bastante más.',
        'Para comparar: 0,24 Wh es lo que usa una lámpara LED de 10 W prendida algo menos de un minuto y medio.',
      ], { destacado: { valor: '0,24 Wh', texto: 'usó la consulta de texto mediana al asistente de IA de Google en 2025, según sus propias mediciones.' } }),
      numv(3, (i) => { // e2
        const w = [10, 8, 12][i];
        return {
          enunciado: `Si una consulta de IA usa 0,24 Wh, ¿cuántos segundos puede estar prendida una lámpara LED de ${w} W con esa energía? Redondeá al entero.`,
          valor: Math.round((0.24 / w) * 3600),
          unidad: 'segundos',
          tol: 1,
          explicacion: `0,24 Wh ÷ ${w} W = ${(0.24 / w).toLocaleString('es-AR')} horas × 3.600 ≈ ${Math.round((0.24 / w) * 3600)} segundos. Una consulta de texto, sola, usa poca energía.`,
          ctx: `0,24 Wh por consulta; lámpara de ${w} W.`,
        };
      }, { d: 2 }),
      numv(3, (i) => { // e3
        const mil = [1000, 500, 2000][i];
        return {
          enunciado: `Si se hacen ${mil.toLocaleString('es-AR')} millones de consultas de texto por día y cada una usa 0,24 Wh, ¿cuántos MWh por día son? (1 MWh = 1.000.000 Wh)`,
          valor: Math.round(mil * 0.24),
          unidad: 'MWh por día',
          tol: 1,
          explicacion: `${mil.toLocaleString('es-AR')} millones × 0,24 Wh = ${(mil * 0.24).toLocaleString('es-AR')} millones de Wh = ${Math.round(mil * 0.24).toLocaleString('es-AR')} MWh por día. Poco por consulta; mucho sumado.`,
          ctx: `${mil} millones de consultas; 0,24 Wh cada una.`,
        };
      }, { d: 3 }),
      teoria('La demanda crece', [
        'Según la Agencia Internacional de Energía, en 2024 los centros de datos consumieron unos 415 TWh, alrededor del 1,5 % de la electricidad mundial. Estados Unidos concentró el 45 %, China el 25 % y Europa el 15 %. Con la expansión de la IA, la agencia proyecta que el consumo se duplique hasta unos 950 TWh en 2030, algo menos del 3 % de la electricidad mundial. A escala global es una parte chica, pero en algunas regiones, donde se concentran los centros de datos, el impacto sobre la red es grande.',
      ], {
        datos: barras('Consumo de electricidad de los centros de datos (AIE)', 'TWh', [
          ['2024', 415],
          ['2030 (proyección)', 950],
        ], 'Agencia Internacional de Energía, Energy and AI (2025).'),
      }),
      rank('Ordená las regiones según su participación en el consumo de los centros de datos en 2024, de mayor a menor.', [ // e4
        ['Estados Unidos', '≈ 45 %'],
        ['China', '≈ 25 %'],
        ['Europa', '≈ 15 %'],
      ], 'El consumo está muy concentrado: el impacto local puede ser grande aunque el global sea chico.', { d: 2 }),
      est('Estimá qué porcentaje de la electricidad mundial consumieron los centros de datos en 2024, según la AIE.', 1.5, { min: 0, max: 30, paso: 0.5, unidad: '%' }, 'Alrededor del 1,5 %: unos 415 TWh. Podría llegar a algo menos del 3 % en 2030.', { d: 2 }),
      vf('Como una consulta de texto a una IA gasta poca energía, el crecimiento de la IA no tiene impacto en la red eléctrica.', false, 'Una consulta gasta poco, pero la cantidad de usos, el entrenamiento y la concentración de centros de datos en ciertas regiones hacen que la demanda crezca rápido y presione redes locales.', { // e5
        razones: ['+Porque la escala y la concentración presionan las redes', '-Porque cada consulta gasta más que una casa por año', '-Porque la IA no usa electricidad'],
        d: 3,
      }),
      op('¿Por qué conviene desconfiar de un titular que dice "cada pregunta a una IA gasta una botella de agua"?', [ // e6
        'Las mediciones recientes dan valores mucho menores',
        'Porque las IA no usan agua en ningún caso',
        ['Porque los titulares siempre mienten', 'No siempre; pero conviene chequear con datos recientes y la fuente.'],
        'Porque el agua de los centros de datos es de mar',
      ], 'Lo viste con la desinformación: los números impactantes y viejos circulan mucho más que las mediciones cuidadosas.', { d: 2 }),
      cad('Armá la cadena de por qué la IA hace crecer el consumo de los centros de datos.', [ // e7
        'Se entrenan modelos cada vez más grandes',
        'Millones de personas los usan todos los días',
        'Hacen falta más chips especializados y más servidores',
        'Se construyen más centros de datos',
        'Crece la demanda de electricidad en esas regiones',
      ], ['Cada modelo nuevo usa menos servidores que el anterior'], 'El crecimiento combina modelos más grandes y muchos más usuarios.', { d: 2 }),
      par('Uní cada actividad con el orden de magnitud de su energía.', [ // e7b
        ['Una consulta de texto a una IA', 'Décimas de Wh'],
        ['Generar una imagen o un video', 'Bastante más que un texto'],
        ['Entrenar un modelo grande', 'Enorme, concentrada en semanas'],
        ['Todos los centros de datos del mundo en 2024', 'Unos 415 TWh'],
      ], 'Poner cada número en su escala evita tanto exagerar como minimizar.', { d: 2 }),
      det('Leé este posteo y marcá lo equivocado.', [ // e8
        ['Los centros de datos usaron cerca del 1,5 % de la electricidad mundial en 2024.', false],
        ['La IA ya consume más electricidad que todo el mundo junto.', true, 'Los centros de datos en total rondan el 1,5 %.'],
        ['El consumo por consulta bajó mucho gracias a mejoras de eficiencia.', false],
        ['Generar un video con IA gasta lo mismo que una consulta de texto.', true, 'Generar imágenes o video usa bastante más energía.'],
      ], 'Ni "no pasa nada" ni "la IA se come el planeta": los datos muestran un crecimiento real y concentrado.', { d: 2 }),
      comp('Completá.', 'Cuando un modelo aprende de los datos se llama [entrenamiento]; cuando responde consultas, [inferencia]; y en 2024 los centros de datos usaron unos [415] TWh.', ['descanso', 'deducción', '4.150'], 'Tres ideas para hablar de la energía de la IA con precisión.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Eficiencia contra demanda', 'Chips más eficientes, software más liviano y una demanda que crece más rápido: la carrera que define la huella de lo digital.', [
      teoria('Cada vez más eficiente', [
        'La eficiencia de la computación mejoró muchísimo durante décadas: hoy se hace con un celular lo que antes requería una sala entera. En la IA, las mejoras siguen siendo rápidas: chips diseñados para estas tareas, modelos más chicos que responden casi igual de bien, y software que aprovecha mejor el hardware. Según Google, la energía por consulta mediana de su asistente bajó 33 veces en un año.',
      ]),
      numv(3, (i) => { // e1
        const [antes, factor] = [[7.92, 33], [3, 10], [1.2, 5]][i];
        return {
          enunciado: `Si una consulta usaba ${antes.toLocaleString('es-AR')} Wh y la eficiencia mejoró ${factor} veces, ¿cuántos Wh usa ahora? Redondeá a dos decimales.`,
          valor: Math.round((antes / factor) * 100) / 100,
          unidad: 'Wh',
          dec: 2,
          tol: 0.01,
          explicacion: `${antes.toLocaleString('es-AR')} ÷ ${factor} ≈ ${(Math.round((antes / factor) * 100) / 100).toLocaleString('es-AR')} Wh. Mejoras así son enormes, pero no garantizan que baje el consumo total.`,
          ctx: `${antes} Wh por consulta; mejora de ${factor} veces.`,
        };
      }, { d: 2 }),
      teoria('La paradoja', [
        'En el siglo XIX, el economista William Stanley Jevons notó que las máquinas de vapor más eficientes no redujeron el uso de carbón: lo aumentaron, porque el vapor se volvió más barato y se usó para muchas más cosas. Es la paradoja de Jevons, una forma extrema del efecto rebote. Con la IA puede pasar algo parecido: si cada consulta cuesta menos, se usa en más productos y por más personas, y el consumo total puede crecer igual.',
      ]),
      cad('Armá la paradoja de Jevons aplicada a la IA.', [ // e2
        'Cada consulta se vuelve mucho más eficiente',
        'Usar IA se vuelve más barato',
        'Se incorpora a muchos más productos y servicios',
        'La cantidad de consultas crece muchísimo',
        'El consumo total de energía puede aumentar',
      ], ['La eficiencia garantiza que el consumo total baje'], 'La eficiencia es necesaria, pero sin límites ni prioridades, el consumo total puede crecer.', { d: 3 }),
      numv(3, (i) => { // e3
        const [mej, crec] = [[10, 20], [5, 8], [4, 3]][i];
        return {
          enunciado: `La energía por consulta baja ${mej} veces, pero la cantidad de consultas crece ${crec} veces. ¿Por cuánto se multiplica el consumo total? Redondeá a un decimal.`,
          valor: Math.round((crec / mej) * 10) / 10,
          unidad: 'veces',
          dec: 1,
          tol: 0.1,
          explicacion: `${crec} ÷ ${mej} = ${(Math.round((crec / mej) * 10) / 10).toLocaleString('es-AR')}. ${crec > mej ? 'El consumo total crece: la demanda le ganó a la eficiencia.' : 'El consumo total baja: la eficiencia le ganó a la demanda.'}`,
          ctx: `Eficiencia ${mej} veces mejor; consultas ${crec} veces más.`,
        };
      }, { d: 3 }),
      clas('¿Es una mejora de eficiencia o un aumento de la demanda?', { // e4
        'Mejora de eficiencia': ['Chips que hacen más cálculos por watt', 'Modelos más chicos con resultados parecidos', 'Mejor refrigeración que baja el PUE'],
        'Aumento de la demanda': ['IA incorporada en cada buscador y aplicación', 'Generación de video para publicidad masiva', 'Millones de usuarios nuevos por mes'],
      }, 'La huella total depende de cuál de las dos fuerzas crezca más rápido.', { d: 2 }),
      vf('Si cada consulta a una IA es 10 veces más eficiente, el consumo total de la IA seguro baja.', false, 'Solo baja si la cantidad de consultas crece menos de 10 veces. Si crece más, el consumo total aumenta: es el efecto rebote.', { // e5
        razones: ['+Porque depende de cuánto crezca la cantidad de consultas', '-Porque la eficiencia siempre aumenta el consumo', '-Porque la cantidad de consultas nunca cambia'],
        d: 2,
      }),
      teoria('Usar lo justo', [
        'Además de hacer cada cálculo más eficiente, se puede usar la herramienta adecuada para cada tarea: un modelo grande para una pregunta simple es como usar un camión para llevar una carta. Elegir modelos más chicos cuando alcanzan, evitar generar contenido que nadie pidió y no incorporar IA donde no aporta valor también reducen el consumo.',
      ]),
      op('¿Qué práctica reduce el consumo sin perder utilidad?', [ // e6
        'Usar un modelo chico cuando la tarea es simple',
        'Usar siempre el modelo más grande por las dudas',
        ['Generar diez versiones de todo aunque se use una', 'Multiplica el consumo sin agregar valor.'],
        'Incorporar IA en cada botón de una aplicación',
      ], 'La herramienta proporcionada a la tarea es una forma de suficiencia digital.', { d: 1 }),
      par('Uní cada concepto con su ejemplo.', [ // e7
        ['Mejora de eficiencia', 'Un chip que hace el doble de cálculos por watt'],
        ['Paradoja de Jevons', 'Más eficiencia que termina en más consumo total'],
        ['Suficiencia digital', 'Usar un modelo chico si alcanza'],
        ['Demanda creciente', 'IA incorporada en todas las aplicaciones'],
      ], 'Cuatro conceptos para entender la carrera entre eficiencia y demanda.', { d: 2 }),
      mult('¿Qué puede evitar que las mejoras de eficiencia se pierdan por el rebote? Marcá todo.', [ // e8
        '+Priorizar los usos de la IA que aportan valor real',
        '+Abastecer los centros de datos con energía renovable',
        '+Publicar cuánta energía y agua usan los servicios',
        '-Promover generar contenido sin límite porque es barato',
        '-Ocultar el consumo para no alarmar',
      ], 'La eficiencia sirve más cuando va acompañada de prioridades, energía limpia y transparencia.', { d: 2 }),
      est('Estimá cuántas veces bajó en un año la energía por consulta mediana del asistente de IA de Google, según sus mediciones de 2025.', 33, { min: 1, max: 1000, unidad: 'veces', escala: 'log' }, 'Unas 33 veces, por mejoras de software, hardware y del uso de los centros de datos. Una mejora enorme en muy poco tiempo.', { d: 3 }),
      det('Leé esta nota y marcá lo equivocado.', [ // e9
        ['La eficiencia por consulta mejoró mucho en poco tiempo.', false],
        ['Como cada consulta es más eficiente, la IA ya no es un tema energético.', true, 'La demanda total sigue creciendo y puede superar a la eficiencia.'],
        ['Jevons observó que el carbón se usó más cuando las máquinas se volvieron eficientes.', false],
        ['Usar el modelo más grande para todo es lo más eficiente.', true, 'Para tareas simples, un modelo chico usa mucha menos energía.'],
      ], 'La eficiencia es una buena noticia, pero no el final de la historia.', { d: 2 }),
      comp('Completá.', 'Cuando la eficiencia termina aumentando el consumo total se habla de la paradoja de [Jevons]; usar un modelo chico cuando alcanza es suficiencia [digital]; y el consumo total depende de la eficiencia y de la [demanda].', ['Newton', 'analógica', 'publicidad'], 'Tres ideas para leer la carrera entre eficiencia y demanda.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Qué se puede exigir', 'Transparencia, energía limpia, agua y calor: lo que empresas y gobiernos pueden hacer, y lo que conviene hacer como usuario.', [
      teoria('Transparencia', [
        'Durante años fue difícil saber cuánta energía y agua usaban los centros de datos y los servicios de IA. Eso empieza a cambiar: en la Unión Europea, los centros de datos a partir de cierto tamaño tienen que informar su consumo de energía y de agua, y algunas empresas publican mediciones por consulta. Sin datos públicos no se pueden comparar servicios, planificar redes ni evaluar promesas.',
      ]),
      mult('¿Qué datos debería publicar un centro de datos? Marcá todos.', [ // e1
        '+Su consumo anual de electricidad',
        '+Su consumo de agua y de qué fuente',
        '+Su PUE',
        '+Qué parte de su energía es renovable, y en qué horas',
        '-Nada, porque es información secreta',
      ], 'La transparencia permite comparar, planificar y controlar.', { d: 1 }),
      teoria('Energía limpia de verdad', [
        'Muchas empresas dicen usar "100 % energía renovable" porque compran, en el año, tanta energía renovable como la que consumen. Pero de noche, cuando no hay sol, su centro de datos puede estar usando electricidad de centrales a gas o carbón. Un estándar más exigente es el de energía libre de carbono hora por hora: que en cada hora el consumo esté cubierto por fuentes limpias de la misma red.',
      ]),
      op('¿Qué diferencia hay entre "100 % renovable en el año" y "libre de carbono hora por hora"?', [ // e2
        'La segunda cubre con energía limpia cada hora de consumo',
        'Son exactamente lo mismo dicho con otras palabras',
        ['La primera es más exigente que la segunda', 'Es al revés: el balance anual permite usar energía fósil en algunas horas.'],
        'La segunda solo se aplica a los días de sol',
      ], 'Lo viste con el greenwashing: una afirmación verdadera puede esconder una parte de la historia.', { d: 3 }),
      numv(3, (i) => { // e3
        const [horas, fosil] = [[8760, 3000], [8760, 4000], [8760, 2000]][i];
        return {
          enunciado: `Un centro de datos que dice ser "100 % renovable" en el año funciona ${horas.toLocaleString('es-AR')} horas, pero en ${fosil.toLocaleString('es-AR')} de ellas su red usa sobre todo gas. ¿Qué porcentaje de las horas no está cubierto por energía limpia? Redondeá al entero.`,
          valor: Math.round((fosil / horas) * 100),
          unidad: '%',
          tol: 1,
          explicacion: `${fosil.toLocaleString('es-AR')} ÷ ${horas.toLocaleString('es-AR')} × 100 ≈ ${Math.round((fosil / horas) * 100)} %. El balance anual esconde esas horas.`,
          ctx: `${fosil} horas con gas de ${horas} horas del año.`,
        };
      }, { d: 2 }),
      teoria('Lo que puede hacer un gobierno', [
        'Los gobiernos pueden exigir que los nuevos centros de datos informen su consumo, cumplan estándares de eficiencia, no compitan por el agua en cuencas en riesgo, aporten a la expansión de la red y de las renovables, y aprovechen el calor cuando sea posible. También pueden planificar dónde conviene ubicarlos para no sobrecargar redes locales.',
      ]),
      clas('¿Es una exigencia razonable o una mala idea?', { // e4
        'Exigencia razonable': ['Informar el consumo de energía y agua', 'Evitar tomar agua de cuencas en sequía', 'Aprovechar el calor residual si hay demanda cerca'],
        'Mala idea': ['Eximir de informar para atraer inversiones', 'Instalarlos donde la red ya no da abasto sin ampliarla'],
      }, 'Las reglas claras protegen a las comunidades y dan previsibilidad a las empresas.', { d: 2 }),
      teoria('Y como usuario', [
        'Como vimos en la base de la rama, la mayor parte de la huella digital de una persona está en fabricar sus dispositivos, no en sus consultas. Usar la IA con sentido —cuando aporta, con la herramienta adecuada, sin generar contenido que nadie necesita— ayuda, pero el peso grande está en las decisiones de empresas y gobiernos. Informarse y exigir transparencia también es una forma de actuar.',
      ]),
      rank('Ordená estas acciones de una persona por su impacto en la huella digital, de mayor a menor.', [ // e5
        ['Conservar el celular dos años más', 'grande'],
        ['No generar videos con IA que nadie va a ver', 'moderado'],
        ['Usar un modelo chico para preguntas simples', 'chico'],
        ['Borrar mails viejos', 'casi nulo'],
      ], 'Los dispositivos pesan más que los clics; y generar video pesa más que preguntar.', { d: 3, extremos: ['Mayor impacto', 'Menor impacto'] }),
      vf('La responsabilidad por la huella de la IA es solo de quienes la usan.', false, 'Las decisiones de mayor peso —dónde construir, qué energía usar, cuánta agua tomar, qué modelos ofrecer— las toman empresas y gobiernos.', { // e6
        razones: ['+Porque las decisiones de mayor peso son de empresas y gobiernos', '-Porque los usuarios no tienen ninguna influencia', '-Porque la IA no tiene huella'],
        d: 2,
      }),
      teoria('La IA también puede ayudar', [
        'La misma tecnología puede ayudar al ambiente: mejorar los pronósticos del tiempo, detectar incendios y desmontes en imágenes satelitales, gestionar redes eléctricas con muchas renovables o encontrar fugas de agua. El desafío es orientar su uso hacia lo que aporta, y que su propia huella no crezca sin control.',
      ]),
      mult('¿En qué usos la IA puede ayudar al ambiente? Marcá todos.', [ // e7
        '+Detectar desmontes en imágenes satelitales',
        '+Mejorar pronósticos del tiempo',
        '+Gestionar redes eléctricas con renovables',
        '-Generar publicidad infinita para vender más',
        '-Reemplazar la medición real de la calidad del aire',
      ], 'La IA es una herramienta: su balance depende de para qué se use.', { d: 2 }),
      cad('Armá la cadena de cómo la transparencia mejora la huella del sector.', [ // e7b
        'Una norma obliga a publicar consumo de energía y agua',
        'Se pueden comparar los centros de datos entre sí',
        'Comunidades y gobiernos detectan dónde hay problemas',
        'Se exigen mejoras donde más hacen falta',
        'Baja la huella de todo el sector',
      ], ['Ocultar los datos obliga a mejorar más rápido'], 'Lo que no se mide no se puede mejorar ni exigir.', { d: 2 }),
      op('Una empresa dice ser "100 % renovable" porque compra certificados por todo su consumo anual. ¿Qué pregunta conviene hacer?', [ // e7c
        '¿Qué energía usa de noche y en qué red?',
        '¿De qué color es el logo de la empresa?',
        ['¿Cuántos empleados tiene la empresa?', 'No dice nada sobre la energía que usa en cada hora.'],
        '¿Cuánto cuesta la acción de la empresa?',
      ], 'El balance anual puede esconder muchas horas de energía fósil.', { d: 2 }),
      det('Leé este reclamo vecinal y marcá lo que no se sostiene.', [ // e8
        ['Pedimos que el centro de datos publique cuánta agua usa.', false],
        ['Cada consulta de IA gasta más energía que una casa en un año.', true, 'Una consulta de texto usa del orden de décimas de Wh.'],
        ['Pedimos que no tome agua de la cuenca en época de sequía.', false],
        ['Pedimos que aproveche su calor para el hospital vecino, si es viable.', false],
      ], 'Un reclamo fuerte se apoya en datos correctos: una exageración le quita credibilidad.', { d: 2 }),
      comp('Completá.', 'Cubrir con energía limpia cada hora de consumo es ser libre de [carbono] hora por hora; exigir que se publique el consumo de agua es pedir [transparencia]; y para una persona, lo que más pesa es conservar sus [dispositivos].', ['azúcar', 'silencio', 'contraseñas'], 'Tres claves de lo que se puede exigir y hacer.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: centros de datos e IA', 'PUE, refrigeración, agua, energía de la IA, eficiencia y demanda, y transparencia, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el centro de datos que llega al pueblo', 'Una empresa quiere construir un centro de datos en un pueblo patagónico. Evaluá la propuesta con números y definí condiciones.', [
      teoria('La propuesta', [
        'La empresa propone un centro de datos con servidores de 20 MW y un PUE de 1,2, gracias a que el clima frío permite enfriar con aire exterior casi todo el año. Promete contratar energía eólica de la zona y usar agua solo en los días más calurosos. El pueblo tiene 15.000 habitantes y su red eléctrica local tiene poca capacidad disponible. Los hogares consumen en promedio unos 3.000 kWh por año.',
      ]),
      num('¿Cuántos MW consume el centro de datos en total, con su PUE de 1,2?', 24, 'MW', '20 × 1,2 = 24 MW: 20 para los servidores y 4 para refrigeración y apoyo.', { ctx: 'Servidores de 20 MW; PUE 1,2.', d: 1 }),
      num('Si funciona todo el año, ¿cuántos MWh consume por año? (24 MW × 8.760 horas)', 210240, 'MWh', '24 × 8.760 = 210.240 MWh por año, unos 210 GWh.', { ctx: '24 MW durante 8.760 horas.', d: 2 }),
      num('¿A cuántos hogares de 3.000 kWh por año equivale ese consumo? (1 MWh = 1.000 kWh)', 70080, 'hogares', '210.240 MWh = 210.240.000 kWh; ÷ 3.000 = 70.080 hogares, casi cinco veces todos los hogares posibles de un pueblo de 15.000 habitantes.', { ctx: '210.240 MWh por año; 3.000 kWh por hogar.', d: 3 }),
      mult('¿Qué condiciones conviene exigir antes de aprobarlo? Marcá todas.', [ // e4
        '+Que financie la ampliación de la red sin que la paguen los vecinos',
        '+Que publique cada año su consumo de energía y agua',
        '+Que la energía eólica sume parques nuevos y no le quite energía limpia al pueblo',
        '+Que evalúe aprovechar su calor para edificios públicos',
        '-Que no informe nada para proteger su secreto comercial',
      ], 'Con condiciones claras, un proyecto así puede aportar; sin ellas, puede sobrecargar la red y generar conflictos.', { d: 3 }),
      op('¿Por qué es importante que la energía eólica provenga de parques nuevos?', [ // e5
        'Para no desplazar energía limpia que ya usaba la red',
        'Porque los parques viejos no generan electricidad',
        ['Porque la energía eólica nueva es gratis', 'No lo es; el punto es que sume energía limpia, no que la reparta.'],
        'Porque así el PUE baja a cero',
      ], 'Si solo compra energía que ya existía, otros usuarios usan más fósil: la adicionalidad importa.', { d: 3 }),
      vf('Como el clima es frío y el PUE es bajo, el proyecto no tiene ningún impacto a considerar.', false, 'Aunque sea eficiente, su consumo total equivale a decenas de miles de hogares y puede presionar la red local. Hay que evaluar red, energía, agua y beneficios para el pueblo.', { // e6
        razones: ['+Porque su consumo total es enorme para la red local', '-Porque el clima frío aumenta el consumo', '-Porque los centros de datos no usan electricidad'],
        d: 2,
      }),
      det('El municipio redacta el acuerdo. Marcá lo que conviene corregir.', [ // e7
        ['La empresa informará cada año su consumo de energía y agua.', false],
        ['La ampliación de la red la pagarán los vecinos con sus tarifas.', true, 'Quien genera la demanda debería financiar la ampliación.'],
        ['La empresa evaluará usar su calor en la escuela y el hospital.', false],
        ['No se pedirán datos de agua porque el clima es frío.', true, 'Igual usará agua en días calurosos: hay que medir y publicar.'],
      ], 'Un buen acuerdo protege a la comunidad y hace previsible el proyecto.', { d: 3 }),
    ]),
  ],
});
