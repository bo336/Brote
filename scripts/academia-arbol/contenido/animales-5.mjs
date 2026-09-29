import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// ANIMALES 5 — Convivir con la fauna en el paisaje.
// Paisajes conectados, fauna atropellada en las rutas, predadores y ganado,
// herbívoros que compiten o que se aprovechan de forma sostenible, y
// herramientas para coexistir. Retoma la fragmentación y los corredores
// (animales-4), la recuperación de especies (animales-3), los perros sueltos
// (animales-2) y los conflictos ambientales (comunidad-4).

export default unidad({
  slug: 'animales-5',
  rama: 'animales',
  orden: 5,
  nivel: 3,
  requiereTronco: 3,
  titulo: 'Convivir con la fauna en el paisaje',
  bajada: 'Corredores, rutas que matan, pumas y ovejas, guanacos y vicuñas: cómo se diseñan paisajes donde la producción y la fauna puedan convivir.',
  objetivos: [
    'Diseñar corredores de fauna a escala de paisaje',
    'Analizar los atropellamientos de fauna y sus soluciones viales',
    'Comparar métodos letales y no letales para reducir la depredación de ganado',
    'Evaluar el uso sostenible de fauna silvestre, como el chaku de vicuñas',
    'Proponer acuerdos de coexistencia entre productores y conservación',
  ],
  repasa: ['animales-4', 'animales-3', 'animales-2', 'comunidad-4'],
  fuentes: ['apn-atropellamiento-iguazu', 'apn-pasafaunas-iguazu', 'inta-perros-protectores', 'conicet-vicunas', 'cites', 'ley-22421-fauna', 'rewilding-argentina', 'parques-nacionales'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Paisajes conectados', 'Áreas protegidas, corredores y "pasaderas": cómo se diseña un paisaje donde la fauna pueda moverse.', [
      teoria('Islas que no alcanzan', [
        'Las áreas protegidas son esenciales, pero muchas son demasiado chicas o están aisladas para sostener poblaciones sanas de especies que se mueven mucho, como el yaguareté, el puma o el tapir. Lo viste con la fragmentación: poblaciones aisladas pierden diversidad genética y pueden desaparecer. Por eso la conservación moderna piensa a escala de paisaje: áreas protegidas unidas por corredores y rodeadas de campos y bosques manejados de forma compatible con la fauna.',
      ]),
      cad('Armá la cadena de por qué un área protegida aislada puede perder especies.', [ // e1
        'El área queda rodeada de campos sin bosque',
        'Los animales no pueden entrar ni salir',
        'La población queda chica y aislada',
        'Aumentan las cruzas entre parientes',
        'La población se debilita y puede desaparecer',
      ], ['El aislamiento aumenta la diversidad genética'], 'Proteger una isla no alcanza si está rodeada de un mar hostil.', { d: 2 }),
      teoria('Corredores y pasaderas', [
        'Un corredor es una franja continua de hábitat que une dos áreas. Cuando no es posible un corredor continuo, se usan "pasaderas": parches de hábitat separados pero lo bastante cerca como para que los animales los usen como escalas. Los bordes de ríos y arroyos son corredores naturales: por eso conservar los bosques ribereños conecta paisajes enteros. En el Gran Chaco se proponen corredores para unir los últimos bosques donde vive el yaguareté.',
      ]),
      par('Uní cada elemento del paisaje con su función para la fauna.', [ // e2
        ['Área protegida núcleo', 'Refugio con poblaciones estables'],
        ['Corredor continuo', 'Paso seguro entre áreas'],
        ['Pasadera', 'Parche que sirve de escala'],
        ['Campo con manejo compatible', 'Zona que la fauna puede atravesar'],
      ], 'Un paisaje conectado combina protección estricta con usos compatibles.', { d: 2 }),
      teoria('¿Qué tan ancho?', [
        'No todos los corredores sirven a todas las especies. Un corredor angosto puede servir a aves o pequeños mamíferos, pero no a un yaguareté, que necesita cobertura amplia, poca presencia humana y presas. Además, un corredor muy angosto tiene mucho efecto borde: más luz, más perros, más cazadores. En general, cuanto más ancho y mejor conservado, más especies lo usan.',
      ]),
      numv(3, (i) => { // e3
        const [largo, ancho] = [[10, 500], [5, 1000], [20, 200]][i];
        return {
          enunciado: `Un corredor de bosque mide ${largo} km de largo y ${ancho} m de ancho. ¿Cuántas hectáreas ocupa? (1 ha = 10.000 m²)`,
          valor: (largo * 1000 * ancho) / 10000,
          unidad: 'hectáreas',
          explicacion: `${largo * 1000} m × ${ancho} m = ${(largo * 1000 * ancho).toLocaleString('es-AR')} m² = ${((largo * 1000 * ancho) / 10000).toLocaleString('es-AR')} ha. Una superficie chica comparada con lo que conecta.`,
          ctx: `${largo} km de largo; ${ancho} m de ancho.`,
        };
      }, { d: 2 }),
      op('¿Por qué un corredor muy angosto puede no servir para un yaguareté?', [ // e4
        'Tiene mucho borde, poca cobertura y más riesgos',
        'Porque los yaguaretés no caminan distancias largas',
        ['Porque los yaguaretés solo cruzan por rutas', 'Evitan rutas y zonas con gente; necesitan cobertura.'],
        'Porque los corredores solo sirven para aves',
      ], 'Cada especie necesita un corredor a su medida: los grandes carnívoros, los más amplios.', { d: 2 }),
      clas('¿Este elemento ayuda a conectar el paisaje o lo corta?', { // e5
        'Ayuda a conectar': ['Bosque ribereño conservado', 'Cortinas de árboles nativos entre lotes', 'Pasafauna bajo una ruta'],
        'Corta la conexión': ['Ruta sin pasos de fauna y con alta velocidad', 'Desmonte total entre dos bosques', 'Alambrado que atrapa animales'],
      }, 'Muchas decisiones productivas y viales pueden conectar o aislar.', { d: 1 }),
      vf('Si un área protegida es grande, no importa lo que pase alrededor.', false, 'Aun las áreas grandes pierden especies si quedan aisladas. Los animales salen, entran y necesitan conectarse con otras poblaciones.', { // e6
        razones: ['+Porque aun las grandes pierden especies si quedan aisladas', '-Porque los animales nunca salen de las áreas protegidas', '-Porque las áreas protegidas no tienen fauna'],
        d: 2,
      }),
      rank('Ordená estos corredores según cuántas especies de mamíferos grandes podrían usarlo, de más a menos.', [ // e7
        ['Bosque de 2 km de ancho, sin rutas ni perros', 'muchas'],
        ['Bosque ribereño de 300 m, con poco tránsito', 'bastantes'],
        ['Cortina de árboles de 20 m entre cultivos', 'pocas'],
        ['Fila de postes con alambrado', 'ninguna'],
      ], 'Ancho, calidad y tranquilidad definen quién puede usar un corredor.', { d: 2, extremos: ['Más especies', 'Menos especies'] }),
      mult('¿Qué hace más útil a un corredor? Marcá todo.', [ // e8
        '+Ser ancho',
        '+Tener vegetación nativa bien conservada',
        '+Tener poca presencia de perros y cazadores',
        '+Conectar áreas con poblaciones de fauna',
        '-Cruzar rutas sin pasos de fauna',
      ], 'Un corredor es útil si la fauna realmente puede y quiere usarlo.', { d: 1 }),
      op('¿Por qué los bosques junto a ríos y arroyos funcionan como corredores naturales?', [
        'Forman franjas continuas que cruzan paisajes enteros',
        'Porque la fauna solo toma agua de los ríos grandes',
        ['Porque en los ríos no vive ningún tipo de fauna', 'Son de los ambientes con más fauna; justamente por eso conectan.'],
        'Porque las leyes prohíben cruzar campos abiertos',
      ], 'Los ríos recorren largas distancias: conservar sus orillas conecta áreas lejanas a un costo bajo.', { d: 2 }),
      det('Leé este plan de ordenamiento rural y marcá lo que conviene corregir.', [ // e9
        ['Conservaremos los bosques junto a los arroyos como corredores.', false],
        ['El corredor tendrá 10 metros de ancho para no ocupar campo.', true, 'Es demasiado angosto para la mayoría de la fauna grande.'],
        ['Dejaremos parches de bosque cerca entre sí como pasaderas.', false],
        ['Las áreas protegidas se manejarán como islas, sin mirar el entorno.', true, 'Hay que pensar a escala de paisaje.'],
      ], 'Planificar a escala de paisaje es la clave de la conectividad.', { d: 2 }),
      comp('Completá.', 'Una franja continua que une áreas es un [corredor]; los parches separados que sirven de escala son [pasaderas]; y los bosques junto a ríos y arroyos son corredores [naturales].', ['alambrado', 'murallas', 'artificiales'], 'Tres ideas para diseñar paisajes conectados.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Rutas y fauna', 'Animales atropellados, velocidad, pasafaunas y ecoductos: cómo hacer rutas que no maten.', [
      teoria('Un problema que crece', [
        'Las rutas cortan hábitats y matan fauna. Según la Administración de Parques Nacionales, en las rutas del norte de Misiones mueren unos tres mil animales por año atropellados, cuando en la década de 1990 se estimaban unos quinientos. La causa principal es la velocidad: muchos conductores no respetan los límites de 60 km/h ni las señales en los tramos que atraviesan la selva. Entre las víctimas hay especies amenazadas, como el yaguareté, el puma, el tapir y el oso hormiguero.',
      ], { destacado: { valor: '≈ 3.000', texto: 'animales mueren atropellados por año en las rutas del norte de Misiones, según Parques Nacionales. En los años 90 eran unos 500.' } }),
      num('Si los atropellamientos pasaron de unos 500 por año a unos 3.000, ¿cuántas veces aumentaron?', 6, 'veces', '3.000 ÷ 500 = 6 veces más. Más tránsito, más velocidad y más rutas explican el aumento.', { ctx: 'De unos 500 a unos 3.000 atropellamientos por año.', d: 1 }),
      cad('Armá la cadena de por qué la velocidad aumenta los atropellamientos.', [ // e2
        'Un auto va a alta velocidad por un tramo de selva',
        'Un animal cruza la ruta',
        'El conductor lo ve tarde',
        'No alcanza a frenar',
        'El animal muere, y a veces también hay heridos en el auto',
      ], ['A más velocidad, más tiempo para frenar'], 'Bajar la velocidad da tiempo a ver y frenar: salva animales y personas.', { d: 1 }),
      numv(3, (i) => {
        const [v1, d1, v2] = [[50, 14, 100], [60, 20, 90], [40, 9, 80]][i];
        const f = (v2 / v1) ** 2;
        return {
          enunciado: `La distancia que recorre un auto mientras frena crece con el cuadrado de la velocidad. Si a ${v1} km/h necesita ${d1} m para frenar, ¿cuántos metros necesita a ${v2} km/h?`,
          valor: d1 * f,
          unidad: 'm',
          explicacion: `${v2} ÷ ${v1} = ${(v2 / v1).toLocaleString('es-AR')}; al cuadrado da ${f.toLocaleString('es-AR')}; ${d1} × ${f.toLocaleString('es-AR')} = ${d1 * f} m, sin contar el tiempo de reacción. Por eso unos pocos km/h de más cambian tanto.`,
          ctx: `${d1} m de frenado a ${v1} km/h; ahora a ${v2} km/h.`,
        };
      }, { d: 3 }),
      teoria('Las soluciones', [
        'Hay soluciones probadas. Controlar la velocidad con cartelería, reductores y controles, como los tótems que se instalaron en las rutas que atraviesan el Parque Nacional Iguazú. Construir pasafaunas: por debajo de la ruta (alcantarillas y túneles) o por encima (ecoductos con tierra y vegetación). Instalar pasos aéreos para animales que viven en los árboles: en el Parque Nacional Iguazú, simples sogas gruesas sobre los caminos son usadas a diario por monos caí. Y guiar a los animales hacia los pasos con alambrados o vegetación.',
      ]),
      par('Uní cada solución con el animal que más beneficia.', [ // e3
        ['Soga aérea sobre el camino', 'Monos caí'],
        ['Túnel bajo la ruta', 'Mamíferos medianos que caminan por el suelo'],
        ['Ecoducto con vegetación', 'Grandes mamíferos que evitan espacios abiertos'],
        ['Reductores de velocidad', 'Todos los que cruzan la ruta'],
      ], 'Cada grupo de fauna necesita un tipo de paso distinto.', { d: 2 }),
      mult('¿Qué medidas reducen los atropellamientos de fauna? Marcá todas.', [ // e4
        '+Controlar y reducir la velocidad en tramos de selva',
        '+Construir pasafaunas por debajo o por encima de la ruta',
        '+Guiar a los animales hacia los pasos',
        '+Señalizar los sitios de cruce frecuente',
        '-Ensanchar la ruta sin ningún paso de fauna',
      ], 'La combinación de velocidad controlada y pasos seguros es la más efectiva.', { d: 1 }),
      teoria('Primero, los datos', [
        'Para saber dónde poner los pasos, primero se registran los atropellamientos: especie, lugar exacto y fecha. Con esos datos se identifican los puntos calientes, donde se concentran las muertes. En Misiones, estudios así identificaron trece sitios sensibles y cinco prioritarios en las rutas nacionales 12 y 101. Cualquier persona puede aportar registros, como viste con la ciencia ciudadana.',
      ]),
      ord('Ordená los pasos para reducir los atropellamientos en una ruta.', [ // e5
        'Registrar cada atropellamiento con especie, lugar y fecha',
        'Identificar los puntos calientes',
        'Diseñar las soluciones para esos puntos',
        'Construir pasos y controlar la velocidad',
        'Seguir registrando para medir si funcionó',
      ], 'Los datos dicen dónde actuar y, después, si la solución funcionó.', { d: 2 }),
      numv(3, (i) => { // e6
        const [antes, desp] = [[120, 30], [80, 36], [200, 60]][i];
        return {
          enunciado: `En un tramo se registraban ${antes} atropellamientos por año. Después de instalar reductores y pasafaunas, se registran ${desp}. ¿En qué porcentaje bajaron?`,
          valor: Math.round(((antes - desp) / antes) * 100),
          unidad: '%',
          tol: 1,
          explicacion: `(${antes} − ${desp}) ÷ ${antes} × 100 = ${Math.round(((antes - desp) / antes) * 100)} %. Datos de ejemplo: medir antes y después es la única forma de saber si una medida sirve.`,
          ctx: `De ${antes} a ${desp} atropellamientos por año.`,
        };
      }, { d: 1 }),
      vf('Un cartel de "cruce de fauna" alcanza por sí solo para evitar los atropellamientos.', false, 'Los carteles ayudan poco si nadie controla la velocidad y no hay pasos. Las medidas más efectivas combinan control de velocidad, pasafaunas y guías.', { // e7
        razones: ['+Porque sin control de velocidad y pasos, el cartel ayuda poco', '-Porque los carteles aumentan los atropellamientos', '-Porque los animales leen los carteles'],
        d: 1,
      }),
      clas('¿La medida actúa sobre el conductor o sobre el paso de los animales?', { // e8
        'Sobre el conductor': ['Tótems de control de velocidad', 'Reductores de velocidad', 'Campañas de concientización'],
        'Sobre el paso de los animales': ['Túneles bajo la ruta', 'Ecoductos', 'Sogas aéreas para monos'],
      }, 'Las dos estrategias se complementan: menos velocidad y más pasos seguros.', { d: 1 }),
      det('Leé este informe vial y marcá lo que conviene corregir.', [ // e9
        ['Registramos todos los atropellamientos con coordenadas.', false],
        ['Como el tránsito crece, subiremos el límite a 100 km/h en el tramo de selva.', true, 'Más velocidad significa más atropellamientos.'],
        ['Construiremos pasafaunas en los puntos calientes.', false],
        ['No mediremos los resultados porque las obras ya están hechas.', true, 'Sin medir, no se sabe si funcionaron.'],
      ], 'Una ruta amigable con la fauna se diseña con datos y se evalúa con datos.', { d: 2 }),
      comp('Completá.', 'La principal causa de atropellamientos es la [velocidad]; un paso por encima de la ruta con tierra y vegetación es un [ecoducto]; y los lugares donde se concentran las muertes son los puntos [calientes].', ['lluvia', 'túnel', 'fríos'], 'Tres claves para hacer rutas que no maten.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Predadores y ganado', 'Pumas, zorros y perros asilvestrados: por qué el control letal suele fallar y qué alternativas funcionan.', [
      teoria('El conflicto', [
        'En la Patagonia y otras regiones, el puma, el zorro colorado y los perros asilvestrados atacan ovejas y cabras, y esas pérdidas pueden ser muy duras para familias ganaderas. La respuesta tradicional fue matar a los predadores: con trampas, cebos envenenados o incentivos para cazarlos. Pero ese control letal tiene problemas: los venenos matan a muchas otras especies (lo viste con los cóndores), no siempre reduce las pérdidas y, al eliminar a un predador adulto, a veces su territorio lo ocupan jóvenes más inexpertos que atacan más al ganado.',
      ]),
      cad('Armá la cadena de por qué un cebo envenenado puede empeorar las cosas.', [ // e1
        'Se pone un cebo envenenado para un zorro',
        'Lo comen zorros, pero también cóndores, águilas y perros',
        'Mueren especies que no atacaban al ganado',
        'Se pierden carroñeros y predadores que regulaban plagas',
        'El problema de fondo sigue igual',
      ], ['El veneno solo afecta a los zorros'], 'El veneno no elige: mata en cadena y deja el problema sin resolver.', { d: 2 }),
      teoria('Perros protectores', [
        'Una alternativa que da muy buenos resultados son los perros protectores de ganado: razas seleccionadas durante siglos para vivir con las majadas y ahuyentar a los predadores, como el maremmano abruzzese y el montaña de los Pirineos. El INTA Bariloche trabaja con ellos desde 2013. Según el INTA, cuando se incorporan de forma apropiada, reducen hasta un 95 % las muertes de animales por depredación, sin matar fauna silvestre.',
      ], { destacado: { valor: 'hasta 95 %', texto: 'menos muertes de ganado por depredación con perros protectores bien incorporados, según el INTA.' } }),
      numv(3, (i) => { // e2
        const [perd, red] = [[80, 95], [60, 90], [120, 80]][i];
        return {
          enunciado: `Una familia perdía ${perd} animales por año por depredación. Con perros protectores, las pérdidas bajan un ${red} %. ¿Cuántos animales pierde ahora?`,
          valor: Math.round(perd * (100 - red) / 100),
          unidad: 'animales',
          explicacion: `${perd} × ${100 - red} % = ${Math.round(perd * (100 - red) / 100)} animales por año. Una mejora enorme para la familia y sin matar fauna silvestre.`,
          ctx: `${perd} animales perdidos; reducción del ${red} %.`,
        };
      }, { d: 1 }),
      teoria('Cómo funciona un perro protector', [
        'El perro protector no es un perro pastor: no arrea, sino que vive con el ganado como si fuera parte de la majada. Para eso hace falta la impronta: criarlo desde cachorro junto a las ovejas o cabras, respetando un tiempo de familiarización en los primeros meses. Después se adapta al trabajo en el campo, con el compromiso de toda la familia. Si se cría mal, puede no proteger o incluso causar problemas.',
      ]),
      ord('Ordená los pasos para incorporar un perro protector.', [ // e3
        'Elegir un cachorro de una raza protectora',
        'Criarlo desde pequeño junto al ganado (impronta)',
        'Respetar el tiempo de familiarización',
        'Adaptarlo de a poco al trabajo en el campo',
        'Acompañarlo hasta que madure',
      ], 'La crianza correcta es la clave: un buen perro protector se forma, no se compra hecho.', { d: 2 }),
      vf('Un perro protector de ganado cumple la misma función que un perro pastor.', false, 'El perro pastor arrea el ganado siguiendo órdenes; el protector vive con la majada y la defiende de los predadores. Son razas y crianzas distintas.', {
        razones: ['+Porque el protector vive con la majada y la defiende, no la arrea', '-Porque el perro protector caza a los pumas', '-Porque el perro pastor vive solo en la ciudad'],
        d: 1,
      }),
      numv(3, (i) => {
        const [costo, evit, precio] = [[400, 30, 120], [500, 20, 150], [300, 15, 100]][i];
        return {
          enunciado: `Mantener un perro protector cuesta unos ${costo} dólares por año entre alimento y veterinario. Si evita la muerte de ${evit} ovejas de ${precio} dólares cada una, ¿cuánto gana la familia por año, ya descontado el costo del perro?`,
          valor: evit * precio - costo,
          unidad: 'dólares',
          explicacion: `${evit} × ${precio} = ${(evit * precio).toLocaleString('es-AR')} dólares salvados; − ${costo} = ${(evit * precio - costo).toLocaleString('es-AR')} dólares. Valores de ejemplo: la prevención suele pagarse sola.`,
          ctx: `Perro: ${costo} dólares por año; ${evit} ovejas salvadas a ${precio} dólares.`,
        };
      }, { d: 2 }),
      teoria('Otras herramientas', [
        'Otras medidas no letales incluyen encerrar el ganado de noche en corrales seguros, concentrar las pariciones en épocas y lugares más vigilados, usar luces o sonidos que ahuyentan, y cercos eléctricos. Muchas veces la mejor estrategia combina varias. También ayudan los seguros o fondos que compensan pérdidas, para que una mala temporada no empuje a las familias a usar venenos.',
      ]),
      clas('¿Es un método letal o no letal?', { // e4
        'No letal': ['Perros protectores', 'Corrales nocturnos', 'Luces que ahuyentan', 'Cercos eléctricos'],
        'Letal': ['Cebos envenenados', 'Trampas de lazo', 'Recompensas por matar pumas'],
      }, 'Los métodos no letales protegen el ganado sin dañar a la fauna silvestre.', { d: 1 }),
      op('¿Por qué matar a un puma adulto a veces aumenta los ataques al ganado?', [ // e5
        'Su territorio puede ocuparlo un joven más inexperto',
        'Porque los pumas muertos atraen más ovejas',
        ['Porque así los pumas se vuelven vegetarianos', 'No cambia su dieta; cambia quién ocupa el territorio.'],
        'Porque los zorros dejan de cazar',
      ], 'Los predadores jóvenes y dispersantes suelen ser los que más atacan presas fáciles como el ganado.', { d: 3 }),
      vf('Los perros asilvestrados pueden ser un problema tan grave como los predadores silvestres para el ganado y la fauna.', true, 'En muchas zonas atacan ganado y fauna silvestre. La tenencia responsable de perros es parte de la solución, como viste en la unidad de fauna urbana.', { // e6
        razones: ['+Porque atacan ganado y fauna silvestre', '-Porque los perros nunca atacan ganado', '-Porque los perros asilvestrados son nativos'],
        d: 2,
      }),
      mult('¿Qué combinación de medidas conviene para una familia con pérdidas por pumas? Marcá todo.', [ // e7
        '+Perros protectores bien criados',
        '+Corrales nocturnos',
        '+Pariciones en potreros vigilados',
        '+Un fondo que compense pérdidas extraordinarias',
        '-Cebos envenenados en todo el campo',
      ], 'Varias medidas no letales juntas protegen mejor que una sola, y sin daños colaterales.', { d: 2 }),
      det('Leé este consejo de un vecino y marcá lo que no conviene.', [ // e8
        ['Encerrá las ovejas de noche en un corral seguro.', false],
        ['Poné veneno en una oveja muerta para matar al zorro.', true, 'Mata cóndores, águilas y otras especies; además es ilegal.'],
        ['Probá con un perro protector criado junto a las ovejas.', false],
        ['Cualquier perro sirve como protector, aunque no esté criado con el ganado.', true, 'Necesita raza adecuada e impronta con el ganado.'],
      ], 'Las mejores soluciones protegen a la familia y a la fauna a la vez.', { d: 2 }),
      comp('Completá.', 'Criar un perro desde cachorro con el ganado se llama [impronta]; según el INTA, los perros protectores reducen hasta un [95] % las muertes por depredación; y los cebos envenenados matan también a los [cóndores].', ['adiestramiento', '9', 'caballos'], 'Tres claves para reducir la depredación sin matar fauna.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Herbívoros: competir o aprovechar', 'Guanacos y ovejas, vicuñas y chaku: cuando la fauna compite con la producción o se vuelve un recurso sostenible.', [
      teoria('Guanacos y ovejas', [
        'En la Patagonia, muchos productores ven al guanaco como un competidor de las ovejas por el pasto. La discusión científica sobre cuánto compiten es compleja: depende de la carga total de animales, del estado de los pastizales y del clima. Lo que sí está claro es que el sobrepastoreo, sumando ovejas y guanacos, degrada los pastizales y acelera la desertificación. Por eso la clave es manejar la carga total del campo, y no solo culpar a una especie.',
      ]),
      cad('Armá la cadena de cómo el sobrepastoreo degrada un campo patagónico.', [ // e1
        'Hay más animales de los que el pastizal puede sostener',
        'Los pastos se comen antes de recuperarse',
        'El suelo queda desnudo',
        'El viento y el agua se llevan el suelo',
        'El campo produce menos pasto para todos',
      ], ['Más animales hacen crecer más pasto'], 'Lo viste con el suelo: el sobrepastoreo es una de las causas de la desertificación patagónica.', { d: 2 }),
      numv(3, (i) => { // e2
        const [cap, ovejas, guan] = [[1000, 900, 300], [2000, 1500, 600], [500, 350, 200]][i];
        return {
          enunciado: `Un campo puede sostener el equivalente a ${cap.toLocaleString('es-AR')} ovejas. Tiene ${ovejas.toLocaleString('es-AR')} ovejas y ${guan} guanacos, y cada guanaco come como una oveja y media. ¿Cuántos "equivalentes oveja" supera su capacidad?`,
          valor: ovejas + guan * 1.5 - cap,
          unidad: 'equivalentes oveja',
          explicacion: `${ovejas.toLocaleString('es-AR')} + ${guan} × 1,5 = ${(ovejas + guan * 1.5).toLocaleString('es-AR')}; − ${cap.toLocaleString('es-AR')} = ${(ovejas + guan * 1.5 - cap).toLocaleString('es-AR')} de exceso. Valores de ejemplo: la carga total, no una especie sola, es lo que degrada el campo.`,
          ctx: `Capacidad ${cap}; ${ovejas} ovejas; ${guan} guanacos a 1,5 cada uno.`,
        };
      }, { d: 3 }),
      op('Un productor dice que su campo está degradado "por culpa de los guanacos". ¿Qué habría que mirar primero?', [
        'La carga total de animales frente al pasto disponible',
        'Solo cuántos guanacos cruzaron el alambrado este año',
        ['El color del pelaje de los guanacos de la zona', 'No tiene relación con la degradación del pastizal.'],
        'La cantidad de lluvia de un único día de verano',
      ], 'Ovejas, guanacos, clima y estado del pastizal se evalúan juntos: la carga total es lo que degrada.', { d: 2 }),
      teoria('Alambrados que atrapan', [
        'Los alambrados también afectan a los herbívoros silvestres. Los guanacos saltan alambrados, pero a veces quedan enganchados de las patas y mueren. Hay diseños de alambrados más amigables, con el hilo superior más bajo o sin púas, y lugares para cruzar, que reducen esas muertes sin perder el manejo del ganado.',
      ]),
      op('¿Cómo puede un productor reducir las muertes de guanacos en sus alambrados?', [ // e3
        'Con diseños más bajos y lisos arriba, y pasos',
        'Poniendo más hilos de púa en la parte de arriba',
        ['Sacando todos los alambrados del campo', 'Puede no ser posible para el manejo del ganado; hay diseños intermedios.'],
        'Electrificando todos los hilos a gran voltaje',
      ], 'Pequeños cambios de diseño pueden salvar muchos animales sin afectar la producción.', { d: 2 }),
      teoria('La vicuña: de casi extinta a recurso sostenible', [
        'La vicuña, pariente silvestre del guanaco que vive en la Puna, estuvo al borde de la extinción por la caza para obtener su fibra, una de las más finas y valiosas del mundo. Con protección y controles del comercio internacional, sus poblaciones se recuperaron. Hoy, en Jujuy y Catamarca, comunidades y equipos técnicos practican el chaku: una técnica de origen prehispánico en la que se captura a las vicuñas silvestres, se las esquila y se las libera. La fibra se vende con autorización de la CITES, y la vicuña vale más viva que muerta.',
      ]),
      ord('Ordená los pasos del chaku.', [ // e4
        'Arrear a las vicuñas silvestres hacia un corral de captura',
        'Revisar a cada animal con cuidado veterinario',
        'Esquilar su fibra',
        'Liberarlas en su ambiente',
        'Vender la fibra con autorización y trazabilidad',
      ], 'Un uso sostenible que no mata a ningún animal y da ingresos a las comunidades.', { d: 2 }),
      cad('Armá la cadena de cómo el chaku ayuda a conservar la vicuña.', [ // e5
        'Las comunidades obtienen ingresos por la fibra',
        'Las vicuñas vivas pasan a ser valiosas para ellas',
        'Las comunidades cuidan a las poblaciones y denuncian la caza',
        'Disminuye la caza furtiva',
        'Las poblaciones se mantienen sanas',
      ], ['Matar vicuñas da más fibra que esquilarlas'], 'Cuando la fauna viva genera beneficios locales, su conservación gana aliados.', { d: 2 }),
      vf('En el chaku se mata a las vicuñas para obtener su fibra.', false, 'Se las captura, se las esquila y se las libera. Es justamente lo que lo hace sostenible: la misma vicuña puede volver a esquilarse en otro chaku.', { // e6
        razones: ['+Porque se las esquila y se las libera', '-Porque la fibra solo se obtiene de animales muertos', '-Porque la vicuña es un animal doméstico'],
        d: 1,
      }),
      par('Uní cada herbívoro con su situación.', [ // e7
        ['Vicuña', 'Se recuperó y hoy se esquila en chakus'],
        ['Guanaco', 'Debate sobre su competencia con el ganado'],
        ['Oveja', 'Ganado cuyo exceso degrada pastizales'],
        ['Liebre europea', 'Herbívoro exótico que se expandió'],
      ], 'Nativos, domésticos y exóticos: cada herbívoro plantea desafíos distintos.', { d: 2 }),
      mult('¿Qué condiciones hacen sostenible el uso de una especie silvestre? Marcá todas.', [ // e8
        '+Que no se reduzca la población',
        '+Que haya control y trazabilidad del producto',
        '+Que los beneficios lleguen a las comunidades locales',
        '+Que se cuide el bienestar de los animales',
        '-Que se extraiga todo lo posible cada año',
      ], 'El uso sostenible convierte a la fauna viva en un recurso que conviene cuidar.', { d: 2 }),
      det('Leé este comentario en un foro de productores y marcá lo equivocado.', [ // e9
        ['La vicuña se recuperó gracias a la protección y al control del comercio.', false],
        ['El único problema de los pastizales patagónicos son los guanacos.', true, 'Importa la carga total de animales, incluidas las ovejas.'],
        ['En el chaku, las vicuñas se liberan después de la esquila.', false],
        ['Los alambrados no afectan a la fauna silvestre.', true, 'Los guanacos pueden quedar enganchados y morir.'],
      ], 'Los conflictos con herbívoros se resuelven mejor mirando todo el sistema.', { d: 2 }),
      comp('Completá.', 'La captura, esquila y liberación de vicuñas se llama [chaku]; el exceso de animales que degrada un pastizal es el [sobrepastoreo]; y la fibra de vicuña se vende con autorización de la [CITES].', ['rodeo', 'reciclaje', 'FIFA'], 'Tres claves de la relación entre herbívoros y producción.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Acuerdos para coexistir', 'Datos, compensaciones, participación y beneficios: cómo pasar del conflicto a la convivencia.', [
      teoria('Coexistir no es resignarse', [
        'La coexistencia no significa que los productores tengan que aceptar pérdidas sin ayuda, ni que la fauna tenga que desaparecer. Significa buscar formas de producir y conservar a la vez: con herramientas no letales, compensaciones justas, reglas claras y beneficios compartidos. Lo viste con los conflictos ambientales: los acuerdos duraderos se construyen con todas las partes.',
      ]),
      mult('¿Qué elementos tiene un buen acuerdo de coexistencia con la fauna? Marcá todos.', [ // e1
        '+Herramientas no letales para proteger el ganado',
        '+Compensaciones justas por pérdidas',
        '+Participación de productores, técnicos y comunidades',
        '+Monitoreo de pérdidas y de fauna',
        '-Eliminar a todos los predadores de la región',
      ], 'La coexistencia combina protección de la producción y de la fauna.', { d: 1 }),
      teoria('Compensaciones', [
        'Algunos programas compensan a los productores por las pérdidas causadas por fauna protegida, o pagan por la presencia de fauna en sus campos. Para que funcionen, hay que verificar las pérdidas de forma rápida y justa, y combinarlas con medidas preventivas: si solo se paga por los animales muertos, no hay incentivo para prevenir. Otra opción son los pagos por resultados: el productor recibe más si en su campo se registran pumas o yaguaretés y sus pérdidas son bajas.',
      ]),
      op('¿Por qué conviene que una compensación por depredación esté ligada a medidas de prevención?', [ // e2
        'Para que no se pierda el incentivo a prevenir',
        'Para que el productor gane más si pierde más',
        ['Para que las compensaciones sean imposibles de cobrar', 'No se trata de dificultar, sino de combinar prevención y ayuda.'],
        'Para que se usen más venenos',
      ], 'Pagar solo por lo perdido puede desalentar la prevención; combinarlos da mejores resultados.', { d: 3 }),
      op('En un esquema de pago por resultados, ¿qué hace que un productor cobre más?', [
        'Registrar pumas en su campo y tener pérdidas bajas',
        'Perder muchas ovejas por los ataques de pumas',
        'Demostrar que eliminó a los pumas de su campo',
        ['Cerrar su campo al paso de todos los animales', 'Aislar el campo no es el objetivo: se premia convivir.'],
      ], 'Se paga por lograr lo que se busca: fauna presente y ganado protegido a la vez.', { d: 2 }),
      numv(3, (i) => { // e3
        const [anim, precio, pct] = [[20, 150, 50], [40, 120, 60], [10, 200, 70]][i];
        return {
          enunciado: `Un fondo compensa el ${pct} % del valor de los animales perdidos por depredación, si el productor usa medidas preventivas. Si perdió ${anim} ovejas de ${precio} dólares cada una, ¿cuánto recibe?`,
          valor: anim * precio * pct / 100,
          unidad: 'dólares',
          explicacion: `${anim} × ${precio} × ${pct} % = ${(anim * precio * pct / 100).toLocaleString('es-AR')} dólares. Alivia una mala temporada y sostiene la prevención. Valores de ejemplo.`,
          ctx: `${anim} ovejas de ${precio} dólares; compensación del ${pct} %.`,
        };
      }, { d: 1 }),
      teoria('Beneficios de la fauna viva', [
        'La fauna también puede generar ingresos: el turismo de avistaje de pumas, cóndores, yaguaretés o guanacos crece en varias regiones, y los visitantes pagan por ver animales en libertad. Cuando esos ingresos llegan a quienes viven y producen en el lugar, la fauna pasa de ser un problema a ser un valor. Lo viste con la ballena franca en Península Valdés y con la vicuña.',
      ]),
      cad('Armá la cadena de cómo el turismo de fauna puede cambiar la mirada de un productor.', [ // e4
        'Llegan visitantes a ver pumas en la zona',
        'El productor ofrece alojamiento o guías en su campo',
        'Obtiene ingresos gracias a la presencia de pumas',
        'Le conviene que los pumas sigan en su campo',
        'Adopta medidas no letales para proteger su ganado',
      ], ['El turismo obliga a eliminar a los pumas'], 'La fauna viva que genera ingresos locales gana defensores.', { d: 2 }),
      clas('¿Esta medida previene el conflicto o repara el daño?', { // e5
        'Previene': ['Perros protectores', 'Corrales nocturnos', 'Pasafaunas en rutas'],
        'Repara': ['Compensación por ovejas perdidas', 'Seguro ganadero', 'Rehabilitación de fauna herida'],
      }, 'Prevenir y reparar se complementan; la prevención suele ser más barata.', { d: 1 }),
      vf('Los acuerdos de coexistencia funcionan mejor si los diseñan solo técnicos, sin productores.', false, 'Los productores conocen el terreno y son quienes aplican las medidas. Sin su participación, los acuerdos suelen fallar.', { // e6
        razones: ['+Porque los productores conocen el terreno y aplican las medidas', '-Porque los productores no tienen conocimientos', '-Porque los técnicos nunca participan'],
        d: 1,
      }),
      rank('Ordená estas estrategias frente a la depredación, de la más recomendable a la menos.', [ // e7
        ['Perros protectores y corrales, con apoyo técnico', 'la más recomendable'],
        ['Compensación ligada a prevención', 'muy útil'],
        ['Solo compensar sin prevenir', 'incompleta'],
        ['Cebos envenenados', 'la peor'],
      ], 'Prevenir con métodos no letales, apoyar a las familias y nunca envenenar.', { d: 2, extremos: ['Más recomendable', 'Menos recomendable'] }),
      par('Uní cada problema con una herramienta de coexistencia.', [ // e8
        ['Pumas que atacan majadas', 'Perros protectores'],
        ['Fauna atropellada en rutas', 'Pasafaunas y control de velocidad'],
        ['Guanacos enganchados en alambrados', 'Alambrados de diseño amigable'],
        ['Pérdidas que empujan a usar veneno', 'Fondos de compensación'],
      ], 'Cada conflicto tiene herramientas concretas.', { d: 1 }),
      det('Leé esta propuesta provincial y marcá lo que conviene corregir.', [ // e9
        ['Apoyaremos la cría de perros protectores con el INTA.', false],
        ['Pagaremos una recompensa por cada puma muerto.', true, 'Incentiva el control letal, que suele fallar y afecta a otras especies.'],
        ['Crearemos un fondo de compensación ligado a medidas preventivas.', false],
        ['Diseñaremos el programa sin consultar a los productores.', true, 'La participación es clave para que funcione.'],
      ], 'Un buen programa de coexistencia protege a las familias y a la fauna.', { d: 2 }),
      comp('Completá.', 'Convivir con la fauna protegiendo la producción es la [coexistencia]; pagar por las pérdidas causadas por fauna es una [compensación]; y el turismo de fauna puede hacer que la fauna viva genere [ingresos].', ['resignación', 'multa', 'deudas'], 'Tres ideas para pasar del conflicto a la convivencia.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: convivir con la fauna', 'Corredores, rutas, predadores, herbívoros y acuerdos de coexistencia, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el valle de las ovejas y los pumas', 'En un valle de la Norpatagonia, familias ganaderas pierden ovejas por pumas y zorros, y alguien propone usar veneno. Armá un plan de coexistencia.', [
      teoria('La situación', [
        'En el valle viven 12 familias con 300 ovejas y cabras cada una. Entre todas pierden unos 400 animales por año por depredación, sobre todo de noche y en la época de pariciones. Una ruta cruza el valle y allí se atropellan zorros y guanacos. Un grupo propone poner cebos envenenados. El INTA ofrece perros protectores y asesoramiento, y el municipio puede crear un pequeño fondo de compensación.',
      ]),
      num('¿Qué porcentaje de todas las ovejas y cabras del valle se pierde por año? Redondeá a un decimal.', 11.1, '%', '12 × 300 = 3.600 animales; 400 ÷ 3.600 × 100 ≈ 11,1 %. Una pérdida muy alta para las familias.', { ctx: '12 familias con 300 animales cada una; 400 perdidos.', dec: 1, tol: 0.1, d: 2 }),
      num('Si con perros protectores y corrales las pérdidas bajan un 80 %, ¿cuántos animales se perderían por año?', 80, 'animales', '400 × 20 % = 80 animales por año: 320 animales salvados, sin matar fauna silvestre.', { ctx: '400 animales perdidos; reducción del 80 %.', d: 1 }),
      op('¿Por qué no conviene la propuesta de los cebos envenenados?', [ // e3
        'Matan otras especies, son ilegales y no resuelven el fondo',
        'Porque los venenos son muy caros para las familias',
        ['Porque los zorros no comen carne', 'Sí comen carne; el problema es que el veneno mata a muchas especies.'],
        'Porque los pumas son inmunes al veneno',
      ], 'El veneno mata cóndores, águilas y perros, contamina y deja el problema sin resolver.', { d: 2 }),
      ord('Ordená el plan de coexistencia.', [ // e4
        'Reunir a las 12 familias con el INTA y el municipio',
        'Registrar dónde y cuándo ocurren las pérdidas',
        'Incorporar perros protectores y corrales nocturnos',
        'Crear el fondo de compensación ligado a prevención',
        'Medir las pérdidas cada año y ajustar',
      ], 'Participación, datos, prevención, apoyo económico y evaluación.', { d: 3 }),
      mult('¿Qué más puede incluir el plan para la fauna del valle? Marcá todo.', [ // e5
        '+Reductores de velocidad y pasos de fauna en la ruta',
        '+Alambrados amigables para los guanacos',
        '+Control de perros sueltos y asilvestrados',
        '-Recompensas por cada zorro muerto',
        '-Quemar los pastizales para ahuyentar a los pumas',
      ], 'Un plan de coexistencia mira todo el paisaje, no solo el corral.', { d: 2 }),
      vf('Con perros protectores y corrales, ya no hace falta ningún apoyo económico a las familias.', false, 'Las medidas reducen mucho las pérdidas, pero una mala temporada puede ser grave. Un fondo ligado a la prevención da estabilidad y evita la tentación del veneno.', { // e6
        razones: ['+Porque una mala temporada puede ser grave y el fondo da estabilidad', '-Porque los perros eliminan todas las pérdidas', '-Porque las familias no tienen gastos'],
        d: 2,
      }),
      det('El municipio redacta el acuerdo. Marcá lo que conviene corregir.', [ // e7
        ['Las familias recibirán perros protectores y asesoramiento del INTA.', false],
        ['Se permitirá usar cebos envenenados como último recurso.', true, 'Son ilegales y matan muchas especies: no deben ser una opción.'],
        ['Se registrarán las pérdidas cada temporada.', false],
        ['El fondo pagará todas las pérdidas aunque no se use ninguna prevención.', true, 'Debe estar ligado a medidas preventivas.'],
      ], 'Un acuerdo sólido protege a las familias, a la fauna y a su propia continuidad.', { d: 3 }),
    ]),
  ],
});
