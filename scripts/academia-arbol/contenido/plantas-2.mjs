import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// PLANTAS 2 — Nativas, exóticas e invasoras.
// Qué es una planta nativa, las ecorregiones de Argentina, por qué las
// nativas sostienen a la fauna local, cómo algunas exóticas se vuelven
// invasoras y cómo elegir plantas para un jardín, un balcón o una vereda.
// Retoma los sistemas y los efectos que viajan (tronco-1).

export default unidad({
  slug: 'plantas-2',
  rama: 'plantas',
  orden: 2,
  nivel: 1,
  requiereTronco: 1,
  titulo: 'Nativas, exóticas e invasoras',
  bajada: 'No todas las plantas verdes hacen lo mismo por tu barrio. Qué es una nativa, por qué importa y qué pasa cuando una exótica se escapa.',
  objetivos: [
    'Distinguir plantas nativas, exóticas, naturalizadas e invasoras',
    'Reconocer las principales ecorregiones de Argentina',
    'Explicar la relación entre plantas nativas y fauna local',
    'Describir cómo una especie exótica se vuelve invasora y sus impactos',
    'Elegir plantas adecuadas para un espacio según su ecorregión',
  ],
  repasa: ['plantas-1', 'tronco-1'],
  fuentes: ['ecorregiones-pba', 'plantas-nativas', 'invasoras-mayds', 'ipbes-global', 'sib-apn', 'reserva-costanera-sur'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Qué es una planta nativa', 'Nativas, exóticas y naturalizadas: tres palabras para saber de dónde viene lo que crece a tu alrededor.', [
      teoria('Nativa y exótica', [
        'Una planta nativa (o autóctona) es la que crece naturalmente en una región desde antes de que las personas la trasladaran: evolucionó ahí durante miles o millones de años, junto con el clima, el suelo y los animales del lugar.',
        'Una planta exótica es la que llegó de otra región o de otro continente, traída por las personas a propósito (para jardines, cultivos, forestación) o por accidente. Que una planta sea exótica no la hace mala: el trigo, la lechuga o la zanahoria de la huerta son exóticos en Argentina.',
      ]),
      clas('¿Es nativa de Argentina o exótica?', { // e1
        'Nativa de Argentina': ['Ceibo', 'Algarrobo', 'Lapacho', 'Tala'],
        'Exótica': ['Eucalipto', 'Plátano de las veredas', 'Ligustro', 'Pino'],
      }, 'Muchos árboles comunes de las ciudades argentinas son exóticos. El eucalipto viene de Australia; el plátano, del hemisferio norte.', { d: 2 }),
      teoria('Nativa de dónde', [
        'Ser nativa depende de la escala. El lapacho es nativo de Argentina, pero del noreste y el noroeste, no de la Patagonia. Una planta nativa de las Yungas puede ser exótica en la Pampa.',
        'Por eso, cuando se habla de plantar nativas, lo ideal es elegir las de la propia ecorregión: la zona con clima, suelo y especies parecidas donde uno vive.',
      ]),
      vf('Si una planta es nativa de Argentina, es nativa de cualquier lugar del país.', false, 'Argentina tiene regiones muy distintas. Una planta de la selva misionera puede ser exótica en la estepa patagónica. Lo ideal es pensar en la ecorregión.', { // e2
        razones: ['+Porque cada región tiene sus propias especies según clima y suelo', '-Porque todas las plantas argentinas crecen igual en todo el país', '-Porque las nativas no dependen del clima'],
        d: 2,
      }),
      teoria('Naturalizadas', [
        'Algunas exóticas se "naturalizan": se reproducen solas en el lugar nuevo sin ayuda de las personas. Muchas se quedan en lugares alterados, como bordes de caminos, y no causan grandes problemas.',
        'Otras se expanden sin control, desplazan a las nativas y cambian el ecosistema: esas son las invasoras, que vas a ver en esta unidad.',
      ]),
      ord('Ordená los pasos típicos de una planta exótica que se vuelve invasora.', [ // e3
        'Llega de otro continente traída por personas',
        'Se planta en jardines o plazas',
        'Empieza a reproducirse sola fuera de los jardines',
        'Se expande y desplaza a las plantas nativas',
      ], 'No todas las exóticas recorren todo el camino. Las que llegan al último paso son las invasoras.', { d: 2, extremos: ['Primero', 'Último'] }),
      par('Uní cada término con su definición.', [ // e4
        ['Nativa', 'Evolucionó en la región sin intervención humana'],
        ['Exótica', 'Llegó de otra región traída por personas'],
        ['Naturalizada', 'Exótica que se reproduce sola'],
        ['Invasora', 'Exótica que se expande y desplaza a las nativas'],
      ], 'Cuatro palabras que ordenan cualquier conversación sobre plantas y biodiversidad.', { d: 2 }),
      mult('¿Cuáles de estas afirmaciones sobre las plantas exóticas son correctas? Marcá todas.', [ // e5
        '+Muchos cultivos de alimentos son exóticos',
        '+Algunas se vuelven invasoras',
        '+Llegaron traídas por personas, a propósito o por accidente',
        '-Todas las exóticas son dañinas',
        '-Ninguna exótica puede reproducirse sola',
      ], 'Exótica no es sinónimo de dañina. El problema son las que se vuelven invasoras.', { d: 2 }),
      op('Una vecina dice que el jacarandá es nativo de Buenos Aires porque hay miles en las calles. ¿Qué le responderías?', [ // e6
        'Es nativo, pero del noroeste argentino',
        'Tiene razón: si hay muchos, es nativo del lugar',
        ['Es de Australia, como el eucalipto', 'El jacarandá sí es sudamericano: crece naturalmente en el noroeste argentino y Bolivia.'],
        'Es una planta invasora que llegó de Europa',
      ], 'Que haya muchos no lo hace nativo: se plantaron. Es nativo de Argentina, pero de otra ecorregión.', { d: 3 }),
      det('Leé este cartel de una plaza y marcá lo equivocado.', [ // e7
        ['El ceibo es la flor nacional argentina.', false],
        ['Todos los árboles de esta plaza son nativos porque crecen bien acá.', true, 'Crecer bien no significa ser nativo: muchas exóticas se adaptan muy bien.'],
        ['El eucalipto vino de Australia.', false],
        ['Las plantas exóticas siempre son invasoras.', true, 'Solo algunas exóticas se vuelven invasoras.'],
      ], 'Nativa, exótica e invasora son categorías distintas. Confundirlas lleva a malas decisiones.', { d: 2 }),
      comp('Completá.', 'Una planta [nativa] evolucionó en la región; una [exótica] llegó traída por personas; y si se expande y desplaza a las nativas, es [invasora].', ['híbrida', 'podada', 'anual'], 'Las tres categorías básicas, en una sola línea.', { d: 1 }),
      clas('¿Es nativa de la región pampeana o de otra región del país?', {
        'Región pampeana y alrededores': ['Tala', 'Coronillo', 'Ceibo'],
        'Otra región argentina': ['Lenga', 'Lapacho', 'Jacarandá'],
      }, 'Todas son argentinas, pero no todas son de la misma ecorregión. Para un jardín en la Pampa, conviene la primera columna.', { d: 3 }),
      op('¿Cuál de estos alimentos es exótico en América del Sur, es decir, se originó en otro continente?', [
        'El trigo',
        'El maní',
        ['El zapallo', 'El zapallo criollo se domesticó en América del Sur, a partir de parientes silvestres que crecen en la región.'],
        'La papa',
      ], 'El trigo llegó de Medio Oriente. El maní, el zapallo y la papa son aportes de América del Sur al mundo.', { d: 3 }),
      est('Estimá cuántas especies de plantas vasculares nativas tiene Argentina.', 10000, { min: 100, max: 100000, unidad: 'especies', escala: 'log' }, 'Alrededor de diez mil, según los catálogos de la flora argentina. Una riqueza enorme que muchas veces no se ve en plazas y jardines.', { d: 3 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Las ecorregiones de Argentina', 'De la selva a la estepa, de la Puna al Delta: las grandes regiones naturales del país y sus plantas.', [
      teoria('Un país de muchos paisajes', [
        'Una ecorregión es un territorio con un clima, un relieve, un suelo y unas especies características. Argentina tiene 18 ecorregiones, 15 de ellas continentales: entre otras, la Selva Paranaense, las Yungas, el Chaco Seco y el Chaco Húmedo, el Espinal, la Pampa, el Delta e Islas del Paraná, el Monte, la Puna, los Altos Andes, la Estepa Patagónica y los Bosques Patagónicos.',
        'Cada ecorregión tiene su propia flora. Conocer la de tu zona es el primer paso para elegir plantas nativas.',
      ], { destacado: { valor: '18', texto: 'ecorregiones tiene Argentina, desde selvas subtropicales hasta el Mar Argentino y la Antártida.' } }),
      par('Uní cada ecorregión con un rasgo característico.', [ // e1
        ['Selva Paranaense', 'Selva húmeda con lapachos y palmitos'],
        ['Yungas', 'Selvas de montaña en el noroeste'],
        ['Pampa', 'Pastizales en llanuras'],
        ['Estepa Patagónica', 'Arbustos bajos y pastos duros con viento'],
      ], 'Cuatro de las 18. Cada una con plantas adaptadas a su clima.', { d: 2 }),
      teoria('La Pampa, un pastizal', [
        'La Pampa, donde viven millones de personas, era originalmente un pastizal: una llanura de pastos y hierbas, casi sin árboles, con algunos bosques de tala en las barrancas y lomas. Hoy casi toda está transformada en campos de cultivo y ciudades, y los pastizales naturales que quedan son muy pocos.',
        'Por eso, en la región pampeana, "plantar nativas" no es solo plantar árboles: también es recuperar pastos y hierbas del pastizal, que alimentan a muchos insectos y aves.',
      ]),
      vf('La región pampeana estaba cubierta originalmente por un bosque denso.', false, 'Era sobre todo un pastizal, con bosques de tala en algunas barrancas y lomas. Muchos árboles que hoy se ven fueron plantados.', { // e2
        razones: ['+Porque era sobre todo un pastizal con pocos árboles', '-Porque los árboles de las rutas son todos nativos', '-Porque la Pampa siempre fue un desierto sin plantas'],
        d: 2,
      }),
      teoria('Los bosques del norte y del sur', [
        'En el norte están los bosques más extensos del país: el Chaco, con quebrachos y algarrobos, y las selvas de las Yungas y la Paranaense, con una enorme diversidad. En el sur, los Bosques Patagónicos, con lengas, coihues, ñires y el pehuén, la araucaria que da piñones.',
        'Entre ellos, el Espinal forma un arco de bosques bajos de algarrobos, ñandubay, caldén y espinillo alrededor de la Pampa.',
      ]),
      clas('¿En qué zona es nativo cada árbol?', { // e3
        'Norte (Chaco, Yungas o Selva Paranaense)': ['Quebracho colorado', 'Lapacho', 'Palo borracho'],
        'Sur (Bosques Patagónicos)': ['Lenga', 'Coihue', 'Pehuén'],
      }, 'Dos mundos forestales muy distintos: subtropicales en el norte, fríos en el sur.', { d: 2 }),
      teoria('Zonas secas', [
        'Una parte grande del país es árida o semiárida: el Monte, la Puna y la Estepa Patagónica. Allí las plantas tienen adaptaciones para ahorrar agua: hojas chicas o resinosas, espinas, raíces muy profundas o muy extendidas. Algunas, como la jarilla, cubren enormes extensiones.',
        'Estas plantas son ideales para jardines de zonas secas: una vez establecidas, casi no necesitan riego.',
      ]),
      mult('¿Qué adaptaciones tienen muchas plantas de zonas secas? Marcá todas.', [ // e4
        '+Hojas chicas',
        '+Espinas en lugar de hojas',
        '+Raíces muy profundas o extendidas',
        '+Hojas cubiertas de resina o pelos',
        '-Hojas enormes y finas',
      ], 'Todas las adaptaciones apuntan a lo mismo: perder menos agua o conseguir más.', { d: 2 }),
      ord('Ordená estas ecorregiones de norte a sur.', [ // e5
        'Selva Paranaense',
        'Espinal',
        'Pampa',
        'Estepa Patagónica',
      ], 'Un recorrido del trópico húmedo a la estepa fría y ventosa.', { d: 3, extremos: ['Norte', 'Sur'] }),
      op('Vivís en Mendoza, en el Monte. ¿Qué plantas conviene elegir para un jardín que ahorre agua?', [ // e6
        'Nativas del Monte, como jarilla o algarrobo',
        'Césped inglés regado todos los días',
        ['Plantas de la Selva Paranaense, porque son nativas', 'Son nativas de Argentina, pero de una selva húmeda: en Mendoza necesitarían muchísima agua.'],
        'Helechos tropicales de sombra',
      ], 'Nativas de la propia ecorregión: adaptadas al clima, con poca necesidad de riego.', { d: 2 }),
      cad('Armá la cadena de por qué la Pampa perdió casi todos sus pastizales.', [ // e7
        'Sus suelos son muy fértiles',
        'Se volvieron muy valiosos para la agricultura y la ganadería',
        'Los pastizales se araron o se reemplazaron',
        'Hoy quedan muy pocos pastizales naturales',
      ], ['Los pastizales se secaron solos por falta de lluvia'], 'La misma fertilidad que hizo rica a la región hizo que su ecosistema original casi desapareciera.', { d: 2 }),
      det('Leé esta descripción y marcá lo equivocado.', [ // e8
        ['Argentina tiene 18 ecorregiones.', false],
        ['La Pampa era originalmente una selva.', true, 'Era un pastizal, con pocos árboles.'],
        ['El pehuén es nativo de los Bosques Patagónicos.', false],
        ['Las plantas del Monte necesitan mucha agua.', true, 'Están adaptadas a la aridez y necesitan muy poca.'],
      ], 'Cada ecorregión tiene su lógica. Conocerla evita errores al plantar.', { d: 2 }),
      comp('Completá.', 'La Pampa era originalmente un [pastizal]; los quebrachos crecen en el [Chaco]; y las lengas, en los bosques [patagónicos].', ['selva', 'Delta', 'pampeanos'], 'Tres ecorregiones del país, con tres paisajes muy distintos.', { d: 2 }),
      numv(3, (i) => { // e10
        const total = [100, 50, 200][i];
        const queda = [3, 2, 5][i];
        return {
          enunciado: `En una zona había ${total} mil hectáreas de pastizal natural y hoy quedan ${queda} mil. ¿Qué porcentaje del pastizal original queda?`,
          valor: (queda / total) * 100,
          unidad: '%',
          dec: 1,
          explicacion: `${queda} ÷ ${total} × 100 = ${((queda / total) * 100).toLocaleString('es-AR')} %. En muchas zonas de la Pampa, lo que queda de pastizal natural es un porcentaje muy chico.`,
        };
      }, { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Por qué importan las nativas', 'Mariposas que solo comen una planta, aves que dependen de frutos del lugar: la red que se arma con las nativas.', [
      teoria('Evolucionar juntos', [
        'Las plantas nativas y los animales del lugar evolucionaron juntos durante miles de años. Muchos insectos solo pueden alimentarse de ciertas plantas: sus orugas no pueden comer otra cosa. Muchas aves se alimentan de frutos e insectos de las plantas nativas.',
        'Cuando se reemplazan las nativas por exóticas, el paisaje sigue verde, pero se rompe esa red: hay menos insectos, menos aves y menos polinizadores.',
      ]),
      teoria('Mariposas y sus plantas', [
        'La mariposa bandera argentina, celeste y blanca, pone sus huevos en el coronillo, un arbusto nativo: sin coronillo, no hay bandera argentina. La mariposa espejito cría sus orugas en la pasionaria, una enredadera nativa. Muchas otras mariposas dependen de plantas específicas.',
        'A esas plantas se las llama plantas hospederas. Un jardín con flores exóticas puede alimentar a mariposas adultas con néctar, pero sin plantas hospederas nativas no nacen mariposas nuevas.',
      ]),
      par('Uní cada mariposa con su planta hospedera.', [ // e1
        ['Bandera argentina', 'Coronillo'],
        ['Espejito', 'Pasionaria'],
        ['Monarca', 'Asclepias'],
      ], 'Sin la planta hospedera, la mariposa no puede completar su ciclo. Es una relación de miles de años.', { d: 2 }),
      cad('Armá la cadena de qué pasa si en un barrio desaparecen los coronillos.', [ // e2
        'Se reemplazan los coronillos por arbustos exóticos',
        'La bandera argentina no tiene dónde poner huevos',
        'No nacen orugas nuevas',
        'La mariposa desaparece del barrio',
      ], ['La mariposa se adapta a comer plástico'], 'Una planta menos puede significar una especie menos. Los efectos viajan por la red.', { d: 2 }),
      vf('Un jardín lleno de flores exóticas con néctar alcanza para que las mariposas se reproduzcan.', false, 'El néctar alimenta a las adultas, pero muchas orugas solo pueden comer ciertas plantas nativas. Sin plantas hospederas, no hay mariposas nuevas.', { // e3
        razones: ['+Porque las orugas necesitan plantas hospederas específicas', '-Porque las mariposas no toman néctar', '-Porque las mariposas nacen de las flores'],
        d: 3,
      }),
      teoria('Adaptadas al lugar', [
        'Las nativas están adaptadas al clima y al suelo de su ecorregión: soportan sus sequías, sus heladas y sus plagas. Una vez establecidas, suelen necesitar menos riego, menos fertilizante y menos cuidados que muchas exóticas.',
        'Además, forman parte de la identidad de cada región: el ceibo en el Delta, el algarrobo en el Chaco y el Monte, la lenga en la Patagonia.',
      ]),
      mult('¿Qué ventajas tienen las plantas nativas de tu ecorregión? Marcá todas.', [ // e4
        '+Alimentan a insectos y aves del lugar',
        '+Están adaptadas al clima y al suelo',
        '+Suelen necesitar menos riego una vez establecidas',
        '+Forman parte de la identidad del paisaje',
        '-Nunca necesitan ningún cuidado, ni al plantarlas',
      ], 'Al principio necesitan riego y cuidado como cualquier planta. Después, mucho menos que muchas exóticas.', { d: 2 }),
      teoria('Corredores de vida', [
        'Un jardín o un balcón con nativas es chico, pero muchos juntos forman corredores: caminos de plantas que permiten a insectos y aves moverse por la ciudad entre reservas, plazas y arroyos.',
        'En varias ciudades argentinas hay proyectos de corredores de nativas, donde vecinos, escuelas y municipios suman plantas nativas en veredas, plazas y patios.',
      ]),
      op('¿Qué es un corredor de nativas en una ciudad?', [ // e5
        'Una serie de espacios con nativas que conecta hábitats',
        'Una calle exclusiva para plantar árboles exóticos',
        ['Un vivero que vende solo plantas de otros países', 'Los corredores son redes de espacios verdes con nativas, no viveros.'],
        'Una pista de atletismo rodeada de césped',
      ], 'Muchos espacios chicos, conectados, funcionan como un hábitat grande para la fauna.', { d: 2 }),
      clas('¿Esta planta alimenta a la fauna nativa o casi no la alimenta?', { // e6
        'La alimenta mucho': ['Tala con frutos para aves', 'Pasionaria para orugas de mariposa', 'Salvia nativa con néctar para picaflores'],
        'Casi no la alimenta': ['Césped corto sin flores', 'Arbusto exótico podado en forma de bola', 'Plantas de plástico'],
      }, 'Lo verde no siempre es hábitat. Lo que importa es qué ofrece a la fauna.', { d: 2 }),
      rank('Ordená estos espacios según cuánto hábitat ofrecen a la fauna nativa, de más a menos.', [ // e7
        ['Jardín con nativas de varios tamaños y flores', 'mucho hábitat'],
        ['Plaza con árboles nativos y césped', 'hábitat medio'],
        ['Plaza con árboles exóticos y césped', 'poco hábitat'],
        ['Patio de cemento', 'casi nada'],
      ], 'Variedad de nativas y estructura (pastos, arbustos, árboles) es lo que más hábitat crea.', { d: 2, extremos: ['Más', 'Menos'] }),
      det('Leé este folleto de un vivero y marcá lo engañoso.', [ // e8
        ['Las nativas están adaptadas al clima de la región.', false],
        ['Las nativas no necesitan agua nunca, ni recién plantadas.', true, 'Al principio necesitan riego como cualquier planta; después, menos.'],
        ['Algunas mariposas dependen de plantas nativas específicas.', false],
        ['Cualquier planta verde sirve igual a la fauna.', true, 'No: la fauna nativa depende mucho de las plantas nativas.'],
      ], 'Las nativas ayudan mucho, pero no son mágicas.', { d: 2 }),
      comp('Completá.', 'Las plantas de las que se alimentan las orugas se llaman plantas [hospederas]; la bandera argentina depende del [coronillo].', ['exóticas', 'eucalipto', 'césped'], 'Una relación que explica por qué las nativas importan.', { d: 2 }),
      vf('Un balcón con plantas nativas no sirve para nada porque es muy chico.', false, 'Muchos espacios chicos juntos forman corredores. Un balcón con nativas puede alimentar a mariposas, abejas nativas y picaflores.', { // e10
        razones: ['+Porque muchos espacios chicos juntos forman corredores', '-Porque los insectos no vuelan a los balcones', '-Porque las nativas no crecen en macetas'],
        d: 2,
      }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Exóticas que invaden', 'Ligustros, acacias negras, pinos y rosas mosqueta: cómo algunas plantas traídas se vuelven un problema serio.', [
      teoria('Qué es una invasora', [
        'Una especie exótica invasora es una especie traída de otra región que se reproduce sola, se expande y causa daño: desplaza a especies nativas, cambia cómo funciona el ecosistema o provoca pérdidas económicas o problemas de salud.',
        'Según la IPBES, la plataforma científica internacional sobre biodiversidad, las especies invasoras son una de las cinco grandes causas directas de pérdida de biodiversidad en el mundo.',
      ]),
      mult('¿Qué hace que una exótica sea considerada invasora? Marcá todo lo que corresponde.', [ // e1
        '+Se reproduce sola fuera de los jardines',
        '+Se expande en ambientes naturales',
        '+Desplaza a especies nativas',
        '+Causa daños al ecosistema o a la economía',
        '-Tiene flores muy lindas',
      ], 'Que sea linda o útil no importa: lo que la define es que se expande y daña.', { d: 2 }),
      teoria('Por qué algunas ganan', [
        'En su lugar de origen, una planta convive con insectos, hongos y animales que la comen o la enferman, y eso la mantiene a raya. Al llegar a un lugar nuevo, muchas veces esos enemigos no están. Si además produce muchas semillas que dispersan las aves o el viento, y crece rápido, puede ganarle a las nativas.',
      ]),
      cad('Armá la cadena de cómo el ligustro invade un bosque nativo.', [ // e2
        'Se planta ligustro en cercos y veredas',
        'Produce muchísimos frutos',
        'Las aves comen los frutos y dispersan las semillas',
        'Crecen ligustros dentro del bosque nativo',
        'Su sombra densa impide crecer a las nativas',
      ], ['El ligustro se queda siempre en el cerco'], 'El ligustro invade las sierras de Córdoba, las Yungas y el Delta, entre otras zonas. Empezó siendo un cerco.', { d: 2 }),
      teoria('Ejemplos argentinos', [
        'El ligustro, un árbol asiático, forma bosques densos que reemplazan a los nativos en las sierras de Córdoba, las Yungas y otras zonas. La acacia negra, de América del Norte, invade pastizales y riberas con sus espinas enormes. En la Patagonia, los pinos plantados se expanden sobre la estepa y aumentan el riesgo de incendios, y la rosa mosqueta y la retama cubren laderas.',
        'También hay animales invasores, como el castor en Tierra del Fuego o el jabalí en muchas regiones, que vas a ver en la rama de Animales.',
      ]),
      par('Uní cada invasora con la zona donde es un problema.', [ // e3
        ['Ligustro', 'Sierras de Córdoba y Yungas'],
        ['Pinos', 'Estepa patagónica'],
        ['Acacia negra', 'Pastizales y riberas de la región pampeana'],
        ['Rosa mosqueta', 'Laderas de la Patagonia'],
      ], 'Casi todas llegaron como ornamentales o forestales. Ninguna llegó como "invasora".', { d: 3 }),
      vf('Las plantas invasoras llegaron a Argentina por sí solas, sin ayuda de las personas.', false, 'Casi todas fueron traídas por personas: para jardines, forestación, cercos o de forma accidental. Por eso prevenir es tan importante.', { // e4
        razones: ['+Porque casi todas fueron traídas por personas', '-Porque las semillas cruzan el océano volando', '-Porque ninguna planta viaja con las personas'],
        d: 2,
      }),
      teoria('Prevenir es más barato', [
        'Una vez que una invasora se expande, controlarla es carísimo y a veces imposible. Por eso la prevención es la mejor herramienta: no plantar especies con historial invasor, informarse antes de comprar y avisar cuando aparecen en lugares nuevos.',
        'Argentina tiene una lista oficial de especies exóticas invasoras, y algunas provincias prohíben plantar ciertas especies.',
      ]),
      ord('Ordená las estrategias contra las invasoras de la más barata a la más cara.', [ // e5
        'Prevenir: no traerla ni plantarla',
        'Detectar temprano: sacar los primeros ejemplares',
        'Contener: evitar que siga avanzando',
        'Restaurar: sacarla de áreas grandes y replantar nativas',
      ], 'Cada paso más tarde cuesta mucho más. La prevención es casi gratis.', { d: 2, extremos: ['Más barata', 'Más cara'] }),
      clas('¿Esta acción ayuda a prevenir invasiones o las favorece?', { // e6
        'Ayuda a prevenir': ['Consultar la lista oficial de invasoras antes de comprar', 'Elegir nativas para un cerco', 'Arrancar plantines de ligustro en una reserva con permiso'],
        'Las favorece': ['Tirar restos de poda de ornamentales en un arroyo', 'Plantar acacia negra como cerco vivo', 'Regalar semillas de plantas invasoras'],
      }, 'Muchas invasiones empiezan en jardines y cercos. Ahí también se previenen.', { d: 2 }),
      op('¿Por qué las plantas invasoras muchas veces crecen mejor que en su lugar de origen?', [ // e7
        'Porque no están sus enemigos naturales',
        'Porque el suelo argentino es siempre más fértil',
        ['Porque las nativas son plantas débiles', 'Las nativas no son débiles: están en equilibrio con sus propios enemigos.'],
        'Porque las riegan más que a las nativas',
      ], 'Sin los insectos y enfermedades que las controlan en su origen, algunas se expanden sin freno.', { d: 2 }),
      numv(3, (i) => { // e8
        const ha = [10, 25, 5][i];
        const crece = [20, 10, 50][i];
        return {
          enunciado: `Una mancha de ligustro ocupa ${ha} hectáreas y crece un ${crece} % por año. ¿Cuántas hectáreas ocupará en un año?`,
          valor: ha * (1 + crece / 100),
          unidad: 'hectáreas',
          dec: 1,
          explicacion: `${ha} × ${(1 + crece / 100).toLocaleString('es-AR')} = ${(ha * (1 + crece / 100)).toLocaleString('es-AR')} ha. Y el año siguiente crece sobre esa superficie mayor: por eso actuar temprano es clave.`,
        };
      }, { d: 2 }),
      det('Leé este comentario y marcá lo equivocado.', [ // e9
        ['El ligustro se dispersa con las aves que comen sus frutos.', false],
        ['Como es lindo y crece rápido, es ideal para cualquier cerco.', true, 'Es una invasora: sus semillas escapan del cerco e invaden bosques.'],
        ['Las invasoras son una de las grandes causas de pérdida de biodiversidad.', false],
        ['Si una invasora ya se expandió, es barato sacarla.', true, 'Controlar una invasión avanzada es muy caro y a veces imposible.'],
      ], 'Prevenir es la mejor herramienta, y empieza por lo que se planta.', { d: 3 }),
      comp('Completá.', 'Las especies invasoras son una de las [cinco] grandes causas directas de pérdida de biodiversidad; contra ellas, lo más barato es [prevenir].', ['diez', 'restaurar', 'fumigar'], 'La idea central de la lección sobre especies invasoras.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Elegir nativas', 'Cómo elegir, conseguir y cuidar plantas nativas para un jardín, un balcón, una vereda o una escuela.', [
      teoria('Primero, la ecorregión', [
        'Para elegir nativas, el primer paso es saber en qué ecorregión estás. Hay guías y mapas oficiales y de organizaciones que muestran las ecorregiones y las plantas de cada una. Después conviene mirar el espacio: cuánto sol recibe, si es húmedo o seco, cuánto lugar hay para que crezca.',
        'Una planta nativa en el lugar equivocado puede sufrir igual que una exótica: un árbol de selva al sol pleno de una vereda seca, o un cactus en un rincón húmedo y oscuro.',
      ]),
      ord('Ordená los pasos para elegir nativas para un espacio.', [ // e1
        'Averiguar la ecorregión',
        'Observar el sol, la humedad y el espacio disponible',
        'Buscar nativas de la ecorregión que se adapten a esas condiciones',
        'Conseguirlas en un vivero de nativas',
        'Plantarlas y regarlas hasta que se establezcan',
      ], 'Ecorregión, lugar, especie, vivero y cuidado inicial.', { d: 1, extremos: ['Primero', 'Último'] }),
      teoria('Dónde conseguirlas', [
        'Cada vez hay más viveros que producen nativas, incluidos viveros municipales, de universidades y de organizaciones. También se pueden conseguir semillas y hacer plantines en casa.',
        'Lo que no hay que hacer es sacar plantas de ambientes naturales: se daña el lugar, muchas veces la planta no sobrevive al trasplante y, en áreas protegidas, está prohibido.',
      ]),
      vf('Sacar plantas nativas de una reserva natural es una buena forma de conseguirlas para el jardín.', false, 'Daña el ambiente, muchas veces la planta muere y en áreas protegidas está prohibido. Lo correcto es un vivero de nativas o semillas obtenidas de forma responsable.', { // e2
        razones: ['+Porque daña el ambiente y en áreas protegidas está prohibido', '-Porque las plantas de las reservas son todas exóticas', '-Porque las nativas no se pueden trasplantar nunca'],
        d: 1,
      }),
      teoria('Árboles para la vereda', [
        'Un árbol de vereda tiene que convivir con cables, veredas, casas y personas. Conviene elegir especies de tamaño adecuado al ancho de la vereda, con raíces que no levanten el piso y que no sean invasoras. Muchos municipios tienen un listado de especies recomendadas para el arbolado.',
        'En el área metropolitana de Buenos Aires se usan nativas como el timbó (para espacios grandes), la anacahuita, el chal chal, el ceibo y el tala, entre otras.',
      ]),
      mult('¿Qué hay que tener en cuenta para elegir un árbol de vereda? Marcá todo.', [ // e3
        '+El tamaño que va a tener de adulto',
        '+El ancho de la vereda y los cables',
        '+Que no sea una especie invasora',
        '+Las especies que recomienda el municipio',
        '-Que sea el que crece más rápido, sin importar el tamaño final',
      ], 'El árbol correcto en el lugar correcto dura décadas sin problemas. El incorrecto termina podado o arrancado.', { d: 2 }),
      op('En una vereda angosta con cables, ¿qué conviene plantar?', [ // e4
        'Un árbol nativo de porte chico o mediano',
        'Un timbó, que puede superar los 20 metros',
        ['Un eucalipto, porque crece rápido', 'Crece rápido, pero es enorme, exótico y no apto para veredas angostas.'],
        'Un ligustro, porque es resistente',
      ], 'Un árbol grande en una vereda angosta termina mutilado por las podas. Mejor uno adecuado desde el principio.', { d: 2 }),
      teoria('Balcones y macetas', [
        'En un balcón se pueden tener muchas nativas en macetas: hierbas y flores como verbenas, salvias y margaritas nativas, enredaderas como la pasionaria, y hasta pequeños arbustos. Atraen mariposas, abejas nativas y picaflores.',
        'Las macetas se secan más rápido que el suelo, así que conviene agruparlas, usar macetas grandes y mulch (una capa de hojas o corteza sobre la tierra).',
      ]),
      clas('¿Es una buena práctica para nativas en macetas o no?', { // e5
        'Buena práctica': ['Usar macetas grandes', 'Agrupar las macetas', 'Cubrir la tierra con mulch'],
        'Mala práctica': ['Macetas sin agujeros de drenaje', 'Plantas de selva al sol pleno del mediodía', 'Regar todos los días sin mirar la tierra'],
      }, 'Las nativas también necesitan la maceta y el lugar correctos.', { d: 2 }),
      par('Uní cada espacio con una opción nativa adecuada (zona pampeana).', [ // e6
        ['Balcón soleado', 'Verbenas y salvias nativas'],
        ['Reja o alambrado', 'Pasionaria'],
        ['Vereda angosta', 'Árbol nativo de porte chico'],
        ['Jardín grande', 'Tala o timbó'],
      ], 'Hay nativas para casi cualquier espacio. La clave es el tamaño y las condiciones.', { d: 2 }),
      cad('Armá la cadena de cómo un balcón con nativas ayuda a la biodiversidad.', [ // e7
        'Se plantan pasionaria y salvias nativas en el balcón',
        'Llegan mariposas espejito y picaflores',
        'La espejito pone huevos en la pasionaria',
        'Nacen orugas y después mariposas nuevas',
      ], ['Las mariposas fabrican la pasionaria'], 'Un balcón puede ser una guardería de mariposas.', { d: 2 }),
      det('Leé este plan de un vecino y marcá lo que no conviene.', [ // e8
        ['Voy a averiguar mi ecorregión.', false],
        ['Voy a sacar plantas de la reserva de la costa para mi jardín.', true, 'Está prohibido y daña el ambiente; mejor un vivero de nativas.'],
        ['Voy a poner una pasionaria en la reja.', false],
        ['Voy a plantar un timbó en la vereda angosta con cables.', true, 'El timbó es enorme: necesita mucho espacio.'],
      ], 'Buenas intenciones, mejores con información.', { d: 2 }),
      comp('Completá.', 'Para elegir nativas, primero hay que saber la [ecorregión]; se consiguen en [viveros], nunca sacándolas de una [reserva].', ['provincia', 'ferreterías', 'plaza'], 'Tres reglas para empezar bien un jardín de nativas.', { d: 1 }),
      numv(3, (i) => { // e10
        const m = [6, 4, 8][i];
        const pm = [2, 1, 3][i];
        return {
          enunciado: `Un balcón tiene ${m} metros de largo. Si se pone una maceta de nativas cada ${pm === 1 ? 'metro' : `${pm} metros`}, ¿cuántas macetas entran?`,
          valor: m / pm,
          unidad: 'macetas',
          explicacion: `${m} ÷ ${pm} = ${m / pm} macetas. Agruparlas ayuda a que conserven la humedad y formen un pequeño hábitat.`,
        };
      }, { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: nativas, exóticas e invasoras', 'Categorías, ecorregiones, relaciones con la fauna, invasoras y elección de plantas, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el cantero de la escuela', 'Una escuela de la zona pampeana quiere transformar su cantero en un jardín de nativas. Revisá el plan y armalo bien.', [
      teoria('El cantero', [
        'La escuela tiene un cantero de 20 metros cuadrados, con sol la mitad del día, en la zona pampeana. Hoy tiene césped, dos ligustros grandes y un eucalipto chico. Quieren atraer mariposas y aves, gastar poca agua y que los chicos aprendan.',
        'Tienen presupuesto para 25 plantas y un vivero municipal de nativas a pocas cuadras.',
      ]),
      op('¿Qué conviene hacer con los ligustros?', [ // e1
        'Reemplazarlos de a poco por nativas, porque son invasores',
        'Dejarlos y plantar más ligustros para que den sombra',
        ['Dejarlos, porque todo árbol es bueno para la fauna', 'El ligustro es invasor: sus semillas escapan y afectan bosques y reservas.'],
        'Cortarles solo las ramas bajas y conservarlos siempre',
      ], 'Reemplazar invasoras por nativas evita que sigan dispersando semillas. Hacerlo de a poco permite mantener sombra mientras crecen las nuevas.', { d: 3 }),
      mult('¿Qué plantas convienen para el cantero? Marcá todas las adecuadas.', [ // e2
        '+Coronillo, hospedera de la bandera argentina',
        '+Pasionaria en el alambrado',
        '+Salvias y verbenas nativas para el néctar',
        '+Pastos nativos del pastizal',
        '-Más eucaliptos para que crezca rápido',
      ], 'Hospederas, néctar y pastos: un pequeño pedazo de pastizal y espinal en la escuela.', { d: 3 }),
      numv(3, (i) => { // e3
        const plantas = [25, 30, 20][i];
        const m2 = 20;
        return {
          enunciado: `Si se reparten ${plantas} plantas en los ${m2} m² del cantero, ¿cuántas plantas por m² son? Redondeá a un decimal.`,
          valor: Math.round((plantas / m2) * 10) / 10,
          unidad: 'plantas por m²',
          dec: 1,
          explicacion: `${plantas} ÷ ${m2} ≈ ${(Math.round((plantas / m2) * 10) / 10).toLocaleString('es-AR')} plantas por m². Una densidad razonable para que crezcan sin taparse y cubran el suelo con el tiempo.`,
        };
      }, { d: 2 }),
      ord('Ordená los pasos del proyecto.', [ // e4
        'Averiguar qué nativas de la ecorregión se adaptan al lugar',
        'Conseguir las plantas en el vivero municipal',
        'Retirar el césped de una parte y preparar la tierra',
        'Plantar y cubrir con mulch',
        'Regar hasta que se establezcan y registrar qué fauna aparece',
      ], 'Informarse, conseguir, preparar, plantar, cuidar y observar.', { d: 2, extremos: ['Primero', 'Último'] }),
      clas('Clasificá las ideas de los docentes.', { // e5
        'Buena idea': ['Carteles con el nombre de cada nativa', 'Registrar las mariposas que aparecen en ArgentiNat', 'Juntar semillas del cantero para otras escuelas'],
        'Mala idea': ['Traer plantas sacadas de una reserva cercana', 'Fumigar para que no haya orugas', 'Regar todos los días aunque llueva'],
      }, 'Las orugas son justamente el objetivo: sin ellas no hay mariposas.', { d: 3 }),
      vf('Si aparecen orugas comiendo las hojas de la pasionaria, hay que fumigar.', false, 'Esas orugas son probablemente de mariposa espejito: el objetivo del proyecto. La pasionaria se recupera, y de las orugas salen mariposas.', { // e6
        razones: ['+Porque esas orugas son las futuras mariposas que se buscan atraer', '-Porque las orugas no comen plantas', '-Porque fumigar ayuda a las mariposas'],
        d: 3,
      }),
      det('La escuela escribe el proyecto. Marcá lo que no conviene.', [ // e7
        ['Reemplazaremos los ligustros de a poco por talas y coronillos.', false],
        ['Plantaremos un timbó en el centro del cantero de 20 m².', true, 'El timbó es un árbol enorme: no entra en un cantero chico.'],
        ['Sumaremos pastos nativos y flores para polinizadores.', false],
        ['Pondremos mariposas compradas para que el jardín tenga vida desde el primer día.', true, 'Si hay plantas hospederas y de néctar, las mariposas llegan solas.'],
      ], 'Un buen jardín de nativas crea las condiciones y deja que la fauna llegue.', { d: 3 }),
    ]),
  ],
});
