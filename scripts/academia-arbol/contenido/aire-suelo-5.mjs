import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// AIRE Y SUELO 5 — Tierras secas y desertificación.
// Qué son las tierras secas, cómo se degradan, qué es una sequía y qué la
// agrava, cómo se usa el agua donde falta, y cómo se restauran. Retoma el
// suelo vivo y la erosión (aire-suelo-2), el clima que cambia (aire-suelo-4),
// el reparto del agua en una cuenca (agua-5) y el sobrepastoreo (animales-5).

export default unidad({
  slug: 'aire-suelo-5',
  rama: 'aire_suelo',
  orden: 5,
  nivel: 3,
  requiereTronco: 3,
  titulo: 'Tierras secas y desertificación',
  bajada: 'El 70 % de Argentina es tierra seca: cómo se mide la aridez, por qué se degrada un campo, qué deja una sequía y cómo se recupera lo perdido.',
  objetivos: [
    'Calcular e interpretar el índice de aridez',
    'Distinguir aridez, sequía y desertificación',
    'Explicar las causas y señales de la desertificación, con el caso patagónico',
    'Analizar el uso del agua en oasis, secanos y sistemas de cosecha de lluvia',
    'Aplicar la jerarquía de la neutralidad en la degradación de las tierras: evitar, reducir y revertir',
  ],
  repasa: ['aire-suelo-2', 'aire-suelo-4', 'agua-5', 'animales-5'],
  fuentes: ['unccd-convencion', 'unccd-aridez-2024', 'unccd-ndt', 'unccd-gran-muralla', 'ar-desertificacion', 'ley-24701-desertificacion', 'inta-maras', 'inta-observatorio-desertificacion', 'bcr-sequia-2023', 'wmo-la-nina-2023', 'dgi-oasis-mendoza', 'fao-suelos-degradacion', 'ipcc-srccl', 'onu-ods'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Tierras secas', 'Qué son, cómo se mide la aridez y por qué no son tierras "muertas".', [
      teoria('Más agua se podría ir que la que cae', [
        'Una tierra seca no se define solo por la poca lluvia, sino por el balance entre la lluvia y la evapotranspiración potencial: el agua que podrían evaporar el suelo y transpirar las plantas si la hubiera. El índice de aridez divide la lluvia anual por esa evapotranspiración potencial. Si da menos de 0,65, la zona es tierra seca.',
        'Según ese índice, las tierras secas se dividen en hiperáridas (menos de 0,05), áridas (de 0,05 a 0,2), semiáridas (de 0,2 a 0,5) y subhúmedas secas (de 0,5 a 0,65).',
      ]),
      numv(3, (i) => { // e1
        const [lluvia, etp] = [[200, 1400], [450, 1500], [800, 1250]][i];
        const ia = Math.round((lluvia / etp) * 100) / 100;
        return {
          enunciado: `En un lugar llueven ${lluvia} mm por año y la evapotranspiración potencial es de ${etp.toLocaleString('es-AR')} mm. ¿Cuál es su índice de aridez? Redondeá a dos decimales.`,
          valor: ia,
          unidad: '',
          dec: 2,
          tol: 0.01,
          explicacion: `${lluvia} ÷ ${etp.toLocaleString('es-AR')} ≈ ${ia.toLocaleString('es-AR')}. ${ia < 0.2 ? 'Menos de 0,2: zona árida.' : ia < 0.5 ? 'Entre 0,2 y 0,5: zona semiárida.' : 'Entre 0,5 y 0,65: zona subhúmeda seca.'}`,
          ctx: `Lluvia de ${lluvia} mm; evapotranspiración potencial de ${etp} mm.`,
        };
      }, { d: 2 }),
      clas('Clasificá cada lugar según su índice de aridez.', { // e2
        'Árido (0,05 a 0,2)': ['Índice de 0,10', 'Índice de 0,18'],
        'Semiárido (0,2 a 0,5)': ['Índice de 0,25', 'Índice de 0,45'],
        'Subhúmedo seco (0,5 a 0,65)': ['Índice de 0,55', 'Índice de 0,62'],
      }, 'Cuanto más bajo el índice, más seca la zona: la lluvia cubre una parte menor de lo que podría evaporarse.', { d: 2 }),
      op('¿Qué compara el índice de aridez?', [ // e3
        'La lluvia con lo que podría evaporarse y transpirarse',
        'La temperatura media del verano con la del invierno',
        ['La cantidad de ríos con la cantidad de lagos', 'Mide el balance entre lluvia y demanda de agua de la atmósfera.'],
        'La altura del lugar con la distancia al mar',
      ], 'Un lugar con 600 mm de lluvia puede ser seco si hace mucho calor y viento, y húmedo si es fresco.', { d: 2 }),
      teoria('Casi dos quintos del planeta', [
        'Según el informe de 2024 de la Convención de las Naciones Unidas de Lucha contra la Desertificación (UNCCD), las tierras secas cubren el 40,6 % de la superficie terrestre, sin contar la Antártida, y en ellas viven 2.300 millones de personas. En Argentina, según la Secretaría de Ambiente, ocupan el 70 % del territorio: la Puna, el Monte, la estepa patagónica, el Chaco seco, el Espinal y el oeste de la región pampeana.',
        'No son tierras muertas: tienen plantas y animales adaptados a la escasez de agua, y de ellas salen buena parte del ganado, la fruta y el vino del país.',
      ], { destacado: { valor: '70 %', texto: 'del territorio argentino son tierras secas, según la Secretaría de Ambiente de la Nación.' } }),
      est('Estimá qué porcentaje de la superficie terrestre, sin la Antártida, son tierras secas.', 41, { min: 0, max: 100, paso: 1, unidad: '%' }, 'El 40,6 %, según la UNCCD (2024): casi dos de cada cinco hectáreas del planeta.', { d: 2 }),
      par('Uní cada región seca de Argentina con su rasgo principal.', [ // e4
        ['Puna', 'Altiplano frío y seco, a más de 3.000 m'],
        ['Monte', 'Arbustales de jarilla en el oeste del país'],
        ['Estepa patagónica', 'Pastos duros y arbustos bajos bajo viento constante'],
        ['Chaco seco', 'Bosques de quebracho y algarrobo con lluvias de verano'],
      ], 'Tierras secas muy distintas entre sí, cada una con su vegetación y sus usos.', { d: 2 }),
      vf('Una tierra seca es lo mismo que un desierto sin vida.', false, 'Las tierras secas incluyen estepas, arbustales, pastizales y bosques secos, con mucha biodiversidad adaptada. Los desiertos hiperáridos son solo una parte.', {
        razones: ['+Porque incluyen estepas, arbustales y bosques secos con mucha vida', '-Porque en las tierras secas nunca llueve', '-Porque los desiertos siempre tienen bosques'],
        d: 1,
      }),
      mult('¿Qué caracteriza a las tierras secas? Marcá todo.', [ // e5
        '+La demanda de evaporación supera a la lluvia',
        '+Su vegetación está adaptada a la escasez de agua',
        '+Sus suelos se forman y recuperan muy lento',
        '+Viven en ellas miles de millones de personas',
        '-No tienen ninguna producción agropecuaria',
      ], 'Frágiles, productivas y habitadas: por eso su cuidado importa tanto.', { d: 1 }),
      teoria('El planeta se está secando', [
        'La UNCCD también encontró que, en los treinta años previos a 2020, el 77,6 % de las tierras del planeta tuvo condiciones más secas que en los treinta años anteriores, y que las tierras secas se expandieron unos 4,3 millones de km². El informe señala al cambio climático causado por las personas como el principal motor de ese cambio.',
      ]),
      num('Las tierras secas se expandieron unos 4,3 millones de km². Si Argentina continental mide unos 2,8 millones de km², ¿cuántas veces su superficie es esa expansión? Redondeá a un decimal.', 1.5, 'veces', '4,3 ÷ 2,8 ≈ 1,5: en tres décadas se volvió tierra seca una superficie de una vez y media la Argentina continental.', { ctx: '4,3 millones de km² frente a 2,8 millones de km².', dec: 1, tol: 0.1, d: 2 }),
      det('Leé este texto de un folleto turístico y marcá lo equivocado.', [ // e6
        ['La Puna es una de las regiones más secas del país.', false],
        ['En las tierras secas no vive casi ningún animal.', true, 'Tienen fauna adaptada, como guanacos, vicuñas, maras y muchas aves.'],
        ['Buena parte del vino argentino se produce en oasis de tierras secas.', false],
        ['Una zona es seca solo si llueven menos de 100 mm por año.', true, 'Se define por el balance entre lluvia y evapotranspiración potencial.'],
      ], 'Las tierras secas son diversas, habitadas y productivas.', { d: 2 }),
      comp('Completá.', 'La lluvia dividida por la evapotranspiración potencial es el índice de [aridez]; si da menos de [0,65] la zona es tierra seca; y en Argentina las tierras secas ocupan el [70] % del territorio.', ['humedad', '1,5', '7'], 'Tres números y un concepto para ubicar las tierras secas.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('La desertificación', 'Cuando una tierra seca se degrada: qué es, qué la causa y cómo se ve en un campo patagónico.', [
      teoria('Qué es y qué no es', [
        'La Convención de lucha contra la desertificación la define como la degradación de las tierras en zonas áridas, semiáridas y subhúmedas secas, causada por factores como las variaciones climáticas y las actividades humanas. No es el avance de dunas desde un desierto: es la pérdida de la capacidad de un campo de producir y sostener vida, con menos cobertura vegetal, suelo erosionado, menos agua que infiltra y, a veces, más sal.',
        'Argentina aprobó esa Convención en 1996, por la ley 24.701.',
      ]),
      vf('La desertificación es el avance de los desiertos de arena sobre las tierras vecinas.', false, 'Es la degradación de tierras secas por el clima y las actividades humanas. Puede pasar lejos de cualquier desierto, en un campo sobrepastoreado o desmontado.', {
        razones: ['+Porque es la degradación de tierras secas, esté o no cerca de un desierto', '-Porque solo ocurre en el Sahara', '-Porque la desertificación mejora los suelos'],
        d: 2,
      }),
      teoria('Las causas', [
        'Según la Secretaría de Ambiente, las principales causas en Argentina son el sobrepastoreo, la deforestación, la agricultura no sostenible, los incendios repetidos, las especies invasoras, la actividad petrolera y el uso inadecuado del suelo y el agua, agravadas por eventos extremos. Un informe del INTA estimó que la erosión en zonas secas afectaba 60 millones de hectáreas y que se sumaban unas 650.000 hectáreas por año.',
      ]),
      mult('¿Qué actividades pueden causar desertificación en una tierra seca? Marcá todas.', [ // e1
        '+Más animales de los que el pastizal puede sostener',
        '+Desmontar el bosque seco',
        '+Quemar la vegetación una y otra vez',
        '+Regar sin drenaje hasta salinizar el suelo',
        '-Rotar los potreros y dejar descansar el pasto',
      ], 'Casi todas las causas tienen algo en común: dejan el suelo desnudo o alteran su agua.', { d: 1 }),
      cad('Armá la cadena de cómo se degrada una tierra seca.', [ // e2
        'Se pierde la cobertura vegetal por sobrepastoreo o desmonte',
        'El suelo queda desnudo al sol y al viento',
        'Se pierden la capa fértil y la materia orgánica',
        'Infiltra menos agua y crecen menos plantas',
        'El campo produce menos y se degrada más',
      ], ['Un suelo desnudo guarda más humedad'], 'Es un círculo vicioso: la degradación genera más degradación.', { d: 2 }),
      numv(3, (i) => { // e3
        const anios = [10, 20, 30][i];
        return {
          enunciado: `Si a 60 millones de hectáreas erosionadas se sumaran 650.000 hectáreas por año, ¿cuántos millones de hectáreas habría después de ${anios} años?`,
          valor: 60 + 0.65 * anios,
          unidad: 'millones de hectáreas',
          dec: 1,
          explicacion: `650.000 × ${anios} = ${(650000 * anios).toLocaleString('es-AR')} ha = ${(0.65 * anios).toLocaleString('es-AR')} millones; 60 + ${(0.65 * anios).toLocaleString('es-AR')} = ${(60 + 0.65 * anios).toLocaleString('es-AR')} millones de hectáreas, si el ritmo informado por el INTA se mantuviera.`,
          ctx: `60 millones de ha más 650.000 ha por año, durante ${anios} años.`,
        };
      }, { d: 2 }),
      teoria('El caso patagónico', [
        'En la estepa patagónica, la ganadería ovina extensiva se expandió desde fines del siglo XIX y, durante décadas, las cargas superaron lo que los pastizales podían sostener. Las ovejas comen primero los pastos más tiernos; el pastizal pierde cobertura, avanzan los arbustos y aparece suelo desnudo que el viento arrastra. En los casos más graves queda un "pavimento" de piedras donde antes había pasto, y muchos campos terminaron abandonados.',
        'Para seguir la situación, el INTA creó la red MARAS: 380 monitores desde La Pampa hasta Tierra del Fuego donde se mide periódicamente el estado de la vegetación y del suelo.',
      ]),
      ord('Ordená las etapas de degradación de un pastizal patagónico sobrepastoreado.', [ // e4
        'Pastizal con buena cobertura de pastos',
        'Las ovejas comen primero los pastos más tiernos',
        'Aumentan los arbustos y el suelo desnudo',
        'El viento arrastra el suelo y forma pequeños médanos',
        'Queda un pavimento de piedras donde había pasto',
      ], 'La degradación avanza por etapas: cuanto antes se corrige la carga, más fácil es recuperar el campo.', { d: 2 }),
      rank('Ordená estos lotes de la estepa del mejor conservado al más degradado.', [ // e5
        ['Pastos y arbustos cubren el 60 % del suelo', 'mejor'],
        ['Cubren el 40 %, con algunos claros', 'bueno'],
        ['Cubren el 20 %, con suelo suelto', 'malo'],
        ['Cubren el 5 %, con piedras en la superficie', 'peor'],
      ], 'La cobertura vegetal es uno de los indicadores más usados para medir la desertificación, como en los monitores MARAS.', { d: 1, extremos: ['Mejor conservado', 'Más degradado'] }),
      par('Uní cada señal en el campo con lo que indica.', [ // e6
        ['Pedestales de suelo al pie de las matas', 'Erosión que se llevó el suelo alrededor'],
        ['Costra blanca en la superficie', 'Acumulación de sales'],
        ['Médanos que tapan los alambrados', 'Erosión eólica severa'],
        ['Cárcavas en las laderas', 'Erosión por el agua'],
      ], 'Aprender a leer el campo permite detectar la degradación antes de que sea grave.', { d: 2 }),
      op('¿Por qué la desertificación es tan difícil de revertir?', [ // e7
        'El suelo perdido tarda siglos en volver a formarse',
        'Porque las plantas de zonas secas no pueden reproducirse',
        ['Porque la ley prohíbe restaurar campos degradados', 'No lo prohíbe: la restauración se promueve, pero es lenta.'],
        'Porque la lluvia en zonas secas es siempre ácida',
      ], 'Por eso lo más barato y efectivo es evitar la degradación antes de que empiece.', { d: 2 }),
      det('Leé este informe de un técnico y marcá lo que conviene corregir.', [ // e8
        ['La cobertura vegetal del lote bajó del 45 % al 30 % en diez años.', false],
        ['Como el campo es grande, podemos aumentar la carga de ovejas sin problema.', true, 'La superficie no importa si el pastizal ya está degradado: hay que ajustar la carga.'],
        ['Hay pedestales al pie de las matas, señal de erosión.', false],
        ['La desertificación solo depende del clima; el manejo no influye.', true, 'Las actividades humanas son una causa central.'],
      ], 'Un buen diagnóstico mide, interpreta las señales y reconoce el papel del manejo.', { d: 2 }),
      comp('Completá.', 'La desertificación es la [degradación] de tierras secas; en la Patagonia, una causa central fue el [sobrepastoreo]; y la red de monitoreo del INTA se llama [MARAS].', ['inundación', 'riego', 'SUBE'], 'Tres claves para entender la desertificación en Argentina.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Sequías', 'Un déficit de lluvia que llega y se va, pero deja huellas: tipos de sequía, La Niña y la campaña 2022-2023.', [
      teoria('Aridez, sequía y desertificación', [
        'Son tres cosas distintas. La aridez es una condición estable del clima, que cambia en escalas de tiempo muy largas. La sequía, en cambio, es un período anómalo y más corto de falta de agua, que puede ocurrir tanto en zonas secas como en zonas húmedas. Y la desertificación es la degradación de las tierras secas. Una sequía no es desertificación, pero si encuentra un campo sobrepastoreado o desmontado, puede acelerarla.',
      ]),
      clas('¿Es un caso de aridez, de sequía o de desertificación?', { // e1
        'Aridez': ['En Mendoza llueve poco todos los años', 'La Puna tiene un clima seco desde hace milenios'],
        'Sequía': ['En 2022-2023 llovió mucho menos de lo normal en la región pampeana', 'Un verano sin lluvias en una zona normalmente húmeda'],
        'Desertificación': ['Un campo sobrepastoreado pierde su cobertura y su suelo', 'Un monte desmontado se vuelve un peladar con médanos'],
      }, 'Distinguirlas importa: cada una pide respuestas distintas.', { d: 2 }),
      teoria('Una sequía, cuatro caras', [
        'Las sequías avanzan en cascada. Primero llueve menos de lo normal (sequía meteorológica). Después falta humedad en el suelo para los cultivos y los pastos (sequía agrícola). Si sigue, bajan los ríos, los embalses y las napas (sequía hidrológica). Y al final se sienten los efectos en la economía y en la vida de las personas (sequía socioeconómica).',
      ]),
      ord('Ordená cómo avanza una sequía prolongada.', [ // e2
        'Llueve menos de lo normal durante meses',
        'Falta humedad en el suelo para los cultivos',
        'Bajan los ríos, los embalses y las napas',
        'Caen las cosechas, los ingresos y el empleo',
      ], 'Cuanto más dura la falta de lluvia, más profundo llega el impacto.', { d: 1 }),
      teoria('La Niña y la campaña 2022-2023', [
        'Entre 2020 y 2023 hubo tres años seguidos con La Niña, un enfriamiento del océano Pacífico tropical que suele reducir las lluvias en la región pampeana. Según la Organización Meteorológica Mundial, fue apenas la tercera vez desde 1950 que La Niña duró tres años seguidos. La campaña 2022-2023 se hizo bajo las condiciones más secas en décadas: según la Bolsa de Comercio de Rosario, la proyección de cosecha de soja, trigo y maíz cayó en 50 millones de toneladas, con un costo de más de 14.140 millones de dólares para los productores.',
      ], { destacado: { valor: 'US$ 14.140 millones', texto: 'le costó la sequía 2022-2023 a los productores de soja, trigo y maíz, según la Bolsa de Comercio de Rosario.' } }),
      cad('Armá la cadena de cómo La Niña puede afectar la economía argentina.', [ // e3
        'El Pacífico tropical se enfría (La Niña)',
        'Llueve menos en la región pampeana',
        'Los cultivos no tienen agua suficiente',
        'Caen las cosechas y las exportaciones',
        'Bajan los ingresos del campo y del país',
      ], ['La Niña aumenta siempre las lluvias en la llanura'], 'Un fenómeno del océano, a miles de kilómetros, puede definir una cosecha.', { d: 2 }),
      num('Si la sequía costó 14.140 millones de dólares a los productores y en Argentina viven unos 47 millones de personas, ¿cuántos dólares representa por habitante? Redondeá al entero.', 301, 'dólares', '14.140 millones ÷ 47 millones ≈ 301 dólares por habitante, solo en pérdidas de los productores de tres cultivos.', { ctx: 'US$ 14.140 millones; 47 millones de habitantes.', tol: 2, d: 2 }),
      est('Estimá en cuántos millones de toneladas cayó la proyección de cosecha de soja, trigo y maíz por la sequía 2022-2023.', 50, { min: 0, max: 150, paso: 5, unidad: 'millones de t' }, 'En unos 50 millones de toneladas, según la Bolsa de Comercio de Rosario: una de las peores campañas de las últimas décadas.', { d: 2 }),
      vf('Las sequías también pueden ocurrir en zonas húmedas.', true, 'La sequía es una anomalía: llueve menos de lo normal para ese lugar. La región pampeana, que no es árida, tuvo una sequía grave en 2022-2023.', {
        razones: ['+Porque la sequía es llover menos de lo normal para ese lugar', '-Porque en las zonas húmedas llueve siempre igual', '-Porque la sequía solo ocurre en desiertos'],
        d: 1,
      }),
      teoria('Prepararse', [
        'Las sequías no se pueden evitar, pero sí reducir sus daños. En el campo ayudan la siembra directa y los cultivos de cobertura, que guardan humedad en el suelo; las reservas de forraje; ajustar las fechas de siembra y la carga animal según los pronósticos; diversificar la producción; y los seguros agrícolas. A escala de país, los sistemas de monitoreo y alerta temprana permiten actuar antes. En las ciudades, reducir las pérdidas de agua y tener reservas.',
      ]),
      numv(3, (i) => { // e4
        const [reserva, uso] = [[120, 6], [90, 5], [150, 6]][i];
        return {
          enunciado: `El suelo de un lote guarda ${reserva} mm de agua útil y el cultivo consume ${uso} mm por día. Si no llueve, ¿cuántos días dura esa reserva?`,
          valor: reserva / uso,
          unidad: 'días',
          explicacion: `${reserva} ÷ ${uso} = ${reserva / uso} días. Un suelo con más materia orgánica y cobertura guarda más agua y aguanta más tiempo sin lluvia.`,
          ctx: `Reserva de ${reserva} mm; consumo de ${uso} mm por día.`,
        };
      }, { d: 2 }),
      mult('¿Qué medidas preparan a un campo para la próxima sequía? Marcá todas.', [ // e5
        '+Mantener el suelo cubierto con rastrojos o cultivos de cobertura',
        '+Guardar reservas de forraje',
        '+Ajustar la carga animal según los pronósticos',
        '+Contratar un seguro agrícola',
        '-Arar varias veces para airear el suelo en plena seca',
      ], 'El suelo cubierto y con materia orgánica es el primer seguro contra la sequía.', { d: 2 }),
      det('Leé esta nota de un diario y marcá las afirmaciones equivocadas.', [ // e6
        ['La campaña 2022-2023 sufrió una de las peores sequías en décadas.', false],
        ['La sequía convirtió a la región pampeana en un desierto para siempre.', true, 'Una sequía es temporal; no es lo mismo que la aridez.'],
        ['La Niña suele reducir las lluvias en la región pampeana.', false],
        ['Como las sequías son naturales, no hay nada que se pueda hacer.', true, 'Hay muchas formas de reducir sus daños y prepararse.'],
      ], 'Las sequías son temporales, pero sus daños dependen mucho de cómo nos preparamos.', { d: 2 }),
      comp('Completá.', 'Un período anómalo de falta de agua es una [sequía]; cuando falta humedad para los cultivos se habla de sequía [agrícola]; y el enfriamiento del Pacífico que suele secar la llanura pampeana se llama La [Niña].', ['helada', 'urbana', 'Nube'], 'Tres conceptos para entender y anticipar las sequías.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Agua en tierras secas', 'Oasis y secanos, la trampa de la sal y la cosecha de lluvia.', [
      teoria('Oasis y secano', [
        'En Mendoza, el agua de deshielo de la cordillera baja por los ríos y se distribuye por canales y acequias. Según el Departamento General de Irrigación, los oasis irrigados ocupan entre el 2,5 % y el 4,8 % del territorio provincial, pero alojan casi el 95 % de la población. Fuera de los oasis está el secano, donde viven familias de puesteros que crían cabras con agua de pozos, y donde el agua de los ríos casi no llega.',
        'Cuando se usa casi toda el agua de un río aguas arriba, aguas abajo se sienten las consecuencias. Las Lagunas de Guanacache, entre Mendoza, San Juan y San Luis, humedales de enorme valor para las comunidades huarpes, se secaron en gran parte al desviarse el agua de los ríos para riego.',
      ], { destacado: { valor: 'casi 95 %', texto: 'de la población de Mendoza vive en oasis irrigados que ocupan menos del 5 % del territorio provincial.' } }),
      clas('¿Describe a un oasis irrigado o al secano?', { // e1
        'Oasis irrigado': ['Viñedos regados por acequias', 'Ciudades con árboles regados', 'Agua de ríos distribuida por canales'],
        'Secano': ['Puestos de cabras con agua de pozo', 'Arbustales de jarilla sin riego', 'Lluvia como única fuente de agua superficial'],
      }, 'Oasis y secano conviven en la misma provincia, con acceso al agua muy desigual.', { d: 1 }),
      op('¿Por qué se secaron en gran parte las Lagunas de Guanacache?', [ // e2
        'Porque el agua de los ríos se desvió aguas arriba para riego',
        'Porque las comunidades huarpes usaron toda el agua de las lagunas',
        ['Porque dejó de nevar por completo en la cordillera', 'Nieva menos en algunos años, pero la causa principal fue el desvío del agua.'],
        'Porque el suelo de la zona absorbe toda el agua de lluvia',
      ], 'Lo que se hace aguas arriba de una cuenca define lo que queda aguas abajo, como viste con las cuencas.', { d: 2 }),
      teoria('La trampa de la sal', [
        'Regar sin un buen drenaje puede hacer subir la napa freática. Cuando el agua llega cerca de la superficie, se evapora y deja las sales que traía: el suelo se saliniza, aparecen costras blancas y los cultivos ya no crecen. Es una forma de desertificación que aparece justo donde más se invirtió en agua. Se previene regando la cantidad justa, con buenos drenajes y controlando la calidad del agua.',
      ]),
      cad('Armá la cadena de cómo el riego sin drenaje saliniza un suelo.', [ // e3
        'Se riega más de lo que el cultivo necesita',
        'El agua sobrante infiltra y hace subir la napa',
        'La napa queda cerca de la superficie',
        'El agua se evapora y deja sus sales',
        'El suelo se saliniza y los cultivos no crecen',
      ], ['La evaporación se lleva la sal junto con el agua'], 'El agua se va, la sal se queda: por eso el drenaje es tan importante como el riego.', { d: 2 }),
      vf('La salinización del suelo solo ocurre cerca del mar.', false, 'También ocurre tierra adentro, por el riego sin drenaje o por napas salinas que suben. Es un problema frecuente en oasis de zonas secas.', {
        razones: ['+Porque el riego sin drenaje puede salinizar suelos lejos del mar', '-Porque el agua de mar es la única que tiene sales', '-Porque la sal viene siempre de la lluvia'],
        d: 1,
      }),
      teoria('Cosechar la lluvia', [
        'Donde no hay ríos ni buenos acuíferos, se puede juntar el agua de lluvia. La cuenta es simple: 1 mm de lluvia sobre 1 m² de techo son 1 litro de agua. Con canaletas se lleva el agua de los techos a un aljibe o cisterna tapada; en el campo, las represas o tajamares juntan el agua que escurre para el ganado. En el Chaco semiárido, muchas familias rurales dependen de estos sistemas para tener agua todo el año.',
      ]),
      numv(3, (i) => { // e4
        const [techo, lluvia] = [[60, 500], [40, 700], [80, 300]][i];
        const litros = techo * lluvia * 0.8;
        return {
          enunciado: `Un techo de ${techo} m² recibe ${lluvia} mm de lluvia por año. Si se aprovecha el 80 % del agua, ¿cuántos litros se pueden juntar por año?`,
          valor: litros,
          unidad: 'litros',
          explicacion: `${techo} m² × ${lluvia} mm = ${(techo * lluvia).toLocaleString('es-AR')} litros; × 0,8 = ${litros.toLocaleString('es-AR')} litros. Parte del agua se pierde por salpicaduras, evaporación y el lavado de las primeras lluvias.`,
          ctx: `Techo de ${techo} m²; ${lluvia} mm por año; 80 % aprovechable.`,
        };
      }, { d: 2 }),
      numv(3, (i) => { // e5
        const [cisterna, uso] = [[16000, 50], [16000, 80], [20000, 125]][i];
        return {
          enunciado: `Una cisterna guarda ${cisterna.toLocaleString('es-AR')} litros y una familia usa ${uso} litros por día para beber y cocinar. ¿Cuántos días le dura?`,
          valor: cisterna / uso,
          unidad: 'días',
          explicacion: `${cisterna.toLocaleString('es-AR')} ÷ ${uso} = ${cisterna / uso} días. Por eso el agua de la cisterna se reserva para los usos más importantes durante la época seca.`,
          ctx: `Cisterna de ${cisterna} litros; ${uso} litros por día.`,
        };
      }, { d: 1 }),
      ord('Ordená los pasos para armar un sistema de cosecha de lluvia en una casa.', [ // e6
        'Medir la superficie del techo y averiguar la lluvia anual',
        'Calcular cuánta agua se puede juntar',
        'Instalar canaletas y un desvío para las primeras lluvias',
        'Construir la cisterna tapada',
        'Limpiar y mantener el sistema cada temporada',
      ], 'Calcular antes de construir evita cisternas demasiado chicas o demasiado caras.', { d: 2 }),
      par('Uní cada tecnología con su función en una tierra seca.', [ // e7
        ['Aljibe', 'Guardar la lluvia del techo para tomar'],
        ['Tajamar o represa', 'Juntar el agua que escurre para el ganado'],
        ['Riego por goteo', 'Llevar el agua justa a la raíz'],
        ['Drenaje', 'Evitar que la napa salina suba'],
      ], 'Cada tecnología resuelve una parte del problema del agua en zonas secas.', { d: 1 }),
      det('Leé este proyecto de riego y marcá lo que conviene corregir.', [ // e8
        ['Usaremos riego por goteo para ahorrar agua.', false],
        ['Como el agua sobra en primavera, regaremos de más sin drenaje.', true, 'El exceso sin drenaje hace subir la napa y saliniza el suelo.'],
        ['Mediremos la salinidad del agua de riego.', false],
        ['Tomaremos toda el agua del río sin pensar en quienes viven aguas abajo.', true, 'El agua de una cuenca se comparte; aguas abajo también hay personas y humedales.'],
      ], 'Un buen proyecto de riego piensa en el suelo, en la cuenca y en quienes comparten el agua.', { d: 2 }),
      comp('Completá.', 'En Mendoza, casi toda la población vive en los [oasis]; el riego sin drenaje puede [salinizar] el suelo; y 1 mm de lluvia sobre 1 m² de techo equivale a 1 [litro].', ['valles', 'endurecer', 'kilo'], 'Tres ideas para usar bien el agua donde escasea.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Recuperar tierras secas', 'Evitar, reducir y revertir: manejo del pastoreo, revegetación, cortinas y la Gran Muralla Verde.', [
      teoria('Neutralidad en la degradación', [
        'El Objetivo de Desarrollo Sostenible 15.3 propone lograr para 2030 un mundo con efecto neutro en la degradación de las tierras. La UNCCD la define como un estado en el que la cantidad y calidad de las tierras necesarias para sostener los ecosistemas y la seguridad alimentaria se mantienen estables o aumentan. Para llegar, propone una jerarquía de respuestas: primero evitar nueva degradación, después reducir la que ya existe y, por último, revertirla restaurando lo degradado.',
      ]),
      ord('Ordená la jerarquía de respuestas de la neutralidad, de la primera prioridad a la última.', [ // e1
        'Evitar nueva degradación en las tierras sanas',
        'Reducir la degradación con un manejo sostenible',
        'Revertir la degradación restaurando lo perdido',
      ], 'Evitar es lo más barato y efectivo; restaurar es lo más caro y lento.', { d: 1 }),
      clas('¿Esta acción busca evitar, reducir o revertir la degradación?', { // e2
        'Evitar': ['Proteger un pastizal sano de nuevos desmontes', 'No habilitar riego en suelos con napa salina'],
        'Reducir': ['Bajar la carga de ovejas en un campo con señales de erosión', 'Rotar potreros para dejar descansar el pasto'],
        'Revertir': ['Replantar arbustos nativos en un peladar', 'Fijar médanos con vegetación y barreras'],
      }, 'Las tres respuestas se combinan en un mismo territorio.', { d: 2 }),
      numv(3, (i) => { // e3
        const [degr, rest] = [[12000, 9000], [7000, 5500], [20000, 12500]][i];
        const neto = rest - degr;
        return {
          enunciado: `En una provincia se degradaron ${degr.toLocaleString('es-AR')} hectáreas en cinco años y se restauraron ${rest.toLocaleString('es-AR')}. ¿Cuántas hectáreas le faltan restaurar para llegar a la neutralidad?`,
          valor: -neto,
          unidad: 'hectáreas',
          explicacion: `${degr.toLocaleString('es-AR')} − ${rest.toLocaleString('es-AR')} = ${(-neto).toLocaleString('es-AR')} hectáreas de balance negativo: mientras la degradación le gane a la restauración, no hay neutralidad.`,
          ctx: `${degr} ha degradadas y ${rest} ha restauradas.`,
        };
      }, { d: 2 }),
      teoria('Manejar el pastoreo', [
        'En las tierras secas ganaderas, la herramienta más poderosa es ajustar la carga de animales a lo que el pastizal produce. También ayudan los descansos: dejar potreros sin animales en los momentos clave para que los pastos semillen y se recuperen. Y medir: con monitores como los de la red MARAS se ve si la cobertura mejora o empeora, y se corrige a tiempo. Muchas veces producir un poco menos durante unos años permite recuperar un campo que produzca durante décadas.',
      ]),
      mult('¿Qué prácticas ayudan a recuperar un campo ganadero de la estepa? Marcá todas.', [ // e4
        '+Ajustar la carga a lo que produce el pastizal',
        '+Dar descansos a los potreros para que semillen',
        '+Monitorear la cobertura cada año',
        '+Proteger las zonas más frágiles, como mallines y laderas',
        '-Sumar animales en los años de lluvia para compensar',
      ], 'Menos animales en el momento justo, más pasto a largo plazo.', { d: 2 }),
      vf('Para recuperar un campo degradado, lo mejor es plantar especies exóticas de crecimiento rápido en todas partes.', false, 'Las nativas están adaptadas a la sequía, el viento y el suelo del lugar, y no se vuelven invasoras. Las exóticas pueden servir en casos puntuales, como cortinas, pero no como regla.', {
        razones: ['+Porque las nativas están adaptadas y no se vuelven invasoras', '-Porque las especies exóticas no pueden crecer en zonas secas', '-Porque en un campo degradado no puede crecer ninguna planta'],
        d: 2,
      }),
      teoria('Revegetar y frenar el viento', [
        'Cuando el suelo ya se perdió, hay que ayudar a la vegetación a volver: sembrar o plantar especies nativas adaptadas, proteger los plantines del ganado y, en zonas con médanos, fijar la arena con barreras y vegetación. En el campo, las cortinas rompevientos de árboles o arbustos reducen la velocidad del viento y la erosión. Son trabajos lentos: en tierras secas, un arbusto puede tardar años en establecerse.',
      ]),
      op('¿Por qué conviene proteger del ganado un área recién revegetada?', [ // e5
        'Porque los plantines se comen antes de establecerse',
        'Porque el ganado aporta demasiada agua al suelo',
        ['Porque la ley prohíbe tener ganado en cualquier campo', 'No se prohíbe el ganado: se lo excluye un tiempo del área que se recupera.'],
        'Porque los plantines contagian enfermedades al ganado',
      ], 'Sin protección, el trabajo de revegetar puede perderse en una sola temporada.', { d: 1 }),
      teoria('La Gran Muralla Verde', [
        'En 2007, la Unión Africana lanzó la Gran Muralla Verde: una franja de unos 8.000 km a través del Sahel, en 22 países, para restaurar paisajes degradados. Sus metas para 2030 son restaurar 100 millones de hectáreas, capturar 250 millones de toneladas de carbono y crear 10 millones de empleos verdes. Empezó como una idea de plantar árboles en línea y evolucionó hacia un mosaico de prácticas: regeneración natural, manejo del agua y apoyo a la producción local.',
      ]),
      est('Estimá cuántas hectáreas degradadas busca restaurar la Gran Muralla Verde para 2030.', 100000000, { min: 100000, max: 1000000000, unidad: 'ha', escala: 'log' }, 'Cien millones de hectáreas, según la UNCCD: más de tres veces la superficie de la provincia de Buenos Aires.', { d: 3 }),
      rank('Ordená estas estrategias para una tierra seca, de la más barata y efectiva a la más cara y lenta.', [ // e6
        ['Proteger un pastizal sano de la degradación', 'evitar'],
        ['Ajustar la carga en un campo con señales de erosión', 'reducir'],
        ['Revegetar un peladar con nativas y cercos', 'revertir'],
      ], 'La misma lógica de la jerarquía de la neutralidad: prevenir sale mucho más barato que curar.', { d: 2, extremos: ['Más barata y efectiva', 'Más cara y lenta'] }),
      det('Leé este plan provincial y marcá lo que conviene corregir.', [ // e7
        ['Monitorearemos la cobertura vegetal con una red de parcelas.', false],
        ['Como vamos a restaurar, no hace falta frenar los nuevos desmontes.', true, 'La primera prioridad es evitar nueva degradación.'],
        ['Revegetaremos con especies nativas protegidas del ganado.', false],
        ['Mediremos el éxito solo por la cantidad de árboles plantados.', true, 'Importa si el ecosistema se recupera: cobertura, suelo, agua y biodiversidad.'],
      ], 'Un buen plan combina evitar, reducir y revertir, y mide resultados reales.', { d: 2 }),
      comp('Completá.', 'La meta de un balance cero entre tierras degradadas y restauradas es la [neutralidad]; la primera respuesta es [evitar] la degradación; y la Gran Muralla Verde se extiende por el [Sahel].', ['compensación', 'revertir', 'Amazonas'], 'Tres conceptos para recuperar tierras secas.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: tierras secas', 'Aridez, desertificación, sequías, agua y restauración, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el campo de la meseta', 'Un campo ovino de la meseta patagónica muestra señales de desertificación. Con los datos, armá un plan para recuperarlo sin abandonar la producción.', [
      teoria('La situación', [
        'Un campo de 10.000 hectáreas en la meseta de Chubut tiene 3.000 ovejas. El monitor instalado en el campo muestra que la cobertura vegetal bajó del 45 % al 30 % en diez años, con pedestales al pie de las matas y pequeños médanos junto a los alambrados. Los técnicos estiman que, en su estado actual, el pastizal puede sostener unas 2.000 ovejas. Además, vienen de dos años con lluvias por debajo de lo normal.',
      ]),
      num('¿En qué porcentaje bajó la cobertura vegetal respecto de la inicial?', 33.3, '%', '(45 − 30) ÷ 45 × 100 ≈ 33,3 %: el campo perdió un tercio de su cobertura en diez años.', { ctx: 'Cobertura del 45 % al 30 % en diez años.', dec: 1, tol: 0.2, d: 2 }),
      num('¿En qué porcentaje supera la carga actual a la que el pastizal puede sostener?', 50, '%', '(3.000 − 2.000) ÷ 2.000 × 100 = 50 %: el campo tiene la mitad más de animales de los que puede sostener.', { ctx: '3.000 ovejas; capacidad de 2.000.', d: 2 }),
      op('¿Cuál debería ser la primera medida del plan?', [ // e3
        'Ajustar la carga a la capacidad actual del pastizal',
        'Sumar ovejas para aprovechar el pasto que queda',
        ['Abandonar el campo y dejar de producir', 'Con un buen manejo, se puede recuperar produciendo.'],
        'Esperar a que vuelvan las lluvias sin cambiar nada',
      ], 'Sin bajar la carga, ninguna otra medida alcanza: la presión sobre el pastizal sigue.', { d: 2 }),
      clas('¿Qué parte de la jerarquía aplica cada medida del plan?', { // e4
        'Evitar': ['Cercar los mallines sanos para que no se degraden'],
        'Reducir': ['Bajar a 2.000 ovejas', 'Dar descanso a un potrero por temporada'],
        'Revertir': ['Revegetar las zonas con médanos', 'Poner barreras para frenar la arena'],
      }, 'Un plan completo usa las tres respuestas, cada una donde corresponde.', { d: 2 }),
      ord('Ordená los pasos del plan de recuperación.', [ // e5
        'Acordar el plan con la familia y los técnicos',
        'Ajustar la carga y organizar los descansos',
        'Revegetar y proteger las zonas más degradadas',
        'Medir la cobertura en el monitor cada año',
        'Revisar la carga según los resultados y las lluvias',
      ], 'Un plan que se mide y se ajusta aprende de sus propios resultados.', { d: 3 }),
      vf('Como vienen de años secos, la degradación del campo se explica solo por el clima.', false, 'La sequía agrava, pero la carga un 50 % mayor a la capacidad es una causa central. El manejo es justamente lo que el productor puede cambiar.', {
        razones: ['+Porque la carga excesiva es una causa central que se puede cambiar', '-Porque el clima nunca influye en la desertificación', '-Porque las ovejas mejoran el suelo cuanto más son'],
        d: 2,
      }),
      det('El productor escribe su plan. Marcá lo que conviene corregir.', [ // e7
        ['Bajaré la carga a unas 2.000 ovejas.', false],
        ['Si llueve bien un año, volveré enseguida a 3.000 ovejas.', true, 'Un año bueno no recupera el pastizal: la carga se revisa con el monitoreo.'],
        ['Revegetaré con nativas las zonas con médanos.', false],
        ['No hace falta seguir midiendo la cobertura.', true, 'Sin medir, no se sabe si el campo se recupera.'],
      ], 'Recuperar un campo es un compromiso de años, guiado por datos.', { d: 3 }),
    ]),
  ],
});
