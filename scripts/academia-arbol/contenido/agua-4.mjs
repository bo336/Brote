import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// AGUA 4 — El agua invisible.
// Intermedio. Del agua que sale de la canilla al agua que no se ve: la que hizo
// falta para producir la comida, la ropa y las cosas. Huella hídrica verde,
// azul y gris, comparaciones por kilo con sus trampas, y el agua que viaja
// dentro de las exportaciones. Números: promedios mundiales de la Water
// Footprint Network, presentados siempre como promedios.

const WFN = 'Promedios mundiales aproximados, Water Footprint Network. Cambian mucho según el lugar y el sistema de producción.';

export default unidad({
  slug: 'agua-4',
  rama: 'agua',
  orden: 4,
  nivel: 2,
  requiereTronco: 2,
  titulo: 'El agua invisible',
  bajada: 'Cada alimento, cada remera y cada hoja de papel necesitaron agua para existir. Aprendé a medirla y a leerla sin caer en trampas.',
  objetivos: [
    'Explicar qué es el agua virtual y la huella hídrica de un producto',
    'Distinguir el agua verde, azul y gris, y por qué no pesan igual',
    'Comparar la huella hídrica de alimentos por kilo y entender los límites de esa comparación',
    'Estimar el agua detrás de la ropa y otros objetos, y cómo reducirla',
    'Analizar el comercio de agua virtual entre países',
  ],
  repasa: ['agua-2', 'tronco-2'],
  fuentes: ['water-footprint-network', 'huella-hidrica', 'owid-impactos-alimentos', 'fao', 'un-water'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('El agua que no se ve', 'Detrás de un vaso de leche o de una remera hay cientos o miles de litros de agua que nunca viste.', [
      teoria('Agua escondida en las cosas', [
        'Para que un tomate llegue a tu mesa hizo falta agua: la lluvia y el riego que usó la planta para crecer, y el agua de lavarlo y procesarlo. Esa agua no está en el tomate, pero se usó para producirlo. Se llama agua virtual.',
        'Sumando toda el agua usada a lo largo de la producción de algo se obtiene su huella hídrica. Se mide en litros por kilo, por litro o por unidad de producto.',
      ], { destacado: { valor: 'Agua virtual', texto: 'el agua que se usó para producir algo, aunque no quede dentro del producto.' } }),
      op('¿Qué es la huella hídrica de una remera de algodón?', [
        'Toda el agua usada para producirla, del campo a la tienda',
        'El agua que absorbe la remera cuando se moja',
        ['El agua que usa el lavarropas cada vez que se lava', 'Ese es un uso posterior; la huella de producción es toda el agua usada para fabricarla.'],
        'La cantidad de agua que contiene la tela seca',
      ], 'Incluye el agua para cultivar el algodón, teñir y terminar la tela. La mayor parte está en el campo.', { d: 1 }),
      teoria('Cuánto puede ser', [
        'Los números sorprenden. Según promedios mundiales de la Water Footprint Network, producir una remera de algodón requiere unos 2.500 litros de agua; un kilo de carne vacuna, unos 15.000; un kilo de tomates, unos 200.',
        'Son promedios globales: el mismo producto puede tener una huella muy distinta según dónde y cómo se produjo. Pero sirven para entender órdenes de magnitud.',
      ], {
        datos: barras('Huella hídrica por kilo de producto (promedio mundial)', 'litros por kg', [
          ['Carne vacuna', 15400],
          ['Chocolate', 17200],
          ['Queso', 5000],
          ['Pollo', 4300],
          ['Arroz', 2500],
          ['Pan de trigo', 1600],
          ['Papa', 290],
          ['Tomate', 210],
        ], WFN),
      }),
      rank('Según el gráfico, ordená por huella hídrica por kilo, de mayor a menor.', [
        ['Carne vacuna', '≈ 15.400 L/kg'],
        ['Pollo', '≈ 4.300 L/kg'],
        ['Arroz', '≈ 2.500 L/kg'],
        ['Papa', '≈ 290 L/kg'],
      ], 'Entre la carne vacuna y la papa hay más de 50 veces de diferencia por kilo. Es un orden de magnitud y medio.', { d: 2 }),
      num('Según el gráfico, ¿cuántas veces más agua por kilo necesita la carne vacuna que el pollo? Redondeá a un decimal.', 3.6, 'veces', '15.400 ÷ 4.300 ≈ 3,6. Por kilo, la carne vacuna necesita unas tres veces y media más agua que el pollo.', { d: 2, dec: 1, tol: 0.1 }),
      ejemplo('El agua de un almuerzo', 'Un almuerzo tiene 200 g de carne vacuna y 150 g de papas. ¿Cuánta agua virtual tiene? (15.400 L/kg y 290 L/kg)', [
        'Carne: 0,2 kg × 15.400 L/kg = 3.080 litros.',
        'Papas: 0,15 kg × 290 L/kg = 43,5 litros.',
        'Total: 3.080 + 43,5 ≈ 3.124 litros.',
      ], 'Más de 3.000 litros, casi todos en la carne. Es más que el agua que usa una familia de cuatro en una semana en su casa.'),
      numv(4, (i) => {
        const g = [300, 250, 150, 400][i];
        const [nombre, l] = [['carne vacuna', 15400], ['pollo', 4300], ['queso', 5000], ['arroz', 2500]][i];
        return {
          enunciado: `¿Cuántos litros de agua virtual tienen ${g} gramos de ${nombre}? (Huella: ${l.toLocaleString('es-AR')} litros por kilo.)`,
          valor: (g / 1000) * l,
          unidad: 'litros',
          explicacion: `${g} g son ${(g / 1000).toLocaleString('es-AR')} kg. × ${l.toLocaleString('es-AR')} L/kg = ${((g / 1000) * l).toLocaleString('es-AR')} litros. Primero a kilos, después la multiplicación.`,
        };
      }, { d: 2 }),
      vf('Un kilo de carne vacuna contiene unos 15.000 litros de agua adentro.', false, 'El kilo de carne tiene poca agua adentro. Los 15.000 litros son el agua usada para producirlo, sobre todo para cultivar el alimento del animal: es agua virtual.', {
        razones: ['+Porque es agua usada para producirla, no agua que quede adentro', '-Porque la carne pesa 15.000 kilos por litro', '-Porque la vaca toma 15.000 litros por día'],
        d: 2,
      }),
      par('Uní cada producto con su huella hídrica aproximada (promedio mundial).', [
        ['Una remera de algodón', '≈ 2.500 litros'],
        ['Un kilo de carne vacuna', '≈ 15.400 litros'],
        ['Un kilo de tomates', '≈ 210 litros'],
        ['Una taza de café', '≈ 130 litros'],
      ], 'Números para tener de referencia. No hace falta memorizarlos exactos: alcanza con los órdenes de magnitud.', { d: 3 }),
      comp('Completá.', 'El agua usada para producir algo, aunque no quede dentro del producto, se llama agua [virtual], y la suma a lo largo de toda la producción es su huella [hídrica].', ['potable', 'de carbono', 'salada'], 'Dos conceptos distintos pero pegados: el agua virtual es la idea, la huella hídrica es la medida.', { d: 1 }),
      est('Estimá la huella hídrica de un kilo de chocolate (promedio mundial).', 17200, { min: 100, max: 50000, unidad: 'litros', escala: 'log' }, 'Unos 17.000 litros por kilo, en su mayoría para cultivar el cacao. Es de los productos con mayor huella por kilo.', { d: 3 }),
      clas('¿Cuáles de estos usos de agua forman parte de la huella hídrica de un pan?', {
        'Forma parte': ['La lluvia que usó el trigo para crecer', 'El agua de riego del campo, si lo regaron', 'El agua de la masa y de limpiar la panadería'],
        'No forma parte': ['El agua que tomás después de comer el pan', 'El agua de lavar el plato donde lo comiste'],
      }, 'La huella de producción suma todo lo usado hasta que el producto está listo. Lo que pasa después, en tu casa, es otro consumo.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Verde, azul y gris', 'No toda el agua de una huella es igual: la de lluvia, la de riego y la necesaria para diluir contaminación.', [
      teoria('Tres colores de agua', [
        'La huella hídrica se divide en tres partes. El agua verde es la lluvia que queda en el suelo y usan las plantas: no se saca de ningún río ni napa. El agua azul es la que se saca de ríos, lagos o acuíferos, por ejemplo para riego o para una fábrica.',
        'El agua gris es la cantidad de agua limpia que haría falta para diluir la contaminación que genera la producción (fertilizantes, efluentes) hasta niveles aceptables. No es agua que se use, sino agua que se "ensucia" en términos de capacidad del ambiente.',
      ], { lista: ['Verde: lluvia que usan los cultivos', 'Azul: agua sacada de ríos, lagos o napas', 'Gris: agua necesaria para diluir la contaminación'] }),
      clas('¿De qué color es cada uso de agua?', {
        'Verde': ['La lluvia que riega un campo de trigo', 'El agua del suelo que usa una pastura'],
        'Azul': ['El riego por canales de un viñedo en Mendoza', 'El agua que bombea una fábrica de una napa'],
        'Gris': ['El agua necesaria para diluir el fertilizante que escurre a un arroyo', 'El agua para diluir los efluentes de una curtiembre'],
      }, 'La pregunta clave: ¿viene de la lluvia en el suelo, se saca de un río o napa, o es la capacidad de dilución que se consume?', { d: 2 }),
      teoria('Por qué el color importa', [
        'No es lo mismo usar lluvia que de todos modos iba a caer en ese campo que sacar agua de un río en una zona seca. El agua azul compite con otros usos: tomar, regar otros cultivos, mantener vivo el río. Por eso, en zonas áridas, la huella azul es la que más preocupa.',
        'Por ejemplo, la mayor parte de la huella de la carne de pastoreo es agua verde: la lluvia que hizo crecer el pasto. Una fruta regada en una zona seca puede tener una huella total menor pero una huella azul mucho más sensible.',
      ]),
      op('En una región seca donde el río es la principal fuente de agua, ¿qué parte de la huella hídrica de un cultivo preocupa más?', [
        'El agua azul, porque sale del río que todos usan',
        'El agua verde, porque es la lluvia',
        ['El agua gris, porque siempre es la más grande', 'El agua gris importa por la contaminación, pero en una zona seca la extracción del río es lo más crítico.'],
        'Ninguna, todas las aguas son iguales',
      ], 'El agua azul compite directamente con el consumo humano y con el caudal que necesita el río. En zonas secas es la más crítica.', { d: 2 }),
      vf('Dos productos con la misma huella hídrica total tienen siempre el mismo impacto sobre los ríos.', false, 'Depende de la composición. Si uno es casi todo agua verde (lluvia) y el otro casi todo azul (riego de un río en zona seca), el segundo presiona mucho más sobre los ríos.', {
        razones: ['+Porque importa cuánto es verde, azul o gris y dónde se usa', '-Porque la huella total dice todo lo necesario', '-Porque el agua verde sale de los ríos'],
        d: 3,
      }),
      teoria('El agua gris, con cuidado', [
        'El agua gris es un concepto, no un volumen que alguien usó. Traduce la contaminación a litros: "haría falta tanta agua limpia para diluir esto". Sirve para comparar, pero no quiere decir que diluir sea la solución.',
        'Como viste en la unidad anterior, diluir no elimina contaminantes persistentes. Bajar el agua gris es contaminar menos: usar la dosis justa de fertilizante, tratar los efluentes.',
      ]),
      numv(3, (i) => {
        const tot = [1000, 2000, 1500][i];
        const v = [800, 1500, 900][i];
        const a = [120, 300, 450][i];
        return {
          enunciado: `Un cultivo tiene una huella de ${tot.toLocaleString('es-AR')} litros por kilo: ${v} verdes y ${a} azules. ¿Cuántos litros son grises?`,
          valor: tot - v - a,
          unidad: 'litros por kg',
          explicacion: `La huella total es la suma de las tres: ${tot.toLocaleString('es-AR')} − ${v} − ${a} = ${tot - v - a} litros grises por kilo.`,
        };
      }, { d: 2 }),
      numv(3, (i) => {
        const tot = [15400, 4300, 2500][i];
        const pv = [94, 82, 68][i];
        const n = ['la carne vacuna', 'el pollo', 'el arroz'][i];
        return {
          enunciado: `Si el ${pv} % de la huella de ${n} (${tot.toLocaleString('es-AR')} L/kg) es agua verde, ¿cuántos litros por kilo son verdes? Redondeá a entero.`,
          valor: Math.round((tot * pv) / 100),
          unidad: 'litros por kg',
          tol: 2,
          explicacion: `${pv} % de ${tot.toLocaleString('es-AR')} = ${tot.toLocaleString('es-AR')} × ${pv} ÷ 100 ≈ ${Math.round((tot * pv) / 100).toLocaleString('es-AR')} litros verdes por kilo.`,
        };
      }, { d: 3 }),
      par('Uní cada color con una forma de reducirlo.', [
        ['Agua azul', 'Riego por goteo en lugar de por inundación'],
        ['Agua gris', 'Usar la dosis justa de fertilizante'],
        ['Agua verde', 'Cultivos adaptados a la lluvia del lugar'],
      ], 'Cada color se reduce de forma distinta: eficiencia de riego, menos contaminación, o elegir qué producir dónde.', { d: 3 }),
      det('Leé este titular y marcá lo engañoso.', [
        ['"La carne vacuna necesita unos 15.000 litros de agua por kilo,', false],
        ['y por eso cada kilo seca un río entero"', true, 'La mayor parte es agua verde (lluvia en pasturas), no agua sacada de ríos.'],
        ['según promedios de la Water Footprint Network.', false],
        ['Esa cifra es igual en todos los campos del mundo."', true, 'Es un promedio: varía mucho según el lugar y el sistema de producción.'],
      ], 'La huella total es real, pero sin separar colores y sin aclarar que es un promedio, se usa para asustar en vez de explicar.', { d: 4 }),
      comp('Completá.', 'El agua [verde] es lluvia que usan los cultivos, la [azul] se saca de ríos o napas, y la [gris] mide la contaminación en litros.', ['potable', 'salada', 'caliente'], 'Tres colores, tres preguntas distintas sobre el mismo producto.', { d: 2 }),
      op('Un viñedo en una zona muy seca riega todo con agua de un río que viene bajando año a año. ¿Qué parte de su huella conviene reducir primero?', [
        'La azul, con riego más eficiente como el goteo',
        'La verde, cambiando la lluvia de lugar',
        ['La gris, lavando más seguido las uvas', 'Lavar más no reduce el agua gris; y en este caso el problema urgente es la extracción del río.'],
        'Ninguna: el vino no tiene huella hídrica',
      ], 'En una zona seca con un río en baja, la huella azul es la que presiona. Pasar a goteo puede reducirla mucho con la misma producción.', { d: 3 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('El agua en tu plato', 'Comparar alimentos por su huella hídrica, y las trampas de comparar solo por kilo.', [
      teoria('Por qué los productos animales suman más', [
        'Un animal come mucho más alimento del que termina siendo carne, leche o huevos: es la pérdida de energía en cada paso de la cadena que viste en el tronco. Y cada kilo de ese alimento (granos, forraje) necesitó agua para crecer.',
        'Por eso, en promedio, los productos animales tienen más huella hídrica por kilo que los vegetales. Entre las carnes, la vacuna suele ser la más alta, seguida por la de cerdo y la de pollo.',
      ]),
      cad('Armá la cadena de por qué un kilo de carne vacuna necesita tanta agua.', [
        'El animal come muchos kilos de pasto y granos por cada kilo de carne',
        'Esos pastos y granos necesitan agua para crecer',
        'Se suma también el agua que toma y la de limpieza',
        'Toda esa agua se reparte en los kilos de carne producidos',
      ], ['La carne retiene el agua que tomó la vaca en toda su vida'], 'Es la regla del 10 % del tronco aplicada al agua: cada paso de la cadena multiplica el agua necesaria.', { d: 2 }),
      teoria('La trampa del "por kilo"', [
        'Comparar solo por kilo puede engañar, porque los alimentos no alimentan igual. Un kilo de lechuga tiene muy pocas calorías y proteínas; un kilo de lentejas, muchas. Por eso algunos análisis comparan también por gramo de proteína o por caloría.',
        'Aun así, incluso comparando por proteína, las legumbres suelen necesitar bastante menos agua que la carne vacuna. Lo importante es saber qué pregunta se está respondiendo con cada comparación.',
      ]),
      op('Alguien dice: "La lechuga tiene menos huella por kilo que las lentejas, así que conviene comer lechuga en vez de lentejas para cuidar el agua". ¿Qué falla?', [
        'Que no nutren igual: las lentejas dan mucha más proteína',
        'Que la lechuga no necesita agua para crecer',
        ['Que las lentejas no tienen huella hídrica', 'Todas las plantas tienen huella: el problema es comparar alimentos que cumplen funciones distintas.'],
        'Que la huella hídrica solo se mide en carnes',
      ], 'Comparar por kilo tiene sentido entre alimentos parecidos. Entre alimentos que nutren distinto, conviene comparar por proteína o por comida completa.', { d: 3 }),
      teoria('Qué se puede hacer', [
        'Algunas elecciones cambian mucho la huella hídrica de una dieta: comer más legumbres, verduras y cereales, y menos carne vacuna; no desperdiciar comida (la comida tirada lleva toda su agua a la basura); y elegir productos de estación y locales cuando eso reduce el riego en zonas secas.',
        'No se trata de prohibir nada: un guiso con menos carne y más lentejas, o un día sin carne por semana, ya mueven el número.',
      ], { lista: ['Más legumbres, verduras y cereales', 'Menos carne vacuna, sin prohibir', 'No tirar comida: tirás también su agua', 'Aprovechar los restos'] }),
      numv(3, (i) => {
        const g = [150, 200, 100][i];
        return {
          enunciado: `Si en un guiso reemplazás ${g} g de carne vacuna (15.400 L/kg) por ${g} g de lentejas (unos 5.900 L/kg), ¿cuántos litros de agua virtual ahorrás?`,
          valor: (g / 1000) * (15400 - 5900),
          unidad: 'litros',
          explicacion: `Diferencia por kilo: 15.400 − 5.900 = 9.500 litros. Por ${g} g: 0,${String(g / 10).padStart(2, '0')} kg × 9.500 = ${((g / 1000) * 9500).toLocaleString('es-AR')} litros.`,
        };
      }, { d: 3 }),
      vf('Tirar comida a la basura desperdicia también el agua que se usó para producirla.', true, 'Toda el agua virtual de un alimento se pierde si el alimento se tira. Por eso reducir el desperdicio es una de las formas más directas de bajar la huella hídrica de lo que comemos.', {
        razones: ['+Porque el agua usada para producirla se pierde con ella', '-Porque la comida tirada devuelve el agua al río', '-Porque la basura no tiene nada que ver con el agua'],
        d: 1,
      }),
      numv(3, (i) => {
        const kg = [2, 3, 1.5][i];
        return {
          enunciado: `Una familia tira ${kg.toLocaleString('es-AR')} kg de pan por semana (1.600 L/kg). ¿Cuántos litros de agua virtual tiran por año (52 semanas)?`,
          valor: kg * 1600 * 52,
          unidad: 'litros',
          explicacion: `${kg.toLocaleString('es-AR')} kg × 1.600 L/kg = ${(kg * 1600).toLocaleString('es-AR')} litros por semana. × 52 semanas = ${(kg * 1600 * 52).toLocaleString('es-AR')} litros por año: más que el agua de muchas casas en meses.`,
        };
      }, { d: 3 }),
      mult('¿Qué cambios bajan la huella hídrica de una dieta? Marcá todos.', [
        '+Sumar legumbres en lugar de parte de la carne vacuna',
        '+Planificar las compras para no tirar comida',
        '+Aprovechar los restos en otras comidas',
        '-Comprar más cantidad para tener "por las dudas"',
        '-Cambiar el agua de la canilla por agua embotellada',
      ], 'La huella hídrica de la comida se decide en qué y cuánto se compra y se come, no en qué agua se toma.', { d: 2 }),
      rank('Ordená estas comidas por su agua virtual aproximada, de más a menos.', [
        ['Bife de 300 g con papas', '≈ 4.700 litros'],
        ['Milanesa de pollo de 200 g con ensalada', '≈ 900 litros'],
        ['Guiso de lentejas con arroz', '≈ 700 litros'],
        ['Ensalada de tomate y papa', '≈ 150 litros'],
      ], 'Los valores son aproximados, pero el orden se mantiene: la carne vacuna domina la huella de cualquier plato que la lleve.', { d: 3 }),
      det('Leé este consejo de una publicidad y marcá lo que no tiene sentido.', [
        ['Para cuidar el agua, comé más legumbres y verduras.', false],
        ['Y tomá solo agua mineral en botella, que tiene huella cero.', true, 'El agua embotellada tiene más huella que la de red: envase, transporte y energía.'],
        ['No tires comida: con ella se va toda el agua que costó producirla.', false],
        ['Comparar alimentos por kilo siempre da la respuesta correcta.', true, 'Por kilo engaña cuando los alimentos nutren muy distinto.'],
      ], 'Los consejos buenos hablan de qué se come y cuánto se tira. Los malos, de "huella cero" y comparaciones sin contexto.', { d: 3 }),
      comp('Completá.', 'Comparar alimentos solo por [kilo] puede engañar: conviene mirar también la [proteína] que aportan, y recordar que tirar comida tira su [agua].', ['color', 'precio', 'envase'], 'Tres ideas para leer cualquier tabla de huellas de alimentos.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('El agua en tu ropa y tus cosas', 'Algodón, jeans, papel y celulares: el agua detrás de los objetos, y cómo reducirla usándolos más.', [
      teoria('La ropa', [
        'El algodón es un cultivo con mucha demanda de agua, y en muchas regiones del mundo se riega. Por eso las prendas de algodón tienen huellas altas: unos 2.500 litros una remera y varios miles un jean, según promedios. A eso se suma el agua de teñir y terminar las telas, y la contaminación que eso genera (agua gris).',
        'Las fibras sintéticas usan menos agua para producirse pero vienen del petróleo y sueltan microplásticos. No hay una fibra perfecta: la mejor prenda suele ser la que ya existe y se usa mucho tiempo.',
      ]),
      op('¿Qué opción reduce más la huella hídrica de tu ropa?', [
        'Usar más tiempo la ropa que ya tenés',
        'Comprar ropa nueva de algodón orgánico cada temporada',
        ['Comprar solo ropa sintética nueva', 'Usa menos agua para fabricarse, pero suma microplásticos y petróleo, y sigue siendo ropa nueva.'],
        'Lavar la ropa más seguido para que dure',
      ], 'La prenda con menor huella es la que no hay que fabricar. Usar más tiempo lo que ya se tiene reparte la huella en más usos.', { d: 2 }),
      ejemplo('Repartir la huella en usos', 'Una remera de 2.500 litros se usa 30 veces y se tira. Otra igual se usa 150 veces.', [
        'Primera: 2.500 ÷ 30 ≈ 83 litros por uso.',
        'Segunda: 2.500 ÷ 150 ≈ 17 litros por uso.',
      ], 'La misma remera, usada cinco veces más, tiene cinco veces menos huella por uso. Cuidar la ropa y usarla más es de las acciones más efectivas.'),
      numv(4, (i) => {
        const h = [2500, 8000, 2500, 8000][i];
        const usos = [50, 100, 200, 250][i];
        const n = ['una remera', 'un jean', 'una remera', 'un jean'][i];
        return {
          enunciado: `Si ${n} tiene una huella de ${h.toLocaleString('es-AR')} litros y se usa ${usos} veces, ¿cuántos litros de agua virtual le corresponden a cada uso?`,
          valor: h / usos,
          unidad: 'litros por uso',
          dec: 1,
          explicacion: `${h.toLocaleString('es-AR')} ÷ ${usos} = ${(h / usos).toLocaleString('es-AR')} litros por uso. Cuantas más veces se usa, menos agua carga cada uso.`,
        };
      }, { d: 2 }),
      teoria('Segunda mano y reparación', [
        'Comprar ropa de segunda mano, intercambiar con amigos o reparar lo que se rompe evita fabricar prendas nuevas. Cada prenda que se reusa "ahorra" casi toda la huella de una nueva.',
        'Lo mismo pasa con otros objetos: libros usados, muebles reparados, un celular que dura dos años más. La fabricación suele ser la parte más grande de la huella de un objeto.',
      ]),
      mult('¿Qué acciones reducen el agua virtual de lo que usás? Marcá todas.', [
        '+Comprar un jean de segunda mano',
        '+Coser un botón en lugar de tirar la camisa',
        '+Intercambiar ropa con amigos',
        '+Usar el celular un par de años más',
        '-Comprar una remera "ecológica" nueva cada mes',
      ], 'Todas las primeras evitan fabricar algo nuevo. La última es consumo nuevo con etiqueta verde.', { d: 2 }),
      teoria('Papel, electrónica y más', [
        'El papel necesita agua para cultivar los árboles y, sobre todo, para fabricar la pasta: el papel reciclado usa menos agua y energía que el papel virgen. Imprimir solo lo necesario y usar las dos caras ayuda.',
        'Los aparatos electrónicos tienen huellas hídricas altas por la minería de sus metales y la fabricación de chips, que usa agua ultrapura. Otra vez: lo más efectivo es usarlos más tiempo.',
      ]),
      clas('¿Esta acción reduce la huella hídrica sobre todo al fabricar menos, o al usar menos agua en casa?', {
        'Fabricar menos': ['Usar el celular dos años más', 'Comprar ropa de segunda mano', 'Imprimir doble faz'],
        'Usar menos agua en casa': ['Lavar la ropa con carga completa', 'Acortar la ducha', 'Regar al atardecer'],
      }, 'Las dos columnas importan. La primera se ve menos, pero muchas veces pesa más.', { d: 2 }),
      vf('Como el agua de fabricar ropa se usa lejos, en otro país, no tiene ningún efecto que me importe.', false, 'El agua de algodón regado en regiones secas puede agotar ríos y lagos enteros, y la contaminación de las tintorerías afecta a las comunidades que viven ahí. Lo que compramos tiene efectos donde se produce.', {
        razones: ['+Porque afecta ríos y personas donde se produce', '-Porque el agua de otros países no es agua', '-Porque la ropa no necesita agua para fabricarse'],
        d: 2,
      }),
      rank('Ordená estas decisiones por el agua virtual que ahorran, de más a menos.', [
        ['No comprar un jean nuevo este año', '≈ 8.000 litros'],
        ['No comprar dos remeras nuevas', '≈ 5.000 litros'],
        ['Imprimir en doble faz 100 hojas', 'unos cientos de litros'],
        ['Cerrar la canilla al cepillarse una semana', '≈ 220 litros'],
      ], 'Evitar una prenda nueva ahorra más agua que semanas de cuidados en casa. Por eso esta unidad mira el agua invisible.', { d: 3 }),
      det('Leé esta etiqueta de una tienda y marcá lo engañoso.', [
        ['Remera de algodón orgánico certificado.', false],
        ['Comprarla ahorra agua, así que cuantas más compres, más ayudás.', true, 'Cada remera nueva suma huella; comprar más nunca ahorra.'],
        ['Lavala con agua fría y carga completa.', false],
        ['Al ser orgánica, no tiene huella hídrica.', true, 'El algodón orgánico también necesita agua para crecer.'],
      ], '"Orgánico" puede mejorar cómo se produce, pero no hace que comprar más sea bueno ni que la huella desaparezca.', { d: 3 }),
      comp('Completá.', 'La prenda con menor huella es la que ya [existe]: usarla más veces reparte su huella en más [usos].', ['viaja', 'colores', 'talles'], 'La idea central de esta lección, y la base de la rama de Consumo.', { d: 1 }),
      cad('Armá la cadena de por qué un jean de segunda mano ahorra agua.', [
        'Comprás un jean usado en lugar de uno nuevo',
        'No hace falta fabricar un jean nuevo',
        'No se cultiva algodón ni se tiñe tela para él',
        'Se evitan miles de litros de agua y su contaminación',
      ], ['El jean usado absorbe menos agua al lavarlo'], 'El ahorro no está en el lavado sino en la fabricación que se evita. El señuelo mezcla un uso posterior con la huella de producción.', { d: 3 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('El agua que viaja por el mundo', 'Cuando un país exporta soja o carne, exporta también agua. Qué significa y cuándo importa.', [
      teoria('Comercio de agua virtual', [
        'Cuando un país vende alimentos o productos a otro, con ellos viaja el agua que se usó para producirlos. A eso se lo llama comercio de agua virtual. Un país que exporta granos exporta, sin verlo, millones de litros de agua.',
        'Argentina es un gran exportador de productos agrícolas y ganaderos: soja, maíz, trigo, carne. Por eso es, en términos netos, un exportador importante de agua virtual, en su mayoría agua verde de la lluvia de la región pampeana.',
      ]),
      op('Si un país exporta 1 millón de toneladas de trigo, ¿qué más exporta sin verlo?', [
        'El agua que se usó para cultivarlo',
        'El agua de los barcos que lo transportan',
        ['Solo el agua que queda dentro del grano', 'El grano tiene poca agua adentro; lo que se exporta es el agua usada para producirlo.'],
        'Nada: el trigo no tiene relación con el agua',
      ], 'Es agua virtual: la usada para producir el trigo queda en el país de origen, pero su "beneficio" viaja con el grano.', { d: 1 }),
      numv(3, (i) => {
        const t = [1000, 500, 2000][i];
        return {
          enunciado: `Si un kilo de trigo tiene una huella de unos 1.800 litros, ¿cuántos millones de litros de agua virtual hay en ${t.toLocaleString('es-AR')} toneladas de trigo?`,
          valor: (t * 1000 * 1800) / 1e6,
          unidad: 'millones de litros',
          explicacion: `${t.toLocaleString('es-AR')} toneladas son ${(t * 1000).toLocaleString('es-AR')} kg. × 1.800 L = ${(t * 1000 * 1800).toLocaleString('es-AR')} litros = ${((t * 1000 * 1800) / 1e6).toLocaleString('es-AR')} millones de litros.`,
        };
      }, { d: 3 }),
      teoria('Un recurso para los países secos', [
        'Para un país con muy poca agua, importar alimentos es una forma de "importar agua": en vez de usar sus ríos para cultivar trigo, lo compra afuera y usa su agua para otras cosas. Muchos países de Medio Oriente y del norte de África dependen de esto.',
        'Para un país con mucha lluvia, exportar alimentos producidos con agua verde puede ser un uso razonable de su agua. Lo delicado es cuando se exporta agua azul de zonas secas, o cuando la producción contamina (agua gris) y deja el problema en el país exportador.',
      ]),
      clas('¿Esta situación es un uso razonable del agua o una señal de alerta?', {
        'Uso razonable': ['Exportar trigo cultivado con lluvia en una zona húmeda', 'Un país árido que importa granos y ahorra sus ríos'],
        'Señal de alerta': ['Exportar frutas regadas con un río que se está secando', 'Una producción que contamina el arroyo local para exportar', 'Vaciar un acuífero para cultivos de exportación'],
      }, 'No es el comercio en sí lo que preocupa, sino de dónde sale el agua y qué deja atrás.', { d: 3 }),
      vf('Exportar alimentos siempre es malo para el agua del país que exporta.', false, 'Depende. Si se produce con agua verde en una zona húmeda y sin contaminar, puede ser un buen uso del agua. El problema es exportar agua azul de zonas secas o dejar contaminación.', {
        razones: ['+Porque depende de qué agua se usa, dónde y cuánto se contamina', '-Porque el comercio de alimentos no usa agua', '-Porque exportar siempre agota todos los ríos'],
        d: 3,
      }),
      teoria('Lo que deja atrás', [
        'Cuando se produce para exportar, la huella azul y la gris quedan en el país que produce: los ríos que se usan y los arroyos que se contaminan están ahí, no en el país que consume. Por eso algunas miradas hablan de "externalizar" el impacto: quien consume no lo ve.',
        'Conocer el agua virtual ayuda a hacerse preguntas: ¿de dónde viene esto?, ¿qué agua usó?, ¿qué dejó atrás? Son preguntas de consumidor, pero también de política: cómo se regula el uso del agua en zonas productivas.',
      ]),
      cad('Armá la cadena de cómo el consumo en un país puede secar un río en otro.', [
        'Un país lejano compra mucha fruta fuera de estación',
        'Otra región la produce regando con el agua de un río',
        'La demanda crece año a año',
        'Se saca más agua de la que el río repone',
        'El río baja y afecta a quienes viven ahí',
      ], ['El país que compra recibe menos lluvia'], 'El impacto se queda donde se produce. El país que compra no pierde lluvia: pierde la otra región su río.', { d: 3 }),
      par('Uní cada concepto con su definición.', [
        ['Agua virtual', 'Agua usada para producir algo, que no queda en el producto'],
        ['Comercio de agua virtual', 'El agua que viaja dentro de lo que se exporta e importa'],
        ['Exportador neto de agua virtual', 'País que exporta más agua virtual de la que importa'],
        ['Huella azul', 'Agua sacada de ríos, lagos o napas'],
      ], 'Cuatro conceptos que conectan tu plato con la economía del mundo.', { d: 2 }),
      mult('¿Qué preguntas conviene hacerse sobre el agua de un producto importado? Marcá todas.', [
        '+¿En qué región se produjo y cuánta agua hay ahí?',
        '+¿Se regó con agua de ríos o napas, o creció con lluvia?',
        '+¿Contaminó el agua del lugar donde se produjo?',
        '-¿De qué color es el envase?',
        '-¿Tiene más agua adentro que otro producto?',
      ], 'Dónde, qué agua y qué contaminación: las tres preguntas que separan un buen uso del agua de uno problemático.', { d: 3 }),
      det('Leé esta opinión de un foro y marcá los errores.', [
        ['Argentina exporta mucha agua virtual en granos y carne.', false],
        ['Por eso hay que prohibir todas las exportaciones de alimentos.', true, 'La mayor parte es agua verde de lluvia; lo que importa es cómo y dónde se produce.'],
        ['Lo que conviene vigilar es el riego en zonas secas y la contaminación.', false],
        ['El agua virtual que se exporta se saca de las canillas de las ciudades.', true, 'Viene sobre todo de la lluvia en los campos y del riego, no de las redes urbanas.'],
      ], 'Entender el agua virtual es entender matices: ni todo es un problema, ni nada lo es.', { d: 4 }),
      comp('Completá.', 'Un país con poca agua puede [importar] alimentos para ahorrar sus ríos; uno con mucha lluvia puede [exportar] alimentos hechos con agua [verde].', ['comprar agua embotellada', 'secar', 'azul'], 'El comercio de agua virtual puede ser una forma de repartir mejor el agua del mundo, o de trasladar problemas: depende de cómo se haga.', { d: 3 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: el agua invisible', 'Agua virtual, colores de la huella, comida, ropa y comercio, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el menú del comedor', 'Un comedor escolar quiere bajar el agua invisible de su menú sin perder nutrición. Hacé las cuentas.', [
      teoria('El caso', [
        'El comedor de una escuela sirve 200 almuerzos por día, cinco días por semana. Hoy el menú tiene carne vacuna tres días (150 g por porción), pollo un día (150 g) y fideos con salsa un día. La cooperadora quiere reducir la huella hídrica del menú sin que baje la proteína, y también bajar el desperdicio: se tira cerca del 15 % de lo que se cocina.',
        'Huellas de referencia (promedios mundiales por kilo): carne vacuna 15.400 L; pollo 4.300 L; lentejas 5.900 L; fideos 1.800 L.',
      ]),
      num('¿Cuántos litros de agua virtual tiene la carne vacuna de UN día de almuerzos (200 porciones de 150 g)?', 462000, 'litros', '200 × 0,15 kg = 30 kg de carne. × 15.400 L/kg = 462.000 litros en un solo día.', { ctx: 'Comedor escolar: 200 almuerzos por día. Carne vacuna 150 g por porción, 15.400 L/kg; pollo 4.300 L/kg; lentejas 5.900 L/kg.', d: 3 }),
      num('Si uno de los tres días de carne vacuna se reemplaza por pollo (misma cantidad), ¿cuántos litros por semana se ahorran?', 333000, 'litros', 'Son 30 kg de carne por día. Diferencia por kilo: 15.400 − 4.300 = 11.100 litros. × 30 kg = 333.000 litros por semana.', { ctx: 'Comedor escolar: 30 kg de carne por día de carne. Carne vacuna 15.400 L/kg; pollo 4.300 L/kg.', d: 4 }),
      op('La cooperadora propone un guiso de lentejas con un poco de carne en lugar de uno de los días de bife. ¿Por qué es una buena idea para el agua y la nutrición?', [
        'Las lentejas dan proteína con menos agua',
        'Las lentejas no necesitan nada de agua para crecer',
        ['El guiso tiene más agua adentro que el bife', 'El agua que tiene adentro el plato no es lo que se mide: es el agua usada para producir los ingredientes.'],
        'Porque la carne no aporta proteína',
      ], 'Legumbres y carne combinadas mantienen la proteína y bajan mucho el agua virtual por porción.', { d: 3 }),
      numv(3, (i) => {
        const pct = [15, 10, 20][i];
        return {
          enunciado: `Si el comedor tira el ${pct} % de los 30 kg de carne vacuna de un día, ¿cuántos litros de agua virtual van a la basura ese día?`,
          valor: 30 * (pct / 100) * 15400,
          unidad: 'litros',
          explicacion: `${pct} % de 30 kg = ${30 * (pct / 100)} kg tirados. × 15.400 L/kg = ${(30 * (pct / 100) * 15400).toLocaleString('es-AR')} litros de agua virtual a la basura, solo en carne.`,
        };
      }, { d: 3 }),
      mult('¿Qué medidas bajan el desperdicio del comedor? Marcá todas.', [
        '+Preguntar a los chicos qué platos dejan y ajustar las porciones',
        '+Servir primero porciones medianas y ofrecer repetir',
        '+Planificar las compras según la asistencia real',
        '-Cocinar un 30 % extra por las dudas',
        '-Servir siempre la porción más grande posible',
      ], 'Ajustar porciones y compras a lo que realmente se come es la medida más barata y efectiva.', { d: 3 }),
      rank('Ordená estas medidas por el agua virtual semanal que ahorran, de más a menos.', [
        ['Cambiar un día de carne vacuna por pollo', '≈ 333.000 litros'],
        ['Bajar el desperdicio de carne del 15 % al 5 % en los tres días', '≈ 139.000 litros'],
        ['Servir fideos en porciones más chicas un día', 'decenas de miles de litros'],
        ['Cerrar las canillas de la cocina al lavar', 'cientos de litros'],
      ], 'Cambiar una carne por otra y bajar el desperdicio mueven cientos de miles de litros. Las canillas suman, pero están órdenes de magnitud abajo.', { d: 4 }),
      vf('Si el comedor reduce la carne vacuna, necesariamente baja la proteína del menú.', false, 'Se puede mantener la proteína con pollo, huevos, legumbres o combinaciones como lentejas con arroz. La nutrición depende del menú completo, no de un solo ingrediente.', {
        razones: ['+Porque otras fuentes como legumbres, huevos o pollo aportan proteína', '-Porque solo la carne vacuna tiene proteína', '-Porque la proteína no importa en un comedor escolar'],
        d: 3,
      }),
      det('La cooperadora escribe una nota para las familias. Marcá los errores.', [
        ['Vamos a cambiar un día de carne vacuna por pollo y otro por un guiso de lentejas con carne.', false],
        ['Así ahorramos unos 300.000 litros por semana de agua de las canillas de la escuela.', true, 'Es agua virtual de la producción de los alimentos, no agua de las canillas.'],
        ['También vamos a ajustar porciones para tirar menos comida.', false],
        ['Las lentejas no tienen proteína, pero son más baratas.', true, 'Las lentejas son una buena fuente de proteína.'],
      ], 'Un buen mensaje es preciso: agua virtual no es agua de canilla, y las legumbres sí nutren.', { d: 4 }),
    ]),
  ],
});
