import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// OCÉANOS 4 — Áreas protegidas del mar y la costa.
// Por qué y cuánto se protege el mar, las áreas marinas protegidas de
// Argentina, qué hace que una reserva funcione, las costas que nos protegen
// y cómo se gestiona un área con la gente. Retoma el planeta azul
// (oceanos-1), la pesca (oceanos-2) y la biodiversidad amenazada
// (animales-4).

export default unidad({
  slug: 'oceanos-4',
  rama: 'agua_azul',
  orden: 4,
  nivel: 2,
  requiereTronco: 2,
  titulo: 'Áreas protegidas del mar y la costa',
  bajada: 'Del Banco Burdwood a Península Valdés: por qué se protege el mar, qué hace que una reserva funcione de verdad y cómo se cuidan las costas con la gente que vive de ellas.',
  objetivos: [
    'Explicar qué es un área marina protegida y sus niveles de protección',
    'Conocer las áreas marinas protegidas de Argentina y su marco legal',
    'Identificar las características que hacen efectiva una reserva marina',
    'Reconocer los servicios que brindan las costas, las marismas y las dunas',
    'Proponer formas de gestión participativa y de control',
  ],
  repasa: ['oceanos-1', 'oceanos-2', 'animales-4', 'oceanos-3'],
  fuentes: ['cdb-meta-3', 'mpatlas', 'mci-10-3', 'edgar-2014-neoli', 'ley-27490-amp', 'parques-nacionales', 'ramsar', 'pampa-azul'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Por qué proteger el mar', 'Qué es un área marina protegida, cuánto océano está protegido de verdad y la meta del 30 % para 2030.', [
      teoria('Áreas marinas protegidas', [
        'Un área marina protegida es una zona del mar con reglas especiales para conservar su biodiversidad: puede prohibir la pesca, limitar ciertos métodos, regular el turismo o la navegación. No todas protegen igual. En algunas no se puede extraer nada (áreas de protección total); en otras se permiten actividades controladas; y otras existen en los papeles pero casi no tienen reglas ni control.',
      ]),
      clas('¿Qué nivel de protección tiene cada zona?', { // e1
        'Protección total': ['Zona donde no se puede pescar ni extraer nada', 'Reserva estricta solo para investigación'],
        'Protección parcial': ['Zona donde se permite pesca artesanal con reglas', 'Área con turismo regulado y pesca limitada'],
        'Protección en los papeles': ['Área declarada, sin reglas ni controles en el agua', 'Reserva donde se sigue pescando igual que antes'],
      }, 'El nombre "área protegida" no dice cuánto protege: hay que mirar las reglas y si se cumplen.', { d: 2 }),
      teoria('Cuánto está protegido', [
        'En 2022, casi todos los países acordaron en el Marco Mundial de Biodiversidad la meta de conservar al menos el 30 % de las zonas terrestres y marinas para 2030. En 2026, alrededor del 10 % del océano estaba dentro de áreas marinas protegidas, pero según el Atlas de Protección Marina solo algo más del 3 % tenía protección total o alta. La diferencia muestra cuántas áreas permiten actividades dañinas o existen solo en los papeles.',
      ], {
        datos: barras('Océano protegido (aproximado, 2026)', '%', [
          ['Meta 2030', 30],
          ['En áreas marinas protegidas', 10],
          ['Con protección total o alta', 3.3],
        ], 'Marco Mundial de Biodiversidad; Marine Protection Atlas.'),
      }),
      est('Estimá qué porcentaje del océano tenía protección total o alta en 2026, según el Atlas de Protección Marina.', 3.3, { min: 0, max: 50, paso: 0.1, unidad: '%' }, 'Algo más del 3 %. Aunque cerca del 10 % está en áreas protegidas, la mayor parte permite actividades que dañan los ecosistemas.', { d: 2 }),
      numv(3, (i) => { // e3
        const [meta, hoy] = [[30, 10], [30, 3.3], [30, 12]][i];
        return {
          enunciado: `Si la meta es proteger el ${meta} % del océano para 2030 y hoy se protege el ${hoy.toLocaleString('es-AR')} %, ¿cuántos puntos porcentuales faltan?`,
          valor: Math.round((meta - hoy) * 10) / 10,
          unidad: 'puntos porcentuales',
          dec: 1,
          tol: 0.1,
          explicacion: `${meta} − ${hoy.toLocaleString('es-AR')} = ${(Math.round((meta - hoy) * 10) / 10).toLocaleString('es-AR')} puntos. Y no alcanza con declarar áreas: tienen que proteger de verdad.`,
          ctx: `Meta ${meta} %; hoy ${hoy} %.`,
        };
      }, { d: 1 }),
      teoria('Para qué sirven', [
        'Las áreas marinas protegidas bien diseñadas permiten que las poblaciones de peces se recuperen, que los ejemplares crezcan más grandes y pongan más huevos, que se regeneren hábitats como los bosques de algas o los corales de agua fría, y que las especies amenazadas tengan refugio. También sirven como "línea de base": lugares para comparar y entender cómo cambia el mar fuera de ellas.',
      ]),
      mult('¿Para qué sirve un área marina protegida bien diseñada? Marcá todo.', [ // e4
        '+Recuperar poblaciones de peces',
        '+Dar refugio a especies amenazadas',
        '+Regenerar hábitats del fondo marino',
        '+Servir de comparación para la ciencia',
        '-Aumentar la pesca de arrastre dentro del área',
      ], 'Las áreas protegidas son a la vez refugio, criadero y laboratorio.', { d: 1 }),
      op('¿Qué significa la meta "30 × 30"?', [ // e5
        'Conservar el 30 % de tierras y mares para 2030',
        'Pescar un 30 % más para el año 2030',
        ['Proteger 30 especies en 30 países', 'Se trata de porcentaje de superficie, no de especies.'],
        'Plantar 30 árboles por persona para 2030',
      ], 'Es la meta central del Marco Mundial de Biodiversidad acordado en 2022.', { d: 1 }),
      vf('Si un país declara muchas áreas marinas protegidas, seguro está protegiendo bien su mar.', false, 'Depende de las reglas y de que se cumplan. Muchas áreas permiten actividades dañinas o no tienen control: son "parques de papel".', { // e6
        razones: ['+Porque importan las reglas y el control, no solo la declaración', '-Porque las áreas protegidas nunca funcionan', '-Porque el mar no se puede proteger'],
        d: 2,
      }),
      par('Uní cada concepto con su definición.', [ // e7
        ['Área marina protegida', 'Zona del mar con reglas para conservar la biodiversidad'],
        ['Protección total', 'No se permite extraer nada'],
        ['Parque de papel', 'Área declarada que no protege en la práctica'],
        ['Meta 30 × 30', 'Conservar el 30 % para 2030'],
      ], 'Vocabulario básico de la conservación marina.', { d: 1 }),
      cad('Armá la cadena de cómo proteger a los predadores puede recuperar un bosque de algas.', [ // e7b
        'Se prohíbe pescar a los predadores de los erizos de mar',
        'Los predadores se recuperan y comen más erizos',
        'Los erizos dejan de arrasar las algas',
        'El bosque de algas vuelve a crecer',
        'Regresan los peces que se crían entre las algas',
      ], ['Los erizos protegen a las algas de los peces'], 'Proteger un eslabón de la cadena puede recuperar todo el ecosistema.', { d: 3 }),
      vf('Toda área marina protegida prohíbe la pesca en toda su superficie.', false, 'Solo las zonas de protección total prohíben toda extracción. Muchas áreas combinan zonas estrictas con zonas de uso regulado.', { // e7c
        razones: ['+Porque muchas áreas combinan zonas con reglas distintas', '-Porque ninguna área prohíbe la pesca', '-Porque las áreas protegidas no tienen reglas'],
        d: 1,
      }),
      det('Leé esta nota y marcá lo equivocado.', [ // e8
        ['La meta mundial es conservar el 30 % de los mares para 2030.', false],
        ['Ya se protege de forma total el 30 % del océano.', true, 'Solo algo más del 3 % tiene protección total o alta.'],
        ['No todas las áreas marinas protegidas protegen igual.', false],
        ['En cualquier área protegida está prohibido todo tipo de actividad.', true, 'Muchas permiten actividades reguladas; solo algunas son de protección total.'],
      ], 'Leer bien los números evita celebrar metas que todavía no se cumplieron.', { d: 2 }),
      comp('Completá.', 'La meta mundial es conservar el [30] % de los mares para 2030; con protección total o alta está algo más del [3] %; y un área que no protege en la práctica es un parque de [papel].', ['50', '15', 'cristal'], 'Tres datos clave sobre la protección del océano.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('El mar protegido de Argentina', 'Namuncurá-Banco Burdwood, Yaganes y el Sistema Nacional de Áreas Marinas Protegidas.', [
      teoria('Un sistema nacional', [
        'En 2013, Argentina creó su primera área marina protegida en alta mar: Namuncurá-Banco Burdwood, una meseta submarina al sur de la Isla de los Estados, con corales de agua fría, esponjas y una enorme diversidad de invertebrados, que funciona como criadero de muchas especies. En 2014, la Ley 27.037 creó el Sistema Nacional de Áreas Marinas Protegidas, con distintas categorías de manejo. Y en 2018, la Ley 27.490 creó dos áreas más: Yaganes, de unos 69.000 km², y Namuncurá-Banco Burdwood II, de unos 32.000 km².',
      ]),
      ord('Ordená estos hitos del mar protegido argentino.', [ // e1
        'Se crea el área Namuncurá-Banco Burdwood',
        'La Ley 27.037 crea el Sistema Nacional de Áreas Marinas Protegidas',
        'La Ley 27.490 crea Yaganes y Namuncurá-Banco Burdwood II',
      ], '2013, 2014 y 2018: en pocos años, Argentina armó un sistema de áreas marinas protegidas.', { d: 2, extremos: ['Más antiguo', 'Más reciente'] }),
      numv(3, (i) => { // e2
        const [y, b] = [[69000, 32000], [68834, 32336], [69000, 32000]][i];
        return {
          enunciado: [
            `Yaganes tiene unos ${y.toLocaleString('es-AR')} km² y Namuncurá-Banco Burdwood II unos ${b.toLocaleString('es-AR')} km². ¿Cuántos km² suman las dos áreas?`,
            `Según la ley, Yaganes tiene ${y.toLocaleString('es-AR')} km² y Namuncurá-Banco Burdwood II ${b.toLocaleString('es-AR')} km². ¿Cuánto suman? Redondeá al entero.`,
            `Si Yaganes mide unos ${y.toLocaleString('es-AR')} km² y Burdwood II unos ${b.toLocaleString('es-AR')} km², ¿cuántos km² agregó la ley de 2018?`,
          ][i],
          valor: y + b,
          unidad: 'km²',
          tol: 1,
          explicacion: `${y.toLocaleString('es-AR')} + ${b.toLocaleString('es-AR')} = ${(y + b).toLocaleString('es-AR')} km²: más de 100.000 km² de mar protegido, una superficie mayor que la de muchas provincias.`,
          ctx: `${y} km² más ${b} km².`,
        };
      }, { d: 1 }),
      teoria('Categorías', [
        'Dentro de las áreas marinas hay zonas con distintas reglas. En una reserva nacional marina estricta solo se permite investigación científica: no se pesca ni se extrae nada. En un parque nacional marino se protege la biodiversidad y se permiten actividades como la investigación y un turismo muy regulado. En una reserva nacional marina se permiten algunas actividades controladas, compatibles con la conservación.',
      ]),
      par('Uní cada categoría con lo que permite.', [ // e3
        ['Reserva nacional marina estricta', 'Solo investigación científica'],
        ['Parque nacional marino', 'Conservación con visitas muy reguladas'],
        ['Reserva nacional marina', 'Algunas actividades controladas'],
      ], 'Combinar categorías permite proteger estrictamente lo más frágil y regular lo demás.', { d: 2 }),
      op('¿Por qué el Banco Burdwood es un lugar valioso para proteger?', [ // e4
        'Tiene corales de agua fría y funciona como criadero',
        'Porque allí hay playas turísticas muy visitadas',
        ['Porque es una zona de pesca industrial muy intensa', 'Protegerlo es justamente limitar la presión sobre sus fondos.'],
        'Porque no tiene vida marina',
      ], 'Los fondos con corales y esponjas crecen muy lento: si se dañan, tardan décadas en recuperarse.', { d: 2 }),
      vf('En el Mar Argentino, las áreas marinas protegidas prohíben siempre todo tipo de actividad en toda su superficie.', false, 'Combinan zonas: algunas estrictas, donde solo se investiga, y otras donde se permiten actividades controladas.', { // e5
        razones: ['+Porque combinan zonas con reglas distintas', '-Porque en ellas se permite pescar sin límites', '-Porque no tienen ninguna regla'],
        d: 2,
      }),
      teoria('Controlar lo que está lejos', [
        'Proteger áreas en alta mar plantea un desafío: están lejos de la costa y son enormes. El control combina patrullajes de la Prefectura Naval y la Armada, seguimiento satelital de los buques pesqueros y campañas científicas. Pampa Azul, una iniciativa del Estado para la investigación del Mar Argentino, organiza campañas en estas áreas para conocer su biodiversidad y evaluar si la protección funciona.',
      ]),
      mult('¿Qué herramientas sirven para controlar un área marina lejana? Marcá todas.', [ // e6
        '+Seguimiento satelital de buques',
        '+Patrullajes navales',
        '+Campañas científicas periódicas',
        '-Carteles en la playa más cercana',
        '-Confiar en que nadie entre',
      ], 'La tecnología satelital cambió la posibilidad de controlar el mar abierto.', { d: 1 }),
      cad('Armá la cadena de cómo se crea un área marina protegida.', [ // e7
        'Los científicos identifican una zona de alto valor ecológico',
        'Se propone un área con zonas y reglas',
        'El Congreso sanciona una ley que la crea',
        'Se arma un plan de manejo y control',
        'Se monitorea si la biodiversidad se recupera',
      ], ['Se declara el área y nunca más se vuelve a medir'], 'Crear un área es el comienzo: sin plan de manejo y monitoreo, queda en los papeles.', { d: 2 }),
      est('Estimá cuántos km² de mar protegido sumaron las dos áreas creadas por la Ley 27.490 en 2018.', 101000, { min: 1000, max: 10000000, unidad: 'km²', escala: 'log' }, 'Unos 101.000 km²: Yaganes, con unos 69.000, y Namuncurá-Banco Burdwood II, con unos 32.000.', { d: 3 }),
      op('¿Qué permite el seguimiento satelital de los buques pesqueros?', [ // e7c
        'Ver en qué zonas navegan y pescan',
        'Pescar más rápido dentro de las reservas',
        ['Cambiar el clima en alta mar', 'Los satélites observan; no modifican el clima.'],
        'Evitar que los barcos usen combustible',
      ], 'Los datos satelitales permiten detectar si un buque entra a una zona protegida.', { d: 1 }),
      det('Leé esta nota y marcá lo equivocado.', [ // e8
        ['Namuncurá-Banco Burdwood está al sur de la Isla de los Estados.', false],
        ['La Ley 27.490 creó las áreas Yaganes y Namuncurá-Banco Burdwood II.', false],
        ['Las áreas marinas en alta mar no necesitan control porque están lejos.', true, 'Justamente por estar lejos necesitan control satelital y patrullajes.'],
        ['En una reserva estricta se permite la pesca de arrastre.', true, 'En una reserva estricta solo se permite la investigación.'],
      ], 'Conocer las áreas del propio país es el primer paso para defenderlas.', { d: 2 }),
      comp('Completá.', 'La primera área marina protegida de alta mar de Argentina es Namuncurá-Banco [Burdwood]; el sistema nacional lo creó la Ley [27.037]; y en una reserva marina [estricta] solo se permite investigación.', ['Valdés', '26.331', 'turística'], 'Tres datos clave sobre el mar protegido argentino.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Qué hace que funcionen', 'Sin extracción, controladas, antiguas, grandes y aisladas: las cinco características de una reserva marina efectiva.', [
      teoria('Cinco características', [
        'Un estudio publicado en la revista Nature en 2014 comparó 87 áreas marinas protegidas de todo el mundo. Encontró que su efectividad dependía de cinco características: que no se permita la extracción (sin pesca), que se controle bien el cumplimiento, que tengan más de 10 años, que sean grandes (más de 100 km²) y que estén aisladas por aguas profundas o arena. Las áreas con cuatro o cinco de esas características tenían mucha más biomasa de peces que las áreas con una o ninguna, que casi no se diferenciaban de las zonas sin protección.',
      ], { lista: ['Sin extracción', 'Control efectivo', 'Antigüedad de más de 10 años', 'Gran tamaño, más de 100 km²', 'Aislamiento natural'] }),
      mult('¿Qué características hacen efectiva una reserva marina, según el estudio de 2014? Marcá todas.', [ // e1
        '+No permitir la extracción',
        '+Control efectivo del cumplimiento',
        '+Tener más de 10 años',
        '+Ser grande',
        '-Estar pintada en un mapa aunque nadie la controle',
      ], 'Declarar no alcanza: hacen falta reglas fuertes, control, tiempo y tamaño.', { d: 2 }),
      rank('Ordená estas reservas de la más a la menos efectiva, según las cinco características.', [ // e2
        ['Sin pesca, controlada, de 20 años, grande y aislada', '5 de 5'],
        ['Sin pesca, controlada, de 12 años y grande', '4 de 5'],
        ['Sin pesca, pero sin control y de 2 años', '1 de 5'],
        ['Con pesca permitida, sin control y recién creada', '0 de 5'],
      ], 'La efectividad se acumula: cada característica suma.', { d: 2, extremos: ['Más efectiva', 'Menos efectiva'] }),
      teoria('El derrame de peces', [
        'Una reserva sin pesca bien protegida no solo beneficia a lo que está adentro. Los peces crecen, se reproducen más y algunos adultos y muchas larvas salen de la reserva hacia las zonas vecinas, donde pueden pescarse. Se lo llama efecto derrame. Por eso, en muchos lugares, los pescadores que al principio se oponían terminan defendiendo las reservas.',
      ]),
      cad('Armá la cadena del efecto derrame.', [ // e3
        'Se prohíbe pescar en una zona',
        'Los peces viven más y crecen más grandes',
        'Los peces grandes producen muchos más huevos',
        'Larvas y adultos salen hacia las zonas vecinas',
        'Mejora la pesca alrededor de la reserva',
      ], ['Los peces se quedan encerrados para siempre dentro de la reserva'], 'Proteger una parte puede mejorar el conjunto.', { d: 2 }),
      op('¿Por qué un pez grande aporta tanto a la población?', [ // e4
        'Produce muchísimos más huevos que uno chico',
        'Porque come a todos los peces chicos',
        ['Porque vive menos tiempo que los chicos', 'Suele vivir más; y cuanto más grande, más huevos.'],
        'Porque no necesita alimentarse',
      ], 'En muchas especies, la producción de huevos crece mucho más rápido que el tamaño.', { d: 2 }),
      numv(3, (i) => { // e5
        const [fuera, dentro] = [[20, 80], [15, 60], [30, 75]][i];
        return {
          enunciado: `Fuera de una reserva hay ${fuera} kg de peces por hectárea y dentro ${dentro} kg. ¿Cuántas veces más biomasa hay dentro?`,
          valor: dentro / fuera,
          unidad: 'veces',
          dec: 1,
          tol: 0.1,
          explicacion: `${dentro} ÷ ${fuera} = ${(dentro / fuera).toLocaleString('es-AR')} veces. Datos de ejemplo: en reservas bien protegidas, diferencias de varias veces son comunes.`,
          ctx: `${fuera} kg/ha fuera; ${dentro} kg/ha dentro.`,
        };
      }, { d: 1 }),
      teoria('Parques de papel', [
        'Un "parque de papel" es un área protegida que existe en la ley pero no en el agua: no tiene plan de manejo, ni presupuesto, ni control, o permite las mismas actividades que antes. Son un riesgo doble: no protegen, y dan la falsa impresión de que el problema está resuelto.',
      ]),
      clas('¿Es una señal de área efectiva o de parque de papel?', { // e6
        'Área efectiva': ['Plan de manejo aprobado y en marcha', 'Guardaparques y control satelital', 'Monitoreo científico periódico'],
        'Parque de papel': ['Sin presupuesto desde su creación', 'Se sigue pescando igual que antes', 'Nadie sabe dónde están sus límites'],
      }, 'Las señales de efectividad se ven en el agua, no en el decreto.', { d: 1 }),
      vf('Una reserva marina recién creada ya muestra todos sus beneficios en el primer año.', false, 'Los beneficios crecen con los años: los peces necesitan tiempo para crecer y reproducirse. El estudio de 2014 destacó la antigüedad de más de 10 años.', { // e7
        razones: ['+Porque los peces necesitan años para crecer y reproducirse', '-Porque las reservas nunca muestran beneficios', '-Porque los beneficios desaparecen con el tiempo'],
        d: 2,
      }),
      par('Uní cada característica con por qué importa.', [ // e8
        ['Sin extracción', 'Los peces pueden crecer y reproducirse'],
        ['Control efectivo', 'Las reglas se cumplen en el agua'],
        ['Antigüedad', 'Los ecosistemas tardan en recuperarse'],
        ['Tamaño grande', 'Protege especies que se mueven mucho'],
        ['Aislamiento', 'Dificulta la entrada ilegal'],
      ], 'Cada característica atiende una forma distinta en que una reserva puede fallar.', { d: 3 }),
      vf('Una reserva grande pero sin control funciona tan bien como una controlada.', false, 'El control es una de las cinco características clave: sin él, las reglas no se cumplen y la reserva se parece a una zona sin protección.', { // e8b
        razones: ['+Porque sin control las reglas no se cumplen', '-Porque el tamaño es lo único que importa', '-Porque el control empeora las reservas'],
        d: 1,
      }),
      det('Leé esta opinión y marcá lo equivocado.', [ // e9
        ['Las reservas sin pesca pueden mejorar la pesca en las zonas vecinas.', false],
        ['Una reserva chica, nueva y sin control protege tanto como una grande y antigua.', true, 'La efectividad depende del tamaño, la antigüedad y el control.'],
        ['Un parque de papel da la falsa impresión de que el mar está protegido.', false],
        ['Los peces grandes aportan menos huevos que los chicos.', true, 'Suelen aportar muchos más.'],
      ], 'La ciencia de las reservas marinas ayuda a diseñar áreas que funcionen.', { d: 2 }),
      comp('Completá.', 'Cuando los peces de una reserva salen hacia las zonas vecinas se habla del efecto [derrame]; un área que existe solo en la ley es un parque de [papel]; y las reservas más efectivas tienen más de [10] años.', ['rebote', 'agua', '100'], 'Tres ideas clave sobre la efectividad de las reservas marinas.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Costas que nos protegen', 'Marismas, dunas y humedales costeros: ecosistemas que frenan tormentas, guardan carbono y crían vida.', [
      teoria('Barreras naturales', [
        'Las costas no son solo playas para veranear. Las dunas amortiguan el oleaje y guardan arena que la playa recupera después de las tormentas. Las marismas —pastizales inundables en los bordes de estuarios y bahías— frenan las crecidas, filtran el agua y son criaderos de peces, cangrejos y aves. Cuando se urbanizan o se destruyen, las costas quedan más expuestas a la erosión, sobre todo con un mar que sube.',
      ]),
      par('Uní cada ecosistema costero con un servicio que brinda.', [ // e1
        ['Dunas', 'Amortiguan el oleaje y reservan arena'],
        ['Marismas', 'Frenan crecidas y crían peces y cangrejos'],
        ['Humedales costeros', 'Filtran el agua y albergan aves'],
        ['Praderas submarinas', 'Guardan carbono en el fondo'],
      ], 'Los ecosistemas costeros son infraestructura natural.', { d: 2 }),
      cad('Armá la cadena de por qué urbanizar las dunas aumenta la erosión.', [ // e2
        'Se construyen edificios sobre las dunas',
        'Las dunas ya no pueden moverse ni reponer arena',
        'Las tormentas se llevan la arena de la playa',
        'La playa no se recupera después de cada tormenta',
        'La costa retrocede y amenaza las construcciones',
      ], ['Los edificios fabrican arena nueva'], 'Destruir la barrera natural deja a la costa, y a las construcciones, más expuestas.', { d: 2 }),
      teoria('Casos argentinos', [
        'La Bahía de Samborombón, en la provincia de Buenos Aires, es un sitio Ramsar desde 1997: sus marismas albergan aves migratorias y una de las últimas poblaciones de venado de las pampas. Península Valdés, en Chubut, es Patrimonio Mundial desde 1999: allí se reproducen la ballena franca austral, elefantes y lobos marinos, y el avistaje de ballenas está regulado. Muchas localidades de la costa atlántica tienen problemas de erosión por haber urbanizado sus dunas.',
      ]),
      clas('¿Qué valor principal tiene cada lugar?', { // e3
        'Bahía de Samborombón': ['Marismas con aves migratorias', 'Refugio del venado de las pampas'],
        'Península Valdés': ['Reproducción de la ballena franca austral', 'Colonias de elefantes marinos'],
      }, 'Dos joyas de la costa argentina, protegidas por distintos reconocimientos internacionales.', { d: 2 }),
      teoria('Carbono azul', [
        'Las marismas y las praderas submarinas guardan carbono en sus suelos inundados, donde se descompone muy lentamente, durante siglos. A ese carbono se lo llama carbono azul. Cuando estos ecosistemas se destruyen, parte de ese carbono puede liberarse. Protegerlos es a la vez conservación, adaptación al cambio climático y mitigación.',
      ]),
      op('¿Por qué las marismas guardan tanto carbono?', [ // e4
        'El suelo inundado frena la descomposición',
        'Porque tienen árboles muy altos y muy viejos',
        ['Porque el agua salada fabrica carbono nuevo', 'El carbono viene de las plantas; el agua frena su descomposición.'],
        'Porque están cubiertas de cemento y asfalto',
      ], 'Lo viste con el suelo: menos oxígeno, descomposición más lenta, más carbono guardado.', { d: 3 }),
      vf('Proteger una marisma puede ser a la vez conservación, adaptación y mitigación del cambio climático.', true, 'Conserva biodiversidad, frena crecidas y tormentas (adaptación) y guarda carbono (mitigación). Es una solución basada en la naturaleza.', { // e5
        razones: ['+Porque conserva, amortigua crecidas y guarda carbono', '-Porque las marismas aumentan las inundaciones', '-Porque no tienen relación con el clima'],
        d: 2,
      }),
      numv(3, (i) => { // e6
        const [ha, tc] = [[1000, 200], [5000, 150], [2500, 250]][i];
        return {
          enunciado: `Si una marisma de ${ha.toLocaleString('es-AR')} hectáreas guarda en su suelo unas ${tc} toneladas de carbono por hectárea, ¿cuántas toneladas de carbono guarda en total?`,
          valor: ha * tc,
          unidad: 't de carbono',
          explicacion: `${ha.toLocaleString('es-AR')} × ${tc} = ${(ha * tc).toLocaleString('es-AR')} toneladas de carbono. Valores de ejemplo: destruir la marisma podría liberar parte de ese carbono.`,
          ctx: `${ha} ha; ${tc} t de carbono por hectárea.`,
        };
      }, { d: 1 }),
      mult('¿Qué acciones protegen las costas? Marcá todas.', [ // e7
        '+Conservar las dunas y no construir sobre ellas',
        '+Usar pasarelas para cruzar las dunas',
        '+Proteger las marismas de los rellenos',
        '-Circular con vehículos por las dunas',
        '-Sacar arena de la playa para construir',
      ], 'Muchas amenazas a las costas vienen de decisiones locales, que se pueden cambiar.', { d: 1 }),
      rank('Ordená estas respuestas a la erosión de una playa, de la más a la menos sostenible a largo plazo.', [ // e8
        ['Restaurar las dunas y ordenar la construcción', 'la más sostenible'],
        ['Reponer arena de forma periódica', 'temporal'],
        ['Construir un muro de hormigón', 'puede trasladar la erosión'],
        ['Seguir construyendo sobre las dunas', 'la menos sostenible'],
      ], 'Trabajar con la dinámica natural de la costa suele ser más duradero que pelear contra ella.', { d: 3, extremos: ['Más sostenible', 'Menos sostenible'] }),
      numv(3, (i) => { // e8b
        const [m, anos] = [[1.5, 20], [2, 15], [0.8, 30]][i];
        return {
          enunciado: `Si una costa sin dunas retrocede ${m.toLocaleString('es-AR')} metros por año, ¿cuántos metros retrocede en ${anos} años?`,
          valor: Math.round(m * anos * 10) / 10,
          unidad: 'metros',
          dec: 1,
          tol: 0.1,
          explicacion: `${m.toLocaleString('es-AR')} × ${anos} = ${(Math.round(m * anos * 10) / 10).toLocaleString('es-AR')} metros. Valores de ejemplo: con el mar subiendo, la erosión puede acelerarse.`,
          ctx: `${m} metros por año durante ${anos} años.`,
        };
      }, { d: 1 }),
      det('Leé este folleto turístico y marcá lo equivocado.', [ // e9
        ['Península Valdés es Patrimonio Mundial.', false],
        ['Las dunas son montones de arena sin ninguna función.', true, 'Amortiguan el oleaje y reservan arena para la playa.'],
        ['En Samborombón hay marismas con aves migratorias.', false],
        ['Pasear en cuatriciclo por las dunas ayuda a conservarlas.', true, 'Las compacta y destruye su vegetación.'],
      ], 'Disfrutar la costa también es cuidarla: las dunas no son un circuito de carreras.', { d: 2 }),
      comp('Completá.', 'El carbono guardado en marismas y praderas submarinas se llama carbono [azul]; las [dunas] amortiguan el oleaje; y la Bahía de Samborombón es un sitio [Ramsar].', ['negro', 'rocas', 'Kioto'], 'Tres ideas clave sobre las costas que nos protegen.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Gestionar con la gente', 'Pescadores, turismo, comunidades y control: cómo se sostiene un área protegida en el tiempo.', [
      teoria('Nadie cuida lo que no siente propio', [
        'Un área protegida afecta a personas: pescadores artesanales, operadores turísticos, comunidades costeras. Si se crea sin escucharlos, puede generar rechazo, incumplimiento y conflictos. La gestión participativa, o co-manejo, incluye a quienes usan el lugar en las decisiones: dónde poner las zonas, qué reglas, cómo controlar y cómo repartir los beneficios. Los estudios muestran que las áreas con apoyo local suelen cumplirse mejor.',
      ]),
      cad('Armá la cadena de por qué la participación mejora una reserva.', [ // e1
        'Pescadores y comunidades participan en el diseño',
        'Las reglas tienen en cuenta su conocimiento del lugar',
        'Sienten el área como propia',
        'Cumplen y ayudan a controlar',
        'La reserva funciona mejor',
      ], ['Los pescadores pierden todo interés en el mar'], 'La participación convierte a los usuarios en aliados del control.', { d: 2 }),
      teoria('Turismo de naturaleza', [
        'El turismo puede ser un gran aliado: el avistaje de ballenas en Península Valdés genera empleo e ingresos que dependen de que las ballenas sigan allí. Pero tiene que estar regulado: distancia mínima a los animales, cantidad de embarcaciones, horarios, capacitación de guías. Un turismo sin reglas puede estresar a la fauna y deteriorar el mismo lugar que atrae a los visitantes.',
      ]),
      mult('¿Qué reglas hacen sostenible el avistaje de fauna marina? Marcá todas.', [ // e2
        '+Distancia mínima a los animales',
        '+Límite de embarcaciones al mismo tiempo',
        '+Guías capacitados',
        '-Perseguir a las ballenas para una mejor foto',
        '-Alimentar a los lobos marinos',
      ], 'Las reglas protegen a los animales y también al negocio que depende de ellos.', { d: 1 }),
      numv(3, (i) => { // e3
        const [visit, gasto] = [[100000, 150], [60000, 200], [150000, 120]][i];
        return {
          enunciado: `Si ${visit.toLocaleString('es-AR')} turistas por temporada gastan en promedio ${gasto} dólares cada uno en una localidad por el avistaje, ¿cuántos dólares ingresan por temporada?`,
          valor: visit * gasto,
          unidad: 'dólares',
          explicacion: `${visit.toLocaleString('es-AR')} × ${gasto} = ${(visit * gasto).toLocaleString('es-AR')} dólares. Datos de ejemplo: muestran por qué la fauna viva puede valer más que la extracción.`,
          ctx: `${visit} turistas; ${gasto} USD cada uno.`,
        };
      }, { d: 1 }),
      teoria('Control y monitoreo', [
        'Un área necesita control para que sus reglas se cumplan: guardaparques, patrullajes, seguimiento satelital de embarcaciones y denuncias de la propia comunidad. Y necesita monitoreo: medir cada tanto la biodiversidad, las poblaciones de peces, el estado del fondo y de las costas, para saber si la protección funciona y ajustar las reglas. Todo eso requiere presupuesto sostenido.',
      ]),
      clas('¿Es una acción de control o de monitoreo?', { // e4
        'Control': ['Patrullar el área para evitar pesca ilegal', 'Seguir por satélite a los buques pesqueros', 'Multar a quien no respeta las reglas'],
        'Monitoreo': ['Contar peces en buceos periódicos', 'Medir la cobertura de algas del fondo', 'Registrar la cantidad de ballenas por temporada'],
      }, 'El control hace cumplir las reglas; el monitoreo dice si las reglas sirven.', { d: 1 }),
      op('Un área marina lleva 5 años sin presupuesto para control ni monitoreo. ¿Qué riesgo corre?', [ // e5
        'Volverse un parque de papel',
        'Recuperarse más rápido que las demás',
        ['Ninguno, porque ya está declarada por ley', 'La declaración sola no protege en el agua.'],
        'Convertirse en una reserva estricta',
      ], 'Sin recursos para control y monitoreo, la protección se queda en el papel.', { d: 2 }),
      teoria('Compartir los beneficios', [
        'Para que una reserva sea justa y duradera, los beneficios tienen que llegar a quienes asumen los costos. Si los pescadores artesanales pierden zonas de pesca, pueden participar del turismo, del monitoreo pagado o recibir apoyo durante la transición. Si nadie compensa a los que pierden, crece el rechazo.',
      ]),
      vf('Si una reserva perjudica a los pescadores artesanales, lo justo es que ellos asuman todos los costos solos.', false, 'Una reserva justa busca compartir beneficios y compensar costos: empleo en turismo o monitoreo, apoyo en la transición y participación en las decisiones.', { // e6
        razones: ['+Porque los costos y beneficios deben repartirse con justicia', '-Porque los pescadores nunca pierden nada', '-Porque las reservas no tienen beneficios'],
        d: 2,
      }),
      par('Uní cada problema con una solución de gestión.', [ // e7
        ['Pescadores que pierden zonas de pesca', 'Empleo en turismo y monitoreo pagado'],
        ['Barcos que entran de noche sin permiso', 'Seguimiento satelital y patrullajes'],
        ['No se sabe si la reserva funciona', 'Monitoreo científico periódico'],
        ['Turismo que estresa a la fauna', 'Reglas de distancia y cupos'],
      ], 'Cada problema de gestión tiene herramientas concretas.', { d: 2 }),
      ord('Ordená los pasos de un plan de manejo participativo.', [ // e8
        'Reunir a usuarios, comunidades, científicos y autoridades',
        'Acordar zonas y reglas con base en datos',
        'Definir cómo se controla y quién lo hace',
        'Monitorear resultados y publicarlos',
        'Revisar y ajustar las reglas cada cierto tiempo',
      ], 'Un plan de manejo es un ciclo, no un documento que se archiva.', { d: 2 }),
      op('¿Qué es el co-manejo de un área protegida?', [ // e8b
        'La gestión compartida entre Estado y usuarios',
        'Que cada pescador maneje su propia reserva',
        ['Que el área no tenga ninguna autoridad', 'Hay autoridad, pero decide junto con los usuarios.'],
        'Que solo decidan los turistas',
      ], 'El co-manejo suma el conocimiento y el compromiso de quienes usan el lugar.', { d: 1 }),
      det('Leé este plan de manejo y marcá lo que conviene corregir.', [ // e9
        ['Los pescadores artesanales participarán en la definición de las zonas.', false],
        ['No habrá presupuesto para control: confiamos en la buena voluntad.', true, 'Sin control, las reglas no se cumplen.'],
        ['Publicaremos cada año los resultados del monitoreo.', false],
        ['Las reglas no se revisarán nunca, aunque los datos muestren problemas.', true, 'Hay que ajustar las reglas según el monitoreo.'],
      ], 'Participación, control, monitoreo y ajuste: el ciclo de una reserva que funciona.', { d: 2 }),
      comp('Completá.', 'Incluir a los usuarios en las decisiones de un área es co-[manejo]; hacer cumplir las reglas es el [control]; y medir si la protección funciona es el [monitoreo].', ['descuido', 'rumor', 'marketing'], 'Tres claves para gestionar un área protegida con la gente.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: áreas protegidas del mar y la costa', 'Niveles de protección, áreas argentinas, efectividad, costas y gestión participativa, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: la nueva área marina', 'Una provincia patagónica quiere crear un área marina frente a su costa. Con los datos, armá una propuesta que funcione.', [
      teoria('La zona', [
        'La zona propuesta tiene 1.200 km². Incluye un bosque de algas donde se crían peces, una colonia de lobos marinos, playas con dunas, un banco de mariscos que explotan 40 familias de pescadores artesanales y una ruta por la que pasan buques pesqueros industriales. Una ONG propone prohibir toda actividad en toda el área; la cámara de pesca propone no prohibir nada.',
      ]),
      clas('Asigná una zona a cada sector.', { // e1
        'Protección estricta': ['Bosque de algas donde se crían peces', 'Colonia de lobos marinos'],
        'Uso regulado': ['Banco de mariscos de los pescadores artesanales', 'Playas con dunas para turismo con pasarelas'],
        'Fuera del área o con reglas de paso': ['Ruta de buques pesqueros industriales'],
      }, 'Una zonificación protege estrictamente lo más frágil y regula los usos compatibles.', { d: 3 }),
      op('¿Por qué conviene no prohibir todo en toda el área, como propone la ONG?', [ // e2
        'Puede generar rechazo e incumplimiento',
        'Porque prohibir no sirve para conservar',
        ['Porque los lobos marinos necesitan pesca industrial', 'No es por los lobos: es por la aceptación y el cumplimiento.'],
        'Porque la ley prohíbe las áreas estrictas',
      ], 'Proteger estrictamente lo clave y regular lo demás suele lograr más cumplimiento que prohibir todo sin acuerdo.', { d: 3 }),
      num('Si la zona estricta ocupa 300 km² de los 1.200 km² del área, ¿qué porcentaje del área es estricto?', 25, '%', '300 ÷ 1.200 × 100 = 25 %. Con más de 100 km² de zona estricta, cumple una de las cinco características de efectividad.', { ctx: '300 km² estrictos de 1.200 km² totales.', d: 1 }),
      mult('¿Qué debería incluir la propuesta para ser efectiva? Marcá todo.', [ // e4
        '+Participación de las 40 familias de pescadores',
        '+Control satelital de los buques',
        '+Monitoreo anual del bosque de algas',
        '+Presupuesto asegurado para varios años',
        '-Declarar el área y revisarla dentro de 30 años',
      ], 'Participación, control, monitoreo y presupuesto: sin ellos, el área sería un parque de papel.', { d: 2 }),
      rank('Ordená las prioridades del primer año.', [ // e5
        ['Acordar zonas y reglas con pescadores y comunidad', 'base del apoyo'],
        ['Poner en marcha el control de buques', 'evita daños inmediatos'],
        ['Hacer la línea de base científica', 'permite medir resultados'],
        ['Diseñar folletos turísticos', 'puede esperar'],
      ], 'Primero el acuerdo y el control; la ciencia en paralelo; la promoción, después.', { d: 3 }),
      vf('Si el área funciona, los pescadores artesanales podrían beneficiarse con el tiempo.', true, 'Por el efecto derrame, la pesca alrededor de la zona estricta puede mejorar, y el turismo regulado puede sumar ingresos.', { // e6
        razones: ['+Por el efecto derrame y el turismo regulado', '-Porque la reserva les regala pescado', '-Porque los pescadores nunca se ven afectados'],
        d: 2,
      }),
      det('La provincia redacta la ley. Marcá lo que conviene corregir.', [ // e7
        ['El bosque de algas será zona de protección estricta.', false],
        ['No se consultará a los pescadores para no demorar la ley.', true, 'Sin su participación, el área pierde apoyo y cumplimiento.'],
        ['Habrá monitoreo anual con resultados públicos.', false],
        ['El control se hará cuando haya presupuesto, sin fecha.', true, 'Sin control asegurado, el área corre riesgo de ser un parque de papel.'],
      ], 'Una buena ley de área marina define zonas, participación, control, monitoreo y recursos.', { d: 3 }),
    ]),
  ],
});
