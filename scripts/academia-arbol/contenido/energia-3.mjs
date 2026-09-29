import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// ENERGÍA 3 — De dónde sale la electricidad.
// Del enchufe hacia atrás: cómo se genera la electricidad, cómo es la matriz
// eléctrica argentina, cómo viaja por la red, por qué la demanda cambia cada
// hora y cuánto CO₂ emite un kWh. Retoma formas de energía y eficiencia
// (energia-1), la factura (energia-2) y medir (tronco-2).

export default unidad({
  slug: 'energia-3',
  rama: 'energia',
  orden: 3,
  nivel: 2,
  requiereTronco: 2,
  titulo: 'De dónde sale la electricidad',
  bajada: 'Detrás de cada enchufe hay turbinas, represas, parques eólicos, centrales nucleares y miles de kilómetros de cables. Cómo funciona el sistema que te da luz.',
  objetivos: [
    'Explicar cómo se genera electricidad con distintas fuentes',
    'Describir la matriz eléctrica argentina y cómo cambia',
    'Seguir el recorrido de la electricidad por la red de transmisión y distribución',
    'Interpretar la curva de demanda y el problema de los picos',
    'Calcular las emisiones de un consumo eléctrico con un factor de emisión',
  ],
  repasa: ['energia-1', 'energia-2', 'tronco-2'],
  fuentes: ['cammesa', 'iea-energia', 'owid-energia', 'ley-27424-generacion', 'irena'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Cómo se genera la electricidad', 'Turbinas, generadores y paneles: las distintas formas de convertir energía en electricidad.', [
      teoria('Hacer girar un imán', [
        'Casi toda la electricidad del mundo se produce igual: algo hace girar una turbina, y la turbina mueve un generador, donde un imán gira dentro de bobinas de cobre y produce corriente eléctrica. Lo que cambia es qué hace girar la turbina.',
        'En una central térmica, es el vapor o los gases calientes de quemar gas, carbón o gasoil. En una represa, el agua que cae. En un aerogenerador, el viento. En una central nuclear, el vapor calentado por la fisión del uranio.',
      ]),
      par('Uní cada central con lo que hace girar su turbina.', [ // e1
        ['Central térmica a gas', 'Gases calientes de la combustión'],
        ['Represa hidroeléctrica', 'Agua que cae'],
        ['Aerogenerador', 'Viento'],
        ['Central nuclear', 'Vapor calentado por la fisión del uranio'],
      ], 'Distintas fuentes, un mismo principio: hacer girar un generador.', { d: 1 }),
      teoria('La excepción: el panel solar', [
        'Los paneles solares fotovoltaicos no tienen turbina ni partes que giren: la luz del sol, al llegar a un material semiconductor como el silicio, libera electrones y genera corriente directamente. Por eso casi no tienen mantenimiento mecánico y se pueden instalar en un techo.',
        'La corriente de los paneles es continua; un equipo llamado inversor la transforma en corriente alterna, la que usa la red.',
      ]),
      clas('¿Esta forma de generar usa una turbina o no?', { // e2
        'Usa turbina': ['Central térmica de ciclo combinado', 'Represa de Yacyretá', 'Parque eólico', 'Central nuclear Atucha II'],
        'No usa turbina': ['Panel solar fotovoltaico en un techo', 'Parque solar en la Puna'],
      }, 'La fotovoltaica es la gran excepción: convierte luz en electricidad sin movimiento.', { d: 2 }),
      vf('Un panel solar genera electricidad haciendo girar una pequeña turbina con el calor del sol.', false, 'Los paneles fotovoltaicos no tienen partes móviles: la luz libera electrones en un semiconductor y eso genera corriente directamente.', { // e3
        razones: ['+Porque la luz genera corriente directamente en el semiconductor', '-Porque los paneles tienen un motor adentro', '-Porque los paneles queman el aire caliente'],
        d: 2,
      }),
      cad('Armá la cadena de una central térmica a gas.', [ // e4
        'Se quema gas natural',
        'Los gases calientes hacen girar una turbina',
        'La turbina mueve el generador',
        'El generador produce electricidad',
        'La electricidad sale a la red de alta tensión',
      ], ['El gas se convierte directamente en electricidad sin girar nada'], 'Química a calor, calor a movimiento, movimiento a electricidad: las transformaciones de la unidad 1.', { d: 2 }),
      teoria('Ciclo combinado', [
        'Una central térmica común aprovecha alrededor de un tercio de la energía del combustible. Las de ciclo combinado usan los gases calientes para mover una turbina y, además, aprovechan el calor que queda para producir vapor y mover otra: así llegan a aprovechar alrededor del 55 al 60 %.',
        'Por eso, con el mismo gas, una central de ciclo combinado produce mucha más electricidad y emite menos por kWh.',
      ]),
      numv(3, (i) => { // e5
        const gas = [100, 200, 150][i];
        const ef1 = 35;
        const ef2 = 58;
        return {
          enunciado: `Con ${gas} unidades de energía de gas, ¿cuántas unidades más de electricidad produce una central de ciclo combinado (58 %) que una térmica común (35 %)?`,
          valor: (gas * (ef2 - ef1)) / 100,
          unidad: 'unidades',
          dec: 1,
          explicacion: `Común: ${gas} × 0,35 = ${(gas * 0.35).toLocaleString('es-AR')}. Ciclo combinado: ${gas} × 0,58 = ${(gas * 0.58).toLocaleString('es-AR')}. Diferencia: ${((gas * (ef2 - ef1)) / 100).toLocaleString('es-AR')} unidades más con el mismo gas.`,
        };
      }, { d: 2 }),
      rank('Ordená estas centrales por la eficiencia típica con que convierten su fuente en electricidad, de más a menos.', [ // e6
        ['Represa hidroeléctrica', '≈ 85-90 %'],
        ['Central de ciclo combinado', '≈ 55-60 %'],
        ['Central térmica común', '≈ 30-40 %'],
        ['Panel solar comercial', '≈ 20 % de la luz que recibe'],
      ], 'La eficiencia no lo es todo: el sol es gratis e inagotable, aunque el panel aproveche una parte chica.', { d: 3 }),
      mult('¿Qué fuentes generan electricidad sin emitir CO₂ al funcionar? Marcá todas.', [ // e7
        '+Represa hidroeléctrica',
        '+Parque eólico',
        '+Central nuclear',
        '+Paneles solares',
        '-Central térmica a gas',
      ], 'Hidro, eólica, nuclear y solar no emiten CO₂ al generar, aunque todas tienen impactos al construirse.', { d: 1 }),
      op('¿Qué equipo convierte la corriente continua de los paneles solares en la corriente alterna de la red?', [ // e8
        'El inversor',
        'El medidor de luz',
        ['La turbina', 'Los paneles no tienen turbina: la conversión la hace un equipo electrónico.'],
        'El disyuntor diferencial',
      ], 'Sin inversor, la electricidad de los paneles no podría usarse en la casa ni volcarse a la red.', { d: 2 }),
      det('Leé esta explicación y marcá lo equivocado.', [ // e9
        ['En una represa, el agua que cae hace girar una turbina.', false],
        ['Las centrales nucleares queman uranio como si fuera carbón.', true, 'No hay combustión: la fisión del uranio libera calor que produce vapor.'],
        ['Los aerogeneradores convierten el viento en movimiento y luego en electricidad.', false],
        ['Una central de ciclo combinado es menos eficiente que una térmica común.', true, 'Es más eficiente: aprovecha el calor dos veces.'],
      ], 'Conocer cómo funciona cada central ayuda a entender sus ventajas y límites.', { d: 2 }),
      comp('Completá.', 'Casi toda la electricidad se genera haciendo girar un [generador]; los paneles solares son la excepción porque convierten la [luz] directamente; y el [inversor] adapta su corriente a la red.', ['motor', 'calor', 'medidor'], 'El principio de la generación y su gran excepción.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('La matriz eléctrica argentina', 'Gas, represas, uranio, viento y sol: de qué está hecha la electricidad del país y cómo cambia.', [
      teoria('Un sistema interconectado', [
        'Casi todo el país está conectado al Sistema Argentino de Interconexión (SADI): una red de líneas de alta tensión que une centrales y ciudades de casi todas las provincias. CAMMESA es la empresa que administra ese sistema: decide, hora por hora, qué centrales generan para cubrir la demanda.',
        'Así, la electricidad que llega a tu casa es una mezcla de lo que generan muchas centrales, a veces a cientos de kilómetros.',
      ]),
      teoria('De qué está hecha', [
        'En los últimos años, algo más de la mitad de la electricidad argentina salió de centrales térmicas, sobre todo a gas natural. Las grandes represas —como Yacyretá, Salto Grande, El Chocón o Piedra del Águila— aportaron una parte que cambia mucho según las lluvias. Las centrales nucleares Atucha I, Atucha II y Embalse aportaron alrededor de un 5 a 8 %. Y las renovables, sobre todo eólica y solar, crecieron rápido en la última década.',
      ], {
        datos: barras('Generación eléctrica en Argentina por fuente (aproximado, años recientes)', '% del total', [
          ['Térmica (sobre todo gas)', 57],
          ['Hidráulica (grandes represas)', 18],
          ['Renovables (eólica, solar y otras)', 17],
          ['Nuclear', 8],
        ], 'Valores aproximados redondeados a partir de datos de CAMMESA; cambian cada año con las lluvias y la demanda.'),
      }),
      rank('Según ese gráfico, ordená las fuentes por su aporte a la electricidad argentina, de más a menos.', [ // e1
        ['Térmica, sobre todo gas', '≈ 57 %'],
        ['Hidráulica', '≈ 18 %'],
        ['Renovables como eólica y solar', '≈ 17 %'],
        ['Nuclear', '≈ 8 %'],
      ], 'El gas sigue siendo la base del sistema. Las renovables ya aportan casi tanto como las grandes represas.', { d: 2 }),
      est('Estimá qué porcentaje de la electricidad argentina viene de fuentes que no emiten CO₂ al generar (hidráulica, nuclear y renovables), según ese gráfico.', 43, { min: 0, max: 100, paso: 1, unidad: '%' }, '18 + 8 + 17 = 43 %. Algo más de cuatro de cada diez kWh.', { d: 3 }),
      par('Uní cada central con su fuente.', [ // e3
        ['Yacyretá', 'Agua del río Paraná'],
        ['Atucha II', 'Uranio'],
        ['Parques eólicos de Chubut', 'Viento patagónico'],
        ['Cauchari, en Jujuy', 'Sol de la Puna'],
      ], 'Una geografía diversa: agua en el noreste, viento en el sur, sol en el noroeste.', { d: 2 }),
      teoria('Por qué cambia de un año a otro', [
        'La matriz no es fija. En años secos, las represas generan menos y hay que quemar más gas, como pasó durante la bajante del Paraná. En años lluviosos, al revés. Las renovables crecen por las leyes que las promueven y porque se abarataron: la Ley 27.191 fijó metas de participación de renovables, y la Ley 27.424 habilitó a usuarios a generar su propia energía y volcar excedentes a la red.',
      ]),
      cad('Armá la cadena de por qué una sequía puede aumentar las emisiones de la electricidad.', [ // e4
        'Llueve poco en la cuenca de los ríos',
        'Las represas generan menos electricidad',
        'CAMMESA despacha más centrales térmicas',
        'Se quema más gas',
        'Suben las emisiones por kWh',
      ], ['Las represas emiten más CO₂ en la sequía'], 'Agua y energía están conectadas: la bajante del río se nota en la matriz eléctrica.', { d: 3 }),
      vf('La matriz eléctrica argentina es siempre la misma, año tras año.', false, 'Cambia con las lluvias (más o menos hidro), con la demanda y con las nuevas centrales renovables que se suman.', { // e5
        razones: ['+Porque depende de las lluvias, la demanda y las nuevas centrales', '-Porque la ley fija un porcentaje exacto de cada fuente', '-Porque solo hay centrales a gas'],
        d: 2,
      }),
      mult('¿Qué hace CAMMESA? Marcá todo lo correcto.', [ // e6
        '+Administra el mercado eléctrico mayorista',
        '+Decide qué centrales generan en cada momento',
        '+Publica datos de generación y demanda',
        '-Construye todos los paneles solares de las casas',
        '-Factura directamente la luz de cada hogar',
      ], 'CAMMESA administra el sistema; las facturas de las casas las emiten las distribuidoras.', { d: 2 }),
      op('¿Qué establece la Ley 27.424 de generación distribuida?', [ // e7
        'Que los usuarios generen renovable y vuelquen excedentes',
        'Que todas las casas deben tener paneles solares por obligación',
        ['Que se prohíben las centrales térmicas', 'No prohíbe centrales: habilita a los usuarios a generar y conectarse a la red.'],
        'Que la electricidad es gratuita para quienes tienen paneles',
      ], 'Un usuario con paneles puede consumir su propia energía y entregar lo que sobra a la red.', { d: 2 }),
      numv(3, (i) => {
        const tot = 140;
        const pct = [17, 15, 20][i];
        return {
          enunciado: `Si Argentina genera unos ${tot} TWh de electricidad por año y las renovables aportan el ${pct} %, ¿cuántos TWh aportan?`,
          valor: (tot * pct) / 100,
          unidad: 'TWh',
          dec: 1,
          explicacion: `${tot} × ${pct} ÷ 100 = ${((tot * pct) / 100).toLocaleString('es-AR')} TWh: el consumo de millones de hogares, sin quemar combustible.`,
        };
      }, { d: 2 }),
      vf('La electricidad que llega a tu casa sale siempre de la central más cercana.', false, 'Llega de un sistema interconectado: es una mezcla de lo que generan muchas centrales, algunas a cientos de kilómetros.', {
        razones: ['+Porque llega de un sistema interconectado con muchas centrales', '-Porque cada barrio tiene su propia central', '-Porque la electricidad no viaja por cables'],
        d: 2,
      }),
      det('Leé este comentario y marcá lo equivocado.', [ // e8
        ['Buena parte de la electricidad argentina se genera con gas.', false],
        ['Las represas generan siempre lo mismo, llueva o no.', true, 'Dependen de las lluvias: en sequías generan menos.'],
        ['Argentina tiene tres centrales nucleares en funcionamiento.', false],
        ['Las renovables todavía no generan nada relevante en el país.', true, 'Ya aportan una parte importante, que creció rápido en la última década.'],
      ], 'Conocer la matriz permite entender el impacto de cada kWh que usamos.', { d: 2 }),
      comp('Completá.', 'El sistema que conecta centrales y ciudades se llama [SADI]; lo administra [CAMMESA]; y la fuente que más electricidad aporta en Argentina es el [gas].', ['ENARGAS', 'INTA', 'carbón'], 'Tres ideas para entender la electricidad del país.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('La red: del generador al enchufe', 'Alta tensión, transformadores, distribuidoras y pérdidas: el viaje de la electricidad.', [
      teoria('Subir la tensión para viajar', [
        'La electricidad viaja desde las centrales por líneas de alta tensión: cientos de miles de voltios. ¿Por qué tan alta? Porque a mayor tensión, para la misma potencia, circula menos corriente, y los cables se calientan menos: se pierde menos energía en el camino.',
        'Cerca de las ciudades, las subestaciones bajan la tensión con transformadores, y las distribuidoras la llevan por la red de media y baja tensión hasta las casas, donde llega a 220 voltios.',
      ]),
      ord('Ordená el recorrido de la electricidad desde la central hasta tu casa.', [ // e1
        'Se genera en la central',
        'Un transformador eleva la tensión',
        'Viaja por líneas de alta tensión',
        'Una subestación la baja cerca de la ciudad',
        'La distribuidora la lleva por el barrio hasta tu casa',
      ], 'Subir para viajar lejos, bajar para usar. Transformadores en los dos extremos.', { d: 1, extremos: ['Primero', 'Último'] }),
      op('¿Por qué la electricidad viaja largas distancias en alta tensión?', [ // e2
        'Porque así se pierde menos energía en los cables',
        'Porque así llega más rápido a las casas',
        ['Porque los cables de alta tensión son más baratos', 'El motivo principal es reducir las pérdidas, no el costo del cable.'],
        'Porque las casas usan alta tensión',
      ], 'Menos corriente, menos calentamiento del cable, menos pérdidas.', { d: 2 }),
      teoria('Las pérdidas', [
        'Aun así, una parte de la energía se pierde en el camino: como calor en cables y transformadores (pérdidas técnicas) y, en algunos lugares, por conexiones irregulares o medidores que fallan (pérdidas no técnicas). En total, una parte relevante de la electricidad generada no llega a facturarse.',
        'Por eso cada kWh que se ahorra en casa ahorra algo más en la central: también se evitan las pérdidas de transportarlo.',
      ]),
      numv(3, (i) => { // e3
        const gen = [100, 250, 500][i];
        const perd = [10, 12, 8][i];
        return {
          enunciado: `Una central genera ${gen} MWh y en la red se pierde el ${perd} %. ¿Cuántos MWh llegan a los usuarios?`,
          valor: (gen * (100 - perd)) / 100,
          unidad: 'MWh',
          dec: 1,
          explicacion: `${gen} × ${(100 - perd) / 100} = ${((gen * (100 - perd)) / 100).toLocaleString('es-AR')} MWh. Las pérdidas son energía generada, con sus emisiones, que no usa nadie.`,
        };
      }, { d: 2 }),
      numv(3, (i) => { // e4
        const cons = [100, 90, 200][i];
        const perd = [10, 10, 20][i];
        return {
          enunciado: `Si en la red se pierde el ${perd} % de lo generado, ¿cuántos kWh hay que generar para que lleguen ${cons} kWh a una casa? Redondeá a un decimal.`,
          valor: Math.round((cons / (1 - perd / 100)) * 10) / 10,
          unidad: 'kWh',
          dec: 1,
          tol: 0.2,
          explicacion: `${cons} ÷ ${(1 - perd / 100).toLocaleString('es-AR')} ≈ ${(Math.round((cons / (1 - perd / 100)) * 10) / 10).toLocaleString('es-AR')} kWh. Por eso ahorrar en casa ahorra un poco más en la central.`,
        };
      }, { d: 3 }),
      clas('¿Es una pérdida técnica o no técnica?', { // e5
        'Técnica': ['Calor en los cables de alta tensión', 'Calentamiento de un transformador'],
        'No técnica': ['Una conexión irregular a la red', 'Un medidor que registra de menos'],
      }, 'Las técnicas se reducen con mejor infraestructura; las no técnicas, con control y acceso formal al servicio.', { d: 2 }),
      teoria('Cortes y confiabilidad', [
        'Un sistema eléctrico tiene que equilibrar en cada instante lo que se genera con lo que se consume. Si una línea importante se cae o la demanda supera lo disponible, puede haber cortes. En días de calor extremo, las redes de distribución de los barrios, sobrecargadas por miles de aires acondicionados, son las que más fallan.',
      ]),
      cad('Armá la cadena de por qué hay cortes en los barrios en una ola de calor.', [ // e6
        'Hace muchísimo calor varios días seguidos',
        'Miles de aires acondicionados funcionan a la vez',
        'Los cables y transformadores del barrio se sobrecargan',
        'Se calientan y se dañan',
        'Se corta la luz en el barrio',
      ], ['El calor hace que las centrales dejen de existir'], 'Muchas veces el problema no es la generación, sino la distribución local.', { d: 2 }),
      vf('Ahorrar energía en casa en un día de calor extremo puede ayudar a evitar cortes en el barrio.', true, 'Si muchos vecinos bajan su consumo en las horas pico, por ejemplo con el aire a 24 °C, se alivia la carga de los transformadores del barrio.', { // e7
        razones: ['+Porque alivia la carga de la red del barrio en las horas pico', '-Porque la red no tiene límites', '-Porque los cortes solo dependen de las centrales'],
        d: 2,
      }),
      par('Uní cada parte de la red con su función.', [ // e8
        ['Línea de alta tensión', 'Transportar energía a larga distancia'],
        ['Subestación', 'Bajar la tensión cerca de las ciudades'],
        ['Distribuidora', 'Llevar la electricidad hasta cada casa y facturar'],
        ['Transformador del barrio', 'Adaptar la tensión para las casas'],
      ], 'Cada parte de la red cumple su función en la cadena.', { d: 2 }),
      det('Leé este comentario y marcá lo equivocado.', [ // e9
        ['La electricidad viaja en alta tensión para perder menos energía.', false],
        ['Toda la electricidad que se genera llega a las casas sin pérdidas.', true, 'Una parte se pierde como calor en cables y transformadores, y por pérdidas no técnicas.'],
        ['En olas de calor, las redes de los barrios pueden sobrecargarse.', false],
        ['Las casas reciben la electricidad en alta tensión directamente.', true, 'Llega a 220 voltios después de pasar por transformadores.'],
      ], 'La red es tan importante como las centrales.', { d: 2 }),
      comp('Completá.', 'La electricidad viaja lejos en alta [tensión]; los [transformadores] la adaptan; y una parte se [pierde] en el camino.', ['velocidad', 'medidores', 'multiplica'], 'Tres ideas sobre el viaje de la electricidad.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('La demanda cambia cada hora', 'La curva diaria, los picos de verano e invierno y por qué la electricidad tiene que generarse en el momento.', [
      teoria('Generar al instante', [
        'A diferencia del agua o el gas, la electricidad casi no se guarda en la red: tiene que generarse en el mismo instante en que se consume. Por eso el sistema sigue la demanda minuto a minuto, encendiendo y apagando centrales.',
        'La demanda cambia a lo largo del día: baja de madrugada, sube a la mañana y tiene picos, que en Argentina suelen darse en las tardes y noches de verano muy caluroso, por el aire acondicionado, y en los días más fríos del invierno.',
      ]),
      ord('Ordená estos momentos de un día de verano caluroso por su demanda eléctrica típica, de menor a mayor.', [ // e1
        'Madrugada, a las 5',
        'Mañana, a las 10',
        'Mediodía, a las 13',
        'Tarde-noche, a las 20',
      ], 'En los días de mucho calor, el pico suele llegar a la tarde y primeras horas de la noche.', { d: 2, extremos: ['Menor demanda', 'Mayor demanda'] }),
      teoria('Base y pico', [
        'Algunas centrales generan casi todo el tiempo, cubriendo la demanda mínima: se las llama de base (por ejemplo, las nucleares). Otras se encienden solo en los picos: suelen ser térmicas más caras y, a veces, menos eficientes. Por eso los picos son los momentos más caros y a menudo los de más emisiones.',
        'Bajar el pico —moviendo consumos a otras horas o ahorrando en esos momentos— evita encender las centrales más caras y contaminantes.',
      ]),
      clas('¿Esta central suele funcionar como base o para los picos?', { // e2
        'Base': ['Central nuclear', 'Represa de pasada que genera con el caudal del río'],
        'Picos': ['Turbina de gas que se enciende rápido', 'Motores diésel de emergencia'],
      }, 'Las de base generan parejo; las de pico se prenden y apagan según la demanda.', { d: 3 }),
      cad('Armá la cadena de por qué el pico de demanda suele ser el momento más contaminante.', [ // e3
        'La demanda sube en la tarde de un día caluroso',
        'Las centrales de base ya están a pleno',
        'Se encienden centrales de pico',
        'Suelen ser térmicas menos eficientes',
        'Cada kWh del pico emite más',
      ], ['En el pico solo generan los paneles solares'], 'Mover o reducir consumos en el pico tiene un efecto mayor que en otras horas.', { d: 3 }),
      vf('La electricidad se puede guardar en los cables para usarla en el pico.', false, 'La red no almacena: hay que generar en el momento. Para guardar hacen falta baterías, represas de bombeo u otros sistemas.', { // e4
        razones: ['+Porque la red transporta pero no almacena', '-Porque los cables son baterías gigantes', '-Porque la electricidad no se usa en los picos'],
        d: 2,
      }),
      numv(3, (i) => { // e5
        const casas = [10000, 50000, 20000][i];
        const w = [500, 400, 600][i];
        return {
          enunciado: `En una ciudad, ${casas.toLocaleString('es-AR')} casas suben el aire de 18 °C a 24 °C en el pico y cada una baja ${w} W su consumo. ¿Cuántos MW baja la demanda del pico?`,
          valor: (casas * w) / 1e6,
          unidad: 'MW',
          dec: 1,
          explicacion: `${casas.toLocaleString('es-AR')} × ${w} W = ${(casas * w).toLocaleString('es-AR')} W = ${((casas * w) / 1e6).toLocaleString('es-AR')} MW. Lo que genera una central chica, sin construir nada.`,
        };
      }, { d: 2 }),
      teoria('El sol y el pico', [
        'La energía solar genera más al mediodía. En verano, ayuda a cubrir parte de la demanda de la tarde. Pero cuando el sol baja, la demanda sigue alta y la solar cae. Por eso, con mucha solar, se vuelve cada vez más importante almacenar energía del mediodía para la noche, o mover consumos hacia el mediodía.',
      ]),
      par('Uní cada medida con cómo ayuda en el pico.', [ // e6
        ['Poner el aire a 24 °C', 'Baja la demanda de cada casa'],
        ['Programar el lavarropas de noche', 'Mueve un consumo fuera del pico'],
        ['Baterías que se cargan al mediodía', 'Guardan energía solar para la noche'],
        ['Tarifas más caras en el pico', 'Incentivan consumir en otras horas'],
      ], 'Reducir, mover y almacenar: las tres formas de aliviar el pico.', { d: 2 }),
      mult('¿Qué ayuda a bajar el pico de demanda en un día de calor? Marcá todo.', [ // e7
        '+Aire acondicionado a 24 °C',
        '+Cerrar persianas donde da el sol',
        '+Usar el lavarropas en otro horario',
        '+Apagar aparatos que no se usan',
        '-Encender todos los aires a 16 °C al llegar a casa',
      ], 'Muchas medidas chicas en muchas casas bajan mucho el pico.', { d: 1 }),
      op('¿Por qué conviene poner el lavarropas de noche en lugar de a las 20 en un día muy caluroso?', [ // e8
        'Porque se usa menos electricidad en el pico',
        'Porque de noche el lavarropas lava mejor',
        ['Porque de noche la electricidad no tiene costo', 'Puede ser más barata con tarifas horarias, pero no es gratis.'],
        'Porque de noche no se usa agua',
      ], 'Mover consumos fuera del pico evita encender centrales caras y reduce el riesgo de cortes.', { d: 2 }),
      det('Leé este comentario y marcá lo equivocado.', [ // e9
        ['La demanda eléctrica cambia a lo largo del día.', false],
        ['El pico de demanda es a las 4 de la mañana.', true, 'En los días calurosos, el pico suele ser a la tarde y primeras horas de la noche.'],
        ['En los picos se encienden centrales más caras.', false],
        ['Los paneles solares generan más de noche.', true, 'Generan más al mediodía y nada de noche.'],
      ], 'Entender la curva de demanda permite ahorrar donde más importa.', { d: 2 }),
      comp('Completá.', 'La electricidad se genera en el mismo [instante] en que se consume; las centrales de [base] funcionan siempre; y en el [pico] se encienden las más caras.', ['año', 'punta', 'valle'], 'Las tres ideas centrales de la curva de demanda eléctrica.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Cuánto emite un kWh', 'El factor de emisión de la red, cómo cambia según la fuente y cómo calcular las emisiones de tu consumo.', [
      teoria('El factor de emisión', [
        'Para saber cuánto CO₂ emite un kWh que se consume, se usa el factor de emisión de la red: los kilos de CO₂ que se emitieron, en promedio, para generar cada kWh. Depende de la mezcla de fuentes: una red con mucho carbón puede superar 0,8 kg por kWh; una con mucha hidro y nuclear puede estar por debajo de 0,1.',
        'En Argentina, con mucho gas y una parte importante de hidro, nuclear y renovables, el factor ronda valores del orden de 0,3 a 0,4 kg de CO₂ por kWh, y cambia de un año a otro.',
      ], { destacado: { valor: '≈ 0,3-0,4 kg', texto: 'de CO₂ por kWh es el orden del factor de emisión de la red eléctrica argentina en años recientes.' } }),
      numv(3, (i) => { // e1
        const kwh = [250, 400, 180][i];
        const f = 0.35;
        return {
          enunciado: `Una casa consume ${kwh} kWh por mes. Con un factor de emisión de 0,35 kg de CO₂ por kWh, ¿cuántos kg de CO₂ corresponden a su consumo mensual?`,
          valor: Math.round(kwh * f * 10) / 10,
          unidad: 'kg de CO₂',
          dec: 1,
          explicacion: `${kwh} × 0,35 = ${(Math.round(kwh * f * 10) / 10).toLocaleString('es-AR')} kg de CO₂ por mes. Por año, doce veces eso.`,
        };
      }, { d: 1 }),
      rank('Ordená estas redes eléctricas por su factor de emisión típico, de más a menos.', [ // e2
        ['Red basada en carbón', 'más de 0,8 kg/kWh'],
        ['Red basada en gas', '≈ 0,4-0,5 kg/kWh'],
        ['Red argentina de años recientes', '≈ 0,3-0,4 kg/kWh'],
        ['Red con mucha hidro y nuclear', 'menos de 0,1 kg/kWh'],
      ], 'El mismo aparato emite muy distinto según el país donde se enchufe.', { d: 3 }),
      teoria('Por qué el mismo aparato emite distinto', [
        'Una heladera que consume 300 kWh por año emite unos 105 kg de CO₂ con un factor de 0,35, pero más de 240 kg en una red de carbón y menos de 30 kg en una red muy limpia. La eficiencia del aparato importa, y también cómo se genera la electricidad.',
        'Por eso limpiar la red —sumar renovables— reduce las emisiones de todos los aparatos a la vez, sin que nadie cambie nada en su casa.',
      ]),
      numv(3, (i) => { // e3
        const kwh = [300, 500, 200][i];
        const f1 = 0.8;
        const f2 = 0.1;
        return {
          enunciado: `Un aparato consume ${kwh} kWh por año. ¿Cuántos kg de CO₂ más emite en una red de carbón (0,8 kg/kWh) que en una red muy limpia (0,1 kg/kWh)?`,
          valor: kwh * (f1 - f2),
          unidad: 'kg de CO₂',
          explicacion: `${kwh} × (0,8 − 0,1) = ${kwh * 0.7} kg de CO₂ más por año. La red importa tanto como el aparato.`,
        };
      }, { d: 2 }),
      cad('Armá la cadena de cómo sumar renovables a la red baja las emisiones de tu heladera.', [ // e4
        'Se construyen parques eólicos y solares',
        'Generan una parte mayor de la electricidad',
        'Se quema menos gas en las centrales',
        'Baja el factor de emisión de la red',
        'Cada kWh de tu heladera emite menos',
      ], ['Tu heladera empieza a funcionar con viento directo'], 'Limpiar la red es una palanca de sistema: mejora todos los aparatos a la vez.', { d: 2 }),
      vf('Si dos casas consumen los mismos kWh, siempre emiten lo mismo, estén en el país que estén.', false, 'Depende del factor de emisión de la red de cada lugar. El mismo consumo puede emitir varias veces más en una red de carbón.', { // e5
        razones: ['+Porque depende de cómo se genera la electricidad en cada lugar', '-Porque todos los kWh del mundo son idénticos en emisiones', '-Porque las emisiones dependen solo del precio'],
        d: 2,
      }),
      teoria('Generar en casa', [
        'Con la Ley 27.424 de generación distribuida, una casa o un comercio pueden instalar paneles solares, consumir su propia energía y volcar los excedentes a la red, que la distribuidora descuenta o paga. Un sistema de 3 kW en buena parte de Argentina puede generar del orden de 4.000 kWh por año, aunque depende mucho de la región y la orientación.',
      ]),
      numv(3, (i) => { // e6
        const kwh = [4000, 3500, 5000][i];
        return {
          enunciado: `Unos paneles en el techo generan ${kwh.toLocaleString('es-AR')} kWh por año. Con un factor de 0,35 kg de CO₂ por kWh de la red, ¿cuántos kg de CO₂ por año se evitan?`,
          valor: kwh * 0.35,
          unidad: 'kg de CO₂',
          explicacion: `${kwh.toLocaleString('es-AR')} × 0,35 = ${(kwh * 0.35).toLocaleString('es-AR')} kg de CO₂ por año que no hace falta emitir en una central.`,
        };
      }, { d: 2 }),
      clas('¿Esta acción reduce las emisiones de la electricidad bajando el consumo o limpiando la generación?', { // e7
        'Baja el consumo': ['Cambiar a lámparas LED', 'Poner el aire a 24 °C', 'Heladera eficiente'],
        'Limpia la generación': ['Paneles solares en el techo', 'Un nuevo parque eólico', 'Una represa que genera más en un año lluvioso'],
      }, 'Las dos palancas se multiplican: menos kWh y cada kWh más limpio.', { d: 2 }),
      mult('¿De qué depende cuánto CO₂ emite el consumo eléctrico de una casa? Marcá todo.', [ // e8
        '+Cuántos kWh consume',
        '+La mezcla de fuentes de la red',
        '+En qué horario consume, si en el pico se usan centrales más sucias',
        '+Si genera parte de su energía con paneles',
        '-El color de la factura',
      ], 'Cantidad, mezcla, horario y generación propia: las variables de la huella eléctrica.', { d: 2 }),
      det('Leé este cálculo y marcá los errores.', [ // e9
        ['La casa usa 3.000 kWh por año.', false],
        ['Con 0,35 kg por kWh, emite 3.000 × 0,35 = 1.050 kg de CO₂ por año.', false],
        ['Si la red se vuelve más limpia, sus emisiones no cambian.', true, 'Si baja el factor de emisión, baja la huella de cada kWh.'],
        ['Si instala paneles que generan 2.000 kWh, sus emisiones se duplican.', true, 'Al revés: evita comprar esos kWh a la red y baja su huella.'],
      ], 'Consumo por factor: una cuenta simple con dos palancas.', { d: 3 }),
      comp('Completá.', 'Los kg de CO₂ por kWh de la red son el factor de [emisión]; en Argentina ronda los [0,35] kg; y sumar [renovables] lo baja.', ['consumo', '3,5', 'medidores'], 'La cuenta que conecta el enchufe con el clima.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: de dónde sale la electricidad', 'Generación, matriz, red, demanda y emisiones, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el pico de febrero', 'Una ola de calor pone al límite la red de una ciudad. Con los números, armá el plan para pasar el pico sin cortes.', [
      teoria('La situación', [
        'Una ciudad de 200.000 casas enfrenta una ola de calor. A las 20 horas, la demanda llega a 450 MW y la red de distribución aguanta 420 MW sin cortes. Muchas casas tienen el aire a 18 °C. Se estima que subirlo a 24 °C baja unos 400 W por casa que lo use, y que la mitad de las casas tiene aire.',
        'La red tiene un factor de emisión de 0,35 kg de CO₂ por kWh, pero en el pico se encienden turbinas de gas con un factor de 0,6.',
      ]),
      num('¿Cuántos MW sobran de demanda por encima de lo que aguanta la red?', 30, 'MW', '450 − 420 = 30 MW. Hay que bajar al menos eso para evitar cortes.', { ctx: 'Demanda de 450 MW; la red aguanta 420 MW.', d: 1 }),
      num('Si la mitad de las 200.000 casas sube el aire a 24 °C y cada una baja 400 W, ¿cuántos MW baja la demanda?', 40, 'MW', '100.000 × 400 W = 40.000.000 W = 40 MW. Alcanza para pasar el pico sin cortes.', { ctx: '100.000 casas con aire; 400 W menos cada una.', d: 2 }),
      num('¿Cuántos kg de CO₂ se evitan por cada hora que se bajan esos 40 MW en el pico? (0,6 kg por kWh en el pico)', 24000, 'kg de CO₂', '40 MW durante 1 hora son 40 MWh = 40.000 kWh; × 0,6 = 24.000 kg de CO₂ evitados por hora de pico.', { ctx: '40 MW menos durante una hora; turbinas de pico con 0,6 kg de CO₂ por kWh.', d: 3 }),
      rank('Ordená las medidas para esta noche por rapidez de efecto, de más rápida a más lenta.', [ // e4
        ['Pedido masivo de subir los aires a 24 °C', 'efecto en minutos'],
        ['Mover lavarropas y termotanques eléctricos fuera del pico', 'efecto en horas'],
        ['Cambiar transformadores del barrio', 'efecto en meses'],
        ['Construir un parque solar con baterías', 'efecto en años'],
      ], 'Para esta noche, la demanda. Para los próximos veranos, la red y la generación.', { d: 3 }),
      op('¿Qué mensaje a la población tiene más chances de funcionar?', [ // e5
        '"Hoy de 18 a 22, aire a 24 °C: evitemos cortes"',
        '"Usen menos energía porque sí, sin más explicación"',
        ['"El que tenga cortes es por su culpa y de nadie más"', 'Culpar aleja; un pedido concreto y con motivo claro funciona mejor.'],
        '"No hay ningún problema, sigan todo igual que siempre"',
      ], 'Concreto, con horario, con una acción simple y con el motivo: fácil, oportuno y social.', { d: 3 }),
      clas('Clasificá las medidas según su horizonte.', { // e6
        'Para esta noche': ['Pedir aires a 24 °C', 'Mover consumos flexibles fuera del pico', 'Apagar vidrieras iluminadas del centro'],
        'Para los próximos años': ['Reforzar la red de distribución', 'Sumar solar con baterías', 'Mejorar la aislación de las viviendas'],
      }, 'Un buen plan combina respuestas inmediatas con cambios estructurales.', { d: 2 }),
      det('La distribuidora publica su plan. Marcá lo que no conviene.', [ // e7
        ['Pedimos aires a 24 °C entre las 18 y las 22.', false],
        ['Para ahorrar, cortaremos la luz a los hospitales en el pico.', true, 'Los servicios esenciales se protegen; se piden reducciones a consumos flexibles.'],
        ['Reforzaremos los transformadores de los barrios más cargados.', false],
        ['Como la solar no genera a las 20, no conviene sumar solar nunca.', true, 'Con baterías o moviendo consumos al mediodía, la solar ayuda mucho.'],
      ], 'Pasar el pico hoy y prepararse para los próximos veranos.', { d: 3 }),
    ]),
  ],
});
