import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// ANIMALES 4 — Qué amenaza a la biodiversidad.
// Los cinco grandes motores de pérdida de biodiversidad que identifica la
// IPBES, cada uno con casos argentinos: desmonte y fragmentación, especies
// invasoras, tráfico de fauna, contaminación y cambio climático. Retoma
// especies en peligro (animales-3), invasoras vegetales (plantas-2) y
// sobrepesca (oceanos-2).

export default unidad({
  slug: 'animales-4',
  rama: 'animales',
  orden: 4,
  nivel: 2,
  requiereTronco: 2,
  titulo: 'Qué amenaza a la biodiversidad',
  bajada: 'Desmontes, castores, tráfico de fauna, venenos y un clima que cambia: los cinco grandes motores de pérdida de biodiversidad y cómo frenarlos.',
  objetivos: [
    'Nombrar y ordenar los cinco motores directos de pérdida de biodiversidad',
    'Explicar la pérdida y fragmentación del hábitat con el caso del Gran Chaco',
    'Analizar el impacto de las especies exóticas invasoras en Argentina',
    'Reconocer el tráfico de fauna y cómo lo regulan las leyes y CITES',
    'Relacionar contaminación y cambio climático con la pérdida de especies',
  ],
  repasa: ['animales-3', 'animales-1', 'plantas-2', 'oceanos-2'],
  fuentes: ['ipbes-global', 'ley-bosques-26331', 'global-forest-watch', 'invasoras-mayds', 'cites', 'ley-22421-fauna', 'red-centros-rescate', 'ipcc-ar6', 'ipbes-polinizadores'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Los cinco motores', 'Qué dice la ciencia sobre las causas directas de la pérdida de biodiversidad.', [
      teoria('Un diagnóstico mundial', [
        'En 2019, la IPBES —la plataforma intergubernamental que reúne a cientos de especialistas en biodiversidad— publicó la evaluación global más completa hasta ese momento. Identificó cinco motores directos de pérdida de biodiversidad, ordenados por su impacto a nivel mundial: el cambio en el uso de la tierra y el mar, la explotación directa de organismos, el cambio climático, la contaminación y las especies exóticas invasoras.',
        'Detrás de estos motores hay causas indirectas: cuánto y cómo producimos y consumimos, el crecimiento de las ciudades, el comercio y las políticas públicas.',
      ], { lista: ['1 · Cambio en el uso de la tierra y el mar', '2 · Explotación directa (caza, pesca, tala, captura)', '3 · Cambio climático', '4 · Contaminación', '5 · Especies exóticas invasoras'] }),
      ord('Ordená los motores de pérdida de biodiversidad según su impacto a nivel mundial, de mayor a menor, como los ordenó la IPBES.', [ // e1
        'Cambio en el uso de la tierra y el mar',
        'Explotación directa de organismos',
        'Cambio climático',
        'Contaminación',
        'Especies exóticas invasoras',
      ], 'Que un motor esté último en el promedio mundial no significa que sea menor en todos lados: en islas, las invasoras suelen ser la primera causa.', { d: 2, extremos: ['Mayor impacto', 'Menor impacto'] }),
      clas('¿A qué motor corresponde cada caso?', { // e2
        'Cambio en el uso de la tierra': ['Desmontar un bosque para sembrar soja', 'Rellenar un humedal para construir barrios'],
        'Explotación directa': ['Capturar cardenales para venderlos', 'Pescar más merluza de la que se repone'],
        'Especies invasoras': ['Castores que inundan bosques fueguinos', 'Mejillón dorado que tapa cañerías'],
      }, 'Clasificar las amenazas ayuda a elegir la herramienta correcta para cada una.', { d: 2 }),
      teoria('La magnitud', [
        'Según la IPBES, alrededor del 75 % de la superficie terrestre fue alterada de forma significativa por las actividades humanas, y cerca del 66 % de los océanos recibe impactos acumulados. Más del 85 % de los humedales que existían en 1700 se habían perdido para el año 2000.',
      ], { destacado: { valor: '75 %', texto: 'de la superficie terrestre fue alterada de forma significativa por actividades humanas, según la IPBES.' } }),
      est('Estimá qué porcentaje de la superficie terrestre fue alterada de forma significativa por las actividades humanas, según la IPBES.', 75, { min: 0, max: 100, paso: 5, unidad: '%' }, 'Alrededor del 75 %. Quedan pocas zonas terrestres sin una huella humana fuerte, y por eso son tan valiosas.', { d: 2 }),
      numv(3, (i) => { // e4
        const total = [200, 120, 80][i];
        return {
          enunciado: `Si en 1700 había ${total} humedales en una región y se perdió el 85 %, ¿cuántos quedan?`,
          valor: Math.round(total * 0.15),
          unidad: 'humedales',
          explicacion: `Queda el 15 %: ${total} × 0,15 = ${Math.round(total * 0.15)}. Los humedales están entre los ecosistemas que más se perdieron en el mundo.`,
        };
      }, { d: 2 }),
      teoria('En el mar, otro orden', [
        'El orden cambia según el ambiente. En tierra firme y en el agua dulce, el primer motor es el cambio en el uso del suelo: desmontes, agricultura, ciudades, represas. En el mar, en cambio, el primer motor es la explotación directa, sobre todo la pesca.',
      ]),
      op('Según la IPBES, ¿cuál es el principal motor de pérdida de biodiversidad en los océanos?', [ // e5
        'La explotación directa, sobre todo la pesca',
        'Las especies invasoras que llegan en barcos',
        ['El cambio en el uso de la tierra', 'Es el primero en tierra firme; en el mar pesa más la pesca.'],
        'La luz artificial de las ciudades costeras',
      ], 'En el mar, la pesca es el motor número uno. Lo viste en la unidad de pesca: muchas poblaciones se pescan por encima de lo que se reponen.', { d: 2 }),
      vf('Las especies exóticas invasoras son una amenaza menor en todo el mundo, porque figuran últimas en el ranking de la IPBES.', false, 'El ranking es un promedio mundial. En islas y en algunos ecosistemas, como Tierra del Fuego, las invasoras son la amenaza principal.', { // e6
        razones: ['+Porque el ranking es un promedio y varía según el lugar', '-Porque las invasoras no causan ningún daño', '-Porque el ranking es igual en todos los lugares'],
        d: 3,
      }),
      par('Uní cada motor con un ejemplo argentino.', [ // e7
        ['Cambio en el uso de la tierra', 'Desmonte en el Gran Chaco'],
        ['Explotación directa', 'Tráfico de tortugas terrestres'],
        ['Contaminación', 'Cóndores intoxicados con plomo'],
        ['Cambio climático', 'Retroceso de los glaciares andinos'],
      ], 'Los cinco motores tienen casos concretos en Argentina.', { d: 2 }),
      cad('Armá la cadena de una causa indirecta a la pérdida de especies.', [ // e8
        'Crece la demanda mundial de granos y carne',
        'Sube el precio de la tierra agrícola',
        'Se desmontan bosques para ampliar cultivos',
        'Las especies del bosque pierden su hábitat',
      ], ['Los bosques crecen más rápido con la demanda'], 'Las causas indirectas, como el consumo y el comercio, empujan a los motores directos.', { d: 3 }),
      det('Leé este resumen y marcá lo equivocado.', [ // e9
        ['La IPBES identificó cinco motores directos de pérdida de biodiversidad.', false],
        ['El cambio climático es el motor número uno en tierra firme.', true, 'En tierra el primero es el cambio en el uso del suelo; el clima es el tercero en el ranking global.'],
        ['En el mar, el primer motor es la pesca.', false],
        ['Más de la mitad de los humedales del mundo sigue intacta.', true, 'Se perdió más del 85 % de los humedales que había en 1700.'],
      ], 'Conocer el diagnóstico evita perder tiempo en causas menores.', { d: 2 }),
      mult('¿Cuáles son causas indirectas, que empujan a los motores directos? Marcá todas.', [ // e10
        '+Los patrones de producción y consumo',
        '+El comercio internacional',
        '+Las políticas públicas',
        '-La fotosíntesis de las plantas',
        '-La migración natural de las aves',
      ], 'La fotosíntesis y las migraciones son procesos naturales, no causas de pérdida.', { d: 2 }),
      comp('Completá.', 'El primer motor de pérdida de biodiversidad en tierra es el cambio en el [uso] del suelo; en el mar, la [pesca]; y según la IPBES se perdió más del 85 % de los [humedales].', ['color', 'lluvia', 'desiertos'], 'Tres datos clave del diagnóstico mundial sobre biodiversidad.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Sin casa: desmonte y fragmentación', 'El Gran Chaco, la Ley de Bosques y por qué un bosque partido en pedazos no es lo mismo que un bosque entero.', [
      teoria('El Gran Chaco', [
        'El Gran Chaco es el segundo bosque más grande de Sudamérica, después de la Amazonia, y se extiende por Argentina, Paraguay y Bolivia. Es uno de los lugares del mundo donde más rápido se perdieron bosques en las últimas décadas, sobre todo para sembrar soja y criar ganado. En Argentina, la mayor parte del desmonte de bosque nativo ocurrió en las provincias chaqueñas: Santiago del Estero, Salta, Chaco y Formosa.',
        'Allí viven el yaguareté, el tatú carreta, el oso hormiguero y el chancho quimilero, que se creyó extinto hasta que fue redescubierto en 1975.',
      ]),
      op('¿Por qué se desmontó tanto bosque en el Gran Chaco?', [ // e1
        'Para ampliar la agricultura y la ganadería',
        'Porque los bosques se secaron solos',
        ['Para construir grandes ciudades', 'Las ciudades ocupan poco; la mayor parte se transformó en campos de cultivo y pasturas.'],
        'Por una plaga que atacó a los árboles',
      ], 'La expansión agropecuaria es la principal causa de desmonte en el Chaco argentino.', { d: 1 }),
      teoria('La Ley de Bosques', [
        'En 2007 se sancionó la Ley 26.331, de Presupuestos Mínimos de Protección de los Bosques Nativos. Obliga a cada provincia a hacer un ordenamiento territorial de sus bosques con tres categorías de colores. Rojo: muy alto valor de conservación, no se puede desmontar. Amarillo: valor medio, se permite un uso sostenible, pero no el desmonte. Verde: bajo valor de conservación, se puede transformar con evaluación de impacto ambiental.',
      ]),
      clas('Según la Ley de Bosques, ¿qué se permite en cada zona?', { // e2
        'Rojo (muy alto valor)': ['Conservar sin transformar', 'Investigación científica'],
        'Amarillo (valor medio)': ['Aprovechamiento sostenible de madera', 'Turismo de naturaleza'],
        'Verde (bajo valor)': ['Desmonte con evaluación de impacto', 'Transformación a cultivos'],
      }, 'La ley no prohíbe todo: ordena qué se puede hacer en cada lugar según su valor.', { d: 3 }),
      est('Estimá cuántos millones de hectáreas de bosque nativo perdió Argentina entre 1998 y 2020, aproximadamente.', 6.5, { min: 0.5, max: 30, paso: 0.5, unidad: 'millones de ha' }, 'Alrededor de 6 a 7 millones de hectáreas, según los monitoreos oficiales, la mayor parte en la región chaqueña. Es más que toda la superficie de la provincia de Jujuy.', { d: 3 }),
      teoria('Fragmentación', [
        'Cuando un bosque no desaparece del todo sino que queda partido en parches, se habla de fragmentación. Los parches chicos no alcanzan para las especies que necesitan grandes territorios, como el yaguareté. Además, en los bordes del parche entra más luz, viento, ganado, perros y cazadores: es el efecto borde. Y los animales que no cruzan campos abiertos quedan aislados en cada parche.',
      ]),
      ejemplo('Un bosque, dos formas de partirlo', 'Un campo de 100 ha de bosque se desmonta a la mitad. En la opción A queda un bloque de 50 ha. En la opción B quedan 10 parches de 5 ha cada uno.', [
        'Las dos opciones conservan la misma superficie: 50 ha.',
        'Pero en la opción B hay muchos más bordes: cada parche chico tiene mucho borde para poco interior.',
        'El interior del bosque, lejos de los bordes, es donde viven las especies más sensibles.',
      ], 'Con la misma superficie, el bloque grande conserva mucho más hábitat de interior que diez parches chicos.'),
      op('Con la misma superficie de bosque, ¿qué conserva más hábitat para especies sensibles?', [ // e4
        'Un bloque grande y continuo',
        'Muchos parches chicos separados',
        ['Da exactamente igual si la superficie es la misma', 'No da igual: los parches chicos tienen más borde y menos interior.'],
        'Un parche largo y muy angosto',
      ], 'Por eso, en la planificación, importa tanto cómo queda el bosque como cuánto queda.', { d: 2 }),
      numv(3, (i) => { // e5
        const lado = [1000, 2000, 500][i];
        const borde = 100;
        const interior = (lado - 2 * borde) ** 2;
        const total = lado ** 2;
        return {
          enunciado: `Un parche cuadrado de bosque mide ${lado.toLocaleString('es-AR')} m de lado. Si el efecto borde entra ${borde} m desde cada lado, ¿qué porcentaje del parche es interior? Redondeá al entero.`,
          valor: Math.round((interior / total) * 100),
          unidad: '%',
          tol: 1,
          explicacion: `El interior es un cuadrado de ${lado - 2 * borde} m de lado: ${(lado - 2 * borde).toLocaleString('es-AR')}² ÷ ${lado.toLocaleString('es-AR')}² ≈ ${Math.round((interior / total) * 100)} %. Cuanto más chico el parche, mayor la proporción de borde.`,
          ctx: `Parche cuadrado de ${lado} m de lado; efecto borde de ${borde} m.`,
        };
      }, { d: 4 }),
      teoria('Corredores', [
        'Una forma de reducir la fragmentación es conectar los parches con corredores biológicos: franjas de bosque a lo largo de ríos, cortinas de árboles nativos entre campos, o pasos de fauna bajo o sobre las rutas. Así los animales pueden moverse, encontrar pareja y recolonizar parches.',
      ]),
      cad('Armá la cadena de por qué un corredor ayuda a una especie aislada.', [ // e6
        'Un corredor une dos parches de bosque',
        'Los animales pueden pasar de un parche al otro',
        'Se cruzan individuos de poblaciones distintas',
        'Aumenta la diversidad genética',
        'La población es más resistente',
      ], ['Los animales dejan de necesitar bosque'], 'Conectar parches evita que cada uno quede como una isla. Es lo contrario del vórtice de extinción.', { d: 2 }),
      mult('¿Qué pasa en los bordes de un parche de bosque? Marcá todo.', [ // e7
        '+Entra más luz y viento',
        '+Llegan más fácilmente ganado y perros',
        '+Hay más acceso para cazadores',
        '-Aumenta la humedad del interior',
        '-Desaparecen todas las especies exóticas',
      ], 'El borde cambia las condiciones del bosque varios metros hacia adentro.', { d: 2 }),
      vf('Si en una provincia queda la mitad del bosque original, se conserva la mitad de las especies de bosque, sin importar cómo queden los parches.', false, 'Depende mucho de la forma: parches chicos y aislados pierden especies aunque la superficie total sea la misma.', { // e8
        razones: ['+Porque la forma y la conexión de los parches también importan', '-Porque se conservan siempre todas las especies', '-Porque las especies no dependen del bosque'],
        d: 3,
      }),
      par('Uní cada concepto con su definición.', [ // e9
        ['Desmonte', 'Eliminar el bosque para otro uso'],
        ['Fragmentación', 'Bosque partido en parches separados'],
        ['Efecto borde', 'Cambios en los márgenes de un parche'],
        ['Corredor biológico', 'Franja que conecta parches de hábitat'],
      ], 'Cuatro conceptos para leer cualquier mapa de bosques.', { d: 1 }),
      det('Leé esta nota y marcá lo equivocado.', [ // e10
        ['El Gran Chaco es el segundo bosque más grande de Sudamérica.', false],
        ['La Ley de Bosques prohíbe cualquier uso de todos los bosques.', true, 'Ordena usos según categorías: solo en rojo no se transforma.'],
        ['El efecto borde hace que los parches chicos pierdan calidad.', false],
        ['El chancho quimilero se extinguió en 1975.', true, 'Al revés: en 1975 fue redescubierto, cuando se lo creía extinto.'],
      ], 'Los detalles importan cuando se discute qué bosque conservar.', { d: 2 }),
      comp('Completá.', 'La Ley de Bosques usa tres colores: rojo, amarillo y [verde]; un bosque partido en parches está [fragmentado]; y una franja que une parches es un [corredor].', ['azul', 'reforestado', 'desmonte'], 'Tres ideas clave para entender el desmonte.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Invasores: el caso del castor', 'Especies traídas de otros continentes que se expanden sin control y transforman los ecosistemas.', [
      teoria('Exótica no es lo mismo que invasora', [
        'Una especie exótica es la que llegó a un lugar llevada por las personas, a propósito o por accidente. La mayoría no logra establecerse. Una especie es invasora cuando, además, se reproduce sin ayuda, se expande y causa daños al ambiente, a la economía o a la salud. Lo viste con las plantas; con los animales pasa lo mismo.',
      ]),
      teoria('El castor en Tierra del Fuego', [
        'En 1946 se liberaron en Tierra del Fuego unas pocas decenas de castores traídos de Canadá, con la idea de crear una industria peletera. La industria no prosperó, pero los castores sí: sin predadores naturales, hoy se estiman en decenas de miles en el archipiélago. Construyen diques que inundan y matan bosques de lenga y ñire, árboles que, a diferencia de los de Canadá, no rebrotan tras ser cortados.',
        'Argentina y Chile acordaron en 2008 un plan binacional para restaurar los ambientes afectados y erradicar al castor del archipiélago.',
      ]),
      cad('Armá la cadena de cómo el castor transforma el bosque fueguino.', [ // e1
        'Se liberan castores sin predadores naturales',
        'La población crece y se expande por los ríos',
        'Construyen diques que inundan el bosque',
        'Los árboles inundados mueren y no rebrotan',
        'Cambian los ríos, el suelo y las especies del lugar',
      ], ['Los pumas fueguinos controlan a los castores'], 'En Tierra del Fuego no hay pumas ni osos que coman castores: por eso se expandieron sin freno.', { d: 2 }),
      op('¿Por qué el castor se volvió invasor en Tierra del Fuego y no en Canadá, su lugar de origen?', [ // e2
        'Porque en Tierra del Fuego no tiene predadores',
        'Porque en Canadá hace más frío para los castores',
        ['Porque en Tierra del Fuego hay más ríos', 'El problema no es la cantidad de ríos, sino la falta de controles naturales.'],
        'Porque los castores fueguinos son otra especie',
      ], 'En su lugar de origen, los predadores y la competencia mantienen a raya a la población. Afuera, esos controles faltan.', { d: 2 }),
      teoria('Otros invasores en Argentina', [
        'El mejillón dorado llegó desde Asia en el agua de lastre de barcos, a comienzos de los 90, al Río de la Plata; hoy tapiza cañerías de tomas de agua y centrales. El jabalí europeo, traído para caza, rompe suelos y cultivos. La rana toro, traída para criaderos, come ranas nativas y dispersa enfermedades. El estornino pinto, escapado de jaulas, compite por huecos para anidar con aves nativas.',
      ]),
      par('Uní cada especie invasora con cómo llegó.', [ // e3
        ['Castor', 'Liberado para la industria peletera'],
        ['Mejillón dorado', 'En el agua de lastre de barcos'],
        ['Jabalí europeo', 'Traído para la caza deportiva'],
        ['Estornino pinto', 'Escapado del comercio de aves de jaula'],
      ], 'Muchas invasiones empezaron con una decisión humana que parecía inofensiva.', { d: 2 }),
      clas('¿Llegó a propósito o por accidente?', { // e4
        'A propósito': ['Castor para peletería', 'Jabalí para caza', 'Rana toro para criaderos'],
        'Por accidente': ['Mejillón dorado en el lastre de barcos', 'Ratas en barcos', 'Semillas pegadas a la ropa'],
      }, 'Las introducciones intencionales pueden prevenirse con reglas; las accidentales, con controles en puertos y fronteras.', { d: 2 }),
      teoria('Prevenir, detectar, controlar', [
        'Con las invasoras, prevenir es mucho más barato que controlar. La estrategia tiene tres pasos: prevenir que lleguen (controles en puertos, reglas para importar especies), detectar temprano y erradicar si aparecen, y controlar o manejar las que ya se establecieron. Argentina tiene una Estrategia Nacional sobre Especies Exóticas Invasoras.',
      ]),
      rank('Ordená las acciones contra una invasora de la más barata a la más cara.', [ // e5
        ['Evitar que la especie llegue', 'prevención'],
        ['Detectarla y erradicarla apenas aparece', 'respuesta temprana'],
        ['Controlarla cuando ya está en una región', 'control'],
        ['Restaurar el ecosistema después de décadas de daño', 'restauración'],
      ], 'Cuanto más tarde se actúa, más caro y difícil es. Con el castor, se actuó tarde.', { d: 2, extremos: ['Más barata', 'Más cara'] }),
      numv(3, (i) => { // e6
        const n0 = [50, 40, 60][i];
        const anos = [15, 20, 10][i];
        return {
          enunciado: `Una población invasora de ${n0} individuos se duplica cada 5 años. ¿Cuántos habrá en ${anos} años?`,
          valor: n0 * 2 ** (anos / 5),
          unidad: 'individuos',
          explicacion: `${anos} años son ${anos / 5} duplicaciones: ${n0} × ${2 ** (anos / 5)} = ${(n0 * 2 ** (anos / 5)).toLocaleString('es-AR')}. Por eso la detección temprana es clave: el crecimiento se acelera.`,
        };
      }, { d: 2 }),
      vf('Soltar en la naturaleza una mascota exótica que ya no se quiere es una forma de liberarla sin daño.', false, 'Puede convertirse en invasora, transmitir enfermedades o morir. Es una de las vías por las que llegaron especies como la tortuga de orejas rojas.', { // e7
        razones: ['+Porque puede volverse invasora o transmitir enfermedades', '-Porque las mascotas no sobreviven nunca afuera', '-Porque la ley obliga a liberarlas'],
        d: 2,
      }),
      mult('¿Qué acciones previenen nuevas invasiones? Marcá todas.', [ // e8
        '+Controlar el agua de lastre de los barcos',
        '+No liberar mascotas exóticas',
        '+Limpiar el calzado al pasar entre áreas protegidas',
        '-Traer especies nuevas para "enriquecer" un lugar',
        '-Soltar peces exóticos en lagunas',
      ], 'La prevención depende de controles oficiales y también de decisiones de cada persona.', { d: 1 }),
      det('Leé esta nota y marcá lo equivocado.', [ // e9
        ['Los castores llegaron a Tierra del Fuego en 1946.', false],
        ['La lenga rebrota enseguida después de que el castor la corta.', true, 'A diferencia de los árboles de Canadá, la lenga y el ñire no rebrotan.'],
        ['El mejillón dorado llegó en el agua de lastre de barcos.', false],
        ['Toda especie exótica es invasora.', true, 'La mayoría no se establece; solo algunas se vuelven invasoras.'],
      ], 'Las invasoras son una amenaza seria, pero hay que distinguirlas bien.', { d: 2 }),
      comp('Completá.', 'Una exótica que se expande y causa daño es [invasora]; el castor fue liberado para la industria [peletera]; y con las invasoras, lo más barato es [prevenir].', ['nativa', 'lechera', 'restaurar'], 'Las claves para entender y enfrentar a las especies invasoras.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Capturados: caza y tráfico de fauna', 'Por qué el comercio de animales silvestres amenaza especies y qué dicen las leyes y la CITES.', [
      teoria('El tráfico de fauna', [
        'El tráfico de fauna silvestre es el comercio ilegal de animales vivos, sus partes o sus productos. En Argentina, algunas de las especies más traficadas son aves canoras como el cardenal amarillo y el cardenal común, loros como el loro hablador, y la tortuga terrestre argentina, vendida como mascota. Muchos animales mueren en la captura, el encierro y el transporte, antes de llegar a la venta.',
      ]),
      cad('Armá la cadena del tráfico de un cardenal amarillo.', [ // e1
        'Un trampero captura aves en el monte',
        'Las encierra en cajas y las transporta ocultas',
        'Muchas mueren por estrés, calor o falta de agua',
        'Las sobrevivientes se venden en ferias o por internet',
        'Cada venta financia nuevas capturas',
      ], ['El comprador ayuda a que el ave vuelva a su hábitat'], 'Comprar un animal silvestre no lo rescata: pone en marcha la próxima captura.', { d: 2 }),
      teoria('La tortuga terrestre', [
        'La tortuga terrestre argentina vive en zonas secas del centro y norte del país. Está categorizada como Vulnerable. Crece muy despacio, vive décadas y pone pocos huevos, por lo que cada ejemplar que se saca de la naturaleza es difícil de reponer. En los hogares suele vivir mal: necesita sol, temperaturas adecuadas y una dieta especial, y muchas mueren en los primeros años.',
      ]),
      op('¿Por qué la extracción de tortugas terrestres afecta tanto a la especie?', [ // e2
        'Porque crece lento y pone pocos huevos',
        'Porque se reproduce varias veces por año',
        ['Porque en las casas vive más años', 'En general vive peor: le faltan sol, temperatura y dieta adecuadas.'],
        'Porque es una especie exótica invasora',
      ], 'Lo viste en la unidad anterior: las especies de vida lenta son las más vulnerables a perder individuos.', { d: 2 }),
      teoria('Las leyes', [
        'En Argentina, la Ley 22.421 de Conservación de la Fauna Silvestre regula la caza y el comercio de animales silvestres, y el comercio de especies protegidas es un delito. A nivel internacional, la CITES es un tratado que regula el comercio entre países de especies amenazadas. Tiene tres apéndices: en el Apéndice I están las especies más amenazadas, cuyo comercio internacional está prohibido salvo excepciones; en el II, especies cuyo comercio se permite con controles y permisos; y en el III, especies que un país protege y pide ayuda a los demás para controlar.',
      ]),
      par('Uní cada apéndice de la CITES con lo que significa.', [ // e3
        ['Apéndice I', 'Comercio internacional prohibido salvo excepciones'],
        ['Apéndice II', 'Comercio permitido con permisos y controles'],
        ['Apéndice III', 'Especie protegida por un país que pide colaboración'],
      ], 'La CITES no prohíbe todo el comercio de fauna: lo regula según el nivel de riesgo.', { d: 3 }),
      vf('Si un loro se vende en una feria, seguro es legal.', false, 'Muchas aves silvestres se venden ilegalmente en ferias y por internet. Un animal legal tiene documentación que acredita su origen.', { // e4
        razones: ['+Porque muchas ventas de fauna silvestre son ilegales', '-Porque en las ferias solo hay animales de criadero', '-Porque los loros no están protegidos'],
        d: 1,
      }),
      clas('¿Qué hacer y qué no hacer ante la fauna silvestre?', { // e5
        'Conviene': ['Denunciar la venta de fauna a las autoridades', 'Llamar a un centro de rescate si encontrás un animal herido', 'Elegir mascotas domésticas, como perros o gatos adoptados'],
        'No conviene': ['Comprar un cardenal "para liberarlo"', 'Llevarse una tortuga del campo', 'Compartir en redes fotos con fauna silvestre como mascota'],
      }, 'Comprar para liberar también financia el tráfico. La fauna silvestre no es mascota.', { d: 2 }),
      numv(3, (i) => { // e6
        const cap = [100, 200, 150][i];
        const muere = [60, 70, 50][i];
        return {
          enunciado: `Si se capturan ${cap} aves y el ${muere} % muere antes de la venta, ¿cuántas llegan vivas a venderse?`,
          valor: Math.round(cap * (1 - muere / 100)),
          unidad: 'aves',
          explicacion: `${cap} × ${100 - muere} % = ${Math.round(cap * (1 - muere / 100))}. Por cada ave en una jaula, muchas otras murieron en el camino.`,
          ctx: `Captura de ${cap} aves; muere el ${muere} % antes de la venta.`,
        };
      }, { d: 2 }),
      teoria('La caza y el plomo', [
        'La caza también afecta a especies que no son su objetivo. Los cóndores y otras aves carroñeras se intoxican al comer restos de animales cazados con munición de plomo. Además, la caza furtiva de especies protegidas sigue ocurriendo. Las alternativas incluyen munición sin plomo, controles y trabajo con los cazadores.',
      ]),
      op('¿Cómo se intoxica un cóndor con plomo si nadie le dispara?', [ // e7
        'Come restos de animales cazados con munición de plomo',
        'Respira el humo de las fábricas de ciudades cercanas',
        ['Toma agua de ríos con mucha sal durante la sequía', 'La sal no aporta plomo; la fuente es la munición en la carroña.'],
        'Anida en paredes de roca con minerales de plomo',
      ], 'Los fragmentos de munición quedan en la carroña. Pasar a munición sin plomo evita el problema.', { d: 2 }),
      det('Leé este posteo y marcá lo equivocado.', [ // e8
        ['El comercio de especies protegidas es ilegal en Argentina.', false],
        ['Comprar un ave silvestre para liberarla ayuda a la especie.', true, 'Financia la próxima captura; lo correcto es denunciar.'],
        ['La CITES regula el comercio internacional de especies amenazadas.', false],
        ['La tortuga terrestre se reproduce rápido y abunda.', true, 'Crece lento, pone pocos huevos y está categorizada como Vulnerable.'],
      ], 'Mucha información falsa sobre fauna circula en redes. Conviene chequear.', { d: 2 }),
      mult('¿Qué especies argentinas sufren el tráfico de fauna? Marcá todas.', [ // e9
        '+Cardenal amarillo',
        '+Tortuga terrestre argentina',
        '+Loro hablador',
        '-Paloma doméstica',
        '-Gorrión',
      ], 'La paloma doméstica y el gorrión son especies exóticas abundantes que no son objeto del tráfico.', { d: 1 }),
      comp('Completá.', 'En Argentina, la fauna silvestre está protegida por la Ley [22.421]; el tratado internacional que regula su comercio es la [CITES]; y si ves venta de fauna, lo mejor es [denunciar].', ['26.331', 'OMS', 'comprar'], 'Las herramientas legales contra el tráfico de fauna silvestre.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Venenos y un clima que cambia', 'Plaguicidas, plásticos, luz artificial y calentamiento: amenazas menos visibles que se suman a las demás.', [
      teoria('La contaminación', [
        'La contaminación afecta a la fauna de muchas formas. Algunos insecticidas dañan a abejas y otros polinizadores. Los fertilizantes en exceso alimentan algas que agotan el oxígeno del agua. Los plásticos se enredan en animales o son ingeridos: tortugas marinas y aves comen bolsas y fragmentos que confunden con alimento. La luz artificial desorienta a aves migratorias e insectos, y el ruido interfiere con la comunicación de muchos animales.',
      ]),
      par('Uní cada contaminante con su efecto en la fauna.', [ // e1
        ['Insecticidas', 'Dañan a abejas y otros polinizadores'],
        ['Exceso de fertilizantes', 'Algas que agotan el oxígeno del agua'],
        ['Bolsas plásticas en el mar', 'Tortugas que las confunden con alimento'],
        ['Luz artificial de noche', 'Aves e insectos desorientados'],
      ], 'Cada contaminante actúa distinto, y muchos se combinan en el mismo lugar.', { d: 2 }),
      vf('La luz artificial de noche es un tipo de contaminación que afecta a la fauna.', true, 'Sí: desorienta a aves migratorias que vuelan de noche, atrae y mata insectos, y altera el comportamiento de muchos animales.', { // e2
        razones: ['+Porque desorienta aves e insectos y altera comportamientos', '-Porque los animales nocturnos necesitan más luz', '-Porque solo afecta a las personas'],
        d: 2,
      }),
      teoria('El clima', [
        'El cambio climático ya mueve a las especies. Según el IPCC, alrededor de la mitad de las especies estudiadas desplazó su distribución hacia los polos o, en tierra, hacia zonas más altas, buscando temperaturas más frescas. Las que viven en cumbres o en lugares muy fríos se quedan sin lugar a donde ir. También se producen desacoples: por ejemplo, plantas que florecen antes, cuando sus polinizadores todavía no llegaron.',
      ], { destacado: { valor: '≈ 50 %', texto: 'de las especies estudiadas ya desplazó su distribución hacia los polos o hacia zonas más altas, según el IPCC.' } }),
      op('Una especie de rana vive en la cima de una sierra. Si el clima se calienta, ¿qué problema tiene?', [ // e3
        'No puede subir más porque ya está en la cima',
        'Tiene que bajar al valle, donde hace más frío',
        ['Ninguno, porque las ranas no sienten la temperatura', 'Los anfibios son muy sensibles a la temperatura y la humedad.'],
        'Se vuelve una especie invasora en la cima',
      ], 'Las especies de montaña se desplazan hacia arriba; en la cumbre se acaba el espacio.', { d: 2 }),
      cad('Armá la cadena de un desacople entre una flor y su polinizador.', [ // e4
        'Las temperaturas de primavera suben antes',
        'La planta florece más temprano',
        'El polinizador sigue llegando en la fecha de siempre',
        'Cuando llega, quedan pocas flores',
        'La planta produce menos semillas y el polinizador come menos',
      ], ['El polinizador adelanta su viaje leyendo el calendario'], 'Las especies que dependen entre sí pueden desincronizarse si responden a señales distintas.', { d: 3 }),
      teoria('Las amenazas se suman', [
        'Las amenazas rara vez actúan solas. Un bosque fragmentado es más vulnerable a incendios, que son más frecuentes con sequías más intensas; los animales aislados en parches no pueden desplazarse cuando el clima cambia; y las invasoras aprovechan los ambientes alterados. Por eso las estrategias que reducen varias amenazas a la vez, como conservar y conectar hábitats, son las más efectivas.',
      ]),
      mult('¿Cómo se potencian las amenazas entre sí? Marcá todos los ejemplos correctos.', [ // e5
        '+Un parche aislado impide que las especies se muden cuando el clima cambia',
        '+Las sequías aumentan los incendios en bosques ya fragmentados',
        '+Las invasoras aprovechan los ambientes degradados',
        '-La contaminación reduce el efecto del cambio climático',
        '-Los incendios eliminan a todas las especies invasoras',
      ], 'Las amenazas combinadas pueden causar más daño que la suma de cada una por separado.', { d: 3 }),
      numv(3, (i) => { // e6
        const sub = [300, 450, 200][i];
        return {
          enunciado: `Por el calentamiento, una especie de montaña tiene que subir ${sub} m. Si la cima está 500 m por encima de donde vive hoy, ¿cuántos metros de margen le quedan hasta la cima?`,
          valor: 500 - sub,
          unidad: 'm',
          explicacion: `500 − ${sub} = ${500 - sub} m. Todavía tiene lugar, pero cada vez menos superficie, porque las montañas se angostan hacia arriba. Si el calentamiento sigue, se queda sin montaña.`,
          ctx: `Desplazamiento necesario de ${sub} m; cima 500 m más arriba.`,
        };
      }, { d: 3 }),
      clas('¿Qué motor es cada caso?', { // e7
        'Contaminación': ['Insecticidas que dañan a las abejas', 'Plomo en la carroña', 'Plásticos en el estómago de tortugas'],
        'Cambio climático': ['Especies que suben por las montañas', 'Flores que se adelantan a sus polinizadores', 'Corales que se blanquean con el agua caliente'],
      }, 'Contaminación y clima son motores distintos, aunque suelan actuar juntos.', { d: 2 }),
      rank('Ordená estas estrategias de la que reduce más amenazas a la vez a la que reduce menos.', [ // e8
        ['Conservar y conectar grandes áreas de hábitat', 'muchas amenazas'],
        ['Reducir el uso de insecticidas cerca de áreas naturales', 'varias'],
        ['Apagar luces innecesarias en migración', 'una amenaza puntual'],
        ['Rescatar un animal empetrolado', 'un individuo'],
      ], 'Todas ayudan, pero proteger el hábitat es la que más amenazas atiende al mismo tiempo.', { d: 3, extremos: ['Más amenazas', 'Menos amenazas'] }),
      det('Leé esta nota y marcá lo equivocado.', [ // e9
        ['Muchas especies se están desplazando hacia los polos o hacia zonas más altas.', false],
        ['Las especies de cumbre pueden subir sin límite.', true, 'En la cumbre se acaba la montaña: no tienen a dónde ir.'],
        ['Algunos insecticidas afectan a los polinizadores.', false],
        ['Las amenazas siempre actúan de a una.', true, 'Suelen combinarse y potenciarse entre sí.'],
      ], 'Contaminación y clima son amenazas menos visibles, pero están en todas partes.', { d: 2 }),
      comp('Completá.', 'Con el calentamiento, muchas especies se mueven hacia los [polos] o hacia zonas más [altas]; y cuando las amenazas se combinan, suelen [potenciarse].', ['trópicos', 'bajas', 'anularse'], 'Cómo responden las especies a un clima que cambia.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: las amenazas', 'Motores, desmonte, invasoras, tráfico, contaminación y clima, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el diagnóstico de la reserva', 'Una reserva del Chaco registró qué amenazas afectan a sus especies. Con los datos, decidí dónde poner el esfuerzo.', [
      teoria('Los datos', [
        'El equipo de guardaparques revisó 40 especies de vertebrados de la reserva y anotó qué amenazas afectan a cada una. Una especie puede tener más de una amenaza.',
      ], {
        datos: tabla('Especies afectadas por cada amenaza (de 40 revisadas)', ['Amenaza', 'Especies afectadas'], [
          ['Desmonte en los campos vecinos', '28'],
          ['Caza furtiva', '14'],
          ['Perros sueltos', '9'],
          ['Incendios', '12'],
          ['Tráfico de fauna', '6'],
        ], 'Datos ficticios para el ejercicio.'),
      }),
      num('¿Qué porcentaje de las especies revisadas está afectado por el desmonte en los campos vecinos?', 70, '%', '28 ÷ 40 × 100 = 70 %. El desmonte, un cambio en el uso de la tierra, es la amenaza principal, igual que en el diagnóstico mundial.', { ctx: '28 de 40 especies afectadas por el desmonte.', d: 2 }),
      rank('Ordená las amenazas por cantidad de especies afectadas, de mayor a menor.', [ // e2
        ['Desmonte en los campos vecinos', '28'],
        ['Caza furtiva', '14'],
        ['Incendios', '12'],
        ['Perros sueltos', '9'],
        ['Tráfico de fauna', '6'],
      ], 'Ordenar los datos es el primer paso para priorizar.', { d: 2 }),
      vf('Como las especies pueden tener varias amenazas, la suma de la tabla (69) no es la cantidad de especies amenazadas.', true, 'Una misma especie aparece en varias filas. Solo se revisaron 40 especies, así que la suma de filas cuenta amenazas, no especies.', { // e3
        razones: ['+Porque una especie puede aparecer en varias filas', '-Porque la tabla tiene un error de suma', '-Porque hay 69 especies en la reserva'],
        d: 3,
      }),
      op('El desmonte ocurre fuera de la reserva. ¿Qué acción lo atiende mejor?', [ // e4
        'Acordar corredores y zonas de amortiguación con los vecinos',
        'Cerrar la reserva al público para que nadie entre',
        ['Contratar más guardaparques solo dentro de la reserva', 'Ayuda con la caza, pero el desmonte ocurre afuera.'],
        'Soltar más animales dentro de la reserva',
      ], 'Una reserva no es una isla: lo que pasa alrededor define si sus especies sobreviven.', { d: 3 }),
      mult('¿Qué acciones ayudan con varias amenazas a la vez? Marcá todas.', [ // e5
        '+Conectar la reserva con corredores de bosque',
        '+Patrullajes que controlen caza, perros y fuegos',
        '+Trabajar con las comunidades vecinas',
        '-Sembrar especies exóticas de crecimiento rápido',
        '-Quemar los pastizales para "limpiar" la reserva',
      ], 'Las mejores acciones atienden varias amenazas y suman aliados.', { d: 3 }),
      par('Uní cada amenaza de la reserva con la acción más directa.', [ // e6
        ['Desmonte en los campos vecinos', 'Acuerdos con vecinos y corredores'],
        ['Caza furtiva', 'Patrullajes y controles'],
        ['Perros sueltos', 'Campañas de tenencia responsable'],
        ['Incendios', 'Brigadas y cortafuegos'],
        ['Tráfico de fauna', 'Controles en rutas y denuncias'],
      ], 'Cada amenaza pide una herramienta distinta; un plan completo combina varias.', { d: 2 }),
      det('El equipo redacta su informe. Marcá lo que no conviene.', [ // e7
        ['La principal amenaza es el desmonte en los campos vecinos.', false],
        ['Como el desmonte es afuera, no es asunto de la reserva.', true, 'Afecta al 70 % de las especies: trabajar con los vecinos es prioritario.'],
        ['Controlaremos perros sueltos y caza con patrullajes.', false],
        ['Hay 69 especies amenazadas en la reserva.', true, 'Se revisaron 40 especies; 69 es la suma de amenazas, no de especies.'],
      ], 'Un buen diagnóstico lee bien los datos y actúa sobre lo que más pesa.', { d: 3 }),
    ]),
  ],
});
