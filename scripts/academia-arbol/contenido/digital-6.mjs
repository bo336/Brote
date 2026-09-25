import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// DIGITAL 6 — Diseñar tecnología sostenible.
// Aparatos que duran y se reparan, software que no despilfarra, computar
// cuando la energía es más limpia, diseño que no atrapa la atención y
// tecnología accesible para todas las personas. Retoma la huella de fabricar
// (digital-1), la energía de la IA (digital-3), la minería urbana (digital-4)
// y el ecodiseño y el derecho a reparar (consumo-3).

export default unidad({
  slug: 'digital-6',
  rama: 'digital',
  orden: 6,
  nivel: 3,
  requiereTronco: 3,
  titulo: 'Diseñar tecnología sostenible',
  bajada: 'Celulares que se reparan, páginas livianas, servidores que esperan al sol, apps que no te atrapan y tecnología que funciona para todas las personas.',
  objetivos: [
    'Identificar criterios de diseño para aparatos durables y reparables',
    'Calcular y reducir la huella del software con la intensidad de carbono',
    'Aplicar la computación consciente del carbono a tareas flexibles',
    'Reconocer patrones oscuros y diseños que respetan a las personas',
    'Diseñar tecnología accesible, liviana e interoperable',
  ],
  repasa: ['digital-1', 'digital-3', 'digital-4', 'consumo-3'],
  fuentes: ['ue-ecodiseno-moviles', 'ue-cargador-comun', 'ue-derecho-reparar', 'gsf-sci', 'gsf-principios', 'w3c-wsg', 'iea-energia-ia', 'cammesa', 'ue-dsa', 'wcag-22', 'ewaste-monitor'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Aparatos que duran', 'Baterías, repuestos, tornillos comunes y actualizaciones: diseñar para que un aparato viva más.', [
      teoria('Diseñar para durar', [
        'Como viste, la mayor parte de la huella de un celular se genera al fabricarlo. Por eso, lo más efectivo es que dure más. Eso depende del diseño: baterías que se pueden cambiar, tornillos comunes en vez de pegamento, repuestos disponibles, manuales de reparación y software que se siga actualizando.',
      ]),
      numv(3, (i) => { // e1
        const [kg, anios] = [[60, 3], [60, 5], [80, 4]][i];
        return {
          enunciado: `Fabricar un celular emite unos ${kg} kg de CO₂e. Si se usa ${anios} años, ¿cuántos kg de fabricación le corresponden a cada año de uso?`,
          valor: kg / anios,
          unidad: 'kg CO₂e por año',
          explicacion: `${kg} ÷ ${anios} = ${kg / anios} kg por año. Cuantos más años dura un aparato, menos pesa su fabricación en cada año de uso. Valores de ejemplo.`,
          ctx: `${kg} kg CO₂e de fabricación; ${anios} años de uso.`,
        };
      }, { d: 1 }),
      teoria('Reglas para aparatos que duran', [
        'Desde el 20 de junio de 2025, la Unión Europea exige a los celulares y tabletas que se venden allí baterías que conserven al menos el 80 % de su capacidad después de 800 ciclos de carga, repuestos clave disponibles durante 7 años después de dejar de vender el modelo, actualizaciones del sistema operativo durante al menos 5 años y una etiqueta con una clase de reparabilidad de la A a la E. Desde fines de 2024, además, exige un cargador común USB-C.',
      ]),
      par('Uní cada requisito europeo para celulares con lo que exige.', [ // e2
        ['Batería', 'Conservar el 80 % tras 800 ciclos'],
        ['Repuestos', 'Disponibles 7 años después de dejar de vender el modelo'],
        ['Software', 'Actualizaciones del sistema durante al menos 5 años'],
        ['Etiqueta', 'Clase de reparabilidad de la A a la E'],
      ], 'Son reglas para que los aparatos duren más y se puedan reparar.', { d: 2 }),
      numv(3, (i) => { // e3
        const [ciclos, sem] = [[800, 7], [1000, 7], [800, 5]][i];
        const anios = Math.round(ciclos / (sem * 52) * 10) / 10;
        return {
          enunciado: `Una batería soporta ${ciclos.toLocaleString('es-AR')} ciclos manteniendo el 80 % de su capacidad. Si se carga ${sem} veces por semana, ¿cuántos años dura en ese estado? Redondeá a un decimal.`,
          valor: anios,
          unidad: 'años',
          dec: 1,
          tol: 0.1,
          explicacion: `${sem} × 52 = ${sem * 52} cargas por año; ${ciclos.toLocaleString('es-AR')} ÷ ${sem * 52} ≈ ${anios.toLocaleString('es-AR')} años. Después, poder cambiar la batería evita cambiar todo el celular.`,
          ctx: `${ciclos} ciclos; ${sem} cargas por semana.`,
        };
      }, { d: 2 }),
      clas('¿Este rasgo de diseño facilita o dificulta la reparación?', { // e4
        'La facilita': ['Batería que se cambia con tornillos comunes', 'Manual de reparación público', 'Repuestos a la venta por años'],
        'La dificulta': ['Batería pegada con adhesivo fuerte', 'Piezas que solo funcionan con la pieza original emparejada', 'Tornillos con formas exclusivas'],
      }, 'Muchas decisiones de diseño definen si un aparato se repara o se tira.', { d: 1 }),
      cad('Armá la cadena de cómo un cargador común reduce la basura electrónica.', [ // e5
        'Todos los celulares usan el mismo tipo de conector',
        'Un cargador sirve para varios aparatos y marcas',
        'Ya no hace falta un cargador nuevo con cada compra',
        'Se fabrican y venden menos cargadores',
        'Hay menos basura electrónica',
      ], ['Cada marca necesita un cargador distinto'], 'Un estándar común es una forma simple de evitar residuos.', { d: 1 }),
      op('¿Qué medida suele reducir más la huella de un celular a lo largo de su vida?', [ // e6
        'Usarlo más años, reparándolo cuando haga falta',
        'Cargarlo solo de noche para ahorrar electricidad',
        ['Cambiarlo cada año por uno más eficiente', 'Fabricar uno nuevo emite más de lo que ahorra su eficiencia.'],
        'Borrar fotos viejas de la memoria cada semana',
      ], 'Como casi toda la huella está en fabricarlo, cada año extra de uso cuenta mucho.', { d: 1 }),
      vf('Un celular con batería pegada y piezas exclusivas es igual de fácil de reparar que uno modular.', false, 'El pegamento, las piezas emparejadas y los tornillos exclusivos encarecen y dificultan la reparación. El diseño modular permite cambiar partes con herramientas comunes.', {
        razones: ['+Porque el pegamento y las piezas exclusivas dificultan reparar', '-Porque los celulares modulares no se pueden abrir', '-Porque ningún celular se puede reparar'],
        d: 1,
      }),
      est('¿Durante cuántos años después de dejar de vender un modelo exige la Unión Europea que haya repuestos clave de celulares?', 7, { min: 0, max: 20, paso: 1, unidad: 'años' }, 'Siete años: una forma de que los aparatos se puedan reparar mucho después de comprados.', { d: 2 }),
      mult('¿Qué conviene mirar antes de comprar un aparato para que dure? Marcá todo.', [ // e7
        '+Si la batería se puede cambiar',
        '+Cuántos años de actualizaciones promete el fabricante',
        '+Si hay repuestos y servicio técnico en tu zona',
        '+Si usa conectores estándar',
        '-Si es el modelo más nuevo del año',
      ], 'Durabilidad y reparabilidad son características tan importantes como la cámara o la pantalla.', { d: 1 }),
      det('Leé esta publicidad de un celular y marcá lo que conviene revisar.', [ // e8
        ['Batería reemplazable con un destornillador común.', false],
        ['Diseño ultrafino sellado: ¡no hace falta abrirlo nunca!', true, 'Sellado suele significar que no se puede reparar ni cambiar la batería.'],
        ['Cinco años de actualizaciones del sistema.', false],
        ['Incluye un cargador exclusivo que solo sirve para esta marca.', true, 'Un conector exclusivo genera más residuos; el estándar es mejor.'],
      ], 'Leer una publicidad pensando en la reparación cambia qué vale la pena comprar.', { d: 2 }),
      comp('Completá.', 'En la Unión Europea, la batería de un celular debe conservar el 80 % tras [800] ciclos; los repuestos deben estar disponibles [7] años; y el conector común obligatorio es el [USB-C].', ['80', '2', 'HDMI'], 'Tres números de las reglas para aparatos que duran.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Software que no despilfarra', 'Páginas pesadas, obsolescencia por software y cómo se mide la huella de un programa.', [
      teoria('El software decide cuánto hardware se usa', [
        'El software no se ve, pero decide cuánta energía consume un aparato, cuántos datos viajan por la red y cuántos servidores hacen falta. Una página cargada de imágenes enormes, videos que arrancan solos y códigos innecesarios obliga a mover y procesar mucho más. Y cuando las aplicaciones se vuelven cada vez más pesadas, o dejan de actualizarse, aparatos que funcionan bien quedan viejos antes de tiempo: es la obsolescencia por software.',
        'La Green Software Foundation propone principios para un software más verde: eficiencia de carbono, eficiencia energética, conciencia del carbono (usar energía cuando es más limpia), eficiencia del hardware y medir para mejorar.',
      ]),
      cad('Armá la cadena de la obsolescencia por software.', [ // e1
        'Las apps suman funciones y se vuelven más pesadas',
        'Un celular de hace pocos años se pone lento',
        'Deja de recibir actualizaciones',
        'Algunas apps necesarias ya no funcionan en él',
        'Se reemplaza un aparato que todavía andaba',
      ], ['Las apps más pesadas hacen durar más los celulares'], 'Diseñar software liviano y con soporte largo es otra forma de alargar la vida de los aparatos.', { d: 2 }),
      clas('¿Esta práctica aligera o recarga una página web?', { // e2
        'La aligera': ['Imágenes comprimidas al tamaño en que se muestran', 'Videos que solo se reproducen si se pide', 'Cargar las imágenes cuando se llega a ellas'],
        'La recarga': ['Fotos originales de 10 MB en miniaturas', 'Videos de fondo que arrancan solos', 'Muchos scripts de seguimiento de terceros'],
      }, 'Una página liviana carga más rápido, gasta menos datos y funciona mejor en celulares viejos.', { d: 1 }),
      numv(3, (i) => { // e3
        const [mb, visitas] = [[2, 100000], [3, 50000], [0.5, 200000]][i];
        return {
          enunciado: `Una página pesa ${mb.toLocaleString('es-AR')} MB y recibe ${visitas.toLocaleString('es-AR')} visitas por mes. ¿Cuántos GB transfiere por mes? (1 GB = 1.000 MB)`,
          valor: mb * visitas / 1000,
          unidad: 'GB',
          explicacion: `${mb.toLocaleString('es-AR')} × ${visitas.toLocaleString('es-AR')} = ${(mb * visitas).toLocaleString('es-AR')} MB = ${(mb * visitas / 1000).toLocaleString('es-AR')} GB. Cada MB que se ahorra en la página se multiplica por todas las visitas.`,
          ctx: `${mb} MB por página; ${visitas} visitas.`,
        };
      }, { d: 1 }),
      numv(3, (i) => { // e4
        const [antes, despues] = [[4, 1], [2.5, 1], [5, 2]][i];
        return {
          enunciado: `Una página pesaba ${antes.toLocaleString('es-AR')} MB. Después de optimizar imágenes y quitar videos automáticos pesa ${despues.toLocaleString('es-AR')} MB. ¿En qué porcentaje se redujo?`,
          valor: Math.round((antes - despues) / antes * 100),
          unidad: '%',
          explicacion: `(${antes.toLocaleString('es-AR')} − ${despues.toLocaleString('es-AR')}) ÷ ${antes.toLocaleString('es-AR')} × 100 = ${Math.round((antes - despues) / antes * 100)} %. Muchas mejoras no cambian nada de lo que la persona ve.`,
          ctx: `Página de ${antes} MB optimizada a ${despues} MB.`,
        };
      }, { d: 1 }),
      teoria('Medir la huella del software', [
        'Para medir la huella de un programa, la Green Software Foundation creó la especificación de Intensidad de Carbono del Software, que en 2024 se convirtió en la norma ISO/IEC 21031. Su fórmula es SCI = (E × I + M) por R: la energía que usa el software (E) por la intensidad de carbono de esa electricidad (I), más las emisiones de fabricar el hardware que usa (M), dividido por una unidad funcional (R), como un usuario o una transacción.',
      ]),
      par('Uní cada letra de la fórmula SCI con lo que representa.', [ // e5
        ['E', 'Energía que consume el software'],
        ['I', 'Emisiones por cada kWh de la red'],
        ['M', 'Emisiones de fabricar el hardware usado'],
        ['R', 'Unidad funcional, como un usuario o una transacción'],
      ], 'La fórmula junta energía, red eléctrica y hardware en un solo número comparable.', { d: 2 }),
      numv(3, (i) => { // e6
        const [e, int, m, r] = [[10, 400, 2000, 1000], [20, 300, 4000, 2000], [5, 100, 1500, 500]][i];
        return {
          enunciado: `Un servicio usa ${e} kWh por día, la red emite ${int} g de CO₂e por kWh, el hardware aporta ${m.toLocaleString('es-AR')} g por día y atiende a ${r.toLocaleString('es-AR')} usuarios. ¿Cuál es su SCI, en gramos por usuario y por día?`,
          valor: (e * int + m) / r,
          unidad: 'g CO₂e por usuario',
          explicacion: `(${e} × ${int} + ${m.toLocaleString('es-AR')}) ÷ ${r.toLocaleString('es-AR')} = ${((e * int + m) / r).toLocaleString('es-AR')} g por usuario. Con este número se puede comparar una versión del software con otra.`,
          ctx: `E = ${e} kWh; I = ${int} g/kWh; M = ${m} g; R = ${r} usuarios.`,
        };
      }, { d: 3 }),
      op('¿Por qué optimizar las imágenes de un sitio muy visitado tiene tanto efecto?', [ // e7
        'Porque el ahorro se multiplica por cada visita',
        'Porque las imágenes no ocupan espacio en los servidores',
        ['Porque así el sitio deja de necesitar electricidad', 'Sigue necesitando, pero bastante menos.'],
        'Porque las imágenes grandes son ilegales',
      ], 'En software, pequeñas mejoras repetidas millones de veces se vuelven grandes.', { d: 1 }),
      vf('El software no tiene huella ambiental porque no es un objeto físico.', false, 'El software decide cuánta energía y cuánto hardware se usan, y puede acortar la vida de los aparatos. Por eso ya existe una norma para medir su intensidad de carbono.', {
        razones: ['+Porque define cuánta energía y hardware se usan', '-Porque el software funciona sin electricidad', '-Porque los servidores no existen'],
        d: 1,
      }),
      mult('¿Cuáles son principios del software verde según la Green Software Foundation? Marcá todos.', [ // e8
        '+Eficiencia de carbono',
        '+Eficiencia energética',
        '+Conciencia del carbono: usar energía cuando es más limpia',
        '+Eficiencia del hardware',
        '-Agregar funciones sin medir su costo',
      ], 'Medir es la base: sin números, no se sabe qué mejora.', { d: 1 }),
      det('Leé esta propuesta de rediseño web y marcá lo que conviene revisar.', [ // e9
        ['Comprimiremos las imágenes y las cargaremos solo cuando se lleguen a ver.', false],
        ['Agregaremos un video de fondo en alta definición que arranca solo en todas las páginas.', true, 'Suma mucho peso y consumo sin que nadie lo pida.'],
        ['Mediremos el peso de las páginas antes y después.', false],
        ['Dejaremos de dar soporte a celulares de más de dos años.', true, 'Acelera la obsolescencia de aparatos que funcionan.'],
      ], 'Un buen rediseño mejora la experiencia y reduce la huella a la vez.', { d: 2 }),
      comp('Completá.', 'Cuando un aparato queda viejo por culpa de programas cada vez más pesados hay obsolescencia por [software]; la norma para medir la huella de un programa es la ISO/IEC [21031]; y en la fórmula SCI, la M son las emisiones de fabricar el [hardware].', ['batería', '9001', 'teclado'], 'Tres ideas para medir y reducir la huella del software.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Energía limpia en el momento justo', 'Computación consciente del carbono: mover tareas flexibles a horas y lugares con electricidad más limpia, y usar la IA con criterio.', [
      teoria('La red cambia hora a hora', [
        'Las emisiones de cada kWh de la red cambian según la hora y el lugar. Cuando hay mucho sol y viento, entra más energía renovable y cada kWh emite menos; cuando la demanda es alta y se encienden centrales térmicas, emite más. En Argentina, CAMMESA publica cómo se genera la electricidad hora por hora.',
        'La computación consciente del carbono aprovecha esto: tareas flexibles, como copias de seguridad, actualizaciones o el entrenamiento de un modelo, se programan para las horas o los lugares con electricidad más limpia. Las tareas que deben hacerse al instante, como una videollamada, no se pueden mover.',
      ]),
      numv(3, (i) => { // e1
        const [kwh, alta, baja] = [[500, 400, 150], [1000, 350, 100], [200, 450, 200]][i];
        return {
          enunciado: `Una tarea de procesamiento usa ${kwh.toLocaleString('es-AR')} kWh. Si se hace cuando la red emite ${alta} g de CO₂e por kWh, en vez de cuando emite ${baja}, ¿cuántos kg de CO₂e de más se emiten?`,
          valor: kwh * (alta - baja) / 1000,
          unidad: 'kg CO₂e',
          explicacion: `${kwh.toLocaleString('es-AR')} × (${alta} − ${baja}) = ${(kwh * (alta - baja)).toLocaleString('es-AR')} g = ${(kwh * (alta - baja) / 1000).toLocaleString('es-AR')} kg. La misma tarea, a otra hora, puede emitir mucho menos.`,
          ctx: `${kwh} kWh; ${alta} contra ${baja} g por kWh.`,
        };
      }, { d: 2 }),
      clas('¿Esta tarea se puede mover a otra hora o tiene que hacerse ya?', { // e2
        'Se puede mover': ['Una copia de seguridad nocturna', 'El entrenamiento de un modelo de IA', 'La actualización de apps del celular'],
        'Tiene que hacerse ya': ['Una videollamada', 'Un pago con tarjeta en un comercio', 'Una alerta de emergencia'],
      }, 'La flexibilidad en el tiempo es lo que permite aprovechar la energía más limpia.', { d: 1 }),
      cad('Armá la cadena de una tarea programada con conciencia del carbono.', [ // e3
        'Se identifica una tarea que puede esperar',
        'Se consulta la intensidad de carbono prevista de la red',
        'Se programa para las horas con más renovables',
        'La tarea usa la misma energía, pero más limpia',
        'Bajan las emisiones sin cambiar el resultado',
      ], ['La tarea usa menos energía por hacerse de noche'], 'No se consume menos energía: se consume energía que emite menos.', { d: 2 }),
      vf('Mover una tarea a la madrugada siempre la hace más limpia.', false, 'Depende de la red. En sistemas con mucha energía solar, las horas más limpias pueden ser las del mediodía. Hay que mirar la intensidad de carbono real de cada hora.', {
        razones: ['+Porque depende de la mezcla de la red en cada hora', '-Porque de noche no se consume electricidad', '-Porque la energía solar se genera de noche'],
        d: 2,
      }),
      teoria('Usar la IA con criterio', [
        'La inteligencia artificial también se puede usar de forma más eficiente: modelos más chicos para tareas simples, respuestas guardadas para preguntas que se repiten y no usar un modelo enorme cuando una búsqueda común alcanza. Como viste, la demanda de electricidad de los centros de datos crece rápido; cada decisión de diseño suma.',
      ]),
      numv(3, (i) => { // e4
        const [chico, grande, n] = [[0.3, 3, 1000], [0.5, 4, 2000], [0.2, 2, 5000]][i];
        return {
          enunciado: `Un modelo chico usa ${chico.toLocaleString('es-AR')} Wh por consulta y uno grande ${grande.toLocaleString('es-AR')} Wh. Si ${n.toLocaleString('es-AR')} consultas simples se responden con el chico, ¿cuántos kWh se ahorran?`,
          valor: Math.round((grande - chico) * n / 1000 * 10) / 10,
          unidad: 'kWh',
          dec: 1,
          explicacion: `(${grande.toLocaleString('es-AR')} − ${chico.toLocaleString('es-AR')}) × ${n.toLocaleString('es-AR')} = ${((grande - chico) * n).toLocaleString('es-AR')} Wh ≈ ${(Math.round((grande - chico) * n / 1000 * 10) / 10).toLocaleString('es-AR')} kWh. Valores de ejemplo: elegir la herramienta adecuada para cada tarea ahorra mucho.`,
          ctx: `${chico} Wh contra ${grande} Wh; ${n} consultas.`,
        };
      }, { d: 2 }),
      op('¿Por qué la computación consciente del carbono se aplica sobre todo a tareas flexibles?', [ // e5
        'Porque se pueden hacer cuando la energía es más limpia',
        'Porque las tareas flexibles no usan electricidad',
        ['Porque las tareas urgentes son ilegales', 'Son necesarias; simplemente no pueden esperar.'],
        'Porque las tareas flexibles son siempre las más chicas',
      ], 'Lo que puede esperar puede elegir su momento.', { d: 1 }),
      par('Uní cada estrategia con un ejemplo.', [ // e6
        ['Mover en el tiempo', 'Programar copias de seguridad al mediodía solar'],
        ['Mover en el espacio', 'Procesar en una región con más renovables'],
        ['Reducir el trabajo', 'Guardar respuestas a preguntas repetidas'],
        ['Elegir el modelo adecuado', 'Usar un modelo chico para clasificar textos simples'],
      ], 'Hay varias palancas, y se pueden combinar.', { d: 2 }),
      ord('Ordená los pasos para hacer más limpio un sistema de copias de seguridad.', [ // e7
        'Identificar qué tareas pueden esperar',
        'Consultar la intensidad de carbono prevista de la red',
        'Programar las tareas en las horas más limpias',
        'Medir las emisiones evitadas',
        'Ajustar la programación según los resultados',
      ], 'Medir antes y después es lo que muestra si el cambio funcionó.', { d: 2 }),
      mult('¿Qué prácticas hacen más eficiente el uso de IA? Marcá todas.', [ // e8
        '+Usar modelos más chicos para tareas simples',
        '+Guardar respuestas a consultas repetidas',
        '+Entrenar en horas y lugares con energía más limpia',
        '+Preguntarse si hace falta IA para esa tarea',
        '-Usar siempre el modelo más grande disponible',
      ], 'La mejor consulta a veces es la que no hace falta hacer.', { d: 1 }),
      det('Leé este plan de un área de sistemas y marcá lo que conviene revisar.', [ // e9
        ['Programaremos las copias de seguridad según la intensidad de carbono de la red.', false],
        ['Pasaremos las videollamadas a la madrugada para que sean más limpias.', true, 'Las videollamadas no se pueden mover: no son tareas flexibles.'],
        ['Usaremos un modelo chico para clasificar los correos.', false],
        ['No hace falta medir: seguro que ahorramos.', true, 'Sin medir no se sabe cuánto se ahorra ni si funciona.'],
      ], 'La conciencia del carbono funciona con tareas flexibles y datos reales.', { d: 2 }),
      comp('Completá.', 'Programar tareas para cuando la red es más limpia es computación consciente del [carbono]; las tareas que pueden esperar se llaman [flexibles]; y en Argentina la generación de cada hora la publica [CAMMESA].', ['papel', 'urgentes', 'INDEC'], 'Tres ideas para computar en el momento justo.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Diseño que no atrapa', 'Economía de la atención, patrones oscuros, opciones por defecto y diseño que respeta a las personas.', [
      teoria('La economía de la atención', [
        'Muchas aplicaciones se diseñan para que pasemos en ellas la mayor cantidad de tiempo posible: desplazamiento infinito, videos que arrancan solos, notificaciones constantes. Más tiempo de uso significa más datos, más energía y, muchas veces, costos para el bienestar. Además existen los patrones oscuros: trucos de diseño que llevan a hacer algo que no se quería, como casillas premarcadas o bajas escondidas. El Reglamento de Servicios Digitales de la Unión Europea, de 2022, prohíbe a las plataformas en línea usar este tipo de diseños engañosos.',
      ]),
      clas('¿Es un patrón oscuro o un diseño respetuoso?', { // e1
        'Patrón oscuro': ['Darse de baja exige diez pasos y una llamada', 'Casilla de "recibir promociones" ya marcada', 'Botón de "aceptar" grande y de "rechazar" escondido'],
        'Diseño respetuoso': ['Darse de baja con un clic', 'Videos que se reproducen solo si se pide', 'Opciones claras con el mismo tamaño'],
      }, 'Un diseño respetuoso deja decidir; un patrón oscuro decide por vos.', { d: 1 }),
      cad('Armá la cadena de cómo el diseño para atrapar la atención aumenta la huella.', [ // e2
        'La app usa desplazamiento infinito y reproducción automática',
        'Las personas pasan más tiempo del que pensaban',
        'Se descargan más videos e imágenes',
        'Aumentan el uso de datos, servidores y batería',
        'Crecen la energía consumida y el desgaste de los aparatos',
      ], ['Más tiempo de uso reduce el consumo de datos'], 'El diseño que respeta el tiempo de las personas también ahorra energía.', { d: 2 }),
      teoria('El poder de las opciones por defecto', [
        'La mayoría de las personas no cambia la configuración que viene de fábrica. Por eso las opciones por defecto tienen mucho poder: si la reproducción automática viene apagada, si los videos se ven en una resolución adecuada a la pantalla o si las fotos se respaldan solo con wifi, millones de personas ahorran datos y energía sin hacer nada. También vale para la privacidad: se puede diseñar para recolectar solo los datos necesarios.',
      ]),
      op('¿Por qué las opciones por defecto tienen tanto efecto?', [ // e3
        'Porque la mayoría de las personas no las cambia',
        'Porque es ilegal cambiarlas',
        ['Porque siempre son las opciones más caras', 'No tienen por qué serlo; lo clave es que casi nadie las toca.'],
        'Porque solo las ven los programadores',
      ], 'Quien diseña los valores por defecto decide, en la práctica, por millones de personas.', { d: 1 }),
      numv(3, (i) => { // e4
        const [min, mbmin, dias] = [[30, 10, 30], [20, 15, 30], [45, 8, 30]][i];
        return {
          enunciado: `Una persona ve ${min} minutos por día de videos que arrancan solos y que no eligió, a unos ${mbmin} MB por minuto. ¿Cuántos GB consume en ${dias} días? (1 GB = 1.000 MB)`,
          valor: min * mbmin * dias / 1000,
          unidad: 'GB',
          explicacion: `${min} × ${mbmin} × ${dias} = ${(min * mbmin * dias).toLocaleString('es-AR')} MB = ${(min * mbmin * dias / 1000).toLocaleString('es-AR')} GB por mes en contenido que no buscaba. Valores de ejemplo.`,
          ctx: `${min} minutos por día; ${mbmin} MB por minuto; ${dias} días.`,
        };
      }, { d: 1 }),
      vf('El modo oscuro ahorra energía en cualquier tipo de pantalla.', false, 'Ahorra en pantallas OLED, donde los píxeles negros casi no consumen. En pantallas LCD la luz de fondo está siempre encendida, así que el ahorro es mínimo.', {
        razones: ['+Porque solo ahorra de verdad en pantallas OLED', '-Porque el modo oscuro aumenta siempre el consumo', '-Porque las pantallas no consumen energía'],
        d: 3,
      }),
      par('Uní cada patrón oscuro con su descripción.', [ // e5
        ['Casilla premarcada', 'La opción que conviene a la empresa ya viene elegida'],
        ['Baja laberinto', 'Suscribirse es fácil y darse de baja muy difícil'],
        ['Confirmación culpable', 'El botón de rechazo dice "no, prefiero pagar de más"'],
        ['Urgencia falsa', 'Un contador que presiona a decidir ya'],
      ], 'Ponerles nombre ayuda a reconocerlos y evitarlos.', { d: 2 }),
      mult('¿Qué opciones por defecto reducen la huella de una app de videos? Marcá todas.', [ // e6
        '+Reproducción automática apagada',
        '+Resolución adaptada al tamaño de la pantalla',
        '+Descargas pesadas solo con wifi',
        '+Recordatorio del tiempo de uso',
        '-Máxima resolución siempre, aunque la pantalla sea chica',
      ], 'Buenas opciones por defecto ahorran sin pedir esfuerzo a nadie.', { d: 1 }),
      numv(3, (i) => { // e7
        const [alta, adec, horas] = [[3, 1, 20], [2.5, 0.7, 30], [7, 3, 10]][i];
        return {
          enunciado: `Ver video en alta definición usa unos ${alta.toLocaleString('es-AR')} GB por hora; en una resolución adecuada al celular, ${adec.toLocaleString('es-AR')} GB. En ${horas} horas por mes, ¿cuántos GB se ahorran?`,
          valor: Math.round((alta - adec) * horas * 10) / 10,
          unidad: 'GB',
          explicacion: `(${alta.toLocaleString('es-AR')} − ${adec.toLocaleString('es-AR')}) × ${horas} = ${(Math.round((alta - adec) * horas * 10) / 10).toLocaleString('es-AR')} GB por mes, sin notar diferencia en una pantalla chica. Valores de ejemplo.`,
          ctx: `${alta} contra ${adec} GB por hora; ${horas} horas.`,
        };
      }, { d: 1 }),
      det('Leé esta configuración de una app nueva y marcá lo que conviene revisar.', [ // e8
        ['Las descargas pesadas se hacen solo con wifi.', false],
        ['Aceptar todas las notificaciones viene marcado y la opción de rechazar está escondida.', true, 'Es un patrón oscuro: la opción debería ser clara y equilibrada.'],
        ['La app muestra cuánto tiempo la usaste esta semana.', false],
        ['Para darse de baja hay que llamar por teléfono en horario de oficina.', true, 'Darse de baja debería ser tan fácil como suscribirse.'],
      ], 'Diseñar con respeto es dar el control a las personas.', { d: 2 }),
      comp('Completá.', 'Los trucos de diseño que llevan a hacer algo que no se quería son patrones [oscuros]; la configuración que viene de fábrica es la opción por [defecto]; y el modo oscuro ahorra energía de verdad en pantallas [OLED].', ['claros', 'favorito', 'LCD'], 'Tres ideas para diseñar tecnología que respeta a las personas.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Tecnología para todas las personas', 'Accesibilidad, apps livianas para conexiones malas y celulares viejos, estándares abiertos y diseño con la comunidad.', [
      teoria('Accesible', [
        'Una tecnología sostenible también tiene que ser usable por todas las personas. Las Pautas de Accesibilidad para el Contenido Web (WCAG) 2.2, publicadas en 2023, se organizan en cuatro principios: perceptible (se puede ver, oír o leer de distintas formas), operable (se puede usar con teclado, voz o pantalla táctil), comprensible (es claro y predecible) y robusto (funciona con distintas tecnologías, como los lectores de pantalla).',
      ]),
      par('Uní cada principio de accesibilidad con un ejemplo.', [ // e1
        ['Perceptible', 'Imágenes con texto alternativo para lectores de pantalla'],
        ['Operable', 'Se puede usar todo sin mouse, con el teclado'],
        ['Comprensible', 'Mensajes de error claros que dicen cómo corregir'],
        ['Robusto', 'Funciona con distintos navegadores y lectores de pantalla'],
      ], 'La accesibilidad amplía quién puede usar una tecnología, y suele mejorarla para todos.', { d: 2 }),
      teoria('Liviana y para cualquier celular', [
        'Muchas personas tienen celulares de gama baja, planes de datos chicos o mala conexión, sobre todo en zonas rurales. Una app liviana, que funcione sin conexión y en aparatos de hace varios años, es más inclusiva y, a la vez, más sostenible: no obliga a cambiar de celular ni a gastar datos de más. Los estándares abiertos, como el conector USB-C o los formatos de datos comunes, y el software de código abierto permiten que las tecnologías se conecten entre sí y sigan funcionando aunque una empresa deje de darles soporte.',
      ]),
      numv(3, (i) => { // e2
        const [act, plan] = [[300, 2000], [150, 1000], [500, 4000]][i];
        return {
          enunciado: `Una app pesa ${act} MB en cada actualización. Si una persona tiene un plan de ${plan.toLocaleString('es-AR')} MB por mes, ¿qué porcentaje de su plan se va en una sola actualización?`,
          valor: act * 100 / plan,
          unidad: '%',
          explicacion: `${act} ÷ ${plan.toLocaleString('es-AR')} × 100 = ${(act * 100 / plan).toLocaleString('es-AR')} %. Para quien tiene pocos datos, una app pesada no es una molestia: es una barrera.`,
          ctx: `Actualización de ${act} MB; plan de ${plan} MB.`,
        };
      }, { d: 1 }),
      clas('¿Esta decisión de diseño incluye o excluye?', { // e3
        'Incluye': ['Funcionar sin conexión y sincronizar después', 'Andar en celulares de hace cinco años', 'Letra que se puede agrandar'],
        'Excluye': ['Pedir el último modelo de celular', 'Requerir conexión permanente de alta velocidad', 'Información solo en videos sin subtítulos'],
      }, 'Diseñar para las condiciones más difíciles suele dar productos mejores para todos.', { d: 1 }),
      cad('Armá la cadena de cómo una app que exige el último celular genera residuos.', [ // e4
        'Una app necesaria deja de funcionar en celulares viejos',
        'Muchas personas tienen que cambiar su aparato',
        'Se descartan celulares que todavía andaban',
        'Crece la basura electrónica',
        'Quienes no pueden pagar uno nuevo quedan afuera',
      ], ['Exigir el último celular reduce la basura electrónica'], 'La inclusión y la sostenibilidad van de la mano.', { d: 2 }),
      op('¿Por qué los estándares abiertos ayudan a la sostenibilidad?', [ // e5
        'Permiten combinar y reusar tecnologías de distintas marcas',
        'Porque hacen que los aparatos duren menos',
        ['Porque obligan a comprar todo de la misma marca', 'Es al revés: evitan quedar atado a una sola marca.'],
        'Porque impiden reparar los aparatos',
      ], 'Lo compatible se reutiliza; lo exclusivo se descarta.', { d: 2 }),
      vf('La accesibilidad solo beneficia a personas con discapacidad.', false, 'Beneficia a mucha más gente: subtítulos en un lugar ruidoso, letra grande para personas mayores, navegación simple con mala conexión. Diseñar accesible mejora la experiencia de todos.', {
        razones: ['+Porque mejora el uso para muchas personas en distintas situaciones', '-Porque las personas sin discapacidad no pueden usar sitios accesibles', '-Porque la accesibilidad hace las páginas más pesadas siempre'],
        d: 1,
      }),
      teoria('Diseñar con la comunidad', [
        'La tecnología más útil suele surgir de trabajar con quienes la van a usar: entender sus necesidades, probar prototipos simples y ajustar. A esto se lo llama codiseño. A veces la conclusión es que no hace falta una app: un mensaje de texto, un grupo de mensajería o un cartel resuelven mejor el problema. Elegir la tecnología apropiada, y no la más llamativa, también es sostenibilidad.',
      ]),
      ord('Ordená los pasos de un proceso de codiseño.', [ // e6
        'Escuchar a quienes van a usar la tecnología',
        'Definir juntos el problema a resolver',
        'Probar un prototipo simple',
        'Ajustar según lo que se aprendió',
        'Lanzar y seguir mejorando con la comunidad',
      ], 'El codiseño evita construir soluciones que nadie necesita.', { d: 2 }),
      mult('¿Qué hace más inclusiva y sostenible a una app comunitaria? Marcá todo.', [ // e7
        '+Que funcione sin conexión',
        '+Que ande en celulares viejos',
        '+Que respete las pautas de accesibilidad',
        '+Que use formatos de datos abiertos',
        '-Que se actualice con archivos pesados cada semana',
      ], 'Liviana, accesible y abierta: tres claves que suman inclusión y menor huella.', { d: 1 }),
      det('Leé esta propuesta para una app municipal y marcá lo que conviene revisar.', [ // e8
        ['Funcionará sin conexión y enviará los datos cuando haya señal.', false],
        ['Solo andará en celulares lanzados en los últimos dos años.', true, 'Excluye a muchas personas y acelera el descarte de aparatos.'],
        ['Tendrá textos alternativos en todas las imágenes.', false],
        ['No haremos pruebas con vecinos: ya sabemos lo que necesitan.', true, 'Sin codiseño, es fácil construir algo que no sirve.'],
      ], 'Una app pública tiene que servir a todo el público.', { d: 2 }),
      comp('Completá.', 'Las pautas de accesibilidad web se llaman [WCAG]; diseñar junto con quienes van a usar una tecnología es [codiseño]; y un conector que sirve para muchas marcas es un estándar [abierto].', ['HTML', 'marketing', 'exclusivo'], 'Tres ideas para una tecnología que no deja a nadie afuera.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: tecnología sostenible', 'Aparatos durables, software liviano, energía limpia, diseño respetuoso y accesibilidad, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: la app de la cooperativa de recicladores', 'Una cooperativa de recicladores urbanos quiere una app para registrar lo que recolecta y avisar a los vecinos cuándo pasa. Diseñala con todo lo que aprendiste.', [
      teoria('La situación', [
        'La cooperativa tiene 40 recicladores. La mayoría usa celulares de más de cuatro años, con planes de 2.000 MB por mes y mala señal en algunos barrios. Una empresa les ofrece una app "de última generación" de 400 MB, que se actualiza cada semana, reproduce videos tutoriales automáticamente y solo funciona con conexión. Otra opción es una app liviana de 20 MB que funciona sin conexión.',
      ]),
      num('¿Qué porcentaje del plan mensual de 2.000 MB consumiría una sola descarga de la app de 400 MB?', 20, '%', '400 ÷ 2.000 × 100 = 20 %: una quinta parte del plan en una sola descarga, sin contar las actualizaciones semanales.', { ctx: 'App de 400 MB; plan de 2.000 MB.', d: 1 }),
      num('Si la app pesada descarga 400 MB en cada actualización semanal, ¿cuántos MB usa en actualizaciones en un mes de 4 semanas?', 1600, 'MB', '400 × 4 = 1.600 MB: el 80 % del plan de cada reciclador solo en actualizaciones.', { ctx: '400 MB por semana; 4 semanas.', d: 1 }),
      op('¿Qué opción conviene para la cooperativa?', [ // e3
        'La app liviana que funciona sin conexión',
        'La app de última generación, porque es más moderna',
        ['Comprarle a cada reciclador un celular nuevo', 'Sumaría residuos y costos que la app liviana evita.'],
        'No registrar nada para no gastar datos',
      ], 'La mejor tecnología es la que funciona en las condiciones reales de quienes la usan.', { d: 1 }),
      clas('¿Qué característica debería tener la app y cuál no?', { // e4
        'Debería tener': ['Registro sin conexión que se sincroniza después', 'Botones grandes y textos claros', 'Avisos a vecinos por mensaje de texto'],
        'No debería tener': ['Videos que arrancan solos', 'Actualizaciones pesadas cada semana', 'Exigir el último modelo de celular'],
      }, 'Liviana, accesible y adaptada al contexto: así se diseña con la comunidad.', { d: 2 }),
      ord('Ordená el proceso para desarrollar la app.', [ // e5
        'Reunirse con los recicladores para entender cómo trabajan',
        'Diseñar un prototipo simple que funcione sin conexión',
        'Probarlo en la calle con algunos recicladores',
        'Ajustar según lo que funcionó y lo que no',
        'Lanzarlo para toda la cooperativa y seguir mejorando',
      ], 'El codiseño con los recicladores es lo que hace que la app sirva de verdad.', { d: 2 }),
      vf('Una app más moderna y pesada siempre es mejor para una organización social.', false, 'Si no funciona en los celulares y planes de quienes la usan, excluye y genera gastos. La tecnología apropiada es la que resuelve el problema en las condiciones reales.', {
        razones: ['+Porque tiene que funcionar en los celulares y planes reales', '-Porque las apps livianas no pueden registrar datos', '-Porque las organizaciones sociales no usan tecnología'],
        d: 1,
      }),
      det('La cooperativa escribe los requisitos. Marcá lo que conviene corregir.', [ // e7
        ['La app debe funcionar sin conexión.', false],
        ['Aceptamos que solo funcione en celulares nuevos.', true, 'La mayoría usa celulares de más de cuatro años: los dejaría afuera.'],
        ['Los datos se guardarán en un formato abierto para usarlos en otros sistemas.', false],
        ['Los videos tutoriales se reproducirán solos al abrir la app.', true, 'Consume datos y energía sin que nadie lo pida.'],
      ], 'Un buen pliego de requisitos piensa en las personas, sus aparatos y sus datos.', { d: 3 }),
    ]),
  ],
});
