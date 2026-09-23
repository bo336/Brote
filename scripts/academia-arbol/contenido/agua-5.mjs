import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// AGUA 5 — Cuencas, humedales e inundaciones.
// Avanzado. Sube de la casa al territorio: la cuenca como sistema, los
// humedales como infraestructura natural, por qué se inundan las ciudades,
// qué hacen las represas y cómo se reparte el agua cuando no alcanza para
// todos. Pide el tronco 3 porque es la primera unidad donde las decisiones son
// colectivas y hay intereses en tensión.

export default unidad({
  slug: 'agua-5',
  rama: 'agua',
  orden: 5,
  nivel: 3,
  requiereTronco: 3,
  titulo: 'Cuencas, humedales e inundaciones',
  bajada: 'El agua a escala de territorio: cómo funciona una cuenca, por qué los humedales valen oro, por qué se inundan las ciudades y cómo se reparte el agua.',
  objetivos: [
    'Describir una cuenca con su divisoria, sus afluentes y su desembocadura',
    'Explicar qué servicios prestan los humedales y qué los amenaza',
    'Analizar por qué se inundan las ciudades y comparar soluciones grises y verdes',
    'Evaluar beneficios y costos de una represa, incluido el caudal ecológico',
    'Razonar sobre conflictos por el agua entre usos y entre provincias',
  ],
  repasa: ['agua-3', 'agua-1', 'tronco-1', 'tronco-3'],
  fuentes: ['acumar', 'ramsar', 'incendios-delta-2020', 'unep', 'un-water', 'ipbes-global', 'ley-25675-ambiente'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('La cuenca como sistema', 'Divisorias, afluentes y desembocaduras: leer un territorio como lo lee el agua.', [
      teoria('Todo lo que drena al mismo lugar', [
        'Una cuenca es todo el territorio cuya agua de lluvia termina escurriendo hacia un mismo río, lago o mar. Sus bordes son las divisorias de aguas: las líneas de altura desde donde el agua cae hacia un lado o hacia el otro.',
        'Dentro de una cuenca hay un río principal y sus afluentes, que a su vez tienen sus propias cuencas más chicas (subcuencas). Todo lo que pasa aguas arriba —una ciudad, un campo, una fábrica— se hace sentir aguas abajo.',
      ], { lista: ['Divisoria de aguas: el borde de la cuenca', 'Afluente: río que desemboca en otro más grande', 'Subcuenca: la cuenca de un afluente', 'Desembocadura: donde el río principal termina'] }),
      par('Uní cada parte de una cuenca con su descripción.', [
        ['Divisoria de aguas', 'Línea de altura que separa hacia dónde escurre la lluvia'],
        ['Afluente', 'Río que vuelca sus aguas en otro más grande'],
        ['Desembocadura', 'Lugar donde el río principal llega al mar, a un lago o a otro río'],
        ['Subcuenca', 'Cuenca de un afluente, dentro de la cuenca mayor'],
      ], 'Con estas cuatro piezas se puede leer cualquier mapa hidrográfico, de un arroyo del barrio a la cuenca del Plata.', { d: 1 }),
      teoria('La cuenca del Plata', [
        'La cuenca del Plata es una de las más grandes del mundo: sus ríos principales —el Paraná, el Paraguay y el Uruguay— drenan partes de cinco países (Argentina, Brasil, Paraguay, Bolivia y Uruguay) y terminan en el Río de la Plata.',
        'Por eso lo que pasa en una selva de Brasil o en un campo de Paraguay puede cambiar el caudal y la calidad del agua que llega a Rosario o a Buenos Aires. Una cuenca compartida exige acuerdos entre países.',
      ], { destacado: { valor: '5 países', texto: 'comparten la cuenca del Plata: lo que pasa río arriba llega río abajo.' } }),
      mult('¿Qué ríos forman parte de la cuenca del Plata? Marcá todos.', [
        '+Paraná',
        '+Paraguay',
        '+Uruguay',
        '-Colorado',
        '-Santa Cruz',
      ], 'El Colorado y el Santa Cruz son ríos patagónicos y cordilleranos que desembocan directo en el Atlántico, con sus propias cuencas.', { d: 2 }),
      cad('Armá el viaje de una gota que cae en el sur de Brasil y termina en Buenos Aires.', [
        'Cae como lluvia sobre un campo del sur de Brasil',
        'Escurre hacia un afluente del Paraná',
        'El Paraná la lleva hacia el sur',
        'El Paraná forma el Delta',
        'Llega al Río de la Plata',
      ], ['Cruza la cordillera de los Andes'], 'La gota nunca cruza los Andes: todo su recorrido está del lado atlántico. Es un viaje de miles de kilómetros en la misma cuenca.', { d: 2 }),
      teoria('Arriba y abajo', [
        'En una cuenca, las acciones aguas arriba tienen efectos aguas abajo. Si se deforesta una ladera, llega más sedimento al río y el agua corre más rápido; si una ciudad no trata sus cloacas, los pueblos de abajo reciben esa contaminación; si se represa un río, cambia el caudal para todos los que están después.',
        'Por eso la cuenca, y no el municipio o la provincia, es la unidad natural para gestionar el agua, como viste en el caso Riachuelo.',
      ]),
      clas('¿Estos efectos se sienten sobre todo aguas arriba o aguas abajo de su causa?', {
        'Aguas abajo de la causa': ['Más sedimento por una deforestación en la ladera', 'Contaminación de una ciudad sin tratamiento', 'Menos caudal por una represa'],
        'En el mismo lugar o aguas arriba': ['El lago que se forma detrás de una represa', 'Un pozo que baja la napa alrededor de sí'],
      }, 'El agua corre en una sola dirección: por eso el "aguas abajo" hereda lo que se hace arriba. Pero algunos efectos, como el embalse, se forman del lado de arriba.', { d: 3 }),
      op('Una ciudad río arriba vuelca sus cloacas sin tratar. ¿Quién sufre más el problema?', [
        'Los pueblos y ecosistemas de río abajo',
        'Solo la propia ciudad que las vuelca',
        ['Nadie, porque el río diluye todo en pocos metros', 'La autodepuración tiene límites: los efectos viajan kilómetros río abajo.'],
        'Los pueblos de río arriba, más cerca de la naciente',
      ], 'La contaminación viaja con el agua. Quien la genera muchas veces no la sufre, y ese desajuste es la raíz de muchos conflictos por el agua.', { d: 2 }),
      vf('Los límites de una cuenca coinciden con los límites de las provincias.', false, 'Las cuencas siguen el relieve, no los mapas políticos. La mayoría de las cuencas grandes cruzan varias provincias y a veces varios países.', {
        razones: ['+Porque las cuencas siguen el relieve, no la política', '-Porque cada provincia tiene su propio río exclusivo', '-Porque las cuencas se definen por ley'],
        d: 2,
      }),
      numv(3, (i) => {
        const km2 = [3100000, 1000000, 2100000][i];
        const ar = [920000, 300000, 600000][i];
        return {
          enunciado: `Si una cuenca tiene ${km2.toLocaleString('es-AR')} km² y ${ar.toLocaleString('es-AR')} km² están en Argentina, ¿qué porcentaje de la cuenca está en el país? Redondeá a entero.`,
          valor: Math.round((ar / km2) * 100),
          unidad: '%',
          tol: 1,
          explicacion: `${ar.toLocaleString('es-AR')} ÷ ${km2.toLocaleString('es-AR')} × 100 ≈ ${Math.round((ar / km2) * 100)} %. El resto está en otros países: por eso hacen falta acuerdos internacionales.`,
        };
      }, { d: 3 }),
      det('Leé esta descripción de un mapa y marcá los errores.', [
        ['La divisoria de aguas separa hacia dónde escurre la lluvia.', false],
        ['Un afluente es un río que nace del mar.', true, 'Un afluente vuelca sus aguas en otro río; no nace del mar.'],
        ['La cuenca del Plata termina en el Río de la Plata.', false],
        ['Lo que pasa río abajo afecta sobre todo a quienes viven río arriba.', true, 'Es al revés: lo de arriba afecta a los de abajo.'],
      ], 'El agua fluye de arriba hacia abajo, y con ella viajan los efectos.', { d: 3 }),
      comp('Completá.', 'Una [cuenca] es todo el territorio que [drena] hacia el mismo río; sus bordes son las [divisorias] de aguas.', ['provincia', 'evapora', 'costas'], 'Leer el territorio por cuencas es leerlo como lo lee el agua.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Humedales: esponjas vivas', 'Qué hacen los humedales por nosotros, por qué se pierden y qué pasa cuando se queman o se rellenan.', [
      teoria('Qué es un humedal', [
        'Un humedal es un ambiente donde el agua cubre el suelo o lo mantiene saturado durante al menos una parte del año: bañados, esteros, lagunas, turberas, mallines, deltas y costas con marismas. En Argentina hay humedales enormes, como los Esteros del Iberá o el Delta del Paraná, y otros chiquitos en cada pueblo.',
        'Por mucho tiempo se los vio como "tierras improductivas" para drenar o rellenar. Hoy se sabe que están entre los ecosistemas más valiosos del planeta.',
      ]),
      teoria('Lo que hacen', [
        'Los humedales funcionan como esponjas: absorben el agua en las crecidas y la liberan de a poco en las secas, lo que reduce inundaciones y sequías. Filtran el agua: sus plantas y su suelo retienen sedimentos y nutrientes. Recargan acuíferos. Guardan carbono, sobre todo las turberas.',
        'Además son hogar de una enorme diversidad de vida —aves, peces, anfibios, carpinchos, ciervos de los pantanos— y sostienen actividades como la pesca y el turismo.',
      ], { lista: ['Amortiguan inundaciones y sequías', 'Filtran y limpian el agua', 'Recargan acuíferos', 'Guardan carbono', 'Albergan mucha biodiversidad'] }),
      mult('¿Qué servicios presta un humedal sano? Marcá todos.', [
        '+Absorber agua en las crecidas',
        '+Retener sedimentos y nutrientes',
        '+Dar hábitat a aves, peces y anfibios',
        '+Guardar carbono en el suelo',
        '-Producir agua salada para la costa',
      ], 'Un humedal hace muchas cosas a la vez, y gratis. Reemplazar cualquiera de esas funciones con obras cuesta muchísimo.', { d: 1 }),
      cad('Armá la cadena de cómo un humedal reduce una inundación río abajo.', [
        'Una lluvia fuerte hace crecer el río',
        'El agua se expande sobre el humedal',
        'El humedal la retiene como una esponja',
        'La devuelve de a poco en los días siguientes',
        'El pico de la crecida río abajo es más bajo',
      ], ['El humedal evapora toda el agua en una hora'], 'El humedal no hace desaparecer el agua: la reparte en el tiempo. Eso baja el pico de la crecida, que es lo que inunda.', { d: 2 }),
      teoria('Lo que los amenaza', [
        'Se estima que buena parte de los humedales del mundo se perdieron en los últimos siglos. Las causas principales: drenarlos para agricultura, rellenarlos para construir, contaminarlos y quemarlos.',
        'En el Delta del Paraná hubo grandes incendios en 2020 y en años siguientes, en un contexto de bajante extrema del río, que afectaron cientos de miles de hectáreas y llenaron de humo a ciudades como Rosario. Muchos se asociaron a quemas para manejo de pasturas que se descontrolaron.',
      ]),
      clas('¿Esta actividad amenaza al humedal o lo protege?', {
        'Lo amenaza': ['Rellenarlo para construir un barrio', 'Drenarlo con canales para sembrar', 'Quemar pastizales en época seca'],
        'Lo protege': ['Declararlo área protegida con control real', 'Restaurar la vegetación nativa de las orillas', 'Limitar los terraplenes que cortan el paso del agua'],
      }, 'Las amenazas suelen cambiar cómo se mueve el agua; las protecciones la dejan moverse.', { d: 2 }),
      teoria('Ramsar', [
        'La Convención de Ramsar, firmada en 1971 en Irán, es un tratado internacional para la conservación y el uso racional de los humedales. Los países designan "sitios Ramsar", humedales de importancia internacional.',
        'Argentina tiene más de veinte sitios Ramsar, entre ellos la Laguna de Pozuelos, la Laguna Mar Chiquita en Córdoba y los Esteros del Iberá. En el Congreso se discutieron varias veces proyectos de ley de presupuestos mínimos para humedales.',
      ]),
      op('¿Qué es un sitio Ramsar?', [
        'Un humedal de importancia internacional designado por un país',
        'Una represa que regula el caudal de un río',
        ['Un parque nacional con cualquier tipo de ambiente', 'Ramsar es específico de humedales, aunque un sitio puede estar dentro de un parque.'],
        'Una planta de tratamiento de agua en un humedal',
      ], 'Ramsar reconoce el valor internacional de un humedal y compromete al país a usarlo de forma racional.', { d: 2 }),
      vf('Un humedal sin agua durante parte del año deja de ser un humedal y se puede rellenar sin problemas.', false, 'Muchos humedales se secan en parte según la estación o los años: esa variación es parte de su funcionamiento. Rellenarlo en la época seca destruye su capacidad de absorber la próxima crecida.', {
        razones: ['+Porque inundarse y secarse de forma periódica es parte de cómo funciona', '-Porque los humedales tienen agua todo el año siempre', '-Porque rellenar un humedal le agrega capacidad de absorber agua'],
        d: 3,
      }),
      rank('Ordená estos humedales argentinos por superficie aproximada, de mayor a menor.', [
        ['Delta del Paraná', '≈ 1,75 millones de hectáreas'],
        ['Esteros del Iberá', '≈ 1,3 millones de hectáreas'],
        ['Laguna Mar Chiquita (Córdoba)', '≈ 600.000 hectáreas en crecidas'],
        ['Reserva Ecológica Costanera Sur', '≈ 350 hectáreas'],
      ], 'Valores aproximados. Del Delta a una reserva urbana hay cuatro órdenes de magnitud, pero todos cumplen funciones.', { d: 3 }),
      det('Leé este cartel de un loteo y marcá lo engañoso.', [
        ['Barrio náutico con vista al río.', false],
        ['Construido sobre terrenos "improductivos" rellenados con tierra.', true, 'Los humedales no son improductivos: prestan servicios que se pierden al rellenarlos.'],
        ['Con lagunas artificiales para el paisaje.', false],
        ['Sin ningún riesgo de inundación para los barrios vecinos.', true, 'Rellenar un humedal le quita a la zona su capacidad de absorber crecidas: el agua va a otro lado.'],
      ], 'El agua que el relleno deja sin lugar no desaparece: se va a los terrenos de al lado.', { d: 4 }),
      par('Uní cada humedal con su tipo.', [
        ['Esteros del Iberá', 'Esteros y lagunas de agua dulce'],
        ['Delta del Paraná', 'Islas y bañados de un delta de río'],
        ['Mallín patagónico', 'Pradera húmeda de montaña'],
        ['Bahía de Samborombón', 'Humedal costero con marismas'],
      ], 'Hay humedales de muchas formas. Todos tienen en común el agua que satura el suelo al menos parte del año.', { d: 2 }),
      comp('Completá.', 'Los humedales funcionan como [esponjas]: guardan agua en las [crecidas] y la liberan en las [secas].', ['piedras', 'heladas', 'noches'], 'Esa capacidad de repartir el agua en el tiempo es su servicio más valioso frente a inundaciones y sequías.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Por qué se inundan las ciudades', 'Cemento, arroyos entubados y lluvias más intensas: las causas, y la diferencia entre obras grises y soluciones verdes.', [
      teoria('La ciudad impermeable', [
        'En un campo o un bosque, gran parte de la lluvia se infiltra en el suelo o la retienen las plantas. En una ciudad, calles, veredas y techos son impermeables: casi toda el agua escurre por la superficie, y lo hace rápido.',
        'El resultado es que, ante la misma lluvia, llega mucha más agua y en menos tiempo a los desagües y arroyos. Si superan su capacidad, el agua se acumula en las calles.',
      ]),
      cad('Armá la cadena de una inundación urbana.', [
        'Una tormenta fuerte cae sobre la ciudad',
        'El suelo impermeable no deja infiltrar el agua',
        'Toda el agua escurre rápido hacia los desagües',
        'Los desagües y arroyos se saturan',
        'El agua se acumula en las calles y las casas',
      ], ['Los árboles de la vereda producen más lluvia'], 'Es la misma cadena del arroyo del barrio del tronco, a escala de ciudad.', { d: 2 }),
      teoria('Los arroyos escondidos', [
        'Muchas ciudades crecieron sobre arroyos que después se entubaron: se metieron en conductos bajo las calles. En la Ciudad de Buenos Aires, arroyos como el Maldonado, el Vega o el Medrano corren entubados debajo de avenidas. Cuando llueve mucho, el agua "recuerda" su valle y se junta sobre esas zonas bajas.',
        'Para el Maldonado se construyeron grandes túneles aliviadores, inaugurados en 2012, que llevan el exceso de agua al Río de la Plata. Son un ejemplo de obra gris: infraestructura de cemento para mover el agua.',
      ]),
      op('¿Por qué las calles que están sobre un arroyo entubado se inundan más?', [
        'Porque están en el valle natural adonde el agua escurre',
        'Porque el caño del arroyo pierde agua potable',
        ['Porque ahí llueve más que en el resto de la ciudad', 'La lluvia es la misma: lo que cambia es que el agua escurre hacia el valle del arroyo.'],
        'Porque el asfalto de esas calles es de peor calidad',
      ], 'El arroyo está bajo tierra, pero el relieve sigue ahí: el agua de lluvia baja hacia su valle como siempre lo hizo.', { d: 2 }),
      teoria('Soluciones verdes', [
        'Además de las obras grises (túneles, conductos, bombas), existen soluciones basadas en la naturaleza: plazas y parques que se pueden inundar un rato sin daño (reservorios), veredas y estacionamientos permeables, cordones verdes y jardines de lluvia que infiltran el agua, techos verdes que la retienen, y arbolado que intercepta parte de la lluvia.',
        'Estas soluciones no reemplazan del todo a las grises en tormentas extremas, pero reducen y retrasan el agua que llega a los desagües, y además dan sombra, verde y biodiversidad.',
      ], { lista: ['Plazas reservorio que se inundan sin daño', 'Pavimentos permeables', 'Jardines de lluvia en veredas', 'Techos verdes', 'Más árboles y suelo absorbente'] }),
      clas('¿Es una solución gris o una solución verde?', {
        'Gris (infraestructura de cemento)': ['Túnel aliviador bajo la avenida', 'Estación de bombeo', 'Ensanchar los conductos pluviales'],
        'Verde (basada en la naturaleza)': ['Plaza que funciona como reservorio', 'Jardín de lluvia en la vereda', 'Techo verde en un edificio'],
      }, 'Lo ideal es combinarlas: las verdes reducen el agua que llega, las grises la manejan cuando igual sobra.', { d: 2 }),
      mult('¿Qué beneficios extra tienen las soluciones verdes, además de manejar la lluvia? Marcá todos.', [
        '+Dan sombra y bajan la temperatura',
        '+Suman hábitat para aves e insectos',
        '+Mejoran el paisaje y el uso del espacio público',
        '-Eliminan por completo el riesgo de cualquier inundación',
        '-No necesitan ningún mantenimiento',
      ], 'Son soluciones con muchos beneficios a la vez. Pero no hacen magia: en eventos extremos también hacen falta las obras grises, y todas necesitan mantenimiento.', { d: 2 }),
      numv(3, (i) => {
        const m2 = [2000, 5000, 1200][i];
        const mm = [40, 30, 60][i];
        return {
          enunciado: `Una plaza reservorio de ${m2.toLocaleString('es-AR')} m² puede retener temporalmente una lámina de agua. Si una tormenta deja ${mm} mm, ¿cuántos litros caen sobre la plaza?`,
          valor: m2 * mm,
          unidad: 'litros',
          explicacion: `Cada milímetro sobre un metro cuadrado es un litro: ${m2.toLocaleString('es-AR')} × ${mm} = ${(m2 * mm).toLocaleString('es-AR')} litros que no llegan de golpe a los desagües si la plaza los retiene.`,
        };
      }, { d: 3 }),
      teoria('Lluvias más intensas', [
        'El cambio climático hace más frecuentes las lluvias muy intensas en muchas regiones, porque un aire más caliente puede cargar más vapor de agua. Eso quiere decir que infraestructura diseñada para las tormentas del pasado puede quedar corta.',
        'Por eso las ciudades planifican con escenarios futuros, protegen sus zonas absorbentes y evitan construir en las áreas que el agua necesita.',
      ]),
      vf('Si una ciudad construyó túneles aliviadores, ya no necesita cuidar sus espacios verdes para manejar la lluvia.', false, 'Los túneles tienen una capacidad máxima. Si la ciudad sigue impermeabilizando, cada vez llega más agua más rápido y la obra queda chica antes de tiempo. Las soluciones verdes alivian a las grises.', {
        razones: ['+Porque seguir impermeabilizando satura cualquier obra', '-Porque los túneles tienen capacidad infinita', '-Porque los espacios verdes aumentan las inundaciones'],
        d: 3,
      }),
      det('Leé esta propuesta de un candidato y marcá lo que no se sostiene.', [
        ['Vamos a mantener limpios los sumideros antes de la temporada de lluvias.', false],
        ['Vamos a pavimentar todas las plazas para que el agua corra más rápido al río.', true, 'Quitar suelo absorbente aumenta el agua que llega de golpe a los desagües.'],
        ['Vamos a sumar jardines de lluvia en las avenidas.', false],
        ['Con eso las inundaciones van a desaparecer para siempre.', true, 'Ninguna solución elimina el riesgo; se reduce y se maneja.'],
      ], 'Hacer correr el agua más rápido es trasladar el problema. Y ninguna obra promete riesgo cero con honestidad.', { d: 3 }),
      comp('Completá.', 'Las soluciones [grises] mueven el agua con cemento; las [verdes] la infiltran o la retienen; lo mejor es [combinarlas].', ['rojas', 'eliminarlas', 'secas'], 'Grises y verdes no compiten: se complementan.', { d: 2 }),
      rank('Ordená estas superficies por cuánta lluvia infiltran, de más a menos.', [
        ['Un bosque con suelo cubierto de hojas', 'infiltra la mayor parte'],
        ['Una plaza con pasto', 'infiltra bastante'],
        ['Un estacionamiento de pavimento permeable', 'infiltra algo'],
        ['Una avenida asfaltada', 'casi nada'],
      ], 'Cuanto menos infiltra una superficie, más agua escurre hacia los desagües. La ciudad, casi toda asfalto y techos, está en la última fila.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Represas y caudal ecológico', 'Energía, riego y control de crecidas, a cambio de ríos cortados. Cómo se evalúa una represa.', [
      teoria('Qué dan las represas', [
        'Una represa corta un río y forma un embalse. Sirve para generar electricidad (hidroeléctricas), guardar agua para riego y consumo, y regular las crecidas. En Argentina hay grandes represas sobre el Paraná, el Uruguay, el Limay y muchos otros ríos, y la energía hidroeléctrica es una parte importante de la electricidad del país.',
        'Son infraestructuras muy útiles, y también tienen costos ambientales y sociales. Evaluarlas es sopesar las dos cosas.',
      ]),
      clas('¿Es un beneficio o un costo de una represa?', {
        'Beneficio': ['Genera electricidad sin quemar combustibles', 'Guarda agua para riego en épocas secas', 'Reduce los picos de algunas crecidas'],
        'Costo': ['Inunda tierras, bosques y a veces pueblos', 'Corta el paso de peces que migran', 'Retiene sedimentos que el río llevaba al delta'],
      }, 'Las dos columnas son reales. Una buena evaluación las pone a la vista antes de decidir, no después.', { d: 2 }),
      teoria('Un río cortado', [
        'Muchos peces de río, como el sábalo o el dorado en la cuenca del Plata, migran río arriba para reproducirse. Una represa sin pasos para peces puede cortar ese ciclo. Además, el embalse retiene sedimentos: aguas abajo, el río llega "con hambre" de sedimento y puede erosionar sus orillas y el delta.',
        'También cambia el ritmo del agua: un río que antes tenía crecidas y bajantes naturales pasa a tener un caudal regulado por las necesidades de la usina o del riego.',
      ]),
      cad('Armá la cadena de cómo una represa puede afectar a un delta río abajo.', [
        'El embalse frena el agua',
        'Los sedimentos se depositan en el fondo del embalse',
        'El río sale de la represa con poco sedimento',
        'Llega menos sedimento al delta',
        'El delta deja de crecer y puede erosionarse',
      ], ['La represa agrega arena nueva al río'], 'Los deltas se construyen con el sedimento que traen los ríos. Si el sedimento queda atrapado arriba, el delta pierde su material de construcción.', { d: 3 }),
      teoria('El caudal ecológico', [
        'El caudal ecológico es la cantidad de agua, y el ritmo de variación, que un río necesita para mantener vivo su ecosistema y los usos que dependen de él. No alcanza con "que corra algo de agua": también importan las crecidas estacionales que disparan la reproducción de peces o inundan los humedales.',
        'Cuando se reparte el agua de un río entre riego, energía y ciudades, el caudal ecológico es la parte que se le reserva al río mismo.',
      ], { destacado: { valor: 'Caudal ecológico', texto: 'el agua y el ritmo que un río necesita para seguir vivo.' } }),
      op('¿Qué es el caudal ecológico de un río?', [
        'El agua y el ritmo mínimos para que el río siga vivo',
        'La cantidad máxima de agua que se puede sacar sin permiso',
        ['El agua que sobra después del riego y la energía', 'Es al revés: se reserva antes de repartir el resto, no lo que sobra.'],
        'El caudal de un río que no tiene ninguna represa',
      ], 'Se reserva para el río antes de repartir. Si se calcula "con lo que sobra", en años secos no sobra nada.', { d: 2 }),
      vf('Para cuidar un río alcanza con que nunca se seque del todo, aunque el caudal sea siempre el mismo.', false, 'Muchos ecosistemas dependen de la variación: las crecidas inundan humedales y disparan la reproducción de peces. Un caudal mínimo constante sin crecidas puede empobrecer el río.', {
        razones: ['+Porque también importan las crecidas y bajantes naturales', '-Porque los ríos no necesitan agua', '-Porque las crecidas siempre son dañinas'],
        d: 3,
      }),
      rank('Una provincia evalúa una represa. Ordená estas preguntas por importancia para decidir si conviene, empezando por la más de fondo.', [
        ['¿Hay otra forma de lograr lo mismo con menos daño?', 'alternativas'],
        ['¿Qué ecosistemas y comunidades se inundan o se afectan?', 'costos'],
        ['¿Cuánta energía o agua va a aportar?', 'beneficios'],
        ['¿Qué color va a tener la represa?', 'irrelevante'],
      ], 'Una evaluación seria arranca por las alternativas y los costos, no solo por los beneficios. Y hay preguntas que no importan.', { d: 3 }),
      par('Uní cada problema de una represa con una medida que lo reduce.', [
        ['Peces migratorios cortados', 'Escaleras o ascensores para peces'],
        ['Sedimento retenido', 'Descargas de fondo que liberan sedimento'],
        ['Río sin crecidas', 'Liberar crecidas controladas en ciertas épocas'],
        ['Comunidades desplazadas', 'Consulta previa y reubicación digna'],
      ], 'Muchos costos se pueden reducir, aunque no eliminar. Hay que diseñarlos desde el principio.', { d: 3 }),
      mult('¿Qué debería incluir una evaluación de impacto ambiental seria de una represa? Marcá todo.', [
        '+Estudios de los peces y humedales afectados',
        '+Consulta a las comunidades de la zona',
        '+Análisis de alternativas',
        '+Plan de caudal ecológico',
        '-Solo el costo de construcción',
      ], 'La Ley General del Ambiente exige evaluar el impacto de obras que puedan degradar el ambiente, y la participación ciudadana es parte de eso.', { d: 3 }),
      det('Leé este informe de una empresa y marcá lo cuestionable.', [
        ['La represa generará electricidad sin emisiones de combustión.', false],
        ['No afectará a ningún pez porque los peces se adaptan a los lagos.', true, 'Muchas especies migratorias necesitan el río libre para reproducirse.'],
        ['El embalse inundará 20.000 hectáreas de monte.', false],
        ['El caudal ecológico será lo que sobre después de producir energía.', true, 'El caudal ecológico se reserva primero, no con lo que sobra.'],
      ], 'Los dos errores son clásicos: suponer que la naturaleza "se adapta" y tratar al río como el último de la fila.', { d: 4 }),
      comp('Completá.', 'Una represa da energía y guarda agua, pero retiene [sedimentos], corta el paso de [peces] y cambia el [caudal] del río.', ['nubes', 'barcos', 'color'], 'Tres costos típicos que hay que poner en la balanza.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Repartir el agua', 'Ciudades, campos, industrias y ríos: cómo se decide quién usa el agua cuando no alcanza para todos.', [
      teoria('Usos que compiten', [
        'El agua de una cuenca la usan muchos a la vez: el consumo humano, el riego, la ganadería, la industria, la energía, el turismo y el propio río. En años de abundancia alcanza para todos; en años secos, aparecen los conflictos.',
        'A nivel mundial, la agricultura es el mayor usuario de agua dulce extraída: alrededor del 70 %, según Naciones Unidas. En zonas de riego como Cuyo, esa proporción puede ser aún mayor.',
      ], { destacado: { valor: '≈ 70 %', texto: 'del agua dulce extraída en el mundo se usa en la agricultura, según Naciones Unidas.' } }),
      op('A nivel mundial, ¿qué actividad extrae más agua dulce?', [
        'La agricultura, sobre todo el riego',
        'El consumo de agua en las casas',
        ['La industria de bebidas', 'La industria usa mucha agua, pero la agricultura la supera ampliamente a nivel mundial.'],
        'Las piletas de natación de los clubes',
      ], 'Por eso las mejoras en riego (goteo, horarios, cultivos adecuados) mueven mucho más agua que cualquier ahorro doméstico en la escala de una cuenca.', { d: 1 }),
      teoria('Prioridades', [
        'En la mayoría de las legislaciones, el consumo humano tiene prioridad sobre los demás usos: primero el agua para que la gente viva. Después se ordenan los otros según cada provincia, que en Argentina es la que tiene el dominio originario de sus recursos naturales, incluida el agua.',
        'Cuando un río cruza varias provincias, las decisiones de una afectan a las otras, y hacen falta acuerdos. Si no los hay, a veces el conflicto llega a la Justicia.',
      ]),
      teoria('El caso del río Atuel', [
        'El río Atuel nace en Mendoza y, históricamente, llegaba a La Pampa. Durante décadas, el uso del agua para riego y energía en Mendoza dejó el tramo pampeano seco la mayor parte del tiempo, afectando humedales y comunidades del oeste de La Pampa.',
        'La Pampa llevó el conflicto a la Corte Suprema, que en 2017 ordenó a las provincias acordar un caudal mínimo para que el río vuelva a llegar a La Pampa, con participación del Estado nacional. Es un caso de estudio sobre ríos compartidos y caudal ecológico.',
      ]),
      ord('Ordená los hechos del conflicto por el Atuel.', [
        'El río llega de Mendoza a La Pampa',
        'Mendoza intensifica el uso para riego y energía',
        'El tramo pampeano queda seco la mayor parte del tiempo',
        'La Pampa acude a la Corte Suprema',
        'La Corte ordena acordar un caudal mínimo',
      ], 'Un conflicto de cuenca clásico: uso aguas arriba, daño aguas abajo, y la Justicia pidiendo un acuerdo.', { d: 2, extremos: ['Primero', 'Último'] }),
      vf('En un río compartido, la provincia de aguas arriba puede usar toda el agua que quiera porque el río nace en su territorio.', false, 'Un río interprovincial es un recurso compartido: el uso aguas arriba no puede dejar sin agua a quienes están aguas abajo. Por eso la Corte ordenó acordar un caudal para el Atuel.', {
        razones: ['+Porque un río compartido obliga a considerar a quienes están aguas abajo', '-Porque el agua es de quien la ve primero', '-Porque los ríos no cruzan provincias'],
        d: 2,
      }),
      clas('¿Qué medida ayuda a repartir mejor el agua de una cuenca en un año seco?', {
        'Ayuda a repartir mejor': ['Pasar riego por inundación a riego por goteo', 'Reparar pérdidas en los canales', 'Acordar entre usuarios turnos y prioridades'],
        'Empeora el reparto': ['Que cada usuario perfore más pozos sin control', 'Ocultar cuánta agua se saca', 'Ignorar el caudal ecológico'],
      }, 'Eficiencia, transparencia y acuerdos: las tres patas de una buena gestión del agua en escasez.', { d: 2 }),
      teoria('Participar en la gestión', [
        'Muchas cuencas tienen comités u organismos donde participan gobiernos, usuarios y a veces la sociedad civil. Las leyes argentinas prevén instancias de participación, como audiencias públicas antes de grandes obras, y el acceso a la información ambiental.',
        'Saber quién decide sobre el agua de tu región, y cómo se puede participar, es tan importante como cuidarla en casa. Lo vas a profundizar en la rama de Comunidad.',
      ]),
      mult('¿Qué acciones permiten participar en decisiones sobre el agua? Marcá todas.', [
        '+Pedir información pública sobre cuánta agua se extrae',
        '+Participar de una audiencia pública antes de una obra',
        '+Sumarse a una organización de la cuenca',
        '-Esperar a que el río se seque para opinar',
        '-Opinar sin haber leído ningún dato',
      ], 'Información, participación formal y organización colectiva: tres caminos concretos.', { d: 2 }),
      numv(3, (i) => {
        const tot = [100, 80, 150][i];
        const riego = [70, 60, 105][i];
        const ahorro = [20, 25, 30][i];
        return {
          enunciado: `En una cuenca se extraen ${tot} millones de m³ por año, de los cuales ${riego} son para riego. Si el riego se vuelve un ${ahorro} % más eficiente, ¿cuántos millones de m³ quedan libres para otros usos o para el río?`,
          valor: (riego * ahorro) / 100,
          unidad: 'millones de m³',
          dec: 1,
          explicacion: `${ahorro} % de ${riego} = ${riego} × ${ahorro} ÷ 100 = ${((riego * ahorro) / 100).toLocaleString('es-AR')} millones de m³. Por el tamaño del riego, una mejora modesta libera muchísima agua.`,
        };
      }, { d: 3 }),
      det('Leé este comentario en un debate y marcá los errores.', [
        ['En la mayoría de las leyes, el consumo humano tiene prioridad.', false],
        ['Como el riego usa tanta agua, ahorrar en casa no sirve para nada.', true, 'En casa se ahorra agua potable, que cuesta tratar y distribuir; además, es parte de la cultura de cuidado. Las dos escalas importan.'],
        ['La Corte Suprema ordenó acordar un caudal mínimo para el Atuel.', false],
        ['Un río que nace en una provincia es propiedad exclusiva de esa provincia, aunque siga hacia otra.', true, 'Un río interprovincial es un recurso compartido.'],
      ], 'Escalas que se complementan y ríos que se comparten: las dos ideas que ordenan cualquier debate sobre el agua.', { d: 4 }),
      par('Uní cada usuario del agua con una forma de usarla mejor.', [
        ['Agricultura', 'Riego por goteo y cultivos adaptados'],
        ['Ciudades', 'Reducir pérdidas en la red'],
        ['Industria', 'Reciclar el agua dentro de la planta'],
        ['El propio río', 'Garantizar su caudal ecológico'],
      ], 'Cada usuario tiene su palanca de eficiencia. El río también es un "usuario" con derechos en la cuenca.', { d: 2 }),
      cad('Armá la cadena de cómo una sequía convierte un reparto tranquilo en un conflicto.', [
        'Llueve mucho menos que lo normal en la cuenca',
        'El caudal del río baja',
        'El agua ya no alcanza para todos los usos de siempre',
        'Cada usuario presiona por su parte',
        'Sin reglas claras, aparece el conflicto',
      ], ['La sequía hace que el río lleve más agua'], 'Por eso las reglas de reparto se acuerdan en años normales, antes de que llegue la sequía.', { d: 3 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: cuencas, humedales e inundaciones', 'Cuencas, humedales, ciudades, represas y reparto del agua, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el loteo en el bañado', 'Un municipio tiene que decidir sobre un barrio nuevo en un humedal. Evaluá con datos.', [
      teoria('El caso', [
        'Un municipio del delta bonaerense recibe un pedido para construir un barrio de 300 casas sobre un bañado de 150 hectáreas que se inunda en las crecidas del río. El proyecto prevé rellenar el terreno 2 metros y hacer una laguna decorativa. Río abajo hay un pueblo que en la última crecida tuvo agua en las calles.',
        'La empresa dice que el barrio "no afectará a nadie". Una organización vecinal pide que se evalúe el impacto. Te toca analizar.',
      ]),
      op('¿Qué función del bañado se pierde más directamente si se lo rellena?', [
        'Absorber y retener agua en las crecidas',
        'Producir lluvia para la región',
        ['Aportar agua potable a las canillas del pueblo', 'Puede recargar acuíferos, pero lo más directo y medible es la pérdida de la capacidad de absorber crecidas.'],
        'Bajar la temperatura del río en invierno',
      ], 'Un relleno de 2 metros elimina el volumen donde el agua de la crecida se guardaba. Esa agua va a ir a otro lado.', { ctx: 'Bañado de 150 ha que se inunda en las crecidas; se propone rellenarlo 2 m para 300 casas; río abajo hay un pueblo que ya se inundó.', d: 3 }),
      num('Si en una crecida el bañado guarda una lámina de agua de 0,5 m sobre sus 150 hectáreas, ¿cuántos millones de litros guarda? (1 ha = 10.000 m²)', 750, 'millones de litros', '150 ha = 1.500.000 m². × 0,5 m = 750.000 m³. Como cada m³ son 1.000 litros, son 750.000.000 litros: 750 millones de litros que el relleno mandaría a otro lado.', { ctx: 'Bañado de 150 hectáreas; en una crecida guarda una lámina de 0,5 m de agua.', d: 4 }),
      cad('Armá la cadena de efectos del relleno sobre el pueblo de río abajo.', [
        'Se rellena el bañado 2 metros',
        'El agua de la crecida pierde su lugar',
        'Escurre hacia los terrenos vecinos y río abajo',
        'El pico de la crecida en el pueblo es más alto',
        'El pueblo se inunda más y más seguido',
      ], ['La laguna decorativa absorbe toda la crecida'], 'Una laguna decorativa es chica comparada con el volumen del bañado, y suele estar llena. No compensa lo perdido.', { d: 4 }),
      clas('Clasificá los argumentos que aparecen en el debate.', {
        'Basado en evidencia': ['El bañado guardó cientos de millones de litros en la última crecida', 'El pueblo de río abajo ya se inundó con el bañado intacto', 'La zona figura como inundable en los mapas de riesgo'],
        'Sin evidencia o engañoso': ['"El barrio no afectará a nadie"', '"El humedal es un terreno improductivo"', '"La laguna decorativa resuelve el problema"'],
      }, 'En un debate ambiental, pedir datos y separar evidencia de slogans es la tarea principal.', { d: 3 }),
      mult('¿Qué debería pedir el municipio antes de decidir? Marcá todo lo razonable.', [
        '+Un estudio hidrológico del efecto del relleno río abajo',
        '+Una evaluación de impacto ambiental con audiencia pública',
        '+Alternativas de ubicación fuera del humedal',
        '-La promesa verbal de la empresa de que no habrá problemas',
        '-Aprobar primero y estudiar después',
      ], 'Estudios, participación y alternativas antes de decidir. Evaluar después de aprobar no es evaluar.', { d: 3 }),
      rank('Ordená las opciones del municipio según cuánto protegen al pueblo de río abajo, de más a menos.', [
        ['Rechazar el relleno y proteger el bañado', 'mantiene toda su capacidad'],
        ['Aprobar un barrio chico en la parte alta, sin relleno del bañado', 'mantiene casi toda'],
        ['Aprobar con relleno parcial y obras de compensación', 'pierde parte, compensa algo'],
        ['Aprobar el proyecto tal como está', 'pierde toda la capacidad'],
      ], 'Hay opciones intermedias, y todas se pueden discutir. Lo importante es saber qué se pierde con cada una.', { d: 4 }),
      vf('Como el bañado está seco la mayor parte del año, rellenarlo no cambia nada en las crecidas.', false, 'Su valor está justamente en los momentos de crecida: ahí guarda cientos de millones de litros. Estar seco el resto del año es parte de su ciclo, no una prueba de que sobra.', {
        razones: ['+Porque su función se activa en las crecidas, aunque el resto del año esté seco', '-Porque un bañado seco no puede volver a inundarse', '-Porque las crecidas no llegan a los bañados'],
        d: 3,
      }),
      det('El diario local publica un resumen. Marcá los errores.', [
        ['El bañado de 150 hectáreas guardó cientos de millones de litros en la última crecida.', false],
        ['El relleno solo afectaría al terreno del barrio, sin efectos afuera.', true, 'El agua que pierde su lugar escurre hacia los vecinos y río abajo.'],
        ['Los vecinos pidieron una evaluación de impacto con audiencia pública.', false],
        ['La laguna decorativa guardará más agua que el bañado original.', true, 'Una laguna chica y llena no reemplaza el volumen de un bañado de 150 hectáreas.'],
      ], 'El agua no desaparece por decreto: si se le quita el lugar, lo busca en otro lado.', { d: 4 }),
    ]),
  ],
});
