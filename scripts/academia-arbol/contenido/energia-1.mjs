import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// ENERGÍA 1 — Qué es la energía.
// La base de la rama: qué es, en qué formas aparece, por qué siempre se
// "pierde" una parte al transformarla, de dónde sale y por qué está en el
// centro del problema del clima. Retoma el flujo de energía del tronco
// (tronco-1) y las unidades kW y kWh (tronco-2).

export default unidad({
  slug: 'energia-1',
  rama: 'energia',
  orden: 1,
  nivel: 1,
  requiereTronco: 1,
  titulo: 'Qué es la energía',
  bajada: 'La energía no se ve, pero mueve todo. Sus formas, sus transformaciones, sus fuentes y por qué pesa tanto en el clima.',
  objetivos: [
    'Reconocer las formas de la energía en situaciones cotidianas',
    'Explicar por qué toda transformación "pierde" una parte como calor',
    'Calcular la eficiencia de un aparato o una máquina',
    'Distinguir fuentes primarias, fuentes secundarias y vectores',
    'Relacionar el uso de energía fósil con las emisiones de CO₂',
  ],
  repasa: ['tronco-1', 'tronco-2'],
  fuentes: ['iea-energia', 'owid-energia', 'owid-co2', 'ipcc-ar6-syr', 'iea-eficiencia'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('La energía que mueve todo', 'Luz, calor, movimiento, electricidad: la misma cosa en distintas formas.', [
      teoria('Una definición útil', [
        'La energía es la capacidad de producir un cambio: mover algo, calentarlo, iluminarlo, hacerlo crecer. No se ve directamente; se ven sus efectos.',
        'Aparece en muchas formas: química (guardada en la comida, la nafta o el gas), eléctrica, térmica (el calor), cinética (la del movimiento), luminosa, y potencial (la que tiene el agua en lo alto de una represa, lista para caer).',
      ]),
      par('Uní cada ejemplo con la forma de energía que tiene.', [ // e1
        ['Un sándwich antes de comerlo', 'Química'],
        ['Una pelota que rueda', 'Cinética'],
        ['El agua detrás de una represa', 'Potencial'],
        ['Una pava caliente', 'Térmica'],
      ], 'Cuatro formas distintas de la misma cosa. Lo interesante es cómo pasan de una a otra.', { d: 1 }),
      teoria('Nada se crea, todo se transforma', [
        'La energía no aparece de la nada ni desaparece: se transforma de una forma en otra. Es una de las leyes más firmes de la física. En el tronco lo viste con la cadena del sol a las plantas y de las plantas a los animales.',
        'Cuando decimos que "gastamos" energía, en realidad la transformamos en formas que ya no nos sirven, casi siempre calor que se dispersa en el ambiente.',
      ]),
      cad('Seguí la energía desde el sol hasta tu pierna cuando pedaleás.', [ // e2
        'El sol emite luz',
        'Una planta de trigo la guarda como energía química',
        'Comés pan hecho con ese trigo',
        'Tus músculos transforman esa energía en movimiento',
        'La bicicleta avanza',
      ], ['El pan le devuelve la luz al sol'], 'Casi toda la energía que usamos empezó siendo luz del sol, incluso la del petróleo, que es sol guardado hace millones de años.', { d: 2 }),
      vf('Cuando una lámpara se apaga, la energía que usó desaparece.', false, 'No desaparece: se transformó en luz y calor, que se dispersaron en la habitación. La energía se conserva, pero se vuelve menos útil.', { // e3
        razones: ['+Porque se transformó en luz y calor que se dispersaron', '-Porque vuelve a la red eléctrica al apagar', '-Porque queda guardada en la lámpara'],
        d: 2,
      }),
      teoria('Transformaciones de todos los días', [
        'Un celular transforma energía eléctrica en química (al cargar la batería) y después en luz, sonido y calor. Un auto transforma la energía química de la nafta en movimiento y mucho calor. Una central hidroeléctrica transforma la energía potencial del agua en movimiento de una turbina y después en electricidad.',
      ]),
      ord('Ordená las transformaciones en una central hidroeléctrica.', [ // e4
        'El agua está acumulada en lo alto del embalse',
        'El agua cae por un conducto',
        'Hace girar una turbina',
        'La turbina mueve un generador',
        'Sale electricidad hacia la red',
      ], 'Potencial, cinética, mecánica, eléctrica. Cada paso es una transformación.', { d: 2, extremos: ['Primero', 'Último'] }),
      clas('¿Qué transformación principal hace cada aparato?', { // e5
        'Eléctrica a movimiento': ['Un ventilador', 'Una licuadora', 'Un lavarropas girando'],
        'Eléctrica a calor': ['Una pava eléctrica', 'Una estufa de cuarzo', 'Una plancha'],
        'Química a calor': ['Una hornalla de gas', 'Una estufa a leña'],
      }, 'Casi todos los aparatos hacen una transformación principal, y además producen algo de calor que no buscamos.', { d: 2 }),
      mult('¿Cuáles de estas cosas tienen energía química guardada? Marcá todas.', [ // e6
        '+La nafta de un tanque',
        '+Una batería cargada',
        '+Un leño seco',
        '+Una manzana',
        '-Una ráfaga de viento',
      ], 'La energía química está en los enlaces de las moléculas. El viento tiene energía de movimiento, no química.', { d: 2 }),
      op('Un auto frena y los discos de freno se calientan. ¿Qué pasó con la energía del movimiento?', [ // e7
        'Se transformó en calor por el roce',
        'Volvió al tanque como nafta sin quemar',
        ['Desapareció al frenar el auto', 'La energía no desaparece: se transforma. Los frenos calientes son la prueba.'],
        'Se guardó en las ruedas para arrancar después',
      ], 'Los autos eléctricos pueden recuperar una parte al frenar (freno regenerativo), pero en un freno común todo termina como calor.', { d: 2 }),
      comp('Completá.', 'La energía no se crea ni se [destruye]: se [transforma], y casi siempre una parte termina como [calor].', ['acumula', 'multiplica', 'luz'], 'Tres palabras que explican por qué hablar de "gastar energía" es una forma de decir.', { d: 1 }),
      det('Leé esta explicación de un estudiante y marcá lo equivocado.', [ // e9
        ['La energía de la nafta es energía química.', false],
        ['Cuando el auto anda, esa energía se destruye.', true, 'No se destruye: se transforma en movimiento y, sobre todo, en calor.'],
        ['Por eso el motor se calienta tanto.', false],
        ['Un auto eléctrico no transforma energía: la usa tal cual.', true, 'También transforma: de química (batería) a eléctrica y a movimiento.'],
      ], 'Toda máquina es una transformadora de energía. La pregunta útil es cuánta sale en la forma que queremos.', { d: 3 }),
      rank('Ordená estas cosas por cuánta energía tienen, de más a menos (valores aproximados).', [ // e10
        ['Un litro de nafta', '≈ 9 kWh'],
        ['Un día de comida de una persona adulta', '≈ 2,3 kWh'],
        ['Una batería de celular cargada', '≈ 0,015 kWh'],
      ], 'Un litro de nafta tiene casi cuatro días de comida de una persona. Por eso los combustibles fósiles fueron tan poderosos, y tan difíciles de reemplazar.', { d: 3 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Transformar siempre cuesta', 'Por qué ninguna máquina aprovecha toda la energía, y cómo se mide cuánto aprovecha: la eficiencia.', [
      teoria('La parte que se escapa', [
        'En cada transformación, una parte de la energía termina en una forma que no buscábamos, casi siempre calor. Una lamparita vieja, incandescente, convierte solo alrededor del 5 % de la electricidad en luz: el resto es calor. Por eso quemaba al tocarla.',
        'La eficiencia es la fracción de la energía que sale en la forma útil. Se calcula como energía útil dividida energía que entra, y se expresa en porcentaje.',
      ], { destacado: { valor: 'útil ÷ entra', texto: 'es la cuenta de la eficiencia. Multiplicada por 100, da el porcentaje.' } }),
      ejemplo('La eficiencia de un motor', 'Un motor de auto recibe 100 unidades de energía de la nafta y entrega 25 como movimiento de las ruedas.', [
        'Energía útil: 25. Energía que entra: 100.',
        'Eficiencia: 25 ÷ 100 = 0,25, o sea 25 %.',
        'Las otras 75 unidades salen como calor por el escape y el radiador.',
      ], 'Un motor de nafta aprovecha alrededor de un cuarto de la energía. Un motor eléctrico, en cambio, supera el 85 %.'),
      numv(3, (i) => { // e1
        const entra = [200, 500, 80][i];
        const util = [50, 175, 72][i];
        return {
          enunciado: `Una máquina recibe ${entra} unidades de energía y entrega ${util} en la forma útil. ¿Cuál es su eficiencia?`,
          valor: (util / entra) * 100,
          unidad: '%',
          explicacion: `${util} ÷ ${entra} = ${(util / entra).toLocaleString('es-AR')}, que es ${(util / entra) * 100} %. El resto, ${entra - util} unidades, se fue como calor u otra forma no buscada.`,
        };
      }, { d: 2 }),
      teoria('Lámparas: el mismo trabajo con menos energía', [
        'Una lámpara LED da la misma luz que una incandescente de 60 W usando alrededor de 8 a 10 W. No es que "ahorre luz": desperdicia mucho menos en calor.',
        'La misma idea sirve para cualquier aparato: cuando un aparato es más eficiente, hace el mismo trabajo con menos energía. Es la base de la etiqueta de eficiencia que vas a ver en la próxima unidad.',
      ]),
      rank('Ordená estas máquinas por su eficiencia típica, de más a menos.', [ // e2
        ['Motor eléctrico', '≈ 85-95 %'],
        ['Central térmica de ciclo combinado', '≈ 55-60 %'],
        ['Motor de auto a nafta', '≈ 20-30 %'],
        ['Lamparita incandescente (como fuente de luz)', '≈ 5 %'],
      ], 'Las máquinas que queman algo pierden mucho en calor. Las eléctricas pierden poco. Esa diferencia está en el centro de la transición energética.', { d: 3 }),
      numv(3, (i) => { // e3
        const w = [60, 100, 40][i];
        const led = [9, 14, 6][i];
        return {
          enunciado: `Una lámpara incandescente de ${w} W se reemplaza por una LED de ${led} W que da la misma luz. ¿Qué porcentaje de energía se ahorra? Redondeá al entero.`,
          valor: Math.round(((w - led) / w) * 100),
          unidad: '%',
          tol: 1,
          explicacion: `Se ahorran ${w} − ${led} = ${w - led} W de ${w}: ${w - led} ÷ ${w} × 100 ≈ ${Math.round(((w - led) / w) * 100)} %. La misma luz con mucho menos calor.`,
        };
      }, { d: 2 }),
      vf('Una lamparita incandescente de 60 W da más luz que una LED de 60 W.', false, 'Es al revés: con 60 W, una LED da muchísima más luz, porque convierte en luz una parte mucho mayor de la energía. Los watts miden energía por segundo, no luz.', { // e4
        razones: ['+Porque la LED convierte en luz mucha más parte de la energía', '-Porque los watts miden la luz que da la lámpara', '-Porque las dos tienen la misma eficiencia'],
        d: 3,
      }),
      teoria('Pérdidas en cadena', [
        'Cuando la energía pasa por varias transformaciones, las pérdidas se multiplican. Si una central aprovecha el 40 %, la red pierde un 10 % en el camino y la lamparita aprovecha el 5 %, de 100 unidades de gas quemado solo llegan como luz 100 × 0,4 × 0,9 × 0,05 ≈ 1,8 unidades.',
        'Por eso mejorar la eficiencia en el último eslabón, el aparato, ahorra mucho más de lo que parece: cada unidad que no pide el aparato se ahorra en toda la cadena.',
      ]),
      ejemplo('De gas a luz', 'Una central aprovecha el 40 % del gas, la red pierde el 10 % y una lámpara LED convierte el 40 % de la electricidad en luz.', [
        'Salen de la central: 100 × 0,40 = 40.',
        'Llegan a casa: 40 × 0,90 = 36.',
        'Salen como luz: 36 × 0,40 = 14,4.',
      ], 'Con LED llegan como luz unas 14 de cada 100 unidades de gas; con incandescente, menos de 2. La misma cadena, con un eslabón mejor.'),
      numv(3, (i) => { // e5
        const c = [40, 50, 35][i];
        const r = [90, 90, 85][i];
        const a = [80, 90, 60][i];
        const v = Math.round(100 * (c / 100) * (r / 100) * (a / 100) * 10) / 10;
        return {
          enunciado: `Una central aprovecha el ${c} % del combustible, a casa llega el ${r} % de su electricidad y el aparato aprovecha el ${a} %. De 100 unidades de combustible, ¿cuántas terminan como energía útil? Redondeá a un decimal.`,
          valor: v,
          unidad: 'unidades',
          dec: 1,
          tol: 0.2,
          explicacion: `100 × ${(c / 100).toLocaleString('es-AR')} × ${(r / 100).toLocaleString('es-AR')} × ${(a / 100).toLocaleString('es-AR')} ≈ ${v.toLocaleString('es-AR')}. Las pérdidas se multiplican eslabón por eslabón.`,
        };
      }, { d: 3 }),
      cad('Armá la cadena de por qué cambiar una lámpara ahorra gas en una central.', [ // e6
        'Se cambia una lámpara incandescente por una LED',
        'La casa pide menos electricidad',
        'La red transporta menos energía',
        'La central quema menos gas',
        'Se emite menos CO₂',
      ], ['La LED produce gas en la casa'], 'El ahorro viaja para atrás por la cadena. Por eso se dice que la energía más limpia es la que no se usa.', { d: 2 }),
      op('¿Por qué los motores de auto a nafta se calientan tanto?', [ // e7
        'Porque la mayor parte de la energía termina como calor',
        'Porque el sol calienta el capó durante el viaje',
        ['Porque la nafta ya viene caliente de la estación', 'La nafta está a temperatura ambiente: el calor sale de la combustión.'],
        'Porque el motor necesita calor para mover las ruedas',
      ], 'Tres cuartos de la energía de la nafta se van en calor. El radiador existe para sacarlo.', { d: 2 }),
      mult('¿Qué señales indican que un aparato es poco eficiente? Marcá todas.', [ // e8
        '+Se calienta mucho sin que su función sea calentar',
        '+Hace el mismo trabajo que otro con más watts',
        '+Hace mucho ruido o vibra al funcionar',
        '-Tiene una etiqueta de eficiencia clase A',
        '-Es más chico que otro modelo',
      ], 'El calor, el ruido y la vibración son energía que se va sin hacer el trabajo buscado.', { d: 3 }),
      clas('¿Es energía útil o energía perdida?', { // e9
        'Útil': ['La luz de una lámpara', 'El giro del tambor del lavarropas', 'El calor de una estufa en invierno'],
        'Perdida': ['El calor de una lamparita incandescente', 'El ruido de un motor', 'El calor del cargador del celular'],
      }, 'Que algo sea útil depende de lo que buscamos: el calor de la estufa es el objetivo; el de la lamparita, un desperdicio.', { d: 2 }),
      comp('Completá.', 'La eficiencia es la energía [útil] dividida la energía que [entra]; en una cadena, las pérdidas se [multiplican].', ['total', 'sale', 'restan'], 'La cuenta y la regla de la cadena, juntas.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('De dónde sale la energía', 'Fuentes primarias, fuentes secundarias y vectores: el mapa para entender cualquier discusión sobre energía.', [
      teoria('Fuentes primarias', [
        'Una fuente primaria es la energía tal como está en la naturaleza: petróleo, gas natural, carbón, uranio, sol, viento, agua de los ríos, biomasa (leña, residuos vegetales) y calor de la Tierra (geotermia).',
        'Algunas son fósiles: se formaron durante millones de años con restos de seres vivos y, al quemarse, emiten CO₂ que estaba guardado bajo tierra. Otras son renovables: se reponen a escala humana.',
      ]),
      clas('Clasificá estas fuentes primarias.', { // e1
        'Fósiles': ['Petróleo', 'Gas natural', 'Carbón'],
        'Renovables': ['Sol', 'Viento', 'Agua de los ríos'],
        'Ni fósil ni renovable': ['Uranio'],
      }, 'El uranio no es fósil (no viene de seres vivos) ni renovable (es un mineral que se agota), pero no emite CO₂ al generar electricidad.', { d: 2 }),
      teoria('Secundarias y vectores', [
        'Las fuentes secundarias se obtienen transformando las primarias: la nafta y el gasoil se hacen refinando petróleo; la electricidad se genera con gas, agua, viento, sol o uranio.',
        'La electricidad es un vector: no es una fuente, sino una forma cómoda de transportar energía. Por eso la pregunta "¿es limpio un auto eléctrico?" depende de con qué se generó esa electricidad.',
      ]),
      par('Uní cada energía secundaria con la primaria de la que suele salir.', [ // e2
        ['Nafta', 'Petróleo'],
        ['Carbón vegetal', 'Leña'],
        ['Electricidad de Yacyretá', 'Agua del río Paraná'],
        ['Electricidad de un parque eólico', 'Viento'],
      ], 'Cada secundaria tiene detrás una primaria. La electricidad puede venir de cualquiera.', { d: 2 }),
      vf('La electricidad es una fuente de energía, como el petróleo o el viento.', false, 'La electricidad es un vector: transporta energía que viene de una fuente primaria. Su impacto depende de esa fuente.', { // e3
        razones: ['+Porque es un vector que transporta energía de otra fuente', '-Porque la electricidad se extrae de minas', '-Porque la electricidad no tiene relación con ninguna fuente'],
        d: 2,
      }),
      teoria('El mundo y Argentina', [
        'A nivel mundial, alrededor de 8 de cada 10 unidades de energía primaria vienen todavía de combustibles fósiles. En Argentina la proporción es parecida o incluso mayor, con un peso muy alto del gas natural: se usa para generar electricidad, calefaccionar casas, cocinar y en la industria.',
        'La energía primaria no es solo electricidad: también es el combustible del transporte, el gas de las casas y el calor de las industrias. La electricidad es una parte, importante pero no la única.',
      ], {
        datos: barras('Energía primaria mundial por fuente (aproximado)', '% del total', [
          ['Petróleo', 32],
          ['Carbón', 26],
          ['Gas natural', 23],
          ['Hidro', 6],
          ['Nuclear', 4],
          ['Eólica, solar y otras renovables', 9],
        ], 'Valores redondeados de los últimos años; cambian año a año.'),
      }),
      est('Estimá qué porcentaje de la energía primaria del mundo viene de combustibles fósiles.', 80, { min: 0, max: 100, paso: 5, unidad: '%' }, 'Alrededor del 80 %. Aunque las renovables crecen rápido, el mundo todavía funciona mayormente con petróleo, carbón y gas.', { d: 2 }),
      mult('¿Para qué se usa el gas natural en Argentina? Marcá todo lo correcto.', [ // e5
        '+Para generar electricidad en centrales térmicas',
        '+Para calefaccionar casas y calentar agua',
        '+Para cocinar',
        '+Como combustible de algunos vehículos (GNC)',
        '-Para producir la electricidad de las represas',
      ], 'El gas está en casi todo el sistema energético argentino. Las represas usan la fuerza del agua, no gas.', { d: 2 }),
      op('Un auto eléctrico se carga en un país donde casi toda la electricidad sale del carbón. ¿Qué pasa con sus emisiones?', [ // e6
        'Dependen del carbón que se quemó para generar esa electricidad',
        'Son cero, porque el auto no tiene caño de escape',
        ['Son iguales a las de un auto a nafta en todos los casos', 'Depende de la red: en redes limpias el eléctrico emite mucho menos; en redes muy sucias, la ventaja se achica.'],
        'Son mayores que las de cualquier auto a nafta',
      ], 'El auto eléctrico traslada las emisiones del caño de escape a la central. Cuanto más limpia la red, mejor.', { d: 3 }),
      ord('Ordená la cadena del combustible de un colectivo diésel.', [ // e7
        'Se extrae petróleo de un yacimiento',
        'Se transporta a una refinería',
        'Se refina y se obtiene gasoil',
        'Se distribuye a las estaciones de servicio',
        'El colectivo lo quema en su motor',
      ], 'De fuente primaria a secundaria y a uso final. Cada paso usa energía y tiene sus pérdidas.', { d: 2, extremos: ['Primero', 'Último'] }),
      det('Leé este posteo y marcá lo equivocado.', [ // e8
        ['El petróleo y el gas son fuentes fósiles.', false],
        ['La electricidad es una fuente limpia porque no tiene humo.', true, 'La electricidad es un vector: es tan limpia como la fuente que la generó.'],
        ['El sol y el viento son renovables.', false],
        ['El uranio es un combustible fósil, como el carbón.', true, 'El uranio es un mineral, no se formó de restos de seres vivos.'],
      ], 'Fuente primaria, secundaria y vector: con esas tres ideas se desarman muchas confusiones.', { d: 3 }),
      comp('Completá.', 'El petróleo es una fuente [primaria], la nafta es [secundaria] y la electricidad es un [vector].', ['renovable', 'fósil', 'residuo'], 'El mapa de toda la energía, resumido en una sola línea.', { d: 2 }),
      cad('Armá la cadena de cómo el sol de hace millones de años llega al tanque de un auto.', [ // e10
        'Algas y plantas antiguas guardaron energía del sol',
        'Quedaron enterradas bajo capas de sedimentos',
        'Con presión, calor y millones de años se formó petróleo',
        'Se extrae y se refina en nafta',
      ], ['El petróleo se forma en pocos años en las refinerías'], 'Quemar petróleo es liberar en segundos lo que la naturaleza tardó millones de años en guardar. Por eso no es renovable.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Medir la energía', 'Joules, calorías y kilowatt-hora: las unidades con que se mide la energía y cómo pasar de una a otra.', [
      teoria('Tres unidades, una misma cosa', [
        'La energía se mide en joules (J) en física, en calorías en la nutrición y en kilowatt-hora (kWh) en las facturas de luz. Son unidades distintas para la misma cosa, como litros y metros cúbicos para el agua.',
        'Un kWh es la energía que usa un aparato de 1 kW durante 1 hora, como viste en el tronco. Equivale a 3,6 millones de joules (3,6 MJ). Una kilocaloría, la "caloría" de las etiquetas de comida, son unos 4.184 joules.',
      ], { destacado: { valor: '1 kWh = 3,6 MJ', texto: 'la equivalencia que conecta la factura de luz con la física.' } }),
      par('Uní cada unidad con dónde se usa más.', [ // e1
        ['Kilowatt-hora (kWh)', 'Factura de luz'],
        ['Kilocaloría (kcal)', 'Etiqueta de un alimento'],
        ['Joule (J)', 'Libros de física'],
        ['Metro cúbico de gas (m³)', 'Factura de gas'],
      ], 'El m³ de gas mide volumen, pero cada m³ de gas natural tiene unos 10 kWh de energía.', { d: 1 }),
      teoria('Potencia contra energía, otra vez', [
        'La potencia es el ritmo al que se usa la energía; se mide en watts (W) o kilowatts (kW). La energía es la cantidad total: potencia por tiempo. Una pava de 2.000 W prendida 3 minutos usa 2 kW × 0,05 h = 0,1 kWh.',
        'Confundir las dos es el error más común. Un aparato de mucha potencia usado poco tiempo puede gastar menos energía que uno de poca potencia prendido todo el día.',
      ]),
      numv(4, (i) => { // e2
        const w = [2000, 1500, 800, 100][i];
        const min = [3, 20, 30, 600][i];
        const kwh = (w / 1000) * (min / 60);
        return {
          enunciado: `Un aparato de ${w.toLocaleString('es-AR')} W funciona ${min} minutos. ¿Cuántos kWh usa?`,
          valor: kwh,
          unidad: 'kWh',
          dec: 2,
          tol: 0.01,
          explicacion: `${(w / 1000).toLocaleString('es-AR')} kW × ${(min / 60).toLocaleString('es-AR')} h = ${kwh.toLocaleString('es-AR')} kWh. Potencia en kW por tiempo en horas.`,
        };
      }, { d: 2 }),
      ejemplo('La energía de tu comida en kWh', 'Una persona come 2.000 kcal por día. ¿Cuántos kWh son?', [
        '2.000 kcal × 4.184 J = 8.368.000 J ≈ 8,4 MJ.',
        '8,4 MJ ÷ 3,6 MJ por kWh ≈ 2,3 kWh.',
      ], 'Todo lo que comés en un día equivale a unos 2,3 kWh: menos que lo que usa una estufa eléctrica de 2.000 W en poco más de una hora.'),
      numv(3, (i) => { // e3
        const kcal = [2500, 1800, 3000][i];
        const v = Math.round(((kcal * 4184) / 3600000) * 10) / 10;
        return {
          enunciado: `Una persona come ${kcal.toLocaleString('es-AR')} kcal por día. ¿Cuántos kWh son? Usá 1 kcal = 4.184 J y 1 kWh = 3,6 MJ. Redondeá a un decimal.`,
          valor: v,
          unidad: 'kWh',
          dec: 1,
          tol: 0.1,
          explicacion: `${kcal.toLocaleString('es-AR')} × 4.184 = ${(kcal * 4184).toLocaleString('es-AR')} J; ÷ 3.600.000 ≈ ${v.toLocaleString('es-AR')} kWh.`,
        };
      }, { d: 3 }),
      rank('Ordená por energía, de más a menos.', [ // e4
        ['1 m³ de gas natural', '≈ 10 kWh'],
        ['2.000 kcal de comida', '≈ 2,3 kWh'],
        ['Una pava eléctrica de 2.000 W por 3 minutos', '0,1 kWh'],
        ['Una LED de 9 W prendida 1 hora', '0,009 kWh'],
      ], 'Con una misma unidad, cosas muy distintas se vuelven comparables. Es la herramienta de los órdenes de magnitud del tronco.', { d: 3 }),
      vf('Una estufa de 2.000 W usa siempre más energía que una heladera de 150 W.', false, 'Depende del tiempo. La heladera funciona todo el año; la estufa, algunas horas en invierno. La energía es potencia por tiempo.', { // e5
        razones: ['+Porque la energía depende también del tiempo de uso', '-Porque la potencia y la energía son lo mismo', '-Porque las heladeras no usan electricidad'],
        d: 2,
      }),
      teoria('Grandes cantidades', [
        'Para cantidades grandes se usan múltiplos: un megawatt-hora (MWh) son 1.000 kWh; un gigawatt-hora (GWh), un millón de kWh; un terawatt-hora (TWh), mil millones de kWh.',
        'Una casa argentina típica usa del orden de 2.000 a 4.000 kWh de electricidad por año. Argentina, como país, consume alrededor de 140 TWh de electricidad por año.',
      ]),
      ord('Ordená estas unidades de menor a mayor.', [ // e6
        'Watt-hora (Wh)',
        'Kilowatt-hora (kWh)',
        'Megawatt-hora (MWh)',
        'Gigawatt-hora (GWh)',
        'Terawatt-hora (TWh)',
      ], 'Cada paso multiplica por mil. Como gramo, kilo y tonelada, pero con más escalones.', { d: 2, extremos: ['Menor', 'Mayor'] }),
      numv(3, (i) => { // e7
        const casas = [1000, 5000, 20000][i];
        const kwh = [3000, 2500, 3000][i];
        return {
          enunciado: `Un barrio tiene ${casas.toLocaleString('es-AR')} casas que usan ${kwh.toLocaleString('es-AR')} kWh por año cada una. ¿Cuántos GWh usan en total?`,
          valor: (casas * kwh) / 1e6,
          unidad: 'GWh',
          dec: 1,
          explicacion: `${casas.toLocaleString('es-AR')} × ${kwh.toLocaleString('es-AR')} = ${(casas * kwh).toLocaleString('es-AR')} kWh. Un GWh es un millón de kWh: ${((casas * kwh) / 1e6).toLocaleString('es-AR')} GWh.`,
        };
      }, { d: 3 }),
      op('La factura de luz marca 500 kWh en dos meses. ¿Qué mide ese número?', [ // e8
        'La energía eléctrica que usó la casa en esos dos meses',
        'La potencia máxima que puede usar la casa por vez',
        ['Lo que cuesta la luz en pesos', 'Los kWh son energía; el precio sale de multiplicarlos por la tarifa.'],
        'La cantidad de aparatos que tiene conectados la casa',
      ], 'El medidor suma energía, kWh, a lo largo del tiempo. La potencia contratada es otro dato.', { d: 1 }),
      det('Leé este diálogo y marcá lo equivocado.', [ // e9
        ['—La pava tiene 2.000 W de potencia.', false],
        ['—Entonces cada vez que la uso gasto 2.000 kWh.', true, 'Los W son potencia; la energía depende del tiempo: 3 minutos son 0,1 kWh.'],
        ['—Un kWh son 3,6 millones de joules.', false],
        ['—Y un GWh son mil kWh.', true, 'Un GWh es un millón de kWh; mil kWh son un MWh.'],
      ], 'Potencia contra energía, y los múltiplos: dos trampas clásicas.', { d: 3 }),
      comp('Completá.', 'Un kWh son [3,6] millones de joules; mil kWh son un [MWh]; y un millón de kWh son un [GWh].', ['36', 'TWh', 'kW'], 'La equivalencia y los múltiplos, resumidos en una línea.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Energía y clima', 'Por qué la energía está en el centro del cambio climático, y qué significa descarbonizar.', [
      teoria('Quemar es emitir', [
        'Cuando se quema un combustible fósil, el carbono que tiene se une con el oxígeno del aire y forma CO₂. No hay forma de quemar nafta, gas o carbón sin producirlo: es química básica.',
        'Por eso el uso de energía es la mayor fuente de gases de efecto invernadero: alrededor de tres cuartos de las emisiones del mundo vienen de producir y usar energía, en electricidad, transporte, calefacción e industria.',
      ], { destacado: { valor: '≈ 3/4', texto: 'de las emisiones mundiales de gases de efecto invernadero vienen de la energía.' } }),
      op('¿Por qué es imposible quemar gas natural sin emitir CO₂?', [ // e1
        'Porque su carbono se combina con el oxígeno al quemarse',
        'Porque las cañerías de gas están hechas de carbono',
        ['Porque el gas ya trae CO₂ mezclado desde el yacimiento', 'Puede traer algo, pero el grueso del CO₂ se forma en la combustión misma.'],
        'Porque las hornallas liberan CO₂ aunque estén apagadas',
      ], 'Combustión es, justamente, la reacción del carbono con el oxígeno. El CO₂ es su producto inevitable.', { d: 2 }),
      teoria('Factores de emisión', [
        'Para calcular emisiones se usan factores de emisión: cuántos kilos de CO₂ salen por cada unidad de combustible. Quemar un litro de nafta emite unos 2,3 kg de CO₂; un litro de gasoil, unos 2,7 kg; un metro cúbico de gas natural, unos 1,9 kg.',
        'Parece raro que un litro de nafta, que pesa menos de un kilo, produzca más de dos kilos de CO₂. La razón: el CO₂ incluye el oxígeno que se toma del aire.',
      ], {
        datos: tabla('Factores de emisión aproximados', ['Combustible', 'kg de CO₂'], [
          ['1 litro de nafta', '≈ 2,3'],
          ['1 litro de gasoil', '≈ 2,7'],
          ['1 m³ de gas natural', '≈ 1,9'],
        ], 'Valores de referencia redondeados.'),
      }),
      numv(3, (i) => { // e2
        const l = [40, 50, 60][i];
        return {
          enunciado: `Un auto carga ${l} litros de nafta por semana. ¿Cuántos kilos de CO₂ emite por semana al quemarla? (2,3 kg por litro)`,
          valor: Math.round(l * 2.3 * 10) / 10,
          unidad: 'kg de CO₂',
          dec: 1,
          explicacion: `${l} × 2,3 = ${(Math.round(l * 2.3 * 10) / 10).toLocaleString('es-AR')} kg de CO₂ por semana. Por año son más de ${Math.floor((l * 2.3 * 52) / 1000)} toneladas.`,
        };
      }, { d: 2 }),
      vf('Un litro de nafta, que pesa unos 750 gramos, no puede producir más de 750 gramos de CO₂.', false, 'Produce unos 2,3 kg, porque al quemarse cada átomo de carbono toma dos átomos de oxígeno del aire, que suman peso.', { // e3
        razones: ['+Porque el CO₂ incluye el oxígeno que se toma del aire', '-Porque la nafta pesa más cuando está caliente', '-Porque el CO₂ se produce de la nada'],
        d: 3,
      }),
      numv(3, (i) => { // e4
        const m3 = [60, 90, 150][i];
        return {
          enunciado: `Una casa usa ${m3} m³ de gas natural en un mes de invierno. ¿Cuántos kilos de CO₂ emite? (1,9 kg por m³)`,
          valor: Math.round(m3 * 1.9 * 10) / 10,
          unidad: 'kg de CO₂',
          dec: 1,
          explicacion: `${m3} × 1,9 = ${(Math.round(m3 * 1.9 * 10) / 10).toLocaleString('es-AR')} kg de CO₂. En las casas argentinas, la calefacción a gas suele ser la mayor fuente de emisiones directas.`,
        };
      }, { d: 2 }),
      teoria('Descarbonizar: tres caminos', [
        'Descarbonizar la energía es bajar las emisiones de CO₂ por cada unidad de energía que usamos. Hay tres caminos que se combinan: usar menos energía para lo mismo (eficiencia), generar con fuentes que no emiten (renovables, nuclear) y electrificar los usos que hoy queman combustible (autos, calefacción, cocinas).',
        'Electrificar sirve cuando la electricidad es cada vez más limpia. Por eso las tres cosas van juntas.',
      ], { lista: ['Eficiencia: menos energía para lo mismo', 'Fuentes limpias: renovables y nuclear', 'Electrificación: pasar a eléctrico lo que hoy quema combustible'] }),
      clas('¿Qué camino de descarbonización es cada medida?', { // e5
        'Eficiencia': ['Cambiar lámparas a LED', 'Aislar el techo de una casa'],
        'Fuentes limpias': ['Construir un parque eólico', 'Instalar paneles solares en una escuela'],
        'Electrificación': ['Pasar colectivos diésel a eléctricos', 'Cambiar una estufa a gas por una bomba de calor'],
      }, 'Tres caminos que se refuerzan: la eficiencia achica la demanda, las fuentes limpias la cubren y la electrificación lleva esa limpieza a más usos.', { d: 2 }),
      cad('Armá la cadena de por qué electrificar sirve más cuando la red es limpia.', [ // e6
        'Un colectivo pasa de gasoil a electricidad',
        'Deja de quemar combustible en la calle',
        'Su energía ahora viene de la red',
        'Si la red se genera con fuentes limpias, emite mucho menos',
      ], ['El colectivo eléctrico produce su propia electricidad al andar'], 'Electrificar sin limpiar la red sirve menos. Limpiar la red sin electrificar deja afuera al transporte y al calor.', { d: 3 }),
      mult('¿Cuáles de estos usos de energía emiten CO₂ directamente al usarse? Marcá todos.', [ // e7
        '+Una hornalla de gas',
        '+Un auto a nafta',
        '+Una estufa a leña',
        '-Un ventilador eléctrico',
        '-Una LED encendida',
      ], 'Los eléctricos no emiten donde se usan; sus emisiones, si las hay, están en la central. Los que queman algo emiten en el lugar.', { d: 2 }),
      op('Para un país cuya electricidad sale mayormente de gas, ¿qué conviene hacer primero si quiere que los autos eléctricos ayuden mucho?', [ // e8
        'Limpiar la red sumando fuentes que no emiten',
        'Prohibir todos los autos de un día para el otro',
        ['Nada: el auto eléctrico siempre emite cero', 'El auto no tiene caño de escape, pero su electricidad sí puede tener emisiones.'],
        'Importar nafta más barata de otros países',
      ], 'La electrificación y la red limpia van de la mano. Aun con gas, el eléctrico suele emitir menos, pero la ventaja crece con una red más limpia.', { d: 3 }),
      det('Leé esta nota y marcá lo equivocado.', [ // e9
        ['La energía es la mayor fuente de emisiones del mundo.', false],
        ['Como la electricidad no emite humo, electrificar alcanza para resolver el clima.', true, 'Electrificar ayuda si la electricidad se genera con fuentes limpias; si no, se traslada el problema.'],
        ['Quemar un litro de nafta emite más de 2 kg de CO₂.', false],
        ['La eficiencia no sirve porque las renovables son infinitas.', true, 'La eficiencia reduce cuánto hay que generar: abarata y acelera la transición.'],
      ], 'Ningún camino alcanza solo. La combinación es la estrategia.', { d: 3 }),
      comp('Completá.', 'Quemar combustibles fósiles emite [CO₂]; los tres caminos para descarbonizar son eficiencia, fuentes [limpias] y [electrificación].', ['oxígeno', 'fósiles', 'importación'], 'La idea central de toda la rama de energía.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: qué es la energía', 'Formas, eficiencia, fuentes, unidades y emisiones, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: la energía de un día de Lucía', 'Seguí la energía de un día común: qué usa, de dónde sale y cuánto CO₂ emite. Aprobalo para hacer crecer la rama.', [
      teoria('El día de Lucía', [
        'Lucía vive en Córdoba. A la mañana calienta agua en una pava eléctrica de 2.000 W durante 3 minutos. Va al trabajo en auto: 20 km ida y vuelta, y su auto usa 8 litros de nafta cada 100 km. A la noche mira una serie 2 horas en un televisor de 100 W con dos lámparas LED de 9 W prendidas.',
        'En invierno, la estufa a gas de su casa usa 3 m³ de gas por día.',
      ]),
      num('¿Cuántos litros de nafta usa Lucía por día para ir y volver del trabajo?', 1.6, 'litros', '20 km × 8 litros ÷ 100 km = 1,6 litros por día.', { ctx: 'Lucía maneja 20 km por día; su auto usa 8 L cada 100 km.', dec: 1, d: 2 }),
      num('¿Cuántos kilos de CO₂ emite ese viaje diario? (2,3 kg por litro de nafta)', 3.68, 'kg de CO₂', '1,6 × 2,3 = 3,68 kg de CO₂ por día. En un año laboral de unos 230 días, más de 800 kg.', { ctx: 'Lucía usa 1,6 L de nafta por día; la nafta emite 2,3 kg de CO₂ por litro.', dec: 2, tol: 0.05, d: 3 }),
      num('¿Cuántos kWh de electricidad usa a la noche entre el televisor y las dos lámparas?', 0.236, 'kWh', 'Televisor: 0,1 kW × 2 h = 0,2 kWh. Lámparas: 2 × 0,009 kW × 2 h = 0,036 kWh. Total: 0,236 kWh.', { ctx: 'TV de 100 W y dos LED de 9 W, prendidos 2 horas.', dec: 3, tol: 0.005, d: 3 }),
      rank('Ordená los usos de energía de Lucía en un día de invierno, de más a menos energía (aproximado).', [ // e4
        ['Estufa a gas (3 m³)', '≈ 30 kWh'],
        ['Viaje en auto (1,6 L de nafta)', '≈ 14 kWh'],
        ['Televisor y lámparas', '≈ 0,24 kWh'],
        ['Pava eléctrica', '0,1 kWh'],
      ], 'La calefacción y el auto pesan cientos de veces más que la pava o las luces. Es el principio de elegir por impacto del tronco.', { d: 4 }),
      op('Si Lucía quiere bajar sus emisiones lo más posible con un solo cambio, ¿cuál tiene más impacto?', [ // e5
        'Mejorar la aislación de la casa o la calefacción',
        'Apagar las lámparas LED un rato antes',
        ['Calentar menos agua en la pava a la mañana', 'Ahorra, pero es un uso muy chico comparado con la calefacción y el auto.'],
        'Desenchufar el cargador del celular a la noche',
      ], 'La calefacción es el mayor uso de energía de su día de invierno. Ahí está el cambio grande. El auto es el segundo.', { d: 3 }),
      clas('Clasificá los usos de energía de Lucía.', { // e6
        'Emiten CO₂ donde se usan': ['La estufa a gas', 'El auto a nafta'],
        'Sus emisiones dependen de la red': ['La pava eléctrica', 'El televisor', 'Las lámparas LED'],
      }, 'Los usos que queman combustible emiten en el lugar; los eléctricos, en la central. Electrificar y limpiar la red atacan los dos grupos.', { d: 3 }),
      det('Lucía escribe su plan. Marcá lo que está mal razonado.', [ // e7
        ['Voy a revisar los burletes y cerrar mejor las ventanas en invierno.', false],
        ['Voy a desenchufar la pava, porque es lo que más energía usa en mi casa.', true, 'La pava usa 0,1 kWh por día; la estufa, unos 30.'],
        ['Voy a compartir el auto con un compañero dos días por semana.', false],
        ['Como la tele es eléctrica, no tiene ningún impacto.', true, 'Su impacto depende de cómo se genera la electricidad, aunque sea chico.'],
      ], 'Un buen plan empieza por los usos grandes y no descarta los eléctricos: solo los pone en su lugar.', { d: 4 }),
    ]),
  ],
});
