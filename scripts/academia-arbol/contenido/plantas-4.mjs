import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// PLANTAS 4 — La huerta.
// Del saber al hacer con plantas: elegir el lugar, cuidar el suelo, sembrar
// y trasplantar, asociar y rotar cultivos, y cosechar, guardar semillas y
// compartir. Retoma cómo vive una planta (plantas-1), el compost
// (residuos-3), el suelo vivo (aire-suelo-2) y la agroecología
// (alimentacion-4).

export default unidad({
  slug: 'plantas-4',
  rama: 'plantas',
  orden: 4,
  nivel: 2,
  requiereTronco: 2,
  titulo: 'La huerta',
  bajada: 'Un cantero, unas macetas o un rincón del patio alcanzan para empezar. Cómo elegir el lugar, cuidar el suelo, sembrar, asociar cultivos y guardar tus propias semillas.',
  objetivos: [
    'Elegir y preparar un lugar para la huerta',
    'Mantener un suelo vivo con compost y cobertura',
    'Sembrar, trasplantar y regar según cada cultivo',
    'Planificar asociaciones y rotaciones por familias de plantas',
    'Cosechar, guardar semillas e intercambiarlas',
  ],
  repasa: ['plantas-1', 'residuos-3', 'aire-suelo-2', 'alimentacion-4'],
  fuentes: ['inta', 'fao-agroecologia', 'fao-suelos', 'ipbes-polinizadores'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Empezar una huerta', 'Sol, agua y suelo: cómo elegir el lugar y qué hacer si no tenés patio.', [
      teoria('Lo que necesita una huerta', [
        'La mayoría de las hortalizas necesita al menos unas 6 horas de sol directo por día, agua cerca para regar y un suelo suelto y rico en materia orgánica. Por eso, antes de sembrar, conviene observar el lugar durante un día: dónde da el sol, desde qué hora y hasta cuándo.',
        'Algunas hojas, como la lechuga o la acelga, toleran algo de media sombra; los frutos, como el tomate o el zapallo, necesitan mucho sol.',
      ], { destacado: { valor: '≈ 6 horas', texto: 'de sol directo por día necesitan la mayoría de las hortalizas.' } }),
      clas('¿Qué cultivo conviene para cada lugar?', { // e1
        'Pleno sol (6 horas o más)': ['Tomate', 'Zapallo', 'Pimiento'],
        'Media sombra (3 a 5 horas)': ['Lechuga', 'Acelga', 'Perejil'],
      }, 'Los frutos necesitan mucha energía del sol; las hojas se arreglan con menos.', { d: 2 }),
      op('Tenés un patio donde el sol da solo dos horas por la mañana. ¿Qué conviene cultivar?', [ // e2
        'Aromáticas de sombra y algunas hojas',
        'Tomates y zapallos grandes de verano',
        ['Sandías y melones para el verano', 'Necesitan muchísimo sol y calor.'],
        'Choclos para una cosecha grande',
      ], 'Con poco sol, conviene apostar a cultivos que lo toleran. Y buscar otro rincón más soleado para los frutos.', { d: 2 }),
      teoria('Sin patio', [
        'Sin patio también se puede: en macetas, cajones o bolsas de cultivo en balcones y terrazas soleadas. Las macetas tienen que tener buen drenaje y tamaño suficiente: un tomate necesita un recipiente grande, de al menos 20 a 30 litros; las aromáticas y las lechugas se arreglan con menos.',
        'Los canteros elevados son una buena opción cuando el suelo es malo o está contaminado: se rellenan con tierra buena y compost, y son más cómodos para trabajar.',
      ]),
      par('Uní cada cultivo con un recipiente adecuado.', [ // e3
        ['Tomate', 'Maceta grande de 20 a 30 litros o más'],
        ['Lechuga', 'Jardinera ancha y poco profunda'],
        ['Albahaca', 'Maceta chica o mediana'],
        ['Zapallo', 'Cantero amplio en el suelo'],
      ], 'Cada cultivo tiene su espacio. Una maceta chica limita a una planta grande.', { d: 2 }),
      vf('Cualquier maceta chica alcanza para un tomate, porque es una sola planta.', false, 'El tomate desarrolla muchas raíces y necesita mucha agua y nutrientes: en una maceta chica crece poco y da pocos frutos.', { // e4
        razones: ['+Porque necesita mucho espacio para raíces, agua y nutrientes', '-Porque los tomates no tienen raíces', '-Porque las macetas grandes enferman a los tomates'],
        d: 2,
      }),
      cad('Armá la cadena de cómo elegir el lugar de la huerta.', [ // e5
        'Observar durante un día dónde da el sol',
        'Elegir el lugar con más horas de sol directo',
        'Verificar que haya agua cerca para regar',
        'Revisar el suelo o preparar un cantero',
        'Decidir qué cultivar según el sol disponible',
      ], ['Sembrar primero y ver dónde da el sol después'], 'Observar antes de hacer: el método de la ciencia aplicado a la huerta.', { d: 1 }),
      mult('¿Qué necesita una huerta para funcionar bien? Marcá todo.', [ // e6
        '+Horas de sol directo',
        '+Agua cerca para regar',
        '+Suelo suelto y con materia orgánica',
        '+Buen drenaje',
        '-Sombra total todo el día',
      ], 'Sol, agua, suelo y drenaje: las cuatro bases.', { d: 1 }),
      numv(3, (i) => { // e7
        const ini = [9, 10, 8][i];
        const fin = [15, 17, 12][i];
        return {
          enunciado: `En un rincón del patio, el sol directo llega a las ${ini} y se va a las ${fin}. ¿Cuántas horas de sol directo recibe? ¿Alcanza para tomates?`,
          valor: fin - ini,
          unidad: 'horas',
          explicacion: `${fin} − ${ini} = ${fin - ini} horas. ${fin - ini >= 6 ? 'Alcanza para tomates y otros frutos.' : 'No alcanza para frutos exigentes: mejor hojas y aromáticas.'}`,
        };
      }, { d: 1 }),
      rank('Ordená estos cultivos por cuánto sol necesitan, de más a menos.', [ // e8
        ['Sandía', 'mucho sol y calor'],
        ['Tomate', 'pleno sol'],
        ['Lechuga', 'tolera media sombra'],
        ['Menta', 'se arregla con poca luz'],
      ], 'Saber cuánto sol pide cada cultivo evita frustraciones.', { d: 2, extremos: ['Más sol', 'Menos sol'] }),
      det('Leé estos consejos para empezar y marcá los equivocados.', [ // e9
        ['Observá dónde da el sol antes de armar la huerta.', false],
        ['Los tomates crecen igual de bien en un rincón sin sol.', true, 'Necesitan unas 6 horas de sol directo o más.'],
        ['Si el suelo es malo, podés hacer un cantero elevado.', false],
        ['Las macetas no necesitan agujeros si regás poco.', true, 'Sin drenaje, el agua se acumula y las raíces se ahogan.'],
      ], 'Empezar bien evita la mayoría de los problemas.', { d: 1 }),
      comp('Completá.', 'La mayoría de las hortalizas necesita unas [6] horas de sol; las macetas necesitan buen [drenaje]; y si el suelo es malo conviene un cantero [elevado].', ['2', 'color', 'hundido'], 'Tres bases para empezar una huerta en cualquier lugar.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('El suelo de la huerta', 'Compost, cobertura y no dar vuelta la tierra: cómo tener un suelo vivo y fértil.', [
      teoria('Alimentar el suelo, no la planta', [
        'En la huerta agroecológica se dice que hay que alimentar al suelo, no a la planta. Un suelo con materia orgánica y vida retiene agua, tiene nutrientes disponibles y sostiene raíces sanas, como viste en la rama de Aire y Suelo. La forma más simple de lograrlo es sumar compost cada temporada.',
      ]),
      cad('Armá la cadena de cómo el compost mejora la huerta.', [ // e1
        'Se agrega compost a la superficie del cantero',
        'Las lombrices y microbios lo incorporan al suelo',
        'Aumenta la materia orgánica',
        'El suelo retiene más agua y nutrientes',
        'Las plantas crecen más sanas',
      ], ['El compost reemplaza la necesidad de sol'], 'El compost de tu casa cierra el ciclo: de la cocina al suelo y del suelo a la cocina.', { d: 1 }),
      teoria('Cobertura: el suelo nunca desnudo', [
        'Cubrir el suelo con una capa de hojas secas, paja o pasto seco —el mulch o acolchado— protege de la erosión, conserva la humedad, reduce las malezas, modera la temperatura y alimenta a la vida del suelo a medida que se descompone.',
        'Un suelo desnudo, en cambio, se seca rápido, se endurece y pierde vida.',
      ]),
      mult('¿Qué beneficios tiene cubrir el suelo con mulch? Marcá todos.', [ // e2
        '+Conserva la humedad',
        '+Reduce las malezas',
        '+Protege de la erosión',
        '+Alimenta la vida del suelo',
        '-Evita que llegue el sol a las hojas',
      ], 'La cobertura cubre el suelo, no las plantas.', { d: 1 }),
      numv(3, (i) => { // e3
        const l = [20, 30, 15][i];
        const pct = [40, 50, 30][i];
        return {
          enunciado: `Un cantero necesita ${l} litros de riego por día sin cobertura. Si el mulch reduce la evaporación y el riego necesario un ${pct} %, ¿cuántos litros por día hacen falta con mulch?`,
          valor: l * (1 - pct / 100),
          unidad: 'litros',
          dec: 1,
          explicacion: `${l} × ${(1 - pct / 100).toLocaleString('es-AR')} = ${(l * (1 - pct / 100)).toLocaleString('es-AR')} litros por día. Menos agua y menos trabajo con una capa de hojas secas.`,
        };
      }, { d: 2 }),
      teoria('No dar vuelta la tierra', [
        'Dar vuelta la tierra con pala todos los años rompe la estructura del suelo, entierra la capa fértil de arriba y destruye las redes de hongos y las galerías de lombrices. En la huerta agroecológica se prefiere aflojar con una horquilla sin dar vuelta, y agregar compost por arriba.',
      ]),
      vf('Dar vuelta toda la tierra con pala cada año es la mejor forma de preparar la huerta.', false, 'Rompe la estructura del suelo y la vida que hay en él. Es mejor aflojar sin dar vuelta y sumar compost por arriba.', { // e4
        razones: ['+Porque rompe la estructura y la vida del suelo', '-Porque la pala agrega nutrientes', '-Porque el suelo necesita estar desnudo'],
        d: 2,
      }),
      par('Uní cada práctica con su efecto sobre el suelo.', [ // e5
        ['Agregar compost', 'Suma materia orgánica y vida'],
        ['Cubrir con mulch', 'Conserva humedad y protege'],
        ['Aflojar con horquilla', 'Airea sin romper la estructura'],
        ['Dejar el suelo desnudo', 'Se seca, se endurece y pierde vida'],
      ], 'Cada práctica suma o resta vida al suelo.', { d: 2 }),
      op('En verano el cantero se seca cada día y aparecen muchas malezas. ¿Qué conviene hacer primero?', [ // e6
        'Cubrir el suelo con una capa de mulch',
        'Regar tres veces por día',
        ['Dar vuelta toda la tierra con pala', 'Rompe el suelo y trae más semillas de malezas a la superficie.'],
        'Dejar el suelo desnudo al sol para que se endurezca',
      ], 'El mulch resuelve las dos cosas a la vez: conserva humedad y frena malezas.', { d: 1 }),
      clas('¿Esta práctica cuida el suelo o lo daña?', { // e7
        'Lo cuida': ['Compost cada temporada', 'Cobertura de hojas secas', 'Rotar cultivos'],
        'Lo daña': ['Pisar los canteros', 'Dejar el suelo desnudo', 'Quemar los restos de la cosecha'],
      }, 'Un suelo vivo se construye con años de buenas prácticas.', { d: 1 }),
      rank('Ordená estas coberturas por cuánto tardan en descomponerse, de más rápido a más lento.', [ // e8
        ['Pasto recién cortado seco', 'semanas'],
        ['Hojas secas', 'meses'],
        ['Paja', 'varios meses'],
        ['Chips de madera', 'uno o dos años'],
      ], 'Las coberturas que duran más protegen más tiempo; las que se descomponen rápido alimentan más rápido.', { d: 2, extremos: ['Más rápido', 'Más lento'] }),
      det('Leé este consejo y marcá lo equivocado.', [ // e9
        ['Agregá compost al cantero cada temporada.', false],
        ['Quemá los restos de la cosecha para limpiar el cantero.', true, 'Se pierde materia orgánica: mejor compostarlos o dejarlos como cobertura.'],
        ['Cubrí el suelo con hojas secas.', false],
        ['Si ves lombrices, sacalas porque comen las raíces.', true, 'Las lombrices mejoran el suelo; no comen raíces sanas.'],
      ], 'Cuidar el suelo es la base de cualquier huerta.', { d: 2 }),
      comp('Completá.', 'En la huerta conviene alimentar al [suelo]; cubrirlo con [mulch] conserva la humedad; y es mejor [aflojar] la tierra que darla vuelta.', ['sol', 'plástico', 'quemar'], 'Tres ideas para un suelo vivo en la huerta.', { d: 1 }),
      est('Estimá cuántos centímetros de espesor conviene que tenga la capa de mulch de hojas secas en un cantero.', 7, { min: 1, max: 30, paso: 1, unidad: 'cm' }, 'Unos 5 a 10 cm: suficiente para conservar humedad y frenar malezas sin asfixiar el suelo.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Sembrar y trasplantar', 'Semillas, almácigos, profundidad, calendario y riego: cómo arrancar cada cultivo.', [
      teoria('Siembra directa o almácigo', [
        'Algunos cultivos se siembran directamente en el lugar definitivo, como la zanahoria, el rabanito, la arveja o el zapallo. Otros conviene sembrarlos primero en almácigos —bandejas o macetitas— y trasplantarlos cuando tienen algunas hojas, como el tomate, la lechuga o el morrón.',
        'La regla general para la profundidad: enterrar la semilla dos o tres veces su tamaño. Las semillas muy chicas, como las de lechuga, van casi en superficie.',
      ]),
      clas('¿Siembra directa o almácigo y trasplante?', { // e1
        'Siembra directa': ['Zanahoria', 'Rabanito', 'Arveja'],
        'Almácigo y trasplante': ['Tomate', 'Lechuga', 'Morrón'],
      }, 'Las raíces que no toleran moverse, como la zanahoria, van directo. Las que se trasplantan bien, a almácigo.', { d: 2 }),
      numv(3, (i) => { // e2
        const mm = [5, 10, 3][i];
        return {
          enunciado: `Una semilla mide ${mm} mm. Si se entierra a unas 2 a 3 veces su tamaño, ¿cuál es la profundidad máxima recomendada, en mm?`,
          valor: mm * 3,
          unidad: 'mm',
          explicacion: `${mm} × 3 = ${mm * 3} mm como máximo. Enterrarla demasiado le hace gastar su reserva antes de llegar a la luz.`,
        };
      }, { d: 1 }),
      vf('Cuanto más profundo se entierra una semilla, mejor germina.', false, 'Si queda muy profunda, gasta su reserva de alimento antes de llegar a la luz y puede no emerger. La regla es dos o tres veces su tamaño.', { // e3
        razones: ['+Porque puede gastar su reserva antes de llegar a la luz', '-Porque las semillas necesitan oscuridad total para crecer', '-Porque la profundidad no importa'],
        d: 2,
      }),
      teoria('El calendario', [
        'Cada cultivo tiene su época de siembra según la temperatura y la región. En la región pampeana, por ejemplo, el tomate, el zapallo y el choclo se siembran en primavera, cuando pasan las heladas; las habas, las arvejas, la acelga y la lechuga de invierno se siembran a fines del verano y en otoño. Los calendarios de siembra regionales, como los del INTA, ayudan a planificar.',
      ]),
      par('Uní cada cultivo con su época típica de siembra en la región pampeana.', [ // e4
        ['Tomate', 'Primavera, después de las heladas'],
        ['Habas', 'Otoño'],
        ['Zapallo', 'Primavera'],
        ['Acelga de invierno', 'Fines del verano y otoño'],
      ], 'Sembrar en la época justa es la mitad del éxito.', { d: 2 }),
      teoria('Trasplantar y regar', [
        'Al trasplantar conviene hacerlo a la tarde o en un día nublado, regar bien antes y después, y cuidar el pan de tierra para no romper las raíces. Los primeros días la planta puede decaer: es normal mientras se adapta.',
        'En general, conviene regar temprano o al atardecer, en la base de la planta y no sobre las hojas, y hacerlo profundo y menos seguido en lugar de poquito todos los días, para que las raíces crezcan hacia abajo.',
      ]),
      ord('Ordená los pasos para trasplantar un plantín de tomate.', [ // e5
        'Regar el almácigo un rato antes',
        'Hacer un hoyo en el cantero, a la tarde',
        'Sacar el plantín con su pan de tierra',
        'Colocarlo en el hoyo y cubrir con tierra',
        'Regar bien la base',
      ], 'Cuidar las raíces y evitar el sol fuerte ayuda a que el plantín se adapte.', { d: 1, extremos: ['Primero', 'Último'] }),
      op('¿Cuál es la mejor forma de regar la huerta en verano?', [ // e6
        'Profundo, en la base y temprano o al atardecer',
        'Un poquito cada hora, sobre las hojas, al mediodía',
        ['Solo cuando las plantas estén completamente marchitas', 'Esperar a que se marchiten las estresa y baja la cosecha.'],
        'Inundar el cantero una vez por mes',
      ], 'Riego profundo y en la base: raíces más hondas y menos hongos en las hojas.', { d: 2 }),
      cad('Armá la cadena de por qué conviene regar profundo y menos seguido.', [ // e7
        'Se riega bien y profundo cada dos o tres días',
        'El agua llega a las capas más bajas del suelo',
        'Las raíces crecen hacia abajo buscándola',
        'La planta resiste mejor los días de calor',
      ], ['Las raíces dejan de necesitar agua'], 'Un riego superficial y diario acostumbra a las raíces a quedarse arriba, donde el suelo se seca rápido.', { d: 2 }),
      mult('¿Qué ayuda a que un trasplante salga bien? Marcá todo.', [ // e8
        '+Hacerlo a la tarde o en un día nublado',
        '+Regar antes y después',
        '+Cuidar el pan de tierra',
        '+Proteger del sol fuerte los primeros días',
        '-Sacudir las raíces para quitarles toda la tierra',
      ], 'Menos estrés para las raíces, mejor arranque.', { d: 1 }),
      det('Leé este calendario casero y marcá lo equivocado.', [ // e9
        ['Tomates: sembrar en almácigo a fines del invierno y trasplantar en primavera.', false],
        ['Zapallo: sembrar en pleno invierno, con heladas.', true, 'El zapallo es sensible al frío: se siembra en primavera.'],
        ['Habas: sembrar en otoño.', false],
        ['Zanahoria: sembrar en almácigo y trasplantar.', true, 'La zanahoria se siembra directo: su raíz no tolera el trasplante.'],
      ], 'Cada cultivo tiene su forma de siembra y su época.', { d: 2 }),
      comp('Completá.', 'Una semilla se entierra a dos o tres veces su [tamaño]; los tomates se siembran en [almácigo]; y conviene regar en la [base] de la planta.', ['peso', 'maceta de vidrio', 'hoja'], 'Tres reglas prácticas para sembrar y regar bien.', { d: 1 }),
      est('Estimá cuántos días suele tardar en germinar una semilla de lechuga con buena temperatura y humedad.', 7, { min: 1, max: 60, paso: 1, unidad: 'días' }, 'Entre unos 4 y 10 días. Otras semillas, como el perejil, pueden tardar varias semanas.', { d: 3 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Asociar y rotar', 'Familias de plantas, cultivos que se ayudan, flores y aromáticas, y por qué no repetir lo mismo en el mismo lugar.', [
      teoria('Familias de hortalizas', [
        'Las hortalizas se agrupan en familias botánicas con necesidades y plagas parecidas. Las solanáceas: tomate, papa, morrón, berenjena. Las crucíferas: repollo, brócoli, coliflor, rúcula, rabanito. Las leguminosas: arveja, haba, poroto. Las cucurbitáceas: zapallo, zapallito, pepino, melón. Las liliáceas o aliáceas: cebolla, ajo, puerro.',
      ]),
      clas('¿A qué familia pertenece cada hortaliza?', { // e1
        'Solanáceas': ['Tomate', 'Berenjena'],
        'Crucíferas': ['Brócoli', 'Rúcula'],
        'Leguminosas': ['Arveja', 'Haba'],
        'Cucurbitáceas': ['Zapallo', 'Pepino'],
      }, 'Conocer las familias es la base para rotar bien.', { d: 2 }),
      teoria('Rotar', [
        'Rotar es no plantar la misma familia en el mismo lugar temporada tras temporada. Así se cortan los ciclos de plagas y enfermedades que atacan a esa familia y se equilibra el uso de nutrientes. Una rotación simple: después de una leguminosa (que deja nitrógeno) va una planta exigente de hojas o frutos; después, raíces; y después, otra vez leguminosas.',
      ]),
      cad('Armá la cadena de por qué rotar corta plagas.', [ // e2
        'Una plaga de la papa pasa el invierno en el suelo',
        'En primavera, en ese lugar hay arvejas y no papas',
        'La plaga no encuentra a su planta',
        'Su población baja',
        'Al volver las papas años después, hay menos plaga',
      ], ['Las arvejas atraen a la plaga de la papa'], 'La rotación es el control de plagas más barato que existe.', { d: 2 }),
      vf('Plantar tomates en el mismo lugar todos los años aumenta el riesgo de enfermedades del tomate.', true, 'Las plagas y enfermedades de las solanáceas se acumulan en ese suelo. Rotar familias reduce el riesgo.', { // e3
        razones: ['+Porque se acumulan plagas y enfermedades de esa familia', '-Porque los tomates agotan el sol del lugar', '-Porque la rotación no tiene efectos'],
        d: 2,
      }),
      teoria('Asociaciones que se ayudan', [
        'Algunas plantas se benefician creciendo juntas: la milpa de maíz, poroto y zapallo; la albahaca junto al tomate, que atrae polinizadores; la lechuga entre cultivos más altos que le dan algo de sombra; las cebollas y ajos intercalados, cuyo aroma confunde a algunas plagas. También ayudan las flores, como caléndulas y copetes, que atraen insectos benéficos.',
      ]),
      par('Uní cada asociación con su beneficio.', [ // e4
        ['Maíz, poroto y zapallo', 'El maíz sostiene, el poroto aporta nitrógeno, el zapallo cubre'],
        ['Tomate y albahaca', 'La albahaca atrae polinizadores'],
        ['Lechuga entre plantas altas', 'Recibe algo de sombra en verano'],
        ['Flores en los bordes', 'Atraen insectos benéficos'],
      ], 'La diversidad en la huerta trabaja como un equipo.', { d: 2 }),
      numv(3, (i) => { // e5
        const can = [4, 3, 5][i];
        return {
          enunciado: `Una huerta tiene ${can} canteros y rota ${can} grupos de cultivos, pasando cada grupo al cantero siguiente cada temporada. ¿Cuántas temporadas pasan hasta que un grupo vuelve al mismo cantero?`,
          valor: can,
          unidad: 'temporadas',
          explicacion: `Con ${can} canteros y ${can} grupos, cada grupo vuelve a su cantero después de ${can} temporadas. Más grupos en la rotación, más tiempo sin repetir.`,
        };
      }, { d: 2 }),
      ord('Ordená una rotación simple en un cantero, empezando por las leguminosas.', [ // e6
        'Leguminosas, como arvejas o habas',
        'Hojas exigentes, como acelga o repollo',
        'Frutos, como tomate o zapallo',
        'Raíces, como zanahoria o remolacha',
      ], 'Las leguminosas dejan nitrógeno para las exigentes; las raíces cierran el ciclo antes de volver a empezar.', { d: 3, extremos: ['Primero', 'Último'] }),
      mult('¿Qué aporta la diversidad a la huerta? Marcá todo.', [ // e7
        '+Menos plagas por familia',
        '+Más polinizadores',
        '+Mejor uso del espacio y del suelo',
        '+Cosecha más variada',
        '-Más necesidad de plaguicidas',
      ], 'Una huerta diversa es más estable y más productiva.', { d: 1 }),
      op('En un cantero hubo papas el año pasado. ¿Qué conviene plantar este año?', [ // e8
        'Arvejas o habas',
        'Tomates de otra variedad',
        ['Berenjenas, que son distintas', 'Son de la misma familia que la papa: conviene cambiar de familia.'],
        'Más papas para aprovechar el suelo',
      ], 'Tomate, berenjena y papa son solanáceas: después de papas conviene otra familia, como las leguminosas.', { d: 2 }),
      det('Leé este plan de huerta y marcá lo equivocado.', [ // e9
        ['Este año pongo arvejas donde hubo tomates.', false],
        ['Pongo tomates donde hubo papas, porque son distintos.', true, 'Son de la misma familia: las solanáceas.'],
        ['Siembro caléndulas en los bordes.', false],
        ['Planto toda la huerta de lechuga para que sea más fácil.', true, 'Un monocultivo concentra plagas y reduce la diversidad.'],
      ], 'Rotar por familias y diversificar: dos reglas de oro.', { d: 2 }),
      comp('Completá.', 'No repetir la misma familia en el mismo lugar es [rotar]; el tomate y la papa son [solanáceas]; y las [leguminosas] dejan nitrógeno en el suelo.', ['podar', 'crucíferas', 'aromáticas'], 'Las reglas de asociar y rotar, en una línea.', { d: 2 }),
      rank('Ordená estas huertas de menor a mayor diversidad.', [ // e11
        ['Un solo cantero de lechuga', 'mínima'],
        ['Dos cultivos de la misma familia', 'baja'],
        ['Cuatro familias rotando', 'media'],
        ['Cuatro familias, aromáticas y flores en los bordes', 'alta'],
      ], 'Más diversidad, más estabilidad y menos plagas.', { d: 1, extremos: ['Menor', 'Mayor'] }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Cosechar, guardar semillas y compartir', 'Cuándo cosechar, cómo guardar semillas propias y por qué los intercambios cuidan la diversidad.', [
      teoria('Cosechar en su punto', [
        'Cada cultivo tiene su punto de cosecha: las hojas se cosechan de a poco, sacando las externas para que la planta siga produciendo; los frutos, cuando alcanzan su color; las raíces, cuando llegan al tamaño esperado. Cosechar seguido estimula a muchas plantas, como el zapallito o las chauchas, a seguir dando.',
      ]),
      op('¿Cómo conviene cosechar la acelga para que siga produciendo?', [ // e1
        'Sacando las hojas externas de a poco',
        'Arrancando la planta entera',
        ['Cortando todas las hojas al ras de una sola vez', 'La planta se debilita; mejor cosechar las externas y dejar crecer el centro.'],
        'Esperando a que florezca',
      ], 'Cosechar de afuera hacia adentro permite comer acelga durante meses.', { d: 1 }),
      teoria('Guardar semillas', [
        'Muchas semillas se pueden guardar de una temporada a otra: se dejan madurar algunos frutos o plantas hasta el final, se sacan las semillas, se secan bien a la sombra y se guardan en frascos o sobres en un lugar fresco y seco, con el nombre y la fecha.',
        'Las variedades de polinización abierta dan hijos parecidos a los padres; las semillas de híbridos comerciales, en cambio, suelen dar plantas distintas y menos predecibles. Por eso conviene guardar semillas de variedades de polinización abierta.',
      ]),
      ord('Ordená los pasos para guardar semillas de tomate.', [ // e2
        'Elegir los mejores frutos de plantas sanas',
        'Dejarlos madurar bien',
        'Sacar las semillas y lavarlas',
        'Secarlas a la sombra',
        'Guardarlas en un frasco rotulado en un lugar fresco y seco',
      ], 'Elegir lo mejor, secar bien y rotular: así se guarda una semilla.', { d: 2, extremos: ['Primero', 'Último'] }),
      vf('Las semillas de un tomate híbrido comercial dan siempre plantas iguales a la planta madre.', false, 'Las semillas de híbridos suelen dar plantas distintas y poco predecibles. Para guardar semilla conviene usar variedades de polinización abierta.', { // e3
        razones: ['+Porque los híbridos no mantienen sus características en la descendencia', '-Porque los híbridos no tienen semillas', '-Porque todas las semillas son iguales'],
        d: 3,
      }),
      teoria('Intercambiar y cuidar la diversidad', [
        'Las ferias de intercambio de semillas y las casas de semillas comunitarias permiten que circulen variedades locales, adaptadas a cada región y a sus gustos. Esa diversidad es un tesoro: variedades de maíz, poroto, zapallo o papa que las comunidades seleccionaron durante generaciones, y que pueden ser clave frente a nuevas plagas o climas.',
        'En Argentina, programas públicos y organizaciones distribuyen semillas y acompañan huertas familiares, escolares y comunitarias desde hace décadas.',
      ]),
      mult('¿Por qué es valioso intercambiar semillas locales? Marcá todo.', [ // e4
        '+Mantienen variedades adaptadas a la región',
        '+Conservan diversidad genética',
        '+Fortalecen el vínculo entre quienes cultivan',
        '+Reducen la dependencia de comprar semillas cada año',
        '-Hacen que todas las huertas tengan la misma variedad',
      ], 'La diversidad de semillas es un seguro, como viste en la rama de Animales con la diversidad genética.', { d: 2 }),
      par('Uní cada concepto con su definición.', [ // e5
        ['Polinización abierta', 'Variedad cuyas semillas dan plantas parecidas a los padres'],
        ['Híbrido comercial', 'Cruza cuyas semillas dan plantas poco predecibles'],
        ['Casa de semillas', 'Espacio comunitario para guardar e intercambiar semillas'],
        ['Variedad local', 'Semilla seleccionada durante años en una región'],
      ], 'Cuatro conceptos para entender el mundo de las semillas.', { d: 2 }),
      numv(3, (i) => { // e6
        const f = [3, 5, 2][i];
        const s = [150, 120, 200][i];
        return {
          enunciado: `De cada tomate maduro se sacan unas ${s} semillas. Si guardás semillas de ${f} tomates, ¿cuántas semillas obtenés?`,
          valor: f * s,
          unidad: 'semillas',
          explicacion: `${f} × ${s} = ${(f * s).toLocaleString('es-AR')} semillas: muchas más de las que necesita una huerta familiar. El resto se puede intercambiar.`,
        };
      }, { d: 1 }),
      cad('Armá la cadena de cómo una variedad local se conserva.', [ // e7
        'Una familia cultiva un zapallo local desde hace años',
        'Guarda las semillas de los mejores frutos',
        'Las lleva a una feria de intercambio',
        'Otras familias las cultivan y también las guardan',
        'La variedad sigue viva y se adapta',
      ], ['La variedad se conserva sola sin que nadie la siembre'], 'Las variedades locales se conservan usándolas. Una semilla guardada en un cajón para siempre se pierde.', { d: 2 }),
      clas('¿Esta práctica ayuda a conservar la diversidad de semillas?', { // e8
        'Ayuda': ['Guardar semillas de variedades locales', 'Participar de ferias de intercambio', 'Rotular las semillas con nombre y fecha'],
        'No ayuda': ['Guardar semillas húmedas en una bolsa cerrada', 'Plantar siempre una sola variedad comprada', 'Tirar las semillas de los mejores frutos'],
      }, 'Guardar bien, rotular y compartir mantienen viva la diversidad.', { d: 1 }),
      det('Leé este consejo de una feria y marcá lo equivocado.', [ // e9
        ['Guardá las semillas bien secas, en frascos rotulados.', false],
        ['Guardá las semillas húmedas para que no se sequen.', true, 'Húmedas se pudren o germinan antes de tiempo.'],
        ['Elegí semillas de plantas sanas y fuertes.', false],
        ['Las semillas de híbridos comerciales son las mejores para guardar.', true, 'Conviene guardar variedades de polinización abierta.'],
      ], 'Guardar semillas es fácil si se respetan algunas reglas.', { d: 2 }),
      comp('Completá.', 'Para guardar semillas conviene usar variedades de polinización [abierta]; hay que secarlas bien y guardarlas [rotuladas]; y las ferias de [intercambio] cuidan la diversidad.', ['cerrada', 'húmedas', 'venta'], 'Tres ideas para guardar y compartir semillas.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: la huerta', 'Lugar, suelo, siembra, asociaciones y semillas, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: la huerta de la escuela', 'Una escuela de la región pampeana arma su huerta en marzo. Con los datos, planificá los canteros y el año.', [
      teoria('La escuela', [
        'La escuela tiene un patio donde un sector recibe sol de 9 a 17 en verano y otro solo hasta las 12. Hay una canilla cerca. El suelo del patio está compactado y lleno de escombros. Quieren armar 4 canteros elevados de 1 × 3 metros y empezar en marzo.',
        'La cocina del comedor genera restos de verduras, y en otoño caen muchas hojas de los árboles.',
      ]),
      num('¿Cuántas horas de sol recibe en verano el sector más soleado?', 8, 'horas', 'De 9 a 17 son 8 horas: suficiente para frutos como el tomate en primavera y verano.', { ctx: 'Sol de 9 a 17 en el sector más soleado.', d: 1 }),
      num('¿Cuántos metros cuadrados de cultivo suman los 4 canteros de 1 × 3 m?', 12, 'm²', '4 × (1 × 3) = 12 m² de canteros: espacio para varias familias de cultivos.', { ctx: '4 canteros de 1 × 3 metros.', d: 1 }),
      op('Como el suelo está compactado y con escombros, ¿qué conviene?', [ // e3
        'Canteros elevados con tierra y compost',
        'Sembrar directo sobre el suelo compactado',
        ['Esperar a que el suelo se arregle solo', 'Un suelo con escombros no se recupera solo en poco tiempo.'],
        'Sembrar en el sector sin sol',
      ], 'El cantero elevado resuelve el problema del suelo desde el primer día.', { d: 2 }),
      clas('¿Qué conviene sembrar en marzo en la región pampeana?', { // e4
        'Conviene en marzo': ['Habas', 'Arvejas', 'Acelga', 'Lechuga de invierno'],
        'Conviene esperar a la primavera': ['Tomate', 'Zapallo'],
      }, 'Marzo es tiempo de cultivos de otoño-invierno. Los de verano esperan a que pasen las heladas.', { d: 3 }),
      mult('¿Qué recursos de la escuela sirven para la huerta? Marcá todos.', [ // e5
        '+Restos de verduras del comedor para compostar',
        '+Hojas secas de otoño para cobertura',
        '+La canilla cercana',
        '+El sector con sol de 9 a 17',
        '-Los escombros del patio como relleno de los canteros',
      ], 'La escuela ya tiene casi todo: compost, cobertura, agua y sol.', { d: 2 }),
      ord('Ordená el plan de la huerta escolar.', [ // e6
        'Armar una compostera con los restos del comedor',
        'Construir los canteros elevados en el sector soleado',
        'Rellenarlos con tierra y compost',
        'Sembrar habas, arvejas y hojas de otoño',
        'Cubrir con hojas secas y organizar turnos de riego',
      ], 'Suelo primero, siembra de estación y cuidado compartido.', { d: 3, extremos: ['Primero', 'Último'] }),
      det('La escuela escribe su plan. Marcá lo que no conviene.', [ // e7
        ['Los canteros van en el sector con sol de 9 a 17.', false],
        ['En marzo sembraremos tomates y zapallos para cosechar en invierno.', true, 'Son cultivos de verano: se siembran en primavera, después de las heladas.'],
        ['Usaremos las hojas del otoño como cobertura.', false],
        ['Rellenaremos los canteros con los escombros del patio.', true, 'Hace falta tierra buena y compost: los escombros no sirven.'],
      ], 'Un buen plan combina lugar, estación, suelo y cuidado.', { d: 3 }),
    ]),
  ],
});
