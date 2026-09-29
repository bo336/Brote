import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// CONSUMO 3 — Economía circular.
// Del modelo lineal al circular, los dos ciclos del diagrama de la mariposa,
// el ecodiseño y el derecho a reparar, los modelos de negocio de usar sin
// poseer, y los límites de la circularidad junto con quienes hoy la hacen
// posible. Retoma la vida de un producto (consumo-1), la escalera de los
// residuos (residuos-2) y el compost (residuos-3).

export default unidad({
  slug: 'consumo-3',
  rama: 'consumo',
  orden: 3,
  nivel: 2,
  requiereTronco: 2,
  titulo: 'Economía circular',
  bajada: 'Diseñar sin residuos, mantener las cosas en uso y regenerar la naturaleza: qué es la economía circular, qué la hace posible y dónde están sus límites.',
  objetivos: [
    'Contrastar el modelo lineal con los principios de la economía circular',
    'Distinguir el ciclo técnico del biológico y explicar por qué los ciclos internos valen más',
    'Reconocer estrategias de ecodiseño y el derecho a reparar',
    'Analizar modelos de negocio que venden uso en lugar de productos',
    'Identificar los límites de la circularidad y el papel de los recuperadores urbanos',
  ],
  repasa: ['consumo-1', 'residuos-2', 'residuos-3', 'consumo-2'],
  fuentes: ['ellen-macarthur', 'emf-mariposa', 'circularity-gap-2025', 'ue-ecodiseno', 'ue-derecho-reparar', 'faccyr', 'rep-envases', 'emf-textiles'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('De la línea al círculo', 'Extraer, fabricar, usar y tirar: por qué el modelo lineal no cierra, y los tres principios de la alternativa.', [
      teoria('El modelo lineal', [
        'La mayor parte de la economía funciona en línea: se extraen materiales, se fabrican productos, se usan un tiempo y se tiran. Según el Informe sobre la Brecha de Circularidad de 2025, el mundo ya usa más de 100.000 millones de toneladas de materiales por año, y solo el 6,9 % de lo que entra a la economía proviene de materiales recuperados. En 2018, ese porcentaje era del 9,1 %: aunque se recicla más, el consumo total crece todavía más rápido.',
      ], { destacado: { valor: '6,9 %', texto: 'de los materiales que usa la economía mundial provienen de materiales recuperados, según el Informe sobre la Brecha de Circularidad 2025.' } }),
      est('Estimá qué porcentaje de los materiales que usa la economía mundial proviene de materiales recuperados.', 6.9, { min: 0, max: 100, paso: 0.5, unidad: '%' }, 'Apenas un 6,9 %, según el informe de 2025. La economía sigue siendo casi completamente lineal.', { d: 2 }),
      op('Si se recicla cada vez más, ¿por qué bajó el porcentaje de circularidad desde 2018?', [ // e2
        'Porque el consumo total de materiales creció más rápido',
        'Porque se dejó de reciclar en todo el mundo',
        ['Porque los materiales reciclados no se cuentan', 'Se cuentan; el problema es que el total creció más.'],
        'Porque se inventaron materiales imposibles de usar',
      ], 'Un porcentaje puede bajar aunque su numerador suba, si el total crece más. Lo viste con porcentajes y tasas.', { d: 3 }),
      numv(3, (i) => { // e3
        const [total, rec] = [[100, 6.9], [80, 8], [120, 6]][i];
        return {
          enunciado: `Si una economía usa ${total} mil millones de toneladas de materiales y ${rec.toLocaleString('es-AR')} mil millones son recuperados, ¿qué porcentaje es circular? Redondeá a un decimal.`,
          valor: Math.round((rec / total) * 1000) / 10,
          unidad: '%',
          dec: 1,
          tol: 0.1,
          explicacion: `${rec.toLocaleString('es-AR')} ÷ ${total} × 100 ≈ ${(Math.round((rec / total) * 1000) / 10).toLocaleString('es-AR')} %. Para subir ese número hay que recuperar más y también usar menos en total.`,
          ctx: `${rec} de ${total} mil millones de toneladas recuperados.`,
        };
      }, { d: 2 }),
      teoria('Tres principios', [
        'La Fundación Ellen MacArthur resume la economía circular en tres principios. Eliminar los residuos y la contaminación desde el diseño: que no existan, en lugar de gestionarlos después. Mantener los productos y materiales en uso, a su mayor valor posible. Y regenerar la naturaleza: devolver nutrientes al suelo y no solo "dañar menos".',
        'No es lo mismo que reciclar más: el reciclaje es una parte, y no la primera.',
      ], { lista: ['1 · Eliminar residuos y contaminación desde el diseño', '2 · Mantener productos y materiales en uso, a su mayor valor', '3 · Regenerar la naturaleza'] }),
      clas('¿Qué principio aplica cada acción?', { // e4
        'Eliminar desde el diseño': ['Un envase que no hace falta porque el producto se vende a granel', 'Un producto sin sustancias tóxicas que impidan reciclarlo'],
        'Mantener en uso': ['Reparar una heladera en lugar de tirarla', 'Vender ropa de segunda mano'],
        'Regenerar': ['Compostar restos de comida y volver al suelo', 'Cultivar con prácticas que recuperan el suelo'],
      }, 'Los tres principios se complementan: diseñar bien, usar mucho y devolver a la naturaleza.', { d: 2 }),
      vf('Economía circular es lo mismo que reciclar más.', false, 'El reciclaje es solo una parte, y no la más valiosa. Antes vienen eliminar residuos desde el diseño, reusar, reparar y compartir.', { // e5
        razones: ['+Porque reciclar es solo una parte, y no la primera', '-Porque la economía circular prohíbe reciclar', '-Porque reciclar no tiene ningún valor'],
        d: 1,
      }),
      cad('Armá el recorrido de un producto en el modelo lineal.', [ // e6
        'Se extraen materias primas',
        'Se fabrica el producto',
        'Se usa por un tiempo corto',
        'Se tira',
        'Termina enterrado, quemado o en la naturaleza',
      ], ['Vuelve automáticamente a la fábrica'], 'En la línea, el valor del producto y de sus materiales se pierde al final.', { d: 1 }),
      par('Uní cada concepto con su descripción.', [ // e7
        ['Modelo lineal', 'Extraer, fabricar, usar y tirar'],
        ['Economía circular', 'Mantener materiales en uso y regenerar'],
        ['Tasa de circularidad', 'Porcentaje de materiales recuperados'],
        ['Diseño sin residuos', 'Que el residuo no llegue a existir'],
      ], 'Cuatro conceptos para hablar de circularidad con precisión.', { d: 1 }),
      mult('¿Qué acciones son parte de la economía circular? Marcá todas.', [ // e8
        '+Diseñar productos fáciles de reparar',
        '+Alquilar herramientas en lugar de comprarlas',
        '+Compostar restos orgánicos',
        '-Comprar más cosas porque se pueden reciclar',
        '-Fabricar productos imposibles de abrir',
      ], 'Que algo sea reciclable no justifica consumir más: el primer objetivo es usar menos materiales.', { d: 2 }),
      op('¿Qué significa mantener los materiales "a su mayor valor"?', [ // e8b
        'Preferir usarlos como producto antes que fundirlos',
        'Venderlos siempre al precio más alto posible',
        ['Guardarlos sin usar para que no se gasten', 'Un objeto guardado sin uso no aporta valor.'],
        'Reciclarlos lo antes posible',
      ], 'Un celular que funciona vale mucho más que los gramos de metal que se recuperan al reciclarlo.', { d: 2 }),
      det('Leé esta nota y marcá lo equivocado.', [ // e9
        ['La economía mundial usa más de 100.000 millones de toneladas de materiales por año.', false],
        ['Más de la mitad de los materiales del mundo ya son reciclados.', true, 'Solo el 6,9 % proviene de materiales recuperados.'],
        ['Uno de los principios es regenerar la naturaleza.', false],
        ['Si todo fuera reciclable, podríamos consumir sin límite.', true, 'Reciclar pierde material y energía; usar menos sigue siendo clave.'],
      ], 'La circularidad empieza por el diseño y por consumir menos, no por el tacho.', { d: 2 }),
      comp('Completá.', 'El modelo de extraer, fabricar, usar y tirar es [lineal]; según el informe de 2025, la economía mundial es circular en un [6,9] %; y el tercer principio es [regenerar] la naturaleza.', ['circular', '69', 'ignorar'], 'Las ideas de partida de la economía circular.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Los dos ciclos', 'El diagrama de la mariposa: materiales técnicos que se mantienen en uso y materiales biológicos que vuelven al suelo.', [
      teoria('Técnico y biológico', [
        'El "diagrama de la mariposa" de la Fundación Ellen MacArthur muestra dos ciclos. En el ciclo biológico circulan materiales que pueden volver de forma segura a la naturaleza, como la comida, la madera sin tratar o el algodón: se aprovechan en cascada y al final se compostan o se digieren para devolver nutrientes al suelo. En el ciclo técnico circulan materiales que no se deben devolver a la naturaleza, como metales y plásticos: el objetivo es mantenerlos en uso el mayor tiempo posible.',
      ]),
      clas('¿Este material pertenece al ciclo técnico o al biológico?', { // e1
        'Ciclo biológico': ['Restos de comida', 'Hojas y ramas de poda', 'Madera sin tratar'],
        'Ciclo técnico': ['Aluminio de una lata', 'Plástico de una carcasa', 'Cobre de un cable'],
      }, 'Mezclar los dos ciclos, por ejemplo con plásticos en el compost, arruina a ambos.', { d: 1 }),
      teoria('Los ciclos internos valen más', [
        'En el ciclo técnico, las estrategias forman círculos de adentro hacia afuera. Los círculos más internos conservan más valor y usan menos energía: mantener y hacer durar, compartir, reutilizar y redistribuir, reacondicionar y remanufacturar, y por último reciclar. Reciclar un celular recupera algunos metales; repararlo conserva el aparato entero, con toda la energía y el trabajo que tiene incorporados.',
      ]),
      ord('Ordená las estrategias del ciclo técnico, de la que conserva más valor a la que conserva menos.', [ // e2
        'Mantener y hacer durar',
        'Compartir',
        'Reutilizar y redistribuir',
        'Reacondicionar y remanufacturar',
        'Reciclar',
      ], 'Cuanto más cerca del usuario se cierra el ciclo, más valor se conserva.', { d: 2, extremos: ['Más valor', 'Menos valor'] }),
      op('¿Por qué reparar un celular es mejor que reciclarlo?', [ // e3
        'Conserva el aparato con toda su energía incorporada',
        'Porque el reciclaje de celulares está prohibido',
        ['Porque reparar no usa ningún recurso', 'Usa algunos, pero muchos menos que fabricar uno nuevo.'],
        'Porque los celulares no tienen metales',
      ], 'Lo viste con los aparatos: la mayor parte de la huella está en fabricarlos.', { d: 2 }),
      teoria('Reacondicionar y remanufacturar', [
        'Reacondicionar es revisar, limpiar y arreglar un producto usado para volver a venderlo, como los celulares reacondicionados con garantía. Remanufacturar va más allá: se desarma el producto, se reemplazan las piezas gastadas y se vuelve a armar con calidad de nuevo, como se hace con motores, cajas de cambio o cartuchos de impresora.',
      ]),
      par('Uní cada estrategia con su ejemplo.', [ // e4
        ['Mantener', 'Cambiar la batería de una notebook'],
        ['Compartir', 'Una biblioteca de herramientas del barrio'],
        ['Reacondicionar', 'Un celular revisado y vendido con garantía'],
        ['Remanufacturar', 'Un motor desarmado y rearmado con piezas nuevas'],
        ['Reciclar', 'Fundir latas para hacer aluminio nuevo'],
      ], 'Cada estrategia tiene su lugar; conviene preferir las internas cuando son posibles.', { d: 2 }),
      teoria('El ciclo biológico en cascada', [
        'En el ciclo biológico también hay un orden: primero se aprovecha el material para su uso de mayor valor, y luego en usos de menor valor, en cascada. Por ejemplo, la comida que sobra en un comercio puede donarse para personas; lo que no sirve para personas, para alimento animal; y lo que queda, para compost o biogás. Lo viste en la unidad de la comida que se tira.',
      ]),
      ord('Ordená la cascada de aprovechamiento de alimentos que sobran en un supermercado.', [ // e5
        'Donarlos a personas si son aptos',
        'Usarlos como alimento animal',
        'Digerirlos para producir biogás',
        'Compostarlos para devolver nutrientes al suelo',
      ], 'Primero el uso de mayor valor, y al final volver al suelo.', { d: 2, extremos: ['Mayor valor', 'Menor valor'] }),
      numv(3, (i) => { // e6
        const [nuevo, rep] = [[80, 10], [120, 15], [60, 12]][i];
        return {
          enunciado: `Fabricar un celular nuevo emite unos ${nuevo} kg de CO₂e. Repararlo, con repuesto y transporte, unos ${rep} kg. ¿Cuántos kg se evitan al repararlo?`,
          valor: nuevo - rep,
          unidad: 'kg de CO₂e',
          explicacion: `${nuevo} − ${rep} = ${nuevo - rep} kg de CO₂e evitados. Valores aproximados para practicar: la reparación casi siempre evita la mayor parte.`,
          ctx: `${nuevo} kg nuevo; ${rep} kg reparado.`,
        };
      }, { d: 1 }),
      vf('Un producto hecho con una mezcla de algodón y plástico pegados es fácil de circular.', false, 'Los materiales mezclados de forma inseparable no pueden volver ni al ciclo técnico ni al biológico. Por eso el diseño busca materiales puros o separables.', { // e7
        razones: ['+Porque los materiales mezclados no pueden volver a ningún ciclo', '-Porque el algodón y el plástico son el mismo material', '-Porque todo lo mezclado se composta'],
        d: 3,
      }),
      vf('En el ciclo biológico, lo primero que conviene hacer con la comida que sobra es compostarla.', false, 'Primero va el uso de mayor valor: si es apta, alimentar a personas; después, a animales; y recién al final, biogás o compost.', { // e7b
        razones: ['+Porque antes vienen usos de mayor valor, como alimentar personas', '-Porque la comida nunca se composta', '-Porque el compost no devuelve nutrientes'],
        d: 2,
      }),
      det('Leé esta explicación y marcá lo equivocado.', [ // e8
        ['Los restos de comida pertenecen al ciclo biológico.', false],
        ['Reciclar conserva más valor que reparar.', true, 'Reparar es un ciclo más interno y conserva más valor.'],
        ['Una biblioteca de herramientas es una forma de compartir.', false],
        ['Los metales deben devolverse a la naturaleza al final de su vida.', true, 'Pertenecen al ciclo técnico: deben mantenerse en uso.'],
      ], 'Los dos ciclos tienen reglas distintas, y no conviene mezclarlos.', { d: 2 }),
      comp('Completá.', 'Los materiales que vuelven al suelo forman el ciclo [biológico]; los metales y plásticos, el ciclo [técnico]; y las estrategias más [internas] conservan más valor.', ['químico', 'natural', 'externas'], 'Las ideas clave del diagrama de la mariposa.', { d: 1 }),
      mult('¿Qué estrategias del ciclo técnico son más valiosas que reciclar? Marcá todas.', [ // e10
        '+Reparar',
        '+Reacondicionar',
        '+Compartir',
        '-Enterrar en un relleno',
        '-Quemar sin recuperar energía',
      ], 'Enterrar o quemar son salidas del ciclo, no estrategias circulares.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Diseñar para cerrar el ciclo', 'Ecodiseño, piezas estándar, materiales separables y el derecho a reparar.', [
      teoria('El diseño decide', [
        'Se estima que la mayor parte del impacto ambiental de un producto queda definida en la etapa de diseño: qué materiales usa, cuánto dura, si se puede abrir, reparar, actualizar y desarmar. El ecodiseño busca que desde el primer boceto el producto sea durable, reparable y fácil de separar en materiales puros al final de su vida.',
      ]),
      mult('¿Qué características de diseño facilitan la circularidad? Marcá todas.', [ // e1
        '+Tornillos en lugar de pegamento',
        '+Piezas y cargadores estándar',
        '+Materiales puros y fáciles de separar',
        '+Manuales y repuestos disponibles',
        '-Baterías soldadas imposibles de cambiar',
      ], 'Un producto que no se puede abrir no se puede reparar ni reciclar bien.', { d: 1 }),
      teoria('El derecho a reparar', [
        'En 2024, la Unión Europea aprobó normas sobre el derecho a reparar: los fabricantes de ciertos productos, como lavarropas, heladeras o celulares, deben ofrecer reparación a precios razonables también después de la garantía, y si un producto se repara dentro de la garantía, esta se extiende. También aprobó un reglamento de ecodiseño que fija requisitos de durabilidad y reparabilidad, crea un pasaporte digital de productos y prohíbe destruir ropa y calzado sin vender.',
      ]),
      par('Uní cada medida con lo que busca.', [ // e2
        ['Derecho a reparar', 'Que reparar sea posible y razonable'],
        ['Pasaporte digital de productos', 'Información sobre materiales y reparación'],
        ['Prohibir destruir ropa sin vender', 'Que no se tire lo que nunca se usó'],
        ['Requisitos de durabilidad', 'Que los productos duren más'],
      ], 'Las reglas cambian lo que conviene fabricar.', { d: 2 }),
      op('¿Por qué las normas de ecodiseño son más efectivas que pedir a cada persona que repare sus cosas?', [ // e3
        'Cambian cómo se fabrican millones de productos',
        'Porque las personas no saben reparar nada',
        ['Porque reparar está prohibido para las personas', 'No lo está; las normas facilitan que sea posible.'],
        'Porque las normas eliminan la necesidad de reparar',
      ], 'Lo viste en el tronco: lo individual importa, pero los sistemas deciden qué es fácil y qué es difícil.', { d: 2 }),
      teoria('Obsolescencia', [
        'La obsolescencia es cuando un producto deja de servir o de ser deseado antes de lo necesario. Puede ser técnica (una pieza falla y no hay repuesto), por software (el aparato deja de recibir actualizaciones), o percibida (la moda o la publicidad hacen que parezca viejo). El ecodiseño y las normas atacan las dos primeras; la tercera depende también de nuestras decisiones.',
      ]),
      clas('¿Qué tipo de obsolescencia es cada caso?', { // e4
        'Técnica': ['La batería falla y no se consiguen repuestos', 'Una pieza plástica interna se rompe fácilmente'],
        'Por software': ['El celular deja de recibir actualizaciones', 'Una aplicación esencial deja de funcionar en el modelo'],
        'Percibida': ['Cambiar el celular porque salió un color nuevo', 'Sentir que la ropa de la temporada pasada "ya no va"'],
      }, 'Cada tipo de obsolescencia tiene respuestas distintas: técnicas, legales o personales.', { d: 2 }),
      numv(3, (i) => { // e5
        const [precio, anos, precio2, anos2] = [[300, 3, 450, 6], [200, 2, 320, 5], [500, 4, 700, 8]][i];
        return {
          enunciado: `Un producto cuesta ${precio} mil pesos y dura ${anos} años; otro, más reparable, cuesta ${precio2} mil y dura ${anos2}. ¿Cuántos miles de pesos por año cuesta el más durable?`,
          valor: precio2 / anos2,
          unidad: 'miles de pesos por año',
          explicacion: `${precio2} ÷ ${anos2} = ${(precio2 / anos2).toLocaleString('es-AR')} mil por año, contra ${(precio / anos).toLocaleString('es-AR')} mil del otro. El más caro al comprar resulta más barato por año de uso.`,
          ctx: `${precio} mil por ${anos} años contra ${precio2} mil por ${anos2} años.`,
        };
      }, { d: 2 }),
      cad('Armá la cadena de cómo un diseño modular alarga la vida de una notebook.', [ // e6
        'La notebook tiene memoria y batería reemplazables',
        'Cuando la batería se gasta, se cambia solo esa pieza',
        'Cuando se necesita más memoria, se agrega',
        'El equipo sigue sirviendo varios años más',
        'Se evita fabricar una notebook nueva',
      ], ['La notebook se vuelve obsoleta más rápido por tener piezas'], 'Lo modular convierte una falla en un repuesto, no en un aparato nuevo.', { d: 2 }),
      vf('Un producto más barato siempre es la opción más económica.', false, 'Si dura mucho menos o no se puede reparar, el costo por año de uso puede ser mayor. Conviene mirar el costo durante toda la vida del producto.', { // e7
        razones: ['+Porque importa el costo por año de uso, no solo el precio', '-Porque los productos caros duran siempre para siempre', '-Porque el precio no importa nunca'],
        d: 2,
      }),
      det('Leé esta publicidad de un celular y marcá lo que va contra la circularidad.', [ // e8
        ['Batería reemplazable por el usuario.', false],
        ['Carcasa sellada con pegamento para que sea más fina.', true, 'Dificulta la reparación y el reciclaje.'],
        ['Siete años de actualizaciones de software.', false],
        ['Cargador con conector exclusivo de la marca.', true, 'Los conectores estándar evitan cargadores duplicados.'],
      ], 'Muchas decisiones de diseño se ven en la publicidad: conviene leerlas con ojo circular.', { d: 2 }),
      rank('Ordená estos productos de más a menos circular por su diseño.', [ // e9
        ['Modular, con repuestos y manual público', 'muy circular'],
        ['Atornillado, con repuestos solo del servicio oficial', 'bastante'],
        ['Pegado, reparable solo con herramientas especiales', 'poco'],
        ['Sellado, con materiales mezclados imposibles de separar', 'nada'],
      ], 'El acceso a repuestos e información es tan importante como la forma física.', { d: 2, extremos: ['Más circular', 'Menos circular'] }),
      comp('Completá.', 'Diseñar pensando en el ambiente desde el principio es [ecodiseño]; cuando un producto deja de recibir actualizaciones hablamos de obsolescencia por [software]; y las normas europeas de 2024 impulsan el derecho a [reparar].', ['rediseño', 'moda', 'reclamar'], 'Tres conceptos para evaluar el diseño de un producto.', { d: 1 }),
      op('Tu lavarropas se rompe al cuarto año. ¿Qué pregunta conviene hacer primero?', [ // e11
        '¿Se consigue el repuesto y cuánto cuesta la reparación?',
        '¿Cuál es el modelo más nuevo y con más funciones?',
        ['¿Se puede reciclar el lavarropas viejo?', 'Importa, pero después de ver si se puede reparar.'],
        '¿Qué color combina mejor con la cocina?',
      ], 'Primero reparar; si no se puede, recién ahí reemplazar y reciclar lo viejo.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Usar sin poseer', 'Alquilar, compartir, suscribirse al servicio y no al producto: modelos que cambian los incentivos de quien fabrica.', [
      teoria('Vender el servicio', [
        'En el modelo tradicional, a una empresa le conviene vender muchos productos, aunque duren poco. En los modelos de producto como servicio, la empresa conserva la propiedad y cobra por el uso: iluminación por horas de luz, lavarropas por lavados, neumáticos por kilómetro. Así, le conviene que el producto dure, consuma poco y se pueda reparar y remanufacturar, porque los costos de reemplazarlo son suyos.',
      ]),
      cad('Armá la cadena de por qué el producto como servicio incentiva la durabilidad.', [ // e1
        'La empresa conserva la propiedad del producto',
        'Cobra por el uso, no por la venta',
        'Si el producto se rompe, la reparación la paga ella',
        'Le conviene fabricarlo durable y reparable',
        'Se fabrican menos productos para el mismo servicio',
      ], ['La empresa gana más si el producto se rompe pronto'], 'Cambiar quién es dueño cambia qué conviene fabricar.', { d: 3 }),
      clas('¿Es un modelo de venta tradicional o de uso?', { // e2
        'Venta tradicional': ['Comprar un taladro que usarás 15 minutos en su vida', 'Comprar un auto que pasa casi todo el día estacionado'],
        'Modelo de uso': ['Alquilar un taladro por un día', 'Suscribirse a un servicio de iluminación pagado por horas de luz', 'Usar bicicletas públicas compartidas'],
      }, 'Muchos objetos se usan poquísimo: compartirlos multiplica su uso real.', { d: 1 }),
      teoria('Compartir y segunda mano', [
        'Compartir, alquilar y comprar de segunda mano aumentan las veces que se usa cada objeto. Una biblioteca de herramientas en un barrio puede reemplazar decenas de taladros que pasan casi toda su vida guardados. Los mercados de ropa, muebles y electrónica usados alargan la vida de los productos. La recarga (comprar el producto y reusar el envase) evita fabricar envases nuevos.',
      ]),
      numv(3, (i) => { // e3
        const [hogares, usos] = [[40, 4], [60, 3], [30, 6]][i];
        return {
          enunciado: `En un barrio, ${hogares} hogares usan un taladro unas ${usos} veces por año cada uno. Si comparten 2 taladros en una biblioteca de herramientas, ¿cuántas veces por año se usa cada taladro?`,
          valor: (hogares * usos) / 2,
          unidad: 'usos por año',
          explicacion: `${hogares} × ${usos} = ${hogares * usos} usos repartidos en 2 taladros: ${(hogares * usos) / 2} usos cada uno. En lugar de ${hogares} taladros casi sin usar, 2 bien aprovechados.`,
          ctx: `${hogares} hogares; ${usos} usos por hogar; 2 taladros.`,
        };
      }, { d: 2 }),
      op('¿Qué objeto conviene más compartir que comprar?', [ // e4
        'Una escalera que se usa dos veces al año',
        'El cepillo de dientes de cada persona',
        ['El celular que usás todo el día', 'Se usa demasiado para compartirlo; conviene hacerlo durar.'],
        'La ropa interior de cada persona',
      ], 'Los objetos de uso ocasional son los mejores candidatos para compartir.', { d: 1 }),
      teoria('Cuidado con el rebote', [
        'Estos modelos no siempre reducen el impacto. Si compartir hace algo tan barato que se usa mucho más, o si el alquiler implica muchos traslados en auto para buscar y devolver, parte del beneficio se pierde. Y si la ropa alquilada se envía y se lava en seco después de cada uso, su huella puede ser mayor que la de una prenda propia usada muchas veces.',
      ]),
      vf('Alquilar ropa siempre tiene menos impacto que comprarla.', false, 'Depende: los envíos y lavados frecuentes pueden sumar mucho. Una prenda propia usada durante años suele tener menos impacto que una alquilada que viaja y se lava tras cada uso.', { // e5
        razones: ['+Porque los envíos y lavados pueden sumar mucho impacto', '-Porque alquilar es siempre peor', '-Porque la ropa alquilada no se lava'],
        d: 3,
      }),
      par('Uní cada modelo con su ejemplo.', [ // e6
        ['Producto como servicio', 'Pagar por horas de luz en lugar de comprar lámparas'],
        ['Compartir', 'Bicicletas públicas'],
        ['Segunda mano', 'Feria de ropa usada'],
        ['Recarga', 'Llenar el mismo envase de detergente'],
      ], 'Distintas formas de obtener el servicio que necesitamos con menos materiales.', { d: 1 }),
      op('Una empresa alquila bicicletas por mes y se encarga de repararlas. ¿Por qué le conviene que duren mucho?', [ // e6b
        'Porque cada bici nueva que compra es un costo suyo',
        'Porque así puede cobrar más caro el alquiler',
        ['Porque las bicis viejas se venden más caras', 'El punto es que reemplazarlas le cuesta a la empresa.'],
        'Porque la ley la obliga a no comprar bicis',
      ], 'En el modelo de uso, la durabilidad deja de ser un costo para la empresa y pasa a ser su ganancia.', { d: 2 }),
      rank('Ordená estas opciones para tener un taladro de uso ocasional, de menor a mayor impacto.', [ // e7
        ['Pedirlo prestado a un vecino', 'mínimo'],
        ['Usar la biblioteca de herramientas del barrio', 'bajo'],
        ['Comprar uno usado', 'medio'],
        ['Comprar uno nuevo y guardarlo', 'mayor'],
      ], 'Cuanto más se comparte un objeto que existe, menos objetos nuevos hacen falta.', { d: 2, extremos: ['Menor impacto', 'Mayor impacto'] }),
      mult('¿Qué condiciones hacen que un modelo de uso reduzca de verdad el impacto? Marcá todas.', [ // e8
        '+Que el producto compartido sea durable y se mantenga',
        '+Que buscarlo y devolverlo no requiera largos viajes en auto',
        '+Que reemplace compras de productos nuevos',
        '-Que se use el doble solo porque es barato',
        '-Que cada uso requiera un envío individual en avión',
      ], 'El beneficio depende de los detalles: logística, durabilidad y si realmente reemplaza compras.', { d: 3 }),
      det('Leé la propuesta de una empresa y marcá lo que no es circular.', [ // e9
        ['Alquilamos lavarropas y nos ocupamos de repararlos.', false],
        ['Cada seis meses reemplazamos el lavarropas por uno nuevo aunque funcione.', true, 'Descartar aparatos que funcionan va contra la circularidad.'],
        ['Remanufacturamos las piezas gastadas.', false],
        ['Cobramos por lavado, así preferimos equipos que consuman poco.', false],
      ], 'Un modelo de servicio es circular si alarga la vida de los productos, no si los rota más rápido.', { d: 2 }),
      comp('Completá.', 'Cobrar por el uso en lugar de vender el objeto es un modelo de producto como [servicio]; una biblioteca de herramientas es una forma de [compartir]; y si un servicio barato hace que se use mucho más, hay un efecto [rebote].', ['regalo', 'acumular', 'espejo'], 'Tres ideas sobre modelos que venden uso en lugar de cosas.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Límites y personas', 'Lo que la circularidad no puede, el reciclaje que degrada, el lavado circular y quienes hoy recuperan los materiales.', [
      teoria('No puede ser perfecta', [
        'Ninguna economía puede ser 100 % circular. Cada vez que se recicla se pierde algo de material y se usa energía; algunos materiales se degradan (el papel acorta sus fibras, muchos plásticos pierden calidad); y mientras la demanda de materiales crezca, ni siquiera reciclando todo alcanzaría para abastecerla. Según el Informe sobre la Brecha de Circularidad, reciclar todo lo reciclable, sin reducir el consumo, llevaría la circularidad mundial solo hasta un 25 % aproximadamente.',
      ]),
      op('Según el informe de 2025, ¿hasta dónde subiría la circularidad si se reciclara todo lo reciclable, sin reducir el consumo?', [ // e1
        'Hasta un 25 % aproximadamente',
        'Hasta el 100 %, es decir, la circularidad total',
        ['Hasta un 80 %, casi completa', 'Muy por debajo: los materiales en uso y en stock no alcanzan.'],
        'No cambiaría nada, seguiría en 6,9 %',
      ], 'Reciclar más ayuda, pero sin usar menos materiales la economía sigue siendo mayormente lineal.', { d: 3 }),
      teoria('Reciclaje que degrada', [
        'A veces el reciclaje convierte un material en algo de menor calidad, que después ya no se puede reciclar: se lo llama infrarreciclaje. Por ejemplo, botellas plásticas convertidas en fibras para ropa, que luego casi nunca se reciclan de nuevo. Es mejor que tirarlas, pero no cierra el ciclo: solo lo estira un paso más.',
      ]),
      cad('Armá el recorrido de una botella que se infrarrecicla.', [ // e2
        'Se usa una botella plástica',
        'Se recicla en fibras para una remera',
        'La remera se usa unos años',
        'Mezclada con otras fibras, casi no se puede reciclar',
        'Termina en un relleno o quemada',
      ], ['La remera vuelve a ser botella automáticamente'], 'El infrarreciclaje retrasa el final, pero no lo evita.', { d: 2 }),
      clas('¿Este reciclaje cierra el ciclo o solo lo estira?', { // e2b
        'Cierra el ciclo': ['Una lata de aluminio que vuelve a ser lata', 'Una botella de vidrio que vuelve a ser botella', 'Restos de comida compostados que vuelven al suelo'],
        'Solo lo estira': ['Una botella plástica convertida en fibra textil', 'Papel de oficina convertido en cartón de menor calidad'],
      }, 'Cerrar el ciclo es volver al mismo uso; estirarlo es bajar un escalón de calidad.', { d: 2 }),
      teoria('Lavado circular', [
        'Como pasa con lo "verde", también hay lavado circular: empresas que se presentan como circulares por un programa chico de reciclaje mientras su modelo sigue siendo vender cada vez más productos de corta vida. Las preguntas útiles son: ¿qué porcentaje de sus productos vuelve y a qué ciclo?, ¿diseñan para durar y reparar?, ¿su volumen de ventas crece más rápido que lo que recuperan?',
      ]),
      det('Leé esta campaña de una marca de moda rápida y marcá lo engañoso.', [ // e3
        ['Tenemos contenedores para devolver ropa usada en nuestras tiendas.', false],
        ['Somos una marca circular: tu ropa vieja se convierte en ropa nueva.', true, 'En la práctica, muy poca ropa se recicla en ropa nueva.'],
        ['Publicamos cuántas prendas recolectamos por año.', false],
        ['Llevá una bolsa de ropa usada y te damos un descuento para comprar más.', true, 'Incentivar más compras contradice la circularidad.'],
      ], 'Lo viste con el greenwashing: una acción real puede usarse para tapar un modelo lineal.', { d: 3 }),
      teoria('Quienes recuperan', [
        'En Argentina, gran parte de los materiales que se reciclan son recuperados por recuperadoras y recuperadores urbanos, muchas veces organizados en cooperativas, como las que integran la Federación Argentina de Cartoneros, Carreros y Recicladores. Hacen un trabajo ambiental esencial, muchas veces en condiciones precarias. Una economía circular justa los reconoce, los incluye en los sistemas de gestión y mejora sus condiciones.',
        'Otra herramienta es la responsabilidad extendida del productor: que quienes ponen productos y envases en el mercado se hagan cargo de financiar su recuperación.',
      ]),
      mult('¿Qué hace más justa a la economía circular? Marcá todo.', [ // e4
        '+Incluir a las cooperativas de recuperadores en la gestión',
        '+Mejorar sus condiciones de trabajo y sus ingresos',
        '+Que los productores financien la recuperación de sus envases',
        '-Excluir a los recuperadores para automatizar todo',
        '-Que los costos los paguen solo los municipios',
      ], 'La circularidad también es una cuestión social: quién hace el trabajo y quién paga.', { d: 2 }),
      par('Uní cada concepto con su descripción.', [ // e5
        ['Infrarreciclaje', 'Reciclar en algo de menor calidad'],
        ['Lavado circular', 'Presentarse como circular sin serlo'],
        ['Responsabilidad extendida del productor', 'El productor financia la recuperación'],
        ['Recuperadores urbanos', 'Personas que recuperan materiales reciclables'],
      ], 'Cuatro conceptos para mirar la circularidad con ojo crítico.', { d: 2 }),
      numv(3, (i) => { // e6
        const [ventas, recup] = [[1000, 20], [500, 15], [2000, 50]][i];
        return {
          enunciado: `Una marca vende ${ventas.toLocaleString('es-AR')} toneladas de ropa por año y recupera ${recup} toneladas con su programa de reciclaje. ¿Qué porcentaje recupera?`,
          valor: Math.round((recup / ventas) * 1000) / 10,
          unidad: '%',
          dec: 1,
          tol: 0.1,
          explicacion: `${recup} ÷ ${ventas.toLocaleString('es-AR')} × 100 = ${(Math.round((recup / ventas) * 1000) / 10).toLocaleString('es-AR')} %. Si su publicidad dice "somos circulares", el número muestra otra cosa.`,
          ctx: `${recup} t recuperadas de ${ventas} t vendidas.`,
        };
      }, { d: 2 }),
      vf('Si una empresa recicla una parte de sus productos, ya es una empresa circular.', false, 'Depende de cuánto recupera, a qué ciclo vuelve lo recuperado, cómo diseña y si su volumen de ventas crece más que lo que recupera.', { // e7
        razones: ['+Porque importan cuánto recupera, cómo diseña y cuánto vende', '-Porque reciclar no tiene ningún valor', '-Porque ninguna empresa puede reciclar'],
        d: 2,
      }),
      rank('Ordená estas acciones de una empresa de la más circular a la menos.', [ // e8
        ['Diseñar para durar y ofrecer reparación de por vida', 'más circular'],
        ['Recomprar productos usados y reacondicionarlos', 'muy circular'],
        ['Usar un 30 % de material reciclado', 'algo'],
        ['Poner un contenedor de reciclaje en sus tiendas', 'poco'],
      ], 'Las acciones de diseño y de ciclos internos pesan más que las de reciclaje al final.', { d: 3, extremos: ['Más circular', 'Menos circular'] }),
      op('¿Por qué la economía circular no reemplaza la necesidad de consumir menos?', [ // e9
        'Porque reciclar pierde material y energía',
        'Porque la economía circular obliga a comprar más',
        ['Porque consumir menos está prohibido', 'No lo está: es la estrategia más efectiva.'],
        'Porque los materiales reciclados no existen',
      ], 'Circularidad y suficiencia van juntas: usar menos, usar más tiempo y recuperar lo que queda.', { d: 2 }),
      comp('Completá.', 'Reciclar un material en algo de menor calidad es [infrarreciclaje]; presentarse como circular sin serlo es lavado [circular]; y que el productor financie la recuperación es responsabilidad [extendida].', ['sobrerreciclaje', 'verde', 'limitada'], 'Tres ideas para detectar los límites y las trampas de la circularidad.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: economía circular', 'Principios, ciclos, ecodiseño, modelos de uso, límites y justicia, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: la marca de zapatillas', 'Una marca argentina de zapatillas quiere volverse circular. Evaluá sus propuestas con lo que aprendiste.', [
      teoria('La situación', [
        'La marca vende 100.000 pares por año. Sus zapatillas duran en promedio 1 año, tienen suela pegada y mezclan cuero, tela y plástico. El equipo propone: (A) una campaña que diga "somos circulares" con un contenedor de reciclaje en cada tienda; (B) rediseñar la zapatilla con suela cosida y reemplazable, y materiales separables; (C) un servicio de reparación y cambio de suela; (D) recomprar pares usados, reacondicionarlos y venderlos como segunda mano; (E) un descuento para comprar un par nuevo cada vez que devuelven uno viejo.',
      ]),
      clas('Clasificá las propuestas.', { // e1
        'Circulares de verdad': ['B · Suela cosida y materiales separables', 'C · Reparación y cambio de suela', 'D · Recompra y reacondicionamiento'],
        'Riesgo de lavado circular': ['A · Campaña "somos circulares" con contenedor', 'E · Descuento por comprar un par nuevo'],
      }, 'Las propuestas de diseño y ciclos internos son las de fondo; las de comunicación e incentivo a comprar pueden ser lavado circular.', { d: 3 }),
      num('Si con el rediseño y la reparación las zapatillas duran 2 años en lugar de 1, ¿cuántos pares por año harían falta para calzar a las mismas personas?', 50000, 'pares', '100.000 ÷ 2 = 50.000 pares por año: la mitad de materiales y de residuos para el mismo servicio.', { ctx: '100.000 pares por año; la vida útil pasa de 1 a 2 años.', d: 2 }),
      rank('Ordená las propuestas de la más a la menos circular.', [ // e3
        ['B · Rediseño con suela cosida y materiales separables', 'diseño'],
        ['C · Reparación y cambio de suela', 'mantener'],
        ['D · Recompra y reacondicionamiento', 'reutilizar'],
        ['A · Campaña con contenedor', 'comunicación'],
      ], 'El diseño habilita todo lo demás; la campaña, sola, no cambia nada.', { d: 3 }),
      op('¿Qué problema tiene la propuesta E?', [ // e4
        'Incentiva a comprar más pares nuevos',
        'Que las zapatillas usadas no sirven para nada',
        ['Que es demasiado cara para la marca', 'El problema no es el costo sino que empuja más ventas.'],
        'Que los descuentos están prohibidos',
      ], 'Un incentivo a comprar más contradice el objetivo de usar menos materiales.', { d: 2 }),
      mult('¿Qué indicadores debería publicar la marca para mostrar avances reales? Marcá todos.', [ // e5
        '+Vida útil promedio de sus zapatillas',
        '+Pares reparados y reacondicionados por año',
        '+Porcentaje de materiales que vuelven a un ciclo',
        '-Cantidad de publicaciones en redes sobre circularidad',
        '-Número de contenedores instalados, sin datos de lo recuperado',
      ], 'Los indicadores deben medir resultados, no actividades de comunicación.', { d: 3 }),
      vf('Si la marca vende la mitad de pares nuevos pero cobra por reparaciones y reacondicionados, puede seguir siendo un negocio viable.', true, 'Muchas empresas circulares ganan con servicios, reparaciones y segunda mano. El modelo cambia: menos unidades, más servicio por unidad.', { // e6
        razones: ['+Porque puede ganar con servicios y segunda mano', '-Porque reparar nunca genera ingresos', '-Porque las empresas solo ganan vendiendo productos nuevos'],
        d: 3,
      }),
      det('La marca redacta su comunicado. Marcá lo que conviene corregir.', [ // e7
        ['Nuestras nuevas zapatillas tienen suela cosida y reemplazable.', false],
        ['Somos 100 % circulares.', true, 'Ninguna empresa lo es; conviene dar datos concretos.'],
        ['Ofrecemos cambio de suela en todas nuestras tiendas.', false],
        ['Devolvé tu par viejo y llevate dos nuevos con descuento.', true, 'Incentiva comprar más: contradice la circularidad.'],
      ], 'Comunicar bien es dar datos verificables, sin prometer lo imposible.', { d: 3 }),
    ]),
  ],
});
