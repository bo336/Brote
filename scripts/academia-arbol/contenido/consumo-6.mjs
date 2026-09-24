import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// CONSUMO 6 — Empresas y cadenas de valor.
// Cómo se mide la huella de una empresa (alcances 1, 2 y 3), qué pasa en las
// cadenas de suministro con las personas y el ambiente, qué hace creíble una
// meta o un reporte empresarial, por qué las calificaciones ESG no coinciden y
// qué otras formas de empresa existen. Retoma la vida de un producto
// (consumo-1), los sellos y el greenwashing (consumo-2), la economía circular
// (consumo-3) y el cero neto y los bonos (aire-suelo-6).

export default unidad({
  slug: 'consumo-6',
  rama: 'consumo',
  orden: 6,
  nivel: 3,
  requiereTronco: 3,
  titulo: 'Empresas y cadenas de valor',
  bajada: 'Alcances de emisiones, fábricas lejanas, debida diligencia, metas corporativas, calificaciones que no coinciden y empresas que se organizan distinto.',
  objetivos: [
    'Clasificar emisiones de una empresa en alcances 1, 2 y 3',
    'Explicar la debida diligencia en derechos humanos y ambiente en las cadenas de suministro',
    'Evaluar la credibilidad de metas y reportes de sostenibilidad empresarial',
    'Interpretar las calificaciones ESG y sus límites',
    'Comparar modelos de empresa: cooperativas, empresas B y compras públicas sostenibles',
  ],
  repasa: ['consumo-1', 'consumo-2', 'consumo-3', 'aire-suelo-6'],
  fuentes: ['ghg-protocol', 'ghg-protocol-alcance3', 'cdp-cadena-2024', 'oit-rana-plaza', 'onu-principios-rectores', 'ocde-debida-diligencia', 'ue-csddd', 'ue-deforestacion', 'issb-s2', 'sbti', 'berg-2022-esg', 'sistema-b', 'aci-principios', 'inaes'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('La huella de una empresa', 'Alcances 1, 2 y 3: dónde están las emisiones de una empresa y por qué casi siempre están afuera.', [
      teoria('Tres alcances', [
        'El Protocolo de Gases de Efecto Invernadero, el estándar más usado en el mundo, divide las emisiones de una empresa en tres alcances. El alcance 1 son las emisiones directas de fuentes que la empresa posee o controla, como sus calderas o sus camiones. El alcance 2 son las emisiones de generar la electricidad, el vapor o el calor que compra. El alcance 3 son todas las demás emisiones indirectas de su cadena de valor: lo que compra a proveedores, el transporte que contrata, los viajes de su personal y también el uso y el descarte de lo que vende.',
      ]),
      clas('¿En qué alcance se cuenta cada emisión de una fábrica de galletitas?', { // e1
        'Alcance 1': ['El gas que quema su horno', 'El combustible de sus propios camiones'],
        'Alcance 2': ['La electricidad que compra a la red', 'El vapor que le compra a una planta vecina'],
        'Alcance 3': ['La harina que produce un molino proveedor', 'Los envases que fabrica otra empresa', 'Los viajes de trabajo de su personal'],
      }, 'Alcance 1 es lo propio, alcance 2 la energía comprada y alcance 3 todo lo demás de la cadena.', { d: 2 }),
      teoria('Casi todo está afuera', [
        'Para la mayoría de las empresas, el alcance 3 es la parte más grande. Según un informe de CDP de 2024, las empresas que le informan sus datos declararon emisiones en su cadena de suministro, en promedio, 26 veces mayores que las de sus propias operaciones (alcances 1 y 2). Aun así, solo el 15 % tenía una meta para el alcance 3.',
      ], { destacado: { valor: '26 veces', texto: 'mayores que las de sus operaciones propias son, en promedio, las emisiones de la cadena de suministro de las empresas que informan a CDP.' } }),
      numv(3, (i) => { // e2
        const [a1, a2, a3] = [[2000, 3000, 45000], [500, 1500, 18000], [10000, 5000, 85000]][i];
        const pct = Math.round(a3 / (a1 + a2 + a3) * 100);
        return {
          enunciado: `Una empresa emite ${a1.toLocaleString('es-AR')} tCO₂e de alcance 1, ${a2.toLocaleString('es-AR')} de alcance 2 y ${a3.toLocaleString('es-AR')} de alcance 3. ¿Qué porcentaje de su huella es alcance 3?`,
          valor: pct,
          unidad: '%',
          tol: 1,
          explicacion: `${a3.toLocaleString('es-AR')} ÷ ${(a1 + a2 + a3).toLocaleString('es-AR')} × 100 ≈ ${pct} %. Una empresa que solo informa sus alcances 1 y 2 muestra una parte chica de su impacto.`,
          ctx: `Alcance 1: ${a1}; alcance 2: ${a2}; alcance 3: ${a3} tCO₂e.`,
        };
      }, { d: 2 }),
      numv(3, (i) => { // e3
        const [op1, veces] = [[4000, 26], [1000, 10], [2500, 26]][i];
        return {
          enunciado: `Las operaciones propias de una empresa (alcances 1 y 2) emiten ${op1.toLocaleString('es-AR')} tCO₂e. Si su cadena de suministro emite ${veces} veces más, ¿cuánto emite la cadena?`,
          valor: op1 * veces,
          unidad: 'tCO₂e',
          explicacion: `${op1.toLocaleString('es-AR')} × ${veces} = ${(op1 * veces).toLocaleString('es-AR')} tCO₂e. Por eso las políticas climáticas de una empresa que ignoran a sus proveedores se quedan cortas.`,
          ctx: `${op1} tCO₂e propias; cadena ${veces} veces mayor.`,
        };
      }, { d: 1 }),
      vf('Si una empresa usa solo electricidad renovable en sus oficinas, ya resolvió su huella de carbono.', false, 'Eso reduce su alcance 2, pero en la mayoría de las empresas el alcance 3 es mucho mayor: lo que compran, transportan y venden.', {
        razones: ['+Porque el alcance 3 suele ser mucho mayor que el 2', '-Porque la electricidad renovable emite más que la fósil', '-Porque las oficinas no consumen electricidad'],
        d: 1,
      }),
      teoria('Arriba y abajo de la cadena', [
        'El alcance 3 tiene dos partes: aguas arriba, lo que pasa antes de la empresa, como la producción de materias primas y el transporte de lo que compra; y aguas abajo, lo que pasa después, como el uso y el descarte de lo que vende. En una marca de ropa, casi todo está aguas arriba, en el cultivo del algodón, el teñido y la costura. En una fábrica de autos o de heladeras, una gran parte está aguas abajo: la energía que consumen sus productos durante años.',
      ]),
      par('Uní cada empresa con dónde suele estar la mayor parte de su huella.', [ // e4
        ['Marca de ropa', 'Aguas arriba: fibras, teñido y confección'],
        ['Fábrica de autos a nafta', 'Aguas abajo: el combustible que queman los autos'],
        ['Cadena de supermercados', 'Aguas arriba: los alimentos que compra'],
        ['Petrolera', 'Aguas abajo: la quema de lo que vende'],
      ], 'Saber dónde está la huella dice dónde tiene que actuar cada empresa.', { d: 3 }),
      cad('Armá la cadena de cómo una empresa puede reducir su alcance 3.', [ // e5
        'Mide las emisiones de sus principales proveedores',
        'Identifica dónde se concentran',
        'Acuerda metas y apoyo técnico con esos proveedores',
        'Los proveedores cambian procesos o energía',
        'Bajan las emisiones de la cadena',
      ], ['Cambia de logo y declara que su cadena es verde'], 'Reducir el alcance 3 exige trabajar con otros, no solo dentro de la empresa.', { d: 2 }),
      op('¿Por qué a las empresas les cuesta más medir el alcance 3?', [ // e6
        'Depende de datos de proveedores y clientes que no controlan',
        'Porque el alcance 3 no existe en el Protocolo de GEI',
        ['Porque está prohibido pedir datos a los proveedores', 'No está prohibido: es justamente lo que se recomienda.'],
        'Porque el alcance 3 siempre es cero en las empresas grandes',
      ], 'Medirlo exige colaboración a lo largo de la cadena y, a veces, estimaciones.', { d: 2 }),
      det('Leé este reporte de sustentabilidad y marcá lo que conviene revisar.', [ // e7
        ['Informamos nuestras emisiones de alcances 1, 2 y 3.', false],
        ['Somos carbono neutrales porque compensamos nuestros alcances 1 y 2.', true, 'Deja afuera el alcance 3, que suele ser la mayor parte.'],
        ['Trabajamos con nuestros 20 principales proveedores para medir sus emisiones.', false],
        ['El transporte que contratamos no cuenta, porque los camiones no son nuestros.', true, 'Cuenta como alcance 3.'],
      ], 'Un reporte serio muestra toda la cadena, no solo lo que queda cómodo.', { d: 2 }),
      comp('Completá.', 'Las emisiones directas de la empresa son el alcance [1]; las de la electricidad comprada, el alcance [2]; y las de la cadena de valor, el alcance [3].', ['0', '4', '5'], 'Los tres alcances para leer cualquier huella empresarial.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Detrás de la etiqueta', 'Rana Plaza, los Principios Rectores de la ONU y la debida diligencia: lo que pasa con las personas en la cadena de suministro.', [
      teoria('Rana Plaza', [
        'El 24 de abril de 2013, en Bangladesh, se derrumbó el edificio Rana Plaza, donde funcionaban fábricas de ropa para marcas de todo el mundo. Murieron más de 1.100 personas y más de 2.000 resultaron heridas. El día anterior se habían detectado grietas, pero se ordenó volver a trabajar. Poco después, sindicatos y más de 80 marcas firmaron un acuerdo para inspeccionar y reparar las fábricas, con la Organización Internacional del Trabajo como presidenta neutral.',
      ]),
      cad('Armá la cadena de cómo la presión por precios bajos puede terminar en tragedia.', [ // e1
        'Las marcas exigen precios cada vez más bajos y entregas rápidas',
        'Los talleres recortan costos donde pueden',
        'Se posponen reparaciones y controles de seguridad',
        'Se ignoran las señales de riesgo en el edificio',
        'Ocurre una tragedia evitable',
      ], ['Los precios bajos mejoran la seguridad de los talleres'], 'Lo que no se paga en la cadena lo terminan pagando las personas más vulnerables.', { d: 2 }),
      teoria('Proteger, respetar, remediar', [
        'En 2011, la ONU aprobó los Principios Rectores sobre las Empresas y los Derechos Humanos. Se apoyan en tres pilares: los Estados deben proteger los derechos humanos; las empresas deben respetarlos, lo que incluye evitar causar daños y hacer "debida diligencia" en sus cadenas; y las personas afectadas deben tener acceso a una reparación.',
        'La OCDE describe la debida diligencia como un proceso: incorporar la conducta responsable en las políticas de la empresa, identificar y evaluar los riesgos en sus operaciones y cadena, detener, prevenir o mitigar los daños, hacer seguimiento, comunicar lo que se hace y reparar cuando corresponda.',
      ]),
      par('Uní cada pilar de los Principios Rectores con su responsable principal.', [ // e2
        ['Proteger', 'Los Estados, con leyes y controles'],
        ['Respetar', 'Las empresas, en sus operaciones y cadenas'],
        ['Remediar', 'Vías de reparación para las personas afectadas'],
      ], 'Los tres pilares funcionan juntos: ninguno reemplaza a los otros.', { d: 2 }),
      ord('Ordená los pasos de la debida diligencia según la OCDE.', [ // e3
        'Incorporar la conducta responsable en las políticas',
        'Identificar y evaluar los riesgos en la cadena',
        'Detener, prevenir o mitigar los daños',
        'Hacer seguimiento de los resultados',
        'Comunicar lo que se hizo y reparar cuando corresponda',
      ], 'Es un proceso continuo, no una auditoría de una sola vez.', { d: 2 }),
      teoria('De lo voluntario a lo obligatorio', [
        'Durante años, la debida diligencia fue voluntaria. En 2024, la Unión Europea aprobó una directiva que obliga a las grandes empresas a identificar y reducir los daños a los derechos humanos y al ambiente en sus cadenas, aunque su aplicación se postergó y su alcance sigue en discusión. La Unión Europea también aprobó un reglamento que exige demostrar que productos como la soja, la carne, el café o el cacao no vienen de tierras deforestadas: eso obliga a rastrear el origen de cada cargamento, también en Argentina.',
      ]),
      op('¿Qué exige el reglamento europeo sobre productos libres de deforestación a un exportador de soja?', [ // e4
        'Demostrar que la soja no viene de tierras deforestadas',
        'Dejar de exportar soja a cualquier país',
        ['Pagar un impuesto por cada tonelada exportada', 'No es un impuesto: es una obligación de trazabilidad.'],
        'Cultivar solo soja orgánica certificada',
      ], 'La trazabilidad del origen se vuelve una condición para vender.', { d: 2 }),
      clas('¿Es una práctica de debida diligencia real o una de fachada?', { // e5
        'Real': ['Visitar talleres sin aviso previo con inspectores independientes', 'Publicar la lista de proveedores', 'Tener un canal de denuncias para trabajadores de la cadena'],
        'De fachada': ['Pedir al proveedor que firme que "todo está bien"', 'Auditar solo una vez y con aviso de un mes', 'Cortar al proveedor sin ayudar a corregir los problemas'],
      }, 'Cortar sin corregir puede dejar a los trabajadores peor: la debida diligencia busca mejorar la cadena.', { d: 3 }),
      num('Si en una cadena de 1.200 talleres se inspecciona el 15 % por año, ¿cuántos talleres se inspeccionan?', 180, 'talleres', '1.200 × 15 % = 180 talleres por año: harían falta casi siete años para pasar por todos, por eso se priorizan los de mayor riesgo.', { ctx: '1.200 talleres; 15 % inspeccionados por año.', d: 1 }),
      vf('Si una marca no es dueña de la fábrica, no tiene ninguna responsabilidad por lo que pasa ahí.', false, 'Según los Principios Rectores, las empresas deben respetar los derechos humanos también en sus cadenas, e identificar y prevenir los daños vinculados a sus operaciones y compras.', {
        razones: ['+Porque debe respetar derechos y hacer debida diligencia en su cadena', '-Porque las fábricas de otros no tienen trabajadores', '-Porque la responsabilidad es solo del consumidor'],
        d: 2,
      }),
      mult('¿Qué puede exigir una persona consumidora a una marca? Marcá todo.', [ // e6
        '+Que publique la lista de sus proveedores',
        '+Que informe cómo controla las condiciones de trabajo',
        '+Que explique qué hace cuando encuentra un problema',
        '+Que muestre el origen de sus materias primas',
        '-Que baje siempre el precio, sin importar cómo',
      ], 'La transparencia de la cadena es la base de cualquier compromiso creíble.', { d: 1 }),
      det('Leé este comunicado de una marca y marcá lo que conviene revisar.', [ // e7
        ['Publicamos la lista completa de nuestros talleres proveedores.', false],
        ['Como no somos dueños de las fábricas, lo que pase allí no es asunto nuestro.', true, 'Las empresas deben hacer debida diligencia en su cadena.'],
        ['Tenemos un canal de denuncias anónimo para trabajadores de los talleres.', false],
        ['Si encontramos un problema, cortamos al taller de inmediato y no hacemos nada más.', true, 'Lo esperado es ayudar a corregir y reparar, no solo cortar.'],
      ], 'Un compromiso serio mira toda la cadena y se hace cargo de lo que encuentra.', { d: 2 }),
      comp('Completá.', 'Los tres pilares de los Principios Rectores son proteger, respetar y [remediar]; identificar y prevenir daños en la cadena es la debida [diligencia]; y el derrumbe de Rana Plaza ocurrió en [Bangladesh].', ['olvidar', 'publicidad', 'Brasil'], 'Tres ideas para mirar lo que hay detrás de una etiqueta.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Metas y reportes creíbles', 'Metas basadas en ciencia, estándares de reporte y cómo distinguir un compromiso de un comunicado.', [
      teoria('Metas basadas en ciencia', [
        'La iniciativa Science Based Targets (SBTi) valida metas de reducción de emisiones de empresas según lo que haría falta para cumplir el Acuerdo de París. Pide metas de corto plazo, incluido el alcance 3 cuando es relevante, y metas de largo plazo de cero neto que se apoyen sobre todo en reducciones propias y no en compensaciones. Como viste con las metas climáticas, las metas intermedias y la calidad de los bonos son clave.',
      ]),
      numv(3, (i) => { // e1
        const [base, pct, anios] = [[100000, 42, 7], [50000, 50, 10], [80000, 30, 6]][i];
        const meta = base * (100 - pct) / 100;
        const anual = Math.round((base - meta) / anios);
        return {
          enunciado: `Una empresa emite ${base.toLocaleString('es-AR')} tCO₂e y se compromete a reducirlas un ${pct} % en ${anios} años. Si baja lo mismo cada año, ¿cuántas tCO₂e tiene que reducir por año? Redondeá al entero.`,
          valor: anual,
          unidad: 'tCO₂e por año',
          tol: 1,
          explicacion: `Meta: ${base.toLocaleString('es-AR')} × ${100 - pct} % = ${meta.toLocaleString('es-AR')}; baja total ${(base - meta).toLocaleString('es-AR')}; ÷ ${anios} ≈ ${anual.toLocaleString('es-AR')} por año. Traducir la meta a un ritmo anual permite controlar si se cumple.`,
          ctx: `${base} tCO₂e; −${pct} % en ${anios} años.`,
        };
      }, { d: 2 }),
      teoria('Reportes con reglas comunes', [
        'Para que los datos de distintas empresas se puedan comparar, hacen falta reglas comunes. En 2023, el Consejo de Normas Internacionales de Sostenibilidad (ISSB) publicó la norma IFRS S2, que pide a las empresas informar sus riesgos climáticos, su estrategia y sus emisiones de alcances 1, 2 y 3. Varios países empezaron a adoptarla. Sin reglas comunes, cada empresa elige qué mostrar.',
      ]),
      op('¿Para qué sirven normas comunes de reporte como la IFRS S2?', [ // e2
        'Para que los datos de distintas empresas se puedan comparar',
        'Para que las empresas no tengan que medir sus emisiones',
        ['Para certificar que una empresa es carbono neutral', 'No certifican neutralidad: ordenan qué y cómo informar.'],
        'Para prohibir que las empresas publiquen sus datos',
      ], 'Datos comparables permiten a inversores, clientes y gobiernos distinguir a quien avanza de verdad.', { d: 2 }),
      clas('¿La característica hace más creíble la meta de una empresa o la debilita?', { // e3
        'Más creíble': ['Incluye el alcance 3', 'Tiene metas intermedias cada pocos años', 'Está validada por un tercero independiente'],
        'La debilita': ['Se cumple sobre todo comprando bonos baratos', 'Solo tiene una meta para 2050', 'No informa el año base ni las emisiones actuales'],
      }, 'Las mismas preguntas que usaste para las metas de los países sirven para las empresas.', { d: 2 }),
      vf('Una empresa que publica un reporte de sustentabilidad largo y con muchas fotos es necesariamente más sustentable.', false, 'Lo que importa son los datos verificables: emisiones de los tres alcances, metas, avances y problemas reconocidos. El diseño no dice nada del desempeño.', {
        razones: ['+Porque importan los datos verificables, no el diseño', '-Porque los reportes cortos siempre mienten', '-Porque las fotos prueban el desempeño ambiental'],
        d: 1,
      }),
      numv(3, (i) => { // e4
        const [base, hoy, anios, meta] = [[100000, 90000, 3, 42], [60000, 57000, 4, 50], [80000, 64000, 2, 40]][i];
        const pct = Math.round((base - hoy) / base * 100);
        return {
          enunciado: `Una empresa emitía ${base.toLocaleString('es-AR')} tCO₂e en su año base y, ${anios} años después, emite ${hoy.toLocaleString('es-AR')}. ¿En qué porcentaje redujo sus emisiones hasta ahora?`,
          valor: pct,
          unidad: '%',
          explicacion: `(${base.toLocaleString('es-AR')} − ${hoy.toLocaleString('es-AR')}) ÷ ${base.toLocaleString('es-AR')} × 100 = ${pct} %. Comparar ese avance con la meta (${meta} %) y con los años que faltan muestra si va en camino.`,
          ctx: `Año base: ${base}; hoy: ${hoy} tCO₂e.`,
        };
      }, { d: 2 }),
      cad('Armá la cadena de cómo un reporte comparable ayuda a reducir emisiones.', [ // e5
        'Las empresas informan con las mismas reglas',
        'Inversores y clientes pueden comparar',
        'Las que avanzan menos quedan expuestas',
        'Aumenta la presión para mejorar',
        'Más empresas fijan y cumplen metas',
      ], ['Los reportes comparables hacen innecesario medir'], 'La transparencia no reduce emisiones por sí sola, pero crea incentivos para hacerlo.', { d: 2 }),
      par('Uní cada herramienta con lo que hace.', [ // e6
        ['Protocolo de GEI', 'Define cómo contar las emisiones'],
        ['SBTi', 'Valida metas alineadas con París'],
        ['IFRS S2', 'Norma para informar riesgos y emisiones'],
        ['CDP', 'Recoge y publica datos ambientales de empresas'],
      ], 'Contar, fijar metas, informar y publicar: cuatro piezas de la rendición de cuentas.', { d: 2 }),
      mult('¿Qué conviene buscar en el reporte de una empresa? Marcá todo.', [ // e7
        '+Emisiones de los tres alcances',
        '+Metas con año base y metas intermedias',
        '+El avance real respecto de esas metas',
        '+Verificación por un tercero independiente',
        '-Solo frases como "comprometidos con el planeta"',
      ], 'Números, metas, avances y verificación: lo demás es comunicación.', { d: 1 }),
      det('Leé este anuncio corporativo y marcá lo que conviene revisar.', [ // e8
        ['Nuestra meta fue validada por la iniciativa Science Based Targets.', false],
        ['Seremos cero neto en 2050; mientras tanto, no fijaremos metas intermedias.', true, 'Sin metas intermedias no hay forma de controlar el avance.'],
        ['Informamos con la norma IFRS S2.', false],
        ['Nuestra meta cubre solo las oficinas, que son el 2 % de nuestras emisiones.', true, 'Deja afuera casi toda la huella.'],
      ], 'Leer metas empresariales es aplicar el mismo ojo crítico que con las metas de los países.', { d: 2 }),
      comp('Completá.', 'La iniciativa que valida metas empresariales alineadas con París es la [SBTi]; la norma de reporte climático publicada en 2023 es la IFRS [S2]; y para seguir el avance hacen falta metas [intermedias].', ['ONU', 'S9', 'secretas'], 'Tres herramientas para evaluar compromisos corporativos.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Calificaciones que no coinciden', 'Qué miden las calificaciones ESG, por qué cambian tanto según quién califica y cómo leerlas.', [
      teoria('ESG', [
        'Las calificaciones ESG evalúan a las empresas en temas ambientales (E), sociales (S) y de gobierno corporativo (G). Las usan inversores para elegir dónde poner su dinero. Pero un estudio publicado en 2022 comparó seis de las calificadoras más conocidas y encontró que coinciden poco: la misma empresa puede estar entre las mejores para una y entre las peores para otra. La mayor parte de la diferencia viene de cómo mide cada una (56 %), después de qué temas incluye (38 %) y, en menor medida, de cuánto pesa cada tema (6 %).',
      ], {
        datos: barras('De dónde viene la diferencia entre calificaciones ESG', '% de la divergencia', [
          ['Cómo se mide', 56],
          ['Qué temas se incluyen', 38],
          ['Cuánto pesa cada tema', 6],
        ], 'Berg, Kölbel y Rigobon (2022).'),
      }),
      est('Estimá qué porcentaje de la diferencia entre calificaciones ESG viene de cómo mide cada calificadora.', 56, { min: 0, max: 100, paso: 1, unidad: '%' }, 'Un 56 %, según el estudio de 2022: más de la mitad de la divergencia es de medición, no de opinión sobre qué importa.', { d: 2 }),
      par('Uní cada letra de ESG con un tema que evalúa.', [ // e1
        ['E (ambiental)', 'Emisiones, agua y residuos'],
        ['S (social)', 'Condiciones de trabajo y comunidades'],
        ['G (gobierno)', 'Transparencia, directorio y anticorrupción'],
      ], 'Tres dimensiones que se evalúan juntas, a veces mezclando cosas muy distintas.', { d: 1 }),
      teoria('¿Riesgo para la empresa o impacto en el mundo?', [
        'Muchas calificaciones ESG miden sobre todo cuánto le pueden afectar los temas ambientales y sociales a la empresa: por ejemplo, si una sequía puede dañar su negocio. Eso se llama materialidad simple. Otra mirada, la doble materialidad, suma también cuánto impacta la empresa en el ambiente y en las personas. Una empresa puede tener "bajo riesgo" para sus inversores y, a la vez, un impacto grande en el mundo.',
      ]),
      clas('¿La pregunta corresponde al riesgo para la empresa o al impacto de la empresa?', { // e2
        'Riesgo para la empresa': ['¿Puede una sequía afectar su producción?', '¿Puede una nueva ley aumentar sus costos?'],
        'Impacto de la empresa': ['¿Cuánto contamina el río donde vuelca sus efluentes?', '¿Cómo afecta a las comunidades cercanas?'],
      }, 'La doble materialidad mira las dos direcciones a la vez.', { d: 2 }),
      op('¿Por qué una misma empresa puede tener calificaciones ESG muy distintas?', [ // e3
        'Porque cada calificadora mide, incluye y pesa temas distinto',
        'Porque las calificadoras siempre se equivocan a propósito',
        ['Porque las empresas cambian todos los días', 'La diferencia aparece aun calificando a la misma empresa el mismo año.'],
        'Porque solo una de las calificadoras usa datos reales',
      ], 'Antes de usar una calificación, conviene saber qué mide y cómo.', { d: 2 }),
      numv(3, (i) => { // e4
        const [a, b] = [[80, 35], [72, 50], [90, 40]][i];
        return {
          enunciado: `Una calificadora le pone ${a} puntos sobre 100 a una empresa y otra le pone ${b}. ¿Cuántos puntos de diferencia hay?`,
          valor: a - b,
          unidad: 'puntos',
          explicacion: `${a} − ${b} = ${a - b} puntos. Con diferencias así, la misma empresa puede entrar o quedar afuera de un fondo "sustentable" según qué calificación se use.`,
          ctx: `Calificación A: ${a}; calificación B: ${b}.`,
        };
      }, { d: 1 }),
      vf('Una calificación ESG alta garantiza que la empresa tiene poco impacto ambiental.', false, 'Muchas calificaciones miden sobre todo el riesgo para la empresa, no su impacto en el mundo. Y distintas calificadoras pueden dar resultados muy distintos.', {
        razones: ['+Porque muchas miden riesgo para la empresa, no impacto', '-Porque las calificaciones ESG no miden nada ambiental', '-Porque todas las calificadoras dan el mismo resultado'],
        d: 2,
      }),
      cad('Armá la cadena de cómo una calificación poco clara puede desviar inversiones.', [ // e5
        'Una calificadora mide sobre todo riesgos para la empresa',
        'Una petrolera bien gestionada obtiene buena nota',
        'Un fondo "sustentable" la incluye por esa nota',
        'Inversores creen que financian algo de bajo impacto',
        'El dinero va a actividades con alto impacto ambiental',
      ], ['La calificación mide el impacto directo en el clima'], 'Por eso importan las etiquetas claras y la doble materialidad.', { d: 3 }),
      mult('Antes de confiar en una calificación ESG, ¿qué conviene preguntar? Marcá todo.', [ // e6
        '+¿Mide riesgo para la empresa, impacto, o ambos?',
        '+¿Qué temas incluye y cuánto pesa cada uno?',
        '+¿De dónde salen los datos?',
        '+¿Qué dicen otras calificadoras de la misma empresa?',
        '-¿Qué color tiene el logo de la calificadora?',
      ], 'Una nota sin su método es un número sin contexto.', { d: 1 }),
      rank('Ordená estas formas de evaluar a una empresa, de la más informativa a la menos.', [ // e7
        ['Datos verificados de emisiones y metas, con doble materialidad', 'la más informativa'],
        ['Varias calificaciones ESG comparadas, con su método', 'buena'],
        ['Una sola calificación ESG, sin saber qué mide', 'débil'],
        ['El eslogan de la empresa', 'la menos informativa'],
      ], 'Cuanto más transparente el método y más directos los datos, mejor la evaluación.', { d: 2, extremos: ['Más informativa', 'Menos informativa'] }),
      det('Leé esta publicidad de un fondo de inversión y marcá lo que conviene revisar.', [ // e8
        ['Informamos qué calificadora usamos y cómo mide.', false],
        ['Nuestras empresas tienen nota ESG alta, así que no contaminan.', true, 'Una nota alta puede reflejar bajo riesgo para la empresa, no bajo impacto.'],
        ['Publicamos las emisiones de las empresas en las que invertimos.', false],
        ['Todas las calificadoras coinciden en nuestras empresas.', true, 'Las calificaciones ESG suelen coincidir poco.'],
      ], 'Los fondos "verdes" también necesitan ser leídos con lupa.', { d: 2 }),
      comp('Completá.', 'Evaluar temas ambientales, sociales y de gobierno es una calificación [ESG]; mirar el riesgo para la empresa y también su impacto es la doble [materialidad]; y la mayor parte de la divergencia entre calificadoras viene de cómo [miden].', ['ISO', 'contabilidad', 'venden'], 'Tres claves para leer las calificaciones de sostenibilidad.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Otras formas de empresa', 'Cooperativas, empresas B, economía social y compras públicas: organizar la producción de otra manera.', [
      teoria('Cooperativas', [
        'Una cooperativa es una empresa de propiedad conjunta de sus integrantes, que la gestionan de forma democrática: en general, una persona, un voto, sin importar cuánto capital aportó. La Alianza Cooperativa Internacional define siete principios: adhesión voluntaria y abierta, gestión democrática, participación económica de los asociados, autonomía, educación e información, cooperación entre cooperativas e interés por la comunidad. En Argentina las regula el Instituto Nacional de Asociativismo y Economía Social (INAES), y son parte importante de servicios como la electricidad en muchos pueblos, del agro y del reciclado.',
      ]),
      numv(3, (i) => { // e1
        const [exc, soc, pct] = [[3000000, 60, 70], [1200000, 40, 50], [5000000, 100, 60]][i];
        const porSocio = exc * pct / 100 / soc;
        return {
          enunciado: `Una cooperativa tiene un excedente de ${exc.toLocaleString('es-AR')} pesos. La asamblea decide repartir el ${pct} % en partes iguales entre sus ${soc} asociados y reinvertir el resto. ¿Cuánto recibe cada asociado?`,
          valor: porSocio,
          unidad: 'pesos',
          explicacion: `${exc.toLocaleString('es-AR')} × ${pct} % = ${(exc * pct / 100).toLocaleString('es-AR')}; ÷ ${soc} = ${porSocio.toLocaleString('es-AR')} pesos. La decisión la toma la asamblea, con un voto por persona.`,
          ctx: `Excedente de ${exc}; ${pct} % repartido entre ${soc}.`,
        };
      }, { d: 2 }),
      par('Uní cada principio cooperativo con un ejemplo.', [ // e2
        ['Gestión democrática', 'Una persona, un voto en la asamblea'],
        ['Adhesión voluntaria y abierta', 'Puede sumarse quien acepte las responsabilidades'],
        ['Educación e información', 'Capacitaciones para asociados y comunidad'],
        ['Interés por la comunidad', 'Apoyar proyectos del pueblo donde funciona'],
      ], 'Los principios distinguen a una cooperativa de una empresa común.', { d: 2 }),
      teoria('Empresas B y economía social', [
        'Las Empresas B son empresas con fines de lucro que se certifican por su impacto social y ambiental y se comprometen a considerar a trabajadores, comunidad y ambiente en sus decisiones. En América Latina las impulsa Sistema B, que nació en 2012 en Argentina, Chile y Colombia. La economía social incluye además mutuales, empresas recuperadas por sus trabajadores y emprendimientos asociativos. Ninguna forma jurídica garantiza por sí sola buenas prácticas, pero cambian quién decide y para qué.',
      ]),
      clas('¿Qué modelo de empresa describe cada caso?', { // e3
        'Cooperativa': ['Los vecinos son dueños de la distribuidora eléctrica del pueblo', 'Recicladores organizados que deciden en asamblea'],
        'Empresa B': ['Una empresa con fines de lucro certificada por su impacto', 'Una marca que cambió su estatuto para considerar al ambiente'],
        'Empresa convencional': ['Una sociedad anónima que decide según el capital de cada accionista', 'Una empresa que solo busca maximizar ganancias'],
      }, 'Quién es dueño y cómo se decide cambia las prioridades de una empresa.', { d: 2 }),
      op('¿Qué distingue a una cooperativa de una sociedad anónima tradicional?', [ // e4
        'Sus integrantes deciden con un voto por persona',
        'Que no puede tener ingresos ni excedentes',
        ['Que no puede tener trabajadores ni clientes', 'Tiene ambos; lo distintivo es la propiedad y el voto.'],
        'Que no paga impuestos en ningún caso',
      ], 'En la cooperativa, el poder de decisión no depende de cuánto capital se aportó.', { d: 2 }),
      teoria('El poder de las compras públicas', [
        'Los gobiernos compran muchísimo: comida para escuelas y hospitales, vehículos, papel, obras. Las compras públicas sostenibles incluyen criterios ambientales y sociales en esas compras, por ejemplo priorizando productos de menor impacto, a cooperativas o a la agricultura familiar. Como el Estado es un comprador enorme, sus criterios pueden mover mercados enteros.',
      ]),
      numv(3, (i) => { // e5
        const [presu, pct] = [[500000000, 30], [200000000, 25], [800000000, 20]][i];
        return {
          enunciado: `Un municipio gasta ${presu.toLocaleString('es-AR')} pesos por año en alimentos para escuelas. Si decide comprar el ${pct} % a cooperativas y productores familiares locales, ¿cuánto dinero se destina a ellos?`,
          valor: presu * pct / 100,
          unidad: 'pesos',
          explicacion: `${presu.toLocaleString('es-AR')} × ${pct} % = ${(presu * pct / 100).toLocaleString('es-AR')} pesos por año que quedan en la economía local. Valores de ejemplo.`,
          ctx: `${presu} pesos; ${pct} % a productores locales.`,
        };
      }, { d: 1 }),
      vf('Una empresa que se declara cooperativa o B tiene garantizado un impacto positivo.', false, 'La forma jurídica cambia quién decide y para qué, pero el impacto real depende de sus prácticas. También hay que medirlas y controlarlas.', {
        razones: ['+Porque el impacto depende de las prácticas, no solo de la forma jurídica', '-Porque las cooperativas no pueden tener impacto', '-Porque las Empresas B no existen'],
        d: 2,
      }),
      mult('¿Qué pueden hacer las personas, además de comprar, para influir en las empresas? Marcá todo.', [ // e6
        '+Participar en cooperativas de su comunidad',
        '+Pedir transparencia sobre la cadena de suministro',
        '+Apoyar compras públicas con criterios sostenibles',
        '+Elegir bancos o fondos que informen su impacto',
        '-Dejar las decisiones solo en manos de la publicidad',
      ], 'Como trabajadores, vecinos, votantes e inversores, las personas tienen más herramientas que la góndola.', { d: 1 }),
      det('Leé este texto sobre economía social y marcá lo que conviene revisar.', [ // e7
        ['En una cooperativa, cada asociado tiene un voto.', false],
        ['En una cooperativa vota más quien aporta más capital.', true, 'En general, una persona, un voto, sin importar el capital.'],
        ['Las compras públicas pueden priorizar a productores locales.', false],
        ['Ser Empresa B garantiza que no hay ningún problema en la cadena.', true, 'La certificación no reemplaza el control de las prácticas.'],
      ], 'Hay muchas formas de organizar la producción; todas se juzgan por lo que hacen.', { d: 2 }),
      comp('Completá.', 'Una empresa de propiedad conjunta y gestión democrática es una [cooperativa]; en Argentina las regula el [INAES]; y las empresas con fines de lucro certificadas por su impacto son las empresas [B].', ['franquicia', 'AFIP', 'Z'], 'Tres modelos para pensar la economía desde otro lugar.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: empresas y cadenas de valor', 'Alcances de emisiones, debida diligencia, metas y reportes, calificaciones ESG y modelos de empresa, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: la marca de ropa y sus talleres', 'Una marca argentina de ropa quiere que su compromiso ambiental y social sea creíble. Revisá sus números y su plan.', [
      teoria('La situación', [
        'La marca emite 300 tCO₂e por año en sus locales y oficinas (alcances 1 y 2). Estima que su cadena de suministro, desde el algodón hasta la costura en 45 talleres externos, emite 7.500 tCO₂e. Hoy dice ser "carbono neutral" porque compensa sus 300 tCO₂e con bonos. Un sindicato denunció jornadas excesivas en algunos talleres. La dirección propone cortar con esos talleres y publicar un reporte con muchas fotos.',
      ]),
      num('¿Qué porcentaje de la huella total de la marca es la cadena de suministro? Redondeá al entero.', 96, '%', '7.500 ÷ (300 + 7.500) × 100 ≈ 96 %: casi toda la huella está fuera de sus locales.', { ctx: '300 tCO₂e propias; 7.500 en la cadena.', tol: 1, d: 2 }),
      num('¿Cuántas veces más emite la cadena que las operaciones propias?', 25, 'veces', '7.500 ÷ 300 = 25 veces, muy cerca del promedio de 26 que informó CDP.', { ctx: '7.500 contra 300 tCO₂e.', d: 1 }),
      op('¿Qué problema tiene la frase "somos carbono neutrales"?', [ // e3
        'Compensa solo el 4 % de su huella y deja afuera la cadena',
        'Que la marca no debería medir sus emisiones',
        ['Que los bonos siempre eliminan toda la huella', 'Además de su calidad, solo cubren sus 300 tCO₂e propias.'],
        'Que las marcas de ropa no emiten gases',
      ], 'Una declaración de neutralidad que ignora el 96 % de la huella es greenwashing.', { d: 2 }),
      ord('Ordená un plan de debida diligencia para los talleres denunciados.', [ // e4
        'Escuchar a los trabajadores y verificar la denuncia en forma independiente',
        'Acordar con los talleres un plan de corrección con plazos',
        'Ajustar precios y plazos de pedido que empujan a jornadas excesivas',
        'Hacer seguimiento con visitas sin aviso',
        'Publicar lo encontrado y lo corregido',
      ], 'Corregir y acompañar suele proteger más a los trabajadores que cortar la relación.', { d: 3 }),
      clas('¿Qué medidas hacen creíble el compromiso y cuáles son de fachada?', { // e5
        'Hacen creíble el compromiso': ['Medir y fijar metas para el alcance 3', 'Publicar la lista de talleres', 'Canal de denuncias para trabajadores de la cadena'],
        'De fachada': ['Un reporte con muchas fotos y pocos datos', 'Declararse "neutral" compensando solo lo propio', 'Cortar talleres sin investigar ni corregir'],
      }, 'La credibilidad viene de datos, metas, transparencia y reparación.', { d: 2 }),
      vf('Cortar la relación con los talleres denunciados es siempre la mejor forma de proteger a sus trabajadores.', false, 'Cortar sin corregir puede dejar a esas personas sin trabajo y trasladar el problema a otra marca. La debida diligencia busca corregir, reparar y cambiar las prácticas de compra que generan el problema.', {
        razones: ['+Porque puede dejar sin trabajo a las personas y no corrige el problema', '-Porque los talleres nunca tienen problemas', '-Porque la marca no puede hablar con sus proveedores'],
        d: 2,
      }),
      det('La marca redacta su nuevo compromiso. Marcá lo que conviene corregir.', [ // e7
        ['Mediremos las emisiones de nuestros 45 talleres y proveedores de tela.', false],
        ['Seguiremos diciendo que somos carbono neutrales mientras compensemos nuestras oficinas.', true, 'Deja afuera el 96 % de la huella: es una afirmación engañosa.'],
        ['Revisaremos nuestros precios y plazos para que no empujen a jornadas excesivas.', false],
        ['Nuestro reporte no incluirá datos, solo historias inspiradoras.', true, 'Sin datos verificables, el reporte no permite evaluar nada.'],
      ], 'Un compromiso creíble se hace cargo de toda la cadena, con números y con personas.', { d: 3 }),
    ]),
  ],
});
