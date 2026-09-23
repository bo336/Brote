import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// MOVILIDAD 4 — Autos, eléctricos y combustibles.
// Qué sale del caño de escape y por qué un litro de nafta genera más de dos
// kilos de CO₂, nafta, gasoil, GNC y biocombustibles, el auto eléctrico en
// todo su ciclo de vida, lo que ningún motor resuelve (peso, partículas,
// espacio) y el marco evitar–cambiar–mejorar. Retoma la huella por viaje
// (movilidad-1), la electricidad (energia-3) y el efecto invernadero
// (aire-suelo-3).

export default unidad({
  slug: 'movilidad-4',
  rama: 'movilidad',
  orden: 4,
  nivel: 2,
  requiereTronco: 2,
  titulo: 'Autos, eléctricos y combustibles',
  bajada: 'Nafta, gasoil, GNC, biocombustibles y baterías: cuánto emite de verdad cada opción, qué resuelve el auto eléctrico y qué no resuelve ningún motor.',
  objetivos: [
    'Calcular las emisiones de un auto a partir de su consumo',
    'Comparar nafta, gasoil, GNC y biocombustibles con sus ventajas y límites',
    'Evaluar el auto eléctrico en todo su ciclo de vida',
    'Reconocer los problemas que ningún tipo de motor resuelve',
    'Aplicar el marco evitar–cambiar–mejorar a decisiones de movilidad',
  ],
  repasa: ['movilidad-1', 'movilidad-3', 'energia-3', 'aire-suelo-3'],
  fuentes: ['epa-auto-tipico', 'doe-eficiencia-ev', 'icct-ev-global', 'icct-ev', 'iea-ev-outlook', 'oecd-no-escape', 'ley-27640-biocombustibles', 'owid-transporte', 'oms-aire-exterior', 'cammesa'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Lo que sale del caño de escape', 'Por qué un litro de nafta genera más de dos kilos de CO₂, y qué otros contaminantes emite un motor.', [
      teoria('Más CO₂ que nafta', [
        'Un litro de nafta pesa unos 750 gramos, pero al quemarse produce unos 2,3 kilos de CO₂. ¿Cómo puede ser? La nafta está hecha sobre todo de carbono e hidrógeno. Al quemarse, cada átomo de carbono se une con dos átomos de oxígeno que vienen del aire. El oxígeno agrega mucho peso: por cada kilo de carbono se forman unos 3,7 kilos de CO₂.',
        'Según la Agencia de Protección Ambiental de EE. UU., quemar un galón de nafta (3,8 litros) produce unos 8,9 kilos de CO₂.',
      ]),
      op('¿Por qué un litro de nafta produce más CO₂ que su propio peso?', [ // e1
        'El carbono se une con oxígeno que viene del aire',
        'Porque la nafta se expande al calentarse',
        ['Porque el motor fabrica carbono nuevo', 'La materia no se crea: el peso extra es oxígeno del aire.'],
        'Porque el CO₂ se mide en volumen, no en peso',
      ], 'Lo viste en el tronco: la materia no desaparece ni se crea. El CO₂ suma el oxígeno que toma del aire.', { d: 2 }),
      numv(3, (i) => { // e2
        const [l100, km] = [[8, 100], [7, 250], [10, 40]][i];
        return {
          enunciado: `Un auto consume ${l100} litros de nafta cada 100 km. Si cada litro produce 2,3 kg de CO₂, ¿cuántos kilos emite en ${km} km? Redondeá a un decimal.`,
          valor: Math.round(((l100 * km) / 100) * 2.3 * 10) / 10,
          unidad: 'kg de CO₂',
          dec: 1,
          tol: 0.1,
          explicacion: `${l100} × ${km} ÷ 100 = ${(l100 * km) / 100} litros; × 2,3 = ${(Math.round(((l100 * km) / 100) * 2.3 * 10) / 10).toLocaleString('es-AR')} kg de CO₂. Cada litro ahorrado son 2,3 kg menos.`,
          ctx: `${l100} L/100 km; ${km} km; 2,3 kg por litro.`,
        };
      }, { d: 2 }),
      ejemplo('Un año de auto', 'Un auto recorre 12.000 km por año y consume 8 litros cada 100 km.', [
        'Litros por año: 12.000 × 8 ÷ 100 = 960 litros.',
        'CO₂ por año: 960 × 2,3 ≈ 2.200 kg, es decir, unas 2,2 toneladas.',
        'Por kilómetro: 8 × 2,3 ÷ 100 ≈ 0,18 kg, unos 184 gramos.',
      ], 'Un auto de uso diario puede emitir más de dos toneladas de CO₂ por año, solo por el caño de escape.'),
      numv(3, (i) => { // e3
        const [km, l100] = [[10000, 7], [15000, 9], [8000, 6]][i];
        return {
          enunciado: `Un auto recorre ${km.toLocaleString('es-AR')} km por año y consume ${l100} L cada 100 km. Con 2,3 kg de CO₂ por litro, ¿cuántas toneladas emite por año? Redondeá a un decimal.`,
          valor: Math.round(((km * l100) / 100) * 2.3 / 100) / 10,
          unidad: 't de CO₂',
          dec: 1,
          tol: 0.1,
          explicacion: `${((km * l100) / 100).toLocaleString('es-AR')} litros × 2,3 ≈ ${(((km * l100) / 100) * 2.3).toLocaleString('es-AR')} kg ≈ ${(Math.round(((km * l100) / 100) * 2.3 / 100) / 10).toLocaleString('es-AR')} t. Un auto de uso diario pesa mucho en la huella de un hogar.`,
          ctx: `${km} km/año; ${l100} L/100 km; 2,3 kg/L.`,
        };
      }, { d: 3 }),
      numv(3, (i) => { // e3b
        const kg = [1150, 1380, 2070][i];
        return {
          enunciado: `Un auto emitió ${kg.toLocaleString('es-AR')} kg de CO₂ en un año por el caño de escape. Si cada litro de nafta produce 2,3 kg, ¿cuántos litros quemó?`,
          valor: Math.round(kg / 2.3),
          unidad: 'litros',
          explicacion: `${kg.toLocaleString('es-AR')} ÷ 2,3 = ${Math.round(kg / 2.3)} litros. La misma cuenta, al revés: con la factura de combustible se puede estimar la huella del auto.`,
          ctx: `${kg} kg de CO₂ en un año; 2,3 kg por litro.`,
        };
      }, { d: 2 }),
      teoria('No solo CO₂', [
        'Además de CO₂, los motores emiten contaminantes que afectan la salud de quienes respiran cerca: óxidos de nitrógeno (sobre todo los motores diésel), partículas finas, monóxido de carbono y compuestos que forman ozono. El CO₂ es un problema global de clima; estos otros son un problema local de salud, en las calles donde vivimos.',
      ]),
      clas('¿Es un problema global de clima o local de salud?', { // e4
        'Clima global': ['CO₂ del caño de escape'],
        'Salud local': ['Óxidos de nitrógeno de un motor diésel', 'Partículas finas en una avenida', 'Monóxido de carbono en un garaje cerrado'],
      }, 'Un mismo auto genera los dos tipos de problema: por eso las soluciones deben mirar ambos.', { d: 2 }),
      par('Uní cada contaminante con su efecto principal.', [ // e5
        ['CO₂', 'Calentamiento global'],
        ['Óxidos de nitrógeno', 'Irritan las vías respiratorias y forman ozono'],
        ['Partículas finas', 'Penetran en los pulmones y la sangre'],
        ['Monóxido de carbono', 'Impide que la sangre transporte oxígeno'],
      ], 'Lo viste en la unidad del aire: cada contaminante afecta de forma distinta.', { d: 2 }),
      vf('Un auto que no larga humo visible no emite CO₂.', false, 'El CO₂ es invisible. Todo auto que quema combustible emite CO₂, se vea humo o no.', { // e6
        razones: ['+Porque el CO₂ es invisible', '-Porque el CO₂ siempre se ve como humo negro', '-Porque los autos nuevos no queman combustible'],
        d: 1,
      }),
      est('Estimá cuántas toneladas de CO₂ emite por año un auto típico en Estados Unidos, según la EPA.', 4.6, { min: 0.1, max: 50, unidad: 't', escala: 'log' }, 'Unas 4,6 toneladas por año, según la EPA, con el consumo y los kilómetros promedio de ese país, que son mayores que en Argentina.', { d: 2 }),
      cad('Armá la cadena de dónde viene el CO₂ de un auto.', [ // e8
        'La nafta contiene carbono de origen fósil',
        'En el motor se quema con oxígeno del aire',
        'Cada carbono forma una molécula de CO₂',
        'El CO₂ sale por el caño de escape',
        'Se suma al CO₂ acumulado en la atmósfera',
      ], ['El catalizador convierte el CO₂ en oxígeno'], 'El catalizador reduce otros contaminantes, pero no elimina el CO₂.', { d: 2 }),
      det('Leé este comentario y marcá lo equivocado.', [ // e9
        ['Un litro de nafta produce más de 2 kg de CO₂.', false],
        ['El catalizador del auto elimina el CO₂.', true, 'Reduce otros contaminantes, pero el CO₂ sale igual.'],
        ['Los motores diésel emiten muchos óxidos de nitrógeno.', false],
        ['Si el auto consume menos, emite lo mismo.', true, 'Las emisiones de CO₂ son proporcionales a los litros quemados.'],
      ], 'La cuenta es simple: cada litro quemado es CO₂ emitido.', { d: 2 }),
      comp('Completá.', 'Un litro de nafta produce unos [2,3] kg de CO₂; el peso extra viene del [oxígeno] del aire; y el catalizador no elimina el [CO₂].', ['0,7', 'agua', 'ruido'], 'Tres datos clave para entender las emisiones de un auto.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Nafta, gasoil, GNC y biocombustibles', 'Cada combustible tiene ventajas y límites. Ninguno es neutro.', [
      teoria('Gasoil y nafta', [
        'El gasoil tiene más energía por litro que la nafta y los motores diésel suelen ser más eficientes, así que consumen menos litros por kilómetro. Pero cada litro de gasoil produce algo más de CO₂ que uno de nafta (unos 2,7 kg), y los motores diésel emiten más óxidos de nitrógeno y partículas si no tienen filtros modernos. En emisiones de CO₂ por kilómetro, la diferencia entre un auto a nafta y uno diésel parecidos suele ser chica.',
      ]),
      numv(3, (i) => { // e1
        const [ln, ld] = [[8, 6], [9, 7], [7, 5.5]][i];
        const n = ln * 2.3;
        const d = ld * 2.7;
        return {
          enunciado: `Un auto a nafta consume ${ln} L/100 km (2,3 kg de CO₂ por litro) y uno diésel ${ld.toLocaleString('es-AR')} L/100 km (2,7 kg por litro). ¿Cuántos kilos de CO₂ cada 100 km emite de menos el diésel? Redondeá a un decimal.`,
          valor: Math.round((n - d) * 10) / 10,
          unidad: 'kg',
          dec: 1,
          tol: 0.1,
          explicacion: `Nafta: ${ln} × 2,3 = ${n.toLocaleString('es-AR')} kg. Diésel: ${ld.toLocaleString('es-AR')} × 2,7 = ${d.toLocaleString('es-AR')} kg. Diferencia: ${(Math.round((n - d) * 10) / 10).toLocaleString('es-AR')} kg. Menos CO₂, pero más óxidos de nitrógeno si no tiene filtros modernos.`,
          ctx: `Nafta ${ln} L/100 km; diésel ${ld} L/100 km.`,
        };
      }, { d: 3 }),
      op('Un auto diésel consume menos litros cada 100 km que uno a nafta parecido. ¿Por qué no emite mucho menos CO₂?', [ // e1b
        'Cada litro de gasoil tiene más carbono y emite más CO₂',
        'Porque el gasoil no se quema del todo en el motor',
        ['Porque los autos diésel son siempre más pesados', 'El peso influye poco acá: la clave es el carbono de cada litro.'],
        'Porque el gasoil se evapora antes de usarse',
      ], 'Menos litros, pero cada uno con más carbono: la ventaja en CO₂ por kilómetro termina siendo chica.', { d: 3 }),
      teoria('GNC', [
        'Argentina es uno de los países con más vehículos a gas natural comprimido (GNC) del mundo. El GNC es mayormente metano: al quemarse, emite algo menos de CO₂ por kilómetro que la nafta, del orden de un 20 %, y muchas menos partículas. Pero el metano que se escapa en la extracción y el transporte del gas calienta mucho: si hay fugas importantes en la cadena, la ventaja climática se achica.',
      ]),
      op('¿Qué puede achicar la ventaja climática del GNC frente a la nafta?', [ // e2
        'Las fugas de metano en la cadena del gas',
        'Que el GNC emite más partículas que el gasoil',
        ['Que el GNC es un combustible renovable', 'No lo es: el gas natural es un combustible fósil.'],
        'Que los tubos de GNC pesan poco',
      ], 'El metano calienta mucho más que el CO₂ en el corto plazo: las fugas cuentan, y mucho.', { d: 3 }),
      teoria('Biocombustibles', [
        'El bioetanol se hace con caña de azúcar o maíz, y el biodiésel con aceites como el de soja. En Argentina, la Ley 27.640, de 2021, fijó un corte obligatorio de 12 % de bioetanol en la nafta y de 7,5 % de biodiésel en el gasoil. Las plantas absorbieron CO₂ al crecer, lo que puede compensar parte de lo que se emite al quemarlos. Pero su balance depende de cómo se producen: si para cultivarlos se desmontan bosques, o se usan muchos fertilizantes y combustibles en el campo, el beneficio se reduce o desaparece.',
      ]),
      cad('Armá la cadena de por qué un biocombustible puede no ser tan limpio.', [ // e3
        'Crece la demanda de soja para biodiésel',
        'Se desmonta bosque para sembrar más soja',
        'El bosque libera el carbono que guardaba',
        'Esa emisión puede superar el ahorro del biodiésel',
      ], ['La soja absorbe más carbono que el bosque que reemplaza'], 'Lo viste con el desmonte en el Chaco: el cambio de uso del suelo puede anular el beneficio.', { d: 3 }),
      numv(3, (i) => { // e4
        const l = [40, 50, 30][i];
        return {
          enunciado: `Si cargás ${l} litros de nafta con un corte del 12 % de bioetanol, ¿cuántos litros de bioetanol hay en el tanque?`,
          valor: Math.round(l * 0.12 * 10) / 10,
          unidad: 'litros',
          dec: 1,
          tol: 0.1,
          explicacion: `${l} × 0,12 = ${(Math.round(l * 0.12 * 10) / 10).toLocaleString('es-AR')} litros. El resto, ${(Math.round(l * 0.88 * 10) / 10).toLocaleString('es-AR')} litros, es nafta de origen fósil.`,
        };
      }, { d: 1 }),
      clas('¿Es una ventaja o un límite de este combustible?', { // e5
        'Ventaja': ['El GNC emite menos partículas', 'El bioetanol viene de plantas que absorbieron CO₂', 'El diésel consume menos litros por km'],
        'Límite': ['Fugas de metano en la cadena del GNC', 'Desmontes para cultivar biocombustibles', 'Más óxidos de nitrógeno en diésel sin filtros'],
      }, 'Ningún combustible es "limpio" o "sucio" sin matices: hay que mirar toda la cadena.', { d: 2 }),
      par('Uní cada combustible con su origen.', [ // e6
        ['Nafta', 'Petróleo refinado'],
        ['GNC', 'Gas natural, mayormente metano'],
        ['Bioetanol', 'Caña de azúcar o maíz'],
        ['Biodiésel', 'Aceites vegetales como el de soja'],
      ], 'Conocer el origen ayuda a entender el impacto de cada combustible.', { d: 1 }),
      vf('Como los biocombustibles vienen de plantas, siempre tienen emisiones netas cero.', false, 'Cultivarlos, fertilizarlos, transportarlos y procesarlos emite gases, y si provocan desmontes, las emisiones pueden ser mayores que las de un combustible fósil.', { // e7
        razones: ['+Porque producirlos emite y pueden causar desmontes', '-Porque las plantas no absorben CO₂', '-Porque los biocombustibles no se queman'],
        d: 2,
      }),
      rank('Ordená estos factores según cuánto pueden empeorar el balance de un biocombustible, de más a menos.', [ // e8
        ['Desmontar un bosque nativo para cultivar la materia prima', 'enorme'],
        ['Usar mucho fertilizante nitrogenado', 'importante'],
        ['Transportarlo largas distancias', 'moderado'],
        ['Envasarlo en tanques reutilizables', 'mínimo'],
      ], 'El cambio de uso del suelo es, por lejos, el factor que más pesa.', { d: 3, extremos: ['Empeora más', 'Empeora menos'] }),
      det('Leé esta publicidad y marcá lo engañoso.', [ // e9
        ['Nuestra nafta contiene 12 % de bioetanol, como exige la ley.', false],
        ['Con nuestra nafta, tu auto no emite CO₂.', true, 'El 88 % sigue siendo fósil y todo el combustible emite CO₂ al quemarse.'],
        ['El GNC emite menos partículas que el gasoil.', false],
        ['El GNC es 100 % renovable.', true, 'El gas natural es un combustible fósil.'],
      ], 'Lo viste con el greenwashing: una verdad parcial puede usarse para engañar.', { d: 2 }),
      comp('Completá.', 'En Argentina, la nafta lleva un [12] % de bioetanol; el GNC es mayormente [metano]; y el beneficio de un biocombustible puede desaparecer si causa [desmontes].', ['50', 'hidrógeno', 'lluvias'], 'Tres claves para comparar combustibles sin simplificar.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('El auto eléctrico', 'Eficiencia, batería, red eléctrica y ciclo de vida: qué dice la evidencia sobre los autos eléctricos.', [
      teoria('Eficiencia', [
        'Según el Departamento de Energía de EE. UU., un auto a nafta usa solo entre el 12 % y el 30 % de la energía del combustible para mover el auto; el resto se pierde, sobre todo como calor. Un auto eléctrico convierte más del 77 % de la energía que toma de la red en movimiento de las ruedas. Además, al frenar recupera parte de la energía (frenado regenerativo).',
      ], {
        datos: barras('Energía que llega a las ruedas (aproximado)', '%', [
          ['Auto a nafta', 21],
          ['Auto eléctrico', 77],
        ], 'Departamento de Energía de EE. UU.; para la nafta, punto medio del rango 12–30 %.'),
      }),
      numv(3, (i) => { // e1
        const e = [100, 60, 250][i];
        return {
          enunciado: `Si un auto a nafta aprovecha el 21 % de la energía y uno eléctrico el 77 %, ¿cuántas unidades de energía llegan a las ruedas de cada uno por cada ${e} unidades que cargan? Respondé la diferencia. Redondeá al entero.`,
          valor: Math.round(e * 0.77 - e * 0.21),
          unidad: 'unidades',
          tol: 1,
          explicacion: `Eléctrico: ${e} × 0,77 ≈ ${Math.round(e * 0.77)}. Nafta: ${e} × 0,21 ≈ ${Math.round(e * 0.21)}. Diferencia ≈ ${Math.round(e * 0.77 - e * 0.21)}. El motor eléctrico desperdicia mucho menos.`,
          ctx: `${e} unidades de energía; 21 % y 77 % de aprovechamiento.`,
        };
      }, { d: 2 }),
      teoria('La batería y la red', [
        'Fabricar un auto eléctrico emite más que fabricar uno a nafta, sobre todo por la batería. Pero al usarlo emite mucho menos, porque es más eficiente y porque la electricidad puede venir de fuentes con pocas emisiones. Cuánto menos depende de la red eléctrica: con más renovables, hidro y nuclear, menos emisiones. En Argentina, la electricidad todavía viene en buena parte de centrales a gas, pero las renovables vienen creciendo.',
      ]),
      cad('Armá el ciclo de vida de las emisiones de un auto eléctrico.', [ // e2
        'Se extraen minerales y se fabrica la batería',
        'El auto sale de fábrica con más emisiones que uno a nafta',
        'En cada kilómetro emite menos que uno a nafta',
        'Después de unos años de uso, compensa la diferencia inicial',
        'A lo largo de su vida, emite menos en total',
      ], ['El auto eléctrico no tiene ninguna emisión de fabricación'], 'Hay que mirar toda la vida del auto, no solo el caño de escape ni solo la fábrica.', { d: 2 }),
      teoria('Lo que dice la evidencia', [
        'Un estudio del ICCT de 2021 comparó las emisiones de todo el ciclo de vida de autos medianos en distintas regiones. Los eléctricos a batería emitían entre un 66 y un 69 % menos que los de nafta en Europa, entre un 60 y un 68 % menos en Estados Unidos, entre un 37 y un 45 % menos en China y entre un 19 y un 34 % menos en India. La diferencia entre regiones se explica sobre todo por cuánto carbón hay en la red eléctrica.',
      ], {
        datos: tabla('Reducción de emisiones de ciclo de vida del auto eléctrico frente al de nafta (ICCT, 2021)', ['Región', 'Reducción'], [
          ['Europa', '66–69 %'],
          ['Estados Unidos', '60–68 %'],
          ['China', '37–45 %'],
          ['India', '19–34 %'],
        ]),
      }),
      rank('Ordená las regiones según cuánto reduce emisiones un auto eléctrico frente a uno a nafta, de más a menos.', [ // e3
        ['Europa', '66–69 %'],
        ['Estados Unidos', '60–68 %'],
        ['China', '37–45 %'],
        ['India', '19–34 %'],
      ], 'Donde la electricidad depende más del carbón, la ventaja es menor, pero en todos los casos existe.', { d: 2 }),
      op('¿Por qué un auto eléctrico reduce menos emisiones en India que en Europa?', [ // e4
        'Porque la electricidad de India usa más carbón',
        'Porque en India los autos eléctricos son más pesados',
        ['Porque en Europa no se fabrican baterías', 'Se fabrican en muchos lugares; la diferencia está en la red eléctrica.'],
        'Porque en India se maneja más rápido',
      ], 'La red eléctrica define cuánto emite cada kilómetro de un auto eléctrico.', { d: 2 }),
      numv(3, (i) => { // e5
        const [kwh, f] = [[15, 0.35], [18, 0.4], [14, 0.3]][i];
        return {
          enunciado: `Un auto eléctrico consume ${kwh} kWh cada 100 km. Si la red emite ${f.toLocaleString('es-AR')} kg de CO₂ por kWh, ¿cuántos gramos de CO₂ por km le corresponden? Redondeá al entero.`,
          valor: Math.round((kwh * f * 1000) / 100),
          unidad: 'g/km',
          tol: 1,
          explicacion: `${kwh} × ${f.toLocaleString('es-AR')} = ${(kwh * f).toLocaleString('es-AR')} kg cada 100 km, o sea ${Math.round((kwh * f * 1000) / 100)} g/km. Un auto a nafta de 8 L/100 km emite unos 184 g/km solo por el escape.`,
          ctx: `${kwh} kWh/100 km; ${f} kg CO₂/kWh.`,
        };
      }, { d: 3 }),
      teoria('Crecen rápido', [
        'Según la Agencia Internacional de Energía, en 2024 se vendieron en el mundo más de 17 millones de autos eléctricos, más de uno de cada cinco autos nuevos. China concentra la mayor parte de las ventas. En Argentina son todavía muy pocos, pero crecen, y aparecen cargadores en ciudades y rutas.',
      ]),
      est('Estimá cuántos autos eléctricos se vendieron en el mundo en 2024, según la AIE.', 17000000, { min: 100000, max: 1000000000, unidad: 'autos', escala: 'log' }, 'Más de 17 millones, más de uno de cada cinco autos nuevos vendidos en el mundo.', { d: 3 }),
      vf('Un auto eléctrico cargado con una red que usa gas emite lo mismo que uno a nafta.', false, 'Aun con electricidad de gas, su mayor eficiencia suele darle ventaja. Y a medida que la red suma renovables, la ventaja crece durante toda la vida del auto.', { // e7
        razones: ['+Porque es más eficiente y la red puede limpiarse con el tiempo', '-Porque la electricidad de gas no emite nada', '-Porque los autos a nafta son más eficientes'],
        d: 3,
      }),
      clas('¿Este factor aumenta o reduce la ventaja climática de un auto eléctrico?', { // e7b
        'Aumenta la ventaja': ['Una red con más renovables', 'Un auto chico y liviano', 'Usarlo muchos años'],
        'Reduce la ventaja': ['Una red con mucho carbón', 'Una batería enorme que casi nunca se aprovecha', 'Un vehículo muy pesado'],
      }, 'El mismo tipo de auto puede tener huellas muy distintas según cómo se fabrica, dónde se carga y cómo se usa.', { d: 3 }),
      par('Uní cada término con su definición.', [ // e7c
        ['Frenado regenerativo', 'Recuperar energía al frenar'],
        ['Autonomía', 'Kilómetros que recorre con una carga'],
        ['kWh cada 100 km', 'Consumo de un auto eléctrico'],
        ['Ciclo de vida', 'Emisiones desde la fabricación hasta el desguace'],
      ], 'Vocabulario para leer comparaciones de autos sin confundirse.', { d: 1 }),
      det('Leé este debate y marcá lo equivocado.', [ // e8
        ['Fabricar un auto eléctrico emite más, sobre todo por la batería.', false],
        ['El auto eléctrico emite cero en todo su ciclo de vida.', true, 'Su fabricación y la electricidad tienen emisiones, aunque en total suelen ser menores.'],
        ['La ventaja del eléctrico depende de la red eléctrica.', false],
        ['Un auto a nafta aprovecha casi toda la energía de su combustible.', true, 'Aprovecha solo entre el 12 y el 30 %.'],
      ], 'Ni "cero emisiones" ni "igual que un auto a nafta": la evidencia está en el medio, y favorece al eléctrico.', { d: 2 }),
      comp('Completá.', 'Un auto eléctrico convierte más del [77] % de la energía en movimiento; su mayor emisión de fabricación viene de la [batería]; y su ventaja depende de la red [eléctrica].', ['30', 'pintura', 'vial'], 'Tres claves para evaluar un auto eléctrico con justicia.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Lo que ningún motor resuelve', 'Peso, partículas de frenos y cubiertas, espacio, tránsito y seguridad: problemas que siguen ahí con cualquier motor.', [
      teoria('Más grandes, más pesados', [
        'En muchos países crece la venta de camionetas y SUV, más grandes y pesados que los autos comunes. Un vehículo más pesado necesita más energía para moverse, sea a nafta o eléctrico, ocupa más espacio y, en un choque, es más peligroso para peatones y ciclistas. Un SUV eléctrico emite menos que un SUV a nafta, pero puede emitir más que un auto chico eficiente.',
      ]),
      op('¿Qué problema tienen los vehículos cada vez más grandes y pesados, aunque sean eléctricos?', [ // e1
        'Usan más energía y son más peligrosos para peatones',
        'Que no pueden cargar combustible en estaciones',
        ['Que emiten más humo por el caño de escape', 'Si son eléctricos no tienen escape; el problema es el peso.'],
        'Que no entran en ninguna ruta del país',
      ], 'El tamaño y el peso importan más allá del tipo de motor.', { d: 2 }),
      teoria('Partículas sin escape', [
        'Los autos también emiten partículas que no salen del caño de escape: el desgaste de los frenos, de las cubiertas y del asfalto, y el polvo que levantan. Según la OCDE, a medida que los escapes se vuelven más limpios, estas partículas pasan a ser la mayor parte de las partículas del tránsito. Los eléctricos frenan en parte con el motor y gastan menos frenos, pero al ser más pesados pueden gastar más las cubiertas.',
      ]),
      clas('¿Esta emisión sale del caño de escape o no?', { // e2
        'Del caño de escape': ['CO₂ de la nafta quemada', 'Óxidos de nitrógeno de un motor diésel'],
        'No sale del escape': ['Polvo del desgaste de frenos', 'Partículas del desgaste de las cubiertas', 'Polvo del asfalto levantado al pasar'],
      }, 'Un auto eléctrico elimina las primeras, pero no las segundas.', { d: 2 }),
      vf('Un auto eléctrico no emite ninguna partícula contaminante.', false, 'No tiene escape, pero emite partículas por el desgaste de frenos, cubiertas y asfalto, que dependen mucho del peso del vehículo.', { // e3
        razones: ['+Porque frenos, cubiertas y asfalto también emiten partículas', '-Porque emite humo por el escape', '-Porque las partículas solo vienen del escape'],
        d: 2,
      }),
      teoria('Espacio, tránsito y seguridad', [
        'Un auto eléctrico ocupa el mismo espacio que uno a nafta: en un embotellamiento, cambiar el motor no cambia nada. Tampoco cambia el riesgo de siniestros viales, que dependen de la velocidad, el diseño de las calles y el comportamiento. Ni el sedentarismo de quien viaja sentado. Por eso, electrificar los autos es necesario pero no suficiente: también hace falta menos dependencia del auto.',
      ]),
      mult('¿Qué problemas NO resuelve cambiar autos a nafta por eléctricos? Marcá todos.', [ // e4
        '+La congestión en las avenidas',
        '+El espacio que ocupan los autos estacionados',
        '+Los siniestros viales',
        '-El humo del caño de escape en la calle',
        '-Las emisiones por quemar nafta',
      ], 'Electrificar resuelve el escape; el espacio, el tránsito y la seguridad necesitan otras soluciones.', { d: 2 }),
      numv(3, (i) => { // e5
        const [ch, gr] = [[1200, 2000], [1300, 2400], [1100, 1800]][i];
        return {
          enunciado: `Un auto chico pesa ${ch.toLocaleString('es-AR')} kg y un SUV grande ${gr.toLocaleString('es-AR')} kg. ¿En qué porcentaje es más pesado el SUV? Redondeá al entero.`,
          valor: Math.round(((gr - ch) / ch) * 100),
          unidad: '%',
          tol: 1,
          explicacion: `(${gr.toLocaleString('es-AR')} − ${ch.toLocaleString('es-AR')}) ÷ ${ch.toLocaleString('es-AR')} × 100 ≈ ${Math.round(((gr - ch) / ch) * 100)} %. Más peso significa más energía, más desgaste de cubiertas y más daño en un choque.`,
          ctx: `${ch} kg frente a ${gr} kg.`,
        };
      }, { d: 2 }),
      cad('Armá la cadena de por qué un auto más pesado emite más partículas sin escape.', [ // e6
        'El vehículo pesa más',
        'Las cubiertas soportan más fuerza contra el asfalto',
        'Se desgastan más rápido',
        'Se liberan más partículas al aire',
      ], ['El peso extra reduce el roce con el asfalto'], 'El peso es un factor que atraviesa el consumo, las partículas y la seguridad.', { d: 2 }),
      teoria('El efecto rebote', [
        'Cuando algo se vuelve más barato de usar, a veces se usa más. Si un auto eléctrico cuesta menos por kilómetro, algunas personas pueden manejar más o dejar el transporte público. Es el efecto rebote: parte del ahorro se pierde por el aumento del uso. No elimina el beneficio, pero conviene tenerlo en cuenta en las políticas.',
      ]),
      op('Alguien compra un auto eléctrico y, como le sale barato, deja de usar el tren y maneja el doble. ¿Qué es esto?', [ // e7
        'Un efecto rebote',
        'Un caso de mala adaptación',
        ['Un beneficio doble para el ambiente', 'Manejar el doble y dejar el tren reduce el beneficio.'],
        'Una forma de mitigación perfecta',
      ], 'El ahorro por kilómetro se come en parte por los kilómetros extra.', { d: 2 }),
      vf('En un embotellamiento, un auto eléctrico ocupa menos lugar que uno a nafta del mismo tamaño.', false, 'Ocupa exactamente el mismo espacio. Cambiar el motor no cambia la congestión ni el lugar que usan los autos.', { // e7b
        razones: ['+Porque el espacio depende del tamaño, no del motor', '-Porque los eléctricos se achican al frenar', '-Porque los eléctricos pueden ir por las veredas'],
        d: 1,
      }),
      det('Leé esta nota y marcá lo equivocado.', [ // e8
        ['Los autos eléctricos no tienen emisiones por el caño de escape.', false],
        ['Si todos los autos fueran eléctricos, se terminarían los embotellamientos.', true, 'Ocupan el mismo espacio: la congestión sigue igual.'],
        ['Los vehículos pesados desgastan más las cubiertas.', false],
        ['Un SUV eléctrico siempre emite menos que cualquier auto a nafta.', true, 'Puede emitir más que un auto chico y eficiente.'],
      ], 'Electrificar es parte de la solución, no toda la solución.', { d: 2 }),
      par('Uní cada problema con una solución que no depende del motor.', [ // e9
        ['Congestión', 'Transporte público frecuente'],
        ['Siniestros viales', 'Velocidades más bajas en la ciudad'],
        ['Sedentarismo', 'Caminar y pedalear en viajes cortos'],
        ['Espacio ocupado', 'Menos autos por persona'],
      ], 'Las soluciones de fondo cambian cómo nos movemos, no solo con qué motor.', { d: 2 }),
      comp('Completá.', 'Las partículas de frenos y cubiertas son emisiones que no salen del [escape]; manejar más porque el auto sale más barato es un efecto [rebote]; y los vehículos más [pesados] gastan más energía.', ['motor', 'espejo', 'livianos'], 'Tres ideas sobre lo que ningún motor resuelve por sí solo.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Evitar, cambiar, mejorar', 'Un marco para ordenar las soluciones: primero evitar viajes innecesarios, después cambiar de modo, y mejorar los vehículos.', [
      teoria('Tres escalones', [
        'Un marco muy usado en planificación del transporte ordena las soluciones en tres escalones. Evitar: reducir la necesidad de viajar lejos, con ciudades más compactas, servicios cerca y trabajo remoto cuando es posible. Cambiar: pasar viajes del auto a caminar, pedalear o al transporte público. Mejorar: hacer más eficientes y limpios los vehículos que sí se usan, como los eléctricos.',
      ]),
      clas('¿Es una medida de evitar, cambiar o mejorar?', { // e1
        'Evitar': ['Un centro de salud en el barrio en lugar de viajar al centro', 'Trabajar desde casa algunos días'],
        'Cambiar': ['Ir en bici en lugar de en auto', 'Tomar el tren en lugar de manejar'],
        'Mejorar': ['Pasar a un auto eléctrico', 'Mantener bien infladas las cubiertas'],
      }, 'Los tres escalones se complementan, pero los primeros suelen tener más beneficios a la vez.', { d: 1 }),
      ord('Ordená los escalones del marco, del que se aplica primero al último.', [ // e2
        'Evitar viajes innecesarios o largos',
        'Cambiar a modos más eficientes',
        'Mejorar los vehículos que se siguen usando',
      ], 'Primero se pregunta si hace falta el viaje; después cómo hacerlo; y por último con qué vehículo.', { d: 1 }),
      teoria('Manejar mejor', [
        'Si se usa el auto, la forma de manejar cambia el consumo. La resistencia del aire crece con el cuadrado de la velocidad: ir a 120 km/h en lugar de 100 multiplica esa resistencia por 1,44. Acelerar y frenar de golpe desperdicia energía. Las cubiertas desinfladas aumentan el consumo. Y cargar peso de más o un portaequipajes vacío en el techo también suma.',
      ]),
      numv(3, (i) => { // e3
        const [v1, v2] = [[100, 120], [90, 110], [80, 120]][i];
        return {
          enunciado: `La resistencia del aire crece con el cuadrado de la velocidad. ¿Cuántas veces mayor es a ${v2} km/h que a ${v1} km/h? Redondeá a dos decimales.`,
          valor: Math.round((v2 / v1) ** 2 * 100) / 100,
          unidad: 'veces',
          dec: 2,
          tol: 0.01,
          explicacion: `(${v2} ÷ ${v1})² ≈ ${(Math.round((v2 / v1) ** 2 * 100) / 100).toLocaleString('es-AR')}. En ruta, bajar un poco la velocidad ahorra bastante combustible.`,
          ctx: `Velocidad de ${v1} a ${v2} km/h.`,
        };
      }, { d: 3 }),
      mult('¿Qué hábitos de manejo reducen el consumo? Marcá todos.', [ // e4
        '+Acelerar y frenar suavemente',
        '+Mantener las cubiertas bien infladas',
        '+No ir más rápido de lo necesario en ruta',
        '-Llevar un portaequipajes vacío en el techo',
        '-Dejar el motor encendido mientras se espera',
      ], 'Pequeños hábitos que, sumados en un año, ahorran combustible y dinero.', { d: 1 }),
      teoria('Compartir', [
        'Compartir un auto también es una forma de mejorar. Viajar de a cuatro en lugar de de a uno divide por cuatro las emisiones por persona. El auto compartido (car sharing), donde varias personas usan un mismo auto cuando lo necesitan, reduce la cantidad de autos y el espacio de estacionamiento. En promedio, un auto particular pasa más del 90 % del tiempo estacionado.',
      ]),
      numv(3, (i) => { // e5
        const [g, p] = [[184, 4], [160, 3], [200, 2]][i];
        return {
          enunciado: `Un auto emite ${g} g de CO₂ por km. Si viajan ${p} personas en lugar de una, ¿cuántos gramos por persona y por km son?`,
          valor: g / p,
          unidad: 'g/km por persona',
          explicacion: `${g} ÷ ${p} = ${(g / p).toLocaleString('es-AR')} g por persona y km. La ocupación es una de las palancas más baratas.`,
        };
      }, { d: 1 }),
      teoria('Políticas', [
        'Las ciudades y los países usan distintas políticas: cobrar por entrar al centro en horas pico, como Londres desde 2003 y Estocolmo desde 2006, que redujeron el tránsito; zonas de bajas emisiones donde no pueden entrar los vehículos más contaminantes; cobrar el estacionamiento en la calle; normas de eficiencia para los autos nuevos; e inversión en transporte público, veredas y ciclovías.',
      ]),
      par('Uní cada política con su efecto.', [ // e6
        ['Cobro por congestión', 'Menos autos en el centro en horas pico'],
        ['Zona de bajas emisiones', 'Menos vehículos contaminantes en un área'],
        ['Estacionamiento tarifado', 'El espacio de la calle deja de ser gratis'],
        ['Normas de eficiencia', 'Autos nuevos que consumen menos'],
      ], 'Cada política actúa sobre una palanca distinta; combinadas, suman.', { d: 2 }),
      op('Londres cobra por entrar al centro en horas pico. ¿Qué busca esa medida?', [ // e6b
        'Que entren menos autos y el tránsito fluya mejor',
        'Recaudar sin cambiar la cantidad de autos',
        ['Prohibir totalmente los autos en la ciudad', 'No prohíbe: pone un precio al uso del espacio más escaso.'],
        'Que los colectivos paguen más que los autos',
      ], 'Poner precio al espacio escaso en el momento de más demanda reduce la congestión y financia alternativas.', { d: 2 }),
      rank('Ordená estas decisiones de una familia de mayor a menor impacto en sus emisiones de transporte, si hoy hace 15.000 km por año en un SUV a nafta.', [ // e7
        ['Vender el SUV y usar transporte público, bici y un auto compartido', 'evita la mayor parte'],
        ['Reemplazarlo por un auto eléctrico chico', 'reduce mucho'],
        ['Reemplazarlo por un auto a nafta chico y eficiente', 'reduce algo'],
        ['Mantener el SUV y manejar más suave', 'reduce poco'],
      ], 'Los escalones de evitar y cambiar suelen pesar más que mejorar el vehículo.', { d: 3, extremos: ['Mayor impacto', 'Menor impacto'] }),
      vf('La solución a los problemas del transporte es solo cambiar todos los autos por eléctricos.', false, 'Electrificar es necesario, pero no resuelve congestión, espacio, seguridad ni sedentarismo. Evitar y cambiar viajes también son parte de la solución.', { // e8
        razones: ['+Porque también hace falta evitar y cambiar viajes', '-Porque los autos eléctricos no sirven para nada', '-Porque el transporte no tiene ningún problema'],
        d: 2,
      }),
      det('Leé el plan de movilidad de una empresa y marcá lo que no cierra.', [ // e9
        ['Ofreceremos trabajo remoto dos días por semana.', false],
        ['Regalaremos estacionamiento gratis a todos para que vengan en auto.', true, 'Incentiva el auto; conviene premiar otros modos.'],
        ['Instalaremos estacionamiento seguro para bicis.', false],
        ['Con cambiar la flota a eléctricos, ya no hace falta nada más.', true, 'Evitar y cambiar viajes suman beneficios que electrificar no da.'],
      ], 'Un buen plan usa los tres escalones y no premia lo que quiere reducir.', { d: 2 }),
      comp('Completá.', 'Reducir la necesidad de viajar es [evitar]; pasar del auto al tren es [cambiar]; y hacer más limpios los vehículos es [mejorar].', ['ignorar', 'repetir', 'agrandar'], 'Los tres escalones para ordenar las soluciones de movilidad.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: autos, eléctricos y combustibles', 'Emisiones, combustibles, autos eléctricos, límites del motor y el marco evitar–cambiar–mejorar, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el auto de la familia Paz', 'La familia Paz recorre 10.000 km por año y tiene que cambiar el auto. Compará las opciones con números y ayudala a decidir.', [
      teoria('Las opciones', [
        'Supuestos: nafta, 2,3 kg de CO₂ por litro; electricidad, 0,35 kg de CO₂ por kWh (valor aproximado para una red con mucho gas).',
      ], {
        datos: tabla('Opciones de la familia Paz (10.000 km por año)', ['Opción', 'Consumo', 'CO₂ por año (uso)'], [
          ['SUV a nafta', '10 L/100 km', '2.300 kg'],
          ['Auto chico a nafta', '6 L/100 km', '¿?'],
          ['Auto eléctrico chico', '15 kWh/100 km', '¿?'],
          ['Sin auto: transporte público, bici y auto compartido', '—', 'unos 400 kg'],
        ], 'Valores aproximados para el ejercicio; no incluyen la fabricación.'),
      }),
      num('¿Cuántos kg de CO₂ por año emitiría el auto chico a nafta?', 1380, 'kg', '10.000 × 6 ÷ 100 = 600 litros; 600 × 2,3 = 1.380 kg por año.', { ctx: '10.000 km; 6 L/100 km; 2,3 kg/L.', d: 2 }),
      num('¿Cuántos kg de CO₂ por año le corresponderían al auto eléctrico chico?', 525, 'kg', '10.000 × 15 ÷ 100 = 1.500 kWh; 1.500 × 0,35 = 525 kg por año. Y bajaría si la red suma renovables.', { ctx: '10.000 km; 15 kWh/100 km; 0,35 kg/kWh.', d: 2 }),
      rank('Ordená las opciones de menor a mayor CO₂ por año de uso.', [ // e3
        ['Sin auto: transporte, bici y auto compartido', '≈ 400 kg'],
        ['Auto eléctrico chico', '525 kg'],
        ['Auto chico a nafta', '1.380 kg'],
        ['SUV a nafta', '2.300 kg'],
      ], 'Evitar y cambiar gana; entre los autos, el eléctrico chico gana; el SUV a nafta queda último por lejos.', { d: 2 }),
      op('¿Qué dato falta para comparar de forma completa el auto eléctrico con el chico a nafta?', [ // e4
        'Las emisiones de fabricar la batería',
        'El color del auto y el de su tapizado',
        ['El precio del estacionamiento del barrio', 'Importa para el bolsillo, no para las emisiones de ciclo de vida.'],
        'La marca de las cubiertas originales',
      ], 'Sin la fabricación, la comparación queda incompleta. Aun así, los estudios de ciclo de vida suelen favorecer al eléctrico.', { d: 3 }),
      mult('La familia elige el auto eléctrico chico. ¿Qué más puede hacer para bajar su impacto? Marcá todo.', [ // e5
        '+Seguir usando el tren para ir al centro',
        '+Ir en bici a los lugares cercanos',
        '+Compartir viajes con vecinos',
        '-Manejar el doble porque cargar es barato',
        '-Comprar además un segundo auto grande',
      ], 'Mejorar el vehículo rinde más si además se evitan y se cambian viajes. Cuidado con el efecto rebote.', { d: 2 }),
      vf('Pasar del SUV a nafta al auto eléctrico chico reduce las emisiones de uso en más de un 75 %.', true, 'De 2.300 a 525 kg: una baja de 1.775 kg, que es un 77 % menos, con los supuestos del ejercicio.', { // e6
        razones: ['+Porque baja de 2.300 a 525 kg por año', '-Porque el eléctrico emite más que el SUV', '-Porque el eléctrico no consume energía'],
        d: 3,
      }),
      det('La familia escribe su decisión. Marcá lo que conviene corregir.', [ // e7
        ['Elegimos un auto chico: menos peso, menos energía.', false],
        ['Como es eléctrico, ya no importa cuánto lo usemos.', true, 'Usarlo más suma emisiones y congestión: es el efecto rebote.'],
        ['Vamos a seguir usando el tren para ir al centro.', false],
        ['El eléctrico no tiene ninguna emisión en toda su vida.', true, 'Su fabricación y la electricidad tienen emisiones, aunque menores.'],
      ], 'Una buena decisión combina el vehículo adecuado con un uso responsable.', { d: 3 }),
    ]),
  ],
});
