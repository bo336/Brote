import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// COMUNIDAD 1 — Del yo al nosotros.
// La base de la rama: qué puede cada persona y qué solo se logra juntos,
// cómo se contagian los comportamientos, cómo se organiza un proyecto en el
// barrio, cómo hablar para sumar y cómo cuidar el ánimo frente a la
// ecoansiedad. Retoma lo tuyo y lo de todos y hablar de ambiente sin pelear
// (tronco-3).

export default unidad({
  slug: 'comunidad-1',
  rama: 'comunidad',
  orden: 1,
  nivel: 1,
  requiereTronco: 1,
  titulo: 'Del yo al nosotros',
  bajada: 'Lo que hacés vos importa, y lo que hacemos juntos importa todavía más. Cómo se contagian los hábitos, cómo se organiza un barrio y cómo sostener la esperanza.',
  objetivos: [
    'Distinguir los problemas que se resuelven individualmente de los que requieren acción colectiva',
    'Explicar cómo las normas sociales y el ejemplo contagian comportamientos',
    'Planificar un proyecto ambiental comunitario paso a paso',
    'Aplicar estrategias de comunicación que suman personas',
    'Reconocer la ecoansiedad y formas saludables de afrontarla',
  ],
  repasa: ['tronco-3'],
  fuentes: ['bit-east', 'lally-2010-habitos', 'ecoansiedad-review', 'onu-ods', 'naaee-guidelines'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Lo que puedo solo y lo que hacemos juntos', 'La tragedia de los comunes, los bienes compartidos y por qué algunos problemas no tienen solución individual.', [
      teoria('Los bienes comunes', [
        'Hay recursos que son de todos y de nadie a la vez: el aire, un río, un banco de peces, una plaza. Si cada persona usa un poco más de lo que le corresponde, pensando que su parte no cambia nada, entre todos el recurso se agota. A eso se lo llamó "la tragedia de los comunes".',
        'Pero la historia muestra que muchas comunidades lograron cuidar sus bienes comunes durante siglos, con reglas acordadas, control mutuo y sanciones justas. La politóloga Elinor Ostrom ganó el Premio Nobel de Economía en 2009 por estudiar cómo lo hacen.',
      ]),
      cad('Armá la cadena de una tragedia de los comunes en una laguna de pesca.', [ // e1
        'Cada pescador piensa que sacar un poco más no cambia nada',
        'Todos sacan un poco más',
        'Los peces no alcanzan a reproducirse',
        'La población de peces se derrumba',
        'Todos los pescadores pierden',
      ], ['Los peces se multiplican más cuanto más se pesca'], 'Lo que tiene sentido para cada uno por separado termina mal para todos. Por eso los bienes comunes necesitan acuerdos.', { d: 2 }),
      teoria('Cómo se cuidan los comunes', [
        'Ostrom encontró que las comunidades que cuidan bien sus bienes comunes suelen tener algunas cosas en común: límites claros de quién usa el recurso, reglas adaptadas al lugar, participación de los usuarios en fijar las reglas, vigilancia, sanciones graduales y formas baratas de resolver conflictos.',
      ]),
      mult('¿Qué ayuda a una comunidad a cuidar un bien común? Marcá todo.', [ // e2
        '+Reglas acordadas por quienes usan el recurso',
        '+Vigilar que se cumplan',
        '+Sanciones graduales y justas',
        '+Formas de resolver conflictos',
        '-Que cada uno haga lo que quiera sin hablar',
      ], 'Acuerdos, control y justicia: la receta que Ostrom encontró en comunidades de todo el mundo.', { d: 2 }),
      clas('¿Este problema se resuelve sobre todo con acción individual o necesita acción colectiva?', { // e3
        'Sobre todo individual': ['Apagar las luces de tu cuarto', 'Llevar tu bolsa a las compras', 'Reparar tu bicicleta'],
        'Necesita acción colectiva': ['Que haya recolección diferenciada en el barrio', 'Limpiar y proteger un arroyo', 'Que la ciudad tenga ciclovías conectadas'],
      }, 'Muchas soluciones necesitan las dos cosas: tu hábito y un sistema que lo haga posible. Es lo tuyo y lo de todos del tronco.', { d: 1 }),
      vf('Si un problema es colectivo, lo que hace cada persona no importa.', false, 'Lo individual suma, da el ejemplo y genera presión para cambiar el sistema. Y los cambios colectivos empiezan por personas que se organizan.', { // e4
        razones: ['+Porque lo individual suma, contagia y empuja cambios colectivos', '-Porque las personas no forman parte de la sociedad', '-Porque los problemas colectivos se resuelven solos'],
        d: 2,
      }),
      teoria('La trampa del "no cambia nada"', [
        'Frente a problemas enormes como el cambio climático, es común pensar "lo mío no cambia nada". Pero ese razonamiento, repetido por millones, es justamente lo que produce el problema. Y al revés: los cambios grandes empiezan con grupos chicos que se organizan y convencen a otros.',
      ]),
      op('Un vecino dice: "Si yo separo la basura, no cambia nada; somos millones". ¿Qué respuesta es más acertada?', [ // e5
        'Lo que hace cada uno suma, y además contagia',
        'Tiene razón, no tiene sentido hacer nada',
        ['Solo importa lo que hace el gobierno', 'El gobierno importa mucho, pero los cambios de hábito también suman y empujan las políticas.'],
        'Hay que separar solo si todos los demás separan primero',
      ], 'El "no cambia nada" repetido por millones es el problema. Lo mismo al revés es la solución.', { d: 2 }),
      par('Uní cada bien común con una regla que ayuda a cuidarlo.', [ // e6
        ['Laguna de pesca', 'Talla mínima y temporada de veda'],
        ['Plaza del barrio', 'Turnos para el mantenimiento entre vecinos'],
        ['Aire de la ciudad', 'Límites de emisiones para industrias y vehículos'],
        ['Acuífero de un pueblo', 'Registro de pozos y límites de extracción'],
      ], 'Cada bien común tiene su regla. Las mejores se acuerdan con quienes lo usan.', { d: 2 }),
      numv(3, (i) => { // e7
        const pes = [20, 30, 10][i];
        const extra = [5, 3, 10][i];
        return {
          enunciado: `En una laguna pescan ${pes} personas. Si cada una saca ${extra} kg más por temporada de lo sustentable, ¿cuántos kg de más se sacan entre todos?`,
          valor: pes * extra,
          unidad: 'kg',
          explicacion: `${pes} × ${extra} = ${pes * extra} kg de más. Poco para cada uno, mucho para la laguna: la lógica de la tragedia de los comunes.`,
        };
      }, { d: 1 }),
      op('En un pueblo de pescadores, ¿qué medida se parece más a lo que Ostrom encontró que funciona?', [
        'Que los pescadores acuerden y controlen sus reglas',
        'Que cada pescador saque todo lo que pueda',
        ['Que alguien de afuera prohíba pescar sin consultar', 'Las reglas impuestas sin participación suelen cumplirse peor; la participación es clave.'],
        'Que no haya ninguna regla ni vigilancia',
      ], 'Cuando quienes usan el recurso participan en fijar y controlar las reglas, las respetan más.', { d: 2 }),
      ord('Ordená los pasos para acordar el cuidado de un bien común.', [
        'Reunir a quienes usan el recurso',
        'Medir cuánto hay y cuánto se usa',
        'Acordar reglas y límites',
        'Vigilar que se cumplan',
        'Revisar las reglas según los resultados',
      ], 'Reunir, medir, acordar, controlar y ajustar: el ciclo de un bien común bien cuidado.', { d: 2, extremos: ['Primero', 'Último'] }),
      det('Leé esta discusión vecinal y marcá lo equivocado.', [ // e8
        ['La plaza es de todos, así que tenemos que acordar cómo cuidarla.', false],
        ['Como la plaza es de todos, a nadie le toca cuidarla.', true, 'Es justamente lo que lleva a la tragedia de los comunes.'],
        ['Podemos organizar turnos para regar los canteros.', false],
        ['Las comunidades nunca logran cuidar sus bienes comunes.', true, 'Muchas lo lograron durante siglos, como mostró Elinor Ostrom.'],
      ], 'Lo común necesita acuerdos, no abandono.', { d: 2 }),
      comp('Completá.', 'Cuando cada uno usa de más un recurso compartido y se agota, se habla de la tragedia de los [comunes]; Elinor [Ostrom] estudió cómo las comunidades los cuidan.', ['privados', 'Montreal'], 'Un problema clásico de los bienes compartidos y su respuesta.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Los hábitos se contagian', 'Normas sociales, ejemplo y visibilidad: por qué hacemos lo que vemos hacer.', [
      teoria('Normas sociales', [
        'Las personas se guían mucho por lo que hacen los demás. Una norma social descriptiva es lo que la gente efectivamente hace ("en este barrio casi todos separan la basura"). Una norma prescriptiva es lo que se considera correcto ("hay que separar la basura").',
        'Las investigaciones sobre comportamiento muestran que saber que otros ya hacen algo aumenta la probabilidad de hacerlo. Por eso, un mensaje como "la mayoría de tus vecinos ya ahorra agua" suele funcionar mejor que "hay que ahorrar agua".',
      ]),
      op('¿Qué mensaje tiene más probabilidades de que los vecinos separen la basura?', [ // e1
        '"7 de cada 10 vecinos de esta cuadra ya separan"',
        '"Muy pocos vecinos separan la basura"',
        ['"Separar es obligatorio por ordenanza"', 'Las reglas importan, pero mostrar que otros ya lo hacen suele motivar más.'],
        '"La basura es un desastre en este barrio"',
      ], 'Mostrar que la mayoría ya lo hace invita a sumarse. Decir que "casi nadie lo hace" puede tener el efecto contrario.', { d: 2 }),
      vf('Un mensaje que dice "casi nadie recicla en este barrio" motiva a reciclar más.', false, 'Puede tener el efecto contrario: muestra que lo normal es no reciclar. Es mejor destacar a quienes sí lo hacen.', { // e2
        razones: ['+Porque muestra que lo normal es no hacerlo', '-Porque las personas nunca se fijan en los demás', '-Porque los mensajes negativos siempre funcionan mejor'],
        d: 3,
      }),
      teoria('Lo visible se contagia', [
        'Los comportamientos que se ven se contagian más. Estudios en distintos países encontraron que cuando una casa instala paneles solares, aumenta la probabilidad de que los vecinos cercanos también los instalen. Lo mismo pasa con las huertas, las bicis o las composteras visibles.',
        'Por eso, hacer visible lo que ya se hace —un cartel en la compostera, una huerta en el frente— es una forma de sumar.',
      ]),
      cad('Armá la cadena de cómo una huerta en el frente de una casa puede contagiar a la cuadra.', [ // e3
        'Una familia arma una huerta en el frente',
        'Los vecinos la ven todos los días',
        'Algunos preguntan cómo hacerla',
        'La familia comparte semillas y consejos',
        'Aparecen más huertas en la cuadra',
      ], ['La huerta obliga a los vecinos a plantar'], 'El ejemplo visible y la ayuda concreta son una combinación poderosa.', { d: 2 }),
      teoria('Hacerlo fácil, atractivo, social y oportuno', [
        'Un marco muy usado para diseñar cambios de comportamiento, del equipo británico de ciencias del comportamiento, se resume en cuatro palabras: fácil, atractivo, social y oportuno. Si algo es fácil de hacer, llama la atención, otros lo hacen y se propone en el momento justo, es mucho más probable que ocurra.',
      ], { lista: ['Fácil: sacar obstáculos', 'Atractivo: que llame la atención', 'Social: mostrar que otros lo hacen', 'Oportuno: en el momento justo'] }),
      par('Uní cada principio con un ejemplo.', [ // e4
        ['Fácil', 'Poner el tacho de reciclables al lado del de basura'],
        ['Atractivo', 'Un cartel colorido con un dibujo claro'],
        ['Social', 'Mostrar cuántos vecinos ya participan'],
        ['Oportuno', 'Invitar a compostar justo cuando llega la primavera'],
      ], 'Cuatro palancas que cualquier proyecto comunitario puede usar.', { d: 2 }),
      clas('¿Esta medida hace más fácil el comportamiento buscado o más difícil?', { // e5
        'Más fácil': ['Bicicletero en la puerta de la escuela', 'Bebedero junto al kiosco', 'Punto verde en la entrada del súper'],
        'Más difícil': ['Tacho de reciclables en el sótano sin luz', 'Formulario de diez páginas para sumarse a la huerta', 'Bicicletero a tres cuadras de la entrada'],
      }, 'Muchas veces el obstáculo no es la voluntad sino la fricción. Sacarla es la primera palanca.', { d: 1 }),
      mult('¿Qué hace que un comportamiento se contagie en un barrio? Marcá todo.', [ // e6
        '+Que sea visible',
        '+Que alguien cercano lo haga primero',
        '+Que sea fácil de copiar',
        '+Que haya ayuda para empezar',
        '-Que se haga en secreto',
      ], 'Visibilidad, cercanía, facilidad y ayuda: así se contagian los hábitos.', { d: 1 }),
      numv(3, (i) => { // e7
        const casas = [40, 60, 30][i];
        const pct = [25, 20, 30][i];
        return {
          enunciado: `En una cuadra de ${casas} casas, el ${pct} % ya composta. ¿Cuántas casas compostan?`,
          valor: (casas * pct) / 100,
          unidad: 'casas',
          explicacion: `${casas} × ${pct} ÷ 100 = ${(casas * pct) / 100} casas. Contarlo en voz alta ("${(casas * pct) / 100} familias de la cuadra ya compostan") es una norma social que invita a sumarse.`,
        };
      }, { d: 1 }),
      vf('Si algo es fácil de hacer, es más probable que la gente lo haga.', true, 'Sacar obstáculos es una de las palancas más efectivas para cambiar comportamientos: muchas veces el problema no es la voluntad, sino la fricción.', {
        razones: ['+Porque sacar obstáculos reduce la fricción para actuar', '-Porque la gente prefiere siempre lo difícil', '-Porque la facilidad no influye en lo que hacemos'],
        d: 1,
      }),
      op('Una escuela quiere que más chicos traigan su botella reutilizable. ¿Qué medida la hace más fácil?', [
        'Instalar bebederos para rellenarla',
        'Dar una charla una vez por año',
        ['Prohibir las botellas descartables sin alternativa', 'Sin un lugar para rellenar, la prohibición sola genera rechazo.'],
        'Pegar un cartel en la dirección',
      ], 'Si rellenar es fácil, traer la botella se vuelve lo más cómodo.', { d: 2 }),
      det('Leé esta campaña escolar y marcá lo que puede funcionar mal.', [ // e8
        ['Pondremos tachos de reciclables al lado de cada tacho común.', false],
        ['El afiche dirá: "Casi nadie en esta escuela recicla".', true, 'Muestra que lo normal es no reciclar; mejor destacar a quienes sí lo hacen.'],
        ['Mostraremos cada mes cuántos kilos se reciclaron.', false],
        ['Los tachos de reciclables estarán solo en la dirección.', true, 'Si es difícil, casi nadie lo va a hacer.'],
      ], 'Fácil, atractivo, social y oportuno: y cuidado con los mensajes que muestran lo contrario.', { d: 2 }),
      comp('Completá.', 'Lo que la gente efectivamente hace es una norma social [descriptiva]; para que un hábito se contagie conviene que sea [visible] y fácil.', ['secreta', 'oculto'], 'Dos ideas para que un comportamiento se contagie.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Organizarse en el barrio', 'Del problema al proyecto: diagnóstico, objetivo, aliados, plan, acción y evaluación.', [
      teoria('De la queja al proyecto', [
        'Muchos problemas ambientales del barrio —un basural en un terreno, una plaza abandonada, un arroyo sucio, falta de árboles— se pueden mejorar con un proyecto comunitario. El camino suele tener varios pasos: entender bien el problema (diagnóstico), elegir un objetivo concreto, sumar aliados, armar un plan, actuar y evaluar lo logrado.',
      ]),
      ord('Ordená los pasos de un proyecto comunitario.', [ // e1
        'Hacer un diagnóstico del problema',
        'Elegir un objetivo concreto y medible',
        'Sumar aliados',
        'Armar un plan con tareas y fechas',
        'Actuar',
        'Evaluar y contar los resultados',
      ], 'Seis pasos que ordenan cualquier proyecto, grande o chico.', { d: 2, extremos: ['Primero', 'Último'] }),
      teoria('Un objetivo concreto', [
        'Un objetivo como "mejorar el ambiente del barrio" es demasiado general. Uno concreto dice qué, cuánto, dónde y para cuándo: "plantar 30 árboles nativos en las veredas de las cuatro cuadras alrededor de la escuela antes de fin de año".',
        'Los objetivos concretos permiten saber si se logró, organizar las tareas y contar los resultados.',
      ]),
      op('¿Cuál de estos es el objetivo más concreto?', [ // e2
        'Instalar 3 composteras en la plaza antes de octubre',
        'Hacer del barrio un lugar más verde y lindo',
        ['Concientizar a todos sobre el ambiente', 'Es importante, pero así planteado no se puede medir ni saber cuándo se logró.'],
        'Cambiar la forma de pensar de los vecinos',
      ], 'Qué, cuánto, dónde y para cuándo. Así se puede planificar y evaluar.', { d: 2 }),
      teoria('Aliados', [
        'Casi ningún proyecto se hace solo. Los aliados pueden ser vecinos, escuelas, clubes, iglesias, comercios, cooperativas, organizaciones ambientales, universidades y el municipio. Cada uno aporta algo: personas, lugar, herramientas, conocimiento, permisos, difusión.',
        'Un buen mapa de aliados pregunta: ¿a quién le importa este problema?, ¿quién puede ayudar?, ¿quién tiene que autorizar?',
      ]),
      par('Uní cada aliado con lo que puede aportar a un proyecto de arbolado.', [ // e3
        ['Vivero municipal', 'Plantines de nativas'],
        ['Escuela', 'Estudiantes y un espacio para aprender'],
        ['Municipio', 'Permisos para plantar en las veredas'],
        ['Ferretería del barrio', 'Herramientas prestadas'],
      ], 'Cada aliado suma una pieza distinta. Juntos hacen posible lo que nadie podría solo.', { d: 1 }),
      clas('¿Qué paso del proyecto es cada acción?', { // e4
        'Diagnóstico': ['Contar cuántos árboles faltan en cada cuadra', 'Preguntar a los vecinos qué problemas ven'],
        'Plan': ['Hacer un calendario de plantación', 'Repartir tareas entre los grupos'],
        'Evaluación': ['Contar cuántos árboles sobrevivieron al año', 'Hacer una encuesta después de la plantación'],
      }, 'Cada etapa tiene sus tareas. Saltarse el diagnóstico o la evaluación es un error común.', { d: 2 }),
      vf('Evaluar un proyecto al final es una pérdida de tiempo si ya se hizo la acción.', false, 'La evaluación muestra qué funcionó, qué no y qué mejorar. Además, contar los resultados ayuda a sumar más gente y apoyo para el próximo paso.', { // e5
        razones: ['+Porque muestra qué funcionó y ayuda a sumar apoyo', '-Porque los proyectos nunca tienen resultados', '-Porque evaluar arruina lo que se hizo'],
        d: 2,
      }),
      cad('Armá la cadena de cómo un proyecto chico puede crecer.', [ // e6
        'Un grupo de vecinos limpia un terreno y arma una huerta',
        'Miden y cuentan lo que lograron',
        'Otros vecinos y la escuela se suman',
        'El municipio apoya con herramientas y agua',
        'La huerta se convierte en un espacio comunitario estable',
      ], ['El proyecto crece solo sin que nadie lo cuente'], 'Empezar chico, mostrar resultados y sumar aliados: el camino de muchos proyectos exitosos.', { d: 2 }),
      mult('¿Qué ayuda a que un proyecto comunitario dure en el tiempo? Marcá todo.', [ // e7
        '+Repartir las tareas entre varias personas',
        '+Tener reuniones periódicas cortas',
        '+Celebrar los logros',
        '+Sumar nuevas personas cada tanto',
        '-Que una sola persona haga todo',
      ], 'Si todo depende de una persona, el proyecto se apaga cuando esa persona se cansa.', { d: 1 }),
      numv(3, (i) => { // e8
        const pl = [30, 50, 20][i];
        const viv = [24, 40, 17][i];
        return {
          enunciado: `Un proyecto plantó ${pl} árboles y al año sobrevivieron ${viv}. ¿Qué porcentaje sobrevivió?`,
          valor: (viv / pl) * 100,
          unidad: '%',
          explicacion: `${viv} ÷ ${pl} × 100 = ${(viv / pl) * 100} %. Medir la supervivencia permite aprender: ¿faltó riego?, ¿se eligieron bien las especies?`,
        };
      }, { d: 1 }),
      det('Leé este plan de un grupo de vecinos y marcá los problemas.', [ // e9
        ['Contamos los árboles que faltan en cada cuadra.', false],
        ['Nuestro objetivo es "salvar el planeta".', true, 'Es demasiado general: conviene un objetivo concreto y medible.'],
        ['Pedimos permiso al municipio y plantines al vivero.', false],
        ['Juan va a hacer todas las tareas porque tiene tiempo.', true, 'Si todo depende de una persona, el proyecto es frágil.'],
      ], 'Un buen proyecto tiene un objetivo concreto y tareas compartidas.', { d: 2 }),
      comp('Completá.', 'Todo proyecto empieza con un [diagnóstico]; necesita un objetivo [concreto]; y termina con una [evaluación].', ['festejo', 'general', 'queja'], 'La estructura de cualquier proyecto comunitario.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Hablar para sumar', 'Escuchar, partir de lo que le importa al otro y contar historias cercanas: cómo conversar de ambiente para que la gente se acerque.', [
      teoria('Empezar por lo que le importa al otro', [
        'Las personas se interesan por el ambiente por razones distintas: la salud de sus hijos, el ahorro de plata, el amor por un lugar, la fe, la justicia, el trabajo. Una conversación funciona mejor cuando parte de lo que le importa a la otra persona, en lugar de lo que le importa a quien habla.',
        'Por ejemplo, a alguien preocupado por la plata le puede interesar más el ahorro de la eficiencia energética que las toneladas de CO₂.',
      ]),
      par('Uní cada interés con una forma de hablar de ambiente que conecta con él.', [ // e1
        ['Ahorro de plata', 'Cuánto se ahorra en la factura con eficiencia'],
        ['Salud de los chicos', 'Aire limpio y calles seguras para ir a la escuela'],
        ['Amor por un lugar', 'Cuidar el río o la sierra donde creciste'],
        ['Justicia', 'Quiénes sufren más la contaminación y los extremos del clima'],
      ], 'El mismo tema puede contarse de muchas formas. La mejor es la que conecta con el otro.', { d: 2 }),
      teoria('Escuchar primero', [
        'En una conversación difícil, escuchar primero y hacer preguntas abiertas ("¿qué te preocupa?", "¿cómo lo ves vos?") genera más confianza que dar datos de entrada. Cuando alguien se siente escuchado, está más dispuesto a escuchar.',
        'Los datos siguen siendo importantes, pero funcionan mejor dentro de una historia cercana que en una lista de números.',
      ]),
      op('Tu tía dice que "eso del cambio climático es exagerado". ¿Qué conviene hacer primero?', [ // e2
        'Preguntarle qué la hace pensar eso y escucharla',
        'Mostrarle diez gráficos de temperatura seguidos',
        ['Decirle que está equivocada y cambiar de tema', 'Cortar la conversación cierra la puerta; escuchar la abre.'],
        'Mandarle un video largo sin comentarios',
      ], 'Escuchar primero no es darle la razón: es entender desde dónde habla, para poder conversar de verdad.', { d: 2 }),
      vf('Para convencer a alguien, lo mejor es darle la mayor cantidad posible de datos de una sola vez.', false, 'Una avalancha de datos suele generar rechazo. Conecta mejor partir de lo que le importa, escuchar y usar pocos datos bien elegidos dentro de una historia.', { // e3
        razones: ['+Porque una avalancha de datos suele generar rechazo', '-Porque los datos no sirven nunca', '-Porque las personas no entienden los números'],
        d: 2,
      }),
      teoria('Historias cercanas y soluciones', [
        'Los problemas lejanos y enormes —los polos, el planeta entero— pueden generar distancia o angustia. Las historias cercanas —el arroyo del barrio, la ola de calor del último verano, la cooperativa que recicla en tu ciudad— conectan más.',
        'Y hablar de soluciones que ya están funcionando genera más ganas de actuar que hablar solo de catástrofes.',
      ]),
      clas('¿Esta forma de contar suele acercar o alejar a la gente?', { // e4
        'Acerca': ['La historia de una cooperativa de recicladores del barrio', 'Cuánto ahorró una familia con burletes', 'Cómo volvieron los pájaros a la plaza con nativas'],
        'Aleja': ['Solo imágenes de catástrofes sin salida', 'Culpar a quien escucha de todos los problemas', 'Una lista de veinte datos sin contexto'],
      }, 'Cercanía y soluciones acercan. Culpa y catástrofe sin salida alejan.', { d: 2 }),
      cad('Armá la cadena de una conversación que suma.', [ // e5
        'Preguntar qué le preocupa a la otra persona',
        'Escuchar sin interrumpir',
        'Encontrar algo en común',
        'Contar una historia cercana con una solución',
        'Invitar a una acción concreta y fácil',
      ], ['Empezar diciendo que está todo perdido'], 'Escuchar, conectar, contar y proponer: una conversación que abre puertas.', { d: 2 }),
      mult('¿Qué conviene evitar al hablar de ambiente con alguien que piensa distinto? Marcá todo.', [ // e6
        '+Burlarse de lo que piensa',
        '+Culparlo de todo',
        '+Dar una catarata de datos sin escuchar',
        '+Hablar solo de catástrofes sin soluciones',
        '-Hacer preguntas abiertas',
      ], 'Las preguntas abiertas son justamente lo que conviene hacer.', { d: 1 }),
      rank('Ordená estas invitaciones de la más fácil de aceptar a la más difícil, para alguien que recién empieza.', [ // e7
        ['"¿Venís el sábado un rato a la plantación de la plaza?"', 'muy fácil'],
        ['"¿Te sumás a separar los reciclables en casa?"', 'fácil'],
        ['"¿Querés organizar vos la próxima jornada?"', 'difícil'],
        ['"Tenés que cambiar toda tu forma de vivir"', 'muy difícil'],
      ], 'Empezar con algo fácil y concreto permite que las personas se sumen de a poco.', { d: 2, extremos: ['Más fácil', 'Más difícil'] }),
      op('¿Cuál de estas es una pregunta abierta, que invita a conversar?', [
        '¿Qué es lo que más te preocupa del barrio?',
        '¿No te importa el planeta, no?',
        ['¿Estás de acuerdo conmigo, sí o no?', 'Las preguntas de sí o no cierran la conversación; las abiertas la abren.'],
        '¿Viste que yo tenía razón?',
      ], 'Las preguntas abiertas invitan a la otra persona a contar lo que piensa.', { d: 1 }),
      vf('Hablar de soluciones que ya funcionan suele generar más ganas de actuar que hablar solo de catástrofes.', true, 'Las soluciones muestran que se puede hacer algo; las catástrofes sin salida suelen generar impotencia y rechazo.', {
        razones: ['+Porque muestran que actuar sirve', '-Porque las catástrofes no existen', '-Porque a nadie le interesan las soluciones'],
        d: 1,
      }),
      det('Leé este mensaje que alguien quiere mandar al grupo de la familia y marcá lo que puede alejar.', [ // e8
        ['Este finde plantamos árboles en la plaza, ¿alguien se suma?', false],
        ['Si no venís es porque no te importa el planeta.', true, 'Culpar aleja; mejor invitar sin juzgar.'],
        ['Llevamos mate y facturas.', false],
        ['Igual ya es tarde, el mundo se termina.', true, 'El mensaje de catástrofe sin salida desanima a actuar.'],
      ], 'Invitar sin culpa y con esperanza suma mucho más.', { d: 2 }),
      comp('Completá.', 'Para hablar de ambiente conviene [escuchar] primero, partir de lo que le [importa] al otro y contar historias con [soluciones].', ['gritar', 'molesta', 'culpas'], 'Tres claves para conversaciones que suman.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Ecoansiedad y esperanza activa', 'La preocupación por el ambiente es comprensible. Cómo reconocerla, cuidarse y convertirla en acción.', [
      teoria('Qué es la ecoansiedad', [
        'La ecoansiedad es la preocupación, el miedo o la angustia que siente mucha gente frente a los problemas ambientales, sobre todo el cambio climático. No es una enfermedad: es una reacción comprensible frente a un problema real. Estudios con niños y jóvenes de distintos países encontraron que muchos sienten preocupación, tristeza o enojo por el futuro del planeta.',
        'Se vuelve un problema cuando paraliza, afecta el sueño o la vida cotidiana, o lleva a la desesperanza.',
      ]),
      vf('Sentir preocupación por el cambio climático es un trastorno mental.', false, 'Es una reacción comprensible frente a un problema real. Solo se vuelve un problema de salud cuando paraliza o afecta mucho la vida cotidiana; en ese caso, conviene pedir ayuda.', { // e1
        razones: ['+Porque es una reacción comprensible frente a un problema real', '-Porque nadie se preocupa por el ambiente', '-Porque preocuparse cura el problema'],
        d: 2,
      }),
      teoria('Qué ayuda', [
        'Varias cosas ayudan a transformar la angustia en algo más llevadero: hablar de lo que se siente con otras personas, informarse con fuentes confiables sin sobreexponerse a noticias catastróficas, hacer algo concreto (la acción reduce la sensación de impotencia), participar con otros y conectar con la naturaleza.',
        'Si la angustia es muy fuerte o dura mucho, es importante hablar con alguien de confianza o con un profesional de la salud mental.',
      ]),
      mult('¿Qué ayuda a manejar la ecoansiedad? Marcá todo.', [ // e2
        '+Hablar de lo que se siente',
        '+Hacer algo concreto con otros',
        '+Informarse con fuentes confiables sin sobreexponerse',
        '+Pasar tiempo en la naturaleza',
        '-Mirar noticias catastróficas todo el día',
      ], 'La sobreexposición a noticias angustiantes aumenta la ansiedad. Actuar con otros y conectar con la naturaleza, en cambio, ayudan.', { d: 1 }),
      teoria('Esperanza activa', [
        'La esperanza activa no es pensar que todo va a salir bien solo: es actuar para que salga mejor, aunque no haya garantías. Se apoya en hechos reales: la capa de ozono se está recuperando, las energías renovables crecieron muchísimo, especies que estaban al borde de desaparecer se recuperaron, ríos contaminados se limpiaron.',
        'Cada décima de grado de calentamiento que se evita importa. No es "todo o nada": cuanto más se haga, mejor.',
      ]),
      cad('Armá la cadena de cómo la acción puede reducir la angustia.', [ // e3
        'Una persona siente angustia por el ambiente',
        'Se suma a un grupo que planta árboles en su barrio',
        'Conoce gente con las mismas preocupaciones',
        'Ve resultados concretos de lo que hacen',
        'Siente menos impotencia y más esperanza',
      ], ['La acción hace que el problema desaparezca del todo'], 'La acción colectiva no resuelve todo, pero cambia cómo se vive la preocupación.', { d: 2 }),
      clas('¿Es un hecho que alimenta la esperanza activa o un pensamiento que paraliza?', { // e4
        'Alimenta la esperanza': ['La capa de ozono se está recuperando', 'Las renovables crecieron muchísimo en diez años', 'El yaguareté volvió a nacer en los Esteros del Iberá'],
        'Paraliza': ['Ya es tarde, no hay nada que hacer', 'Lo que yo haga no importa', 'Si no se resuelve todo, no sirve nada'],
      }, 'La esperanza activa se apoya en hechos y en que cada avance cuenta.', { d: 2 }),
      op('Una compañera dice que está muy angustiada por el clima y no puede dormir. ¿Qué es lo más adecuado?', [ // e5
        'Escucharla y sugerir pedir ayuda',
        'Decirle que exagera y que no piense en eso',
        ['Mostrarle más noticias sobre el tema para que se informe', 'Si ya está angustiada, más noticias pueden empeorarlo.'],
        'Decirle que tiene razón y que todo está perdido',
      ], 'Escuchar sin minimizar y, si afecta el sueño o la vida diaria, buscar ayuda.', { d: 2 }),
      par('Uní cada estrategia con cómo ayuda.', [ // e6
        ['Hablar con otros', 'Saber que no estás solo'],
        ['Actuar en grupo', 'Reduce la sensación de impotencia'],
        ['Limitar las noticias', 'Evita la sobreexposición'],
        ['Contacto con la naturaleza', 'Descansa y reconecta con lo que se quiere cuidar'],
      ], 'Estrategias simples que ayudan a sostener el compromiso sin quemarse.', { d: 1 }),
      rank('Ordená estas frases de la más útil a la menos útil para alguien con ecoansiedad.', [ // e7
        ['"Es entendible lo que sentís; ¿querés que hagamos algo juntos?"', 'escucha e invita'],
        ['"Hay avances reales, como la capa de ozono"', 'da esperanza con hechos'],
        ['"No pienses en eso"', 'minimiza'],
        ['"Ya es tarde, no hay nada que hacer"', 'paraliza'],
      ], 'Validar, acompañar y mostrar caminos: eso ayuda. Minimizar o dramatizar, no.', { d: 2, extremos: ['Más útil', 'Menos útil'] }),
      det('Leé este consejo en redes y marcá lo equivocado.', [ // e8
        ['Si te angustia el clima, hablalo con alguien.', false],
        ['Leé todas las noticias de catástrofes que encuentres para estar informado.', true, 'La sobreexposición a noticias catastróficas aumenta la angustia.'],
        ['Sumarte a un grupo que actúa ayuda a sentirte menos solo.', false],
        ['Si no se puede resolver todo, no vale la pena hacer nada.', true, 'Cada avance importa: no es todo o nada.'],
      ], 'Cuidarse también es parte de cuidar el ambiente a largo plazo.', { d: 2 }),
      comp('Completá.', 'La preocupación por los problemas ambientales se llama [ecoansiedad]; actuar sin garantías pero con compromiso es esperanza [activa].', ['nostalgia', 'pasiva'], 'Dos ideas para sostener el compromiso sin paralizarse.', { d: 1 }),
      est('Estimá cuántas décimas de grado de calentamiento "valen la pena" evitar, según la idea de que no es todo o nada.', 1, { min: 0, max: 10, paso: 1, unidad: 'décimas' }, 'Todas: cada décima que se evita reduce impactos. Por eso ninguna acción es "demasiado chica" si suma a la dirección correcta.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: del yo al nosotros', 'Bienes comunes, contagio social, proyectos, comunicación y esperanza, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: la plaza abandonada', 'Un grupo de vecinos quiere recuperar la plaza de la cuadra. Armá con ellos el proyecto completo.', [
      teoria('La plaza', [
        'La plaza del barrio tiene los canteros secos, basura acumulada en una esquina, dos bancos rotos y ningún árbol nuevo desde hace años. Un grupo de cinco vecinos quiere recuperarla. En la cuadra hay una escuela, un club de barrio, una ferretería y un centro de jubilados. El municipio tiene un vivero de nativas.',
        'Algunos vecinos dicen que "no tiene sentido, la van a romper de nuevo".',
      ]),
      op('¿Cuál es el mejor primer paso?', [ // e1
        'Hacer un diagnóstico con los vecinos y la escuela',
        'Plantar árboles el sábado sin hablar con nadie',
        ['Pedirle al municipio que lo haga todo', 'El municipio es un aliado clave, pero sin diagnóstico ni participación el proyecto es frágil.'],
        'Poner rejas alrededor de la plaza',
      ], 'Entender qué pasa y qué quiere la gente hace que el proyecto sea de todos, y que lo cuiden.', { d: 3 }),
      op('¿Cuál es el objetivo más adecuado para empezar?', [ // e2
        'Limpiar la esquina y plantar 10 nativas',
        'Que el barrio sea el más lindo de la ciudad',
        ['Que nadie vuelva a tirar basura nunca', 'Es deseable, pero no se puede medir ni garantizar al empezar.'],
        'Cambiar la mentalidad de todos los vecinos',
      ], 'Concreto, medible y alcanzable: así se arranca y se puede mostrar un logro.', { d: 3 }),
      clas('Asigná cada aliado a lo que puede aportar.', { // e3
        'Plantines y permisos': ['Vivero municipal', 'Municipio'],
        'Personas y difusión': ['Escuela', 'Club de barrio', 'Centro de jubilados'],
        'Herramientas': ['Ferretería'],
      }, 'Cada aliado aporta una pieza. El mapa de aliados convierte un grupo de cinco en un barrio.', { d: 2 }),
      mult('¿Qué ayuda a que los vecinos cuiden la plaza después? Marcá todo.', [ // e4
        '+Que participen en decidir y en plantar',
        '+Carteles con los nombres de quienes plantaron cada árbol',
        '+Turnos de riego compartidos',
        '+Contar los avances en el grupo del barrio',
        '-Hacerlo en secreto para que sea una sorpresa',
      ], 'Lo que la gente ayudó a construir, lo cuida. La participación es la mejor protección.', { d: 2 }),
      det('Un vecino escribe el mensaje de convocatoria. Marcá lo que conviene cambiar.', [ // e5
        ['Este sábado a las 10 recuperamos juntos la plaza.', false],
        ['Si no venís, después no te quejes de la basura.', true, 'Culpar aleja: mejor invitar en positivo.'],
        ['Ya se sumaron la escuela y el club.', false],
        ['Total, seguro la rompen otra vez.', true, 'El mensaje derrotista desanima antes de empezar.'],
      ], 'Invitar en positivo, mostrar que otros ya se sumaron y evitar la culpa.', { d: 2 }),
      numv(3, (i) => { // e6
        const pl = [10, 20, 15][i];
        const viv = [8, 17, 12][i];
        return {
          enunciado: `Plantaron ${pl} nativas y a los seis meses sobreviven ${viv}. ¿Qué porcentaje sobrevivió?`,
          valor: (viv / pl) * 100,
          unidad: '%',
          explicacion: `${viv} ÷ ${pl} × 100 = ${(viv / pl) * 100} %. Contarlo en el grupo del barrio muestra resultados y suma gente para la próxima etapa.`,
        };
      }, { d: 1 }),
      ord('Ordená el proyecto completo.', [ // e7
        'Reunión con vecinos y escuela para el diagnóstico',
        'Acordar el objetivo: limpiar la esquina y plantar 10 nativas',
        'Conseguir plantines, permisos y herramientas',
        'Jornada de limpieza y plantación',
        'Turnos de riego y medición de la supervivencia',
        'Contar los resultados y planear la segunda etapa',
      ], 'Del diagnóstico a la segunda etapa: un proyecto que puede crecer.', { d: 3, extremos: ['Primero', 'Último'] }),
    ]),
  ],
});
