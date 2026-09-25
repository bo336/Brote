import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// ANIMALES 2 — Vecinos silvestres.
// La fauna que convive con nosotros: quién vive en la ciudad, cómo convivir
// sin dañarla, qué impacto tienen las mascotas, por qué nunca se libera un
// animal exótico, cómo funciona el tráfico de fauna y cómo hacer una ciudad
// más amigable. Retoma las redes tróficas (animales-1) y lo tuyo y lo de
// todos (tronco-3).

export default unidad({
  slug: 'animales-2',
  rama: 'animales',
  orden: 2,
  nivel: 1,
  requiereTronco: 1,
  titulo: 'Vecinos silvestres',
  bajada: 'Horneros, comadrejas, murciélagos y carpinchos: cómo convivir con la fauna de la ciudad, qué hacer si encontrás un animal y cómo cuidar a las mascotas sin dañar a nadie.',
  objetivos: [
    'Reconocer especies silvestres nativas y exóticas de las ciudades argentinas',
    'Aplicar pautas de convivencia y actuar bien ante un animal silvestre',
    'Evaluar el impacto de perros y gatos sobre la fauna',
    'Explicar por qué no se liberan mascotas exóticas y qué es el tráfico de fauna',
    'Proponer medidas para ciudades más amigables con la fauna',
  ],
  repasa: ['animales-1', 'tronco-3'],
  fuentes: ['protocolo-fauna-cba', 'red-centros-rescate', 'crfs-ecoparque', 'gcba-cinco-libertades', 'ley-22421-fauna', 'cites', 'conicet-carpinchos', 'loss-2013-gatos', 'loss-2014-vidrios', 'invasoras-mayds', 'aves-argentinas'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Quién vive en la ciudad', 'Aves, mamíferos, reptiles e insectos que comparten el barrio con nosotros, nativos y exóticos.', [
      teoria('Una ciudad llena de vida', [
        'Las ciudades no son solo cemento: en plazas, jardines, terrenos baldíos, arroyos y hasta balcones viven muchas especies. En las ciudades argentinas son comunes aves nativas como el hornero —el ave nacional—, el benteveo, el zorzal colorado, la calandria, el chingolo, el tero y la paloma picazuró.',
        'También hay mamíferos nativos que pasan desapercibidos, como la comadreja overa, un marsupial nocturno, y muchas especies de murciélagos. Y lagartijas, sapos, mariposas, abejas nativas y cientos de insectos.',
      ]),
      mult('¿Cuáles de estos animales son nativos y comunes en ciudades argentinas? Marcá todos.', [ // e1
        '+Hornero',
        '+Benteveo',
        '+Comadreja overa',
        '+Zorzal colorado',
        '-Canguro',
      ], 'Mucha fauna nativa vive entre nosotros. El canguro, claro, es de Australia.', { d: 1 }),
      teoria('Los que llegaron con nosotros', [
        'Otras especies urbanas son exóticas, traídas por personas. El gorrión llegó de Europa en el siglo XIX; la paloma doméstica, también. El estornino pinto, un ave europea, se liberó en Buenos Aires hacia fines de los años ochenta y se expandió por buena parte del país, compitiendo con aves nativas por los huecos donde anidan.',
        'Las ratas y los ratones domésticos también son exóticos y viajaron con las personas en barcos.',
      ]),
      clas('¿Es nativa de Argentina o exótica?', { // e2
        'Nativa': ['Hornero', 'Paloma picazuró', 'Tero', 'Comadreja overa'],
        'Exótica': ['Gorrión', 'Paloma doméstica', 'Estornino pinto', 'Rata parda'],
      }, 'Que un animal sea común en la ciudad no dice si es nativo. Varias de las especies más vistas vinieron con las personas.', { d: 2 }),
      vf('La comadreja overa es un animal peligroso que conviene eliminar de los jardines.', false, 'Es un marsupial nativo, tímido, que come insectos, caracoles, frutos y hasta ratones. Ayuda a controlar plagas. Si se siente amenazada, se hace la muerta.', { // e3
        razones: ['+Porque es un marsupial nativo que ayuda a controlar plagas', '-Porque la comadreja es una rata grande', '-Porque la comadreja ataca a las personas para comer'],
        d: 2,
      }),
      teoria('Ciudades sobre humedales', [
        'Muchas ciudades crecen sobre ambientes naturales, como humedales. Cuando en 2021 los carpinchos se hicieron famosos en un barrio cerrado del norte del conurbano, especialistas del CONICET recordaron que ese barrio se construyó sobre el humedal donde los carpinchos vivían desde siempre: no eran ellos los invasores.',
        'La convivencia con fauna silvestre en la ciudad es, muchas veces, la consecuencia de haber ocupado su ambiente.',
      ]),
      cad('Armá la cadena de por qué aparecieron tantos carpinchos en un barrio nuevo.', [ // e4
        'Se construye un barrio sobre un humedal',
        'Los carpinchos pierden gran parte de su hábitat',
        'Quedan lagunas y céspedes con agua y pasto',
        'Los carpinchos siguen viviendo en lo que queda',
        'Aparecen conflictos con los vecinos',
      ], ['Los carpinchos llegaron desde otro país'], 'Los carpinchos no invadieron el barrio: el barrio se construyó en su casa.', { d: 2 }),
      par('Uní cada animal urbano con algo que lo caracteriza.', [ // e5
        ['Hornero', 'Construye su nido de barro'],
        ['Tero', 'Grita fuerte cuando alguien se acerca a su nido'],
        ['Murciélago', 'Caza insectos de noche'],
        ['Comadreja overa', 'Lleva a sus crías en una bolsa'],
      ], 'Conocer a los vecinos ayuda a entenderlos y a no temerles.', { d: 2 }),
      op('¿Por qué el estornino pinto es un problema para aves nativas?', [ // e6
        'Porque compite con ellas por los huecos para anidar',
        'Porque se come todas las semillas de los árboles',
        ['Porque ataca a las personas en las plazas', 'No es peligroso para las personas: el problema es su competencia con aves nativas.'],
        'Porque destruye los nidos de hornero con el pico',
      ], 'Muchas aves nativas anidan en huecos. Un competidor exótico abundante les quita lugar.', { d: 2 }),
      det('Leé este comentario vecinal y marcá lo equivocado.', [ // e7
        ['El hornero es el ave nacional.', false],
        ['Los gorriones son aves nativas de la pampa.', true, 'Son exóticos: llegaron de Europa en el siglo XIX.'],
        ['En la ciudad viven murciélagos.', false],
        ['Los carpinchos invadieron el barrio desde afuera.', true, 'El barrio se construyó sobre el humedal donde ya vivían.'],
      ], 'Saber quién es quién cambia cómo miramos los conflictos con la fauna.', { d: 2 }),
      vf('La cotorra, tan común en las ciudades, es una especie exótica en Argentina.', false, 'Es nativa de Argentina y la región. Se volvió muy abundante en ciudades y cultivos, y en otros países, como España, sí es una invasora.', {
        razones: ['+Porque es nativa de la región, aunque sea invasora en otros países', '-Porque llegó de Europa con los barcos', '-Porque es un ave de Australia'],
        d: 3,
      }),
      mult('¿En qué lugares de una ciudad puede vivir fauna silvestre? Marcá todos.', [
        '+Plazas con árboles',
        '+Arroyos y sus orillas',
        '+Balcones con plantas',
        '+Terrenos baldíos con vegetación',
        '-Solo en zoológicos',
      ], 'La fauna urbana aprovecha cualquier rincón con agua, refugio y comida.', { d: 1 }),
      comp('Completá.', 'El [hornero] es el ave nacional; el gorrión y la paloma doméstica son [exóticos]; y la comadreja overa es un [marsupial] nativo.', ['cóndor', 'nativos', 'roedor'], 'Tres vecinos del barrio, bien presentados.', { d: 1 }),
      rank('Ordená estos lugares de la ciudad según cuánta fauna silvestre suelen albergar, de más a menos.', [ // e10
        ['Reserva ecológica con humedal', 'mucha'],
        ['Plaza grande con árboles y arbustos nativos', 'bastante'],
        ['Vereda arbolada', 'poca'],
        ['Estacionamiento de cemento', 'casi nada'],
      ], 'Más hábitat natural, más fauna. Pero hasta una vereda con árboles hace una diferencia.', { d: 1, extremos: ['Más', 'Menos'] }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Convivir sin dañar', 'No alimentar, no capturar, no molestar, y qué hacer si encontrás un pichón o un animal herido.', [
      teoria('Las reglas básicas', [
        'Convivir con la fauna silvestre tiene reglas simples: no alimentarla (se vuelve dependiente, pierde el miedo y puede enfermar con comida humana), no capturarla ni tenerla como mascota, no molestarla en sus nidos o refugios y mantener a perros y gatos controlados.',
        'La fauna silvestre está protegida por ley: la Ley 22.421 de conservación de la fauna silvestre prohíbe cazarla, capturarla o comerciarla sin autorización.',
      ]),
      mult('¿Qué conviene hacer para convivir con la fauna silvestre? Marcá todo lo correcto.', [ // e1
        '+Observarla a distancia',
        '+No darle comida',
        '+Mantener a perros y gatos controlados',
        '+No tocar nidos ni crías',
        '-Llevarse un pichón a casa para criarlo',
      ], 'La fauna silvestre está mejor en libertad, sin depender de las personas.', { d: 1 }),
      teoria('Por qué no alimentar', [
        'Darles comida a animales silvestres parece un gesto amable, pero trae problemas: pierden el miedo a las personas y pueden volverse agresivos o terminar atropellados; se concentran muchos en un lugar y se contagian enfermedades; y la comida humana, como el pan, les hace mal.',
        'En varias ciudades, los carpinchos o los zorros alimentados por la gente terminaron en conflictos que los perjudicaron a ellos.',
      ]),
      cad('Armá la cadena de por qué alimentar a un zorro puede terminar mal para él.', [ // e2
        'Personas alimentan a un zorro en una ruta',
        'El zorro pierde el miedo y se acerca a los autos',
        'Espera comida al costado de la ruta',
        'Aumenta el riesgo de que lo atropellen',
      ], ['El zorro aprende a cruzar la ruta sin peligro'], 'Lo que parece amabilidad puede convertirse en una trampa. En parques nacionales, alimentar fauna está prohibido.', { d: 2 }),
      vf('Darles pan a los patos de una laguna es bueno para ellos.', false, 'El pan no les aporta lo que necesitan y puede enfermarlos; además, el pan que sobra se pudre en el agua. Mejor observarlos sin alimentar.', { // e3
        razones: ['+Porque el pan no es su alimento y puede enfermarlos', '-Porque los patos no comen nada', '-Porque el pan purifica el agua de la laguna'],
        d: 2,
      }),
      teoria('El pichón en el suelo', [
        'En primavera, es común encontrar un pichón de ave en el suelo. Muchas veces es un volantón: un pichón con plumas que está aprendiendo a volar y cuyos padres siguen cerca alimentándolo. En ese caso, lo mejor es dejarlo tranquilo, alejar a perros y gatos y observar de lejos.',
        'Si es un pichón sin plumas o casi sin plumas, que se cayó del nido, se puede intentar devolverlo al nido si se lo ve. Si está herido o en peligro, conviene comunicarse con un centro de rescate de fauna o la autoridad ambiental. Nunca hay que darle agua ni comida por la boca: puede ahogarse.',
      ]),
      ord('Ordená qué hacer si encontrás un pichón con plumas en el suelo.', [ // e4
        'Observar de lejos si los padres están cerca',
        'Alejar a perros y gatos',
        'Dejarlo en el lugar si no corre peligro',
        'Si está herido, contactar a un centro de rescate',
      ], 'La mayoría de los volantones no necesitan ayuda: sus padres los siguen cuidando.', { d: 2, extremos: ['Primero', 'Último'] }),
      clas('¿Qué conviene hacer en cada caso?', { // e5
        'Dejarlo donde está y observar': ['Pichón con plumas saltando en el pasto', 'Tero defendiendo su nido en un parque'],
        'Contactar a un centro de rescate o la autoridad': ['Lechuza con un ala rota', 'Tortuga atropellada en la ruta', 'Zorro enredado en un alambre'],
      }, 'Un animal sano en su ambiente no necesita rescate. Uno herido sí, pero con especialistas.', { d: 2 }),
      op('Encontraste un pichón sin plumas debajo de un árbol y ves el nido. ¿Qué hacés?', [ // e6
        'Intentar devolverlo al nido con cuidado',
        'Llevarlo a casa y darle leche con una jeringa',
        ['Darle agua por el pico para que se hidrate', 'Nunca se da agua ni comida por la boca: puede ahogarse.'],
        'Dejarlo al sol para que se caliente',
      ], 'Si el nido está a mano, devolverlo es lo mejor. Que lo toques no hace que los padres lo rechacen: esa es una creencia falsa.', { d: 3 }),
      vf('Si tocás un pichón, sus padres lo van a rechazar por el olor.', false, 'Es una creencia muy extendida pero falsa para la mayoría de las aves: no rechazan a sus crías por el olor humano. Se puede devolver un pichón al nido.', { // e7
        razones: ['+Porque la mayoría de las aves no rechaza a sus crías por el olor', '-Porque las aves no tienen crías', '-Porque los pichones no tienen olor'],
        d: 3,
      }),
      par('Uní cada situación con quién conviene contactar.', [ // e8
        ['Animal silvestre herido', 'Centro de rescate de fauna o autoridad ambiental'],
        ['Venta de aves silvestres en una feria', 'Autoridad de fauna para denunciar'],
        ['Serpiente dentro de una casa', 'Bomberos o la autoridad ambiental local'],
        ['Carpinchos en el barrio', 'Nadie: observarlos a distancia'],
      ], 'Saber a quién llamar evita que las personas actúen solas y dañen al animal o se lastimen.', { d: 2 }),
      det('Leé estos consejos de un grupo de vecinos y marcá los equivocados.', [ // e9
        ['Si encontrás un volantón, alejá al gato y observá.', false],
        ['Si encontrás un pichón, dale leche con una jeringa.', true, 'Nunca se da nada por la boca, y la leche les hace mal.'],
        ['No alimentes a los carpinchos.', false],
        ['Si ves una comadreja, espantala o matala porque es peligrosa.', true, 'Es un marsupial nativo inofensivo que ayuda a controlar plagas.'],
      ], 'La buena voluntad necesita buena información.', { d: 2 }),
      comp('Completá.', 'A la fauna silvestre no hay que [alimentarla] ni capturarla; la Ley [22.421] la protege; y ante un animal herido hay que llamar a un centro de [rescate].', ['fotografiarla', '25.675', 'compras'], 'Tres reglas para convivir con la fauna sin dañarla.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Mascotas y fauna', 'Gatos que cazan, perros sueltos y la tenencia responsable: cómo cuidar a las mascotas sin dañar a la fauna.', [
      teoria('Las cinco libertades', [
        'Tener una mascota es una responsabilidad. El bienestar animal se suele resumir en cinco libertades: que viva libre de hambre y sed; libre de incomodidad; libre de dolor, lesiones y enfermedades; libre para expresar su comportamiento normal; y libre de miedo y angustia.',
        'La tenencia responsable también incluye la vacunación, la castración para evitar camadas no deseadas y el control para que la mascota no dañe a otras personas ni a la fauna.',
      ]),
      mult('¿Cuáles de estas son parte de las cinco libertades del bienestar animal? Marcá todas.', [ // e1
        '+Libre de hambre y sed',
        '+Libre de dolor, lesiones y enfermedades',
        '+Libre para expresar su comportamiento normal',
        '+Libre de miedo y angustia',
        '-Libre de tener que ir al veterinario',
      ], 'Ir al veterinario es justamente parte de mantenerla libre de dolor y enfermedades.', { d: 1 }),
      teoria('Los gatos, cazadores', [
        'Los gatos domésticos son cazadores eficientes, aunque estén bien alimentados. Un estudio publicado en Nature Communications estimó que en Estados Unidos los gatos que andan sueltos matan entre 1.300 y 4.000 millones de aves por año, además de muchísimos pequeños mamíferos. En islas, los gatos contribuyeron a la extinción de varias especies.',
        'Tener el gato adentro, sobre todo al amanecer y al atardecer, o en un patio cerrado, reduce mucho su impacto sobre la fauna y también lo protege de accidentes y enfermedades.',
      ], { destacado: { valor: '1.300-4.000 millones', texto: 'de aves por año matarían los gatos sueltos en Estados Unidos, según un estudio de 2013.' } }),
      vf('Un gato bien alimentado no caza.', false, 'La caza es un instinto independiente del hambre. Un gato bien alimentado puede cazar aves y otros animales igual.', { // e2
        razones: ['+Porque cazar es un instinto que no depende del hambre', '-Porque los gatos solo comen alimento balanceado', '-Porque los gatos no pueden atrapar aves'],
        d: 2,
      }),
      numv(3, (i) => { // e3
        const gatos = [1000, 5000, 200][i];
        const presas = [10, 8, 15][i];
        return {
          enunciado: `En un barrio hay ${gatos.toLocaleString('es-AR')} gatos que salen a la calle y cada uno caza en promedio ${presas} aves por año. ¿Cuántas aves cazan en total por año?`,
          valor: gatos * presas,
          unidad: 'aves',
          explicacion: `${gatos.toLocaleString('es-AR')} × ${presas} = ${(gatos * presas).toLocaleString('es-AR')} aves por año. Poco por gato, mucho por barrio: la misma lógica del stand-by o de la basura.`,
        };
      }, { d: 2 }),
      cad('Armá la cadena de cómo un gato suelto afecta a las aves del barrio.', [ // e4
        'Un gato sale libremente al jardín y la plaza',
        'Caza pichones y aves adultas',
        'Menos aves llegan a reproducirse',
        'Baja la población de aves del barrio',
      ], ['El gato ahuyenta a las aves hacia lugares mejores'], 'Un efecto chico multiplicado por muchos gatos y muchos años.', { d: 2 }),
      teoria('Perros sueltos', [
        'Los perros sueltos o en jauría también afectan a la fauna: persiguen y matan aves que anidan en el suelo, como teros, ñandúes o pingüinos en la costa patagónica, atacan a ciervos, zorros o vizcachas, y transmiten enfermedades a animales silvestres.',
        'En áreas naturales, reservas y playas con fauna, los perros tienen que ir con correa, y en muchos parques nacionales no están permitidos.',
      ]),
      clas('¿Esta práctica protege a la fauna o la pone en riesgo?', { // e5
        'Protege a la fauna': ['Llevar al perro con correa en la reserva', 'Castrar a perros y gatos', 'Tener al gato adentro de noche'],
        'La pone en riesgo': ['Soltar al perro en una playa con colonia de aves', 'Abandonar camadas en un terreno baldío', 'Dejar comida para gatos en una plaza con aves'],
      }, 'La tenencia responsable cuida a la mascota y a la fauna al mismo tiempo.', { d: 2 }),
      op('¿Por qué la castración de perros y gatos ayuda a la fauna silvestre?', [ // e6
        'Porque evita camadas que terminan sueltas',
        'Porque los animales castrados no pueden correr',
        ['Porque los castrados dejan de tener instinto de caza', 'El instinto de caza puede seguir; lo que se evita es la sobrepoblación de animales sueltos.'],
        'Porque así se vuelven animales silvestres',
      ], 'Menos camadas no deseadas, menos animales abandonados y menos presión sobre la fauna.', { d: 2 }),
      par('Uní cada práctica de tenencia responsable con su beneficio.', [ // e7
        ['Vacunar', 'Evitar enfermedades que pueden pasar a la fauna'],
        ['Castrar', 'Evitar camadas no deseadas'],
        ['Correa en áreas naturales', 'Evitar persecuciones de fauna'],
        ['Gato adentro de noche', 'Reducir la caza de aves'],
      ], 'Cada práctica protege a la mascota, a las personas y a la fauna.', { d: 2 }),
      det('Leé este comentario y marcá lo equivocado.', [ // e8
        ['Los gatos pueden cazar aunque estén bien alimentados.', false],
        ['Los perros sueltos no molestan a la fauna porque son domésticos.', true, 'Los perros sueltos persiguen y matan fauna silvestre.'],
        ['Castrar evita camadas no deseadas.', false],
        ['Soltar al perro en una playa con aves es inofensivo.', true, 'Puede perseguir aves que anidan y destruir nidos.'],
      ], 'Querer a las mascotas incluye evitar que dañen a otros animales.', { d: 2 }),
      comp('Completá.', 'Los gatos cazan aunque estén bien [alimentados]; en reservas, los perros van con [correa]; y la [castración] evita camadas no deseadas.', ['vacunados', 'bozal', 'vacuna'], 'Tres ideas de tenencia responsable pensando en la fauna.', { d: 1 }),
      rank('Ordená estas medidas por cuánto reducen la caza de aves por parte de un gato, de más a menos.', [ // e10
        ['Tenerlo siempre adentro o en patio cerrado', 'casi la elimina'],
        ['Tenerlo adentro al amanecer, al atardecer y de noche', 'la reduce mucho'],
        ['Ponerle un collar con cascabel', 'la reduce algo'],
        ['Dejarlo salir cuando quiera', 'no la reduce'],
      ], 'Las horas de luz baja son las de mayor actividad de las aves y de caza del gato.', { d: 3 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Nunca liberar, nunca comprar', 'Tortugas de orejas rojas, peces de acuario y cardenales en jaulas: mascotas exóticas liberadas y tráfico de fauna.', [
      teoria('Liberar una mascota exótica', [
        'Cuando alguien se cansa de una mascota exótica —una tortuga, un pez, un reptil— y la suelta en una laguna o un parque, puede crear una invasión. La tortuga de orejas rojas, originaria de América del Norte y muy vendida como mascota, fue liberada en lagunas y arroyos de Argentina y figura en la lista oficial de especies exóticas invasoras: compite con las tortugas nativas y puede transmitirles enfermedades.',
        'Lo mismo pasa con peces de acuario, plantas acuáticas y otros animales. Una mascota exótica nunca se libera: se busca otro hogar o se consulta con la autoridad ambiental.',
      ]),
      vf('Soltar una tortuga de acuario en una laguna es una forma de devolverla a la naturaleza.', false, 'No es su naturaleza: es de otro continente. Puede morir o volverse invasora y dañar a las especies nativas. Nunca se liberan mascotas exóticas.', { // e1
        razones: ['+Porque no es su ambiente y puede volverse invasora', '-Porque las tortugas no pueden nadar', '-Porque las lagunas no tienen agua suficiente'],
        d: 2,
      }),
      cad('Armá la cadena de cómo una mascota liberada puede volverse invasora.', [ // e2
        'Una familia suelta sus tortugas de orejas rojas en una laguna',
        'Las tortugas sobreviven y se reproducen',
        'Compiten con las tortugas nativas por comida y lugares para asolearse',
        'Las tortugas nativas disminuyen',
      ], ['Las tortugas nativas se convierten en tortugas de orejas rojas'], 'Un acto que parece bondadoso termina dañando a especies que no tienen nada que ver.', { d: 2 }),
      op('Ya no podés cuidar a tu tortuga de acuario. ¿Qué es lo correcto?', [ // e3
        'Buscarle otro hogar o consultar a la autoridad ambiental',
        'Soltarla en la laguna del parque más cercano',
        ['Dejarla en la plaza para que alguien la encuentre', 'También es liberarla: puede morir o volverse invasora.'],
        'Tirarla por el inodoro',
      ], 'Una mascota exótica es responsabilidad de por vida. Si no se puede cuidar, se busca un hogar, nunca un río.', { d: 1 }),
      teoria('El tráfico de fauna silvestre', [
        'El tráfico de fauna es la captura, el transporte y la venta ilegal de animales silvestres, vivos o de sus partes. En Argentina, muchas aves —como el cardenal amarillo, el loro hablador o distintos jilgueros— se capturan en el campo para venderlas como mascotas en jaulas.',
        'El cardenal amarillo está en peligro de extinción, y la captura para el comercio de aves de jaula es una de sus principales amenazas. Por cada ave que llega viva a una casa, muchas mueren en la captura y el transporte.',
      ]),
      mult('¿Qué problemas causa el tráfico de fauna? Marcá todos.', [ // e4
        '+Lleva especies al borde de la extinción',
        '+Muchos animales mueren en la captura y el transporte',
        '+Puede transmitir enfermedades',
        '+Alimenta redes delictivas',
        '-Ayuda a conservar las especies en las casas',
      ], 'Las especies no se conservan en jaulas: se conservan en su ambiente.', { d: 2 }),
      teoria('La ley y los acuerdos', [
        'En Argentina, la Ley 22.421 protege a la fauna silvestre y prohíbe su caza, captura y comercio sin autorización. A nivel internacional, la convención CITES regula el comercio entre países de especies amenazadas.',
        'La forma más efectiva de frenar el tráfico es no comprar animales silvestres y denunciar su venta ante la autoridad de fauna.',
      ]),
      par('Uní cada herramienta con lo que hace.', [ // e5
        ['Ley 22.421', 'Protege a la fauna silvestre en Argentina'],
        ['CITES', 'Regula el comercio internacional de especies amenazadas'],
        ['Denuncia ciudadana', 'Avisa a la autoridad sobre ventas ilegales'],
        ['No comprar', 'Quita la demanda que sostiene el tráfico'],
      ], 'Leyes, acuerdos y decisiones individuales. El tráfico existe porque alguien compra.', { d: 2 }),
      cad('Armá la cadena de por qué comprar un cardenal en una feria alimenta su extinción.', [ // e6
        'Alguien compra un cardenal amarillo en una feria',
        'El vendedor gana dinero con esa venta',
        'Vuelve a capturar más cardenales en el campo',
        'La población silvestre sigue bajando',
      ], ['Comprarlo lo salva de estar en el campo'], 'La demanda es el motor del tráfico. Sin compradores, no hay negocio.', { d: 2 }),
      clas('¿Es legal o es tráfico de fauna?', { // e7
        'Legal': ['Observar aves con binoculares', 'Adoptar un perro de un refugio', 'Fotografiar un zorro en un parque nacional'],
        'Tráfico o ilegal': ['Comprar un loro sacado del monte', 'Vender cardenales en una feria', 'Tener un tatú capturado como mascota'],
      }, 'La fauna silvestre no es mascota. Observarla y fotografiarla, en cambio, es libre y no le hace daño.', { d: 2 }),
      det('Leé este aviso en redes y marcá lo problemático.', [ // e8
        ['Vendo cardenal amarillo, cantor, sacado del campo.', true, 'Es tráfico de una especie en peligro de extinción: se debe denunciar.'],
        ['Doy en adopción gatito castrado y vacunado.', false],
        ['Regalo tortuga de orejas rojas; si nadie la quiere, la suelto en el lago.', true, 'Liberarla puede crear una invasión: nunca se liberan mascotas exóticas.'],
        ['Busco hogar para perro adulto.', false],
      ], 'Algunos avisos parecen inofensivos y no lo son.', { d: 2 }),
      comp('Completá.', 'Una mascota exótica nunca se [libera]; el comercio internacional de especies amenazadas lo regula [CITES]; y el tráfico existe porque alguien [compra].', ['vacuna', 'FIFA', 'observa'], 'Tres ideas para no ser parte del problema.', { d: 2 }),
      est('Estimá en qué año aproximado se liberó el estornino pinto en Buenos Aires.', 1987, { min: 1900, max: 2020, paso: 1, unidad: 'año' }, 'A fines de los años ochenta. En pocas décadas se expandió por buena parte del país: así de rápido puede avanzar una especie liberada.', { d: 3 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Una ciudad amiga de la fauna', 'Vidrios, luces, agua y refugios: cambios chicos en casas y edificios que salvan muchos animales.', [
      teoria('Vidrios que matan', [
        'Las aves no ven los vidrios: ven el reflejo del cielo o de los árboles, o ven a través, y chocan. Un estudio publicado en la revista The Condor estimó que en Estados Unidos mueren entre 365 y 988 millones de aves por año por choques contra vidrios, la mayoría en casas y edificios bajos.',
        'Se puede evitar con marcas visibles en el vidrio (puntos o líneas separados unos 5 a 10 centímetros), cortinas o mosquiteros exteriores, o vidrios especiales en edificios nuevos.',
      ], { destacado: { valor: '365-988 millones', texto: 'de aves mueren por año en Estados Unidos por chocar contra vidrios, según un estudio de 2014.' } }),
      op('¿Por qué las aves chocan contra los vidrios?', [ // e1
        'Porque ven el reflejo del cielo o ven a través',
        'Porque les gusta golpear las ventanas',
        ['Porque son aves enfermas que no ven bien', 'Aves sanas chocan igual: el vidrio es invisible para ellas.'],
        'Porque buscan comida adentro de las casas',
      ], 'Para un ave, un vidrio reflectante es un pedazo de cielo o de árbol.', { d: 1 }),
      mult('¿Qué medidas reducen los choques de aves contra vidrios? Marcá todas.', [ // e2
        '+Marcas visibles separadas pocos centímetros',
        '+Mosquiteros exteriores',
        '+Cortinas o persianas',
        '+Vidrios especiales en edificios nuevos',
        '-Una sola calcomanía chica en el medio del ventanal',
      ], 'Una silueta aislada no alcanza: el ave pasa por el costado. Hacen falta marcas repartidas en todo el vidrio.', { d: 2 }),
      teoria('La noche iluminada', [
        'La luz artificial de noche desorienta a muchos animales: aves migratorias que vuelan de noche, insectos que giran alrededor de las lámparas hasta morir, tortugas marinas recién nacidas que van hacia las luces en vez de hacia el mar. También afecta a murciélagos y ranas.',
        'Apagar luces que no se usan, apuntar las luces hacia abajo y usar luces más cálidas (menos azules) reduce ese impacto, y además ahorra energía.',
      ]),
      cad('Armá la cadena de cómo una luz exterior toda la noche afecta a los insectos.', [ // e3
        'Se deja una luz blanca encendida toda la noche',
        'Miles de insectos nocturnos son atraídos',
        'Giran alrededor hasta agotarse o ser comidos',
        'Hay menos insectos para polinizar y alimentar a otros animales',
      ], ['Los insectos aprenden a usar la luz para ver mejor'], 'La contaminación lumínica es una amenaza silenciosa para los insectos, que ya vienen en declive.', { d: 2 }),
      clas('¿Esta iluminación es amigable con la fauna o no?', { // e4
        'Más amigable': ['Luz que apunta hacia abajo', 'Luz cálida con sensor de movimiento', 'Apagar las luces del jardín a la noche'],
        'Menos amigable': ['Reflector blanco apuntando al cielo', 'Luces de jardín encendidas toda la noche', 'Carteles luminosos en zonas naturales'],
      }, 'Menos luz, hacia abajo, cálida y solo cuando hace falta: la regla para la fauna y para la factura.', { d: 2 }),
      teoria('Agua, refugios y comida natural', [
        'En la ciudad, la fauna necesita agua, lugares para refugiarse y alimento natural. Un recipiente bajo con agua limpia (que se cambia seguido para que no críe mosquitos), arbustos densos, troncos, piedras, plantas nativas con flores y frutos y cajas nido para aves o murciélagos crean hábitat.',
        'También ayuda dejar un rincón del jardín menos "prolijo", con hojas secas y pasto más alto, donde se refugian insectos, sapos y lagartijas.',
      ]),
      mult('¿Qué elementos crean hábitat para la fauna en un jardín? Marcá todos.', [ // e5
        '+Plantas nativas con flores y frutos',
        '+Un plato bajo con agua limpia que se cambia seguido',
        '+Arbustos densos',
        '+Un rincón con hojas secas',
        '-Césped corto con herbicidas en todo el terreno',
      ], 'Agua, refugio y comida: las tres cosas que busca cualquier animal.', { d: 1 }),
      par('Uní cada elemento con el animal al que más ayuda.', [ // e6
        ['Caja nido', 'Aves que anidan en huecos'],
        ['Rincón con hojas secas', 'Sapos, lagartijas e insectos'],
        ['Flores nativas', 'Mariposas y abejas'],
        ['Refugio para murciélagos', 'Murciélagos insectívoros'],
      ], 'Cada elemento suma un tipo de hábitat distinto.', { d: 2 }),
      numv(3, (i) => { // e7
        const v = [10, 20, 6][i];
        const s = [5, 10, 5][i];
        return {
          enunciado: `Un ventanal mide ${v} metros de ancho. Si se ponen marcas verticales cada ${s} centímetros, ¿cuántas franjas hacen falta aproximadamente? (Dividí el ancho en cm por la separación)`,
          valor: (v * 100) / s,
          unidad: 'marcas',
          explicacion: `${v} m = ${v * 100} cm; ${v * 100} ÷ ${s} = ${(v * 100) / s} marcas. Con marcas tan juntas, las aves perciben el vidrio como un obstáculo.`,
        };
      }, { d: 2 }),
      vf('Un herbicida para dejar el césped perfecto no afecta a la fauna del jardín.', false, 'Elimina plantas que alimentan insectos y puede afectar a sapos, insectos y aves. Un jardín con algo de diversidad es mucho mejor hábitat.', { // e8
        razones: ['+Porque elimina alimento y puede dañar a sapos, insectos y aves', '-Porque los herbicidas atraen mariposas', '-Porque la fauna no vive en jardines'],
        d: 2,
      }),
      det('Leé este plan de un edificio y marcá lo que no ayuda a la fauna.', [ // e9
        ['Pondremos marcas en los ventanales del hall.', false],
        ['Dejaremos los reflectores del frente encendidos toda la noche apuntando al cielo.', true, 'La luz hacia el cielo desorienta aves e insectos y gasta energía.'],
        ['Plantaremos nativas en el cantero de la entrada.', false],
        ['Pondremos una sola calcomanía de halcón en el ventanal.', true, 'Una silueta aislada casi no sirve: hacen falta marcas repartidas.'],
      ], 'Los detalles importan: cantidad de marcas, dirección de la luz.', { d: 3 }),
      comp('Completá.', 'Las aves no ven los [vidrios]; la luz de noche conviene que apunte hacia [abajo]; y un jardín amigo de la fauna ofrece agua, refugio y [comida].', ['techos', 'arriba', 'ruido'], 'Tres cambios chicos para una ciudad más amable.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: vecinos silvestres', 'Fauna urbana, convivencia, mascotas, tráfico y ciudad amigable, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el barrio junto al humedal', 'Un barrio nuevo junto a un humedal tiene conflictos con la fauna. Ordená los problemas y armá un plan de convivencia.', [
      teoria('El barrio', [
        'Un barrio de 300 casas se construyó al lado de un humedal. Los vecinos se quejan de que los carpinchos comen los jardines y cruzan las calles, y algunos proponen echarlos. Hay 180 perros y 150 gatos, muchos sueltos. En la entrada hay un edificio vidriado donde aparecen aves muertas cada semana, y las luces del perímetro quedan encendidas toda la noche.',
        'En el humedal viven carpinchos, garzas, teros, coipos y muchas otras especies. La asociación vecinal pidió un plan de convivencia.',
      ]),
      op('¿Cuál es el enfoque correcto para el conflicto con los carpinchos?', [ // e1
        'Convivir con reglas claras',
        'Capturarlos y llevarlos a otro lugar',
        ['Cazarlos para reducir la población', 'Es ilegal y no resuelve nada: el humedal es su hábitat.'],
        'Cerrar el humedal y rellenarlo',
      ], 'El barrio se instaló en su ambiente. La salida es la convivencia, no la expulsión.', { d: 3 }),
      num('Si cada gato suelto caza en promedio 10 aves por año, ¿cuántas aves por año cazarían los 150 gatos del barrio si todos salieran?', 1500, 'aves', '150 × 10 = 1.500 aves por año, en el borde de un humedal lleno de aves.', { ctx: '150 gatos; 10 aves por gato por año.', d: 2 }),
      rank('Ordená las medidas del plan por su prioridad, de la primera a la última.', [ // e3
        ['Correa obligatoria y gatos adentro de noche en el borde del humedal', 'protege a la fauna ya'],
        ['Marcas en los vidrios del edificio de la entrada', 'evita muertes cada semana'],
        ['Luces del perímetro hacia abajo y con sensor', 'reduce la desorientación'],
        ['Carteles y charlas sobre convivencia con carpinchos', 'cambia hábitos a largo plazo'],
      ], 'Primero lo que evita muertes ya; después lo que mejora el hábitat y los hábitos.', { d: 4 }),
      clas('Clasificá las propuestas de los vecinos.', { // e4
        'Suma a la convivencia': ['Reductores de velocidad en la calle junto al humedal', 'Cercos bajos para proteger huertas', 'Castración gratuita de perros y gatos'],
        'Empeora la situación': ['Darles pan a los carpinchos para que no coman los jardines', 'Soltar perros de noche para ahuyentarlos', 'Rellenar una parte del humedal'],
      }, 'Las buenas medidas protegen a vecinos y fauna; las malas aumentan el conflicto o destruyen hábitat.', { d: 3 }),
      vf('Alimentar a los carpinchos en un lugar fijo reduciría el problema de los jardines.', false, 'Los acostumbraría a las personas, los concentraría y aumentaría los conflictos y las enfermedades. No hay que alimentarlos.', { // e5
        razones: ['+Porque los acostumbra a las personas y los concentra', '-Porque los carpinchos no comen pasto', '-Porque la comida los vuelve silvestres otra vez'],
        d: 3,
      }),
      mult('¿Qué debería incluir el plan sobre las mascotas? Marcá todo.', [ // e6
        '+Perros con correa en las calles junto al humedal',
        '+Gatos adentro de noche',
        '+Campaña de castración',
        '+Prohibir abandonar animales',
        '-Dejar que los perros persigan carpinchos para que se vayan',
      ], 'Las mascotas bien cuidadas conviven mejor con el humedal, y también están más seguras.', { d: 2 }),
      det('La asociación publica su plan. Marcá lo que no conviene.', [ // e7
        ['Pondremos marcas en los vidrios del edificio de la entrada.', false],
        ['Pediremos que trasladen a los carpinchos a otra provincia.', true, 'El humedal es su hábitat; trasladarlos no resuelve el conflicto y puede dañarlos.'],
        ['Las luces del perímetro apuntarán hacia abajo y tendrán sensores.', false],
        ['Cada vecino podrá dar de comer a los carpinchos en su jardín.', true, 'Alimentarlos aumenta los conflictos y las enfermedades.'],
      ], 'Un plan de convivencia protege a la fauna en su hábitat y cambia los hábitos de las personas.', { d: 3 }),
    ]),
  ],
});
