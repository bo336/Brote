import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// COMUNIDAD 5 — Políticas públicas ambientales.
// Cómo nace, se decide, se aplica y se evalúa una política; qué herramientas
// existen; quién decide qué en el federalismo ambiental argentino; por qué
// hay distancia entre la ley y la realidad; y cómo influir con legitimidad.
// Retoma derechos y participación (comunidad-2), conflictos (comunidad-4),
// precios y subsidios (consumo-4) y evaluar qué funciona (ciencia-6).

export default unidad({
  slug: 'comunidad-5',
  rama: 'comunidad',
  orden: 5,
  nivel: 3,
  requiereTronco: 3,
  titulo: 'Políticas públicas ambientales',
  bajada: 'De un problema a una ley, de la ley a la realidad: el ciclo de las políticas, sus herramientas, quién decide en cada nivel del Estado y cómo participar para cambiarlas.',
  objetivos: [
    'Describir el ciclo de una política pública con casos argentinos',
    'Comparar herramientas regulatorias, económicas, informativas y de provisión pública',
    'Explicar el reparto de competencias ambientales entre Nación, provincias y municipios',
    'Analizar la brecha de implementación y cómo se evalúa una política',
    'Usar herramientas de participación como la iniciativa popular y la incidencia con evidencia',
  ],
  repasa: ['comunidad-2', 'comunidad-4', 'consumo-4', 'ciencia-6'],
  fuentes: ['constitucion-nacional', 'ley-25675-ambiente', 'ley-26639-glaciares', 'greenpeace-glaciares', 'ley-bosques-26331', 'chequeado-fondo-bosques', 'ley-24747-iniciativa', 'ley-25831-info', 'escazu', 'ley-27520-cambio-climatico', 'inventario-glaciares'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('El ciclo de una política', 'Agenda, formulación, decisión, implementación y evaluación, con el caso de la Ley de Glaciares.', [
      teoria('Del problema a la política', [
        'Una política pública es lo que el Estado decide hacer, o no hacer, frente a un problema. Suele pensarse como un ciclo: primero el problema entra en la agenda, es decir, pasa a considerarse algo que el Estado debe atender; después se formulan alternativas; se decide, por ejemplo con una ley o un decreto; se implementa; y se evalúa si funcionó, lo que puede llevar a cambiarla. En la práctica las etapas se superponen, pero el ciclo ayuda a ubicar dónde está cada discusión.',
      ]),
      ord('Ordená las etapas del ciclo de una política pública.', [ // e1
        'El problema entra en la agenda',
        'Se formulan alternativas',
        'Se toma una decisión',
        'Se implementa',
        'Se evalúa y se ajusta',
      ], 'El ciclo no termina: la evaluación vuelve a abrir la agenda.', { d: 1 }),
      clas('¿En qué etapa del ciclo está cada situación?', { // e2
        'Agenda': ['Una sequía hace que la escasez de agua aparezca en todos los medios', 'Vecinos logran que el concejo trate la basura del arroyo'],
        'Implementación': ['Se contratan inspectores para controlar la nueva norma', 'Se reparte el presupuesto entre las provincias'],
        'Evaluación': ['Se mide si bajaron los desmontes después de la ley', 'Una auditoría revisa si el programa cumplió sus metas'],
      }, 'Ubicar la etapa ayuda a saber qué pedir y a quién.', { d: 2 }),
      teoria('El caso de los glaciares', [
        'En octubre de 2008, el Congreso sancionó por unanimidad una ley para proteger los glaciares, la 26.418. Pocas semanas después, en noviembre, el Poder Ejecutivo la vetó por completo, argumentando que excedía las facultades de la Nación. Organizaciones sociales, especialistas y legisladores siguieron impulsando el tema, y en septiembre de 2010 el Congreso aprobó una nueva ley, la 26.639, de presupuestos mínimos para la preservación de los glaciares y el ambiente periglacial.',
      ], { destacado: { valor: '2008 → 2010', texto: 'una ley de glaciares vetada en 2008 volvió a aprobarse, con cambios, en 2010.' } }),
      cad('Armá la cadena de cómo se llegó a la Ley de Glaciares.', [ // e3
        'El retroceso de los glaciares y la minería en zonas de hielo entran en la agenda',
        'El Congreso aprueba una primera ley en 2008',
        'El Poder Ejecutivo la veta',
        'Organizaciones y legisladores siguen impulsando el tema',
        'En 2010 se aprueba la ley 26.639',
      ], ['El veto terminó definitivamente con el tema'], 'Un veto no siempre cierra una discusión: puede reabrir el ciclo.', { d: 2 }),
      par('Uní cada etapa del ciclo con un momento de la política de glaciares.', [
        ['Agenda', 'El retroceso del hielo y la minería en zonas glaciares ganan atención pública'],
        ['Decisión', 'El Congreso sanciona la ley 26.639 en 2010'],
        ['Implementación', 'Se elabora el Inventario Nacional de Glaciares'],
        ['Evaluación', 'Se revisa si las actividades en zonas protegidas cumplen la ley'],
      ], 'Cada etapa tiene sus actores y sus herramientas.', { d: 2 }),
      num('La primera ley de glaciares se sancionó en 2008 y la vigente en 2010. ¿Cuántos años pasaron?', 2, 'años', 'De 2008 a 2010 pasaron 2 años: las políticas ambientales suelen necesitar persistencia.', { ctx: 'Primera ley en 2008; ley vigente en 2010.', d: 1 }),
      op('¿Qué muestra el caso de la Ley de Glaciares sobre el ciclo de las políticas?', [ // e4
        'Que una decisión puede revertirse y el tema volver a la agenda',
        'Que una vez vetada, una ley nunca puede volver a tratarse',
        ['Que el Congreso no puede proteger recursos naturales', 'Puede dictar presupuestos mínimos de protección, como hizo en 2010.'],
        'Que las leyes ambientales se aprueban sin ningún debate',
      ], 'Las políticas se construyen en el tiempo, con avances y retrocesos.', { d: 2 }),
      teoria('Ventanas de oportunidad', [
        'Los problemas no entran solos en la agenda. Suele hacer falta que coincidan tres cosas: que el problema sea visible, muchas veces después de una crisis como una inundación o un incendio; que exista una propuesta de solución lista y viable; y que haya voluntad política para tratarla. Cuando coinciden, se abre una ventana de oportunidad que puede cerrarse rápido.',
      ]),
      mult('¿Qué puede abrir una ventana de oportunidad para una política ambiental? Marcá todo.', [ // e5
        '+Una crisis que hace visible el problema',
        '+Una propuesta de ley bien preparada',
        '+Un cambio de autoridades con interés en el tema',
        '+Datos nuevos que muestran la gravedad del problema',
        '-Que nadie hable del tema durante años',
      ], 'Tener propuestas listas antes de la crisis permite aprovechar la ventana cuando se abre.', { d: 2 }),
      op('¿Qué tres cosas suelen coincidir cuando se abre una ventana de oportunidad?', [
        'Un problema visible, una propuesta lista y voluntad política',
        'Un feriado largo, buen clima y poca gente en el Congreso',
        ['Solo que alguien famoso hable del tema una vez', 'La visibilidad ayuda, pero sin propuesta ni voluntad política no alcanza.'],
        'Que el problema desaparezca por sí solo',
      ], 'Cuando esas tres corrientes se juntan, un tema puede avanzar muy rápido.', { d: 2 }),
      vf('Una vez que una ley se aprueba, el problema queda resuelto.', false, 'Después vienen la implementación y la evaluación, donde muchas políticas fallan por falta de presupuesto, controles o datos. La ley es un paso, no el final.', {
        razones: ['+Porque falta implementarla, controlarla y evaluarla', '-Porque las leyes ambientales no se pueden aplicar', '-Porque aprobar una ley empeora el problema'],
        d: 1,
      }),
      det('Leé este resumen de un debate y marcá lo que conviene revisar.', [ // e6
        ['El tema entró en la agenda después de varias inundaciones.', false],
        ['Como la ley ya se votó, no hace falta medir nada más.', true, 'Sin evaluación no se sabe si la política funciona.'],
        ['Hay tres propuestas distintas en discusión.', false],
        ['Si la primera ley fue vetada, el tema está terminado para siempre.', true, 'Un tema vetado puede volver a la agenda, como pasó con los glaciares.'],
      ], 'Conocer el ciclo evita confundir un paso con el final del camino.', { d: 2 }),
      comp('Completá.', 'Cuando un problema pasa a considerarse algo que el Estado debe atender, entra en la [agenda]; cuando el Poder Ejecutivo rechaza una ley aprobada, la [veta]; y la ley vigente de glaciares es la [26.639].', ['vitrina', 'promulga', '25.675'], 'Tres conceptos para seguir la vida de una política.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Las herramientas', 'Normas, precios, información y obras: qué tipo de instrumento conviene para cada problema.', [
      teoria('Cuatro familias de herramientas', [
        'Los gobiernos tienen distintas herramientas. Las regulatorias fijan reglas obligatorias: límites de emisión, prohibiciones, permisos. Las económicas cambian precios: impuestos, subsidios, cobros por contaminar, como viste en consumo. Las informativas buscan cambiar decisiones con datos: etiquetas, campañas, registros públicos. Y la provisión pública construye u ofrece directamente lo que falta: plantas de tratamiento, transporte público, áreas protegidas.',
      ]),
      clas('¿Qué tipo de herramienta es cada medida?', { // e1
        'Regulatoria': ['Límite máximo de vertido de una industria', 'Prohibición de quemar pastizales'],
        'Económica': ['Cargo por cada vaso descartable', 'Subsidio para instalar paneles solares'],
        'Informativa': ['Etiqueta de eficiencia energética', 'Registro público de emisiones de empresas'],
        'Provisión pública': ['Construir una planta de tratamiento cloacal', 'Crear una línea de colectivos'],
      }, 'Cada familia actúa de forma distinta: obligar, cambiar precios, informar o construir.', { d: 2 }),
      teoria('Cómo elegir', [
        'Para elegir una herramienta se suelen mirar cuatro criterios: efectividad (¿reduce el problema?), costo (¿cuánto cuesta lograrlo?), equidad (¿quién paga y quién se beneficia?) y factibilidad (¿se puede aplicar y controlar con los recursos que hay?). En general funcionan mejor combinaciones: por ejemplo, un cargo a los descartables junto con alternativas reutilizables disponibles y una campaña que explique la medida.',
      ]),
      par('Uní cada criterio con la pregunta que responde.', [ // e2
        ['Efectividad', '¿Reduce de verdad el problema?'],
        ['Costo', '¿Cuánto cuesta lograr cada resultado?'],
        ['Equidad', '¿Quién paga y quién se beneficia?'],
        ['Factibilidad', '¿Se puede aplicar y controlar con lo que hay?'],
      ], 'Una buena política equilibra los cuatro criterios.', { d: 2 }),
      numv(3, (i) => { // e3
        const [costoA, resA, costoB, resB] = [[100, 500, 300, 2000], [80, 200, 150, 250], [200, 1000, 600, 2000]][i];
        const cA = costoA * 1000000 / resA;
        const cB = costoB * 1000000 / resB;
        const mejor = cA < cB ? 'A' : 'B';
        return {
          enunciado: `La medida A cuesta ${costoA} millones de pesos y evita ${resA.toLocaleString('es-AR')} toneladas de residuos; la B cuesta ${costoB} millones y evita ${resB.toLocaleString('es-AR')}. ¿Cuántos pesos por tonelada evitada cuesta la más costo-efectiva?`,
          valor: Math.min(cA, cB),
          unidad: 'pesos por tonelada',
          explicacion: `A: ${costoA} millones ÷ ${resA.toLocaleString('es-AR')} = ${cA.toLocaleString('es-AR')} pesos por tonelada. B: ${costoB} millones ÷ ${resB.toLocaleString('es-AR')} = ${cB.toLocaleString('es-AR')}. La más costo-efectiva es la ${mejor}, aunque cueste ${mejor === 'B' ? 'más en total' : 'menos en total'}. Valores de ejemplo.`,
          ctx: `A: ${costoA} millones y ${resA} t; B: ${costoB} millones y ${resB} t.`,
        };
      }, { d: 3 }),
      cad('Armá la cadena de por qué una prohibición sin alternativas puede fallar.', [ // e4
        'Se prohíbe un producto muy usado',
        'No hay alternativas accesibles ni baratas',
        'Aparecen el incumplimiento y el mercado informal',
        'Los controles no alcanzan',
        'El problema sigue, y la norma pierde legitimidad',
      ], ['Una prohibición se cumple sola aunque no haya alternativas'], 'Por eso las normas suelen combinarse con provisión de alternativas e información.', { d: 2 }),
      vf('Las campañas de información, por sí solas, suelen alcanzar para resolver problemas ambientales grandes.', false, 'Ayudan, pero rara vez alcanzan solas. Funcionan mejor combinadas con reglas, precios e infraestructura que hagan fácil la conducta deseada.', {
        razones: ['+Porque rara vez alcanzan solas; funcionan mejor combinadas', '-Porque la información nunca cambia ninguna conducta', '-Porque las campañas están prohibidas'],
        d: 2,
      }),
      op('Una ciudad quiere que los comercios reduzcan las bandejas descartables. ¿Qué combinación es más prometedora?', [ // e5
        'Un cargo por bandeja, alternativas reutilizables y una campaña',
        'Solo una campaña en redes sociales durante una semana',
        ['Prohibirlas de un día para otro sin alternativas ni aviso', 'Sin alternativas, se incumple y pierde apoyo.'],
        'Esperar a que los comercios cambien por su cuenta',
      ], 'La combinación de instrumentos suele ser más efectiva y más aceptada que uno solo.', { d: 2 }),
      mult('¿Qué hace más equitativa una política ambiental? Marcá todo.', [ // e6
        '+Compensar a los hogares de menores ingresos si suben precios',
        '+Que quien más contamina pague más',
        '+Invertir primero donde el problema es más grave',
        '+Consultar a quienes resultan afectados',
        '-Cobrar lo mismo a todos sin mirar quién contamina',
      ], 'La equidad no es un agregado: sin ella, muchas políticas pierden apoyo y fracasan.', { d: 2 }),
      rank('Una provincia quiere reducir los vertidos de una industria. Ordená estas opciones de la más completa a la menos.', [ // e7
        ['Límite de vertido, controles, multas y registro público', 'la más completa'],
        ['Límite de vertido con controles ocasionales', 'intermedia'],
        ['Solo una campaña pidiendo "cuidar el río"', 'débil'],
        ['No hacer nada y esperar', 'la menos completa'],
      ], 'Una regla sin control ni transparencia pierde mucha fuerza.', { d: 2, extremos: ['Más completa', 'Menos completa'] }),
      det('Leé este proyecto de ordenanza y marcá lo que conviene revisar.', [ // e8
        ['Se cobrará un cargo por cada bolsa descartable entregada.', false],
        ['Lo recaudado se usará para cualquier gasto, sin informar en qué.', true, 'Conviene destinarlo y rendir cuentas: mejora la aceptación y la equidad.'],
        ['Se ofrecerán bolsas reutilizables a bajo costo.', false],
        ['No se medirá el uso de bolsas antes ni después.', true, 'Sin medir no se puede evaluar si la ordenanza funciona.'],
      ], 'Buenas herramientas, bien combinadas, con transparencia y evaluación.', { d: 2 }),
      comp('Completá.', 'Un límite obligatorio de emisiones es una herramienta [regulatoria]; un cargo por contaminar es una herramienta [económica]; y construir una planta de tratamiento es [provisión] pública.', ['decorativa', 'emocional', 'publicidad'], 'Tres familias de herramientas para elegir con criterio.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Quién decide qué', 'El federalismo ambiental argentino: presupuestos mínimos, recursos provinciales, municipios y el COFEMA.', [
      teoria('Nación, provincias y municipios', [
        'El artículo 41 de la Constitución establece que la Nación dicta las normas de presupuestos mínimos de protección ambiental, y las provincias, las necesarias para complementarlas, sin alterar las jurisdicciones locales. El artículo 124 reconoce a las provincias el dominio originario de los recursos naturales de su territorio. Los municipios, por su parte, gestionan temas como los residuos, el ordenamiento urbano y el arbolado.',
        'Así, una provincia puede ser más exigente que una ley nacional de presupuestos mínimos, pero no menos.',
      ]),
      vf('Una provincia puede dictar normas ambientales menos exigentes que una ley nacional de presupuestos mínimos.', false, 'Los presupuestos mínimos son un piso común para todo el país. Las provincias pueden complementarlos con normas más exigentes, pero no bajar ese piso.', {
        razones: ['+Porque los presupuestos mínimos son un piso que no se puede bajar', '-Porque las provincias no pueden dictar normas ambientales', '-Porque las leyes nacionales no rigen en las provincias'],
        d: 2,
      }),
      clas('¿Qué nivel del Estado suele encargarse de cada tema?', { // e1
        'Nación': ['Dictar la Ley General del Ambiente', 'Fijar presupuestos mínimos para los glaciares'],
        'Provincias': ['Otorgar permisos de uso del agua de sus ríos', 'Hacer el ordenamiento de sus bosques nativos'],
        'Municipios': ['Organizar la recolección de residuos', 'Planificar el arbolado urbano'],
      }, 'Saber quién decide cada cosa es el primer paso para reclamar en el lugar correcto.', { d: 2 }),
      teoria('Leyes de presupuestos mínimos', [
        'Desde 2002, el Congreso aprobó varias leyes de presupuestos mínimos: la Ley General del Ambiente (25.675), la de acceso a la información ambiental (25.831), la de residuos domiciliarios (25.916), la de bosques nativos (26.331), la de glaciares (26.639), la de cambio climático (27.520) y la de educación ambiental integral (27.621), entre otras. Para coordinar entre jurisdicciones existe el Consejo Federal de Medio Ambiente (COFEMA), creado en 1990 e integrado por la Nación, las provincias y la Ciudad de Buenos Aires; la Ley General del Ambiente lo ratificó en 2002.',
      ]),
      par('Uní cada ley de presupuestos mínimos con su tema.', [ // e2
        ['25.675', 'Ley General del Ambiente'],
        ['26.331', 'Bosques nativos'],
        ['26.639', 'Glaciares y ambiente periglacial'],
        ['27.520', 'Cambio climático'],
      ], 'Estas leyes forman el piso ambiental común de todo el país.', { d: 2 }),
      op('¿Para qué existe el COFEMA?', [ // e3
        'Para coordinar la política ambiental entre Nación y provincias',
        'Para reemplazar a los gobiernos provinciales en temas ambientales',
        ['Para aprobar leyes en lugar del Congreso', 'No legisla: coordina entre jurisdicciones.'],
        'Para administrar todos los parques nacionales del país',
      ], 'En un país federal, muchos problemas ambientales cruzan fronteras provinciales y necesitan coordinación.', { d: 2 }),
      est('¿En qué año se creó el Consejo Federal de Medio Ambiente (COFEMA)?', 1990, { min: 1950, max: 2025, paso: 1, unidad: '' }, 'En 1990, en La Rioja; la Ley General del Ambiente lo ratificó en 2002.', { d: 3 }),
      op('Una provincia quiere fijar límites de vertido más estrictos que los de una norma nacional de presupuestos mínimos. ¿Puede hacerlo?', [
        'Sí: puede ser más exigente que el piso nacional',
        'No: las provincias no pueden dictar normas ambientales',
        ['Solo si todas las demás provincias hacen lo mismo', 'No hace falta: cada provincia puede complementar el piso común.'],
        'No: tiene que usar exactamente los mismos límites',
      ], 'Los presupuestos mínimos son un piso: se puede subir, no bajar.', { d: 2 }),
      cad('Armá la cadena de por qué un río que cruza provincias necesita coordinación.', [ // e4
        'Un río nace en una provincia y atraviesa otras',
        'Cada provincia regula el uso del agua en su territorio',
        'Lo que hace una aguas arriba afecta a las de aguas abajo',
        'Sin acuerdos aparecen conflictos',
        'Hacen falta organismos y acuerdos de cuenca',
      ], ['Cada provincia puede ignorar lo que pasa aguas abajo'], 'Como viste con las cuencas, el agua no respeta los límites políticos.', { d: 2 }),
      numv(3, (i) => { // e5
        const [total, pct] = [[24, 50], [24, 75], [24, 25]][i];
        return {
          enunciado: `Si ${Math.round(total * pct / 100)} de las ${total} jurisdicciones del país (23 provincias y la Ciudad de Buenos Aires) tienen su propio plan de respuesta al cambio climático aprobado, ¿qué porcentaje de las jurisdicciones lo tiene?`,
          valor: pct,
          unidad: '%',
          explicacion: `${Math.round(total * pct / 100)} ÷ ${total} × 100 = ${pct} %. Valores de ejemplo: la ley 27.520 pide que cada jurisdicción elabore su plan, y seguir cuántas lo hicieron es un indicador de implementación.`,
          ctx: `${Math.round(total * pct / 100)} de ${total} jurisdicciones con plan.`,
        };
      }, { d: 1 }),
      mult('¿Qué temas suelen necesitar coordinación entre varias provincias? Marcá todos.', [ // e6
        '+Ríos que atraviesan varias provincias',
        '+Incendios en zonas limítrofes',
        '+Especies migratorias',
        '+Contaminación del aire que cruza límites',
        '-El horario de una plaza de barrio',
      ], 'Los ecosistemas no siguen los límites administrativos.', { d: 1 }),
      det('Leé este comentario en redes y marcá lo que conviene revisar.', [ // e7
        ['La Nación dicta presupuestos mínimos de protección ambiental.', false],
        ['Las provincias no pueden hacer nada en temas ambientales.', true, 'Complementan las normas nacionales y tienen el dominio de sus recursos.'],
        ['La recolección de residuos suele ser un tema municipal.', false],
        ['Una provincia puede permitir lo que una ley de presupuestos mínimos prohíbe.', true, 'Puede ser más exigente, no menos.'],
      ], 'Entender el federalismo evita reclamar en el lugar equivocado.', { d: 2 }),
      comp('Completá.', 'La Nación dicta los presupuestos [mínimos] de protección ambiental; el artículo [124] de la Constitución reconoce a las provincias el dominio de sus recursos naturales; y la coordinación federal ambiental está a cargo del [COFEMA].', ['máximos', '14', 'INDEC'], 'Tres claves del federalismo ambiental argentino.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('De la ley a la realidad', 'La brecha de implementación: presupuesto, controles, capacidades y datos, y cómo se evalúa una política.', [
      teoria('La brecha de implementación', [
        'Muchas leyes ambientales buenas se aplican a medias. Las causas son conocidas: falta de presupuesto, pocos inspectores, organismos con poca capacidad técnica, falta de datos para controlar y sanciones que no se cobran. Como viste con los bosques, el fondo que creó la Ley de Bosques recibió en presupuestos recientes solo una parte muy chica de lo que establece la ley, según Chequeado y otras organizaciones.',
      ]),
      mult('¿Qué causas explican que una ley ambiental se aplique a medias? Marcá todas.', [ // e1
        '+Presupuesto insuficiente',
        '+Pocos inspectores para controlar',
        '+Falta de datos para saber si se cumple',
        '+Multas que no se cobran',
        '-Que la ley esté bien escrita',
      ], 'Una buena ley sin recursos ni control se queda en el papel.', { d: 1 }),
      numv(3, (i) => { // e2
        const [debe, recibe] = [[100, 3], [80, 8], [120, 18]][i];
        return {
          enunciado: `Una ley establece que un fondo ambiental debe recibir ${debe} mil millones de pesos por año, pero el presupuesto le asigna ${recibe} mil millones. ¿Qué porcentaje de lo establecido recibe?`,
          valor: Math.round(recibe * 100 / debe),
          unidad: '%',
          explicacion: `${recibe} ÷ ${debe} × 100 = ${Math.round(recibe * 100 / debe)} %. Valores de ejemplo: comparar lo que fija la ley con lo que asigna el presupuesto es una forma simple de medir la brecha de implementación.`,
          ctx: `${debe} mil millones establecidos; ${recibe} asignados.`,
        };
      }, { d: 1 }),
      cad('Armá la cadena de cómo la falta de control debilita una norma.', [ // e3
        'Se aprueba un límite de vertidos',
        'Hay muy pocos inspectores',
        'Las industrias saben que casi no las controlan',
        'Algunas siguen vertiendo por encima del límite',
        'El río no mejora y la norma pierde credibilidad',
      ], ['Menos controles hacen que todos cumplan más'], 'La probabilidad de ser controlado pesa tanto como el tamaño de la multa.', { d: 2 }),
      numv(3, (i) => { // e4
        const [empresas, insp, visitas] = [[600, 4, 50], [300, 3, 40], [1200, 6, 60]][i];
        const anios = Math.round(empresas / (insp * visitas) * 10) / 10;
        return {
          enunciado: `Un organismo tiene ${insp} inspectores y cada uno puede visitar ${visitas} empresas por año. Si hay ${empresas.toLocaleString('es-AR')} empresas para controlar, ¿cada cuántos años recibe una visita cada empresa, en promedio?`,
          valor: anios,
          unidad: 'años',
          dec: 1,
          tol: 0.1,
          explicacion: `${insp} × ${visitas} = ${insp * visitas} visitas por año; ${empresas.toLocaleString('es-AR')} ÷ ${insp * visitas} = ${anios.toLocaleString('es-AR')} años. Con controles tan espaciados, conviene priorizar las empresas de mayor riesgo.`,
          ctx: `${insp} inspectores; ${visitas} visitas cada uno; ${empresas} empresas.`,
        };
      }, { d: 2 }),
      teoria('Evaluar una política', [
        'Evaluar una política es preguntarse si hizo lo que se proponía, a qué costo y con qué efectos no buscados. Para eso hacen falta metas claras, indicadores definidos desde el principio, datos de antes y después y, cuando se puede, un grupo de comparación, como viste al evaluar programas. La evaluación sirve para corregir, no solo para aplaudir o castigar.',
      ]),
      clas('¿Se evalúa la gestión (lo que se hizo) o el resultado (lo que cambió)?', { // e5
        'Gestión': ['Cantidad de inspecciones realizadas', 'Dinero ejecutado del presupuesto', 'Talleres de capacitación dictados'],
        'Resultado': ['Calidad del agua del río', 'Hectáreas de bosque desmontadas', 'Muertes por contaminación del aire'],
      }, 'Los dos importan, pero el éxito de una política se mide por los resultados.', { d: 2 }),
      op('¿Por qué conviene definir los indicadores de una política antes de aplicarla?', [ // e6
        'Para medir el punto de partida y evitar elegirlos a conveniencia',
        'Para no tener que medir nada después',
        ['Porque la ley obliga a publicar solo buenos resultados', 'No: se trata de poder evaluar con honestidad.'],
        'Para que la política dure menos tiempo',
      ], 'Sin línea de base no hay comparación; sin indicadores previos, cualquier resultado puede presentarse como éxito.', { d: 2 }),
      vf('Si un organismo gastó todo su presupuesto, eso prueba que la política funcionó.', false, 'Ejecutar el presupuesto es un dato de gestión. Que la política funcione se ve en los resultados: si el río está más limpio o si bajaron los desmontes.', {
        razones: ['+Porque gastar no es lo mismo que lograr resultados', '-Porque los organismos nunca gastan su presupuesto', '-Porque el presupuesto no importa'],
        d: 1,
      }),
      par('Uní cada problema de implementación con una respuesta posible.', [ // e7
        ['Pocos inspectores', 'Priorizar controles por nivel de riesgo'],
        ['Falta de datos', 'Monitoreo continuo con datos abiertos'],
        ['Presupuesto insuficiente', 'Fondos asignados por ley y rendición de cuentas'],
        ['Multas que no se cobran', 'Procedimientos de sanción rápidos y públicos'],
      ], 'Cada eslabón débil tiene respuestas concretas.', { d: 2 }),
      det('Leé este informe oficial y marcá lo que conviene revisar.', [ // e8
        ['El programa se propuso reducir un 30 % los vertidos en cinco años.', false],
        ['Como se hicieron 200 inspecciones, el río ya está limpio.', true, 'Las inspecciones son gestión; hay que medir la calidad del agua.'],
        ['Publicamos los resultados de calidad del agua de cada año.', false],
        ['No tenemos datos de antes del programa, pero seguro mejoró.', true, 'Sin línea de base no se puede afirmar una mejora.'],
      ], 'Un buen informe distingue lo que se hizo de lo que cambió.', { d: 2 }),
      comp('Completá.', 'La distancia entre lo que dice una ley y lo que pasa en la realidad es la brecha de [implementación]; el valor de partida de un indicador es la línea de [base]; y la calidad del agua de un río es un indicador de [resultado].', ['inauguración', 'llegada', 'gestión'], 'Tres conceptos para evaluar si una política cumple.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Influir en las políticas', 'Iniciativa popular, consulta, audiencias, coaliciones y evidencia: cómo incidir con legitimidad.', [
      teoria('Herramientas de la Constitución', [
        'La Constitución da herramientas para participar más allá del voto. Por el artículo 39, la ciudadanía puede presentar proyectos de ley en la Cámara de Diputados mediante la iniciativa popular: hacen falta las firmas de al menos el 1,5 % del padrón electoral, de por lo menos seis distritos, y el Congreso debe tratarlo en un plazo de doce meses. No pueden ser objeto de iniciativa popular la reforma constitucional, los tratados internacionales, los tributos, el presupuesto ni la materia penal. Por el artículo 40, el Congreso puede someter un proyecto a consulta popular.',
      ], { destacado: { valor: '1,5 %', texto: 'del padrón electoral, de al menos seis distritos, debe firmar una iniciativa popular para que el Congreso tenga que tratarla.' } }),
      numv(3, (i) => { // e1
        const padron = [36000000, 35000000, 34000000][i];
        return {
          enunciado: `Si el padrón electoral de la última elección de diputados tenía ${padron.toLocaleString('es-AR')} personas, ¿cuántas firmas como mínimo necesita una iniciativa popular (1,5 %)?`,
          valor: padron * 15 / 1000,
          unidad: 'firmas',
          explicacion: `${padron.toLocaleString('es-AR')} × 1,5 % = ${(padron * 15 / 1000).toLocaleString('es-AR')} firmas, repartidas en al menos seis distritos. Valores de padrón aproximados.`,
          ctx: `Padrón de ${padron} personas; 1,5 %.`,
        };
      }, { d: 2 }),
      clas('¿Puede ser objeto de una iniciativa popular o no?', { // e2
        'Puede serlo': ['Una ley de protección de humedales', 'Una ley de envases retornables', 'Una ley de educación ambiental'],
        'No puede serlo': ['Un nuevo impuesto a los combustibles', 'La reforma de la Constitución', 'El presupuesto nacional'],
      }, 'Los tributos, el presupuesto, los tratados, la reforma constitucional y la materia penal quedan afuera.', { d: 2 }),
      teoria('Incidir con evidencia', [
        'Además de las herramientas formales, las organizaciones influyen en las políticas con incidencia: reunirse con legisladores y funcionarios, presentar comentarios en audiencias públicas, aportar datos y estudios, formar coaliciones con otros actores y comunicar a la sociedad. La incidencia es más efectiva cuando propone soluciones concretas, se apoya en evidencia, suma aliados diversos y se sostiene en el tiempo. También importa la transparencia: saber quién se reúne con quién para defender qué intereses.',
      ]),
      ord('Ordená los pasos de una estrategia de incidencia.', [ // e3
        'Definir el cambio concreto que se busca',
        'Identificar quién tiene el poder de decidirlo',
        'Reunir evidencia y una propuesta viable',
        'Sumar aliados y construir una coalición',
        'Comunicar, dialogar y hacer seguimiento',
      ], 'Saber qué se pide y a quién es la mitad del camino.', { d: 2 }),
      op('¿Qué hace más efectiva una propuesta ante un concejo deliberante?', [ // e4
        'Evidencia, una solución viable y apoyo de varios sectores',
        'Muchos adjetivos y ningún dato',
        ['Amenazar a los concejales en redes sociales', 'La presión agresiva suele cerrar puertas y restar legitimidad.'],
        'Presentar solo el problema, sin ninguna propuesta',
      ], 'Proponer soluciones concretas y respaldadas facilita que se transformen en decisiones.', { d: 1 }),
      par('Uní cada herramienta con su uso.', [ // e5
        ['Iniciativa popular', 'Presentar un proyecto de ley con firmas'],
        ['Audiencia pública', 'Opinar antes de una decisión importante'],
        ['Pedido de información', 'Obtener datos que tiene el Estado'],
        ['Coalición', 'Sumar fuerzas con otros actores'],
      ], 'Cada herramienta sirve para un momento distinto del ciclo de la política.', { d: 1 }),
      cad('Armá la cadena de cómo una coalición amplia ayuda a aprobar una política.', [ // e6
        'Organizaciones ambientales, productores y vecinos acuerdan una propuesta',
        'La propuesta muestra apoyo de sectores distintos',
        'Los legisladores ven que no es un reclamo aislado',
        'Aumentan las chances de que la traten',
        'La política aprobada es más estable en el tiempo',
      ], ['Cuantos menos actores apoyen, más fácil se aprueba'], 'La diversidad de apoyos da legitimidad y durabilidad.', { d: 2 }),
      vf('La incidencia en políticas públicas es algo que solo pueden hacer las grandes empresas.', false, 'Cualquier persona u organización puede incidir: con pedidos de información, audiencias, iniciativas populares, coaliciones y propuestas con evidencia. La transparencia sobre quién incide ayuda a equilibrar.', {
        razones: ['+Porque cualquier persona u organización puede usar estas herramientas', '-Porque la ley prohíbe participar a las organizaciones sociales', '-Porque las políticas se deciden sin escuchar a nadie'],
        d: 1,
      }),
      mult('¿Qué prácticas hacen legítima una estrategia de incidencia? Marcá todas.', [ // e7
        '+Decir con claridad qué intereses se representan',
        '+Usar datos verificables',
        '+Escuchar a quienes piensan distinto',
        '+Respetar los canales y los tiempos institucionales',
        '-Difundir datos falsos si ayudan a la causa',
      ], 'La legitimidad es un capital: se construye con transparencia y honestidad.', { d: 1 }),
      det('Leé el plan de una organización vecinal y marcá lo que conviene revisar.', [ // e8
        ['Pediremos información sobre la calidad del agua del arroyo.', false],
        ['Juntaremos firmas para una iniciativa popular que cree un nuevo impuesto.', true, 'Los tributos no pueden ser objeto de iniciativa popular.'],
        ['Presentaremos una propuesta con datos en la audiencia pública.', false],
        ['Exageraremos los datos para que el problema parezca más grave.', true, 'Exagerar resta credibilidad y legitimidad: la evidencia tiene que ser verificable.'],
      ], 'Incidir bien es combinar derechos, evidencia y honestidad.', { d: 2 }),
      comp('Completá.', 'Presentar un proyecto de ley con firmas es una iniciativa [popular]; se necesitan las firmas del [1,5] % del padrón; y sumar fuerzas con otros actores es formar una [coalición].', ['privada', '15', 'competencia'], 'Tres herramientas para participar en las políticas.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: políticas públicas ambientales', 'Ciclo de políticas, herramientas, federalismo, implementación e incidencia, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: la ordenanza de envases de Río Claro', 'Río Claro, una ciudad de 80.000 habitantes, quiere reducir los envases descartables que terminan en su arroyo. Diseñá la política completa.', [
      teoria('La situación', [
        'Cada semana, en limpiezas del arroyo, se retiran unos 400 kg de envases descartables. El concejo discute tres propuestas: A, prohibir de inmediato todos los descartables; B, un cargo por cada envase descartable, con envases reutilizables disponibles y una campaña; C, solo una campaña de concientización. El municipio tiene 2 inspectores para 1.200 comercios, cada uno puede hacer 100 inspecciones por año, y no tiene datos de cuántos envases se usan hoy.',
      ]),
      num('¿Cada cuántos años recibiría una inspección cada comercio, en promedio? Redondeá a un decimal.', 6, 'años', '2 × 100 = 200 inspecciones por año; 1.200 ÷ 200 = 6 años. Con tan pocos controles, una prohibición total sería muy difícil de hacer cumplir.', { ctx: '2 inspectores; 100 inspecciones cada uno; 1.200 comercios.', dec: 1, tol: 0.1, d: 2 }),
      op('¿Qué propuesta es más prometedora con estos recursos?', [ // e2
        'La B: cargo, alternativas y campaña, fácil de controlar',
        'La A: prohibir todo de inmediato, aunque no se pueda controlar',
        ['La C: solo una campaña, porque es la más barata', 'Sola suele alcanzar poco para un problema así.'],
        'Ninguna, porque el arroyo se limpia solo',
      ], 'Combinar instrumentos y elegir algo que se pueda controlar con los recursos disponibles es clave.', { d: 2 }),
      clas('¿A qué etapa del ciclo corresponde cada tarea?', { // e3
        'Formulación': ['Comparar las propuestas A, B y C', 'Estimar cuánto costaría cada una'],
        'Implementación': ['Informar a los comercios y dar un plazo de adaptación', 'Distribuir envases reutilizables'],
        'Evaluación': ['Pesar los envases del arroyo antes y después', 'Encuestar a comercios sobre el cumplimiento'],
      }, 'Una política completa se piensa en todas sus etapas desde el principio.', { d: 2 }),
      op('¿Qué debería hacer el municipio antes de aprobar la ordenanza?', [ // e4
        'Medir cuántos envases se usan y llegan hoy al arroyo',
        'Aprobarla sin datos y medir recién dentro de diez años',
        ['Pedir a la Nación que decida por el municipio', 'La gestión de residuos es, en general, competencia municipal.'],
        'Esperar a que los comercios dejen de usar envases solos',
      ], 'Sin línea de base no habrá forma de saber si la ordenanza funcionó.', { d: 2 }),
      ord('Ordená el plan para la ordenanza.', [ // e5
        'Medir la línea de base de envases en comercios y en el arroyo',
        'Consultar a comercios, vecinos y cooperativas de reciclado',
        'Aprobar el cargo con alternativas y campaña',
        'Aplicarlo con un plazo de adaptación y controles por riesgo',
        'Evaluar al año y ajustar',
      ], 'Datos, participación, decisión, implementación y evaluación.', { d: 3 }),
      mult('¿Qué hace más justa la ordenanza? Marcá todo.', [ // e6
        '+Envases reutilizables accesibles para comercios chicos',
        '+Destinar lo recaudado a limpieza y reciclado, con rendición de cuentas',
        '+Un plazo de adaptación',
        '+Consultar a las cooperativas de reciclado',
        '-Aplicar multas máximas desde el primer día sin aviso',
      ], 'Una política justa es más aceptada, y por eso más efectiva.', { d: 2 }),
      det('El concejo redacta la ordenanza. Marcá lo que conviene corregir.', [ // e7
        ['El cargo por envase descartable será de valor accesible y conocido.', false],
        ['No se medirá nada; el éxito se verá "a simple vista".', true, 'Hace falta una línea de base y medir después para evaluar.'],
        ['Lo recaudado se destinará a limpieza del arroyo y reciclado.', false],
        ['Los 2 inspectores visitarán los 1.200 comercios cada mes.', true, 'Es imposible con esos recursos: hay que priorizar por riesgo.'],
      ], 'Una buena ordenanza es clara, realista, justa y evaluable.', { d: 3 }),
    ]),
  ],
});
