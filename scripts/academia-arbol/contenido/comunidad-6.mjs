import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// COMUNIDAD 6 — Liderar un proyecto colectivo.
// Teoría de cambio y modelo lógico, organización del equipo y formas de
// decidir, presupuesto y riesgos, cómo sostener un grupo en el tiempo con los
// principios de Ostrom para los bienes comunes, y cómo crecer, comunicar y
// evaluar. Retoma organizarse en el barrio (comunidad-1), la participación
// (comunidad-2), transformar conflictos (comunidad-4) y las políticas
// públicas (comunidad-5).

export default unidad({
  slug: 'comunidad-6',
  rama: 'comunidad',
  orden: 6,
  nivel: 3,
  requiereTronco: 3,
  titulo: 'Liderar un proyecto colectivo',
  bajada: 'De una buena idea a un proyecto que dura: teoría de cambio, equipos que deciden bien, presupuestos claros, grupos que no se queman y proyectos que crecen.',
  objetivos: [
    'Construir una teoría de cambio y un modelo lógico para un proyecto',
    'Organizar roles, reuniones y formas de decidir en un grupo',
    'Armar un presupuesto transparente y gestionar riesgos',
    'Aplicar los principios de Ostrom para sostener bienes comunes y grupos en el tiempo',
    'Comunicar, evaluar y hacer crecer un proyecto colectivo',
  ],
  repasa: ['comunidad-1', 'comunidad-2', 'comunidad-4', 'comunidad-5'],
  fuentes: ['teoria-del-cambio', 'kellogg-modelo-logico', 'ostrom-nobel-2009', 'bm-evaluacion-impacto', 'aci-principios', 'ley-25831-info'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Teoría de cambio', 'Del problema al cambio buscado: qué se hace, qué se produce, qué cambia y qué se supone en el camino.', [
      teoria('Pensar hacia atrás', [
        'Una teoría de cambio describe cómo y por qué se espera que un conjunto de acciones lleve a un cambio de largo plazo. Se construye pensando hacia atrás: primero se define el cambio que se busca y después qué condiciones hacen falta para llegar, y qué acciones las generan. También explicita los supuestos: las cosas que tienen que ser ciertas para que el camino funcione.',
      ]),
      teoria('El modelo lógico', [
        'El modelo lógico ordena un proyecto en cinco eslabones: insumos (lo que se necesita: personas, dinero, materiales), actividades (lo que se hace), productos (lo que las actividades generan directamente, como talleres dictados o composteras entregadas), resultados (los cambios en las personas o el entorno, como hogares que compostan) e impacto (el cambio de largo plazo, como menos residuos en el relleno).',
      ]),
      ord('Ordená los eslabones de un modelo lógico.', [ // e1
        'Insumos',
        'Actividades',
        'Productos',
        'Resultados',
        'Impacto',
      ], 'Cada eslabón depende del anterior: sin actividades no hay productos, y sin resultados no hay impacto.', { d: 1 }),
      clas('En un proyecto de compostaje barrial, ¿qué es cada cosa?', { // e2
        'Producto': ['200 composteras entregadas', '10 talleres dictados'],
        'Resultado': ['150 hogares que compostan cada semana', 'Vecinos que separan sus restos de comida'],
        'Impacto': ['Menos residuos que llegan al relleno sanitario', 'Suelos de plazas más fértiles'],
      }, 'Los productos se cuentan fácil; los resultados y el impacto son los que importan.', { d: 2 }),
      numv(3, (i) => { // e3
        const [entregadas, pct] = [[200, 60], [300, 45], [150, 80]][i];
        return {
          enunciado: `Un proyecto entregó ${entregadas} composteras. Seis meses después, el ${pct} % de los hogares la usa todas las semanas. ¿Cuántos hogares compostan?`,
          valor: entregadas * pct / 100,
          unidad: 'hogares',
          explicacion: `${entregadas} × ${pct} % = ${entregadas * pct / 100} hogares. El producto fue ${entregadas} composteras; el resultado, ${entregadas * pct / 100} hogares compostando: medir solo el producto exageraría el logro.`,
          ctx: `${entregadas} composteras; ${pct} % las usa.`,
        };
      }, { d: 1 }),
      cad('Armá la cadena de una teoría de cambio para reducir residuos en un barrio.', [ // e4
        'Talleres y composteras para las familias',
        'Las familias aprenden a compostar',
        'Separan sus restos de comida cada semana',
        'Llega menos basura al relleno',
        'El barrio reduce su huella y mejora sus suelos',
      ], ['Entregar composteras garantiza que se usen'], 'Cada flecha de la cadena es un supuesto que conviene revisar.', { d: 2 }),
      op('En la teoría de cambio de un proyecto de compostaje, ¿cuál es un supuesto importante?', [ // e5
        'Que las familias tengan lugar y tiempo para compostar',
        'Que el proyecto tenga un logo atractivo',
        ['Que llueva todos los días', 'No es necesario para compostar; el supuesto clave es el uso.'],
        'Que nadie en el barrio conozca el compostaje',
      ], 'Si un supuesto falla, el proyecto necesita ajustar su camino.', { d: 2 }),
      vf('Si un proyecto entregó todos los materiales previstos, ya logró su objetivo.', false, 'Entregar materiales es un producto. El objetivo está en los resultados: que se usen y generen un cambio real.', {
        razones: ['+Porque entregar es un producto; el objetivo está en los resultados', '-Porque los materiales no sirven para nada', '-Porque los proyectos no tienen objetivos'],
        d: 1,
      }),
      par('Uní cada eslabón con un ejemplo de un proyecto de arbolado.', [ // e6
        ['Insumos', 'Plantines, herramientas y voluntarios'],
        ['Actividades', 'Jornadas de plantación y riego'],
        ['Productos', '300 árboles plantados'],
        ['Resultados', '240 árboles vivos al año'],
        ['Impacto', 'Calles más frescas y con más sombra'],
      ], 'El mismo esquema sirve para cualquier proyecto colectivo.', { d: 2 }),
      mult('¿Qué hace buena a una teoría de cambio? Marcá todo.', [ // e7
        '+Define con claridad el cambio de largo plazo',
        '+Explicita los supuestos',
        '+Conecta actividades con resultados',
        '+Se revisa con lo que se aprende',
        '-Promete resolver todos los problemas del barrio a la vez',
      ], 'Una teoría de cambio es una hipótesis de trabajo, no una promesa.', { d: 1 }),
      det('Leé este plan de un grupo vecinal y marcá lo que conviene revisar.', [ // e8
        ['Queremos que para dentro de tres años el arroyo tenga menos basura.', false],
        ['Nuestro éxito será repartir 1.000 volantes, sin importar lo que cambie.', true, 'Los volantes son un producto; hay que medir el resultado en el arroyo.'],
        ['Suponemos que los comercios aceptarán sumar contenedores.', false],
        ['No hace falta revisar el plan: lo que pensamos al principio siempre funciona.', true, 'La teoría de cambio se revisa con lo que se aprende.'],
      ], 'Planificar bien es saber qué se quiere cambiar y cómo se va a notar.', { d: 2 }),
      comp('Completá.', 'Lo que las actividades generan directamente son los [productos]; los cambios en las personas o el entorno son los [resultados]; y las condiciones que tienen que ser ciertas para que el plan funcione son los [supuestos].', ['gastos', 'deseos', 'feriados'], 'Tres conceptos para diseñar proyectos que cambian algo de verdad.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Organizar el equipo', 'Roles, reuniones que sirven y formas de decidir: consenso, consentimiento y votación.', [
      teoria('Roles y reuniones', [
        'Un grupo funciona mejor cuando los roles son claros: coordinación, comunicación, finanzas, logística. No son cargos para siempre: pueden rotar. Las reuniones también se diseñan: tienen un objetivo, un orden del día, tiempos, alguien que facilita para que todos puedan hablar, y terminan con compromisos concretos, con responsables y fechas, anotados en un acta.',
      ]),
      mult('¿Qué hace que una reunión de un grupo sea útil? Marcá todo.', [ // e1
        '+Un orden del día conocido de antemano',
        '+Alguien que facilita y cuida los tiempos',
        '+Compromisos con responsable y fecha',
        '+Un acta breve que se comparte',
        '-Que siempre hablen las mismas dos personas',
      ], 'Una buena reunión termina con decisiones y tareas claras, no solo con charla.', { d: 1 }),
      numv(3, (i) => { // e2
        const [pers, min, reun] = [[12, 90, 4], [8, 120, 2], [20, 60, 4]][i];
        return {
          enunciado: `Un grupo de ${pers} personas hace ${reun} reuniones por mes de ${min} minutos cada una. ¿Cuántas horas-persona dedica por mes a reunirse?`,
          valor: pers * min * reun / 60,
          unidad: 'horas-persona',
          explicacion: `${pers} × ${min} × ${reun} ÷ 60 = ${pers * min * reun / 60} horas-persona. El tiempo del grupo es un recurso valioso: reuniones bien preparadas lo cuidan.`,
          ctx: `${pers} personas; ${reun} reuniones de ${min} minutos.`,
        };
      }, { d: 1 }),
      teoria('Formas de decidir', [
        'Un grupo puede decidir de distintas maneras. Por votación, gana la opción con más votos: es rápido, pero puede dejar a una minoría muy disconforme. Por consenso, se busca que todas las personas estén de acuerdo: da mucha legitimidad, pero puede trabarse. Por consentimiento, se avanza si nadie tiene una objeción fundamentada, es decir, una razón para pensar que la propuesta dañaría al grupo o a su objetivo: no hace falta que a todos les encante, alcanza con que sea aceptable y segura para probar.',
      ]),
      par('Uní cada forma de decidir con su regla.', [ // e3
        ['Votación', 'Gana la opción con más votos'],
        ['Consenso', 'Todas las personas están de acuerdo'],
        ['Consentimiento', 'Nadie tiene una objeción fundamentada'],
      ], 'Cada método sirve para situaciones distintas; conviene acordarlo antes de decidir.', { d: 2 }),
      clas('¿Qué forma de decidir conviene más para cada situación?', { // e4
        'Votación': ['Elegir entre tres fechas para una jornada', 'Elegir el nombre del grupo entre varias propuestas'],
        'Consentimiento': ['Probar por tres meses un nuevo horario de reuniones', 'Aprobar un protocolo que se revisará en seis meses'],
        'Consenso': ['Definir los valores y el propósito del grupo', 'Decidir si el grupo se suma a una alianza política'],
      }, 'Las decisiones de fondo merecen más acuerdo; las operativas, más agilidad.', { d: 3 }),
      op('¿Qué es una objeción fundamentada en una decisión por consentimiento?', [ // e5
        'Una razón para creer que la propuesta dañaría al grupo',
        'Cualquier preferencia personal por otra opción',
        ['Un voto en contra sin explicar el motivo', 'Tiene que explicar por qué la propuesta causaría un daño.'],
        'Una queja sobre quién presentó la propuesta',
      ], 'El consentimiento distingue "no es mi favorita" de "esto es un riesgo real".', { d: 3 }),
      cad('Armá la cadena de cómo la falta de roles claros desgasta a un grupo.', [ // e6
        'Nadie sabe bien quién hace cada tarea',
        'Algunas tareas quedan sin hacer y otras se duplican',
        'Las mismas pocas personas terminan haciendo casi todo',
        'Esas personas se cansan y aparecen roces',
        'El grupo pierde energía y participantes',
      ], ['Sin roles claros, todos colaboran por igual siempre'], 'Repartir y rotar roles protege al grupo y a las personas.', { d: 2 }),
      vf('En un grupo, que decida siempre la persona que más sabe es la forma más legítima.', false, 'Saber mucho ayuda a proponer, pero las decisiones colectivas ganan legitimidad cuando participan quienes las van a llevar adelante.', {
        razones: ['+Porque la legitimidad viene de la participación de quienes ejecutan', '-Porque saber mucho impide decidir', '-Porque los grupos no pueden tomar decisiones'],
        d: 2,
      }),
      ord('Ordená una reunión bien facilitada.', [ // e7
        'Repasar el objetivo y el orden del día',
        'Revisar los compromisos de la reunión anterior',
        'Tratar cada tema con tiempos acordados',
        'Tomar decisiones con el método acordado',
        'Anotar compromisos con responsable y fecha',
      ], 'Una estructura simple hace que las reuniones rindan y no se estiren sin sentido.', { d: 2 }),
      det('Leé esta acta de reunión y marcá lo que conviene revisar.', [ // e8
        ['Acordamos la jornada de plantación para el sábado 12.', false],
        ['Alguien se va a ocupar de conseguir los plantines.', true, 'Falta nombrar un responsable y una fecha.'],
        ['Decidimos por consentimiento probar el nuevo horario por tres meses.', false],
        ['Como siempre, habló solo la coordinadora y el resto escuchó.', true, 'Una buena facilitación asegura que todas las voces participen.'],
      ], 'Un acta clara convierte una charla en un plan.', { d: 2 }),
      comp('Completá.', 'Decidir cuando todas las personas están de acuerdo es el [consenso]; avanzar si nadie tiene una objeción fundamentada es el [consentimiento]; y el documento con lo decidido y los compromisos es el [acta].', ['sorteo', 'silencio', 'volante'], 'Tres herramientas para que un grupo decida bien.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Recursos y riesgos', 'Presupuesto, fuentes de fondos, rendición de cuentas y cómo anticipar lo que puede salir mal.', [
      teoria('Un presupuesto claro', [
        'El presupuesto traduce el plan en números: cuánto cuesta cada actividad y de dónde sale el dinero. Conviene separar gastos fijos (que existen igual, como un seguro) y variables (que dependen de cuánto se hace, como plantines), y sumar un margen para imprevistos. Las fuentes pueden ser cuotas de los integrantes, donaciones, subsidios, campañas de financiamiento colectivo o ventas. Rendir cuentas, es decir, mostrar en qué se gastó cada peso, construye confianza.',
      ]),
      numv(3, (i) => { // e1
        const [costo, pct] = [[400000, 10], [250000, 15], [800000, 10]][i];
        return {
          enunciado: `Las actividades de un proyecto cuestan ${costo.toLocaleString('es-AR')} pesos. Si se suma un ${pct} % para imprevistos, ¿cuál es el presupuesto total?`,
          valor: costo * (100 + pct) / 100,
          unidad: 'pesos',
          explicacion: `${costo.toLocaleString('es-AR')} × ${(100 + pct) / 100 === 1.1 ? '1,1' : ((100 + pct) / 100).toLocaleString('es-AR')} = ${(costo * (100 + pct) / 100).toLocaleString('es-AR')} pesos. El margen evita frenar el proyecto por el primer gasto no previsto.`,
          ctx: `${costo} pesos; ${pct} % de imprevistos.`,
        };
      }, { d: 1 }),
      clas('¿Es un gasto fijo o variable del proyecto?', { // e2
        'Fijo': ['El seguro de las jornadas', 'El alquiler mensual del depósito'],
        'Variable': ['Los plantines, según cuántos árboles se planten', 'La impresión de materiales, según cuántos talleres se hagan'],
      }, 'Separar fijos y variables ayuda a saber qué pasa si el proyecto crece o se achica.', { d: 1 }),
      numv(3, (i) => { // e3
        const [total, part] = [[500000, 250], [300000, 120], [900000, 600]][i];
        return {
          enunciado: `Un proyecto cuesta ${total.toLocaleString('es-AR')} pesos y llega a ${part} participantes. ¿Cuánto cuesta por participante?`,
          valor: total / part,
          unidad: 'pesos por participante',
          explicacion: `${total.toLocaleString('es-AR')} ÷ ${part} = ${(total / part).toLocaleString('es-AR')} pesos. Este indicador ayuda a comparar opciones y a explicar el uso de los fondos.`,
          ctx: `${total} pesos; ${part} participantes.`,
        };
      }, { d: 1 }),
      par('Uní cada fuente de fondos con un ejemplo.', [ // e4
        ['Cuotas', 'Aporte mensual de cada integrante'],
        ['Subsidio', 'Fondos de un programa municipal para proyectos barriales'],
        ['Financiamiento colectivo', 'Una campaña en línea con muchos aportes pequeños'],
        ['Venta', 'Plantines de la huerta vendidos en la feria'],
      ], 'Combinar fuentes hace a un proyecto menos dependiente de una sola.', { d: 1 }),
      teoria('Anticipar riesgos', [
        'Un riesgo es algo que podría salir mal. Para ordenarlos se usa una matriz: se estima la probabilidad de que ocurra y el impacto si ocurre, y se multiplica para priorizar. Para los riesgos más altos se define una respuesta de antemano: evitarlos, reducir su probabilidad o su impacto, o preparar un plan alternativo. Por ejemplo, para una jornada al aire libre, tener una fecha alternativa por lluvia.',
      ]),
      numv(3, (i) => { // e5
        const [p, imp] = [[3, 4], [2, 5], [4, 2]][i];
        return {
          enunciado: `En una matriz de riesgos, la probabilidad se puntúa de 1 a 5 y el impacto también. Si un riesgo tiene probabilidad ${p} e impacto ${imp}, ¿cuál es su puntaje?`,
          valor: p * imp,
          unidad: 'puntos',
          explicacion: `${p} × ${imp} = ${p * imp} puntos. Los riesgos con puntaje más alto se atienden primero.`,
          ctx: `Probabilidad ${p}; impacto ${imp}.`,
        };
      }, { d: 1 }),
      rank('Ordená estos riesgos de una jornada de plantación por su puntaje (probabilidad × impacto), de mayor a menor.', [ // e6
        ['Lluvia fuerte ese día: probabilidad 3, impacto 4', '12'],
        ['Faltan plantines: probabilidad 2, impacto 5', '10'],
        ['Llegan menos voluntarios: probabilidad 4, impacto 2', '8'],
        ['Se pierde una pala: probabilidad 2, impacto 1', '2'],
      ], 'Priorizar permite concentrar la preparación donde más importa.', { d: 2, extremos: ['Mayor puntaje', 'Menor puntaje'] }),
      cad('Armá la cadena de cómo la rendición de cuentas fortalece un proyecto.', [ // e7
        'El grupo publica en qué gastó cada peso',
        'Integrantes y aportantes pueden verificarlo',
        'Crece la confianza en el proyecto',
        'Más personas se animan a aportar',
        'El proyecto se sostiene mejor en el tiempo',
      ], ['Ocultar los gastos aumenta la confianza'], 'La transparencia es tan importante en un grupo vecinal como en el Estado.', { d: 2 }),
      vf('Depender de un único subsidio es la forma más segura de financiar un proyecto.', false, 'Si ese subsidio se demora o no se renueva, el proyecto puede frenarse. Combinar fuentes lo hace más resistente.', {
        razones: ['+Porque si ese subsidio falla, el proyecto se frena', '-Porque los subsidios nunca se pagan', '-Porque los proyectos no necesitan dinero'],
        d: 1,
      }),
      det('Leé este presupuesto de un grupo y marcá lo que conviene revisar.', [ // e8
        ['Detallamos el costo de cada actividad.', false],
        ['No dejamos margen para imprevistos: todo va a salir como está previsto.', true, 'Conviene sumar un margen para gastos no previstos.'],
        ['Combinamos cuotas, una campaña de aportes y un subsidio.', false],
        ['No hace falta mostrar en qué se gasta: confíen en nosotros.', true, 'Rendir cuentas construye confianza y sostiene los aportes.'],
      ], 'Un presupuesto claro y transparente es la columna vertebral de un proyecto.', { d: 2 }),
      comp('Completá.', 'Mostrar en qué se gastó cada peso es [rendir] cuentas; un riesgo se prioriza multiplicando probabilidad por [impacto]; y el dinero que se reserva para lo no previsto es el margen para [imprevistos].', ['esconder', 'color', 'regalos'], 'Tres ideas para manejar recursos con responsabilidad.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Sostener en el tiempo', 'Voluntariado que no se quema, nuevos integrantes y los principios de Ostrom para cuidar lo común.', [
      teoria('Que el grupo no se queme', [
        'Muchos proyectos colectivos no terminan por falta de ideas, sino por cansancio. Ayuda repartir las tareas, rotar roles, cuidar que nadie cargue con todo, recibir bien a quienes se suman, reconocer lo que cada persona aporta y celebrar los logros, aunque sean pequeños. También conviene que el grupo tenga momentos para evaluar cómo se siente, no solo cuánto hizo.',
      ]),
      mult('¿Qué ayuda a que un grupo de voluntarios se sostenga? Marcá todo.', [ // e1
        '+Repartir y rotar las tareas',
        '+Recibir y acompañar a quienes se suman',
        '+Celebrar los logros',
        '+Respetar los tiempos y límites de cada persona',
        '-Que siempre hagan todo las mismas personas',
      ], 'Un grupo que cuida a su gente llega más lejos que uno que la agota.', { d: 1 }),
      numv(3, (i) => { // e2
        const [inicio, quedan] = [[40, 28], [25, 10], [60, 45]][i];
        return {
          enunciado: `Un grupo empezó el año con ${inicio} voluntarios activos y lo terminó con ${quedan}. ¿Qué porcentaje de los voluntarios se mantuvo?`,
          valor: Math.round(quedan * 100 / inicio),
          unidad: '%',
          explicacion: `${quedan} ÷ ${inicio} × 100 = ${Math.round(quedan * 100 / inicio)} %. Medir cuántas personas se quedan ayuda a detectar a tiempo si el grupo se está desgastando.`,
          ctx: `${inicio} al inicio; ${quedan} al final del año.`,
        };
      }, { d: 1 }),
      teoria('Los principios de Ostrom', [
        'La politóloga Elinor Ostrom, que en 2009 fue la primera mujer en recibir el Premio Nobel de Economía, estudió comunidades de todo el mundo que manejaban bienes comunes, como pesquerías, bosques o sistemas de riego, durante siglos sin agotarlos. Encontró que las que funcionaban compartían ciertos principios: límites claros sobre quién participa y qué se maneja; reglas adaptadas al lugar; que quienes siguen las reglas puedan participar en cambiarlas; monitoreo; sanciones graduales, empezando por advertencias; formas accesibles de resolver conflictos; reconocimiento de su derecho a organizarse; y, en sistemas grandes, niveles organizados unos dentro de otros.',
      ]),
      par('Uní cada principio de Ostrom con un ejemplo en una huerta comunitaria.', [ // e3
        ['Límites claros', 'Se sabe quiénes tienen parcela y qué espacio es común'],
        ['Participación en las reglas', 'Las reglas de riego se deciden en asamblea'],
        ['Monitoreo', 'Un turno rotativo revisa el estado de la huerta'],
        ['Sanciones graduales', 'Primero una charla, después un aviso, recién después perder la parcela'],
        ['Resolución de conflictos', 'Una instancia simple para mediar desacuerdos'],
      ], 'Los principios de Ostrom sirven para cualquier recurso compartido, de una huerta a una herramienta.', { d: 2 }),
      cad('Armá la cadena de por qué las sanciones graduales funcionan mejor.', [ // e4
        'Alguien no cumple una regla por primera vez',
        'Recibe primero una advertencia amable',
        'Entiende el problema y tiene oportunidad de corregir',
        'La mayoría corrige sin conflicto',
        'La confianza en el grupo se mantiene',
      ], ['Expulsar a alguien a la primera falta fortalece la confianza'], 'Sanciones proporcionales mantienen la norma sin romper la comunidad.', { d: 2 }),
      op('Según Ostrom, ¿por qué conviene que quienes usan un bien común participen en crear sus reglas?', [ // e5
        'Porque las reglas se adaptan mejor y se respetan más',
        'Porque así no hacen falta reglas',
        ['Porque las autoridades externas nunca saben nada', 'Pueden aportar; lo clave es la participación local.'],
        'Porque las reglas hechas por otros son ilegales',
      ], 'Las reglas que la comunidad siente propias tienen más legitimidad y mejor ajuste al lugar.', { d: 2 }),
      vf('Según Ostrom, los bienes comunes siempre terminan agotados si no se privatizan o los controla el Estado.', false, 'Ostrom mostró que muchas comunidades manejan bienes comunes durante siglos con sus propias reglas, monitoreo y sanciones graduales.', {
        razones: ['+Porque mostró comunidades que los manejan bien durante siglos', '-Porque demostró que los bienes comunes no existen', '-Porque recomendó eliminar todas las reglas'],
        d: 2,
      }),
      est('¿En qué año recibió Elinor Ostrom el Premio Nobel de Economía?', 2009, { min: 1950, max: 2025, paso: 1, unidad: '' }, 'En 2009: fue la primera mujer en recibirlo, por su análisis del gobierno de los bienes comunes.', { d: 2 }),
      clas('¿Esta práctica sigue o contradice los principios de Ostrom?', { // e6
        'Los sigue': ['Reglas de uso decididas en asamblea', 'Un turno rotativo de control', 'Sanciones que empiezan con una advertencia'],
        'Los contradice': ['Reglas impuestas por una sola persona', 'Nadie controla si se cumplen', 'Expulsar a alguien a la primera falta'],
      }, 'Participación, monitoreo y proporcionalidad: la base de lo común bien cuidado.', { d: 2 }),
      det('Leé el reglamento de una biblioteca de herramientas y marcá lo que conviene revisar.', [ // e7
        ['Pueden pedir herramientas quienes estén inscriptos como socios.', false],
        ['Quien devuelva una herramienta tarde una vez quedará excluido para siempre.', true, 'Las sanciones graduales funcionan mejor: primero una advertencia.'],
        ['Las reglas se revisan cada año en asamblea.', false],
        ['Nadie lleva registro de los préstamos.', true, 'Sin monitoreo es difícil sostener un recurso compartido.'],
      ], 'Un buen reglamento es claro, participativo, controlado y proporcional.', { d: 2 }),
      comp('Completá.', 'Elinor Ostrom estudió cómo las comunidades manejan los bienes [comunes]; las sanciones que empiezan con una advertencia son [graduales]; y revisar si se cumplen las reglas es el [monitoreo].', ['privados', 'máximas', 'olvido'], 'Tres ideas para cuidar bien lo que se comparte.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Crecer y dejar huella', 'Alianzas, formas de escalar, comunicar con datos e historias, evaluar y cerrar bien.', [
      teoria('Formas de crecer', [
        'Un proyecto que funciona puede crecer de tres maneras: ampliarse (llegar a más personas en el mismo lugar), replicarse (que otros grupos lo copien en otros barrios, adaptándolo) o institucionalizarse (que se convierta en una política pública o en parte de una organización estable, como un programa municipal). Para crecer suelen hacer falta alianzas con escuelas, cooperativas, universidades o el Estado.',
      ]),
      clas('¿Qué forma de crecer describe cada caso?', { // e1
        'Ampliar': ['La huerta suma 30 familias más del mismo barrio', 'El taller pasa de una a tres escuelas de la zona'],
        'Replicar': ['Otro barrio copia el proyecto con su propio grupo', 'Una guía permite que otras ciudades lo adapten'],
        'Institucionalizar': ['El municipio convierte la huerta en un programa permanente', 'Una ordenanza incorpora el compostaje barrial'],
      }, 'No todo proyecto tiene que crecer igual: a veces replicar suma más que agrandarse.', { d: 2 }),
      teoria('Comunicar con datos e historias', [
        'Para sumar apoyos, un proyecto necesita contar lo que logra. Los datos muestran la escala (cuántas familias, cuántos kilos) y las historias muestran el sentido (qué le cambió a una persona concreta). Juntos convencen más que por separado. La comunicación también rinde cuentas: muestra lo que salió bien y lo que no.',
      ]),
      numv(3, (i) => { // e2
        const [fam, kg, sem] = [[150, 3, 52], [80, 4, 52], [200, 2.5, 52]][i];
        const t = Math.round(fam * kg * sem / 100) / 10;
        return {
          enunciado: `${fam} familias compostan unos ${kg.toLocaleString('es-AR')} kg de restos por semana cada una. ¿Cuántas toneladas por año dejan de ir al relleno? Redondeá a un decimal.`,
          valor: t,
          unidad: 'toneladas',
          dec: 1,
          tol: 0.1,
          explicacion: `${fam} × ${kg.toLocaleString('es-AR')} × ${sem} = ${(fam * kg * sem).toLocaleString('es-AR')} kg ≈ ${t.toLocaleString('es-AR')} toneladas por año. Un dato así, junto con la historia de una familia, comunica mucho.`,
          ctx: `${fam} familias; ${kg} kg por semana; ${sem} semanas.`,
        };
      }, { d: 2 }),
      op('¿Por qué conviene combinar datos e historias al comunicar un proyecto?', [ // e3
        'Los datos muestran la escala y las historias, el sentido',
        'Porque los datos solos siempre aburren',
        ['Porque las historias pueden inventarse si emocionan', 'Tienen que ser verdaderas: inventar destruye la confianza.'],
        'Porque así no hace falta medir nada',
      ], 'Números y personas juntos convencen y rinden cuentas a la vez.', { d: 1 }),
      teoria('Evaluar, aprender y cerrar', [
        'Evaluar no es solo contar logros: es preguntarse qué funcionó, qué no y por qué, para ajustar. Un buen momento es al final de cada etapa. Y todo proyecto, en algún momento, termina o cambia: cerrar bien significa documentar lo aprendido, rendir cuentas, reconocer a quienes participaron y, si corresponde, traspasar el proyecto a otras personas u organizaciones para que siga.',
      ]),
      ord('Ordená los pasos para cerrar bien una etapa de un proyecto.', [ // e4
        'Reunir los datos de lo que se hizo y lo que cambió',
        'Conversar en grupo qué funcionó y qué no',
        'Documentar lo aprendido',
        'Rendir cuentas a participantes y aportantes',
        'Celebrar y decidir cómo sigue',
      ], 'Cerrar bien es tan importante como empezar bien.', { d: 2 }),
      cad('Armá la cadena de cómo una alianza con una escuela puede hacer crecer un proyecto.', [ // e5
        'El grupo de la huerta se alía con la escuela del barrio',
        'Estudiantes y docentes participan en la huerta',
        'Las familias de los estudiantes conocen el proyecto',
        'Se suman nuevos voluntarios y recursos',
        'El proyecto se amplía y gana estabilidad',
      ], ['Aliarse con otros siempre debilita al proyecto'], 'Las alianzas multiplican las personas, los recursos y la legitimidad.', { d: 2 }),
      vf('Si un proyecto termina, significa que fracasó.', false, 'Un proyecto puede terminar porque cumplió su objetivo, porque se institucionalizó o porque se transformó. Lo importante es cerrar bien y dejar el aprendizaje disponible.', {
        razones: ['+Porque puede terminar por haber cumplido o por transformarse', '-Porque los proyectos exitosos nunca terminan', '-Porque terminar un proyecto está prohibido'],
        d: 1,
      }),
      par('Uní cada posible aliado con lo que puede aportar a un proyecto ambiental barrial.', [ // e6
        ['Escuela', 'Estudiantes, docentes y vínculo con las familias'],
        ['Universidad', 'Asesoramiento técnico y datos'],
        ['Cooperativa', 'Trabajo organizado y experiencia en la economía social'],
        ['Municipio', 'Espacios, permisos y continuidad como política'],
      ], 'Cada aliado suma algo distinto: el mapa de aliados es parte del plan.', { d: 1 }),
      mult('¿Qué conviene documentar al cerrar una etapa? Marcá todo.', [ // e7
        '+Los resultados medidos',
        '+Lo que no funcionó y por qué',
        '+Los contactos y aliados',
        '+Cómo se usaron los fondos',
        '-Solo las fotos donde todo salió bien',
      ], 'Lo que se documenta con honestidad sirve a los próximos, y a otros grupos.', { d: 1 }),
      det('Leé este informe final de un proyecto y marcá lo que conviene revisar.', [ // e8
        ['Compostaron 150 familias y dejaron de ir al relleno unas 23 toneladas.', false],
        ['No contamos lo que no funcionó para que el informe quede mejor.', true, 'Lo que no funcionó es parte del aprendizaje y de la rendición de cuentas.'],
        ['Agradecemos a la escuela y a la cooperativa que se sumaron.', false],
        ['El proyecto terminó, así que nadie necesita saber cómo se usó el dinero.', true, 'La rendición de cuentas es necesaria también al cerrar.'],
      ], 'Un buen cierre deja confianza y aprendizaje para lo que viene.', { d: 2 }),
      comp('Completá.', 'Que otros grupos copien un proyecto en otros lugares es [replicarlo]; que se convierta en una política pública es [institucionalizarlo]; y dejar por escrito lo aprendido es [documentar].', ['venderlo', 'olvidarlo', 'improvisar'], 'Tres ideas para que un proyecto deje huella.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: liderar un proyecto colectivo', 'Teoría de cambio, organización, recursos, sostenibilidad del grupo y crecimiento, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: la red de huertas de Barrio Sur', 'Tres huertas vecinales de Barrio Sur quieren unirse en una red, conseguir fondos y sostenerse en el tiempo. Ayudalas a armar el proyecto.', [
      teoria('La situación', [
        'Las tres huertas suman 60 familias. Quieren llegar a 120 en dos años, compartir herramientas y semillas, y vender excedentes en una feria. El presupuesto de actividades para el primer año es de 1.200.000 pesos. Hoy dependen de un único subsidio municipal. En una de las huertas hubo conflictos porque algunas personas no cumplen los turnos de riego, y la coordinadora hace casi todo sola y está agotada.',
      ]),
      num('Si suman un 10 % para imprevistos, ¿cuál es el presupuesto total del primer año?', 1320000, 'pesos', '1.200.000 × 1,1 = 1.320.000 pesos: el margen protege al proyecto de los gastos no previstos.', { ctx: '1.200.000 pesos; 10 % de imprevistos.', d: 1 }),
      num('¿En qué porcentaje quieren aumentar la cantidad de familias?', 100, '%', '(120 − 60) ÷ 60 × 100 = 100 %: duplicar la red en dos años, una meta ambiciosa que conviene dividir en etapas.', { ctx: 'De 60 a 120 familias.', d: 1 }),
      op('¿Qué conviene hacer con el conflicto por los turnos de riego?', [ // e3
        'Acordar reglas y sanciones graduales en asamblea',
        'Expulsar de inmediato a quienes no cumplen',
        ['Que la coordinadora riegue todo sola para evitar peleas', 'Agravaría su agotamiento y no resolvería el problema.'],
        'Ignorarlo y esperar que se resuelva solo',
      ], 'Los principios de Ostrom ofrecen un camino: reglas participativas, monitoreo y sanciones proporcionales.', { d: 2 }),
      clas('¿A qué parte del modelo lógico corresponde cada elemento de la red?', { // e4
        'Producto': ['Tres ferias realizadas en el año', 'Un banco de semillas armado'],
        'Resultado': ['120 familias cultivando regularmente', 'Familias que consumen más verduras frescas'],
        'Impacto': ['Un barrio con más alimentos frescos y lazos más fuertes', 'Menos residuos orgánicos en el relleno'],
      }, 'Pensar en resultados e impacto ayuda a no quedarse solo en contar ferias.', { d: 2 }),
      mult('¿Qué medidas ayudan a que la red se sostenga? Marcá todas.', [ // e5
        '+Rotar la coordinación y repartir tareas',
        '+Combinar el subsidio con cuotas y ventas en la feria',
        '+Rendir cuentas de los fondos a todas las familias',
        '+Aliarse con la escuela y la cooperativa del barrio',
        '-Que la coordinadora siga haciendo todo sola',
      ], 'Personas cuidadas, fondos diversos, transparencia y aliados: la base de un proyecto que dura.', { d: 2 }),
      ord('Ordená el plan de la red para el primer año.', [ // e6
        'Definir juntas la teoría de cambio y las metas',
        'Repartir roles y acordar cómo se decide',
        'Armar el presupuesto con varias fuentes de fondos',
        'Poner en marcha las actividades y el monitoreo',
        'Evaluar al final del año y ajustar',
      ], 'El mismo ciclo de siempre, aplicado a un grupo real.', { d: 3 }),
      det('La red redacta su plan. Marcá lo que conviene corregir.', [ // e7
        ['Las reglas de riego se decidirán en asamblea y se revisarán cada año.', false],
        ['Seguiremos dependiendo solo del subsidio municipal.', true, 'Conviene combinar fuentes para no quedar a merced de una sola.'],
        ['Mediremos cuántas familias cultivan regularmente, no solo cuántas ferias hacemos.', false],
        ['La coordinadora seguirá a cargo de todas las tareas.', true, 'Hay que repartir y rotar roles para evitar el desgaste.'],
      ], 'Un buen plan cuida los resultados, los recursos y a las personas.', { d: 3 }),
    ]),
  ],
});
