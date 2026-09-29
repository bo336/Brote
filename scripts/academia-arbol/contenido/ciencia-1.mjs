import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// CIENCIA 1 — Cómo sabemos lo que sabemos.
// La base de la rama: observar e inferir, formular hipótesis, diseñar un
// experimento justo, medir bien, no confundir correlación con causa y
// entender cómo avanza y se corrige la ciencia. Retoma medir para entender
// (tronco-2).

export default unidad({
  slug: 'ciencia-1',
  rama: 'ciencia',
  orden: 1,
  nivel: 1,
  requiereTronco: 1,
  titulo: 'Cómo sabemos lo que sabemos',
  bajada: 'Observar, preguntar, probar y corregir: el método que permite saber que el clima cambia, que un remedio funciona o que un río está contaminado.',
  objetivos: [
    'Distinguir observaciones de inferencias y formular preguntas investigables',
    'Diseñar un experimento justo con variables y grupo de control',
    'Reconocer errores de medición y la importancia del tamaño de la muestra',
    'Diferenciar correlación de causalidad',
    'Explicar cómo la ciencia construye consenso y se corrige',
  ],
  repasa: ['tronco-2'],
  fuentes: ['consenso-cook-2016', 'ipcc-ar6-syr', 'nasa-evidencia', 'chequeado', 'ncse-ozono', 'naaee-guidelines'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Observar y preguntar', 'La diferencia entre lo que ves y lo que suponés, y cómo convertir una curiosidad en una pregunta que se pueda investigar.', [
      teoria('Observación e inferencia', [
        'Una observación es lo que se percibe directamente con los sentidos o con instrumentos: "el agua del arroyo es marrón", "el termómetro marca 32 °C", "hay 12 horneros en la plaza". Una inferencia es una interpretación de lo observado: "el arroyo está contaminado", "hace más calor que antes", "a los horneros les gusta esta plaza".',
        'Las inferencias pueden ser correctas o no. El primer paso del pensamiento científico es separar lo que se ve de lo que se supone.',
      ]),
      clas('¿Es una observación o una inferencia?', { // e1
        'Observación': ['El agua del arroyo es marrón', 'El termómetro marca 32 °C', 'Conté 12 horneros en la plaza'],
        'Inferencia': ['El arroyo está contaminado por una fábrica', 'Este verano es más caluroso por el cambio climático', 'A los horneros les gusta esta plaza'],
      }, 'El agua marrón puede ser sedimento de una lluvia, no contaminación. Separar lo que se ve de lo que se supone evita conclusiones apuradas.', { d: 2 }),
      vf('"El agua del arroyo está contaminada" es una observación directa.', false, 'Es una inferencia: se ve el color, el olor o la espuma, pero para saber si está contaminada hay que medir. El agua marrón puede ser solo barro.', { // e2
        razones: ['+Porque es una interpretación que hay que comprobar midiendo', '-Porque la contaminación siempre se ve a simple vista', '-Porque todo lo que se dice sobre el agua es una observación'],
        d: 2,
      }),
      teoria('Preguntas que se pueden investigar', [
        'No toda pregunta se puede responder con ciencia. "¿Es lindo el río?" depende de gustos. "¿Cuánto oxígeno disuelto tiene el río antes y después de la fábrica?" se puede medir.',
        'Una buena pregunta investigable es concreta, se puede responder con datos y dice qué se va a comparar o medir.',
      ]),
      clas('¿Esta pregunta se puede investigar con datos o no?', { // e3
        'Investigable': ['¿Crecen más los porotos con compost que sin compost?', '¿Cuántas aves visitan la plaza a la mañana y a la tarde?', '¿Baja la temperatura bajo los árboles de la vereda?'],
        'No investigable así': ['¿Es más lindo el ceibo que el jacarandá?', '¿Deberían gustarle a todos las plantas nativas?'],
      }, 'Las preguntas de gusto u opinión no se resuelven midiendo. Las que comparan o cuantifican, sí.', { d: 2 }),
      op('¿Cuál es la pregunta más investigable?', [ // e4
        '¿Baja el consumo si se apagan las luces en los recreos?',
        '¿Es importante que todos cuidemos la energía en la escuela?',
        ['¿Qué opina la gente sobre la energía solar en general?', 'Se puede investigar con encuestas, pero así planteada es vaga: ¿qué gente?, ¿qué opinión?'],
        '¿Está mal gastar energía durante los recreos de la escuela?',
      ], 'Concreta, medible y con una comparación clara: antes y después de apagar las luces.', { d: 2 }),
      teoria('Del problema a la pregunta', [
        'Muchas veces se parte de un problema general —"el arroyo está feo"— y hay que convertirlo en preguntas concretas: ¿qué parámetros del agua cambian?, ¿dónde?, ¿cuándo?, ¿cuánto? Cada pregunta concreta lleva a una medición.',
      ]),
      ord('Ordená los pasos para pasar de una curiosidad a una pregunta investigable.', [ // e5
        'Notar algo que llama la atención',
        'Describir lo observado sin interpretar',
        'Pensar posibles explicaciones',
        'Formular una pregunta concreta que se pueda medir',
      ], 'De la curiosidad a la pregunta: observar, describir, imaginar y precisar.', { d: 2, extremos: ['Primero', 'Último'] }),
      mult('¿Qué hace que una pregunta sea buena para investigar? Marcá todo.', [ // e6
        '+Que sea concreta',
        '+Que se pueda responder con datos',
        '+Que diga qué se va a comparar o medir',
        '+Que se pueda investigar con los recursos disponibles',
        '-Que la respuesta ya se sepa de antemano',
      ], 'Si ya se sabe la respuesta, no hay investigación: hay confirmación de prejuicios.', { d: 1 }),
      par('Uní cada observación con una inferencia posible.', [ // e7
        ['Hay espuma blanca en el arroyo', 'Puede haber detergentes en el agua'],
        ['Los árboles de una cuadra tienen hojas amarillas en verano', 'Puede faltarles agua o nutrientes'],
        ['No se ven lombrices en el cantero', 'El suelo puede estar compactado o pobre'],
        ['El medidor de luz gira rápido a la noche', 'Puede haber un aparato encendido'],
      ], 'Cada inferencia es una posibilidad que hay que comprobar, no una conclusión.', { d: 2 }),
      det('Leé este informe de un grupo escolar y marcá lo que es inferencia presentada como si fuera un hecho.', [ // e8
        ['Medimos 4 mg/L de oxígeno disuelto aguas abajo del puente.', false],
        ['La fábrica de al lado es la culpable de la contaminación.', true, 'Es una inferencia: hay que comparar aguas arriba y abajo de la descarga y descartar otras causas.'],
        ['Aguas arriba medimos 7 mg/L.', false],
        ['Todos los peces del arroyo se murieron.', true, 'No se observó todo el arroyo: es una generalización que no surge de las mediciones.'],
      ], 'Los datos son el piso. Las interpretaciones hay que presentarlas como hipótesis hasta probarlas.', { d: 3 }),
      comp('Completá.', 'Lo que se percibe directamente es una [observación]; lo que se interpreta a partir de eso es una [inferencia]; y una buena pregunta se puede responder con [datos].', ['opinión', 'certeza', 'gustos'], 'Tres ideas para empezar a pensar como científico o científica.', { d: 1 }),
      vf('Una inferencia siempre es falsa.', false, 'Las inferencias pueden ser correctas o no: por eso se comprueban. Muchas inferencias bien hechas terminan confirmadas con datos.', { // e10
        razones: ['+Porque puede ser correcta o no, y por eso se comprueba', '-Porque las inferencias nunca se pueden comprobar', '-Porque las inferencias son lo mismo que las observaciones'],
        d: 1,
      }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Hipótesis y experimentos', 'Variables, grupo de control y repeticiones: cómo diseñar una prueba justa.', [
      teoria('La hipótesis', [
        'Una hipótesis es una explicación posible que se puede poner a prueba. Suele escribirse como una predicción: "si agrego compost a las macetas, los porotos crecerán más que sin compost".',
        'Una buena hipótesis puede resultar falsa: si no hay ningún resultado posible que la contradiga, no se puede poner a prueba.',
      ]),
      op('¿Cuál es una hipótesis que se puede poner a prueba?', [ // e1
        'Regadas con lluvia, crecerán más que con agua de red',
        'Las plantas son seres maravillosos y llenos de vida',
        ['Las plantas crecen y cambian con el paso del tiempo', 'Es cierto, pero no predice nada que se pueda comparar.'],
        'Algunas plantas pueden crecer más o menos que otras',
      ], 'Una hipótesis útil predice algo concreto que podría no cumplirse.', { d: 2 }),
      teoria('Variables', [
        'En un experimento hay tres tipos de variables. La variable independiente es la que se cambia a propósito (con o sin compost). La variable dependiente es la que se mide para ver el efecto (la altura de los porotos). Y las variables controladas son todas las demás, que se mantienen iguales (la luz, el agua, la maceta, la semilla).',
        'Si cambian varias cosas a la vez, no se puede saber cuál causó la diferencia.',
      ]),
      par('En el experimento de los porotos con y sin compost, uní cada cosa con su tipo de variable.', [ // e2
        ['Con o sin compost', 'Variable independiente'],
        ['Altura de los porotos', 'Variable dependiente'],
        ['Cantidad de agua de riego', 'Variable controlada'],
      ], 'Se cambia una sola cosa, se mide el efecto y todo lo demás se mantiene igual.', { d: 2 }),
      teoria('El grupo de control', [
        'Para saber si algo tiene efecto hay que compararlo con un grupo al que no se le aplica: el grupo de control. Si se agrega compost a todas las macetas, no hay con qué comparar. Se necesitan macetas iguales sin compost.',
        'Y hacen falta varias macetas en cada grupo, no una: con una sola, una semilla mala puede arruinar la conclusión. Repetir es la forma de separar el efecto real del azar.',
      ]),
      cad('Armá la cadena de por qué hacen falta varias macetas en cada grupo.', [ // e3
        'Cada semilla es un poco distinta',
        'Con una sola maceta por grupo, una semilla mala cambia todo',
        'Con muchas macetas, las diferencias al azar se compensan',
        'La comparación entre grupos se vuelve confiable',
      ], ['Con más macetas las plantas crecen más rápido'], 'Repetir es la defensa contra el azar. Por eso los ensayos serios usan muchas repeticiones.', { d: 2 }),
      vf('Para probar si el compost ayuda, alcanza con poner compost en una maceta y ver si la planta crece.', false, 'Sin grupo de control no se sabe si habría crecido igual sin compost. Y con una sola maceta, el azar puede engañar.', { // e4
        razones: ['+Porque sin comparación y sin repeticiones no se sabe si fue el compost', '-Porque el compost nunca tiene efecto', '-Porque las plantas no crecen en macetas'],
        d: 2,
      }),
      teoria('Una prueba justa', [
        'Un experimento es justo cuando la única diferencia entre los grupos es la variable que se estudia. Si las macetas con compost están al sol y las otras a la sombra, cualquier diferencia podría deberse a la luz.',
        'Para evitar sesgos, a veces se asignan las macetas a cada grupo al azar, y quien mide no sabe cuál es cuál.',
      ]),
      det('Leé este diseño de experimento y marcá los errores.', [ // e5
        ['Queremos saber si el compost ayuda a crecer a los porotos.', false],
        ['Pusimos las macetas con compost al sol y las sin compost a la sombra.', true, 'La luz cambia entre grupos: no se sabe si la diferencia es por el compost o por el sol.'],
        ['Usamos 10 macetas por grupo, con el mismo tipo de semilla.', false],
        ['Las macetas con compost las regamos el doble.', true, 'El riego debe ser igual: si no, no se sabe qué causó la diferencia.'],
      ], 'Una sola diferencia entre grupos. Todo lo demás, igual.', { d: 3 }),
      ord('Ordená los pasos de un experimento sobre el compost.', [ // e6
        'Formular la hipótesis',
        'Preparar dos grupos de macetas iguales',
        'Agregar compost solo a uno de los grupos',
        'Cuidar todas las macetas igual durante semanas',
        'Medir la altura y comparar los grupos',
      ], 'Hipótesis, grupos, tratamiento, condiciones iguales y medición.', { d: 1, extremos: ['Primero', 'Último'] }),
      mult('¿Qué hace más confiable un experimento? Marcá todo.', [ // e7
        '+Tener un grupo de control',
        '+Repetir con varias unidades por grupo',
        '+Cambiar solo una variable',
        '+Asignar al azar cuál unidad va a cada grupo',
        '-Elegir para el tratamiento las plantas más lindas',
      ], 'Elegir las más lindas para el tratamiento sesga el resultado a favor de la hipótesis.', { d: 2 }),
      numv(3, (i) => { // e8
        const con = [[12, 14, 13, 15, 16], [20, 22, 18, 21, 19], [8, 9, 10, 9, 9]][i];
        const sin = [[10, 11, 9, 12, 13], [17, 18, 16, 19, 15], [7, 8, 7, 9, 9]][i];
        const pc = con.reduce((a, b) => a + b, 0) / 5;
        const ps = sin.reduce((a, b) => a + b, 0) / 5;
        return {
          enunciado: `Alturas en cm con compost: ${con.join(', ')}. Sin compost: ${sin.join(', ')}. ¿Cuántos cm más mide en promedio el grupo con compost?`,
          valor: Math.round((pc - ps) * 10) / 10,
          unidad: 'cm',
          dec: 1,
          explicacion: `Promedio con compost: ${pc.toLocaleString('es-AR')} cm. Sin compost: ${ps.toLocaleString('es-AR')} cm. Diferencia: ${(Math.round((pc - ps) * 10) / 10).toLocaleString('es-AR')} cm. Comparar promedios de varios casos es más confiable que comparar una planta con otra.`,
        };
      }, { d: 2 }),
      comp('Completá.', 'En un experimento se cambia la variable [independiente], se mide la variable [dependiente] y se compara con un grupo de [control].', ['aleatoria', 'favorita', 'azar'], 'La estructura básica de cualquier experimento justo.', { d: 2 }),
      clas('¿Esta variable del experimento del compost hay que mantenerla igual en los dos grupos o es la que se cambia?', { // e10
        'Se mantiene igual': ['Tipo de semilla', 'Tamaño de la maceta', 'Horas de sol'],
        'Se cambia a propósito': ['Presencia de compost'],
      }, 'Todas menos una. Por eso se dice que se controlan las variables.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Medir bien', 'Exactitud, precisión, errores y muestras: por qué una medición mal hecha puede llevar a conclusiones falsas.', [
      teoria('Exactitud y precisión', [
        'Una medición es exacta cuando se acerca al valor real. Es precisa cuando, al repetirla, da valores parecidos entre sí. Un termómetro mal calibrado puede ser muy preciso (siempre marca 2 °C de más) pero no exacto.',
        'Por eso los instrumentos se calibran, comparándolos con una referencia conocida.',
      ]),
      par('Uní cada situación con cómo es la medición.', [ // e1
        ['Tres mediciones de 25,1; 25,0 y 25,2 °C, con valor real 25 °C', 'Exacta y precisa'],
        ['Tres mediciones de 27,1; 27,0 y 27,2 °C, con valor real 25 °C', 'Precisa pero no exacta'],
        ['Tres mediciones de 22; 28 y 25 °C, con valor real 25 °C', 'Exacta en promedio pero poco precisa'],
        ['Tres mediciones de 30; 21 y 34 °C, con valor real 25 °C', 'Ni exacta ni precisa'],
      ], 'Precisión es repetir parecido; exactitud es acertar al valor real. Se pueden tener una sin la otra.', { d: 3 }),
      teoria('Errores', [
        'Toda medición tiene algún error. Los errores al azar hacen que los valores se dispersen para un lado y para el otro; se reducen repitiendo y promediando. Los errores sistemáticos empujan siempre en la misma dirección —un termómetro al sol, una balanza mal tarada— y no se arreglan promediando: hay que corregir el método o el instrumento.',
      ]),
      clas('¿Es un error al azar o sistemático?', { // e2
        'Al azar': ['Pequeñas diferencias al leer una regla', 'Variaciones de una medición a otra con el mismo instrumento'],
        'Sistemático': ['Un termómetro colgado al sol', 'Una balanza que marca 100 g aunque esté vacía', 'Medir siempre el tránsito en el horario pico'],
      }, 'Promediar arregla el azar, pero no el sesgo. Un termómetro al sol siempre va a marcar de más.', { d: 3 }),
      vf('Si un termómetro está al sol, alcanza con medir muchas veces y promediar para corregir el error.', false, 'Es un error sistemático: todas las mediciones van a estar altas. Promediar no lo corrige; hay que ponerlo a la sombra, como en las estaciones meteorológicas.', { // e3
        razones: ['+Porque es un error sistemático que empuja siempre hacia arriba', '-Porque los termómetros no se ven afectados por el sol', '-Porque promediar corrige cualquier error'],
        d: 3,
      }),
      teoria('La muestra', [
        'Casi nunca se puede medir todo: todos los árboles de una ciudad, todas las casas, toda el agua de un río. Se mide una muestra y se generaliza. Para que eso funcione, la muestra tiene que ser suficientemente grande y representativa: parecida al conjunto en lo que importa.',
        'Si se encuesta solo a los vecinos de un barrio rico sobre el acceso al agua, la conclusión no vale para toda la ciudad.',
      ]),
      op('Querés saber cuánta basura genera por día cada casa de tu ciudad. ¿Qué muestra es mejor?', [ // e4
        'Casas de distintos barrios elegidas al azar',
        'Las casas de tu cuadra',
        ['Las casas de tus amigos', 'Se parecen a vos: la muestra estaría sesgada.'],
        'Solo las casas más grandes, que generan más',
      ], 'Al azar y de distintos barrios: así la muestra se parece a la ciudad.', { d: 2 }),
      cad('Armá la cadena de cómo una muestra sesgada lleva a una conclusión falsa.', [ // e5
        'Se encuesta solo a personas en un gimnasio',
        'La muestra tiene más gente que hace ejercicio',
        'El resultado muestra mucha actividad física',
        'Se concluye que toda la ciudad hace mucho ejercicio',
      ], ['La muestra del gimnasio representa bien a toda la ciudad'], 'El problema no es el cálculo: es a quién se le preguntó.', { d: 2 }),
      numv(3, (i) => { // e6
        const vals = [[120, 118, 122, 119, 121], [48, 52, 50, 49, 51], [7, 9, 8, 8, 8]][i];
        const p = vals.reduce((a, b) => a + b, 0) / vals.length;
        return {
          enunciado: `Cinco mediciones repetidas de lo mismo dieron: ${vals.join(', ')}. ¿Cuál es el promedio?`,
          valor: p,
          unidad: '',
          dec: 1,
          explicacion: `(${vals.join(' + ')}) ÷ 5 = ${p.toLocaleString('es-AR')}. Repetir y promediar reduce el efecto de los errores al azar.`,
        };
      }, { d: 1 }),
      mult('¿Qué mejora la calidad de una medición? Marcá todo.', [ // e7
        '+Calibrar el instrumento',
        '+Repetir la medición varias veces',
        '+Medir siempre con el mismo método',
        '+Anotar las condiciones en que se midió',
        '-Redondear los números para que queden lindos',
      ], 'Calibrar, repetir, estandarizar y registrar. Redondear de más pierde información.', { d: 2 }),
      rank('Ordená estas muestras de la más confiable a la menos, para estimar el consumo de agua de una ciudad.', [ // e8
        ['1.000 casas elegidas al azar en toda la ciudad', 'grande y representativa'],
        ['1.000 casas de un solo barrio', 'grande pero sesgada'],
        ['20 casas elegidas al azar', 'representativa pero chica'],
        ['Tu casa', 'un solo caso'],
      ], 'Tamaño y representatividad importan los dos. Mil casas de un barrio no dicen lo mismo que mil al azar.', { d: 3, extremos: ['Más confiable', 'Menos confiable'] }),
      det('Leé esta conclusión y marcá lo cuestionable.', [ // e9
        ['Medimos la temperatura con un termómetro calibrado, a la sombra.', false],
        ['Le preguntamos a 5 compañeros y el 100 % recicla: en la ciudad todos reciclan.', true, 'Muestra chica y no representativa: no se puede generalizar a la ciudad.'],
        ['Repetimos cada medición tres veces y promediamos.', false],
        ['La balanza marcaba 50 g vacía, pero no importa porque pesamos muchas veces.', true, 'Es un error sistemático: hay que tarar la balanza o restar esos 50 g.'],
      ], 'Muestras y errores: dos lugares donde se esconden las conclusiones falsas.', { d: 3 }),
      comp('Completá.', 'Una medición cercana al valor real es [exacta]; una que da valores parecidos al repetirla es [precisa]; y una muestra tiene que ser [representativa].', ['rápida', 'redonda', 'enorme'], 'Tres palabras para evaluar cualquier dato.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Correlación no es causa', 'Cuando dos cosas suben juntas, no siempre una causa la otra. Terceras variables, azar y causas inversas.', [
      teoria('Ir juntas no es causar', [
        'Dos cosas están correlacionadas cuando cambian juntas: cuando una sube, la otra también sube (o baja). Pero eso no quiere decir que una cause la otra. En verano se venden más helados y también hay más ahogamientos en el mar. Los helados no causan ahogamientos: el calor hace que haya más helados y más gente bañándose.',
        'Ese calor es una tercera variable, o variable de confusión: causa las dos cosas y hace que parezcan relacionadas.',
      ]),
      op('En verano suben las ventas de helado y también los casos de insolación. ¿Cuál es la explicación más probable?', [ // e1
        'El calor causa las dos cosas',
        'Los helados causan insolación',
        ['La insolación hace que la gente coma helado', 'Es posible que alguien con calor coma helado, pero la causa común de las dos cosas es el calor.'],
        'Es pura casualidad y no hay relación',
      ], 'Una tercera variable, el calor, explica las dos. Es el caso típico de correlación sin causalidad directa.', { d: 2 }),
      teoria('Tres trampas', [
        'Cuando dos cosas aparecen juntas, hay varias posibilidades además de que A cause B: puede ser que B cause A (causa inversa), que una tercera variable cause las dos (confusión) o que sea casualidad, sobre todo si se buscan muchas relaciones a la vez.',
        'Para saber si hay causa, hacen falta experimentos, un mecanismo que lo explique o muchos estudios que descarten las otras opciones.',
      ]),
      par('Uní cada caso con la trampa que representa.', [ // e2
        ['Barrios con más bomberos tienen más incendios', 'Causa inversa: más incendios llevan a poner más bomberos'],
        ['Ciudades con más plazas tienen más perros', 'Tercera variable: el tamaño de la ciudad'],
        ['Un año la venta de paraguas coincidió con goles de un equipo', 'Casualidad'],
        ['Más horas de estudio, mejores notas', 'Probable causa, confirmable con más evidencia'],
      ], 'No todo lo que va junto se explica igual. Pensar las alternativas es parte del método.', { d: 3 }),
      vf('Si dos cosas están muy correlacionadas, entonces una causa la otra.', false, 'Puede haber causa inversa, una tercera variable o casualidad. La correlación es una pista, no una prueba de causa.', { // e3
        razones: ['+Porque puede haber otra variable, causa inversa o casualidad', '-Porque la correlación siempre es casualidad', '-Porque las cosas correlacionadas nunca están relacionadas'],
        d: 2,
      }),
      teoria('Cuando sí hay causa', [
        'A veces la correlación sí refleja una causa, y la ciencia lo muestra con varias líneas de evidencia. Que el aumento del CO₂ causa calentamiento se sabe no solo porque las dos cosas subieron juntas, sino porque hay un mecanismo físico conocido desde el siglo XIX (el CO₂ absorbe radiación infrarroja), experimentos de laboratorio, mediciones satelitales de la energía que sale de la Tierra y modelos que solo reproducen el calentamiento observado si incluyen los gases emitidos por las personas.',
      ]),
      mult('¿Qué tipos de evidencia muestran que el CO₂ emitido por las personas causa calentamiento? Marcá todos.', [ // e4
        '+Un mecanismo físico conocido: el CO₂ absorbe radiación infrarroja',
        '+Experimentos de laboratorio',
        '+Mediciones satelitales de la energía que sale de la Tierra',
        '+Modelos que solo reproducen el calentamiento con esos gases',
        '-Que en un invierno hizo más calor de lo normal',
      ], 'Un solo invierno no prueba nada. La causa se establece con varias líneas de evidencia que coinciden.', { d: 3 }),
      cad('Armá la cadena de cómo se pasa de una correlación a una causa establecida.', [ // e5
        'Se observa que dos cosas cambian juntas',
        'Se proponen explicaciones posibles',
        'Se buscan un mecanismo y experimentos',
        'Se descartan terceras variables y la causa inversa',
        'Muchas líneas de evidencia coinciden',
      ], ['Se publica la correlación y queda probado'], 'La causa se construye con evidencia acumulada, no con un gráfico.', { d: 3 }),
      clas('¿Qué conclusión se puede sacar en cada caso?', { // e6
        'Solo correlación (no alcanza para causa)': ['En los barrios con más árboles vive gente con más ingresos', 'En los días de más tránsito hay más consultas por asma'],
        'Causa con evidencia experimental': ['En un ensayo con grupos al azar, el compost aumentó el crecimiento', 'En laboratorio, más CO₂ absorbe más radiación infrarroja'],
      }, 'Los experimentos con grupos al azar y los mecanismos físicos son las pruebas más fuertes de causa.', { d: 3 }),
      numv(3, (i) => { // e7
        const h = [100, 150, 80][i];
        const s = [20, 30, 16][i];
        return {
          enunciado: `En un mes se vendieron ${h} mil helados y hubo ${s} insolaciones en una ciudad. Un periodista calcula ${h / s} mil helados por insolación. ¿Cuántos mil helados por insolación dice?`,
          valor: h / s,
          unidad: 'mil helados',
          explicacion: `${h} ÷ ${s} = ${h / s}. La cuenta está bien, pero no significa nada: los helados no causan insolación. Un número bien calculado puede no tener sentido.`,
        };
      }, { d: 1 }),
      op('Un estudio encuentra que quienes toman más café viven más años. ¿Qué pregunta conviene hacerse primero?', [
        '¿Hay otra variable que explique las dos cosas?',
        '¿Cuántas tazas de café tengo que tomar para vivir más?',
        ['¿Qué marca de café tomaban los que vivieron más?', 'Primero hay que ver si la relación es causal; la marca es un detalle posterior.'],
        '¿Por qué el café es tan bueno para la salud de todos?',
      ], 'Ingresos, hábitos o salud previa podrían explicar las dos cosas. Antes de concluir causa, se buscan terceras variables.', { d: 3 }),
      mult('¿Qué preguntas ayudan a evaluar si una correlación es causa? Marcá todas.', [
        '+¿Podría ser al revés, que B cause A?',
        '+¿Hay una tercera variable que cause las dos?',
        '+¿Hay un mecanismo que lo explique?',
        '+¿Se confirmó con experimentos o muchos estudios?',
        '-¿El gráfico tiene colores lindos?',
      ], 'Cuatro preguntas que desarman la mayoría de las conclusiones apuradas.', { d: 2 }),
      det('Leé este titular y marcá lo que no se puede concluir de los datos.', [ // e8
        ['Los barrios con más árboles tienen menos casos de golpes de calor.', false],
        ['Plantar un árbol evita que tu familia tenga un golpe de calor.', true, 'Es una correlación de barrios; no prueba el efecto individual y puede haber otras variables, como el ingreso.'],
        ['Los investigadores midieron temperaturas más bajas bajo los árboles.', false],
        ['Por lo tanto, los golpes de calor solo dependen de los árboles.', true, 'Dependen de muchas cosas: edad, salud, vivienda, trabajo, agua.'],
      ], 'Los datos pueden ser ciertos y la conclusión exagerada. Leer con cuidado es separar las dos cosas.', { d: 3 }),
      comp('Completá.', 'Que dos cosas cambien juntas es una [correlación]; una variable que causa las dos es una variable de [confusión]; y para probar causa ayudan los [experimentos].', ['causa', 'control', 'rumores'], 'La idea más importante de la lección, en una sola línea.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Cómo avanza la ciencia', 'Revisión por pares, réplica, consenso e incertidumbre: por qué la ciencia es confiable justamente porque se corrige.', [
      teoria('Revisión y réplica', [
        'Cuando un equipo científico obtiene un resultado, lo publica en una revista especializada. Antes de publicarse, otros especialistas lo revisan en busca de errores: es la revisión por pares. Después, otros equipos intentan repetir el estudio (réplica) o lo ponen a prueba con otros métodos.',
        'Un resultado aislado puede estar equivocado. Un resultado que muchos equipos independientes confirman con métodos distintos es mucho más confiable.',
      ]),
      ord('Ordená el recorrido típico de un resultado científico.', [ // e1
        'Un equipo investiga y obtiene un resultado',
        'Lo envía a una revista especializada',
        'Otros especialistas lo revisan antes de publicarlo',
        'Se publica',
        'Otros equipos intentan replicarlo o ponerlo a prueba',
      ], 'La ciencia no termina con la publicación: ahí empieza la prueba de fuego.', { d: 1, extremos: ['Primero', 'Último'] }),
      teoria('El consenso', [
        'Cuando la gran mayoría de los especialistas coincide en una conclusión, después de revisar toda la evidencia, se habla de consenso científico. No es una votación ni una opinión de moda: es el resultado de miles de estudios que apuntan en la misma dirección.',
        'Sobre el cambio climático, distintos estudios encontraron que alrededor del 97 % o más de los científicos del clima que publican sobre el tema coinciden en que el calentamiento reciente es causado por las actividades humanas. El IPCC, que reúne a miles de especialistas, lo resume así en sus informes.',
      ], { destacado: { valor: '≥ 97 %', texto: 'de los científicos del clima que publican sobre el tema coincide en que el calentamiento reciente es causado por las personas.' } }),
      vf('El consenso científico es una votación entre científicos sobre lo que prefieren creer.', false, 'Es la coincidencia a la que se llega después de revisar muchísima evidencia de estudios independientes. No se decide por preferencia, sino por datos.', { // e2
        razones: ['+Porque surge de mucha evidencia independiente que coincide', '-Porque los científicos votan una vez por año', '-Porque el consenso se decide por mayoría política'],
        d: 2,
      }),
      teoria('Incertidumbre no es ignorancia', [
        'La ciencia expresa sus resultados con incertidumbre: rangos y probabilidades. Decir "el calentamiento será de entre 2 y 3 °C con tal escenario" no significa que no se sepa nada: significa que se conoce con bastante precisión dentro de ese rango.',
        'Que haya incertidumbre en los detalles no quiere decir que haya duda sobre lo principal. Se sabe con certeza que la Tierra se calentó y por qué; hay más incertidumbre sobre cuánto exactamente se calentará cada región.',
      ]),
      op('Un informe dice que el calentamiento será "probablemente" de entre 2 y 3 °C en cierto escenario. ¿Qué significa?', [ // e3
        'Que los científicos estiman un rango con alta probabilidad',
        'Que los científicos no tienen idea de lo que va a pasar',
        ['Que va a ser exactamente 2,5 °C', 'Es un rango, no un valor exacto: expresa la incertidumbre honestamente.'],
        'Que el calentamiento podría ser negativo',
      ], 'La incertidumbre bien expresada es una fortaleza: dice qué tan seguros estamos.', { d: 2 }),
      teoria('Corregirse es una virtud', [
        'La ciencia cambia cuando aparece evidencia nueva. Eso no es una debilidad: es lo que la hace confiable. El agujero de ozono, por ejemplo, se detectó en la década de 1980, se identificaron sus causas (los clorofluorocarbonos, CFC), el mundo los prohibió con el Protocolo de Montreal y hoy la capa de ozono se está recuperando lentamente.',
        'Quien nunca cambia de opinión frente a la evidencia no está haciendo ciencia.',
      ]),
      cad('Armá la cadena del caso del agujero de ozono.', [ // e4
        'Se detecta una disminución del ozono sobre la Antártida',
        'Los científicos identifican a los CFC como causa',
        'Los países firman el Protocolo de Montreal',
        'Se dejan de producir los CFC',
        'La capa de ozono empieza a recuperarse',
      ], ['El agujero se cerró solo sin que nadie hiciera nada'], 'Un ejemplo de ciencia que detecta, explica y guía una solución que funciona.', { d: 2 }),
      clas('¿Es una señal de buena ciencia o de mala ciencia?', { // e5
        'Buena ciencia': ['Publicar los datos para que otros los revisen', 'Cambiar la conclusión ante evidencia nueva', 'Informar la incertidumbre de los resultados'],
        'Mala ciencia': ['Ocultar los datos para que nadie los revise', 'Elegir solo los resultados que convienen', 'Presentar un solo estudio como prueba definitiva'],
      }, 'Transparencia, humildad frente a la evidencia y honestidad sobre la incertidumbre.', { d: 2 }),
      mult('¿Qué hace que una conclusión científica sea muy confiable? Marcá todo.', [ // e6
        '+Que muchos equipos independientes la confirmen',
        '+Que se base en métodos distintos que coinciden',
        '+Que haya pasado revisión por pares',
        '+Que exista un mecanismo que la explique',
        '-Que la diga una persona famosa',
      ], 'La fama no es evidencia. La coincidencia de muchos estudios independientes, sí.', { d: 1 }),
      par('Uní cada concepto con su definición.', [ // e7
        ['Revisión por pares', 'Especialistas revisan un trabajo antes de publicarlo'],
        ['Réplica', 'Otro equipo repite el estudio para ver si da igual'],
        ['Consenso', 'Coincidencia de la mayoría de especialistas basada en la evidencia'],
        ['Incertidumbre', 'Rango dentro del cual se estima un valor'],
      ], 'Cuatro palabras para entender por qué se puede confiar en la ciencia sin que sea infalible.', { d: 2 }),
      det('Leé este comentario en redes y marcá lo equivocado.', [ // e8
        ['Los científicos revisan los trabajos de otros antes de publicarlos.', false],
        ['Si la ciencia cambia de opinión, es que no sirve.', true, 'Corregirse ante evidencia nueva es justamente lo que la hace confiable.'],
        ['El Protocolo de Montreal ayudó a recuperar la capa de ozono.', false],
        ['Como hay incertidumbre, no se sabe si el clima está cambiando.', true, 'La incertidumbre está en los detalles; que el clima cambia por las personas está establecido.'],
      ], 'Confiar en la ciencia no es creer ciegamente: es entender cómo se construye.', { d: 3 }),
      comp('Completá.', 'Antes de publicarse, un estudio pasa por la revisión por [pares]; cuando otros lo repiten se habla de [réplica]; y el agujero de ozono se enfrentó con el Protocolo de [Montreal].', ['votos', 'copia', 'Kioto'], 'Tres ideas sobre cómo avanza y se aplica la ciencia.', { d: 2 }),
      est('Estimá qué porcentaje de los científicos del clima que publican sobre el tema coincide en que el calentamiento reciente es causado por las personas.', 97, { min: 0, max: 100, paso: 1, unidad: '%' }, 'Alrededor del 97 % o más, según varios estudios que analizaron miles de publicaciones. Es uno de los consensos más sólidos de la ciencia actual.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: cómo sabemos lo que sabemos', 'Observación, experimentos, mediciones, causalidad y consenso, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el experimento de las macetas', 'Un curso quiere probar si el agua de lluvia es mejor que el agua de red para las plantas. Revisá su diseño y sus conclusiones.', [
      teoria('El diseño original', [
        'Un curso puso 2 macetas: una regada con agua de lluvia, junto a la ventana, y otra regada con agua de red, en un rincón. A la de lluvia le pusieron una semilla de girasol y a la de red, una de poroto. Después de un mes, la de lluvia medía 30 cm y la de red 12 cm. Concluyeron: "el agua de lluvia hace crecer más del doble a las plantas".',
      ]),
      mult('¿Qué problemas tiene el diseño? Marcá todos.', [ // e1
        '+Solo una maceta por grupo',
        '+Distinta luz entre las macetas',
        '+Distinta especie de planta en cada maceta',
        '+No se controlaron otras variables, como la cantidad de agua',
        '-Midieron la altura con una regla',
      ], 'Tres cosas cambiaron a la vez: el agua, la luz y la especie. Así no se sabe qué causó la diferencia.', { d: 3 }),
      op('¿Qué conclusión se puede sacar de verdad del experimento original?', [ // e2
        'Ninguna sobre el agua, porque cambiaron varias cosas',
        'Que el agua de lluvia hace crecer el doble a cualquier planta',
        ['Que el agua de red es tóxica para las plantas', 'No hay evidencia de eso: la de red tenía otra especie y menos luz.'],
        'Que los girasoles prefieren el agua de lluvia',
      ], 'Con variables mezcladas, el experimento no responde la pregunta. Hay que rediseñarlo.', { d: 3 }),
      ord('Ordená los pasos del diseño corregido.', [ // e3
        'Elegir una sola especie y semillas parecidas',
        'Preparar 10 macetas iguales para cada tipo de agua',
        'Asignar al azar qué maceta recibe cada agua',
        'Ponerlas todas con la misma luz y regarlas con la misma cantidad',
        'Medir la altura de todas y comparar los promedios',
      ], 'Una sola diferencia entre grupos, repeticiones, azar y comparación de promedios.', { d: 3, extremos: ['Primero', 'Último'] }),
      numv(3, (i) => { // e4
        const a = [18.4, 20.2, 15.6][i];
        const b = [17.9, 19.8, 15.1][i];
        return {
          enunciado: `Con el diseño corregido, el promedio con agua de lluvia fue ${a.toLocaleString('es-AR')} cm y con agua de red ${b.toLocaleString('es-AR')} cm. ¿Cuál es la diferencia en cm?`,
          valor: Math.round((a - b) * 10) / 10,
          unidad: 'cm',
          dec: 1,
          explicacion: `${a.toLocaleString('es-AR')} − ${b.toLocaleString('es-AR')} = ${(Math.round((a - b) * 10) / 10).toLocaleString('es-AR')} cm. Una diferencia chica, que puede ser del azar: muy lejos del "doble" del primer experimento.`,
        };
      }, { d: 2 }),
      vf('Con el diseño corregido, una diferencia de medio centímetro entre promedios prueba que el agua de lluvia es mejor.', false, 'Una diferencia tan chica puede deberse al azar. Habría que ver cuánto varían las plantas dentro de cada grupo, repetir el experimento o usar más macetas.', { // e5
        razones: ['+Porque una diferencia chica puede deberse al azar', '-Porque medio centímetro es una diferencia enorme', '-Porque el diseño corregido sigue teniendo tres variables mezcladas'],
        d: 4,
      }),
      clas('Clasificá las conclusiones que propone el curso después del diseño corregido.', { // e6
        'Bien fundada': ['Con estas condiciones, no encontramos una diferencia clara', 'Habría que repetir con más macetas para estar seguros'],
        'No fundada': ['El agua de red es mala para todas las plantas', 'El primer experimento demostró que la lluvia duplica el crecimiento'],
      }, 'Una buena conclusión dice lo que los datos muestran, con sus límites.', { d: 3 }),
      det('El curso escribe su informe final. Marcá lo equivocado.', [ // e7
        ['En el primer diseño cambiaron varias variables a la vez.', false],
        ['El primer experimento probó que la lluvia duplica el crecimiento.', true, 'No probó nada sobre el agua: la luz y la especie también cambiaban.'],
        ['Con el diseño corregido, la diferencia fue muy chica.', false],
        ['Como no encontramos diferencia, la ciencia no sirve.', true, 'No encontrar diferencia también es un resultado válido: responde la pregunta.'],
      ], 'Reconocer los errores del primer diseño y aceptar un resultado "aburrido" es hacer ciencia de verdad.', { d: 3 }),
    ]),
  ],
});
