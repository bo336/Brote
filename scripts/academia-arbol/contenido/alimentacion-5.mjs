import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// ALIMENTACIÓN 5 — El campo y el clima.
// Cuánto pesa el sistema alimentario en el clima, la ganadería y el metano
// vistos desde la producción, fertilizantes, suelo y arroz, las cadenas
// libres de desmonte y cómo adaptar la producción a un clima que cambia.
// Retoma la huella de los alimentos (alimentacion-2), la agroecología
// (alimentacion-4), el suelo vivo (aire-suelo-2) y el desmonte (animales-4).

export default unidad({
  slug: 'alimentacion-5',
  rama: 'alimentacion',
  orden: 5,
  nivel: 3,
  requiereTronco: 3,
  titulo: 'El campo y el clima',
  bajada: 'Vacas, soja, fertilizantes, arrozales y sequías: cuánto pesa la producción de alimentos en el clima, cómo se puede producir con menos emisiones y cómo prepararse para un clima que cambia.',
  objetivos: [
    'Dimensionar el peso del sistema alimentario en las emisiones mundiales',
    'Explicar la intensidad de emisiones de la ganadería y cómo reducirla',
    'Analizar prácticas agrícolas que reducen óxido nitroso y metano o guardan carbono',
    'Explicar las cadenas libres de desmonte y la trazabilidad',
    'Proponer estrategias de adaptación de la producción agropecuaria',
  ],
  repasa: ['alimentacion-2', 'alimentacion-4', 'aire-suelo-2', 'animales-4'],
  fuentes: ['crippa-2021', 'poore-nemecek-2018', 'ipcc-srccl', 'inventario-gei-ar', 'ue-deforestacion', 'ley-bosques-26331', 'aapresid', 'inta', 'wwa-atribucion'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Un tercio de las emisiones', 'Del campo al tacho: cuánto emite el sistema alimentario mundial y en qué etapas.', [
      teoria('La cuenta completa', [
        'Un estudio publicado en Nature Food en 2021 sumó todas las emisiones del sistema alimentario: desde el cambio de uso del suelo para producir alimentos hasta el procesamiento, el transporte, los envases, el comercio, la cocina y los residuos. El resultado: alrededor de un tercio de las emisiones de gases de efecto invernadero de origen humano del mundo, unos 18.000 millones de toneladas de CO₂e en 2015.',
        'Cerca del 70 % de esas emisiones venía de la producción agropecuaria y de los cambios de uso del suelo, como los desmontes. El resto, de la cadena que sigue después de la tranquera.',
      ], {
        datos: barras('Origen de las emisiones del sistema alimentario (aproximado)', '%', [
          ['Producción agropecuaria y cambio de uso del suelo', 71],
          ['Cadena posterior: industria, transporte, envases, comercio, cocina y residuos', 29],
        ], 'Crippa y otros, Nature Food, 2021.'),
      }),
      est('Estimá qué fracción de las emisiones humanas de gases de efecto invernadero corresponde al sistema alimentario, según el estudio de 2021.', 34, { min: 0, max: 100, paso: 1, unidad: '%' }, 'Alrededor de un tercio, el 34 % en 2015. Comer es una de las actividades con más peso climático.', { d: 2 }),
      numv(3, (i) => { // e2
        const [total, pct] = [[18, 71], [18, 29], [17, 70]][i];
        return {
          enunciado: [
            `Si el sistema alimentario emite ${total} mil millones de toneladas de CO₂e y el ${pct} % viene de la producción y el cambio de uso del suelo, ¿cuántos miles de millones de toneladas son? Redondeá a un decimal.`,
            `Si el sistema alimentario emite ${total} mil millones de toneladas de CO₂e y el ${pct} % viene de la cadena posterior a la producción, ¿cuántos miles de millones de toneladas son? Redondeá a un decimal.`,
            `De ${total} mil millones de toneladas de CO₂e del sistema alimentario, el ${pct} % viene del campo y los desmontes. ¿Cuántos miles de millones son? Redondeá a un decimal.`,
          ][i],
          valor: Math.round(total * pct / 10) / 10,
          unidad: 'mil millones de t CO₂e',
          dec: 1,
          tol: 0.1,
          explicacion: `${total} × ${pct} % ≈ ${(Math.round(total * pct / 10) / 10).toLocaleString('es-AR')} mil millones de toneladas. La mayor parte se juega antes de que el alimento salga del campo.`,
          ctx: `${total} mil millones de t; ${pct} %.`,
        };
      }, { d: 2 }),
      clas('¿La emisión ocurre en la producción y el uso del suelo o en la cadena posterior?', { // e3
        'Producción y uso del suelo': ['Metano de las vacas', 'Óxido nitroso de los fertilizantes', 'Desmonte para ampliar cultivos'],
        'Cadena posterior': ['Refrigeración en el supermercado', 'Fabricación de envases', 'Metano de la comida enterrada en el relleno'],
      }, 'Ambas etapas cuentan, pero la mayor parte ocurre en el campo y en los cambios de uso del suelo.', { d: 1 }),
      teoria('Tres gases', [
        'En el campo se emiten los tres gases principales. Metano, sobre todo por la digestión de los rumiantes (vacas, ovejas, cabras) y por los arrozales inundados. Óxido nitroso, por los fertilizantes nitrogenados y el estiércol. Y CO₂, por los desmontes, la degradación de suelos y el uso de combustibles en la maquinaria. En Argentina, la agricultura, la ganadería y el uso de la tierra explican cerca del 39 % de las emisiones del país.',
      ]),
      par('Uní cada gas con su principal fuente en el campo.', [ // e4
        ['Metano', 'Digestión de las vacas y arrozales inundados'],
        ['Óxido nitroso', 'Fertilizantes nitrogenados y estiércol'],
        ['CO₂', 'Desmontes y degradación de suelos'],
      ], 'Cada gas tiene fuentes distintas, y por eso soluciones distintas.', { d: 1 }),
      cad('Armá la cadena de cómo un desmonte suma emisiones al sistema alimentario.', [ // e5
        'Crece la demanda de soja o carne',
        'Se desmonta un bosque para producir más',
        'El carbono de los árboles y del suelo se libera',
        'Esas emisiones se asignan a los alimentos producidos allí',
        'La huella de esos alimentos es mucho mayor',
      ], ['El desmonte guarda más carbono en el suelo'], 'Por eso el mismo alimento puede tener huellas muy distintas según dónde y cómo se produjo.', { d: 2 }),
      vf('La mayor parte de las emisiones de la comida viene del transporte.', false, 'El transporte pesa poco en la mayoría de los alimentos. La mayor parte viene de la producción agropecuaria y del cambio de uso del suelo.', { // e6
        razones: ['+Porque la mayor parte viene de la producción y los desmontes', '-Porque los alimentos no se transportan', '-Porque el transporte no emite nada'],
        d: 1,
      }),
      mult('¿Qué etapas incluye la cuenta completa del sistema alimentario? Marcá todas.', [ // e7
        '+El cambio de uso del suelo',
        '+La producción agropecuaria',
        '+El transporte y los envases',
        '+Los residuos de comida',
        '-La fabricación de autos particulares',
      ], 'Contar todo el sistema evita mirar solo una parte y sacar conclusiones equivocadas.', { d: 1 }),
      rank('Ordená estas etapas según su aporte típico a las emisiones de un kilo de carne vacuna, de mayor a menor.', [ // e7b
        ['Producción en el campo y cambio de uso del suelo', 'la gran mayoría'],
        ['Procesamiento en el frigorífico', 'poco'],
        ['Transporte', 'muy poco'],
        ['Envase', 'mínimo'],
      ], 'En la carne vacuna, casi toda la huella se genera antes de que el animal salga del campo.', { d: 2, extremos: ['Mayor aporte', 'Menor aporte'] }),
      op('¿Dónde conviene poner el mayor esfuerzo para reducir las emisiones del sistema alimentario?', [ // e7c
        'En la producción y en frenar los desmontes',
        'En cambiar el color de los envases',
        ['Solo en el transporte internacional', 'Pesa poco en la mayoría de los alimentos.'],
        'En apagar las luces de los supermercados',
      ], 'Donde están las mayores emisiones están también las mayores oportunidades.', { d: 1 }),
      det('Leé esta nota y marcá lo equivocado.', [ // e8
        ['El sistema alimentario explica cerca de un tercio de las emisiones humanas.', false],
        ['Casi todas las emisiones de la comida ocurren en la góndola del supermercado.', true, 'La mayor parte ocurre en la producción y el cambio de uso del suelo.'],
        ['Los fertilizantes nitrogenados emiten óxido nitroso.', false],
        ['En Argentina, el campo pesa poco en las emisiones del país.', true, 'Agricultura, ganadería y uso de la tierra explican cerca del 39 %.'],
      ], 'Mirar el sistema completo muestra dónde están las mayores oportunidades.', { d: 2 }),
      comp('Completá.', 'El sistema alimentario explica cerca de un [tercio] de las emisiones humanas; el gas que viene de la digestión de las vacas es el [metano]; y el de los fertilizantes nitrogenados es el óxido [nitroso].', ['décimo', 'ozono', 'férrico'], 'Tres datos clave del peso climático de la comida.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Vacas, metano y manejo', 'Por qué el mismo kilo de carne puede tener huellas muy distintas, y cómo se reduce la intensidad de emisiones.', [
      teoria('Intensidad de emisiones', [
        'La intensidad de emisiones es cuánto se emite por cada kilo producido. En la ganadería varía muchísimo: un estudio de 2018 sobre miles de establecimientos encontró que los productores de carne vacuna con más emisiones emitían varias veces más por kilo que los de menos emisiones. Las diferencias vienen de la eficiencia del rodeo, la calidad del alimento, la salud de los animales y, sobre todo, de si hubo desmonte.',
      ]),
      teoria('Qué baja la intensidad', [
        'Una vaca que no tiene un ternero por año igual emite metano todo el año. Por eso, mejorar la reproducción (que más vacas tengan su ternero), la sanidad (menos muertes y enfermedades), la calidad de las pasturas (que los animales ganen peso más rápido) y el manejo del pastoreo reduce las emisiones por kilo producido. En Argentina hay mucho margen: en muchos rodeos, una parte importante de las vacas no llega a destetar un ternero cada año.',
      ]),
      ejemplo('Dos rodeos', 'Dos rodeos tienen 100 vacas cada uno, y cada vaca emite unos 80 kg de metano por año. En el rodeo A se destetan 60 terneros por año; en el B, 85.', [
        'Metano total de cada rodeo: 100 × 80 = 8.000 kg por año, casi igual en los dos.',
        'Metano por ternero en A: 8.000 ÷ 60 ≈ 133 kg.',
        'Metano por ternero en B: 8.000 ÷ 85 ≈ 94 kg.',
      ], 'El rodeo más eficiente produce más con casi las mismas emisiones: su intensidad es casi un 30 % menor. Valores ilustrativos.'),
      numv(3, (i) => { // e1
        const [vacas, ch4, terneros] = [[100, 80, 60], [200, 80, 150], [150, 75, 90]][i];
        return {
          enunciado: `Un rodeo tiene ${vacas} vacas que emiten ${ch4} kg de metano por año cada una, y desteta ${terneros} terneros por año. ¿Cuántos kg de metano corresponden a cada ternero? Redondeá al entero.`,
          valor: Math.round((vacas * ch4) / terneros),
          unidad: 'kg de metano',
          tol: 1,
          explicacion: `${vacas} × ${ch4} = ${(vacas * ch4).toLocaleString('es-AR')} kg; ÷ ${terneros} ≈ ${Math.round((vacas * ch4) / terneros)} kg por ternero. Más terneros con las mismas vacas bajan la intensidad.`,
          ctx: `${vacas} vacas; ${ch4} kg de metano cada una; ${terneros} terneros.`,
        };
      }, { d: 2 }),
      mult('¿Qué prácticas reducen las emisiones por kilo de carne? Marcá todas.', [ // e2
        '+Mejorar la tasa de preñez y destete',
        '+Mejorar la sanidad del rodeo',
        '+Ofrecer pasturas de mejor calidad',
        '+Manejar el pastoreo para no degradar el campo',
        '-Desmontar bosque nativo para ampliar el pastoreo',
      ], 'El desmonte puede multiplicar la huella: es la práctica que más la empeora.', { d: 2 }),
      op('¿Por qué mejorar la reproducción de un rodeo reduce la intensidad de emisiones?', [ // e3
        'Se produce más con casi las mismas vacas',
        'Porque los terneros no emiten nada nunca',
        ['Porque las vacas preñadas dejan de comer', 'Siguen comiendo; lo que cambia es cuánto se produce con ese alimento.'],
        'Porque reduce la cantidad de terneros',
      ], 'Las vacas improductivas emiten igual: producir más por vaca reparte mejor esas emisiones.', { d: 2 }),
      teoria('Pastizales, carbono y promesas', [
        'Se escucha a veces que el pastoreo bien manejado puede capturar en el suelo todo el carbono que emite el ganado. Los pastizales bien manejados pueden guardar carbono y un buen manejo es valioso por muchas razones, pero la evidencia muestra que, en general, esa captura es limitada, lenta, reversible y difícil de medir, y rara vez compensa todo el metano de los animales. Conviene desconfiar de las promesas de "carne carbono neutral" sin mediciones independientes.',
      ]),
      vf('Cualquier campo con pastoreo bien manejado compensa siempre todo el metano de sus vacas.', false, 'El buen manejo puede guardar algo de carbono, pero la captura es limitada, reversible y difícil de medir, y en general no compensa todo el metano. Hacen falta mediciones.', { // e4
        razones: ['+Porque la captura suele ser limitada y difícil de medir', '-Porque el pastoreo siempre degrada el suelo', '-Porque las vacas no emiten metano'],
        d: 3,
      }),
      teoria('Ganadería en el bosque', [
        'En los bosques del Chaco se promueve el manejo de bosques con ganadería integrada: criar ganado dentro del bosque nativo, sin desmontarlo, manteniendo los árboles y su diversidad, con cargas animales adecuadas. Bien aplicado, permite producir sin perder el bosque. Mal aplicado, puede convertirse en un desmonte encubierto, si se eliminan demasiados árboles y el sotobosque.',
      ]),
      clas('¿Es un manejo compatible con el bosque o un desmonte encubierto?', { // e5
        'Compatible': ['Mantener la estructura del bosque con carga animal moderada', 'Dejar los árboles grandes y renovales'],
        'Desmonte encubierto': ['Rolar todo el sotobosque y dejar pocos árboles aislados', 'Aumentar tanto la carga que el bosque no se regenera'],
      }, 'La diferencia está en los detalles: cuánto bosque queda y si puede regenerarse.', { d: 3 }),
      rank('Ordená estos sistemas ganaderos por su intensidad de emisiones, de menor a mayor.', [ // e6
        ['Rodeo eficiente en pastizal natural, sin desmonte', 'baja'],
        ['Rodeo con baja preñez en pastizal natural', 'media'],
        ['Rodeo en un campo degradado por sobrepastoreo', 'alta'],
        ['Rodeo en tierras recién desmontadas', 'muy alta'],
      ], 'Eficiencia y uso del suelo se combinan: el desmonte es lo que más pesa.', { d: 3, extremos: ['Menor intensidad', 'Mayor intensidad'] }),
      par('Uní cada concepto con su definición.', [ // e7
        ['Intensidad de emisiones', 'Emisiones por kilo producido'],
        ['Tasa de destete', 'Terneros destetados por cada 100 vacas'],
        ['Fermentación entérica', 'Digestión que produce metano en rumiantes'],
        ['Ganadería integrada al bosque', 'Criar ganado sin desmontar'],
      ], 'Vocabulario para entender las emisiones de la ganadería.', { d: 2 }),
      numv(3, (i) => { // e7b
        const [a, b] = [[133, 94], [120, 90], [150, 100]][i];
        return {
          enunciado: `Un rodeo baja su metano por ternero de ${a} a ${b} kg al mejorar la reproducción. ¿En qué porcentaje bajó la intensidad? Redondeá al entero.`,
          valor: Math.round(((a - b) / a) * 100),
          unidad: '%',
          tol: 1,
          explicacion: `(${a} − ${b}) ÷ ${a} × 100 ≈ ${Math.round(((a - b) / a) * 100)} %. La misma cantidad de vacas produce más terneros: menos metano por unidad producida.`,
          ctx: `De ${a} a ${b} kg de metano por ternero.`,
        };
      }, { d: 2 }),
      op('Una etiqueta dice "carne carbono neutral". ¿Qué conviene preguntar primero?', [ // e7c
        '¿Quién midió las emisiones y cómo se verificó?',
        '¿De qué color es el envase de la carne?',
        ['¿Cuánto cuesta el kilo de esa carne?', 'El precio no dice nada sobre la afirmación climática.'],
        '¿Cuántos seguidores tiene la marca?',
      ], 'Una afirmación climática sin medición independiente es una promesa, no un dato.', { d: 1 }),
      det('Leé esta publicidad de una marca de carne y marcá lo engañoso.', [ // e8
        ['Mejoramos la sanidad y la reproducción de nuestro rodeo.', false],
        ['Nuestra carne es carbono neutral porque nuestras vacas pastan.', true, 'Sin mediciones independientes, es una promesa sin evidencia.'],
        ['No compramos animales criados en campos recién desmontados.', false],
        ['Las vacas a pasto no emiten metano.', true, 'Todas las vacas emiten metano por su digestión.'],
      ], 'Lo viste con el greenwashing: una práctica buena puede usarse para una promesa exagerada.', { d: 2 }),
      comp('Completá.', 'Las emisiones por kilo producido son la [intensidad] de emisiones; los terneros destetados por cada 100 vacas son la tasa de [destete]; y la digestión que produce metano es la fermentación [entérica].', ['cantidad', 'venta', 'solar'], 'Tres conceptos para analizar la ganadería y el clima.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Granos, fertilizantes y suelo', 'Óxido nitroso, siembra directa, cultivos de servicio y arrozales: prácticas que cambian las emisiones de la agricultura.', [
      teoria('El nitrógeno', [
        'Los cultivos necesitan nitrógeno, y los fertilizantes nitrogenados aumentan mucho los rendimientos. Pero cuando se aplica más de lo que el cultivo puede aprovechar, o en el momento equivocado, una parte se pierde: se lava hacia el agua (lo viste con la eutrofización) o las bacterias del suelo lo transforman en óxido nitroso, un gas que calienta casi 300 veces más que el CO₂ por tonelada. Aplicar la dosis justa, en el momento justo y en el lugar justo reduce pérdidas y costos.',
      ]),
      cad('Armá la cadena de cómo el exceso de fertilizante calienta el planeta.', [ // e1
        'Se aplica más nitrógeno del que el cultivo aprovecha',
        'El sobrante queda en el suelo',
        'Las bacterias lo transforman',
        'Se libera óxido nitroso',
        'Aumenta el calentamiento',
      ], ['El sobrante se transforma en oxígeno'], 'El nitrógeno que el cultivo no usa es dinero perdido y un problema para el clima y el agua.', { d: 2 }),
      numv(3, (i) => { // e2
        const [kg, pct] = [[100, 1], [150, 1], [200, 1.5]][i];
        const n2o = Math.round(kg * pct / 100 * 44 / 28 * 100) / 100;
        return {
          enunciado: `Si se aplican ${kg} kg de nitrógeno por hectárea y el ${pct.toLocaleString('es-AR')} % se emite como nitrógeno en forma de óxido nitroso, ¿cuántos kg de óxido nitroso se emiten por hectárea? (Multiplicá el nitrógeno emitido por 44/28.) Redondeá a dos decimales.`,
          valor: n2o,
          unidad: 'kg de N₂O',
          dec: 2,
          tol: 0.01,
          explicacion: `${kg} × ${pct.toLocaleString('es-AR')} % = ${(kg * pct / 100).toLocaleString('es-AR')} kg de N; × 44/28 ≈ ${n2o.toLocaleString('es-AR')} kg de N₂O, que equivalen a unos ${Math.round(n2o * 273)} kg de CO₂e por hectárea.`,
          ctx: `${kg} kg de N por hectárea; ${pct} % emitido como N₂O.`,
        };
      }, { d: 4 }),
      teoria('Siembra directa y cultivos de servicio', [
        'En Argentina, la siembra directa —sembrar sin arar, dejando los rastrojos sobre el suelo— se usa en la gran mayoría de la superficie agrícola. Reduce mucho la erosión, conserva la humedad y ahorra combustible. Los cultivos de servicio, que se siembran entre dos cosechas no para venderlos sino para cubrir y alimentar el suelo, suman materia orgánica, reducen malezas y, si son leguminosas, aportan nitrógeno. Lo viste con el suelo vivo: más cobertura, más vida y más carbono.',
      ]),
      par('Uní cada práctica con su beneficio principal.', [ // e3
        ['Siembra directa', 'Menos erosión y menos combustible'],
        ['Cultivos de servicio', 'Suelo cubierto y más materia orgánica'],
        ['Leguminosas en la rotación', 'Aportan nitrógeno sin fertilizante'],
        ['Fertilización ajustada', 'Menos óxido nitroso y menos costo'],
      ], 'Muchas prácticas buenas para el clima también lo son para el suelo y el bolsillo.', { d: 2 }),
      op('¿Por qué conviene incluir leguminosas, como la vicia o la soja, en la rotación?', [ // e4
        'Fijan nitrógeno del aire con ayuda de bacterias',
        'Porque no necesitan agua para crecer',
        ['Porque eliminan todas las plagas del campo', 'Pueden ayudar con malezas, pero su aporte clave es el nitrógeno.'],
        'Porque absorben el óxido nitroso del aire',
      ], 'Las leguminosas, en asociación con bacterias de sus raíces, aportan nitrógeno al sistema y reducen la necesidad de fertilizante.', { d: 2 }),
      teoria('Arrozales', [
        'El arroz se cultiva en campos inundados, y el agua quieta sin oxígeno favorece a microorganismos que producen metano. En Argentina hay arroz en Corrientes, Entre Ríos y otras provincias del Litoral. Una técnica que reduce mucho ese metano es el riego intermitente: dejar que el campo se seque por momentos durante el ciclo, sin afectar el rendimiento si se maneja bien. También ahorra agua.',
      ]),
      cad('Armá la cadena de cómo el riego intermitente reduce el metano del arroz.', [ // e5
        'El campo inundado se deja secar por momentos',
        'Entra oxígeno al suelo',
        'Se frena la actividad de los microorganismos que producen metano',
        'Se emite menos metano',
        'Además se ahorra agua de riego',
      ], ['El suelo seco produce más metano'], 'Un cambio de manejo que beneficia al clima y al agua.', { d: 2 }),
      vf('La siembra directa, por sí sola, resuelve todos los problemas ambientales de la agricultura.', false, 'Reduce la erosión y ahorra combustible, pero sin rotaciones y cobertura puede depender mucho de herbicidas. Funciona mejor como parte de un sistema con rotaciones y cultivos de servicio.', { // e6
        razones: ['+Porque funciona mejor combinada con rotaciones y cobertura', '-Porque la siembra directa aumenta la erosión', '-Porque ninguna práctica ayuda al suelo'],
        d: 3,
      }),
      clas('¿Esta práctica reduce emisiones o las aumenta?', { // e7
        'Reduce': ['Fertilizar según un análisis de suelo', 'Riego intermitente en el arroz', 'Cultivos de servicio en el invierno'],
        'Aumenta': ['Aplicar fertilizante de más por las dudas', 'Quemar rastrojos', 'Dejar el suelo desnudo que se erosiona'],
      }, 'Cada decisión de manejo tiene un efecto climático.', { d: 1 }),
      numv(3, (i) => { // e8
        const [ha, ahorro] = [[1000, 15], [500, 20], [2000, 10]][i];
        return {
          enunciado: `Un productor tiene ${ha.toLocaleString('es-AR')} hectáreas. Si con análisis de suelo reduce ${ahorro} kg de nitrógeno por hectárea sin perder rendimiento, ¿cuántas toneladas de nitrógeno deja de aplicar?`,
          valor: ha * ahorro / 1000,
          unidad: 'toneladas',
          explicacion: `${ha.toLocaleString('es-AR')} × ${ahorro} = ${(ha * ahorro).toLocaleString('es-AR')} kg = ${(ha * ahorro / 1000).toLocaleString('es-AR')} toneladas de nitrógeno menos: menos costo, menos óxido nitroso y menos contaminación del agua.`,
          ctx: `${ha} ha; ${ahorro} kg de N menos por hectárea.`,
        };
      }, { d: 1 }),
      mult('¿Qué beneficios pueden tener los cultivos de servicio? Marcá todos.', [ // e8b
        '+Protegen el suelo de la erosión',
        '+Suman materia orgánica',
        '+Ayudan a controlar malezas',
        '+Si son leguminosas, aportan nitrógeno',
        '-Se cosechan y se venden como el cultivo principal',
      ], 'No se siembran para vender, sino para cuidar el suelo y el sistema.', { d: 1 }),
      det('Leé este plan de un campo y marcá lo que conviene corregir.', [ // e9
        ['Haremos análisis de suelo antes de fertilizar.', false],
        ['Aplicaremos el doble de fertilizante por las dudas.', true, 'El exceso se pierde como óxido nitroso y contamina el agua.'],
        ['Sembraremos cultivos de servicio en el invierno.', false],
        ['Quemaremos el rastrojo para sembrar más rápido.', true, 'La quema emite gases, contamina el aire y deja el suelo desnudo.'],
      ], 'Las buenas prácticas agrícolas suelen ser, además, buenas decisiones económicas.', { d: 2 }),
      comp('Completá.', 'Sembrar sin arar, dejando rastrojos, es la siembra [directa]; los cultivos que se siembran para cubrir el suelo son cultivos de [servicio]; y secar por momentos el arrozal es el riego [intermitente].', ['profunda', 'venta', 'permanente'], 'Tres prácticas clave de una agricultura con menos emisiones.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Comida sin desmonte', 'Soja, carne y bosques: las cadenas libres de deforestación, la trazabilidad y las nuevas reglas de los mercados.', [
      teoria('Los productos detrás del desmonte', [
        'A nivel mundial, la expansión de la agricultura y la ganadería es la principal causa de pérdida de bosques tropicales y subtropicales. En Sudamérica, la soja y la carne están entre los productos más asociados a los desmontes, junto con otros como el aceite de palma en Asia. Lo viste con el Gran Chaco: allí se perdieron millones de hectáreas de bosque en pocas décadas.',
      ]),
      teoria('Las reglas cambian', [
        'Cada vez más compradores exigen que los productos no provengan de tierras desmontadas. La Unión Europea aprobó un reglamento que exige que ciertos productos que se venden en su mercado, como la soja, la carne vacuna, la madera, el café, el cacao, el caucho y el aceite de palma, no provengan de tierras desmontadas después del 31 de diciembre de 2020, y que se pueda demostrar dónde se produjeron, con la ubicación del campo. Para un país exportador como Argentina, eso vuelve central la trazabilidad.',
      ]),
      mult('¿Qué productos alcanza el reglamento europeo sobre productos libres de deforestación? Marcá todos.', [ // e1
        '+Soja',
        '+Carne vacuna',
        '+Café',
        '+Madera',
        '-Litio',
      ], 'El reglamento se enfoca en productos asociados a la deforestación; el litio no está en la lista.', { d: 2 }),
      teoria('Trazabilidad', [
        'La trazabilidad es poder seguir un producto desde el campo donde se produjo hasta el consumidor. Con coordenadas de los campos, imágenes satelitales y registros, se puede verificar si un lote de soja o un animal viene de un lugar desmontado después de una fecha. En la ganadería es más difícil, porque un animal puede pasar por varios campos a lo largo de su vida: hay que seguir todo el recorrido, no solo el último campo.',
      ]),
      cad('Armá la cadena de la trazabilidad de un cargamento de soja.', [ // e2
        'Se registran las coordenadas del campo donde se produjo',
        'Se compara con imágenes satelitales de antes y después de 2020',
        'Se verifica que no hubo desmonte',
        'El cargamento viaja con esa información',
        'El comprador puede comprobar el origen',
      ], ['El comprador confía sin ningún dato'], 'La tecnología satelital hizo posible verificar el origen a gran escala.', { d: 2 }),
      op('¿Por qué la trazabilidad de la carne es más difícil que la de la soja?', [ // e3
        'Un animal puede pasar por varios campos',
        'Porque las vacas no tienen dueño',
        ['Porque la carne no se exporta', 'Argentina exporta carne a muchos mercados.'],
        'Porque la soja no crece en campos',
      ], 'Hay que conocer todos los campos por los que pasó el animal, no solo el último.', { d: 2 }),
      numv(3, (i) => { // e4
        const [lotes, riesgo] = [[500, 4], [1200, 3], [300, 6]][i];
        return {
          enunciado: `Una empresa revisa ${lotes} campos proveedores con imágenes satelitales y encuentra desmontes posteriores a 2020 en el ${riesgo} %. ¿Cuántos campos deberían quedar fuera de la cadena libre de deforestación?`,
          valor: lotes * riesgo / 100,
          unidad: 'campos',
          explicacion: `${lotes} × ${riesgo} % = ${lotes * riesgo / 100} campos. Identificarlos permite separar su producción y trabajar con los demás. Datos de ejemplo.`,
          ctx: `${lotes} campos; ${riesgo} % con desmontes.`,
        };
      }, { d: 1 }),
      vf('Las reglas de los compradores internacionales pueden influir en los desmontes en los países productores.', true, 'Cuando los mercados exigen productos libres de deforestación y hay trazabilidad, desmontar se vuelve menos rentable. No reemplaza a las leyes locales, pero las complementa.', { // e5
        razones: ['+Porque cambian lo que es rentable producir y vender', '-Porque los mercados no tienen ninguna influencia', '-Porque los desmontes no tienen relación con el comercio'],
        d: 2,
      }),
      clas('¿Esta herramienta ayuda a frenar el desmonte desde el mercado o desde la ley?', { // e6
        'Desde el mercado': ['Reglamento europeo de productos libres de deforestación', 'Compromisos de empresas compradoras de no desmonte'],
        'Desde la ley nacional': ['Ley de Bosques y ordenamiento territorial', 'Controles y sanciones provinciales por desmontes ilegales'],
      }, 'Mercado y ley se complementan: ninguno alcanza solo.', { d: 2 }),
      teoria('El riesgo de la fuga', [
        'Si solo algunos compradores exigen productos libres de desmonte, puede pasar que la producción de tierras desmontadas se venda a otros mercados menos exigentes: el desmonte "se fuga" a otra cadena. Por eso son importantes las leyes nacionales, como la Ley de Bosques, que protegen el bosque sin importar a dónde se venda lo producido.',
      ]),
      cad('Armá la cadena de la fuga del desmonte.', [ // e7
        'Un mercado exige soja libre de desmonte',
        'Los productores que desmontaron venden a otros compradores',
        'El desmonte sigue ocurriendo',
        'Solo cambió a qué mercado va la producción',
        'Hace falta una protección que no dependa del comprador',
      ], ['El desmonte desaparece en todo el mundo'], 'Las leyes locales cierran la puerta que los mercados solos dejan abierta.', { d: 3 }),
      par('Uní cada concepto con su definición.', [ // e8
        ['Trazabilidad', 'Seguir un producto desde el campo hasta el consumidor'],
        ['Fecha de corte', 'Momento a partir del cual un desmonte excluye al producto'],
        ['Fuga', 'Desmonte que se desplaza a otra cadena o mercado'],
        ['Cadena libre de deforestación', 'Productos que no vienen de tierras desmontadas'],
      ], 'Conceptos para entender la relación entre comercio y bosques.', { d: 2 }),
      op('Un campo desmontó bosque en 2022 y quiere vender su soja al mercado europeo. ¿Qué pasa según el reglamento?', [ // e8b
        'Esa soja no puede venderse en ese mercado',
        'Puede venderla si paga una multa pequeña',
        ['Puede venderla porque el desmonte fue legal en su provincia', 'El reglamento exige no desmonte después de 2020, más allá de la legalidad local.'],
        'Puede venderla si la mezcla con soja de otros campos',
      ], 'La fecha de corte es fines de 2020: lo producido en tierras desmontadas después queda afuera.', { d: 3 }),
      det('Leé este comunicado de una exportadora y marcá lo que conviene corregir.', [ // e9
        ['Registramos las coordenadas de todos nuestros campos proveedores.', false],
        ['Verificamos solo el último campo por donde pasaron los animales.', true, 'Hay que seguir todo el recorrido del animal.'],
        ['Comparamos imágenes satelitales antes y después de 2020.', false],
        ['Los campos con desmontes recientes venden a otro mercado y ya no es nuestro problema.', true, 'Así el desmonte se fuga, pero sigue ocurriendo.'],
      ], 'Una cadena libre de desmonte de verdad mira todo el recorrido y no solo su propia góndola.', { d: 3 }),
      comp('Completá.', 'Poder seguir un producto desde el campo hasta el consumidor es la [trazabilidad]; el reglamento europeo usa como fecha de corte fines de [2020]; y cuando el desmonte se desplaza a otro mercado se habla de [fuga].', ['publicidad', '2010', 'cosecha'], 'Tres claves de las cadenas libres de deforestación.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Producir en un clima que cambia', 'Sequías, olas de calor y lluvias extremas: cómo se adapta la producción de alimentos.', [
      teoria('La sequía de 2022–2023', [
        'Entre 2022 y 2023, la región pampeana sufrió una de las sequías más graves de las últimas décadas. La cosecha de soja cayó a alrededor de la mitad de lo habitual, y las pérdidas económicas fueron enormes para el país. Un estudio de atribución concluyó que la falta de lluvia se explicaba sobre todo por La Niña, aunque el calor extra probablemente empeoró sus efectos. Con el calentamiento, episodios de calor y sequía intensos pueden volverse más frecuentes.',
      ]),
      cad('Armá la cadena de cómo una sequía afecta a toda la economía.', [ // e1
        'Llueve mucho menos de lo normal durante meses',
        'Los cultivos no tienen agua suficiente',
        'Caen los rendimientos y la cosecha',
        'Se exporta menos y entran menos dólares',
        'Se resienten los pueblos y la economía del país',
      ], ['La sequía aumenta las cosechas de soja'], 'En un país agroexportador, el clima del campo es también un tema económico nacional.', { d: 1 }),
      teoria('Adaptarse', [
        'La adaptación agropecuaria combina muchas herramientas: variedades más tolerantes a la sequía o al calor, fechas de siembra ajustadas, suelos con más materia orgánica que guardan más agua, rotaciones diversas, reservas de forraje para el ganado, riego eficiente donde hay agua, pronósticos estacionales y seguros agrícolas que protegen a los productores de las pérdidas extremas.',
      ]),
      mult('¿Qué estrategias ayudan a un campo a enfrentar sequías más frecuentes? Marcá todas.', [ // e2
        '+Suelos con más materia orgánica',
        '+Variedades tolerantes a la sequía',
        '+Reservas de forraje para el ganado',
        '+Seguros agrícolas',
        '-Dejar el suelo desnudo entre cultivos',
      ], 'Un suelo cubierto y con materia orgánica es la primera defensa contra la sequía.', { d: 1 }),
      numv(3, (i) => { // e3
        const [mo, agua] = [[1, 20], [2, 20], [1.5, 20]][i];
        return {
          enunciado: `Supongamos que cada punto porcentual más de materia orgánica en el suelo permite guardar unos ${agua} mm más de agua útil. ¿Cuántos mm más guarda un suelo que sube ${mo.toLocaleString('es-AR')} puntos su materia orgánica?`,
          valor: mo * agua,
          unidad: 'mm',
          explicacion: `${mo.toLocaleString('es-AR')} × ${agua} = ${mo * agua} mm más de agua disponible para los cultivos. Valores ilustrativos: el efecto real depende del tipo de suelo, pero la dirección es clara.`,
          ctx: `${mo} puntos más de materia orgánica; ${agua} mm por punto.`,
        };
      }, { d: 1 }),
      par('Uní cada riesgo climático con una estrategia de adaptación.', [ // e4
        ['Sequía prolongada', 'Suelo con cobertura y reservas de forraje'],
        ['Ola de calor en la floración', 'Ajustar la fecha de siembra'],
        ['Lluvias muy intensas', 'Cultivos de servicio que protegen del arrastre'],
        ['Pérdida total de una cosecha', 'Seguro agrícola'],
      ], 'Cada riesgo tiene respuestas específicas, y muchas se refuerzan entre sí.', { d: 2 }),
      teoria('Diversificar', [
        'Un campo con un solo cultivo o una sola actividad está más expuesto: si ese cultivo falla, se pierde todo el año. Rotaciones diversas, combinar agricultura y ganadería, o sumar otras producciones reparten el riesgo. Lo viste con la agroecología: la diversidad también es una forma de resiliencia.',
      ]),
      op('¿Por qué diversificar las producciones de un campo ayuda a adaptarse?', [ // e5
        'Si una actividad falla, las otras sostienen el ingreso',
        'Porque así se usa más fertilizante',
        ['Porque un solo cultivo nunca falla', 'Justamente el monocultivo concentra el riesgo.'],
        'Porque diversificar elimina la necesidad de agua',
      ], 'No poner todos los huevos en la misma canasta, aplicado al campo.', { d: 1 }),
      vf('Como la sequía de 2022–2023 se explicó sobre todo por La Niña, el cambio climático no importa para el agro.', false, 'El calor extra empeoró sus efectos, y el calentamiento aumenta la frecuencia de extremos de calor. Adaptarse es necesario aunque cada evento tenga varias causas.', { // e6
        razones: ['+Porque el calor extra agrava y el calentamiento aumenta los extremos', '-Porque La Niña es causada por las vacas', '-Porque el agro no depende del clima'],
        d: 3,
      }),
      clas('¿Es una medida de adaptación de corto plazo o una transformación de largo plazo?', { // e7
        'Corto plazo': ['Ajustar la fecha de siembra según el pronóstico', 'Comprar forraje antes del verano seco'],
        'Largo plazo': ['Aumentar la materia orgánica del suelo', 'Cambiar a rotaciones más diversas', 'Desarrollar variedades tolerantes al calor'],
      }, 'La adaptación combina decisiones de cada campaña con cambios estructurales.', { d: 2 }),
      rank('Ordená estas medidas según cuánto tardan en dar resultados, de la más rápida a la más lenta.', [ // e8
        ['Contratar un seguro agrícola', 'inmediato'],
        ['Ajustar la fecha de siembra', 'una campaña'],
        ['Sumar cultivos de servicio', 'varias campañas'],
        ['Recuperar la materia orgánica del suelo', 'muchos años'],
      ], 'Las medidas rápidas protegen hoy; las lentas construyen resiliencia para mañana.', { d: 2, extremos: ['Más rápida', 'Más lenta'] }),
      est('Estimá qué fracción de una cosecha de soja habitual se obtuvo en la sequía de 2022–2023.', 50, { min: 0, max: 100, paso: 5, unidad: '%' }, 'Alrededor de la mitad de lo habitual: una de las peores cosechas en décadas.', { d: 2 }),
      det('Leé este plan de un productor y marcá lo que conviene corregir.', [ // e9
        ['Sumaremos cultivos de servicio para mejorar el suelo.', false],
        ['No haremos seguro porque las sequías fuertes no se repiten.', true, 'Con el calentamiento, los extremos pueden volverse más frecuentes.'],
        ['Guardaremos reservas de forraje para el ganado.', false],
        ['Sembraremos un solo cultivo para simplificar.', true, 'Concentra el riesgo; la diversidad reparte las pérdidas.'],
      ], 'Adaptarse es gestionar el riesgo con varias herramientas a la vez.', { d: 2 }),
      comp('Completá.', 'La sequía de 2022–2023 se explicó sobre todo por La [Niña]; un suelo con más materia [orgánica] guarda más agua; y combinar actividades en un campo es [diversificar].', ['Luna', 'mineral', 'concentrar'], 'Tres claves de la adaptación del agro al clima.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: el campo y el clima', 'Emisiones del sistema alimentario, ganadería, nitrógeno, suelo, cadenas sin desmonte y adaptación, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: la estancia del Chaco seco', 'Una estancia ganadera del Chaco seco quiere reducir sus emisiones, conservar su bosque y prepararse para sequías más frecuentes. Armá su plan.', [
      teoria('La situación', [
        'La estancia tiene 5.000 hectáreas, la mitad con bosque nativo en categoría amarilla de la Ley de Bosques. Tiene 1.000 vacas y desteta 600 terneros por año. Cada vaca emite unos 80 kg de metano por año. En la última sequía perdió animales por falta de forraje. Un comprador europeo le pide demostrar que su carne no viene de tierras desmontadas después de 2020.',
      ]),
      num('¿Cuántos kg de metano corresponden hoy a cada ternero destetado? Redondeá al entero.', 133, 'kg de metano', '1.000 × 80 = 80.000 kg; ÷ 600 ≈ 133 kg por ternero.', { ctx: '1.000 vacas; 80 kg de metano cada una; 600 terneros.', d: 2 }),
      num('Si mejora la sanidad y la reproducción y llega a 800 terneros por año con las mismas vacas, ¿cuántos kg de metano por ternero serían?', 100, 'kg de metano', '80.000 ÷ 800 = 100 kg por ternero: una reducción del 25 % en la intensidad.', { ctx: '80.000 kg de metano; 800 terneros.', d: 2 }),
      clas('Clasificá las propuestas.', { // e3
        'Conviene': ['Manejo del bosque con ganadería integrada, sin desmontar', 'Reservas de forraje para las sequías', 'Registrar coordenadas y movimientos de los animales'],
        'No conviene': ['Desmontar el bosque amarillo para hacer pasturas', 'Comprar terneros de campos sin trazabilidad'],
      }, 'Producir más sin desmontar, prepararse para la sequía y poder demostrar el origen.', { d: 2 }),
      op('¿Por qué no conviene desmontar el bosque de categoría amarilla para ampliar pasturas?', [ // e4
        'La ley no lo permite y quedaría fuera del mercado',
        'Porque el bosque no sirve para nada',
        ['Porque así tendría menos vacas', 'El problema no es la cantidad de vacas: es la ley y el mercado.'],
        'Porque las pasturas no crecen en el Chaco',
      ], 'En zona amarilla se permite el uso sostenible, no el desmonte; y el comprador exige no desmonte.', { d: 2 }),
      mult('¿Qué debería registrar la estancia para demostrar el origen de su carne? Marcá todo.', [ // e5
        '+Coordenadas de sus campos',
        '+Movimientos de los animales entre campos',
        '+Origen de los terneros que compra',
        '+Imágenes que muestren que no hubo desmonte después de 2020',
        '-Solo el nombre del último campo',
      ], 'La trazabilidad completa es la condición para acceder a mercados exigentes.', { d: 2 }),
      vf('Mejorar la reproducción del rodeo reduce el metano total aunque no cambie la cantidad de vacas.', false, 'El metano total casi no cambia con las mismas vacas: lo que baja es la intensidad, el metano por ternero producido.', { // e6
        razones: ['+Porque baja la intensidad, no el total', '-Porque los terneros absorben metano', '-Porque las vacas preñadas no emiten'],
        d: 3,
      }),
      det('La estancia redacta su plan. Marcá lo que conviene corregir.', [ // e7
        ['Aplicaremos manejo de bosque con ganadería integrada.', false],
        ['Desmontaremos 500 hectáreas de bosque amarillo para pasturas.', true, 'No está permitido en zona amarilla y la dejaría fuera del mercado europeo.'],
        ['Guardaremos reservas de forraje para la próxima sequía.', false],
        ['Diremos que la carne es carbono neutral sin medir nada.', true, 'Una promesa sin mediciones es greenwashing.'],
      ], 'Un buen plan produce más, conserva el bosque, se prepara para el clima y comunica con honestidad.', { d: 3 }),
    ]),
  ],
});
