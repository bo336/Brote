import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// ENERGÍA 2 — La energía en casa.
// De la física a la casa: en qué se va la energía de un hogar argentino,
// cómo calcular lo que usa cada aparato, cómo leer una factura, qué dice la
// etiqueta de eficiencia y cómo calefaccionar y refrescar sin derrochar.

export default unidad({
  slug: 'energia-2',
  rama: 'energia',
  orden: 2,
  nivel: 1,
  requiereTronco: 1,
  titulo: 'La energía en casa',
  bajada: 'Calefacción, heladera, aire acondicionado y stand-by: en qué se va la energía de una casa y dónde está el ahorro de verdad.',
  objetivos: [
    'Identificar los usos que más energía consumen en un hogar',
    'Calcular el consumo mensual de un aparato con su potencia y sus horas de uso',
    'Leer una factura de electricidad y comparar períodos',
    'Usar la etiqueta de eficiencia para elegir un aparato',
    'Aplicar medidas de calefacción y refrigeración eficientes',
  ],
  repasa: ['energia-1', 'tronco-2', 'tronco-3'],
  fuentes: ['iea-eficiencia', 'iea-energia', 'owid-energia'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('En qué se va la energía de una casa', 'Gas y electricidad, calefacción y heladera: el mapa de los consumos de un hogar.', [
      teoria('Dos energías entran a casa', [
        'En la mayoría de las casas argentinas con red de gas entran dos energías: gas natural y electricidad. El gas se usa para calefacción, agua caliente y cocina; la electricidad, para la heladera, la iluminación, los electrodomésticos, los equipos electrónicos y, cada vez más, el aire acondicionado.',
        'Donde no hay red de gas, se usa gas envasado (garrafas), leña o electricidad para calefaccionar y cocinar, y eso cambia mucho las cuentas.',
      ]),
      clas('¿Qué energía suele usar cada cosa en una casa con red de gas?', { // e1
        'Gas': ['Estufa de tiro balanceado', 'Calefón o termotanque a gas', 'Hornallas de la cocina'],
        'Electricidad': ['Heladera', 'Lámparas', 'Aire acondicionado', 'Televisor'],
      }, 'En una casa con gas, la calefacción y el agua caliente suelen ser a gas. Eso importa: son justamente los usos más grandes.', { d: 1 }),
      teoria('Calor: el uso más grande', [
        'Si se suma toda la energía de un año, en muchas casas del centro y el sur del país el uso más grande es la calefacción, seguida por el agua caliente. Calentar aire y agua requiere muchísima energía.',
        'En la electricidad, los grandes consumos suelen ser la heladera (que funciona todo el año), el aire acondicionado en verano, los aparatos que calientan (pava, horno eléctrico, estufas eléctricas) y la suma de muchos aparatos chicos.',
      ], {
        datos: barras('Energía de una casa con gas en un año (ejemplo aproximado)', '% del total', [
          ['Calefacción', 50],
          ['Agua caliente', 20],
          ['Cocina', 8],
          ['Heladera', 7],
          ['Resto de la electricidad', 15],
        ], 'Ejemplo ilustrativo de una casa de clima templado. Varía mucho según la región y el tipo de casa.'),
      }),
      rank('En esa casa de ejemplo, ordená los usos de más a menos energía anual.', [ // e2
        ['Calefacción', '≈ 50 %'],
        ['Agua caliente', '≈ 20 %'],
        ['Cocina', '≈ 8 %'],
        ['Heladera', '≈ 7 %'],
      ], 'El calor —para el ambiente y para el agua— se lleva la mayor parte. Por eso ahí están los ahorros más grandes.', { d: 2 }),
      vf('En una casa con gas, apagar las luces es la forma más efectiva de bajar la energía total que usa la casa.', false, 'Apagar luces ayuda, pero la iluminación LED es un uso chico. La calefacción y el agua caliente pesan muchísimo más.', { // e3
        razones: ['+Porque la calefacción y el agua caliente pesan mucho más', '-Porque las luces no usan energía', '-Porque las luces usan más energía que la calefacción'],
        d: 2,
      }),
      teoria('Los pilotos y los consumos que no se ven', [
        'Algunos consumos pasan desapercibidos: el piloto de un termotanque o una estufa a gas queda encendido todo el día, aunque nadie use agua caliente ni calefacción. En verano, apagar los pilotos de las estufas que no se usan ahorra gas sin ningún esfuerzo.',
        'En la electricidad pasa algo parecido con el stand-by: televisores, decodificadores, cargadores y equipos de audio que consumen aunque estén "apagados".',
      ]),
      mult('¿Cuáles de estos consumos suceden aunque nadie esté usando el aparato? Marcá todos.', [ // e4
        '+El piloto de una estufa a gas en verano',
        '+Un decodificador en stand-by',
        '+Un cargador enchufado sin celular',
        '-Una pava eléctrica desenchufada',
        '-Una lámpara apagada con la llave',
      ], 'Lo que queda enchufado o encendido "por las dudas" consume todo el tiempo. Chico por hora, grande por año.', { d: 2 }),
      par('Uní cada uso con su mejor ahorro.', [ // e5
        ['Calefacción', 'Burletes y temperatura moderada'],
        ['Agua caliente', 'Duchas más cortas'],
        ['Heladera', 'Cerrarla bien y no poner cosas calientes'],
        ['Stand-by', 'Zapatilla con interruptor'],
      ], 'Cada uso tiene su palanca. Las más grandes están en el calor.', { d: 2 }),
      op('Una familia quiere bajar su consumo de gas en invierno. ¿Por dónde conviene empezar?', [ // e6
        'Por la calefacción y sus pérdidas',
        'Por la cocina: dejar de hacer guisos y sopas',
        ['Por el horno: usarlo solo los domingos', 'El horno usa gas, pero mucho menos que la calefacción en invierno.'],
        'Por la pava: calentar agua solo una vez por día',
      ], 'Elegir por impacto, como en el tronco: la calefacción es la mitad del consumo en muchas casas.', { d: 2 }),
      det('Leé estos consejos de una revista y marcá los que no tienen sentido o están mal.', [ // e7
        ['En verano, apagá los pilotos de las estufas.', false],
        ['Desenchufá la heladera de noche para ahorrar.', true, 'Se corta la cadena de frío y la comida se echa a perder; además al volver consume más.'],
        ['Revisá los burletes antes del invierno.', false],
        ['Dejá la estufa prendida con la ventana abierta para ventilar mejor.', true, 'Se tira el calor afuera. Para ventilar alcanza con abrir unos minutos.'],
      ], 'Un buen consejo ahorra sin arruinar la comida ni la salud.', { d: 3 }),
      cad('Armá la cadena de por qué el piloto de una estufa en verano es un derroche.', [ // e8
        'La estufa no se usa en verano',
        'El piloto sigue encendido todo el día',
        'Quema gas durante meses sin calentar nada útil',
        'Se paga ese gas y se emite CO₂ sin motivo',
      ], ['El piloto genera electricidad para la casa'], 'Un consumo chico por hora, multiplicado por todas las horas de un verano.', { d: 2 }),
      comp('Completá.', 'En muchas casas, el mayor consumo de energía es la [calefacción], seguida por el agua [caliente].', ['iluminación', 'fría', 'computadora'], 'Por eso los ahorros grandes están en el calor, no en las luces.', { d: 1 }),
      est('En esa casa de ejemplo, ¿qué porcentaje de toda la energía va a calefacción y agua caliente juntas?', 70, { min: 0, max: 100, paso: 5, unidad: '%' }, 'Alrededor del 70 %: la mitad para la calefacción y un quinto para el agua caliente. Calentar es lo que más energía pide.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Cuánto usa cada aparato', 'Potencia por horas: la cuenta que permite saber cuánto consume la heladera, el aire o el stand-by.', [
      teoria('La cuenta que ya sabés', [
        'La energía que usa un aparato es su potencia por el tiempo que funciona. Si un aire acondicionado consume 1 kW y funciona 6 horas, usa 6 kWh ese día. En un mes de 30 días, 180 kWh.',
        'La potencia figura en una etiqueta del aparato o en el manual, en watts (W). Para pasar a kW se divide por 1.000.',
      ]),
      ejemplo('El aire acondicionado en enero', 'Un aire acondicionado consume 1.000 W y funciona 6 horas por día durante 30 días.', [
        'Potencia: 1.000 W = 1 kW.',
        'Por día: 1 kW × 6 h = 6 kWh.',
        'Por mes: 6 kWh × 30 = 180 kWh.',
      ], '180 kWh en un mes solo de aire: puede ser tanto como todo el resto de la casa junto.'),
      numv(4, (i) => { // e1
        const w = [1000, 1300, 800, 1500][i];
        const h = [6, 4, 8, 5][i];
        const d = 30;
        return {
          enunciado: `Un aparato de ${w.toLocaleString('es-AR')} W funciona ${h} horas por día. ¿Cuántos kWh usa en ${d} días?`,
          valor: (w / 1000) * h * d,
          unidad: 'kWh',
          explicacion: `${(w / 1000).toLocaleString('es-AR')} kW × ${h} h × ${d} días = ${((w / 1000) * h * d).toLocaleString('es-AR')} kWh. Potencia en kW por horas por días.`,
        };
      }, { d: 2 }),
      teoria('Los aparatos que se prenden y apagan solos', [
        'La heladera no funciona a plena potencia todo el tiempo: su motor se prende y se apaga para mantener el frío. Por eso conviene mirar su consumo anual o diario, que figura en la etiqueta, en vez de su potencia. Una heladera eficiente usa del orden de 1 kWh por día.',
        'Con el aire acondicionado pasa algo parecido: los equipos inverter regulan su potencia en vez de prender y apagar, y suelen usar bastante menos energía.',
      ]),
      numv(3, (i) => { // e2
        const anual = [300, 450, 600][i];
        return {
          enunciado: `La etiqueta de una heladera dice que consume ${anual} kWh por año. ¿Cuántos kWh usa por mes, en promedio?`,
          valor: anual / 12,
          unidad: 'kWh por mes',
          dec: 1,
          explicacion: `${anual} ÷ 12 = ${(anual / 12).toLocaleString('es-AR')} kWh por mes. El consumo anual de la etiqueta es la forma más confiable de comparar heladeras.`,
        };
      }, { d: 2 }),
      teoria('Stand-by: poco por hora, mucho por año', [
        'Un aparato en stand-by puede consumir de 1 a 10 W, o más en equipos viejos. Parece nada, pero funciona las 8.760 horas del año. Diez aparatos con 5 W de stand-by cada uno suman 50 W constantes: unos 438 kWh por año.',
        'Según la Agencia Internacional de Energía, el stand-by llegó a representar una parte de la electricidad de los hogares de entre el 5 y el 10 % en muchos países.',
      ]),
      numv(3, (i) => { // e3
        const w = [30, 50, 20][i];
        return {
          enunciado: `Los aparatos en stand-by de una casa suman ${w} W constantes. ¿Cuántos kWh usan en un año de 8.760 horas?`,
          valor: Math.round((w / 1000) * 8760 * 10) / 10,
          unidad: 'kWh por año',
          dec: 1,
          explicacion: `${(w / 1000).toLocaleString('es-AR')} kW × 8.760 h = ${(Math.round((w / 1000) * 8760 * 10) / 10).toLocaleString('es-AR')} kWh por año. Poco por hora, mucho por año.`,
        };
      }, { d: 3 }),
      rank('Ordená por consumo mensual típico, de más a menos (valores aproximados).', [ // e4
        ['Aire acondicionado 6 h diarias en verano', '≈ 180 kWh'],
        ['Heladera con freezer', '≈ 30-45 kWh'],
        ['Stand-by de toda la casa', '≈ 15-35 kWh'],
        ['Cinco lámparas LED 5 h diarias', '≈ 7 kWh'],
      ], 'El aire en verano es un gigante. El stand-by puede competir con la heladera. Las LED son chicas.', { d: 3 }),
      vf('Un aparato de mucha potencia siempre consume más energía por mes que uno de poca potencia.', false, 'Depende de cuántas horas funciona. Un secador de pelo de 2.000 W usado 5 minutos por día consume menos que una heladera que funciona todo el día.', { // e5
        razones: ['+Porque la energía depende también de las horas de uso', '-Porque la potencia es la energía mensual', '-Porque los aparatos de mucha potencia no consumen'],
        d: 2,
      }),
      numv(3, (i) => { // e6
        const w = [2000, 1800, 2200][i];
        const min = [5, 10, 6][i];
        return {
          enunciado: `Un secador de pelo de ${w.toLocaleString('es-AR')} W se usa ${min} minutos por día. ¿Cuántos kWh usa en 30 días?`,
          valor: Math.round((w / 1000) * (min / 60) * 30 * 100) / 100,
          unidad: 'kWh',
          dec: 2,
          tol: 0.05,
          explicacion: `${(w / 1000).toLocaleString('es-AR')} kW × ${(min / 60).toLocaleString('es-AR', { maximumFractionDigits: 3 })} h × 30 = ${(Math.round((w / 1000) * (min / 60) * 30 * 100) / 100).toLocaleString('es-AR')} kWh. Mucha potencia, poco tiempo.`,
        };
      }, { d: 3 }),
      op('¿Qué dato conviene mirar para comparar el consumo de dos heladeras?', [ // e7
        'El consumo anual en kWh de la etiqueta',
        'La potencia del motor en watts',
        ['El tamaño en litros solamente', 'El tamaño importa, pero dos heladeras iguales pueden consumir muy distinto.'],
        'El color y el material de la puerta',
      ], 'Como el motor se prende y apaga, la potencia sola no dice cuánto usa. El consumo anual sí.', { d: 2 }),
      mult('¿Qué reduce el consumo de una heladera? Marcá todo lo correcto.', [ // e8
        '+Cerrar bien la puerta y no dejarla abierta',
        '+Dejar espacio atrás para que ventile',
        '+No meter comida caliente',
        '+Revisar que el burlete cierre bien',
        '-Ponerla al lado del horno',
      ], 'La heladera saca calor de adentro y lo tira afuera por atrás. Si le entra calor o no puede tirarlo, trabaja más.', { d: 2 }),
      comp('Completá.', 'La energía de un aparato es su [potencia] por las [horas] de uso; el stand-by consume poco por hora pero mucho por [año].', ['tamaño', 'watts', 'minuto'], 'La cuenta básica de la energía y su trampa más común.', { d: 2 }),
      det('Leé este razonamiento y marcá los errores.', [ // e10
        ['El aire tiene 1.000 W y lo uso 6 horas: son 6 kWh por día.', false],
        ['La heladera tiene un motor de 150 W, así que usa 150 × 24 = 3,6 kWh por día.', true, 'El motor se prende y se apaga: el consumo real es mucho menor, mejor mirar la etiqueta.'],
        ['El stand-by de 5 W por aparato no importa en un año.', true, 'Varios aparatos por 8.760 horas suman cientos de kWh.'],
        ['El secador de 2.000 W usado 5 minutos consume poco por mes.', false],
      ], 'Potencia por tiempo, pero con el tiempo real de funcionamiento.', { d: 3 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Leer la factura de luz', 'Qué dice cada parte, cómo comparar períodos y cómo pasar de la factura a kWh por día.', [
      teoria('Las partes de una factura', [
        'Una factura de electricidad tiene el período facturado (las fechas entre dos lecturas del medidor), la lectura anterior y la actual, el consumo en kWh (la resta de las dos lecturas), los cargos (uno fijo y uno variable por kWh) y los impuestos.',
        'El número clave para el ambiente es el consumo en kWh. El monto en pesos cambia por tarifas, subsidios e impuestos; los kWh dicen cuánta energía usó la casa.',
      ]),
      num('El medidor marcaba 45.320 kWh en la lectura anterior y 45.680 en la actual. ¿Cuántos kWh se consumieron?', 360, 'kWh', '45.680 − 45.320 = 360 kWh. El consumo es la diferencia entre las dos lecturas.', { d: 1 }),
      teoria('Comparar bien', [
        'Para comparar dos facturas conviene pasar a kWh por día, porque los períodos no siempre tienen la misma cantidad de días. También conviene comparar con el mismo período del año anterior: julio con julio, enero con enero, porque el clima cambia mucho el consumo.',
        'Muchas facturas traen un gráfico con los consumos de los últimos meses: es la herramienta más simple para ver si un cambio de hábito funcionó.',
      ]),
      numv(3, (i) => { // e2
        const kwh = [360, 420, 250][i];
        const dias = [60, 61, 30][i];
        return {
          enunciado: `Una factura marca ${kwh} kWh en un período de ${dias} días. ¿Cuántos kWh por día usó la casa? Redondeá a un decimal.`,
          valor: Math.round((kwh / dias) * 10) / 10,
          unidad: 'kWh por día',
          dec: 1,
          tol: 0.1,
          explicacion: `${kwh} ÷ ${dias} ≈ ${(Math.round((kwh / dias) * 10) / 10).toLocaleString('es-AR')} kWh por día. Así se pueden comparar períodos de distinta duración.`,
        };
      }, { d: 2 }),
      op('¿Con qué conviene comparar el consumo de la factura de enero para saber si la casa ahorró?', [ // e3
        'Con el consumo de enero del año anterior',
        'Con el consumo de julio del mismo año',
        ['Con el monto en pesos de diciembre', 'El monto cambia por tarifas e impuestos; y diciembre tiene otro clima.'],
        'Con la factura de enero de un vecino',
      ], 'Mismo mes, mismo clima aproximado. Así la diferencia se explica por los hábitos, no por el tiempo.', { d: 2 }),
      vf('Si la factura de este mes cuesta más pesos que la anterior, seguro la casa usó más energía.', false, 'Puede haber subido la tarifa o cambiado un subsidio. Para saber si se usó más energía hay que mirar los kWh, y mejor por día.', { // e4
        razones: ['+Porque el precio puede cambiar aunque el consumo no', '-Porque los pesos y los kWh son siempre proporcionales', '-Porque las facturas no dicen los kWh'],
        d: 2,
      }),
      ejemplo('Comparar dos veranos', 'Enero del año pasado: 420 kWh en 31 días. Enero de este año: 360 kWh en 31 días. La familia cambió el aire acondicionado a 24 °C y cerró cortinas de día.', [
        'Año pasado: 420 ÷ 31 ≈ 13,5 kWh por día.',
        'Este año: 360 ÷ 31 ≈ 11,6 kWh por día.',
        'Diferencia: 13,5 − 11,6 = 1,9 kWh por día, un 14 % menos.',
      ], 'Mismo mes, misma cantidad de días: el ahorro se debe a los hábitos. Así se verifica que un cambio funciona.'),
      numv(3, (i) => { // e5
        const a = [420, 500, 300][i];
        const b = [360, 400, 270][i];
        return {
          enunciado: `En enero del año pasado la casa usó ${a} kWh y este enero ${b} kWh (mismos días). ¿En qué porcentaje bajó el consumo? Redondeá al entero.`,
          valor: Math.round(((a - b) / a) * 100),
          unidad: '%',
          tol: 1,
          explicacion: `Bajó ${a - b} kWh sobre ${a}: ${a - b} ÷ ${a} × 100 ≈ ${Math.round(((a - b) / a) * 100)} %. Siempre sobre el valor original.`,
        };
      }, { d: 3 }),
      ord('Ordená los pasos para revisar si un cambio de hábito funcionó.', [ // e6
        'Anotar el consumo en kWh del mismo mes del año anterior',
        'Aplicar el cambio de hábito durante el mes',
        'Leer el consumo en kWh de la nueva factura',
        'Pasar los dos consumos a kWh por día',
        'Comparar y calcular la diferencia en porcentaje',
      ], 'Medir antes, cambiar, medir después y comparar en la misma unidad: el método del tronco aplicado a la factura.', { d: 2, extremos: ['Primero', 'Último'] }),
      clas('¿Este dato de la factura dice cuánta energía usó la casa o no?', { // e7
        'Dice cuánta energía usó': ['Consumo en kWh', 'Lecturas del medidor', 'Gráfico de consumos por mes'],
        'No dice cuánta energía usó': ['Monto total en pesos', 'Impuestos provinciales', 'Fecha de vencimiento'],
      }, 'La energía está en los kWh y las lecturas. Lo demás es plata y administración.', { d: 1 }),
      par('Uní cada término de la factura con su significado.', [ // e8
        ['Período', 'Fechas entre dos lecturas'],
        ['Lectura actual', 'Número que marca hoy el medidor'],
        ['Consumo', 'Diferencia entre lecturas en kWh'],
        ['Cargo fijo', 'Monto que se paga aunque no se consuma'],
      ], 'Cuatro términos que alcanzan para entender cualquier factura de electricidad.', { d: 2 }),
      det('Leé estas conclusiones sobre una factura y marcá las equivocadas.', [ // e9
        ['Este bimestre usamos 360 kWh, unos 6 kWh por día.', false],
        ['Julio consumió más que enero: seguro alguien dejó luces prendidas.', true, 'Puede deberse al clima; hay que comparar julio con julio.'],
        ['La factura vino más cara, así que usamos más kWh.', true, 'El precio puede subir por la tarifa aunque el consumo baje.'],
        ['Comparamos con el mismo bimestre del año pasado y bajamos un 10 %.', false],
      ], 'Comparar bien es mismo período, misma unidad, y kWh en vez de pesos.', { d: 3 }),
      comp('Completá.', 'Para comparar facturas conviene pasar a kWh por [día] y comparar con el mismo [mes] del año anterior.', ['peso', 'vecino', 'minuto'], 'Así se ve el efecto de los hábitos y no el del clima o el de la tarifa.', { d: 1 }),
      est('Estimá: una casa usa 6 kWh por día. ¿Cuántos kWh usa por año?', 2190, { min: 500, max: 5000, paso: 10, unidad: 'kWh' }, '6 × 365 = 2.190 kWh por año. Un orden de magnitud típico para una casa argentina con gas.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('La etiqueta de eficiencia', 'Las letras y los números de la etiqueta, y cómo usarlos para elegir un aparato que gaste menos toda su vida.', [
      teoria('Qué dice la etiqueta', [
        'En Argentina, muchos aparatos se venden con una etiqueta de eficiencia energética: heladeras, lavarropas, aires acondicionados, lámparas, termotanques y otros. Tiene una escala de letras, de la más eficiente (A o sus variantes con signos +) a la menos eficiente, y el consumo de energía estimado, normalmente por año.',
        'La letra sirve para una comparación rápida; el consumo en kWh por año sirve para hacer cuentas. Dos heladeras con la misma letra pueden consumir distinto si tienen distinto tamaño.',
      ]),
      op('En la etiqueta de una heladera, ¿qué dato permite calcular cuánto va a consumir?', [ // e1
        'El consumo de energía en kWh por año',
        'La letra de la clase de eficiencia',
        ['El nombre del fabricante', 'La marca no dice cuánto consume: la etiqueta sí.'],
        'El volumen del freezer en litros',
      ], 'La letra orienta; el número es lo que se multiplica por el precio del kWh o por años de uso.', { d: 1 }),
      teoria('El precio de toda la vida', [
        'Un aparato se paga dos veces: cuando se compra y cada mes en la factura. Una heladera dura 10 o 15 años. Si una consume 200 kWh por año más que otra, en 12 años son 2.400 kWh más.',
        'Por eso conviene comparar el costo total: precio de compra más energía durante la vida útil. A veces el aparato un poco más caro es el más barato.',
      ]),
      ejemplo('Dos heladeras', 'Heladera A: consume 300 kWh por año. Heladera B: consume 500 kWh por año. Las dos duran 12 años.', [
        'Diferencia anual: 500 − 300 = 200 kWh.',
        'En 12 años: 200 × 12 = 2.400 kWh.',
        'Si cada kWh cuesta $100, son $240.000 de diferencia en energía.',
      ], 'Si la heladera A cuesta menos de $240.000 más que la B, termina siendo más barata. Y además emite menos.'),
      numv(3, (i) => { // e2
        const a = [300, 250, 350][i];
        const b = [500, 400, 450][i];
        const anos = [12, 10, 15][i];
        return {
          enunciado: `Una heladera consume ${a} kWh por año y otra ${b}. Si duran ${anos} años, ¿cuántos kWh más usa la menos eficiente en toda su vida?`,
          valor: (b - a) * anos,
          unidad: 'kWh',
          explicacion: `(${b} − ${a}) × ${anos} = ${((b - a) * anos).toLocaleString('es-AR')} kWh. La diferencia de consumo se repite todos los años de uso.`,
        };
      }, { d: 2 }),
      numv(3, (i) => { // e3
        const dif = [2400, 1500, 1500][i];
        const precio = [100, 120, 150][i];
        return {
          enunciado: `Una heladera usa ${dif.toLocaleString('es-AR')} kWh más que otra en toda su vida. Si el kWh cuesta $${precio}, ¿cuántos pesos más cuesta usarla?`,
          valor: dif * precio,
          unidad: '$',
          explicacion: `${dif.toLocaleString('es-AR')} × ${precio} = $${(dif * precio).toLocaleString('es-AR')}. Ese es el "precio escondido" de la heladera menos eficiente.`,
        };
      }, { d: 3 }),
      vf('Si dos aparatos tienen la misma letra de eficiencia, consumen lo mismo.', false, 'La letra compara con aparatos de su tipo y tamaño. Una heladera grande clase A puede consumir más que una chica clase A. Para comparar, el número de kWh.', { // e4
        razones: ['+Porque el consumo también depende del tamaño y las funciones', '-Porque la letra indica el consumo exacto', '-Porque las etiquetas no dicen el consumo'],
        d: 3,
      }),
      mult('¿Qué conviene mirar antes de comprar un aire acondicionado? Marcá todo lo útil.', [ // e5
        '+La clase de eficiencia de la etiqueta',
        '+El consumo de energía estimado',
        '+Si es inverter',
        '+Que la potencia sea adecuada al tamaño del ambiente',
        '-Que sea el más potente disponible, por las dudas',
      ], 'Un equipo sobredimensionado cuesta más, consume de más y prende y apaga seguido. Tamaño justo y eficiente.', { d: 2 }),
      cad('Armá la cadena de cómo la etiqueta de eficiencia cambia un mercado entero.', [ // e6
        'La etiqueta muestra cuánto consume cada aparato',
        'Los compradores eligen más los eficientes',
        'Los fabricantes compiten por mejores letras',
        'Los aparatos del mercado se vuelven más eficientes',
      ], ['La etiqueta obliga a cada casa a consumir menos'], 'La etiqueta no obliga a nadie, pero cambia lo que se elige, y eso cambia lo que se fabrica. Una palanca de sistema, como en el tronco.', { d: 3 }),
      rank('Ordená estos aparatos por su costo total en 12 años, de más a menos. Precio de compra más energía a $100 por kWh.', [ // e7
        ['Heladera B: $500.000 y 500 kWh por año', '$1.100.000'],
        ['Heladera A: $700.000 y 300 kWh por año', '$1.060.000'],
        ['Heladera C: $800.000 y 200 kWh por año', '$1.040.000'],
      ], 'La más barata en la vidriera es la más cara en la vida. Pasa seguido con los aparatos que funcionan todo el día.', { d: 4 }),
      clas('¿Para qué aparato la etiqueta de eficiencia pesa más en la decisión?', { // e8
        'Pesa mucho (funcionan muchas horas)': ['Heladera', 'Aire acondicionado', 'Termotanque'],
        'Pesa poco (funcionan pocas horas)': ['Secador de pelo', 'Batidora', 'Tostadora'],
      }, 'Cuanto más horas funciona un aparato, más importa su eficiencia. En los que se usan minutos, casi no cambia la cuenta.', { d: 3 }),
      det('Leé lo que dice un vendedor y marcá lo engañoso.', [ // e9
        ['Esta heladera es clase A y consume 280 kWh por año.', false],
        ['La otra es más barata, así que es la que más le conviene.', true, 'Hay que sumar la energía de toda su vida, no solo el precio.'],
        ['La etiqueta es obligatoria para las heladeras.', false],
        ['Todas las clase A consumen exactamente lo mismo.', true, 'La letra depende del tipo y tamaño; el consumo en kWh puede variar.'],
      ], 'El precio de vidriera y la letra sola pueden engañar. El kWh por año, no.', { d: 3 }),
      comp('Completá.', 'Un aparato se paga al [comprarlo] y cada mes en la [factura]; por eso conviene comparar el costo [total].', ['venderlo', 'garantía', 'inicial'], 'La idea del costo de toda la vida, en una línea.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Calor y frío sin derrochar', 'Termostatos, burletes, cortinas y sol: cómo estar a gusto usando mucha menos energía.', [
      teoria('La casa como un balde con agujeros', [
        'Calefaccionar en invierno es como llenar un balde con agujeros: el calor se escapa por el techo, las paredes, las ventanas y las rendijas. La estufa repone lo que se pierde. Tapar agujeros es más efectivo que poner una estufa más grande.',
        'Las rendijas de puertas y ventanas dejan entrar aire frío; los burletes las cierran. Los techos sin aislar pierden mucho calor, porque el aire caliente sube. Las ventanas de vidrio simple pierden más que las paredes.',
      ]),
      mult('¿Por dónde se escapa el calor de una casa en invierno? Marcá todo lo correcto.', [ // e1
        '+Por el techo, sobre todo si no está aislado',
        '+Por las rendijas de puertas y ventanas',
        '+Por los vidrios simples de las ventanas',
        '+Por las paredes',
        '-Por las lámparas LED encendidas',
      ], 'Techo, paredes, ventanas y rendijas: los cuatro agujeros del balde.', { d: 1 }),
      teoria('La temperatura justa', [
        'La temperatura a la que se pone la calefacción importa mucho: cuanto más diferencia hay entre adentro y afuera, más rápido se escapa el calor. Se suele recomendar alrededor de 20 °C en invierno y, para el aire acondicionado, alrededor de 24 °C en verano.',
        'Cada grado de más en la calefacción, o de menos en el aire, aumenta el consumo en varios puntos porcentuales. Abrigarse un poco más adentro o usar ventilador junto con el aire son cambios chicos con efecto grande.',
      ], { destacado: { valor: '20 °C / 24 °C', texto: 'son las temperaturas recomendadas para calefacción en invierno y aire en verano.' } }),
      op('¿Por qué cuesta más energía mantener la casa a 24 °C que a 20 °C en invierno?', [ // e2
        'Porque con más diferencia, el calor se escapa más rápido',
        'Porque a más de 20 °C las estufas funcionan peor y se rompen',
        ['Porque el aire caliente pesa más', 'El aire caliente es más liviano y sube; lo que importa es la diferencia de temperatura.'],
        'Porque la tarifa de gas se cobra más cara arriba de 20 °C',
      ], 'La pérdida de calor crece con la diferencia de temperatura. Cuatro grados más pueden significar un aumento importante del consumo.', { d: 2 }),
      vf('Poner el aire acondicionado a 17 °C enfría la habitación más rápido que ponerlo a 24 °C.', false, 'La mayoría de los equipos enfría a la misma velocidad; lo que cambia es hasta dónde sigue enfriando. A 17 °C sigue trabajando mucho más tiempo y gasta mucho más.', { // e3
        razones: ['+Porque la velocidad es la misma; solo sigue enfriando hasta más abajo', '-Porque a 17 °C el equipo se apaga solo', '-Porque a 24 °C el equipo no enfría'],
        d: 3,
      }),
      teoria('El sol como aliado', [
        'En invierno, abrir cortinas en las ventanas donde da el sol durante el día deja entrar calor gratis; cerrarlas al atardecer ayuda a que no se escape. En verano, al revés: cerrar persianas y cortinas donde da el sol evita que la casa se caliente, y ventilar de noche con aire más fresco la enfría.',
        'Árboles de hoja caduca del lado del sol dan sombra en verano y dejan pasar el sol en invierno. Es un ejemplo de diseño que trabaja con el clima en vez de contra él.',
      ]),
      clas('¿Esta medida es para invierno o para verano?', { // e4
        'Invierno': ['Abrir cortinas donde da el sol de día', 'Cerrar cortinas gruesas al atardecer', 'Colocar burletes en las ventanas'],
        'Verano': ['Cerrar persianas donde da el sol', 'Ventilar de noche con aire fresco', 'Usar ventilador de techo con el aire a 24 °C'],
      }, 'Las mismas cortinas y ventanas sirven en las dos estaciones, usadas al revés.', { d: 2 }),
      cad('Armá la cadena de por qué un burlete ahorra gas.', [ // e5
        'El burlete tapa la rendija de la ventana',
        'Entra menos aire frío de afuera',
        'La habitación pierde menos calor',
        'La estufa funciona menos tiempo para mantener la temperatura',
        'Se quema menos gas',
      ], ['El burlete calienta el aire de la habitación'], 'Una medida barata que actúa sobre la pérdida, no sobre la fuente. Tapar agujeros del balde.', { d: 2 }),
      par('Uní cada problema con su solución.', [ // e6
        ['Rendijas en la puerta', 'Burlete'],
        ['Techo sin aislar', 'Aislante en el entretecho'],
        ['Sol fuerte en verano sobre la ventana', 'Persiana o toldo exterior'],
        ['Aire acondicionado a 18 °C', 'Subirlo a 24 °C y usar ventilador'],
      ], 'Cada pérdida tiene su tapón. Algunos son gratis, otros una inversión.', { d: 2 }),
      teoria('Ventilar sin tirar el calor', [
        'Ventilar es necesario: renueva el aire, saca humedad y, con estufas a gas, es una cuestión de seguridad. Las estufas y calefones que no son de tiro balanceado necesitan ventilación permanente, porque pueden producir monóxido de carbono, un gas invisible y mortal.',
        'Para ventilar sin perder calor conviene abrir bien las ventanas durante unos pocos minutos, en vez de dejarlas entreabiertas durante horas.',
      ]),
      op('¿Cuál es la forma más eficiente de ventilar una habitación en invierno?', [ // e7
        'Abrir bien la ventana unos pocos minutos',
        'Dejar la ventana entreabierta toda la tarde',
        ['No ventilar nunca para no perder calor', 'Ventilar es necesario por la salud, y con estufas a gas, por seguridad.'],
        'Abrir la puerta de entrada durante una hora',
      ], 'Unos minutos con la ventana bien abierta renuevan el aire sin enfriar paredes y muebles, que guardan el calor.', { d: 2 }),
      vf('Si una casa tiene estufas a gas que no son de tiro balanceado, tapar todas las rejillas de ventilación es una buena forma de ahorrar.', false, 'Es peligroso: esas estufas necesitan aire y pueden producir monóxido de carbono. Las rejillas de ventilación nunca se tapan.', { // e8
        razones: ['+Porque sin ventilación se puede acumular monóxido de carbono', '-Porque las rejillas no dejan pasar aire', '-Porque tapar rejillas aumenta el consumo de luz'],
        d: 3,
      }),
      det('Leé estos consejos y marcá los que son peligrosos o equivocados.', [ // e9
        ['Poné burletes en las ventanas antes del invierno.', false],
        ['Tapá las rejillas de ventilación para que no entre frío.', true, 'Las rejillas son obligatorias con artefactos a gas: evitan intoxicaciones por monóxido de carbono.'],
        ['Poné el aire a 16 °C para que enfríe más rápido.', true, 'No enfría más rápido: solo sigue enfriando más y gasta mucho más.'],
        ['Cerrá persianas donde da el sol en verano.', false],
      ], 'Ahorrar energía nunca a costa de la seguridad: las rejillas no se tocan.', { d: 3 }),
      comp('Completá.', 'Se recomienda calefaccionar a unos [20] °C y usar el aire a unos [24] °C; cada grado de diferencia [aumenta] el consumo.', ['26', '16', 'reduce'], 'Dos números para recordar y una regla general.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: la energía en casa', 'Usos, aparatos, factura, etiqueta y clima de la casa, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: la factura de los Giménez', 'Una familia de Rosario recibe una factura de verano muy alta. Encontrá dónde se va la energía y armá el plan.', [
      teoria('La casa de los Giménez', [
        'Los Giménez son cuatro. Su factura de enero marca 540 kWh en 30 días; la de enero del año anterior, 450 kWh en 30 días. Este año compraron un segundo aire acondicionado de 1.200 W que usan 6 horas por día, y lo ponen a 18 °C.',
        'Su heladera tiene 18 años y según una medición consume 2 kWh por día. En la casa hay un televisor, un decodificador, una consola y dos cargadores enchufados todo el tiempo, con unos 40 W de stand-by en total.',
      ]),
      num('¿Cuántos kWh por mes usa el segundo aire acondicionado? (30 días)', 216, 'kWh', '1,2 kW × 6 h × 30 días = 216 kWh por mes. Solo ese equipo es casi la mitad de la factura.', { ctx: 'Aire de 1.200 W, 6 horas por día, 30 días.', d: 2 }),
      num('¿En qué porcentaje subió el consumo respecto de enero del año anterior?', 20, '%', 'Subió 540 − 450 = 90 kWh sobre 450: 90 ÷ 450 × 100 = 20 %.', { ctx: 'Enero pasado: 450 kWh. Este enero: 540 kWh. Mismos días.', d: 2 }),
      num('¿Cuántos kWh por mes usa el stand-by de la casa? (40 W, 30 días de 24 horas)', 28.8, 'kWh', '0,04 kW × 24 h × 30 = 28,8 kWh por mes. Casi lo mismo que una heladera nueva y eficiente.', { ctx: '40 W de stand-by constante.', dec: 1, d: 3 }),
      rank('Ordená las medidas posibles según cuántos kWh por mes ahorrarían, de más a menos (estimaciones).', [ // e4
        ['Subir los aires de 18 °C a 24 °C y cerrar persianas', '≈ 60-90 kWh'],
        ['Cambiar la heladera vieja (2 kWh/día) por una de 1 kWh/día', '≈ 30 kWh'],
        ['Cortar el stand-by con una zapatilla con interruptor', '≈ 20-25 kWh'],
        ['Cambiar las 3 lámparas que quedaban por LED', '≈ 5 kWh'],
      ], 'El aire es el gigante del verano. La heladera y el stand-by vienen después y suman. Las lámparas, al final.', { d: 4 }),
      op('La familia quiere un solo cambio para este mismo mes, sin gastar plata. ¿Cuál conviene?', [ // e5
        'Aires a 24 °C y persianas cerradas de día',
        'Comprar una heladera nueva de clase A esta semana',
        ['Cambiar todas las lámparas a LED', 'Ya casi todas son LED: el ahorro sería mínimo comparado con el aire.'],
        'Instalar paneles solares en todo el techo de la casa',
      ], 'Sin gastar plata y con efecto inmediato: el termostato y las persianas atacan el uso más grande del verano.', { d: 3 }),
      numv(3, (i) => { // e6
        const precio = [100, 120, 150][i];
        return {
          enunciado: `La heladera vieja consume 2 kWh por día y una nueva consumiría 1 kWh por día. Con el kWh a $${precio}, ¿cuántos pesos por año ahorraría la nueva? (365 días)`,
          valor: 365 * precio,
          unidad: '$',
          explicacion: `Ahorra 1 kWh por día: 365 kWh por año × $${precio} = $${(365 * precio).toLocaleString('es-AR')} por año. En 10 años de vida útil, diez veces eso.`,
        };
      }, { d: 3 }),
      det('La familia escribe su plan. Marcá lo equivocado.', [ // e7
        ['Vamos a poner los aires a 24 °C y usar el ventilador de techo.', false],
        ['Desenchufamos la heladera de noche para compensar.', true, 'Se corta el frío, se arruina la comida y al volver consume más.'],
        ['Juntamos los aparatos del stand-by en una zapatilla con interruptor.', false],
        ['Comparamos la próxima factura con la de diciembre para ver el ahorro.', true, 'Hay que comparar con el mismo mes del año anterior y en kWh por día.'],
      ], 'Un buen plan ataca el uso grande, no pone en riesgo la comida y se verifica comparando bien.', { d: 4 }),
    ]),
  ],
});
