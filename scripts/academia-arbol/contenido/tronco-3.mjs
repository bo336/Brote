import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras } from '../dsl.mjs';

// TRONCO 3 — Del saber al hacer.
// La tercera pata del tronco: por qué saber no alcanza, cómo se arma un hábito,
// qué depende de cada persona y qué de los sistemas, cómo elegir por impacto y
// cómo hablar de ambiente sin espantar a nadie. Es lo que convierte al resto del
// árbol en acciones, y es la unidad que abre las unidades avanzadas de cada rama.

export default unidad({
  slug: 'tronco-3',
  rama: 'tronco',
  orden: 3,
  nivel: 0,
  titulo: 'Del saber al hacer',
  bajada: 'Por qué cuesta cambiar, cómo se arma un hábito que dure, qué está en tus manos y cómo sumar a otros sin pelear.',
  objetivos: [
    'Explicar por qué saber algo no alcanza para hacerlo, sin culpa',
    'Diseñar un hábito con disparador, rutina y recompensa, empezando chico',
    'Distinguir lo que depende de vos de lo que depende de los sistemas, y actuar en los dos',
    'Elegir acciones por impacto y reconocer el efecto rebote',
    'Hablar de ambiente con otras personas de forma concreta, esperanzada y sin sermones',
  ],
  repasa: ['tronco-1', 'tronco-2'],
  fuentes: ['bit-east', 'lally-2010-habitos', 'wynes-nicholas-2017', 'ecoansiedad-review', 'unesco-ods', 'ley-27621-eai', 'naaee-guidelines'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Saber no alcanza', 'Por qué la información sola casi nunca cambia lo que hacemos, y qué sí lo hace.', [
      teoria('La brecha entre querer y hacer', [
        'Mucha gente sabe que conviene cerrar la canilla mientras se cepilla los dientes, y aun así la deja abierta. No es falta de información ni de buena intención: es que la mayor parte de lo que hacemos en un día sale en piloto automático.',
        'A esa distancia entre lo que queremos hacer y lo que efectivamente hacemos se la llama brecha entre intención y acción. Es normal, le pasa a todo el mundo, y se puede achicar trabajando sobre el entorno y la costumbre, no sobre la culpa.',
      ], { destacado: { valor: 'Hábito > información', texto: 'lo que se repite en piloto automático pesa más que lo que se sabe.' } }),
      op('Juan sabe que el agua es valiosa pero se sigue duchando 20 minutos. ¿Cuál es la explicación más probable?', [
        'Tiene la costumbre armada y nada en su entorno la frena',
        'No le importa nada el ambiente ni el agua que gasta',
        ['Le falta información sobre cuánta agua usa la ducha', 'Puede ser, pero el caso dice que ya lo sabe: la información sola no alcanzó.'],
        'Es imposible ducharse en menos tiempo',
      ], 'Saber y hacer son cosas distintas. Juzgar a Juan como alguien a quien "no le importa" suele ser falso y además no ayuda a que cambie.', { d: 1 }),
      teoria('Las barreras reales', [
        'Cuando una acción no se hace, casi siempre hay una barrera concreta: cuesta dinero, lleva tiempo, es incómoda, nadie alrededor la hace, o simplemente no hay a mano lo necesario (no hay contenedor, no hay bicisenda, no hay tiempo a la mañana).',
        'Identificar la barrera real es el primer paso. Si el problema es que el contenedor de reciclables está lejos, un folleto sobre reciclaje no va a cambiar nada; acercar el contenedor, sí.',
      ], { lista: ['Costo: sale caro o parece caro', 'Esfuerzo: lleva tiempo o es incómodo', 'Entorno: falta lo necesario a mano', 'Norma social: nadie alrededor lo hace', 'Olvido: no hay un recordatorio en el momento justo'] }),
      clas('¿Qué tipo de barrera es cada una?', {
        'Entorno o esfuerzo': ['El punto verde queda a 20 cuadras', 'No hay lugar en la cocina para separar residuos', 'La bicicleta está en un cuarto trabado'],
        'Norma social o costumbre': ['En la oficina nadie trae su taza', 'En casa siempre se hizo así', 'Me da vergüenza ser el único que separa'],
      }, 'Las barreras del entorno se resuelven cambiando el lugar; las sociales, cambiando lo que se ve hacer a otros. Por eso las soluciones también son distintas.', { d: 2 }),
      mult('¿Qué estrategias atacan barreras reales y no solo "informan"? Marcá todas.', [
        '+Poner un tacho para reciclables al lado del tacho común',
        '+Dejar la bici lista en la entrada la noche anterior',
        '+Acordar con amigos ir juntos al punto verde',
        '-Leer otro artículo sobre la importancia de reciclar',
        '-Sentirse culpable cada vez que no se hace',
      ], 'Cambiar el entorno y sumarse con otros funciona mejor que acumular información o culpa. La culpa, además, desgasta y hace abandonar.', { d: 2 }),
      vf('Sentir mucha culpa es la mejor forma de lograr que alguien cambie un hábito.', false, 'La culpa intensa suele generar evitación: la persona deja de pensar en el tema para no sentirse mal. Funcionan mejor los pasos concretos, el apoyo de otros y ver resultados.', {
        razones: ['+Porque la culpa lleva a evitar el tema más que a actuar', '-Porque la culpa es la única emoción que mueve a actuar', '-Porque los hábitos no se pueden cambiar'],
        d: 2,
      }),
      teoria('Ansiedad ambiental: normal, y trabajable', [
        'Conocer los problemas ambientales puede generar angustia. Tiene nombre —ecoansiedad— y es una reacción comprensible, sobre todo en gente joven. No es una enfermedad ni una exageración.',
        'Lo que más ayuda es pasar de la preocupación a la acción concreta y compartida: hacer algo que dependa de uno, con otros, y ver que produce un cambio. La esperanza no es optimismo ingenuo: es saber que hay algo para hacer y hacerlo.',
      ]),
      op('Una amiga te dice que siente angustia cada vez que lee noticias sobre el clima. ¿Qué respuesta ayuda más?', [
        'Validar lo que siente y proponerle hacer algo juntas',
        'Decirle que no exagere, que no es para tanto y ya se le pasa',
        ['Mandarle más noticias para que esté mejor informada', 'Más información sin acción suele aumentar la angustia en vez de bajarla.'],
        'Decirle que ya no hay nada que hacer',
      ], 'Validar y actuar juntos: reconocer la emoción sin minimizarla y convertirla en una acción compartida y alcanzable.', { d: 2 }),
      ord('Ordená los pasos para destrabar una acción que no sale.', [
        'Elegir una acción concreta que quieras hacer',
        'Identificar la barrera real que la frena',
        'Cambiar algo del entorno para bajar esa barrera',
        'Probar una semana y ver qué pasó',
      ], 'Primero qué, después por qué no sale, después el cambio, y al final medir. Es un ciclo: si no funcionó, se vuelve al paso dos.', { d: 2, extremos: ['Primero', 'Último'] }),
      det('Leé este razonamiento y marcá lo que no ayuda.', [
        ['Quiero dejar de usar bolsas de un solo uso.', false],
        ['Si me olvido las bolsas, es porque soy un desastre.', true, 'Olvidarse es normal: es un problema de recordatorio, no de persona.'],
        ['Voy a dejar las bolsas de tela colgadas en la puerta.', false],
        ['Si igual me olvido una vez, ya fracasé y no vale la pena seguir.', true, 'Un olvido no borra el hábito: lo que cuenta es la mayoría de las veces.'],
      ], 'Las frases que convierten un olvido en un juicio sobre la persona son las que hacen abandonar. Las que cambian el entorno son las que ayudan.', { d: 3 }),
      comp('Completá la idea.', 'Para cerrar la brecha entre intención y acción conviene cambiar el [entorno] y apoyarse en [otras personas], más que sumar [culpa].', ['información', 'castigos', 'ruido'], 'Entorno y apoyo social son las dos palancas más fuertes. La culpa y la información sola, las más débiles.', { d: 2 }),
      par('Uní cada barrera con una forma de bajarla.', [
        ['Me olvido las bolsas de tela', 'Dejarlas colgadas junto a la puerta'],
        ['Nadie en la oficina separa residuos', 'Proponer un tacho compartido y empezar a usarlo a la vista'],
        ['El punto verde queda lejos', 'Juntar varios meses y llevar todo de una vez con un vecino'],
        ['La bici está trabada en el depósito', 'Guardarla la noche anterior a mano en la entrada'],
      ], 'Cada barrera tiene su palanca: recordatorio, norma social, logística o entorno. Nombrar la barrera es la mitad de la solución.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Cómo se arma un hábito', 'Disparador, rutina y recompensa: la receta para que una acción salga sola.', [
      teoria('Las tres piezas de un hábito', [
        'Un hábito es una acción que se repite tantas veces en el mismo contexto que termina saliendo casi sin pensar. Tiene tres piezas: un disparador (algo que avisa: un lugar, una hora, otra acción), la rutina (lo que se hace) y una recompensa (algo que hace que valga la pena repetir).',
        'Por ejemplo: al terminar de cenar (disparador), tirar los restos de comida en la compostera (rutina) y ver cómo crece la tierra para las plantas (recompensa).',
      ]),
      par('Uní cada pieza del hábito con su ejemplo.', [
        ['Disparador', 'Al entrar a la ducha'],
        ['Rutina', 'Poner un temporizador de cinco minutos'],
        ['Recompensa', 'Ver la cuenta de litros ahorrados de la semana'],
      ], 'Sin disparador, la rutina depende de acordarse; sin recompensa, se abandona. Las tres piezas juntas son las que la sostienen.', { d: 1 }),
      teoria('Empezar ridículamente chico', [
        'Los hábitos que duran suelen empezar muy chicos: no "voy a ir en bici a todos lados", sino "los martes voy en bici a la facultad". Una acción chica que se cumple le gana a una grande que se abandona a la semana.',
        'Otra técnica útil es "apilar": pegar el hábito nuevo a uno que ya existe. "Después de cargar el lavarropas, junto los papeles para reciclar." El hábito viejo funciona como disparador del nuevo.',
      ], { destacado: { valor: 'Chico y fijo', texto: 'mejor una acción mínima todos los días que una enorme una sola vez.' } }),
      op('¿Cuál de estos planes tiene más chances de convertirse en hábito?', [
        '"Después de lavar los platos, saco los reciclables"',
        '"Voy a ser una persona más sustentable en todo"',
        ['"Desde mañana cambio todo lo que hago en casa"', 'Cambiar todo a la vez es difícil de sostener: conviene de a una cosa y bien concreta.'],
        '"Algún día voy a empezar a separar residuos"',
      ], 'Es concreta, chica y está pegada a algo que ya pasa todos los días. Las otras son deseos, no planes.', { d: 2 }),
      teoria('¿Cuánto tarda en armarse?', [
        'Se dice mucho que un hábito se arma en 21 días, pero ese número no tiene respaldo. Un estudio de 2009 publicado en 2010 (Lally y colegas) siguió a personas que intentaban incorporar hábitos simples: la mediana fue de 66 días, con casos que tardaron desde unas semanas hasta más de ocho meses.',
        'El mismo estudio encontró algo alentador: saltearse un día no arruinaba el proceso. Lo que cuenta es la repetición en el tiempo, no la perfección.',
      ], { destacado: { valor: '66 días', texto: 'fue la mediana para que un hábito simple se volviera automático en ese estudio.' } }),
      vf('Un hábito se arma exactamente en 21 días para todo el mundo.', false, 'Ese número es un mito popular. En el estudio de Lally la mediana fue de 66 días, con una variación enorme entre personas y entre hábitos.', {
        razones: ['+Porque el tiempo varía mucho y la mediana medida fue de 66 días', '-Porque los hábitos se arman en una semana', '-Porque los hábitos no se pueden medir'],
        d: 2,
      }),
      vf('Si un día te salteás el hábito nuevo, tenés que empezar de cero.', false, 'En el estudio de Lally, faltar un día no afectó de forma importante la formación del hábito. Lo que importa es volver al día siguiente.', { d: 2 }),
      teoria('Cuatro palancas: fácil, atractivo, social, a tiempo', [
        'Un marco muy usado para diseñar cambios de comportamiento resume las palancas en cuatro: hacerlo fácil (menos pasos), atractivo (que valga la pena), social (que otros lo hagan y se vea) y oportuno (que el recordatorio llegue en el momento justo).',
        'Si una acción no sale, conviene preguntarse cuál de las cuatro falta. Casi siempre es la primera: todavía es demasiado difícil.',
      ], { lista: ['Fácil: sacar pasos del camino', 'Atractivo: una recompensa o algo que guste', 'Social: hacerlo con otros o a la vista', 'A tiempo: el aviso justo antes de que haga falta'] }),
      clas('¿Qué palanca usa cada idea?', {
        'Fácil': ['Dejar la taza reutilizable en la mochila', 'Poner el tacho de orgánicos al lado de la mesada'],
        'Social': ['Armar un grupo del edificio para compostar', 'Contar en la familia cuántos litros ahorraron'],
        'A tiempo': ['Una alarma los jueves a la noche para sacar los reciclables', 'Un cartel en la puerta: "¿llevás las bolsas?"'],
      }, 'Muchas ideas combinan palancas, pero conviene saber cuál es la principal: así, si falla, sabés qué ajustar.', { d: 3 }),
      ord('Ordená los pasos para diseñar un hábito nuevo.', [
        'Elegir una acción chica y concreta',
        'Pegarla a algo que ya hacés todos los días',
        'Preparar el entorno para que sea fácil',
        'Registrar cada vez que la hacés',
        'Revisar a las semanas y ajustar',
      ], 'Acción mínima, disparador existente, entorno preparado, registro y revisión. Es el mismo esquema sirva para agua, energía o residuos.', { d: 3, extremos: ['Primero', 'Último'] }),
      op('Camila quiere llevar su botella reutilizable pero siempre se la olvida. ¿Qué palanca le falta más claramente?', [
        'Que sea fácil y a tiempo: dejar la botella lista junto a las llaves',
        'Más información sobre los plásticos de un solo uso',
        ['Una botella más cara y linda', 'Puede ayudar a que sea atractiva, pero el problema del caso es el olvido.'],
        'Sentirse mal cada vez que compra una botella descartable',
      ], 'El problema es de olvido: la solución es poner la botella en el camino, en el lugar y el momento justos.', { d: 3 }),
      est('En el estudio de Lally, ¿cuántos días fue la mediana para que un hábito simple se volviera automático? Estimá.', 66, { min: 5, max: 250, paso: 1, unidad: 'días' }, 'La mediana fue de 66 días, con casos de 18 a 254. Mucho más que los "21 días" que se repiten por ahí.', { d: 3 }),
      det('Leé este plan de hábito y marcá lo que va a hacer que falle.', [
        ['Quiero compostar los restos de la cocina.', false],
        ['Voy a hacerlo cuando me acuerde, sin horario fijo.', true, 'Sin disparador, depende de acordarse: es la receta del olvido.'],
        ['Pongo el balde de restos al lado de la pileta.', false],
        ['Y el primer día voy a armar tres composteras distintas a la vez.', true, 'Empezar demasiado grande hace abandonar: mejor una sola y chica.'],
      ], 'Disparador fijo y empezar chico: los dos errores más comunes al armar un hábito son justo los contrarios.', { d: 3 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Lo tuyo y lo de todos', 'Qué depende de cada persona, qué depende de los sistemas, y por qué hacen falta las dos cosas.', [
      teoria('Dos escalas que se necesitan', [
        'Muchas decisiones ambientales las toma cada persona: cuánta agua usa, qué come, cómo se mueve. Otras las toman los sistemas: cómo se genera la electricidad, si hay transporte público bueno, si el municipio recoge los reciclables.',
        'A veces se discute si "importa lo individual o lo colectivo", como si hubiera que elegir. En la práctica se empujan entre sí: la gente que actúa pide mejores sistemas, y los mejores sistemas hacen más fácil actuar.',
      ]),
      clas('¿Depende sobre todo de una persona o de un sistema?', {
        'Decisión personal o de la casa': ['Cuánto tiempo dura tu ducha', 'Separar los residuos en tu cocina', 'Qué comés en la cena'],
        'Decisión de un sistema': ['Qué fuentes generan la electricidad del país', 'Si hay recolección diferenciada en tu barrio', 'Cuántas bicisendas tiene la ciudad'],
      }, 'Las dos columnas importan. Y la segunda también se puede empujar: votando, participando, pidiendo y usando lo que existe.', { d: 1 }),
      teoria('Tus círculos de influencia', [
        'Cada persona influye en varios círculos, no solo en su casa: la familia, los amigos, la escuela o el trabajo, el barrio, y como ciudadana. En cada uno hay acciones posibles.',
        'Proponer que la escuela separe residuos, sumarse a una asamblea del barrio o pedirle al municipio un contenedor también son acciones ambientales, y a veces mueven más que cualquier cambio en casa.',
      ], { lista: ['Personal: tus hábitos', 'Casa: las reglas y compras de tu hogar', 'Escuela o trabajo: lo que se decide en grupo', 'Barrio: lo que se hace con vecinos', 'Ciudadanía: lo que se pide y se vota'] }),
      ord('Ordená estos círculos de influencia de más cercano a más amplio.', [
        'Tus propios hábitos',
        'Las reglas de tu casa',
        'Tu escuela o tu trabajo',
        'Tu barrio',
        'Las decisiones de tu ciudad',
      ], 'Los círculos más amplios son más difíciles de mover solo, pero cuando se mueven, cambian las cosas para miles de personas a la vez.', { d: 1, extremos: ['Más cercano', 'Más amplio'] }),
      teoria('El contagio social', [
        'Lo que hacemos se contagia. Cuando alguien ve que sus vecinos instalan paneles solares, compostan o van en bici, es más probable que lo haga. Varios estudios encontraron que la adopción de paneles solares se agrupa por barrio justamente por este efecto de ver a otros hacerlo.',
        'Por eso una acción visible vale doble: el ahorro propio y el ejemplo que abre la puerta a otros. Hacer las cosas a la vista, sin sermonear, es una forma de influencia.',
      ]),
      op('Martina empieza a ir en bici al trabajo y deja la bici en la entrada de la oficina. ¿Por qué eso puede tener más impacto que solo su propio viaje?', [
        'Porque sus compañeros la ven y aumenta la chance de que otros prueben',
        'Porque la bici en la entrada ocupa menos lugar que un auto',
        ['Porque así la bici no se oxida con la lluvia', 'Puede ser cierto, pero no explica el impacto más allá de ella.'],
        'Porque la empresa le va a pagar más',
      ], 'El contagio social multiplica las acciones visibles. Es una de las razones por las que lo individual y lo colectivo no están separados.', { d: 2 }),
      vf('Como los grandes cambios dependen de gobiernos y empresas, lo que hace cada persona no tiene ningún efecto.', false, 'Lo individual tiene efecto directo (lo que ahorra cada persona) e indirecto: contagia, crea demanda de mejores productos y sostiene los pedidos de cambios más grandes.', {
        razones: ['+Porque lo individual contagia y empuja cambios más grandes', '-Porque los gobiernos no toman decisiones ambientales', '-Porque solo lo individual importa'],
        d: 2,
      }),
      mult('¿Cuáles son formas de influir en un sistema, más allá de tu casa? Marcá todas.', [
        '+Proponer en la escuela un sistema de separación de residuos',
        '+Participar de una audiencia pública sobre un proyecto del barrio',
        '+Pedirle al municipio una bicisenda con otros vecinos',
        '+Elegir comprar a comercios que reducen envases',
        '-Esperar a que otro lo resuelva',
      ], 'Proponer, participar, pedir en grupo y elegir dónde comprar son formas de empujar sistemas. Las verás en profundidad en la rama de Comunidad.', { d: 2 }),
      cad('Armá la cadena de cómo una acción personal puede terminar cambiando un sistema.', [
        'Unos vecinos empiezan a compostar en sus casas',
        'Otros ven que funciona y se suman',
        'El grupo le pide al municipio una compostera comunitaria',
        'El municipio la instala en la plaza',
      ], ['El compost desaparece solo a los pocos días'], 'De lo personal a lo colectivo, y de ahí al sistema. El señuelo no tiene relación: el compost no desaparece, se convierte en tierra.', { d: 3 }),
      comp('Completá.', 'Las acciones personales y los cambios de [sistema] no compiten: las personas que actúan [piden] mejores sistemas, y los mejores sistemas hacen más [fácil] actuar.', ['difícil', 'olvidan', 'caro'], 'Es un círculo que se refuerza. Por eso el árbol enseña las dos escalas.', { d: 2 }),
      det('Leé esta discusión y marcá las frases que plantean una falsa opción.', [
        ['Separar residuos en casa está bien,', false],
        ['pero si no hay recolección diferenciada, no sirve para nada hacerlo.', true, 'Sirve igual: ordena la casa, alimenta la demanda y hay puntos verdes y cooperativas que reciben materiales.'],
        ['Por eso también vale pedirle al municipio que la implemente.', false],
        ['O cambiás tus hábitos o cambiás el sistema: las dos cosas a la vez no se puede.', true, 'Se puede, y conviene: cada una empuja a la otra.'],
      ], 'El "o una cosa o la otra" es la trampa más común de estas discusiones. Casi siempre la respuesta es "las dos".', { d: 3 }),
      op('En tu escuela no hay dónde separar residuos. ¿Qué acción sale de tu casa y empuja al sistema de la escuela?', [
        'Proponer con compañeros un tacho de reciclables por aula',
        'Separar en tu casa y no decir nada en la escuela',
        ['Esperar a que la escuela lo decida sola algún día', 'Los sistemas cambian cuando alguien lo pide: esperar suele ser esperar para siempre.'],
        'Tirar todo junto porque en la escuela no importa',
      ], 'Es una acción colectiva en un círculo cercano: pequeña para empezar y capaz de cambiar lo que hacen cientos de personas por día.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Elegir por impacto', 'Con tiempo y energía limitados, conviene empezar por lo que más pesa. Cómo decidir sin volverse loco.', [
      teoria('Impacto por esfuerzo', [
        'No todas las acciones valen lo mismo, ni cuestan lo mismo. Una buena forma de elegir es mirar dos cosas a la vez: cuánto impacto tienen y cuánto esfuerzo te piden a vos, en tu situación.',
        'Las mejores para empezar son las de alto impacto y bajo esfuerzo. Después, las de alto impacto aunque cuesten más. Las de bajo impacto y bajo esfuerzo están bien para sumar; las de bajo impacto y mucho esfuerzo, conviene dejarlas para el final.',
      ]),
      clas('Clasificá estas acciones para una familia con auto que vive cerca del trabajo.', {
        'Alto impacto, bajo esfuerzo': ['Ir caminando al trabajo, que queda a diez cuadras', 'Bajar un grado la calefacción en invierno'],
        'Alto impacto, más esfuerzo': ['Vender el segundo auto', 'Aislar el techo de la casa'],
        'Bajo impacto, bajo esfuerzo': ['Desenchufar el cargador', 'Apagar la luz del pasillo'],
      }, 'El mismo cambio puede ser fácil para una familia y difícil para otra: por eso la matriz se arma con tu situación, no con una lista general.', { d: 2 }),
      teoria('Los tres grandes', [
        'Para la mayoría de los hogares de ingresos medios y altos, la huella se concentra en tres áreas: transporte (sobre todo auto y avión), energía de la casa (calefacción, refrigeración, agua caliente) y alimentación (sobre todo la carne vacuna).',
        'No es una lista de prohibiciones: es un mapa de dónde está el peso. Un cambio en cualquiera de esas tres áreas suele valer más que diez cambios en otras.',
      ], {
        datos: barras('Ahorro estimado por persona y por año', 't CO₂e', [
          ['Vivir sin auto', 2.4],
          ['Evitar un vuelo transatlántico ida y vuelta', 1.6],
          ['Dieta basada en plantas', 0.8],
          ['Lavar con agua fría', 0.25],
          ['Reciclar', 0.21],
        ], 'Fuente: Wynes y Nicholas (2017), países de altos ingresos. Valores aproximados.'),
      }),
      mult('Según el gráfico, ¿cuáles de estas acciones ahorran más de media tonelada por año? Marcá todas.', [
        '+Vivir sin auto',
        '+Evitar un vuelo transatlántico',
        '+Una dieta basada en plantas',
        '-Reciclar',
        '-Lavar con agua fría',
      ], 'Leer un gráfico es buscar el umbral y comparar: tres de las cinco barras superan 0,5 toneladas.', { d: 2 }),
      numv(3, (i) => {
        const a = [2.4, 1.6, 0.8][i];
        const n = ['vivir sin auto', 'evitar un vuelo transatlántico', 'una dieta basada en plantas'][i];
        return {
          enunciado: `Según el gráfico, ¿cuántas veces más ahorra ${n} que reciclar (0,2 t)? Redondeá a entero.`,
          valor: Math.round(a / 0.2),
          unidad: 'veces',
          tol: 0.6,
          explicacion: `${a.toLocaleString('es-AR')} ÷ 0,2 = ${(a / 0.2).toLocaleString('es-AR')}, o sea unas ${Math.round(a / 0.2)} veces. No quiere decir que reciclar no sirva: quiere decir dónde está el peso.`,
        };
      }, { d: 3 }),
      teoria('Cuidado con lo que parece verde', [
        'Hay acciones que se sienten muy ambientales y pesan poco (como cambiar la bombilla del patio) y otras que no parecen ambientales y pesan mucho (como aislar el techo o elegir dónde vivir). La intuición falla porque vemos lo que se ve: el envase, la bolsa, la pajita.',
        'Pensar en impacto no es despreciar lo chico, es no quedarse solo ahí. Y es desconfiar de quien vende algo "verde" que en realidad cambia poco.',
      ]),
      vf('Las acciones más visibles, como no usar pajita, son siempre las de mayor impacto.', false, 'La visibilidad y el impacto no van juntos. Evitar la pajita reduce residuos plásticos, pero en huella de carbono pesa mucho menos que el transporte o la calefacción.', {
        razones: ['+Porque lo que más se ve no es necesariamente lo que más pesa', '-Porque las pajitas son la principal fuente de emisiones del mundo', '-Porque ninguna acción individual tiene impacto'],
        d: 2,
      }),
      op('Una familia tiene tiempo para un solo cambio este mes. Viven en una zona fría, la casa pierde calor por el techo y calefaccionan con estufas eléctricas. ¿Cuál conviene priorizar?', [
        'Mejorar la aislación del techo',
        'Cambiar las bolsas del supermercado por bolsas de tela',
        ['Desenchufar todos los cargadores de noche', 'Ahorra algo, pero muy poco comparado con la calefacción en una casa que pierde calor.'],
        'Comprar productos con envases reciclables',
      ], 'La calefacción es el gran consumo de esa casa, y el techo es por donde se escapa. Atacar la mayor pérdida es la regla de oro.', { d: 3 }),
      cad('Armá la forma de decidir qué acción hacer primero.', [
        'Anotar dónde se usa más energía, agua o materiales en tu vida',
        'Listar acciones posibles para esos puntos',
        'Estimar impacto y esfuerzo de cada una',
        'Elegir la de mayor impacto que puedas sostener',
      ], ['Hacer la que te recomendó el anuncio más llamativo'], 'Medir, listar, estimar y elegir: es la misma lógica de órdenes de magnitud que viste en la unidad anterior, aplicada a tu vida.', { d: 3 }),
      rank('Para una persona que vuela a Europa una vez al año y vive a 30 cuadras del trabajo, ordená por impacto estimado.', [
        ['Evitar ese vuelo de ida y vuelta', 'del orden de una tonelada o más'],
        ['Ir en transporte público en lugar de auto', 'cientos de kilos por año'],
        ['Reciclar todos los envases', 'del orden de cien o doscientos kilos'],
        ['Usar bolsas de tela', 'unos pocos kilos'],
      ], 'Los números exactos cambian según el vuelo, el auto y el reciclaje disponible, pero el orden de magnitud se mantiene: por eso se puede ordenar sin la cifra exacta.', { d: 4 }),
      det('Leé este plan y marcá los puntos donde se pierde el foco.', [
        ['Mi huella más grande es el auto, que uso para todo.', false],
        ['Así que este mes voy a cambiar el cepillo de dientes por uno de bambú', true, 'Está bien, pero no toca lo que acaba de identificar como lo más grande.'],
        ['y a probar ir en colectivo dos días por semana.', false],
        ['Y si el colectivo tarda más, lo dejo y listo: ya hice lo del cepillo.', true, 'Usa la acción chica como excusa para abandonar la grande.'],
      ], 'Identificar lo grande es el primer paso; sostener el cambio ahí es el importante. Los gestos chicos no compensan.', { d: 4 }),
      comp('Completá la regla para elegir.', 'Conviene empezar por las acciones de [alto impacto] y [bajo esfuerzo], y dejar para el final las de poco impacto y mucho [esfuerzo].', ['bajo impacto', 'alto costo', 'poco tiempo'], 'Impacto por esfuerzo, en tu situación. La matriz cambia de persona en persona, pero la regla es la misma.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Hablar de ambiente sin pelear', 'Cómo contar lo que aprendiste para que otros se sumen, en vez de ponerse a la defensiva.', [
      teoria('El sermón no convence', [
        'Cuando alguien se siente juzgado, se defiende: busca argumentos en contra, se enoja o se cierra. Por eso los sermones ("no puedo creer que sigas usando…") suelen lograr lo contrario de lo que buscan.',
        'Lo que funciona mejor es escuchar primero, partir de lo que al otro le importa (su salud, su bolsillo, su barrio, sus hijos) y ofrecer algo concreto y fácil de probar.',
      ]),
      op('Tu tío dice que "eso del cambio climático es un invento". ¿Cuál es el mejor primer paso?', [
        'Preguntarle qué le hace pensar eso y escucharlo antes de responder',
        'Decirle que está desinformado y que lea más',
        ['Mandarle diez gráficos seguidos al grupo de la familia', 'Una lluvia de datos suele cerrar la conversación antes de empezarla.'],
        'Dejarle de hablar hasta que cambie de idea',
      ], 'Escuchar primero muestra respeto y te da información sobre qué le preocupa de verdad. Con eso se puede conversar.', { d: 2 }),
      teoria('Concreto, cercano y con salida', [
        'Los mensajes que más movilizan tienen tres rasgos. Son concretos: una acción puntual en vez de "salvar el planeta". Son cercanos: algo del barrio o de la casa, no un glaciar lejano. Y tienen salida: dicen qué se puede hacer, en vez de solo describir el problema.',
        'El miedo solo, sin salida, paraliza. La esperanza con una acción al lado, moviliza.',
      ], { lista: ['Concreto: "cerremos la canilla mientras nos lavamos los dientes"', 'Cercano: "el arroyo de acá a la vuelta"', 'Con salida: "si juntamos los reciclables, la cooperativa los retira"'] }),
      clas('¿El mensaje tiene salida o solo describe el problema?', {
        'Tiene una acción concreta': ['Si separamos el aceite usado, lo llevamos al punto de la plaza', 'Probemos ir en bici los viernes', 'Juntemos las pilas en una botella y las llevamos al punto verde'],
        'Solo describe el problema': ['El planeta se está destruyendo', 'Ya es demasiado tarde para todo', 'Los plásticos están en todas partes'],
      }, 'Describir el problema no está mal, pero sin una salida deja a la gente angustiada y quieta. Siempre conviene cerrar con qué hacer.', { d: 2 }),
      mult('¿Qué hace que una conversación sobre ambiente tenga más chances de sumar a alguien? Marcá todas.', [
        '+Partir de algo que al otro le importa',
        '+Proponer una acción chica que puedan hacer juntos',
        '+Reconocer que vos tampoco hacés todo perfecto',
        '-Remarcar todo lo que el otro hace mal',
        '-Usar datos alarmantes sin ninguna propuesta',
      ], 'Valores compartidos, acción conjunta y humildad. Nadie hace todo bien, y decirlo baja las defensas.', { d: 2 }),
      vf('Asustar mucho a la gente con datos catastróficos es la forma más efectiva de que actúe.', false, 'El miedo sin una acción posible tiende a generar negación o parálisis. La investigación en comunicación ambiental muestra que funciona mejor combinar la preocupación con acciones concretas y eficaces.', {
        razones: ['+Porque el miedo sin salida suele llevar a negar o paralizarse', '-Porque los datos no importan en ningún caso', '-Porque nadie reacciona a ningún mensaje'],
        d: 2,
      }),
      teoria('Datos con cuidado', [
        'Un dato bien usado ayuda muchísimo; uno mal usado destruye la confianza. Antes de compartir un número, conviene aplicarle lo que aprendiste en la unidad anterior: ¿qué unidad tiene?, ¿es total o por persona?, ¿de dónde sale?',
        'Y si alguien te corrige con razón, reconocerlo te hace más creíble, no menos. Nadie sabe todo, y el tema cambia a medida que la ciencia mide mejor.',
      ]),
      det('Un compañero prepara un posteo para la escuela. Marcá lo que conviene cambiar.', [
        ['En nuestra escuela tiramos unas 10 bolsas de basura por día.', false],
        ['Somos todos unos irresponsables y el planeta no tiene arreglo.', true, 'Culpa y desesperanza: cierra la conversación en vez de abrirla.'],
        ['La mitad es papel que se podría reciclar.', false],
        ['Si ponemos un tacho para papel en cada aula, la cooperativa lo retira los viernes.', false],
      ], 'El resto del posteo es concreto, cercano y con salida. Solo la frase de culpa lo arruina.', { d: 3 }),
      ord('Ordená una buena conversación sobre un cambio en casa.', [
        'Escuchar qué piensa la otra persona',
        'Encontrar algo que a los dos les importe',
        'Proponer una prueba chica y concreta',
        'Acordar cuándo ver cómo salió',
      ], 'Escuchar, conectar, proponer y revisar. Es una conversación, no un discurso.', { d: 2, extremos: ['Primero', 'Último'] }),
      op('Querés que en tu casa usen menos aire acondicionado. Tu mamá se preocupa mucho por la cuenta de luz. ¿Qué argumento conviene usar primero?', [
        'Cuánto baja la factura con el aire a 24 °C',
        'Que el aire acondicionado destruye la capa de ozono',
        ['Que los osos polares se están quedando sin hielo', 'Puede importarle, pero el caso dice qué le preocupa más: la cuenta.'],
        'Que si no lo hace es mala persona',
      ], 'Partir de lo que al otro le importa (acá, la cuenta) abre la puerta. El beneficio ambiental viene incluido.', { d: 3 }),
      comp('Completá el consejo.', 'Un buen mensaje ambiental es [concreto], [cercano] y tiene una [salida] clara.', ['alarmante', 'lejano', 'culpable'], 'Tres palabras que podés usar como filtro antes de hablar o de publicar algo.', { d: 2 }),
      rank('Ordená estas respuestas a "reciclar no sirve para nada" según qué tan probable es que abran la conversación, de más a menos.', [
        ['"¿Qué te hizo pensar eso? Yo también tengo dudas con algunas cosas."', 'escucha y comparte dudas'],
        ['"En el barrio la cooperativa retira el papel: ¿te paso el día?"', 'concreta, con salida'],
        ['"Hay un estudio que dice lo contrario, te lo mando."', 'dato sin conexión'],
        ['"Con gente como vos no se puede."', 'cierra la conversación'],
      ], 'Escuchar y ofrecer algo concreto abren; el dato solo informa y el juicio cierra. No hay una fórmula perfecta, pero sí respuestas que casi siempre funcionan peor.', { d: 3 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: del saber al hacer', 'Hábitos, impacto y comunicación, todo mezclado.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el plan de 30 días de Sofi', 'Diseñá con Sofi un plan que dure. Aprobalo para completar el tronco.', [
      teoria('El caso', [
        'Sofi tiene 16 años, vive con su papá y su hermano en un departamento, y quiere "hacer algo por el ambiente". Anotó cómo es su vida: va a la escuela en auto con su papá aunque queda a 12 cuadras, se ducha unos 15 minutos, en casa no separan residuos porque "no hay lugar", y el grupo de la familia es un campo de batalla cada vez que habla de estos temas.',
        'Quiere armar un plan de 30 días. Con todo lo que aprendiste en el tronco, vas a ayudarla a elegir, diseñar y sostenerlo.',
      ]),
      op('De lo que describe Sofi, ¿qué cambio tiene el mejor equilibrio entre impacto y esfuerzo para empezar?', [
        'Ir caminando o en bici a la escuela, que queda a 12 cuadras',
        'Comprar un cepillo de dientes de bambú',
        ['Convencer a toda la familia de dejar de comer carne este mes', 'Puede tener impacto, pero es un esfuerzo grande y depende de otros: difícil para empezar.'],
        'Desenchufar el cargador del celular',
      ], 'El transporte suele ser de lo que más pesa, y 12 cuadras se hacen caminando. Es alto impacto con esfuerzo razonable.', { ctx: 'Sofi, 16 años: va a la escuela en auto a 12 cuadras, se ducha 15 minutos, en casa no separan residuos "porque no hay lugar", y en el grupo de la familia se discute mucho de ambiente.', d: 3 }),
      op('Para la ducha, ¿cuál es el plan con más chances de convertirse en hábito?', [
        'Poner una canción de 5 minutos al entrar a la ducha y salir cuando termina',
        'Proponerse "ducharse menos" sin ninguna ayuda',
        ['Anotar en un cuaderno lo mal que se siente cada vez que se pasa', 'La culpa desgasta y no ayuda a sostener el hábito.'],
        'Ducharse en 2 minutos desde mañana',
      ], 'Disparador (entrar a la ducha), rutina (salir con la canción) y una meta alcanzable. Dos minutos es tan exigente que probablemente se abandone.', { ctx: 'Sofi se ducha unos 15 minutos por día y quiere bajarlo.', d: 3 }),
      clas('Para los residuos, "no hay lugar" es la barrera. ¿Qué ideas atacan esa barrera y cuáles no?', {
        'Atacan la barrera': ['Una bolsa colgada en la puerta de la alacena para los reciclables', 'Un tacho chico y alto que entre al lado de la heladera', 'Sacar los reciclables una vez por semana para que no se acumulen'],
        'No atacan la barrera': ['Leer más sobre la importancia de reciclar', 'Esperar a mudarse a una casa más grande'],
      }, 'Si la barrera es de espacio, la solución es de espacio. Información o esperar no cambian el problema.', { ctx: 'En casa de Sofi no separan residuos porque dicen que no hay lugar en la cocina.', d: 3 }),
      cad('Armá el orden en que Sofi debería lanzar su plan de 30 días.', [
        'Elegir un solo cambio grande y uno chico para empezar',
        'Pegar cada cambio a algo que ya hace todos los días',
        'Preparar el entorno para que sea fácil',
        'Registrar cada día y revisar a las dos semanas',
      ], ['Anunciar en el grupo familiar que desde ahora todos tienen que cambiar'], 'Pocos cambios, bien diseñados, con registro. El anuncio para todos es el tipo de sermón que suele terminar en pelea.', { d: 4 }),
      op('En el grupo de la familia, su papá escribe: "Eso de caminar a la escuela es una pavada, no cambia nada". ¿Qué respuesta de Sofi tiene más chances de funcionar?', [
        '"Me hace bien caminar y te ahorro el viaje. ¿Probamos dos semanas?"',
        '"Sos parte del problema, así no se puede hablar con vos, papá."',
        ['"Te mando este informe del IPCC de 3.000 páginas para que leas."', 'Mucha información de golpe suele cerrar la conversación.'],
        '"Bueno, entonces sigo yendo en auto y no digo nada más."',
      ], 'Parte de lo que le importa al otro (comodidad, salud), no lo juzga y propone una prueba chica con fecha para revisar.', { ctx: 'El grupo de WhatsApp de la familia de Sofi suele terminar en discusión cuando habla de ambiente.', d: 3 }),
      vf('Si a los 10 días Sofi falla dos veces con la ducha corta, lo mejor es abandonar el plan porque ya no va a formar el hábito.', false, 'Saltearse días no arruina el hábito: lo que cuenta es volver. En el estudio de Lally, la formación de hábitos no se vio afectada de forma importante por faltar un día.', {
        razones: ['+Porque lo que cuenta es volver, no la perfección', '-Porque los hábitos se rompen para siempre con un error', '-Porque la ducha no es un hábito'],
        d: 3,
      }),
      numv(3, (i) => {
        const min = [15, 12, 18][i];
        const nuevo = 5;
        const lpm = 10;
        return {
          enunciado: `Si la ducha de Sofi usa 10 litros por minuto y baja de ${min} a ${nuevo} minutos, ¿cuántos litros ahorra en los 30 días del plan?`,
          valor: (min - nuevo) * lpm * 30,
          unidad: 'litros',
          explicacion: `Ahorra ${min - nuevo} minutos por día × 10 litros por minuto = ${(min - nuevo) * lpm} litros por día. × 30 días = ${((min - nuevo) * lpm * 30).toLocaleString('es-AR')} litros.`,
        };
      }, { d: 3 }),
      mult('A los 30 días, ¿qué conviene que haga Sofi? Marcá todo lo que ayuda.', [
        '+Revisar qué funcionó y qué no, sin juzgarse',
        '+Mantener lo que ya sale solo y sumar un solo cambio nuevo',
        '+Contar en casa los resultados concretos, como los litros ahorrados',
        '-Empezar diez cambios nuevos a la vez para recuperar el tiempo',
        '-Dejar todo porque ya pasó el mes',
      ], 'Revisar, sostener lo que ya es hábito, sumar de a uno y mostrar resultados concretos: así el plan se vuelve una forma de vivir.', { d: 3 }),
      det('Sofi escribe su reflexión final. Marcá lo que contradice lo que aprendiste.', [
        ['Lo más importante que cambié fue ir caminando a la escuela.', false],
        ['Como la ducha me cuesta, voy a dejarla: si no lo hago perfecto, no vale.', true, 'Perfección no hace falta: una ducha de 8 minutos ya ahorra mucho respecto de 15.'],
        ['Mi papá empezó a ir caminando al trabajo los viernes.', false],
        ['Igual lo que yo hago no cambia nada, lo importante lo tienen que hacer otros.', true, 'Su propio caso lo desmiente: su cambio contagió a su papá.'],
      ], 'Perfeccionismo e impotencia son las dos trampas que más hacen abandonar. Su propia historia muestra lo contrario.', { d: 4 }),
    ]),
  ],
});
