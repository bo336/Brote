import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// MOVILIDAD 3 — Transporte público.
// Por qué el transporte público es la columna de una ciudad, la frecuencia
// como libertad, cómo se diseñan las redes y las combinaciones, colectivos
// rápidos, trenes y electrificación, y cómo hacer un sistema para todas las
// personas. Retoma ocupación y espacio (movilidad-1) y combinar modos
// (movilidad-2).

export default unidad({
  slug: 'movilidad-3',
  rama: 'movilidad',
  orden: 3,
  nivel: 2,
  requiereTronco: 2,
  titulo: 'Transporte público',
  bajada: 'Frecuencias, redes, combinaciones, carriles exclusivos y trenes: cómo funciona el transporte público y qué lo hace una opción que la gente elige.',
  objetivos: [
    'Explicar por qué el transporte público es eficiente en espacio, energía y equidad',
    'Calcular esperas a partir de la frecuencia y entender por qué los colectivos se amontonan',
    'Comparar redes radiales y en grilla, y el dilema entre cobertura y frecuencia',
    'Reconocer los componentes de un sistema de colectivos rápidos y de la electrificación',
    'Evaluar la accesibilidad y la seguridad de un sistema para todas las personas',
  ],
  repasa: ['movilidad-1', 'movilidad-2', 'energia-3', 'tronco-2'],
  fuentes: ['human-transit', 'itdp-brt', 'metrobus-gcba', 'red-sube', 'owid-transporte', 'oms-aire-exterior', 'oms-seguridad-vial'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Por qué funciona', 'Espacio, energía y equidad: por qué una ciudad no puede moverse solo en auto.', [
      teoria('Muchas personas, poco espacio', [
        'Como viste en la base de la rama, un colectivo con 50 personas ocupa en la calle el lugar de tres o cuatro autos, que en promedio llevan poco más de una persona cada uno. Un tren puede mover en una hora a decenas de miles de personas por una sola vía. Ninguna ciudad grande podría funcionar si todos sus viajes se hicieran en auto: no habría calles ni estacionamiento suficientes.',
        'Además, por persona, un transporte público con buena ocupación usa mucha menos energía y emite mucho menos que un auto con un solo ocupante.',
      ]),
      numv(3, (i) => { // e1
        const [pas, autos] = [[60, 1.2], [45, 1.5], [80, 1.3]][i];
        return {
          enunciado: `Un colectivo lleva ${pas} personas. Si en autos viajan en promedio ${autos.toLocaleString('es-AR')} personas por auto, ¿cuántos autos harían falta para llevar a esas personas? Redondeá al entero.`,
          valor: Math.round(pas / autos),
          unidad: 'autos',
          tol: 1,
          explicacion: `${pas} ÷ ${autos.toLocaleString('es-AR')} ≈ ${Math.round(pas / autos)} autos. Todos ellos en la calle, en lugar de un solo colectivo.`,
        };
      }, { d: 1 }),
      teoria('Equidad', [
        'El transporte público no es solo una cuestión ambiental. Muchas personas no pueden o no deben manejar: chicos y adolescentes, muchas personas mayores, personas con algunas discapacidades, y quienes no pueden pagar un auto. Para ellas, el transporte público es la diferencia entre llegar o no a la escuela, al trabajo, al hospital o a ver a su familia.',
      ]),
      mult('¿Quiénes dependen especialmente del transporte público? Marcá todos.', [ // e2
        '+Estudiantes que todavía no pueden manejar',
        '+Personas mayores que dejaron de manejar',
        '+Hogares que no pueden pagar un auto',
        '+Personas con algunas discapacidades',
        '-Nadie: todas las personas tienen auto',
      ], 'Un buen sistema de transporte público amplía las oportunidades de muchísimas personas.', { d: 1 }),
      clas('¿Este beneficio es ambiental, social o urbano?', { // e3
        'Ambiental': ['Menos emisiones por persona', 'Menos contaminación del aire'],
        'Social': ['Acceso al trabajo para quien no tiene auto', 'Autonomía para adolescentes y personas mayores'],
        'Urbano': ['Menos espacio ocupado por vehículos', 'Menos congestión en las avenidas'],
      }, 'El transporte público suma beneficios en varias dimensiones a la vez.', { d: 2 }),
      teoria('El círculo vicioso y el virtuoso', [
        'Cuando el servicio es malo, quienes pueden se pasan al auto; bajan los pasajeros, bajan los ingresos, el servicio empeora y más gente se va. Es un círculo vicioso. Cuando el servicio mejora —más frecuencia, carriles exclusivos, buena información—, suben los pasajeros, lo que permite sostener y mejorar el servicio: un círculo virtuoso.',
      ]),
      cad('Armá el círculo vicioso del transporte público.', [ // e4
        'El servicio es poco frecuente y lento',
        'Quienes pueden se pasan al auto',
        'Bajan los pasajeros y los ingresos',
        'Se recortan frecuencias',
        'El servicio empeora todavía más',
      ], ['Más personas eligen el colectivo porque es lento'], 'Romper el círculo requiere invertir en calidad de servicio, no solo en vehículos.', { d: 2 }),
      op('¿Qué medida puede iniciar un círculo virtuoso?', [ // e5
        'Aumentar la frecuencia y darle carril exclusivo',
        'Subir la tarifa y reducir los recorridos',
        ['Sacar las paradas para que el colectivo no frene', 'Sin paradas, nadie puede subir: no es una opción.'],
        'Ensanchar las avenidas para más autos',
      ], 'Un servicio más rápido y frecuente atrae pasajeros, y los pasajeros sostienen el servicio.', { d: 2 }),
      numv(3, (i) => { // e6
        const [g, pers] = [[1500, 50], [2200, 40], [1800, 60]][i];
        return {
          enunciado: `Un colectivo emite ${g.toLocaleString('es-AR')} g de CO₂ por kilómetro y lleva ${pers} personas. ¿Cuántos gramos por persona y por kilómetro son?`,
          valor: g / pers,
          unidad: 'g/km por persona',
          explicacion: `${g.toLocaleString('es-AR')} ÷ ${pers} = ${(g / pers).toLocaleString('es-AR')} g por persona y km. Un auto con una sola persona suele emitir entre 150 y 200 g/km.`,
          ctx: `${g} g/km del colectivo; ${pers} personas a bordo.`,
        };
      }, { d: 2 }),
      vf('Un colectivo casi vacío siempre emite menos por persona que un auto.', false, 'Con muy pocos pasajeros, un colectivo puede emitir más por persona que un auto. Por eso la ocupación importa, y por eso el objetivo es atraer pasajeros.', { // e7
        razones: ['+Porque con pocos pasajeros sus emisiones se reparten entre pocos', '-Porque los colectivos no emiten nada', '-Porque los autos emiten siempre más que cualquier vehículo'],
        d: 2,
      }),
      numv(3, (i) => { // e7b
        const [pers, occ] = [[50, 1.25], [60, 1.2], [40, 1.25]][i];
        const autos = Math.round(pers / occ);
        return {
          enunciado: `Para llevar a ${pers} personas en autos con ${occ.toLocaleString('es-AR')} personas por auto, ¿cuántos metros cuadrados de calle ocupan los autos, si cada uno ocupa unos 10 m² detenido?`,
          valor: autos * 10,
          unidad: 'm²',
          explicacion: `${pers} ÷ ${occ.toLocaleString('es-AR')} = ${autos} autos; ${autos} × 10 = ${autos * 10} m². Un colectivo que lleva a las mismas personas ocupa unos 30 m².`,
          ctx: `${pers} personas; ${occ} por auto; 10 m² por auto.`,
        };
      }, { d: 2 }),
      par('Uní cada idea con su ejemplo.', [ // e8
        ['Eficiencia de espacio', 'Un colectivo en lugar de 40 autos'],
        ['Equidad', 'Una adolescente que va sola a la escuela'],
        ['Círculo vicioso', 'Menos pasajeros, menos servicio, menos pasajeros'],
        ['Ocupación', 'Emisiones repartidas entre muchas personas'],
      ], 'Cuatro ideas que explican por qué el transporte público es clave.', { d: 1 }),
      det('Leé esta opinión y marcá lo equivocado.', [ // e9
        ['El transporte público ocupa menos espacio por persona que el auto.', false],
        ['El transporte público solo lo usa quien no tiene otra opción.', true, 'Donde el servicio es bueno, lo eligen personas de todos los ingresos.'],
        ['Mejorar el servicio puede atraer más pasajeros.', false],
        ['Si hay pocos pasajeros, lo mejor es recortar frecuencias hasta que suban.', true, 'Recortar frecuencias suele alejar todavía más pasajeros.'],
      ], 'El transporte público es una red que se alimenta de sus pasajeros.', { d: 2 }),
      comp('Completá.', 'Cuando el servicio empeora y la gente lo abandona, se forma un círculo [vicioso]; el transporte público da acceso a quienes no pueden manejar, lo que tiene que ver con la [equidad]; y las emisiones por persona dependen de la [ocupación].', ['perfecto', 'velocidad', 'pintura'], 'Tres ideas centrales sobre por qué importa el transporte público.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Frecuencia es libertad', 'Cada cuánto pasa, desde qué hora y hasta cuándo, y si llega a horario: lo que decide si el transporte sirve.', [
      teoria('La espera', [
        'La frecuencia es cada cuántos minutos pasa un servicio. Si una persona llega a la parada sin mirar horarios, en promedio espera la mitad del intervalo: si el colectivo pasa cada 20 minutos, espera en promedio 10. Con un servicio cada 5 minutos, casi no hace falta mirar el horario: se va a la parada y se sube. Por eso se dice que la frecuencia es libertad: permite moverse cuando uno quiere, no cuando pasa el colectivo.',
      ]),
      numv(3, (i) => { // e1
        const f = [20, 12, 30][i];
        return {
          enunciado: `Si un colectivo pasa cada ${f} minutos y llegás a la parada sin mirar el horario, ¿cuánto esperás en promedio?`,
          valor: f / 2,
          unidad: 'minutos',
          explicacion: `La espera promedio es la mitad del intervalo: ${f} ÷ 2 = ${f / 2} minutos. Con frecuencias altas, la espera casi desaparece.`,
        };
      }, { d: 1 }),
      ejemplo('Frecuencia y tiempo total', 'Dos líneas tardan 20 minutos en llegar al centro. La línea A pasa cada 30 minutos. La línea B pasa cada 6 minutos.', [
        'Espera promedio en A: 15 minutos. Tiempo total promedio: 15 + 20 = 35 minutos.',
        'Espera promedio en B: 3 minutos. Tiempo total promedio: 3 + 20 = 23 minutos.',
        'Con la misma velocidad, la línea frecuente ahorra 12 minutos por viaje en promedio.',
      ], 'La frecuencia puede pesar tanto como la velocidad en el tiempo total de viaje.'),
      numv(3, (i) => { // e2
        const [fa, fb, viaje] = [[30, 10, 25], [20, 5, 15], [40, 8, 30]][i];
        return {
          enunciado: `Dos líneas tardan ${viaje} minutos al destino. Una pasa cada ${fa} minutos y la otra cada ${fb}. ¿Cuántos minutos ahorra en promedio quien toma la más frecuente, sin mirar horarios?`,
          valor: (fa - fb) / 2,
          unidad: 'minutos',
          explicacion: `Esperas promedio: ${fa / 2} y ${fb / 2} minutos. Diferencia: ${(fa - fb) / 2} minutos por viaje, con el mismo tiempo arriba del colectivo.`,
          ctx: `Intervalos de ${fa} y ${fb} minutos; ${viaje} minutos de viaje.`,
        };
      }, { d: 2 }),
      teoria('Horario de servicio y confiabilidad', [
        'Además de la frecuencia importa el horario de servicio: desde qué hora hasta qué hora funciona. Una línea que termina a las 21 no sirve a quien sale de trabajar a las 22. Y importa la confiabilidad: si el colectivo que debería pasar cada 10 minutos a veces tarda 30, las personas tienen que salir mucho antes "por las dudas", y el viaje se vuelve impredecible.',
      ]),
      par('Uní cada atributo del servicio con su pregunta.', [ // e3
        ['Frecuencia', '¿Cada cuánto pasa?'],
        ['Horario de servicio', '¿Desde qué hora hasta qué hora funciona?'],
        ['Confiabilidad', '¿Pasa cuando dice que va a pasar?'],
        ['Velocidad', '¿Cuánto tarda una vez arriba?'],
      ], 'Los cuatro atributos juntos definen si el transporte público es útil para una persona.', { d: 1 }),
      teoria('Colectivos en racimo', [
        '¿Por qué a veces pasan tres colectivos de la misma línea juntos después de una larga espera? Si uno se atrasa, en la parada lo espera más gente; tarda más en subirla y se atrasa todavía más. El que viene detrás encuentra menos gente, va más rápido y lo alcanza. Así se forman los racimos. Para evitarlos se usan carriles exclusivos, pago antes de subir, puertas múltiples y control de intervalos desde una central.',
      ]),
      cad('Armá la cadena de cómo se forma un racimo de colectivos.', [ // e4
        'Un colectivo se atrasa por el tránsito',
        'En la parada se acumula más gente esperándolo',
        'Tarda más en subir a todos y se atrasa más',
        'El colectivo de atrás encuentra paradas casi vacías',
        'Lo alcanza y pasan juntos',
      ], ['El colectivo atrasado se adelanta solo'], 'El sistema tiende a desordenarse solo; mantener intervalos parejos requiere gestión activa.', { d: 3 }),
      mult('¿Qué ayuda a evitar que los colectivos se amontonen? Marcá todo.', [ // e5
        '+Carriles exclusivos',
        '+Pagar antes de subir o con tarjeta rápida',
        '+Control de intervalos desde una central',
        '-Que cada chofer salga cuando quiera',
        '-Sacar las puertas traseras',
      ], 'Menos tiempo en paradas y menos exposición al tránsito hacen el servicio más regular.', { d: 2 }),
      vf('Una línea con colectivos muy rápidos pero que pasa cada hora es más útil que una un poco más lenta que pasa cada 5 minutos.', false, 'Depende del viaje, pero en general la frecuencia alta ahorra más tiempo de espera del que se pierde por ir un poco más lento, y además da libertad de horarios.', { // e6
        razones: ['+Porque la espera larga pesa mucho en el tiempo total', '-Porque la velocidad no importa nunca', '-Porque las líneas frecuentes no llevan pasajeros'],
        d: 3,
      }),
      op('Tu colectivo debería pasar cada 10 minutos, pero a veces tarda 35. ¿Qué atributo está fallando?', [ // e7
        'La confiabilidad',
        'El horario de servicio',
        ['La tarifa', 'La tarifa no cambia la regularidad del servicio.'],
        'La cantidad de asientos',
      ], 'Sin confiabilidad, la frecuencia prometida no sirve: hay que salir antes "por las dudas".', { d: 1 }),
      rank('Ordená estas líneas por tiempo total promedio (espera más viaje), de menor a mayor, si llegás sin mirar el horario.', [ // e8b
        ['Pasa cada 10 minutos y tarda 20', '5 + 20 = 25 min'],
        ['Pasa cada 6 minutos y tarda 24', '3 + 24 = 27 min'],
        ['Pasa cada 30 minutos y tarda 15', '15 + 15 = 30 min'],
        ['Pasa cada 60 minutos y tarda 10', '30 + 10 = 40 min'],
      ], 'La más rápida arriba del colectivo resulta la peor en tiempo total por su espera.', { d: 3, extremos: ['Menos tiempo', 'Más tiempo'] }),
      op('Una línea funciona de 6 a 20. Un enfermero sale de su turno a las 23. ¿Qué atributo del servicio le falla?', [ // e8c
        'El horario de servicio',
        'La frecuencia en hora pico',
        ['La velocidad del colectivo', 'Aunque fuera rapidísimo, a las 23 no pasa.'],
        'La cantidad de paradas',
      ], 'El horario de servicio decide si el transporte existe para quienes trabajan de noche o de madrugada.', { d: 1 }),
      det('Leé esta queja de un usuario y marcá lo que está mal razonado.', [ // e8
        ['Si el colectivo pasa cada 30 minutos, espero en promedio 15.', false],
        ['Los colectivos vienen en racimo porque los choferes se ponen de acuerdo.', true, 'Los racimos se forman solos por los atrasos y las paradas llenas.'],
        ['Una línea que termina a las 21 no me sirve para volver del trabajo.', false],
        ['La frecuencia no importa si el colectivo es rápido.', true, 'La espera puede pesar tanto como la velocidad.'],
      ], 'Entender cómo funciona el servicio ayuda a pedir las mejoras correctas.', { d: 2 }),
      comp('Completá.', 'Si un colectivo pasa cada 20 minutos, la espera promedio es de [10] minutos; que pase cuando dice que va a pasar es su [confiabilidad]; y cuando varios colectivos pasan juntos se habla de un [racimo].', ['40', 'tarifa', 'convoy'], 'Tres conceptos para evaluar un servicio de transporte.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Redes y combinaciones', 'Líneas que van al centro o que forman una grilla, el dilema entre cubrir todo y pasar seguido, y la tarifa integrada.', [
      teoria('Radial o en grilla', [
        'En una red radial, casi todas las líneas van desde los barrios hasta el centro. Funciona bien para ir al centro, pero para ir de un barrio a otro hay que pasar por el centro, aunque esté lejos. En una red en grilla, las líneas cruzan la ciudad en dos direcciones y se combinan en los cruces: con una sola combinación se llega de casi cualquier punto a casi cualquier otro. Las grillas funcionan mejor cuando las líneas son frecuentes, porque la combinación implica una espera.',
      ]),
      op('¿Qué ventaja tiene una red en grilla frente a una radial?', [ // e1
        'Conecta barrios entre sí sin pasar por el centro',
        'Que nunca hace falta combinar',
        ['Que solo sirve para ir al centro', 'Eso describe a la red radial.'],
        'Que usa menos colectivos para cubrir lo mismo',
      ], 'La grilla multiplica los destinos posibles, a cambio de combinaciones que necesitan frecuencia.', { d: 2 }),
      teoria('Cobertura o frecuencia', [
        'Con un presupuesto fijo, una ciudad tiene que elegir. Puede repartir los colectivos en muchas líneas para cubrir todos los barrios, pero cada una pasará poco. O puede concentrarlos en pocas líneas frecuentes por las avenidas principales, que atraen muchos pasajeros, aunque algunas personas tengan que caminar más. No hay una respuesta única: es una decisión sobre qué valorar, y conviene que sea explícita.',
      ]),
      ejemplo('El mismo presupuesto, dos redes', 'Una ciudad tiene 12 colectivos. Cada recorrido completo de ida y vuelta dura 60 minutos.', [
        'Opción A: 2 líneas con 6 colectivos cada una. Cada línea pasa cada 60 ÷ 6 = 10 minutos.',
        'Opción B: 6 líneas con 2 colectivos cada una. Cada línea pasa cada 60 ÷ 2 = 30 minutos.',
        'A atrae más pasajeros por viaje; B llega más cerca de más casas, pero con esperas largas.',
      ], 'El intervalo es el tiempo de vuelta completa dividido por la cantidad de colectivos de la línea.'),
      numv(3, (i) => { // e2
        const [vuelta, col] = [[60, 4], [90, 6], [80, 10]][i];
        return {
          enunciado: `Una línea tarda ${vuelta} minutos en hacer la vuelta completa y tiene ${col} colectivos. ¿Cada cuántos minutos pasa?`,
          valor: vuelta / col,
          unidad: 'minutos',
          explicacion: `${vuelta} ÷ ${col} = ${vuelta / col} minutos. Para pasar más seguido hay que sumar colectivos o hacer la vuelta más rápida, por ejemplo con carriles exclusivos.`,
        };
      }, { d: 2 }),
      cad('Armá la cadena de cómo un carril exclusivo puede aumentar la frecuencia sin comprar colectivos.', [ // e3
        'Se crea un carril exclusivo para colectivos',
        'Los colectivos hacen la vuelta más rápido',
        'Cada colectivo completa más vueltas por hora',
        'Con la misma flota, pasan más seguido',
      ], ['Se necesitan más choferes para ir más lento'], 'La velocidad se convierte en frecuencia: un beneficio doble para quien viaja.', { d: 3 }),
      clas('¿Esta decisión prioriza la cobertura o la frecuencia?', { // e4
        'Cobertura': ['Una línea que entra a cada barrio aunque pase cada 40 minutos', 'Muchos recorridos cortos y poco frecuentes'],
        'Frecuencia': ['Pocas líneas por avenidas principales cada 6 minutos', 'Concentrar la flota en los corredores más usados'],
      }, 'Ninguna opción es "la correcta" en todos los casos: depende de los objetivos de la ciudad.', { d: 2 }),
      teoria('Tarifa integrada', [
        'Combinar no debería costar como dos viajes completos. En el Área Metropolitana de Buenos Aires, la Red SUBE descuenta un 50 % en el segundo viaje y un 75 % desde el tercero, si se combinan colectivos, trenes y subtes dentro de las 2 horas desde el primer viaje. Así, una red con combinaciones no castiga a quien necesita hacerlas.',
      ]),
      numv(3, (i) => { // e5
        const t = [800, 1000, 600][i];
        return {
          enunciado: `Con la Red SUBE, alguien hace tres viajes en menos de 2 horas, cada uno con tarifa de ${t.toLocaleString('es-AR')} pesos. El segundo tiene 50 % de descuento y el tercero 75 %. ¿Cuánto paga en total?`,
          valor: t + t * 0.5 + t * 0.25,
          unidad: 'pesos',
          explicacion: `${t.toLocaleString('es-AR')} + ${(t * 0.5).toLocaleString('es-AR')} + ${(t * 0.25).toLocaleString('es-AR')} = ${(t * 1.75).toLocaleString('es-AR')} pesos, en lugar de ${(t * 3).toLocaleString('es-AR')}. Las tarifas son ejemplos; los descuentos son los de la Red SUBE.`,
          ctx: `Tres viajes de ${t} pesos; descuentos del 50 % y 75 %.`,
        };
      }, { d: 2 }),
      vf('Una red con combinaciones siempre es peor que una con viajes directos.', false, 'Si las líneas son frecuentes y la tarifa está integrada, las combinaciones permiten llegar a muchos más destinos con la misma flota.', { // e6
        razones: ['+Porque con frecuencia y tarifa integrada multiplican los destinos', '-Porque los viajes directos no existen', '-Porque combinar es siempre gratis y sin espera'],
        d: 2,
      }),
      par('Uní cada concepto con su descripción.', [ // e7
        ['Red radial', 'Líneas que convergen en el centro'],
        ['Red en grilla', 'Líneas que se cruzan en dos direcciones'],
        ['Tarifa integrada', 'Descuento al combinar dentro de un tiempo'],
        ['Intervalo', 'Tiempo de vuelta dividido por la cantidad de colectivos'],
      ], 'Vocabulario básico para leer y discutir una red de transporte.', { d: 2 }),
      op('En una red radial, querés ir de un barrio del oeste a uno del norte, los dos lejos del centro. ¿Qué es lo más probable?', [ // e8b
        'Tener que ir hasta el centro y volver a salir',
        'Encontrar una línea directa entre los dos barrios',
        ['Llegar más rápido que en auto seguro', 'El rodeo por el centro suele alargar mucho el viaje.'],
        'No poder combinar en ningún lugar',
      ], 'Las redes radiales sirven para ir al centro, pero hacen dar vueltas para los viajes entre barrios.', { d: 2 }),
      mult('¿Qué hace que combinar sea una buena opción para quien viaja? Marcá todo.', [ // e8c
        '+Que las dos líneas sean frecuentes',
        '+Que la tarifa esté integrada',
        '+Que la parada de combinación sea cercana y segura',
        '-Que haya que cruzar una avenida sin semáforo',
        '-Que la segunda línea pase cada hora',
      ], 'Combinar funciona cuando la espera es corta, barata y segura.', { d: 2 }),
      det('Leé esta propuesta de un concejal y marcá lo que no se sostiene.', [ // e8
        ['Con el mismo presupuesto, más líneas implican menos frecuencia en cada una.', false],
        ['Podemos cubrir cada cuadra y que todas las líneas pasen cada 5 minutos, sin más colectivos.', true, 'Con flota fija, más cobertura significa menos frecuencia.'],
        ['Un carril exclusivo puede aumentar la frecuencia con la misma flota.', false],
        ['Las combinaciones deben cobrarse como viajes completos para recaudar más.', true, 'Castiga a quien combina y hace menos útil la red.'],
      ], 'Diseñar una red es elegir con presupuestos reales, no prometer todo a la vez.', { d: 3 }),
      comp('Completá.', 'Una red con líneas que se cruzan es una [grilla]; con un presupuesto fijo hay que elegir entre cobertura y [frecuencia]; y la Red SUBE da un [75] % de descuento desde el tercer viaje.', ['estrella', 'publicidad', '10'], 'Tres claves del diseño de redes de transporte.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Carriles, rieles y electricidad', 'Colectivos rápidos, trenes, subtes y la electrificación del transporte público.', [
      teoria('Colectivos rápidos', [
        'Un sistema de colectivos rápidos, conocido por su sigla en inglés BRT, busca parecerse a un tren pero con colectivos. Sus componentes principales son: carriles exclusivos, idealmente en el centro de la avenida; estaciones con andenes; cobro de la tarifa antes de subir o con validación rápida; prioridad en los semáforos; y alta frecuencia. En Buenos Aires, el Metrobus empezó en 2011 en la avenida Juan B. Justo, y luego se extendió a otros corredores.',
      ]),
      mult('¿Qué componentes tiene un sistema de colectivos rápidos? Marcá todos.', [ // e1
        '+Carriles exclusivos en el centro de la avenida',
        '+Estaciones con andenes',
        '+Prioridad en los semáforos',
        '-Colectivos que comparten el carril con los autos',
        '-Paradas sin techo cada 100 metros',
      ], 'Cada componente reduce demoras: juntos, hacen al colectivo más rápido y regular.', { d: 2 }),
      op('¿Por qué conviene que los carriles exclusivos estén en el centro de la avenida?', [ // e2
        'No los bloquean autos que giran o estacionan',
        'Porque en el centro hay más sombra para los pasajeros',
        ['Porque así los colectivos van más lento y seguros', 'El objetivo es ir más rápido y regular, no más lento.'],
        'Porque en el centro se paga menos la tarifa',
      ], 'Los carriles junto a la vereda suelen quedar bloqueados por autos estacionados, entregas y giros.', { d: 3 }),
      teoria('Trenes y subtes', [
        'Los trenes y subtes tienen la mayor capacidad: no comparten el espacio con el tránsito, sus formaciones llevan cientos o miles de personas y pueden pasar con mucha frecuencia. Su construcción es cara y lleva años, por eso tienen sentido en los corredores con más demanda. En el Área Metropolitana de Buenos Aires, varias líneas de tren suburbano funcionan con electricidad, igual que el subte.',
      ]),
      rank('Ordená estos modos según cuántas personas pueden mover por hora en un corredor, de más a menos.', [ // e3
        ['Tren o subte', 'decenas de miles'],
        ['Colectivo rápido con carril exclusivo', 'muchos miles'],
        ['Colectivo en tránsito mixto', 'algunos miles'],
        ['Autos en un carril', 'unos 2.000'],
      ], 'Cuanto más separado del tránsito y más grande el vehículo, mayor la capacidad.', { d: 2, extremos: ['Más personas', 'Menos personas'] }),
      teoria('Electrificar', [
        'Los trenes eléctricos, los subtes, los trolebuses y los colectivos eléctricos no emiten gases por el caño de escape. Eso mejora el aire de las calles, donde respiran las personas. Sus emisiones de CO₂ dependen de cómo se genera la electricidad: con una red con más renovables, emiten cada vez menos. En Argentina hay trolebuses en ciudades como Rosario, Córdoba y Mendoza, y varias ciudades incorporan colectivos eléctricos.',
      ]),
      cad('Armá la cadena de beneficios de un colectivo eléctrico.', [ // e4
        'Se reemplaza un colectivo diésel por uno eléctrico',
        'Deja de haber humo en la calle',
        'Mejora el aire que respiran peatones y pasajeros',
        'Si la red eléctrica suma renovables, también bajan sus emisiones de CO₂',
      ], ['El colectivo eléctrico emite más humo al frenar'], 'Electrificar mejora el aire local de inmediato y el clima a medida que la red se limpia.', { d: 2 }),
      clas('¿Este vehículo emite gases por el caño de escape?', { // e5
        'No emite por escape': ['Trolebús', 'Subte', 'Colectivo eléctrico a batería', 'Tren eléctrico'],
        'Sí emite por escape': ['Colectivo diésel', 'Tren diésel'],
      }, 'Todos los vehículos eléctricos evitan el humo en la calle; su huella climática depende de la red.', { d: 1 }),
      numv(3, (i) => { // e6
        const [antes, ahora] = [[40, 28], [50, 35], [60, 45]][i];
        return {
          enunciado: `Con un carril exclusivo, un viaje en colectivo pasa de ${antes} a ${ahora} minutos. ¿En qué porcentaje se redujo el tiempo de viaje?`,
          valor: Math.round(((antes - ahora) / antes) * 100),
          unidad: '%',
          tol: 1,
          explicacion: `(${antes} − ${ahora}) ÷ ${antes} × 100 = ${Math.round(((antes - ahora) / antes) * 100)} %. Valores de ejemplo; en corredores reales la mejora depende de cuán congestionada estaba la avenida.`,
          ctx: `De ${antes} a ${ahora} minutos de viaje.`,
        };
      }, { d: 2 }),
      vf('Como los colectivos eléctricos no tienen caño de escape, no tienen ninguna huella ambiental.', false, 'Su fabricación, en especial la batería, y la electricidad que usan tienen emisiones. Aun así, suelen tener una huella menor que los diésel y no contaminan el aire de la calle.', { // e7
        razones: ['+Porque su fabricación y la electricidad tienen emisiones', '-Porque emiten más humo que los diésel', '-Porque no usan energía'],
        d: 2,
      }),
      numv(3, (i) => { // e7b
        const [cap, f] = [[1500, 6], [1200, 4], [2000, 5]][i];
        return {
          enunciado: `Una formación de tren lleva ${cap.toLocaleString('es-AR')} personas y pasa cada ${f} minutos. ¿Cuántas personas puede mover por hora en un sentido?`,
          valor: cap * (60 / f),
          unidad: 'personas por hora',
          explicacion: `Pasan ${60 / f} trenes por hora: ${cap.toLocaleString('es-AR')} × ${60 / f} = ${(cap * (60 / f)).toLocaleString('es-AR')} personas por hora, varias veces más que un carril de autos.`,
          ctx: `${cap} personas por tren; uno cada ${f} minutos.`,
        };
      }, { d: 2 }),
      par('Uní cada sistema con una característica.', [ // e8
        ['Metrobus', 'Colectivos en carriles exclusivos'],
        ['Subte', 'Trenes bajo tierra, sin cruzar el tránsito'],
        ['Trolebús', 'Colectivo eléctrico conectado a cables aéreos'],
        ['Tren suburbano', 'Une la ciudad con localidades del área metropolitana'],
      ], 'Cada modo tiene su rol en una red integrada.', { d: 1 }),
      det('Leé esta nota y marcá lo equivocado.', [ // e9
        ['El Metrobus de Buenos Aires empezó en 2011.', false],
        ['Un colectivo rápido necesita compartir el carril con los autos.', true, 'Su base es justamente el carril exclusivo.'],
        ['Los trolebuses funcionan con electricidad.', false],
        ['Los trenes son la opción más barata para cualquier calle.', true, 'Son caros y tienen sentido en los corredores de más demanda.'],
      ], 'Cada modo tiene costos y capacidades distintas: se eligen según la demanda.', { d: 2 }),
      comp('Completá.', 'Un sistema de colectivos rápidos se conoce por la sigla [BRT]; conviene que sus carriles estén en el [centro] de la avenida; y los vehículos eléctricos no emiten gases por el caño de [escape].', ['GNC', 'borde', 'agua'], 'Tres ideas sobre carriles, rieles y electrificación.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Un sistema para todas las personas', 'Accesibilidad, seguridad, información y el último tramo: lo que hace que el transporte sea usable de verdad.', [
      teoria('Accesibilidad', [
        'Un sistema accesible permite viajar a personas en silla de ruedas, con bastón, con cochecitos de bebé, con valijas o con dificultades para ver u oír. Eso implica colectivos de piso bajo con rampa, andenes al nivel del tren, ascensores que funcionen, anuncios sonoros y visuales de la próxima parada, y veredas y cruces accesibles para llegar a la parada. Lo que sirve a una persona con discapacidad suele servir a todas.',
      ]),
      mult('¿Qué hace accesible un sistema de transporte? Marcá todo.', [ // e1
        '+Colectivos de piso bajo con rampa',
        '+Anuncios sonoros y visuales de las paradas',
        '+Ascensores que funcionen en las estaciones',
        '+Veredas y cruces accesibles hasta la parada',
        '-Escalones altos para subir más rápido',
      ], 'La accesibilidad empieza en la vereda de casa y termina en el destino, no solo en el vehículo.', { d: 1 }),
      vf('La accesibilidad solo beneficia a las personas en silla de ruedas.', false, 'Beneficia a personas mayores, a quienes llevan cochecitos, bolsos o valijas, a personas con lesiones temporales y a muchos más. Es diseño para todas las personas.', { // e2
        razones: ['+Porque beneficia a muchísimos grupos distintos', '-Porque nadie más usa rampas', '-Porque la accesibilidad es un lujo innecesario'],
        d: 1,
      }),
      teoria('Seguridad personal', [
        'Muchas personas, sobre todo mujeres, cambian de recorrido, de horario o dejan de usar el transporte público por miedo a sufrir acoso o delitos. Paradas iluminadas y visibles, información sobre cuándo llega el colectivo (para esperar menos en la calle), canales de denuncia, y personal capacitado ayudan a que el sistema sea seguro para todas las personas.',
      ]),
      clas('¿Esta medida mejora la seguridad personal o la accesibilidad?', { // e3
        'Seguridad personal': ['Paradas bien iluminadas', 'Canales de denuncia del acoso', 'Saber cuándo llega el colectivo para no esperar de noche'],
        'Accesibilidad': ['Rampas en los colectivos', 'Anuncios sonoros de la próxima parada', 'Ascensores en las estaciones'],
      }, 'Las dos son condiciones para que el transporte sea usable por todas las personas.', { d: 2 }),
      teoria('Información y el último tramo', [
        'Saber cuándo llega el próximo colectivo reduce la espera percibida y la incertidumbre. Las aplicaciones con información en tiempo real y los carteles en las paradas ayudan mucho. Y el viaje no termina en la estación: el "último tramo" hasta la casa o el trabajo —caminando, en bici o en otro colectivo— tiene que ser seguro y cómodo. Estacionamientos de bicis en las estaciones y veredas en buen estado amplían el alcance de cada parada.',
      ]),
      op('¿Por qué un estacionamiento seguro de bicis en una estación de tren amplía el alcance del tren?', [ // e4
        'Más personas pueden llegar desde lejos en bici',
        'Porque las bicis pueden viajar solas en el tren',
        ['Porque obliga a todos a usar bici', 'No obliga: suma una opción para llegar a la estación.'],
        'Porque reemplaza al tren',
      ], 'Caminando se llega a una estación desde menos de 1 km; en bici, desde varios kilómetros: el área servida se multiplica.', { d: 2 }),
      numv(3, (i) => { // e5
        const [rp, rb] = [[0.8, 3], [1, 4], [0.5, 2.5]][i];
        return {
          enunciado: `Si una persona camina hasta una estación desde ${rp.toLocaleString('es-AR')} km como máximo y en bici desde ${rb.toLocaleString('es-AR')} km, ¿cuántas veces más grande es el área que cubre la estación con bici? (El área de un círculo crece con el cuadrado del radio.) Redondeá a un decimal.`,
          valor: Math.round((rb / rp) ** 2 * 10) / 10,
          unidad: 'veces',
          dec: 1,
          tol: 0.1,
          explicacion: `(${rb.toLocaleString('es-AR')} ÷ ${rp.toLocaleString('es-AR')})² ≈ ${(Math.round((rb / rp) ** 2 * 10) / 10).toLocaleString('es-AR')} veces. Por eso la combinación bici + tren es tan poderosa.`,
          ctx: `Radio a pie ${rp} km; radio en bici ${rb} km.`,
        };
      }, { d: 4 }),
      par('Uní cada problema con una solución.', [ // e6
        ['No sé cuándo llega el colectivo', 'Información en tiempo real'],
        ['No puedo subir con la silla de ruedas', 'Colectivos de piso bajo con rampa'],
        ['Me da miedo esperar de noche', 'Paradas iluminadas y visibles'],
        ['La estación queda lejos de casa', 'Estacionamiento seguro de bicis'],
      ], 'Cada barrera tiene soluciones concretas.', { d: 1 }),
      ord('Ordená las partes de un viaje "puerta a puerta" en transporte público.', [ // e7
        'Caminar o pedalear hasta la parada',
        'Esperar el colectivo',
        'Viajar arriba del vehículo',
        'Combinar con otra línea si hace falta',
        'Hacer el último tramo hasta el destino',
      ], 'Mejorar solo el tramo arriba del vehículo no alcanza: todas las partes cuentan.', { d: 1 }),
      rank('Ordená estas mejoras según cuántas personas beneficia en una línea muy usada, de más a menos.', [ // e8
        ['Duplicar la frecuencia', 'todos los pasajeros'],
        ['Información en tiempo real en las paradas', 'casi todos'],
        ['Rampas en todos los colectivos', 'muchos, en especial quienes más lo necesitan'],
        ['Wifi a bordo', 'algunos'],
      ], 'Todas ayudan, pero la frecuencia mejora el viaje de todas las personas a la vez.', { d: 3, extremos: ['Más personas', 'Menos personas'] }),
      op('Una estación tiene ascensor, pero hace meses que no funciona. ¿Es accesible?', [ // e8b
        'No: un ascensor roto no le sirve a nadie',
        'Sí, porque el ascensor está instalado',
        ['Sí, si hay escaleras al lado', 'Las escaleras no sirven a quien usa silla de ruedas.'],
        'Depende del color del ascensor',
      ], 'La accesibilidad incluye el mantenimiento: un ascensor roto deja afuera a quien lo necesita.', { d: 1 }),
      det('Leé este informe municipal y marcá lo que conviene corregir.', [ // e9
        ['Instalamos anuncios sonoros de las paradas.', false],
        ['Las rampas son innecesarias porque pocos pasajeros usan silla de ruedas.', true, 'Benefician a muchos grupos y son un derecho de quienes las necesitan.'],
        ['Iluminamos las paradas del recorrido nocturno.', false],
        ['El último tramo no es problema del transporte público.', true, 'Si llegar a la parada es difícil o inseguro, el sistema pierde pasajeros.'],
      ], 'Un sistema pensado para todas las personas termina siendo mejor para cada una.', { d: 2 }),
      comp('Completá.', 'Diseñar para personas con discapacidad hace un sistema [accesible]; saber cuándo llega el colectivo es información en tiempo [real]; y el recorrido desde la parada hasta el destino es el último [tramo].', ['exclusivo', 'pasado', 'peaje'], 'Tres claves para un transporte público usable por todas las personas.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: transporte público', 'Eficiencia, frecuencia, redes, colectivos rápidos, electrificación y accesibilidad, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: la red de Villa Norte', 'Una ciudad mediana tiene 12 colectivos y quiere rediseñar su red. Con los datos, elegí la mejor propuesta.', [
      teoria('Las propuestas', [
        'Villa Norte tiene 12 colectivos. Cada vuelta completa dura 60 minutos. Hoy hay 6 líneas con 2 colectivos cada una, que entran a todos los barrios pero pasan cada 30 minutos, y los pasajeros bajan año tras año. La propuesta A mantiene las 6 líneas. La propuesta B arma 2 líneas troncales por las avenidas principales, con 5 colectivos cada una, más 1 línea barrial con 2 colectivos, y una tarifa integrada para combinar. Además, en las avenidas troncales se puede pintar un carril exclusivo, que bajaría la vuelta de 60 a 50 minutos.',
      ]),
      num('En la propuesta B, ¿cada cuántos minutos pasa cada línea troncal, sin carril exclusivo?', 12, 'minutos', '60 ÷ 5 = 12 minutos, contra 30 minutos de hoy. La espera promedio baja de 15 a 6 minutos.', { ctx: 'Vuelta de 60 minutos; 5 colectivos por troncal.', d: 2 }),
      num('Con el carril exclusivo, la vuelta de las troncales baja a 50 minutos. ¿Cada cuántos minutos pasarían?', 10, 'minutos', '50 ÷ 5 = 10 minutos, sin comprar colectivos: la velocidad se convierte en frecuencia.', { ctx: 'Vuelta de 50 minutos; 5 colectivos por troncal.', d: 2 }),
      op('¿Qué riesgo tiene la propuesta B y cómo se atiende?', [ // e3
        'Algunos caminan más; se atiende con la línea barrial',
        'Que los colectivos troncales vayan demasiado vacíos',
        ['Que la frecuencia empeore en todas las líneas', 'Las troncales mejoran mucho; el costo está en la cobertura.'],
        'Que la tarifa integrada cueste más que hoy',
      ], 'Toda red concentra o reparte. Reconocer quién pierde y compensarlo hace a la propuesta más justa.', { d: 3 }),
      mult('¿Qué elementos hacen que la propuesta B funcione? Marcá todos.', [ // e4
        '+Tarifa integrada para no castigar las combinaciones',
        '+Carril exclusivo en las troncales',
        '+Paradas de combinación seguras e iluminadas',
        '-Cobrar doble a quien combina',
        '-Sacar la línea barrial para ahorrar',
      ], 'Una red troncal funciona si combinar es fácil, barato y seguro.', { d: 2 }),
      rank('Ordená las medidas por impacto en los pasajeros, de mayor a menor.', [ // e5
        ['Pasar de 30 a 10 minutos de frecuencia en las troncales', 'enorme'],
        ['Tarifa integrada', 'grande'],
        ['Información en tiempo real', 'media'],
        ['Pintar los colectivos de otro color', 'mínima'],
      ], 'La frecuencia es la mejora más sentida; la estética casi no cambia el viaje.', { d: 3 }),
      vf('La propuesta B no necesita comprar colectivos nuevos para mejorar mucho la frecuencia.', true, 'Reorganiza la misma flota y el carril exclusivo acelera las vueltas. Es una mejora de diseño y de gestión, no de compra.', { // e6
        razones: ['+Porque reorganiza la flota y acelera las vueltas', '-Porque duplica la cantidad de colectivos', '-Porque elimina todas las líneas'],
        d: 2,
      }),
      det('El municipio presenta la red nueva. Marcá lo que conviene corregir.', [ // e7
        ['Las troncales pasarán cada 10 minutos gracias al carril exclusivo.', false],
        ['Quien combine pagará dos boletos completos.', true, 'Sin tarifa integrada, la red castiga a quien combina.'],
        ['Mantendremos una línea barrial para quienes quedan lejos.', false],
        ['No haremos consultas: los vecinos no saben de transporte.', true, 'Quienes viajan conocen sus recorridos; consultarlos mejora el diseño.'],
      ], 'Una buena red se diseña con números y con las personas que la usan.', { d: 3 }),
    ]),
  ],
});
