import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// MOVILIDAD 2 — Caminar y pedalear.
// Los modos activos a fondo: la bici como transporte, los beneficios para la
// salud, la seguridad de peatones y ciclistas, cómo es una ciudad caminable
// y cómo combinar modos. Retoma la huella y el espacio de cada modo
// (movilidad-1) y cómo se arma un hábito (tronco-3).

export default unidad({
  slug: 'movilidad-2',
  rama: 'movilidad',
  orden: 2,
  nivel: 1,
  requiereTronco: 1,
  titulo: 'Caminar y pedalear',
  bajada: 'La forma de moverse más eficiente que existe funciona con tus piernas. Cómo usarla en la ciudad con seguridad, y por qué te hace bien.',
  objetivos: [
    'Evaluar la bicicleta como medio de transporte cotidiano',
    'Relacionar la movilidad activa con las recomendaciones de actividad física de la OMS',
    'Aplicar pautas de seguridad para peatones y ciclistas',
    'Describir las características de una ciudad caminable',
    'Planificar viajes que combinen modos activos y transporte público',
  ],
  repasa: ['movilidad-1', 'tronco-3'],
  fuentes: ['oms-actividad-fisica', 'oms-seguridad-vial', 'owid-transporte', 'oms-aire-exterior'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('La bici como transporte', 'Velocidad, alcance, costo y eficiencia: por qué la bicicleta es una de las mejores máquinas que se inventaron.', [
      teoria('Una máquina muy eficiente', [
        'La bicicleta es uno de los medios de transporte más eficientes que existen: con la energía de un sándwich, una persona puede recorrer varios kilómetros. No emite gases al andar, casi no hace ruido, ocupa poco lugar y es barata de mantener.',
        'En la ciudad, una bici se mueve a unos 12 a 18 km por hora. Para trayectos de hasta 5 a 8 km suele ser tan rápida como el auto o el colectivo en horas pico, puerta a puerta.',
      ]),
      mult('¿Qué ventajas tiene la bicicleta en la ciudad? Marcá todas.', [ // e1
        '+No emite gases al andar',
        '+Ocupa poco espacio',
        '+Es barata de mantener',
        '+Suma actividad física',
        '-Protege de la lluvia como un auto',
      ], 'Tiene muchas ventajas; la lluvia y las distancias largas son sus límites, que se resuelven combinando modos o con la ropa adecuada.', { d: 1 }),
      numv(3, (i) => { // e2
        const km = [4, 6, 8][i];
        const vel = 15;
        return {
          enunciado: `¿Cuántos minutos tarda en bici alguien que hace ${km} km a ${vel} km por hora?`,
          valor: (km / vel) * 60,
          unidad: 'minutos',
          explicacion: `${km} ÷ ${vel} × 60 = ${(km / vel) * 60} minutos, puerta a puerta y sin buscar estacionamiento.`,
        };
      }, { d: 1 }),
      teoria('Cuánto cuesta', [
        'Mantener una bicicleta cuesta una fracción de lo que cuesta un auto: no usa combustible, no paga estacionamiento y los repuestos son baratos. Para muchas personas, pedalear también reemplaza el pasaje del colectivo en trayectos cortos.',
        'Existen sistemas de bicicletas públicas en varias ciudades argentinas, que permiten usar una bici sin comprarla.',
      ]),
      numv(3, (i) => { // e3
        const pasaje = [700, 900, 500][i];
        const dias = [20, 22, 18][i];
        return {
          enunciado: `Alguien paga $${pasaje.toLocaleString('es-AR')} por pasaje y hace 2 viajes por día, ${dias} días por mes. Si reemplaza esos viajes por la bici, ¿cuánto ahorra por mes?`,
          valor: pasaje * 2 * dias,
          unidad: '$',
          explicacion: `${pasaje.toLocaleString('es-AR')} × 2 × ${dias} = $${(pasaje * 2 * dias).toLocaleString('es-AR')} por mes. En pocos meses puede pagar una bici usada.`,
        };
      }, { d: 1 }),
      clas('¿Para qué viaje suele ser buena la bici y para cuál no tanto?', { // e4
        'Buena opción': ['5 km a la escuela por una ciclovía', 'Compras chicas en el barrio', 'Ir hasta la estación de tren'],
        'No tanto': ['Mudanza con muebles', '60 km por ruta sin banquina', 'Llevar a tres chicos chicos a la vez sin equipamiento'],
      }, 'La bici es ideal para trayectos cortos y medianos. Para otros viajes, conviene combinar.', { d: 1 }),
      vf('La bicicleta solo sirve para hacer deporte, no para moverse en la ciudad.', false, 'En muchas ciudades del mundo es un medio de transporte cotidiano. En trayectos cortos y medianos es rápida, barata y eficiente.', { // e5
        razones: ['+Porque en trayectos cortos y medianos es rápida y barata', '-Porque las bicis no pueden andar en la ciudad', '-Porque la bici es más lenta que caminar'],
        d: 1,
      }),
      teoria('Qué hace falta para pedalear', [
        'Para que la bici sea una opción real hacen falta varias cosas: ciclovías seguras y conectadas, lugares donde estacionarla sin que la roben, poder llevarla en el tren o dejarla en la estación, y lugares para cambiarse o higienizarse en trabajos y escuelas.',
        'Cuando esas condiciones existen, mucha más gente pedalea.',
      ]),
      mult('¿Qué hace que más personas usen la bici para ir al trabajo? Marcá todo.', [ // e6
        '+Ciclovías seguras y conectadas',
        '+Bicicleteros seguros en el destino',
        '+Poder combinarla con el tren',
        '+Vestuarios o lugares para cambiarse',
        '-Que no haya ciclovías para que los autos vayan más rápido',
      ], 'La infraestructura convierte la bici de opción teórica en opción real.', { d: 1 }),
      cad('Armá la cadena de por qué una ciclovía conectada aumenta el uso de la bici.', [ // e7
        'Se construye una ciclovía protegida y continua',
        'Pedalear se vuelve más seguro',
        'Más personas se animan a usar la bici',
        'Más gente pedaleando hace que los conductores estén más atentos',
        'Pedalear se vuelve todavía más seguro y común',
      ], ['La ciclovía hace que las bicis vayan a 60 km/h'], 'Un círculo virtuoso: más seguridad, más ciclistas, más seguridad. Se lo llama "seguridad en números".', { d: 2 }),
      op('Una empresa quiere que más empleados vayan en bici. ¿Qué medida conviene primero?', [ // e8
        'Poner un bicicletero seguro y techado',
        'Pedirles que vengan en bici sin cambiar nada',
        ['Comprarles cascos a todos', 'El casco ayuda, pero si no hay dónde dejar la bici segura, casi nadie la usa.'],
        'Ampliar el estacionamiento de autos',
      ], 'Sin un lugar seguro donde dejarla, pocos se arriesgan a que les roben la bici.', { d: 2 }),
      det('Leé este comentario y marcá lo equivocado.', [ // e9
        ['La bici no emite gases al andar.', false],
        ['Pedalear 5 km lleva más de una hora.', true, 'A 15 km/h, 5 km son unos 20 minutos.'],
        ['Hacen falta bicicleteros seguros para que la gente pedalee.', false],
        ['Si hay más ciclistas, las calles son más peligrosas para ellos.', true, 'Suele ser al revés: con más ciclistas, los conductores están más atentos.'],
      ], 'La bici es más rápida y más segura de lo que muchos creen, cuando la ciudad acompaña.', { d: 2 }),
      comp('Completá.', 'En la ciudad, una bici se mueve a unos [15] km por hora; para que la gente la use hacen falta ciclovías [conectadas] y bicicleteros [seguros].', ['60', 'aisladas', 'pintados'], 'Velocidad y condiciones para pedalear en la ciudad.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Moverse es salud', 'Actividad física, recomendaciones de la OMS y por qué los beneficios de pedalear superan los riesgos.', [
      teoria('Lo que recomienda la OMS', [
        'La Organización Mundial de la Salud recomienda que las personas adultas hagan entre 150 y 300 minutos semanales de actividad física moderada (como caminar rápido o pedalear tranquilo), o entre 75 y 150 minutos de actividad intensa. Para niños, niñas y adolescentes, un promedio de 60 minutos por día.',
        'Sin embargo, en el mundo casi un tercio de las personas adultas no llega a esos niveles.',
      ], { destacado: { valor: '150-300 min', texto: 'por semana de actividad moderada recomienda la OMS para las personas adultas.' } }),
      par('Uní cada grupo con lo que recomienda la OMS.', [ // e1
        ['Personas adultas (moderada)', '150 a 300 minutos por semana'],
        ['Personas adultas (intensa)', '75 a 150 minutos por semana'],
        ['Niños, niñas y adolescentes', 'Un promedio de 60 minutos por día'],
      ], 'Recomendaciones simples que la movilidad activa puede cubrir sin buscar tiempo extra.', { d: 2 }),
      numv(3, (i) => { // e2
        const min = [12, 20, 8][i];
        const dias = [5, 5, 4][i];
        return {
          enunciado: `Alguien pedalea ${min} minutos de ida y ${min} de vuelta al trabajo, ${dias} días por semana. ¿Cuántos minutos de actividad suma por semana?`,
          valor: min * 2 * dias,
          unidad: 'minutos',
          explicacion: `${min} × 2 × ${dias} = ${min * 2 * dias} minutos. ${min * 2 * dias >= 150 ? 'Cumple la recomendación mínima de la OMS solo con ir y volver.' : `Le faltan ${150 - min * 2 * dias} minutos para los 150 semanales.`}`,
        };
      }, { d: 1 }),
      teoria('Beneficios', [
        'La actividad física regular reduce el riesgo de enfermedades del corazón, accidentes cerebrovasculares, diabetes tipo 2, varios tipos de cáncer, depresión y ansiedad, y mejora el sueño y la memoria. En niños y adolescentes, ayuda al desarrollo de huesos y músculos y al rendimiento escolar.',
        'La inactividad física, en cambio, está entre los principales factores de riesgo de muerte prematura en el mundo.',
      ]),
      mult('¿Qué beneficios tiene la actividad física regular según la OMS? Marcá todos.', [ // e3
        '+Menos riesgo de enfermedades del corazón',
        '+Menos riesgo de diabetes tipo 2',
        '+Mejor salud mental',
        '+Mejor sueño',
        '-Inmunidad total a cualquier enfermedad',
      ], 'Muchos beneficios comprobados, sin ser una vacuna contra todo.', { d: 1 }),
      teoria('¿Y el aire contaminado?', [
        'Una duda común: si se pedalea entre autos, ¿no se respira más contaminación? Es cierto que se respira más aire al hacer ejercicio. Pero los estudios encuentran que, en la gran mayoría de las ciudades, los beneficios de la actividad física superan con creces el daño del aire contaminado que se respira en el camino.',
        'Además, elegir calles con menos tránsito, paralelas a las avenidas, reduce mucho la exposición.',
      ]),
      vf('Como en la calle hay contaminación, pedalear hace más daño que bien a la salud.', false, 'En la gran mayoría de las ciudades, los beneficios de la actividad física superan el daño del aire. Y elegir calles tranquilas reduce la exposición.', { // e4
        razones: ['+Porque los beneficios de la actividad superan el daño del aire en casi todas las ciudades', '-Porque el aire de las calles es siempre limpio', '-Porque los ciclistas no respiran mientras pedalean'],
        d: 3,
      }),
      op('Para ir en bici al trabajo respirando menos contaminación, ¿qué conviene?', [ // e5
        'Elegir calles paralelas a las avenidas',
        'Ir pegado a los caños de escape de los colectivos',
        ['Pedalear más rápido para llegar antes', 'Pedalear más fuerte aumenta la respiración; lo que más cambia la exposición es el recorrido.'],
        'Ir por la avenida con más tránsito porque es más directa',
      ], 'A pocas cuadras de una avenida, la contaminación baja mucho. El recorrido importa.', { d: 2 }),
      clas('¿Esta forma de viajar cuenta como actividad física?', { // e6
        'Cuenta': ['Caminar 15 minutos hasta la estación', 'Pedalear a la escuela', 'Subir escaleras en vez de tomar el ascensor'],
        'No cuenta': ['Ir sentado en el auto', 'Esperar el colectivo sentado', 'Usar un monopatín eléctrico sin pedalear'],
      }, 'La movilidad activa suma minutos sin buscar tiempo extra en el día.', { d: 1 }),
      cad('Armá la cadena de cómo ir en bici a la escuela afecta la salud de un adolescente.', [ // e7
        'Va en bici 15 minutos de ida y 15 de vuelta',
        'Suma 30 minutos diarios de actividad física',
        'Se acerca a los 60 minutos que recomienda la OMS',
        'Mejora su salud física y mental',
      ], ['Llega tan cansado que no puede estudiar'], 'Un hábito de transporte que es también un hábito de salud. Como viste en el tronco: disparador, rutina, recompensa.', { d: 2 }),
      det('Leé este consejo y marcá lo equivocado.', [ // e8
        ['La OMS recomienda al menos 150 minutos semanales de actividad moderada para adultos.', false],
        ['Caminar a la estación no cuenta como actividad física.', true, 'Caminar a paso ligero cuenta como actividad moderada.'],
        ['Pedalear por calles tranquilas reduce la contaminación que se respira.', false],
        ['Los chicos no necesitan actividad física diaria.', true, 'La OMS recomienda un promedio de 60 minutos por día para niños y adolescentes.'],
      ], 'Moverse para llegar es también moverse para estar bien.', { d: 2 }),
      comp('Completá.', 'La OMS recomienda a los adultos entre [150] y 300 minutos semanales de actividad moderada, y a los chicos un promedio de [60] minutos por día.', ['15', '6'], 'Dos números para recordar sobre actividad física.', { d: 1 }),
      est('Estimá qué porcentaje de las personas adultas del mundo no llega a la actividad física recomendada por la OMS.', 31, { min: 0, max: 100, paso: 1, unidad: '%' }, 'Alrededor de un tercio, según la OMS. La movilidad activa es una de las formas más simples de cambiarlo.', { d: 3 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Seguridad para peatones y ciclistas', 'Velocidad, puntos ciegos, luces y ciclovías: cómo moverse más seguro y qué hace una ciudad segura.', [
      teoria('La velocidad otra vez', [
        'Según la OMS, cada kilómetro por hora de aumento de la velocidad media aumenta alrededor de un 3 % el riesgo de choques con heridos y entre un 4 y un 5 % el de choques con víctimas fatales. Por eso bajar la velocidad en zonas con peatones y ciclistas es una de las medidas más efectivas.',
        'Pero la seguridad no depende solo de cada persona: el diseño de las calles —cruces cortos, ciclovías separadas, reductores de velocidad— evita que los errores humanos terminen en muertes.',
      ]),
      numv(3, (i) => { // e1
        const dv = [10, 5, 20][i];
        return {
          enunciado: `Si cada 1 km/h de aumento de la velocidad media sube alrededor de un 4 % el riesgo de choques fatales, ¿aproximadamente cuánto sube ese riesgo con ${dv} km/h más? (Sumá simple, sin interés compuesto)`,
          valor: dv * 4,
          unidad: '%',
          explicacion: `${dv} × 4 = ${dv * 4} %. Es una aproximación, pero muestra por qué unos pocos km/h importan tanto.`,
        };
      }, { d: 2 }),
      teoria('El punto ciego', [
        'Los colectivos y los camiones tienen puntos ciegos: zonas alrededor del vehículo que el conductor no ve, ni siquiera con los espejos. Son especialmente peligrosos al costado derecho y justo adelante. Muchos siniestros graves con ciclistas ocurren cuando un camión o colectivo dobla a la derecha.',
        'Regla práctica: si no ves los ojos del conductor en su espejo, él no te ve.',
      ]),
      op('Estás en bici junto a un colectivo detenido en un semáforo que va a doblar a la derecha. ¿Qué es lo más seguro?', [ // e2
        'Quedarte detrás hasta que doble',
        'Ponerte a su derecha para arrancar primero',
        ['Pasarlo rápido por la derecha antes de que arranque', 'Es la zona del punto ciego: el conductor puede no verte al doblar.'],
        'Tocar timbre y confiar en que te vea',
      ], 'Nunca te quedes al costado derecho de un vehículo grande que puede doblar: es su punto ciego.', { d: 2 }),
      mult('¿Qué hace más visible y seguro a un ciclista? Marcá todo.', [ // e3
        '+Luz blanca adelante y roja atrás de noche',
        '+Ropa o elementos reflectivos',
        '+Casco bien colocado',
        '+Señalizar con el brazo antes de doblar',
        '-Andar con auriculares a todo volumen',
      ], 'Ver y ser visto, y avisar lo que vas a hacer. Los auriculares a todo volumen quitan un sentido clave.', { d: 1 }),
      clas('¿Es una práctica segura o riesgosa para un ciclista?', { // e4
        'Segura': ['Circular en el sentido del tránsito', 'Usar la ciclovía cuando existe', 'Frenar antes de cruzar una bocacalle'],
        'Riesgosa': ['Ir de contramano por la calle', 'Zigzaguear entre autos en movimiento', 'Cruzar en rojo porque "no viene nadie"'],
      }, 'Ser predecible es la mejor protección: que los demás sepan qué vas a hacer.', { d: 1 }),
      teoria('Peatones', [
        'Los peatones son los usuarios más vulnerables. Cruzar por la senda peatonal y con el semáforo, mirar a ambos lados aunque la calle sea de una mano, no cruzar mirando el celular y hacerse visible de noche reducen los riesgos.',
        'Del lado de la ciudad, las esquinas con veredas ensanchadas, las sendas bien pintadas, los semáforos con tiempo suficiente para cruzar y los reductores de velocidad protegen a todos, sobre todo a chicos y personas mayores.',
      ]),
      par('Uní cada elemento de la calle con cómo protege al peatón.', [ // e5
        ['Esquina con vereda ensanchada', 'Acorta el cruce y hace doblar más despacio'],
        ['Reductor de velocidad', 'Obliga a los autos a ir más lento'],
        ['Semáforo con tiempo suficiente', 'Permite cruzar sin correr'],
        ['Isla en el medio de la avenida', 'Permite cruzar en dos etapas'],
      ], 'El diseño de la calle puede perdonar errores humanos. Es la idea de "sistema seguro".', { d: 2 }),
      vf('La seguridad vial depende solo de que cada persona tenga cuidado.', false, 'El comportamiento importa, pero el diseño de las calles y los límites de velocidad hacen que los errores no terminen en muertes. Es la idea de sistema seguro.', { // e6
        razones: ['+Porque el diseño de las calles y la velocidad también la determinan', '-Porque los accidentes son inevitables', '-Porque solo los conductores de camiones son responsables'],
        d: 2,
      }),
      cad('Armá la cadena de cómo una esquina con vereda ensanchada protege a un chico que cruza.', [ // e7
        'Se ensancha la vereda en la esquina',
        'La distancia para cruzar se acorta',
        'Los autos doblan más cerrados y más despacio',
        'El chico está menos tiempo en la calzada',
        'Baja el riesgo de que lo atropellen',
      ], ['La vereda ancha hace que los autos no puedan doblar'], 'Pequeños cambios de diseño con grandes efectos en la seguridad.', { d: 2 }),
      det('Leé estos consejos de un folleto y marcá los equivocados.', [ // e8
        ['Usá luces adelante y atrás si pedaleás de noche.', false],
        ['Andá de contramano para ver venir a los autos.', true, 'Ir de contramano es impredecible y aumenta mucho el riesgo de choque.'],
        ['Nunca te quedes al costado derecho de un camión que va a doblar.', false],
        ['Si la calle es de una mano, alcanza con mirar para un solo lado.', true, 'Puede venir una bici de contramano o un vehículo en reversa: siempre mirar a ambos lados.'],
      ], 'Ser visible, predecible y atento, en calles diseñadas para perdonar errores.', { d: 2 }),
      comp('Completá.', 'Si no ves los ojos del conductor en su [espejo], él no te ve; en bici hay que circular en el [sentido] del tránsito.', ['celular', 'contrario'], 'Dos reglas simples que evitan muchos siniestros.', { d: 1 }),
      rank('Ordená estas medidas por su efecto sobre la seguridad de peatones y ciclistas en un barrio, de más a menos.', [ // e10
        ['Bajar la velocidad máxima a 30 km/h y hacerla cumplir', 'efecto muy grande'],
        ['Ciclovías separadas del tránsito', 'efecto grande'],
        ['Mejorar la iluminación de las esquinas', 'efecto moderado'],
        ['Carteles que piden "precaución"', 'efecto chico'],
      ], 'Las medidas que cambian la velocidad y el espacio funcionan mucho más que los carteles.', { d: 3 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Ciudades caminables', 'Veredas, sombra, cruces y cercanía: qué hace que una ciudad invite a caminar, y la idea de la ciudad de 15 minutos.', [
      teoria('Qué hace caminable a una ciudad', [
        'Una ciudad es caminable cuando caminar es seguro, cómodo e interesante. Eso depende de veredas anchas y sin obstáculos, cruces seguros y cortos, sombra de árboles, bancos para descansar, buena iluminación y, sobre todo, de que haya cosas cerca: comercios, escuelas, plazas y servicios a distancias caminables.',
        'Las personas mayores, los chicos y quienes usan silla de ruedas o cochecito son los que más dependen de una ciudad caminable.',
      ]),
      mult('¿Qué hace que una calle invite a caminar? Marcá todo.', [ // e1
        '+Veredas anchas y sin pozos',
        '+Árboles que den sombra',
        '+Comercios y servicios cerca',
        '+Cruces seguros',
        '-Autos estacionados sobre la vereda',
      ], 'Comodidad, seguridad y cosas interesantes cerca: la receta de una calle caminable.', { d: 1 }),
      teoria('La ciudad de 15 minutos', [
        'La idea de la "ciudad de 15 minutos", propuesta por el urbanista Carlos Moreno, plantea que las necesidades cotidianas —trabajo, escuela, comercios, salud, plazas, cultura— deberían estar a unos 15 minutos a pie o en bici desde cada casa.',
        'Para lograrlo, las ciudades mezclan usos (viviendas, comercios y servicios en los mismos barrios) en lugar de separarlos en zonas lejanas, y distribuyen escuelas, centros de salud y plazas en todos los barrios.',
      ]),
      numv(3, (i) => { // e2
        const min = [15, 10, 20][i];
        return {
          enunciado: `A 5 km por hora, ¿cuántos kilómetros se recorren caminando en ${min} minutos? Redondeá a dos decimales.`,
          valor: Math.round(((5 * min) / 60) * 100) / 100,
          unidad: 'km',
          dec: 2,
          tol: 0.02,
          explicacion: `5 × ${min} ÷ 60 ≈ ${(Math.round(((5 * min) / 60) * 100) / 100).toLocaleString('es-AR')} km. Ese es el radio de una "ciudad de ${min} minutos" a pie.`,
        };
      }, { d: 2 }),
      cad('Armá la cadena de por qué mezclar usos en un barrio reduce los viajes en auto.', [ // e3
        'Se permiten comercios y servicios entre las viviendas',
        'Las cosas cotidianas quedan cerca',
        'Muchos viajes se vuelven caminables',
        'Menos personas necesitan el auto para lo diario',
      ], ['Mezclar usos hace que las casas queden más lejos'], 'La distancia es la variable que más influye en cómo nos movemos. Acercar las cosas cambia todo.', { d: 2 }),
      vf('Separar las zonas de vivienda, de comercio y de trabajo reduce los viajes.', false, 'Al separar los usos, las distancias crecen y los viajes se alargan, sobre todo en auto. Mezclarlos acerca las cosas.', { // e4
        razones: ['+Porque separar usos alarga las distancias', '-Porque las personas nunca van de compras', '-Porque separar usos acorta todos los viajes'],
        d: 2,
      }),
      clas('¿Esto hace a un barrio más caminable o menos?', { // e5
        'Más caminable': ['Una verdulería a dos cuadras', 'Árboles en todas las veredas', 'Esquinas con rampas'],
        'Menos caminable': ['Un shopping al que solo se llega por autopista', 'Veredas ocupadas por autos estacionados', 'Cuadras de 400 metros sin cruces'],
      }, 'Cercanía, comodidad y continuidad hacen que caminar sea la opción obvia.', { d: 2 }),
      teoria('Accesibilidad universal', [
        'Una ciudad caminable tiene que serlo para todos: personas con discapacidad, personas mayores, familias con cochecitos. Eso requiere rampas en las esquinas, veredas sin escalones ni pozos, semáforos con sonido para personas ciegas y transporte público accesible.',
        'Lo que se diseña pensando en quien tiene más dificultades termina siendo mejor para todos.',
      ]),
      par('Uní cada elemento de accesibilidad con a quién ayuda más.', [ // e6
        ['Rampa en la esquina', 'Personas en silla de ruedas y con cochecitos'],
        ['Semáforo sonoro', 'Personas ciegas'],
        ['Bancos cada pocas cuadras', 'Personas mayores'],
        ['Colectivo de piso bajo', 'Personas con movilidad reducida'],
      ], 'Diseñar para todos es, al final, diseñar mejor para cada persona.', { d: 1 }),
      op('En un barrio, las veredas están rotas y llenas de autos estacionados. ¿Qué es lo primero que conviene pedir al municipio?', [ // e7
        'Reparar las veredas y controlar el estacionamiento',
        'Construir un estacionamiento más grande',
        ['Pintar las veredas de colores', 'Puede ser lindo, pero no resuelve que no se pueda caminar.'],
        'Poner más carteles de "respete al peatón"',
      ], 'Las veredas son la infraestructura básica de la movilidad. Sin ellas, caminar es difícil y peligroso.', { d: 2 }),
      det('Leé esta propuesta vecinal y marcá lo que no ayuda a caminar.', [ // e8
        ['Plantar árboles en las veredas para tener sombra.', false],
        ['Permitir estacionar sobre la vereda para que no se llene la calle.', true, 'Las veredas son para las personas: estacionar ahí las bloquea.'],
        ['Hacer rampas en todas las esquinas.', false],
        ['Cerrar la verdulería del barrio y abrir un hipermercado a 5 km.', true, 'Alejar los comercios obliga a viajar más, y en auto.'],
      ], 'Una ciudad caminable acerca las cosas y cuida las veredas.', { d: 2 }),
      comp('Completá.', 'La idea de la ciudad de [15] minutos propone tener lo cotidiano cerca; para eso se [mezclan] usos en los barrios.', ['60', 'separan'], 'La propuesta central de la lección, en una línea.', { d: 1 }),
      rank('Ordená estas distancias a la escuela según qué tan probable es que un chico vaya caminando, de más a menos.', [ // e10
        ['300 metros por veredas buenas', 'muy probable'],
        ['1 km con un cruce de avenida con semáforo', 'probable'],
        ['2 km por calles sin veredas', 'poco probable'],
        ['5 km cruzando una autopista', 'casi imposible'],
      ], 'Distancia y seguridad del recorrido deciden si caminar es una opción.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Combinar modos', 'Bici más tren, caminar más colectivo: cómo armar viajes largos con modos de baja huella.', [
      teoria('La intermodalidad', [
        'Muchos viajes son demasiado largos para hacerlos solo a pie o en bici, pero se pueden combinar: caminar o pedalear hasta la estación, tomar el tren y caminar el último tramo. Combinar modos se llama intermodalidad.',
        'Funciona bien cuando las estaciones tienen bicicleteros seguros, cuando se puede subir la bici al tren, cuando los horarios coinciden y cuando un mismo medio de pago sirve para todo.',
      ]),
      ord('Ordená un viaje intermodal típico al trabajo.', [ // e1
        'Pedalear de casa a la estación',
        'Dejar la bici en el bicicletero',
        'Viajar en tren',
        'Caminar desde la estación de destino',
        'Llegar al trabajo',
      ], 'Tres modos, un solo viaje. Cada tramo con el modo que mejor le queda.', { d: 1, extremos: ['Primero', 'Último'] }),
      mult('¿Qué facilita combinar la bici con el tren? Marcá todo.', [ // e2
        '+Bicicleteros seguros en las estaciones',
        '+Permitir subir la bici al tren',
        '+Ciclovías que lleguen a las estaciones',
        '+Horarios frecuentes',
        '-Estaciones sin ningún acceso para bicis',
      ], 'La intermodalidad es un sistema: cada pieza tiene que estar.', { d: 1 }),
      numv(3, (i) => { // e3
        const bici = [3, 2, 4][i];
        const tren = [20, 25, 15][i];
        const pie = [0.8, 0.5, 1][i];
        return {
          enunciado: `Un viaje combina ${bici} km en bici, ${tren} km en tren y ${pie.toLocaleString('es-AR')} km a pie. Si el tren emite 41 g por pasajero y km, ¿cuántos gramos de CO₂e emite el viaje?`,
          valor: tren * 41,
          unidad: 'g CO₂e',
          explicacion: `Solo emite el tramo en tren: ${tren} × 41 = ${(tren * 41).toLocaleString('es-AR')} g. La bici y la caminata no emiten en el viaje.`,
        };
      }, { d: 2 }),
      numv(3, (i) => { // e4
        const total = [23.8, 27.5, 20][i];
        return {
          enunciado: `Si ese mismo viaje de ${total.toLocaleString('es-AR')} km se hiciera solo en auto (192 g por km), ¿cuántos gramos de CO₂e emitiría? Redondeá al entero.`,
          valor: Math.round(total * 192),
          unidad: 'g CO₂e',
          tol: 2,
          explicacion: `${total.toLocaleString('es-AR')} × 192 ≈ ${Math.round(total * 192).toLocaleString('es-AR')} g, varias veces más que el viaje combinado.`,
        };
      }, { d: 2 }),
      teoria('La última milla', [
        'El último tramo de un viaje, desde la estación o la parada hasta el destino, se llama "última milla". Si es largo, incómodo o inseguro, muchas personas prefieren el auto para todo el viaje.',
        'Mejorar la última milla —veredas, ciclovías, bicis públicas, colectivos de conexión— hace que el transporte público sea una opción real para mucha más gente.',
      ]),
      cad('Armá la cadena de por qué una mala última milla hace que se elija el auto.', [ // e5
        'La estación queda a 2 km del trabajo sin colectivo de conexión',
        'El último tramo es largo e incómodo',
        'El viaje en tren pierde atractivo',
        'La persona elige ir en auto todo el trayecto',
      ], ['El tren llega más rápido porque la estación está lejos'], 'Un eslabón débil arruina toda la cadena. Por eso se mejora la conexión con la estación.', { d: 2 }),
      clas('¿Esta medida mejora la última milla o no?', { // e6
        'La mejora': ['Estación de bicis públicas en la salida del tren', 'Vereda ancha e iluminada hasta el polo industrial', 'Colectivo de conexión que espera al tren'],
        'No la mejora': ['Estacionamiento más grande para autos en el centro', 'Cerrar la salida lateral de la estación', 'Quitar la parada de colectivo frente a la estación'],
      }, 'La última milla es donde se gana o se pierde a un pasajero.', { d: 2 }),
      vf('Si el tren es rápido, no importa cómo se llega a la estación.', false, 'Si llegar a la estación o del tren al destino es difícil, muchas personas eligen el auto. La calidad de todo el recorrido cuenta.', { // e7
        razones: ['+Porque la experiencia de todo el viaje decide qué modo se elige', '-Porque los trenes llegan a la puerta de cada casa', '-Porque nadie camina hasta las estaciones'],
        d: 2,
      }),
      op('Una persona vive a 2,5 km de la estación de tren y hoy va en auto al centro. ¿Qué combinación le conviene explorar?', [ // e8
        'Bici hasta la estación y tren al centro',
        'Caminar los 25 km completos hasta el centro',
        ['Auto hasta el centro, porque la estación está lejos', '2,5 km en bici son unos 10 minutos: la estación no está tan lejos.'],
        'Remís hasta la estación todos los días',
      ], 'La bici acerca estaciones que parecen lejanas a pie: 2,5 km son unos 10 minutos pedaleando.', { d: 2 }),
      det('Leé este plan municipal y marcá lo que no ayuda a combinar modos.', [ // e9
        ['Instalaremos bicicleteros techados en las estaciones.', false],
        ['Prohibiremos subir bicis al tren en todos los horarios.', true, 'Impedir llevar la bici limita la intermodalidad; se puede regular por horario.'],
        ['Habrá una ciclovía desde el barrio hasta la estación.', false],
        ['Eliminaremos la parada de colectivo frente a la estación.', true, 'Empeora la conexión entre modos.'],
      ], 'Combinar modos requiere que cada pieza encaje con la siguiente.', { d: 2 }),
      comp('Completá.', 'Combinar modos en un viaje se llama [intermodalidad]; el último tramo hasta el destino es la [última] milla.', ['congestión', 'primera'], 'Dos ideas para armar viajes largos con baja huella.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: caminar y pedalear', 'Bici, salud, seguridad, ciudad caminable y combinación de modos, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el plan de Carla', 'Carla quiere dejar el auto para ir al trabajo. Con datos de tiempos, costos, salud y seguridad, armá el mejor plan.', [
      teoria('La situación de Carla', [
        'Carla vive a 3 km de una estación de tren. El tren la deja a 1 km de su trabajo, en un viaje de 25 minutos. En auto tarda 45 minutos en hora pico y paga estacionamiento. Hay una ciclovía que llega a la estación, que tiene bicicletero techado. Del tren al trabajo hay veredas buenas.',
        'Carla hoy casi no hace actividad física y trabaja 5 días por semana.',
      ]),
      num('¿Cuántos minutos tarda en bici hasta la estación, a 15 km por hora?', 12, 'minutos', '3 ÷ 15 × 60 = 12 minutos de pedaleo hasta la estación.', { ctx: 'Carla pedalea 3 km hasta la estación a 15 km/h.', d: 1 }),
      num('¿Cuánto tarda el viaje completo: 12 minutos en bici, 3 de dejar la bici, 25 de tren y 12 caminando?', 52, 'minutos', '12 + 3 + 25 + 12 = 52 minutos, contra 45 en auto: solo 7 minutos más, con 24 minutos de actividad física incluidos.', { ctx: 'Bici 12 min, bicicletero 3, tren 25, caminata 12.', d: 2 }),
      num('¿Cuántos minutos de actividad física suma por semana (bici y caminata, ida y vuelta, 5 días)?', 240, 'minutos', '(12 + 12) × 2 × 5 = 240 minutos por semana: más que los 150 que recomienda la OMS como mínimo.', { ctx: '12 min de bici y 12 de caminata por tramo, ida y vuelta, 5 días.', d: 2 }),
      clas('Clasificá las ventajas y desventajas del nuevo plan.', { // e4
        'Ventaja': ['Cumple la actividad física recomendada', 'Ahorra estacionamiento y combustible', 'Emite mucho menos CO₂'],
        'Desventaja a resolver': ['Tarda unos minutos más', 'Los días de lluvia fuerte es incómodo'],
      }, 'Un buen plan reconoce las desventajas y les busca solución, por ejemplo, otro modo los días de lluvia.', { d: 2 }),
      op('¿Qué conviene hacer los días de lluvia fuerte?', [ // e5
        'Ir caminando o en colectivo a la estación',
        'Volver a usar el auto todos los días',
        ['Pedalear igual sin luces ni capa', 'Con lluvia fuerte baja la visibilidad: sin preparación es riesgoso.'],
        'Faltar al trabajo',
      ], 'Tener un plan B para los días difíciles hace que el hábito se sostenga el resto de los días.', { d: 2 }),
      mult('¿Qué necesita Carla para pedalear seguro? Marcá todo.', [ // e6
        '+Luces delantera y trasera',
        '+Casco',
        '+Usar la ciclovía hasta la estación',
        '+Un buen candado para el bicicletero',
        '-Auriculares con música fuerte',
      ], 'Ver, ser vista, protegerse y cuidar la bici.', { d: 1 }),
      det('Carla escribe su plan. Marcá lo que no conviene.', [ // e7
        ['Voy en bici por la ciclovía hasta la estación y tomo el tren.', false],
        ['Si llueve fuerte, voy en colectivo a la estación.', false],
        ['Para llegar antes, voy por la avenida de contramano en vez de la ciclovía.', true, 'Ir de contramano es muy riesgoso; la ciclovía es más segura.'],
        ['Como tardo 7 minutos más, no vale la pena por la salud.', true, 'Suma 240 minutos de actividad por semana: un beneficio enorme por 7 minutos.'],
      ], 'Un plan realista, seguro y con alternativas: así se sostiene un cambio de hábito.', { d: 3 }),
    ]),
  ],
});
