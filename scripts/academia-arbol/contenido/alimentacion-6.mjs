import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// ALIMENTACIÓN 6 — Seguridad alimentaria.
// Qué significa que todas las personas puedan comer bien, el hambre en el
// mundo, la doble carga de hambre y obesidad, el acceso a los alimentos en
// Argentina y los sistemas alimentarios resilientes. Cierra la rama: retoma
// qué necesita el cuerpo (alimentacion-1), la comida que se tira
// (alimentacion-3), el campo y el clima (alimentacion-5) y los costos
// ocultos de la comida (consumo-4).

export default unidad({
  slug: 'alimentacion-6',
  rama: 'alimentacion',
  orden: 6,
  nivel: 3,
  requiereTronco: 3,
  titulo: 'Seguridad alimentaria',
  bajada: 'Hambre, obesidad, precios y comedores: qué significa que todas las personas puedan comer bien, siempre, y qué hace falta para que un sistema alimentario resista las crisis.',
  objetivos: [
    'Explicar las cuatro dimensiones de la seguridad alimentaria',
    'Interpretar los datos mundiales de hambre e inseguridad alimentaria',
    'Analizar la doble carga de malnutrición y el papel de los entornos alimentarios',
    'Relacionar ingresos, canastas y acceso a los alimentos en Argentina',
    'Proponer medidas para sistemas alimentarios resilientes y justos',
  ],
  repasa: ['alimentacion-1', 'alimentacion-3', 'alimentacion-5', 'consumo-4'],
  fuentes: ['fao-sofi', 'fao-hambre-2025', 'indec-pobreza-2025', 'ennys2', 'ley-27642-etiquetado', 'guias-alimentarias-ar', 'red-bancos-alimentos', 'via-campesina', 'fao-sofa-2023'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Qué es la seguridad alimentaria', 'Disponibilidad, acceso, utilización y estabilidad: no alcanza con que haya comida en el país.', [
      teoria('Cuatro dimensiones', [
        'Según la FAO, hay seguridad alimentaria cuando todas las personas tienen, en todo momento, acceso físico y económico a alimentos suficientes, inocuos y nutritivos para llevar una vida activa y sana. Eso tiene cuatro dimensiones. Disponibilidad: que haya alimentos. Acceso: que las personas puedan conseguirlos, con ingresos o de otras formas. Utilización: que el cuerpo pueda aprovecharlos, con agua segura, higiene, salud y conocimientos. Y estabilidad: que todo eso se sostenga en el tiempo, también en crisis.',
      ], { lista: ['Disponibilidad', 'Acceso', 'Utilización', 'Estabilidad'] }),
      clas('¿Qué dimensión de la seguridad alimentaria falla en cada caso?', { // e1
        'Disponibilidad': ['Una sequía destruye la cosecha de una región aislada', 'No llegan alimentos a un pueblo por un corte de rutas'],
        'Acceso': ['Hay comida en el almacén, pero la familia no puede pagarla', 'La verdulería más cercana queda a 20 km'],
        'Utilización': ['Un chico con diarrea por agua contaminada no aprovecha lo que come', 'Una familia no sabe cómo preparar alimentos variados'],
        'Estabilidad': ['Los precios de los alimentos suben de golpe cada pocos meses'],
      }, 'Muchas veces el problema no es que falte comida en el país, sino el acceso.', { d: 3 }),
      op('Argentina produce alimentos para muchas más personas que las que viven en el país. ¿Por qué igual hay personas con hambre?', [ // e2
        'Porque no todas pueden acceder a esos alimentos',
        'Porque los alimentos producidos no son comestibles',
        ['Porque el país no produce ningún alimento', 'Es un gran productor y exportador de alimentos.'],
        'Porque el hambre no existe en países productores',
      ], 'Producir no alcanza: la seguridad alimentaria depende sobre todo del acceso.', { d: 2 }),
      teoria('Hambre e inseguridad alimentaria', [
        'El hambre, o subalimentación, es no consumir de forma habitual la energía necesaria para una vida activa. La inseguridad alimentaria es más amplia: incluye a quienes tienen que reducir la calidad o la cantidad de lo que comen por falta de dinero u otros recursos, aunque no pasen hambre todos los días. Se mide con encuestas que preguntan, por ejemplo, si en el último año alguien del hogar tuvo que saltearse comidas o comer menos de lo necesario.',
      ]),
      ord('Ordená estas situaciones de menor a mayor gravedad de la inseguridad alimentaria.', [ // e3
        'Preocupación por poder comprar comida a fin de mes',
        'Comer menos variado por falta de dinero',
        'Saltearse comidas algunos días',
        'Pasar un día entero sin comer',
      ], 'La inseguridad alimentaria es una escala: empieza con la preocupación y puede llegar al hambre.', { d: 2, extremos: ['Menos grave', 'Más grave'] }),
      par('Uní cada dimensión con una política que la fortalece.', [ // e4
        ['Disponibilidad', 'Apoyar la producción local de alimentos'],
        ['Acceso', 'Transferencias de ingresos y comedores'],
        ['Utilización', 'Agua segura y educación alimentaria'],
        ['Estabilidad', 'Reservas y protección frente a crisis de precios'],
      ], 'Una estrategia completa atiende las cuatro dimensiones.', { d: 2 }),
      vf('Si un país produce más alimentos de los que consume, toda su población tiene seguridad alimentaria.', false, 'Sin acceso económico o físico, sin agua segura o sin estabilidad, puede haber inseguridad alimentaria aunque sobre producción.', { // e5
        razones: ['+Porque importan también el acceso, la utilización y la estabilidad', '-Porque los países productores no exportan', '-Porque la producción siempre se reparte igual'],
        d: 1,
      }),
      numv(3, (i) => { // e6
        const [hog, pct] = [[400, 12], [1000, 8], [250, 20]][i];
        return {
          enunciado: `En una encuesta a ${hog} hogares, el ${pct} % respondió que algún integrante tuvo que saltearse comidas por falta de dinero en el último año. ¿Cuántos hogares son?`,
          valor: hog * pct / 100,
          unidad: 'hogares',
          explicacion: `${hog} × ${pct} % = ${hog * pct / 100} hogares. Datos como estos permiten medir la inseguridad alimentaria y ver si las políticas funcionan. Datos de ejemplo.`,
          ctx: `${hog} hogares encuestados; ${pct} %.`,
        };
      }, { d: 1 }),
      cad('Armá la cadena de cómo el agua contaminada afecta la seguridad alimentaria.', [ // e7
        'Un barrio no tiene agua segura',
        'Los chicos tienen diarreas frecuentes',
        'Su cuerpo no aprovecha bien lo que comen',
        'Aunque coman, se desnutren',
        'Falla la dimensión de utilización',
      ], ['El agua contaminada mejora la digestión'], 'Comer no alcanza si el cuerpo no puede aprovechar lo que come.', { d: 2 }),
      mult('¿Qué hace falta para que haya seguridad alimentaria? Marcá todo.', [ // e8
        '+Que haya alimentos disponibles',
        '+Que las personas puedan pagarlos o acceder a ellos',
        '+Agua segura y salud para aprovecharlos',
        '+Que la situación sea estable en el tiempo',
        '-Que todos coman exactamente lo mismo',
      ], 'Las cuatro dimensiones son necesarias; ninguna alcanza sola.', { d: 1 }),
      mult('Una familia gasta el 60 % de su ingreso en comida y cualquier suba de precios la deja sin poder comprar lo necesario. El almacén del barrio está bien surtido. ¿Qué dimensiones están en riesgo? Marcá todas.', [ // e8b
        '+Acceso',
        '+Estabilidad',
        '-Disponibilidad',
        '-Utilización',
      ], 'Hay comida en el almacén (disponibilidad), pero el ingreso no alcanza de forma estable: fallan el acceso y la estabilidad.', { d: 3 }),
      det('Leé esta nota y marcá lo equivocado.', [ // e9
        ['La seguridad alimentaria tiene cuatro dimensiones.', false],
        ['Solo hay inseguridad alimentaria si alguien pasa días enteros sin comer.', true, 'También incluye comer menos o peor por falta de recursos.'],
        ['El acceso depende de los ingresos y de la cercanía de los comercios.', false],
        ['Un país exportador de alimentos no puede tener hambre.', true, 'Puede haber hambre por problemas de acceso aunque sobre producción.'],
      ], 'Entender las dimensiones evita respuestas simplistas.', { d: 2 }),
      comp('Completá.', 'Que haya alimentos es la [disponibilidad]; que las personas puedan conseguirlos es el [acceso]; y que la situación se sostenga en el tiempo es la [estabilidad].', ['cantidad', 'precio', 'velocidad'], 'Tres de las cuatro dimensiones de la seguridad alimentaria.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('El hambre en el mundo', 'Cuántas personas pasan hambre, cuántas no pueden pagar una dieta saludable y por qué.', [
      teoria('Los números', [
        'Según el informe sobre el estado de la seguridad alimentaria y la nutrición en el mundo de 2025, elaborado por la FAO y otras agencias de la ONU, en 2024 unas 673 millones de personas pasaron hambre, alrededor del 8 % de la población mundial. Cerca de 2.300 millones, el 28 %, sufrieron inseguridad alimentaria moderada o grave. Y unas 2.600 millones no podían pagar una dieta saludable. El hambre bajó a nivel mundial y en América Latina, pero siguió creciendo en África y en Asia occidental.',
      ], {
        datos: barras('Personas afectadas en el mundo en 2024 (aproximado)', 'millones', [
          ['No pueden pagar una dieta saludable', 2600],
          ['Inseguridad alimentaria moderada o grave', 2300],
          ['Hambre', 673],
        ], 'FAO, FIDA, OMS, PMA y UNICEF, informe SOFI 2025.'),
      }),
      rank('Ordená estos indicadores de 2024 según cuántas personas afectan, de más a menos.', [ // e1
        ['No pueden pagar una dieta saludable', '≈ 2.600 millones'],
        ['Inseguridad alimentaria moderada o grave', '≈ 2.300 millones'],
        ['Hambre', '≈ 673 millones'],
      ], 'Mucha más gente come mal por falta de dinero que la que pasa hambre.', { d: 1 }),
      est('Estimá cuántos millones de personas pasaron hambre en el mundo en 2024, según el informe de la ONU.', 673, { min: 10, max: 5000, unidad: 'millones', escala: 'log' }, 'Unos 673 millones, alrededor del 8 % de la población mundial.', { d: 2 }),
      teoria('Por qué hay hambre', [
        'Los informes de la ONU señalan varios motores del hambre: los conflictos armados, que destruyen cosechas, mercados y rutas; los eventos climáticos extremos, como sequías e inundaciones; las crisis económicas, que hacen subir los precios y bajar los ingresos; y la desigualdad, que hace que incluso cuando hay comida, muchas personas no puedan acceder a ella. A menudo se combinan.',
      ]),
      clas('¿Qué motor del hambre aparece en cada caso?', { // e2
        'Conflicto': ['Una guerra corta las rutas de abastecimiento', 'Se destruyen mercados y cultivos'],
        'Clima extremo': ['Una sequía arruina la cosecha', 'Una inundación destruye depósitos de alimentos'],
        'Crisis económica': ['La inflación hace que el sueldo no alcance', 'Sube de golpe el precio de los alimentos'],
      }, 'Los motores del hambre suelen combinarse y reforzarse entre sí.', { d: 2 }),
      numv(3, (i) => { // e3
        const [pob, pct] = [[8.1, 8.3], [8.1, 28], [8.2, 32]][i];
        return {
          enunciado: `Si la población mundial es de ${pob.toLocaleString('es-AR')} mil millones de personas y el ${pct.toLocaleString('es-AR')} % está en una situación dada, ¿cuántos millones de personas son? Redondeá a las decenas de millones.`,
          valor: Math.round(pob * pct * 10 / 10) * 10,
          unidad: 'millones',
          tol: 10,
          explicacion: `${pob.toLocaleString('es-AR')} mil millones × ${pct.toLocaleString('es-AR')} % ≈ ${(Math.round(pob * pct * 10 / 10) * 10).toLocaleString('es-AR')} millones de personas. Un porcentaje "chico" del mundo son cientos de millones de personas.`,
          ctx: `${pob} mil millones de personas; ${pct} %.`,
        };
      }, { d: 2 }),
      teoria('Una dieta saludable cuesta', [
        'Una dieta saludable —con frutas, verduras, legumbres, lácteos y proteínas variadas— cuesta más que una dieta que solo cubre las calorías con harinas, azúcares y aceites. Por eso, cuando los ingresos no alcanzan, muchas familias mantienen las calorías pero pierden calidad: comen más ultraprocesados y menos alimentos frescos. Lo viste con los costos ocultos: esa mala alimentación genera enormes costos de salud.',
      ]),
      cad('Armá la cadena de cómo la falta de ingresos empeora la dieta.', [ // e4
        'Suben los precios y no alcanza el ingreso',
        'La familia prioriza llenar la panza',
        'Compra más harinas, azúcares y ultraprocesados baratos',
        'Come menos frutas, verduras y legumbres',
        'Aumentan los problemas de salud por mala nutrición',
      ], ['La familia compra más verduras porque son más caras'], 'Cuando el dinero no alcanza, lo primero que se pierde es la calidad.', { d: 2 }),
      vf('Como el hambre bajó a nivel mundial en 2024, bajó en todas las regiones.', false, 'Bajó en el total y en América Latina, pero siguió creciendo en África y en Asia occidental. Los promedios mundiales esconden diferencias.', { // e5
        razones: ['+Porque creció en algunas regiones, como África', '-Porque el hambre no se mide por región', '-Porque subió en todo el mundo'],
        d: 2,
      }),
      op('¿Por qué hay más personas que no pueden pagar una dieta saludable que personas con hambre?', [ // e5b
        'Muchas cubren las calorías, pero no una dieta variada',
        'Porque la dieta saludable no incluye alimentos',
        ['Porque el hambre se mide con otra moneda', 'No es una cuestión de moneda: es calidad frente a cantidad.'],
        'Porque las personas con hambre comen más variado',
      ], 'Se puede no pasar hambre y aun así comer mal: la calidad es la primera víctima de los ingresos bajos.', { d: 2 }),
      par('Uní cada concepto con su definición.', [ // e6
        ['Hambre', 'No consumir de forma habitual la energía necesaria'],
        ['Inseguridad alimentaria', 'Comer menos o peor por falta de recursos'],
        ['Dieta saludable', 'Variada, con frutas, verduras y proteínas'],
        ['Motor del hambre', 'Causa que empuja a más personas al hambre'],
      ], 'Conceptos para leer los informes sobre hambre con precisión.', { d: 1 }),
      mult('¿Qué factores empujan el hambre en el mundo? Marcá todos.', [ // e7
        '+Conflictos armados',
        '+Sequías e inundaciones',
        '+Crisis económicas y suba de precios',
        '+Desigualdad en los ingresos',
        '-El exceso de producción mundial de alimentos',
      ], 'El mundo produce suficiente comida: el hambre es sobre todo un problema de acceso y de crisis.', { d: 1 }),
      det('Leé este posteo y marcá lo equivocado.', [ // e8
        ['En 2024, unas 673 millones de personas pasaron hambre.', false],
        ['El hambre existe porque el mundo no produce suficiente comida.', true, 'El problema principal es el acceso, junto con conflictos y crisis.'],
        ['Unas 2.600 millones de personas no podían pagar una dieta saludable.', false],
        ['Una dieta saludable cuesta lo mismo que una basada en harinas y azúcares.', true, 'Suele costar más; por eso los ingresos bajos empeoran la calidad de la dieta.'],
      ], 'Los datos ayudan a desarmar mitos sobre el hambre.', { d: 2 }),
      comp('Completá.', 'En 2024, unas [673] millones de personas pasaron hambre; cerca del [28] % sufrió inseguridad alimentaria moderada o grave; y uno de los motores del hambre son los [conflictos] armados.', ['67', '2', 'deportes'], 'Tres datos clave del hambre en el mundo.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Hambre y obesidad a la vez', 'La doble carga de la malnutrición, los ultraprocesados y los entornos que empujan a comer peor.', [
      teoria('Malnutrición en todas sus formas', [
        'Malnutrición no es solo desnutrición. Incluye la desnutrición (bajo peso, baja talla, falta de nutrientes), el sobrepeso y la obesidad, y las carencias de vitaminas y minerales, como la anemia por falta de hierro. Muchas veces conviven en un mismo país, en un mismo barrio e incluso en una misma familia: se llama doble carga de la malnutrición.',
      ]),
      clas('¿Qué forma de malnutrición es cada caso?', { // e1
        'Desnutrición': ['Un chico con baja talla para su edad', 'Un bebé con bajo peso'],
        'Exceso de peso': ['Un adolescente con obesidad', 'Un adulto con sobrepeso'],
        'Carencia de nutrientes': ['Una embarazada con anemia por falta de hierro', 'Un chico con falta de vitamina A'],
      }, 'Las tres formas pueden convivir en una misma familia.', { d: 1 }),
      teoria('Los datos de Argentina', [
        'Según la Segunda Encuesta Nacional de Nutrición y Salud, en Argentina el 67,9 % de los adultos y el 41,1 % de los chicos y adolescentes de 5 a 17 años tenía exceso de peso (sobrepeso u obesidad). Al mismo tiempo, persisten problemas de desnutrición y de anemia en algunos grupos. El exceso de peso es más frecuente en los hogares de menores ingresos, donde los alimentos frescos son relativamente más caros y abundan los ultraprocesados baratos.',
      ], { destacado: { valor: '41,1 %', texto: 'de los chicos y adolescentes de 5 a 17 años tenía exceso de peso, según la Segunda Encuesta Nacional de Nutrición y Salud.' } }),
      numv(3, (i) => { // e2
        const [n, pct] = [[500, 41.1], [1200, 41.1], [30, 41.1]][i];
        return {
          enunciado: `Si en una escuela hay ${n.toLocaleString('es-AR')} estudiantes y se aplica la proporción nacional de exceso de peso (41,1 %), ¿cuántos tendrían exceso de peso? Redondeá al entero.`,
          valor: Math.round(n * pct / 100),
          unidad: 'estudiantes',
          tol: 1,
          explicacion: `${n.toLocaleString('es-AR')} × 41,1 % ≈ ${Math.round(n * pct / 100)} estudiantes. Es un problema colectivo, que tiene que ver con los entornos alimentarios, no solo con decisiones individuales.`,
          ctx: `${n} estudiantes; 41,1 % con exceso de peso.`,
        };
      }, { d: 1 }),
      teoria('Entornos alimentarios', [
        'Lo que comemos no depende solo de cada persona. El entorno alimentario —qué alimentos hay cerca, cuánto cuestan, cómo se publicitan, qué se ofrece en la escuela o en el trabajo— empuja en una dirección. Cuando los ultraprocesados son baratos, están en todas partes y se publicitan dirigidos a chicos, y las frutas y verduras son caras o lejanas, comer bien se vuelve cuesta arriba. Por eso muchas políticas buscan cambiar el entorno: etiquetado frontal, regulación de la publicidad, kioscos saludables en escuelas, agua segura disponible.',
      ]),
      mult('¿Qué medidas mejoran el entorno alimentario? Marcá todas.', [ // e3
        '+Etiquetado frontal con sellos de advertencia',
        '+Kioscos escolares con opciones saludables',
        '+Bebederos de agua segura en escuelas',
        '+Ferias de frutas y verduras en los barrios',
        '-Publicidad de golosinas dirigida a chicos',
      ], 'Cambiar el entorno facilita comer bien a todas las personas a la vez.', { d: 1 }),
      op('¿Por qué el exceso de peso suele ser más frecuente en hogares de menores ingresos?', [ // e4
        'Los ultraprocesados baratos abundan y lo fresco es caro',
        'Porque esas familias no se preocupan por su salud',
        ['Porque comen más frutas y verduras', 'Suelen poder comprar menos alimentos frescos.'],
        'Porque tienen más tiempo para cocinar',
      ], 'El entorno y los precios pesan más que la voluntad individual.', { d: 2 }),
      teoria('El etiquetado frontal', [
        'La Ley 27.642, de Promoción de la Alimentación Saludable, obliga a que los alimentos con exceso de azúcares, sodio, grasas o calorías lleven sellos negros de advertencia en el frente del envase. Además, restringe la publicidad dirigida a chicos de productos con sellos y su venta en las escuelas. Lo viste en la unidad de etiquetas: el objetivo es que la información sea clara y rápida en el momento de elegir.',
      ]),
      par('Uní cada sello con lo que advierte.', [ // e5
        ['Exceso en azúcares', 'Demasiada azúcar agregada'],
        ['Exceso en sodio', 'Demasiada sal'],
        ['Exceso en grasas saturadas', 'Demasiada grasa de ese tipo'],
        ['Exceso en calorías', 'Demasiada energía para la porción'],
      ], 'Los sellos resumen en segundos lo que antes había que buscar en la tabla nutricional.', { d: 1 }),
      vf('La obesidad es solo un problema de fuerza de voluntad individual.', false, 'Influyen los precios, la publicidad, la disponibilidad de alimentos, el tiempo para cocinar y otros factores del entorno. Por eso hacen falta políticas, no solo consejos.', { // e6
        razones: ['+Porque el entorno alimentario influye mucho', '-Porque la alimentación no tiene relación con el peso', '-Porque la voluntad no existe'],
        d: 2,
      }),
      cad('Armá la cadena de cómo el etiquetado frontal puede cambiar lo que se come.', [ // e7
        'Los productos con exceso de nutrientes críticos llevan sellos',
        'Las personas identifican rápido esos excesos',
        'Muchas eligen opciones con menos sellos',
        'Algunas empresas reformulan sus productos',
        'Mejora la calidad de lo que se ofrece y se compra',
      ], ['Los sellos hacen más baratos los ultraprocesados'], 'El etiquetado actúa sobre quien compra y también sobre quien produce.', { d: 2 }),
      est('Estimá qué porcentaje de los adultos en Argentina tenía exceso de peso, según la Segunda Encuesta Nacional de Nutrición y Salud.', 67.9, { min: 0, max: 100, paso: 0.5, unidad: '%' }, 'El 67,9 %: dos de cada tres adultos. Es uno de los mayores problemas de salud pública del país.', { d: 2 }),
      mult('¿Qué forma parte del entorno alimentario de una escuela? Marcá todo.', [ // e7c
        '+Lo que vende el kiosco',
        '+Si hay bebederos de agua segura',
        '+El menú del comedor',
        '+La publicidad de alimentos en los alrededores',
        '-La cantidad de ventanas de las aulas',
      ], 'El entorno es todo lo que facilita o dificulta comer bien en un lugar.', { d: 1 }),
      det('Leé este comentario y marcá lo equivocado.', [ // e8
        ['En Argentina, 4 de cada 10 chicos y adolescentes tienen exceso de peso.', false],
        ['Desnutrición y obesidad nunca conviven en un mismo país.', true, 'Conviven: es la doble carga de la malnutrición.'],
        ['La Ley 27.642 establece sellos de advertencia en el frente de los envases.', false],
        ['El entorno alimentario no influye en lo que come la gente.', true, 'Precios, publicidad y disponibilidad influyen mucho.'],
      ], 'Comer bien es una responsabilidad compartida entre personas, empresas y Estado.', { d: 2 }),
      comp('Completá.', 'Cuando conviven desnutrición y obesidad se habla de doble [carga]; en Argentina, el [41,1] % de los chicos y adolescentes tiene exceso de peso; y la ley de etiquetado frontal es la Ley [27.642].', ['dieta', '4,1', '26.331'], 'Tres claves de la malnutrición en Argentina.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('El acceso en Argentina', 'Canastas, ingresos, indigencia y la red que sostiene a quienes no llegan: comedores, bancos de alimentos y agricultura familiar.', [
      teoria('Canastas y líneas', [
        'En Argentina, el INDEC mide la pobreza comparando los ingresos de cada hogar con dos canastas. La canasta básica alimentaria incluye los alimentos mínimos para cubrir las necesidades de energía y nutrientes; quienes no llegan a pagarla están en la indigencia. La canasta básica total suma otros bienes y servicios, como transporte, ropa, salud y educación; quienes no llegan a pagarla están en la pobreza.',
        'En el segundo semestre de 2025, en los principales aglomerados urbanos, el 28,2 % de las personas estaba bajo la línea de pobreza y el 6,3 % bajo la línea de indigencia.',
      ]),
      par('Uní cada concepto con su definición.', [ // e1
        ['Canasta básica alimentaria', 'Alimentos mínimos para cubrir las necesidades nutricionales'],
        ['Canasta básica total', 'Alimentos más otros bienes y servicios básicos'],
        ['Indigencia', 'Ingresos que no alcanzan la canasta alimentaria'],
        ['Pobreza', 'Ingresos que no alcanzan la canasta total'],
      ], 'La indigencia es la forma más extrema: no alcanza ni para comer lo mínimo.', { d: 2 }),
      numv(3, (i) => { // e2
        const [pob, pct] = [[30, 6.3], [30, 28.2], [30, 6.9]][i];
        return {
          enunciado: [
            `Si en los aglomerados urbanos relevados viven unos ${pob} millones de personas y el ${pct.toLocaleString('es-AR')} % está bajo la línea de indigencia, ¿cuántos millones de personas son? Redondeá a un decimal.`,
            `Si en los aglomerados urbanos relevados viven unos ${pob} millones de personas y el ${pct.toLocaleString('es-AR')} % está bajo la línea de pobreza, ¿cuántos millones de personas son? Redondeá a un decimal.`,
            `Con unos ${pob} millones de personas en los aglomerados relevados y una indigencia del ${pct.toLocaleString('es-AR')} %, ¿cuántos millones de personas no llegan a la canasta alimentaria? Redondeá a un decimal.`,
          ][i],
          valor: Math.round(pob * pct / 10) / 10,
          unidad: 'millones de personas',
          dec: 1,
          tol: 0.1,
          explicacion: `${pob} × ${pct.toLocaleString('es-AR')} % ≈ ${(Math.round(pob * pct / 10) / 10).toLocaleString('es-AR')} millones de personas. Detrás de cada punto porcentual hay cientos de miles de personas.`,
          ctx: `${pob} millones de personas; ${pct} %.`,
        };
      }, { d: 2 }),
      teoria('La red que sostiene', [
        'Cuando los ingresos no alcanzan, hay una red que sostiene: transferencias del Estado, programas alimentarios, comedores escolares y comunitarios, y bancos de alimentos que recuperan comida apta que se iba a tirar y la distribuyen a organizaciones. La Red Argentina de Bancos de Alimentos reúne a bancos de todo el país. Lo viste con la comida que se tira: recuperar alimentos es a la vez ambiental y social.',
      ]),
      clas('¿Esta ayuda actúa sobre los ingresos o entrega alimentos directamente?', { // e3
        'Sobre los ingresos': ['Transferencias de dinero a hogares con chicos', 'Tarjetas para comprar alimentos'],
        'Alimentos directos': ['Comedores escolares', 'Comedores comunitarios', 'Bancos de alimentos que abastecen organizaciones'],
      }, 'Las dos formas se complementan: el dinero da libertad de elegir; la comida directa llega rápido.', { d: 1 }),
      op('¿Qué ventaja tiene una transferencia de ingresos frente a entregar siempre el mismo bolsón de alimentos?', [ // e4
        'Permite elegir según las necesidades',
        'Que obliga a comer siempre lo mismo',
        ['Que no tiene ningún costo para el Estado', 'Tiene costo, como cualquier política.'],
        'Que reemplaza a la escuela',
      ], 'Cada familia conoce sus necesidades; el dinero permite adaptarse y sostiene al comercio local.', { d: 2 }),
      teoria('Agricultura familiar', [
        'La agricultura familiar —pequeños productores que trabajan con su familia— produce gran parte de las frutas, verduras, huevos y otros alimentos frescos que llegan a los mercados locales. Fortalecerla, con acceso a tierra, agua, crédito y circuitos de venta directa como ferias, acerca alimentos frescos a los barrios y sostiene economías regionales. Lo viste con los cinturones hortícolas.',
      ]),
      mult('¿Qué aporta la agricultura familiar a la seguridad alimentaria? Marcá todo.', [ // e5
        '+Alimentos frescos cerca de las ciudades',
        '+Empleo en las economías regionales',
        '+Diversidad de cultivos',
        '+Circuitos cortos como las ferias',
        '-Exportaciones masivas de un solo cultivo',
      ], 'Los alimentos frescos de cercanía dependen mucho de la agricultura familiar.', { d: 1 }),
      numv(3, (i) => { // e6
        const [cba, ing] = [[535991, 354134], [500000, 300000], [600000, 450000]][i];
        return {
          enunciado: `Si la canasta básica alimentaria de un hogar cuesta ${cba.toLocaleString('es-AR')} pesos y su ingreso es de ${ing.toLocaleString('es-AR')} pesos, ¿cuántos pesos le faltan para cubrirla?`,
          valor: cba - ing,
          unidad: 'pesos',
          explicacion: `${cba.toLocaleString('es-AR')} − ${ing.toLocaleString('es-AR')} = ${(cba - ing).toLocaleString('es-AR')} pesos. Esa diferencia se llama brecha de la indigencia: cuánto falta para llegar a la canasta alimentaria.`,
          ctx: `Canasta alimentaria ${cba}; ingreso ${ing}.`,
        };
      }, { d: 1 }),
      vf('Los bancos de alimentos resuelven por sí solos la inseguridad alimentaria de un país.', false, 'Son una parte valiosa de la red, pero la inseguridad alimentaria depende de los ingresos, el empleo, los precios y las políticas públicas. Ninguna organización sola puede resolverla.', { // e7
        razones: ['+Porque depende de ingresos, empleo, precios y políticas', '-Porque los bancos de alimentos no distribuyen comida', '-Porque la inseguridad alimentaria no existe'],
        d: 2,
      }),
      est('Estimá qué porcentaje de las personas de los principales aglomerados urbanos estaba bajo la línea de indigencia en el segundo semestre de 2025, según el INDEC.', 6.3, { min: 0, max: 60, paso: 0.1, unidad: '%' }, 'El 6,3 %: casi 1,9 millones de personas cuyos ingresos no alcanzaban para la canasta básica alimentaria.', { d: 3 }),
      cad('Armá el recorrido de una fruta que llega a un comedor gracias a un banco de alimentos.', [ // e7c
        'Un mercado separa frutas aptas que no se venden por su aspecto',
        'El banco de alimentos las retira y controla su estado',
        'Las clasifica y las guarda en condiciones adecuadas',
        'Las entrega a un comedor comunitario',
        'Se sirven en el almuerzo del día',
      ], ['Se tiran al relleno aunque estén aptas'], 'Recuperar alimentos une el cuidado del ambiente con el derecho a comer.', { d: 1 }),
      det('Leé este informe barrial y marcá lo equivocado.', [ // e8
        ['La indigencia se mide con la canasta básica alimentaria.', false],
        ['La pobreza y la indigencia son exactamente lo mismo.', true, 'La indigencia es no llegar ni a la canasta alimentaria; la pobreza, a la total.'],
        ['Los comedores comunitarios son parte de la red que sostiene.', false],
        ['La agricultura familiar no produce alimentos frescos.', true, 'Produce gran parte de las frutas, verduras y huevos de cercanía.'],
      ], 'Conocer cómo se mide y cómo se sostiene el acceso ayuda a proponer mejor.', { d: 2 }),
      comp('Completá.', 'Quienes no llegan a pagar la canasta básica alimentaria están en la [indigencia]; los bancos de alimentos recuperan comida que se iba a [tirar]; y la [agricultura] familiar produce gran parte de los alimentos frescos de cercanía.', ['abundancia', 'exportar', 'industria'], 'Tres claves del acceso a los alimentos en Argentina.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Sistemas que resisten', 'Resiliencia, soberanía alimentaria y cómo preparar el sistema alimentario para crisis climáticas y económicas.', [
      teoria('Resiliencia', [
        'Un sistema alimentario resiliente es el que puede resistir una crisis —una sequía, una pandemia, una suba brusca de precios— y recuperarse sin que la gente pase hambre. Lo hacen más resiliente la diversidad (de cultivos, de productores, de rutas y de proveedores), las reservas, la producción cercana, las redes de protección social y la información a tiempo para actuar antes de que la crisis golpee.',
      ]),
      mult('¿Qué hace más resiliente a un sistema alimentario? Marcá todo.', [ // e1
        '+Diversidad de cultivos y productores',
        '+Producción de alimentos cerca de las ciudades',
        '+Redes de protección social que se activan rápido',
        '+Sistemas de alerta temprana',
        '-Depender de un solo proveedor o una sola ruta',
      ], 'Diversidad, cercanía, protección y anticipación: los ingredientes de la resiliencia.', { d: 1 }),
      cad('Armá la cadena de cómo la diversidad protege el abastecimiento.', [ // e2
        'Una ciudad compra alimentos de muchas zonas y productores',
        'Una sequía afecta a una de esas zonas',
        'Las otras zonas siguen abasteciendo',
        'Los precios suben menos',
        'La gente sigue accediendo a los alimentos',
      ], ['Si falla una zona, falla todo el abastecimiento'], 'No depender de una sola fuente reparte el riesgo.', { d: 1 }),
      teoria('Soberanía alimentaria', [
        'El concepto de soberanía alimentaria fue impulsado por movimientos campesinos, como La Vía Campesina, en la década de 1990. Plantea el derecho de los pueblos a definir sus propias políticas alimentarias y a producir sus alimentos de forma sostenible, priorizando la producción local, el acceso a la tierra y al agua, y los saberes de los productores. Complementa la idea de seguridad alimentaria: no solo que haya comida, sino quién la produce, cómo y con qué control.',
      ]),
      op('¿En qué se diferencia la soberanía alimentaria de la seguridad alimentaria?', [ // e3
        'También pregunta quién produce, cómo y con qué control',
        'En que solo se ocupa de exportar alimentos',
        ['En que rechaza que las personas coman bien', 'Busca justamente que todos coman bien, con otro enfoque.'],
        'No hay ninguna diferencia entre las dos ideas',
      ], 'La seguridad pone el foco en el acceso; la soberanía suma la pregunta sobre el poder y la forma de producir.', { d: 3 }),
      clas('¿Esta idea se asocia más a la seguridad alimentaria o a la soberanía alimentaria?', { // e4
        'Seguridad alimentaria': ['Que todas las personas tengan acceso a alimentos suficientes', 'Medir el hambre con encuestas'],
        'Soberanía alimentaria': ['Derecho de los pueblos a definir sus políticas alimentarias', 'Acceso de los productores a la tierra y al agua', 'Priorizar la producción local y campesina'],
      }, 'Dos enfoques que dialogan y se complementan.', { d: 2 }),
      teoria('Anticiparse', [
        'Los sistemas de alerta temprana combinan pronósticos climáticos, seguimiento de precios y datos de cosechas para detectar una crisis antes de que golpee. Así se pueden activar ayudas, liberar reservas o apoyar a productores antes de que la gente pase hambre. Actuar antes suele costar mucho menos que responder después.',
      ]),
      ord('Ordená los pasos de una respuesta anticipada a una sequía que amenaza la producción de alimentos.', [ // e5
        'Los pronósticos anticipan una sequía',
        'Se monitorean cosechas y precios',
        'Se activan apoyos a productores y reservas',
        'Se refuerzan las ayudas a hogares vulnerables',
        'Se evalúa la respuesta para la próxima vez',
      ], 'Actuar antes de la crisis es más barato y protege a más personas.', { d: 2 }),
      numv(3, (i) => { // e6
        const [antes, despues] = [[1, 3], [2, 7], [5, 12]][i];
        return {
          enunciado: `Supongamos que responder de forma anticipada a una crisis alimentaria cuesta ${antes} millón${antes > 1 ? 'es' : ''} de dólares y responder después cuesta ${despues} millones. ¿Cuántas veces más caro es responder tarde? Redondeá a un decimal.`,
          valor: Math.round((despues / antes) * 10) / 10,
          unidad: 'veces',
          dec: 1,
          tol: 0.1,
          explicacion: `${despues} ÷ ${antes} ≈ ${(Math.round((despues / antes) * 10) / 10).toLocaleString('es-AR')} veces. Valores de ejemplo: muchos estudios coinciden en que anticiparse cuesta menos y protege más.`,
          ctx: `${antes} millones antes; ${despues} millones después.`,
        };
      }, { d: 1 }),
      vf('Reducir el desperdicio de alimentos también mejora la seguridad alimentaria.', true, 'La comida que no se pierde puede llegar a quienes la necesitan, y reduce la presión sobre la producción y los precios. Lo viste con la comida que se tira.', { // e7
        razones: ['+Porque más comida llega a quien la necesita y baja la presión', '-Porque el desperdicio no tiene relación con el acceso', '-Porque tirar comida baja los precios siempre'],
        d: 1,
      }),
      par('Uní cada estrategia con la dimensión de la seguridad alimentaria que más fortalece.', [ // e8
        ['Reservas de alimentos', 'Estabilidad'],
        ['Ferias de productores en los barrios', 'Acceso'],
        ['Agua segura en las casas', 'Utilización'],
        ['Apoyo a la producción local', 'Disponibilidad'],
      ], 'Un sistema resiliente fortalece las cuatro dimensiones a la vez.', { d: 2 }),
      op('Una ciudad compra el 90 % de su verdura a un solo mercado lejano. ¿Qué la haría más resiliente?', [ // e8b
        'Sumar productores cercanos y otros proveedores',
        'Comprar el 100 % a ese mismo mercado',
        ['Dejar de comprar verdura para no depender de nadie', 'Eso empeora la alimentación: la clave es diversificar.'],
        'Esperar a que el mercado nunca falle',
      ], 'Diversificar proveedores y acercar la producción reparte el riesgo.', { d: 1 }),
      det('Leé esta propuesta y marcá lo que conviene corregir.', [ // e9
        ['Diversificaremos los proveedores de alimentos de la ciudad.', false],
        ['Dependeremos de un solo proveedor porque es más barato.', true, 'Concentra el riesgo: si falla, falla todo el abastecimiento.'],
        ['Activaremos ayudas cuando los pronósticos anticipen una crisis.', false],
        ['Esperaremos a que haya hambre para actuar.', true, 'Anticiparse cuesta menos y protege a más personas.'],
      ], 'La resiliencia se construye antes de la crisis.', { d: 2 }),
      comp('Completá.', 'La capacidad de un sistema de resistir y recuperarse de una crisis es la [resiliencia]; el derecho de los pueblos a definir sus políticas alimentarias es la [soberanía] alimentaria; y actuar antes de una crisis es una respuesta [anticipada].', ['rigidez', 'publicidad', 'tardía'], 'Tres ideas para sistemas alimentarios que resistan crisis.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: seguridad alimentaria', 'Dimensiones, hambre en el mundo, doble carga, acceso en Argentina y resiliencia, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el comedor del barrio', 'Un comedor comunitario quiere mejorar la calidad de lo que ofrece sin gastar más y prepararse para una crisis de precios. Armá su plan.', [
      teoria('La situación', [
        'El comedor da almuerzo a 120 personas, de lunes a viernes, con un presupuesto fijo. Hoy el menú se basa en fideos, arroz y guisos con poca verdura, y casi no hay fruta. A dos cuadras hay una feria de productores familiares que vende verdura de estación más barata que el supermercado. Un banco de alimentos ofrece donaciones de frutas y verduras aptas que se descartan en un mercado. El año pasado, una suba de precios obligó a reducir las porciones durante dos meses.',
      ]),
      num('Si el comedor da 120 almuerzos por día, 5 días por semana, ¿cuántos almuerzos da por mes de 4 semanas?', 2400, 'almuerzos', '120 × 5 × 4 = 2.400 almuerzos por mes: un volumen que justifica planificar las compras.', { ctx: '120 almuerzos por día; 5 días; 4 semanas.', d: 1 }),
      num('Si cambia 10 kg semanales de verdura del supermercado a 1.200 pesos el kg por verdura de la feria a 800 pesos el kg, ¿cuántos pesos ahorra por semana?', 4000, 'pesos', '10 × (1.200 − 800) = 4.000 pesos por semana, que pueden destinarse a más fruta o legumbres. Precios de ejemplo.', { ctx: '10 kg; 1.200 y 800 pesos por kg.', d: 1 }),
      mult('¿Qué cambios mejoran la calidad del menú sin gastar más? Marcá todos.', [ // e3
        '+Comprar verdura de estación en la feria',
        '+Sumar legumbres como proteína económica',
        '+Aceptar frutas y verduras aptas del banco de alimentos',
        '+Planificar menús semanales para no desperdiciar',
        '-Reemplazar la fruta por jugos azucarados',
      ], 'Estación, legumbres, recuperación de alimentos y planificación: calidad sin más gasto.', { d: 2 }),
      op('¿Qué conviene hacer para no tener que reducir porciones en la próxima suba de precios?', [ // e4
        'Armar un pequeño fondo y acuerdos con productores',
        'Esperar que los precios no vuelvan a subir',
        ['Reducir las porciones desde ahora por las dudas', 'Anticipa el daño en lugar de prevenirlo.'],
        'Comprar solo ultraprocesados baratos',
      ], 'Anticiparse con reservas y acuerdos es la base de la resiliencia, también a escala de un comedor.', { d: 2 }),
      clas('¿Qué dimensión de la seguridad alimentaria fortalece cada medida del comedor?', { // e5
        'Acceso': ['Mantener gratuito el almuerzo', 'Comprar más barato en la feria'],
        'Utilización': ['Agregar frutas y verduras variadas', 'Capacitar en higiene de la cocina'],
        'Estabilidad': ['Armar un fondo para las subas de precios', 'Acuerdos de precios con productores'],
      }, 'El comedor puede fortalecer varias dimensiones a la vez.', { d: 3 }),
      vf('Recibir donaciones del banco de alimentos significa servir comida de peor calidad.', false, 'Los bancos de alimentos recuperan productos aptos que se descartaban por razones comerciales, como forma o tamaño. Pueden mejorar la variedad y la calidad del menú.', { // e6
        razones: ['+Porque recuperan alimentos aptos que se descartaban', '-Porque los bancos de alimentos distribuyen comida vencida', '-Porque las donaciones son siempre ultraprocesadas'],
        d: 2,
      }),
      det('El comedor escribe su plan. Marcá lo que conviene corregir.', [ // e7
        ['Compraremos verdura de estación en la feria del barrio.', false],
        ['Reemplazaremos la fruta por jugos azucarados porque es más fácil.', true, 'Empeora la calidad: suma azúcar y quita fibra y nutrientes.'],
        ['Planificaremos el menú semanal con legumbres.', false],
        ['Si suben los precios, recortaremos porciones sin avisar.', true, 'Conviene anticiparse con reservas y acuerdos, y comunicar.'],
      ], 'Un buen plan mejora la calidad hoy y protege el acceso mañana.', { d: 3 }),
    ]),
  ],
});
