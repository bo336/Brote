import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// ALIMENTACIÓN 3 — La comida que se tira.
// Pérdida y desperdicio de alimentos: cuánto, por qué, cómo leer las fechas,
// cómo conservar y aprovechar, y qué pueden hacer comercios y restaurantes.
// Retoma la huella de la comida (alimentacion-2), la cadena de frío
// (alimentacion-1) y el compostaje (residuos-3 si ya la hiciste).

export default unidad({
  slug: 'alimentacion-3',
  rama: 'alimentacion',
  orden: 3,
  nivel: 2,
  requiereTronco: 2,
  titulo: 'La comida que se tira',
  bajada: 'Casi una quinta parte de la comida que llega a comercios y casas se tira. Por qué pasa, cómo leer las fechas y cómo aprovechar lo que hay.',
  objetivos: [
    'Dimensionar la pérdida y el desperdicio de alimentos y su huella',
    'Identificar las causas del desperdicio en los hogares',
    'Interpretar las fechas de los alimentos y conservarlos mejor',
    'Aplicar estrategias para aprovechar sobras y partes que no suelen comerse',
    'Ordenar los destinos de los excedentes según una jerarquía',
  ],
  repasa: ['alimentacion-2', 'alimentacion-1', 'residuos-3'],
  fuentes: ['unep-food-waste-2024', 'fao', 'owid-alimentos', 'red-bancos-alimentos', 'guias-alimentarias-ar'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Cuánta comida se pierde', 'Los números de la pérdida y el desperdicio, dónde ocurren y cuánto pesan en el clima.', [
      teoria('Pérdida y desperdicio', [
        'La pérdida de alimentos ocurre entre la cosecha y la venta: frutas que se golpean en el transporte, granos que se humedecen, verduras que no se cosechan. El desperdicio ocurre en los comercios, los restaurantes y las casas: comida que se vence, sobras que se tiran, productos que no se venden.',
        'Según el Índice de Desperdicio de Alimentos 2024 del PNUMA, en 2022 se desperdiciaron en el mundo más de 1.000 millones de toneladas de alimentos en comercios, servicios de comida y hogares: alrededor del 19 % de los alimentos disponibles para los consumidores. Y la FAO estima que otro 13 % se pierde antes, entre la cosecha y la venta.',
      ], { destacado: { valor: '≈ 19 %', texto: 'de los alimentos disponibles para los consumidores se desperdició en 2022, según el PNUMA.' } }),
      clas('¿Es pérdida o desperdicio de alimentos?', { // e1
        'Pérdida (antes de la venta)': ['Duraznos golpeados en el camión', 'Maíz que se pudre en un silo mal cerrado', 'Tomates que no se cosechan por el bajo precio'],
        'Desperdicio (venta y consumo)': ['Pan que sobra en una panadería al cierre', 'Yogur vencido en la heladera de casa', 'Comida que queda en el plato de un restaurante'],
      }, 'Distinguirlas ayuda a elegir soluciones: logística y almacenamiento para la pérdida; hábitos, reglas y donación para el desperdicio.', { d: 1 }),
      teoria('Dónde se desperdicia', [
        'Del desperdicio medido por el PNUMA, alrededor del 60 % ocurre en los hogares, cerca del 28 % en restaurantes y servicios de comida, y alrededor del 12 % en los comercios. En promedio, cada persona desperdicia en su casa unos 79 kilos de comida por año.',
      ], {
        datos: barras('Dónde se desperdicia la comida (mundo, 2022)', '% del desperdicio', [
          ['Hogares', 60],
          ['Servicios de comida', 28],
          ['Comercios', 12],
        ], 'PNUMA, Índice de Desperdicio de Alimentos 2024.'),
      }),
      rank('Según el PNUMA, ordená dónde se desperdicia más comida, de más a menos.', [ // e2
        ['Hogares', '≈ 60 %'],
        ['Restaurantes y servicios de comida', '≈ 28 %'],
        ['Comercios', '≈ 12 %'],
      ], 'Las casas son el lugar donde más comida se tira. Por eso los hábitos de cada familia importan tanto.', { d: 1 }),
      numv(3, (i) => { // e3
        const pers = [4, 3, 5][i];
        return {
          enunciado: `Si cada persona desperdicia en su casa unos 79 kg de comida por año, ¿cuántos kg desperdicia por año una familia de ${pers}?`,
          valor: 79 * pers,
          unidad: 'kg',
          explicacion: `79 × ${pers} = ${79 * pers} kg por año: más de ${Math.floor((79 * pers) / 52)} kg por semana que se compraron y nunca se comieron.`,
        };
      }, { d: 1 }),
      teoria('La huella de lo que se tira', [
        'Cuando se tira comida, se tira también todo lo que costó producirla: tierra, agua, energía, fertilizantes, trabajo y emisiones. Según el PNUMA, la pérdida y el desperdicio de alimentos generan entre el 8 y el 10 % de las emisiones mundiales de gases de efecto invernadero. Y si terminan en un relleno, suman el metano de su descomposición.',
      ]),
      cad('Armá la cadena de todo lo que se desperdicia cuando se tira un kilo de carne.', [ // e4
        'Se tira un kilo de carne vencida',
        'Se pierde la tierra y el agua usadas para criar al animal',
        'Se pierden las emisiones de producirla',
        'En el relleno se descompone y produce metano',
        'Todo ese impacto no alimentó a nadie',
      ], ['La carne tirada vuelve al campo como pasto'], 'Tirar comida es tirar toda su huella. Con los alimentos de mayor huella, más todavía.', { d: 2 }),
      vf('La comida que se desperdicia solo es un problema económico, no ambiental.', false, 'Arrastra toda la huella de su producción y, en los rellenos, produce metano. La pérdida y el desperdicio generan entre el 8 y el 10 % de las emisiones mundiales.', { // e5
        razones: ['+Porque arrastra toda su huella y produce metano en el relleno', '-Porque la comida no tiene huella ambiental', '-Porque la comida tirada se recicla automáticamente'],
        d: 1,
      }),
      est('Estimá qué porcentaje de las emisiones mundiales de gases de efecto invernadero se relaciona con la pérdida y el desperdicio de alimentos, según el PNUMA.', 9, { min: 0, max: 50, paso: 1, unidad: '%' }, 'Entre el 8 y el 10 %. Si fuera un país, estaría entre los grandes emisores del mundo.', { d: 3 }),
      mult('¿Qué se pierde cuando se tira comida? Marcá todo.', [ // e7
        '+La tierra usada para producirla',
        '+El agua de riego',
        '+La energía del transporte y la cadena de frío',
        '+El trabajo de quienes la produjeron',
        '-Nada, porque se descompone',
      ], 'Todo el sistema alimentario que viste en esta rama está detrás de cada bocado que se tira.', { d: 1 }),
      det('Leé esta nota y marcá lo equivocado.', [ // e8
        ['En el mundo se desperdician más de 1.000 millones de toneladas de alimentos por año.', false],
        ['La mayor parte del desperdicio ocurre en los supermercados.', true, 'Según el PNUMA, alrededor del 60 % ocurre en los hogares.'],
        ['La comida en los rellenos produce metano.', false],
        ['Tirar comida no tiene impacto en el clima.', true, 'La pérdida y el desperdicio generan entre el 8 y el 10 % de las emisiones mundiales.'],
      ], 'El desperdicio de alimentos es un problema ambiental, económico y social a la vez.', { d: 2 }),
      comp('Completá.', 'Lo que se pierde entre la cosecha y la venta es [pérdida]; lo que se tira en casas, comercios y restaurantes es [desperdicio]; y la mayor parte ocurre en los [hogares].', ['reciclaje', 'compost', 'campos'], 'Las dos caras del problema y dónde pesa más.', { d: 1 }),
      par('Uní cada dato con lo que mide.', [ // e10
        ['≈ 19 %', 'Alimentos disponibles que se desperdician'],
        ['≈ 13 %', 'Alimentos que se pierden antes de la venta'],
        ['≈ 79 kg', 'Desperdicio por persona por año en los hogares'],
        ['8-10 %', 'Emisiones mundiales vinculadas a pérdida y desperdicio'],
      ], 'Cuatro números que dimensionan el problema.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Por qué se tira comida en casa', 'Comprar de más, guardar mal, confundir fechas, cocinar de más: las causas y cómo evitarlas.', [
      teoria('Las causas', [
        'En las casas, la comida se tira por causas que se repiten: se compra más de lo que se usa (ofertas, compras sin lista, envases demasiado grandes), se guarda mal y se echa a perder, se confunden las fechas y se tira comida que estaba bien, se cocina de más y las sobras quedan olvidadas, o se descartan partes comestibles como tallos y cáscaras.',
      ]),
      par('Uní cada causa de desperdicio con una solución.', [ // e1
        ['Comprar de más', 'Lista de compras según el menú de la semana'],
        ['Guardar mal', 'Conservar cada alimento en su lugar adecuado'],
        ['Confundir fechas', 'Distinguir "vencimiento" de "consumir preferentemente antes de"'],
        ['Sobras olvidadas', 'Guardarlas a la vista y planear usarlas'],
      ], 'Cada causa tiene su hábito que la corrige.', { d: 1 }),
      teoria('La trampa de la oferta', [
        'Las ofertas de "llevá 3 y pagá 2" pueden ser un ahorro, o una forma de comprar comida que después se tira. Si el tercer paquete se vence sin usarse, la oferta salió más cara y además generó desperdicio. La clave es comprar lo que se va a usar.',
      ]),
      numv(3, (i) => { // e2
        const precio = [1200, 900, 1500][i];
        return {
          enunciado: `Una oferta de yogures dice "llevá 3 y pagá 2", a $${precio.toLocaleString('es-AR')} cada uno. Si el tercero se vence sin usarse, ¿cuánto pagaste por cada yogur que efectivamente comiste?`,
          valor: precio,
          unidad: '$',
          explicacion: `Pagaste 2 × $${precio.toLocaleString('es-AR')} = $${(2 * precio).toLocaleString('es-AR')} y comiste 2: $${precio.toLocaleString('es-AR')} por yogur, lo mismo que sin oferta, y además tiraste uno.`,
        };
      }, { d: 2 }),
      cad('Armá la cadena de cómo una compra sin lista termina en desperdicio.', [ // e3
        'Se va al súper sin revisar la heladera',
        'Se compra lechuga aunque ya había',
        'Hay más lechuga de la que se puede comer en la semana',
        'Parte se marchita en el cajón',
        'Se tira',
      ], ['La lechuga dura el doble si hay mucha'], 'Revisar antes de salir es el hábito más simple y más efectivo.', { d: 1 }),
      vf('Comprar en grandes cantidades siempre reduce el desperdicio porque se usan menos envases.', false, 'Puede reducir envases, pero si la comida se vence antes de usarse, aumenta el desperdicio. Conviene comprar en cantidad solo lo que se conserva o se usa rápido.', { // e4
        razones: ['+Porque si se vence antes de usarse, aumenta el desperdicio', '-Porque los envases grandes no existen', '-Porque la comida en cantidad nunca se vence'],
        d: 2,
      }),
      teoria('Cocinar la porción justa', [
        'Cocinar de más es otra fuente de desperdicio. Algunas referencias ayudan: una taza de arroz o fideos secos alcanza para unas dos o tres porciones. Y si sobra, lo mejor es guardarlo en la heladera enseguida, en recipientes transparentes y a la vista, para usarlo en los días siguientes.',
      ]),
      mult('¿Qué hábitos reducen el desperdicio en casa? Marcá todos.', [ // e5
        '+Revisar la heladera antes de comprar',
        '+Planificar las comidas de la semana',
        '+Cocinar la cantidad justa',
        '+Guardar las sobras a la vista',
        '-Llenar la heladera "por las dudas"',
      ], 'Planificar, comprar justo, cocinar justo y aprovechar.', { d: 1 }),
      clas('¿Esta práctica aumenta o reduce el desperdicio?', { // e6
        'Lo reduce': ['Hacer lista de compras', 'Congelar el pan que no se va a comer', 'Usar primero lo que vence antes'],
        'Lo aumenta': ['Comprar ofertas sin pensar si se van a usar', 'Guardar las sobras al fondo de la heladera', 'Cocinar siempre el doble por las dudas'],
      }, 'Pequeños hábitos que, sumados, cambian mucho lo que se tira.', { d: 1 }),
      rank('Ordená estos alimentos según qué tan rápido suelen echarse a perder, de más rápido a más lento.', [ // e7
        ['Lechuga y verduras de hoja', 'pocos días'],
        ['Pan fresco', 'unos días'],
        ['Papas y zanahorias', 'semanas'],
        ['Arroz y legumbres secas', 'meses'],
      ], 'Saber qué dura poco ayuda a comprar en la cantidad justa y a usarlo primero.', { d: 2, extremos: ['Más rápido', 'Más lento'] }),
      op('Una familia tira mucho pan todas las semanas. ¿Qué conviene hacer primero?', [ // e8
        'Comprar menos y congelar lo que no se va a comer',
        'Comprar pan más barato para que no importe tirarlo',
        ['Dejar de comer pan por completo', 'No hace falta: alcanza con ajustar la cantidad y conservar mejor.'],
        'Guardarlo en una bolsa de plástico cerrada al sol',
      ], 'El pan se congela muy bien: se saca lo que se va a usar y se evita tirarlo.', { d: 1 }),
      det('Leé este relato y marcá los hábitos que generan desperdicio.', [ // e9
        ['Antes de ir al súper, miro qué hay en la heladera.', false],
        ['Aprovecho todas las ofertas de 3x2, aunque después se vence algo.', true, 'Si se vence, la oferta no fue ahorro y se tiró comida.'],
        ['Las sobras las guardo en recipientes transparentes.', false],
        ['Cocino siempre el doble por si viene alguien, y lo que sobra lo tiro.', true, 'Cocinar de más sin aprovechar las sobras genera desperdicio.'],
      ], 'Reconocer los hábitos es el primer paso para cambiarlos.', { d: 2 }),
      comp('Completá.', 'Antes de comprar conviene revisar la [heladera]; hay que cocinar la porción [justa]; y las sobras se guardan a la [vista].', ['alacena del vecino', 'doble', 'oscuridad'], 'Tres hábitos que reducen el desperdicio en casa.', { d: 1 }),
      est('Estimá cuántas porciones de arroz cocido rinde una taza de arroz seco.', 3, { min: 1, max: 10, paso: 1, unidad: 'porciones' }, 'Unas dos o tres porciones. Saberlo evita cocinar de más.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Fechas y conservación', 'Vencimiento o "consumir preferentemente antes de", la heladera por zonas, el freezer y el orden de la alacena.', [
      teoria('Dos fechas distintas', [
        'Los alimentos envasados pueden tener dos tipos de fecha. La fecha de vencimiento indica hasta cuándo el alimento es seguro: se usa en productos muy perecederos, como carnes frescas o lácteos, y no conviene consumirlos después. La leyenda "consumir preferentemente antes de" indica hasta cuándo el producto mantiene su mejor calidad: después puede perder sabor o textura, pero muchas veces sigue siendo seguro si se conservó bien.',
        'Confundir las dos hace que se tire comida en perfecto estado, como galletitas, fideos o arroz.',
      ]),
      clas('¿Qué indica cada fecha?', { // e1
        'Seguridad (vencimiento)': ['Carne picada fresca', 'Leche fresca', 'Pescado fresco'],
        'Calidad (consumir preferentemente)': ['Fideos secos', 'Galletitas', 'Arroz'],
      }, 'Con los perecederos, la fecha es de seguridad. Con los secos, suele ser de calidad.', { d: 2 }),
      vf('Unos fideos secos que pasaron la fecha de "consumir preferentemente antes de" hay que tirarlos siempre.', false, 'Esa fecha indica calidad, no seguridad. Si el envase está bien y no hay humedad, bichos ni olor raro, muchas veces siguen siendo aptos, quizás con algo menos de calidad.', { // e2
        razones: ['+Porque esa fecha indica calidad, no seguridad', '-Porque los fideos se vuelven tóxicos al día siguiente', '-Porque las fechas no significan nada'],
        d: 2,
      }),
      op('Encontrás una bandeja de carne picada con la fecha de vencimiento pasada ayer. ¿Qué conviene hacer?', [ // e3
        'No consumirla: es una fecha de seguridad',
        'Cocinarla más tiempo para compensar',
        ['Olerla y, si huele bien, comerla cruda', 'En perecederos la fecha es de seguridad: algunos microbios no se detectan por el olor.'],
        'Congelarla ahora para que vuelva a estar fresca',
      ], 'Con perecederos como la carne picada, la fecha de vencimiento es una cuestión de salud.', { d: 2 }),
      teoria('La heladera por zonas', [
        'La heladera no tiene la misma temperatura en todos lados. Lo más frío suele ser el estante de abajo y la parte del fondo: ahí van carnes y pescados crudos, bien envueltos. En los estantes del medio, lácteos y sobras. El cajón de abajo es para frutas y verduras. La puerta es la zona más cálida: bebidas y salsas, no leche ni huevos si se puede evitar.',
        'Guardar lo crudo abajo también evita que sus jugos goteen sobre otros alimentos.',
      ]),
      par('Uní cada alimento con su mejor lugar en la heladera.', [ // e4
        ['Carne cruda envuelta', 'Estante de abajo, al fondo'],
        ['Sobras de la cena', 'Estante del medio, a la vista'],
        ['Verduras de hoja', 'Cajón de verduras'],
        ['Salsas y bebidas', 'Puerta'],
      ], 'Cada zona tiene su temperatura y su función.', { d: 2 }),
      teoria('El freezer como aliado', [
        'El freezer frena casi por completo a los microbios: permite guardar pan, carne, porciones cocidas, frutas maduras cortadas y hasta hierbas por semanas o meses. Conviene rotular con la fecha y descongelar en la heladera, no en la mesada.',
        'Y en la alacena y la heladera, una regla simple: lo que vence antes, adelante. Así se usa primero.',
      ]),
      ord('Ordená cómo aprovechar el freezer para no tirar comida.', [ // e5
        'Detectar lo que no se va a usar a tiempo',
        'Porcionarlo en recipientes o bolsas',
        'Rotular con el contenido y la fecha',
        'Congelar',
        'Descongelar en la heladera cuando se vaya a usar',
      ], 'El freezer convierte "se va a echar a perder" en "lo como la semana que viene".', { d: 1, extremos: ['Primero', 'Último'] }),
      mult('¿Qué alimentos se pueden congelar bien para evitar tirarlos? Marcá todos.', [ // e6
        '+Pan',
        '+Porciones de guiso',
        '+Bananas maduras peladas para licuados',
        '+Carne cruda porcionada',
        '-Lechuga fresca para ensalada',
      ], 'La lechuga pierde su textura al congelarse. Casi todo lo demás se congela muy bien.', { d: 2 }),
      cad('Armá la cadena de "lo que vence antes, adelante".', [ // e7
        'Al guardar las compras, lo nuevo va atrás',
        'Lo que vence antes queda adelante',
        'Se ve y se usa primero',
        'Menos productos llegan a vencerse',
      ], ['Lo nuevo adelante hace que lo viejo dure más'], 'Una regla que usan los comercios y funciona igual en casa.', { d: 1 }),
      numv(3, (i) => { // e8
        const t = [4, 2, 5][i];
        return {
          enunciado: `La heladera está a ${t + 6} °C y conviene que esté a 5 °C o menos. ¿Cuántos grados habría que bajarla como mínimo?`,
          valor: t + 1,
          unidad: '°C',
          explicacion: `${t + 6} − 5 = ${t + 1} °C. A mayor temperatura, los microbios crecen más rápido y la comida dura menos.`,
        };
      }, { d: 1 }),
      det('Leé estos consejos y marcá los equivocados.', [ // e9
        ['La carne cruda va abajo, bien envuelta.', false],
        ['La leche conviene guardarla en la puerta, que es la zona más fría.', true, 'La puerta es la zona más cálida; mejor en un estante interior.'],
        ['Lo que vence antes va adelante.', false],
        ['Descongelá la carne en la mesada durante toda la tarde.', true, 'Mejor en la heladera: afuera la superficie se calienta y crecen microbios.'],
      ], 'Guardar bien es tan importante como comprar bien.', { d: 2 }),
      comp('Completá.', 'La fecha de [vencimiento] indica seguridad; "consumir preferentemente antes de" indica [calidad]; y lo que vence antes va [adelante].', ['compra', 'precio', 'atrás'], 'Las tres claves para no tirar comida en buen estado.', { d: 1 }),
      est('Estimá a qué temperatura debería estar el freezer de una heladera.', -18, { min: -40, max: 10, paso: 1, unidad: '°C' }, 'Alrededor de −18 °C. A esa temperatura los microbios casi no se multiplican.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Aprovechar todo', 'Sobras, tallos, cáscaras y pan duro: cómo convertir lo que se iba a tirar en otra comida.', [
      teoria('Cocina de aprovechamiento', [
        'Muchas cocinas tradicionales nacieron para no tirar nada: el budín de pan, las albóndigas y croquetas con sobras, los caldos con cáscaras y tallos, las tortillas con verduras del fondo de la heladera, las mermeladas con frutas muy maduras. Aprovechar es sabroso, barato y reduce el desperdicio.',
      ]),
      par('Uní cada sobra con una forma de aprovecharla.', [ // e1
        ['Pan duro', 'Budín de pan o pan rallado'],
        ['Arroz de ayer', 'Croquetas o arroz salteado'],
        ['Bananas muy maduras', 'Licuado o budín de banana'],
        ['Verduras un poco marchitas', 'Sopa o tarta'],
      ], 'Cada sobra tiene una receta que la convierte en otra comida.', { d: 1 }),
      teoria('Partes que casi nadie come', [
        'Hay partes de frutas y verduras que se tiran por costumbre y son comestibles y nutritivas: los tallos del brócoli, las hojas de la remolacha y la zanahoria, las cáscaras de papa bien lavadas, las semillas de zapallo tostadas. Otras, como las cáscaras de cebolla, sirven para caldos.',
        'Aprovecharlas reduce el desperdicio y suma fibra y nutrientes.',
      ]),
      clas('¿Se puede aprovechar esta parte para comer o para un caldo?', { // e2
        'Sí, se aprovecha': ['Tallo de brócoli', 'Hojas de remolacha', 'Semillas de zapallo tostadas', 'Cáscara de papa bien lavada'],
        'Mejor al compost': ['Cáscara de palta', 'Carozo de durazno'],
      }, 'Muchas partes que se tiran son comida. Lo que de verdad no se come, al compost.', { d: 2 }),
      vf('Los tallos del brócoli no se pueden comer.', false, 'Son comestibles y nutritivos: pelados y cortados en rodajas se cocinan igual que las flores del brócoli.', { // e3
        razones: ['+Porque son comestibles y nutritivos si se pelan y se cocinan', '-Porque son tóxicos', '-Porque no tienen ningún nutriente'],
        d: 1,
      }),
      numv(3, (i) => { // e4
        const kg = [1, 0.8, 1.5][i];
        const pct = [30, 35, 25][i];
        return {
          enunciado: `Un brócoli de ${kg.toLocaleString('es-AR')} kg tiene alrededor del ${pct} % de su peso en tallos. Si se aprovechan en lugar de tirarlos, ¿cuántos gramos de comida se ganan?`,
          valor: kg * 1000 * (pct / 100),
          unidad: 'gramos',
          explicacion: `${(kg * 1000).toLocaleString('es-AR')} g × ${pct} % = ${(kg * 1000 * (pct / 100)).toLocaleString('es-AR')} g de comida que se iba a tirar.`,
        };
      }, { d: 1 }),
      teoria('Un día de sobras', [
        'Una estrategia simple es tener un día fijo de la semana para cocinar con lo que quedó: una tarta, una tortilla, un salteado o una sopa con lo que haya en la heladera. Así las sobras tienen un destino planificado y no se olvidan.',
      ]),
      cad('Armá la cadena de cómo un "día de sobras" reduce el desperdicio.', [ // e5
        'Se elige un día fijo para cocinar con lo que queda',
        'Durante la semana, las sobras se guardan a la vista',
        'Ese día se revisa la heladera',
        'Se cocina una tarta o sopa con lo que haya',
        'Casi nada llega a echarse a perder',
      ], ['Las sobras se tiran para hacer lugar'], 'Un hábito fácil que convierte las sobras en parte del menú.', { d: 1 }),
      mult('¿Qué recetas sirven para aprovechar restos? Marcá todas.', [ // e6
        '+Tortilla de verduras',
        '+Budín de pan',
        '+Sopa con tallos y hojas',
        '+Licuado con frutas maduras',
        '-Tirar todo y pedir delivery',
      ], 'La cocina de aprovechamiento es variada, rica y barata.', { d: 1 }),
      op('Te sobraron fideos del mediodía. ¿Cuál es la mejor opción?', [ // e7
        'Enfriarlos y usarlos mañana en una tortilla',
        'Dejarlos en la olla sobre la mesada hasta la noche',
        ['Tirarlos porque los fideos recalentados no sirven', 'Recalentados o en otra preparación, se aprovechan perfectamente.'],
        'Dárselos a las palomas de la plaza',
      ], 'Guardar rápido en frío y reutilizar es seguro y rico.', { d: 1 }),
      rank('Ordená estos destinos para una fruta muy madura, del mejor al peor.', [ // e8
        ['Comerla o hacer un licuado', 'se aprovecha como alimento'],
        ['Hacer mermelada o un budín', 'se aprovecha transformada'],
        ['Llevarla a la compostera', 'vuelve al suelo'],
        ['Tirarla a la basura común', 'va al relleno y produce metano'],
      ], 'Primero comer, después transformar, después compostar. La basura, al final.', { d: 1, extremos: ['Mejor', 'Peor'] }),
      det('Leé este consejo de un grupo de cocina y marcá lo equivocado.', [ // e9
        ['Con el pan duro se hace pan rallado.', false],
        ['Las hojas de la remolacha son venenosas, hay que tirarlas.', true, 'Son comestibles y se cocinan como la acelga.'],
        ['Con verduras marchitas se hace una sopa.', false],
        ['Las sobras de ayer siempre hacen mal, hay que tirarlas.', true, 'Si se guardaron en frío enseguida, se pueden comer al día siguiente.'],
      ], 'Aprovechar con seguridad: frío rápido y buen criterio.', { d: 2 }),
      comp('Completá.', 'Con pan duro se hace [pan rallado]; con frutas muy maduras, un [licuado]; y lo que de verdad no se come va al [compost].', ['helado', 'asado', 'desagüe'], 'Tres destinos para lo que se iba a tirar.', { d: 1 }),
      est('Estimá qué porcentaje del peso de un brócoli son sus tallos.', 30, { min: 0, max: 100, paso: 5, unidad: '%' }, 'Alrededor de un tercio. Tirar los tallos es tirar casi un tercio de lo que se pagó.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Más allá de la casa', 'Comercios, restaurantes, donación de alimentos y la jerarquía de usos de la comida que sobra.', [
      teoria('La jerarquía de la comida', [
        'Igual que con los residuos, hay una jerarquía para la comida que sobra. Primero, prevenir que sobre. Después, que la coman personas: donarla a comedores o bancos de alimentos. Luego, usarla como alimento para animales, si es seguro. Después, compostarla o hacer biogás. Y como último recurso, el relleno.',
      ], { lista: ['1. Prevenir que sobre', '2. Donar a personas', '3. Alimento para animales', '4. Compost o biogás', '5. Relleno, como último recurso'] }),
      ord('Ordená los destinos de la comida que sobra, del mejor al peor.', [ // e1
        'Prevenir que sobre',
        'Donarla a personas',
        'Usarla como alimento para animales',
        'Compostarla o hacer biogás',
        'Enviarla al relleno',
      ], 'La comida es, antes que nada, para alimentar a personas.', { d: 1, extremos: ['Mejor', 'Peor'] }),
      teoria('Donar alimentos', [
        'Los bancos de alimentos reciben excedentes de empresas, comercios y productores —alimentos aptos que no se van a vender— y los distribuyen a comedores y organizaciones sociales. En Argentina, la Red Argentina de Bancos de Alimentos reúne bancos de muchas ciudades.',
        'La ley argentina promueve la donación de alimentos y protege a los donantes de buena fe: en 2018 se aprobó un plan nacional para reducir la pérdida y el desperdicio de alimentos, que también facilitó la donación.',
      ]),
      cad('Armá el recorrido de un alimento donado.', [ // e2
        'Un supermercado tiene yogures aptos a pocos días de vencer',
        'Los dona a un banco de alimentos',
        'El banco los clasifica y controla',
        'Los entrega a un comedor comunitario',
        'Los comen chicos del barrio antes de que venzan',
      ], ['El banco de alimentos los tira para hacer lugar'], 'La donación convierte un desperdicio en alimento, con controles de seguridad.', { d: 1 }),
      vf('Solo se pueden donar alimentos en perfecto estado y seguros para comer.', true, 'La donación tiene que garantizar la seguridad de quien recibe: alimentos aptos, bien conservados y dentro de las fechas que correspondan.', { // e3
        razones: ['+Porque hay que garantizar la seguridad de quien los recibe', '-Porque se puede donar cualquier cosa vencida', '-Porque la donación no tiene reglas'],
        d: 1,
      }),
      teoria('Restaurantes y comercios', [
        'En restaurantes y comedores, el desperdicio viene de porciones demasiado grandes, preparaciones de más, errores de planificación y lo que queda en los platos. Algunas medidas que funcionan: porciones ajustables, ofrecer llevar lo que sobra, medir lo que se tira para planificar mejor, y donar excedentes.',
        'En los comercios, ayudan la venta con descuento de productos cerca de su fecha, la venta de frutas y verduras "feas" y la donación.',
      ]),
      clas('¿Esta medida corresponde a un restaurante o a un comercio?', { // e4
        'Restaurante': ['Porciones chicas y grandes a elección', 'Ofrecer llevar lo que sobra en el plato', 'Medir cuánta comida vuelve de las mesas'],
        'Comercio': ['Descuento en productos cerca de su fecha', 'Vender frutas con defectos de forma', 'Donar pan del día a un comedor'],
      }, 'Cada eslabón tiene sus herramientas para reducir el desperdicio.', { d: 2 }),
      numv(3, (i) => { // e5
        const platos = [200, 150, 300][i];
        const g = [80, 100, 60][i];
        return {
          enunciado: `Un comedor sirve ${platos} platos por día y vuelven en promedio ${g} g de comida por plato. ¿Cuántos kg de comida se tiran por día?`,
          valor: (platos * g) / 1000,
          unidad: 'kg',
          dec: 1,
          explicacion: `${platos} × ${g} g = ${(platos * g).toLocaleString('es-AR')} g = ${((platos * g) / 1000).toLocaleString('es-AR')} kg por día. Medirlo es el primer paso para reducirlo.`,
        };
      }, { d: 1 }),
      op('¿Por qué conviene que un comedor mida cuánta comida vuelve de los platos?', [ // e6
        'Para ajustar porciones y preparaciones',
        'Para retar a quienes dejan comida',
        ['Para saber cuánto cobrar de más', 'El objetivo es reducir el desperdicio, no cobrar más.'],
        'Porque la ley obliga a pesar cada plato',
      ], 'Lo que se mide se puede mejorar: si siempre vuelve arroz, se sirve menos arroz.', { d: 2 }),
      par('Uní cada actor con una forma de reducir el desperdicio.', [ // e7
        ['Supermercado', 'Donar productos aptos cerca de su fecha'],
        ['Restaurante', 'Porciones a elección'],
        ['Productor de frutas', 'Vender frutas con defectos de forma'],
        ['Familia', 'Lista de compras y día de sobras'],
      ], 'El desperdicio se reduce en toda la cadena, no solo en la casa.', { d: 2 }),
      mult('¿Qué ayuda a que los comercios desperdicien menos? Marcá todo.', [ // e8
        '+Descuentos en productos cerca de su fecha',
        '+Vender frutas y verduras con defectos de forma',
        '+Acuerdos de donación con bancos de alimentos',
        '+Planificar pedidos con datos de ventas',
        '-Tirar todo lo que tiene una mancha mínima',
      ], 'Datos, descuentos, donación y aceptar frutas "feas".', { d: 1 }),
      det('Leé este plan de un supermercado y marcá lo que no conviene.', [ // e9
        ['Donaremos los productos aptos cercanos a su fecha.', false],
        ['Tiraremos las frutas con defectos de forma porque no se venden.', true, 'Se pueden vender más baratas o donar: son igual de nutritivas.'],
        ['Venderemos con descuento lo que vence en dos días.', false],
        ['Donaremos carne con la fecha de vencimiento pasada.', true, 'Las fechas de seguridad no se pueden superar: pondría en riesgo a quienes la reciben.'],
      ], 'Reducir el desperdicio sin comprometer la seguridad de nadie.', { d: 3 }),
      comp('Completá.', 'Antes que nada, la comida que sobra conviene [donarla] a personas; los [bancos] de alimentos distribuyen excedentes; y el relleno es el último [recurso].', ['tirarla', 'clubes', 'paso'], 'La jerarquía de la comida que sobra, en una línea.', { d: 1 }),
      rank('Ordená estas medidas de un restaurante por su lugar en la jerarquía, de la más alta a la más baja.', [ // e11
        ['Ajustar porciones para que no sobre', 'prevenir'],
        ['Donar lo que sobró sin servir', 'donar a personas'],
        ['Mandar restos a una compostera', 'compostar'],
        ['Tirar todo a la basura', 'relleno'],
      ], 'La misma escalera que viste en la rama de Residuos, aplicada a la comida.', { d: 2, extremos: ['Más alta', 'Más baja'] }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: la comida que se tira', 'Números, causas, fechas, aprovechamiento y donación, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: la heladera de los Martínez', 'Los Martínez anotaron durante un mes todo lo que tiraron. Con los datos, armá su plan para reducir el desperdicio.', [
      teoria('El registro', [
        'Los Martínez son cuatro. En un mes tiraron: 4 kg de pan, 3 kg de verduras de hoja marchitas, 2 kg de frutas muy maduras, 2,5 kg de sobras de comidas y 1,5 kg de yogures y quesos vencidos. También 1 kg de carne picada que se venció.',
        'Suelen hacer una compra grande cada 15 días, sin lista, y aprovechan casi todas las ofertas.',
      ]),
      num('¿Cuántos kg de comida tiraron en total en el mes?', 14, 'kg', '4 + 3 + 2 + 2,5 + 1,5 + 1 = 14 kg en un mes.', { ctx: 'Pan 4 kg, verduras 3, frutas 2, sobras 2,5, lácteos 1,5, carne 1.', d: 1 }),
      num('A ese ritmo, ¿cuántos kg tirarían en un año de 12 meses?', 168, 'kg', '14 × 12 = 168 kg por año: unos 42 kg por persona, sin contar cáscaras ni restos no comestibles.', { ctx: 'Los Martínez tiran 14 kg de comida por mes.', d: 1 }),
      clas('Asigná a cada desperdicio la estrategia que más lo reduciría.', { // e3
        'Comprar menos o congelar': ['Pan', 'Carne picada'],
        'Aprovechar en otra receta': ['Frutas muy maduras', 'Sobras de comidas'],
        'Comprar más seguido y en menor cantidad': ['Verduras de hoja', 'Yogures'],
      }, 'Cada alimento tiene su estrategia: el pan y la carne se congelan; las frutas y sobras se transforman; lo que dura poco se compra más seguido.', { d: 3 }),
      rank('Ordená los alimentos que tiraron según su huella de carbono por kilo, de mayor a menor.', [ // e4
        ['Carne picada', 'la más alta'],
        ['Quesos y yogures', 'alta'],
        ['Pan', 'baja'],
        ['Verduras de hoja', 'muy baja'],
      ], 'Por peso, el pan fue lo que más tiraron; por huella, la carne y los lácteos pesan más. Las dos miradas importan.', { d: 3 }),
      op('¿Qué cambio tiene más efecto sobre casi todos los desperdicios de los Martínez?', [ // e5
        'Planificar el menú y comprar con lista',
        'Comprar una heladera más grande',
        ['Comprar todo en envases individuales', 'Más envases no evitan que la comida se venza.'],
        'Dejar de comprar verduras de hoja',
      ], 'La compra grande sin lista y las ofertas explican buena parte del desperdicio. Planificar ataca la causa común.', { d: 3 }),
      mult('¿Qué debería incluir su plan? Marcá todo.', [ // e6
        '+Lista de compras según el menú de la semana',
        '+Congelar el pan que no se va a comer en dos días',
        '+Un día de sobras por semana',
        '+Guardar lo que vence antes adelante',
        '-Aprovechar todas las ofertas 3x2 aunque no las necesiten',
      ], 'Planificar, conservar y aprovechar: los tres pilares de un plan antidesperdicio.', { d: 2 }),
      det('Los Martínez escriben su plan. Marcá lo que no conviene.', [ // e7
        ['Haremos compras más chicas cada semana, con lista.', false],
        ['Si la carne picada pasa un día la fecha de vencimiento, la cocinamos bien y listo.', true, 'Es una fecha de seguridad: no conviene consumirla.'],
        ['Las bananas maduras van al freezer para licuados.', false],
        ['Seguimos comprando ofertas grandes porque siempre ahorran.', true, 'Si la comida se vence, la oferta no ahorra y genera desperdicio.'],
      ], 'Un buen plan cuida el bolsillo, la salud y el ambiente al mismo tiempo.', { d: 3 }),
    ]),
  ],
});
