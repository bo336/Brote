import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// PLANTAS 1 — Cómo vive una planta.
// La base de la rama: las partes de una planta, cómo fabrica su alimento con
// luz, cómo toma agua y nutrientes, cómo crece y se reproduce, y por qué
// sostiene casi toda la vida del planeta. Retoma la materia que da vueltas y
// la energía del sol (tronco-1).

export default unidad({
  slug: 'plantas-1',
  rama: 'plantas',
  orden: 1,
  nivel: 1,
  requiereTronco: 1,
  titulo: 'Cómo vive una planta',
  bajada: 'Una planta fabrica su comida con luz, aire y agua. Sus partes, cómo se alimenta, cómo crece y por qué sostiene casi toda la vida.',
  objetivos: [
    'Identificar las partes de una planta y la función de cada una',
    'Explicar la fotosíntesis y la respiración de las plantas',
    'Describir cómo una planta toma y mueve el agua y los nutrientes',
    'Seguir el ciclo de vida de una planta con flor',
    'Reconocer el papel de las plantas en la vida del planeta',
  ],
  repasa: ['tronco-1'],
  fuentes: ['bar-on-biomasa-2018', 'fao-suelos', 'ipbes-global', 'plantas-nativas', 'inta'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Las partes de una planta', 'Raíz, tallo, hojas, flores, frutos y semillas: cada parte tiene un trabajo.', [
      teoria('Un cuerpo con divisiones de trabajo', [
        'Una planta con flor tiene partes especializadas. La raíz la sujeta al suelo y absorbe agua y nutrientes. El tallo la sostiene y transporta agua y alimento entre la raíz y las hojas. Las hojas fabrican el alimento con la luz del sol. Las flores sirven para reproducirse; de ellas salen los frutos, que protegen y ayudan a dispersar las semillas.',
        'Cada parte depende de las otras: sin hojas no hay alimento para la raíz, y sin raíz no hay agua para las hojas.',
      ]),
      par('Uní cada parte de la planta con su función principal.', [ // e1
        ['Raíz', 'Absorber agua y sujetar la planta'],
        ['Tallo', 'Sostener y transportar'],
        ['Hoja', 'Fabricar alimento con luz'],
        ['Flor', 'Reproducirse'],
      ], 'Una división del trabajo que funciona como un equipo.', { d: 1 }),
      teoria('Partes que comemos', [
        'Muchos de nuestros alimentos son partes de plantas. De la papa comemos un tallo subterráneo engrosado (un tubérculo); de la zanahoria, una raíz; de la lechuga, hojas; del brócoli, flores sin abrir; del tomate, un fruto; de los porotos, semillas.',
        'Saber qué parte comemos ayuda a entender cómo se cultiva cada alimento y por qué algunos se conservan más que otros.',
      ]),
      clas('¿Qué parte de la planta comemos en cada caso?', { // e2
        'Raíz': ['Zanahoria', 'Batata'],
        'Hoja': ['Lechuga', 'Acelga'],
        'Fruto': ['Tomate', 'Zapallo'],
        'Semilla': ['Lentejas', 'Maní'],
      }, 'La verdulería es una clase de botánica. Y la papa, aunque crezca bajo tierra, es un tallo, no una raíz.', { d: 2 }),
      vf('La papa es una raíz.', false, 'Es un tallo subterráneo engrosado, llamado tubérculo. Tiene "ojos", que son yemas de donde brotan tallos nuevos, algo que las raíces no tienen.', { // e3
        razones: ['+Porque tiene yemas ("ojos") de donde brotan tallos', '-Porque crece dentro de la tierra', '-Porque no tiene hojas'],
        d: 3,
      }),
      teoria('Las hojas, fábricas planas', [
        'Las hojas suelen ser planas y anchas para captar mucha luz. En su superficie tienen poros microscópicos, los estomas, por donde entra el dióxido de carbono del aire y sale oxígeno y vapor de agua. Las nervaduras son los caños que llevan agua a la hoja y sacan el alimento que fabrica.',
        'En zonas secas, muchas plantas tienen hojas chicas, gruesas o convertidas en espinas, como los cactus, para perder menos agua.',
      ]),
      op('¿Por qué los cactus tienen espinas en lugar de hojas anchas?', [ // e4
        'Para perder menos agua en climas secos',
        'Para hacer más fotosíntesis que otras plantas',
        ['Para atraer a los insectos polinizadores', 'Las espinas pueden defender, pero su origen tiene que ver con perder menos agua.'],
        'Porque no necesitan luz para vivir',
      ], 'Menos superficie, menos evaporación. En los cactus, el tallo verde hace la fotosíntesis.', { d: 2 }),
      mult('¿Qué pasa a través de los estomas de una hoja? Marcá todo lo correcto.', [ // e5
        '+Entra dióxido de carbono',
        '+Sale oxígeno',
        '+Sale vapor de agua',
        '-Entra tierra del suelo',
        '-Salen las semillas',
      ], 'Los estomas son las puertas de la hoja al aire. Por ahí entra la materia prima de la fotosíntesis.', { d: 2 }),
      cad('Armá la cadena de trabajo en equipo de una planta.', [ // e6
        'La raíz absorbe agua del suelo',
        'El tallo la lleva hasta las hojas',
        'Las hojas fabrican azúcares con luz',
        'El tallo reparte los azúcares a toda la planta',
        'La raíz usa parte de ese alimento para crecer',
      ], ['La raíz fabrica el alimento con la luz del sol'], 'Agua hacia arriba, alimento hacia todos lados. Un sistema de transporte en dos direcciones.', { d: 2 }),
      par('Uní cada alimento con la parte de la planta que es.', [ // e7
        ['Papa', 'Tallo subterráneo'],
        ['Brócoli', 'Flores sin abrir'],
        ['Apio', 'Pecíolo de la hoja'],
        ['Choclo', 'Semillas'],
      ], 'Algunos alimentos engañan. El apio es el "palito" que une la hoja al tallo.', { d: 3 }),
      det('Leé esta explicación de un chico y marcá lo equivocado.', [ // e8
        ['Las raíces absorben agua del suelo.', false],
        ['Las hojas sirven solo para dar sombra.', true, 'Las hojas fabrican el alimento de la planta con la fotosíntesis.'],
        ['El tomate es un fruto.', false],
        ['Las flores no sirven para nada, son decoración.', true, 'Las flores son el órgano de reproducción de la planta.'],
      ], 'Cada parte tiene una función vital. Ninguna está de adorno.', { d: 1 }),
      comp('Completá.', 'La [raíz] absorbe agua, las [hojas] fabrican el alimento y las [flores] sirven para reproducirse.', ['semillas', 'espinas', 'nervaduras'], 'Tres partes, tres trabajos, en una sola línea.', { d: 1 }),
      rank('Ordená estas partes de una planta de abajo hacia arriba en un árbol típico.', [ // e10
        ['Raíces', 'bajo tierra'],
        ['Tronco', 'desde el suelo'],
        ['Ramas', 'salen del tronco'],
        ['Hojas y flores', 'en la copa'],
      ], 'Una estructura que va del suelo a la luz. Por eso los árboles pueden crecer tan alto: compiten por el sol.', { d: 1, extremos: ['Abajo', 'Arriba'] }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Fotosíntesis y respiración', 'Cómo una planta convierte luz, aire y agua en alimento, y por qué también respira.', [
      teoria('La receta de la fotosíntesis', [
        'En las hojas, la clorofila —el pigmento verde— captura la luz del sol. Con esa energía, la planta combina el dióxido de carbono del aire con el agua que trae de la raíz y fabrica azúcares. Como resultado, libera oxígeno.',
        'Dicho en una línea: dióxido de carbono + agua + luz → azúcares + oxígeno. Lo que la planta "come" es luz y aire.',
      ], { destacado: { valor: 'CO₂ + agua + luz', texto: 'se convierten en azúcares y oxígeno. Esa es la fotosíntesis.' } }),
      mult('¿Qué necesita una planta para hacer fotosíntesis? Marcá todo.', [ // e1
        '+Luz',
        '+Dióxido de carbono',
        '+Agua',
        '+Clorofila',
        '-Oxígeno del suelo',
      ], 'Luz como energía, CO₂ y agua como materias primas, y clorofila para capturar la luz.', { d: 1 }),
      teoria('De dónde sale el peso de un árbol', [
        'Una pregunta famosa: si un árbol pesa toneladas, ¿de dónde salió toda esa materia? No sale de la tierra: si se pesa la tierra de una maceta antes y después de que crezca un árbol, casi no cambia. Sale del aire.',
        'La madera está hecha sobre todo de carbono que la planta tomó del CO₂ del aire, más el agua. Un árbol es, en buena parte, aire convertido en sólido.',
      ]),
      op('¿De dónde viene la mayor parte de la materia de un árbol?', [ // e2
        'Del dióxido de carbono del aire, más agua',
        'De la tierra que absorbe por las raíces',
        ['De los fertilizantes que se le agregan', 'Los nutrientes del suelo son importantes, pero pesan muy poco comparados con el carbono del aire.'],
        'De la luz del sol convertida en madera',
      ], 'La luz aporta la energía, no la materia. La materia viene del CO₂ y del agua.', { d: 3 }),
      vf('Un árbol crece "comiendo" la tierra de su maceta, por eso la maceta pierde mucho peso.', false, 'La tierra casi no pierde peso. La materia del árbol viene sobre todo del CO₂ del aire y del agua. Del suelo toma nutrientes, que pesan poco.', { // e3
        razones: ['+Porque su materia viene sobre todo del CO₂ del aire y del agua', '-Porque el árbol no tiene raíces', '-Porque la tierra de la maceta se evapora'],
        d: 3,
      }),
      teoria('Las plantas también respiran', [
        'Además de hacer fotosíntesis, las plantas respiran todo el tiempo, de día y de noche: usan parte de los azúcares que fabricaron para obtener energía, y en ese proceso toman oxígeno y liberan CO₂, como los animales.',
        'Durante el día, una planta sana hace mucha más fotosíntesis que respiración, así que en total absorbe CO₂ y libera oxígeno. De noche, sin luz, solo respira.',
      ]),
      clas('¿Esto ocurre en la fotosíntesis o en la respiración?', { // e4
        'Fotosíntesis': ['Se usa la luz del sol', 'Se fabrica azúcar', 'Se libera oxígeno'],
        'Respiración': ['Se usa azúcar para obtener energía', 'Se libera CO₂', 'Ocurre también de noche'],
      }, 'Son procesos opuestos. En el balance de un día, una planta que crece fabrica más de lo que gasta.', { d: 2 }),
      cad('Armá el camino del carbono desde el aire hasta tu cuerpo.', [ // e5
        'Hay CO₂ en el aire',
        'Una planta de trigo lo toma por sus estomas',
        'Lo convierte en almidón en sus granos',
        'Comés pan hecho con esa harina',
        'Tu cuerpo usa ese carbono para vivir y exhala CO₂',
      ], ['El carbono se destruye cuando lo comés'], 'El carbono da vueltas, como viste en el tronco: del aire a la planta, de la planta a vos, y de vos otra vez al aire.', { d: 2 }),
      teoria('Casi toda la vida depende de esto', [
        'La fotosíntesis es la puerta de entrada de la energía del sol a casi todos los seres vivos. Además, produjo durante millones de años el oxígeno de la atmósfera. Hoy, alrededor de la mitad del oxígeno que se produce en el planeta lo generan algas microscópicas del océano, el fitoplancton; la otra mitad, las plantas terrestres.',
      ]),
      est('Estimá qué porcentaje del oxígeno que se produce en el planeta viene del fitoplancton del océano.', 50, { min: 0, max: 100, paso: 5, unidad: '%' }, 'Alrededor de la mitad. Las selvas son importantes, pero el océano es un pulmón tan grande como ellas.', { d: 2 }),
      vf('De noche, las plantas liberan CO₂.', true, 'Sin luz no hay fotosíntesis, pero la respiración sigue. Por eso de noche una planta libera CO₂. En todo el día, si crece, absorbe más de lo que libera.', { // e7
        razones: ['+Porque de noche solo respiran, sin fotosíntesis', '-Porque de noche hacen más fotosíntesis', '-Porque de noche absorben oxígeno para fabricar azúcar'],
        d: 2,
      }),
      det('Leé esta explicación y marcá lo equivocado.', [ // e8
        ['La clorofila captura la luz del sol.', false],
        ['Las plantas solo respiran de noche.', true, 'Respiran todo el tiempo; de día la fotosíntesis supera a la respiración.'],
        ['La fotosíntesis libera oxígeno.', false],
        ['La madera de un árbol viene de la tierra de la maceta.', true, 'Viene sobre todo del CO₂ del aire y del agua.'],
      ], 'Fotosíntesis y respiración conviven. El aire es la materia prima principal.', { d: 3 }),
      comp('Completá.', 'En la fotosíntesis, la planta usa [luz], dióxido de carbono y agua para fabricar [azúcares] y liberar [oxígeno].', ['sombra', 'proteínas', 'nitrógeno'], 'La receta básica de casi toda la vida en la Tierra.', { d: 1 }),
      rank('Ordená estos tipos de vida según cuánta biomasa tienen en la Tierra, de más a menos (en carbono).', [ // e10
        ['Plantas', '≈ 80 % de la biomasa'],
        ['Bacterias', '≈ 13 %'],
        ['Animales', '≈ 0,4 %'],
      ], 'Las plantas son, por lejos, la mayor parte de la vida del planeta medida en carbono. Los animales, incluidas las personas, somos una parte mínima.', { d: 3 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Agua y nutrientes', 'Cómo sube el agua por un árbol de 30 metros sin bomba, qué comen las raíces y quiénes las ayudan.', [
      teoria('Un caño de la raíz a la hoja', [
        'El agua entra por los pelos absorbentes de la raíz y sube por unos conductos del tallo llamados xilema, hasta las hojas. Allí, casi toda se evapora por los estomas. Esa evaporación, la transpiración, "tira" del agua hacia arriba como cuando se sorbe con una bombilla.',
        'La mayor parte del agua que absorbe una planta, más del 90 %, se va por transpiración. Solo una parte chica queda en la planta o se usa en la fotosíntesis.',
      ], { destacado: { valor: '> 90 %', texto: 'del agua que absorbe una planta se evapora por las hojas: la transpiración.' } }),
      op('¿Qué hace subir el agua desde la raíz hasta las hojas de un árbol alto?', [ // e1
        'La evaporación en las hojas, que lo tira',
        'Un corazón que bombea savia dentro del tronco',
        ['La gravedad que empuja el agua hacia arriba', 'La gravedad tira hacia abajo: el agua sube porque las hojas la "sorben".'],
        'El viento que sopla sobre el tronco del árbol',
      ], 'Las plantas no tienen bomba: la transpiración funciona como una bombilla gigante.', { d: 2 }),
      numv(3, (i) => { // e2
        const l = [200, 100, 400][i];
        return {
          enunciado: `Un árbol absorbe ${l} litros de agua en un día de verano. Si el 95 % se evapora por las hojas, ¿cuántos litros transpira?`,
          valor: (l * 95) / 100,
          unidad: 'litros',
          explicacion: `${l} × 95 ÷ 100 = ${(l * 95) / 100} litros. Por eso un árbol refresca el aire a su alrededor: el agua que evapora se lleva calor.`,
        };
      }, { d: 2 }),
      teoria('Los nutrientes del suelo', [
        'Además de agua, las raíces toman del suelo nutrientes minerales disueltos. Los que la planta necesita en más cantidad son el nitrógeno (para crecer hojas y tallos), el fósforo (para raíces, flores y semillas) y el potasio (para resistir enfermedades y la falta de agua). Por eso muchos fertilizantes dicen "N-P-K".',
        'También necesitan en menores cantidades calcio, magnesio, hierro y otros. Una planta con hojas amarillas puede estar mostrando que le falta alguno.',
      ]),
      par('Uní cada nutriente con su función principal.', [ // e3
        ['Nitrógeno (N)', 'Crecimiento de hojas y tallos'],
        ['Fósforo (P)', 'Raíces, flores y semillas'],
        ['Potasio (K)', 'Resistencia a enfermedades y sequía'],
      ], 'N-P-K: las tres letras de cualquier bolsa de fertilizante.', { d: 2 }),
      teoria('Aliados bajo tierra', [
        'Las raíces no trabajan solas. La mayoría de las plantas terrestres se asocia con hongos llamados micorrizas: los hongos extienden redes finísimas en el suelo que llegan a agua y nutrientes que la raíz sola no alcanzaría, y a cambio reciben azúcares de la planta.',
        'Las legumbres, como porotos, arvejas y soja, se asocian con bacterias que viven en nódulos de sus raíces y toman nitrógeno del aire para convertirlo en nutriente. Por eso enriquecen el suelo.',
      ]),
      clas('¿Qué hace cada aliado de las raíces?', { // e4
        'Hongos micorrícicos': ['Extienden redes que llegan a más agua', 'Ayudan a tomar fósforo del suelo'],
        'Bacterias de las legumbres': ['Toman nitrógeno del aire', 'Viven en nódulos de las raíces'],
      }, 'Dos alianzas antiguas. Las dos se basan en un intercambio: la planta paga con azúcares.', { d: 2 }),
      vf('Las legumbres pueden aportar nitrógeno al suelo.', true, 'Gracias a bacterias de sus raíces que toman nitrógeno del aire. Por eso se usan en rotaciones de cultivos y en huertas.', { // e5
        razones: ['+Por las bacterias de sus raíces que toman nitrógeno del aire', '-Porque sus hojas absorben nitrógeno de la lluvia', '-Porque el nitrógeno sale de sus semillas al germinar'],
        d: 2,
      }),
      cad('Armá la cadena de por qué una planta se marchita un día de mucho calor.', [ // e6
        'Hace mucho calor y el aire está seco',
        'Las hojas transpiran mucha agua',
        'La raíz no alcanza a absorber tanta del suelo seco',
        'Las células pierden agua y la planta se ablanda',
      ], ['El calor le quita la clorofila a las hojas'], 'Es un problema de balance: sale más agua de la que entra. Regar temprano o a la tarde, y el mulch, ayudan.', { d: 2 }),
      mult('¿Qué señales pueden indicar que a una planta le falta agua? Marcá todas.', [ // e7
        '+Hojas caídas o blandas',
        '+Bordes de las hojas secos y quebradizos',
        '+Tierra seca varios centímetros abajo',
        '-Tierra encharcada y con olor feo',
        '-Hojas firmes y brillantes',
      ], 'Ojo: el encharcamiento también puede marchitar, porque las raíces se ahogan sin oxígeno. Por eso hay que tocar la tierra antes de regar.', { d: 2 }),
      op('Una planta tiene la tierra encharcada y las hojas caídas. ¿Qué conviene hacer?', [ // e8
        'Dejar de regar y mejorar el drenaje',
        'Regarla más porque está marchita',
        ['Ponerla al sol fuerte todo el día para que absorba', 'El problema es el exceso de agua: las raíces no tienen oxígeno.'],
        'Agregarle mucho fertilizante',
      ], 'Las raíces también respiran. En tierra encharcada se ahogan y no pueden absorber agua, aunque haya de sobra.', { d: 3 }),
      det('Leé estos consejos de jardinería y marcá los equivocados.', [ // e9
        ['Tocá la tierra antes de regar.', false],
        ['Si la planta está marchita, regala siempre más.', true, 'Puede estar marchita por exceso de agua: primero hay que revisar la tierra.'],
        ['Las legumbres ayudan a enriquecer el suelo con nitrógeno.', false],
        ['Cuanto más fertilizante, mejor crece la planta.', true, 'El exceso de fertilizante puede quemar raíces y contaminar el agua.'],
      ], 'Observar antes de actuar: la misma señal puede tener causas opuestas.', { d: 3 }),
      comp('Completá.', 'El agua sube por el [xilema] gracias a la [transpiración] de las hojas; los tres nutrientes principales son nitrógeno, fósforo y [potasio].', ['floema', 'gravedad', 'oxígeno'], 'El transporte del agua y los nutrientes, resumidos en una línea.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('De la semilla a la semilla', 'Germinar, crecer, florecer, ser polinizada, dar frutos y dispersar semillas: el ciclo de vida de una planta con flor.', [
      teoria('Una semilla es una planta dormida', [
        'Una semilla tiene adentro un embrión —una plantita en miniatura— y una reserva de alimento, protegidos por una cubierta. Puede esperar meses o años hasta que haya condiciones adecuadas: humedad, temperatura y, en algunas especies, luz.',
        'Cuando germina, primero sale la raíz, que busca agua y sujeta la plántula, y después el tallito con las primeras hojas, que buscan la luz. Hasta que las hojas empiezan a hacer fotosíntesis, la plantita vive de la reserva de la semilla.',
      ]),
      ord('Ordená los pasos de la germinación de un poroto.', [ // e1
        'La semilla absorbe agua y se hincha',
        'Se rompe la cubierta',
        'Sale la raíz hacia abajo',
        'Sale el tallito hacia arriba',
        'Aparecen las primeras hojas y empieza la fotosíntesis',
      ], 'La raíz sale primero: sin agua no hay crecimiento posible.', { d: 1, extremos: ['Primero', 'Último'] }),
      teoria('Flores y polinización', [
        'Cuando la planta madura, florece. En la flor, el polen (con las células masculinas) tiene que llegar al pistilo (la parte femenina) de otra flor o de la misma. Eso es la polinización. Después, el óvulo fecundado se convierte en semilla y la base de la flor, en fruto.',
        'El polen viaja con el viento o, muy a menudo, con animales: abejas, mariposas, moscas, escarabajos, picaflores y hasta murciélagos. Los colores, los perfumes y el néctar de las flores son invitaciones para esos polinizadores.',
      ]),
      cad('Armá la cadena de cómo una abeja ayuda a que haya un zapallo.', [ // e2
        'La abeja visita una flor macho de zapallo y se carga de polen',
        'Vuela a una flor hembra',
        'Deja el polen en el pistilo',
        'La flor es fecundada',
        'La base de la flor crece y se convierte en zapallo',
      ], ['La abeja fabrica el zapallo con su miel'], 'Sin polinización no hay fruto. Por eso los polinizadores son tan importantes para la comida, como vas a ver en esta rama.', { d: 2 }),
      par('Uní cada característica de una flor con el polinizador que suele atraer.', [ // e3
        ['Flores rojas con tubo largo y mucho néctar', 'Picaflores'],
        ['Flores blancas y perfumadas que abren de noche', 'Polillas'],
        ['Flores chicas, sin pétalos vistosos, con mucho polen suelto', 'El viento'],
        ['Flores amarillas o azules con pista de aterrizaje', 'Abejas'],
      ], 'Las flores evolucionaron junto a sus polinizadores. Su forma es un "aviso" para el visitante correcto.', { d: 3 }),
      teoria('Viajar sin moverse', [
        'Las plantas no caminan, pero sus semillas viajan. Algunas vuelan con el viento, como las del panadero (el diente de león) o las de la tipa, que tienen alas. Otras viajan dentro de frutos carnosos que comen los animales y después las dejan en otro lugar con sus excrementos. Otras flotan, se enganchan en el pelo de los animales o son lanzadas cuando el fruto se abre de golpe.',
        'Dispersar las semillas lejos evita que las plantas hijas compitan con la madre por luz y agua, y permite colonizar lugares nuevos.',
      ]),
      clas('¿Cómo viaja cada semilla?', { // e4
        'Con el viento': ['Semilla alada de la tipa', 'Pelusa del panadero'],
        'Con animales que comen el fruto': ['Semillas de la mora', 'Semillas del tala'],
        'Enganchada en el pelo o la ropa': ['Abrojo', 'Cadillo'],
      }, 'Cada forma de semilla es una estrategia de viaje. Mirarla dice mucho de cómo se dispersa.', { d: 2 }),
      vf('Las plantas no necesitan a los animales para reproducirse en ningún caso.', false, 'Muchísimas plantas dependen de animales para la polinización o para dispersar sus semillas. Algunas usan el viento, pero una gran parte necesita animales.', { // e5
        razones: ['+Porque muchas dependen de animales para polinizarse o dispersarse', '-Porque todas las plantas se polinizan solas con el viento', '-Porque las semillas caminan hasta un lugar nuevo'],
        d: 2,
      }),
      teoria('Ciclos cortos y largos', [
        'Algunas plantas completan su ciclo en un año o menos (anuales), como el maíz o la albahaca. Otras tardan dos años (bienales), como la zanahoria si se la deja florecer. Y otras viven muchos años (perennes), como los árboles, que pueden vivir siglos.',
      ]),
      clas('¿Es anual o perenne?', { // e6
        'Anual': ['Maíz', 'Albahaca', 'Girasol'],
        'Perenne': ['Ombú', 'Algarrobo', 'Jacarandá'],
      }, 'Las anuales apuestan todo a las semillas; las perennes, a durar.', { d: 1 }),
      numv(3, (i) => { // e7
        const s = [200, 500, 50][i];
        const g = [80, 60, 90][i];
        return {
          enunciado: `Se siembran ${s} semillas y germina el ${g} %. ¿Cuántas plantitas nacen?`,
          valor: (s * g) / 100,
          unidad: 'plantitas',
          explicacion: `${s} × ${g} ÷ 100 = ${(s * g) / 100}. Nunca germinan todas: por eso se siembra de más y después se ralea.`,
        };
      }, { d: 1 }),
      det('Leé esta explicación y marcá lo equivocado.', [ // e8
        ['La semilla tiene un embrión y reservas de alimento.', false],
        ['Al germinar, primero salen las hojas y después la raíz.', true, 'Primero sale la raíz, para tomar agua y sujetarse.'],
        ['El fruto se forma a partir de la flor.', false],
        ['Las plantas no pueden mover sus semillas a otro lugar.', true, 'Las dispersan con el viento, el agua o los animales.'],
      ], 'Un ciclo completo: de la semilla a la planta, de la flor al fruto y de nuevo a la semilla.', { d: 2 }),
      comp('Completá.', 'El traslado del polen de una flor a otra se llama [polinización]; después la flor se convierte en [fruto], que protege las [semillas].', ['germinación', 'raíz', 'hojas'], 'El corazón del ciclo de vida de una planta con flor.', { d: 1 }),
      op('¿Por qué a muchas plantas les conviene que sus semillas viajen lejos?', [ // e10
        'Para no competir con la madre y llegar a lugares nuevos',
        'Porque las semillas no pueden germinar cerca del suelo',
        ['Porque la planta madre se come a las semillas cercanas', 'Las plantas no comen semillas: el problema es la competencia por luz y agua.'],
        'Para que los animales no las encuentren nunca',
      ], 'Dispersarse es una forma de sobrevivir y expandirse sin poder caminar.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Las plantas y nosotros', 'Comida, oxígeno, sombra, agua, medicinas y carbono: todo lo que las plantas hacen por las personas.', [
      teoria('La base de todo', [
        'Las plantas son la base de casi todas las cadenas alimentarias: toda la comida que existe viene de plantas directamente o de animales que comieron plantas. Además, producen oxígeno, guardan carbono, forman y protegen el suelo, regulan el agua y el clima, y dan madera, fibras y medicinas.',
        'Medidas en carbono, las plantas son alrededor del 80 % de toda la biomasa de la Tierra. Los animales, incluidas las personas, son una parte muy chica.',
      ]),
      mult('¿Qué hacen las plantas por las personas? Marcá todo lo que corresponde.', [ // e1
        '+Producen alimentos',
        '+Liberan oxígeno',
        '+Guardan carbono',
        '+Protegen el suelo de la erosión',
        '+Dan madera, fibras y medicinas',
        '-Fabrican petróleo en pocos años',
      ], 'Las plantas hacen casi todo lo que necesitamos para vivir. El petróleo viene de restos de seres vivos de hace millones de años, no de plantas actuales.', { d: 1 }),
      teoria('Guardar carbono', [
        'Mientras crece, un árbol va guardando carbono en su tronco, sus ramas y sus raíces. Un árbol adulto puede absorber del orden de decenas de kilos de CO₂ por año, según la especie, el tamaño y el clima. Los bosques y los suelos guardan enormes cantidades de carbono.',
        'Cuando un bosque se quema o se desmonta, ese carbono vuelve al aire como CO₂. Por eso proteger los bosques que ya existen es una de las formas más efectivas de cuidar el clima.',
      ]),
      numv(3, (i) => { // e2
        const arboles = [100, 500, 1000][i];
        const kg = [20, 25, 15][i];
        return {
          enunciado: `Un barrio tiene ${arboles.toLocaleString('es-AR')} árboles adultos que absorben, en promedio, ${kg} kg de CO₂ por año cada uno. ¿Cuántas toneladas de CO₂ absorben por año?`,
          valor: (arboles * kg) / 1000,
          unidad: 'toneladas de CO₂',
          dec: 1,
          explicacion: `${arboles.toLocaleString('es-AR')} × ${kg} = ${(arboles * kg).toLocaleString('es-AR')} kg = ${((arboles * kg) / 1000).toLocaleString('es-AR')} t. Ayuda, pero es poco comparado con las emisiones de un barrio: plantar no reemplaza reducir.`,
        };
      }, { d: 2 }),
      vf('Plantar árboles alcanza para compensar todas las emisiones de una ciudad.', false, 'Los árboles absorben CO₂, pero muchísimo menos de lo que emite una ciudad. Plantar ayuda y tiene muchos otros beneficios, pero no reemplaza reducir emisiones.', { // e3
        razones: ['+Porque absorben mucho menos de lo que emite una ciudad', '-Porque los árboles no absorben CO₂', '-Porque los árboles emiten más de lo que absorben'],
        d: 2,
      }),
      teoria('Sombra, agua y suelo', [
        'Un árbol en la vereda da sombra y, con la transpiración, refresca el aire; en verano, la temperatura bajo un árbol puede ser varios grados más baja que al sol. Las raíces sujetan el suelo y ayudan a que la lluvia se infiltre en vez de escurrir. Las hojas que caen alimentan el suelo.',
        'Todo esto se llama servicios ecosistémicos: beneficios que la naturaleza da gratis y que, si se pierden, cuesta muchísimo reemplazar.',
      ]),
      par('Uní cada servicio de un árbol con cómo lo hace.', [ // e4
        ['Refrescar el aire', 'Sombra y transpiración'],
        ['Evitar inundaciones', 'Raíces que ayudan a infiltrar la lluvia'],
        ['Proteger el suelo', 'Raíces que lo sujetan'],
        ['Cuidar el clima', 'Guardar carbono en la madera'],
      ], 'Un solo árbol hace muchos trabajos a la vez. En la rama vas a ver cómo se aprovecha en las ciudades.', { d: 2 }),
      cad('Armá la cadena de qué pasa cuando se tala un bosque en una ladera.', [ // e5
        'Se cortan los árboles de la ladera',
        'Las raíces dejan de sujetar el suelo',
        'La lluvia arrastra la tierra',
        'El suelo se erosiona y los ríos se llenan de sedimento',
      ], ['La lluvia deja de caer en la ladera'], 'Los efectos viajan, como en el tronco: del bosque al suelo, y del suelo al río.', { d: 2 }),
      teoria('Medicinas y materiales', [
        'Muchos medicamentos tienen origen en plantas. La aspirina se desarrolló a partir de una sustancia de la corteza del sauce; la quinina, contra la malaria, viene de la corteza del árbol de la quina. En Argentina, muchas plantas nativas tienen usos tradicionales, como la marcela, la peperina o el cedrón.',
        'También vienen de plantas la madera, el papel, el algodón, el lino, el corcho y muchos otros materiales.',
      ]),
      clas('¿Este material o producto viene de plantas o no?', { // e6
        'Viene de plantas': ['El papel', 'El algodón de una remera', 'El corcho de una botella'],
        'No viene de plantas': ['El vidrio de un frasco', 'El aluminio de una lata', 'La lana de oveja'],
      }, 'Muchos objetos cotidianos son plantas transformadas. La lana viene de un animal, que comió plantas.', { d: 1 }),
      op('¿Por qué proteger un bosque que ya existe suele ser mejor para el clima que plantar uno nuevo?', [ // e7
        'Porque ya guarda mucho carbono y biodiversidad',
        'Porque los árboles jóvenes no hacen fotosíntesis',
        ['Porque plantar árboles aumenta las emisiones', 'Plantar bien hecho ayuda; lo que pasa es que un bosque nuevo tarda décadas en igualar al viejo.'],
        'Porque los bosques viejos no necesitan agua',
      ], 'Un bosque maduro tardó siglos en acumular su carbono y su diversidad. Si se pierde, recuperarlo lleva décadas o más.', { d: 3 }),
      rank('Ordená estos grupos por su biomasa en la Tierra, de más a menos (en carbono).', [ // e8
        ['Plantas', '≈ 450 gigatoneladas de carbono'],
        ['Hongos', '≈ 12 gigatoneladas'],
        ['Animales', '≈ 2 gigatoneladas'],
        ['Personas', '≈ 0,06 gigatoneladas'],
      ], 'Las personas somos una parte mínima de la vida del planeta, pero con un impacto enorme sobre las otras.', { d: 3 }),
      det('Leé esta nota y marcá lo equivocado.', [ // e9
        ['Las plantas son la base de casi todas las cadenas alimentarias.', false],
        ['Plantar árboles es suficiente para frenar el cambio climático.', true, 'Ayuda, pero no reemplaza reducir las emisiones.'],
        ['La aspirina se desarrolló a partir de una sustancia del sauce.', false],
        ['Talar un bosque no afecta a los ríos.', true, 'Sin bosque, el suelo se erosiona y los ríos reciben sedimentos.'],
      ], 'Las plantas hacen muchísimo, y justamente por eso no se las puede cargar con todo.', { d: 2 }),
      comp('Completá.', 'Los beneficios que la naturaleza da gratis se llaman servicios [ecosistémicos]; las plantas son cerca del [80] % de la biomasa de la Tierra.', ['municipales', '8', '20'], 'Dos ideas para dimensionar la importancia de las plantas.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: cómo vive una planta', 'Partes, fotosíntesis, agua, ciclo de vida y servicios, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el potus de Martina', 'Martina tiene una planta que no anda bien. Con lo que aprendiste, hacé el diagnóstico. Aprobalo para hacer crecer la rama.', [
      teoria('La planta de Martina', [
        'Martina tiene un potus en una maceta sin agujeros, en un rincón oscuro del living. Lo riega un vaso grande todos los días "para que no le falte". Las hojas de abajo están amarillas, la tierra tiene olor feo y hay hongos blancos en la superficie.',
        'Su abuela le dice que le ponga mucho fertilizante para que se recupere.',
      ]),
      op('¿Cuál es el problema principal del potus?', [ // e1
        'Exceso de agua: las raíces se ahogan sin oxígeno',
        'Le falta agua porque la maceta es chica',
        ['Le falta fertilizante', 'Con la tierra encharcada, el problema no son los nutrientes: las raíces no pueden funcionar.'],
        'Hace demasiado frío en el living',
      ], 'Tierra con olor feo, hongos y hojas amarillas en una maceta sin drenaje: raíces ahogadas.', { d: 3 }),
      cad('Armá la cadena de lo que le pasa al potus.', [ // e2
        'La maceta no tiene agujeros y se riega todos los días',
        'El agua se acumula en el fondo',
        'Las raíces quedan sin oxígeno',
        'Las raíces se pudren y no absorben bien',
        'Las hojas se ponen amarillas',
      ], ['El agua sube por las hojas y las vuelve amarillas'], 'Paradójicamente, una planta con raíces ahogadas puede no conseguir el agua que tiene de sobra.', { d: 3 }),
      mult('¿Qué debería hacer Martina? Marcá todo lo que ayuda.', [ // e3
        '+Pasarlo a una maceta con agujeros de drenaje',
        '+Regar solo cuando la tierra esté seca unos centímetros abajo',
        '+Moverlo a un lugar con más luz, sin sol directo fuerte',
        '+Cortar las raíces podridas al trasplantar',
        '-Agregarle mucho fertilizante ya',
      ], 'Drenaje, riego según la tierra y luz. El fertilizante, más adelante y en poca dosis, si hace falta.', { d: 3 }),
      vf('El consejo de la abuela de poner mucho fertilizante ayudaría a que el potus se recupere rápido.', false, 'Con raíces dañadas, mucho fertilizante puede quemarlas todavía más. Primero hay que resolver el agua y el drenaje.', { // e4
        razones: ['+Porque con raíces dañadas el exceso de fertilizante las quema más', '-Porque los potus no usan nutrientes', '-Porque el fertilizante tapa los agujeros de la maceta'],
        d: 3,
      }),
      numv(3, (i) => { // e5
        const ml = [250, 300, 200][i];
        return {
          enunciado: `Martina regaba un vaso de ${ml} ml por día. Si pasa a regar solo una vez por semana con la misma cantidad, ¿cuántos ml por semana deja de agregar?`,
          valor: ml * 6,
          unidad: 'ml',
          explicacion: `Antes: ${ml} × 7 = ${ml * 7} ml por semana. Ahora: ${ml}. Deja de agregar ${ml * 6} ml. Para una planta de interior con poca luz, eso es mucho más razonable.`,
        };
      }, { d: 2 }),
      det('Martina escribe su plan. Marcá lo que no conviene.', [ // e6
        ['Trasplantar a una maceta con agujeros y tierra nueva.', false],
        ['Regarlo todos los días un poco, para que se acostumbre.', true, 'La clave es regar cuando la tierra está seca, no por calendario.'],
        ['Ponerlo cerca de una ventana con luz indirecta.', false],
        ['Taparlo con una bolsa para que no pierda agua.', true, 'Con exceso de humedad, taparlo empeora los hongos.'],
      ], 'Un buen diagnóstico lleva a un buen plan: drenaje, riego según la tierra y luz.', { d: 3 }),
      clas('Clasificá estas señales según qué problema suelen indicar.', { // e7
        'Exceso de agua': ['Tierra con olor feo', 'Hongos en la superficie', 'Tallo blando en la base'],
        'Falta de agua': ['Tierra seca y separada de la maceta', 'Hojas crocantes en los bordes', 'Hojas caídas que se recuperan al regar'],
      }, 'Las hojas amarillas o caídas pueden aparecer en los dos casos: la tierra es la que dice cuál es.', { d: 3 }),
    ]),
  ],
});
