import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// ALIMENTACIÓN 4 — De estación, cerca y agroecológico.
// Cómo se produce la comida importa: comer de estación, los cinturones
// hortícolas y los circuitos cortos, los principios de la agroecología, el
// manejo de plagas sin depender del veneno y las formas de comprar
// directo a quien produce. Retoma la huella y el transporte (alimentacion-2),
// los polinizadores (plantas-1) y el suelo vivo (aire-suelo-2).

export default unidad({
  slug: 'alimentacion-4',
  rama: 'alimentacion',
  orden: 4,
  nivel: 2,
  requiereTronco: 2,
  titulo: 'De estación, cerca y agroecológico',
  bajada: 'El tomate de enero y el de julio no son iguales. Comer de estación, comprar cerca y conocer la agroecología: qué cambia de verdad y qué no.',
  objetivos: [
    'Reconocer frutas y verduras de estación y los beneficios de consumirlas',
    'Evaluar los beneficios y los límites de comprar alimentos locales',
    'Explicar los principios básicos de la agroecología',
    'Describir el manejo integrado de plagas y el control biológico',
    'Comparar formas de comprar alimentos directamente a productores',
  ],
  repasa: ['alimentacion-2', 'alimentacion-1', 'plantas-1', 'aire-suelo-2'],
  fuentes: ['fao-agroecologia', 'fao', 'inta', 'owid-alimentos', 'ipbes-polinizadores', 'guias-alimentarias-ar'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Comer de estación', 'Qué fruta y verdura da cada época, por qué conviene y cuándo lo "fuera de estación" pesa en la huella.', [
      teoria('Cada cosa a su tiempo', [
        'Cada fruta y verdura tiene su época de cosecha natural según el clima de cada región. En la región pampeana, por ejemplo, el verano trae tomate, zapallito, berenjena, pimiento, choclo, durazno y sandía; el otoño, zapallo, batata, mandarina, manzana y pera; el invierno, acelga, espinaca, brócoli, coliflor, repollo, naranja y pomelo; y la primavera, habas, arvejas, espárragos, frutilla y lechuga.',
        'Comer de estación significa elegir sobre todo lo que se cosecha en esa época en la región.',
      ]),
      clas('¿En qué estación es típica esta cosecha en la región pampeana?', { // e1
        'Verano': ['Tomate', 'Choclo', 'Sandía'],
        'Invierno': ['Acelga', 'Brócoli', 'Naranja'],
        'Primavera': ['Habas', 'Frutilla', 'Espárragos'],
      }, 'Cada estación tiene su canasta. Conocerla ayuda a comprar mejor.', { d: 2 }),
      teoria('Por qué conviene', [
        'Lo de estación suele tener mejor sabor, porque madura en la planta en su momento; suele ser más barato, porque hay más oferta; y requiere menos insumos para producirse fuera de su época.',
        'Fuera de estación, un alimento puede venir de invernaderos calefaccionados, que usan mucha energía, o de otros hemisferios, a veces en avión. En esos casos, su huella puede ser mucho mayor.',
      ]),
      mult('¿Qué ventajas suele tener comer de estación? Marcá todas.', [ // e2
        '+Mejor sabor',
        '+Precios más bajos por la mayor oferta',
        '+Menos energía para calefaccionar invernaderos',
        '+Más variedad a lo largo del año',
        '-Que no tiene ninguna huella ambiental',
      ], 'Comer de estación ayuda, pero ningún alimento tiene huella cero.', { d: 1 }),
      cad('Armá la cadena de por qué un tomate en pleno invierno puede tener más huella.', [ // e3
        'En invierno hace frío para cultivar tomate al aire libre',
        'Se cultiva en invernadero calefaccionado o viene de lejos',
        'Se usa mucha energía para calefaccionar o transportar',
        'Aumentan las emisiones por kilo de tomate',
      ], ['El frío hace que el tomate absorba CO₂'], 'La misma verdura, en otra época, puede tener una huella muy distinta.', { d: 2 }),
      vf('Comer de estación es la decisión que más reduce la huella de carbono de la alimentación.', false, 'Ayuda, sobre todo con alimentos de invernadero calefaccionado o que llegan en avión. Pero cambiar qué se come —por ejemplo, menos carne vacuna— pesa mucho más, como viste en esta rama.', { // e4
        razones: ['+Porque qué se come pesa más que cuándo se come', '-Porque la estación no influye en nada', '-Porque solo importa el envase'],
        d: 3,
      }),
      par('Uní cada estación con una fruta típica en la región pampeana.', [ // e5
        ['Verano', 'Durazno'],
        ['Otoño', 'Manzana'],
        ['Invierno', 'Naranja'],
        ['Primavera', 'Frutilla'],
      ], 'Frutas de cada estación para armar un calendario propio.', { d: 1 }),
      op('En julio, ¿qué verdura conviene elegir para una ensalada en la región pampeana?', [ // e6
        'Repollo o espinaca',
        'Tomate de invernadero calefaccionado',
        ['Espárragos importados por avión', 'Traídos en avión, su huella de transporte es muy alta.'],
        'Pimiento de otro hemisferio',
      ], 'En invierno hay muchas verduras de hoja y crucíferas de estación: ricas, baratas y de baja huella.', { d: 2 }),
      teoria('Conservar la estación', [
        'Muchas culturas guardaron la abundancia de una estación para otra: conservas de tomate en verano, dulces y mermeladas, legumbres secas, congelados. Así se puede comer tomate en invierno sin invernadero calefaccionado: en forma de salsa hecha en temporada.',
      ]),
      clas('¿Es una forma de aprovechar la estación o de comer fuera de estación?', { // e7
        'Aprovechar la estación': ['Salsa de tomate hecha en verano', 'Mermelada de durazno', 'Zapallo guardado desde el otoño'],
        'Fuera de estación': ['Frutillas frescas importadas en invierno', 'Tomate fresco de invernadero calefaccionado en julio'],
      }, 'Conservar es la forma histórica de comer todo el año sin depender de invernaderos ni aviones.', { d: 2 }),
      numv(3, (i) => { // e8
        const pv = [800, 1000, 600][i];
        const pi = [2400, 3000, 2000][i];
        return {
          enunciado: `El kilo de tomate cuesta $${pv.toLocaleString('es-AR')} en temporada y $${pi.toLocaleString('es-AR')} fuera de temporada. ¿Cuántas veces más caro es fuera de temporada?`,
          valor: pi / pv,
          unidad: 'veces',
          explicacion: `${pi.toLocaleString('es-AR')} ÷ ${pv.toLocaleString('es-AR')} = ${pi / pv} veces. La abundancia de la estación suele bajar los precios.`,
        };
      }, { d: 1 }),
      det('Leé este consejo y marcá lo equivocado.', [ // e9
        ['En verano, el tomate es de estación en la región pampeana.', false],
        ['Las frutillas son típicas del invierno en la región pampeana.', true, 'Son típicas de la primavera.'],
        ['Las conservas permiten comer tomate en invierno sin invernaderos.', false],
        ['Comer de estación hace que la carne vacuna tenga menos huella.', true, 'La huella de la carne depende sobre todo de su producción, no de la estación.'],
      ], 'Estación y huella: una relación real, pero no mágica.', { d: 2 }),
      comp('Completá.', 'Lo de estación suele tener mejor [sabor] y menor [precio]; fuera de estación puede venir de invernaderos [calefaccionados].', ['envase', 'peso', 'reciclados'], 'Por qué conviene comer de estación, en una línea.', { d: 1 }),
      rank('Ordená estas opciones de tomate en invierno por su huella típica, de menor a mayor.', [ // e11
        ['Salsa de tomate hecha en el verano', 'la menor'],
        ['Tomate de invernadero sin calefacción del norte del país', 'baja'],
        ['Tomate de invernadero calefaccionado', 'alta'],
        ['Tomate fresco traído en avión', 'la mayor'],
      ], 'Conservar o elegir lo que crece sin calefacción ni avión baja mucho la huella.', { d: 3, extremos: ['Menor', 'Mayor'] }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Cerca de casa', 'Cinturones hortícolas, circuitos cortos y lo que comprar local cambia, y lo que no.', [
      teoria('Los cinturones verdes', [
        'Alrededor de muchas ciudades argentinas hay cinturones hortícolas: zonas de quintas que abastecen de verduras frescas a la ciudad. El cinturón hortícola de La Plata es uno de los más importantes del país, y hay otros alrededor de Rosario, Córdoba, Mendoza, Mar del Plata y muchas más ciudades.',
        'Muchas de esas quintas son de familias productoras, a menudo con muchas dificultades: alquilan la tierra, trabajan muchas horas y reciben una parte chica del precio final.',
      ]),
      vf('Las verduras de las grandes ciudades argentinas vienen sobre todo de otros países.', false, 'Buena parte viene de cinturones hortícolas cercanos, como el de La Plata, trabajados en gran parte por familias productoras.', { // e1
        razones: ['+Porque buena parte viene de cinturones hortícolas cercanos', '-Porque en Argentina no se cultivan verduras', '-Porque todas las verduras llegan en avión'],
        d: 1,
      }),
      teoria('Circuitos cortos', [
        'Un circuito corto es una forma de venta con uno o ningún intermediario entre quien produce y quien come: ferias de productores, bolsones de verdura, venta en la quinta, mercados de la economía social. Así, más plata queda en manos de quien produce, y quien compra conoce el origen de lo que come.',
        'Pero ojo: como viste en esta rama, el transporte suele ser una parte chica de la huella de la comida. Los beneficios más grandes de lo local suelen ser sociales y económicos, además de frescura y sabor.',
      ]),
      clas('¿Es un beneficio grande o chico de comprar verduras locales en circuitos cortos?', { // e2
        'Beneficio grande': ['Más ingreso para la familia productora', 'Conocer quién produce y cómo', 'Verduras más frescas'],
        'Beneficio chico': ['Menos emisiones por transporte, en general', 'Menos kilómetros en camión de una lechuga'],
      }, 'Lo local suma mucho en lo social y económico; en carbono, suele sumar poco, salvo frente a transporte aéreo o invernaderos calefaccionados.', { d: 3 }),
      cad('Armá la cadena de cómo un circuito corto mejora el ingreso de una quinta.', [ // e3
        'La familia vende directo en una feria',
        'No hay intermediarios que se queden con parte del precio',
        'Recibe una parte mayor de lo que paga quien compra',
        'Puede invertir en su quinta y mejorar sus condiciones',
      ], ['La feria hace que las verduras crezcan más rápido'], 'Acortar la cadena cambia quién se queda con el valor.', { d: 2 }),
      numv(3, (i) => { // e4
        const p = [1000, 1500, 800][i];
        const q1 = [25, 20, 30][i];
        const q2 = [70, 75, 65][i];
        return {
          enunciado: `Una verdura se vende a $${p.toLocaleString('es-AR')} el kilo. En el circuito largo, la quinta recibe el ${q1} %; en la feria, el ${q2 }%. ¿Cuántos pesos más por kilo recibe en la feria?`,
          valor: (p * (q2 - q1)) / 100,
          unidad: '$',
          explicacion: `${p.toLocaleString('es-AR')} × (${q2} − ${q1}) ÷ 100 = $${((p * (q2 - q1)) / 100).toLocaleString('es-AR')} más por kilo para la familia productora, al mismo precio para quien compra.`,
        };
      }, { d: 2 }),
      mult('¿Cuáles de estos son circuitos cortos? Marcá todos.', [ // e5
        '+Feria de productores del barrio',
        '+Bolsón de verduras de una cooperativa',
        '+Venta directa en la quinta',
        '+Compra comunitaria a una organización de productores',
        '-Hipermercado con cadena de distribución nacional',
      ], 'Pocos o ningún intermediario: esa es la definición.', { d: 1 }),
      teoria('Tierra cerca de las ciudades', [
        'Los cinturones hortícolas están bajo presión: las ciudades crecen sobre ellos con barrios y countries, y el precio de la tierra sube. Si desaparecen, las verduras frescas tienen que venir de más lejos, a veces más caras y menos frescas.',
        'Por eso algunos municipios protegen zonas rurales cercanas con ordenamiento territorial.',
      ]),
      op('¿Por qué conviene proteger los cinturones hortícolas?', [ // e6
        'Porque abastecen de verduras frescas a la ciudad',
        'Porque allí se construyen los mejores countries',
        ['Porque no tienen ningún valor productivo', 'Al contrario: son la huerta de la ciudad.'],
        'Porque producen petróleo',
      ], 'Son la huerta de la ciudad: perderlos alarga la cadena y encarece la comida fresca.', { d: 1 }),
      par('Uní cada forma de venta con una característica.', [ // e7
        ['Feria de productores', 'Se conoce a quien produce'],
        ['Bolsón de verduras', 'Surtido de estación que llega semanal'],
        ['Mercado concentrador', 'Reúne la producción de muchas quintas para mayoristas'],
        ['Supermercado', 'Gran variedad todo el año, con más intermediarios'],
      ], 'Cada canal tiene ventajas y límites. Combinarlos es lo más común.', { d: 2 }),
      det('Leé este cartel en una feria y marcá lo exagerado.', [ // e8
        ['Vendemos verdura de nuestra propia quinta.', false],
        ['Comprar local es lo único que importa para el clima.', true, 'Qué se come pesa más que la distancia; lo local ayuda más en lo social y económico.'],
        ['Cosechamos ayer.', false],
        ['Nuestra lechuga no tiene ninguna huella porque viaja 30 km.', true, 'Toda producción tiene huella, aunque el transporte corto sume poco.'],
      ], 'Lo local tiene muchas virtudes. Contarlas con precisión es más convincente.', { d: 3 }),
      comp('Completá.', 'Las quintas alrededor de las ciudades forman cinturones [hortícolas]; vender con pocos intermediarios es un circuito [corto]; y su mayor beneficio suele ser [social].', ['industriales', 'largo', 'fiscal'], 'Tres ideas sobre comprar cerca de casa y a quien produce.', { d: 2 }),
      est('Estimá qué porcentaje promedio de la huella de carbono de la comida viene del transporte.', 6, { min: 0, max: 100, paso: 1, unidad: '%' }, 'Alrededor del 6 %, como viste en esta rama. Por eso los beneficios de lo local son sobre todo sociales, económicos y de frescura.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('La agroecología', 'Producir con la naturaleza: diversidad, suelo vivo, reciclaje de nutrientes y saberes locales.', [
      teoria('Qué es', [
        'La agroecología es una forma de producir alimentos que aplica conocimientos de ecología a la agricultura: en lugar de simplificar el campo y depender de insumos externos, busca diversidad, suelo vivo, reciclaje de nutrientes y control natural de plagas. La FAO la describe con varios elementos, entre ellos la diversidad, las sinergias, la eficiencia, la resiliencia, el reciclaje y la cocreación de conocimientos con quienes producen.',
        'También tiene una dimensión social: valora los saberes de las familias productoras, los mercados justos y la soberanía alimentaria.',
      ]),
      mult('¿Qué elementos son parte de la agroecología? Marcá todos.', [ // e1
        '+Diversidad de cultivos y animales',
        '+Reciclaje de nutrientes, como el compost',
        '+Control natural de plagas',
        '+Saberes de las familias productoras',
        '-Un solo cultivo en toda la superficie con insumos externos',
      ], 'La agroecología apuesta a la diversidad y a los procesos naturales.', { d: 1 }),
      teoria('Diversidad que protege', [
        'Un campo con muchos cultivos distintos, cercos vivos y flores es más resistente: si una plaga ataca un cultivo, los otros siguen; las flores atraen polinizadores e insectos que comen plagas; las raíces distintas aprovechan mejor el suelo. Las asociaciones de cultivos, como la tradicional milpa de maíz, poroto y zapallo, se ayudan entre sí.',
      ]),
      cad('Armá la cadena de cómo la diversidad reduce las plagas.', [ // e2
        'Se siembran cultivos variados y se dejan franjas con flores',
        'Llegan insectos que comen plagas, como las vaquitas de San Antonio',
        'Se controlan los pulgones de forma natural',
        'Hace falta menos plaguicida',
      ], ['Las flores atraen más plagas y hay que fumigar más'], 'La diversidad trabaja como un seguro y como un control natural.', { d: 2 }),
      par('Uní cada práctica agroecológica con su beneficio.', [ // e3
        ['Asociar maíz, poroto y zapallo', 'Los cultivos se ayudan entre sí'],
        ['Compost propio', 'Devuelve nutrientes al suelo'],
        ['Franjas de flores nativas', 'Atraen polinizadores y enemigos de plagas'],
        ['Rotación de cultivos', 'Corta ciclos de plagas y cuida el suelo'],
      ], 'Prácticas que usan procesos naturales en lugar de insumos comprados.', { d: 2 }),
      vf('En la milpa, el poroto aporta nitrógeno al suelo gracias a las bacterias de sus raíces.', true, 'Como viste en la rama de Plantas, las legumbres fijan nitrógeno del aire. El maíz da sostén al poroto y el zapallo cubre el suelo.', { // e4
        razones: ['+Porque las legumbres fijan nitrógeno del aire', '-Porque el poroto fabrica fertilizante químico', '-Porque el maíz no necesita nitrógeno'],
        d: 2,
      }),
      teoria('Escalas y debates', [
        'La agroecología se practica en huertas familiares, quintas periurbanas y también en campos extensivos. Hay debates sobre cuánto rinde y cómo escalarla: en muchos casos, los rendimientos por cultivo pueden ser algo menores, pero los costos en insumos son más bajos y la producción total del sistema diverso puede ser alta. La investigación sigue avanzando, y organismos como el INTA estudian y acompañan experiencias.',
      ]),
      clas('¿Esta práctica se acerca más a la agroecología o a la agricultura muy dependiente de insumos?', { // e5
        'Agroecología': ['Compost y abonos verdes', 'Policultivos y cercos vivos', 'Control biológico de plagas'],
        'Muy dependiente de insumos': ['Monocultivo con fertilizante sintético en exceso', 'Aplicaciones de plaguicidas por calendario', 'Suelo desnudo entre cosechas'],
      }, 'Dos lógicas distintas: trabajar con los procesos naturales o reemplazarlos con insumos.', { d: 2 }),
      op('¿Qué busca la agroecología respecto de los insumos externos, como fertilizantes y plaguicidas sintéticos?', [ // e6
        'Depender menos, con procesos naturales',
        'Usar el doble para asegurar la cosecha siempre',
        ['Prohibir cualquier herramienta moderna', 'No rechaza la tecnología: busca apoyarse en procesos ecológicos y usar menos insumos.'],
        'Comprarlos siempre a otros países',
      ], 'Menos insumos comprados, más procesos del propio sistema.', { d: 2 }),
      numv(3, (i) => { // e7
        const cost = [100000, 80000, 150000][i];
        const pct = [40, 50, 30][i];
        return {
          enunciado: `Una quinta gasta $${cost.toLocaleString('es-AR')} por mes en insumos. Si con prácticas agroecológicas reduce ese gasto un ${pct} %, ¿cuánto ahorra por mes?`,
          valor: (cost * pct) / 100,
          unidad: '$',
          explicacion: `${cost.toLocaleString('es-AR')} × ${pct} ÷ 100 = $${((cost * pct) / 100).toLocaleString('es-AR')} por mes. Menos insumos comprados es menos gasto y menos dependencia.`,
        };
      }, { d: 1 }),
      det('Leé este comentario y marcá lo equivocado.', [ // e8
        ['La agroecología busca diversidad y suelo vivo.', false],
        ['La agroecología consiste en no hacer nada y dejar que todo crezca solo.', true, 'Es un manejo activo y con mucho conocimiento, no abandono.'],
        ['Las flores pueden atraer insectos que controlan plagas.', false],
        ['La agroecología solo sirve en macetas de balcón.', true, 'Se practica en huertas, quintas y también en campos extensivos.'],
      ], 'La agroecología es ciencia y práctica, no ausencia de manejo.', { d: 2 }),
      comp('Completá.', 'La agroecología aplica conocimientos de [ecología] a la agricultura; apuesta a la [diversidad]; y recicla nutrientes con el [compost].', ['economía', 'uniformidad', 'plástico'], 'La idea central de la agroecología, en una línea.', { d: 1 }),
      rank('Ordená estos campos de menor a mayor diversidad.', [ // e11
        ['Monocultivo sin cercos', 'muy baja'],
        ['Rotación de dos cultivos', 'baja'],
        ['Rotación con cultivos de cobertura y cercos', 'media'],
        ['Policultivo con cercos vivos y flores', 'alta'],
      ], 'Más diversidad suele traer más estabilidad y más control natural.', { d: 2, extremos: ['Menor diversidad', 'Mayor diversidad'] }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Plagas sin depender del veneno', 'Manejo integrado de plagas, control biológico y los riesgos de los plaguicidas.', [
      teoria('Qué es una plaga', [
        'Un insecto, un hongo o una planta se vuelve plaga cuando su población crece tanto que causa daño económico a un cultivo. Muchas veces las plagas se disparan cuando se eliminan sus enemigos naturales o cuando hay grandes superficies de un solo cultivo, que les ofrecen alimento sin límite.',
      ]),
      cad('Armá la cadena de cómo un plaguicida de amplio espectro puede empeorar una plaga.', [ // e1
        'Se fumiga con un producto que mata a casi todos los insectos',
        'Mueren también los enemigos naturales de la plaga',
        'La plaga se recupera más rápido que sus depredadores',
        'La plaga vuelve con más fuerza',
        'Hay que volver a fumigar',
      ], ['El plaguicida hace que la plaga se vuelva beneficiosa'], 'Un círculo vicioso conocido en agronomía: eliminar a los aliados deja el camino libre a la plaga.', { d: 3 }),
      teoria('Manejo integrado de plagas', [
        'El manejo integrado de plagas combina varias herramientas: prevenir (rotaciones, variedades resistentes, diversidad), monitorear (contar las plagas y sus enemigos antes de decidir), usar umbrales (actuar solo si la plaga supera un nivel que causa daño) y, si hace falta, intervenir empezando por los métodos de menor impacto, como el control biológico, y dejando los plaguicidas como último recurso y en la dosis justa.',
      ], { lista: ['Prevenir', 'Monitorear', 'Decidir con umbrales', 'Intervenir con lo de menor impacto'] }),
      ord('Ordená los pasos del manejo integrado de plagas.', [ // e2
        'Prevenir con rotación y diversidad',
        'Monitorear las plagas y sus enemigos',
        'Comparar con el umbral de daño',
        'Si lo supera, usar primero métodos de menor impacto',
        'Evaluar el resultado',
      ], 'Decidir con datos en lugar de fumigar por calendario.', { d: 2, extremos: ['Primero', 'Último'] }),
      op('En el manejo integrado, ¿cuándo se interviene contra una plaga?', [ // e3
        'Cuando supera el umbral de daño',
        'Siempre, cada dos semanas, por las dudas y sin mirar',
        ['Apenas se ve un solo insecto en la huerta', 'Un insecto no es una plaga: se actúa cuando su población causaría daño.'],
        'Nunca, pase lo que pase en el cultivo',
      ], 'Monitorear y usar umbrales evita aplicaciones innecesarias.', { d: 2 }),
      teoria('Control biológico', [
        'El control biológico usa enemigos naturales de las plagas: vaquitas de San Antonio y crisopas que comen pulgones, avispitas que ponen huevos dentro de otros insectos, hongos y bacterias que enferman a las plagas. Se pueden atraer con plantas con flores o liberar en los cultivos. En Argentina, el INTA investiga y promueve muchas de estas herramientas.',
      ]),
      par('Uní cada enemigo natural con la plaga que controla.', [ // e4
        ['Vaquita de San Antonio', 'Pulgones'],
        ['Avispitas parasitoides', 'Orugas y otros insectos'],
        ['Aves insectívoras', 'Insectos en general'],
        ['Hongos entomopatógenos', 'Insectos que enferman y mueren'],
      ], 'Aliados que trabajan gratis, si se los cuida.', { d: 2 }),
      vf('Las vaquitas de San Antonio son una plaga de la huerta.', false, 'Son aliadas: tanto los adultos como sus larvas comen grandes cantidades de pulgones.', { // e5
        razones: ['+Porque comen pulgones, una plaga común', '-Porque comen todas las hojas de la huerta', '-Porque transmiten enfermedades a las plantas'],
        d: 1,
      }),
      teoria('Los riesgos de los plaguicidas', [
        'Los plaguicidas pueden afectar la salud de quienes los aplican y de quienes viven cerca, contaminar el agua y el suelo, y dañar a polinizadores y otros organismos. Por eso tienen reglas de uso: dosis, equipos de protección, condiciones de viento y distancias a viviendas y escuelas. En Argentina, varias provincias y municipios fijaron zonas de resguardo donde se restringen las aplicaciones.',
      ]),
      mult('¿Qué reduce los riesgos de los plaguicidas cuando se usan? Marcá todo.', [ // e6
        '+Usar la dosis indicada y no más',
        '+Equipos de protección para quien aplica',
        '+No aplicar con viento',
        '+Respetar las distancias a viviendas y escuelas',
        '-Aplicar cerca de colmenas en plena floración',
      ], 'Las reglas de uso protegen a las personas, el agua y los polinizadores.', { d: 2 }),
      clas('¿Esta práctica es parte del manejo integrado o es una aplicación por calendario?', { // e7
        'Manejo integrado': ['Contar pulgones por planta antes de decidir', 'Sembrar flores para atraer enemigos naturales', 'Aplicar solo en el foco afectado'],
        'Por calendario': ['Fumigar todo el lote cada 15 días', 'Aplicar sin revisar si hay plaga', 'Usar el doble de dosis por las dudas'],
      }, 'La diferencia es decidir con información en lugar de por costumbre.', { d: 2 }),
      numv(3, (i) => { // e8
        const pl = [20, 50, 10][i];
        const pul = [300, 400, 250][i];
        const umb = [20, 10, 30][i];
        return {
          enunciado: `En un monitoreo se revisan ${pl} plantas y se cuentan ${pul} pulgones en total. Si el umbral es de ${umb} pulgones por planta, ¿cuántos pulgones por planta hay en promedio?`,
          valor: pul / pl,
          unidad: 'pulgones por planta',
          explicacion: `${pul} ÷ ${pl} = ${pul / pl} por planta. ${pul / pl > umb ? `Supera el umbral de ${umb}: conviene intervenir, empezando por métodos de bajo impacto.` : `No supera el umbral de ${umb}: por ahora conviene seguir monitoreando.`}`,
        };
      }, { d: 2 }),
      det('Leé este consejo de un vecino huertero y marcá lo equivocado.', [ // e9
        ['Revisá tus plantas antes de hacer nada.', false],
        ['Fumigá todo cada semana, aunque no veas plagas, por las dudas.', true, 'Aplicar sin necesidad mata a los aliados y puede empeorar las plagas.'],
        ['Sembrá flores para atraer bichos buenos.', false],
        ['Si ves una vaquita de San Antonio, matala.', true, 'Es una aliada que come pulgones.'],
      ], 'Observar, entender y actuar con lo mínimo necesario.', { d: 2 }),
      comp('Completá.', 'Usar enemigos naturales de las plagas es control [biológico]; actuar solo si se supera un [umbral] es parte del manejo [integrado].', ['químico', 'calendario', 'total'], 'Las ideas centrales del manejo de plagas.', { d: 2 }),
      rank('Ordená estas intervenciones de menor a mayor impacto ambiental.', [ // e11
        ['Retirar a mano las orugas de unas plantas', 'mínimo'],
        ['Liberar enemigos naturales', 'bajo'],
        ['Aplicar un producto selectivo solo en el foco', 'moderado'],
        ['Fumigar todo el lote con un producto de amplio espectro', 'alto'],
      ], 'El manejo integrado empieza por lo de menor impacto y deja lo más fuerte como último recurso.', { d: 2, extremos: ['Menor impacto', 'Mayor impacto'] }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Comprar distinto', 'Ferias, bolsones, compras comunitarias y precio justo: cómo acercarse a quien produce.', [
      teoria('Muchas formas de comprar directo', [
        'Hay muchas formas de acercarse a quien produce: ferias de productores, bolsones semanales de verdura de estación, nodos de compra comunitaria donde un grupo de vecinos junta pedidos, almacenes de la economía social, y esquemas donde un grupo de familias se compromete a comprarle a una quinta durante toda la temporada.',
        'Estas formas suelen dar más previsibilidad a quien produce y alimentos frescos de estación a quien compra.',
      ]),
      par('Uní cada forma de compra con cómo funciona.', [ // e1
        ['Bolsón semanal', 'Surtido de estación que llega cada semana'],
        ['Nodo de compra comunitaria', 'Vecinos juntan pedidos para comprar juntos'],
        ['Feria de productores', 'Quien produce vende en persona'],
        ['Compromiso de temporada', 'Familias pagan por adelantado la cosecha de una quinta'],
      ], 'Distintas formas, una misma idea: acortar la distancia entre quien produce y quien come.', { d: 2 }),
      teoria('El bolsón de estación', [
        'Un bolsón trae lo que hay en la quinta esa semana. Eso obliga a cocinar con lo que da la estación, a probar verduras nuevas y a planificar. Es un cambio de hábito: al principio puede costar, pero muchas familias descubren más variedad y menos desperdicio, porque se compra una cantidad fija y conocida.',
      ]),
      vf('En un bolsón de estación, quien compra elige exactamente qué verduras recibe cada semana.', false, 'Suele traer lo que la quinta cosecha esa semana. Esa es su lógica: comer de estación y dar previsibilidad a quien produce.', { // e2
        razones: ['+Porque trae lo que se cosecha esa semana', '-Porque el bolsón siempre trae lo mismo todo el año', '-Porque los bolsones no tienen verdura'],
        d: 2,
      }),
      cad('Armá la cadena de cómo un nodo de compra comunitaria ayuda a todos.', [ // e3
        'Varios vecinos juntan sus pedidos',
        'Hacen una compra grande a una cooperativa',
        'La cooperativa entrega todo en un solo viaje',
        'Baja el costo del transporte por familia',
        'La cooperativa vende más y los vecinos pagan un precio justo',
      ], ['Cada vecino hace un viaje separado a la quinta'], 'Organizarse para comprar juntos es una forma de acción colectiva, como viste en Comunidad.', { d: 2 }),
      teoria('Precio justo', [
        'Un precio justo cubre los costos de producir, un ingreso digno para quien trabaja y un precio accesible para quien compra. En los circuitos largos, una parte grande del precio final queda en intermediarios. Acortar la cadena permite que las familias productoras reciban más sin que quien compra pague más.',
      ]),
      mult('¿Qué incluye un precio justo para una familia productora? Marcá todo.', [ // e4
        '+Cubrir los costos de producción',
        '+Un ingreso digno por su trabajo',
        '+Un precio accesible para quien compra',
        '+Previsibilidad para planificar',
        '-El precio más bajo posible sin importar los costos',
      ], 'Justo para quien produce y accesible para quien compra.', { d: 1 }),
      numv(3, (i) => { // e5
        const fam = [20, 30, 15][i];
        const kg = [5, 4, 6][i];
        return {
          enunciado: `Un nodo de compra reúne ${fam} familias que piden ${kg} kg de verdura por semana cada una. ¿Cuántos kg por semana le compran a la quinta?`,
          valor: fam * kg,
          unidad: 'kg',
          explicacion: `${fam} × ${kg} = ${fam * kg} kg por semana: una venta previsible que ayuda a la quinta a planificar.`,
        };
      }, { d: 1 }),
      clas('¿Esta forma de compra suele acortar la cadena o alargarla?', { // e6
        'La acorta': ['Bolsón de una cooperativa de productores', 'Feria de productores', 'Nodo de compra comunitaria'],
        'La alarga': ['Verdura que pasa por varios mayoristas', 'Producto importado de otro continente'],
      }, 'Menos intermediarios, más valor para quien produce y más información para quien compra.', { d: 1 }),
      op('Una familia quiere empezar a comprar directo a productores pero tiene poco tiempo. ¿Qué opción suele ser más práctica?', [ // e7
        'Un bolsón semanal con entrega en un punto cercano',
        'Ir a la quinta todos los días a buscar verdura',
        ['Dejar de comer verduras frescas', 'Hay opciones que se adaptan a poco tiempo, como los bolsones.'],
        'Comprar todo en otro país por internet',
      ], 'Los bolsones con puntos de entrega están pensados justamente para ahorrar tiempo.', { d: 1 }),
      det('Leé este mensaje de un nodo de compra y marcá lo equivocado.', [ // e8
        ['El bolsón de esta semana trae zapallo, acelga y mandarinas de estación.', false],
        ['Comprando directo, los productores reciben menos que en el súper.', true, 'Suelen recibir una parte mayor del precio al haber menos intermediarios.'],
        ['Juntamos los pedidos para que el reparto sea un solo viaje.', false],
        ['Lo local no tiene ningún beneficio más allá del transporte.', true, 'Tiene beneficios sociales, económicos y de frescura importantes.'],
      ], 'Comprar distinto es también una forma de organización comunitaria.', { d: 2 }),
      comp('Completá.', 'Un surtido semanal de verdura de estación es un [bolsón]; vecinos que juntan pedidos forman un [nodo] de compra; y un precio [justo] cubre costos e ingreso digno.', ['changuito', 'club', 'mínimo'], 'Tres formas de comprar distinto y más cerca de quien produce.', { d: 1 }),
      rank('Ordená estas formas de comprar verdura de la cadena más corta a la más larga.', [ // e10
        ['Cosechar en tu propia huerta', 'sin intermediarios'],
        ['Comprar en la feria a quien produce', 'directo'],
        ['Comprar un bolsón de una cooperativa', 'un intermediario solidario'],
        ['Comprar en un súper de cadena nacional', 'varios intermediarios'],
      ], 'Cada paso más en la cadena es alguien más que se queda con parte del precio.', { d: 1, extremos: ['Más corta', 'Más larga'] }),
      est('Estimá cuántas familias hacen falta en un nodo para comprar 100 kg de verdura por semana, si cada una pide 5 kg.', 20, { min: 1, max: 100, paso: 1, unidad: 'familias' }, '100 ÷ 5 = 20 familias. Un grupo chico puede sostener una compra grande y previsible.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: de estación, cerca y agroecológico', 'Estaciones, circuitos cortos, agroecología, plagas y formas de compra, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el bolsón de invierno', 'Una familia se suma a un bolsón agroecológico en julio. Con los datos, ayudala a planificar y a evaluar el cambio.', [
      teoria('La situación', [
        'Los Ruiz, familia de cuatro en Rosario, antes compraban tomate, pimiento y lechuga todo el año en el súper. En julio se suman a un bolsón agroecológico de una cooperativa del cinturón hortícola. Cada semana llegan 6 kg: acelga, espinaca, zapallo, repollo, zanahoria, papa y mandarinas.',
        'El bolsón cuesta lo mismo que gastaban por semana en verdura, pero la cooperativa recibe el 70 % del precio, contra el 25 % que recibían las quintas en la cadena larga.',
      ]),
      mult('¿Qué verduras del bolsón son de estación en invierno en la región? Marcá todas.', [ // e1
        '+Acelga',
        '+Espinaca',
        '+Repollo',
        '+Mandarinas',
        '-Tomate fresco',
      ], 'El bolsón trae lo que da el invierno. El tomate fresco no es de estación en julio.', { d: 2 }),
      num('Si el bolsón cuesta $10.000 por semana, ¿cuántos pesos más por semana recibe la cooperativa que lo que recibían las quintas en la cadena larga?', 4500, '$', 'Recibe el 70 %: $7.000, contra el 25 %: $2.500. Diferencia: $4.500 por semana, por la misma compra.', { ctx: 'Bolsón de $10.000 por semana; 70 % para la cooperativa contra 25 % en la cadena larga.', d: 2 }),
      num('¿Cuántos kg de verdura de estación reciben por mes, con 4 semanas?', 24, 'kg', '6 × 4 = 24 kg por mes de verdura fresca de estación.', { ctx: 'Bolsón de 6 kg por semana; mes de 4 semanas.', d: 1 }),
      op('A los chicos no les gusta la acelga. ¿Qué conviene hacer para no desperdiciarla?', [ // e4
        'Probar otras recetas, como tartas o tortillas',
        'Tirarla y comprar tomate en el súper',
        ['Dejar el bolsón al mes', 'Se puede ajustar la forma de cocinar antes de abandonar el cambio.'],
        'Guardarla hasta que se ponga amarilla',
      ], 'La misma verdura, cocinada de otra forma, suele encontrar su lugar. Así el cambio de hábito se sostiene.', { d: 3 }),
      clas('Clasificá los efectos del cambio de los Ruiz.', { // e5
        'Efecto importante': ['Más ingreso para la cooperativa', 'Más verdura fresca de estación', 'Menos tomate de invernadero calefaccionado'],
        'Efecto chico': ['Menos kilómetros de transporte de la verdura', 'Algún envase menos en la compra'],
      }, 'El cambio tiene efectos grandes en lo social y en la estacionalidad; el transporte, como siempre, pesa poco.', { d: 3 }),
      numv(3, (i) => { // e6
        const sem = [52, 40, 30][i];
        return {
          enunciado: `Con $4.500 más por semana para la cooperativa, ¿cuántos pesos más recibe en ${sem} semanas por la compra de los Ruiz?`,
          valor: 4500 * sem,
          unidad: '$',
          explicacion: `4.500 × ${sem} = $${(4500 * sem).toLocaleString('es-AR')}. Una sola familia; con cien familias, el cambio para la cooperativa es enorme.`,
        };
      }, { d: 2 }),
      det('Los Ruiz cuentan su experiencia en redes. Marcá lo que no es correcto.', [ // e7
        ['Ahora cocinamos con verdura de estación.', false],
        ['El bolsón tiene huella cero porque viene de cerca.', true, 'Tiene huella, aunque el transporte corto sume poco; el cambio grande es otro.'],
        ['La cooperativa recibe una parte mayor del precio.', false],
        ['Como es agroecológico, la acelga no necesita lavarse.', true, 'Toda verdura fresca se lava antes de comerla.'],
      ], 'Contar bien los beneficios hace que el mensaje sea creíble.', { d: 3 }),
    ]),
  ],
});
