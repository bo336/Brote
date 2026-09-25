import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// MOVILIDAD 5 — Ciudades para las personas.
// Accesibilidad antes que velocidad, la demanda inducida, el precio de usar la
// calle (estacionamiento, cobro por congestión), el rediseño de calles y la
// movilidad justa. Retoma el espacio que ocupa cada modo (movilidad-1), las
// ciudades caminables (movilidad-2), las redes de transporte (movilidad-3) y
// evitar-cambiar-mejorar (movilidad-4).

export default unidad({
  slug: 'movilidad-5',
  rama: 'movilidad',
  orden: 5,
  nivel: 3,
  requiereTronco: 3,
  titulo: 'Ciudades para las personas',
  bajada: 'Por qué más carriles traen más autos, cuánto cuesta estacionar "gratis", qué lograron Estocolmo y Nueva York cobrando por entrar y cómo se rediseña una calle para vivirla.',
  objetivos: [
    'Explicar la accesibilidad y el papel de la densidad y la mezcla de usos',
    'Analizar la demanda inducida y la evaporación del tránsito',
    'Evaluar políticas de precio: estacionamiento y cobro por congestión',
    'Proponer rediseños de calles con evidencia de salud y seguridad',
    'Reconocer desigualdades de movilidad por ingreso, género, edad y discapacidad',
  ],
  repasa: ['movilidad-1', 'movilidad-2', 'movilidad-3', 'movilidad-4'],
  fuentes: ['itdp-tod', 'human-transit', 'duranton-turner-2011', 'cheonggyecheon', 'shoup-estacionamiento', 'borjesson-2012-estocolmo', 'mta-congestion-2026', 'mueller-2020-supermanzanas', 'declaracion-estocolmo-2020', 'oms-seguridad-vial', 'caf-movilidad-genero'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Llegar, no solo moverse', 'Accesibilidad, densidad y mezcla de usos: la forma de la ciudad decide cuánto y cómo viajamos.', [
      teoria('Moverse para llegar', [
        'Casi nadie viaja por el gusto de viajar: nos movemos para llegar al trabajo, la escuela, el hospital o la casa de alguien. Por eso los especialistas hablan de accesibilidad: cuántas oportunidades se pueden alcanzar en un tiempo razonable. Se puede mejorar de dos maneras: haciendo más rápido el transporte, o acercando las cosas, con barrios que mezclen viviendas, comercios, escuelas y trabajo.',
      ]),
      op('¿Qué mide la accesibilidad de un barrio?', [ // e1
        'Cuántos destinos útiles se alcanzan en un tiempo razonable',
        'La velocidad máxima de los autos en sus avenidas',
        ['La cantidad de autos por familia del barrio', 'Tener más autos no significa llegar a más lugares.'],
        'La cantidad de semáforos por cada kilómetro',
      ], 'La pregunta clave no es qué tan rápido vamos, sino a cuántos lugares podemos llegar.', { d: 2 }),
      op('Un municipio quiere que los vecinos de un barrio lejano lleguen más fácil a la atención médica. ¿Qué opción mejora la accesibilidad sin construir rutas?', [ // e2
        'Abrir un centro de salud dentro del barrio',
        'Subir la velocidad máxima de la avenida de acceso',
        ['Agregar estacionamiento en el hospital central', 'Ayuda solo a quien tiene auto, y no acerca la atención.'],
        'Pintar de nuevo la señalización de la ruta',
      ], 'Acercar los destinos es tan poderoso como acelerar los viajes, y suele ser más barato.', { d: 2 }),
      numv(3, (i) => { // e3
        const [antes, desp] = [[50000, 80000], [120000, 150000], [20000, 50000]][i];
        const pct = Math.round((desp - antes) / antes * 100);
        return {
          enunciado: `Desde un barrio se podía llegar a ${antes.toLocaleString('es-AR')} puestos de trabajo en 45 minutos de transporte público. Con una línea nueva se llega a ${desp.toLocaleString('es-AR')}. ¿En qué porcentaje aumentó su accesibilidad al empleo?`,
          valor: pct,
          unidad: '%',
          explicacion: `(${desp.toLocaleString('es-AR')} − ${antes.toLocaleString('es-AR')}) ÷ ${antes.toLocaleString('es-AR')} × 100 = ${pct} %. Medir así muestra el beneficio real de una obra: más oportunidades al alcance.`,
          ctx: `${antes} empleos antes; ${desp} después.`,
        };
      }, { d: 1 }),
      teoria('Densidad y mezcla', [
        'Una ciudad extendida, de baja densidad y con usos separados (barrios solo de casas, centros comerciales lejos, trabajo en otra punta) alarga los viajes y hace depender del auto: con poca gente por kilómetro, el transporte público no puede pasar seguido. Una ciudad compacta, con usos mezclados y más gente viviendo cerca de las estaciones, permite resolver muchos viajes caminando, en bici o en transporte público.',
        'El Instituto de Políticas para el Transporte y el Desarrollo (ITDP) resume esta idea en ocho principios para el desarrollo orientado al transporte: caminar, pedalear, conectar, usar transporte público, mezclar usos, densificar, compactar y cambiar la prioridad del auto.',
      ]),
      cad('Armá la cadena de cómo una ciudad extendida termina dependiendo del auto.', [ // e4
        'Se construyen barrios lejanos solo con viviendas',
        'Trabajo, escuelas y comercios quedan lejos',
        'Hay poca gente por kilómetro para sostener colectivos frecuentes',
        'Hace falta un auto para casi todo',
        'Crecen el tránsito, las emisiones y el gasto de las familias',
      ], ['La baja densidad permite colectivos más frecuentes'], 'La forma de la ciudad decide los viajes antes de que alguien elija cómo moverse.', { d: 2 }),
      numv(3, (i) => { // e5
        const dens = [5000, 15000, 30000][i];
        const pers = Math.round(dens * Math.PI * 0.25 / 100) * 100;
        return {
          enunciado: `Un barrio tiene ${dens.toLocaleString('es-AR')} habitantes por km². ¿Cuántas personas viven a menos de 500 m de su estación? (El área de un círculo de 500 m de radio es de unos 0,785 km².) Redondeá a la centena.`,
          valor: pers,
          unidad: 'personas',
          tol: 100,
          explicacion: `${dens.toLocaleString('es-AR')} × 0,785 ≈ ${pers.toLocaleString('es-AR')} personas. Con más gente a distancia caminable, la estación tiene más usuarios y se justifica más frecuencia.`,
          ctx: `${dens} habitantes por km²; círculo de 500 m.`,
        };
      }, { d: 2 }),
      par('Uní cada principio del desarrollo orientado al transporte con un ejemplo.', [ // e6
        ['Caminar', 'Veredas anchas, sombra y cruces seguros'],
        ['Pedalear', 'Red de ciclovías conectada'],
        ['Transporte público', 'Estación a pocas cuadras de casa'],
        ['Mezclar', 'Viviendas, comercios y escuelas en la misma zona'],
        ['Densificar', 'Más gente viviendo cerca de las estaciones'],
      ], 'Los principios se refuerzan entre sí: ninguno alcanza solo.', { d: 2 }),
      vf('Una ciudad más densa siempre es peor para vivir.', false, 'Depende del diseño: con plazas, árboles, servicios y buen transporte, la densidad permite vivir cerca de todo. Lo que empeora la vida es la densidad sin espacio público ni servicios.', {
        razones: ['+Porque con buen diseño y servicios la densidad acerca todo', '-Porque la densidad elimina siempre las plazas', '-Porque en las ciudades densas no hay transporte'],
        d: 2,
      }),
      mult('¿Qué rasgos tiene un barrio orientado al transporte público? Marcá todos.', [ // e7
        '+Estaciones a distancia caminable',
        '+Comercios y servicios en planta baja',
        '+Veredas y cruces seguros hacia la estación',
        '+Viviendas de distintos precios cerca del transporte',
        '-Grandes playas de estacionamiento junto a cada estación',
      ], 'Las playas de estacionamiento ocupan justo el suelo más valioso para vivir cerca del transporte.', { d: 2 }),
      det('Leé este plan urbano y marcá lo que conviene revisar.', [ // e8
        ['Permitiremos más viviendas cerca de las estaciones de tren.', false],
        ['El nuevo barrio tendrá solo casas; los comercios estarán en un centro comercial a 8 km.', true, 'Separar los usos alarga los viajes y obliga a usar el auto.'],
        ['Mediremos cuántos empleos se alcanzan en 45 minutos desde cada barrio.', false],
        ['El éxito se medirá solo por la velocidad promedio de los autos.', true, 'Importa la accesibilidad de todas las personas, no solo la velocidad de los autos.'],
      ], 'Planificar para la accesibilidad cambia qué se construye y qué se mide.', { d: 2 }),
      comp('Completá.', 'La cantidad de destinos que se alcanzan en un tiempo razonable es la [accesibilidad]; barrios con viviendas, comercios y escuelas juntos tienen usos [mezclados]; y más gente viviendo cerca de las estaciones es [densificar].', ['velocidad', 'separados', 'dispersar'], 'Tres ideas para pensar la ciudad antes que el vehículo.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Más carriles, más autos', 'La demanda inducida, por qué ensanchar no cura la congestión y qué pasa cuando se quita una autopista.', [
      teoria('La ley fundamental de la congestión', [
        'Un estudio publicado en 2011 con datos de ciudades de Estados Unidos encontró que los kilómetros recorridos en auto aumentan en proporción a los kilómetros de carriles de autopista: si se amplían un 10 %, se maneja cerca de un 10 % más. El tránsito nuevo viene de residentes que manejan más, de más transporte de carga y de gente que se muda. Los autores concluyeron que agregar rutas difícilmente alivie la congestión.',
      ]),
      numv(3, (i) => { // e1
        const [trafico, amp] = [[100000, 20], [80000, 25], [50000, 10]][i];
        return {
          enunciado: `Por una red de autopistas se recorren ${trafico.toLocaleString('es-AR')} km en auto por día. Si se amplían los carriles un ${amp} % y el tránsito crece en la misma proporción, ¿cuántos km por día se recorrerán?`,
          valor: trafico * (100 + amp) / 100,
          unidad: 'km por día',
          explicacion: `${trafico.toLocaleString('es-AR')} × ${((100 + amp) / 100).toLocaleString('es-AR')} = ${(trafico * (100 + amp) / 100).toLocaleString('es-AR')} km. Con más espacio llega más tránsito, y la congestión vuelve.`,
          ctx: `${trafico} km por día; ampliación del ${amp} %.`,
        };
      }, { d: 1 }),
      teoria('Por qué pasa', [
        'La congestión funciona como un precio que se paga en tiempo. Cuando una obra nueva baja ese precio, aparecen viajes que antes se evitaban: gente que cambia de ruta, de horario, de modo o de destino, y a la larga, de lugar donde vivir. A eso se lo llama demanda inducida. Al poco tiempo, la nueva vía se llena y el ahorro de tiempo se esfuma.',
      ]),
      cad('Armá la cadena de la demanda inducida.', [ // e2
        'Se ensancha una avenida congestionada',
        'Al principio se viaja más rápido',
        'Manejar se vuelve más atractivo',
        'Más personas eligen el auto, en más horarios',
        'La avenida vuelve a congestionarse',
      ], ['Menos gente elige manejar porque hay más carriles'], 'Ensanchar alivia unos meses; el tránsito nuevo llena el espacio.', { d: 2 }),
      numv(3, (i) => { // e3
        const [antes, obra, despues] = [[40, 30, 38], [50, 35, 47], [30, 24, 28]][i];
        const perdido = Math.round((despues - obra) / (antes - obra) * 100);
        return {
          enunciado: `Un viaje tardaba ${antes} minutos. Tras ensanchar la avenida pasó a ${obra}, pero dos años después, con más tránsito, tarda ${despues}. ¿Qué porcentaje del ahorro inicial se perdió?`,
          valor: perdido,
          unidad: '%',
          tol: 1,
          explicacion: `Ahorro inicial: ${antes - obra} min; se perdieron ${despues - obra} min. ${despues - obra} ÷ ${antes - obra} × 100 ≈ ${perdido} %. Valores de ejemplo de un patrón que se repite en muchas ciudades.`,
          ctx: `${antes} min antes; ${obra} tras la obra; ${despues} dos años después.`,
        };
      }, { d: 2 }),
      vf('Ensanchar una avenida congestionada resuelve el tránsito para siempre.', false, 'El alivio suele durar poco: la demanda inducida vuelve a llenar la avenida. Por eso se combinan otras medidas, como transporte público y gestión de la demanda.', {
        razones: ['+Porque la demanda inducida vuelve a llenar la vía', '-Porque las avenidas anchas no se pueden congestionar', '-Porque el tránsito nunca cambia'],
        d: 1,
      }),
      par('Uní cada reacción de los conductores ante una vía nueva con un ejemplo.', [ // e4
        ['Cambio de ruta', 'Dejar la avenida de siempre por la nueva autopista'],
        ['Cambio de horario', 'Salir en hora pico porque ahora parece más rápido'],
        ['Cambio de modo', 'Dejar el tren y volver al auto'],
        ['Cambio de lugar donde vivir', 'Mudarse más lejos porque "total, se llega rápido"'],
      ], 'Todas estas reacciones suman tránsito nuevo sobre la vía ampliada.', { d: 2 }),
      teoria('Quitar una autopista', [
        'El efecto también funciona al revés. En Seúl, entre 2003 y 2005, se demolió una autopista elevada de unos 5,8 km que tapaba el arroyo Cheonggyecheon, y en su lugar se recuperó el curso de agua con un parque lineal. Hubo más congestión en algunas calles paralelas, pero el efecto sobre el tránsito del conjunto de la ciudad fue mínimo: parte de los viajes se reorganizó y parte se "evaporó".',
      ]),
      op('¿Qué pasó con el tránsito de Seúl al quitar la autopista del Cheonggyecheon?', [ // e5
        'Cambió poco en conjunto: los viajes se reorganizaron',
        'La ciudad quedó paralizada durante años',
        ['Tuvieron que reconstruir la autopista al año', 'No se reconstruyó: hoy es un parque lineal.'],
        'Todo el tránsito pasó a una sola calle paralela',
      ], 'Si agregar vías induce tránsito, quitarlas puede hacer que parte desaparezca.', { d: 2 }),
      clas('¿Es tránsito inducido al ampliar una vía, o tránsito que se evapora al reducirla?', { // e6
        'Tránsito inducido': ['Gente que antes iba en tren y ahora maneja', 'Viajes en auto que antes no se hacían', 'Barrios lejanos que crecen gracias a la autopista'],
        'Tránsito que se evapora': ['Viajes que se combinan en uno solo', 'Gente que pasa al transporte público', 'Compras que se hacen cerca de casa'],
      }, 'La demanda de viajes en auto no es fija: responde al espacio y al tiempo disponibles.', { d: 2 }),
      mult('¿Qué alternativas a ensanchar pueden mejorar la movilidad de un corredor? Marcá todas.', [ // e7
        '+Un carril exclusivo para colectivos',
        '+Más frecuencia de trenes',
        '+Ciclovías protegidas',
        '+Cobrar por estacionar en la zona',
        '-Sumar dos carriles más para autos',
      ], 'Mover más personas en el mismo espacio es la forma de ganarle a la congestión.', { d: 1 }),
      ord('Ordená los pasos para evaluar en serio un proyecto vial.', [ // e8
        'Medir los viajes actuales en todos los modos',
        'Estimar el tránsito inducido que generaría la obra',
        'Comparar con alternativas de transporte público y gestión de la demanda',
        'Evaluar costos, emisiones y seguridad de cada opción',
        'Decidir y monitorear los resultados',
      ], 'Una evaluación que ignora la demanda inducida sobrestima los beneficios de ensanchar.', { d: 3 }),
      det('Leé este anuncio de una obra y marcá lo que conviene revisar.', [ // e9
        ['La avenida tiene congestión todos los días en hora pico.', false],
        ['Con dos carriles más, la congestión desaparecerá para siempre.', true, 'La demanda inducida suele volver a llenar la avenida.'],
        ['También agregaremos un carril exclusivo para colectivos.', false],
        ['No hace falta medir el tránsito después de la obra.', true, 'Sin medir, no se sabe si funcionó ni si llegó tránsito nuevo.'],
      ], 'Frente a la congestión, la pregunta es cómo mover más personas, no más autos.', { d: 2 }),
      comp('Completá.', 'El tránsito nuevo que aparece al ampliar una vía es la demanda [inducida]; al quitar capacidad, parte de los viajes se [evapora]; y en Seúl se demolió una autopista para recuperar un [arroyo].', ['reducida', 'duplica', 'estadio'], 'Tres ideas que cambian cómo se discute una obra vial.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('El precio de usar la calle', 'Estacionar "gratis", cocheras obligatorias, cobro por congestión en Estocolmo y Nueva York, y zonas de bajas emisiones.', [
      teoria('Estacionar gratis no es gratis', [
        'Cada lugar para estacionar ocupa suelo y cuesta construirlo. Cuando es gratis, ese costo se paga igual, escondido en el precio de las viviendas, de los comercios o de los impuestos, y lo pagan también quienes no tienen auto. El urbanista Donald Shoup mostró además que exigir un mínimo de cocheras en cada edificio encarece la vivienda y fomenta el uso del auto. Y que cobrar el estacionamiento en la calle a un precio que deje siempre algún lugar libre por cuadra reduce las vueltas buscando dónde estacionar.',
      ]),
      numv(3, (i) => { // e1
        const [m2, costo] = [[30, 1000], [30, 1500], [25, 800]][i];
        return {
          enunciado: `Una cochera en un edificio ocupa unos ${m2} m², contando rampas y circulación. Si construir cuesta ${costo.toLocaleString('es-AR')} dólares por m², ¿cuánto cuesta cada cochera?`,
          valor: m2 * costo,
          unidad: 'dólares',
          explicacion: `${m2} × ${costo.toLocaleString('es-AR')} = ${(m2 * costo).toLocaleString('es-AR')} dólares por cochera. Si es obligatoria, ese costo se suma al precio de cada departamento, tenga o no auto quien lo compre. Valores de ejemplo.`,
          ctx: `${m2} m² por cochera; ${costo} dólares por m².`,
        };
      }, { d: 1 }),
      cad('Armá la cadena de cómo las cocheras obligatorias fomentan el auto.', [ // e2
        'La norma exige una cochera por departamento',
        'Construir cada edificio cuesta más',
        'Los departamentos son más caros',
        'Quien no tiene auto igual paga su cochera',
        'Tener auto parece "incluido" y se usa más',
      ], ['Las cocheras obligatorias abaratan las viviendas'], 'Un requisito que parece técnico cambia el precio de la vivienda y los hábitos de viaje.', { d: 2 }),
      numv(3, (i) => { // e3
        const lugares = [20, 40, 60][i];
        return {
          enunciado: `Una política de estacionamiento medido busca que cada cuadra esté ocupada al 85 %. Si una cuadra tiene ${lugares} lugares, ¿cuántos deberían quedar libres?`,
          valor: lugares * 15 / 100,
          unidad: 'lugares',
          explicacion: `${lugares} × 15 % = ${lugares * 15 / 100} lugares libres. Si siempre hay alguno libre, nadie da vueltas buscando, y eso reduce el tránsito y las emisiones.`,
          ctx: `${lugares} lugares; ocupación objetivo del 85 %.`,
        };
      }, { d: 1 }),
      teoria('Cobrar por la congestión', [
        'Estocolmo probó cobrar por entrar y salir del centro entre enero y julio de 2006. El tránsito que cruzaba el cordón bajó entre un 20 y un 25 %. En un referéndum, los vecinos de la ciudad votaron por mantenerlo, y desde agosto de 2007 es permanente. Nueva York empezó a cobrar por entrar al sur de Manhattan en enero de 2025. Según la autoridad de transporte, en el primer año entraron 27 millones de vehículos menos, un 11 % menos, y se recaudaron más de 550 millones de dólares netos para el transporte público.',
      ], { destacado: { valor: '−11 %', texto: 'de vehículos entrando al sur de Manhattan en el primer año de cobro por congestión, según la autoridad de transporte de Nueva York.' } }),
      num('En Nueva York entraron 27 millones de vehículos menos, un 11 % menos que sin el cobro. ¿Cuántos millones de vehículos habrían entrado sin el cobro? Redondeá al entero.', 245, 'millones de vehículos', '27 ÷ 0,11 ≈ 245 millones. Si 27 millones son el 11 %, el total de referencia es unas nueve veces mayor.', { ctx: '27 millones menos; equivale al 11 %.', tol: 3, d: 3 }),
      op('En Estocolmo, muchos vecinos se oponían al cobro antes de probarlo, pero votaron por mantenerlo después de la prueba. ¿Qué explica mejor ese cambio?', [ // e4
        'Vieron en la práctica menos tránsito y viajes más rápidos',
        'Porque la prueba fue gratis para todos los conductores',
        ['Porque durante la prueba se prohibieron los autos', 'No se prohibieron: se cobró por cruzar el cordón.'],
        'Porque el referéndum era obligatorio para aprobarlo',
      ], 'Probar una medida y mostrar sus efectos puede cambiar la opinión pública más que cualquier discurso.', { d: 2 }),
      vf('Cobrar por entrar al centro solo sirve para recaudar.', false, 'Reduce el tránsito, acelera los colectivos y mejora el aire; además, la recaudación puede financiar transporte público, como en Nueva York.', {
        razones: ['+Porque reduce el tránsito y puede financiar el transporte público', '-Porque no cambia la cantidad de autos', '-Porque la recaudación es siempre nula'],
        d: 1,
      }),
      teoria('Zonas de bajas emisiones', [
        'Otra herramienta son las zonas de bajas emisiones: áreas donde los vehículos más contaminantes no pueden circular o pagan un cargo. Apuntan sobre todo a la calidad del aire. Funcionan mejor combinadas con alternativas de transporte y con ayudas para quienes tienen vehículos viejos y menos recursos, para que la medida no sea injusta.',
      ]),
      par('Uní cada política con su objetivo principal.', [ // e5
        ['Estacionamiento medido', 'Que siempre haya algún lugar libre por cuadra'],
        ['Cobro por congestión', 'Menos autos en las zonas y horas más cargadas'],
        ['Zona de bajas emisiones', 'Aire más limpio en áreas densas'],
        ['Eliminar las cocheras obligatorias', 'Viviendas más baratas y menos incentivo al auto'],
      ], 'Poner precio al uso de la calle ordena el tránsito sin construir nada.', { d: 2 }),
      clas('¿Es gestión de la demanda o aumento de la oferta vial?', { // e6
        'Gestión de la demanda': ['Cobro por congestión', 'Estacionamiento medido', 'Zona de bajas emisiones'],
        'Aumento de la oferta vial': ['Una autopista nueva', 'Dos carriles más en una avenida', 'Un distribuidor de tránsito'],
      }, 'La gestión de la demanda actúa sobre cuántos viajes en auto se hacen; la oferta, sobre cuánto espacio tienen.', { d: 1 }),
      mult('¿Qué hace más justo un cobro por congestión? Marcá todo.', [ // e7
        '+Invertir lo recaudado en transporte público',
        '+Exenciones para personas con discapacidad',
        '+Descuentos para hogares de bajos ingresos',
        '+Probarlo antes y consultar a la población',
        '-Usar la recaudación para ensanchar autopistas',
      ], 'La aceptación y la equidad dependen mucho de qué se hace con el dinero.', { d: 2 }),
      det('Leé esta columna de opinión y marcá lo que conviene revisar.', [ // e8
        ['Estocolmo cobra por entrar al centro desde 2007, tras una prueba en 2006.', false],
        ['El estacionamiento gratis no le cuesta nada a nadie.', true, 'Su costo se paga escondido en viviendas, comercios o impuestos.'],
        ['En Nueva York bajó el tránsito que entra a la zona con cobro.', false],
        ['Cobrar por congestión nunca cambia la cantidad de autos.', true, 'Estocolmo y Nueva York muestran bajas claras del tránsito.'],
      ], 'Los precios cambian conductas: ignorarlo lleva a políticas que no funcionan.', { d: 2 }),
      comp('Completá.', 'Cobrar el estacionamiento para que quede algún lugar libre busca una ocupación de alrededor del [85] %; Estocolmo cobra por la [congestión] desde 2007; y en Nueva York el tránsito que entra a la zona bajó un [11] %.', ['50', 'contaminación', '25'], 'Tres datos para discutir el precio de usar la calle.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Calles para estar', 'Supermanzanas, 30 km/h, Visión Cero y urbanismo táctico: cómo se rediseña una calle para vivirla.', [
      teoria('Cuánto espacio para quién', [
        'En muchas avenidas, la mayor parte del ancho entre fachadas está dedicada a autos que circulan o estacionan, aunque por la calle se muevan más personas a pie o en colectivo. Rediseñar una calle es, antes que nada, repartir de nuevo ese espacio.',
      ]),
      numv(3, (i) => { // e1
        const [calzada, veredas] = [[14, 6], [12, 8], [16, 4]][i];
        return {
          enunciado: `Una calle mide ${calzada + veredas} m entre fachadas: ${calzada} m de calzada para autos (circulación y estacionamiento) y ${veredas} m de veredas en total. ¿Qué porcentaje del ancho es para los autos?`,
          valor: Math.round(calzada / (calzada + veredas) * 100),
          unidad: '%',
          explicacion: `${calzada} ÷ ${calzada + veredas} × 100 = ${Math.round(calzada / (calzada + veredas) * 100)} %. Si por esa calle camina más gente de la que maneja, el reparto no refleja cómo se usa.`,
          ctx: `${calzada} m de calzada; ${veredas} m de veredas.`,
        };
      }, { d: 1 }),
      teoria('Supermanzanas', [
        'En Barcelona, una supermanzana agrupa varias manzanas: el tránsito de paso se desvía por el perímetro, y las calles interiores se vuelven lugares para caminar, jugar y tener verde, con acceso lento para vecinos, emergencias y cargas. Un estudio de 2020 estimó que implementar 503 supermanzanas en la ciudad podría evitar unas 667 muertes prematuras por año, sobre todo por menos dióxido de nitrógeno, menos ruido, menos calor y más verde.',
      ]),
      op('¿Cómo funciona una supermanzana?', [ // e2
        'Desvía el tránsito de paso al perímetro y libera el interior',
        'Prohíbe todos los vehículos, incluidas las ambulancias',
        ['Construye una autopista alrededor de cada barrio', 'Usa las avenidas existentes; no construye autopistas.'],
        'Junta varias manzanas en un solo edificio muy alto',
      ], 'No se trata de prohibir el acceso, sino de sacar el tránsito que solo pasa.', { d: 2 }),
      num('De las 667 muertes evitables estimadas para las supermanzanas de Barcelona, 291 se deben a la reducción del dióxido de nitrógeno. ¿Qué porcentaje es? Redondeá al entero.', 44, '%', '291 ÷ 667 × 100 ≈ 44 %. El resto se reparte entre menos ruido, menos calor y más espacios verdes.', { ctx: '291 de 667 muertes evitables.', tol: 1, d: 2 }),
      teoria('Velocidad, diseño y Visión Cero', [
        'La Declaración de Estocolmo de 2020, adoptada en la Conferencia Ministerial Mundial sobre Seguridad Vial, pide un límite máximo de 30 km/h donde peatones, ciclistas y vehículos se mezclan de forma frecuente. Los límites funcionan mejor cuando la calle misma invita a ir despacio: carriles angostos, cruces elevados, árboles, esquinas con veredas ampliadas.',
        'El enfoque Visión Cero, adoptado por Suecia en 1997, parte de que las personas se equivocan, y de que el sistema vial debe diseñarse para que esos errores no terminen en muertes ni heridas graves.',
      ]),
      cad('Armá la cadena de cómo el diseño de una calle mejora la seguridad.', [ // e3
        'Se angostan los carriles y se elevan los cruces',
        'Los conductores bajan la velocidad sin necesidad de un cartel',
        'Tienen más tiempo para ver y frenar',
        'Los choques son menos frecuentes y menos graves',
        'Hay menos muertes y heridos en esa calle',
      ], ['Carriles más anchos hacen manejar más despacio'], 'Una calle bien diseñada hace que la velocidad segura sea la natural.', { d: 2 }),
      vf('El enfoque Visión Cero parte de que las personas nunca se equivocan al manejar o al cruzar.', false, 'Es al revés: acepta que las personas se equivocan y propone diseñar calles, vehículos y velocidades para que esos errores no maten.', {
        razones: ['+Porque acepta los errores humanos y diseña para que no maten', '-Porque culpa solo a los peatones de los choques', '-Porque propone subir las velocidades máximas'],
        d: 2,
      }),
      clas('¿La medida baja la velocidad por diseño o depende solo de un cartel?', { // e4
        'Por diseño': ['Cruces peatonales elevados', 'Carriles más angostos', 'Esquinas con veredas ampliadas'],
        'Solo un cartel': ['Un cartel de "máxima 30" en una avenida ancha y recta', 'Un cartel de "zona escolar" sin otros cambios'],
      }, 'Los carteles ayudan, pero la forma de la calle es lo que más cambia la velocidad real.', { d: 2 }),
      teoria('Probar antes de construir', [
        'El urbanismo táctico prueba cambios con materiales baratos y rápidos: pintura, macetas, bolardos, bancos. Se mide qué pasa con la velocidad, el uso y la opinión de los vecinos, se ajusta y, si funciona, se construye la versión permanente. Las calles escolares, que se cierran al tránsito en los horarios de entrada y salida, suelen empezar así.',
      ]),
      ord('Ordená los pasos de una intervención de urbanismo táctico.', [ // e5
        'Detectar el problema con vecinos y datos',
        'Probar el cambio con pintura y macetas',
        'Medir velocidad, uso y opiniones',
        'Ajustar el diseño',
        'Construir la versión permanente',
      ], 'Probar barato y medir permite corregir antes de invertir mucho.', { d: 2 }),
      par('Uní cada intervención con su beneficio principal.', [ // e6
        ['Árboles en la vereda', 'Sombra y menos calor'],
        ['Cruce elevado', 'Autos que frenan ante los peatones'],
        ['Calle escolar', 'Entrada a la escuela sin autos'],
        ['Supermanzana', 'Interior del barrio sin tránsito de paso'],
      ], 'Cada intervención resuelve algo concreto, y juntas cambian el carácter de un barrio.', { d: 1 }),
      mult('¿Qué hace que una calle invite a quedarse? Marcá todo.', [ // e7
        '+Sombra de árboles',
        '+Lugares para sentarse',
        '+Tránsito lento y poco ruido',
        '+Comercios y actividad en planta baja',
        '-Autos estacionados en toda la vereda',
      ], 'Las calles también son el espacio público más grande de una ciudad.', { d: 1 }),
      det('Leé esta propuesta vecinal y marcá lo que conviene revisar.', [ // e8
        ['Probaremos una calle escolar con vallas en los horarios de entrada y salida.', false],
        ['Para bajar la velocidad alcanza con un cartel de 30 en la avenida de cuatro carriles.', true, 'Sin cambios de diseño, la velocidad real casi no baja.'],
        ['Mediremos la velocidad antes y después de la prueba.', false],
        ['La supermanzana prohibirá la entrada de ambulancias.', true, 'Emergencias, vecinos y cargas siguen entrando, a baja velocidad.'],
      ], 'Un buen rediseño combina diseño físico, medición y participación.', { d: 2 }),
      comp('Completá.', 'Agrupar manzanas y sacar el tránsito de paso crea una [supermanzana]; la Declaración de Estocolmo pide un máximo de [30] km/h donde se mezclan peatones y vehículos; y probar cambios con pintura y macetas es urbanismo [táctico].', ['autopista', '60', 'rígido'], 'Tres herramientas para calles más seguras y habitables.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Movilidad justa', 'Quién se mueve cómo: ingresos, género, edad y discapacidad, y cómo planificar con todas las personas.', [
      teoria('No todos se mueven igual', [
        'La forma de moverse cambia mucho según el ingreso, el género, la edad y la discapacidad. Según estudios de CAF en ciudades de América Latina, las mujeres usan más el transporte público y caminan más, hacen viajes más cortos y en horarios variados, y encadenan paradas ligadas a tareas de cuidado: llevar a los chicos a la escuela, hacer compras, acompañar a alguien al médico. El mayor obstáculo que señalan es el acoso en el transporte y las paradas.',
        'Los hogares de menores ingresos, que muchas veces viven en la periferia, suelen tener viajes más largos, con más transbordos, y gastar una parte mayor de su ingreso en moverse.',
      ]),
      clas('¿Es un viaje pendular o un viaje encadenado?', { // e1
        'Pendular': ['Casa, trabajo y vuelta a casa', 'Casa, facultad y vuelta a casa'],
        'Encadenado': ['Casa, escuela de los chicos, trabajo, supermercado y casa', 'Casa, centro de salud con un familiar, farmacia y casa'],
      }, 'Las encuestas que solo miran el viaje al trabajo pierden buena parte de la movilidad de cuidado.', { d: 1 }),
      op('¿Por qué una encuesta que solo pregunta por el viaje al trabajo subestima las necesidades de muchas mujeres?', [ // e2
        'Porque no registra los viajes de cuidado encadenados',
        'Porque las mujeres casi no viajan al trabajo',
        ['Porque las mujeres no usan el transporte público', 'Según CAF, son sus principales usuarias.'],
        'Porque los viajes de cuidado son siempre en auto',
      ], 'Lo que no se mide no se planifica: los viajes de cuidado quedan invisibles.', { d: 2 }),
      numv(3, (i) => { // e3
        const [ingreso, gasto] = [[500000, 60000], [300000, 54000], [900000, 45000]][i];
        return {
          enunciado: `Un hogar tiene ingresos de ${ingreso.toLocaleString('es-AR')} pesos por mes y gasta ${gasto.toLocaleString('es-AR')} en transporte. ¿Qué porcentaje de su ingreso gasta en moverse?`,
          valor: gasto * 100 / ingreso,
          unidad: '%',
          explicacion: `${gasto.toLocaleString('es-AR')} ÷ ${ingreso.toLocaleString('es-AR')} × 100 = ${gasto * 100 / ingreso} %. Valores de ejemplo: el mismo pasaje pesa mucho más en un hogar de menores ingresos.`,
          ctx: `Ingreso de ${ingreso}; gasto de ${gasto} en transporte.`,
        };
      }, { d: 1 }),
      numv(3, (i) => { // e4
        const min = [90, 60, 120][i];
        return {
          enunciado: `Una persona tarda ${min} minutos en cada sentido para ir a trabajar, 22 días por mes. ¿Cuántas horas por mes pasa viajando?`,
          valor: min * 2 * 22 / 60,
          unidad: 'horas',
          explicacion: `${min} × 2 × 22 = ${min * 2 * 22} minutos = ${min * 2 * 22 / 60} horas por mes. Tiempo que no se puede dedicar a descansar, estudiar o cuidar.`,
          ctx: `${min} minutos por sentido; 22 días.`,
        };
      }, { d: 1 }),
      cad('Armá la cadena de cómo el acoso en el transporte reduce oportunidades.', [ // e5
        'Hay acoso en paradas y vehículos',
        'Muchas mujeres evitan ciertos horarios o recorridos',
        'Eligen viajes más caros o más largos, o no viajan',
        'Pierden acceso a trabajos, estudios o actividades',
        'Se profundiza la desigualdad',
      ], ['El acoso solo afecta el viaje del día en que ocurre'], 'La seguridad personal es una condición para que el transporte público sea realmente público.', { d: 2 }),
      par('Uní cada grupo con una barrera frecuente.', [ // e6
        ['Personas en silla de ruedas', 'Colectivos sin piso bajo ni rampa'],
        ['Niñas y niños', 'Cruces peligrosos camino a la escuela'],
        ['Mujeres', 'Acoso en paradas y vehículos'],
        ['Barrios de la periferia', 'Viajes largos con varios transbordos'],
      ], 'Cada barrera tiene soluciones concretas, si se la ve.', { d: 1 }),
      vf('Si el tiempo promedio de viaje de la ciudad baja, mejora para todas las personas.', false, 'Un promedio puede bajar mientras empeora para algunos grupos, por ejemplo en la periferia. Hay que mirar los datos separados por barrio, ingreso y género.', {
        razones: ['+Porque el promedio puede esconder que algunos grupos empeoran', '-Porque los promedios siempre muestran a todos por igual', '-Porque el tiempo de viaje no importa'],
        d: 2,
      }),
      teoria('Planificar con todas las personas', [
        'Una movilidad justa se planifica con datos separados por género, ingreso, edad y discapacidad; con la participación de quienes viajan; y con medidas concretas: paradas iluminadas y visibles, colectivos accesibles, tarifas integradas que no castiguen los transbordos, cruces seguros cerca de escuelas y veredas sin obstáculos.',
      ]),
      mult('¿Qué medidas hacen la movilidad más justa? Marcá todas.', [ // e7
        '+Paradas iluminadas y visibles',
        '+Colectivos con piso bajo y rampa',
        '+Tarifas integradas que no cobren de más por transbordar',
        '+Encuestas que registren los viajes de cuidado',
        '-Planificar solo con datos del viaje al trabajo en auto',
      ], 'La movilidad justa se diseña mirando a quienes hoy tienen más dificultades.', { d: 1 }),
      ord('Ordená los pasos de una planificación participativa de la movilidad.', [ // e8
        'Relevar cómo viajan las personas, con datos separados por grupo',
        'Escuchar a vecinas, vecinos y organizaciones',
        'Identificar las barreras principales',
        'Diseñar y probar soluciones',
        'Evaluar con los mismos grupos y ajustar',
      ], 'Participar desde el principio mejora las soluciones y su aceptación.', { d: 2 }),
      det('Leé este diagnóstico municipal y marcá lo que conviene revisar.', [ // e9
        ['Relevamos los viajes al trabajo y también los de cuidado.', false],
        ['Como el tiempo promedio bajó, no hace falta mirar la periferia.', true, 'El promedio puede esconder que en la periferia empeoró.'],
        ['Las paradas nuevas tendrán iluminación.', false],
        ['El acoso es un tema policial, no de planificación del transporte.', true, 'El diseño de paradas, horarios e iluminación también lo previene.'],
      ], 'Un diagnóstico justo mira quién queda afuera de los promedios.', { d: 2 }),
      comp('Completá.', 'Un viaje con varias paradas ligadas al cuidado es un viaje [encadenado]; el que va de casa al trabajo y vuelve es [pendular]; y para ver desigualdades hay que mirar datos separados por [grupo].', ['directo', 'circular', 'color'], 'Tres ideas para planificar una movilidad para todas las personas.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: ciudades para las personas', 'Accesibilidad, demanda inducida, precios, rediseño de calles y movilidad justa, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: la avenida de San Martín del Río', 'Una ciudad mediana discute rediseñar su avenida principal. Con los conteos, evaluá la propuesta y cómo implementarla.', [
      teoria('La situación', [
        'La avenida mide 24 m entre fachadas: 18 m de calzada (cuatro carriles y dos de estacionamiento) y 3 m de vereda de cada lado. En la hora pico pasan 1.200 personas en 1.000 autos, 2.400 en 40 colectivos, 300 en bicicleta y 3.000 a pie. La propuesta: dejar un carril para autos por sentido, sumar un carril exclusivo de colectivos por sentido y ciclovías protegidas, ensanchar las veredas y plantar árboles. Algunos comerciantes temen que "todo el tránsito se vaya a las calles vecinas".',
      ]),
      num('¿Qué porcentaje del ancho entre fachadas ocupa hoy la calzada para autos?', 75, '%', '18 ÷ 24 × 100 = 75 %: tres cuartos de la avenida para el vehículo que menos personas mueve.', { ctx: '18 m de calzada en 24 m.', d: 1 }),
      num('Sin contar a quienes caminan, ¿qué porcentaje de las personas que circulan por la avenida en hora pico va en auto? Redondeá al entero.', 31, '%', '1.200 ÷ (1.200 + 2.400 + 300) × 100 = 1.200 ÷ 3.900 × 100 ≈ 31 %.', { ctx: '1.200 en auto, 2.400 en colectivo y 300 en bici.', tol: 1, d: 2 }),
      op('¿Qué argumento justifica mejor el nuevo reparto del espacio?', [ // e3
        'La mayoría viaja en colectivo, en bici o a pie',
        'Que los autos contaminan y por eso hay que castigarlos',
        ['Que los colectivos no necesitan carriles propios', 'Los necesitan: un carril exclusivo los hace más rápidos y regulares.'],
        'Que las avenidas anchas son siempre peligrosas',
      ], 'Repartir el espacio según cuántas personas mueve cada modo es un criterio de eficiencia y de justicia.', { d: 2 }),
      clas('¿A qué objetivo apunta cada parte de la propuesta?', { // e4
        'Mover más personas': ['Carril exclusivo de colectivos', 'Ciclovías protegidas'],
        'Seguridad y vida en la calle': ['Veredas más anchas', 'Árboles y bancos'],
      }, 'Una buena avenida mueve más gente y, a la vez, es un lugar mejor para estar.', { d: 1 }),
      vf('Si se sacan dos carriles para autos, todo ese tránsito se va a pasar a las calles vecinas.', false, 'Parte del tránsito se reorganiza, pero parte se "evapora": viajes que cambian de modo, de horario o se combinan. Conviene medirlo y cuidar las calles vecinas.', {
        razones: ['+Porque parte del tránsito se evapora o cambia de modo', '-Porque los autos desaparecen por completo de la ciudad', '-Porque las calles vecinas no tienen tránsito'],
        d: 2,
      }),
      ord('Ordená cómo implementar la propuesta.', [ // e6
        'Presentar los conteos y la propuesta a vecinos y comerciantes',
        'Probar el nuevo reparto con pintura y separadores',
        'Medir tiempos de viaje, ventas y tránsito en calles vecinas',
        'Ajustar el diseño según los datos',
        'Construir la versión permanente con árboles',
      ], 'Probar, medir y ajustar reduce riesgos y construye apoyo.', { d: 3 }),
      det('El municipio redacta el proyecto. Marcá lo que conviene corregir.', [ // e7
        ['El carril exclusivo hará más rápidos y regulares a los colectivos.', false],
        ['No mediremos las calles vecinas, porque el tránsito se evapora todo.', true, 'Solo una parte se evapora: hay que medir y cuidar las calles vecinas.'],
        ['Probaremos primero con materiales temporales.', false],
        ['La decisión se tomará sin consultar a comerciantes ni vecinos.', true, 'La participación mejora el diseño y la aceptación.'],
      ], 'Un buen proyecto se apoya en datos, pruebas y participación.', { d: 3 }),
    ]),
  ],
});
