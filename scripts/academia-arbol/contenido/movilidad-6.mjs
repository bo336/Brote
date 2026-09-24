import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// MOVILIDAD 6 — Carga, logística y viajes largos.
// Cómo se mueve la carga y cuánto emite cada modo, la combinación de camión,
// tren y barcaza, la última milla de las entregas, la aviación y los viajes
// largos y el turismo. Retoma la huella por pasajero y kilómetro (movilidad-1),
// combinar modos (movilidad-2), los combustibles y el auto eléctrico
// (movilidad-4) y la demanda inducida (movilidad-5).

export default unidad({
  slug: 'movilidad-6',
  rama: 'movilidad',
  orden: 6,
  nivel: 3,
  requiereTronco: 3,
  titulo: 'Carga, logística y viajes largos',
  bajada: 'Camiones, trenes, barcazas, paquetes a domicilio, aviones y vacaciones: la parte del transporte que no se ve desde la parada del colectivo.',
  objetivos: [
    'Calcular toneladas-kilómetro y comparar las emisiones de cada modo de carga',
    'Analizar cuándo conviene combinar camión, tren y barcaza',
    'Proponer soluciones para la última milla de las entregas',
    'Explicar el impacto climático de la aviación y quiénes lo generan',
    'Comparar opciones para viajes largos y turismo de menor huella',
  ],
  repasa: ['movilidad-1', 'movilidad-2', 'movilidad-4', 'movilidad-5'],
  fuentes: ['bcr-cargas-2018', 'bcr-cargas-2024', 'eea-intensidad-transporte', 'owid-aviacion', 'owid-huella-viajes', 'gossling-humpe-2020', 'iata-saf-2024', 'francia-vuelos-cortos', 'imo-ghg4', 'imo-estrategia-2023', 'lenzen-2018-turismo'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Cómo se mueve la carga', 'Toneladas-kilómetro, el dominio del camión en Argentina y cuánto emite cada modo.', [
      teoria('Toneladas por kilómetro', [
        'Para comparar el transporte de carga se usa la tonelada-kilómetro: mover una tonelada a lo largo de un kilómetro. Un camión con 30 toneladas que recorre 400 km hace 12.000 toneladas-kilómetro.',
        'Según la Bolsa de Comercio de Rosario, en 2018 se transportaron en Argentina unos 537 millones de toneladas de mercaderías: el 92,7 % en camión, el 3,7 % por agua, el 3,5 % en tren y apenas el 0,04 % en avión. Medido en toneladas-kilómetro, el camión concentró el 88 %.',
      ], {
        datos: barras('Carga transportada en Argentina por modo (2018)', '% de las toneladas', [
          ['Camión', 92.7],
          ['Por agua', 3.7],
          ['Tren', 3.5],
          ['Avión', 0.04],
        ], 'Bolsa de Comercio de Rosario.'),
      }),
      numv(3, (i) => { // e1
        const [t, km] = [[30, 400], [25, 600], [40, 350]][i];
        return {
          enunciado: `Un camión lleva ${t} toneladas a lo largo de ${km} km. ¿Cuántas toneladas-kilómetro hace?`,
          valor: t * km,
          unidad: 'toneladas-kilómetro',
          explicacion: `${t} × ${km} = ${(t * km).toLocaleString('es-AR')} toneladas-kilómetro. Con esta unidad se pueden comparar cargas y distancias distintas.`,
          ctx: `Carga de ${t} toneladas; recorrido de ${km} km.`,
        };
      }, { d: 1 }),
      est('Estimá qué porcentaje de las toneladas de carga de Argentina viaja en camión.', 93, { min: 0, max: 100, paso: 1, unidad: '%' }, 'Un 92,7 % en 2018, según la Bolsa de Comercio de Rosario: el tren y el agua juntos no llegan al 8 %.', { d: 2 }),
      teoria('Cuánto emite cada modo', [
        'Un estudio para la Agencia Europea de Medio Ambiente calculó cuánto emite cada modo de carga por tonelada-kilómetro en la Unión Europea en 2018, incluida la producción del combustible. Un camión pesado emitía unos 137 g de CO₂e por tonelada-kilómetro. El tren, alrededor del 18 % de eso (unos 25 g); las barcazas fluviales, el 24 % (unos 33 g); y el barco marítimo, apenas el 5 % (unos 7 g). En el otro extremo, el avión de carga y las camionetas de reparto emitían unas 16 veces más que el camión pesado.',
      ], {
        datos: barras('Emisiones de la carga por tonelada-kilómetro (UE, 2018, aproximado)', 'g CO₂e', [
          ['Avión de carga', 2200],
          ['Camión pesado', 137],
          ['Barcaza fluvial', 33],
          ['Tren', 25],
          ['Barco marítimo', 7],
        ], 'Estudio para la Agencia Europea de Medio Ambiente; valores redondeados.'),
      }),
      rank('Ordená estos modos de carga por sus emisiones por tonelada-kilómetro, de más a menos.', [ // e2
        ['Avión de carga', '≈ 2.200 g'],
        ['Camión pesado', '≈ 137 g'],
        ['Tren', '≈ 25 g'],
        ['Barco marítimo', '≈ 7 g'],
      ], 'Entre el avión y el barco hay una diferencia de cientos de veces por tonelada movida.', { d: 1, extremos: ['Más emisiones', 'Menos emisiones'] }),
      numv(3, (i) => { // e3
        const [t, km] = [[30, 500], [20, 300], [30, 1000]][i];
        const kg = Math.round(t * km * 137 / 1000);
        return {
          enunciado: `Un camión pesado lleva ${t} toneladas a ${km} km. Con 137 g de CO₂e por tonelada-kilómetro, ¿cuántos kilos de CO₂e emite el viaje? Redondeá al entero.`,
          valor: kg,
          unidad: 'kg CO₂e',
          tol: 1,
          explicacion: `${t} × ${km} = ${(t * km).toLocaleString('es-AR')} t-km; × 137 g = ${(t * km * 137).toLocaleString('es-AR')} g ≈ ${kg.toLocaleString('es-AR')} kg de CO₂e.`,
          ctx: `${t} t; ${km} km; 137 g por t-km.`,
        };
      }, { d: 2 }),
      numv(3, (i) => { // e4
        const tkm = [12000, 20000, 50000][i];
        const ahorro = Math.round(tkm * (137 - 25) / 1000);
        return {
          enunciado: `Una carga de ${tkm.toLocaleString('es-AR')} toneladas-kilómetro pasa del camión (137 g por t-km) al tren (25 g por t-km). ¿Cuántos kilos de CO₂e se ahorran?`,
          valor: ahorro,
          unidad: 'kg CO₂e',
          tol: 1,
          explicacion: `(137 − 25) × ${tkm.toLocaleString('es-AR')} = ${(tkm * 112).toLocaleString('es-AR')} g ≈ ${ahorro.toLocaleString('es-AR')} kg. El tren emite cerca de un 80 % menos por tonelada movida.`,
          ctx: `${tkm} t-km; 137 contra 25 g por t-km.`,
        };
      }, { d: 2 }),
      cad('Armá la cadena de por qué el tren es tan eficiente para la carga.', [ // e5
        'La rueda de acero sobre el riel roza muy poco',
        'Mover cada tonelada requiere poca energía',
        'Una locomotora arrastra muchos vagones a la vez',
        'La energía se reparte entre mucha carga',
        'Las emisiones por tonelada y kilómetro son bajas',
      ], ['El tren es eficiente porque va más rápido que el camión'], 'Poco rozamiento y mucha carga por motor: la física juega a favor del tren.', { d: 2 }),
      op('¿Por qué el avión de carga emite tanto por tonelada-kilómetro?', [ // e6
        'Mantenerse en el aire a gran velocidad exige mucha energía',
        'Porque los aviones de carga siempre viajan vacíos',
        ['Porque usa el mismo combustible que los barcos', 'Usa queroseno de aviación; el problema es la energía que necesita volar.'],
        'Porque vuela solo distancias muy cortas',
      ], 'Por eso el avión se usa para cargas chicas, valiosas o urgentes, no para volúmenes grandes.', { d: 2 }),
      clas('¿Para esta carga conviene más el tren o el barco, o el camión?', { // e7
        'Tren o barco': ['Granos de Santiago del Estero al puerto de Rosario', 'Mineral en grandes volúmenes hacia un puerto', 'Contenedores entre dos ciudades unidas por vías'],
        'Camión': ['Una entrega a un almacén de pueblo', 'Del campo al acopio más cercano', 'Una carga chica y urgente a un lugar sin vías'],
      }, 'Grandes volúmenes y largas distancias favorecen al tren y al barco; tramos cortos y dispersos, al camión.', { d: 2 }),
      vf('Como el camión lleva más del 90 % de la carga en Argentina, es el modo más eficiente.', false, 'Que un modo se use mucho no significa que sea el más eficiente. El tren y el barco emiten mucho menos por tonelada-kilómetro; su baja participación depende de la infraestructura y de la historia.', {
        razones: ['+Porque usarse mucho no es lo mismo que ser eficiente', '-Porque el tren emite más que el camión por tonelada', '-Porque en Argentina no hay ningún tren de carga'],
        d: 2,
      }),
      det('Leé este informe de una empresa de logística y marcá lo que conviene revisar.', [ // e8
        ['Medimos nuestras emisiones en gramos por tonelada-kilómetro.', false],
        ['Mandaremos la mercadería de exportación por avión porque es el modo más limpio.', true, 'El avión de carga es el modo que más emite por tonelada-kilómetro.'],
        ['Para las distancias largas, estudiaremos usar el tren.', false],
        ['El barco emite más que el camión por tonelada movida.', true, 'Es al revés: el barco marítimo emite alrededor del 5 % de lo que emite el camión.'],
      ], 'Con la tonelada-kilómetro, las comparaciones dejan de ser opiniones.', { d: 2 }),
      comp('Completá.', 'Mover una tonelada a lo largo de un kilómetro es una tonelada-[kilómetro]; en Argentina, más del 90 % de la carga va en [camión]; y por tonelada movida, el modo que menos emite es el [barco].', ['litro', 'avión', 'helicóptero'], 'Tres ideas para mirar la carga con números.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Combinar modos', 'Del campo al acopio en camión, del acopio al puerto en tren o barcaza: cuándo conviene la carga intermodal.', [
      teoria('Del campo al puerto', [
        'Según la Bolsa de Comercio de Rosario, para la cosecha 2023/24 se esperaba que el 83,4 % de las cargas agroindustriales llegara a los puertos en camión, el 16 % en tren y el 0,6 % en barcaza: casi 2,9 millones de viajes en camión y más de 330.000 vagones.',
      ], { destacado: { valor: '≈ 2,9 millones', texto: 'de viajes en camión se esperaban para llevar la cosecha 2023/24 a los puertos, según la Bolsa de Comercio de Rosario.' } }),
      numv(3, (i) => { // e1
        const [vag, t] = [[50, 50], [60, 55], [40, 50]][i];
        const camiones = Math.round(vag * t / 30);
        return {
          enunciado: `Un tren lleva ${vag} vagones de ${t} toneladas cada uno. ¿A cuántos camiones de 30 toneladas reemplaza? Redondeá al entero.`,
          valor: camiones,
          unidad: 'camiones',
          tol: 1,
          explicacion: `${vag} × ${t} = ${(vag * t).toLocaleString('es-AR')} t; ÷ 30 ≈ ${camiones} camiones. Menos camiones en las rutas también significa menos desgaste y menos riesgo de choques.`,
          ctx: `${vag} vagones de ${t} t; camiones de 30 t.`,
        };
      }, { d: 1 }),
      teoria('La carga intermodal', [
        'La carga intermodal combina modos: el camión hace los tramos cortos y dispersos (del campo al acopio, o del puerto a la fábrica) y el tren o la barcaza, el tramo largo. Cada transbordo cuesta tiempo y dinero, por eso la combinación conviene sobre todo con grandes volúmenes y distancias largas.',
      ]),
      numv(3, (i) => { // e2
        const [camion, tren] = [[50, 500], [30, 700], [80, 400]][i];
        const kg = Math.round(30 * camion * 137 / 1000 + 30 * tren * 25 / 1000);
        return {
          enunciado: `Se mueven 30 toneladas: ${camion} km en camión (137 g por t-km) y ${tren} km en tren (25 g por t-km). ¿Cuántos kilos de CO₂e emite el viaje completo? Redondeá al entero.`,
          valor: kg,
          unidad: 'kg CO₂e',
          tol: 1,
          explicacion: `Camión: 30 × ${camion} × 137 = ${(30 * camion * 137 / 1000).toLocaleString('es-AR')} kg. Tren: 30 × ${tren} × 25 = ${(30 * tren * 25 / 1000).toLocaleString('es-AR')} kg. Total ≈ ${kg.toLocaleString('es-AR')} kg, frente a ${Math.round(30 * (camion + tren) * 137 / 1000).toLocaleString('es-AR')} kg si todo fuera en camión.`,
          ctx: `30 t; ${camion} km en camión y ${tren} km en tren.`,
        };
      }, { d: 3 }),
      cad('Armá la cadena de por qué los tramos cortos suelen quedar en camión.', [ // e3
        'La carga sale de muchos campos dispersos',
        'No hay vías que lleguen a cada campo',
        'Pasarla al tren exige un transbordo',
        'Para pocos kilómetros, el transbordo cuesta más de lo que ahorra',
        'El primer tramo se hace en camión hasta un acopio con vías',
      ], ['El tren llega a la puerta de cada campo'], 'La combinación eficiente usa cada modo donde es mejor.', { d: 2 }),
      op('¿Por qué no se mueve toda la carga en tren?', [ // e4
        'Por los transbordos, los tramos sin vías y la infraestructura',
        'Porque el tren emite más que el camión por tonelada',
        ['Porque la ley prohíbe llevar granos en tren', 'No hay tal prohibición: en 2023/24 se esperaba mover el 16 % en tren.'],
        'Porque los trenes no pueden llevar cargas pesadas',
      ], 'Para crecer, el tren necesita vías en buen estado, terminales de transferencia y horarios confiables.', { d: 2 }),
      vf('Si la carga pasa del camión al tren, desaparecen los camiones del recorrido.', false, 'Siguen haciendo falta para el primer y el último tramo. Lo que cambia es que hacen trayectos cortos, y el largo va en tren.', {
        razones: ['+Porque siguen haciendo el primer y el último tramo', '-Porque el tren también llega a cada casa', '-Porque los camiones se prohíben en esas rutas'],
        d: 1,
      }),
      par('Uní cada modo con su principal fortaleza.', [ // e5
        ['Camión', 'Llega puerta a puerta'],
        ['Tren', 'Grandes volúmenes a larga distancia'],
        ['Barcaza', 'Muchísima carga por ríos navegables'],
        ['Avión', 'Rapidez para cargas chicas y urgentes'],
      ], 'Cada modo tiene un lugar: el problema es usar uno solo para todo.', { d: 1 }),
      est('Estimá cuántos viajes en camión se esperaban para llevar la cosecha 2023/24 a los puertos.', 2900000, { min: 10000, max: 100000000, unidad: 'viajes', escala: 'log' }, 'Casi 2,9 millones de viajes, según la Bolsa de Comercio de Rosario.', { d: 2 }),
      clas('¿Es un primer o último tramo, o un tramo largo troncal?', { // e6
        'Primer o último tramo': ['Del campo al acopio del pueblo', 'Del puerto a la fábrica de la ciudad'],
        'Tramo largo troncal': ['Del acopio del norte al puerto de Rosario', 'Del puerto de Buenos Aires a una ciudad del sur'],
      }, 'La idea intermodal: tramos cortos flexibles y tramos largos masivos.', { d: 1 }),
      mult('¿Qué hace falta para que el tren mueva más carga? Marcá todo.', [ // e7
        '+Vías en buen estado',
        '+Terminales para pasar la carga entre modos',
        '+Horarios confiables',
        '+Conexión directa con los puertos',
        '-Prohibir los camiones en todo el país',
      ], 'El tren gana carga cuando es confiable y bien conectado, no por prohibición.', { d: 1 }),
      det('Leé esta propuesta de una cámara empresaria y marcá lo que conviene revisar.', [ // e8
        ['Proponemos mejorar las vías que llegan a los puertos.', false],
        ['Si mejoramos el tren, no harán falta más camiones.', true, 'Siguen haciendo falta para los tramos cortos.'],
        ['Construiremos terminales para pasar la carga del camión al tren.', false],
        ['Para 20 km conviene siempre el tren, aunque haya que hacer dos transbordos.', true, 'En tramos cortos, los transbordos suelen costar más de lo que ahorran.'],
      ], 'Planificar la carga es combinar modos con criterio, no elegir un ganador.', { d: 2 }),
      comp('Completá.', 'Combinar camión, tren y barcaza es la carga [intermodal]; pasar la carga de un modo a otro es un [transbordo]; y para la cosecha 2023/24, el [16] % de las cargas agroindustriales iba a llegar a los puertos en tren.', ['individual', 'peaje', '60'], 'Tres conceptos para pensar la logística de un país extenso.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('La última milla', 'Paquetes a domicilio, camionetas medio vacías, entregas fallidas y bicis de carga.', [
      teoria('El tramo más caro', [
        'La última milla es el tramo final hasta la casa o el negocio. Es el más caro e ineficiente por unidad: muchas paradas, paquetes chicos, tránsito, entregas fallidas y devoluciones. Según el estudio para la Agencia Europea de Medio Ambiente, las camionetas de reparto emiten por tonelada-kilómetro unas 16 veces más que un camión pesado, porque llevan poca carga en relación con su peso y su consumo.',
      ]),
      numv(3, (i) => { // e1
        const [g, km, paq] = [[250, 80, 100], [300, 60, 120], [200, 100, 80]][i];
        return {
          enunciado: `Una camioneta de reparto emite ${g} g de CO₂ por km, recorre ${km} km por día y entrega ${paq} paquetes. ¿Cuántos gramos corresponden a cada paquete?`,
          valor: g * km / paq,
          unidad: 'g por paquete',
          explicacion: `${g} × ${km} = ${(g * km).toLocaleString('es-AR')} g; ÷ ${paq} = ${g * km / paq} g por paquete. Cuantos más paquetes por recorrido, menos emisiones por entrega.`,
          ctx: `${g} g por km; ${km} km; ${paq} paquetes.`,
        };
      }, { d: 1 }),
      cad('Armá la cadena de cómo la entrega "en una hora" puede aumentar las emisiones.', [ // e2
        'Se promete entregar cada pedido en una hora',
        'No hay tiempo para juntar varios pedidos en un recorrido',
        'Salen más vehículos medio vacíos',
        'Aumentan los kilómetros por paquete',
        'Suben las emisiones y el tránsito',
      ], ['La rapidez obliga a llenar mejor cada camioneta'], 'La velocidad de entrega tiene un costo ambiental: cuanto más rápido, menos se consolida.', { d: 2 }),
      teoria('Soluciones', [
        'Hay varias formas de mejorar la última milla: consolidar pedidos para que cada vehículo salga lleno, usar puntos de retiro y casilleros donde se dejan muchos paquetes juntos, repartir en bicis de carga o camionetas eléctricas en zonas densas desde pequeños centros de distribución barriales, y ordenar horarios y zonas de carga y descarga. Del lado de quien compra, ayuda elegir entregas menos urgentes, agrupar compras y evitar devoluciones innecesarias.',
      ]),
      clas('¿Reduce o aumenta el impacto de la última milla?', { // e3
        'Lo reduce': ['Retirar el pedido en un casillero del barrio', 'Agrupar varias compras en una sola entrega', 'Repartir en bici de carga en el centro'],
        'Lo aumenta': ['Pedir entrega urgente de un solo producto', 'Comprar varias tallas para devolver las que no sirven', 'No estar en casa y pedir un segundo intento'],
      }, 'Muchas decisiones de quien compra definen cuántos kilómetros hace el repartidor.', { d: 1 }),
      op('¿Por qué un casillero o punto de retiro reduce las emisiones del reparto?', [ // e4
        'Concentra muchas entregas en una sola parada',
        'Porque los paquetes pesan menos en un casillero',
        ['Porque los casilleros funcionan con energía solar', 'Aunque la usen, lo que ahorra es kilómetros de reparto.'],
        'Porque elimina la necesidad de fabricar productos',
      ], 'Menos paradas y menos entregas fallidas significan menos kilómetros por paquete.', { d: 2 }),
      vf('Comprar por internet siempre contamina menos que ir al negocio.', false, 'Depende: si al negocio se va caminando, en bici o en colectivo, o si el pedido llega en entregas urgentes con devoluciones, la compra online puede emitir más. Si se consolida bien, puede emitir menos.', {
        razones: ['+Porque depende de cómo se va al negocio y de cómo se entrega', '-Porque los paquetes no se transportan', '-Porque ir al negocio es siempre en auto'],
        d: 2,
      }),
      numv(3, (i) => { // e5
        const km = [40, 60, 100][i];
        return {
          enunciado: `Un centro de distribución barrial reemplaza ${km} km diarios de camioneta (250 g de CO₂ por km) por bicis de carga. ¿Cuántos kg de CO₂ se evitan por día?`,
          valor: km * 250 / 1000,
          unidad: 'kg CO₂',
          explicacion: `${km} × 250 = ${(km * 250).toLocaleString('es-AR')} g = ${(km * 250 / 1000).toLocaleString('es-AR')} kg por día. Además, menos ruido, menos contaminación del aire y menos espacio ocupado en la calle.`,
          ctx: `${km} km de camioneta por día; 250 g por km.`,
        };
      }, { d: 1 }),
      par('Uní cada solución con cómo ayuda.', [ // e6
        ['Consolidar pedidos', 'Cada vehículo sale más lleno'],
        ['Punto de retiro', 'Muchas entregas en una sola parada'],
        ['Bici de carga', 'Reparto sin emisiones en zonas densas'],
        ['Horario nocturno de descarga', 'Menos choque con el tránsito de la hora pico'],
      ], 'La logística urbana combina vehículos, lugares y horarios.', { d: 1 }),
      numv(3, (i) => { // e7
        const [entregas, fallo, km] = [[100, 10, 2], [150, 20, 1.5], [80, 15, 3]][i];
        const extra = Math.round(entregas * fallo / 100 * km * 10) / 10;
        return {
          enunciado: `Un repartidor hace ${entregas} entregas por día. Si el ${fallo} % falla y cada nuevo intento suma ${km.toLocaleString('es-AR')} km, ¿cuántos km extra recorre por día?`,
          valor: extra,
          unidad: 'km',
          dec: extra % 1 === 0 ? 0 : 1,
          explicacion: `${entregas} × ${fallo} % = ${entregas * fallo / 100} entregas fallidas; × ${km.toLocaleString('es-AR')} km = ${extra.toLocaleString('es-AR')} km extra por día, solo por no encontrar a nadie.`,
          ctx: `${entregas} entregas; ${fallo} % fallidas; ${km} km por reintento.`,
        };
      }, { d: 2 }),
      mult('¿Qué puede hacer quien compra para reducir el impacto de sus pedidos? Marcá todo.', [ // e8
        '+Elegir una entrega menos urgente',
        '+Agrupar compras en un solo pedido',
        '+Retirar en un punto cercano',
        '+Evitar devoluciones innecesarias',
        '-Pedir cada producto por separado apenas se lo necesita',
      ], 'La comodidad tiene kilómetros detrás: elegir con información ayuda.', { d: 1 }),
      det('Leé este anuncio de una aplicación de compras y marcá lo que conviene revisar.', [ // e9
        ['Ahora podés retirar tus pedidos en casilleros de tu barrio.', false],
        ['Entregamos en 15 minutos, y es la opción más ecológica.', true, 'La entrega ultrarrápida impide consolidar y suele sumar kilómetros por paquete.'],
        ['En el centro repartimos con bicis de carga.', false],
        ['Devolvé todo lo que quieras: devolver no tiene impacto.', true, 'Cada devolución es otro viaje y más manipulación.'],
      ], 'Rapidez y devoluciones gratis tienen costos ambientales que no aparecen en el precio.', { d: 2 }),
      comp('Completá.', 'El tramo final de una entrega es la última [milla]; juntar varios pedidos en un mismo recorrido es [consolidar]; y en zonas densas se puede repartir en bicis de [carga].', ['ruta', 'separar', 'paseo'], 'Tres ideas para ordenar el reparto urbano.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Volar', 'Cuánto calienta la aviación, quiénes vuelan, los combustibles alternativos y los vuelos que se reemplazan por trenes.', [
      teoria('Una parte chica que pesa más', [
        'Según Our World in Data, en 2019 la aviación generó el 2,5 % de las emisiones de CO₂ de origen fósil y del uso de la tierra. Pero su efecto en el calentamiento es mayor: explica alrededor del 3,5 % del forzamiento radiativo efectivo, porque dos tercios de su efecto vienen de factores distintos del CO₂, sobre todo las estelas de condensación que se forman detrás de los aviones.',
      ]),
      num('Si la aviación genera el 2,5 % del CO₂ pero explica el 3,5 % del calentamiento, ¿cuántas veces más grande es su peso en el calentamiento que en el CO₂? Redondeá a un decimal.', 1.4, 'veces', '3,5 ÷ 2,5 = 1,4 veces. Mirar solo el CO₂ subestima el impacto de volar.', { ctx: '2,5 % del CO₂; 3,5 % del forzamiento.', dec: 1, tol: 0.1, d: 2 }),
      clas('¿Es un efecto del CO₂ o un efecto distinto del CO₂ de la aviación?', { // e1
        'Efecto del CO₂': ['Quemar queroseno libera dióxido de carbono', 'Parte de ese gas queda en el aire durante siglos'],
        'Efecto distinto del CO₂': ['Estelas de condensación que atrapan calor', 'Óxidos de nitrógeno emitidos en altura'],
      }, 'Las estelas duran poco, pero se forman cada día: por eso pesan tanto en el calentamiento actual.', { d: 2 }),
      teoria('Pocos vuelan mucho', [
        'Un estudio publicado en 2020 estimó que en 2018 solo el 11 % de la población mundial tomó al menos un vuelo, y como mucho el 4 % un vuelo internacional. El 1 % de la población que más vuela sería responsable de más de la mitad de las emisiones de los vuelos de pasajeros.',
      ], { destacado: { valor: '1 %', texto: 'de la población mundial que más vuela genera más de la mitad de las emisiones de los vuelos de pasajeros, según un estudio de 2020.' } }),
      vf('La mayoría de la población mundial vuela todos los años.', false, 'En 2018, solo el 11 % de la población mundial tomó un vuelo. Volar es, sobre todo, una actividad de una minoría.', {
        razones: ['+Porque solo el 11 % voló en 2018', '-Porque volar es obligatorio para trabajar', '-Porque todas las personas vuelan al menos una vez por año'],
        d: 1,
      }),
      op('¿Qué implica que el 1 % que más vuela genere más de la mitad de las emisiones de los vuelos de pasajeros?', [ // e2
        'Que medidas dirigidas a quienes vuelan mucho tienen gran efecto',
        'Que no importa cuánto vuele cada persona',
        ['Que la aviación no tiene ningún impacto climático', 'Lo tiene: 2,5 % del CO₂ y más del calentamiento.'],
        'Que todas las personas contaminan lo mismo al viajar',
      ], 'Cuando las emisiones están tan concentradas, las políticas también pueden concentrarse.', { d: 2 }),
      numv(3, (i) => { // e3
        const km = [700, 1100, 1500][i];
        const kg = Math.round(km * 2 * 246 / 1000);
        return {
          enunciado: `Un vuelo de cabotaje de ida y vuelta tiene ${km.toLocaleString('es-AR')} km por tramo. Con 246 g de CO₂e por pasajero y km, ¿cuántos kilos emite cada pasajero? Redondeá al entero.`,
          valor: kg,
          unidad: 'kg CO₂e',
          tol: 2,
          explicacion: `${km.toLocaleString('es-AR')} × 2 × 246 = ${(km * 2 * 246).toLocaleString('es-AR')} g ≈ ${kg} kg por pasajero, sin contar el efecto de las estelas.`,
          ctx: `${km} km por tramo; 246 g por pasajero y km.`,
        };
      }, { d: 1 }),
      teoria('Combustibles, tecnología y trenes', [
        'Los aviones eléctricos o a hidrógeno, por ahora, sirven solo para distancias cortas. Los combustibles sostenibles de aviación, hechos por ejemplo con aceites usados, crecen pero siguen siendo mínimos: según la IATA, en 2024 se produjo 1 millón de toneladas, apenas el 0,3 % del combustible de aviación del mundo. Y aunque cada avión nuevo es algo más eficiente, el aumento de vuelos se come esas mejoras.',
        'Algunos países reemplazan vuelos por trenes. Francia prohibió desde 2023 los vuelos internos cuando hay una alternativa en tren de hasta dos horas y media, lo que afectó a tres rutas desde París.',
      ]),
      numv(3, (i) => { // e4
        const litros = [1000000, 5000000, 20000000][i];
        return {
          enunciado: `Si los combustibles sostenibles son el 0,3 % del combustible de aviación, ¿cuántos litros hay en ${litros.toLocaleString('es-AR')} litros de combustible?`,
          valor: litros * 3 / 1000,
          unidad: 'litros',
          explicacion: `${litros.toLocaleString('es-AR')} × 0,3 % = ${(litros * 3 / 1000).toLocaleString('es-AR')} litros. Todavía es una fracción mínima del total.`,
          ctx: `${litros} litros; 0,3 % sostenible.`,
        };
      }, { d: 1 }),
      cad('Armá la cadena de por qué la eficiencia sola no baja las emisiones de la aviación.', [ // e5
        'Cada avión nuevo consume algo menos por pasajero',
        'Los costos por pasaje bajan',
        'Vuela más gente, y más seguido',
        'El total de kilómetros volados crece más rápido que la eficiencia',
        'Las emisiones totales siguen subiendo',
      ], ['Aviones más eficientes hacen que la gente vuele menos'], 'Es un efecto rebote a escala mundial: sin gestionar la demanda, la eficiencia no alcanza.', { d: 3 }),
      par('Uní cada medida con su efecto esperado.', [ // e6
        ['Prohibir vuelos cortos con tren alternativo', 'Pasar viajeros al tren'],
        ['Combustible sostenible de aviación', 'Menos CO₂ de origen fósil por litro'],
        ['Rutas que evitan formar estelas', 'Menos calentamiento distinto del CO₂'],
        ['Cargos más altos para quienes vuelan muy seguido', 'Más peso sobre quienes más emiten'],
      ], 'Ninguna medida sola alcanza: la aviación necesita varias a la vez.', { d: 2 }),
      mult('¿Cómo puede una persona reducir la huella de sus vuelos? Marcá todo.', [ // e7
        '+Viajar en tren o micro en distancias medias',
        '+Hacer menos viajes, pero más largos',
        '+Reemplazar reuniones por videollamadas',
        '+Elegir vuelos directos en vez de con escalas',
        '-Elegir vuelos con varias escalas para "repartir" las emisiones',
      ], 'Los despegues consumen mucho: cada escala suma emisiones.', { d: 2 }),
      det('Leé este folleto de una agencia de viajes y marcá lo que conviene revisar.', [ // e8
        ['El tren es una opción de menor huella para viajes medianos.', false],
        ['La aviación ya usa mayormente combustibles sostenibles.', true, 'En 2024 eran apenas el 0,3 % del combustible de aviación.'],
        ['Francia reemplazó algunos vuelos cortos por trenes.', false],
        ['El impacto de volar es solo su CO₂.', true, 'Las estelas y otros efectos distintos del CO₂ suman bastante más calentamiento.'],
      ], 'La aviación es uno de los sectores más difíciles de descarbonizar: conviene no creer en atajos.', { d: 2 }),
      comp('Completá.', 'Las líneas blancas que dejan los aviones y atrapan calor son [estelas] de condensación; en 2018, solo el [11] % de la población mundial voló; y en 2024 los combustibles sostenibles eran el [0,3] % del combustible de aviación.', ['nubes', '60', '30'], 'Tres datos para discutir el lugar de la aviación en el clima.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Viajes largos y turismo', 'Avión, auto o tren para ir lejos, la huella del turismo y los barcos que mueven el comercio mundial.', [
      teoria('Elegir cómo viajar lejos', [
        'Para distancias medias, de unos cientos de kilómetros, el tren o el micro de larga distancia suelen tener mucha menos huella por pasajero que el avión o el auto con una sola persona. Con los valores de referencia británicos que publica Our World in Data que ya usaste, un vuelo de cabotaje emite unos 246 g de CO₂e por pasajero y km; un auto a nafta, unos 192 g por km, sin importar cuántas personas lleve; y el tren, unos 41 g por pasajero y km.',
      ]),
      numv(3, (i) => { // e1
        const km = [1000, 700, 500][i];
        const kg = Math.round(4 * km * 246 / 1000);
        return {
          enunciado: `Una familia de cuatro personas viaja ${km.toLocaleString('es-AR')} km en avión (246 g por pasajero y km). ¿Cuántos kilos de CO₂e emite en total en ese tramo? Redondeá al entero.`,
          valor: kg,
          unidad: 'kg CO₂e',
          tol: 2,
          explicacion: `4 × ${km.toLocaleString('es-AR')} × 246 = ${(4 * km * 246).toLocaleString('es-AR')} g ≈ ${kg} kg. En auto, los cuatro juntos emitirían unos ${Math.round(km * 192 / 1000)} kg: con el auto lleno, la comparación cambia mucho.`,
          ctx: `4 personas; ${km} km; 246 g por pasajero y km.`,
        };
      }, { d: 2 }),
      rank('Una persona sola viaja 800 km. Ordená estas opciones por sus emisiones, de más a menos (valores de referencia).', [ // e2
        ['Avión: 246 g por km', '≈ 197 kg'],
        ['Auto a nafta, sola: 192 g por km', '≈ 154 kg'],
        ['Tren: 41 g por km', '≈ 33 kg'],
      ], 'Para una sola persona, el tren emite una fracción de lo que emiten el avión o el auto.', { d: 1, extremos: ['Más emisiones', 'Menos emisiones'] }),
      numv(3, (i) => { // e3
        const km = [10, 5, 20][i];
        return {
          enunciado: `Una persona va y vuelve del trabajo en colectivo, ${km} km por tramo, 220 días por año, a 105 g de CO₂e por pasajero y km. ¿Cuántos kilos emite en un año?`,
          valor: Math.round(km * 2 * 220 * 105 / 1000),
          unidad: 'kg CO₂e',
          tol: 1,
          explicacion: `${km} × 2 × 220 × 105 = ${(km * 2 * 220 * 105).toLocaleString('es-AR')} g ≈ ${Math.round(km * 2 * 220 * 105 / 1000)} kg por año. Un solo vuelo de ida y vuelta de 1.000 km por tramo emite unos 492 kg por pasajero: ${km * 2 * 220 * 105 / 1000 < 492 ? 'más que todo ese año de colectivo' : 'más de la mitad de todo ese año de colectivo'}.`,
          ctx: `${km} km por tramo; 220 días; 105 g por pasajero y km.`,
        };
      }, { d: 2 }),
      teoria('La huella del turismo', [
        'Un estudio publicado en 2018 estimó que la huella de carbono del turismo mundial pasó de 3,9 a 4,5 GtCO₂e entre 2009 y 2013: alrededor del 8 % de las emisiones mundiales. No es solo el transporte: también pesan las compras, la comida y el alojamiento. La mayor parte la generan personas de países de ingresos altos. Viajar a destinos más cercanos, quedarse más tiempo en cada lugar y consumir productos locales reduce esa huella.',
      ]),
      est('Estimá qué porcentaje de las emisiones mundiales se atribuía al turismo, según el estudio de 2018.', 8, { min: 0, max: 50, paso: 1, unidad: '%' }, 'Alrededor del 8 %, sumando transporte, compras, comida y alojamiento de los turistas.', { d: 2 }),
      vf('En un viaje de vacaciones, el transporte es lo único que genera emisiones.', false, 'El alojamiento, la comida y las compras también suman. El estudio de 2018 encontró que el turismo pesa alrededor del 8 % de las emisiones mundiales contando todo eso.', {
        razones: ['+Porque alojamiento, comida y compras también emiten', '-Porque los hoteles no usan energía', '-Porque la comida en viaje no tiene huella'],
        d: 1,
      }),
      clas('¿Es una práctica de turismo de menor o de mayor huella?', { // e4
        'Menor huella': ['Ir en tren a un destino cercano y quedarse dos semanas', 'Comer productos de la zona', 'Recorrer el destino caminando o en bici'],
        'Mayor huella': ['Tres escapadas de fin de semana en avión', 'Un crucero con vuelos de ida y vuelta', 'Alquilar un auto grande para hacer pocas cuadras'],
      }, 'Viajar menos veces, más cerca y más tiempo es la receta del turismo lento.', { d: 1 }),
      teoria('Los barcos del comercio mundial', [
        'La mayor parte del comercio mundial viaja por mar. Según la Organización Marítima Internacional, en 2018 el transporte marítimo generó el 2,89 % de las emisiones humanas de gases de efecto invernadero. Por tonelada movida es el modo más eficiente, pero mueve cantidades enormes y usa combustibles muy contaminantes. En 2023, la organización acordó reducir sus emisiones al menos un 20 % para 2030 y un 70 % para 2040, respecto de 2008, y llegar a cero neto alrededor de 2050.',
      ]),
      op('¿Qué acordó la Organización Marítima Internacional en 2023?', [ // e5
        'Llegar a cero neto alrededor de 2050, con metas intermedias',
        'Prohibir todos los barcos de carga para 2030',
        ['Que el transporte marítimo quede fuera de toda meta climática', 'Al contrario: fijó metas para 2030, 2040 y 2050.'],
        'Reemplazar todos los barcos por aviones de carga',
      ], 'El comercio marítimo es un sector difícil de descarbonizar, pero ya tiene metas acordadas.', { d: 2 }),
      mult('¿Qué prácticas corresponden al turismo lento? Marcá todas.', [ // e6
        '+Elegir destinos más cercanos',
        '+Quedarse más tiempo en cada lugar',
        '+Moverse en tren o micro cuando se puede',
        '+Consumir en comercios y productores locales',
        '-Sumar la mayor cantidad posible de destinos en pocos días',
      ], 'El turismo lento también suele dejar más ingresos en las comunidades que se visitan.', { d: 1 }),
      det('Leé estos consejos de un blog de viajes y marcá lo que conviene revisar.', [ // e7
        ['Para 500 km, el tren es una buena opción de baja huella.', false],
        ['El avión siempre emite menos que el auto, lleve cuantas personas lleve el auto.', true, 'Con el auto lleno, el auto puede emitir mucho menos que cuatro pasajes de avión.'],
        ['Quedarse más tiempo en un destino reduce la huella por día de viaje.', false],
        ['El turismo no tiene impacto en el clima.', true, 'Se estima en alrededor del 8 % de las emisiones mundiales.'],
      ], 'Los viajes largos son donde más pesa elegir bien.', { d: 2 }),
      comp('Completá.', 'Viajar más cerca, menos veces y por más tiempo es el turismo [lento]; el turismo representa alrededor del [8] % de las emisiones mundiales; y el transporte marítimo se propuso llegar a cero neto alrededor de [2050].', ['rápido', '80', '2025'], 'Tres ideas para viajar lejos con menos huella.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: carga y viajes largos', 'Toneladas-kilómetro, carga intermodal, última milla, aviación y turismo, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: la cooperativa del norte', 'Una cooperativa del Chaco tiene que llevar su cosecha al puerto y mandar a tres personas a un congreso. Compará las opciones con números.', [
      teoria('La situación', [
        'La cooperativa debe llevar 30.000 toneladas de granos a un puerto a 800 km. Opción A: todo en camión. Opción B: 50 km en camión hasta un acopio con vías y 750 km en tren. Usá 137 g de CO₂e por tonelada-kilómetro para el camión y 25 g para el tren. Además, tres integrantes tienen que asistir a un congreso a 1.000 km: pueden ir en avión (246 g por pasajero y km), en micro, o participar por videollamada.',
      ]),
      num('¿Cuántas toneladas de CO₂e emite la opción A, todo en camión?', 3288, 't CO₂e', '30.000 × 800 = 24.000.000 t-km; × 137 g = 3.288.000.000 g = 3.288 toneladas de CO₂e.', { ctx: '30.000 t; 800 km; 137 g por t-km.', tol: 5, d: 2 }),
      num('¿Cuántas toneladas de CO₂e emite la opción B, camión más tren? Redondeá al entero.', 768, 't CO₂e', 'Camión: 30.000 × 50 × 137 = 205,5 t. Tren: 30.000 × 750 × 25 = 562,5 t. Total: 768 toneladas de CO₂e.', { ctx: '50 km en camión y 750 km en tren.', tol: 2, d: 3 }),
      num('¿En qué porcentaje reduce las emisiones la opción B respecto de la A? Redondeá al entero.', 77, '%', '(3.288 − 768) ÷ 3.288 × 100 ≈ 77 %: más de tres cuartos menos de emisiones moviendo la misma carga.', { ctx: 'A: 3.288 t; B: 768 t.', tol: 1, d: 2 }),
      op('¿Por qué la opción B igual necesita camiones?', [ // e4
        'Porque las vías no llegan a cada campo',
        'Porque el tren no puede transportar granos',
        ['Porque el camión emite menos que el tren', 'Es al revés: emite más por tonelada-kilómetro.'],
        'Porque la ley obliga a usar los dos modos',
      ], 'El camión hace el tramo corto y disperso; el tren, el largo y masivo.', { d: 1 }),
      num('¿Cuántos kilos de CO₂e emitirían las tres personas si viajan en avión, ida y vuelta?', 1476, 'kg CO₂e', '3 × 1.000 × 2 × 246 = 1.476.000 g = 1.476 kg, sin contar el efecto de las estelas.', { ctx: '3 personas; 1.000 km por tramo; 246 g por pasajero y km.', tol: 5, d: 2 }),
      mult('¿Qué opciones reducen la huella del viaje al congreso? Marcá todas.', [ // e6
        '+Participar por videollamada',
        '+Viajar en micro de larga distancia',
        '+Mandar a una sola persona que comparta lo aprendido',
        '+Aprovechar el viaje para varias reuniones en la misma ciudad',
        '-Ir cada uno en su propio vuelo en días distintos',
      ], 'Muchas veces la mejor opción combina menos viajes con viajes más eficientes.', { d: 2 }),
      det('La cooperativa redacta su informe de sustentabilidad. Marcá lo que conviene corregir.', [ // e7
        ['Pasar al tren el tramo largo reduce cerca de un 77 % las emisiones de la carga.', false],
        ['Con el tren eliminamos por completo el uso de camiones.', true, 'Los camiones siguen haciendo los 50 km hasta el acopio.'],
        ['Una integrante participará del congreso por videollamada.', false],
        ['El viaje en avión no tiene impacto porque es una sola vez al año.', true, 'Un solo viaje de ida y vuelta de tres personas suma unos 1.476 kg de CO₂e.'],
      ], 'Un informe creíble muestra los números y no exagera los logros.', { d: 3 }),
    ]),
  ],
});
