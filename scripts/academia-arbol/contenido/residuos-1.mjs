import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// RESIDUOS 1 — Qué pasa con lo que tirás.
// La base de la rama: qué es un residuo, de qué está hecha la basura, adónde
// va, qué pasa en un relleno o un basural y quiénes recuperan materiales.
// Retoma la idea del tronco de que "tirar" es cambiar de lugar (tronco-1) y
// el CO₂ equivalente del metano (tronco-2).

export default unidad({
  slug: 'residuos-1',
  rama: 'residuos',
  orden: 1,
  nivel: 1,
  requiereTronco: 1,
  titulo: 'Qué pasa con lo que tirás',
  bajada: 'La bolsa sale de tu casa, pero no desaparece. De qué está hecha, adónde va, qué le pasa y quién la recupera.',
  objetivos: [
    'Definir qué es un residuo y cuánto genera una persona',
    'Describir la composición típica de la basura de una casa',
    'Seguir el recorrido de un residuo desde la casa hasta su destino final',
    'Diferenciar un relleno sanitario de un basural a cielo abierto',
    'Reconocer el trabajo de los recicladores urbanos en la gestión de residuos',
  ],
  repasa: ['tronco-1', 'tronco-2'],
  fuentes: ['ley-25916-residuos', 'ceamse', 'ley-1854-basura-cero', 'faccyr', 'epa'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('La bolsa que sale de casa', 'Qué es un residuo, cuánto genera cada persona y por qué "tirar" no es hacer desaparecer.', [
      teoria('Qué es un residuo', [
        'Un residuo es algo que su dueño descarta porque ya no le sirve. Los residuos sólidos urbanos (RSU) son los que se generan en casas, comercios, oficinas y la vía pública: restos de comida, envases, papeles, textiles, pequeños objetos rotos.',
        'Hay otros residuos que tienen reglas propias, como los peligrosos (pilas, químicos, algunos aparatos electrónicos), los patogénicos (de hospitales) y los industriales.',
      ]),
      clas('¿Es un residuo sólido urbano o de otro tipo?', { // e1
        'Residuo sólido urbano': ['Cáscaras de papa', 'Una caja de cartón', 'Una botella de plástico', 'Una remera rota'],
        'Otro tipo (con reglas propias)': ['Jeringas de un hospital', 'Restos de solventes de una fábrica', 'Pilas usadas'],
      }, 'Los RSU son los de todos los días. Los otros necesitan una gestión especial porque pueden ser peligrosos.', { d: 1 }),
      teoria('Cuánto tira una persona', [
        'En Argentina, cada persona genera en promedio alrededor de 1 kilo de residuos por día, y bastante más en las grandes ciudades. Parece poco hasta que se multiplica: una familia de 4 genera unos 120 kilos por mes; una ciudad de un millón de habitantes, unas mil toneladas por día.',
      ], { destacado: { valor: '≈ 1 kg', texto: 'de residuos genera por día, en promedio, cada persona en Argentina.' } }),
      numv(3, (i) => { // e2
        const personas = [4, 3, 5][i];
        const kg = [1, 1.2, 0.9][i];
        return {
          enunciado: `En una casa viven ${personas} personas que generan ${kg.toLocaleString('es-AR')} kg de residuos por día cada una. ¿Cuántos kilos generan en 30 días?`,
          valor: Math.round(personas * kg * 30 * 10) / 10,
          unidad: 'kg',
          dec: 1,
          explicacion: `${personas} × ${kg.toLocaleString('es-AR')} × 30 = ${(Math.round(personas * kg * 30 * 10) / 10).toLocaleString('es-AR')} kg por mes. Lo que parece una bolsita por día es más que el peso de una persona por mes.`,
        };
      }, { d: 2 }),
      numv(3, (i) => { // e3
        const hab = [500000, 1000000, 3000000][i];
        return {
          enunciado: `Una ciudad tiene ${hab.toLocaleString('es-AR')} habitantes que generan 1 kg por día cada uno. ¿Cuántas toneladas genera por día?`,
          valor: hab / 1000,
          unidad: 'toneladas',
          explicacion: `${hab.toLocaleString('es-AR')} kg ÷ 1.000 = ${(hab / 1000).toLocaleString('es-AR')} toneladas por día. Todos los días hay que recogerlas, transportarlas y hacer algo con ellas.`,
        };
      }, { d: 2 }),
      teoria('Tirar es cambiar de lugar', [
        'En el tronco viste que la materia no desaparece. Con la basura se ve claro: cuando la bolsa sale de casa, alguien la recoge, la transporta y la deja en otro lugar, donde se queda, se descompone o se recupera.',
        '"Afuera" no existe. Cada residuo termina en algún lugar concreto, con consecuencias concretas para alguien.',
      ]),
      vf('Cuando el camión recolector se lleva la bolsa, el residuo deja de existir.', false, 'Solo cambia de lugar. Termina en un relleno, un basural, una planta de reciclaje o, a veces, en un arroyo o un campo.', { // e4
        razones: ['+Porque la materia no desaparece: solo se traslada', '-Porque el camión la destruye al compactarla', '-Porque la basura se evapora en el relleno'],
        d: 1,
      }),
      cad('Armá el recorrido típico de una bolsa de basura en una ciudad.', [ // e5
        'Se genera en la casa y se saca a la vereda',
        'El camión la recoge y la compacta',
        'Pasa por una estación de transferencia',
        'Llega a un relleno sanitario',
      ], ['Se devuelve a la casa al mes siguiente'], 'Cuatro etapas típicas. La ley nacional de residuos domiciliarios las describe como gestión integral: de la generación a la disposición final.', { d: 2 }),
      teoria('Las etapas de la gestión', [
        'La Ley 25.916, de presupuestos mínimos para la gestión de residuos domiciliarios, describe las etapas de la gestión integral: generación, disposición inicial (cómo se saca a la calle), recolección y transporte, transferencia, tratamiento y disposición final.',
        'Cada municipio organiza esas etapas. Por eso las reglas de cómo separar o qué día sacar la basura cambian de una ciudad a otra.',
      ]),
      ord('Ordená las etapas de la gestión de residuos según la ley.', [ // e6
        'Generación',
        'Disposición inicial',
        'Recolección y transporte',
        'Transferencia',
        'Tratamiento',
        'Disposición final',
      ], 'Del tacho de la cocina al destino final. En cada etapa se puede reducir, separar o recuperar.', { d: 2, extremos: ['Primero', 'Último'] }),
      op('¿Por qué las reglas para separar la basura cambian de una ciudad a otra?', [ // e7
        'Porque cada municipio organiza su propia gestión',
        'Porque los residuos son distintos en cada provincia',
        ['Porque la ley nacional prohíbe separar', 'La ley nacional fija mínimos; los municipios organizan los detalles.'],
        'Porque los camiones de cada ciudad son de otra marca',
      ], 'La ley nacional fija un piso común; la recolección y el tratamiento son responsabilidad local.', { d: 2 }),
      mult('¿Qué pasa con la basura de una ciudad cada día? Marcá todo lo correcto.', [ // e8
        '+Hay que recogerla',
        '+Hay que transportarla',
        '+Hay que decidir dónde termina',
        '+Cuesta plata a todos los vecinos',
        '-Se descompone sola en la vereda en unas horas',
      ], 'Recolectar y disponer residuos es uno de los mayores gastos de muchos municipios.', { d: 1 }),
      comp('Completá.', 'Cada persona genera alrededor de [1] kilo de residuos por día; al tirarlos, la materia no [desaparece]: cambia de [lugar].', ['10', 'aumenta', 'forma'], 'La idea del tronco aplicada a la bolsa de basura.', { d: 1 }),
      det('Leé este comentario y marcá lo equivocado.', [ // e10
        ['Una persona genera cerca de un kilo de basura por día.', false],
        ['Una vez que el camión pasa, ya no es problema de nadie.', true, 'Termina en algún lugar, y el costo lo pagan todos: plata, espacio y contaminación.'],
        ['La gestión de residuos la organiza cada municipio.', false],
        ['Una familia no genera más de 10 kilos de basura por mes.', true, 'Con 1 kg por persona por día, una familia de 4 genera unos 120 kg por mes.'],
      ], 'Los números chicos por día se vuelven grandes por mes y por ciudad.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('De qué está hecha la basura', 'Orgánicos, papel, plásticos, vidrio y metales: la composición de la bolsa y por qué importa conocerla.', [
      teoria('Abrir la bolsa', [
        'Los estudios de composición de residuos abren y pesan muestras de bolsas reales para saber qué hay adentro. En las ciudades argentinas, lo que más pesa son los residuos orgánicos: restos de comida y de jardín, que suelen ser alrededor de la mitad.',
        'Después vienen el papel y el cartón, los plásticos, el vidrio, los metales, los textiles y otros materiales como pañales, madera y escombros.',
      ], {
        datos: barras('Composición de los residuos de una ciudad argentina (ejemplo aproximado)', '% del peso', [
          ['Orgánicos', 45],
          ['Plásticos', 15],
          ['Papel y cartón', 14],
          ['Pañales y sanitarios', 7],
          ['Vidrio', 4],
          ['Textiles', 4],
          ['Metales', 2],
          ['Otros', 9],
        ], 'Valores ilustrativos redondeados; varían según la ciudad, el barrio y la época del año.'),
      }),
      rank('Según ese ejemplo, ordená los materiales por su peso en la basura, de más a menos.', [ // e1
        ['Orgánicos', '≈ 45 %'],
        ['Plásticos', '≈ 15 %'],
        ['Papel y cartón', '≈ 14 %'],
        ['Vidrio', '≈ 4 %'],
        ['Metales', '≈ 2 %'],
      ], 'Los orgánicos son casi la mitad del peso. Cualquier plan serio de residuos tiene que empezar por ahí.', { d: 2 }),
      est('Estimá qué porcentaje del peso de la basura de una casa son restos orgánicos.', 45, { min: 0, max: 100, paso: 5, unidad: '%' }, 'Alrededor de la mitad. Por eso el compostaje, que vas a ver en esta rama, puede reducir tanto la basura.', { d: 2 }),
      teoria('Peso contra volumen', [
        'El peso y el volumen cuentan historias distintas. Los orgánicos pesan mucho porque tienen agua. Los plásticos y el cartón pesan poco pero ocupan mucho lugar: una bolsa llena de envases plásticos puede pesar menos de medio kilo.',
        'Por eso un tacho puede llenarse rápido con envases sin que la basura pese mucho, y el volumen es lo que llena camiones y rellenos.',
      ]),
      vf('Como los plásticos pesan poco, casi no ocupan lugar en la basura.', false, 'Pesan poco pero ocupan mucho volumen. Son una parte chica del peso y una parte grande del espacio.', { // e2
        razones: ['+Porque son livianos pero voluminosos', '-Porque los plásticos se compactan hasta desaparecer', '-Porque el peso y el volumen son siempre proporcionales'],
        d: 2,
      }),
      clas('¿Qué es más importante en este material: su peso o su volumen?', { // e3
        'Pesa mucho (tiene agua)': ['Restos de verdura', 'Yerba usada', 'Pasto cortado'],
        'Ocupa mucho (pesa poco)': ['Botellas plásticas', 'Cajas de cartón sin aplastar', 'Bandejas de telgopor'],
      }, 'Los orgánicos dominan el peso; los envases dominan el volumen. Los dos problemas tienen soluciones distintas.', { d: 2 }),
      teoria('Por qué conocer la composición', [
        'Saber qué hay en la bolsa permite decidir qué hacer con cada parte: los orgánicos pueden compostarse, el papel, el cartón, muchos plásticos, el vidrio y los metales pueden reciclarse, y otros residuos necesitan tratamientos especiales.',
        'Si todo va mezclado, los orgánicos ensucian los materiales reciclables y se pierde casi todo. Separar en origen, en la casa, es lo que hace posible el resto.',
      ]),
      par('Uní cada material con lo que se puede hacer con él.', [ // e4
        ['Restos de comida', 'Compostarlos'],
        ['Cartón limpio', 'Reciclarlo como papel'],
        ['Frascos de vidrio', 'Fundirlos para hacer vidrio nuevo'],
        ['Latas de aluminio', 'Fundirlas para hacer aluminio nuevo'],
      ], 'Casi todo lo que hay en la bolsa tiene un destino mejor que el relleno, si llega limpio y separado.', { d: 2 }),
      cad('Armá la cadena de por qué mezclar orgánicos con reciclables arruina el reciclaje.', [ // e5
        'Los restos de comida van en la misma bolsa que el cartón',
        'El cartón se moja y se engrasa',
        'Las plantas de reciclaje no pueden usarlo',
        'Ese cartón termina en el relleno',
      ], ['El cartón engrasado se recicla mejor'], 'Separar en origen es la condición para que todo lo demás funcione.', { d: 2 }),
      numv(3, (i) => { // e6
        const kg = [120, 90, 150][i];
        const org = [45, 50, 40][i];
        return {
          enunciado: `Una familia genera ${kg} kg de residuos por mes y el ${org} % son orgánicos. ¿Cuántos kilos de orgánicos genera por mes?`,
          valor: (kg * org) / 100,
          unidad: 'kg',
          dec: 1,
          explicacion: `${kg} × ${org} ÷ 100 = ${((kg * org) / 100).toLocaleString('es-AR')} kg de orgánicos por mes, que podrían compostarse en vez de viajar al relleno.`,
        };
      }, { d: 2 }),
      mult('¿Cuáles de estos residuos son orgánicos? Marcá todos.', [ // e7
        '+Cáscaras de huevo',
        '+Yerba y saquitos de té',
        '+Restos de poda',
        '+Cáscaras de frutas',
        '-Una bandeja de telgopor',
      ], 'Orgánico es lo que viene de un ser vivo y se descompone. El telgopor es plástico.', { d: 1 }),
      op('Una ciudad quiere reducir a la mitad lo que manda al relleno. ¿Qué parte de la basura conviene atacar primero?', [ // e8
        'Los orgánicos, que son casi la mitad del peso',
        'Los metales, que son muy valiosos',
        ['El vidrio, porque es pesado', 'El vidrio pesa, pero es una parte chica del total, alrededor del 4 %.'],
        'Los textiles, porque son difíciles de tratar',
      ], 'Elegir por impacto: los orgánicos son la fracción más grande y pueden tratarse cerca, con compostaje.', { d: 3 }),
      det('Leé esta conclusión de un estudio escolar y marcá lo equivocado.', [ // e9
        ['Los orgánicos fueron la parte más pesada de la bolsa.', false],
        ['Como los plásticos pesaron poco, no son un problema.', true, 'Pesan poco pero ocupan mucho volumen y duran mucho tiempo.'],
        ['El cartón mojado con restos de comida ya no sirve para reciclar.', false],
        ['Separar no sirve porque todo termina mezclado igual.', true, 'Donde hay recolección diferenciada o recicladores, separar permite recuperar materiales.'],
      ], 'Peso y volumen, y la importancia de separar en origen.', { d: 3 }),
      comp('Completá.', 'Los residuos [orgánicos] son casi la mitad del peso de la basura; los plásticos pesan poco pero ocupan mucho [volumen].', ['metales', 'peso', 'agua'], 'Dos datos que cambian cómo se piensa un plan de residuos.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Relleno sanitario o basural', 'Dos destinos muy distintos para la misma basura: uno controlado y otro que contamina.', [
      teoria('El basural a cielo abierto', [
        'Un basural a cielo abierto es un lugar donde la basura se tira sin ningún control: sin impermeabilizar el suelo, sin cubrirla y muchas veces quemándola. En Argentina hay miles de basurales de este tipo, sobre todo en municipios chicos y medianos.',
        'Contaminan el suelo y las napas con los líquidos que se forman, el aire con el humo de las quemas, atraen roedores e insectos que transmiten enfermedades y ponen en riesgo a quienes viven o trabajan cerca.',
      ]),
      mult('¿Qué problemas causa un basural a cielo abierto? Marcá todos.', [ // e1
        '+Contamina el suelo y las napas',
        '+El humo de las quemas contamina el aire',
        '+Atrae ratas, moscas y mosquitos',
        '+Pone en riesgo la salud de quienes viven cerca',
        '-Produce agua potable para el barrio',
      ], 'Un basural afecta el suelo, el agua, el aire y la salud al mismo tiempo.', { d: 1 }),
      teoria('El relleno sanitario', [
        'Un relleno sanitario es una obra de ingeniería. El suelo se impermeabiliza con arcillas y membranas para que los líquidos no lleguen a las napas. La basura se compacta en capas y se cubre con tierra todos los días. Los líquidos se recogen y se tratan, y los gases se captan con caños.',
        'En el área metropolitana de Buenos Aires, la empresa estatal CEAMSE opera los rellenos que reciben miles de toneladas por día. Un relleno controla la contaminación, pero ocupa tierra, se llena y sigue emitiendo gases durante décadas.',
      ]),
      clas('¿Es característica de un relleno sanitario o de un basural a cielo abierto?', { // e2
        'Relleno sanitario': ['Membranas que impermeabilizan el suelo', 'Cobertura diaria con tierra', 'Captación de gases con caños'],
        'Basural a cielo abierto': ['Quema de la basura', 'Líquidos que se infiltran en el suelo', 'Basura expuesta a animales y lluvia'],
      }, 'La diferencia es el control: un relleno está diseñado para contener; un basural no contiene nada.', { d: 2 }),
      teoria('Lixiviados: el jugo de la basura', [
        'Cuando llueve sobre la basura, el agua la atraviesa y arrastra sustancias: restos orgánicos, metales, químicos. Ese líquido se llama lixiviado, y es muy contaminante.',
        'En un relleno, los lixiviados se juntan en el fondo impermeable y se bombean a una planta de tratamiento. En un basural, se infiltran directamente hacia las napas o escurren hacia arroyos.',
      ]),
      cad('Armá la cadena de cómo un basural puede contaminar el agua de un pozo.', [ // e3
        'Llueve sobre el basural',
        'El agua atraviesa la basura y arrastra sustancias',
        'Se forma un lixiviado muy contaminante',
        'El lixiviado se infiltra en el suelo sin barrera',
        'Llega a la napa de la que bebe un pozo cercano',
      ], ['El lixiviado se purifica solo al tocar el suelo'], 'Es la conexión entre residuos y agua que viste en la rama de Agua: lo que se tira en tierra puede terminar en el vaso.', { d: 2 }),
      vf('Un relleno sanitario no contamina nada, así que da igual cuánta basura se mande.', false, 'Controla mucho mejor que un basural, pero ocupa tierra, se llena, emite metano durante décadas y cuesta mucho. Mandar menos siempre es mejor.', { // e4
        razones: ['+Porque igual ocupa tierra, emite gases y se llena', '-Porque los rellenos son infinitos', '-Porque la basura desaparece en el relleno'],
        d: 2,
      }),
      teoria('Metano: el gas de la basura', [
        'En un relleno, la basura orgánica queda enterrada sin oxígeno. Ahí la descomponen microbios que producen metano, un gas de efecto invernadero que, como viste en el tronco, calienta muchas veces más que el CO₂ en un período de 100 años.',
        'Los rellenos y basurales están entre las mayores fuentes de metano causadas por las personas. Captar ese gas y quemarlo o usarlo para generar electricidad reduce mucho su efecto.',
      ]),
      op('¿Por qué los restos de comida enterrados en un relleno producen metano?', [ // e5
        'Porque se descomponen sin oxígeno',
        'Porque la tierra que los cubre tiene metano',
        ['Porque los camiones los rocían con gas', 'El metano lo producen microbios al descomponer lo orgánico sin aire.'],
        'Porque los rellenos se construyen sobre pozos de gas',
      ], 'Sin oxígeno, los microbios que descomponen producen metano. Con oxígeno, como en una compostera bien hecha, producen sobre todo CO₂ y mucho menos metano.', { d: 2 }),
      numv(3, (i) => { // e6
        const t = [2, 5, 10][i];
        return {
          enunciado: `Un relleno emite ${t} toneladas de metano. Si el metano calienta unas 28 veces más que el CO₂ en 100 años, ¿cuántas toneladas de CO₂ equivalente son?`,
          valor: t * 28,
          unidad: 't CO₂e',
          explicacion: `${t} × 28 = ${t * 28} t de CO₂ equivalente. Es la cuenta del tronco: gases distintos, un mismo número para comparar.`,
        };
      }, { d: 2 }),
      par('Uní cada término con su definición.', [ // e7
        ['Lixiviado', 'Líquido contaminante que se forma en la basura'],
        ['Relleno sanitario', 'Obra que aísla y controla los residuos'],
        ['Basural a cielo abierto', 'Lugar de descarte sin controles'],
        ['Biogás', 'Gas con metano que sale de lo orgánico enterrado'],
      ], 'Cuatro palabras que aparecen en cualquier discusión sobre el destino de la basura.', { d: 2 }),
      det('Leé esta noticia local y marcá lo equivocado.', [ // e8
        ['El municipio cerrará su basural y llevará los residuos a un relleno sanitario.', false],
        ['Así la basura dejará de generar metano.', true, 'El relleno también genera metano; puede captarse, pero no desaparece.'],
        ['El relleno tendrá membranas y tratamiento de lixiviados.', false],
        ['Por eso ya no hace falta reducir ni separar.', true, 'El relleno se llena y cuesta: reducir y separar sigue siendo clave.'],
      ], 'Pasar de basural a relleno es un gran avance, pero no reemplaza reducir y recuperar.', { d: 3 }),
      rank('Ordená estos destinos de un residuo orgánico de peor a mejor para el ambiente.', [ // e9
        ['Quemado en un basural a cielo abierto', 'humo, lixiviados y metano'],
        ['Enterrado en un relleno sin captación de gas', 'metano a la atmósfera'],
        ['Enterrado en un relleno con captación de gas', 'metano captado en parte'],
        ['Compostado', 'vuelve al suelo como abono'],
      ], 'Cada paso mejora el control. El compostaje, que vas a ver en esta rama, evita el problema en el origen.', { d: 3, extremos: ['Peor', 'Mejor'] }),
      comp('Completá.', 'En un relleno, lo orgánico se descompone sin [oxígeno] y produce [metano]; el líquido que atraviesa la basura se llama [lixiviado].', ['luz', 'vapor', 'compost'], 'Tres ideas que explican por qué la basura orgánica es un problema climático.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('La basura también tiene costo', 'Cuánto cuesta recoger y enterrar, quién lo paga y por qué cada kilo que no se tira ahorra en toda la cadena.', [
      teoria('El costo de la cadena', [
        'Recoger, transportar y disponer residuos cuesta mucho: camiones, combustible, trabajadores, estaciones de transferencia y rellenos. En muchos municipios es uno de los gastos más grandes del presupuesto, y lo pagan todos los vecinos con sus tasas.',
        'El costo suele crecer con la cantidad: más toneladas son más viajes de camión y más espacio en el relleno. Por eso cada kilo que no se genera, o que se recupera, ahorra plata a toda la ciudad.',
      ]),
      numv(3, (i) => { // e1
        const t = [1000, 500, 3000][i];
        const costo = [50000, 60000, 45000][i];
        return {
          enunciado: `Una ciudad gestiona ${t.toLocaleString('es-AR')} toneladas de residuos por día y cada tonelada le cuesta $${costo.toLocaleString('es-AR')} entre recolección y disposición. ¿Cuánto gasta por día?`,
          valor: t * costo,
          unidad: '$',
          explicacion: `${t.toLocaleString('es-AR')} × $${costo.toLocaleString('es-AR')} = $${(t * costo).toLocaleString('es-AR')} por día. Por año, 365 veces eso.`,
        };
      }, { d: 2 }),
      numv(3, (i) => { // e2
        const t = [1000, 500, 3000][i];
        const red = [10, 20, 15][i];
        return {
          enunciado: `Si esa ciudad de ${t.toLocaleString('es-AR')} toneladas por día reduce un ${red} % lo que manda al relleno, ¿cuántas toneladas por día deja de enviar?`,
          valor: (t * red) / 100,
          unidad: 'toneladas',
          explicacion: `${t.toLocaleString('es-AR')} × ${red} ÷ 100 = ${((t * red) / 100).toLocaleString('es-AR')} toneladas por día menos: menos viajes de camión, menos espacio de relleno y menos gasto.`,
        };
      }, { d: 2 }),
      teoria('Los costos que no aparecen en la factura', [
        'Hay costos que no se pagan en pesos: el metano que calienta el planeta, la contaminación del agua y el suelo cerca de basurales, la salud de quienes viven al lado, la tierra ocupada por rellenos durante décadas. Se llaman costos externos, porque no los paga quien genera el residuo.',
      ]),
      clas('¿Es un costo que se paga en la tasa municipal o un costo externo?', { // e3
        'Se paga en la tasa': ['El combustible de los camiones', 'Los sueldos de los recolectores', 'La operación del relleno'],
        'Costo externo': ['El metano que calienta el planeta', 'La napa contaminada cerca de un basural', 'Las enfermedades de quienes viven al lado'],
      }, 'Los costos externos existen aunque nadie los facture. Reducir residuos baja los dos tipos.', { d: 2 }),
      vf('Si la tasa de basura es baja, tirar mucho no tiene costo.', false, 'La tasa no refleja los costos externos: contaminación, metano y salud. Y la cuenta del municipio la terminan pagando todos.', { // e4
        razones: ['+Porque hay costos externos que la tasa no refleja', '-Porque la basura se gestiona gratis', '-Porque los rellenos no ocupan tierra'],
        d: 2,
      }),
      teoria('Quién genera, quién paga', [
        'Hoy, la mayoría de los costos de los envases los paga el municipio, no quien los fabrica o vende. La responsabilidad extendida del productor (REP) es una idea que propone que las empresas que ponen envases en el mercado se hagan cargo de financiar su recuperación.',
        'Varios países la aplican y en Argentina hay leyes provinciales y proyectos nacionales. La idea es que el costo del residuo entre en el precio del producto, y que las empresas tengan un incentivo para diseñar envases más fáciles de reciclar o reutilizar.',
      ]),
      op('¿Qué busca la responsabilidad extendida del productor?', [ // e5
        'Que quien pone envases en el mercado financie su recuperación',
        'Que los vecinos paguen más tasa municipal por la basura',
        ['Que se prohíban todos los envases de plástico', 'No prohíbe: busca que el costo de gestión lo asuma el productor.'],
        'Que los municipios dejen de recoger los residuos de envases',
      ], 'Cuando el costo del residuo recae en quien lo diseña, aparece el incentivo para diseñarlo mejor.', { d: 2 }),
      cad('Armá la cadena de cómo la responsabilidad extendida del productor puede cambiar un envase.', [ // e6
        'La empresa paga por cada tonelada de envases que vende',
        'Los envases difíciles de reciclar le cuestan más',
        'La empresa rediseña el envase para que sea reciclable o más liviano',
        'Llegan menos envases problemáticos al relleno',
      ], ['Los vecinos pagan el rediseño con más tasa'], 'Un incentivo bien puesto cambia decisiones de diseño que ningún vecino puede cambiar solo. Es lo tuyo y lo de todos del tronco.', { d: 3 }),
      mult('¿Cuáles de estos son costos reales de tirar más basura? Marcá todos.', [ // e7
        '+Más viajes de camión y combustible',
        '+Rellenos que se llenan antes',
        '+Más metano en la atmósfera',
        '+Más tierra ocupada por décadas',
        '-Más agua potable en la ciudad',
      ], 'Algunos se pagan en pesos, otros en ambiente y salud. Todos son reales.', { d: 1 }),
      par('Uní cada idea con su ejemplo.', [ // e8
        ['Costo interno', 'El sueldo de un recolector'],
        ['Costo externo', 'Una napa contaminada por lixiviados'],
        ['Responsabilidad extendida', 'Una empresa financia la recuperación de sus envases'],
        ['Ahorro en cadena', 'Un kilo menos es menos camión y menos relleno'],
      ], 'Cuatro ideas económicas para pensar los residuos más allá de la bolsa.', { d: 3 }),
      det('Leé este comentario y marcá lo equivocado.', [ // e9
        ['Recolectar residuos es uno de los grandes gastos de un municipio.', false],
        ['Si la basura no la veo, no me cuesta nada.', true, 'Se paga con las tasas y con costos externos como la contaminación.'],
        ['Reducir un 10 % la basura ahorra camiones y espacio de relleno.', false],
        ['La responsabilidad extendida del productor significa que los vecinos paguen los envases.', true, 'Es al revés: busca que los productores financien la recuperación.'],
      ], 'La basura tiene costos visibles e invisibles, y alguien siempre los paga.', { d: 3 }),
      comp('Completá.', 'Los costos que no paga quien genera el residuo se llaman [externos]; la responsabilidad extendida busca que los pague el [productor].', ['internos', 'vecino', 'municipio'], 'Dos conceptos para discutir quién paga por la basura.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Quienes recuperan', 'Recicladores urbanos, cooperativas y centros verdes: el trabajo que hace posible el reciclaje en Argentina.', [
      teoria('Los recicladores urbanos', [
        'En Argentina, gran parte de los materiales que se reciclan son recuperados por recicladores urbanos, también llamados cartoneros o recuperadores. Recorren las calles, separan papel, cartón, plásticos, vidrio y metales, y los venden a la industria.',
        'Durante mucho tiempo fue un trabajo informal y sin derechos. Con los años, muchos se organizaron en cooperativas y en organizaciones como la Federación Argentina de Cartoneros, Carreros y Recicladores (FACCyR), y varios municipios los incorporaron a su sistema de gestión.',
      ]),
      op('¿Quiénes recuperan gran parte de los materiales reciclables en las ciudades argentinas?', [ // e1
        'Los recicladores urbanos y sus cooperativas',
        'Las fábricas de envases directamente en las casas',
        ['Los camiones compactadores comunes', 'El camión común compacta todo junto: ahí se pierde casi todo lo reciclable.'],
        'Los rellenos sanitarios al enterrar la basura',
      ], 'Sin los recicladores, las tasas de reciclaje del país serían mucho más bajas.', { d: 1 }),
      teoria('Basura Cero y la inclusión', [
        'En la Ciudad de Buenos Aires, leyes como la Ley 992 reconocieron a los recuperadores urbanos, y la Ley 1.854, conocida como "Basura Cero", fijó el objetivo de reducir progresivamente lo que se entierra y promover la separación en origen y el reciclaje.',
        'Las cooperativas operan centros verdes: lugares donde el material separado se clasifica, se enfarda y se vende. Cuanto más limpio y separado llega el material, más vale y mejores son las condiciones de ese trabajo.',
      ]),
      cad('Armá el recorrido de una caja de cartón que separaste en tu casa.', [ // e2
        'La separás limpia y seca en casa',
        'Un reciclador o un camión diferenciado la recoge',
        'Llega a un centro verde',
        'Se clasifica y se enfarda con otros cartones',
        'Se vende a una fábrica de papel',
      ], ['Se entierra en el relleno junto con los orgánicos'], 'Tu separación es el primer eslabón. Si falla, los demás no pueden hacer nada.', { d: 2 }),
      mult('¿Qué ayuda al trabajo de los recicladores urbanos? Marcá todo lo que corresponde.', [ // e3
        '+Separar los reciclables limpios y secos',
        '+No mezclar vidrio roto con el resto sin protegerlo',
        '+Aplastar las cajas y botellas',
        '+Sacar los reciclables en el horario indicado',
        '-Mezclar restos de comida con el cartón',
      ], 'Material limpio vale más y es más seguro de manipular. Es respeto y es eficiencia.', { d: 2 }),
      vf('Separar los reciclables en casa no tiene efecto si no hay camión diferenciado.', false, 'En muchas ciudades los recicladores urbanos recuperan el material separado aunque no haya camión especial. Además, hay puntos verdes donde llevarlo.', { // e4
        razones: ['+Porque recicladores y puntos verdes pueden recuperarlo', '-Porque separar hace que el material se degrade', '-Porque los camiones comunes separan todo solos'],
        d: 2,
      }),
      teoria('Un trabajo con riesgos', [
        'Revolver bolsas mezcladas expone a los recicladores a cortes con vidrios, agujas y latas, a restos de comida en descomposición y a químicos. Las cooperativas organizadas trabajan para tener equipamiento, galpones, obra social y un ingreso más estable.',
        'Separar bien en casa no solo mejora el reciclaje: reduce los riesgos de quien después toca esos materiales.',
      ]),
      clas('¿Esta acción en casa hace más seguro o más riesgoso el trabajo de un reciclador?', { // e5
        'Más seguro': ['Envolver el vidrio roto en papel y marcarlo', 'Separar los reciclables secos de los orgánicos', 'Cerrar bien las bolsas'],
        'Más riesgoso': ['Tirar agujas sueltas en la bolsa', 'Mezclar vidrio roto con cartón', 'Poner químicos en botellas de bebida'],
      }, 'La bolsa que sacás la toca otra persona. Pensarlo cambia cómo la armás.', { d: 2 }),
      par('Uní cada lugar o actor con su función.', [ // e6
        ['Centro verde', 'Clasifica y enfarda el material separado'],
        ['Cooperativa de recicladores', 'Organiza el trabajo de recuperación'],
        ['Punto verde', 'Lugar donde los vecinos dejan reciclables'],
        ['Industria recicladora', 'Transforma el material en producto nuevo'],
      ], 'El reciclaje es una cadena de actores. Cada uno depende del anterior.', { d: 2 }),
      op('Una vecina pregunta si vale la pena lavar un frasco antes de separarlo. ¿Qué le responderías?', [ // e7
        'Sí, con un enjuague alcanza: el material limpio vale más',
        'No, en la planta lo lavan todo con máquinas especiales',
        ['No, el vidrio sucio se recicla igual de bien que el limpio', 'Los restos de comida contaminan otros materiales y bajan su valor.'],
        'Sí, pero solo si es un frasco de vidrio muy caro',
      ], 'No hace falta dejarlo impecable: con sacarle los restos y enjuagarlo alcanza para no ensuciar el resto.', { d: 2 }),
      det('Leé este comentario en redes y marcá lo equivocado.', [ // e8
        ['Los cartoneros recuperan buena parte del material reciclable del país.', false],
        ['Separar en casa es inútil: los cartoneros revuelven todo igual.', true, 'Si el material ya viene separado, no tienen que revolver: es más limpio, seguro y valioso.'],
        ['Muchos se organizaron en cooperativas.', false],
        ['Es un trabajo sin ningún riesgo.', true, 'Hay riesgos de cortes, pinchazos e infecciones, sobre todo con bolsas mezcladas.'],
      ], 'Reconocer el trabajo de los recicladores es también cambiar cómo armamos la bolsa.', { d: 3 }),
      rank('Ordená estas bolsas de la más valiosa a la menos valiosa para un centro verde.', [ // e9
        ['Cartón seco y aplastado', 'se vende directo'],
        ['Botellas plásticas enjuagadas', 'se venden tras clasificar'],
        ['Reciclables secos mezclados entre sí', 'hay que clasificar todo'],
        ['Reciclables mezclados con restos de comida', 'casi todo se pierde'],
      ], 'Cuanto mejor separado y más limpio, más material se recupera y mejor se paga ese trabajo.', { d: 3, extremos: ['Más valiosa', 'Menos valiosa'] }),
      comp('Completá.', 'Los recicladores urbanos llevan el material a centros [verdes], donde se clasifica y se [enfarda] para venderlo a la [industria].', ['rojos', 'entierra', 'municipalidad'], 'El recorrido del material separado, en una línea.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: qué pasa con lo que tirás', 'Qué es un residuo, composición, destino, costos y recuperadores, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: la semana de la familia Sosa', 'La familia Sosa pesó su basura durante una semana. Con los números, encontrá qué hacer primero. Aprobalo para hacer crecer la rama.', [
      teoria('Los datos de los Sosa', [
        'Los Sosa son 4 y viven en un municipio que manda todo a un relleno sanitario. Durante una semana pesaron su basura: 30 kilos en total.',
        'Separaron por tipo: 15 kg de restos de comida y yerba, 5 kg de papel y cartón, 4 kg de plásticos, 2 kg de vidrio, 1 kg de metales y 3 kg de pañales y otros. En su barrio pasan recicladores dos veces por semana y hay un punto verde a diez cuadras.',
      ]),
      num('¿Cuántos kilos por persona por día generaron los Sosa?', 1.07, 'kg', '30 kg ÷ 4 personas ÷ 7 días ≈ 1,07 kg por persona por día: muy cerca del promedio argentino.', { ctx: '30 kg en una semana, 4 personas.', dec: 2, tol: 0.02, d: 2 }),
      num('¿Qué porcentaje de su basura son orgánicos?', 50, '%', '15 ÷ 30 × 100 = 50 %. La mitad de la bolsa podría compostarse.', { ctx: '15 kg de orgánicos sobre 30 kg totales.', d: 2 }),
      num('¿Cuántos kilos por semana son reciclables secos (papel y cartón, plásticos, vidrio y metales)?', 12, 'kg', '5 + 4 + 2 + 1 = 12 kg. El 40 % de su basura podría ir a los recicladores o al punto verde.', { ctx: 'Papel y cartón 5 kg, plásticos 4, vidrio 2, metales 1.', d: 2 }),
      numv(3, (i) => { // e4
        const comp = [100, 80, 60][i];
        const rec = [100, 75, 50][i];
        const q = 30 - (15 * comp) / 100 - (12 * rec) / 100;
        return {
          enunciado: `Si los Sosa compostan el ${comp} % de sus orgánicos (15 kg) y separan el ${rec} % de sus reciclables secos (12 kg), ¿cuántos kilos por semana seguirían yendo al relleno?`,
          valor: q,
          unidad: 'kg',
          dec: 1,
          explicacion: `Compostan ${((15 * comp) / 100).toLocaleString('es-AR')} kg y separan ${((12 * rec) / 100).toLocaleString('es-AR')} kg: 30 − ${((15 * comp) / 100).toLocaleString('es-AR')} − ${((12 * rec) / 100).toLocaleString('es-AR')} = ${q.toLocaleString('es-AR')} kg al relleno por semana.`,
        };
      }, { d: 3 }),
      rank('Ordená las acciones posibles de los Sosa por cuántos kilos sacarían del relleno por semana, de más a menos.', [ // e5
        ['Compostar los orgánicos', 'hasta 15 kg'],
        ['Separar papel y cartón', 'hasta 5 kg'],
        ['Separar plásticos', 'hasta 4 kg'],
        ['Separar vidrio', 'hasta 2 kg'],
        ['Separar metales', 'hasta 1 kg'],
      ], 'El compostaje es el cambio más grande por peso. Separar los secos suma casi lo mismo entre todos.', { d: 3 }),
      op('Los Sosa no tienen patio. ¿Qué pueden hacer con los orgánicos?', [ // e6
        'Buscar una compostera de balcón o un compostaje comunitario',
        'Tirarlos por el inodoro para que no ocupen lugar',
        ['Nada: sin patio no hay forma de compostar', 'Hay composteras chicas para interiores y programas de compostaje barrial.'],
        'Mezclarlos con el cartón para que pesen menos',
      ], 'Sin patio también se puede: vermicompostaje en balcón o llevar los orgánicos a un punto de compostaje comunitario.', { d: 3 }),
      det('Los Sosa escriben su plan en la heladera. Marcá lo que no conviene.', [ // e7
        ['Separamos cartón, plástico, vidrio y metal limpios y secos.', false],
        ['Guardamos los restos de comida junto con el cartón hasta que pasen los recicladores.', true, 'Los orgánicos ensucian el cartón y lo vuelven irrecuperable.'],
        ['Probamos una compostera de balcón para los orgánicos.', false],
        ['El vidrio roto va suelto en la bolsa de reciclables.', true, 'Hay que envolverlo y marcarlo: es un riesgo para quien lo manipula.'],
      ], 'Un buen plan separa bien, piensa en quien recibe la bolsa y ataca primero lo más pesado.', { d: 3 }),
    ]),
  ],
});
