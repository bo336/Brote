import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// AIRE Y SUELO 6 — Metas climáticas.
// El presupuesto de carbono, el ciclo de compromisos del Acuerdo de París y la
// brecha de emisiones, cómo leer una meta con ojo crítico, qué significa cero
// neto y cuándo sirve un bono de carbono, y los compromisos de Argentina.
// Retoma el efecto invernadero (aire-suelo-3), el clima que cambia y el
// Acuerdo de París (aire-suelo-4), el greenwashing (consumo-2) y los datos
// (ciencia-2).

export default unidad({
  slug: 'aire-suelo-6',
  rama: 'aire_suelo',
  orden: 6,
  nivel: 3,
  requiereTronco: 3,
  titulo: 'Metas climáticas',
  bajada: 'Presupuesto de carbono, NDC, cero neto y bonos: cómo se fijan las metas contra el cambio climático y cómo distinguir una promesa seria de una de papel.',
  objetivos: [
    'Explicar el presupuesto de carbono y por qué hace falta llegar a cero neto',
    'Describir el ciclo de compromisos del Acuerdo de París y la brecha de emisiones',
    'Comparar metas absolutas, de intensidad y respecto de escenarios tendenciales',
    'Evaluar la calidad de un bono de carbono y de una promesa de cero neto',
    'Analizar los compromisos climáticos de Argentina con sus números',
  ],
  repasa: ['aire-suelo-4', 'aire-suelo-3', 'consumo-2', 'ciencia-2'],
  fuentes: ['gcb-2025', 'ipcc-ar6', 'acuerdo-paris', 'unfccc-balance-mundial', 'unep-brecha-2025', 'ue-ley-clima', 'west-2023-bonos', 'onu-integridad-cero-neto', 'ley-27520-cambio-climatico', 'ar-elp-2050', 'ar-ndc-3', 'inventario-gei-ar', 'cat-argentina'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('El presupuesto de carbono', 'Por qué el CO₂ se acumula como agua en una bañera y cuánto nos queda para no pasar de 1,5 °C.', [
      teoria('Una bañera que se llena', [
        'Pensá la atmósfera como una bañera. La canilla son las emisiones y el desagüe, lo que absorben los océanos y la vegetación. Mientras entre más de lo que sale, el nivel sube, aunque cerremos un poco la canilla. Por eso la concentración de CO₂ sigue aumentando: según el Global Carbon Project, en 2025 llegó a unas 425,7 partes por millón, un 52 % más que antes de la Revolución Industrial.',
      ]),
      cad('Armá la cadena de por qué el CO₂ sigue subiendo aunque las emisiones crezcan poco.', [ // e1
        'Cada año emitimos más CO₂ del que absorben océanos y plantas',
        'La diferencia se queda en la atmósfera',
        'El CO₂ acumulado aumenta año tras año',
        'Crece el efecto invernadero',
        'La temperatura sigue subiendo',
      ], ['Si las emisiones dejan de crecer, el CO₂ del aire empieza a bajar'], 'Mientras la canilla abra más de lo que el desagüe se lleva, la bañera se sigue llenando.', { d: 2 }),
      clas('¿Es una cantidad acumulada (stock) o un flujo por año?', { // e2
        'Acumulado (stock)': ['La concentración de CO₂ en el aire', 'Todo el CO₂ emitido desde 1850', 'El carbono guardado en un bosque viejo'],
        'Flujo por año': ['Las emisiones de este año', 'Lo que absorben los océanos cada año', 'El carbono que capta un bosque joven en un año'],
      }, 'Distinguir stocks de flujos es la clave para entender por qué no alcanza con "emitir un poco menos".', { d: 2 }),
      est('Estimá la concentración de CO₂ en la atmósfera en 2025, en partes por millón.', 426, { min: 200, max: 600, paso: 1, unidad: 'ppm' }, 'Unas 425,7 ppm según el Global Carbon Project: un 52 % más que las cerca de 280 ppm de la era preindustrial.', { d: 2 }),
      teoria('Un presupuesto', [
        'El IPCC mostró que el calentamiento crece de forma casi proporcional al CO₂ acumulado desde el inicio de la era industrial. Por eso se puede calcular un presupuesto de carbono: cuánto CO₂ más se puede emitir para no pasar cierta temperatura. Según el Global Carbon Project (2025), quedan unas 170.000 millones de toneladas (170 GtCO₂) para tener una chance de uno en dos de no superar 1,5 °C; 525 GtCO₂ para 1,7 °C, y 1.055 GtCO₂ para 2 °C.',
        'En 2025 el mundo emitió 38,1 GtCO₂ por combustibles fósiles, un récord, más 4,1 GtCO₂ por cambios en el uso de la tierra: unas 42,2 GtCO₂ en total.',
      ], { destacado: { valor: '≈ 4 años', texto: 'de emisiones al ritmo de 2025 alcanzan para agotar el presupuesto de 1,5 °C, según el Global Carbon Project.' } }),
      numv(3, (i) => { // e3
        const [meta, pres] = [['1,5 °C', 170], ['1,7 °C', 525], ['2 °C', 1055]][i];
        const anios = Math.round(pres / 42.2);
        return {
          enunciado: `Para no superar ${meta} quedan unas ${pres.toLocaleString('es-AR')} GtCO₂. Si el mundo sigue emitiendo 42,2 GtCO₂ por año, ¿cuántos años dura ese presupuesto? Redondeá al entero.`,
          valor: anios,
          unidad: 'años',
          tol: 1,
          explicacion: `${pres.toLocaleString('es-AR')} ÷ 42,2 ≈ ${anios} años. Cada año de emisiones altas achica el margen de todos los que vienen después.`,
          ctx: `Presupuesto de ${pres} GtCO₂; 42,2 GtCO₂ por año.`,
        };
      }, { d: 2 }),
      num('Si las emisiones bajaran a la mitad de golpe, a 21,1 GtCO₂ por año, ¿cuántos años duraría el presupuesto de 170 GtCO₂ para 1,5 °C? Redondeá al entero.', 8, 'años', '170 ÷ 21,1 ≈ 8 años: reducir compra tiempo, pero el presupuesto igual se agota si las emisiones no llegan a cero.', { ctx: '170 GtCO₂ de presupuesto; 21,1 GtCO₂ por año.', tol: 1, d: 2 }),
      op('¿Por qué se habla de un "presupuesto" de carbono?', [ // e4
        'Porque el calentamiento depende del CO₂ acumulado',
        'Porque cada país paga por las toneladas que emite',
        ['Porque el CO₂ se va del aire a fin de cada año', 'Gran parte queda en el aire durante siglos.'],
        'Porque la ONU reparte bonos de carbono gratis',
      ], 'Como lo que importa es el total acumulado, cada tonelada emitida gasta parte de un margen que se achica.', { d: 2 }),
      teoria('Por qué hace falta llegar a cero neto', [
        'Si el mundo solo dejara de aumentar sus emisiones, la bañera se seguiría llenando. Según el IPCC, para estabilizar la temperatura hay que llegar al menos a cero emisiones netas de CO₂, y reducir fuerte los otros gases, como el metano. Cero neto significa que lo poco que se siga emitiendo se compensa con lo que se saca de la atmósfera y se guarda de forma duradera, por ejemplo en bosques que crecen o en el suelo.',
      ]),
      vf('Si el mundo mantuviera sus emisiones estables, sin aumentarlas, la temperatura dejaría de subir.', false, 'Con emisiones estables el CO₂ se sigue acumulando y la temperatura sigue subiendo. Para estabilizarla hay que llegar al menos a cero neto de CO₂.', {
        razones: ['+Porque el CO₂ se sigue acumulando mientras haya emisiones netas', '-Porque el CO₂ desaparece del aire en pocos días', '-Porque la temperatura solo depende del Sol'],
        d: 2,
      }),
      par('Uní cada término del balance de carbono con su significado.', [ // e5
        ['Fuente', 'Lo que emite gases a la atmósfera'],
        ['Sumidero', 'Lo que absorbe y guarda carbono'],
        ['Emisiones netas', 'Emisiones menos absorciones'],
        ['Presupuesto de carbono', 'CO₂ que falta emitir para llegar a un límite de temperatura'],
      ], 'Cuatro palabras que vas a usar para leer cualquier meta climática.', { d: 1 }),
      mult('¿Qué acciones achican el flujo neto de CO₂ hacia la atmósfera? Marcá todas.', [ // e6
        '+Reemplazar combustibles fósiles por renovables',
        '+Frenar la deforestación',
        '+Restaurar bosques que vuelvan a crecer',
        '+Mejorar la eficiencia energética',
        '-Mudar una fábrica contaminante a otro país',
      ], 'Mudar las emisiones no las reduce: la atmósfera es una sola.', { d: 1 }),
      det('Leé este posteo sobre el clima y marcá lo equivocado.', [ // e7
        ['La concentración de CO₂ sigue aumentando año tras año.', false],
        ['Si reducimos un poco las emisiones, la temperatura empieza a bajar enseguida.', true, 'Mientras haya emisiones netas, el CO₂ se acumula y la temperatura sube.'],
        ['El presupuesto de carbono para 1,5 °C está casi agotado.', false],
        ['El CO₂ que emitimos hoy desaparece del aire en unos meses.', true, 'Una parte importante se queda durante siglos.'],
      ], 'Entender la bañera evita creer en soluciones mágicas o rápidas.', { d: 2 }),
      comp('Completá.', 'El CO₂ que todavía podemos emitir para no pasar un límite de temperatura es el [presupuesto] de carbono; para estabilizar la temperatura hay que llegar a cero emisiones [netas] de CO₂; y en 2025 la concentración rondó las [426] ppm.', ['impuesto', 'brutas', '280'], 'Tres ideas para entender por qué las metas apuntan a cero neto.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('París, las NDC y la brecha', 'El ciclo de compromisos cada cinco años, el balance mundial y la distancia entre lo prometido y lo necesario.', [
      teoria('Un trinquete', [
        'El Acuerdo de París de 2015 no le dice a cada país cuánto reducir. Cada uno presenta su propia Contribución Determinada a Nivel Nacional (NDC), y cada cinco años debe presentar una nueva que represente un avance respecto de la anterior y refleje la mayor ambición posible. Además, los países deben informar sus emisiones y avances con reglas comunes de transparencia. Por eso se lo compara con un trinquete: una herramienta que solo gira hacia un lado.',
        'Cada cinco años se hace también un balance mundial. El primero terminó en la COP28 de Dubái, en 2023, y llamó a dejar atrás los combustibles fósiles en los sistemas de energía de forma justa, ordenada y equitativa, a triplicar la capacidad renovable y a duplicar el ritmo de mejora de la eficiencia energética para 2030.',
      ]),
      ord('Ordená el ciclo de compromisos del Acuerdo de París.', [ // e1
        'Cada país presenta su NDC',
        'Informa sus emisiones y sus avances',
        'Se hace un balance mundial de lo logrado',
        'Cada país presenta una NDC más ambiciosa',
      ], 'El ciclo se repite cada cinco años, con la idea de subir la ambición en cada vuelta.', { d: 2 }),
      clas('¿Lo establece el Acuerdo de París o no?', { // e2
        'Lo establece': ['Presentar una NDC cada cinco años', 'Que cada NDC avance respecto de la anterior', 'Informar emisiones con reglas de transparencia'],
        'No lo establece': ['Que todos los países reduzcan el mismo porcentaje', 'Multas automáticas si un país no cumple', 'Una meta fijada por la ONU para cada país'],
      }, 'París se apoya en compromisos nacionales, transparencia y presión entre pares, no en sanciones.', { d: 2 }),
      vf('El Acuerdo de París fija cuánto debe reducir sus emisiones cada país.', false, 'Cada país define su propia NDC. El acuerdo fija el objetivo común de temperatura, las reglas de transparencia y la obligación de aumentar la ambición cada cinco años.', {
        razones: ['+Porque cada país define su propia meta en su NDC', '-Porque el acuerdo no tiene ningún objetivo de temperatura', '-Porque solo incluye a los países ricos'],
        d: 1,
      }),
      par('Uní cada tema con lo que acordó el primer balance mundial, en la COP28.', [ // e3
        ['Renovables', 'Triplicar la capacidad instalada para 2030'],
        ['Eficiencia energética', 'Duplicar su ritmo anual de mejora para 2030'],
        ['Combustibles fósiles', 'Dejarlos atrás en los sistemas de energía'],
        ['Balance mundial', 'Revisar el avance colectivo cada cinco años'],
      ], 'Por primera vez, un texto de la ONU sobre clima nombró de forma explícita a los combustibles fósiles.', { d: 2 }),
      teoria('La brecha de emisiones', [
        'El PNUMA publica cada año el Informe sobre la Brecha de Emisiones: la distancia entre las emisiones hacia las que vamos y las que harían falta. Según el informe de 2025, las emisiones mundiales de gases de efecto invernadero llegaron a 57,7 GtCO₂e en 2024, un 2,3 % más que en 2023. Con las políticas actuales, el calentamiento de este siglo sería de unos 2,8 °C; si se cumplieran todas las NDC, de 2,3 a 2,5 °C. Para alinearse con París, las emisiones de 2035 tendrían que ser un 35 % menores que las de 2019 para 2 °C, y un 55 % menores para 1,5 °C.',
        'El informe también advierte que es probable que el calentamiento supere 1,5 °C dentro de la próxima década: el desafío pasa a ser que ese exceso sea lo más chico y breve posible.',
      ], {
        datos: tabla('Calentamiento proyectado para este siglo', ['Escenario', 'Calentamiento'], [
          ['Políticas actuales', '≈ 2,8 °C'],
          ['Se cumplen todas las NDC', '2,3 a 2,5 °C'],
          ['Objetivo de París', 'muy por debajo de 2 °C, buscando 1,5 °C'],
        ], 'PNUMA, Informe sobre la Brecha de Emisiones 2025.'),
      }),
      est('Estimá cuánto se calentaría el planeta en este siglo con las políticas actuales, según el PNUMA.', 2.8, { min: 1, max: 5, paso: 0.1, unidad: '°C' }, 'Unos 2,8 °C según el informe de 2025: muy lejos del objetivo de París.', { d: 2 }),
      num('Las emisiones de 2024 fueron 57,7 GtCO₂e, un 2,3 % más que en 2023. ¿Cuánto fueron las de 2023? Redondeá a un decimal.', 56.4, 'GtCO₂e', '57,7 ÷ 1,023 ≈ 56,4 GtCO₂e. Para volver atrás desde un aumento porcentual se divide, no se resta el porcentaje.', { ctx: '57,7 GtCO₂e en 2024; 2,3 % más que en 2023.', dec: 1, tol: 0.1, d: 3 }),
      numv(3, (i) => { // e4
        const [base, recorte] = [[100, 55], [400, 55], [200, 35]][i];
        return {
          enunciado: `Un país emitía ${base} MtCO₂e en 2019. Para alinearse con ${recorte === 55 ? '1,5 °C' : '2 °C'}, sus emisiones de 2035 deberían ser un ${recorte} % menores. ¿Cuánto debería emitir en 2035?`,
          valor: base * (100 - recorte) / 100,
          unidad: 'MtCO₂e',
          explicacion: `${base} × ${100 - recorte} % = ${base * (100 - recorte) / 100} MtCO₂e. Es el recorte promedio que calcula el PNUMA para el mundo; cada país discute cuál es su parte justa.`,
          ctx: `${base} MtCO₂e en 2019; recorte del ${recorte} %.`,
        };
      }, { d: 1 }),
      op('¿Qué mide la "brecha de emisiones"?', [ // e5
        'La distancia entre las emisiones previstas y las necesarias',
        'La diferencia de emisiones entre países ricos y pobres',
        ['El agujero de la capa de ozono sobre la Antártida', 'Es otro problema ambiental, distinto del cambio climático.'],
        'Las emisiones que los países se olvidan de informar',
      ], 'Cerrar la brecha exige metas más ambiciosas y, sobre todo, cumplirlas.', { d: 2 }),
      mult('¿Qué hace más creíble la NDC de un país? Marcá todo.', [ // e6
        '+Metas con números claros y año de cumplimiento',
        '+Planes por sector con presupuesto',
        '+Informes de avance transparentes',
        '+Leyes que la respalden',
        '-Anunciarla sin ningún plan para cumplirla',
      ], 'Una meta vale por los planes, las leyes y la transparencia que la sostienen.', { d: 1 }),
      det('Leé este resumen de una COP y marcá lo equivocado.', [ // e7
        ['Cada país debe presentar una nueva NDC cada cinco años.', false],
        ['El Acuerdo de París multa a los países que no cumplen su meta.', true, 'No hay multas: funciona con transparencia y presión entre pares.'],
        ['El primer balance mundial pidió triplicar la capacidad renovable para 2030.', false],
        ['Si se cumplen todas las NDC, el calentamiento quedaría por debajo de 1,5 °C.', true, 'Según el PNUMA, aun así sería de 2,3 a 2,5 °C.'],
      ], 'Conocer las reglas y los números ayuda a leer las noticias de cada COP.', { d: 2 }),
      comp('Completá.', 'Las metas de cada país en el Acuerdo de París se llaman [NDC]; cada una debe presentarse cada [cinco] años; y la distancia entre lo prometido y lo necesario es la [brecha] de emisiones.', ['ODS', 'diez', 'deuda'], 'Tres conceptos para seguir las negociaciones climáticas.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Cómo leer una meta', 'Año base, tope, intensidad y escenario tendencial: la misma palabra "reducir" puede esconder cosas muy distintas.', [
      teoria('Cuatro tipos de metas', [
        'Una meta respecto de un año base promete reducir un porcentaje frente a las emisiones de un año pasado, como la Unión Europea, que se propuso bajar al menos un 55 % sus emisiones netas para 2030 respecto de 1990. Una meta de tope fija una cantidad máxima de emisiones para un año. Una meta de intensidad promete reducir las emisiones por cada unidad de producción o de PBI. Y una meta respecto de un escenario tendencial promete emitir menos de lo que se emitiría "si no se hiciera nada", un escenario que el propio país calcula.',
      ]),
      par('Uní cada tipo de meta con un ejemplo.', [ // e1
        ['Respecto de un año base', 'Bajar un 55 % respecto de 1990'],
        ['Tope absoluto', 'No superar 375 MtCO₂e en 2030'],
        ['De intensidad', 'Bajar un 40 % las emisiones por cada dólar de PBI'],
        ['Respecto de un escenario tendencial', 'Emitir un 20 % menos que si no se hiciera nada'],
      ], 'Antes de aplaudir o criticar una meta, hay que saber de qué tipo es.', { d: 2 }),
      numv(3, (i) => { // e2
        const [base, recorte] = [[80, 50], [120, 40], [60, 30]][i];
        return {
          enunciado: `Un país emitía ${base} MtCO₂e en su año base y promete reducir un ${recorte} % respecto de ese año. ¿Cuánto podrá emitir como máximo en el año de la meta?`,
          valor: base * (100 - recorte) / 100,
          unidad: 'MtCO₂e',
          explicacion: `${base} × ${100 - recorte} % = ${base * (100 - recorte) / 100} MtCO₂e. Las metas con año base son fáciles de verificar: el número final queda fijo.`,
          ctx: `${base} MtCO₂e en el año base; reducción del ${recorte} %.`,
        };
      }, { d: 1 }),
      teoria('Intensidad y escenarios: la letra chica', [
        'Una meta de intensidad puede cumplirse aunque las emisiones totales suban, si la economía crece más rápido de lo que baja la intensidad. Y una meta respecto de un escenario tendencial depende de cómo se calcule ese escenario: si se lo infla, se puede "reducir" y a la vez emitir más que hoy. No son metas malas en sí mismas, pero hay que hacer la cuenta para saber qué significan en toneladas.',
      ]),
      numv(3, (i) => { // e3
        const [inten, pbi] = [[40, 60], [30, 50], [20, 30]][i];
        const final = Math.round((100 - inten) * (100 + pbi) / 100);
        return {
          enunciado: `Un país promete bajar un ${inten} % la intensidad de sus emisiones (por unidad de PBI). Si su economía crece un ${pbi} % en el mismo período, ¿qué porcentaje de las emisiones iniciales emitirá al final?`,
          valor: final,
          unidad: '% de las emisiones iniciales',
          explicacion: `${(100 - inten) / 100} × ${(100 + pbi) / 100} = ${(final / 100).toLocaleString('es-AR')}, o sea el ${final} % de las emisiones iniciales. ${final > 100 ? 'Cumple la meta y aun así emite más que al principio.' : 'Las emisiones bajan, pero mucho menos que lo que sugiere el porcentaje de la meta.'}`,
          ctx: `Intensidad −${inten} %; economía +${pbi} %.`,
        };
      }, { d: 3 }),
      numv(3, (i) => { // e4
        const [bau, hoy, red] = [[500, 300, 30], [400, 250, 25], [600, 380, 30]][i];
        const meta = bau * (100 - red) / 100;
        return {
          enunciado: `Un país emite hoy ${hoy} MtCO₂e. Promete emitir en 2030 un ${red} % menos que su escenario tendencial, que calcula en ${bau} MtCO₂e. ¿Cuánto podrá emitir en 2030 si cumple?`,
          valor: meta,
          unidad: 'MtCO₂e',
          explicacion: `${bau} × ${100 - red} % = ${meta} MtCO₂e, que es ${meta - hoy} MtCO₂e más de lo que emite hoy: "reduce" frente a su escenario, pero sus emisiones reales crecen.`,
          ctx: `Hoy ${hoy}; escenario tendencial ${bau}; reducción del ${red} %.`,
        };
      }, { d: 3 }),
      vf('Una meta de intensidad garantiza que las emisiones totales de un país bajen.', false, 'Si la economía crece más rápido de lo que baja la intensidad, las emisiones totales suben aunque se cumpla la meta.', {
        razones: ['+Porque si la economía crece rápido, las emisiones totales pueden subir', '-Porque la intensidad no tiene relación con las emisiones', '-Porque las metas de intensidad son ilegales'],
        d: 2,
      }),
      rank('Un país emite hoy 100, en 1990 emitía 80 y su escenario tendencial para 2035 es 130. Ordená estas metas para 2035 de la más ambiciosa a la menos.', [ // e5
        ['Reducir un 50 % respecto de 1990', 'emite 40'],
        ['No superar 60', 'emite 60'],
        ['Reducir un 30 % respecto de hoy', 'emite 70'],
        ['Reducir un 30 % respecto del escenario tendencial', 'emite 91'],
      ], 'Traducir cada meta a toneladas es la única forma justa de compararlas: 40, 60, 70 y 91.', { d: 3, extremos: ['Más ambiciosa', 'Menos ambiciosa'] }),
      op('¿Por qué un gobierno podría elegir como año base uno con emisiones muy altas?', [ // e6
        'Porque así cualquier reducción parece más grande',
        'Porque es obligatorio usar el año de mayores emisiones',
        ['Porque los años con emisiones altas no se pueden medir', 'Se pueden medir; el problema es cómo se usan para comparar.'],
        'Porque así la meta se vuelve más exigente de cumplir',
      ], 'El año base cambia cuánto "cuesta" cumplir: conviene mirar siempre respecto de qué se mide.', { d: 2 }),
      mult('Ante una meta climática, ¿qué conviene preguntar? Marcá todo.', [ // e7
        '+¿Respecto de qué año o escenario se mide?',
        '+¿Qué gases y sectores cubre?',
        '+¿Es una meta neta o bruta?',
        '+¿Depende de recibir financiamiento externo?',
        '-¿De qué color es el logo del plan?',
      ], 'Cuatro preguntas que convierten un titular en un número verificable.', { d: 1 }),
      clas('¿Hace más transparente la meta o es letra chica que conviene revisar?', { // e8
        'Más transparente': ['Tope absoluto en toneladas', 'Cobertura de todos los gases y sectores', 'Informes anuales verificables'],
        'Letra chica': ['Escenario tendencial calculado por el mismo país', 'Año base con emisiones excepcionales', 'Uso ilimitado de bonos de otros países'],
      }, 'La transparencia permite que cualquiera controle si la meta se cumple.', { d: 2 }),
      det('Leé este anuncio de un gobierno y marcá lo que conviene revisar.', [ // e9
        ['Nuestra meta cubre todos los gases de efecto invernadero.', false],
        ['Reduciremos un 40 % respecto de lo que emitiríamos si no hiciéramos nada.', true, 'Depende de cómo se calcule ese escenario: puede permitir emitir más que hoy.'],
        ['Publicaremos un inventario de emisiones cada dos años.', false],
        ['Bajaremos la intensidad un 30 %, así que nuestras emisiones totales bajarán un 30 %.', true, 'Si la economía crece, las emisiones totales bajan menos o incluso suben.'],
      ], 'Un anuncio claro dice cuántas toneladas se emitirán; lo demás hay que traducirlo.', { d: 3 }),
      comp('Completá.', 'Una meta que fija una cantidad máxima de emisiones es un [tope]; una meta por unidad de PBI es de [intensidad]; y la que compara con lo que pasaría "si no se hiciera nada" usa un escenario [tendencial].', ['piso', 'eficacia', 'ideal'], 'Tres tipos de metas para leer con ojo crítico.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Cero neto y bonos de carbono', 'Absorciones, compensaciones y promesas de empresas: cuándo cero neto significa algo y cuándo es greenwashing.', [
      teoria('Qué es cero neto', [
        'Llegar a cero neto significa que las emisiones que queden se equilibran con absorciones: CO₂ que se saca de la atmósfera y se guarda, por ejemplo en bosques que crecen, en suelos o en formaciones geológicas. Las absorciones tienen que ser duraderas: un bosque que se incendia devuelve su carbono al aire. Por eso cero neto no es "seguir igual y plantar árboles": primero hay que reducir casi todas las emisiones, y dejar las absorciones para lo que no se puede evitar.',
      ]),
      clas('¿Esta acción reduce emisiones propias, compensa o remueve CO₂?', { // e1
        'Reduce emisiones propias': ['Cambiar la flota de camiones por eléctricos', 'Instalar paneles solares en la planta'],
        'Compensa con bonos': ['Comprar bonos de un parque eólico en otro país', 'Pagar por la conservación de un bosque lejano'],
        'Remueve CO₂': ['Restaurar un bosque que vuelve a crecer', 'Aumentar el carbono del suelo con cultivos de cobertura'],
      }, 'Reducir es lo primero; compensar y remover sirven para lo que queda.', { d: 2 }),
      teoria('Bonos de carbono', [
        'Un bono de carbono representa una tonelada de CO₂e reducida o removida por un proyecto, que alguien compra para compensar sus propias emisiones. Para que valga tiene que cumplir varias condiciones: adicionalidad (la reducción no habría ocurrido sin el proyecto), permanencia (el carbono queda guardado mucho tiempo), sin fugas (la deforestación no se muda a otro lugar), medición verificable y sin doble conteo.',
        'No siempre se cumplen. Un estudio publicado en Science en 2023 analizó 26 proyectos de conservación de bosques que vendían bonos y encontró que la mayoría no redujo la deforestación de forma significativa, y que los que sí lo hicieron la redujeron mucho menos de lo declarado.',
      ]),
      par('Uní cada condición de un bono de calidad con la pregunta que responde.', [ // e2
        ['Adicionalidad', '¿Habría pasado igual sin el proyecto?'],
        ['Permanencia', '¿Cuánto tiempo queda guardado el carbono?'],
        ['Fuga', '¿La deforestación se mudó a otro lado?'],
        ['Doble conteo', '¿Alguien más reclama la misma tonelada?'],
      ], 'Si una de estas respuestas falla, la tonelada compensada puede no existir.', { d: 2 }),
      cad('Armá la cadena de por qué un bono sin adicionalidad perjudica al clima.', [ // e3
        'Una empresa compra bonos de un bosque que nadie iba a talar',
        'El proyecto no evita ninguna emisión',
        'La empresa sigue emitiendo y declara que compensó',
        'Las emisiones reales no bajan',
        'Llega a la atmósfera más CO₂ del que se declara',
      ], ['El bono convierte al bosque en un sumidero nuevo'], 'Un bono sin adicionalidad es una tonelada de papel: tranquiliza, pero no enfría.', { d: 2 }),
      numv(3, (i) => { // e4
        const [emis, red] = [[10000, 30], [5000, 60], [8000, 25]][i];
        const bonos = emis * (100 - red) / 100;
        return {
          enunciado: `Una empresa emite ${emis.toLocaleString('es-AR')} tCO₂e por año. Reduce sus emisiones un ${red} % y quiere compensar el resto con bonos. ¿Cuántos bonos de una tonelada necesita por año?`,
          valor: bonos,
          unidad: 'bonos',
          explicacion: `${emis.toLocaleString('es-AR')} × ${100 - red} % = ${bonos.toLocaleString('es-AR')} bonos. Cuanto más reduce primero, menos depende de la calidad de los bonos.`,
          ctx: `${emis} tCO₂e por año; reducción del ${red} %.`,
        };
      }, { d: 1 }),
      numv(3, (i) => { // e5
        const [bonos, malos] = [[7000, 40], [2000, 50], [6000, 30]][i];
        return {
          enunciado: `Una empresa compra ${bonos.toLocaleString('es-AR')} bonos para "compensar" sus emisiones. Si el ${malos} % de esos bonos no tiene adicionalidad, ¿cuántas toneladas siguen sin compensar en realidad?`,
          valor: bonos * malos / 100,
          unidad: 'tCO₂e',
          explicacion: `${bonos.toLocaleString('es-AR')} × ${malos} % = ${(bonos * malos / 100).toLocaleString('es-AR')} tCO₂e que la empresa declara compensadas, pero que llegan igual a la atmósfera. Valores de ejemplo.`,
          ctx: `${bonos} bonos; ${malos} % sin adicionalidad.`,
        };
      }, { d: 2 }),
      op('¿Qué encontró el estudio de 2023 sobre 26 proyectos de bonos por conservar bosques?', [ // e6
        'Que la mayoría no redujo la deforestación de forma clara',
        'Que todos redujeron más deforestación de la declarada',
        ['Que los bosques protegidos emiten más CO₂ que las ciudades', 'El estudio no midió eso; comparó la deforestación real con la declarada.'],
        'Que los bonos de bosques están prohibidos en todo el mundo',
      ], 'Por eso los bonos de conservación necesitan líneas de base más rigurosas y controles independientes.', { d: 2 }),
      teoria('Promesas creíbles', [
        'En 2022, un grupo de expertos convocado por el Secretario General de la ONU publicó recomendaciones para las promesas de cero neto de empresas, ciudades y regiones. Entre ellas: fijar metas intermedias para 2025, 2030 y 2035; no declararse en camino al cero neto mientras se invierte en nueva oferta de combustibles fósiles; no usar bonos baratos en lugar de reducir las propias emisiones; y publicar datos verificables de avance.',
      ]),
      ord('Ordená los pasos de una estrategia de cero neto creíble para una empresa.', [ // e7
        'Medir todas sus emisiones, incluida la cadena de valor',
        'Fijar metas intermedias y de largo plazo',
        'Reducir las emisiones propias lo más posible',
        'Compensar solo lo residual con bonos de alta calidad',
        'Publicar los avances cada año',
      ], 'Primero medir y reducir; los bonos, al final y para lo que no se puede evitar.', { d: 2 }),
      vf('Una empresa puede declararse en camino al cero neto aunque siga invirtiendo en nuevos yacimientos de petróleo, si compra suficientes bonos.', false, 'Según las recomendaciones del grupo de expertos de la ONU, no se puede declarar cero neto mientras se construye o invierte en nueva oferta de combustibles fósiles.', {
        razones: ['+Porque invertir en nueva oferta fósil contradice el cero neto', '-Porque los bonos están prohibidos para las empresas', '-Porque las petroleras no emiten gases de efecto invernadero'],
        d: 2,
      }),
      det('Leé esta publicidad de una aerolínea y marcá lo que es greenwashing o merece dudas.', [ // e8
        ['Medimos las emisiones de todos nuestros vuelos y las publicamos.', false],
        ['Volá con nosotros: tu vuelo es 100 % carbono neutral gracias a nuestros bonos.', true, 'Depende de la calidad de los bonos y no reduce las emisiones del vuelo.'],
        ['Renovamos la flota con aviones que consumen menos combustible.', false],
        ['Seremos cero neto en 2050, sin metas intermedias.', true, 'Sin metas intermedias no hay forma de controlar el avance.'],
      ], 'Las reducciones reales y verificables valen más que cualquier etiqueta de "neutral".', { d: 2 }),
      mult('¿Qué señales muestran que una promesa de cero neto es seria? Marcá todas.', [ // e9
        '+Metas intermedias con fechas cercanas',
        '+Reducciones propias como prioridad',
        '+Datos publicados y verificados por terceros',
        '+Ninguna nueva inversión en combustibles fósiles',
        '-Compensar todo con los bonos más baratos del mercado',
      ], 'Las mismas preguntas del greenwashing que viste en consumo, aplicadas al clima.', { d: 1 }),
      comp('Completá.', 'Una tonelada reducida por un proyecto que se vende para compensar es un [bono] de carbono; si la reducción no habría ocurrido sin el proyecto, cumple la [adicionalidad]; y si el carbono queda guardado mucho tiempo, cumple la [permanencia].', ['impuesto', 'legalidad', 'visibilidad'], 'Tres palabras para evaluar cualquier compensación.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Argentina y sus compromisos', 'La ley de cambio climático, la estrategia a 2050, la tercera NDC y cómo leer sus números.', [
      teoria('El marco', [
        'En 2019, la ley 27.520 fijó los presupuestos mínimos de adaptación y mitigación al cambio climático global. Creó el Gabinete Nacional de Cambio Climático, que coordina a los distintos organismos, y ordenó elaborar un Plan Nacional de Adaptación y Mitigación y planes de respuesta en cada provincia. En 2022, Argentina presentó ante la ONU su estrategia de largo plazo, con el objetivo de llegar a la neutralidad de emisiones en 2050.',
      ]),
      par('Uní cada instrumento con su contenido.', [ // e1
        ['Ley 27.520', 'Marco legal y Gabinete Nacional de Cambio Climático'],
        ['NDC', 'Meta de emisiones para 2030 y 2035'],
        ['Estrategia de largo plazo', 'Camino hacia la neutralidad en 2050'],
        ['Plan Nacional de Adaptación y Mitigación', 'Medidas concretas por sector'],
      ], 'Ley, estrategia, meta y plan: cuatro piezas que tienen que encajar entre sí.', { d: 2 }),
      est('¿Para qué año se propuso Argentina alcanzar la neutralidad de emisiones en su estrategia de largo plazo?', 2050, { min: 2030, max: 2100, paso: 5, unidad: '' }, 'Para 2050, según la estrategia presentada en 2022: el mismo horizonte que muchos otros países.', { d: 1 }),
      teoria('La tercera NDC', [
        'En noviembre de 2025, durante la COP30, Argentina presentó su tercera NDC: emisiones netas que no superen los 375 MtCO₂e en 2030 y en 2035. La meta anterior era de 349 MtCO₂e para 2030. Pero la forma de contar cambió: según el gobierno, el nuevo inventario cubre más territorio (del 65 % al 79 %), incluye más categorías de emisiones (162 en lugar de 146) y usa otros coeficientes del IPCC para comparar gases. El gobierno sostiene que, con esa metodología, la meta es más completa y exigente; otros análisis señalan que el número es más alto. Para comparar metas en serio, hay que contar las dos con la misma regla.',
        'Evaluaciones independientes como Climate Action Tracker califican en 2026 la política climática argentina como "altamente insuficiente".',
      ]),
      num('¿En qué porcentaje es mayor la meta de 375 MtCO₂e respecto de la anterior de 349 MtCO₂e? Redondeá a un decimal.', 7.4, '%', '(375 − 349) ÷ 349 × 100 ≈ 7,4 %. Pero como cambió la forma de contar, este porcentaje no dice por sí solo si la meta es más o menos ambiciosa.', { ctx: 'Meta nueva de 375 MtCO₂e; meta anterior de 349 MtCO₂e.', dec: 1, tol: 0.1, d: 2 }),
      op('¿Por qué no alcanza con comparar 375 con 349 para saber si la meta es más o menos ambiciosa?', [ // e2
        'Porque cambió la forma de contar las emisiones',
        'Porque los números de las NDC son siempre secretos',
        ['Porque 375 es menor que 349', 'Es mayor; el punto es que se contaron distinto.'],
        'Porque las metas se miden en dinero y no en toneladas',
      ], 'Es el mismo cuidado que al comparar gráficos con escalas distintas: primero, la misma regla.', { d: 2 }),
      numv(3, (i) => { // e3
        const [meta, pob] = [[375, 47], [349, 47], [375, 50]][i];
        const pc = Math.round((meta / pob) * 10) / 10;
        return {
          enunciado: `Si Argentina emitiera ${meta} MtCO₂e con una población de ${pob} millones de personas, ¿cuántas toneladas por persona serían? Redondeá a un decimal.`,
          valor: pc,
          unidad: 'tCO₂e por persona',
          dec: 1,
          tol: 0.1,
          explicacion: `${meta} ÷ ${pob} ≈ ${pc.toLocaleString('es-AR')} tCO₂e por persona. Los millones se cancelan: millones de toneladas sobre millones de personas.`,
          ctx: `${meta} MtCO₂e; ${pob} millones de habitantes.`,
        };
      }, { d: 2 }),
      teoria('De la meta al inventario', [
        'Según el Inventario Nacional, cerca de la mitad de las emisiones argentinas viene de la energía y casi el 40 % de la agricultura, la ganadería y los cambios de uso de la tierra, incluidos los desmontes. Una meta nacional se cumple solo si se traduce en planes por sector, normas y presupuestos, y en cambios concretos de empresas, provincias y personas. El inventario, que se actualiza periódicamente, es la herramienta para comprobar si las emisiones realmente bajan.',
      ]),
      clas('¿En qué sector del inventario reduciría emisiones cada medida?', { // e4
        'Energía': ['Más renovables en la red eléctrica', 'Eficiencia energética en industrias', 'Colectivos eléctricos'],
        'Agro y usos de la tierra': ['Frenar los desmontes ilegales', 'Mejorar la eficiencia de la ganadería', 'Restaurar bosques nativos'],
      }, 'Los dos grandes sectores del país necesitan medidas propias.', { d: 1 }),
      cad('Armá la cadena de cómo una NDC se vuelve una reducción real.', [ // e5
        'Se fija una meta nacional de emisiones',
        'Se traduce en planes por sector',
        'Se aprueban normas y presupuestos',
        'Empresas, provincias y personas cambian prácticas',
        'El inventario muestra que las emisiones bajan',
      ], ['Anunciar la meta reduce las emisiones por sí solo'], 'Entre la meta y la tonelada evitada hay una cadena larga de decisiones.', { d: 2 }),
      vf('Como Argentina emite menos del 1 % del total mundial, no tiene compromisos bajo el Acuerdo de París.', false, 'Todos los países que forman parte del acuerdo presentan NDC y deben informar sus emisiones y avances, más allá de su tamaño.', {
        razones: ['+Porque todos los países del acuerdo presentan NDC e informan avances', '-Porque solo los países que emiten más del 10 % tienen metas', '-Porque el Acuerdo de París solo incluye a Europa'],
        d: 1,
      }),
      mult('¿Qué debería tener el plan de respuesta climática de una provincia? Marcá todo.', [ // e6
        '+Un inventario de sus emisiones',
        '+Medidas de adaptación a sus propios riesgos',
        '+Participación de la ciudadanía',
        '+Metas y un sistema de seguimiento',
        '-Copiar el plan de otra provincia sin adaptarlo',
      ], 'Cada provincia tiene su propio perfil de emisiones y de riesgos: el plan tiene que ser a medida.', { d: 1 }),
      det('Leé este comentario en un debate y marcá lo equivocado.', [ // e7
        ['La ley 27.520 creó el Gabinete Nacional de Cambio Climático.', false],
        ['La nueva meta es de 375 MtCO₂e, así que seguro es menos ambiciosa.', true, 'Cambió la forma de contar: hay que comparar con la misma metodología.'],
        ['Cerca de la mitad de las emisiones del país viene de la energía.', false],
        ['Con presentar la NDC ya está: no hace falta seguir midiendo.', true, 'El inventario es lo que permite comprobar si la meta se cumple.'],
      ], 'Debatir con datos exige leer bien las metas y seguir midiendo.', { d: 2 }),
      comp('Completá.', 'La ley argentina de cambio climático es la [27.520]; la estrategia de largo plazo apunta a la neutralidad en [2050]; y la tercera NDC fija un máximo de [375] MtCO₂e.', ['25.675', '2030', '349'], 'Tres números para seguir la política climática argentina.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: metas climáticas', 'Presupuesto de carbono, NDC, tipos de metas, cero neto y los compromisos de Argentina, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: la meta de Villa Ribera', 'Villa Ribera ya tiene su plan de adaptación. Ahora el concejo discute qué meta de emisiones fijar para 2035. Evaluá las propuestas con los números.', [
      teoria('La situación', [
        'Villa Ribera emitía 200.000 toneladas de CO₂e (200 kt) en 2019 y hoy emite 220 kt. Su inventario muestra que el 45 % viene del transporte, el 35 % de la energía de los edificios y el 20 % de los residuos. Hay dos propuestas para 2035. La A: "reducir un 30 % respecto del escenario tendencial", que el municipio calcula en 330 kt. La B: "reducir un 45 % respecto de 2019". Un concejal propone además cumplir comprando bonos baratos de un bosque que no está amenazado.',
      ]),
      num('¿Cuántas kt podría emitir la ciudad en 2035 con la propuesta A?', 231, 'kt CO₂e', '330 × 70 % = 231 kt: más que las 220 kt de hoy. La ciudad "reduciría" y a la vez emitiría más.', { ctx: 'Escenario tendencial de 330 kt; reducción del 30 %.', d: 2 }),
      num('¿Cuántas kt podría emitir la ciudad en 2035 con la propuesta B?', 110, 'kt CO₂e', '200 × 55 % = 110 kt: la mitad de lo que emite hoy.', { ctx: '200 kt en 2019; reducción del 45 %.', d: 1 }),
      op('¿Qué propuesta es más ambiciosa y por qué?', [ // e3
        'La B: en toneladas permite emitir mucho menos',
        'La A: el 30 % es un número más fácil de cumplir',
        ['Son iguales, porque las dos dicen "reducir"', 'En toneladas, una permite 231 kt y la otra 110 kt.'],
        'La A: el escenario tendencial es siempre la mejor base',
      ], 'Traducidas a toneladas, la diferencia es enorme: 231 kt frente a 110 kt.', { d: 2 }),
      num('Para pasar de 220 kt a 110 kt en diez años bajando lo mismo cada año, ¿cuántas kt hay que reducir por año?', 11, 'kt por año', '(220 − 110) ÷ 10 = 11 kt por año: una trayectoria clara que permite fijar metas intermedias.', { ctx: 'De 220 kt a 110 kt en diez años.', d: 1 }),
      clas('¿A qué sector del inventario apunta cada medida?', { // e5
        'Transporte': ['Carriles exclusivos para colectivos', 'Red de ciclovías'],
        'Energía de los edificios': ['Aislar escuelas y edificios públicos', 'Paneles solares en techos'],
        'Residuos': ['Compostaje de restos de comida', 'Captura de metano en el relleno'],
      }, 'Con el inventario, la ciudad sabe dónde está cada tonelada y qué medida la ataca.', { d: 1 }),
      ord('Ordená los pasos para que la meta sea creíble.', [ // e6
        'Aprobar la meta en toneladas para 2035',
        'Fijar metas intermedias cada dos o tres años',
        'Asignar medidas y presupuesto por sector',
        'Actualizar el inventario y publicar los avances',
        'Ajustar las medidas según los resultados',
      ], 'Meta clara, escalones intermedios, recursos y medición: sin eso, una meta es solo un anuncio.', { d: 3 }),
      det('El concejal redacta su propuesta. Marcá lo que conviene corregir.', [ // e7
        ['Publicaremos el inventario de emisiones cada dos años.', false],
        ['Cumpliremos la meta comprando bonos de un bosque que nadie planeaba talar.', true, 'Sin adicionalidad, esos bonos no compensan nada.'],
        ['Priorizaremos el transporte, que es el 45 % de las emisiones.', false],
        ['Usaremos un escenario tendencial de 330 kt porque así la meta es fácil de cumplir.', true, 'Una meta fácil de cumplir puede permitir emitir más que hoy.'],
      ], 'Una meta seria se mide en toneladas reales, se reduce primero y se controla en público.', { d: 3 }),
    ]),
  ],
});
