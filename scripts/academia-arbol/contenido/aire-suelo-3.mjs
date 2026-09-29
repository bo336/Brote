import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// AIRE Y SUELO 3 — El efecto invernadero.
// Cómo el aire retiene calor, cuánto subió el CO₂ y cómo sabemos que viene de
// los combustibles fósiles, los otros gases y cuánto se calentó el planeta.
// Retoma la composición del aire (aire-suelo-1), el suelo como depósito de
// carbono (aire-suelo-2), el CO₂ equivalente (tronco-2) y el ciclo del
// carbono (tronco-1).

export default unidad({
  slug: 'aire-suelo-3',
  rama: 'aire_suelo',
  orden: 3,
  nivel: 2,
  requiereTronco: 2,
  titulo: 'El efecto invernadero',
  bajada: 'Por qué la Tierra no es una bola de hielo, cuánto subió el CO₂, cómo sabemos que viene de los combustibles fósiles y cuánto se calentó el planeta.',
  objetivos: [
    'Explicar cómo los gases de efecto invernadero retienen calor',
    'Leer la curva del CO₂ y compararla con los últimos 800.000 años',
    'Justificar con evidencia que el CO₂ extra viene de los combustibles fósiles',
    'Comparar metano, óxido nitroso y CO₂ por su efecto y duración',
    'Distinguir tiempo y clima, y reconocer las huellas del calentamiento humano',
  ],
  repasa: ['aire-suelo-1', 'aire-suelo-2', 'tronco-2', 'tronco-1'],
  fuentes: ['nasa-evidencia', 'noaa-co2', 'noaa-co2-historia', 'global-carbon-budget', 'ipcc-ar6', 'nasa-gistemp', 'copernicus-clima-2024', 'wmo-clima-2024', 'inventario-gei-ar', 'consenso-cook-2016'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('La manta del planeta', 'La luz del sol entra, el calor sale con dificultad: cómo funciona el efecto invernadero natural.', [
      teoria('Luz que entra, calor que sale', [
        'La luz del sol atraviesa casi sin obstáculos la atmósfera y calienta la superficie de la Tierra. La superficie caliente, a su vez, emite energía hacia el espacio, pero no como luz visible sino como radiación infrarroja, la misma que sentís cerca de una estufa sin tocarla.',
        'Algunos gases de la atmósfera absorben esa radiación infrarroja y la vuelven a emitir en todas las direcciones, una parte de nuevo hacia la superficie. Así, la Tierra pierde calor más despacio y se mantiene más templada. Eso es el efecto invernadero.',
      ]),
      cad('Armá la cadena del efecto invernadero.', [ // e1
        'La luz del sol atraviesa la atmósfera',
        'La superficie de la Tierra se calienta',
        'La superficie emite radiación infrarroja',
        'Los gases de efecto invernadero la absorben',
        'Reemiten parte de esa energía hacia la superficie',
      ], ['Los gases reflejan la luz del sol hacia el espacio'], 'La clave está en que la atmósfera deja pasar la luz, pero frena la salida del infrarrojo.', { d: 2 }),
      teoria('Un efecto natural y necesario', [
        'Sin efecto invernadero, la temperatura media de la Tierra sería de unos −18 °C: un planeta congelado. Con él, es de unos +15 °C. El problema no es el efecto invernadero en sí, sino que lo estamos intensificando al agregar gases a la atmósfera.',
      ], { destacado: { valor: '−18 °C', texto: 'sería la temperatura media de la Tierra sin el efecto invernadero natural. Hoy es de unos +15 °C.' } }),
      num('Si sin efecto invernadero la temperatura media sería de −18 °C y hoy es de +15 °C, ¿cuántos grados aporta el efecto invernadero natural?', 33, '°C', 'De −18 a +15 hay 33 grados. Ese es el aporte del efecto invernadero natural: sin él, no habría agua líquida en la mayor parte del planeta.', { ctx: 'Sin efecto invernadero −18 °C; con él, +15 °C.', d: 2 }),
      vf('El efecto invernadero es algo malo que hay que eliminar.', false, 'El efecto invernadero natural hace habitable la Tierra. El problema es intensificarlo agregando gases, que es lo que hacemos al quemar combustibles fósiles y desmontar.', { // e3
        razones: ['+Porque el efecto natural hace habitable el planeta', '-Porque el efecto invernadero no existe', '-Porque solo ocurre dentro de los invernaderos'],
        d: 1,
      }),
      teoria('Qué gases lo producen', [
        'Los gases de efecto invernadero principales son el vapor de agua, el dióxido de carbono (CO₂), el metano (CH₄), el óxido nitroso (N₂O) y los gases fluorados, que son industriales. El nitrógeno y el oxígeno, que forman el 99 % del aire seco, no absorben radiación infrarroja: no son gases de efecto invernadero.',
        'Un gas puede ser muy escaso y tener un gran efecto: el CO₂ es apenas un 0,04 % del aire, pero es clave para el balance de calor.',
      ]),
      clas('¿Es un gas de efecto invernadero o no?', { // e4
        'Gas de efecto invernadero': ['Dióxido de carbono', 'Metano', 'Óxido nitroso', 'Vapor de agua'],
        'No retiene infrarrojo': ['Nitrógeno', 'Oxígeno', 'Argón'],
      }, 'Los gases más abundantes del aire no retienen infrarrojo. Los que sí lo hacen están en proporciones pequeñas.', { d: 2 }),
      op('El CO₂ es solo un 0,04 % del aire. ¿Cómo puede tener tanto efecto?', [ // e5
        'Absorbe el infrarrojo, cosa que el nitrógeno no hace',
        'Porque es un gas tóxico que calienta al respirarlo',
        ['Porque es más pesado y se junta en el suelo', 'Se mezcla en toda la atmósfera; su efecto viene de absorber infrarrojo.'],
        'Porque refleja la luz del sol hacia la Tierra',
      ], 'Que algo sea escaso no quiere decir que no importe: una gota de tinta tiñe un vaso de agua.', { d: 2 }),
      teoria('El vapor de agua, un amplificador', [
        'El vapor de agua es el gas de efecto invernadero que más contribuye al efecto natural. Pero su cantidad depende de la temperatura: el aire más cálido puede contener más vapor. Por eso funciona como un amplificador: si otros gases calientan un poco el planeta, se evapora más agua, y ese vapor extra calienta todavía más. Es una retroalimentación.',
      ]),
      cad('Armá la retroalimentación del vapor de agua.', [ // e6
        'Aumenta el CO₂ en la atmósfera',
        'La temperatura sube un poco',
        'Se evapora más agua y el aire guarda más vapor',
        'El vapor extra retiene más calor',
        'La temperatura sube un poco más',
      ], ['El vapor extra enfría el planeta de inmediato'], 'Una retroalimentación amplifica un cambio inicial. Por eso pequeños aumentos de CO₂ tienen efectos mayores.', { d: 3 }),
      par('Uní cada concepto con su descripción.', [ // e7
        ['Radiación infrarroja', 'Calor que emite la superficie terrestre'],
        ['Gas de efecto invernadero', 'Absorbe y reemite radiación infrarroja'],
        ['Retroalimentación', 'Un cambio que amplifica el cambio inicial'],
        ['Efecto invernadero natural', 'Mantiene la Tierra unos 33 °C más cálida'],
      ], 'Cuatro ideas para explicar el efecto invernadero sin confundirse.', { d: 2 }),
      teoria('¿Por qué "invernadero"?', [
        'El nombre viene de una comparación con los invernaderos de plantas, pero no es exacta: un invernadero se mantiene cálido sobre todo porque sus paredes impiden que el aire caliente se escape y se mezcle con el de afuera. En la atmósfera, en cambio, lo que se frena es la salida de radiación infrarroja. La comparación sirve para empezar, pero conviene conocer el mecanismo real.',
      ]),
      mult('¿Qué afirmaciones sobre el efecto invernadero son correctas? Marcá todas.', [ // e8
        '+Sin él, la Tierra sería mucho más fría',
        '+Lo producen gases que absorben infrarrojo',
        '+El vapor de agua amplifica los cambios',
        '-El nitrógeno es el principal gas de efecto invernadero',
        '-Funciona exactamente igual que un invernadero de plantas',
      ], 'El nitrógeno no retiene infrarrojo, y la comparación con el invernadero de plantas es solo aproximada.', { d: 2 }),
      det('Leé esta explicación de un compañero y marcá lo equivocado.', [ // e9
        ['La luz del sol calienta la superficie de la Tierra.', false],
        ['La Tierra devuelve el calor como luz visible, que los gases atrapan.', true, 'La superficie emite radiación infrarroja, no luz visible.'],
        ['El vapor de agua amplifica el calentamiento.', false],
        ['Como el CO₂ es escaso, no puede cambiar la temperatura.', true, 'Absorbe infrarrojo: pequeñas cantidades tienen un efecto grande.'],
      ], 'Explicar bien el mecanismo ayuda a responder los mitos más comunes.', { d: 2 }),
      est('Estimá qué porcentaje del aire seco es CO₂.', 0.04, { min: 0.001, max: 50, unidad: '%', escala: 'log' }, 'Apenas un 0,04 %, es decir, unas 400 partes por millón. Muy poco en cantidad, pero decisivo para el balance de calor del planeta.', { d: 3 }),
      comp('Completá.', 'La superficie de la Tierra emite radiación [infrarroja]; sin efecto invernadero, la temperatura media sería de unos [−18] °C; y el vapor de agua funciona como un [amplificador].', ['ultravioleta', '+40', 'filtro'], 'Tres ideas centrales para explicar el efecto invernadero natural.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('La curva del CO₂', 'Del hielo antártico a Mauna Loa: cuánto CO₂ hubo en el aire y cuánto hay ahora.', [
      teoria('El archivo del hielo', [
        'En la Antártida, la nieve se acumula año tras año y se convierte en hielo, atrapando pequeñas burbujas de aire. Al perforar el hielo y analizar esas burbujas, se puede medir cuánto CO₂ había en la atmósfera hace cientos de miles de años. Esos registros muestran que, durante los últimos 800.000 años, el CO₂ osciló aproximadamente entre 180 y 300 partes por millón (ppm), subiendo en los períodos cálidos y bajando en las glaciaciones.',
        'Antes de la Revolución Industrial, el CO₂ estaba en unas 280 ppm.',
      ]),
      op('¿Cómo se sabe cuánto CO₂ había en el aire hace 500.000 años?', [ // e1
        'Por burbujas de aire atrapadas en el hielo antártico',
        'Por cálculos a partir de pinturas rupestres antiguas',
        ['Por mediciones de satélites de esa época', 'No había satélites: los primeros son de la década de 1950.'],
        'Por los relatos de los primeros exploradores',
      ], 'El hielo guarda muestras reales de aire antiguo: es un archivo natural de la atmósfera.', { d: 1 }),
      teoria('Mauna Loa', [
        'En 1958, el científico Charles David Keeling empezó a medir el CO₂ en el observatorio de Mauna Loa, en Hawái, lejos de ciudades y fábricas. Encontró unas 315 ppm. La medición siguió sin interrupciones y hoy supera las 420 ppm: la llamada curva de Keeling sube año tras año, con un serrucho estacional.',
        'Es la concentración más alta en al menos 800.000 años, y probablemente en millones de años.',
      ], {
        datos: barras('Concentración de CO₂ en la atmósfera (aproximada)', 'ppm', [
          ['Mínimo de glaciaciones', 180],
          ['Máximo de 800.000 años', 300],
          ['Antes de 1750', 280],
          ['1958 (Mauna Loa)', 315],
          ['2024 (Mauna Loa)', 425],
        ], 'Testigos de hielo y registro de Mauna Loa, NOAA; valores redondeados.'),
      }),
      rank('Ordená estos momentos según la concentración de CO₂, de menor a mayor.', [ // e2
        ['Una glaciación', '≈ 180 ppm'],
        ['Antes de la Revolución Industrial', '≈ 280 ppm'],
        ['Primera medición de Keeling, 1958', '≈ 315 ppm'],
        ['Hoy', 'más de 420 ppm'],
      ], 'El salto de los últimos dos siglos supera todo lo que muestran 800.000 años de hielo.', { d: 2, extremos: ['Menos CO₂', 'Más CO₂'] }),
      ejemplo('¿Cuánto subió?', 'Antes de la Revolución Industrial había unas 280 ppm de CO₂. En 2024, unas 420 ppm.', [
        'El aumento es 420 − 280 = 140 ppm.',
        'En porcentaje: 140 ÷ 280 × 100 = 50 %.',
      ], 'La concentración de CO₂ aumentó alrededor de un 50 % respecto de la era preindustrial.'),
      numv(3, (i) => { // e3
        const hoy = [420, 434, 448][i];
        return {
          enunciado: `Si el CO₂ preindustrial era de 280 ppm y en un año dado llegó a ${hoy} ppm, ¿en qué porcentaje aumentó? Redondeá al entero.`,
          valor: Math.round(((hoy - 280) / 280) * 100),
          unidad: '%',
          tol: 1,
          explicacion: `(${hoy} − 280) ÷ 280 × 100 ≈ ${Math.round(((hoy - 280) / 280) * 100)} %. Cada año que siguen las emisiones, el porcentaje crece.`,
        };
      }, { d: 2 }),
      teoria('El serrucho', [
        'La curva de Keeling no es lisa: cada año sube y baja un poco. En primavera y verano del hemisferio norte, donde hay mucha más tierra con vegetación, las plantas absorben CO₂ al crecer y la concentración baja; en otoño e invierno, las hojas caen, se descomponen y el CO₂ sube. Es la "respiración" del planeta, montada sobre una tendencia que sube.',
      ]),
      op('¿Por qué la curva del CO₂ baja un poco durante el verano del hemisferio norte?', [ // e4
        'Porque la vegetación del norte crece y absorbe CO₂',
        'Porque en verano se usan menos autos en el mundo',
        ['Porque el sol destruye el CO₂ con el calor', 'El calor no destruye el CO₂; lo que cambia es la fotosíntesis.'],
        'Porque en verano el mar libera oxígeno',
      ], 'Hay más superficie de tierra y vegetación en el hemisferio norte, así que su estación marca el ritmo del serrucho.', { d: 2 }),
      numv(3, (i) => { // e5
        const [a1, c1, a2, c2] = [[1958, 315, 2024, 425], [1970, 325, 2020, 413], [1990, 354, 2024, 425]][i];
        return {
          enunciado: `En ${a1} había ${c1} ppm de CO₂ y en ${a2}, ${c2} ppm. ¿Cuántas ppm por año subió en promedio? Redondeá a un decimal.`,
          valor: Math.round(((c2 - c1) / (a2 - a1)) * 10) / 10,
          unidad: 'ppm/año',
          dec: 1,
          tol: 0.1,
          explicacion: `(${c2} − ${c1}) ÷ (${a2} − ${a1}) ≈ ${(Math.round(((c2 - c1) / (a2 - a1)) * 10) / 10).toLocaleString('es-AR')} ppm por año. En los últimos años, el aumento anual ronda las 2 a 3 ppm: el ritmo se aceleró.`,
        };
      }, { d: 3 }),
      est('Estimá cuántas partes por millón (ppm) de CO₂ hay hoy en la atmósfera.', 425, { min: 100, max: 1000, paso: 5, unidad: 'ppm' }, 'Más de 420 ppm, según Mauna Loa. En 1958 eran 315 ppm y antes de la Revolución Industrial, unas 280.', { d: 2 }),
      vf('El CO₂ atmosférico actual está dentro del rango de los últimos 800.000 años.', false, 'En 800.000 años de registros de hielo osciló entre unas 180 y 300 ppm. Hoy supera las 420 ppm: muy por encima del rango.', { // e7
        razones: ['+Porque hoy supera las 420 ppm y el máximo fue unas 300', '-Porque hoy hay menos CO₂ que en las glaciaciones', '-Porque en el pasado nunca hubo CO₂'],
        d: 2,
      }),
      det('Leé este resumen y marcá lo equivocado.', [ // e8
        ['Keeling empezó a medir el CO₂ en Mauna Loa en 1958.', false],
        ['La curva del CO₂ sube de forma perfectamente lisa.', true, 'Tiene un serrucho estacional por la vegetación del hemisferio norte.'],
        ['Los testigos de hielo guardan aire de cientos de miles de años.', false],
        ['El CO₂ preindustrial era de unas 420 ppm.', true, 'Era de unas 280 ppm; 420 es el valor actual.'],
      ], 'Datos precisos para una discusión precisa.', { d: 2 }),
      par('Uní cada valor de CO₂ con su momento.', [ // e9
        ['≈ 180 ppm', 'Glaciaciones'],
        ['≈ 280 ppm', 'Antes de la Revolución Industrial'],
        ['≈ 315 ppm', 'Primera medición en Mauna Loa'],
        ['Más de 420 ppm', 'Hoy'],
      ], 'Estos cuatro números resumen la historia del CO₂.', { d: 2 }),
      ord('Ordená estos momentos de la historia del CO₂, del más antiguo al más reciente.', [ // e11
        'Último máximo glacial, con unas 180 ppm',
        'Comienzo de la Revolución Industrial, con unas 280 ppm',
        'Keeling mide unas 315 ppm en Mauna Loa',
        'El promedio anual supera por primera vez las 400 ppm',
      ], 'En unos 20.000 años el CO₂ pasó de 180 a 280 ppm; en menos de 200 años, de 280 a más de 420.', { d: 2, extremos: ['Más antiguo', 'Más reciente'] }),
      comp('Completá.', 'Antes de la Revolución Industrial había unas [280] ppm de CO₂; hoy hay más de [420]; y la serie de mediciones de Mauna Loa se llama curva de [Keeling].', ['180', '1000', 'Darwin'], 'Los números clave de la historia del CO₂ en la atmósfera.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('De dónde sale el carbono extra', 'Combustibles fósiles, desmontes y la huella química que delata su origen. Y a dónde va lo que emitimos.', [
      teoria('Carbono de hace millones de años', [
        'El carbón, el petróleo y el gas se formaron a partir de restos de seres vivos enterrados durante millones de años. Guardan carbono que salió del ciclo rápido hace muchísimo tiempo. Al quemarlos, en pocas décadas devolvemos a la atmósfera carbono que tardó millones de años en acumularse. A eso se suma el carbono que liberan los desmontes y los incendios de bosques.',
        'Según el Global Carbon Project, la quema de combustibles fósiles emite hoy alrededor de 37.000 millones de toneladas de CO₂ por año, y los cambios en el uso del suelo, unos 4.000 millones más.',
      ]),
      clas('¿Esta actividad agrega carbono a la atmósfera o lo retira?', { // e1
        'Agrega carbono': ['Quemar gas en una central eléctrica', 'Desmontar un bosque y quemar los restos', 'Cargar nafta y manejar'],
        'Retira carbono': ['Un bosque que crece', 'Un suelo que gana materia orgánica', 'El océano absorbiendo CO₂'],
      }, 'El balance entre lo que se emite y lo que se absorbe define cuánto CO₂ queda en el aire.', { d: 1 }),
      est('Estimá cuántos miles de millones de toneladas de CO₂ emite por año la quema de combustibles fósiles en el mundo.', 37, { min: 1, max: 500, unidad: 'miles de millones de t', escala: 'log' }, 'Unos 37.000 millones de toneladas por año, según el Global Carbon Project. Con los cambios de uso del suelo, más de 40.000 millones.', { d: 3 }),
      teoria('La huella química', [
        '¿Cómo sabemos que el CO₂ extra viene de los combustibles fósiles y no, por ejemplo, de los volcanes? El carbono tiene distintas variantes, llamadas isótopos. El carbono de los fósiles, de origen vegetal y muy antiguo, tiene menos carbono-13 y nada de carbono-14, que desaparece con los milenios. Y en la atmósfera, justamente, la proporción de esos isótopos está bajando: es la huella del carbono fósil.',
        'Además, los volcanes emiten, en promedio, menos del 1 % de lo que emiten hoy las actividades humanas.',
      ]),
      cad('Armá el razonamiento que prueba el origen fósil del CO₂ extra.', [ // e2
        'El carbono de los fósiles no tiene carbono-14',
        'Si el CO₂ extra fuera fósil, bajaría la proporción de carbono-14 en el aire',
        'Las mediciones muestran que esa proporción baja',
        'La evidencia apunta a los combustibles fósiles',
      ], ['Los volcanes emiten más CO₂ que toda la actividad humana'], 'Es un razonamiento científico: una predicción que los datos confirman.', { d: 3 }),
      op('Alguien dice que el CO₂ extra viene de los volcanes. ¿Qué dato lo contradice mejor?', [ // e3
        'Los volcanes emiten menos del 1 % que las personas',
        'Los volcanes solo están en la cordillera de los Andes',
        ['Los volcanes emiten solo vapor de agua', 'Emiten CO₂, pero muy poco comparado con la actividad humana.'],
        'Los volcanes se apagaron en el siglo pasado',
      ], 'Los volcanes emiten CO₂, pero muy poco comparado con los combustibles fósiles. Y la huella química confirma el origen fósil.', { d: 2 }),
      teoria('A dónde va lo que emitimos', [
        'No todo el CO₂ que emitimos queda en el aire. En las últimas décadas, alrededor de un cuarto lo absorbieron los océanos, cerca de un tercio la vegetación y los suelos, y el resto —algo menos de la mitad— se acumuló en la atmósfera. Esos sumideros nos ayudan, pero tienen un costo: el océano se acidifica al absorber CO₂, y los bosques absorben menos cuando hay sequías, calor extremo o desmonte.',
      ], {
        datos: barras('Destino del CO₂ emitido por las personas (aproximado)', '%', [
          ['Queda en la atmósfera', 46],
          ['Absorben la vegetación y los suelos', 29],
          ['Absorben los océanos', 25],
        ], 'Global Carbon Budget, promedios de la última década; valores redondeados.'),
      }),
      numv(3, (i) => { // e4
        const em = [40, 42, 38][i];
        return {
          enunciado: `Si en un año se emiten ${em} mil millones de toneladas de CO₂ y queda en la atmósfera el 46 %, ¿cuántos miles de millones de toneladas se acumulan en el aire? Redondeá a un decimal.`,
          valor: Math.round(em * 0.46 * 10) / 10,
          unidad: 'mil millones de t',
          dec: 1,
          tol: 0.1,
          explicacion: `${em} × 0,46 ≈ ${(Math.round(em * 0.46 * 10) / 10).toLocaleString('es-AR')}. El resto lo absorben océanos, vegetación y suelos.`,
        };
      }, { d: 2 }),
      par('Uní cada sumidero con su costo o límite.', [ // e5
        ['Océano', 'Se acidifica al absorber CO₂'],
        ['Bosques', 'Absorben menos con sequías, calor o desmonte'],
        ['Suelos', 'Pierden carbono si se degradan'],
        ['Atmósfera', 'Acumula el CO₂ que nadie absorbe'],
      ], 'Los sumideros ayudan, pero no son ilimitados ni gratuitos.', { d: 2 }),
      vf('Como océanos y bosques absorben CO₂, no importa cuánto emitamos.', false, 'Absorben algo más de la mitad, pero el resto se acumula en el aire. Y los sumideros pueden debilitarse con el calentamiento.', { // e6
        razones: ['+Porque absorben solo una parte y pueden debilitarse', '-Porque los sumideros absorben todo el CO₂', '-Porque los océanos emiten más de lo que absorben'],
        d: 2,
      }),
      mult('¿Qué evidencias muestran que el CO₂ extra es de origen humano? Marcá todas.', [ // e7
        '+Baja la proporción de carbono-14 en el aire',
        '+El aumento coincide con la quema de combustibles',
        '+Las emisiones humanas superan con creces a las volcánicas',
        '-El CO₂ sube solo en las ciudades',
        '-El CO₂ bajó desde 1958',
      ], 'Varias líneas de evidencia independientes apuntan a lo mismo.', { d: 2 }),
      det('Leé este comentario y marcá lo equivocado.', [ // e8
        ['El carbón y el petróleo se formaron durante millones de años.', false],
        ['Todo el CO₂ que emitimos queda en la atmósfera.', true, 'Algo más de la mitad la absorben océanos, vegetación y suelos.'],
        ['El océano se acidifica al absorber CO₂.', false],
        ['Los volcanes emiten más CO₂ que las personas.', true, 'Emiten menos del 1 % de lo que emiten hoy las actividades humanas.'],
      ], 'Saber a dónde va el carbono evita dos errores: pensar que no importa y pensar que todo queda en el aire.', { d: 2 }),
      op('Si con el calor y las sequías los bosques absorben menos CO₂, ¿qué pasa?', [ // e11
        'Queda más CO₂ en el aire por cada tonelada emitida',
        'Los océanos absorben automáticamente todo lo que falta',
        ['Baja el CO₂, porque los árboles dejan de respirar', 'Si absorben menos, el CO₂ sube; no baja.'],
        'Nada, porque los bosques no participan del ciclo',
      ], 'Es una retroalimentación: el calentamiento debilita los sumideros, y eso acelera el calentamiento.', { d: 3 }),
      comp('Completá.', 'El CO₂ fósil no tiene carbono-[14]; los océanos absorben alrededor de un [cuarto] de lo que emitimos; y al hacerlo se [acidifican].', ['12', 'décimo', 'enfrían'], 'Tres claves sobre el origen y el destino del carbono.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Los otros gases', 'Metano, óxido nitroso y gases fluorados: cuánto calientan, cuánto duran y de dónde vienen en Argentina.', [
      teoria('Metano y óxido nitroso', [
        'El metano (CH₄) se emite en la ganadería (por la digestión de las vacas), en arrozales, en basurales y rellenos sanitarios, y en fugas de la extracción y el transporte de gas. Calienta mucho más que el CO₂ por tonelada, pero dura menos en la atmósfera: unos 12 años. Según el IPCC, el metano explica alrededor de medio grado del calentamiento observado.',
        'El óxido nitroso (N₂O) viene sobre todo de los fertilizantes nitrogenados y del estiércol. Dura más de un siglo y calienta casi 300 veces más que el CO₂ por tonelada, en 100 años.',
      ]),
      par('Uní cada gas con su fuente principal.', [ // e1
        ['Metano', 'Ganadería, basurales y fugas de gas'],
        ['Óxido nitroso', 'Fertilizantes nitrogenados'],
        ['Dióxido de carbono', 'Quema de combustibles fósiles'],
        ['Gases fluorados', 'Refrigeración y aire acondicionado'],
      ], 'Cada gas tiene sus fuentes, y por eso sus soluciones son distintas.', { d: 2 }),
      teoria('Repaso: el CO₂ equivalente', [
        'Como viste en el tronco, para sumar gases distintos se usa el CO₂ equivalente (CO₂e), que multiplica cada gas por su potencial de calentamiento en 100 años. En números redondos del IPCC: CO₂ = 1, metano ≈ 28 y óxido nitroso ≈ 273.',
      ], {
        datos: tabla('Potencial de calentamiento y duración (valores aproximados, IPCC)', ['Gas', 'Poder de calentamiento a 100 años', 'Duración en la atmósfera'], [
          ['CO₂', '1', 'Una parte, siglos a milenios'],
          ['Metano', '≈ 28', '≈ 12 años'],
          ['Óxido nitroso', '≈ 273', '≈ 110 años'],
        ]),
      }),
      numv(3, (i) => { // e2
        const t = [2, 5, 10][i];
        return {
          enunciado: `¿Cuántas toneladas de CO₂e equivalen a ${t} toneladas de metano, si el metano vale 28 veces el CO₂?`,
          valor: t * 28,
          unidad: 't CO₂e',
          explicacion: `${t} × 28 = ${t * 28} t CO₂e. Por eso reducir fugas de metano rinde mucho por tonelada.`,
        };
      }, { d: 1 }),
      num('¿Cuántas toneladas de CO₂e equivalen a 3 toneladas de óxido nitroso, si vale 273 veces el CO₂?', 819, 't CO₂e', '3 × 273 = 819 t CO₂e. Pocas toneladas de óxido nitroso pesan como cientos de toneladas de CO₂.', { ctx: '3 t de N₂O; potencial de 273.', d: 2 }),
      op('El metano calienta mucho por tonelada pero dura poco. ¿Qué implica eso?', [ // e4
        'Reducirlo frena el calentamiento en pocas décadas',
        'Que no hace falta reducirlo, porque se va solo',
        ['Que dura más que el CO₂', 'Es al revés: el metano dura unos 12 años; parte del CO₂, siglos.'],
        'Que no tiene ningún efecto sobre el clima',
      ], 'Recortar metano da resultados rápidos; recortar CO₂ evita un calentamiento que duraría siglos. Hacen falta las dos cosas.', { d: 3 }),
      teoria('Argentina en el mapa', [
        'Según el Inventario Nacional de Gases de Efecto Invernadero, alrededor de la mitad de las emisiones de Argentina viene de la energía (transporte, electricidad, industria, calefacción), y cerca del 39 % de la agricultura, la ganadería, la silvicultura y otros usos de la tierra, incluidos los desmontes. El resto, de procesos industriales (≈ 6 %) y residuos (≈ 5 %).',
        'Argentina emite menos del 1 % de los gases del mundo, pero por persona está cerca del promedio mundial o algo por encima, según el año y cómo se cuente.',
      ], {
        datos: barras('Emisiones de Argentina por sector (aproximado)', '%', [
          ['Energía', 50],
          ['Agro, ganadería y usos de la tierra', 39],
          ['Procesos industriales', 6],
          ['Residuos', 5],
        ], 'Inventario Nacional de GEI de Argentina; valores redondeados.'),
      }),
      rank('Ordená los sectores de Argentina por sus emisiones, de mayor a menor.', [ // e5
        ['Energía', '≈ 50 %'],
        ['Agro, ganadería y usos de la tierra', '≈ 39 %'],
        ['Procesos industriales', '≈ 6 %'],
        ['Residuos', '≈ 5 %'],
      ], 'A diferencia de muchos países industrializados, en Argentina el agro y los desmontes pesan casi tanto como la energía.', { d: 2 }),
      clas('¿En qué sector del inventario se cuenta cada emisión?', { // e6
        'Energía': ['Nafta de los autos', 'Gas de las centrales eléctricas', 'Calefacción a gas'],
        'Agro y usos de la tierra': ['Metano de la ganadería', 'Desmonte en el Chaco', 'Fertilizantes nitrogenados'],
        'Residuos': ['Metano de los rellenos sanitarios', 'Aguas residuales sin tratar'],
      }, 'Conocer cómo se reparten las emisiones ayuda a ver dónde están las mayores oportunidades.', { d: 2 }),
      numv(3, (i) => { // e7
        const total = [366, 370, 360][i];
        return {
          enunciado: `Si Argentina emite ${total} millones de toneladas de CO₂e por año y el 39 % viene del agro, la ganadería y los usos de la tierra, ¿cuántos millones de toneladas son? Redondeá al entero.`,
          valor: Math.round(total * 0.39),
          unidad: 'millones de t CO₂e',
          tol: 1,
          explicacion: `${total} × 0,39 ≈ ${Math.round(total * 0.39)} millones de t CO₂e. Casi cuatro de cada diez toneladas vienen del campo y los desmontes.`,
        };
      }, { d: 2 }),
      vf('Como Argentina emite menos del 1 % del total mundial, sus emisiones no importan.', false, 'Casi todos los países emiten un porcentaje chico: si todos pensaran así, nadie haría nada. Además, por persona, Argentina está cerca del promedio mundial.', { // e8
        razones: ['+Porque sumadas, las emisiones de países chicos pesan mucho', '-Porque Argentina emite la mitad del mundo', '-Porque las emisiones de otros países no cuentan'],
        d: 2,
      }),
      det('Leé este informe escolar y marcá lo equivocado.', [ // e9
        ['El metano viene, entre otras fuentes, de la ganadería.', false],
        ['El metano dura siglos en la atmósfera.', true, 'Dura unos 12 años; lo que dura siglos es una parte del CO₂.'],
        ['El óxido nitroso viene sobre todo de los fertilizantes.', false],
        ['En Argentina, los residuos son el sector que más emite.', true, 'Son alrededor del 5 %; los primeros son la energía y el agro.'],
      ], 'Los detalles de cada gas importan para elegir bien las soluciones.', { d: 2 }),
      vf('Algunos gases fluorados de heladeras y aires acondicionados calientan miles de veces más que el CO₂ por tonelada.', true, 'Algunos HFC tienen potenciales de miles. Por eso la Enmienda de Kigali (2016) acordó reducirlos de forma gradual en todo el mundo.', { // e11
        razones: ['+Porque algunos HFC tienen potenciales de miles', '-Porque los gases fluorados enfrían el planeta', '-Porque solo el CO₂ calienta'],
        d: 2,
      }),
      comp('Completá.', 'El metano dura unos [12] años en la atmósfera; el óxido nitroso viene sobre todo de los [fertilizantes]; y en Argentina, el sector que más emite es la [energía].', ['500', 'plásticos', 'minería'], 'Tres datos para ubicar los otros gases y el caso argentino.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Cuánto se calentó y cómo lo sabemos', 'Tiempo y clima, el calentamiento medido y las huellas que señalan a las actividades humanas.', [
      teoria('Tiempo no es clima', [
        'El tiempo es lo que pasa en la atmósfera en un lugar y momento: hoy llueve, mañana hace calor. El clima es el promedio y la variabilidad del tiempo durante muchos años, por convención al menos 30. Un día frío no desmiente el calentamiento global, igual que un día caluroso no lo prueba: lo que importa es la tendencia de largo plazo.',
      ]),
      clas('¿Habla del tiempo o del clima?', { // e1
        'Tiempo': ['Mañana va a llover en Córdoba', 'Hoy hizo 38 °C en Rosario', 'Esta semana hubo heladas'],
        'Clima': ['En Mendoza llueve poco en promedio', 'Los inviernos de Ushuaia son fríos', 'La temperatura media subió en los últimos 50 años'],
      }, 'El clima se mide en décadas; el tiempo, en horas y días.', { d: 1 }),
      teoria('El calentamiento medido', [
        'Miles de estaciones meteorológicas, barcos, boyas y satélites miden la temperatura del planeta. Los registros de la NASA, la NOAA, el servicio europeo Copernicus y otros coinciden: la temperatura media global ya subió alrededor de 1,2 a 1,3 °C respecto de la época preindustrial (1850–1900). El año 2024 fue el más cálido registrado, con alrededor de 1,55 °C por encima de ese nivel, según la Organización Meteorológica Mundial.',
        'Los continentes se calientan más que el océano, y el Ártico, varias veces más rápido que el promedio global.',
      ], { destacado: { valor: '≈ 1,55 °C', texto: 'por encima de la era preindustrial fue la temperatura media global de 2024, el año más cálido registrado.' } }),
      est('Estimá cuántos grados se calentó en promedio el planeta respecto de la época preindustrial, considerando el promedio de la última década.', 1.25, { min: 0, max: 5, paso: 0.05, unidad: '°C' }, 'Alrededor de 1,2 a 1,3 °C en promedio de la última década. 2024, un año puntual, llegó a unos 1,55 °C.', { d: 2 }),
      vf('Un invierno muy frío en Buenos Aires demuestra que el calentamiento global no existe.', false, 'Un invierno es tiempo, no clima. El calentamiento se mide con promedios globales de décadas, que muestran una tendencia clara al alza.', { // e3
        razones: ['+Porque un evento local no cambia la tendencia global', '-Porque el calentamiento solo ocurre en verano', '-Porque Buenos Aires no forma parte del planeta'],
        d: 1,
      }),
      teoria('¿Y si fuera el sol?', [
        'Los científicos analizaron las causas naturales posibles. La energía que llega del sol se mide con satélites desde fines de los años 70 y no aumentó: incluso bajó un poco, mientras la temperatura subía. Además hay huellas que solo encajan con los gases de efecto invernadero: la capa baja de la atmósfera se calienta mientras la estratosfera, más arriba, se enfría; y las noches se calientan más rápido que los días. Si la causa fuera el sol, toda la atmósfera se calentaría, incluida la estratosfera.',
      ]),
      cad('Armá el razonamiento de la "huella" en la estratosfera.', [ // e4
        'Si el sol fuera la causa, toda la atmósfera se calentaría',
        'Con más gases de efecto invernadero, la capa baja se calienta y la estratosfera se enfría',
        'Las mediciones muestran que la estratosfera se enfría',
        'La evidencia señala a los gases, no al sol',
      ], ['La estratosfera se calienta más que la superficie'], 'Comparar predicciones distintas con los datos es la forma en que la ciencia distingue causas.', { d: 4 }),
      mult('¿Qué evidencias señalan a los gases de efecto invernadero y no al sol? Marcá todas.', [ // e5
        '+La energía solar no aumentó desde los años 70',
        '+La estratosfera se enfría mientras la superficie se calienta',
        '+Las noches se calientan más rápido que los días',
        '-El sol se está acercando a la Tierra',
        '-Los inviernos desaparecieron en todo el mundo',
      ], 'Varias huellas independientes apuntan a la misma causa.', { d: 3 }),
      teoria('El consenso', [
        'Distintos estudios que revisaron miles de artículos científicos encontraron que alrededor del 97 % o más de los especialistas en clima que publican sobre el tema coinciden en que el calentamiento reciente es causado por las actividades humanas. El IPCC, en su último informe, lo afirmó sin ambigüedad: es "inequívoco" que la influencia humana calentó la atmósfera, el océano y la tierra.',
      ]),
      numv(3, (i) => { // e6
        const n = [1000, 2500, 600][i];
        return {
          enunciado: `Si de ${n.toLocaleString('es-AR')} artículos científicos que opinan sobre la causa del calentamiento, el 97 % coincide en que es humana, ¿cuántos artículos coinciden?`,
          valor: Math.round(n * 0.97),
          unidad: 'artículos',
          explicacion: `${n.toLocaleString('es-AR')} × 0,97 = ${Math.round(n * 0.97).toLocaleString('es-AR')}. Un consenso así en ciencia es muy fuerte, y está respaldado por múltiples líneas de evidencia.`,
        };
      }, { d: 1 }),
      op('¿Por qué los científicos confían en que el calentamiento es causado por las personas?', [ // e7
        'Varias evidencias independientes apuntan a lo mismo',
        'Porque lo dijo una sola persona muy famosa',
        ['Porque los modelos se inventan los datos', 'Los modelos se contrastan con mediciones reales; no alcanzan solos.'],
        'Porque todos los veranos son más calurosos que el anterior',
      ], 'La confianza viene de que muchas líneas de evidencia —isótopos, huellas en la atmósfera, balance de energía, física básica— coinciden.', { d: 2 }),
      det('Leé este posteo y marcá lo equivocado.', [ // e8
        ['El planeta se calentó alrededor de 1,2 °C desde la época preindustrial.', false],
        ['El calentamiento lo causa el sol, que cada año emite más energía.', true, 'La energía solar no aumentó desde los años 70.'],
        ['La estratosfera se enfría mientras la superficie se calienta.', false],
        ['Los científicos están divididos a la mitad sobre la causa.', true, 'Alrededor del 97 % o más coincide en que es humana.'],
      ], 'Saber responder los mitos con datos es una forma de cuidar la conversación pública.', { d: 2 }),
      par('Uní cada forma de medir con lo que mide.', [ // e10
        ['Estaciones meteorológicas', 'Temperatura del aire sobre los continentes'],
        ['Boyas y barcos', 'Temperatura de la superficie del mar'],
        ['Satélites', 'Energía que llega del sol'],
        ['Testigos de hielo', 'CO₂ y temperatura del pasado lejano'],
      ], 'Instrumentos distintos, medidos por equipos distintos, llegan a la misma conclusión.', { d: 2 }),
      numv(3, (i) => { // e11
        const [a, b] = [[16.2, 17.1], [11.4, 12.2], [22.6, 23.3]][i];
        return {
          enunciado: `Una ciudad tuvo una temperatura media de ${a.toLocaleString('es-AR')} °C en 1961–1990 y de ${b.toLocaleString('es-AR')} °C en 1991–2020. ¿Cuántos grados se calentó entre esos dos períodos?`,
          valor: Math.round((b - a) * 10) / 10,
          unidad: '°C',
          dec: 1,
          tol: 0.05,
          explicacion: `${b.toLocaleString('es-AR')} − ${a.toLocaleString('es-AR')} = ${(Math.round((b - a) * 10) / 10).toLocaleString('es-AR')} °C. Se comparan promedios de 30 años para que un año raro no confunda la tendencia.`,
        };
      }, { d: 2 }),
      comp('Completá.', 'El clima es el promedio del tiempo en al menos [30] años; mientras la superficie se calienta, la [estratosfera] se enfría; y 2024 fue el año más [cálido] registrado.', ['2', 'luna', 'frío'], 'Tres ideas para leer y explicar el calentamiento global.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: el efecto invernadero', 'Mecanismo, curva del CO₂, origen del carbono, otros gases y evidencia del calentamiento, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: responder con datos', 'En un grupo familiar circulan cinco mensajes sobre el clima. Usá lo que aprendiste para responder cada uno con evidencia.', [
      teoria('Los mensajes', [
        'Mensaje 1: "El CO₂ es solo el 0,04 % del aire, no puede cambiar nada." Mensaje 2: "El clima siempre cambió, esto es natural." Mensaje 3: "Es el sol, que está más fuerte." Mensaje 4: "Hoy hace un frío terrible, ¿dónde está el calentamiento?" Mensaje 5: "Los volcanes largan más CO₂ que todos los autos."',
      ]),
      par('Uní cada mensaje con el dato que mejor lo responde.', [ // e1
        ['"El CO₂ es solo el 0,04 %"', 'Absorbe infrarrojo aunque sea escaso'],
        ['"El clima siempre cambió"', 'El CO₂ actual supera 800.000 años de registros'],
        ['"Es el sol"', 'La energía solar no aumentó desde los años 70'],
        ['"Hoy hace frío"', 'El tiempo de un día no es el clima'],
        ['"Los volcanes emiten más"', 'Emiten menos del 1 % de lo humano'],
      ], 'Cada mito tiene una respuesta basada en datos. Conviene responder con respeto y con evidencia.', { d: 3 }),
      num('Si el CO₂ subió de 280 a 425 ppm, ¿cuántas ppm aumentó?', 145, 'ppm', '425 − 280 = 145 ppm. Es un aumento de alrededor del 50 %, fuera del rango de 800.000 años de registros.', { ctx: 'De 280 ppm preindustrial a 425 ppm actual.', d: 1 }),
      op('Sobre el mensaje 2, "el clima siempre cambió", ¿qué respuesta es más sólida?', [ // e3
        'Cambió, pero hoy el cambio es más rápido y tiene causa humana',
        'Es falso: el clima nunca cambió antes de nosotros',
        ['Tiene razón, así que no hay nada que hacer', 'Que haya cambios naturales no excluye que este sea causado por las personas.'],
        'Es verdad, pero solo en el hemisferio norte',
      ], 'Reconocer lo cierto del mensaje y aportar el dato que falta suele convencer más que negarlo todo.', { d: 3 }),
      mult('¿Qué evidencias podés citar para mostrar que el calentamiento es humano? Marcá todas.', [ // e4
        '+La huella de los isótopos del carbono',
        '+El enfriamiento de la estratosfera',
        '+El aumento del CO₂ coincide con la quema de combustibles',
        '-Que este verano fue muy caluroso en tu ciudad',
        '-Que lo dijo un famoso en la televisión',
      ], 'Un verano caluroso es tiempo, no clima; y una opinión famosa no es evidencia.', { d: 2 }),
      vf('Para responder un mito conviene burlarse de quien lo compartió.', false, 'Burlarse genera defensa y cierra la conversación. Funciona mejor reconocer la duda, aportar un dato claro y una fuente confiable.', { // e5
        razones: ['+Porque la burla genera defensa y cierra la conversación', '-Porque los datos no sirven para convencer', '-Porque los mitos no se pueden responder'],
        d: 2,
      }),
      rank('Ordená estas respuestas de la más efectiva a la menos, para el grupo familiar.', [ // e6
        ['Reconocer la duda, dar un dato claro y una fuente', 'más efectiva'],
        ['Dar muchos datos juntos sin explicar', 'poco clara'],
        ['Mandar solo un link sin comentario', 'poco efectiva'],
        ['Responder con una burla', 'contraproducente'],
      ], 'Lo viste en el tronco: hablar de ambiente sin pelear es una habilidad que se practica.', { d: 3, extremos: ['Más efectiva', 'Menos efectiva'] }),
      det('Tu respuesta al grupo. Marcá lo que conviene corregir.', [ // e7
        ['Entiendo la duda, a mí también me pasó.', false],
        ['El CO₂ pasó de 280 a más de 420 ppm, más que en 800.000 años.', false],
        ['El sol emite el doble de energía que hace 50 años.', true, 'Falso: la energía solar no aumentó desde los años 70.'],
        ['Los volcanes largan más CO₂ que todos los autos juntos.', true, 'Falso: emiten menos del 1 % de lo que emiten las personas.'],
      ], 'Una respuesta con un solo dato falso pierde credibilidad. Chequear antes de mandar es clave.', { d: 3 }),
    ]),
  ],
});
