import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// COMUNIDAD 3 — Justicia ambiental.
// Quién recibe los daños y quién los beneficios del ambiente, el caso de la
// cuenca Matanza-Riachuelo, la desigualdad en el clima, las generaciones
// futuras y cómo diseñar soluciones justas. Retoma los derechos y la
// participación ambiental (comunidad-2), la organización barrial
// (comunidad-1) y el aire y la salud (aire-suelo-1).

export default unidad({
  slug: 'comunidad-3',
  rama: 'comunidad',
  orden: 3,
  nivel: 2,
  requiereTronco: 2,
  titulo: 'Justicia ambiental',
  bajada: 'Quién respira el peor aire, quién vive junto al basural, quién emite más y quién sufre más el clima: la desigualdad en el ambiente y cómo construir soluciones justas.',
  objetivos: [
    'Explicar las dimensiones distributiva, procedimental y de reconocimiento de la justicia ambiental',
    'Analizar el caso de la cuenca Matanza-Riachuelo y la causa Mendoza',
    'Interpretar datos sobre desigualdad en las emisiones y en la vulnerabilidad climática',
    'Reconocer los derechos de las generaciones futuras en la ley y la jurisprudencia',
    'Proponer soluciones ambientales que no agraven desigualdades',
  ],
  repasa: ['comunidad-2', 'comunidad-1', 'aire-suelo-1', 'consumo-4'],
  fuentes: ['acumar', 'acumar-causa-mendoza', 'oxfam-clima-2023', 'cij-clima-2025', 'ley-25675-ambiente', 'escazu', 'acuerdo-paris', 'oms-aire-exterior'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Qué es la justicia ambiental', 'Daños y beneficios que no se reparten por igual, decisiones que no incluyen a todos y voces que no se escuchan.', [
      teoria('Una idea que nace en los barrios', [
        'En 1982, en el condado de Warren, en Estados Unidos, vecinos de una comunidad mayormente afroamericana protestaron contra un relleno de residuos tóxicos que se instalaba cerca de sus casas. Esa lucha dio visibilidad a una pregunta: ¿por qué las industrias contaminantes, los basurales y los depósitos de residuos se instalan con más frecuencia cerca de barrios pobres o discriminados? Así se fue formando la idea de justicia ambiental.',
      ]),
      teoria('Tres dimensiones', [
        'La justicia ambiental tiene tres dimensiones. Distributiva: quién recibe los daños (contaminación, riesgos, residuos) y quién los beneficios (plazas, árboles, agua segura). Procedimental: quién participa en las decisiones y con qué información. Y de reconocimiento: quién es tenido en cuenta y respetado, con sus saberes, su cultura y su forma de vida.',
      ], { lista: ['Distributiva · quién recibe daños y beneficios', 'Procedimental · quién participa en las decisiones', 'Reconocimiento · quién es tenido en cuenta y respetado'] }),
      clas('¿Qué dimensión de la justicia ambiental está en juego?', { // e1
        'Distributiva': ['Un barrio tiene diez veces menos árboles que otro', 'El basural se instala siempre junto a los barrios pobres'],
        'Procedimental': ['La audiencia pública se hace en horario laboral y lejos del barrio afectado', 'La información del proyecto no se publica'],
        'Reconocimiento': ['No se consideran los saberes de una comunidad indígena sobre su territorio', 'Se trata a los vecinos como si no entendieran el problema'],
      }, 'Una injusticia ambiental suele combinar las tres dimensiones a la vez.', { d: 2 }),
      op('Una planta de tratamiento de residuos se instala junto a un barrio sin que nadie le consulte. ¿Qué dimensiones de la justicia ambiental se ven afectadas?', [ // e2
        'La distributiva y la procedimental',
        'Solo la de reconocimiento, nada más',
        ['Ninguna, porque la planta es necesaria', 'Que sea necesaria no justifica dónde ni cómo se decide.'],
        'Solo la económica',
      ], 'Recibe el daño (distributiva) y no participó de la decisión (procedimental).', { d: 2 }),
      teoria('Beneficios también desiguales', [
        'La injusticia no está solo en los daños. También los beneficios ambientales se reparten de forma desigual: en muchas ciudades, los barrios de mayores ingresos tienen más arbolado, más plazas, mejor acceso al agua segura y a la red cloacal, y menos inundaciones. Lo viste con el verde urbano: la sombra de los árboles y el acceso a espacios verdes también son parte del ambiente.',
      ]),
      numv(3, (i) => { // e3
        const [a, b] = [[12, 2], [9, 1.5], [15, 3]][i];
        return {
          enunciado: `Un barrio tiene ${a.toLocaleString('es-AR')} m² de espacio verde por habitante y otro ${b.toLocaleString('es-AR')} m². ¿Cuántas veces más espacio verde por habitante tiene el primero?`,
          valor: a / b,
          unidad: 'veces',
          explicacion: `${a.toLocaleString('es-AR')} ÷ ${b.toLocaleString('es-AR')} = ${(a / b).toLocaleString('es-AR')} veces. Una diferencia así afecta la salud, el calor y la calidad de vida de cada barrio.`,
          ctx: `${a} m² frente a ${b} m² por habitante.`,
        };
      }, { d: 1 }),
      cad('Armá la cadena de cómo se refuerza una injusticia ambiental.', [ // e4
        'Un barrio tiene menos poder político y económico',
        'Se instalan allí actividades contaminantes',
        'Bajan los precios de las viviendas',
        'Llegan familias con menos recursos para mudarse',
        'El barrio queda con aún menos poder para oponerse',
      ], ['El barrio gana poder por tener más industrias'], 'Las desigualdades sociales y ambientales se alimentan entre sí.', { d: 3 }),
      vf('La contaminación afecta a todas las personas por igual, sin importar dónde viven.', false, 'Quienes viven junto a industrias, avenidas, basurales o ríos contaminados reciben mucha más exposición. Y suelen tener menos recursos para protegerse o mudarse.', { // e5
        razones: ['+Porque la exposición depende de dónde se vive y de los recursos', '-Porque la contaminación no existe', '-Porque solo afecta a los barrios ricos'],
        d: 1,
      }),
      par('Uní cada dimensión con la pregunta que plantea.', [ // e6
        ['Distributiva', '¿Quién recibe los daños y quién los beneficios?'],
        ['Procedimental', '¿Quién participa en las decisiones?'],
        ['Reconocimiento', '¿Quién es escuchado y respetado?'],
      ], 'Tres preguntas para analizar cualquier conflicto ambiental.', { d: 1 }),
      mult('¿Qué situaciones son ejemplos de injusticia ambiental? Marcá todas.', [ // e7
        '+El agua segura llega a unos barrios y a otros no',
        '+Una audiencia pública se hace sin traducción para una comunidad indígena',
        '+Los barrios sin árboles sufren más las olas de calor',
        '-Todos los barrios tienen las mismas plazas y el mismo aire',
        '-La información del proyecto se publica y se explica a tiempo',
      ], 'La justicia ambiental mira el reparto, el proceso y el respeto.', { d: 2 }),
      rank('Ordená estas formas de decidir dónde ubicar una planta de residuos, de la más justa a la menos justa.', [ // e7b
        ['Evaluar todas las opciones con datos y participación de todos los barrios', 'la más justa'],
        ['Evaluar opciones con datos técnicos, sin participación', 'incompleta'],
        ['Elegir el terreno más barato sin mirar quién vive cerca', 'injusta'],
        ['Elegir el barrio con menos capacidad de protestar', 'la más injusta'],
      ], 'La justicia está en el criterio y en el proceso, no solo en el resultado.', { d: 2, extremos: ['Más justa', 'Menos justa'] }),
      vf('Si un barrio acepta una industria contaminante a cambio de empleo, ya no hay ninguna injusticia ambiental.', false, 'Aceptar bajo necesidad económica, sin información completa ni alternativas, no borra la desigualdad. La justicia pide información, alternativas y controles reales.', { // e7c
        razones: ['+Porque aceptar por necesidad no borra la desigualdad', '-Porque el empleo siempre es malo', '-Porque las industrias nunca contaminan'],
        d: 3,
      }),
      det('Leé este comentario y marcá lo equivocado.', [ // e8
        ['La justicia ambiental mira quién recibe los daños y los beneficios.', false],
        ['Si una decisión es técnicamente buena, no importa quién participó.', true, 'La dimensión procedimental importa: participar es un derecho.'],
        ['Los espacios verdes también se reparten de forma desigual.', false],
        ['Las injusticias ambientales se corrigen solas con el tiempo.', true, 'Suelen reforzarse si nadie actúa.'],
      ], 'La justicia ambiental no es un tema aparte: atraviesa todas las decisiones ambientales.', { d: 2 }),
      comp('Completá.', 'Quién recibe los daños y los beneficios es la dimensión [distributiva]; quién participa en las decisiones es la [procedimental]; y quién es escuchado y respetado es la de [reconocimiento].', ['económica', 'técnica', 'ventas'], 'Las tres dimensiones de la justicia ambiental.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Junto al río más contaminado', 'La cuenca Matanza-Riachuelo, la causa Mendoza y lo que se logró y falta lograr.', [
      teoria('La cuenca', [
        'La cuenca Matanza-Riachuelo atraviesa parte de la Ciudad de Buenos Aires y varios municipios del conurbano bonaerense, donde viven millones de personas. Durante más de un siglo recibió desechos de curtiembres, frigoríficos, industrias químicas y cloacas sin tratar, y en sus orillas se formaron asentamientos y basurales. Muchas de las familias más pobres de la región viven justamente en las zonas más expuestas.',
      ]),
      teoria('La causa Mendoza', [
        'En 2004, un grupo de vecinos, encabezado por Beatriz Mendoza, demandó al Estado nacional, a la provincia de Buenos Aires, a la Ciudad y a empresas por los daños causados por la contaminación de la cuenca. En 2006 se creó por ley la Autoridad de Cuenca Matanza Riachuelo (ACUMAR). En 2008, la Corte Suprema dictó un fallo histórico: ordenó un plan de saneamiento con tres objetivos —mejorar la calidad de vida de la población, recomponer el ambiente y prevenir daños futuros— y fijó un sistema de control del cumplimiento.',
      ]),
      ord('Ordená los hechos de la causa Mendoza.', [ // e1
        'Vecinos de la cuenca presentan una demanda por la contaminación',
        'Se crea por ley la Autoridad de Cuenca Matanza Riachuelo',
        'La Corte Suprema ordena un plan de saneamiento',
        'Se ejecutan y controlan obras y relocalizaciones',
      ], 'Una demanda de vecinos llegó a la Corte y cambió la política ambiental de la región.', { d: 2 }),
      par('Uní cada actor con su papel en la causa.', [ // e2
        ['Vecinos de la cuenca', 'Presentaron la demanda'],
        ['Corte Suprema', 'Ordenó el plan de saneamiento'],
        ['ACUMAR', 'Coordina el saneamiento de la cuenca'],
        ['Empresas de la cuenca', 'Deben adecuar sus vertidos'],
      ], 'El caso muestra cómo distintos actores tienen responsabilidades distintas.', { d: 2 }),
      mult('¿Qué objetivos fijó la Corte para el plan de saneamiento? Marcá todos.', [ // e3
        '+Mejorar la calidad de vida de la población',
        '+Recomponer el ambiente',
        '+Prevenir daños futuros',
        '-Trasladar todas las industrias a otro país',
        '-Construir un nuevo puerto en el Riachuelo',
      ], 'Los tres objetivos combinan salud, ambiente y prevención.', { d: 1 }),
      teoria('Avances y deudas', [
        'Desde el fallo hubo avances: se sacaron muchos cascos de barcos hundidos, se limpiaron márgenes, se cerraron basurales, se controlaron industrias, se relocalizaron familias que vivían en el borde del río y se construyeron grandes obras cloacales. Pero el río sigue contaminado, y muchas relocalizaciones y obras avanzaron más lento de lo previsto. El caso muestra que la justicia puede ordenar, pero sanear una cuenca lleva décadas y requiere continuidad.',
      ]),
      clas('¿Es un avance o una deuda pendiente en la cuenca?', { // e4
        'Avance': ['Retiro de cascos de barcos hundidos', 'Cierre de basurales a cielo abierto', 'Control de vertidos industriales'],
        'Deuda pendiente': ['El agua del río sigue contaminada', 'Relocalizaciones que avanzaron más lento de lo previsto'],
      }, 'Un balance honesto reconoce lo logrado y lo que falta.', { d: 2 }),
      cad('Armá la cadena de por qué la contaminación del Riachuelo es una injusticia ambiental.', [ // e5
        'Las industrias y cloacas contaminaron el río durante décadas',
        'Las tierras junto al río perdieron valor',
        'Allí se asentaron familias con menos recursos',
        'Esas familias quedaron más expuestas a la contaminación',
        'La salud de quienes menos tienen es la más afectada',
      ], ['Las familias ricas se mudaron al borde del río'], 'Contaminación y pobreza se superponen en el territorio.', { d: 2 }),
      vf('Un fallo judicial alcanza para sanear un río en pocos años.', false, 'El fallo fijó obligaciones y controles, pero sanear una cuenca requiere obras, recursos, control y continuidad durante décadas.', { // e6
        razones: ['+Porque sanear una cuenca requiere décadas de obras y control', '-Porque los fallos judiciales no tienen efecto', '-Porque el río se limpia solo en un año'],
        d: 2,
      }),
      numv(3, (i) => { // e7
        const [anos, pct] = [[16, 40], [10, 25], [20, 60]][i];
        return {
          enunciado: `Si en ${anos} años se completó el ${pct} % de un plan de obras, y el ritmo se mantiene, ¿cuántos años más harían falta para completarlo? Redondeá al entero.`,
          valor: Math.round((anos / pct) * (100 - pct)),
          unidad: 'años',
          tol: 1,
          explicacion: `${anos} ÷ ${pct} × ${100 - pct} ≈ ${Math.round((anos / pct) * (100 - pct))} años más. Datos de ejemplo: muestran por qué el ritmo y la continuidad importan tanto.`,
          ctx: `${pct} % hecho en ${anos} años.`,
        };
      }, { d: 3 }),
      est('Estimá en qué año la Corte Suprema dictó el fallo que ordenó sanear la cuenca Matanza-Riachuelo.', 2008, { min: 1980, max: 2025, paso: 1, unidad: '' }, 'En 2008. La demanda había empezado en 2004 y ACUMAR se creó en 2006.', { d: 2 }),
      op('¿Por qué fue importante que la Corte fijara un sistema de control del cumplimiento?', [ // e7c
        'Para verificar que las órdenes se cumplan en el tiempo',
        'Para que el fallo pudiera cambiarse cada semana',
        ['Para que las empresas no tuvieran que hacer nada', 'Al contrario: el control apunta a que todos cumplan.'],
        'Para cerrar la causa lo antes posible',
      ], 'Un fallo sin seguimiento puede quedar en el papel. El control sostiene el cumplimiento durante años.', { d: 2 }),
      det('Leé este resumen y marcá lo equivocado.', [ // e8
        ['La causa Mendoza empezó con una demanda de vecinos de la cuenca.', false],
        ['La Corte Suprema declaró que el río ya estaba limpio.', true, 'Ordenó un plan de saneamiento porque estaba contaminado.'],
        ['ACUMAR se creó por ley en 2006.', false],
        ['Las familias más expuestas eran las de mayores ingresos.', true, 'Las más expuestas eran, en general, las de menores ingresos.'],
      ], 'El caso Riachuelo es uno de los más importantes del derecho ambiental argentino.', { d: 2 }),
      comp('Completá.', 'La demanda por la contaminación del Riachuelo se conoce como causa [Mendoza]; en 2008 la Corte [Suprema] ordenó un plan de saneamiento; y el organismo que coordina el saneamiento es [ACUMAR].', ['Riachuelo', 'Interamericana', 'INTA'], 'Tres datos clave del caso Matanza-Riachuelo.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Clima y desigualdad', 'Quién emite más y quién sufre más: la desigualdad en el cambio climático, entre personas y entre países.', [
      teoria('Quién emite', [
        'Según un estudio de Oxfam y el Instituto de Ambiente de Estocolmo, en 2019 el 10 % más rico de la población mundial fue responsable de la mitad de las emisiones de CO₂ asociadas al consumo. El 1 % más rico, de alrededor del 16 %: tanto como el 66 % más pobre. Y la mitad más pobre de la humanidad, unas 3.900 millones de personas, de apenas alrededor del 8 %.',
      ], {
        datos: barras('Parte de las emisiones de consumo en 2019, por grupo de ingresos', '%', [
          ['10 % más rico', 50],
          ['1 % más rico', 16],
          ['50 % más pobre', 8],
        ], 'Oxfam y SEI, Climate Equality (2023). El 1 % más rico está incluido dentro del 10 %.'),
      }),
      rank('Ordená estos grupos por su parte de las emisiones mundiales de consumo en 2019, de mayor a menor.', [ // e1
        ['10 % más rico', '≈ 50 %'],
        ['1 % más rico', '≈ 16 %'],
        ['50 % más pobre', '≈ 8 %'],
      ], 'La décima parte más rica emite más de seis veces lo que emite la mitad más pobre.', { d: 1 }),
      numv(3, (i) => { // e2
        const [pa, ea, pb, eb] = [[10, 50, 50, 8], [1, 16, 50, 8], [10, 50, 50, 8]][i];
        const ratio = Math.round((ea / pa) / (eb / pb) * 10) / 10;
        return {
          enunciado: [
            `Si el ${pa} % más rico emite el ${ea} % y el ${pb} % más pobre el ${eb} %, ¿cuántas veces más emite en promedio una persona del primer grupo que una del segundo? Redondeá a un decimal.`,
            `El ${pa} % más rico emite el ${ea} % de las emisiones y el ${pb} % más pobre el ${eb} %. ¿Cuántas veces más emite por persona el primer grupo? Redondeá a un decimal.`,
            `Por persona, ¿cuántas veces más emite alguien del ${pa} % más rico (que emite el ${ea} %) que alguien del ${pb} % más pobre (que emite el ${eb} %)? Redondeá a un decimal.`,
          ][i],
          valor: ratio,
          unidad: 'veces',
          dec: 1,
          tol: 0.1,
          explicacion: `Por persona: ${ea} ÷ ${pa} = ${(ea / pa).toLocaleString('es-AR')} contra ${eb} ÷ ${pb} = ${(eb / pb).toLocaleString('es-AR')}. Cociente: ${ratio.toLocaleString('es-AR')} veces.`,
          ctx: `${pa} % emite ${ea} %; ${pb} % emite ${eb} %.`,
        };
      }, { d: 4 }),
      teoria('Quién sufre', [
        'La otra cara de la desigualdad es la vulnerabilidad. Las personas y los países con menos recursos suelen estar más expuestos a olas de calor, inundaciones y sequías, y tienen menos medios para protegerse y recuperarse: viviendas precarias, trabajos al aire libre, menos acceso a salud, a seguros o a aire acondicionado. Quienes menos contribuyeron al problema suelen sufrir más sus consecuencias.',
      ]),
      cad('Armá la cadena de por qué una ola de calor golpea más a un barrio pobre.', [ // e3
        'Las viviendas son precarias y con techos de chapa',
        'Hay pocos árboles y mucho cemento',
        'Las casas acumulan calor y no se enfrían de noche',
        'Hay menos acceso a ventiladores, agua fresca o atención médica',
        'Aumentan los problemas de salud en ese barrio',
      ], ['Los techos de chapa enfrían las casas'], 'Exposición, sensibilidad y falta de recursos se combinan en la vulnerabilidad.', { d: 2 }),
      teoria('Entre países', [
        'También hay desigualdad entre países. Los países que se industrializaron primero acumularon la mayor parte de las emisiones históricas, mientras que muchos países de ingresos bajos, que emitieron muy poco, están entre los más afectados. En las negociaciones climáticas se reconoce el principio de "responsabilidades comunes pero diferenciadas", y en 2022 se acordó crear un fondo para responder a pérdidas y daños en los países más vulnerables.',
      ]),
      par('Uní cada concepto con su significado.', [ // e4
        ['Responsabilidades comunes pero diferenciadas', 'Todos deben actuar, pero no todos igual'],
        ['Emisiones históricas', 'Todo lo emitido desde la industrialización'],
        ['Pérdidas y daños', 'Impactos climáticos que ya no se pueden evitar'],
        ['Vulnerabilidad', 'Qué tan expuesto y preparado está alguien frente a un impacto'],
      ], 'Cuatro conceptos que ordenan cualquier discusión sobre justicia climática.', { d: 2 }),
      vf('Los países que menos emitieron son los que menos sufren el cambio climático.', false, 'Muchos de los países que menos emitieron están entre los más expuestos y con menos recursos para adaptarse.', { // e5
        razones: ['+Porque muchos países de baja emisión son muy vulnerables', '-Porque el clima solo cambia en los países ricos', '-Porque emitir poco protege del calentamiento'],
        d: 1,
      }),
      op('¿Qué significa el principio de "responsabilidades comunes pero diferenciadas"?', [ // e6
        'Todos deben actuar, según su responsabilidad y capacidad',
        'Solo los países pobres deben reducir emisiones',
        ['Ningún país tiene responsabilidad', 'Todos la tienen; lo que cambia es cuánta y cómo.'],
        'Todos deben reducir exactamente lo mismo',
      ], 'Es la base de la justicia climática entre países.', { d: 2 }),
      clas('¿Es una cuestión de responsabilidad o de vulnerabilidad?', { // e7
        'Responsabilidad': ['Cuánto emitió un país en su historia', 'Cuánto emite en promedio una persona de altos ingresos'],
        'Vulnerabilidad': ['Viviendas en zonas inundables', 'Falta de sistemas de alerta', 'Trabajo al aire libre sin protección del calor'],
      }, 'La justicia climática mira las dos columnas: quién causó y quién sufre.', { d: 2 }),
      mult('¿Qué hace más vulnerable a una familia frente a una inundación? Marcá todo.', [ // e7b
        '+Vivir en una zona baja junto a un arroyo',
        '+Tener una vivienda precaria',
        '+No recibir alertas tempranas',
        '+No tener ahorros para reparar daños',
        '-Vivir en una zona alta con buenos desagües',
      ], 'Exposición, fragilidad y falta de recursos se suman en la vulnerabilidad.', { d: 1 }),
      vf('Como el 1 % más rico emite tanto, lo que haga el resto de la población no importa.', false, 'La responsabilidad es mayor donde se emite más, pero las emisiones del resto también suman. La justicia climática reparte esfuerzos según responsabilidad y capacidad, no exime a nadie.', { // e7c
        razones: ['+Porque todas las emisiones suman, aunque la responsabilidad sea distinta', '-Porque el 1 % más rico no emite nada', '-Porque solo importan las emisiones de los países'],
        d: 2,
      }),
      det('Leé este posteo y marcá lo equivocado.', [ // e8
        ['El 10 % más rico emitió la mitad de las emisiones de consumo en 2019.', false],
        ['Todas las personas del mundo emiten más o menos lo mismo.', true, 'Hay enormes diferencias según el ingreso.'],
        ['En 2022 se acordó crear un fondo para pérdidas y daños.', false],
        ['Los más pobres son los que más contribuyeron al cambio climático.', true, 'La mitad más pobre emitió alrededor del 8 %.'],
      ], 'Los datos de desigualdad cambian la conversación sobre quién tiene que hacer qué.', { d: 2 }),
      comp('Completá.', 'Según Oxfam, el 10 % más rico emitió alrededor del [50] % de las emisiones de consumo en 2019; la mitad más pobre, cerca del [8] %; y el fondo acordado en 2022 es para pérdidas y [daños].', ['10', '40', 'ganancias'], 'Tres datos clave de la desigualdad climática.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Las generaciones que vienen', 'La justicia con quienes todavía no nacieron o no votan: la Constitución, los tribunales y las juventudes.', [
      teoria('Una promesa constitucional', [
        'El artículo 41 de la Constitución Nacional establece el derecho a un ambiente sano para que las actividades productivas satisfagan las necesidades presentes "sin comprometer las de las generaciones futuras". Es la idea de equidad intergeneracional: las decisiones de hoy no deberían dejar a quienes vienen un planeta más pobre, más riesgoso o con menos opciones.',
      ]),
      op('¿Qué significa la equidad intergeneracional?', [ // e1
        'No comprometer las necesidades de las generaciones futuras',
        'Que las personas mayores decidan por los jóvenes',
        ['Que cada generación use todo lo que pueda', 'Es lo contrario: cuidar lo que se deja a quienes vienen.'],
        'Que las leyes cambien cada generación',
      ], 'Es un principio que la Constitución argentina incluye explícitamente.', { d: 1 }),
      teoria('Los tribunales y el clima', [
        'En los últimos años, tribunales de distintos países tomaron decisiones sobre el clima y las generaciones futuras. En 2018, la Corte Suprema de Colombia, ante una demanda de jóvenes, reconoció a la Amazonia colombiana como sujeto de derechos y ordenó un plan contra la deforestación. En 2025, la Corte Internacional de Justicia emitió una opinión consultiva que afirma que los Estados tienen obligaciones jurídicas de proteger el sistema climático, y que incumplirlas puede generar responsabilidad internacional.',
      ]),
      par('Uní cada decisión con su contenido.', [ // e2
        ['Corte Suprema de Colombia, 2018', 'Reconoció a la Amazonia como sujeto de derechos'],
        ['Corte Internacional de Justicia, 2025', 'Los Estados tienen obligaciones de proteger el clima'],
        ['Corte Suprema argentina, 2008', 'Ordenó sanear la cuenca Matanza-Riachuelo'],
        ['Constitución argentina, artículo 41', 'Derecho a un ambiente sano y generaciones futuras'],
      ], 'El derecho ambiental se construye con leyes, constituciones y decisiones judiciales.', { d: 3 }),
      vf('Una opinión consultiva de la Corte Internacional de Justicia es un fallo contra un país específico.', false, 'Es una opinión sobre qué dice el derecho internacional, pedida en este caso por la Asamblea General de la ONU. No es una condena a un país, pero orienta cómo se interpretan las obligaciones de todos.', { // e3
        razones: ['+Porque interpreta el derecho sin condenar a un país concreto', '-Porque la Corte no puede opinar sobre el clima', '-Porque es una ley que votan los países'],
        d: 3,
      }),
      teoria('Las juventudes', [
        'Muchos de los reclamos climáticos de los últimos años fueron impulsados por jóvenes: huelgas escolares, demandas judiciales, participación en cumbres. Tiene sentido: son quienes van a vivir más tiempo con las consecuencias de las decisiones de hoy, y muchas veces todavía no pueden votar. La participación de las juventudes es una forma de dar voz a las generaciones futuras.',
      ]),
      mult('¿De qué formas pueden participar los jóvenes en las decisiones ambientales? Marcá todas.', [ // e4
        '+Pedir información pública ambiental',
        '+Participar en audiencias públicas y consejos juveniles',
        '+Organizar proyectos en la escuela y el barrio',
        '+Impulsar acciones judiciales con apoyo adecuado',
        '-Ninguna, porque no pueden votar',
      ], 'Lo viste en la unidad de derechos: hay muchas herramientas de participación, y no todas requieren votar.', { d: 1 }),
      numv(3, (i) => { // e5
        const [nac, anio] = [[2012, 2100], [2010, 2090], [2015, 2100]][i];
        return {
          enunciado: `Una persona que nació en ${nac}, ¿cuántos años tendrá en ${anio}?`,
          valor: anio - nac,
          unidad: 'años',
          explicacion: `${anio} − ${nac} = ${anio - nac} años. Muchas personas que hoy son chicos vivirán el clima de fines de siglo que definen las decisiones de estas décadas.`,
          ctx: `Nacimiento ${nac}; año ${anio}.`,
        };
      }, { d: 1 }),
      cad('Armá la cadena de por qué el clima es una cuestión entre generaciones.', [ // e6
        'Las emisiones de hoy se acumulan en la atmósfera',
        'Ese CO₂ sigue calentando durante siglos',
        'Los impactos crecen hacia fines de siglo',
        'Los más afectados serán quienes hoy son chicos o no nacieron',
      ], ['El CO₂ desaparece al año siguiente'], 'Lo viste con el efecto invernadero: lo que se emite hoy pesa durante mucho tiempo.', { d: 2 }),
      clas('¿Esta decisión tiene en cuenta a las generaciones futuras o no?', { // e7
        'Las tiene en cuenta': ['Proteger un acuífero aunque hoy sobre agua', 'Planificar la ciudad pensando en el clima de 2050', 'Crear un consejo juvenil consultivo'],
        'No las tiene en cuenta': ['Agotar un recurso porque hoy es rentable', 'Rellenar humedales sin pensar en las crecidas futuras'],
      }, 'Pensar en quienes vienen es parte de cualquier decisión ambiental responsable.', { d: 1 }),
      ord('Ordená estos hitos en el tiempo, del más antiguo al más reciente.', [ // e7b
        'Reforma constitucional que incorpora el artículo 41',
        'Fallo de la Corte Suprema en la causa Mendoza',
        'Fallo de la Corte colombiana sobre la Amazonia',
        'Opinión consultiva de la Corte Internacional de Justicia sobre el clima',
      ], '1994, 2008, 2018 y 2025: el reconocimiento de los derechos ambientales avanza con el tiempo.', { d: 2, extremos: ['Más antiguo', 'Más reciente'] }),
      op('¿Por qué tiene sentido que los jóvenes participen más en las decisiones climáticas?', [ // e7c
        'Porque vivirán más tiempo con sus consecuencias',
        'Porque saben más que todos los adultos',
        ['Porque así los adultos ya no tienen que decidir', 'Se trata de sumar voces, no de reemplazar.'],
        'Porque las decisiones climáticas no afectan a los adultos',
      ], 'Quienes cargarán con las consecuencias por más tiempo merecen voz en las decisiones.', { d: 1 }),
      det('Leé esta opinión y marcá lo equivocado.', [ // e8
        ['El artículo 41 menciona a las generaciones futuras.', false],
        ['Las generaciones futuras no tienen ninguna protección legal.', true, 'La Constitución y distintos tribunales las reconocen.'],
        ['En 2018, la Corte colombiana reconoció derechos a la Amazonia.', false],
        ['Como los jóvenes no votan, su opinión no cuenta en temas ambientales.', true, 'Tienen muchas formas de participar y sus derechos están en juego.'],
      ], 'La justicia con las generaciones futuras es un principio legal, no solo una idea.', { d: 2 }),
      comp('Completá.', 'La idea de no comprometer las necesidades de quienes vienen es la equidad [intergeneracional]; la Constitución la incluye en su artículo [41]; y en 2025 la Corte Internacional de [Justicia] se pronunció sobre el clima.', ['generacional', '14', 'Cuentas'], 'Tres claves de la justicia con las generaciones futuras.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Soluciones justas', 'Transición justa, verde sin expulsión, participación y tarifas: cómo cuidar el ambiente sin profundizar desigualdades.', [
      teoria('Transición justa', [
        'Cambiar hacia una economía con menos emisiones implica que algunas actividades se achiquen y otras crezcan. Una transición justa busca que las personas que trabajan en los sectores que se reducen —como el carbón o algunas industrias— no queden abandonadas: capacitación, nuevos empleos en la región, protección social y participación de trabajadores y comunidades en el diseño de la transición. El Acuerdo de París menciona la transición justa de la fuerza laboral.',
      ]),
      mult('¿Qué incluye una transición justa? Marcá todo.', [ // e1
        '+Capacitación para nuevos empleos',
        '+Inversiones en la región afectada',
        '+Participación de trabajadores y comunidades',
        '+Protección social durante el cambio',
        '-Cerrar las actividades de un día para el otro sin aviso',
      ], 'La transición es más rápida y más estable cuando nadie queda afuera.', { d: 1 }),
      teoria('Verde sin expulsión', [
        'Mejorar el ambiente de un barrio —una plaza nueva, un arroyo saneado, más árboles— puede tener un efecto inesperado: si el barrio se vuelve más atractivo, suben los alquileres y los precios, y las familias que vivían allí terminan yéndose. Se lo llama gentrificación verde. Para evitarlo, las mejoras pueden acompañarse con políticas de vivienda, alquileres protegidos o participación de los vecinos en el diseño.',
      ]),
      cad('Armá la cadena de la gentrificación verde.', [ // e2
        'Se construye un gran parque en un barrio popular',
        'El barrio se vuelve más atractivo',
        'Suben los alquileres y los precios de las viviendas',
        'Familias que vivían allí no pueden pagar y se van',
        'Los beneficios del parque los disfrutan otras personas',
      ], ['Bajan los alquileres porque hay más verde'], 'Una mejora ambiental sin políticas sociales puede terminar desplazando a quienes debía beneficiar.', { d: 3 }),
      op('¿Qué puede evitar que una mejora ambiental expulse a los vecinos de un barrio?', [ // e3
        'Acompañarla con políticas de vivienda y participación',
        'No hacer ninguna mejora en los barrios populares',
        ['Subir los impuestos solo a los vecinos actuales', 'Aceleraría la expulsión en lugar de evitarla.'],
        'Hacer la mejora sin avisar a nadie',
      ], 'La respuesta no es dejar de mejorar, sino mejorar con los vecinos y protegiendo su permanencia.', { d: 2 }),
      teoria('Priorizar a quien más lo necesita', [
        'Una forma de aplicar la justicia ambiental es priorizar las inversiones donde las carencias son mayores: primero las cloacas, el agua segura y el arbolado en los barrios que no los tienen. Para eso sirven los mapas que cruzan datos ambientales y sociales: contaminación, espacios verdes, inundaciones, ingresos y acceso a servicios.',
      ]),
      rank('Ordená estas inversiones de una ciudad según cuánto reducen la injusticia ambiental, de mayor a menor.', [ // e4
        ['Cloacas y agua segura en barrios que no las tienen', 'la mayor'],
        ['Arbolado en barrios con poca sombra', 'grande'],
        ['Renovar una plaza en un barrio con muchas plazas', 'poca'],
        ['Fuentes decorativas en el centro comercial', 'mínima'],
      ], 'La misma plata puede reducir o ampliar las desigualdades según dónde se invierta.', { d: 2, extremos: ['Mayor reducción', 'Menor reducción'] }),
      numv(3, (i) => { // e5
        const [hab, pct] = [[20000, 40], [50000, 25], [12000, 60]][i];
        return {
          enunciado: `Un barrio tiene ${hab.toLocaleString('es-AR')} habitantes y el ${pct} % no tiene cloacas. ¿Cuántas personas se beneficiarían si se completara la red?`,
          valor: (hab * pct) / 100,
          unidad: 'personas',
          explicacion: `${hab.toLocaleString('es-AR')} × ${pct} % = ${((hab * pct) / 100).toLocaleString('es-AR')} personas. Datos como este ayudan a priorizar obras con criterio de justicia.`,
          ctx: `${hab} habitantes; ${pct} % sin cloacas.`,
        };
      }, { d: 1 }),
      teoria('Participar de verdad', [
        'La dimensión procedimental se trabaja con participación real: información clara y a tiempo, audiencias en horarios y lugares accesibles, traducción cuando hace falta, y respuestas a lo que plantean los vecinos. El Acuerdo de Escazú, que Argentina aprobó, busca garantizar el acceso a la información, la participación y la justicia en asuntos ambientales, con atención especial a las personas y grupos en situación de vulnerabilidad.',
      ]),
      clas('¿Esta forma de participación es accesible o no?', { // e6
        'Accesible': ['Audiencia en el barrio afectado, un sábado', 'Materiales en lenguaje claro y en la lengua de la comunidad', 'Respuesta escrita a cada propuesta vecinal'],
        'No accesible': ['Audiencia un martes a las 10 en otra ciudad', 'Un expediente técnico sin resumen'],
      }, 'Que exista una instancia de participación no alcanza: tiene que ser posible participar.', { d: 1 }),
      vf('Una política ambiental puede ser justa aunque la paguen solo los hogares de menores ingresos.', false, 'Si los costos recaen sobre quienes tienen menos, la política profundiza la desigualdad. Lo viste con los impuestos y subsidios: el diseño decide quién paga.', { // e7
        razones: ['+Porque profundizaría la desigualdad', '-Porque los hogares pobres nunca pagan impuestos', '-Porque la justicia no tiene relación con quién paga'],
        d: 2,
      }),
      par('Uní cada medida con la condición que la hace justa.', [ // e7b
        ['Cierre de una mina de carbón', 'Plan de empleo y capacitación en la región'],
        ['Parque nuevo en un barrio popular', 'Políticas para que los vecinos se queden'],
        ['Impuesto a la energía', 'Compensación a hogares de bajos ingresos'],
        ['Audiencia pública', 'Horario y lugar accesibles para los afectados'],
      ], 'Cada medida ambiental tiene una condición que la hace justa: detectarla es parte del diseño.', { d: 2 }),
      numv(3, (i) => { // e7c
        const [n, pct] = [[120, 75], [80, 60], [200, 90]][i];
        return {
          enunciado: `Se cierra un basural donde trabajaban ${n} recuperadores. La nueva planta de reciclaje con una cooperativa incorpora al ${pct} %. ¿Cuántas personas quedan sin trabajo en el nuevo sistema?`,
          valor: n - (n * pct) / 100,
          unidad: 'personas',
          explicacion: `${n} × ${pct} % = ${(n * pct) / 100} incorporados; quedan ${n - (n * pct) / 100}. Una transición justa busca que ese número llegue a cero.`,
          ctx: `${n} recuperadores; ${pct} % incorporados.`,
        };
      }, { d: 1 }),
      det('Leé este plan municipal y marcá lo que conviene corregir.', [ // e8
        ['Priorizaremos cloacas en los barrios sin conexión.', false],
        ['Haremos la audiencia pública un martes a las 10 en el centro.', true, 'Conviene hacerla en horarios y lugares accesibles para los afectados.'],
        ['El nuevo parque incluirá políticas para que los vecinos no sean desplazados.', false],
        ['Los trabajadores del basural que cerramos no necesitan ningún plan.', true, 'Una transición justa incluye a quienes pierden su fuente de ingresos.'],
      ], 'La justicia ambiental se juega en los detalles de cada plan.', { d: 2 }),
      comp('Completá.', 'Que nadie quede abandonado al cambiar la economía es una transición [justa]; cuando una mejora verde expulsa a los vecinos se habla de gentrificación [verde]; y el acuerdo regional sobre información, participación y justicia es el de [Escazú].', ['rápida', 'gris', 'Kioto'], 'Tres claves para diseñar soluciones ambientales justas.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: justicia ambiental', 'Dimensiones, el caso Riachuelo, desigualdad climática, generaciones futuras y soluciones justas, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el mapa de la ciudad', 'Una ciudad cruzó datos ambientales y sociales de cuatro barrios. Con el mapa, decidí dónde invertir primero.', [
      teoria('Los datos', [
        'La ciudad tiene presupuesto para una gran inversión ambiental este año y quiere usar criterios de justicia ambiental. Cruzó, para cada barrio, el ingreso medio de los hogares, los metros cuadrados de espacio verde por habitante, el porcentaje de viviendas sin conexión a cloacas y la frecuencia con que se inunda.',
      ], {
        datos: tabla('Indicadores por barrio (datos ficticios)', ['Barrio', 'Ingreso medio', 'Verde por habitante', 'Sin cloacas', 'Se inunda'], [
          ['Norte', 'alto', '14 m²', '0 %', 'nunca'],
          ['Centro', 'medio', '6 m²', '5 %', 'rara vez'],
          ['Arroyo', 'bajo', '1 m²', '55 %', 'cada año'],
          ['Vía', 'bajo', '3 m²', '30 %', 'a veces'],
        ], 'Datos ficticios para el ejercicio.'),
      }),
      num('¿Cuántas veces más espacio verde por habitante tiene el barrio Norte que el barrio Arroyo?', 14, 'veces', '14 ÷ 1 = 14 veces. Una brecha enorme en sombra, recreación y regulación del calor.', { ctx: 'Norte 14 m²; Arroyo 1 m² por habitante.', d: 1 }),
      rank('Ordená los barrios según su prioridad para la inversión, de mayor a menor.', [ // e2
        ['Arroyo', 'bajo ingreso, sin cloacas, se inunda cada año'],
        ['Vía', 'bajo ingreso, 30 % sin cloacas'],
        ['Centro', 'ingreso medio, algunas carencias'],
        ['Norte', 'sin carencias graves'],
      ], 'Priorizar donde se acumulan las carencias es aplicar la dimensión distributiva.', { d: 2 }),
      mult('¿Qué debería incluir la inversión en el barrio Arroyo? Marcá todo.', [ // e3
        '+Red cloacal',
        '+Obras y espacios verdes que absorban agua de lluvia',
        '+Participación de los vecinos en el diseño',
        '+Medidas para que los vecinos no sean desplazados',
        '-Una fuente decorativa en la entrada del barrio',
      ], 'Cloacas, verde que ayude con las inundaciones, participación y protección contra la expulsión.', { d: 2 }),
      op('Un concejal propone invertir en el barrio Norte "porque ahí se ve más". ¿Qué criterio de justicia contradice?', [ // e4
        'El distributivo: invierte donde menos falta',
        'El de reconocimiento, porque ignora la cultura',
        ['Ninguno, porque todos los barrios son iguales', 'Los datos muestran que no lo son.'],
        'El procedimental, porque hubo audiencia',
      ], 'Invertir donde menos falta aumenta las brechas en lugar de reducirlas.', { d: 2 }),
      cad('Armá el proceso para decidir la inversión con justicia.', [ // e5
        'Cruzar datos ambientales y sociales de cada barrio',
        'Identificar dónde se acumulan las carencias',
        'Hacer audiencias accesibles en esos barrios',
        'Diseñar las obras con los vecinos',
        'Medir los resultados y publicarlos',
      ], ['Decidir en una oficina y avisar cuando empiezan las obras'], 'Datos, prioridad, participación, diseño conjunto y rendición de cuentas.', { d: 2 }),
      vf('Mirar solo el ingreso de cada barrio alcanza para decidir la inversión ambiental.', false, 'El ingreso ayuda, pero hay que cruzarlo con indicadores ambientales: cloacas, verde, inundaciones, contaminación. Dos barrios de ingreso parecido pueden tener carencias muy distintas.', { // e6
        razones: ['+Porque hace falta cruzarlo con datos ambientales', '-Porque el ingreso no tiene ninguna relación', '-Porque todos los barrios pobres tienen las mismas carencias'],
        d: 2,
      }),
      det('La ciudad redacta su decisión. Marcá lo que conviene corregir.', [ // e7
        ['Priorizamos el barrio Arroyo por su acumulación de carencias.', false],
        ['Las obras se diseñarán sin consultar para no demorar.', true, 'La participación mejora el diseño y es un derecho.'],
        ['Publicaremos los indicadores cada año para medir avances.', false],
        ['No hace falta prever nada sobre alquileres: el verde siempre beneficia a los mismos vecinos.', true, 'Sin políticas de vivienda, puede haber gentrificación verde.'],
      ], 'Una decisión justa usa datos, prioriza, participa y cuida a quienes viven allí.', { d: 3 }),
    ]),
  ],
});
