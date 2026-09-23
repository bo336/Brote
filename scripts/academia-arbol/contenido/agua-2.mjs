import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// AGUA 2 — Cuidar el agua en casa.
// De saber cuánta agua se usa (agua-1) a bajarla: pérdidas, baño, cocina,
// lavado, riego y medición. Todo con números propios, porque el mejor consejo
// es el que se puede comprobar en el medidor de la casa.

export default unidad({
  slug: 'agua-2',
  rama: 'agua',
  orden: 2,
  nivel: 1,
  requiereTronco: 1,
  titulo: 'Cuidar el agua en casa',
  bajada: 'Pérdidas, ducha, cocina, lavado y riego: cómo gastar mucho menos agua sin vivir peor, y cómo comprobarlo en el medidor.',
  objetivos: [
    'Detectar pérdidas de agua en casa usando el medidor y pruebas simples',
    'Calcular cuánto ahorra cada cambio en el baño, la cocina y el lavado',
    'Regar de forma eficiente según el horario, el método y las plantas',
    'Leer el consumo en la factura y compararlo mes a mes',
    'Relacionar el agua caliente con el gasto de energía',
  ],
  repasa: ['agua-1', 'tronco-2'],
  fuentes: ['aysa', 'un-water', 'epa', 'iea-eficiencia', 'plantas-nativas'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Las pérdidas que no se ven', 'Una canilla que gotea o un inodoro que pierde pueden gastar más que toda una familia. Cómo encontrarlos.', [
      teoria('Gota a gota', [
        'Una canilla que gotea parece una pérdida insignificante, pero trabaja las 24 horas. Una gota es alrededor de 0,05 mililitros: una gota por segundo son 4,3 litros por día y más de 1.500 litros por año.',
        'Un inodoro que pierde es peor todavía, porque muchas veces el agua corre por dentro del artefacto sin hacer ruido. Según el tamaño de la falla, puede perder desde decenas hasta cientos de litros por día.',
      ], { destacado: { valor: '1 gota/s', texto: 'son unos 4 litros por día y más de 1.500 litros por año, de una sola canilla.' } }),
      ejemplo('Cuánto pierde una canilla', 'Una canilla deja caer 3 gotas por segundo. Cada gota son 0,05 ml. ¿Cuánto pierde por día?', [
        'Por segundo: 3 × 0,05 ml = 0,15 ml.',
        'Por día hay 86.400 segundos: 0,15 × 86.400 = 12.960 ml.',
        'Pasado a litros: 12.960 ÷ 1.000 ≈ 13 litros por día.',
      ], 'Unos 13 litros por día, casi 4.700 litros por año, de una sola canilla. Cambiar un cuerito cuesta muy poco.'),
      numv(4, (i) => {
        const g = [2, 1, 4, 5][i];
        const l = Math.round((g * 0.05 * 86400) / 100) / 10;
        return {
          enunciado: `Una canilla deja caer ${g} ${g === 1 ? 'gota' : 'gotas'} por segundo (0,05 ml cada una). ¿Cuántos litros pierde por día? Redondeá a un decimal.`,
          valor: l,
          unidad: 'litros por día',
          dec: 1,
          tol: 0.2,
          explicacion: `${g} × 0,05 ml = ${(g * 0.05).toLocaleString('es-AR')} ml por segundo; × 86.400 segundos = ${(g * 0.05 * 86400).toLocaleString('es-AR')} ml, o sea ${l.toLocaleString('es-AR')} litros por día.`,
        };
      }, { d: 2 }),
      teoria('El medidor delata todo', [
        'Si tu casa tiene medidor de agua, podés usarlo para cazar pérdidas. Cerrá todas las canillas, asegurate de que nadie use agua ni esté funcionando el lavarropas, anotá el número del medidor y volvé a mirar una o dos horas después sin usar agua.',
        'Si el número cambió, hay una pérdida en algún lugar de la instalación. Muchos medidores tienen además una ruedita o estrella que gira con cualquier consumo: si gira con todo cerrado, algo pierde.',
      ], { lista: ['1. Cerrar todo lo que usa agua', '2. Anotar el número del medidor', '3. Esperar una o dos horas sin usar agua', '4. Si el número subió, hay una pérdida'] }),
      ord('Ordená la prueba del medidor para encontrar una pérdida.', [
        'Cerrar todas las canillas y apagar lo que usa agua',
        'Anotar el número que marca el medidor',
        'Esperar una o dos horas sin usar agua',
        'Volver a leer el medidor y comparar',
      ], 'Si el número se movió sin que nadie usara agua, el agua se está yendo por algún lado. El paso siguiente es buscar dónde.', { d: 1, extremos: ['Primero', 'Último'] }),
      teoria('La prueba del colorante', [
        'Para saber si el inodoro pierde, se ponen unas gotas de colorante (puede ser de repostería) en la mochila, y se espera media hora sin usarlo. Si aparece color en el inodoro, el agua está pasando por dentro aunque no se escuche.',
        'Las causas más comunes son una goma de la descarga gastada o un flotante mal regulado. Son repuestos baratos, y arreglarlo suele pagarse solo en pocos meses de factura.',
      ]),
      op('Pusiste colorante en la mochila del inodoro y a la media hora el agua del inodoro está teñida. ¿Qué significa?', [
        'Que la mochila pierde agua hacia el inodoro',
        'Que el colorante es de mala calidad',
        ['Que el inodoro está funcionando bien', 'Si todo estuviera bien, el color se quedaría en la mochila hasta la próxima descarga.'],
        'Que la cloaca del barrio está tapada',
      ], 'El agua de la mochila solo debería bajar al descargar. Si baja sola, pierde: en general, por una goma gastada o el flotante.', { d: 2 }),
      numv(3, (i) => {
        const a = [12345, 5820, 40210][i];
        const b = [12346, 5821, 40212][i];
        return {
          enunciado: `Antes de dormir, con todo cerrado, el medidor marcaba ${a.toLocaleString('es-AR')} m³. A la mañana, sin haber usado agua, marca ${b.toLocaleString('es-AR')} m³. ¿Cuántos litros se perdieron en la noche?`,
          valor: (b - a) * 1000,
          unidad: 'litros',
          explicacion: `La diferencia es ${b - a} m³, y cada metro cúbico son 1.000 litros: ${((b - a) * 1000).toLocaleString('es-AR')} litros perdidos en una noche. Hay una pérdida importante que buscar.`,
        };
      }, { d: 3 }),
      clas('¿Qué señal indica una pérdida y cuál no?', {
        'Señal de pérdida': ['El medidor avanza con todo cerrado', 'Una mancha de humedad que crece en la pared', 'Se escucha correr agua en el inodoro sin usarlo'],
        'No indica pérdida': ['El agua sale fría a la mañana', 'La factura sube en verano por el riego', 'La ducha tarda en calentarse'],
      }, 'Una factura más alta en verano puede ser uso real (riego, más duchas). Las pérdidas se reconocen porque hay consumo sin uso.', { d: 2 }),
      vf('Si no se escucha ningún ruido, el inodoro no puede estar perdiendo agua.', false, 'Muchas pérdidas del inodoro son silenciosas: el agua pasa por dentro como un hilo. Por eso existe la prueba del colorante.', {
        razones: ['+Porque el agua puede pasar como un hilo silencioso por dentro', '-Porque los inodoros nunca pierden', '-Porque solo pierden los inodoros nuevos'],
        d: 2,
      }),
      rank('Ordená estas pérdidas por cuánta agua pueden desperdiciar en un día, de más a menos.', [
        ['Un inodoro con la descarga trabada abierta', 'cientos de litros o más'],
        ['Un inodoro con una pérdida silenciosa chica', 'decenas de litros'],
        ['Una canilla que gotea 2 gotas por segundo', '≈ 9 litros'],
        ['Una canilla que gotea una gota cada 5 segundos', 'menos de 1 litro'],
      ], 'El inodoro manda: puede perder muchísimo sin que se note. Las canillas suman, y todas conviene arreglarlas.', { d: 3 }),
      det('Un vecino explica cómo revisa su casa. Marcá los errores.', [
        ['Cierro todas las canillas y anoto el medidor antes de dormir.', false],
        ['A la noche dejo andando el lavarropas, total no importa para la prueba.', true, 'El lavarropas usa agua: con él andando, el medidor avanza aunque no haya pérdida.'],
        ['A la mañana comparo el número con lo que anoté.', false],
        ['Si el número subió 1 m³, perdí apenas 1 litro, no vale la pena buscar.', true, 'Un metro cúbico son 1.000 litros, no uno: es una pérdida grande.'],
      ], 'La prueba solo sirve si no hay ningún uso de agua. Y la unidad del medidor, el metro cúbico, son mil litros.', { d: 3 }),
      comp('Completá.', 'Para saber si el inodoro pierde se pone [colorante] en la mochila; si aparece en el inodoro sin usarlo, la [goma] de descarga o el [flotante] no cierran bien.', ['cloro', 'caño', 'medidor'], 'La prueba del colorante y las dos piezas culpables más comunes. Los repuestos son baratos y el ahorro es enorme.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('El baño: ducha e inodoro', 'Donde más agua usa una casa, y donde más fácil es ahorrar sin perder comodidad.', [
      teoria('La ducha, primera candidata', [
        'Como viste, una ducha común entrega unos 10 litros por minuto. Acortarla dos o tres minutos ya ahorra decenas de litros por persona por día. Otra opción, sin cambiar el tiempo, es instalar una flor de ducha de bajo caudal, que mezcla aire con el agua y entrega 6 u 8 litros por minuto con buena sensación de presión.',
        'Cerrar la ducha mientras te enjabonás o te ponés champú también suma: son uno o dos minutos por ducha en los que el agua corre sin que la uses.',
      ]),
      numv(4, (i) => {
        const antes = [12, 10, 15, 10][i];
        const despues = [7, 6, 9, 8][i];
        const min = [8, 10, 7, 12][i];
        const ah = (antes - despues) * min;
        return {
          enunciado: `Cambiás una flor de ducha de ${antes} litros por minuto por una de ${despues}. Si tu ducha dura ${min} minutos, ¿cuántos litros ahorrás por ducha?`,
          valor: ah,
          unidad: 'litros',
          explicacion: `Se ahorran ${antes - despues} litros por cada minuto, durante ${min} minutos: ${antes - despues} × ${min} = ${ah} litros por ducha, sin acortarla.`,
        };
      }, { d: 2 }),
      teoria('El inodoro, el que más descargas hace', [
        'Un inodoro viejo puede usar 10 a 15 litros por descarga. Los de doble descarga tienen un botón corto (unos 3 litros) y uno largo (unos 6): usar el corto cuando alcanza reduce mucho el consumo.',
        'Si tu inodoro es viejo y no querés cambiarlo, una botella llena de agua (o arena) dentro de la mochila ocupa lugar y hace que cada descarga use un litro o dos menos. Hay que ubicarla para que no trabe el mecanismo.',
      ]),
      ejemplo('Doble descarga en una familia', 'Una familia de 4 hace 5 descargas por persona por día. Con el inodoro viejo, cada descarga usa 12 litros. Con uno de doble descarga, 4 de cada 5 descargas son cortas (3 L) y 1 es larga (6 L).', [
        'Viejo: 4 personas × 5 descargas × 12 L = 240 litros por día.',
        'Nuevo, por persona: 4 cortas × 3 L + 1 larga × 6 L = 18 litros; para 4 personas, 72 litros.',
        'Ahorro: 240 − 72 = 168 litros por día.',
      ], 'La familia ahorra unos 168 litros por día: más de 60.000 litros por año, solo con el inodoro.'),
      numv(3, (i) => {
        const pers = [3, 5, 2][i];
        const viejo = pers * 5 * 12;
        const nuevo = pers * (4 * 3 + 6);
        return {
          enunciado: `Una casa de ${pers} personas hace 5 descargas por persona por día. Con un inodoro de 12 litros usa ${viejo} litros; con doble descarga (4 cortas de 3 L y 1 larga de 6 L por persona), ¿cuántos litros por día usaría?`,
          valor: nuevo,
          unidad: 'litros por día',
          explicacion: `Por persona: 4 × 3 + 1 × 6 = 18 litros. Para ${pers} personas: 18 × ${pers} = ${nuevo} litros por día, contra ${viejo} del inodoro viejo.`,
        };
      }, { d: 3 }),
      mult('¿Qué cambios en el baño bajan el consumo sin molestar a nadie? Marcá todos.', [
        '+Una flor de ducha de bajo caudal',
        '+Usar la descarga corta del inodoro cuando alcanza',
        '+Cerrar la ducha mientras te enjabonás',
        '+Un aireador en la canilla del lavatorio',
        '-Tirar la cadena después de cada uso para "limpiar los caños"',
      ], 'Descargar de más no limpia nada: solo gasta. Los otros cuatro cambios ahorran sin cambiar la comodidad.', { d: 2 }),
      vf('Una flor de ducha de bajo caudal siempre deja una ducha incómoda y sin presión.', false, 'Las flores eficientes mezclan aire con el agua o concentran el chorro, y dan buena sensación de presión con 6 a 8 litros por minuto. Hay modelos malos, pero no es una regla.', {
        razones: ['+Porque mezclan aire y agua para mantener la sensación de presión', '-Porque todas cortan el agua caliente', '-Porque reducen el caudal a cero'],
        d: 2,
      }),
      teoria('El agua caliente también es energía', [
        'Cada litro de agua caliente de la ducha se calentó con gas o electricidad. Por eso una ducha más corta ahorra dos cosas a la vez: agua y energía. En muchas casas, el calefón o el termotanque son uno de los mayores consumos de energía.',
        'Mientras esperás que salga caliente, el agua fría que corre se puede juntar en un balde y usar para regar o para el inodoro.',
      ]),
      op('¿Por qué acortar la ducha ahorra más que solo agua?', [
        'Porque también ahorra la energía que calentó el agua',
        'Porque el agua fría gasta más energía que la caliente',
        ['Porque la ducha gasta electricidad en la luz del baño', 'La luz gasta poco: lo que pesa es calentar decenas de litros de agua.'],
        'Porque el jabón se gasta menos rápido',
      ], 'Calentar agua requiere mucha energía. Por eso la ducha es a la vez uno de los grandes usos de agua y de energía de una casa.', { d: 2 }),
      cad('Armá la cadena de efectos de acortar la ducha de 15 a 8 minutos.', [
        'La ducha dura 7 minutos menos',
        'Se usan unos 70 litros menos de agua',
        'El calefón calienta 70 litros menos',
        'Baja el consumo de gas o electricidad',
      ], ['Sube la presión del agua de todo el barrio'], 'Un cambio de hábito, dos ahorros. El señuelo exagera: una ducha no cambia la presión del barrio.', { d: 3 }),
      comp('Completá.', 'Una flor de bajo caudal mezcla [aire] con el agua; la descarga [corta] del inodoro usa unos 3 litros, y una ducha más corta ahorra agua y [energía].', ['sal', 'larga', 'cloro'], 'Tres herramientas del baño que suman: tecnología (flor, doble descarga) y hábito (ducha corta).', { d: 2 }),
      det('Leé este consejo de una revista y marcá lo equivocado.', [
        ['Una botella llena dentro de la mochila reduce cada descarga.', false],
        ['Conviene poner la botella justo sobre el mecanismo de descarga, así presiona más.', true, 'Si traba el mecanismo, el inodoro puede quedar perdiendo: va a un costado.'],
        ['Mientras esperás el agua caliente, juntá la fría en un balde.', false],
        ['Las duchas largas no gastan energía si el calefón es a gas.', true, 'El gas también es energía: calentar más agua quema más gas.'],
      ], 'La botella va donde no moleste, y el gas es energía como la electricidad.', { d: 3 }),
      numv(3, (i) => {
        const pers = [4, 3, 5][i];
        const min = [2, 1.5, 2][i];
        return {
          enunciado: `En una casa de ${pers} personas, cada una cierra la ducha ${min.toLocaleString('es-AR')} minutos mientras se enjabona (ducha de 10 L/min, una por día). ¿Cuántos litros ahorran en un mes de 30 días?`,
          valor: pers * min * 10 * 30,
          unidad: 'litros',
          explicacion: `Por persona y por día: ${min.toLocaleString('es-AR')} min × 10 L = ${min * 10} litros. × ${pers} personas × 30 días = ${(pers * min * 10 * 30).toLocaleString('es-AR')} litros por mes, sin acortar la ducha.`,
        };
      }, { d: 3 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('La cocina y el lavado', 'Platos, alimentos y ropa: tres lugares donde el hábito pesa más que el aparato.', [
      teoria('Lavar los platos', [
        'Lavar con la canilla abierta todo el tiempo es la forma que más agua usa: con 8 litros por minuto, diez minutos son 80 litros. Llenar la pileta (o un recipiente) con agua y detergente para lavar, y enjuagar con un chorro corto, puede usar menos de la mitad.',
        'Un lavavajillas moderno, usado con la carga completa, suele usar menos agua por lavado que muchas personas lavando a mano con la canilla abierta. Usado medio vacío, pierde esa ventaja.',
      ]),
      numv(3, (i) => {
        const min = [10, 15, 8][i];
        const lpm = 8;
        const pileta = [30, 35, 25][i];
        return {
          enunciado: `Lavar los platos con la canilla abierta ${min} minutos (8 litros por minuto) contra llenar la pileta con ${pileta} litros y enjuagar rápido con 10 litros más. ¿Cuántos litros ahorra el método de la pileta?`,
          valor: min * lpm - (pileta + 10),
          unidad: 'litros',
          explicacion: `Canilla abierta: ${min} × 8 = ${min * lpm} litros. Pileta: ${pileta} + 10 = ${pileta + 10} litros. Ahorro: ${min * lpm} − ${pileta + 10} = ${min * lpm - (pileta + 10)} litros por lavado.`,
        };
      }, { d: 2 }),
      teoria('Pequeños usos que se repiten', [
        'Descongelar un alimento bajo el chorro de la canilla puede gastar decenas de litros. Si se pasa la noche anterior del freezer a la heladera, se descongela solo y de forma más segura.',
        'Lavar frutas y verduras en un recipiente, en lugar de bajo el chorro, gasta mucho menos, y esa agua sirve después para regar. Lo mismo el agua de hervir fideos o verduras, una vez fría, para las plantas.',
      ], { lista: ['Descongelar en la heladera, no bajo la canilla', 'Lavar verduras en un recipiente', 'Reusar el agua de lavar verduras para regar', 'Tener una jarra de agua fría en la heladera en vez de dejar correr la canilla'] }),
      mult('¿Qué hábitos de la cocina ahorran agua? Marcá todos.', [
        '+Pasar la carne del freezer a la heladera la noche anterior',
        '+Lavar las verduras en un recipiente',
        '+Tener agua fría en una jarra en la heladera',
        '-Dejar correr la canilla hasta que el agua salga bien fría para tomar',
        '-Enjuagar cada plato bajo el chorro antes de meterlo al lavavajillas',
      ], 'Prever y usar recipientes: esas son las dos claves de la cocina. Prelavar bajo el chorro anula buena parte del ahorro del lavavajillas.', { d: 2 }),
      teoria('La ropa', [
        'El lavarropas usa una cantidad de agua parecida por ciclo esté lleno o no, así que lavar con carga completa reduce el agua por prenda. Muchos lavarropas tienen además programas de carga media o económicos.',
        'Lavar con agua fría ahorra la energía de calentarla, y para la mayoría de la ropa de uso diario limpia igual con los jabones actuales. Y no toda prenda necesita lavarse después de cada uso.',
      ]),
      op('Un lavarropas usa 60 litros por ciclo. ¿Qué conviene más?', [
        'Esperar a juntar una carga completa',
        'Lavar un poco todos los días para no acumular',
        ['Lavar cada prenda apenas se usa, en ciclos cortos', 'Cada ciclo usa agua parecida aunque tenga poca ropa: más ciclos, más agua por prenda.'],
        'Usar siempre el programa de agua caliente',
      ], 'Con la misma agua por ciclo, más ropa por lavado es menos agua por prenda. El agua caliente, además, suma gasto de energía.', { d: 2 }),
      numv(3, (i) => {
        const ciclos = [7, 5, 6][i];
        const menos = [4, 3, 3][i];
        const l = 60;
        return {
          enunciado: `Una familia hace ${ciclos} lavados por semana a medio llenar. Si juntando cargas completas los baja a ${menos}, con 60 litros por ciclo, ¿cuántos litros ahorra por semana?`,
          valor: (ciclos - menos) * l,
          unidad: 'litros',
          explicacion: `Son ${ciclos - menos} ciclos menos por semana × 60 litros = ${(ciclos - menos) * l} litros semanales, unos ${((ciclos - menos) * l * 52).toLocaleString('es-AR')} litros por año.`,
        };
      }, { d: 3 }),
      vf('El lavavajillas siempre gasta más agua que lavar a mano.', false, 'Depende de cómo se lave a mano y de si el lavavajillas va lleno. Un lavavajillas eficiente con carga completa suele usar menos agua que lavar a mano con la canilla abierta.', {
        razones: ['+Porque depende del método a mano y de llenar el lavavajillas', '-Porque los lavavajillas no usan agua', '-Porque lavar a mano nunca gasta agua'],
        d: 3,
      }),
      rank('Ordená estas formas de lavar los platos de una cena familiar por litros usados, de más a menos.', [
        ['A mano, con la canilla abierta 15 minutos', '≈ 120 litros'],
        ['A mano, con la pileta llena y enjuague rápido', '≈ 40 litros'],
        ['Lavavajillas eficiente con carga completa', '≈ 12 litros'],
      ], 'Los valores son aproximados y cambian según el aparato, pero el orden se repite: el chorro continuo es lo que más gasta.', { d: 3 }),
      clas('¿Estos hábitos ahorran agua, energía o las dos cosas?', {
        'Sobre todo agua': ['Descongelar en la heladera', 'Lavar verduras en un recipiente', 'Usar la descarga corta del inodoro'],
        'Agua y energía': ['Lavar la ropa con agua fría y carga completa', 'Acortar la ducha', 'Llenar el lavavajillas antes de usarlo'],
      }, 'Todo lo que involucra agua caliente o un aparato eléctrico ahorra también energía. Es la conexión entre esta rama y la de Energía.', { d: 3 }),
      det('Leé esta rutina de lavado y marcá lo que desperdicia.', [
        ['Junto la ropa hasta tener una carga completa.', false],
        ['Lavo todo con el programa de agua a 60 grados por las dudas.', true, 'Para la ropa de todos los días, el agua fría limpia bien y ahorra la energía de calentarla.'],
        ['Tiendo al sol en vez de usar el secarropas.', false],
        ['Enjuago cada plato con el chorro antes de meterlo al lavavajillas.', true, 'El prelavado con chorro usa tanta agua que se pierde la ventaja del lavavajillas.'],
      ], 'Los dos desperdicios son hábitos "por las dudas" que duplican lo que el aparato ya hace.', { d: 3 }),
      par('Uní cada situación de la cocina con la forma de ahorrar agua.', [
        ['Hay que descongelar pollo para la cena', 'Pasarlo a la heladera la noche anterior'],
        ['Querés tomar agua fría', 'Tener una jarra en la heladera'],
        ['Lavaste la lechuga en un bol', 'Usar esa agua para regar las plantas'],
        ['Hervís fideos', 'Dejar enfriar el agua y regar con ella'],
      ], 'En la cocina el ahorro viene de prever y de darle un segundo uso al agua, no de privarse de nada.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Regar con cabeza', 'El jardín y la vereda pueden ser el mayor consumo de una casa en verano. Cuándo, cómo y qué regar.', [
      teoria('El horario lo cambia todo', [
        'Regar al mediodía de verano es regar al aire: con sol fuerte, calor y viento, una buena parte del agua se evapora antes de llegar a las raíces. Temprano a la mañana o al atardecer, la evaporación es mucho menor y el suelo tiene horas para absorber el agua.',
        'También conviene regar menos veces pero más profundo: mojar bien el suelo cada dos o tres días hace que las raíces crezcan hacia abajo, mientras que un riego superficial diario las deja arriba, donde el suelo se seca rápido.',
      ]),
      op('¿Cuál es el mejor momento para regar un jardín en verano?', [
        'Temprano a la mañana o al atardecer',
        'Al mediodía, cuando más calor hace',
        ['A la siesta, para refrescar las plantas', 'A la siesta todavía hace mucho calor: gran parte del agua se evapora.'],
        'Da igual el horario, el agua es la misma',
      ], 'Menos sol y menos calor significa menos evaporación: más agua llega a las raíces con el mismo riego.', { d: 1 }),
      teoria('Cómo llega el agua', [
        'La manguera abierta moja todo, incluso veredas y caminos, y mucho escurre sin infiltrarse. El riego por goteo lleva el agua gota a gota justo al pie de cada planta, y puede usar una fracción del agua de una manguera para el mismo resultado.',
        'Cubrir el suelo con hojas secas, pasto cortado o chips de madera (mulch) reduce la evaporación, mantiene la humedad y protege la vida del suelo. Un suelo cubierto necesita regarse mucho menos que uno desnudo.',
      ], { lista: ['Goteo: agua justo en la raíz', 'Mulch o cobertura: menos evaporación', 'Riego profundo y espaciado: raíces más profundas', 'Regadera o balde en macetas: nada se desperdicia en el piso'] }),
      par('Uní cada técnica con lo que logra.', [
        ['Riego por goteo', 'Llevar el agua solo a la raíz'],
        ['Mulch o cobertura del suelo', 'Reducir la evaporación del suelo'],
        ['Regar al atardecer', 'Que se evapore menos agua'],
        ['Riego profundo y espaciado', 'Que las raíces crezcan hacia abajo'],
      ], 'Cuatro técnicas que se combinan. Juntas pueden bajar el riego a una fracción de lo que se usa con manguera al mediodía.', { d: 2 }),
      teoria('Plantas que no piden tanto', [
        'Un césped siempre verde necesita mucha agua en verano. Las plantas nativas de tu región, en cambio, están adaptadas al clima local: una vez establecidas, muchas sobreviven con la lluvia o con riegos ocasionales.',
        'Elegir nativas no es solo ahorrar agua: también alimenta a las mariposas, abejas y pájaros de la zona. Lo vas a ver en detalle en la rama de Plantas.',
      ]),
      vf('Un jardín de plantas nativas bien establecido suele necesitar menos riego que un césped siempre verde.', true, 'Las nativas están adaptadas a las lluvias y temperaturas de su región. El césped ornamental, en cambio, necesita riegos frecuentes en verano para mantenerse verde.', {
        razones: ['+Porque están adaptadas al clima y las lluvias de la región', '-Porque las plantas nativas no toman agua', '-Porque el césped no necesita agua en verano'],
        d: 2,
      }),
      teoria('La vereda y el auto', [
        'Baldear la vereda con manguera puede gastar cientos de litros en pocos minutos, y lo que arrastra termina en la rejilla y en el arroyo. Barrer en seco y, si hace falta, pasar un trapo o un balde con poca agua resuelve lo mismo.',
        'Para lavar el auto pasa algo parecido: un balde y una esponja pueden usar una fracción del agua de una manguera abierta todo el lavado.',
      ]),
      numv(3, (i) => {
        const min = [15, 20, 10][i];
        const lpm = 15;
        const baldes = [3, 4, 2][i];
        return {
          enunciado: `Lavar la vereda con manguera durante ${min} minutos (15 litros por minuto) contra barrer en seco y usar ${baldes} baldes de 10 litros. ¿Cuántos litros se ahorran?`,
          valor: min * lpm - baldes * 10,
          unidad: 'litros',
          explicacion: `Manguera: ${min} × 15 = ${min * lpm} litros. Baldes: ${baldes} × 10 = ${baldes * 10} litros. Ahorro: ${min * lpm - baldes * 10} litros por limpieza, y menos suciedad yendo a la rejilla.`,
        };
      }, { d: 2 }),
      teoria('Juntar la lluvia', [
        'El agua de lluvia que cae en un techo se puede juntar en un tanque o un barril conectado a la canaleta, y usar después para regar. Es agua gratis y blanda, ideal para las plantas.',
        'La cuenta es simple: cada milímetro de lluvia sobre un metro cuadrado de techo es un litro de agua. Un techo de 50 m² con una lluvia de 20 mm junta hasta 1.000 litros.',
      ], { destacado: { valor: '1 mm × 1 m²', texto: '= 1 litro. Así se calcula cuánta lluvia puede juntar un techo.' } }),
      numv(4, (i) => {
        const m2 = [40, 60, 25, 80][i];
        const mm = [15, 10, 30, 12][i];
        return {
          enunciado: `Un techo de ${m2} m² recibe una lluvia de ${mm} mm. ¿Cuántos litros podría juntar como máximo?`,
          valor: m2 * mm,
          unidad: 'litros',
          explicacion: `Cada milímetro sobre cada metro cuadrado es un litro: ${m2} m² × ${mm} mm = ${(m2 * mm).toLocaleString('es-AR')} litros. En la práctica se junta algo menos por salpicaduras y pérdidas.`,
        };
      }, { d: 3 }),
      clas('¿Qué prácticas de riego ahorran agua y cuáles la desperdician?', {
        'Ahorran': ['Regar con goteo al atardecer', 'Cubrir el suelo con hojas secas', 'Regar las macetas con regadera'],
        'Desperdician': ['Manguera al mediodía de verano', 'Aspersor que moja la vereda', 'Riego superficial todos los días'],
      }, 'Las que desperdician tienen algo en común: el agua se evapora o cae donde no hay raíces.', { d: 2 }),
      det('Leé la rutina de riego de un vecino y marcá los errores.', [
        ['Riego el pasto todos los días al mediodía, un ratito.', true, 'Mediodía y riego superficial diario: la peor combinación de evaporación y raíces cortas.'],
        ['En los canteros puse hojas secas del otoño.', false],
        ['El aspersor tira la mitad del agua a la vereda, pero así queda limpia.', true, 'El agua en la vereda no riega nada y arrastra suciedad a la rejilla.'],
        ['Junto el agua de lluvia en un barril para las macetas.', false],
      ], 'Horario, profundidad y puntería: los tres errores clásicos del riego.', { d: 3 }),
      cad('Armá la cadena de por qué el mulch hace que haga falta regar menos.', [
        'Se cubre el suelo con hojas secas',
        'El sol no pega directo sobre la tierra',
        'Se evapora menos agua del suelo',
        'La humedad dura más días',
        'Hacen falta menos riegos',
      ], ['Las hojas secas producen agua al descomponerse'], 'La cobertura no fabrica agua: la protege del sol y del viento. Además, al descomponerse alimenta la vida del suelo.', { d: 3 }),
      op('Tenés un balcón con macetas. ¿Cuál es la forma de riego que menos agua desperdicia?', [
        'Regadera o botella, al pie de cada maceta, al atardecer',
        'Manguera abierta sobre todas las macetas juntas al mediodía',
        ['Un aspersor chico que moje todo el balcón', 'El aspersor tira agua al piso y a las paredes, donde no hay raíces.'],
        'Dejar que el agua desborde de los platos para asegurarse',
      ], 'Poca agua, justo en la raíz y sin sol fuerte: en macetas es fácil hacerlo perfecto.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Medir y sostener', 'Leer la factura, comparar meses y convertir los cambios en costumbre de toda la casa.', [
      teoria('Leer la factura del agua', [
        'Si tu casa tiene medidor, la factura muestra cuántos metros cúbicos se consumieron en el período (la diferencia entre dos lecturas del medidor). Dividiendo por la cantidad de días y de personas, obtenés litros por persona por día, que se pueden comparar con cualquier otra casa.',
        'Muchas facturas muestran también el consumo de los meses anteriores. Comparar el mismo mes de dos años es mejor que comparar meses seguidos, porque el verano y el invierno cambian mucho el uso.',
      ]),
      ejemplo('De la factura a litros por persona', 'Una factura bimestral marca 24 m³ en 60 días, para una casa de 4 personas.', [
        '24 m³ son 24.000 litros.',
        'Por día: 24.000 ÷ 60 = 400 litros.',
        'Por persona: 400 ÷ 4 = 100 litros por persona por día.',
      ], 'Esa casa usa unos 100 litros por persona por día: en el límite superior de lo que Naciones Unidas considera suficiente para necesidades básicas.'),
      numv(4, (i) => {
        const m3 = [30, 18, 45, 24][i];
        const dias = [60, 30, 60, 30][i];
        const pers = [3, 2, 5, 4][i];
        const v = Math.round(((m3 * 1000) / dias / pers) * 10) / 10;
        return {
          enunciado: `La factura marca ${m3} m³ en ${dias} días para ${pers} personas. ¿Cuántos litros por persona por día usan? Redondeá a un decimal.`,
          valor: v,
          unidad: 'litros por persona por día',
          dec: 1,
          tol: 1,
          explicacion: `${m3} m³ = ${(m3 * 1000).toLocaleString('es-AR')} litros. ÷ ${dias} días = ${((m3 * 1000) / dias).toLocaleString('es-AR')} litros por día. ÷ ${pers} personas ≈ ${v.toLocaleString('es-AR')} litros por persona por día.`,
        };
      }, { d: 2 }),
      op('¿Qué comparación dice más sobre si una familia está ahorrando agua?', [
        'Enero de este año contra enero del año pasado',
        'Enero contra julio del mismo año',
        ['Este mes contra el mes pasado, siempre', 'Entre meses seguidos puede cambiar la estación, y el uso cambia mucho entre verano e invierno.'],
        'La factura propia contra la de una empresa del barrio',
      ], 'Comparar el mismo mes elimina el efecto de la estación. Así, si el consumo bajó, es por los cambios y no por el clima.', { d: 2 }),
      teoria('Que sea de todos', [
        'Los cambios que hace una sola persona de la casa ayudan, pero los que se vuelven reglas de la casa duran más. Algunas ideas: un reloj o una canción en la ducha, un cartel en el lavadero, anotar la lectura del medidor cada domingo, o un "desafío del mes" con una meta de litros.',
        'Ver el número bajar es la recompensa que sostiene el hábito, como viste en el tronco. Sin medir, el esfuerzo es invisible y se abandona.',
      ]),
      mult('¿Qué ideas ayudan a que el ahorro de agua sea un hábito de toda la casa? Marcá todas.', [
        '+Anotar la lectura del medidor cada semana en la heladera',
        '+Poner una meta del mes y festejar si se cumple',
        '+Acordar juntos qué cambios probar',
        '-Retar a quien se duche mucho delante de todos',
        '-Cambiar todo de golpe sin avisar a nadie',
      ], 'Medir, acordar y celebrar. Los retos públicos generan resistencia, y los cambios sin acuerdo no se sostienen.', { d: 2 }),
      numv(3, (i) => {
        const antes = [28, 36, 20][i];
        const despues = [22, 27, 17][i];
        return {
          enunciado: `El año pasado, en el mismo bimestre, la casa consumió ${antes} m³. Este año, ${despues} m³. ¿En qué porcentaje bajó el consumo? Redondeá a entero.`,
          valor: Math.round(((antes - despues) / antes) * 100),
          unidad: '%',
          tol: 1,
          explicacion: `Bajó ${antes - despues} m³ sobre ${antes}: ${antes - despues} ÷ ${antes} × 100 ≈ ${Math.round(((antes - despues) / antes) * 100)} %. Siempre se divide por el valor de partida.`,
        };
      }, { d: 3 }),
      rank('Una familia puede hacer un solo cambio este mes. Ordená por litros que ahorra por mes, de más a menos (casa de 4 personas).', [
        ['Cerrar la canilla al cepillarse (2 min, 8 L/min, dos veces por día)', '≈ 3.840 litros'],
        ['Acortar cada ducha 3 minutos (10 L/min)', '≈ 3.600 litros'],
        ['Arreglar el inodoro que pierde en silencio 100 litros por día', '≈ 3.000 litros'],
        ['Arreglar una canilla que gotea 1 gota por segundo', '≈ 130 litros'],
      ], 'Ojo: acá el orden no es el intuitivo. Cepillarse con la canilla abierta, multiplicado por 4 personas, dos veces por día, 30 días, suma 3.840 litros. Hacer la cuenta evita adivinar.', { d: 4, extremos: ['Más', 'Menos'] }),
      vf('Si la factura de agua es fija y no depende del consumo, ahorrar agua no tiene sentido.', false, 'Aunque la factura no cambie, el agua que no se usa no hay que potabilizarla, bombearla ni tratarla después, y queda disponible para otros. El ahorro es real aunque no se vea en la factura.', {
        razones: ['+Porque el agua ahorrada no se potabiliza, bombea ni trata, y queda para otros', '-Porque el agua solo importa si se paga por litro', '-Porque las facturas fijas incluyen agua ilimitada sin costo para nadie'],
        d: 3,
      }),
      comp('Completá la receta para sostener el ahorro.', 'Primero [medir], después [acordar] en casa qué cambiar, y cada tanto [comparar] con el mismo mes del año anterior.', ['adivinar', 'imponer', 'olvidar'], 'Medir, acordar, comparar: es el ciclo de hábito del tronco aplicado al agua.', { d: 2 }),
      det('Una familia escribe su balance del mes. Marcá los errores.', [
        ['Bajamos de 30 m³ a 24 m³ en el mismo bimestre que el año pasado.', false],
        ['O sea que ahorramos 6 litros en dos meses.', true, 'Son 6 m³: 6.000 litros.'],
        ['El cambio que más rindió fue arreglar el inodoro que perdía.', false],
        ['Como bajamos un 50 %, ya no hace falta seguir midiendo.', true, 'De 30 a 24 es un 20 %, no un 50 %. Y medir es lo que sostiene el hábito.'],
      ], 'Unidades y porcentajes bien hechos, y la medición como costumbre: las dos lecciones del tronco aplicadas a la casa.', { d: 4 }),
      est('Estimá: una casa de 4 personas que usa 150 litros por persona por día, ¿cuántos metros cúbicos consume en un bimestre de 60 días?', 36, { min: 5, max: 100, paso: 1, unidad: 'm³' }, '150 × 4 = 600 litros por día; × 60 días = 36.000 litros, que son 36 m³. Es la cuenta inversa a la de la factura.', { d: 3 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: cuidar el agua en casa', 'Pérdidas, baño, cocina, riego y medición, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: la casa de los Pereyra', 'Una casa real, su medidor y sus hábitos. Encontrá dónde se va el agua y armá el plan.', [
      teoria('El caso', [
        'Los Pereyra son 4 y la factura de agua se les duplicó en el último bimestre. Viven en una casa con jardín. Juntaron datos: ducha de 12 litros por minuto y duchas de unos 12 minutos; inodoro viejo de 12 litros por descarga; riegan el pasto con manguera todos los días al mediodía; lavan la vereda con manguera los sábados.',
        'Una noche hicieron la prueba del medidor: a las 23 marcaba 520,300 m³ y a las 7, sin usar agua, 520,580 m³.',
      ]),
      num('Según la prueba nocturna, ¿cuántos litros por hora pierde la instalación de los Pereyra? (De 23 a 7 hay 8 horas.)', 35, 'litros por hora', 'La diferencia es 520,580 − 520,300 = 0,280 m³ = 280 litros en 8 horas. 280 ÷ 8 = 35 litros por hora, unos 840 litros por día: explica buena parte de la factura duplicada.', { ctx: 'Los Pereyra, 4 personas: ducha de 12 L/min y duchas de 12 minutos; inodoro de 12 L por descarga; riego con manguera al mediodía; vereda con manguera los sábados. Medidor: 520,300 m³ a las 23 y 520,580 m³ a las 7, sin uso.', d: 4 }),
      op('¿Qué deberían hacer primero los Pereyra?', [
        'Buscar y arreglar la pérdida que muestra el medidor',
        'Cambiar las plantas del jardín por otras más lindas',
        ['Comprar un lavavajillas nuevo para la cocina', 'Puede ayudar a futuro, pero hoy la pérdida detectada es lo más urgente y lo más barato.'],
        'Dejar de lavar la vereda los sábados y nada más',
      ], 'Una pérdida de unos 840 litros por día es agua que se va sin ningún beneficio. Es lo más urgente y lo primero que hay que resolver.', { ctx: 'La prueba del medidor de los Pereyra muestra una pérdida de 280 litros en 8 horas sin uso.', d: 3 }),
      cad('Armá el orden más razonable para encontrar la pérdida.', [
        'Hacer la prueba del colorante en el inodoro',
        'Revisar canillas y la válvula del tanque',
        'Buscar manchas de humedad en paredes y pisos',
        'Si no aparece, llamar a un plomero para revisar caños',
      ], ['Cortar el agua de la casa para siempre'], 'De lo más probable y fácil a lo más difícil. El inodoro es el sospechoso número uno en pérdidas silenciosas.', { d: 3 }),
      num('Si acortan las duchas de 12 a 7 minutos (4 personas, una ducha por día, 12 L/min), ¿cuántos litros ahorran por día?', 240, 'litros por día', '5 minutos menos × 12 litros por minuto = 60 litros por persona. × 4 personas = 240 litros por día, más la energía de calentarlos.', { ctx: 'Los Pereyra, 4 personas: ducha de 12 L/min, duchas de 12 minutos.', d: 3 }),
      clas('Clasificá los cambios del plan de los Pereyra.', {
        'Cambio de hábito, gratis': ['Regar al atardecer y no al mediodía', 'Barrer la vereda en seco', 'Duchas de 7 minutos'],
        'Cambio de equipo, con algún costo': ['Flor de ducha de bajo caudal', 'Mochila de doble descarga', 'Riego por goteo en los canteros'],
      }, 'Conviene empezar por los gratis, que ahorran mucho enseguida, y sumar los de equipo, que ahorran para siempre sin depender de acordarse.', { d: 3 }),
      rank('Ordená las medidas del plan por litros ahorrados por día, de más a menos (sin contar la pérdida, que ya arreglaron).', [
        ['Dejar de regar el pasto al mediodía con manguera (30 min, 15 L/min) y regar dos veces por semana al atardecer', '≈ 300 litros por día en promedio'],
        ['Duchas de 12 a 7 minutos', '≈ 240 litros por día'],
        ['Inodoro de doble descarga', '≈ 170 litros por día'],
        ['Barrer la vereda en seco los sábados', '≈ 40 litros por día en promedio'],
      ], 'El riego diario al mediodía gana: son 450 litros cada día, y pasando a dos riegos semanales la baja es enorme. Por eso el jardín es el primer lugar para mirar en verano.', { d: 4 }),
      vf('Si arreglan la pérdida, ya no hace falta cambiar ningún hábito porque la factura va a volver a lo normal.', false, 'La factura "normal" ya incluía riego al mediodía, duchas largas e inodoro viejo. Arreglar la pérdida es lo primero, pero los hábitos y equipos pueden bajar el consumo mucho más allá de ese normal.', {
        razones: ['+Porque "normal" ya era un consumo alto que se puede bajar', '-Porque las pérdidas son la única forma de gastar agua', '-Porque los hábitos no afectan la factura'],
        d: 3,
      }),
      det('El hijo mayor escribe el plan en la heladera. Marcá los errores.', [
        ['1. Arreglar la pérdida del inodoro esta semana.', false],
        ['2. Regar el pasto todos los días al mediodía pero con la manguera más cerrada.', true, 'El problema principal es el horario y la frecuencia: al mediodía se evapora mucho.'],
        ['3. Duchas de 7 minutos con una canción.', false],
        ['4. Medir el agua una vez por año, en diciembre.', true, 'Para sostener el hábito conviene medir seguido: por ejemplo, cada semana.'],
      ], 'El plan bien armado ataca la causa (horario del riego) y se apoya en medir seguido.', { d: 4 }),
    ]),
  ],
});
