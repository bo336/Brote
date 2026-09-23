import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det } from '../dsl.mjs';

// TRONCO 1 — Todo está conectado.
// Punto de partida absoluto: no se asume nada. La unidad construye las cuatro
// ideas sobre las que se apoya el resto del árbol: qué es el ambiente, que la
// materia no desaparece, que la energía fluye y se degrada, y que en un
// sistema los efectos viajan. Cierra con recursos renovables y no renovables,
// que es la primera vez que aparece un número de ritmo (uso vs. reposición).

export default unidad({
  slug: 'tronco-1',
  rama: 'tronco',
  orden: 1,
  nivel: 0,
  titulo: 'Todo está conectado',
  bajada: 'Las cuatro ideas que sostienen todo lo demás: qué es el ambiente, cómo circula la materia, cómo fluye la energía y por qué todo tiene efectos en cadena.',
  objetivos: [
    'Explicar qué es el ambiente y reconocer que vos formás parte de él',
    'Seguir el recorrido de la materia: el agua y el carbono dan vueltas y nada desaparece',
    'Describir cómo entra la energía del sol a los seres vivos y por qué se va perdiendo',
    'Reconocer efectos en cadena, retroalimentaciones y consecuencias no buscadas',
    'Distinguir un recurso renovable de uno no renovable y por qué el ritmo de uso importa',
  ],
  fuentes: ['unesco-ods', 'usgs-ciclo-agua', 'nasa-ciclo-carbono', 'ipbes-global', 'global-footprint', 'invasoras-mayds', 'unep'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('¿Qué es el ambiente?', 'No es un lugar lejano con árboles: es todo lo que te rodea, incluido vos.', [
      teoria('El ambiente empieza en tu casa', [
        'Cuando se dice "ambiente", mucha gente imagina una selva o una montaña lejos de la ciudad. Pero el ambiente es todo lo que rodea a los seres vivos y se relaciona con ellos: el aire de tu cuarto, el agua de la canilla, la plaza de tu barrio, la comida de tu heladera y también las personas.',
        'Tiene partes vivas —plantas, animales, hongos, bacterias, personas— y partes no vivas —agua, aire, suelo, luz, temperatura—. Lo interesante no son las partes por separado sino cómo se afectan entre sí.',
      ], { destacado: { valor: 'Vos', texto: 'también sos parte del ambiente: respirás su aire, tomás su agua y lo cambiás con lo que hacés.' } }),
      op('¿Cuál de estas opciones describe mejor qué es el ambiente?', [
        'Todo lo que rodea a los seres vivos, incluidas las ciudades y las personas',
        ['Solo las zonas naturales que no fueron tocadas por las personas', 'Es la idea más común, pero deja afuera justo el lugar donde vivís y donde más podés actuar.'],
        'Los animales, las plantas y los paisajes naturales, sin contar las ciudades',
        'Los parques nacionales, las reservas y las áreas protegidas del país',
      ], 'El ambiente incluye lo natural y lo construido. Una ciudad también es un ambiente: tiene aire, agua, suelo, seres vivos y personas que lo transforman todos los días.', { d: 1 }),
      clas('Separá lo vivo de lo no vivo en un parque.', {
        'Parte viva': ['Un árbol', 'Una lombriz', 'El hongo de un tronco', 'Una persona'],
        'Parte no viva': ['El agua del charco', 'La luz del sol', 'Una piedra', 'El aire'],
      }, 'Los componentes vivos (bióticos) crecen, se alimentan y se reproducen. Los no vivos (abióticos) no lo hacen, pero son indispensables: sin agua, luz ni aire, lo vivo no existe.', { d: 1 }),
      teoria('Las partes se afectan entre sí', [
        'Un árbol de la vereda parece una cosa sola, pero está conectado con todo: sus raíces sostienen el suelo y absorben agua de lluvia, sus hojas dan sombra y bajan la temperatura de la cuadra, y en sus ramas comen y anidan pájaros e insectos.',
        'Si se tala el árbol, cambian muchas cosas a la vez: la vereda se calienta más, el agua de lluvia corre en lugar de infiltrarse y los pájaros buscan otro lugar. Por eso en ambiente casi nada tiene un solo efecto.',
      ]),
      mult('¿Qué cambia en una cuadra si se saca su único árbol grande? Marcá todo lo que corresponde.', [
        '+La vereda y las casas reciben más sol directo y se calientan más',
        '+Menos agua de lluvia se infiltra en el suelo en ese lugar',
        '+Los pájaros que lo usaban pierden un lugar para comer o descansar',
        '-El aire de toda la ciudad se queda sin oxígeno',
        '-Deja de llover en esa cuadra',
      ], 'Un árbol hace muchas cosas al mismo tiempo: sombra, infiltración, refugio. Pero tampoco hay que exagerar: un solo árbol no controla la lluvia ni el oxígeno de una ciudad. Pensar en ambiente es ver los efectos reales, sin agrandarlos ni achicarlos.', { d: 2 }),
      teoria('La naturaleza trabaja gratis', [
        'Muchas cosas que necesitamos las hace la naturaleza sin que nadie las pague: las abejas y otros insectos polinizan cultivos, los humedales absorben agua y amortiguan inundaciones, el suelo filtra el agua de lluvia y los bosques guardan carbono.',
        'A estos beneficios se los llama servicios de los ecosistemas. Cuando un ecosistema se degrada, esos servicios no desaparecen de la cuenta: hay que reemplazarlos con obras, dinero o energía, y a veces no se pueden reemplazar.',
      ], { lista: ['Polinización de frutas y verduras', 'Agua filtrada por suelos y humedales', 'Sombra y frescura de los árboles', 'Suelo fértil formado por hongos, lombrices y bacterias'] }),
      par('Uní cada parte de la naturaleza con el servicio que nos da.', [
        ['Insectos polinizadores', 'Que muchas plantas den frutos'],
        ['Humedal', 'Absorber agua y amortiguar inundaciones'],
        ['Árboles en la ciudad', 'Sombra y temperaturas más bajas'],
        ['Hongos y bacterias del suelo', 'Descomponer restos y fertilizar la tierra'],
      ], 'Cada uno de estos servicios tendría un costo enorme si hubiera que hacerlo con máquinas. Proteger un ecosistema muchas veces es la forma más barata de conservar lo que nos da.', { d: 2 }),
      vf('Si un servicio de la naturaleza se pierde, siempre se puede reemplazar con tecnología sin costo extra.', false, 'Algunos servicios se pueden reemplazar en parte (por ejemplo, con plantas potabilizadoras o polinización manual), pero cuesta dinero, energía y trabajo, y muchos no se pueden reemplazar del todo. Por eso cuidar el ecosistema suele ser mejor negocio que arreglar después.', {
        razones: [
          '+Reemplazarlo cuesta dinero y energía, y a veces no alcanza',
          '-La tecnología siempre es más barata que la naturaleza',
          '-Los servicios de la naturaleza no tienen ningún valor económico',
        ],
        d: 2,
      }),
      comp('Completá la idea central de esta sesión.', 'El ambiente tiene partes [vivas] y partes [no vivas], y lo importante es cómo se [relacionan] entre sí.', ['lejanas', 'separadas', 'artificiales'], 'Pensar en relaciones es la clave de todo el árbol: casi ningún problema ambiental se entiende mirando una sola parte.', { d: 2 }),
      op('Lucía dice: "Yo vivo en un departamento en el centro, el ambiente no tiene nada que ver conmigo". ¿Qué le responderías?', [
        'Que el agua, la luz y la comida que usa en su departamento también son ambiente',
        'Que tiene razón: en la ciudad el ambiente ya está perdido y no vale la pena',
        ['Que para cuidar el ambiente de verdad tendría que mudarse al campo', 'Mudarse no cambia nada de fondo: lo que cuenta es cómo se usan el agua, la energía y los materiales, estés donde estés.'],
        'Que el ambiente solo depende de lo que decidan los gobiernos y las empresas',
      ], 'Justamente en las ciudades es donde más energía, agua y materiales se usan. Por eso lo que pasa en un departamento del centro también es un tema ambiental.', { d: 2 }),
      ord('Ordená desde lo más cercano a vos hasta lo más amplio.', [
        'Tu cuarto',
        'Tu casa',
        'Tu barrio',
        'Tu ciudad',
        'La cuenca del río donde está tu ciudad',
      ], 'El ambiente funciona en escalas que se meten unas dentro de otras. Lo que hacés en tu cuarto (la luz, el agua) se suma a lo de tu casa, tu barrio y tu ciudad, y todo termina en el mismo río.', { d: 2, extremos: ['Más cerca', 'Más amplio'] }),
      mult('¿Cuáles de estas decisiones de todos los días tienen que ver con el ambiente?', [
        '+Qué comés en el almuerzo',
        '+Cómo vas a la escuela o al trabajo',
        '+Cuánto tiempo dejás corriendo el agua caliente',
        '+Qué hacés con la cáscara de una banana',
        '-Ninguna: el ambiente se decide en otro lado',
      ], 'Todas. Comida, transporte, agua y residuos son justamente las cuatro grandes puertas por donde una persona común afecta al ambiente, y también por donde lo puede mejorar.', { d: 1 }),
      op('En una plaza, las lombrices desaparecen porque el suelo se compactó por el paso de autos. ¿Qué es lo más probable que pase después?', [
        'El suelo se vuelve más duro, absorbe menos agua y a las plantas les cuesta crecer',
        'No pasa nada importante: las lombrices no cumplen ninguna función en el suelo',
        'El pasto crece más rápido porque ya no hay lombrices que se coman sus raíces',
        ['Llegan lombrices de otros lugares en pocos días y el suelo sigue igual que antes', 'Si la causa (la compactación) sigue, las lombrices no vuelven: el problema no es la lombriz, es el suelo.'],
      ], 'Las lombrices hacen túneles que airean el suelo y dejan pasar el agua, y mezclan restos orgánicos que lo fertilizan. Sin ellas, el suelo se degrada y eso afecta a las plantas: un efecto en cadena que empezó en algo que no se ve.', { d: 3 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Nada desaparece: la materia da vueltas', 'Cuando "tirás" algo, no se va: cambia de lugar. El agua y el carbono lo muestran mejor que nada.', [
      teoria('"Tirar" es cambiar de lugar', [
        'En la Tierra la materia no se crea ni se destruye: se transforma y cambia de lugar. El planeta es, en la práctica, un sistema cerrado para la materia: casi nada entra desde el espacio y casi nada sale.',
        'Por eso "tirar" algo no lo hace desaparecer. Una botella que va a la basura termina en un relleno sanitario, en un río o reciclada en otra cosa. El humo de un auto se mezcla con el aire que respiramos. Siempre está en algún lado.',
      ], { destacado: { valor: '0', texto: 'kilos de materia desaparecen cuando algo "se tira": solo cambia de lugar o de forma.' } }),
      vf('Cuando quemamos basura, la basura desaparece del planeta.', false, 'La combustión transforma la materia: parte se va al aire como gases (entre ellos dióxido de carbono) y partículas, y parte queda como cenizas. Nada desaparece; lo que cambia es dónde termina y en qué forma.', {
        razones: [
          '+La materia se transforma en gases, humo y cenizas, pero sigue existiendo',
          '-El fuego destruye la materia por completo',
          '-Solo desaparece si se quema a mucha temperatura',
        ],
        d: 1,
      }),
      teoria('El agua da vueltas desde siempre', [
        'El agua que tomás hoy es muy antigua: da vueltas por el planeta desde hace miles de millones de años. El sol calienta el agua de mares, ríos y suelos y la evapora; el vapor sube, se enfría y se condensa en nubes; las nubes dejan caer lluvia o nieve.',
        'Esa agua corre por la superficie hacia los ríos, o se infiltra en el suelo y llega a las napas subterráneas. Las plantas también devuelven agua al aire por sus hojas. Tarde o temprano, casi toda vuelve al mar, y el ciclo sigue.',
      ], { lista: ['Evaporación: el agua pasa a vapor', 'Condensación: el vapor forma nubes', 'Precipitación: lluvia, nieve o granizo', 'Escorrentía e infiltración: corre por la superficie o baja al suelo'] }),
      ord('Ordená el viaje de una gota de agua desde el mar.', [
        'El sol calienta el mar y el agua se evapora',
        'El vapor sube, se enfría y forma nubes',
        'Las nubes dejan caer lluvia sobre la tierra',
        'El agua corre hacia un río o se infiltra en el suelo',
        'El río lleva el agua otra vez al mar',
      ], 'Es un ciclo: no tiene un principio real, pero el sol es el motor que lo mueve todo. Sin la energía del sol no habría evaporación y el agua no subiría.', { d: 1 }),
      par('Uní cada parte del ciclo del agua con lo que pasa.', [
        ['Evaporación', 'El agua líquida pasa a vapor'],
        ['Condensación', 'El vapor se enfría y forma gotitas en las nubes'],
        ['Precipitación', 'El agua cae como lluvia o nieve'],
        ['Infiltración', 'El agua baja por el suelo hacia las napas'],
      ], 'Estos cuatro nombres vuelven a aparecer en la rama de Agua. Conviene tenerlos claros ahora: son el mapa de por dónde anda cada gota.', { d: 2 }),
      teoria('El carbono también viaja', [
        'El carbono es el elemento del que están hechos todos los seres vivos. Las plantas lo toman del aire como dióxido de carbono (CO₂) y, con la energía del sol, lo convierten en azúcares y madera. Los animales lo comen, y al respirar devuelven CO₂ al aire. Cuando un ser vivo muere, hongos y bacterias lo descomponen y también liberan carbono.',
        'Parte del carbono quedó guardado bajo tierra durante millones de años en forma de carbón, petróleo y gas: son restos de seres vivos muy antiguos. Al quemarlos, ese carbono vuelve al aire en muy poco tiempo, mucho más rápido de lo que las plantas y los océanos pueden absorberlo.',
      ]),
      cad('Armá el recorrido del carbono desde el aire hasta volver al aire.', [
        'Una planta toma CO₂ del aire',
        'Con la luz del sol lo convierte en azúcares y hojas',
        'Un animal come la planta',
        'El animal respira y devuelve CO₂ al aire',
      ], ['El carbono se destruye dentro del animal', 'La planta fabrica carbono nuevo a partir de agua'], 'El carbono pasa de un lado a otro sin crearse ni destruirse. Las dos piezas que sobraban proponen justamente eso —crearlo o destruirlo—, y eso no pasa.', { d: 3 }),
      op('¿Por qué quemar petróleo, carbón o gas agrega CO₂ al aire más rápido de lo que la naturaleza lo absorbe?', [
        'Porque libera de golpe carbono que estuvo guardado bajo tierra millones de años',
        ['Porque el petróleo tiene mucho más carbono que un árbol del mismo peso', 'No es eso: el problema no es cuánto carbono tiene cada cosa, sino que sale de un depósito que estaba fuera del ciclo.'],
        'Porque al quemarse, el fuego fabrica carbono nuevo que antes no existía',
        'Porque las plantas no pueden absorber el CO₂ que viene del petróleo',
      ], 'El carbono de los combustibles fósiles estaba fuera del ciclo rápido. Quemarlos lo suma al aire de golpe, y las plantas y los océanos, aunque absorben una parte, no alcanzan a compensar ese ritmo.', { d: 3 }),
      vf('El CO₂ que exhala una persona al respirar es la principal causa del aumento de CO₂ en el aire.', false, 'El carbono que exhalamos viene de la comida, que viene de plantas que lo tomaron del aire hace poco: es parte del ciclo rápido y se compensa. El aumento viene sobre todo de quemar combustibles fósiles y de la deforestación, que suman carbono que estaba guardado.', { d: 3 }),
      teoria('Los que cierran el ciclo', [
        'Si nada descompusiera los restos, el planeta estaría tapado de hojas, troncos y animales muertos. Los descomponedores —hongos, bacterias, lombrices y muchos insectos— rompen esos restos y devuelven sus nutrientes al suelo, donde las plantas los vuelven a usar.',
        'Cuando esos restos terminan enterrados sin aire, por ejemplo en un relleno sanitario, la descomposición cambia y produce metano, un gas que calienta mucho la atmósfera. Por eso lo que hacemos con los restos de comida importa: lo verás en detalle en la rama de Residuos.',
      ]),
      mult('¿Qué hacen los descomponedores en un bosque? Marcá todo lo correcto.', [
        '+Rompen hojas y restos muertos',
        '+Devuelven nutrientes al suelo',
        '+Permiten que las plantas vuelvan a usar esa materia',
        '-Fabrican agua nueva',
        '-Hacen desaparecer la materia',
      ], 'Los descomponedores no hacen desaparecer nada: transforman los restos en nutrientes y gases. Son los que convierten el final de un ser vivo en el comienzo de otro.', { d: 2 }),
      det('Un folleto de una empresa dice lo siguiente. Marcá las frases que contradicen lo que aprendiste.', [
        ['Nuestro camión retira tus residuos todos los días.', false],
        ['Una vez que salen de tu casa, desaparecen para siempre.', true, 'Nada desaparece: los residuos van a un relleno, a una planta o terminan en el ambiente.'],
        ['Los llevamos a un relleno sanitario controlado.', false],
        ['Al quemarlos, eliminamos toda la materia sin dejar rastros.', true, 'Quemar transforma la materia en gases, humo y cenizas; siempre deja rastros.'],
      ], 'Las frases que prometen que algo "desaparece" chocan con la idea central de esta sesión. La materia siempre termina en algún lugar.', { d: 3 }),
      comp('Completá.', 'La materia no se [crea] ni se [destruye]: se [transforma] y cambia de lugar.', ['recicla', 'evapora', 'multiplica'], 'Esta frase resume la sesión. Cada vez que escuches que algo "se fue", preguntate adónde fue.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('La energía fluye y se degrada', 'Toda la energía de los seres vivos viene del sol. En cada paso, una parte se pierde como calor.', [
      teoria('El sol mueve casi todo', [
        'Casi toda la energía que usan los seres vivos viene del sol. Las plantas, las algas y algunas bacterias capturan la luz con la fotosíntesis y la guardan en forma de azúcares. Todos los demás —herbívoros, carnívoros, hongos, nosotros— obtenemos energía comiendo lo que otro fabricó.',
        'A diferencia de la materia, la energía no da vueltas en círculo: entra desde el sol, pasa de un ser vivo a otro, y en cada paso una parte se escapa como calor, que ya no sirve para hacer trabajo. Por eso los ecosistemas necesitan recibir sol todo el tiempo.',
      ], { destacado: { valor: '≈10 %', texto: 'de la energía de un nivel de la cadena alimentaria llega, en promedio, al nivel siguiente.' } }),
      op('¿De dónde sacan la energía las plantas?', [
        'De la luz del sol, con la fotosíntesis',
        ['Del suelo, que absorben por las raíces', 'Del suelo toman agua y nutrientes minerales, pero no la energía: esa viene de la luz.'],
        'Del agua que absorben cuando llueve',
        'Del aire que respiran durante la noche',
      ], 'Las raíces toman agua y minerales, y las hojas toman CO₂ del aire, pero la energía para armar azúcares con todo eso viene de la luz. Sin luz, la fotosíntesis se detiene.', { d: 1 }),
      clas('¿Quién fabrica su alimento y quién lo obtiene comiendo a otros?', {
        'Produce su alimento con la luz': ['Un pasto', 'Un alga del río', 'Un ceibo'],
        'Obtiene energía comiendo a otros': ['Una vaca', 'Un hornero', 'Un hongo', 'Una persona'],
      }, 'Los productores (plantas, algas) son la puerta de entrada de la energía del sol. Los consumidores y los descomponedores dependen de ellos, aunque no los coman directamente.', { d: 2 }),
      teoria('Por qué se pierde energía en cada paso', [
        'Cuando una vaca come pasto, no todo lo que come se convierte en carne. Una gran parte de esa energía la usa para vivir —moverse, respirar, mantener la temperatura del cuerpo— y se termina liberando como calor. Otra parte ni siquiera se digiere.',
        'En promedio, solo alrededor del 10 % de la energía de un nivel pasa al siguiente. Es un promedio aproximado: varía según el ecosistema y el animal, pero siempre es mucho menos que el total. Esa pérdida explica por qué hay muchas más plantas que herbívoros y muchos más herbívoros que carnívoros.',
      ]),
      ejemplo('Cuánta energía llega arriba', 'Un campo de pasto captura 10.000 unidades de energía del sol. ¿Cuánta energía llega a un carnívoro que come herbívoros que comen ese pasto?', [
        'Pasto → herbívoros: pasa cerca del 10 %, o sea 10.000 × 0,10 = 1.000 unidades.',
        'Herbívoros → carnívoro: otra vez cerca del 10 %, o sea 1.000 × 0,10 = 100 unidades.',
      ], 'Al carnívoro le llegan unas 100 unidades: el 1 % de lo que capturó el pasto. El resto se perdió como calor en el camino.'),
      num('Si unas algas capturan 50.000 unidades de energía, ¿cuántas llegan aproximadamente a los peces pequeños que las comen? (Usá la regla del 10 %.)', 5000, 'unidades', 'Un paso de la cadena: 50.000 × 0,10 = 5.000 unidades. El resto (45.000) se usó para vivir o se perdió como calor.', { d: 2 }),
      num('Siguiendo con el ejemplo anterior: si un pez grande come a esos peces pequeños, ¿cuántas unidades de las 50.000 iniciales le llegan aproximadamente?', 500, 'unidades', 'Son dos pasos: 50.000 × 0,10 = 5.000, y 5.000 × 0,10 = 500. En dos pasos de la cadena queda alrededor del 1 % de la energía inicial.', { d: 3 }),
      rank('Ordená estos grupos de un campo según cuánta energía total contienen, de mayor a menor.', [
        ['Todas las plantas del campo', 'La base: capturan la energía del sol'],
        ['Todos los insectos que comen plantas', 'Alrededor de una décima parte'],
        ['Todos los pájaros que comen esos insectos', 'Una décima parte de la anterior'],
        ['Los halcones que cazan esos pájaros', 'Lo que queda arriba de todo'],
      ], 'Es la pirámide de energía: cada nivel tiene mucho menos que el anterior. Por eso los grandes depredadores siempre son pocos y necesitan territorios enormes.', { d: 3 }),
      teoria('Los combustibles son sol antiguo', [
        'El carbón, el petróleo y el gas se formaron con restos de plantas, algas y otros organismos que vivieron hace millones de años. La energía que guardan es, en el fondo, energía del sol que esos seres vivos capturaron entonces.',
        'Es una reserva enorme pero que no se repone a escala humana: tarda millones de años en formarse y la estamos usando en pocos siglos. Además, al quemarla se libera el carbono guardado, como viste en la sesión anterior.',
      ]),
      vf('La energía del petróleo es, en su origen, energía del sol.', true, 'El petróleo se formó con restos de organismos que hace millones de años hicieron fotosíntesis o comieron a quienes la hacían. Esa energía solar quedó guardada en sus restos.', {
        razones: [
          '+Viene de organismos que capturaron la luz del sol hace millones de años',
          '-El petróleo se fabrica solo en el centro de la Tierra, sin relación con los seres vivos',
          '-Toda la energía viene de la luna',
        ],
        d: 2,
      }),
      cad('Armá el camino de la energía desde el sol hasta un auto a nafta.', [
        'Algas antiguas capturan la luz del sol',
        'Sus restos quedan enterrados durante millones de años',
        'Se transforman en petróleo',
        'El petróleo se refina y se convierte en nafta',
        'El motor quema la nafta y la energía mueve el auto (y mucha se pierde como calor)',
      ], ['La nafta se fabrica con agua de mar'], 'El auto a nafta funciona, en el fondo, con luz del sol de hace millones de años. Y, como en toda transformación, una buena parte se pierde como calor en el motor.', { d: 3 }),
      op('¿Por qué un ecosistema no puede funcionar sin una entrada constante de energía, pero sí puede reutilizar la materia?', [
        'Porque la materia circula en ciclos y la energía se degrada en calor en cada paso',
        'Porque la energía queda guardada en el suelo y con los años se termina agotando',
        ['Porque la materia también se pierde en cada paso, solo que más despacio', 'La materia no se pierde: da vueltas. Esa es justamente la diferencia con la energía.'],
        'Porque las plantas destruyen la energía del sol al hacer la fotosíntesis',
      ], 'Es la diferencia más importante de esta unidad: la materia circula, la energía fluye y se degrada. Por eso los seres vivos dependen del sol todos los días.', { d: 3 }),
      mult('¿Qué conclusiones se desprenden de que se pierda energía en cada paso de una cadena alimentaria?', [
        '+Hay muchas más plantas que carnívoros en un ecosistema',
        '+Los grandes depredadores necesitan territorios amplios',
        '+Producir alimento de origen animal requiere más energía y más plantas que alimentarse directamente de plantas',
        '-Los carnívoros tienen más energía total que las plantas',
        '-La energía vuelve al sol al final de la cadena',
      ], 'La tercera conclusión es la base de un tema que verás en Alimentación: cada paso extra de la cadena multiplica la cantidad de plantas, agua y tierra necesarias.', { d: 3 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Sistemas: los efectos viajan', 'Un cambio chico en un lugar puede terminar en un cambio grande en otro. Aprendé a seguir la cadena.', [
      teoria('Qué es un sistema', [
        'Un sistema es un conjunto de partes que se relacionan y funcionan como un todo: un cuerpo, una ciudad, un bosque, el clima. Lo que define a un sistema no son sus partes sueltas sino sus conexiones.',
        'Por eso, cuando se cambia una parte, el efecto no se queda ahí: viaja por las conexiones. A veces el efecto llega lejos, a veces tarda años en notarse y a veces termina volviendo sobre la causa.',
      ]),
      op('¿Qué es lo que más define a un sistema?', [
        'Las relaciones entre sus partes',
        'La cantidad de partes que tiene',
        'Su tamaño',
        ['Que sea natural y no artificial', 'Una ciudad o una red eléctrica también son sistemas: lo que importa son las conexiones, no si es natural.'],
      ], 'Un montón de piezas sueltas no es un sistema; el mismo montón conectado sí. Por eso, para entender un problema ambiental, hay que dibujar las conexiones.', { d: 1 }),
      teoria('Efectos en cadena: el castor en Tierra del Fuego', [
        'En 1946 se llevaron castores canadienses a Tierra del Fuego para criarlos por su piel. Allí no tenían depredadores naturales, y se multiplicaron: hoy se cuentan por decenas de miles en la isla.',
        'Los castores construyen diques que inundan valles enteros, y los árboles de los bosques fueguinos —que no evolucionaron junto a ellos— mueren ahogados o talados y se regeneran muy despacio. Una decisión que parecía chica cambió el paisaje de una región entera.',
      ]),
      cad('Armá la cadena de efectos de la llegada del castor a Tierra del Fuego.', [
        'Se introducen castores sin depredadores naturales',
        'La población crece durante décadas',
        'Construyen diques en arroyos y ríos',
        'Los valles se inundan y los árboles mueren',
        'El bosque nativo se pierde en grandes áreas',
      ], ['Los castores comen peces y dejan los ríos vacíos'], 'Cada eslabón causa el siguiente. El señuelo es falso: los castores son herbívoros; el daño viene de los diques y la tala, no de comer peces.', { d: 3 }),
      vf('Una especie traída de otro lugar siempre se integra sin problemas porque el ecosistema se adapta.', false, 'Muchas especies introducidas no causan problemas, pero algunas se vuelven invasoras: sin sus depredadores o competidores de origen se multiplican y desplazan a las nativas. El castor, el ligustro o la rana toro son ejemplos en Argentina.', { d: 2 }),
      teoria('Retroalimentación: cuando el efecto vuelve sobre la causa', [
        'A veces un efecto termina empujando a su propia causa. Si la empuja más fuerte, se habla de retroalimentación que amplifica: es lo que pasa con el hielo polar. El hielo blanco refleja mucha luz del sol; si se derrite, queda mar oscuro que absorbe más calor, lo que derrite más hielo.',
        'Si la empuja al revés, se habla de retroalimentación que estabiliza, como un termostato: si hace calor, prende el aire; cuando baja la temperatura, lo apaga. Los ecosistemas tienen muchas de estas, y por eso resisten cambios... hasta cierto límite.',
      ]),
      cad('Armá el círculo del hielo polar que se derrite.', [
        'La temperatura sube',
        'Se derrite parte del hielo',
        'Queda expuesto mar oscuro que absorbe más calor del sol',
        'La zona se calienta todavía más',
      ], ['El mar oscuro refleja más luz que el hielo', 'El hielo derretido enfría el aire del planeta'], 'El último eslabón vuelve al primero: por eso es un círculo que se amplifica. Los señuelos dicen lo contrario de lo que pasa: el hielo refleja más, no el mar.', { d: 3 }),
      clas('¿Estas retroalimentaciones amplifican el cambio o lo estabilizan?', {
        'Amplifica el cambio': ['Menos hielo → más calor absorbido → menos hielo', 'Más incendios → menos bosque que da humedad → suelo más seco → más incendios'],
        'Estabiliza': ['Más conejos → más comida para los zorros → más zorros → menos conejos', 'Hace calor → sudás → el sudor se evapora y te enfría'],
      }, 'La pregunta clave es: ¿el efecto empuja la causa en el mismo sentido o en sentido contrario? Mismo sentido amplifica; contrario estabiliza.', { d: 3 }),
      teoria('Los retrasos engañan', [
        'En los sistemas, muchas causas tardan en mostrar su efecto. Un árbol que se planta hoy da sombra en diez años; una napa contaminada puede tardar décadas en limpiarse; el CO₂ que se emite hoy sigue calentando el planeta durante mucho tiempo.',
        'Los retrasos hacen que a veces parezca que "no pasa nada" y se reaccione tarde. Pensar en sistemas es también pensar en el tiempo: qué va a pasar después, no solo ahora.',
      ]),
      op('Una fábrica tira residuos a un arroyo y durante un año no se nota nada raro en el río grande al que llega. ¿Qué conclusión es la más correcta?', [
        'No se puede concluir que no haya daño: los efectos pueden tardar y acumularse',
        'Que los residuos son inofensivos, porque si no ya se habría notado algo',
        ['Que el río grande tiene tanta agua que nunca se va a contaminar por eso', 'Diluir no es eliminar: muchas sustancias se acumulan en el sedimento o en los seres vivos.'],
        'Que el arroyo limpia solo cualquier residuo antes de llegar al río',
      ], 'Los retrasos engañan: la ausencia de un efecto visible no prueba que no exista. Por eso se mide y se controla antes de que el daño se vea a simple vista.', { d: 3 }),
      mult('¿Cuáles de estas son consecuencias no buscadas de una decisión? Marcá todas.', [
        '+Se pavimenta un barrio para evitar el barro y aumentan las inundaciones porque el agua ya no se infiltra',
        '+Se introduce una especie para controlar una plaga y termina siendo plaga ella misma',
        '+Se ensancha una avenida para bajar el tránsito y a los años hay más autos que antes',
        '-Se planta un árbol nativo y da sombra',
        '-Se arregla una canilla y se pierde menos agua',
      ], 'Las tres primeras son ejemplos reales de efectos no buscados; las otras dos son efectos buscados y logrados. Muchos problemas ambientales nacieron de soluciones que no miraron el sistema entero.', { d: 3 }),
      par('Uní cada idea de sistemas con su ejemplo.', [
        ['Efecto en cadena', 'Menos lombrices → suelo compacto → menos plantas'],
        ['Retroalimentación que amplifica', 'Menos hielo → más calor → menos hielo'],
        ['Retroalimentación que estabiliza', 'Hace calor → transpirás → te enfriás'],
        ['Retraso', 'El árbol que plantás hoy da sombra en diez años'],
      ], 'Con estas cuatro ideas se puede analizar casi cualquier problema ambiental. Van a volver en Clima, en Agua y en Comunidad.', { d: 2 }),
      op('En un lago, se echan fertilizantes de campos cercanos. Crecen muchas algas, que al morir se descomponen y consumen el oxígeno del agua. ¿Qué es lo más probable que pase con los peces?', [
        'Muchos mueren por falta de oxígeno',
        'Crecen más porque tienen más algas para comer',
        'No les pasa nada: el oxígeno no depende de las algas',
        ['Se mudan todos a otro lago sin problemas', 'En un lago cerrado los peces no tienen adónde ir: el efecto les llega de lleno.'],
      ], 'Es un efecto en cadena muy común llamado eutrofización: más nutrientes → más algas → más descomposición → menos oxígeno → mueren peces. Lo que empezó en un campo termina en un lago.', { d: 4 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Lo que se renueva y lo que no', 'Hay recursos que se reponen y otros que no. Y hasta lo renovable se agota si se usa más rápido de lo que se repone.', [
      teoria('Renovables y no renovables', [
        'Un recurso renovable se repone por procesos naturales en un tiempo que importa para las personas: el agua de lluvia, la madera de un bosque, los peces de un río, la luz del sol, el viento.',
        'Un recurso no renovable tarda tanto en formarse —miles o millones de años— que, a escala humana, lo que se usa no vuelve: el petróleo, el gas, el carbón y los minerales como el cobre o el litio. De estos hay una cantidad fija, aunque sea grande.',
      ]),
      clas('Clasificá estos recursos.', {
        'Renovable': ['Luz del sol', 'Viento', 'Madera de un bosque manejado', 'Peces de un río'],
        'No renovable': ['Petróleo', 'Gas natural', 'Cobre', 'Carbón'],
      }, 'Los renovables se reponen en tiempos humanos; los no renovables tardan millones de años. Ojo: que algo sea renovable no quiere decir que sea infinito, como vas a ver ahora.', { d: 1 }),
      teoria('El ritmo lo es todo', [
        'Un recurso renovable funciona como una cuenta que recibe un depósito por año. Si se saca menos que ese depósito, la cuenta se mantiene. Si se saca más, la cuenta baja aunque el recurso sea "renovable".',
        'Así se agotan pesquerías, se secan napas subterráneas y se degradan suelos. Lo que importa no es solo si un recurso se renueva, sino si se usa más rápido de lo que se repone.',
      ], { destacado: { valor: 'Uso ≤ reposición', texto: 'es la condición para que un recurso renovable dure en el tiempo.' } }),
      ejemplo('Una napa que baja', 'Una napa subterránea recibe 100 millones de litros por año de lluvia que se infiltra. Un pueblo bombea 130 millones de litros por año.', [
        'Entrada por año: 100 millones de litros.',
        'Salida por año: 130 millones de litros.',
        'Balance: 100 − 130 = −30 millones de litros por año.',
      ], 'La napa pierde 30 millones de litros por año aunque el agua sea renovable. Si el bombeo sigue igual, el nivel baja año tras año.'),
      numv(3, (i) => {
        const e = [80, 120, 60][i];
        const s = [95, 150, 72][i];
        return {
          enunciado: `Una napa recibe ${e} millones de litros por año de lluvia y se le extraen ${s} millones por año. ¿Cuántos millones de litros pierde por año?`,
          valor: s - e,
          unidad: 'millones de litros por año',
          explicacion: `Balance: entrada ${e} − salida ${s} = −${s - e}. La napa pierde ${s - e} millones de litros por año: el recurso es renovable, pero se lo usa más rápido de lo que se repone.`,
        };
      }, { d: 2 }),
      vf('Como los peces se reproducen, pescar todo lo que se quiera nunca puede agotar una población.', false, 'Si se pesca más rápido de lo que la población se reproduce, disminuye año a año hasta colapsar. Pasó en muchas pesquerías del mundo. Por eso existen cupos, vedas y tamaños mínimos.', {
        razones: [
          '+Si se pesca más rápido de lo que se reproducen, la población cae',
          '-Los peces se reproducen infinitamente, así que no hay límite',
          '-Solo se agotan los recursos no renovables',
        ],
        d: 2,
      }),
      teoria('La huella y el día del sobregiro', [
        'La huella ecológica estima cuánta superficie productiva del planeta —campos, bosques, mares— hace falta para producir lo que consumimos y absorber lo que emitimos. Se compara con la biocapacidad: lo que el planeta regenera en un año.',
        'Según la Global Footprint Network, desde hace décadas la humanidad usa en un año más de lo que el planeta regenera en ese año. El día del calendario en que se agota lo del año se llama Día del Sobregiro de la Tierra, y en los últimos años cayó entre fines de julio y principios de agosto.',
      ]),
      op('¿Qué significa que el Día del Sobregiro de la Tierra caiga a fines de julio?', [
        'Que para esa fecha la humanidad ya usó lo que el planeta regenera en todo el año',
        'Que a partir de esa fecha el planeta deja de producir recursos hasta enero',
        ['Que ese día se terminan las reservas de petróleo y de gas del mundo', 'El sobregiro no mide reservas de combustibles: compara el consumo con lo que la naturaleza regenera por año.'],
        'Que ese día la humanidad consume más energía que cualquier otro día del año',
      ], 'Es como una cuenta que en julio ya gastó el sueldo de todo el año: el resto del año se vive "en rojo", sacando de los ahorros del planeta (bosques, peces, suelos) y acumulando CO₂.', { d: 3 }),
      ord('Ordená estos recursos según cuánto tardan en reponerse, del más rápido al más lento.', [
        'La luz del sol (llega cada día)',
        'Una cosecha de lechuga (semanas)',
        'Un bosque talado (décadas)',
        'El petróleo (millones de años)',
      ], 'El tiempo de reposición es lo que separa un recurso renovable de uno no renovable. Un bosque es renovable, pero tarda décadas: talarlo más rápido que eso lo agota.', { d: 2, extremos: ['Más rápido', 'Más lento'] }),
      mult('¿Qué estrategias ayudan a que un recurso renovable no se agote?', [
        '+Usarlo a un ritmo menor que el de reposición',
        '+Medir cuánto hay y cuánto se usa',
        '+Proteger lo que lo repone (por ejemplo, el suelo que deja infiltrar la lluvia)',
        '-Usarlo lo más rápido posible antes de que lo usen otros',
        '-Ignorarlo porque "es renovable"',
      ], 'Las tres primeras son la base de la gestión de recursos. La cuarta es la trampa más común: cuando muchos usan lo mismo sin reglas, todos terminan perdiendo.', { d: 3 }),
      est('Para ponerle números al sobregiro: si la humanidad usa en un año lo que el planeta regenera en ese año multiplicado por 1,7, ¿cuántos días "le alcanza" lo del año? Estimá.', 215, { min: 100, max: 365, paso: 1, unidad: 'días' }, '365 ÷ 1,7 ≈ 215 días: lo del año se agota a comienzos de agosto. Es exactamente la lógica del Día del Sobregiro.', { d: 4 }),
      det('Leé este razonamiento y marcá las partes equivocadas.', [
        ['El agua es un recurso renovable,', false],
        ['así que podemos bombear de la napa toda el agua que queramos', true, 'Renovable no quiere decir ilimitado: si se bombea más de lo que se infiltra, la napa baja.'],
        ['y la lluvia siempre la va a reponer al mismo ritmo', true, 'La reposición depende de la lluvia y del suelo; si se impermeabiliza, se infiltra menos.'],
        ['porque el ciclo del agua existe desde hace millones de años.', false],
      ], 'El ciclo del agua existe, y el agua es renovable, pero eso no garantiza que una napa en particular aguante cualquier ritmo de extracción.', { d: 4 }),
      rank('Ordená estas situaciones según qué tan sostenible es el uso del recurso, de más a menos.', [
        ['Se pescan 60 toneladas de una especie que repone 100 por año', 'Uso menor a la reposición: la población se mantiene'],
        ['Se pescan 100 toneladas de una especie que repone 100 por año', 'Justo en el límite: cualquier mal año la hace bajar'],
        ['Se pescan 150 toneladas de una especie que repone 100 por año', 'Sobreexplotación: la población cae'],
        ['Se pesca todo lo que se encuentra, sin medir', 'Ni siquiera se sabe cuánto se está perdiendo'],
      ], 'Lo sostenible no es "no usar", es usar por debajo de la reposición y medir para saber dónde se está.', { d: 4, extremos: ['Más sostenible', 'Menos sostenible'] }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: todo está conectado', 'Todo lo de la unidad mezclado, empezando por lo que más te costó.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el arroyo del barrio', 'Un caso real de punta a punta. Aprobalo para hacer crecer el tronco y abrir las ramas.', [
      teoria('El caso', [
        'En un barrio del conurbano corre un arroyo que hace veinte años tenía peces, sauces en las orillas y chicos que se metían a jugar. Hoy tiene poca agua limpia, olor en verano y, cuando llueve fuerte, se desborda.',
        'En esos veinte años pasaron varias cosas: se pavimentaron las calles cercanas, se construyeron casas en la orilla, se talaron sauces, y algunas casas y un taller conectaron sus desagües al arroyo. Con lo que aprendiste en la unidad, vas a analizar qué pasó.',
      ]),
      mult('¿Qué partes vivas y no vivas del ambiente del arroyo cambiaron en estos veinte años?', [
        '+Los peces (parte viva)',
        '+Los sauces de las orillas (parte viva)',
        '+La calidad del agua (parte no viva)',
        '+El suelo de alrededor, ahora pavimentado (parte no viva)',
        '-Nada: el arroyo es el mismo porque sigue en el mismo lugar',
      ], 'Cambiaron partes vivas y no vivas, y lo importante es que cambiaron juntas: cada cambio empujó a otros.', { d: 2, ctx: 'Un arroyo del conurbano: hace veinte años tenía peces y sauces; hoy tiene agua sucia y se desborda cuando llueve.' }),
      cad('Armá la cadena que explica por qué el arroyo ahora se desborda.', [
        'Se pavimentan las calles cercanas',
        'La lluvia ya no se infiltra en el suelo',
        'Toda el agua corre por las calles hacia el arroyo al mismo tiempo',
        'El arroyo recibe más agua de la que puede llevar y se desborda',
      ], ['El pavimento hace que llueva más', 'Los peces tapan el cauce'], 'El pavimento no cambia la lluvia: cambia a dónde va. El agua que antes se infiltraba ahora llega toda junta y rápido al arroyo.', { d: 3, ctx: 'Un arroyo del conurbano: se pavimentaron las calles cercanas y se construyó sobre las orillas.' }),
      op('Algunas casas conectan sus desagües cloacales al arroyo. ¿Qué pasa con esa materia?', [
        'No desaparece: queda en el agua, se acumula en el fondo y viaja río abajo',
        ['El arroyo la limpia sola en unas horas gracias a la corriente', 'Un arroyo puede depurar un poco de materia orgánica, pero con descargas constantes se satura y pierde el oxígeno.'],
        'Se evapora con el calor del verano y deja el agua limpia',
        'Se diluye tanto al mezclarse que deja de existir como contaminante',
      ], 'Es la idea de la segunda sesión: nada desaparece. Lo que entra al arroyo termina en su fondo, en sus seres vivos o río abajo, en el río grande.', { d: 3 }),
      cad('Armá la cadena que explica por qué desaparecieron los peces.', [
        'Llegan desagües con mucha materia orgánica y nutrientes',
        'Crecen algas y bacterias que descomponen esa materia',
        'La descomposición consume el oxígeno del agua',
        'Los peces no tienen oxígeno suficiente y mueren o se van',
      ], ['Los peces se comieron toda la materia orgánica y murieron de indigestión'], 'Es la misma cadena del lago que viste en la sesión de sistemas: más nutrientes, más descomposición, menos oxígeno.', { d: 4 }),
      clas('Los vecinos proponen soluciones. ¿Atacan la causa o solo el síntoma?', {
        'Ataca una causa': ['Conectar las casas a la red cloacal', 'Volver a plantar sauces y dejar orillas sin cemento', 'Hacer veredas y plazas que dejen infiltrar la lluvia'],
        'Solo alivia el síntoma': ['Echar perfume en el agua para tapar el olor', 'Sacar los peces muertos cada semana'],
      }, 'Pensar en sistemas es buscar las causas. Tapar el olor no cambia la cadena; conectar las cloacas y devolverle suelo y árboles a la orilla sí.', { d: 3 }),
      op('Un funcionario dice: "Plantamos sauces en la orilla hace un mes y el arroyo sigue igual: no sirvió". ¿Qué le falta considerar?', [
        'Los retrasos: un árbol tarda años en crecer y en mostrar su efecto',
        'Que los sauces no tienen ninguna relación con la calidad del agua',
        ['Que habría que plantar árboles exóticos, que crecen más rápido', 'Los sauces criollos son nativos de estas orillas: el problema no es la especie, es el tiempo.'],
        'Que un arroyo contaminado ya nunca se puede recuperar',
      ], 'Los retrasos engañan. Un sauce tarda años en sostener la orilla, dar sombra y bajar la temperatura del agua. Evaluar a un mes es evaluar demasiado pronto.', { d: 3 }),
      vf('Como el agua del arroyo es un recurso renovable, se va a recuperar sola aunque sigan llegando los desagües.', false, 'La recuperación depende de que las descargas paren. Mientras la causa siga, el arroyo no se recupera, por más que el agua se renueve con la lluvia.', {
        razones: [
          '+Mientras sigan las descargas, la causa del problema sigue presente',
          '-El agua renovable se limpia sola siempre',
          '-La lluvia elimina cualquier contaminación en un día',
        ],
        d: 3,
      }),
      rank('Ordená estas acciones según cuánto atacan la causa principal de la mala calidad del agua, de más a menos.', [
        ['Conectar todas las casas y el taller a la cloaca', 'Corta la entrada principal de contaminación'],
        ['Controlar que el taller no tire aceites', 'Corta una fuente puntual y tóxica'],
        ['Plantar sauces en las orillas', 'Ayuda a la orilla y al agua, pero no frena las descargas'],
        ['Poner carteles de "no tirar basura"', 'Útil, pero no toca las descargas de los desagües'],
      ], 'Todas suman, pero no pesan lo mismo. Priorizar por impacto es una idea que vas a usar en todo el árbol.', { d: 4 }),
      op('¿Qué idea de la unidad resume mejor lo que le pasó al arroyo?', [
        'Muchos cambios chicos y conectados que se sumaron durante años',
        'Una sola causa: que ahora llueve más que hace veinte años',
        'Mala suerte: los arroyos urbanos se arruinan solos con el tiempo',
        ['Que los peces se fueron y dejaron de limpiar el agua del arroyo', 'Los peces son un síntoma, no una causa.'],
      ], 'Es un sistema: pavimento, orillas, desagües y árboles se afectaron entre sí. La buena noticia es la misma: si los cambios se suman para mal, también se pueden sumar para bien.', { d: 3 }),
    ]),
  ],
});
