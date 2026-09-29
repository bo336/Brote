import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// DIGITAL 4 — De la mina al celular.
// Qué minerales tiene un aparato, el litio y los salares de la Puna, las
// comunidades, el agua y la consulta previa, el cobalto y los minerales en
// conflicto, y la minería urbana. Retoma la huella de los dispositivos y la
// basura electrónica (digital-1), el auto eléctrico (movilidad-4) y los
// derechos y la participación (comunidad-2).

export default unidad({
  slug: 'digital-4',
  rama: 'digital',
  orden: 4,
  nivel: 2,
  requiereTronco: 2,
  titulo: 'De la mina al celular',
  bajada: 'Litio de la Puna, cobalto del Congo, oro en los conectores: de dónde salen los materiales de nuestros aparatos, qué costos tienen y cómo recuperarlos.',
  objetivos: [
    'Identificar los principales minerales de un celular y para qué sirven',
    'Describir cómo se extrae litio de los salares y qué se debate sobre el agua',
    'Explicar la consulta previa, libre e informada y el reparto de beneficios',
    'Reconocer los riesgos de derechos humanos en cadenas de minerales como el cobalto',
    'Evaluar la minería urbana y el reciclaje de aparatos como parte de la solución',
  ],
  repasa: ['digital-1', 'movilidad-4', 'comunidad-2', 'consumo-3'],
  fuentes: ['usgs-litio-2025', 'usgs-cobalto-2025', 'iea-minerales-2025', 'ley-24196-mineria', 'ley-24071-oit-169', 'amnistia-cobalto', 'ocde-diligencia-minerales', 'ue-minerales-conflicto', 'ewaste-monitor'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Qué tiene un celular', 'Decenas de elementos de la tabla periódica, cada uno con su función y su mina de origen.', [
      teoria('Una tabla periódica en el bolsillo', [
        'Un celular contiene decenas de elementos químicos distintos. En la batería hay litio y, en muchos modelos, cobalto. En los circuitos, cobre. En los conectores, pequeñas cantidades de oro. En las soldaduras, estaño. En algunos componentes electrónicos, tantalio. En los parlantes y el vibrador, imanes con tierras raras como el neodimio. En la pantalla, indio y vidrio especial. Cada uno viene de minas de distintos lugares del mundo.',
      ]),
      par('Uní cada material con su función en un celular.', [ // e1
        ['Litio', 'Batería'],
        ['Cobre', 'Circuitos y cables'],
        ['Oro', 'Conectores que no se oxidan'],
        ['Neodimio', 'Imanes de parlantes y vibrador'],
        ['Estaño', 'Soldaduras'],
      ], 'Cada componente depende de minerales específicos: por eso fabricar un celular tiene tanta huella.', { d: 2 }),
      teoria('La huella está en fabricar', [
        'Como viste en la base de la rama, la mayor parte de la huella de un celular está en su fabricación: extraer y procesar los minerales, fabricar los chips y armarlo. Extraer los minerales implica mover grandes cantidades de roca, usar agua y energía, y a veces afectar ecosistemas y comunidades. Por eso conservar un aparato más tiempo es una de las decisiones que más pesan.',
      ]),
      cad('Armá el recorrido de un mineral desde la mina hasta el celular.', [ // e2
        'Se extrae roca o salmuera de una mina',
        'Se concentra y se refina el mineral',
        'Se fabrica un componente, como una batería',
        'Se arma el celular en una fábrica',
        'Llega al negocio y a tus manos',
      ], ['El celular se fabrica directamente en la mina'], 'Una cadena larga, que suele cruzar varios países y continentes.', { d: 1 }),
      clas('¿En qué parte del celular está cada material?', { // e3
        'Batería': ['Litio', 'Cobalto'],
        'Circuitos y conexiones': ['Cobre', 'Oro', 'Estaño'],
        'Pantalla y parlantes': ['Indio', 'Neodimio'],
      }, 'La batería, los circuitos y la pantalla concentran los minerales más críticos.', { d: 2 }),
      teoria('Cantidades chicas, montañas de roca', [
        'Un celular tiene muy poco oro: unas decenas de miligramos, del orden de lo que pesa un grano de arroz. Pero en muchas minas se obtienen pocos gramos de oro por tonelada de roca. Eso significa que, detrás de ese poquito de metal, hay toneladas de roca removida, agua, energía y residuos mineros. Lo mismo pasa, en distinta medida, con otros metales.',
      ]),
      numv(3, (i) => { // e4
        const [gpt, mg] = [[5, 30], [2, 25], [4, 40]][i];
        return {
          enunciado: `Si una mina obtiene ${gpt} gramos de oro por tonelada de roca, ¿cuántos kilos de roca hay que procesar para obtener los ${mg} miligramos de oro de un celular? Redondeá a un decimal.`,
          valor: Math.round(((mg / 1000) / gpt) * 1000 * 10) / 10,
          unidad: 'kg de roca',
          dec: 1,
          tol: 0.1,
          explicacion: `${mg} mg = ${(mg / 1000).toLocaleString('es-AR')} g. ${(mg / 1000).toLocaleString('es-AR')} ÷ ${gpt} g/t = ${((mg / 1000) / gpt).toLocaleString('es-AR')} t ≈ ${(Math.round(((mg / 1000) / gpt) * 1000 * 10) / 10).toLocaleString('es-AR')} kg de roca, solo por el oro de un celular. Valores de ejemplo.`,
          ctx: `${gpt} g de oro por tonelada; ${mg} mg de oro en el celular.`,
        };
      }, { d: 4 }),
      vf('Como un celular tiene muy poca cantidad de cada metal, su extracción no tiene impacto.', false, 'Poca cantidad de metal puede requerir mucha roca, agua y energía, porque en las minas el metal está muy diluido. Y se fabrican más de mil millones de celulares por año.', { // e5
        razones: ['+Porque poco metal puede requerir mucha roca, agua y energía', '-Porque los metales aparecen solos en la superficie', '-Porque los celulares no tienen metales'],
        d: 2,
      }),
      mult('¿Qué impactos puede tener extraer los minerales de un celular? Marcá todos.', [ // e6
        '+Mover grandes cantidades de roca',
        '+Usar agua en zonas donde escasea',
        '+Afectar comunidades cercanas a las minas',
        '-Producir oxígeno para el aire',
        '-Crear suelos más fértiles automáticamente',
      ], 'La minería tiene impactos que se pueden reducir y controlar, pero no eliminar.', { d: 1 }),
      op('¿Qué decisión de una persona reduce más la demanda de minerales?', [ // e7
        'Usar el mismo celular varios años más',
        'Comprar una funda nueva cada mes',
        ['Cargar el celular solo de noche', 'Puede cuidar la batería, pero pesa poco frente a no comprar otro.'],
        'Borrar fotos viejas',
      ], 'Cada año extra de uso es un aparato menos que fabricar.', { d: 1 }),
      vf('Comprar un celular reacondicionado evita buena parte de la huella de fabricar uno nuevo.', true, 'Se aprovecha un aparato que ya existe: se evita extraer y procesar la mayor parte de sus materiales, aunque la reparación y el transporte tengan algo de huella.', { // e7b
        razones: ['+Porque aprovecha un aparato que ya existe', '-Porque los reacondicionados se fabrican desde cero', '-Porque los celulares no tienen huella de fabricación'],
        d: 1,
      }),
      det('Leé esta nota y marcá lo equivocado.', [ // e8
        ['Un celular contiene decenas de elementos químicos.', false],
        ['El oro de los conectores sale de reciclar hojas secas.', true, 'Sale de minas o de reciclar aparatos; no de hojas.'],
        ['La batería suele tener litio.', false],
        ['Fabricar un celular casi no tiene huella; lo que pesa es cargarlo.', true, 'La mayor parte de la huella está en la fabricación.'],
      ], 'Saber de dónde vienen los materiales cambia cómo vemos un aparato.', { d: 2 }),
      comp('Completá.', 'La batería de un celular suele tener [litio]; los imanes de los parlantes usan tierras raras como el [neodimio]; y la mayor parte de la huella está en [fabricarlo].', ['plomo', 'carbono', 'cargarlo'], 'Tres ideas sobre los materiales de un celular.', { d: 1 }),
      rank('Ordená estas decisiones por cuánto reducen la demanda de minerales, de más a menos.', [ // e10
        ['Usar el mismo celular dos años más', 'evita un aparato nuevo'],
        ['Comprar un celular reacondicionado', 'evita buena parte'],
        ['Reciclar el celular viejo al cambiarlo', 'recupera algunos metales'],
        ['Cambiar el fondo de pantalla', 'nada'],
      ], 'Primero alargar la vida, después reutilizar, y el reciclaje al final.', { d: 2, extremos: ['Reduce más', 'Reduce menos'] }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('El litio de la Puna', 'Argentina en el triángulo del litio: salares, salmuera, piletas de evaporación y lo que se discute sobre el agua.', [
      teoria('El triángulo del litio', [
        'El litio es clave para las baterías de celulares, computadoras, autos eléctricos y sistemas de almacenamiento de energía. Según el Servicio Geológico de Estados Unidos, de los unos 115 millones de toneladas de recursos de litio identificados en el mundo, Argentina y Bolivia tienen unos 23 millones cada una y Chile unos 11: juntos, casi la mitad. Por eso a esa región de salares de la Puna se la llama el triángulo del litio.',
        'En 2024, Argentina produjo unas 18.000 toneladas de litio, más del doble que en 2023, y fue el quinto productor mundial, detrás de Australia, Chile, China y Zimbabue.',
      ], {
        datos: barras('Producción de litio en 2024 (estimada)', 'miles de toneladas', [
          ['Australia', 88],
          ['Chile', 49],
          ['China', 41],
          ['Zimbabue', 22],
          ['Argentina', 18],
        ], 'Servicio Geológico de EE. UU., Mineral Commodity Summaries 2025.'),
      }),
      numv(3, (i) => { // e1
        const [ar, bo, cl] = [[23, 23, 11], [23, 23, 11], [23, 23, 11]][i];
        const total = 115;
        return {
          enunciado: [
            `Si en el mundo hay unos ${total} millones de toneladas de recursos de litio y Argentina tiene ${ar}, Bolivia ${bo} y Chile ${cl}, ¿qué porcentaje tienen entre los tres? Redondeá al entero.`,
            `De ${total} millones de toneladas de recursos de litio del mundo, ¿qué porcentaje reúnen Argentina (${ar}), Bolivia (${bo}) y Chile (${cl})? Redondeá al entero.`,
            `Argentina, Bolivia y Chile suman ${ar + bo + cl} millones de toneladas de recursos de litio, sobre ${total} millones en el mundo. ¿Qué porcentaje es? Redondeá al entero.`,
          ][i],
          valor: Math.round(((ar + bo + cl) / total) * 100),
          unidad: '%',
          tol: 1,
          explicacion: `(${ar} + ${bo} + ${cl}) ÷ ${total} × 100 ≈ ${Math.round(((ar + bo + cl) / total) * 100)} %. Casi la mitad de los recursos identificados está en el triángulo del litio.`,
          ctx: `${ar + bo + cl} de ${total} millones de toneladas.`,
        };
      }, { d: 2 }),
      rank('Ordená estos países según su producción de litio en 2024, de mayor a menor.', [ // e2
        ['Australia', '≈ 88.000 t'],
        ['Chile', '≈ 49.000 t'],
        ['China', '≈ 41.000 t'],
        ['Argentina', '≈ 18.000 t'],
      ], 'Argentina tiene muchos recursos, pero su producción todavía es menor que la de otros países.', { d: 2 }),
      est('Estimá cuántas toneladas de litio produjo Argentina en 2024, según el USGS.', 18000, { min: 100, max: 1000000, unidad: 't', escala: 'log' }, 'Unas 18.000 toneladas, más del doble que en 2023. Australia produjo unas 88.000.', { d: 3 }),
      teoria('Cómo se extrae de un salar', [
        'En Australia, el litio se extrae de rocas duras. En los salares de la Puna, en cambio, está disuelto en una salmuera, un agua muy salada que hay bajo la costra de sal. En el método tradicional, se bombea la salmuera a grandes piletas donde el sol evapora el agua durante meses, hasta concentrar el litio, que luego se procesa en una planta. También se desarrollan métodos de extracción directa, que separan el litio sin evaporar tanta agua, pero todavía se están probando a gran escala.',
      ]),
      ord('Ordená los pasos de la extracción de litio por evaporación.', [ // e3
        'Se bombea salmuera desde debajo del salar',
        'Se vuelca en piletas al aire libre',
        'El sol evapora el agua durante meses',
        'La salmuera concentrada va a una planta de procesamiento',
        'Se obtiene carbonato de litio',
      ], 'El método aprovecha el sol y el clima seco de la Puna, pero implica sacar grandes volúmenes de salmuera.', { d: 2 }),
      op('¿Por qué la Puna es un lugar donde conviene evaporar salmuera al sol?', [ // e3b
        'Porque es muy seca, soleada y ventosa',
        'Porque llueve casi todos los días del año',
        ['Porque está al nivel del mar', 'La Puna está a más de 3.000 metros de altura.'],
        'Porque allí el agua no se evapora nunca',
      ], 'El clima que facilita la evaporación es el mismo que hace tan valiosa cada gota de agua dulce.', { d: 1 }),
      teoria('El debate sobre el agua', [
        'La Puna es una de las zonas más secas del país. La salmuera que se evapora no es agua dulce, pero los salares forman parte de sistemas hidrológicos donde también hay vegas, lagunas y acuíferos de agua dulce de los que dependen comunidades, ganado y aves como los flamencos. Además, las plantas de procesamiento usan agua dulce. Hay debate sobre cuánto afecta sacar salmuera al equilibrio del agua de toda la cuenca, y muchas investigaciones y comunidades piden estudios de impacto acumulativo, que miren todos los proyectos de una misma cuenca juntos.',
      ]),
      cad('Armá la cadena de por qué preocupa el agua en un salar.', [ // e4
        'Se extraen grandes volúmenes de salmuera del salar',
        'Puede cambiar el equilibrio del agua subterránea de la cuenca',
        'Pueden bajar niveles en vegas y lagunas de agua dulce cercanas',
        'Se afectan pasturas, ganado, aves y comunidades',
      ], ['La salmuera extraída se convierte en agua de lluvia'], 'Por eso se piden estudios de toda la cuenca, antes y durante los proyectos.', { d: 3 }),
      vf('Como la salmuera no es agua potable, extraerla no puede tener ningún efecto sobre el agua dulce.', false, 'Salmuera y agua dulce pueden estar conectadas en el mismo sistema de la cuenca. Por eso hacen falta estudios hidrológicos de toda la cuenca y monitoreo permanente.', { // e5
        razones: ['+Porque salmuera y agua dulce pueden estar conectadas en la cuenca', '-Porque la salmuera es agua potable', '-Porque en la Puna llueve muchísimo'],
        d: 3,
      }),
      clas('¿Es un argumento a favor de la minería de litio o una preocupación?', { // e6
        'A favor': ['Es clave para baterías de autos eléctricos y renovables', 'Puede generar empleo y recursos para las provincias'],
        'Preocupación': ['Posible efecto sobre vegas y agua dulce de la cuenca', 'Falta de estudios de impacto acumulativo', 'Consulta insuficiente a comunidades'],
      }, 'Un debate serio reconoce las dos columnas y busca condiciones para que los beneficios no se paguen con daños irreversibles.', { d: 2 }),
      par('Uní cada concepto con su definición.', [ // e7
        ['Salmuera', 'Agua muy salada bajo la costra del salar'],
        ['Pileta de evaporación', 'Donde el sol concentra el litio'],
        ['Extracción directa', 'Método que separa el litio sin evaporar tanta agua'],
        ['Impacto acumulativo', 'Efecto de todos los proyectos de una cuenca juntos'],
      ], 'Vocabulario para entender el debate del litio.', { d: 2 }),
      det('Leé este posteo y marcá lo equivocado.', [ // e8
        ['Argentina está entre los países con más recursos de litio del mundo.', false],
        ['En la Puna el litio se saca de rocas duras, como en Australia.', true, 'En la Puna se extrae de la salmuera de los salares.'],
        ['En 2024 Argentina más que duplicó su producción de litio.', false],
        ['Evaluar cada proyecto por separado alcanza para conocer el impacto en la cuenca.', true, 'Hacen falta estudios de impacto acumulativo de todos los proyectos.'],
      ], 'Un debate informado empieza por los datos correctos.', { d: 2 }),
      comp('Completá.', 'La región de salares de Argentina, Bolivia y Chile se llama el triángulo del [litio]; en la Puna el litio está disuelto en una [salmuera]; y mirar todos los proyectos de una cuenca juntos es evaluar el impacto [acumulativo].', ['cobre', 'arcilla', 'individual'], 'Tres ideas clave sobre el litio de la Puna.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Comunidades, consulta y beneficios', 'Quiénes viven en los territorios, qué es la consulta previa y cómo se reparten los beneficios de la minería.', [
      teoria('Los territorios tienen gente', [
        'En la Puna viven comunidades indígenas y campesinas, muchas dedicadas al pastoreo, la extracción artesanal de sal y el turismo. Para ellas, el agua y el territorio son la base de su vida. Argentina aprobó en 1992, por la Ley 24.071, el Convenio 169 de la Organización Internacional del Trabajo, que reconoce el derecho de los pueblos indígenas a ser consultados antes de que se tomen decisiones que los afecten.',
      ]),
      teoria('Consulta previa, libre e informada', [
        'La consulta tiene que ser previa (antes de decidir, no cuando la obra ya empezó), libre (sin presiones ni amenazas), informada (con información completa, comprensible y en tiempo) y de buena fe, con procedimientos adecuados a cada pueblo. No es una reunión informativa ni una firma apurada: es un proceso de diálogo que puede cambiar el proyecto.',
      ]),
      par('Uní cada condición de la consulta con su significado.', [ // e1
        ['Previa', 'Antes de tomar la decisión'],
        ['Libre', 'Sin presiones ni amenazas'],
        ['Informada', 'Con información completa y comprensible'],
        ['De buena fe', 'Con intención real de escuchar y acordar'],
      ], 'Si falta cualquiera de estas condiciones, no es una verdadera consulta.', { d: 2 }),
      op('Una empresa convoca a una comunidad a una reunión cuando la planta ya está construida. ¿Por qué no cumple con la consulta previa?', [ // e2
        'Porque la decisión ya se había tomado',
        'Porque las reuniones están prohibidas',
        ['Porque la comunidad no tiene ningún derecho', 'Tiene derecho a ser consultada, según el Convenio 169.'],
        'Porque la reunión fue en la plaza',
      ], 'Consultar después de decidir es informar, no consultar.', { d: 2 }),
      clas('¿Es una consulta adecuada o no?', { // e3
        'Adecuada': ['Varias reuniones antes de aprobar el proyecto, con traducción y tiempo para deliberar', 'Información técnica explicada en lenguaje claro', 'Acuerdos que modifican el proyecto según lo planteado'],
        'No adecuada': ['Una reunión única cuando ya se otorgaron los permisos', 'Firmas pedidas a cambio de regalos', 'Un documento técnico de 500 páginas entregado un día antes'],
      }, 'La calidad del proceso importa tanto como que exista.', { d: 2 }),
      teoria('El reparto de los beneficios', [
        'En Argentina, los recursos naturales pertenecen a las provincias. Por la Ley 24.196, de inversiones mineras, las provincias que adhieren no pueden cobrar regalías mayores al 3 % del valor del mineral en boca de mina. Además de las regalías, los beneficios pueden llegar como empleo local, compras a proveedores de la región, infraestructura y fondos para las comunidades. Cuánto queda en el territorio es parte central del debate.',
      ]),
      numv(3, (i) => { // e4
        const valor = [500, 800, 1200][i];
        return {
          enunciado: `Si una mina extrae mineral por un valor en boca de mina de ${valor.toLocaleString('es-AR')} millones de dólares por año, ¿cuánto recibe como máximo la provincia en regalías del 3 %?`,
          valor: valor * 0.03,
          unidad: 'millones de dólares',
          explicacion: `${valor.toLocaleString('es-AR')} × 0,03 = ${(valor * 0.03).toLocaleString('es-AR')} millones de dólares por año, como máximo por regalías. Otros beneficios pueden llegar por empleo, proveedores e infraestructura.`,
          ctx: `Valor en boca de mina ${valor} millones; regalías del 3 %.`,
        };
      }, { d: 2 }),
      mult('¿De qué formas pueden quedar beneficios de la minería en el territorio? Marcá todas.', [ // e5
        '+Regalías para la provincia',
        '+Empleo de personas de la zona',
        '+Compras a proveedores locales',
        '+Fondos o infraestructura para las comunidades',
        '-Solo en ganancias que se van del país',
      ], 'El debate no es solo si hay minería, sino cuánto valor y cuántas decisiones quedan en el territorio.', { d: 1 }),
      cad('Armá un proceso justo antes de aprobar un proyecto de litio.', [ // e6
        'Se hace una línea de base del agua y del ambiente de la cuenca',
        'Se consulta a las comunidades de forma previa, libre e informada',
        'Se evalúa el impacto acumulativo con otros proyectos',
        'Se acuerdan condiciones, monitoreo y beneficios',
        'Recién entonces se decide si aprobar o no',
      ], ['Primero se construye y después se estudia el agua'], 'Estudiar, consultar y acordar antes de decidir evita conflictos y daños.', { d: 3 }),
      vf('Si un proyecto genera empleo, no hace falta consultar a las comunidades indígenas.', false, 'La consulta es un derecho reconocido por el Convenio 169, que Argentina aprobó por ley. Los beneficios económicos no la reemplazan.', { // e7
        razones: ['+Porque la consulta es un derecho que no se reemplaza con empleo', '-Porque el empleo siempre es malo', '-Porque las comunidades no viven en la Puna'],
        d: 2,
      }),
      op('¿Qué beneficio deja más valor en el territorio a largo plazo?', [ // e7b
        'Capacitar y emplear a personas de la zona',
        'Regalar camisetas con el logo del proyecto',
        ['Organizar un acto de inauguración', 'Puede ser simbólico, pero no deja capacidades en la comunidad.'],
        'Traer todo el personal de otra provincia',
      ], 'La capacitación y el empleo local construyen capacidades que quedan aunque la mina cierre.', { d: 1 }),
      det('Leé esta nota y marcá lo equivocado.', [ // e8
        ['Argentina aprobó el Convenio 169 de la OIT por la Ley 24.071.', false],
        ['La consulta puede hacerse después de otorgar todos los permisos.', true, 'Tiene que ser previa a la decisión.'],
        ['Las provincias pueden cobrar regalías de hasta el 3 % en boca de mina.', false],
        ['Una firma a cambio de regalos es una consulta libre.', true, 'Si hay presiones o incentivos indebidos, no es libre.'],
      ], 'Los derechos de las comunidades son parte del marco legal, no un trámite.', { d: 2 }),
      comp('Completá.', 'El convenio que reconoce el derecho a la consulta es el [169] de la OIT; la consulta debe ser previa, [libre] e informada; y las regalías mineras provinciales tienen un tope del [3] %.', ['14', 'rápida', '30'], 'Tres claves de los derechos y beneficios en la minería.', { d: 2 }),
      rank('Ordená estos momentos de consulta de mejor a peor.', [ // e10
        ['Antes de diseñar el proyecto', 'ideal'],
        ['Antes de aprobar los permisos', 'aceptable'],
        ['Con la obra en construcción', 'tardía'],
        ['Después de que la mina funciona', 'no es consulta'],
      ], 'Cuanto antes se consulta, más puede cambiar el proyecto.', { d: 2, extremos: ['Mejor momento', 'Peor momento'] }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Cobalto y minerales en conflicto', 'Minería artesanal, trabajo infantil y conflictos armados: los riesgos en las cadenas de suministro y cómo se controlan.', [
      teoria('El cobalto', [
        'El cobalto se usa en muchas baterías de litio. Según el Servicio Geológico de EE. UU., en 2024 la República Democrática del Congo aportó alrededor del 76 % de la producción minera mundial de cobalto. Una parte se extrae en minas artesanales, a veces en condiciones muy peligrosas. En 2016, Amnistía Internacional documentó casos de trabajo infantil en esas minas, y el tema sigue bajo investigación de organizaciones y gobiernos.',
      ], { destacado: { valor: '≈ 76 %', texto: 'del cobalto extraído en el mundo en 2024 vino de la República Democrática del Congo, según el USGS.' } }),
      est('Estimá qué porcentaje de la producción minera mundial de cobalto vino de la República Democrática del Congo en 2024.', 76, { min: 0, max: 100, paso: 1, unidad: '%' }, 'Alrededor del 76 %, según el Servicio Geológico de EE. UU. Esa concentración vuelve muy importante lo que pasa en sus minas.', { d: 2 }),
      teoria('Minerales en conflicto', [
        'En algunas regiones, la extracción de estaño, tantalio, tungsteno y oro ha financiado a grupos armados. Por eso se los llama minerales en conflicto. La OCDE elaboró una guía de debida diligencia para que las empresas identifiquen y reduzcan esos riesgos en sus cadenas de suministro, y la Unión Europea exige desde 2021 que los importadores de esos minerales la apliquen.',
      ]),
      clas('¿Es uno de los minerales en conflicto (conocidos como 3TG)?', { // e1
        'Mineral en conflicto': ['Estaño', 'Tantalio', 'Tungsteno', 'Oro'],
        'No está en esa lista': ['Litio', 'Cobre', 'Hierro'],
      }, 'La lista incluye estaño, tantalio, tungsteno y oro; otros minerales tienen sus propios riesgos.', { d: 2 }),
      teoria('Debida diligencia', [
        'La debida diligencia es el proceso por el cual una empresa averigua de dónde vienen sus materiales, identifica riesgos de violaciones de derechos humanos o de financiamiento de conflictos, toma medidas para reducirlos y publica lo que hace. No significa abandonar una región —eso puede dejar sin ingresos a comunidades enteras—, sino mejorar las condiciones y la trazabilidad.',
      ]),
      ord('Ordená los pasos de la debida diligencia en una cadena de minerales.', [ // e2
        'Rastrear de dónde vienen los materiales',
        'Identificar riesgos en cada eslabón',
        'Tomar medidas para reducirlos',
        'Verificar con auditorías independientes',
        'Informar públicamente los resultados',
      ], 'Conocer, actuar, verificar e informar: una cadena responsable se construye paso a paso.', { d: 2 }),
      op('Una empresa descubre trabajo infantil en una mina que le vende cobalto. ¿Qué respuesta recomienda la debida diligencia?', [ // e3
        'Actuar para eliminarlo y mejorar las condiciones',
        'Ocultar la información para no afectar su imagen',
        ['Dejar de comprar sin más y olvidarse del tema', 'Puede empujar a las familias a peores condiciones; la guía propone actuar para mejorar.'],
        'Comprar más barato a esa misma mina',
      ], 'La salida responsable busca mejorar las condiciones, no esconder el problema ni desentenderse.', { d: 3 }),
      numv(3, (i) => { // e4
        const [total, rdc] = [[290, 76], [290, 70], [240, 76]][i];
        return {
          enunciado: `Si la producción mundial de cobalto fue de ${total} mil toneladas y el ${rdc} % vino de la República Democrática del Congo, ¿cuántas miles de toneladas son? Redondeá al entero.`,
          valor: Math.round(total * rdc / 100),
          unidad: 'miles de toneladas',
          tol: 1,
          explicacion: `${total} × ${rdc} % ≈ ${Math.round(total * rdc / 100)} mil toneladas. Una concentración así hace que las condiciones de un país afecten a toda la cadena mundial.`,
          ctx: `${total} mil toneladas; ${rdc} % de un país.`,
        };
      }, { d: 2 }),
      op('¿Por qué abandonar de golpe una región minera con problemas puede no ser la mejor respuesta de una empresa?', [ // e4b
        'Puede dejar sin ingresos a familias que dependen de la mina',
        'Porque las empresas nunca pueden cambiar de proveedor',
        ['Porque así los problemas se resuelven solos', 'Irse no resuelve nada; puede empeorar la situación de la gente.'],
        'Porque la ley prohíbe dejar de comprar',
      ], 'La debida diligencia busca mejorar las condiciones con la gente que vive de esa actividad, no desentenderse.', { d: 3 }),
      teoria('Baterías sin cobalto', [
        'La tecnología también ayuda: una parte creciente de las baterías, como las de litio-hierro-fosfato (LFP), no usa cobalto ni níquel. Son algo más pesadas por la energía que guardan, pero más baratas y durables, y se usan cada vez más en autos eléctricos y en almacenamiento de energía. Cambiar la química de las baterías es otra forma de reducir riesgos.',
      ]),
      vf('Todas las baterías de litio necesitan cobalto.', false, 'Las baterías de litio-hierro-fosfato (LFP) no usan cobalto y son cada vez más comunes en autos eléctricos y almacenamiento.', { // e5
        razones: ['+Porque existen químicas como la LFP que no lo usan', '-Porque el cobalto es el único metal de las baterías', '-Porque las baterías no tienen metales'],
        d: 2,
      }),
      mult('¿Qué herramientas reducen los riesgos en las cadenas de minerales? Marcá todas.', [ // e6
        '+Debida diligencia según la guía de la OCDE',
        '+Normas que obligan a los importadores a controlar',
        '+Baterías que no usan cobalto',
        '+Reciclar metales de aparatos viejos',
        '-No preguntar de dónde vienen los materiales',
      ], 'Normas, tecnología y reciclaje se combinan para cadenas más responsables.', { d: 2 }),
      det('Leé este informe de una marca de celulares y marcá lo preocupante.', [ // e7
        ['Publicamos la lista de fundiciones que nos proveen.', false],
        ['No sabemos de dónde viene nuestro cobalto, pero confiamos en los proveedores.', true, 'Sin trazabilidad no hay debida diligencia.'],
        ['Hacemos auditorías independientes en nuestra cadena.', false],
        ['Si detectamos trabajo infantil, lo mantenemos en reserva.', true, 'Hay que actuar y transparentar, no ocultar.'],
      ], 'La transparencia sobre el origen es la base de una cadena responsable.', { d: 2 }),
      par('Uní cada concepto con su definición.', [ // e8
        ['Minería artesanal', 'Extracción a pequeña escala, a menudo manual'],
        ['Minerales en conflicto', 'Minerales cuya venta financió grupos armados'],
        ['Debida diligencia', 'Identificar y reducir riesgos en la cadena'],
        ['Batería LFP', 'Batería de litio sin cobalto ni níquel'],
      ], 'Cuatro conceptos para entender los riesgos de las cadenas de minerales.', { d: 2 }),
      comp('Completá.', 'En 2024, el Congo aportó cerca del [76] % del cobalto extraído en el mundo; el proceso para identificar y reducir riesgos en la cadena es la debida [diligencia]; y las baterías [LFP] no usan cobalto.', ['7', 'distancia', 'AAA'], 'Tres ideas sobre los riesgos de las cadenas de minerales.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Minería urbana', 'Los metales que ya están en los cajones: basura electrónica, reciclaje y cómo cerrar el ciclo de los aparatos.', [
      teoria('Una mina en los cajones', [
        'Según el Monitor Mundial de Residuos Electrónicos, en 2022 se generaron 62 millones de toneladas de basura electrónica, y solo alrededor del 22 % se recolectó y recicló de forma documentada. Esos aparatos contienen metales por un valor de unos 91.000 millones de dólares. Se habla de minería urbana para describir la recuperación de esos metales: en una tonelada de celulares viejos hay mucho más oro y cobre que en una tonelada de mineral de muchas minas.',
      ]),
      numv(3, (i) => { // e1
        const [total, pct] = [[62, 22], [62, 22], [62, 22]][i];
        return {
          enunciado: [
            `Si se generaron ${total} millones de toneladas de basura electrónica y se recicló de forma documentada el ${pct} %, ¿cuántos millones de toneladas NO se reciclaron de forma documentada? Redondeá a un decimal.`,
            `De ${total} millones de toneladas de basura electrónica, el ${pct} % se recicló de forma documentada. ¿Cuántos millones de toneladas quedaron fuera de ese reciclaje? Redondeá a un decimal.`,
            `Con ${total} millones de toneladas de basura electrónica y un ${pct} % de reciclaje documentado, ¿qué cantidad, en millones de toneladas, no tiene destino documentado? Redondeá a un decimal.`,
          ][i],
          valor: Math.round(total * (100 - pct) / 10) / 10,
          unidad: 'millones de toneladas',
          dec: 1,
          tol: 0.1,
          explicacion: `${total} × ${100 - pct} % ≈ ${(Math.round(total * (100 - pct) / 10) / 10).toLocaleString('es-AR')} millones de toneladas sin reciclaje documentado: una enorme mina desaprovechada.`,
          ctx: `${total} millones de toneladas; ${pct} % reciclado.`,
        };
      }, { d: 2 }),
      teoria('Por qué se recicla poco', [
        'Reciclar aparatos no es simple: están hechos de muchos materiales pegados o soldados, las cantidades de cada metal son chicas y hace falta tecnología especializada para recuperarlos sin contaminar. Además, muchos aparatos quedan guardados en cajones, se tiran con la basura común o se desarman de forma informal, quemando cables para sacar el cobre, lo que libera sustancias tóxicas.',
      ]),
      clas('¿Esto facilita o dificulta el reciclaje de un aparato?', { // e2
        'Facilita': ['Piezas atornilladas y separables', 'Puntos de recolección cerca de casa', 'Plantas con tecnología para recuperar metales'],
        'Dificulta': ['Batería pegada a la carcasa', 'Aparatos guardados en un cajón por años', 'Quemar cables a cielo abierto'],
      }, 'El diseño y la logística deciden cuánto se puede recuperar.', { d: 2 }),
      est('Estimá qué porcentaje de la basura electrónica del mundo se recolectó y recicló de forma documentada en 2022.', 22, { min: 0, max: 100, paso: 1, unidad: '%' }, 'Alrededor del 22 %, según el Monitor Mundial de Residuos Electrónicos. El resto no tiene un destino documentado.', { d: 2 }),
      cad('Armá el camino ideal de un celular viejo.', [ // e3
        'Se usa el máximo tiempo posible y se repara',
        'Cuando ya no sirve, se borra la información personal',
        'Se lleva a un punto de recolección de aparatos',
        'Una planta separa batería, plásticos y metales',
        'Los metales vuelven a la industria',
      ], ['Se tira con los restos de comida'], 'Usar, reparar, entregar, separar y recuperar: el ciclo completo de un aparato.', { d: 1 }),
      teoria('Las baterías', [
        'Las baterías de litio merecen cuidado: si se rompen o se aplastan, pueden incendiarse, por eso nunca van a la basura común ni al reciclaje de envases. Bien recicladas, permiten recuperar litio, cobalto, níquel y cobre. A medida que crezcan los autos eléctricos, las baterías usadas se convertirán en una fuente importante de materiales, y también pueden tener una "segunda vida" como almacenamiento de energía antes de reciclarse.',
      ]),
      vf('Una batería de litio usada se puede tirar en el tacho de reciclaje de envases.', false, 'Puede incendiarse en el camión o en la planta. Tiene que ir a puntos de recolección de pilas, baterías o aparatos electrónicos.', { // e4
        razones: ['+Porque puede incendiarse y necesita un circuito especial', '-Porque las baterías se reciclan con el vidrio', '-Porque las baterías de litio no tienen materiales valiosos'],
        d: 1,
      }),
      ord('Ordená la vida de una batería de auto eléctrico, de principio a fin.', [ // e5
        'Se usa en el auto durante años',
        'Pierde capacidad y deja de servir para el auto',
        'Se reutiliza como almacenamiento de energía',
        'Cuando ya no sirve, se recicla',
        'Sus metales se usan en baterías nuevas',
      ], 'Una segunda vida antes del reciclaje aprovecha mejor la batería.', { d: 2 }),
      op('¿Por qué la minería urbana no alcanza hoy para cubrir toda la demanda de litio?', [ // e6
        'La demanda crece más que las baterías descartadas',
        'Porque los aparatos viejos no tienen nada de litio',
        ['Porque el litio reciclado es tóxico para usar', 'Puede reciclarse de forma segura en plantas adecuadas.'],
        'Porque está prohibido reciclar baterías',
      ], 'Lo viste con la economía circular: mientras la demanda crezca, el reciclaje no alcanza solo. Pero su parte crece.', { d: 3 }),
      numv(3, (i) => { // e7
        const [cel, mg] = [[1000000, 30], [500000, 25], [2000000, 20]][i];
        return {
          enunciado: `Si se reciclan ${cel.toLocaleString('es-AR')} celulares y cada uno tiene unos ${mg} mg de oro, ¿cuántos kilos de oro se podrían recuperar como máximo?`,
          valor: (cel * mg) / 1000000,
          unidad: 'kg de oro',
          explicacion: `${cel.toLocaleString('es-AR')} × ${mg} mg = ${((cel * mg) / 1000).toLocaleString('es-AR')} g = ${((cel * mg) / 1000000).toLocaleString('es-AR')} kg de oro, sin abrir una mina nueva. Valores de ejemplo.`,
          ctx: `${cel} celulares; ${mg} mg de oro cada uno.`,
        };
      }, { d: 3 }),
      mult('¿Qué podés hacer con un celular que ya no usás? Marcá todo lo recomendable.', [ // e8
        '+Repararlo o dárselo a alguien que lo use',
        '+Venderlo o entregarlo para reacondicionar',
        '+Llevarlo a un punto de recolección de electrónicos',
        '-Tirarlo con la basura común',
        '-Guardarlo en un cajón para siempre',
      ], 'Un aparato guardado no sirve a nadie: sus metales quedan fuera del ciclo.', { d: 1 }),
      det('Leé esta nota y marcá lo equivocado.', [ // e9
        ['Solo una parte chica de la basura electrónica se recicla de forma documentada.', false],
        ['Quemar cables para sacar el cobre es una forma segura de reciclar.', true, 'Libera sustancias tóxicas; hace falta hacerlo en plantas adecuadas.'],
        ['Las baterías de autos eléctricos pueden tener una segunda vida.', false],
        ['Reciclando alcanza para no extraer más litio nunca.', true, 'Mientras la demanda crezca, el reciclaje solo no alcanza.'],
      ], 'La minería urbana es parte de la solución, junto con usar menos y usar más tiempo.', { d: 2 }),
      comp('Completá.', 'Recuperar metales de aparatos viejos se llama minería [urbana]; en 2022 se generaron [62] millones de toneladas de basura electrónica; y las baterías de litio usadas nunca van a la basura [común].', ['rural', '6', 'especial'], 'Tres ideas clave sobre la minería urbana.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: de la mina al celular', 'Materiales, litio, comunidades, cadenas responsables y minería urbana, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el nuevo proyecto en el salar', 'Una provincia de la Puna evalúa un nuevo proyecto de litio. Con los datos, definí las condiciones para decidir.', [
      teoria('El proyecto', [
        'Una empresa propone extraer litio por evaporación en un salar donde ya funcionan dos proyectos. Estima producir mineral por un valor en boca de mina de 600 millones de dólares por año. En la cuenca hay vegas de agua dulce que usan comunidades pastoras y flamencos. La empresa presentó un estudio de impacto solo de su proyecto y propone una reunión informativa con las comunidades una vez aprobados los permisos. Promete 300 empleos, pero no dice cuántos serían de la zona.',
      ]),
      num('¿Cuánto recibiría la provincia por año con regalías del 3 %, en millones de dólares?', 18, 'millones de dólares', '600 × 0,03 = 18 millones de dólares por año, como máximo, por regalías.', { ctx: '600 millones en boca de mina; regalías del 3 %.', d: 1 }),
      mult('¿Qué problemas tiene la propuesta tal como está? Marcá todos.', [ // e2
        '+El estudio no evalúa el impacto acumulativo con los otros dos proyectos',
        '+La reunión con las comunidades sería después de aprobar los permisos',
        '+No se sabe cuánto empleo sería local',
        '-Produce litio, que sirve para baterías',
        '-El salar está en la Puna',
      ], 'Los problemas no son que exista el proyecto, sino cómo se evalúa y se decide.', { d: 2 }),
      ord('Ordená lo que debería pasar antes de decidir.', [ // e3
        'Estudiar el agua de toda la cuenca, con los tres proyectos',
        'Consultar a las comunidades de forma previa, libre e informada',
        'Definir monitoreo independiente de las vegas',
        'Acordar empleo local y beneficios para la zona',
        'Decidir si se aprueba y con qué condiciones',
      ], 'Primero la información, después el diálogo, y recién al final la decisión.', { d: 3 }),
      op('¿Por qué el monitoreo de las vegas debería ser independiente de la empresa?', [ // e4
        'Para que los datos sean creíbles para todas las partes',
        'Porque la empresa no sabe medir el agua',
        ['Porque así el proyecto se aprueba más rápido', 'El objetivo es la confianza en los datos, no la velocidad.'],
        'Porque las vegas no se pueden medir',
      ], 'Lo viste con los conflictos de interés: quien tiene intereses en el resultado no debería ser el único que mide.', { d: 2 }),
      clas('Clasificá estas condiciones.', { // e5
        'Condiciones razonables': ['Monitoreo público del agua en tiempo real', 'Consulta previa con las comunidades', 'Plan de cierre y remediación con garantía', 'Cupos de empleo y capacitación local'],
        'Condiciones insuficientes': ['Una reunión informativa después de aprobar', 'Un estudio solo del propio proyecto'],
      }, 'Las condiciones razonables reducen riesgos y dan legitimidad; las insuficientes los trasladan al futuro.', { d: 2 }),
      vf('Si la provincia necesita recursos, puede saltear la consulta previa para acelerar el proyecto.', false, 'La consulta es un derecho reconocido por el Convenio 169, que tiene jerarquía superior a las leyes. Saltearla además suele generar conflictos que demoran más los proyectos.', { // e6
        razones: ['+Porque es un derecho reconocido y saltearla genera conflictos', '-Porque la consulta es solo una recomendación sin valor', '-Porque las comunidades no usan el agua'],
        d: 2,
      }),
      det('La provincia redacta su resolución. Marcá lo que conviene corregir.', [ // e7
        ['Se exigirá un estudio de impacto acumulativo de la cuenca.', false],
        ['La consulta a las comunidades se hará una vez que la mina funcione.', true, 'Tiene que ser previa a la decisión.'],
        ['Habrá monitoreo independiente y público de las vegas.', false],
        ['No se pedirá plan de cierre porque la mina durará muchos años.', true, 'El plan de cierre y su garantía se definen desde el principio.'],
      ], 'Una buena decisión pública combina información, derechos y condiciones exigibles.', { d: 3 }),
    ]),
  ],
});
