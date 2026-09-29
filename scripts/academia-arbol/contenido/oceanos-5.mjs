import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// OCÉANOS 5 — El océano que cambia.
// Calentamiento y olas de calor marinas, pérdida de oxígeno y acidificación,
// especies que se mudan y arrecifes que se blanquean, el carbono azul y las
// propuestas para usar el mar como sumidero, y cómo adaptar la pesca y la
// conservación. Retoma el océano que regula el clima (oceanos-1), la pesca
// (oceanos-2), las zonas muertas (oceanos-3) y las áreas marinas (oceanos-4).

export default unidad({
  slug: 'oceanos-5',
  rama: 'agua_azul',
  orden: 5,
  nivel: 3,
  requiereTronco: 3,
  titulo: 'El océano que cambia',
  bajada: 'Olas de calor en el mar, agua con menos oxígeno y más ácida, peces que se mudan al sur y arrecifes que se blanquean: qué le está pasando al océano y cómo adaptarse.',
  objetivos: [
    'Explicar el calentamiento del océano, las olas de calor marinas y la estratificación',
    'Relacionar la pérdida de oxígeno y la acidificación con sus efectos en la vida marina',
    'Analizar el desplazamiento de especies y sus consecuencias para la pesca',
    'Evaluar el carbono azul y las propuestas de remoción de carbono en el mar',
    'Proponer medidas de adaptación para pesquerías y áreas protegidas',
  ],
  repasa: ['oceanos-1', 'oceanos-2', 'oceanos-3', 'oceanos-4'],
  fuentes: ['ipcc-srocc', 'ipcc-ar6', 'hobday-pecl-2014', 'schmidtko-2017', 'noaa-acidificacion', 'poloczanska-2013', 'fao-clima-pesca-2018', 'icri-blanqueo-2025', 'unep-carbono-azul-2009', 'imo-protocolo-londres', 'argo', 'inidep', 'pampa-azul'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Un océano más caliente', 'El calor que guarda el mar, las olas de calor marinas y un agua que se mezcla menos.', [
      teoria('Donde va el calor', [
        'Como viste, el océano absorbió más del 90 % del calor extra que retienen los gases de efecto invernadero. Pero no se calienta igual en todos lados. Un estudio de 2014 identificó 24 "puntos calientes" del océano, zonas que se calentaron más rápido que el promedio en las últimas décadas; uno de ellos está en el Atlántico sudoccidental, frente al sudeste de Sudamérica. Esas zonas funcionan como alarmas tempranas de lo que puede pasar en otras.',
      ]),
      est('Estimá qué porcentaje del calor extra retenido por los gases de efecto invernadero absorbió el océano.', 90, { min: 0, max: 100, paso: 5, unidad: '%' }, 'Más del 90 %: sin el océano, la atmósfera se habría calentado muchísimo más.', { d: 1 }),
      teoria('Olas de calor marinas', [
        'Una ola de calor marina es un período, de días a meses, en el que el agua está mucho más caliente de lo normal para ese lugar y esa época. Según el informe especial del IPCC sobre el océano, es muy probable que su frecuencia se haya duplicado desde 1982, y se están volviendo más intensas. Pueden causar mortandades de peces, aves y mamíferos, blanqueo de corales, pérdida de bosques de algas y floraciones de algas tóxicas.',
      ], { destacado: { valor: '× 2', texto: 'la frecuencia de las olas de calor marinas desde 1982, según el IPCC (muy probable).' } }),
      op('¿Qué es una ola de calor marina?', [ // e1
        'Un período en que el agua está mucho más caliente de lo normal',
        'Una ola gigante que llega a la costa en verano',
        ['Un día de mucho calor en la playa', 'Se trata de la temperatura del agua, no del aire.'],
        'El agua caliente que sale de una central eléctrica',
      ], 'Se define respecto de lo normal para ese lugar y esa época del año.', { d: 1 }),
      numv(3, (i) => { // e2
        const [normal, hoy] = [[12, 15.5], [18, 21], [9, 12.5]][i];
        return {
          enunciado: `En un punto del Mar Argentino, la temperatura normal del agua en esta época es de ${normal.toLocaleString('es-AR')} °C y hoy se midieron ${hoy.toLocaleString('es-AR')} °C. ¿Cuál es la anomalía?`,
          valor: hoy - normal,
          unidad: '°C',
          dec: 1,
          explicacion: `${hoy.toLocaleString('es-AR')} − ${normal.toLocaleString('es-AR')} = ${(hoy - normal).toLocaleString('es-AR')} °C por encima de lo normal. Anomalías así, sostenidas durante días, pueden ser una ola de calor marina. Valores de ejemplo.`,
          ctx: `Normal: ${normal} °C; medido hoy: ${hoy} °C.`,
        };
      }, { d: 1 }),
      mult('¿Qué efectos pueden tener las olas de calor marinas? Marcá todos.', [ // e3
        '+Mortandad de peces, aves y mamíferos marinos',
        '+Blanqueo de corales',
        '+Pérdida de bosques de algas',
        '+Floraciones de algas tóxicas',
        '-Más oxígeno disuelto en el agua',
      ], 'El agua caliente guarda menos oxígeno: es parte del problema, no una ventaja.', { d: 2 }),
      teoria('Un agua que se mezcla menos', [
        'Cuando la superficie se calienta, esa agua más liviana queda "flotando" sobre el agua fría de abajo: el océano se estratifica. Con menos mezcla, bajan menos nutrientes hacia arriba, donde está la luz que usa el plancton, y llega menos oxígeno hacia abajo. Por eso el calentamiento no solo cambia la temperatura: cambia cuánta vida puede sostener cada zona del mar.',
      ]),
      cad('Armá la cadena de cómo la estratificación afecta la vida en el mar.', [ // e4
        'La superficie del océano se calienta',
        'El agua caliente queda arriba y se mezcla menos con la fría',
        'Suben menos nutrientes a la zona iluminada',
        'Crece menos plancton',
        'Hay menos alimento para peces, aves y ballenas',
      ], ['El calentamiento aumenta la mezcla del agua'], 'Menos mezcla significa menos nutrientes arriba y menos oxígeno abajo.', { d: 2 }),
      numv(3, (i) => { // e5
        const antes = [3, 4, 2][i];
        return {
          enunciado: `Si en una región había en promedio ${antes} olas de calor marinas por década y esa frecuencia se duplica, ¿cuántas habría por década?`,
          valor: antes * 2,
          unidad: 'olas de calor por década',
          explicacion: `${antes} × 2 = ${antes * 2} por década. Además de más frecuentes, se vuelven más intensas: el mar tiene menos tiempo para recuperarse entre una y otra.`,
          ctx: `${antes} por década; frecuencia duplicada.`,
        };
      }, { d: 1 }),
      vf('Como el océano absorbe la mayor parte del calor, el cambio climático casi no afecta al mar.', false, 'Justamente porque absorbe el calor, el océano se calienta, se estratifica, pierde oxígeno y sufre más olas de calor. El mar amortigua el cambio climático a un costo para su propia vida.', {
        razones: ['+Porque al absorber calor se calienta y cambia su vida', '-Porque el agua no puede cambiar de temperatura', '-Porque el calor se va al espacio desde el mar'],
        d: 1,
      }),
      par('Uní cada concepto con su definición.', [ // e6
        ['Punto caliente', 'Zona del mar que se calienta más rápido que el promedio'],
        ['Ola de calor marina', 'Período con el agua mucho más caliente de lo normal'],
        ['Estratificación', 'Capas de agua que se mezclan poco entre sí'],
        ['Anomalía', 'Diferencia entre lo medido y lo normal'],
      ], 'Cuatro conceptos para leer las noticias sobre el océano.', { d: 2 }),
      det('Leé esta nota periodística y marcá lo que conviene revisar.', [ // e7
        ['El océano absorbió más del 90 % del calor extra.', false],
        ['Las olas de calor marinas son cada vez menos frecuentes.', true, 'Según el IPCC, es muy probable que su frecuencia se haya duplicado desde 1982.'],
        ['El Atlántico sudoccidental tiene zonas que se calientan más rápido que el promedio.', false],
        ['El agua más caliente guarda más oxígeno, así que ayuda a los peces.', true, 'Es al revés: el agua caliente disuelve menos oxígeno.'],
      ], 'El océano es el gran regulador del clima, y ya muestra el costo.', { d: 2 }),
      comp('Completá.', 'Un período con el agua mucho más caliente de lo normal es una ola de [calor] marina; su frecuencia se [duplicó] desde 1982; y cuando el agua caliente queda arriba y se mezcla poco, el océano se [estratifica].', ['frío', 'redujo', 'congela'], 'Tres ideas para entender el calentamiento del mar.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Menos oxígeno, más ácido', 'El océano pierde oxígeno y se acidifica: qué significa y a quiénes afecta.', [
      teoria('El océano se queda sin aire', [
        'Un estudio publicado en 2017 estimó que el contenido total de oxígeno del océano bajó más de un 2 % desde 1960. Hay dos razones principales: el agua más caliente disuelve menos oxígeno, y la estratificación hace que llegue menos oxígeno desde la superficie hacia las profundidades. A eso se suma, cerca de las costas, el exceso de nutrientes que genera zonas muertas, como viste. Los modelos proyectan pérdidas de entre 1 y 7 % hacia 2100.',
      ], { destacado: { valor: '> 2 %', texto: 'bajó el contenido de oxígeno del océano desde 1960, según un estudio publicado en 2017.' } }),
      cad('Armá la cadena de cómo el calentamiento reduce el oxígeno del océano.', [ // e1
        'El agua superficial se calienta',
        'El agua caliente disuelve menos oxígeno',
        'Además, se mezcla menos con el agua profunda',
        'Llega menos oxígeno a las capas de abajo',
        'Se amplían las zonas con poco oxígeno',
      ], ['El agua caliente disuelve más oxígeno'], 'Dos efectos juntos: menos oxígeno disuelto y menos oxígeno que baja.', { d: 2 }),
      est('Estimá en qué porcentaje bajó el contenido de oxígeno del océano desde 1960.', 2, { min: 0, max: 30, paso: 0.5, unidad: '%' }, 'Más de un 2 %, según el estudio de 2017: parece poco, pero en algunas zonas la baja es mucho mayor.', { d: 2 }),
      teoria('Más ácido', [
        'Como viste, el océano absorbe parte del CO₂ que emitimos, y al disolverse lo vuelve más ácido. Según la agencia oceánica de Estados Unidos, el pH de la superficie del océano bajó alrededor de 0,1 desde la Revolución Industrial. Parece poco, pero la escala de pH es logarítmica: esa baja equivale a un aumento de alrededor del 30 % en la acidez. Para los organismos que construyen conchas y esqueletos de carbonato, como mejillones, ostras, corales y pequeños caracoles del plancton, se vuelve más difícil y costoso formarlos.',
      ]),
      numv(3, (i) => { // e2
        const baja = [0.1, 0.2, 0.3][i];
        const pct = Math.round((10 ** baja - 1) * 100);
        return {
          enunciado: `En la escala de pH, cada unidad que baja multiplica la acidez por 10. Si el pH baja ${baja.toLocaleString('es-AR')}, la acidez se multiplica por 10 elevado a ${baja.toLocaleString('es-AR')}. ¿En qué porcentaje aumenta la acidez? Redondeá al entero.`,
          valor: pct,
          unidad: '%',
          tol: 2,
          explicacion: `10 elevado a ${baja.toLocaleString('es-AR')} ≈ ${(10 ** baja).toLocaleString('es-AR', { maximumFractionDigits: 2 })}, o sea un aumento de alrededor del ${pct} %. Por eso una baja de pH que parece chica es un cambio grande para la química del agua.`,
          ctx: `El pH baja ${baja}; la escala es logarítmica.`,
        };
      }, { d: 3 }),
      clas('¿Este organismo forma conchas o esqueletos de carbonato, o no?', { // e3
        'Forma carbonato': ['Mejillón', 'Ostra', 'Coral', 'Caracol marino del plancton'],
        'No forma carbonato': ['Merluza', 'Lobo marino', 'Medusa', 'Alga de bosque submarino'],
      }, 'Los que construyen con carbonato son los primeros en sentir la acidificación.', { d: 2 }),
      vf('Una baja de 0,1 en el pH del océano es un cambio insignificante.', false, 'La escala de pH es logarítmica: una baja de 0,1 equivale a un aumento de alrededor del 30 % en la acidez, suficiente para afectar a organismos que forman conchas.', {
        razones: ['+Porque la escala es logarítmica y equivale a un 30 % más de acidez', '-Porque el pH del océano nunca cambia', '-Porque ningún ser vivo depende del pH'],
        d: 2,
      }),
      op('¿Por qué la acidificación preocupa especialmente a los criaderos de mejillones y ostras?', [ // e4
        'Porque a sus larvas les cuesta más formar la concha',
        'Porque el agua ácida hace crecer más rápido a los mejillones',
        ['Porque las ostras necesitan agua muy ácida para vivir', 'Es al revés: el agua más ácida les dificulta formar la concha.'],
        'Porque el agua ácida cambia el color de las ostras',
      ], 'Las etapas jóvenes son las más sensibles: ahí se juega el futuro de la población.', { d: 2 }),
      par('Uní cada problema del océano con su causa principal.', [ // e5
        ['Acidificación', 'CO₂ que se disuelve en el agua'],
        ['Pérdida de oxígeno en mar abierto', 'Calentamiento y estratificación'],
        ['Zonas muertas costeras', 'Exceso de nutrientes de ríos y cloacas'],
        ['Olas de calor marinas', 'Aumento de la temperatura del océano'],
      ], 'Varios problemas a la vez: por eso se habla de estresores múltiples.', { d: 2 }),
      mult('¿Qué ayuda a reducir la pérdida de oxígeno y la acidificación? Marcá todo.', [ // e6
        '+Reducir las emisiones de CO₂',
        '+Tratar las cloacas antes de volcarlas',
        '+Usar mejor los fertilizantes en el campo',
        '+Proteger ecosistemas costeros como las marismas',
        '-Volcar más nutrientes para que crezca más plancton',
      ], 'Lo global (emisiones) y lo local (nutrientes) se suman: se pueden atacar los dos.', { d: 2 }),
      det('Leé este texto escolar y marcá lo que conviene revisar.', [ // e7
        ['El pH del océano bajó alrededor de 0,1 desde la Revolución Industrial.', false],
        ['Eso significa que el océano se volvió 0,1 % más ácido.', true, 'Por la escala logarítmica, equivale a un aumento de alrededor del 30 % en la acidez.'],
        ['El océano perdió más de un 2 % de su oxígeno desde 1960.', false],
        ['La pérdida de oxígeno solo ocurre por la contaminación de las cloacas.', true, 'En mar abierto la causa principal es el calentamiento y la estratificación.'],
      ], 'Leer bien los números del océano evita subestimar los cambios.', { d: 3 }),
      comp('Completá.', 'Cuando el CO₂ se disuelve en el mar, el agua se [acidifica]; el pH superficial bajó alrededor de [0,1] desde la Revolución Industrial; y los más afectados son los organismos que forman conchas de [carbonato].', ['endulza', '10', 'plástico'], 'Tres claves para entender la química del océano que cambia.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('La vida se muda', 'Especies que se desplazan hacia los polos, pesquerías que cambian y el blanqueo masivo de los corales.', [
      teoria('Hacia los polos', [
        'Muchas especies marinas se mueven buscando el agua a la temperatura que toleran. Un análisis de 2013, que reunió 1.735 observaciones de todo el mundo, encontró que entre el 81 y el 83 % de los cambios observados en la vida marina coincidían con lo esperado por el cambio climático. En promedio, el borde de avance de las distribuciones de las especies se movió unos 72 km por década, en general hacia los polos, y los eventos de primavera se adelantaron unos 4 días por década.',
      ], { destacado: { valor: '≈ 72 km', texto: 'por década se desplazó en promedio el borde de avance de las especies marinas, en general hacia los polos.' } }),
      numv(3, (i) => { // e1
        const dec = [3, 5, 2][i];
        return {
          enunciado: `Si el borde de distribución de una especie se desplaza unos 72 km por década, ¿cuántos km se habrá movido en ${dec} décadas?`,
          valor: 72 * dec,
          unidad: 'km',
          explicacion: `72 × ${dec} = ${72 * dec} km. En pocas décadas, una especie puede aparecer en puertos donde antes no se pescaba, y desaparecer de otros.`,
          ctx: `72 km por década; ${dec} décadas.`,
        };
      }, { d: 1 }),
      cad('Armá la cadena de cómo el calentamiento puede generar conflictos pesqueros.', [ // e2
        'El agua se calienta en la zona de pesca habitual',
        'Un stock de peces se desplaza hacia aguas más frías',
        'Parte del stock pasa a aguas de otro país o a alta mar',
        'Cambian quiénes pueden pescarlo y bajo qué reglas',
        'Surgen disputas si no hay acuerdos compartidos',
      ], ['Los peces no cruzan los límites entre países'], 'Los peces no reconocen fronteras: las reglas de pesca tienen que adaptarse a su movimiento.', { d: 2 }),
      teoria('Qué pasa con la pesca', [
        'Según la FAO, hacia 2050 el potencial máximo de captura en las zonas económicas exclusivas del mundo podría bajar entre un 2,8 y un 5,3 % con emisiones bajas, y entre un 7,0 y un 12,1 % con emisiones altas. El promedio esconde grandes diferencias: las mayores bajas se esperan en los trópicos, mientras algunas zonas de latitudes altas podrían ganar especies.',
      ]),
      numv(3, (i) => { // e3
        const [capt, pct] = [[800000, 12], [500000, 5], [1000000, 7]][i];
        return {
          enunciado: `Una región captura ${capt.toLocaleString('es-AR')} toneladas por año. Si su potencial de captura baja un ${pct} %, ¿cuántas toneladas por año podría capturar?`,
          valor: capt * (100 - pct) / 100,
          unidad: 'toneladas',
          explicacion: `${capt.toLocaleString('es-AR')} × ${100 - pct} % = ${(capt * (100 - pct) / 100).toLocaleString('es-AR')} toneladas: ${(capt * pct / 100).toLocaleString('es-AR')} menos por año. Valores de ejemplo con los porcentajes de la FAO.`,
          ctx: `${capt} toneladas; baja del ${pct} %.`,
        };
      }, { d: 1 }),
      op('Según la FAO, ¿de qué depende sobre todo cuánto bajaría la pesca mundial hacia 2050?', [ // e4
        'Del nivel de emisiones que tenga el mundo',
        'De la cantidad de barcos que se construyan',
        ['De la moda de consumir sushi', 'Puede influir en la demanda, pero no en el potencial de captura.'],
        'Del color de las redes de pesca',
      ], 'Con emisiones altas, la baja proyectada es más del doble que con emisiones bajas.', { d: 1 }),
      teoria('Arrecifes blanqueados', [
        'Cuando el agua se calienta demasiado, los corales expulsan las algas que viven en sus tejidos y les dan color y alimento: se blanquean. Si el calor dura, mueren. Entre 2023 y 2025 ocurrió el cuarto evento mundial de blanqueo: el 84 % de la superficie de arrecifes del mundo sufrió un estrés térmico capaz de blanquear corales. En los eventos anteriores la cifra fue del 21 % (1998), 37 % (2010) y 68 % (2014-2017).',
      ], {
        datos: barras('Superficie de arrecifes con estrés térmico de blanqueo en cada evento mundial', '%', [
          ['1998', 21],
          ['2010', 37],
          ['2014-2017', 68],
          ['2023-2025', 84],
        ], 'International Coral Reef Initiative y NOAA.'),
      }),
      num('Si en 1998 el 21 % de los arrecifes sufrió estrés de blanqueo y entre 2023 y 2025 el 84 %, ¿cuántas veces más grande fue el último evento?', 4, 'veces', '84 ÷ 21 = 4 veces: cada evento mundial fue más extenso que el anterior.', { ctx: '21 % en 1998; 84 % en 2023-2025.', d: 1 }),
      rank('Ordená los eventos mundiales de blanqueo de corales del más extenso al menos extenso.', [ // e5
        ['2023-2025', '84 %'],
        ['2014-2017', '68 %'],
        ['2010', '37 %'],
        ['1998', '21 %'],
      ], 'La tendencia es clara: eventos cada vez más extensos.', { d: 1, extremos: ['Más extenso', 'Menos extenso'] }),
      vf('Un coral blanqueado ya está muerto.', false, 'El blanqueo es una señal de estrés: el coral expulsó sus algas. Si el agua se enfría a tiempo, puede recuperarlas; si el calor dura, muere.', {
        razones: ['+Porque puede recuperarse si el agua se enfría a tiempo', '-Porque los corales blancos son una especie distinta', '-Porque el blanqueo no tiene relación con la temperatura'],
        d: 2,
      }),
      mult('¿Qué cambios en la vida marina se asocian al calentamiento? Marcá todos.', [ // e6
        '+Especies que se desplazan hacia aguas más frías',
        '+Primaveras biológicas que se adelantan',
        '+Blanqueo masivo de corales',
        '+Cambios en qué especies llegan a cada puerto',
        '-Que todas las especies sigan exactamente en el mismo lugar',
      ], 'El océano se reorganiza: algunas especies ganan espacio y muchas lo pierden.', { d: 1 }),
      det('Leé este informe de una cámara pesquera y marcá lo que conviene revisar.', [ // e7
        ['Algunas especies aparecen cada vez más al sur.', false],
        ['El cambio climático no puede afectar a la pesca porque los peces se adaptan solos.', true, 'Se desplazan, y eso cambia qué se pesca y dónde; la FAO proyecta bajas en el potencial de captura.'],
        ['Conviene acordar con los países vecinos cómo manejar los stocks compartidos.', false],
        ['El blanqueo de corales es un problema lejano sin relación con el clima.', true, 'Es causado por el calentamiento del agua y ya afectó al 84 % de los arrecifes.'],
      ], 'Planificar la pesca del futuro exige mirar el clima.', { d: 2 }),
      comp('Completá.', 'En promedio, las especies marinas se desplazan unos [72] km por década hacia los polos; cuando los corales expulsan sus algas se [blanquean]; y el cuarto evento mundial afectó al [84] % de los arrecifes.', ['7', 'oscurecen', '21'], 'Tres datos de una vida marina que se muda.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Carbono azul', 'Marismas, pastos marinos y bosques de algas que guardan carbono, y las propuestas para usar el mar como sumidero.', [
      teoria('Ecosistemas que guardan carbono', [
        'Se llama carbono azul al que capturan y guardan los ecosistemas marinos y costeros. Un informe de 2009 del PNUMA, la FAO y la UNESCO estimó que los ecosistemas costeros con vegetación, como marismas, manglares y praderas de pastos marinos, ocupan una fracción muy pequeña del fondo marino pero guardan más de la mitad del carbono que se entierra en los sedimentos del océano. En Argentina hay grandes marismas, como las de Bahía Blanca y Bahía San Antonio, y bosques de cachiyuyo, un alga gigante, en las costas de Patagonia y Tierra del Fuego.',
      ]),
      op('¿Por qué los ecosistemas costeros con vegetación son tan importantes para el carbono azul?', [ // e1
        'Guardan mucho carbono en sus sedimentos pese a su poca superficie',
        'Porque cubren la mayor parte del fondo del océano',
        ['Porque no tienen ningún ser vivo', 'Son de los ecosistemas más productivos del mar.'],
        'Porque liberan carbono a la atmósfera todo el tiempo',
      ], 'Poca superficie, mucho carbono enterrado: por eso protegerlos rinde tanto.', { d: 2 }),
      clas('¿Es un ecosistema de carbono azul o no?', { // e2
        'Carbono azul': ['Marisma de Bahía Blanca', 'Pradera de pastos marinos', 'Bosque de cachiyuyo', 'Manglar tropical'],
        'No es carbono azul': ['Pastizal de la región pampeana', 'Bosque de lengas en la cordillera', 'Selva misionera'],
      }, 'Todos guardan carbono, pero el carbono azul es el de los ecosistemas marinos y costeros.', { d: 2 }),
      cad('Armá la cadena de qué pasa cuando se destruye una marisma.', [ // e3
        'Se rellena una marisma para construir',
        'Se remueven sus suelos inundados',
        'El carbono enterrado queda expuesto al aire',
        'Se descompone y vuelve a la atmósfera como CO₂',
        'Se pierde un sumidero y se suman emisiones',
      ], ['Rellenar una marisma aumenta el carbono guardado'], 'Destruir un ecosistema de carbono azul emite el carbono acumulado durante siglos.', { d: 2 }),
      teoria('La bomba biológica', [
        'En mar abierto, el fitoplancton usa CO₂ para crecer. Una parte de esa materia orgánica se hunde hacia las profundidades, donde el carbono puede quedar guardado por siglos. A este proceso se lo llama bomba biológica. Los animales también participan: las ballenas, por ejemplo, fertilizan la superficie con sus heces y ayudan a que crezca el plancton.',
      ]),
      ord('Ordená los pasos de la bomba biológica del océano.', [ // e4
        'El fitoplancton absorbe CO₂ con la luz del sol',
        'Lo convierten en materia orgánica al crecer',
        'Otros organismos lo comen o el plancton muere',
        'Parte de esa materia se hunde hacia las profundidades',
        'El carbono queda guardado en el océano profundo por siglos',
      ], 'Es uno de los grandes mecanismos por los que el océano guarda carbono.', { d: 2 }),
      teoria('¿Y si lo forzamos?', [
        'Algunas propuestas buscan aumentar a propósito el carbono que guarda el mar: fertilizar el océano con hierro para que crezca más plancton, agregar minerales para que absorba más CO₂ o cultivar algas y hundirlas. Tienen incertidumbres grandes: cuánto carbono se guarda de verdad y por cuánto tiempo, y qué efectos no buscados tienen en los ecosistemas. Por eso la fertilización oceánica está regulada por el Protocolo de Londres, que solo permite investigación legítima y controlada. Como viste con los bonos, la permanencia y la verificación son claves.',
      ]),
      mult('¿Qué preguntas conviene hacer sobre una propuesta de remoción de carbono en el mar? Marcá todas.', [ // e5
        '+¿Cuánto carbono se guarda de verdad?',
        '+¿Por cuánto tiempo queda guardado?',
        '+¿Qué efectos tiene en los ecosistemas?',
        '+¿Cómo se mide y quién lo verifica?',
        '-¿Se puede vender como bono sin medir nada?',
      ], 'Las mismas preguntas de calidad que viste para los bonos de carbono.', { d: 2 }),
      vf('Fertilizar el océano con hierro es una solución probada y libre de riesgos para el cambio climático.', false, 'Hay grandes incertidumbres sobre cuánto carbono se guarda y por cuánto tiempo, y sobre sus efectos en los ecosistemas. Por eso está regulada y solo se permite investigación controlada.', {
        razones: ['+Porque hay grandes incertidumbres y posibles efectos no buscados', '-Porque el hierro no existe en el mar', '-Porque el plancton no absorbe CO₂'],
        d: 2,
      }),
      numv(3, (i) => { // e6
        const [ha, t] = [[1000, 2], [500, 1.5], [2000, 2.5]][i];
        return {
          enunciado: `Una marisma de ${ha.toLocaleString('es-AR')} hectáreas entierra unas ${t.toLocaleString('es-AR')} toneladas de carbono por hectárea por año. ¿Cuántas toneladas de carbono entierra por año?`,
          valor: ha * t,
          unidad: 'toneladas de carbono',
          explicacion: `${ha.toLocaleString('es-AR')} × ${t.toLocaleString('es-AR')} = ${(ha * t).toLocaleString('es-AR')} toneladas por año. Valores de ejemplo: la cantidad real varía mucho de un sitio a otro, y por eso hay que medirla.`,
          ctx: `${ha} hectáreas; ${t} toneladas por hectárea por año.`,
        };
      }, { d: 1 }),
      par('Uní cada propuesta con su principal duda.', [ // e7
        ['Fertilizar con hierro', 'Cuánto carbono llega de verdad al fondo'],
        ['Hundir algas cultivadas', 'Qué efectos tiene en el fondo marino'],
        ['Agregar minerales al agua', 'Cómo se verifica a gran escala'],
        ['Proteger marismas existentes', 'Pocas dudas: evita perder carbono ya guardado'],
      ], 'Proteger lo que ya guarda carbono suele ser lo más seguro y efectivo.', { d: 3 }),
      det('Leé esta propuesta de una empresa y marcá lo que conviene revisar.', [ // e8
        ['Vamos a restaurar una marisma degradada y medir el carbono de sus suelos.', false],
        ['Venderemos bonos por el carbono que "seguro" guardará el hierro que echemos al mar.', true, 'Es muy incierto y está regulado: no se puede asegurar ni vender así.'],
        ['Publicaremos las mediciones para que las verifiquen terceros.', false],
        ['No hace falta estudiar los efectos en los ecosistemas.', true, 'Los efectos no buscados son una de las mayores preocupaciones.'],
      ], 'En el mar, como en tierra, proteger y restaurar suele ser más confiable que forzar.', { d: 2 }),
      comp('Completá.', 'El carbono que guardan los ecosistemas marinos y costeros se llama carbono [azul]; el proceso por el que el plancton lleva carbono a las profundidades es la bomba [biológica]; y la fertilización del océano está regulada por el Protocolo de [Londres].', ['verde', 'mecánica', 'Kioto'], 'Tres ideas para pensar el océano como sumidero.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Adaptarse en el mar', 'Medir el océano, pescar con reglas que se ajustan, áreas protegidas como refugio y menos estrés sobre el mar.', [
      teoria('Medir para adaptarse', [
        'Para adaptarse hay que saber qué está cambiando. El programa internacional Argo tiene cerca de 4.000 boyas perfiladoras que bajan hasta 2.000 metros y suben cada 10 días midiendo temperatura y salinidad, y envían los datos por satélite. En Argentina, el INIDEP hace campañas de investigación pesquera, y la iniciativa Pampa Azul coordina ciencia en el Mar Argentino. Con esos datos se pueden anticipar olas de calor marinas y ajustar el manejo de la pesca.',
      ]),
      numv(3, (i) => { // e1
        const [boyas, dias] = [[4000, 10], [3800, 10], [4000, 5]][i];
        const perf = Math.round(boyas * 365 / dias);
        return {
          enunciado: `Si ${boyas.toLocaleString('es-AR')} boyas hacen un perfil de temperatura y salinidad cada ${dias} días, ¿cuántos perfiles juntan en un año, aproximadamente?`,
          valor: perf,
          unidad: 'perfiles por año',
          tol: Math.round(perf * 0.02),
          explicacion: `365 ÷ ${dias} = ${(365 / dias).toLocaleString('es-AR')} perfiles por boya; × ${boyas.toLocaleString('es-AR')} ≈ ${perf.toLocaleString('es-AR')} perfiles por año. Una red así permite ver cambios en el interior del océano, no solo en la superficie.`,
          ctx: `${boyas} boyas; un perfil cada ${dias} días.`,
        };
      }, { d: 2 }),
      teoria('Pesca que se ajusta', [
        'Con especies que se mueven y productividades que cambian, las reglas de pesca fijas pierden eficacia. Una pesca adaptada al clima revisa las cuotas con más frecuencia según los datos, protege las zonas y épocas de reproducción aunque se desplacen, acuerda con los países vecinos cómo manejar los stocks compartidos y diversifica las especies que se pescan para no depender de una sola.',
      ]),
      clas('¿La medida adapta la pesca al cambio climático o la vuelve más frágil?', { // e2
        'La adapta': ['Revisar las cuotas cada año con datos nuevos', 'Acuerdos con países vecinos por stocks compartidos', 'Proteger las zonas de cría aunque se muevan'],
        'La vuelve más frágil': ['Mantener la misma cuota por diez años sin mirar datos', 'Depender de una sola especie', 'Ignorar los cambios en la temperatura del agua'],
      }, 'Adaptarse es aprender y ajustar a medida que el mar cambia.', { d: 2 }),
      teoria('Refugios y menos estrés', [
        'Las áreas marinas protegidas bien diseñadas pueden funcionar como refugios: ecosistemas con más diversidad y poblaciones más grandes suelen resistir y recuperarse mejor de las olas de calor. También ayuda reducir los otros estresores que sí se controlan localmente, como la sobrepesca, la contaminación y el exceso de nutrientes: un ecosistema sano tolera mejor el calor y la acidificación.',
      ]),
      cad('Armá la cadena de cómo un área protegida ayuda a resistir el cambio climático.', [ // e3
        'Se protege un área de la pesca y la contaminación',
        'Las poblaciones crecen y la diversidad aumenta',
        'El ecosistema tiene más redundancia y reservas',
        'Resiste mejor una ola de calor marina',
        'Se recupera más rápido después',
      ], ['Proteger un área impide que el agua se caliente'], 'La protección no frena el calentamiento, pero da más capacidad de resistir y recuperarse.', { d: 2 }),
      vf('Crear áreas marinas protegidas alcanza para frenar el calentamiento del océano.', false, 'Las áreas protegidas ayudan a que los ecosistemas resistan y se recuperen, pero no frenan el calentamiento: para eso hay que reducir las emisiones.', {
        razones: ['+Porque ayudan a resistir, pero solo reducir emisiones frena el calentamiento', '-Porque las áreas protegidas enfrían el agua', '-Porque el océano no se está calentando'],
        d: 1,
      }),
      op('¿Por qué conviene reducir la sobrepesca y la contaminación si el problema principal es el calentamiento?', [ // e4
        'Porque un ecosistema sano tolera mejor el calor y la acidez',
        'Porque la sobrepesca enfría el agua del mar',
        ['Porque así ya no hace falta reducir emisiones', 'Hacen falta las dos cosas: reducir emisiones y otros estresores.'],
        'Porque la contaminación protege a los peces del calor',
      ], 'Sumar estresores empeora todo; sacar los que se pueden controlar da margen.', { d: 2 }),
      par('Uní cada herramienta con lo que aporta a la adaptación.', [ // e5
        ['Boyas Argo', 'Datos del interior del océano'],
        ['Campañas del INIDEP', 'Estado de las poblaciones de peces'],
        ['Área marina protegida', 'Refugio para ecosistemas más resistentes'],
        ['Acuerdo regional de pesca', 'Reglas para stocks que cruzan fronteras'],
      ], 'Medir, proteger y acordar: tres pilares de la adaptación en el mar.', { d: 1 }),
      ord('Ordená un ciclo de manejo pesquero adaptado al clima.', [ // e6
        'Medir la temperatura del agua y el estado de los stocks',
        'Estimar cuánto se puede pescar sin agotar el recurso',
        'Fijar la cuota del año con esos datos',
        'Controlar las capturas',
        'Revisar los resultados y ajustar el año siguiente',
      ], 'Un ciclo anual con datos permite seguir a un mar que cambia.', { d: 2 }),
      mult('¿Qué puede hacer una comunidad pesquera costera para adaptarse? Marcá todo.', [ // e7
        '+Diversificar las especies que pesca y procesa',
        '+Participar en el monitoreo junto a la ciencia',
        '+Sumar otras actividades, como el turismo responsable',
        '+Proteger sus zonas de cría cercanas',
        '-Pescar todo lo posible antes de que los peces se muevan',
      ], 'Diversificar y cuidar es mejor estrategia que apurarse a agotar.', { d: 2 }),
      det('Leé este plan provincial y marcá lo que conviene revisar.', [ // e8
        ['Revisaremos las cuotas cada año con datos del INIDEP.', false],
        ['Mantendremos la misma cuota fija durante veinte años para dar previsibilidad.', true, 'Con un mar que cambia, las cuotas tienen que revisarse con datos.'],
        ['Crearemos un área protegida en una zona de cría.', false],
        ['Como el problema es global, no vale la pena reducir la contaminación local.', true, 'Reducir los estresores locales ayuda a que el ecosistema resista mejor.'],
      ], 'La adaptación combina ciencia, protección y reglas que se ajustan.', { d: 2 }),
      comp('Completá.', 'Las boyas que miden el interior del océano pertenecen al programa [Argo]; en Argentina la investigación pesquera la hace el [INIDEP]; y reducir otros estresores ayuda a que los ecosistemas [resistan] mejor.', ['Apolo', 'INTA', 'desaparezcan'], 'Tres herramientas para adaptarse a un océano que cambia.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: el océano que cambia', 'Calentamiento, oxígeno y acidez, especies que se mudan, carbono azul y adaptación, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: la pesquería que se corre al sur', 'En un puerto patagónico, la especie principal aparece cada vez más al sur y hubo una ola de calor marina. Armá un plan de adaptación.', [
      teoria('La situación', [
        'El puerto vive de una especie que captura 40.000 toneladas por año. En los últimos 20 años, el centro de la zona de pesca se movió unos 150 km al sur, y una ola de calor marina el verano pasado causó una mortandad de mejillones en la costa. La cooperativa de pescadores propone pescar "todo lo que se pueda" antes de que la especie se vaya; el municipio propone una marisma protegida y un plan de adaptación.',
      ]),
      num('¿Cuántos km por década se desplazó la zona de pesca?', 75, 'km por década', '150 km ÷ 2 décadas = 75 km por década: muy cerca del promedio mundial de unos 72 km por década.', { ctx: 'La zona se movió 150 km en 20 años.', d: 1 }),
      num('Si el potencial de captura bajara un 12 %, ¿cuántas toneladas por año podrían capturarse?', 35200, 'toneladas', '40.000 × 88 % = 35.200 toneladas: 4.800 toneladas menos por año, con el mismo esfuerzo.', { ctx: '40.000 toneladas; baja del 12 %.', d: 2 }),
      op('¿Qué problema tiene la propuesta de "pescar todo lo que se pueda"?', [ // e3
        'Puede agotar el stock y dejar sin futuro al puerto',
        'Que los barcos no pueden pescar tanto',
        ['Que la especie se va a quedar aunque se la sobrepesque', 'La sobrepesca suma estrés a una especie que ya está bajo presión.'],
        'Que no hay compradores para el pescado',
      ], 'Sobrepescar a una población estresada acelera su caída.', { d: 2 }),
      clas('¿Qué medidas deberían entrar en el plan de adaptación y cuáles no?', { // e4
        'Deberían entrar': ['Cuotas revisadas cada año con datos', 'Diversificar hacia especies que llegan', 'Proteger la marisma y las zonas de cría'],
        'No deberían entrar': ['Pescar todo antes de que la especie se vaya', 'Ignorar la ola de calor del verano pasado', 'Volcar efluentes del puerto sin tratar'],
      }, 'Un buen plan combina reglas que se ajustan, diversificación y protección.', { d: 2 }),
      ord('Ordená el plan de adaptación del puerto.', [ // e5
        'Reunir a pescadores, científicos y municipio',
        'Analizar los datos de temperatura y de capturas',
        'Acordar cuotas y zonas protegidas',
        'Diversificar las especies y las actividades',
        'Monitorear cada año y ajustar',
      ], 'Participación, datos, reglas, diversificación y monitoreo.', { d: 3 }),
      vf('Como la causa es el calentamiento global, el puerto no puede hacer nada para adaptarse.', false, 'No puede frenar solo el calentamiento, pero sí adaptar sus reglas de pesca, diversificar, proteger zonas de cría y reducir otros estresores.', {
        razones: ['+Porque puede adaptar reglas, diversificar y proteger', '-Porque el calentamiento global no existe', '-Porque la pesca no depende del clima'],
        d: 1,
      }),
      det('La cooperativa escribe su propuesta final. Marcá lo que conviene corregir.', [ // e7
        ['Participaremos del monitoreo junto al INIDEP.', false],
        ['Pediremos una cuota fija y alta por diez años, sin revisiones.', true, 'Con un mar que cambia, las cuotas tienen que revisarse con datos.'],
        ['Probaremos procesar especies nuevas que llegan a la zona.', false],
        ['La ola de calor fue un hecho aislado que no se va a repetir.', true, 'Las olas de calor marinas son cada vez más frecuentes.'],
      ], 'Adaptarse es aceptar que el mar cambia y decidir con datos.', { d: 3 }),
    ]),
  ],
});
