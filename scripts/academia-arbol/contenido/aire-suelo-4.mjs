import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// AIRE Y SUELO 4 — El clima que cambia.
// Qué cambió ya (temperatura, océano, hielo, mar), cómo cambian los extremos
// y qué dice la ciencia de atribución, los impactos en Argentina, mitigación
// y adaptación, y qué futuro depende de las decisiones de hoy. Retoma el
// efecto invernadero (aire-suelo-3), los glaciares (agua-6) y el suelo
// (aire-suelo-2).

export default unidad({
  slug: 'aire-suelo-4',
  rama: 'aire_suelo',
  orden: 4,
  nivel: 2,
  requiereTronco: 2,
  titulo: 'El clima que cambia',
  bajada: 'Mares que suben, olas de calor más frecuentes, glaciares que retroceden: lo que ya cambió, cómo nos afecta en Argentina y qué se puede hacer.',
  objetivos: [
    'Describir los cambios observados en temperatura, océano, hielo y nivel del mar',
    'Explicar cómo el calentamiento cambia la frecuencia de los extremos',
    'Interpretar un estudio de atribución y sus límites',
    'Reconocer impactos del cambio climático en distintas regiones de Argentina',
    'Distinguir mitigación y adaptación, y comparar escenarios de futuro',
  ],
  repasa: ['aire-suelo-3', 'agua-6', 'aire-suelo-2', 'tronco-3'],
  fuentes: ['ipcc-ar6', 'ipcc-ar6-syr', 'ipcc-sr15', 'noaa-nivel-mar', 'wmo-clima-2024', 'wwa-atribucion', 'inventario-glaciares', 'ley-26639-glaciares', 'acuerdo-paris', 'carbon-brief'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Lo que ya cambió', 'Un océano que guarda el calor, hielo que se derrite y un mar que sube cada vez más rápido.', [
      teoria('El océano guarda casi todo', [
        'Cuando se habla del calentamiento, se suele pensar en el aire. Pero según el IPCC, alrededor del 91 % del calor extra que acumuló el planeta en las últimas décadas fue a parar al océano. El aire se llevó apenas un 1 %; el resto calentó los continentes y derritió hielo. El océano es el gran acumulador del calentamiento.',
      ], {
        datos: barras('A dónde fue el calor extra acumulado por el planeta (aproximado)', '%', [
          ['Océano', 91],
          ['Continentes', 5],
          ['Derretir hielo', 3],
          ['Atmósfera', 1],
        ], 'IPCC AR6; valores redondeados.'),
      }),
      rank('Ordená dónde se acumuló el calor extra del planeta, de mayor a menor.', [ // e1
        ['Océano', '≈ 91 %'],
        ['Continentes', '≈ 5 %'],
        ['Derretir hielo', '≈ 3 %'],
        ['Atmósfera', '≈ 1 %'],
      ], 'El aire, donde medimos el calentamiento todos los días, guarda apenas una fracción mínima del calor extra.', { d: 2 }),
      vf('Como el aire guarda solo el 1 % del calor extra, el calentamiento es menor de lo que parece.', false, 'Es al revés: el océano esconde la mayor parte. Ese calor dilata el agua, derrite hielo desde abajo, afecta a los arrecifes y seguirá influyendo en el clima por siglos.', { // e2
        razones: ['+Porque el océano acumula la mayor parte y sus efectos duran siglos', '-Porque el calor del océano desaparece solo', '-Porque el aire es lo único que importa'],
        d: 3,
      }),
      teoria('El nivel del mar', [
        'El nivel medio del mar subió unos 20 cm entre 1901 y 2018. Sube por dos motivos: el agua se dilata al calentarse, y se suma el agua de glaciares y de las grandes capas de hielo de Groenlandia y la Antártida. Además, el ritmo se aceleró: pasó de alrededor de 1,3 mm por año a comienzos del siglo XX a unos 3,7 mm por año entre 2006 y 2018.',
      ]),
      clas('¿Esto hace subir el nivel del mar o no?', { // e3
        'Hace subir el mar': ['El agua del océano se dilata al calentarse', 'Se derriten glaciares de montaña', 'Se derrite hielo de Groenlandia'],
        'No hace subir el mar': ['Se derrite hielo que ya flotaba en el mar', 'Llueve más sobre el océano en una tormenta'],
      }, 'El hielo que ya flota desplaza su propio peso en agua: al derretirse, casi no cambia el nivel. El hielo sobre tierra sí lo sube.', { d: 3 }),
      numv(3, (i) => { // e4
        const anos = [20, 30, 50][i];
        return {
          enunciado: `Si el mar sube 3,7 mm por año, ¿cuántos centímetros sube en ${anos} años? Redondeá a un decimal.`,
          valor: Math.round(3.7 * anos) / 10,
          unidad: 'cm',
          dec: 1,
          tol: 0.1,
          explicacion: `3,7 × ${anos} = ${(3.7 * anos).toLocaleString('es-AR')} mm = ${(Math.round(3.7 * anos) / 10).toLocaleString('es-AR')} cm. Y el ritmo sigue acelerándose, así que la cuenta real será mayor.`,
        };
      }, { d: 2 }),
      teoria('Hielo en retirada', [
        'Casi todos los glaciares de montaña del mundo están retrocediendo, incluidos los de los Andes. El hielo marino del Ártico se redujo mucho en extensión y espesor desde que se mide con satélites, en 1979. Groenlandia y la Antártida pierden hielo, y su aporte al nivel del mar crece.',
      ]),
      cad('Armá la cadena de por qué se acelera el aumento del nivel del mar.', [ // e5
        'Se acumula más calor en el océano',
        'El agua se dilata y el hielo se derrite más rápido',
        'Groenlandia y la Antártida aportan cada vez más agua',
        'El nivel del mar sube cada año un poco más rápido',
      ], ['El hielo marino flotante eleva el mar al derretirse'], 'Más calor acumulado significa más dilatación y más deshielo: la subida se acelera.', { d: 2 }),
      op('¿Por qué el mar seguirá subiendo durante siglos aunque se frenen las emisiones?', [ // e6
        'El océano profundo y el hielo reaccionan lento',
        'Porque el agua de lluvia se acumula en los océanos',
        ['Porque la Luna atrae cada vez más agua', 'La Luna causa mareas, pero no una subida de largo plazo.'],
        'Porque los ríos traen cada vez más agua',
      ], 'El calor ya acumulado seguirá dilatando el agua y derritiendo hielo. Por eso, cuanto antes se frene, menor será la subida final.', { d: 3 }),
      par('Uní cada cambio con su dato.', [ // e7
        ['Calor extra en el océano', 'Alrededor del 91 %'],
        ['Subida del mar 1901–2018', 'Unos 20 cm'],
        ['Ritmo reciente del mar', 'Unos 3,7 mm por año'],
        ['Temperatura global', 'Unos 1,2 °C más'],
      ], 'Cuatro números que resumen lo que ya cambió.', { d: 2 }),
      det('Leé este resumen y marcá lo equivocado.', [ // e8
        ['El océano absorbió la mayor parte del calor extra.', false],
        ['El nivel del mar sube siempre al mismo ritmo.', true, 'El ritmo se aceleró: de 1,3 a unos 3,7 mm por año.'],
        ['Casi todos los glaciares de montaña retroceden.', false],
        ['Si el hielo que flota en el mar se derrite, el mar sube muchísimo.', true, 'El hielo que ya flota casi no cambia el nivel al derretirse.'],
      ], 'Entender por qué sube el mar evita confusiones comunes.', { d: 2 }),
      mult('¿Qué cambios ya se observan en el planeta? Marcá todos.', [ // e9
        '+El océano se calienta',
        '+El nivel del mar sube',
        '+Los glaciares retroceden',
        '-El hielo del Ártico aumenta cada año',
        '-La temperatura global bajó desde 1900',
      ], 'Muchos indicadores distintos, medidos por separado, muestran el mismo calentamiento.', { d: 1 }),
      comp('Completá.', 'Alrededor del 91 % del calor extra fue al [océano]; el mar sube porque el agua se [dilata] y se derrite hielo; y entre 1901 y 2018 subió unos [20] cm.', ['aire', 'congela', '200'], 'Tres datos centrales de los cambios que ya ocurrieron.', { d: 1 }),
      ord('Ordená el ritmo de subida del mar, del más lento al más rápido.', [ // e11
        'Comienzos del siglo XX: unos 1,3 mm por año',
        'Fines del siglo XX: unos 1,9 mm por año',
        'Entre 2006 y 2018: unos 3,7 mm por año',
      ], 'En alrededor de un siglo, el ritmo de subida del mar casi se triplicó.', { d: 1, extremos: ['Más lento', 'Más rápido'] }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Extremos más frecuentes', 'Olas de calor, lluvias intensas y sequías: cómo un grado de más cambia los eventos extremos, y qué es la atribución.', [
      teoria('Un grado cambia mucho', [
        'Un aumento de un grado en el promedio parece poco, pero corre toda la distribución de temperaturas: los días que antes eran extremos se vuelven más comunes, y aparecen extremos que antes casi no existían. Según el IPCC, un calor extremo que en la época preindustrial ocurría una vez cada 10 años hoy ocurre unas 2,8 veces en ese lapso, y con 2 °C de calentamiento ocurriría unas 5,6 veces.',
      ], {
        datos: barras('Veces que ocurre, cada 10 años, un calor extremo que antes pasaba una vez por década', 'veces', [
          ['Clima preindustrial', 1],
          ['Hoy (≈ 1 °C)', 2.8],
          ['Con 1,5 °C', 4.1],
          ['Con 2 °C', 5.6],
          ['Con 4 °C', 9.4],
        ], 'IPCC AR6, Resumen para responsables de políticas.'),
      }),
      numv(3, (i) => { // e1
        const [nivel, veces] = [['1,5 °C', 4.1], ['2 °C', 5.6], ['4 °C', 9.4]][i];
        return {
          enunciado: `Con ${nivel} de calentamiento, un calor extremo que antes ocurría una vez por década ocurriría ${veces.toLocaleString('es-AR')} veces por década. ¿Cuántas veces ocurriría en 50 años?`,
          valor: Math.round(veces * 5 * 10) / 10,
          unidad: 'veces',
          dec: 1,
          tol: 0.1,
          explicacion: `50 años son 5 décadas: ${veces.toLocaleString('es-AR')} × 5 = ${(Math.round(veces * 5 * 10) / 10).toLocaleString('es-AR')}. En el clima preindustrial habrían sido 5 veces.`,
        };
      }, { d: 2 }),
      teoria('Lluvias más intensas', [
        'El aire más cálido puede contener más vapor de agua: aproximadamente un 7 % más por cada grado. Ese vapor extra puede caer de golpe, así que en muchas regiones las lluvias intensas se vuelven más fuertes y más frecuentes. Al mismo tiempo, en otras regiones, el calor aumenta la evaporación y empeora las sequías. Más calor intensifica los dos extremos del ciclo del agua.',
      ]),
      numv(3, (i) => { // e2
        const g = [1, 2, 3][i];
        return {
          enunciado: `Si el aire puede contener un 7 % más de vapor por cada grado, ¿cuánto vapor más podría contener, aproximadamente, con ${g} ${g === 1 ? 'grado' : 'grados'} más? Usá la suma simple.`,
          valor: 7 * g,
          unidad: '%',
          explicacion: `${g} × 7 % = ${7 * g} %, en cuenta simple (en realidad se compone y es un poco más). Ese vapor extra alimenta lluvias más intensas.`,
        };
      }, { d: 2 }),
      cad('Armá la cadena de por qué el calentamiento intensifica las lluvias fuertes.', [ // e3
        'La atmósfera se calienta',
        'El aire puede contener más vapor de agua',
        'Las tormentas tienen más agua disponible',
        'Caen lluvias más intensas en poco tiempo',
        'Aumentan las inundaciones repentinas',
      ], ['El aire caliente contiene menos agua'], 'Un grado más significa más agua en el aire, lista para caer.', { d: 2 }),
      vf('Si el cambio climático intensifica las lluvias, no puede empeorar las sequías.', false, 'Puede hacer las dos cosas: más lluvia intensa en algunos lugares y momentos, y más evaporación y sequías en otros. El calor intensifica los extremos del ciclo del agua.', { // e4
        razones: ['+Porque el calor intensifica los dos extremos del ciclo del agua', '-Porque las sequías no tienen relación con la temperatura', '-Porque llueve igual en todo el mundo'],
        d: 3,
      }),
      teoria('La ciencia de la atribución', [
        'Después de un evento extremo, equipos como World Weather Attribution estiman cuánto cambió su probabilidad por el calentamiento. Comparan el clima actual con un clima simulado sin calentamiento humano. Por ejemplo, encontraron que el calor récord de diciembre de 2022 en Argentina y países vecinos se volvió alrededor de 60 veces más probable por el cambio climático.',
        'Pero no todo se explica así: sobre la gran sequía de 2022–2023 en Argentina, el mismo tipo de estudio concluyó que la falta de lluvia se debió sobre todo a La Niña, aunque las temperaturas más altas probablemente empeoraron sus efectos. La atribución es rigurosa justamente porque a veces dice "no fue el clima".',
      ]),
      op('¿Qué hace un estudio de atribución?', [ // e5
        'Estima cuánto cambió la probabilidad de un evento',
        'Decide quién tiene la culpa legal de un desastre',
        ['Predice el tiempo de la semana que viene', 'Eso es un pronóstico; la atribución analiza eventos que ya pasaron.'],
        'Mide la lluvia caída en una estación',
      ], 'Compara el mundo real con uno sin calentamiento humano para estimar cuánto influyó el clima.', { d: 2 }),
      mult('¿Qué conclusiones son correctas sobre la atribución? Marcá todas.', [ // e6
        '+Compara el clima actual con uno sin calentamiento humano',
        '+Puede concluir que el clima influyó poco en un evento',
        '+Estimó que el calor de diciembre de 2022 fue unas 60 veces más probable',
        '-Dice que todo evento extremo es culpa del cambio climático',
        '-Solo se puede hacer muchos años después del evento',
      ], 'La atribución no culpa al clima de todo: mide su influencia en cada caso.', { d: 3 }),
      num('Si un evento tenía una probabilidad de 1 en 600 por año sin calentamiento y ahora es 60 veces más probable, ¿"1 en cuántos" años es ahora?', 10, 'años', '600 ÷ 60 = 10: pasó de ser un evento de 1 en 600 años a uno de 1 en 10 años. Algo casi imposible se vuelve un riesgo con el que hay que planificar.', { ctx: 'Probabilidad de 1 en 600 por año, 60 veces más probable.', d: 3 }),
      par('Uní cada extremo con su relación con el calentamiento.', [ // e8
        ['Olas de calor', 'Más frecuentes e intensas'],
        ['Lluvias intensas', 'Más vapor de agua en el aire'],
        ['Sequías', 'Más evaporación en zonas secas'],
        ['Incendios forestales', 'Vegetación más seca y más calor'],
      ], 'Cada extremo responde al calentamiento por un mecanismo distinto.', { d: 2 }),
      det('Leé este titular y su bajada y marcá lo equivocado.', [ // e9
        ['El calor extremo es más frecuente que en la época preindustrial.', false],
        ['Cualquier tormenta fuerte es 100 % culpa del cambio climático.', true, 'Hay que estudiar cada caso: la atribución estima cuánto influyó.'],
        ['El aire cálido contiene más vapor de agua.', false],
        ['La sequía de 2022–2023 se explicó solo por el cambio climático.', true, 'El estudio atribuyó la falta de lluvia sobre todo a La Niña.'],
      ], 'Exagerar también desinforma. La ciencia de la atribución es precisa y matizada.', { d: 3 }),
      rank('Ordená estos niveles de calentamiento según cuántas veces por década ocurriría un calor extremo que antes pasaba una vez, de menos a más.', [ // e11
        ['Clima preindustrial', '1 vez'],
        ['Hoy, con alrededor de 1 °C', '≈ 2,8 veces'],
        ['Con 1,5 °C', '≈ 4,1 veces'],
        ['Con 2 °C', '≈ 5,6 veces'],
      ], 'Cada medio grado suma más días de calor extremo: la frecuencia no crece de a poco, se multiplica.', { d: 2, extremos: ['Menos frecuente', 'Más frecuente'] }),
      comp('Completá.', 'El aire puede contener alrededor de un [7] % más de vapor por grado; un estudio de [atribución] estima cuánto influyó el clima en un evento; y la sequía de 2022–2023 se explicó sobre todo por La [Niña].', ['70', 'pronóstico', 'Luna'], 'Tres claves para hablar con precisión de los eventos extremos.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('El cambio climático en Argentina', 'Glaciares, ríos de Cuyo, lluvias en la llanura, calor urbano, costas y mosquitos: los impactos de región en región.', [
      teoria('Glaciares y agua de montaña', [
        'Argentina tiene miles de glaciares a lo largo de la cordillera, registrados en el Inventario Nacional de Glaciares. La mayoría está retrocediendo. En Cuyo, los ríos que riegan viñedos, huertas y ciudades dependen en gran parte de la nieve y el hielo de la montaña. Cuando nieva menos y los glaciares se achican, llega menos agua en los meses secos. En la última década, la región central de los Andes sufrió una sequía prolongada.',
        'La Ley 26.639, de 2010, protege los glaciares y el ambiente periglacial como reservas de agua.',
      ]),
      cad('Armá la cadena de cómo el calentamiento afecta el agua en Mendoza.', [ // e1
        'Sube la temperatura en la cordillera',
        'Nieva menos y los glaciares se achican',
        'Llega menos agua a los ríos en verano',
        'Hay menos agua para riego y ciudades',
      ], ['Los glaciares crecen con el calor'], 'En zonas áridas, la montaña es el tanque de agua. Si se achica, la ciudad y el campo lo sienten.', { d: 2 }),
      teoria('Más lluvia en la llanura', [
        'Durante la segunda mitad del siglo XX, las lluvias aumentaron en gran parte del este y el noreste del país. Eso permitió extender la agricultura hacia el oeste, pero también trajo más inundaciones. Además, las lluvias intensas se volvieron más frecuentes en muchas zonas, y las olas de calor, más largas y frecuentes, sobre todo en el norte y el centro.',
      ]),
      clas('¿Qué impacto corresponde a cada región?', { // e2
        'Cuyo y la cordillera': ['Menos nieve y ríos con menos agua', 'Glaciares que retroceden'],
        'Llanura pampeana y litoral': ['Más inundaciones por lluvias intensas', 'Frontera agrícola que se corrió al oeste'],
        'Costa atlántica y Río de la Plata': ['Erosión costera y sudestadas más dañinas', 'Subida del nivel del mar'],
      }, 'El cambio climático no se siente igual en todo el país: cada región tiene sus riesgos.', { d: 2 }),
      teoria('Ciudades, calor y salud', [
        'En las ciudades, las olas de calor se sienten más por el efecto isla de calor. Afectan sobre todo a personas mayores, bebés, personas con enfermedades crónicas y quienes trabajan al aire libre. El Servicio Meteorológico Nacional emite alertas por calor extremo.',
        'Además, el mosquito que transmite el dengue se expandió hacia el sur en las últimas décadas. Temperaturas más altas y lluvias lo favorecen, junto con otros factores como los recipientes con agua estancada y la urbanización. La temporada 2023–2024 fue la mayor epidemia de dengue registrada en el país.',
      ]),
      op('¿Qué grupo es más vulnerable a una ola de calor?', [ // e3
        'Las personas mayores que viven solas',
        'Los adultos jóvenes que trabajan en oficinas',
        ['Quienes viven en zonas frías del sur', 'También pueden sufrir, pero el riesgo mayor lo tienen personas con menos capacidad de regular su temperatura.'],
        'Quienes tienen aire acondicionado en casa',
      ], 'Las personas mayores regulan peor su temperatura y, si viven solas, nadie advierte a tiempo los síntomas.', { d: 2 }),
      mult('¿Qué factores favorecen la expansión del dengue? Marcá todos.', [ // e4
        '+Temperaturas más altas',
        '+Recipientes con agua estancada',
        '+Lluvias que dejan charcos y cacharros llenos',
        '-Las heladas prolongadas',
        '-La falta total de agua',
      ], 'El clima ayuda al mosquito, pero la prevención en cada casa sigue siendo clave: sin agua estancada no hay criaderos.', { d: 2 }),
      vf('El dengue se expande solo por el cambio climático.', false, 'El clima influye, pero también la urbanización, el agua estancada en recipientes, los viajes y el control del mosquito. Hay varias causas a la vez.', { // e5
        razones: ['+Porque influyen también otros factores, como el agua estancada', '-Porque el clima no tiene ninguna relación', '-Porque el dengue no existe en Argentina'],
        d: 2,
      }),
      numv(3, (i) => { // e6
        const [antes, ahora] = [[3, 9], [4, 10], [2, 8]][i];
        return {
          enunciado: `Si una ciudad tenía en promedio ${antes} días de ola de calor por verano y ahora tiene ${ahora}, ¿cuántas veces más días tiene?`,
          valor: Math.round((ahora / antes) * 10) / 10,
          unidad: 'veces',
          dec: 1,
          tol: 0.1,
          explicacion: `${ahora} ÷ ${antes} = ${(Math.round((ahora / antes) * 10) / 10).toLocaleString('es-AR')} veces. Datos ficticios, pero la tendencia a más días de calor extremo es real en muchas ciudades del país.`,
          ctx: `De ${antes} a ${ahora} días de ola de calor por verano.`,
        };
      }, { d: 1 }),
      par('Uní cada impacto con una región o sistema de Argentina.', [ // e7
        ['Menos agua de deshielo', 'Oasis de riego de Cuyo'],
        ['Erosión y sudestadas', 'Costa bonaerense'],
        ['Expansión del dengue', 'Ciudades del centro y norte'],
        ['Más inundaciones', 'Llanura pampeana'],
      ], 'Conocer los impactos locales ayuda a planificar la adaptación en cada lugar.', { d: 2 }),
      est('Estimá en qué año se sancionó la Ley de Glaciares en Argentina.', 2010, { min: 1950, max: 2025, paso: 1, unidad: '' }, 'En 2010: la Ley 26.639 protege glaciares y ambiente periglacial como reservas estratégicas de agua.', { d: 2 }),
      det('Leé este informe y marcá lo equivocado.', [ // e9
        ['En Cuyo, los ríos dependen en gran parte de la nieve y los glaciares.', false],
        ['Los glaciares argentinos están creciendo en su mayoría.', true, 'La mayoría está retrocediendo.'],
        ['Las lluvias aumentaron en gran parte del este del país en el siglo XX.', false],
        ['Las olas de calor afectan a todas las personas por igual.', true, 'Afectan más a mayores, bebés, enfermos crónicos y trabajadores al aire libre.'],
      ], 'Los impactos son desiguales entre regiones y entre personas.', { d: 2 }),
      op('En Mendoza, ¿por qué preocupa tanto un invierno con poca nieve en la cordillera?', [ // e11
        'Los ríos del verano dependen de esa nieve',
        'Porque la nieve es necesaria para el turismo de playa',
        ['Porque en verano llueve muchísimo en el llano', 'Es al revés: Mendoza es árida y el verano depende del deshielo.'],
        'Porque sin nieve los glaciares crecen más rápido',
      ], 'La nieve del invierno es el agua del verano: se derrite de a poco y alimenta ríos, canales y acequias.', { d: 2 }),
      comp('Completá.', 'En Cuyo, el agua de riego depende de la [nieve] y los glaciares; en la llanura aumentaron las [inundaciones]; y el mosquito del [dengue] se expandió hacia el sur.', ['arena', 'heladas', 'paludismo'], 'Tres impactos del cambio climático en distintas regiones del país.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Mitigar y adaptarse', 'Reducir las emisiones y prepararse para lo que ya viene: dos respuestas necesarias y complementarias.', [
      teoria('Dos respuestas', [
        'Frente al cambio climático hay dos tipos de respuesta. Mitigar es reducir las causas: emitir menos gases o absorber más carbono. Adaptarse es prepararse para los impactos que ya ocurren o van a ocurrir: sistemas de alerta, arbolado urbano, infraestructura contra inundaciones, cultivos resistentes a la sequía.',
        'No son opciones alternativas: sin mitigación, la adaptación se vuelve cada vez más cara e incluso imposible; sin adaptación, los impactos que ya están en marcha causan daños evitables.',
      ]),
      clas('¿Es mitigación o adaptación?', { // e1
        'Mitigación': ['Instalar paneles solares', 'Reducir fugas de metano', 'Frenar desmontes', 'Andar más en bicicleta'],
        'Adaptación': ['Sistema de alerta por olas de calor', 'Plantar árboles para dar sombra en veredas', 'Elevar casas en zonas inundables', 'Cultivos resistentes a la sequía'],
      }, 'Mitigar ataca las causas; adaptarse reduce los daños. Plantar árboles, además, puede hacer las dos cosas.', { d: 1 }),
      vf('Si nos adaptamos bien, no hace falta reducir las emisiones.', false, 'La adaptación tiene límites: con mucho calentamiento, algunos impactos no se pueden evitar, como la pérdida de glaciares o de arrecifes. Hacen falta las dos cosas.', { // e2
        razones: ['+Porque la adaptación tiene límites si el calentamiento sigue', '-Porque adaptarse es siempre gratis', '-Porque los impactos se detienen solos'],
        d: 2,
      }),
      teoria('Soluciones que hacen las dos cosas', [
        'Algunas acciones mitigan y adaptan al mismo tiempo. Un bosque ribereño conservado guarda carbono y amortigua crecidas. El arbolado urbano absorbe algo de carbono, pero sobre todo refresca la ciudad. Un suelo con más materia orgánica guarda carbono y retiene más agua en sequías. Estas soluciones basadas en la naturaleza suelen tener además beneficios para la biodiversidad.',
      ]),
      mult('¿Qué acciones mitigan y adaptan a la vez? Marcá todas.', [ // e3
        '+Conservar humedales que guardan carbono y absorben crecidas',
        '+Aumentar la materia orgánica del suelo',
        '+Plantar árboles nativos en la ciudad',
        '-Construir un muro costero de hormigón',
        '-Instalar aire acondicionado alimentado con gas',
      ], 'El muro adapta pero no mitiga; el aire acondicionado con energía fósil adapta pero suma emisiones.', { d: 3 }),
      teoria('La mala adaptación', [
        'Hay respuestas que parecen adaptación pero empeoran las cosas: se llaman mala adaptación. Por ejemplo, depender solo del aire acondicionado alimentado con energía fósil aumenta las emisiones; un muro costero puede trasladar la erosión a la playa vecina; y canalizar un arroyo puede mover la inundación aguas abajo.',
      ]),
      op('Un barrio construye un terraplén que lo protege de una crecida, pero el agua se desvía al barrio vecino. ¿Qué es esto?', [ // e4
        'Un caso de mala adaptación',
        'Una medida de mitigación',
        ['Una adaptación perfecta', 'Protege a uno pero traslada el daño a otro: es mala adaptación.'],
        'Una solución basada en la naturaleza',
      ], 'Una buena adaptación mira la cuenca completa, no solo un barrio.', { d: 2 }),
      teoria('El Acuerdo de París', [
        'En 2015, casi todos los países firmaron el Acuerdo de París. Se comprometieron a mantener el calentamiento muy por debajo de 2 °C y a hacer esfuerzos para limitarlo a 1,5 °C. Cada país presenta sus propias metas, llamadas contribuciones determinadas a nivel nacional (NDC), y debe actualizarlas cada cinco años con más ambición. Para estabilizar la temperatura, las emisiones netas de CO₂ tienen que llegar a cero.',
      ]),
      par('Uní cada concepto con su definición.', [ // e5
        ['Mitigación', 'Reducir emisiones o absorber carbono'],
        ['Adaptación', 'Prepararse para los impactos'],
        ['NDC', 'Metas climáticas que presenta cada país'],
        ['Emisiones netas cero', 'Emitir no más de lo que se absorbe'],
      ], 'El vocabulario básico de la política climática.', { d: 2 }),
      ord('Ordená cómo funciona el ciclo del Acuerdo de París.', [ // e6
        'Cada país presenta sus metas (NDC)',
        'Informa sus avances de forma transparente',
        'Se hace un balance mundial de lo logrado',
        'Cada país actualiza sus metas con más ambición',
      ], 'El acuerdo funciona como un ciclo que se repite cada cinco años, subiendo la ambición.', { d: 3 }),
      numv(3, (i) => { // e7
        const [costo, dano] = [[1, 4], [2, 10], [3, 12]][i];
        return {
          enunciado: `Un sistema de alerta temprana cuesta ${costo} millón${costo > 1 ? 'es' : ''} de pesos por año y evita daños por ${dano} millones. ¿Cuántos pesos de daño evita por cada peso invertido?`,
          valor: dano / costo,
          unidad: 'pesos',
          explicacion: `${dano} ÷ ${costo} = ${dano / costo}. Datos ficticios, pero los estudios coinciden en que la adaptación temprana suele ahorrar varias veces lo que cuesta.`,
          ctx: `Costo ${costo} millones por año; daños evitados ${dano} millones.`,
        };
      }, { d: 2 }),
      det('Leé esta nota y marcá lo equivocado.', [ // e8
        ['El Acuerdo de París busca limitar el calentamiento muy por debajo de 2 °C.', false],
        ['Mitigar y adaptarse son opciones alternativas: con una alcanza.', true, 'Son complementarias; hacen falta las dos.'],
        ['Conservar humedales puede mitigar y adaptar a la vez.', false],
        ['Cualquier obra contra inundaciones es buena adaptación.', true, 'Si traslada el daño a otros, es mala adaptación.'],
      ], 'Pensar bien las respuestas evita gastar en soluciones que empeoran el problema.', { d: 2 }),
      vf('El Acuerdo de París fija la misma meta de reducción, obligatoria, para todos los países.', false, 'Cada país define su propia meta (NDC) y la actualiza cada cinco años. Lo común es el objetivo de temperatura y la obligación de informar con transparencia.', { // e10
        razones: ['+Porque cada país define su propia meta y la actualiza', '-Porque el acuerdo no tiene ninguna meta de temperatura', '-Porque solo lo firmaron dos países'],
        d: 2,
      }),
      comp('Completá.', 'Reducir emisiones es [mitigar]; prepararse para los impactos es [adaptarse]; y para estabilizar la temperatura, las emisiones netas de CO₂ tienen que llegar a [cero].', ['olvidar', 'resignarse', 'duplicarse'], 'Los conceptos básicos de la respuesta al cambio climático.', { d: 1 }),
      op('En una ciudad con olas de calor cada vez más largas, ¿qué medida combina mejor adaptación y mitigación?', [ // e11
        'Arbolado nativo en veredas y plazas',
        'Repartir ventiladores en los días críticos',
        ['Pintar las calles de negro', 'El asfalto oscuro absorbe más calor: empeora la isla de calor.'],
        'Cerrar las plazas en verano para cuidarlas',
      ], 'Los árboles dan sombra, refrescan, absorben algo de carbono y suman biodiversidad.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Qué futuro depende de hoy', 'Escenarios, la diferencia entre 1,5 y 2 °C, y por qué cada décima de grado cuenta.', [
      teoria('Escenarios', [
        'Nadie sabe cuánto emitiremos en el futuro, así que el IPCC trabaja con escenarios. En un escenario de emisiones muy bajas, que llegan a cero neto hacia mediados de siglo, el calentamiento hacia fines del siglo XXI sería de alrededor de 1,4 °C. En uno intermedio, de unos 2,7 °C. Y en uno de emisiones muy altas, de unos 4,4 °C.',
        'La física del clima es la misma en todos los escenarios. Lo que cambia son las decisiones.',
      ], {
        datos: barras('Calentamiento estimado para 2081–2100 según el escenario (mejor estimación)', '°C', [
          ['Emisiones muy bajas', 1.4],
          ['Emisiones intermedias', 2.7],
          ['Emisiones muy altas', 4.4],
        ], 'IPCC AR6, Grupo de Trabajo I.'),
      }),
      op('¿Qué define principalmente cuánto se calentará el planeta este siglo?', [ // e1
        'Cuánto CO₂ y otros gases emitamos',
        'La posición de los planetas en el sistema solar',
        ['Los ciclos naturales del sol, que dominan todo', 'La energía solar no aumentó; el factor principal son las emisiones.'],
        'La cantidad de volcanes activos',
      ], 'Los escenarios muestran que la diferencia entre 1,4 y 4,4 °C depende de las emisiones.', { d: 1 }),
      rank('Ordená los escenarios del IPCC según el calentamiento esperado a fines de siglo, de menor a mayor.', [ // e2
        ['Emisiones muy bajas, cero neto hacia 2050', '≈ 1,4 °C'],
        ['Emisiones intermedias', '≈ 2,7 °C'],
        ['Emisiones muy altas', '≈ 4,4 °C'],
      ], 'Un mismo planeta, tres futuros muy distintos.', { d: 1 }),
      teoria('1,5 no es lo mismo que 2', [
        'Según el informe especial del IPCC sobre 1,5 °C, medio grado hace mucha diferencia. Con 1,5 °C se perdería entre el 70 y el 90 % de los arrecifes de coral tropicales; con 2 °C, más del 99 %. El nivel del mar subiría unos 10 cm menos hacia 2100 con 1,5 °C que con 2 °C. Y el porcentaje de especies de insectos que perderían más de la mitad de su área de distribución sería del 6 % con 1,5 °C y del 18 % con 2 °C.',
      ], {
        datos: tabla('Diferencias entre 1,5 °C y 2 °C de calentamiento', ['Impacto', 'Con 1,5 °C', 'Con 2 °C'], [
          ['Arrecifes de coral perdidos', '70–90 %', 'más del 99 %'],
          ['Insectos que pierden más de la mitad de su área', '6 %', '18 %'],
          ['Plantas que pierden más de la mitad de su área', '8 %', '16 %'],
          ['Veranos árticos sin hielo marino', 'uno por siglo', 'uno por década'],
        ], 'IPCC, Informe especial sobre 1,5 °C (2018).'),
      }),
      num('Con 1,5 °C, el 6 % de las especies de insectos perdería más de la mitad de su área; con 2 °C, el 18 %. ¿Cuántas veces mayor es el impacto con 2 °C?', 3, 'veces', '18 ÷ 6 = 3. Medio grado más triplica la proporción de insectos muy afectados.', { ctx: '6 % con 1,5 °C y 18 % con 2 °C.', d: 1 }),
      par('Uní cada impacto con su valor a 2 °C.', [ // e4
        ['Arrecifes de coral perdidos', 'Más del 99 %'],
        ['Insectos muy afectados', '18 %'],
        ['Plantas muy afectadas', '16 %'],
        ['Veranos árticos sin hielo', 'Uno por década'],
      ], 'Con 2 °C los impactos no son "un poco peores": en muchos casos se duplican o triplican.', { d: 3 }),
      vf('Si ya no se puede limitar el calentamiento a 1,5 °C, da lo mismo llegar a 2 °C o a 3 °C.', false, 'Cada décima de grado cuenta: los impactos crecen con cada aumento. Limitar a 1,7 °C es mucho mejor que llegar a 2 °C, y 2 °C es mucho mejor que 3 °C.', { // e5
        razones: ['+Porque los impactos crecen con cada décima de grado', '-Porque los impactos se detienen en 1,5 °C', '-Porque 3 °C tiene menos impactos que 2 °C'],
        d: 2,
      }),
      teoria('Umbrales', [
        'Algunos sistemas pueden cruzar umbrales a partir de los cuales el cambio se vuelve difícil de revertir durante siglos o milenios, como la pérdida de grandes masas de hielo o la muerte masiva de arrecifes. No se conoce con exactitud dónde están esos umbrales, y el riesgo de cruzarlos aumenta con cada grado. Es otra razón para actuar cuanto antes.',
      ]),
      cad('Armá la cadena de por qué conviene reducir emisiones cuanto antes.', [ // e6
        'El CO₂ se acumula en la atmósfera durante siglos',
        'El calentamiento depende del total acumulado',
        'Cada año de demora suma calentamiento difícil de revertir',
        'Actuar antes limita los impactos y el riesgo de umbrales',
      ], ['El CO₂ desaparece solo en pocos meses'], 'Como el CO₂ se acumula, cada tonelada evitada hoy vale para siempre.', { d: 3 }),
      mult('¿Qué afirmaciones sobre el futuro del clima son correctas? Marcá todas.', [ // e7
        '+El calentamiento futuro depende de las emisiones',
        '+Cada décima de grado evitada reduce impactos',
        '+Para estabilizar la temperatura, el CO₂ neto debe llegar a cero',
        '-Ya es tarde y nada de lo que hagamos cambia el resultado',
        '-El clima volverá solo a como era en 1900',
      ], 'El futuro no está escrito: depende de lo que se haga en estas décadas.', { d: 2 }),
      numv(3, (i) => { // e8
        const [a, b] = [[1.5, 2], [2, 3], [1.5, 3]][i];
        const f = { 1.5: 4.1, 2: 5.6, 3: 7.2 };
        return {
          enunciado: `Un calor extremo de "1 en 10 años" ocurriría ${f[a].toLocaleString('es-AR')} veces por década con ${a.toLocaleString('es-AR')} °C y ${f[b].toLocaleString('es-AR')} veces con ${b.toLocaleString('es-AR')} °C. ¿Cuántos eventos más por década habría con ${b.toLocaleString('es-AR')} °C?`,
          valor: Math.round((f[b] - f[a]) * 10) / 10,
          unidad: 'eventos',
          dec: 1,
          tol: 0.1,
          explicacion: `${f[b].toLocaleString('es-AR')} − ${f[a].toLocaleString('es-AR')} = ${(Math.round((f[b] - f[a]) * 10) / 10).toLocaleString('es-AR')} eventos más por década. Valores aproximados del IPCC; el de 3 °C está interpolado.`,
          ctx: `${f[a]} eventos con ${a} °C y ${f[b]} con ${b} °C.`,
        };
      }, { d: 2 }),
      det('Leé este comentario y marcá lo equivocado.', [ // e9
        ['Con 1,5 °C se perderían muchos arrecifes, pero con 2 °C casi todos.', false],
        ['Medio grado más no cambia nada importante.', true, 'Con 2 °C muchos impactos se duplican o triplican respecto de 1,5 °C.'],
        ['En un escenario de emisiones muy bajas, el calentamiento rondaría 1,4 °C.', false],
        ['Como ya estamos en 1,2 °C, nada de lo que hagamos importa.', true, 'La diferencia entre 1,4 °C y 4,4 °C depende de las decisiones de estas décadas.'],
      ], 'El fatalismo es tan equivocado como la negación: los dos llevan a no hacer nada.', { d: 2 }),
      clas('¿Qué actitud frente al cambio climático expresa cada frase?', { // e11
        'Negación': ['"El cambio climático es un invento"', '"Siempre hizo calor en verano, no pasa nada"'],
        'Fatalismo': ['"Ya es tarde, no hay nada que hacer"', '"Lo que hagamos acá no cambia nada"'],
        'Acción informada': ['"Cada décima de grado evitada cuenta"', '"Hay que reducir emisiones y adaptarse a la vez"'],
      }, 'La negación y el fatalismo llevan al mismo lugar: no hacer nada. La evidencia apoya actuar.', { d: 2 }),
      comp('Completá.', 'Con 2 °C se perdería más del 99 % de los [arrecifes] de coral; en un escenario de emisiones muy altas, el calentamiento rondaría los [4,4] °C; y cada [décima] de grado cuenta.', ['bosques', '0,5', 'tonelada'], 'Tres ideas para entender por qué el futuro depende de hoy.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: el clima que cambia', 'Cambios observados, extremos, atribución, impactos en Argentina, mitigación, adaptación y escenarios, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el plan climático de Villa Ribera', 'Un pueblo junto a un río sufre crecidas y olas de calor. Con los datos, armá un plan que combine mitigación y adaptación.', [
      teoria('La situación', [
        'Villa Ribera tiene 20.000 habitantes y está junto a un río de llanura. En los últimos 20 años tuvo cuatro inundaciones graves, y los días de calor extremo pasaron de 4 a 11 por verano. El municipio tiene un presupuesto limitado y estas propuestas: un sistema de alerta temprana de crecidas, conservar el humedal aguas arriba, plantar árboles nativos en las veredas del centro, pasar el alumbrado público a LED, y construir un terraplén que desviaría el agua hacia un barrio vecino.',
      ]),
      clas('Clasificá las propuestas.', { // e1
        'Adaptación': ['Sistema de alerta temprana de crecidas'],
        'Mitigación': ['Alumbrado público LED'],
        'Mitigación y adaptación': ['Conservar el humedal aguas arriba', 'Árboles nativos en las veredas'],
        'Mala adaptación': ['Terraplén que desvía el agua al barrio vecino'],
      }, 'Un buen plan combina tipos de medidas y descarta las que trasladan el problema.', { d: 3 }),
      num('Los días de calor extremo pasaron de 4 a 11 por verano. ¿En qué porcentaje aumentaron? Redondeá al entero.', 175, '%', '(11 − 4) ÷ 4 × 100 = 175 %. Casi se triplicaron: la adaptación al calor es urgente.', { ctx: 'De 4 a 11 días de calor extremo por verano.', d: 2 }),
      rank('Ordená las propuestas de mayor a menor prioridad para empezar.', [ // e3
        ['Sistema de alerta temprana', 'protege vidas ya, bajo costo'],
        ['Conservar el humedal aguas arriba', 'reduce crecidas y guarda carbono'],
        ['Árboles nativos en las veredas', 'calor, carbono y biodiversidad'],
        ['Alumbrado LED', 'mitiga y ahorra dinero'],
      ], 'Primero lo que salva vidas; después lo que reduce riesgos de fondo y suma beneficios. El terraplén queda afuera.', { d: 4 }),
      op('¿Por qué conviene descartar el terraplén propuesto?', [ // e4
        'Traslada la inundación al barrio vecino',
        'Porque los terraplenes nunca sirven para nada',
        ['Porque es una medida de mitigación', 'No mitiga: es una obra de adaptación mal planteada.'],
        'Porque el río no se desborda nunca',
      ], 'Proteger a unos a costa de otros es mala adaptación y genera conflictos.', { d: 2 }),
      mult('¿Qué debería incluir el plan, además de las obras? Marcá todo.', [ // e5
        '+Un protocolo para asistir a personas mayores en olas de calor',
        '+Participación de los barrios en el diseño',
        '+Indicadores para medir si el plan funciona',
        '-Esperar a la próxima inundación para decidir',
        '-Ocultar los mapas de riesgo para no alarmar',
      ], 'Un plan climático también es social: cuidar a los más vulnerables, participar y medir.', { d: 3 }),
      vf('Como Villa Ribera emite muy poco, no tiene sentido que incluya medidas de mitigación.', false, 'Las medidas de mitigación que ahorran dinero, como el LED, conviene hacerlas igual. Y muchas, como el humedal y los árboles, también adaptan.', { // e6
        razones: ['+Porque muchas medidas ahorran dinero o también adaptan', '-Porque los pueblos chicos no emiten nada', '-Porque la mitigación está prohibida en municipios'],
        d: 2,
      }),
      det('El intendente presenta el plan. Marcá lo que conviene corregir.', [ // e7
        ['Instalaremos un sistema de alerta de crecidas.', false],
        ['Rellenaremos el humedal para construir un barrio nuevo.', true, 'El humedal amortigua crecidas: rellenarlo aumenta el riesgo.'],
        ['Plantaremos árboles nativos en las veredas del centro.', false],
        ['Las olas de calor no requieren ninguna acción.', true, 'Los días de calor extremo casi se triplicaron: hacen falta alertas y cuidados.'],
      ], 'Un plan coherente no contradice en una línea lo que propone en otra.', { d: 3 }),
    ]),
  ],
});
