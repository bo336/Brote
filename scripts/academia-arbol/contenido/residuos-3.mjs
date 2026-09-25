import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// RESIDUOS 3 — Compostar: la mitad de la bolsa.
// El compostaje a fondo: qué es, la receta de secos y húmedos, qué va y qué
// no, cómo resolver problemas y cómo se hace a escala barrial o municipal.
// Retoma la composición de la basura y el metano de los rellenos
// (residuos-1), la vida del suelo (aire-suelo-2 si ya la hiciste) y los
// descomponedores (animales-1).

export default unidad({
  slug: 'residuos-3',
  rama: 'residuos',
  orden: 3,
  nivel: 2,
  requiereTronco: 2,
  titulo: 'Compostar: la mitad de la bolsa',
  bajada: 'Casi la mitad de lo que tirás puede volver a ser tierra fértil en pocos meses. La receta, los errores comunes y cómo hacerlo en casa, en el edificio o en la ciudad.',
  objetivos: [
    'Explicar el compostaje como un proceso biológico con oxígeno',
    'Equilibrar materiales secos y húmedos, agua y aire',
    'Decidir qué residuos van a una compostera casera y cuáles no',
    'Diagnosticar y resolver problemas comunes de una compostera',
    'Comparar el compostaje doméstico, comunitario y municipal',
  ],
  repasa: ['residuos-1', 'residuos-2', 'tronco-1'],
  fuentes: ['fao-suelos', 'epa', 'ley-1854-basura-cero', 'unep-food-waste-2024'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Qué es compostar', 'Microbios, lombrices y oxígeno: cómo los restos de comida se convierten en tierra fértil.', [
      teoria('Descomponer con aire', [
        'Compostar es acelerar lo que la naturaleza hace en el suelo de un bosque: descomponer restos orgánicos para convertirlos en un material oscuro, suelto y con olor a tierra húmeda, el compost, que devuelve nutrientes y materia orgánica al suelo.',
        'El trabajo lo hacen bacterias, hongos, lombrices, bichos bolita y muchos otros organismos. La clave es que haya oxígeno: con aire, la descomposición produce sobre todo CO₂, agua y calor, y casi nada de metano. Sin aire, como en un relleno, se producen metano y malos olores.',
      ]),
      cad('Armá la cadena de cómo una cáscara de banana se convierte en compost.', [ // e1
        'La cáscara entra a la compostera junto con hojas secas',
        'Bacterias y hongos empiezan a descomponerla',
        'La pila se calienta por la actividad de los microbios',
        'Lombrices y bichos siguen triturando y descomponiendo',
        'Queda un material oscuro con olor a tierra',
      ], ['La cáscara se evapora con el calor del sol'], 'Muchos organismos trabajando en cadena, como los descomponedores de la rama de Animales.', { d: 1 }),
      op('¿Por qué una compostera bien manejada casi no produce metano?', [ // e2
        'Porque la descomposición ocurre con oxígeno',
        'Porque el compost absorbe todo el metano del aire',
        ['Porque los restos de comida no tienen carbono', 'Tienen mucho carbono; lo que cambia es que, con aire, se forma CO₂ y no metano.'],
        'Porque la compostera está siempre tapada y sin aire',
      ], 'Con aire, los microbios producen CO₂; sin aire, metano. Por eso airear es tan importante.', { d: 2 }),
      teoria('Una pila que se calienta', [
        'En una pila grande y bien armada, la actividad de los microbios puede calentar el interior a 50 o 60 °C durante días. Ese calor acelera la descomposición y elimina muchas semillas de malezas y microbios que causan enfermedades. Después la pila se enfría y entran en acción hongos, lombrices e insectos que terminan el trabajo.',
        'En una compostera casera chica, la temperatura sube menos, y el proceso es más lento, pero funciona igual.',
      ]),
      ord('Ordená las etapas de una pila de compost.', [ // e3
        'Se arma la pila con restos secos y húmedos',
        'Los microbios se multiplican y la pila se calienta',
        'Se mantiene caliente varios días y se descompone rápido',
        'Se enfría y entran lombrices y hongos',
        'Madura y queda compost listo para usar',
      ], 'Calentamiento, fase caliente, enfriamiento y maduración: el ciclo de una pila de compost.', { d: 2, extremos: ['Primero', 'Último'] }),
      vf('Que una pila de compost se caliente mucho por dentro es señal de que algo anda mal.', false, 'Es una buena señal: muestra mucha actividad de microbios. El calor acelera el proceso y elimina semillas y patógenos.', { // e4
        razones: ['+Porque indica mucha actividad de los microbios', '-Porque el compost solo funciona en frío', '-Porque el calor viene de un incendio'],
        d: 2,
      }),
      teoria('Qué se obtiene', [
        'Del compostaje se obtiene compost: un abono que mejora la estructura del suelo, retiene agua y alimenta la vida del suelo, como viste en la rama de Aire y Suelo. Y se reduce mucho el volumen: los restos pierden agua y se descomponen, así que el compost final pesa y ocupa bastante menos que lo que entró.',
      ]),
      numv(3, (i) => { // e5
        const kg = [100, 60, 200][i];
        const pct = [30, 25, 35][i];
        return {
          enunciado: `Entran ${kg} kg de restos orgánicos a una compostera. Si el compost final pesa el ${pct} % de lo que entró, ¿cuántos kg de compost se obtienen?`,
          valor: (kg * pct) / 100,
          unidad: 'kg',
          explicacion: `${kg} × ${pct} ÷ 100 = ${(kg * pct) / 100} kg. El resto se fue como agua evaporada y CO₂ de la respiración de los microbios.`,
        };
      }, { d: 1 }),
      par('Uní cada organismo con su papel en la compostera.', [ // e6
        ['Bacterias', 'Inician la descomposición y calientan la pila'],
        ['Hongos', 'Descomponen materiales duros como hojas y cartón'],
        ['Lombrices', 'Trituran y mezclan, y producen humus'],
        ['Bichos bolita', 'Fragmentan restos en trozos más chicos'],
      ], 'Una compostera es un ecosistema en miniatura.', { d: 2 }),
      mult('¿Qué beneficios tiene compostar en casa? Marcá todos.', [ // e7
        '+Se reduce mucho la basura que va al relleno',
        '+Se evita metano del relleno',
        '+Se obtiene abono para plantas y huertas',
        '+Mejora la vida del suelo donde se usa',
        '-Genera electricidad para la casa',
      ], 'Menos basura, menos metano, mejor suelo.', { d: 1 }),
      clas('¿Esto ocurre en una compostera bien manejada o en un relleno sanitario?', { // e8
        'Compostera bien manejada': ['Descomposición con oxígeno', 'Olor a tierra húmeda', 'Se obtiene abono'],
        'Relleno sanitario': ['Descomposición sin oxígeno', 'Producción de metano', 'Lixiviados que hay que tratar'],
      }, 'Los mismos restos, dos destinos muy distintos.', { d: 2 }),
      det('Leé esta explicación y marcá lo equivocado.', [ // e9
        ['El compost se forma por la acción de microbios y otros organismos.', false],
        ['Compostar produce más metano que mandar los restos al relleno.', true, 'Con aire, produce mucho menos metano que un relleno.'],
        ['El compost mejora la estructura del suelo.', false],
        ['El compost final pesa más que los restos que entraron.', true, 'Pesa bastante menos: se pierde agua y CO₂.'],
      ], 'Compostar es devolver al suelo lo que vino del suelo.', { d: 2 }),
      comp('Completá.', 'Compostar es descomponer restos orgánicos con [oxígeno]; así se produce poco [metano] y se obtiene un abono llamado [compost].', ['nitrógeno', 'vapor', 'fertilizante químico'], 'La definición de compostar, resumida en una línea.', { d: 1 }),
      est('Estimá a qué temperatura puede llegar el interior de una pila de compost grande y activa.', 60, { min: 10, max: 100, paso: 5, unidad: '°C' }, 'Entre 50 y 60 °C, e incluso algo más. Todo ese calor lo producen los microbios al trabajar.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('La receta: secos, húmedos, agua y aire', 'El equilibrio de materiales que hace funcionar una compostera.', [
      teoria('Secos y húmedos', [
        'Una compostera necesita dos tipos de materiales. Los húmedos (o "verdes") son ricos en nitrógeno: restos de frutas y verduras, yerba, café, pasto recién cortado. Los secos (o "marrones") son ricos en carbono: hojas secas, ramitas, aserrín sin tratar, cartón y papel sin tinta de color.',
        'Una regla práctica es poner, en volumen, entre dos y tres partes de secos por cada parte de húmedos. Los secos aportan estructura y aire; los húmedos, nitrógeno y humedad.',
      ], { destacado: { valor: '2-3 : 1', texto: 'partes de secos por cada parte de húmedos, en volumen, es una buena regla práctica.' } }),
      clas('¿Es un material seco (marrón) o húmedo (verde)?', { // e1
        'Seco (marrón)': ['Hojas secas', 'Cartón cortado', 'Aserrín sin tratar', 'Ramitas'],
        'Húmedo (verde)': ['Cáscaras de verdura', 'Yerba usada', 'Pasto recién cortado', 'Restos de fruta'],
      }, 'Los dos grupos se complementan. Casi todos los problemas vienen de tener demasiado de uno.', { d: 1 }),
      numv(3, (i) => { // e2
        const h = [10, 6, 15][i];
        const r = [2, 3, 2][i];
        return {
          enunciado: `Si agregás ${h} litros de restos húmedos por semana y querés mantener ${r} partes de secos por cada parte de húmedos, ¿cuántos litros de secos necesitás?`,
          valor: h * r,
          unidad: 'litros',
          explicacion: `${h} × ${r} = ${h * r} litros de secos por semana. Tener una bolsa de hojas secas a mano junto a la compostera facilita mantener la proporción.`,
        };
      }, { d: 1 }),
      teoria('Agua y aire', [
        'La humedad ideal es parecida a la de una esponja escurrida: si se aprieta un puñado, apenas gotea. Muy seco, los microbios se frenan; muy mojado, el aire no entra y aparecen malos olores.',
        'El aire se asegura con materiales secos que dejan huecos, revolviendo cada tanto y evitando compactar. Trozar los restos en pedazos más chicos acelera todo, porque aumenta la superficie donde trabajan los microbios.',
      ]),
      op('¿Cómo tiene que estar la humedad de una compostera?', [ // e3
        'Como una esponja escurrida',
        'Completamente seca, como arena',
        ['Encharcada, para que se descomponga rápido', 'Encharcada falta aire y aparecen malos olores.'],
        'Siempre cubierta con agua',
      ], 'Húmeda pero no mojada: los microbios necesitan agua y aire al mismo tiempo.', { d: 1 }),
      par('Uní cada ingrediente de la receta con su función.', [ // e4
        ['Materiales secos', 'Aportan carbono, estructura y aire'],
        ['Materiales húmedos', 'Aportan nitrógeno y humedad'],
        ['Revolver', 'Mete aire en la pila'],
        ['Trozar los restos', 'Acelera la descomposición'],
      ], 'Cuatro ingredientes de una compostera que funciona bien.', { d: 2 }),
      cad('Armá la cadena de qué pasa si solo se agregan restos húmedos.', [ // e5
        'Se agregan solo restos de cocina, sin secos',
        'La mezcla se compacta y se moja',
        'El aire no llega al interior',
        'Los microbios trabajan sin oxígeno',
        'Aparecen malos olores',
      ], ['La compostera se seca por completo'], 'El error más común: faltan secos. La solución es sumar hojas o cartón y revolver.', { d: 2 }),
      vf('Trozar los restos en pedazos chicos hace que se compostan más rápido.', true, 'Aumenta la superficie donde trabajan los microbios. Una cáscara entera de zapallo tarda mucho más que trozada.', { // e6
        razones: ['+Porque aumenta la superficie donde trabajan los microbios', '-Porque los microbios solo comen pedazos grandes', '-Porque trozar evita que se descompongan'],
        d: 1,
      }),
      teoria('Armar por capas', [
        'Una forma práctica de empezar es armar capas: una base de ramitas para que circule aire, una capa de secos, los restos húmedos encima y, siempre, una tapa de secos para cubrirlos. Cada vez que se agregan restos, se cubren con secos. Así se evitan moscas y olores.',
      ]),
      ord('Ordená cómo se arma una compostera nueva.', [ // e7
        'Poner una base de ramitas en el fondo',
        'Agregar una capa de hojas secas',
        'Sumar los restos húmedos de la cocina',
        'Cubrir los húmedos con otra capa de secos',
        'Humedecer si hace falta y revolver cada tanto',
      ], 'La tapa de secos es el secreto para evitar moscas.', { d: 2, extremos: ['Primero', 'Último'] }),
      mult('¿Qué ayuda a que la compostera funcione rápido? Marcá todo.', [ // e8
        '+Mantener la proporción de secos y húmedos',
        '+Trozar los restos',
        '+Revolver cada una o dos semanas',
        '+Humedad como de esponja escurrida',
        '-Apretar todo bien fuerte para que entre más',
      ], 'Compactar saca el aire. Lo que ayuda es mezclar, airear y equilibrar.', { d: 2 }),
      det('Leé estos consejos y marcá los equivocados.', [ // e9
        ['Cubrí siempre los restos de cocina con hojas secas.', false],
        ['Poné solo restos de cocina, sin nada seco, para que sea más rápido.', true, 'Sin secos falta aire y aparecen olores.'],
        ['Revolvé cada tanto para airear.', false],
        ['Mantené la compostera encharcada para que no se seque.', true, 'Encharcada falta oxígeno; tiene que estar como esponja escurrida.'],
      ], 'Equilibrio de secos y húmedos, agua y aire: toda la receta.', { d: 2 }),
      comp('Completá.', 'Los materiales [secos] aportan carbono y aire; los [húmedos] aportan nitrógeno; y conviene poner unas dos o tres partes de los primeros por cada [parte] de los segundos.', ['metálicos', 'plásticos', 'litro'], 'La proporción de la receta del compost, en una sola línea.', { d: 2 }),
      rank('Ordená estos materiales según cuánto tardan en descomponerse, de más rápido a más lento.', [ // e11
        ['Restos de lechuga', 'días a semanas'],
        ['Cáscaras de naranja', 'semanas'],
        ['Hojas secas enteras', 'meses'],
        ['Ramas gruesas', 'muchos meses o años'],
      ], 'Lo tierno y húmedo va rápido; lo leñoso, lento. Por eso conviene trozar lo duro.', { d: 2, extremos: ['Más rápido', 'Más lento'] }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Qué va y qué no', 'Qué residuos se pueden compostar en casa, cuáles conviene evitar y por qué.', [
      teoria('Lo que sí', [
        'En una compostera casera van muy bien: restos crudos de frutas y verduras, cáscaras de huevo trituradas, yerba, saquitos de té y borra de café, hojas secas, pasto, restos de poda chicos, cartón y papel sin tinta de color ni plastificado, servilletas de papel usadas.',
      ]),
      teoria('Lo que conviene evitar', [
        'En una compostera casera conviene no poner carne, pescado, huesos, lácteos ni restos con mucho aceite: atraen roedores y moscas y generan olores. Tampoco heces de perros o gatos, que pueden tener microbios peligrosos; plantas enfermas o con plagas; ni cenizas de carbón o de cigarrillos.',
        'Y nunca plásticos, vidrio, metales o pañales: no son orgánicos. Los envases "compostables" solo conviene ponerlos si se sabe que se degradan en compostaje casero, porque muchos necesitan compostaje industrial.',
      ]),
      clas('¿Va a la compostera casera o no?', { // e1
        'Sí va': ['Borra de café', 'Cáscaras de huevo trituradas', 'Hojas secas', 'Cartón sin tinta'],
        'No va': ['Restos de asado', 'Heces del perro', 'Un pañal', 'Una bolsa de plástico'],
      }, 'Vegetales crudos y secos, sí. Carne, heces, pañales y plásticos, no.', { d: 1 }),
      op('¿Por qué conviene no poner restos de carne en una compostera casera?', [ // e2
        'Porque atraen roedores y producen malos olores',
        'Porque la carne no tiene materia orgánica',
        ['Porque la carne es un residuo peligroso por ley', 'No es peligroso por ley: el problema práctico son los olores y los roedores.'],
        'Porque la carne se convierte en plástico',
      ], 'En composteras industriales, con altas temperaturas y control, sí se pueden tratar. En casa conviene evitarla.', { d: 2 }),
      vf('Las heces de perros y gatos son un buen abono para la compostera de la huerta.', false, 'Pueden contener parásitos y microbios que causan enfermedades. No se ponen en la compostera de alimentos.', { // e3
        razones: ['+Porque pueden tener parásitos y microbios peligrosos', '-Porque no tienen materia orgánica', '-Porque aceleran demasiado el compost'],
        d: 2,
      }),
      mult('¿Cuáles de estos papeles y cartones se pueden compostar? Marcá todos.', [ // e4
        '+Cartón de huevos',
        '+Servilletas de papel usadas',
        '+Papel de diario en pequeñas cantidades',
        '-Papel plastificado de revistas brillantes',
        '-Vasos de cartón con capa plástica',
      ], 'Papeles simples sí; los que tienen plástico o recubrimientos, no.', { d: 2 }),
      teoria('Envases compostables', [
        'Algunos envases dicen "compostable". Muchos de ellos están certificados para compostaje industrial, donde las temperaturas altas y el tiempo controlado los descomponen. En una compostera casera pueden tardar muchísimo o no descomponerse del todo. Por eso conviene fijarse si dice específicamente "compostable en casa".',
      ]),
      cad('Armá la cadena de qué pasa si ponés un vaso "compostable industrial" en tu compostera casera.', [ // e5
        'Ponés el vaso en la compostera del balcón',
        'La temperatura no sube tanto como en una planta industrial',
        'El vaso casi no se degrada en meses',
        'Aparece entero cuando sacás el compost',
      ], ['El vaso se convierte en abono en una semana'], 'Compostable no siempre significa compostable en casa. La etiqueta lo tiene que decir.', { d: 3 }),
      par('Uní cada residuo con su mejor destino.', [ // e6
        ['Cáscaras de papa', 'Compostera'],
        ['Restos de pollo', 'Basura o compostaje municipal si lo acepta'],
        ['Botella de PET', 'Reciclables'],
        ['Pañal', 'Basura común'],
      ], 'Cada residuo tiene su lugar. La compostera recibe lo vegetal y crudo.', { d: 2 }),
      numv(3, (i) => { // e7
        const org = [15, 10, 20][i];
        const pct = [70, 80, 60][i];
        return {
          enunciado: `Una familia genera ${org} kg de restos orgánicos por semana. Si el ${pct} % son restos vegetales que pueden ir a la compostera casera, ¿cuántos kg por semana puede compostar?`,
          valor: (org * pct) / 100,
          unidad: 'kg',
          dec: 1,
          explicacion: `${org} × ${pct} ÷ 100 = ${((org * pct) / 100).toLocaleString('es-AR')} kg por semana. El resto (carne, lácteos) necesita otro destino o un compostaje municipal que lo acepte.`,
        };
      }, { d: 1 }),
      rank('Ordená estos residuos del más fácil al más difícil de compostar en casa.', [ // e8
        ['Restos de lechuga', 'muy fácil'],
        ['Cáscaras de huevo trituradas', 'fácil'],
        ['Vaso compostable industrial', 'difícil en casa'],
        ['Hueso de asado', 'no recomendado en casa'],
      ], 'De lo vegetal y tierno a lo que requiere condiciones industriales.', { d: 2, extremos: ['Más fácil', 'Más difícil'] }),
      det('Leé esta lista pegada en una compostera y marcá lo equivocado.', [ // e9
        ['Sí: yerba, café y cáscaras.', false],
        ['Sí: restos de asado y huesos.', true, 'En casa atraen roedores y generan olores.'],
        ['Sí: hojas secas y cartón sin tinta.', false],
        ['Sí: cualquier envase que diga "biodegradable".', true, 'Muchos no se degradan en una compostera casera.'],
      ], 'Una buena lista evita la mayoría de los problemas.', { d: 2 }),
      comp('Completá.', 'A la compostera casera van restos [vegetales] y secos; se evitan la [carne] y los lácteos; y muchos envases compostables necesitan compostaje [industrial].', ['plásticos', 'yerba', 'casero'], 'La regla de qué va y qué no, en una línea.', { d: 1 }),
      est('Estimá qué porcentaje de los restos orgánicos de una casa típica son vegetales aptos para compostera casera.', 75, { min: 0, max: 100, paso: 5, unidad: '%' }, 'La mayor parte, en muchas casas alrededor de tres cuartos. Carne, huesos y lácteos suelen ser una parte menor.', { d: 3 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Problemas y soluciones', 'Olor, moscas, bichos y un compost que no avanza: cómo diagnosticar y arreglar una compostera.', [
      teoria('Diagnosticar', [
        'La mayoría de los problemas de una compostera tienen causas simples. El olor a podrido o a amoníaco indica exceso de húmedos o falta de aire. Las moscas aparecen cuando los restos quedan destapados. Si no pasa nada durante semanas, suele faltar humedad o haber demasiados secos. Los roedores llegan si hay carne, lácteos o comida cocida.',
      ]),
      par('Uní cada síntoma con su causa más probable.', [ // e1
        ['Olor a podrido', 'Exceso de húmedos y falta de aire'],
        ['Moscas', 'Restos de cocina sin cubrir'],
        ['No se descompone nada', 'Falta de humedad o exceso de secos'],
        ['Roedores', 'Restos de carne o comida cocida'],
      ], 'Cada síntoma señala una causa, como un buen diagnóstico.', { d: 2 }),
      op('La compostera huele a podrido. ¿Qué conviene hacer?', [ // e2
        'Agregar secos y revolver para meter aire',
        'Agregar más restos de cocina',
        ['Regarla con mucha agua para lavar el olor', 'Más agua empeora el problema: falta aire.'],
        'Taparla herméticamente para que no salga el olor',
      ], 'Olor es falta de aire y exceso de humedad. Secos y revolver lo resuelven en pocos días.', { d: 2 }),
      teoria('Seco y lento', [
        'Si la compostera está seca y fría, los microbios trabajan muy lento. Conviene agregar agua de a poco, sumar restos húmedos y revolver. En invierno todo es más lento: es normal.',
        'Los pequeños mosquitos de la fruta suelen aparecer cuando las cáscaras quedan expuestas; se evitan cubriendo siempre con secos.',
      ]),
      clas('¿Qué solución corresponde a cada problema?', { // e3
        'Agregar secos y airear': ['Olor fuerte', 'Mezcla chorreando líquido'],
        'Agregar agua y húmedos': ['Todo seco y sin cambios', 'Pila fría hace semanas en verano'],
        'Cubrir mejor los restos': ['Moscas y mosquitos', 'Cáscaras a la vista'],
      }, 'Tres soluciones para casi todos los problemas: secos y aire, agua y húmedos, o tapar.', { d: 2 }),
      cad('Armá la cadena de cómo se resuelve una compostera con olor.', [ // e4
        'Se detecta olor a podrido',
        'Se agregan hojas secas o cartón',
        'Se revuelve para meter aire',
        'Los microbios vuelven a trabajar con oxígeno',
        'El olor desaparece en pocos días',
      ], ['Se agrega carne para equilibrar el olor'], 'Un problema frecuente con una solución simple.', { d: 1 }),
      vf('Si aparecen lombrices y bichos bolita en la compostera, hay que eliminarlos.', false, 'Son aliados: descomponen y mezclan los restos. Su presencia es señal de una compostera sana.', { // e5
        razones: ['+Porque ayudan a descomponer: son señal de buena salud', '-Porque arruinan el compost', '-Porque transmiten enfermedades a las plantas'],
        d: 1,
      }),
      teoria('Cuándo está listo', [
        'El compost está listo cuando no se reconocen los restos originales (salvo algún trozo duro), tiene color oscuro, olor a tierra de bosque y está a temperatura ambiente. En una compostera casera suele tardar de tres a seis meses. Si hay trozos sin descomponer, se tamizan y vuelven a la compostera.',
      ]),
      mult('¿Qué señales indican que el compost está listo? Marcá todas.', [ // e6
        '+Color oscuro',
        '+Olor a tierra de bosque',
        '+No se reconocen los restos originales',
        '+Está a temperatura ambiente',
        '-Olor fuerte a podrido',
      ], 'Oscuro, fresco, con olor a tierra y sin restos reconocibles.', { d: 1 }),
      numv(3, (i) => { // e7
        const meses = [4, 3, 6][i];
        const sem = 4.3;
        return {
          enunciado: `Si el compost tarda unos ${meses} meses en estar listo, ¿aproximadamente cuántas semanas son? (Usá 4,3 semanas por mes) Redondeá al entero.`,
          valor: Math.round(meses * sem),
          unidad: 'semanas',
          tol: 1,
          explicacion: `${meses} × 4,3 ≈ ${Math.round(meses * sem)} semanas. Mientras tanto, conviene tener una segunda compostera o un segundo compartimento para seguir agregando restos.`,
        };
      }, { d: 1 }),
      ord('Ordená qué hacer para cosechar el compost.', [ // e8
        'Dejar de agregar restos a esa compostera',
        'Esperar a que madure unas semanas',
        'Sacar el compost de abajo, que es el más maduro',
        'Tamizar y devolver los trozos grandes',
        'Usar el compost en macetas o en la huerta',
      ], 'Cosechar bien permite aprovechar todo y reiniciar el ciclo.', { d: 2, extremos: ['Primero', 'Último'] }),
      det('Leé este diagnóstico y marcá lo equivocado.', [ // e9
        ['Hay moscas porque dejamos las cáscaras sin tapar.', false],
        ['Huele mal porque le falta agua: vamos a regarla mucho.', true, 'El olor suele ser exceso de humedad y falta de aire.'],
        ['Hay lombrices, buena señal.', false],
        ['Aparecieron ratas; debe ser por las hojas secas.', true, 'Las ratas suelen venir por carne, lácteos o comida cocida.'],
      ], 'Diagnosticar bien evita soluciones que empeoran el problema.', { d: 3 }),
      comp('Completá.', 'Si hay olor, faltan [secos] y aire; si hay moscas, hay que [cubrir] los restos; y el compost listo huele a [tierra].', ['húmedos', 'regar', 'amoníaco'], 'Tres claves para resolver problemas de la compostera.', { d: 1 }),
      rank('Ordená estos problemas según qué tan fácil es resolverlos, de más fácil a más difícil.', [ // e11
        ['Moscas por restos sin tapar', 'se resuelve en un día'],
        ['Olor por exceso de húmedos', 'se resuelve en días'],
        ['Compost seco que no avanza', 'se resuelve en semanas'],
        ['Roedores por restos de carne', 'requiere cambiar lo que se agrega y proteger la compostera'],
      ], 'Casi todos los problemas tienen solución; cuanto antes se detectan, más fácil.', { d: 2, extremos: ['Más fácil', 'Más difícil'] }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Compostar a escala', 'Composteras de balcón, comunitarias y plantas municipales: cómo el compostaje puede cambiar la basura de una ciudad.', [
      teoria('Sin patio también', [
        'Sin patio se puede compostar en un balcón con una compostera chica o con un vermicompostador, un sistema de cajas donde lombrices, como la lombriz roja, transforman los restos en un abono muy rico llamado lombricompuesto. También se pueden llevar los restos a composteras comunitarias de plazas, escuelas o huertas del barrio.',
      ]),
      clas('¿Qué opción de compostaje conviene en cada situación?', { // e1
        'Compostera en el patio': ['Casa con jardín amplio', 'Familia con huerta en el fondo'],
        'Vermicompostador en el balcón': ['Departamento sin patio', 'Persona que genera pocos restos'],
        'Compostera comunitaria': ['Edificio con vecinos interesados', 'Escuela con un espacio verde'],
      }, 'Hay una opción para casi cualquier vivienda.', { d: 2 }),
      teoria('Compostaje municipal', [
        'Algunas ciudades recolectan los residuos orgánicos por separado y los llevan a plantas de compostaje. A esa escala se pueden tratar también restos de comida cocida, carne y poda, porque se controla la temperatura y el proceso. El compost resultante se usa en plazas, viveros o se vende.',
        'Como los orgánicos son casi la mitad de la basura, separar y compostar a escala municipal puede reducir muchísimo lo que va al relleno.',
      ]),
      cad('Armá la cadena de un sistema de compostaje municipal.', [ // e2
        'Los vecinos separan los orgánicos en casa',
        'Un camión los recolecta por separado',
        'Llegan a una planta de compostaje',
        'Se compostan con control de temperatura',
        'El compost se usa en plazas y huertas',
      ], ['Los orgánicos se entierran junto con el resto de la basura'], 'Separación en origen, recolección diferenciada y tratamiento: el mismo esquema del reciclaje, aplicado a lo orgánico.', { d: 2 }),
      numv(3, (i) => { // e3
        const t = [500, 1000, 200][i];
        const org = [45, 50, 40][i];
        const part = [30, 20, 50][i];
        return {
          enunciado: `Una ciudad genera ${t} toneladas de basura por día; el ${org} % son orgánicos. Si logra compostar el ${part} % de esos orgánicos, ¿cuántas toneladas por día deja de mandar al relleno?`,
          valor: (t * org * part) / 10000,
          unidad: 'toneladas',
          dec: 1,
          explicacion: `${t} × ${org} % = ${(t * org) / 100} t de orgánicos; × ${part} % = ${((t * org * part) / 10000).toLocaleString('es-AR')} t por día que no van al relleno ni producen metano allí.`,
        };
      }, { d: 3 }),
      vf('A escala municipal, con temperatura controlada, se pueden compostar también restos de carne y comida cocida.', true, 'Las plantas industriales alcanzan y mantienen temperaturas altas y controlan el proceso, lo que permite tratar restos que en casa conviene evitar.', { // e4
        razones: ['+Porque controlan la temperatura y el proceso', '-Porque la carne se convierte en vegetal en la planta', '-Porque a escala municipal no hay roedores nunca'],
        d: 2,
      }),
      teoria('Una compostera comunitaria', [
        'Una compostera comunitaria necesita un lugar, algunas personas responsables, reglas claras (qué va y qué no), materiales secos disponibles (por ejemplo, hojas de la poda del barrio) y comunicación con los vecinos. Bien organizada, puede tratar los orgánicos de decenas de familias y producir compost para la plaza o la huerta.',
      ]),
      ord('Ordená los pasos para armar una compostera comunitaria en un edificio.', [ // e5
        'Consultar a los vecinos y a la administración',
        'Elegir un lugar ventilado y accesible',
        'Armar la compostera y conseguir secos',
        'Poner un cartel con qué va y qué no',
        'Organizar turnos para revolver y cuidar',
      ], 'Como cualquier proyecto comunitario: acuerdo, lugar, materiales, reglas y turnos.', { d: 2, extremos: ['Primero', 'Último'] }),
      mult('¿Qué necesita una compostera comunitaria para funcionar bien? Marcá todo.', [ // e6
        '+Reglas claras sobre qué va y qué no',
        '+Materiales secos disponibles',
        '+Personas responsables con turnos',
        '+Comunicación con los vecinos',
        '-Que cada vecino tire lo que quiera sin avisar',
      ], 'Lo técnico es simple; lo organizativo es la clave.', { d: 1 }),
      par('Uní cada escala con una característica.', [ // e7
        ['Compostera casera', 'Solo restos vegetales y secos'],
        ['Vermicompostador', 'Lombrices en cajas, ideal para departamentos'],
        ['Compostera comunitaria', 'Varias familias con turnos compartidos'],
        ['Planta municipal', 'Temperatura controlada y restos de todo tipo'],
      ], 'Distintas escalas, un mismo objetivo: que lo orgánico vuelva al suelo.', { d: 2 }),
      op('¿Por qué separar los orgánicos en origen es clave para el compostaje municipal?', [ // e8
        'Porque mezclado, el compost queda contaminado',
        'Porque así los camiones van más rápido',
        ['Porque los orgánicos separados no pesan', 'Pesan igual; el punto es que lleguen limpios para compostar.'],
        'Porque la ley prohíbe mezclar residuos en la calle',
      ], 'Un compost con restos de vidrio o plástico no sirve para plazas ni huertas. La calidad empieza en casa.', { d: 3 }),
      det('Leé este plan municipal y marcá lo que no conviene.', [ // e9
        ['Recolectaremos los orgánicos por separado dos veces por semana.', false],
        ['Aceptaremos orgánicos mezclados con plásticos para simplificar.', true, 'El compost quedaría contaminado y no serviría.'],
        ['Usaremos el compost en las plazas de la ciudad.', false],
        ['No haremos campañas: los vecinos ya saben qué es orgánico.', true, 'Sin comunicación, la separación falla. Las campañas son clave.'],
      ], 'El compostaje a escala es un sistema: separación, recolección, tratamiento y comunicación.', { d: 3 }),
      comp('Completá.', 'Las lombrices en cajas forman un [vermicompostador]; a escala [municipal] se pueden compostar también restos cocidos; y la clave es separar en [origen].', ['termotanque', 'casera', 'destino'], 'Las escalas del compostaje, en una línea.', { d: 2 }),
      rank('Ordená estas escalas por la cantidad de residuos que pueden tratar, de menos a más.', [ // e11
        ['Vermicompostador de balcón', 'una casa chica'],
        ['Compostera de patio', 'una familia'],
        ['Compostera comunitaria', 'decenas de familias'],
        ['Planta municipal', 'toneladas por día'],
      ], 'Cada escala suma. Una ciudad puede combinarlas todas.', { d: 1, extremos: ['Menos', 'Más'] }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: compostar', 'Proceso, receta, qué va y qué no, problemas y escalas, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: la compostera del edificio', 'Un edificio de 24 departamentos quiere compostar en su patio. Con los números, armá el plan.', [
      teoria('El edificio', [
        'El edificio tiene 24 departamentos. Se sumaron 12 al proyecto. Cada departamento genera unos 3 kg de restos vegetales por semana. En el patio hay lugar para dos composteras de 400 litros. El jardinero del edificio junta hojas secas de dos árboles.',
        'Un kilo de restos de cocina ocupa alrededor de 2 litros, y cada litro de húmedos necesita unos 2 litros de secos.',
      ]),
      num('¿Cuántos kg de restos vegetales por semana juntan los 12 departamentos?', 36, 'kg', '12 × 3 = 36 kg por semana de restos que hoy van a la basura común.', { ctx: '12 departamentos; 3 kg de restos vegetales por semana cada uno.', d: 1 }),
      num('¿Cuántos litros de restos húmedos son por semana? (2 litros por kg)', 72, 'litros', '36 kg × 2 = 72 litros de húmedos por semana.', { ctx: '36 kg de restos por semana; 2 litros por kg.', d: 1 }),
      num('¿Cuántos litros de secos hacen falta por semana para mantener la proporción de 2 a 1?', 144, 'litros', '72 × 2 = 144 litros de secos por semana. Las hojas del jardinero pueden no alcanzar todo el año: conviene guardar hojas del otoño y sumar cartón.', { ctx: '72 litros de húmedos por semana; 2 de secos por cada 1 de húmedos.', d: 2 }),
      op('Con 72 litros de húmedos y 144 de secos por semana, ¿alcanzan dos composteras de 400 litros?', [ // e4
        'Sí, porque el volumen baja mucho al descomponerse',
        'No, se llenan en tres días y hay que tirar todo',
        ['Sí, porque los secos no ocupan lugar', 'Ocupan lugar; lo que ayuda es que todo se reduce mucho al descomponerse.'],
        'No, el compost crece en volumen con el tiempo',
      ], 'Entran 216 litros por semana, pero el volumen se reduce mucho: con dos composteras y buena rotación, alcanza.', { d: 4 }),
      clas('Clasificá las propuestas de la reunión de consorcio.', { // e5
        'Conviene': ['Cartel con qué va y qué no', 'Turnos para revolver', 'Guardar hojas del otoño para todo el año'],
        'No conviene': ['Aceptar restos de asado para que no haya quejas', 'Taparla herméticamente para evitar olores', 'Poner la compostera dentro del hall'],
      }, 'Reglas claras, secos disponibles, aire y un lugar ventilado.', { d: 3 }),
      numv(3, (i) => { // e6
        const kg = [36, 30, 42][i];
        return {
          enunciado: `Si los departamentos compostan ${kg} kg por semana, ¿cuántos kg dejan de ir al relleno en un año de 52 semanas?`,
          valor: kg * 52,
          unidad: 'kg',
          explicacion: `${kg} × 52 = ${(kg * 52).toLocaleString('es-AR')} kg por año: casi ${Math.round((kg * 52) / 100) / 10} toneladas de residuos que se convierten en abono.`,
        };
      }, { d: 2 }),
      det('El consorcio publica las reglas. Marcá lo que no conviene.', [ // e7
        ['Cubrí siempre los restos con hojas secas.', false],
        ['Podés poner huesos y restos de comida cocida sin problema.', true, 'En una compostera de patio atraen roedores y generan olores.'],
        ['Cada semana, un departamento revuelve las composteras.', false],
        ['Si huele mal, echale agua hasta que se vaya el olor.', true, 'El olor suele ser exceso de humedad: hay que sumar secos y airear.'],
      ], 'Buenas reglas evitan los problemas antes de que aparezcan.', { d: 3 }),
    ]),
  ],
});
