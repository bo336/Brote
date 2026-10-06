// Situaciones de la vida — vacaciones, fiestas, el club, el trabajo, la escuela,
// las tormentas, y misiones para chicos. Cada acción va a su tema.
import { d, c, agua, elec, comida, plastico, reciclable, prendas, suma, nada } from '../dsl.mjs';

const vacaciones = ['verano', 'invierno'];

export default [
  // ── Vacaciones y salidas ───────────────────────────────────────────────────
  c('vac-camping-sin-rastro', 'Dejá el camping o la orilla como la encontraste', {
    dom: 'residuos', e: 'easy', i: 'medium', min: 15, formato: 'salida', est: vacaciones, edad: 'kta', lugar: 'naturaleza', cool: 72,
    corto: 'No dejar rastro es la regla de oro de cualquier salida a la naturaleza.',
    desc: 'En campings, orillas de ríos y lagos, lo que queda (latas, bolsas, colillas, restos de fogón) se lo lleva el viento o la crecida. Antes de irte, recorré el lugar: que no quede nada tuyo, y si podés, llevate algo que no era tuyo.',
    pasos: ['Llevá bolsas para tu basura desde el principio.', 'Antes de irte, recorré el lugar y juntá todo.', 'Llevate la basura hasta un contenedor de verdad, no la dejes junto a uno lleno.'],
    ef: { r: 0.2 }, tags: ['vacaciones', 'camping', 'naturaleza'],
  }),
  c('vac-fogon-habilitado', 'Hacé fuego sólo en fogones habilitados y apagalo con agua', {
    dom: 'aire_suelo', e: 'easy', i: 'high', min: 10, formato: 'salida', est: vacaciones, edad: 'kta', adulto: true, lugar: 'naturaleza', cool: 72,
    corto: 'Un fogón mal apagado puede volverse un incendio forestal.',
    desc: 'En bosques patagónicos, sierras y campings, la mayoría de los incendios empiezan por fogones mal apagados o hechos donde no se debía. Usá sólo los fogones habilitados, nunca con viento, y al irte apagalo con agua y removiendo las brasas hasta que estén frías al tacto.',
    pasos: ['Hacé fuego sólo en fogones habilitados y si no hay prohibición vigente.', 'No lo dejes solo nunca.', 'Al irte, apagalo con agua, revolvé y volvé a mojar hasta que esté frío.'],
    ef: nada(), fuente: 'ley-27604-fuego', tags: ['vacaciones', 'fuego', 'camping'],
  }),
  c('vac-hotel-toallas', 'En el hotel, reusá las toallas y las sábanas', {
    dom: 'agua', e: 'easy', i: 'medium', min: 1, formato: 'salida', est: vacaciones, edad: 'ta', cool: 72,
    corto: 'En casa no cambiás las toallas todos los días: en el hotel tampoco hace falta.',
    desc: 'Cada cambio diario de toallas y sábanas es un lavado industrial con agua, detergente y energía. Colgá las toallas para avisar que las vas a reusar y pedí que no cambien las sábanas todos los días.',
    pasos: ['Colgá las toallas (en el piso significa "cambiar").', 'Avisá en recepción o con el cartel que no hace falta cambiar sábanas cada día.'],
    ef: suma(agua(30), elec(0.5)), tags: ['vacaciones', 'hotel'],
  }),
  c('vac-cerro-basura', 'En la montaña, bajá con toda tu basura, cáscaras incluidas', {
    dom: 'residuos', e: 'easy', i: 'medium', min: 5, formato: 'salida', est: vacaciones, edad: 'kta', lugar: 'naturaleza', cool: 72,
    corto: 'En la altura, hasta una cáscara de banana tarda años en desaparecer.',
    desc: 'En cerros y senderos de montaña, el frío y la sequedad hacen que todo tarde muchísimo en degradarse, incluso la comida. Además atrae animales que se acostumbran a la gente. Todo lo que sube, baja con vos.',
    pasos: ['Llevá una bolsa en la mochila para la basura.', 'Guardá también cáscaras, carozos y restos de comida.', 'Tirala al volver, en un contenedor.'],
    ef: { r: 0.1 }, fuente: 'parques-nacionales', tags: ['vacaciones', 'montaña', 'naturaleza'],
  }),
  c('vac-sendero-marcado', 'Caminá por los senderos marcados en parques y reservas', {
    dom: 'animales', e: 'easy', i: 'medium', min: 5, formato: 'salida', edad: 'kta', lugar: 'naturaleza', cool: 72,
    corto: 'Salirse del sendero pisa plantas, erosiona el suelo y espanta fauna.',
    desc: 'En parques nacionales, reservas y cerros, los senderos están pensados para que miles de personas pasen sin dañar el lugar. Los atajos abren cárcavas, pisan plantas que tardan años en crecer y molestan a la fauna.',
    pasos: ['Seguí siempre los senderos marcados.', 'No tomes atajos en las curvas de los caminos de montaña.', 'Respetá las áreas cerradas.'],
    ef: nada(), fuente: 'parques-nacionales', tags: ['vacaciones', 'reserva', 'naturaleza'],
  }),
  c('vac-souvenir-local', 'Comprá artesanía local en vez de recuerdos de plástico', {
    dom: 'consumo', e: 'easy', i: 'low', min: 20, formato: 'salida', est: vacaciones, edad: 'kta', lugar: 'compras', cool: 168,
    corto: 'Un recuerdo hecho por alguien del lugar dura más y deja la plata ahí.',
    desc: 'En lugar del imán o el llavero de plástico fabricado lejos, buscá algo hecho por artesanos del lugar: un tejido, una cerámica, dulces regionales, un objeto de madera. Mejor recuerdo y mejor para la economía local.',
    pasos: ['Preguntá por ferias de artesanos o mercados regionales.', 'Elegí algo hecho en el lugar.'],
    ef: { r: 0.1 }, tags: ['vacaciones', 'compras', 'artesania'],
  }),
  c('vac-conservadora-sin-descartables', 'Armá la conservadora para la playa o el río sin descartables', {
    dom: 'residuos', e: 'easy', i: 'medium', min: 15, est: ['verano'], edad: 'kta', adulto: true, cool: 72,
    corto: 'Vasos, cubiertos y botellas de un día de playa son lo que más se encuentra en la arena.',
    desc: 'Para el día de playa, río o pileta: botellas reutilizables, tuppers, vasos y cubiertos de casa, y una bolsa para volver con la basura. Es comodidad y es no dejar plástico donde se lo lleva el agua.',
    pasos: ['Llevá agua en botellas o termos reutilizables.', 'Comida en tuppers, con cubiertos y vasos de casa.', 'Una bolsa extra para volver con la basura.'],
    ef: plastico(0.05), tags: ['vacaciones', 'playa', 'plastico'],
  }),

  // ── Fiestas y cumpleaños ───────────────────────────────────────────────────
  c('fiesta-vajilla-reutilizable', 'Organizá un cumpleaños sin descartables', {
    dom: 'residuos', e: 'medium', i: 'high', min: 30, formato: 'social', edad: 'kta', adulto: true, cool: 720,
    corto: 'Un cumpleaños con vasos y platos de verdad genera una bolsa de basura en vez de cinco.',
    desc: 'Vasos con el nombre de cada invitado, platos y cubiertos de casa (o prestados), jarras de agua en vez de botellas chicas y una bolsa para reciclables. Es más lindo, más barato y casi no deja basura.',
    pasos: ['Juntá vasos, platos y cubiertos reutilizables (pedí prestados si faltan).', 'Marcá los vasos con el nombre de cada uno.', 'Poné dos bolsas: reciclables y resto.'],
    ef: plastico(0.3), tags: ['fiestas', 'cumpleaños', 'plastico'],
  }),
  c('fiesta-sobras-repartir', 'Repartí lo que sobró de la fiesta para llevar', {
    dom: 'alimentacion', e: 'easy', i: 'medium', min: 15, formato: 'social', edad: 'ta', cool: 720,
    corto: 'Después de un cumple o un asado grande siempre sobra comida.',
    desc: 'Pedí a los invitados que traigan un tupper o tené recipientes a mano para repartir lo que sobra. La comida que se va con alguien no termina en la basura.',
    pasos: ['Avisá en la invitación que traigan un tupper.', 'Al final, repartí lo que sobró.', 'Lo que quede, congelalo.'],
    ef: comida(1), tags: ['fiestas', 'sobras', 'desperdicio'],
  }),
  c('fiesta-cotillon-reutilizable', 'Decorá la fiesta con cosas que se vuelven a usar', {
    dom: 'consumo', e: 'easy', i: 'low', min: 30, edad: 'kta', cool: 720,
    corto: 'El cotillón descartable dura una noche y va todo a la basura.',
    desc: 'Banderines de tela, guirnaldas de papel hecho a mano, luces, plantas o dibujos de los chicos decoran igual y se guardan para la próxima. Sin globos sueltos ni papel picado, que terminan en desagües.',
    pasos: ['Armá decoración con tela, papel reusado o dibujos.', 'Guardala en una caja para la próxima fiesta.'],
    ef: { r: 0.2 }, tags: ['fiestas', 'cumpleaños', 'chicos'], hereda: ['azul-globos-no'],
  }),
  c('fiesta-separar-en-evento', 'En la fiesta, poné dos bolsas: reciclables y resto', {
    dom: 'residuos', e: 'easy', i: 'medium', min: 5, formato: 'social', edad: 'kta', cool: 168,
    corto: 'En una fiesta se juntan latas, botellas y cartón de sobra para reciclar.',
    desc: 'En cumpleaños, asados o reuniones se juntan muchas latas, botellas y cajas. Con dos bolsas bien marcadas, todo eso vuelve al circuito en vez de mezclarse con restos de comida.',
    pasos: ['Poné dos bolsas o cajas marcadas: "reciclables" y "resto".', 'Avisale a los invitados.', 'Al final, separá lo que haya quedado mezclado.'],
    ef: reciclable(1), tags: ['fiestas', 'reciclaje', 'chicos'],
  }),
  c('fiestas-comida-justa', 'Calculá la comida de las fiestas para que no sobre', {
    dom: 'alimentacion', e: 'easy', i: 'high', min: 20, est: ['verano'], edad: 'ta', cool: 720,
    corto: 'Navidad y Año Nuevo son los días en que más comida se tira.',
    desc: 'En las fiestas de fin de año se cocina como para el doble de gente. Planificar cantidades (y pensar antes qué se hace con lo que sobra) evita tirar comida y plata en la época de más gastos.',
    pasos: ['Contá cuántos son y planificá porciones reales.', 'Repartí lo que sobra entre los invitados.', 'Congelá lo que se pueda.'],
    ef: comida(1), tags: ['fiestas', 'navidad', 'desperdicio'],
  }),
  c('fiestas-luces-led-timer', 'Si ponés luces de Navidad, que sean LED y con horario', {
    dom: 'energia', e: 'easy', i: 'low', min: 10, est: ['verano'], edad: 'ta', cool: 720,
    corto: 'Las luces prendidas toda la noche de diciembre a enero suman mucho.',
    desc: 'Las guirnaldas LED gastan una fracción de las viejas. Un timer o el hábito de apagarlas al irse a dormir hace que adornen sin quedar prendidas mientras nadie las mira.',
    pasos: ['Usá guirnaldas LED.', 'Conectalas a un timer o apagalas al irte a dormir.'],
    ef: elec(1), tags: ['fiestas', 'navidad', 'luz'],
  }),

  // ── El club, el trabajo, la escuela ────────────────────────────────────────
  d('club-limpieza-cancha', 'Después del partido, juntá la basura de la cancha o la tribuna', {
    dom: 'comunidad', e: 'easy', i: 'low', min: 5, dias: 'finde', lugar: 'naturaleza',
    corto: 'Botellas, envoltorios y vasos quedan en cada cancha después de jugar.',
    desc: 'Al terminar el partido, entrenamiento o la clase de gimnasia en la plaza, cada uno junta lo suyo y un poco más. Es un gesto de equipo que cuida el lugar donde juegan todos.',
    pasos: ['Al terminar, recorré la cancha o la tribuna.', 'Juntá botellas, envoltorios y vasos.', 'Separá lo reciclable si hay dónde.'],
    ef: { r: 0.2 }, tags: ['club', 'deporte', 'chicos'],
  }),
  c('club-ropa-deportiva-chica', 'Pasá los botines y la ropa deportiva que te quedó chica', {
    dom: 'consumo', e: 'easy', i: 'medium', min: 15, formato: 'social', edad: 'kta', adulto: true, cool: 2160,
    corto: 'Botines, camisetas y raquetas que no usás le sirven a otro chico del club.',
    desc: 'Los chicos crecen y los botines, las canilleras o la ropa del club quedan en perfecto estado. Pasarlos a un compañero, al club o a una escuelita de deportes hace que sigan jugando.',
    pasos: ['Juntá lo deportivo que ya no te entra o no usás.', 'Ofrecelo en tu club, a un compañero o a una escuelita del barrio.'],
    ef: prendas(0.5), tags: ['club', 'deporte', 'ropa', 'chicos'],
  }),
  d('trabajo-taza-propia', 'Llevá tu taza o tu termo al trabajo', {
    dom: 'residuos', e: 'easy', i: 'low', min: 1, req: ['trabajo'], dias: 'habil', lugar: 'trabajo', edad: 'a', rut: true,
    corto: 'Los vasitos del dispenser y de la máquina de café se usan dos minutos.',
    desc: 'En la oficina, los vasitos de plástico o de papel se acumulan por decenas cada día. Una taza o un termo en tu escritorio los reemplaza a todos.',
    pasos: ['Dejá una taza y un vaso en tu lugar de trabajo.', 'Usalos para el café, el agua y el mate.'],
    ef: plastico(0.01), tags: ['trabajo', 'plastico'],
  }),
  c('trabajo-impresora-doble-faz', 'Configurá la impresora del trabajo en doble faz', {
    dom: 'digital', e: 'easy', i: 'medium', min: 10, req: ['trabajo'], edad: 'a', lugar: 'trabajo', frec: 'one_time',
    corto: 'Un ajuste de cinco minutos ahorra la mitad del papel de una oficina.',
    desc: 'Si en tu trabajo se imprime, configurar las impresoras en doble faz y en blanco y negro por defecto baja mucho el consumo de papel y tinta sin que nadie tenga que acordarse.',
    pasos: ['Pedí o buscá la configuración de la impresora compartida.', 'Dejá "doble faz" y "blanco y negro" como predeterminados.'],
    ef: { r: 1, c: 1 }, tags: ['trabajo', 'papel'],
  }),
  c('trabajo-heladera-compartida', 'Revisá la heladera compartida del trabajo', {
    dom: 'alimentacion', e: 'easy', i: 'low', min: 10, req: ['trabajo'], edad: 'a', lugar: 'trabajo', cool: 168,
    corto: 'La heladera de la oficina es donde las viandas olvidadas se pudren.',
    desc: 'Una vez por semana, revisá la heladera compartida: avisá qué está por vencer, comé lo tuyo antes de que se pase y proponé un día fijo de limpieza. Se tira menos comida y la heladera funciona mejor.',
    pasos: ['Revisá qué hay tuyo y comelo o llevatelo.', 'Avisá en el grupo lo que está por vencer.', 'Proponé un día de limpieza semanal.'],
    ef: comida(0.3), tags: ['trabajo', 'heladera', 'desperdicio'],
  }),
  d('escuela-colacion-sin-envoltorio', 'Llevá la colación en un tupper, sin envoltorios', {
    dom: 'alimentacion', e: 'easy', i: 'low', min: 2, req: ['estudio'], dias: 'habil', lugar: 'escuela', edad: 'kt', rut: true,
    corto: 'Los envoltorios de las colaciones llenan los tachos de la escuela todos los días.',
    desc: 'Una fruta, un sándwich o unas galletitas caseras en un tupper reemplazan los paquetitos individuales. Menos basura en el patio, y casi siempre más rico y más sano.',
    pasos: ['A la noche, prepará la colación en un tupper.', 'Sumá una botella de agua reutilizable.'],
    ef: plastico(0.01), tags: ['escuela', 'plastico', 'chicos'],
  }),
  c('facu-apuntes-digitales', 'Compartí apuntes en digital en vez de fotocopiar', {
    dom: 'digital', e: 'easy', i: 'low', min: 10, formato: 'social', req: ['estudio'], edad: 'ta', cool: 168,
    corto: 'Un apunte compartido en la nube reemplaza decenas de fotocopias.',
    desc: 'En la escuela secundaria o la facu, un apunte escaneado o tomado en digital y compartido con el curso evita que cada uno fotocopie el mismo material. Es papel, tinta y plata.',
    pasos: ['Escaneá o fotografiá bien el apunte.', 'Compartilo en el grupo del curso o en una carpeta común.'],
    ef: { r: 0.1, c: 0.1 }, tags: ['escuela', 'facu', 'papel'],
  }),

  // ── Tormentas y clima ──────────────────────────────────────────────────────
  c('lluvia-no-sacar-basura', 'Si viene una tormenta, no saques la basura a la vereda', {
    dom: 'agua_azul', e: 'easy', i: 'high', min: 2, edad: 'kta', cool: 72,
    corto: 'Las bolsas en la vereda durante una tormenta tapan las bocas de tormenta.',
    desc: 'En las tormentas fuertes, las bolsas de basura en la calle se rompen o las arrastra el agua hasta las bocas de tormenta, que se tapan y la cuadra se inunda. Ante un alerta, esperá a que pase para sacarla.',
    pasos: ['Si hay alerta de tormenta, guardá la basura adentro.', 'Sacala cuando pase, en el horario de recolección.', 'Revisá que la boca de tormenta de tu esquina esté despejada.'],
    ef: { r: 0.1 }, fuente: 'smn-alertas', tags: ['tormenta', 'inundacion', 'barrio'],
  }),

  // ── Misiones para chicos ───────────────────────────────────────────────────
  d('mision-guardian-de-luces', 'Misión: sé guardián de las luces de tu casa por un día', {
    dom: 'energia', e: 'easy', i: 'low', min: 10, edad: 'k', adulto: true,
    corto: 'Tu trabajo hoy: que ninguna luz quede prendida en una pieza vacía.',
    desc: 'Hoy sos el guardián de las luces. Cada vez que veas una pieza vacía con la luz prendida, la apagás y anotás una rayita. A la noche, contale a tu familia cuántas apagaste. Las luces pueden ser hasta un tercio de la factura de luz.',
    pasos: ['Recorré la casa varias veces en el día.', 'Apagá las luces de las piezas vacías y anotá una rayita por cada una.', 'A la noche, contá las rayitas con tu familia.'],
    ef: elec(0.2), fuente: 'gcba-energia', tags: ['chicos', 'mision', 'luz'],
  }),
  c('mision-detective-basura', 'Misión: descubrí qué es lo que más se tira en tu casa', {
    dom: 'residuos', e: 'easy', i: 'medium', min: 20, formato: 'aprender', edad: 'k', adulto: true, cool: 720,
    corto: 'Con guantes y un adulto, sos detective de la basura por un día.',
    desc: 'Con un adulto y guantes, mirá la bolsa de basura del día (o anotá todo lo que se tira): ¿hay más plástico, papel, restos de comida? Lo que más aparece es la pista para la próxima misión de tu familia.',
    pasos: ['Con un adulto, anotá durante un día todo lo que se tira en casa.', 'Separalo en grupos: plástico, papel, comida, otros.', 'Contá cuál ganó y pensá una idea para que haya menos.'],
    ef: nada(), tags: ['chicos', 'mision', 'basura'],
  }),
  c('mision-cartel-en-casa', 'Misión: hacé carteles para cuidar el agua y la luz en casa', {
    dom: 'comunidad', e: 'easy', i: 'low', min: 30, edad: 'k', cool: 720,
    corto: 'Un cartel dibujado por vos al lado de la canilla o la llave de luz se recuerda más.',
    desc: 'Dibujá carteles con mensajes cortos ("¡Cerrame mientras te cepillás!", "¿Hay alguien? Si no, apagame") y pegalos donde hacen falta. Son recordatorios para toda la familia, hechos por vos.',
    pasos: ['Pensá dónde se olvidan más las cosas en tu casa.', 'Dibujá un cartel corto y con color para cada lugar.', 'Pegalos con permiso.'],
    ef: nada(), tags: ['chicos', 'mision', 'familia'],
  }),
  c('mision-juguete-arreglado', 'Misión: arreglá un juguete roto con ayuda', {
    dom: 'consumo', e: 'easy', i: 'low', min: 30, edad: 'k', adulto: true, cool: 336,
    corto: 'Un poco de pegamento, cinta o hilo y el juguete vuelve a jugar.',
    desc: 'Muchos juguetes que van a la basura tienen arreglo: una pieza despegada, una costura abierta, una pila que hay que cambiar. Con un adulto, investigá qué le pasa y arreglalo.',
    pasos: ['Elegí un juguete roto que te guste.', 'Con un adulto, fíjense qué le pasa.', 'Arréglenlo con pegamento, cinta, hilo o una pila nueva.'],
    ef: { r: 0.2, c: 0.3 }, tags: ['chicos', 'mision', 'arreglo', 'juguetes'],
  }),
  c('mision-chef-de-sobras', 'Misión: ayudá a cocinar algo con lo que sobró', {
    dom: 'alimentacion', e: 'easy', i: 'medium', min: 30, edad: 'k', adulto: true, cool: 168,
    corto: 'Sos chef por un día: tu ingrediente secreto es lo que hay en la heladera.',
    desc: 'Con un adulto, buscá en la heladera lo que hay que usar (verdura, arroz, pan) e inventen algo juntos: un revuelto, unas tortillas, unos bocaditos. Es comida que no se tira y una receta propia.',
    pasos: ['Con un adulto, buscá en la heladera lo que hay que usar.', 'Elijan juntos qué preparar.', 'Ayudá a cocinar y ponele un nombre a tu receta.'],
    ef: comida(0.3), tags: ['chicos', 'mision', 'cocina', 'desperdicio'],
  }),
  c('mision-mapa-del-camino', 'Misión: dibujá el mapa de tu camino a la escuela', {
    dom: 'movilidad', e: 'easy', i: 'low', min: 30, formato: 'aprender', req: ['estudio'], edad: 'k', frec: 'one_time',
    corto: 'Árboles, esquinas, perros, plazas: tu camino de todos los días tiene mucho para descubrir.',
    desc: 'Dibujá el camino de tu casa a la escuela con todo lo que ves: árboles, plazas, negocios, cruces peligrosos, bicisendas. Sirve para pensar con tu familia si se puede ir caminando o en bici, y por dónde es más seguro.',
    pasos: ['Prestá atención a tu camino a la escuela durante unos días.', 'Dibujalo con todo lo que ves.', 'Mirá con tu familia si se puede hacer caminando o en bici.'],
    ef: nada(), tags: ['chicos', 'mision', 'escuela', 'caminar'],
  }),
  c('mision-un-metro-cuadrado', 'Misión: buscá vida en un metro cuadrado de pasto', {
    dom: 'ciencia', e: 'easy', i: 'low', min: 20, formato: 'observar', edad: 'k', lugar: 'naturaleza', cool: 168,
    corto: 'Con una lupa (o sin ella), un pedacito de pasto es una selva.',
    desc: 'Marcá un cuadrado de un metro en el pasto de la plaza o el jardín con un piolín y buscá todo lo que vive ahí: hormigas, bichos bolita, arañas, tréboles, flores chiquitas. Dibujá o contá lo que encontrás.',
    pasos: ['Marcá un cuadrado de un metro con un piolín o ramitas.', 'Buscá con atención (con lupa si tenés) todo lo que vive ahí.', 'Dibujá o anotá cada cosa distinta que encontraste.'],
    ef: nada(), tags: ['chicos', 'mision', 'biodiversidad', 'experimento'],
  }),
  c('mision-dibuja-un-animal', 'Misión: dibujá un animal de tu barrio y averiguá su nombre', {
    dom: 'ciencia', e: 'easy', i: 'low', min: 20, formato: 'observar', edad: 'k', cool: 168,
    corto: 'Un pájaro, un bicho o un sapo: todos tienen nombre y una historia.',
    desc: 'Elegí un animal que hayas visto cerca (un pájaro en un cable, una mariposa, un sapo), dibujalo y averiguá con un adulto cómo se llama, qué come y dónde vive. Así empezaban los naturalistas.',
    pasos: ['Observá un animal de tu barrio.', 'Dibujalo con todos los detalles que puedas.', 'Con un adulto, averigüen su nombre y algo de cómo vive.'],
    ef: nada(), tags: ['chicos', 'mision', 'animales'],
  }),

  // ── Más cosas de todos los días ────────────────────────────────────────────
  c('ene-pava-sin-sarro', 'Sacale el sarro a la pava eléctrica', {
    dom: 'energia', e: 'easy', i: 'low', min: 20, edad: 'ta', ahorra: true, cool: 2160,
    corto: 'Con sarro, la pava tarda más en calentar y gasta más.',
    desc: 'En zonas de agua dura, el sarro se acumula en la pava eléctrica y en el fondo de las ollas, y hace que calienten peor. Hervir agua con vinagre o limón cada tanto lo saca sin químicos.',
    pasos: ['Llená la pava hasta la mitad con agua y un chorro de vinagre blanco (o jugo de limón).', 'Hervila y dejala reposar media hora.', 'Tirá el agua y enjuagá bien dos veces.'],
    ef: elec(0.5), tags: ['mate', 'cocina'],
  }),
  c('ene-heladera-temperatura', 'Poné la heladera en la temperatura justa', {
    dom: 'energia', e: 'easy', i: 'medium', min: 5, edad: 'ta', frec: 'one_time', ahorra: true,
    corto: 'Al máximo de frío gasta más y congela la verdura.',
    desc: 'La heladera conserva bien entre 4 y 5 °C y el freezer a unos −18 °C. Muchas están al máximo "por las dudas": gastan más y queman los alimentos. Poné la perilla en el medio y comprobalo con un termómetro si tenés.',
    pasos: ['Buscá la perilla de temperatura de la heladera.', 'Ponela en un punto medio (no en el máximo).', 'Si tenés termómetro, verificá que adentro esté entre 4 y 5 °C.'],
    ef: elec(2), fuente: 'gcba-energia', tags: ['heladera'],
  }),
  c('com-feria-trueque', 'Sumate a una feria de trueque', {
    dom: 'comunidad', e: 'easy', i: 'medium', min: 90, formato: 'social', edad: 'kta', adulto: true, cool: 720,
    corto: 'Cambiar lo que te sobra por lo que te falta, sin plata de por medio.',
    desc: 'Las ferias de trueque e intercambio tienen historia en la Argentina. Llevás lo que no usás (libros, ropa, plantas, objetos, comida casera) y te llevás algo que necesitás. Es consumo sin fabricar nada nuevo, y barrio.',
    pasos: ['Buscá una feria de trueque o intercambio en tu ciudad.', 'Llevá cosas en buen estado que ya no uses.', 'Cambiá por algo que vayas a usar.'],
    ef: { r: 0.5, c: 1 }, tags: ['intercambio', 'barrio', 'trueque'],
  }),
  c('res-panales-de-tela', 'Probá pañales de tela', {
    dom: 'residuos', e: 'medium', i: 'high', min: 30, req: ['chicos'], edad: 'a', frec: 'one_time', ahorra: true,
    corto: 'Un bebé usa miles de pañales descartables antes de dejarlos.',
    desc: 'Los pañales descartables son una parte grande de la basura de una casa con bebés y tardan siglos en degradarse. Los de tela modernos (con broches y absorbentes) se lavan y duran hasta para hermanos. Combinarlos, aunque sea en casa, ya baja mucho la basura.',
    pasos: ['Informate sobre los pañales de tela modernos.', 'Probá con algunos para usar en casa.', 'Lavalos en frío, con carga completa.'],
    ef: plastico(1.5), tags: ['bebes', 'plastico', 'familia'],
  }),
  c('teen-dato-verificado', 'Compartí en tus redes un dato ambiental verificado', {
    dom: 'comunidad', e: 'easy', i: 'medium', min: 10, formato: 'social', edad: 'ta', lugar: 'celular', cool: 168,
    corto: 'En temas ambientales circula mucha desinformación: un dato bien chequeado vale oro.',
    desc: 'Antes de compartir algo sobre el clima o el ambiente, chequeá de dónde sale (un organismo público, una universidad, un medio que cite fuentes). Compartir un dato verificado y útil, con su fuente, ayuda más que diez cadenas alarmistas.',
    pasos: ['Elegí un dato ambiental que te haya sorprendido.', 'Buscá la fuente original y chequeá que sea seria.', 'Compartilo con la fuente.'],
    ef: nada(), fuente: 'chequeado', tags: ['redes', 'compartir', 'informacion'],
  }),
];
