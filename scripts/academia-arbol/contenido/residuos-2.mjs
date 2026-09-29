import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// RESIDUOS 2 — Reducir, reutilizar, reciclar.
// La jerarquía de residuos: por qué el orden importa, qué significa reducir
// de verdad, cuándo reutilizar compensa, cómo funciona el reciclaje por
// dentro y por qué, solo, no alcanza. Retoma órdenes de magnitud (tronco-2)
// y elegir por impacto (tronco-3).

export default unidad({
  slug: 'residuos-2',
  rama: 'residuos',
  orden: 2,
  nivel: 1,
  requiereTronco: 1,
  titulo: 'Reducir, reutilizar, reciclar',
  bajada: 'No son tres opciones iguales: son una escalera. Por qué reducir le gana a reciclar, y cómo funciona el reciclaje por dentro.',
  objetivos: [
    'Ordenar las opciones de gestión según la jerarquía de residuos',
    'Identificar formas concretas de reducir residuos en la fuente',
    'Evaluar cuándo reutilizar un objeto compensa su fabricación',
    'Explicar las etapas del reciclaje y los límites de cada material',
    'Argumentar por qué el reciclaje solo no resuelve el problema',
  ],
  repasa: ['residuos-1', 'tronco-2', 'tronco-3'],
  fuentes: ['ellen-macarthur', 'yale-reciclaje', 'unep-plasticos', 'oecd-plasticos', 'mst-bolsas-2018', 'iai-reciclaje-aluminio', 'ley-25916-residuos', 'epa'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('La escalera de los residuos', 'Prevenir, reutilizar, reciclar, recuperar energía y enterrar: un orden con fundamento.', [
      teoria('No todas las opciones valen lo mismo', [
        'La jerarquía de residuos ordena las opciones de mejor a peor para el ambiente: primero prevenir (que el residuo no exista), después reutilizar, después reciclar, después recuperar energía y, como último recurso, disponer en un relleno.',
        'Cada escalón hacia arriba ahorra más materiales, energía y emisiones. Reciclar es bueno, pero es el tercer escalón, no el primero.',
      ], { lista: ['1. Prevenir y reducir', '2. Reutilizar', '3. Reciclar', '4. Recuperar energía', '5. Disponer en relleno'] }),
      ord('Ordená la jerarquía de residuos de la mejor a la peor opción.', [ // e1
        'Prevenir que el residuo exista',
        'Reutilizar el objeto',
        'Reciclar el material',
        'Recuperar energía',
        'Enterrar en un relleno sanitario',
      ], 'Una escalera: cuanto más arriba se resuelve, menos se pierde.', { d: 1, extremos: ['Mejor', 'Peor'] }),
      teoria('Por qué ese orden', [
        'Fabricar algo nuevo usa materias primas, agua y energía. Si un objeto no se fabrica, se ahorra todo eso. Si se reutiliza, se ahorra casi todo. Si se recicla, se recupera el material, pero hay que recolectarlo, transportarlo, limpiarlo, fundirlo o triturarlo y volver a fabricar: se ahorra una parte.',
        'Recuperar energía quemando residuos aprovecha algo, pero el material se pierde. Enterrar pierde todo.',
      ]),
      cad('Armá la cadena de por qué reutilizar un frasco ahorra más que reciclarlo.', [ // e2
        'El frasco reutilizado sigue siendo un frasco',
        'No hace falta fundirlo ni fabricar uno nuevo',
        'Se ahorra la energía de fundir el vidrio a más de 1.000 °C',
        'Se evitan las emisiones de esa energía',
      ], ['Reutilizar el frasco lo vuelve más pesado'], 'Reciclar vidrio es bueno, pero fundirlo pide mucha energía. Lavarlo y volver a llenarlo, muy poca.', { d: 2 }),
      clas('¿En qué escalón de la jerarquía está cada acción?', { // e3
        'Prevenir o reducir': ['No aceptar un folleto que no vas a leer', 'Comprar a granel con tu propio frasco'],
        'Reutilizar': ['Usar una botella retornable', 'Arreglar una silla rota'],
        'Reciclar': ['Separar latas para que se fundan', 'Llevar el cartón al punto verde'],
      }, 'Cada acción cuenta, pero no cuenta igual. Las de arriba evitan todo lo que viene después.', { d: 2 }),
      vf('Si todo lo que uso se recicla, no importa cuánto consumo.', false, 'Reciclar recupera una parte, pero cuesta energía, transporte y agua, y nunca recupera el 100 %. Reducir sigue siendo mejor.', { // e4
        razones: ['+Porque reciclar tiene costos y pérdidas en cada vuelta', '-Porque reciclar crea materiales nuevos de la nada', '-Porque el reciclaje no usa energía'],
        d: 2,
      }),
      teoria('Un ejemplo con números', [
        'Supongamos que fabricar una botella nueva de vidrio cuesta 100 unidades de energía. Reciclar una botella usada para hacer otra puede costar alrededor de 70 a 80, porque fundir vidrio reciclado pide algo menos de energía que partir de arena. Lavar y volver a llenar una botella retornable puede costar menos de 10.',
        'Los números exactos cambian mucho según el caso, pero el orden casi nunca cambia: reutilizar le gana a reciclar, y reciclar le gana a fabricar de cero.',
      ]),
      rank('Ordená estas opciones para tener una botella llena de nuevo, de más a menos energía (ejemplo aproximado).', [ // e5
        ['Fabricar una botella nueva desde arena', '≈ 100 unidades'],
        ['Fabricar una botella con vidrio reciclado', '≈ 70-80 unidades'],
        ['Lavar y rellenar una botella retornable', 'menos de 10 unidades'],
      ], 'El orden de la jerarquía se ve en la energía. La retornable no necesita volver a fundir nada.', { d: 2 }),
      op('Tenés un frasco de vidrio vacío en buen estado. ¿Cuál es la mejor opción según la jerarquía?', [ // e6
        'Usarlo de nuevo para guardar algo',
        'Llevarlo al punto verde para reciclarlo',
        ['Tirarlo con la basura común', 'Es la peor opción: se pierde todo el material y la energía de fabricarlo.'],
        'Romperlo para que ocupe menos lugar en el tacho',
      ], 'Si el frasco sirve, usarlo es el escalón más alto disponible. Cuando ya no sirva, el reciclaje.', { d: 1 }),
      mult('¿Cuáles de estas acciones están en el escalón más alto, prevenir? Marcá todas.', [ // e7
        '+Rechazar una bolsa cuando no la necesitás',
        '+Comprar productos con menos envoltorio',
        '+Planificar las compras para no tirar comida',
        '-Separar las botellas para el reciclaje',
        '-Llevar las pilas a un punto de recolección',
      ], 'Prevenir es actuar antes de que el residuo exista. Separar y llevar a un punto verde es bueno, pero ya hay residuo.', { d: 2 }),
      det('Leé este afiche escolar y marcá lo equivocado.', [ // e8
        ['Las tres R son reducir, reutilizar y reciclar.', false],
        ['Las tres valen lo mismo: da igual cuál hagas.', true, 'Son una jerarquía: reducir evita más impacto que reutilizar, y reutilizar más que reciclar.'],
        ['Enterrar es la última opción.', false],
        ['Reciclar es la mejor forma de cuidar el ambiente.', true, 'Es buena, pero está por debajo de reducir y reutilizar.'],
      ], 'El orden de las R es la parte más importante del mensaje, y la que más se olvida.', { d: 2 }),
      comp('Completá.', 'En la jerarquía de residuos, primero se busca [reducir], después [reutilizar] y recién después [reciclar].', ['enterrar', 'quemar', 'comprar'], 'Las tres R, en el orden que de verdad importa.', { d: 1 }),
      par('Uní cada escalón con su ejemplo.', [ // e10
        ['Prevenir', 'No imprimir un documento que se puede leer en pantalla'],
        ['Reutilizar', 'Usar la hoja impresa del otro lado'],
        ['Reciclar', 'Separar el papel para hacer papel nuevo'],
        ['Disponer', 'Tirar el papel con restos de comida'],
      ], 'El mismo material, cuatro destinos distintos. Cuanto más arriba, menos se pierde.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Reducir: el residuo que no existe', 'Envases, descartables, compras y comida: dónde nace la basura y cómo evitar que nazca.', [
      teoria('La basura se decide al comprar', [
        'Buena parte de lo que termina en la bolsa entró a la casa en el changuito: envases, bolsas, bandejas, envoltorios. Cada decisión de compra decide también qué residuos vamos a tener.',
        'Reducir no es privarse de todo: es elegir, cuando se puede, la opción que genera menos residuo para la misma necesidad.',
      ]),
      clas('¿Cuál de las dos opciones genera menos residuo?', { // e1
        'Menos residuo': ['Fruta suelta en tu propia bolsa', 'Detergente en envase grande o recarga', 'Agua de la canilla en botella reutilizable'],
        'Más residuo': ['Fruta en bandeja de telgopor con film', 'Detergente en muchos envases chicos', 'Agua en botellitas descartables'],
      }, 'La misma necesidad, distinta cantidad de envase. Muchas veces la opción con menos residuo también es más barata.', { d: 1 }),
      teoria('Los descartables', [
        'Los objetos de un solo uso —vasos, cubiertos, sorbetes, bolsas livianas, bandejas— se fabrican para usarse minutos y duran como residuo décadas o siglos. Son chicos uno por uno, pero se usan por miles de millones.',
        'Muchas ciudades del país y del mundo restringieron bolsas livianas y algunos descartables. El cambio más efectivo, igual, es el de hábito: llevar la bolsa, el vaso o la botella propios.',
      ]),
      numv(3, (i) => { // e2
        const por = [3, 2, 5][i];
        const pers = [4, 3, 2][i];
        return {
          enunciado: `En una casa de ${pers} personas cada una usa ${por} bolsas descartables por semana. ¿Cuántas bolsas usan en un año de 52 semanas?`,
          valor: por * pers * 52,
          unidad: 'bolsas',
          explicacion: `${por} × ${pers} × 52 = ${(por * pers * 52).toLocaleString('es-AR')} bolsas por año. Una bolsa reutilizable reemplaza cientos de ellas.`,
        };
      }, { d: 1 }),
      vf('Un vaso descartable se usa minutos, pero puede durar como residuo muchísimo más tiempo.', true, 'Es la paradoja del descartable: diseñado para durar como producto unos minutos y como residuo, décadas o siglos si es de plástico.', { // e3
        razones: ['+Porque el material dura mucho más que su uso', '-Porque el vaso se desintegra al terminar de usarse', '-Porque los descartables se reciclan siempre solos'],
        d: 1,
      }),
      teoria('Comprar a granel y recargar', [
        'Comprar a granel —legumbres, cereales, especias, productos de limpieza— con frascos o bolsas propias evita muchos envases. Los sistemas de recarga (de detergente, de agua en bidones, de gas en garrafas) hacen lo mismo: el envase vuelve y se llena otra vez.',
        'No siempre es posible, pero donde existe, reduce el residuo desde la raíz.',
      ]),
      mult('¿Cuáles de estas prácticas reducen residuos en la fuente? Marcá todas.', [ // e4
        '+Comprar legumbres a granel con frasco propio',
        '+Usar un sistema de recarga de detergente',
        '+Llevar un termo en lugar de comprar café en vaso descartable',
        '+Pedir la comida para llevar sin cubiertos descartables',
        '-Comprar agua en botellitas y separarlas para reciclar',
      ], 'Separar botellitas ayuda, pero el residuo ya existe. Las otras cuatro evitan que exista.', { d: 2 }),
      teoria('La comida: el residuo más pesado', [
        'Como viste en la unidad anterior, los restos orgánicos son casi la mitad de la basura. Una parte son cáscaras y restos inevitables, pero otra es comida que se compró y no se comió: se venció, se echó a perder o sobró.',
        'Planificar las compras, guardar bien los alimentos, usar primero lo que vence antes y aprovechar las sobras reduce la bolsa y, además, ahorra plata. El desperdicio de alimentos se ve en detalle en la rama de Alimentación.',
      ]),
      ord('Ordená los pasos para reducir la comida que se tira en una casa.', [ // e5
        'Revisar qué hay en la heladera y la alacena',
        'Planificar las comidas de la semana',
        'Hacer una lista y comprar solo lo necesario',
        'Guardar bien y poner adelante lo que vence antes',
        'Aprovechar las sobras en otra comida',
      ], 'Mirar, planificar, comprar justo, guardar bien y aprovechar: la comida que no se tira es residuo que nunca existió.', { d: 2, extremos: ['Primero', 'Último'] }),
      op('¿Qué reduce más la basura de una familia: separar los envases o dejar de tirar comida que se echa a perder?', [ // e6
        'Depende, pero la comida suele pesar mucho más',
        'Separar envases, porque los plásticos son lo peor',
        ['Son exactamente iguales siempre', 'Pesan y funcionan distinto: la comida es una parte muy grande del peso de la bolsa.'],
        'Ninguna de las dos cambia la cantidad de basura',
      ], 'Por peso, la comida desperdiciada suele ser mucho más que los envases. Las dos acciones suman, y conviene hacer ambas.', { d: 3 }),
      cad('Armá la cadena de cómo una lista de compras reduce la basura.', [ // e7
        'Se revisa qué hay antes de salir',
        'Se compra solo lo que se va a usar',
        'Se vence y se echa a perder menos comida',
        'Llegan menos orgánicos a la bolsa',
      ], ['La lista hace que la comida dure el doble'], 'Una decisión antes de comprar evita un residuo días después.', { d: 2 }),
      det('Leé estos consejos y marcá los que no reducen residuos.', [ // e8
        ['Llevá tu bolsa de tela al supermercado.', false],
        ['Comprá todo en porciones individuales para no desperdiciar.', true, 'Las porciones individuales multiplican los envases; conviene porcionar en casa.'],
        ['Pedí delivery sin cubiertos descartables.', false],
        ['Comprá más cantidad de lo que está en oferta, aunque no lo vayas a usar.', true, 'Si se vence sin usar, se convierte en residuo.'],
      ], 'Reducir es comprar lo que se usa, con el menor envase posible.', { d: 2 }),
      comp('Completá.', 'Buena parte de la basura se decide al [comprar]; los descartables se usan minutos y duran como residuo [décadas].', ['tirar', 'segundos', 'horas'], 'La idea central de reducir: actuar antes de que el residuo exista.', { d: 1 }),
      est('Estimá cuántas bolsas descartables usaría por año una persona que usa 1 por día.', 365, { min: 50, max: 1000, paso: 5, unidad: 'bolsas' }, 'Una por día son 365 por año. Multiplicado por millones de personas, miles de millones de bolsas.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Reutilizar y reparar', 'Retornables, bolsas reutilizables y reparación: cuándo reutilizar compensa y cuánto hay que usar algo para que valga.', [
      teoria('Reutilizar es alargar la vida', [
        'Reutilizar es volver a usar un objeto para lo mismo o para otra cosa, sin transformarlo industrialmente: una botella retornable que se lava y se vuelve a llenar, un frasco que guarda legumbres, una mochila que pasa de un hermano a otro.',
        'Reparar es una forma de reutilizar: una silla arreglada, un celular con batería nueva, una campera con cierre cambiado. Cada año de vida extra es un objeto nuevo que no se fabricó.',
      ]),
      clas('¿Es reutilizar/reparar o es reciclar?', { // e1
        'Reutilizar o reparar': ['Cambiarle la suela a unas zapatillas', 'Usar un frasco de mermelada como vaso', 'Devolver un envase retornable'],
        'Reciclar': ['Triturar botellas para hacer fibra', 'Fundir latas para hacer aluminio', 'Hacer pasta de papel con diarios viejos'],
      }, 'Reutilizar conserva el objeto; reciclar lo destruye para recuperar el material.', { d: 1 }),
      teoria('La huella de fabricar', [
        'Un objeto reutilizable suele necesitar más material y energía para fabricarse que uno descartable: una bolsa de tela o un vaso de acero tienen más huella de fabricación que una bolsa o un vaso descartables. Por eso reutilizar compensa solo si se usa muchas veces.',
        'Estudios de ciclo de vida muestran que una bolsa de algodón necesita decenas de usos solo para compensar su huella de carbono frente a una bolsa plástica liviana, y muchos más si se cuentan otros impactos como el agua. La mejor bolsa es la que ya tenés, usada muchas veces.',
      ]),
      ejemplo('El punto de equilibrio', 'Fabricar un vaso de acero reutilizable emite lo mismo que fabricar 50 vasos descartables. Lavarlo emite muy poco.', [
        'Si se usa 10 veces, reemplaza 10 descartables: todavía emite más que ellos.',
        'Si se usa 50 veces, empata.',
        'Si se usa 500 veces, emite alrededor de una décima parte de lo que emitirían 500 descartables.',
      ], 'El reutilizable gana solo si se usa más allá del punto de equilibrio. Comprarlo y olvidarlo en un cajón es peor que no comprarlo.'),
      numv(3, (i) => { // e2
        const eq = [50, 30, 100][i];
        const usos = [200, 150, 300][i];
        return {
          enunciado: `Un objeto reutilizable necesita ${eq} usos para compensar su fabricación. Si se usa ${usos} veces, ¿cuántas veces supera ese punto de equilibrio?`,
          valor: usos / eq,
          unidad: 'veces',
          dec: 1,
          explicacion: `${usos} ÷ ${eq} = ${(usos / eq).toLocaleString('es-AR')} veces el punto de equilibrio. A partir de ahí, cada uso es ganancia neta para el ambiente.`,
        };
      }, { d: 2 }),
      vf('Comprar una bolsa de tela nueva siempre es mejor para el ambiente que usar bolsas plásticas.', false, 'Solo si se usa muchas veces. Fabricar una bolsa de tela tiene más impacto que fabricar una plástica liviana; compensa con el uso repetido.', { // e3
        razones: ['+Porque su fabricación tiene más impacto y hay que compensarlo usándola', '-Porque las bolsas de tela no se pueden lavar', '-Porque las bolsas plásticas no tienen ningún impacto'],
        d: 3,
      }),
      teoria('Envases retornables', [
        'Un envase retornable de vidrio o de plástico grueso se lava y se vuelve a llenar muchas veces: decenas de ciclos en el caso de algunas botellas de vidrio. Los sistemas de retornables fueron comunes en Argentina con las gaseosas, la leche y la cerveza, y muchas marcas los siguen usando.',
        'Funcionan mejor cuando las distancias son cortas y hay un sistema organizado para devolverlos: si el envase viaja muy lejos, el transporte se come parte del ahorro.',
      ]),
      cad('Armá el ciclo de una botella retornable.', [ // e4
        'Se llena en la planta embotelladora',
        'Se vende con el producto',
        'Se devuelve vacía en el comercio',
        'Vuelve a la planta y se lava',
        'Se llena de nuevo',
      ], ['Se funde después de cada uso'], 'Un ciclo sin fundir ni fabricar. Cada vuelta evita una botella nueva.', { d: 2 }),
      mult('¿Qué hace que un sistema de retornables funcione bien? Marcá todo lo que ayuda.', [ // e5
        '+Distancias cortas entre la planta y los comercios',
        '+Un incentivo para devolver el envase, como un depósito',
        '+Envases resistentes que aguanten muchos lavados',
        '+Muchos comercios donde se puedan devolver',
        '-Envases muy livianos que se rompen con facilidad',
      ], 'Un retornable es un sistema, no solo un envase. Sin logística ni incentivos, los envases no vuelven.', { d: 2 }),
      teoria('Reparar', [
        'Reparar alarga la vida de los objetos y evita fabricar nuevos. Pero muchos aparatos están diseñados de forma que repararlos es difícil: piezas pegadas, repuestos que no se venden, tornillos especiales. En varios países se discute el "derecho a reparar": que los fabricantes vendan repuestos, publiquen manuales y no bloqueen reparaciones.',
        'En muchas ciudades hay talleres de reparación comunitarios donde voluntarios enseñan a arreglar objetos.',
      ]),
      op('¿Qué propone el "derecho a reparar"?', [ // e6
        'Que los fabricantes faciliten repuestos, manuales y reparaciones',
        'Que cada persona repare sola cualquier aparato sin ayuda',
        ['Que se prohíba vender aparatos nuevos', 'No prohíbe vender: pide que reparar sea posible y accesible.'],
        'Que los aparatos rotos se reciclen apenas fallan',
      ], 'Un aparato que se puede reparar puede durar años más. El diseño decide si eso es posible.', { d: 2 }),
      rank('Ordená estas opciones para un celular con la batería gastada, de mejor a peor para el ambiente.', [ // e7
        ['Cambiarle la batería y seguir usándolo', 'evita fabricar un celular nuevo'],
        ['Venderlo o regalarlo a alguien que lo repare', 'otra persona lo sigue usando'],
        ['Llevarlo a un punto de reciclaje de electrónicos', 'recupera parte de los materiales'],
        ['Tirarlo con la basura común', 'se pierde todo y puede contaminar'],
      ], 'Fabricar un celular es la parte más pesada de su huella. Alargar su vida es lo que más ahorra.', { d: 2, extremos: ['Mejor', 'Peor'] }),
      det('Leé esta publicidad y marcá lo engañoso.', [ // e8
        ['Nuestro vaso de acero dura años.', false],
        ['Comprá uno de cada color: cada vaso reutilizable ayuda al planeta.', true, 'Cada vaso nuevo tiene una huella de fabricación; solo compensa si se usa muchas veces.'],
        ['Reemplaza cientos de vasos descartables si lo usás todos los días.', false],
        ['Con solo comprarlo ya estás reduciendo residuos.', true, 'Reduce si se usa en lugar de descartables, no por comprarlo.'],
      ], 'Lo reutilizable ayuda cuando se usa, no cuando se acumula.', { d: 3 }),
      est('Estimá cuántas veces hay que usar una bolsa de algodón para compensar solo su huella de carbono frente a una bolsa plástica liviana.', 50, { min: 1, max: 1000, unidad: 'usos', escala: 'log' }, 'Del orden de 50 usos según un estudio de ciclo de vida de la agencia ambiental danesa, y muchos más si se suman otros impactos como el agua. La bolsa que ya tenés, usada mil veces, es la mejor.', { d: 3 }),
      vf('Reparar un aparato casi siempre tiene menos impacto que fabricar uno nuevo.', true, 'La mayor parte de la huella de muchos aparatos está en su fabricación. Cambiar una pieza evita fabricar el aparato entero.', {
        razones: ['+Porque la fabricación suele ser la parte más pesada de la huella', '-Porque los repuestos no tienen ninguna huella', '-Porque los aparatos nuevos no consumen energía'],
        d: 2,
      }),
      comp('Completá.', 'Un objeto reutilizable compensa su fabricación recién después de muchos [usos]; reparar [alarga] la vida del objeto y evita fabricar uno [nuevo].', ['lavados', 'acorta', 'reciclado'], 'La lógica del punto de equilibrio, en una línea.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Cómo funciona el reciclaje', 'Del punto verde a la fábrica: qué le pasa a cada material, qué dicen los números de los envases y qué se recicla mejor.', [
      teoria('Las etapas', [
        'Reciclar es transformar un residuo en materia prima para fabricar algo nuevo. Tiene varias etapas: separación en origen, recolección, clasificación por material (y por tipo, en los plásticos), limpieza, procesamiento (triturar, fundir, hacer pasta) y fabricación del producto nuevo.',
        'Si falla una etapa, el material se pierde. La más frágil suele ser la primera: si el residuo llega sucio o mezclado, muchas veces ya no se puede usar.',
      ]),
      ord('Ordená las etapas del reciclaje de una botella de plástico.', [ // e1
        'Se separa en casa, limpia y seca',
        'Se recolecta',
        'Se clasifica por tipo de plástico',
        'Se lava y se tritura en escamas',
        'Las escamas se usan para fabricar un producto nuevo',
      ], 'Cada eslabón depende del anterior. El de tu casa es el primero.', { d: 2, extremos: ['Primero', 'Último'] }),
      teoria('Cada material es distinto', [
        'El aluminio y el vidrio se pueden reciclar muchísimas veces sin perder calidad. Reciclar aluminio ahorra alrededor del 95 % de la energía que se necesita para producirlo desde el mineral.',
        'El papel se puede reciclar varias veces, pero sus fibras se acortan en cada vuelta, así que en algún momento hay que sumar fibra nueva. Muchos plásticos pierden calidad al reciclarse y suelen convertirse en productos de menor exigencia: una botella puede volverse fibra textil, y esa fibra, difícilmente una botella otra vez.',
      ], { destacado: { valor: '≈ 95 %', texto: 'de la energía se ahorra al fabricar aluminio reciclado en vez de producirlo desde el mineral.' } }),
      par('Uní cada material con su comportamiento al reciclarse.', [ // e2
        ['Aluminio', 'Se recicla sin perder calidad y ahorra mucha energía'],
        ['Vidrio', 'Se funde y se vuelve vidrio muchas veces'],
        ['Papel', 'Sus fibras se acortan en cada vuelta'],
        ['Plástico', 'Suele perder calidad y bajar de categoría'],
      ], 'No todo reciclaje es igual. Algunos materiales dan muchas vueltas; otros, pocas.', { d: 2 }),
      numv(3, (i) => { // e3
        const e = [100, 200, 150][i];
        return {
          enunciado: `Producir una cantidad de aluminio desde el mineral usa ${e} unidades de energía. Si reciclar ahorra el 95 %, ¿cuántas unidades usa hacerlo con aluminio reciclado?`,
          valor: (e * 5) / 100,
          unidad: 'unidades',
          explicacion: `Se ahorra el 95 %: se usa el 5 %. ${e} × 5 ÷ 100 = ${(e * 5) / 100} unidades. Por eso las latas son de los residuos más valiosos.`,
        };
      }, { d: 2 }),
      teoria('Los números de los plásticos', [
        'Muchos envases plásticos tienen un triángulo con un número del 1 al 7. No quiere decir que sea reciclable: indica de qué tipo de plástico está hecho. El 1 es PET (botellas de bebidas), el 2 es polietileno de alta densidad (envases de lavandina o shampoo), el 3 es PVC, el 4 polietileno de baja densidad (bolsas y films), el 5 polipropileno (tapas, potes), el 6 poliestireno (incluido el telgopor) y el 7, otros o mezclas.',
        'Los más reciclados en Argentina suelen ser el 1 (PET) y el 2 (PEAD). Otros tienen menos mercado y muchas veces no se recuperan.',
      ], {
        datos: tabla('Códigos de los plásticos', ['Número', 'Material', 'Ejemplo'], [
          ['1', 'PET', 'Botellas de bebidas'],
          ['2', 'PEAD', 'Envases de lavandina y shampoo'],
          ['3', 'PVC', 'Caños, algunos blísteres'],
          ['4', 'PEBD', 'Bolsas y films'],
          ['5', 'PP', 'Tapas, potes de yogur'],
          ['6', 'PS', 'Vasos descartables, telgopor'],
          ['7', 'Otros', 'Mezclas y otros plásticos'],
        ]),
      }),
      vf('Si un envase tiene el triángulo con un número, seguro se recicla.', false, 'El número indica el tipo de plástico, no que exista quien lo recicle. Algunos tipos casi no tienen mercado y terminan en el relleno.', { // e4
        razones: ['+Porque el número indica el material, no que haya mercado para reciclarlo', '-Porque el triángulo solo se pone en envases de vidrio', '-Porque todos los plásticos se reciclan igual'],
        d: 2,
      }),
      par('Uní cada envase con su número de plástico más probable.', [ // e5
        ['Botella de gaseosa', '1 (PET)'],
        ['Bidón de lavandina', '2 (PEAD)'],
        ['Tapa de una botella', '5 (PP)'],
        ['Bandeja de telgopor', '6 (PS)'],
      ], 'Conocer los códigos ayuda a separar según lo que acepta el punto verde de tu ciudad.', { d: 3 }),
      teoria('Reciclaje que baja de categoría', [
        'Cuando un material reciclado se usa para un producto de menor exigencia que el original, se habla de infrarreciclaje (downcycling en inglés). Una botella de PET puede convertirse en fibra para una remera o un relleno de almohadón, que después es muy difícil de reciclar otra vez.',
        'Es mejor que enterrar, pero no cierra el círculo: el material termina saliendo del sistema en pocas vueltas.',
      ]),
      cad('Armá el recorrido de una botella de PET que baja de categoría.', [ // e6
        'Botella de gaseosa',
        'Escamas de PET recicladas',
        'Fibra para una remera',
        'Remera usada que casi no se puede reciclar',
        'Termina como residuo',
      ], ['Vuelve a ser botella infinitas veces sin pérdida'], 'Reciclar alarga la vida del material, pero en muchos plásticos no la hace eterna.', { d: 3 }),
      clas('¿Qué material suele poder reciclarse muchas veces y cuál pocas?', { // e7
        'Muchas veces': ['Lata de aluminio', 'Frasco de vidrio', 'Olla de acero'],
        'Pocas veces': ['Bandeja de telgopor', 'Envase multicapa de papas fritas', 'Film de plástico con restos de comida'],
      }, 'Los metales y el vidrio son los campeones del reciclaje. Los plásticos mezclados y sucios, los que menos vuelven.', { d: 2 }),
      det('Leé esta explicación y marcá lo equivocado.', [ // e8
        ['El aluminio se puede reciclar muchas veces.', false],
        ['El número en el triángulo significa que el envase es reciclable en cualquier ciudad.', true, 'Indica el tipo de plástico; que se recicle depende del mercado y del sistema local.'],
        ['El papel pierde calidad en cada vuelta.', false],
        ['Una botella de PET siempre vuelve a ser botella.', true, 'Muchas veces se convierte en fibra u otros productos de menor exigencia.'],
      ], 'El reciclaje real depende del material, del estado en que llega y del mercado.', { d: 3 }),
      op('¿Por qué las latas de aluminio son de los residuos más buscados por los recicladores?', [
        'Porque reciclarlas ahorra mucha energía y no pierden calidad',
        'Porque son el residuo más pesado de toda la bolsa de basura',
        ['Porque el aluminio se descompone rápido en el relleno', 'El aluminio no se descompone rápido: su valor está en reciclarlo.'],
        'Porque las latas se pueden compostar junto con los restos de comida',
      ], 'Un material que ahorra el 95 % de la energía y se recicla sin perder calidad tiene buen precio en el mercado.', { d: 2 }),
      vf('Las fibras de papel se pueden reciclar infinitas veces sin perder calidad.', false, 'En cada vuelta las fibras se acortan y se debilitan. Después de varias vueltas ya no sirven y hay que sumar fibra nueva.', {
        razones: ['+Porque las fibras se acortan en cada reciclaje', '-Porque el papel reciclado se vuelve plástico', '-Porque el papel no se puede reciclar nunca'],
        d: 2,
      }),
      comp('Completá.', 'Reciclar [aluminio] ahorra cerca del 95 % de la energía; el número del triángulo indica el tipo de [plástico], no que sea [reciclable].', ['vidrio', 'papel', 'liviano'], 'Dos datos que desarman confusiones comunes.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Por qué reciclar no alcanza', 'Solo una fracción del plástico del mundo se recicla. Los límites del reciclaje y el error del "reciclaje por deseo".', [
      teoria('Los números globales', [
        'A nivel mundial, menos del 10 % de todo el plástico que se produjo se recicló. La mayor parte terminó en rellenos, basurales o el ambiente, o se quemó. En los materiales como el aluminio o el papel las tasas son mucho más altas, pero en los plásticos el reciclaje es la excepción, no la regla.',
        'La producción de plástico, además, sigue creciendo. Aunque se recicle más, si se produce mucho más, el total de residuos igual aumenta.',
      ], { destacado: { valor: '< 10 %', texto: 'de todo el plástico producido en el mundo se recicló.' } }),
      est('Estimá qué porcentaje de todo el plástico producido en el mundo se recicló.', 9, { min: 0, max: 100, paso: 1, unidad: '%' }, 'Menos del 10 %. El resto se enterró, se quemó o quedó en el ambiente. Por eso el foco está cada vez más en reducir la producción de plásticos innecesarios.', { d: 2 }),
      teoria('Reciclar también cuesta', [
        'El reciclaje necesita camiones, plantas, agua para lavar y energía para procesar. Para algunos materiales, el ahorro es enorme (aluminio); para otros, más chico. Y solo funciona si hay alguien que compre el material reciclado: si es más barato fabricar plástico nuevo, el reciclado no se vende y termina en el relleno.',
      ]),
      cad('Armá la cadena de por qué un material separado puede terminar en el relleno igual.', [ // e1
        'El plástico nuevo es muy barato',
        'Las fábricas prefieren comprar plástico nuevo',
        'Nadie compra el plástico reciclado de ese tipo',
        'El centro verde no puede venderlo',
        'Termina en el relleno aunque estaba separado',
      ], ['El plástico separado se destruye solo en el centro verde'], 'El reciclaje es un mercado. Sin compradores, la separación no alcanza.', { d: 3 }),
      teoria('El reciclaje por deseo', [
        'Cuando alguien pone en los reciclables algo que no se recicla "por las dudas" —un envase sucio, un vidrio de ventana, un papel plastificado—, cree que ayuda, pero puede contaminar un fardo entero y hacer que se pierda todo. Se lo llama reciclaje por deseo (wishcycling en inglés).',
        'Separar bien es separar lo que realmente se recupera en tu ciudad. Ante la duda, conviene informarse en el punto verde o en la página del municipio.',
      ]),
      op('¿Qué es el "reciclaje por deseo"?', [ // e2
        'Poner en los reciclables cosas que no se reciclan, por las dudas',
        'Separar solo los materiales que realmente se reciclan',
        ['Desear que haya más plantas de reciclaje', 'No es un deseo abstracto: es poner cosas equivocadas en los reciclables.'],
        'Reciclar solo los envases que más te gustan',
      ], 'Con buena intención se puede arruinar un lote entero. Separar bien es separar lo que se recupera.', { d: 2 }),
      mult('¿Cuáles de estos residuos suelen arruinar un lote de reciclables? Marcá todos.', [ // e3
        '+Una caja de pizza muy engrasada',
        '+Un envase de yogur con restos',
        '+Pañales usados',
        '+Vidrio de ventana mezclado con botellas',
        '-Una botella de PET enjuagada y aplastada',
      ], 'Grasa, restos de comida y materiales que no corresponden contaminan el lote. La botella limpia es exactamente lo que se busca.', { d: 2 }),
      vf('Si no sé si algo se recicla, conviene ponerlo en los reciclables por las dudas.', false, 'Puede contaminar el lote y hacer que se pierda material que sí se reciclaba. Mejor averiguar qué acepta el sistema de tu ciudad.', { // e4
        razones: ['+Porque un material equivocado puede contaminar todo el lote', '-Porque los centros verdes reciclan absolutamente todo', '-Porque separar de más nunca tiene consecuencias'],
        d: 2,
      }),
      teoria('Qué se necesita además', [
        'Para que el reciclaje funcione hacen falta varias cosas a la vez: separación correcta en las casas, recolección diferenciada, plantas y cooperativas con condiciones dignas, mercado para el material reciclado y, sobre todo, productos diseñados desde el principio para ser reciclados o reutilizados.',
        'Y, antes que todo eso, producir menos residuos. Reciclar es una herramienta dentro de la jerarquía, no un permiso para consumir sin límite.',
      ]),
      clas('¿Esto depende de cada persona o del sistema?', { // e5
        'Cada persona': ['Separar limpio y seco', 'Averiguar qué acepta el punto verde', 'Comprar menos descartables'],
        'El sistema': ['Recolección diferenciada', 'Mercado para el material reciclado', 'Diseño de envases reciclables'],
      }, 'Como viste en el tronco: lo tuyo y lo de todos. El reciclaje necesita las dos columnas.', { d: 2 }),
      numv(3, (i) => { // e6
        const prod = [100, 200, 150][i];
        const tasa = [9, 15, 20][i];
        const prod2 = [150, 300, 250][i];
        const tasa2 = [15, 20, 25][i];
        return {
          enunciado: `Un país producía ${prod} mil toneladas de plástico y reciclaba el ${tasa} %. Años después produce ${prod2} mil toneladas y recicla el ${tasa2} %. ¿Cuántas mil toneladas NO recicladas tiene ahora?`,
          valor: (prod2 * (100 - tasa2)) / 100,
          unidad: 'mil toneladas',
          dec: 1,
          explicacion: `Ahora: ${prod2} × ${100 - tasa2} ÷ 100 = ${((prod2 * (100 - tasa2)) / 100).toLocaleString('es-AR')} mil t sin reciclar. Antes eran ${((prod * (100 - tasa)) / 100).toLocaleString('es-AR')}. Más reciclaje no compensa si la producción crece más rápido.`,
        };
      }, { d: 3 }),
      rank('Ordená estas estrategias contra los residuos plásticos según el escalón de la jerarquía, de más alto a más bajo.', [ // e7
        ['Eliminar envases innecesarios', 'prevenir'],
        ['Sistemas de envases retornables', 'reutilizar'],
        ['Mejorar la separación y el reciclaje', 'reciclar'],
        ['Quemar plásticos para generar energía', 'recuperar energía'],
      ], 'Las estrategias más efectivas están arriba. El reciclaje es necesario, pero no es la primera línea.', { d: 3, extremos: ['Más alto', 'Más bajo'] }),
      det('Leé esta nota de opinión y marcá lo equivocado.', [ // e8
        ['Menos del 10 % del plástico del mundo se recicló.', false],
        ['Por eso separar no sirve para nada.', true, 'Separar bien es necesario; lo que no alcanza es solo reciclar sin reducir.'],
        ['El reciclaje necesita mercado para el material recuperado.', false],
        ['Si reciclamos más, podemos producir todo el plástico que queramos.', true, 'Si la producción crece más rápido que el reciclaje, los residuos igual aumentan.'],
      ], 'Reciclar sí, pero dentro de la escalera: reducir primero.', { d: 3 }),
      comp('Completá.', 'Menos del [10] % del plástico producido se recicló; poner en los reciclables algo que no se recicla es reciclaje por [deseo].', ['50', 'error', 'costumbre'], 'Dos ideas para entender los límites del reciclaje.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: reducir, reutilizar, reciclar', 'Jerarquía, reducción, reutilización, reciclaje y sus límites, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: la cantina del colegio', 'La cantina de un colegio genera muchísimos descartables. Con los números, aplicá la jerarquía y armá un plan.', [
      teoria('La cantina', [
        'En un colegio de 600 estudiantes, la cantina vende por día 300 bebidas en botellitas de PET de 500 ml, 200 alfajores envueltos y 150 cafés en vasos descartables con tapa. Hay un solo tacho para todo en el patio.',
        'La dirección quiere reducir los residuos a la mitad este año. Tiene poco presupuesto, pero puede cambiar reglas de la cantina y hacer campañas.',
      ]),
      num('¿Cuántos envases descartables en total genera la cantina por día (botellas, envoltorios y vasos, sin contar tapas)?', 650, 'envases', '300 + 200 + 150 = 650 envases por día. En un año escolar de 180 días, 117.000.', { ctx: '300 botellitas, 200 envoltorios y 150 vasos por día.', d: 1 }),
      num('Si el año escolar tiene 180 días, ¿cuántas botellitas de PET se venden por año?', 54000, 'botellitas', '300 × 180 = 54.000 botellitas por año solo en un colegio.', { ctx: '300 botellitas por día, 180 días de clase.', d: 2 }),
      rank('Ordená estas medidas según el escalón de la jerarquía en que están, del más alto al más bajo.', [ // e3
        ['Instalar un bebedero y pedir botellas propias', 'prevenir'],
        ['Vender café en tazas que se lavan', 'reutilizar'],
        ['Poner tachos separados para PET y cartón', 'reciclar'],
        ['Seguir con un solo tacho para todo', 'disponer'],
      ], 'Las medidas de arriba eliminan residuos; las de abajo los manejan. El plan tiene que empezar arriba.', { d: 3, extremos: ['Más alto', 'Más bajo'] }),
      numv(3, (i) => { // e4
        const pct = [60, 50, 70][i];
        return {
          enunciado: `Con el bebedero, el ${pct} % de los estudiantes deja de comprar botellitas. ¿Cuántas botellitas por día se siguen vendiendo? (antes: 300)`,
          valor: 300 * (1 - pct / 100),
          unidad: 'botellitas',
          explicacion: `300 × ${(1 - pct / 100).toLocaleString('es-AR')} = ${300 * (1 - pct / 100)} botellitas por día. ${300 - 300 * (1 - pct / 100)} envases menos cada día, sin reciclar nada.`,
        };
      }, { d: 2 }),
      op('La cantina propone vasos "compostables" en lugar de tazas lavables. ¿Qué tener en cuenta?', [ // e5
        'Solo se compostan si hay un sistema que los reciba',
        'Son siempre mejores que cualquier taza lavable',
        ['Desaparecen solos en el tacho del patio', 'Necesitan condiciones de compostaje; en un relleno se comportan casi como basura común.'],
        'Se pueden reciclar junto con las botellas de PET',
      ], 'Un descartable "compostable" sigue siendo descartable. Sin compostaje organizado, la taza lavable es mejor.', { d: 4 }),
      clas('Clasificá estas propuestas del centro de estudiantes.', { // e6
        'Reducen residuos de verdad': ['Descuento a quien trae su taza', 'Bebederos en cada piso', 'Alfajores caseros sin envoltorio individual'],
        'No reducen o empeoran': ['Regalar un vaso reutilizable nuevo cada mes', 'Cambiar las botellas por latitas del mismo tamaño', 'Poner más tachos únicos para que no se desborden'],
      }, 'Reducir es que haya menos envases, no cambiar un descartable por otro ni acumular reutilizables sin usar.', { d: 4 }),
      det('La dirección escribe el plan. Marcá lo que no conviene.', [ // e7
        ['Instalamos bebederos y pedimos que cada estudiante traiga su botella.', false],
        ['Como vamos a reciclar las botellitas, no hace falta vender menos.', true, 'Reciclar está por debajo de reducir; el objetivo es que haya menos envases.'],
        ['Ponemos tachos separados para lo que igual se genere.', false],
        ['Aceptamos en los reciclables los vasos con restos de café, por las dudas.', true, 'Los restos contaminan el lote: es reciclaje por deseo.'],
      ], 'Un buen plan escolar empieza por prevenir, reutiliza lo que puede y separa bien lo que queda.', { d: 3 }),
    ]),
  ],
});
