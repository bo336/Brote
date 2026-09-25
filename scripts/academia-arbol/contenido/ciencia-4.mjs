import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// CIENCIA 4 — Ciencia ciudadana.
// Qué es, cómo registrar una observación útil, protocolos, esfuerzo y
// sesgos, cómo se convierten miles de registros en resultados, y cómo armar
// un proyecto propio con ética. Retoma el diseño de experimentos y la
// medición (ciencia-1), los promedios y tasas (ciencia-2) y la fauna urbana
// (animales-2).

export default unidad({
  slug: 'ciencia-4',
  rama: 'ciencia',
  orden: 4,
  nivel: 2,
  requiereTronco: 2,
  titulo: 'Ciencia ciudadana',
  bajada: 'Aves, vinchucas, bichos del arroyo y lluvia: cómo cualquier persona puede aportar datos útiles a la ciencia, y cómo hacerlo bien.',
  objetivos: [
    'Explicar qué es la ciencia ciudadana y qué aporta a la investigación',
    'Registrar una observación con los datos que la vuelven útil',
    'Aplicar un protocolo y calcular tasas según el esfuerzo',
    'Reconocer sesgos de muestreo y cómo se corrigen',
    'Diseñar un proyecto de ciencia ciudadana con criterios éticos',
  ],
  repasa: ['ciencia-1', 'ciencia-2', 'animales-2', 'ciencia-3'],
  fuentes: ['ecsa-principios', 'ebird', 'argentinat', 'inaturalist-calidad', 'gbif', 'geovin', 'aves-argentinas'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Qué es la ciencia ciudadana', 'Personas sin título de científicas que observan, registran y aportan datos a investigaciones reales.', [
      teoria('Muchos ojos', [
        'La ciencia ciudadana es la participación de personas del público en investigaciones científicas: observan, miden, registran o analizan datos, en colaboración con equipos de investigación. No es nueva: el Conteo Navideño de Aves, en el que voluntarios cuentan aves durante un día, empezó en Estados Unidos en 1900 y sigue haciéndose cada año en muchos países.',
        'Su gran aporte es la escala: ningún equipo de científicos puede estar en miles de lugares a la vez, todos los días, durante décadas. Miles de voluntarios sí.',
      ]),
      op('¿Cuál es el principal aporte de la ciencia ciudadana?', [ // e1
        'Datos de muchos lugares y momentos a la vez',
        'Reemplazar por completo a los científicos',
        ['Hacer experimentos de laboratorio más precisos', 'Su fuerte no es el laboratorio sino la cobertura en el territorio.'],
        'Evitar que los datos se publiquen',
      ], 'La escala en el espacio y en el tiempo es lo que ningún equipo profesional puede lograr solo.', { d: 1 }),
      teoria('Proyectos que funcionan', [
        'eBird, creado en 2002 por el Laboratorio de Ornitología de Cornell, reúne listas de aves de observadores de todo el mundo, y ya supera los mil millones de registros. ArgentiNat, la versión argentina de iNaturalist, recibe fotos de cualquier ser vivo, que la comunidad ayuda a identificar. GeoVin, un proyecto de investigadores del CONICET, recibe reportes de vinchucas, los insectos que transmiten el parásito de la enfermedad de Chagas, para mapear dónde están.',
      ]),
      par('Uní cada proyecto con lo que registra.', [ // e2
        ['eBird', 'Listas de aves observadas'],
        ['ArgentiNat', 'Fotos de cualquier ser vivo'],
        ['GeoVin', 'Reportes de vinchucas'],
        ['Conteo Navideño de Aves', 'Aves contadas en un día fijo cada año'],
      ], 'Cada proyecto tiene una pregunta y un tipo de dato. Elegir bien dónde aportar es el primer paso.', { d: 1 }),
      est('Estimá cuántos registros de aves reunió eBird desde 2002.', 1000000000, { min: 1000, max: 100000000000, unidad: 'registros', escala: 'log' }, 'Más de mil millones de registros. Con esos datos se hacen mapas de distribución y migración que antes eran imposibles.', { d: 3 }),
      teoria('Niveles de participación', [
        'La participación puede ser de distintos niveles. En los proyectos contributivos, el público aporta datos siguiendo un protocolo diseñado por científicos. En los colaborativos, además ayuda a analizar o a mejorar el diseño. En los co-creados, la comunidad y los científicos definen juntos la pregunta, por ejemplo, vecinos preocupados por un arroyo que se asocian con una universidad.',
      ]),
      clas('¿Qué nivel de participación tiene cada proyecto?', { // e3
        'Contributivo': ['Subir fotos de aves a una plataforma', 'Reportar vinchucas con una app'],
        'Colaborativo': ['Voluntarios que además ayudan a identificar fotos de otros', 'Participantes que proponen mejoras al protocolo'],
        'Co-creado': ['Vecinos y una universidad diseñan juntos un monitoreo del arroyo'],
      }, 'Cuanto más co-creado, más responde el proyecto a las preguntas de la propia comunidad.', { d: 3 }),
      teoria('Diez principios', [
        'La Asociación Europea de Ciencia Ciudadana propuso diez principios. Entre ellos: los participantes contribuyen activamente a la ciencia; el proyecto produce resultados científicos genuinos; tanto científicos como voluntarios se benefician; los participantes reciben devoluciones sobre cómo se usan sus datos; los datos se comparten de forma abierta cuando es posible; se reconoce a quienes participan; y se consideran los aspectos éticos y legales.',
      ]),
      mult('¿Qué principios debería cumplir un buen proyecto de ciencia ciudadana? Marcá todos.', [ // e4
        '+Dar devoluciones a quienes aportan datos',
        '+Reconocer la participación de los voluntarios',
        '+Producir resultados científicos genuinos',
        '-Usar a los voluntarios sin contarles para qué',
        '-Guardar los datos en secreto para siempre',
      ], 'La ciencia ciudadana es una colaboración: si los voluntarios no ven resultados, dejan de participar.', { d: 2 }),
      vf('La ciencia ciudadana solo sirve para entretenerse; los datos no se usan en investigaciones reales.', false, 'Los datos de eBird, iNaturalist y muchos otros proyectos se usan en miles de artículos científicos, mapas de distribución y decisiones de conservación.', { // e5
        razones: ['+Porque sus datos se usan en investigaciones y decisiones reales', '-Porque los voluntarios no pueden observar nada', '-Porque los científicos no aceptan datos externos'],
        d: 1,
      }),
      numv(3, (i) => { // e6
        const [vol, obs] = [[500, 12], [1200, 8], [300, 25]][i];
        return {
          enunciado: `Un proyecto tiene ${vol.toLocaleString('es-AR')} voluntarios que registran en promedio ${obs} observaciones por mes. ¿Cuántas observaciones reúne en un año?`,
          valor: vol * obs * 12,
          unidad: 'observaciones',
          explicacion: `${vol.toLocaleString('es-AR')} × ${obs} × 12 = ${(vol * obs * 12).toLocaleString('es-AR')}. Ningún equipo profesional podría reunir tantos datos en tantos lugares.`,
        };
      }, { d: 2 }),
      cad('Armá la cadena de cómo un reporte de vinchuca se vuelve útil.', [ // e7
        'Una familia encuentra un insecto sospechoso en su casa',
        'Le saca una foto y la envía al proyecto con la ubicación',
        'Especialistas confirman si es una vinchuca y de qué especie',
        'El registro se suma al mapa de distribución',
        'Las autoridades de salud pueden priorizar zonas',
      ], ['La familia aplasta el insecto y no lo reporta'], 'Un reporte bien hecho conecta una casa con la salud pública de toda una región.', { d: 2 }),
      vf('Para participar en un proyecto de ciencia ciudadana hace falta un título universitario.', false, 'La idea es justamente que cualquier persona pueda aportar. Lo que hace falta es seguir el protocolo y registrar con cuidado.', { // e7b
        razones: ['+Porque alcanza con seguir el protocolo con cuidado', '-Porque solo pueden participar científicos', '-Porque los datos de voluntarios se descartan'],
        d: 1,
      }),
      det('Leé esta nota y marcá lo equivocado.', [ // e8
        ['El Conteo Navideño de Aves empezó en 1900.', false],
        ['La ciencia ciudadana es un invento de los últimos cinco años.', true, 'Existe hace más de un siglo; las apps la hicieron masiva.'],
        ['GeoVin recibe reportes de vinchucas.', false],
        ['En un proyecto co-creado, los científicos deciden todo solos.', true, 'En uno co-creado, la comunidad y los científicos definen juntos la pregunta.'],
      ], 'La ciencia ciudadana tiene historia, métodos y principios propios.', { d: 2 }),
      comp('Completá.', 'La participación del público en investigaciones se llama ciencia [ciudadana]; el proyecto argentino que recibe fotos de seres vivos es [ArgentiNat]; y un buen proyecto da [devoluciones] a quienes participan.', ['privada', 'GeoVin', 'multas'], 'Tres ideas para entender qué es la ciencia ciudadana y cómo funciona.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Una observación que sirve', 'Qué, dónde, cuándo y con qué evidencia: los datos que convierten una foto en un registro científico.', [
      teoria('Los datos mínimos', [
        'Una observación útil responde cuatro preguntas: qué (qué organismo o fenómeno), dónde (ubicación precisa, idealmente con coordenadas), cuándo (fecha y hora) y con qué evidencia (foto, audio o descripción). También importa quién observó, para poder consultar dudas. Una foto hermosa sin fecha ni lugar sirve muy poco para la ciencia.',
      ]),
      mult('¿Qué datos necesita una observación para ser útil? Marcá todos.', [ // e1
        '+Qué organismo se observó',
        '+Dónde, con la ubicación más precisa posible',
        '+Cuándo: fecha y hora',
        '+Evidencia, como una foto o un audio',
        '-El filtro que se usó en la foto',
      ], 'Sin lugar y fecha, un registro no puede sumarse a un mapa ni a una tendencia.', { d: 1 }),
      teoria('El grado de investigación', [
        'En iNaturalist y ArgentiNat, una observación alcanza el "grado de investigación" cuando tiene fecha, ubicación y foto o sonido, no es de un organismo en cautiverio o cultivado, y más de dos tercios de quienes la identificaron coinciden en la especie. Esas observaciones se comparten con GBIF, la red mundial de datos de biodiversidad, donde las usan investigadores de todo el mundo.',
      ]),
      clas('¿Esta observación puede llegar a grado de investigación?', { // e2
        'Puede llegar': ['Foto de un zorzal en una plaza, con fecha y ubicación', 'Audio de una rana en una laguna, con fecha y ubicación'],
        'No puede llegar': ['Foto de un loro en una jaula', 'Foto de un árbol sin ubicación', 'Foto de una planta de maceta en un balcón'],
      }, 'Los organismos en cautiverio o cultivados no informan sobre la distribución natural de las especies.', { d: 2 }),
      numv(3, (i) => { // e3
        const [n, a] = [[6, 5], [9, 6], [3, 2]][i];
        return {
          enunciado: `${n} personas identificaron una foto; ${a} coinciden en la especie. ¿Qué fracción coincide, en porcentaje? Redondeá al entero. (Para grado de investigación hace falta más de dos tercios, unos 67 %.)`,
          valor: Math.round((a / n) * 100),
          unidad: '%',
          tol: 1,
          explicacion: `${a} ÷ ${n} × 100 ≈ ${Math.round((a / n) * 100)} %. ${a / n > 2 / 3 ? 'Supera los dos tercios: alcanza el acuerdo necesario.' : 'No supera los dos tercios: todavía no alcanza el acuerdo necesario.'}`,
          ctx: `${a} de ${n} identificaciones coinciden.`,
        };
      }, { d: 2 }),
      teoria('Buenas fotos', [
        'Para que otros puedan identificar un organismo, conviene sacar varias fotos: de distintos ángulos, de los detalles que distinguen a la especie (en una planta, hojas, flores y frutos; en un insecto, el dorso y las patas), con algo que dé idea del tamaño, y del ambiente. Sin tocar ni molestar a los animales: la foto nunca vale más que su bienestar.',
      ]),
      mult('¿Qué hace más identificable una foto de un insecto? Marcá todo.', [ // e4
        '+Fotos de varios ángulos',
        '+Algo que indique el tamaño',
        '+Detalles como alas y patas',
        '-Aplicar un filtro de colores',
        '-Atraparlo y encerrarlo para la foto',
      ], 'Más información visual, sin dañar al animal.', { d: 1 }),
      teoria('Identificar con honestidad', [
        'Cuando no se está seguro de la especie, es mejor identificar a un nivel más general (por ejemplo, "mariposa" o "familia de los picaflores") que adivinar. Un error confiado puede confundir a otros y meter datos falsos en un mapa. Decir "no sé" también es buena ciencia.',
      ]),
      op('Viste un pájaro rápido y no estás seguro de la especie. ¿Qué conviene registrar?', [ // e5
        'Un nivel más general, como "picaflor"',
        'La especie más común, por las dudas',
        ['La especie más rara, para que sea más interesante', 'Registrar lo raro sin certeza mete datos falsos en los mapas.'],
        'Nada, porque no sirve si no sabés la especie',
      ], 'Un registro general correcto vale más que uno específico equivocado.', { d: 2 }),
      teoria('Registrar lo que no está', [
        'En eBird se pide indicar si la lista es completa, es decir, si se anotaron todas las especies que se pudieron identificar. Así, si una especie no aparece en una lista completa, se sabe que no se la detectó, y no solo que no se la anotó. Esos "ceros" son muy valiosos para saber dónde una especie es rara o desapareció.',
      ]),
      vf('Si en una lista completa no aparece el cardenal, eso también es un dato útil.', true, 'En una lista completa, la ausencia indica que no se lo detectó. Con muchas listas, esos ceros permiten estimar dónde una especie es rara o está desapareciendo.', { // e6
        razones: ['+Porque en una lista completa la ausencia significa no detectado', '-Porque las listas completas no existen', '-Porque solo sirven los registros de especies raras'],
        d: 3,
      }),
      op('Sacaste una foto de una planta en una maceta de tu balcón. ¿Qué conviene indicar al subirla?', [ // e6b
        'Que es un organismo cultivado',
        'Que es una especie silvestre muy rara',
        ['Una ubicación falsa para proteger tu casa', 'Mejor ocultar la ubicación con la opción de la plataforma, no inventarla.'],
        'Nada, porque las plantas no cuentan',
      ], 'Marcarla como cultivada evita que se confunda con la distribución natural de la especie.', { d: 2 }),
      par('Uní cada pregunta con el dato que la responde.', [ // e7
        ['¿Qué?', 'Especie u organismo observado'],
        ['¿Dónde?', 'Coordenadas o ubicación precisa'],
        ['¿Cuándo?', 'Fecha y hora'],
        ['¿Con qué evidencia?', 'Foto, audio o descripción'],
      ], 'Cuatro preguntas que convierten una observación en un registro.', { d: 1 }),
      det('Leé cómo registró una observación un compañero y marcá los errores.', [ // e8
        ['Anotó la fecha y la hora.', false],
        ['Como no sabía la especie, puso la más rara que conocía.', true, 'Conviene identificar a un nivel más general si no hay certeza.'],
        ['Sacó fotos de varios ángulos.', false],
        ['Agarró al sapo y lo llevó a su casa para fotografiarlo mejor.', true, 'Nunca hay que llevarse ni molestar a los animales.'],
      ], 'Un buen registro es preciso, honesto y respetuoso con los seres vivos.', { d: 2 }),
      ord('Ordená los pasos para registrar una observación en ArgentiNat.', [ // e9
        'Observar sin molestar al organismo',
        'Sacar varias fotos con detalles y escala',
        'Anotar o dejar que el teléfono registre fecha y ubicación',
        'Subir la observación con la identificación más segura posible',
        'Revisar las identificaciones que sugiere la comunidad',
      ], 'El registro sigue vivo después de subirlo: la comunidad ayuda a confirmarlo.', { d: 2 }),
      comp('Completá.', 'En ArgentiNat, una observación confirmada por la comunidad alcanza el grado de [investigación]; un organismo en [cautiverio] no sirve para mapear su distribución natural; y en una lista [completa] la ausencia también es un dato.', ['belleza', 'libertad', 'parcial'], 'Tres claves para que tus observaciones sirvan a la ciencia.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Protocolos, esfuerzo y sesgos', 'Contar igual en todos lados, medir cuánto se buscó y corregir los datos que se amontonan donde hay más gente.', [
      teoria('Un protocolo', [
        'Para que los datos de distintas personas se puedan comparar, hace falta un protocolo: reglas fijas sobre cómo observar. Por ejemplo, en un conteo por puntos de aves, cada participante se queda 10 minutos en un punto fijo y anota todas las aves que ve u oye dentro de un radio de 50 metros. Si cada uno contara como quisiera, las diferencias podrían deberse al método y no a las aves.',
      ]),
      op('¿Para qué sirve un protocolo en ciencia ciudadana?', [ // e1
        'Para poder comparar datos de distintas personas',
        'Para que los voluntarios no se distraigan tanto',
        ['Para que solo puedan participar los expertos', 'Al contrario: un buen protocolo permite que cualquiera aporte datos útiles.'],
        'Para juntar menos datos pero más ordenados',
      ], 'Lo viste con los experimentos: hay que controlar lo que no se quiere comparar.', { d: 1 }),
      teoria('El esfuerzo', [
        'No es lo mismo ver 20 aves en 10 minutos que en 3 horas. Por eso se registra el esfuerzo: cuánto tiempo se observó, qué distancia se recorrió y cuántas personas participaron. Con eso se calculan tasas, como aves por hora, que sí se pueden comparar entre lugares y fechas.',
      ]),
      ejemplo('Aves por hora', 'Grupo A contó 60 aves en 2 horas en el parque. Grupo B contó 45 aves en 1 hora en la costanera.', [
        'Grupo A: 60 ÷ 2 = 30 aves por hora.',
        'Grupo B: 45 ÷ 1 = 45 aves por hora.',
        'Aunque el grupo A contó más aves en total, la costanera tuvo más aves por hora de búsqueda.',
      ], 'Comparar totales sin considerar el esfuerzo lleva a conclusiones equivocadas.'),
      numv(3, (i) => { // e2
        const [aves, min] = [[84, 120], [36, 45], [150, 90]][i];
        return {
          enunciado: `Un grupo contó ${aves} aves en ${min} minutos. ¿Cuántas aves por hora es eso? Redondeá al entero.`,
          valor: Math.round((aves / min) * 60),
          unidad: 'aves por hora',
          tol: 1,
          explicacion: `${aves} ÷ ${min} × 60 ≈ ${Math.round((aves / min) * 60)} aves por hora. Pasar a tasa permite comparar grupos que observaron distinto tiempo.`,
          ctx: `${aves} aves en ${min} minutos.`,
        };
      }, { d: 2 }),
      teoria('Sesgos de muestreo', [
        'Los datos de ciencia ciudadana tienen sesgos conocidos: hay muchos más registros cerca de ciudades, rutas y senderos que en lugares remotos; más los fines de semana; y más de especies grandes, coloridas o fáciles de ver que de especies chicas o nocturnas. Si no se corrige, un mapa podría mostrar "más biodiversidad" donde en realidad hay más gente mirando.',
      ]),
      clas('¿Qué sesgo aparece en cada caso?', { // e3
        'Sesgo de lugar': ['Muchos registros junto a la ruta y casi ninguno lejos', 'Mapas con más especies cerca de las ciudades'],
        'Sesgo de especie': ['Muchas fotos de mariposas coloridas y pocas de polillas', 'Muchos registros de aves grandes y pocos de ranas nocturnas'],
        'Sesgo de tiempo': ['Muchos más registros los domingos', 'Casi ningún registro de noche'],
      }, 'Conocer los sesgos permite corregirlos con el esfuerzo y con buen diseño.', { d: 2 }),
      cad('Armá la cadena de cómo un sesgo puede confundir un mapa.', [ // e4
        'La gente observa más cerca de las ciudades',
        'Hay muchos más registros en esas zonas',
        'El mapa muestra más especies cerca de las ciudades',
        'Parece que las ciudades tienen más biodiversidad',
        'En realidad, lo que cambia es el esfuerzo de observación',
      ], ['Las especies se mudan a las ciudades para ser fotografiadas'], 'Sin tener en cuenta el esfuerzo, el mapa muestra dónde hay observadores, no dónde hay especies.', { d: 3 }),
      teoria('Bichos que indican el agua', [
        'Algunos protocolos usan bioindicadores: organismos cuya presencia dice algo del ambiente. En los arroyos, las larvas de efímeras, plecópteros y tricópteros son muy sensibles a la contaminación: si abundan, el agua suele estar en buen estado. Otros, como algunas larvas de mosquito y ciertos gusanos, toleran agua contaminada. Contar qué grupos aparecen en una muestra da una idea de la calidad del agua, sin laboratorio.',
      ]),
      clas('¿Qué indica encontrar muchos de estos organismos en un arroyo?', { // e5
        'Agua en buen estado': ['Larvas de plecópteros', 'Larvas de efímeras', 'Larvas de tricópteros'],
        'Agua posiblemente contaminada': ['Muchos gusanos rojos del barro', 'Muchas larvas de mosquito y ninguna sensible'],
      }, 'Los bioindicadores integran lo que pasó en el agua durante semanas, no solo el día del muestreo.', { d: 3 }),
      op('En una muestra de un arroyo aparecen muchas larvas de efímeras y plecópteros. ¿Qué sugiere?', [ // e5b
        'Que el agua probablemente está en buen estado',
        'Que el agua está muy contaminada con cloacas',
        ['Que hay que fumigar el arroyo enseguida', 'Son organismos nativos y buenos indicadores: no hay que eliminarlos.'],
        'Que el arroyo está completamente seco',
      ], 'Estos grupos son sensibles a la contaminación: su presencia abundante es buena señal.', { d: 2 }),
      par('Uní cada sesgo con una forma de corregirlo.', [ // e5c
        ['Muchos registros junto a rutas', 'Organizar salidas a zonas poco visitadas'],
        ['Más registros los fines de semana', 'Calcular tasas según el esfuerzo'],
        ['Pocas fotos de especies nocturnas', 'Hacer muestreos específicos de noche'],
        ['Totales con distinto tiempo de búsqueda', 'Comparar aves por hora'],
      ], 'Cada sesgo tiene una corrección: por diseño del muestreo o por cómo se analizan los datos.', { d: 3 }),
      vf('Si una zona tiene más registros en ArgentiNat, seguro tiene más especies.', false, 'Puede tener simplemente más observadores. Para comparar zonas hay que considerar el esfuerzo de muestreo.', { // e6
        razones: ['+Porque puede tener más observadores, no más especies', '-Porque los registros no dicen nada', '-Porque todas las zonas tienen las mismas especies'],
        d: 2,
      }),
      mult('¿Qué ayuda a reducir los sesgos de muestreo? Marcá todo.', [ // e7
        '+Registrar el tiempo y la distancia de cada salida',
        '+Organizar salidas a lugares poco visitados',
        '+Usar un protocolo fijo de conteo',
        '-Registrar solo las especies más lindas',
        '-Observar siempre en el mismo lugar cómodo',
      ], 'El diseño y el registro del esfuerzo permiten comparar datos de forma justa.', { d: 2 }),
      det('Leé esta conclusión de un grupo y marcá lo equivocado.', [ // e8
        ['Registramos cuántos minutos observamos en cada punto.', false],
        ['El parque A tiene más aves porque contamos más, aunque estuvimos el triple de tiempo.', true, 'Hay que comparar tasas por hora, no totales con distinto esfuerzo.'],
        ['Usamos el mismo radio de 50 metros en todos los puntos.', false],
        ['Como vimos muchas mariposas coloridas, casi no hay polillas.', true, 'Las polillas son más difíciles de ver; es un sesgo de especie.'],
      ], 'Las conclusiones tienen que respetar cómo se tomaron los datos.', { d: 3 }),
      comp('Completá.', 'Las reglas fijas para observar forman un [protocolo]; el tiempo y la distancia de búsqueda son el [esfuerzo]; y los organismos que indican el estado del ambiente son [bioindicadores].', ['reglamento', 'premio', 'invasores'], 'Tres conceptos para tomar datos comparables.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('De los datos a los resultados', 'Controles de calidad, mapas, tendencias y datos abiertos, cuidando a las especies y a las personas.', [
      teoria('Control de calidad', [
        'Los proyectos grandes tienen filtros: en eBird, si alguien registra una especie muy rara para esa zona y fecha, o una cantidad inusual, el registro queda marcado para que lo revise una persona experta de la región, que puede pedir más evidencia. En iNaturalist, la comunidad confirma o corrige las identificaciones. Así, los errores individuales se detectan y los datos ganan confiabilidad.',
      ]),
      cad('Armá el camino de un registro inusual en eBird.', [ // e1
        'Alguien registra una especie rara para esa zona',
        'El sistema marca el registro como inusual',
        'Un revisor experto de la región lo evalúa',
        'Pide evidencia, como una foto o una descripción',
        'El registro se acepta o se descarta',
      ], ['El registro se publica sin revisión porque es raro'], 'Lo raro no se descarta ni se acepta a ciegas: se revisa.', { d: 2 }),
      teoria('Mapas y tendencias', [
        'Con miles de registros se pueden hacer mapas de distribución, ver por dónde migran las especies y en qué fechas, y detectar tendencias: si una especie aparece cada vez en menos listas completas, puede estar disminuyendo. También se estudia la fenología, es decir, cuándo florecen las plantas o llegan las aves cada año, y si esas fechas se adelantan con el calentamiento.',
      ]),
      numv(3, (i) => { // e2
        const [a, b] = [[42, 30], [25, 20], [60, 39]][i];
        return {
          enunciado: `Una especie aparecía en el ${a} % de las listas completas de una región hace 10 años y hoy en el ${b} %. ¿En cuántos puntos porcentuales bajó?`,
          valor: a - b,
          unidad: 'puntos porcentuales',
          explicacion: `${a} − ${b} = ${a - b} puntos porcentuales. Como son listas completas con esfuerzo registrado, la baja puede indicar una disminución real de la especie.`,
          ctx: `Del ${a} % al ${b} % de las listas completas.`,
        };
      }, { d: 2 }),
      par('Uní cada resultado con lo que permite estudiar.', [ // e3
        ['Mapa de distribución', 'Dónde vive una especie'],
        ['Serie de muchos años', 'Si una especie aumenta o disminuye'],
        ['Fechas de floración', 'Cambios en la fenología'],
        ['Registros de especies nuevas en una zona', 'Llegada de especies invasoras'],
      ], 'Los mismos datos responden muchas preguntas distintas.', { d: 2 }),
      teoria('Datos abiertos', [
        'Muchos proyectos comparten sus datos en GBIF, una infraestructura internacional que reúne miles de millones de registros de biodiversidad de museos, universidades y ciencia ciudadana. Cualquier persona puede descargarlos y usarlos, citando la fuente. Así, un registro de una plaza de Rosario puede formar parte de un estudio mundial.',
      ]),
      vf('Los datos de ciencia ciudadana solo los puede usar el proyecto que los recolectó.', false, 'Muchos se comparten como datos abiertos en GBIF, donde cualquier investigador puede usarlos citando la fuente.', { // e4
        razones: ['+Porque muchos se comparten como datos abiertos', '-Porque está prohibido compartir datos', '-Porque los datos se borran después de un año'],
        d: 1,
      }),
      teoria('Cuidar a las especies y a las personas', [
        'Compartir datos también tiene riesgos. La ubicación exacta de una especie amenazada o muy buscada por traficantes puede ponerla en peligro: por eso iNaturalist oculta automáticamente las coordenadas precisas de las especies amenazadas. Y las observaciones hechas en una casa pueden revelar dónde vive alguien: conviene poder ocultar la ubicación. La ética es parte del método.',
      ]),
      op('¿Por qué iNaturalist oculta la ubicación exacta de las especies amenazadas?', [ // e5
        'Para evitar que las encuentren traficantes o curiosos',
        'Porque esas especies no tienen ubicación',
        ['Porque los datos de especies amenazadas no sirven', 'Sirven mucho; por eso se comparten con precisión solo con quien investiga.'],
        'Porque las especies amenazadas son todas marinas',
      ], 'Un dato abierto puede ser un riesgo. Proteger a la especie está por encima de mostrar el punto exacto.', { d: 2 }),
      clas('¿Conviene publicar la ubicación exacta o protegerla?', { // e6
        'Publicar exacta': ['Un gorrión en una plaza', 'Un árbol de paraíso en una vereda'],
        'Proteger': ['Un nido de cardenal amarillo', 'Una orquídea rara muy buscada', 'Un registro hecho en el patio de tu casa'],
      }, 'La ubicación de especies buscadas por traficantes y de hogares particulares merece protección.', { d: 2 }),
      mult('¿Qué hace confiables los datos de un gran proyecto de ciencia ciudadana? Marcá todo.', [ // e7
        '+Revisión de registros inusuales por expertos',
        '+Identificaciones confirmadas por la comunidad',
        '+Registro del esfuerzo de muestreo',
        '-Que todos los registros sean de especies raras',
        '-Que nadie revise nada para no desalentar',
      ], 'Muchas personas más buenos controles producen datos que la ciencia puede usar con confianza.', { d: 2 }),
      vf('Si una especie de ave llega cada primavera algunos días antes que hace 30 años, eso puede ser una señal del calentamiento.', true, 'Es un cambio de fenología que se observa en muchas especies. Para atribuirlo al clima hacen falta series largas y descartar otros cambios, como el esfuerzo de observación.', { // e7b
        razones: ['+Porque es un cambio de fenología asociado al calentamiento', '-Porque las aves llegan siempre el mismo día exacto', '-Porque la fenología no tiene relación con el clima'],
        d: 2,
      }),
      det('Leé este resumen de un proyecto y marcá lo equivocado.', [ // e8
        ['Los registros inusuales se revisan antes de aceptarlos.', false],
        ['Publicamos la ubicación exacta de todos los nidos de especies amenazadas.', true, 'Puede facilitar su captura; conviene protegerla.'],
        ['Compartimos los datos en GBIF citando a los participantes.', false],
        ['Como son voluntarios, sus datos nunca sirven para estudiar tendencias.', true, 'Con listas completas y esfuerzo registrado, sí sirven.'],
      ], 'Calidad, apertura y cuidado: las tres patas de un buen proyecto.', { d: 2 }),
      comp('Completá.', 'La red mundial que reúne registros de biodiversidad se llama [GBIF]; el estudio de cuándo florecen las plantas o llegan las aves es la [fenología]; y la ubicación de especies amenazadas se [oculta].', ['NASA', 'geología', 'duplica'], 'Tres claves para entender qué pasa con los datos después de registrarlos.', { d: 2 }),
      est('Estimá cuántos registros de biodiversidad reúne GBIF en total.', 3000000000, { min: 1000000, max: 1000000000000, unidad: 'registros', escala: 'log' }, 'Miles de millones: más de tres mil millones de registros de museos, universidades y ciencia ciudadana de todo el mundo.', { d: 3 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Tu propio proyecto', 'De una pregunta del barrio a un monitoreo con protocolo, prueba piloto, datos abiertos y devolución.', [
      teoria('Empezar por la pregunta', [
        'Un proyecto de ciencia ciudadana empieza con una pregunta que se pueda responder con datos que la gente pueda tomar. "¿Cómo cambia la cantidad de aves de la plaza a lo largo del año?" o "¿El arroyo está peor aguas abajo de la fábrica?" son buenas preguntas. "¿Cómo salvar el planeta?" es importante, pero no se responde con un monitoreo.',
      ]),
      clas('¿Es una buena pregunta para un proyecto de ciencia ciudadana?', { // e1
        'Buena pregunta': ['¿Qué polinizadores visitan las flores de la plaza en primavera?', '¿Cuánto llueve en cada barrio del pueblo?', '¿Hay vinchucas en las casas del paraje?'],
        'Demasiado amplia o no medible': ['¿Cómo salvar el planeta?', '¿Es buena la naturaleza?'],
      }, 'Una buena pregunta es concreta, medible y cercana a lo que la gente puede observar.', { d: 1 }),
      teoria('Los pasos', [
        'Después de la pregunta, se diseña un protocolo simple y claro; se hace una prueba piloto con pocas personas para detectar problemas; se capacita a los participantes; se recolectan los datos con el esfuerzo registrado; se revisa la calidad; se analizan los resultados; y se devuelven a la comunidad. Si es posible, conviene asociarse con un equipo de investigación que ayude con el diseño y el análisis.',
      ]),
      ord('Ordená las etapas de un proyecto de ciencia ciudadana.', [ // e2
        'Definir una pregunta concreta',
        'Diseñar un protocolo simple',
        'Hacer una prueba piloto',
        'Capacitar y recolectar datos',
        'Analizar y devolver los resultados',
      ], 'La prueba piloto ahorra muchos errores: es mejor descubrirlos con 5 personas que con 500.', { d: 2 }),
      op('¿Para qué sirve una prueba piloto?', [ // e3
        'Para encontrar problemas del protocolo antes de escalar',
        'Para que los resultados salgan como uno quiere',
        ['Para no tener que capacitar a nadie', 'La capacitación sigue siendo necesaria; el piloto la mejora.'],
        'Para publicar resultados más rápido',
      ], 'Un protocolo confuso produce datos inservibles. El piloto lo revela a tiempo y a bajo costo.', { d: 2 }),
      teoria('Un ejemplo: pluviómetros del barrio', [
        'Un grupo de vecinos quiere saber si llueve distinto en cada zona de su pueblo. Instalan pluviómetros caseros iguales, a la misma altura y lejos de techos y árboles. Leen el agua acumulada cada mañana a las 9, anotan en una planilla compartida y vacían el pluviómetro. Con meses de datos pueden comparar barrios y aportar información al municipio para planificar desagües.',
      ]),
      mult('¿Qué detalles del protocolo de los pluviómetros hacen comparables los datos? Marcá todos.', [ // e4
        '+Pluviómetros iguales en todos los barrios',
        '+Misma altura y lejos de techos y árboles',
        '+Lectura todos los días a la misma hora',
        '-Que cada vecino elija su propio recipiente',
        '-Leer cuando uno se acuerda',
      ], 'Igual instrumento, igual ubicación, igual horario: así las diferencias se deben a la lluvia.', { d: 2 }),
      numv(3, (i) => { // e5
        const vals = [[12, 18, 9, 21], [30, 24, 36, 30], [5, 11, 8, 12]][i];
        const prom = vals.reduce((a, b) => a + b, 0) / vals.length;
        return {
          enunciado: `Cuatro pluviómetros del pueblo midieron ${vals.join(', ')} mm en la misma tormenta. ¿Cuál es el promedio? Redondeá a un decimal.`,
          valor: Math.round(prom * 10) / 10,
          unidad: 'mm',
          dec: 1,
          tol: 0.1,
          explicacion: `(${vals.join(' + ')}) ÷ 4 = ${(Math.round(prom * 10) / 10).toLocaleString('es-AR')} mm. Pero el promedio esconde que un barrio recibió más del doble que otro: por eso sirve tener varios puntos.`,
          ctx: `Mediciones de ${vals.join(', ')} mm.`,
        };
      }, { d: 2 }),
      teoria('Ética del proyecto', [
        'Un proyecto responsable cuida a las personas: explica para qué se usan los datos, pide permiso para publicarlos, protege la privacidad y no pone a nadie en riesgo (por ejemplo, no pide muestrear un arroyo en crecida). Cuida al ambiente: no molesta a la fauna ni extrae más de lo necesario. Y cumple las normas: algunas actividades, como capturar animales, necesitan permisos oficiales.',
      ]),
      det('Leé el protocolo que armó un grupo y marcá lo que conviene cambiar.', [ // e6
        ['Explicamos a cada participante para qué se usan los datos.', false],
        ['Vamos a muestrear el arroyo también en los días de crecida.', true, 'Pone en riesgo a las personas; hay que evitarlo.'],
        ['Registramos hora, lugar y duración de cada observación.', false],
        ['Capturaremos ranas para contarlas en casa y después soltarlas.', true, 'Molesta a la fauna y puede requerir permisos; se cuentan en el lugar.'],
      ], 'La seguridad de las personas y el bienestar de la fauna van antes que los datos.', { d: 2 }),
      vf('Devolver los resultados a quienes participaron es opcional y no cambia nada.', false, 'La devolución es uno de los principios de la ciencia ciudadana: motiva a seguir participando y permite que la comunidad use los resultados.', { // e7
        razones: ['+Porque motiva a participar y permite usar los resultados', '-Porque los participantes no quieren saber nada', '-Porque los resultados son secretos'],
        d: 1,
      }),
      rank('Ordená estos proyectos del más al menos factible para una escuela.', [ // e8
        ['Contar polinizadores en las flores del patio con un protocolo de 10 minutos', 'muy factible'],
        ['Medir la lluvia con pluviómetros caseros en las casas', 'factible'],
        ['Monitorear aves en una reserva a 50 km cada semana', 'difícil'],
        ['Estudiar el cambio climático global con datos propios', 'inviable'],
      ], 'Un buen primer proyecto es cercano, simple y sostenible en el tiempo.', { d: 2, extremos: ['Más factible', 'Menos factible'] }),
      cad('Armá la cadena de cómo los datos de los pluviómetros pueden llegar a una decisión.', [ // e8b
        'Los vecinos notan que algunas calles se inundan más',
        'Instalan pluviómetros con un protocolo común',
        'Registran la lluvia durante varios meses',
        'Encuentran que un barrio recibe más lluvias intensas',
        'Presentan los datos al municipio para planificar desagües',
      ], ['El municipio decide sin mirar ningún dato'], 'Los datos ciudadanos, bien tomados, pueden orientar decisiones públicas.', { d: 2 }),
      par('Uní cada etapa con su propósito.', [ // e9
        ['Pregunta', 'Definir qué se quiere saber'],
        ['Protocolo', 'Hacer comparables los datos'],
        ['Prueba piloto', 'Detectar problemas a tiempo'],
        ['Devolución', 'Compartir resultados con la comunidad'],
      ], 'Cada etapa cumple una función. Saltarse una suele costar caro después.', { d: 1 }),
      comp('Completá.', 'Un proyecto empieza con una [pregunta] concreta; antes de escalar conviene hacer una prueba [piloto]; y al final hay que hacer una [devolución] a la comunidad.', ['respuesta', 'final', 'factura'], 'Las etapas clave para armar un proyecto propio.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: ciencia ciudadana', 'Proyectos, observaciones, protocolos, sesgos, datos abiertos y diseño de proyectos, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el conteo de la plaza', 'Cuatro grupos de una escuela contaron aves en distintos sectores de la plaza. Analizá los datos con cuidado.', [
      teoria('Los datos', [
        'Los cuatro grupos debían seguir el mismo protocolo: 20 minutos por sector, anotando todas las aves que se ven u oyen. Pero no todos lo cumplieron.',
      ], {
        datos: tabla('Conteo de aves por sector', ['Sector', 'Aves contadas', 'Minutos observados', 'Especies'], [
          ['Norte (árboles nativos)', '48', '20', '11'],
          ['Sur (césped)', '30', '20', '4'],
          ['Este (junto a la calle)', '60', '60', '6'],
          ['Oeste (estanque)', '40', '20', '9'],
        ], 'Datos ficticios para el ejercicio.'),
      }),
      num('¿Cuántas aves por hora contó el grupo del sector este?', 60, 'aves por hora', '60 aves en 60 minutos = 60 por hora. Parece mucho, pero el grupo observó el triple de tiempo que el resto: hay que comparar tasas.', { ctx: 'Sector este: 60 aves en 60 minutos.', d: 1 }),
      rank('Ordená los sectores por aves por hora, de mayor a menor.', [ // e2
        ['Norte', '144 por hora'],
        ['Oeste', '120 por hora'],
        ['Sur', '90 por hora'],
        ['Este', '60 por hora'],
      ], 'Norte: 48 × 3 = 144; Oeste: 40 × 3 = 120; Sur: 30 × 3 = 90; Este: 60. El este, que tenía el mayor total, queda último en la tasa.', { d: 3 }),
      op('¿Qué error cometería quien dijera que el sector este tiene más aves?', [ // e3
        'Comparar totales sin tener en cuenta el esfuerzo',
        'Confundir especies de aves nativas y exóticas',
        ['Contar las aves que se oyen', 'El protocolo pedía contarlas: no es un error.'],
        'Usar datos de una sola plaza',
      ], 'El grupo este observó 60 minutos en lugar de 20. Por tiempo de búsqueda, es el sector con menos aves.', { d: 2 }),
      mult('¿Qué conclusiones se pueden sacar con cuidado? Marcá todas.', [ // e4
        '+El sector norte, con árboles nativos, tuvo más especies',
        '+El césped tuvo pocas especies',
        '+Habría que repetir el conteo en otras fechas',
        '-La calle atrae más aves que el estanque',
        '-Los árboles nativos no influyen en las aves',
      ], 'Un solo conteo da pistas, no certezas: repetir en distintas fechas fortalece las conclusiones.', { d: 3 }),
      vf('Con un solo día de conteo se puede afirmar que el sector norte siempre tiene más aves.', false, 'Un solo día puede estar influido por el clima, la hora o el azar. Hacen falta conteos repetidos para hablar de un patrón.', { // e5
        razones: ['+Porque un solo día puede estar influido por el azar', '-Porque los conteos de aves no sirven', '-Porque las aves no vuelven nunca al mismo lugar'],
        d: 2,
      }),
      cad('Armá el plan para mejorar el próximo conteo.', [ // e6
        'Recordar a todos los grupos el protocolo de 20 minutos',
        'Contar en la misma franja horaria en todos los sectores',
        'Repetir el conteo una vez por mes durante un año',
        'Cargar los datos con el esfuerzo registrado',
        'Comparar tasas por hora entre sectores y estaciones',
      ], ['Dejar que cada grupo elija cuánto tiempo contar'], 'Mismo protocolo, misma hora, repeticiones y esfuerzo registrado: así los datos responden la pregunta.', { d: 3 }),
      det('La escuela escribe el informe. Marcá lo que conviene corregir.', [ // e7
        ['El sector norte tuvo la mayor tasa de aves por hora.', false],
        ['El sector este tiene más aves porque contó 60.', true, 'Contó 60 en el triple de tiempo: su tasa es la más baja.'],
        ['Recomendamos plantar más árboles nativos, aunque hay que confirmarlo con más conteos.', false],
        ['Ya está demostrado para siempre; no hace falta repetir.', true, 'Un solo conteo no alcanza; hay que repetir para confirmar.'],
      ], 'Un buen informe de ciencia ciudadana es honesto sobre lo que los datos muestran y lo que no.', { d: 3 }),
    ]),
  ],
});
