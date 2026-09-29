import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// DIGITAL 5 — Del dato a la decisión.
// Cómo un dato se convierte en indicador, qué hace confiable un conjunto de
// datos, cómo aciertan y se equivocan los algoritmos que miran el planeta,
// cómo se diseñan tableros y alertas que llevan a actuar, y qué derechos y
// cuidados rodean a los datos ambientales. Retoma los satélites y sensores
// (digital-2), la ciencia ciudadana (ciencia-4), los gráficos (ciencia-2) y
// la evaluación de programas (ciencia-6).

export default unidad({
  slug: 'digital-5',
  rama: 'digital',
  orden: 5,
  nivel: 3,
  requiereTronco: 3,
  titulo: 'Del dato a la decisión',
  bajada: 'Indicadores, sensores que hay que calibrar, algoritmos que se equivocan de formas distintas, alertas que salvan vidas y el derecho a saber: cómo los datos se vuelven decisiones.',
  objetivos: [
    'Distinguir datos, indicadores e índices, y reconocer buenos indicadores',
    'Evaluar la calidad de un conjunto de datos ambientales',
    'Interpretar aciertos y errores de un algoritmo con precisión y sensibilidad',
    'Diseñar tableros y alertas vinculados a acciones concretas',
    'Ejercer el derecho de acceso a la información ambiental cuidando la privacidad',
  ],
  repasa: ['digital-2', 'ciencia-4', 'ciencia-2', 'ciencia-6'],
  fuentes: ['airnow-ica', 'epa-sensores', 'fair-2016', 'datos-argentina', 'global-forest-watch', 'nearing-2024-crecidas', 'smn-alertas', 'omm-alertas-para-todos', 'ley-25831-info', 'escazu', 'ley-25326-datos'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('De dato a indicador', 'Datos, indicadores e índices, qué hace bueno a un indicador y qué pasa cuando se vuelve un objetivo.', [
      teoria('Datos, indicadores e índices', [
        'Un dato es una medición puntual: por ejemplo, 38 microgramos de partículas finas por metro cúbico de aire a las 10 de la mañana. Un indicador resume datos para seguir algo que importa, como el promedio diario de esas partículas. Un índice combina uno o varios indicadores en un número fácil de comunicar.',
        'El Índice de Calidad del Aire de la agencia ambiental de Estados Unidos, usado como referencia en muchos países, va de 0 a 50 (buena, verde), de 51 a 100 (moderada, amarilla), de 101 a 150 (dañina para grupos sensibles, naranja), de 151 a 200 (dañina, roja), de 201 a 300 (muy dañina, violeta) y más de 300 (peligrosa, bordó).',
      ]),
      clas('¿Es un dato, un indicador o un índice?', { // e1
        'Dato': ['Una lectura de 38 µg/m³ a las 10 de la mañana', 'La temperatura del agua medida hoy en un punto del río'],
        'Indicador': ['El promedio diario de partículas finas', 'Los kilos de residuos por habitante por día'],
        'Índice': ['El Índice de Calidad del Aire', 'Un puntaje que combina varios indicadores de un río'],
      }, 'Cada nivel resume más y se comunica más fácil, pero también esconde detalles.', { d: 2 }),
      clas('¿En qué categoría del Índice de Calidad del Aire cae cada valor?', { // e2
        'Buena (0 a 50)': ['Índice de 35', 'Índice de 48'],
        'Moderada (51 a 100)': ['Índice de 72', 'Índice de 95'],
        'Dañina para grupos sensibles (101 a 150)': ['Índice de 120', 'Índice de 140'],
        'Dañina (151 a 200)': ['Índice de 160', 'Índice de 190'],
      }, 'Los colores y categorías permiten actuar rápido sin interpretar números técnicos.', { d: 1 }),
      numv(3, (i) => { // e3
        const lect = [[12, 18, 30, 20], [35, 45, 55, 65], [8, 12, 16, 24]][i];
        const prom = lect.reduce((a, b) => a + b, 0) / lect.length;
        return {
          enunciado: `Un sensor midió estas concentraciones de partículas en cuatro momentos del día: ${lect.join(', ')} µg/m³. ¿Cuál es el promedio del día?`,
          valor: prom,
          unidad: 'µg/m³',
          explicacion: `(${lect.join(' + ')}) ÷ 4 = ${prom} µg/m³. El promedio es un indicador: resume, pero puede esconder un pico alto en alguna hora.`,
          ctx: `Lecturas: ${lect.join(', ')} µg/m³.`,
        };
      }, { d: 1 }),
      teoria('Un buen indicador', [
        'Un buen indicador es relevante (mide lo que importa para la decisión), válido (mide de verdad eso), confiable (da resultados parecidos si se mide igual), comparable en el tiempo y entre lugares, oportuno (llega a tiempo para actuar) y comprensible.',
        'Además, hay una advertencia conocida como ley de Goodhart: cuando una medida se convierte en objetivo, deja de ser una buena medida. Si a un municipio se lo premia por "toneladas recicladas", puede terminar pesando residuos húmedos; si se lo premia por "árboles plantados", puede plantar sin cuidar.',
      ]),
      par('Uní cada cualidad de un buen indicador con la pregunta que responde.', [ // e4
        ['Relevante', '¿Sirve para la decisión que hay que tomar?'],
        ['Válido', '¿Mide de verdad lo que dice medir?'],
        ['Comparable', '¿Se puede comparar entre años y lugares?'],
        ['Oportuno', '¿Llega a tiempo para actuar?'],
      ], 'Un indicador que falla en una de estas preguntas puede llevar a malas decisiones.', { d: 2 }),
      cad('Armá la cadena de la ley de Goodhart.', [ // e5
        'Se elige "árboles plantados" para medir la reforestación',
        'Se premia a quien más árboles planta',
        'Se plantan muchos árboles sin elegir especies ni cuidarlos',
        'El número sube, pero muchos árboles mueren',
        'El indicador deja de reflejar si el bosque se recupera',
      ], ['El indicador mejora y el bosque también, siempre'], 'Por eso conviene combinar varios indicadores y mirar resultados reales, como la supervivencia de los árboles.', { d: 2 }),
      op('¿Qué advierte la ley de Goodhart?', [ // e6
        'Que al volverse un objetivo, una medida pierde valor',
        'Que los indicadores nunca sirven para decidir',
        ['Que solo se debe medir una cosa por vez', 'No se trata de medir menos, sino de medir bien y combinar.'],
        'Que los números siempre son más confiables que las personas',
      ], 'Los incentivos cambian conductas: un indicador tiene que resistir la tentación de "maquillarlo".', { d: 2 }),
      numv(3, (i) => { // e7
        const [t, hab] = [[1200, 1000000], [90, 100000], [450, 300000]][i];
        return {
          enunciado: `Una ciudad de ${hab.toLocaleString('es-AR')} habitantes genera ${t.toLocaleString('es-AR')} toneladas de residuos por día. ¿Cuántos kilos por habitante por día genera?`,
          valor: t * 1000 / hab,
          unidad: 'kg por habitante por día',
          dec: 1,
          explicacion: `${t.toLocaleString('es-AR')} t = ${(t * 1000).toLocaleString('es-AR')} kg; ÷ ${hab.toLocaleString('es-AR')} = ${(t * 1000 / hab).toLocaleString('es-AR')} kg. Un indicador por habitante permite comparar ciudades de distinto tamaño.`,
          ctx: `${t} toneladas por día; ${hab} habitantes.`,
        };
      }, { d: 1 }),
      vf('Cuantos más indicadores tenga un tablero, mejor decide un gobierno.', false, 'Demasiados indicadores confunden y dispersan la atención. Conviene elegir pocos, relevantes y conectados con decisiones concretas.', {
        razones: ['+Porque demasiados indicadores confunden y dispersan', '-Porque los gobiernos no usan indicadores', '-Porque un solo indicador alcanza para todo'],
        d: 1,
      }),
      mult('Para seguir la salud de un arroyo, ¿qué indicadores conviene incluir? Marcá todos.', [ // e8
        '+Oxígeno disuelto en el agua',
        '+Presencia de bacterias fecales',
        '+Diversidad de pequeños invertebrados',
        '+Cantidad de descargas cloacales sin tratar',
        '-Cantidad de carteles que dicen "cuidemos el arroyo"',
      ], 'Buenos indicadores miden el estado del ecosistema y las presiones, no la comunicación.', { d: 1 }),
      det('Leé este informe de gestión y marcá lo que conviene revisar.', [ // e9
        ['Medimos el promedio diario de partículas en tres barrios.', false],
        ['Como plantamos 10.000 árboles, el bosque ya se recuperó.', true, 'Plantar no es lo mismo que sobrevivir y recuperar el ecosistema.'],
        ['Informamos los kilos de residuos por habitante para comparar con otras ciudades.', false],
        ['Premiaremos a los barrios por toneladas recicladas, sin controlar qué se entrega.', true, 'Invita a inflar el número con material que no sirve.'],
      ], 'Un buen informe elige indicadores que no se puedan maquillar fácilmente.', { d: 2 }),
      comp('Completá.', 'Una medición puntual es un [dato]; un resumen para seguir algo que importa es un [indicador]; y cuando una medida se vuelve objetivo deja de ser buena medida, según la ley de [Goodhart].', ['rumor', 'eslogan', 'Newton'], 'Tres ideas para convertir datos en información útil.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Datos confiables', 'Sensores que hay que calibrar, huecos, sesgos, metadatos y los principios FAIR.', [
      teoria('Estaciones y sensores de bajo costo', [
        'Las estaciones de referencia miden la calidad del aire con mucha precisión, pero son caras y hay pocas. Los sensores de bajo costo permiten medir en muchos lugares, pero necesitan calibrarse comparándolos con una estación de referencia: por ejemplo, algunos sensores ópticos de partículas marcan de más cuando la humedad es alta. La agencia ambiental de Estados Unidos publica guías para usar estos sensores y corregir sus lecturas.',
      ]),
      numv(3, (i) => { // e1
        const [lect, f] = [[50, 0.7], [80, 0.6], [40, 0.8]][i];
        return {
          enunciado: `Un sensor de bajo costo marca ${lect} µg/m³. La calibración con una estación de referencia indica multiplicar sus lecturas por ${f.toLocaleString('es-AR')}. ¿Cuál es el valor corregido?`,
          valor: Math.round(lect * f * 10) / 10,
          unidad: 'µg/m³',
          explicacion: `${lect} × ${f.toLocaleString('es-AR')} = ${(Math.round(lect * f * 10) / 10).toLocaleString('es-AR')} µg/m³. Sin calibrar, el sensor sobrestimaría la contaminación.`,
          ctx: `Lectura de ${lect}; factor de ${f}.`,
        };
      }, { d: 1 }),
      cad('Armá la cadena de cómo la humedad puede sesgar un sensor de partículas.', [ // e2
        'El aire está muy húmedo',
        'Las partículas absorben agua y se hinchan',
        'El sensor óptico las ve más grandes',
        'Calcula más masa de partículas de la real',
        'La lectura sobrestima la contaminación',
      ], ['La humedad hace que el sensor marque de menos siempre'], 'Conocer los sesgos de cada instrumento permite corregirlos.', { d: 3 }),
      vf('Un sensor barato sin calibrar mide igual que una estación de referencia.', false, 'Puede tener sesgos, por ejemplo con la humedad. Los sensores de bajo costo son muy útiles para ver patrones, pero necesitan calibración para dar valores confiables.', {
        razones: ['+Porque puede tener sesgos que hay que corregir', '-Porque los sensores baratos no miden nada', '-Porque las estaciones de referencia siempre se equivocan'],
        d: 1,
      }),
      teoria('Huecos, errores y sesgos', [
        'Todo conjunto de datos tiene problemas. Faltan datos cuando un sensor se apaga o se corta la conexión. Hay errores aleatorios, que suben y bajan sin patrón, y sesgos, que empujan siempre hacia el mismo lado, como medir solo junto a una avenida. Por eso importan los metadatos: dónde, cuándo, con qué instrumento y cómo se midió cada dato.',
      ]),
      numv(3, (i) => { // e3
        const [total, faltan] = [[720, 72], [744, 186], [720, 36]][i];
        return {
          enunciado: `Un sensor debía registrar ${total} lecturas horarias en un mes, pero faltan ${faltan}. ¿Qué porcentaje de los datos está completo?`,
          valor: Math.round((total - faltan) / total * 100),
          unidad: '%',
          explicacion: `(${total} − ${faltan}) ÷ ${total} × 100 = ${Math.round((total - faltan) / total * 100)} %. Muchas redes exigen un mínimo de datos completos para considerar válido un promedio.`,
          ctx: `${total} lecturas esperadas; faltan ${faltan}.`,
        };
      }, { d: 1 }),
      clas('¿Es un error aleatorio o un sesgo?', { // e4
        'Error aleatorio': ['Pequeñas variaciones entre lecturas seguidas', 'Diferencias por una ráfaga de viento momentánea'],
        'Sesgo': ['Un sensor que marca de más con alta humedad', 'Medir el aire solo junto a una avenida'],
      }, 'Los errores aleatorios se compensan al promediar; los sesgos no, hay que corregirlos.', { d: 2 }),
      op('¿Por qué importan los metadatos de un conjunto de datos?', [ // e5
        'Porque dicen dónde, cuándo y cómo se midió cada dato',
        'Porque hacen que los datos pesen menos',
        ['Porque reemplazan a los datos originales', 'No los reemplazan: los explican.'],
        'Porque solo sirven para decorar los archivos',
      ], 'Sin metadatos, un número no se puede interpretar ni comparar.', { d: 1 }),
      teoria('Datos FAIR', [
        'En 2016, un grupo de científicos propuso que los datos de investigación sean FAIR: encontrables (tienen un identificador y aparecen en buscadores), accesibles (se pueden obtener con un procedimiento claro), interoperables (usan formatos y vocabularios comunes) y reutilizables (tienen licencia y describen cómo se obtuvieron). En Argentina, el portal datos.gob.ar reúne conjuntos de datos abiertos del Estado.',
      ]),
      par('Uní cada letra de FAIR con una práctica.', [ // e6
        ['F (encontrables)', 'Tiene un identificador y aparece en buscadores de datos'],
        ['A (accesibles)', 'Se puede descargar con un procedimiento claro'],
        ['I (interoperables)', 'Usa formatos y vocabularios comunes'],
        ['R (reutilizables)', 'Tiene licencia y describe cómo se midió'],
      ], 'Datos FAIR multiplican su valor: otros pueden encontrarlos, entenderlos y usarlos.', { d: 2 }),
      rank('Para un informe oficial sobre la calidad del aire, ordená estas fuentes de la más confiable a la menos.', [ // e7
        ['Estación de referencia', 'la más confiable'],
        ['Red de sensores calibrada con una estación', 'buena'],
        ['Un sensor casero sin calibrar', 'débil'],
        ['Una foto del cielo gris', 'la menos confiable'],
      ], 'Cada fuente sirve para algo, pero no todas sostienen una decisión oficial.', { d: 1, extremos: ['Más confiable', 'Menos confiable'] }),
      mult('¿Qué controles de calidad conviene hacer a un conjunto de datos? Marcá todos.', [ // e8
        '+Revisar cuántos datos faltan',
        '+Buscar valores imposibles o extremos',
        '+Comparar con una fuente de referencia',
        '+Documentar dónde y cómo se midió',
        '-Borrar los datos que no coinciden con lo que se esperaba',
      ], 'Borrar lo que no gusta no es control de calidad: es sesgo.', { d: 2 }),
      det('Leé esta nota de un portal de datos y marcá lo que conviene revisar.', [ // e9
        ['Publicamos los datos con la fecha, el lugar y el instrumento de cada medición.', false],
        ['Eliminamos las lecturas altas porque parecían exageradas.', true, 'Hay que revisarlas y justificar cualquier descarte, no borrarlas por intuición.'],
        ['Los datos tienen licencia abierta para reutilizarlos.', false],
        ['Nuestros sensores baratos no necesitan calibración.', true, 'Sin calibración pueden tener sesgos importantes.'],
      ], 'La confianza en los datos se construye mostrando cómo se obtuvieron y se controlaron.', { d: 2 }),
      comp('Completá.', 'Comparar un sensor con una estación de referencia es [calibrarlo]; la información sobre dónde, cuándo y cómo se midió son los [metadatos]; y un error que empuja siempre hacia el mismo lado es un [sesgo].', ['pintarlo', 'rumores', 'redondeo'], 'Tres claves para confiar en un conjunto de datos.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Algoritmos que miran el planeta', 'Aprender de ejemplos, aciertos y errores, precisión y sensibilidad, e IA para anticipar crecidas.', [
      teoria('Aprender de ejemplos', [
        'Muchos sistemas actuales aprenden de ejemplos: se les muestran miles de imágenes ya clasificadas y aprenden a reconocer patrones. Así se identifican especies en fotos de ciencia ciudadana o se detectan desmontes en imágenes satelitales, como las alertas que publica Global Forest Watch. No son mágicos: dependen de los ejemplos con que aprendieron y pueden fallar con casos distintos.',
      ]),
      vf('Un algoritmo entrenado solo con fotos de aves de Europa reconoce igual de bien las aves de la Puna.', false, 'Aprende de los ejemplos que vio. Con especies, paisajes o luz muy distintos, puede equivocarse mucho. Por eso importa entrenar con datos del lugar.', {
        razones: ['+Porque solo aprende de los ejemplos que vio', '-Porque las aves de la Puna son iguales a las de Europa', '-Porque los algoritmos no pueden reconocer aves'],
        d: 1,
      }),
      teoria('Cuatro resultados posibles', [
        'Cuando un sistema de alertas de desmonte decide, pueden pasar cuatro cosas: un verdadero positivo (alerta y hubo desmonte), un falso positivo (alerta sin desmonte, por ejemplo por la sombra de una nube), un falso negativo (hubo desmonte y no hubo alerta) y un verdadero negativo (no hubo alerta ni desmonte).',
        'La precisión dice qué parte de las alertas eran ciertas: verdaderos positivos divididos por todas las alertas. La sensibilidad dice qué parte de los desmontes reales se detectaron: verdaderos positivos divididos por todos los desmontes. Si se baja el umbral para alertar, se detectan más desmontes, pero aumentan las falsas alarmas.',
      ]),
      clas('¿Qué tipo de resultado es cada caso?', { // e1
        'Verdadero positivo': ['La alerta marca un desmonte y había desmonte', 'Alerta de incendio y el foco era real'],
        'Falso positivo': ['La alerta marca un desmonte, pero era la sombra de una nube', 'Alerta de incendio por un techo de chapa caliente'],
        'Falso negativo': ['Hubo desmonte bajo las nubes y no hubo alerta', 'Un incendio pequeño que el satélite no detectó'],
      }, 'Cada tipo de error tiene costos distintos: falsas alarmas cansan; desmontes no detectados se pierden.', { d: 2 }),
      numv(3, (i) => { // e2
        const [vp, fp] = [[80, 20], [45, 15], [90, 60]][i];
        return {
          enunciado: `Un sistema emitió ${vp + fp} alertas de desmonte: ${vp} eran desmontes reales y ${fp} falsas alarmas. ¿Cuál es su precisión?`,
          valor: Math.round(vp / (vp + fp) * 100),
          unidad: '%',
          explicacion: `${vp} ÷ (${vp} + ${fp}) × 100 = ${Math.round(vp / (vp + fp) * 100)} %. La precisión dice cuánto se puede confiar en cada alerta.`,
          ctx: `${vp} alertas ciertas; ${fp} falsas.`,
        };
      }, { d: 2 }),
      numv(3, (i) => { // e3
        const [vp, fn] = [[60, 40], [90, 10], [70, 30]][i];
        return {
          enunciado: `En una región hubo ${vp + fn} desmontes. El sistema detectó ${vp} y no detectó ${fn}. ¿Cuál es su sensibilidad?`,
          valor: Math.round(vp / (vp + fn) * 100),
          unidad: '%',
          explicacion: `${vp} ÷ (${vp} + ${fn}) × 100 = ${Math.round(vp / (vp + fn) * 100)} %. La sensibilidad dice qué parte del problema real se ve.`,
          ctx: `${vp} detectados; ${fn} no detectados.`,
        };
      }, { d: 2 }),
      cad('Armá la cadena de qué pasa al bajar el umbral de un sistema de alertas.', [ // e4
        'Se baja el umbral para emitir una alerta',
        'El sistema alerta ante señales más débiles',
        'Detecta más desmontes reales',
        'Pero también aumentan las falsas alarmas',
        'Hay que elegir el equilibrio según los costos de cada error',
      ], ['Bajar el umbral elimina todas las falsas alarmas'], 'No existe un umbral perfecto: hay que decidir qué error cuesta más en cada caso.', { d: 3 }),
      op('¿Por qué conviene que una persona verifique las alertas antes de actuar?', [ // e5
        'Para descartar falsas alarmas y confirmar lo que pasa',
        'Porque los algoritmos nunca aciertan',
        ['Para que el sistema funcione más lento a propósito', 'El objetivo es evitar errores costosos, no demorar.'],
        'Porque la ley prohíbe usar satélites',
      ], 'La combinación de algoritmo y verificación humana suele dar las mejores decisiones.', { d: 2 }),
      teoria('IA para anticipar crecidas', [
        'Un estudio publicado en 2024 mostró que un modelo de inteligencia artificial podía pronosticar crecidas extremas en cuencas sin estaciones de medición, con cinco días de anticipación y una confiabilidad similar o mejor a la que un sistema global de referencia lograba para el mismo día. El modelo se incorporó a un sistema de alerta que publica pronósticos en tiempo real en más de 80 países.',
      ]),
      est('Estimá con cuántos días de anticipación el modelo de 2024 lograba pronósticos de crecidas tan confiables como los del mismo día de un sistema de referencia.', 5, { min: 0, max: 30, paso: 1, unidad: 'días' }, 'Hasta cinco días: tiempo valioso para avisar y evacuar en lugares sin estaciones de medición.', { d: 2 }),
      par('Uní cada aplicación con los datos que usa.', [ // e6
        ['Alertas de desmonte', 'Imágenes satelitales repetidas'],
        ['Identificación de especies', 'Fotos de ciencia ciudadana'],
        ['Pronóstico de crecidas', 'Lluvias, suelos y caudales históricos'],
        ['Detección de focos de incendio', 'Sensores térmicos de satélites'],
      ], 'Sin buenos datos de entrada, ningún algoritmo da buenos resultados.', { d: 1 }),
      mult('¿Qué buenas prácticas corresponden al uso de algoritmos en temas ambientales? Marcá todas.', [ // e7
        '+Informar su precisión y sensibilidad',
        '+Entrenarlos con datos de la región donde se usan',
        '+Verificar las alertas importantes en el terreno',
        '+Explicar cómo decide el sistema',
        '-Aceptar cualquier resultado porque lo dijo una computadora',
      ], 'Un algoritmo es una herramienta: hay que conocer sus límites para usarlo bien.', { d: 1 }),
      det('Leé este anuncio de una empresa de tecnología y marcá lo que conviene revisar.', [ // e8
        ['Nuestro sistema detecta desmontes con imágenes satelitales.', false],
        ['Nuestro algoritmo nunca se equivoca.', true, 'Todo sistema tiene falsos positivos y falsos negativos: hay que informarlos.'],
        ['Publicamos la precisión y la sensibilidad del sistema en cada región.', false],
        ['No hace falta verificar ninguna alerta en el terreno.', true, 'La verificación evita actuar sobre falsas alarmas.'],
      ], 'Desconfiar de las promesas perfectas es parte de usar bien la tecnología.', { d: 2 }),
      comp('Completá.', 'Una alerta que resulta falsa es un falso [positivo]; la parte de los casos reales que el sistema detecta es su [sensibilidad]; y la parte de las alertas que eran ciertas es su [precisión].', ['negativo', 'velocidad', 'belleza'], 'Tres conceptos para evaluar cualquier sistema de detección.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Tableros y alertas', 'Del número a la acción: umbrales, protocolos, el sistema de alertas del SMN y cómo diseñar un tablero útil.', [
      teoria('Del número a la acción', [
        'Un dato sirve para decidir solo si está conectado con una acción. Por eso los sistemas de alerta definen umbrales y qué hacer en cada nivel. El Sistema de Alerta Temprana del Servicio Meteorológico Nacional usa colores: amarillo ("informate": fenómenos que pueden causar daños o interrumpir actividades), naranja ("preparate": fenómenos peligrosos) y rojo ("seguí las instrucciones oficiales": fenómenos excepcionales que pueden provocar emergencias).',
        'Según la Organización Meteorológica Mundial, un sistema de alerta temprana completo tiene cuatro pilares: conocer el riesgo, observar y pronosticar, comunicar la alerta a tiempo y estar preparados para responder.',
      ]),
      par('Uní cada color de alerta del SMN con lo que pide.', [ // e1
        ['Amarillo', 'Informate'],
        ['Naranja', 'Preparate'],
        ['Rojo', 'Seguí las instrucciones oficiales'],
      ], 'Cada color está asociado a una acción: eso lo convierte en una herramienta de decisión.', { d: 1 }),
      ord('Ordená el recorrido de un dato hasta una acción en un sistema de alerta.', [ // e2
        'Los sensores miden',
        'Se controlan y validan los datos',
        'Se comparan con los umbrales acordados',
        'Se emite la alerta con recomendaciones claras',
        'Las instituciones y la población actúan',
      ], 'Si falla cualquier eslabón, la alerta no llega a salvar a nadie.', { d: 2 }),
      mult('¿Cuáles son los pilares de un sistema de alerta temprana completo? Marcá todos.', [ // e3
        '+Conocer el riesgo',
        '+Observar y pronosticar',
        '+Comunicar la alerta a tiempo',
        '+Estar preparados para responder',
        '-Tener la aplicación más moderna del mercado',
      ], 'La tecnología ayuda, pero sin conocer el riesgo y sin preparación, la alerta no alcanza.', { d: 2 }),
      numv(3, (i) => { // e4
        const [dias, total] = [[6, 30], [9, 30], [3, 30]][i];
        return {
          enunciado: `En un mes de ${total} días, el Índice de Calidad del Aire superó 100 en ${dias} días. ¿Qué porcentaje de los días superó ese umbral?`,
          valor: Math.round(dias / total * 100),
          unidad: '%',
          explicacion: `${dias} ÷ ${total} × 100 = ${Math.round(dias / total * 100)} %. Contar cuántos días se supera un umbral es un indicador simple y muy útil para un tablero.`,
          ctx: `${dias} días de ${total} sobre 100.`,
        };
      }, { d: 1 }),
      teoria('Diseñar un tablero', [
        'Un buen tablero muestra pocos indicadores clave, su tendencia en el tiempo, los umbrales a la vista y quién tiene que actuar. Se actualiza con la frecuencia necesaria y se entiende sin ser especialista. Un tablero con decenas de luces y números sin contexto no ayuda a decidir: satura.',
        'También hay que cuidar la fatiga de alertas: si se emiten demasiadas alarmas falsas o poco importantes, la gente deja de hacerles caso justo cuando más importa.',
      ]),
      clas('¿Esta característica ayuda o perjudica a un tablero de gestión?', { // e5
        'Ayuda': ['Pocos indicadores clave con su tendencia', 'Umbrales visibles y quién actúa en cada caso', 'Datos actualizados con fecha'],
        'Perjudica': ['Cuarenta números sin contexto', 'Gráficos en 3D difíciles de leer', 'Datos sin fecha ni fuente'],
      }, 'Un tablero es una herramienta para decidir, no una vidriera de datos.', { d: 1 }),
      cad('Armá la cadena de la fatiga de alertas.', [ // e6
        'Se emiten muchas alertas por eventos menores',
        'La mayoría no tiene consecuencias',
        'La gente se acostumbra y deja de prestarles atención',
        'Llega una alerta por un evento grave',
        'Muchos no reaccionan a tiempo',
      ], ['Más alertas siempre generan más atención'], 'Una alerta vale por su credibilidad: umbrales bien elegidos la protegen.', { d: 2 }),
      op('¿Por qué conviene acordar los protocolos antes de que ocurra una emergencia?', [ // e7
        'Para que cada uno sepa qué hacer sin perder tiempo',
        'Para que las alertas sean más largas y detalladas',
        ['Para no tener que medir nada durante la emergencia', 'Se sigue midiendo: el protocolo ordena la respuesta.'],
        'Porque en una emergencia no se pueden emitir alertas',
      ], 'En una emergencia no hay tiempo para discutir quién hace qué.', { d: 2 }),
      vf('Una alerta que avisa del peligro pero no dice qué hacer igual cumple bien su función.', false, 'Una buena alerta combina el aviso con recomendaciones claras y concretas. Sin eso, muchas personas no saben cómo protegerse.', {
        razones: ['+Porque sin recomendaciones claras muchas personas no saben cómo actuar', '-Porque las alertas nunca deben tener recomendaciones', '-Porque todas las personas saben siempre qué hacer'],
        d: 1,
      }),
      numv(3, (i) => { // e8
        const [llega, evac] = [[48, 12], [24, 10], [12, 8]][i];
        return {
          enunciado: `Un pronóstico anticipa que la crecida llegará en ${llega} horas, y evacuar el barrio lleva ${evac} horas. ¿Cuántas horas de margen quedan para decidir y avisar?`,
          valor: llega - evac,
          unidad: 'horas',
          explicacion: `${llega} − ${evac} = ${llega - evac} horas. Cada hora de anticipación que gana el pronóstico es tiempo para decidir, avisar y moverse.`,
          ctx: `Crecida en ${llega} h; evacuación de ${evac} h.`,
        };
      }, { d: 1 }),
      det('Leé este diseño de tablero municipal y marcá lo que conviene revisar.', [ // e9
        ['Mostrará el Índice de Calidad del Aire de cada barrio con su tendencia.', false],
        ['Tendrá 60 indicadores en la pantalla principal.', true, 'Demasiados indicadores saturan: conviene elegir pocos y clave.'],
        ['Indicará qué área actúa cuando se supera cada umbral.', false],
        ['Emitirá una alerta cada vez que un valor cambie un poco.', true, 'Genera fatiga de alertas: los umbrales tienen que ser significativos.'],
      ], 'Menos, más claro y conectado con acciones: así se diseña un tablero que sirve.', { d: 2 }),
      comp('Completá.', 'En el sistema del SMN, la alerta naranja pide [prepararse]; el valor a partir del cual se dispara una acción es un [umbral]; y cuando hay demasiadas alarmas la gente deja de prestar atención por la [fatiga] de alertas.', ['relajarse', 'promedio', 'euforia'], 'Tres ideas para que los datos lleguen a tiempo a la acción.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Datos, poder y derechos', 'El derecho a la información ambiental, el Acuerdo de Escazú, la privacidad y quién queda afuera de los datos.', [
      teoria('El derecho a saber', [
        'En Argentina, la ley 25.831 garantiza el derecho de acceso libre y gratuito a la información ambiental en manos del Estado y de empresas de servicios públicos. Cualquier persona puede pedirla sin explicar para qué, y la respuesta debe darse en un plazo máximo de 30 días hábiles. Además, Argentina ratificó en 2020 el Acuerdo de Escazú, que garantiza el acceso a la información, la participación pública y el acceso a la justicia en asuntos ambientales, y protege a quienes defienden el ambiente.',
      ], { destacado: { valor: '30 días hábiles', texto: 'es el plazo máximo para responder un pedido de información ambiental, según la ley 25.831.' } }),
      est('¿Cuál es el plazo máximo, en días hábiles, para responder un pedido de información ambiental según la ley 25.831?', 30, { min: 1, max: 120, paso: 1, unidad: 'días hábiles' }, '30 días hábiles: si no hay respuesta, se puede reclamar.', { d: 1 }),
      ord('Ordená los pasos para pedir información ambiental a un organismo público.', [ // e1
        'Identificar qué organismo tiene la información',
        'Escribir un pedido claro de lo que se busca',
        'Presentarlo y guardar la constancia',
        'Esperar la respuesta dentro del plazo legal',
        'Si no responden, reclamar por las vías previstas',
      ], 'El derecho a saber se ejerce: un pedido bien hecho es una herramienta poderosa.', { d: 1 }),
      op('¿Cuáles son los tres derechos de acceso que garantiza el Acuerdo de Escazú?', [ // e2
        'Información, participación y justicia en asuntos ambientales',
        'Internet gratis, energía gratis y transporte gratis',
        ['Solo el acceso a la información, sin participación', 'Escazú suma participación pública y acceso a la justicia.'],
        'Propiedad de la tierra, del agua y de los minerales',
      ], 'Además, Escazú es el primer tratado que protege específicamente a quienes defienden el ambiente.', { d: 2 }),
      teoria('Privacidad y datos sensibles', [
        'No todos los datos deben publicarse igual. La ley 25.326 protege los datos personales: un mapa de consumos eléctricos casa por casa, por ejemplo, puede revelar hábitos privados. También hay datos ambientales sensibles: publicar la ubicación exacta de un nido de una especie amenazada o de una planta rara puede facilitar su captura, por eso las plataformas de ciencia ciudadana suelen ocultar esas coordenadas.',
      ]),
      clas('¿Conviene publicarlo abierto o protegerlo?', { // e3
        'Publicar abierto': ['La calidad del agua de un río', 'Las emisiones de una fábrica', 'La superficie de bosque desmontada por año'],
        'Proteger': ['El consumo eléctrico de cada casa con nombre y dirección', 'La ubicación exacta del nido de un águila amenazada', 'Los datos de salud de cada vecino'],
      }, 'La regla general es abrir los datos públicos y proteger los personales y los que ponen en riesgo a especies.', { d: 2 }),
      teoria('Quién queda afuera', [
        'Los datos también pueden reproducir desigualdades. Si los sensores de aire se instalan solo en barrios céntricos, la contaminación de los barrios populares queda invisible y no entra en las decisiones. Lo mismo pasa con la brecha digital: quien no tiene buena conexión recibe menos alertas o no puede sumar sus reportes. Por eso importa preguntar dónde se mide, a quién llegan los datos y quién participa en decidir.',
      ]),
      cad('Armá la cadena de cómo dónde se mide puede generar injusticia.', [ // e4
        'Los sensores se instalan solo en barrios céntricos',
        'Los barrios junto a industrias no tienen datos',
        'La contaminación de esos barrios queda invisible',
        'Las políticas se diseñan sin considerarlos',
        'Los más expuestos siguen desprotegidos',
      ], ['Medir en el centro alcanza para conocer toda la ciudad'], 'Lo que no se mide no se ve, y lo que no se ve no se atiende.', { d: 2 }),
      numv(3, (i) => { // e5
        const [sens, hab] = [[12, 200000], [2, 400000], [6, 150000]][i];
        return {
          enunciado: `Una zona de la ciudad tiene ${sens} sensores de aire para ${hab.toLocaleString('es-AR')} habitantes. ¿Cuántos sensores hay cada 100.000 habitantes?`,
          valor: sens * 100000 / hab,
          unidad: 'sensores cada 100.000',
          explicacion: `${sens} ÷ ${hab.toLocaleString('es-AR')} × 100.000 = ${(sens * 100000 / hab).toLocaleString('es-AR')}. Comparar esta cobertura entre zonas muestra dónde faltan datos.`,
          ctx: `${sens} sensores; ${hab} habitantes.`,
        };
      }, { d: 2 }),
      vf('Si un dato es técnico y está en una computadora del Estado, la ciudadanía no tiene derecho a pedirlo.', false, 'La ley 25.831 garantiza el acceso a la información ambiental en manos del Estado, sin necesidad de explicar para qué se pide.', {
        razones: ['+Porque la ley garantiza el acceso a la información ambiental del Estado', '-Porque solo las empresas pueden pedir información', '-Porque los datos técnicos son secretos por definición'],
        d: 1,
      }),
      mult('¿Qué hace más justo un sistema de datos ambientales? Marcá todo.', [ // e6
        '+Medir también en los barrios más expuestos',
        '+Publicar los datos en formatos fáciles de usar',
        '+Enviar alertas por varios canales, no solo apps',
        '+Proteger los datos personales',
        '-Instalar sensores solo donde es más cómodo',
      ], 'Justicia en los datos es medir donde hace falta, compartir lo público y cuidar lo privado.', { d: 1 }),
      det('Leé esta respuesta de un organismo a un pedido de información y marcá lo que conviene revisar.', [ // e7
        ['Le enviamos los resultados de los análisis del agua del último año.', false],
        ['Para darle más datos, primero explíquenos para qué los quiere.', true, 'La ley 25.831 no exige justificar el pedido.'],
        ['Los datos personales de los vecinos se omitieron para proteger su privacidad.', false],
        ['Le responderemos cuando tengamos tiempo, sin plazo definido.', true, 'La ley fija un plazo máximo de 30 días hábiles.'],
      ], 'Conocer los propios derechos permite exigir respuestas completas y a tiempo.', { d: 2 }),
      comp('Completá.', 'La ley argentina de acceso a la información ambiental es la [25.831]; el tratado regional sobre información, participación y justicia ambiental es el Acuerdo de [Escazú]; y los datos personales los protege la ley [25.326].', ['24.051', 'París', '27.520'], 'Tres normas para usar los datos con derechos.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: del dato a la decisión', 'Indicadores, calidad de datos, algoritmos, tableros y alertas, y derechos, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el tablero del aire de Villa del Valle', 'Villa del Valle, con industrias en un extremo, quiere un tablero de calidad del aire con alertas para escuelas. Diseñalo con criterio.', [
      teoria('La situación', [
        'La ciudad tiene una estación de referencia en el centro y 10 sensores de bajo costo nuevos. La calibración indica multiplicar sus lecturas por 0,8. En el último mes, el sensor del barrio junto a las industrias marcó un promedio de 150 en el índice sin corregir. El municipio quiere suspender las actividades al aire libre de las escuelas cuando el índice corregido supere 150, y un funcionario propone instalar los sensores nuevos en la plaza central "porque es más fácil".',
      ]),
      num('¿Cuál es el valor corregido del sensor del barrio industrial?', 120, 'puntos del índice', '150 × 0,8 = 120: categoría dañina para grupos sensibles, pero por debajo del umbral de suspensión.', { ctx: 'Lectura de 150; factor de 0,8.', d: 1 }),
      op('Con el valor corregido de 120, ¿qué recomendación corresponde?', [ // e2
        'Cuidar a grupos sensibles, sin suspender todas las actividades',
        'Suspender todas las clases de la ciudad de inmediato',
        ['No hacer nada, porque el aire está en categoría buena', '120 es "dañina para grupos sensibles", no buena.'],
        'Ignorar el dato porque viene de un sensor de bajo costo',
      ], 'Las categorías permiten respuestas proporcionales: cuidar a quienes más riesgo tienen.', { d: 2 }),
      num('Si en 30 días el índice corregido superó 150 en 3 días, ¿qué porcentaje de los días hubo que suspender actividades?', 10, '%', '3 ÷ 30 × 100 = 10 % de los días: un indicador para el tablero y para evaluar si las medidas de la industria funcionan.', { ctx: 'Índice sobre 150 en 3 días de un mes de 30.', d: 1 }),
      op('¿Qué problema tiene instalar los sensores nuevos en la plaza central?', [ // e4
        'Los barrios más expuestos seguirían sin datos',
        'Que la plaza no tiene aire para medir',
        ['Que los sensores no funcionan al aire libre', 'Funcionan; el problema es dónde se mide.'],
        'Que en el centro nunca hay contaminación',
      ], 'La ubicación de los sensores es una decisión de justicia, no solo técnica.', { d: 2 }),
      ord('Ordená los pasos para poner en marcha el sistema.', [ // e5
        'Ubicar sensores en los barrios más expuestos y junto a escuelas',
        'Calibrarlos con la estación de referencia',
        'Acordar con las escuelas qué hacer en cada nivel del índice',
        'Publicar el tablero con datos abiertos',
        'Revisar cada seis meses la calibración y los umbrales',
      ], 'Medir bien, acordar las acciones y revisar: el ciclo completo.', { d: 3 }),
      mult('¿Qué debería mostrar el tablero? Marcá todo.', [ // e6
        '+El índice corregido de cada barrio con su color',
        '+La tendencia de los últimos días',
        '+Qué deben hacer las escuelas en cada nivel',
        '+La fecha y la fuente de cada dato',
        '-Solo el valor de la estación del centro',
      ], 'Un tablero útil muestra dónde, cuánto, desde cuándo y qué hacer.', { d: 2 }),
      det('El municipio redacta el proyecto. Marcá lo que conviene corregir.', [ // e7
        ['Los sensores se calibrarán con la estación de referencia.', false],
        ['Usaremos las lecturas de los sensores sin corregir, porque son más altas y "más prudentes".', true, 'Datos sin calibrar pueden generar alertas falsas y fatiga de alertas.'],
        ['Los datos se publicarán en formato abierto.', false],
        ['Solo se avisará a las escuelas por una aplicación de celular.', true, 'Conviene usar varios canales para que la alerta llegue a todos.'],
      ], 'Un buen sistema combina datos confiables, acciones acordadas y comunicación que llega a todos.', { d: 3 }),
    ]),
  ],
});
