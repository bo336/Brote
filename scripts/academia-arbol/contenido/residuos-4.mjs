import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// RESIDUOS 4 — El problema del plástico.
// Por qué el plástico es tan útil y tan problemático: cuánto se produce,
// adónde va, qué son los microplásticos, qué le hace a ríos, mares y fauna, y
// qué soluciones funcionan. Retoma la jerarquía y los límites del reciclaje
// (residuos-2) y los números del tronco (tronco-2).

export default unidad({
  slug: 'residuos-4',
  rama: 'residuos',
  orden: 4,
  nivel: 2,
  requiereTronco: 2,
  titulo: 'El problema del plástico',
  bajada: 'Liviano, barato y casi eterno: por qué el plástico cambió el mundo, adónde va a parar, qué son los microplásticos y qué soluciones funcionan de verdad.',
  objetivos: [
    'Explicar las propiedades y los usos del plástico, y por qué duran tanto',
    'Describir los destinos del plástico descartado en el mundo',
    'Reconocer las fuentes y los riesgos de los microplásticos',
    'Relacionar el plástico con la contaminación de ríos, mares y fauna',
    'Comparar soluciones según la jerarquía de residuos',
  ],
  repasa: ['residuos-2', 'residuos-1', 'tronco-2'],
  fuentes: ['oecd-plasticos', 'unep-plasticos', 'ellen-macarthur', 'rep-envases', 'emf-textiles'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Un material que dura demasiado', 'De dónde sale el plástico, por qué es tan útil y por qué su gran virtud es también su gran problema.', [
      teoria('Qué es el plástico', [
        'Los plásticos son materiales hechos de moléculas muy largas, los polímeros, que en su gran mayoría se fabrican a partir de petróleo y gas. Se pueden moldear en casi cualquier forma, son livianos, baratos, resistentes al agua y duraderos. Por eso están en envases, ropa, autos, caños, juguetes, equipos médicos y casi todo lo que usamos.',
        'La producción mundial creció de unos 2 millones de toneladas en 1950 a más de 450 millones de toneladas por año en 2019, según la OCDE.',
      ], { destacado: { valor: '> 450 millones', texto: 'de toneladas de plástico por año se producían en el mundo en 2019, según la OCDE.' } }),
      est('Estimá cuántos millones de toneladas de plástico por año se producían en el mundo en 2019.', 460, { min: 1, max: 10000, unidad: 'millones de t', escala: 'log' }, 'Unos 460 millones de toneladas, según la OCDE. En 1950 eran unos 2 millones.', { d: 3 }),
      numv(3, (i) => { // e2
        const a = [2, 2, 2][i];
        const b = [460, 400, 450][i];
        return {
          enunciado: `Si la producción de plástico pasó de ${a} millones de toneladas por año en 1950 a ${b} millones, ¿cuántas veces se multiplicó?`,
          valor: b / a,
          unidad: 'veces',
          explicacion: `${b} ÷ ${a} = ${b / a} veces. Pocos materiales crecieron tanto en tan poco tiempo.`,
        };
      }, { d: 1 }),
      teoria('Su virtud, su problema', [
        'El plástico es útil porque es resistente y durable. Pero esa durabilidad es un problema cuando se descarta: la mayoría de los plásticos no se biodegradan en tiempos humanos; con el sol y el roce se rompen en pedazos cada vez más chicos, pero esos pedazos siguen siendo plástico durante décadas o siglos.',
        'Además, una gran parte se usa en productos de un solo uso, como envases, que se descartan a los pocos minutos o días.',
      ]),
      cad('Armá la cadena de por qué el plástico de un solo uso es un problema.', [ // e3
        'Se fabrica un envase muy durable',
        'Se usa unos minutos',
        'Se descarta',
        'Como no se biodegrada, persiste décadas o siglos',
        'Se acumula en rellenos, basurales o el ambiente',
      ], ['Al descartarlo, el plástico se transforma en agua'], 'Un material diseñado para durar, usado para algo que dura minutos.', { d: 1 }),
      clas('¿Este uso del plástico suele ser de un solo uso o de larga duración?', { // e4
        'Un solo uso': ['Bolsa de supermercado liviana', 'Vaso de café descartable', 'Film para envolver fruta'],
        'Larga duración': ['Caño de agua de una casa', 'Parte de una heladera', 'Tanque de agua'],
      }, 'El problema más grande está en lo que se usa minutos y dura siglos.', { d: 1 }),
      vf('Un envase plástico se biodegrada por completo en pocos meses en la naturaleza.', false, 'La mayoría de los plásticos no se biodegradan en tiempos humanos: se fragmentan en pedazos cada vez más chicos que persisten durante décadas o siglos.', { // e5
        razones: ['+Porque se fragmenta pero sigue siendo plástico durante mucho tiempo', '-Porque se convierte en arena en semanas', '-Porque los plásticos son de origen vegetal'],
        d: 1,
      }),
      par('Uní cada propiedad del plástico con por qué se usa tanto.', [ // e6
        ['Liviano', 'Abarata el transporte'],
        ['Resistente al agua', 'Sirve para envases de líquidos'],
        ['Moldeable', 'Se puede fabricar casi cualquier forma'],
        ['Barato', 'Reemplazó a muchos otros materiales'],
      ], 'Las mismas propiedades que lo hicieron exitoso explican por qué se acumula.', { d: 1 }),
      op('¿De qué se fabrica la gran mayoría de los plásticos?', [ // e7
        'De petróleo y gas',
        'De arena de playa',
        ['De maíz y caña de azúcar', 'Existen bioplásticos de origen vegetal, pero son una parte muy chica.'],
        'De madera de bosques nativos',
      ], 'Por eso el plástico también está conectado con la energía y el clima.', { d: 1 }),
      rank('Ordená estos objetos por cuánto tiempo suelen usarse, de más corto a más largo.', [ // e8
        ['Sorbete', 'minutos'],
        ['Botella de agua descartable', 'horas o días'],
        ['Mochila de nylon', 'años'],
        ['Caño de PVC en una pared', 'décadas'],
      ], 'Todos pueden durar como material décadas o siglos. Cuanto más corto su uso, más absurdo el descarte.', { d: 1, extremos: ['Más corto', 'Más largo'] }),
      det('Leé esta explicación y marcá lo equivocado.', [ // e9
        ['El plástico se fabrica sobre todo a partir de petróleo y gas.', false],
        ['El plástico desaparece por completo al romperse en pedazos chicos.', true, 'Los pedazos siguen siendo plástico: se vuelven microplásticos.'],
        ['La producción de plástico creció enormemente desde 1950.', false],
        ['Casi todos los plásticos se usan en objetos de larga duración.', true, 'Una gran parte se usa en envases y productos de un solo uso.'],
      ], 'Útil, barato y durable: tres virtudes que se vuelven problema al descartarlo.', { d: 2 }),
      comp('Completá.', 'Los plásticos son [polímeros] que se fabrican sobre todo con [petróleo] y gas; y en lugar de biodegradarse, se [fragmentan].', ['minerales', 'madera', 'evaporan'], 'Qué es el plástico y por qué dura tanto.', { d: 1 }),
      mult('¿En qué productos cotidianos hay plástico? Marcá todos.', [ // e11
        '+Una remera de poliéster',
        '+El envase de un yogur',
        '+Un cepillo de dientes',
        '+El chicle',
        '-Una cuchara de acero inoxidable',
      ], 'El plástico está hasta donde no se ve: en telas sintéticas y hasta en la goma de muchos chicles.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Adónde va el plástico', 'Reciclado, quemado, enterrado o perdido en el ambiente: el destino real del plástico descartado.', [
      teoria('Los números de la OCDE', [
        'Según la OCDE, en 2019 se generaron en el mundo unos 353 millones de toneladas de residuos plásticos. Solo alrededor del 9 % terminó reciclado; cerca del 19 % se incineró; alrededor de la mitad fue a rellenos sanitarios; y cerca del 22 % se gestionó mal: terminó en basurales a cielo abierto, se quemó sin control o se escapó al ambiente.',
      ], {
        datos: barras('Destino de los residuos plásticos del mundo (2019)', '% del total', [
          ['Relleno sanitario', 50],
          ['Mal gestionado', 22],
          ['Incinerado', 19],
          ['Reciclado', 9],
        ], 'OCDE, Global Plastics Outlook (2022). Valores redondeados.'),
      }),
      rank('Según la OCDE, ordená los destinos del plástico descartado de mayor a menor porcentaje.', [ // e1
        ['Relleno sanitario', '≈ 50 %'],
        ['Mal gestionado', '≈ 22 %'],
        ['Incinerado', '≈ 19 %'],
        ['Reciclado', '≈ 9 %'],
      ], 'El reciclaje es el destino menos frecuente. Más de uno de cada cinco kilos termina mal gestionado.', { d: 2 }),
      numv(3, (i) => { // e2
        const tot = [353, 353, 353][i];
        const pct = [9, 22, 19][i];
        const nom = ['se recicló', 'se gestionó mal', 'se incineró'][i];
        return {
          enunciado: `De ${tot} millones de toneladas de residuos plásticos, el ${pct} % ${nom}. ¿Cuántos millones de toneladas son? Redondeá al entero.`,
          valor: Math.round((tot * pct) / 100),
          unidad: 'millones de t',
          tol: 1,
          explicacion: `${tot} × ${pct} ÷ 100 ≈ ${Math.round((tot * pct) / 100)} millones de toneladas en un solo año.`,
        };
      }, { d: 2 }),
      teoria('Mal gestionado', [
        '"Mal gestionado" incluye el plástico que termina en basurales a cielo abierto, que se quema a cielo abierto liberando humos tóxicos, o que se escapa a arroyos, ríos y mares. Ocurre sobre todo donde no hay recolección suficiente, como en muchos barrios populares y zonas rurales del mundo, incluidos lugares de Argentina.',
      ]),
      cad('Armá la cadena de cómo una bolsa puede llegar al mar desde un barrio sin recolección.', [ // e3
        'No pasa el camión recolector por el barrio',
        'La basura se acumula en un zanjón',
        'Una lluvia fuerte la arrastra al arroyo',
        'El arroyo desemboca en un río',
        'El río lleva la bolsa hasta el mar',
      ], ['La bolsa vuela directo del barrio al mar en un día'], 'Buena parte del plástico del mar viene de tierra firme, arrastrado por los ríos.', { d: 2 }),
      vf('La mayor parte del plástico que se descarta en el mundo se recicla.', false, 'Solo alrededor del 9 % se recicla, según la OCDE. La mayor parte va a rellenos, se incinera o se gestiona mal.', { // e4
        razones: ['+Porque solo alrededor del 9 % se recicla', '-Porque el 90 % se recicla en el mundo', '-Porque el plástico no se puede reciclar nunca'],
        d: 1,
      }),
      teoria('Incinerar', [
        'Incinerar plástico en plantas con control de emisiones puede recuperar energía, pero emite CO₂ (el plástico es, en el fondo, petróleo) y deja cenizas que hay que gestionar. Quemarlo a cielo abierto, en cambio, libera humos muy tóxicos y es uno de los peores destinos.',
      ]),
      clas('¿Es un destino controlado o un destino mal gestionado?', { // e5
        'Controlado': ['Relleno sanitario con membranas', 'Planta de reciclaje', 'Incineradora con control de emisiones'],
        'Mal gestionado': ['Quema en un basural', 'Bolsa en un arroyo', 'Basural a cielo abierto'],
      }, 'Lo controlado no es perfecto, pero lo mal gestionado daña el aire, el agua y la salud.', { d: 1 }),
      op('¿Por qué quemar plástico a cielo abierto es uno de los peores destinos?', [ // e6
        'Porque libera humos tóxicos sin ningún control',
        'Porque el plástico no se puede quemar',
        ['Porque produce electricidad que se desperdicia', 'El problema principal son los humos tóxicos, no la energía.'],
        'Porque deja el plástico intacto',
      ], 'La quema abierta afecta a quienes viven cerca y contamina el aire.', { d: 1 }),
      mult('¿Qué hace falta para que menos plástico termine mal gestionado? Marcá todo.', [ // e7
        '+Recolección de residuos en todos los barrios',
        '+Cerrar basurales a cielo abierto',
        '+Reducir los plásticos de un solo uso',
        '+Sistemas de recuperación con cooperativas',
        '-Quemar más plástico en los patios',
      ], 'Recolección, disposición adecuada, reducción y recuperación.', { d: 1 }),
      par('Uní cada destino con su problema principal.', [ // e8
        ['Relleno sanitario', 'Ocupa espacio durante siglos'],
        ['Incineración controlada', 'Emite CO₂ y deja cenizas'],
        ['Quema abierta', 'Humos tóxicos'],
        ['Fuga al ambiente', 'Contamina ríos, mares y fauna'],
      ], 'Ningún destino del plástico descartado es neutro. Por eso reducir es la primera línea.', { d: 2 }),
      det('Leé este comentario y marcá lo equivocado.', [ // e9
        ['Solo una pequeña parte del plástico del mundo se recicla.', false],
        ['Quemar plástico en el patio es una buena forma de deshacerse de él.', true, 'Libera humos tóxicos que afectan la salud.'],
        ['Mucho plástico del mar llega desde los ríos.', false],
        ['Incinerar plástico no emite CO₂.', true, 'Sí emite: el plástico está hecho de carbono de origen fósil.'],
      ], 'Conocer los destinos reales cambia la mirada sobre el plástico.', { d: 2 }),
      comp('Completá.', 'Según la OCDE, solo alrededor del [9] % del plástico se recicla; cerca del [22] % se gestiona mal.', ['90', '2'], 'Dos números que resumen el problema global del plástico.', { d: 2 }),
      est('Estimá cuántos millones de toneladas de residuos plásticos se generaron en el mundo en 2019.', 353, { min: 1, max: 10000, unidad: 'millones de t', escala: 'log' }, 'Unos 353 millones de toneladas, según la OCDE: casi un camión de basura por segundo, durante todo el año, muchas veces multiplicado.', { d: 3 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Microplásticos', 'Pedacitos de menos de 5 milímetros que ya están en el agua, el suelo, el aire y la comida.', [
      teoria('Qué son', [
        'Los microplásticos son pedazos de plástico de menos de 5 milímetros. Algunos se fabrican así de chicos (microplásticos primarios), como las bolitas que usa la industria para fabricar objetos o las microesferas de algunos cosméticos. Otros se forman cuando objetos más grandes se rompen (secundarios): bolsas, botellas, redes de pesca.',
        'Hay además fuentes menos visibles: las fibras que sueltan las telas sintéticas al lavarse y el polvo que desprenden los neumáticos al rodar.',
      ]),
      clas('¿Es un microplástico primario o secundario?', { // e1
        'Primario (fabricado chico)': ['Bolitas de plástico para la industria', 'Microesferas de un exfoliante'],
        'Secundario (de la rotura)': ['Fragmentos de una botella rota por el sol', 'Pedazos de una bolsa desgastada', 'Trozos de una red de pesca vieja'],
      }, 'Unos se fabrican chicos; otros se achican con el tiempo. Los dos terminan en el ambiente.', { d: 2 }),
      teoria('Dónde están', [
        'Se encontraron microplásticos en el agua de ríos y mares, en la arena de las playas, en el suelo agrícola, en el aire de las ciudades, en la nieve de las montañas, en el agua embotellada y de red, en alimentos como mariscos y sal, y en el cuerpo humano.',
        'Los científicos todavía estudian cuánto afectan la salud. Lo que se sabe es que están en todas partes y que su cantidad sigue creciendo.',
      ]),
      mult('¿Dónde se encontraron microplásticos? Marcá todo lo correcto.', [ // e2
        '+En el mar y los ríos',
        '+En el suelo agrícola',
        '+En el aire de las ciudades',
        '+En alimentos como mariscos y sal',
        '-Solo en los rellenos sanitarios',
      ], 'Están en todas partes: por eso se habla de una contaminación global.', { d: 1 }),
      vf('Ya está demostrado con certeza cuánto daño hacen los microplásticos a la salud humana.', false, 'Se sabe que están en el cuerpo, pero la ciencia todavía estudia sus efectos. Es un caso donde el principio precautorio tiene mucho sentido.', { // e3
        razones: ['+Porque sus efectos todavía se están investigando', '-Porque está demostrado que no hacen nada', '-Porque los microplásticos no llegan al cuerpo'],
        d: 3,
      }),
      teoria('Fibras y neumáticos', [
        'Cada vez que se lava ropa de poliéster, nailon o acrílico, se sueltan miles de microfibras que van por el desagüe; muchas plantas de tratamiento no logran retenerlas todas. Y los neumáticos, al rozar el asfalto, desprenden partículas que la lluvia lleva a arroyos y ríos: en muchos estudios aparecen entre las mayores fuentes de microplásticos.',
      ]),
      cad('Armá el recorrido de una microfibra de una campera polar.', [ // e4
        'Se lava la campera en el lavarropas',
        'Se sueltan miles de microfibras',
        'Van por el desagüe',
        'Parte atraviesa la planta de tratamiento',
        'Llegan al río y al mar',
      ], ['Las microfibras se disuelven en el jabón'], 'Un camino invisible que empieza en el lavarropas.', { d: 2 }),
      op('¿Qué práctica reduce las microfibras que suelta la ropa sintética?', [ // e5
        'Lavar menos, con carga completa y agua fría',
        'Lavar todo con agua muy caliente',
        ['Lavar cada prenda sola, en ciclos cortos', 'Cargas chicas suelen aumentar el roce y la liberación de fibras.'],
        'Usar más suavizante en cada lavado',
      ], 'Menos lavados, carga completa y agua fría reducen la liberación. También existen filtros y bolsas de lavado que retienen fibras.', { d: 2 }),
      par('Uní cada fuente con el tipo de microplástico que genera.', [ // e6
        ['Lavarropas con ropa sintética', 'Microfibras'],
        ['Neumáticos en el asfalto', 'Partículas de caucho y plástico'],
        ['Botella rota en la playa', 'Fragmentos secundarios'],
        ['Fábrica de plásticos', 'Bolitas industriales'],
      ], 'Fuentes muy distintas, un mismo problema.', { d: 2 }),
      numv(3, (i) => { // e7
        const fib = [700000, 500000, 1000000][i];
        const lav = [3, 4, 2][i];
        return {
          enunciado: `Si un lavado de ropa sintética suelta unas ${fib.toLocaleString('es-AR')} microfibras y una familia hace ${lav} lavados por semana, ¿cuántas microfibras suelta en una semana?`,
          valor: fib * lav,
          unidad: 'microfibras',
          explicacion: `${fib.toLocaleString('es-AR')} × ${lav} = ${(fib * lav).toLocaleString('es-AR')} microfibras por semana, de una sola casa. Multiplicado por millones de casas, es una fuente enorme.`,
        };
      }, { d: 1 }),
      rank('Ordená estos tamaños de mayor a menor.', [ // e8
        ['Una botella de plástico', 'unos 20 centímetros'],
        ['Una tapita', 'unos 3 centímetros'],
        ['Un microplástico grande', 'menos de 5 milímetros'],
        ['Una microfibra de ropa', 'más fina que un pelo'],
      ], 'El plástico no desaparece: pasa de lo que se ve a lo que no se ve.', { d: 1, extremos: ['Mayor', 'Menor'] }),
      det('Leé este posteo y marcá lo equivocado.', [ // e9
        ['Los microplásticos miden menos de 5 milímetros.', false],
        ['Solo hay microplásticos en el mar, no en la comida.', true, 'Se encontraron en alimentos, agua y hasta en el cuerpo humano.'],
        ['Los neumáticos desprenden partículas que llegan a los ríos.', false],
        ['La ropa sintética no suelta nada al lavarse.', true, 'Suelta miles de microfibras en cada lavado.'],
      ], 'Lo que no se ve a simple vista también contamina.', { d: 2 }),
      comp('Completá.', 'Los microplásticos miden menos de [5] milímetros; las telas sintéticas sueltan [microfibras] al lavarse; y los [neumáticos] desprenden partículas al rodar.', ['50', 'vitaminas', 'semáforos'], 'Tres ideas clave sobre los microplásticos y sus fuentes.', { d: 1 }),
      est('Estimá el tamaño máximo, en milímetros, de un microplástico según la definición más usada.', 5, { min: 0.1, max: 100, unidad: 'mm', escala: 'log' }, 'Menos de 5 milímetros. Muchos son microscópicos.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Plástico en ríos, mares y fauna', 'Cuánto plástico llega al agua, qué les hace a los animales y cómo se mueve por el océano.', [
      teoria('Del río al mar', [
        'Según el PNUMA, entre 19 y 23 millones de toneladas de residuos plásticos llegan cada año a lagos, ríos y mares. La mayor parte del plástico marino viene de tierra: de basurales, desagües y ríos que lo arrastran. Otra parte viene de la pesca: redes, sogas y boyas perdidas o abandonadas.',
      ], { destacado: { valor: '19-23 millones de t', texto: 'de residuos plásticos llegan cada año a lagos, ríos y mares, según el PNUMA.' } }),
      est('Estimá cuántos millones de toneladas de plástico llegan por año a lagos, ríos y mares, según el PNUMA.', 21, { min: 0.1, max: 1000, unidad: 'millones de t', escala: 'log' }, 'Entre 19 y 23 millones de toneladas por año. Un camión de basura lleno cada pocos segundos, sin parar.', { d: 3 }),
      clas('¿Este plástico en el mar viene de tierra o del mar?', { // e1
        'De tierra': ['Bolsas que arrastra un río', 'Botellas de un basural costero', 'Envoltorios que caen a un desagüe'],
        'Del mar': ['Redes de pesca perdidas', 'Sogas y boyas abandonadas', 'Cajones que caen de un barco'],
      }, 'La mayor parte viene de tierra, pero los restos de pesca son de los más dañinos para la fauna.', { d: 2 }),
      teoria('Qué les pasa a los animales', [
        'Los animales marinos sufren el plástico de dos formas principales. Por enredo: tortugas, lobos marinos, aves y ballenas quedan atrapados en redes, sogas y anillos, y pueden ahogarse o lastimarse. Por ingestión: confunden el plástico con comida —las tortugas marinas, por ejemplo, pueden confundir bolsas con medusas— y se llenan el estómago de algo que no los alimenta.',
        'Las "redes fantasma", redes de pesca perdidas que siguen atrapando animales durante años, son especialmente dañinas.',
      ]),
      par('Uní cada animal con el daño típico que le causa el plástico.', [ // e2
        ['Tortuga marina', 'Come bolsas confundiéndolas con medusas'],
        ['Lobo marino', 'Se enreda en sogas y redes'],
        ['Albatros', 'Alimenta a sus pichones con fragmentos de plástico'],
        ['Peces', 'Ingieren microplásticos'],
      ], 'El enredo y la ingestión afectan a cientos de especies marinas.', { d: 2 }),
      cad('Armá la cadena de cómo una red de pesca perdida sigue matando.', [ // e3
        'Una red de pesca se pierde en el mar',
        'Sigue flotando o en el fondo durante años',
        'Atrapa peces, tortugas y aves',
        'Los animales muertos atraen a otros animales',
        'Que también quedan atrapados',
      ], ['La red se biodegrada en una semana'], 'Por eso se las llama redes fantasma: pescan sin nadie que las maneje.', { d: 2 }),
      vf('Una tortuga marina puede confundir una bolsa de plástico con una medusa.', true, 'En el agua, una bolsa flotando se parece a una medusa, uno de sus alimentos. Al comerla, puede morir por obstrucción.', { // e4
        razones: ['+Porque en el agua la bolsa se parece a una medusa', '-Porque las tortugas comen plástico a propósito', '-Porque las bolsas tienen olor a pescado'],
        d: 1,
      }),
      teoria('Las islas de basura', [
        'Las corrientes del océano forman grandes remolinos, llamados giros, donde el plástico flotante se acumula. La más conocida es la "gran mancha de basura del Pacífico". No es una isla sólida: es una zona enorme con una concentración alta de fragmentos, la mayoría chicos, mezclados en el agua.',
      ]),
      op('¿Cómo es realmente una "isla de basura" en el océano?', [ // e5
        'Una zona enorme con muchos fragmentos flotando',
        'Una isla sólida de plástico donde se puede caminar',
        ['Un basural en una isla con habitantes', 'No es un lugar habitado: es una zona del océano donde se acumula plástico.'],
        'Una planta de reciclaje en medio del mar',
      ], 'El nombre engaña: es más una sopa de fragmentos que una isla.', { d: 2 }),
      numv(3, (i) => { // e6
        const kg = [150, 300, 80][i];
        const pct = [70, 80, 60][i];
        return {
          enunciado: `En una limpieza de playa se juntaron ${kg} kg de residuos y el ${pct} % eran plásticos. ¿Cuántos kg de plástico se juntaron?`,
          valor: (kg * pct) / 100,
          unidad: 'kg',
          explicacion: `${kg} × ${pct} ÷ 100 = ${(kg * pct) / 100} kg de plástico. En las limpiezas de playas, el plástico suele ser la mayor parte de lo que se encuentra.`,
        };
      }, { d: 1 }),
      mult('¿Qué ayuda a que menos plástico llegue al mar? Marcá todo.', [ // e7
        '+Recolección de basura en barrios cercanos a ríos',
        '+Barreras que retienen residuos en arroyos',
        '+Recuperar redes de pesca perdidas',
        '+Reducir los plásticos de un solo uso',
        '-Tirar la basura al río para que se la lleve',
      ], 'Cortar el camino en tierra es más efectivo que limpiar el mar.', { d: 1 }),
      det('Leé esta nota y marcá lo equivocado.', [ // e8
        ['La mayor parte del plástico marino viene de tierra.', false],
        ['Las islas de basura son islas sólidas donde se puede caminar.', true, 'Son zonas con muchos fragmentos flotando, no islas sólidas.'],
        ['Las redes fantasma siguen atrapando animales.', false],
        ['El plástico en el mar no afecta a las aves.', true, 'Muchas aves ingieren plástico o se enredan.'],
      ], 'El plástico en el mar es un problema real, que conviene contar con precisión.', { d: 2 }),
      comp('Completá.', 'La mayor parte del plástico marino llega desde [tierra]; las redes perdidas que siguen atrapando animales se llaman redes [fantasma].', ['el cielo', 'mágicas'], 'Dos ideas clave sobre el plástico en el mar y su origen.', { d: 1 }),
      rank('Ordená estas intervenciones de la más temprana a la más tardía en el camino del plástico hacia el mar.', [ // e11
        ['No producir el envase innecesario', 'antes de que exista'],
        ['Recolectar la basura en el barrio', 'en tierra'],
        ['Barrera en el arroyo', 'en el agua dulce'],
        ['Limpiar la playa', 'cuando ya llegó al mar'],
      ], 'Cuanto antes se corta el camino, menos esfuerzo y más efectivo.', { d: 2, extremos: ['Más temprana', 'Más tardía'] }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Soluciones que funcionan', 'Reducir, rediseñar, retornables, responsabilidad del productor, prohibiciones y un tratado global.', [
      teoria('Todo el ciclo', [
        'Como el plástico es un problema de todo el ciclo —producción, uso y descarte—, las soluciones más efectivas actúan en varias etapas a la vez: producir menos plástico innecesario, rediseñar envases para que se puedan reutilizar o reciclar, recolectar y recuperar mejor, y limpiar lo que ya está en el ambiente.',
        'Según la jerarquía de residuos que viste antes, reducir y reutilizar pesan más que reciclar, y limpiar es lo último: sirve, pero no alcanza si el grifo sigue abierto.',
      ]),
      rank('Ordená estas medidas contra el plástico según la jerarquía, de la más alta a la más baja.', [ // e1
        ['Eliminar envases innecesarios', 'prevenir'],
        ['Sistemas de envases retornables', 'reutilizar'],
        ['Mejorar el reciclaje', 'reciclar'],
        ['Limpiar playas', 'remediar'],
      ], 'Cerrar la canilla antes que secar el piso.', { d: 2, extremos: ['Más alta', 'Más baja'] }),
      teoria('Rediseñar', [
        'Muchos envases son difíciles de reciclar porque combinan capas de materiales distintos (plástico con aluminio, por ejemplo), tienen colores oscuros que las máquinas no detectan o etiquetas que no se separan. Rediseñarlos con un solo material, colores claros y etiquetas fáciles de quitar mejora mucho su reciclaje.',
        'La Fundación Ellen MacArthur promueve una economía circular del plástico: eliminar lo innecesario, innovar para que lo necesario sea reutilizable o reciclable, y hacer que circule sin volverse residuo.',
      ]),
      clas('¿Este diseño facilita o dificulta el reciclaje?', { // e2
        'Facilita': ['Botella de un solo tipo de plástico transparente', 'Etiqueta que se despega fácil', 'Tapa del mismo material que el envase'],
        'Dificulta': ['Envase multicapa de plástico y aluminio', 'Bandeja de plástico negro', 'Etiqueta pegada con adhesivo que no se separa'],
      }, 'El reciclaje empieza mucho antes del tacho: en el diseño.', { d: 2 }),
      teoria('Responsabilidad extendida y depósito', [
        'Con la responsabilidad extendida del productor, como viste antes, las empresas que ponen envases en el mercado financian su recuperación, lo que las incentiva a diseñar mejor. Los sistemas de depósito y retorno cobran un pequeño monto extra por el envase, que se devuelve al entregarlo vacío: en varios países logran recuperar la gran mayoría de las botellas.',
      ]),
      cad('Armá la cadena de un sistema de depósito y retorno.', [ // e3
        'Al comprar una bebida se paga un depósito por la botella',
        'Al terminarla, la persona la devuelve',
        'Recupera el dinero del depósito',
        'La botella se reutiliza o se recicla',
        'Muy pocas botellas terminan en el ambiente',
      ], ['El depósito se pierde siempre, devuelvas o no la botella'], 'Un incentivo económico chico puede cambiar muchísimo el destino de un envase.', { d: 2 }),
      vf('Los sistemas de depósito y retorno pueden lograr que se recupere la gran mayoría de las botellas.', true, 'En varios países que los aplican, la tasa de recuperación de botellas supera ampliamente la de los sistemas sin depósito.', { // e4
        razones: ['+Porque el dinero del depósito incentiva a devolver', '-Porque las botellas vuelven solas', '-Porque el depósito es obligatorio para los pájaros'],
        d: 2,
      }),
      teoria('Prohibiciones y un tratado', [
        'Muchas ciudades y países prohibieron o restringieron algunos plásticos de un solo uso: bolsas livianas, sorbetes, cubiertos, vasos. Funcionan mejor cuando hay alternativas reutilizables accesibles.',
        'Desde 2022, los países de las Naciones Unidas negocian un tratado global para terminar con la contaminación por plásticos, que abarque todo el ciclo de vida. Las negociaciones son difíciles, porque hay intereses muy distintos entre países productores y consumidores.',
      ]),
      mult('¿Qué medidas contra el plástico actúan antes de que exista el residuo? Marcá todas.', [ // e5
        '+Prohibir bolsas livianas de un solo uso',
        '+Sistemas de envases retornables',
        '+Rediseñar para usar menos material',
        '+Venta a granel con envase propio',
        '-Limpiar playas los fines de semana',
      ], 'Las medidas "aguas arriba" evitan el problema; las de limpieza lo remedian.', { d: 2 }),
      par('Uní cada herramienta con cómo funciona.', [ // e6
        ['Responsabilidad extendida', 'El productor financia la recuperación'],
        ['Depósito y retorno', 'Se devuelve dinero al entregar el envase'],
        ['Prohibición', 'Se deja de vender un producto de un solo uso'],
        ['Rediseño', 'El envase se hace más fácil de reciclar o reutilizar'],
      ], 'Herramientas distintas que se combinan en las políticas más exitosas.', { d: 2 }),
      op('Una ciudad prohíbe las bolsas livianas. ¿Qué hace más probable que la medida funcione?', [ // e7
        'Que haya bolsas reutilizables accesibles',
        'Que la prohibición se anuncie sin ninguna explicación',
        ['Que se reemplacen por bolsas más gruesas de un solo uso', 'Si la bolsa gruesa también se tira, puede empeorar el problema.'],
        'Que no se controle su cumplimiento',
      ], 'Las prohibiciones funcionan mejor con alternativas, comunicación y control.', { d: 2 }),
      numv(3, (i) => { // e8
        const bot = [1000000, 500000, 2000000][i];
        const s = [40, 30, 50][i];
        const c = [90, 85, 95][i];
        return {
          enunciado: `En una ciudad se venden ${bot.toLocaleString('es-AR')} botellas por mes. Sin depósito se recupera el ${s} %; con depósito, el ${c} %. ¿Cuántas botellas más por mes se recuperan con depósito?`,
          valor: (bot * (c - s)) / 100,
          unidad: 'botellas',
          explicacion: `${bot.toLocaleString('es-AR')} × (${c} − ${s}) ÷ 100 = ${((bot * (c - s)) / 100).toLocaleString('es-AR')} botellas más por mes que no terminan en el ambiente ni en el relleno.`,
        };
      }, { d: 2 }),
      det('Leé esta propuesta y marcá lo que no conviene.', [ // e9
        ['Prohibiremos las bolsas livianas y promoveremos las reutilizables.', false],
        ['Reemplazaremos los sorbetes de plástico por sorbetes de plástico "oxodegradable".', true, 'Los oxodegradables se fragmentan en microplásticos: no es una solución.'],
        ['Implementaremos un sistema de depósito para botellas.', false],
        ['Como vamos a limpiar la playa, no hace falta reducir nada.', true, 'Limpiar sin reducir es secar el piso con la canilla abierta.'],
      ], 'Las soluciones que funcionan atacan la causa y combinan herramientas.', { d: 3 }),
      comp('Completá.', 'Las mejores soluciones contra el plástico empiezan por [reducir]; el sistema que devuelve dinero al entregar el envase es el de [depósito] y retorno; y desde 2022 se negocia un [tratado] global.', ['limpiar', 'descuento', 'mundial de fútbol'], 'Tres ideas sobre las soluciones al plástico.', { d: 2 }),
      clas('¿Esta acción actúa sobre la causa o sobre la consecuencia?', { // e11
        'Causa': ['Eliminar envases innecesarios', 'Rediseñar para reciclar', 'Retornables'],
        'Consecuencia': ['Limpiar una playa', 'Sacar plástico de un arroyo con una red'],
      }, 'Las dos hacen falta, pero sin actuar sobre la causa, la consecuencia no termina nunca.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: el problema del plástico', 'Producción, destinos, microplásticos, mares y soluciones, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el relevamiento de la costanera', 'Un grupo de voluntarios limpió una costanera y clasificó lo que encontró. Con los datos, proponé qué hacer.', [
      teoria('Los datos', [
        'En una jornada de limpieza de 1 km de costanera se juntaron 2.000 objetos: 600 colillas de cigarrillo, 400 envoltorios de golosinas y snacks, 300 tapitas, 250 botellas plásticas, 200 bolsas, 150 sorbetes y 100 objetos de otros materiales.',
        'El municipio quiere usar los datos para tomar medidas.',
      ]),
      num('¿Qué porcentaje de los objetos eran colillas de cigarrillo?', 30, '%', '600 ÷ 2.000 × 100 = 30 %. Las colillas tienen filtros de acetato de celulosa, un plástico, y suelen ser el residuo más encontrado en limpiezas de playas.', { ctx: '600 colillas de 2.000 objetos en total.', d: 1 }),
      num('¿Cuántos objetos eran envases o partes de envases de bebidas (botellas y tapitas)?', 550, 'objetos', '250 botellas + 300 tapitas = 550 objetos, más de un cuarto del total.', { ctx: '250 botellas y 300 tapitas.', d: 1 }),
      rank('Ordená los residuos por cantidad encontrada, de más a menos.', [ // e3
        ['Colillas', '600'],
        ['Envoltorios', '400'],
        ['Tapitas', '300'],
        ['Botellas', '250'],
        ['Sorbetes', '150'],
      ], 'Los datos muestran dónde conviene actuar primero.', { d: 1 }),
      clas('Asigná a cada residuo una medida adecuada.', { // e4
        'Ceniceros y campañas': ['Colillas'],
        'Depósito y retorno o retornables': ['Botellas', 'Tapitas'],
        'Prohibición o alternativas reutilizables': ['Sorbetes', 'Bolsas livianas'],
      }, 'Cada tipo de residuo tiene su herramienta más efectiva.', { d: 3 }),
      op('¿Por qué las colillas son un problema, aunque sean chicas?', [ // e5
        'Porque su filtro es plástico y tóxico',
        'Porque son de papel y se degradan en un día',
        ['Porque ocupan mucho espacio en la playa', 'Ocupan poco; el problema es su material y las sustancias que liberan.'],
        'Porque atraen a los pingüinos de la zona',
      ], 'El filtro de acetato de celulosa es un plástico que puede tardar años en degradarse y suelta sustancias tóxicas en el agua.', { d: 3 }),
      mult('¿Qué medidas propondrías al municipio con estos datos? Marcá todas las razonables.', [ // e6
        '+Ceniceros y campañas sobre colillas en la costanera',
        '+Promover bebederos y botellas reutilizables',
        '+Restringir sorbetes y bolsas de un solo uso en los paradores',
        '+Repetir el relevamiento para ver si las medidas funcionan',
        '-Solo organizar más limpiezas sin cambiar nada más',
      ], 'Datos, medidas específicas y un nuevo relevamiento para evaluar: ciencia ciudadana aplicada.', { d: 3 }),
      det('El municipio anuncia su plan. Marcá lo que no conviene.', [ // e7
        ['Pondremos ceniceros cada 100 metros de costanera.', false],
        ['Los paradores entregarán sorbetes solo si se piden, y de materiales reutilizables.', false],
        ['Como las colillas son chiquitas, no vale la pena ocuparse.', true, 'Son el residuo más frecuente y liberan sustancias tóxicas.'],
        ['No volveremos a medir: ya sabemos lo que hay.', true, 'Sin medir de nuevo, no se sabe si las medidas funcionaron.'],
      ], 'Medir, actuar y volver a medir: así se sabe si un plan funciona.', { d: 3 }),
    ]),
  ],
});
