import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// CONSUMO 1 — Lo que hay detrás de lo que comprás.
// La base de la rama: el ciclo de vida de los productos, la huella
// ecológica y el día del sobregiro, la ropa y la moda rápida, los aparatos
// cuya huella está en la fabricación, y cómo comprar menos y mejor. Retoma
// elegir por impacto (tronco-3) y la jerarquía de residuos (residuos-2 si ya
// la hiciste).

export default unidad({
  slug: 'consumo-1',
  rama: 'consumo',
  orden: 1,
  nivel: 1,
  requiereTronco: 1,
  titulo: 'Lo que hay detrás de lo que comprás',
  bajada: 'Cada cosa que comprás tiene una historia antes de llegar a tus manos y otra después. Cómo leerla, y por qué la mejor compra a veces es la que no se hace.',
  objetivos: [
    'Describir las etapas del ciclo de vida de un producto',
    'Interpretar la huella ecológica y el día del sobregiro de la Tierra',
    'Explicar los impactos de la moda rápida',
    'Reconocer que en muchos aparatos la mayor huella está en la fabricación',
    'Aplicar criterios para comprar menos y mejor, como el costo por uso',
  ],
  repasa: ['tronco-3', 'tronco-1'],
  fuentes: ['global-footprint', 'emf-textiles', 'unep-moda', 'ewaste-monitor', 'ellen-macarthur'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('La vida de un producto', 'Extracción, fabricación, transporte, uso y descarte: las cinco etapas de todo lo que compramos.', [
      teoria('De la mina al tacho', [
        'Todo producto tiene un ciclo de vida: se extraen materias primas (minerales, petróleo, madera, algodón), se fabrican materiales y piezas, se arma el producto, se transporta y se vende, se usa durante un tiempo y, al final, se descarta, se recicla o se reutiliza.',
        'En cada etapa se usan energía, agua y materiales, y se generan emisiones y residuos. El análisis de ciclo de vida, que viste en la rama de Alimentación, suma todo eso.',
      ]),
      ord('Ordená las etapas del ciclo de vida de una remera de algodón.', [ // e1
        'Se cultiva el algodón',
        'Se hila y se teje la tela',
        'Se tiñe y se cose la remera',
        'Se transporta y se vende',
        'Se usa y se lava muchas veces',
        'Se descarta o se reutiliza',
      ], 'Seis etapas. En cada una se puede reducir el impacto.', { d: 1, extremos: ['Primero', 'Último'] }),
      teoria('Dónde está el impacto', [
        'No todos los productos tienen el impacto en el mismo lugar. En un celular, la mayor parte de la huella está en la fabricación. En una heladera o un auto a nafta, en el uso, porque consumen energía durante años. En la comida, en la producción en el campo. En muchas prendas, en la fabricación de la tela y en los lavados.',
        'Saber dónde está el impacto de cada producto dice dónde conviene actuar: comprar menos y hacerlo durar, o usarlo con eficiencia.',
      ]),
      clas('¿Dónde está la mayor parte del impacto de cada producto?', { // e2
        'En la fabricación': ['Celular', 'Notebook', 'Muebles de madera'],
        'En el uso': ['Heladera', 'Auto a nafta', 'Aire acondicionado'],
      }, 'Para los primeros, la clave es hacerlos durar. Para los segundos, elegir eficientes y usarlos bien.', { d: 2 }),
      op('En un celular, la mayor parte de la huella de carbono está en la fabricación. ¿Qué conviene para reducirla?', [ // e3
        'Usarlo más años antes de cambiarlo',
        'Cargarlo menos veces por semana',
        ['Bajar el brillo de la pantalla', 'Ahorra un poco de energía, pero el uso es una parte chica de su huella.'],
        'Comprar uno nuevo cada año, más eficiente',
      ], 'Si la huella está en la fabricación, cada año más de uso reparte ese impacto y evita fabricar otro.', { d: 2 }),
      cad('Armá la cadena de por qué usar un celular cuatro años en vez de dos reduce su huella anual.', [ // e4
        'La fabricación concentra la mayor parte de la huella',
        'Esa huella se reparte entre los años de uso',
        'Con cuatro años, cada año carga con la mitad que con dos',
        'Además, se evita fabricar un celular nuevo',
      ], ['Usarlo más años aumenta la huella de su fabricación'], 'Alargar la vida útil es la palanca más grande para los productos cuya huella está en la fabricación.', { d: 2 }),
      numv(3, (i) => { // e5
        const h = [60, 80, 50][i];
        const a1 = [2, 2, 3][i];
        const a2 = [4, 5, 6][i];
        return {
          enunciado: `Fabricar un celular emite ${h} kg de CO₂e. ¿Cuántos kg por año "le toca" a cada año de uso si se usa ${a2} años en vez de ${a1}? (Dividí la fabricación por los años)`,
          valor: h / a2,
          unidad: 'kg CO₂e por año',
          dec: 1,
          explicacion: `${h} ÷ ${a2} = ${(h / a2).toLocaleString('es-AR')} kg por año, contra ${(h / a1).toLocaleString('es-AR')} si se usara ${a1} años.`,
        };
      }, { d: 2 }),
      vf('Todos los productos tienen la mayor parte de su impacto en el transporte.', false, 'Depende del producto: en muchos está en la fabricación o en el uso. El transporte suele ser una parte chica, salvo excepciones como el transporte aéreo.', { // e6
        razones: ['+Porque en muchos productos pesa más la fabricación o el uso', '-Porque los productos no se transportan', '-Porque el transporte no tiene ningún impacto'],
        d: 2,
      }),
      par('Uní cada etapa del ciclo de vida con un impacto típico.', [ // e7
        ['Extracción', 'Minas, desmontes y uso de agua'],
        ['Fabricación', 'Energía de fábricas y químicos'],
        ['Uso', 'Energía y agua mientras se usa'],
        ['Descarte', 'Residuos en rellenos o basurales'],
      ], 'Cada etapa tiene sus impactos. Mirar solo una puede engañar.', { d: 2 }),
      mult('¿Qué acciones reducen el impacto de un producto a lo largo de su ciclo de vida? Marcá todas.', [ // e8
        '+Elegir uno que dure más',
        '+Repararlo cuando se rompe',
        '+Usarlo con eficiencia',
        '+Darle una segunda vida cuando ya no lo necesitás',
        '-Cambiarlo apenas sale un modelo nuevo',
      ], 'Durar, reparar, usar bien y pasar a otro: cuatro formas de estirar el ciclo de vida.', { d: 1 }),
      det('Leé esta publicidad y marcá lo engañoso.', [ // e9
        ['Nuestro celular dura años con actualizaciones.', false],
        ['Cambiá tu celular cada año: el modelo nuevo es más eficiente y ayuda al planeta.', true, 'La mayor parte de la huella está en fabricar el nuevo: cambiarlo seguido aumenta el impacto.'],
        ['Tiene repuestos disponibles.', false],
        ['Como consume poca batería, su impacto ambiental es casi nulo.', true, 'La fabricación concentra la mayor parte de su huella, no el uso.'],
      ], 'Saber dónde está el impacto desarma muchas publicidades.', { d: 3 }),
      comp('Completá.', 'Todo producto tiene un [ciclo] de vida; en un celular la mayor parte de la huella está en la [fabricación] y en una heladera, en el [uso].', ['precio', 'venta', 'envase'], 'Tres ideas para leer cualquier producto.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('La huella ecológica', 'Cuántos planetas harían falta si todos viviéramos igual, y qué es el día del sobregiro de la Tierra.', [
      teoria('Una cuenta de superficie', [
        'La huella ecológica mide cuánta superficie de tierra y mar productiva hace falta para producir lo que consume una persona, un país o toda la humanidad, y para absorber sus emisiones de CO₂. Se compara con la biocapacidad: lo que la naturaleza puede regenerar en un año.',
        'Según la Global Footprint Network, la humanidad usa hoy los recursos que regenerarían alrededor de 1,7 planetas Tierra. Como tenemos uno solo, estamos gastando el "capital" natural: talando más de lo que crece, pescando más de lo que se repone y acumulando CO₂.',
      ], { destacado: { valor: '≈ 1,7', texto: 'planetas Tierra haría falta para regenerar lo que la humanidad usa hoy, según la Global Footprint Network.' } }),
      op('¿Qué significa que la humanidad usa "1,7 planetas"?', [ // e1
        'Que usamos más de lo que la Tierra regenera por año',
        'Que existen 1,7 planetas habitables disponibles',
        ['Que la población mundial se multiplicó por 1,7', 'No es población: es consumo comparado con lo que la naturaleza regenera.'],
        'Que la Tierra creció un 70 % en tamaño',
      ], 'Es como gastar más de lo que se cobra: se va comiendo el ahorro.', { d: 2 }),
      teoria('El día del sobregiro', [
        'El día del sobregiro de la Tierra marca la fecha del año en la que la humanidad ya usó todo lo que la naturaleza puede regenerar en ese año. En los últimos años cayó a fines de julio o principios de agosto: desde ahí hasta diciembre, vivimos "a crédito".',
        'Cada país tiene su propia fecha, según su consumo. Los países con mayor consumo por persona agotan su parte mucho antes.',
      ]),
      numv(3, (i) => { // e2
        const p = [1.7, 2, 1.5][i];
        return {
          enunciado: `Si la humanidad usa ${p.toLocaleString('es-AR')} planetas, ¿en qué día del año (del 1 al 365) se agotaría lo que la Tierra regenera? Dividí 365 por ${p.toLocaleString('es-AR')} y redondeá al entero.`,
          valor: Math.round(365 / p),
          unidad: 'día del año',
          tol: 1,
          explicacion: `365 ÷ ${p.toLocaleString('es-AR')} ≈ ${Math.round(365 / p)}. ${Math.round(365 / p) > 200 ? 'Cae a fines de julio o principios de agosto.' : 'Cuanto más planetas usamos, más temprano llega el sobregiro.'}`,
        };
      }, { d: 3 }),
      cad('Armá la cadena de qué pasa cuando se usa más de lo que la naturaleza regenera.', [ // e3
        'Se pesca más de lo que los peces se reproducen',
        'La población de peces baja año a año',
        'Cada año hay menos para pescar',
        'La pesquería puede colapsar',
      ], ['Los peces se reproducen más rápido cuanto más se pesca'], 'Es la lógica de lo renovable que se agota del tronco: hasta lo que se renueva se termina si se usa más rápido.', { d: 2 }),
      vf('La huella ecológica mide solo las emisiones de CO₂.', false, 'Mide la superficie necesaria para producir alimentos, madera, fibras y pescado, para las construcciones y para absorber el CO₂. El carbono es una parte grande, pero no la única.', { // e4
        razones: ['+Porque incluye cultivos, pasturas, bosques, pesca, construcciones y CO₂', '-Porque solo cuenta los árboles de las ciudades', '-Porque mide la cantidad de basura en kilos'],
        d: 2,
      }),
      par('Uní cada componente de la huella ecológica con lo que representa.', [ // e5
        ['Cultivos', 'Tierra para producir alimentos y fibras'],
        ['Pasturas', 'Tierra para el ganado'],
        ['Zonas de pesca', 'Mar para producir pescado'],
        ['Carbono', 'Bosque necesario para absorber el CO₂'],
      ], 'Una sola unidad —superficie— para sumar consumos muy distintos.', { d: 2 }),
      teoria('Desigual', [
        'La huella no es igual para todos. Una persona promedio en un país de altos ingresos tiene una huella varias veces mayor que una persona promedio en un país de bajos ingresos. Y dentro de cada país, las personas con más ingresos suelen tener huellas mucho más grandes.',
        'Por eso reducir la huella no significa lo mismo para todos: para algunos implica consumir menos; para otros, acceder a lo básico con menor impacto.',
      ]),
      clas('¿Esta decisión suele tener mucho o poco efecto sobre la huella de una persona?', { // e6
        'Mucho efecto': ['Cuántos vuelos hace por año', 'Cuánta carne vacuna come', 'Qué tamaño de casa calefacciona'],
        'Poco efecto': ['El color del cepillo de dientes', 'Si usa sorbete una vez por mes', 'La marca de la birome'],
      }, 'Los grandes consumos pesan más que los detalles. Es elegir por impacto, como en el tronco.', { d: 2 }),
      mult('¿Qué hace que un país agote su parte de la biocapacidad más temprano en el año? Marcá todo.', [ // e7
        '+Alto consumo de energía fósil por persona',
        '+Mucho consumo de carne',
        '+Muchos vuelos y autos por persona',
        '+Mucho consumo de bienes nuevos',
        '-Tener muchos parques nacionales',
      ], 'El día del sobregiro de cada país depende de cuánto consume por persona.', { d: 2 }),
      est('Estimá cuántos planetas Tierra harían falta para regenerar lo que usa hoy la humanidad.', 1.7, { min: 0.5, max: 5, paso: 0.1, unidad: 'planetas' }, 'Alrededor de 1,7 según la Global Footprint Network. Con un solo planeta, la diferencia se paga agotando bosques, peces y suelos, y acumulando CO₂.', { d: 2 }),
      op('Si un país llega a su día del sobregiro en marzo, ¿qué indica?', [
        'Que su consumo por persona es muy alto',
        'Que tiene muy pocos habitantes y mucha tierra',
        ['Que sus habitantes reciclan mucho más que el resto', 'El reciclaje ayuda poco a la huella: lo que pesa es cuánto se consume, sobre todo energía.'],
        'Que su año empieza en otra fecha',
      ], 'Cuanto antes llega la fecha, más planetas harían falta si todo el mundo consumiera como en ese país.', { d: 2 }),
      det('Leé este titular y marcá lo equivocado.', [ // e8
        ['La humanidad usa más de lo que la Tierra regenera en un año.', false],
        ['El día del sobregiro es el día en que se termina el petróleo.', true, 'Es el día en que se agota lo que la naturaleza regenera en el año, no el petróleo.'],
        ['Cada país tiene su propia fecha de sobregiro.', false],
        ['Todas las personas del mundo tienen la misma huella.', true, 'Hay enormes diferencias entre países y dentro de cada país.'],
      ], 'Una idea potente, que conviene contar con precisión.', { d: 2 }),
      comp('Completá.', 'La humanidad usa alrededor de [1,7] planetas; el día del [sobregiro] marca cuándo se agota lo que la Tierra regenera en el año.', ['0,5', 'reciclaje'], 'Las dos ideas centrales de la huella ecológica.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('La ropa que usamos', 'Moda rápida, agua, microfibras y prendas que se tiran: el costo escondido del placard.', [
      teoria('Moda rápida', [
        'La moda rápida es un modelo de negocio que lanza colecciones nuevas muy seguido, con precios bajos, para que se compre más y se use menos. Según la Fundación Ellen MacArthur, en quince años la producción de ropa se duplicó y la cantidad de veces que se usa cada prenda bajó más de un tercio.',
        'El PNUMA estima que la industria de la moda genera entre el 2 y el 8 % de las emisiones mundiales de gases de efecto invernadero, y usa enormes cantidades de agua.',
      ], { destacado: { valor: '2-8 %', texto: 'de las emisiones mundiales de gases de efecto invernadero vendrían de la industria de la moda, según el PNUMA.' } }),
      cad('Armá la cadena de cómo funciona la moda rápida.', [ // e1
        'Salen colecciones nuevas muy seguido',
        'Las prendas son baratas y siguen la tendencia del momento',
        'Se compra más ropa',
        'Cada prenda se usa pocas veces',
        'Se tira mucha ropa casi nueva',
      ], ['La ropa barata dura más que la cara'], 'Un modelo que multiplica la producción y acorta la vida de cada prenda.', { d: 2 }),
      teoria('Agua, químicos y microfibras', [
        'El algodón necesita mucha agua y, a menudo, muchos pesticidas; hacer una remera puede requerir miles de litros de agua, contando el cultivo. El teñido usa químicos que, sin tratamiento, contaminan ríos. Y las telas sintéticas, como el poliéster, liberan microfibras plásticas en cada lavado, que terminan en ríos y mares.',
        'Al final, gran parte de la ropa termina en rellenos o se quema: la Fundación Ellen MacArthur estimó que se entierra o se quema el equivalente a un camión de basura lleno de textiles por segundo, y que menos del 1 % del material de la ropa se recicla en ropa nueva.',
      ]),
      mult('¿Qué impactos ambientales tiene la ropa? Marcá todos.', [ // e2
        '+Mucha agua para cultivar algodón',
        '+Químicos del teñido en los ríos',
        '+Microfibras plásticas al lavar sintéticos',
        '+Mucha ropa que termina en rellenos',
        '-La ropa no tiene impactos porque es blanda',
      ], 'Del campo al lavarropas y al relleno: impactos en cada etapa.', { d: 1 }),
      est('Estimá qué porcentaje del material de la ropa se recicla en ropa nueva, según la Fundación Ellen MacArthur.', 1, { min: 0.1, max: 100, unidad: '%', escala: 'log' }, 'Menos del 1 %. La mayor parte termina en rellenos o incinerada, o se "infrarrecicla" en trapos y rellenos.', { d: 3 }),
      teoria('El costo por uso', [
        'Una forma útil de pensar la ropa es el costo por uso: el precio dividido la cantidad de veces que se usa. Una campera de $60.000 que se usa 200 veces cuesta $300 por uso; una de $20.000 que se usa 10 veces cuesta $2.000 por uso.',
        'Lo mismo vale para el ambiente: una prenda que se usa muchas veces reparte su huella de fabricación entre muchos usos.',
      ]),
      numv(3, (i) => { // e3
        const precio = [60000, 30000, 45000][i];
        const usos = [200, 50, 150][i];
        return {
          enunciado: `Una prenda cuesta $${precio.toLocaleString('es-AR')} y se usa ${usos} veces. ¿Cuál es su costo por uso?`,
          valor: precio / usos,
          unidad: '$ por uso',
          explicacion: `${precio.toLocaleString('es-AR')} ÷ ${usos} = $${(precio / usos).toLocaleString('es-AR')} por uso. Lo barato que se usa poco puede salir caro.`,
        };
      }, { d: 1 }),
      rank('Ordená estas prendas por costo por uso, de más barato a más caro.', [ // e4
        ['Campera de $60.000 usada 300 veces', '$200 por uso'],
        ['Jean de $40.000 usado 100 veces', '$400 por uso'],
        ['Remera de $10.000 usada 10 veces', '$1.000 por uso'],
        ['Vestido de $30.000 usado 2 veces', '$15.000 por uso'],
      ], 'El precio de etiqueta no dice cuánto cuesta de verdad una prenda. Los usos, sí.', { d: 2, extremos: ['Más barato por uso', 'Más caro por uso'] }),
      clas('¿Esta práctica alarga la vida de la ropa o la acorta?', { // e5
        'La alarga': ['Lavar con agua fría y colgar al aire', 'Coser un botón o un dobladillo', 'Intercambiar ropa con amigos'],
        'La acorta': ['Lavar todo con agua caliente y secarropas', 'Tirar una prenda por una mancha chica', 'Comprar para una sola fiesta'],
      }, 'Cuidar, reparar y hacer circular: la ropa más sustentable es la que ya existe.', { d: 1 }),
      vf('Una prenda de poliéster no libera plástico mientras se usa y se lava.', false, 'En cada lavado libera microfibras plásticas que pueden llegar a ríos y mares. Lavar menos, con carga completa y agua fría, reduce la cantidad.', { // e6
        razones: ['+Porque en cada lavado libera microfibras plásticas', '-Porque el poliéster es de algodón', '-Porque el agua disuelve el plástico por completo'],
        d: 2,
      }),
      op('¿Cuál de estas opciones suele tener menor impacto para renovar el placard?', [ // e7
        'Comprar ropa de segunda mano',
        'Comprar ropa nueva muy barata cada mes',
        ['Comprar ropa nueva con etiqueta "eco" cada temporada', 'Aunque la tela sea mejor, comprar seguido mantiene alta la producción.'],
        'Comprar ropa para cada evento y no repetirla',
      ], 'La segunda mano alarga la vida de prendas que ya existen, sin fabricar nuevas.', { d: 2 }),
      det('Leé esta nota de moda y marcá lo cuestionable.', [ // e8
        ['La industria de la moda tiene un impacto ambiental importante.', false],
        ['Comprar ropa barata seguido no tiene impacto porque es barata.', true, 'El precio bajo no reduce el impacto: más prendas son más recursos y residuos.'],
        ['La ropa de segunda mano alarga la vida de las prendas.', false],
        ['Casi toda la ropa usada se recicla en ropa nueva.', true, 'Menos del 1 % del material de la ropa se recicla en ropa nueva.'],
      ], 'El placard también es una decisión ambiental.', { d: 2 }),
      comp('Completá.', 'El precio dividido la cantidad de usos es el costo por [uso]; las telas sintéticas liberan [microfibras] al lavarse.', ['kilo', 'vitaminas'], 'Dos ideas para mirar el placard de otra forma.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Aparatos y objetos', 'Celulares, notebooks y electrodomésticos: por qué la huella está en fabricarlos y qué es la obsolescencia.', [
      teoria('Materiales de todo el mundo', [
        'Un celular tiene decenas de materiales distintos: aluminio, cobre, oro, plata, cobalto, litio, tierras raras, plásticos y vidrio. Muchos se extraen de minas en distintos países, algunas con fuertes impactos ambientales y sociales. Fabricar los chips y las pantallas usa mucha energía y agua.',
        'Por eso, en muchos aparatos electrónicos, la mayor parte de la huella de carbono —a menudo alrededor del 80 % en celulares— se genera antes de que lleguen a nuestras manos.',
      ], { destacado: { valor: '≈ 80 %', texto: 'de la huella de carbono de un celular suele estar en su fabricación, según los informes de los propios fabricantes.' } }),
      mult('¿Qué materiales puede tener un celular? Marcá todos.', [ // e1
        '+Cobre',
        '+Oro',
        '+Litio',
        '+Cobalto',
        '-Madera de quebracho',
      ], 'Un celular reúne minerales de muchas partes del mundo. Por eso fabricarlo pesa tanto.', { d: 1 }),
      numv(3, (i) => { // e2
        const total = [70, 60, 80][i];
        const pct = [80, 75, 85][i];
        return {
          enunciado: `Un celular tiene una huella total de ${total} kg de CO₂e en toda su vida y el ${pct} % viene de la fabricación. ¿Cuántos kg son de la fabricación?`,
          valor: (total * pct) / 100,
          unidad: 'kg CO₂e',
          dec: 1,
          explicacion: `${total} × ${pct} ÷ 100 = ${((total * pct) / 100).toLocaleString('es-AR')} kg. El uso y la carga son la parte chica.`,
        };
      }, { d: 1 }),
      teoria('Obsolescencia', [
        'Muchos aparatos se reemplazan antes de que dejen de funcionar. A veces por obsolescencia técnica: dejan de recibir actualizaciones o no hay repuestos. A veces por obsolescencia percibida: la publicidad y la moda hacen que un aparato que funciona parezca viejo.',
        'Alargar la vida útil —con fundas, protectores, cambio de batería, reparación— es la forma más efectiva de reducir la huella de la electrónica.',
      ]),
      clas('¿Es obsolescencia técnica o percibida?', { // e3
        'Técnica': ['El celular deja de recibir actualizaciones de seguridad', 'No se consigue la batería de repuesto', 'Una app que necesitás deja de funcionar en tu modelo'],
        'Percibida': ['Salió un modelo con otro color', 'Tus amigos tienen uno más nuevo', 'La publicidad dice que el tuyo ya es viejo'],
      }, 'La técnica se combate con repuestos, reparación y actualizaciones. La percibida, con mirar la necesidad real.', { d: 2 }),
      cad('Armá la cadena de por qué cambiar la batería de un celular tiene tanto efecto.', [ // e4
        'La batería se gasta después de un par de años',
        'Se cambia la batería en lugar del celular',
        'El celular funciona bien dos o tres años más',
        'Se evita fabricar un celular nuevo',
        'Se ahorra la mayor parte de la huella de un aparato nuevo',
      ], ['Cambiar la batería duplica la huella del celular'], 'Una pieza barata que evita fabricar un aparato entero.', { d: 2 }),
      vf('Si un aparato viejo funciona bien, reemplazarlo por uno nuevo más eficiente siempre reduce el impacto.', false, 'Depende de dónde está la huella. Para un celular, fabricar uno nuevo pesa más que lo que ahorra en uso. Para una heladera muy vieja e ineficiente, cambiarla puede convenir, porque su impacto está en el uso.', { // e5
        razones: ['+Porque depende de si la huella está en la fabricación o en el uso', '-Porque los aparatos nuevos no tienen huella de fabricación', '-Porque los aparatos viejos no consumen energía'],
        d: 3,
      }),
      par('Uní cada aparato con la mejor estrategia para reducir su impacto.', [ // e6
        ['Celular', 'Usarlo más años y repararlo'],
        ['Heladera de 25 años muy ineficiente', 'Evaluar reemplazarla por una eficiente'],
        ['Notebook lenta', 'Ampliar memoria o cambiar el disco'],
        ['Lavarropas con una pieza rota', 'Cambiar la pieza'],
      ], 'Para cada aparato, la estrategia depende de dónde está su impacto.', { d: 3 }),
      mult('¿Qué alarga la vida de un celular? Marcá todo.', [ // e7
        '+Funda y protector de pantalla',
        '+Cambiar la batería cuando se gasta',
        '+Mantenerlo actualizado',
        '+Repararlo en un servicio técnico',
        '-Cambiarlo cada vez que sale un modelo nuevo',
      ], 'Proteger, mantener y reparar: la vida útil se decide en el día a día.', { d: 1 }),
      op('Tu notebook de cinco años anda lenta. ¿Qué conviene evaluar primero?', [ // e8
        'Ampliar la memoria o cambiar el disco',
        'Comprar una nueva de inmediato',
        ['Tirarla porque ya es vieja', 'Tirarla es la peor opción: pierde todo el valor y puede contaminar.'],
        'Comprar una segunda para usar las dos',
      ], 'Muchas veces una mejora barata le da años más de vida.', { d: 2 }),
      det('Leé este consejo de un foro y marcá lo equivocado.', [ // e9
        ['La mayor parte de la huella de un celular está en su fabricación.', false],
        ['Por eso, lo mejor para el ambiente es cambiarlo todos los años.', true, 'Al revés: conviene usarlo más años para no fabricar otro.'],
        ['Cambiar la batería puede alargarle la vida varios años.', false],
        ['Un aparato que funciona bien nunca conviene repararlo.', true, 'Si se rompe una pieza, repararlo suele ser mejor que reemplazarlo.'],
      ], 'Saber dónde está la huella ordena las decisiones.', { d: 2 }),
      comp('Completá.', 'Cuando un aparato funciona pero parece viejo por la moda, es obsolescencia [percibida]; cuando no hay repuestos, es obsolescencia [técnica].', ['térmica', 'química'], 'Los dos tipos de obsolescencia, en una línea.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Comprar menos y mejor', 'Necesidad o deseo, durabilidad, segunda mano, alquilar y compartir: herramientas para decidir antes de comprar.', [
      teoria('Antes de comprar', [
        'La compra con menor impacto suele ser la que no se hace. Antes de comprar algo nuevo, conviene hacerse algunas preguntas: ¿lo necesito o lo quiero por un impulso?, ¿tengo algo que cumpla la misma función?, ¿lo puedo pedir prestado, alquilar o comprar usado?, ¿cuánto lo voy a usar?, ¿cuánto va a durar?',
        'Esperar unos días antes de una compra no urgente ayuda a separar la necesidad del impulso.',
      ]),
      ord('Ordená estas preguntas en el orden en que conviene hacerlas antes de comprar algo.', [ // e1
        '¿Lo necesito de verdad?',
        '¿Tengo algo que cumpla la misma función?',
        '¿Lo puedo pedir prestado, alquilar o comprar usado?',
        'Si lo compro nuevo, ¿cuál dura más y se puede reparar?',
      ], 'La escalera de la jerarquía de residuos, aplicada a las compras: primero evitar, después reutilizar, y solo al final comprar nuevo y bueno.', { d: 2, extremos: ['Primero', 'Último'] }),
      teoria('Usar sin tener', [
        'Muchas cosas se usan muy poco: una taladradora se usa, en promedio, unos pocos minutos en toda su vida en una casa; un traje de fiesta, un par de veces al año. Para esas cosas, pedir prestado, alquilar o compartir entre vecinos permite usarlas sin fabricar una por casa.',
        'Hay bibliotecas de herramientas, grupos de intercambio y alquiler de ropa de fiesta que funcionan con esta lógica.',
      ]),
      clas('¿Conviene tenerlo propio o conviene pedirlo, alquilarlo o compartirlo?', { // e2
        'Conviene propio': ['Zapatillas que usás todos los días', 'Una mochila para la escuela', 'La heladera de casa'],
        'Conviene pedir o compartir': ['Una escalera larga para una vez al año', 'Un traje para un casamiento', 'Una carpa para un solo campamento'],
      }, 'Lo que se usa todos los días conviene tenerlo. Lo que se usa poco, compartirlo.', { d: 1 }),
      numv(3, (i) => { // e3
        const casas = [20, 40, 10][i];
        return {
          enunciado: `En un edificio de ${casas} departamentos, cada uno compró una taladradora que usa pocas veces por año. Si compartieran 2 entre todos, ¿cuántas taladradoras menos harían falta?`,
          valor: casas - 2,
          unidad: 'taladradoras',
          explicacion: `${casas} − 2 = ${casas - 2} taladradoras menos fabricadas, con sus materiales, energía y residuos.`,
        };
      }, { d: 1 }),
      teoria('Segunda mano', [
        'Comprar usado alarga la vida de las cosas y evita fabricar nuevas. Muebles, ropa, libros, bicicletas, electrodomésticos y electrónica reacondicionada son opciones con mucho menor impacto y, muchas veces, menor precio.',
        'Vender o donar lo que ya no se usa completa el círculo: otra persona lo aprovecha en lugar de comprarlo nuevo.',
      ]),
      mult('¿Qué ventajas tiene comprar de segunda mano? Marcá todas.', [ // e4
        '+Evita fabricar un producto nuevo',
        '+Suele ser más barato',
        '+Alarga la vida útil de las cosas',
        '+Reduce residuos',
        '-Garantiza que el producto dure para siempre',
      ], 'Muchas ventajas; conviene revisar bien el estado de lo que se compra.', { d: 1 }),
      cad('Armá la cadena de cómo el mercado de segunda mano reduce residuos.', [ // e5
        'Alguien deja de usar una bicicleta en buen estado',
        'La vende en lugar de tirarla',
        'Otra persona la compra en lugar de una nueva',
        'Se fabrica una bicicleta menos',
        'Menos materiales, energía y residuos',
      ], ['La bici usada se convierte en dos bicis nuevas'], 'Cada objeto que circula es uno que no se fabrica.', { d: 1 }),
      teoria('Si hay que comprar nuevo', [
        'Cuando hace falta comprar nuevo, conviene elegir productos durables, que se puedan reparar, con repuestos disponibles y con garantía. Lo que dura más suele costar más al principio, pero menos por uso, como viste con la ropa.',
      ]),
      op('Necesitás una licuadora. ¿Cuál es la mejor opción si no conseguís una usada?', [ // e6
        'Una robusta, con repuestos y garantía larga',
        'La más barata, aunque se rompa en meses',
        ['La que tenga más botones y luces', 'Más funciones no significa más durabilidad.'],
        'Dos licuadoras baratas por si una se rompe',
      ], 'Durabilidad y reparabilidad bajan el impacto y el costo por uso.', { d: 2 }),
      vf('Comprar más barato siempre es lo más sustentable.', false, 'Si lo barato se rompe pronto y hay que reemplazarlo, termina generando más residuos y costando más por uso. La durabilidad importa.', { // e7
        razones: ['+Porque lo que dura poco se reemplaza más y genera más residuos', '-Porque lo barato no genera residuos', '-Porque lo caro siempre es sustentable'],
        d: 2,
      }),
      det('Leé esta lista de propósitos y marcá lo que no ayuda a consumir mejor.', [ // e8
        ['Esperar una semana antes de las compras no urgentes.', false],
        ['Aprovechar todas las ofertas aunque no necesite lo que compro.', true, 'Comprar lo que no se necesita genera impacto y gasto, aunque esté en oferta.'],
        ['Buscar primero en el mercado de usados.', false],
        ['Comprar un celular nuevo cada año para tener el último.', true, 'Aumenta mucho la huella: la mayor parte está en fabricar uno nuevo.'],
      ], 'Consumir mejor es, sobre todo, consumir con intención.', { d: 2 }),
      comp('Completá.', 'La compra con menor impacto suele ser la que no se [hace]; para lo que se usa poco conviene [compartir]; y si hay que comprar nuevo, elegir algo [durable].', ['paga', 'guardar', 'barato'], 'Tres criterios para comprar menos y mejor.', { d: 1 }),
      rank('Ordená estas formas de conseguir una bicicleta de menor a mayor impacto.', [ // e10
        ['Arreglar la bici vieja que ya tenés', 'menor impacto'],
        ['Pedir prestada la de un familiar que no la usa', 'muy bajo'],
        ['Comprar una usada', 'bajo'],
        ['Comprar una nueva', 'mayor impacto'],
      ], 'La jerarquía de siempre: lo que ya existe, primero.', { d: 2, extremos: ['Menor impacto', 'Mayor impacto'] }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: lo que hay detrás de lo que comprás', 'Ciclo de vida, huella ecológica, ropa, aparatos y compras, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: la mudanza de Valentina', 'Valentina se muda sola por primera vez y tiene una lista de compras. Ayudala a decidir con criterio.', [
      teoria('La lista', [
        'Valentina tiene una lista para su nuevo departamento: heladera, cama, mesa y sillas, una taladradora para colgar cuadros, un juego de ollas, una notebook nueva (la suya tiene cuatro años y anda lenta), ropa de cama y un vestido para el casamiento de una amiga.',
        'Tiene un presupuesto limitado. Su tía le ofrece una mesa y sillas que no usa, y en su edificio hay un grupo de vecinos que se prestan herramientas.',
      ]),
      clas('Clasificá cada cosa de la lista según la mejor forma de conseguirla.', { // e1
        'Pedir prestado o aceptar lo que ofrecen': ['Mesa y sillas de la tía', 'Taladradora del grupo de vecinos'],
        'Alquilar o conseguir usado': ['Vestido para el casamiento', 'Juego de ollas'],
        'Comprar nuevo y eficiente': ['Heladera'],
      }, 'Cada cosa tiene su mejor opción. La heladera nueva y eficiente se justifica porque su impacto está en el uso durante muchos años.', { d: 3 }),
      op('¿Qué conviene con la notebook de cuatro años que anda lenta?', [ // e2
        'Probar ampliar la memoria o cambiar el disco',
        'Comprar una nueva sin revisar la vieja',
        ['Tirarla con la basura común', 'Además de desperdiciarla, los electrónicos no van con la basura común.'],
        'Comprar dos nuevas por si una falla',
      ], 'Una mejora barata puede darle años más de vida y evitar la huella de fabricar otra.', { d: 2 }),
      numv(3, (i) => { // e3
        const h1 = [300, 250, 350][i];
        const h2 = [600, 500, 650][i];
        const anos = [12, 10, 14][i];
        return {
          enunciado: `Para la heladera, compara una que consume ${h1} kWh por año con otra de ${h2}. Si la usa ${anos} años, ¿cuántos kWh ahorra con la eficiente?`,
          valor: (h2 - h1) * anos,
          unidad: 'kWh',
          explicacion: `(${h2} − ${h1}) × ${anos} = ${((h2 - h1) * anos).toLocaleString('es-AR')} kWh. En una heladera, el uso pesa mucho: por eso conviene la eficiente.`,
        };
      }, { d: 2 }),
      numv(3, (i) => { // e4
        const compra = [80000, 60000, 100000][i];
        const alquiler = [15000, 12000, 20000][i];
        return {
          enunciado: `Un vestido nuevo cuesta $${compra.toLocaleString('es-AR')} y lo usaría una sola vez. Alquilarlo cuesta $${alquiler.toLocaleString('es-AR')}. ¿Cuánto ahorra alquilando?`,
          valor: compra - alquiler,
          unidad: '$',
          explicacion: `${compra.toLocaleString('es-AR')} − ${alquiler.toLocaleString('es-AR')} = $${(compra - alquiler).toLocaleString('es-AR')}. Y se evita fabricar una prenda que se usaría una vez.`,
        };
      }, { d: 1 }),
      rank('Ordená las decisiones de Valentina por cuánto impacto evitan, de más a menos.', [ // e5
        ['Reparar la notebook en vez de comprar una nueva', 'evita fabricar un aparato electrónico'],
        ['Aceptar la mesa y sillas de la tía', 'evita fabricar muebles'],
        ['Alquilar el vestido', 'evita una prenda de un solo uso'],
        ['Pedir la taladradora prestada', 'evita una herramienta de poco uso'],
      ], 'Todas ayudan. Las que evitan fabricar objetos grandes o con mucha huella de fabricación pesan más.', { d: 4 }),
      det('Valentina escribe su plan. Marcá lo que no conviene.', [ // e6
        ['Acepto la mesa y las sillas de mi tía.', false],
        ['Compro la heladera más barata aunque consuma el doble.', true, 'Su impacto y su costo están en el uso: conviene la eficiente.'],
        ['Pido la taladradora al grupo de vecinos.', false],
        ['Tiro la notebook vieja con la basura y compro otra.', true, 'Conviene intentar mejorarla; y si se descarta, va a un punto de electrónicos.'],
      ], 'Un buen plan combina reutilizar, compartir y comprar bien lo que hace falta.', { d: 3 }),
      mult('¿Qué criterios usó Valentina para decidir bien? Marcá todos.', [ // e7
        '+Preguntarse si lo necesitaba',
        '+Aprovechar lo que ya existe',
        '+Compartir lo que se usa poco',
        '+Comprar eficiente lo que consume energía',
        '-Comprar todo nuevo para estrenar',
      ], 'Los criterios de toda la unidad, aplicados a una mudanza real.', { d: 2 }),
    ]),
  ],
});
