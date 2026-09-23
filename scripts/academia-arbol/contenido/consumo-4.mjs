import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// CONSUMO 4 — Lo que el precio no dice.
// Externalidades, los costos ocultos de la comida, cómo se pone precio a la
// contaminación, los subsidios que empujan en sentido contrario y cómo
// decidir con el costo total, sin olvidar quién paga. Retoma la vida de un
// producto (consumo-1), la economía circular (consumo-3), la huella de la
// comida (alimentacion-2) y la energía en casa (energia-2).

export default unidad({
  slug: 'consumo-4',
  rama: 'consumo',
  orden: 4,
  nivel: 2,
  requiereTronco: 2,
  titulo: 'Lo que el precio no dice',
  bajada: 'Contaminación que nadie paga, subsidios que empujan al revés y productos baratos que salen caros: los costos ocultos y cómo hacer que los precios digan la verdad.',
  objetivos: [
    'Explicar qué es una externalidad, negativa o positiva, con ejemplos',
    'Interpretar los costos ocultos de los sistemas alimentarios',
    'Comparar impuestos al carbono y mercados de emisiones',
    'Reconocer subsidios que alientan la contaminación',
    'Calcular el costo total de un producto y considerar quién paga cada política',
  ],
  repasa: ['consumo-1', 'consumo-3', 'alimentacion-2', 'energia-2'],
  fuentes: ['fao-sofa-2023', 'bm-precio-carbono', 'fmi-subsidios', 'ley-27430-impuesto-co2', 'ley-25675-ambiente', 'ipbes-polinizadores', 'fao-pesca-sofia', 'oms-aire-exterior'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Lo que el precio no cuenta', 'Externalidades: costos y beneficios que recaen sobre quienes no compran ni venden.', [
      teoria('Una tercera persona paga', [
        'Cuando una fábrica contamina un río, el precio de lo que produce no incluye el costo de limpiar el agua ni el de las enfermedades de quienes viven aguas abajo. Ese costo existe, pero lo pagan otras personas. En economía se lo llama externalidad negativa: un costo que recae sobre quienes no participaron de la compra ni de la venta.',
        'Como el precio no refleja el costo completo, el producto contaminante parece más barato de lo que es, y se produce y se consume más de lo que convendría.',
      ]),
      op('¿Qué es una externalidad negativa?', [ // e1
        'Un costo que paga alguien ajeno a la compra y la venta',
        'Un impuesto que paga quien compra un producto',
        ['El precio de un producto importado', 'No tiene que ver con el origen: es un costo que recae en terceros.'],
        'Una ganancia extra de la empresa',
      ], 'El problema no es que el costo no exista, sino que lo paga otra persona.', { d: 1 }),
      clas('¿Quién paga el costo en cada caso?', { // e2
        'Lo paga quien compra o vende': ['El precio de la nafta en el surtidor', 'El costo de la materia prima de un producto'],
        'Lo pagan terceros (externalidad)': ['El asma de quien vive junto a una avenida con mucho tránsito', 'La limpieza de un río contaminado por una curtiembre', 'Los daños de eventos extremos por el calentamiento global'],
      }, 'Las externalidades son costos reales que no aparecen en el ticket.', { d: 2 }),
      teoria('También hay externalidades positivas', [
        'A veces el efecto es un beneficio que nadie cobra. Un apicultor cuyas abejas polinizan los cultivos vecinos, una persona que planta árboles en su vereda que dan sombra a todos, o un campo que conserva un humedal que absorbe crecidas. Como nadie les paga por ese beneficio, se produce menos de lo que convendría. Por eso existen los pagos por servicios ambientales, que remuneran a quien conserva.',
      ]),
      clas('¿Es una externalidad negativa o positiva?', { // e3
        'Negativa': ['El ruido de un boliche para los vecinos', 'El humo de una quema de basura', 'El lodo de una obra que tapa un desagüe'],
        'Positiva': ['Las abejas de un apicultor polinizan campos vecinos', 'Un árbol en la vereda que da sombra a quienes pasan', 'Un humedal conservado que reduce inundaciones aguas abajo'],
      }, 'Las positivas se producen de menos; las negativas, de más. Las políticas buscan corregir las dos.', { d: 1 }),
      cad('Armá la cadena de por qué una externalidad negativa lleva a contaminar de más.', [ // e4
        'Una empresa contamina sin pagar el daño',
        'Su costo de producir parece más bajo',
        'Puede vender más barato',
        'Se compra y se produce más',
        'Aumenta la contaminación total',
      ], ['El precio bajo reduce la contaminación'], 'Un precio que miente empuja a producir y consumir más de lo que convendría.', { d: 2 }),
      numv(3, (i) => { // e5
        const [precio, dano] = [[100, 30], [250, 60], [80, 40]][i];
        return {
          enunciado: `Un producto cuesta ${precio} pesos, pero su fabricación causa daños a terceros por ${dano} pesos por unidad. ¿Cuál sería su costo real para la sociedad?`,
          valor: precio + dano,
          unidad: 'pesos',
          explicacion: `${precio} + ${dano} = ${precio + dano} pesos. El precio muestra solo ${precio}: la diferencia la pagan otras personas.`,
          ctx: `Precio ${precio}; daño a terceros ${dano} por unidad.`,
        };
      }, { d: 1 }),
      vf('Si un producto es barato, es porque su fabricación no causa ningún daño.', false, 'Puede ser barato justamente porque no paga los daños que causa. El precio bajo puede esconder costos ambientales y sociales.', { // e6
        razones: ['+Porque el precio puede no incluir los daños a terceros', '-Porque los productos baratos nunca contaminan', '-Porque el precio incluye siempre todos los costos'],
        d: 2,
      }),
      op('Un campo conserva un humedal que evita inundaciones río abajo, pero nadie le paga por eso. ¿Qué es probable que pase?', [ // e6b
        'Que tenga incentivos para rellenarlo y sembrar',
        'Que lo conserve para siempre sin ningún costo',
        ['Que los vecinos de río abajo le paguen solos', 'Sin un acuerdo o una política, nadie paga por un beneficio gratuito.'],
        'Que el humedal se agrande naturalmente',
      ], 'Sin pago, conservar le cuesta y no le rinde: las externalidades positivas tienden a perderse.', { d: 2 }),
      par('Uní cada concepto con su ejemplo.', [ // e7
        ['Externalidad negativa', 'Contaminación del aire por una fábrica'],
        ['Externalidad positiva', 'Polinización gratuita de cultivos vecinos'],
        ['Pago por servicios ambientales', 'Remunerar a quien conserva un bosque'],
        ['Precio que miente', 'Un producto barato que esconde daños'],
      ], 'Cuatro ideas para leer los precios con otros ojos.', { d: 1 }),
      mult('¿Qué ejemplos muestran externalidades del transporte en auto? Marcá todos.', [ // e8
        '+Contaminación del aire que respiran peatones',
        '+Congestión que demora a los colectivos',
        '+Ruido en las calles',
        '-La nafta que paga quien maneja',
        '-La cuota del seguro del auto',
      ], 'La nafta y el seguro los paga quien maneja; el aire, el ruido y la demora los pagan todos.', { d: 2 }),
      det('Leé esta opinión y marcá lo equivocado.', [ // e9
        ['El costo de la contaminación lo pagan muchas veces los vecinos.', false],
        ['Si nadie paga un costo, ese costo no existe.', true, 'Existe: lo paga alguien, aunque no aparezca en el precio.'],
        ['Conservar un humedal puede beneficiar a quienes viven aguas abajo.', false],
        ['Las externalidades positivas no necesitan ninguna política.', true, 'Como nadie las paga, se producen de menos; los pagos por servicios ambientales las estimulan.'],
      ], 'Ver las externalidades cambia la pregunta de "¿cuánto cuesta?" a "¿quién paga?".', { d: 2 }),
      comp('Completá.', 'Un costo que paga alguien ajeno a la compra es una [externalidad]; cuando el efecto es un beneficio gratuito, es [positiva]; y remunerar a quien conserva un bosque es un pago por servicios [ambientales].', ['ganancia', 'neutra', 'bancarios'], 'Los conceptos básicos para entender los costos ocultos.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Los costos ocultos de la comida', 'Salud, ambiente y pobreza: lo que el precio de los alimentos no incluye, según la FAO.', [
      teoria('Diez billones de dólares', [
        'En su informe de 2023, la FAO estimó por primera vez los costos ocultos de los sistemas agroalimentarios en 154 países: al menos 10 billones de dólares por año (10 millones de millones), casi el 10 % del producto bruto mundial. Alrededor del 73 % de esos costos se relaciona con dietas poco saludables, que causan enfermedades y pérdida de productividad; alrededor del 20 %, con impactos ambientales como emisiones, contaminación con nitrógeno y cambio en el uso del suelo; y cerca del 4 %, con costos sociales como la pobreza de quienes trabajan en la cadena.',
      ], {
        datos: barras('Costos ocultos de los sistemas agroalimentarios por tipo (aproximado)', '%', [
          ['Salud (dietas poco saludables)', 73],
          ['Ambiente', 20],
          ['Social', 4],
        ], 'FAO, El estado mundial de la agricultura y la alimentación 2023; el resto, otros costos.'),
      }),
      est('Estimá cuántos millones de millones de dólares por año suman los costos ocultos de los sistemas agroalimentarios, según la FAO.', 10, { min: 0.1, max: 1000, unidad: 'millones de millones de USD', escala: 'log' }, 'Al menos 10 millones de millones (10 billones) de dólares por año, casi el 10 % del producto mundial.', { d: 3 }),
      rank('Ordená los tipos de costos ocultos de la comida, de mayor a menor, según la FAO.', [ // e2
        ['Salud, por dietas poco saludables', '≈ 73 %'],
        ['Ambiente', '≈ 20 %'],
        ['Social', '≈ 4 %'],
      ], 'Sorprende a muchos: el mayor costo oculto está en la salud, no en el ambiente.', { d: 2 }),
      op('¿Cuál es el mayor costo oculto de los sistemas agroalimentarios, según la FAO?', [ // e3
        'Las enfermedades por dietas poco saludables',
        'Los envases plásticos de los alimentos',
        ['El transporte internacional de alimentos', 'Es parte de lo ambiental, que en total pesa menos que la salud.'],
        'El precio de la maquinaria agrícola',
      ], 'Casi tres cuartos de los costos ocultos tienen que ver con la salud.', { d: 2 }),
      numv(3, (i) => { // e4
        const total = [10, 12, 11][i];
        return {
          enunciado: `Si los costos ocultos suman ${total} millones de millones de dólares y el 20 % es ambiental, ¿cuántos millones de millones son costos ambientales? Redondeá a un decimal.`,
          valor: Math.round(total * 0.2 * 10) / 10,
          unidad: 'millones de millones de USD',
          dec: 1,
          tol: 0.1,
          explicacion: `${total} × 0,2 = ${(Math.round(total * 0.2 * 10) / 10).toLocaleString('es-AR')} millones de millones de dólares por año, que hoy nadie paga en el precio de la comida.`,
          ctx: `${total} millones de millones en total; 20 % ambiental.`,
        };
      }, { d: 2 }),
      teoria('El costo verdadero', [
        'La idea de contabilidad de costos verdaderos busca sumar al precio de los alimentos los costos ocultos, para que las decisiones —de gobiernos, empresas y personas— se basen en la información completa. No significa necesariamente que la comida deba ser más cara para quien la compra: puede significar, por ejemplo, redirigir subsidios, cambiar la forma de producir o mejorar la información nutricional.',
      ]),
      cad('Armá la cadena de un costo oculto de salud.', [ // e5
        'Un alimento ultraprocesado es barato y muy consumido',
        'Su consumo frecuente aumenta el riesgo de enfermedades',
        'Crecen los tratamientos y los días sin poder trabajar',
        'El sistema de salud y las familias pagan ese costo',
        'Ese costo no está en el precio del producto',
      ], ['El precio del producto incluye los tratamientos médicos'], 'Por eso el etiquetado frontal de alimentos busca, al menos, que la información llegue a quien compra.', { d: 2 }),
      clas('¿Qué tipo de costo oculto es cada caso?', { // e6
        'Salud': ['Diabetes asociada a dietas con mucha azúcar', 'Enfermedades cardíacas por exceso de sodio'],
        'Ambiente': ['Emisiones de metano de la ganadería', 'Nitrógeno de fertilizantes que contamina el agua', 'Desmonte para ampliar cultivos'],
        'Social': ['Trabajadores rurales con salarios de pobreza'],
      }, 'Los costos ocultos cruzan salud, ambiente y justicia social.', { d: 2 }),
      vf('Contar los costos ocultos significa que la comida saludable tiene que ser más cara.', false, 'Al contrario: muchas veces muestra que conviene abaratar la comida saludable y dejar de subsidiar la que genera más costos. El objetivo es decidir con información completa.', { // e7
        razones: ['+Porque puede llevar a abaratar lo saludable y redirigir subsidios', '-Porque la comida saludable no tiene costos', '-Porque los costos ocultos no existen'],
        d: 3,
      }),
      mult('¿Qué medidas pueden reducir los costos ocultos de la comida? Marcá todas.', [ // e7b
        '+Abaratar frutas y verduras frescas',
        '+Reducir el uso excesivo de fertilizantes',
        '+Mejorar los ingresos de trabajadores rurales',
        '-Subsidiar más los productos ultraprocesados',
        '-Ocultar la información nutricional',
      ], 'Atacar los costos ocultos es cambiar lo que se subsidia, cómo se produce y qué información llega a quien compra.', { d: 2 }),
      par('Uní cada herramienta con el costo oculto que ataca.', [ // e8
        ['Etiquetado frontal de alimentos', 'Salud, por información a quien compra'],
        ['Reducir fertilizantes nitrogenados', 'Contaminación del agua'],
        ['Salarios justos en la cadena', 'Pobreza rural'],
        ['Frenar desmontes', 'Pérdida de bosques y emisiones'],
      ], 'Cada costo oculto pide una herramienta distinta.', { d: 2 }),
      det('Leé este titular y su bajada y marcá lo equivocado.', [ // e9
        ['La FAO estimó costos ocultos de al menos 10 billones de dólares por año.', false],
        ['La mayor parte de esos costos es por el transporte de alimentos.', true, 'La mayor parte, un 73 %, es por dietas poco saludables.'],
        ['Una parte de los costos ocultos es ambiental.', false],
        ['Los costos ocultos ya están incluidos en los precios del súper.', true, 'Justamente no lo están: por eso se llaman ocultos.'],
      ], 'Los costos ocultos se miden para poder decidir mejor.', { d: 2 }),
      comp('Completá.', 'Según la FAO, los costos ocultos de la comida suman al menos 10 [billones] de dólares por año; el mayor es de [salud]; y cerca del 20 % es [ambiental].', ['miles', 'transporte', 'publicitario'], 'Tres datos clave del informe de la FAO sobre costos ocultos.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Ponerle precio a la contaminación', 'Impuestos al carbono, mercados de emisiones y el principio de que quien contamina paga.', [
      teoria('Quien contamina paga', [
        'Una forma de corregir una externalidad es que quien la causa la pague. En Argentina, la Ley General del Ambiente establece que quien genera efectos degradantes en el ambiente es responsable de los costos de prevenirlos y recomponerlos. Aplicado al clima, esto lleva a ponerle un precio a las emisiones de gases de efecto invernadero.',
      ]),
      teoria('Dos herramientas', [
        'Hay dos formas principales de poner precio al carbono. Un impuesto al carbono fija un precio por tonelada emitida: se sabe cuánto cuesta, pero no exactamente cuánto bajarán las emisiones. Un mercado de emisiones fija un tope total de emisiones y reparte o subasta permisos que se pueden comprar y vender: se sabe cuánto se emitirá como máximo, pero el precio varía. La Unión Europea tiene un mercado de emisiones desde 2005.',
        'Según el Banco Mundial, en 2026 los precios al carbono cubren casi el 30 % de las emisiones mundiales, y en 2025 recaudaron más de 100.000 millones de dólares para los presupuestos públicos.',
      ]),
      par('Uní cada herramienta con su característica.', [ // e1
        ['Impuesto al carbono', 'Precio fijo por tonelada; la reducción varía'],
        ['Mercado de emisiones', 'Tope total fijo; el precio varía'],
        ['Principio de quien contamina paga', 'El que causa el daño cubre su costo'],
        ['Pago por servicios ambientales', 'Se remunera a quien conserva'],
      ], 'Herramientas distintas para el mismo objetivo: que los precios reflejen los daños.', { d: 2 }),
      op('Un gobierno quiere asegurarse de que las emisiones no superen cierto límite. ¿Qué herramienta encaja mejor?', [ // e2
        'Un mercado de emisiones con un tope total',
        'Un impuesto al carbono sin tope de emisiones',
        ['Una campaña publicitaria sobre el clima', 'Puede ayudar, pero no garantiza ningún límite.'],
        'Un subsidio a los combustibles fósiles',
      ], 'El tope fija la cantidad; el mercado decide el precio.', { d: 2 }),
      est('Estimá qué porcentaje de las emisiones mundiales está cubierto por algún precio al carbono, según el Banco Mundial.', 30, { min: 0, max: 100, paso: 5, unidad: '%' }, 'Casi el 30 %, según el informe de 2026 del Banco Mundial. La mayor parte de las emisiones todavía no tiene precio.', { d: 2 }),
      teoria('En Argentina', [
        'Argentina tiene un impuesto al dióxido de carbono sobre los combustibles líquidos y el carbón, creado por la Ley 27.430, de 2017. Su valor por tonelada es bajo comparado con el de otros países y con los daños estimados del CO₂, pero es una herramienta que ya existe y que puede ajustarse.',
      ]),
      numv(3, (i) => { // e3
        const [litros, precio] = [[1000, 10], [2000, 20], [500, 50]][i];
        return {
          enunciado: `Si cada litro de nafta emite 2,3 kg de CO₂ y el impuesto es de ${precio} dólares por tonelada de CO₂, ¿cuántos dólares de impuesto corresponden a ${litros.toLocaleString('es-AR')} litros? Redondeá a un decimal.`,
          valor: Math.round((litros * 2.3) / 1000 * precio * 10) / 10,
          unidad: 'dólares',
          dec: 1,
          tol: 0.1,
          explicacion: `${litros.toLocaleString('es-AR')} × 2,3 = ${(litros * 2.3).toLocaleString('es-AR')} kg = ${((litros * 2.3) / 1000).toLocaleString('es-AR')} t; × ${precio} = ${(Math.round((litros * 2.3) / 1000 * precio * 10) / 10).toLocaleString('es-AR')} dólares.`,
          ctx: `${litros} litros; 2,3 kg/L; ${precio} USD por tonelada.`,
        };
      }, { d: 3 }),
      cad('Armá la cadena de cómo un impuesto al carbono reduce emisiones.', [ // e4
        'Se cobra un impuesto por tonelada de CO₂',
        'Los productos con más emisiones suben de precio',
        'Las empresas buscan procesos que emitan menos',
        'Las personas eligen más las opciones bajas en carbono',
        'Las emisiones totales bajan',
      ], ['Las emisiones suben porque todo es más caro'], 'El precio envía una señal a millones de decisiones a la vez.', { d: 2 }),
      vf('Un impuesto al carbono le dice a cada empresa exactamente qué tecnología usar.', false, 'No: fija un precio y deja que cada una encuentre la forma más barata de reducir. Esa flexibilidad es una de sus ventajas.', { // e5
        razones: ['+Porque fija un precio y deja elegir cómo reducir', '-Porque prohíbe todas las tecnologías', '-Porque no tiene ningún efecto en las decisiones'],
        d: 2,
      }),
      op('Una empresa puede reducir sus emisiones a un costo de 20 dólares por tonelada. El impuesto al carbono es de 50. ¿Qué le conviene?', [ // e5b
        'Reducir, porque le cuesta menos que pagar',
        'Pagar el impuesto y no cambiar nada en absoluto',
        ['Emitir más para compensar el gasto', 'Emitir más le costaría 50 dólares por cada tonelada extra.'],
        'Cerrar la empresa de inmediato',
      ], 'El impuesto hace que reducir sea negocio cuando cuesta menos que pagar: así se logran las reducciones más baratas primero.', { d: 3 }),
      clas('¿Qué ventaja tiene cada herramienta?', { // e6
        'Impuesto al carbono': ['Se sabe de antemano cuánto cuesta cada tonelada', 'Es simple de aplicar sobre los combustibles'],
        'Mercado de emisiones': ['Se sabe el máximo total de emisiones', 'Las empresas que reducen más pueden vender permisos'],
      }, 'Cada diseño tiene ventajas; muchos países combinan ambos con otras regulaciones.', { d: 3 }),
      det('Leé este debate y marcá lo equivocado.', [ // e7
        ['La Unión Europea tiene un mercado de emisiones desde 2005.', false],
        ['Casi todas las emisiones del mundo ya tienen un precio.', true, 'Solo cerca del 30 % está cubierto.'],
        ['Argentina tiene un impuesto al CO₂ sobre combustibles.', false],
        ['Un mercado de emisiones fija el precio exacto del carbono.', true, 'Fija el tope; el precio varía según la oferta y la demanda.'],
      ], 'Conocer cómo funcionan estas herramientas permite discutirlas con fundamento.', { d: 2 }),
      mult('¿Qué puede hacer un gobierno con lo que recauda un impuesto al carbono? Marcá todas las opciones razonables.', [ // e8
        '+Devolverlo en partes iguales a cada habitante',
        '+Invertir en transporte público',
        '+Bajar otros impuestos',
        '+Ayudar a los hogares de menores ingresos',
        '-Subsidiar más combustibles fósiles',
      ], 'Usar lo recaudado para subsidiar más fósiles anularía la señal del impuesto.', { d: 2 }),
      comp('Completá.', 'Un precio fijo por tonelada emitida es un [impuesto] al carbono; un tope total con permisos que se compran y venden es un [mercado] de emisiones; y en Argentina, el impuesto al CO₂ lo creó la Ley [27.430].', ['subsidio', 'desfile', '26.331'], 'Tres ideas clave para entender el precio al carbono.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Subsidios que empujan al revés', 'Cuando el dinero público abarata lo que contamina: combustibles, pesca y señales que hay que corregir con cuidado.', [
      teoria('Siete billones', [
        'Según el Fondo Monetario Internacional, en 2022 los subsidios a los combustibles fósiles en el mundo sumaron unos 7 billones de dólares (7 millones de millones), alrededor del 7 % del producto mundial. De eso, unos 1,3 billones fueron subsidios explícitos: vender la energía por debajo de su costo de producción. El resto, la mayor parte, son subsidios implícitos: no cobrar los daños ambientales y de salud que causan esos combustibles.',
      ], { destacado: { valor: '≈ 7 billones USD', texto: 'sumaron los subsidios a los combustibles fósiles en 2022, contando los daños no cobrados, según el FMI.' } }),
      par('Uní cada tipo de subsidio con su definición.', [ // e1
        ['Subsidio explícito', 'Vender por debajo del costo de producción'],
        ['Subsidio implícito', 'No cobrar los daños ambientales y de salud'],
        ['Subsidio focalizado', 'Ayuda dirigida a quien más la necesita'],
        ['Subsidio generalizado', 'Beneficia a todos por igual, también a quien más consume'],
      ], 'Distinguir tipos de subsidio ayuda a discutir cuáles corregir y cómo.', { d: 2 }),
      numv(3, (i) => { // e2
        const [total, exp] = [[7, 1.3], [7, 1.3], [7, 1.3]][i];
        const pct = Math.round(((total - exp) / total) * 100);
        return {
          enunciado: [
            `Si los subsidios a los fósiles suman ${total} billones de dólares y ${exp.toLocaleString('es-AR')} son explícitos, ¿qué porcentaje es implícito? Redondeá al entero.`,
            `De ${total} billones de dólares de subsidios a los fósiles, ${exp.toLocaleString('es-AR')} son explícitos. ¿Qué porcentaje corresponde a daños no cobrados? Redondeá al entero.`,
            `Con ${exp.toLocaleString('es-AR')} billones de subsidios explícitos sobre un total de ${total} billones, ¿qué porcentaje del total son subsidios implícitos? Redondeá al entero.`,
          ][i],
          valor: pct,
          unidad: '%',
          tol: 1,
          explicacion: `(${total} − ${exp.toLocaleString('es-AR')}) ÷ ${total} × 100 ≈ ${pct} %. La mayor parte del subsidio es el daño que no se cobra.`,
          ctx: `${exp} billones explícitos de ${total} billones totales.`,
        };
      }, { d: 2 }),
      teoria('Por qué es un problema', [
        'Un subsidio a los combustibles abarata lo que contamina y hace más difícil que compitan las alternativas limpias. Además, cuando es generalizado, beneficia más a quien más consume, que suele tener más ingresos: quien tiene dos autos y una casa grande recibe más subsidio que quien no tiene auto. Algo parecido pasa con los subsidios a la pesca que aumentan la capacidad de las flotas y empujan la sobrepesca.',
      ]),
      cad('Armá la cadena de cómo un subsidio generalizado a la nafta favorece a quien más tiene.', [ // e3
        'La nafta se vende por debajo de su costo',
        'Cada litro cargado recibe subsidio',
        'Quien tiene más autos y maneja más, carga más litros',
        'Recibe más subsidio que quien no tiene auto',
        'El subsidio beneficia más a los hogares de mayores ingresos',
      ], ['Quien no tiene auto recibe el mayor subsidio'], 'Un subsidio generalizado a la energía suele ser caro e injusto a la vez.', { d: 3 }),
      numv(3, (i) => { // e4
        const [la, lb, sub] = [[2000, 100, 50], [1500, 0, 80], [3000, 200, 40]][i];
        return {
          enunciado: `Si cada litro de nafta tiene ${sub} pesos de subsidio, un hogar que carga ${la.toLocaleString('es-AR')} litros por año y otro que carga ${lb}, ¿cuántos pesos más de subsidio recibe el primero?`,
          valor: (la - lb) * sub,
          unidad: 'pesos',
          explicacion: `(${la.toLocaleString('es-AR')} − ${lb}) × ${sub} = ${((la - lb) * sub).toLocaleString('es-AR')} pesos más por año para quien más consume.`,
          ctx: `${la} y ${lb} litros por año; ${sub} pesos de subsidio por litro.`,
        };
      }, { d: 2 }),
      teoria('Reformar con cuidado', [
        'Quitar un subsidio de golpe puede golpear a los hogares más pobres, que gastan una parte mayor de su ingreso en energía y transporte. Por eso, las reformas que funcionan suelen ser graduales, avisadas con tiempo, y acompañadas de ayudas focalizadas: tarifas sociales, transferencias a los hogares de menores ingresos y mejoras en el transporte público.',
      ]),
      ord('Ordená los pasos de una reforma de subsidios bien diseñada.', [ // e5
        'Identificar quién recibe hoy el subsidio',
        'Diseñar ayudas focalizadas para los hogares vulnerables',
        'Anunciar el cambio con tiempo',
        'Reducir el subsidio de forma gradual',
        'Evaluar los efectos y ajustar',
      ], 'Proteger a quien más lo necesita es lo que hace posible y justa la reforma.', { d: 3 }),
      vf('Eliminar de golpe todos los subsidios a la energía, sin ninguna ayuda, es siempre la mejor política ambiental.', false, 'Puede golpear a los hogares más pobres y generar rechazo que frene la reforma. Las reformas graduales con ayudas focalizadas son más justas y duraderas.', { // e6
        razones: ['+Porque sin ayudas golpea a los hogares más pobres', '-Porque los subsidios no tienen ningún efecto ambiental', '-Porque los hogares pobres no usan energía'],
        d: 2,
      }),
      clas('¿Este subsidio empuja hacia más o menos contaminación?', { // e7
        'Empuja a contaminar más': ['Gasoil más barato que su costo para todos', 'Ayudas para agrandar flotas pesqueras', 'Electricidad regalada sin límite de consumo'],
        'Empuja a contaminar menos': ['Crédito barato para aislar techos', 'Tarifa social con un bloque básico de consumo', 'Boleto de transporte público subsidiado'],
      }, 'No todo subsidio es malo: depende de qué abarata y a quién ayuda.', { d: 2 }),
      op('Un gobierno subsidia la compra de barcos más grandes para su flota pesquera. ¿Qué efecto probable tiene?', [ // e7b
        'Aumenta la presión sobre los peces',
        'Recupera las poblaciones de peces',
        ['Baja el precio del pescado para siempre', 'Puede bajarlo al principio, pero si hay sobrepesca, la pesca después cae.'],
        'Reduce la cantidad de horas de pesca',
      ], 'Lo viste en la unidad de pesca: subsidiar capacidad empuja la sobrepesca.', { d: 2 }),
      mult('¿Qué características hacen buena a una tarifa social de energía? Marcá todas.', [ // e7c
        '+Está dirigida a los hogares vulnerables',
        '+Cubre un consumo básico razonable',
        '+Es fácil de solicitar',
        '-Regala energía sin ningún límite',
        '-Se otorga a todos los hogares por igual',
      ], 'Una buena tarifa social protege lo esencial sin subsidiar el derroche.', { d: 2 }),
      det('Leé este informe y marcá lo equivocado.', [ // e8
        ['Según el FMI, los subsidios a los fósiles sumaron unos 7 billones de dólares en 2022.', false],
        ['Los subsidios generalizados benefician más a quienes menos consumen.', true, 'Benefician más a quienes más consumen, que suelen tener más ingresos.'],
        ['Una tarifa social puede proteger a los hogares vulnerables.', false],
        ['La mayor parte de esos subsidios son explícitos.', true, 'La mayor parte son implícitos: daños que no se cobran.'],
      ], 'Los subsidios son herramientas poderosas: bien diseñados ayudan, mal diseñados contaminan.', { d: 2 }),
      comp('Completá.', 'No cobrar los daños de los combustibles es un subsidio [implícito]; la ayuda dirigida a quien más la necesita es un subsidio [focalizado]; y las reformas que funcionan suelen ser [graduales].', ['explícito', 'general', 'secretas'], 'Tres ideas para pensar los subsidios con criterio ambiental y social.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Decidir con el costo total', 'Lo barato que sale caro, cómo comparar productos en toda su vida y quién paga cada política.', [
      teoria('Costo total de uso', [
        'Para comparar dos productos no alcanza con mirar el precio de compra: hay que sumar lo que cuesta usarlos durante toda su vida (energía, agua, mantenimiento, repuestos) y cuánto duran. Una heladera eficiente puede costar más al comprarla y menos en total, porque gasta mucho menos electricidad cada año. Lo mismo pasa con las lámparas LED frente a las incandescentes.',
      ]),
      ejemplo('Dos heladeras', 'Heladera A: cuesta 800 mil pesos y gasta 400 kWh por año. Heladera B: cuesta 950 mil y gasta 250 kWh por año. La electricidad cuesta 150 pesos por kWh y ambas duran 10 años.', [
        'A: 800.000 + 400 × 150 × 10 = 800.000 + 600.000 = 1.400.000 pesos.',
        'B: 950.000 + 250 × 150 × 10 = 950.000 + 375.000 = 1.325.000 pesos.',
        'B cuesta 150 mil más al comprarla, pero 75 mil menos en total, y ahorra 1.500 kWh.',
      ], 'La más cara al comprar resulta la más barata en toda su vida. Precios de ejemplo.'),
      numv(3, (i) => { // e1
        const [pa, ka, pb, kb, tarifa, anos] = [[500, 300, 600, 200, 100, 10], [700, 450, 850, 280, 120, 12], [400, 350, 480, 220, 90, 10]][i];
        const ta = pa * 1000 + ka * tarifa * anos;
        const tb = pb * 1000 + kb * tarifa * anos;
        return {
          enunciado: `Heladera A: ${pa} mil pesos y ${ka} kWh por año. Heladera B: ${pb} mil pesos y ${kb} kWh por año. Con ${tarifa} pesos por kWh y ${anos} años de uso, ¿cuántos pesos ahorra en total la B frente a la A?`,
          valor: ta - tb,
          unidad: 'pesos',
          explicacion: `A: ${ta.toLocaleString('es-AR')}. B: ${tb.toLocaleString('es-AR')}. Diferencia: ${(ta - tb).toLocaleString('es-AR')} pesos a favor de la B. Precios de ejemplo.`,
          ctx: `A ${pa} mil y ${ka} kWh/año; B ${pb} mil y ${kb} kWh/año; ${tarifa} $/kWh; ${anos} años.`,
        };
      }, { d: 4 }),
      mult('¿Qué hay que sumar para calcular el costo total de un electrodoméstico? Marcá todo.', [ // e2
        '+El precio de compra',
        '+La energía que consume en toda su vida',
        '+Reparaciones y repuestos',
        '-El color de la caja',
        '-La publicidad que vimos del producto',
      ], 'El precio de compra es solo el comienzo de la cuenta.', { d: 1 }),
      teoria('Cuando no se puede elegir', [
        'Hay una trampa: los hogares con menos ingresos muchas veces no pueden pagar el producto más caro y eficiente, aunque a la larga les ahorraría dinero. Terminan pagando más por la energía durante años. Por eso sirven los créditos accesibles para equipos eficientes, los programas de recambio y las normas que sacan del mercado los aparatos que más consumen.',
      ]),
      op('¿Por qué un hogar de bajos ingresos puede terminar pagando más por la energía?', [ // e3
        'No puede pagar el equipo eficiente al comprar',
        'Porque la electricidad es más cara en esos hogares',
        ['Porque no le interesa ahorrar energía', 'No es falta de interés: es falta de dinero para invertir al principio.'],
        'Porque los equipos eficientes no existen',
      ], 'La barrera no es la información sino el dinero disponible hoy: las políticas pueden romper esa trampa.', { d: 2 }),
      teoria('Quién paga cada política', [
        'Toda política que cambia precios tiene ganadores y perdedores. Un impuesto al carbono sin compensación puede pesar más, en proporción, sobre los hogares de menores ingresos: se llama efecto regresivo. Por eso muchas propuestas devuelven lo recaudado en partes iguales a cada habitante: como los hogares ricos emiten más, pagan más impuesto del que reciben, y muchos hogares pobres terminan recibiendo más de lo que pagan.',
      ]),
      numv(3, (i) => { // e4
        const [ta, tb, precio, pob] = [[2, 10, 50, 2], [3, 12, 40, 2], [1, 8, 60, 2]][i];
        const recaudado = (ta + tb) * precio;
        const devolucion = recaudado / pob;
        return {
          enunciado: `Un país tiene dos hogares: uno emite ${ta} t de CO₂ y otro ${tb} t. El impuesto es de ${precio} dólares por tonelada y lo recaudado se devuelve en partes iguales. ¿Cuántos dólares netos gana el hogar que emite ${ta} t (lo que recibe menos lo que paga)?`,
          valor: devolucion - ta * precio,
          unidad: 'dólares',
          explicacion: `Se recaudan (${ta} + ${tb}) × ${precio} = ${recaudado} dólares; cada hogar recibe ${devolucion}. El que emite poco pagó ${ta * precio}: gana ${devolucion - ta * precio} dólares netos.`,
          ctx: `Hogares que emiten ${ta} y ${tb} t; ${precio} USD/t; devolución en partes iguales.`,
        };
      }, { d: 4 }),
      clas('¿Esta medida es regresiva (pesa más sobre quien tiene menos) o progresiva?', { // e5
        'Regresiva': ['Un impuesto a la energía sin ninguna compensación', 'Quitar de golpe la tarifa social'],
        'Progresiva': ['Un impuesto al carbono que devuelve lo recaudado en partes iguales', 'Crédito subsidiado para heladeras eficientes en barrios populares', 'Transporte público financiado con un cobro por congestión'],
      }, 'El diseño de una política decide si es justa, no solo su objetivo ambiental.', { d: 3 }),
      vf('Una política ambiental puede ser a la vez buena para el ambiente y justa con los hogares de menores ingresos.', true, 'Con un buen diseño —compensaciones, ayudas focalizadas, inversión pública— se pueden lograr ambos objetivos.', { // e6
        razones: ['+Porque el diseño puede proteger a quien tiene menos', '-Porque toda política ambiental perjudica a los pobres', '-Porque la justicia no tiene relación con el ambiente'],
        d: 2,
      }),
      par('Uní cada concepto con su definición.', [ // e7
        ['Costo total de uso', 'Precio más lo que cuesta usarlo toda su vida'],
        ['Efecto regresivo', 'Pesa más, en proporción, sobre quien tiene menos'],
        ['Dividendo de carbono', 'Devolver lo recaudado en partes iguales'],
        ['Programa de recambio', 'Ayuda para cambiar equipos ineficientes'],
      ], 'Herramientas para decidir y para diseñar políticas con justicia.', { d: 2 }),
      numv(3, (i) => { // e7b
        const [wi, wl, h] = [[60, 9, 4], [100, 14, 5], [40, 6, 6]][i];
        const kwh = Math.round(((wi - wl) * h * 365) / 100) / 10;
        return {
          enunciado: `Una lámpara incandescente de ${wi} W se reemplaza por una LED de ${wl} W que da la misma luz. Si está prendida ${h} horas por día, ¿cuántos kWh por año se ahorran? Redondeá a un decimal.`,
          valor: kwh,
          unidad: 'kWh',
          dec: 1,
          tol: 0.1,
          explicacion: `(${wi} − ${wl}) W × ${h} h × 365 días ÷ 1.000 ≈ ${kwh.toLocaleString('es-AR')} kWh por año, con una sola lámpara. La LED cuesta un poco más y se paga sola en poco tiempo.`,
          ctx: `${wi} W contra ${wl} W; ${h} horas por día.`,
        };
      }, { d: 3 }),
      ord('Ordená los pasos para comparar dos productos por su costo total.', [ // e7c
        'Anotar el precio de compra de cada uno',
        'Estimar cuánto consume cada uno por año',
        'Multiplicar por la tarifa y los años de vida útil',
        'Sumar compra y uso de cada producto',
        'Comparar los totales',
      ], 'Una cuenta simple que cambia muchas decisiones de compra.', { d: 1 }),
      det('Leé esta propuesta y marcá lo que conviene cambiar.', [ // e8
        ['Pondremos un impuesto al carbono y devolveremos lo recaudado en partes iguales.', false],
        ['Eliminaremos la tarifa social para que todos paguen lo mismo.', true, 'Golpea a los hogares vulnerables; conviene focalizar, no eliminar.'],
        ['Ofreceremos crédito barato para heladeras eficientes.', false],
        ['Solo miraremos el precio de compra al licitar equipos para escuelas.', true, 'Conviene mirar el costo total, incluida la energía.'],
      ], 'Buenas políticas miran el costo total y a quién le toca pagarlo.', { d: 2 }),
      comp('Completá.', 'El precio más lo que cuesta usar un producto toda su vida es el costo [total]; una medida que pesa más sobre quien tiene menos es [regresiva]; y devolver lo recaudado en partes iguales es un [dividendo] de carbono.', ['inicial', 'progresiva', 'descuento'], 'Tres conceptos para decidir y diseñar políticas justas.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: lo que el precio no dice', 'Externalidades, costos ocultos de la comida, precio al carbono, subsidios y costo total, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el cobro por descartables', 'Una ciudad quiere cobrar un cargo a los vasos y bandejas descartables. Diseñá la medida con números y con justicia.', [
      teoria('La propuesta', [
        'En la ciudad se usan 12 millones de vasos y bandejas descartables por año. Su recolección y disposición le cuestan al municipio unos 30 pesos por unidad, que hoy paga toda la ciudad con sus tasas. El concejo propone un cargo de 50 pesos por cada descartable entregado en comercios de comida. Estudios de otras ciudades muestran que un cargo así puede reducir su uso a la mitad. Se discute qué hacer con lo recaudado.',
      ]),
      num('Si el uso baja a la mitad, ¿cuántos descartables por año se seguirían usando?', 6000000, 'unidades', '12 millones ÷ 2 = 6 millones por año. La mitad del residuo desaparece antes de existir.', { ctx: '12 millones de descartables por año; baja a la mitad.', d: 1 }),
      num('Con 6 millones de descartables por año y un cargo de 50 pesos, ¿cuántos pesos se recaudarían?', 300000000, 'pesos', '6.000.000 × 50 = 300 millones de pesos por año.', { ctx: '6 millones de unidades; 50 pesos cada una.', d: 2 }),
      op('¿Qué tipo de medida es el cargo por descartables?', [ // e3
        'Un precio que refleja una externalidad',
        'Un subsidio a los comercios de comida',
        ['Una prohibición total de los descartables', 'No prohíbe: pone un precio y deja la opción.'],
        'Un pago por servicios ambientales',
      ], 'El cargo hace que quien usa el descartable pague parte del costo que hoy paga toda la ciudad.', { d: 2 }),
      mult('¿En qué conviene usar lo recaudado? Marcá todas las opciones razonables.', [ // e4
        '+Ayudar a los comercios chicos a pasarse a vajilla reutilizable',
        '+Financiar la gestión de residuos y el reciclaje con las cooperativas',
        '+Instalar dispensers de agua en espacios públicos',
        '-Comprar más descartables para los edificios públicos',
        '-Nada: guardarlo sin destino',
      ], 'Usar lo recaudado para facilitar las alternativas hace la medida más efectiva y más aceptada.', { d: 2 }),
      vf('El cargo podría afectar más a comercios chicos que no pueden invertir en vajilla reutilizable.', true, 'Por eso conviene acompañar la medida con ayudas para la transición, financiadas con lo recaudado.', { // e5
        razones: ['+Porque la transición cuesta y no todos pueden pagarla', '-Porque los comercios chicos no usan descartables', '-Porque el cargo lo pagan solo las grandes cadenas'],
        d: 2,
      }),
      ord('Ordená los pasos para implementar bien la medida.', [ // e6
        'Consultar a comercios, cooperativas y vecinos',
        'Anunciar el cargo con tiempo',
        'Ofrecer ayudas para pasarse a reutilizables',
        'Aplicar el cargo',
        'Medir la reducción y publicar los resultados',
      ], 'Consultar, avisar, ayudar, aplicar y medir: así una medida de precio se vuelve legítima.', { d: 3 }),
      det('El concejo redacta la ordenanza. Marcá lo que conviene corregir.', [ // e7
        ['Lo recaudado financiará vajilla reutilizable para comercios chicos.', false],
        ['El cargo empieza mañana, sin aviso previo.', true, 'Conviene anunciarlo con tiempo para que todos se adapten.'],
        ['Mediremos cada año cuántos descartables se usan.', false],
        ['Lo recaudado se usará para comprar más descartables municipales.', true, 'Contradice el objetivo: hay que financiar las alternativas.'],
      ], 'Una medida de precio funciona cuando es previsible, justa y coherente con su objetivo.', { d: 3 }),
    ]),
  ],
});
