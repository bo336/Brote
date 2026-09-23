import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// AIRE Y SUELO 1 — El aire que respirás.
// La base del aire: de qué está hecho, qué lo contamina, cómo afecta la
// salud, cómo se mide y qué pasa con el aire de adentro de las casas y las
// aulas. Retoma leer un número ambiental (tronco-2) y la energía que se
// quema (energia-1, si ya la hiciste).

export default unidad({
  slug: 'aire-suelo-1',
  rama: 'aire_suelo',
  orden: 1,
  nivel: 1,
  requiereTronco: 1,
  titulo: 'El aire que respirás',
  bajada: 'Respirás unos 11.000 litros de aire por día. De qué está hecho, qué lo ensucia, cómo afecta tu salud y cómo se mide.',
  objetivos: [
    'Describir la composición del aire y las capas de la atmósfera',
    'Identificar los principales contaminantes del aire y sus fuentes',
    'Relacionar la contaminación del aire con la salud según la OMS',
    'Interpretar mediciones e índices de calidad del aire',
    'Reconocer los riesgos del aire interior, en especial el monóxido de carbono',
  ],
  repasa: ['tronco-2'],
  fuentes: ['oms-calidad-aire', 'oms-aire-exterior', 'oms-aire-hogar', 'noaa-co2', 'epa', 'ncse-ozono'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('De qué está hecho el aire', 'Nitrógeno, oxígeno, un poco de argón y una pizca de CO₂: la mezcla que nos rodea y las capas de la atmósfera.', [
      teoria('Una mezcla de gases', [
        'El aire seco es una mezcla: alrededor del 78 % es nitrógeno, el 21 % oxígeno y casi el 1 % argón. El dióxido de carbono es una parte muy chica, hoy algo más de 0,04 % (más de 420 partes por millón). Además hay vapor de agua, en cantidad variable, y partículas en suspensión.',
        'Que el CO₂ sea una parte tan chica no quiere decir que no importe: pequeñas cantidades de algunos gases tienen efectos enormes sobre el clima, como viste en el tronco.',
      ], {
        datos: barras('Composición del aire seco', '% del volumen', [
          ['Nitrógeno', 78.1],
          ['Oxígeno', 20.9],
          ['Argón', 0.93],
          ['Dióxido de carbono', 0.04],
        ], 'Valores aproximados. El vapor de agua varía entre casi 0 y 4 % según el lugar y el momento.'),
      }),
      rank('Ordená estos gases por su proporción en el aire seco, de más a menos.', [ // e1
        ['Nitrógeno', '≈ 78 %'],
        ['Oxígeno', '≈ 21 %'],
        ['Argón', '≈ 0,9 %'],
        ['Dióxido de carbono', '≈ 0,04 %'],
      ], 'El gas que más respiramos no es el oxígeno: es el nitrógeno, que entra y sale de los pulmones sin cambios.', { d: 1 }),
      est('Estimá cuántas partes por millón (ppm) de CO₂ tiene hoy el aire del planeta.', 425, { min: 100, max: 1000, paso: 5, unidad: 'ppm' }, 'Más de 420 ppm, según las mediciones de la NOAA en Mauna Loa. Antes de la Revolución Industrial eran unas 280 ppm.', { d: 3 }),
      teoria('Partes por millón', [
        'Para gases que están en cantidades chicas se usa la unidad partes por millón (ppm): cuántas moléculas de ese gas hay en un millón de moléculas de aire. 420 ppm de CO₂ significa 420 moléculas de CO₂ por cada millón de moléculas de aire, o sea 0,042 %.',
        'Para pasar de ppm a porcentaje se divide por 10.000.',
      ]),
      numv(3, (i) => { // e3
        const ppm = [420, 280, 1000][i];
        return {
          enunciado: `Un aire tiene ${ppm.toLocaleString('es-AR')} ppm de CO₂. ¿A qué porcentaje equivale?`,
          valor: ppm / 10000,
          unidad: '%',
          dec: 3,
          explicacion: `${ppm.toLocaleString('es-AR')} ÷ 10.000 = ${(ppm / 10000).toLocaleString('es-AR')} %. Las ppm son cómodas para cantidades tan chicas.`,
        };
      }, { d: 2 }),
      teoria('Las capas de la atmósfera', [
        'La atmósfera tiene capas. La más baja, la troposfera, llega hasta unos 10 a 15 kilómetros de altura: ahí está casi todo el aire que respiramos, las nubes y el clima. Encima está la estratosfera, donde se encuentra la capa de ozono, que filtra buena parte de la radiación ultravioleta del sol.',
        'El ozono es bueno allá arriba, porque nos protege, pero es un contaminante cuando se forma cerca del suelo, como vas a ver en esta unidad.',
      ]),
      par('Uní cada capa o componente con su característica.', [ // e4
        ['Troposfera', 'Capa donde ocurre el clima'],
        ['Estratosfera', 'Capa donde está la capa de ozono'],
        ['Capa de ozono', 'Filtra la radiación ultravioleta'],
        ['Vapor de agua', 'Componente variable que forma nubes'],
      ], 'La atmósfera es fina comparada con la Tierra, pero cada capa cumple una función.', { d: 2 }),
      vf('El ozono es siempre bueno para la vida.', false, 'En la estratosfera nos protege de la radiación ultravioleta. Cerca del suelo, en cambio, es un contaminante que irrita los pulmones y daña cultivos.', { // e5
        razones: ['+Porque cerca del suelo es un contaminante', '-Porque el ozono no existe en la atmósfera', '-Porque el ozono solo se encuentra dentro de las casas'],
        d: 2,
      }),
      teoria('Respirar mucho aire', [
        'Una persona adulta en reposo respira unas 12 a 16 veces por minuto, moviendo alrededor de medio litro de aire en cada respiración. En un día, eso suma del orden de 10.000 a 12.000 litros de aire, y mucho más si hace ejercicio.',
        'Por eso, aunque un contaminante esté en cantidades chicas, a lo largo del día entra mucho en los pulmones.',
      ]),
      numv(3, (i) => { // e6
        const resp = [12, 15, 16][i];
        const l = 0.5;
        return {
          enunciado: `Una persona respira ${resp} veces por minuto y mueve ${l.toLocaleString('es-AR')} litros de aire en cada respiración. ¿Cuántos litros respira en un día de 1.440 minutos?`,
          valor: resp * l * 1440,
          unidad: 'litros',
          explicacion: `${resp} × ${l.toLocaleString('es-AR')} × 1.440 = ${(resp * l * 1440).toLocaleString('es-AR')} litros por día. Un volumen enorme que pasa por los pulmones todos los días.`,
        };
      }, { d: 2 }),
      mult('¿Qué hay en el aire además de gases? Marcá todo lo que corresponde.', [ // e7
        '+Polvo y partículas finas',
        '+Polen',
        '+Gotas de agua en las nubes',
        '+Hollín de la combustión',
        '-Nada, el aire es solo gas',
      ], 'Las partículas suspendidas en el aire son parte de lo que respiramos, y algunas son muy dañinas.', { d: 1 }),
      det('Leé esta explicación y marcá lo equivocado.', [ // e8
        ['El aire tiene alrededor de 21 % de oxígeno.', false],
        ['El gas más abundante del aire es el oxígeno.', true, 'El más abundante es el nitrógeno, con alrededor del 78 %.'],
        ['El CO₂ está en una proporción muy chica, más de 420 ppm.', false],
        ['Como el CO₂ es tan poco, no puede afectar el clima.', true, 'Pequeñas cantidades de gases de efecto invernadero tienen grandes efectos.'],
      ], 'Poco no quiere decir sin importancia: la dosis y el efecto no siempre van juntos.', { d: 2 }),
      est('Estimá hasta qué altura aproximada llega la troposfera, la capa donde está casi todo el aire que respiramos.', 12, { min: 1, max: 100, paso: 1, unidad: 'km' }, 'Entre unos 10 y 15 kilómetros, según la latitud. Si la Tierra fuera una pelota de fútbol, esa capa sería más fina que una hoja de papel.', { d: 3 }),
      mult('¿Cuáles de estos gases del aire son de efecto invernadero? Marcá todos.', [
        '+Dióxido de carbono',
        '+Vapor de agua',
        '+Metano',
        '-Nitrógeno',
        '-Argón',
      ], 'Los gases más abundantes, nitrógeno y oxígeno, no retienen calor. Los que sí lo hacen están en cantidades chicas, como viste en el tronco.', { d: 2 }),
      comp('Completá.', 'El aire seco tiene alrededor de 78 % de [nitrógeno] y 21 % de [oxígeno]; el CO₂ se mide en partes por [millón].', ['hidrógeno', 'ozono', 'litro'], 'La composición del aire, resumida en una línea.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Qué ensucia el aire', 'Partículas, óxidos de nitrógeno, ozono y monóxido: los contaminantes principales y de dónde salen.', [
      teoria('Los contaminantes principales', [
        'La Organización Mundial de la Salud sigue varios contaminantes clave. El material particulado (PM), formado por partículas diminutas de polvo, hollín y otras sustancias: el PM10 tiene partículas de menos de 10 micrómetros y el PM2,5, de menos de 2,5 micrómetros, tan chicas que llegan al fondo de los pulmones y a la sangre.',
        'También el dióxido de nitrógeno (NO₂), que sale sobre todo de los motores; el ozono de superficie (O₃), que se forma con sol a partir de otros contaminantes; el dióxido de azufre (SO₂), de combustibles con azufre; y el monóxido de carbono (CO), de combustiones incompletas.',
      ]),
      par('Uní cada contaminante con su fuente principal en una ciudad.', [ // e1
        ['Dióxido de nitrógeno (NO₂)', 'Motores de autos, colectivos y camiones'],
        ['Material particulado (PM2,5)', 'Hollín de motores diésel, quemas y polvo'],
        ['Ozono de superficie', 'Reacciones con sol entre otros contaminantes'],
        ['Dióxido de azufre (SO₂)', 'Combustibles con azufre en industrias'],
      ], 'El tránsito aparece en casi todos. Por eso el aire suele ser peor en las avenidas.', { d: 2 }),
      teoria('Qué tan chico es chico', [
        'Un micrómetro es la milésima parte de un milímetro. Un pelo humano mide unos 50 a 70 micrómetros de diámetro. Una partícula de PM2,5 es unas 20 a 30 veces más fina que un pelo.',
        'Cuanto más chica es la partícula, más profundo llega en el cuerpo: las PM10 quedan en la nariz y los bronquios; las PM2,5 llegan a los alvéolos y pueden pasar a la sangre.',
      ]),
      rank('Ordená por tamaño, de más grande a más chico.', [ // e2
        ['Un grano de arena fina', '≈ 100 micrómetros'],
        ['Un pelo humano', '≈ 50-70 micrómetros'],
        ['Una partícula PM10', 'menos de 10 micrómetros'],
        ['Una partícula PM2,5', 'menos de 2,5 micrómetros'],
      ], 'Las partículas más peligrosas son invisibles una por una. Se ven solo cuando hay muchísimas, como smog.', { d: 2 }),
      numv(3, (i) => { // e3
        const pelo = [60, 70, 50][i];
        return {
          enunciado: `Un pelo mide ${pelo} micrómetros de diámetro. ¿Cuántas veces más fino es una partícula de 2,5 micrómetros?`,
          valor: pelo / 2.5,
          unidad: 'veces',
          explicacion: `${pelo} ÷ 2,5 = ${pelo / 2.5} veces. Por eso las PM2,5 pasan las defensas de la nariz y llegan al fondo de los pulmones.`,
        };
      }, { d: 2 }),
      teoria('Las fuentes', [
        'En las ciudades, la fuente más importante suele ser el tránsito, sobre todo los motores diésel viejos. También aportan las industrias, la generación de electricidad con combustibles fósiles, la calefacción, la quema de basura y de residuos de poda, y las obras. En zonas rurales y en algunas regiones del país pesan las quemas de pastizales y los incendios.',
        'Muchas de estas fuentes son las mismas que emiten gases de efecto invernadero: cuidar el aire y cuidar el clima suelen ir juntos.',
      ]),
      clas('¿Es una fuente de contaminación del aire exterior o interior?', { // e4
        'Exterior': ['Colectivo diésel viejo', 'Quema de basura en un baldío', 'Chimenea de una fábrica'],
        'Interior': ['Estufa a leña sin buena salida', 'Humo de cigarrillo dentro de casa', 'Calefón mal instalado'],
      }, 'El aire de adentro también se contamina, y ahí pasamos la mayor parte del día.', { d: 2 }),
      cad('Armá la cadena de cómo se forma el ozono de superficie en un día de verano.', [ // e5
        'Los autos emiten óxidos de nitrógeno y otros gases',
        'El sol fuerte ilumina esos gases',
        'Reaccionan y forman ozono cerca del suelo',
        'El ozono irrita los pulmones de quienes respiran ese aire',
      ], ['El ozono baja desde la estratosfera a las calles'], 'Por eso el ozono de superficie suele ser peor en días soleados y calurosos, a la tarde.', { d: 3 }),
      vf('Cuidar el aire y cuidar el clima no tienen nada que ver.', false, 'Muchas fuentes de contaminación del aire —motores, centrales a carbón o gas, quemas— son también fuentes de gases de efecto invernadero. Reducirlas ayuda a los dos.', { // e6
        razones: ['+Porque muchas fuentes contaminan el aire y emiten gases de efecto invernadero', '-Porque el aire y el clima son lo mismo', '-Porque el CO₂ es el principal contaminante que respiramos'],
        d: 2,
      }),
      mult('¿Cuáles de estas acciones reducen la contaminación del aire en una ciudad? Marcá todas.', [ // e7
        '+Renovar colectivos diésel viejos por eléctricos',
        '+Prohibir la quema de basura y de restos de poda',
        '+Más ciclovías y transporte público',
        '+Controlar las emisiones de las industrias',
        '-Ensanchar avenidas para que entren más autos',
      ], 'Más autos suelen ser más contaminación. Las demás medidas atacan las fuentes.', { d: 2 }),
      op('¿Por qué el aire suele estar más contaminado en una avenida con mucho tránsito que en una plaza a dos cuadras?', [ // e8
        'Porque los motores emiten justo ahí',
        'Porque en las plazas hay más oxígeno puro',
        ['Porque los árboles de la plaza absorben todos los contaminantes', 'Ayudan un poco, pero la diferencia principal es la cercanía a la fuente.'],
        'Porque en las avenidas hace más frío',
      ], 'La concentración es mayor cerca de la fuente. Caminar por calles paralelas a las avenidas reduce lo que se respira.', { d: 2 }),
      det('Leé este posteo y marcá lo equivocado.', [ // e9
        ['Las partículas PM2,5 son más finas que un pelo.', false],
        ['El CO₂ es el contaminante que más daña los pulmones en la calle.', true, 'El CO₂ afecta el clima; en la calle, los más dañinos para la salud son las partículas, el NO₂ y el ozono.'],
        ['Los motores diésel viejos emiten mucho hollín.', false],
        ['El ozono solo existe en la estratosfera.', true, 'También se forma cerca del suelo, donde es un contaminante.'],
      ], 'Contaminantes del aire y gases de efecto invernadero se superponen, pero no son lo mismo.', { d: 3 }),
      comp('Completá.', 'Las partículas [PM2,5] son tan chicas que llegan a la sangre; el [NO₂] sale sobre todo de los motores; y el ozono de superficie se forma con [sol].', ['PM100', 'CO₂', 'lluvia'], 'Tres contaminantes clave del aire urbano, con sus rasgos.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Aire y salud', 'Por qué la OMS considera la contaminación del aire uno de los mayores riesgos ambientales para la salud.', [
      teoria('Un riesgo enorme', [
        'Según la Organización Mundial de la Salud, la contaminación del aire exterior y la del aire de los hogares, juntas, se asocian con unos 7 millones de muertes prematuras por año en el mundo. Además, casi toda la población mundial —alrededor del 99 %— vive en lugares donde el aire supera los valores guía de la OMS.',
        'La contaminación del aire aumenta el riesgo de enfermedades respiratorias como el asma y la EPOC, de infartos, de accidentes cerebrovasculares y de cáncer de pulmón.',
      ], { destacado: { valor: '≈ 99 %', texto: 'de la población mundial vive donde el aire supera los valores guía de la OMS.' } }),
      est('Estimá cuántas muertes prematuras por año asocia la OMS con la contaminación del aire exterior y doméstico juntas.', 7000000, { min: 10000, max: 100000000, unidad: 'muertes', escala: 'log' }, 'Alrededor de 7 millones por año. Es uno de los mayores riesgos ambientales para la salud en todo el mundo.', { d: 3 }),
      mult('¿Qué problemas de salud se asocian con la contaminación del aire? Marcá todos.', [ // e2
        '+Asma y otras enfermedades respiratorias',
        '+Infartos',
        '+Accidentes cerebrovasculares',
        '+Cáncer de pulmón',
        '-Fracturas de huesos',
      ], 'Las partículas finas no solo afectan los pulmones: al pasar a la sangre, afectan el corazón y los vasos sanguíneos.', { d: 2 }),
      teoria('Los valores guía', [
        'En 2021, la OMS actualizó sus directrices de calidad del aire y las hizo más estrictas, porque la evidencia mostró daños incluso con niveles bajos. Para las partículas PM2,5, recomienda no superar un promedio anual de 5 microgramos por metro cúbico (µg/m³) y un promedio diario de 15 µg/m³. Para el NO₂, un promedio anual de 10 µg/m³.',
        'Muchas ciudades del mundo están muy por encima de estos valores. Los países fijan sus propias normas, que suelen ser menos estrictas que las guías de la OMS.',
      ], {
        datos: tabla('Valores guía de la OMS (2021), algunos ejemplos', ['Contaminante', 'Promedio', 'Valor guía'], [
          ['PM2,5', 'Anual', '5 µg/m³'],
          ['PM2,5', 'Diario (24 h)', '15 µg/m³'],
          ['PM10', 'Anual', '15 µg/m³'],
          ['NO₂', 'Anual', '10 µg/m³'],
        ]),
      }),
      numv(3, (i) => { // e3
        const v = [15, 25, 10][i];
        return {
          enunciado: `Una ciudad tiene un promedio anual de PM2,5 de ${v} µg/m³. ¿Cuántas veces supera el valor guía anual de la OMS (5 µg/m³)?`,
          valor: v / 5,
          unidad: 'veces',
          explicacion: `${v} ÷ 5 = ${v / 5} veces el valor guía. La OMS bajó este valor en 2021 porque la evidencia muestra daños aun en niveles bajos.`,
        };
      }, { d: 2 }),
      vf('Si el aire de una ciudad cumple la norma de su país, seguro cumple con las guías de la OMS.', false, 'Las normas nacionales suelen ser menos estrictas que las guías de la OMS. Una ciudad puede cumplir su norma y superar igual los valores guía.', { // e4
        razones: ['+Porque las normas nacionales suelen ser menos estrictas', '-Porque la OMS no publica valores guía', '-Porque todas las normas del mundo son idénticas'],
        d: 3,
      }),
      teoria('Quiénes son más vulnerables', [
        'La contaminación afecta a todos, pero más a los niños (respiran más aire por kilo de peso y sus pulmones se están formando), a las personas mayores, a quienes tienen enfermedades respiratorias o cardíacas y a las embarazadas.',
        'También a quienes viven o trabajan junto a avenidas, industrias o basurales, que muchas veces son los barrios más pobres. Por eso la calidad del aire es también un tema de justicia ambiental.',
      ]),
      clas('¿Esta persona es más vulnerable a la contaminación del aire o no especialmente?', { // e5
        'Más vulnerable': ['Una nena de 4 años', 'Un abuelo con EPOC', 'Una embarazada que vive junto a una avenida'],
        'No especialmente': ['Un adulto sano que vive lejos de avenidas', 'Una joven sana en una zona con aire limpio'],
      }, 'La vulnerabilidad depende de la edad, la salud y dónde se vive y trabaja.', { d: 2 }),
      cad('Armá el camino de una partícula PM2,5 en el cuerpo.', [ // e6
        'Se respira aire con partículas finas',
        'Las partículas pasan la nariz y los bronquios',
        'Llegan a los alvéolos de los pulmones',
        'Algunas pasan a la sangre',
        'Pueden inflamar vasos sanguíneos y afectar el corazón',
      ], ['Las partículas se disuelven en la nariz sin efecto'], 'Por eso la contaminación del aire no es solo un problema respiratorio.', { d: 3 }),
      op('En un día con muy mala calidad del aire, ¿qué conviene para un chico con asma?', [ // e7
        'Evitar el ejercicio intenso al aire libre ese día',
        'Hacer más ejercicio afuera para fortalecer los pulmones',
        ['Abrir todas las ventanas de la casa', 'Si el aire de afuera está muy contaminado, conviene ventilar en otros momentos.'],
        'Quedarse cerca de la avenida para tomar aire',
      ], 'En días de mala calidad del aire, se recomienda reducir la actividad física intensa al aire libre, sobre todo a los más vulnerables.', { d: 2 }),
      det('Leé esta nota y marcá lo equivocado.', [ // e8
        ['La OMS asocia la contaminación del aire con millones de muertes por año.', false],
        ['La contaminación del aire solo afecta los pulmones.', true, 'También afecta el corazón y los vasos sanguíneos.'],
        ['Los niños son especialmente vulnerables.', false],
        ['Si la ciudad cumple su norma nacional, el aire es perfecto.', true, 'Las normas suelen ser menos estrictas que las guías de la OMS.'],
      ], 'El aire es un tema de salud pública, y también de justicia.', { d: 3 }),
      comp('Completá.', 'La OMS recomienda que el promedio anual de PM2,5 no supere [5] µg/m³; alrededor del [99] % de la población vive donde se superan los valores guía.', ['50', '9', '1'], 'Dos números que muestran el tamaño del problema del aire.', { d: 2 }),
      par('Uní cada grupo con por qué es más vulnerable.', [ // e10
        ['Niños', 'Respiran más aire por kilo y sus pulmones se están formando'],
        ['Personas mayores', 'Suelen tener más enfermedades del corazón o los pulmones'],
        ['Personas con asma', 'Sus vías respiratorias reaccionan con más facilidad'],
        ['Vecinos de avenidas', 'Están más expuestos a los contaminantes'],
      ], 'Distintas razones, mismo resultado: más riesgo con el mismo aire.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Medir el aire', 'Estaciones de monitoreo, microgramos por metro cúbico e índices de colores: cómo leer la calidad del aire.', [
      teoria('Cómo se mide', [
        'La calidad del aire se mide con estaciones de monitoreo que toman muestras de aire y miden la concentración de cada contaminante. Las partículas y muchos gases se expresan en microgramos por metro cúbico (µg/m³): cuántos millonésimos de gramo de contaminante hay en un metro cúbico de aire.',
        'Varias ciudades argentinas tienen estaciones de monitoreo y publican sus datos. También existen sensores de bajo costo que usan vecinos y escuelas, menos precisos pero útiles para ver tendencias.',
      ]),
      op('¿Qué significa que el PM2,5 de un día fue 30 µg/m³?', [ // e1
        '30 millonésimos de gramo por metro cúbico',
        'Que el 30 % del aire eran partículas finas',
        ['Que hubo 30 partículas en toda la ciudad', 'Es una concentración: masa de partículas por volumen de aire.'],
        'Que la temperatura del aire fue de 30 °C',
      ], 'Microgramos por metro cúbico: masa de contaminante en un volumen de aire.', { d: 2 }),
      teoria('Los índices de colores', [
        'Como los números de cada contaminante son difíciles de interpretar, muchas ciudades publican un índice de calidad del aire: una escala que resume los contaminantes en un número y un color, de "bueno" (verde) a "peligroso" (violeta o bordó), con recomendaciones para cada nivel.',
        'Los índices cambian según el país, pero la lógica es la misma: el color dice qué tan preocupante es el aire y qué conviene hacer.',
      ]),
      ord('Ordená estas categorías típicas de un índice de calidad del aire, de mejor a peor.', [ // e2
        'Buena (verde)',
        'Moderada (amarilla)',
        'Dañina para grupos sensibles (naranja)',
        'Dañina para la salud (roja)',
        'Muy dañina (violeta)',
      ], 'Cada color trae una recomendación. En naranja, los más vulnerables ya deberían cuidarse.', { d: 1, extremos: ['Mejor', 'Peor'] }),
      teoria('Promedios que engañan', [
        'Un promedio anual puede ocultar días muy malos. Una ciudad con un promedio aceptable puede tener picos peligrosos en días sin viento, con quemas cercanas o con inversión térmica, cuando una capa de aire caliente encima atrapa la contaminación cerca del suelo.',
        'Por eso se miran promedios diarios, anuales y picos, como viste en el tronco al leer números ambientales.',
      ]),
      numv(3, (i) => { // e3
        const dias = [[10, 12, 8, 60, 10], [20, 18, 22, 90, 20], [5, 6, 7, 40, 7]][i];
        const prom = dias.reduce((a, b) => a + b, 0) / dias.length;
        return {
          enunciado: `En cinco días, el PM2,5 promedio diario fue ${dias.join(', ')} µg/m³. ¿Cuál es el promedio de los cinco días?`,
          valor: prom,
          unidad: 'µg/m³',
          dec: 1,
          explicacion: `(${dias.join(' + ')}) ÷ 5 = ${prom.toLocaleString('es-AR')} µg/m³. Pero un día fue de ${Math.max(...dias)}: el promedio esconde el pico.`,
        };
      }, { d: 2 }),
      cad('Armá la cadena de cómo una inversión térmica empeora el aire.', [ // e4
        'Una noche fría y sin viento enfría el suelo',
        'Queda una capa de aire más caliente encima del aire frío',
        'Esa capa funciona como una tapa',
        'Los contaminantes no se dispersan hacia arriba',
        'Se acumulan cerca del suelo y el aire empeora',
      ], ['El aire caliente de arriba limpia el aire de abajo'], 'Es común en invierno en ciudades rodeadas de sierras o en valles.', { d: 3 }),
      vf('Si el promedio anual de PM2,5 de una ciudad es bajo, nunca hay días de aire malo.', false, 'El promedio puede ocultar picos: días sin viento, quemas o inversiones térmicas pueden tener niveles muy altos aunque el promedio sea aceptable.', { // e5
        razones: ['+Porque el promedio puede ocultar picos muy altos', '-Porque el promedio anual es el valor de todos los días', '-Porque el aire no cambia de un día a otro'],
        d: 2,
      }),
      clas('¿Esta situación suele empeorar o mejorar la calidad del aire?', { // e6
        'Empeora': ['Noche fría sin viento', 'Quema de pastizales cercana', 'Hora pico de tránsito'],
        'Mejora': ['Viento fuerte', 'Lluvia que lava las partículas', 'Día sin clases ni tránsito'],
      }, 'El clima del día y las actividades humanas se combinan para definir el aire que se respira.', { d: 2 }),
      par('Uní cada herramienta con para qué sirve.', [ // e7
        ['Estación de monitoreo oficial', 'Medir con precisión y generar datos oficiales'],
        ['Sensor de bajo costo', 'Ver tendencias en un barrio o una escuela'],
        ['Índice de colores', 'Comunicar rápido qué tan bueno es el aire'],
        ['Valor guía de la OMS', 'Comparar con un nivel recomendado para la salud'],
      ], 'Medir, comunicar y comparar: tres pasos para que un dato sirva.', { d: 2 }),
      mult('¿Qué datos conviene mirar para saber si el aire de tu barrio es un problema? Marcá todos.', [ // e8
        '+El promedio anual de PM2,5',
        '+Los días que se superó el valor guía diario',
        '+Los picos y en qué condiciones ocurren',
        '+La comparación con los valores guía de la OMS',
        '-Solo el dato de un día de viento fuerte',
      ], 'Un solo día no alcanza: hace falta mirar promedios, picos y comparar con una referencia.', { d: 2 }),
      det('Leé este informe barrial y marcá lo equivocado.', [ // e9
        ['El sensor midió 12 µg/m³ de PM2,5 un día ventoso.', false],
        ['Por eso el aire del barrio es excelente todo el año.', true, 'Un día ventoso no representa el año: hay que mirar promedios y picos.'],
        ['En días fríos sin viento, los valores subieron.', false],
        ['Los sensores de bajo costo son tan precisos como las estaciones oficiales.', true, 'Son útiles para ver tendencias, pero menos precisos.'],
      ], 'Un dato sin contexto puede llevar a conclusiones equivocadas.', { d: 3 }),
      comp('Completá.', 'Las partículas se miden en microgramos por metro [cúbico]; una capa de aire caliente que atrapa la contaminación es una inversión [térmica].', ['cuadrado', 'solar', 'lineal'], 'Dos ideas clave para leer datos de calidad del aire.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('El aire de adentro', 'Monóxido de carbono, humo, leña y aulas cerradas: el aire que respiramos la mayor parte del día.', [
      teoria('Pasamos el día adentro', [
        'La mayoría de las personas pasa gran parte del día dentro de casas, escuelas, oficinas y vehículos. El aire de adentro puede estar más contaminado que el de afuera: humo de cigarrillo, combustión de estufas, cocinas y calefones, humedad y hongos, productos de limpieza y aire viciado por falta de ventilación.',
        'Según la OMS, la contaminación del aire en los hogares por cocinar y calefaccionar con combustibles sólidos (leña, carbón) o querosén causa millones de muertes por año en el mundo, sobre todo en países de ingresos bajos.',
      ]),
      mult('¿Qué fuentes contaminan el aire dentro de una casa? Marcá todas.', [ // e1
        '+Humo de cigarrillo',
        '+Estufas y calefones mal instalados',
        '+Cocinar con leña sin buena salida de humo',
        '+Humedad y hongos',
        '-Una planta en maceta',
      ], 'El aire interior se contamina con la combustión, el tabaco y la humedad. Las plantas no son una fuente de contaminación.', { d: 1 }),
      teoria('Monóxido de carbono: el asesino silencioso', [
        'El monóxido de carbono (CO) es un gas sin color, sin olor y sin sabor que se produce cuando un combustible se quema con poco oxígeno: estufas, calefones, braseros, hornos y cocinas en mal estado o en ambientes sin ventilación. Se une a la sangre en lugar del oxígeno y puede matar en poco tiempo.',
        'Cada invierno causa muertes evitables en Argentina. Las señales de alarma son dolor de cabeza, mareos, náuseas y somnolencia en varias personas a la vez. La llama de los artefactos debería ser azul: una llama amarilla o anaranjada indica mala combustión.',
      ], { destacado: { valor: 'Llama azul', texto: 'indica buena combustión. Llama amarilla o anaranjada: revisar el artefacto.' } }),
      op('¿Por qué el monóxido de carbono es tan peligroso?', [ // e2
        'Porque no se nota y desplaza al oxígeno',
        'Porque tiene un olor tan fuerte que desmaya',
        ['Porque solo aparece en las fábricas', 'Aparece en cualquier casa con artefactos a gas o leña mal instalados o sin ventilación.'],
        'Porque hace que la llama se vuelva azul',
      ], 'No da aviso: por eso las rejillas de ventilación y la revisión de artefactos salvan vidas.', { d: 2 }),
      clas('¿Esta señal indica posible riesgo de monóxido de carbono o no?', { // e3
        'Posible riesgo': ['Llama amarilla en la hornalla', 'Manchas negras sobre una estufa', 'Varias personas con dolor de cabeza y mareo en la misma habitación'],
        'Sin riesgo particular': ['Llama azul y pareja', 'Rejillas de ventilación libres', 'Estufa de tiro balanceado revisada'],
      }, 'Llama amarilla, hollín y síntomas en grupo son señales para apagar, ventilar y pedir ayuda.', { d: 2 }),
      ord('Ordená qué hacer ante una sospecha de intoxicación con monóxido de carbono.', [ // e4
        'Abrir puertas y ventanas',
        'Apagar los artefactos si es posible',
        'Salir al aire libre',
        'Llamar a emergencias',
        'Hacer revisar los artefactos por un gasista matriculado antes de volver a usarlos',
      ], 'Ventilar, salir y pedir ayuda. Después, revisar todo con un profesional.', { d: 2, extremos: ['Primero', 'Último'] }),
      vf('Un brasero encendido en un dormitorio cerrado es una forma segura de calefaccionar.', false, 'Es una de las causas más comunes de intoxicación por monóxido de carbono. Nunca se usan braseros ni hornallas para calefaccionar ambientes cerrados.', { // e5
        razones: ['+Porque produce monóxido de carbono en un ambiente sin ventilación', '-Porque los braseros no producen calor', '-Porque el monóxido solo se produce al aire libre'],
        d: 1,
      }),
      teoria('Aire viciado en las aulas', [
        'Cuando muchas personas comparten un espacio cerrado, el CO₂ que exhalan se acumula. El CO₂ en esos niveles no es tóxico, pero funciona como un indicador: si sube mucho, quiere decir que el aire no se está renovando, y con él se acumulan otras cosas, como virus y humedad.',
        'Muchas guías usan como referencia no superar unos 800 a 1.000 ppm de CO₂ en aulas y oficinas. Afuera, el aire tiene algo más de 420 ppm.',
      ]),
      numv(3, (i) => { // e6
        const aula = [1800, 1400, 2200][i];
        return {
          enunciado: `Un medidor en un aula cerrada marca ${aula.toLocaleString('es-AR')} ppm de CO₂. Si la referencia es no superar 1.000 ppm, ¿cuántas ppm por encima está?`,
          valor: aula - 1000,
          unidad: 'ppm',
          explicacion: `${aula.toLocaleString('es-AR')} − 1.000 = ${(aula - 1000).toLocaleString('es-AR')} ppm por encima. Es una señal de que hay que ventilar, por ejemplo abriendo ventanas enfrentadas unos minutos.`,
        };
      }, { d: 1 }),
      cad('Armá la cadena de qué pasa en un aula cerrada durante una clase larga.', [ // e7
        'Treinta personas respiran en un aula con ventanas cerradas',
        'El CO₂ exhalado se acumula',
        'El aire no se renueva',
        'Se acumulan también humedad y posibles virus',
        'Aumentan el cansancio y el riesgo de contagios',
      ], ['El CO₂ se transforma en oxígeno dentro del aula'], 'Medir el CO₂ es una forma barata de saber cuándo ventilar.', { d: 2 }),
      mult('¿Qué mejora el aire interior? Marcá todo lo que ayuda.', [ // e8
        '+Ventilar abriendo ventanas enfrentadas unos minutos',
        '+Mantener libres las rejillas de ventilación',
        '+No fumar adentro',
        '+Revisar los artefactos a gas cada año',
        '-Tapar las rejillas para que no entre frío',
      ], 'Ventilar y revisar artefactos: dos hábitos simples que protegen la salud y la vida.', { d: 1 }),
      det('Leé este mensaje de un grupo de padres y marcá lo equivocado.', [ // e9
        ['Conviene ventilar el aula unos minutos cada hora.', false],
        ['El CO₂ del aula es un veneno mortal a 1.500 ppm.', true, 'A esos niveles no es tóxico; es un indicador de mala ventilación.'],
        ['La llama de la estufa del aula tiene que ser azul.', false],
        ['Si la estufa tiene llama amarilla, es más calentita y está mejor.', true, 'La llama amarilla indica mala combustión y posible monóxido de carbono.'],
      ], 'El CO₂ es un indicador; el monóxido de carbono es el verdadero peligro de la combustión.', { d: 3 }),
      comp('Completá.', 'El monóxido de carbono no tiene [olor] ni color; la llama de los artefactos tiene que ser [azul]; y las [rejillas] de ventilación nunca se tapan.', ['peso', 'amarilla', 'ventanas'], 'Tres reglas que salvan vidas cada invierno.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: el aire que respirás', 'Composición, contaminantes, salud, mediciones y aire interior, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el aire de la escuela de la avenida', 'Una escuela junto a una avenida midió su aire. Interpretá los datos y armá un plan. Aprobalo para hacer crecer la rama.', [
      teoria('Los datos', [
        'Una escuela está sobre una avenida con mucho tránsito de colectivos. Un grupo de estudiantes midió con un sensor durante un mes. En la vereda, el PM2,5 promedió 28 µg/m³, con picos de 60 en la hora de entrada. En el patio del fondo, a 60 metros de la avenida, promedió 14. En las aulas, el CO₂ llegaba a 1.800 ppm al final de las clases con las ventanas cerradas.',
        'En invierno, el aula de música se calefacciona con una estufa vieja con llama amarilla.',
      ]),
      num('¿Cuántas veces supera el promedio de la vereda (28 µg/m³) el valor guía diario de la OMS para PM2,5 (15 µg/m³)? Redondeá a un decimal.', 1.9, 'veces', '28 ÷ 15 ≈ 1,9 veces. Y en la hora de entrada, los picos de 60 son 4 veces el valor guía.', { ctx: 'Vereda: 28 µg/m³ de PM2,5 promedio; guía diaria OMS: 15.', dec: 1, tol: 0.1, d: 2 }),
      num('¿En qué porcentaje baja el PM2,5 del patio del fondo (14) respecto de la vereda (28)?', 50, '%', '(28 − 14) ÷ 28 × 100 = 50 %. Alejarse 60 metros de la avenida reduce a la mitad lo que se respira.', { ctx: 'Vereda: 28 µg/m³. Patio del fondo: 14 µg/m³.', d: 2 }),
      rank('Ordená los problemas de la escuela por urgencia, del más urgente al menos.', [ // e3
        ['Estufa con llama amarilla en el aula de música', 'riesgo de monóxido: urgente'],
        ['Aulas a 1.800 ppm de CO₂ sin ventilar', 'mala ventilación diaria'],
        ['Picos de PM2,5 en la vereda a la hora de entrada', 'exposición diaria breve'],
        ['PM2,5 del patio del fondo por encima de la guía anual', 'exposición moderada'],
      ], 'Primero lo que puede matar hoy; después lo que afecta la salud todos los días.', { d: 4 }),
      op('¿Qué conviene hacer ya con la estufa del aula de música?', [ // e4
        'Dejar de usarla hasta que la revise un gasista matriculado',
        'Usarla solo con la puerta cerrada para que caliente más',
        ['Seguir usándola porque la llama amarilla calienta más', 'La llama amarilla indica mala combustión y riesgo de monóxido de carbono.'],
        'Taparle la salida para que no se escape el calor',
      ], 'Ante una llama amarilla, no se usa hasta que un profesional la revise.', { d: 2 }),
      mult('¿Qué medidas del plan son razonables? Marcá todas.', [ // e5
        '+Ventilar las aulas unos minutos en cada recreo',
        '+Hacer la fila de entrada en el patio del fondo',
        '+Pedir al municipio prioridad para colectivos menos contaminantes en esa avenida',
        '+Seguir midiendo para ver si las medidas funcionan',
        '-Cerrar todas las ventanas para que no entre el aire de la avenida',
      ], 'Cerrar todo empeora el CO₂ y la ventilación. Conviene ventilar y alejar a los chicos de la fuente en los momentos pico.', { d: 3 }),
      cad('Armá la cadena de por qué mover la fila de entrada al patio del fondo ayuda.', [ // e6
        'La fila se arma lejos de la avenida',
        'Los chicos esperan donde el PM2,5 es la mitad',
        'Respiran menos partículas en el momento de más tránsito',
        'Baja su exposición diaria sin costo',
      ], ['El patio del fondo filtra el aire de la avenida'], 'Una medida gratis que usa los datos medidos: la distancia a la fuente importa.', { d: 3 }),
      det('La escuela publica su plan. Marcá lo equivocado.', [ // e7
        ['La estufa del aula de música no se usa hasta que la revise un gasista.', false],
        ['Como el CO₂ de las aulas es veneno, suspendemos las clases.', true, 'A esos niveles no es tóxico: indica que hay que ventilar.'],
        ['La fila de entrada se hará en el patio del fondo.', false],
        ['Para que no entre el aire de la avenida, no ventilaremos nunca.', true, 'Sin ventilar, empeora el aire interior. Mejor ventilar en momentos de menos tránsito.'],
      ], 'Un buen plan interpreta bien cada dato y prioriza lo urgente.', { d: 4 }),
    ]),
  ],
});
