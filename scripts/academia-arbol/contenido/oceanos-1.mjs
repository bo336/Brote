import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// OCÉANOS Y RÍOS 1 — El planeta azul.
// La base de la rama: cuánta agua cubre el planeta, cómo el océano regula el
// clima, la vida en el mar y en el Mar Argentino, los grandes ríos de la
// Cuenca del Plata y las costas y estuarios. Retoma el ciclo del agua
// (agua-1 si ya la hiciste) y la energía que fluye (tronco-1).

export default unidad({
  slug: 'oceanos-1',
  rama: 'agua_azul',
  orden: 1,
  nivel: 1,
  requiereTronco: 1,
  titulo: 'El planeta azul',
  bajada: 'Siete de cada diez metros cuadrados del planeta están cubiertos de océano. Cómo el mar regula el clima, qué vida guarda y cómo se conecta con los ríos.',
  objetivos: [
    'Dimensionar el océano y su papel en el planeta',
    'Explicar cómo el océano regula el clima absorbiendo calor y CO₂',
    'Describir la red de vida marina y el Mar Argentino',
    'Reconocer los grandes ríos argentinos y su fauna',
    'Valorar las costas y los estuarios como ambientes de transición',
  ],
  repasa: ['tronco-1', 'agua-1'],
  fuentes: ['ipcc-ar6-syr', 'global-carbon-budget', 'noaa-acidificacion', 'pampa-azul', 'inidep', 'ramsar', 'parques-nacionales'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Un planeta de agua', 'Cuánto océano hay, qué tan profundo es y por qué el Mar Argentino es tan especial.', [
      teoria('Siete de cada diez', [
        'El océano cubre alrededor del 71 % de la superficie de la Tierra y guarda cerca del 97 % de toda el agua del planeta. Su profundidad promedio es de unos 3.700 metros, y en las fosas más profundas supera los 10.000 metros.',
        'Aunque lo llamemos con muchos nombres —Atlántico, Pacífico, Índico, Austral, Ártico—, en realidad es un solo océano conectado, que hace circular agua, calor y nutrientes por todo el planeta.',
      ], { destacado: { valor: '≈ 71 %', texto: 'de la superficie de la Tierra está cubierta por el océano.' } }),
      est('Estimá qué porcentaje de la superficie de la Tierra está cubierto por el océano.', 71, { min: 0, max: 100, paso: 1, unidad: '%' }, 'Alrededor del 71 %. Por eso, visto desde el espacio, es un planeta azul.', { d: 1 }),
      rank('Ordená estas profundidades de menor a mayor.', [ // e2
        ['Una pileta olímpica', 'unos 2 metros'],
        ['La plataforma continental argentina', 'menos de 200 metros'],
        ['La profundidad promedio del océano', 'unos 3.700 metros'],
        ['Las fosas más profundas', 'más de 10.000 metros'],
      ], 'El océano es mucho más profundo de lo que imaginamos, y casi todo su volumen está en la oscuridad.', { d: 2, extremos: ['Menor', 'Mayor'] }),
      teoria('El Mar Argentino', [
        'Frente a la costa argentina se extiende una de las plataformas continentales más anchas del mundo: un fondo marino poco profundo, de menos de 200 metros, que en algunas latitudes se aleja cientos de kilómetros de la costa. Más allá, el fondo cae abruptamente en el talud.',
        'En el Mar Argentino se encuentran dos corrientes: la de Malvinas, fría y rica en nutrientes, que viene del sur, y la de Brasil, cálida, que viene del norte. Su encuentro y el borde del talud forman zonas de enorme productividad biológica.',
      ]),
      par('Uní cada elemento del Mar Argentino con su característica.', [ // e3
        ['Plataforma continental', 'Fondo poco profundo que se aleja mucho de la costa'],
        ['Talud', 'Borde donde el fondo cae abruptamente'],
        ['Corriente de Malvinas', 'Agua fría y rica en nutrientes del sur'],
        ['Corriente de Brasil', 'Agua cálida del norte'],
      ], 'Un mar con una geografía y unas corrientes que lo hacen muy productivo.', { d: 2 }),
      vf('El océano es en realidad un solo cuerpo de agua conectado, aunque tenga varios nombres.', true, 'Todos los océanos están conectados y el agua circula entre ellos. Los nombres son divisiones útiles, no barreras.', { // e4
        razones: ['+Porque todos están conectados y el agua circula entre ellos', '-Porque los océanos están separados por muros de tierra', '-Porque cada océano tiene un agua distinta que no se mezcla'],
        d: 1,
      }),
      cad('Armá la cadena de por qué el encuentro de corrientes hace productivo al Mar Argentino.', [ // e5
        'La corriente fría de Malvinas trae nutrientes',
        'Se encuentra con aguas cálidas y el borde del talud',
        'Los nutrientes suben a la superficie iluminada',
        'El fitoplancton crece en grandes cantidades',
        'Hay alimento para peces, aves y mamíferos marinos',
      ], ['Las corrientes calientan el mar y matan el plancton'], 'Nutrientes más luz: la receta de la vida en el mar.', { d: 2 }),
      mult('¿Qué hace especial al Mar Argentino? Marcá todo.', [ // e6
        '+Una plataforma continental muy ancha',
        '+El encuentro de corrientes frías y cálidas',
        '+Zonas de enorme productividad como el frente del talud',
        '+Gran abundancia de aves y mamíferos marinos',
        '-Que es el mar más profundo del mundo',
      ], 'No es el más profundo: al contrario, gran parte es plataforma poco profunda, muy rica en vida.', { d: 2 }),
      numv(3, (i) => { // e7
        const sup = [510, 510, 510][i];
        const pct = [71, 70, 72][i];
        return {
          enunciado: `La superficie de la Tierra es de unos ${sup} millones de km². Si el océano cubre el ${pct} %, ¿cuántos millones de km² de océano hay? Redondeá al entero.`,
          valor: Math.round((sup * pct) / 100),
          unidad: 'millones de km²',
          tol: 2,
          explicacion: `${sup} × ${pct} ÷ 100 ≈ ${Math.round((sup * pct) / 100)} millones de km². Más de cien veces la superficie de Argentina continental.`,
        };
      }, { d: 2 }),
      vf('La mayor parte del agua del planeta está en el océano.', true, 'El océano guarda cerca del 97 % de toda el agua de la Tierra. El agua dulce es una parte chica, como viste en la rama de Agua.', {
        razones: ['+Porque guarda cerca del 97 % del agua del planeta', '-Porque la mayor parte del agua está en los ríos', '-Porque la mayor parte está en las nubes'],
        d: 1,
      }),
      est('Estimá la profundidad promedio del océano.', 3700, { min: 10, max: 20000, unidad: 'metros', escala: 'log' }, 'Unos 3.700 metros: más de cincuenta veces la altura del Obelisco porteño.', { d: 3 }),
      det('Leé esta explicación y marcá lo equivocado.', [ // e8
        ['El océano cubre alrededor del 71 % de la superficie del planeta.', false],
        ['El océano tiene en promedio unos 100 metros de profundidad.', true, 'La profundidad promedio es de unos 3.700 metros.'],
        ['En el Mar Argentino se encuentran corrientes frías y cálidas.', false],
        ['La plataforma continental argentina es de las más angostas del mundo.', true, 'Es una de las más anchas del mundo.'],
      ], 'Conocer el mar empieza por dimensionarlo.', { d: 2 }),
      comp('Completá.', 'El océano cubre cerca del [71] % del planeta; frente a Argentina hay una plataforma continental muy [ancha]; y allí se encuentran la corriente de Malvinas y la de [Brasil].', ['30', 'angosta', 'Humboldt'], 'Tres datos básicos del planeta azul y del Mar Argentino.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('El océano regula el clima', 'Calor, CO₂ y corrientes: cómo el mar amortigua el cambio climático, y a qué costo.', [
      teoria('Una esponja de calor', [
        'El agua necesita mucha energía para calentarse, y el océano es enorme. Por eso ha absorbido la gran mayoría del calor extra que atrapan los gases de efecto invernadero: según el IPCC, alrededor del 90 % del calentamiento acumulado del sistema climático en las últimas décadas se fue al océano.',
        'Eso amortigua el calentamiento del aire, pero calienta el mar: sube el nivel del agua (el agua caliente ocupa más lugar), se blanquean los corales y cambian las zonas donde viven los peces.',
      ], { destacado: { valor: '≈ 90 %', texto: 'del calor extra acumulado por el cambio climático fue absorbido por el océano, según el IPCC.' } }),
      est('Estimá qué porcentaje del calor extra acumulado por el cambio climático absorbió el océano.', 90, { min: 0, max: 100, paso: 5, unidad: '%' }, 'Alrededor del 90 %. Sin el océano, el aire se habría calentado muchísimo más.', { d: 2 }),
      teoria('Un sumidero de CO₂', [
        'El océano también absorbe CO₂ del aire: alrededor de un cuarto de las emisiones de CO₂ de las actividades humanas cada año, según el Global Carbon Project. Parte se disuelve en el agua y parte la usa el fitoplancton en la fotosíntesis.',
        'Ese servicio tiene un costo: el CO₂ disuelto vuelve el agua más ácida, lo que dificulta a corales, moluscos y algunos organismos del plancton formar sus caparazones. Es la acidificación del océano.',
      ]),
      cad('Armá la cadena de la acidificación del océano.', [ // e1
        'Las personas emiten CO₂ al quemar combustibles fósiles',
        'El océano absorbe una parte',
        'El CO₂ disuelto forma ácido carbónico',
        'El agua se vuelve más ácida',
        'Les cuesta más a moluscos y corales formar sus caparazones',
      ], ['El CO₂ se transforma en sal marina'], 'El mismo servicio que nos ayuda —absorber CO₂— daña la química del mar.', { d: 2 }),
      par('Uní cada efecto con su causa.', [ // e2
        ['Suba del nivel del mar', 'El agua se expande al calentarse y se derriten hielos'],
        ['Acidificación', 'El océano absorbe CO₂'],
        ['Blanqueamiento de corales', 'El agua demasiado caliente estresa a los corales'],
        ['Peces que cambian de zona', 'Buscan aguas con la temperatura que necesitan'],
      ], 'El océano amortigua el cambio climático, pero lo sufre.', { d: 2 }),
      vf('Como el océano absorbe CO₂, emitir más no tiene consecuencias.', false, 'Absorbe solo una parte, y al hacerlo se acidifica y se calienta. El resto se acumula en la atmósfera.', { // e3
        razones: ['+Porque absorbe solo una parte y se acidifica al hacerlo', '-Porque el océano absorbe todo el CO₂ sin efectos', '-Porque el CO₂ no llega nunca al mar'],
        d: 2,
      }),
      numv(3, (i) => { // e4
        const em = [40, 38, 36][i];
        return {
          enunciado: `Si la humanidad emite unos ${em} mil millones de toneladas de CO₂ por año y el océano absorbe alrededor de un cuarto, ¿cuántos miles de millones de toneladas absorbe?`,
          valor: em / 4,
          unidad: 'miles de millones de t',
          dec: 1,
          explicacion: `${em} ÷ 4 = ${(em / 4).toLocaleString('es-AR')}. Un servicio enorme que, a la vez, acidifica el agua.`,
        };
      }, { d: 2 }),
      teoria('Corrientes que mueven el clima', [
        'Las corrientes oceánicas llevan calor de los trópicos hacia los polos y agua fría de vuelta. Por eso algunas regiones tienen climas más templados o más fríos de lo que les correspondería por su latitud. Por ejemplo, la corriente fría de Malvinas contribuye a que la costa patagónica sea fresca incluso en verano.',
      ]),
      clas('¿Esto es un servicio que el océano presta al clima o un efecto del cambio climático sobre el océano?', { // e5
        'Servicio al clima': ['Absorber calor', 'Absorber CO₂', 'Llevar calor de los trópicos a los polos'],
        'Efecto sobre el océano': ['Acidificación', 'Suba del nivel del mar', 'Olas de calor marinas'],
      }, 'El océano da y recibe: amortigua el cambio climático y sufre sus consecuencias.', { d: 2 }),
      op('¿Por qué sube el nivel del mar con el calentamiento global?', [ // e6
        'Por el agua que se expande y el hielo de tierra',
        'Porque llueve más sobre el océano que antes',
        ['Porque se derrite el hielo que ya flota en el mar', 'El hielo que ya flota casi no sube el nivel al derretirse; lo que suma es el agua caliente y el hielo de tierra.'],
        'Porque los ríos traen más arena al mar',
      ], 'Expansión térmica y hielo de tierra que se derrite: las dos causas principales.', { d: 3 }),
      numv(3, (i) => {
        const mm = [4, 3, 5][i];
        const a = [30, 20, 50][i];
        return {
          enunciado: `Si el nivel del mar sube unos ${mm} mm por año, ¿cuántos centímetros sube en ${a} años, a ese ritmo constante?`,
          valor: (mm * a) / 10,
          unidad: 'cm',
          dec: 1,
          explicacion: `${mm} × ${a} = ${mm * a} mm, que son ${((mm * a) / 10).toLocaleString('es-AR')} cm. Y el ritmo se está acelerando, así que es una estimación baja.`,
        };
      }, { d: 2 }),
      vf('El hielo que ya flota en el mar, al derretirse, casi no sube el nivel del mar.', true, 'El hielo flotante ya desplaza su peso en agua. Lo que sube el nivel es el hielo de tierra que se derrite y el agua que se expande al calentarse.', {
        razones: ['+Porque ya desplazaba su peso en agua al flotar', '-Porque el hielo flotante no se derrite nunca', '-Porque el agua de deshielo se evapora al instante'],
        d: 3,
      }),
      det('Leé esta nota y marcá lo equivocado.', [ // e7
        ['El océano absorbió la mayor parte del calor extra del cambio climático.', false],
        ['El océano absorbe todo el CO₂ que emitimos.', true, 'Absorbe alrededor de un cuarto; el resto se acumula en el aire o lo absorben los ecosistemas terrestres.'],
        ['La acidificación afecta a organismos con caparazón.', false],
        ['El hielo que ya flota en el mar es la causa principal de la suba del nivel del mar.', true, 'Las causas principales son la expansión del agua caliente y el hielo de tierra que se derrite.'],
      ], 'El océano es aliado del clima, pero no tiene capacidad infinita.', { d: 3 }),
      comp('Completá.', 'El océano absorbió cerca del [90] % del calor extra; absorbe alrededor de un [cuarto] del CO₂ emitido; y por eso se [acidifica].', ['10', 'décimo', 'endulza'], 'Tres ideas sobre el océano y el clima, resumidas en una línea.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('La vida en el mar', 'Del plancton a las ballenas: la red de vida marina y la fauna del Mar Argentino.', [
      teoria('Todo empieza por el plancton', [
        'La base de casi toda la vida marina es el fitoplancton: algas microscópicas que hacen fotosíntesis cerca de la superficie. Lo comen pequeños animales del zooplancton, como el krill; a ellos, peces chicos; y después, peces grandes, aves, lobos marinos y ballenas.',
        'Como viste en otras ramas, el fitoplancton además produce alrededor de la mitad del oxígeno del planeta.',
      ]),
      ord('Ordená esta cadena alimentaria marina, de la base hacia arriba.', [ // e1
        'Fitoplancton',
        'Zooplancton (krill)',
        'Anchoíta',
        'Merluza',
        'Lobo marino',
      ], 'Energía del sol capturada por el plancton, que sube escalón por escalón.', { d: 2, extremos: ['Base', 'Arriba'] }),
      teoria('Fauna del Mar Argentino', [
        'El Mar Argentino y su costa son hogar de pingüinos de Magallanes (con colonias enormes como la de Punta Tombo), lobos y elefantes marinos, delfines, orcas, albatros y petreles, y la ballena franca austral, que cada año llega a las aguas de Península Valdés para aparearse y tener sus crías.',
        'La ballena franca austral fue declarada Monumento Natural Nacional en 1984.',
      ]),
      par('Uní cada animal con un lugar o dato del Mar Argentino.', [ // e2
        ['Ballena franca austral', 'Llega a Península Valdés para tener sus crías'],
        ['Pingüino de Magallanes', 'Grandes colonias en la costa patagónica'],
        ['Elefante marino', 'Colonias en Península Valdés'],
        ['Albatros', 'Recorre enormes distancias sobre el mar abierto'],
      ], 'Un mar con una fauna que atrae a investigadores y visitantes de todo el mundo.', { d: 2 }),
      vf('La ballena franca austral es Monumento Natural Nacional en Argentina.', true, 'Fue declarada así en 1984. Cada año llega a Península Valdés, donde se la puede observar desde la costa y en avistajes regulados.', { // e3
        razones: ['+Porque fue declarada Monumento Natural Nacional en 1984', '-Porque las ballenas no llegan a Argentina', '-Porque solo los árboles pueden ser monumentos naturales'],
        d: 2,
      }),
      teoria('Migraciones marinas', [
        'Muchos animales del mar hacen grandes viajes. Los pingüinos de Magallanes, después de la temporada de cría en la Patagonia, migran hacia el norte, hasta el sur de Brasil, siguiendo a sus presas. Las ballenas francas viajan entre zonas de alimentación en aguas frías y zonas de cría más protegidas.',
        'Por eso proteger solo una parte de su recorrido no alcanza: hace falta cooperación entre países y cuidar todo el camino.',
      ]),
      cad('Armá la cadena de por qué la pesca de anchoíta afecta a los pingüinos.', [ // e4
        'Se pesca mucha anchoíta cerca de una colonia',
        'Los pingüinos encuentran menos alimento',
        'Tienen que nadar más lejos para comer',
        'Alimentan peor a sus pichones',
        'Sobreviven menos pichones',
      ], ['Los pingüinos cambian a comer algas'], 'La red marina conecta la pesca con la vida de las aves. Pescar sin mirar la red afecta a todo.', { d: 3 }),
      clas('¿Es parte del plancton o no?', { // e5
        'Plancton': ['Algas microscópicas', 'Krill', 'Larvas de peces'],
        'No es plancton': ['Ballena franca', 'Pingüino', 'Merluza adulta'],
      }, 'El plancton son los organismos que flotan a la deriva, casi todos diminutos. Las ballenas, en cambio, comen plancton.', { d: 2 }),
      mult('¿Qué animales viven en el Mar Argentino o en su costa? Marcá todos.', [ // e6
        '+Pingüino de Magallanes',
        '+Lobo marino de un pelo',
        '+Orca',
        '+Ballena franca austral',
        '-Oso polar',
      ], 'El oso polar vive en el Ártico, en el hemisferio norte.', { d: 1 }),
      numv(3, (i) => { // e7
        const nidos = [200000, 150000, 250000][i];
        return {
          enunciado: `Si una colonia tiene ${nidos.toLocaleString('es-AR')} nidos de pingüinos y cada nido es de una pareja, ¿cuántos pingüinos adultos hay?`,
          valor: nidos * 2,
          unidad: 'pingüinos',
          explicacion: `${nidos.toLocaleString('es-AR')} × 2 = ${(nidos * 2).toLocaleString('es-AR')} adultos, sin contar pichones. Las colonias patagónicas están entre las más grandes de esta especie.`,
        };
      }, { d: 1 }),
      rank('Ordená estos seres del Mar Argentino de más chico a más grande.', [
        ['Fitoplancton', 'microscópico'],
        ['Krill', 'unos centímetros'],
        ['Anchoíta', 'unos 15 centímetros'],
        ['Pingüino de Magallanes', 'unos 70 centímetros'],
        ['Ballena franca austral', 'más de 12 metros'],
      ], 'Lo curioso: la ballena franca se alimenta de los más chicos de la lista, filtrando zooplancton.', { d: 1, extremos: ['Más chico', 'Más grande'] }),
      op('¿Por qué la ballena franca austral llega cada año a Península Valdés?', [
        'Para aparearse y tener sus crías en aguas protegidas',
        'Porque allí encuentra agua dulce para beber',
        ['Porque la atraen los barcos turísticos', 'Llega desde mucho antes de que existiera el turismo: busca golfos protegidos para criar.'],
        'Porque allí hiberna durante todo el verano',
      ], 'Los golfos de Península Valdés ofrecen aguas tranquilas y protegidas para las crías.', { d: 2 }),
      det('Leé esta descripción y marcá lo equivocado.', [ // e8
        ['El fitoplancton es la base de la red marina.', false],
        ['Las ballenas francas viven todo el año en el mismo lugar sin moverse.', true, 'Migran entre zonas de alimentación y de cría.'],
        ['Los pingüinos de Magallanes crían en la costa patagónica.', false],
        ['Pescar anchoíta no afecta a ningún otro animal.', true, 'La anchoíta es alimento de pingüinos, lobos marinos y peces grandes.'],
      ], 'La vida marina es una red: cada hilo sostiene a otros.', { d: 2 }),
      comp('Completá.', 'La base de la red marina es el [fitoplancton]; la ballena franca austral llega a Península [Valdés]; y los pingüinos de Magallanes [migran] hacia el norte en invierno.', ['petróleo', 'Mitre', 'hibernan'], 'Tres datos sobre la vida del Mar Argentino.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Los grandes ríos', 'La Cuenca del Plata, el Paraná, el sábalo y los peces migradores: los ríos como arterias del continente.', [
      teoria('La Cuenca del Plata', [
        'La Cuenca del Plata es la segunda más grande de América del Sur, después de la del Amazonas: reúne las aguas de los ríos Paraná, Paraguay, Uruguay y sus afluentes, en un territorio de unos 3 millones de km² que abarca parte de Argentina, Brasil, Paraguay, Bolivia y Uruguay. Desemboca en el Río de la Plata, uno de los estuarios más anchos del mundo.',
        'En su recorrido hay selvas, humedales, ciudades, represas, puertos y algunas de las zonas agrícolas más productivas del mundo.',
      ], { destacado: { valor: '≈ 3 millones km²', texto: 'abarca la Cuenca del Plata, la segunda más grande de América del Sur.' } }),
      mult('¿Qué países comparten la Cuenca del Plata? Marcá todos.', [ // e1
        '+Argentina',
        '+Brasil',
        '+Paraguay',
        '+Uruguay',
        '-Chile',
      ], 'También Bolivia. Chile, en cambio, está del otro lado de la cordillera.', { d: 1 }),
      teoria('Peces que viajan', [
        'En el Paraná viven peces migradores, como el sábalo, el dorado, el surubí y el patí, que recorren cientos de kilómetros para reproducirse y alimentarse. El sábalo come el barro rico en materia orgánica del fondo (es un pez detritívoro) y es una de las especies más abundantes del río: es alimento de muchos otros peces, como el dorado, y de aves.',
        'Por eso el sábalo es una especie clave de la red del Paraná. Su sobrepesca, por ejemplo para exportación, preocupa a científicos y pescadores.',
      ]),
      cad('Armá la cadena de por qué la sobrepesca de sábalo puede afectar al dorado.', [ // e2
        'Se pesca mucho sábalo para exportar',
        'Baja la población de sábalo',
        'El dorado encuentra menos presas',
        'La población de dorado también baja',
      ], ['El dorado empieza a comer barro en lugar de sábalo'], 'El sábalo sostiene a buena parte de la red del río. Es una especie clave, como viste en la rama de Animales.', { d: 2 }),
      par('Uní cada pez del Paraná con su característica.', [ // e3
        ['Sábalo', 'Come el barro orgánico del fondo y es muy abundante'],
        ['Dorado', 'Gran depredador, muy buscado en la pesca deportiva'],
        ['Surubí', 'Pez de cuero de gran tamaño'],
      ], 'Tres peces emblemáticos de uno de los grandes ríos del mundo.', { d: 2 }),
      vf('Las represas no afectan a los peces que migran por el río.', false, 'Las represas pueden cortar las rutas migratorias. Algunas tienen escaleras o sistemas de transferencia de peces, pero no siempre funcionan bien.', { // e4
        razones: ['+Porque pueden cortar las rutas migratorias', '-Porque los peces saltan cualquier represa', '-Porque los peces del Paraná no migran'],
        d: 2,
      }),
      teoria('Los ríos patagónicos y de montaña', [
        'Los ríos patagónicos, como el Negro, el Limay, el Chubut o el Santa Cruz, nacen en la cordillera y dependen de la nieve y los glaciares. Tienen aguas frías y claras, y en ellos se introdujeron truchas y salmones exóticos para la pesca deportiva, que compiten con peces nativos como la perca y el puyén.',
      ]),
      clas('¿Es un río de la Cuenca del Plata o un río patagónico?', { // e5
        'Cuenca del Plata': ['Paraná', 'Uruguay', 'Paraguay'],
        'Patagónico': ['Limay', 'Chubut', 'Santa Cruz'],
      }, 'Dos mundos fluviales: grandes ríos de llanura cálida y ríos fríos de montaña.', { d: 2 }),
      numv(3, (i) => { // e6
        const km = [300, 500, 800][i];
        const dia = [15, 20, 25][i];
        return {
          enunciado: `Un sábalo migra ${km} km río arriba a unos ${dia} km por día. ¿Cuántos días tarda?`,
          valor: km / dia,
          unidad: 'días',
          dec: 1,
          explicacion: `${km} ÷ ${dia} = ${(km / dia).toLocaleString('es-AR')} días. Durante todo ese recorrido necesita que el río esté conectado y limpio.`,
        };
      }, { d: 1 }),
      op('¿Por qué el sábalo es una especie clave en el Paraná?', [ // e7
        'Porque es muy abundante y alimenta a muchos',
        'Porque es el pez más grande de todo el río',
        ['Porque es una especie exótica invasora en el río', 'Es nativo del Paraná y es la base de buena parte de su red.'],
        'Porque ningún otro animal del río lo come',
      ], 'Muchas especies dependen de él. Si baja, se resiente toda la red.', { d: 2 }),
      est('Estimá la superficie de la Cuenca del Plata.', 3, { min: 0.1, max: 20, paso: 0.1, unidad: 'millones de km²' }, 'Unos 3 millones de km²: más que toda la Argentina continental.', { d: 3 }),
      ord('Ordená estos ríos de norte a sur.', [
        'Río Paraguay',
        'Río Paraná a la altura de Rosario',
        'Río Colorado',
        'Río Negro',
        'Río Santa Cruz',
      ], 'Del subtrópico húmedo a la Patagonia austral: ríos muy distintos en un mismo país.', { d: 3, extremos: ['Norte', 'Sur'] }),
      det('Leé esta nota y marcá lo equivocado.', [ // e8
        ['La Cuenca del Plata es la segunda más grande de América del Sur.', false],
        ['El sábalo es un pez exótico traído de Europa.', true, 'Es un pez nativo, clave en la red del Paraná.'],
        ['El dorado se alimenta de otros peces, como el sábalo.', false],
        ['Las truchas son nativas de los ríos patagónicos.', true, 'Fueron introducidas para la pesca deportiva.'],
      ], 'Conocer los ríos es conocer su fauna nativa y lo que la amenaza.', { d: 2 }),
      comp('Completá.', 'La Cuenca del [Plata] es la segunda más grande de América del Sur; el [sábalo] es clave en la red del Paraná; y las truchas de la Patagonia son [exóticas].', ['Amazonas', 'dorado', 'nativas'], 'Tres ideas sobre los grandes ríos argentinos.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Costas y estuarios', 'Donde el río se encuentra con el mar: el Río de la Plata, las marismas y las dunas.', [
      teoria('Ambientes de transición', [
        'Las costas son zonas de transición entre la tierra y el mar. Un estuario es el lugar donde un río desemboca en el mar y el agua dulce se mezcla con la salada, como en el Río de la Plata. Las marismas son humedales costeros que se inundan con las mareas, y las dunas son acumulaciones de arena que el viento forma detrás de las playas.',
        'Son ambientes muy productivos: muchos peces se crían en estuarios y marismas, y muchas aves migratorias se alimentan en ellos.',
      ]),
      par('Uní cada ambiente costero con su descripción.', [ // e1
        ['Estuario', 'Donde el agua dulce del río se mezcla con la salada'],
        ['Marisma', 'Humedal costero que se inunda con las mareas'],
        ['Duna', 'Acumulación de arena formada por el viento'],
        ['Playa', 'Franja de arena o canto rodado junto al mar'],
      ], 'Cuatro ambientes que forman un sistema costero conectado.', { d: 1 }),
      teoria('El Río de la Plata y Samborombón', [
        'El Río de la Plata es uno de los estuarios más anchos del mundo: en su desembocadura mide unos 200 kilómetros de costa a costa. En su orilla sur, la Bahía Samborombón es un enorme humedal de marismas y cangrejales, reconocido como sitio Ramsar de importancia internacional, donde se refugia el venado de las pampas y descansan aves migratorias.',
      ]),
      vf('La Bahía Samborombón es un humedal de importancia internacional reconocido por la Convención de Ramsar.', true, 'Es un sitio Ramsar: un humedal costero clave para aves migratorias y para el venado de las pampas.', { // e2
        razones: ['+Porque fue reconocida como sitio Ramsar por su valor para aves y fauna', '-Porque es una zona industrial del puerto', '-Porque es un desierto sin agua'],
        d: 2,
      }),
      teoria('Dunas y erosión costera', [
        'Las dunas protegen la costa: guardan arena que las tormentas mueven entre la playa y la duna, y frenan el viento y el mar. Cuando se construye sobre ellas, se las aplana o se planta vegetación que las fija de más, la playa pierde su reserva de arena y la erosión avanza.',
        'En muchas localidades de la costa bonaerense, la urbanización sobre las dunas contribuyó a la pérdida de playas.',
      ]),
      cad('Armá la cadena de cómo construir sobre las dunas puede hacer perder la playa.', [ // e3
        'Se construye sobre las dunas frente al mar',
        'Se pierde la reserva de arena de la costa',
        'Las tormentas se llevan arena que no se repone',
        'La playa se achica año tras año',
        'Las construcciones quedan expuestas al mar',
      ], ['Las construcciones generan arena nueva'], 'Las dunas son un sistema de defensa natural. Destruirlas deja la costa expuesta.', { d: 2 }),
      clas('¿Esta acción protege la costa o la daña?', { // e4
        'La protege': ['Pasarelas elevadas para cruzar las dunas', 'Conservar la vegetación nativa de las dunas', 'Construir lejos de la primera línea de dunas'],
        'La daña': ['Aplanar dunas para hacer estacionamientos', 'Circular con vehículos sobre las dunas', 'Extraer arena de la playa para construir'],
      }, 'Cuidar las dunas es, en definitiva, cuidar la playa y el pueblo.', { d: 2 }),
      mult('¿Qué servicios prestan los ambientes costeros? Marcá todos.', [ // e5
        '+Criaderos de peces',
        '+Alimento para aves migratorias',
        '+Protección contra tormentas',
        '+Filtrar el agua que llega al mar',
        '-Producir petróleo',
      ], 'Estuarios, marismas y dunas trabajan gratis para la pesca, las aves y las personas.', { d: 1 }),
      op('En un balneario, las tormentas se llevan la playa. ¿Qué medida atiende mejor la causa a largo plazo?', [ // e6
        'Recuperar y proteger las dunas',
        'Construir más edificios en la primera línea',
        ['Traer arena en camiones una vez', 'Ayuda un tiempo, pero si no se recuperan las dunas, la erosión sigue.'],
        'Pavimentar la playa para que no se vuele',
      ], 'Las soluciones basadas en la naturaleza, como recuperar dunas, atacan la causa y se mantienen solas.', { d: 3 }),
      numv(3, (i) => { // e7
        const m = [2, 1.5, 3][i];
        const a = [10, 20, 15][i];
        return {
          enunciado: `Una playa pierde ${m.toLocaleString('es-AR')} metros de ancho por año por erosión. ¿Cuántos metros pierde en ${a} años?`,
          valor: m * a,
          unidad: 'metros',
          explicacion: `${m.toLocaleString('es-AR')} × ${a} = ${(m * a).toLocaleString('es-AR')} metros. Un ritmo que parece chico por año, pero que en una generación puede hacer desaparecer una playa.`,
        };
      }, { d: 1 }),
      est('Estimá cuántos kilómetros de ancho tiene el Río de la Plata en su desembocadura.', 200, { min: 1, max: 1000, unidad: 'km', escala: 'log' }, 'Unos 200 kilómetros: por eso, desde la orilla, parece un mar. Es uno de los estuarios más anchos del mundo.', { d: 3 }),
      vf('Los estuarios son ambientes pobres en vida porque mezclan agua dulce y salada.', false, 'Son de los ambientes más productivos: reciben nutrientes de los ríos y del mar, y muchos peces se crían en ellos.', {
        razones: ['+Porque reciben nutrientes y son criaderos de peces', '-Porque el agua mezclada no permite la vida', '-Porque en los estuarios no hay luz'],
        d: 2,
      }),
      det('Leé este proyecto municipal y marcá lo que daña la costa.', [ // e8
        ['Pondremos pasarelas elevadas para cruzar las dunas.', false],
        ['Aplanaremos las dunas para ampliar el estacionamiento.', true, 'Sin dunas, la playa pierde su reserva de arena y se erosiona.'],
        ['Protegeremos la vegetación nativa costera.', false],
        ['Permitiremos circular con cuatriciclos sobre las dunas.', true, 'Destruyen la vegetación y desestabilizan las dunas.'],
      ], 'La costa es un sistema frágil. Cuidarlo es cuidar la playa y los pueblos costeros.', { d: 2 }),
      comp('Completá.', 'Donde un río se mezcla con el mar hay un [estuario]; las [dunas] protegen la costa; y la Bahía Samborombón es un sitio [Ramsar].', ['delta', 'rocas', 'industrial'], 'Tres ideas sobre las costas y sus ambientes de transición.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: el planeta azul', 'Océano, clima, vida marina, ríos y costas, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: la colonia y la costa', 'Un pueblo patagónico quiere promover el turismo cerca de una colonia de pingüinos. Evaluá el plan con lo que aprendiste.', [
      teoria('El plan', [
        'Un pueblo de la costa patagónica tiene cerca una colonia de pingüinos de Magallanes con unas 50.000 parejas. El municipio quiere más turismo: propone un camino de ripio hasta la colonia, un estacionamiento sobre las dunas, paseos en cuatriciclo por la playa y permitir a los visitantes acercarse a los nidos para sacar fotos.',
        'Frente a la costa, barcos pesqueros capturan anchoíta, el principal alimento de los pingüinos en la zona.',
      ]),
      num('¿Cuántos pingüinos adultos hay en la colonia, si cada pareja son dos?', 100000, 'pingüinos', '50.000 × 2 = 100.000 pingüinos adultos, sin contar pichones: una colonia muy grande y sensible.', { ctx: '50.000 parejas de pingüinos de Magallanes.', d: 1 }),
      mult('¿Qué partes del plan pueden dañar la colonia o la costa? Marcá todas.', [ // e2
        '+Estacionamiento sobre las dunas',
        '+Cuatriciclos en la playa',
        '+Acercarse a los nidos para las fotos',
        '+La pesca intensa de anchoíta cerca de la colonia',
        '-Un centro de visitantes lejos de las dunas',
      ], 'Casi todo el plan original daña. Un centro de visitantes bien ubicado, en cambio, puede educar y ordenar el turismo.', { d: 3 }),
      op('¿Cuál es una alternativa mejor para visitar la colonia?', [ // e3
        'Senderos marcados y pasarelas a distancia de los nidos',
        'Dejar que cada visitante camine libremente entre los nidos',
        ['Prohibir para siempre cualquier visita', 'Puede ser necesario en algunos lugares, pero el turismo ordenado también genera conciencia y recursos.'],
        'Llevar a los pingüinos a un recinto cerca del pueblo',
      ], 'El turismo ordenado protege a la colonia y permite que la gente la conozca.', { d: 3 }),
      cad('Armá la cadena de cómo el plan original podría afectar la colonia.', [ // e4
        'Aumentan los visitantes y los cuatriciclos',
        'Se pisan nidos y se asusta a los adultos',
        'Algunos pingüinos abandonan sus nidos',
        'Mueren huevos y pichones',
        'La colonia se reduce con los años',
      ], ['Los pingüinos se acostumbran y crían más'], 'El disturbio humano en la época de cría es una de las amenazas para las colonias.', { d: 3 }),
      rank('Ordená estas medidas por prioridad, de la primera a la última.', [ // e5
        ['Impedir el acceso a los nidos y a las dunas', 'evita daños inmediatos'],
        ['Senderos y pasarelas a distancia', 'ordena el turismo'],
        ['Acordar zonas sin pesca de anchoíta cerca de la colonia', 'protege el alimento'],
        ['Centro de visitantes y guías del pueblo', 'educa y genera trabajo'],
      ], 'Primero evitar el daño; después ordenar, proteger el alimento y aprovechar el turismo con cuidado.', { d: 4 }),
      clas('Clasificá los argumentos que se escuchan en el pueblo.', { // e6
        'Con fundamento': ['Sin anchoíta, los pingüinos no pueden alimentar a sus pichones', 'Las dunas protegen la playa de las tormentas', 'El turismo ordenado puede generar trabajo sin dañar la colonia'],
        'Sin fundamento': ['Los pingüinos no sienten a las personas', 'Las dunas son solo arena inútil', 'Con 100.000 pingüinos, perder algunos nidos no importa'],
      }, 'Decidir con datos y con la red de vida en mente.', { d: 3 }),
      det('El municipio reescribe su plan. Marcá lo que todavía no conviene.', [ // e7
        ['Senderos marcados y pasarelas a distancia de los nidos.', false],
        ['El estacionamiento se hará igual sobre las dunas, porque es más barato.', true, 'Destruir dunas pone en riesgo la playa y el ambiente costero.'],
        ['Guías del pueblo acompañarán las visitas.', false],
        ['Los cuatriciclos podrán circular por la playa fuera de la temporada de cría.', true, 'Igual dañan dunas y vegetación, y la playa es usada por otras especies.'],
      ], 'Un buen plan protege la colonia, la costa y el alimento, y aprovecha el turismo con reglas claras.', { d: 3 }),
    ]),
  ],
});
