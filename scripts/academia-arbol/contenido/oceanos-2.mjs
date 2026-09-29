import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// OCÉANOS Y RÍOS 2 — Pesca y alimentos del agua.
// De dónde viene el pescado, cuánto se puede pescar sin agotar, qué es la
// captura incidental, qué reglas ordenan el mar y cómo elegir pescado. Retoma
// lo renovable que se agota (tronco-1), la tragedia de los comunes
// (comunidad-1 si ya la hiciste) y la red marina (oceanos-1).

export default unidad({
  slug: 'oceanos-2',
  rama: 'agua_azul',
  orden: 2,
  nivel: 1,
  requiereTronco: 1,
  titulo: 'Pesca y alimentos del agua',
  bajada: 'Los peces se renuevan, pero no a cualquier ritmo. Cuánto se puede pescar, qué se pesca sin querer, qué reglas ordenan el mar y cómo elegir qué comer.',
  objetivos: [
    'Distinguir la pesca de captura de la acuicultura y conocer las pesquerías argentinas',
    'Explicar la sobrepesca y el rendimiento máximo sostenible',
    'Reconocer la captura incidental y las formas de reducirla',
    'Describir las reglas que ordenan la pesca y el problema de la pesca ilegal',
    'Aplicar criterios para elegir pescados y mariscos',
  ],
  repasa: ['oceanos-1', 'tronco-1', 'comunidad-1'],
  fuentes: ['fao-pesca-sofia', 'inidep', 'milla-201', 'pampa-azul', 'vida-silvestre'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Del mar al plato', 'Pesca de captura y acuicultura, las pesquerías argentinas y cuánto pescado comemos.', [
      teoria('Dos formas de producir', [
        'Los alimentos del agua se obtienen de dos formas: la pesca de captura, que saca peces, crustáceos y moluscos silvestres del mar, los ríos y los lagos; y la acuicultura, que los cría en estanques, jaulas o piletas.',
        'Según la FAO, en 2022 la acuicultura superó por primera vez a la pesca de captura en la producción mundial de animales acuáticos. Cada persona del mundo consume en promedio más de 20 kg de alimentos acuáticos por año.',
      ], { destacado: { valor: '> 20 kg', texto: 'de alimentos acuáticos por persona por año se consumen en promedio en el mundo, según la FAO.' } }),
      clas('¿Es pesca de captura o acuicultura?', { // e1
        'Pesca de captura': ['Un barco que pesca merluza en el Mar Argentino', 'Un pescador artesanal de sábalo en el Paraná', 'La pesca de calamar con luces de noche'],
        'Acuicultura': ['Truchas criadas en jaulas en un embalse patagónico', 'Pacú criado en estanques en el noreste', 'Mejillones cultivados en cuerdas'],
      }, 'Dos sistemas con impactos distintos que conviene conocer.', { d: 1 }),
      teoria('Las pesquerías argentinas', [
        'Argentina tiene una de las industrias pesqueras más importantes de América Latina. Las especies principales son el langostino patagónico, la merluza común (merluza hubbsi) y el calamar. La mayor parte de lo que se pesca se exporta.',
        'Mientras tanto, en Argentina se come mucho menos pescado que el promedio mundial. El INIDEP, el instituto nacional de investigación pesquera, estudia las poblaciones para recomendar cuánto se puede pescar.',
      ]),
      par('Uní cada especie con una característica de su pesquería.', [ // e2
        ['Langostino patagónico', 'Una de las principales exportaciones pesqueras'],
        ['Merluza común', 'Pez blanco clave del Mar Argentino'],
        ['Calamar', 'Se pesca de noche atrayéndolo con luces'],
        ['Sábalo', 'Pesca en el río Paraná'],
      ], 'Las pesquerías argentinas son muy diversas: del mar abierto al río.', { d: 2 }),
      vf('La mayor parte del pescado que se captura en Argentina se consume dentro del país.', false, 'La mayor parte se exporta. En Argentina se consume mucho menos pescado por persona que el promedio mundial.', { // e3
        razones: ['+Porque la mayor parte de la captura se exporta', '-Porque en Argentina no se pesca', '-Porque el pescado argentino no se puede exportar'],
        d: 2,
      }),
      numv(3, (i) => { // e4
        const mundo = [20.7, 20.7, 20.7][i];
        const pais = [6, 5, 7][i];
        return {
          enunciado: `Si en el mundo se consumen unos ${mundo.toLocaleString('es-AR')} kg de alimentos acuáticos por persona por año y en un país ${pais} kg, ¿cuántas veces más se consume en el promedio mundial? Redondeá a un decimal.`,
          valor: Math.round((mundo / pais) * 10) / 10,
          unidad: 'veces',
          dec: 1,
          tol: 0.1,
          explicacion: `${mundo.toLocaleString('es-AR')} ÷ ${pais} ≈ ${(Math.round((mundo / pais) * 10) / 10).toLocaleString('es-AR')} veces. Un país con mucho mar puede comer muy poco pescado.`,
        };
      }, { d: 2 }),
      teoria('La acuicultura: ventajas y problemas', [
        'La acuicultura puede producir alimento con menos presión sobre las poblaciones silvestres. Pero también tiene problemas: algunos peces criados comen harina de pescado hecha con peces silvestres; los desechos de las jaulas pueden contaminar el agua; y los peces que escapan pueden volverse invasores.',
        'Los moluscos que filtran el agua, como mejillones y ostras, no necesitan alimento agregado y suelen tener bajo impacto.',
      ]),
      mult('¿Qué problemas puede tener la acuicultura mal manejada? Marcá todos.', [ // e5
        '+Contaminación del agua por desechos',
        '+Escapes de especies exóticas',
        '+Uso de harina hecha con peces silvestres',
        '+Enfermedades que pasan a peces silvestres',
        '-Que los peces criados no se pueden comer',
      ], 'Bien manejada puede ser una gran aliada; mal manejada, traslada los problemas.', { d: 2 }),
      cad('Armá la cadena de por qué algunos peces de criadero dependen de peces silvestres.', [ // e6
        'Se crían peces carnívoros, como el salmón',
        'Necesitan alimento con proteína de pescado',
        'Se fabrica harina con peces silvestres chicos',
        'Se pescan más peces chicos en el mar',
      ], ['Los peces de criadero se alimentan solos de algas'], 'No toda acuicultura alivia la presión sobre el mar. Depende de qué se cría y cómo se alimenta.', { d: 3 }),
      op('¿Cuál de estas producciones acuícolas suele tener menor impacto?', [ // e7
        'Cultivo de mejillones en cuerdas',
        'Jaulas de salmón alimentado con harina de pescado',
        ['Estanques de camarones en manglares talados', 'Talar manglares para estanques es uno de los impactos más graves de la acuicultura.'],
        'Truchas en un lago con alimento en exceso',
      ], 'Los mejillones filtran el agua y no necesitan alimento agregado.', { d: 2 }),
      op('¿Qué institución estudia las poblaciones de peces del Mar Argentino y recomienda cuánto se puede pescar?', [
        'El INIDEP',
        'La Dirección Nacional de Vialidad',
        ['El Banco Central', 'No es su función: la investigación pesquera la hace el INIDEP.'],
        'El Servicio Meteorológico',
      ], 'El Instituto Nacional de Investigación y Desarrollo Pesquero aporta la base científica para las decisiones de pesca.', { d: 1 }),
      vf('En 2022, la acuicultura superó por primera vez a la pesca de captura en la producción mundial de animales acuáticos.', true, 'Así lo informó la FAO. Es un cambio histórico en cómo se producen los alimentos del agua.', {
        razones: ['+Porque así lo informó la FAO para 2022', '-Porque la acuicultura no existe en el mundo', '-Porque la pesca de captura es siempre mayor'],
        d: 2,
      }),
      det('Leé esta nota y marcá lo equivocado.', [ // e8
        ['La acuicultura ya produce más animales acuáticos que la pesca de captura.', false],
        ['Toda la acuicultura alivia la presión sobre los peces silvestres.', true, 'Algunos peces de criadero comen harina de peces silvestres.'],
        ['El langostino es una de las principales exportaciones pesqueras argentinas.', false],
        ['En Argentina se come más pescado que el promedio mundial.', true, 'Se come bastante menos que el promedio mundial.'],
      ], 'Conocer de dónde viene el pescado es el primer paso para elegir bien.', { d: 2 }),
      comp('Completá.', 'Criar peces o mariscos se llama [acuicultura]; las principales pesquerías del Mar Argentino son el langostino, la [merluza] y el [calamar].', ['agricultura', 'trucha', 'atún'], 'Las dos formas de producir y las pesquerías principales.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Cuánto se puede pescar', 'Rendimiento máximo sostenible, sobrepesca y el caso de la merluza argentina.', [
      teoria('Un recurso renovable, con límites', [
        'Los peces se reproducen, así que son un recurso renovable. Pero, como viste en el tronco, lo renovable se agota si se usa más rápido de lo que se repone. Si se pescan muchos adultos, quedan pocos para reproducirse, y la población baja.',
        'El rendimiento máximo sostenible es la mayor cantidad que se puede pescar año tras año sin que la población disminuya. Pescar por encima de ese límite es sobrepesca.',
      ]),
      cad('Armá la cadena de la sobrepesca.', [ // e1
        'Se pesca más de lo que la población repone',
        'Quedan menos adultos para reproducirse',
        'Nacen menos peces',
        'La población baja año tras año',
        'Las capturas caen y la pesquería puede colapsar',
      ], ['Cuantos más se pescan, más se reproducen'], 'La tragedia de los comunes en el mar: ganar hoy a costa de perder mañana.', { d: 2 }),
      teoria('La situación mundial', [
        'Según la FAO, en 2021 alrededor del 38 % de las poblaciones de peces del mundo evaluadas estaban sobreexplotadas, y alrededor del 62 % se pescaba dentro de límites biológicamente sostenibles. La proporción de poblaciones sobreexplotadas creció durante décadas.',
        'Las pesquerías bien gestionadas, con ciencia y controles, muestran que es posible recuperar poblaciones.',
      ], {
        datos: barras('Poblaciones de peces del mundo evaluadas por la FAO (2021)', '%', [
          ['Dentro de límites sostenibles', 62],
          ['Sobreexplotadas', 38],
        ], 'FAO, El estado mundial de la pesca y la acuicultura 2024.'),
      }),
      est('Estimá qué porcentaje de las poblaciones de peces evaluadas por la FAO estaban sobreexplotadas en 2021.', 38, { min: 0, max: 100, paso: 1, unidad: '%' }, 'Alrededor del 38 %. Más de un tercio de las poblaciones se pesca por encima de lo que pueden reponer.', { d: 2 }),
      teoria('El caso de la merluza argentina', [
        'A fines de la década de 1990, la merluza común del Mar Argentino sufrió una fuerte sobrepesca: se capturaba mucho más de lo recomendado por los científicos y la población de adultos cayó mucho. Se declaró la emergencia pesquera y se tomaron medidas: cierre de zonas de cría, límites de captura y, más adelante, cuotas por empresa.',
        'Con el tiempo, la población mostró señales de recuperación. El caso muestra que la ciencia y las reglas pueden revertir la sobrepesca, aunque cuesta y requiere controles.',
      ]),
      ord('Ordená lo que pasó con la merluza argentina.', [ // e2
        'Se pesca muy por encima de lo recomendado',
        'La población de adultos cae fuertemente',
        'Se declara la emergencia pesquera',
        'Se cierran zonas de cría y se fijan límites',
        'La población muestra señales de recuperación',
      ], 'Un ciclo de crisis y recuperación que deja lecciones para otras pesquerías.', { d: 2, extremos: ['Primero', 'Último'] }),
      numv(3, (i) => { // e3
        const pob = [1000, 500, 2000][i];
        const crec = [10, 20, 15][i];
        const pesca = [150, 80, 250][i];
        return {
          enunciado: `Una población de peces de ${pob.toLocaleString('es-AR')} mil toneladas crece un ${crec} % por año si no se pesca. Si se pescan ${pesca} mil toneladas por año, ¿cuántas mil toneladas quedan después de un año?`,
          valor: pob + (pob * crec) / 100 - pesca,
          unidad: 'mil toneladas',
          explicacion: `Crece ${(pob * crec) / 100} y se pescan ${pesca}: ${pob.toLocaleString('es-AR')} + ${(pob * crec) / 100} − ${pesca} = ${(pob + (pob * crec) / 100 - pesca).toLocaleString('es-AR')}. ${pesca > (pob * crec) / 100 ? 'Se pesca más de lo que crece: la población baja.' : 'Se pesca menos de lo que crece: la población se mantiene o sube.'}`,
        };
      }, { d: 3 }),
      vf('Si un recurso es renovable, se puede pescar la cantidad que se quiera.', false, 'Se renueva a un ritmo. Si se pesca más rápido de lo que se repone, la población baja y puede colapsar.', { // e4
        razones: ['+Porque se renueva a un ritmo que no se puede superar', '-Porque los peces no se reproducen', '-Porque los recursos renovables son infinitos'],
        d: 1,
      }),
      par('Uní cada concepto con su definición.', [ // e5
        ['Rendimiento máximo sostenible', 'Lo máximo que se puede pescar sin que la población baje'],
        ['Sobrepesca', 'Pescar más de lo que la población repone'],
        ['Población sobreexplotada', 'Población reducida por pescar de más'],
        ['Recuperación', 'La población vuelve a crecer al bajar la presión'],
      ], 'Cuatro conceptos para leer cualquier noticia sobre pesca.', { d: 2 }),
      clas('¿Esta situación indica sobrepesca o una pesquería sana?', { // e6
        'Posible sobrepesca': ['Cada año se pescan peces más chicos', 'Hay que ir más lejos para capturar lo mismo', 'Las capturas caen aunque se pesque más tiempo'],
        'Pesquería sana': ['Las capturas se mantienen con el mismo esfuerzo', 'Hay peces de todas las tallas', 'La población se mantiene según los estudios científicos'],
      }, 'Las señales de sobrepesca aparecen antes del colapso: saber leerlas permite actuar a tiempo.', { d: 3 }),
      mult('¿Qué medidas se tomaron frente a la crisis de la merluza argentina? Marcá todas.', [
        '+Cierre de zonas de cría',
        '+Límites de captura',
        '+Cuotas por empresa',
        '-Duplicar la flota pesquera',
        '-Eliminar los controles en los puertos',
      ], 'Reglas basadas en la ciencia, y controles para que se cumplan.', { d: 2 }),
      op('En una pesquería, cada año los peces capturados son más chicos. ¿Qué puede indicar?', [
        'Una posible sobrepesca',
        'Que los peces se alimentan mejor',
        ['Que el agua está más limpia', 'El tamaño de captura no depende de eso: cuando faltan adultos grandes, suele haber sobrepesca.'],
        'Que las redes son nuevas',
      ], 'Si se pescan los adultos más rápido de lo que crecen, quedan peces cada vez más jóvenes y chicos.', { d: 2 }),
      det('Leé esta opinión y marcá lo equivocado.', [ // e7
        ['Los peces son un recurso renovable.', false],
        ['Por eso nunca se pueden agotar.', true, 'Se agotan si se pescan más rápido de lo que se reponen.'],
        ['La merluza argentina sufrió sobrepesca a fines de los noventa.', false],
        ['Una población sobreexplotada nunca puede recuperarse.', true, 'Con reglas y controles, muchas poblaciones se recuperan.'],
      ], 'La sobrepesca tiene solución, pero requiere ciencia, reglas y controles.', { d: 2 }),
      comp('Completá.', 'Pescar más de lo que la población repone es [sobrepesca]; lo máximo que se puede pescar sin que baje es el rendimiento máximo [sostenible].', ['acuicultura', 'infinito'], 'Los dos conceptos centrales de la gestión pesquera.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Lo que se pesca sin querer', 'Captura incidental y descarte: aves, tortugas, delfines y peces juveniles, y cómo evitarlos.', [
      teoria('Captura incidental', [
        'La captura incidental es todo lo que queda atrapado en las redes o anzuelos sin ser la especie buscada: peces de otras especies, peces juveniles, tortugas marinas, delfines, lobos marinos, tiburones y aves. Muchas veces se tira de vuelta al mar muerta o moribunda: eso se llama descarte.',
        'En algunas pesquerías de arrastre, como la de langostino, el descarte de juveniles de merluza fue un problema importante estudiado en Argentina.',
      ]),
      mult('¿Qué puede quedar atrapado como captura incidental? Marcá todo.', [ // e1
        '+Aves marinas como albatros',
        '+Tortugas marinas',
        '+Delfines',
        '+Peces juveniles de otras especies',
        '-Solo la especie buscada',
      ], 'La captura incidental afecta a muchas especies que no son el objetivo de la pesca.', { d: 1 }),
      teoria('Albatros y anzuelos', [
        'En la pesca con palangre (líneas larguísimas con miles de anzuelos con carnada), los albatros y petreles se lanzan a comer la carnada mientras se cala la línea y quedan enganchados. Varias especies de albatros están amenazadas en buena parte por esta causa.',
        'Hay soluciones simples y baratas: líneas espantapájaros que ahuyentan a las aves, calar de noche, cuando las aves están menos activas, y agregar pesos para que los anzuelos se hundan rápido.',
      ]),
      cad('Armá la cadena de cómo una línea espantapájaros protege a los albatros.', [ // e2
        'El barco cala la línea con anzuelos y carnada',
        'Una línea con cintas flota detrás del barco',
        'Las cintas espantan a las aves de la zona de los anzuelos',
        'Los anzuelos se hunden sin que las aves lleguen',
        'Menos albatros mueren enganchados',
      ], ['La línea atrae más albatros para que coman'], 'Una solución barata con un efecto enorme sobre especies amenazadas.', { d: 2 }),
      par('Uní cada problema con una solución.', [ // e3
        ['Albatros enganchados en palangres', 'Líneas espantapájaros y calado nocturno'],
        ['Tortugas en redes de arrastre', 'Dispositivos excluidores de tortugas'],
        ['Juveniles de merluza en la pesca de langostino', 'Dispositivos de selectividad en las redes'],
        ['Delfines en redes', 'Alarmas acústicas y cambios de zona'],
      ], 'Casi todos los problemas de captura incidental tienen soluciones técnicas conocidas.', { d: 3 }),
      vf('La captura incidental es un problema sin solución.', false, 'Hay soluciones probadas: líneas espantapájaros, dispositivos excluidores, redes selectivas y cierres de zonas o temporadas.', { // e4
        razones: ['+Porque existen soluciones técnicas probadas', '-Porque los animales se escapan solos siempre', '-Porque la captura incidental no existe'],
        d: 1,
      }),
      teoria('Redes más selectivas', [
        'Una red selectiva deja escapar a los peces demasiado chicos o a las especies que no se buscan: por ejemplo, con mallas de mayor tamaño o con rejillas que separan a los juveniles. Pescar con artes selectivas reduce el descarte y protege a los peces que todavía no se reprodujeron.',
      ]),
      clas('¿Esta práctica reduce la captura incidental o la aumenta?', { // e5
        'La reduce': ['Usar mallas más grandes', 'Instalar líneas espantapájaros', 'Evitar zonas de cría en temporada'],
        'La aumenta': ['Redes con malla muy fina', 'Calar de día con muchas aves alrededor', 'Pescar en zonas de concentración de juveniles'],
      }, 'Las decisiones de cómo, cuándo y dónde se pesca cambian mucho lo que se captura sin querer.', { d: 2 }),
      numv(3, (i) => { // e6
        const cap = [100, 200, 150][i];
        const desc = [30, 25, 40][i];
        return {
          enunciado: `Un barco captura ${cap} toneladas en total y el ${desc} % es descarte. ¿Cuántas toneladas se tiran al mar?`,
          valor: (cap * desc) / 100,
          unidad: 'toneladas',
          explicacion: `${cap} × ${desc} ÷ 100 = ${(cap * desc) / 100} t descartadas. Vida marina que se pierde sin alimentar a nadie.`,
        };
      }, { d: 1 }),
      op('¿Por qué conviene dejar escapar a los peces juveniles?', [ // e7
        'Porque todavía no se reprodujeron',
        'Porque tienen muy mal sabor al cocinarlos',
        ['Porque siempre son de otra especie distinta', 'Pueden ser de la misma especie buscada: el punto es que todavía no se reprodujeron.'],
        'Porque pesan demasiado para las redes',
      ], 'Pescar juveniles es pescar el futuro de la población.', { d: 1 }),
      vf('Calar los palangres de noche puede reducir la captura de aves marinas.', true, 'De noche, muchas aves marinas están menos activas y es menos probable que se lancen a la carnada.', {
        razones: ['+Porque de noche muchas aves están menos activas', '-Porque de noche no hay peces', '-Porque las aves duermen dentro del barco'],
        d: 2,
      }),
      op('Un barco palangrero quiere reducir la muerte de albatros con poco costo. ¿Qué conviene?', [
        'Líneas espantapájaros y calado nocturno',
        'Dejar de usar carnada en los anzuelos',
        ['Pescar más cerca de las colonias de aves', 'Aumentaría el riesgo: habría más aves alrededor.'],
        'Tirar restos de pescado al agua mientras se cala',
      ], 'Medidas baratas y probadas que salvan miles de aves por año donde se aplican.', { d: 2 }),
      det('Leé esta nota y marcá lo equivocado.', [ // e8
        ['Los albatros pueden quedar enganchados en los palangres.', false],
        ['El descarte no afecta a la población porque los peces vuelven al mar.', true, 'Muchos vuelven muertos o moribundos.'],
        ['Las líneas espantapájaros reducen la mortalidad de aves.', false],
        ['Las mallas más finas hacen más selectiva la pesca.', true, 'Las mallas más grandes dejan escapar a los chicos; las finas capturan más juveniles.'],
      ], 'Lo que se pesca sin querer también cuenta.', { d: 2 }),
      comp('Completá.', 'Lo que queda atrapado sin ser la especie buscada es captura [incidental]; lo que se tira de vuelta al mar es el [descarte].', ['principal', 'reciclaje'], 'Dos conceptos para entender el costo oculto de la pesca.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Las reglas del mar', 'Tallas mínimas, vedas, cuotas, zonas cerradas y la pesca ilegal en la milla 201.', [
      teoria('Herramientas de gestión', [
        'Para que la pesca sea sostenible se usan varias reglas: tallas mínimas (no se pueden quedar peces más chicos que cierto tamaño); vedas (temporadas o zonas donde no se puede pescar, por ejemplo durante la reproducción); cuotas (límites de captura por año, por barco o por empresa); y áreas marinas protegidas, donde la pesca está restringida.',
        'Las recomendaciones científicas, como las del INIDEP en Argentina, sirven de base para fijar estas reglas.',
      ]),
      par('Uní cada regla con su objetivo.', [ // e1
        ['Talla mínima', 'Que los peces se reproduzcan antes de ser pescados'],
        ['Veda', 'Proteger la reproducción o las zonas de cría'],
        ['Cuota', 'Limitar cuánto se pesca en total'],
        ['Área marina protegida', 'Dar refugio a las especies y sus hábitats'],
      ], 'Cuatro reglas que se complementan para que la pesca dure.', { d: 2 }),
      teoria('La zona económica exclusiva', [
        'Cada país costero tiene derechos sobre los recursos del mar hasta las 200 millas náuticas de su costa: es su zona económica exclusiva. Argentina regula la pesca en su zona y controla a los barcos que operan en ella.',
        'Justo afuera, en la llamada "milla 201", operan flotas extranjeras —sobre todo de calamar— en aguas internacionales. Algunas ingresan ilegalmente a la zona argentina. Se controlan con patrullas y con seguimiento satelital de los barcos.',
      ]),
      vf('En la "milla 201" se aplican las mismas reglas de pesca que dentro de la zona económica exclusiva argentina.', false, 'Es aguas internacionales, fuera de la jurisdicción argentina. Allí operan flotas extranjeras, algunas de las cuales entran ilegalmente a la zona argentina.', { // e2
        razones: ['+Porque está fuera de la zona económica exclusiva argentina', '-Porque la milla 201 es un puerto argentino', '-Porque allí está prohibida toda pesca'],
        d: 2,
      }),
      cad('Armá la cadena de por qué la pesca ilegal afecta a todos.', [ // e3
        'Barcos ilegales pescan sin respetar cuotas ni vedas',
        'Se captura más de lo que las poblaciones reponen',
        'Las poblaciones bajan',
        'Los pescadores que cumplen las reglas capturan menos',
        'Se pierden trabajo, alimento y biodiversidad',
      ], ['La pesca ilegal hace crecer las poblaciones'], 'La pesca ilegal perjudica a los ecosistemas y también a quienes pescan legalmente.', { d: 2 }),
      num('Una milla náutica equivale a 1,852 km. ¿A cuántos kilómetros de la costa llega una zona económica exclusiva de 200 millas? Redondeá al entero.', 370, 'km', '200 × 1,852 ≈ 370 km. Un territorio marino enorme que hay que controlar.', { tol: 1, d: 2 }),
      clas('¿Es una regla de gestión pesquera o una práctica ilegal?', { // e5
        'Regla de gestión': ['Cerrar una zona de cría durante la reproducción', 'Fijar una cuota anual de captura', 'Exigir un sistema de seguimiento satelital a los barcos'],
        'Práctica ilegal': ['Pescar dentro de la zona económica exclusiva sin permiso', 'Apagar el sistema de seguimiento para esconderse', 'Descargar capturas sin declarar'],
      }, 'Las reglas funcionan si hay controles. La pesca ilegal busca justamente evadirlos.', { d: 2 }),
      teoria('Áreas marinas protegidas', [
        'Las áreas marinas protegidas funcionan como refugios: allí los peces crecen, se reproducen y "desbordan" hacia las zonas cercanas, donde se puede pescar. Argentina creó áreas marinas protegidas como Namuncurá-Banco Burdwood y Yaganes, en el sur del Mar Argentino.',
      ]),
      op('¿Por qué un área marina protegida puede beneficiar también a la pesca?', [ // e6
        'Porque los peces crecen allí y se desbordan a zonas vecinas',
        'Porque en el área protegida se pesca sin límites',
        ['Porque los peces no pueden salir del área', 'Justamente salen: los que crecen protegidos llegan a zonas donde se puede pescar.'],
        'Porque atrae barcos pesqueros de otros países',
      ], 'Un refugio bien ubicado funciona como una "cuenta de ahorro" de peces.', { d: 2 }),
      mult('¿Qué ayuda a controlar la pesca ilegal? Marcá todo.', [ // e7
        '+Seguimiento satelital de los barcos',
        '+Patrullas en el mar',
        '+Cooperación entre países',
        '+Controles en los puertos donde se descarga',
        '-Eliminar las cuotas de captura',
      ], 'Vigilar en el mar, en los puertos y desde el espacio, y cooperar entre países.', { d: 1 }),
      rank('Ordená estas zonas del mar desde la costa hacia afuera.', [
        ['Mar territorial', 'hasta las 12 millas'],
        ['Zona contigua', 'hasta las 24 millas'],
        ['Zona económica exclusiva', 'hasta las 200 millas'],
        ['Aguas internacionales', 'desde la milla 201'],
      ], 'Distintos derechos según la distancia a la costa. La pesca se regula sobre todo en la zona económica exclusiva.', { d: 3, extremos: ['Más cerca de la costa', 'Más lejos'] }),
      vf('El seguimiento satelital permite saber dónde está un barco pesquero en cada momento.', true, 'Los barcos llevan equipos que transmiten su posición. Si lo apagan en zonas sospechosas, es una señal de alerta.', {
        razones: ['+Porque los barcos transmiten su posición', '-Porque los satélites no ven el mar', '-Porque los barcos no pueden moverse de noche'],
        d: 1,
      }),
      det('Leé esta nota y marcá lo equivocado.', [ // e8
        ['Argentina tiene derechos sobre la pesca hasta las 200 millas.', false],
        ['Las vedas buscan que se pesque más durante la reproducción.', true, 'Las vedas protegen la reproducción, prohibiendo o limitando la pesca.'],
        ['Algunos barcos extranjeros entran ilegalmente a la zona argentina.', false],
        ['Las áreas marinas protegidas perjudican siempre a los pescadores.', true, 'Pueden beneficiarlos, porque los peces crecen allí y se desbordan a zonas vecinas.'],
      ], 'Las reglas del mar protegen a los peces y, a largo plazo, a quienes viven de ellos.', { d: 2 }),
      comp('Completá.', 'Un país tiene derechos sobre la pesca hasta las [200] millas; afuera, en la milla [201], operan flotas extranjeras; y una [veda] protege la reproducción.', ['12', '50', 'cuota'], 'Tres conceptos del ordenamiento pesquero.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Qué pescado elegir', 'Variedad de especies, tallas, temporadas, origen y sellos: cómo elegir pescado y mariscos con menos impacto.', [
      teoria('Diversificar', [
        'Cuando todo el mundo quiere las mismas dos o tres especies, la presión sobre ellas crece. Comer una mayor variedad de especies —pescados menos conocidos que se capturan en buen estado, como la anchoíta, la caballa, la pescadilla o la corvina— reparte la presión.',
        'Los pescados chicos, como la anchoíta y la sardina, además, suelen estar más abajo en la red trófica, crecen rápido y son muy nutritivos.',
      ]),
      op('¿Qué práctica reparte la presión sobre las especies más pescadas?', [ // e1
        'Comer una variedad mayor de especies',
        'Comer siempre la misma especie más conocida',
        ['Comer solo langostinos importados', 'Concentrar el consumo en una especie aumenta la presión sobre ella.'],
        'Comprar el pescado más grande de la pescadería',
      ], 'La variedad es una forma simple de cuidar las poblaciones.', { d: 1 }),
      teoria('Talla y temporada', [
        'Comprar pescado de talla adecuada evita alentar la captura de juveniles. Respetar las temporadas —no comprar especies en veda— también ayuda. En los ríos, por ejemplo, hay temporadas de veda para proteger la reproducción de especies como el dorado o el surubí.',
      ]),
      clas('¿Esta elección de compra ayuda a la pesca sostenible o no?', { // e2
        'Ayuda': ['Elegir especies poco conocidas pero abundantes', 'Preguntar el origen del pescado', 'Respetar las vedas de los ríos'],
        'No ayuda': ['Pedir filetes de peces juveniles', 'Comprar especies en veda', 'Elegir siempre la misma especie sobreexplotada'],
      }, 'Cada compra envía una señal hacia atrás en la cadena, hasta el barco.', { d: 2 }),
      teoria('Origen y sellos', [
        'Saber de dónde viene un pescado y cómo se pescó ayuda a elegir. Algunos pescados tienen sellos de certificación, como el de pesca sostenible del Marine Stewardship Council (MSC), otorgado por certificadoras independientes a pesquerías que cumplen un estándar. Para la acuicultura existen otros sellos.',
        'Como viste en la rama de Consumo, un sello vale si es independiente y verificable.',
      ]),
      mult('¿Qué conviene preguntar al comprar pescado? Marcá todo.', [ // e3
        '+¿Qué especie es?',
        '+¿De dónde viene?',
        '+¿Cómo se pescó o se crió?',
        '+¿Está en veda?',
        '-¿Tiene el envase más colorido?',
      ], 'Cuatro preguntas que convierten una compra en una decisión informada.', { d: 1 }),
      vf('Un sello de pesca sostenible vale lo mismo lo otorgue quien lo otorgue.', false, 'Vale si lo otorga una certificadora independiente con un estándar público y verificable. Si lo pone la propia marca, es una autodeclaración.', { // e4
        razones: ['+Porque importa que sea independiente y verificable', '-Porque todos los sellos son oficiales', '-Porque los sellos no existen en la pesca'],
        d: 2,
      }),
      teoria('Pescado y huella', [
        'Comparado con la carne vacuna, la mayoría de los pescados capturados en pesquerías bien gestionadas tienen una huella de carbono mucho menor por kilo de proteína, como viste en la rama de Alimentación. Pero hay excepciones: el langostino de criadero en zonas donde se talaron manglares, o especies pescadas con barcos que gastan muchísimo combustible, pueden tener huellas altas.',
      ]),
      rank('Ordená estas opciones de pescado por su impacto típico, de menor a mayor.', [ // e5
        ['Mejillones cultivados en cuerdas', 'muy bajo'],
        ['Anchoíta de una pesquería bien gestionada', 'bajo'],
        ['Merluza de una pesquería con cuotas y controles', 'moderado'],
        ['Langostino de criadero en manglares talados', 'alto'],
      ], 'El impacto depende de la especie y, sobre todo, de cómo se produce.', { d: 3, extremos: ['Menor impacto', 'Mayor impacto'] }),
      par('Uní cada pregunta con por qué importa.', [ // e6
        ['¿Qué especie es?', 'Algunas están sobreexplotadas y otras no'],
        ['¿Qué talla tiene?', 'Evita alentar la captura de juveniles'],
        ['¿Está en veda?', 'Protege la reproducción'],
        ['¿Tiene un sello independiente?', 'Indica una pesquería evaluada'],
      ], 'Cada pregunta apunta a un aspecto distinto de la sostenibilidad.', { d: 2 }),
      numv(3, (i) => { // e7
        const kg = [2, 3, 1][i];
        const v = [4, 3, 5][i];
        return {
          enunciado: `Una familia come ${kg} kg de merluza por mes. Si reparte ese consumo entre ${v} especies distintas por igual, ¿cuántos kg de merluza come por mes?`,
          valor: Math.round((kg / v) * 100) / 100,
          unidad: 'kg',
          dec: 2,
          tol: 0.02,
          explicacion: `${kg} ÷ ${v} ≈ ${(Math.round((kg / v) * 100) / 100).toLocaleString('es-AR')} kg. Diversificar reparte la presión entre varias especies.`,
        };
      }, { d: 1 }),
      est('Estimá cuántos kilos de alimentos acuáticos por persona por año se consumen en promedio en el mundo.', 20.7, { min: 1, max: 100, unidad: 'kg', escala: 'log' }, 'Unos 20,7 kg según la FAO para 2022. En Argentina, bastante menos.', { d: 2 }),
      op('¿Por qué los pescados chicos, como la anchoíta, suelen ser una buena opción?', [
        'Crecen rápido, abundan y están abajo en la red',
        'Porque son los más caros de la pescadería',
        ['Porque no tienen nutrientes', 'Al contrario: son muy nutritivos.'],
        'Porque vienen siempre de otros países',
      ], 'Especies de crecimiento rápido y abundantes, pescadas con buena gestión, tienen menor impacto.', { d: 2 }),
      det('Leé estos consejos de una pescadería y marcá los equivocados.', [ // e8
        ['Probá especies menos conocidas, como la caballa o la corvina.', false],
        ['Los peces más chiquitos son los más sostenibles, aunque sean juveniles.', true, 'Los juveniles no se reprodujeron: comprarlos alienta pescar el futuro.'],
        ['Preguntá de dónde viene el pescado.', false],
        ['Cualquier sello en el paquete garantiza pesca sostenible.', true, 'Hay que verificar que sea independiente y verificable.'],
      ], 'Comprar pescado con criterio es parte de cuidar el mar.', { d: 2 }),
      comp('Completá.', 'Comer más [variedad] de especies reparte la presión; conviene no comprar peces [juveniles]; y un sello vale si es [independiente].', ['cantidad', 'grandes', 'colorido'], 'Tres criterios para elegir pescado con menos impacto.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: pesca y alimentos del agua', 'Captura y acuicultura, sobrepesca, captura incidental, reglas y elección, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: la pescadería del puerto', 'Una pescadería de un puerto patagónico quiere ofrecer pescado más sostenible. Con los datos, armá su plan.', [
      teoria('La pescadería', [
        'La pescadería vende 1.000 kg de pescado por semana: 700 kg de merluza, 200 kg de langostino y 100 kg de otras especies. Parte de la merluza que recibe son ejemplares chicos. Los clientes casi siempre piden merluza. Un proveedor ofrece anchoíta y caballa de pesquerías en buen estado, y mejillones de cultivo.',
        'Los estudios del instituto de investigación indican que la merluza de la zona está cerca de su límite de captura sostenible.',
      ]),
      num('¿Qué porcentaje de las ventas es merluza?', 70, '%', '700 ÷ 1.000 × 100 = 70 %. Casi todo el consumo se concentra en una especie cerca de su límite.', { ctx: '700 kg de merluza sobre 1.000 kg vendidos por semana.', d: 1 }),
      numv(3, (i) => { // e2
        const pct = [30, 40, 20][i];
        return {
          enunciado: `Si la pescadería reemplaza el ${pct} % de la merluza por anchoíta, caballa y mejillones, ¿cuántos kg de merluza vende por semana?`,
          valor: 700 * (1 - pct / 100),
          unidad: 'kg',
          explicacion: `700 × ${(1 - pct / 100).toLocaleString('es-AR')} = ${700 * (1 - pct / 100)} kg de merluza. La presión sobre la especie baja sin reducir las ventas totales.`,
        };
      }, { d: 2 }),
      mult('¿Qué medidas conviene tomar? Marcá todas.', [ // e3
        '+No comprar merluza por debajo de la talla mínima',
        '+Ofrecer anchoíta, caballa y mejillones',
        '+Explicar a los clientes por qué conviene variar',
        '+Pedir al proveedor información sobre el origen',
        '-Comprar más merluza chica porque es más barata',
      ], 'Talla, variedad, información y trazabilidad: un plan completo.', { d: 3 }),
      op('Los clientes siguen pidiendo merluza. ¿Qué estrategia tiene más chances de cambiar sus hábitos?', [ // e4
        'Degustaciones y recetas con las especies nuevas',
        'Dejar de vender merluza de golpe sin explicar nada',
        ['Subir mucho el precio de todas las especies', 'Puede alejar a los clientes sin ofrecer alternativas atractivas.'],
        'No decir nada y esperar que cambien solos',
      ], 'Hacerlo fácil y atractivo: probar, aprender a cocinarlo y ver que otros lo eligen.', { d: 3 }),
      cad('Armá la cadena de cómo la pescadería puede ayudar a la merluza.', [ // e5
        'La pescadería ofrece más variedad y explica por qué',
        'Los clientes prueban otras especies',
        'Se vende menos merluza',
        'La pescadería compra menos merluza y rechaza las chicas',
        'Baja la presión sobre la población de merluza',
      ], ['La merluza se reproduce más porque se vende en otra pescadería'], 'Una decisión comercial chica que empuja en la dirección correcta, junto con las reglas de pesca.', { d: 3 }),
      clas('Clasificá los argumentos que se escuchan en el puerto.', { // e6
        'Con fundamento': ['La merluza está cerca de su límite de captura', 'La anchoíta es abundante y muy nutritiva', 'Los mejillones de cultivo tienen bajo impacto'],
        'Sin fundamento': ['Los peces chicos son los más sostenibles', 'El mar es infinito', 'Si una especie se acaba, se cambia por otra y listo'],
      }, 'Decidir con datos del instituto y con la red marina en mente.', { d: 3 }),
      det('La pescadería escribe su plan. Marcá lo que no conviene.', [ // e7
        ['Solo compraremos merluza por encima de la talla mínima.', false],
        ['Venderemos juveniles de merluza a mitad de precio para no desperdiciarlos.', true, 'Alienta a seguir pescando juveniles; mejor rechazarlos en la compra.'],
        ['Ofreceremos degustaciones de caballa y anchoíta.', false],
        ['Como vendemos poco, lo que hagamos no cambia nada.', true, 'Cada comprador suma, y el ejemplo puede contagiar a otras pescaderías.'],
      ], 'Un buen plan cuida la especie, informa a los clientes y se sostiene en el tiempo.', { d: 3 }),
    ]),
  ],
});
