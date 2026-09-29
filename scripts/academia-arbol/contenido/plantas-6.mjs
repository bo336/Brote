import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// PLANTAS 6 — Restaurar ecosistemas.
// Qué significa restaurar, cuándo alcanza con dejar que la naturaleza se
// recupere y cuándo hay que ayudarla, por qué no todo es plantar árboles, y
// cómo se mide y se sostiene una restauración. Cierra la rama: retoma las
// nativas e invasoras (plantas-2), los bosques nativos (plantas-5), la
// recuperación de especies (animales-3) y el suelo (aire-suelo-2).

export default unidad({
  slug: 'plantas-6',
  rama: 'plantas',
  orden: 6,
  nivel: 3,
  requiereTronco: 3,
  titulo: 'Restaurar ecosistemas',
  bajada: 'Dejar que el bosque vuelva, ayudar con viveros de nativas, sacar invasoras y no plantar árboles donde no van: cómo se recupera un ecosistema dañado y cómo saber si funciona.',
  objetivos: [
    'Distinguir restauración ecológica, rehabilitación y forestación',
    'Explicar la regeneración natural y la sucesión ecológica',
    'Planificar acciones de restauración activa con especies nativas',
    'Evaluar por qué plantar árboles no siempre es restaurar',
    'Diseñar el monitoreo de una restauración y sostenerla en el tiempo',
  ],
  repasa: ['plantas-2', 'plantas-5', 'animales-3', 'aire-suelo-2'],
  fuentes: ['decenio-restauracion', 'cdb-meta-2', 'ser-estandares', 'rewilding-argentina', 'plantas-nativas', 'ecorregiones-pba', 'reserva-costanera-sur', 'ipbes-global'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Qué es restaurar', 'Recuperar un ecosistema dañado no es lo mismo que plantar cualquier cosa: la idea de ecosistema de referencia.', [
      teoria('Una definición', [
        'La restauración ecológica es el proceso de ayudar a que se recupere un ecosistema que fue degradado, dañado o destruido. No se trata de "embellecer" un lugar, sino de recuperar sus especies nativas, su estructura (cómo se organizan las plantas en capas), sus funciones (ciclos de agua y nutrientes, polinización, dispersión de semillas) y su capacidad de sostenerse solo. Para saber hacia dónde ir se usa un ecosistema de referencia: cómo era, o cómo es hoy en un lugar parecido y bien conservado.',
      ]),
      mult('¿Qué busca recuperar una restauración ecológica? Marcá todo.', [ // e1
        '+Las especies nativas del lugar',
        '+La estructura en capas de la vegetación',
        '+Funciones como la polinización y los ciclos del agua',
        '+La capacidad de sostenerse sin ayuda permanente',
        '-Un jardín con especies ornamentales de todo el mundo',
      ], 'Restaurar es recuperar un ecosistema que funcione solo, no decorar un terreno.', { d: 1 }),
      teoria('Tres palabras parecidas', [
        'Conviene distinguir tres ideas. Restaurar es recuperar el ecosistema nativo, con sus especies y funciones. Rehabilitar es recuperar algunas funciones —por ejemplo, frenar la erosión o mejorar el suelo— sin volver necesariamente al ecosistema original. Y forestar es plantar árboles donde antes no había bosque, a menudo especies exóticas como pinos o eucaliptos para producir madera: puede ser una actividad económica legítima, pero no es restauración.',
      ]),
      clas('¿Es restauración, rehabilitación o forestación?', { // e2
        'Restauración': ['Recuperar un bosque de algarrobos con especies nativas del lugar', 'Devolver a un humedal su régimen de agua y sus plantas nativas'],
        'Rehabilitación': ['Cubrir un talud con pasturas para frenar la erosión', 'Mejorar el suelo de una cantera abandonada'],
        'Forestación': ['Plantar pinos en un pastizal para producir madera', 'Plantar eucaliptos en un campo agrícola'],
      }, 'Las tres pueden ser útiles, pero solo la primera recupera el ecosistema nativo.', { d: 2 }),
      op('¿Qué es un ecosistema de referencia?', [ // e3
        'El modelo de cómo debería ser el ecosistema recuperado',
        'Cualquier parque bonito de otra ciudad',
        ['El ecosistema más degradado de la región', 'Es al revés: se busca un lugar bien conservado y parecido.'],
        'Un jardín botánico con especies de todo el mundo',
      ], 'Sin una referencia clara, no se sabe hacia dónde restaurar ni cómo medir el avance.', { d: 1 }),
      teoria('Un compromiso mundial', [
        'La ONU declaró 2021–2030 como el Decenio de las Naciones Unidas sobre la Restauración de los Ecosistemas. Y en el Marco Mundial de Biodiversidad, los países acordaron que, para 2030, al menos el 30 % de las áreas degradadas de tierra, aguas continentales y mares estén bajo restauración efectiva.',
      ]),
      numv(3, (i) => { // e4
        const deg = [1000000, 400000, 250000][i];
        return {
          enunciado: `Si una provincia tiene ${deg.toLocaleString('es-AR')} hectáreas degradadas y quiere cumplir la meta de restaurar al menos el 30 %, ¿cuántas hectáreas tiene que poner bajo restauración efectiva?`,
          valor: deg * 0.3,
          unidad: 'hectáreas',
          explicacion: `${deg.toLocaleString('es-AR')} × 30 % = ${(deg * 0.3).toLocaleString('es-AR')} hectáreas. Una meta ambiciosa: por eso conviene empezar por lo más valioso y lo más fácil de recuperar.`,
          ctx: `${deg} ha degradadas; meta del 30 %.`,
        };
      }, { d: 1 }),
      est('Estimá qué porcentaje de las áreas degradadas se comprometieron los países a poner bajo restauración efectiva para 2030.', 30, { min: 0, max: 100, paso: 5, unidad: '%' }, 'Al menos el 30 %, según la Meta 2 del Marco Mundial de Biodiversidad acordado en 2022.', { d: 2 }),
      vf('Plantar pinos en un pastizal natural es una forma de restauración ecológica.', false, 'Es forestación con especies exóticas en un ecosistema que no era un bosque. Puede incluso dañar al pastizal y a su fauna. Restaurar un pastizal es recuperar sus pastos y plantas nativas.', { // e5
        razones: ['+Porque es forestación exótica en un ecosistema que no era bosque', '-Porque los pinos son nativos de los pastizales', '-Porque los pastizales no se pueden restaurar'],
        d: 2,
      }),
      par('Uní cada concepto con su definición.', [ // e6
        ['Restauración', 'Recuperar el ecosistema nativo y sus funciones'],
        ['Rehabilitación', 'Recuperar algunas funciones, como frenar la erosión'],
        ['Forestación', 'Plantar árboles donde no había bosque'],
        ['Ecosistema de referencia', 'El modelo hacia el que se restaura'],
      ], 'Usar bien estas palabras evita confundir proyectos muy distintos.', { d: 1 }),
      cad('Armá los pasos para empezar una restauración.', [ // e7
        'Diagnosticar qué se degradó y por qué',
        'Elegir un ecosistema de referencia',
        'Frenar las causas de la degradación',
        'Definir las acciones de recuperación',
        'Planificar cómo se va a medir el avance',
      ], ['Plantar lo que haya en el vivero sin diagnóstico'], 'Sin frenar la causa, cualquier restauración se pierde.', { d: 2 }),
      rank('Ordená estas intervenciones de la más cercana a una restauración ecológica a la más lejana.', [ // e8
        ['Recuperar un bosque con especies nativas y su fauna', 'restauración'],
        ['Frenar la erosión con pasturas en una ladera', 'rehabilitación'],
        ['Plantar árboles ornamentales exóticos en una plaza', 'paisajismo'],
        ['Plantar pinos en un pastizal natural', 'reemplazo del ecosistema'],
      ], 'Cuanto más se recupera el ecosistema nativo, más cerca se está de restaurar.', { d: 2, extremos: ['Más cerca', 'Más lejos'] }),
      det('Leé este proyecto y marcá lo que no es restauración.', [ // e9
        ['Recuperaremos el bosque ribereño con especies nativas del lugar.', false],
        ['Plantaremos palmeras exóticas porque se ven lindas.', true, 'No recupera el ecosistema nativo: es paisajismo.'],
        ['Usaremos como referencia un bosque bien conservado cercano.', false],
        ['Forestaremos un humedal con eucaliptos para "restaurarlo".', true, 'Los eucaliptos secan el humedal: es lo contrario de restaurar.'],
      ], 'El nombre del proyecto no alcanza: hay que ver qué se recupera.', { d: 2 }),
      comp('Completá.', 'Recuperar el ecosistema nativo y sus funciones es [restaurar]; plantar árboles donde no había bosque es [forestar]; y el modelo hacia el que se restaura es el ecosistema de [referencia].', ['decorar', 'desmontar', 'moda'], 'Tres conceptos para hablar de restauración con precisión.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Dejar que la naturaleza haga', 'La regeneración natural, la sucesión ecológica y cuándo alcanza con sacar el disturbio.', [
      teoria('La sucesión', [
        'Cuando un ecosistema se deja de perturbar, se recupera en etapas: primero llegan plantas pioneras, que crecen rápido al sol; después arbustos y árboles que dan sombra; y con el tiempo, especies que necesitan un ambiente más estable. Esa secuencia se llama sucesión ecológica. En muchos lugares, la mejor restauración es dejar que ocurra: se llama regeneración natural o restauración pasiva.',
      ]),
      ord('Ordená las etapas típicas de la sucesión en un campo abandonado que vuelve a ser bosque.', [ // e1
        'Pastos y hierbas pioneras que crecen al sol',
        'Arbustos que colonizan y dan algo de sombra',
        'Árboles de crecimiento rápido',
        'Árboles de crecimiento lento que forman el bosque maduro',
      ], 'Cada etapa prepara el terreno para la siguiente: sombra, suelo y humedad.', { d: 2, extremos: ['Primero', 'Último'] }),
      teoria('Cuándo alcanza con esperar', [
        'La regeneración natural funciona mejor cuando se cumplen tres condiciones: que se haya frenado lo que causaba el daño (el sobrepastoreo, el fuego repetido, la tala, las especies invasoras), que haya fuentes de semillas cerca (un bosque vecino, árboles aislados que atraen aves) y que el suelo no esté demasiado degradado. Si falta alguna, hace falta ayudar.',
      ]),
      mult('¿Qué condiciones favorecen la regeneración natural? Marcá todas.', [ // e2
        '+Que se haya frenado el sobrepastoreo o la tala',
        '+Que haya un bosque cercano que aporte semillas',
        '+Que el suelo conserve algo de su materia orgánica',
        '-Que siga el fuego todos los años',
        '-Que las especies invasoras cubran todo',
      ], 'Sin la causa del daño y con semillas cerca, la naturaleza suele recuperarse sola.', { d: 1 }),
      cad('Armá la cadena de cómo un árbol aislado ayuda a recuperar el bosque.', [ // e3
        'Un árbol quedó en pie en un campo abandonado',
        'Las aves se posan en él',
        'Dejan caer semillas de frutos que comieron en otros lugares',
        'Debajo del árbol germinan nuevas plantas',
        'Se forma una isla de bosque que se expande',
      ], ['Las aves se comen todas las plantas nuevas'], 'Por eso a veces se dejan o se plantan árboles "núcleo" que atraen fauna dispersora.', { d: 2 }),
      teoria('Un ejemplo en la ciudad', [
        'La Reserva Ecológica Costanera Sur, en la Ciudad de Buenos Aires, nació sobre terrenos ganados al Río de la Plata con escombros. Dejados sin intervenir, esos terrenos fueron colonizados por plantas que llegaron con el viento, el agua y las aves, y se formaron lagunas, pajonales y bosques de ribera que hoy albergan cientos de especies de aves. Es un ejemplo de cuánto puede hacer la naturaleza cuando se la deja.',
      ]),
      op('¿Qué muestra el caso de la Reserva Ecológica Costanera Sur?', [ // e4
        'Que la naturaleza puede colonizar sola un terreno',
        'Que solo se puede restaurar con escombros',
        ['Que las aves no llegan a las ciudades', 'Llegaron cientos de especies de aves.'],
        'Que los ríos no transportan semillas',
      ], 'Viento, agua y aves son grandes "jardineros" cuando se les da la oportunidad.', { d: 1 }),
      clas('¿Esta situación permite la regeneración natural o necesita ayuda?', { // e5
        'Alcanza con regeneración natural': ['Campo con ganado retirado junto a un bosque sano', 'Bosque talado hace poco con muchos renovales'],
        'Necesita ayuda': ['Ladera sin suelo por erosión severa', 'Terreno invadido por ligustro sin nativas cerca', 'Zona sin semillas en muchos kilómetros'],
      }, 'Diagnosticar bien ahorra esfuerzo: no hace falta plantar donde la naturaleza puede sola.', { d: 2 }),
      numv(3, (i) => { // e6
        const [ha, pasiva, activa] = [[100, 200, 3000], [50, 150, 2500], [200, 300, 4000]][i];
        return {
          enunciado: `Restaurar ${ha} hectáreas por regeneración natural (con alambrado y control) cuesta ${pasiva} dólares por hectárea; plantando, ${activa.toLocaleString('es-AR')}. ¿Cuántos dólares se ahorran usando regeneración natural donde es posible?`,
          valor: ha * (activa - pasiva),
          unidad: 'dólares',
          explicacion: `${ha} × (${activa.toLocaleString('es-AR')} − ${pasiva}) = ${(ha * (activa - pasiva)).toLocaleString('es-AR')} dólares. Valores de ejemplo: cuando se puede, dejar que la naturaleza trabaje es mucho más barato.`,
          ctx: `${ha} ha; ${pasiva} y ${activa} dólares por hectárea.`,
        };
      }, { d: 2 }),
      vf('La regeneración natural significa no hacer absolutamente nada.', false, 'Implica frenar las causas del daño —cercar el ganado, controlar el fuego y las invasoras— y vigilar el avance. Es pasiva en lo que se planta, no en la gestión.', { // e7
        razones: ['+Porque hay que frenar las causas del daño y vigilar', '-Porque la naturaleza nunca se recupera sola', '-Porque requiere plantar miles de árboles'],
        d: 2,
      }),
      vf('Un árbol aislado en un campo abandonado puede acelerar la llegada del bosque.', true, 'Atrae aves que traen semillas, da sombra y mejora el suelo debajo: se forma un núcleo de bosque que se expande.', { // e7b
        razones: ['+Porque atrae aves que traen semillas y crea un núcleo', '-Porque los árboles aislados impiden que crezca nada', '-Porque las aves no comen frutos'],
        d: 1,
      }),
      par('Uní cada disturbio con cómo se frena.', [ // e8
        ['Sobrepastoreo', 'Alambrado o manejo del ganado'],
        ['Fuego repetido', 'Cortafuegos y control de quemas'],
        ['Especies invasoras', 'Control y extracción'],
        ['Tala', 'Protección y vigilancia'],
      ], 'Frenar el disturbio es el primer paso de cualquier restauración.', { d: 1 }),
      det('Leé este plan y marcá lo que conviene corregir.', [ // e9
        ['Retiraremos el ganado de la ladera para que se regenere.', false],
        ['Dejaremos que el ganado siga entrando mientras esperamos que crezca el bosque.', true, 'El ganado se come los renovales: hay que frenar el disturbio.'],
        ['Dejaremos los árboles aislados que atraen aves.', false],
        ['No vigilaremos nada porque la regeneración es automática.', true, 'Hay que controlar invasoras, fuego y avance.'],
      ], 'La regeneración natural funciona cuando se gestiona bien.', { d: 2 }),
      comp('Completá.', 'La secuencia de etapas por la que se recupera un ecosistema es la [sucesión] ecológica; dejar que el ecosistema se recupere solo es la regeneración [natural]; y las primeras plantas que colonizan son las [pioneras].', ['rotación', 'artificial', 'ornamentales'], 'Tres claves de la recuperación natural de los ecosistemas.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Ayudar a recuperar', 'Viveros de nativas, siembra, plantación, control de invasoras y reintroducción de fauna: la restauración activa.', [
      teoria('Restauración activa', [
        'Cuando la naturaleza no puede sola, se la ayuda. La restauración activa puede incluir: producir plantas nativas en viveros a partir de semillas locales, sembrar o plantar, mejorar el suelo, controlar especies invasoras, devolverle al lugar su régimen de agua (en un humedal drenado, por ejemplo) y reintroducir animales que cumplen funciones clave, como dispersar semillas o controlar herbívoros.',
      ]),
      clas('¿Es una acción de restauración pasiva o activa?', { // e1
        'Pasiva': ['Alambrar para que no entre el ganado', 'Dejar que el bosque vecino aporte semillas'],
        'Activa': ['Plantar nativas producidas en un vivero', 'Sembrar semillas de pastos nativos', 'Reintroducir un animal que dispersa semillas', 'Tapar un canal para que un humedal recupere su agua'],
      }, 'Muchas restauraciones combinan las dos: lo pasivo donde alcanza y lo activo donde hace falta.', { d: 1 }),
      teoria('Semillas locales', [
        'Para restaurar conviene usar semillas de la misma región: las plantas de origen local están adaptadas al clima, al suelo y a las plagas del lugar, y conservan la diversidad genética local. Por eso son tan importantes los viveros de nativas y los bancos de semillas regionales, y la recolección responsable de semillas, sin agotar las plantas madres.',
      ]),
      op('¿Por qué conviene usar semillas de origen local para restaurar?', [ // e2
        'Están adaptadas al clima y al suelo del lugar',
        'Porque son las más baratas del mercado',
        ['Porque crecen más rápido que cualquier exótica', 'No siempre crecen más rápido; su ventaja es la adaptación.'],
        'Porque no necesitan agua nunca',
      ], 'Una planta adaptada al lugar tiene más chances de sobrevivir y de integrarse al ecosistema.', { d: 2 }),
      numv(3, (i) => { // e3
        const [plantas, sup] = [[1000, 60], [2500, 70], [800, 50]][i];
        return {
          enunciado: `Se plantan ${plantas.toLocaleString('es-AR')} plantines nativos y a los dos años sobrevive el ${sup} %. ¿Cuántos plantines sobreviven?`,
          valor: plantas * sup / 100,
          unidad: 'plantines',
          explicacion: `${plantas.toLocaleString('es-AR')} × ${sup} % = ${(plantas * sup / 100).toLocaleString('es-AR')} plantines. La supervivencia es un indicador clave: riego inicial, protección y especies adecuadas la mejoran.`,
          ctx: `${plantas} plantines; supervivencia del ${sup} %.`,
        };
      }, { d: 1 }),
      ord('Ordená los pasos para producir plantas nativas en un vivero.', [ // e3b
        'Recolectar semillas maduras de plantas madres locales',
        'Limpiar y guardar las semillas registrando su origen',
        'Sembrar en almácigos',
        'Pasar los plantines a macetas y endurecerlos al sol',
        'Plantar en el sitio en la época adecuada',
      ], 'Un buen vivero cuida el origen, la calidad y el momento de plantación.', { d: 2 }),
      teoria('Sacar las invasoras', [
        'En muchos lugares, restaurar empieza por controlar especies invasoras: ligustros y acacias negras en los bosques ribereños del centro del país, pinos que se expanden en pastizales y estepas, o rosa mosqueta en la Patagonia. Lo viste en la unidad de nativas e invasoras. El control debe ser sostenido, porque las invasoras rebrotan y sus semillas quedan en el suelo por años.',
      ]),
      cad('Armá la secuencia para recuperar un bosque ribereño invadido por ligustro.', [ // e4
        'Relevar dónde está el ligustro y qué nativas quedan',
        'Cortar y controlar los ligustros adultos',
        'Plantar nativas para cubrir los claros',
        'Arrancar los rebrotes y plántulas de ligustro cada año',
        'Monitorear hasta que las nativas dominen',
      ], ['Cortar una vez y olvidarse del lugar'], 'Sin control sostenido, las invasoras vuelven a ganar el espacio.', { d: 2 }),
      teoria('Devolver la fauna', [
        'Algunas restauraciones incluyen reintroducir animales. En los Esteros del Iberá, un programa de reintroducciones devolvió especies que habían desaparecido, como el oso hormiguero, el pecarí de collar, el guacamayo rojo y el yaguareté. Esos animales no son un adorno: cumplen funciones, como dispersar semillas o regular las poblaciones de otros animales. A esta forma de restaurar se la suele llamar renaturalización o rewilding.',
      ]),
      par('Uní cada animal con una función que cumple en el ecosistema.', [ // e5
        ['Guacamayo rojo', 'Dispersa semillas de palmeras y árboles'],
        ['Yaguareté', 'Regula las poblaciones de herbívoros'],
        ['Oso hormiguero', 'Controla poblaciones de hormigas y termitas'],
        ['Pecarí de collar', 'Remueve el suelo y dispersa semillas'],
      ], 'Devolver animales es devolver funciones que el ecosistema había perdido.', { d: 3 }),
      mult('¿Qué acciones son parte de una restauración activa? Marcá todas.', [ // e6
        '+Producir plantas nativas en viveros',
        '+Controlar especies invasoras',
        '+Recuperar el régimen de agua de un humedal',
        '+Reintroducir fauna que cumple funciones',
        '-Plantar especies exóticas porque crecen rápido',
      ], 'Todas buscan recuperar especies y funciones nativas.', { d: 1 }),
      vf('Para restaurar, conviene usar la especie que crezca más rápido, aunque sea exótica.', false, 'Las exóticas pueden volverse invasoras y no cumplen las funciones del ecosistema nativo. La restauración usa especies nativas, idealmente de origen local.', { // e7
        razones: ['+Porque pueden volverse invasoras y no restauran el ecosistema', '-Porque las nativas nunca crecen', '-Porque la velocidad es lo único que importa'],
        d: 1,
      }),
      rank('Ordená estos orígenes de semillas para restaurar un bosque de Córdoba, del más recomendable al menos.', [ // e8
        ['Semillas de árboles nativos del mismo valle', 'origen local'],
        ['Semillas de la misma especie de otra provincia', 'origen lejano'],
        ['Una especie nativa de otra ecorregión', 'no corresponde al lugar'],
        ['Una especie exótica que crece rápido', 'no es restauración'],
      ], 'Cuanto más cercano el origen, mejor adaptada la planta al lugar.', { d: 2, extremos: ['Más recomendable', 'Menos recomendable'] }),
      det('Leé el plan de un vivero y marcá lo que conviene corregir.', [ // e9
        ['Recolectamos semillas de árboles nativos de la zona.', false],
        ['Arrancamos todas las semillas de cada planta madre.', true, 'Hay que recolectar sin agotar las plantas madres.'],
        ['Registramos el origen de cada lote de semillas.', false],
        ['Producimos ligustros porque se venden más.', true, 'El ligustro es invasor: no debe producirse para restaurar.'],
      ], 'Un vivero de nativas es una pieza clave de la restauración: su calidad importa.', { d: 2 }),
      comp('Completá.', 'Para restaurar conviene usar semillas de origen [local]; en Iberá se reintrodujeron especies como el [yaguareté]; y restaurar devolviendo fauna se llama renaturalización o [rewilding].', ['importado', 'león', 'marketing'], 'Tres claves de la restauración activa con plantas y animales nativos.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('El árbol correcto donde corresponde', 'Por qué plantar árboles no siempre es bueno: pastizales, humedales, plantaciones y promesas de carbono.', [
      teoria('No todo ecosistema es un bosque', [
        'Los pastizales, las estepas, los humedales y los arbustales son ecosistemas valiosos por sí mismos, con especies que solo viven allí. Plantar árboles en un pastizal natural no lo "mejora": lo reemplaza. Los árboles sombrean a las plantas del pastizal, cambian el suelo, usan más agua y pueden secar humedales y napas. Además, en zonas con fuego natural o con aves que necesitan espacios abiertos, los árboles plantados pueden causar daño.',
      ]),
      cad('Armá la cadena de cómo una forestación daña un pastizal.', [ // e1
        'Se plantan pinos en un pastizal natural',
        'Los pinos crecen y sombrean el suelo',
        'Desaparecen los pastos y flores del pastizal',
        'Se pierden las aves e insectos que dependían de ellos',
        'Además, los pinos se expanden fuera de la plantación',
      ], ['Los pinos aumentan la diversidad de pastos'], 'Un ecosistema abierto no es un bosque "incompleto".', { d: 2 }),
      clas('¿Plantar árboles ayuda o daña en cada caso?', { // e2
        'Ayuda': ['Bosque ribereño nativo desmontado', 'Claro dentro de un bosque nativo degradado'],
        'Daña': ['Pastizal pampeano natural', 'Humedal con napa alta', 'Estepa patagónica'],
      }, 'El mismo acto —plantar árboles— puede restaurar o degradar, según dónde.', { d: 2 }),
      teoria('Plantaciones y bosques', [
        'En Argentina hay más de un millón de hectáreas de plantaciones forestales, sobre todo de pinos y eucaliptos, en provincias como Misiones, Corrientes y Entre Ríos. Son cultivos de árboles para madera y celulosa: pueden generar empleo y productos útiles, pero no son bosques nativos. Tienen pocas especies, se cosechan cada cierto tiempo y no reemplazan la biodiversidad de una selva o un monte.',
      ]),
      clas('¿Es una característica de una plantación forestal o de un bosque nativo?', { // e3
        'Plantación forestal': ['Pocas especies, en filas, del mismo tamaño', 'Se cosecha entera cada cierto tiempo', 'Suele ser de especies exóticas'],
        'Bosque nativo': ['Muchas especies de distintas edades y alturas', 'Alberga fauna que depende de él', 'Tiene árboles muertos en pie que usan aves y hongos'],
      }, 'Contar árboles no alcanza: importa qué árboles, cómo están y qué vida sostienen.', { d: 2 }),
      vf('Una plantación de pinos tiene la misma biodiversidad que un bosque nativo de la misma superficie.', false, 'Las plantaciones tienen pocas especies y una estructura simple; albergan mucha menos biodiversidad que un bosque nativo.', { // e4
        razones: ['+Porque tienen pocas especies y estructura simple', '-Porque los pinos son nativos de Misiones', '-Porque los bosques nativos no tienen fauna'],
        d: 1,
      }),
      teoria('Árboles y carbono', [
        'Muchas empresas ofrecen "compensar" emisiones plantando árboles. Los árboles guardan carbono, pero hay riesgos: que se planten donde no corresponde, que se prometa más carbono del que realmente guardan, que se quemen o se talen y liberen ese carbono, o que la plantación se use para seguir emitiendo sin reducir. Una compensación seria mide, verifica, asegura la permanencia y no reemplaza la reducción de emisiones.',
      ]),
      mult('¿Qué riesgos tienen las compensaciones de carbono con árboles? Marcá todos.', [ // e5
        '+Plantar en ecosistemas que no eran bosques',
        '+Prometer más carbono del que realmente se guarda',
        '+Que un incendio libere el carbono guardado',
        '+Usarlas para no reducir las emisiones propias',
        '-Que los árboles absorban demasiado oxígeno',
      ], 'Plantar árboles no es un permiso para seguir emitiendo.', { d: 2 }),
      numv(3, (i) => { // e6
        const [arb, kg, emis] = [[1000, 20, 100], [5000, 15, 300], [2000, 25, 200]][i];
        return {
          enunciado: `Una empresa emite ${emis} toneladas de CO₂ por año y planta ${arb.toLocaleString('es-AR')} árboles que absorben en promedio ${kg} kg de CO₂ por año cada uno. ¿Qué porcentaje de sus emisiones compensan esos árboles?`,
          valor: Math.round((arb * kg / 1000) / emis * 100),
          unidad: '%',
          tol: 1,
          explicacion: `${arb.toLocaleString('es-AR')} × ${kg} kg = ${(arb * kg / 1000).toLocaleString('es-AR')} t por año; ÷ ${emis} ≈ ${Math.round((arb * kg / 1000) / emis * 100)} %. Y eso si sobreviven todos. Valores de ejemplo: reducir emisiones sigue siendo lo principal.`,
          ctx: `${arb} árboles; ${kg} kg de CO₂ cada uno; ${emis} t de emisiones.`,
        };
      }, { d: 3 }),
      op('Una empresa dice "somos carbono neutrales porque plantamos árboles", sin reducir sus emisiones. ¿Qué conviene preguntar?', [ // e7
        '¿Dónde plantan, cuánto miden y cómo reducen?',
        '¿Cuántos árboles tiene el logo de la empresa?',
        ['¿Los árboles son de colores lindos?', 'No dice nada sobre el carbono ni el ecosistema.'],
        '¿Cuándo sale su próxima publicidad?',
      ], 'Lo viste con el greenwashing: las afirmaciones de carbono necesitan datos verificables.', { d: 2 }),
      op('¿Por qué una plantación de eucaliptos puede secar un humedal?', [ // e7b
        'Porque consumen mucha agua del suelo y de la napa',
        'Porque sus hojas tapan el agua como un techo',
        ['Porque atraen a las aves que toman el agua', 'Las aves no secan humedales; el consumo de agua de los árboles sí.'],
        'Porque sus raíces calientan el agua',
      ], 'Árboles de alto consumo de agua en un ecosistema húmedo alteran todo su funcionamiento.', { d: 2 }),
      rank('Ordená estas acciones de una empresa según su valor climático y ambiental, de mayor a menor.', [ // e8
        ['Reducir sus propias emisiones', 'lo primero'],
        ['Financiar la conservación de un bosque nativo amenazado', 'muy valioso'],
        ['Restaurar un bosque nativo degradado con especies locales', 'valioso'],
        ['Plantar pinos en un pastizal y decir que compensa', 'puede dañar'],
      ], 'Primero reducir; después conservar y restaurar bien; nunca dañar ecosistemas en nombre del carbono.', { d: 3, extremos: ['Mayor valor', 'Menor valor'] }),
      det('Leé esta campaña y marcá lo engañoso.', [ // e9
        ['Restauraremos bosque ribereño con especies nativas del lugar.', false],
        ['Plantaremos un millón de árboles en los pastizales del sur para salvar el planeta.', true, 'Forestar pastizales naturales daña ese ecosistema.'],
        ['Mediremos la supervivencia y el carbono con verificación independiente.', false],
        ['Con esta plantación ya no necesitamos reducir nuestras emisiones.', true, 'Compensar no reemplaza reducir.'],
      ], 'Más árboles no siempre es mejor: depende de dónde y para qué.', { d: 2 }),
      comp('Completá.', 'Plantar árboles en un pastizal natural no lo mejora, lo [reemplaza]; las plantaciones de pinos y eucaliptos no son bosques [nativos]; y una compensación de carbono no reemplaza [reducir] emisiones.', ['mejora', 'artificiales', 'publicitar'], 'Tres ideas para plantar con criterio y sin dañar otros ecosistemas.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Medir y sostener', 'Indicadores, plazos largos, participación y por qué prevenir el daño es siempre más barato que restaurarlo.', [
      teoria('Qué medir', [
        'Una restauración se evalúa con indicadores que se comparan con la situación inicial y con el ecosistema de referencia. Por ejemplo: la cobertura de vegetación nativa, la cantidad de especies nativas, la supervivencia de lo plantado, la presencia de invasoras, la estructura en capas, el estado del suelo, y la llegada de fauna como aves, polinizadores o mamíferos. Medir permite corregir a tiempo y demostrar que el esfuerzo sirvió.',
      ]),
      par('Uní cada indicador con lo que muestra.', [ // e1
        ['Cobertura de vegetación nativa', 'Cuánto terreno ocupan las nativas'],
        ['Riqueza de especies', 'Cuántas especies nativas distintas hay'],
        ['Supervivencia de plantines', 'Si lo plantado prospera'],
        ['Presencia de invasoras', 'Si el control funciona'],
        ['Llegada de aves y polinizadores', 'Si vuelven las funciones del ecosistema'],
      ], 'Varios indicadores juntos cuentan la historia completa.', { d: 2 }),
      numv(3, (i) => { // e2
        const [ini, fin, ref] = [[10, 55, 80], [20, 50, 70], [5, 45, 90]][i];
        return {
          enunciado: `Un sitio tenía ${ini} % de cobertura nativa al empezar; hoy tiene ${fin} %. El ecosistema de referencia tiene ${ref} %. ¿Qué porcentaje del camino hacia la referencia se recorrió? Redondeá al entero.`,
          valor: Math.round(((fin - ini) / (ref - ini)) * 100),
          unidad: '%',
          tol: 1,
          explicacion: `(${fin} − ${ini}) ÷ (${ref} − ${ini}) × 100 ≈ ${Math.round(((fin - ini) / (ref - ini)) * 100)} %. Comparar con la referencia muestra cuánto falta, no solo cuánto se avanzó.`,
          ctx: `Inicio ${ini} %; hoy ${fin} %; referencia ${ref} %.`,
        };
      }, { d: 3 }),
      teoria('Plazos largos', [
        'Restaurar lleva mucho tiempo. Un pastizal puede recuperar su aspecto en pocos años, pero un bosque maduro necesita décadas o siglos. Los proyectos que duran uno o dos años y después se abandonan suelen fracasar: los plantines mueren sin riego, las invasoras vuelven, el ganado entra. Por eso hay que planificar el financiamiento, el cuidado y el monitoreo a largo plazo desde el principio.',
      ]),
      rank('Ordená estos ecosistemas según el tiempo que suele tardar su recuperación, de menor a mayor.', [ // e3
        ['Pastizal con buena fuente de semillas', 'pocos años'],
        ['Humedal al que se le devuelve el agua', 'años'],
        ['Bosque joven de crecimiento rápido', 'décadas'],
        ['Bosque maduro con árboles centenarios', 'siglos'],
      ], 'Cuanto más complejo y longevo el ecosistema, más tarda en volver.', { d: 2, extremos: ['Más rápido', 'Más lento'] }),
      cad('Armá la cadena de por qué fracasan muchas restauraciones de corto plazo.', [ // e4
        'Se planta mucho en un evento de un día',
        'No hay presupuesto para el riego y el cuidado',
        'Los plantines mueren en el primer verano seco',
        'Las invasoras vuelven a ocupar el lugar',
        'A los pocos años no queda casi nada',
      ], ['Los plantines crecen igual sin cuidado'], 'Plantar es el comienzo; cuidar es lo que hace que funcione.', { d: 1 }),
      teoria('Con la gente', [
        'Las restauraciones que duran suelen involucrar a las comunidades: vecinos que cuidan un bosque ribereño, escuelas con viveros de nativas, productores que ganan algo con la restauración (miel, sombra para el ganado, turismo), comunidades indígenas que aportan su conocimiento del lugar. Cuando la restauración tiene sentido para quienes viven allí, se sostiene.',
      ]),
      mult('¿Qué hace que una restauración se sostenga en el tiempo? Marcá todo.', [ // e5
        '+Financiamiento para el cuidado de varios años',
        '+Participación de la comunidad local',
        '+Monitoreo con indicadores',
        '+Beneficios para quienes viven allí',
        '-Un evento de plantación sin seguimiento',
      ], 'La restauración es un proceso largo, social y ecológico a la vez.', { d: 1 }),
      teoria('Prevenir es más barato', [
        'Restaurar es posible, pero caro y lento, y casi nunca devuelve todo lo perdido. Conservar un ecosistema en pie cuesta mucho menos que recuperarlo después. Por eso la restauración no es un permiso para dañar: es el último recurso, después de evitar la degradación.',
      ]),
      vf('Como los ecosistemas se pueden restaurar, no importa tanto desmontar hoy.', false, 'Restaurar es caro, lento y casi nunca devuelve todo lo perdido. Conservar es mucho más barato y efectivo; restaurar es el último recurso.', { // e6
        razones: ['+Porque restaurar es caro, lento e incompleto', '-Porque los ecosistemas no se pueden restaurar nunca', '-Porque desmontar ayuda a restaurar'],
        d: 2,
      }),
      numv(3, (i) => { // e7
        const [cons, rest] = [[50, 3000], [80, 2500], [30, 4000]][i];
        return {
          enunciado: `Conservar una hectárea de bosque cuesta unos ${cons} dólares por año y restaurar una degradada, unos ${rest.toLocaleString('es-AR')} dólares. ¿Cuántos años de conservación se pagan con lo que cuesta restaurar una hectárea?`,
          valor: rest / cons,
          unidad: 'años',
          explicacion: `${rest.toLocaleString('es-AR')} ÷ ${cons} = ${(rest / cons).toLocaleString('es-AR')} años. Valores de ejemplo: prevenir la degradación es, en general, mucho más barato.`,
          ctx: `Conservar ${cons} dólares por año; restaurar ${rest} dólares.`,
        };
      }, { d: 1 }),
      clas('¿Es un indicador de actividad o de resultado?', { // e7b
        'Actividad': ['Cantidad de árboles plantados', 'Cantidad de jornadas realizadas', 'Carteles instalados'],
        'Resultado': ['Supervivencia a los tres años', 'Cobertura de vegetación nativa', 'Aves que volvieron al lugar'],
      }, 'Los indicadores de resultado dicen si el ecosistema se recupera; los de actividad solo dicen qué se hizo.', { d: 2 }),
      det('Leé este informe de una restauración y marcá lo que conviene corregir.', [ // e8
        ['Medimos cobertura nativa, supervivencia e invasoras cada año.', false],
        ['Como plantamos 5.000 árboles, la restauración ya fue exitosa.', true, 'Plantar no es éxito: hay que medir supervivencia y recuperación.'],
        ['Comparamos los resultados con un ecosistema de referencia.', false],
        ['El proyecto termina este año, sin presupuesto para el cuidado.', true, 'Sin cuidado de largo plazo, lo plantado suele perderse.'],
      ], 'El éxito de una restauración se mide en lo que se recupera, no en lo que se planta.', { d: 2 }),
      comp('Completá.', 'Una restauración se evalúa con [indicadores]; un bosque maduro tarda [siglos] en recuperarse; y siempre es más barato [conservar] que restaurar.', ['opiniones', 'días', 'desmontar'], 'Tres ideas clave para medir y sostener una restauración.', { d: 1 }),
      op('Un municipio quiere mostrar resultados rápidos de su plan de restauración. ¿Qué indicador es más honesto a los tres años?', [ // e10
        'La supervivencia y la cobertura nativa lograda',
        'La cantidad de fotos del día de la plantación',
        ['El número de árboles comprados al vivero', 'Comprar no es lograr: muchos pueden haber muerto.'],
        'La cantidad de carteles instalados',
      ], 'Los indicadores de resultado dicen más que los de actividad.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: restaurar ecosistemas', 'Definiciones, regeneración natural, restauración activa, forestación y monitoreo, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: la ribera del arroyo', 'Un arroyo pampeano perdió su bosque de ribera: hay ligustros, ganado que entra al agua y orillas que se desmoronan. Armá el plan de restauración.', [
      teoria('La situación', [
        'El tramo tiene 3 km de orilla y una franja de 20 metros de ancho a recuperar a cada lado. Hoy hay ligustros invasores en la mitad del tramo, ganado que entra a tomar agua y pisotea la orilla, y casi no quedan árboles nativos, salvo unos talas aislados. Aguas arriba, a 5 km, hay un bosque ribereño bien conservado. Un vivero de la zona produce talas, sauces criollos, ceibos y otras nativas. El municipio tiene presupuesto para tres años.',
      ]),
      num('¿Cuántas hectáreas de ribera hay que recuperar? (3 km de largo, 20 m de ancho a cada lado; 1 ha = 10.000 m²)', 12, 'hectáreas', '3.000 m × 20 m × 2 lados = 120.000 m² = 12 hectáreas.', { ctx: '3.000 m de largo; 20 m por lado; dos lados.', d: 2 }),
      ord('Ordená las acciones del plan.', [ // e2
        'Tomar como referencia el bosque ribereño conservado aguas arriba',
        'Alambrar la franja y dar bebederos alternativos al ganado',
        'Controlar los ligustros adultos',
        'Plantar nativas del vivero en los claros',
        'Controlar rebrotes y medir avances cada año',
      ], 'Referencia, frenar el disturbio, sacar invasoras, plantar y sostener.', { d: 3 }),
      op('¿Por qué conviene dar bebederos alternativos al ganado en lugar de solo prohibirle el acceso?', [ // e3
        'Suma a los productores y protege el alambrado',
        'Porque el ganado ayuda a restaurar la orilla',
        ['Porque la ley obliga a que el ganado tome agua del arroyo', 'No existe esa obligación; se trata de sumar a los productores.'],
        'Porque los bebederos atraen ligustros',
      ], 'Las soluciones que resuelven también el problema del productor se sostienen mejor.', { d: 2 }),
      mult('¿Qué indicadores conviene medir cada año? Marcá todos.', [ // e4
        '+Supervivencia de los plantines',
        '+Cobertura de nativas y de ligustro',
        '+Estado de la orilla y erosión',
        '+Aves y polinizadores presentes',
        '-Cantidad de discursos en el acto inaugural',
      ], 'Indicadores de resultado, comparados con la referencia aguas arriba.', { d: 1 }),
      vf('Con los talas aislados y el bosque conservado aguas arriba, parte del tramo podría recuperarse por regeneración natural si se frena el ganado.', true, 'Hay fuentes de semillas y árboles que atraen aves: donde el suelo está bien, frenar el disturbio y controlar invasoras puede alcanzar. Plantar se reserva para donde haga falta.', { // e5
        razones: ['+Porque hay fuentes de semillas y árboles que atraen aves', '-Porque la regeneración natural nunca funciona', '-Porque el ganado dispersa las semillas nativas'],
        d: 3,
      }),
      num('Si se plantan 2.400 plantines y se espera una supervivencia del 70 %, ¿cuántos plantines se estima que sobrevivan?', 1680, 'plantines', '2.400 × 70 % = 1.680 plantines. Con riego inicial y protección, la supervivencia puede mejorar.', { ctx: '2.400 plantines; supervivencia del 70 %.', d: 1 }),
      det('El municipio redacta el plan. Marcá lo que conviene corregir.', [ // e7
        ['Usaremos talas, sauces criollos y ceibos del vivero local.', false],
        ['Plantaremos eucaliptos porque crecen rápido y fijan la orilla.', true, 'Son exóticos y consumen mucha agua: no es restauración.'],
        ['Controlaremos los rebrotes de ligustro durante los tres años.', false],
        ['Cortaremos los ligustros una sola vez y no volveremos.', true, 'Rebrotan: el control debe ser sostenido.'],
      ], 'Un buen plan combina referencia, especies correctas, control sostenido y medición.', { d: 3 }),
    ]),
  ],
});
