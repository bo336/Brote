import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// TRONCO 2 — Medir para entender.
// La alfabetización numérica que el resto del árbol da por sentada: unidades,
// energía contra potencia, CO₂ equivalente, números por persona y por año, y
// órdenes de magnitud. Sin esto, las unidades intermedias de Energía, Agua o
// Alimentación serían cuentas mágicas. Cada sesión tiene un ejemplo resuelto
// ANTES del primer cálculo.

export default unidad({
  slug: 'tronco-2',
  rama: 'tronco',
  orden: 2,
  nivel: 0,
  titulo: 'Medir para entender',
  bajada: 'Litros, kilovatios hora, kilos de CO₂: aprendé a leer y comparar los números del ambiente sin perderte en el camino.',
  objetivos: [
    'Convertir entre las unidades que más aparecen: litros, metros cúbicos, gramos, kilos y toneladas',
    'Distinguir potencia (kW) de energía (kWh) y calcular cuánto consume un aparato',
    'Explicar qué es el CO₂ equivalente y por qué el metano pesa más que el CO₂',
    'Leer un dato por persona, por año o por unidad sin confundirlo con un total',
    'Comparar acciones por orden de magnitud para saber qué pesa de verdad',
  ],
  repasa: ['tronco-1'],
  fuentes: ['ipcc-ar6', 'ipcc-ar6-syr', 'owid-co2', 'owid-energia', 'iea-eficiencia', 'wynes-nicholas-2017', 'inventario-gei-ar'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Las unidades de todos los días', 'Litros, kilos y metros cúbicos: la base para leer cualquier número del ambiente.', [
      teoria('Un número sin unidad no dice nada', [
        'Si alguien te dice "gastamos 150", no sabés si son 150 litros, 150 kilos o 150 pesos. En ambiente los números vienen siempre con una unidad, y la unidad es la mitad del dato.',
        'Las más comunes son tres familias: volumen (litros y metros cúbicos, para el agua), masa (gramos, kilos y toneladas, para residuos, alimentos y emisiones) y energía (kilovatios hora, para la electricidad).',
      ], { lista: ['Volumen: 1 litro = 1.000 mililitros · 1 metro cúbico (m³) = 1.000 litros', 'Masa: 1 kilo = 1.000 gramos · 1 tonelada = 1.000 kilos', 'Energía: 1 kilovatio hora (kWh) = 1.000 vatios hora (Wh)'] }),
      par('Uní cada cantidad con la unidad que tiene sentido.', [
        ['El agua de una ducha', 'Litros'],
        ['La basura de un mes en tu casa', 'Kilos'],
        ['La electricidad de la factura', 'Kilovatios hora (kWh)'],
        ['La distancia a la escuela', 'Kilómetros'],
      ], 'Cada magnitud tiene su unidad. Mezclarlas es el error más común al leer un dato ambiental: "litros de CO₂" o "kilos de electricidad" no existen.', { d: 1 }),
      teoria('El prefijo multiplica', [
        'Los prefijos son atajos para no escribir ceros. "Kilo" significa mil: un kilómetro son mil metros, un kilogramo mil gramos, un kilovatio mil vatios. "Mili" significa milésima: un mililitro es la milésima parte de un litro.',
        '"Mega" es un millón y "giga" mil millones. Por eso una central eléctrica se mide en megavatios y un país en gigavatios hora: son las mismas unidades con prefijos más grandes.',
      ], { destacado: { valor: 'k = 1.000', texto: 'kilo multiplica por mil: 3 kWh son 3.000 Wh, y 2 kg son 2.000 g.' } }),
      comp('Completá las equivalencias.', '1 metro cúbico son [1.000 litros], y 1 tonelada son [1.000 kilos].', ['100 litros', '10 kilos', '1.000.000 litros'], 'Metro cúbico y tonelada son las "unidades grandes" del agua y de la masa. Las dos equivalen a mil de la unidad chica, así que se aprenden juntas.', { d: 1 }),
      ejemplo('Pasar de mililitros a litros', 'Una canilla gotea y en una hora llena un vaso de 250 mililitros. ¿Cuántos litros son en un día?', [
        'En un día hay 24 horas: 250 ml × 24 = 6.000 ml.',
        'Para pasar a litros se divide por mil: 6.000 ÷ 1.000 = 6 litros.',
      ], 'La canilla pierde 6 litros por día. Primero se hace la cuenta en la unidad cómoda y al final se convierte.'),
      numv(4, (i) => {
        const ml = [500, 750, 300, 1200][i];
        return {
          enunciado: `Una botella tiene ${ml.toLocaleString('es-AR')} mililitros. ¿Cuántos litros son?`,
          valor: ml / 1000,
          unidad: 'litros',
          dec: 2,
          explicacion: `Mililitro es la milésima parte de un litro: ${ml.toLocaleString('es-AR')} ÷ 1.000 = ${(ml / 1000).toLocaleString('es-AR')} litros.`,
        };
      }, { d: 1 }),
      numv(4, (i) => {
        const m3 = [12, 18, 7.5, 25][i];
        return {
          enunciado: `La factura del agua de una casa marca ${m3.toLocaleString('es-AR')} m³ en el mes. ¿Cuántos litros son?`,
          valor: m3 * 1000,
          unidad: 'litros',
          explicacion: `Cada metro cúbico son 1.000 litros: ${m3.toLocaleString('es-AR')} × 1.000 = ${(m3 * 1000).toLocaleString('es-AR')} litros.`,
        };
      }, { d: 2 }),
      ord('Ordená de menor a mayor.', [
        '1 mililitro',
        '1 litro',
        '1 metro cúbico',
        '1 millón de litros',
      ], 'Cada salto es por mil: mil mililitros hacen un litro, mil litros un metro cúbico, y mil metros cúbicos un millón de litros.', { d: 2, extremos: ['Menor', 'Mayor'] }),
      vf('3,5 kilos es lo mismo que 3.500 gramos.', true, 'Un kilo son mil gramos, así que 3,5 × 1.000 = 3.500 gramos. La coma decimal corre tres lugares.', {
        razones: ['+Porque kilo multiplica por mil', '-Porque kilo multiplica por cien', '-Porque gramos y kilos son lo mismo'],
        d: 1,
      }),
      numv(3, (i) => {
        const kg = [2400, 850, 12500][i];
        return {
          enunciado: `Un barrio junta ${kg.toLocaleString('es-AR')} kilos de papel para reciclar en un año. ¿Cuántas toneladas son?`,
          valor: kg / 1000,
          unidad: 'toneladas',
          dec: 2,
          explicacion: `Una tonelada son 1.000 kilos: ${kg.toLocaleString('es-AR')} ÷ 1.000 = ${(kg / 1000).toLocaleString('es-AR')} toneladas.`,
        };
      }, { d: 2 }),
      det('Un compañero hizo estas cuentas. Marcá las que están mal.', [
        ['2 litros son 2.000 mililitros.', false],
        ['5 metros cúbicos son 500 litros.', true, 'Un metro cúbico son 1.000 litros: 5 m³ son 5.000 litros.'],
        ['1,5 toneladas son 1.500 kilos.', false],
        ['300 gramos son 3 kilos.', true, 'Hay que dividir por mil: 300 g son 0,3 kg.'],
      ], 'Los errores más frecuentes son correr la coma para el lado equivocado o usar 100 en lugar de 1.000.', { d: 3 }),
      op('Un informe dice que una ciudad "consume 450 de agua por día". ¿Qué le falta al dato?', [
        'La unidad: pueden ser litros, metros cúbicos o millones',
        'Nada, el número alcanza para entenderlo y compararlo',
        ['El año exacto en que se hizo la medición', 'El año importa, pero antes que eso falta saber qué se está midiendo.'],
        'La cantidad de habitantes del país entero',
      ], 'Sin unidad, 450 puede ser un consumo razonable por persona o un número gigante para toda la ciudad. Pedir la unidad es la primera pregunta frente a cualquier dato.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Potencia y energía: kW y kWh', 'La diferencia que confunde a casi todos, y la cuenta que explica tu factura de luz.', [
      teoria('Potencia es qué tan rápido, energía es cuánto', [
        'La potencia dice cuánta energía usa un aparato en cada instante. Se mide en vatios (W) o kilovatios (kW). Una lamparita LED puede tener 9 W; una estufa eléctrica, 2.000 W.',
        'La energía es la potencia multiplicada por el tiempo que el aparato está prendido. Se mide en vatios hora (Wh) o kilovatios hora (kWh), y es lo que cobra la factura de luz. Un aparato potente prendido un minuto puede gastar menos que uno débil prendido todo el día.',
      ], { destacado: { valor: 'kWh = kW × h', texto: 'energía = potencia × horas de uso. Es la única cuenta que necesitás para leer la factura.' } }),
      op('¿Qué mide la factura de electricidad de tu casa?', [
        'La energía consumida, en kilovatios hora (kWh)',
        ['La potencia de los aparatos, en kilovatios (kW)', 'La potencia contratada puede aparecer, pero lo que se consume y se paga es energía: kWh.'],
        'La cantidad de aparatos enchufados en la casa',
        'El voltaje de la red eléctrica del barrio',
      ], 'La factura suma cuánta energía pasó por el medidor en el período. Por eso importa tanto cuántas horas está prendido cada aparato.', { d: 1 }),
      clas('¿Es una potencia o una energía?', {
        'Potencia (W o kW)': ['9 W', '2 kW', '1.500 W'],
        'Energía (Wh o kWh)': ['250 kWh', '30 Wh', '1,2 kWh'],
      }, 'La "h" de hora delata a la energía: vatios hora, kilovatios hora. Sin la h, es potencia.', { d: 1 }),
      ejemplo('Cuánto gasta una estufa', 'Una estufa eléctrica de 2.000 W está prendida 3 horas. ¿Cuánta energía consume?', [
        'Pasamos la potencia a kilovatios: 2.000 W ÷ 1.000 = 2 kW.',
        'Multiplicamos por las horas: 2 kW × 3 h = 6 kWh.',
      ], 'La estufa consume 6 kWh en esas tres horas. Siempre conviene pasar a kW antes de multiplicar, así el resultado queda directo en kWh.'),
      numv(4, (i) => {
        const w = [1500, 1000, 2500, 800][i];
        const h = [2, 4, 1.5, 5][i];
        const e = (w / 1000) * h;
        return {
          enunciado: `Un aparato de ${w.toLocaleString('es-AR')} W está prendido ${h.toLocaleString('es-AR')} horas. ¿Cuántos kWh consume?`,
          valor: e,
          unidad: 'kWh',
          dec: 2,
          explicacion: `Primero a kilovatios: ${w.toLocaleString('es-AR')} W son ${(w / 1000).toLocaleString('es-AR')} kW. Después por las horas: ${(w / 1000).toLocaleString('es-AR')} kW × ${h.toLocaleString('es-AR')} h = ${e.toLocaleString('es-AR')} kWh.`,
        };
      }, { d: 2 }),
      numv(3, (i) => {
        const w = [9, 12, 10][i];
        const h = [5, 6, 4][i];
        const dias = 30;
        const e = (w * h * dias) / 1000;
        return {
          enunciado: `Una lámpara LED de ${w} W está prendida ${h} horas por día. ¿Cuántos kWh consume en un mes de ${dias} días?`,
          valor: e,
          unidad: 'kWh',
          dec: 2,
          explicacion: `Por día: ${w} W × ${h} h = ${w * h} Wh. En ${dias} días: ${w * h} × ${dias} = ${(w * h * dias).toLocaleString('es-AR')} Wh, que son ${e.toLocaleString('es-AR')} kWh.`,
        };
      }, { d: 3 }),
      teoria('Lo que está prendido todo el día', [
        'Como la energía es potencia por tiempo, los aparatos que nunca se apagan pesan aunque tengan poca potencia. La heladera funciona las 24 horas del día; un router, también. Un cargador enchufado sin teléfono consume muy poco, pero todo el año.',
        'Al revés, un secador de pelo de alta potencia usado cinco minutos gasta poco en total. Para saber qué pesa en la factura hay que mirar las dos cosas a la vez: potencia y horas.',
      ]),
      rank('Ordená estos usos según la energía que consumen en un día, de mayor a menor.', [
        ['Estufa de 2.000 W, 4 horas', '8 kWh'],
        ['Heladera de 100 W de promedio, 24 horas', '2,4 kWh'],
        ['Router de 10 W, 24 horas', '0,24 kWh'],
        ['Secador de 1.800 W, 5 minutos', '0,15 kWh'],
      ], 'El secador es el más potente de la lista y el que menos energía usa en el día: se prende cinco minutos. La potencia sola no alcanza para comparar.', { d: 3 }),
      vf('Un aparato de mucha potencia siempre gasta más energía que uno de poca potencia.', false, 'Depende del tiempo. Un secador de 1.800 W usado cinco minutos consume 0,15 kWh; un router de 10 W prendido todo el día consume 0,24 kWh. Energía = potencia × tiempo.', {
        razones: ['+Porque la energía depende también de cuánto tiempo está prendido', '-Porque la potencia no tiene relación con la energía', '-Porque los aparatos potentes usan otra electricidad'],
        d: 2,
      }),
      mult('¿Qué datos necesitás para calcular cuánta energía consume un aparato por mes? Marcá todos.', [
        '+Su potencia',
        '+Cuántas horas por día está prendido',
        '+Cuántos días del mes se usa',
        '-El color del aparato',
        '-La marca del enchufe',
      ], 'Potencia × horas por día × días: con esas tres cosas se estima el consumo de cualquier aparato.', { d: 2 }),
      numv(3, (i) => {
        const kwh = [210, 340, 165][i];
        const precio = [60, 45, 80][i];
        return {
          enunciado: `Un hogar consumió ${kwh} kWh en el mes. Si cada kWh costara $${precio}, ¿cuánto sería la parte de energía de la factura, en pesos?`,
          valor: kwh * precio,
          unidad: 'pesos',
          explicacion: `${kwh} kWh × $${precio} por kWh = $${(kwh * precio).toLocaleString('es-AR')}. El precio por kWh es un ejemplo: la tarifa real depende de la zona y del tipo de usuario.`,
        };
      }, { d: 3 }),
      op('Florencia apaga la luz de un pasillo (LED de 9 W) que quedaba prendida toda la noche, 10 horas. ¿Cuánto ahorra por noche?', [
        '90 Wh, o sea 0,09 kWh',
        '9 kWh por noche',
        ['90 kWh por noche', 'Cuidado con la unidad: 9 W × 10 h son 90 Wh. Para kWh hay que dividir por mil.'],
        'Nada, las lámparas LED no consumen',
      ], '9 W × 10 h = 90 Wh = 0,09 kWh. Es poco por noche, pero en un año son unos 33 kWh. Los ahorros chicos se vuelven visibles cuando se multiplican por el tiempo.', { d: 3 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('El CO₂ equivalente', 'Por qué el metano pesa más que el CO₂, y cómo se suman gases distintos en un solo número.', [
      teoria('Gases que abrigan', [
        'Algunos gases de la atmósfera dejan pasar la luz del sol pero retienen parte del calor que la Tierra devuelve. Sin ellos, el planeta sería helado; con demasiados, se calienta. Los principales son el dióxido de carbono (CO₂), el metano (CH₄) y el óxido nitroso (N₂O).',
        'El CO₂ sale sobre todo de quemar combustibles fósiles y de la deforestación. El metano, del ganado, los rellenos sanitarios, los arrozales y las pérdidas de gas. El óxido nitroso, principalmente de los fertilizantes.',
      ]),
      par('Uní cada gas con una de sus fuentes principales.', [
        ['Dióxido de carbono (CO₂)', 'Quemar nafta, gas o carbón'],
        ['Metano (CH₄)', 'La digestión del ganado y los rellenos sanitarios'],
        ['Óxido nitroso (N₂O)', 'Los fertilizantes nitrogenados'],
      ], 'Cada gas tiene sus fuentes, y por eso las soluciones también son distintas: no se reduce el metano de un relleno cambiando de auto.', { d: 1 }),
      teoria('No todos calientan igual', [
        'Un kilo de metano atrapa mucho más calor que un kilo de CO₂, aunque dura menos años en la atmósfera. Para compararlos, se usa el potencial de calentamiento global: cuánto calienta un gas respecto del CO₂ en un período, normalmente 100 años.',
        'Con ese criterio, el metano calienta alrededor de 28 veces más que el CO₂ (el IPCC lo estima entre 27 y 30 según su origen), y el óxido nitroso unas 270 veces más. El CO₂ vale 1 por definición.',
      ], { destacado: { valor: '≈ 28×', texto: 'un kilo de metano calienta, en 100 años, lo que unos 28 kilos de CO₂.' } }),
      teoria('Sumar todo en una sola cuenta', [
        'Para sumar gases distintos se pasan todos a "CO₂ equivalente" (CO₂e): se multiplica la masa de cada gas por su potencial. Así, 1 kilo de metano cuenta como unos 28 kg de CO₂e.',
        'Cuando leas "la huella de este alimento es de 3 kg CO₂e", significa que todos los gases que emitió producirlo, juntos, calientan lo mismo que 3 kg de CO₂.',
      ]),
      ejemplo('Pasar metano a CO₂e', 'Un relleno sanitario emite 2 toneladas de metano. ¿Cuánto es en CO₂ equivalente, usando un potencial de 28?', [
        'CO₂e = masa del gas × potencial de calentamiento.',
        '2 t × 28 = 56 t CO₂e.',
      ], 'Esas 2 toneladas de metano calientan como 56 toneladas de CO₂. Por eso evitar que los restos de comida terminen enterrados rinde tanto.'),
      numv(4, (i) => {
        const kg = [5, 12, 3, 40][i];
        return {
          enunciado: `Si se emiten ${kg} kg de metano, ¿cuántos kg de CO₂e son? (Usá un potencial de 28.)`,
          valor: kg * 28,
          unidad: 'kg CO₂e',
          explicacion: `${kg} kg × 28 = ${(kg * 28).toLocaleString('es-AR')} kg CO₂e. El metano cuenta 28 veces lo que el CO₂ en un horizonte de 100 años.`,
        };
      }, { d: 2 }),
      vf('Como el metano dura menos años en la atmósfera que el CO₂, calienta menos.', false, 'Dura menos, pero mientras está atrapa muchísimo más calor. Medido a 100 años, un kilo de metano calienta unas 28 veces más que uno de CO₂; a 20 años, la diferencia es todavía mayor.', {
        razones: ['+Porque atrapa mucho más calor por kilo, aunque dure menos', '-Porque el metano no es un gas de efecto invernadero', '-Porque todos los gases calientan exactamente igual'],
        d: 2,
      }),
      rank('Ordená por cuánto calienta un kilo de cada gas en 100 años, de más a menos.', [
        ['Óxido nitroso (N₂O)', '≈ 270 veces el CO₂'],
        ['Metano (CH₄)', '≈ 28 veces el CO₂'],
        ['Dióxido de carbono (CO₂)', '1, por definición'],
      ], 'El CO₂ calienta menos por kilo, pero se emite en cantidades enormes y dura siglos: por eso sigue siendo el gas que más aporta al calentamiento total.', { d: 2 }),
      op('Si el CO₂ calienta menos por kilo que el metano, ¿por qué es el gas que más contribuye al calentamiento?', [
        'Porque se emite en cantidades enormes y dura siglos en el aire',
        'Porque es el único gas que retiene calor en la atmósfera',
        ['Porque el metano no llega a la atmósfera, se queda en el suelo', 'El metano sí llega a la atmósfera: sale de rellenos, ganado y pérdidas de gas.'],
        'Porque el CO₂ se mide en otra unidad que agranda los números',
      ], 'Importa la potencia por kilo y también la cantidad y la duración. El CO₂ gana en las dos últimas.', { d: 3 }),
      numv(3, (i) => {
        const co2 = [100, 250, 60][i];
        const ch4 = [2, 5, 1][i];
        const tot = co2 + ch4 * 28;
        return {
          enunciado: `Una actividad emite ${co2} kg de CO₂ y ${ch4} kg de metano. ¿Cuál es su huella total en kg CO₂e? (Metano = 28.)`,
          valor: tot,
          unidad: 'kg CO₂e',
          explicacion: `CO₂: ${co2} kg × 1 = ${co2}. Metano: ${ch4} kg × 28 = ${ch4 * 28}. Total: ${co2} + ${ch4 * 28} = ${tot} kg CO₂e.`,
        };
      }, { d: 4 }),
      comp('Completá.', 'Para sumar gases distintos se pasan todos a [CO₂ equivalente], multiplicando la [masa] de cada gas por su [potencial] de calentamiento.', ['volumen', 'oxígeno', 'temperatura'], 'Masa × potencial = CO₂e. Es la unidad común de todas las huellas de carbono que vas a ver en el árbol.', { d: 2 }),
      det('Leé esta etiqueta de un producto y marcá lo que no tiene sentido.', [
        ['Huella de carbono: 2,1 kg CO₂e por unidad.', false],
        ['Incluye las emisiones de metano del proceso,', false],
        ['medidas en litros de CO₂e.', true, 'El CO₂e se expresa en masa (gramos, kilos, toneladas), no en litros.'],
        ['El metano se contó como si calentara igual que el CO₂.', true, 'Si se cuenta así, se subestima: el metano pesa unas 28 veces más.'],
      ], 'Una huella bien hecha usa unidades de masa y aplica el potencial de cada gas.', { d: 4 }),
      clas('¿Qué gas sale principalmente de cada fuente?', {
        'Sobre todo CO₂': ['El caño de escape de un auto a nafta', 'Una caldera a gas', 'Un bosque que se quema'],
        'Sobre todo metano': ['Un relleno sanitario con restos de comida', 'Un campo con ganado vacuno', 'Una pérdida en un gasoducto'],
      }, 'El gas natural es casi todo metano: si se quema, sale CO₂; si se escapa sin quemar, sale metano, que calienta mucho más.', { d: 3 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Leer un número ambiental', 'Total, por persona, por año, por kilo: el mismo dato cambia de significado según cómo se mira.', [
      teoria('Total o por persona', [
        'Un país grande puede emitir mucho CO₂ en total simplemente porque tiene mucha gente. Otro, más chico, puede emitir poco en total y muchísimo por habitante. Los dos números son verdaderos, pero responden preguntas distintas.',
        'El total sirve para ver qué pesa en el planeta. El valor por persona sirve para comparar formas de vivir. Cuando leas un ranking, fijate primero cuál de los dos está usando.',
      ]),
      ejemplo('Dos países', 'El país A emite 600 millones de toneladas de CO₂ por año y tiene 200 millones de habitantes. El país B emite 60 millones de toneladas y tiene 5 millones de habitantes.', [
        'A por persona: 600 ÷ 200 = 3 toneladas por habitante.',
        'B por persona: 60 ÷ 5 = 12 toneladas por habitante.',
      ], 'A emite diez veces más en total, pero cada habitante de B emite cuatro veces más que uno de A. Las dos lecturas son correctas.'),
      numv(4, (i) => {
        const t = [400, 90, 1200, 30][i];
        const hab = [50, 10, 400, 2][i];
        return {
          enunciado: `Un país emite ${t.toLocaleString('es-AR')} millones de toneladas de CO₂e por año y tiene ${hab} millones de habitantes. ¿Cuántas toneladas emite por persona?`,
          valor: t / hab,
          unidad: 't por persona',
          dec: 1,
          explicacion: `Se dividen las dos cifras, que están en millones: ${t.toLocaleString('es-AR')} ÷ ${hab} = ${(t / hab).toLocaleString('es-AR')} toneladas por habitante por año.`,
        };
      }, { d: 2 }),
      teoria('Siempre hay un "por"', [
        'Casi todos los datos ambientales tienen un denominador escondido: por año, por día, por persona, por kilo de producto, por kilómetro recorrido. "Esta carne emite 60 kg CO₂e" no dice nada si no sabés si es por kilo, por plato o por vaca.',
        'Antes de comparar dos números, asegurate de que tengan el mismo "por". Comparar litros por día con litros por mes es comparar manzanas con peras.',
      ], { lista: ['kg CO₂e por kilo de alimento', 'litros por persona por día', 'gramos de CO₂ por kilómetro', 'kWh por mes'] }),
      op('Un titular dice: "Los autos eléctricos emiten 0 g de CO₂". ¿Qué falta aclarar?', [
        'Que es solo el caño de escape: fabricarlo y la electricidad emiten',
        'Nada, un auto eléctrico no emite nada en toda su vida útil',
        ['Cuántos autos eléctricos hay circulando hoy en el país', 'Ese es otro dato: acá lo que falta es qué parte de la vida del auto se está midiendo.'],
        'El precio del auto eléctrico comparado con uno a nafta',
      ], 'El "por" acá es "por kilómetro, en el caño de escape". Un análisis completo mira la fabricación, la batería y de dónde sale la electricidad. Lo verás en Movilidad.', { d: 3 }),
      clas('¿Es un total o un valor relativo (por algo)?', {
        'Total': ['Una ciudad junta 3.000 toneladas de basura por día', 'Un país emitió 380 millones de toneladas de CO₂e en un año'],
        'Relativo (por algo)': ['Cada vecino genera 1,2 kg de basura por día', 'Un auto emite 120 g de CO₂ por kilómetro', 'Una ducha usa 10 litros por minuto'],
      }, 'Los totales dicen cuánto pesa algo en el conjunto; los relativos permiten comparar entre casos de distinto tamaño.', { d: 2 }),
      teoria('Porcentajes: siempre ¿de qué?', [
        'Un porcentaje es una parte de un total. "El 40 % de la basura es comida" dice qué parte ocupa la comida dentro de la basura, pero no cuánta basura hay.',
        'Y ojo con los aumentos: si algo pasa de 10 a 15, subió 5 unidades, que es un 50 %. Si pasa de 100 a 105, subió también 5, pero es un 5 %. El mismo cambio absoluto puede ser un porcentaje grande o chico según de dónde parte.',
      ]),
      numv(4, (i) => {
        const total = [2000, 800, 1500, 360][i];
        const pct = [45, 30, 20, 25][i];
        return {
          enunciado: `Una escuela genera ${total.toLocaleString('es-AR')} kg de residuos por año y el ${pct} % son restos orgánicos. ¿Cuántos kilos de orgánicos son?`,
          valor: (total * pct) / 100,
          unidad: 'kg',
          explicacion: `Un porcentaje es una parte de cien: ${pct} % de ${total.toLocaleString('es-AR')} = ${total.toLocaleString('es-AR')} × ${pct} ÷ 100 = ${((total * pct) / 100).toLocaleString('es-AR')} kg de orgánicos.`,
        };
      }, { d: 2 }),
      numv(3, (i) => {
        const a = [80, 200, 50][i];
        const b = [100, 230, 75][i];
        return {
          enunciado: `El consumo de agua de un club pasó de ${a} m³ a ${b} m³ por mes. ¿En qué porcentaje aumentó?`,
          valor: ((b - a) / a) * 100,
          unidad: '%',
          dec: 1,
          explicacion: `Aumento: ${b} − ${a} = ${b - a} m³. Porcentaje: ${b - a} ÷ ${a} × 100 = ${(((b - a) / a) * 100).toLocaleString('es-AR')} %. Siempre se divide por el valor de partida.`,
        };
      }, { d: 3 }),
      mult('¿Qué preguntas conviene hacerle a cualquier número ambiental? Marcá todas las útiles.', [
        '+¿En qué unidad está?',
        '+¿Es un total o es por persona, por año o por kilo?',
        '+¿De qué total es este porcentaje?',
        '+¿Quién lo midió y cómo?',
        '-¿Es un número redondo o tiene decimales?',
      ], 'Unidad, denominador, total de referencia y fuente: con esas cuatro preguntas se desarma la mayoría de los datos confusos.', { d: 3 }),
      vf('Si un país emite mucho CO₂ en total, cada uno de sus habitantes también emite mucho.', false, 'No necesariamente. Un país con muchísima gente puede tener un total enorme y un valor por persona bajo; uno chico, al revés. Para hablar de "cada habitante" hay que dividir por la población.', {
        razones: ['+Porque el total depende de cuánta gente hay, no solo de cuánto emite cada persona', '-Porque los totales y los valores por persona siempre coinciden', '-Porque la población no se puede medir'],
        d: 2,
      }),
      det('Un posteo compara dos ciudades. Marcá los razonamientos engañosos.', [
        ['La ciudad X tira 5.000 toneladas de basura por día y la ciudad Y, 500.', false],
        ['Entonces cada vecino de X tira diez veces más basura que uno de Y.', true, 'Sin saber cuántos habitantes tiene cada ciudad no se puede comparar por vecino.'],
        ['La basura de Y subió un 20 % este año,', false],
        ['así que ahora Y tira más basura que X.', true, 'Un 20 % sobre 500 son 100 toneladas más: 600, muy lejos de 5.000.'],
      ], 'Un total no dice nada por persona, y un porcentaje no dice nada sin su base.', { d: 4 }),
      par('Uní cada dato con la pregunta que responde mejor.', [
        ['Toneladas de CO₂e de un país por año', '¿Cuánto pesa ese país en el total del planeta?'],
        ['Toneladas de CO₂e por habitante', '¿Cómo se compara la forma de vivir con otro país?'],
        ['Gramos de CO₂ por kilómetro', '¿Qué auto contamina menos al recorrer lo mismo?'],
        ['Porcentaje de orgánicos en la basura', '¿Qué parte de la basura se podría compostar?'],
      ], 'Cada forma de presentar un dato sirve para una pregunta. Elegir la correcta es la mitad del análisis.', { d: 3 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Órdenes de magnitud', 'Qué pesa de verdad: la diferencia entre ahorrar gramos y ahorrar toneladas.', [
      teoria('Pensar en potencias de diez', [
        'Un orden de magnitud es un factor de diez. 10, 100 y 1.000 están separados por un orden de magnitud cada uno. Cuando dos acciones difieren en uno o dos órdenes de magnitud, no hace falta el número exacto para saber cuál importa más.',
        'Esta es una de las ideas más útiles del árbol entero: a veces nos esforzamos mucho en algo que ahorra gramos y dejamos pasar algo que ahorra toneladas. No porque lo chico esté mal, sino porque el tiempo y la energía de cada persona son limitados.',
      ], { destacado: { valor: '×10', texto: 'un orden de magnitud. Entre 1 kg y 1 tonelada hay tres.' } }),
      ord('Ordená estas masas de menor a mayor.', [
        '1 gramo',
        '1 kilo',
        '1 tonelada',
        '1.000 toneladas',
      ], 'Cada paso multiplica por mil, o sea, tres órdenes de magnitud. Entre un gramo y mil toneladas hay nueve.', { d: 1, extremos: ['Menor', 'Mayor'] }),
      numv(3, (i) => {
        const a = [5, 20, 2][i];
        const b = [500, 2000, 2000][i];
        return {
          enunciado: `Una acción ahorra ${a} kg de CO₂e por año y otra ahorra ${b.toLocaleString('es-AR')} kg. ¿Cuántas veces más ahorra la segunda?`,
          valor: b / a,
          unidad: 'veces',
          explicacion: `${b.toLocaleString('es-AR')} ÷ ${a} = ${(b / a).toLocaleString('es-AR')}. Son ${Math.round(Math.log10(b / a))} órdenes de magnitud de diferencia.`,
        };
      }, { d: 2 }),
      teoria('Qué acciones pesan más', [
        'Un estudio de 2017 (Wynes y Nicholas) comparó cuánto CO₂e ahorran por año distintas acciones personales en países de altos ingresos. Vivir sin auto rondaba 2,4 toneladas por año; evitar un vuelo transatlántico de ida y vuelta, 1,6; una dieta basada en plantas, 0,8. Reciclar, alrededor de 0,2, y cambiar lamparitas, cerca de 0,1.',
        'Los números exactos dependen del país, pero el patrón se repite: transporte, energía del hogar y alimentación pesan órdenes de magnitud más que muchos gestos chicos. Y los gestos chicos siguen sumando: son buenos puntos de partida.',
      ], {
        datos: barras('Ahorro estimado por persona y por año (países de altos ingresos)', 't CO₂e', [
          ['Vivir sin auto', 2.4],
          ['Evitar un vuelo transatlántico ida y vuelta', 1.6],
          ['Dieta basada en plantas', 0.8],
          ['Reciclar', 0.21],
          ['Cambiar lamparitas', 0.1],
        ], 'Fuente: Wynes y Nicholas (2017). Valores aproximados; cambian según el país.'),
      }),
      rank('Según el estudio de la tarjeta anterior, ordená estas acciones por cuánto ahorran por año, de más a menos.', [
        ['Vivir sin auto', '≈ 2,4 t CO₂e'],
        ['Dieta basada en plantas', '≈ 0,8 t CO₂e'],
        ['Reciclar', '≈ 0,2 t CO₂e'],
        ['Cambiar lamparitas', '≈ 0,1 t CO₂e'],
      ], 'Entre la primera y la última hay más de veinte veces de diferencia. Conocer el orden ayuda a elegir por dónde empezar sin culpa y con criterio.', { d: 3 }),
      vf('Como reciclar ahorra menos que dejar el auto, no tiene sentido reciclar.', false, 'Pensar en órdenes de magnitud sirve para priorizar, no para descartar. Reciclar sigue ahorrando recursos y energía, es fácil y además cuida otras cosas además del clima. La idea es no quedarse solo en lo chico.', {
        razones: ['+Porque priorizar no es descartar: lo chico también suma', '-Porque reciclar ahorra más que no usar el auto', '-Porque el CO₂ no es lo único que importa, así que nada se puede comparar'],
        d: 2,
      }),
      est('Estimá: si una familia hace una acción que ahorra 0,1 toneladas por año y otra que ahorra 2 toneladas por año, ¿cuántos años de la primera equivalen a un año de la segunda?', 20, { min: 1, max: 100, paso: 1, unidad: 'años' }, '2 ÷ 0,1 = 20 años. Hace falta mantener la acción chica veinte años para igualar un solo año de la grande.', { d: 3 }),
      teoria('El efecto rebote', [
        'A veces una mejora se come a sí misma. Si una casa pone lamparitas eficientes y, como ahora "no gastan", las deja prendidas el doble de tiempo, parte del ahorro se pierde. Si un auto gasta menos por kilómetro y por eso se usa más, pasa lo mismo.',
        'No quiere decir que la eficiencia no sirva: casi siempre ahorra algo. Quiere decir que hay que medir el resultado final y no solo el ahorro prometido.',
      ]),
      op('Una familia cambia su auto por uno que gasta la mitad de nafta por kilómetro, y empieza a viajar el doble de kilómetros. ¿Qué pasa con su consumo total de nafta?', [
        'Queda igual: la mitad por kilómetro, el doble de kilómetros',
        'Se reduce a la mitad, porque el auto nuevo es más eficiente',
        ['Se duplica, porque viajan el doble', 'El auto gasta la mitad por kilómetro, así que duplicar los kilómetros no duplica el consumo: lo deja igual.'],
        'Baja a cero, porque el auto nuevo es eficiente',
      ], 'La mitad × el doble = lo mismo. Es un efecto rebote completo: la mejora de eficiencia se usó para viajar más.', { d: 3 }),
      cad('Armá la cadena de un efecto rebote.', [
        'Una familia instala un aire acondicionado más eficiente',
        'Cada hora de uso cuesta menos',
        'Lo prenden más horas y a menor temperatura',
        'El ahorro de energía es menor al esperado',
      ], ['El aparato nuevo consume más por hora que el viejo'], 'El señuelo contradice el punto de partida: el aparato nuevo es más eficiente. El rebote viene del cambio de uso, no del aparato.', { d: 4 }),
      det('Leé este razonamiento y marcá lo que está mal pensado.', [
        ['Desenchufé el cargador del celular, que consume casi nada en espera,', false],
        ['así que ya hice mi parte por el clima y puedo viajar en avión las veces que quiera.', true, 'Desenchufar un cargador ahorra gramos; un vuelo largo emite cientos de kilos o más. No se compensan.'],
        ['Igual, lo que conviene es sumar gestos y también mirar lo que pesa más.', false],
      ], 'Los gestos chicos no compensan los grandes: están en distintos órdenes de magnitud. Lo sano es sumar los dos, sin culpa y con números.', { d: 3 }),
      comp('Completá.', 'Entre 1 kilo y 1 tonelada hay [tres] órdenes de magnitud, porque una tonelada son [mil] kilos.', ['dos', 'cien', 'diez mil'], 'Cada orden de magnitud es un factor de diez: 10 × 10 × 10 = 1.000, o sea tres órdenes.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: medir para entender', 'Unidades, energía, CO₂e y órdenes de magnitud, todo mezclado.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: la cuenta de la casa de Tomi', 'Un caso con números reales de una casa. Aprobalo para completar la unidad.', [
      teoria('El caso', [
        'Tomi vive con su familia de cuatro personas y quiere saber por dónde empezar a cuidar el ambiente en casa. Juntó algunos datos: la factura de luz dice 300 kWh en el mes; la de agua, 18 m³; en casa tiran unos 5 kilos de basura por día.',
        'También averiguó que en su zona cada kWh de la red emite, en promedio, unos 0,4 kg de CO₂ (es un valor aproximado que cambia año a año según cómo se genera la electricidad). Con lo que aprendiste, vas a ayudarlo a leer sus números.',
      ]),
      num('Con 300 kWh por mes y 0,4 kg de CO₂ por kWh, ¿cuántos kg de CO₂ emite la electricidad de la casa de Tomi en un mes?', 120, 'kg CO₂', '300 kWh × 0,4 kg/kWh = 120 kg de CO₂ por mes. En un año, unos 1.440 kg: casi una tonelada y media.', { ctx: 'La casa de Tomi: 300 kWh de luz por mes, 18 m³ de agua por mes, 5 kg de basura por día, 4 personas. Factor de la red: 0,4 kg CO₂ por kWh.', d: 3 }),
      num('¿Cuántos litros de agua por persona y por día usa la familia de Tomi? (18 m³ por mes, 4 personas, mes de 30 días)', 150, 'litros por persona por día', '18 m³ = 18.000 litros por mes. ÷ 30 días = 600 litros por día. ÷ 4 personas = 150 litros por persona por día.', { ctx: 'La casa de Tomi: 300 kWh de luz por mes, 18 m³ de agua por mes, 5 kg de basura por día, 4 personas. Factor de la red: 0,4 kg CO₂ por kWh.', d: 4 }),
      num('¿Cuántos kilos de basura por persona y por día genera la familia?', 1.25, 'kg por persona por día', '5 kg por día ÷ 4 personas = 1,25 kg por persona por día.', { ctx: 'La casa de Tomi: 300 kWh de luz por mes, 18 m³ de agua por mes, 5 kg de basura por día, 4 personas. Factor de la red: 0,4 kg CO₂ por kWh.', d: 3, dec: 2 }),
      op('La estufa eléctrica de 2.000 W de la casa se usa 4 horas por día en invierno. ¿Qué parte de los 300 kWh del mes representa en 30 días?', [
        '240 kWh: el 80 % de toda la factura',
        '8 kWh: casi nada de la factura',
        ['2.000 kWh: más que toda la factura', 'Hay que pasar a kW: 2 kW × 4 h × 30 días = 240 kWh.'],
        '24 kWh: el 8 % de la factura',
      ], '2 kW × 4 h = 8 kWh por día; × 30 días = 240 kWh. En invierno la estufa sola explicaría el 80 % del consumo: es el primer lugar donde mirar.', { ctx: 'La casa de Tomi: 300 kWh de luz por mes. La estufa eléctrica de 2.000 W se usa 4 horas por día.', d: 4 }),
      rank('Tomi arma una lista de cambios posibles para la casa. Ordenalos por cuánta energía por mes ahorran, de más a menos.', [
        ['Usar la estufa 2 horas menos por día (2.000 W)', '≈ 120 kWh por mes'],
        ['Apagar el aire acondicionado de un cuarto vacío, 3 h por día (1.000 W)', '≈ 90 kWh por mes'],
        ['Cambiar 5 lámparas de 40 W por LED de 9 W, 4 h por día', '≈ 19 kWh por mes'],
        ['Desenchufar dos cargadores en espera (0,5 W cada uno)', '≈ 0,7 kWh por mes'],
      ], 'Estufa: 2 kW × 2 h × 30 = 120 kWh. Aire: 1 kW × 3 h × 30 = 90. Lámparas: 5 × 31 W × 4 h × 30 ≈ 18,6. Cargadores: 1 W × 24 h × 30 = 0,72. Entre el primero y el último hay más de dos órdenes de magnitud.', { d: 4 }),
      vf('Si Tomi desenchufa los cargadores, su casa baja el consumo a la mitad.', false, 'Dos cargadores en espera suman menos de 1 kWh por mes sobre 300: menos del 0,3 %. Está bien hacerlo, pero el ahorro grande está en la estufa y la climatización.', {
        razones: ['+Porque los cargadores en espera consumen menos del 1 % del total', '-Porque los cargadores son lo que más consume de la casa', '-Porque desenchufar no ahorra nada nunca'],
        d: 3,
      }),
      numv(3, (i) => {
        const kwh = [120, 90, 60][i];
        return {
          enunciado: `Si Tomi logra ahorrar ${kwh} kWh por mes, ¿cuántos kg de CO₂ evita por año? (Factor de la red: 0,4 kg por kWh.)`,
          valor: kwh * 12 * 0.4,
          unidad: 'kg CO₂ por año',
          explicacion: `${kwh} kWh × 12 meses = ${kwh * 12} kWh por año. × 0,4 kg/kWh = ${(kwh * 12 * 0.4).toLocaleString('es-AR')} kg de CO₂ por año.`,
        };
      }, { d: 4 }),
      det('La hermana de Tomi escribe un resumen. Marcá los errores.', [
        ['Gastamos 300 kWh por mes,', false],
        ['que por un factor de 0,4 son 120 toneladas de CO₂ al mes.', true, 'Son 120 kilos, no toneladas: 300 × 0,4 = 120 kg.'],
        ['La estufa es lo que más pesa en invierno,', false],
        ['así que lo primero es desenchufar los cargadores.', true, 'Por orden de magnitud, lo primero es la estufa y la climatización; los cargadores son lo último.'],
      ], 'Unidades bien puestas y prioridades por orden de magnitud: las dos cosas que aprendiste en esta unidad.', { d: 4 }),
      mult('¿Qué conclusiones son correctas para la casa de Tomi? Marcá todas.', [
        '+En invierno, la estufa explica la mayor parte del consumo eléctrico',
        '+El consumo de agua por persona se puede comparar con el de otras casas porque está en litros por persona por día',
        '+Los cambios chicos suman, pero no reemplazan a los grandes',
        '-La basura no se puede medir porque se tira todos los días',
        '-Un kWh emite lo mismo en todos los países y todos los años',
      ], 'El factor de emisión de la red depende de cómo se genera la electricidad en cada lugar y cada año. Todo lo demás es lectura de números con su unidad y su "por".', { d: 4 }),
    ]),
  ],
});
