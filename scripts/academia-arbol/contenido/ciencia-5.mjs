import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// CIENCIA 5 — Modelos, incertidumbre y escenarios.
// Qué es un modelo y cómo se prueba, cómo se expresa la incertidumbre, por qué
// se puede proyectar el clima aunque no se pueda pronosticar el tiempo a un
// mes, qué es un escenario y cómo decidir cuando el futuro es incierto.
// Retoma el método científico y la medición (ciencia-1), los gráficos y las
// tendencias (ciencia-2), el clima que cambia (aire-suelo-4) y medir para
// entender (tronco-2).

export default unidad({
  slug: 'ciencia-5',
  rama: 'ciencia',
  orden: 5,
  nivel: 3,
  requiereTronco: 3,
  titulo: 'Modelos, incertidumbre y escenarios',
  bajada: 'Cómo funcionan los modelos, qué quiere decir "muy probable", por qué el clima se puede proyectar aunque el tiempo no, y cómo decidir sin certezas.',
  objetivos: [
    'Explicar qué es un modelo, sus partes y cómo se pone a prueba',
    'Interpretar rangos, probabilidades y el lenguaje calibrado del IPCC',
    'Distinguir un pronóstico del tiempo de una proyección climática',
    'Leer escenarios como exploraciones del futuro y no como predicciones',
    'Tomar decisiones robustas con riesgo, recurrencia y el principio precautorio',
  ],
  repasa: ['ciencia-1', 'ciencia-2', 'aire-suelo-4', 'tronco-2'],
  fuentes: ['ipcc-ar6', 'ipcc-incertidumbre', 'hausfather-2020', 'zhang-2019-predictibilidad', 'lorenz-1963', 'hawkins-sutton-2009', 'ley-25675-ambiente'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Qué es un modelo', 'Maquetas, diagramas y ecuaciones: representaciones simplificadas que sirven para entender y anticipar.', [
      teoria('Un mapa no es el territorio', [
        'Un modelo es una representación simplificada de una parte de la realidad, hecha para entenderla o anticipar qué va a pasar. Hay modelos físicos, como una maqueta de una cuenca con arena y agua; conceptuales, como el diagrama del ciclo del agua; y matemáticos, como las ecuaciones que una computadora resuelve paso a paso para simular el clima o el crecimiento de una población.',
        'Ningún modelo incluye todo, y eso no es un defecto: un mapa con todos los detalles del territorio sería tan grande como el territorio. Al estadístico George Box se le atribuye una frase famosa: "todos los modelos están equivocados, pero algunos son útiles".',
      ]),
      clas('¿Qué tipo de modelo es cada uno?', { // e1
        'Físico': ['Maqueta de una cuenca con arena y agua', 'Túnel de viento con un edificio a escala'],
        'Conceptual': ['Diagrama del ciclo del agua', 'Esquema de una red trófica'],
        'Matemático': ['Ecuación del crecimiento de una población', 'Programa que simula el clima'],
      }, 'Los tres tipos simplifican la realidad; cambian el material y la precisión con que lo hacen.', { d: 1 }),
      op('¿Qué quiere decir la frase atribuida a George Box sobre los modelos?', [ // e2
        'Que simplifican, pero bien hechos sirven para decidir',
        'Que los modelos no sirven porque siempre fallan',
        ['Que solo son útiles los modelos que no tienen errores', 'Ninguno es perfecto: la utilidad depende de para qué se lo usa.'],
        'Que conviene elegir el modelo que da el resultado esperado',
      ], 'Un modelo no se juzga por ser "verdadero", sino por si responde bien la pregunta para la que se hizo.', { d: 2 }),
      teoria('Entradas, reglas y salidas', [
        'Todo modelo tiene entradas (datos y supuestos de partida), reglas que relacionan las variables, parámetros que ajustan esas reglas y salidas (los resultados). Un ejemplo muy simple es un tanque: el nivel de mañana es el nivel de hoy, más lo que entra, menos lo que sale. Aplicando esa regla día tras día, el modelo "simula" cómo cambia el nivel. Los modelos del clima hacen algo parecido con el aire, el agua y la energía, en millones de celdas y con reglas de la física.',
      ]),
      numv(3, (i) => { // e3
        const [inicial, entra, sale, dias] = [[100, 20, 30, 5], [200, 15, 40, 4], [80, 25, 10, 6]][i];
        const final = inicial + (entra - sale) * dias;
        return {
          enunciado: `Un tanque tiene ${inicial} litros. Cada día entran ${entra} litros y salen ${sale}. Con la regla "nivel de mañana = nivel de hoy + entrada − salida", ¿cuántos litros tendrá después de ${dias} días?`,
          valor: final,
          unidad: 'litros',
          explicacion: `Cada día cambia ${entra} − ${sale} = ${entra - sale} litros; en ${dias} días, ${(entra - sale) * dias}. ${inicial} ${entra - sale >= 0 ? '+' : '−'} ${Math.abs((entra - sale) * dias)} = ${final} litros. Así funciona, en pequeño, cualquier modelo que avanza paso a paso.`,
          ctx: `${inicial} L iniciales; entran ${entra} y salen ${sale} por día; ${dias} días.`,
        };
      }, { d: 1 }),
      par('En un modelo de la población de guanacos de un parque, uní cada parte con su ejemplo.', [ // e4
        ['Entrada', 'Cantidad inicial de guanacos'],
        ['Parámetro', 'Tasa de nacimientos por año'],
        ['Regla', 'Población siguiente = actual + nacimientos − muertes'],
        ['Salida', 'Población estimada dentro de diez años'],
      ], 'Reconocer las partes de un modelo ayuda a entender qué supuestos pueden cambiar sus resultados.', { d: 2 }),
      numv(3, (i) => { // e5
        const [pob, tasa, anios] = [[1000, 10, 2], [500, 20, 2], [2000, 5, 2]][i];
        const final = Math.round(pob * (1 + tasa / 100) ** anios * 10) / 10;
        return {
          enunciado: `Un modelo supone que una población de ${pob.toLocaleString('es-AR')} animales crece un ${tasa} % por año. ¿Cuántos animales habrá después de ${anios} años?`,
          valor: final,
          unidad: 'animales',
          dec: final % 1 === 0 ? 0 : 1,
          explicacion: `${pob.toLocaleString('es-AR')} × ${(1 + tasa / 100).toLocaleString('es-AR')} × ${(1 + tasa / 100).toLocaleString('es-AR')} = ${final.toLocaleString('es-AR')}. El crecimiento se aplica sobre la población de cada año, no sobre la inicial: por eso no da ${(pob + pob * tasa / 100 * anios).toLocaleString('es-AR')}.`,
          ctx: `${pob} animales; crecimiento del ${tasa} % anual; ${anios} años.`,
        };
      }, { d: 2 }),
      vf('Un modelo que no incluye todos los detalles de la realidad no sirve para nada.', false, 'Todos los modelos simplifican. Lo importante es que incluyan lo que pesa para la pregunta y que se pongan a prueba con datos reales.', {
        razones: ['+Porque todos simplifican y pueden ser útiles igual', '-Porque los buenos modelos incluyen absolutamente todo', '-Porque los modelos no se usan en ciencia'],
        d: 1,
      }),
      teoria('Poner a prueba un modelo', [
        'Un modelo gana confianza cuando reproduce datos que no se usaron para construirlo. Por ejemplo, se lo arma con datos hasta cierto año y se comprueba si "anticipa" lo que pasó después. Con los modelos del clima se hizo esa prueba: un estudio de 2020 comparó las proyecciones publicadas entre 1970 y 2007 con lo que efectivamente ocurrió, y encontró que la mayoría había anticipado bien el calentamiento, sobre todo al corregir las diferencias entre las emisiones que suponían y las que realmente hubo.',
      ]),
      cad('Armá la cadena de cómo se pone a prueba un modelo.', [ // e6
        'Se construye el modelo con datos de un período',
        'Se lo corre para un período posterior sin mirar esos datos',
        'Se comparan sus resultados con lo que pasó',
        'Si coinciden, el modelo gana confianza',
        'Se lo usa con más seguridad para anticipar el futuro',
      ], ['Se ajusta el modelo hasta que dé el resultado deseado'], 'Probar un modelo con datos que "no vio" es como tomar un examen sin conocer las preguntas.', { d: 2 }),
      mult('¿Qué hace más confiable a un modelo? Marcá todo.', [ // e7
        '+Reproduce datos que no se usaron para construirlo',
        '+Sus reglas se basan en leyes físicas conocidas',
        '+Sus supuestos y su código son públicos',
        '+Equipos distintos llegan a resultados parecidos',
        '-Lo hizo una persona famosa',
      ], 'La confianza en un modelo se gana con pruebas, transparencia y réplica, no con prestigio.', { d: 1 }),
      ord('Ordená los pasos para construir un modelo.', [ // e8
        'Definir la pregunta que se quiere responder',
        'Elegir qué incluir y qué dejar afuera',
        'Escribir las reglas que relacionan las variables',
        'Comparar los resultados con datos reales',
        'Ajustar y volver a probar',
      ], 'La pregunta define el modelo: no existe un modelo bueno para todo.', { d: 2 }),
      det('Leé este comentario en un foro y marcá lo equivocado.', [ // e9
        ['Los modelos climáticos se basan en leyes de la física.', false],
        ['Si un modelo simplifica algo, entonces todos sus resultados son falsos.', true, 'Todos los modelos simplifican; se los evalúa por cómo reproducen datos reales.'],
        ['Los modelos de los años 70 y 80 anticiparon bien buena parte del calentamiento.', false],
        ['Un modelo es confiable si lo publicó alguien importante.', true, 'La confianza viene de las pruebas y la transparencia, no del prestigio.'],
      ], 'Criticar un modelo con fundamento es mirar sus supuestos y sus pruebas.', { d: 2 }),
      comp('Completá.', 'Un modelo es una representación [simplificada] de la realidad; lo que se le da al modelo para empezar son sus [entradas]; y se lo pone a prueba comparando sus resultados con [datos] reales.', ['completa', 'salidas', 'opiniones'], 'Tres ideas para entender cualquier modelo.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Incertidumbre no es ignorancia', 'Rangos, probabilidades y el lenguaje calibrado del IPCC: decir cuánto sabemos y cuánto no.', [
      teoria('Rangos', [
        'Un resultado científico serio suele venir con un rango: "entre 2,1 y 3,5 °C" dice lo más probable y también cuánto podría variar. La incertidumbre tiene varias fuentes: los errores de medición, la variabilidad natural, las simplificaciones de los modelos y las decisiones humanas futuras. Que haya incertidumbre no significa que no se sepa nada: significa que se sabe con cierta precisión, y que esa precisión se informa.',
      ]),
      op('Un informe dice que el calentamiento será "de 2,1 a 3,5 °C, con 2,7 °C como mejor estimación". ¿Cómo se interpreta?', [ // e1
        'Lo más probable es 2,7 °C, y el valor real estaría en ese rango',
        'Que los científicos no saben nada sobre el calentamiento',
        ['Que el calentamiento será exactamente de 2,7 °C', 'El rango indica que puede ser algo menor o mayor.'],
        'Que conviene quedarse con el valor más bajo, que es el seguro',
      ], 'Un rango informa a la vez lo que se sabe y cuánto se sabe.', { d: 2 }),
      mult('¿Cuáles son fuentes de incertidumbre en una proyección climática? Marcá todas.', [ // e2
        '+La variabilidad natural, como El Niño',
        '+Los errores de medición',
        '+Las simplificaciones de los modelos',
        '+Cuánto va a emitir la humanidad',
        '-Que los científicos no se ponen de acuerdo en nada',
      ], 'Conocer las fuentes de incertidumbre permite saber cuáles se pueden reducir y cuáles no.', { d: 1 }),
      teoria('Un lenguaje calibrado', [
        'Para que "probable" signifique lo mismo en todos sus informes, el IPCC usa términos con probabilidades definidas: prácticamente seguro (99 a 100 %), muy probable (90 a 100 %), probable (66 a 100 %), tan probable como improbable (33 a 66 %), improbable (0 a 33 %), muy improbable (0 a 10 %) y excepcionalmente improbable (0 a 1 %).',
        'Aparte, informa su nivel de confianza (bajo, medio, alto o muy alto), que resume cuánta evidencia hay y cuánto coinciden los estudios.',
      ], {
        datos: tabla('Términos de probabilidad del IPCC', ['Término', 'Probabilidad'], [
          ['Prácticamente seguro', '99 a 100 %'],
          ['Muy probable', '90 a 100 %'],
          ['Probable', '66 a 100 %'],
          ['Tan probable como improbable', '33 a 66 %'],
          ['Improbable', '0 a 33 %'],
          ['Muy improbable', '0 a 10 %'],
        ], 'Nota orientativa del IPCC sobre el tratamiento de las incertidumbres.'),
      }),
      par('Uní cada término del IPCC con su probabilidad.', [ // e3
        ['Prácticamente seguro', '99 a 100 %'],
        ['Muy probable', '90 a 100 %'],
        ['Probable', '66 a 100 %'],
        ['Improbable', '0 a 33 %'],
      ], 'Con un lenguaje calibrado, "probable" deja de ser una opinión y pasa a ser un rango de probabilidad.', { d: 2 }),
      rank('Ordená estos términos del más probable al menos probable.', [ // e4
        ['Prácticamente seguro', '99 a 100 %'],
        ['Muy probable', '90 a 100 %'],
        ['Tan probable como improbable', '33 a 66 %'],
        ['Muy improbable', '0 a 10 %'],
      ], 'Leer bien estos términos evita exagerar o minimizar lo que dice un informe.', { d: 1, extremos: ['Más probable', 'Menos probable'] }),
      clas('¿La frase habla de probabilidad o de nivel de confianza?', { // e5
        'Probabilidad': ['Es muy probable que las olas de calor sean más frecuentes', 'Es improbable que el calentamiento se detenga solo'],
        'Nivel de confianza': ['Con confianza alta, por la cantidad de evidencia', 'Con confianza baja, porque hay pocos estudios'],
      }, 'La probabilidad dice cuán posible es un resultado; la confianza, cuán sólida es la evidencia.', { d: 3 }),
      teoria('La probabilidad de lluvia', [
        'Cuando el pronóstico dice "70 % de probabilidad de lluvia", no significa que lloverá el 70 % del día ni sobre el 70 % de la ciudad. Significa que, en situaciones como esa, llueve en unas 7 de cada 10. Para calcularla, los servicios meteorológicos corren su modelo muchas veces con pequeñas variaciones en el punto de partida (un "ensamble"), y cuentan en cuántas corridas llueve.',
      ]),
      numv(3, (i) => { // e6
        const [llueve, total] = [[35, 50], [12, 40], [45, 60]][i];
        return {
          enunciado: `Un servicio meteorológico corre su modelo ${total} veces con pequeñas variaciones. En ${llueve} corridas llueve en tu ciudad. ¿Qué probabilidad de lluvia pronostica?`,
          valor: Math.round(llueve / total * 100),
          unidad: '%',
          explicacion: `${llueve} ÷ ${total} × 100 = ${Math.round(llueve / total * 100)} %. La probabilidad sale de contar cuántas versiones posibles del futuro traen lluvia.`,
          ctx: `${llueve} corridas con lluvia de ${total}.`,
        };
      }, { d: 1 }),
      vf('Un 70 % de probabilidad de lluvia significa que va a llover durante el 70 % del día.', false, 'Significa que, en situaciones como esa, llueve en unas 7 de cada 10. Puede llover 10 minutos o todo el día.', {
        razones: ['+Porque indica en cuántas de cada 10 situaciones parecidas llueve', '-Porque indica el 70 % de los milímetros del mes', '-Porque indica que llueve en el 70 % de las casas'],
        d: 2,
      }),
      numv(3, (i) => { // e7
        const [prob, dias] = [[30, 10], [70, 20], [20, 50]][i];
        return {
          enunciado: `Durante ${dias} días distintos, el pronóstico dijo "${prob} % de probabilidad de lluvia". Si el pronóstico está bien calibrado, ¿en cuántos de esos días debería haber llovido?`,
          valor: prob * dias / 100,
          unidad: 'días',
          explicacion: `${dias} × ${prob} % = ${prob * dias / 100} días. Así se evalúa un pronóstico probabilístico: no por un día suelto, sino por si sus porcentajes se cumplen en muchos días.`,
          ctx: `${dias} días con ${prob} % de probabilidad de lluvia.`,
        };
      }, { d: 2 }),
      cad('Armá la cadena de cómo se calcula una probabilidad de lluvia.', [ // e8
        'El estado inicial de la atmósfera se mide con pequeños errores',
        'Se corre el modelo muchas veces con variaciones mínimas',
        'Cada corrida da un resultado algo distinto',
        'Se cuenta en cuántas corridas llueve',
        'Esa proporción es la probabilidad pronosticada',
      ], ['Una sola corrida alcanza para conocer la probabilidad'], 'La incertidumbre no se esconde: se mide corriendo muchas versiones posibles.', { d: 2 }),
      det('Leé este titular y su bajada, y marcá lo que interpreta mal la ciencia.', [ // e9
        ['El IPCC dice que es muy probable que aumenten las olas de calor.', false],
        ['Como es "solo probable", no hay que preocuparse.', true, '"Muy probable" significa 90 a 100 % de probabilidad.'],
        ['El informe da un rango de valores y una mejor estimación.', false],
        ['Si hay incertidumbre, los científicos no saben nada del tema.', true, 'La incertidumbre se mide e informa; no es ignorancia.'],
      ], 'Leer bien la incertidumbre es tan importante como leer el dato.', { d: 2 }),
      comp('Completá.', 'Para el IPCC, "muy probable" significa entre [90] y 100 % de probabilidad; el nivel de [confianza] resume cuánta evidencia hay; y un conjunto de corridas de un modelo con pequeñas variaciones es un [ensamble].', ['50', 'certeza', 'promedio'], 'Tres claves para leer bien la incertidumbre.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('El tiempo y el clima', 'Por qué no se puede pronosticar la lluvia de dentro de dos meses, pero sí proyectar el clima de 2080.', [
      teoria('El efecto mariposa', [
        'En 1963, el meteorólogo Edward Lorenz descubrió que en sistemas como la atmósfera, diferencias minúsculas en el punto de partida crecen hasta cambiar por completo el resultado: es el "efecto mariposa". Como siempre medimos el estado del aire con algún error, ese error crece con los días. Un estudio de 2019 estimó que el límite último para pronosticar el tiempo día a día en latitudes medias ronda las dos semanas, y que los pronósticos actuales son útiles hasta unos 9 o 10 días.',
      ]),
      cad('Armá la cadena de por qué el pronóstico del tiempo tiene un límite.', [ // e1
        'Hay un error mínimo al medir el estado inicial del aire',
        'El modelo avanza día a día',
        'El error crece con cada paso',
        'Después de unas dos semanas, el error es tan grande como la señal',
        'El pronóstico de cada día deja de ser útil',
      ], ['Con más días de simulación el error se achica'], 'No es que falten computadoras: es una propiedad de la atmósfera.', { d: 2 }),
      numv(3, (i) => { // e2
        const [cada, dias] = [[2, 10], [3, 12], [1, 6]][i];
        return {
          enunciado: `Si el error de un pronóstico se duplica cada ${cada} ${cada === 1 ? 'día' : 'días'}, ¿cuántas veces más grande es después de ${dias} días?`,
          valor: 2 ** (dias / cada),
          unidad: 'veces',
          explicacion: `${dias} ÷ ${cada} = ${dias / cada} duplicaciones; 2 elevado a ${dias / cada} = ${2 ** (dias / cada)}. Un error que se duplica crece muy rápido: por eso el pronóstico diario tiene un límite.`,
          ctx: `Se duplica cada ${cada} días; ${dias} días.`,
        };
      }, { d: 2 }),
      est('Estimá, en días, el límite último para pronosticar el tiempo día a día en latitudes medias.', 14, { min: 1, max: 60, paso: 1, unidad: 'días' }, 'Unas dos semanas, según el estudio de 2019; los pronósticos actuales son útiles hasta 9 o 10 días.', { d: 2 }),
      teoria('¿Y cómo se proyecta el clima de 2080?', [
        'El clima no es el tiempo de un día, sino sus promedios y extremos a lo largo de unos 30 años. Esos promedios no dependen del detalle de cada tormenta, sino del balance de energía del planeta: cuánto CO₂ y otros gases hay, cuántos aerosoles, cómo varía el Sol. Pasa como con un dado: no se puede saber qué número va a salir en una tirada, pero sí cómo se reparten mil tiradas, y si alguien carga el dado, se puede anticipar que va a salir más seguido un número alto.',
        'Por eso hoy nadie sabe si lloverá el 15 de enero, pero sí que enero será más caluroso que julio en Buenos Aires.',
      ]),
      clas('¿Es un pronóstico del tiempo o una proyección climática?', { // e3
        'Pronóstico del tiempo': ['Mañana llueve en Rosario por la tarde', 'El sábado habrá viento sur fuerte', 'Esta semana bajan las temperaturas'],
        'Proyección climática': ['Hacia fin de siglo habrá más olas de calor en el norte', 'Las lluvias intensas serán más frecuentes', 'Los inviernos de 2080 serán más templados que los actuales'],
      }, 'El tiempo es el día a día; el clima, el patrón de muchos años.', { d: 1 }),
      op('¿Por qué se puede proyectar el clima de 2080 si no se puede pronosticar el tiempo de dentro de dos meses?', [ // e4
        'El clima es un promedio que depende del balance de energía',
        'Porque los modelos del clima son más grandes que los del tiempo',
        ['Porque en 2080 la atmósfera ya no va a ser caótica', 'Seguirá siendo caótica; lo que se proyecta son promedios, no días.'],
        'Porque las proyecciones climáticas se hacen adivinando',
      ], 'Como con el dado cargado: no sabemos cada tirada, pero sí hacia dónde se inclinan los resultados.', { d: 3 }),
      vf('Si no se puede pronosticar el tiempo a un mes, tampoco se puede proyectar el clima a 50 años.', false, 'Son problemas distintos: el tiempo depende del estado inicial, que se vuelve impredecible; el clima depende del balance de energía, que se puede calcular.', {
        razones: ['+Porque el clima depende del balance de energía, no de cada día', '-Porque las proyecciones a 50 años son siempre más precisas que las de mañana', '-Porque el clima no cambia en 50 años'],
        d: 2,
      }),
      par('Uní cada pronóstico con su horizonte útil aproximado.', [ // e5
        ['Chaparrón en tu barrio', 'Horas a un par de días'],
        ['Llegada de un frente frío', 'Hasta una o dos semanas'],
        ['Trimestre más lluvioso o más seco que lo normal', 'Algunos meses, en probabilidades'],
        ['Tendencia del calentamiento global', 'Décadas'],
      ], 'Cada escala de tiempo tiene su tipo de pronóstico y su forma de expresar la incertidumbre.', { d: 2 }),
      mult('¿De qué dependen las proyecciones climáticas de largo plazo? Marcá todo.', [ // e6
        '+La concentración de gases de efecto invernadero',
        '+La cantidad de aerosoles en el aire',
        '+Los cambios en la actividad del Sol',
        '+La respuesta de océanos, hielos y nubes',
        '-El tiempo exacto del 15 de marzo de 2090',
      ], 'Las proyecciones responden a lo que cambia la energía del sistema, no a los detalles de un día.', { d: 2 }),
      teoria('Los modelos que acertaron', [
        'El estudio de 2020 que comparó 17 proyecciones publicadas entre 1970 y 2007 con lo observado encontró que la mayoría anticipó bien el calentamiento posterior. Cuando no coincidían, muchas veces era porque habían supuesto emisiones distintas de las que efectivamente hubo: el modelo estaba bien, pero el escenario de entrada no. Esa distinción entre la física del modelo y los supuestos sobre el futuro lleva a la próxima lección: los escenarios.',
      ]),
      op('¿Qué explicaba muchas de las diferencias entre modelos viejos y lo observado?', [ // e7
        'Que supusieron emisiones distintas de las que hubo',
        'Que los modelos tenían la física al revés',
        ['Que los termómetros de 1970 no funcionaban', 'Las mediciones eran buenas; lo que cambió fue lo que se emitió.'],
        'Que el calentamiento se detuvo en los años 80',
      ], 'Un modelo puede tener buena física y un mal supuesto de entrada: hay que evaluarlos por separado.', { d: 3 }),
      det('Leé esta discusión de sobremesa y marcá lo equivocado.', [ // e8
        ['El tiempo es caótico y por eso los pronósticos tienen un límite.', false],
        ['Si el pronóstico falla para el domingo, los modelos del clima también fallan.', true, 'Son problemas distintos: día a día contra promedios de décadas.'],
        ['Enero es más caluroso que julio en Buenos Aires aunque no sepamos el tiempo de cada día.', false],
        ['Los modelos climáticos de los 80 no acertaron nada.', true, 'La mayoría anticipó bien el calentamiento, según el estudio de 2020.'],
      ], 'Separar tiempo de clima desarma una de las confusiones más comunes.', { d: 2 }),
      comp('Completá.', 'La sensibilidad del tiempo a pequeñas diferencias iniciales es el efecto [mariposa]; el límite del pronóstico diario ronda las dos [semanas]; y el clima describe promedios y extremos de unos [30] años.', ['dominó', 'horas', '3'], 'Tres ideas para distinguir tiempo y clima.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Escenarios', 'Qué pasaría si: los escenarios del IPCC, qué significa su nombre y por qué no son predicciones.', [
      teoria('Qué pasaría si', [
        'El clima del futuro depende de algo que ningún modelo puede calcular: cuánto van a emitir las sociedades. Por eso se usan escenarios, historias coherentes sobre el futuro que permiten explorar sus consecuencias. Un escenario no es una predicción, y en general no se le asigna una probabilidad: sirve para responder "qué pasaría si".',
        'El IPCC usa cinco escenarios principales. Su nombre combina un tipo de desarrollo socioeconómico (del SSP1, centrado en la sostenibilidad, al SSP5, basado en combustibles fósiles) con el forzamiento radiativo hacia 2100, en vatios por metro cuadrado: el número después del guion.',
      ], {
        datos: tabla('Calentamiento proyectado para 2081-2100 respecto de 1850-1900', ['Escenario', 'Mejor estimación', 'Rango muy probable'], [
          ['SSP1-1.9 (emisiones muy bajas)', '1,4 °C', '1,0 a 1,8 °C'],
          ['SSP1-2.6 (bajas)', '1,8 °C', '1,3 a 2,4 °C'],
          ['SSP2-4.5 (intermedias)', '2,7 °C', '2,1 a 3,5 °C'],
          ['SSP3-7.0 (altas)', '3,6 °C', '2,8 a 4,6 °C'],
          ['SSP5-8.5 (muy altas)', '4,4 °C', '3,3 a 5,7 °C'],
        ], 'IPCC, Sexto Informe de Evaluación, Grupo de Trabajo I.'),
      }),
      vf('Un escenario climático es una predicción de lo que va a pasar.', false, 'Es una exploración de "qué pasaría si" la humanidad sigue cierto camino. Lo que ocurra depende de decisiones que todavía no se tomaron.', {
        razones: ['+Porque explora futuros posibles que dependen de decisiones', '-Porque los escenarios se inventan sin datos', '-Porque solo existe un escenario posible'],
        d: 1,
      }),
      rank('Ordená estos escenarios del IPCC del menor al mayor calentamiento proyectado.', [ // e1
        ['SSP1-1.9', '1,4 °C'],
        ['SSP1-2.6', '1,8 °C'],
        ['SSP2-4.5', '2,7 °C'],
        ['SSP5-8.5', '4,4 °C'],
      ], 'La diferencia entre el primero y el último son decisiones humanas, no incertidumbre de la física.', { d: 2, extremos: ['Menor calentamiento', 'Mayor calentamiento'] }),
      op('¿Qué indica el "4.5" en el nombre del escenario SSP2-4.5?', [ // e2
        'El forzamiento radiativo hacia 2100, en W/m²',
        'Los grados que se calentará el planeta en 2100',
        ['El año en que empieza el escenario', 'No es un año: es un nivel de forzamiento en vatios por metro cuadrado.'],
        'La cantidad de países que lo aprobaron',
      ], 'No hay que confundirlo con la temperatura: el SSP2-4.5 lleva a unos 2,7 °C.', { d: 3 }),
      numv(3, (i) => { // e3
        const [a, b, na, nb] = [[4.4, 1.8, 'SSP5-8.5', 'SSP1-2.6'], [3.6, 2.7, 'SSP3-7.0', 'SSP2-4.5'], [2.7, 1.4, 'SSP2-4.5', 'SSP1-1.9']][i];
        const dif = Math.round((a - b) * 10) / 10;
        return {
          enunciado: `Según el IPCC, la mejor estimación de calentamiento para fin de siglo es de ${a.toLocaleString('es-AR')} °C en el escenario ${na} y de ${b.toLocaleString('es-AR')} °C en el ${nb}. ¿Cuántos grados de diferencia hay?`,
          valor: dif,
          unidad: '°C',
          dec: 1,
          tol: 0.1,
          explicacion: `${a.toLocaleString('es-AR')} − ${b.toLocaleString('es-AR')} = ${dif.toLocaleString('es-AR')} °C. Esa diferencia depende de las emisiones que decidamos, no de la física del modelo.`,
          ctx: `${na}: ${a} °C; ${nb}: ${b} °C.`,
        };
      }, { d: 1 }),
      par('Uní cada escenario con su descripción.', [ // e4
        ['SSP1-1.9', 'Emisiones que bajan muy rápido hasta cero neto a mitad de siglo'],
        ['SSP2-4.5', 'Emisiones que se mantienen parecidas hasta mitad de siglo y después bajan'],
        ['SSP3-7.0', 'Rivalidad entre regiones y emisiones que siguen creciendo'],
        ['SSP5-8.5', 'Desarrollo muy intensivo en combustibles fósiles'],
      ], 'Cada escenario es una historia completa sobre economía, población, tecnología y energía.', { d: 3 }),
      est('Estimá la mejor estimación de calentamiento del escenario intermedio SSP2-4.5 para fin de siglo.', 2.7, { min: 0, max: 6, paso: 0.1, unidad: '°C' }, 'Unos 2,7 °C según el IPCC, con un rango muy probable de 2,1 a 3,5 °C.', { d: 2 }),
      teoria('Qué incertidumbre pesa más', [
        'No todas las incertidumbres pesan igual en el tiempo. Para la próxima década, pesan mucho la variabilidad natural, como El Niño y La Niña, y las diferencias entre modelos. Hacia fin de siglo, en cambio, la mayor incertidumbre sobre la temperatura global es cuánto vamos a emitir: es decir, qué escenario sigamos. Por eso el futuro lejano del clima es, sobre todo, una decisión.',
      ]),
      clas('¿Esta incertidumbre pesa más en la próxima década o hacia 2100?', { // e5
        'Pesa más en la próxima década': ['Si en un año hay El Niño o La Niña', 'Si ocurre una gran erupción volcánica'],
        'Pesa más hacia 2100': ['Cuánto emita la humanidad en las próximas décadas', 'Qué camino de desarrollo siga el mundo'],
      }, 'La incertidumbre de largo plazo es sobre todo humana: por eso se trabaja con escenarios.', { d: 3 }),
      mult('¿Qué es un buen uso de los escenarios? Marcá todo.', [ // e6
        '+Comparar varios escenarios contrastantes',
        '+Explicar los supuestos de cada uno',
        '+Mostrar los rangos de incertidumbre',
        '+Actualizarlos cuando hay datos nuevos',
        '-Elegir solo el que conviene al argumento',
      ], 'Los escenarios sirven para pensar el futuro con honestidad, no para elegir el que más asusta o el que más tranquiliza.', { d: 1 }),
      det('Leé esta nota periodística y marcá lo que interpreta mal los escenarios.', [ // e7
        ['El IPCC compara varios escenarios de emisiones.', false],
        ['Los científicos predicen que en 2100 hará 4,4 °C más.', true, 'Es el escenario de emisiones muy altas, no una predicción.'],
        ['En el escenario de emisiones muy bajas, el calentamiento sería de unos 1,4 °C.', false],
        ['Como hay varios escenarios, los científicos no saben qué va a pasar y no sirven.', true, 'Muestran cómo el resultado depende de nuestras decisiones: eso es justamente lo útil.'],
      ], 'Un escenario leído como predicción desinforma, tanto si exagera como si minimiza.', { d: 2 }),
      comp('Completá.', 'Un escenario explora qué pasaría [si] la sociedad sigue cierto camino; en el nombre SSP2-4.5, el 4.5 es el [forzamiento] radiativo hacia 2100; y hacia fin de siglo, la mayor incertidumbre es cuánto vamos a [emitir].', ['cuando', 'calentamiento', 'medir'], 'Tres ideas para leer escenarios sin confundirlos con predicciones.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Decidir sin certezas', 'Riesgo, crecidas "de 100 años", el principio precautorio y decisiones que funcionan en muchos futuros.', [
      teoria('Probabilidad por impacto', [
        'Para decidir no alcanza con saber qué tan probable es algo: también importa cuánto daño haría. Una forma simple de combinarlos es multiplicar la probabilidad anual por el daño: da la pérdida esperada por año. Un evento raro pero catastrófico puede pesar más que uno frecuente pero chico.',
      ]),
      numv(3, (i) => { // e1
        const [prob, dano] = [[1, 50000000], [10, 2000000], [2, 30000000]][i];
        return {
          enunciado: `Un evento tiene un ${prob} % de probabilidad por año y, si ocurre, causa daños por ${dano.toLocaleString('es-AR')} dólares. ¿Cuál es la pérdida esperada por año?`,
          valor: dano * prob / 100,
          unidad: 'dólares por año',
          explicacion: `${dano.toLocaleString('es-AR')} × ${prob} % = ${(dano * prob / 100).toLocaleString('es-AR')} dólares por año. Es lo que, en promedio, cuesta ese riesgo cada año.`,
          ctx: `${prob} % anual; daños de ${dano} dólares.`,
        };
      }, { d: 1 }),
      rank('Ordená estos riesgos de un municipio por su pérdida esperada anual, de mayor a menor.', [ // e2
        ['Inundación: 2 % por año, 40 millones de dólares', '800.000'],
        ['Incendio forestal: 5 % por año, 10 millones', '500.000'],
        ['Granizo: 20 % por año, 1 millón', '200.000'],
        ['Tormenta de viento: 10 % por año, 500.000', '50.000'],
      ], 'El evento más frecuente no siempre es el más costoso: hay que multiplicar probabilidad por daño.', { d: 3, extremos: ['Mayor pérdida esperada', 'Menor pérdida esperada'] }),
      teoria('La crecida "de 100 años"', [
        'Una crecida de 100 años de recurrencia no pasa una vez por siglo: tiene un 1 % de probabilidad de ocurrir cada año, y puede repetirse dos años seguidos. La probabilidad de que ocurra al menos una vez en N años es 1 − 0,99^N. En 30 años, es de alrededor del 26 %: más de una chance en cuatro durante una hipoteca típica.',
      ]),
      numv(3, (i) => { // e3
        const [p, n] = [[1, 30], [1, 50], [2, 25]][i];
        const res = Math.round((1 - (1 - p / 100) ** n) * 100);
        return {
          enunciado: `Una crecida tiene un ${p} % de probabilidad por año. ¿Cuál es la probabilidad de que ocurra al menos una vez en ${n} años? Redondeá al entero.`,
          valor: res,
          unidad: '%',
          tol: 1,
          explicacion: `1 − ${(1 - p / 100).toLocaleString('es-AR')}^${n} ≈ ${res} %. Un evento "raro" cada año se vuelve bastante probable a lo largo de varias décadas.`,
          ctx: `${p} % por año; ${n} años.`,
        };
      }, { d: 3 }),
      vf('Si hubo una crecida de 100 años el año pasado, no va a haber otra hasta dentro de un siglo.', false, 'Cada año tiene un 1 % de probabilidad, pase lo que haya pasado antes. Y con el cambio climático, en muchos ríos esa probabilidad está aumentando.', {
        razones: ['+Porque cada año tiene la misma probabilidad, más allá de lo que pasó antes', '-Porque las crecidas solo ocurren en años pares', '-Porque una crecida grande evita todas las siguientes'],
        d: 2,
      }),
      teoria('El principio precautorio', [
        'La Ley General del Ambiente de Argentina, la 25.675, incluye el principio precautorio: cuando hay peligro de un daño grave o irreversible, la falta de información o de certeza científica no debe usarse como razón para postergar medidas eficaces para proteger el ambiente. No pide certeza absoluta para actuar: pide no esperar a que el daño ya no tenga vuelta atrás.',
      ]),
      op('¿Qué situación encaja con el principio precautorio?', [ // e4
        'Frenar una obra con riesgo de daño grave aunque falten estudios',
        'Esperar a tener certeza total antes de tomar cualquier medida',
        ['Prohibir todas las actividades humanas por las dudas', 'Se aplica ante peligro de daño grave o irreversible, con medidas razonables.'],
        'Aprobar un proyecto porque no hay pruebas de que haga daño',
      ], 'La falta de certeza no justifica la inacción cuando el daño posible es grave o irreversible.', { d: 2 }),
      cad('Armá la cadena de por qué esperar certeza total puede salir caro.', [ // e5
        'Se decide esperar a tener certeza total',
        'El problema sigue creciendo mientras tanto',
        'Se pierden las opciones más baratas',
        'Cuando por fin se actúa, cuesta mucho más',
        'Algunos daños ya son irreversibles',
      ], ['Esperar siempre reduce los costos'], 'La incertidumbre es un motivo para actuar con prudencia, no para quedarse quieto.', { d: 2 }),
      teoria('Decisiones robustas', [
        'Cuando el futuro es incierto, en lugar de apostar a un solo pronóstico conviene elegir acciones que funcionen razonablemente bien en muchos escenarios. Algunas medidas son "sin arrepentimiento": sirven en cualquier caso, como un sistema de alerta temprana o no construir en zonas inundables. Otras se diseñan flexibles: se hacen por etapas, se monitorean ciertas señales y se da el paso siguiente cuando la señal aparece.',
      ]),
      clas('¿Es una medida sin arrepentimiento o una apuesta a un solo escenario?', { // e6
        'Sin arrepentimiento': ['Sistema de alerta temprana de crecidas', 'No habilitar barrios nuevos en zonas inundables', 'Mantener limpios los desagües'],
        'Apuesta a un solo escenario': ['Un muro muy alto, sin posibilidad de ajuste, para el peor caso', 'No hacer nada porque el escenario leve parece suficiente', 'Diseñar todo para el clima del pasado'],
      }, 'Las medidas sin arrepentimiento se justifican en cualquier futuro; las rígidas pueden quedar cortas o sobrar.', { d: 2 }),
      ord('Ordená el ciclo de un manejo adaptativo.', [ // e7
        'Definir objetivos y señales de alerta',
        'Tomar una primera medida flexible',
        'Monitorear los indicadores',
        'Comparar los datos con las señales de alerta',
        'Ajustar o dar el paso siguiente',
      ], 'Decidir, medir y corregir: el método científico aplicado a la gestión.', { d: 2 }),
      mult('¿Qué caracteriza a una decisión robusta frente a la incertidumbre? Marcá todo.', [ // e8
        '+Funciona razonablemente en varios escenarios',
        '+Se puede ajustar a medida que llegan datos',
        '+Incluye medidas útiles en cualquier caso',
        '+Define qué señales disparan el paso siguiente',
        '-Depende de que se cumpla un único pronóstico',
      ], 'Robusto no significa perfecto: significa que no falla gravemente en ningún futuro plausible.', { d: 2 }),
      det('Leé este argumento en una reunión vecinal y marcá lo equivocado.', [ // e9
        ['El arroyo tiene un 1 % de probabilidad de desbordar cada año.', false],
        ['Como es una crecida de 100 años, podemos construir tranquilos durante un siglo.', true, 'En 30 años, la probabilidad de al menos una crecida es de alrededor del 26 %.'],
        ['Una alerta temprana sirve en cualquier escenario.', false],
        ['Hasta que no haya certeza total, no conviene hacer nada.', true, 'El principio precautorio dice lo contrario ante daños graves.'],
      ], 'Entender probabilidad y riesgo cambia lo que un barrio decide.', { d: 2 }),
      comp('Completá.', 'La pérdida esperada es la probabilidad por el [daño]; una crecida de 100 años tiene un [1] % de probabilidad cada año; y las medidas útiles en cualquier escenario se llaman sin [arrepentimiento].', ['costo', '100', 'riesgo'], 'Tres herramientas para decidir sin certezas.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: modelos e incertidumbre', 'Modelos, rangos, probabilidades, tiempo y clima, escenarios y decisiones, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: la costanera de Puerto Sauce', 'Puerto Sauce, junto a un gran río, discute cómo proteger su costanera para las próximas décadas. Hay escenarios distintos y poco presupuesto. Ayudá a decidir.', [
      teoria('La situación', [
        'Hoy la costanera de Puerto Sauce se inunda con una crecida que tiene un 1 % de probabilidad por año, y que causaría daños por 60 millones de dólares. Los estudios dan dos escenarios para 2070: en uno, el nivel de las crecidas sube 0,3 m; en el otro, 0,8 m. Hay tres opciones: A, un muro de 1 m ya mismo, que cuesta 40 millones; B, un muro de 0,5 m diseñado para poder elevarse después, que cuesta 15 millones, más un sistema de alerta y monitoreo; C, no hacer nada hasta saber qué escenario ocurre.',
      ]),
      num('¿Cuál es la probabilidad de que la crecida ocurra al menos una vez en los próximos 40 años? Redondeá al entero.', 33, '%', '1 − 0,99^40 ≈ 0,33, o sea un 33 %: una chance en tres en 40 años.', { ctx: '1 % por año; 40 años.', tol: 1, d: 3 }),
      num('¿Cuál es la pérdida esperada por año con la situación actual?', 600000, 'dólares por año', '60.000.000 × 1 % = 600.000 dólares por año, sin contar que el riesgo puede aumentar con el cambio climático.', { ctx: 'Daños de 60 millones; 1 % por año.', d: 2 }),
      op('¿Qué opción es más robusta frente a los dos escenarios?', [ // e3
        'La B: protege hoy y se puede elevar si llega el peor caso',
        'La A: siempre conviene construir para el peor caso',
        ['La C: esperar es gratis mientras no haya certeza', 'Esperar tiene costo: una chance en tres de crecida en 40 años.'],
        'La C: los escenarios no coinciden, así que no sirven',
      ], 'La opción B funciona en ambos futuros y guarda la posibilidad de ajustar, a un costo menor.', { d: 3 }),
      clas('¿La medida sirve en cualquier escenario o depende de cuál ocurra?', { // e4
        'Sirve en cualquier escenario': ['Sistema de alerta temprana', 'No habilitar construcciones nuevas en la costanera baja'],
        'Depende del escenario': ['Elevar el muro a 1 m', 'Relocalizar viviendas de la franja más baja'],
      }, 'Primero lo que sirve siempre; después, lo que se activa según las señales.', { d: 2 }),
      ord('Ordená el plan adaptativo para la costanera.', [ // e5
        'Construir el muro de 0,5 m preparado para elevarse',
        'Instalar la alerta temprana y medir el nivel del río',
        'Definir qué nivel observado dispara la ampliación',
        'Revisar los datos cada cinco años',
        'Elevar el muro si se alcanza la señal',
      ], 'Un plan que decide hoy lo necesario y deja preparado el paso siguiente.', { d: 3 }),
      vf('Como los dos escenarios no coinciden, lo más prudente es no hacer nada hasta saber cuál ocurre.', false, 'Esperar tiene costo: hay una chance en tres de crecida en 40 años y una pérdida esperada de 600.000 dólares por año. El principio precautorio y las medidas sin arrepentimiento apuntan a actuar.', {
        razones: ['+Porque esperar también tiene costos y riesgos', '-Porque los escenarios siempre coinciden', '-Porque las crecidas no causan daños'],
        d: 2,
      }),
      det('El intendente escribe su propuesta. Marcá lo que conviene corregir.', [ // e7
        ['Instalaremos una alerta temprana de crecidas.', false],
        ['Como la crecida es de 100 años, no nos va a tocar en este mandato.', true, 'Cada año tiene un 1 % de probabilidad, incluido este.'],
        ['El muro se podrá elevar si los datos muestran que el río sube más.', false],
        ['Usaremos un solo escenario, el más barato, y no revisaremos nada.', true, 'Conviene considerar varios escenarios y monitorear para ajustar.'],
      ], 'Decidir bien con incertidumbre es combinar prudencia, flexibilidad y datos.', { d: 3 }),
    ]),
  ],
});
