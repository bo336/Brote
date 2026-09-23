import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// AGUA 1 — El agua que usamos.
// Arranca del ciclo que ya se vio en el tronco y baja a lo cotidiano: cuánta
// agua dulce hay de verdad, cómo llega a la canilla, cuánta usa una casa, a
// dónde va la que se va, y por qué el agua segura es salud y es un derecho.

export default unidad({
  slug: 'agua-1',
  rama: 'agua',
  orden: 1,
  nivel: 1,
  requiereTronco: 1,
  titulo: 'El agua que usamos',
  bajada: 'Cuánta agua dulce hay de verdad, cómo llega hasta tu canilla, cuánta usa una casa y a dónde va la que se va.',
  objetivos: [
    'Explicar por qué el agua dulce disponible es una fracción muy chica del agua del planeta',
    'Describir el camino del agua desde el río o la napa hasta la canilla',
    'Estimar cuánta agua usa una casa y en qué se va la mayor parte',
    'Distinguir el desagüe cloacal del pluvial y saber qué no tirar por ninguno',
    'Explicar por qué el agua segura es un tema de salud y un derecho humano',
  ],
  repasa: ['tronco-1'],
  fuentes: ['usgs-ciclo-agua', 'unep', 'aysa', 'oms-agua-potable', 'un-water', 'acumar', 'acuifero-puelche'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Mucha agua, poca para usar', 'La Tierra está cubierta de agua, pero casi toda es salada o está congelada.', [
      teoria('El planeta azul, pero salado', [
        'Más de dos tercios de la superficie de la Tierra están cubiertos de agua, y sin embargo el agua que se puede tomar es escasa. Alrededor del 97 % de toda el agua del planeta está en los océanos y es salada.',
        'Del 3 % que es dulce, cerca de dos tercios está congelada en glaciares y casquetes polares, y casi todo el resto está bajo tierra, en acuíferos. Los ríos, lagos y humedales, que es donde la vemos, son menos del 1 % del agua dulce.',
      ], {
        destacado: { valor: '≈ 3 %', texto: 'del agua del planeta es dulce, y la mayor parte de ese 3 % está congelada o bajo tierra.' },
      }),
      op('Si toda el agua del planeta entrara en un bidón de 100 litros, ¿cuánta sería agua dulce?', [
        'Unos 3 litros',
        'Unos 50 litros',
        ['Unos 30 litros', 'Es un error común pensar que el agua dulce es mucha: es alrededor del 3 %, no del 30 %.'],
        'Unos 97 litros',
      ], 'Unos 97 litros serían salados y solo 3 dulces. Y de esos 3, unos 2 estarían congelados. Lo que corre por ríos y lagos cabría en un vaso chico.', { d: 1 }),
      teoria('Dónde está el agua dulce', [
        'Los glaciares y hielos guardan la mayor parte del agua dulce del planeta. En Argentina, los glaciares de la cordillera alimentan ríos de los que dependen ciudades y cultivos, y están protegidos por una ley nacional.',
        'Bajo nuestros pies hay acuíferos: capas de arena o roca porosa empapadas de agua, como una esponja. En gran parte de la provincia de Buenos Aires se usa el acuífero Puelche. Muchas ciudades y pueblos del país toman agua de napas subterráneas.',
      ], {
        datos: barras('Dónde está el agua dulce del planeta', '% del agua dulce', [
          ['Glaciares y hielos', 69],
          ['Agua subterránea', 30],
          ['Ríos, lagos y humedad', 1],
        ], 'Valores aproximados, redondeados.'),
      }),
      rank('Ordená dónde hay más agua dulce en el planeta, de más a menos.', [
        ['Glaciares y casquetes polares', '≈ 69 % del agua dulce'],
        ['Acuíferos subterráneos', '≈ 30 %'],
        ['Ríos, lagos y humedad del aire', '≈ 1 %'],
      ], 'Lo que más vemos es lo que menos hay. Por eso cuidar las napas y los glaciares es cuidar la mayor parte del agua dulce.', { d: 2 }),
      par('Uní cada lugar con el tipo de agua que guarda.', [
        ['Océano Atlántico', 'Agua salada'],
        ['Glaciar Perito Moreno', 'Agua dulce congelada'],
        ['Acuífero Puelche', 'Agua dulce subterránea'],
        ['Río Paraná', 'Agua dulce superficial'],
      ], 'Cuatro depósitos distintos. El ciclo del agua los conecta a todos, pero a ritmos muy diferentes.', { d: 2 }),
      vf('Como el ciclo del agua nunca se detiene, el agua dulce disponible es ilimitada.', false, 'El agua da vueltas, pero la cantidad disponible en un lugar y un momento es limitada. Si se saca de una napa más rápido de lo que la lluvia la repone, baja. Es la idea de ritmo de uso que viste en el tronco.', {
        razones: ['+Porque lo que importa es si se usa más rápido de lo que se repone', '-Porque el ciclo del agua se detiene en invierno', '-Porque el agua dulce se fabrica en las nubes cada día'],
        d: 2,
      }),
      teoria('No todo el mundo tiene la misma agua', [
        'El agua dulce no está repartida en forma pareja. Hay regiones con ríos enormes y otras áridas, donde cada litro cuenta. En Argentina conviven las dos cosas: el Litoral con algunos de los ríos más caudalosos del mundo y zonas de Cuyo o la Patagonia extraandina con muy poca lluvia.',
        'Cuando una región usa casi toda el agua que se renueva por año, se habla de estrés hídrico. Ahí cualquier sequía o contaminación se siente enseguida.',
      ]),
      clas('¿Estas zonas tienen mucha agua dulce disponible o poca?', {
        'Mucha agua disponible': ['Delta del Paraná', 'Esteros del Iberá', 'Selva misionera'],
        'Poca agua disponible': ['Llanos de La Rioja', 'Meseta patagónica', 'Monte de San Juan'],
      }, 'La misma acción de cuidado vale en todos lados, pero en las zonas secas la diferencia se nota mucho antes.', { d: 2 }),
      comp('Completá.', 'Casi toda el agua del planeta es [salada]. De la poca agua dulce, la mayor parte está [congelada] o bajo [tierra].', ['caliente', 'evaporada', 'contaminada'], 'Salada, congelada o subterránea: por eso el agua de ríos y lagos, la más fácil de usar, es una fracción mínima.', { d: 1 }),
      est('Estimá qué porcentaje del agua dulce del planeta está en ríos, lagos y humedad del aire.', 1, { min: 0.1, max: 100, unidad: '%', escala: 'log' }, 'Alrededor del 1 % o menos. El agua que vemos correr es una parte mínima del agua dulce total.', { d: 3 }),
      op('¿Por qué proteger los glaciares importa aunque estén lejos de las ciudades?', [
        'Porque guardan agua que alimenta ríos de ciudades y cultivos',
        'Porque el hielo se puede vender como agua embotellada',
        ['Porque son lindos y atraen turismo a la cordillera', 'Son hermosos, pero su valor principal es el agua que aportan a los ríos.'],
        'Porque en los glaciares viven la mayoría de los animales',
      ], 'En épocas secas, los ríos de cordillera dependen en buena parte del deshielo. Un glaciar es una reserva de agua que se libera de a poco.', { d: 3 }),
      det('Leé este texto de un folleto y marcá las afirmaciones falsas.', [
        ['La mayor parte del agua del planeta está en los océanos.', false],
        ['Como hay tanta agua, el agua dulce nunca va a faltar en ningún lugar.', true, 'Hay regiones con estrés hídrico: usan casi toda el agua que se renueva por año.'],
        ['Los acuíferos guardan agua dulce bajo tierra, como una esponja.', false],
        ['Los ríos y lagos tienen la mayor parte del agua dulce del mundo.', true, 'Tienen menos del 1 %: la mayoría está en hielos y bajo tierra.'],
      ], 'Lo que se ve (ríos, lagos) es la parte más chica. Lo que más hay está congelado o bajo tierra, y lo que se usa depende de cada región.', { d: 3 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Del río a tu canilla', 'Qué le pasa al agua antes de llegar a tu vaso: captación, potabilización y red.', [
      teoria('Primero hay que tomarla de algún lado', [
        'El agua de red se toma de dos tipos de fuente: superficial (un río, un lago, un embalse) o subterránea (una napa, con perforaciones). En el Área Metropolitana de Buenos Aires, la mayor parte sale del Río de la Plata; en muchas ciudades del interior, de napas o de ríos cercanos.',
        'Ese paso se llama captación. El agua cruda nunca es apta para tomar tal como viene: puede tener barro, restos vegetales, microorganismos o sustancias disueltas.',
      ]),
      clas('¿La fuente de agua es superficial o subterránea?', {
        'Superficial': ['El Río de la Plata', 'Un embalse de montaña', 'El río Paraná'],
        'Subterránea': ['El acuífero Puelche', 'Una perforación en un campo', 'Un pozo de agua de un pueblo'],
      }, 'Superficial es lo que corre o se junta a cielo abierto; subterránea, lo que está en los poros del suelo y se saca con bombas.', { d: 1 }),
      teoria('La potabilización, paso a paso', [
        'En una planta potabilizadora, primero se le agregan al agua sustancias que hacen que las partículas chiquitas se peguen entre sí (coagulación) y formen grumos más grandes (floculación). Esos grumos, más pesados, se van al fondo en grandes piletas (sedimentación o decantación).',
        'Después el agua pasa por filtros de arena y otros materiales que retienen lo que quedó. Al final se desinfecta, en general con cloro, para eliminar microorganismos y para que siga protegida mientras viaja por los caños hasta tu casa.',
      ], { lista: ['Captación: se toma del río o la napa', 'Coagulación y floculación: las partículas forman grumos', 'Sedimentación: los grumos se van al fondo', 'Filtración: filtros retienen lo que queda', 'Desinfección: el cloro elimina microorganismos'] }),
      ord('Ordená las etapas de la potabilización.', [
        'Captación del agua del río',
        'Coagulación y floculación',
        'Sedimentación',
        'Filtración',
        'Desinfección con cloro',
      ], 'Cada etapa saca algo distinto: primero lo grande, después lo fino y al final lo invisible. Saltearse una deja pasar lo que la siguiente no puede sacar.', { d: 2, extremos: ['Primero', 'Último'] }),
      par('Uní cada etapa con lo que logra.', [
        ['Floculación', 'Que las partículas chiquitas se junten en grumos'],
        ['Sedimentación', 'Que los grumos se vayan al fondo'],
        ['Filtración', 'Retener las partículas que quedaron flotando'],
        ['Desinfección', 'Eliminar microorganismos que causan enfermedades'],
      ], 'Es un sistema en serie: cada paso deja el agua lista para el siguiente.', { d: 2 }),
      vf('El cloro se agrega al agua solamente para que tenga buen gusto.', false, 'El cloro desinfecta: elimina bacterias y virus, y además deja un resto que protege el agua mientras recorre kilómetros de caños. El gusto a cloro es un efecto, no el objetivo.', {
        razones: ['+Porque desinfecta y protege el agua en la red', '-Porque el cloro le agrega minerales necesarios', '-Porque el cloro hace que el agua pese menos'],
        d: 2,
      }),
      teoria('Del caño a tu vaso', [
        'Una vez potabilizada, el agua se bombea por una red de caños que recorre la ciudad. En muchos edificios y casas sube a un tanque, y desde ahí baja a las canillas.',
        'El tanque también es parte del cuidado: si está sucio o destapado, el agua puede contaminarse después de haber salido perfecta de la planta. Por eso se recomienda limpiarlo con regularidad, en general cada seis meses.',
      ]),
      cad('Armá el recorrido del agua hasta tu vaso.', [
        'Se capta agua del río',
        'Se potabiliza en una planta',
        'Viaja por la red de caños',
        'Sube al tanque de la casa',
        'Sale por la canilla',
      ], ['Se evapora y vuelve como lluvia a la canilla'], 'La evaporación es parte del ciclo natural, pero no del camino por la red. En la red el agua viaja por caños, empujada por bombas.', { d: 3 }),
      mult('¿Qué puede contaminar el agua después de que sale limpia de la planta? Marcá todo lo que corresponde.', [
        '+Un tanque de la casa sucio o sin tapa',
        '+Una rotura en un caño por donde entra suciedad',
        '+Una conexión mal hecha entre la red y otra instalación',
        '-El cloro que le agregó la planta',
        '-Que el agua esté fría',
      ], 'La planta entrega agua segura, pero el último tramo —la red y la instalación de cada casa— también tiene que estar en condiciones.', { d: 3 }),
      op('En un pueblo que toma agua de una napa, el agua sale limpia y transparente del pozo. ¿Se puede tomar sin tratarla?', [
        'No siempre: puede tener microbios o sustancias que no se ven',
        'Sí, si sale transparente del pozo ya es segura para tomar',
        ['Sí, porque el agua subterránea nunca se contamina', 'Las napas se pueden contaminar, por ejemplo con nitratos de fertilizantes o con pozos ciegos cercanos.'],
        'No, porque el agua de las napas siempre es salada y dura',
      ], 'Transparente no es lo mismo que segura. Por eso el agua de red se analiza y se desinfecta aunque venga de una napa.', { d: 3 }),
      comp('Completá el proceso.', 'En la planta, las partículas se juntan en [grumos], que se van al [fondo], y al final el agua se [desinfecta].', ['congela', 'evapora', 'sala'], 'Juntar, dejar caer, filtrar y desinfectar: la receta de casi todas las plantas potabilizadoras del mundo.', { d: 2 }),
      op('¿Cada cuánto se recomienda limpiar el tanque de agua de una casa?', [
        'En general, cada seis meses',
        'Una vez cada diez años',
        ['Nunca, porque el cloro lo mantiene limpio solo', 'El cloro ayuda, pero no evita que se acumulen sedimentos y suciedad en el tanque.'],
        'Solamente cuando el agua sale de color',
      ], 'La recomendación habitual es cada seis meses. Esperar a que el agua salga turbia es esperar a que el problema ya sea visible.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Cuánta agua usa una casa', 'Ducha, inodoro, lavarropas: en qué se va el agua de todos los días, con números.', [
      teoria('Lo que cubre las necesidades básicas', [
        'Naciones Unidas considera que entre 50 y 100 litros por persona por día alcanzan para cubrir las necesidades básicas: tomar, cocinar, higienizarse y limpiar. Muchas casas usan bastante más que eso.',
        'Para saber cuánto usa tu casa, podés mirar la factura (si tiene medidor, marca metros cúbicos) o hacer la cuenta por usos: cuántos minutos de ducha, cuántas descargas del inodoro, cuántos lavados.',
      ], { destacado: { valor: '50–100 L', texto: 'por persona por día cubren las necesidades básicas, según Naciones Unidas.' } }),
      teoria('En qué se va el agua', [
        'En una casa típica, los usos que más pesan son la ducha y el inodoro. Una ducha común entrega unos 10 litros por minuto (varía entre 6 y 15 según la flor y la presión). Un inodoro viejo usa 10 a 15 litros por descarga; uno de doble descarga, 3 o 6.',
        'El lavarropas automático usa decenas de litros por lavado, y una canilla abierta entrega unos 6 a 10 litros por minuto. Lavar los platos con la canilla corriendo puede gastar más que un lavado con la pileta llena.',
      ], {
        datos: tabla('Consumos típicos de una casa (aproximados)', ['Uso', 'Cantidad'], [
          ['Ducha', '≈ 10 litros por minuto'],
          ['Inodoro común', '10 a 15 litros por descarga'],
          ['Inodoro de doble descarga', '3 o 6 litros'],
          ['Canilla abierta', '6 a 10 litros por minuto'],
          ['Lavarropas automático', 'decenas de litros por lavado'],
        ], 'Los valores cambian según el aparato y la presión del agua.'),
      }),
      ejemplo('La ducha de una familia', 'En una casa viven 4 personas y cada una se ducha 10 minutos por día. La ducha entrega 10 litros por minuto. ¿Cuánta agua usan en duchas por día?', [
        'Por persona: 10 minutos × 10 litros por minuto = 100 litros.',
        'Toda la familia: 100 litros × 4 personas = 400 litros por día.',
      ], 'Solo en duchas, 400 litros por día: 12.000 litros en un mes. Cada minuto que se acorta la ducha, por persona, ahorra 10 litros diarios.'),
      numv(4, (i) => {
        const min = [8, 12, 15, 6][i];
        const lpm = [10, 12, 10, 9][i];
        return {
          enunciado: `Una ducha entrega ${lpm} litros por minuto y dura ${min} minutos. ¿Cuántos litros usa?`,
          valor: min * lpm,
          unidad: 'litros',
          explicacion: `Litros por minuto por minutos de ducha: ${lpm} × ${min} = ${min * lpm} litros. Es la cuenta que conviene hacer con tu propia ducha.`,
        };
      }, { d: 1 }),
      numv(3, (i) => {
        const desc = [6, 5, 8][i];
        const lts = [12, 12, 10][i];
        const pers = [3, 4, 2][i];
        return {
          enunciado: `En una casa de ${pers} personas, cada una usa el inodoro ${desc} veces por día, y cada descarga gasta ${lts} litros. ¿Cuántos litros por día se van por el inodoro?`,
          valor: desc * lts * pers,
          unidad: 'litros',
          explicacion: `Descargas por día: ${desc} × ${pers} personas = ${desc * pers}. Por ${lts} litros cada una: ${desc * pers} × ${lts} = ${desc * lts * pers} litros por día.`,
        };
      }, { d: 2 }),
      rank('Ordená estos usos de un día por los litros que gastan, de más a menos.', [
        ['Una ducha de 15 minutos', '≈ 150 litros'],
        ['Seis descargas de un inodoro común', '≈ 70 litros'],
        ['Lavar los platos 10 minutos con la canilla abierta', '≈ 80 litros'],
        ['Cepillarse los dientes 2 minutos con la canilla abierta', '≈ 16 litros'],
      ], 'La ducha larga encabeza. Fijate que lavar platos con la canilla corriendo puede superar al inodoro: por eso "llenar la pileta" es un consejo que rinde.', { d: 3 }),
      vf('Cerrar la canilla mientras te cepillás los dientes no ahorra casi nada.', false, 'Con una canilla que entrega unos 8 litros por minuto, dos minutos abierta son 16 litros. Dos veces por día, en una casa de cuatro personas, son más de 100 litros diarios.', {
        razones: ['+Porque son varios litros por vez que se multiplican por personas y días', '-Porque la canilla no gasta agua mientras no se usa el vaso', '-Porque el agua de la canilla vuelve sola al tanque'],
        d: 2,
      }),
      numv(3, (i) => {
        const pers = [4, 3, 5][i];
        return {
          enunciado: `En una casa de ${pers} personas cada una deja la canilla abierta 2 minutos al cepillarse, dos veces por día. Si la canilla entrega 8 litros por minuto, ¿cuántos litros podrían ahorrar por día cerrándola?`,
          valor: 2 * 2 * 8 * pers,
          unidad: 'litros',
          explicacion: `Por persona: 2 minutos × 2 veces × 8 litros = 32 litros por día. Para ${pers} personas: 32 × ${pers} = ${32 * pers} litros por día.`,
        };
      }, { d: 3 }),
      mult('¿Cuáles de estos cambios bajan el consumo de agua de una casa sin perder comodidad? Marcá todos.', [
        '+Un aireador en la canilla, que mezcla aire con el agua',
        '+Una flor de ducha de bajo caudal',
        '+Usar la descarga corta del inodoro cuando alcanza',
        '+Poner el lavarropas solo con carga completa',
        '-Dejar la canilla abierta para que el agua "salga fresca"',
      ], 'Aireadores, flores eficientes, doble descarga y cargas completas ahorran mucho sin cambiar la rutina. Son los primeros pasos que verás en la próxima unidad.', { d: 2 }),
      teoria('Medir lo propio', [
        'La mejor forma de saber dónde conviene ahorrar es medir tu casa. Un truco simple: poné un balde debajo de la ducha y contá cuántos segundos tarda en llenar 10 litros. Si tarda 60 segundos, tu ducha entrega 10 litros por minuto; si tarda 40, entrega 15.',
        'Con ese número y los minutos de ducha, sabés cuánto usás. Es la misma idea de la unidad de medir: primero el dato propio, después la decisión.',
      ]),
      numv(3, (i) => {
        const seg = [40, 60, 75][i];
        return {
          enunciado: `Un balde de 10 litros se llena en ${seg} segundos debajo de tu ducha. ¿Cuántos litros por minuto entrega?`,
          valor: Math.round((10 * 60) / seg * 10) / 10,
          unidad: 'litros por minuto',
          dec: 1,
          explicacion: `En ${seg} segundos salen 10 litros. En 60 segundos salen 10 × 60 ÷ ${seg} = ${(Math.round((10 * 60) / seg * 10) / 10).toLocaleString('es-AR')} litros por minuto.`,
        };
      }, { d: 4 }),
      comp('Completá la regla para medir tu ducha.', 'Se cuenta cuántos [segundos] tarda en llenarse un balde de [10 litros], y con eso se calculan los litros por [minuto].', ['metros', 'kilos', 'días'], 'Un balde, un reloj y una división: con eso sabés cuánto entrega tu ducha, que es el primer dato para ahorrar.', { d: 2 }),
      op('Una familia de 4 usa 800 litros de agua por día. ¿Está dentro del rango que Naciones Unidas considera suficiente para necesidades básicas (50 a 100 litros por persona)?', [
        'No: son 200 litros por persona, el doble del máximo del rango',
        'Sí: 800 litros está dentro de 50 a 100',
        ['Sí: 200 por persona es poco para una casa', 'El rango de necesidades básicas es de 50 a 100 litros por persona: 200 lo supera.'],
        'No se puede saber sin conocer la marca de la ducha',
      ], '800 ÷ 4 = 200 litros por persona por día. Hay que comparar en la misma unidad: por persona y por día.', { d: 3 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('El agua que se va', 'Dos redes debajo de la calle: la cloaca y el pluvial. Qué va por cada una y qué no va por ninguna.', [
      teoria('Aguas grises y aguas negras', [
        'El agua que usamos no desaparece: se va por el desagüe. La de la ducha, las piletas y el lavarropas se llama agua gris: tiene jabón y restos, pero no desechos del inodoro. La del inodoro es agua negra.',
        'Las dos, en una ciudad con cloacas, viajan juntas por la red cloacal hasta una planta de tratamiento, que les saca buena parte de la contaminación antes de devolverlas a un río.',
      ]),
      clas('¿Es agua gris o agua negra?', {
        'Agua gris': ['El agua de la ducha', 'El agua del lavarropas', 'El agua de lavar los platos'],
        'Agua negra': ['El agua del inodoro', 'El agua de un pozo ciego'],
      }, 'La diferencia importa porque el agua gris, con cuidado, se puede reutilizar (por ejemplo, para el inodoro), y la negra no.', { d: 1 }),
      teoria('Dos redes distintas', [
        'Debajo de muchas calles hay dos sistemas separados. La red cloacal lleva lo que sale de las casas hacia una planta de tratamiento. La red pluvial junta el agua de lluvia de las calles, por las rejillas y los sumideros de las esquinas, y la lleva directo a un arroyo o al río, sin tratar.',
        'Por eso lo que tirás en la vereda o en la rejilla de la esquina termina en el río tal cual: una colilla, una bolsa o el aceite del auto.',
      ], { destacado: { valor: 'Rejilla = río', texto: 'lo que entra por la rejilla de la esquina llega al arroyo sin ningún tratamiento.' } }),
      cad('Armá el camino de una colilla tirada en la vereda.', [
        'Una colilla queda en la vereda',
        'La lluvia la arrastra hasta la rejilla de la esquina',
        'Viaja por la red pluvial',
        'Sale sin tratar a un arroyo',
        'El arroyo la lleva al río',
      ], ['Pasa por la planta de tratamiento de la cloaca'], 'La red pluvial no pasa por ninguna planta: por eso "tirar a la calle" es tirar al río.', { d: 2 }),
      vf('Todo lo que entra por las rejillas de la calle pasa por una planta de tratamiento antes de llegar al río.', false, 'Las rejillas son parte de la red pluvial, que en general desemboca directo en arroyos y ríos. Solo la red cloacal lleva el agua a plantas de tratamiento.', {
        razones: ['+Porque la red pluvial desemboca directo en arroyos y ríos', '-Porque la lluvia limpia todo lo que arrastra', '-Porque las rejillas están conectadas al tanque de agua potable'],
        d: 2,
      }),
      teoria('Lo que nunca va por el desagüe', [
        'Algunas cosas tapan caños o dañan las plantas de tratamiento: toallitas húmedas (aunque digan "biodegradables", no se deshacen a tiempo), pañales, hilo dental, algodones y restos de comida grandes. Otras contaminan el agua y son muy difíciles de sacar: el aceite de cocina, los medicamentos, las pinturas y los solventes.',
        'Un litro de aceite usado puede contaminar muchísima agua y forma tapones de grasa en los caños. Se junta en una botella y se lleva a un punto de recolección, donde se puede convertir en biodiésel.',
      ]),
      clas('¿Qué va por el inodoro y qué no?', {
        'Puede ir por el inodoro': ['Papel higiénico', 'Desechos del cuerpo'],
        'No va por el inodoro': ['Toallitas húmedas', 'Aceite de cocina usado', 'Medicamentos vencidos', 'Algodones y cotonetes'],
      }, 'El inodoro solo está pensado para dos cosas. Todo lo demás tapa caños, daña la planta o termina contaminando el río.', { d: 2 }),
      op('¿Qué conviene hacer con el aceite usado de freír?', [
        'Guardarlo frío en una botella y llevarlo a un punto limpio',
        'Tirarlo por la pileta con agua caliente para que no tape',
        ['Tirarlo por el inodoro, que tiene más caudal y no se tapa', 'El caudal no ayuda: la grasa se enfría en los caños, forma tapones y contamina el agua.'],
        'Tirarlo en la rejilla de la calle cuando llueve mucho',
      ], 'El aceite nunca va por ningún desagüe. Juntado en botellas, se recicla y puede convertirse en biodiésel.', { d: 2 }),
      teoria('Donde no hay cloacas', [
        'No todas las casas están conectadas a una red cloacal. En muchas zonas se usan pozos ciegos o cámaras sépticas: el agua negra se infiltra en el suelo. Si el pozo está cerca de una perforación de agua o de la napa, la puede contaminar.',
        'Por eso ampliar las redes de cloacas es una de las obras con más impacto en la salud y en el agua de un barrio, y por eso los pozos de agua y los pozos ciegos tienen que estar bien separados.',
      ]),
      cad('Armá la cadena de cómo un pozo ciego mal ubicado puede enfermar a una familia.', [
        'El pozo ciego está muy cerca del pozo de agua',
        'El agua negra se infiltra en el suelo',
        'Llega a la napa de donde se toma el agua',
        'La familia toma agua con microorganismos',
      ], ['El cloro de la red limpia el pozo ciego'], 'Cuando la casa toma agua de su propio pozo, no pasa por ninguna planta ni recibe cloro de la red. Por eso la distancia entre pozos es clave.', { d: 3 }),
      det('Leé estos consejos que circulan en un grupo del barrio y marcá los equivocados.', [
        ['Juntá el aceite usado en una botella y llevalo al punto limpio.', false],
        ['Las toallitas húmedas biodegradables se pueden tirar al inodoro sin problema.', true, 'Tardan mucho en deshacerse y tapan caños y bombas.'],
        ['No barras las hojas y la tierra a la rejilla de la esquina.', false],
        ['Los medicamentos vencidos se tiran por la pileta con mucha agua.', true, 'Contaminan el agua: se llevan a farmacias o puntos de recolección.'],
      ], 'La etiqueta "biodegradable" no significa que se deshaga en el tiempo que tarda en recorrer un caño. Y diluir no es eliminar.', { d: 3 }),
      par('Uní cada red o sistema con lo que transporta.', [
        ['Red cloacal', 'Aguas grises y negras de las casas'],
        ['Red pluvial', 'Agua de lluvia de calles y veredas'],
        ['Red de agua potable', 'Agua tratada para las canillas'],
        ['Pozo ciego', 'Aguas negras que se infiltran en el suelo'],
      ], 'Cuatro sistemas de agua conviven en un barrio. Confundirlos es la razón de muchas malas costumbres, como barrer basura a la rejilla.', { d: 2 }),
      mult('¿Qué hábitos cuidan el agua que se va de tu casa? Marcá todos.', [
        '+Tirar las toallitas y los algodones al tacho, no al inodoro',
        '+Juntar el aceite usado en una botella',
        '+Llevar los medicamentos vencidos a una farmacia que los reciba',
        '-Tirar la pintura sobrante por la pileta del patio',
        '-Barrer la basura de la vereda hacia la rejilla',
      ], 'Todo lo que no va por el desagüe tiene otro destino: tacho, botella de aceite o punto de recolección.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Agua segura: salud y derecho', 'Por qué el agua potable es una de las mayores conquistas de la salud pública, y un derecho de todos.', [
      teoria('El agua y las enfermedades', [
        'El agua contaminada con microorganismos puede transmitir enfermedades como diarreas, cólera o hepatitis A. Durante siglos fueron de las principales causas de muerte en las ciudades, sobre todo de niños.',
        'Las plantas potabilizadoras y las cloacas cambiaron eso. Junto con las vacunas, son de las mayores mejoras de salud de la historia. Por eso, cuando se habla de agua, se habla también de salud.',
      ]),
      op('¿Por qué las cloacas son tan importantes para la salud de un barrio?', [
        'Porque alejan las aguas negras de la gente y del agua potable',
        'Porque hacen que el agua de la canilla sea más fría',
        ['Porque evitan que se inunden las calles cuando llueve', 'Las cloacas no tienen relación con la lluvia; esa es la red pluvial.'],
        'Porque aumentan la presión del agua potable en las casas',
      ], 'Separar el agua usada del agua para tomar es la base de la salud urbana. Sin cloacas, esa separación depende de pozos que pueden filtrarse.', { d: 1 }),
      teoria('Quién tiene agua segura', [
        'Según la Organización Mundial de la Salud, en 2022 unas 2.200 millones de personas en el mundo todavía no tenían agua potable gestionada de forma segura: agua disponible en casa, cuando se necesita y libre de contaminación.',
        'En Argentina la gran mayoría de la población urbana tiene agua de red, pero todavía hay barrios, zonas rurales y comunidades que no. Y en algunas regiones las napas tienen naturalmente arsénico en niveles que requieren tratamiento.',
      ], { destacado: { valor: '2.200 millones', texto: 'de personas en el mundo no tenían agua segura en casa en 2022, según la OMS.' } }),
      mult('¿Qué hace falta para que el agua de una casa se considere segura? Marcá todas.', [
        '+Que esté disponible en la casa o muy cerca',
        '+Que esté disponible cuando se necesita',
        '+Que esté libre de contaminación',
        '-Que sea embotellada',
        '-Que tenga gusto a cloro',
      ], 'Disponible, cuando hace falta y sin contaminación: esas tres condiciones definen el agua gestionada de forma segura.', { d: 2 }),
      teoria('Un derecho humano', [
        'En 2010, la Asamblea General de Naciones Unidas reconoció el acceso al agua potable y al saneamiento como un derecho humano. Quiere decir que los Estados tienen la obligación de trabajar para que toda la población tenga agua suficiente, segura y a un precio accesible.',
        'Que sea un derecho no quiere decir que el agua sea infinita ni gratis de producir: quiere decir que nadie debería quedarse sin la cantidad básica para vivir con dignidad.',
      ]),
      vf('Que el agua sea un derecho humano quiere decir que se puede usar sin ningún límite.', false, 'El derecho garantiza el acceso a una cantidad suficiente y segura para vivir con dignidad. No elimina la necesidad de cuidarla: justamente porque es de todos, el uso de cada uno afecta a los demás.', {
        razones: ['+Porque el derecho es a lo suficiente y seguro, no a un uso sin límite', '-Porque los derechos humanos no incluyen al agua', '-Porque el agua potable no cuesta nada producirla'],
        d: 2,
      }),
      par('Uní cada problema con una respuesta posible.', [
        ['Un barrio sin red cloacal', 'Obras de conexión a la cloaca'],
        ['Una napa con arsénico', 'Plantas de tratamiento que lo remueven'],
        ['Un tanque domiciliario sucio', 'Limpieza periódica del tanque'],
        ['Un caño roto en la vereda', 'Reclamo a la empresa de agua'],
      ], 'Cada problema tiene responsables distintos: la persona, la familia, la empresa o el Estado. Saber quién puede resolverlo es la mitad de la solución.', { d: 2 }),
      teoria('El agua embotellada no es la solución', [
        'En lugares donde el agua de red es segura, el agua embotellada no es más sana, cuesta cientos de veces más por litro y genera toneladas de envases plásticos. Además necesita energía para envasarse y transportarse.',
        'Donde el agua de red no es segura, la solución de fondo es mejorar el servicio, no que cada familia compre bidones para siempre.',
      ]),
      op('En una ciudad donde el agua de red es segura, ¿qué opción es mejor para el ambiente y el bolsillo?', [
        'Tomar agua de la canilla, en jarra o con un filtro',
        'Comprar botellitas de agua mineral todos los días',
        ['Comprar bidones grandes aunque el agua de red sea segura', 'Los bidones retornables son mejores que las botellitas, pero si el agua de red es segura, la canilla sigue ganando.'],
        'Tomar solo gaseosas para no tomar agua de red',
      ], 'El agua de red segura es mucho más barata y no genera residuos plásticos. Un filtro o una jarra resuelven el gusto a cloro.', { d: 3 }),
      rank('Ordená estas opciones por cuántos residuos plásticos generan en un año, de más a menos.', [
        ['Una botellita descartable de agua por día', '365 botellas por año'],
        ['Un bidón descartable de 5 litros por semana', '52 bidones por año'],
        ['Un bidón retornable de 20 litros que se reutiliza', 'casi nada: vuelve a la planta'],
        ['Agua de la canilla en una botella reutilizable', 'ninguno'],
      ], 'Cuantos más envases de un solo uso, más plástico. El retornable y la canilla están al final porque no generan residuos cada vez.', { d: 3 }),
      det('Leé este mensaje y marcá las afirmaciones falsas.', [
        ['El agua potable redujo muchísimo las enfermedades en las ciudades.', false],
        ['El agua embotellada siempre es más sana que la de red.', true, 'Donde el agua de red es segura, no hay evidencia de que la embotellada sea más sana.'],
        ['El acceso al agua y al saneamiento es un derecho humano reconocido por la ONU.', false],
        ['Como es un derecho, cuidarla no hace falta.', true, 'Es un derecho de todos justamente porque es un recurso compartido que hay que cuidar.'],
      ], 'Salud, derecho y cuidado van juntos: el agua es de todos porque la necesitamos todos.', { d: 3 }),
      comp('Completá.', 'El agua gestionada de forma segura está [disponible] en casa, cuando se [necesita] y libre de [contaminación].', ['embotellada', 'caliente', 'gratis'], 'Las tres condiciones juntas. Si falta una, el agua no es segura aunque salga de una canilla.', { d: 2 }),
      vf('En un lugar donde el agua de red es segura, tomar agua de la canilla es más barato y genera menos residuos que comprar agua embotellada.', true, 'El agua de red cuesta una fracción mínima por litro y no genera envases. Donde es segura, es la opción más barata y con menos residuos.', {
        razones: ['+Porque cuesta mucho menos por litro y no deja envases', '-Porque el agua embotellada no tiene costo de transporte', '-Porque los envases plásticos desaparecen solos'],
        d: 2,
      }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: el agua que usamos', 'De dónde viene, cuánta usamos y a dónde va, mezclado.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el agua del club', 'Revisá el uso del agua de un club de barrio. Aprobalo para hacer crecer la rama.', [
      teoria('El caso', [
        'El club del barrio tiene un vestuario con 6 duchas, sanitarios, una cantina y una cancha de fútbol que se riega en verano. Toma agua de red y está conectado a la cloaca. La comisión directiva está preocupada porque la factura de agua subió mucho y porque en la última lluvia salió agua sucia por la rejilla del estacionamiento.',
        'Te piden ayuda para entender qué pasa y qué conviene hacer primero. Usá todo lo de la unidad.',
      ]),
      num('En un sábado, 60 jugadores se duchan 8 minutos cada uno, con duchas de 12 litros por minuto. ¿Cuántos litros se usan en duchas ese día?', 5760, 'litros', '8 minutos × 12 litros = 96 litros por persona. × 60 jugadores = 5.760 litros en un solo día de partidos.', { ctx: 'Club de barrio: 6 duchas de 12 litros por minuto, sanitarios, cantina y cancha regada en verano. Agua de red y cloaca.', d: 3 }),
      op('Si cambian las flores de ducha por unas de 8 litros por minuto, ¿cuántos litros ahorran ese sábado (60 duchas de 8 minutos)?', [
        '1.920 litros',
        '480 litros',
        ['5.760 litros', 'Ese es el total con las duchas viejas: el ahorro es la diferencia entre 12 y 8 litros por minuto.'],
        '3.840 litros',
      ], 'Ahorro por minuto: 12 − 8 = 4 litros. × 8 minutos × 60 personas = 1.920 litros. 3.840 sería el total con las duchas nuevas.', { ctx: 'Club de barrio: 60 duchas de 8 minutos en un sábado. Duchas actuales: 12 litros por minuto.', d: 4 }),
      cad('La rejilla del estacionamiento largó agua sucia en la lluvia. Armá la explicación más probable.', [
        'En el estacionamiento hay manchas de aceite y basura',
        'La lluvia las arrastra hasta la rejilla',
        'La rejilla es parte de la red pluvial',
        'El agua sucia sale sin tratar al arroyo',
      ], ['La planta potabilizadora devolvió el agua sucia', 'La cloaca del vestuario se vació en la cancha'], 'La rejilla es pluvial: lo que se junta en el piso termina en el arroyo. La solución es limpiar el piso en seco y no dejar aceite ni basura ahí.', { d: 3 }),
      clas('La comisión propone medidas. ¿Cuáles atacan el uso de agua y cuáles la contaminación de la rejilla?', {
        'Bajan el uso de agua': ['Duchas de bajo caudal', 'Regar la cancha de noche y no al mediodía', 'Arreglar la canilla del vestuario que gotea'],
        'Evitan contaminar la rejilla': ['Barrer el estacionamiento en seco', 'Poner cestos en el estacionamiento', 'Juntar el aceite de la cantina en bidones'],
      }, 'Son dos problemas distintos con soluciones distintas: uno es de cantidad, el otro de calidad del agua que llega al arroyo.', { d: 3 }),
      vf('Regar la cancha al mediodía de verano es igual de eficiente que regarla de noche.', false, 'Al mediodía, con sol y calor, una parte grande del agua se evapora antes de llegar a las raíces. De noche o temprano se pierde mucho menos.', {
        razones: ['+Porque con calor y sol se evapora más agua antes de infiltrarse', '-Porque de noche el pasto no absorbe agua', '-Porque el agua de riego es salada'],
        d: 3,
      }),
      numv(3, (i) => {
        const gotas = [2, 1, 3][i];
        // 1 gota ≈ 0,05 ml
        const litrosDia = Math.round((gotas * 0.05 * 60 * 60 * 24) / 1000 * 10) / 10;
        return {
          enunciado: `La canilla del vestuario gotea ${gotas} ${gotas === 1 ? 'gota' : 'gotas'} por segundo. Si una gota son unos 0,05 ml, ¿cuántos litros pierde por día? (Redondeá a un decimal.)`,
          valor: litrosDia,
          unidad: 'litros por día',
          dec: 1,
          tol: 0.3,
          explicacion: `${gotas} gota(s) × 0,05 ml = ${(gotas * 0.05).toLocaleString('es-AR')} ml por segundo. × 86.400 segundos en un día = ${(gotas * 0.05 * 86400).toLocaleString('es-AR')} ml, o sea unos ${litrosDia.toLocaleString('es-AR')} litros por día.`,
        };
      }, { d: 4 }),
      op('La cantina tira el aceite de las frituras por la pileta "con mucha agua caliente". ¿Qué le dirías?', [
        'Que lo junte en bidones cuando se enfría y lo lleve a un punto de recolección',
        'Que está bien si usa agua bien caliente',
        ['Que lo tire en la rejilla del estacionamiento, que es más ancha', 'Eso lo mandaría directo al arroyo sin tratar.'],
        'Que lo mezcle con detergente antes de tirarlo',
      ], 'El agua caliente solo lo lleva más lejos antes de que se enfríe y tape. El aceite se junta y se recicla.', { d: 3 }),
      rank('Ordená las medidas por cuánta agua ahorran en un año de uso típico del club, de más a menos.', [
        ['Duchas de bajo caudal en el vestuario', 'cientos de miles de litros'],
        ['Regar la cancha de noche en lugar del mediodía', 'decenas de miles de litros'],
        ['Arreglar la canilla que gotea', 'unos miles de litros'],
        ['Poner un cartel de "cerrá la canilla"', 'poco, y depende de que se lea'],
      ], 'Con cientos de duchas por semana, la ducha gana por orden de magnitud. La canilla que gotea igual conviene arreglarla: es barato y es agua perdida.', { d: 4 }),
      det('La comisión escribe un informe para los socios. Marcá los errores.', [
        ['El mayor uso de agua del club son las duchas del vestuario.', false],
        ['El agua sucia de la rejilla pasó por la planta de tratamiento, así que no hay problema.', true, 'La rejilla es pluvial: el agua sale sin tratar al arroyo.'],
        ['Vamos a cambiar las flores de ducha y barrer el estacionamiento en seco.', false],
        ['El aceite de la cantina lo seguiremos tirando por la pileta con agua caliente.', true, 'El aceite se junta y se recicla; por la pileta tapa caños y contamina.'],
      ], 'Un buen informe separa los dos problemas y propone soluciones que atacan la causa de cada uno.', { d: 4 }),
    ]),
  ],
});
