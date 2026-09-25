import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// CONSUMO 5 — Consumo, bienestar y suficiencia.
// Qué relación hay entre dinero, cosas y bienestar; las necesidades humanas y
// sus satisfactores según Max-Neef; la suficiencia como estrategia climática;
// la publicidad y las normas sociales; y las soluciones colectivas. Retoma
// comprar menos y mejor (consumo-1), el greenwashing (consumo-2), usar sin
// poseer (consumo-3) y la justicia climática (comunidad-3).

export default unidad({
  slug: 'consumo-5',
  rama: 'consumo',
  orden: 5,
  nivel: 3,
  requiereTronco: 3,
  titulo: 'Consumo, bienestar y suficiencia',
  bajada: 'Qué dice la evidencia sobre dinero, cosas y felicidad, qué necesitamos de verdad y cómo vivir bien usando menos del planeta, sin dejar a nadie sin lo básico.',
  objetivos: [
    'Interpretar la evidencia sobre ingreso, materialismo y bienestar',
    'Distinguir necesidades de satisfactores con el enfoque de Max-Neef',
    'Explicar la suficiencia y diferenciarla de la eficiencia',
    'Analizar cómo la publicidad y las normas sociales moldean el consumo',
    'Proponer soluciones colectivas que den bienestar con menos recursos',
  ],
  repasa: ['consumo-1', 'consumo-2', 'consumo-3', 'comunidad-3'],
  fuentes: ['killingsworth-2023', 'dittmar-2014', 'dunn-2011', 'max-neef-1989', 'oneill-2018', 'dona-raworth', 'ipcc-ar6-demanda', 'francia-publicidad-fosil', 'haya-publicidad-fosil', 'oxfam-clima-2023'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Dinero, cosas y bienestar', 'Qué dice la investigación sobre ingresos, felicidad, adaptación y materialismo.', [
      teoria('Cada peso suma menos', [
        'Las encuestas de bienestar muestran que el ingreso importa, pero de una forma particular: la satisfacción crece aproximadamente con cada duplicación del ingreso, no con cada peso. Pasar de no llegar a fin de mes a cubrir lo básico cambia mucho la vida; sumar la misma cantidad a un ingreso alto cambia bastante menos.',
        'En 2023, investigadores que habían llegado a conclusiones opuestas publicaron juntos un análisis: para la mayoría de las personas, el bienestar sigue aumentando con el ingreso más allá de los 100.000 dólares anuales; para una minoría infeliz, deja de mejorar alrededor de ese nivel.',
      ]),
      numv(3, (i) => { // e1
        const [de, a, dup] = [[250000, 1000000, 2], [100000, 800000, 3], [150000, 2400000, 4]][i];
        return {
          enunciado: `Supongamos que la satisfacción con la vida sube medio punto cada vez que el ingreso se duplica. ¿Cuántos puntos sube si el ingreso pasa de ${de.toLocaleString('es-AR')} a ${a.toLocaleString('es-AR')} pesos por mes?`,
          valor: dup * 0.5,
          unidad: 'puntos',
          dec: 1,
          explicacion: `De ${de.toLocaleString('es-AR')} a ${a.toLocaleString('es-AR')} hay ${dup} duplicaciones; ${dup} × 0,5 = ${(dup * 0.5).toLocaleString('es-AR')} puntos. Valores de ejemplo: para sumar lo mismo, cada vez hace falta el doble de dinero.`,
          ctx: `De ${de} a ${a} pesos; 0,5 puntos por duplicación.`,
        };
      }, { d: 3 }),
      op('Un aumento de 100.000 pesos por mes, ¿a quién suele cambiarle más la vida?', [ // e2
        'A un hogar que gana 300.000 que a uno que gana 3.000.000',
        'A un hogar que gana 3.000.000 que a uno que gana 300.000',
        ['A los dos exactamente igual, porque es la misma plata', 'La misma suma pesa distinto según cuánto se tenía.'],
        'A ninguno, porque el dinero no influye en el bienestar',
      ], 'Por eso las mejoras de ingreso en los hogares que no cubren lo básico tienen un efecto tan grande.', { d: 2 }),
      teoria('La cinta que no para', [
        'Nos acostumbramos rápido a lo nuevo: el celular recién comprado entusiasma unas semanas y después pasa a ser "el celular". Es la adaptación hedónica. Además, muchas veces medimos lo que tenemos comparándonos con otros. Juntas, adaptación y comparación empujan a querer siempre un poco más.',
        'Un metaanálisis de 2014, con 259 muestras, encontró que las personas con valores más materialistas tienden a reportar menos bienestar. Es una asociación consistente, aunque por sí sola no prueba cuál de las dos cosas causa la otra.',
      ]),
      cad('Armá la cadena de la adaptación hedónica.', [ // e3
        'Comprás algo que deseabas mucho',
        'Al principio da mucha satisfacción',
        'Con las semanas te acostumbrás',
        'La satisfacción vuelve a su nivel de antes',
        'Aparece el deseo de la próxima compra',
      ], ['La satisfacción de una compra crece con el tiempo'], 'Conocer este mecanismo ayuda a decidir antes de comprar.', { d: 2 }),
      op('El metaanálisis de 2014 encontró que el materialismo va junto con menos bienestar. ¿Qué se puede concluir?', [ // e4
        'Que van juntos, aunque no prueba cuál causa cuál',
        'Que comprar cosas causa siempre infelicidad',
        ['Que ser infeliz hace comprar más, sin ninguna duda', 'Es posible, pero una asociación no alcanza para afirmarlo.'],
        'Que el estudio no sirve porque usó muchas muestras',
      ], 'Correlación no es causa, como viste en ciencia: la evidencia es sólida, pero hay que leerla con cuidado.', { d: 3 }),
      vf('Según la evidencia, el dinero no tiene ninguna relación con el bienestar.', false, 'Sí tiene relación: el bienestar crece con el ingreso, sobre todo cuando permite cubrir necesidades. Lo que muestra la evidencia es que cada peso extra suma menos, y que no todos los usos del dinero dan lo mismo.', {
        razones: ['+Porque el bienestar crece con el ingreso, aunque cada peso sume menos', '-Porque la felicidad no se puede medir', '-Porque las personas ricas son siempre infelices'],
        d: 1,
      }),
      teoria('Cómo se gasta también importa', [
        'Una revisión de 2011 sobre cómo gastar para estar mejor recogió varios hallazgos: las experiencias compartidas suelen dar más satisfacción duradera que los objetos, gastar en otras personas suele hacer sentir mejor que gastar en uno mismo, y usar el dinero para ganar tiempo libre también ayuda. No son reglas absolutas, pero van en contra de la idea de que más cosas es igual a más bienestar.',
      ]),
      clas('Según la investigación, ¿qué suele dar satisfacción más duradera y qué suele desvanecerse rápido?', { // e5
        'Satisfacción más duradera': ['Compartir una experiencia con amigos', 'Hacer un regalo o ayudar a alguien', 'Ganar tiempo libre para lo que te gusta'],
        'Se desvanece rápido': ['Cambiar un celular que todavía funciona', 'Un objeto caro para mostrar', 'Acumular ropa que casi no se usa'],
      }, 'No se trata de no gastar, sino de gastar en lo que de verdad suma.', { d: 2 }),
      numv(3, (i) => { // e6
        const [precio, hora] = [[120000, 4000], [300000, 5000], [90000, 3000]][i];
        return {
          enunciado: `Un producto cuesta ${precio.toLocaleString('es-AR')} pesos. Si ganás ${hora.toLocaleString('es-AR')} pesos por hora de trabajo, ¿cuántas horas de trabajo cuesta?`,
          valor: precio / hora,
          unidad: 'horas',
          explicacion: `${precio.toLocaleString('es-AR')} ÷ ${hora.toLocaleString('es-AR')} = ${precio / hora} horas. Pensar los precios en horas de vida ayuda a decidir si una compra vale la pena.`,
          ctx: `Precio de ${precio} pesos; ${hora} pesos por hora.`,
        };
      }, { d: 1 }),
      mult('¿Qué señales muestran que una compra puede caer en la adaptación hedónica? Marcá todas.', [ // e7
        '+Ya tenés algo que cumple la misma función',
        '+La querés sobre todo porque otros la tienen',
        '+Tu entusiasmo con la compra anterior duró poco',
        '+La publicidad te la mostró muchas veces esta semana',
        '-Reemplaza algo roto que usás todos los días',
      ], 'Reconocer estas señales permite frenar antes de una compra que no va a sumar.', { d: 2 }),
      det('Leé este posteo de un influencer y marcá lo que no se sostiene con la evidencia.', [ // e8
        ['El dinero ayuda al bienestar, sobre todo cuando cubre lo básico.', false],
        ['Cada compra nueva te va a hacer más feliz para siempre.', true, 'Por la adaptación hedónica, la satisfacción suele volver a su nivel anterior.'],
        ['Compartir experiencias suele dejar recuerdos más duraderos que los objetos.', false],
        ['Está probado que comprar cosas causa depresión.', true, 'La evidencia muestra una asociación con el materialismo, no una causa probada.'],
      ], 'Ni "el dinero no importa" ni "comprar hace feliz": la evidencia es más interesante.', { d: 2 }),
      comp('Completá.', 'Acostumbrarse rápido a lo nuevo es la adaptación [hedónica]; el bienestar crece aproximadamente con cada [duplicación] del ingreso; y los valores más materialistas se asocian con [menos] bienestar.', ['estética', 'moneda', 'más'], 'Tres ideas para pensar la relación entre consumo y bienestar.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Necesidades y satisfactores', 'El aporte latinoamericano de Max-Neef: pocas necesidades humanas, muchas formas de satisfacerlas.', [
      teoria('Pocas necesidades', [
        'En 1986, el economista chileno Manfred Max-Neef, junto con Antonio Elizalde y Martín Hopenhayn, propuso el enfoque del Desarrollo a Escala Humana. Su idea central: las necesidades humanas fundamentales son pocas, finitas y las mismas en todas las culturas y épocas. Lo que cambia es la forma de satisfacerlas, a la que llamaron satisfactores.',
        'Propusieron nueve necesidades: subsistencia, protección, afecto, entendimiento, participación, ocio, creación, identidad y libertad.',
      ]),
      est('¿Cuántas necesidades humanas fundamentales propone el enfoque de Max-Neef?', 9, { min: 1, max: 30, paso: 1, unidad: 'necesidades' }, 'Nueve: subsistencia, protección, afecto, entendimiento, participación, ocio, creación, identidad y libertad.', { d: 1 }),
      par('Uní cada necesidad con un satisfactor posible.', [ // e1
        ['Subsistencia', 'Alimentación y abrigo'],
        ['Entendimiento', 'Una escuela o una biblioteca'],
        ['Participación', 'Una asamblea vecinal'],
        ['Ocio', 'Tiempo libre y juegos'],
        ['Identidad', 'Costumbres y memoria de la comunidad'],
      ], 'Cada necesidad puede satisfacerse de muchas maneras, con más o menos recursos.', { d: 2 }),
      vf('Según Max-Neef, las necesidades humanas cambian con cada moda.', false, 'Las necesidades son las mismas en todas las culturas y épocas; lo que cambia con las modas y las sociedades son los satisfactores, es decir, las formas de satisfacerlas.', {
        razones: ['+Porque lo que cambia son los satisfactores, no las necesidades', '-Porque las necesidades las define la publicidad', '-Porque cada persona tiene necesidades completamente distintas'],
        d: 2,
      }),
      teoria('Satisfactores que suman y que engañan', [
        'Algunos satisfactores son sinérgicos: satisfacen varias necesidades a la vez. Una huerta comunitaria, por ejemplo, aporta alimento (subsistencia), encuentro (afecto), aprendizaje (entendimiento), decisiones compartidas (participación) y pertenencia (identidad). Otros son pseudosatisfactores: dan una sensación de satisfacer una necesidad sin hacerlo de verdad, como una marca que promete "identidad" o "libertad" a través de un producto.',
      ]),
      op('¿Por qué una huerta comunitaria es un satisfactor sinérgico?', [ // e2
        'Porque satisface varias necesidades a la vez',
        'Porque produce más alimento que cualquier campo',
        ['Porque reemplaza la necesidad de comer', 'No la reemplaza: la satisface junto con otras.'],
        'Porque es la forma más cara de conseguir verduras',
      ], 'Los satisfactores sinérgicos son claves para vivir bien con pocos recursos.', { d: 2 }),
      clas('¿Es un satisfactor sinérgico o un pseudosatisfactor?', { // e3
        'Sinérgico': ['Una huerta comunitaria', 'Un club de barrio con deportes y talleres', 'Una biblioteca popular'],
        'Pseudosatisfactor': ['Una marca que promete "ser alguien" con su producto', 'Seguidores comprados en una red social', 'Un auto caro para sentirse libre'],
      }, 'Los pseudosatisfactores prometen mucho y dejan la necesidad sin cubrir.', { d: 2 }),
      cad('Armá la cadena de cómo un pseudosatisfactor alimenta el consumo.', [ // e4
        'Una publicidad asocia un producto con la identidad',
        'Alguien lo compra para sentirse parte',
        'La necesidad de identidad no queda satisfecha',
        'Aparece otro producto que promete lo mismo',
        'Se compra más sin resolver la necesidad',
      ], ['Un pseudosatisfactor cubre la necesidad para siempre'], 'Cuando el satisfactor no es el adecuado, el consumo se vuelve un círculo.', { d: 2 }),
      mult('¿Qué satisfactores pueden cubrir la necesidad de afecto con pocos recursos materiales? Marcá todos.', [ // e5
        '+Compartir una comida con amistades',
        '+Participar en un grupo de interés común',
        '+Cuidar a alguien de la familia',
        '+Una tarde de mates en la plaza',
        '-Comprar regalos cada vez más caros para demostrar cariño',
      ], 'Muchas necesidades se satisfacen mejor con vínculos que con cosas.', { d: 1 }),
      numv(3, (i) => { // e6
        const [personas, cuota] = [[20, 5000], [30, 4000], [15, 8000]][i];
        return {
          enunciado: `Un club de barrio cobra ${cuota.toLocaleString('es-AR')} pesos por mes a cada una de sus ${personas} familias socias y ofrece deporte, talleres y encuentros. ¿Cuánto recauda por mes para sostener esas actividades?`,
          valor: personas * cuota,
          unidad: 'pesos',
          explicacion: `${personas} × ${cuota.toLocaleString('es-AR')} = ${(personas * cuota).toLocaleString('es-AR')} pesos por mes. Compartidos, los satisfactores sinérgicos suelen costar mucho menos por persona que resolver cada necesidad por separado.`,
          ctx: `${personas} familias; cuota de ${cuota} pesos.`,
        };
      }, { d: 1 }),
      par('Uní cada necesidad con un pseudosatisfactor que promete cubrirla.', [ // e7
        ['Protección', 'Comprar productos por miedo que genera la publicidad'],
        ['Libertad', 'Un auto que "te lleva a donde quieras" en un embotellamiento'],
        ['Identidad', 'La marca de moda que "te define"'],
        ['Afecto', 'Muchos "me gusta" en lugar de vínculos cercanos'],
      ], 'Detectar la necesidad detrás del deseo ayuda a buscar un satisfactor mejor.', { d: 3 }),
      det('Leé este texto escolar y marcá lo que no coincide con el enfoque de Max-Neef.', [ // e8
        ['Las necesidades fundamentales son las mismas en todas las culturas.', false],
        ['Cada generación inventa necesidades nuevas, como tener el último celular.', true, 'El celular es un satisfactor posible; las necesidades no cambian.'],
        ['Una huerta comunitaria puede satisfacer varias necesidades a la vez.', false],
        ['Las necesidades solo se satisfacen comprando productos.', true, 'Hay satisfactores sociales, culturales y comunitarios que no pasan por comprar.'],
      ], 'El enfoque de Max-Neef separa lo que necesitamos de las formas de conseguirlo.', { d: 2 }),
      comp('Completá.', 'Según Max-Neef, las necesidades son pocas y [finitas]; las formas de satisfacerlas se llaman [satisfactores]; y los que cubren varias necesidades a la vez son [sinérgicos].', ['infinitas', 'consumidores', 'aislados'], 'Tres conceptos del Desarrollo a Escala Humana.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Suficiencia', 'Vivir bien dentro de los límites del planeta: qué es la suficiencia y en qué se diferencia de la eficiencia.', [
      teoria('Una buena vida para todos', [
        'Un estudio de 2018 comparó, en más de 150 países, cuánto cubren las necesidades básicas de su población y cuántos recursos usan. Encontró que ningún país lograba cubrir las necesidades básicas de su gente con un uso de recursos sostenible a escala global. Y que, con las relaciones actuales, lograr metas como una alta satisfacción con la vida para todo el mundo requeriría entre 2 y 6 veces el uso de recursos sostenible.',
        'La economista Kate Raworth lo resume con la imagen de una dona: un piso social, por debajo del cual nadie debería quedar, y un techo ecológico, por encima del cual se dañan los sistemas que sostienen la vida. El espacio seguro y justo está entre los dos.',
      ]),
      op('¿Qué representa el espacio entre el borde interno y el externo de la "dona"?', [ // e1
        'Donde todos cubren sus necesidades sin exceder el planeta',
        'El nivel de consumo de los países más ricos del mundo',
        ['La zona donde el consumo no tiene ningún límite', 'Tiene dos límites: el piso social y el techo ecológico.'],
        'La cantidad de recursos que sobran para exportar',
      ], 'El desafío no es solo reducir: es subir a quienes están por debajo del piso sin atravesar el techo.', { d: 2 }),
      teoria('Qué es la suficiencia', [
        'El IPCC define las políticas de suficiencia como un conjunto de medidas y prácticas cotidianas que evitan demanda de energía, materiales, tierra y agua, mientras dan bienestar a todas las personas dentro de los límites del planeta. La eficiencia hace lo mismo con menos energía, como una heladera que consume menos; la suficiencia ajusta el servicio a lo que se necesita, como una heladera del tamaño justo, o compartir un freezer.',
        'Según el IPCC, las medidas del lado de la demanda, que incluyen suficiencia, eficiencia e infraestructura, podrían reducir entre un 40 y un 70 % las emisiones de los edificios, el transporte terrestre y la alimentación hacia 2050, respecto de las tendencias.',
      ], { destacado: { valor: '40 a 70 %', texto: 'podrían bajar hacia 2050 las emisiones de edificios, transporte y alimentación con medidas del lado de la demanda, según el IPCC.' } }),
      clas('¿Es una medida de eficiencia o de suficiencia?', { // e2
        'Eficiencia': ['Cambiar a lámparas LED', 'Un auto que consume menos por km', 'Aislar las paredes de la casa'],
        'Suficiencia': ['Una vivienda del tamaño que se necesita', 'Compartir herramientas entre vecinos', 'Vivir cerca del trabajo para no depender del auto'],
      }, 'Las dos se complementan: la eficiencia sin suficiencia puede terminar en rebote.', { d: 2 }),
      cad('Armá la cadena de cómo la eficiencia sola puede no alcanzar.', [ // e3
        'Las heladeras nuevas consumen menos por litro',
        'Las heladeras se hacen cada vez más grandes',
        'Muchos hogares suman un segundo freezer',
        'El consumo total de energía casi no baja',
        'Hace falta también ajustar el tamaño a lo necesario',
      ], ['Las heladeras eficientes siempre bajan el consumo total'], 'Eficiencia y suficiencia juntas logran lo que ninguna logra sola.', { d: 2 }),
      numv(3, (i) => { // e4
        const [kwh, base, p1, p2] = [[250, 150, 100, 300], [400, 150, 100, 300], [200, 150, 120, 360]][i];
        const total = Math.min(kwh, base) * p1 + Math.max(0, kwh - base) * p2;
        return {
          enunciado: `Una tarifa de luz cobra los primeros ${base} kWh del mes a ${p1} pesos y cada kWh extra a ${p2} pesos. ¿Cuánto paga un hogar que consume ${kwh} kWh?`,
          valor: total,
          unidad: 'pesos',
          explicacion: `${base} × ${p1} = ${(base * p1).toLocaleString('es-AR')}; ${kwh - base} × ${p2} = ${((kwh - base) * p2).toLocaleString('es-AR')}; total ${total.toLocaleString('es-AR')} pesos. Una tarifa escalonada abarata lo básico y encarece el exceso: una herramienta de suficiencia.`,
          ctx: `${kwh} kWh; ${base} kWh a ${p1} y el resto a ${p2}.`,
        };
      }, { d: 2 }),
      est('Estimá el porcentaje máximo en que podrían bajar hacia 2050 las emisiones de edificios, transporte y alimentación con medidas del lado de la demanda, según el IPCC.', 70, { min: 0, max: 100, paso: 5, unidad: '%' }, 'Entre un 40 y un 70 %, según el IPCC: un potencial enorme que no depende solo de nuevas tecnologías.', { d: 2 }),
      vf('La suficiencia significa que todas las personas tienen que consumir menos.', false, 'Significa ajustar el consumo al bienestar. Quienes consumen muy por encima de sus necesidades pueden reducir; quienes están por debajo del piso social necesitan más acceso a energía, vivienda y alimentos.', {
        razones: ['+Porque quienes están por debajo del piso social necesitan más', '-Porque la suficiencia prohíbe todo consumo', '-Porque solo aplica a los países pobres'],
        d: 2,
      }),
      numv(3, (i) => { // e5
        const [m2, per] = [[120, 2], [60, 3], [200, 4]][i];
        return {
          enunciado: `Una vivienda de ${m2} m² tiene ${per} habitantes. ¿Cuántos m² hay por persona?`,
          valor: m2 / per,
          unidad: 'm² por persona',
          explicacion: `${m2} ÷ ${per} = ${m2 / per} m² por persona. Más metros por persona suelen significar más materiales para construir y más energía para calefaccionar y enfriar.`,
          ctx: `${m2} m²; ${per} habitantes.`,
        };
      }, { d: 1 }),
      par('Uní cada ámbito con una práctica de suficiencia.', [ // e6
        ['Vivienda', 'Espacios compartidos, como lavaderos o terrazas comunes'],
        ['Transporte', 'Barrios con servicios a distancia caminable'],
        ['Alimentación', 'Comprar lo que se va a comer y aprovechar sobras'],
        ['Objetos', 'Reparar y usar las cosas durante más tiempo'],
      ], 'La suficiencia aparece en todos los ámbitos de la vida cotidiana.', { d: 1 }),
      mult('¿Qué políticas públicas facilitan la suficiencia? Marcá todas.', [ // e7
        '+Tarifas que abaratan lo básico y encarecen el exceso',
        '+Normas de diseño para productos más durables',
        '+Espacios y equipamientos compartidos en los barrios',
        '+Planificación urbana con servicios cercanos',
        '-Subsidiar que cada hogar tenga más de un auto',
      ], 'La suficiencia es más fácil cuando las reglas y la infraestructura la hacen natural.', { d: 2 }),
      det('Leé esta columna de opinión y marcá lo que conviene revisar.', [ // e8
        ['La eficiencia es necesaria pero no alcanza sola.', false],
        ['Suficiencia es obligar a todos a vivir con lo mínimo.', true, 'Busca bienestar para todos: algunos reducen y otros acceden a más.'],
        ['El IPCC reconoce el potencial de las medidas del lado de la demanda.', false],
        ['Algún país ya cubre las necesidades de todos con recursos sostenibles.', true, 'El estudio de 2018 no encontró ningún país que lo lograra.'],
      ], 'La suficiencia no es austeridad forzada: es bienestar con menos recursos.', { d: 2 }),
      comp('Completá.', 'Hacer lo mismo con menos energía es [eficiencia]; ajustar el servicio a lo que de verdad se necesita es [suficiencia]; y el modelo de la dona combina un piso social con un techo [ecológico].', ['abundancia', 'austeridad', 'económico'], 'Tres ideas para pensar un consumo que alcance para todos.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Publicidad y normas sociales', 'Cómo nos empujan a consumir los anuncios y lo que hacen los demás, y qué límites se están poniendo.', [
      teoria('El mensaje que se repite', [
        'La publicidad no solo informa: busca crear deseos, asociar productos con emociones, estatus o identidad, y repetirse hasta volverse familiar. Las niñas y los niños son especialmente vulnerables, porque todavía no distinguen bien un anuncio de un contenido. En redes sociales, los anuncios se mezclan con publicaciones de personas y se ajustan a cada usuario.',
      ]),
      numv(3, (i) => { // e1
        const [dia, dias] = [[50, 30], [120, 30], [80, 365]][i];
        return {
          enunciado: `Si una persona ve unos ${dia} anuncios por día entre redes, calle y pantallas, ¿cuántos ve en ${dias} días?`,
          valor: dia * dias,
          unidad: 'anuncios',
          explicacion: `${dia} × ${dias} = ${(dia * dias).toLocaleString('es-AR')} anuncios. Valores de ejemplo: la repetición es parte central de cómo funciona la publicidad.`,
          ctx: `${dia} anuncios por día; ${dias} días.`,
        };
      }, { d: 1 }),
      clas('¿Qué técnica publicitaria usa cada anuncio?', { // e2
        'Estatus': ['"El auto de quienes llegaron lejos"', '"La edición exclusiva que pocos tienen"'],
        'Urgencia': ['"Solo por hoy: 50 % de descuento"', '"Quedan 3 unidades"'],
        'Pertenencia': ['"Todos tus amigos ya lo usan"', '"Sumate a la comunidad de la marca"'],
      }, 'Reconocer la técnica ayuda a separar el deseo creado de la necesidad real.', { d: 2 }),
      teoria('Lo que hacen los demás', [
        'Además de los anuncios, nos influye lo que vemos hacer a otras personas: las normas sociales. Pueden empujar a consumir más, cuando lo "normal" es cambiar de celular cada año, o ayudar a consumir menos, como en el experimento de las cartas que comparaban el consumo eléctrico con el de los vecinos, que viste en ciencia. El consumo para mostrar estatus, que el economista Thorstein Veblen llamó "consumo conspicuo" a fines del siglo XIX, sigue muy presente.',
      ]),
      cad('Armá la cadena de cómo una norma social puede aumentar el consumo.', [ // e3
        'En un grupo, cambiar de celular cada año se vuelve lo normal',
        'Quien tiene uno viejo se siente fuera de lugar',
        'Lo cambia aunque todavía funcione',
        'Se refuerza la idea de que "todos" lo cambian',
        'Crecen el consumo y los residuos electrónicos',
      ], ['Las normas sociales solo influyen en quienes ven publicidad'], 'Las normas se contagian, y por eso también se pueden cambiar.', { d: 2 }),
      op('¿Qué es el "consumo conspicuo"?', [ // e4
        'Comprar para mostrar estatus ante los demás',
        'Comprar solo lo que se necesita para vivir',
        ['Comprar productos de segunda mano', 'Es casi lo contrario: el objetivo es exhibir.'],
        'Comprar productos que no tienen marca',
      ], 'Cuando el objetivo es mostrar, ninguna compra alcanza: siempre hay algo más visible.', { d: 1 }),
      vf('Las normas sociales solo pueden empujar a consumir más.', false, 'También pueden empujar a consumir menos o mejor: ver que los vecinos ahorran energía, reparan o comparten cambia lo que parece normal.', {
        razones: ['+Porque también pueden hacer normal ahorrar, reparar o compartir', '-Porque las personas nunca copian a otras', '-Porque las normas sociales no existen'],
        d: 1,
      }),
      teoria('Poner límites', [
        'Algunos países y ciudades empezaron a limitar la publicidad de lo que más contamina. En Francia, desde agosto de 2022 está prohibida la publicidad de combustibles fósiles, por la ley de Clima y Resiliencia. La Haya, en los Países Bajos, fue la primera ciudad en prohibir por ley, desde enero de 2025, los anuncios de combustibles fósiles, autos a nafta y diésel, vuelos y cruceros en el espacio público; en 2025 un tribunal confirmó la medida.',
      ]),
      op('¿Qué hizo La Haya desde enero de 2025?', [ // e5
        'Prohibir en la vía pública anuncios fósiles, de vuelos y cruceros',
        'Prohibir toda la publicidad de cualquier producto en la ciudad',
        ['Obligar a anunciar solo autos a combustión', 'Es al revés: los autos a nafta y diésel quedaron entre los anuncios prohibidos.'],
        'Cobrar un impuesto a quienes miran publicidad en la calle',
      ], 'Es de las primeras normas que tratan la publicidad como parte de la política climática, y un tribunal la confirmó.', { d: 2 }),
      mult('¿Qué ayuda a consumir con más autonomía frente a la publicidad? Marcá todo.', [ // e6
        '+Esperar unos días antes de una compra no planificada',
        '+Desactivar notificaciones de ofertas',
        '+Preguntarse qué necesidad hay detrás del deseo',
        '+Reconocer las técnicas de urgencia y estatus',
        '-Comprar siempre en el momento de la oferta para no perderla',
      ], 'Ganar tiempo entre el deseo y la compra es de las herramientas más efectivas.', { d: 1 }),
      ord('Ordená una forma de decidir una compra no planificada.', [ // e7
        'Notar el deseo y qué lo disparó',
        'Preguntarse qué necesidad hay detrás',
        'Esperar unos días',
        'Revisar si hay otra forma de cubrirla: pedir, reparar, compartir',
        'Si todavía hace falta, comprar con criterio',
      ], 'No se trata de no comprar nunca, sino de que la decisión sea propia.', { d: 2 }),
      det('Leé este anuncio y marcá las frases que usan técnicas de presión.', [ // e8
        ['Zapatillas de running con suela reparable.', false],
        ['Solo quedan 2 pares: comprá ya antes de que se agoten.', true, 'Urgencia: presiona para decidir sin pensar.'],
        ['Talles del 35 al 45.', false],
        ['Las que usan los que marcan la diferencia.', true, 'Estatus: asocia el producto con ser superior a otros.'],
      ], 'Separar información de presión cambia cómo se lee cualquier anuncio.', { d: 2 }),
      comp('Completá.', 'Comprar para mostrar estatus es el consumo [conspicuo]; lo que vemos hacer a los demás funciona como una norma [social]; y Francia prohibió en 2022 la publicidad de combustibles [fósiles].', ['invisible', 'legal', 'renovables'], 'Tres ideas para entender qué nos empuja a consumir.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Lo colectivo', 'Bibliotecas de objetos, espacios compartidos, tiempo y justicia: bienestar con menos recursos no es solo una decisión individual.', [
      teoria('Lo que se comparte', [
        'Muchos consumos privados se pueden reemplazar por bienes compartidos que dan el mismo servicio con muchos menos recursos: una plaza en vez de muchos patios, una biblioteca en vez de muchos libros sin leer, un transporte público en vez de muchos autos, una biblioteca de herramientas en vez de un taladro en cada casa. Cuando lo común es bueno, lo privado puede ser más chico sin perder bienestar.',
      ]),
      numv(3, (i) => { // e1
        const [hogares, precio, compartidos] = [[30, 60000, 3], [50, 80000, 4], [20, 45000, 2]][i];
        const ahorro = (hogares - compartidos) * precio;
        return {
          enunciado: `En un barrio, ${hogares} hogares necesitan un taladro de vez en cuando. Cada uno cuesta ${precio.toLocaleString('es-AR')} pesos. Si una biblioteca de herramientas compra ${compartidos} para prestar, ¿cuánto se ahorra el barrio en total?`,
          valor: ahorro,
          unidad: 'pesos',
          explicacion: `(${hogares} − ${compartidos}) × ${precio.toLocaleString('es-AR')} = ${ahorro.toLocaleString('es-AR')} pesos, y ${hogares - compartidos} taladros menos que fabricar. Compartir lo que se usa poco es de lo más eficiente que hay.`,
          ctx: `${hogares} hogares; taladro de ${precio} pesos; ${compartidos} compartidos.`,
        };
      }, { d: 2 }),
      clas('¿Qué bien compartido puede reemplazar cada consumo privado?', { // e2
        'Biblioteca de objetos': ['Una escalera que se usa dos veces por año', 'Una carpa para una sola salida'],
        'Espacio público': ['Un patio grande que casi no se usa', 'Una pileta en cada casa'],
        'Transporte compartido': ['Un segundo auto familiar', 'Un auto para ir solo al centro'],
      }, 'Cada bien compartido resuelve muchas necesidades individuales a la vez.', { d: 2 }),
      teoria('Tiempo y justicia', [
        'Consumir menos también puede significar necesitar menos ingresos, y por lo tanto, en algunos casos, trabajar menos horas y ganar tiempo. Pero no hay que romantizarlo: para muchos hogares el problema no es el exceso, sino no llegar a lo básico. La suficiencia es una cuestión de justicia: como viste con la justicia climática, el 10 % más rico del mundo genera cerca de la mitad de las emisiones del consumo, y ahí está el mayor margen para reducir.',
      ]),
      vf('La suficiencia exige lo mismo a un hogar que no llega a fin de mes que a uno que consume en exceso.', false, 'La suficiencia es una cuestión de justicia: el mayor margen para reducir está en quienes consumen muy por encima de sus necesidades, mientras otros necesitan acceder a más.', {
        razones: ['+Porque el margen para reducir está en quienes consumen en exceso', '-Porque los hogares pobres emiten más que los ricos', '-Porque la suficiencia no tiene nada que ver con la justicia'],
        d: 2,
      }),
      numv(3, (i) => { // e3
        const [horas, semanas] = [[4, 4], [2, 4], [8, 4]][i];
        return {
          enunciado: `Si una persona reduce su jornada ${horas} horas por semana, ¿cuántas horas libres gana en ${semanas} semanas?`,
          valor: horas * semanas,
          unidad: 'horas',
          explicacion: `${horas} × ${semanas} = ${horas * semanas} horas por mes para descansar, cuidar, estudiar o participar: satisfactores de varias necesidades a la vez.`,
          ctx: `${horas} horas menos por semana; ${semanas} semanas.`,
        };
      }, { d: 1 }),
      cad('Armá la cadena de cómo un bien público puede reducir el consumo privado.', [ // e4
        'El barrio tiene una plaza con sombra y juegos',
        'Las familias la usan todos los días',
        'Necesitan menos espacio propio para el ocio',
        'Construyen y equipan menos por su cuenta',
        'Se usan menos recursos con el mismo bienestar',
      ], ['Los bienes públicos aumentan siempre el consumo privado'], 'Los bienes comunes son una de las herramientas más potentes de la suficiencia.', { d: 2 }),
      op('¿Por qué la suficiencia no es solo una decisión individual?', [ // e5
        'Porque depende de la infraestructura, las reglas y lo común',
        'Porque las personas no pueden decidir nada sobre su consumo',
        ['Porque solo los gobiernos consumen recursos', 'Los hogares también; pero sus opciones dependen del entorno.'],
        'Porque la suficiencia la deciden las empresas en secreto',
      ], 'Sin transporte público, espacios comunes y reglas adecuadas, elegir menos es mucho más difícil.', { d: 2 }),
      par('Uní cada iniciativa con lo que aporta.', [ // e6
        ['Biblioteca de herramientas', 'Menos objetos comprados y guardados'],
        ['Taller comunitario de reparación', 'Cosas que duran más'],
        ['Huerta del barrio', 'Alimento, encuentro y aprendizaje'],
        ['Club o centro cultural', 'Ocio y pertenencia sin gastar tanto'],
      ], 'Lo colectivo multiplica los satisfactores sinérgicos.', { d: 1 }),
      mult('¿Qué hace falta para que una biblioteca de objetos funcione? Marcá todo.', [ // e7
        '+Un lugar accesible y horarios claros',
        '+Un registro de préstamos y devoluciones',
        '+Mantenimiento de los objetos',
        '+Personas que la organicen y la difundan',
        '-Que cada objeto se preste una sola vez',
      ], 'Lo común necesita organización: por eso las comunidades son tan importantes.', { d: 1 }),
      det('Leé este proyecto vecinal y marcá lo que conviene revisar.', [ // e8
        ['Armaremos una biblioteca de herramientas en el club.', false],
        ['Todos los vecinos deberán reducir su consumo a la mitad, sin excepción.', true, 'Hay hogares que no cubren lo básico: la suficiencia no exige lo mismo a todos.'],
        ['Llevaremos un registro de préstamos.', false],
        ['No hace falta que nadie se ocupe del mantenimiento.', true, 'Sin mantenimiento, los objetos compartidos se rompen y el sistema falla.'],
      ], 'Un buen proyecto colectivo es justo, organizado y sostenible en el tiempo.', { d: 2 }),
      comp('Completá.', 'Prestar herramientas entre vecinos es una biblioteca de [objetos]; una plaza puede reemplazar muchos patios porque es un bien [público]; y el mayor margen para reducir emisiones está en quienes más [consumen].', ['monedas', 'privado', 'ahorran'], 'Tres ideas para pasar de lo individual a lo colectivo.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: consumo y bienestar', 'Dinero y bienestar, necesidades y satisfactores, suficiencia, publicidad y lo colectivo, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el aumento de Julián', 'Julián consiguió un aumento de sueldo y no sabe qué hacer con él. Ayudalo a decidir con lo que aprendiste.', [
      teoria('La situación', [
        'Julián gana 5.000 pesos por hora y trabaja 40 horas por semana. Le ofrecen un aumento del 20 %. Tiene tres ideas: A, sacar un auto nuevo en cuotas de 400.000 pesos por mes, aunque el suyo funciona; B, mantener el ingreso actual y trabajar menos horas; C, usar parte del aumento para un viaje con amistades y ahorrar el resto. Vive cerca de una línea de colectivo y su club de barrio tiene talleres que siempre quiso hacer.',
      ]),
      num('Con el aumento del 20 %, ¿cuánto gana Julián por hora?', 6000, 'pesos por hora', '5.000 × 1,2 = 6.000 pesos por hora: un 20 % más por cada hora trabajada.', { ctx: '5.000 pesos por hora; aumento del 20 %.', d: 1 }),
      num('¿Cuántas horas de trabajo por mes cuesta la cuota del auto con el nuevo sueldo? Redondeá al entero.', 67, 'horas', '400.000 ÷ 6.000 ≈ 67 horas por mes: más de una semana y media de trabajo cada mes para cambiar un auto que funciona.', { ctx: 'Cuota de 400.000 pesos; 6.000 pesos por hora.', tol: 1, d: 2 }),
      num('Si elige la opción B y quiere ganar lo mismo que antes (200.000 pesos por semana), ¿cuántas horas por semana tendría que trabajar? Redondeá a un decimal.', 33.3, 'horas', '200.000 ÷ 6.000 ≈ 33,3 horas: casi 7 horas libres más por semana con el mismo ingreso.', { ctx: '200.000 pesos por semana; 6.000 pesos por hora.', dec: 1, tol: 0.1, d: 3 }),
      op('Según lo que viste sobre adaptación hedónica, ¿qué riesgo tiene la opción A?', [ // e4
        'Que el entusiasmo dure poco y la cuota siga',
        'Que el auto nuevo no se pueda manejar',
        ['Que los autos nuevos no tengan garantía', 'El riesgo está en la satisfacción que se desvanece, no en la garantía.'],
        'Que la cuota baje con el tiempo',
      ], 'La satisfacción se adapta rápido; la cuota, no.', { d: 2 }),
      clas('¿Qué necesidades satisface cada opción de Julián?', { // e5
        'Ocio y afecto': ['El viaje con amistades', 'Tiempo libre para ver a su familia'],
        'Entendimiento y creación': ['Los talleres del club', 'Aprender algo nuevo con horas liberadas'],
      }, 'Las opciones B y C tienen satisfactores sinérgicos; la A apunta sobre todo al estatus.', { d: 2 }),
      mult('¿Qué argumentos apoyan las opciones B o C frente a la A? Marcá todos.', [ // e6
        '+Las experiencias compartidas suelen dar satisfacción más duradera',
        '+Ganar tiempo libre también se asocia con bienestar',
        '+Su auto actual funciona y vive cerca del colectivo',
        '+Ahorrar da seguridad frente a imprevistos',
        '-Tener el auto más nuevo del barrio garantiza la felicidad',
      ], 'La decisión es de Julián, pero la evidencia ayuda a ver lo que cada opción ofrece.', { d: 2 }),
      det('Julián escribe sus conclusiones. Marcá lo que conviene revisar.', [ // e7
        ['El auto nuevo me costaría unas 67 horas de trabajo por mes.', false],
        ['Si compro el auto, voy a estar igual de contento todos los años.', true, 'Por la adaptación hedónica, la satisfacción suele bajar con el tiempo.'],
        ['Con la opción B ganaría casi 7 horas libres por semana.', false],
        ['El dinero no tiene nada que ver con el bienestar, así que da igual.', true, 'Sí tiene relación; lo que importa es cómo se usa.'],
      ], 'Decidir con información no es renunciar: es elegir lo que de verdad suma.', { d: 3 }),
    ]),
  ],
});
