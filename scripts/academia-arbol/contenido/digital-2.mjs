import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// DIGITAL 2 — Tecnología que ayuda.
// El otro lado de lo digital: satélites que vigilan bosques e incendios,
// sensores y datos abiertos, ciencia ciudadana con el celular, energía
// inteligente, y los límites de confiar todo a la tecnología. Retoma medir
// bien (ciencia-1 si ya la hiciste) y la huella digital (digital-1).

export default unidad({
  slug: 'digital-2',
  rama: 'digital',
  orden: 2,
  nivel: 1,
  requiereTronco: 1,
  titulo: 'Tecnología que ayuda',
  bajada: 'Satélites que detectan incendios, sensores que miden el aire y apps que suman a la ciencia: lo que la tecnología hace por el ambiente, y lo que no puede hacer.',
  objetivos: [
    'Describir cómo los satélites ayudan a vigilar bosques, incendios, agua y hielo',
    'Explicar el valor de los sensores y los datos abiertos',
    'Participar de proyectos de ciencia ciudadana con buenos registros',
    'Reconocer cómo la tecnología ayuda a usar mejor la energía',
    'Evaluar los límites de la tecnología: efecto rebote, brecha digital y tecnosolucionismo',
  ],
  repasa: ['digital-1', 'tronco-1'],
  fuentes: ['global-forest-watch', 'nasa-firms', 'conae', 'argentinat', 'ebird', 'gbif', 'iea-eficiencia'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('El planeta visto desde el espacio', 'Satélites que detectan desmontes, incendios, glaciares que retroceden y suelos húmedos o secos.', [
      teoria('Ojos en órbita', [
        'Cientos de satélites observan la Tierra todos los días. Con sus imágenes se puede ver dónde se desmontó un bosque, dónde hay un incendio activo, cómo retrocede un glaciar, cuánta agua tiene una laguna o qué tan húmedo está el suelo.',
        'Muchos de esos datos son abiertos y gratuitos: cualquiera puede consultarlos en internet. Eso permitió que organizaciones, periodistas y vecinos vigilen lo que antes solo veían los gobiernos.',
      ]),
      mult('¿Qué se puede observar con satélites? Marcá todo.', [ // e1
        '+Desmontes de bosques',
        '+Incendios activos',
        '+Retroceso de glaciares',
        '+Superficie de lagunas y humedales',
        '-Qué especie de pájaro canta en tu plaza',
      ], 'Los satélites ven cambios de superficie grandes. Para las especies, hacen falta observaciones en el terreno.', { d: 1 }),
      teoria('Incendios en tiempo casi real', [
        'Sistemas como FIRMS, de la NASA, detectan focos de calor desde satélites y publican su ubicación en pocas horas. Brigadistas, investigadores y periodistas los usan para seguir incendios, como los de los humedales del Delta del Paraná en 2020, 2022 y 2023.',
        'También se usan imágenes posteriores para medir cuántas hectáreas se quemaron.',
      ]),
      cad('Armá la cadena de cómo un satélite ayuda a combatir un incendio.', [ // e2
        'Un satélite detecta un foco de calor anómalo',
        'El sistema publica su ubicación en pocas horas',
        'Las brigadas ven el foco en el mapa',
        'Llegan antes al lugar',
        'Es más fácil controlar el fuego mientras es chico',
      ], ['El satélite apaga el fuego desde el espacio'], 'Detectar temprano es clave: un incendio chico es mucho más fácil de controlar.', { d: 2 }),
      teoria('Bosques y desmontes', [
        'Plataformas como Global Forest Watch muestran, a partir de imágenes satelitales, dónde se perdió cobertura forestal año a año, y emiten alertas casi semanales de desmontes. En el Gran Chaco, uno de los lugares con mayor pérdida de bosques del mundo, estas herramientas permiten ver desmontes incluso en zonas donde la ley no los permite.',
      ]),
      op('¿Qué permite hacer una plataforma de alertas de desmonte con imágenes satelitales?', [ // e3
        'Ver dónde y cuándo se pierde bosque, casi en tiempo real',
        'Plantar árboles automáticamente desde el espacio',
        ['Castigar a los responsables sin ninguna investigación', 'Las imágenes muestran el cambio; después hacen falta controles en el terreno y la ley.'],
        'Saber cuántos pájaros hay en cada árbol',
      ], 'La imagen es evidencia. Transformarla en protección requiere controles, leyes y decisiones.', { d: 2 }),
      teoria('Satélites argentinos', [
        'Argentina tiene su propia agencia espacial, la CONAE, que desarrolló satélites de observación de la Tierra. Los satélites SAOCOM usan un radar que "ve" a través de las nubes y de noche, y miden la humedad del suelo: esos mapas sirven para planificar la agricultura, anticipar inundaciones y seguir sequías.',
      ]),
      par('Uní cada herramienta con lo que observa.', [ // e4
        ['FIRMS (NASA)', 'Focos de incendios activos'],
        ['Global Forest Watch', 'Pérdida de bosques y alertas de desmonte'],
        ['SAOCOM (CONAE)', 'Humedad del suelo con radar'],
        ['Imágenes de glaciares en distintos años', 'Retroceso del hielo'],
      ], 'Distintas herramientas para distintas preguntas sobre el planeta.', { d: 2 }),
      vf('Un radar satelital como el de los SAOCOM no puede observar cuando hay nubes.', false, 'El radar emite su propia señal y la atraviesa por las nubes, de día y de noche. Por eso es muy útil en temporadas de lluvias.', { // e5
        razones: ['+Porque el radar emite su propia señal que atraviesa las nubes', '-Porque los radares solo funcionan de día', '-Porque las nubes reflejan el radar hacia el espacio'],
        d: 3,
      }),
      numv(3, (i) => { // e6
        const ha = [5000, 12000, 800][i];
        const cancha = 0.7;
        return {
          enunciado: `Un satélite muestra que se quemaron ${ha.toLocaleString('es-AR')} hectáreas de humedal. Si una cancha de fútbol tiene unas 0,7 hectáreas, ¿a cuántas canchas equivale? Redondeá al entero.`,
          valor: Math.round(ha / cancha),
          unidad: 'canchas',
          tol: 2,
          explicacion: `${ha.toLocaleString('es-AR')} ÷ 0,7 ≈ ${Math.round(ha / cancha).toLocaleString('es-AR')} canchas. Traducir hectáreas a algo conocido ayuda a dimensionar.`,
        };
      }, { d: 2 }),
      clas('¿Esta pregunta se responde bien con satélites o necesita trabajo en el terreno?', { // e7
        'Satélite': ['¿Cuántas hectáreas se desmontaron este año?', '¿Dónde hay focos de incendio ahora?', '¿Cuánto retrocedió un glaciar en diez años?'],
        'Terreno': ['¿Qué especies de ranas viven en esta laguna?', '¿Qué contaminantes tiene el agua del arroyo?'],
      }, 'Satélites y trabajo en el terreno se complementan: uno ve lo grande, el otro lo fino.', { d: 2 }),
      rank('Ordená estas herramientas según qué tan rápido informan un cambio, de más rápida a más lenta.', [
        ['Detección de focos de incendio', 'en horas'],
        ['Alertas de desmonte', 'semanales'],
        ['Mapas de pérdida de bosque', 'anuales'],
        ['Comparación de glaciares', 'entre años o décadas'],
      ], 'Cada fenómeno tiene su ritmo: un incendio se mide en horas; un glaciar, en años.', { d: 2, extremos: ['Más rápida', 'Más lenta'] }),
      vf('Los datos de los satélites de observación de la Tierra son siempre secretos y pagos.', false, 'Muchos son abiertos y gratuitos, como los de FIRMS o los mapas de Global Forest Watch. Eso permite que cualquiera los use para vigilar el ambiente.', {
        razones: ['+Porque muchos son abiertos y gratuitos', '-Porque los satélites no generan datos', '-Porque solo los militares pueden ver imágenes satelitales'],
        d: 1,
      }),
      det('Leé este comentario y marcá lo equivocado.', [ // e8
        ['Los satélites pueden detectar focos de incendio.', false],
        ['Si un satélite detecta un desmonte, el problema se resuelve solo.', true, 'La imagen es evidencia; hacen falta controles y aplicar la ley.'],
        ['Muchos datos satelitales son abiertos y gratuitos.', false],
        ['Con un satélite se sabe qué especies de insectos hay en un campo.', true, 'Eso requiere observaciones en el terreno.'],
      ], 'Los satélites son poderosos, pero no lo resuelven todo.', { d: 2 }),
      comp('Completá.', 'Los satélites detectan focos de [incendio] y [desmontes]; los SAOCOM argentinos miden la humedad del [suelo].', ['lluvia', 'terremotos', 'mar'], 'Tres usos de los satélites para el ambiente.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Sensores y datos abiertos', 'Estaciones meteorológicas, sensores de aire y agua, y por qué los datos abiertos cambian las reglas.', [
      teoria('Medir en todos lados', [
        'Además de los satélites, hay redes de sensores en el terreno: estaciones meteorológicas que miden lluvia, temperatura y viento; sensores de calidad del aire; medidores del nivel de los ríos; boyas en el mar. Juntos permiten pronosticar el tiempo, alertar crecidas y seguir la contaminación.',
        'Los sensores de bajo costo hicieron posible que escuelas y vecinos midan su propio aire o su propia lluvia, como viste en la rama de Aire y Suelo.',
      ]),
      par('Uní cada sensor con lo que mide.', [ // e1
        ['Pluviómetro', 'Lluvia'],
        ['Sensor de PM2,5', 'Partículas finas en el aire'],
        ['Limnímetro', 'Nivel del agua de un río'],
        ['Anemómetro', 'Velocidad del viento'],
      ], 'Cada instrumento responde una pregunta concreta.', { d: 2 }),
      teoria('Datos abiertos', [
        'Los datos abiertos son datos que cualquiera puede consultar, descargar y usar libremente. Muchos organismos publican datos ambientales abiertos: emisiones, calidad del agua, lluvias, caudales, áreas protegidas.',
        'En Argentina, la Ley 25.831 garantiza el derecho de acceso a la información pública ambiental. Cuando los datos son abiertos, más personas pueden analizarlos, detectar problemas y controlar a quienes toman decisiones.',
      ]),
      cad('Armá la cadena de cómo los datos abiertos pueden mejorar una política ambiental.', [ // e2
        'Un organismo publica los datos de calidad del agua de un río',
        'Periodistas e investigadores los analizan',
        'Detectan un punto que empeora año a año',
        'Lo difunden y los vecinos piden explicaciones',
        'El organismo investiga y toma medidas',
      ], ['Los datos abiertos arreglan el río automáticamente'], 'La transparencia multiplica los ojos que miran. Es una herramienta de control ciudadano.', { d: 2 }),
      vf('Los datos ambientales públicos solo pueden usarlos los organismos del Estado.', false, 'La Ley 25.831 garantiza el acceso a la información pública ambiental. Los datos abiertos pueden usarlos cualquier persona, escuela u organización.', { // e3
        razones: ['+Porque la ley garantiza el acceso a la información ambiental', '-Porque los datos ambientales son secretos por ley', '-Porque solo los científicos pueden leer datos'],
        d: 2,
      }),
      teoria('Calidad de los datos', [
        'No todos los datos valen lo mismo. Un sensor sin calibrar, mal ubicado o sin mantenimiento puede dar números equivocados. Por eso los datos buenos vienen con información sobre cómo se midieron: dónde, cuándo, con qué instrumento y con qué precisión. Esa información se llama metadatos.',
      ]),
      mult('¿Qué información debería acompañar a un conjunto de datos para confiar en él? Marcá todo.', [ // e4
        '+Dónde se midió',
        '+Cuándo se midió',
        '+Con qué instrumento',
        '+Qué precisión tiene',
        '-Quién tiene más seguidores en redes',
      ], 'Los metadatos permiten saber si un dato sirve para lo que se quiere usar.', { d: 1 }),
      clas('¿Este sensor está bien ubicado o mal ubicado?', { // e5
        'Bien ubicado': ['Termómetro a la sombra, en un abrigo ventilado', 'Pluviómetro en un lugar abierto, lejos de árboles', 'Sensor de aire a la altura de las personas'],
        'Mal ubicado': ['Termómetro al sol sobre una chapa', 'Pluviómetro debajo de un árbol', 'Sensor de aire pegado al caño de escape de un generador'],
      }, 'La ubicación puede arruinar la medición del mejor instrumento. Es el error sistemático de la rama de Ciencia.', { d: 2 }),
      numv(3, (i) => { // e6
        const mm = [[12, 0, 35, 8, 0, 20, 5], [0, 4, 0, 60, 2, 0, 14], [25, 18, 0, 0, 3, 40, 9]][i];
        const tot = mm.reduce((a, b) => a + b, 0);
        return {
          enunciado: `Un pluviómetro escolar registró en una semana: ${mm.join(', ')} mm. ¿Cuántos mm llovieron en total?`,
          valor: tot,
          unidad: 'mm',
          explicacion: `${mm.join(' + ')} = ${tot} mm. Cada milímetro equivale a un litro por metro cuadrado.`,
        };
      }, { d: 1 }),
      op('Un municipio quiere saber si el aire de un barrio mejoró. ¿Qué es lo más importante del sensor?', [ // e7
        'Medir siempre en el mismo lugar y con el mismo método',
        'Que tenga una pantalla de colores',
        ['Moverlo cada semana a un lugar distinto', 'Si cambia el lugar, no se puede saber si cambió el aire o cambió la ubicación.'],
        'Que lo instale la persona con más seguidores',
      ], 'Para comparar en el tiempo, hay que mantener constantes el lugar y el método.', { d: 2 }),
      det('Leé este informe barrial y marcá lo problemático.', [ // e8
        ['Instalamos un pluviómetro en la terraza, lejos de paredes.', false],
        ['El termómetro lo pusimos sobre la chapa del techo para que tome bien el sol.', true, 'Al sol marca más que la temperatura del aire: es un error sistemático.'],
        ['Publicamos los datos con fecha, lugar e instrumento.', false],
        ['No anotamos cuándo cambiamos las pilas del sensor, no importa.', true, 'Los cambios en el instrumento son metadatos importantes para interpretar los datos.'],
      ], 'Datos buenos: bien medidos y bien documentados.', { d: 3 }),
      comp('Completá.', 'Los datos que cualquiera puede usar se llaman datos [abiertos]; la información sobre cómo se midieron se llama [metadatos].', ['cerrados', 'rumores'], 'Dos conceptos para usar bien los datos ambientales.', { d: 1 }),
      est('Estimá cuántos litros de agua caen sobre un metro cuadrado con una lluvia de 20 mm.', 20, { min: 1, max: 200, paso: 1, unidad: 'litros' }, 'Un milímetro de lluvia es un litro por metro cuadrado: 20 mm son 20 litros en cada metro cuadrado.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Ciencia ciudadana con el celular', 'Fotos de especies, registros de aves y reportes ambientales: cómo cualquiera puede aportar datos útiles a la ciencia.', [
      teoria('Qué es la ciencia ciudadana', [
        'La ciencia ciudadana es la participación de personas no especialistas en investigaciones científicas: contar aves, fotografiar plantas e insectos, medir la lluvia, reportar la calidad del agua. Con millones de participantes se reúnen datos que ningún equipo científico podría juntar solo.',
        'En Argentina, plataformas como ArgentiNat (la versión local de iNaturalist) y eBird reúnen cientos de miles de observaciones que usan investigadores y organismos de conservación. Muchas terminan en bases de datos globales como GBIF.',
      ]),
      par('Uní cada plataforma con lo que se registra en ella.', [ // e1
        ['ArgentiNat', 'Fotos de cualquier ser vivo con su ubicación'],
        ['eBird', 'Listas de aves observadas'],
        ['GBIF', 'Base global que reúne registros de biodiversidad'],
      ], 'Tres herramientas conectadas: los registros locales alimentan bases globales.', { d: 2 }),
      teoria('Un buen registro', [
        'Para que una observación sirva a la ciencia necesita: una foto nítida (o varias, de distintos ángulos), la fecha, la ubicación precisa y, si se puede, una nota sobre el ambiente. En ArgentiNat, otras personas —incluidas especialistas— ayudan a identificar la especie; cuando varias coinciden, el registro pasa a "grado de investigación".',
        'Un registro sin ubicación o con una foto borrosa casi no sirve, aunque la especie sea rara.',
      ]),
      mult('¿Qué hace útil un registro de ciencia ciudadana? Marcá todo.', [ // e2
        '+Foto nítida',
        '+Fecha',
        '+Ubicación precisa',
        '+Nota sobre el ambiente',
        '-Un filtro de colores en la foto',
      ], 'Los filtros pueden cambiar los colores y dificultar la identificación.', { d: 1 }),
      ord('Ordená los pasos para subir un buen registro a ArgentiNat.', [ // e3
        'Encontrar un ser vivo sin molestarlo',
        'Sacar varias fotos nítidas desde distintos ángulos',
        'Registrar fecha y ubicación',
        'Subirlo con una identificación tentativa',
        'Esperar que la comunidad confirme la especie',
      ], 'Observar sin molestar, documentar bien y dejar que la comunidad ayude a identificar.', { d: 1, extremos: ['Primero', 'Último'] }),
      cad('Armá la cadena de cómo una foto en tu patio puede ayudar a la conservación.', [ // e4
        'Fotografiás una rana en tu patio y la subís con ubicación',
        'La comunidad confirma que es una especie amenazada',
        'El registro llega a bases de datos de biodiversidad',
        'Investigadores descubren que hay una población en tu zona',
        'Se pueden tomar medidas para proteger ese ambiente',
      ], ['La foto hace que la rana deje de estar amenazada'], 'Muchos descubrimientos empezaron con un registro de alguien no especialista.', { d: 2 }),
      vf('Los datos de ciencia ciudadana no sirven porque no los toman especialistas.', false, 'Con buenos registros y verificación de la comunidad, se usan en investigaciones publicadas y en decisiones de conservación. La cantidad y la cobertura compensan muchas limitaciones.', { // e5
        razones: ['+Porque con buenos registros y verificación se usan en investigaciones', '-Porque los especialistas no revisan nunca los datos', '-Porque solo sirven los datos de satélites'],
        d: 2,
      }),
      teoria('Cuidar lo que se observa', [
        'Observar no debe dañar: no se sacan animales de su lugar para fotografiarlos, no se acercan a nidos, no se pisotean plantas. En especies muy amenazadas o buscadas por el tráfico, las plataformas pueden ocultar la ubicación exacta para protegerlas.',
      ]),
      clas('¿Esta práctica es correcta o incorrecta al hacer ciencia ciudadana?', { // e6
        'Correcta': ['Fotografiar un ave desde lejos con zoom', 'Registrar una planta sin arrancarla', 'Ocultar la ubicación de una especie buscada por traficantes'],
        'Incorrecta': ['Mover un sapo a un lugar más lindo para la foto', 'Acercarse a un nido para una mejor toma', 'Arrancar una flor para fotografiarla en casa'],
      }, 'La ciencia ciudadana suma datos sin restar naturaleza.', { d: 2 }),
      op('Encontrás un ave rara y querés registrarla. ¿Qué es lo más importante?', [ // e7
        'Una foto nítida con fecha y ubicación, sin molestarla',
        'Acercarte lo más posible aunque se asuste',
        ['Esperar a que vuelva otro día para estar seguro', 'Registrá lo que viste ahora: un registro bien documentado ya es valioso.'],
        'Compartirla solo en tus redes sin ubicación',
      ], 'Un buen registro, hecho con respeto, es el aporte.', { d: 1 }),
      numv(3, (i) => { // e8
        const pers = [500, 1000, 200][i];
        const reg = [20, 15, 50][i];
        return {
          enunciado: `En un censo de aves, ${pers.toLocaleString('es-AR')} personas hacen ${reg} registros cada una. ¿Cuántos registros se juntan?`,
          valor: pers * reg,
          unidad: 'registros',
          explicacion: `${pers.toLocaleString('es-AR')} × ${reg} = ${(pers * reg).toLocaleString('es-AR')} registros. Ningún equipo científico podría juntar tantos por su cuenta.`,
        };
      }, { d: 1 }),
      det('Leé este consejo de un grupo de observadores y marcá lo equivocado.', [ // e9
        ['Registrá fecha y ubicación en cada observación.', false],
        ['Si el ave está lejos, tirale una piedra cerca para que se mueva.', true, 'Nunca se molesta a la fauna para una foto.'],
        ['Dejá que la comunidad ayude con la identificación.', false],
        ['Si no estás seguro de la especie, no lo subas nunca.', true, 'Se puede subir con una identificación tentativa: la comunidad ayuda.'],
      ], 'Registros buenos y respetuosos: la base de la ciencia ciudadana.', { d: 2 }),
      comp('Completá.', 'La participación de personas no especialistas en investigaciones se llama ciencia [ciudadana]; un buen registro necesita foto, fecha y [ubicación].', ['privada', 'filtro'], 'La idea central de la lección, resumida en una línea.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Energía inteligente', 'Medidores inteligentes, termostatos, gestión de la demanda y redes que se adaptan a las renovables.', [
      teoria('Ver el consumo en tiempo real', [
        'Los medidores inteligentes registran el consumo de electricidad hora por hora y lo muestran en una app o en la factura. Ver cuándo y en qué se consume ayuda a detectar derroches, como un aparato que queda encendido de noche.',
        'Los termostatos programables apagan o bajan la calefacción cuando no hay nadie, y la encienden un rato antes de volver.',
      ]),
      cad('Armá la cadena de cómo un medidor inteligente ayuda a ahorrar.', [ // e1
        'El medidor registra el consumo hora por hora',
        'La familia ve un consumo alto a las 3 de la mañana',
        'Descubre un calefactor olvidado en una habitación',
        'Lo apaga y el consumo nocturno baja',
      ], ['El medidor apaga solo cualquier aparato'], 'Ver el consumo es el primer paso para cambiarlo. Medir para entender, como en el tronco.', { d: 2 }),
      teoria('La demanda y las renovables', [
        'La electricidad tiene que producirse en el mismo momento en que se consume. El sol y el viento no siempre generan cuando más se necesita. Por eso, cada vez más, se busca mover el consumo a los momentos de más generación renovable: cargar un auto eléctrico o calentar agua cuando hay mucho viento o sol.',
        'Eso se llama gestión de la demanda, y la tecnología digital —precios que cambian por hora, aparatos que se encienden solos en el mejor momento— la hace posible.',
      ]),
      op('¿Qué es la gestión de la demanda eléctrica?', [ // e2
        'Mover consumos a los momentos en que conviene generar',
        'Prohibir el uso de electricidad de noche',
        ['Producir siempre la misma cantidad de electricidad', 'La generación y el consumo cambian; la idea es acercarlos.'],
        'Cobrar lo mismo sin importar la hora',
      ], 'Adaptar el consumo a la generación, sobre todo cuando hay mucho sol y viento, ayuda a integrar renovables.', { d: 2 }),
      clas('¿Este uso se puede mover a otro horario o no conviene moverlo?', { // e3
        'Se puede mover': ['Cargar un auto eléctrico', 'Calentar agua en un termotanque eléctrico', 'Poner el lavarropas'],
        'No conviene moverlo': ['La heladera', 'La luz de la cocina mientras cocinás', 'Un respirador médico'],
      }, 'Los consumos flexibles son la herramienta de la gestión de la demanda.', { d: 2 }),
      numv(3, (i) => { // e4
        const kwh = [10, 15, 8][i];
        const caro = [150, 180, 120][i];
        const barato = [90, 100, 70][i];
        return {
          enunciado: `Un auto eléctrico carga ${kwh} kWh por día. Si el kWh cuesta $${caro} en horario pico y $${barato} de madrugada, ¿cuánto se ahorra por día cargando de madrugada?`,
          valor: kwh * (caro - barato),
          unidad: '$',
          explicacion: `${kwh} × (${caro} − ${barato}) = $${(kwh * (caro - barato)).toLocaleString('es-AR')} por día. Los precios por horario incentivan mover el consumo.`,
        };
      }, { d: 2 }),
      vf('La electricidad se puede producir de sobra un día y guardarla toda en los cables para usarla después.', false, 'Los cables no guardan energía. Para almacenar hacen falta baterías, represas de bombeo u otros sistemas. Por eso importa acercar el consumo a la generación.', { // e5
        razones: ['+Porque los cables transportan pero no almacenan energía', '-Porque la electricidad se guarda en los enchufes', '-Porque sobra electricidad siempre'],
        d: 2,
      }),
      teoria('Edificios que se regulan solos', [
        'En edificios grandes, sistemas de gestión digital controlan la iluminación, la calefacción y el aire acondicionado según la ocupación, la hora y el clima. Con sensores de presencia y de luz natural, se pueden lograr ahorros importantes sin que nadie tenga que acordarse de apagar nada.',
      ]),
      mult('¿Qué tecnologías ayudan a ahorrar energía en un edificio? Marcá todas.', [ // e6
        '+Sensores de presencia para las luces',
        '+Termostatos programables',
        '+Medidores inteligentes',
        '+Sensores de luz natural',
        '-Pantallas encendidas las 24 horas en cada pasillo',
      ], 'La tecnología que mide y controla puede ahorrar mucho. La que suma consumo sin sentido, no.', { d: 1 }),
      par('Uní cada tecnología con lo que hace.', [ // e7
        ['Medidor inteligente', 'Muestra el consumo hora por hora'],
        ['Termostato programable', 'Ajusta la calefacción según el horario'],
        ['Sensor de presencia', 'Apaga luces donde no hay nadie'],
        ['Precio por horario', 'Incentiva consumir en las mejores horas'],
      ], 'Cuatro herramientas de la energía inteligente.', { d: 1 }),
      vf('Un medidor inteligente reduce el consumo por sí solo, aunque nadie cambie nada.', false, 'El medidor muestra la información; el ahorro aparece cuando alguien actúa con ella, o cuando se combina con aparatos que se regulan solos.', {
        razones: ['+Porque el ahorro depende de lo que se haga con la información', '-Porque los medidores apagan toda la casa', '-Porque los medidores consumen más de lo que ahorran'],
        d: 2,
      }),
      op('Es un día de mucho viento, la red tiene energía eólica de sobra y el precio está bajo. ¿Qué conviene hacer con un termotanque eléctrico programable?', [
        'Calentar el agua en ese momento',
        'Apagarlo hasta que baje el viento',
        ['Esperar al horario pico de la noche', 'En el pico la electricidad es más cara y suele generarse con más gas.'],
        'Desenchufarlo para siempre',
      ], 'Guardar energía como agua caliente cuando sobra renovable es gestión de la demanda en acción.', { d: 2 }),
      det('Leé esta publicidad y marcá lo exagerado.', [ // e8
        ['Nuestro termostato apaga la calefacción cuando no hay nadie.', false],
        ['Con nuestra app, tu casa no va a consumir energía nunca más.', true, 'Puede ayudar a ahorrar, pero la casa sigue consumiendo energía.'],
        ['El medidor te muestra el consumo de cada hora.', false],
        ['Instalar un sensor compensa tener la calefacción a 26 °C todo el día.', true, 'La tecnología ayuda, pero no compensa un hábito que derrocha mucho.'],
      ], 'La tecnología es una aliada, no una varita mágica.', { d: 2 }),
      comp('Completá.', 'Mover consumos a las horas de más generación se llama gestión de la [demanda]; los medidores [inteligentes] muestran el consumo por hora.', ['oferta', 'analógicos'], 'Dos ideas clave de la energía inteligente.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Los límites de la tecnología', 'Efecto rebote, brecha digital, privacidad y la tentación de creer que la tecnología sola lo resuelve todo.', [
      teoria('El efecto rebote', [
        'Cuando una tecnología hace algo más eficiente y más barato, a veces se usa tanto más que el ahorro se achica o desaparece. Se llama efecto rebote. Si las lámparas LED gastan poco, puede que se dejen más luces encendidas; si un auto consume menos, puede que se viaje más.',
        'La eficiencia sigue siendo buena, pero hay que acompañarla con hábitos y reglas para que el ahorro se mantenga.',
      ]),
      cad('Armá la cadena de un efecto rebote.', [ // e1
        'Un auto nuevo consume la mitad de nafta',
        'Viajar en auto se vuelve más barato',
        'La familia viaja más kilómetros',
        'Parte del ahorro de nafta se pierde',
      ], ['El auto eficiente obliga a viajar menos'], 'La eficiencia ahorra, salvo que el ahorro se "gaste" usando más.', { d: 2 }),
      vf('Una tecnología más eficiente siempre reduce el consumo total en la misma proporción.', false, 'Por el efecto rebote, parte del ahorro puede perderse si se usa más. Hace falta acompañar la eficiencia con hábitos y reglas.', { // e2
        razones: ['+Porque el efecto rebote puede aumentar el uso', '-Porque las tecnologías eficientes consumen más', '-Porque la eficiencia no existe'],
        d: 3,
      }),
      teoria('Brecha digital', [
        'No todas las personas tienen el mismo acceso a la tecnología: conexión, dispositivos, habilidades. Si las soluciones ambientales dependen solo de apps o de aparatos caros, pueden dejar afuera a quienes más necesitan ayuda. Una buena política ambiental piensa también en quienes no tienen acceso.',
      ]),
      op('Un municipio anuncia que las alertas de inundación solo se enviarán por una app. ¿Cuál es el problema?', [ // e3
        'Deja afuera a quienes no tienen celular o conexión',
        'Las apps no pueden enviar alertas',
        ['Ninguno: todo el mundo tiene la app', 'No todos tienen celular, datos o la app instalada, y a menudo son quienes viven en zonas más expuestas.'],
        'Las inundaciones no se pueden pronosticar',
      ], 'Las alertas tienen que llegar a todos: sirenas, radio, mensajes de texto y referentes barriales, además de apps.', { d: 2 }),
      teoria('Tecnosolucionismo', [
        'El tecnosolucionismo es la idea de que cualquier problema se resuelve con una tecnología nueva, sin cambiar hábitos, reglas ni sistemas. Por ejemplo, esperar que una máquina capture todo el CO₂ en lugar de dejar de emitirlo, o que una app resuelva la basura sin separar ni reducir.',
        'La tecnología ayuda mucho, pero casi siempre funciona mejor combinada con cambios de comportamiento, de políticas y de diseño.',
      ]),
      clas('¿Es un enfoque equilibrado o tecnosolucionista?', { // e4
        'Equilibrado': ['Sensores de aire más una ley que controle las emisiones', 'Satélites para detectar desmontes más controles en el terreno', 'Medidores inteligentes más hábitos de ahorro'],
        'Tecnosolucionista': ['Seguir emitiendo porque algún día se inventará algo', 'Una app de reciclaje sin sistema de recolección', 'Plantar árboles digitales en un juego para compensar un vuelo'],
      }, 'La tecnología potencia las soluciones; rara vez las reemplaza.', { d: 3 }),
      mult('¿Qué riesgos tiene confiar todo a la tecnología? Marcá todos.', [ // e5
        '+Efecto rebote que se come el ahorro',
        '+Dejar afuera a quienes no tienen acceso',
        '+Postergar cambios necesarios esperando un invento',
        '+Problemas de privacidad con los datos personales',
        '-Que la tecnología funcione demasiado bien',
      ], 'Reconocer los riesgos permite aprovechar la tecnología sin caer en sus trampas.', { d: 2 }),
      teoria('Privacidad', [
        'Muchas tecnologías inteligentes recolectan datos personales: cuándo estás en tu casa, cuánto consumís, por dónde te movés. Esos datos pueden ayudar a ahorrar, pero también pueden usarse para otras cosas. Conviene saber qué datos recolecta una app o un aparato, quién los usa y para qué.',
      ]),
      ord('Ordená los pasos para usar una app de energía cuidando tus datos.', [ // e6
        'Leer qué datos recolecta',
        'Revisar quién los usa y para qué',
        'Ajustar los permisos a lo necesario',
        'Usarla para detectar consumos y ahorrar',
      ], 'Aprovechar la tecnología con criterio, también sobre la propia información.', { d: 1, extremos: ['Primero', 'Último'] }),
      rank('Ordená estas soluciones para bajar las emisiones de una ciudad, de la más completa a la más limitada.', [ // e7
        ['Transporte público eléctrico más ciclovías más reglas de estacionamiento', 'combina tecnología, diseño y reglas'],
        ['Colectivos eléctricos sin cambios en la frecuencia', 'tecnología sola, útil'],
        ['Una app que calcula tu huella de transporte', 'informa pero no cambia opciones'],
        ['Esperar autos voladores eléctricos', 'tecnosolucionismo'],
      ], 'Las soluciones más completas combinan tecnología con cambios en el sistema.', { d: 3, extremos: ['Más completa', 'Más limitada'] }),
      par('Uní cada concepto con su ejemplo.', [
        ['Efecto rebote', 'Con lámparas LED, se dejan más luces prendidas'],
        ['Brecha digital', 'Alertas solo por app en barrios sin conexión'],
        ['Tecnosolucionismo', 'Seguir emitiendo esperando un invento'],
        ['Privacidad', 'Una app que sabe cuándo no hay nadie en casa'],
      ], 'Cuatro límites de la tecnología que conviene reconocer en la vida real.', { d: 2 }),
      numv(3, (i) => {
        const km2 = [12000, 14000, 16000][i];
        return {
          enunciado: `Una familia viajaba 10.000 km por año con un auto que gastaba 8 L cada 100 km. Cambia a uno que gasta 4 L cada 100 km y, como sale más barato, pasa a viajar ${km2.toLocaleString('es-AR')} km. ¿Cuántos litros de nafta ahorra de verdad por año?`,
          valor: 800 - (km2 * 4) / 100,
          unidad: 'litros',
          explicacion: `Antes: 10.000 × 8 ÷ 100 = 800 L. Ahora: ${km2.toLocaleString('es-AR')} × 4 ÷ 100 = ${(km2 * 4) / 100} L. Ahorra ${800 - (km2 * 4) / 100} L, en vez de los 400 L que ahorraría sin viajar más: eso es el efecto rebote.`,
        };
      }, { d: 3 }),
      det('Leé esta opinión y marcá lo cuestionable.', [ // e8
        ['Los satélites ayudan a detectar desmontes.', false],
        ['Como pronto habrá máquinas que capturen el CO₂, no hace falta reducir emisiones.', true, 'Es tecnosolucionismo: esas tecnologías son caras, limitadas y no reemplazan dejar de emitir.'],
        ['Los medidores inteligentes ayudan a ver el consumo.', false],
        ['Si algo es más eficiente, el ahorro está garantizado aunque lo usemos más.', true, 'El efecto rebote puede comerse parte del ahorro.'],
      ], 'Aprovechar la tecnología sin delegarle todo.', { d: 3 }),
      comp('Completá.', 'Cuando la eficiencia hace que se use más y se pierde parte del ahorro, es el efecto [rebote]; creer que todo se resuelve con un invento es [tecnosolucionismo].', ['invernadero', 'reciclaje'], 'Dos límites de la tecnología que conviene recordar.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: tecnología que ayuda', 'Satélites, sensores, ciencia ciudadana, energía inteligente y límites, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el sistema de alerta de incendios', 'Un municipio junto a un humedal quiere un sistema para detectar incendios y avisar a los vecinos. Armalo con criterio.', [
      teoria('El municipio', [
        'El municipio tiene 40.000 hectáreas de humedales donde cada año hay quemas e incendios. La mitad de los vecinos de las islas no tiene buena conexión a internet. Una empresa ofrece una app "que resuelve todo", con cámaras propias, por un precio alto.',
        'Hay datos satelitales gratuitos de focos de calor, una brigada de bomberos voluntarios y radios comunitarias en la zona.',
      ]),
      mult('¿Qué herramientas conviene combinar en el sistema? Marcá todas.', [ // e1
        '+Datos satelitales gratuitos de focos de calor',
        '+La brigada de bomberos voluntarios',
        '+Avisos por radio comunitaria',
        '+Mensajes de texto a los vecinos',
        '-Solo la app de la empresa, sin nada más',
      ], 'Un buen sistema combina detección, respuesta y comunicación que llegue a todos.', { d: 3 }),
      op('¿Qué problema tiene depender solo de la app de la empresa?', [ // e2
        'Deja afuera a la mitad de los vecinos sin buena conexión',
        'Las apps nunca funcionan',
        ['Que sea cara es el único problema', 'El costo importa, pero el problema principal es que las alertas no llegarían a muchos vecinos.'],
        'Los incendios no se pueden detectar con cámaras',
      ], 'Si la alerta no llega, no sirve. La brecha digital tiene consecuencias concretas.', { d: 3 }),
      num('Si el municipio tiene 40.000 hectáreas de humedal y un satélite detecta focos en un área que se quemó en un 5 %, ¿cuántas hectáreas se quemaron?', 2000, 'hectáreas', '40.000 × 5 ÷ 100 = 2.000 hectáreas, casi 2.900 canchas de fútbol.', { ctx: '40.000 ha de humedal; 5 % quemado.', d: 2 }),
      ord('Ordená cómo debería funcionar el sistema ante un foco.', [ // e4
        'El satélite detecta un foco de calor',
        'Un operador lo verifica en el mapa',
        'Se avisa a la brigada',
        'Se alerta a los vecinos por radio y mensajes de texto',
        'La brigada actúa y se registra lo ocurrido',
      ], 'Detectar, verificar, responder, avisar y aprender.', { d: 2, extremos: ['Primero', 'Último'] }),
      clas('Clasificá las propuestas del concejo.', { // e5
        'Equilibrada': ['Usar datos satelitales gratuitos y fortalecer la brigada', 'Capacitar a referentes de cada isla para difundir alertas', 'Publicar los datos de incendios para que cualquiera los analice'],
        'Tecnosolucionista o excluyente': ['Comprar la app y cerrar la radio', 'Esperar un satélite propio antes de hacer nada', 'Avisar solo por redes sociales'],
      }, 'Tecnología útil, personas preparadas y comunicación para todos.', { d: 3 }),
      vf('Con un buen sistema satelital, ya no hace falta la brigada de bomberos.', false, 'El satélite detecta; la brigada apaga. La tecnología complementa el trabajo en el terreno, no lo reemplaza.', { // e6
        razones: ['+Porque detectar no es apagar: hace falta la brigada', '-Porque los satélites apagan los incendios', '-Porque los incendios se apagan solos si se detectan'],
        d: 2,
      }),
      det('El municipio publica su plan. Marcá lo que no conviene.', [ // e7
        ['Usaremos datos satelitales gratuitos de focos de calor.', false],
        ['Las alertas saldrán solo por la app, porque es lo más moderno.', true, 'La mitad de los vecinos no tiene buena conexión: hace falta radio y mensajes de texto.'],
        ['Fortaleceremos a la brigada de bomberos voluntarios.', false],
        ['Como tenemos tecnología, no hace falta controlar las quemas intencionales.', true, 'Detectar no evita: hay que prevenir y controlar las quemas.'],
      ], 'La tecnología potencia, pero no reemplaza a las personas, las reglas y la prevención.', { d: 3 }),
    ]),
  ],
});
