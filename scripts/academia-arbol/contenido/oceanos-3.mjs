import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// OCÉANOS 3 — Ríos y mares contaminados.
// De dónde viene la contaminación del agua, nutrientes y zonas muertas,
// plásticos en ríos y mares, metales, petróleo y químicos que se acumulan en
// la cadena alimentaria, y cómo se limpia y se previene. Retoma los grandes
// ríos y las costas (oceanos-1), del desagüe al río (agua-3) y el problema
// del plástico (residuos-4).

export default unidad({
  slug: 'oceanos-3',
  rama: 'agua_azul',
  orden: 3,
  nivel: 2,
  requiereTronco: 2,
  titulo: 'Ríos y mares contaminados',
  bajada: 'Cloacas, fertilizantes, plásticos, mercurio y petróleo: cómo llega la contaminación del continente al agua, qué efectos tiene y cómo se limpia y se previene.',
  objetivos: [
    'Distinguir fuentes puntuales y difusas de contaminación del agua',
    'Explicar la eutrofización y la formación de zonas muertas',
    'Analizar el recorrido del plástico desde la ciudad hasta el mar',
    'Explicar la bioacumulación y la biomagnificación de contaminantes',
    'Evaluar medidas de tratamiento, prevención y recuperación de ríos y costas',
  ],
  repasa: ['oceanos-1', 'agua-3', 'residuos-4', 'oceanos-2'],
  fuentes: ['un-water-aguas-residuales', 'diaz-rosenberg-2008', 'oecd-plasticos', 'unep-plasticos', 'minamata', 'acumar', 'aysa', 'vida-silvestre'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('De dónde viene', 'Caños que se ven y escurrimientos que no: las fuentes de la contaminación del agua.', [
      teoria('Casi todo viene de tierra', [
        'La mayor parte de la contaminación que llega a los mares se origina en tierra firme: cloacas, industrias, campos, calles y basurales. Los ríos la transportan hasta las costas. Por eso, cuidar el mar empieza muy lejos de la playa: en cada ciudad y en cada campo de la cuenca.',
      ]),
      teoria('Puntual y difusa', [
        'La contaminación puntual sale de un lugar identificable, como el caño de una fábrica o una cloaca que desemboca en un río: se puede medir y controlar en ese punto. La contaminación difusa viene de muchos lugares a la vez, como los fertilizantes que la lluvia arrastra desde miles de campos, el aceite y la basura de las calles o los desechos de animales: es mucho más difícil de controlar.',
      ]),
      clas('¿Es contaminación puntual o difusa?', { // e1
        'Puntual': ['El caño de efluentes de una curtiembre', 'La descarga de una cloaca sin tratar', 'El desagüe de una planta industrial'],
        'Difusa': ['Fertilizante arrastrado por la lluvia desde muchos campos', 'Aceite y basura que la lluvia lleva desde las calles', 'Estiércol de corrales dispersos en una cuenca'],
      }, 'Lo puntual se controla en el caño; lo difuso, cambiando prácticas en todo el territorio.', { d: 1 }),
      op('¿Por qué la contaminación difusa es más difícil de controlar?', [ // e2
        'Viene de muchos lugares a la vez',
        'Porque es menos dañina que la puntual',
        ['Porque solo ocurre en el mar abierto', 'Ocurre en toda la cuenca, empezando en tierra.'],
        'Porque la ley no la permite medir',
      ], 'No hay un punto donde poner un filtro: hay que cambiar prácticas en muchos lugares.', { d: 2 }),
      teoria('Las aguas residuales', [
        'Una de las principales fuentes es el agua residual de las casas y las industrias. Según ONU-Agua, en 2022 solo el 56 % de las aguas residuales domésticas del mundo se trataba de forma segura: el resto llegaba a ríos, lagos y mares con distinto grado de tratamiento o sin ninguno. Lo viste en la unidad del desagüe al río: tratar las cloacas es una de las inversiones ambientales y sanitarias más importantes.',
      ], { destacado: { valor: '56 %', texto: 'de las aguas residuales domésticas del mundo se trató de forma segura en 2022, según ONU-Agua.' } }),
      numv(3, (i) => { // e3
        const vol = [100, 250, 40][i];
        return {
          enunciado: `Si una región genera ${vol} millones de metros cúbicos de aguas residuales por año y se trata de forma segura el 56 %, ¿cuántos millones de metros cúbicos no se tratan de forma segura?`,
          valor: Math.round(vol * 0.44 * 10) / 10,
          unidad: 'millones de m³',
          dec: 1,
          tol: 0.1,
          explicacion: `El 44 % no se trata de forma segura: ${vol} × 0,44 = ${(Math.round(vol * 0.44 * 10) / 10).toLocaleString('es-AR')} millones de m³ por año que llegan al agua con poco o ningún tratamiento.`,
          ctx: `${vol} millones de m³; 56 % tratado de forma segura.`,
        };
      }, { d: 2 }),
      cad('Armá el recorrido de la contaminación de una ciudad hasta el mar.', [ // e4
        'Las cloacas y los desagües de la ciudad descargan en un arroyo',
        'El arroyo desemboca en un río grande',
        'El río transporta los contaminantes aguas abajo',
        'Llegan al estuario y a la costa',
        'Se dispersan en el mar',
      ], ['Los contaminantes desaparecen al llegar al río'], 'Una cuenca conecta todo: lo que se tira en la ciudad puede terminar en el mar.', { d: 1 }),
      mult('¿Qué actividades generan contaminación difusa? Marcá todas.', [ // e5
        '+Aplicar fertilizantes en miles de campos',
        '+El escurrimiento de las calles cuando llueve',
        '+Tirar basura en la vía pública',
        '-El caño de efluentes de una fábrica',
        '-La descarga de una planta cloacal',
      ], 'Las fuentes difusas suman muchas pequeñas descargas; las puntuales salen de un solo lugar.', { d: 1 }),
      vf('Si una ciudad está lejos del mar, lo que tira por sus desagües no puede afectarlo.', false, 'Los ríos conectan las ciudades del interior con el mar. Una cuenca como la del Plata lleva hasta el océano lo que se descarga a miles de kilómetros.', { // e6
        razones: ['+Porque los ríos conectan el interior con el mar', '-Porque los desagües no llevan contaminantes', '-Porque el mar no recibe agua de los ríos'],
        d: 1,
      }),
      par('Uní cada fuente con su tipo de contaminante principal.', [ // e7
        ['Cloacas sin tratar', 'Materia orgánica y bacterias'],
        ['Campos con fertilizantes', 'Nitrógeno y fósforo'],
        ['Curtiembres', 'Cromo y otros químicos'],
        ['Calles de la ciudad', 'Basura, aceites y metales'],
      ], 'Cada fuente aporta contaminantes distintos, que piden soluciones distintas.', { d: 2 }),
      est('Estimá qué porcentaje de las aguas residuales domésticas del mundo se trató de forma segura en 2022, según ONU-Agua.', 56, { min: 0, max: 100, paso: 1, unidad: '%' }, 'Alrededor del 56 %. Casi la mitad de las aguas residuales domésticas del mundo no recibe un tratamiento seguro.', { d: 2 }),
      op('Una fábrica y cien campos contaminan el mismo arroyo. ¿Qué fuente es más fácil de controlar?', [ // e7c
        'La fábrica, porque descarga por un solo punto',
        'Los cien campos, porque son más',
        ['Ninguna de las dos se puede controlar', 'Las dos se pueden controlar, pero con herramientas distintas.'],
        'Las dos por igual y con la misma herramienta',
      ], 'En la fábrica se mide y se trata en el caño; en los campos hay que cambiar prácticas en cada lote.', { d: 1 }),
      det('Leé esta nota y marcá lo equivocado.', [ // e8
        ['Buena parte de la contaminación del mar viene de tierra firme.', false],
        ['La contaminación difusa sale siempre de un único caño.', true, 'Es la puntual la que sale de un punto; la difusa viene de muchos lugares.'],
        ['Tratar las cloacas es clave para proteger ríos y mares.', false],
        ['En el mundo se trata de forma segura casi toda el agua residual.', true, 'En 2022, solo alrededor del 56 %.'],
      ], 'Saber de dónde viene la contaminación es el primer paso para frenarla.', { d: 2 }),
      comp('Completá.', 'La contaminación que sale de un caño identificable es [puntual]; la que viene de muchos lugares a la vez es [difusa]; y en 2022 se trató de forma segura el [56] % de las aguas residuales domésticas del mundo.', ['secreta', 'marina', '96'], 'Tres ideas clave sobre las fuentes de contaminación del agua.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Demasiados nutrientes', 'Nitrógeno, fósforo, floraciones de algas y zonas muertas sin oxígeno.', [
      teoria('Eutrofización', [
        'El nitrógeno y el fósforo son nutrientes: las plantas los necesitan. Pero cuando llegan en exceso al agua —desde fertilizantes, estiércol y cloacas—, alimentan un crecimiento explosivo de algas y cianobacterias. Cuando esas algas mueren, las bacterias que las descomponen consumen el oxígeno del agua. Este proceso se llama eutrofización, y puede matar peces y otros organismos que necesitan oxígeno.',
      ]),
      cad('Armá la cadena de la eutrofización.', [ // e1
        'Llegan al agua nitrógeno y fósforo en exceso',
        'Las algas y cianobacterias crecen de forma explosiva',
        'Las algas mueren y se hunden',
        'Las bacterias las descomponen y consumen oxígeno',
        'El agua se queda sin oxígeno y mueren peces',
      ], ['Las algas producen tanto oxígeno que el agua se satura'], 'Un exceso de algo bueno termina asfixiando la vida del agua.', { d: 2 }),
      teoria('Zonas muertas', [
        'En algunas costas, la eutrofización crea zonas muertas: áreas con tan poco oxígeno que casi nada puede vivir en el fondo. Un estudio publicado en Science en 2008 contó más de 400 zonas muertas costeras en el mundo, y su número venía creciendo desde los años 60. Una de las más grandes se forma cada verano en el Golfo de México, frente a la desembocadura del río Misisipi, que drena la región agrícola más grande de Estados Unidos.',
      ], { destacado: { valor: '> 400', texto: 'zonas muertas costeras había en el mundo según un estudio publicado en Science en 2008.' } }),
      op('¿Por qué se forma cada verano una gran zona muerta frente a la desembocadura del Misisipi?', [ // e2
        'El río trae fertilizantes de una enorme región agrícola',
        'Porque el agua del golfo es demasiado fría en verano',
        ['Porque hay demasiados peces que consumen el oxígeno', 'El oxígeno lo consumen las bacterias que descomponen algas.'],
        'Porque allí no llegan ríos',
      ], 'Lo que se aplica en millones de hectáreas de campo termina, en parte, en el mar.', { d: 2 }),
      teoria('Cianobacterias en casa', [
        'En Argentina, en veranos cálidos aparecen floraciones de cianobacterias en el Río de la Plata, en embalses y en lagunas: el agua se pone verde y puede formar una capa espesa. Algunas cianobacterias producen toxinas que pueden causar irritación en la piel, problemas digestivos o daños más graves. Por eso, cuando hay floraciones, las autoridades recomiendan no bañarse y evitar que chicos y mascotas tengan contacto con el agua.',
      ]),
      mult('¿Qué conviene hacer si una playa de río tiene una floración de cianobacterias? Marcá todo.', [ // e3
        '+No bañarse',
        '+Evitar que las mascotas beban o se metan al agua',
        '+Seguir las recomendaciones de las autoridades',
        '-Bañarse igual si el agua está calentita',
        '-Usar el agua verde para cocinar',
      ], 'Las floraciones pueden producir toxinas: la precaución es simple y efectiva.', { d: 1 }),
      clas('¿Esta condición favorece o reduce las floraciones de cianobacterias?', { // e4
        'Las favorece': ['Agua cálida y quieta', 'Mucho fósforo y nitrógeno en el agua', 'Días de sol intenso y sin viento'],
        'Las reduce': ['Menos nutrientes que llegan desde la cuenca', 'Agua que circula y se renueva'],
      }, 'El calentamiento y los nutrientes se combinan: por eso las floraciones pueden volverse más frecuentes.', { d: 2 }),
      numv(3, (i) => { // e5
        const [antes, desp] = [[8, 2], [7, 3], [9, 1]][i];
        return {
          enunciado: `En una laguna, el oxígeno disuelto baja de ${antes} a ${desp} miligramos por litro después de una floración. ¿En qué porcentaje bajó? Redondeá al entero.`,
          valor: Math.round(((antes - desp) / antes) * 100),
          unidad: '%',
          tol: 1,
          explicacion: `(${antes} − ${desp}) ÷ ${antes} × 100 ≈ ${Math.round(((antes - desp) / antes) * 100)} %. Con menos de 2 a 3 mg/L, muchos peces no pueden sobrevivir.`,
          ctx: `De ${antes} a ${desp} mg/L de oxígeno.`,
        };
      }, { d: 2 }),
      teoria('Cómo se reduce', [
        'Para reducir la eutrofización hay que cortar los nutrientes en su origen: tratar las cloacas con etapas que remuevan nitrógeno y fósforo; aplicar fertilizantes en la dosis y el momento justos; dejar franjas de vegetación junto a los arroyos que retengan el escurrimiento; y conservar humedales, que funcionan como filtros naturales.',
      ]),
      par('Uní cada medida con cómo reduce los nutrientes.', [ // e6
        ['Tratamiento avanzado de cloacas', 'Remueve nitrógeno y fósforo antes de descargar'],
        ['Fertilización ajustada', 'Menos sobrante que la lluvia pueda arrastrar'],
        ['Franjas de vegetación junto a arroyos', 'Retienen el escurrimiento de los campos'],
        ['Humedales conservados', 'Filtran nutrientes de forma natural'],
      ], 'Las soluciones combinan tecnología, buenas prácticas y naturaleza.', { d: 2 }),
      vf('Como el nitrógeno y el fósforo son nutrientes, cuanto más llegue al agua, mejor para la vida acuática.', false, 'En exceso provocan floraciones de algas que, al descomponerse, agotan el oxígeno y matan peces.', { // e7
        razones: ['+Porque en exceso provocan falta de oxígeno', '-Porque las plantas acuáticas no usan nutrientes', '-Porque los peces se alimentan de fertilizantes'],
        d: 1,
      }),
      est('Estimá cuántas zonas muertas costeras había en el mundo según el estudio publicado en Science en 2008.', 400, { min: 1, max: 100000, unidad: 'zonas', escala: 'log' }, 'Más de 400, y su número venía creciendo desde los años 60 por el aumento de nutrientes que llegan desde tierra.', { d: 3 }),
      rank('Ordená estos niveles de oxígeno disuelto en el agua, del más saludable al menos saludable para los peces.', [ // e7c
        ['8 mg/L', 'muy bueno'],
        ['5 mg/L', 'aceptable para muchos peces'],
        ['3 mg/L', 'estresante'],
        ['1 mg/L', 'casi sin vida'],
      ], 'Por debajo de 2 o 3 mg/L, la mayoría de los peces no puede sobrevivir.', { d: 1, extremos: ['Más saludable', 'Menos saludable'] }),
      det('Leé este cartel en una playa y marcá lo equivocado.', [ // e8
        ['Hoy hay floración de cianobacterias: no se recomienda bañarse.', false],
        ['Si el agua está verde, es más limpia y saludable.', true, 'El color verde puede indicar una floración potencialmente tóxica.'],
        ['Mantené a tus mascotas lejos del agua.', false],
        ['Las floraciones aparecen sobre todo con agua fría.', true, 'Son más frecuentes con agua cálida, quieta y con muchos nutrientes.'],
      ], 'Saber leer las señales del agua protege la salud.', { d: 2 }),
      comp('Completá.', 'El exceso de nutrientes que causa algas y falta de oxígeno se llama [eutrofización]; las áreas del mar casi sin oxígeno son zonas [muertas]; y los humedales funcionan como [filtros] naturales.', ['oxigenación', 'vivas', 'fuentes'], 'Tres conceptos para entender el problema de los nutrientes.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Plástico en el agua', 'Del tacho a la costa: cuánto plástico llega a ríos y mares, qué forma toma y qué se encuentra en las playas.', [
      teoria('Cuánto llega', [
        'Según la OCDE, en 2019 unas 6,1 millones de toneladas de plástico llegaron a ríos, lagos y mares, y de eso alrededor de 1,7 millones de toneladas alcanzaron los océanos. Los ríos funcionan como cintas transportadoras: acumulan plástico durante años y lo van liberando al mar, sobre todo en las crecidas. Lo viste en la unidad del plástico: una parte muy grande de los residuos plásticos del mundo se gestiona mal.',
      ]),
      numv(3, (i) => { // e1
        const [agua, mar] = [[6.1, 1.7], [6.1, 1.7], [6.1, 1.7]][i];
        return {
          enunciado: [
            `Si ${agua.toLocaleString('es-AR')} millones de toneladas de plástico llegaron a ambientes acuáticos y ${mar.toLocaleString('es-AR')} millones alcanzaron el océano, ¿qué porcentaje llegó al océano? Redondeá al entero.`,
            `De ${agua.toLocaleString('es-AR')} millones de toneladas de plástico que llegaron al agua en 2019, ${mar.toLocaleString('es-AR')} millones alcanzaron el océano. ¿Qué porcentaje es? Redondeá al entero.`,
            `¿Qué porcentaje de los ${agua.toLocaleString('es-AR')} millones de toneladas de plástico que llegaron a ríos, lagos y mares alcanzó el océano, si fueron ${mar.toLocaleString('es-AR')} millones? Redondeá al entero.`,
          ][i],
          valor: Math.round((mar / agua) * 100),
          unidad: '%',
          tol: 1,
          explicacion: `${mar.toLocaleString('es-AR')} ÷ ${agua.toLocaleString('es-AR')} × 100 ≈ ${Math.round((mar / agua) * 100)} %. El resto queda, por ahora, en ríos y lagos: una reserva que seguirá llegando al mar.`,
          ctx: `${mar} de ${agua} millones de toneladas.`,
        };
      }, { d: 2 }),
      teoria('Microplásticos y redes fantasma', [
        'En el agua, el plástico se fragmenta por el sol y el oleaje en pedazos cada vez más chicos. Los menores de 5 milímetros se llaman microplásticos, y se encontraron en el agua, en los sedimentos, en animales y en el agua potable. También son un problema las redes y otros aparejos de pesca perdidos o abandonados, las "redes fantasma", que siguen atrapando peces, tortugas y mamíferos marinos durante años.',
      ]),
      par('Uní cada forma de plástico con su efecto.', [ // e2
        ['Bolsas y envoltorios', 'Tortugas que los confunden con alimento'],
        ['Redes fantasma', 'Siguen atrapando animales durante años'],
        ['Microplásticos', 'Son ingeridos por organismos pequeños'],
        ['Tapitas y fragmentos', 'Aves marinas que los ingieren'],
      ], 'Cada forma de plástico daña de una manera distinta.', { d: 2 }),
      cad('Armá el recorrido de una bolsa hasta convertirse en microplástico.', [ // e3
        'Una bolsa se vuela de un basural',
        'La lluvia la arrastra a un arroyo',
        'El río la lleva hasta la costa',
        'El sol y el oleaje la rompen en pedazos',
        'Se forman fragmentos cada vez más chicos',
      ], ['La bolsa se biodegrada por completo en una semana'], 'El plástico no desaparece: se rompe en pedazos cada vez más difíciles de recuperar.', { d: 1 }),
      teoria('Lo que dicen las playas', [
        'En Argentina, organizaciones como la Fundación Vida Silvestre organizan censos de basura costera con voluntarios, que registran qué residuos se encuentran en las playas. En esos censos, la gran mayoría de los objetos suelen ser plásticos: colillas, envoltorios, botellas, tapitas, bolsas, sorbetes y restos de pesca. Contar y clasificar la basura permite saber de dónde viene y qué políticas harían falta.',
      ]),
      clas('¿El origen probable de este residuo de playa es el turismo local o la actividad pesquera?', { // e4
        'Turismo y consumo local': ['Colillas de cigarrillo', 'Envoltorios de golosinas', 'Sorbetes'],
        'Actividad pesquera': ['Fragmentos de red', 'Cabos y sogas', 'Cajones de pescado'],
      }, 'Clasificar la basura por origen muestra a quién le toca actuar: bañistas, comercios, municipios o flotas.', { d: 2 }),
      numv(3, (i) => { // e5
        const [total, plast] = [[2000, 1640], [1500, 1260], [3000, 2340]][i];
        return {
          enunciado: `En un censo de basura costera se registraron ${total.toLocaleString('es-AR')} objetos y ${plast.toLocaleString('es-AR')} eran plásticos. ¿Qué porcentaje era plástico?`,
          valor: Math.round((plast / total) * 100),
          unidad: '%',
          tol: 1,
          explicacion: `${plast.toLocaleString('es-AR')} ÷ ${total.toLocaleString('es-AR')} × 100 = ${Math.round((plast / total) * 100)} %. Datos de ejemplo, del orden de lo que suelen mostrar los censos costeros.`,
          ctx: `${plast} plásticos de ${total} objetos.`,
        };
      }, { d: 1 }),
      vf('Juntar la basura de las playas resuelve el problema del plástico en el mar.', false, 'Las limpiezas ayudan y generan datos, pero el plástico sigue llegando si no se reduce en origen y no se gestiona bien en tierra.', { // e6
        razones: ['+Porque el plástico sigue llegando si no se reduce en origen', '-Porque limpiar playas no sirve para nada', '-Porque en el mar no hay plástico'],
        d: 2,
      }),
      op('¿Por qué los ríos liberan más plástico al mar durante las crecidas?', [ // e6b
        'Arrastran lo acumulado en orillas y fondos',
        'Porque en las crecidas la gente tira más basura',
        ['Porque el agua de crecida fabrica plástico', 'El plástico no se fabrica en el río: se acumula y se moviliza.'],
        'Porque en las crecidas el mar está más lejos',
      ], 'Los ríos acumulan plástico durante años y lo liberan en pulsos, sobre todo con las crecidas.', { d: 2 }),
      rank('Ordená estas medidas según cuánto reducen el plástico que llega al mar, de más a menos.', [ // e7
        ['Reducir descartables y cerrar basurales a cielo abierto', 'corta en origen'],
        ['Mejorar la recolección y el reciclaje', 'mucho'],
        ['Poner barreras en arroyos para atrapar residuos', 'intercepta una parte'],
        ['Limpiar la playa una vez al año', 'poco, pero genera datos'],
      ], 'Lo viste con la escalera de los residuos: lo más efectivo es que el residuo no exista.', { d: 2, extremos: ['Reduce más', 'Reduce menos'] }),
      mult('¿Qué objetos suelen aparecer entre los más frecuentes en las playas? Marcá todos.', [ // e8
        '+Colillas de cigarrillo',
        '+Envoltorios y bolsas',
        '+Tapitas y botellas',
        '-Caracoles vivos',
        '-Algas',
      ], 'Los caracoles y las algas son parte de la playa, no basura.', { d: 1 }),
      det('Leé este posteo y marcá lo equivocado.', [ // e9
        ['Los ríos llevan plástico al mar durante años.', false],
        ['Los microplásticos son pedazos de más de 5 centímetros.', true, 'Son los menores de 5 milímetros.'],
        ['Las redes fantasma siguen atrapando animales.', false],
        ['El plástico se disuelve en el agua de mar en pocos días.', true, 'Se fragmenta en pedazos cada vez más chicos, pero no desaparece.'],
      ], 'El plástico no se va: cambia de tamaño y de lugar.', { d: 2 }),
      comp('Completá.', 'Los pedazos de plástico menores de 5 milímetros son [microplásticos]; las redes de pesca abandonadas que siguen atrapando animales se llaman redes [fantasma]; y los ríos funcionan como [cintas] transportadoras de plástico.', ['megaplásticos', 'doradas', 'filtros'], 'Tres ideas sobre el plástico en el agua.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Lo que se acumula', 'Mercurio, metales, petróleo y químicos: contaminantes que se concentran a lo largo de la cadena alimentaria.', [
      teoria('Bioacumulación y biomagnificación', [
        'Algunos contaminantes, como el mercurio, ciertos plaguicidas antiguos y otros compuestos persistentes, no se eliminan fácilmente del cuerpo: se acumulan con el tiempo en los tejidos de un organismo. Eso es la bioacumulación. Y como cada predador come muchas presas, la concentración aumenta en cada escalón de la cadena alimentaria: es la biomagnificación. Por eso los grandes predadores, como el pez espada o algunos atunes, pueden tener más mercurio.',
      ]),
      ord('Ordená esta cadena alimentaria según la concentración de mercurio que suele acumular cada eslabón, de menor a mayor.', [ // e1
        'Fitoplancton',
        'Zooplancton',
        'Pez pequeño',
        'Pez mediano',
        'Gran predador, como el pez espada',
      ], 'En cada escalón, el contaminante se concentra más: los predadores tope reciben la mayor dosis.', { d: 2, extremos: ['Menos mercurio', 'Más mercurio'] }),
      par('Uní cada concepto con su definición.', [ // e2
        ['Bioacumulación', 'Un contaminante se acumula en un organismo con el tiempo'],
        ['Biomagnificación', 'La concentración aumenta en cada escalón de la cadena'],
        ['Contaminante persistente', 'Tarda mucho en degradarse'],
        ['Predador tope', 'El último eslabón de la cadena alimentaria'],
      ], 'Estos conceptos explican por qué un contaminante diluido puede volverse peligroso.', { d: 2 }),
      numv(3, (i) => { // e3
        const [base, factor] = [[0.01, 10], [0.02, 8], [0.005, 12]][i];
        return {
          enunciado: `Si el mercurio en el plancton es de ${base.toLocaleString('es-AR')} mg/kg y se multiplica por ${factor} en cada uno de 3 escalones de la cadena, ¿cuánto hay en el predador tope, en mg/kg? Redondeá a dos decimales.`,
          valor: Math.round(base * factor ** 3 * 100) / 100,
          unidad: 'mg/kg',
          dec: 2,
          tol: 0.01,
          explicacion: `${base.toLocaleString('es-AR')} × ${factor}³ = ${(Math.round(base * factor ** 3 * 100) / 100).toLocaleString('es-AR')} mg/kg. Valores de ejemplo: muestran cómo algo casi imperceptible se vuelve importante en la cima de la cadena.`,
          ctx: `${base} mg/kg en el plancton; ×${factor} en 3 escalones.`,
        };
      }, { d: 3 }),
      teoria('El caso Minamata', [
        'En la década de 1950, en la bahía de Minamata, en Japón, una fábrica vertió mercurio al mar durante años. El mercurio se acumuló en peces y mariscos, y miles de personas que los comían sufrieron daños neurológicos graves. El caso dio nombre al Convenio de Minamata sobre el Mercurio, un tratado internacional de 2013, que Argentina ratificó, para reducir el uso y las emisiones de mercurio en el mundo.',
      ]),
      cad('Armá la cadena del caso Minamata.', [ // e4
        'Una fábrica vierte mercurio a la bahía',
        'El mercurio se acumula en peces y mariscos',
        'La población come esos peces con frecuencia',
        'Muchas personas sufren daños neurológicos',
        'Se crea un tratado internacional sobre el mercurio',
      ], ['El mercurio se evapora y desaparece del agua'], 'Un caso trágico que cambió las reglas del mundo sobre un contaminante.', { d: 2 }),
      teoria('Petróleo y químicos', [
        'Los derrames de petróleo, en el mar o en los ríos, cubren aves y mamíferos, contaminan costas y afectan la pesca durante años. En 1999, un choque de buques frente a Magdalena, en la provincia de Buenos Aires, causó uno de los mayores derrames en el Río de la Plata. Además, las industrias y los campos pueden liberar químicos como metales pesados, solventes o plaguicidas que llegan a los ríos. Algunos, llamados disruptores endocrinos, alteran las hormonas de peces y otros animales incluso en cantidades muy pequeñas.',
      ]),
      clas('¿Qué tipo de contaminante es cada uno?', { // e5
        'Hidrocarburos': ['Petróleo derramado por un buque', 'Aceite de motor tirado a un desagüe'],
        'Metales pesados': ['Mercurio de una fábrica', 'Cromo de una curtiembre', 'Plomo de baterías mal descartadas'],
        'Otros químicos': ['Plaguicidas arrastrados desde los campos', 'Solventes industriales'],
      }, 'Cada tipo de contaminante tiene efectos y soluciones distintas.', { d: 2 }),
      op('¿Por qué conviene preferir pescados chicos y variados a comer con frecuencia grandes predadores como el pez espada?', [ // e6
        'Porque acumulan menos mercurio',
        'Porque los peces chicos no tienen proteínas',
        ['Porque los grandes predadores son más caros', 'Puede ser, pero la razón de salud es el mercurio acumulado.'],
        'Porque el pez espada es siempre ilegal',
      ], 'Al estar más abajo en la cadena, los peces chicos acumulan menos contaminantes persistentes.', { d: 2 }),
      vf('Un contaminante muy diluido en el agua nunca puede ser peligroso.', false, 'Por biomagnificación, un contaminante persistente muy diluido puede concentrarse muchísimo en los predadores tope, incluidos los humanos que los comen.', { // e7
        razones: ['+Porque puede concentrarse a lo largo de la cadena alimentaria', '-Porque la dilución elimina cualquier sustancia', '-Porque los peces filtran todos los contaminantes'],
        d: 2,
      }),
      vf('El Convenio de Minamata busca reducir el uso y las emisiones de mercurio en el mundo.', true, 'Es un tratado de 2013, que Argentina ratificó, para proteger la salud y el ambiente del mercurio, incluida su llegada al agua.', { // e7b
        razones: ['+Porque es un tratado internacional sobre el mercurio', '-Porque promueve usar más mercurio', '-Porque trata sobre el plástico'],
        d: 1,
      }),
      mult('¿Qué acciones reducen la llegada de contaminantes persistentes al agua? Marcá todas.', [ // e8
        '+Llevar pilas y baterías a puntos de recolección',
        '+No tirar aceite de motor ni solventes a los desagües',
        '+Controlar los efluentes industriales',
        '-Quemar residuos junto al arroyo',
        '-Tirar medicamentos vencidos al inodoro',
      ], 'Muchas fuentes son cotidianas: cada residuo peligroso tiene su circuito correcto.', { d: 1 }),
      det('Leé esta nota y marcá lo equivocado.', [ // e9
        ['El mercurio puede acumularse en los peces.', false],
        ['Los peces pequeños suelen tener más mercurio que los grandes predadores.', true, 'Es al revés, por biomagnificación.'],
        ['El caso Minamata dio nombre a un tratado internacional sobre el mercurio.', false],
        ['El aceite de motor puede tirarse al desagüe si se diluye con agua.', true, 'Contamina igual; debe llevarse a un punto de recolección.'],
      ], 'Los contaminantes persistentes exigen prevención: una vez en la cadena, es muy difícil sacarlos.', { d: 2 }),
      comp('Completá.', 'Cuando un contaminante se acumula en un organismo con el tiempo se llama [bioacumulación]; cuando aumenta en cada escalón de la cadena, [biomagnificación]; y el tratado sobre el mercurio lleva el nombre de [Minamata].', ['fotosíntesis', 'evaporación', 'Kioto'], 'Tres conceptos clave sobre los contaminantes que se acumulan.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Limpiar y prevenir', 'Plantas de tratamiento, control industrial, cuencas que se recuperan y lo que todavía falta.', [
      teoria('Tratar las cloacas', [
        'Una planta de tratamiento de aguas residuales tiene varias etapas. En el tratamiento primario se separan los sólidos y las grasas. En el secundario, bacterias descomponen la materia orgánica disuelta. En el terciario, se remueven nutrientes como el nitrógeno y el fósforo, o se desinfecta el agua. Cuantas más etapas, más limpia sale el agua al río. En el Área Metropolitana de Buenos Aires se construyeron grandes obras para llevar las cloacas a plantas de tratamiento y alejar las descargas de la costa.',
      ]),
      ord('Ordená las etapas del tratamiento de aguas residuales.', [ // e1
        'Separar sólidos y grasas (primario)',
        'Descomponer la materia orgánica con bacterias (secundario)',
        'Remover nutrientes y desinfectar (terciario)',
        'Devolver el agua tratada al río',
      ], 'Cada etapa remueve un tipo distinto de contaminante.', { d: 1 }),
      par('Uní cada etapa con lo que remueve.', [ // e2
        ['Tratamiento primario', 'Sólidos y grasas'],
        ['Tratamiento secundario', 'Materia orgánica disuelta'],
        ['Tratamiento terciario', 'Nitrógeno, fósforo y microorganismos'],
      ], 'Un tratamiento solo primario deja pasar buena parte de la contaminación.', { d: 2 }),
      teoria('Ríos que se recuperan', [
        'Hay ríos que estuvieron muy contaminados y se recuperaron en parte. En 1986, un incendio en una planta química en Suiza derramó toneladas de sustancias tóxicas en el río Rin y mató peces a lo largo de cientos de kilómetros. Los países de la cuenca acordaron un programa conjunto: plantas de tratamiento, control industrial, monitoreo compartido y metas claras. Décadas después, especies como el salmón volvieron a remontar el río. La recuperación es posible, pero lleva tiempo, inversión y cooperación.',
      ]),
      cad('Armá la cadena de la recuperación del Rin.', [ // e3
        'Un accidente industrial contamina gravemente el río',
        'Los países de la cuenca acuerdan un programa conjunto',
        'Construyen plantas de tratamiento y controlan industrias',
        'Monitorean el agua con metas compartidas',
        'Décadas después, vuelven especies que habían desaparecido',
      ], ['El río se limpia solo en pocos meses sin hacer nada'], 'Cooperación, inversión y constancia: la receta de un río que se recupera.', { d: 2 }),
      mult('¿Qué hizo falta para recuperar el Rin? Marcá todo.', [ // e4
        '+Cooperación entre los países de la cuenca',
        '+Plantas de tratamiento',
        '+Control de las industrias',
        '+Monitoreo compartido durante décadas',
        '-Esperar sin hacer nada',
      ], 'Un río compartido necesita soluciones compartidas.', { d: 1 }),
      teoria('Prevenir en casa y en el barrio', [
        'Muchas acciones cotidianas protegen el agua: no tirar aceite de cocina por la pileta (se puede juntar en botellas y llevar a puntos de recolección), no tirar basura en la calle, llevar pilas y medicamentos vencidos a los lugares indicados, usar productos de limpieza en la dosis justa y conectar las casas a la red cloacal cuando llega al barrio.',
      ]),
      clas('¿Esta acción protege o contamina el agua?', { // e5
        'Protege': ['Juntar el aceite de cocina usado en una botella', 'Conectar la casa a la red cloacal', 'Llevar pilas a un punto de recolección'],
        'Contamina': ['Tirar aceite por la pileta de la cocina', 'Tirar basura en la cuneta', 'Lavar el auto con detergente sobre el cordón'],
      }, 'Lo que se tira en casa y en la calle llega, tarde o temprano, al río.', { d: 1 }),
      numv(3, (i) => { // e6
        const [hog, ml] = [[2000, 500], [5000, 300], [1200, 750]][i];
        return {
          enunciado: `En un barrio de ${hog.toLocaleString('es-AR')} hogares, cada uno junta ${ml} mililitros de aceite de cocina usado por mes en lugar de tirarlo por la pileta. ¿Cuántos litros por año dejan de ir a las cloacas?`,
          valor: (hog * ml * 12) / 1000,
          unidad: 'litros',
          explicacion: `${hog.toLocaleString('es-AR')} × ${ml} mL × 12 = ${((hog * ml * 12) / 1000).toLocaleString('es-AR')} litros por año. El aceite tapa cañerías, dificulta el tratamiento y forma películas en el agua; bien recolectado, puede convertirse en biodiésel.`,
          ctx: `${hog} hogares; ${ml} mL por mes cada uno.`,
        };
      }, { d: 2 }),
      vf('Una vez que un río está muy contaminado, ya no se puede recuperar.', false, 'Hay casos, como el Rin, en que la cooperación y la inversión sostenidas lograron recuperar buena parte de la vida del río, aunque llevó décadas.', { // e7
        razones: ['+Porque hay ríos que se recuperaron con esfuerzo sostenido', '-Porque los ríos se limpian solos en días', '-Porque ningún río estuvo nunca contaminado'],
        d: 1,
      }),
      op('¿Qué etapa del tratamiento de cloacas es clave para evitar la eutrofización río abajo?', [ // e7b
        'El tratamiento terciario, que remueve nutrientes',
        'El tratamiento primario, que separa grasas',
        ['Ninguna: la eutrofización no tiene relación con las cloacas', 'Las cloacas aportan mucho nitrógeno y fósforo.'],
        'Pintar de verde la planta de tratamiento',
      ], 'Sacar el nitrógeno y el fósforo antes de descargar corta el alimento de las floraciones.', { d: 2 }),
      rank('Ordená estas medidas para un arroyo urbano contaminado, de la de mayor impacto a la de menor.', [ // e8
        ['Conectar los barrios a la red cloacal con tratamiento', 'la mayor'],
        ['Controlar los vertidos de las industrias', 'grande'],
        ['Recuperar las orillas con vegetación', 'media'],
        ['Pintar un mural sobre el arroyo', 'simbólica'],
      ], 'Primero se corta lo que entra; después se recupera el ambiente; lo simbólico acompaña.', { d: 2, extremos: ['Mayor impacto', 'Menor impacto'] }),
      det('Leé este plan municipal y marcá lo que conviene corregir.', [ // e9
        ['Construiremos una planta con tratamiento secundario y terciario.', false],
        ['El tratamiento primario alcanza para devolver agua limpia al río.', true, 'Solo separa sólidos y grasas; hacen falta más etapas.'],
        ['Controlaremos los efluentes de las industrias del parque industrial.', false],
        ['No hace falta monitorear después de construir la planta.', true, 'Sin monitoreo no se sabe si la calidad del agua mejora.'],
      ], 'Tratar, controlar y medir: tres patas que se sostienen entre sí.', { d: 2 }),
      comp('Completá.', 'La etapa que separa sólidos y grasas es el tratamiento [primario]; la que remueve nutrientes es el [terciario]; y el río europeo que se recuperó tras un programa conjunto es el [Rin].', ['final', 'inicial', 'Nilo'], 'Tres ideas clave sobre cómo se limpia el agua.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: ríos y mares contaminados', 'Fuentes, nutrientes, plásticos, contaminantes que se acumulan y tratamiento, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el arroyo del parque industrial', 'Un arroyo que desemboca en un río grande recibe descargas de un parque industrial y de barrios sin cloacas. Armá el diagnóstico y el plan.', [
      teoria('Los datos', [
        'Un municipio midió el arroyo en tres puntos: antes del parque industrial, después del parque y después de los barrios sin cloacas. Midió el oxígeno disuelto (los peces necesitan, en general, más de 5 mg/L), las bacterias fecales y la presencia de cromo, un metal que usan las curtiembres.',
      ], {
        datos: tabla('Mediciones en el arroyo (datos ficticios)', ['Punto', 'Oxígeno (mg/L)', 'Bacterias fecales', 'Cromo'], [
          ['Antes del parque', '7,5', 'bajas', 'no detectado'],
          ['Después del parque', '5,0', 'bajas', 'alto'],
          ['Después de los barrios', '2,0', 'muy altas', 'alto'],
        ], 'Datos ficticios para el ejercicio.'),
      }),
      num('¿Cuántos mg/L de oxígeno se pierden entre el primer y el último punto?', 5.5, 'mg/L', '7,5 − 2,0 = 5,5 mg/L. Con 2 mg/L, la mayoría de los peces no puede sobrevivir.', { ctx: 'Oxígeno disuelto de 7,5 a 2,0 mg/L.', dec: 1, d: 1 }),
      par('Uní cada problema con su fuente probable.', [ // e2
        ['Cromo alto después del parque', 'Curtiembres del parque industrial'],
        ['Bacterias fecales muy altas', 'Barrios sin cloacas'],
        ['Oxígeno muy bajo al final', 'Materia orgánica de las cloacas'],
      ], 'Medir en varios puntos permite saber de dónde viene cada contaminante.', { d: 2 }),
      op('¿Por qué fue clave medir en tres puntos del arroyo?', [ // e3
        'Para saber qué aporta cada tramo',
        'Porque la ley exige medir siempre tres veces',
        ['Porque un solo punto da siempre el mismo resultado', 'Un solo punto no permite distinguir las fuentes.'],
        'Para gastar el presupuesto de monitoreo',
      ], 'Comparar antes y después de cada fuente es la forma de atribuir responsabilidades.', { d: 2 }),
      mult('¿Qué debería incluir el plan? Marcá todo.', [ // e4
        '+Exigir tratamiento de efluentes a las curtiembres',
        '+Extender la red cloacal a los barrios',
        '+Monitoreo periódico y público en los tres puntos',
        '-Tapar el arroyo con un entubado para no verlo',
        '-Culpar solo a los vecinos de los barrios',
      ], 'Cada fuente tiene su responsable y su solución; esconder el arroyo no lo limpia.', { d: 2 }),
      rank('Ordená las medidas por urgencia sanitaria, de mayor a menor.', [ // e5
        ['Cloacas para los barrios con bacterias fecales muy altas', 'riesgo directo para la salud'],
        ['Control del cromo de las curtiembres', 'metal tóxico y persistente'],
        ['Recuperar las orillas con vegetación nativa', 'mejora de fondo'],
        ['Carteles de educación ambiental', 'complementaria'],
      ], 'Primero lo que enferma a las personas; después lo que se acumula; y lo de fondo acompaña.', { d: 3 }),
      vf('Como el arroyo desemboca en un río grande, la contaminación se diluye y deja de ser un problema.', false, 'La dilución no elimina metales persistentes como el cromo, que pueden acumularse, y las bacterias afectan a quienes usan el agua río abajo.', { // e6
        razones: ['+Porque los metales persisten y las bacterias afectan río abajo', '-Porque los ríos grandes no reciben arroyos', '-Porque el cromo se evapora'],
        d: 2,
      }),
      det('El municipio redacta el informe. Marcá lo que conviene corregir.', [ // e7
        ['El cromo aparece después del parque industrial.', false],
        ['Las bacterias fecales vienen de las curtiembres.', true, 'Aparecen después de los barrios sin cloacas.'],
        ['El oxígeno cae a niveles peligrosos para los peces.', false],
        ['No publicaremos los datos para no alarmar a la población.', true, 'La información ambiental es pública y ayuda a exigir soluciones.'],
      ], 'Un buen diagnóstico lee bien los datos y los comparte.', { d: 3 }),
    ]),
  ],
});
