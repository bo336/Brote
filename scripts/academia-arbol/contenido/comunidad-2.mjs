import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// COMUNIDAD 2 — Derechos y participación ambiental.
// El marco que permite actuar: el derecho a un ambiente sano en la
// Constitución, la Ley General del Ambiente y sus principios, el acceso a
// la información pública ambiental y el Acuerdo de Escazú, las formas de
// participar y la educación ambiental. Retoma organizarse en el barrio
// (comunidad-1).

export default unidad({
  slug: 'comunidad-2',
  rama: 'comunidad',
  orden: 2,
  nivel: 1,
  requiereTronco: 1,
  titulo: 'Derechos y participación ambiental',
  bajada: 'Tenés derecho a un ambiente sano, a saber qué pasa con él y a participar en las decisiones. Qué dicen la Constitución y las leyes, y cómo usarlas.',
  objetivos: [
    'Explicar el derecho a un ambiente sano del artículo 41 de la Constitución Nacional',
    'Reconocer los principios de la Ley General del Ambiente',
    'Ejercer el derecho de acceso a la información pública ambiental',
    'Identificar las formas de participación ciudadana en decisiones ambientales',
    'Relacionar la educación ambiental y los ODS con la acción local',
  ],
  repasa: ['comunidad-1', 'tronco-3'],
  fuentes: ['ley-25675-ambiente', 'ley-25831-info', 'escazu', 'ley-27621-eai', 'onu-ods', 'unesco-ods', 'acumar'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('El derecho a un ambiente sano', 'Qué dice el artículo 41 de la Constitución, qué significa y qué deberes trae.', [
      teoria('El artículo 41', [
        'Desde la reforma de 1994, la Constitución Nacional reconoce en su artículo 41 que todos los habitantes gozan del derecho a un ambiente sano, equilibrado, apto para el desarrollo humano y para que las actividades productivas satisfagan las necesidades presentes sin comprometer las de las generaciones futuras. Y agrega que tienen el deber de preservarlo.',
        'También establece que el daño ambiental genera, prioritariamente, la obligación de recomponer: es decir, de reparar el ambiente dañado, no solo de pagar.',
      ], { destacado: { valor: 'Art. 41', texto: 'de la Constitución Nacional reconoce el derecho a un ambiente sano y el deber de preservarlo.' } }),
      mult('¿Qué establece el artículo 41 de la Constitución? Marcá todo lo correcto.', [ // e1
        '+El derecho de todos a un ambiente sano',
        '+El deber de preservarlo',
        '+Que no se comprometa a las generaciones futuras',
        '+Que el daño ambiental obliga prioritariamente a recomponer',
        '-Que solo los dueños de tierras tienen derechos ambientales',
      ], 'Un derecho de todos, con deberes, que piensa en el futuro y prioriza reparar.', { d: 1 }),
      teoria('Derechos y deberes', [
        'El derecho a un ambiente sano no es solo algo que se reclama: viene con el deber de cuidarlo. Además, la Constitución obliga a las autoridades a proteger ese derecho, a usar racionalmente los recursos, a preservar el patrimonio natural y cultural y la diversidad biológica, y a informar y educar.',
        'La Nación dicta los "presupuestos mínimos" de protección ambiental, que valen en todo el país, y las provincias pueden complementarlos con normas más exigentes.',
      ]),
      clas('¿Es un derecho o un deber que surge del artículo 41?', { // e2
        'Derecho': ['Vivir en un ambiente sano', 'Recibir información ambiental', 'Que se recomponga un daño ambiental'],
        'Deber': ['Preservar el ambiente', 'No comprometer a las generaciones futuras'],
      }, 'Derechos y deberes van juntos. Nadie tiene derecho a dañar el ambiente de todos.', { d: 2 }),
      vf('El derecho a un ambiente sano solo protege a las personas que viven hoy.', false, 'El artículo 41 habla explícitamente de no comprometer las necesidades de las generaciones futuras.', { // e3
        razones: ['+Porque menciona explícitamente a las generaciones futuras', '-Porque la Constitución no habla del ambiente', '-Porque solo protege a los adultos'],
        d: 2,
      }),
      op('Una fábrica contamina un arroyo. Según el artículo 41, ¿qué corresponde en primer lugar?', [ // e4
        'Recomponer el ambiente dañado',
        'Pagar una multa y seguir igual',
        ['Mudar a los vecinos a otro barrio', 'La obligación prioritaria es reparar el daño, no trasladar el problema.'],
        'Nada, porque la fábrica da trabajo',
      ], 'Recomponer es la prioridad: devolver el ambiente a su estado anterior en lo posible.', { d: 2 }),
      teoria('Presupuestos mínimos', [
        'Las leyes de presupuestos mínimos fijan una protección básica común para todo el país: por ejemplo, la Ley General del Ambiente, la de bosques nativos, la de glaciares, la de residuos domiciliarios. Las provincias y los municipios no pueden proteger menos, pero sí pueden proteger más.',
      ]),
      par('Uní cada ley de presupuestos mínimos con su tema.', [ // e5
        ['Ley 25.675', 'Ley General del Ambiente'],
        ['Ley 26.331', 'Bosques nativos'],
        ['Ley 26.639', 'Glaciares y ambiente periglacial'],
        ['Ley 25.916', 'Residuos domiciliarios'],
      ], 'Leyes que ya viste en otras ramas, unidas por la misma lógica: un piso común para todo el país.', { d: 3 }),
      cad('Armá la cadena de cómo funcionan los presupuestos mínimos.', [ // e6
        'La Nación dicta una ley de presupuestos mínimos',
        'Fija una protección básica para todo el país',
        'Una provincia puede dictar normas más exigentes',
        'Nunca puede proteger menos que el piso nacional',
      ], ['Cada provincia puede ignorar la ley nacional'], 'Un piso común y la posibilidad de subir la vara según cada lugar.', { d: 2 }),
      det('Leé esta opinión y marcá lo equivocado.', [ // e7
        ['La Constitución reconoce el derecho a un ambiente sano desde 1994.', false],
        ['Ese derecho no trae ningún deber para los habitantes.', true, 'El artículo 41 establece también el deber de preservar el ambiente.'],
        ['El daño ambiental obliga prioritariamente a recomponer.', false],
        ['Una provincia puede proteger menos que la ley nacional de presupuestos mínimos.', true, 'Puede proteger más, pero nunca menos que el piso nacional.'],
      ], 'Conocer bien el marco legal es la base para ejercer los derechos.', { d: 2 }),
      comp('Completá.', 'El artículo [41] de la Constitución reconoce el derecho a un ambiente sano; el daño ambiental obliga prioritariamente a [recomponer].', ['14', 'indemnizar'], 'Las dos ideas centrales del artículo 41, en una línea.', { d: 2 }),
      est('Estimá en qué año se incorporó el derecho a un ambiente sano a la Constitución Nacional.', 1994, { min: 1853, max: 2024, paso: 1, unidad: 'año' }, 'En la reforma de 1994, con el artículo 41. Desde entonces es un derecho de rango constitucional.', { d: 2 }),
      rank('Ordená estas normas de mayor a menor jerarquía.', [ // e10
        ['Constitución Nacional (art. 41)', 'la de mayor jerarquía'],
        ['Ley nacional de presupuestos mínimos', 'aplica en todo el país'],
        ['Ley provincial ambiental', 'complementa en la provincia'],
        ['Ordenanza municipal', 'aplica en el municipio'],
      ], 'Cada nivel respeta al de arriba y puede sumar protección para su territorio.', { d: 2, extremos: ['Mayor jerarquía', 'Menor jerarquía'] }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('La Ley General del Ambiente', 'Los principios de la Ley 25.675, la evaluación de impacto ambiental y la participación ciudadana.', [
      teoria('Una ley marco', [
        'La Ley 25.675, General del Ambiente, sancionada en 2002, es la ley marco de la política ambiental argentina. Establece objetivos, principios, instrumentos de gestión (como la evaluación de impacto ambiental), la participación ciudadana, el acceso a la información y reglas sobre el daño ambiental.',
      ]),
      teoria('Los principios', [
        'La ley fija principios que guían la interpretación de las normas ambientales. Entre ellos: el principio preventivo (atender las causas de los problemas antes de que ocurran); el precautorio (cuando hay peligro de daño grave o irreversible, la falta de certeza científica no puede usarse como excusa para no actuar); la equidad intergeneracional (cuidar el ambiente para las generaciones futuras); la progresividad (metas graduales); la responsabilidad (quien daña, se hace cargo); y la solidaridad y la cooperación entre jurisdicciones.',
      ], { lista: ['Preventivo', 'Precautorio', 'Equidad intergeneracional', 'Progresividad', 'Responsabilidad', 'Solidaridad y cooperación'] }),
      par('Uní cada principio con su significado.', [ // e1
        ['Preventivo', 'Atender las causas antes de que ocurra el daño'],
        ['Precautorio', 'La falta de certeza no justifica no actuar ante un daño grave'],
        ['Equidad intergeneracional', 'Cuidar el ambiente para las próximas generaciones'],
        ['Responsabilidad', 'Quien causa un daño se hace cargo'],
      ], 'Cuatro principios que se usan en fallos judiciales y decisiones de gobierno.', { d: 3 }),
      op('Hay indicios de que un químico podría causar un daño grave e irreversible, pero la ciencia todavía no tiene certeza. Según el principio precautorio, ¿qué corresponde?', [ // e2
        'Tomar medidas de protección aunque falte certeza',
        'Esperar a tener certeza total antes de hacer nada',
        ['Usarlo más para ver qué pasa', 'Probar "en el terreno" un posible daño irreversible es justo lo que el principio busca evitar.'],
        'Dejar que cada persona decida si lo usa',
      ], 'La falta de certeza no puede ser excusa para no proteger ante un posible daño grave o irreversible.', { d: 3 }),
      vf('Según el principio precautorio, si no hay certeza científica absoluta de un daño, no se puede hacer nada.', false, 'Es al revés: cuando hay peligro de daño grave o irreversible, la falta de certeza no puede usarse como razón para no tomar medidas.', { // e3
        razones: ['+Porque el principio dice que la falta de certeza no justifica no actuar', '-Porque la ley prohíbe actuar sin certeza', '-Porque la ciencia siempre tiene certeza absoluta'],
        d: 3,
      }),
      teoria('Evaluación de impacto ambiental', [
        'La ley establece que toda obra o actividad que pueda degradar el ambiente o afectar la calidad de vida de la población de forma significativa debe pasar por un procedimiento de evaluación de impacto ambiental (EIA) antes de hacerse. En ese proceso se analizan los impactos, se proponen medidas para evitarlos o reducirlos y la autoridad decide si la aprueba.',
        'La ley también prevé instancias de consulta o audiencias públicas, sobre todo en proyectos con impactos importantes.',
      ]),
      ord('Ordená las etapas típicas de una evaluación de impacto ambiental.', [ // e4
        'La empresa presenta el proyecto',
        'Se elabora un estudio de impacto ambiental',
        'Se abre una instancia de participación ciudadana',
        'La autoridad evalúa y decide',
        'Si se aprueba, se controla que se cumplan las condiciones',
      ], 'Evaluar antes de construir, con participación y con control después.', { d: 2, extremos: ['Primero', 'Último'] }),
      clas('¿Esta obra probablemente necesita evaluación de impacto ambiental o no?', { // e5
        'Probablemente sí': ['Un relleno sanitario nuevo', 'Una fábrica junto a un río', 'Un barrio sobre un humedal'],
        'Probablemente no': ['Pintar la fachada de una casa', 'Plantar un árbol en la vereda', 'Cambiar las lámparas de una escuela'],
      }, 'La evaluación se exige a lo que puede degradar el ambiente de forma significativa.', { d: 2 }),
      cad('Armá la cadena de por qué evaluar antes de construir es preventivo.', [ // e6
        'Se evalúa el impacto antes de construir',
        'Se detectan riesgos para un humedal',
        'Se cambia el diseño o la ubicación del proyecto',
        'Se evita un daño que después costaría mucho reparar',
      ], ['Evaluar después de construir es igual de efectivo'], 'Prevenir es más barato y efectivo que reparar: el principio preventivo en acción.', { d: 2 }),
      mult('¿Qué incluye la Ley General del Ambiente? Marcá todo.', [ // e7
        '+Principios de política ambiental',
        '+La evaluación de impacto ambiental',
        '+La participación ciudadana',
        '+El acceso a la información ambiental',
        '-La prohibición de toda actividad productiva',
      ], 'Es una ley marco para compatibilizar el desarrollo con el cuidado del ambiente, no para prohibir producir.', { d: 1 }),
      clas('¿Qué principio de la Ley General del Ambiente aplica cada decisión?', {
        'Preventivo': ['Exigir filtros antes de habilitar una fábrica', 'Evaluar el impacto antes de construir'],
        'Precautorio': ['Suspender un químico con indicios de daño grave aunque falten estudios', 'Frenar un desmonte ante un posible daño irreversible sin certeza total'],
        'Responsabilidad': ['Obligar a quien contaminó a limpiar el arroyo', 'Que la empresa pague la recomposición del suelo'],
      }, 'Tres principios distintos que muchas veces se aplican juntos.', { d: 3 }),
      est('Estimá en qué año se sancionó la Ley General del Ambiente (25.675).', 2002, { min: 1950, max: 2024, paso: 1, unidad: 'año' }, 'En 2002. Ocho años después de que la reforma constitucional incorporara el artículo 41.', { d: 2 }),
      det('Leé esta nota y marcá lo equivocado.', [ // e8
        ['La Ley 25.675 es la Ley General del Ambiente.', false],
        ['La evaluación de impacto ambiental se hace después de construir la obra.', true, 'Se hace antes, para prevenir daños.'],
        ['La ley incluye el principio de equidad intergeneracional.', false],
        ['El principio precautorio exige certeza absoluta antes de proteger.', true, 'Dice lo contrario: la falta de certeza no justifica no actuar ante un daño grave.'],
      ], 'Los principios de la ley se aplican en decisiones y fallos concretos.', { d: 3 }),
      comp('Completá.', 'La Ley [25.675] es la Ley General del Ambiente; su principio [precautorio] dice que la falta de certeza no justifica no actuar ante un daño grave.', ['26.331', 'progresivo'], 'La ley marco y uno de sus principios más importantes.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Tu derecho a saber', 'Cómo pedir información pública ambiental con la Ley 25.831, y qué agrega el Acuerdo de Escazú.', [
      teoria('La Ley 25.831', [
        'La Ley 25.831, de Régimen de Libre Acceso a la Información Pública Ambiental, garantiza que cualquier persona puede pedir información ambiental que tengan los organismos públicos y las empresas de servicios públicos. No hace falta explicar para qué se pide ni demostrar un interés especial, y el acceso es gratuito, salvo los costos de copia.',
        'La autoridad tiene un plazo máximo de 30 días hábiles para responder. Solo puede negarse en casos específicos, por ejemplo, si la información afecta la defensa nacional o secretos comerciales protegidos, y debe fundamentar la negativa.',
      ], { destacado: { valor: '30 días hábiles', texto: 'es el plazo máximo para responder un pedido de información pública ambiental, según la Ley 25.831.' } }),
      mult('¿Qué garantiza la Ley 25.831? Marcá todo lo correcto.', [ // e1
        '+Que cualquier persona puede pedir información ambiental',
        '+Que no hace falta explicar para qué se pide',
        '+Que es gratuita, salvo costos de copia',
        '+Un plazo máximo de 30 días hábiles para responder',
        '-Que solo pueden pedirla los abogados',
      ], 'Un derecho amplio y simple: cualquiera puede pedir, sin justificar, y con un plazo definido.', { d: 1 }),
      vf('Para pedir información ambiental hay que demostrar que uno está afectado por el problema.', false, 'La ley establece que no hace falta acreditar ningún interés especial: cualquier persona puede pedir información ambiental.', { // e2
        razones: ['+Porque la ley no exige acreditar interés', '-Porque solo pueden pedir los afectados directos', '-Porque la información ambiental es secreta'],
        d: 2,
      }),
      teoria('Cómo hacer un buen pedido', [
        'Un buen pedido de información es claro y concreto: dice qué información se busca, de qué lugar y período, y en qué formato se prefiere recibir. Por ejemplo: "Solicito los resultados de los análisis de calidad del agua del arroyo X realizados en los últimos dos años, en formato digital".',
        'Conviene guardar una copia con la fecha de presentación, para poder reclamar si no hay respuesta en el plazo.',
      ]),
      op('¿Cuál es el pedido de información mejor formulado?', [ // e3
        'Análisis del agua del arroyo X de 2023 y 2024, en digital',
        'Quiero saber todo lo que pasa con el ambiente del municipio',
        ['¿Por qué el arroyo del barrio está tan sucio y quién tiene la culpa?', 'Es una pregunta legítima, pero un pedido de información funciona mejor pidiendo documentos o datos concretos.'],
        'Necesito que me digan si hay contaminación en algún lugar de la ciudad',
      ], 'Qué, dónde, cuándo y en qué formato: así es más fácil responder y más difícil evadir.', { d: 2 }),
      ord('Ordená los pasos para pedir información ambiental.', [ // e4
        'Identificar qué información necesitás y quién la tiene',
        'Redactar un pedido claro y concreto',
        'Presentarlo y guardar copia con fecha',
        'Esperar la respuesta dentro de los 30 días hábiles',
        'Si no responden, reclamar',
      ], 'Un procedimiento simple que cualquier persona o escuela puede usar.', { d: 2, extremos: ['Primero', 'Último'] }),
      teoria('El Acuerdo de Escazú', [
        'El Acuerdo de Escazú es un tratado de América Latina y el Caribe sobre el acceso a la información, la participación pública y el acceso a la justicia en asuntos ambientales. Argentina lo aprobó por la Ley 27.566 en 2020, y entró en vigor en 2021.',
        'Es el primer tratado del mundo que incluye disposiciones específicas para proteger a las personas defensoras de derechos humanos en asuntos ambientales, que en la región sufren amenazas y ataques.',
      ]),
      par('Uní cada norma con lo que establece.', [ // e5
        ['Ley 25.831', 'Acceso a la información pública ambiental'],
        ['Acuerdo de Escazú (Ley 27.566)', 'Información, participación, justicia y protección de defensores'],
        ['Ley 25.675', 'Principios e instrumentos de la política ambiental'],
        ['Artículo 41 de la Constitución', 'Derecho a un ambiente sano'],
      ], 'Un sistema de normas que se complementan.', { d: 2 }),
      clas('¿Qué derecho de acceso ejerce cada persona?', { // e6
        'Acceso a la información': ['Pedir los análisis de agua de un arroyo', 'Consultar el estudio de impacto de una obra'],
        'Participación': ['Hablar en una audiencia pública', 'Enviar observaciones a una consulta'],
        'Acceso a la justicia': ['Presentar un amparo ambiental', 'Denunciar un daño ambiental ante un juez'],
      }, 'Los tres pilares del Acuerdo de Escazú: saber, participar y reclamar.', { d: 2 }),
      numv(3, (i) => { // e7
        const dias = [30, 30, 30][i];
        const pres = ['lunes 3 de marzo', 'martes 1 de abril', 'jueves 5 de junio'][i];
        const sem = [6, 6, 6][i];
        return {
          enunciado: `Presentaste un pedido el ${pres}. Si no hay feriados, ¿cuántas semanas laborales de 5 días son los 30 días hábiles de plazo?`,
          valor: dias / 5,
          unidad: 'semanas',
          explicacion: `30 ÷ 5 = ${sem} semanas laborales, unos 42 días corridos si no hay feriados. Anotar la fecha límite ayuda a reclamar a tiempo.`,
        };
      }, { d: 1 }),
      vf('El acceso a la información pública ambiental es gratuito, salvo los costos de copia.', true, 'Así lo establece la Ley 25.831: el derecho no puede depender de pagar, más allá de los costos de reproducción.', {
        razones: ['+Porque la ley lo establece así', '-Porque hay que pagar una tasa por cada pregunta', '-Porque solo es gratis para empresas'],
        d: 1,
      }),
      clas('¿Esta negativa a dar información es legítima o no?', {
        'Puede ser legítima (si se fundamenta)': ['La información afecta la defensa nacional', 'Es un secreto comercial protegido por la ley'],
        'No es legítima': ['El funcionario no tiene ganas de buscarla', 'La persona no explicó para qué la quiere', 'Los datos muestran que hay contaminación'],
      }, 'Las excepciones son pocas y deben fundamentarse. Que los datos sean incómodos no es una razón válida.', { d: 3 }),
      det('Leé este consejo y marcá lo equivocado.', [ // e8
        ['Cualquier persona puede pedir información ambiental.', false],
        ['Si pedís información, tenés que explicar por qué la querés.', true, 'La Ley 25.831 no exige justificar el pedido.'],
        ['El plazo máximo de respuesta es de 30 días hábiles.', false],
        ['El Acuerdo de Escazú no tiene nada que ver con Argentina.', true, 'Argentina lo aprobó por la Ley 27.566 en 2020.'],
      ], 'Conocer tus derechos de acceso es el primer paso para usarlos.', { d: 2 }),
      comp('Completá.', 'La Ley [25.831] garantiza el acceso a la información ambiental, con un plazo de [30] días hábiles; el Acuerdo de [Escazú] protege además a las personas defensoras del ambiente.', ['25.916', '90', 'Kioto'], 'Las normas que sostienen el derecho a saber y a defender el ambiente.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Participar en las decisiones', 'Audiencias públicas, concejos deliberantes, presupuestos participativos y amparos: las herramientas para intervenir.', [
      teoria('Muchas puertas', [
        'Hay muchas formas de participar en decisiones ambientales: las audiencias públicas y consultas sobre proyectos con impacto; las bancas o sesiones abiertas de los concejos deliberantes; los presupuestos participativos, donde los vecinos proponen y votan proyectos; los consejos consultivos; y, cuando un derecho ambiental se vulnera, la vía judicial.',
      ]),
      par('Uní cada herramienta con lo que permite.', [ // e1
        ['Audiencia pública', 'Opinar sobre un proyecto antes de que se decida'],
        ['Presupuesto participativo', 'Proponer y votar obras para el barrio'],
        ['Concejo deliberante', 'Presentar proyectos de ordenanza o hablar en sesiones abiertas'],
        ['Amparo ambiental', 'Pedir a un juez que frene un daño ambiental'],
      ], 'Cuatro puertas distintas. Elegir la adecuada depende del problema y del momento.', { d: 2 }),
      teoria('La audiencia pública', [
        'En una audiencia pública, cualquier persona interesada puede inscribirse y expresar su opinión sobre un proyecto antes de que la autoridad decida. Las opiniones no son vinculantes —la autoridad no está obligada a hacer lo que se dice—, pero sí debe considerarlas y explicar cómo las tuvo en cuenta.',
        'Participar bien implica leer el proyecto, preparar argumentos con datos y proponer alternativas.',
      ]),
      vf('En una audiencia pública, la autoridad está obligada a hacer lo que diga la mayoría de los participantes.', false, 'Las opiniones no son vinculantes, pero la autoridad debe considerarlas y fundamentar su decisión. Por eso importa participar con buenos argumentos.', { // e2
        razones: ['+Porque las opiniones no son vinculantes, aunque deben considerarse', '-Porque en las audiencias no se puede hablar', '-Porque las audiencias se hacen después de decidir'],
        d: 3,
      }),
      ord('Ordená cómo prepararse para hablar en una audiencia pública.', [ // e3
        'Inscribirse en el plazo indicado',
        'Leer el proyecto y el estudio de impacto',
        'Buscar datos y preparar argumentos',
        'Proponer alternativas concretas',
        'Exponer con claridad en el tiempo asignado',
      ], 'Una buena participación se prepara: datos, argumentos y propuestas.', { d: 2, extremos: ['Primero', 'Último'] }),
      teoria('El amparo ambiental', [
        'El artículo 43 de la Constitución permite presentar una acción de amparo, un proceso judicial rápido, contra actos u omisiones que lesionen derechos como el de un ambiente sano. En los casos ambientales, puede presentarla la persona afectada, el Defensor del Pueblo y las asociaciones que protegen el ambiente.',
        'Uno de los casos más conocidos es la causa Mendoza, por la contaminación del Riachuelo, en la que la Corte Suprema ordenó en 2008 recomponer la cuenca, como viste en la rama de Agua.',
      ]),
      op('Una empresa empieza a rellenar un humedal sin evaluación de impacto ambiental. ¿Qué herramienta permite pedir a un juez que lo frene rápido?', [ // e4
        'Una acción de amparo ambiental',
        'Un presupuesto participativo',
        ['Una encuesta en redes sociales', 'Puede servir para difundir, pero no tiene efecto legal para frenar la obra.'],
        'Esperar a las próximas elecciones',
      ], 'El amparo es la vía judicial rápida para proteger un derecho que se está vulnerando.', { d: 2 }),
      clas('¿Qué herramienta conviene para cada situación?', { // e5
        'Presupuesto participativo': ['Proponer una huerta comunitaria en la plaza', 'Pedir bicicleteros en el centro del barrio'],
        'Audiencia pública': ['Opinar sobre un relleno sanitario proyectado', 'Dar argumentos sobre una obra en la costa del río'],
        'Amparo ambiental': ['Frenar un relleno ilegal de un humedal', 'Exigir que se deje de volcar un efluente tóxico'],
      }, 'Cada situación pide su herramienta: proponer, opinar o reclamar ante la justicia.', { d: 3 }),
      cad('Armá la cadena de cómo una propuesta vecinal puede volverse ordenanza.', [ // e6
        'Los vecinos detectan un problema y arman una propuesta',
        'Juntan firmas y apoyos',
        'Presentan la propuesta en el concejo deliberante',
        'Un concejal la toma y la presenta como proyecto',
        'Se debate y se vota',
      ], ['La propuesta se aprueba sola al presentarla'], 'Las ordenanzas también nacen en los barrios, cuando la propuesta está bien armada y tiene apoyo.', { d: 2 }),
      mult('¿Qué hace más efectiva la participación ciudadana? Marcá todo.', [ // e7
        '+Informarse antes de opinar',
        '+Presentar datos y argumentos',
        '+Proponer alternativas concretas',
        '+Sumar a otras organizaciones',
        '-Insultar a los funcionarios',
      ], 'Argumentos, propuestas y alianzas: la participación que cambia decisiones.', { d: 1 }),
      mult('¿Quiénes pueden presentar un amparo ambiental según el artículo 43 de la Constitución? Marcá todos.', [
        '+La persona afectada',
        '+El Defensor del Pueblo',
        '+Asociaciones que protegen el ambiente',
        '-Solo el intendente del municipio',
        '-Solo las empresas del lugar',
      ], 'La Constitución abre la puerta a los afectados, al Defensor del Pueblo y a las asociaciones ambientales.', { d: 2 }),
      op('En un presupuesto participativo, ¿qué propuesta suele tener más chances de ser elegida y concretada?', [
        'Una concreta, con costo estimado y apoyos',
        'Una idea general de mejorar todo el barrio',
        ['La más cara posible, para que se note', 'Un costo muy alto suele dejarla fuera del presupuesto disponible.'],
        'Una presentada el último día sin detalles',
      ], 'Las propuestas concretas, factibles y con apoyo vecinal son las que más avanzan.', { d: 2 }),
      det('Leé este mensaje en un grupo vecinal y marcá lo equivocado.', [ // e8
        ['Hay una audiencia pública sobre el nuevo relleno; inscribámonos.', false],
        ['No sirve ir, porque la audiencia no decide nada.', true, 'Las opiniones deben ser consideradas y fundamentadas; además quedan registradas y pueden servir después.'],
        ['Podemos llevar datos sobre la napa y proponer otra ubicación.', false],
        ['Solo los abogados pueden presentar un amparo ambiental.', true, 'Pueden presentarlo los afectados, el Defensor del Pueblo y asociaciones ambientales, con patrocinio letrado.'],
      ], 'Conocer las herramientas evita resignarse antes de tiempo.', { d: 3 }),
      comp('Completá.', 'En una audiencia [pública] cualquiera puede opinar sobre un proyecto; para frenar rápido un daño se puede presentar un [amparo] ambiental.', ['privada', 'reclamo'], 'Dos herramientas de participación, en una sola línea.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Educar y conectar con el mundo', 'La Ley de Educación Ambiental Integral y los Objetivos de Desarrollo Sostenible: del aula y el barrio a la agenda global.', [
      teoria('Educación Ambiental Integral', [
        'En 2021 se sancionó la Ley 27.621 de Educación Ambiental Integral, que establece que la educación ambiental es un derecho y debe estar presente en todos los niveles y modalidades de la educación, de forma transversal, y también en espacios no formales.',
        'La educación ambiental integral no es solo aprender datos: busca comprender los sistemas, valorar la diversidad, pensar críticamente y participar.',
      ]),
      mult('¿Qué busca la educación ambiental integral? Marcá todo.', [ // e1
        '+Comprender cómo funcionan los sistemas naturales y sociales',
        '+Pensar críticamente',
        '+Participar en la comunidad',
        '+Valorar la diversidad biológica y cultural',
        '-Memorizar datos sin relacionarlos',
      ], 'La educación ambiental integral forma para entender y actuar, no solo para repetir.', { d: 1 }),
      vf('La Ley 27.621 establece que la educación ambiental debe estar solo en la materia de biología.', false, 'Establece que debe ser transversal: estar presente en todos los niveles, modalidades y áreas, además de en espacios no formales.', { // e2
        razones: ['+Porque establece un enfoque transversal en toda la educación', '-Porque la ley prohíbe hablar de ambiente en otras materias', '-Porque solo aplica a las universidades'],
        d: 2,
      }),
      teoria('Los Objetivos de Desarrollo Sostenible', [
        'En 2015, los países de las Naciones Unidas acordaron la Agenda 2030 con 17 Objetivos de Desarrollo Sostenible (ODS). Incluyen terminar con la pobreza y el hambre, salud, educación, igualdad de género, agua y saneamiento, energía asequible y no contaminante, ciudades sostenibles, producción y consumo responsables, acción por el clima, vida submarina y vida de ecosistemas terrestres, entre otros.',
        'Los ODS muestran que lo ambiental, lo social y lo económico están conectados: no se puede resolver uno ignorando los otros.',
      ], { destacado: { valor: '17 ODS', texto: 'forman la Agenda 2030 acordada por los países de las Naciones Unidas en 2015.' } }),
      par('Uní cada ODS con un tema que ya viste en el árbol.', [ // e3
        ['ODS 6: Agua limpia y saneamiento', 'Rama de Agua'],
        ['ODS 7: Energía asequible y no contaminante', 'Rama de Energía'],
        ['ODS 12: Producción y consumo responsables', 'Ramas de Consumo y Residuos'],
        ['ODS 13: Acción por el clima', 'El tronco y todas las ramas'],
      ], 'El árbol de la Academia y la Agenda 2030 hablan de lo mismo desde lugares distintos.', { d: 2 }),
      cad('Armá la cadena de cómo un proyecto de barrio se conecta con los ODS.', [ // e4
        'Una escuela arma una huerta con compost',
        'Reduce los residuos orgánicos que van al relleno',
        'Produce alimentos y enseña a cultivarlos',
        'Aporta a los ODS de consumo responsable, hambre cero y educación',
      ], ['La huerta cumple sola toda la Agenda 2030'], 'Lo local suma a lo global. Los ODS sirven para ver esas conexiones.', { d: 2 }),
      clas('¿A qué ODS aporta más directamente cada acción?', { // e5
        'ODS 6 (agua)': ['Reparar las pérdidas de agua de la escuela', 'Monitorear la calidad de un arroyo'],
        'ODS 11 (ciudades)': ['Sumar ciclovías y veredas seguras', 'Recuperar una plaza abandonada'],
        'ODS 15 (vida terrestre)': ['Plantar nativas', 'Proteger un bosque nativo'],
      }, 'Muchas acciones aportan a varios ODS a la vez: esa es la idea de su integración.', { d: 2 }),
      op('¿Qué muestra que los 17 ODS se pensaron juntos?', [ // e6
        'Que ambiente, sociedad y economía se conectan',
        'Que cada país elige un solo objetivo',
        ['Que el ambiente importa más que la pobreza', 'Los ODS los ponen en el mismo nivel: se refuerzan entre sí.'],
        'Que son 17 temas separados sin relación',
      ], 'Por ejemplo, el acceso a agua segura mejora la salud, la educación y la igualdad de género al mismo tiempo.', { d: 2 }),
      numv(3, (i) => { // e7
        const anio = [2025, 2026, 2027][i];
        return {
          enunciado: `La Agenda 2030 se acordó en 2015. Si estamos en ${anio}, ¿cuántos años quedan para su meta de 2030?`,
          valor: 2030 - anio,
          unidad: 'años',
          explicacion: `2030 − ${anio} = ${2030 - anio} años. Pocos años para metas muy ambiciosas: por eso importa cada acción, desde lo local.`,
        };
      }, { d: 1 }),
      det('Leé esta presentación escolar y marcá lo equivocado.', [ // e8
        ['Los ODS son 17 y forman la Agenda 2030.', false],
        ['Los ODS solo hablan del ambiente, no de la pobreza.', true, 'Incluyen pobreza, hambre, salud, educación, igualdad y más.'],
        ['La Ley 27.621 hace de la educación ambiental un derecho.', false],
        ['La educación ambiental es solo para la escuela secundaria.', true, 'Debe estar en todos los niveles y también en espacios no formales.'],
      ], 'Educación ambiental y ODS: dos marcos que conectan el aula y el barrio con el mundo.', { d: 2 }),
      comp('Completá.', 'La Ley [27.621] es de Educación Ambiental Integral; la Agenda 2030 tiene [17] Objetivos de Desarrollo Sostenible.', ['25.675', '10'], 'Dos marcos que conectan la educación con la acción global.', { d: 1 }),
      rank('Ordená estos alcances del más local al más global.', [ // e10
        ['Proyecto de huerta de la escuela', 'barrio'],
        ['Ordenanza municipal de arbolado', 'ciudad'],
        ['Ley nacional de educación ambiental', 'país'],
        ['Agenda 2030 de las Naciones Unidas', 'mundo'],
      ], 'Distintas escalas que se conectan: lo que se hace en el barrio suma a las metas globales.', { d: 1, extremos: ['Más local', 'Más global'] }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: derechos y participación ambiental', 'Constitución, Ley General del Ambiente, acceso a la información, participación y educación, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el pedido del arroyo', 'Un curso quiere saber si el arroyo junto a la escuela está contaminado. Usá tus derechos para averiguarlo y actuar.', [
      teoria('La situación', [
        'Un curso de secundaria nota que el arroyo junto a la escuela tiene espuma y mal olor desde hace meses. Aguas arriba hay un parque industrial. El municipio no publica datos del arroyo. Los estudiantes quieren saber qué pasa y hacer algo.',
        'Un vecino les dice que "eso es cosa de abogados" y que no les van a responder.',
      ]),
      op('¿Cuál es el primer paso más útil?', [ // e1
        'Pedir los análisis del arroyo por la Ley 25.831',
        'Presentar un amparo sin tener ningún dato',
        ['Publicar en redes que la fábrica contamina', 'Sin datos, puede ser injusto y no resolver nada.'],
        'Esperar a que el municipio publique algo solo',
      ], 'Primero saber: la Ley 25.831 permite pedir los datos sin justificar el interés.', { d: 3 }),
      op('¿Qué pedido está mejor formulado?', [ // e2
        'Análisis del agua de los últimos 2 años y permisos de vuelco',
        'Queremos saber todo sobre la contaminación de toda la ciudad',
        ['¿La fábrica del parque industrial contamina el arroyo o no?', 'Conviene pedir documentos y datos concretos, no opiniones.'],
        'Que nos digan si podemos bañarnos en el arroyo este verano',
      ], 'Concreto: qué documentos, de qué lugar y de qué período.', { d: 3 }),
      num('Si presentan el pedido y el plazo máximo es de 30 días hábiles, ¿cuántas semanas laborales de 5 días tienen que esperar como máximo?', 6, 'semanas', '30 ÷ 5 = 6 semanas laborales, sin contar feriados. Anotar la fecha límite permite reclamar a tiempo.', { ctx: 'Plazo de 30 días hábiles de la Ley 25.831.', d: 1 }),
      ord('Ordená el plan del curso.', [ // e4
        'Pedir información pública ambiental con un pedido concreto',
        'Mientras tanto, registrar con fotos y fechas lo que observan',
        'Analizar la respuesta con un docente o especialista',
        'Si hay irregularidades, presentarlas en el concejo o en una audiencia',
        'Si hay un daño grave y no se actúa, evaluar un amparo con asesoramiento',
      ], 'Saber, documentar, analizar, participar y, si hace falta, reclamar judicialmente.', { d: 3, extremos: ['Primero', 'Último'] }),
      clas('Clasificá las afirmaciones del vecino y de los estudiantes.', { // e5
        'Correcta': ['Cualquier persona puede pedir información ambiental', 'No hace falta explicar para qué la piden', 'El amparo ambiental puede presentarlo quien se ve afectado'],
        'Incorrecta': ['Eso es cosa de abogados', 'Si no responden, no se puede hacer nada', 'Los menores no tienen derecho a un ambiente sano'],
      }, 'El derecho a un ambiente sano y a la información es de todas las personas.', { d: 3 }),
      vf('Si el municipio no responde en 30 días hábiles, los estudiantes pueden reclamar.', true, 'La ley fija ese plazo; si no se cumple o la negativa no está fundamentada, se puede reclamar por vía administrativa o judicial.', { // e6
        razones: ['+Porque la ley fija un plazo que debe cumplirse', '-Porque la ley no fija ningún plazo', '-Porque el municipio puede no responder nunca'],
        d: 2,
      }),
      det('El curso escribe su plan. Marcá lo que no conviene.', [ // e7
        ['Pedimos los análisis del arroyo con la Ley 25.831.', false],
        ['Mientras esperamos, publicamos que la fábrica X es culpable.', true, 'Sin datos, es una inferencia presentada como hecho: primero hay que saber.'],
        ['Registramos con fotos y fechas la espuma y el olor.', false],
        ['Si no responden, abandonamos porque no se puede hacer nada.', true, 'Se puede reclamar el incumplimiento del plazo.'],
      ], 'Usar los derechos con método: datos primero, participación después y reclamo si hace falta.', { d: 3 }),
    ]),
  ],
});
