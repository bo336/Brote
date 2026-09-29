import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// CONSUMO 2 — Etiquetas, sellos y greenwashing.
// Cómo leer lo que dice un producto: etiquetas obligatorias, el etiquetado
// frontal de alimentos, los sellos ambientales, el lavado verde y las
// palabras que confunden. Retoma la ciencia que distingue datos de
// afirmaciones (ciencia-1 si ya la hiciste) y el ciclo de vida (consumo-1).

export default unidad({
  slug: 'consumo-2',
  rama: 'consumo',
  orden: 2,
  nivel: 1,
  requiereTronco: 1,
  titulo: 'Etiquetas, sellos y greenwashing',
  bajada: '"Eco", "natural", "verde", "biodegradable": qué dicen de verdad las etiquetas, qué sellos valen y cómo reconocer el lavado verde.',
  objetivos: [
    'Leer la información obligatoria y el etiquetado frontal de los alimentos',
    'Distinguir certificaciones independientes de autodeclaraciones',
    'Reconocer las formas más comunes de greenwashing',
    'Interpretar correctamente términos como biodegradable, compostable y reciclable',
    'Evaluar un producto completo con una lista de preguntas',
  ],
  repasa: ['consumo-1', 'tronco-3'],
  fuentes: ['ley-27642-etiquetado', 'ce-green-claims', 'senasa-organicos', 'unep-plasticos', 'ellen-macarthur'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Lo que dicen las etiquetas', 'Información obligatoria, ingredientes y el etiquetado frontal de alimentos en Argentina.', [
      teoria('Lo obligatorio', [
        'Los productos tienen información obligatoria: qué son, quién los fabrica, el contenido neto, la fecha de vencimiento y, en los alimentos, la lista de ingredientes (ordenados de mayor a menor cantidad) y la información nutricional.',
        'Esa información está regulada y controlada. Otra cosa son las frases de marketing del frente del envase, que muchas veces no tienen controles tan estrictos.',
      ]),
      op('En la lista de ingredientes de un alimento, ¿qué indica el orden?', [ // e1
        'De mayor a menor cantidad',
        'De más sano a menos sano',
        ['El orden en que se agregan en la fábrica', 'La norma pide ordenarlos por cantidad, no por el proceso.'],
        'Por orden alfabético',
      ], 'Si el azúcar aparece primero, es el ingrediente principal. Leer los primeros ingredientes dice mucho.', { d: 1 }),
      teoria('El etiquetado frontal', [
        'En Argentina, la Ley 27.642 de Promoción de la Alimentación Saludable estableció sellos negros con forma de octógono en el frente de los alimentos y bebidas que superan ciertos límites: "exceso en azúcares", "exceso en sodio", "exceso en grasas saturadas", "exceso en grasas totales" y "exceso en calorías". También leyendas de advertencia cuando contienen edulcorantes o cafeína, no recomendables para chicos.',
        'Los sellos permiten comparar productos de un vistazo. Cuantos menos sellos, en general, mejor perfil nutricional.',
      ], { lista: ['Exceso en azúcares', 'Exceso en sodio', 'Exceso en grasas saturadas', 'Exceso en grasas totales', 'Exceso en calorías'] }),
      mult('¿Cuáles de estos son sellos del etiquetado frontal argentino? Marcá todos.', [ // e2
        '+Exceso en azúcares',
        '+Exceso en sodio',
        '+Exceso en grasas saturadas',
        '+Exceso en calorías',
        '-Exceso en vitaminas',
      ], 'Los sellos advierten sobre nutrientes críticos para la salud. Las vitaminas no tienen sello de exceso.', { d: 1 }),
      clas('¿Esta información es obligatoria y controlada o es marketing del envase?', { // e3
        'Obligatoria': ['Lista de ingredientes', 'Fecha de vencimiento', 'Sellos de advertencia'],
        'Marketing': ['"Receta de la abuela"', '"El sabor de siempre"', 'Dibujo de una granja feliz'],
      }, 'Lo obligatorio informa; el marketing seduce. Conviene leer primero lo obligatorio.', { d: 1 }),
      numv(3, (i) => { // e4
        const sellos = [[3, 1], [2, 0], [4, 2]][i];
        return {
          enunciado: `Un cereal tiene ${sellos[0]} sellos de advertencia y otro ${sellos[1]}. ¿Cuántos sellos de diferencia hay?`,
          valor: sellos[0] - sellos[1],
          unidad: 'sellos',
          explicacion: `${sellos[0]} − ${sellos[1]} = ${sellos[0] - sellos[1]}. Comparar sellos entre productos parecidos es una forma rápida de elegir el de mejor perfil.`,
        };
      }, { d: 1 }),
      vf('Un producto sin sellos de advertencia es siempre el más saludable de la góndola.', false, 'Los sellos advierten excesos de ciertos nutrientes, pero no evalúan todo. Un producto sin sellos puede igual ser ultraprocesado o poco nutritivo; conviene mirar también los ingredientes.', { // e5
        razones: ['+Porque los sellos no evalúan todas las características del alimento', '-Porque los productos sin sellos tienen más azúcar', '-Porque los sellos son solo decoración'],
        d: 2,
      }),
      cad('Armá la cadena de cómo el etiquetado frontal cambia lo que se vende.', [ // e6
        'Los productos con exceso de nutrientes críticos llevan sellos',
        'Los compradores los identifican de un vistazo',
        'Muchos eligen opciones con menos sellos',
        'Algunas empresas reformulan sus productos para evitar sellos',
      ], ['Los sellos obligan a cada persona a comer sano'], 'Como la etiqueta de eficiencia energética: no obliga a nadie, pero cambia lo que se elige y lo que se fabrica.', { d: 2 }),
      par('Uní cada dato de la etiqueta con lo que te dice.', [ // e7
        ['Primer ingrediente de la lista', 'El ingrediente principal'],
        ['Octógono negro', 'Exceso de un nutriente crítico'],
        ['Fecha de vencimiento', 'Hasta cuándo es seguro consumirlo'],
        ['Contenido neto', 'Cuánto producto trae el envase'],
      ], 'Cuatro datos que conviene mirar antes que las fotos del envase.', { d: 1 }),
      det('Leé este análisis de un yogur y marcá lo equivocado.', [ // e8
        ['Tiene un sello de exceso en azúcares.', false],
        ['El envase dice "natural", así que no puede tener azúcar agregada.', true, '"Natural" no es una garantía: hay que leer los ingredientes.'],
        ['El primer ingrediente es leche.', false],
        ['Como tiene una vaca dibujada, es el más saludable.', true, 'El dibujo es marketing; lo que informa es la etiqueta.'],
      ], 'Leer primero lo obligatorio, y desconfiar del marketing.', { d: 2 }),
      comp('Completá.', 'Los ingredientes se ordenan de mayor a menor [cantidad]; los sellos negros de la Ley 27.642 tienen forma de [octógono].', ['precio', 'círculo'], 'Dos claves para leer un alimento en segundos.', { d: 1 }),
      rank('Ordená estos cereales de mejor a peor perfil según sus sellos.', [ // e10
        ['Avena sin sellos', 'ningún sello'],
        ['Copos con un sello de exceso en sodio', 'un sello'],
        ['Copos azucarados con dos sellos', 'dos sellos'],
        ['Cereal de colores con cuatro sellos', 'cuatro sellos'],
      ], 'Menos sellos, en general, mejor perfil. Es una primera comparación rápida.', { d: 1, extremos: ['Mejor perfil', 'Peor perfil'] }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Sellos ambientales', 'Certificaciones independientes, sellos de la propia marca y cómo saber cuál vale.', [
      teoria('Quién certifica', [
        'Un sello ambiental dice que un producto cumple ciertas condiciones. Lo importante es quién lo dice. Hay tres tipos: las certificaciones de tercera parte, otorgadas por un organismo independiente que audita con normas públicas; las autodeclaraciones, en las que la propia empresa afirma algo sobre su producto; y los sellos inventados, que parecen certificaciones pero no tienen respaldo.',
        'Las certificaciones de tercera parte son las más confiables porque alguien ajeno a la empresa verifica que se cumpla.',
      ]),
      clas('¿Es una certificación independiente o una autodeclaración?', { // e1
        'Certificación independiente': ['Sello de producto orgánico certificado', 'Sello de manejo forestal responsable (FSC) en un papel', 'Etiqueta oficial de eficiencia energética'],
        'Autodeclaración': ['"Amigable con el planeta" escrito por la marca', 'Una hojita verde diseñada por la empresa', '"Hecho con conciencia"'],
      }, 'Una certificación tiene detrás una norma pública y alguien que audita. Una autodeclaración, solo la palabra de la empresa.', { d: 2 }),
      teoria('Algunos sellos conocidos', [
        'El sello FSC en papel y madera indica que proviene de bosques manejados según ciertas normas ambientales y sociales. Los productos orgánicos certificados en Argentina los controla el SENASA a través de certificadoras autorizadas, y pueden llevar el sello "Orgánico Argentina". La etiqueta de eficiencia energética, que viste en la rama de Energía, es obligatoria para muchos aparatos. El sello de Comercio Justo indica condiciones de pago y trabajo para productores.',
      ]),
      par('Uní cada sello con lo que certifica.', [ // e2
        ['FSC', 'Madera y papel de bosques bien manejados'],
        ['Orgánico Argentina', 'Producción orgánica controlada por el SENASA'],
        ['Etiqueta de eficiencia energética', 'Consumo de energía de un aparato'],
        ['Comercio Justo', 'Condiciones justas para productores'],
      ], 'Cada sello certifica algo concreto. Ninguno certifica que un producto sea "bueno para el planeta" en todo.', { d: 2 }),
      vf('Un producto con un sello orgánico certificado no tiene ningún impacto ambiental.', false, 'Certifica cómo se produjo (sin ciertos agroquímicos, por ejemplo), pero igual usa tierra, agua, energía y envases. Ningún sello significa impacto cero.', { // e3
        razones: ['+Porque certifica una forma de producción, no impacto cero', '-Porque lo orgánico no usa tierra', '-Porque los sellos garantizan que el producto no tiene huella'],
        d: 2,
      }),
      teoria('Cómo verificar un sello', [
        'Para saber si un sello vale, conviene preguntarse: ¿quién lo otorga?, ¿es independiente de la empresa?, ¿las normas son públicas?, ¿se puede verificar en la página del organismo que el producto está certificado?, ¿qué aspecto certifica exactamente?',
        'Si el sello no tiene nombre de organismo, no remite a ninguna norma o solo dice palabras vagas, probablemente sea marketing.',
      ]),
      mult('¿Qué preguntas ayudan a saber si un sello es confiable? Marcá todas.', [ // e4
        '+¿Quién lo otorga?',
        '+¿Es independiente de la empresa?',
        '+¿Sus normas son públicas?',
        '+¿Se puede verificar el producto en la página del organismo?',
        '-¿Es de color verde?',
      ], 'El color verde no certifica nada. La independencia y la transparencia, sí.', { d: 1 }),
      ord('Ordená los pasos para verificar un sello desconocido.', [ // e5
        'Leer el nombre del organismo que lo otorga',
        'Buscar la página oficial de ese organismo',
        'Revisar qué norma certifica',
        'Verificar si el producto figura como certificado',
      ], 'Cuatro pasos que llevan pocos minutos y separan sellos reales de dibujos.', { d: 2, extremos: ['Primero', 'Último'] }),
      op('Un detergente tiene un dibujo de una hoja con la frase "eco-friendly" y ningún organismo nombrado. ¿Qué es lo más probable?', [ // e6
        'Que sea una autodeclaración de marketing',
        'Que esté certificado por un organismo internacional',
        ['Que sea obligatorio por ley ponerlo', 'No hay ninguna ley que exija ese dibujo: es una decisión de la marca.'],
        'Que el producto sea biodegradable al 100 %',
      ], 'Sin organismo ni norma, un dibujo verde es solo diseño.', { d: 2 }),
      cad('Armá la cadena de cómo funciona una certificación de tercera parte.', [ // e7
        'Una organización independiente publica una norma',
        'La empresa pide ser auditada',
        'Un auditor verifica que cumpla la norma',
        'Si cumple, puede usar el sello',
        'Se hacen auditorías periódicas para mantenerlo',
      ], ['La empresa diseña el sello y se lo pone sola'], 'Independencia, norma pública y controles periódicos: lo que da valor a un sello.', { d: 2 }),
      vf('Un sello que dice "certificado" siempre fue otorgado por un organismo independiente.', false, 'Cualquiera puede escribir "certificado" en un envase. Hay que ver quién lo otorga y si se puede verificar.', {
        razones: ['+Porque la palabra sola no dice quién certificó', '-Porque la palabra "certificado" está prohibida', '-Porque todos los sellos son oficiales'],
        d: 2,
      }),
      rank('Ordená estos sellos del más confiable al menos confiable.', [
        ['Certificación de tercera parte con norma pública y registro verificable', 'muy confiable'],
        ['Certificación de tercera parte sin registro online', 'confiable'],
        ['Autodeclaración con datos concretos', 'poco confiable'],
        ['Dibujo verde sin organismo ni datos', 'nada confiable'],
      ], 'Independencia, norma pública y posibilidad de verificar: los tres pilares de un sello confiable.', { d: 2, extremos: ['Más confiable', 'Menos confiable'] }),
      det('Leé esta descripción de un envase y marcá lo que no es una certificación real.', [ // e8
        ['Sello FSC con número de licencia verificable.', false],
        ['Hojita verde con la frase "producto responsable".', true, 'Es una autodeclaración sin organismo ni norma.'],
        ['Etiqueta de eficiencia energética clase A.', false],
        ['"Certificado por nuestro equipo de sustentabilidad".', true, 'Si lo certifica la propia empresa, no es independiente.'],
      ], 'Quien certifica importa tanto como lo que certifica.', { d: 2 }),
      comp('Completá.', 'Las certificaciones de tercera [parte] son otorgadas por organismos [independientes]; cuando lo dice la propia marca, es una [autodeclaración].', ['página', 'empresariales', 'ley'], 'Los tres tipos de sellos ambientales, resumidos en una línea.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('El lavado verde', 'Frases vagas, datos escondidos y comparaciones tramposas: las formas más comunes de greenwashing.', [
      teoria('Qué es el greenwashing', [
        'El greenwashing, o lavado verde, es presentar un producto, un servicio o una empresa como más amigable con el ambiente de lo que realmente es. Es muy común: un estudio de la Comisión Europea encontró que más de la mitad de las afirmaciones ambientales analizadas en productos eran vagas, engañosas o sin fundamento.',
        'Por eso varios países están regulando estas afirmaciones y exigiendo pruebas.',
      ], { destacado: { valor: '> 50 %', texto: 'de las afirmaciones ambientales analizadas por la Comisión Europea eran vagas, engañosas o sin fundamento.' } }),
      est('Estimá qué porcentaje de las afirmaciones ambientales analizadas por la Comisión Europea resultaron vagas, engañosas o sin fundamento.', 53, { min: 0, max: 100, paso: 1, unidad: '%' }, 'Alrededor del 53 %. Más de la mitad: por eso conviene leer con ojo crítico.', { d: 3 }),
      teoria('Las trampas más comunes', [
        'Algunas formas típicas: palabras vagas sin significado concreto ("natural", "eco", "verde"); destacar un aspecto chico y esconder los grandes (una botella con 10 % de plástico reciclado de una bebida en envase descartable); afirmaciones sin pruebas; datos irrelevantes ("sin CFC", cuando están prohibidos hace décadas); sellos inventados; y comparaciones engañosas ("el menos contaminante de su categoría" en una categoría muy contaminante).',
      ]),
      par('Uní cada ejemplo con la trampa que usa.', [ // e1
        ['"100 % natural" sin explicar nada', 'Palabra vaga'],
        ['"Sin CFC" en un aerosol actual', 'Dato irrelevante: están prohibidos'],
        ['"El SUV más eficiente de su clase"', 'Comparación dentro de una categoría de alto impacto'],
        ['Envase con 10 % de plástico reciclado presentado como solución', 'Destacar lo chico y esconder lo grande'],
      ], 'Reconocer la trampa es el primer paso para no caer en ella.', { d: 3 }),
      vf('Un aerosol que dice "sin CFC" es mejor para el ambiente que los demás aerosoles del mercado.', false, 'Los CFC están prohibidos por el Protocolo de Montreal: ningún aerosol actual los tiene. Es un dato cierto pero irrelevante, que se usa para parecer mejor.', { // e2
        razones: ['+Porque los CFC están prohibidos y ningún aerosol actual los tiene', '-Porque los CFC son buenos para la capa de ozono', '-Porque todos los aerosoles actuales tienen CFC'],
        d: 3,
      }),
      clas('¿Es una afirmación concreta y verificable o vaga?', { // e3
        'Concreta y verificable': ['Envase con 50 % de plástico reciclado certificado', 'Consume 180 kWh por año según la etiqueta oficial', 'Madera con certificación FSC número verificable'],
        'Vaga': ['Amigable con el planeta', 'Pensado para el futuro', 'Producto consciente'],
      }, 'Una afirmación útil dice qué, cuánto y quién lo verifica.', { d: 2 }),
      cad('Armá la cadena de cómo funciona el greenwashing.', [ // e4
        'Una empresa destaca un aspecto verde menor de su producto',
        'Los compradores creen que el producto es sustentable',
        'Lo eligen por sobre alternativas realmente mejores',
        'Las alternativas mejores venden menos',
        'Se frena el cambio hacia productos de menor impacto',
      ], ['El greenwashing hace que los productos sean más verdes'], 'El greenwashing no solo engaña: desvía la demanda de lo que realmente sirve.', { d: 3 }),
      op('Una aerolínea dice que sus vuelos son "carbono neutrales" porque planta árboles. ¿Qué conviene preguntar?', [ // e5
        '¿Cuánto compensa y con qué garantías?',
        '¿De qué color son los asientos de sus aviones?',
        ['¿Por qué no plantan más árboles?', 'Más árboles no resuelve las dudas: hay que saber si las compensaciones son reales y duraderas.'],
        '¿Cuántos pasajeros tiene cada vuelo?',
      ], 'Las compensaciones pueden ser reales o dudosas: árboles que se queman, que se iban a plantar igual o que tardan décadas en absorber lo emitido.', { d: 3 }),
      mult('¿Qué señales indican posible greenwashing? Marcá todas.', [ // e6
        '+Palabras vagas como "eco" o "natural" sin datos',
        '+Sellos sin organismo ni norma',
        '+Destacar un detalle verde y esconder el impacto principal',
        '+Afirmaciones sin pruebas verificables',
        '-Datos concretos con fuente independiente',
      ], 'Los datos concretos con fuente son lo contrario del greenwashing.', { d: 1 }),
      det('Leé esta publicidad y marcá lo que es greenwashing.', [ // e7
        ['Nuestra botella usa un 30 % de plástico reciclado, certificado.', false],
        ['Somos una marca 100 % comprometida con el planeta.', true, 'Frase vaga sin datos que la respalden.'],
        ['El envase se puede reciclar donde hay recolección de PET.', false],
        ['Nuestra bebida es ecológica porque la tapa es verde.', true, 'El color de la tapa no cambia el impacto del producto.'],
      ], 'Lo concreto informa; lo vago, en cambio, solo vende.', { d: 2 }),
      comp('Completá.', 'Presentar algo como más verde de lo que es se llama [greenwashing]; una afirmación útil es concreta y [verificable].', ['reciclaje', 'emotiva'], 'La idea central de la lección, en una línea.', { d: 1 }),
      rank('Ordená estas afirmaciones de la más confiable a la menos.', [ // e10
        ['Dato con certificación independiente verificable', 'muy confiable'],
        ['Dato concreto sin certificación, con la metodología publicada', 'algo confiable'],
        ['Frase vaga con un dibujo de hojas', 'poco confiable'],
        ['Sello inventado que imita a uno oficial', 'engañosa'],
      ], 'La confianza crece con la concreción y la independencia de quien verifica.', { d: 2, extremos: ['Más confiable', 'Menos confiable'] }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Palabras que confunden', 'Biodegradable, compostable, reciclable, reciclado y "degradable": qué significa cada una de verdad.', [
      teoria('Reciclable y reciclado', [
        '"Reciclable" significa que el material se podría reciclar, si hay un sistema que lo recoja y un mercado que lo compre. "Reciclado" significa que el producto está hecho, en parte o en todo, con material que ya fue reciclado. Son cosas distintas: un envase puede ser reciclable y terminar en el relleno, y un producto puede tener contenido reciclado sin ser reciclable después.',
        'El símbolo de las tres flechas en círculo no garantiza nada por sí solo; hay que ver qué dice al lado.',
      ]),
      par('Uní cada término con su significado.', [ // e1
        ['Reciclable', 'Se podría reciclar si hay sistema y mercado'],
        ['Reciclado', 'Está hecho con material ya reciclado'],
        ['Contenido reciclado 30 %', 'Un 30 % del material viene de reciclaje'],
      ], 'Dos palabras que se parecen mucho y dicen cosas muy distintas.', { d: 2 }),
      teoria('Biodegradable y compostable', [
        '"Biodegradable" significa que microorganismos pueden descomponer el material, pero no dice en cuánto tiempo ni en qué condiciones: casi todo se biodegrada en algún momento. Por eso la palabra sola dice poco.',
        '"Compostable" es más preciso: el material se descompone en condiciones de compostaje en un tiempo determinado, según una norma. Pero muchos productos compostables necesitan compostaje industrial, con temperaturas altas: en una compostera casera o en el relleno pueden durar mucho.',
      ]),
      vf('Un plástico "biodegradable" desaparece en pocas semanas en cualquier lugar.', false, 'Depende de las condiciones: temperatura, humedad, microorganismos. En el mar, en un relleno o en una compostera casera puede durar muchísimo.', { // e2
        razones: ['+Porque se degrada solo en ciertas condiciones y tiempos', '-Porque lo biodegradable no se degrada nunca', '-Porque todo plástico desaparece en semanas'],
        d: 2,
      }),
      teoria('Los "oxodegradables"', [
        'Los plásticos "oxodegradables" u "oxobiodegradables" tienen aditivos que los hacen romperse en pedazos cada vez más chicos. No desaparecen: se convierten en microplásticos. Por eso la Unión Europea los prohibió en 2021, y muchos especialistas los consideran peores que el plástico común.',
      ]),
      cad('Armá la cadena de qué le pasa a una bolsa oxodegradable tirada en el campo.', [ // e3
        'La bolsa se expone al sol y al aire',
        'Los aditivos hacen que se fragmente',
        'Se rompe en pedazos cada vez más chicos',
        'Quedan microplásticos en el suelo y el agua',
      ], ['La bolsa se convierte en abono para las plantas'], 'Romperse no es desaparecer. Los microplásticos son más difíciles de recoger que la bolsa entera.', { d: 2 }),
      clas('¿Qué dice realmente cada etiqueta?', { // e4
        'Dice algo concreto': ['Compostable industrialmente según norma', 'Contenido reciclado 50 % certificado', 'Reciclable donde se recolecta PET'],
        'Dice poco o confunde': ['Biodegradable, sin más datos', 'Oxodegradable', 'Degradable'],
      }, 'Las etiquetas útiles dicen en qué condiciones y con qué norma.', { d: 2 }),
      op('Comprás vasos "compostables" para un cumpleaños. ¿Qué conviene hacer con ellos después?', [ // e5
        'Averiguar si hay compostaje industrial que los reciba',
        'Tirarlos en la calle porque se degradan solos',
        ['Ponerlos en los reciclables con el plástico', 'Pueden contaminar el reciclaje de plástico, porque son otro material.'],
        'Enterrarlos en una maceta del balcón',
      ], 'Sin el sistema adecuado, un compostable termina como cualquier residuo. Lo mejor, muchas veces, es usar vajilla lavable.', { d: 3 }),
      mult('¿Cuáles de estas afirmaciones son correctas? Marcá todas.', [ // e6
        '+"Reciclable" no garantiza que se recicle',
        '+Muchos compostables necesitan compostaje industrial',
        '+Los oxodegradables se convierten en microplásticos',
        '+"Biodegradable" sin condiciones dice poco',
        '-"Degradable" significa que desaparece sin dejar rastro',
      ], 'Cada palabra tiene letra chica. Leerla es no dejarse engañar.', { d: 3 }),
      rank('Ordená estas opciones para vasos de un evento, de menor a mayor impacto.', [ // e7
        ['Vasos lavables que se reutilizan', 'menor impacto'],
        ['Vasos compostables llevados a compostaje industrial', 'bajo'],
        ['Vasos de plástico reciclable separados para reciclar', 'medio'],
        ['Vasos oxodegradables tirados en cualquier lado', 'mayor impacto'],
      ], 'La jerarquía otra vez: reutilizar le gana a cualquier descartable, por verde que parezca.', { d: 3, extremos: ['Menor impacto', 'Mayor impacto'] }),
      op('Un envase tiene el símbolo de tres flechas en círculo. ¿Qué garantiza por sí solo?', [
        'Nada concreto: hay que leer qué dice al lado',
        'Que el envase se va a reciclar seguro',
        ['Que el envase está hecho 100 % de material reciclado', 'El símbolo solo no dice cuánto material reciclado tiene ni si se reciclará.'],
        'Que se puede tirar en cualquier tacho',
      ], 'El símbolo se usa de muchas formas. La información útil es la que lo acompaña: material, porcentaje, dónde se recicla.', { d: 2 }),
      numv(3, (i) => {
        const total = [20, 30, 50][i];
        const pct = [30, 50, 25][i];
        return {
          enunciado: `Un envase pesa ${total} g y tiene ${pct} % de contenido reciclado. ¿Cuántos gramos de material reciclado tiene?`,
          valor: (total * pct) / 100,
          unidad: 'g',
          dec: 1,
          explicacion: `${total} × ${pct} ÷ 100 = ${((total * pct) / 100).toLocaleString('es-AR')} g reciclados; los otros ${(total - (total * pct) / 100).toLocaleString('es-AR')} g son material nuevo.`,
        };
      }, { d: 1 }),
      det('Leé este envase y marcá lo que confunde o engaña.', [ // e8
        ['Bolsa hecha con 40 % de plástico reciclado.', false],
        ['Oxobiodegradable: desaparece sin dejar rastro.', true, 'Se fragmenta en microplásticos: no desaparece.'],
        ['Reciclable en los puntos verdes que aceptan polietileno.', false],
        ['Biodegradable, ideal para tirar en la naturaleza.', true, 'Ningún envase debe tirarse en la naturaleza; y "biodegradable" no dice en qué condiciones.'],
      ], 'Las palabras verdes pueden esconder problemas. La letra chica importa.', { d: 3 }),
      comp('Completá.', 'Un envase [reciclable] se podría reciclar; uno [reciclado] ya tiene material recuperado; y los plásticos oxodegradables se vuelven [microplásticos].', ['compostable', 'nuevo', 'abono'], 'Tres términos que conviene no confundir.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Leer un producto completo', 'Una lista de preguntas para evaluar cualquier producto sin caer en el marketing.', [
      teoria('Una lista para la góndola', [
        'Con lo que viste en la rama se puede armar una lista breve para evaluar un producto: ¿lo necesito?, ¿qué dice la información obligatoria?, ¿los sellos son independientes?, ¿las afirmaciones ambientales son concretas y verificables?, ¿dónde está el mayor impacto de este producto?, ¿cuánto va a durar?, ¿qué pasa con el envase y el producto al final?',
        'No hace falta responder todo cada vez. Con la práctica, se vuelve automático.',
      ], { lista: ['¿Lo necesito?', '¿Qué dice lo obligatorio?', '¿Los sellos son independientes?', '¿Las afirmaciones son verificables?', '¿Dónde está el mayor impacto?', '¿Cuánto dura?', '¿Qué pasa al final?'] }),
      ord('Ordená las preguntas de la lista en el orden más útil.', [ // e1
        '¿Lo necesito?',
        '¿Qué dice la información obligatoria?',
        '¿Los sellos y afirmaciones son confiables?',
        '¿Cuánto va a durar?',
        '¿Qué pasa con el producto y el envase al final?',
      ], 'Primero la necesidad; después la información real; al final, la vida útil y el destino.', { d: 2, extremos: ['Primero', 'Último'] }),
      teoria('Elegir por impacto, también en la góndola', [
        'No todas las decisiones de compra pesan igual. Elegir un detergente con envase de recarga ayuda; elegir qué comemos, qué aparato compramos o si viajamos en avión pesa mucho más. Conviene poner la atención donde el impacto es mayor, como viste en el tronco.',
      ]),
      clas('¿Esta decisión de compra suele tener un impacto grande o chico?', { // e2
        'Grande': ['Comprar un auto', 'Elegir la heladera', 'Cuánta carne vacuna comprar por semana'],
        'Chico': ['Elegir entre dos marcas de birome', 'El color de la bolsa de residuos', 'La marca de fósforos'],
      }, 'Revisar con cuidado las decisiones grandes rinde mucho más que obsesionarse con las chicas.', { d: 2 }),
      mult('¿Qué conviene revisar antes de comprar un electrodoméstico grande? Marcá todo.', [ // e3
        '+La etiqueta de eficiencia energética',
        '+La garantía y los repuestos',
        '+El consumo anual en kWh',
        '+Si hay servicio técnico cerca',
        '-El color de la caja',
      ], 'En los aparatos grandes, eficiencia y durabilidad son las claves.', { d: 1 }),
      numv(3, (i) => { // e4
        const a = [2, 3, 1][i];
        const b = [5, 4, 3][i];
        return {
          enunciado: `Un detergente concentrado rinde ${b} lavados por cada ${a} que rinde uno común, con el mismo envase. ¿Cuántas veces menos envases hacen falta con el concentrado? Redondeá a un decimal.`,
          valor: Math.round((b / a) * 10) / 10,
          unidad: 'veces',
          dec: 1,
          explicacion: `${b} ÷ ${a} ≈ ${(Math.round((b / a) * 10) / 10).toLocaleString('es-AR')} veces menos envases para la misma cantidad de lavados. Concentrar es reducir.`,
        };
      }, { d: 2 }),
      op('Dos lavandinas: una en botella común, otra con sello "eco" de la marca y el doble de precio. ¿Qué conviene mirar para decidir?', [ // e5
        'Qué certifica el sello y quién lo otorga',
        'Cuál tiene la botella más linda',
        ['Comprar la más cara, porque es mejor', 'El precio no garantiza un menor impacto.'],
        'Cuál tiene más veces la palabra "eco"',
      ], 'Un sello de la propia marca no es una certificación. Antes de pagar el doble, conviene verificar.', { d: 2 }),
      cad('Armá la cadena de cómo un consumidor informado presiona a las empresas.', [ // e6
        'Más personas leen etiquetas y verifican sellos',
        'Las frases vagas dejan de convencer',
        'Las empresas necesitan datos y certificaciones reales',
        'Mejoran sus productos o su información',
      ], ['Las empresas dejan de vender productos'], 'La información es una palanca: cambia lo que se exige y lo que se ofrece.', { d: 2 }),
      vf('Si un producto es más caro y dice "verde", seguro tiene menor impacto.', false, 'El precio y la palabra "verde" no garantizan nada. Hay que ver qué afirma, quién lo verifica y dónde está el impacto real.', { // e7
        razones: ['+Porque ni el precio ni la palabra verde garantizan menor impacto', '-Porque los productos caros siempre contaminan más', '-Porque la palabra verde está prohibida'],
        d: 1,
      }),
      det('Leé esta decisión de compra y marcá los errores.', [ // e8
        ['Antes de comprar, me pregunté si lo necesitaba.', false],
        ['Elegí el que tenía una hojita verde, aunque no dice quién lo certifica.', true, 'Sin organismo ni norma, la hojita es marketing.'],
        ['Revisé la etiqueta de eficiencia del lavarropas.', false],
        ['Compré vasos biodegradables para tirarlos en la plaza sin culpa.', true, 'Ningún descartable debe tirarse en el espacio público, y "biodegradable" no dice en qué condiciones.'],
      ], 'Aplicar la lista evita los errores más comunes.', { d: 2 }),
      comp('Completá.', 'Antes de comprar, la primera pregunta es si lo [necesito]; conviene poner más atención en las decisiones de mayor [impacto].', ['quiero', 'precio'], 'La lista de preguntas, resumida en sus dos ideas clave.', { d: 1 }),
      par('Uní cada producto con la pregunta más importante para evaluarlo.', [ // e10
        ['Heladera', '¿Cuánto consume por año?'],
        ['Remera', '¿Cuántas veces la voy a usar?'],
        ['Detergente con sello verde', '¿Quién certifica el sello?'],
        ['Vasos compostables', '¿Hay compostaje que los reciba?'],
      ], 'Cada producto tiene su pregunta clave según dónde está su impacto.', { d: 3 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: etiquetas, sellos y greenwashing', 'Etiquetas, sellos, lavado verde, palabras engañosas y evaluación de productos, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: la góndola de limpieza', 'Tres productos de limpieza compiten en la góndola con promesas verdes. Analizalos y elegí con fundamento.', [
      teoria('Los tres productos', [
        'Producto A: detergente común, botella de 750 ml, sin afirmaciones ambientales, rinde 30 lavados. Producto B: botella de 750 ml con una hoja verde, la frase "eco-friendly, amigable con el planeta" y "envase oxobiodegradable"; rinde 30 lavados y cuesta el doble. Producto C: detergente concentrado en envase de recarga de 500 ml, con 50 % de plástico reciclado certificado y un sello de una certificadora independiente con norma pública; rinde 60 lavados.',
      ]),
      mult('¿Qué problemas tiene el producto B? Marcá todos.', [ // e1
        '+Usa frases vagas sin datos',
        '+La hoja verde no tiene organismo que la respalde',
        '+El envase oxobiodegradable se fragmenta en microplásticos',
        '+Cuesta el doble sin beneficio verificable',
        '-Rinde el doble que los demás',
      ], 'B reúne varias trampas: vaguedad, sello inventado y un envase que empeora el problema.', { d: 3 }),
      num('¿Cuántos ml de envase hacen falta por lavado con el producto A (750 ml, 30 lavados)?', 25, 'ml por lavado', '750 ÷ 30 = 25 ml de envase por cada lavado que rinde.', { ctx: 'Producto A: 750 ml, rinde 30 lavados.', d: 2 }),
      numv(3, (i) => { // e3
        const env = [500, 400, 600][i];
        const lav = [60, 50, 80][i];
        return {
          enunciado: `El producto C viene en ${env} ml y rinde ${lav} lavados. ¿Cuántos ml de envase por lavado usa? Redondeá a un decimal.`,
          valor: Math.round((env / lav) * 10) / 10,
          unidad: 'ml por lavado',
          dec: 1,
          tol: 0.1,
          explicacion: `${env} ÷ ${lav} ≈ ${(Math.round((env / lav) * 10) / 10).toLocaleString('es-AR')} ml por lavado, contra 25 del producto A: bastante menos envase por uso, y además con material reciclado.`,
        };
      }, { d: 2 }),
      rank('Ordená los productos de mejor a peor opción ambiental, con la información disponible.', [ // e4
        ['Producto C', 'concentrado, recarga, reciclado certificado'],
        ['Producto A', 'sin afirmaciones, pero sin trampas'],
        ['Producto B', 'lavado verde y envase oxobiodegradable'],
      ], 'El producto sin afirmaciones es mejor que el que engaña. El que tiene datos concretos y certificados, el mejor.', { d: 3, extremos: ['Mejor', 'Peor'] }),
      op('¿Por qué el producto A queda mejor que el B, aunque no diga nada verde?', [ // e5
        'Porque B engaña y su envase se fragmenta',
        'Porque A es más caro que el producto B',
        ['Porque A tiene un dibujo más lindo en la botella', 'El dibujo no importa: lo que importa es qué hace y qué promete cada uno.'],
        'Porque no decir nada es siempre lo más verde',
      ], 'No hacer afirmaciones es mejor que hacer afirmaciones falsas. Y el envase de B es un problema real.', { d: 3 }),
      clas('Clasificá la información de los envases.', { // e6
        'Verificable': ['50 % de plástico reciclado certificado', 'Sello de certificadora independiente con norma pública', 'Rinde 60 lavados'],
        'No verificable o engañosa': ['Eco-friendly', 'Amigable con el planeta', 'Envase oxobiodegradable que "desaparece"'],
      }, 'Los datos concretos y certificados se pueden comprobar; las frases vagas, no.', { d: 2 }),
      det('Una amiga te explica su elección. Marcá lo equivocado.', [ // e7
        ['Elegí el concentrado en recarga porque usa menos envase por lavado.', false],
        ['El de la hojita verde debe ser bueno porque es más caro.', true, 'El precio no certifica nada: la hojita no tiene respaldo.'],
        ['El sello del C lo da una certificadora independiente con norma pública.', false],
        ['El envase oxobiodegradable es el mejor porque desaparece.', true, 'Se fragmenta en microplásticos: no desaparece.'],
      ], 'Elegir con fundamento es separar lo verificable de lo vendedor.', { d: 3 }),
    ]),
  ],
});
