import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// AIRE Y SUELO 2 — El suelo vivo.
// Qué es el suelo, quiénes viven en él, cuánto carbono y agua guarda, cómo
// se pierde y cómo se cuida. Retoma lo que se renueva y lo que no
// (tronco-1) y la materia que da vueltas.

export default unidad({
  slug: 'aire-suelo-2',
  rama: 'aire_suelo',
  orden: 2,
  nivel: 1,
  requiereTronco: 1,
  titulo: 'El suelo vivo',
  bajada: 'Un centímetro de suelo puede tardar siglos en formarse y perderse en una tormenta. Qué es, quién vive ahí y por qué casi toda tu comida depende de él.',
  objetivos: [
    'Describir los componentes y las capas de un suelo',
    'Reconocer los organismos del suelo y sus funciones',
    'Explicar el papel de la materia orgánica en el agua y el carbono del suelo',
    'Identificar los procesos de degradación del suelo y sus causas',
    'Proponer prácticas para conservar y recuperar suelos',
  ],
  repasa: ['tronco-1', 'plantas-1'],
  fuentes: ['fao-suelos', 'fao-suelos-degradacion', 'anthony-2023-suelo', 'inta', 'ipbes-global'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Qué es el suelo', 'Minerales, materia orgánica, agua y aire: la capa fina que cubre la tierra y cómo se forma.', [
      teoria('Mucho más que tierra', [
        'El suelo es la capa superficial de la tierra donde crecen las plantas. No es solo "tierra": es una mezcla de partículas minerales (arena, limo y arcilla), materia orgánica (restos de plantas y animales en descomposición), agua, aire y una cantidad enorme de seres vivos.',
        'En un suelo sano típico, alrededor de la mitad del volumen son partículas sólidas —casi todas minerales y una parte chica de materia orgánica— y la otra mitad son poros, ocupados por agua y aire.',
      ], {
        datos: barras('Composición de un suelo sano típico', '% del volumen', [
          ['Minerales', 45],
          ['Agua', 25],
          ['Aire', 25],
          ['Materia orgánica', 5],
        ], 'Valores de referencia de manual; cambian mucho entre suelos y según la humedad.'),
      }),
      rank('Según ese ejemplo, ordená los componentes del suelo por su volumen, de más a menos.', [ // e1
        ['Minerales', '≈ 45 %'],
        ['Agua', '≈ 25 %'],
        ['Aire', '≈ 25 %'],
        ['Materia orgánica', '≈ 5 %'],
      ], 'La materia orgánica es la parte más chica, pero, como vas a ver, una de las más importantes.', { d: 2 }),
      teoria('Arena, limo y arcilla', [
        'Las partículas minerales tienen distintos tamaños: la arena es la más gruesa (se siente áspera), el limo es intermedio (se siente como talco) y la arcilla es la más fina (se siente pegajosa cuando está mojada). La proporción de cada una es la textura del suelo.',
        'Los suelos arenosos dejan pasar el agua rápido y se secan pronto; los arcillosos retienen mucha agua pero pueden encharcarse. Los suelos francos, con una mezcla equilibrada, suelen ser los mejores para cultivar.',
      ]),
      par('Uní cada tipo de partícula con su característica.', [ // e2
        ['Arena', 'Gruesa y áspera; el agua pasa rápido'],
        ['Limo', 'Intermedia; se siente como talco'],
        ['Arcilla', 'Muy fina y pegajosa; retiene mucha agua'],
      ], 'La textura explica por qué algunos suelos se secan en horas y otros se encharcan por días.', { d: 2 }),
      clas('¿Qué suelo describe mejor cada situación?', { // e3
        'Arenoso': ['Se seca pocas horas después de regar', 'Se siente áspero entre los dedos'],
        'Arcilloso': ['Queda encharcado días después de la lluvia', 'Se pega a las botas cuando está mojado'],
      }, 'Conocer la textura ayuda a decidir cuánto y cada cuánto regar.', { d: 2 }),
      teoria('Las capas', [
        'Si se cava un pozo profundo, se ven capas horizontales llamadas horizontes. Arriba suele haber una capa de restos orgánicos; debajo, la capa superficial (horizonte A), oscura y fértil, donde están casi todas las raíces y la vida; más abajo, el subsuelo (horizonte B), más claro, donde se acumulan arcillas; y después el material del que se formó el suelo y la roca.',
        'La capa superficial es la más valiosa y la más fácil de perder.',
      ]),
      ord('Ordená las capas de un suelo, de arriba hacia abajo.', [ // e4
        'Restos orgánicos (hojas, ramitas)',
        'Capa superficial oscura y fértil (horizonte A)',
        'Subsuelo más claro (horizonte B)',
        'Material de origen meteorizado (horizonte C)',
        'Roca',
      ], 'La vida y la fertilidad se concentran arriba. Por eso la erosión, que se lleva la capa superficial, es tan grave.', { d: 2, extremos: ['Arriba', 'Abajo'] }),
      teoria('Un recurso que tarda siglos', [
        'El suelo se forma muy lentamente: la roca se rompe por el agua, el hielo, las raíces y los seres vivos, y se mezcla con materia orgánica. Según la FAO, formar un centímetro de suelo puede llevar hasta mil años.',
        'Por eso, a escala de una vida humana, el suelo es prácticamente un recurso no renovable: lo que se pierde en una tormenta o en años de mal manejo no vuelve en generaciones.',
      ], { destacado: { valor: 'Hasta 1.000 años', texto: 'puede llevar formar un centímetro de suelo, según la FAO.' } }),
      numv(3, (i) => { // e5
        const cm = [5, 10, 2][i];
        const anos = [500, 300, 1000][i];
        return {
          enunciado: `Si formar un centímetro de suelo lleva ${anos} años, ¿cuántos años tardarían en formarse los ${cm} cm que se perdieron por erosión en un campo?`,
          valor: cm * anos,
          unidad: 'años',
          explicacion: `${cm} × ${anos} = ${(cm * anos).toLocaleString('es-AR')} años. Lo que se pierde en pocos años de erosión tarda milenios en volver.`,
        };
      }, { d: 2 }),
      vf('El suelo es un recurso renovable que se recupera en pocos años.', false, 'Formar suelo lleva siglos o milenios. En la escala de una vida humana, el suelo perdido prácticamente no vuelve: por eso se lo considera casi no renovable.', { // e6
        razones: ['+Porque formar un centímetro puede llevar cientos de años', '-Porque el suelo se fabrica en las fábricas de fertilizantes', '-Porque la lluvia trae suelo nuevo cada año'],
        d: 2,
      }),
      mult('¿Qué componentes forman un suelo sano? Marcá todos.', [ // e7
        '+Partículas minerales',
        '+Materia orgánica',
        '+Agua',
        '+Aire',
        '-Plástico triturado',
      ], 'Minerales, materia orgánica, agua, aire y, además, una enorme cantidad de seres vivos. El plástico es contaminación.', { d: 1 }),
      op('Querés saber si la tierra de tu cantero es arcillosa. ¿Qué prueba simple podés hacer?', [
        'Mojarla y ver si se pega y forma un rollito',
        'Olerla para ver si tiene olor a humedad',
        ['Pesarla seca en una balanza de cocina', 'El peso solo no dice la textura: la arcilla se reconoce porque es pegajosa y moldeable.'],
        'Mirar si tiene hojas secas arriba',
      ], 'La arcilla mojada es pegajosa y se puede estirar en un rollito; la arena se desarma; el limo se siente suave como talco.', { d: 2 }),
      vf('La capa superficial del suelo es la que concentra más raíces y más vida.', true, 'Es la capa con más materia orgánica, aire y alimento. Por eso perderla por erosión es tan grave.', {
        razones: ['+Porque tiene más materia orgánica, aire y alimento', '-Porque la roca de abajo tiene más nutrientes', '-Porque las raíces solo crecen en el subsuelo'],
        d: 1,
      }),
      det('Leé esta explicación y marcá lo equivocado.', [ // e8
        ['El suelo tiene minerales, materia orgánica, agua y aire.', false],
        ['El suelo es solo tierra muerta que sostiene las plantas.', true, 'Está lleno de vida y es un sistema complejo.'],
        ['La capa superficial es la más fértil.', false],
        ['Un centímetro de suelo se forma en un par de años.', true, 'Puede llevar cientos o hasta mil años.'],
      ], 'El suelo está vivo y es lento. Dos ideas que cambian cómo se lo trata.', { d: 2 }),
      comp('Completá.', 'La proporción de arena, limo y arcilla es la [textura] del suelo; la capa más fértil es la [superficial]; y formar un centímetro puede llevar hasta [mil] años.', ['temperatura', 'profunda', 'diez'], 'Tres ideas básicas sobre qué es el suelo.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('La vida bajo tus pies', 'Bacterias, hongos, lombrices y bichos bolita: el suelo es uno de los lugares con más vida del planeta.', [
      teoria('Una multitud invisible', [
        'Un puñado de suelo sano tiene más seres vivos que personas hay en la Tierra: bacterias, hongos, protozoos, nematodos, ácaros, colémbolos, lombrices, larvas de insectos y muchos más. Un estudio de 2023 estimó que más de la mitad de todas las especies del planeta vive en el suelo.',
        'Casi todos son invisibles a simple vista, pero hacen trabajos esenciales: descomponen restos, reciclan nutrientes, forman la estructura del suelo y ayudan a las plantas.',
      ], { destacado: { valor: 'Más de la mitad', texto: 'de las especies del planeta viviría en el suelo, según un estudio publicado en 2023.' } }),
      est('Estimá qué porcentaje de las especies del planeta vive en el suelo, según un estudio de 2023.', 59, { min: 0, max: 100, paso: 1, unidad: '%' }, 'Alrededor del 59 %. El suelo sería el hábitat más rico en especies de la Tierra, aunque casi no lo miremos.', { d: 3 }),
      teoria('Quién hace qué', [
        'Las bacterias y los hongos descomponen la materia orgánica y liberan nutrientes que las plantas pueden absorber. Los hongos micorrícicos, que viste en la unidad de plantas, se asocian con las raíces. Las lombrices comen restos y tierra, cavan túneles que dejan pasar el aire y el agua, y producen un abono muy rico.',
        'Los pequeños artrópodos, como los colémbolos y los ácaros, trituran restos y regulan a otros organismos. Todos juntos forman la red trófica del suelo.',
      ]),
      par('Uní cada organismo del suelo con su trabajo principal.', [ // e1
        ['Bacterias', 'Descomponer restos y liberar nutrientes'],
        ['Hongos micorrícicos', 'Ayudar a las raíces a tomar agua y nutrientes'],
        ['Lombrices', 'Cavar túneles y mezclar el suelo'],
        ['Colémbolos', 'Triturar restos orgánicos'],
      ], 'Un equipo invisible que mantiene funcionando el suelo.', { d: 2 }),
      cad('Armá la cadena de cómo una hoja caída se convierte en nutriente.', [ // e2
        'Una hoja cae al suelo',
        'Bichos pequeños la trituran',
        'Hongos y bacterias la descomponen',
        'Se liberan nutrientes en el suelo',
        'Una raíz los absorbe',
      ], ['La hoja se evapora y llueve como nutriente'], 'El ciclo de la materia del tronco, en un centímetro de suelo.', { d: 2 }),
      teoria('Las lombrices, ingenieras', [
        'Las lombrices de tierra son ingenieras del suelo: sus túneles mejoran la infiltración del agua y la aireación, y sus excrementos (el humus de lombriz) son ricos en nutrientes. Donde hay muchas lombrices, suele haber un suelo sano.',
        'Contar lombrices en una palada de tierra es una forma sencilla de evaluar la salud de un suelo, que usan productores y huerteros.',
      ]),
      vf('Encontrar muchas lombrices en una palada de tierra suele ser una buena señal.', true, 'Indican un suelo con materia orgánica, humedad y poca contaminación. Muchos productores las cuentan para evaluar la salud del suelo.', { // e3
        razones: ['+Porque indican materia orgánica, humedad y buena estructura', '-Porque las lombrices son una plaga de los cultivos', '-Porque las lombrices solo viven en suelos contaminados'],
        d: 2,
      }),
      numv(3, (i) => { // e4
        const l = [12, 3, 20][i];
        const pal = [4, 5, 5][i];
        return {
          enunciado: `En ${pal} paladas de tierra se contaron ${l * pal} lombrices en total. ¿Cuántas lombrices hay en promedio por palada?`,
          valor: l,
          unidad: 'lombrices',
          explicacion: `${l * pal} ÷ ${pal} = ${l} lombrices por palada. Muchas guías de campo consideran que más de 10 por palada es señal de un suelo con buena actividad biológica.`,
        };
      }, { d: 1 }),
      clas('¿Esta práctica favorece o perjudica la vida del suelo?', { // e5
        'Favorece': ['Agregar compost', 'Dejar restos vegetales como cobertura', 'Rotar cultivos'],
        'Perjudica': ['Quemar rastrojos', 'Dejar el suelo desnudo al sol', 'Aplicar exceso de agroquímicos'],
      }, 'La vida del suelo necesita alimento (materia orgánica), protección (cobertura) y que no la maten.', { d: 2 }),
      op('¿Por qué quemar los rastrojos de un cultivo perjudica al suelo?', [ // e6
        'Porque elimina materia orgánica y vida del suelo',
        'Porque el fuego agrega nutrientes que sobran',
        ['Porque el humo tapa el sol durante semanas', 'El humo contamina el aire, pero el daño al suelo es perder materia orgánica y organismos.'],
        'Porque las cenizas vuelven arenoso al suelo',
      ], 'La quema deja el suelo desnudo, sin alimento para su vida y expuesto a la erosión. Además, contamina el aire.', { d: 2 }),
      mult('¿Qué organismos forman parte de la vida del suelo? Marcá todos.', [ // e7
        '+Bacterias',
        '+Hongos',
        '+Lombrices',
        '+Bichos bolita',
        '-Palomas',
      ], 'Las palomas pueden comer en el suelo, pero no viven en él. Los otros son parte de su red.', { d: 1 }),
      det('Leé este comentario de un huertero y marcá lo equivocado.', [ // e8
        ['Encontré muchas lombrices: buena señal.', false],
        ['Voy a fumigar el suelo para matar todos los bichos y que crezca mejor.', true, 'La mayoría de los organismos del suelo son beneficiosos: matarlos empobrece el suelo.'],
        ['Agrego compost para alimentar la vida del suelo.', false],
        ['Los hongos del suelo son siempre enfermedades.', true, 'Muchos hongos descomponen restos o ayudan a las raíces.'],
      ], 'El suelo sano es un suelo con mucha vida. Casi toda trabaja a favor.', { d: 2 }),
      comp('Completá.', 'Las [lombrices] cavan túneles que dejan pasar agua y aire; las bacterias y los [hongos] descomponen restos y liberan [nutrientes].', ['hormigas', 'virus', 'plásticos'], 'La red de vida del suelo, en una sola línea.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Una esponja de carbono y agua', 'La materia orgánica: por qué un suelo oscuro guarda más agua, más nutrientes y más carbono.', [
      teoria('La materia orgánica', [
        'La materia orgánica del suelo son los restos de plantas, animales y microbios en distintas etapas de descomposición. La parte más estable se llama humus y le da al suelo su color oscuro.',
        'Aunque sea una parte chica del volumen, cumple muchas funciones: alimenta la vida del suelo, guarda nutrientes, pega las partículas en grumos que dejan pasar el aire y el agua, y retiene agua como una esponja.',
      ]),
      mult('¿Qué hace la materia orgánica en el suelo? Marcá todo lo correcto.', [ // e1
        '+Retiene agua',
        '+Guarda nutrientes',
        '+Alimenta a los organismos del suelo',
        '+Forma grumos que mejoran la estructura',
        '-Impide que crezcan las raíces',
      ], 'Poca en cantidad, pero enorme en las funciones que cumple.', { d: 1 }),
      teoria('Una esponja', [
        'Un suelo con buena materia orgánica absorbe la lluvia en vez de dejarla escurrir, y la guarda para las plantas durante los días secos. Por eso los suelos con más materia orgánica resisten mejor las sequías y reducen las inundaciones, como viste en la rama de Agua con los humedales.',
      ]),
      cad('Armá la cadena de por qué un suelo con más materia orgánica resiste mejor una sequía.', [ // e2
        'El suelo tiene mucha materia orgánica',
        'Forma grumos y poros que absorben la lluvia',
        'Guarda más agua después de cada lluvia',
        'Las plantas tienen agua disponible más días',
        'El cultivo sufre menos la sequía',
      ], ['La materia orgánica produce lluvia'], 'Cuidar la materia orgánica es una forma de adaptarse al cambio climático.', { d: 2 }),
      teoria('El mayor depósito de carbono de la tierra firme', [
        'La materia orgánica está hecha en buena parte de carbono, que las plantas tomaron del aire con la fotosíntesis. Los suelos del mundo guardan, en su primer metro, alrededor de 1.500 gigatoneladas de carbono: más que toda la atmósfera y más que toda la vegetación.',
        'Cuando un suelo se degrada, se ara intensamente o se quema, parte de ese carbono vuelve al aire como CO₂. Cuando se maneja bien, puede recuperar materia orgánica y guardar carbono.',
      ], {
        datos: barras('Dónde está el carbono (aproximado)', 'gigatoneladas de carbono', [
          ['Suelos (primer metro)', 1500],
          ['Atmósfera', 875],
          ['Vegetación', 450],
        ], 'Órdenes de magnitud aproximados de la literatura científica.'),
      }),
      rank('Ordená estos depósitos de carbono de mayor a menor (aproximado).', [ // e3
        ['Suelos (primer metro)', '≈ 1.500 Gt C'],
        ['Atmósfera', '≈ 875 Gt C'],
        ['Vegetación de todo el planeta', '≈ 450 Gt C'],
      ], 'El suelo guarda más carbono que el aire y las plantas. Perderlo tiene un efecto directo sobre el clima.', { d: 2 }),
      vf('El suelo guarda más carbono que toda la vegetación del planeta.', true, 'En su primer metro guarda alrededor de 1.500 gigatoneladas, contra unas 450 de la vegetación. Por eso cuidar la materia orgánica del suelo es también cuidar el clima.', { // e4
        razones: ['+Porque su materia orgánica acumula muchísimo carbono', '-Porque los suelos están hechos de carbón mineral', '-Porque las plantas no tienen carbono'],
        d: 2,
      }),
      numv(3, (i) => { // e5
        const ha = [100, 500, 1000][i];
        const t = [2, 1, 3][i];
        return {
          enunciado: `Un campo de ${ha.toLocaleString('es-AR')} hectáreas pierde ${t} toneladas de carbono del suelo por hectárea por mal manejo. ¿Cuántas toneladas de carbono pierde en total?`,
          valor: ha * t,
          unidad: 'toneladas de carbono',
          explicacion: `${ha.toLocaleString('es-AR')} × ${t} = ${(ha * t).toLocaleString('es-AR')} t de carbono, que vuelven al aire como CO₂. Cada tonelada de carbono equivale a unas 3,7 t de CO₂.`,
        };
      }, { d: 2 }),
      ejemplo('De carbono a CO₂', 'Un suelo pierde 10 toneladas de carbono. ¿Cuánto CO₂ es? El CO₂ pesa unas 3,67 veces más que el carbono solo, porque suma dos oxígenos.', [
        'Carbono perdido: 10 t.',
        'CO₂: 10 × 3,67 ≈ 36,7 t.',
      ], 'Casi 37 toneladas de CO₂ salen de 10 de carbono. Es la misma razón por la que un litro de nafta produce más de 2 kg de CO₂.'),
      numv(3, (i) => { // e6
        const c = [10, 5, 20][i];
        return {
          enunciado: `Un suelo pierde ${c} toneladas de carbono. Si cada tonelada de carbono forma unas 3,67 t de CO₂, ¿cuántas toneladas de CO₂ son? Redondeá a un decimal.`,
          valor: Math.round(c * 3.67 * 10) / 10,
          unidad: 't de CO₂',
          dec: 1,
          tol: 0.2,
          explicacion: `${c} × 3,67 ≈ ${(Math.round(c * 3.67 * 10) / 10).toLocaleString('es-AR')} t de CO₂. El carbono toma oxígeno del aire al convertirse en CO₂.`,
        };
      }, { d: 3 }),
      est('Estimá cuántas gigatoneladas de carbono guardan los suelos del mundo en su primer metro.', 1500, { min: 10, max: 100000, unidad: 'Gt C', escala: 'log' }, 'Alrededor de 1.500 gigatoneladas: más que la atmósfera (unas 875) y que toda la vegetación (unas 450).', { d: 3 }),
      op('¿Por qué un suelo oscuro suele ser más fértil que uno claro de la misma zona?', [
        'Porque tiene más materia orgánica',
        'Porque absorbe más luz del sol y se calienta',
        ['Porque tiene más arena gruesa', 'La arena no oscurece el suelo; el color oscuro viene del humus.'],
        'Porque tiene menos agua y menos aire',
      ], 'El color oscuro del horizonte superficial es la marca del humus: nutrientes, agua y vida.', { d: 2 }),
      clas('¿Esta práctica aumenta o reduce la materia orgánica del suelo?', { // e7
        'La aumenta': ['Agregar compost', 'Mantener el suelo cubierto con plantas', 'Pasturas bien manejadas'],
        'La reduce': ['Arar muy seguido', 'Quemar rastrojos', 'Dejar el suelo desnudo muchos meses'],
      }, 'La materia orgánica entra con los restos de plantas y el compost, y se pierde con la labranza intensa, el fuego y el suelo desnudo.', { d: 2 }),
      det('Leé esta nota y marcá lo equivocado.', [ // e8
        ['La materia orgánica le da al suelo su color oscuro.', false],
        ['La materia orgánica no tiene relación con el agua del suelo.', true, 'Retiene agua como una esponja y mejora la infiltración.'],
        ['Los suelos guardan más carbono que la atmósfera.', false],
        ['Quemar rastrojos aumenta el carbono del suelo.', true, 'Lo devuelve al aire como CO₂ y deja el suelo sin cobertura.'],
      ], 'Materia orgánica: agua, nutrientes, vida y clima en un solo ingrediente.', { d: 2 }),
      comp('Completá.', 'La parte más estable de la materia orgánica se llama [humus]; un suelo con más materia orgánica retiene más [agua] y guarda más [carbono].', ['arcilla', 'arena', 'oxígeno'], 'Las tres funciones clave de la materia orgánica, resumidas.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Cuando el suelo se pierde', 'Erosión por agua y viento, compactación, salinización y cemento: cómo se degrada el suelo.', [
      teoria('Un problema mundial', [
        'Según la FAO, alrededor de un tercio de los suelos del mundo está moderada o altamente degradado. Las causas principales son la erosión, la pérdida de materia orgánica, la compactación, la salinización, la contaminación y el sellado bajo construcciones.',
        'En Argentina, la erosión hídrica y eólica afecta a decenas de millones de hectáreas, según estimaciones del INTA.',
      ], { destacado: { valor: '≈ 1/3', texto: 'de los suelos del mundo está moderada o altamente degradado, según la FAO.' } }),
      par('Uní cada forma de degradación con su causa típica.', [ // e1
        ['Erosión hídrica', 'Lluvia sobre suelo desnudo en pendiente'],
        ['Erosión eólica', 'Viento sobre suelo seco y sin cobertura'],
        ['Compactación', 'Maquinaria pesada o pisoteo excesivo'],
        ['Salinización', 'Riego con mal drenaje en zonas secas'],
      ], 'Cada forma de degradación tiene su causa y su solución.', { d: 2 }),
      teoria('Erosión por agua y viento', [
        'La erosión hídrica ocurre cuando la lluvia golpea un suelo desnudo, desarma los grumos y el agua que corre arrastra la capa superficial. En pendientes forma surcos y cárcavas.',
        'La erosión eólica ocurre cuando el viento levanta las partículas de un suelo seco y sin cobertura. En la década de 1930, sequías y un manejo inadecuado provocaron enormes voladuras de suelo en el oeste de la región pampeana, algo parecido a lo que ocurrió en Estados Unidos en la misma época.',
      ]),
      cad('Armá la cadena de cómo se forma una cárcava en un campo.', [ // e2
        'El suelo queda desnudo después de la cosecha',
        'Una lluvia fuerte golpea el suelo sin protección',
        'El agua corre por la pendiente arrastrando tierra',
        'Se forman surcos que se agrandan con cada lluvia',
        'Aparece una cárcava que corta el campo',
      ], ['La cárcava se rellena sola en la próxima lluvia'], 'Todo empieza con el suelo desnudo. La cobertura corta la cadena en el primer eslabón.', { d: 2 }),
      clas('¿Es erosión hídrica o eólica?', { // e3
        'Hídrica (agua)': ['Surcos en una ladera después de una tormenta', 'Agua marrón que sale de un campo arado', 'Cárcavas en un camino rural'],
        'Eólica (viento)': ['Nubes de polvo en un día ventoso y seco', 'Médanos que avanzan sobre un campo', 'Alambrados tapados por tierra acumulada'],
      }, 'Agua en pendientes y lluvias fuertes; viento en zonas secas y planas sin cobertura.', { d: 2 }),
      vf('La erosión solo es un problema en las montañas.', false, 'También ocurre en llanuras: la erosión eólica en zonas secas y planas, y la hídrica en lomas y pendientes suaves de la región pampeana.', { // e4
        razones: ['+Porque también afecta llanuras, con agua y con viento', '-Porque en las llanuras no llueve', '-Porque el viento no puede mover tierra'],
        d: 2,
      }),
      teoria('Otras amenazas', [
        'La compactación ocurre cuando maquinaria pesada o el pisoteo aplastan el suelo y cierran sus poros: el agua no infiltra y las raíces no penetran. La salinización se da cuando se acumulan sales, muchas veces por riego con mal drenaje en zonas secas. La contaminación con químicos, hidrocarburos o metales envenena la vida del suelo.',
        'Y el sellado: cada vez que se construye o se pavimenta, el suelo queda bajo el cemento y deja de cumplir sus funciones. En las ciudades, gran parte del suelo está sellado.',
      ]),
      mult('¿Cuáles de estas son formas de degradación del suelo? Marcá todas.', [ // e5
        '+Compactación por maquinaria pesada',
        '+Salinización por riego mal drenado',
        '+Sellado bajo pavimento',
        '+Contaminación con hidrocarburos',
        '-Cobertura con restos de cosecha',
      ], 'La cobertura es justamente una de las mejores formas de proteger el suelo.', { d: 2 }),
      numv(3, (i) => { // e6
        const tha = [10, 20, 5][i];
        const ha = [100, 50, 200][i];
        return {
          enunciado: `Un campo de ${ha} hectáreas pierde ${tha} toneladas de suelo por hectárea por año por erosión. ¿Cuántas toneladas pierde en total por año?`,
          valor: tha * ha,
          unidad: 'toneladas',
          explicacion: `${tha} × ${ha} = ${(tha * ha).toLocaleString('es-AR')} toneladas de suelo por año: decenas o cientos de camiones de la capa más fértil que se van con la lluvia o el viento.`,
        };
      }, { d: 2 }),
      op('En un campo con pendiente suave, ¿cuándo es mayor el riesgo de erosión hídrica?', [ // e7
        'Con el suelo desnudo y una tormenta fuerte',
        'Con el cultivo en pleno crecimiento y lluvia suave',
        ['Con el suelo cubierto de rastrojos y sequía', 'Sin lluvia no hay erosión hídrica; y los rastrojos protegen.'],
        'Con pasturas densas en otoño',
      ], 'Suelo desnudo más lluvia intensa: la combinación más peligrosa.', { d: 2 }),
      rank('Ordená estas situaciones por riesgo de erosión, de mayor a menor.', [ // e8
        ['Suelo arado y desnudo en pendiente, con tormenta', 'muy alto'],
        ['Suelo desnudo en llano, con lluvia moderada', 'alto'],
        ['Suelo con rastrojos en pendiente', 'bajo'],
        ['Pastizal denso en llano', 'muy bajo'],
      ], 'Cobertura y pendiente son las dos variables más importantes.', { d: 3 }),
      det('Leé esta nota y marcá lo equivocado.', [ // e9
        ['Un tercio de los suelos del mundo está degradado.', false],
        ['La erosión solo se lleva la tierra de abajo, que no sirve.', true, 'Se lleva la capa superficial, la más fértil y con más vida.'],
        ['La compactación impide que el agua infiltre.', false],
        ['Pavimentar no afecta al suelo porque queda debajo.', true, 'El suelo sellado deja de infiltrar agua y de sostener vida.'],
      ], 'Perder suelo es perder la capa más valiosa, y no vuelve pronto.', { d: 2 }),
      comp('Completá.', 'La erosión [hídrica] la causa el agua y la [eólica] el viento; las dos empiezan casi siempre con el suelo [desnudo].', ['térmica', 'química', 'mojado'], 'La clave para prevenir la erosión, en una línea.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Cuidar el suelo', 'Cobertura, siembra directa, rotaciones, compost y más verde en la ciudad: cómo conservar y recuperar suelos.', [
      teoria('Los principios', [
        'Las prácticas que conservan el suelo se resumen en pocos principios: mantenerlo cubierto (con plantas vivas o restos), moverlo lo menos posible, mantener raíces vivas la mayor parte del año, diversificar los cultivos y devolverle materia orgánica.',
        'Estos principios son la base de la agricultura de conservación y de la agricultura regenerativa, y se aplican tanto en un campo de mil hectáreas como en una huerta.',
      ], { lista: ['Suelo siempre cubierto', 'Mínimo movimiento', 'Raíces vivas todo el año', 'Diversidad de cultivos', 'Devolver materia orgánica'] }),
      mult('¿Cuáles de estos son principios de conservación del suelo? Marcá todos.', [ // e1
        '+Mantener el suelo cubierto',
        '+Moverlo lo menos posible',
        '+Mantener raíces vivas la mayor parte del año',
        '+Diversificar los cultivos',
        '-Dejarlo desnudo para que "descanse"',
      ], 'Un suelo desnudo no descansa: se erosiona y pierde vida.', { d: 1 }),
      teoria('Siembra directa y cultivos de cobertura', [
        'En la siembra directa, se siembra sin arar, sobre los restos del cultivo anterior, que quedan como una cobertura protectora. Argentina es uno de los países con mayor adopción de la siembra directa del mundo: se usa en la gran mayoría de la superficie agrícola.',
        'Los cultivos de cobertura (o de servicio) se siembran entre dos cultivos de cosecha, no para vender, sino para cubrir el suelo, sumar raíces y materia orgánica y, si son legumbres, aportar nitrógeno.',
      ]),
      par('Uní cada práctica con su beneficio principal.', [ // e2
        ['Siembra directa', 'Menos movimiento del suelo y cobertura con rastrojos'],
        ['Cultivo de cobertura', 'Raíces vivas y suelo protegido entre cosechas'],
        ['Rotación de cultivos', 'Diversidad que corta plagas y equilibra nutrientes'],
        ['Compost', 'Devolver materia orgánica al suelo'],
      ], 'Cuatro herramientas que funcionan mejor combinadas entre sí.', { d: 2 }),
      vf('La siembra directa, por sí sola, resuelve todos los problemas del suelo.', false, 'Protege mucho contra la erosión, pero si no se rota y se aporta poca materia orgánica, el suelo igual se degrada. Funciona mejor combinada con rotaciones y cultivos de cobertura.', { // e3
        razones: ['+Porque necesita rotaciones y aportes de materia orgánica', '-Porque la siembra directa aumenta la erosión', '-Porque la siembra directa no se usa en Argentina'],
        d: 3,
      }),
      teoria('Rotar y diversificar', [
        'Sembrar siempre el mismo cultivo en el mismo lugar (monocultivo) agota ciertos nutrientes y favorece plagas y enfermedades de ese cultivo. Rotar —por ejemplo, alternar maíz, soja y trigo, o incluir pasturas— equilibra el suelo, corta los ciclos de las plagas y suma distintos tipos de raíces.',
        'Las rotaciones con gramíneas como el maíz o el trigo aportan mucho rastrojo; las legumbres aportan nitrógeno.',
      ]),
      cad('Armá la cadena de por qué el monocultivo de soja puede empobrecer el suelo.', [ // e4
        'Se siembra soja año tras año en el mismo lote',
        'La soja deja poco rastrojo',
        'Entra poca materia orgánica al suelo',
        'La materia orgánica baja con los años',
        'El suelo retiene menos agua y es más vulnerable a la erosión',
      ], ['La soja deja tanto rastrojo que el suelo se tapa'], 'Por eso se recomienda rotar la soja con gramíneas y cultivos de cobertura.', { d: 3 }),
      teoria('En la ciudad y en casa', [
        'En las ciudades también se puede cuidar el suelo: compostar los restos orgánicos y devolverlos a canteros y huertas, cubrir la tierra con mulch, evitar pisar y compactar los canteros, y reemplazar superficies selladas por superficies absorbentes cuando se puede.',
        'Una huerta en casa, con compost y cobertura, puede tener un suelo más vivo en pocos años.',
      ]),
      clas('¿Esta acción en la ciudad cuida o daña el suelo?', { // e5
        'Lo cuida': ['Cubrir los canteros con hojas secas', 'Agregar compost a la huerta', 'Reemplazar un patio de cemento por pasto y plantas'],
        'Lo daña': ['Estacionar autos sobre el cantero', 'Tirar aceite usado en la tierra', 'Barrer y tirar todas las hojas del jardín a la basura'],
      }, 'Las hojas secas son alimento y abrigo para el suelo. Tirarlas es tirar materia orgánica.', { d: 2 }),
      numv(3, (i) => { // e6
        const kg = [15, 10, 20][i];
        const sem = 52;
        const rend = [30, 30, 25][i];
        return {
          enunciado: `Una familia composta ${kg} kg de restos orgánicos por semana. Si el compost final pesa el ${rend} % de lo que entra, ¿cuántos kilos de compost obtiene en un año de ${sem} semanas?`,
          valor: (kg * sem * rend) / 100,
          unidad: 'kg',
          dec: 1,
          explicacion: `${kg} × ${sem} × ${rend} ÷ 100 = ${((kg * sem * rend) / 100).toLocaleString('es-AR')} kg de compost por año: materia orgánica que vuelve al suelo en vez de ir al relleno.`,
        };
      }, { d: 2 }),
      op('¿Qué conviene hacer con las hojas secas que caen en el jardín en otoño?', [ // e7
        'Usarlas como cobertura o en el compost',
        'Quemarlas en una pila en la vereda',
        ['Tirarlas en bolsas con la basura común', 'Se pierde materia orgánica valiosa que termina en el relleno.'],
        'Barrerlas hacia la alcantarilla de la calle',
      ], 'Las hojas son el abono natural del suelo. Quemarlas contamina el aire; tirarlas al desagüe tapa alcantarillas.', { d: 1 }),
      ord('Ordená los pasos para recuperar un cantero compactado y pobre.', [ // e8
        'Aflojar la tierra sin darla vuelta',
        'Agregar una capa de compost',
        'Plantar especies con raíces variadas',
        'Cubrir con mulch de hojas',
        'Evitar pisarlo y observar la vida que aparece',
      ], 'Aflojar, alimentar, plantar, cubrir y proteger: los principios aplicados a un cantero.', { d: 2, extremos: ['Primero', 'Último'] }),
      det('Leé este plan de un productor y marcá lo que no conviene.', [ // e9
        ['Voy a sembrar un cultivo de cobertura en invierno.', false],
        ['Después de cosechar, quemo el rastrojo para limpiar el lote.', true, 'Se pierde materia orgánica y el suelo queda desnudo.'],
        ['Voy a rotar soja con maíz y trigo.', false],
        ['Voy a arar profundo todos los años para airear.', true, 'La labranza intensa acelera la pérdida de materia orgánica y la erosión.'],
      ], 'Cubrir, no mover, rotar y alimentar: el plan de cualquier suelo sano.', { d: 3 }),
      comp('Completá.', 'Para conservar el suelo hay que mantenerlo [cubierto], moverlo lo [menos] posible y [rotar] los cultivos.', ['desnudo', 'más', 'quemar'], 'Tres principios de la agricultura de conservación.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: el suelo vivo', 'Componentes, vida, materia orgánica, degradación y conservación, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el campo de los Benítez', 'Un campo del sudeste bonaerense muestra señales de un suelo que se agota. Hacé el diagnóstico y armá un plan.', [
      teoria('El campo', [
        'Los Benítez tienen 300 hectáreas con lomas suaves. Hace diez años siembran soja todos los años, sin cultivos de cobertura, y el suelo queda desnudo desde la cosecha hasta la siembra siguiente. Algunos años queman los restos.',
        'Un análisis mostró que la materia orgánica bajó del 5 % al 3,5 % en diez años. Después de cada tormenta se ven surcos en las lomas y agua marrón en los bajos. En una palada contaron 2 lombrices.',
      ]),
      num('¿En qué porcentaje bajó la materia orgánica del suelo respecto del valor inicial?', 30, '%', 'Bajó 5 − 3,5 = 1,5 puntos sobre 5: 1,5 ÷ 5 × 100 = 30 %. Casi un tercio de la materia orgánica en diez años.', { ctx: 'Materia orgánica: 5 % hace diez años, 3,5 % hoy.', d: 2 }),
      mult('¿Qué señales indican que el suelo de los Benítez se está degradando? Marcá todas.', [ // e2
        '+La materia orgánica bajó un 30 %',
        '+Surcos en las lomas después de las tormentas',
        '+Agua marrón en los bajos',
        '+Muy pocas lombrices por palada',
        '-Que el campo tenga lomas suaves',
      ], 'Las lomas son el relieve natural; las otras cuatro son síntomas de degradación.', { d: 2 }),
      cad('Armá la cadena que explica lo que le pasa al campo.', [ // e3
        'Monocultivo de soja con poco rastrojo y quemas',
        'Entra poca materia orgánica al suelo',
        'Baja la vida del suelo y se desarman los grumos',
        'El suelo absorbe menos agua de lluvia',
        'El agua corre por las lomas y se lleva la capa fértil',
      ], ['La soja atrae tormentas más fuertes'], 'Manejo, materia orgánica, estructura, agua y erosión: todos los eslabones de la unidad en un solo campo.', { d: 4 }),
      rank('Ordená las medidas del plan por prioridad, de la primera a la última.', [ // e4
        ['Dejar de quemar rastrojos', 'inmediata y gratis'],
        ['Sembrar cultivos de cobertura en invierno', 'protege el suelo desnudo'],
        ['Rotar la soja con maíz y trigo', 'suma rastrojo y diversidad'],
        ['Medir materia orgánica y lombrices cada año', 'verifica que funcione'],
      ], 'Primero se deja de dañar; después se protege y se alimenta; y se mide para saber si funciona.', { d: 3 }),
      numv(3, (i) => { // e5
        const tha = [15, 10, 20][i];
        return {
          enunciado: `Si las lomas de los Benítez (100 de las 300 hectáreas) pierden ${tha} toneladas de suelo por hectárea por año, ¿cuántas toneladas pierden por año?`,
          valor: tha * 100,
          unidad: 'toneladas',
          explicacion: `${tha} × 100 = ${(tha * 100).toLocaleString('es-AR')} toneladas de la capa más fértil por año. A ese ritmo, en pocas décadas se pierden centímetros que tardaron siglos en formarse.`,
        };
      }, { d: 2 }),
      op('Un vecino les dice que agreguen más fertilizante y listo. ¿Qué le responderías?', [ // e6
        'Que el fertilizante no repone materia orgánica ni frena la erosión',
        'Que tiene razón: con fertilizante el suelo se recupera solo',
        ['Que el fertilizante está prohibido en Argentina', 'No está prohibido; el punto es que no resuelve la causa del problema.'],
        'Que conviene arar más profundo para mezclar el fertilizante',
      ], 'Los fertilizantes aportan nutrientes, pero no reconstruyen la estructura ni la vida del suelo, ni lo protegen de la lluvia.', { d: 3 }),
      det('Los Benítez escriben su plan. Marcá lo que no conviene.', [ // e7
        ['Este año dejamos de quemar los rastrojos.', false],
        ['Vamos a arar todo para emparejar los surcos.', true, 'Arar deja el suelo más expuesto y acelera la pérdida de materia orgánica.'],
        ['Sembramos centeno como cultivo de cobertura en invierno.', false],
        ['Seguimos con soja todos los años porque es lo más rentable ahora.', true, 'El monocultivo sin rotación es parte de la causa del problema.'],
      ], 'Un plan de suelos piensa en décadas, no solo en la próxima cosecha.', { d: 4 }),
    ]),
  ],
});
