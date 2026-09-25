import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// ALIMENTACIÓN 1 — Del campo al plato.
// La base de la rama: la comida como sistema. De dónde viene su energía,
// qué necesita el cuerpo según las guías argentinas, qué recorrido hace un
// alimento y cuánta tierra y agua usa el sistema alimentario. Retoma el flujo
// de energía (tronco-1) y leer números ambientales (tronco-2).

export default unidad({
  slug: 'alimentacion-1',
  rama: 'alimentacion',
  orden: 1,
  nivel: 1,
  requiereTronco: 1,
  titulo: 'Del campo al plato',
  bajada: 'Todo lo que comés pasó por un campo, una fábrica, un camión y una góndola. Cómo funciona el sistema que te alimenta.',
  objetivos: [
    'Describir las etapas de un sistema alimentario',
    'Explicar por qué los alimentos de origen animal requieren más recursos',
    'Reconocer los mensajes principales de las Guías Alimentarias argentinas',
    'Seguir el recorrido de un alimento y la cadena de frío',
    'Dimensionar cuánta tierra y agua usa la producción de alimentos',
  ],
  repasa: ['tronco-1', 'tronco-2'],
  fuentes: ['guias-alimentarias-ar', 'owid-impactos-alimentos', 'owid-alimentos', 'poore-nemecek-2018', 'fao', 'inta'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('La comida como sistema', 'Producir, transformar, transportar, vender, comer y descartar: las etapas que hay detrás de cada bocado.', [
      teoria('Un sistema, no una góndola', [
        'Un sistema alimentario es todo lo que hace falta para que la comida llegue a la boca: producir en el campo o el mar, transformar en industrias, transportar, almacenar, vender, cocinar, comer y descartar lo que sobra. Incluye a las personas que trabajan en cada etapa, las reglas que lo ordenan y los recursos que usa.',
        'Mirar la comida como sistema permite ver cosas que en la góndola no aparecen: la tierra, el agua, la energía y el trabajo que hay detrás.',
      ]),
      ord('Ordená las etapas del sistema alimentario de un paquete de fideos.', [ // e1
        'Se cultiva trigo en el campo',
        'Un molino lo convierte en harina',
        'Una fábrica hace los fideos y los envasa',
        'Un camión los lleva a los comercios',
        'Se compran, se cocinan y se comen',
      ], 'Producción, transformación, distribución y consumo. Cada etapa usa recursos y genera residuos.', { d: 1, extremos: ['Primero', 'Último'] }),
      teoria('Cuánto pesa en el ambiente', [
        'El sistema alimentario es uno de los grandes motores del impacto ambiental. Según distintos estudios, produce entre un cuarto y un tercio de las emisiones mundiales de gases de efecto invernadero, usa alrededor del 70 % del agua dulce que se extrae y ocupa cerca de la mitad de la tierra habitable del planeta.',
        'También es la principal causa de pérdida de bosques y de biodiversidad. Por eso, lo que comemos y cómo se produce es una de las palancas más grandes que existen.',
      ], { destacado: { valor: '≈ 70 %', texto: 'del agua dulce que se extrae en el mundo se usa en la agricultura.' } }),
      rank('Ordená estos impactos del sistema alimentario mundial, de mayor a menor porcentaje (aproximado).', [ // e2
        ['Agua dulce extraída que usa la agricultura', '≈ 70 %'],
        ['Tierra habitable usada para producir alimentos', '≈ 50 %'],
        ['Emisiones de gases de efecto invernadero', '≈ 25-34 %'],
      ], 'Agua, tierra y clima: el sistema alimentario pesa mucho en los tres.', { d: 2 }),
      clas('¿En qué etapa del sistema alimentario ocurre cada cosa?', { // e3
        'Producción': ['Sembrar maíz', 'Ordeñar vacas', 'Pescar merluza'],
        'Transformación': ['Hacer queso con leche', 'Moler trigo'],
        'Distribución y venta': ['Transportar en camión refrigerado', 'Exhibir en la góndola'],
        'Consumo': ['Cocinar en casa', 'Tirar las sobras'],
      }, 'El impacto de un alimento es la suma de todas sus etapas, no solo la del campo.', { d: 2 }),
      vf('El impacto ambiental de un alimento está solo en el transporte.', false, 'Para la mayoría de los alimentos, la etapa que más pesa es la producción en el campo: el uso de tierra, fertilizantes y, en los animales, el metano y el alimento que consumen. El transporte suele ser una parte chica.', { // e4
        razones: ['+Porque para la mayoría la producción pesa mucho más', '-Porque los alimentos no se transportan', '-Porque el campo no tiene impactos'],
        d: 2,
      }),
      teoria('Las personas del sistema', [
        'Detrás de la comida hay productores grandes y chicos, trabajadores rurales, pescadores, obreros de la industria, transportistas, comerciantes y quienes cocinan. En Argentina, muchas verduras de las ciudades vienen de cinturones hortícolas cercanos, trabajados en gran parte por familias de pequeños productores.',
        'Un sistema alimentario sostenible no solo cuida el ambiente: también tiene que alimentar bien a todos y dar condiciones dignas a quienes lo sostienen.',
      ]),
      mult('¿Qué tiene que lograr un sistema alimentario sostenible? Marcá todo lo que corresponde.', [ // e5
        '+Alimentar bien a toda la población',
        '+Cuidar el suelo, el agua y la biodiversidad',
        '+Dar condiciones dignas a quienes trabajan en él',
        '+Reducir sus emisiones',
        '-Producir lo más barato posible sin importar el resto',
      ], 'Sostenible es ambiental, social y económico a la vez. Lo más barato hoy puede ser lo más caro mañana.', { d: 2 }),
      cad('Armá la cadena de cómo una decisión en el plato llega al campo.', [ // e6
        'Muchas personas eligen comer más legumbres',
        'Los comercios venden más legumbres',
        'Compran más a los productores',
        'Se siembran más legumbres en el campo',
      ], ['El campo decide solo qué comemos, sin importar lo que se compra'], 'Lo que se compra orienta lo que se produce. Es una palanca lenta pero poderosa.', { d: 2 }),
      par('Uní cada recurso con cómo lo usa el sistema alimentario.', [ // e7
        ['Agua dulce', 'Riego de cultivos y bebida de animales'],
        ['Tierra', 'Campos de cultivo y pasturas'],
        ['Energía', 'Maquinaria, fábricas, transporte y frío'],
        ['Trabajo', 'Personas en cada etapa de la cadena'],
      ], 'Cuatro recursos que la góndola no muestra.', { d: 1 }),
      det('Leé este comentario y marcá lo equivocado.', [ // e8
        ['La comida pasa por muchas etapas antes de llegar al plato.', false],
        ['La agricultura usa muy poca agua comparada con las ciudades.', true, 'Es al revés: la agricultura usa alrededor del 70 % del agua dulce extraída.'],
        ['El sistema alimentario ocupa mucha tierra del planeta.', false],
        ['Lo que comemos no tiene relación con el clima.', true, 'El sistema alimentario produce entre un cuarto y un tercio de las emisiones.'],
      ], 'La comida está en el centro de casi todos los problemas ambientales grandes.', { d: 2 }),
      est('Estimá qué porcentaje del agua dulce que se extrae en el mundo se usa en la agricultura.', 70, { min: 0, max: 100, paso: 5, unidad: '%' }, 'Alrededor del 70 %. La industria y las ciudades se reparten el resto. Por eso el agua y la comida están tan conectadas.', { d: 2 }),
      op('¿Por qué se dice que la comida es una de las palancas ambientales más grandes?', [
        'Porque toca a la vez el clima, el agua, la tierra y la biodiversidad',
        'Porque es lo que más plata gasta una familia en todo el año',
        ['Porque los alimentos vienen en muchos envases de plástico', 'Los envases importan, pero son una parte chica del impacto de la comida.'],
        'Porque la comida se transporta en camiones de larga distancia',
      ], 'Pocas actividades humanas afectan tantas cosas a la vez como producir comida.', { d: 2 }),
      comp('Completá.', 'El sistema alimentario usa alrededor del [70] % del agua dulce extraída y cerca de la [mitad] de la tierra habitable.', ['10', 'décima', 'totalidad'], 'Dos números para dimensionar la comida como sistema.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('La energía que comemos', 'Del sol a la planta, de la planta al animal: por qué cada escalón de la cadena cuesta más recursos.', [
      teoria('Toda comida es sol', [
        'Como viste en el tronco, las plantas capturan la energía del sol con la fotosíntesis y la guardan como azúcares, almidones, grasas y proteínas. Todo lo que comemos viene de ahí: directamente, si comemos plantas, o indirectamente, si comemos animales que comieron plantas.',
      ]),
      cad('Seguí la energía de un vaso de leche.', [ // e1
        'El sol ilumina una pastura',
        'La pastura guarda energía con la fotosíntesis',
        'La vaca come la pastura',
        'Parte de esa energía se convierte en leche',
        'Tomás el vaso de leche',
      ], ['La vaca produce energía de la nada'], 'La leche es energía del sol que pasó por una planta y un animal.', { d: 1 }),
      teoria('El costo de cada escalón', [
        'Un animal usa la mayor parte de lo que come para vivir: moverse, mantener su temperatura, respirar. Solo una parte chica se convierte en carne, leche o huevos. En promedio, en cada escalón de una cadena alimentaria pasa alrededor del 10 % de la energía al escalón siguiente.',
        'Por eso, para producir una caloría de carne vacuna hacen falta muchas calorías de pasto o granos. Con el pollo, los huevos o la leche la conversión es más eficiente, pero siempre se pierde mucho respecto de comer las plantas directamente.',
      ], {
        datos: barras('De cada 100 calorías de alimento que come el animal, cuántas llegan como comida (aproximado)', 'calorías', [
          ['Leche', 24],
          ['Huevos', 22],
          ['Pollo', 13],
          ['Cerdo', 9],
          ['Carne vacuna', 3],
        ], 'Valores de referencia aproximados; cambian según el sistema de producción.'),
      }),
      rank('Ordená estos alimentos por cuántas calorías del alimento del animal llegan como comida, de más a menos eficiente.', [ // e2
        ['Leche', '≈ 24 de cada 100'],
        ['Huevos', '≈ 22 de cada 100'],
        ['Pollo', '≈ 13 de cada 100'],
        ['Carne vacuna', '≈ 3 de cada 100'],
      ], 'La vaca es grande, vive años y usa mucha energía para sí misma. Por eso su conversión es la menos eficiente.', { d: 2 }),
      numv(3, (i) => { // e3
        const cal = [1000, 2000, 500][i];
        return {
          enunciado: `Si de cada 100 calorías que come una vaca llegan 3 como carne, ¿cuántas calorías de alimento hacen falta para producir ${cal.toLocaleString('es-AR')} calorías de carne? Redondeá al entero.`,
          valor: Math.round((cal * 100) / 3),
          unidad: 'calorías',
          tol: 5,
          explicacion: `${cal.toLocaleString('es-AR')} × 100 ÷ 3 ≈ ${Math.round((cal * 100) / 3).toLocaleString('es-AR')} calorías de alimento. Unas 33 veces más, aunque parte de ese alimento sea pasto que las personas no podrían comer.`,
        };
      }, { d: 3 }),
      teoria('Pero no todo es igual', [
        'Hay un matiz importante: una parte del alimento de los animales, como el pasto de campos donde no se puede cultivar, no podría comerlo una persona. En esos casos, el animal convierte algo no comestible en comida.',
        'El problema aparece cuando los animales comen granos que podrían alimentar personas directamente, o cuando se desmontan bosques para hacer pasturas o cultivos para alimento animal.',
      ]),
      vf('Todo el alimento de las vacas podría comerlo directamente una persona.', false, 'Una parte es pasto de campos que no sirven para cultivar, que las personas no pueden digerir. El debate está en los granos y en los bosques que se desmontan.', { // e4
        razones: ['+Porque parte es pasto que las personas no pueden digerir', '-Porque las vacas solo comen soja', '-Porque las personas pueden digerir cualquier pasto'],
        d: 3,
      }),
      clas('¿Esto es comida directa para personas o alimento que pasa por un animal?', { // e5
        'Comida directa': ['Lentejas en un guiso', 'Pan de trigo', 'Una manzana'],
        'Pasa por un animal': ['Maíz para engordar pollos', 'Soja convertida en alimento balanceado', 'Pasto para vacas'],
      }, 'Una parte grande de los granos del mundo se usa para alimentar animales, no personas.', { d: 2 }),
      teoria('Tierra para comer', [
        'Como los animales convierten con pérdidas, la ganadería usa la mayor parte de la tierra agrícola del mundo, entre pasturas y cultivos para alimento animal, alrededor de las tres cuartas partes. Pero aporta menos de un quinto de las calorías y alrededor de un tercio de las proteínas que se consumen en el mundo.',
      ], {
        datos: barras('Ganadería: tierra que usa y comida que aporta (mundo, aproximado)', '% del total', [
          ['Tierra agrícola usada', 77],
          ['Proteínas aportadas', 37],
          ['Calorías aportadas', 18],
        ], 'Nuestro Mundo en Datos, a partir de datos de la FAO.'),
      }),
      op('La ganadería usa cerca de tres cuartos de la tierra agrícola del mundo. ¿Cuántas de las calorías consumidas aporta?', [ // e6
        'Menos de un quinto',
        'Alrededor de tres cuartos',
        ['Más de la mitad', 'Aporta mucho menos: alrededor del 18 % de las calorías.'],
        'Casi la totalidad de las calorías',
      ], 'Mucha tierra, pocas calorías. Es la consecuencia directa de las pérdidas de cada escalón.', { d: 2 }),
      par('Uní cada idea con su ejemplo.', [ // e7
        ['Fotosíntesis', 'Una pastura guarda energía del sol'],
        ['Pérdida por escalón', 'La vaca usa casi todo lo que come para vivir'],
        ['Conversión eficiente', 'La gallina transforma bastante alimento en huevos'],
        ['Alimento no comestible', 'Pasto de un campo que no se puede cultivar'],
      ], 'Cuatro conceptos que explican por qué no todas las comidas cuestan lo mismo.', { d: 2 }),
      numv(3, (i) => {
        const cal = [1000, 2600, 500][i];
        return {
          enunciado: `Si de cada 100 calorías que come un pollo llegan unas 13 como carne, ¿cuántas calorías de alimento hacen falta para ${cal.toLocaleString('es-AR')} calorías de pollo? Redondeá al entero.`,
          valor: Math.round((cal * 100) / 13),
          unidad: 'calorías',
          tol: 5,
          explicacion: `${cal.toLocaleString('es-AR')} × 100 ÷ 13 ≈ ${Math.round((cal * 100) / 13).toLocaleString('es-AR')} calorías de alimento: unas 8 veces más. Con la carne vacuna eran unas 33 veces.`,
        };
      }, { d: 3 }),
      mult('¿Cuáles de estos alimentos llegan al plato sin pasar por un animal? Marcá todos.', [
        '+Un guiso de garbanzos',
        '+Una ensalada de tomate y lechuga',
        '+Una polenta',
        '-Una milanesa de carne',
        '-Un flan de huevo y leche',
      ], 'Los alimentos vegetales se saltean el escalón del animal: usan menos tierra y energía por caloría.', { d: 1 }),
      det('Leé esta explicación y marcá lo equivocado.', [ // e8
        ['Toda la comida viene, al final, de la energía del sol.', false],
        ['Una vaca convierte en carne casi todo lo que come.', true, 'Convierte una parte muy chica; el resto lo usa para vivir.'],
        ['La leche y los huevos convierten mejor que la carne vacuna.', false],
        ['La ganadería aporta la mayoría de las calorías del mundo.', true, 'Aporta menos de un quinto, aunque usa la mayor parte de la tierra agrícola.'],
      ], 'Los escalones de la cadena explican buena parte de la huella de la comida.', { d: 3 }),
      comp('Completá.', 'En cada escalón de una cadena alimentaria pasa alrededor del [10] % de la energía; por eso la carne vacuna usa mucha [tierra].', ['90', 'sal', 'luz'], 'La idea de los escalones del tronco, aplicada a lo que comemos.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Qué necesita el cuerpo', 'Nutrientes, grupos de alimentos y los mensajes de las Guías Alimentarias para la Población Argentina.', [
      teoria('Los nutrientes', [
        'Los alimentos aportan energía y nutrientes. Los hidratos de carbono (en cereales, legumbres, papas, frutas) son la principal fuente de energía. Las proteínas (en carnes, huevos, lácteos, legumbres) forman y reparan tejidos. Las grasas aportan energía y ayudan a absorber vitaminas. Las vitaminas y los minerales regulan funciones del cuerpo. La fibra ayuda a la digestión.',
        'Ningún alimento tiene todo. Por eso la clave es la variedad.',
      ]),
      par('Uní cada nutriente con su función principal.', [ // e1
        ['Hidratos de carbono', 'Principal fuente de energía'],
        ['Proteínas', 'Formar y reparar tejidos'],
        ['Fibra', 'Ayudar a la digestión'],
        ['Vitaminas y minerales', 'Regular funciones del cuerpo'],
      ], 'Cada nutriente tiene su trabajo. Una alimentación variada los cubre a todos.', { d: 1 }),
      teoria('Las Guías Alimentarias', [
        'Las Guías Alimentarias para la Población Argentina, del Ministerio de Salud, traducen la ciencia de la nutrición a mensajes simples. Entre ellos: comer a diario alimentos de todos los grupos, tomar agua segura, consumir cinco porciones de frutas y verduras de variados tipos y colores, reducir la sal, limitar bebidas azucaradas y productos con mucha grasa, azúcar y sal, y consumir legumbres y cereales, preferentemente integrales.',
        'Muchas de estas recomendaciones de salud coinciden con las del ambiente: más frutas, verduras y legumbres, menos productos ultraprocesados.',
      ], { destacado: { valor: '5 porciones', texto: 'de frutas y verduras por día, de variados tipos y colores, recomiendan las Guías Alimentarias argentinas.' } }),
      mult('¿Cuáles de estos son mensajes de las Guías Alimentarias argentinas? Marcá todos.', [ // e2
        '+Consumir a diario 5 porciones de frutas y verduras',
        '+Reducir el uso de sal',
        '+Limitar las bebidas azucaradas',
        '+Consumir legumbres y cereales, preferentemente integrales',
        '-Comer carne vacuna en todas las comidas',
      ], 'Las guías recomiendan variedad y moderación. Ningún alimento es obligatorio en todas las comidas.', { d: 2 }),
      teoria('Proteínas de origen vegetal', [
        'Las legumbres —lentejas, porotos, garbanzos, arvejas, soja— son una fuente excelente de proteínas, fibra, hierro y otros minerales, y son baratas. Combinadas con cereales (arroz con lentejas, guiso de porotos con pan, polenta con garbanzos) aportan proteínas de muy buena calidad.',
        'Además, las legumbres fijan nitrógeno del aire en el suelo gracias a bacterias de sus raíces, lo que reduce la necesidad de fertilizantes.',
      ]),
      op('¿Por qué se recomienda combinar legumbres con cereales?', [ // e3
        'Porque juntos aportan proteínas más completas',
        'Porque las legumbres solas no tienen proteínas',
        ['Porque los cereales hacen que las legumbres se cocinen más rápido', 'La razón es nutricional, no de cocción.'],
        'Porque así el plato pesa más y llena más',
      ], 'Cada grupo tiene los aminoácidos que al otro le faltan. Muchas cocinas tradicionales del mundo lo descubrieron hace siglos.', { d: 2 }),
      vf('Solo la carne aporta proteínas de buena calidad.', false, 'Las legumbres combinadas con cereales, los huevos y los lácteos también aportan proteínas de muy buena calidad.', { // e4
        razones: ['+Porque legumbres con cereales, huevos y lácteos también las aportan', '-Porque las plantas no tienen proteínas', '-Porque las proteínas solo sirven si vienen de la carne'],
        d: 2,
      }),
      clas('¿A qué grupo pertenece cada alimento?', { // e5
        'Legumbres': ['Lentejas', 'Garbanzos', 'Porotos'],
        'Cereales y derivados': ['Arroz', 'Avena', 'Pan'],
        'Frutas y verduras': ['Zapallo', 'Naranja', 'Acelga'],
      }, 'Tres grupos base de una alimentación saludable y con menor impacto.', { d: 1 }),
      teoria('Salud y ambiente, juntos', [
        'Los estudios que comparan dietas encuentran que muchas de las más saludables —con abundantes vegetales, legumbres, cereales integrales y frutos secos, y cantidades moderadas de alimentos de origen animal— también son las de menor impacto ambiental.',
        'No hace falta una dieta perfecta ni dejar de comer ningún alimento: cambios graduales en las proporciones del plato suman mucho.',
      ]),
      cad('Armá la cadena de cómo sumar legumbres ayuda a la salud y al ambiente.', [ // e6
        'Una familia reemplaza carne por lentejas dos veces por semana',
        'Suma fibra, hierro y proteínas vegetales',
        'Reduce la demanda de carne vacuna',
        'Baja la huella de su alimentación',
      ], ['Las lentejas hacen crecer bosques en la góndola'], 'Un mismo cambio, dos beneficios. Cuando salud y ambiente coinciden, es más fácil sostener el hábito.', { d: 2 }),
      numv(3, (i) => { // e7
        const porc = [2, 3, 1][i];
        return {
          enunciado: `Las guías recomiendan 5 porciones de frutas y verduras por día. Si alguien come ${porc}, ¿cuántas porciones por semana le faltan para llegar a la recomendación?`,
          valor: (5 - porc) * 7,
          unidad: 'porciones',
          explicacion: `Le faltan ${5 - porc} por día: ${5 - porc} × 7 = ${(5 - porc) * 7} porciones por semana. Sumar una fruta de postre y una verdura al almuerzo ya acorta mucho la brecha.`,
        };
      }, { d: 2 }),
      op('¿Cuántos vasos de agua segura por día recomiendan las Guías Alimentarias argentinas?', [
        '8 vasos',
        '2 vasos',
        ['Ninguno: alcanza con el agua de la comida', 'Las guías recomiendan tomar agua segura todos los días, unos 8 vasos.'],
        '20 vasos',
      ], 'Unos 8 vasos por día, y agua en lugar de bebidas azucaradas.', { d: 1 }),
      vf('Los cereales integrales tienen más fibra que los refinados.', true, 'Conservan la cáscara del grano, donde está buena parte de la fibra, las vitaminas y los minerales. Por eso las guías los recomiendan.', {
        razones: ['+Porque conservan la cáscara del grano, rica en fibra', '-Porque se les agrega fibra artificial siempre', '-Porque los refinados no tienen hidratos de carbono'],
        d: 2,
      }),
      det('Leé este consejo de un influencer y marcá lo equivocado.', [ // e8
        ['Las legumbres tienen proteínas, fibra y hierro.', false],
        ['Las Guías Alimentarias recomiendan comer carne en todas las comidas.', true, 'Recomiendan variedad; no piden carne en todas las comidas.'],
        ['Conviene tomar agua segura en lugar de bebidas azucaradas.', false],
        ['Si comés sano, seguro dañás más el ambiente.', true, 'Muchas dietas saludables son también de menor impacto.'],
      ], 'Salud y ambiente suelen ir en la misma dirección en el plato.', { d: 2 }),
      comp('Completá.', 'Las [legumbres] combinadas con [cereales] aportan proteínas de muy buena calidad.', ['frituras', 'gaseosas', 'golosinas'], 'Una combinación barata, sana y de bajo impacto.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('El viaje de un alimento', 'Cosecha, acopio, industria, camión, góndola y heladera: el recorrido y la cadena de frío.', [
      teoria('Muchos pasos', [
        'Un tomate de la huerta del vecino hace un viaje corto. Un tomate del mercado de una gran ciudad suele pasar por cosecha, empaque, un mercado concentrador, un distribuidor, un comercio y, recién después, la casa. Un producto procesado suma fábricas, envases y depósitos.',
        'Cada paso agrega costos, tiempo y riesgos de que el alimento se pierda. Pero también cumple funciones: juntar la producción de muchos productores, controlar la calidad y llevar comida a donde no se produce.',
      ]),
      ord('Ordená el recorrido típico de una lechuga hasta una verdulería de la ciudad.', [ // e1
        'Se cosecha en una quinta del cinturón hortícola',
        'Se empaca en cajones',
        'Llega a un mercado concentrador',
        'La compra un verdulero',
        'La vende en su local',
      ], 'Un recorrido corto en distancia, pero con varios intermediarios.', { d: 1, extremos: ['Primero', 'Último'] }),
      teoria('La cadena de frío', [
        'Muchos alimentos —carnes, lácteos, pescados, algunas verduras— tienen que mantenerse fríos desde que se producen hasta que se comen. Eso es la cadena de frío: cámaras, camiones refrigerados, heladeras de comercios y la heladera de casa.',
        'Si la cadena se corta, los microbios se multiplican: el alimento se echa a perder antes y puede enfermar a quien lo come. La heladera de casa debería estar a 5 °C o menos, y el freezer a unos −18 °C.',
      ], { destacado: { valor: '≤ 5 °C', texto: 'es la temperatura a la que debería estar la heladera para conservar bien los alimentos.' } }),
      cad('Armá la cadena de qué pasa si un yogur queda horas fuera de la heladera en verano.', [ // e2
        'El yogur se calienta',
        'Los microbios se multiplican más rápido',
        'El yogur se echa a perder antes de su vencimiento',
        'Se tira y se desperdicia todo lo que costó producirlo',
      ], ['El frío vuelve a matar a todos los microbios al guardarlo'], 'La cadena de frío protege la salud y evita desperdicio. Un eslabón roto arruina el trabajo de todos los anteriores.', { d: 2 }),
      mult('¿Qué alimentos necesitan cadena de frío? Marcá todos.', [ // e3
        '+Leche fresca',
        '+Carne picada',
        '+Pescado fresco',
        '+Queso fresco',
        '-Lentejas secas',
      ], 'Los alimentos frescos de origen animal son los más sensibles. Las legumbres secas se conservan meses a temperatura ambiente.', { d: 1 }),
      vf('Una heladera a 10 °C conserva los alimentos igual de bien que una a 4 °C.', false, 'A 10 °C los microbios se multiplican bastante más rápido. Se recomienda 5 °C o menos.', { // e4
        razones: ['+Porque a más temperatura los microbios crecen más rápido', '-Porque los microbios no crecen en la heladera a ninguna temperatura', '-Porque a 4 °C los alimentos se congelan'],
        d: 2,
      }),
      teoria('Pérdida y desperdicio', [
        'A lo largo del viaje, una parte de la comida se pierde: en la cosecha, el transporte, el almacenamiento y la venta. A eso se suma la comida que se tira en comercios, restaurantes y casas. Según la FAO y el PNUMA, se pierde o desperdicia una parte muy grande de todo lo que se produce en el mundo, del orden de un tercio si se suman todas las etapas.',
        'Toda esa comida usó tierra, agua, energía y trabajo para nada. La rama tiene una unidad entera sobre esto.',
      ]),
      clas('¿Es pérdida (antes de la venta) o desperdicio (en la venta o el consumo)?', { // e5
        'Pérdida': ['Frutas golpeadas en un camión', 'Granos que se humedecen en un silo', 'Verduras que no se cosechan por bajo precio'],
        'Desperdicio': ['Yogur vencido en la heladera de casa', 'Pan que sobra en una panadería', 'Comida que queda en el plato de un restaurante'],
      }, 'La diferencia está en la etapa. Las soluciones son distintas: logística para las pérdidas, hábitos y reglas para el desperdicio.', { d: 2 }),
      par('Uní cada eslabón con su riesgo principal.', [ // e6
        ['Cosecha', 'Productos dañados o no cosechados'],
        ['Transporte', 'Golpes y calor'],
        ['Comercio', 'Productos que no se venden a tiempo'],
        ['Casa', 'Comida que se vence o sobra'],
      ], 'En cada eslabón se puede perder comida. Y cada uno tiene su solución.', { d: 2 }),
      op('En un día de calor, ¿cuál es la mejor forma de volver del supermercado?', [ // e7
        'Comprar los fríos al final y llevarlos directo a casa',
        'Comprar primero la carne y hacer otras compras después',
        ['Dejar las bolsas en el baúl mientras hacés otras cosas', 'El baúl al sol supera fácil los 40 °C: la cadena de frío se corta.'],
        'Llevar los lácteos en la mano para que no se aplasten',
      ], 'Los fríos, últimos en el changuito y primeros en la heladera. Una bolsa térmica ayuda.', { d: 2 }),
      est('Estimá qué fracción de toda la comida producida en el mundo se pierde o se desperdicia, sumando todas las etapas.', 33, { min: 0, max: 100, paso: 1, unidad: '%' }, 'Del orden de un tercio. Toda esa comida usó tierra, agua y energía sin alimentar a nadie.', { d: 2 }),
      mult('¿Qué ayuda a no cortar la cadena de frío en casa? Marcá todo lo que corresponde.', [
        '+Guardar los fríos apenas se llega del súper',
        '+No abrir la heladera más de lo necesario',
        '+Descongelar dentro de la heladera',
        '+Enfriar rápido las sobras y guardarlas tapadas',
        '-Dejar la carne en la mesada hasta la noche',
      ], 'La cadena de frío termina en tu cocina. Cada minuto a temperatura ambiente cuenta.', { d: 2 }),
      det('Leé estos consejos y marcá los equivocados.', [ // e8
        ['Mantené la heladera a 5 °C o menos.', false],
        ['Descongelá la carne sobre la mesada toda la tarde.', true, 'Se descongela mejor en la heladera: afuera la superficie se calienta y crecen microbios.'],
        ['Guardá los alimentos que vencen antes adelante.', false],
        ['Si la heladera está llena, subile la temperatura para que no trabaje tanto.', true, 'Una heladera más caliente conserva peor los alimentos y aumenta el desperdicio.'],
      ], 'La cadena de frío termina en tu casa. Ahí también se cuida.', { d: 3 }),
      comp('Completá.', 'La cadena de [frío] mantiene los alimentos seguros; la heladera debería estar a [5] °C o menos y el freezer a unos −[18] °C.', ['calor', '12', '8'], 'Tres números y una idea para no perder comida en casa.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Tierra, agua y comida', 'Cuánta tierra hace falta para alimentar a una persona, y por qué la forma de producir importa tanto como qué se produce.', [
      teoria('La tierra que comemos', [
        'Cada alimento necesita una superficie para producirse. Un kilo de legumbres o de cereales necesita pocos metros cuadrados por año; un kilo de carne vacuna, muchísimos más, porque incluye las pasturas y los cultivos que comió el animal.',
        'Según la base de datos de Poore y Nemecek, que reúne miles de establecimientos del mundo, producir 100 gramos de proteína de carne vacuna usa en promedio decenas de veces más tierra que producir 100 gramos de proteína de legumbres.',
      ], {
        datos: barras('Tierra usada por kilo de alimento (promedio mundial, aproximado)', 'm² por año', [
          ['Carne vacuna', 326],
          ['Queso', 88],
          ['Carne de cerdo', 17],
          ['Pollo', 12],
          ['Arvejas', 7],
          ['Trigo', 4],
        ], 'Promedios mundiales de Poore y Nemecek (2018), redondeados. Hay mucha variación entre sistemas.'),
      }),
      rank('Según esos promedios, ordená los alimentos por tierra usada por kilo, de más a menos.', [ // e1
        ['Carne vacuna', '≈ 326 m²'],
        ['Queso', '≈ 88 m²'],
        ['Carne de cerdo', '≈ 17 m²'],
        ['Pollo', '≈ 12 m²'],
        ['Arvejas', '≈ 7 m²'],
      ], 'Una diferencia de decenas de veces entre la carne vacuna y las legumbres. Es el efecto de los escalones de la cadena.', { d: 2 }),
      numv(3, (i) => { // e2
        const kg = [2, 5, 10][i];
        return {
          enunciado: `Si un kilo de carne vacuna usa en promedio unos 326 m² de tierra por año, ¿cuántos m² usan ${kg} kilos?`,
          valor: kg * 326,
          unidad: 'm²',
          explicacion: `${kg} × 326 = ${(kg * 326).toLocaleString('es-AR')} m². Para comparar: una cancha de fútbol tiene unos 7.000 m².`,
        };
      }, { d: 2 }),
      teoria('Cómo se produce también importa', [
        'Los promedios esconden mucha variación. La misma comida puede tener impactos muy distintos según cómo se produce: una ganadería que desmonta bosque nativo tiene un impacto enorme; una que maneja bien pastizales naturales, mucho menor. Un cultivo con buen manejo del suelo y del agua impacta menos que uno que lo erosiona.',
        'En Argentina, el avance de la frontera agropecuaria sobre bosques del Chaco y el Espinal es uno de los mayores problemas ambientales. Por eso importa tanto qué comemos como de dónde viene.',
      ]),
      vf('Dos kilos de carne vacuna siempre tienen exactamente el mismo impacto ambiental.', false, 'Depende muchísimo del sistema de producción: si hubo desmonte, cómo se manejan las pasturas, qué comen los animales. Los promedios esconden grandes diferencias.', { // e3
        razones: ['+Porque el impacto depende mucho de cómo se produjo', '-Porque toda la carne se produce igual en el mundo', '-Porque la carne no tiene impacto ambiental'],
        d: 2,
      }),
      cad('Armá la cadena de cómo un desmonte en el Chaco se relaciona con la comida.', [ // e4
        'Aumenta la demanda de soja o de carne',
        'Se vuelve rentable ampliar la superficie cultivable',
        'Se desmonta bosque nativo',
        'Se pierden biodiversidad y el carbono guardado en el bosque',
      ], ['El desmonte hace llover más en la zona'], 'La comida conecta la mesa con los bosques. La Ley de Bosques, que vas a ver en la rama de Plantas, busca ordenar ese avance.', { d: 3 }),
      teoria('Agua para comer', [
        'Como viste en la rama de Agua, la agricultura es la mayor usuaria de agua dulce del mundo. La mayor parte de los cultivos argentinos de la región pampeana se riega con lluvia (agua verde), pero en las regiones secas del oeste, como Mendoza o San Juan, casi todo depende del riego con agua de los ríos de montaña (agua azul).',
      ]),
      par('Uní cada producción con su fuente principal de agua.', [ // e5
        ['Soja en la región pampeana', 'Lluvia'],
        ['Vid en Mendoza', 'Riego con agua de los ríos de montaña'],
        ['Hortalizas del cinturón platense', 'Lluvia y riego con agua de pozo'],
        ['Arroz en Corrientes', 'Riego con agua de ríos y lagunas'],
      ], 'Donde hay riego, la comida compite con otros usos del agua. En las zonas secas, esa competencia es fuerte.', { d: 3 }),
      mult('¿Qué hace que la producción de un alimento impacte menos? Marcá todo lo que ayuda.', [ // e6
        '+Que no se desmonten bosques para producirlo',
        '+Que se cuide el suelo de la erosión',
        '+Que se use el agua de riego con eficiencia',
        '+Que se usen los fertilizantes en la dosis justa',
        '-Que el envase sea de colores llamativos',
      ], 'La forma de producir es la otra mitad de la huella. El envase, en general, es una parte chica.', { d: 2 }),
      op('Para reducir la tierra que usa su alimentación, ¿qué cambio tiene más efecto para una persona que come carne vacuna a diario?', [ // e7
        'Reemplazar parte de esa carne por legumbres, pollo o huevos',
        'Comprar la misma carne pero en otra carnicería del barrio',
        ['Comprar verduras en bandeja en vez de sueltas', 'Afecta los envases, no la tierra usada.'],
        'Cocinar la carne a la parrilla en vez de al horno',
      ], 'La tierra se va sobre todo en la carne vacuna. Cambiar parte de ella tiene un efecto grande.', { d: 3 }),
      numv(3, (i) => {
        const kg = [1, 4, 12][i];
        return {
          enunciado: `Usando los promedios (carne vacuna ≈ 326 m² por kilo, arvejas ≈ 7 m² por kilo), ¿cuántos m² de tierra se ahorran al reemplazar ${kg} kg de carne vacuna por ${kg} kg de arvejas?`,
          valor: kg * (326 - 7),
          unidad: 'm²',
          explicacion: `(326 − 7) × ${kg} = ${(kg * 319).toLocaleString('es-AR')} m². El ahorro viene casi todo de la carne que no se produce.`,
        };
      }, { d: 3 }),
      vf('La mayor parte de la soja de la región pampeana se riega con agua de pozos.', false, 'En la región pampeana la mayor parte de los cultivos depende de la lluvia (agua verde). El riego es clave en las regiones secas del oeste.', {
        razones: ['+Porque allí la mayoría de los cultivos depende de la lluvia', '-Porque en la región pampeana no llueve nunca', '-Porque la soja no necesita agua para crecer'],
        d: 2,
      }),
      det('Leé esta nota y marcá lo equivocado.', [ // e8
        ['La carne vacuna usa mucha más tierra por kilo que las legumbres.', false],
        ['Por eso toda la ganadería es igual de dañina.', true, 'Depende del sistema: el desmonte y el mal manejo empeoran mucho el impacto.'],
        ['En Mendoza, los cultivos dependen del riego.', false],
        ['El envase es lo que más pesa en el impacto de la carne.', true, 'Para la carne, la producción en el campo pesa muchísimo más que el envase.'],
      ], 'Qué se come y cómo se produce: las dos mitades de la huella.', { d: 3 }),
      comp('Completá.', 'La carne vacuna usa en promedio mucha más [tierra] por kilo que las legumbres, pero el impacto también depende de cómo se [produce].', ['sal', 'envasa', 'agua dulce'], 'Promedios y sistemas: dos formas de mirar la misma huella.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: del campo al plato', 'Sistema alimentario, energía, nutrientes, recorrido y recursos, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el almuerzo de la escuela', 'Una escuela revisa su almuerzo con los números. Evaluá qué cambiar sin perder nutrición. Aprobalo para hacer crecer la rama.', [
      teoria('El menú', [
        'El comedor de una escuela sirve 200 almuerzos por día. Cuatro días por semana hay carne vacuna, 150 gramos por plato. Casi nunca hay legumbres y las frutas aparecen una vez por semana. La cocinera cuenta que muchas bandejas de verduras vuelven llenas.',
        'La escuela quiere un menú más saludable y de menor impacto, sin subir el presupuesto.',
      ]),
      num('¿Cuántos kilos de carne vacuna usa el comedor por semana?', 120, 'kg', '200 platos × 0,15 kg × 4 días = 120 kg por semana.', { ctx: '200 almuerzos, 150 g de carne por plato, 4 días por semana.', d: 2 }),
      num('Si un kilo de carne vacuna usa unos 326 m² de tierra por año, ¿cuántos m² representa la carne de una semana?', 39120, 'm²', '120 × 326 = 39.120 m²: más de cinco canchas de fútbol, solo en una semana de un comedor.', { ctx: '120 kg de carne vacuna por semana; 326 m² por kilo.', d: 3 }),
      numv(3, (i) => { // e3
        const dias = [2, 1, 3][i];
        return {
          enunciado: `Si el comedor reemplaza la carne vacuna por guiso de lentejas ${dias} de los 4 días, ¿cuántos kilos de carne por semana deja de usar?`,
          valor: 200 * 0.15 * dias,
          unidad: 'kg',
          explicacion: `200 × 0,15 × ${dias} = ${200 * 0.15 * dias} kg menos por semana. Es un ${(dias / 4) * 100} % menos de carne vacuna, con un plato que aporta proteínas, fibra y hierro.`,
        };
      }, { d: 2 }),
      mult('¿Qué cambios mejoran el menú en salud y en ambiente al mismo tiempo? Marcá todos.', [ // e4
        '+Sumar legumbres dos días por semana',
        '+Fruta de postre todos los días',
        '+Verduras de estación, que suelen ser más baratas',
        '+Combinar legumbres con cereales',
        '-Reemplazar la carne por salchichas ultraprocesadas',
      ], 'Los ultraprocesados no mejoran la nutrición. Legumbres, frutas y verduras de estación sí, y bajan el impacto.', { d: 3 }),
      op('Las bandejas de verduras vuelven llenas. ¿Qué conviene hacer primero?', [ // e5
        'Preguntar a los chicos y cambiar cómo se preparan',
        'Dejar de servir verduras porque nadie las come',
        ['Servir más cantidad para que alguna se coma', 'Si no se comen, más cantidad es más desperdicio.'],
        'Obligar a terminar el plato antes del postre',
      ], 'El desperdicio es una señal. Preparaciones más ricas (tortillas, budines, salsas) suelen resolverlo mejor que la insistencia.', { d: 3 }),
      clas('Clasificá las propuestas de las familias.', { // e6
        'Buena idea': ['Guiso de lentejas con arroz los martes', 'Huerta escolar para conocer las verduras', 'Fruta de estación de postre'],
        'Mala idea': ['Gaseosa con el almuerzo para que coman más', 'Duplicar las porciones de carne', 'Eliminar todas las verduras'],
      }, 'Las buenas ideas suman nutrición, bajan el impacto y enseñan. Las malas empeoran alguna de las tres cosas.', { d: 2 }),
      det('La escuela escribe su nuevo plan. Marcá lo que no conviene.', [ // e7
        ['Dos días por semana, legumbres con cereales en lugar de carne vacuna.', false],
        ['Guardamos la comida que sobra afuera de la heladera para servirla al día siguiente.', true, 'Sin cadena de frío es un riesgo para la salud: lo que sobra se enfría rápido y se guarda en frío.'],
        ['Fruta de estación de postre todos los días.', false],
        ['Como las legumbres no tienen proteínas, sumamos un postre de más.', true, 'Las legumbres tienen muchas proteínas, y más con cereales.'],
      ], 'Un buen menú combina nutrición, seguridad alimentaria y menor impacto.', { d: 3 }),
    ]),
  ],
});
