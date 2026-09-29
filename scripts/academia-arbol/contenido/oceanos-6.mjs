import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// OCÉANOS 6 — El océano de todos.
// Quién decide sobre el mar: las zonas de la Convención del Mar, el nuevo
// tratado de alta mar, los subsidios a la pesca, la minería del fondo marino
// y los ríos compartidos de la Cuenca del Plata. Retoma la pesca y la milla
// 201 (oceanos-2), las áreas marinas protegidas (oceanos-4), el océano que
// cambia (oceanos-5), los minerales (digital-4) y los conflictos (comunidad-4).

export default unidad({
  slug: 'oceanos-6',
  rama: 'agua_azul',
  orden: 6,
  nivel: 3,
  requiereTronco: 3,
  titulo: 'El océano de todos',
  bajada: 'Mar territorial, zona económica, alta mar y fondo marino: quién decide sobre cada parte del océano, qué cambió con el tratado de alta mar y cómo se comparten los grandes ríos.',
  objetivos: [
    'Distinguir las zonas marítimas de la Convención del Mar y los derechos en cada una',
    'Explicar el tratado de alta mar y sus pilares',
    'Analizar los subsidios a la pesca y el acuerdo de la OMC',
    'Evaluar el debate sobre la minería del fondo marino',
    'Reconocer los acuerdos para gestionar ríos compartidos como los de la Cuenca del Plata',
  ],
  repasa: ['oceanos-2', 'oceanos-4', 'oceanos-5', 'digital-4', 'comunidad-4'],
  fuentes: ['convemar', 'ley-27557-plataforma', 'bbnj', 'cdb-meta-3', 'omc-subsidios-pesca-2025', 'sumaila-2019', 'isa-preguntas', 'mongabay-mineria-2025', 'tratado-cuenca-plata', 'cij-papeleras-2010', 'agujero-azul', 'milla-201'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Quién manda en el mar', 'Mar territorial, zona económica exclusiva, plataforma continental, alta mar y la Zona: las reglas de la Convención del Mar.', [
      teoria('Las zonas del mar', [
        'La Convención de las Naciones Unidas sobre el Derecho del Mar, de 1982, divide el océano en zonas. Hasta las 12 millas náuticas desde la costa está el mar territorial, donde el país tiene soberanía. Hasta las 200 millas se extiende la zona económica exclusiva, donde el país tiene derechos para explorar, explotar y conservar los recursos. La plataforma continental es el lecho y el subsuelo, y puede extenderse más allá de las 200 millas si el país lo demuestra ante la Comisión de Límites de la ONU.',
        'Más allá de las zonas económicas está la alta mar, que abarca más del 60 % del océano y no pertenece a ningún país. Y el fondo marino fuera de las jurisdicciones nacionales, llamado "la Zona", es patrimonio común de la humanidad, administrado por la Autoridad Internacional de los Fondos Marinos.',
      ]),
      ord('Ordená las zonas del mar desde la costa hacia afuera.', [ // e1
        'Mar territorial, hasta las 12 millas',
        'Zona contigua, hasta las 24 millas',
        'Zona económica exclusiva, hasta las 200 millas',
        'Alta mar, más allá de las zonas económicas',
      ], 'Cuanto más lejos de la costa, menos derechos exclusivos tiene cada país.', { d: 1 }),
      numv(3, (i) => { // e2
        const millas = [12, 200, 24][i];
        const km = Math.round(millas * 1.852 * 10) / 10;
        return {
          enunciado: `Una milla náutica equivale a 1,852 km. ¿Cuántos km son ${millas} millas náuticas? Redondeá a un decimal.`,
          valor: km,
          unidad: 'km',
          dec: 1,
          tol: 0.1,
          explicacion: `${millas} × 1,852 ≈ ${km.toLocaleString('es-AR')} km. ${millas === 200 ? 'Por eso se habla de "la milla 201": el primer punto fuera de la zona económica.' : 'La milla náutica se usa porque corresponde a un minuto de arco de latitud.'}`,
          ctx: `${millas} millas náuticas; 1,852 km por milla.`,
        };
      }, { d: 1 }),
      par('Uní cada zona con los derechos del país costero.', [ // e3
        ['Mar territorial', 'Soberanía, como en su territorio'],
        ['Zona económica exclusiva', 'Derechos sobre los recursos del agua y el fondo'],
        ['Plataforma continental extendida', 'Derechos sobre el lecho y el subsuelo, no sobre el agua de arriba'],
        ['Alta mar', 'Ningún país tiene derechos exclusivos'],
      ], 'La plataforma extendida es un caso particular: el fondo tiene dueño, pero el agua de arriba es alta mar.', { d: 3 }),
      est('Estimá qué porcentaje del océano es alta mar.', 60, { min: 0, max: 100, paso: 5, unidad: '%' }, 'Más del 60 %: la mayor parte del océano no pertenece a ningún país.', { d: 2 }),
      teoria('La plataforma argentina', [
        'Argentina presentó durante años estudios ante la Comisión de Límites de la Plataforma Continental de la ONU, que emitió recomendaciones en 2016 y 2017. En 2020, la ley 27.557 fijó el límite exterior de la plataforma continental argentina según esas recomendaciones. Así, en algunas zonas, el país tiene derechos sobre el fondo marino y las especies que viven en él más allá de las 200 millas, aunque el agua de arriba sea alta mar.',
      ]),
      vf('Si un país tiene derechos sobre la plataforma continental más allá de las 200 millas, también controla toda la pesca en el agua de arriba.', false, 'Sus derechos alcanzan al lecho, el subsuelo y las especies sedentarias que viven en el fondo. El agua de arriba es alta mar, con otras reglas.', {
        razones: ['+Porque el agua de arriba sigue siendo alta mar', '-Porque la plataforma no le da ningún derecho', '-Porque en alta mar está prohibido pescar'],
        d: 3,
      }),
      clas('¿Qué parte del océano es cada caso?', { // e4
        'Bajo jurisdicción nacional': ['El agua a 50 millas de la costa de Chubut', 'El fondo del mar a 300 millas en la plataforma extendida argentina'],
        'Fuera de toda jurisdicción nacional': ['El agua a 250 millas de la costa, sobre la plataforma extendida', 'El fondo del océano en medio del Pacífico'],
      }, 'Agua y fondo pueden tener regímenes distintos en el mismo lugar.', { d: 3 }),
      op('¿Qué significa que el fondo marino internacional sea "patrimonio común de la humanidad"?', [ // e5
        'Que ningún país puede apropiárselo y se administra para todos',
        'Que cualquier empresa puede explotarlo sin permiso',
        ['Que pertenece al país que llegue primero', 'La Convención lo impide: lo administra una autoridad internacional.'],
        'Que está prohibido estudiarlo',
      ], 'Por eso la Autoridad Internacional de los Fondos Marinos decide sobre su uso.', { d: 2 }),
      mult('¿Qué derechos tiene un país en su zona económica exclusiva? Marcá todos.', [ // e6
        '+Explotar y conservar los peces',
        '+Explorar y explotar el petróleo y los minerales',
        '+Regular la investigación científica',
        '+Instalar parques eólicos marinos',
        '-Prohibir que otros barcos naveguen de paso',
      ], 'En la zona económica, otros países conservan la libertad de navegación.', { d: 3 }),
      det('Leé este texto de un manual y marcá lo que conviene revisar.', [ // e7
        ['El mar territorial llega hasta las 12 millas náuticas.', false],
        ['Más allá de las 200 millas, el mar pertenece al país más cercano.', true, 'Es alta mar: no pertenece a ningún país.'],
        ['La ley 27.557 fijó el límite exterior de la plataforma continental argentina.', false],
        ['El fondo marino internacional puede apropiárselo cualquier empresa.', true, 'Es patrimonio común de la humanidad, administrado por una autoridad internacional.'],
      ], 'Conocer las zonas del mar es la base para entender cualquier conflicto marino.', { d: 2 }),
      comp('Completá.', 'La zona económica exclusiva llega hasta las [200] millas; más allá está la alta [mar]; y el fondo marino internacional es patrimonio común de la [humanidad].', ['12', 'montaña', 'empresa'], 'Tres ideas para ubicarse en el mapa del océano.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Alta mar: un tratado nuevo', 'El acuerdo sobre la biodiversidad más allá de las jurisdicciones nacionales: qué regula y por qué importa.', [
      teoria('Un vacío que se llenó', [
        'Durante décadas, la alta mar tuvo reglas para la navegación o la pesca de algunas especies, pero no un marco para proteger su biodiversidad. En junio de 2023 se adoptó el Acuerdo sobre la diversidad biológica marina de las zonas situadas fuera de la jurisdicción nacional, conocido como tratado de alta mar. Alcanzó las 60 ratificaciones necesarias el 19 de septiembre de 2025 y entró en vigor el 17 de enero de 2026.',
      ], { destacado: { valor: '17/1/2026', texto: 'entró en vigor el tratado de alta mar, 120 días después de alcanzar las 60 ratificaciones.' } }),
      num('El tratado alcanzó las 60 ratificaciones el 19 de septiembre de 2025 y entró en vigor el 17 de enero de 2026. ¿Cuántos días pasaron?', 120, 'días', 'Del 19 de septiembre al 17 de enero hay 120 días: el plazo que fija el propio tratado para entrar en vigor.', { ctx: 'Del 19/9/2025 al 17/1/2026.', tol: 1, d: 2 }),
      teoria('Cuatro pilares', [
        'El tratado se apoya en cuatro pilares: los recursos genéticos marinos, con reglas para compartir los beneficios de su uso, por ejemplo en medicamentos; las herramientas de gestión por áreas, incluidas las áreas marinas protegidas en alta mar; las evaluaciones de impacto ambiental de actividades que puedan dañar el océano; y la creación de capacidades y transferencia de tecnología para que todos los países puedan participar. Es clave para la meta de proteger el 30 % del océano para 2030, porque sin áreas en alta mar esa meta es casi imposible.',
      ]),
      par('Uní cada pilar del tratado con un ejemplo.', [ // e1
        ['Recursos genéticos marinos', 'Compartir beneficios de un medicamento hecho con una esponja de alta mar'],
        ['Gestión por áreas', 'Crear un área marina protegida en alta mar'],
        ['Evaluación de impacto ambiental', 'Estudiar los efectos de una actividad antes de autorizarla'],
        ['Capacidades y tecnología', 'Formar científicos de países con menos recursos'],
      ], 'Los cuatro pilares buscan proteger la biodiversidad y repartir mejor sus beneficios.', { d: 2 }),
      op('¿Por qué el tratado de alta mar es clave para la meta de proteger el 30 % del océano para 2030?', [ // e2
        'Porque la alta mar es la mayor parte del océano',
        'Porque la alta mar ya está protegida por completo',
        ['Porque la meta solo incluye las costas', 'Incluye todo el océano, y la alta mar es más de la mitad.'],
        'Porque prohíbe toda actividad humana en el mar',
      ], 'Sin áreas protegidas en alta mar, el 30 % no se alcanza.', { d: 2 }),
      ord('Ordená el camino de un tratado internacional hasta que se aplica.', [ // e3
        'Los países negocian el texto',
        'Se adopta el texto acordado',
        'Los países lo firman',
        'Cada país lo ratifica según sus leyes',
        'Entra en vigor al alcanzar las ratificaciones necesarias',
      ], 'Firmar no alcanza: el tratado obliga a cada país cuando lo ratifica.', { d: 2 }),
      cad('Armá la cadena de cómo el tratado puede proteger un área de alta mar.', [ // e4
        'Varios países proponen proteger un área con mucha biodiversidad',
        'Se presentan estudios científicos y se consulta',
        'La conferencia de las partes del tratado la aprueba',
        'Los países aplican las medidas a sus barcos',
        'La biodiversidad del área tiene más protección',
      ], ['Un solo país puede cerrar la alta mar a los demás'], 'La protección en alta mar es una decisión colectiva, no de un solo país.', { d: 2 }),
      vf('El tratado de alta mar prohíbe toda la pesca en alta mar.', false, 'Crea herramientas para proteger áreas, evaluar impactos y compartir beneficios, pero no prohíbe toda la pesca. La pesca en alta mar sigue regulada también por organizaciones regionales de pesca.', {
        razones: ['+Porque crea herramientas de protección, no una prohibición total', '-Porque en alta mar no hay peces', '-Porque el tratado solo trata sobre barcos turísticos'],
        d: 2,
      }),
      est('¿Cuántas ratificaciones necesitaba el tratado de alta mar para entrar en vigor?', 60, { min: 1, max: 195, paso: 1, unidad: 'ratificaciones' }, 'Sesenta: se alcanzaron el 19 de septiembre de 2025.', { d: 2 }),
      clas('¿Qué regula el tratado de alta mar y qué no?', { // e5
        'Lo regula': ['Áreas marinas protegidas en alta mar', 'Evaluaciones de impacto de actividades en alta mar', 'Beneficios de los recursos genéticos marinos'],
        'No lo regula': ['La pesca dentro de la zona económica de un país', 'Los puertos de cada país', 'El mar territorial de las costas'],
      }, 'El tratado se ocupa de las zonas fuera de las jurisdicciones nacionales.', { d: 2 }),
      mult('¿Qué hace falta para que el tratado funcione de verdad? Marcá todo.', [ // e6
        '+Que muchos países lo ratifiquen',
        '+Ciencia para elegir las áreas a proteger',
        '+Controles de los barcos en alta mar',
        '+Financiamiento para los países con menos recursos',
        '-Que cada país decida solo sobre toda la alta mar',
      ], 'Un tratado vale por su aplicación: ratificación, ciencia, control y fondos.', { d: 1 }),
      det('Leé esta nota sobre el tratado y marcá lo que conviene revisar.', [ // e7
        ['El tratado entró en vigor en enero de 2026.', false],
        ['Con el tratado, un país puede adueñarse de un área de alta mar.', true, 'Las áreas se deciden en conjunto: la alta mar no pertenece a nadie.'],
        ['Incluye evaluaciones de impacto ambiental.', false],
        ['Firmar el tratado ya obliga a un país aunque no lo ratifique.', true, 'Obliga a quienes lo ratifican.'],
      ], 'Los tratados internacionales tienen reglas propias: firmar, ratificar, entrar en vigor.', { d: 2 }),
      comp('Completá.', 'El tratado de alta mar entró en vigor en [2026]; permite crear áreas marinas [protegidas] fuera de las jurisdicciones nacionales; y un país queda obligado cuando lo [ratifica].', ['1982', 'privadas', 'lee'], 'Tres ideas sobre el nuevo marco para la alta mar.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Subsidios y pesca ilegal', 'Dinero público que empuja a pescar de más, el acuerdo de la OMC y la pesca ilegal en alta mar.', [
      teoria('Subsidios que vacían el mar', [
        'Muchos gobiernos subsidian la pesca: pagan parte del combustible, de la construcción de barcos o de otros costos. Un estudio de 2019 estimó que los subsidios pesqueros del mundo sumaban unos 35.400 millones de dólares en 2018, de los cuales 22.200 millones eran subsidios que aumentan la capacidad de pesca, como los del combustible. Esos subsidios permiten que flotas enteras pesquen más lejos y más tiempo de lo que sería rentable, lo que alimenta la sobrepesca. Otros subsidios, en cambio, son beneficiosos, como los que financian la investigación o el control.',
      ], {
        datos: barras('Subsidios pesqueros en el mundo (2018)', 'miles de millones de dólares', [
          ['Aumentan la capacidad de pesca', 22.2],
          ['Beneficiosos (manejo, ciencia, control)', 10.6],
          ['Otros', 2.6],
        ], 'Sumaila y colegas (2019).'),
      }),
      num('Si de 35.400 millones de dólares de subsidios pesqueros, 22.200 millones aumentan la capacidad de pesca, ¿qué porcentaje representan? Redondeá al entero.', 63, '%', '22.200 ÷ 35.400 × 100 ≈ 63 %: casi dos de cada tres dólares empujan a pescar más.', { ctx: '22.200 de 35.400 millones de dólares.', tol: 1, d: 2 }),
      clas('¿Es un subsidio que aumenta la capacidad de pesca o uno beneficioso?', { // e1
        'Aumenta la capacidad': ['Combustible más barato para barcos pesqueros', 'Pagar parte de la construcción de barcos nuevos', 'Exenciones de impuestos a flotas de altura'],
        'Beneficioso': ['Financiar la investigación del estado de los stocks', 'Pagar controles contra la pesca ilegal', 'Crear y manejar áreas marinas protegidas'],
      }, 'No todos los subsidios son malos: los que financian ciencia y control ayudan a pescar mejor.', { d: 2 }),
      cad('Armá la cadena de cómo un subsidio al combustible puede llevar a la sobrepesca.', [ // e2
        'El gobierno paga parte del combustible de una flota',
        'Pescar lejos y por más tiempo se vuelve rentable',
        'Más barcos pescan en zonas y temporadas nuevas',
        'Se captura más de lo que las poblaciones reponen',
        'Los stocks bajan y la pesca futura se resiente',
      ], ['Subsidiar el combustible hace que se pesque menos'], 'Como viste con los subsidios que empujan al revés, el dinero público puede agravar el problema.', { d: 2 }),
      teoria('El acuerdo de la OMC', [
        'En 2022, los países de la Organización Mundial del Comercio acordaron un tratado sobre subsidios a la pesca, que entró en vigor el 15 de septiembre de 2025, cuando lo aceptaron dos tercios de los miembros. Prohíbe los subsidios a barcos que hagan pesca ilegal, no declarada y no reglamentada; a la pesca de poblaciones sobreexplotadas que no tengan medidas para recuperarlas; y a la pesca no regulada en alta mar. Es el primer acuerdo de la OMC centrado en la sostenibilidad ambiental.',
      ]),
      mult('¿Qué subsidios prohíbe el acuerdo de la OMC? Marcá todos.', [ // e3
        '+A barcos que hacen pesca ilegal, no declarada y no reglamentada',
        '+A la pesca de poblaciones sobreexplotadas sin plan de recuperación',
        '+A la pesca no regulada en alta mar',
        '-A la investigación científica sobre los stocks',
        '-A los controles contra la pesca ilegal',
      ], 'El acuerdo apunta a los subsidios más dañinos, no a los que ayudan a manejar mejor.', { d: 2 }),
      op('¿Por qué es importante un acuerdo global sobre subsidios a la pesca?', [ // e4
        'Porque las flotas subsidiadas pescan en aguas de muchos países',
        'Porque cada país pesca solo frente a su propia costa',
        ['Porque los subsidios no tienen ningún efecto en los peces', 'Los subsidios que aumentan la capacidad empujan a la sobrepesca.'],
        'Porque así se prohíbe toda la pesca comercial',
      ], 'Las flotas de altura operan lejos de casa: el problema es global y necesita reglas globales.', { d: 2 }),
      vf('Todos los subsidios a la pesca son dañinos y deberían eliminarse.', false, 'Los que financian investigación, control y áreas protegidas son beneficiosos. El problema son los que aumentan la capacidad de pesca más allá de lo que el mar soporta.', {
        razones: ['+Porque algunos financian ciencia, control y protección', '-Porque ningún subsidio tiene efecto', '-Porque la pesca no recibe subsidios'],
        d: 2,
      }),
      par('Uní cada sigla o término con su significado.', [ // e5
        ['Pesca INDNR', 'Pesca ilegal, no declarada y no reglamentada'],
        ['OMC', 'Organización Mundial del Comercio'],
        ['Stock sobreexplotado', 'Población que se pesca más de lo que se repone'],
        ['Subsidio de capacidad', 'Dinero que abarata pescar más, como el del combustible'],
      ], 'El vocabulario de la pesca internacional, para leer las noticias sobre la milla 201.', { d: 1 }),
      numv(3, (i) => { // e6
        const [costo, sub] = [[100000, 30], [80000, 40], [150000, 25]][i];
        return {
          enunciado: `Un viaje de pesca de altura cuesta ${costo.toLocaleString('es-AR')} dólares en combustible. Si un gobierno subsidia el ${sub} % del combustible, ¿cuánto paga la empresa?`,
          valor: costo * (100 - sub) / 100,
          unidad: 'dólares',
          explicacion: `${costo.toLocaleString('es-AR')} × ${100 - sub} % = ${(costo * (100 - sub) / 100).toLocaleString('es-AR')} dólares. Con ${(costo * sub / 100).toLocaleString('es-AR')} dólares menos de costo, viajes que no serían rentables pasan a serlo. Valores de ejemplo.`,
          ctx: `Combustible de ${costo} dólares; subsidio del ${sub} %.`,
        };
      }, { d: 1 }),
      det('Leé esta columna de opinión y marcá lo que conviene revisar.', [ // e7
        ['El acuerdo de la OMC sobre subsidios a la pesca entró en vigor en 2025.', false],
        ['El acuerdo prohíbe financiar la investigación sobre los peces.', true, 'Esos subsidios son beneficiosos y no están prohibidos.'],
        ['Casi dos tercios de los subsidios pesqueros aumentan la capacidad de pesca.', false],
        ['Los subsidios al combustible hacen que se pesque menos.', true, 'Abaratan pescar y empujan a pescar más.'],
      ], 'Las reglas del comercio también pueden cuidar el mar.', { d: 2 }),
      comp('Completá.', 'Los subsidios que abaratan pescar más son de [capacidad]; el acuerdo global sobre subsidios a la pesca es de la [OMC]; y la pesca ilegal, no declarada y no reglamentada se abrevia [INDNR].', ['investigación', 'OMS', 'ONU'], 'Tres ideas para entender el dinero detrás de la sobrepesca.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('El fondo del mar en disputa', 'Nódulos, minerales para baterías y un ecosistema que casi no conocemos: el debate sobre la minería en aguas profundas.', [
      teoria('Nódulos en el fondo', [
        'En las llanuras abisales, a miles de metros de profundidad, hay nódulos polimetálicos: piedras del tamaño de una papa ricas en manganeso, níquel, cobalto y cobre, metales usados en baterías. Se forman muy lentamente, a razón de apenas unos milímetros por millón de años. En el fondo marino internacional, la Autoridad Internacional de los Fondos Marinos otorgó permisos de exploración, pero todavía no aprobó las reglas para la explotación comercial.',
      ]),
      numv(3, (i) => { // e1
        const [cm, mm] = [[5, 5], [8, 4], [3, 10]][i];
        const millones = cm * 10 / mm;
        return {
          enunciado: `Un nódulo mide ${cm} cm y crece unos ${mm} mm por millón de años. ¿Cuántos millones de años tardó en formarse?`,
          valor: millones,
          unidad: 'millones de años',
          explicacion: `${cm} cm = ${cm * 10} mm; ${cm * 10} ÷ ${mm} = ${millones} millones de años. Lo que se extrae en un día tardó millones de años en formarse: a escala humana, no se renueva.`,
          ctx: `Nódulo de ${cm} cm; ${mm} mm por millón de años.`,
        };
      }, { d: 2 }),
      teoria('Qué está en juego', [
        'Quienes impulsan la minería submarina dicen que esos metales hacen falta para la transición energética. Quienes piden cautela señalan que el fondo abisal es uno de los ecosistemas menos conocidos del planeta, con muchas especies aún sin describir; que las máquinas remueven el fondo y levantan nubes de sedimento que pueden viajar lejos; y que las huellas de pruebas hechas hace décadas todavía son visibles. En 2025, decenas de países, entre ellos Brasil, Chile, México y Francia, pedían una pausa precautoria o una moratoria.',
      ]),
      clas('¿Es un argumento a favor de explotar ya o a favor de una pausa precautoria?', { // e2
        'A favor de explotar ya': ['Los metales se usan en baterías para la transición', 'Hay empresas con permisos de exploración listas para avanzar'],
        'A favor de una pausa': ['Muchas especies del fondo abisal ni siquiera están descritas', 'Las nubes de sedimento pueden afectar grandes áreas', 'Las huellas de pruebas antiguas siguen visibles décadas después'],
      }, 'El debate enfrenta necesidades de minerales con un gran desconocimiento del ecosistema.', { d: 2 }),
      cad('Armá la cadena de posibles impactos de la minería en el fondo abisal.', [ // e3
        'Una máquina recoge nódulos del fondo',
        'Remueve la capa superficial del sedimento',
        'Se levanta una nube de sedimento',
        'La nube se deposita sobre organismos a distancia',
        'La recuperación del fondo puede tardar décadas o más',
      ], ['Los nódulos vuelven a formarse en pocos meses'], 'En un ecosistema tan lento, los daños duran mucho más que la actividad.', { d: 2 }),
      est('Estimá a qué profundidad, en metros, suelen estar las llanuras abisales con nódulos.', 5000, { min: 0, max: 11000, paso: 100, unidad: 'm' }, 'A unos 4.000 a 6.000 metros: más profundo de lo que llega la luz y de lo que exploramos casi nunca.', { d: 2 }),
      ord('Ordená un enfoque precautorio frente a la minería del fondo marino.', [
        'Estudiar el ecosistema antes de cualquier explotación',
        'Evaluar los impactos con ciencia independiente',
        'Acordar reglas y dejar áreas protegidas sin minería',
        'Decidir si se autoriza y en qué condiciones',
        'Monitorear y poder frenar si aparecen daños',
      ], 'Precaución no es prohibir para siempre: es conocer antes de decidir, y poder frenar a tiempo.', { d: 2 }),
      op('¿Qué organismo administra el fondo marino fuera de las jurisdicciones nacionales?', [ // e4
        'La Autoridad Internacional de los Fondos Marinos',
        'La Organización Mundial del Comercio',
        ['El país más cercano a cada zona', 'Esa zona no pertenece a ningún país.'],
        'Las empresas mineras que llegan primero',
      ], 'Lo creó la Convención del Mar para administrar la Zona como patrimonio común.', { d: 1 }),
      vf('Como los nódulos están en el fondo del mar, extraerlos no afecta a ningún ecosistema.', false, 'El fondo abisal tiene su propia vida, en gran parte desconocida, y la extracción remueve el sedimento y genera nubes que se dispersan. Los impactos pueden durar décadas.', {
        razones: ['+Porque el fondo tiene vida y la extracción la altera por mucho tiempo', '-Porque en el fondo del mar no hay nada vivo', '-Porque los nódulos flotan en la superficie'],
        d: 1,
      }),
      teoria('Otras fuentes de metales', [
        'Como viste con la minería urbana, parte de los metales que se necesitan ya están en aparatos en desuso. Reciclar mejor las baterías, diseñarlas para que usen menos cobalto y alargar la vida de los aparatos reduce la presión por abrir nuevas fronteras mineras, en tierra o en el mar.',
      ]),
      mult('¿Qué puede reducir la presión por minar el fondo marino? Marcá todo.', [ // e5
        '+Reciclar mejor las baterías',
        '+Diseñar baterías con menos cobalto',
        '+Alargar la vida de los aparatos',
        '+Recuperar metales de la basura electrónica',
        '-Duplicar el recambio de celulares cada año',
      ], 'La economía circular también protege el fondo del mar.', { d: 1 }),
      par('Uní cada concepto con su significado.', [ // e6
        ['Nódulo polimetálico', 'Piedra del fondo marino rica en metales'],
        ['Llanura abisal', 'Fondo plano a miles de metros de profundidad'],
        ['Pausa precautoria', 'No explotar hasta conocer mejor los riesgos'],
        ['Nube de sedimento', 'Material del fondo que la máquina levanta y dispersa'],
      ], 'Cuatro conceptos para seguir un debate que recién empieza.', { d: 2 }),
      det('Leé este anuncio de una empresa y marcá lo que conviene revisar.', [ // e7
        ['Los nódulos contienen níquel, cobalto, cobre y manganeso.', false],
        ['La extracción no tendrá ningún impacto porque el fondo del mar está vacío.', true, 'El fondo abisal tiene vida, en gran parte aún desconocida.'],
        ['La Autoridad Internacional de los Fondos Marinos todavía no aprobó las reglas de explotación.', false],
        ['Los nódulos se regeneran en pocos años.', true, 'Crecen apenas unos milímetros por millón de años.'],
      ], 'En un debate con tanta incertidumbre, conviene desconfiar de las promesas de "impacto cero".', { d: 2 }),
      comp('Completá.', 'Las piedras del fondo marino ricas en metales son nódulos [polimetálicos]; crecen apenas unos milímetros por [millón] de años; y muchos países piden una pausa [precautoria].', ['plásticos', 'día', 'comercial'], 'Tres ideas para entender la minería en aguas profundas.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Ríos que se comparten', 'La Cuenca del Plata, el río Uruguay y los acuerdos entre países para usar y cuidar el agua que cruza fronteras.', [
      teoria('Una cuenca, cinco países', [
        'La Cuenca del Plata, con los ríos Paraná, Paraguay y Uruguay, es una de las más grandes del mundo y la comparten Argentina, Bolivia, Brasil, Paraguay y Uruguay. En 1969, esos cinco países firmaron en Brasilia el Tratado de la Cuenca del Plata para promover su desarrollo armónico e integración, y crearon un Comité Intergubernamental Coordinador como órgano permanente.',
      ]),
      est('¿Cuántos países comparten la Cuenca del Plata y firmaron su tratado en 1969?', 5, { min: 1, max: 12, paso: 1, unidad: 'países' }, 'Cinco: Argentina, Bolivia, Brasil, Paraguay y Uruguay.', { d: 1 }),
      teoria('Acuerdos por río', [
        'Además hay acuerdos por río. Para el río Uruguay, Argentina y Uruguay firmaron un estatuto en 1975 y crearon una comisión administradora binacional; cuando surgió el conflicto por una planta de celulosa, el caso llegó a la Corte Internacional de Justicia, que falló en 2010, como viste. Las grandes represas compartidas, como Yacyretá con Paraguay o Salto Grande con Uruguay, también se manejan de forma binacional.',
      ]),
      par('Uní cada acuerdo o institución con su ámbito.', [ // e1
        ['Tratado de la Cuenca del Plata', 'Los cinco países de la cuenca'],
        ['Estatuto del Río Uruguay', 'Argentina y Uruguay'],
        ['Yacyretá', 'Represa compartida con Paraguay'],
        ['Salto Grande', 'Represa compartida con Uruguay'],
      ], 'Hay acuerdos a distintas escalas: toda la cuenca, un río o una obra.', { d: 2 }),
      cad('Armá la cadena de por qué los ríos compartidos necesitan acuerdos.', [ // e2
        'Un río nace en un país y atraviesa otros',
        'Lo que hace el país de aguas arriba afecta a los de abajo',
        'Represas, desvíos o vertidos cambian el caudal y la calidad',
        'Sin reglas comunes aparecen conflictos',
        'Los acuerdos y comisiones permiten prevenirlos y resolverlos',
      ], ['Cada país puede usar el río sin afectar a los demás'], 'Como en una cuenca dentro de un país, pero con fronteras y soberanías de por medio.', { d: 2 }),
      clas('¿Es un tema que requiere acuerdo entre países o que puede decidir un solo país?', { // e3
        'Requiere acuerdo': ['Una represa sobre un río limítrofe', 'Vertidos a un río que cruza la frontera', 'Dragar un canal compartido'],
        'Puede decidir un solo país': ['Una planta de tratamiento en un arroyo interno', 'Una reserva en un humedal lejos de la frontera'],
      }, 'Cuando el impacto cruza la frontera, la decisión también debería cruzarla.', { d: 2 }),
      op('¿Qué aporta una comisión binacional a un río limítrofe?', [ // e4
        'Un espacio para informar, controlar y resolver',
        'Que un solo país decida por los dos sobre el río',
        ['Que el río deje de tener contaminación', 'Ayuda a prevenirla, pero no la elimina sola.'],
        'Que se prohíba cualquier uso del río',
      ], 'Informar a tiempo y monitorear juntos evita muchos conflictos.', { d: 2 }),
      vf('Si una obra se construye del lado de un país, no hace falta avisarle al otro aunque el río sea compartido.', false, 'En un río compartido, las obras que pueden afectar al otro país requieren información y consulta previas. Fue uno de los puntos centrales del fallo de 2010 sobre el río Uruguay.', {
        razones: ['+Porque las obras que afectan al otro país requieren información y consulta', '-Porque los ríos compartidos no tienen reglas', '-Porque los tribunales internacionales no existen'],
        d: 2,
      }),
      mult('¿Qué tiene que incluir un buen acuerdo sobre un río compartido? Marcá todo.', [ // e5
        '+Aviso previo de obras que puedan afectar al otro país',
        '+Monitoreo conjunto de la calidad del agua',
        '+Un mecanismo para resolver disputas',
        '+Participación de las comunidades ribereñas',
        '-Que cada país mida con métodos distintos y no comparta datos',
      ], 'Transparencia, datos compartidos y reglas claras: la base de la cooperación.', { d: 1 }),
      numv(3, (i) => { // e6
        const [caudal, usa] = [[1000, 15], [2000, 10], [500, 30]][i];
        return {
          enunciado: `Un río compartido lleva ${caudal.toLocaleString('es-AR')} m³ por segundo al cruzar la frontera. Si el país de aguas arriba empieza a usar el ${usa} % de ese caudal, ¿cuántos m³ por segundo llegan al país de abajo?`,
          valor: caudal * (100 - usa) / 100,
          unidad: 'm³ por segundo',
          explicacion: `${caudal.toLocaleString('es-AR')} × ${100 - usa} % = ${(caudal * (100 - usa) / 100).toLocaleString('es-AR')} m³/s. Por eso los usos aguas arriba tienen que acordarse con quienes están aguas abajo. Valores de ejemplo.`,
          ctx: `Caudal de ${caudal} m³/s; uso del ${usa} % aguas arriba.`,
        };
      }, { d: 1 }),
      det('Leé este comentario en un foro y marcá lo que conviene revisar.', [ // e7
        ['La Cuenca del Plata la comparten cinco países.', false],
        ['Argentina puede hacer cualquier obra en el río Uruguay sin avisarle a Uruguay.', true, 'Hay un estatuto binacional que exige información y consulta.'],
        ['Yacyretá es una represa compartida con Paraguay.', false],
        ['Los tratados sobre ríos no sirven porque nunca se aplican.', true, 'Crearon comisiones y reglas, y hasta hubo un fallo de la Corte Internacional de Justicia.'],
      ], 'Los ríos compartidos muestran que cuidar el agua también es política exterior.', { d: 2 }),
      comp('Completá.', 'Los cinco países de la cuenca firmaron en 1969 el Tratado de la Cuenca del [Plata]; para el río Uruguay hay un estatuto de [1975]; y Salto Grande es una represa compartida con [Uruguay].', ['Amazonas', '2010', 'Chile'], 'Tres claves de la gestión de los ríos compartidos.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: el océano de todos', 'Zonas del mar, tratado de alta mar, subsidios a la pesca, minería submarina y ríos compartidos, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el Agujero Azul', 'Más allá de la milla 200, frente a Chubut y Santa Cruz, hay un área de enorme biodiversidad donde pescan flotas de todo el mundo. Pensá cómo protegerla.', [
      teoria('La situación', [
        'El Agujero Azul es una zona de cañones submarinos de unos 148.000 km², ubicada más allá de las 200 millas pero sobre la plataforma continental extendida argentina. Allí pescan flotas internacionales, y el fondo, con corales de agua fría y esponjas, sirve de refugio y alimento a muchas especies. En 2022, un proyecto de ley para crear allí un área marina protegida bentónica, es decir, que proteja el fondo, obtuvo media sanción en la Cámara de Diputados.',
      ]),
      num('Si la superficie continental de Argentina es de unos 2,8 millones de km², ¿qué porcentaje representan los 148.000 km² del Agujero Azul? Redondeá a un decimal.', 5.3, '%', '148.000 ÷ 2.800.000 × 100 ≈ 5,3 %: una superficie de fondo marino equivalente a más del 5 % del territorio continental.', { ctx: '148.000 km² frente a 2.800.000 km².', dec: 1, tol: 0.1, d: 2 }),
      op('¿Qué puede proteger Argentina por sí sola en el Agujero Azul?', [ // e2
        'El fondo marino y las especies que viven en él',
        'Toda la pesca que ocurre en el agua de arriba',
        ['Nada, porque está fuera de las 200 millas', 'Tiene derechos sobre el lecho de su plataforma continental extendida.'],
        'Los barcos de otros países en cualquier parte del mundo',
      ], 'Por eso el proyecto propone un área bentónica: protege el fondo, no la columna de agua.', { d: 3 }),
      clas('¿Qué herramienta sirve para cada parte del problema?', { // e3
        'Ley nacional de área bentónica': ['Prohibir la pesca de arrastre que daña el fondo en la plataforma extendida', 'Proteger corales de agua fría y esponjas'],
        'Acuerdos internacionales': ['Regular la pesca en el agua de alta mar', 'Crear un área protegida en alta mar con el nuevo tratado'],
      }, 'El fondo y el agua tienen regímenes distintos: la solución combina herramientas nacionales e internacionales.', { d: 3 }),
      ord('Ordená una estrategia para proteger el Agujero Azul.', [ // e4
        'Reunir la ciencia sobre la biodiversidad del área',
        'Aprobar la ley del área bentónica sobre la plataforma extendida',
        'Controlar el fondo con monitoreo satelital y patrullas',
        'Proponer medidas para el agua en foros internacionales',
        'Evaluar los resultados y ajustar',
      ], 'Lo nacional primero, lo internacional en paralelo, y siempre con datos.', { d: 3 }),
      mult('¿Qué argumentos apoyan proteger el Agujero Azul? Marcá todos.', [ // e5
        '+Es refugio y zona de alimento de muchas especies',
        '+Tiene corales de agua fría y esponjas frágiles',
        '+Ayuda a sostener pesquerías de las que vive la costa patagónica',
        '+Contribuye a la meta de proteger el 30 % del océano',
        '-Como está lejos, lo que pase ahí no afecta a nadie',
      ], 'Un área lejana puede ser clave para la vida y el trabajo en la costa.', { d: 2 }),
      vf('Como el Agujero Azul está más allá de las 200 millas, Argentina no tiene ningún derecho sobre esa zona.', false, 'Está sobre la plataforma continental extendida argentina: el país tiene derechos sobre el lecho y las especies que viven en el fondo, aunque el agua de arriba sea alta mar.', {
        razones: ['+Porque tiene derechos sobre el lecho de su plataforma extendida', '-Porque todo lo que está más allá de 200 millas es de otro país', '-Porque el Agujero Azul está en la costa'],
        d: 2,
      }),
      det('Un informe redacta la propuesta. Marcá lo que conviene corregir.', [ // e7
        ['El área bentónica protegerá el fondo sobre la plataforma continental extendida.', false],
        ['Con la ley nacional, Argentina podrá prohibir toda la pesca de otros países en el agua de arriba.', true, 'El agua de arriba es alta mar: hacen falta acuerdos internacionales.'],
        ['Se propondrán medidas en foros internacionales para la columna de agua.', false],
        ['No hace falta monitorear: con la ley alcanza.', true, 'Sin control, ninguna área protegida funciona.'],
      ], 'Proteger el mar exige conocer quién decide sobre cada parte y combinar herramientas.', { d: 3 }),
    ]),
  ],
});
