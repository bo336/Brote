import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// MOVILIDAD 1 — Cómo nos movemos.
// La base de la rama: por qué y cómo nos movemos, la huella de cada forma
// de viajar, el peso de la ocupación, el espacio que ocupa cada modo y los
// efectos del tránsito en la salud. Retoma energía y emisiones (energia-1
// si ya la hiciste) y elegir por impacto (tronco-3).

export default unidad({
  slug: 'movilidad-1',
  rama: 'movilidad',
  orden: 1,
  nivel: 1,
  requiereTronco: 1,
  titulo: 'Cómo nos movemos',
  bajada: 'A pie, en bici, en colectivo, en tren o en auto: cuánto emite, cuánto espacio ocupa y cuánto cuesta en salud cada forma de moverse.',
  objetivos: [
    'Describir los modos de transporte y por qué se eligen',
    'Comparar las emisiones por persona y por kilómetro de cada modo',
    'Explicar el efecto de la ocupación de un vehículo en su huella',
    'Comparar el espacio urbano que ocupa cada modo',
    'Relacionar el tránsito con la seguridad vial, el aire y la salud',
  ],
  repasa: ['tronco-2', 'tronco-3'],
  fuentes: ['owid-transporte', 'oms-seguridad-vial', 'oms-actividad-fisica', 'icct-ev', 'oms-aire-exterior'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Por qué y cómo nos movemos', 'Viajes, distancias y modos: lo que decide cómo se mueve una persona en su ciudad.', [
      teoria('Moverse para llegar', [
        'Casi nadie viaja por viajar: nos movemos para llegar al trabajo, a la escuela, al médico, a hacer compras o a ver a alguien. Por eso la movilidad depende de dónde están las cosas: si todo queda lejos, hay que viajar más.',
        'Los modos de transporte se suelen agrupar en activos (caminar, bicicleta), colectivos (colectivo, tren, subte, tranvía) e individuales motorizados (auto, moto).',
      ]),
      clas('¿A qué grupo pertenece cada modo?', { // e1
        'Activo': ['Caminar', 'Bicicleta'],
        'Colectivo o público': ['Colectivo', 'Tren', 'Subte'],
        'Individual motorizado': ['Auto', 'Moto'],
      }, 'Tres grandes grupos con impactos muy distintos en emisiones, espacio y salud.', { d: 1 }),
      teoria('Qué decide cómo viajamos', [
        'Cada persona elige cómo moverse según la distancia, el tiempo de viaje, el costo, la comodidad, la seguridad, el clima y lo que tiene disponible. Si no hay colectivo cerca o las calles son peligrosas para la bici, la opción de moverse de otra forma casi no existe.',
        'Por eso cambiar la movilidad de una ciudad depende tanto de las decisiones personales como de la infraestructura: veredas, ciclovías, frecuencias del transporte público.',
      ]),
      mult('¿Qué factores influyen en cómo una persona decide viajar? Marcá todos.', [ // e2
        '+La distancia',
        '+El tiempo de viaje',
        '+El costo',
        '+La seguridad del recorrido',
        '-El color de la ropa que lleva puesta',
      ], 'Distancia, tiempo, costo y seguridad pesan mucho. Y lo que la ciudad ofrece define las opciones.', { d: 1 }),
      cad('Armá la cadena de por qué una ciudad dispersa genera más viajes en auto.', [ // e3
        'La ciudad crece con barrios lejos del centro',
        'Las distancias a trabajos y comercios se alargan',
        'Caminar o pedalear deja de ser práctico',
        'El transporte público cubre mal las zonas nuevas',
        'Más personas dependen del auto',
      ], ['El auto hace que la ciudad sea más compacta'], 'La forma de la ciudad decide buena parte de cómo nos movemos. Es un tema de sistema, como en el tronco.', { d: 2 }),
      teoria('Distancias y tiempos', [
        'Caminando se recorren unos 4 a 5 km por hora; en bicicleta, unos 12 a 18 km por hora en la ciudad. Para viajes de hasta 1 o 2 km, caminar suele ser competitivo; hasta 5 a 8 km, la bicicleta suele ser tan rápida como el auto en horas pico, sin contar el tiempo de estacionar.',
      ]),
      numv(3, (i) => { // e4
        const km = [3, 5, 2][i];
        const vel = [15, 15, 12][i];
        return {
          enunciado: `¿Cuántos minutos tarda en bicicleta alguien que recorre ${km} km a ${vel} km por hora?`,
          valor: Math.round((km / vel) * 60),
          unidad: 'minutos',
          explicacion: `${km} ÷ ${vel} = ${(km / vel).toLocaleString('es-AR', { maximumFractionDigits: 3 })} horas, que son ${Math.round((km / vel) * 60)} minutos. En hora pico, muchas veces menos que el auto.`,
        };
      }, { d: 2 }),
      numv(3, (i) => { // e5
        const km = [1.5, 2, 1][i];
        return {
          enunciado: `¿Cuántos minutos se tarda en caminar ${km.toLocaleString('es-AR')} km a 5 km por hora?`,
          valor: (km / 5) * 60,
          unidad: 'minutos',
          explicacion: `${km.toLocaleString('es-AR')} ÷ 5 × 60 = ${(km / 5) * 60} minutos. Muchos viajes cotidianos en auto son de estas distancias.`,
        };
      }, { d: 1 }),
      par('Uní cada distancia con el modo que suele ser más práctico en la ciudad.', [ // e6
        ['Menos de 1 km', 'Caminar'],
        ['De 2 a 7 km', 'Bicicleta'],
        ['De 10 a 30 km', 'Tren o colectivo'],
        ['Entre ciudades lejanas', 'Micro de larga distancia o tren'],
      ], 'Cada modo tiene su distancia ideal. Combinarlos permite cubrir cualquier viaje.', { d: 2 }),
      vf('Si una ciudad no tiene ciclovías ni veredas seguras, la gente no elige la bici o caminar solo por gusto.', true, 'La infraestructura define las opciones reales. Donde pedalear es peligroso, pocos lo eligen aunque quieran.', { // e7
        razones: ['+Porque la infraestructura define qué opciones son seguras y prácticas', '-Porque a nadie le gusta caminar', '-Porque la bici solo sirve en el campo'],
        d: 2,
      }),
      op('Un vecino hace 800 metros en auto para comprar pan todos los días. ¿Qué alternativa es más razonable?', [ // e8
        'Caminar: son unos 10 minutos',
        'Tomar un colectivo que pasa cada 20 minutos',
        ['Seguir en auto, porque siempre es más rápido', 'En 800 metros, entre arrancar, estacionar y caminar hasta el local, el auto casi no ahorra tiempo.'],
        'Pedir el pan por delivery en moto',
      ], 'En distancias tan cortas, caminar es rápido, gratis y saludable.', { d: 1 }),
      det('Leé este comentario y marcá lo equivocado.', [ // e9
        ['Muchos viajes diarios en auto son de pocos kilómetros.', false],
        ['La bici siempre es más lenta que el auto en la ciudad.', true, 'En distancias cortas y en horas pico, la bici suele ser tan rápida o más.'],
        ['La forma de la ciudad influye en cómo nos movemos.', false],
        ['Cómo viajamos depende solo de la voluntad de cada persona.', true, 'También depende de la infraestructura y las distancias: es un tema de sistema.'],
      ], 'La movilidad es a la vez decisión personal y diseño de ciudad.', { d: 2 }),
      comp('Completá.', 'Caminar y pedalear son modos [activos]; colectivo, tren y subte son modos [colectivos]; y la forma de la [ciudad] define buena parte de cómo nos movemos.', ['pasivos', 'privados', 'ropa'], 'Los grandes grupos de modos y el papel del diseño urbano.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('La huella de cada viaje', 'Gramos de CO₂ por persona y por kilómetro: cómo se comparan el avión, el auto, el colectivo, el tren y la bici.', [
      teoria('Una unidad para comparar', [
        'Para comparar modos se usan las emisiones por pasajero y por kilómetro: cuántos gramos de CO₂e se emiten para mover a una persona un kilómetro. Así se puede comparar un auto con una persona con un colectivo lleno.',
        'Con datos del gobierno británico que publica Nuestro Mundo en Datos, un auto mediano a nafta con una sola persona emite unos 190 g por kilómetro; un colectivo, en promedio, unos 100 g por pasajero y kilómetro; el tren, unos 40; un auto eléctrico, unos 50 con esa red; y la bicicleta y la caminata, prácticamente nada en el viaje.',
      ], {
        datos: barras('Emisiones por pasajero y por kilómetro (Reino Unido, aproximado)', 'g CO₂e', [
          ['Avión (vuelo interno)', 246],
          ['Auto a nafta, 1 persona', 192],
          ['Colectivo (ocupación promedio)', 105],
          ['Auto eléctrico, 1 persona', 53],
          ['Tren', 41],
          ['Bicicleta', 0],
        ], 'Nuestro Mundo en Datos, a partir de factores del gobierno británico. En Argentina cambian según la ocupación y la red eléctrica.'),
      }),
      rank('Ordená estos modos por emisiones por pasajero y kilómetro, de más a menos (valores de referencia).', [ // e1
        ['Avión en vuelo interno', '≈ 246 g'],
        ['Auto a nafta con una persona', '≈ 192 g'],
        ['Colectivo con ocupación promedio', '≈ 105 g'],
        ['Tren', '≈ 41 g'],
        ['Bicicleta', '≈ 0 g en el viaje'],
      ], 'Los vuelos cortos y el auto con una sola persona encabezan la lista. Tren y bici, al fondo.', { d: 2 }),
      numv(3, (i) => { // e2
        const km = [20, 15, 30][i];
        return {
          enunciado: `Una persona viaja ${km} km por día en auto a nafta sola (192 g por km). ¿Cuántos kilos de CO₂e emite por día? Redondeá a un decimal.`,
          valor: Math.round(((km * 192) / 1000) * 10) / 10,
          unidad: 'kg CO₂e',
          dec: 1,
          tol: 0.1,
          explicacion: `${km} × 192 = ${(km * 192).toLocaleString('es-AR')} g = ${(Math.round(((km * 192) / 1000) * 10) / 10).toLocaleString('es-AR')} kg por día. En 230 días laborales, más de ${(Math.floor((km * 192 * 230) / 1e5) / 10).toLocaleString('es-AR')} t por año.`,
        };
      }, { d: 2 }),
      numv(3, (i) => { // e3
        const km = [20, 15, 30][i];
        return {
          enunciado: `Si esa persona hace los ${km} km en tren (41 g por km) en vez de auto (192 g por km), ¿cuántos gramos de CO₂e ahorra por día?`,
          valor: km * (192 - 41),
          unidad: 'g CO₂e',
          explicacion: `${km} × (192 − 41) = ${(km * 151).toLocaleString('es-AR')} g por día: casi el 80 % menos para el mismo viaje.`,
        };
      }, { d: 2 }),
      teoria('El avión', [
        'Por kilómetro, un vuelo de cabotaje emite por pasajero más que casi cualquier otro modo. Y como los vuelos recorren distancias largas, un solo viaje puede pesar tanto como meses de viajes cotidianos. Un vuelo de ida y vuelta de 1.000 km por tramo son unos 2.000 km: con 246 g por km, casi media tonelada de CO₂e por persona.',
        'Para distancias medias, el tren o el micro de larga distancia suelen emitir mucho menos por pasajero.',
      ]),
      numv(3, (i) => { // e4
        const km = [1000, 700, 1500][i];
        return {
          enunciado: `Un vuelo de ida y vuelta tiene ${km.toLocaleString('es-AR')} km por tramo. Con 246 g de CO₂e por pasajero y km, ¿cuántos kg emite cada pasajero? Redondeá al entero.`,
          valor: Math.round((2 * km * 246) / 1000),
          unidad: 'kg CO₂e',
          tol: 1,
          explicacion: `2 × ${km.toLocaleString('es-AR')} × 246 = ${(2 * km * 246).toLocaleString('es-AR')} g ≈ ${Math.round((2 * km * 246) / 1000)} kg. Un solo viaje puede equivaler a meses de trayectos diarios.`,
        };
      }, { d: 3 }),
      vf('Un auto eléctrico no tiene ninguna emisión asociada a su uso.', false, 'No emite por el caño, pero su electricidad se genera en algún lado. Con una red con mucho gas o carbón, sus emisiones por km son mayores que con una red limpia, aunque suelen ser menores que las de un auto a nafta.', { // e5
        razones: ['+Porque su electricidad tiene emisiones según cómo se genera', '-Porque los autos eléctricos queman nafta', '-Porque la electricidad siempre es 100 % limpia'],
        d: 2,
      }),
      clas('¿Este viaje tiene una huella alta o baja por persona?', { // e6
        'Alta': ['Vuelo de 800 km para una reunión', 'Auto grande con una sola persona todos los días', 'Moto de alta cilindrada para viajes largos'],
        'Baja': ['Tren eléctrico al trabajo', 'Bicicleta a la facultad', 'Colectivo lleno en hora pico'],
      }, 'Avión y auto con una persona, arriba. Transporte público lleno y modos activos, abajo.', { d: 2 }),
      op('Para un viaje de 500 km entre dos ciudades, ¿qué opción suele tener menor huella por pasajero?', [ // e7
        'Tren o micro de larga distancia',
        'Avión de cabotaje',
        ['Auto con una sola persona', 'Con una persona, el auto está entre las opciones de mayor huella por pasajero.'],
        'Dos autos para llevar el equipaje aparte',
      ], 'En distancias medias, tren y micro emiten mucho menos por persona que el avión o el auto con una persona.', { d: 2 }),
      det('Leé este posteo y marcá lo equivocado.', [ // e8
        ['El auto a nafta con una persona emite bastante por kilómetro.', false],
        ['El avión emite poco porque va rápido.', true, 'Por pasajero y km, un vuelo corto emite más que casi cualquier modo.'],
        ['El tren emite mucho menos por pasajero que el auto.', false],
        ['El auto eléctrico tiene emisiones cero en cualquier país.', true, 'Depende de cómo se genera la electricidad de la red.'],
      ], 'Comparar por pasajero y kilómetro desarma varias creencias.', { d: 2 }),
      comp('Completá.', 'Para comparar modos se usan gramos de CO₂e por [pasajero] y por kilómetro; los vuelos [cortos] y el auto con una persona están entre los que más emiten.', ['litro', 'largos', 'hora'], 'La unidad para comparar y quiénes encabezan la lista.', { d: 2 }),
      est('Estimá cuántos gramos de CO₂e por kilómetro emite un auto a nafta que gasta 8 litros cada 100 km (2,3 kg de CO₂ por litro).', 184, { min: 10, max: 1000, paso: 1, unidad: 'g por km' }, '8 litros × 2,3 kg = 18,4 kg cada 100 km, o sea 184 g por km. Muy cerca del valor de referencia de 192 g.', { d: 3 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Ocupación: el mismo vehículo, distinta huella', 'Un auto con cuatro personas o con una, un colectivo lleno o vacío: por qué la ocupación cambia todo.', [
      teoria('Dividir entre los que viajan', [
        'Un auto emite más o menos lo mismo si lleva una persona o cuatro. Por eso, por persona, un auto con cuatro pasajeros emite la cuarta parte que uno con el conductor solo. Con un colectivo pasa lo mismo, a otra escala: lleno, emite muy poco por pasajero; casi vacío, bastante.',
        'Los valores de referencia de los colectivos y trenes suponen una ocupación promedio. En horas pico, con vehículos llenos, la huella por pasajero es mucho menor.',
      ]),
      ejemplo('El auto compartido', 'Un auto emite 190 g de CO₂e por kilómetro.', [
        'Con 1 persona: 190 ÷ 1 = 190 g por persona y km.',
        'Con 2 personas: 190 ÷ 2 = 95 g.',
        'Con 4 personas: 190 ÷ 4 = 47,5 g.',
      ], 'El mismo auto, cuatro veces menos por persona. Compartir el auto es una de las formas más simples de bajar la huella.'),
      numv(3, (i) => { // e1
        const g = [190, 170, 220][i];
        const p = [4, 3, 2][i];
        return {
          enunciado: `Un auto emite ${g} g de CO₂e por km. Si viajan ${p} personas, ¿cuántos gramos emite por persona y km? Redondeá a un decimal.`,
          valor: Math.round((g / p) * 10) / 10,
          unidad: 'g por persona y km',
          dec: 1,
          explicacion: `${g} ÷ ${p} ≈ ${(Math.round((g / p) * 10) / 10).toLocaleString('es-AR')} g. Llenar el auto divide la huella entre más personas.`,
        };
      }, { d: 1 }),
      teoria('El colectivo', [
        'Un colectivo urbano diésel emite, por kilómetro recorrido, varias veces más que un auto, porque es mucho más grande y pesado: del orden de 1.000 g de CO₂ por km. Pero si lleva 50 pasajeros, son unos 20 g por persona. Si lleva 5, son unos 200 g por persona: tanto como un auto con una persona.',
        'Por eso el transporte público es eficiente cuando se usa mucho. Un sistema con buena frecuencia y recorridos útiles atrae más pasajeros y baja la huella de cada uno.',
      ]),
      numv(3, (i) => { // e2
        const p = [50, 20, 5][i];
        return {
          enunciado: `Un colectivo emite 1.000 g de CO₂ por km y lleva ${p} pasajeros. ¿Cuántos gramos emite por pasajero y km?`,
          valor: 1000 / p,
          unidad: 'g por pasajero y km',
          explicacion: `1.000 ÷ ${p} = ${1000 / p} g. ${p >= 20 ? 'Con buena ocupación, muy por debajo de un auto con una persona.' : 'Casi vacío, tanto como un auto con una sola persona.'}`,
        };
      }, { d: 2 }),
      rank('Ordená estos viajes por emisiones por persona y km, de más a menos.', [ // e3
        ['Colectivo con 4 pasajeros (1.000 g por km)', '250 g'],
        ['Auto con 1 persona (190 g por km)', '190 g'],
        ['Auto con 4 personas (190 g por km)', '47,5 g'],
        ['Colectivo con 50 pasajeros (1.000 g por km)', '20 g'],
      ], 'Un colectivo casi vacío puede emitir más por persona que un auto. Lleno, es de lo mejor. La ocupación manda.', { d: 3 }),
      vf('Un colectivo siempre emite menos por pasajero que un auto.', false, 'Depende de la ocupación. Un colectivo casi vacío puede emitir más por pasajero que un auto con una persona. Lleno, emite mucho menos.', { // e4
        razones: ['+Porque depende de cuántos pasajeros lleve', '-Porque los colectivos no emiten', '-Porque los autos emiten siempre más por kilómetro que los colectivos'],
        d: 3,
      }),
      cad('Armá la cadena de por qué mejorar la frecuencia del colectivo puede bajar las emisiones por pasajero.', [ // e5
        'El colectivo pasa más seguido',
        'Esperar deja de ser un problema',
        'Más personas lo eligen en vez del auto',
        'Cada colectivo va más lleno',
        'Bajan las emisiones por pasajero y los autos en la calle',
      ], ['Más colectivos siempre significan más emisiones por pasajero'], 'Un buen servicio atrae pasajeros, y los pasajeros hacen eficiente al servicio: un círculo virtuoso.', { d: 3 }),
      clas('¿Esta medida aumenta la ocupación de los vehículos o no?', { // e6
        'Aumenta la ocupación': ['Compartir el auto con compañeros de trabajo', 'Carriles exclusivos que hacen más rápido el colectivo', 'Apps para coordinar viajes compartidos'],
        'No la aumenta': ['Comprar un segundo auto para la familia', 'Autos de alquiler con un solo pasajero', 'Llevar a cada hijo en un auto distinto'],
      }, 'Más personas por vehículo es menos huella por persona y menos autos en la calle.', { d: 2 }),
      mult('¿Qué ventajas tiene compartir el auto? Marcá todas.', [ // e7
        '+Menos emisiones por persona',
        '+Se reparten los costos de combustible y estacionamiento',
        '+Menos autos en la calle',
        '+Menos congestión',
        '-El auto pasa a emitir cero',
      ], 'El auto emite lo mismo, pero se reparte entre más personas y hay menos autos circulando.', { d: 1 }),
      op('Cuatro compañeros viven cerca y trabajan en el mismo lugar, a 15 km. Hoy van en cuatro autos. ¿Qué cambio baja más la huella con menos esfuerzo?', [ // e8
        'Ir los cuatro en un solo auto',
        'Que cada uno cambie su auto por uno un poco más chico',
        ['Que cada uno maneje más despacio', 'Ahorra algo, pero muchísimo menos que dejar tres autos en casa.'],
        'Que uno de los cuatro vaya en bici un día por mes',
      ], 'Pasar de cuatro autos a uno baja la huella del viaje a una cuarta parte, sin comprar nada.', { d: 2 }),
      det('Leé este razonamiento y marcá lo equivocado.', [ // e9
        ['Un auto con cuatro personas emite por persona la cuarta parte que con una.', false],
        ['Un colectivo emite más por km que un auto, así que siempre es peor.', true, 'Por pasajero, un colectivo con buena ocupación emite mucho menos.'],
        ['La ocupación cambia mucho la huella por persona.', false],
        ['Un colectivo vacío emite cero porque no lleva a nadie.', true, 'Emite igual por km; al no llevar pasajeros, su huella por persona es altísima.'],
      ], 'Por vehículo o por persona: la unidad cambia la conclusión.', { d: 3 }),
      comp('Completá.', 'Las emisiones por persona se calculan dividiendo las del vehículo por la cantidad de [pasajeros]; por eso compartir el auto [reduce] la huella de cada uno.', ['ruedas', 'aumenta'], 'La idea central de la lección, resumida en una línea.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('El espacio que ocupa cada modo', 'Cuánto lugar de la ciudad usa un auto, un colectivo o una bici, y por qué el espacio también es un recurso.', [
      teoria('La calle es un recurso limitado', [
        'El espacio de las calles de una ciudad es limitado y valioso. Un auto estacionado ocupa unos 10 a 12 metros cuadrados, más o menos lo que un dormitorio chico, y pasa estacionado la mayor parte del día. En movimiento, ocupa mucho más, porque necesita distancia con el de adelante.',
        'Una bicicleta ocupa una fracción de ese espacio, y un colectivo lleno mueve a decenas de personas en el lugar de dos o tres autos.',
      ]),
      numv(3, (i) => { // e1
        const autos = [100, 250, 40][i];
        return {
          enunciado: `Una cuadra tiene lugar para estacionar ${autos} autos de 11 m² cada uno. ¿Cuántos metros cuadrados de calle se usan para estacionar?`,
          valor: autos * 11,
          unidad: 'm²',
          explicacion: `${autos} × 11 = ${(autos * 11).toLocaleString('es-AR')} m². Espacio público que podría ser vereda, árboles, ciclovía o plaza.`,
        };
      }, { d: 1 }),
      teoria('Personas por carril', [
        'Lo que importa para mover una ciudad no es cuántos vehículos pasan por un carril, sino cuántas personas. Un carril de autos, con una o dos personas por auto, mueve pocas personas por hora comparado con un carril exclusivo de colectivos o una vía de tren, que pueden mover varias veces más gente en el mismo ancho.',
        'Por eso muchas ciudades dan prioridad al transporte público con carriles exclusivos o sistemas de colectivos rápidos: con el mismo espacio, mueven a muchas más personas.',
      ]),
      rank('Ordená estos usos de un carril por cuántas personas pueden mover por hora, de más a menos.', [ // e2
        ['Vía de tren o subte', 'la mayor cantidad'],
        ['Carril exclusivo de colectivos', 'mucha'],
        ['Ciclovía', 'bastante'],
        ['Carril de autos particulares', 'la menor'],
      ], 'El auto es el modo que menos personas mueve por metro de calle. En ciudades densas, eso importa mucho.', { d: 3 }),
      cad('Armá la cadena de por qué ensanchar una avenida no siempre reduce los embotellamientos.', [ // e3
        'Se ensancha una avenida congestionada',
        'Por un tiempo se circula más rápido',
        'Más personas eligen el auto porque ahora es más cómodo',
        'Aumenta la cantidad de autos',
        'La avenida vuelve a congestionarse',
      ], ['Los autos se achican cuando la avenida es más ancha'], 'Se llama demanda inducida: más espacio para autos atrae más autos. Es un efecto de sistema.', { d: 3 }),
      vf('Ensanchar las avenidas es la solución definitiva para los embotellamientos.', false, 'Suele atraer más autos y, con el tiempo, la congestión vuelve. Priorizar el transporte público y los modos activos mueve más personas en el mismo espacio.', { // e4
        razones: ['+Porque más espacio para autos atrae más autos', '-Porque los autos no necesitan espacio', '-Porque las avenidas anchas prohíben los autos'],
        d: 3,
      }),
      par('Uní cada modo con cuánto espacio usa por persona.', [ // e5
        ['Auto con una persona', 'Mucho espacio por persona'],
        ['Colectivo lleno', 'Poco espacio por persona'],
        ['Bicicleta', 'Muy poco espacio por persona'],
        ['A pie', 'El mínimo espacio por persona'],
      ], 'En una ciudad con poco espacio, los modos que usan poco lugar por persona hacen que entremos todos.', { d: 2 }),
      mult('¿En qué se podría usar el espacio que hoy ocupan autos estacionados? Marcá todo lo posible.', [ // e6
        '+Veredas más anchas',
        '+Árboles y canteros',
        '+Ciclovías',
        '+Carriles para colectivos',
        '-Nada, el espacio de la calle solo sirve para autos',
      ], 'La calle es espacio público. Qué se hace con él es una decisión de la ciudad.', { d: 1 }),
      op('En una avenida con un carril congestionado de autos y muchos colectivos atascados, ¿qué medida mueve más personas?', [ // e7
        'Hacer un carril exclusivo para colectivos',
        'Agregar un carril más para autos',
        ['Prohibir los colectivos para que haya más lugar', 'Los colectivos llevan a la mayoría de las personas: sacarlos empeora todo.'],
        'Poner más semáforos en rojo largos',
      ], 'Liberar a los colectivos del tránsito los hace más rápidos, más atractivos y más eficientes.', { d: 2 }),
      clas('¿Esta decisión prioriza a las personas o a los autos?', { // e8
        'Prioriza a las personas': ['Carril exclusivo de colectivo', 'Ensanchar veredas en una calle comercial', 'Ciclovía protegida'],
        'Prioriza a los autos': ['Sacar un cantero para hacer estacionamiento', 'Ensanchar la calle a costa de la vereda', 'Semáforos que dan poco tiempo para cruzar a pie'],
      }, 'Cada metro de calle refleja una prioridad. Contarlo en personas cambia la mirada.', { d: 2 }),
      det('Leé esta propuesta de un candidato y marcá lo cuestionable.', [ // e9
        ['Vamos a hacer un carril exclusivo de colectivos en la avenida principal.', false],
        ['Y vamos a ensanchar todas las avenidas para que se acaben los embotellamientos.', true, 'Por la demanda inducida, más espacio para autos suele atraer más autos.'],
        ['Sumaremos ciclovías protegidas.', false],
        ['Un auto estacionado no ocupa espacio público.', true, 'Ocupa unos 10 a 12 m² de calle, que es espacio público.'],
      ], 'El espacio de la ciudad es un recurso: la pregunta es para quién se usa.', { d: 3 }),
      comp('Completá.', 'Un auto estacionado ocupa unos [11] m²; ensanchar avenidas suele atraer más autos, un efecto llamado demanda [inducida].', ['2', 'reducida'], 'Dos ideas para pensar el espacio de la calle.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Tránsito y salud', 'Siniestros viales, aire, ruido y sedentarismo: lo que el tránsito le cuesta a la salud.', [
      teoria('Siniestros viales', [
        'Según la Organización Mundial de la Salud, los siniestros de tránsito causan alrededor de 1,2 millones de muertes por año en el mundo, y son la principal causa de muerte de niños y jóvenes de 5 a 29 años. En Argentina, cada año mueren miles de personas en el tránsito.',
        'La mayoría de las víctimas son usuarios vulnerables: peatones, ciclistas y motociclistas. La velocidad es uno de los factores más importantes: a mayor velocidad, más probable el choque y más graves las lesiones.',
      ], { destacado: { valor: '≈ 1,2 millones', texto: 'de muertes por año causan los siniestros de tránsito en el mundo, según la OMS.' } }),
      est('Estimá cuántas personas mueren por año en el mundo en siniestros de tránsito, según la OMS.', 1200000, { min: 10000, max: 100000000, unidad: 'personas', escala: 'log' }, 'Alrededor de 1,2 millones. Además, decenas de millones resultan heridas.', { d: 3 }),
      teoria('La velocidad', [
        'Un peatón atropellado a 30 km/h tiene muchas más chances de sobrevivir que uno atropellado a 50 km/h: la energía del choque crece con el cuadrado de la velocidad. Por eso muchas ciudades bajan a 30 km/h la velocidad máxima en calles con mucha gente caminando.',
        'Además, a menor velocidad el conductor ve más, frena en menos distancia y reacciona mejor.',
      ]),
      cad('Armá la cadena de por qué bajar la velocidad a 30 km/h en un barrio salva vidas.', [ // e1
        'Se baja la velocidad máxima a 30 km/h',
        'Los autos frenan en menos distancia',
        'Hay menos choques',
        'Los choques que ocurren tienen menos energía',
        'Hay menos muertes y heridos graves',
      ], ['A 30 km/h los autos no pueden chocar'], 'Velocidad más baja: menos choques y menos graves. Una de las medidas más efectivas de seguridad vial.', { d: 2 }),
      numv(3, (i) => { // e2
        const v1 = [30, 40, 20][i];
        const v2 = [60, 80, 60][i];
        return {
          enunciado: `La energía de un choque crece con el cuadrado de la velocidad. ¿Cuántas veces más energía tiene un choque a ${v2} km/h que a ${v1} km/h?`,
          valor: (v2 / v1) ** 2,
          unidad: 'veces',
          explicacion: `(${v2} ÷ ${v1})² = ${v2 / v1}² = ${(v2 / v1) ** 2}. ${v2 / v1 === 2 ? 'El doble de velocidad es cuatro veces la energía.' : 'Por eso la velocidad pesa tanto en la gravedad de las lesiones.'}`,
        };
      }, { d: 3 }),
      vf('Ir el doble de rápido duplica la energía de un choque.', false, 'La energía crece con el cuadrado de la velocidad: el doble de velocidad es cuatro veces más energía. Por eso la velocidad es tan peligrosa.', { // e3
        razones: ['+Porque la energía crece con el cuadrado de la velocidad', '-Porque la energía no depende de la velocidad', '-Porque la energía se reduce a la mitad'],
        d: 3,
      }),
      teoria('Aire, ruido y sedentarismo', [
        'El tránsito también afecta la salud de otras formas. Los motores, sobre todo los diésel viejos, contaminan el aire que se respira en las calles, como viste en la rama de Aire y Suelo. El ruido del tránsito altera el sueño y aumenta el estrés.',
        'Y moverse siempre en auto contribuye al sedentarismo. La OMS recomienda que las personas adultas hagan al menos 150 minutos semanales de actividad física moderada: caminar o pedalear para ir al trabajo o la escuela puede cubrirlo sin buscar tiempo extra.',
      ]),
      mult('¿De qué formas afecta el tránsito motorizado a la salud? Marcá todas.', [ // e4
        '+Siniestros viales',
        '+Contaminación del aire',
        '+Ruido que altera el sueño',
        '+Sedentarismo',
        '-Más árboles en las veredas',
      ], 'Cuatro efectos distintos. Los modos activos y el transporte público reducen los cuatro.', { d: 1 }),
      numv(3, (i) => { // e5
        const min = [15, 10, 20][i];
        const dias = 5;
        return {
          enunciado: `Alguien camina ${min} minutos de ida y ${min} de vuelta al trabajo, ${dias} días por semana. ¿Cuántos minutos de actividad física suma por semana?`,
          valor: min * 2 * dias,
          unidad: 'minutos',
          explicacion: `${min} × 2 × ${dias} = ${min * 2 * dias} minutos. ${min * 2 * dias >= 150 ? 'Cumple la recomendación de la OMS de 150 minutos semanales solo con ir y volver.' : 'Le falta poco para los 150 minutos semanales que recomienda la OMS.'}`,
        };
      }, { d: 1 }),
      par('Uní cada problema de salud con una medida de movilidad que lo reduce.', [ // e6
        ['Siniestros viales', 'Velocidad máxima de 30 km/h en barrios'],
        ['Contaminación del aire', 'Colectivos eléctricos'],
        ['Sedentarismo', 'Veredas y ciclovías seguras'],
        ['Ruido', 'Menos autos y motos en calles residenciales'],
      ], 'Muchas medidas de movilidad son, en realidad, medidas de salud pública.', { d: 2 }),
      clas('¿Quién es un usuario vulnerable de la vía pública?', { // e7
        'Vulnerable': ['Peatón', 'Ciclista', 'Motociclista', 'Niño que cruza la calle'],
        'Menos vulnerable': ['Conductor de camión', 'Pasajero de un auto con cinturón'],
      }, 'Los que no tienen una carrocería que los proteja son los que más sufren en un choque.', { d: 1 }),
      det('Leé este comentario y marcá lo equivocado.', [ // e8
        ['La velocidad es un factor clave en la gravedad de los choques.', false],
        ['Bajar a 30 km/h no cambia nada porque igual hay choques.', true, 'Reduce la cantidad y la gravedad de los choques: salva vidas.'],
        ['Caminar al trabajo puede cubrir la actividad física recomendada.', false],
        ['El tránsito solo afecta a la salud cuando hay choques.', true, 'También por el aire, el ruido y el sedentarismo.'],
      ], 'El tránsito es un tema de salud, no solo de tiempo de viaje.', { d: 2 }),
      comp('Completá.', 'La energía de un choque crece con el [cuadrado] de la velocidad; la OMS recomienda al menos [150] minutos semanales de actividad física.', ['doble', '30'], 'Dos números que conectan movilidad y salud.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: cómo nos movemos', 'Modos, emisiones, ocupación, espacio y salud, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el viaje de Tomás', 'Tomás va a la facultad en auto todos los días. Con los números, compará opciones y armá su plan. Aprobalo para hacer crecer la rama.', [
      teoria('La situación', [
        'Tomás vive a 12 km de la facultad y va solo en auto, ida y vuelta, 4 días por semana, durante 32 semanas al año. Su auto emite unos 190 g de CO₂e por km. Hay un tren que lo deja a 800 metros de la facultad (41 g por pasajero y km) y su casa está a 600 metros de la estación.',
        'Un compañero vive a dos cuadras y va a la misma facultad en su propio auto.',
      ]),
      num('¿Cuántos kilómetros recorre Tomás por año para ir y volver de la facultad?', 3072, 'km', '12 × 2 × 4 × 32 = 3.072 km por año: ida y vuelta, cuatro días, 32 semanas.', { ctx: '12 km por tramo, ida y vuelta, 4 días por semana, 32 semanas.', d: 2 }),
      num('¿Cuántos kg de CO₂e emite por año yendo solo en auto? Redondeá al entero.', 584, 'kg CO₂e', '3.072 × 190 = 583.680 g ≈ 584 kg por año.', { ctx: '3.072 km por año a 190 g por km.', tol: 1, d: 2 }),
      num('Si va en tren (41 g por km) y camina el resto, ¿cuántos kg de CO₂e emitiría por año? Redondeá al entero.', 126, 'kg CO₂e', '3.072 × 41 = 125.952 g ≈ 126 kg por año: casi un 80 % menos. Y suma unos 20 minutos de caminata por día.', { ctx: '3.072 km por año a 41 g por km en tren.', tol: 1, d: 3 }),
      rank('Ordená las opciones de Tomás por emisiones por año, de más a menos.', [ // e4
        ['Seguir yendo solo en auto', '≈ 584 kg'],
        ['Compartir el auto con su compañero', '≈ 292 kg por persona'],
        ['Ir en tren y caminar', '≈ 126 kg'],
        ['Ir en bici (si hubiera ciclovía segura)', '≈ 0 kg en el viaje'],
      ], 'Compartir el auto ya reduce a la mitad. El tren, casi un 80 %. La bici, casi todo, si la infraestructura lo permite.', { d: 3 }),
      op('Tomás dice que el tren no le conviene porque tiene que caminar 1,4 km en total. ¿Qué dato puede ayudarlo a decidir?', [ // e5
        'Son unos 17 minutos de caminata que cuentan como actividad física',
        'Que caminar 1,4 km es imposible para una persona sana',
        ['Que el tren emite más que el auto', 'Emite mucho menos por pasajero: 41 contra 190 g por km.'],
        'Que caminando se gasta más plata que en auto',
      ], '1,4 km a 5 km/h son unos 17 minutos: más de la mitad de la actividad diaria que recomienda la OMS, sin buscar tiempo extra.', { d: 3 }),
      clas('Clasificá los argumentos que escucha Tomás.', { // e6
        'Son válidos para decidir': ['El tren tarda 35 minutos y el auto 30 en hora pico', 'Caminar a la estación suma actividad física', 'Compartir el auto divide la nafta y el estacionamiento'],
        'No son válidos': ['El tren no emite porque es eléctrico, así que da igual', 'Si uno solo cambia no sirve para nada', 'El auto es siempre más rápido que cualquier otra opción'],
      }, 'Decidir con datos: tiempo real, costo, salud y emisiones. Los mitos no ayudan.', { d: 3 }),
      det('Tomás escribe su plan. Marcá lo que no conviene.', [ // e7
        ['Tres días por semana voy en tren y camino a la facultad.', false],
        ['El día que voy en auto, lo comparto con mi compañero.', false],
        ['Como el tren emite algo, da lo mismo que el auto.', true, 'El tren emite unas cuatro veces menos por km: no da lo mismo.'],
        ['Para compensar, compro un segundo auto más chico para los días de lluvia.', true, 'Fabricar y mantener otro auto suma impacto; mejor combinar tren y auto compartido.'],
      ], 'Un buen plan combina opciones realistas y compara con números.', { d: 3 }),
    ]),
  ],
});
