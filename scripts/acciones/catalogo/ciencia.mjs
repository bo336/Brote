// Ciencia ciudadana — mirar, registrar y aportar datos que sirven.
import { d, c, nada } from '../dsl.mjs';

const dom = 'ciencia';

export default [
  // ── Del día ────────────────────────────────────────────────────────────────
  d('cie-cinco-minutos-ventana', 'Mirá qué aves pasan por tu ventana durante 5 minutos', {
    dom, e: 'easy', i: 'low', min: 5, formato: 'observar', rut: true,
    corto: 'Horneros, benteveos, zorzales, calandrias: en cinco minutos aparecen más de los que creés.',
    desc: 'Cinco minutos mirando por la ventana, el balcón o desde la plaza alcanzan para empezar a distinguir aves. Anotá cuántas viste y de qué colores o cantos. Con el tiempo vas a reconocerlas, que es el primer paso para registrarlas en serio.',
    pasos: ['Elegí una ventana, balcón o banco de plaza.', 'Durante 5 minutos, mirá y escuchá.', 'Anotá cuántas aves viste y cómo eran.'],
    ef: nada(), fuente: 'aves-argentinas', tags: ['aves', 'chicos'],
  }),
  d('cie-bicho-de-cerca', 'Buscá un bicho y miralo de cerca cinco minutos', {
    dom, e: 'easy', i: 'low', min: 5, formato: 'observar', lugar: 'naturaleza',
    corto: 'Una vaquita de San Antonio, un bicho bolita, una hormiga cargando una hoja: todos tienen algo que hacer.',
    desc: 'Debajo de una hoja, en una flor o en la corteza de un árbol siempre hay alguien. Mirarlo de cerca un rato, sin tocarlo ni sacarlo de su lugar, enseña más de cómo funciona la naturaleza que cualquier libro: qué come, adónde va, quién se lo quiere comer.',
    pasos: ['Buscá en el patio, la vereda o la plaza: debajo de una hoja, en una flor, en un tronco.', 'Miralo cinco minutos sin tocarlo: qué hace, adónde va.', 'Si querés, sacale una foto y averiguá cómo se llama.'],
    ef: nada(), tags: ['insectos', 'chicos'],
  }),

  // ── Catálogo ───────────────────────────────────────────────────────────────
  c('registra-una-observacion-de-biodiversidad', 'Subí una observación de un ser vivo a ArgentiNat', {
    dom, e: 'easy', i: 'high', min: 15, formato: 'observar', edad: 'kta', adulto: true, lugar: 'naturaleza', cool: 72,
    corto: 'Cada foto con fecha y lugar es un dato que usan investigadores reales.',
    desc: 'ArgentiNat, el portal argentino de iNaturalist que impulsa Vida Silvestre, ya superó el millón de observaciones. Una foto de una planta, un insecto, un hongo o un ave, con fecha y ubicación, sirve para mapear la biodiversidad del país. La comunidad te ayuda a identificarla.',
    pasos: ['Bajá la app de iNaturalist o entrá a argentinat.org.', 'Sacá una foto clara de un ser vivo silvestre (no de una planta de maceta).', 'Subila con la ubicación: la comunidad te ayuda a identificarla.'],
    ef: nada(), fuente: 'argentinat', tags: ['biodiversidad', 'argentinat'],
  }),
  c('hace-un-conteo-de-aves', 'Contá aves durante 15 minutos y subilo a eBird', {
    dom, e: 'easy', i: 'high', min: 20, formato: 'observar', edad: 'ta', lugar: 'naturaleza', cool: 72,
    corto: 'Los conteos coordinados muestran tendencias que un registro suelto no ve.',
    desc: 'eBird, con Aves Argentinas, junta listas de aves de todo el país. Contar las aves que ves en 15 minutos en un lugar, y subir la lista, alimenta mapas de distribución y alertas sobre especies que disminuyen.',
    pasos: ['Elegí un lugar (plaza, costa, campo) y mirá 15 minutos.', 'Anotá cada especie y cuántos individuos viste.', 'Subí la lista a eBird con la hora y el lugar.'],
    ef: nada(), fuente: 'ebird', tags: ['aves'], hereda: ['cie-registrar-ave'],
  }),
  c('anim-identifica-las-aves-de-tu-cuadra', 'Aprendé a reconocer cinco aves de tu barrio', {
    dom, e: 'easy', i: 'medium', min: 30, formato: 'aprender', edad: 'kta', frec: 'one_time',
    corto: 'Cuesta cuidar lo que no sabés nombrar.',
    desc: 'Hornero, benteveo, zorzal colorado, calandria, chingolo, cotorra: en casi cualquier barrio argentino hay una docena de aves comunes. Aprender cinco por su forma y su canto cambia cómo caminás la ciudad.',
    pasos: ['Buscá una guía de aves comunes de tu región (Aves Argentinas tiene recursos).', 'Elegí cinco y aprendé su forma y su canto.', 'Salí a buscarlas.'],
    ef: nada(), fuente: 'aves-argentinas', tags: ['aves', 'chicos'],
  }),
  c('cie-hornero-nido', 'Buscá un nido de hornero y seguilo', {
    dom, e: 'easy', i: 'low', min: 15, formato: 'observar', est: ['primavera'], edad: 'kta', lugar: 'naturaleza', cool: 336,
    corto: 'El ave nacional construye su casa de barro a la vista de todos.',
    desc: 'En primavera, los horneros arman o reparan sus nidos de barro en postes, ramas y cornisas. Encontrar uno y mirarlo de lejos cada semana (¿lo están construyendo?, ¿se oyen pichones?) es una clase de naturaleza en tu cuadra.',
    pasos: ['Buscá nidos de barro en postes, árboles o cornisas.', 'Miralo de lejos una vez por semana, sin acercarte.', 'Anotá lo que ves: construcción, idas y vueltas, pichones.'],
    ef: nada(), fuente: 'aves-argentinas', tags: ['aves', 'nidos', 'chicos'],
  }),
  c('cie-fotografiar-planta', 'Identificá una planta de tu barrio', {
    dom, e: 'easy', i: 'low', min: 15, formato: 'observar', edad: 'kta', lugar: 'naturaleza', cool: 72,
    corto: 'Saber qué crece cerca es el primer paso para cuidarlo.',
    desc: 'El árbol de tu vereda, el yuyo de la plaza o la flor del baldío tienen nombre. Con una app de identificación o una guía, averiguá qué es y si es nativa o exótica.',
    pasos: ['Sacá una foto de hojas, flor y tronco.', 'Identificala con iNaturalist o una guía.', 'Fijate si es nativa o exótica.'],
    ef: nada(), fuente: 'argentinat', tags: ['plantas', 'nativas', 'chicos'],
  }),
  c('fotografia-fenologia-floracion-migracion', 'Anotá cuándo florece un árbol de tu cuadra', {
    dom, e: 'easy', i: 'medium', min: 10, formato: 'observar', edad: 'kta', cool: 720,
    corto: 'Las fechas de floración son uno de los mejores termómetros del clima.',
    desc: 'El jacarandá, el lapacho, el ceibo o el palo borracho florecen cada año más o menos en la misma época. Anotar el día en que ves las primeras flores, año tras año, es un registro que muestra cómo cambian las estaciones.',
    pasos: ['Elegí un árbol de tu cuadra.', 'Anotá el día en que ves las primeras flores (y las primeras hojas).', 'Repetilo el año que viene y comparalo.'],
    ef: nada(), tags: ['arbol', 'clima', 'chicos'],
  }),
  c('cie-medir-temperatura', 'Medí la temperatura al sol y a la sombra de un árbol', {
    dom, e: 'easy', i: 'low', min: 15, formato: 'observar', edad: 'kta', est: ['primavera', 'verano'], cool: 336,
    corto: 'Vas a ver de golpe lo que hace un árbol por la cuadra.',
    desc: 'Con un termómetro (o tocando el piso con la mano), compará la vereda al sol con la sombra de un árbol en un día de calor. La diferencia puede ser de varios grados: es el efecto de "isla de calor" de las ciudades sin árboles.',
    pasos: ['Un día de calor, medí la temperatura o tocá el piso al sol.', 'Hacé lo mismo a la sombra de un árbol.', 'Anotá la diferencia.'],
    ef: nada(), fuente: 'epa-isla-calor', tags: ['calor', 'arbol', 'experimento', 'chicos'],
  }),
  c('cie-contar-insectos', 'Contá los insectos que visitan una flor', {
    dom, e: 'easy', i: 'medium', min: 15, formato: 'observar', est: ['primavera', 'verano'], edad: 'kta', lugar: 'naturaleza', cool: 72,
    corto: 'Los polinizadores se están midiendo en todo el mundo.',
    desc: 'Elegí una planta con flores y mirala 10 minutos: contá cuántas abejas, moscas, mariposas o escarabajos la visitan. Repetido en distintos días, muestra qué flores eligen los polinizadores de tu barrio.',
    pasos: ['Elegí una planta con flores un día soleado.', 'Durante 10 minutos, contá los insectos que se posan.', 'Anotá el tipo (abeja, mosca, mariposa, otro) y la cantidad.'],
    ef: nada(), fuente: 'ipbes-polinizadores', tags: ['polinizadores', 'insectos', 'chicos'], hereda: ['monitorea-una-poblacion-local-de-polinizadores'],
  }),
  c('ciencia-registra-la-lluvia', 'Armá un pluviómetro casero y registrá la lluvia', {
    dom, e: 'easy', i: 'medium', min: 30, formato: 'observar', edad: 'kta', adulto: true, frec: 'one_time',
    corto: 'Los registros de lluvia caseros llenan huecos que las estaciones oficiales no cubren.',
    desc: 'Una botella cortada con una regla pegada es un pluviómetro. Medir cuántos milímetros cae en cada lluvia y anotarlo da datos muy útiles, sobre todo en zonas sin estaciones cercanas.',
    pasos: ['Cortá una botella de plástico recta y poné la parte de arriba invertida como embudo.', 'Pegá una regla del lado de afuera y dejala en un lugar abierto.', 'Después de cada lluvia, anotá los milímetros y vaciala.'],
    ef: nada(), tags: ['lluvia', 'clima', 'experimento', 'chicos'],
  }),
  c('ciencia-noche-de-polillas', 'Hacé una noche de polillas', {
    dom, e: 'medium', i: 'medium', min: 60, formato: 'observar', est: ['primavera', 'verano'], edad: 'kta', adulto: true, cool: 336,
    corto: 'Las polillas son polinizadoras nocturnas y casi nadie las registra.',
    desc: 'Una sábana blanca colgada con una linterna atrás, en una noche cálida, atrae polillas de formas y colores increíbles. Sacales fotos y subilas a ArgentiNat: muchas especies tienen muy pocos registros.',
    pasos: ['Colgá una sábana blanca y apuntá una linterna hacia ella.', 'Esperá una hora en una noche cálida y sin viento.', 'Sacá fotos de las polillas y subilas a ArgentiNat.'],
    ef: nada(), fuente: 'argentinat', tags: ['insectos', 'noche', 'chicos'],
  }),
  c('ciencia-mide-la-contaminacion-luminica', 'Contá las estrellas que ves desde tu casa', {
    dom, e: 'easy', i: 'low', min: 15, formato: 'observar', edad: 'kta', cool: 720,
    corto: 'Cuántas estrellas se ven es un dato real de contaminación lumínica.',
    desc: 'En una noche despejada y sin luna, mirá una constelación conocida (como la Cruz del Sur o las Tres Marías) y contá cuántas estrellas ves. Comparado con lo que se ve en el campo, muestra cuánta luz artificial hay en tu cielo.',
    pasos: ['Elegí una noche despejada y sin luna.', 'Apagá las luces cercanas y esperá 10 minutos a que se acostumbre la vista.', 'Contá las estrellas que ves alrededor de una constelación y anotalo.'],
    ef: nada(), tags: ['noche', 'cielo', 'chicos'],
  }),
  c('ciencia-medi-un-arbol', 'Medí un árbol y seguí su crecimiento', {
    dom, e: 'easy', i: 'low', min: 15, formato: 'observar', edad: 'kta', cool: 4320,
    corto: 'El crecimiento medido año a año dice cuánto carbono guarda.',
    desc: 'Con un hilo y una regla, medí la circunferencia del tronco a 1,30 m del piso. Anotala con la fecha y repetilo cada año: el tronco que engorda es carbono que el árbol guardó.',
    pasos: ['Rodeá el tronco con un hilo a 1,30 m del piso.', 'Medí el hilo con una regla.', 'Anotá la medida, la fecha y la especie.'],
    ef: nada(), tags: ['arbol', 'carbono', 'chicos'],
  }),
  c('cie-mapear-arboles', 'Mapeá los árboles de tu cuadra', {
    dom, e: 'medium', i: 'medium', min: 60, formato: 'observar', edad: 'ta', lugar: 'calle', cool: 4320,
    corto: 'Muchos municipios no tienen un censo completo de su arbolado.',
    desc: 'Contar los árboles de tu cuadra, identificar las especies y anotar si hay casillas vacías o árboles enfermos sirve para pedir al municipio que plante donde falta. Si lo subís a ArgentiNat, además queda como dato abierto.',
    pasos: ['Recorré tu cuadra de punta a punta.', 'Anotá cada árbol (especie si sabés) y cada casilla vacía.', 'Compartilo con tus vecinos o mandalo al municipio pidiendo plantar donde falta.'],
    ef: nada(), tags: ['arbol', 'barrio'],
  }),
  c('ciencia-transcribi-registros-historicos', 'Ayudá a digitalizar datos científicos desde tu compu', {
    dom, e: 'easy', i: 'medium', min: 30, formato: 'observar', edad: 'ta', lugar: 'celular', cool: 168,
    corto: 'Millones de registros viejos de clima y naturaleza esperan que alguien los pase a digital.',
    desc: 'Plataformas de ciencia ciudadana en línea piden voluntarios para transcribir planillas de clima antiguas, etiquetas de colecciones de museos o identificar animales en fotos de cámaras trampa. Una media hora desde casa ayuda a investigaciones reales.',
    pasos: ['Entrá a una plataforma de ciencia ciudadana en línea.', 'Elegí un proyecto de clima, biodiversidad o naturaleza.', 'Seguí el tutorial y aportá unas cuantas transcripciones o clasificaciones.'],
    ef: nada(), tags: ['online', 'clima', 'biodiversidad'],
  }),
  c('participa-de-un-bioblitz-urbano', 'Sumate a la Gran BioBúsqueda o a un bioblitz', {
    dom, e: 'medium', i: 'high', min: 120, formato: 'observar', edad: 'kta', adulto: true, lugar: 'naturaleza', cool: 720,
    corto: 'En pocos días, cientos de personas mapean lo que un equipo tardaría meses.',
    desc: 'La Gran BioBúsqueda del Sur y los "safaris" de ArgentiNat invitan a todo el país a registrar seres vivos durante unos días. Cada ciudad compite por la mayor cantidad de observaciones: es ciencia y es juego.',
    pasos: ['Fijate cuándo es la próxima BioBúsqueda o safari de ArgentiNat.', 'Esos días, salí a buscar seres vivos en tu ciudad.', 'Subí todas las observaciones que puedas.'],
    ef: nada(), fuente: 'vida-silvestre', tags: ['biodiversidad', 'argentinat', 'grupo'],
  }),
  c('reporta-avistajes-de-especies-invasoras', 'Registrá una especie invasora que veas', {
    dom, e: 'easy', i: 'medium', min: 15, formato: 'observar', edad: 'ta', lugar: 'naturaleza', cool: 168,
    corto: 'Detectar una invasora temprano es lo único que permite frenarla.',
    desc: 'Ligustro, acacia negra, lirio amarillo, ardilla de vientre rojo, castor en Tierra del Fuego, caracol gigante africano: registrar dónde aparecen ayuda a las autoridades a actuar a tiempo. Subí la foto con ubicación a ArgentiNat.',
    pasos: ['Revisá la lista de especies invasoras de tu región.', 'Si ves una, sacale foto con ubicación.', 'Subila a ArgentiNat.'],
    ef: nada(), fuente: 'invasoras-mayds', tags: ['invasoras', 'argentinat'],
  }),
  c('subi-un-geo-tag-de-basura-encontrada', 'Mapeá dónde se acumula basura en tu barrio', {
    dom, e: 'easy', i: 'medium', min: 30, formato: 'observar', edad: 'ta', lugar: 'calle', cool: 720,
    corto: 'Mapear dónde se acumula la basura es lo que justifica una limpieza o un cesto.',
    desc: 'Recorré tu barrio y marcá en un mapa (en el celu) los puntos donde siempre hay basura: esquinas, paradas, baldíos. Con el mapa, el reclamo al municipio o la organización de una limpieza tienen datos.',
    pasos: ['Recorré tu barrio con el celular.', 'Marcá en un mapa cada punto con basura acumulada, con foto.', 'Usalo para pedir cestos o para organizar una limpieza.'],
    ef: nada(), tags: ['basura', 'barrio', 'mapa'],
  }),
  c('sumate-a-un-programa-de-monitoreo-de-cuencas', 'Sumate a un monitoreo de agua de un arroyo o laguna', {
    dom, e: 'medium', i: 'high', min: 120, formato: 'observar', edad: 'ta', lugar: 'naturaleza', cool: 720,
    corto: 'Sin datos locales no hay con qué defender un arroyo.',
    desc: 'Universidades, escuelas técnicas y organizaciones arman monitoreos de agua con vecinos: miden transparencia, temperatura y bichos acuáticos que indican la calidad del agua. Sumarse es aprender y generar datos para cuidar tu cuenca.',
    pasos: ['Buscá un monitoreo participativo de agua en tu zona (universidades, ONG, municipio).', 'Anotate en una salida.', 'Seguí el protocolo y compartí los resultados.'],
    ef: nada(), fuente: 'acumar', tags: ['agua', 'rio', 'grupo'],
  }),
  c('cie-sapos-noche', 'Salí una noche de lluvia a escuchar sapos y ranas', {
    dom, e: 'easy', i: 'low', min: 30, formato: 'observar', est: ['primavera', 'verano'], edad: 'kta', adulto: true, lugar: 'naturaleza', cool: 168,
    corto: 'Cada especie canta distinto: los cantos dicen quién vive cerca.',
    desc: 'Después de una lluvia de primavera o verano, los charcos y zanjas se llenan de cantos. Grabarlos con el celular y compararlos con guías de cantos (o subirlos a ArgentiNat) es una forma de saber qué anfibios hay en tu zona, uno de los grupos más amenazados.',
    pasos: ['Después de una lluvia, salí con un adulto y una linterna cerca de charcos o zanjas.', 'Grabá los cantos con el celular.', 'Compará los cantos con una guía o subilos a ArgentiNat.'],
    ef: nada(), fuente: 'argentinat', tags: ['anfibios', 'noche', 'chicos'],
  }),
  c('cie-cuaderno-de-campo', 'Empezá un cuaderno de naturaleza', {
    dom, e: 'easy', i: 'low', min: 20, formato: 'observar', edad: 'kta', frec: 'one_time',
    corto: 'Un cuaderno con dibujos, fechas y lo que ves es lo que usaban los naturalistas.',
    desc: 'Un cuaderno donde dibujás o anotás lo que ves (un pájaro, una flor, el tiempo, un bicho) con la fecha y el lugar te entrena la mirada. Con los meses se vuelve un registro de tu barrio que nadie más tiene.',
    pasos: ['Conseguí un cuaderno (puede ser uno a medio usar).', 'Salí a un lugar con plantas y dibujá o anotá algo que veas.', 'Poné siempre la fecha, el lugar y el tiempo que hacía.'],
    ef: nada(), tags: ['naturaleza', 'chicos', 'escuela'],
  }),
];
