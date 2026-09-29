import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// ANIMALES 6 — Una sola salud.
// La salud de las personas, los animales y los ecosistemas como un sistema:
// zoonosis, el salto de virus desde la fauna, brotes argentinos recientes,
// la resistencia a los antimicrobianos y la prevención cotidiana. Retoma la
// convivencia con la fauna (animales-5), las amenazas a la biodiversidad
// (animales-4), la fauna urbana (animales-2) y las inundaciones (agua-5).

export default unidad({
  slug: 'animales-6',
  rama: 'animales',
  orden: 6,
  nivel: 3,
  requiereTronco: 3,
  titulo: 'Una sola salud',
  bajada: 'Hantavirus, gripe aviar, dengue y bacterias resistentes: por qué la salud de las personas depende de la de los animales y los ecosistemas.',
  objetivos: [
    'Explicar el enfoque Una sola salud y qué es una zoonosis',
    'Relacionar el desmonte y el tráfico de fauna con la aparición de enfermedades nuevas',
    'Analizar brotes recientes en Argentina con datos y medidas de control',
    'Explicar cómo surge la resistencia a los antimicrobianos y cómo frenarla',
    'Aplicar hábitos de prevención frente a zoonosis y enfermedades ligadas al ambiente',
  ],
  repasa: ['animales-5', 'animales-4', 'animales-2', 'agua-5'],
  fuentes: ['omsa-una-salud', 'oms-una-salud', 'ipbes-pandemias', 'oms-resistencia', 'van-boeckel-2019', 'ue-promotores-2006', 'nejm-andes-2020', 'uhart-2024-elefantes', 'msal-hantavirus', 'msal-hidatidosis', 'msal-leptospirosis', 'msal-rabia', 'msal-dengue-2024', 'msal-suh-2026', 'ley-22421-fauna'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Una sola salud', 'Personas, animales y ambiente: por qué la salud de cada uno depende de la de los otros.', [
      teoria('Tres saludes conectadas', [
        'Durante mucho tiempo, la salud humana, la salud animal y el cuidado del ambiente se trabajaron por separado: médicos por un lado, veterinarios por otro y ecólogos por otro. Pero muchas enfermedades cruzan esas fronteras. Por eso surgió el enfoque Una sola salud, que la Organización Mundial de Sanidad Animal (OMSA) define como un enfoque integrado y unificador que busca equilibrar y optimizar de forma sostenible la salud de las personas, los animales y los ecosistemas.',
        'Desde 2022, cuatro organismos internacionales lo impulsan juntos: la OMS (salud humana), la OMSA (sanidad animal), la FAO (alimentación y agricultura) y el PNUMA (ambiente).',
      ]),
      cad('Armá la cadena de cómo un problema ambiental puede terminar en un problema de salud humana.', [ // e1
        'Una inundación cubre barrios y campos',
        'El agua arrastra orina de roedores y otros animales',
        'La bacteria de la leptospirosis sobrevive en el agua y el barro',
        'Vecinos limpian sin botas ni guantes',
        'Aparecen casos de leptospirosis',
      ], ['La inundación elimina todas las bacterias del barrio'], 'Ambiente, animales y personas en una sola cadena: por eso se habla de una sola salud.', { d: 2 }),
      teoria('Zoonosis', [
        'Una zoonosis es una enfermedad que se transmite entre animales y personas. Según la OMSA, el 60 % de los agentes que causan enfermedades humanas proceden de animales domésticos o silvestres, y el 75 % de las enfermedades infecciosas emergentes tienen origen animal. Algunas se contagian por mordeduras (rabia); otras por alimentos (triquinosis, síndrome urémico hemolítico); por el agua o el barro (leptospirosis); o por el aire con polvo contaminado con excretas de roedores (hantavirus).',
        'Otras enfermedades, como el dengue, no son zoonosis en las ciudades, pero también dependen del ambiente: las transmite un mosquito que se cría en agua acumulada.',
      ], { destacado: { valor: '75 %', texto: 'de las enfermedades infecciosas emergentes en personas tienen origen animal, según la OMSA.' } }),
      par('Uní cada enfermedad con su forma principal de contagio.', [ // e2
        ['Rabia', 'Mordedura o saliva de un animal infectado'],
        ['Hantavirus', 'Aire con polvo de excretas de roedores'],
        ['Leptospirosis', 'Agua o barro con orina de animales infectados'],
        ['Hidatidosis', 'Huevos del parásito en heces de perros'],
        ['Triquinosis', 'Carne de cerdo o jabalí sin control sanitario'],
      ], 'Cada zoonosis tiene su camino de contagio, y conocerlo es la base para prevenirla.', { d: 2 }),
      est('Estimá qué porcentaje de las enfermedades infecciosas emergentes en personas tienen origen animal.', 75, { min: 0, max: 100, paso: 5, unidad: '%' }, 'Según la OMSA, el 75 %: tres de cada cuatro enfermedades nuevas vienen de animales domésticos o silvestres.', { d: 2 }),
      vf('Todas las enfermedades que compartimos con los animales vienen de la fauna silvestre.', false, 'Muchas vienen de animales domésticos y de producción: la rabia puede venir de perros y gatos, la hidatidosis del ciclo entre perros y ovejas, y el síndrome urémico hemolítico de bacterias del intestino del ganado.', {
        razones: ['+Porque muchas vienen de animales domésticos y de producción', '-Porque los animales domésticos no tienen microbios', '-Porque las zoonosis solo existen en otros continentes'],
        d: 2,
      }),
      teoria('Un ejemplo de manual: la hidatidosis', [
        'La hidatidosis la causa un pequeño parásito que vive en el intestino de los perros. El perro infectado elimina miles de huevos en sus heces, que contaminan el pasto, el agua o las verduras. Las ovejas, vacas o cerdos los ingieren y se les forman quistes en los órganos. Si al carnear alguien le da esas vísceras crudas a un perro, el ciclo vuelve a empezar. Las personas, sobre todo niñas y niños, se contagian al tragar huevos por contacto con perros, verduras mal lavadas o agua no segura.',
        'Según el Ministerio de Salud, se previene sin alimentar a los perros con vísceras crudas, desparasitándolos cada 45 días, lavando frutas y verduras con agua potable y lavándose las manos después de tocar un perro y antes de comer.',
      ]),
      ord('Ordená el ciclo de la hidatidosis a partir de un perro infectado.', [ // e3
        'Un perro con el parásito elimina huevos en sus heces',
        'Los huevos contaminan el pasto, el agua o las verduras',
        'Una oveja los ingiere y se le forman quistes en los órganos',
        'Al carnear, alguien le da las vísceras crudas a un perro',
        'Ese perro se infecta y el ciclo vuelve a empezar',
      ], 'Un ciclo entre perros y ganado en el que las personas se contagian de rebote.', { d: 2 }),
      op('¿Cuál es la forma más eficaz de cortar el ciclo de la hidatidosis?', [ // e4
        'No dar vísceras crudas a los perros y desparasitarlos',
        'Dejar de comer verduras de huerta para siempre',
        ['Sacrificar a todas las ovejas del campo', 'No hace falta: alcanza con cortar el paso de las vísceras al perro.'],
        'Tomar antibióticos cada vez que se toca un perro',
      ], 'Si el perro no come vísceras con quistes y está desparasitado, el ciclo se corta.', { d: 2 }),
      mult('¿Quiénes tienen que participar en un plan local contra la hidatidosis? Marcá todos.', [ // e5
        '+Veterinarios que desparasitan a los perros',
        '+Médicos que diagnostican y notifican casos',
        '+Productores que controlan la faena y las vísceras',
        '+Escuelas que enseñan hábitos de higiene',
        '-Solo el hospital, porque es una enfermedad humana',
      ], 'El problema cruza sectores, así que la solución también: eso es una sola salud en la práctica.', { d: 1 }),
      op('¿Qué agrega el enfoque Una sola salud frente a que cada sector trabaje por su cuenta?', [ // e6
        'Detecta y previene problemas que cruzan sectores',
        'Reemplaza a los médicos por veterinarios en los hospitales',
        ['Se ocupa solo de las mascotas de la casa', 'Abarca personas, animales domésticos, silvestres y ecosistemas.'],
        'Elimina la necesidad de tener vacunas y medicamentos',
      ], 'Ver el sistema completo permite actuar antes y en el punto donde es más fácil cortar el problema.', { d: 2 }),
      vf('El síndrome urémico hemolítico, ligado a una bacteria del intestino del ganado, es un ejemplo de zoonosis transmitida por alimentos.', true, 'La bacteria Escherichia coli productora de toxina Shiga vive en el intestino de los bovinos y llega a las personas por carne poco cocida, lácteos sin pasteurizar o agua no segura.', {
        razones: ['+Porque la bacteria vive en el ganado y llega por los alimentos', '-Porque se contagia solo entre personas, sin animales', '-Porque lo transmite un mosquito'],
        d: 2,
      }),
      det('Leé este folleto municipal y marcá lo que conviene corregir.', [ // e7
        ['Desparasitá a tu perro cada 45 días.', false],
        ['Las vísceras crudas son un buen alimento para el perro de campo.', true, 'Es justamente la vía por la que el perro se infecta de hidatidosis.'],
        ['Lavá frutas y verduras con agua potable.', false],
        ['La hidatidosis es un tema de los veterinarios; los médicos no intervienen.', true, 'Hace falta el trabajo conjunto de salud humana y animal.'],
      ], 'Un buen mensaje de prevención reúne todos los eslabones del ciclo.', { d: 2 }),
      comp('Completá.', 'Una enfermedad que pasa entre animales y personas es una [zoonosis]; el enfoque que integra la salud de personas, animales y ecosistemas se llama Una sola [salud]; y para prevenir la hidatidosis hay que [desparasitar] a los perros.', ['epidemia', 'ciencia', 'bañar'], 'Tres ideas de base que vas a usar en toda la unidad.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Del bosque al contagio', 'Desmontes, tráfico de fauna y granjas sin controles: cómo aparecen las enfermedades nuevas.', [
      teoria('El salto entre especies', [
        'Muchos microbios viven en animales silvestres sin enfermarlos. El problema aparece cuando aumenta el contacto entre fauna, animales domésticos y personas: un virus puede "saltar" a una especie nueva, adaptarse y empezar a contagiarse entre personas. Según el informe sobre biodiversidad y pandemias de la plataforma científica IPBES (2020), más del 70 % de las enfermedades emergentes y casi todas las pandemias conocidas, como las de gripe, el SIDA o la COVID-19, tienen origen en microbios de animales.',
        'El mismo informe estima que en mamíferos y aves hay hasta 1,7 millones de virus todavía no descubiertos, de los cuales entre 631.000 y 827.000 podrían infectar a personas.',
      ], { destacado: { valor: '1,7 millones', texto: 'de virus sin descubrir se estima que hay en mamíferos y aves; hasta 827.000 podrían infectar a personas (IPBES, 2020).' } }),
      cad('Armá la cadena de cómo un desmonte puede terminar en una enfermedad nueva.', [ // e1
        'Se desmonta un bosque para cultivos o ganado',
        'Aumenta el contacto entre fauna, ganado y personas',
        'Un virus de un animal silvestre llega a animales domésticos o personas',
        'El virus se adapta y empieza a pasar entre personas',
        'Aparece una enfermedad nueva',
      ], ['Menos bosque significa menos contacto con la fauna'], 'El desmonte no solo destruye hábitat: también multiplica los encuentros que permiten el salto.', { d: 2 }),
      est('Estimá cuántos virus sin descubrir podría haber en mamíferos y aves.', 1700000, { min: 1000, max: 100000000, unidad: 'virus', escala: 'log' }, 'El IPBES estima hasta 1,7 millones: conocemos una fracción mínima de la diversidad de virus que existe.', { d: 3 }),
      teoria('Los motores', [
        'El IPBES atribuye más del 30 % de las enfermedades infecciosas emergentes al cambio de uso del suelo, la expansión agrícola y la urbanización. También pesan el comercio de fauna silvestre, que en 2019 movió más de 100.000 millones de dólares de forma legal, más un comercio ilegal difícil de medir, y la producción animal intensiva sin bioseguridad, donde miles de animales juntos permiten que un virus se propague rápido.',
        'La conclusión del informe es fuerte: aunque los microbios vienen de animales, la aparición de las pandemias está impulsada por actividades humanas.',
      ]),
      clas('¿Esta actividad aumenta o reduce el riesgo de que surja una zoonosis nueva?', { // e2
        'Aumenta el riesgo': ['Desmonte de selvas para cultivos', 'Tráfico de fauna silvestre', 'Mercados con animales vivos de muchas especies', 'Galpones con miles de aves sin bioseguridad'],
        'Reduce el riesgo': ['Conservar los bosques nativos', 'Controles sanitarios en las granjas', 'Vigilancia de la salud de la fauna', 'Combatir el tráfico de fauna'],
      }, 'Las mismas acciones que protegen la biodiversidad reducen el riesgo de nuevas enfermedades.', { d: 1 }),
      par('Uní cada motor de enfermedades nuevas con un ejemplo.', [ // e3
        ['Cambio de uso del suelo', 'Desmonte de selva para cultivos'],
        ['Comercio de fauna silvestre', 'Loros capturados que se venden en ferias'],
        ['Producción intensiva sin bioseguridad', 'Galpones con miles de aves cerca de humedales'],
        ['Urbanización', 'Barrios nuevos sobre bordes de monte'],
      ], 'Los cuatro motores tienen algo en común: más contacto entre especies que antes no se cruzaban.', { d: 2 }),
      vf('Las pandemias son fenómenos puramente naturales en los que las actividades humanas no influyen.', false, 'El IPBES concluye que la aparición de pandemias está impulsada por actividades humanas: cambio de uso del suelo, comercio de fauna y producción intensiva.', {
        razones: ['+Porque las actividades humanas aumentan el contacto que permite el salto', '-Porque los virus aparecen de la nada en las ciudades', '-Porque las pandemias solo las causan bacterias'],
        d: 2,
      }),
      teoria('Prevenir es mucho más barato', [
        'Hoy el mundo responde a las pandemias cuando ya empezaron, con vacunas y tratamientos: un camino lento e incierto. El IPBES estimó que la COVID-19 había costado entre 8 y 16 billones de dólares hasta julio de 2020, y que reducir los riesgos para prevenir pandemias costaría unas 100 veces menos que responder a ellas. Prevenir significa, sobre todo, frenar el desmonte, controlar el comercio de fauna y vigilar la salud animal.',
      ]),
      numv(3, (i) => { // e4
        const costo = [8000, 12000, 16000][i];
        return {
          enunciado: `Si responder a una pandemia cuesta ${costo.toLocaleString('es-AR')} miles de millones de dólares y prevenirla cuesta 100 veces menos, ¿cuántos miles de millones de dólares cuesta prevenirla?`,
          valor: costo / 100,
          unidad: 'miles de millones de dólares',
          explicacion: `${costo.toLocaleString('es-AR')} ÷ 100 = ${costo / 100} miles de millones de dólares. Con la proporción del IPBES, prevenir es una inversión mucho más barata que reaccionar.`,
          ctx: `Respuesta: ${costo} miles de millones; prevención 100 veces menos.`,
        };
      }, { d: 1 }),
      teoria('Mascotas que no deberían serlo', [
        'Comprar un loro, un mono o una tortuga capturados en la naturaleza vacía las poblaciones silvestres, y muchos animales mueren en el traslado. Además, en esos viajes van estresados, amontonados y mezclados con otras especies: condiciones ideales para que se propaguen microbios. Un ejemplo es la psitacosis, una bacteria que transmiten loros y otras aves y que puede causar neumonía en las personas. En Argentina, capturar y comerciar fauna silvestre sin autorización está prohibido por la ley de fauna.',
      ]),
      mult('¿Por qué no conviene comprar un loro capturado en la naturaleza? Marcá todo.', [ // e5
        '+Puede transmitir enfermedades como la psitacosis',
        '+Alimenta el tráfico que vacía las poblaciones silvestres',
        '+Muchos animales mueren durante el traslado',
        '+Es ilegal comerciarlo sin autorización',
        '-Porque los loros silvestres viven más tiempo en jaula',
      ], 'La fauna silvestre no es mascota: el tráfico daña a las especies y a la salud pública.', { d: 1 }),
      op('¿Por qué los mercados con animales vivos de muchas especies son de alto riesgo?', [ // e6
        'Juntan especies estresadas que nunca se cruzarían',
        'Porque allí todos los animales están vacunados',
        ['Porque venden solo animales domésticos', 'Suelen mezclar animales silvestres y domésticos.'],
        'Porque el aire libre elimina todos los virus',
      ], 'Estrés, hacinamiento y mezcla de especies: la receta para que un microbio salte.', { d: 2 }),
      op('Según el IPBES, ¿qué medida ataca la causa de fondo de las zoonosis nuevas?', [ // e7
        'Reducir el desmonte y el comercio de fauna silvestre',
        'Esperar cada brote y desarrollar una vacuna nueva',
        'Cerrar todos los parques nacionales al público',
        ['Eliminar a los murciélagos de todo el país', 'Matar fauna no resuelve el problema y puede dispersar los virus.'],
      ], 'Las vacunas son vitales, pero llegan tarde: prevenir el contacto evita que el brote empiece.', { d: 2 }),
      det('Leé esta nota de opinión y marcá las afirmaciones equivocadas.', [ // e8
        ['Más del 70 % de las enfermedades emergentes tienen origen animal.', false],
        ['Como los virus vienen de los animales, la culpa de las pandemias es de la fauna.', true, 'Según el IPBES, lo que impulsa el salto son las actividades humanas.'],
        ['Conservar los bosques ayuda a reducir el riesgo de pandemias.', false],
        ['Prevenir pandemias sale más caro que responder cuando ya empezaron.', true, 'Es al revés: prevenir cuesta unas 100 veces menos.'],
      ], 'El problema no son los animales, sino cómo nos relacionamos con ellos y con sus hábitats.', { d: 2 }),
      comp('Completá.', 'Cuando un virus pasa de una especie a otra se habla de un [salto]; el IPBES atribuye más del 30 % de las enfermedades emergentes al cambio de uso del [suelo]; y prevenir pandemias cuesta unas [100] veces menos que responder.', ['golpe', 'agua', '10'], 'Tres ideas para explicar de dónde vienen las enfermedades nuevas.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Brotes cerca de casa', 'El hantavirus en Epuyén, las ratadas del colihue y la gripe aviar en Península Valdés.', [
      teoria('Hantavirus en la cordillera', [
        'El hantavirus se transmite sobre todo al respirar polvo contaminado con orina, heces o saliva de roedores silvestres infectados, por ejemplo al entrar a galpones o cabañas cerradas. En el sur argentino circula el virus Andes, el único hantavirus en el que se comprobó contagio entre personas.',
        'Entre noviembre de 2018 y febrero de 2019, en Epuyén (Chubut), un solo contagio desde un roedor desató un brote de 34 personas infectadas y 11 muertes. Según el estudio publicado en el New England Journal of Medicine, tres personas con síntomas que asistieron a reuniones sociales concurridas contagiaron a la mayoría.',
      ], { destacado: { valor: '34 y 11', texto: 'personas infectadas y muertes en el brote de hantavirus de Epuyén, Chubut (2018-2019).' } }),
      num('En el brote de Epuyén hubo 34 personas infectadas y 11 muertes. ¿Qué porcentaje de las personas infectadas murió? Redondeá al entero.', 32, '%', '11 ÷ 34 × 100 ≈ 32 %. Casi una de cada tres personas infectadas murió: por eso la prevención es tan importante.', { ctx: 'Brote de Epuyén: 34 infectados y 11 muertes.', tol: 1, d: 1 }),
      teoria('Cortar la cadena de contagio', [
        'El número reproductivo indica a cuántas personas contagia, en promedio, cada caso. Si es mayor que 1, el brote crece; si es menor que 1, se apaga. En Epuyén era de 2,12 antes de las medidas de control y bajó a 0,96 cuando se aislaron los casos y se pusieron en cuarentena sus contactos.',
      ]),
      op('En Epuyén, el número reproductivo bajó de 2,12 a 0,96 tras aislar casos y contactos. ¿Qué significa?', [ // e2
        'Cada caso contagiaba a menos de uno: el brote se apagaba',
        'Que el virus se volvió más contagioso que antes',
        'Que había el doble de casos que antes de las medidas',
        ['Que la mitad de los roedores de la zona había muerto', 'El número reproductivo mide contagios entre personas.'],
      ], 'Bajar de 1 es la meta de todo control de brotes: cada contagio genera menos de un contagio nuevo.', { d: 3 }),
      teoria('Ratadas', [
        'La caña colihue, un bambú nativo de los bosques andinos, florece de forma masiva cada varias décadas y produce enormes cantidades de semillas. Con tanta comida, los ratones colilargos, principal reservorio del virus Andes, se multiplican: es lo que en la Patagonia llaman "ratada". Con más roedores cerca de las casas, aumenta el riesgo de hantavirus.',
        'Según el Ministerio de Salud, antes de entrar a un lugar cerrado hay que ventilarlo al menos 30 minutos, humedecer el piso antes de barrer para no levantar polvo y desinfectar con una parte de lavandina en nueve partes de agua.',
      ]),
      cad('Armá la cadena de cómo una floración del colihue puede aumentar los casos de hantavirus.', [ // e3
        'La caña colihue florece de forma masiva',
        'Hay una enorme cantidad de semillas en el bosque',
        'Los colilargos se multiplican',
        'Más roedores entran a galpones y cabañas',
        'Aumenta el riesgo de hantavirus para las personas',
      ], ['Las semillas del colihue matan a los ratones'], 'Un fenómeno de las plantas cambia la cantidad de roedores y, con ella, el riesgo para las personas.', { d: 2 }),
      ord('Ordená cómo limpiar un galpón que estuvo cerrado en una zona con hantavirus.', [ // e4
        'Abrir puertas y ventanas y ventilar al menos 30 minutos',
        'Entrar con guantes y barbijo adecuado',
        'Humedecer el piso y las excretas con agua con lavandina',
        'Retirar la suciedad con un trapo húmedo, sin barrer en seco',
        'Lavarse bien las manos al terminar',
      ], 'La clave es no levantar polvo: ventilar, humedecer y limpiar en húmedo.', { d: 2 }),
      numv(3, (i) => { // e5
        const litros = [1, 5, 2][i];
        return {
          enunciado: `La solución para desinfectar se prepara con 1 parte de lavandina por cada 9 partes de agua. ¿Cuántos mililitros de lavandina hacen falta para preparar ${litros} ${litros === 1 ? 'litro' : 'litros'} de solución?`,
          valor: litros * 100,
          unidad: 'mL',
          explicacion: `1 + 9 = 10 partes; ${litros * 1000} mL ÷ 10 = ${litros * 100} mL de lavandina y ${litros * 900} mL de agua.`,
          ctx: `Proporción 1 a 9; ${litros} L de solución.`,
        };
      }, { d: 2 }),
      teoria('Gripe aviar en el mar', [
        'En octubre de 2023, un virus de gripe aviar H5N1 llegó a la colonia de elefantes marinos del sur en Península Valdés. Se estima que murieron unas 17.400 crías, casi el 97 % de las nacidas esa temporada, además de muchos adultos. Un estudio publicado en Nature Communications encontró evidencias de que el virus se transmitió entre mamíferos, y no solo de aves a mamíferos. El mismo virus afectó a lobos marinos y a aves marinas como los gaviotines.',
        'Es un caso de una sola salud: un virus de aves que golpea a mamíferos marinos, pone en riesgo a las granjas avícolas, afecta al turismo y exige cuidados a quienes trabajan con animales.',
      ]),
      num('Si unas 17.400 crías muertas eran cerca del 97 % de las nacidas, ¿cuántas crías habían nacido aproximadamente? Redondeá a la centena.', 17900, 'crías', '17.400 ÷ 0,97 ≈ 17.938, o sea unas 17.900 crías: sobrevivió apenas un puñado de cada cien.', { ctx: '17.400 crías muertas, cerca del 97 % del total.', tol: 100, d: 3 }),
      mult('¿Por qué el brote de gripe aviar en Península Valdés es un problema de "una sola salud"? Marcá todo.', [ // e6
        '+Un virus de aves afectó a mamíferos marinos',
        '+Pone en riesgo a las granjas avícolas',
        '+Afecta al turismo y a la economía local',
        '+Exige cuidados a quienes manipulan animales',
        '-Porque solo afecta a las gallinas de corral',
      ], 'Un mismo virus toca la fauna, la producción, la economía y la salud de las personas.', { d: 2 }),
      vf('Si encontrás un lobo marino o un ave muerta en la playa, conviene tocarla para ver si todavía está viva.', false, 'No hay que tocar animales muertos o enfermos: pueden transmitir enfermedades. Lo correcto es alejarse y avisar a las autoridades sanitarias o ambientales para que tomen muestras.', {
        razones: ['+Porque pueden transmitir enfermedades y hay que avisar a las autoridades', '-Porque los animales marinos nunca tienen enfermedades', '-Porque tocarlos es la mejor forma de ayudarlos'],
        d: 1,
      }),
      det('Leé este mensaje en un grupo de vecinos y marcá lo que conviene corregir.', [ // e7
        ['Antes de entrar a la cabaña, la dejamos ventilar media hora.', false],
        ['Después barremos en seco para sacar rápido las cacas de ratón.', true, 'Barrer en seco levanta polvo contaminado: hay que humedecer antes.'],
        ['Si alguien tiene fiebre después de limpiar, que consulte y cuente dónde estuvo.', false],
        ['El hantavirus no se contagia entre personas, así que no hace falta aislar a nadie.', true, 'El virus Andes sí se contagia entre personas, como mostró Epuyén.'],
      ], 'Los detalles de la limpieza y del aislamiento salvan vidas.', { d: 2 }),
      comp('Completá.', 'En el sur argentino circula el virus [Andes], que se contagia entre personas; la multiplicación de roedores tras la floración del colihue se llama [ratada]; y en 2023 la gripe aviar mató a casi todas las crías de [elefantes] marinos de Península Valdés.', ['Nilo', 'cosecha', 'pingüinos'], 'Tres claves de brotes recientes en la Patagonia.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Antibióticos: un bien común', 'Cómo surgen las bacterias resistentes, qué papel tiene la ganadería y qué podemos hacer.', [
      teoria('Cuando los remedios dejan de funcionar', [
        'Los antimicrobianos, como los antibióticos, son medicamentos que combaten microbios. Pero las bacterias cambian: cuando se usa un antibiótico, mueren las sensibles y sobreviven las pocas que resisten, que se multiplican sin competencia. Es selección natural en acción, y cuanto más y peor se usan los antibióticos, más rápido avanza. Según la OMS, en 2021 la resistencia bacteriana estuvo asociada a más de 4,7 millones de muertes en el mundo, y el uso indebido y excesivo de antibióticos es uno de sus principales motores.',
      ], { destacado: { valor: '4,7 millones', texto: 'de muertes en el mundo estuvieron asociadas a bacterias resistentes en 2021, según la OMS.' } }),
      cad('Armá la cadena de cómo el mal uso de antibióticos genera resistencia.', [ // e1
        'Se toma un antibiótico sin necesitarlo',
        'El antibiótico mata a las bacterias sensibles',
        'Sobreviven las pocas bacterias resistentes',
        'Las resistentes se multiplican sin competencia',
        'Una próxima infección ya no responde a ese antibiótico',
      ], ['El antibiótico vuelve más fuerte al sistema inmune'], 'Cada uso innecesario es una ventaja regalada a las bacterias resistentes.', { d: 2 }),
      vf('Los antibióticos sirven para curar resfríos y gripes.', false, 'Resfríos y gripes los causan virus, y los antibióticos actúan contra bacterias. Tomarlos sin necesidad no ayuda y favorece la resistencia.', {
        razones: ['+Porque los causan virus y los antibióticos actúan contra bacterias', '-Porque los antibióticos solo sirven para animales', '-Porque la gripe la causa un hongo'],
        d: 1,
      }),
      clas('¿Un antibiótico sirve o no sirve para esta enfermedad?', { // e2
        'Puede servir (causa bacteriana)': ['Infección urinaria bacteriana', 'Neumonía bacteriana', 'Angina por estreptococo'],
        'No sirve (causa viral)': ['Resfrío común', 'Gripe', 'COVID-19'],
      }, 'Los antibióticos solo actúan contra bacterias; qué tratamiento corresponde lo decide un profesional.', { d: 1 }),
      teoria('Resistencia en el campo', [
        'Los antimicrobianos también se usan en animales: para curarlos, para prevenir enfermedades cuando viven amontonados y, en algunos países, para que engorden más rápido. Según un estudio publicado en Science en 2019, alrededor del 73 % de los antimicrobianos que se venden en el mundo se usan en animales criados para alimento.',
        'Las bacterias resistentes y sus genes pasan entre animales, personas y ambiente: por los alimentos, por el contacto directo, por el estiércol y por el agua. Por eso la Unión Europea prohibió desde 2006 usar antibióticos como promotores de crecimiento. La alternativa es prevenir: vacunas, higiene, menos hacinamiento y uso solo con receta veterinaria.',
      ]),
      est('Estimá qué porcentaje de los antimicrobianos que se venden en el mundo se usan en animales criados para alimento.', 73, { min: 0, max: 100, paso: 1, unidad: '%' }, 'Alrededor del 73 %, según el estudio publicado en Science en 2019: la mayor parte del uso mundial está en la ganadería.', { d: 2 }),
      numv(3, (i) => { // e3
        const total = [1000, 500, 2000][i];
        return {
          enunciado: `Si en un país se vendieran ${total.toLocaleString('es-AR')} toneladas de antimicrobianos y, como en el promedio mundial, el 73 % fuera a animales de producción, ¿cuántas toneladas quedarían para todos los demás usos?`,
          valor: total * 27 / 100,
          unidad: 'toneladas',
          explicacion: `100 % − 73 % = 27 %; ${total.toLocaleString('es-AR')} × 27 % = ${(total * 27 / 100).toLocaleString('es-AR')} toneladas. Valores de ejemplo con la proporción mundial.`,
          ctx: `${total} toneladas; 73 % para animales de producción.`,
        };
      }, { d: 1 }),
      par('Uní cada vía con un ejemplo de cómo viaja la resistencia.', [ // e4
        ['Alimentos', 'Carne mal cocida con bacterias resistentes'],
        ['Contacto directo', 'Trabajadores que manejan animales'],
        ['Estiércol', 'Bacterias resistentes que llegan al suelo'],
        ['Agua', 'Efluentes que llegan a ríos y arroyos'],
      ], 'La resistencia no respeta fronteras entre especies ni entre ambientes.', { d: 2 }),
      op('¿Por qué la Unión Europea prohibió desde 2006 usar antibióticos como promotores de crecimiento?', [ // e5
        'Para frenar la resistencia: no curaban, solo engordaban',
        'Porque los antibióticos hacían crecer menos a los animales',
        ['Porque los animales ya no se enfermaban nunca', 'Siguen enfermándose; tratarlos con receta sigue permitido.'],
        'Porque eran más caros que el alimento balanceado',
      ], 'Usar antibióticos en animales sanos para engordarlos multiplica la resistencia sin curar a nadie.', { d: 2 }),
      teoria('Qué podemos hacer', [
        'Cada persona puede ayudar: tomar antibióticos solo con receta, seguir las indicaciones del profesional sobre dosis y duración, no compartirlos ni usar los que sobraron, y no exigirlos ante un resfrío. Vacunarse y lavarse las manos también ayudan, porque cada infección evitada es un antibiótico que no hace falta. En la producción, lo mismo: prevenir con vacunas e higiene, y usar antimicrobianos solo cuando un veterinario lo indica.',
      ]),
      mult('¿Qué conductas ayudan a frenar la resistencia? Marcá todas.', [ // e6
        '+Tomar antibióticos solo con receta',
        '+Seguir las indicaciones sobre dosis y duración',
        '+No usar sobrantes ni compartir antibióticos',
        '+Mantener las vacunas al día',
        '-Pedir antibióticos ante cualquier resfrío',
      ], 'Usar bien los antibióticos es cuidar un recurso que compartimos todos.', { d: 1 }),
      vf('Las bacterias resistentes pueden pasar de los animales a las personas a través de los alimentos y el ambiente.', true, 'Por eso la resistencia es un problema de una sola salud: lo que se usa en un corral puede terminar afectando a un hospital.', {
        razones: ['+Porque viajan por alimentos, contacto, estiércol y agua', '-Porque las bacterias de los animales son siempre inofensivas', '-Porque solo se transmiten por el aire'],
        d: 2,
      }),
      det('Leé estos consejos de un grupo de chat y marcá los equivocados.', [ // e7
        ['Si te sobró antibiótico de la otra vez, tomalo cuando tengas fiebre.', true, 'Puede no ser el adecuado y favorece la resistencia.'],
        ['Lavarte las manos reduce infecciones y el uso de antibióticos.', false],
        ['Si te sentís mejor, cortá el antibiótico sin consultar.', true, 'La duración la define el profesional.'],
        ['Las vacunas previenen infecciones, así que se usan menos antibióticos.', false],
      ], 'Los consejos de chat pueden sonar prácticos y ser peligrosos: con antibióticos, manda la receta.', { d: 2 }),
      comp('Completá.', 'Cuando un antibiótico deja de funcionar hablamos de [resistencia]; los antibióticos no sirven contra los [virus]; y en el mundo, la mayor parte de los antimicrobianos se usa en [animales] de producción.', ['inmunidad', 'bacterias', 'hospitales'], 'Tres ideas para entender la resistencia como un problema compartido.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Clima, agua y prevención cotidiana', 'Inundaciones, dengue, la carne que comemos y las mascotas: la salud compartida en la vida diaria.', [
      teoria('Después de la inundación', [
        'La leptospirosis la causa una bacteria que eliminan en la orina roedores, perros, vacas, cerdos, caballos y fauna silvestre. Sobrevive en ambientes húmedos y protegidos de la luz, y se contagia por contacto con esa orina o con agua y barro contaminados. Por eso el riesgo sube mucho con las inundaciones, que el cambio climático vuelve más frecuentes en muchas regiones. Se previene evitando meterse en agua estancada, usando botas y guantes al limpiar, controlando los roedores y manteniendo los patios sin basura.',
      ]),
      mult('Después de una inundación, ¿qué medidas previenen la leptospirosis? Marcá todas.', [ // e1
        '+Usar botas y guantes para limpiar',
        '+Evitar que los chicos jueguen en charcos',
        '+Sacar la basura que atrae roedores',
        '+Consultar si aparece fiebre después de estar en el agua',
        '-Caminar descalzo para no arruinar el calzado',
      ], 'El agua de una inundación puede estar contaminada aunque se vea limpia.', { d: 1 }),
      teoria('Dengue y un clima más cálido', [
        'El dengue lo transmite el mosquito Aedes aegypti, que se cría en recipientes con agua acumulada. La temporada 2023-2024 fue la mayor epidemia registrada en Argentina: según el Ministerio de Salud, hubo 583.297 casos confirmados y 419 muertes. Temperaturas más altas y temporadas cálidas más largas ayudan al mosquito a reproducirse más rápido y a extenderse hacia zonas más frías y hacia más meses del año.',
      ], { destacado: { valor: '583.297', texto: 'casos confirmados de dengue en la temporada 2023-2024, la mayor epidemia registrada en Argentina.' } }),
      num('En la temporada 2023-2024 hubo 583.297 casos confirmados de dengue y 419 muertes. ¿Qué porcentaje de los casos murió? Redondeá a dos decimales.', 0.07, '%', '419 ÷ 583.297 × 100 ≈ 0,07 %. Una letalidad baja, pero con tantos casos se traduce en cientos de muertes evitables.', { ctx: '583.297 casos confirmados y 419 muertes.', dec: 2, tol: 0.01, d: 2 }),
      cad('Armá la cadena de cómo el calentamiento puede extender el dengue.', [ // e2
        'Las temperaturas medias suben',
        'Los veranos son más largos y cálidos',
        'El mosquito se reproduce más rápido y en más meses',
        'Llega a zonas donde antes hacía demasiado frío',
        'Aparecen casos donde antes no había',
      ], ['El calor extremo elimina a todos los mosquitos'], 'El clima cambia el mapa de muchas enfermedades transmitidas por insectos.', { d: 2 }),
      teoria('En la cocina y en casa', [
        'El síndrome urémico hemolítico (SUH) está asociado a una bacteria, Escherichia coli productora de toxina Shiga, que vive en el intestino del ganado. Llega a las personas por carne poco cocida, lácteos sin pasteurizar, agua no segura o manos sucias. Argentina tiene una de las tasas de SUH más altas del mundo y es la principal causa de insuficiencia renal aguda en niñas y niños pequeños. Se previene cocinando bien la carne picada, separando crudos de cocidos y lavándose las manos.',
        'La rabia se transmite por la saliva de un animal infectado, sobre todo por mordeduras. En Argentina la transmiten principalmente murciélagos, perros y gatos, y una vez que aparecen los síntomas casi siempre es mortal. Por eso hay que vacunar a perros y gatos cada año desde los 3 meses, no tocar murciélagos caídos y, ante una mordedura, lavar con abundante agua y jabón y consultar de inmediato.',
      ]),
      op('¿Por qué la carne picada es más riesgosa que un bife si queda poco cocida?', [ // e3
        'Al picarla, las bacterias de la superficie pasan al interior',
        'Porque la carne picada viene de animales más enfermos',
        ['Porque un bife nunca puede tener bacterias', 'Puede tenerlas en la superficie, que se cocina bien.'],
        'Porque la carne picada tiene más grasa que el bife',
      ], 'En un bife las bacterias quedan afuera y se cocinan; en la picada están también en el centro, que debe quedar sin partes rosadas.', { d: 2 }),
      clas('¿Qué enfermedad ayuda a prevenir cada hábito?', { // e4
        'SUH': ['Cocinar bien la carne picada', 'Tomar lácteos pasteurizados'],
        'Rabia': ['Vacunar al perro cada año', 'No tocar murciélagos caídos'],
        'Hidatidosis': ['No dar vísceras crudas al perro', 'Desparasitar al perro cada 45 días'],
      }, 'Hábitos simples de cocina y de tenencia responsable cortan zoonosis muy distintas.', { d: 2 }),
      ord('Un perro que no conocés te muerde. Ordená qué hacer.', [ // e5
        'Alejarte del animal para evitar otra mordedura',
        'Lavar la herida con abundante agua y jabón',
        'Ir de inmediato a un centro de salud',
        'Seguir el tratamiento que te indiquen',
      ], 'Lavar bien la herida y consultar enseguida es lo que previene la rabia.', { d: 1 }),
      vf('Si un murciélago está caído en el piso durante el día, conviene levantarlo con la mano para ayudarlo.', false, 'Un murciélago caído de día puede estar enfermo, incluso con rabia. No hay que tocarlo: se lo cubre con un recipiente sin tocarlo y se avisa al área de zoonosis del municipio.', {
        razones: ['+Porque puede estar enfermo, incluso con rabia', '-Porque los murciélagos nunca tienen enfermedades', '-Porque los murciélagos caídos siempre están muertos'],
        d: 1,
      }),
      numv(3, (i) => { // e6
        const [casos, pob] = [[209, 47000000], [350, 47000000], [60, 3000000]][i];
        const tasa = Math.round((casos / pob) * 100000 * 100) / 100;
        return {
          enunciado: `Se notificaron ${casos} casos de SUH en una población de ${pob.toLocaleString('es-AR')} habitantes. ¿Cuál es la tasa cada 100.000 habitantes? Redondeá a dos decimales.`,
          valor: tasa,
          unidad: 'casos cada 100.000',
          dec: 2,
          tol: 0.01,
          explicacion: `${casos} ÷ ${pob.toLocaleString('es-AR')} × 100.000 ≈ ${tasa.toLocaleString('es-AR')}. Las tasas permiten comparar lugares y años con poblaciones distintas.`,
          ctx: `${casos} casos; ${pob.toLocaleString('es-AR')} habitantes.`,
        };
      }, { d: 2 }),
      par('Uní cada enfermedad con la situación que más aumenta su riesgo.', [ // e7
        ['Leptospirosis', 'Barrios inundados con agua y barro'],
        ['Dengue', 'Recipientes con agua acumulada en el patio'],
        ['Hantavirus', 'Galpones cerrados con roedores'],
        ['Hidatidosis', 'Perros alimentados con vísceras crudas'],
        ['SUH', 'Carne picada poco cocida'],
      ], 'Conocer la situación de riesgo es saber dónde actuar.', { d: 1 }),
      det('Leé este folleto de un centro de salud y marcá lo que conviene corregir.', [ // e8
        ['Vaciá los recipientes que acumulan agua para evitar el mosquito del dengue.', false],
        ['La carne picada puede quedar jugosa y rosada en el centro sin riesgo.', true, 'Debe cocinarse hasta que no queden partes rosadas.'],
        ['Vacuná a tu perro y a tu gato contra la rabia cada año.', false],
        ['Después de una inundación, limpiá descalzo para no ensuciar el calzado.', true, 'El barro puede tener la bacteria de la leptospirosis: botas y guantes.'],
      ], 'Un folleto de prevención tiene que ser preciso: un solo error puede costar caro.', { d: 2 }),
      comp('Completá.', 'La leptospirosis aumenta después de las [inundaciones]; el mosquito del dengue se cría en agua [acumulada]; y la carne picada debe cocinarse hasta que no queden partes [rosadas].', ['sequías', 'salada', 'doradas'], 'Tres hábitos para cuidar la salud compartida en la vida diaria.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: una sola salud', 'Zoonosis, saltos entre especies, brotes, resistencia a los antimicrobianos y prevención, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el pueblo después del agua', 'Un pueblo del Litoral sale de una inundación con varios problemas de salud a la vez. Armá un plan de una sola salud.', [
      teoria('La situación', [
        'Un pueblo de 20.000 habitantes del Litoral estuvo varias semanas bajo el agua. Desde que bajó, se confirmaron 12 casos de leptospirosis. Hay basurales en los bordes del barrio más afectado y muchos perros sueltos sin vacunar ni desparasitar. En una laguna cercana aparecieron aves silvestres muertas. Y en el centro de salud notan que muchos vecinos llegan después de tomar antibióticos comprados sin receta "por las dudas".',
      ]),
      num('¿Cuál es la tasa de leptospirosis del pueblo, en casos cada 100.000 habitantes?', 60, 'casos cada 100.000', '12 ÷ 20.000 × 100.000 = 60 casos cada 100.000 habitantes: una tasa muy alta, típica de un brote después de una inundación.', { ctx: '12 casos en un pueblo de 20.000 habitantes.', d: 2 }),
      op('¿Qué conviene hacer con las aves muertas de la laguna?', [ // e2
        'No tocarlas y avisar al SENASA para que tome muestras',
        'Juntarlas a mano y tirarlas en el basural del barrio',
        ['Esperar a que se descompongan solas en la orilla', 'Sin muestras no se sabe si hay gripe aviar u otra causa.'],
        'Dárselas a los perros sueltos como alimento',
      ], 'Las mortandades de aves pueden ser gripe aviar: hay que avisar sin tocar, para proteger personas, fauna y granjas.', { d: 2 }),
      clas('¿Qué sector debería liderar cada acción?', { // e3
        'Salud humana': ['Atender y notificar los casos de leptospirosis', 'Informar sobre el uso correcto de antibióticos'],
        'Sanidad animal': ['Vacunar y desparasitar a los perros', 'Tomar muestras de las aves muertas'],
        'Ambiente': ['Limpiar los basurales que atraen roedores', 'Recuperar el drenaje de los barrios'],
      }, 'Cada sector lidera algo, pero el plan funciona solo si coordinan entre todos.', { d: 2 }),
      ord('Ordená los pasos del plan de una sola salud.', [ // e4
        'Armar una mesa con salud, veterinaria, ambiente y vecinos',
        'Reunir datos de casos humanos, animales y ambientales',
        'Definir las acciones prioritarias y quién las lidera',
        'Comunicar las medidas a toda la población',
        'Evaluar los resultados y ajustar el plan',
      ], 'Coordinación, datos, acción, comunicación y evaluación: el mismo método de siempre, con todos los sectores.', { d: 3 }),
      mult('¿Qué mensajes deberían recibir los vecinos? Marcá todos.', [ // e5
        '+Limpiar con botas y guantes y consultar si aparece fiebre',
        '+Vacunar y desparasitar a los perros',
        '+No tocar animales muertos y avisar si aparecen',
        '+Usar antibióticos solo con receta',
        '-Tomar antibióticos por las dudas después de mojarse',
      ], 'Mensajes claros y concretos que cubren las personas, los animales y el ambiente.', { d: 2 }),
      vf('Como los casos de leptospirosis son humanos, el plan solo necesita al hospital.', false, 'La bacteria viene de animales y se propaga por el ambiente: sin control de roedores, basurales, drenaje y animales, los casos van a seguir apareciendo.', {
        razones: ['+Porque el origen está en animales y ambiente', '-Porque la leptospirosis se contagia solo entre personas', '-Porque los hospitales no atienden leptospirosis'],
        d: 1,
      }),
      det('El municipio redacta el plan. Marcá lo que conviene corregir.', [ // e7
        ['Se hará una campaña de vacunación y desparasitación de perros.', false],
        ['Se repartirán antibióticos sin receta a todos los que estuvieron en el agua.', true, 'Favorece la resistencia; los antibióticos se usan con indicación profesional.'],
        ['Se limpiarán los basurales y se recuperará el drenaje.', false],
        ['Las aves muertas se enterrarán sin tomar muestras para no alarmar.', true, 'Hay que tomar muestras para descartar gripe aviar u otras causas.'],
      ], 'Un buen plan de una sola salud mira a las personas, a los animales y al ambiente al mismo tiempo.', { d: 3 }),
    ]),
  ],
});
