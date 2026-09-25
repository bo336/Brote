import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// ENERGÍA 6 — La transición energética en Argentina.
// La matriz energética y eléctrica del país, el debate sobre el gas de Vaca
// Muerta, las renovables y la Ley 27.191, la pobreza energética y cómo sería
// una transición justa y posible. Cierra la rama: retoma la red (energia-5),
// las renovables (energia-4), los costos ocultos y los subsidios (consumo-4)
// y la justicia ambiental (comunidad-3).

export default unidad({
  slug: 'energia-6',
  rama: 'energia',
  orden: 6,
  nivel: 3,
  requiereTronco: 3,
  titulo: 'La transición energética en Argentina',
  bajada: 'Gas de Vaca Muerta, viento patagónico, sol del noroeste y hogares que usan garrafa: de dónde partimos, qué se discute y cómo sería una transición justa y posible.',
  objetivos: [
    'Describir la matriz energética primaria y la matriz eléctrica argentinas',
    'Analizar los argumentos del debate sobre el gas de Vaca Muerta',
    'Evaluar el avance de las renovables frente a la meta de la Ley 27.191',
    'Explicar la pobreza energética y sus diferencias regionales',
    'Diseñar una hoja de ruta de transición que combine clima, economía y justicia',
  ],
  repasa: ['energia-5', 'energia-4', 'consumo-4', 'comunidad-3'],
  fuentes: ['argendata-transicion', 'cammesa', 'ley-27191-renovables', 'renovables-2025-ar', 'balanza-energetica-2024', 'iea-metano-2025', 'censo-gas-2022', 'inventario-gei-ar'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('De dónde partimos', 'La energía primaria del país y la electricidad: dos matrices distintas que conviene no confundir.', [
      teoria('Dos matrices', [
        'La matriz energética primaria incluye toda la energía que usa el país: la que se quema en autos, camiones, industrias, calefacción y cocinas, y la que se usa para generar electricidad. En Argentina, el gas natural aporta alrededor de la mitad de esa energía y el petróleo cerca de un tercio: es una de las matrices más gasíferas del mundo.',
        'La matriz eléctrica es solo la parte que se convierte en electricidad. Allí, en 2024, alrededor de la mitad vino de centrales térmicas (mayormente a gas), cerca de un cuarto de grandes represas, alrededor del 16 % de renovables como el viento y el sol, y cerca del 8 % de centrales nucleares.',
      ], {
        datos: barras('Matriz eléctrica argentina, 2024 (aproximado)', '%', [
          ['Térmica (mayormente gas)', 51],
          ['Hidráulica de gran escala', 25],
          ['Renovables (eólica, solar y otras)', 16],
          ['Nuclear', 8],
        ], 'CAMMESA; valores redondeados que varían según el año hidrológico.'),
      }),
      clas('¿Esto forma parte solo de la matriz primaria o también de la matriz eléctrica?', { // e1
        'Solo de la primaria (no pasa por la red eléctrica)': ['Nafta que carga un auto', 'Gas que se quema en una cocina', 'Gasoil de un camión'],
        'También de la eléctrica': ['Gas que se quema en una central térmica', 'Agua que mueve una represa', 'Viento que mueve un aerogenerador'],
      }, 'La electricidad es solo una parte de la energía: el transporte y la calefacción a gas quedan fuera de la matriz eléctrica.', { d: 2 }),
      rank('Ordená las fuentes de la matriz eléctrica argentina de 2024, de mayor a menor aporte.', [ // e2
        ['Térmica, mayormente gas', '≈ 51 %'],
        ['Hidráulica de gran escala', '≈ 25 %'],
        ['Renovables como viento y sol', '≈ 16 %'],
        ['Nuclear', '≈ 8 %'],
      ], 'Casi la mitad de la electricidad ya viene de fuentes que no queman combustibles fósiles.', { d: 1 }),
      op('Si toda la electricidad del país fuera renovable, ¿se resolverían las emisiones de energía de Argentina?', [ // e3
        'No: transporte y calefacción usan combustibles directamente',
        'Sí, porque toda la energía es electricidad',
        ['Sí, porque los autos no emiten', 'Los autos a nafta y gasoil emiten, y no pasan por la red.'],
        'No, porque la electricidad renovable emite más que el gas',
      ], 'Por eso la transición incluye electrificar usos (autos, calefacción con bombas de calor) además de limpiar la red.', { d: 3 }),
      numv(3, (i) => { // e4
        const [total, fosil] = [[100, 51], [150000, 76500], [140000, 72000]][i];
        return {
          enunciado: [
            `Si de cada ${total} MWh de electricidad, ${fosil} vienen de centrales térmicas, ¿qué porcentaje no viene de combustibles fósiles?`,
            `En un año se generan ${total.toLocaleString('es-AR')} GWh y ${fosil.toLocaleString('es-AR')} GWh son térmicos. ¿Qué porcentaje es de otras fuentes? Redondeá al entero.`,
            `Si la generación total es de ${total.toLocaleString('es-AR')} GWh y la térmica de ${fosil.toLocaleString('es-AR')} GWh, ¿qué porcentaje aportan hidráulica, nuclear y renovables juntas? Redondeá al entero.`,
          ][i],
          valor: Math.round(((total - fosil) / total) * 100),
          unidad: '%',
          tol: 1,
          explicacion: `(${total.toLocaleString('es-AR')} − ${fosil.toLocaleString('es-AR')}) ÷ ${total.toLocaleString('es-AR')} × 100 ≈ ${Math.round(((total - fosil) / total) * 100)} %. Casi la mitad de la electricidad ya no depende de quemar combustibles.`,
          ctx: `Total ${total}; térmica ${fosil}.`,
        };
      }, { d: 2 }),
      teoria('Electrificar', [
        'Como la electricidad puede generarse sin emisiones y los motores y bombas de calor eléctricos son muy eficientes, una estrategia central de la transición es electrificar: pasar a la electricidad usos que hoy queman combustibles, como el transporte o la calefacción. Pero electrificar solo reduce emisiones si, al mismo tiempo, la electricidad se vuelve más limpia.',
      ]),
      cad('Armá la cadena de por qué electrificar y limpiar la red van juntos.', [ // e5
        'Se pasan autos y calefacción a electricidad',
        'Aumenta la demanda eléctrica',
        'Si esa electricidad viene de renovables, bajan las emisiones',
        'Si viene de más gas, la mejora es menor',
        'Por eso hay que sumar renovables al mismo ritmo',
      ], ['Electrificar reduce la demanda eléctrica'], 'Electrificar sin limpiar la red es cambiar el lugar de la chimenea.', { d: 3 }),
      par('Uní cada concepto con su definición.', [ // e6
        ['Matriz primaria', 'Toda la energía que usa el país'],
        ['Matriz eléctrica', 'De dónde viene la electricidad'],
        ['Electrificar', 'Pasar usos a electricidad'],
        ['Energía firme', 'Disponible cuando se la necesita'],
      ], 'Conceptos para no mezclar las discusiones sobre energía.', { d: 1 }),
      vf('En Argentina, la mayor parte de la energía primaria viene de fuentes renovables.', false, 'El gas natural aporta alrededor de la mitad y el petróleo cerca de un tercio: la matriz primaria es mayormente fósil, aunque la eléctrica esté más diversificada.', { // e7
        razones: ['+Porque el gas y el petróleo aportan la mayor parte', '-Porque Argentina no usa gas', '-Porque la matriz primaria es solo electricidad'],
        d: 1,
      }),
      mult('¿Qué acciones reducen las emisiones de la energía en Argentina? Marcá todas.', [ // e8
        '+Sumar renovables a la red',
        '+Electrificar transporte y calefacción con red limpia',
        '+Mejorar la eficiencia de viviendas e industrias',
        '+Reducir las fugas de metano en la cadena del gas',
        '-Pasar centrales de gas a gasoil',
      ], 'La transición combina limpiar, electrificar, ahorrar y controlar el metano.', { d: 2 }),
      est('Estimá qué porcentaje de la energía primaria de Argentina aporta el gas natural.', 50, { min: 0, max: 100, paso: 5, unidad: '%' }, 'Alrededor de la mitad: Argentina tiene una de las matrices primarias más dependientes del gas del mundo.', { d: 2 }),
      det('Leé este resumen y marcá lo equivocado.', [ // e9
        ['El gas natural aporta alrededor de la mitad de la energía primaria.', false],
        ['Casi toda la electricidad argentina viene de centrales nucleares.', true, 'La nuclear aporta cerca del 8 %.'],
        ['Cerca de un cuarto de la electricidad viene de grandes represas.', false],
        ['Si la red fuera 100 % renovable, desaparecerían todas las emisiones de energía.', true, 'Transporte y calefacción siguen quemando combustibles si no se electrifican.'],
      ], 'Tener los datos claros evita discusiones con números equivocados.', { d: 2 }),
      comp('Completá.', 'Toda la energía que usa un país forma la matriz [primaria]; en Argentina, alrededor de la mitad viene del [gas]; y pasar usos a la electricidad se llama [electrificar].', ['eléctrica', 'carbón', 'importar'], 'Tres claves para entender de dónde parte la transición argentina.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('El gas de Vaca Muerta', 'Dólares, empleo y seguridad energética de un lado; metano, bloqueo y riesgos del otro: el debate sobre el gas.', [
      teoria('Qué es Vaca Muerta', [
        'Vaca Muerta es una formación geológica de Neuquén y provincias vecinas que contiene enormes recursos de gas y petróleo no convencionales, que se extraen con perforación horizontal y fractura hidráulica. Su desarrollo creció mucho en la última década. En 2024, impulsada por Vaca Muerta, Argentina tuvo un superávit comercial energético de unos 5.668 millones de dólares: exportó energía por unos 9.677 millones e importó por unos 4.009 millones, después de años de déficit.',
      ]),
      num('Si Argentina exportó energía por 9.677 millones de dólares e importó por 4.009 millones en 2024, ¿cuál fue el superávit, en millones de dólares?', 5668, 'millones de dólares', '9.677 − 4.009 = 5.668 millones de dólares, el mayor superávit energético en muchos años.', { ctx: 'Exportaciones 9.677; importaciones 4.009 millones de dólares.', d: 1 }),
      teoria('Los argumentos a favor', [
        'Quienes impulsan el gas destacan que genera divisas, empleo y recaudación, que da seguridad energética al no depender de importaciones, que el gas emite menos CO₂ que el carbón y el petróleo al quemarse, y que exportado como gas natural licuado podría reemplazar carbón en otros países. También que las centrales a gas pueden dar la energía firme que las renovables necesitan como respaldo.',
      ]),
      teoria('Los argumentos en contra o de precaución', [
        'Quienes piden cautela señalan que el metano que se escapa en la extracción y el transporte calienta mucho y puede achicar o anular la ventaja del gas; que invertir en infraestructura que dura décadas puede bloquear la transición; que si el mundo reduce el uso de fósiles, esas inversiones pueden perder valor (activos varados); y los impactos locales del fracking: uso de agua y arena, tránsito de camiones, residuos y efectos sobre comunidades.',
      ]),
      clas('¿Es un argumento a favor del gas o de precaución?', { // e1
        'A favor': ['Genera divisas por exportaciones', 'Da seguridad energética', 'Puede dar respaldo firme a las renovables'],
        'De precaución': ['Las fugas de metano calientan mucho', 'Infraestructura que puede bloquear la transición', 'Riesgo de activos varados si baja la demanda mundial'],
      }, 'Un debate serio pone todos los argumentos sobre la mesa y los pesa con datos.', { d: 2 }),
      teoria('El metano, la clave', [
        'Según la Agencia Internacional de Energía, la industria del petróleo y el gas emite grandes cantidades de metano por fugas, venteos y quemas incompletas, y una parte importante de esas emisiones se puede evitar con tecnologías que ya existen, muchas veces a bajo costo o incluso con ganancia, porque el gas que no se escapa se puede vender. Controlar el metano es una de las formas más rápidas de reducir el calentamiento en las próximas décadas.',
      ]),
      cad('Armá la cadena de por qué las fugas de metano pueden anular la ventaja del gas.', [ // e2
        'Al quemarse, el gas emite menos CO₂ que el carbón',
        'Pero en la extracción y el transporte se escapa metano',
        'El metano calienta mucho más que el CO₂ en el corto plazo',
        'Si las fugas son grandes, el balance total empeora',
        'La ventaja climática del gas se achica o desaparece',
      ], ['Las fugas de metano enfrían la atmósfera'], 'La ventaja del gas depende de cuánto se escapa: medir y controlar el metano es decisivo.', { d: 3 }),
      op('¿Qué medida mejora el balance climático del gas sin dejar de producirlo?', [ // e3
        'Detectar y reparar fugas, y evitar venteos',
        'Aumentar la quema de gas en antorcha sin control',
        ['Dejar de medir las emisiones para ahorrar', 'Sin medir no se sabe qué reparar.'],
        'Reemplazar gas por carbón en las centrales',
      ], 'Controlar el metano es barato comparado con su efecto: una de las mejores inversiones climáticas.', { d: 2 }),
      mult('¿Qué impactos locales de la extracción no convencional conviene controlar? Marcá todos.', [ // e3b
        '+El uso de agua y su tratamiento',
        '+El tránsito intenso de camiones',
        '+Los residuos de la perforación',
        '+Los efectos sobre comunidades cercanas',
        '-La cantidad de turistas en la costa atlántica',
      ], 'Además del clima, la actividad tiene impactos locales que requieren control y participación.', { d: 2 }),
      par('Uní cada concepto con su definición.', [ // e4
        ['Fractura hidráulica', 'Inyectar agua, arena y aditivos para liberar gas de la roca'],
        ['Activo varado', 'Inversión que pierde valor antes de lo previsto'],
        ['Bloqueo', 'Infraestructura que ata el futuro a una tecnología'],
        ['Venteo', 'Liberar gas a la atmósfera sin quemarlo'],
      ], 'Vocabulario clave del debate sobre el gas.', { d: 2 }),
      vf('El gas natural es una energía limpia sin impacto climático.', false, 'Emite CO₂ al quemarse, aunque menos que el carbón, y sus fugas de metano pueden aumentar mucho su impacto. Es un combustible fósil.', { // e5
        razones: ['+Porque emite CO₂ y sus fugas de metano calientan', '-Porque el gas no emite nada al quemarse', '-Porque el gas es renovable'],
        d: 1,
      }),
      numv(3, (i) => { // e6
        const [prod, fuga] = [[100, 2], [100, 3], [100, 1]][i];
        const co2e = Math.round((prod * fuga) / 100 * 28 * 10) / 10;
        return {
          enunciado: `Si de ${prod} toneladas de metano producidas se escapa el ${fuga} %, ¿cuántas toneladas de CO₂e representan esas fugas, si el metano vale 28 veces el CO₂?`,
          valor: co2e,
          unidad: 't CO₂e',
          dec: 1,
          tol: 0.1,
          explicacion: `${prod} × ${fuga} % = ${(prod * fuga) / 100} t de metano × 28 = ${co2e.toLocaleString('es-AR')} t CO₂e. Pequeños porcentajes de fuga pesan mucho en el balance.`,
          ctx: `${prod} t de metano; fuga del ${fuga} %; potencial 28.`,
        };
      }, { d: 2 }),
      rank('Ordená estas opciones para cubrir la demanda firme de una red con muchas renovables, de la de menores emisiones a la de mayores.', [ // e7
        ['Baterías cargadas con renovables', 'mínimas'],
        ['Gas con control estricto de metano', 'moderadas'],
        ['Gas con muchas fugas', 'altas'],
        ['Gasoil en turbinas viejas', 'muy altas'],
      ], 'Aun dentro del gas, la forma de producirlo cambia mucho el resultado.', { d: 3, extremos: ['Menos emisiones', 'Más emisiones'] }),
      det('Leé este debate televisivo y marcá lo que no se sostiene.', [ // e8
        ['Vaca Muerta ayudó a revertir el déficit energético.', false],
        ['El gas no tiene ningún impacto climático porque es natural.', true, 'Es un fósil: emite CO₂ y metano.'],
        ['Controlar las fugas de metano mejora mucho el balance del gas.', false],
        ['Si invertimos en gas, nunca hará falta pensar en la transición.', true, 'Las inversiones de décadas pueden quedar varadas si baja la demanda de fósiles.'],
      ], 'El debate sobre el gas mejora cuando se reconocen beneficios y riesgos con datos.', { d: 2 }),
      comp('Completá.', 'La técnica para extraer gas no convencional se llama fractura [hidráulica]; una inversión que pierde valor antes de tiempo es un activo [varado]; y el gas que se escapa sin quemarse es [metano].', ['eléctrica', 'dorado', 'oxígeno'], 'Tres conceptos para entender el debate sobre el gas.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Viento, sol y una ley', 'La Ley 27.191, los recursos renovables del país y cuánto se avanzó hacia la meta del 20 %.', [
      teoria('La Ley 27.191', [
        'En 2015, la Ley 27.191 fijó metas para que una parte creciente de la electricidad viniera de fuentes renovables, hasta llegar al 20 % del consumo a fines de 2025. Para cumplirla hubo licitaciones públicas y un mercado para que las empresas compren energía renovable directamente. En pocos años se construyeron decenas de parques eólicos y solares.',
      ]),
      teoria('Cuánto se avanzó', [
        'Según los datos de CAMMESA, a fines de 2024 las renovables cubrieron un récord de alrededor del 16 % de la demanda eléctrica, y en 2025 se sumaron más de 1.000 MW nuevos: en diciembre de 2025 cubrieron cerca del 19,6 % de la demanda de ese mes. En algunos momentos de mucho viento y sol, llegaron a cubrir más de un tercio de la demanda.',
      ], { destacado: { valor: '≈ 19,6 %', texto: 'de la demanda eléctrica de diciembre de 2025 fue cubierta con renovables, según datos de CAMMESA.' } }),
      numv(3, (i) => { // e1
        const [meta, real] = [[20, 16.1], [20, 19.6], [20, 17.5]][i];
        return {
          enunciado: `Si la meta es cubrir el ${meta} % de la demanda con renovables y se cubre el ${real.toLocaleString('es-AR')} %, ¿cuántos puntos porcentuales faltan?`,
          valor: Math.round((meta - real) * 10) / 10,
          unidad: 'puntos porcentuales',
          dec: 1,
          tol: 0.1,
          explicacion: `${meta} − ${real.toLocaleString('es-AR')} = ${(Math.round((meta - real) * 10) / 10).toLocaleString('es-AR')} puntos. Cerca de la meta, pero con el desafío de las líneas de transmisión para seguir creciendo.`,
          ctx: `Meta ${meta} %; cobertura ${real} %.`,
        };
      }, { d: 1 }),
      teoria('Recursos de primera', [
        'Argentina tiene recursos renovables excepcionales. En la Patagonia, el viento es tan constante que muchos parques eólicos tienen factores de capacidad cercanos al 50 %, entre los más altos del mundo. En el noroeste, en la Puna, la radiación solar está entre las más altas del planeta. El desafío no es el recurso, sino llevar esa energía a donde se consume y financiar las obras.',
      ]),
      par('Uní cada región con su recurso destacado.', [ // e2
        ['Patagonia', 'Viento fuerte y constante'],
        ['Noroeste y Puna', 'Radiación solar muy alta'],
        ['Comahue y Litoral', 'Grandes ríos y represas'],
        ['Zonas agrícolas', 'Biomasa y biogás de residuos'],
      ], 'Cada región aporta un recurso distinto: la red los une.', { d: 2 }),
      numv(3, (i) => { // e3
        const [mw, fc] = [[100, 50], [50, 45], [200, 40]][i];
        return {
          enunciado: `Un parque eólico de ${mw} MW tiene un factor de capacidad del ${fc} %. ¿Cuántos MWh genera en un año de 8.760 horas?`,
          valor: Math.round(mw * 8760 * fc / 100),
          unidad: 'MWh',
          tol: 1,
          explicacion: `${mw} × 8.760 × ${fc} % = ${Math.round(mw * 8760 * fc / 100).toLocaleString('es-AR')} MWh por año. Lo viste con el viento: el factor de capacidad define cuánto rinde un parque.`,
          ctx: `${mw} MW; factor de capacidad ${fc} %; 8.760 horas.`,
        };
      }, { d: 2 }),
      cad('Armá la cadena de por qué el crecimiento de las renovables se frenó en algunas regiones.', [ // e4
        'Los mejores vientos están lejos de las ciudades',
        'Se construyen muchos parques en esas zonas',
        'Las líneas que salen de la región se llenan',
        'Los parques nuevos no tienen por dónde enviar su energía',
        'Sin nuevas líneas, se frena la instalación',
      ], ['Se frena porque el viento dejó de soplar'], 'El recurso sobra; lo que falta es la red. Lo viste en la unidad anterior.', { d: 2 }),
      op('¿Cuál es hoy el principal límite para sumar más renovables en Argentina?', [ // e5
        'La capacidad de las líneas de transmisión',
        'La falta de viento y de sol en el país',
        ['Que las renovables son más caras que el gasoil', 'En general, hoy generan a costos competitivos.'],
        'Que la ley prohíbe nuevos parques',
      ], 'Con recursos de primera, el cuello de botella es la infraestructura de red.', { d: 2 }),
      vf('Argentina tiene recursos eólicos y solares entre los mejores del mundo.', true, 'La Patagonia tiene vientos con factores de capacidad cercanos al 50 % y la Puna, una radiación solar de las más altas del planeta.', { // e6
        razones: ['+Por el viento patagónico y el sol de la Puna', '-Porque en Argentina no hay viento', '-Porque el sol solo brilla en otros países'],
        d: 1,
      }),
      clas('¿Esto impulsó o frenó a las renovables en Argentina?', { // e7
        'Impulsó': ['Las metas de la Ley 27.191', 'Las licitaciones públicas de energía renovable', 'Los contratos de empresas que compran renovables'],
        'Frenó': ['Líneas de transmisión saturadas', 'Dificultades para financiar obras'],
      }, 'Las políticas dieron el empujón; la red y el financiamiento marcan el ritmo.', { d: 2 }),
      mult('¿Qué haría falta para que las renovables sigan creciendo en Argentina? Marcá todo.', [ // e8
        '+Nuevas líneas de alta tensión',
        '+Almacenamiento en los nodos críticos',
        '+Financiamiento a largo plazo',
        '+Reglas estables para invertir',
        '-Prohibir nuevos parques en la Patagonia',
      ], 'Red, almacenamiento, financiamiento y reglas claras son la base del próximo salto.', { d: 1 }),
      est('Estimá qué porcentaje de la demanda eléctrica cubrieron las renovables en diciembre de 2025, según datos de CAMMESA.', 19.6, { min: 0, max: 100, paso: 0.1, unidad: '%' }, 'Cerca del 19,6 %, muy cerca de la meta del 20 % de la Ley 27.191.', { d: 2 }),
      det('Leé este artículo y marcá lo equivocado.', [ // e9
        ['La Ley 27.191 fijó una meta del 20 % de renovables para 2025.', false],
        ['Las renovables no superaron nunca el 5 % de la demanda.', true, 'En diciembre de 2025 cubrieron cerca del 19,6 %.'],
        ['En la Patagonia hay parques con factores de capacidad cercanos al 50 %.', false],
        ['El principal límite para sumar renovables es la falta de viento.', true, 'El principal límite es la capacidad de transmisión.'],
      ], 'Los datos muestran un avance importante y un cuello de botella claro.', { d: 2 }),
      comp('Completá.', 'La ley de fomento de las renovables es la Ley [27.191]; su meta era el [20] % del consumo para 2025; y hoy el principal límite es la [transmisión].', ['26.331', '50', 'publicidad'], 'Tres datos clave sobre las renovables en Argentina.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Pobreza energética', 'Garrafas, leña, casas frías y facturas imposibles: la energía como derecho y sus desigualdades regionales.', [
      teoria('Qué es la pobreza energética', [
        'Un hogar está en pobreza energética cuando no puede acceder a los servicios de energía que necesita para una vida digna —calefacción, refrigeración, cocina, agua caliente, iluminación— o cuando pagarlos se lleva una parte desproporcionada de sus ingresos. No es solo falta de dinero: también influyen la calidad de la vivienda y el acceso a las redes.',
      ]),
      mult('¿Qué situaciones son señales de pobreza energética? Marcá todas.', [ // e1
        '+Pasar el invierno con la casa fría por no poder pagar la calefacción',
        '+Gastar una parte muy grande del ingreso en garrafas',
        '+Cocinar con leña en una casa sin ventilación',
        '-Tener calefacción y pagar una factura razonable',
        '-Elegir no usar aire acondicionado aunque se pueda pagar',
      ], 'La pobreza energética mezcla ingresos, vivienda y acceso a las redes.', { d: 1 }),
      teoria('Red de gas y garrafa', [
        'Según el Censo 2022, cerca del 38 % de la población vive en hogares sin conexión a la red de gas natural, y el 44 % usa principalmente gas en garrafa para cocinar. Las diferencias regionales son enormes: en La Pampa, Chubut y Neuquén más del 80 % de la población usa gas de red, mientras que en Formosa, Corrientes, Chaco y Misiones menos del 3 % lo hace. La garrafa suele ser más cara por unidad de energía que el gas de red, así que muchas veces los hogares con menos acceso pagan más.',
      ], {
        datos: barras('Población que usa principalmente gas de red para cocinar (Censo 2022)', '%', [
          ['La Pampa', 89.7],
          ['Chubut', 86],
          ['Neuquén', 83.8],
          ['Misiones', 2.5],
          ['Chaco', 1.2],
          ['Formosa', 0.9],
        ], 'INDEC, Censo 2022, según datos publicados por Infobae.'),
      }),
      rank('Ordená estas provincias según el porcentaje de población que usa gas de red, de mayor a menor.', [ // e2
        ['La Pampa', '≈ 90 %'],
        ['Neuquén', '≈ 84 %'],
        ['Misiones', '≈ 2,5 %'],
        ['Formosa', '≈ 1 %'],
      ], 'Una brecha enorme: en el noreste casi nadie tiene gas de red.', { d: 1 }),
      cad('Armá la cadena de por qué la falta de red de gas puede agravar la pobreza.', [ // e3
        'Un barrio no tiene red de gas natural',
        'Las familias usan garrafas',
        'La garrafa suele costar más por unidad de energía',
        'Gastan una parte mayor de su ingreso en energía',
        'Les queda menos para otras necesidades',
      ], ['La garrafa es siempre más barata que el gas de red'], 'Quienes tienen menos acceso a las redes a menudo pagan más por la energía.', { d: 2 }),
      numv(3, (i) => { // e4
        const [ingreso, gasto] = [[600000, 90000], [500000, 60000], [800000, 64000]][i];
        return {
          enunciado: `Un hogar tiene un ingreso de ${ingreso.toLocaleString('es-AR')} pesos por mes y gasta ${gasto.toLocaleString('es-AR')} en energía. ¿Qué porcentaje de su ingreso es?`,
          valor: Math.round((gasto / ingreso) * 100),
          unidad: '%',
          tol: 1,
          explicacion: `${gasto.toLocaleString('es-AR')} ÷ ${ingreso.toLocaleString('es-AR')} × 100 = ${Math.round((gasto / ingreso) * 100)} %. Un umbral usado a menudo para hablar de pobreza energética es el 10 % del ingreso.`,
          ctx: `Ingreso ${ingreso}; gasto en energía ${gasto}.`,
        };
      }, { d: 1 }),
      teoria('La vivienda importa', [
        'Una casa sin aislación, con techos de chapa y ventanas que no cierran bien pierde el calor en invierno y se recalienta en verano: necesita mucha más energía para estar confortable. Por eso, las políticas más efectivas contra la pobreza energética combinan ayudas para pagar la energía con mejoras en las viviendas: aislación de techos, burletes, ventanas, y artefactos eficientes.',
      ]),
      op('¿Qué medida reduce de forma duradera la pobreza energética de un hogar?', [ // e5
        'Aislar el techo y sellar las ventanas',
        'Regalar una garrafa por única vez',
        ['Subir la tarifa para que se consuma menos', 'Sin mejoras en la vivienda, solo empeora el problema.'],
        'Usar la cocina para calefaccionar la casa',
      ], 'Mejorar la vivienda baja el consumo necesario para siempre; la ayuda puntual alivia, pero no resuelve.', { d: 2 }),
      vf('Usar el horno de la cocina a gas para calefaccionar una casa cerrada es seguro.', false, 'Puede producir monóxido de carbono, un gas invisible y mortal. Lo viste con el aire de adentro: la calefacción necesita artefactos adecuados y ventilación.', { // e6
        razones: ['+Porque puede producir monóxido de carbono', '-Porque el gas no se quema en el horno', '-Porque el monóxido de carbono es inofensivo'],
        d: 1,
      }),
      clas('¿La medida ayuda a pagar la energía o reduce la energía necesaria?', { // e7
        'Ayuda a pagar': ['Tarifa social', 'Subsidio a la garrafa para hogares vulnerables'],
        'Reduce la energía necesaria': ['Aislación de techos', 'Burletes en puertas y ventanas', 'Heladera eficiente'],
      }, 'Las dos hacen falta: alivio inmediato y mejoras que duran.', { d: 1 }),
      vf('En general, la garrafa cuesta más por unidad de energía que el gas de red.', true, 'Por eso, muchas veces los hogares sin red de gas —que suelen tener menos ingresos— pagan más por la misma energía.', { // e7b
        razones: ['+Por el envase, la logística y la distribución', '-Porque la garrafa tiene otro tipo de energía', '-Porque el gas de red es siempre gratuito'],
        d: 2,
      }),
      det('Leé este diagnóstico y marcá lo equivocado.', [ // e8
        ['Cerca del 38 % de la población vive sin conexión a la red de gas.', false],
        ['En el noreste del país casi todos los hogares tienen gas de red.', true, 'En Formosa, Chaco, Corrientes y Misiones menos del 3 % lo usa.'],
        ['La calidad de la vivienda influye en cuánta energía se necesita.', false],
        ['La pobreza energética depende solo del precio de la energía.', true, 'También dependen el ingreso, la vivienda y el acceso a las redes.'],
      ], 'Un buen diagnóstico mira ingresos, viviendas y redes a la vez.', { d: 2 }),
      comp('Completá.', 'No poder pagar la energía necesaria para una vida digna es pobreza [energética]; según el Censo 2022, cerca del [38] % de la población no tiene red de gas; y aislar el [techo] reduce la energía necesaria.', ['hídrica', '8', 'garaje'], 'Tres claves de la pobreza energética en Argentina.', { d: 1 }),
      par('Uní cada problema con una solución.', [ // e10
        ['Casa fría por techo de chapa', 'Aislación del techo'],
        ['Factura imposible de pagar', 'Tarifa social focalizada'],
        ['Barrio sin red de gas', 'Extender la red o electrificar con bombas de calor'],
        ['Cocina a leña sin ventilación', 'Cocina eficiente y ventilación adecuada'],
      ], 'Cada situación de pobreza energética pide una respuesta específica.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Una transición justa y posible', 'Eficiencia, electrificación, renovables con red, metano bajo control y nadie afuera: una hoja de ruta.', [
      teoria('Primero, la eficiencia', [
        'La energía más limpia y barata es la que no se necesita. Mejorar la eficiencia de viviendas, industrias, alumbrado y transporte reduce emisiones, baja facturas y hace más fácil todo lo demás, porque cada unidad de energía limpia rinde más. Por eso muchas hojas de ruta empiezan por la eficiencia: normas para edificios nuevos, etiquetado de artefactos, programas de recambio y aislación.',
      ]),
      mult('¿Qué medidas de eficiencia reducen el consumo de energía? Marcá todas.', [ // e1
        '+Normas de aislación para edificios nuevos',
        '+Etiquetado de eficiencia en artefactos',
        '+Alumbrado público LED',
        '+Motores eficientes en las industrias',
        '-Subsidiar sin límite el consumo de energía',
      ], 'La eficiencia es la base: hace más baratas todas las demás medidas.', { d: 1 }),
      op('¿Por qué muchas hojas de ruta energéticas empiezan por la eficiencia?', [ // e1b
        'Abarata y facilita todas las demás medidas',
        'Porque es la única medida que reduce emisiones',
        ['Porque no requiere ninguna inversión', 'Requiere inversión, pero suele recuperarse rápido con el ahorro.'],
        'Porque así se evita sumar renovables',
      ], 'Cada unidad de energía que no se necesita es una que no hay que generar, transportar ni pagar.', { d: 1 }),
      teoria('Una hoja de ruta', [
        'Una transición energética posible en Argentina combinaría varias líneas a la vez: eficiencia; renovables con las líneas y el almacenamiento que necesitan; electrificación del transporte y de la calefacción donde sea conveniente; control estricto del metano en la producción de gas mientras se lo siga usando; y reglas estables que permitan financiar obras de largo plazo. Todo eso con metas medibles y revisión periódica.',
      ]),
      ord('Ordená una hoja de ruta por etapas para la energía de una provincia.', [ // e2
        'Diagnosticar consumos, emisiones y hogares vulnerables',
        'Lanzar programas de eficiencia y tarifa social focalizada',
        'Sumar renovables con líneas y almacenamiento',
        'Electrificar transporte público y calefacción donde convenga',
        'Medir resultados y ajustar metas cada año',
      ], 'Diagnóstico, medidas rápidas, infraestructura, electrificación y evaluación continua.', { d: 3 }),
      teoria('Transición justa', [
        'Una transición energética cambia economías enteras. Provincias como Neuquén dependen mucho de las regalías del petróleo y el gas, y miles de personas trabajan en esa industria. Una transición justa planifica con tiempo: diversifica las economías regionales, capacita a trabajadores para nuevos empleos, usa parte de los ingresos actuales para preparar el futuro y protege a los hogares vulnerables de subas bruscas.',
      ]),
      clas('¿Esta medida hace más justa la transición o la hace más injusta?', { // e3
        'Más justa': ['Capacitar a trabajadores del petróleo para nuevos empleos', 'Ahorrar parte de las regalías en un fondo para el futuro', 'Tarifa social para hogares vulnerables'],
        'Más injusta': ['Quitar subsidios de golpe sin ninguna ayuda', 'Cerrar actividades sin plan para los trabajadores'],
      }, 'La transición es más rápida y estable cuando nadie queda afuera.', { d: 2 }),
      numv(3, (i) => { // e4
        const [reg, pct] = [[1000, 10], [800, 15], [1500, 5]][i];
        return {
          enunciado: `Una provincia recibe ${reg.toLocaleString('es-AR')} millones de dólares de regalías por año y decide ahorrar el ${pct} % en un fondo para diversificar su economía. ¿Cuántos millones ahorra en 10 años, sin contar intereses?`,
          valor: (reg * pct) / 100 * 10,
          unidad: 'millones de dólares',
          explicacion: `${reg.toLocaleString('es-AR')} × ${pct} % = ${(reg * pct) / 100} por año; × 10 = ${((reg * pct) / 100 * 10).toLocaleString('es-AR')} millones. Un recurso para preparar el futuro cuando los ingresos fósiles bajen. Cifras de ejemplo.`,
          ctx: `${reg} millones por año; ahorro del ${pct} %; 10 años.`,
        };
      }, { d: 1 }),
      cad('Armá la cadena de cómo un fondo de regalías ayuda a una transición justa.', [ // e5
        'La provincia ahorra parte de sus regalías',
        'Invierte en educación, infraestructura y nuevas actividades',
        'Crecen otros sectores de la economía regional',
        'Cuando bajan los ingresos fósiles, la provincia depende menos de ellos',
        'Los trabajadores tienen otras opciones de empleo',
      ], ['La provincia gasta todo y espera que el petróleo dure para siempre'], 'Usar la riqueza de hoy para preparar la economía de mañana.', { d: 2 }),
      vf('Una transición energética rápida y una transición justa son objetivos opuestos.', false, 'Pueden reforzarse: cuando la transición protege a trabajadores y hogares, tiene más apoyo y es más estable. Las transiciones injustas generan resistencia y retrocesos.', { // e6
        razones: ['+Porque la justicia da apoyo y estabilidad a la transición', '-Porque la justicia no tiene relación con la energía', '-Porque las transiciones rápidas no afectan a nadie'],
        d: 3,
      }),
      par('Uní cada línea de la hoja de ruta con su objetivo.', [ // e7
        ['Eficiencia', 'Necesitar menos energía para lo mismo'],
        ['Renovables con red', 'Limpiar la electricidad'],
        ['Electrificación', 'Sacar combustibles de transporte y calefacción'],
        ['Control del metano', 'Reducir el calentamiento del gas que se siga usando'],
        ['Transición justa', 'Que nadie quede afuera del cambio'],
      ], 'Cinco líneas que se refuerzan entre sí: ninguna alcanza por sí sola.', { d: 2 }),
      rank('Ordená estas medidas según cuánto tardan en dar resultados, de la más rápida a la más lenta.', [ // e8
        ['Reparar fugas de metano', 'meses'],
        ['Programa de aislación de viviendas', 'uno o dos años'],
        ['Nuevos parques renovables', 'dos o tres años'],
        ['Líneas de transmisión y diversificación económica', 'muchos años'],
      ], 'Combinar medidas rápidas con obras lentas permite avanzar desde ya sin perder el largo plazo.', { d: 3, extremos: ['Más rápida', 'Más lenta'] }),
      det('Leé esta hoja de ruta y marcá lo que conviene corregir.', [ // e9
        ['Empezaremos por programas de eficiencia y tarifa social.', false],
        ['Electrificaremos todo aunque la red siga siendo mayormente a gas y sin sumar renovables.', true, 'Hay que limpiar la red al mismo ritmo para que electrificar reduzca emisiones.'],
        ['Controlaremos las fugas de metano en la producción de gas.', false],
        ['Los trabajadores del petróleo se arreglarán solos.', true, 'Una transición justa incluye capacitación y nuevas oportunidades.'],
      ], 'Una buena hoja de ruta es coherente: cada medida sostiene a las otras.', { d: 2 }),
      comp('Completá.', 'La energía más barata es la que no se necesita, por eso se empieza por la [eficiencia]; sacar combustibles del transporte y la calefacción es [electrificar]; y que nadie quede afuera del cambio es una transición [justa].', ['publicidad', 'importar', 'lenta'], 'Tres claves de una hoja de ruta energética.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: la transición energética en Argentina', 'Matrices, gas, renovables, pobreza energética y hoja de ruta, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el plan energético de la provincia', 'Una provincia del noreste sin red de gas y con mucho sol quiere un plan energético para los próximos diez años. Armalo con los datos.', [
      teoria('La situación', [
        'La provincia tiene 1,2 millones de habitantes. Menos del 3 % usa gas de red: la mayoría cocina con garrafa y muchas familias pasan frío en invierno o calor extremo en verano. Tiene mucho sol y un río con potencial para pequeños aprovechamientos. Su red eléctrica se corta en los picos de verano. El gobierno tiene presupuesto limitado y dos propuestas: extender la red de gas a toda la provincia, o combinar paneles solares, aislación de viviendas, bombas de calor eléctricas y refuerzos de la red eléctrica.',
      ]),
      mult('¿Qué ventajas tiene la segunda propuesta en esta provincia? Marcá todas.', [ // e1
        '+Aprovecha el sol abundante',
        '+Mejora el confort en invierno y en verano',
        '+No ata a la provincia a nueva infraestructura fósil',
        '+La aislación reduce la energía necesaria para siempre',
        '-No necesita reforzar la red eléctrica',
      ], 'Electrificar con sol y eficiencia puede ser una ruta directa para una provincia sin red de gas, pero exige reforzar la red eléctrica.', { d: 3 }),
      num('Si 1,2 millones de habitantes viven en hogares de 3 personas en promedio, ¿cuántos hogares hay?', 400000, 'hogares', '1.200.000 ÷ 3 = 400.000 hogares. Un programa de aislación que llegue a 40.000 hogares por año cubriría todos en 10 años.', { ctx: '1,2 millones de habitantes; 3 personas por hogar.', d: 1 }),
      num('Si un programa aísla 40.000 hogares por año, ¿en cuántos años llega a los 400.000?', 10, 'años', '400.000 ÷ 40.000 = 10 años: exactamente el horizonte del plan.', { ctx: '400.000 hogares; 40.000 por año.', d: 1 }),
      rank('Ordená las primeras medidas por prioridad.', [ // e4
        ['Tarifa social y aislación para los hogares más vulnerables', 'alivio y mejora duradera'],
        ['Refuerzo de la red eléctrica en los barrios que se cortan', 'evita cortes en los picos'],
        ['Paneles solares en edificios públicos y viviendas', 'energía local limpia'],
        ['Estudios para pequeños aprovechamientos del río', 'a mediano plazo'],
      ], 'Primero proteger a los más vulnerables y evitar cortes; después, sumar generación local y estudiar nuevas fuentes.', { d: 3 }),
      op('¿Por qué conviene reforzar la red eléctrica antes de promover bombas de calor en masa?', [ // e5
        'Porque aumentaría la demanda y podría haber más cortes',
        'Porque las bombas de calor no usan electricidad',
        ['Porque la red eléctrica funciona mejor sobrecargada', 'Una red sobrecargada se corta más.'],
        'Porque la ley lo prohíbe',
      ], 'Electrificar sin preparar la red puede agravar los cortes: las dos cosas van juntas.', { d: 2 }),
      vf('Extender la red de gas es la única forma de que una provincia sin gas mejore su acceso a la energía.', false, 'También es posible electrificar con renovables y eficiencia. Cuál conviene depende de costos, recursos, tiempos y objetivos climáticos: hay que comparar las opciones con datos.', { // e6
        razones: ['+Porque electrificar con renovables y eficiencia es otra ruta', '-Porque la electricidad no sirve para calefaccionar', '-Porque el gas es la única energía posible'],
        d: 2,
      }),
      det('El gobierno provincial redacta el plan. Marcá lo que conviene corregir.', [ // e7
        ['Priorizaremos a los hogares más vulnerables en la aislación.', false],
        ['Promoveremos bombas de calor sin reforzar la red.', true, 'Aumentaría los cortes: la red debe reforzarse a la par.'],
        ['Mediremos cada año el gasto en energía de los hogares.', false],
        ['No haremos consultas: el plan es técnico.', true, 'La participación mejora el diseño y la aceptación del plan.'],
      ], 'Un buen plan energético es técnico y también social.', { d: 3 }),
    ]),
  ],
});
