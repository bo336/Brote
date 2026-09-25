import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// PLANTAS 3 — Verde urbano.
// La isla de calor, qué hacen los árboles por una ciudad, cómo elegir el
// árbol correcto para cada lugar, cómo cuidar el arbolado y cómo se diseña
// una ciudad más verde. Retoma la transpiración y los servicios de las
// plantas (plantas-1), las nativas (plantas-2) y las inundaciones urbanas
// (agua-5 si ya la hiciste).

export default unidad({
  slug: 'plantas-3',
  rama: 'plantas',
  orden: 3,
  nivel: 2,
  requiereTronco: 2,
  titulo: 'Verde urbano',
  bajada: 'Una cuadra con árboles puede estar varios grados más fresca que una sin ellos. La isla de calor, qué hacen los árboles por la ciudad y cómo elegirlos y cuidarlos.',
  objetivos: [
    'Explicar la isla de calor urbana y sus efectos',
    'Describir los servicios que el arbolado presta a una ciudad',
    'Elegir especies adecuadas para cada espacio urbano',
    'Reconocer buenas y malas prácticas en el cuidado del arbolado',
    'Proponer estrategias para ciudades más verdes',
  ],
  repasa: ['plantas-1', 'plantas-2', 'agua-5'],
  fuentes: ['epa-isla-calor', 'oms-espacios-verdes', 'plantas-nativas', 'ecorregiones-pba', 'ipcc-ar6-syr'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('La isla de calor', 'Por qué las ciudades son más calurosas que el campo que las rodea y a quién afecta más.', [
      teoria('Una ciudad más caliente', [
        'Las ciudades suelen ser más calurosas que las zonas rurales cercanas: es la isla de calor urbana. El asfalto, el cemento y los techos oscuros absorben el sol durante el día y liberan ese calor de noche. Hay pocas plantas que refresquen con su transpiración, los edificios frenan el viento, y los autos y aires acondicionados suman calor.',
        'La diferencia suele ser de varios grados, y es mayor de noche, cuando el campo se enfría y la ciudad sigue devolviendo el calor acumulado.',
      ]),
      mult('¿Qué contribuye a la isla de calor urbana? Marcá todo.', [ // e1
        '+Asfalto y techos oscuros que absorben el sol',
        '+Pocas plantas que refresquen el aire',
        '+Edificios que frenan el viento',
        '+Calor de autos y aires acondicionados',
        '-Parques con muchos árboles',
      ], 'Materiales que guardan calor, poco verde y mucha actividad: la receta de la isla de calor.', { d: 1 }),
      cad('Armá la cadena de por qué la ciudad sigue caliente de noche.', [ // e2
        'Durante el día, el asfalto y el cemento absorben el sol',
        'Guardan ese calor en su masa',
        'De noche, lo liberan lentamente al aire',
        'La temperatura nocturna baja poco',
        'Las noches se vuelven más calurosas que en el campo',
      ], ['El asfalto enfría el aire de noche'], 'Por eso las olas de calor pesan tanto en las ciudades: no hay descanso nocturno.', { d: 2 }),
      teoria('Quiénes sufren más', [
        'El calor extremo es un riesgo para la salud: puede causar golpes de calor y empeorar enfermedades del corazón y los pulmones. Afecta más a personas mayores, bebés, personas con enfermedades crónicas, trabajadores al aire libre y a quienes viven en viviendas precarias sin ventilación ni aire acondicionado.',
        'Muchas veces los barrios con menos árboles son los barrios de menores ingresos: la isla de calor también es desigual.',
      ]),
      clas('¿Esta persona es más vulnerable al calor extremo?', { // e3
        'Más vulnerable': ['Un abuelo que vive solo en un departamento sin ventilación', 'Un bebé', 'Un repartidor que trabaja al sol'],
        'Menos vulnerable': ['Un adulto sano en una casa ventilada con árboles alrededor', 'Una joven sana que trabaja en una oficina fresca'],
      }, 'La vulnerabilidad depende de la edad, la salud, el trabajo y la vivienda.', { d: 1 }),
      vf('La isla de calor afecta a todos los barrios de una ciudad por igual.', false, 'Los barrios con menos árboles y más cemento suelen ser más calurosos, y muchas veces coinciden con los de menores ingresos.', { // e4
        razones: ['+Porque los barrios con menos verde suelen ser más calurosos', '-Porque la temperatura es igual en toda la ciudad', '-Porque el calor solo afecta a los barrios con árboles'],
        d: 2,
      }),
      teoria('Techos y pavimentos', [
        'Los colores oscuros absorben más sol y se calientan más. Un techo de membrana negra puede superar los 70 °C en un día de verano, mientras que uno blanco o claro se mantiene mucho más fresco. Pintar techos de blanco y usar pavimentos claros o permeables ayuda a bajar la temperatura de las casas y de la ciudad.',
      ]),
      rank('Ordená estas superficies por cuánto se calientan al sol de verano, de más a menos.', [ // e5
        ['Techo de membrana negra', 'muy caliente'],
        ['Asfalto', 'caliente'],
        ['Techo pintado de blanco', 'mucho menos'],
        ['Pasto a la sombra de un árbol', 'la más fresca'],
      ], 'Color, material y sombra deciden cuánto calor absorbe una superficie.', { d: 2 }),
      op('En un barrio muy caluroso, ¿qué medida ayuda rápido a bajar la temperatura dentro de las casas?', [ // e6
        'Pintar los techos de blanco',
        'Pintar los techos de negro',
        ['Sacar los árboles para que corra más aire', 'Los árboles dan sombra y refrescan: sacarlos empeora el calor.'],
        'Asfaltar los patios de tierra',
      ], 'Un techo claro refleja el sol y puede bajar varios grados la temperatura interior.', { d: 1 }),
      numv(3, (i) => { // e7
        const c = [26, 28, 25][i];
        const d = [4, 3, 5][i];
        return {
          enunciado: `Una noche de verano, el campo cercano llega a ${c} °C y el centro de la ciudad está ${d} °C más caliente. ¿Qué temperatura hay en el centro?`,
          valor: c + d,
          unidad: '°C',
          explicacion: `${c} + ${d} = ${c + d} °C. Unos grados de más de noche impiden que el cuerpo descanse y aumentan los riesgos para la salud.`,
        };
      }, { d: 1 }),
      det('Leé este comentario y marcá lo equivocado.', [ // e8
        ['Las ciudades suelen ser más calurosas que el campo.', false],
        ['La isla de calor desaparece de noche.', true, 'Suele ser más intensa de noche, cuando el cemento libera el calor acumulado.'],
        ['Los techos claros se calientan menos que los oscuros.', false],
        ['El calor extremo solo es molesto, no afecta la salud.', true, 'Puede causar golpes de calor y agravar enfermedades.'],
      ], 'El calor urbano es un tema de salud pública.', { d: 2 }),
      comp('Completá.', 'Las ciudades suelen ser más calurosas que el campo por la isla de [calor]; el efecto es mayor de [noche]; y los techos [claros] ayudan a reducirlo.', ['humo', 'mañana', 'oscuros'], 'La isla de calor, resumida en una sola línea.', { d: 1 }),
      par('Uní cada causa de la isla de calor con una solución.', [ // e10
        ['Techos oscuros', 'Pintarlos de blanco o hacer techos verdes'],
        ['Falta de sombra', 'Plantar árboles en veredas y plazas'],
        ['Suelos sellados', 'Pavimentos permeables y canteros'],
        ['Calor de motores', 'Menos autos y más transporte público'],
      ], 'Cada causa tiene su respuesta: sombra, color, suelo y movilidad.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Qué hacen los árboles por la ciudad', 'Sombra, frescura, agua, aire, ruido, biodiversidad y salud mental: el trabajo del arbolado.', [
      teoria('Sombra y frescura', [
        'Un árbol refresca de dos formas: su copa da sombra, y con la transpiración evapora agua, que se lleva calor del aire. Según la Agencia de Protección Ambiental de Estados Unidos, las superficies a la sombra pueden estar entre 10 y 25 °C más frescas que las expuestas al sol, y la transpiración puede bajar algunos grados la temperatura del aire.',
      ], { destacado: { valor: '10-25 °C', texto: 'más frescas pueden estar las superficies a la sombra que las expuestas al sol, según la EPA.' } }),
      cad('Armá la cadena de cómo un árbol refresca una cuadra.', [ // e1
        'El árbol da sombra sobre la vereda',
        'El suelo y las paredes absorben menos sol',
        'Además, transpira agua por sus hojas',
        'La evaporación se lleva calor del aire',
        'La cuadra está más fresca',
      ], ['El árbol genera aire acondicionado eléctrico'], 'Sombra más evaporación: el aire acondicionado natural de la ciudad.', { d: 1 }),
      teoria('Agua, aire y ruido', [
        'Las copas interceptan parte de la lluvia y las raíces ayudan a que el agua se infiltre, lo que reduce la escorrentía y el riesgo de anegamientos, como viste en la rama de Agua. Las hojas retienen polvo y partículas del aire. Y la vegetación densa puede amortiguar algo el ruido.',
        'Los árboles también son hábitat de aves e insectos, y conectan plazas y reservas como corredores de biodiversidad.',
      ]),
      par('Uní cada servicio del arbolado con cómo lo hace.', [ // e2
        ['Refrescar', 'Sombra y transpiración'],
        ['Reducir anegamientos', 'Interceptar lluvia y ayudar a infiltrar'],
        ['Mejorar el aire', 'Retener polvo y partículas en las hojas'],
        ['Sostener biodiversidad', 'Dar refugio y alimento a aves e insectos'],
      ], 'Un árbol de vereda hace muchos trabajos a la vez.', { d: 2 }),
      teoria('Salud y bienestar', [
        'La Organización Mundial de la Salud reconoce que los espacios verdes urbanos tienen beneficios para la salud: promueven la actividad física, reducen el estrés, mejoran la salud mental, favorecen el encuentro social y mitigan el calor. Vivir cerca de plazas y parques se asocia con mejor bienestar.',
      ]),
      mult('¿Qué beneficios para la salud tienen los espacios verdes, según la OMS? Marcá todos.', [ // e3
        '+Promueven la actividad física',
        '+Reducen el estrés',
        '+Favorecen el encuentro social',
        '+Mitigan el calor',
        '-Curan cualquier enfermedad',
      ], 'Muchos beneficios comprobados, sin ser un remedio mágico.', { d: 1 }),
      vf('Un árbol de vereda solo sirve para decorar.', false, 'Da sombra, refresca, reduce anegamientos, retiene partículas, alberga fauna y mejora el bienestar. Es infraestructura verde.', { // e4
        razones: ['+Porque presta muchos servicios: es infraestructura verde', '-Porque los árboles no hacen fotosíntesis en la ciudad', '-Porque los árboles calientan las veredas'],
        d: 1,
      }),
      numv(3, (i) => { // e5
        const sol = [55, 60, 50][i];
        const baja = [20, 25, 15][i];
        return {
          enunciado: `Una vereda al sol llega a ${sol} °C. Si la sombra de un árbol la deja ${baja} °C más fresca, ¿qué temperatura tiene a la sombra?`,
          valor: sol - baja,
          unidad: '°C',
          explicacion: `${sol} − ${baja} = ${sol - baja} °C. Por eso la gente busca instintivamente la vereda con árboles.`,
        };
      }, { d: 1 }),
      clas('¿Este beneficio del arbolado es ambiental o social?', { // e6
        'Ambiental': ['Guardar carbono', 'Dar hábitat a las aves', 'Ayudar a infiltrar la lluvia'],
        'Social': ['Invitar a caminar', 'Lugar de encuentro en la plaza', 'Reducir el estrés'],
      }, 'El verde urbano cuida el ambiente y a las personas al mismo tiempo.', { d: 1 }),
      op('En una ola de calor, ¿qué cuadra es probablemente más fresca a la tarde?', [ // e7
        'La que tiene árboles grandes en las dos veredas',
        'La que tiene el asfalto recién hecho',
        ['La que tiene más autos estacionados', 'Los autos al sol se calientan y suman calor.'],
        'La que tiene veredas de cemento sin árboles',
      ], 'Árboles grandes y sanos: la mejor defensa de una cuadra contra el calor.', { d: 1 }),
      rank('Ordená estos espacios por cuánto refrescan en un día de calor, de más a menos.', [ // e8
        ['Parque con árboles grandes y césped', 'mucho'],
        ['Vereda con árboles adultos', 'bastante'],
        ['Plaza seca con pocos árboles jóvenes', 'poco'],
        ['Estacionamiento de asfalto', 'nada: suma calor'],
      ], 'El tamaño de las copas y la cantidad de verde hacen la diferencia.', { d: 2, extremos: ['Más', 'Menos'] }),
      det('Leé esta opinión en un grupo vecinal y marcá lo equivocado.', [ // e9
        ['Los árboles dan sombra y refrescan la cuadra.', false],
        ['Los árboles ensucian y no sirven para nada.', true, 'Las hojas se pueden compostar; y los árboles prestan muchos servicios.'],
        ['Las copas interceptan parte de la lluvia.', false],
        ['Sacar los árboles hace que la cuadra sea más fresca porque corre más aire.', true, 'Sin sombra ni transpiración, la cuadra se calienta más.'],
      ], 'Los árboles tienen costos de mantenimiento, pero sus beneficios son mucho mayores.', { d: 2 }),
      comp('Completá.', 'Un árbol refresca con la [sombra] y la [transpiración]; y según la OMS, los espacios verdes reducen el [estrés].', ['lluvia', 'raíz', 'tránsito'], 'Cómo trabajan los árboles por la ciudad, en una línea.', { d: 1 }),
      est('Estimá cuántos grados más fresca puede estar una superficie a la sombra que una al sol, según la EPA.', 18, { min: 0, max: 40, paso: 1, unidad: '°C' }, 'Entre 10 y 25 °C. Una diferencia enorme que se siente al caminar.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('El árbol correcto en el lugar correcto', 'Tamaño adulto, raíces, cables, veredas, especies nativas y la cazuela: cómo elegir.', [
      teoria('Pensar en el árbol adulto', [
        'El error más común al plantar en la ciudad es pensar en el árbol chico y no en cómo va a ser de adulto. Un árbol que llega a 20 metros de alto y 15 de copa no entra en una vereda angosta con cables: terminará mutilado por las podas o levantando la vereda.',
        'Por eso se elige la especie según el espacio disponible: ancho de vereda, altura de cables, distancia a la casa y tamaño de la cazuela, el hueco de tierra donde se planta.',
      ]),
      clas('¿Qué tamaño de árbol conviene para cada lugar?', { // e1
        'Árbol grande (más de 15 m)': ['Plaza amplia', 'Parque', 'Avenida ancha sin cables'],
        'Árbol chico o mediano': ['Vereda angosta con cables', 'Patio chico', 'Cantero de un edificio'],
      }, 'Cada espacio tiene su tamaño de árbol. Así se evitan podas drásticas y veredas rotas.', { d: 1 }),
      teoria('Raíces y cazuelas', [
        'Las raíces necesitan espacio, aire y agua. En una cazuela diminuta rodeada de cemento, el árbol sufre y sus raíces buscan salir, a veces levantando baldosas. Cazuelas más grandes o canteros corridos, con suelo suelto, hacen árboles más sanos y veredas más enteras.',
      ]),
      cad('Armá la cadena de por qué una cazuela chica termina rompiendo la vereda.', [ // e2
        'Se planta un árbol en una cazuela muy chica',
        'Las raíces no tienen espacio, aire ni agua suficientes',
        'Crecen cerca de la superficie buscando agua y aire',
        'Levantan las baldosas',
        'Se culpa al árbol y se lo quiere sacar',
      ], ['El árbol levanta la vereda a propósito'], 'Muchas veces el problema no es el árbol, sino el espacio que se le dio.', { d: 2 }),
      teoria('Nativas y diversidad', [
        'Como viste en la rama, las especies nativas de la ecorregión alimentan mejor a la fauna local y suelen adaptarse bien al clima. En el arbolado urbano también importa la diversidad: si todas las calles tienen la misma especie, una plaga o enfermedad puede afectar a miles de árboles a la vez.',
        'Las especies invasoras, como el ligustro, no conviene plantarlas.',
      ]),
      vf('Es buena idea plantar la misma especie en todas las calles de una ciudad.', false, 'Si llega una plaga o una enfermedad que afecta a esa especie, se pueden perder miles de árboles a la vez. La diversidad es un seguro.', { // e3
        razones: ['+Porque una plaga podría afectar a todos a la vez', '-Porque todas las especies son iguales', '-Porque la diversidad aumenta las plagas'],
        d: 2,
      }),
      par('Uní cada condición del lugar con la elección adecuada.', [ // e4
        ['Vereda angosta con cables', 'Especie de porte chico'],
        ['Plaza grande', 'Especie de porte grande y copa amplia'],
        ['Zona seca', 'Especie adaptada a poca agua'],
        ['Barrio con una sola especie', 'Sumar especies distintas'],
      ], 'Elegir es mirar el lugar antes que la especie.', { d: 2 }),
      mult('¿Qué conviene tener en cuenta al elegir un árbol para una vereda? Marcá todo.', [ // e5
        '+Su tamaño adulto',
        '+El ancho de la vereda y los cables',
        '+Que no sea invasor',
        '+La diversidad de especies de la cuadra',
        '-Que crezca lo más rápido posible sin importar el tamaño final',
      ], 'Pensar en décadas de vida del árbol, no en el primer año.', { d: 1 }),
      numv(3, (i) => { // e6
        const ancho = [2.5, 3, 4][i];
        const minc = 1;
        return {
          enunciado: `Una vereda mide ${ancho.toLocaleString('es-AR')} m de ancho y hay que dejar al menos 1,5 m libres para caminar. ¿Cuántos metros de ancho quedan como máximo para la cazuela o el cantero?`,
          valor: Math.round((ancho - 1.5) * 10) / 10,
          unidad: 'metros',
          dec: 1,
          explicacion: `${ancho.toLocaleString('es-AR')} − 1,5 = ${(Math.round((ancho - 1.5) * 10) / 10).toLocaleString('es-AR')} m. Con menos de ${minc} m de cazuela, conviene un árbol chico o un cantero corrido.`,
        };
      }, { d: 2 }),
      op('En una vereda angosta con cables, un vecino quiere plantar un timbó. ¿Qué le aconsejarías?', [ // e7
        'Elegir una especie nativa de porte chico',
        'Plantarlo igual y podarlo fuerte cada año',
        ['Plantar un eucalipto, que crece más rápido', 'Es enorme y exótico: no apto para una vereda angosta.'],
        'No plantar ningún árbol en toda la cuadra',
      ], 'El timbó es magnífico en una plaza grande. En una vereda angosta, mejor una nativa chica.', { d: 2 }),
      rank('Ordená estas cazuelas de la peor a la mejor para la salud de un árbol.', [ // e8
        ['Cazuela de 40 × 40 cm rodeada de cemento', 'la peor'],
        ['Cazuela de 80 × 80 cm', 'regular'],
        ['Cazuela de 1 × 2 m con suelo suelto', 'buena'],
        ['Cantero corrido a lo largo de la vereda', 'la mejor'],
      ], 'Más suelo vivo alrededor, más árbol sano y menos veredas rotas.', { d: 2, extremos: ['Peor', 'Mejor'] }),
      det('Leé este plan de arbolado y marcá lo que no conviene.', [ // e9
        ['Elegiremos especies según el ancho de cada vereda.', false],
        ['Plantaremos ligustro porque crece rápido.', true, 'Es una especie invasora: no conviene plantarla.'],
        ['Sumaremos varias especies nativas en cada barrio.', false],
        ['Haremos cazuelas de 30 × 30 cm para no ocupar vereda.', true, 'Son demasiado chicas: el árbol sufre y termina levantando la vereda.'],
      ], 'Buenas intenciones, mejores con criterio técnico.', { d: 2 }),
      comp('Completá.', 'Al plantar hay que pensar en el tamaño [adulto]; el hueco de tierra donde se planta es la [cazuela]; y la [diversidad] de especies protege de plagas.', ['inicial', 'maceta', 'uniformidad'], 'Tres criterios para elegir árboles urbanos.', { d: 1 }),
      est('Estimá cuántos metros de ancho libre conviene dejar en una vereda para caminar cómodo, incluso con silla de ruedas.', 1.5, { min: 0.5, max: 5, paso: 0.1, unidad: 'metros' }, 'Alrededor de 1,5 metros. Árboles y peatones tienen que convivir en la vereda.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Cuidar el arbolado', 'Riego inicial, poda correcta, el desmoche que mata árboles y cómo reclamar.', [
      teoria('Los primeros años', [
        'Un árbol recién plantado necesita riego regular durante los primeros dos o tres años, sobre todo en verano, hasta que sus raíces se establecen. Un tutor lo sostiene mientras el tronco se afirma, y una protección evita golpes. Muchos árboles jóvenes mueren por falta de riego o por daños en ese período.',
      ]),
      ord('Ordená los cuidados de un árbol recién plantado.', [ // e1
        'Plantarlo en una cazuela amplia con buena tierra',
        'Colocar un tutor y una protección',
        'Regarlo seguido los primeros años, sobre todo en verano',
        'Retirar el tutor cuando el tronco se afirma',
        'Controlar su salud y podar solo si hace falta',
      ], 'Los primeros años deciden si el árbol llega a adulto.', { d: 1, extremos: ['Primero', 'Último'] }),
      teoria('Podar bien', [
        'Una buena poda es mínima y tiene un motivo: sacar ramas secas, enfermas o peligrosas, o despejar un cartel o un cable. Se corta en el lugar correcto, cerca del tronco o de otra rama, sin dejar tocones.',
        'El desmoche —cortar todas las ramas principales dejando "muñones"— es una de las peores prácticas: debilita al árbol, lo expone a hongos y plagas, hace que rebrote con ramas débiles y peligrosas, y le quita sombra por años.',
      ]),
      clas('¿Es una poda correcta o un desmoche dañino?', { // e2
        'Poda correcta': ['Sacar una rama seca', 'Despejar una rama que toca un cable', 'Cortar una rama enferma cerca del tronco'],
        'Desmoche': ['Cortar todas las ramas principales dejando muñones', 'Dejar solo el tronco "para que rebrote"', 'Podar todo el árbol cada año por costumbre'],
      }, 'Podar poco y con motivo. El desmoche no "renueva" el árbol: lo enferma.', { d: 2 }),
      cad('Armá la cadena de por qué el desmoche es peligroso.', [ // e3
        'Se cortan todas las ramas grandes',
        'Quedan heridas grandes por donde entran hongos',
        'El árbol rebrota con muchas ramas débiles',
        'Esas ramas se quiebran con el viento',
        'El árbol queda enfermo y más peligroso que antes',
      ], ['El árbol queda más fuerte y seguro'], 'Una práctica que se hace "por seguridad" termina generando más riesgo.', { d: 2 }),
      vf('Podar mucho un árbol todos los años lo hace más sano y fuerte.', false, 'Las podas excesivas debilitan al árbol, le quitan hojas para hacer fotosíntesis y abren heridas a enfermedades. Lo mejor es podar poco y solo con motivo.', { // e4
        razones: ['+Porque le quita hojas y abre heridas a enfermedades', '-Porque los árboles necesitan perder todas sus ramas', '-Porque la poda no afecta al árbol'],
        d: 2,
      }),
      teoria('Quién cuida el arbolado', [
        'En muchas ciudades, el arbolado de las veredas es público y su cuidado corresponde al municipio: plantar, podar, extraer árboles peligrosos y reponer los que faltan. Los vecinos pueden ayudar regando, cuidando la cazuela y reclamando cuando un árbol está enfermo o hace falta plantar. Muchas ciudades prohíben que los vecinos poden o saquen árboles de la vereda sin autorización.',
      ]),
      mult('¿Cómo pueden ayudar los vecinos al arbolado? Marcá todo.', [ // e5
        '+Regar los árboles jóvenes en verano',
        '+Mantener la cazuela sin basura',
        '+Reclamar al municipio cuando falta un árbol',
        '+Avisar si un árbol tiene ramas peligrosas',
        '-Desmochar el árbol de su vereda sin permiso',
      ], 'Cuidar y reclamar, sí. Podar o sacar sin autorización, no.', { d: 1 }),
      numv(3, (i) => { // e6
        const l = [20, 30, 40][i];
        const sem = [2, 1, 2][i];
        const meses = [4, 5, 3][i];
        return {
          enunciado: `Un árbol joven necesita ${l} litros de agua ${sem === 1 ? 'una vez' : `${sem} veces`} por semana durante ${meses} meses de verano (4 semanas por mes). ¿Cuántos litros necesita en total?`,
          valor: l * sem * meses * 4,
          unidad: 'litros',
          explicacion: `${l} × ${sem} × ${meses} × 4 = ${(l * sem * meses * 4).toLocaleString('es-AR')} litros. Unos baldes por semana pueden salvar a un árbol que dará sombra por décadas.`,
        };
      }, { d: 2 }),
      op('El árbol de tu vereda tiene una rama grande seca que cuelga sobre la calle. ¿Qué conviene hacer?', [ // e7
        'Avisar al municipio para que la retiren',
        'Cortar vos todas las ramas del árbol',
        ['Esperar a que se caiga sola', 'Una rama grande seca es un riesgo: conviene avisar pronto.'],
        'Sacar el árbol entero',
      ], 'Una rama peligrosa se retira de forma segura, sin castigar al árbol entero.', { d: 1 }),
      par('Uní cada problema con su solución.', [ // e8
        ['Árbol joven marchito en enero', 'Riego regular'],
        ['Rama seca sobre la calle', 'Aviso al municipio para retirarla'],
        ['Cazuela llena de basura', 'Limpiarla y dejar suelo suelto'],
        ['Vereda sin árbol', 'Pedir una reposición'],
      ], 'Muchos problemas del arbolado se resuelven con cuidado y un buen reclamo.', { d: 1 }),
      det('Leé este consejo de un grupo vecinal y marcá lo equivocado.', [ // e9
        ['Regá los árboles jóvenes en verano.', false],
        ['Podá todo el árbol cada otoño para que no tenga tantas hojas.', true, 'Las podas excesivas debilitan al árbol.'],
        ['Si ves una rama peligrosa, avisá al municipio.', false],
        ['El desmoche hace que el árbol sea más seguro.', true, 'Lo vuelve más débil y peligroso.'],
      ], 'Cuidar el arbolado es sobre todo no dañarlo.', { d: 2 }),
      comp('Completá.', 'Un árbol joven necesita [riego] los primeros años; cortar todas sus ramas dejando muñones es un [desmoche]; y una buena poda es [mínima].', ['sombra', 'injerto', 'total'], 'Tres ideas clave para cuidar el arbolado de la ciudad.', { d: 1 }),
      est('Estimá durante cuántos años conviene regar regularmente un árbol recién plantado.', 3, { min: 0, max: 20, paso: 1, unidad: 'años' }, 'Unos dos o tres años, hasta que las raíces se establecen. Después, suele arreglarse solo con la lluvia.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Ciudades más verdes', 'Árboles, techos verdes, jardines de lluvia, plazas cercanas y corredores: el verde como infraestructura.', [
      teoria('Una regla para medir el verde', [
        'Especialistas en bosques urbanos propusieron una regla simple: cada persona debería poder ver al menos 3 árboles desde su casa, cada barrio debería tener al menos un 30 % de su superficie cubierta por copas de árboles, y cada persona debería vivir a no más de 300 metros de un parque o plaza. Se la conoce como la regla 3-30-300.',
      ], { destacado: { valor: '3-30-300', texto: '3 árboles a la vista, 30 % de copas en el barrio y una plaza a menos de 300 metros.' } }),
      par('Uní cada número de la regla 3-30-300 con su significado.', [ // e1
        ['3', 'Árboles visibles desde cada casa'],
        ['30', 'Porcentaje del barrio cubierto por copas'],
        ['300', 'Metros máximos hasta un parque o plaza'],
      ], 'Una regla fácil de recordar para evaluar el verde de un barrio.', { d: 1 }),
      numv(3, (i) => { // e2
        const ha = [100, 80, 50][i];
        const cop = [12, 20, 8][i];
        return {
          enunciado: `Un barrio de ${ha} hectáreas tiene ${cop} hectáreas cubiertas por copas de árboles. ¿Qué porcentaje de cobertura tiene? ¿Cumple el 30 %?`,
          valor: (cop / ha) * 100,
          unidad: '%',
          explicacion: `${cop} ÷ ${ha} × 100 = ${(cop / ha) * 100} %. ${(cop / ha) * 100 >= 30 ? 'Cumple la meta del 30 %.' : 'No llega al 30 %: le falta verde.'}`,
        };
      }, { d: 2 }),
      teoria('Más allá de los árboles', [
        'Hay otras formas de sumar verde: techos verdes, con plantas sobre las cubiertas, que aíslan del calor y retienen lluvia; jardines de lluvia, canteros más bajos que reciben el agua de techos y veredas; muros verdes; y huertas comunitarias. Todas suman sombra, frescura, infiltración y biodiversidad.',
      ]),
      clas('¿Esta infraestructura verde ayuda sobre todo con el calor o con la lluvia?', { // e3
        'Calor': ['Árboles en las veredas', 'Techo pintado de blanco con plantas', 'Muro verde en una fachada al sol'],
        'Lluvia': ['Jardín de lluvia en una esquina', 'Pavimento permeable en un estacionamiento', 'Cantero corrido que recibe el agua de la vereda'],
      }, 'Muchas soluciones ayudan con las dos cosas a la vez.', { d: 2 }),
      cad('Armá la cadena de cómo un jardín de lluvia reduce anegamientos.', [ // e4
        'Llueve fuerte en la ciudad',
        'El agua de techos y veredas se dirige a un cantero bajo',
        'El cantero con plantas y suelo suelto la retiene',
        'El agua se infiltra de a poco',
        'Llega menos agua de golpe a los desagües',
      ], ['El jardín de lluvia envía el agua al desagüe más rápido'], 'Una solución basada en la naturaleza que trabaja con el agua, como viste en la rama de Agua.', { d: 2 }),
      vf('Un techo verde puede ayudar a que una casa se caliente menos en verano.', true, 'Las plantas y la tierra aíslan y transpiran, y bajan la temperatura del techo y del interior. Además retienen parte de la lluvia.', { // e5
        razones: ['+Porque aíslan y refrescan con la transpiración', '-Porque las plantas calientan los techos', '-Porque los techos verdes no tienen plantas'],
        d: 1,
      }),
      teoria('Verde para todos', [
        'El verde urbano suele estar distribuido de forma desigual: hay barrios con plazas y arbolado abundante y otros casi sin árboles. Plantar donde más falta, sumar plazas en barrios densos y cuidar el arbolado existente son formas de justicia ambiental: el derecho a la sombra y a la naturaleza cerca de casa.',
      ]),
      op('Una ciudad tiene presupuesto para plantar 1.000 árboles. ¿Dónde conviene priorizar?', [ // e6
        'En los barrios más calurosos y con menos árboles',
        'En los barrios que ya tienen mucho arbolado',
        ['Donde se vean mejor para la foto', 'El impacto en salud y calor es mayor donde falta verde.'],
        'En la plaza principal, aunque ya esté llena',
      ], 'Donde falta verde, cada árbol hace más diferencia en salud y temperatura.', { d: 2 }),
      mult('¿Qué acciones suman verde a una ciudad? Marcá todas.', [ // e7
        '+Plantar árboles donde faltan',
        '+Techos verdes en edificios públicos',
        '+Jardines de lluvia en esquinas',
        '+Nuevas plazas en barrios densos',
        '-Asfaltar los canteros de las avenidas',
      ], 'Muchas herramientas que se combinan en un plan de verde urbano.', { d: 1 }),
      rank('Ordená estos barrios por su prioridad para recibir árboles, de más a menos.', [ // e8
        ['Barrio denso, caluroso y con 5 % de copas', 'la mayor'],
        ['Barrio con 15 % de copas y una plaza lejos', 'alta'],
        ['Barrio con 25 % de copas y plaza cerca', 'media'],
        ['Barrio con 40 % de copas y un parque', 'la menor'],
      ], 'Priorizar donde más falta es eficaz y es justo.', { d: 2, extremos: ['Más prioridad', 'Menos prioridad'] }),
      det('Leé este plan municipal y marcá lo que no conviene.', [ // e9
        ['Plantaremos primero en los barrios con menos arbolado.', false],
        ['Reemplazaremos la plaza de tierra por una plaza seca de cemento para que sea más fácil de limpiar.', true, 'Una plaza seca se calienta mucho y pierde los beneficios del verde.'],
        ['Haremos jardines de lluvia en las esquinas que se anegan.', false],
        ['Mediremos la cobertura de copas de cada barrio.', false],
      ], 'Un buen plan de verde urbano mide, prioriza y elige soluciones que trabajan con la naturaleza.', { d: 2 }),
      comp('Completá.', 'La regla [3-30-300] propone árboles a la vista, copas en el barrio y una plaza cerca; los jardines de [lluvia] ayudan a infiltrar agua; y priorizar donde falta verde es [justicia] ambiental.', ['1-10-100', 'sol', 'estética'], 'Tres ideas para diseñar ciudades más verdes y más justas.', { d: 2 }),
      est('Estimá a cuántos metros de distancia máxima debería tener cada persona una plaza o parque, según la regla 3-30-300.', 300, { min: 50, max: 3000, paso: 50, unidad: 'metros' }, '300 metros: unas tres cuadras, una distancia caminable en pocos minutos.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: verde urbano', 'Isla de calor, servicios del arbolado, elección de especies, cuidados y ciudades verdes, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: la cuadra más caliente', 'Una cuadra de un barrio denso es la más calurosa de la ciudad según un mapa satelital. Armá con los vecinos el plan para refrescarla.', [
      teoria('La cuadra', [
        'La cuadra tiene 100 metros de largo y veredas de 3 metros a cada lado, con cables de un solo lado. Hay 2 árboles en toda la cuadra. Las casas tienen techos de membrana negra. En una ola de calor, la superficie de la vereda al sol llegó a 58 °C y la temperatura nocturna no bajó de 29 °C.',
        'El municipio ofrece plantar árboles nativos, y los vecinos pueden pintar techos. La esquina se anega con cada tormenta.',
      ]),
      num('Si se planta un árbol cada 8 metros en cada vereda, ¿cuántos árboles entran en las dos veredas de la cuadra? (100 ÷ 8, redondeado hacia abajo, por 2)', 24, 'árboles', '100 ÷ 8 = 12,5, o sea 12 por vereda; × 2 = 24 árboles, contra los 2 que hay hoy.', { ctx: 'Cuadra de 100 m; un árbol cada 8 m en cada una de las dos veredas.', d: 2 }),
      clas('¿Qué tamaño de árbol conviene en cada vereda?', { // e2
        'Porte chico o mediano': ['Vereda con cables', 'Patio chico de una casa de la cuadra'],
        'Porte mediano a grande': ['Vereda sin cables', 'Plaza de la esquina'],
      }, 'Cada vereda tiene su tamaño de árbol según los cables y el espacio.', { d: 2 }),
      num('Si la sombra baja 20 °C la temperatura de la vereda, ¿qué temperatura tendría a la sombra la vereda que llegó a 58 °C?', 38, '°C', '58 − 20 = 38 °C: una diferencia enorme para quien camina o espera el colectivo.', { ctx: 'Vereda al sol a 58 °C; la sombra la baja 20 °C.', d: 1 }),
      rank('Ordená las medidas por rapidez de efecto, de más rápida a más lenta.', [ // e4
        ['Pintar los techos de blanco', 'días'],
        ['Jardín de lluvia en la esquina', 'semanas'],
        ['Plantar 24 árboles nativos', 'años hasta dar mucha sombra'],
        ['Árboles adultos con copas amplias', 'una década o más'],
      ], 'Lo rápido alivia ya; los árboles son la inversión que más rinde a largo plazo.', { d: 3, extremos: ['Más rápida', 'Más lenta'] }),
      mult('¿Qué debería incluir el plan de la cuadra? Marcá todo.', [ // e5
        '+Árboles nativos del tamaño adecuado para cada vereda',
        '+Cazuelas amplias o canteros corridos',
        '+Techos claros',
        '+Un jardín de lluvia en la esquina que se anega',
        '-Asfaltar las cazuelas para que no junten basura',
      ], 'Sombra, techos claros, suelo vivo y manejo del agua: todo lo de la unidad en una cuadra.', { d: 3 }),
      op('¿Qué hace falta para que los 24 árboles lleguen a adultos?', [ // e6
        'Riego regular los primeros años y cuidado vecinal',
        'Podarlos fuerte todos los años',
        ['Nada: una vez plantados, crecen solos', 'Los primeros años son críticos: sin riego, muchos mueren.'],
        'Plantarlos en cazuelas mínimas para no molestar',
      ], 'Plantar es el comienzo; regar y cuidar los primeros años es lo que asegura la sombra futura.', { d: 3 }),
      det('Los vecinos escriben su plan. Marcá lo que no conviene.', [ // e7
        ['Pediremos 24 árboles nativos y cazuelas amplias.', false],
        ['Del lado de los cables plantaremos árboles de porte grande.', true, 'Del lado de los cables conviene porte chico o mediano.'],
        ['Organizaremos turnos de riego en verano.', false],
        ['Cuando crezcan, los desmocharemos para que no den tanta sombra.', true, 'El desmoche los debilita; y la sombra es justamente el objetivo.'],
      ], 'Un buen plan de cuadra combina elección correcta, cuidado y paciencia.', { d: 3 }),
    ]),
  ],
});
