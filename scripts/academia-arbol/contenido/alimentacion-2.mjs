import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// ALIMENTACIÓN 2 — La huella de lo que comemos.
// Cómo se mide la huella de carbono de un alimento, cómo comparar bien
// (por kilo, por proteína, por caloría), por qué el transporte y el envase
// pesan menos de lo que parece, y cómo cambiar el plato sin perder
// nutrición. Retoma el CO₂ equivalente (tronco-2) y elegir por impacto
// (tronco-3).

export default unidad({
  slug: 'alimentacion-2',
  rama: 'alimentacion',
  orden: 2,
  nivel: 1,
  requiereTronco: 1,
  titulo: 'La huella de lo que comemos',
  bajada: 'Por qué un kilo de carne vacuna emite decenas de veces más que uno de lentejas, y por qué importa más qué comés que de dónde viene.',
  objetivos: [
    'Explicar cómo se calcula la huella de carbono de un alimento',
    'Comparar la huella de distintos alimentos por kilo',
    'Comparar alimentos de forma justa por proteína o por caloría',
    'Evaluar el peso real del transporte y el envase en la huella',
    'Diseñar cambios en la alimentación que bajen la huella sin perder nutrición',
  ],
  repasa: ['alimentacion-1', 'tronco-2', 'tronco-3'],
  fuentes: ['poore-nemecek-2018', 'owid-alimentos', 'owid-impactos-alimentos', 'guias-alimentarias-ar', 'ipcc-ar6-syr'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Cómo se mide la huella de un alimento', 'Del cambio de uso del suelo al cajón de la verdulería: las etapas que se suman en un análisis de ciclo de vida.', [
      teoria('El análisis de ciclo de vida', [
        'Para calcular la huella de carbono de un alimento se usa el análisis de ciclo de vida: se suman las emisiones de todas sus etapas, desde que se prepara el campo hasta que llega al comercio. Se expresan en kilos de CO₂ equivalente (CO₂e) por kilo de alimento, la unidad que viste en el tronco.',
        'Las etapas típicas son: cambio de uso del suelo (por ejemplo, desmontar para cultivar), producción en el campo, alimento para los animales, procesamiento, transporte, venta y envase.',
      ]),
      ord('Ordená las etapas del ciclo de vida de un queso.', [ // e1
        'Se prepara la tierra para pasturas o cultivos',
        'Las vacas comen y producen leche',
        'Una fábrica transforma la leche en queso',
        'Se envasa y se transporta',
        'Se vende en un comercio',
      ], 'La huella del queso es la suma de todas estas etapas. La más pesada es la de las vacas.', { d: 1, extremos: ['Primero', 'Último'] }),
      teoria('Qué gases, de dónde', [
        'En la comida, no todo es CO₂. El metano sale de la digestión de vacas, ovejas y cabras (se llama fermentación entérica) y de los arrozales inundados. El óxido nitroso sale de los fertilizantes nitrogenados y del estiércol. El CO₂ sale de desmontes, maquinaria, fábricas y transporte.',
        'Como el metano y el óxido nitroso calientan mucho más que el CO₂, se convierten a CO₂e para poder sumarlos.',
      ]),
      par('Uní cada gas con una fuente típica en la producción de alimentos.', [ // e2
        ['Metano', 'Digestión de las vacas'],
        ['Óxido nitroso', 'Fertilizantes nitrogenados'],
        ['CO₂', 'Desmonte y quema de combustibles'],
      ], 'Tres gases con orígenes distintos. El CO₂e permite sumarlos en un solo número.', { d: 2 }),
      mult('¿Qué etapas se suman en la huella de carbono de un alimento? Marcá todas.', [ // e3
        '+El desmonte para abrir campos',
        '+Las emisiones de los animales',
        '+El procesamiento en fábricas',
        '+El transporte y el envase',
        '-El precio que paga el consumidor',
      ], 'La huella suma emisiones, no pesos. El precio no dice cuánto emitió un alimento.', { d: 1 }),
      teoria('La base de datos más grande', [
        'En 2018, los investigadores Joseph Poore y Thomas Nemecek publicaron en la revista Science un estudio que reunió datos de unas 38.000 explotaciones agropecuarias de 119 países. Es una de las fuentes más usadas para comparar la huella de los alimentos.',
        'Una de sus conclusiones: la variación es enorme. El mismo alimento puede tener huellas muy distintas según dónde y cómo se produce. Pero aun así, las diferencias entre tipos de alimentos suelen ser más grandes que entre productores.',
      ]),
      vf('Según el estudio de Poore y Nemecek, las diferencias entre tipos de alimentos suelen ser mayores que las diferencias entre productores del mismo alimento.', true, 'Hasta la carne vacuna de menor impacto suele emitir más que las legumbres de mayor impacto. Por eso qué se come importa tanto.', { // e4
        razones: ['+Porque la carne vacuna de menor impacto suele superar a las legumbres de mayor impacto', '-Porque todos los productores de un alimento emiten igual', '-Porque la forma de producir no importa nada'],
        d: 3,
      }),
      cad('Armá la cadena de por qué una vaca emite metano.', [ // e5
        'La vaca come pasto',
        'En su estómago, microbios fermentan la celulosa',
        'La fermentación produce metano',
        'La vaca lo libera, sobre todo al eructar',
      ], ['El pasto ya trae metano adentro'], 'El metano entérico es la mayor fuente de emisiones de la ganadería vacuna, y una de las más grandes de Argentina.', { d: 2 }),
      ejemplo('Sumar gases', 'La producción de un kilo de un alimento emite 2 kg de CO₂, 0,5 kg de metano y 0,01 kg de óxido nitroso. Usá 28 para el metano y 265 para el óxido nitroso.', [
        'CO₂: 2 kg CO₂e.',
        'Metano: 0,5 × 28 = 14 kg CO₂e.',
        'Óxido nitroso: 0,01 × 265 = 2,65 kg CO₂e.',
        'Total: 2 + 14 + 2,65 = 18,65 kg CO₂e.',
      ], 'El metano, que pesaba poco en kilos, termina siendo la mayor parte de la huella. Es lo que pasa en la carne vacuna.'),
      numv(3, (i) => { // e6
        const co2 = [2, 5, 1][i];
        const ch4 = [0.5, 1, 0.2][i];
        return {
          enunciado: `Producir un alimento emite ${co2} kg de CO₂ y ${ch4.toLocaleString('es-AR')} kg de metano. Con el metano a 28 veces el CO₂, ¿cuántos kg de CO₂e emite en total?`,
          valor: Math.round((co2 + ch4 * 28) * 10) / 10,
          unidad: 'kg CO₂e',
          dec: 1,
          explicacion: `${co2} + ${ch4.toLocaleString('es-AR')} × 28 = ${co2} + ${(ch4 * 28).toLocaleString('es-AR')} = ${(Math.round((co2 + ch4 * 28) * 10) / 10).toLocaleString('es-AR')} kg CO₂e. El metano domina aunque pese menos.`,
        };
      }, { d: 2 }),
      clas('¿La principal fuente de emisiones de este alimento es el metano o es otra?', { // e7
        'Principalmente metano': ['Carne vacuna', 'Carne de cordero', 'Arroz de arrozales inundados'],
        'Principalmente otras': ['Tomates de invernadero calefaccionado', 'Pollo', 'Pan'],
      }, 'Rumiantes y arrozales son los grandes emisores de metano. Los invernaderos calefaccionados emiten CO₂ por la energía.', { d: 3 }),
      rank('Ordená estos gases por cuánto calientan por kilo en 100 años, de más a menos.', [
        ['Óxido nitroso', '≈ 265 veces el CO₂'],
        ['Metano', '≈ 28 veces el CO₂'],
        ['Dióxido de carbono', '1 (la referencia)'],
      ], 'Por eso pocos kilos de metano u óxido nitroso pesan tanto en la huella de la comida. Es el CO₂e del tronco.', { d: 2 }),
      op('En la huella de la carne vacuna, ¿qué etapa pesa más?', [
        'La producción en el campo',
        'El transporte desde el frigorífico hasta el comercio',
        ['El envase de la bandeja de la carnicería', 'El envase es una parte muy chica de la huella de la carne.'],
        'La cocción en la parrilla o el horno de casa',
      ], 'El metano de los animales, el alimento que comen y el uso de la tierra concentran casi toda la huella.', { d: 2 }),
      det('Leé esta explicación y marcá lo equivocado.', [ // e8
        ['La huella se mide en kilos de CO₂ equivalente por kilo de alimento.', false],
        ['Solo cuenta el CO₂: el metano no se incluye.', true, 'El metano y el óxido nitroso se incluyen convertidos a CO₂e.'],
        ['El metano de las vacas sale de la digestión.', false],
        ['El mismo alimento siempre tiene la misma huella en todo el mundo.', true, 'Hay mucha variación según cómo y dónde se produce.'],
      ], 'Ciclo de vida, varios gases y mucha variación: las tres claves de la huella de la comida.', { d: 2 }),
      comp('Completá.', 'La huella de un alimento se calcula con un análisis de [ciclo] de vida y se expresa en kilos de [CO₂e]; el metano de las vacas viene de la [digestión].', ['precio', 'oxígeno', 'cosecha'], 'Método, unidad y la fuente más grande en la carne vacuna.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Comparar por kilo', 'Carne vacuna, queso, pollo, huevos, arroz y legumbres: las diferencias de huella son de decenas de veces.', [
      teoria('Una escalera muy empinada', [
        'Con los promedios mundiales de Poore y Nemecek, un kilo de carne vacuna de rodeo de cría emite alrededor de 100 kg de CO₂e. Un kilo de queso, alrededor de 24; de carne de cerdo, unos 12; de pollo, unos 10; de huevos, unos 5; de arroz, unos 4,5; de arvejas, alrededor de 1.',
        'La diferencia entre el primero y el último es de cerca de 100 veces. Pocas decisiones cotidianas tienen diferencias tan grandes.',
      ], {
        datos: barras('Huella de carbono por kilo de alimento (promedio mundial)', 'kg CO₂e por kg', [
          ['Carne vacuna (rodeo de cría)', 100],
          ['Carne de cordero', 40],
          ['Queso', 24],
          ['Carne de cerdo', 12],
          ['Pollo', 10],
          ['Huevos', 4.7],
          ['Arroz', 4.5],
          ['Arvejas', 1],
        ], 'Poore y Nemecek (2018), vía Nuestro Mundo en Datos. Valores redondeados.'),
      }),
      rank('Ordená estos alimentos por huella de carbono por kilo, de más a menos (promedios mundiales).', [ // e1
        ['Carne vacuna', '≈ 100 kg CO₂e'],
        ['Queso', '≈ 24 kg CO₂e'],
        ['Pollo', '≈ 10 kg CO₂e'],
        ['Huevos', '≈ 4,7 kg CO₂e'],
        ['Arvejas', '≈ 1 kg CO₂e'],
      ], 'Una escalera con escalones enormes. La carne vacuna está muy por encima del resto.', { d: 2 }),
      est('Estimá cuántas veces más CO₂e emite por kilo, en promedio, la carne vacuna que las arvejas.', 100, { min: 1, max: 1000, unidad: 'veces', escala: 'log' }, 'Alrededor de 100 veces, con los promedios mundiales. Aunque cambie según el sistema, la diferencia sigue siendo de decenas de veces.', { d: 3 }),
      numv(3, (i) => { // e2
        const kg = [2, 1.5, 3][i];
        return {
          enunciado: `Una familia come ${kg.toLocaleString('es-AR')} kg de carne vacuna por semana. Con 100 kg CO₂e por kilo, ¿cuántos kg de CO₂e son por semana?`,
          valor: kg * 100,
          unidad: 'kg CO₂e',
          explicacion: `${kg.toLocaleString('es-AR')} × 100 = ${kg * 100} kg CO₂e por semana. Por año, ${(kg * 100 * 52).toLocaleString('es-AR')} kg: más de ${Math.floor((kg * 100 * 52) / 1000)} toneladas.`,
        };
      }, { d: 2 }),
      teoria('Los lácteos y el queso', [
        'El queso tiene una huella alta porque se necesitan muchos litros de leche para hacer un kilo, alrededor de 10 litros para quesos duros. La leche en sí tiene una huella mucho menor por litro, alrededor de 3 kg de CO₂e.',
        'Esto muestra algo importante: los alimentos concentrados o que pasan por muchos pasos acumulan la huella de todo lo que se usó para hacerlos.',
      ]),
      numv(3, (i) => { // e3
        const l = [10, 8, 12][i];
        return {
          enunciado: `Si hacen falta ${l} litros de leche para un kilo de queso y cada litro emite unos 3 kg CO₂e, ¿cuántos kg CO₂e vienen de la leche de ese kilo de queso?`,
          valor: l * 3,
          unidad: 'kg CO₂e',
          explicacion: `${l} × 3 = ${l * 3} kg CO₂e. El queso concentra la huella de toda la leche que se usó.`,
        };
      }, { d: 2 }),
      vf('Un litro de leche tiene más huella que un kilo de queso.', false, 'Es al revés: un kilo de queso necesita alrededor de 10 litros de leche, así que su huella es mucho mayor.', { // e4
        razones: ['+Porque un kilo de queso concentra muchos litros de leche', '-Porque el queso no usa leche', '-Porque la leche se transporta más lejos'],
        d: 2,
      }),
      clas('¿Este alimento tiene huella alta (más de 20 kg CO₂e/kg), media (entre 3 y 20) o baja (menos de 3) en promedio?', { // e5
        'Alta': ['Carne vacuna', 'Carne de cordero', 'Queso'],
        'Media': ['Carne de cerdo', 'Pollo', 'Huevos'],
        'Baja': ['Lentejas', 'Papas', 'Manzanas'],
      }, 'Tres grupos que alcanzan para orientarse sin memorizar números.', { d: 2 }),
      teoria('El caso argentino', [
        'En Argentina, buena parte de la ganadería vacuna es pastoril o mixta, y los valores locales pueden diferir de los promedios mundiales, para arriba o para abajo según el sistema y si hubo desmonte. Aun así, la carne vacuna sigue siendo, por lejos, el alimento de mayor huella en la dieta local.',
        'Argentina está entre los países con mayor consumo de carne vacuna por persona del mundo, y la ganadería es una de las principales fuentes de emisiones del país.',
      ]),
      op('¿Qué dice el caso argentino sobre los promedios mundiales de huella de la carne?', [ // e6
        'Que los valores locales cambian, pero la carne sigue siendo la de mayor huella',
        'Que en Argentina la carne vacuna no emite gases de efecto invernadero',
        ['Que los promedios mundiales son falsos y no sirven para nada', 'Sirven para comparar tipos de alimentos, aunque cada sistema tenga su propio valor.'],
        'Que en Argentina el pollo emite más que la carne vacuna',
      ], 'Los promedios orientan; los datos locales afinan. La conclusión principal no cambia.', { d: 3 }),
      par('Uní cada alimento con su huella aproximada por kilo.', [ // e7
        ['Carne vacuna', '≈ 100 kg CO₂e'],
        ['Queso', '≈ 24 kg CO₂e'],
        ['Pollo', '≈ 10 kg CO₂e'],
        ['Arvejas', '≈ 1 kg CO₂e'],
      ], 'Cuatro puntos de referencia para ubicar cualquier alimento en la escalera.', { d: 2 }),
      det('Leé este posteo y marcá lo equivocado.', [ // e8
        ['La carne vacuna tiene una de las huellas más altas por kilo.', false],
        ['El queso tiene poca huella porque es un lácteo.', true, 'El queso concentra mucha leche y tiene una huella alta, unos 24 kg CO₂e por kilo.'],
        ['El pollo emite bastante menos que la carne vacuna.', false],
        ['Las legumbres y las carnes tienen más o menos la misma huella.', true, 'Las legumbres emiten decenas de veces menos por kilo.'],
      ], 'Los órdenes de magnitud del tronco, aplicados a la comida.', { d: 2 }),
      comp('Completá.', 'En promedio, un kilo de carne vacuna emite unos [100] kg de CO₂e y uno de arvejas alrededor de [1].', ['10', '50'], 'Una diferencia de cerca de cien veces entre los dos.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Comparar bien: por proteína y por caloría', 'Un kilo de carne y uno de lechuga no alimentan lo mismo. Cómo comparar de forma justa.', [
      teoria('La trampa del kilo', [
        'Comparar por kilo tiene un problema: los alimentos no aportan lo mismo. Un kilo de lechuga tiene muy pocas calorías y casi nada de proteína; un kilo de carne tiene mucha proteína. Comparar su huella por kilo puede engañar.',
        'Por eso también se compara por unidad de nutriente: por 100 gramos de proteína o por 1.000 kilocalorías. Así se compara la huella de alimentar, no la de pesar.',
      ]),
      op('¿Por qué comparar la huella de la lechuga y la carne solo por kilo puede engañar?', [ // e1
        'Porque aportan nutrientes muy distintos por kilo',
        'Porque la lechuga pesa más que la carne',
        ['Porque la lechuga no tiene ninguna huella', 'Tiene huella, aunque chica; el problema es que alimenta muy distinto.'],
        'Porque la carne se vende en kilos y la lechuga no',
      ], 'La pregunta útil es cuánto emite alimentar a alguien, no cuánto emite un kilo de cualquier cosa.', { d: 2 }),
      teoria('Por proteína', [
        'Por 100 gramos de proteína, los promedios de Poore y Nemecek dan alrededor de 50 kg CO₂e para la carne vacuna de cría, 11 para el queso, 7,6 para el cerdo, 5,7 para el pollo, 4,2 para los huevos, 2 para el tofu y menos de 1 para las legumbres como las arvejas.',
        'Aun comparando por proteína, que es lo que más favorece a la carne, la carne vacuna emite decenas de veces más que las legumbres.',
      ], {
        datos: barras('Huella por 100 g de proteína (promedio mundial)', 'kg CO₂e', [
          ['Carne vacuna (cría)', 50],
          ['Queso', 11],
          ['Carne de cerdo', 7.6],
          ['Pollo', 5.7],
          ['Huevos', 4.2],
          ['Tofu', 2],
          ['Arvejas', 0.4],
        ], 'Poore y Nemecek (2018), vía Nuestro Mundo en Datos. Valores redondeados.'),
      }),
      rank('Ordená estas fuentes de proteína por su huella por 100 g de proteína, de más a menos.', [ // e2
        ['Carne vacuna', '≈ 50 kg CO₂e'],
        ['Carne de cerdo', '≈ 7,6 kg CO₂e'],
        ['Pollo', '≈ 5,7 kg CO₂e'],
        ['Huevos', '≈ 4,2 kg CO₂e'],
        ['Arvejas', '≈ 0,4 kg CO₂e'],
      ], 'Por proteína, el pollo y los huevos emiten cerca de diez veces menos que la carne vacuna; las legumbres, más de cien veces menos.', { d: 2 }),
      numv(3, (i) => { // e3
        const g = [60, 80, 50][i];
        return {
          enunciado: `Una persona necesita unos ${g} g de proteína por día. Si toda viniera de carne vacuna (50 kg CO₂e por 100 g de proteína), ¿cuántos kg CO₂e serían por día?`,
          valor: (g / 100) * 50,
          unidad: 'kg CO₂e',
          explicacion: `${g} ÷ 100 × 50 = ${(g / 100) * 50} kg CO₂e por día. Si viniera de arvejas (0,4 por 100 g), serían ${((g / 100) * 0.4).toLocaleString('es-AR')} kg.`,
        };
      }, { d: 3 }),
      numv(3, (i) => { // e4
        const g = [60, 80, 50][i];
        const v = Math.round((g / 100) * (50 - 5.7) * 100) / 100;
        return {
          enunciado: `¿Cuántos kg CO₂e por día se ahorran si esos ${g} g de proteína vienen de pollo (5,7 kg CO₂e por 100 g) en vez de carne vacuna (50)? Redondeá a dos decimales.`,
          valor: v,
          unidad: 'kg CO₂e',
          dec: 2,
          tol: 0.05,
          explicacion: `(50 − 5,7) × ${g} ÷ 100 ≈ ${v.toLocaleString('es-AR')} kg CO₂e por día. Cambiar de carne vacuna a pollo baja cerca del 90 % de la huella de esa proteína.`,
        };
      }, { d: 3 }),
      teoria('Por caloría', [
        'Por 1.000 kilocalorías, la carne vacuna también está arriba de todo, alrededor de 36 kg CO₂e, mientras que el arroz o el trigo están por debajo de 1,5. Los cereales, las papas y las legumbres son las formas de conseguir energía con menos emisiones.',
        'Algunas verduras de invernadero calefaccionado o las frutas que viajan en avión pueden tener huellas altas por caloría, porque aportan pocas calorías. Por eso ningún indicador solo alcanza: hay que mirar varios.',
      ]),
      vf('Comparar por proteína hace que la carne vacuna quede con una huella parecida a la de las legumbres.', false, 'Aun por proteína, que es la comparación más favorable para la carne, la vacuna emite decenas de veces más que las legumbres.', { // e5
        razones: ['+Porque aun por proteína la diferencia sigue siendo de decenas de veces', '-Porque las legumbres no tienen proteína', '-Porque la carne vacuna no tiene huella'],
        d: 2,
      }),
      numv(3, (i) => {
        const kcal = [2000, 2500, 1800][i];
        return {
          enunciado: `Si toda la energía de un día (${kcal.toLocaleString('es-AR')} kcal) viniera de carne vacuna, a unos 36 kg CO₂e por 1.000 kcal, ¿cuántos kg CO₂e serían?`,
          valor: (kcal / 1000) * 36,
          unidad: 'kg CO₂e',
          dec: 1,
          explicacion: `${(kcal / 1000).toLocaleString('es-AR')} × 36 = ${((kcal / 1000) * 36).toLocaleString('es-AR')} kg CO₂e en un día. Con arroz o trigo, por debajo de 1,5 por 1.000 kcal, serían unos ${((kcal / 1000) * 1.5).toLocaleString('es-AR')} kg o menos.`,
        };
      }, { d: 3 }),
      vf('Una verdura puede tener poca huella por kilo y, aun así, bastante huella por caloría.', true, 'Como aporta muy pocas calorías por kilo, al dividir la huella por calorías el número sube. Por eso conviene mirar más de un indicador.', {
        razones: ['+Porque aporta muy pocas calorías por kilo', '-Porque las verduras no tienen calorías', '-Porque la huella por caloría siempre es igual a la huella por kilo'],
        d: 3,
      }),
      clas('¿Qué forma de comparar es más útil para cada pregunta?', { // e6
        'Por proteína': ['¿Con qué reemplazo la carne en un guiso?', '¿Qué fuente de proteína emite menos?'],
        'Por caloría': ['¿Qué base energética conviene para una comida?', '¿Qué alimenta más con menos emisiones?'],
        'Por kilo': ['¿Cuánto emitió lo que compré en el súper?', '¿Cuánto pesa la huella de mi changuito?'],
      }, 'Cada pregunta tiene su unidad. El error es usar una sola para todo.', { d: 3 }),
      par('Uní cada comparación con su trampa.', [ // e7
        ['Solo por kilo', 'Ignora cuánto alimenta cada alimento'],
        ['Solo por proteína', 'Ignora las vitaminas, la fibra y la energía'],
        ['Solo por caloría', 'Castiga a las verduras que aportan pocas calorías'],
        ['Solo por precio', 'No dice nada de las emisiones'],
      ], 'Ningún indicador es perfecto. Mirar varios da una imagen más justa.', { d: 3 }),
      det('Leé esta conclusión y marcá lo equivocado.', [ // e8
        ['La lechuga tiene poca huella por kilo.', false],
        ['Entonces la mejor dieta es comer solo lechuga.', true, 'La lechuga aporta muy pocas calorías y proteínas: no alcanza para alimentarse.'],
        ['Por proteína, las legumbres emiten mucho menos que la carne.', false],
        ['Por proteína, la carne vacuna es la más eficiente.', true, 'Por proteína, la carne vacuna es la de mayor huella entre las fuentes comunes.'],
      ], 'Comparar bien es comparar lo que alimenta, no solo lo que pesa.', { d: 3 }),
      comp('Completá.', 'Para comparar de forma justa se usa la huella por 100 g de [proteína] o por 1.000 [kilocalorías], además de por kilo.', ['sal', 'pesos', 'envase'], 'Tres unidades para tres preguntas distintas.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Local, transporte y envase', 'Por qué el viaje y el paquete suelen pesar poco, y cuándo sí importan mucho.', [
      teoria('Lo que menos pesa', [
        'Es muy común pensar que lo más importante de la huella de un alimento es cuánto viajó. Pero para la mayoría de los alimentos, el transporte es una parte chica: en promedio, alrededor del 5 al 6 % de las emisiones de la comida. En la carne vacuna, menos del 1 %.',
        'El envase también suele ser una parte chica, alrededor del 5 % en promedio. La mayor parte de la huella está en el campo: en el uso de la tierra y en la producción.',
      ], { destacado: { valor: '≈ 6 %', texto: 'es, en promedio, lo que aporta el transporte a la huella de carbono de los alimentos.' } }),
      est('Estimá qué porcentaje de la huella de carbono de la carne vacuna viene del transporte.', 1, { min: 0.1, max: 100, unidad: '%', escala: 'log' }, 'Menos del 1 %. Comer carne vacuna de un campo cercano casi no cambia su huella; lo que la define es la producción.', { d: 3 }),
      teoria('Qué se come le gana a dónde viene', [
        'Por eso Nuestro Mundo en Datos resume: si querés bajar la huella de tu comida, fijate en qué comés, no tanto en si es local. Una carne vacuna producida a 10 km emite mucho más que unas lentejas que viajaron miles de kilómetros en barco.',
        'Comprar local tiene otros beneficios —apoyar a productores cercanos, alimentos más frescos, menos intermediarios—, pero su efecto en la huella de carbono suele ser menor que el de cambiar qué se come.',
      ]),
      op('¿Qué tiene más huella de carbono en promedio?', [ // e1
        'Un kilo de carne vacuna de un campo cercano',
        'Un kilo de lentejas que viajó en barco desde otro país',
        ['Tienen la misma huella porque pesan lo mismo', 'Pesan lo mismo, pero la carne emite decenas de veces más por la producción.'],
        'Un kilo de arroz que viajó en camión desde otra provincia',
      ], 'La producción de la carne pesa mucho más que cualquier viaje en barco o camión.', { d: 2 }),
      teoria('Cuándo sí importa el viaje', [
        'Hay una excepción: el transporte en avión. Emite muchísimo más por kilo y por kilómetro que el barco o el camión. Algunos alimentos muy perecederos, como ciertos espárragos, frutillas fuera de estación o pescados frescos importados, a veces viajan en avión, y ahí el transporte puede ser la mayor parte de su huella.',
        'Los alimentos que viajan en barco, aunque vengan de lejos, suelen tener un transporte de huella muy baja por kilo.',
      ]),
      rank('Ordená estos medios de transporte por emisiones por tonelada y por kilómetro, de más a menos.', [ // e2
        ['Avión de carga', 'el más alto, por lejos'],
        ['Camión', 'intermedio'],
        ['Tren', 'bajo'],
        ['Barco de carga', 'el más bajo'],
      ], 'El barco mueve enormes cantidades con poco combustible por kilo. El avión, al revés.', { d: 2 }),
      vf('Todo alimento importado tiene una huella mayor que uno local.', false, 'Depende del alimento y del transporte. Unas legumbres importadas en barco pueden emitir mucho menos que una carne local. El avión es la excepción que sí pesa.', { // e3
        razones: ['+Porque el tipo de alimento y el medio de transporte pesan más que la distancia', '-Porque los importados nunca viajan', '-Porque los locales no tienen huella'],
        d: 2,
      }),
      teoria('El envase', [
        'El envase suele pesar poco en la huella de carbono de la comida, pero tiene otro problema: los residuos, como viste en la rama de Residuos. Además, a veces el envase evita que la comida se eche a perder: un pepino envuelto en film dura más días, y si eso evita que se tire, puede reducir la huella total.',
        'Lo ideal es poco envase, reutilizable o reciclable, y que no se tire comida.',
      ]),
      cad('Armá la cadena de cuándo un envase puede reducir la huella total.', [ // e4
        'Un envase protege un alimento frágil',
        'El alimento dura más días sin echarse a perder',
        'Se tira menos comida',
        'Se evita la huella de producir comida que no se come',
      ], ['El envase agrega nutrientes al alimento'], 'Envase y desperdicio están conectados. Menos envase es bueno, pero no si hace que se tire más comida.', { d: 3 }),
      clas('¿El transporte pesa mucho o poco en la huella de este alimento?', { // e5
        'Pesa mucho': ['Espárragos importados por avión', 'Frutillas fuera de estación traídas en avión'],
        'Pesa poco': ['Carne vacuna local', 'Arroz importado en barco', 'Lentejas de otra provincia en camión'],
      }, 'La regla general es "pesa poco". La excepción es el avión.', { d: 3 }),
      mult('¿Qué beneficios tiene comprar alimentos locales, además de la huella? Marcá todos.', [ // e6
        '+Apoyar a productores de la zona',
        '+Alimentos más frescos',
        '+Conocer cómo se produce lo que comés',
        '+Menos intermediarios en la cadena',
        '-Que cualquier alimento local emite menos que cualquier importado',
      ], 'Lo local tiene muchas ventajas, aunque para el clima importe más qué se come.', { d: 2 }),
      det('Leé este consejo y marcá lo equivocado.', [ // e7
        ['Si querés bajar tu huella, fijate primero en qué comés.', false],
        ['La carne de un campo cercano tiene huella casi cero porque no viaja.', true, 'El transporte es menos del 1 % de su huella; la producción es casi todo.'],
        ['Los alimentos que llegan en avión pueden tener una huella de transporte alta.', false],
        ['El envase es siempre lo que más pesa en la huella.', true, 'Suele ser una parte chica; la producción pesa mucho más.'],
      ], 'Qué, más que de dónde. Y el avión, como excepción.', { d: 3 }),
      comp('Completá.', 'En promedio, el transporte es solo alrededor del [6] % de la huella de la comida; la excepción es el [avión].', ['60', 'barco', 'tren'], 'La idea central de la lección, en una línea.', { d: 1 }),
      numv(3, (i) => { // e9
        const h = [100, 24, 10][i];
        const pct = [1, 3, 6][i];
        return {
          enunciado: `Un alimento tiene una huella de ${h} kg CO₂e por kilo, y el transporte es el ${pct} % de esa huella. ¿Cuántos kg CO₂e por kilo vienen del transporte?`,
          valor: (h * pct) / 100,
          unidad: 'kg CO₂e',
          dec: 2,
          explicacion: `${h} × ${pct} ÷ 100 = ${((h * pct) / 100).toLocaleString('es-AR')} kg CO₂e por kilo. El resto, ${(h - (h * pct) / 100).toLocaleString('es-AR')} kg, viene de otras etapas, sobre todo la producción.`,
        };
      }, { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Cambiar el plato', 'Sustituciones, porciones y costumbres: cómo bajar la huella de lo que comés sin perder nutrición ni placer.', [
      teoria('No es todo o nada', [
        'Bajar la huella de la alimentación no exige dejar de comer ningún alimento. Los cambios graduales en las proporciones del plato tienen mucho efecto: reemplazar parte de la carne vacuna por pollo, huevos o legumbres, reducir porciones, sumar verduras y no tirar comida.',
        'Como viste en el tronco, un cambio chico que se sostiene suele ganarle a un cambio enorme que se abandona a las dos semanas.',
      ]),
      rank('Ordená estos cambios para una persona que come carne vacuna todos los días, por cuánta huella ahorran, de más a menos.', [ // e1
        ['Reemplazar la carne vacuna por legumbres la mitad de los días', 'ahorro muy grande'],
        ['Reemplazar la carne vacuna por pollo la mitad de los días', 'ahorro grande'],
        ['Achicar un poco la porción de carne vacuna', 'ahorro moderado'],
        ['Comprar la misma carne en envase de papel', 'ahorro muy chico'],
      ], 'El orden sigue la escalera de huellas: cuanto más abajo en la escalera va el reemplazo, más se ahorra.', { d: 3 }),
      teoria('Sustituciones inteligentes', [
        'Algunas sustituciones mantienen la nutrición y bajan mucho la huella: guiso de lentejas en lugar de guiso de carne, hamburguesas de legumbres, tortillas de verdura con huevo, milanesas de pollo o de berenjena, rellenos de empanadas con verduras o legumbres.',
        'También cuenta la carne que se elige: pollo y cerdo tienen huellas mucho menores que la vacuna o el cordero.',
      ]),
      par('Uní cada comida con una sustitución de menor huella y buena nutrición.', [ // e2
        ['Guiso de carne', 'Guiso de lentejas con arroz'],
        ['Milanesa de carne', 'Milanesa de pollo'],
        ['Hamburguesa vacuna', 'Hamburguesa de porotos'],
        ['Empanadas de carne', 'Empanadas de verdura y huevo'],
      ], 'Platos familiares con otros ingredientes. Mantener la forma ayuda a que el cambio se sostenga.', { d: 1 }),
      numv(3, (i) => { // e3
        const dias = [3, 2, 4][i];
        const g = [150, 200, 120][i];
        return {
          enunciado: `Una persona reemplaza ${g} g de carne vacuna (100 kg CO₂e por kg) por ${g} g de lentejas (≈ 1 kg CO₂e por kg) ${dias} días por semana. ¿Cuántos kg CO₂e ahorra por semana?`,
          valor: Math.round(dias * (g / 1000) * 99 * 10) / 10,
          unidad: 'kg CO₂e',
          dec: 1,
          explicacion: `Por día: ${(g / 1000).toLocaleString('es-AR')} kg × (100 − 1) = ${((g / 1000) * 99).toLocaleString('es-AR')} kg CO₂e. Por semana: × ${dias} = ${(Math.round(dias * (g / 1000) * 99 * 10) / 10).toLocaleString('es-AR')} kg.`,
        };
      }, { d: 3 }),
      teoria('La comida también es cultura', [
        'En Argentina, el asado, las milanesas y el guiso de carne son parte de la identidad y de los encuentros. Cambiar la alimentación no significa renunciar a eso: significa pensar la frecuencia y las porciones, y descubrir otros platos que también son ricos y compartibles.',
        'Hablar de comida con respeto, sin juzgar el plato de otros, hace más probable que los cambios se contagien. Es lo que viste en el tronco sobre hablar de ambiente sin pelear.',
      ]),
      op('Un amigo dice que nunca va a dejar el asado del domingo. ¿Qué respuesta ayuda más a que la conversación siga?', [ // e4
        'Contarle qué cambios hiciste vos en la semana y por qué',
        'Decirle que el asado destruye el planeta y que debería dejarlo',
        ['No decir nada nunca sobre comida', 'Se puede hablar, sin juzgar: compartir la propia experiencia suele funcionar.'],
        'Mostrarle gráficos de emisiones durante el asado',
      ], 'Contar tu experiencia, sin exigir, abre la puerta. Además, el asado del domingo no es donde está la mayor parte de la huella semanal.', { d: 2 }),
      vf('Para bajar la huella de la alimentación hay que dejar de comer carne por completo.', false, 'Reducir la frecuencia y las porciones de carne vacuna, y elegir otras proteínas varios días, ya baja mucho la huella. No hace falta un todo o nada.', { // e5
        razones: ['+Porque reducir y sustituir ya baja mucho la huella', '-Porque la carne no tiene huella', '-Porque solo cuenta el transporte'],
        d: 2,
      }),
      teoria('No tirar comida', [
        'La comida que se tira arrastra toda su huella sin haber alimentado a nadie. Tirar medio kilo de carne vacuna equivale a unos 50 kg de CO₂e desperdiciados. Por eso aprovechar sobras y comprar lo justo también es parte de cambiar el plato.',
      ]),
      numv(3, (i) => { // e6
        const g = [500, 300, 200][i];
        return {
          enunciado: `Se echan a perder ${g} g de carne vacuna que estaban en la heladera. Con 100 kg CO₂e por kilo, ¿cuántos kg CO₂e se desperdiciaron?`,
          valor: (g / 1000) * 100,
          unidad: 'kg CO₂e',
          explicacion: `${(g / 1000).toLocaleString('es-AR')} × 100 = ${(g / 1000) * 100} kg CO₂e sin alimentar a nadie. Los alimentos de mayor huella son los que más importa no tirar.`,
        };
      }, { d: 2 }),
      clas('¿Este cambio baja la huella de la alimentación o no?', { // e7
        'Baja la huella': ['Comer legumbres dos veces por semana', 'Aprovechar las sobras del asado en empanadas', 'Elegir pollo en lugar de carne vacuna algunos días'],
        'No la baja o casi nada': ['Comprar carne vacuna local en vez de la del súper', 'Cambiar la bandeja de la carne por una de papel', 'Comprar más carne en oferta aunque se eche a perder'],
      }, 'Lo que baja la huella es cambiar qué y cuánto se come, y no tirar. El origen y el envase de la carne cambian poco.', { d: 3 }),
      mult('¿Qué ayuda a que un cambio de alimentación se sostenga? Marcá todo lo que corresponde.', [ // e8
        '+Empezar con uno o dos días por semana',
        '+Elegir platos que ya te gustan con otros ingredientes',
        '+Planificar las compras de la semana',
        '+Cocinar en familia o con amigos',
        '-Cambiar todo de golpe el primer día',
      ], 'Los hábitos se arman de a poco, como viste en el tronco: disparador, rutina y recompensa.', { d: 2 }),
      det('Leé este plan personal y marcá lo que no conviene.', [ // e9
        ['Los lunes y jueves, legumbres en lugar de carne vacuna.', false],
        ['Voy a dejar de comer todo de origen animal mañana mismo, sin planificar.', true, 'Los cambios bruscos sin planificación suelen abandonarse y pueden descuidar la nutrición.'],
        ['Las sobras del domingo, en empanadas del lunes.', false],
        ['Voy a comprar carne solo en carnicerías del barrio para que no emita.', true, 'El origen cambia poco la huella de la carne; importa cuánta y cuál.'],
      ], 'Un buen plan es gradual, rico y apunta a lo que más pesa.', { d: 3 }),
      comp('Completá.', 'Reemplazar carne [vacuna] por [legumbres] algunos días baja mucho la huella, y no tirar comida evita desperdiciar su [huella].', ['de pollo', 'gaseosas', 'envase'], 'Las tres palancas del plato, resumidas en una línea.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: la huella de lo que comemos', 'Ciclo de vida, comparaciones, transporte y cambios en el plato, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: la semana de los Ferreyra', 'Calculá la huella de las proteínas de una familia en una semana y armá un plan realista para bajarla.', [
      teoria('La semana de los Ferreyra', [
        'Los Ferreyra son cuatro. En una semana comen 3 kg de carne vacuna, 1 kg de pollo, 12 huevos (unos 0,7 kg), 0,5 kg de queso y casi nada de legumbres. Tiran alrededor de 0,5 kg de carne vacuna por semana que se echa a perder.',
        'Usá estos promedios por kilo: carne vacuna 100 kg CO₂e, pollo 10, huevos 4,7, queso 24, lentejas 1.',
      ]),
      num('¿Cuántos kg CO₂e por semana emite la carne vacuna que compran los Ferreyra?', 300, 'kg CO₂e', '3 kg × 100 = 300 kg CO₂e por semana, solo de carne vacuna.', { ctx: '3 kg de carne vacuna por semana; 100 kg CO₂e por kg.', d: 1 }),
      num('¿Cuántos kg CO₂e por semana suman las proteínas de los Ferreyra en total? Redondeá a un decimal.', 325.3, 'kg CO₂e', 'Carne 300 + pollo 10 + huevos 0,7 × 4,7 ≈ 3,3 + queso 0,5 × 24 = 12. Total ≈ 325,3 kg CO₂e. La carne vacuna es el 92 %.', { ctx: 'Carne vacuna 3 kg (100), pollo 1 kg (10), huevos 0,7 kg (4,7), queso 0,5 kg (24).', dec: 1, tol: 0.3, d: 3 }),
      num('¿Cuántos kg CO₂e por semana se desperdician con la carne que tiran?', 50, 'kg CO₂e', '0,5 kg × 100 = 50 kg CO₂e desperdiciados por semana: 2,6 toneladas por año sin alimentar a nadie.', { ctx: 'Tiran 0,5 kg de carne vacuna por semana.', d: 2 }),
      rank('Ordená los cambios posibles por cuánta huella semanal ahorran, de más a menos.', [ // e4
        ['Reemplazar 1,5 kg de carne vacuna por lentejas', '≈ 148 kg CO₂e'],
        ['Reemplazar 1 kg de carne vacuna por pollo', '≈ 90 kg CO₂e'],
        ['Dejar de tirar la carne que se echa a perder (comprar 0,5 kg menos)', '≈ 50 kg CO₂e'],
        ['Comprar el queso en envase de papel', 'casi nada'],
      ], 'Cambiar qué se come y no tirar son los cambios grandes. El envase, casi nada.', { d: 4 }),
      numv(3, (i) => { // e5
        const kgL = [1.5, 1, 2][i];
        return {
          enunciado: `Si los Ferreyra reemplazan ${kgL.toLocaleString('es-AR')} kg de carne vacuna por la misma cantidad de lentejas y dejan de tirar los 0,5 kg de carne, ¿cuántos kg CO₂e por semana emite ahora su carne vacuna?`,
          valor: (3 - kgL - 0.5) * 100,
          unidad: 'kg CO₂e',
          explicacion: `Compran ${(3 - kgL - 0.5).toLocaleString('es-AR')} kg de carne vacuna: × 100 = ${(3 - kgL - 0.5) * 100} kg CO₂e, contra 300 de antes. Las lentejas suman apenas ${kgL.toLocaleString('es-AR')} kg CO₂e.`,
        };
      }, { d: 3 }),
      op('La familia duda porque en casa aman la carne. ¿Qué plan tiene más chances de sostenerse?', [ // e6
        'Dos días de legumbres y comprar lo justo para no tirar',
        'Dejar toda la carne desde el lunes, sin excepciones',
        ['No cambiar nada porque el asado es cultura', 'Se puede mantener el asado y bajar mucho la huella el resto de la semana.'],
        'Comprar carne local para compensar sin cambiar el menú',
      ], 'Un cambio gradual, que respeta los gustos y ataca lo que más pesa, es el que dura.', { d: 3 }),
      det('Los Ferreyra escriben su plan. Marcá lo que no conviene.', [ // e7
        ['Martes y jueves, guiso de lentejas con arroz.', false],
        ['Como el transporte es lo que más pesa, compramos carne en el campo del tío.', true, 'El transporte es menos del 1 % de la huella de la carne vacuna.'],
        ['Hacemos lista de compras para no tirar carne.', false],
        ['Reemplazamos la carne por más queso, que es un lácteo liviano.', true, 'El queso tiene una huella alta, unos 24 kg CO₂e por kilo.'],
      ], 'Un buen plan cambia qué se come, compra lo justo y no reemplaza un alimento de huella alta por otro.', { d: 4 }),
    ]),
  ],
});
