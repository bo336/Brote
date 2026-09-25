import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// COMUNIDAD 4 — Conflictos ambientales.
// Qué es un conflicto ambiental, dos casos argentinos (Esquel y las
// papeleras), cómo mapear actores e intereses, las herramientas
// institucionales y la protección de quienes defienden el ambiente, y cómo
// transformar un conflicto en acuerdos. Retoma los derechos y la
// participación (comunidad-2), la justicia ambiental (comunidad-3) y hablar
// para sumar (comunidad-1).

export default unidad({
  slug: 'comunidad-4',
  rama: 'comunidad',
  orden: 4,
  nivel: 2,
  requiereTronco: 2,
  titulo: 'Conflictos ambientales',
  bajada: 'Minas, fábricas, represas y humedales: por qué surgen los conflictos ambientales, qué enseñan los casos argentinos y cómo se pueden transformar en acuerdos.',
  objetivos: [
    'Definir un conflicto ambiental y reconocer sus tipos',
    'Analizar los casos de Esquel y de las papeleras sobre el río Uruguay',
    'Mapear actores, posiciones e intereses en un conflicto',
    'Conocer las herramientas institucionales y la protección de las personas defensoras',
    'Proponer procesos para transformar un conflicto en acuerdos',
  ],
  repasa: ['comunidad-2', 'comunidad-3', 'comunidad-1', 'tronco-3'],
  fuentes: ['ejatlas', 'ejatlas-esquel', 'cij-papeleras-2010', 'escazu', 'ley-25675-ambiente', 'ley-25831-info', 'global-witness-defensores', 'ley-24071-oit-169'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Qué es un conflicto ambiental', 'Desacuerdos sobre el uso, el acceso y los impactos de la naturaleza: por qué aparecen y qué señalan.', [
      teoria('Una disputa sobre el ambiente', [
        'Un conflicto ambiental es una disputa entre actores —vecinos, empresas, gobiernos, comunidades, organizaciones— sobre el acceso, el uso o los impactos de un bien natural: el agua, la tierra, el aire, un bosque, un río. Aparecen cuando alguien siente que una actividad amenaza su salud, su forma de vida o sus derechos, y cuando los canales para resolver el desacuerdo no alcanzan.',
        'El Atlas de Justicia Ambiental, un proyecto académico, documenta miles de conflictos ambientales en todo el mundo, muchos de ellos en América Latina.',
      ]),
      clas('¿Qué tipo de conflicto ambiental es cada caso?', { // e1
        'Por extracción de recursos': ['Una mina a cielo abierto cerca de un pueblo', 'Un pozo petrolero en un área de pastoreo'],
        'Por contaminación': ['Una fábrica que vierte efluentes a un río', 'Un basural que quema residuos junto a un barrio'],
        'Por infraestructura o uso del suelo': ['Una represa que inundaría tierras de una comunidad', 'Un barrio cerrado que rellena un humedal'],
      }, 'Los conflictos se agrupan por la actividad que los origina, aunque muchos combinan varios tipos.', { d: 2 }),
      teoria('No todo conflicto es malo', [
        'Un conflicto puede ser doloroso, pero también cumple una función: hace visible un problema que antes no se discutía, abre preguntas sobre quién decide y puede mejorar las reglas. Muchas leyes ambientales nacieron después de conflictos. El problema no es que haya desacuerdos, sino que se resuelvan con violencia, con engaños o dejando a una parte sin voz.',
      ]),
      vf('Todo conflicto ambiental es un fracaso que conviene evitar a cualquier costo.', false, 'Los conflictos pueden revelar problemas reales y mejorar las reglas. Lo que conviene evitar es la violencia y la exclusión, no el desacuerdo en sí.', { // e2
        razones: ['+Porque pueden revelar problemas y mejorar las reglas', '-Porque los conflictos siempre terminan bien', '-Porque en democracia no hay desacuerdos'],
        d: 2,
      }),
      teoria('Etapas', [
        'Los conflictos suelen pasar por etapas. Empiezan latentes: hay un problema, pero no se discute en público. Se vuelven manifiestos cuando alguien reclama. Pueden escalar, con más tensión, acusaciones y medidas de fuerza. Y en algún momento llegan a una salida: un acuerdo, una decisión judicial, el abandono del proyecto, o un conflicto que queda abierto por años.',
      ]),
      ord('Ordená las etapas típicas de un conflicto ambiental.', [ // e3
        'Latente: hay un problema, pero no se discute',
        'Manifiesto: alguien reclama públicamente',
        'Escalada: crecen la tensión y las medidas de fuerza',
        'Salida: acuerdo, decisión judicial o cambio del proyecto',
      ], 'Detectar un conflicto en su etapa latente permite abordarlo antes de que escale.', { d: 1, extremos: ['Primero', 'Último'] }),
      cad('Armá la cadena de cómo escala un conflicto.', [ // e4
        'Una empresa anuncia un proyecto sin informar sus impactos',
        'Los vecinos piden información y no la reciben',
        'Crece la desconfianza y se organizan protestas',
        'La empresa y el gobierno responden con descalificaciones',
        'El conflicto escala y se vuelve más difícil de resolver',
      ], ['La falta de información genera confianza'], 'La falta de información y de escucha es una de las principales causas de escalada.', { d: 2 }),
      mult('¿Qué suele hacer escalar un conflicto ambiental? Marcá todo.', [ // e5
        '+Ocultar información sobre los impactos',
        '+Descalificar a quienes reclaman',
        '+Tomar decisiones sin consultar',
        '-Publicar los estudios completos a tiempo',
        '-Escuchar las preocupaciones de las comunidades',
      ], 'Lo que escala un conflicto es, casi siempre, lo contrario de lo que lo transforma.', { d: 1 }),
      par('Uní cada concepto con su definición.', [ // e6
        ['Conflicto ambiental', 'Disputa sobre el uso o los impactos de un bien natural'],
        ['Conflicto latente', 'Problema que existe pero no se discute'],
        ['Escalada', 'Aumento de la tensión y las medidas de fuerza'],
        ['Atlas de Justicia Ambiental', 'Registro de conflictos ambientales del mundo'],
      ], 'Vocabulario básico para analizar un conflicto ambiental.', { d: 1 }),
      op('¿Por qué conviene detectar un conflicto cuando todavía es latente?', [ // e7
        'Porque es más fácil abordarlo antes de que escale',
        'Porque en esa etapa nadie tiene derechos',
        ['Porque así se puede ocultar mejor', 'Ocultarlo suele hacerlo escalar después.'],
        'Porque los conflictos latentes desaparecen solos',
      ], 'Como con la salud, la prevención y la detección temprana ahorran mucho daño.', { d: 2 }),
      op('Un basural contamina un arroyo desde hace años, pero nadie lo discute en público. ¿En qué etapa está el conflicto?', [ // e7b
        'Latente',
        'Escalada',
        ['Resuelto', 'El problema sigue: que nadie lo discuta no significa que se resolvió.'],
        'Manifiesto',
      ], 'Un conflicto latente es un problema real que todavía no encontró voz pública.', { d: 1 }),
      det('Leé esta opinión y marcá lo equivocado.', [ // e8
        ['Los conflictos ambientales pueden hacer visible un problema real.', false],
        ['Si la gente protesta, es porque alguien la manipula.', true, 'Descalificar así ignora preocupaciones reales y escala el conflicto.'],
        ['Muchas leyes ambientales surgieron después de conflictos.', false],
        ['Ocultar información ayuda a calmar los conflictos.', true, 'La falta de información es una causa frecuente de escalada.'],
      ], 'Mirar los conflictos con respeto es el primer paso para transformarlos.', { d: 2 }),
      comp('Completá.', 'Una disputa sobre el uso o los impactos de un bien natural es un conflicto [ambiental]; cuando todavía no se discute en público es [latente]; y cuando crece la tensión se habla de [escalada].', ['comercial', 'resuelto', 'pausa'], 'Tres conceptos para entender cómo evolucionan los conflictos.', { d: 1 }),
      rank('Ordená estas respuestas de una empresa ante un reclamo, de la que más calma a la que más escala.', [ // e10
        ['Publicar los estudios y abrir un espacio de diálogo', 'desescala'],
        ['Responder por escrito con información parcial', 'neutra'],
        ['Ignorar el reclamo', 'escala'],
        ['Acusar a los vecinos de estar manipulados', 'escala mucho'],
      ], 'La transparencia y el respeto bajan la tensión; el desprecio la multiplica.', { d: 2, extremos: ['Más calma', 'Más escala'] }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Dos casos argentinos', 'El plebiscito de Esquel y el conflicto por las papeleras sobre el río Uruguay: qué pasó y qué enseñan.', [
      teoria('Esquel, 2003', [
        'A comienzos de los 2000, una empresa minera proyectaba explotar oro cerca de Esquel, en Chubut, con una mina a cielo abierto que usaría cianuro para separar el metal. Vecinos se organizaron en una asamblea, pidieron información y reclamaron ser consultados. En marzo de 2003 se realizó un plebiscito municipal: con alta participación, alrededor del 81 % votó en contra del proyecto. Ese mismo año, Chubut sancionó una ley que prohíbe la minería metalífera a cielo abierto y el uso de cianuro.',
      ], { destacado: { valor: '≈ 81 %', texto: 'de los votantes de Esquel rechazó el proyecto minero en el plebiscito de marzo de 2003.' } }),
      ord('Ordená los hechos del caso Esquel.', [ // e1
        'Una empresa proyecta una mina de oro con cianuro cerca de la ciudad',
        'Los vecinos se organizan en una asamblea',
        'Se realiza un plebiscito municipal',
        'Alrededor del 81 % vota en contra',
        'La provincia sanciona una ley que prohíbe ese tipo de minería',
      ], 'Un caso que mostró el peso de la participación local en las decisiones ambientales.', { d: 2 }),
      op('¿Qué herramienta de participación fue central en el caso Esquel?', [ // e2
        'Un plebiscito municipal',
        'Una encuesta privada de la empresa',
        ['Un fallo de la Corte Internacional de Justicia', 'Ese fue el caso de las papeleras, no el de Esquel.'],
        'Un decreto del gobierno nacional',
      ], 'La consulta directa a la población le dio fuerza política al reclamo vecinal.', { d: 1 }),
      teoria('Las papeleras, 2005–2010', [
        'En 2005, Uruguay autorizó la construcción de una gran planta de celulosa sobre el río Uruguay, frente a la ciudad argentina de Gualeguaychú. Vecinos de Gualeguaychú temían la contaminación del río y del aire, y durante años bloquearon el puente internacional. Argentina llevó el caso a la Corte Internacional de Justicia, en La Haya, porque ambos países comparten el río bajo un estatuto de 1975.',
        'En 2010, la Corte decidió que Uruguay había incumplido su obligación de informar y consultar a Argentina antes de autorizar la planta, pero que no se había probado que la planta violara sus obligaciones de proteger el río. No ordenó desmantelarla. Después, ambos países acordaron un monitoreo conjunto del río.',
      ]),
      clas('Según el fallo de 2010, ¿qué decidió la Corte Internacional de Justicia?', { // e3
        'Lo que decidió': ['Uruguay incumplió su obligación de informar a Argentina', 'No se probó que la planta violara la protección del río', 'No ordenó desmantelar la planta'],
        'Lo que no decidió': ['Que la planta debía cerrarse de inmediato', 'Que Argentina debía pagar una multa a Uruguay'],
      }, 'Un fallo matizado: una obligación incumplida, otra no probada, y una salida basada en el monitoreo conjunto.', { d: 3 }),
      par('Uní cada caso con su herramienta principal.', [ // e4
        ['Esquel', 'Plebiscito municipal'],
        ['Papeleras', 'Corte Internacional de Justicia'],
        ['Riachuelo', 'Fallo de la Corte Suprema argentina'],
        ['Salida de las papeleras', 'Monitoreo conjunto del río'],
      ], 'Cada conflicto encontró caminos institucionales distintos.', { d: 2 }),
      vf('En el caso de las papeleras, la Corte Internacional de Justicia ordenó cerrar la planta.', false, 'Decidió que Uruguay incumplió la obligación de informar, pero no que la planta violara la protección del río, y no ordenó cerrarla.', { // e5
        razones: ['+Porque no se probó el daño y no ordenó desmantelarla', '-Porque la Corte no tuvo ningún papel', '-Porque la planta nunca se construyó'],
        d: 2,
      }),
      mult('¿Qué lecciones dejan estos casos? Marcá todas.', [ // e6
        '+La información y la consulta previas pueden evitar conflictos largos',
        '+Las instituciones pueden canalizar desacuerdos',
        '+El monitoreo conjunto puede construir confianza',
        '-Los vecinos no tienen ninguna influencia',
        '-Los conflictos se resuelven solos si se los ignora',
      ], 'Ambos casos muestran la importancia de informar, consultar y construir confianza.', { d: 2 }),
      numv(3, (i) => { // e7
        const [votantes, pct] = [[20000, 81], [15000, 81], [25000, 81]][i];
        return {
          enunciado: `Si en un plebiscito votan ${votantes.toLocaleString('es-AR')} personas y el ${pct} % vota en contra de un proyecto, ¿cuántas personas votaron en contra?`,
          valor: (votantes * pct) / 100,
          unidad: 'personas',
          explicacion: `${votantes.toLocaleString('es-AR')} × ${pct} % = ${((votantes * pct) / 100).toLocaleString('es-AR')} personas. Datos de ejemplo con el porcentaje de Esquel.`,
          ctx: `${votantes} votantes; ${pct} % en contra.`,
        };
      }, { d: 1 }),
      vf('El plebiscito de Esquel fue organizado por la empresa minera para aprobar su proyecto.', false, 'Fue un plebiscito municipal impulsado tras la movilización vecinal, y su resultado fue el rechazo del proyecto.', { // e7b
        razones: ['+Porque fue municipal, impulsado tras la movilización vecinal', '-Porque en Esquel nunca hubo plebiscito', '-Porque el resultado fue a favor de la mina'],
        d: 1,
      }),
      det('Leé este resumen y marcá lo equivocado.', [ // e8
        ['En Esquel, cerca del 81 % votó en contra del proyecto minero.', false],
        ['El conflicto de las papeleras terminó con la planta desmantelada.', true, 'La Corte no ordenó desmantelarla; se acordó un monitoreo conjunto.'],
        ['Argentina y Uruguay comparten el río Uruguay bajo un estatuto de 1975.', false],
        ['En Esquel, el proyecto usaba agua destilada para separar el oro.', true, 'El proyecto preveía usar cianuro, que fue uno de los temas centrales.'],
      ], 'Contar bien los casos es clave para aprender de ellos.', { d: 2 }),
      comp('Completá.', 'En Esquel, en 2003, la población votó en un [plebiscito]; el conflicto de las papeleras llegó a la Corte Internacional de [Justicia]; y la salida acordada fue un [monitoreo] conjunto del río.', ['concurso', 'Cuentas', 'bloqueo'], 'Tres datos clave de dos casos argentinos.', { d: 1 }),
      op('En el caso de las papeleras, ¿qué obligación incumplió Uruguay según la Corte?', [ // e10
        'Informar a Argentina antes de autorizar',
        'Pagarle a Argentina por el agua del río',
        ['Cerrar la planta en época de lluvias', 'La Corte no impuso cierres estacionales.'],
        'Prohibir el turismo en Gualeguaychú',
      ], 'Las obligaciones de procedimiento, como informar y consultar, también son obligaciones jurídicas.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Mapear actores e intereses', 'Quién participa, qué pide, qué necesita y cuánto poder tiene: herramientas para entender un conflicto antes de actuar.', [
      teoria('Actores', [
        'En todo conflicto hay actores: personas, grupos u organizaciones con algo en juego. Pueden ser vecinos, comunidades indígenas, empresas, trabajadores, gobiernos municipales, provinciales o nacionales, organizaciones ambientales, universidades, medios de comunicación, jueces. Un primer paso para entender un conflicto es hacer una lista de todos los actores, no solo de los más visibles.',
      ]),
      clas('¿Qué tipo de actor es cada uno?', { // e1
        'Actor estatal': ['Municipio', 'Secretaría de ambiente provincial', 'Juzgado'],
        'Actor privado': ['Empresa que propone el proyecto', 'Cámara de comercio local'],
        'Actor social': ['Asamblea de vecinos', 'Comunidad indígena', 'Organización ambiental'],
      }, 'Mapear actores es el primer paso para entender quién está en juego y quién falta.', { d: 1 }),
      teoria('Posiciones e intereses', [
        'Una posición es lo que un actor dice que quiere: "no a la planta", "sí a la planta". Un interés es lo que necesita de fondo: agua limpia, salud, trabajo, ingresos, respeto. Las posiciones suelen chocar, pero los intereses a veces se pueden satisfacer al mismo tiempo. Buscar los intereses detrás de las posiciones abre opciones que parecían imposibles.',
      ]),
      par('Uní cada posición con un interés que puede haber detrás.', [ // e2
        ['"No queremos la planta"', 'Proteger la salud y el agua del barrio'],
        ['"Queremos la planta ya"', 'Conseguir empleo en la zona'],
        ['"El proyecto no se modifica"', 'Recuperar la inversión en plazo'],
        ['"Que decida la provincia"', 'Evitar un conflicto político local'],
      ], 'Detrás de posiciones opuestas puede haber intereses compatibles.', { d: 3 }),
      op('Vecinos dicen "no a la planta" y trabajadores dicen "sí a la planta". ¿Qué opción aprovecha sus intereses?', [ // e3
        'Condiciones que protejan el agua y generen empleo',
        'Elegir a un grupo y descartar al otro por completo',
        ['Postergar la decisión para siempre', 'Deja los dos intereses sin respuesta y el conflicto abierto.'],
        'Hacer una votación sin información',
      ], 'Trabajar sobre intereses permite buscar soluciones que ninguna posición inicial planteaba.', { d: 2 }),
      teoria('Poder e interés', [
        'Una herramienta útil es ubicar a cada actor en un mapa de dos ejes: cuánto poder tiene para influir en la decisión y cuánto interés o cuánto le afecta. Los que tienen mucho poder y mucho interés son centrales. Pero también importan los que tienen mucho interés y poco poder —por ejemplo, una comunidad pequeña muy afectada—: una buena gestión del conflicto busca que su voz pese.',
      ]),
      clas('Ubicá a cada actor en el mapa, según poder e interés.', { // e4
        'Mucho poder, mucho interés': ['Empresa que invierte en el proyecto', 'Gobierno provincial que autoriza'],
        'Poco poder, mucho interés': ['Familias que viven junto al sitio', 'Pastores que usan el agua del lugar'],
        'Mucho poder, poco interés': ['Un ministerio nacional que no participa'],
      }, 'Los actores con mucho interés y poco poder suelen ser los que más necesitan canales de participación.', { d: 3 }),
      cad('Armá los pasos para mapear un conflicto.', [ // e5
        'Listar todos los actores involucrados',
        'Identificar la posición de cada uno',
        'Buscar los intereses detrás de cada posición',
        'Ubicarlos según su poder e interés',
        'Detectar quién falta en la conversación',
      ], ['Escuchar solo al actor con más poder'], 'Un buen mapa muestra también a los ausentes.', { d: 2 }),
      vf('En un conflicto, lo importante es escuchar a los actores con más poder, porque son los que deciden.', false, 'Escuchar solo a los poderosos deja afuera a quienes más se ven afectados, lo que suele agravar el conflicto y producir injusticias.', { // e6
        razones: ['+Porque excluir a los afectados agrava el conflicto', '-Porque los actores poderosos no tienen intereses', '-Porque los afectados nunca tienen razón'],
        d: 2,
      }),
      numv(3, (i) => { // e7
        const [total, sin] = [[12, 3], [10, 4], [15, 5]][i];
        return {
          enunciado: `En un mapa de actores hay ${total} actores, y ${sin} de ellos nunca fueron invitados a ninguna reunión. ¿Qué porcentaje de los actores quedó afuera? Redondeá al entero.`,
          valor: Math.round((sin / total) * 100),
          unidad: '%',
          tol: 1,
          explicacion: `${sin} ÷ ${total} × 100 ≈ ${Math.round((sin / total) * 100)} %. Un proceso que deja afuera a una parte de los actores difícilmente construya acuerdos duraderos.`,
          ctx: `${sin} de ${total} actores sin invitar.`,
        };
      }, { d: 1 }),
      vf('Una posición y un interés son lo mismo.', false, 'La posición es lo que alguien pide ("no a la planta"); el interés es lo que necesita de fondo (agua limpia, salud). Distinguirlos abre opciones.', { // e7b
        razones: ['+Porque la posición es lo que se pide y el interés lo que se necesita', '-Porque los actores no tienen intereses', '-Porque las posiciones nunca chocan'],
        d: 1,
      }),
      det('Leé este análisis de un conflicto y marcá los errores.', [ // e8
        ['Listamos a vecinos, empresa, municipio y trabajadores.', false],
        ['No incluimos a la comunidad indígena porque tiene poco poder.', true, 'Tiene mucho interés y derechos: hay que incluirla.'],
        ['Buscamos los intereses detrás de cada posición.', false],
        ['Como las posiciones son opuestas, no hay ninguna solución posible.', true, 'Los intereses pueden ser compatibles aunque las posiciones choquen.'],
      ], 'Un mapa incompleto lleva a soluciones incompletas.', { d: 2 }),
      comp('Completá.', 'Lo que un actor dice que quiere es su [posición]; lo que necesita de fondo es su [interés]; y un mapa de actores los ubica según su interés y su [poder].', ['opinión', 'capricho', 'edad'], 'Tres ideas para mapear un conflicto antes de actuar.', { d: 1 }),
      mult('¿Qué preguntas ayudan a encontrar el interés detrás de una posición? Marcá todas.', [ // e10
        '+¿Por qué es importante esto para vos?',
        '+¿Qué te preocupa que pase?',
        '+¿Qué necesitarías para sentirte tranquilo?',
        '-¿Por qué estás equivocado?',
        '-¿Quién te dijo que pensaras eso?',
      ], 'Las preguntas abiertas y respetuosas revelan intereses; las acusatorias los esconden.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Herramientas y garantías', 'Evaluación de impacto, audiencias, información pública, amparo, consulta previa y la protección de quienes defienden el ambiente.', [
      teoria('Herramientas institucionales', [
        'Argentina tiene varias herramientas para canalizar conflictos ambientales. La Ley General del Ambiente exige evaluación de impacto ambiental antes de obras que puedan degradar el ambiente y prevé instancias de participación, como audiencias públicas. La Ley 25.831 garantiza el acceso a la información pública ambiental. El amparo ambiental permite pedir a un juez que frene un daño. Y el Convenio 169 de la OIT obliga a consultar a los pueblos indígenas.',
      ]),
      par('Uní cada herramienta con para qué sirve.', [ // e1
        ['Evaluación de impacto ambiental', 'Analizar los efectos antes de aprobar una obra'],
        ['Audiencia pública', 'Escuchar a la comunidad antes de decidir'],
        ['Pedido de información pública', 'Conocer datos que tiene el Estado'],
        ['Amparo ambiental', 'Pedir a un juez que frene un daño'],
        ['Consulta previa', 'Dialogar con pueblos indígenas antes de decidir'],
      ], 'Cada herramienta tiene su momento y su función.', { d: 2 }),
      ord('Ordená cuándo se usa cada herramienta, en un proyecto típico.', [ // e2
        'Pedir información pública sobre el proyecto',
        'Participar en la evaluación de impacto y la audiencia',
        'Controlar el cumplimiento de las condiciones',
        'Recurrir a la justicia si hay un daño o un incumplimiento',
      ], 'Las herramientas preventivas van antes; las judiciales, cuando lo anterior no alcanzó.', { d: 2 }),
      teoria('Quienes defienden el ambiente', [
        'Defender el ambiente puede ser peligroso. La organización Global Witness registra cada año asesinatos de personas defensoras de la tierra y del ambiente: más de 2.000 desde 2012, la mayoría en América Latina, y al menos 124 en 2025. Además hay amenazas, criminalización y acoso. El Acuerdo de Escazú, que Argentina aprobó, es el primer tratado del mundo con disposiciones específicas para proteger a las personas defensoras de derechos humanos en asuntos ambientales.',
      ]),
      est('Estimá cuántas personas defensoras de la tierra y el ambiente fueron asesinadas en el mundo desde 2012, según Global Witness.', 2000, { min: 10, max: 100000, unidad: 'personas', escala: 'log' }, 'Más de 2.000 desde 2012, la mayoría en América Latina. Por eso la protección de las personas defensoras es parte de la justicia ambiental.', { d: 3 }),
      vf('El Acuerdo de Escazú incluye disposiciones para proteger a quienes defienden el ambiente.', true, 'Es el primer tratado del mundo que lo hace de forma específica, junto con garantizar el acceso a la información, la participación y la justicia ambiental.', { // e4
        razones: ['+Porque incluye disposiciones específicas sobre personas defensoras', '-Porque Escazú solo trata sobre comercio', '-Porque Argentina no lo aprobó'],
        d: 2,
      }),
      mult('¿Qué situaciones ponen en riesgo a las personas defensoras del ambiente? Marcá todas.', [ // e5
        '+Amenazas por denunciar un desmonte ilegal',
        '+Causas judiciales infundadas por protestar pacíficamente',
        '+Campañas de desprestigio en redes',
        '-Recibir información pública que pidieron',
        '-Participar en una audiencia pública',
      ], 'Proteger a quienes defienden el ambiente es condición para que las otras herramientas funcionen.', { d: 2 }),
      clas('¿Es una herramienta preventiva o una de reparación?', { // e6
        'Preventiva': ['Evaluación de impacto ambiental', 'Consulta previa', 'Audiencia pública'],
        'De reparación o corrección': ['Amparo por un daño en curso', 'Juicio para recomponer un río contaminado'],
      }, 'Prevenir es más barato y justo que reparar; por eso las herramientas preventivas son centrales.', { d: 2 }),
      op('Un municipio aprueba un proyecto sin evaluación de impacto ni audiencia. ¿Qué pueden hacer los vecinos?', [ // e7
        'Pedir información y presentar un amparo',
        'Nada, porque la decisión ya está tomada',
        ['Destruir la obra por su cuenta', 'Es ilegal y violento; hay caminos institucionales.'],
        'Esperar a que el daño ocurra para reclamar',
      ], 'Los caminos institucionales existen para usarse, y la justicia puede frenar decisiones que no cumplen la ley.', { d: 2 }),
      numv(3, (i) => { // e8
        const [dias, ext] = [[15, 10], [15, 5], [15, 15]][i];
        return {
          enunciado: `La Ley 25.831 fija un plazo de hasta 30 días hábiles para responder un pedido de información ambiental. Si el organismo ya tardó ${dias + ext} días hábiles, ¿cuántos le quedan dentro del plazo?`,
          valor: 30 - (dias + ext),
          unidad: 'días hábiles',
          explicacion: `30 − ${dias + ext} = ${30 - (dias + ext)} días hábiles. Si vence el plazo sin respuesta, se puede reclamar por vía administrativa o judicial.`,
          ctx: `Plazo de 30 días hábiles; ya pasaron ${dias + ext}.`,
        };
      }, { d: 1 }),
      op('¿Qué herramienta te permite conocer los datos de monitoreo del agua que tiene la secretaría de ambiente?', [ // e8b
        'Un pedido de información pública ambiental',
        'Un plebiscito municipal sobre el agua',
        ['Un amparo por daño inminente', 'Sirve para frenar un daño; para obtener datos, primero se piden.'],
        'Una encuesta en redes sociales',
      ], 'La Ley 25.831 garantiza el acceso a la información ambiental que tiene el Estado.', { d: 1 }),
      det('Leé este volante y marcá lo equivocado.', [ // e9
        ['Tenemos derecho a pedir información pública ambiental.', false],
        ['El amparo ambiental solo lo pueden usar las empresas.', true, 'Pueden usarlo personas y organizaciones afectadas.'],
        ['La evaluación de impacto debe hacerse antes de aprobar una obra.', false],
        ['Defender el ambiente nunca implica riesgos personales.', true, 'Muchas personas defensoras sufren amenazas y violencia.'],
      ], 'Conocer los derechos y los riesgos es parte de participar con responsabilidad.', { d: 2 }),
      comp('Completá.', 'Analizar los efectos de una obra antes de aprobarla es una evaluación de [impacto] ambiental; pedirle a un juez que frene un daño es un [amparo]; y el tratado regional que protege a las personas defensoras es el Acuerdo de [Escazú].', ['precio', 'contrato', 'Kioto'], 'Tres herramientas clave para canalizar conflictos ambientales.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Transformar el conflicto', 'Diálogo, confianza, monitoreo conjunto y acuerdos: cómo se pasa de la confrontación a soluciones que duren.', [
      teoria('Transformar, no solo resolver', [
        'Resolver un conflicto a veces se entiende como "que termine". Transformarlo es más ambicioso: cambiar las relaciones y las reglas que lo produjeron, para que la próxima vez haya información, participación y confianza. Un acuerdo que deja resentimiento y desconfianza suele reabrirse; uno construido con todas las partes tiene más chances de durar.',
      ]),
      op('¿Qué diferencia hay entre resolver y transformar un conflicto?', [ // e1
        'Transformar cambia las reglas que lo causaron',
        'Resolver siempre es más lento que transformar',
        ['Transformar significa que una parte gane', 'No: busca cambiar las condiciones, no un ganador.'],
        'No hay ninguna diferencia entre las dos',
      ], 'Transformar apunta a que el conflicto no se repita con las mismas causas.', { d: 2 }),
      teoria('Construir confianza', [
        'La confianza se construye con hechos: información completa y a tiempo, compromisos que se cumplen, reglas claras sobre cómo se decide, y monitoreo que todos pueden ver. El monitoreo participativo —en el que la comunidad, la empresa y el Estado miden juntos el agua o el aire, con laboratorios independientes y datos públicos— es una herramienta poderosa: cambia la discusión de "a quién le creemos" a "qué muestran los datos".',
      ]),
      cad('Armá la cadena de cómo el monitoreo participativo construye confianza.', [ // e2
        'Comunidad, empresa y Estado acuerdan qué medir',
        'Un laboratorio independiente toma las muestras',
        'Los resultados se publican para todos',
        'Si hay un problema, se actúa con reglas pactadas',
        'La discusión se basa en datos compartidos',
      ], ['Cada parte mide por su cuenta y oculta los resultados'], 'Los datos compartidos no eliminan los desacuerdos, pero los vuelven discutibles con evidencia.', { d: 2 }),
      teoria('Diálogo y mediación', [
        'En una mesa de diálogo, los actores se sientan a buscar acuerdos con reglas claras: quién participa, cómo se toman decisiones, qué información se comparte. A veces ayuda una persona mediadora, neutral, que facilita la conversación. El diálogo funciona mejor cuando hay equilibrio: si una parte tiene toda la información y el poder, la mesa puede usarse para legitimar una decisión ya tomada.',
      ]),
      mult('¿Qué condiciones hacen que una mesa de diálogo sea genuina? Marcá todas.', [ // e3
        '+Todas las partes afectadas están invitadas',
        '+La información se comparte antes de las reuniones',
        '+Las reglas para decidir son claras y acordadas',
        '+Los acuerdos se publican y se controlan',
        '-La decisión ya está tomada antes de empezar',
      ], 'Una mesa de diálogo sin condiciones reales es un trámite, no una transformación.', { d: 2 }),
      teoria('El "no" también es una respuesta', [
        'Transformar un conflicto no significa que todos los proyectos tengan que aprobarse con condiciones. A veces, después de estudiar y dialogar, la conclusión legítima es que un proyecto no debe hacerse en ese lugar, o que debe cambiar mucho. Aceptar que el "no" es una salida posible es parte de un proceso honesto: si el resultado está decidido de antemano, no es un diálogo.',
      ]),
      vf('Un proceso de diálogo genuino siempre debe terminar con la aprobación del proyecto.', false, 'Si el resultado está definido de antemano, no es diálogo. Un proceso honesto puede terminar en aprobación con condiciones, en cambios grandes o en el rechazo del proyecto.', { // e4
        razones: ['+Porque el rechazo también es una salida legítima', '-Porque el diálogo nunca aprueba proyectos', '-Porque las comunidades deciden todo solas'],
        d: 2,
      }),
      clas('¿Esta acción ayuda a transformar el conflicto o lo agrava?', { // e5
        'Ayuda': ['Monitoreo participativo con datos públicos', 'Mediación con reglas acordadas', 'Cumplir los compromisos a tiempo'],
        'Agrava': ['Firmar un acuerdo con una sola parte', 'Cambiar las reglas a mitad del proceso', 'Descalificar a quienes reclaman'],
      }, 'Lo que construye confianza transforma; lo que la destruye, agrava.', { d: 1 }),
      rank('Ordená estas salidas de un conflicto de la más duradera a la menos duradera.', [ // e6
        ['Acuerdo con todas las partes, monitoreo conjunto y controles', 'la más duradera'],
        ['Decisión judicial que ordena condiciones', 'duradera si se controla'],
        ['Acuerdo firmado solo con una parte', 'frágil'],
        ['Imponer la decisión por la fuerza', 'la menos duradera'],
      ], 'Los acuerdos que incluyen a todos y se controlan tienden a durar más.', { d: 2, extremos: ['Más duradera', 'Menos duradera'] }),
      numv(3, (i) => { // e7
        const [comp, cumpl] = [[20, 17], [12, 9], [30, 27]][i];
        return {
          enunciado: `En un acuerdo, la empresa asumió ${comp} compromisos y cumplió ${cumpl} en el plazo. ¿Qué porcentaje cumplió?`,
          valor: Math.round((cumpl / comp) * 100),
          unidad: '%',
          tol: 1,
          explicacion: `${cumpl} ÷ ${comp} × 100 = ${Math.round((cumpl / comp) * 100)} %. Publicar este tipo de indicador es parte de construir confianza.`,
          ctx: `${cumpl} de ${comp} compromisos cumplidos.`,
        };
      }, { d: 1 }),
      par('Uní cada herramienta con su aporte.', [ // e8
        ['Monitoreo participativo', 'Datos que todas las partes aceptan'],
        ['Mediación', 'Una persona neutral facilita el diálogo'],
        ['Reglas acordadas', 'Todos saben cómo se decide'],
        ['Informes de cumplimiento', 'Se ve si los compromisos se cumplen'],
      ], 'Cada herramienta aporta una pieza de la confianza.', { d: 1 }),
      ord('Ordená los pasos de una mesa de diálogo genuina.', [ // e8b
        'Acordar quiénes participan, incluidos los más afectados',
        'Acordar las reglas y compartir la información',
        'Discutir opciones que atiendan los intereses de todos',
        'Firmar acuerdos con plazos y responsables',
        'Controlar y publicar el cumplimiento',
      ], 'Participantes, reglas, opciones, acuerdos y control: sin alguno, la mesa pierde legitimidad.', { d: 2 }),
      det('Leé este acuerdo y marcá lo que conviene cambiar.', [ // e9
        ['Habrá monitoreo del río con un laboratorio independiente.', false],
        ['Los resultados del monitoreo serán confidenciales.', true, 'Sin datos públicos no se construye confianza.'],
        ['Se reunirá una mesa con todas las partes cada tres meses.', false],
        ['La empresa podrá cambiar las reglas del acuerdo cuando quiera.', true, 'Las reglas deben acordarse y respetarse.'],
      ], 'Un buen acuerdo es transparente, estable y controlable.', { d: 2 }),
      comp('Completá.', 'Cambiar las relaciones y reglas que causan un conflicto es [transformarlo]; medir juntos con datos públicos es monitoreo [participativo]; y una persona neutral que facilita el diálogo cumple el rol de [mediación].', ['ignorarlo', 'secreto', 'sanción'], 'Tres ideas para transformar conflictos ambientales.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: conflictos ambientales', 'Tipos y etapas, casos argentinos, mapa de actores, herramientas y transformación, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: la planta junto al río', 'Una empresa propone una planta industrial junto al río de un pueblo. El conflicto está empezando. Diseñá un proceso para que no escale.', [
      teoria('La situación', [
        'Una empresa anunció una planta procesadora a 2 km del pueblo, junto al río del que toman agua 8.000 habitantes y varias familias de pescadores. Promete 150 empleos. Los vecinos se enteraron por el diario, no vieron ningún estudio y empiezan a organizarse. El municipio quiere la inversión. Una comunidad indígena que vive río abajo no fue mencionada. La empresa dice que "no hay nada que discutir porque todo es legal".',
      ]),
      clas('Ubicá a cada actor según su poder e interés.', { // e1
        'Mucho poder, mucho interés': ['La empresa', 'El municipio'],
        'Poco poder, mucho interés': ['Los vecinos que toman agua del río', 'Las familias de pescadores', 'La comunidad indígena río abajo'],
      }, 'Los actores más afectados son los que tienen menos poder: el proceso tiene que darles voz.', { d: 2 }),
      mult('¿Qué errores están haciendo escalar el conflicto? Marcá todos.', [ // e2
        '+Los vecinos se enteraron por el diario',
        '+No se publicó ningún estudio',
        '+No se mencionó a la comunidad indígena',
        '+La empresa dice que no hay nada que discutir',
        '-La empresa anunció empleos',
      ], 'Falta de información, exclusión y desprecio: la receta clásica de la escalada.', { d: 2 }),
      ord('Ordená un proceso para transformar el conflicto.', [ // e3
        'Publicar el proyecto y su evaluación de impacto completa',
        'Hacer audiencias accesibles y la consulta previa a la comunidad indígena',
        'Acordar monitoreo independiente del río si el proyecto avanza',
        'Decidir con condiciones claras, o no aprobar si los riesgos son altos',
        'Publicar informes de cumplimiento periódicos',
      ], 'Información, participación, datos compartidos, decisión honesta y control.', { d: 3 }),
      op('La empresa dice "no hay nada que discutir porque todo es legal". ¿Qué problema tiene esa postura?', [ // e4
        'Ignora el derecho de los vecinos a participar',
        'Que las empresas nunca cumplen la ley',
        ['Que la ley no se aplica a las empresas', 'Se aplica; y justamente incluye evaluación de impacto y participación.'],
        'Que la planta es demasiado chica',
      ], 'Cumplir la ley incluye informar y permitir participar; y aun así, escuchar es clave para evitar la escalada.', { d: 2 }),
      num('Si la planta ofrece 150 empleos y la condición acordada es que el 60 % sean de la zona, ¿cuántos puestos serían para personas locales?', 90, 'puestos', '150 × 0,6 = 90 puestos para personas de la zona. Una condición concreta y medible.', { ctx: '150 empleos; 60 % locales.', d: 1 }),
      vf('Si el municipio quiere la inversión, no hace falta consultar a la comunidad indígena río abajo.', false, 'La consulta previa es un derecho reconocido por el Convenio 169, y el municipio no puede decidir por la comunidad. Además, excluirla agravaría el conflicto.', { // e6
        razones: ['+Porque la consulta es un derecho que no depende del municipio', '-Porque las comunidades indígenas no usan el río', '-Porque el Convenio 169 no rige en Argentina'],
        d: 2,
      }),
      det('El municipio redacta el plan del proceso. Marcá lo que conviene corregir.', [ // e7
        ['Publicaremos la evaluación de impacto completa antes de la audiencia.', false],
        ['La audiencia será un martes a las 9 en la capital provincial.', true, 'Conviene hacerla en el pueblo, en un horario accesible.'],
        ['Consultaremos a la comunidad indígena antes de decidir.', false],
        ['Los resultados del monitoreo los verá solo la empresa.', true, 'Deben ser públicos para construir confianza.'],
      ], 'Un buen proceso cuida los detalles: lugar, horario, información y transparencia.', { d: 3 }),
    ]),
  ],
});
