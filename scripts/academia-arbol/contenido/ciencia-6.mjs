import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// CIENCIA 6 — Evaluar qué funciona.
// Cómo saber si un programa ambiental funcionó: el contrafáctico, los grupos
// de comparación, el sorteo, los experimentos naturales, la regresión a la
// media, las fugas y los rebotes, y cómo sumar evidencia y comparar costos.
// Retoma correlación y causa (ciencia-1), fuentes y revisiones sistemáticas
// (ciencia-3), la ciencia ciudadana (ciencia-4) y los modelos (ciencia-5).

export default unidad({
  slug: 'ciencia-6',
  rama: 'ciencia',
  orden: 6,
  nivel: 3,
  requiereTronco: 3,
  titulo: 'Evaluar qué funciona',
  bajada: 'Una campaña, una prohibición, un subsidio: cómo saber si de verdad funcionó, cuánto, a qué costo y con qué efectos que nadie buscaba.',
  objetivos: [
    'Explicar el contrafáctico y elegir buenos grupos de comparación',
    'Interpretar experimentos con sorteo y sus límites éticos',
    'Aplicar diferencias en diferencias y reconocer la regresión a la media',
    'Detectar fugas, rebotes e incentivos perversos',
    'Combinar evidencia y comparar programas por su costo-efectividad',
  ],
  repasa: ['ciencia-1', 'ciencia-3', 'ciencia-4', 'ciencia-5'],
  fuentes: ['bm-evaluacion-impacto', 'allcott-2011', 'taylor-2019-bolsas', 'cochrane', 'cee-evidencia'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Qué habría pasado sin', 'El contrafáctico: por qué "antes y después" no alcanza y cómo se elige un grupo de comparación.', [
      teoria('La pregunta de fondo', [
        'Para saber si un programa funcionó hay que comparar lo que pasó con lo que habría pasado sin el programa. Ese escenario que no ocurrió se llama contrafáctico. Como no se puede observar, se lo estima. La forma más tentadora, comparar antes y después, suele engañar: entre una medición y otra cambian muchas cosas, como la estación del año, los precios, el clima u otras políticas.',
      ]),
      op('¿Qué es el contrafáctico en una evaluación de impacto?', [ // e1
        'Lo que habría pasado si el programa no existía',
        'El resultado que el programa prometía lograr',
        ['Un dato falso que hay que descartar', 'No es un error: es el escenario sin programa con el que se compara.'],
        'La opinión de quienes no participaron',
      ], 'Sin un contrafáctico creíble, no hay forma de separar el efecto del programa de todo lo demás.', { d: 2 }),
      clas('El reciclaje de un barrio subió de marzo a diciembre. ¿Qué pudo ser efecto del programa municipal y qué es otra causa posible?', { // e2
        'Efecto posible del programa': ['La campaña puerta a puerta del municipio', 'Los contenedores nuevos del programa'],
        'Otra causa posible': ['En diciembre se consumen más bebidas y envases', 'Subió el precio que pagan por el cartón', 'Una cooperativa nueva empezó a recolectar'],
      }, 'Cualquier cambio que ocurra al mismo tiempo que el programa puede confundirse con su efecto.', { d: 2 }),
      vf('Si algo mejora después de aplicar una medida, eso prueba que la medida fue la causa.', false, 'Puede haber mejorado por otra razón que ocurrió al mismo tiempo. Es el error "después de esto, entonces por esto": hace falta un contrafáctico.', {
        razones: ['+Porque otra cosa pudo cambiar al mismo tiempo', '-Porque las medidas nunca tienen efectos', '-Porque las mejoras siempre son casualidad'],
        d: 1,
      }),
      teoria('Un grupo de comparación', [
        'La forma habitual de estimar el contrafáctico es usar un grupo de comparación: personas, hogares o lugares parecidos que no recibieron el programa. Lo que cambió en ese grupo muestra lo que probablemente habría pasado sin el programa. La diferencia entre los dos cambios estima el efecto.',
      ]),
      cad('Armá la cadena de cómo se estima el efecto de un programa con un grupo de comparación.', [ // e3
        'Se lanza el programa en un barrio',
        'Se mide el cambio en ese barrio',
        'Se mide el cambio en un barrio parecido sin programa',
        'Se resta un cambio del otro',
        'La diferencia estima el efecto del programa',
      ], ['Se mide solo el barrio del programa, porque el otro no importa'], 'El grupo de comparación absorbe todo lo que cambió por otras razones.', { d: 2 }),
      numv(3, (i) => { // e4
        const [pa, pd, ca, cd] = [[200, 180, 200, 190], [300, 255, 300, 285], [150, 120, 150, 141]][i];
        const efecto = (pa - pd) - (ca - cd);
        return {
          enunciado: `Los hogares de un programa de ahorro bajaron su consumo de ${pa} a ${pd} kWh por mes. En un grupo parecido sin programa, el consumo bajó de ${ca} a ${cd} kWh. ¿Cuántos kWh de la baja se pueden atribuir al programa?`,
          valor: efecto,
          unidad: 'kWh por mes',
          explicacion: `Baja con programa: ${pa - pd}; baja sin programa: ${ca - cd}. ${pa - pd} − ${ca - cd} = ${efecto} kWh. El resto de la baja habría ocurrido igual, por ejemplo por el clima o los precios.`,
          ctx: `Con programa: ${pa} → ${pd}; sin programa: ${ca} → ${cd}.`,
        };
      }, { d: 2 }),
      mult('¿Qué puede confundir una comparación de antes y después? Marcá todo.', [ // e5
        '+La estación del año',
        '+Un cambio en los precios',
        '+Otra política que empezó al mismo tiempo',
        '+Un año más lluvioso o más caluroso que el anterior',
        '-Haber medido con el mismo método antes y después',
      ], 'Medir con el mismo método es bueno; lo que confunde son las otras cosas que cambian a la vez.', { d: 1 }),
      teoria('Un grupo que se parezca de verdad', [
        'El grupo de comparación tiene que parecerse al que recibió el programa antes de empezar. Si el programa se ofrece a quien quiera anotarse, los que se anotan suelen ser más motivados o tener más recursos: compararlos con los que no se anotaron exagera el efecto. Eso se llama sesgo de selección.',
      ]),
      op('Un municipio compara el reciclaje de los hogares que se anotaron solos en un programa con el de los que no se anotaron. ¿Cuál es el problema?', [ // e6
        'Los que se anotan ya eran distintos: más motivados',
        'Que los hogares anotados eran demasiados para medir',
        ['Que el reciclaje no se puede medir en kilos', 'Sí se puede; el problema es quiénes se comparan.'],
        'Que los que no se anotaron reciclan siempre más',
      ], 'Si los grupos ya eran distintos al inicio, la diferencia final no es solo efecto del programa.', { d: 2 }),
      rank('Ordená estos grupos de comparación del más confiable al menos confiable.', [ // e7
        ['Hogares que no recibieron el programa por sorteo', 'el mejor'],
        ['Un barrio vecino muy parecido, medido en el mismo período', 'bueno'],
        ['Los hogares que no quisieron participar', 'el peor'],
      ], 'Cuanto más parecido es el grupo de comparación antes del programa, más creíble es el efecto estimado.', { d: 3, extremos: ['Más confiable', 'Menos confiable'] }),
      det('Leé este informe de gestión y marcá lo que conviene revisar.', [ // e8
        ['Medimos el reciclaje del barrio antes y después de la campaña.', false],
        ['Como el reciclaje subió en diciembre, la campaña fue un éxito.', true, 'En diciembre se consumen más envases: falta un grupo de comparación.'],
        ['Usamos la misma balanza en las dos mediciones.', false],
        ['Comparamos a los vecinos que se anotaron con los que no.', true, 'Sesgo de selección: los que se anotan suelen ser distintos.'],
      ], 'Un buen informe separa el efecto del programa de todo lo demás que cambió.', { d: 2 }),
      comp('Completá.', 'Lo que habría pasado sin el programa es el [contrafáctico]; se lo estima con un grupo de [comparación]; y comparar a quienes se anotan solos con quienes no genera un sesgo de [selección].', ['promedio', 'control remoto', 'confirmación'], 'Tres ideas de base para evaluar cualquier programa.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('El sorteo como herramienta', 'Por qué asignar al azar da la comparación más limpia, qué mostró un experimento con cartas de consumo eléctrico y cuándo no se puede sortear.', [
      teoria('Por qué sortear', [
        'Si se sortea quién recibe un programa, los dos grupos quedan, en promedio, iguales en todo: edad, ingresos, motivación e incluso en lo que no se puede medir. Así, cualquier diferencia posterior se debe al programa. Es la lógica de los ensayos con sorteo, muy usados en medicina y cada vez más en políticas ambientales.',
        'Un ejemplo conocido: una empresa estadounidense enviaba a los hogares cartas que comparaban su consumo de electricidad con el de sus vecinos. Un estudio publicado en 2011 analizó experimentos con sorteo en unos 600.000 hogares y encontró que las cartas redujeron el consumo, en promedio, un 2,0 %.',
      ], { destacado: { valor: '2,0 %', texto: 'bajó en promedio el consumo eléctrico de los hogares que recibían cartas comparándolos con sus vecinos, en experimentos con sorteo.' } }),
      cad('Armá la cadena de por qué el sorteo permite atribuir el efecto al programa.', [ // e1
        'Se sortea quién recibe el programa',
        'Los dos grupos quedan parecidos en todo, en promedio',
        'Solo uno de los grupos recibe el programa',
        'Se miden los resultados en los dos grupos',
        'La diferencia se debe al programa',
      ], ['El sorteo hace que el grupo con programa sea más motivado'], 'El azar reparte por igual todo lo que podría confundir.', { d: 2 }),
      numv(3, (i) => { // e2
        const kwh = [3000, 2400, 4500][i];
        return {
          enunciado: `Un hogar consume ${kwh.toLocaleString('es-AR')} kWh por año. Si las cartas reducen el consumo un 2 %, ¿cuántos kWh ahorra por año?`,
          valor: kwh * 2 / 100,
          unidad: 'kWh',
          explicacion: `${kwh.toLocaleString('es-AR')} × 2 % = ${kwh * 2 / 100} kWh. Poco por hogar, pero multiplicado por cientos de miles de hogares y con un costo muy bajo.`,
          ctx: `${kwh} kWh por año; ahorro del 2 %.`,
        };
      }, { d: 1 }),
      num('Si 600.000 hogares ahorran 60 kWh por año cada uno, ¿cuántos millones de kWh se ahorran en total?', 36, 'millones de kWh', '600.000 × 60 = 36.000.000 kWh, o sea 36 millones de kWh por año.', { ctx: '600.000 hogares; 60 kWh por hogar.', d: 1 }),
      vf('Un efecto promedio del 2 % es tan chico que no tiene ninguna importancia.', false, 'Aplicado a cientos de miles de hogares y a bajo costo, un 2 % puede ahorrar mucha energía. Importa el tamaño del efecto, pero también la escala y el costo.', {
        razones: ['+Porque a gran escala y bajo costo suma mucho', '-Porque los porcentajes chicos siempre son errores', '-Porque el 2 % se refiere a un solo hogar'],
        d: 2,
      }),
      teoria('Muestras chicas, resultados inestables', [
        'Con pocos participantes, el azar puede producir diferencias grandes entre grupos aunque el programa no haga nada. Con muchos participantes, esas diferencias por azar se achican y el efecto se estima con más precisión. Cuando se dice que un resultado es "estadísticamente significativo", se quiere decir que sería muy raro obtenerlo solo por azar.',
      ]),
      op('Dos ensayos prueban el mismo programa: uno con 20 hogares y otro con 2.000. El de 20 muestra un efecto enorme; el de 2.000, uno moderado. ¿Cuál es más confiable?', [ // e3
        'El de 2.000: el azar pesa mucho menos',
        'El de 20: los efectos grandes son los verdaderos',
        ['Son iguales, porque probaron el mismo programa', 'El tamaño de la muestra cambia cuánto puede engañar el azar.'],
        'Ninguno: los ensayos con sorteo no sirven',
      ], 'En muestras chicas, los resultados extremos por azar son comunes.', { d: 2 }),
      est('Estimá en cuántos hogares se basaron los experimentos con cartas de consumo eléctrico.', 600000, { min: 100, max: 100000000, unidad: 'hogares', escala: 'log' }, 'Unos 600.000 hogares: una muestra enorme, que permite detectar con precisión un efecto de apenas 2 %.', { d: 2 }),
      ord('Ordená los pasos de un ensayo con sorteo.', [ // e4
        'Definir qué resultado se quiere medir',
        'Elegir quiénes van a participar',
        'Sortear quién recibe el programa',
        'Aplicar el programa y medir en los dos grupos',
        'Comparar los resultados',
      ], 'Definir el resultado antes de empezar evita elegir después el que más conviene.', { d: 2 }),
      teoria('Límites y ética', [
        'No todo se puede sortear: nadie puede decidir al azar dónde cae una inundación ni quién respira aire contaminado. Y no es ético negarle a un grupo algo que ya se sabe que es beneficioso. Una solución común es sortear el orden: todos reciben el programa, pero algunos antes que otros, y mientras tanto se compara. También hace falta el consentimiento de quienes participan.',
      ]),
      clas('¿Se puede sortear de forma ética o no?', { // e5
        'Se puede sortear': ['Qué hogares reciben primero una carta de consumo', 'Qué escuelas empiezan este año un taller de compostaje', 'En qué cuadras se prueba antes un contenedor nuevo'],
        'No se puede o no es ético': ['Dónde ocurre una inundación', 'Quién respira aire contaminado', 'Quién recibe agua potable segura'],
      }, 'Cuando no se puede sortear, hay otros diseños, como verás en la próxima lección.', { d: 2 }),
      mult('¿Qué ventajas tiene asignar un programa por sorteo? Marcá todas.', [ // e6
        '+Los grupos quedan parecidos también en lo que no se mide',
        '+Es fácil de explicar y de auditar',
        '+Puede ser una forma justa de repartir cupos',
        '+Permite atribuir la diferencia al programa',
        '-Garantiza que el programa funcione',
      ], 'El sorteo no hace funcionar un programa: permite saber si funciona.', { d: 2 }),
      det('Leé este plan de un ensayo y marcá lo que conviene corregir.', [ // e7
        ['Sortearemos qué hogares reciben las cartas primero.', false],
        ['Si al grupo sin cartas le va mejor, cambiaremos el resultado a medir.', true, 'El resultado se define antes; cambiarlo después sesga la conclusión.'],
        ['Todos los hogares recibirán las cartas al terminar el ensayo.', false],
        ['Con 10 hogares alcanza para sacar conclusiones firmes.', true, 'Con tan pocos, el azar puede dominar el resultado.'],
      ], 'Un buen ensayo fija sus reglas antes de ver los datos y usa una muestra suficiente.', { d: 2 }),
      comp('Completá.', 'Asignar el programa al [azar] deja grupos parecidos en todo; con pocos participantes, los resultados son más [inestables]; y un resultado que sería muy raro solo por azar es estadísticamente [significativo].', ['mérito', 'precisos', 'famoso'], 'Tres ideas para leer un ensayo con sorteo.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Cuando no se puede sortear', 'Experimentos naturales, diferencias en diferencias y la trampa de la regresión a la media.', [
      teoria('Experimentos naturales', [
        'A veces una regla o un hecho externo separa a grupos parecidos casi como un sorteo: una ley que rige en una ciudad y no en la vecina, o un programa que empieza antes en algunos barrios por razones administrativas. Son experimentos naturales. Por ejemplo, un estudio publicado en 2019 aprovechó que distintas ciudades de California prohibieron las bolsas plásticas en momentos diferentes para medir qué pasó con el consumo de bolsas.',
      ]),
      op('¿Por qué sirvió que distintas ciudades de California prohibieran las bolsas en momentos diferentes?', [ // e1
        'Permitió comparar ciudades con y sin la regla a la vez',
        'Porque así las bolsas se volvieron más baratas',
        ['Porque todas las ciudades eran idénticas en todo', 'No hace falta que sean idénticas: se comparan sus cambios.'],
        'Porque así se evitó tener que medir las bolsas',
      ], 'Las diferencias de calendario funcionan como un grupo de comparación natural.', { d: 2 }),
      teoria('Diferencias en diferencias', [
        'Un diseño muy usado compara cuánto cambió el grupo con programa y cuánto cambió un grupo sin programa en el mismo período, y resta los dos cambios. Su supuesto clave es el de tendencias paralelas: sin el programa, los dos grupos habrían evolucionado de forma parecida. Para chequearlo, se mira si antes del programa ya se movían juntos.',
      ]),
      numv(3, (i) => { // e2
        const [ta, td, ca, cd] = [[50, 30, 50, 45], [80, 60, 70, 65], [100, 70, 90, 85]][i];
        const efecto = (ta - td) - (ca - cd);
        return {
          enunciado: `En las ciudades con prohibición, el consumo de bolsas pasó de ${ta} a ${td} por persona al mes. En ciudades sin prohibición, de ${ca} a ${cd}. ¿En cuántas bolsas por persona redujo el consumo la prohibición, según diferencias en diferencias?`,
          valor: efecto,
          unidad: 'bolsas por persona',
          explicacion: `Cambio con prohibición: ${ta - td}; sin prohibición: ${ca - cd}. ${ta - td} − ${ca - cd} = ${efecto}. Valores de ejemplo: el cambio del grupo sin prohibición muestra lo que habría pasado igual.`,
          ctx: `Con regla: ${ta} → ${td}; sin regla: ${ca} → ${cd}.`,
        };
      }, { d: 2 }),
      op('¿Qué supone el método de diferencias en diferencias?', [ // e3
        'Que sin el programa los dos grupos habrían cambiado igual',
        'Que los dos grupos tenían exactamente los mismos valores',
        ['Que el programa se asignó por sorteo', 'No necesita sorteo; necesita tendencias parecidas.'],
        'Que el grupo sin programa no cambió en nada',
      ], 'Si los grupos ya iban por caminos distintos antes del programa, la resta engaña.', { d: 3 }),
      teoria('La regresión a la media', [
        'Si se eligen lugares justo después de un año excepcionalmente malo, como las esquinas con más choques del último año, al año siguiente suelen mejorar aunque no se haga nada, porque los valores extremos tienen parte de azar. Si el programa se aplica justo ahí, parece más efectivo de lo que es. Para evitarlo, se comparan con el promedio de varios años o con lugares parecidos sin programa.',
      ]),
      cad('Armá la cadena de cómo la regresión a la media puede inflar el éxito de un programa.', [ // e4
        'Un cruce tiene un año con muchos más choques que su promedio',
        'Por eso se lo elige para poner un radar',
        'Al año siguiente, el azar ya no juega tan en contra',
        'Los choques vuelven a acercarse a su promedio',
        'La baja se atribuye entera al radar',
      ], ['El año malo garantiza que el siguiente sea peor'], 'Parte de la mejora habría ocurrido igual: los extremos tienden a volver hacia su promedio.', { d: 3 }),
      numv(3, (i) => { // e5
        const [malo, prom] = [[12, 6], [20, 11], [9, 5]][i];
        return {
          enunciado: `Un cruce tuvo ${malo} choques en un año malo; su promedio de largo plazo es de ${prom} por año. Si al año siguiente vuelve a su promedio, ¿cuántos choques menos habría aunque no se haga nada?`,
          valor: malo - prom,
          unidad: 'choques',
          explicacion: `${malo} − ${prom} = ${malo - prom} choques menos, solo por volver al promedio. Un programa aplicado ahí tiene que demostrar una baja mayor que esa.`,
          ctx: `${malo} choques en un año malo; promedio de ${prom}.`,
        };
      }, { d: 2 }),
      vf('Si un programa se aplica en los lugares con peores resultados del último año y después mejoran, eso prueba que funcionó.', false, 'Parte de la mejora puede ser regresión a la media: los valores extremos tienden a volver a su promedio aunque no se haga nada.', {
        razones: ['+Porque los extremos tienden a volver a su promedio solos', '-Porque los lugares malos nunca mejoran', '-Porque los programas siempre empeoran las cosas'],
        d: 2,
      }),
      clas('¿Qué problema tiene cada evaluación: regresión a la media o sesgo de selección?', { // e6
        'Regresión a la media': ['Se eligen las esquinas con más choques del último año', 'Se premia a la escuela con peor nota del año pasado y luego mejora'],
        'Sesgo de selección': ['Solo se comparan los hogares que se anotaron solos', 'Se encuesta solo a quienes siguieron usando el programa'],
      }, 'Dos trampas distintas: una viene del azar en el tiempo, la otra de quiénes se comparan.', { d: 3 }),
      par('Uní cada diseño de evaluación con su idea central.', [ // e7
        ['Ensayo con sorteo', 'El azar decide quién recibe el programa'],
        ['Experimento natural', 'Una regla externa separa grupos parecidos'],
        ['Diferencias en diferencias', 'Comparar cambios en el tiempo entre dos grupos'],
        ['Antes y después sin comparación', 'El diseño más débil'],
      ], 'Conocer el diseño permite saber cuánta confianza darle al resultado.', { d: 2 }),
      mult('¿Qué buenas prácticas refuerzan una evaluación sin sorteo? Marcá todas.', [ // e8
        '+Grupos parecidos antes del programa',
        '+Revisar si antes ya tenían tendencias parecidas',
        '+Usar varios años de datos',
        '+Explicar los supuestos del análisis',
        '-Elegir el grupo de comparación que da el mejor resultado',
      ], 'Sin sorteo, la transparencia sobre los supuestos es todavía más importante.', { d: 2 }),
      det('Leé este anuncio de un municipio y marcá lo que conviene revisar.', [ // e9
        ['Pusimos radares en las 10 esquinas con más choques del año pasado.', false],
        ['Este año hubo menos choques ahí: los radares redujeron todos esos choques.', true, 'Parte de la baja puede ser regresión a la media.'],
        ['Vamos a comparar con esquinas parecidas sin radar.', false],
        ['No hace falta mirar años anteriores, alcanza con el último.', true, 'Varios años de datos muestran el promedio real de cada esquina.'],
      ], 'Un anuncio honesto separa el efecto del programa de la vuelta al promedio.', { d: 3 }),
      comp('Completá.', 'Una regla externa que separa grupos parecidos crea un experimento [natural]; comparar cambios entre dos grupos es el método de diferencias en [diferencias]; y la tendencia de los extremos a volver a su promedio es la regresión a la [media].', ['artificial', 'promedios', 'moda'], 'Tres herramientas para evaluar cuando no se puede sortear.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Efectos que nadie buscaba', 'Fugas, rebotes e incentivos perversos: por qué hay que medir el sistema completo.', [
      teoria('Fugas', [
        'Un programa puede lograr su objetivo directo y, a la vez, mover el problema a otro lado. El estudio de 2019 sobre las prohibiciones de bolsas en California encontró que dejaron de usarse unos 40 millones de libras de bolsas plásticas por año, pero que las compras de bolsas de residuos aumentaron unos 12 millones de libras: mucha gente reutilizaba las bolsas del súper para la basura. Además, parte del consumo pasó a bolsas de papel, más pesadas.',
      ]),
      num('Si dejaron de usarse 40 millones de libras de bolsas y se compraron 12 millones de libras más de bolsas de residuos, ¿qué porcentaje de la reducción se compensó?', 30, '%', '12 ÷ 40 × 100 = 30 %: casi un tercio de lo reducido volvió por otra vía. La prohibición igual redujo el plástico, pero bastante menos de lo que parecía.', { ctx: '40 millones de libras menos; 12 millones de libras más.', d: 2 }),
      cad('Armá la cadena de cómo una prohibición de bolsas puede generar una fuga.', [ // e1
        'Se prohíben las bolsas plásticas del súper',
        'Mucha gente las usaba para la basura',
        'Ya no las tiene en casa',
        'Compra bolsas de residuos',
        'Parte del plástico ahorrado vuelve por otra vía',
      ], ['La prohibición elimina toda bolsa de la casa'], 'El resultado neto se ve solo si se mide también lo que no se reguló.', { d: 2 }),
      teoria('Rebotes', [
        'Cuando algo se vuelve más eficiente, usarlo sale más barato, y a veces se lo usa más: es el efecto rebote. Con un auto que gasta menos, algunas personas manejan más; con luces LED, a veces se dejan más luces prendidas. En general, el rebote no anula todo el ahorro, pero lo achica, y por eso hay que medir el consumo real y no solo la eficiencia.',
      ]),
      numv(3, (i) => { // e2
        const [ahorro, rebote] = [[30, 20], [40, 10], [50, 30]][i];
        const real = ahorro * (100 - rebote) / 100;
        return {
          enunciado: `Un cambio de equipos prometía ahorrar un ${ahorro} % de energía. Si el efecto rebote se come el ${rebote} % de ese ahorro, ¿cuánto se ahorra en realidad?`,
          valor: real,
          unidad: '%',
          explicacion: `${ahorro} % × ${100 - rebote} % = ${real.toLocaleString('es-AR')} %. El ahorro sigue siendo real, pero menor que el prometido.`,
          ctx: `Ahorro prometido del ${ahorro} %; rebote del ${rebote} %.`,
        };
      }, { d: 2 }),
      vf('El efecto rebote demuestra que mejorar la eficiencia no sirve.', false, 'En general el rebote achica el ahorro pero no lo anula. La eficiencia sigue sirviendo; conviene combinarla con otras medidas y medir el consumo real.', {
        razones: ['+Porque suele achicar el ahorro, no anularlo', '-Porque la eficiencia siempre aumenta el consumo', '-Porque el rebote solo existe en la teoría'],
        d: 2,
      }),
      teoria('Incentivos perversos', [
        'A veces un programa premia algo que se puede conseguir por un atajo. Si se paga por kilo de reciclables, alguien puede mezclar residuos húmedos para que pesen más; si se paga por cada animal invasor entregado, alguien podría criarlos para cobrar. Diseñar bien un incentivo es pensar cómo podría aprovecharse, y medir la calidad además de la cantidad.',
      ]),
      clas('¿Qué tipo de efecto no buscado es cada uno?', { // e3
        'Fuga o desplazamiento': ['La tala se muda al bosque de al lado', 'Se compran más bolsas de residuos'],
        'Rebote': ['Con un auto más eficiente se maneja más', 'Con luces LED se dejan más luces prendidas'],
        'Incentivo perverso': ['Se paga por animal invasor entregado y alguien los cría', 'Se premia por kilo reciclado y se mezclan residuos húmedos'],
      }, 'Tres formas distintas de que un buen objetivo termine a medias.', { d: 2 }),
      par('Uní cada política con un efecto no buscado posible.', [ // e4
        ['Prohibir las bolsas plásticas', 'Más compras de bolsas de residuos'],
        ['Proteger un bosque puntual', 'Tala que se muda al bosque vecino'],
        ['Subsidiar autos eficientes', 'Más kilómetros manejados'],
        ['Pagar por kilo de reciclables', 'Material mezclado para que pese más'],
      ], 'Anticipar estos efectos permite diseñar mejor y medir lo que corresponde.', { d: 2 }),
      numv(3, (i) => { // e5
        const [ha, fuga] = [[1000, 30], [500, 40], [2000, 25]][i];
        return {
          enunciado: `Un proyecto protege ${ha.toLocaleString('es-AR')} hectáreas de bosque que iban a talarse. Si el ${fuga} % de esa tala se muda a bosques vecinos, ¿cuántas hectáreas se salvan en términos netos?`,
          valor: ha * (100 - fuga) / 100,
          unidad: 'hectáreas',
          explicacion: `${ha.toLocaleString('es-AR')} × ${100 - fuga} % = ${(ha * (100 - fuga) / 100).toLocaleString('es-AR')} hectáreas. Por eso los bonos de carbono de bosques tienen que descontar las fugas, como viste con las metas climáticas.`,
          ctx: `${ha} ha protegidas; fuga del ${fuga} %.`,
        };
      }, { d: 2 }),
      op('¿Por qué conviene medir más indicadores que el que el programa quería mejorar?', [ // e6
        'Para detectar fugas, rebotes y atajos',
        'Para que el informe tenga más páginas',
        ['Porque el indicador principal nunca importa', 'Importa, pero no alcanza para ver el efecto neto.'],
        'Para poder elegir después el que dio mejor',
      ], 'El efecto neto de un programa solo se ve mirando el sistema completo.', { d: 2 }),
      mult('¿Cómo se detectan efectos no buscados? Marcá todo.', [ // e7
        '+Medir el sistema completo, no solo el indicador principal',
        '+Mirar lo que pasa en zonas vecinas',
        '+Preguntar a quienes participan cómo cambiaron sus hábitos',
        '+Seguir midiendo después de que termina el programa',
        '-Medir solo el indicador que se quería mejorar',
      ], 'Buscar activamente los efectos no deseados es parte de evaluar con honestidad.', { d: 1 }),
      det('Leé esta conclusión de una evaluación y marcá lo que conviene revisar.', [ // e8
        ['La prohibición redujo el uso de bolsas del súper.', false],
        ['Por lo tanto, el plástico total de los hogares bajó en la misma cantidad.', true, 'Hay que restar las bolsas de residuos que se compraron de más.'],
        ['Medimos también las compras de bolsas de residuos.', false],
        ['No hace falta mirar las bolsas de papel.', true, 'Parte del consumo pasó a papel, más pesado: también cuenta.'],
      ], 'Una conclusión sólida mira el efecto neto sobre todo el sistema.', { d: 2 }),
      comp('Completá.', 'Cuando el problema se muda a otro lado hay una [fuga]; cuando la eficiencia lleva a usar más, hay un efecto [rebote]; y cuando un premio invita a hacer trampa, el incentivo es [perverso].', ['multa', 'dominó', 'neutro'], 'Tres efectos que ninguna evaluación seria puede ignorar.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Sumar la evidencia', 'De un estudio a muchos: revisiones sistemáticas, sesgo de publicación, prerregistro y costo-efectividad.', [
      teoria('Un estudio no alcanza', [
        'Un solo estudio puede tener un resultado distinto por azar o por su contexto. Por eso importa la réplica, y por eso existen las revisiones sistemáticas: reúnen todos los estudios sobre una pregunta con un método explícito, evalúan su calidad y, cuando se puede, combinan sus resultados en un metaanálisis. En salud las impulsa la red Cochrane; en ambiente, la Collaboration for Environmental Evidence.',
      ]),
      rank('Ordená estas fuentes de evidencia sobre si un programa causa un efecto, de la más sólida a la menos.', [ // e1
        ['Revisión sistemática de muchos ensayos', 'la más sólida'],
        ['Un ensayo con sorteo grande', 'muy buena'],
        ['Un experimento natural bien analizado', 'buena'],
        ['Una comparación de antes y después sin grupo de comparación', 'débil'],
      ], 'La solidez sube con buenos diseños y con muchos estudios que coinciden.', { d: 2, extremos: ['Más sólida', 'Menos sólida'] }),
      vf('Si un estudio muestra que algo funciona, ya quedó probado para siempre y en todo lugar.', false, 'Un resultado puede deberse al azar o al contexto. La confianza crece cuando varios estudios, en distintos lugares, llegan a conclusiones parecidas.', {
        razones: ['+Porque puede deberse al azar o al contexto', '-Porque los estudios nunca sirven', '-Porque solo valen los estudios de un país'],
        d: 1,
      }),
      mult('¿Qué hace una revisión sistemática? Marcá todo.', [ // e2
        '+Busca todos los estudios sobre una pregunta',
        '+Usa un método explícito y repetible',
        '+Evalúa la calidad de cada estudio',
        '+Combina los resultados cuando se puede',
        '-Elige solo los estudios que apoyan una idea previa',
      ], 'Lo que la distingue de una reseña común es el método: explícito, completo y verificable.', { d: 1 }),
      teoria('El cajón de los resultados nulos', [
        'Los estudios con resultados llamativos tienen más chances de publicarse que los que no encuentran nada. Si los resultados nulos quedan en un cajón, la literatura publicada exagera los efectos: es el sesgo de publicación. Una defensa es el prerregistro: declarar la hipótesis y el plan de análisis antes de ver los datos, para que no se pueda cambiar la pregunta después.',
      ]),
      cad('Armá la cadena de cómo el sesgo de publicación exagera un efecto.', [ // e3
        'Muchos equipos estudian el mismo programa',
        'Algunos encuentran efectos grandes por azar',
        'Esos estudios se publican más',
        'Los que no encontraron nada quedan en un cajón',
        'Lo publicado muestra un efecto mayor que el real',
      ], ['Los resultados nulos se publican siempre primero'], 'Por eso importa buscar también los estudios no publicados y los prerregistros.', { d: 3 }),
      op('¿Para qué sirve prerregistrar un estudio?', [ // e4
        'Para fijar la pregunta y el análisis antes de ver datos',
        'Para asegurarse de que el resultado sea positivo',
        ['Para pedir permiso de publicación a una revista', 'Es un registro público del plan, no un permiso.'],
        'Para que nadie más pueda estudiar el mismo tema',
      ], 'El prerregistro protege contra la tentación de ajustar la pregunta al resultado.', { d: 2 }),
      teoria('Costo-efectividad', [
        'Saber que algo funciona no alcanza: con presupuestos limitados, conviene comparar cuánto cuesta lograr cada unidad de resultado, como cada tonelada de CO₂ evitada o cada kWh ahorrado. En el caso de las cartas de consumo eléctrico, el estudio de 2011 estimó un costo de entre 1,3 y 5,4 centavos de dólar por kWh ahorrado, con un promedio de 3,3.',
      ]),
      numv(3, (i) => { // e5
        const [costo, t] = [[50000, 1000], [120000, 800], [30000, 1500]][i];
        return {
          enunciado: `Un programa cuesta ${costo.toLocaleString('es-AR')} dólares y evita ${t.toLocaleString('es-AR')} toneladas de CO₂. ¿Cuánto cuesta cada tonelada evitada?`,
          valor: costo / t,
          unidad: 'dólares por tonelada',
          explicacion: `${costo.toLocaleString('es-AR')} ÷ ${t.toLocaleString('es-AR')} = ${costo / t} dólares por tonelada. Así se pueden comparar programas muy distintos con una misma vara.`,
          ctx: `${costo} dólares; ${t} toneladas evitadas.`,
        };
      }, { d: 1 }),
      rank('Con el mismo presupuesto, ordená estos programas del más costo-efectivo al menos.', [ // e6
        ['Aislación de techos: 20 dólares por tonelada evitada', '20'],
        ['Cartas de consumo: 50 dólares por tonelada', '50'],
        ['Recambio de flota: 150 dólares por tonelada', '150'],
      ], 'Con dinero limitado, empezar por lo que más resultado da por peso invertido permite lograr más en total.', { d: 1, extremos: ['Más costo-efectivo', 'Menos costo-efectivo'] }),
      num('Si las cartas cuestan en promedio 3,3 centavos de dólar por kWh ahorrado y un hogar ahorra 60 kWh por año, ¿cuántos dólares cuesta por hogar y por año? Redondeá a dos decimales.', 1.98, 'dólares', '60 × 3,3 = 198 centavos, o sea 1,98 dólares por hogar y por año: un programa muy barato para lo que ahorra.', { ctx: '3,3 centavos por kWh; 60 kWh por hogar.', dec: 2, tol: 0.01, d: 2 }),
      clas('¿Esto aumenta o reduce la confianza en un resultado?', { // e7
        'La aumenta': ['Se replicó en varios países', 'El análisis estaba prerregistrado', 'La muestra fue grande'],
        'La reduce': ['Es un solo estudio con 15 participantes', 'Lo financió quien vende el producto, sin declararlo', 'Solo se informa un subgrupo elegido después'],
      }, 'Las mismas preguntas sirven para cualquier estudio que leas en una noticia.', { d: 2 }),
      det('Leé esta nota y marcá lo que conviene revisar.', [ // e8
        ['Una revisión de 40 estudios encontró un efecto moderado del programa.', false],
        ['Un estudio nuevo con 12 hogares mostró un efecto enorme: la revisión quedó desactualizada.', true, 'Un estudio chico no pesa más que 40 estudios combinados.'],
        ['La revisión incluyó estudios no publicados para evitar el sesgo de publicación.', false],
        ['Como funciona, no importa cuánto cuesta por tonelada evitada.', true, 'Con presupuesto limitado, el costo-efectividad define cuánto se logra.'],
      ], 'Leer evidencia es pesar diseños, cantidad de estudios y costos.', { d: 2 }),
      comp('Completá.', 'Una síntesis de todos los estudios con un método explícito es una revisión [sistemática]; que los resultados nulos queden sin publicar es el sesgo de [publicación]; y el costo por unidad de resultado mide la [costo-efectividad].', ['narrativa', 'confirmación', 'popularidad'], 'Tres ideas para pasar de un estudio a una decisión.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: evaluar qué funciona', 'Contrafáctico, sorteo, diferencias en diferencias, efectos no buscados y costo-efectividad, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el piloto de compostaje', 'Un municipio probó un programa de compostaje en un barrio y quiere extenderlo a toda la ciudad. Evaluá si funcionó y cuánto cuesta.', [
      teoria('La situación', [
        'El programa se aplicó en el barrio Norte, que se ofreció como voluntario, y se comparó con el barrio Sur. Antes del programa, cada hogar de Norte mandaba al relleno 10 kg de residuos por semana; después, 7 kg. En Sur, en el mismo período, se pasó de 10 kg a 9 kg. En Norte participan 1.000 hogares y el programa cuesta 20.000 dólares por año. Un funcionario anuncia: "el compostaje redujo 3 kg por hogar".',
      ]),
      num('Según diferencias en diferencias, ¿cuántos kg por hogar y por semana se pueden atribuir al programa?', 2, 'kg por semana', '(10 − 7) − (10 − 9) = 3 − 1 = 2 kg: un kilo de la baja habría ocurrido igual, como muestra el barrio Sur.', { ctx: 'Norte: 10 → 7 kg; Sur: 10 → 9 kg.', d: 2 }),
      num('Con ese efecto, ¿cuántas toneladas por año deja de recibir el relleno por los 1.000 hogares de Norte? (Un año tiene 52 semanas.)', 104, 'toneladas', '2 kg × 52 semanas × 1.000 hogares = 104.000 kg = 104 toneladas por año.', { ctx: '2 kg por semana; 52 semanas; 1.000 hogares.', d: 2 }),
      num('¿Cuánto cuesta cada tonelada desviada del relleno? Redondeá al entero.', 192, 'dólares por tonelada', '20.000 ÷ 104 ≈ 192 dólares por tonelada. Con este dato se lo puede comparar con otras formas de reducir lo que llega al relleno.', { ctx: '20.000 dólares por año; 104 toneladas.', tol: 1, d: 2 }),
      op('¿Qué problema tiene el anuncio del funcionario?', [ // e4
        'Ignora la baja que también hubo en el barrio Sur',
        'Que 3 kg es un número demasiado chico para anunciar',
        ['Que en realidad la baja fue de 5 kg', 'No: la baja de Norte fue de 3 kg, pero 1 kg habría ocurrido igual.'],
        'Que el barrio Sur no debería haberse medido',
      ], 'Atribuir toda la baja al programa sobrestima su efecto en un 50 %.', { d: 2 }),
      vf('Como Norte se ofreció como voluntario, la comparación con Sur es perfecta.', false, 'Un barrio voluntario puede ser más motivado desde antes: hay riesgo de sesgo de selección. Conviene revisar si antes del programa los dos barrios tenían tendencias parecidas.', {
        razones: ['+Porque un barrio voluntario puede ser distinto desde antes', '-Porque los voluntarios siempre reciclan menos', '-Porque Sur no tenía residuos'],
        d: 2,
      }),
      mult('Antes de extender el programa a toda la ciudad, ¿qué más conviene revisar? Marcá todo.', [ // e6
        '+Si antes del programa los barrios tenían tendencias parecidas',
        '+Si aumentaron los basurales clandestinos en Norte',
        '+La calidad del compost que se produce',
        '+Si el efecto se mantiene después del primer año',
        '-Mostrar solo los datos de Norte, que son mejores',
      ], 'Tendencias previas, fugas, calidad y duración: lo que separa un piloto prometedor de una política probada.', { d: 3 }),
      det('El municipio escribe su informe. Marcá lo que conviene corregir.', [ // e7
        ['Comparamos Norte con un barrio sin programa.', false],
        ['El programa redujo 3 kg por hogar por semana.', true, 'Descontando lo que pasó en Sur, el efecto estimado es de 2 kg.'],
        ['Calculamos un costo de unos 192 dólares por tonelada desviada.', false],
        ['Como funcionó en Norte, va a funcionar igual en toda la ciudad.', true, 'Norte fue voluntario: en otros barrios el efecto puede ser distinto.'],
      ], 'Un informe honesto muestra el efecto neto, el costo y los límites de lo que se sabe.', { d: 3 }),
    ]),
  ],
});
