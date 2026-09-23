import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// RESIDUOS 5 — Gestión integral de residuos en la ciudad.
// Cómo se diseña un sistema municipal de residuos: el sistema completo
// (GIRSU), cómo se caracteriza la basura, cómo se organizan la separación y
// la recolección, qué hacen las plantas de tratamiento, cómo funciona un
// relleno sanitario y cómo se cierra un basural. Retoma la bolsa que sale
// de casa (residuos-1), la escalera de los residuos (residuos-2), el compost
// (residuos-3) y la economía circular (consumo-3).

export default unidad({
  slug: 'residuos-5',
  rama: 'residuos',
  orden: 5,
  nivel: 3,
  requiereTronco: 3,
  titulo: 'Gestión integral de residuos en la ciudad',
  bajada: 'De la vereda al relleno sanitario: cómo se diseña, se calcula y se mejora el sistema de residuos de un municipio, y cómo se cierra un basural.',
  objetivos: [
    'Describir las etapas de la gestión integral de residuos sólidos urbanos',
    'Planificar un estudio de caracterización y calcular la generación de un municipio',
    'Diseñar la separación en origen y la recolección diferenciada',
    'Dimensionar plantas de clasificación y compostaje',
    'Explicar cómo funciona un relleno sanitario y cómo se cierra un basural',
  ],
  repasa: ['residuos-1', 'residuos-2', 'residuos-3', 'consumo-3'],
  fuentes: ['basurales-ar', 'chequeado-basurales', 'ley-25916-residuos', 'ley-1854-basura-cero', 'ceamse', 'faccyr', 'bm-what-a-waste', 'epa'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Un sistema, no un camión', 'Generación, separación, recolección, transferencia, tratamiento y disposición final: la gestión integral de los residuos urbanos.', [
      teoria('La gestión integral', [
        'La gestión integral de residuos sólidos urbanos (GIRSU) mira todo el recorrido de la basura como un sistema: generación (cuánto y qué se produce), disposición inicial (cómo se separa y se saca), recolección, transferencia (cuando hay que llevarla lejos, se pasa a camiones más grandes), tratamiento (clasificación, reciclaje, compostaje) y disposición final (relleno sanitario). La Ley 25.916, de presupuestos mínimos, establece este enfoque en Argentina.',
      ], { lista: ['Generación', 'Disposición inicial y separación', 'Recolección', 'Transferencia', 'Tratamiento', 'Disposición final'] }),
      ord('Ordená las etapas de la gestión integral de residuos.', [ // e1
        'Generación en casas y comercios',
        'Separación y disposición inicial',
        'Recolección',
        'Transferencia a camiones más grandes',
        'Tratamiento: clasificación y compostaje',
        'Disposición final en un relleno sanitario',
      ], 'Cada etapa condiciona a la siguiente: lo que no se separa al principio es muy difícil de recuperar después.', { d: 2 }),
      teoria('Los números del país', [
        'Según el Gobierno nacional, en Argentina se generan en promedio 1,15 kilos de residuos por habitante por día: casi 45.000 toneladas diarias, alrededor de 16,5 millones de toneladas por año. Y existen unos 5.000 basurales a cielo abierto, más de dos por municipio en promedio. Una parte importante de la población todavía tiene una disposición final inadecuada.',
      ], { destacado: { valor: '≈ 5.000', texto: 'basurales a cielo abierto existen en Argentina, según el Gobierno nacional: más de dos por municipio en promedio.' } }),
      numv(3, (i) => { // e2
        const hab = [60000, 150000, 25000][i];
        return {
          enunciado: `Si un municipio tiene ${hab.toLocaleString('es-AR')} habitantes y cada uno genera 1,15 kg de residuos por día, ¿cuántas toneladas por día genera el municipio? Redondeá a un decimal.`,
          valor: Math.round(hab * 1.15 / 100) / 10,
          unidad: 'toneladas por día',
          dec: 1,
          tol: 0.1,
          explicacion: `${hab.toLocaleString('es-AR')} × 1,15 = ${(hab * 1.15).toLocaleString('es-AR')} kg ≈ ${(Math.round(hab * 1.15 / 100) / 10).toLocaleString('es-AR')} t por día. Es el punto de partida para dimensionar camiones y plantas.`,
          ctx: `${hab} habitantes; 1,15 kg por persona por día.`,
        };
      }, { d: 1 }),
      teoria('Regionalizar', [
        'Muchos municipios son demasiado chicos para tener cada uno su propio relleno sanitario y sus plantas: los costos fijos serían enormes. Por eso se promueven sistemas regionales: varios municipios se asocian en un consorcio, comparten un relleno y plantas de tratamiento, y usan estaciones de transferencia para llevar los residuos. Así se logra escala y se evita que cada pueblo tenga su basural.',
      ]),
      cad('Armá la cadena de por qué conviene regionalizar.', [ // e3
        'Un pueblo chico genera pocas toneladas por día',
        'Un relleno sanitario tiene altos costos fijos',
        'Para un solo pueblo sería carísimo por tonelada',
        'Varios municipios se asocian y comparten el relleno',
        'El costo por tonelada baja y se cierran los basurales locales',
      ], ['Cada pueblo construye su propio relleno aunque no pueda pagarlo'], 'La escala compartida hace posible lo que un municipio solo no podría sostener.', { d: 2 }),
      par('Uní cada etapa con su ejemplo.', [ // e4
        ['Disposición inicial', 'Separar orgánicos y reciclables en casa'],
        ['Transferencia', 'Pasar la carga a camiones grandes para un viaje largo'],
        ['Tratamiento', 'Compostar los restos de poda y comida'],
        ['Disposición final', 'Enterrar el rechazo en un relleno sanitario'],
      ], 'Cada etapa tiene su infraestructura y sus responsables.', { d: 1 }),
      vf('La gestión de residuos de un municipio consiste solo en que pase el camión.', false, 'El camión es una etapa. La gestión integral incluye separación, tratamiento, disposición final, cierre de basurales, educación y control.', { // e5
        razones: ['+Porque incluye todo el sistema, no solo la recolección', '-Porque los municipios no recogen residuos', '-Porque los residuos desaparecen al subir al camión'],
        d: 1,
      }),
      clas('¿Esta acción pertenece a la recolección o al tratamiento?', { // e6
        'Recolección': ['Diseñar las rutas de los camiones', 'Definir la frecuencia de paso por barrio'],
        'Tratamiento': ['Clasificar plásticos y cartón en una planta', 'Compostar restos de poda', 'Recuperar metales en una cinta de separación'],
      }, 'Recolectar es mover; tratar es transformar y recuperar.', { d: 1 }),
      numv(3, (i) => { // e7
        const hab = [45000000, 46000000, 44000000][i];
        return {
          enunciado: `Si ${(hab / 1000000).toLocaleString('es-AR')} millones de personas generan 1,15 kg de residuos por día cada una, ¿cuántas toneladas por día son? Redondeá a los mil más cercanos.`,
          valor: Math.round(hab * 1.15 / 1000 / 1000) * 1000,
          unidad: 'toneladas por día',
          tol: 1000,
          explicacion: `${(hab / 1000000).toLocaleString('es-AR')} millones × 1,15 kg ≈ ${(Math.round(hab * 1.15 / 1000 / 1000) * 1000).toLocaleString('es-AR')} toneladas por día: del orden de una tonelada cada dos segundos.`,
          ctx: `${hab} habitantes; 1,15 kg cada uno por día.`,
        };
      }, { d: 2 }),
      mult('¿Qué ventajas tiene un consorcio regional de residuos? Marcá todas.', [ // e8
        '+Menor costo por tonelada',
        '+Rellenos sanitarios con mejor control técnico',
        '+Posibilidad de cerrar basurales locales',
        '-Cada municipio mantiene su propio basural',
        '-Los residuos viajan sin ningún control',
      ], 'La regionalización es una de las claves para terminar con los basurales.', { d: 2 }),
      est('Estimá cuántos basurales a cielo abierto hay en Argentina, según el Gobierno nacional.', 5000, { min: 10, max: 100000, unidad: 'basurales', escala: 'log' }, 'Unos 5.000: más de dos por municipio en promedio. Cerrarlos exige tener antes un destino adecuado para los residuos.', { d: 2 }),
      det('Leé esta nota y marcá lo equivocado.', [ // e9
        ['En Argentina se generan en promedio 1,15 kg de residuos por persona por día.', false],
        ['En el país quedan menos de diez basurales a cielo abierto.', true, 'Se estima que hay unos 5.000.'],
        ['La Ley 25.916 establece la gestión integral de residuos domiciliarios.', false],
        ['La transferencia consiste en enterrar la basura.', true, 'Es pasar la carga a camiones más grandes para viajes largos.'],
      ], 'Conocer el sistema completo permite ver dónde están los problemas.', { d: 2 }),
      comp('Completá.', 'La gestión integral de residuos se conoce por la sigla [GIRSU]; en Argentina cada persona genera en promedio [1,15] kg de residuos por día; y cuando varios municipios se asocian para gestionarlos forman un [consorcio].', ['RAEE', '11,5', 'basural'], 'Tres claves para entender la gestión de residuos de una ciudad.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Conocer la basura', 'El estudio de caracterización: cómo saber cuánto y qué se tira, antes de decidir qué plantas construir.', [
      teoria('Caracterizar', [
        'Antes de diseñar un sistema hay que conocer la basura: cuánto se genera y de qué está hecha. Eso se hace con un estudio de caracterización. Se toman muestras de los camiones de distintos barrios y días, se mezclan, se reduce la muestra de forma representativa (por ejemplo, con el método del cuarteo: se divide el montón en cuatro partes y se descartan dos opuestas, repitiendo hasta llegar a un tamaño manejable) y se separa y pesa cada fracción: orgánicos, papel y cartón, plásticos, vidrio, metales, textiles, peligrosos y otros.',
      ]),
      ord('Ordená los pasos de un estudio de caracterización.', [ // e1
        'Elegir barrios y días representativos',
        'Tomar muestras de los camiones',
        'Mezclar y reducir la muestra por cuarteo',
        'Separar la muestra en fracciones',
        'Pesar cada fracción y calcular porcentajes',
      ], 'Un buen muestreo es la diferencia entre un dato que sirve y uno que engaña.', { d: 2 }),
      op('¿Por qué conviene tomar muestras en distintos barrios y épocas del año?', [ // e2
        'Porque la composición cambia según el barrio y la estación',
        'Porque así el estudio tarda más y es más caro',
        ['Porque un solo barrio representa a toda la ciudad', 'Cada barrio y cada época tiene basura distinta.'],
        'Porque la ley obliga a visitar todos los barrios',
      ], 'En verano hay más restos de fruta y poda; los barrios comerciales tiran más cartón: una sola muestra engaña.', { d: 2 }),
      teoria('Qué se encuentra', [
        'En la mayoría de las ciudades argentinas, los orgánicos (restos de comida y poda) son la fracción más grande de la bolsa: suelen rondar entre el 40 y el 50 % del peso. Luego vienen el papel y el cartón, los plásticos, el vidrio y otros. Esto tiene una consecuencia enorme: sin tratar los orgánicos, ninguna estrategia puede reducir mucho lo que llega al relleno.',
      ], {
        datos: barras('Composición típica de los residuos de una ciudad argentina (valores de ejemplo)', '% del peso', [
          ['Orgánicos', 45],
          ['Papel y cartón', 15],
          ['Plásticos', 15],
          ['Vidrio', 5],
          ['Metales', 2],
          ['Otros', 18],
        ], 'Valores ilustrativos: cada ciudad debe caracterizar su propia basura.'),
      }),
      numv(3, (i) => { // e3
        const [t, org] = [[69, 45], [150, 50], [30, 40]][i];
        return {
          enunciado: `Un municipio genera ${t} toneladas de residuos por día y el ${org} % son orgánicos. ¿Cuántas toneladas de orgánicos por día genera? Redondeá a un decimal.`,
          valor: Math.round(t * org / 10) / 10,
          unidad: 'toneladas',
          dec: 1,
          tol: 0.1,
          explicacion: `${t} × ${org} % = ${(Math.round(t * org / 10) / 10).toLocaleString('es-AR')} toneladas de orgánicos por día. Es la fracción más grande, y la que más conviene tratar.`,
          ctx: `${t} t por día; ${org} % orgánicos.`,
        };
      }, { d: 1 }),
      clas('¿A qué fracción pertenece cada residuo en una caracterización?', { // e4
        'Orgánicos': ['Cáscaras de fruta', 'Restos de poda', 'Yerba usada'],
        'Reciclables secos': ['Cajas de cartón', 'Botellas de plástico', 'Latas de aluminio'],
        'Peligrosos': ['Pilas', 'Envases de insecticida'],
      }, 'Separar bien en la muestra permite dimensionar cada planta.', { d: 1 }),
      vf('Si el 45 % de la basura es orgánica, reciclar solo plásticos y cartón puede reducir a la mitad lo que va al relleno.', false, 'Plásticos y cartón juntos suelen ser cerca de un tercio. Sin tratar los orgánicos, es muy difícil reducir mucho lo que se entierra.', { // e5
        razones: ['+Porque los orgánicos son la fracción más grande', '-Porque el plástico pesa más que todo lo demás', '-Porque el cartón es orgánico'],
        d: 3,
      }),
      teoria('Densidad y volumen', [
        'Además del peso, importa el volumen: los camiones y los rellenos se llenan por volumen. La basura suelta en una bolsa es liviana para su tamaño (baja densidad); un camión compactador la aprieta varias veces; y en el relleno se compacta todavía más. Por eso el mismo peso ocupa volúmenes muy distintos en cada etapa.',
      ]),
      numv(3, (i) => { // e6
        const [t, dens] = [[10, 0.5], [20, 0.4], [15, 0.6]][i];
        return {
          enunciado: `Un camión compactador lleva la basura con una densidad de ${dens.toLocaleString('es-AR')} toneladas por metro cúbico. ¿Cuántos metros cúbicos ocupan ${t} toneladas?`,
          valor: t / dens,
          unidad: 'm³',
          explicacion: `${t} ÷ ${dens.toLocaleString('es-AR')} = ${(t / dens).toLocaleString('es-AR')} m³. Conocer la densidad permite calcular cuántos viajes hacen falta y cuánto dura un relleno.`,
          ctx: `${t} t; densidad ${dens} t/m³.`,
        };
      }, { d: 2 }),
      mult('¿Para qué sirve un estudio de caracterización? Marcá todo.', [ // e7
        '+Dimensionar una planta de compostaje',
        '+Estimar cuánto material reciclable hay',
        '+Planificar cuántos camiones hacen falta',
        '+Medir si un programa de separación funciona',
        '-Reemplazar la recolección de residuos',
      ], 'Sin datos de la basura, las plantas se construyen a ciegas.', { d: 1 }),
      par('Uní cada concepto con su definición.', [ // e8
        ['Caracterización', 'Estudio de cuánto y qué se tira'],
        ['Cuarteo', 'Método para reducir una muestra de forma representativa'],
        ['Densidad', 'Cuánto pesa un volumen de residuos'],
        ['Fracción', 'Tipo de material dentro de la basura'],
      ], 'Vocabulario técnico básico de la gestión de residuos.', { d: 2 }),
      op('Una caracterización muestra 30 % de cartón en la basura del centro comercial y 8 % en los barrios residenciales. ¿Qué conviene?', [ // e8b
        'Recolección diferenciada de cartón en el centro',
        'La misma recolección de siempre en toda la ciudad',
        ['Prohibir el cartón en los comercios', 'Es poco práctico; conviene recuperarlo donde se concentra.'],
        'Dejar de caracterizar los barrios residenciales',
      ], 'Los datos por zona permiten diseñar servicios donde rinden más.', { d: 2 }),
      det('Leé el informe de un estudio y marcá los errores.', [ // e9
        ['Tomamos muestras en barrios residenciales y comerciales.', false],
        ['Hicimos una sola muestra un día de enero y la usamos para todo el año.', true, 'La composición cambia según la estación; hacen falta varias campañas.'],
        ['Los orgánicos resultaron la fracción más grande.', false],
        ['Pesamos solo los reciclables porque el resto no importa.', true, 'Hay que pesar todas las fracciones para dimensionar el sistema.'],
      ], 'La calidad del estudio define la calidad de las decisiones.', { d: 2 }),
      comp('Completá.', 'El estudio que mide cuánto y qué se tira es una [caracterización]; el método para reducir una muestra dividiéndola en cuatro se llama [cuarteo]; y la fracción más grande de la basura suelen ser los [orgánicos].', ['auditoría', 'sorteo', 'metales'], 'Tres claves para conocer la basura antes de decidir.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Separar y recolectar', 'Cómo se diseña un programa de separación en origen y una recolección diferenciada que funcionen.', [
      teoria('Separación en origen', [
        'Separar en origen es separar en casas y comercios, antes de que todo se mezcle en el camión. Lo más simple y efectivo suele ser pocas fracciones: por ejemplo, reciclables secos, orgánicos y resto. Un programa funciona si es fácil y claro (qué va en cada bolsa, qué día pasa el camión), si la gente ve que lo separado no se vuelve a mezclar y si hay comunicación constante. Cuanto más separado llega el material, más valor tiene.',
      ]),
      mult('¿Qué hace que un programa de separación en origen funcione? Marcá todo.', [ // e1
        '+Pocas fracciones, fáciles de entender',
        '+Días de recolección claros para cada fracción',
        '+Que el material separado no se vuelva a mezclar',
        '+Comunicación y devolución de resultados',
        '-Cambiar las reglas cada mes',
      ], 'Si la gente ve que lo separado se mezcla en el camión, deja de separar.', { d: 1 }),
      teoria('Dos indicadores', [
        'Para saber si un programa funciona se miran dos cosas. La participación: qué porcentaje de los hogares separa. Y la calidad o contaminación: qué porcentaje de lo que llega como "reciclable" en realidad no lo es (restos de comida, pañales, material sucio). Un programa con mucha participación pero muy contaminado puede recuperar poco.',
      ]),
      numv(3, (i) => { // e2
        const [reciclable, contam] = [[8, 25], [12, 30], [5, 15]][i];
        return {
          enunciado: `A la planta llegan ${reciclable} toneladas por día de "reciclables" y el ${contam} % es material contaminado que no sirve. ¿Cuántas toneladas se pueden recuperar realmente?`,
          valor: Math.round(reciclable * (100 - contam) / 10) / 10,
          unidad: 'toneladas',
          dec: 1,
          tol: 0.1,
          explicacion: `${reciclable} × ${100 - contam} % = ${(Math.round(reciclable * (100 - contam) / 10) / 10).toLocaleString('es-AR')} toneladas. La contaminación de la fracción seca reduce lo recuperable y encarece la planta.`,
          ctx: `${reciclable} t; ${contam} % contaminado.`,
        };
      }, { d: 1 }),
      cad('Armá la cadena de cómo la contaminación arruina el reciclaje.', [ // e3
        'Alguien pone restos de comida en la bolsa de reciclables',
        'El cartón y el papel se mojan y se ensucian',
        'En la planta no se pueden recuperar',
        'Ese material termina en el relleno',
        'Baja lo recuperado y sube el costo',
      ], ['La comida mejora la calidad del cartón'], 'Una fracción seca limpia vale mucho más que una grande y sucia.', { d: 1 }),
      teoria('La recolección', [
        'La recolección suele ser la etapa más cara de todo el sistema: camiones, combustible, personal, mantenimiento. Se planifica con rutas, frecuencias y horarios. Con separación en origen se puede reorganizar: por ejemplo, pasar varios días por semana por los orgánicos, que se descomponen, y menos por los secos. Contenedores en la vereda o puntos limpios en los barrios cambian el costo y la comodidad del servicio.',
      ]),
      clas('¿Qué fracción conviene recolectar con más frecuencia?', { // e4
        'Con más frecuencia': ['Restos de comida', 'Residuos de verdulerías'],
        'Con menos frecuencia': ['Cartón seco', 'Botellas de plástico limpias', 'Latas'],
      }, 'Lo que se descompone y huele necesita más frecuencia; lo seco puede esperar.', { d: 1 }),
      numv(3, (i) => { // e5
        const [t, cap, viajes] = [[69, 10, 2], [150, 12, 3], [30, 8, 2]][i];
        return {
          enunciado: `Un municipio recolecta ${t} toneladas por día. Cada camión carga ${cap} toneladas por viaje y hace ${viajes} viajes por día. ¿Cuántos camiones hacen falta como mínimo? (Redondeá hacia arriba.)`,
          valor: Math.ceil(t / (cap * viajes)),
          unidad: 'camiones',
          explicacion: `Cada camión lleva ${cap * viajes} t por día; ${t} ÷ ${cap * viajes} = ${(t / (cap * viajes)).toLocaleString('es-AR', { maximumFractionDigits: 2 })}, así que hacen falta ${Math.ceil(t / (cap * viajes))} camiones, más alguno de reserva para mantenimiento.`,
          ctx: `${t} t por día; ${cap} t por viaje; ${viajes} viajes por día.`,
        };
      }, { d: 2 }),
      teoria('Incluir a quienes ya recuperan', [
        'En muchas ciudades argentinas, los recuperadores urbanos y las cooperativas ya hacen gran parte de la recuperación de reciclables. Un buen sistema no los reemplaza: los integra, con recolección diferenciada a cargo de cooperativas, centros verdes con equipamiento, pagos por el servicio ambiental que prestan y condiciones de trabajo dignas. La Ley 1.854 de Basura Cero de la Ciudad de Buenos Aires, por ejemplo, incluyó a las cooperativas en la recolección de secos.',
      ]),
      op('¿Qué hace un buen sistema municipal con los recuperadores urbanos que ya trabajan en la ciudad?', [ // e6
        'Los integra con pago y condiciones dignas',
        'Los prohíbe para que trabajen solo empresas',
        ['Los ignora y los deja trabajar sin apoyo', 'Pierde una fuerza de recuperación clave y deja condiciones precarias.'],
        'Les cobra por usar los contenedores',
      ], 'Integrar a las cooperativas mejora la recuperación y la justicia del sistema.', { d: 2 }),
      vf('Si muchos hogares separan pero la fracción reciclable llega muy contaminada, el programa igual recupera mucho.', false, 'La contaminación reduce lo recuperable y puede arruinar lotes enteros. Participación y calidad tienen que ir juntas.', { // e7
        razones: ['+Porque la contaminación reduce mucho lo recuperable', '-Porque la participación no importa', '-Porque la contaminación mejora los materiales'],
        d: 2,
      }),
      vf('Un programa con pocas fracciones claras suele funcionar mejor que uno con muchas fracciones complicadas.', true, 'Cuanto más simple, más gente participa y menos se equivoca. La separación fina puede hacerse después, en la planta.', { // e7b
        razones: ['+Porque lo simple aumenta la participación y reduce errores', '-Porque separar no sirve para nada', '-Porque las fracciones complicadas se reciclan mejor'],
        d: 1,
      }),
      det('Leé este plan de separación y marcá lo que conviene corregir.', [ // e8
        ['Usaremos tres fracciones: secos, orgánicos y resto.', false],
        ['El camión recogerá todo junto para ahorrar viajes.', true, 'Si se mezcla en el camión, se pierde la separación y la confianza de los vecinos.'],
        ['Mediremos participación y contaminación cada mes.', false],
        ['Las cooperativas de recuperadores quedarán afuera del sistema.', true, 'Conviene integrarlas: ya hacen gran parte de la recuperación.'],
      ], 'Un plan de separación se gana o se pierde en la confianza de los vecinos.', { d: 2 }),
      par('Uní cada indicador con lo que mide.', [ // e9
        ['Participación', 'Porcentaje de hogares que separan'],
        ['Contaminación', 'Porcentaje de material que no corresponde'],
        ['Tasa de recuperación', 'Porcentaje del total que se recupera'],
        ['Generación per cápita', 'Kilos por persona por día'],
      ], 'Sin indicadores no se sabe si el sistema mejora.', { d: 2 }),
      comp('Completá.', 'Separar en casas y comercios es separar en [origen]; el porcentaje de hogares que separa es la [participación]; y la etapa más cara del sistema suele ser la [recolección].', ['destino', 'contaminación', 'disposición'], 'Tres claves para diseñar la separación y la recolección.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Plantas de tratamiento', 'Plantas de clasificación, compostaje y biodigestión: qué entra, qué sale y cuánto rinde cada una.', [
      teoria('Planta de clasificación', [
        'En una planta de clasificación, la fracción seca pasa por cintas donde trabajadores y máquinas separan cartón, distintos plásticos, vidrio y metales. Los imanes separan el acero; otras máquinas, el aluminio. Lo recuperado se enfarda y se vende a la industria. Lo que no se puede recuperar se llama rechazo y va al relleno. Cuanto más limpia llega la fracción seca, menor el rechazo.',
      ]),
      cad('Armá el recorrido de la fracción seca en una planta de clasificación.', [ // e1
        'Llega el camión con reciclables',
        'Se descarga en la playa de recepción',
        'La cinta lleva el material a los puestos de separación',
        'Se separan cartón, plásticos, vidrio y metales',
        'Se enfarda lo recuperado y el rechazo va al relleno',
      ], ['Todo el material se entierra sin separar'], 'Una planta de clasificación convierte residuos mezclados en materias primas.', { d: 1 }),
      numv(3, (i) => { // e2
        const [entra, rech] = [[10, 30], [15, 20], [8, 40]][i];
        return {
          enunciado: `A una planta de clasificación entran ${entra} toneladas por día de reciclables y el ${rech} % es rechazo. ¿Cuántas toneladas por día se venden como material recuperado?`,
          valor: Math.round(entra * (100 - rech) / 10) / 10,
          unidad: 'toneladas',
          dec: 1,
          tol: 0.1,
          explicacion: `${entra} × ${100 - rech} % = ${(Math.round(entra * (100 - rech) / 10) / 10).toLocaleString('es-AR')} toneladas recuperadas. El rechazo depende mucho de la calidad de la separación en origen.`,
          ctx: `${entra} t por día; rechazo del ${rech} %.`,
        };
      }, { d: 1 }),
      teoria('Compostar a escala', [
        'Una planta de compostaje municipal trata restos de poda y, cuando hay separación, restos de comida. Se arman pilas o hileras que se voltean para oxigenarlas; se controla la humedad y la temperatura, que sube a más de 55 °C y elimina patógenos y semillas. Después de unos meses queda compost. Durante el proceso se pierde agua y parte de la materia orgánica se convierte en CO₂: el compost final pesa, en general, entre un tercio y la mitad de lo que entró.',
      ]),
      numv(3, (i) => { // e3
        const [org, rend] = [[30, 40], [20, 35], [50, 45]][i];
        return {
          enunciado: `Una planta recibe ${org} toneladas de orgánicos por día. Si el compost final pesa el ${rend} % de lo que entra, ¿cuántas toneladas de compost produce por día?`,
          valor: Math.round(org * rend / 10) / 10,
          unidad: 'toneladas',
          dec: 1,
          tol: 0.1,
          explicacion: `${org} × ${rend} % = ${(Math.round(org * rend / 10) / 10).toLocaleString('es-AR')} toneladas de compost. El resto se va como agua y CO₂ durante el proceso.`,
          ctx: `${org} t de orgánicos; rendimiento del ${rend} %.`,
        };
      }, { d: 1 }),
      op('¿Por qué el compost pesa mucho menos que los residuos orgánicos que entraron?', [ // e4
        'Se pierde agua y parte de la materia se vuelve CO₂',
        'Porque se le saca todo lo que no es tierra',
        ['Porque se vende por kilo a menor precio', 'El precio no cambia el peso: es un proceso físico y biológico.'],
        'Porque el compost se evapora al sol',
      ], 'Lo viste con el compost casero: los microorganismos respiran y el agua se evapora.', { d: 2 }),
      teoria('Biodigestores', [
        'Otra opción para los orgánicos es la biodigestión: en tanques cerrados y sin oxígeno, bacterias descomponen los residuos y producen biogás, rico en metano, que puede usarse para generar electricidad o calor. Lo que queda, el digerido, puede usarse como enmienda del suelo. Es útil para residuos muy húmedos, como los de la industria alimentaria o los mercados.',
      ]),
      par('Uní cada tratamiento con su producto principal.', [ // e5
        ['Planta de clasificación', 'Materiales para reciclar'],
        ['Compostaje', 'Compost para el suelo'],
        ['Biodigestión', 'Biogás para energía'],
        ['Relleno sanitario', 'Disposición segura del rechazo'],
      ], 'Cada tratamiento transforma una fracción distinta.', { d: 1 }),
      clas('¿Qué tratamiento conviene más para cada residuo?', { // e6
        'Compostaje': ['Restos de poda', 'Hojas secas de la plaza'],
        'Biodigestión': ['Residuos húmedos de un mercado de frutas', 'Descartes de una industria láctea'],
        'Clasificación y reciclaje': ['Cartón de comercios', 'Botellas de plástico limpias'],
      }, 'Elegir bien el tratamiento para cada flujo aumenta lo que se aprovecha.', { d: 2 }),
      vf('La temperatura alta de una pila de compost bien manejada ayuda a eliminar patógenos y semillas de malezas.', true, 'Cuando la pila supera los 55 °C durante varios días, muchos patógenos y semillas mueren. Por eso se controla la temperatura en las plantas.', { // e7
        razones: ['+Porque el calor de la pila elimina patógenos y semillas', '-Porque el compost nunca se calienta', '-Porque los patógenos resisten cualquier temperatura'],
        d: 2,
      }),
      mult('¿Qué se controla en una pila de compost de una planta municipal? Marcá todo.', [ // e7b
        '+La humedad',
        '+La temperatura',
        '+La oxigenación, con volteos',
        '+Que no entren materiales peligrosos',
        '-El color del cartel de la planta',
      ], 'Un compost de calidad depende del control del proceso y de lo que entra.', { d: 1 }),
      rank('Ordená estos destinos para 1 tonelada de restos de poda, del de más valor al de menos.', [ // e8
        ['Compostarla y usar el compost en plazas', 'devuelve nutrientes al suelo'],
        ['Triturarla como cobertura del suelo', 'buen uso directo'],
        ['Enterrarla en un relleno sanitario', 'se pierde y genera metano'],
        ['Quemarla a cielo abierto', 'contamina el aire'],
      ], 'Lo viste con la escalera de los residuos: enterrar o quemar orgánicos es desperdiciar un recurso.', { d: 2, extremos: ['Más valor', 'Menos valor'] }),
      det('Leé este proyecto de planta y marcá los errores.', [ // e9
        ['La planta de compostaje controlará humedad y temperatura.', false],
        ['El compost final pesará lo mismo que los residuos que entren.', true, 'Pesa bastante menos: se pierde agua y parte se vuelve CO₂.'],
        ['El rechazo de la clasificación irá al relleno sanitario.', false],
        ['Mezclaremos pilas en la planta de compost para aprovecharlas.', true, 'Las pilas son residuos peligrosos: contaminan el compost.'],
      ], 'Una planta bien diseñada separa lo que se trata de lo que contamina.', { d: 2 }),
      comp('Completá.', 'Lo que una planta de clasificación no puede recuperar se llama [rechazo]; el tratamiento sin oxígeno que produce biogás es la [biodigestión]; y el compost final pesa entre un [tercio] y la mitad de lo que entró.', ['residuo', 'incineración', 'doble'], 'Tres ideas clave sobre las plantas de tratamiento.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Relleno sanitario y cierre de basurales', 'Cómo se construye y se opera un relleno sanitario, y cómo se cierra un basural sin dejar a nadie afuera.', [
      teoria('Un relleno sanitario por dentro', [
        'Un relleno sanitario es una obra de ingeniería. El fondo se impermeabiliza con capas de arcilla compactada y membranas plásticas para que los líquidos no lleguen a las napas. Esos líquidos, llamados lixiviados, se captan con cañerías y se tratan. Los residuos se compactan en celdas y se cubren cada día con tierra. Caños verticales captan el biogás, que se quema o se usa para generar energía. Pozos de monitoreo controlan el agua subterránea durante décadas, incluso después del cierre.',
      ]),
      par('Uní cada componente del relleno con su función.', [ // e1
        ['Impermeabilización del fondo', 'Evitar que los líquidos lleguen a las napas'],
        ['Captación de lixiviados', 'Recoger los líquidos para tratarlos'],
        ['Cobertura diaria', 'Evitar olores, vectores y voladuras'],
        ['Captación de biogás', 'Evitar la liberación de metano'],
        ['Pozos de monitoreo', 'Controlar el agua subterránea'],
      ], 'Cada componente previene un impacto distinto del basural.', { d: 2 }),
      cad('Armá la cadena de cómo se forma el lixiviado.', [ // e2
        'La lluvia cae sobre los residuos',
        'El agua se filtra entre la basura',
        'Arrastra sustancias de los residuos en descomposición',
        'Se acumula un líquido contaminante en el fondo',
        'En un relleno se capta y se trata; en un basural llega a las napas',
      ], ['El lixiviado es agua potable filtrada'], 'La diferencia entre un relleno y un basural está, en buena parte, en qué pasa con ese líquido.', { d: 2 }),
      numv(3, (i) => { // e3
        const [vol, t, dens] = [[1000000, 200, 0.8], [500000, 100, 0.9], [2000000, 400, 1]][i];
        const anos = Math.round((vol * dens) / (t * 365) * 10) / 10;
        return {
          enunciado: `Un relleno tiene ${vol.toLocaleString('es-AR')} m³ de capacidad. Recibe ${t} toneladas por día, que se compactan a ${dens.toLocaleString('es-AR')} t/m³. ¿Cuántos años de vida útil tiene? Redondeá a un decimal.`,
          valor: anos,
          unidad: 'años',
          dec: 1,
          tol: 0.1,
          explicacion: `Capacidad en toneladas: ${vol.toLocaleString('es-AR')} × ${dens.toLocaleString('es-AR')} = ${(vol * dens).toLocaleString('es-AR')} t. Por año entran ${(t * 365).toLocaleString('es-AR')} t. Vida útil ≈ ${anos.toLocaleString('es-AR')} años. Cada tonelada que no llega al relleno alarga su vida.`,
          ctx: `${vol} m³; ${t} t por día; ${dens} t/m³.`,
        };
      }, { d: 3 }),
      teoria('Cerrar un basural', [
        'Cerrar un basural no es solo poner un candado. Hay que tener antes un destino alternativo para los residuos (un relleno o un sistema regional), caracterizar el sitio, cubrir y sellar los residuos, controlar los gases y los líquidos, monitorear el agua, y después recuperar el terreno. Y muchas veces en el basural trabajan familias que recuperan materiales: un cierre justo incluye un plan para que puedan pasar a trabajar en plantas, cooperativas o nuevas actividades.',
      ]),
      ord('Ordená los pasos para cerrar un basural.', [ // e4
        'Garantizar un destino alternativo para los residuos',
        'Acordar un plan con las familias que trabajan en el basural',
        'Dejar de recibir residuos',
        'Cubrir, sellar y controlar gases y líquidos',
        'Monitorear el agua y recuperar el terreno',
      ], 'Sin destino alternativo, el basural reaparece en otro lugar; sin plan social, el cierre deja familias sin ingresos.', { d: 3 }),
      op('¿Qué pasa si se cierra un basural sin un destino alternativo para los residuos?', [ // e5
        'Aparecen basurales nuevos en otros lugares',
        'Los residuos dejan de generarse',
        ['Los vecinos llevan la basura a un relleno lejano por su cuenta', 'Es poco probable: sin un sistema, la basura termina en otro terreno.'],
        'El basural se limpia solo',
      ], 'Cerrar un basural es parte de un sistema: primero el destino, después el cierre.', { d: 2 }),
      clas('¿Esta característica es de un relleno sanitario o de un basural a cielo abierto?', { // e6
        'Relleno sanitario': ['Fondo impermeabilizado', 'Cobertura diaria con tierra', 'Monitoreo del agua subterránea'],
        'Basural a cielo abierto': ['Quemas frecuentes', 'Lixiviados que llegan a las napas', 'Animales y personas sin protección entre los residuos'],
      }, 'Lo viste en la base de la rama: el mismo residuo, dos destinos muy distintos.', { d: 1 }),
      vf('Un relleno sanitario deja de necesitar control apenas se cierra.', false, 'Los residuos siguen generando lixiviados y biogás durante décadas: hay que mantener el control y el monitoreo mucho después del cierre.', { // e7
        razones: ['+Porque sigue generando lixiviados y biogás por décadas', '-Porque los residuos desaparecen al cerrarlo', '-Porque los rellenos no generan gases'],
        d: 2,
      }),
      mult('¿Qué incluye un cierre justo de un basural? Marcá todo.', [ // e8
        '+Un destino alternativo para los residuos',
        '+Un plan de trabajo para las familias recuperadoras',
        '+Control de gases y líquidos',
        '+Monitoreo del agua',
        '-Echar a las familias sin ninguna alternativa',
      ], 'Un cierre ambiental que ignora a las personas termina fracasando.', { d: 1 }),
      det('Leé este plan municipal y marcá lo que conviene corregir.', [ // e9
        ['Primero habilitaremos el relleno regional y después cerraremos el basural.', false],
        ['Cerraremos el basural mañana, aunque no haya otro destino.', true, 'Sin destino alternativo aparecen nuevos basurales.'],
        ['Las familias que trabajan en el basural se sumarán a la planta de clasificación.', false],
        ['El relleno no necesitará impermeabilización porque el suelo es arcilloso.', true, 'La impermeabilización con membranas y arcilla compactada es esencial.'],
      ], 'Un buen plan combina ingeniería, secuencia correcta e inclusión.', { d: 2 }),
      comp('Completá.', 'El líquido que se forma cuando el agua atraviesa los residuos se llama [lixiviado]; el gas rico en metano que se capta en un relleno es el [biogás]; y antes de cerrar un basural hace falta un destino [alternativo].', ['néctar', 'oxígeno', 'decorativo'], 'Tres claves de la disposición final y el cierre de basurales.', { d: 1 }),
      numv(3, (i) => { // e11
        const [t, red] = [[200, 30], [100, 40], [400, 25]][i];
        return {
          enunciado: `Un relleno recibe ${t} toneladas por día. Si un programa de compostaje y reciclaje reduce en un ${red} % lo que llega, ¿cuántas toneladas por día deja de recibir?`,
          valor: (t * red) / 100,
          unidad: 'toneladas',
          explicacion: `${t} × ${red} % = ${(t * red) / 100} toneladas por día menos. Eso alarga la vida útil del relleno y reduce su biogás y sus lixiviados.`,
          ctx: `${t} t por día; reducción del ${red} %.`,
        };
      }, { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: gestión integral de residuos', 'Sistema, caracterización, separación, plantas, relleno y cierre de basurales, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el plan GIRSU de Villa Serena', 'Un municipio de 60.000 habitantes tiene un basural a cielo abierto y quiere un sistema integral. Con los datos, armá el plan.', [
      teoria('La situación', [
        'Villa Serena tiene 60.000 habitantes que generan 1,15 kg de residuos por persona por día. Un estudio de caracterización mostró 45 % de orgánicos, 30 % de reciclables secos y 25 % de resto. Hoy todo va a un basural donde trabajan 40 familias recuperadoras. A 50 km hay un relleno sanitario regional que podría recibir sus residuos, y el municipio puede instalar una planta de clasificación y una de compostaje.',
      ]),
      num('¿Cuántas toneladas de residuos por día genera Villa Serena?', 69, 'toneladas', '60.000 × 1,15 kg = 69.000 kg = 69 toneladas por día.', { ctx: '60.000 habitantes; 1,15 kg por persona por día.', d: 1 }),
      num('¿Cuántas toneladas por día de orgánicos podría tratar la planta de compostaje si llegaran todos separados? Redondeá a un decimal.', 31.1, 'toneladas', '69 × 45 % ≈ 31,1 toneladas por día. En la práctica, la participación no será total al principio.', { ctx: '69 t por día; 45 % orgánicos.', dec: 1, d: 1 }),
      num('Si se compostara el 60 % de los orgánicos y se recuperara el 50 % de los secos, ¿cuántas toneladas por día seguirían yendo al relleno? Redondeá a un decimal.', 40, 'toneladas', 'Orgánicos: 69 × 45 % = 31,05 t, y se compostan 18,63 t. Secos: 69 × 30 % = 20,7 t, y se recuperan 10,35 t. Al relleno: 69 − 18,63 − 10,35 ≈ 40,0 t por día, un 42 % menos que hoy.', { ctx: '69 t; 60 % de 31,05 t orgánicas y 50 % de 20,7 t secas.', dec: 1, tol: 0.1, d: 4 }),
      ord('Ordená las etapas del plan.', [ // e4
        'Acordar el envío de residuos al relleno regional',
        'Acordar con las 40 familias su incorporación a la planta de clasificación',
        'Lanzar la separación en origen con tres fracciones',
        'Poner en marcha las plantas de clasificación y compostaje',
        'Cerrar y sanear el basural',
      ], 'Primero destino y acuerdo social; después separación y plantas; al final, el cierre del basural.', { d: 3 }),
      mult('¿Qué indicadores debería medir el municipio cada año? Marcá todos.', [ // e5
        '+Toneladas enviadas al relleno',
        '+Participación y contaminación de la separación',
        '+Toneladas de compost y de reciclables vendidos',
        '+Ingresos de las familias recuperadoras',
        '-Cantidad de bolsas de colores entregadas, sin más datos',
      ], 'Medir resultados, no solo actividades, permite corregir el plan.', { d: 2 }),
      vf('Como el relleno regional está a 50 km, conviene seguir usando el basural local.', false, 'El basural contamina el agua, el aire y la salud. Con una estación de transferencia, llevar los residuos a un relleno regional suele ser la opción responsable.', { // e6
        razones: ['+Porque el basural contamina y la transferencia lo resuelve', '-Porque 50 km es imposible de recorrer', '-Porque los basurales no contaminan'],
        d: 2,
      }),
      det('El concejo revisa el plan. Marcá lo que conviene corregir.', [ // e7
        ['Separaremos en tres fracciones: orgánicos, secos y resto.', false],
        ['Las 40 familias recuperadoras quedarán afuera cuando cierre el basural.', true, 'Un cierre justo las incorpora a la planta o a cooperativas.'],
        ['Mediremos cada año cuánto va al relleno.', false],
        ['Cerraremos el basural antes de tener acordado el relleno regional.', true, 'Sin destino alternativo aparecen nuevos basurales.'],
      ], 'Un plan GIRSU exitoso combina números, secuencia correcta e inclusión social.', { d: 3 }),
    ]),
  ],
});
