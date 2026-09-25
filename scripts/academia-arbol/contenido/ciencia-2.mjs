import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// CIENCIA 2 — Leer gráficos y datos.
// Qué gráfico usar para cada pregunta, cómo leer una tendencia entre el
// ruido, cómo detectar gráficos que engañan, cuándo usar promedio o mediana
// y cómo no confundirse con porcentajes y tasas. Retoma leer un número
// ambiental (tronco-2) y la muestra y el consenso (ciencia-1).

export default unidad({
  slug: 'ciencia-2',
  rama: 'ciencia',
  orden: 2,
  nivel: 1,
  requiereTronco: 1,
  titulo: 'Leer gráficos y datos',
  bajada: 'Un gráfico puede aclarar o engañar. Cómo elegir el gráfico justo, ver una tendencia en medio del ruido y no caer en trampas con porcentajes.',
  objetivos: [
    'Elegir el tipo de gráfico adecuado para cada pregunta',
    'Distinguir una tendencia de la variabilidad de corto plazo',
    'Detectar recursos visuales que distorsionan un gráfico',
    'Elegir entre promedio y mediana según los datos',
    'Interpretar porcentajes, puntos porcentuales y tasas por persona',
  ],
  repasa: ['ciencia-1', 'tronco-2'],
  fuentes: ['noaa-co2', 'nasa-evidencia', 'owid-co2', 'chequeado', 'ipcc-ar6-syr'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Cada gráfico para su pregunta', 'Barras, líneas, tortas y puntos: qué muestra bien cada uno y cuándo conviene una tabla.', [
      teoria('Cuatro gráficos básicos', [
        'Los gráficos de barras sirven para comparar cantidades entre categorías: emisiones de distintos países, consumo de distintos aparatos. Los gráficos de líneas muestran cómo cambia algo en el tiempo: la temperatura año a año, el CO₂ mes a mes. Los gráficos de torta muestran partes de un todo, y funcionan bien solo con pocas partes. Los gráficos de dispersión (puntos) muestran si dos variables se relacionan.',
        'Cuando hay que ver números exactos, a veces una tabla es mejor que cualquier gráfico.',
      ]),
      par('Uní cada pregunta con el gráfico más adecuado.', [ // e1
        ['¿Cómo cambió la temperatura media entre 1900 y hoy?', 'Líneas'],
        ['¿Qué aparato de la casa consume más energía?', 'Barras'],
        ['¿Qué parte de la basura son orgánicos, plásticos y papel?', 'Torta'],
        ['¿Tienen menos temperatura las cuadras con más árboles?', 'Dispersión (puntos)'],
      ], 'Tiempo con líneas, comparación con barras, partes con torta, relación con puntos.', { d: 2 }),
      clas('¿Qué tipo de gráfico conviene para mostrar esto?', { // e2
        'Líneas': ['El nivel del río Paraná mes a mes durante cinco años', 'El CO₂ del aire desde 1960'],
        'Barras': ['Huella de carbono de cinco alimentos', 'Lluvia total de cada provincia en un año'],
        'Dispersión': ['Relación entre árboles por cuadra y temperatura', 'Relación entre tamaño de la casa y consumo de gas'],
      }, 'La pregunta define el gráfico. Un gráfico lindo pero equivocado confunde.', { d: 2 }),
      vf('Un gráfico de torta es una buena opción para mostrar cómo cambió la temperatura año a año.', false, 'Las tortas muestran partes de un todo en un momento. Para cambios en el tiempo, lo adecuado es un gráfico de líneas.', { // e3
        razones: ['+Porque las tortas muestran partes de un todo, no cambios en el tiempo', '-Porque la temperatura no se puede graficar', '-Porque las tortas solo sirven para mostrar dinero'],
        d: 1,
      }),
      teoria('Las partes de un gráfico', [
        'Antes de interpretar un gráfico hay que leer sus partes: el título (qué muestra), los ejes (qué variable va en cada uno), las unidades (grados, toneladas, porcentaje), la escala (de cuánto en cuánto van las marcas) y la fuente (de dónde salen los datos).',
        'Muchos errores de interpretación vienen de saltear estos pasos y mirar solo la forma del dibujo.',
      ]),
      ord('Ordená cómo conviene leer un gráfico nuevo.', [ // e4
        'Leer el título',
        'Ver qué variable va en cada eje y sus unidades',
        'Mirar la escala de los ejes',
        'Buscar la fuente de los datos',
        'Recién ahí, interpretar la forma',
      ], 'Primero entender qué muestra; después, qué dice.', { d: 2, extremos: ['Primero', 'Último'] }),
      op('Un gráfico de barras sobre emisiones no dice las unidades. ¿Cuál es el problema?', [ // e5
        'No se sabe si son totales o por persona',
        'Las barras quedan de un color menos lindo',
        ['Ninguno: las barras hablan por sí solas', 'Sin unidades, el mismo dibujo puede significar cosas muy distintas.'],
        'Que el gráfico tiene que ser de torta',
      ], 'Sin unidades, un gráfico puede comparar peras con manzanas sin que se note.', { d: 2 }),
      mult('¿Qué tiene que tener un buen gráfico? Marcá todo.', [ // e6
        '+Un título claro',
        '+Ejes con nombre y unidades',
        '+La fuente de los datos',
        '+Una escala que no distorsione',
        '-Efectos en 3D para que se vea más moderno',
      ], 'Los efectos 3D suelen deformar las proporciones. La claridad le gana al adorno.', { d: 1 }),
      teoria('Leer barras', [
        'En un gráfico de barras, la longitud de la barra representa la cantidad. Por eso el eje de las barras tiene que empezar en cero: si empieza en otro número, la diferencia entre barras parece mucho mayor de lo que es.',
      ], {
        datos: barras('Consumo mensual de electricidad de cuatro casas', 'kWh', [
          ['Casa A', 180],
          ['Casa B', 240],
          ['Casa C', 320],
          ['Casa D', 150],
        ], 'Datos de ejemplo.'),
      }),
      rank('Según ese gráfico, ordená las casas por consumo, de más a menos.', [ // e7
        ['Casa C', '320 kWh'],
        ['Casa B', '240 kWh'],
        ['Casa A', '180 kWh'],
        ['Casa D', '150 kWh'],
      ], 'Barras que empiezan en cero: la longitud es proporcional a la cantidad.', { d: 1 }),
      numv(3, (i) => { // e8
        const a = [320, 240, 180][i];
        const b = [150, 180, 150][i];
        return {
          enunciado: `En ese gráfico, una casa consume ${a} kWh y otra ${b} kWh. ¿Cuántas veces más consume la primera? Redondeá a un decimal.`,
          valor: Math.round((a / b) * 10) / 10,
          unidad: 'veces',
          dec: 1,
          tol: 0.1,
          explicacion: `${a} ÷ ${b} ≈ ${(Math.round((a / b) * 10) / 10).toLocaleString('es-AR')} veces. Si el eje empieza en cero, la barra más larga debería verse ese número de veces más larga.`,
        };
      }, { d: 2 }),
      det('Leé esta descripción de un gráfico y marcá lo que falta o está mal.', [ // e9
        ['Título: "Emisiones de CO₂ de cinco países, 2023".', false],
        ['El eje vertical no tiene unidades.', true, 'Sin unidades no se sabe si son toneladas, millones de toneladas o toneladas por persona.'],
        ['La fuente es el Global Carbon Project.', false],
        ['El eje de las barras empieza en 400 para que se note la diferencia.', true, 'En barras, el eje tiene que empezar en cero; si no, exagera las diferencias.'],
      ], 'Un gráfico honesto muestra unidades, fuente y un eje que no distorsiona.', { d: 3 }),
      comp('Completá.', 'Para mostrar cambios en el tiempo se usa un gráfico de [líneas]; para comparar categorías, de [barras]; y el eje de las barras tiene que empezar en [cero].', ['torta', 'puntos', 'diez'], 'Tres reglas básicas para elegir y leer gráficos.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Ver la tendencia entre el ruido', 'Subidas y bajadas de corto plazo contra cambios de largo plazo: la curva del CO₂ y la diferencia entre tiempo y clima.', [
      teoria('Tendencia y variabilidad', [
        'Muchos datos ambientales suben y bajan todo el tiempo: la temperatura de cada día, la lluvia de cada mes. Esa variación de corto plazo se llama variabilidad o "ruido". La tendencia es la dirección general a lo largo de muchos años.',
        'Un día frío no dice nada sobre la tendencia del clima, igual que un mal día no dice nada del promedio de un año. Para ver una tendencia hacen falta muchos años de datos.',
      ]),
      teoria('La curva del CO₂', [
        'Desde 1958 se mide el CO₂ del aire en el observatorio de Mauna Loa, en Hawái. La curva sube y baja cada año unos pocos ppm: baja en el verano del hemisferio norte, cuando los bosques del norte crecen y absorben CO₂, y sube en su invierno. Pero debajo de ese zigzag hay una tendencia clara: pasó de unas 315 ppm en 1958 a más de 420 ppm hoy.',
      ], {
        datos: tabla('CO₂ en Mauna Loa (promedio anual aproximado)', ['Año', 'ppm'], [
          ['1960', '317'],
          ['1980', '339'],
          ['2000', '370'],
          ['2020', '414'],
          ['2024', '425'],
        ], 'Valores redondeados de la NOAA.'),
      }),
      op('¿Por qué la curva del CO₂ de Mauna Loa sube y baja un poco cada año?', [ // e1
        'Por la vegetación del norte en cada estación',
        'Porque los instrumentos fallan en invierno',
        ['Porque las personas emiten menos CO₂ en verano', 'Las emisiones cambian poco en el año; el zigzag viene de la vegetación.'],
        'Porque el volcán emite CO₂ solo algunos meses',
      ], 'La vegetación del norte "respira" con las estaciones. La tendencia de fondo, en cambio, la marcan las emisiones.', { d: 3 }),
      numv(3, (i) => { // e2
        const a1 = [1960, 1980, 2000][i];
        const v1 = [317, 339, 370][i];
        const a2 = 2020;
        const v2 = 414;
        return {
          enunciado: `Según la tabla, el CO₂ era de ${v1} ppm en ${a1} y de ${v2} ppm en ${a2}. ¿Cuántas ppm por año subió en promedio en ese período? Redondeá a un decimal.`,
          valor: Math.round(((v2 - v1) / (a2 - a1)) * 10) / 10,
          unidad: 'ppm por año',
          dec: 1,
          tol: 0.1,
          explicacion: `(${v2} − ${v1}) ÷ (${a2} − ${a1}) = ${v2 - v1} ÷ ${a2 - a1} ≈ ${(Math.round(((v2 - v1) / (a2 - a1)) * 10) / 10).toLocaleString('es-AR')} ppm por año. Y el ritmo fue acelerándose con las décadas.`,
        };
      }, { d: 3 }),
      vf('Si este invierno fue más frío que el anterior, el calentamiento global se detuvo.', false, 'Un invierno es tiempo, no clima. La tendencia se mira en décadas: puede haber años fríos dentro de una tendencia de calentamiento.', { // e3
        razones: ['+Porque un año es variabilidad y la tendencia se mide en décadas', '-Porque el calentamiento global solo ocurre en verano', '-Porque un solo invierno define el clima'],
        d: 2,
      }),
      teoria('Tiempo y clima', [
        'El tiempo es lo que pasa en la atmósfera en un lugar y un momento: la temperatura de hoy, la lluvia de esta semana. El clima es el promedio del tiempo durante muchos años, en general 30 o más.',
        'Una forma de recordarlo: el tiempo es tu humor de hoy; el clima es tu personalidad.',
      ]),
      clas('¿Es un dato de tiempo o de clima?', { // e4
        'Tiempo': ['Mañana va a llover en Rosario', 'Ayer hizo 38 °C en Santiago del Estero', 'Esta semana hubo mucho viento'],
        'Clima': ['Mendoza recibe en promedio unos 200 mm de lluvia por año', 'En los últimos 30 años aumentaron los días de calor extremo', 'El noreste es más húmedo que el oeste del país'],
      }, 'Clima son promedios y tendencias de muchos años. Tiempo, lo que pasa hoy.', { d: 1 }),
      cad('Armá la cadena de por qué elegir un período corto puede ocultar una tendencia.', [ // e5
        'Se elige un período que empieza en un año muy caluroso',
        'Los años siguientes son algo más fríos por variabilidad',
        'En ese tramo corto parece que la temperatura baja',
        'Se oculta la tendencia de largo plazo, que es de calentamiento',
      ], ['Los años calurosos hacen que la tendencia cambie de signo'], 'Elegir el punto de partida a conveniencia es una trampa clásica. Por eso las tendencias se miran en décadas.', { d: 3 }),
      teoria('Promedios móviles', [
        'Para ver mejor una tendencia se usan promedios móviles: en vez de graficar cada año, se grafica el promedio de, por ejemplo, 5 años alrededor de cada año. Así el zigzag se suaviza y la dirección general se ve mejor.',
      ]),
      ejemplo('Un promedio móvil de 3 años', 'Temperaturas medias (°C) de cinco años seguidos: 16,1; 16,5; 16,0; 16,6; 16,8.', [
        'Promedio de los años 1 a 3: (16,1 + 16,5 + 16,0) ÷ 3 = 16,2.',
        'Promedio de los años 2 a 4: (16,5 + 16,0 + 16,6) ÷ 3 = 16,37.',
        'Promedio de los años 3 a 5: (16,0 + 16,6 + 16,8) ÷ 3 = 16,47.',
      ], 'Los años sueltos suben y bajan; los promedios móviles suben de forma más pareja. Así se ve la tendencia.'),
      numv(3, (i) => { // e6
        const t = [[16.5, 16.0, 16.6], [15.2, 15.8, 15.5], [18.0, 18.4, 18.2]][i];
        const p = Math.round(((t[0] + t[1] + t[2]) / 3) * 100) / 100;
        return {
          enunciado: `Calculá el promedio de tres años con temperaturas medias de ${t.map((x) => x.toLocaleString('es-AR')).join('; ')} °C. Redondeá a dos decimales.`,
          valor: p,
          unidad: '°C',
          dec: 2,
          tol: 0.02,
          explicacion: `(${t.map((x) => x.toLocaleString('es-AR')).join(' + ')}) ÷ 3 ≈ ${p.toLocaleString('es-AR')} °C. Promediar varios años suaviza la variabilidad.`,
        };
      }, { d: 2 }),
      mult('¿Qué ayuda a ver una tendencia real en datos ambientales? Marcá todo.', [ // e7
        '+Mirar muchos años de datos',
        '+Usar promedios móviles',
        '+No elegir el punto de partida a conveniencia',
        '+Comparar con la variabilidad normal',
        '-Mirar solo el último mes',
      ], 'Un mes es ruido. Décadas, promedios y honestidad con el período muestran la tendencia.', { d: 2 }),
      op('Un gráfico muestra la lluvia de un año muy seco en una provincia. ¿Qué se puede concluir sobre su clima?', [
        'Poco: hacen falta muchos años para ver una tendencia',
        'Que la provincia se está convirtiendo en un desierto',
        ['Que el cambio climático no existe en esa provincia', 'Un año no alcanza para concluir nada sobre el clima, ni a favor ni en contra.'],
        'Que el año siguiente también va a ser seco',
      ], 'Un año es tiempo acumulado, no clima. El clima se lee en décadas.', { d: 2 }),
      par('Uní cada término con su significado.', [
        ['Variabilidad', 'Subidas y bajadas de corto plazo'],
        ['Tendencia', 'Dirección general a lo largo de muchos años'],
        ['Promedio móvil', 'Promedio de varios años alrededor de cada año'],
        ['Clima', 'Promedio del tiempo durante 30 años o más'],
      ], 'Cuatro términos para leer cualquier serie de datos ambientales.', { d: 2 }),
      det('Leé este tuit y marcá lo equivocado.', [ // e8
        ['El CO₂ en Mauna Loa pasó de unas 315 ppm en 1958 a más de 420 ppm hoy.', false],
        ['Esta semana hizo frío: el calentamiento global es un invento.', true, 'Una semana es tiempo, no clima. La tendencia se mide en décadas.'],
        ['La curva del CO₂ sube y baja cada año por la vegetación.', false],
        ['Si tomo solo de 2016 a 2018, la temperatura bajó, así que no hay calentamiento.', true, 'Elegir un tramo corto que empieza en un año muy caluroso oculta la tendencia.'],
      ], 'Tiempo contra clima, y tramos elegidos a conveniencia: las dos trampas más comunes.', { d: 3 }),
      comp('Completá.', 'El [tiempo] es lo que pasa hoy; el [clima] es el promedio de muchos años; y para ver una tendencia se usan promedios [móviles].', ['viento', 'pronóstico', 'fijos'], 'La diferencia clave para leer cualquier dato del clima.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Gráficos que engañan', 'Ejes recortados, escalas dobles, tramos elegidos y dibujos en 3D: cómo un gráfico puede decir algo que los datos no dicen.', [
      teoria('El eje recortado', [
        'Si el eje vertical de un gráfico de barras empieza en un número alto en vez de en cero, diferencias chicas parecen enormes. Una barra de 102 y otra de 100 pueden verse una el doble que la otra si el eje empieza en 98.',
        'En los gráficos de líneas no siempre es obligatorio empezar en cero, pero hay que mirar la escala para no exagerar ni esconder un cambio.',
      ]),
      ejemplo('El mismo dato, dos impresiones', 'Un municipio reciclaba 20 toneladas por mes y pasó a 22.', [
        'Con el eje desde 0: la barra de 22 es apenas un 10 % más alta que la de 20.',
        'Con el eje desde 19: la barra de 20 mide 1 unidad y la de 22 mide 3: parece el triple.',
      ], 'El dato es el mismo: 10 % más. El eje recortado hace que parezca un triunfo enorme.'),
      numv(3, (i) => { // e1
        const a = [20, 100, 50][i];
        const b = [22, 105, 55][i];
        const piso = [19, 98, 48][i];
        return {
          enunciado: `Dos barras valen ${a} y ${b}. Si el eje empieza en ${piso}, ¿cuántas veces más alta se ve la barra de ${b} que la de ${a}? Redondeá a un decimal.`,
          valor: Math.round(((b - piso) / (a - piso)) * 10) / 10,
          unidad: 'veces',
          dec: 1,
          tol: 0.1,
          explicacion: `Se ven ${b - piso} contra ${a - piso}: ${(Math.round(((b - piso) / (a - piso)) * 10) / 10).toLocaleString('es-AR')} veces. En realidad, ${b} es solo ${(Math.round(((b - a) / a) * 1000) / 10).toLocaleString('es-AR')} % más que ${a}.`,
        };
      }, { d: 3 }),
      vf('Si el eje de un gráfico de barras empieza en un número alto, las diferencias parecen más grandes de lo que son.', true, 'Las barras recortadas pierden la proporción: diferencias chicas parecen enormes. En barras, el eje debe empezar en cero.', { // e2
        razones: ['+Porque se pierde la proporción entre las barras', '-Porque las barras se vuelven más finas', '-Porque el eje recortado achica las diferencias'],
        d: 2,
      }),
      teoria('Otras trampas', [
        'Hay otros recursos que distorsionan: usar dos ejes verticales con escalas distintas para que dos líneas parezcan moverse juntas; elegir solo el tramo de años que conviene; comparar totales de países con poblaciones muy distintas sin pasar a "por persona"; usar íconos o dibujos en 3D donde el área crece mucho más que el valor; y no mostrar la fuente.',
      ]),
      par('Uní cada trampa con su efecto.', [ // e3
        ['Eje de barras que no empieza en cero', 'Exagera diferencias chicas'],
        ['Dos ejes con escalas distintas', 'Hace parecer relacionadas dos cosas'],
        ['Tramo de años elegido a conveniencia', 'Oculta la tendencia de largo plazo'],
        ['Íconos que crecen en alto y en ancho', 'El área crece mucho más que el valor'],
      ], 'Cuatro trampas frecuentes. Reconocerlas es la mejor defensa.', { d: 3 }),
      cad('Armá la cadena de por qué un ícono que duplica su altura engaña.', [ // e4
        'Un valor se duplica',
        'El dibujo se agranda al doble de alto y al doble de ancho',
        'Su área queda cuatro veces más grande',
        'El ojo percibe que el valor se cuadruplicó',
      ], ['El ojo solo mira la altura de los dibujos'], 'Por eso los gráficos con dibujos agrandados exageran los cambios.', { d: 3 }),
      clas('¿Es una práctica honesta o engañosa?', { // e5
        'Honesta': ['Mostrar la serie completa de años disponibles', 'Aclarar si los valores son totales o por persona', 'Citar la fuente de los datos'],
        'Engañosa': ['Recortar el eje de un gráfico de barras', 'Mostrar solo los años que confirman la idea', 'Usar dibujos en 3D que deforman las proporciones'],
      }, 'La honestidad en un gráfico es mostrar todo lo necesario para interpretarlo bien.', { d: 2 }),
      op('Un gráfico compara las emisiones totales de Argentina y de Uruguay y concluye que Argentina contamina mucho más. ¿Qué falta?', [ // e6
        'Comparar por persona, porque las poblaciones son muy distintas',
        'Ponerle colores más fuertes al gráfico',
        ['Nada: el total es la única forma válida de comparar', 'El total es útil, pero con poblaciones tan distintas, el dato por persona cambia la lectura.'],
        'Comparar con el año en que Uruguay ganó un Mundial',
      ], 'Argentina tiene más de diez veces la población de Uruguay. El total y el "por persona" responden preguntas distintas.', { d: 3 }),
      mult('¿Qué preguntas conviene hacerle a un gráfico sospechoso? Marcá todas.', [ // e7
        '+¿Dónde empieza el eje?',
        '+¿De qué período son los datos y por qué ese?',
        '+¿Son totales o por persona?',
        '+¿Cuál es la fuente?',
        '-¿Qué tan moderno es el diseño?',
      ], 'Cuatro preguntas que desarman la mayoría de los gráficos engañosos.', { d: 2 }),
      det('Leé esta descripción de un afiche y marcá lo que es engañoso.', [ // e8
        ['Muestra el reciclaje de la ciudad de 2015 a 2024.', false],
        ['El eje de las barras empieza en 18 toneladas.', true, 'Así, pasar de 20 a 22 parece triplicarse.'],
        ['Cita como fuente al área de ambiente del municipio.', false],
        ['Las bolsas dibujadas crecen en alto y en ancho según el valor.', true, 'El área crece mucho más que el valor y exagera el cambio.'],
      ], 'El dato puede ser real y el dibujo, engañoso.', { d: 3 }),
      comp('Completá.', 'En un gráfico de barras el eje tiene que empezar en [cero]; comparar países sin pasar a "por [persona]" puede engañar; y elegir solo algunos [años] oculta la tendencia.', ['cien', 'kilómetro', 'colores'], 'Tres trampas para detectar en cualquier gráfico.', { d: 2 }),
      rank('Ordená estos cambios reales de menor a mayor, aunque un gráfico recortado los muestre distinto.', [ // e10
        ['De 100 a 102', '+2 %'],
        ['De 20 a 22', '+10 %'],
        ['De 50 a 60', '+20 %'],
        ['De 10 a 15', '+50 %'],
      ], 'Calcular el cambio porcentual es la mejor forma de no depender del dibujo.', { d: 3, extremos: ['Menor cambio', 'Mayor cambio'] }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Promedio, mediana y extremos', 'Cuándo el promedio engaña, qué es la mediana y por qué los valores extremos importan.', [
      teoria('Promedio y mediana', [
        'El promedio (o media) se calcula sumando todos los valores y dividiendo por la cantidad. La mediana es el valor del medio cuando se ordenan los datos de menor a mayor: la mitad está por debajo y la mitad por encima.',
        'Si hay valores muy extremos, el promedio se mueve mucho y deja de representar a la mayoría. La mediana, en cambio, casi no cambia.',
      ]),
      ejemplo('El consumo de agua de una cuadra', 'Diez casas usan por día (litros): 300, 320, 350, 360, 380, 400, 420, 450, 480 y 5.000 (una casa con pileta y pérdida).', [
        'Promedio: la suma es 8.460; ÷ 10 = 846 litros.',
        'Mediana: ordenadas, las del medio son 380 y 400: (380 + 400) ÷ 2 = 390 litros.',
      ], 'El promedio (846) no representa a ninguna casa real: lo infla una sola. La mediana (390) describe mejor a la casa típica.'),
      numv(3, (i) => { // e1
        const d = [[3, 5, 7, 9, 41], [10, 12, 14, 16, 98], [2, 4, 4, 6, 24]][i];
        const prom = d.reduce((a, b) => a + b, 0) / 5;
        return {
          enunciado: `Calculá el promedio de estos datos: ${d.join(', ')}.`,
          valor: prom,
          unidad: '',
          dec: 1,
          explicacion: `(${d.join(' + ')}) ÷ 5 = ${prom.toLocaleString('es-AR')}. Un solo valor alto (${d[4]}) tira el promedio muy arriba de la mayoría.`,
        };
      }, { d: 1 }),
      numv(3, (i) => { // e2
        const d = [[3, 5, 7, 9, 41], [10, 12, 14, 16, 98], [2, 4, 4, 6, 24]][i];
        return {
          enunciado: `¿Cuál es la mediana de estos datos: ${d.join(', ')}?`,
          valor: d[2],
          unidad: '',
          explicacion: `Ordenados, el del medio es ${d[2]}. La mediana no se deja arrastrar por el valor extremo (${d[4]}).`,
        };
      }, { d: 2 }),
      vf('El promedio siempre describe bien al caso típico.', false, 'Si hay valores extremos, el promedio puede quedar lejos de casi todos los casos. Por eso, con datos muy desparejos, se usa la mediana.', { // e3
        razones: ['+Porque los valores extremos lo arrastran', '-Porque el promedio nunca cambia', '-Porque la mediana y el promedio son siempre iguales'],
        d: 2,
      }),
      clas('¿Conviene usar el promedio o la mediana?', { // e4
        'Mediana': ['Ingresos de las familias de un país', 'Consumo de agua de una cuadra con una casa que tiene pileta', 'Precio de las casas de un barrio con algunas mansiones'],
        'Promedio': ['Temperatura media de un mes', 'Altura de plantas de un experimento sin valores raros'],
      }, 'Con datos desparejos, la mediana. Con datos parejos, el promedio funciona bien y usa toda la información.', { d: 3 }),
      teoria('Los extremos importan', [
        'A veces lo más importante no es el valor típico sino los extremos. En el clima, un aumento chico del promedio de temperatura puede significar muchos más días de calor extremo. En la contaminación del aire, un promedio aceptable puede esconder días peligrosos.',
        'Por eso, además del promedio o la mediana, conviene mirar el rango (del mínimo al máximo) y cuántas veces se supera un umbral.',
      ]),
      cad('Armá la cadena de cómo un aumento chico del promedio multiplica los días extremos.', [ // e5
        'La temperatura promedio de un lugar sube 1 °C',
        'Toda la distribución de días se corre hacia arriba',
        'Días que antes eran apenas calurosos pasan a ser extremos',
        'Los días de calor extremo se vuelven mucho más frecuentes',
      ], ['Si sube el promedio, desaparecen los días fríos para siempre'], 'Un corrimiento chico del centro cambia mucho las colas. Por eso 1 °C más importa tanto.', { d: 3 }),
      mult('¿Qué datos conviene informar para describir bien la calidad del aire de un año? Marcá todos.', [ // e6
        '+El promedio anual',
        '+La cantidad de días que se superó el valor guía',
        '+El valor máximo',
        '+En qué condiciones ocurrieron los picos',
        '-Solo el dato del día más limpio',
      ], 'Un solo número no alcanza. El típico y los extremos cuentan historias distintas.', { d: 2 }),
      numv(3, (i) => { // e7
        const dias = [[12, 18, 25, 9, 30, 14, 20], [8, 16, 22, 17, 11, 19, 26], [5, 7, 18, 20, 9, 3, 16]][i];
        const u = 15;
        const n = dias.filter((x) => x > u).length;
        return {
          enunciado: `El PM2,5 de siete días fue: ${dias.join(', ')} µg/m³. ¿Cuántos días superó el valor guía diario de 15 µg/m³?`,
          valor: n,
          unidad: 'días',
          explicacion: `Superan 15: ${dias.filter((x) => x > u).join(', ')}. Son ${n} días de ${dias.length}. Contar superaciones dice más que un promedio.`,
        };
      }, { d: 2 }),
      op('En un barrio, casi todas las casas usan entre 300 y 450 litros por día y dos usan más de 4.000. ¿Qué número describe mejor a la casa típica?', [
        'La mediana',
        'El promedio',
        ['El valor máximo', 'El máximo describe a la casa que más usa, no a la típica.'],
        'La suma de todas las casas',
      ], 'Con dos valores extremos, la mediana representa mejor a la mayoría.', { d: 2 }),
      ord('Para encontrar la mediana, ordená estos consumos diarios (litros) de menor a mayor.', [
        '300',
        '380',
        '420',
        '480',
        '5.000',
      ], 'Ordenados, el del medio es 420: esa es la mediana. El promedio, en cambio, sería 1.316, arrastrado por la casa de 5.000.', { d: 1, extremos: ['Menor', 'Mayor'] }),
      det('Leé este informe y marcá lo cuestionable.', [ // e8
        ['La mediana del consumo de agua de la cuadra es 390 litros.', false],
        ['El promedio de 846 litros muestra que cada casa usa 846 litros.', true, 'Una sola casa con pileta y pérdida infla el promedio: ninguna casa típica usa eso.'],
        ['Una casa usa 5.000 litros por día.', false],
        ['Como el promedio anual de PM2,5 es aceptable, nunca hubo días malos.', true, 'El promedio puede esconder picos: hay que contar los días que superan el valor guía.'],
      ], 'Promedio, mediana y extremos: tres miradas que se complementan.', { d: 3 }),
      comp('Completá.', 'La [mediana] es el valor del medio; el [promedio] se deja arrastrar por los extremos; y a veces importa contar cuántas veces se supera un [umbral].', ['moda', 'rango', 'color'], 'Tres ideas para describir datos sin engañar.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Porcentajes, puntos y tasas', 'El doble de un riesgo mínimo, puntos porcentuales y datos por persona: las trampas de los números relativos.', [
      teoria('Porcentaje y puntos porcentuales', [
        'Si el reciclaje de una ciudad pasa del 10 % al 15 %, subió 5 puntos porcentuales, pero en términos relativos subió un 50 % (porque 5 es la mitad de 10). Las dos frases son ciertas, pero suenan muy distintas.',
        'Los puntos porcentuales miden la diferencia entre dos porcentajes; el cambio porcentual mide cuánto cambió respecto del valor inicial.',
      ]),
      numv(3, (i) => { // e1
        const a = [10, 20, 4][i];
        const b = [15, 25, 6][i];
        return {
          enunciado: `El reciclaje de una ciudad pasó del ${a} % al ${b} %. ¿En cuántos puntos porcentuales subió?`,
          valor: b - a,
          unidad: 'puntos porcentuales',
          explicacion: `${b} − ${a} = ${b - a} puntos porcentuales. En términos relativos, subió un ${((b - a) / a) * 100} %.`,
        };
      }, { d: 1 }),
      numv(3, (i) => { // e2
        const a = [10, 20, 4][i];
        const b = [15, 25, 6][i];
        return {
          enunciado: `Si el reciclaje pasó del ${a} % al ${b} %, ¿en qué porcentaje aumentó respecto del valor inicial?`,
          valor: ((b - a) / a) * 100,
          unidad: '%',
          explicacion: `(${b} − ${a}) ÷ ${a} × 100 = ${((b - a) / a) * 100} %. Mismo cambio, contado de otra forma: ${b - a} puntos o ${((b - a) / a) * 100} % más.`,
        };
      }, { d: 2 }),
      teoria('Riesgo relativo y absoluto', [
        'Un titular dice: "tal cosa duplica el riesgo de una enfermedad". Suena alarmante, pero depende del riesgo de partida. Si el riesgo pasa de 1 en 100.000 a 2 en 100.000, se duplicó (riesgo relativo), pero el aumento real es de 1 caso cada 100.000 personas (riesgo absoluto).',
        'Para entender un riesgo hacen falta los dos números: cuánto cambia y desde dónde.',
      ]),
      op('"Un producto duplica el riesgo de una enfermedad que afecta a 1 de cada 100.000 personas." ¿Qué significa en números absolutos?', [ // e3
        'Pasa de 1 a 2 casos cada 100.000 personas',
        'La mitad de las personas se va a enfermar',
        ['Pasa de 1 a 200.000 casos', 'Duplicar 1 es 2: el aumento absoluto es muy chico.'],
        'El 2 % de las personas se va a enfermar',
      ], 'El riesgo relativo impresiona; el absoluto dimensiona. Los dos juntos informan.', { d: 3 }),
      vf('Si un riesgo se duplica, siempre es un riesgo grande.', false, 'Depende del valor inicial. Duplicar un riesgo mínimo sigue siendo un riesgo chico en términos absolutos; duplicar uno alto es grave.', { // e4
        razones: ['+Porque depende de cuál era el riesgo de partida', '-Porque duplicar un riesgo lo hace del 100 %', '-Porque los riesgos nunca se duplican'],
        d: 2,
      }),
      teoria('Por persona', [
        'Comparar totales entre lugares de distinto tamaño engaña. China emite mucho más CO₂ total que Argentina, pero por persona la comparación cambia; y países chicos con mucho consumo pueden tener emisiones por persona muy altas aunque sus totales sean chicos.',
        'Las tasas por persona, por habitante o por cada 100.000 habitantes permiten comparar lugares de tamaños distintos. Los totales responden cuánto aporta cada lugar al problema global. Las dos miradas son útiles, para preguntas distintas.',
      ]),
      numv(3, (i) => { // e5
        const t = [180, 12, 5000][i];
        const p = [45, 3.5, 1400][i];
        return {
          enunciado: `Un país emite ${t.toLocaleString('es-AR')} millones de toneladas de CO₂ por año y tiene ${p.toLocaleString('es-AR')} millones de habitantes. ¿Cuántas toneladas por persona emite? Redondeá a un decimal.`,
          valor: Math.round((t / p) * 10) / 10,
          unidad: 't por persona',
          dec: 1,
          tol: 0.1,
          explicacion: `${t.toLocaleString('es-AR')} ÷ ${p.toLocaleString('es-AR')} ≈ ${(Math.round((t / p) * 10) / 10).toLocaleString('es-AR')} t por persona. El total y el "por persona" responden preguntas distintas.`,
        };
      }, { d: 2 }),
      clas('¿Para esta pregunta conviene el total o el dato por persona?', { // e6
        'Total': ['¿Qué países aportan más al calentamiento global?', '¿Cuánta basura tiene que procesar el relleno de la ciudad?'],
        'Por persona': ['¿En qué país se consume más energía por habitante?', '¿Qué ciudad genera más basura por vecino?'],
      }, 'Cada pregunta tiene su número. El error es usar uno para la pregunta del otro.', { d: 2 }),
      par('Uní cada frase con lo que realmente mide.', [ // e7
        ['Subió 5 puntos porcentuales', 'La diferencia entre dos porcentajes'],
        ['Subió un 50 %', 'El cambio respecto del valor inicial'],
        ['Duplica el riesgo', 'El riesgo relativo'],
        ['2 casos cada 100.000', 'El riesgo absoluto'],
      ], 'Cuatro formas de hablar de cambios. Confundirlas es muy fácil y muy común.', { d: 3 }),
      mult('¿Qué conviene preguntar ante un titular con porcentajes? Marcá todo.', [ // e8
        '+¿Es un cambio en puntos o en porcentaje?',
        '+¿Cuál era el valor de partida?',
        '+¿Es un total o un dato por persona?',
        '+¿Cuál es el riesgo absoluto?',
        '-¿Cuántas veces se compartió la nota?',
      ], 'Cuatro preguntas para no dejarse llevar por un número suelto.', { d: 2 }),
      det('Leé esta nota y marcá lo engañoso.', [ // e9
        ['El reciclaje pasó del 10 % al 12 % de los residuos.', false],
        ['Es decir, el reciclaje subió 20 puntos porcentuales.', true, 'Subió 2 puntos porcentuales; en términos relativos, un 20 %.'],
        ['La ciudad tiene 500.000 habitantes.', false],
        ['Como la ciudad vecina recicla más toneladas, recicla mejor por vecino.', true, 'Si tiene más habitantes, más toneladas no significa más por vecino.'],
      ], 'Puntos contra porcentaje y total contra por persona: las dos confusiones más frecuentes.', { d: 3 }),
      comp('Completá.', 'Pasar del 10 % al 15 % es subir 5 puntos [porcentuales]; duplicar un riesgo es un cambio [relativo]; y para comparar países de distinto tamaño se usan datos por [persona].', ['decimales', 'absoluto', 'kilómetro'], 'Tres claves para leer números relativos.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: leer gráficos y datos', 'Tipos de gráficos, tendencias, trampas, promedios y porcentajes, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el gráfico del concejal', 'Un concejal presenta un gráfico para mostrar un éxito ambiental. Revisalo con todo lo que aprendiste.', [
      teoria('El gráfico', [
        'El concejal muestra un gráfico de barras titulado "¡Triplicamos el reciclaje!". Las barras muestran 20 toneladas por mes en 2023 y 22 toneladas por mes en 2024. El eje vertical empieza en 19. No dice la fuente.',
        'Según datos del municipio, la ciudad genera unas 400 toneladas de residuos por mes, y la población creció de 100.000 a 104.000 habitantes entre esos años.',
      ]),
      num('¿En qué porcentaje aumentó realmente el reciclaje, de 20 a 22 toneladas por mes?', 10, '%', '(22 − 20) ÷ 20 × 100 = 10 %. No se triplicó: aumentó un 10 %.', { ctx: 'Reciclaje: 20 t/mes en 2023, 22 t/mes en 2024.', d: 2 }),
      num('¿Qué porcentaje de los residuos de la ciudad se recicla en 2024? (22 de 400 toneladas por mes)', 5.5, '%', '22 ÷ 400 × 100 = 5,5 %. El 94,5 % sigue yendo a disposición final.', { ctx: 'La ciudad genera 400 t/mes; recicla 22 t/mes.', dec: 1, d: 2 }),
      num('Con 22 toneladas por mes y 104.000 habitantes, ¿cuántos kilos por habitante por mes se reciclan? Redondeá a dos decimales.', 0.21, 'kg por habitante', '22 t = 22.000 kg; ÷ 104.000 ≈ 0,21 kg por habitante por mes. En 2023, con 100.000 habitantes y 20 t, eran 0,2 kg: la mejora por persona es todavía menor.', { dec: 2, tol: 0.01, d: 3 }),
      mult('¿Qué problemas tiene el gráfico del concejal? Marcá todos.', [ // e4
        '+El eje de las barras empieza en 19, no en cero',
        '+El título dice "triplicamos" cuando el aumento fue del 10 %',
        '+No cita la fuente',
        '+No aclara qué parte del total de residuos representa',
        '-Usa barras para comparar dos años',
      ], 'Comparar dos años con barras está bien. Lo engañoso es el eje recortado, el título y la falta de contexto.', { d: 3 }),
      op('¿Cuál sería un título honesto para el gráfico?', [ // e5
        'El reciclaje subió un 10 %, a 22 toneladas por mes',
        '¡Triplicamos el reciclaje de la ciudad en un año!',
        ['La ciudad ya recicla casi todo', 'Recicla el 5,5 % de sus residuos: está muy lejos de casi todo.'],
        'Somos la ciudad que más recicla del país',
      ], 'Un título honesto dice el cambio real, con su magnitud.', { d: 3 }),
      rank('Ordená estas formas de presentar el dato de la más honesta a la más engañosa.', [ // e6
        ['Barras desde cero, con fuente y el porcentaje del total', 'honesta y con contexto'],
        ['Barras desde cero, sin fuente', 'correcta pero incompleta'],
        ['Barras desde 19 con título "subimos un 10 %"', 'título honesto, dibujo exagerado'],
        ['Barras desde 19 con título "¡triplicamos!"', 'engañosa'],
      ], 'La honestidad está en el dibujo, en el título y en el contexto.', { d: 4, extremos: ['Más honesta', 'Más engañosa'] }),
      det('Un medio publica su análisis del gráfico. Marcá lo equivocado.', [ // e7
        ['El reciclaje aumentó un 10 %, no se triplicó.', false],
        ['El eje recortado hace que la barra de 2024 parezca el triple de la de 2023.', false],
        ['El reciclaje subió 10 puntos porcentuales.', true, 'Subió un 10 % en toneladas; como porcentaje de los residuos, pasó de 5 % a 5,5 %: medio punto.'],
        ['Como el reciclaje subió, el problema de la basura está resuelto.', true, 'Se recicla el 5,5 %: el resto sigue yendo a disposición final.'],
      ], 'Hasta un buen análisis puede confundir puntos con porcentajes. Revisar cada número es la tarea.', { d: 4 }),
    ]),
  ],
});
