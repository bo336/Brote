import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// ENERGÍA 5 — Una red para las renovables.
// Cómo se decide qué central genera en cada momento, qué pasa cuando sobra
// sol y viento, qué hacen de verdad las baterías, cómo se vuelve flexible la
// demanda y por qué las líneas de transmisión son el cuello de botella.
// Retoma la red y la curva de demanda (energia-3), la variabilidad de las
// renovables (energia-4) y potencia y energía (tronco-2).

export default unidad({
  slug: 'energia-5',
  rama: 'energia',
  orden: 5,
  nivel: 3,
  requiereTronco: 3,
  titulo: 'Una red para las renovables',
  bajada: 'Orden de despacho, curva del pato, baterías que valen por sus servicios, demanda que se mueve y líneas que faltan: cómo se opera una red con cada vez más sol y viento.',
  objetivos: [
    'Explicar el orden de despacho y el costo marginal de la electricidad',
    'Interpretar la curva del pato y el recorte de generación renovable',
    'Distinguir potencia y energía en un sistema de almacenamiento y calcular su duración y pérdidas',
    'Evaluar la flexibilidad de la demanda como recurso del sistema',
    'Analizar la transmisión como condición para integrar renovables',
  ],
  repasa: ['energia-3', 'energia-4', 'tronco-2', 'movilidad-4'],
  fuentes: ['cammesa', 'iea-baterias-2024', 'bnef-baterias-2024', 'eia-curva-pato', 'almagba-2025', 'iea-renovables-2024', 'irena'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Quién genera primero', 'El orden de despacho: por qué primero se usan las centrales más baratas de operar y qué cambia con las renovables.', [
      teoria('El despacho', [
        'En cada momento, la electricidad que se genera tiene que igualar a la que se consume. En Argentina, CAMMESA organiza el despacho: decide qué centrales generan en cada hora. Lo hace, en general, por orden de costo variable: primero las que menos cuesta hacer funcionar una hora más, y así hasta cubrir la demanda. A eso se lo llama orden de mérito.',
        'El sol y el viento no tienen costo de combustible: su costo variable es casi cero. Por eso, cuando están disponibles, entran primero. Las centrales térmicas a gas o gasoil, que pagan combustible, quedan para el final.',
      ]),
      ord('Ordená estas centrales según su lugar típico en el orden de despacho, de la que entra primero a la que entra última.', [ // e1
        'Parque eólico con viento',
        'Ciclo combinado a gas, eficiente',
        'Turbina a gas de ciclo abierto, menos eficiente',
        'Turbina a gasoil para los picos',
      ], 'Entran primero las de menor costo variable: el viento no paga combustible; entre las térmicas, las más eficientes gastan menos gas por MWh; el gasoil, el más caro, queda para las horas más exigentes.', { d: 3, extremos: ['Entra primero', 'Entra última'] }),
      teoria('El costo marginal', [
        'La última central que se necesita para cubrir la demanda en una hora marca el costo marginal del sistema en esa hora: es lo que cuesta producir el último megavatio-hora. En las horas de alta demanda entran centrales caras y el costo marginal sube mucho. Cuando sobra sol o viento, el costo marginal puede bajar muchísimo.',
      ]),
      ejemplo('Una hora de despacho', 'La demanda es de 900 MW. Hay 300 MW de eólica (costo variable 0), 400 MW de un ciclo combinado (50 dólares por MWh) y 400 MW de turbinas a gasoil (180 dólares por MWh).', [
        'Primero entra la eólica: cubre 300 MW. Faltan 600.',
        'Después, el ciclo combinado: cubre 400 MW. Faltan 200.',
        'Las turbinas a gasoil cubren los 200 MW que faltan.',
        'La última central en entrar es el gasoil: el costo marginal es de 180 dólares por MWh.',
      ], 'Con 200 MW más de viento, el gasoil no haría falta y el costo marginal bajaría a 50.'),
      numv(3, (i) => { // e2
        const [dem, eol] = [[900, 300], [1000, 500], [800, 200]][i];
        const resto = dem - eol;
        const cc = Math.min(400, resto);
        const gasoil = resto - cc;
        return {
          enunciado: `La demanda es de ${dem} MW. La eólica aporta ${eol} MW, el ciclo combinado puede dar hasta 400 MW y el resto lo cubren turbinas a gasoil. ¿Cuántos MW tiene que aportar el gasoil?`,
          valor: gasoil,
          unidad: 'MW',
          explicacion: `${dem} − ${eol} = ${resto} MW sin eólica; el ciclo combinado cubre ${cc}; quedan ${gasoil} MW para el gasoil.${gasoil === 0 ? ' Con suficiente viento, el gasoil no hace falta.' : ' Cada MW más de viento reduce ese gasoil.'}`,
          ctx: `Demanda ${dem} MW; eólica ${eol} MW; ciclo combinado hasta 400 MW.`,
        };
      }, { d: 3 }),
      cad('Armá la cadena de cómo más viento baja el costo de la electricidad.', [ // e3
        'Sopla más viento y los parques generan más',
        'Entran primero, porque no pagan combustible',
        'Hace falta menos generación térmica',
        'La última central en entrar es más barata',
        'Baja el costo marginal del sistema',
      ], ['El viento encarece el gas que queda'], 'Por eso, en las horas de mucho viento o sol, el costo marginal cae.', { d: 2 }),
      op('¿Qué define el costo marginal de la electricidad en una hora?', [ // e4
        'La última central que se necesita para cubrir la demanda',
        'El promedio del costo de todas las centrales del país',
        ['La central más barata disponible', 'La más barata entra primero; el costo marginal lo marca la última.'],
        'El precio de la electricidad del año anterior',
      ], 'Es el costo del último megavatio-hora: el que hace falta para cerrar el balance en esa hora.', { d: 2 }),
      vf('Como el sol y el viento no pagan combustible, entran primero en el despacho cuando están disponibles.', true, 'Su costo variable es casi cero. Por eso desplazan a las centrales que queman combustible y bajan el costo marginal.', { // e5
        razones: ['+Porque su costo variable es casi cero', '-Porque siempre generan la misma potencia', '-Porque la ley obliga a apagar las térmicas'],
        d: 1,
      }),
      clas('¿Es un costo fijo o un costo variable de una central?', { // e6
        'Costo fijo': ['Construir el parque eólico', 'Pagar el préstamo de la obra', 'Mantener la central aunque no funcione'],
        'Costo variable': ['El gas que quema una térmica por cada MWh', 'El gasoil de una turbina de pico'],
      }, 'El despacho mira el costo variable; la decisión de construir mira también el fijo.', { d: 2 }),
      par('Uní cada concepto con su definición.', [ // e7
        ['Despacho', 'Decidir qué centrales generan en cada hora'],
        ['Orden de mérito', 'Del menor al mayor costo variable'],
        ['Costo marginal', 'Costo del último MWh necesario'],
        ['CAMMESA', 'Organiza el despacho en Argentina'],
      ], 'El vocabulario básico de cómo funciona un mercado eléctrico.', { d: 1 }),
      mult('¿Qué suele pasar en una hora de mucho viento y poca demanda? Marcá todo.', [ // e8
        '+Baja el costo marginal',
        '+Se usan menos centrales térmicas',
        '+Bajan las emisiones de esa hora',
        '-Entran primero las turbinas a gasoil',
        '-Sube el costo marginal',
      ], 'El viento abundante empuja fuera del despacho a las centrales más caras y más contaminantes.', { d: 2 }),
      rank('Ordená estas horas según el costo marginal esperado, de menor a mayor.', [ // e8b
        ['Madrugada con mucho viento y poca demanda', 'muy bajo'],
        ['Mediodía soleado de primavera', 'bajo'],
        ['Tarde de invierno con demanda media', 'medio'],
        ['Noche de ola de calor sin viento', 'muy alto'],
      ], 'Cuanto más demanda y menos renovables, más caras son las últimas centrales que entran.', { d: 2, extremos: ['Más bajo', 'Más alto'] }),
      det('Leé esta explicación y marcá lo equivocado.', [ // e9
        ['CAMMESA organiza el despacho eléctrico en Argentina.', false],
        ['El costo marginal lo marca la central más barata.', true, 'Lo marca la última central necesaria, que suele ser la más cara en funcionamiento.'],
        ['Las renovables tienen un costo variable casi nulo.', false],
        ['Las turbinas a gasoil son las primeras en entrar.', true, 'Suelen ser las últimas: su costo variable es alto.'],
      ], 'Entender el despacho ayuda a ver por qué las renovables cambian los precios.', { d: 2 }),
      comp('Completá.', 'Ordenar las centrales del menor al mayor costo variable es el orden de [mérito]; el costo del último MWh necesario es el costo [marginal]; y en Argentina el despacho lo organiza [CAMMESA].', ['llegada', 'promedio', 'ENARGAS'], 'Tres conceptos para entender cómo se decide quién genera.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Cuando sobra sol', 'Pronósticos, la curva del pato y el recorte de generación: los desafíos de un sistema con mucho sol y viento.', [
      teoria('Variable pero predecible', [
        'El sol y el viento varían, pero no al azar: se pronostican con modelos meteorológicos, y el pronóstico para las próximas horas suele ser bastante preciso. Además, combinar muchos parques en lugares distintos suaviza la variación: si una nube tapa un parque solar, otros siguen generando. El viento y el sol también se complementan: en muchos lugares, el viento sopla más de noche o en invierno.',
      ]),
      mult('¿Qué ayuda a manejar la variabilidad del sol y el viento? Marcá todo.', [ // e1
        '+Pronósticos meteorológicos de horas y días',
        '+Parques en lugares distintos',
        '+Combinar eólica y solar',
        '-Construir todos los parques en el mismo lugar',
        '-Ignorar los pronósticos',
      ], 'La diversidad geográfica y tecnológica es una forma barata de flexibilidad.', { d: 1 }),
      teoria('La curva del pato', [
        'En lugares con mucha energía solar, como California, la demanda que tienen que cubrir las demás centrales cae mucho al mediodía (porque el sol cubre gran parte) y sube de golpe al atardecer, cuando el sol se va y la gente vuelve a casa. Dibujada, esa curva parece un pato: panza baja al mediodía y cuello empinado a la tarde. Cuanta más solar, más profunda la panza y más empinado el cuello, que hay que cubrir con centrales rápidas o baterías.',
      ]),
      cad('Armá la cadena de la curva del pato.', [ // e2
        'Se instala mucha energía solar',
        'Al mediodía el sol cubre gran parte de la demanda',
        'Las demás centrales casi no hacen falta a esa hora',
        'Al atardecer el sol se va y la demanda sube',
        'Hay que sumar mucha potencia en poco tiempo',
      ], ['A la noche el sol genera más que al mediodía'], 'El desafío no es la energía total, sino la rampa del atardecer.', { d: 2 }),
      numv(3, (i) => { // e3
        const [a, b, h] = [[4000, 13000, 3], [3000, 9000, 4], [5000, 14000, 3]][i];
        return {
          enunciado: `La demanda que deben cubrir las centrales no solares pasa de ${a.toLocaleString('es-AR')} MW a las 17 a ${b.toLocaleString('es-AR')} MW a las ${17 + h}. ¿Cuántos MW por hora tienen que sumar, en promedio?`,
          valor: Math.round((b - a) / h),
          unidad: 'MW por hora',
          tol: 1,
          explicacion: `(${b.toLocaleString('es-AR')} − ${a.toLocaleString('es-AR')}) ÷ ${h} ≈ ${Math.round((b - a) / h).toLocaleString('es-AR')} MW por hora. Esa rampa exige centrales rápidas, baterías o demanda flexible.`,
          ctx: `De ${a} a ${b} MW en ${h} horas.`,
        };
      }, { d: 3 }),
      teoria('Recortar', [
        'Cuando se genera más energía renovable de la que se puede consumir o transportar, los parques tienen que reducir su producción: se llama recorte o vertimiento. Es energía limpia que se desperdicia. Ocurre por falta de demanda en esas horas, por falta de líneas de transmisión para llevarla a donde se necesita, o por restricciones técnicas de la red. Almacenar, mover demanda y construir líneas reducen el recorte.',
      ]),
      clas('¿Esta causa de recorte se debe a la demanda o a la red?', { // e4
        'Poca demanda en esa hora': ['Un domingo al mediodía con mucho sol y poco consumo', 'Una madrugada ventosa con las fábricas cerradas'],
        'Límite de la red': ['La línea que sale de la Patagonia ya está llena', 'Un transformador que no admite más potencia'],
      }, 'Cada causa tiene su solución: almacenar o mover demanda para una; construir red para la otra.', { d: 2 }),
      numv(3, (i) => { // e4b
        const [gen, rec] = [[5000, 250], [8000, 640], [3000, 90]][i];
        return {
          enunciado: `Un conjunto de parques podría generar ${gen.toLocaleString('es-AR')} MWh en un mes, pero se recortan ${rec} MWh. ¿Qué porcentaje de la energía posible se perdió?`,
          valor: Math.round((rec / gen) * 1000) / 10,
          unidad: '%',
          dec: 1,
          tol: 0.1,
          explicacion: `${rec} ÷ ${gen.toLocaleString('es-AR')} × 100 = ${(Math.round((rec / gen) * 1000) / 10).toLocaleString('es-AR')} %. Energía limpia que ya estaba disponible y se desperdició.`,
          ctx: `${rec} MWh recortados de ${gen} MWh posibles.`,
        };
      }, { d: 2 }),
      vf('Si hay recorte de energía renovable, significa que ya hay demasiadas renovables y no conviene sumar más.', false, 'El recorte suele indicar que falta flexibilidad —almacenamiento, demanda que se mueve, líneas—, no que sobren renovables. Resolver eso permite aprovechar la energía.', { // e5
        razones: ['+Porque suele indicar falta de flexibilidad, no exceso', '-Porque el recorte nunca ocurre', '-Porque las renovables no se pueden recortar'],
        d: 3,
      }),
      op('En un sistema con mucha solar, ¿cuándo es más difícil cubrir la demanda con otras centrales?', [ // e6
        'Al atardecer, cuando el sol baja y la demanda sube',
        'Al mediodía, cuando el sol está más alto',
        ['A las 3 de la mañana, cuando todos duermen', 'La demanda es baja; el desafío es la rampa del atardecer.'],
        'Los domingos a las 10',
      ], 'El cuello del pato es la hora crítica: mucha potencia que aparece en poco tiempo.', { d: 1 }),
      op('¿Qué ventaja tiene combinar un parque solar con uno eólico donde el viento sopla más de noche?', [ // e6b
        'Cubren horas distintas y suavizan la generación',
        'Duplican la generación al mediodía',
        ['Eliminan por completo la necesidad de red', 'Siguen necesitando red; lo que mejora es la estabilidad del aporte.'],
        'Funcionan con el mismo recurso natural',
      ], 'La complementariedad reduce los huecos sin generación y aprovecha mejor las líneas.', { d: 1 }),
      par('Uní cada concepto con su definición.', [ // e7
        ['Curva del pato', 'Demanda neta baja al mediodía y rampa al atardecer'],
        ['Recorte', 'Reducir la generación renovable que no se puede usar'],
        ['Rampa', 'Aumento rápido de la potencia necesaria'],
        ['Complementariedad', 'Fuentes que generan en momentos distintos'],
      ], 'Vocabulario para entender la operación de una red con mucho sol y viento.', { d: 2 }),
      det('Leé este titular y marcá lo equivocado.', [ // e8
        ['La curva del pato se vuelve más profunda con más solar.', false],
        ['El viento y el sol cambian al azar y no se pueden prever.', true, 'Se pronostican con bastante precisión para las próximas horas.'],
        ['El recorte desperdicia energía limpia.', false],
        ['Juntar todos los parques en un solo lugar reduce la variabilidad.', true, 'La reduce distribuirlos en lugares distintos.'],
      ], 'Los desafíos de las renovables son reales y tienen soluciones conocidas.', { d: 2 }),
      comp('Completá.', 'La curva con panza al mediodía y cuello al atardecer se llama curva del [pato]; reducir la generación renovable que no se puede usar es un [recorte]; y combinar sol y viento aprovecha su [complementariedad].', ['cisne', 'bono', 'rivalidad'], 'Tres conceptos para operar una red con muchas renovables.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Qué hacen las baterías', 'Potencia y energía, horas de duración, pérdidas y los distintos servicios que un sistema de almacenamiento le presta a la red.', [
      teoria('Potencia y energía, otra vez', [
        'Un sistema de baterías se describe con dos números. La potencia, en megavatios (MW), dice cuánta energía puede entregar por hora: qué tan "ancho" es el caño. La energía, en megavatios-hora (MWh), dice cuánta energía guarda: qué tan grande es el tanque. Dividiendo energía por potencia se obtiene la duración: un sistema de 100 MW y 400 MWh puede entregar su potencia máxima durante 4 horas.',
      ]),
      numv(3, (i) => { // e1
        const [mw, mwh] = [[100, 400], [50, 100], [200, 800]][i];
        return {
          enunciado: `Un sistema de baterías tiene ${mw} MW de potencia y ${mwh} MWh de energía. ¿Cuántas horas puede entregar su potencia máxima?`,
          valor: mwh / mw,
          unidad: 'horas',
          explicacion: `${mwh} MWh ÷ ${mw} MW = ${mwh / mw} horas. Lo viste en el tronco: potencia y energía son cosas distintas.`,
          ctx: `Potencia ${mw} MW; energía ${mwh} MWh.`,
        };
      }, { d: 1 }),
      op('Una batería de 100 MW y 200 MWh, ¿qué puede hacer?', [ // e2
        'Entregar 100 MW durante 2 horas',
        'Entregar 200 MW durante 1 hora',
        ['Entregar 100 MW durante 200 horas', 'Confunde potencia con energía: 200 MWh ÷ 100 MW = 2 horas.'],
        'Entregar 2 MW durante 100 horas, como máximo',
      ], 'La potencia limita cuánto entrega por hora; la energía, cuánto tiempo.', { d: 2 }),
      teoria('Nada es gratis: las pérdidas', [
        'Al cargar y descargar una batería se pierde algo de energía como calor. Las baterías de litio devuelven cerca del 85 al 90 % de lo que se les carga; las centrales de bombeo, que suben agua a un embalse para luego turbinarla, alrededor del 75 al 80 %. Aun así, guardar energía barata y limpia para usarla cuando hace falta suele valer la pena.',
      ]),
      numv(3, (i) => { // e3
        const [carga, ef] = [[100, 88], [400, 85], [250, 80]][i];
        return {
          enunciado: `Si se cargan ${carga} MWh en un sistema de almacenamiento con una eficiencia de ida y vuelta del ${ef} %, ¿cuántos MWh se recuperan?`,
          valor: (carga * ef) / 100,
          unidad: 'MWh',
          explicacion: `${carga} × ${ef} % = ${(carga * ef) / 100} MWh. El resto se pierde como calor en la carga y la descarga.`,
          ctx: `${carga} MWh cargados; eficiencia del ${ef} %.`,
        };
      }, { d: 1 }),
      teoria('Muchos servicios', [
        'Las baterías no solo "guardan el sol para la noche". Pueden comprar energía cuando es barata y venderla cuando es cara (arbitraje), cubrir los picos de demanda y evitar encender centrales caras, responder en fracciones de segundo cuando falla una central para sostener la frecuencia de la red, y aliviar líneas o transformadores saturados sin tener que ampliarlos enseguida. En Argentina, la licitación AlmaGBA de 2025 buscó justamente eso para el Área Metropolitana: se ofrecieron más de 1.300 MW y se adjudicaron unos 667 MW, por encima de los 500 MW previstos.',
      ]),
      par('Uní cada servicio con lo que hace la batería.', [ // e4
        ['Arbitraje', 'Carga barato y descarga cuando es caro'],
        ['Cubrir picos', 'Entrega potencia en las horas de máxima demanda'],
        ['Reserva rápida', 'Responde en segundos si falla una central'],
        ['Alivio de red', 'Evita saturar una línea o un transformador'],
      ], 'Una misma batería puede prestar varios servicios, y eso define si es rentable.', { d: 2 }),
      numv(3, (i) => { // e5
        const [mwh, bajo, alto, ef] = [[100, 20, 120, 0.88], [200, 30, 100, 0.85], [50, 10, 150, 0.9]][i];
        const ganancia = Math.round(mwh * ef * alto - mwh * bajo);
        return {
          enunciado: `Una batería carga ${mwh} MWh a ${bajo} dólares por MWh y, con una eficiencia del ${Math.round(ef * 100)} %, descarga lo recuperado a ${alto} dólares por MWh. ¿Cuántos dólares gana en ese ciclo?`,
          valor: ganancia,
          unidad: 'dólares',
          tol: 1,
          explicacion: `Vende ${mwh} × ${ef.toLocaleString('es-AR')} = ${(mwh * ef).toLocaleString('es-AR')} MWh × ${alto} = ${(mwh * ef * alto).toLocaleString('es-AR')}; pagó ${mwh} × ${bajo} = ${(mwh * bajo).toLocaleString('es-AR')}. Gana ${ganancia.toLocaleString('es-AR')} dólares. La diferencia de precios paga las pérdidas.`,
          ctx: `Carga ${mwh} MWh a ${bajo}; vende a ${alto}; eficiencia ${Math.round(ef * 100)} %.`,
        };
      }, { d: 4 }),
      teoria('Cada vez más baratas', [
        'Según la Agencia Internacional de Energía, el costo de las baterías de litio cayó alrededor de un 90 % en menos de quince años, y en 2023 el almacenamiento con baterías en el sector eléctrico creció más del 130 %. BloombergNEF informó que en 2024 el precio promedio de los paquetes de baterías bajó a unos 115 dólares por kWh. Esa caída explica por qué las baterías pasaron de ser una rareza a una pieza común de las redes.',
      ]),
      est('Estimá cuánto cayó el costo de las baterías de litio en menos de quince años, según la AIE.', 90, { min: 0, max: 100, paso: 5, unidad: '%' }, 'Alrededor de un 90 %. Esa caída es comparable a la de los paneles solares, y cambió la economía de las redes.', { d: 2 }),
      vf('Una batería de 4 horas puede reemplazar por completo a las centrales que se usan en una semana sin viento.', false, 'Cubre horas, no semanas. Para períodos largos hacen falta otras soluciones: embalses, centrales despachables, intercambio entre regiones o almacenamiento de larga duración.', { // e6
        razones: ['+Porque cubre horas, no semanas', '-Porque las baterías no pueden entregar energía', '-Porque en una semana sin viento no hay demanda'],
        d: 3,
      }),
      cad('Armá el funcionamiento de una central de bombeo.', [ // e6b
        'Sobra energía barata en la red',
        'Se bombea agua a un embalse más alto',
        'El agua queda guardada como energía',
        'En el pico, el agua baja por las turbinas',
        'Se genera electricidad cuando más se necesita',
      ], ['El agua sube sola por la pendiente'], 'Es la forma de almacenamiento más antigua a gran escala, y todavía una de las más usadas.', { d: 1 }),
      clas('¿Para qué horizonte de tiempo sirve mejor cada tecnología?', { // e7
        'Segundos a horas': ['Baterías de litio', 'Volantes de inercia'],
        'Horas a días': ['Centrales de bombeo', 'Embalses hidroeléctricos'],
        'Semanas a estaciones': ['Grandes embalses con reserva de agua', 'Combustibles almacenables, como el gas o el hidrógeno'],
      }, 'No hay una sola tecnología de almacenamiento: cada una cubre un horizonte distinto.', { d: 3 }),
      det('Leé esta nota y marcá lo equivocado.', [ // e8
        ['La duración de una batería es su energía dividida por su potencia.', false],
        ['Una batería devuelve el 100 % de lo que se le carga.', true, 'Las de litio devuelven cerca del 85 al 90 %.'],
        ['Las baterías pueden sostener la frecuencia en segundos.', false],
        ['Las baterías solo sirven para guardar sol para la noche.', true, 'También hacen arbitraje, cubren picos, dan reserva y alivian la red.'],
      ], 'Las baterías son mucho más versátiles que "un tanque de sol".', { d: 2 }),
      comp('Completá.', 'La capacidad de entrega de una batería se mide en [MW]; lo que guarda se mide en [MWh]; y comprar barato para vender caro es hacer [arbitraje].', ['kg', 'litros', 'reciclaje'], 'Tres conceptos para entender el almacenamiento.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Demanda que se mueve y líneas que faltan', 'Flexibilidad del consumo, tarifas por horario, autos que cargan de noche y la transmisión como cuello de botella.', [
      teoria('La demanda también puede moverse', [
        'Durante un siglo, la red se pensó así: la demanda hace lo que quiere y la generación la sigue. Pero muchos consumos pueden moverse unas horas sin que nadie lo note: calentar agua, cargar un auto eléctrico, enfriar una cámara frigorífica, bombear agua a un tanque, algunos procesos industriales. Moverlos a las horas con más sol o viento, o sacarlos de las horas pico, es flexibilidad de la demanda.',
      ]),
      clas('¿Este consumo se puede mover unas horas o no?', { // e1
        'Se puede mover': ['Cargar un auto eléctrico', 'Calentar agua en un termotanque eléctrico', 'Bombear agua a un tanque elevado'],
        'Difícil de mover': ['La luz de un quirófano', 'Un respirador en una casa', 'Los semáforos de una ciudad'],
      }, 'No todo se puede mover, pero lo que sí se puede es un recurso enorme y barato.', { d: 1 }),
      teoria('Precios que cambian por hora', [
        'Una forma de mover la demanda son las tarifas por horario: la electricidad es más cara en las horas pico y más barata cuando sobra. Otra son los programas en los que grandes usuarios reducen su consumo cuando el sistema lo pide, a cambio de un pago. Con medidores inteligentes y aparatos programables, esto puede hacerse de forma automática.',
      ]),
      numv(3, (i) => { // e2
        const [kwh, pico, valle] = [[300, 180, 90], [200, 200, 80], [400, 150, 70]][i];
        return {
          enunciado: `Un auto eléctrico carga ${kwh} kWh por mes. Si la tarifa es de ${pico} pesos por kWh en horario pico y ${valle} de madrugada, ¿cuántos pesos por mes ahorra cargando de madrugada?`,
          valor: kwh * (pico - valle),
          unidad: 'pesos',
          explicacion: `${kwh} × (${pico} − ${valle}) = ${(kwh * (pico - valle)).toLocaleString('es-AR')} pesos por mes. Tarifas de ejemplo: la señal de precio premia mover el consumo.`,
          ctx: `${kwh} kWh; ${pico} y ${valle} pesos por kWh.`,
        };
      }, { d: 1 }),
      cad('Armá la cadena de cómo la carga inteligente de autos ayuda a la red.', [ // e3
        'Muchos autos eléctricos se conectan al llegar a casa',
        'Si todos cargan a las 19, se suma demanda al pico',
        'Con carga programada, esperan a la madrugada o al mediodía',
        'Absorben energía cuando sobra',
        'La red usa mejor su capacidad y se recorta menos',
      ], ['Los autos generan electricidad al estacionar'], 'Lo que podía ser un problema se vuelve una ayuda, según cuándo se carga.', { d: 2 }),
      teoria('La transmisión, el cuello de botella', [
        'Los mejores lugares para generar no siempre están cerca de donde se consume: el viento más fuerte está en la Patagonia y el sol más intenso en el noroeste, mientras que la mayor demanda está en el centro del país. Llevar esa energía requiere líneas de alta tensión, que tardan años en construirse. En Argentina, la falta de capacidad de transmisión en algunas regiones limitó la conexión de nuevos parques renovables.',
      ]),
      op('¿Por qué la falta de líneas de transmisión frena nuevas renovables en Argentina?', [ // e4
        'Los mejores recursos están lejos de la demanda',
        'Porque las renovables no necesitan cables',
        ['Porque en el centro del país no se consume electricidad', 'Es al revés: la mayor demanda está en el centro.'],
        'Porque las líneas solo transportan electricidad de gas',
      ], 'Sin líneas, la mejor energía del país no puede llegar a donde se la necesita.', { d: 2 }),
      numv(3, (i) => { // e5
        const [cap, ocup] = [[1000, 950], [800, 760], [1500, 1350]][i];
        return {
          enunciado: `Una línea de transmisión puede llevar ${cap.toLocaleString('es-AR')} MW y ya lleva ${ocup.toLocaleString('es-AR')} MW en las horas de mucho viento. ¿Cuántos MW de parques nuevos podría sumar sin ampliarla?`,
          valor: cap - ocup,
          unidad: 'MW',
          explicacion: `${cap.toLocaleString('es-AR')} − ${ocup.toLocaleString('es-AR')} = ${cap - ocup} MW. Más allá de eso, cada parque nuevo sería recortado en las horas de mucho viento.`,
          ctx: `Capacidad ${cap} MW; ocupación ${ocup} MW.`,
        };
      }, { d: 1 }),
      par('Uní cada consumo con el mejor momento para hacerlo en una red con mucho sol.', [ // e5b
        ['Cargar un auto eléctrico', 'Mediodía soleado o madrugada'],
        ['Calentar agua en un termotanque eléctrico', 'Horas de más sol'],
        ['Bombear agua a un tanque elevado', 'Horas de poca demanda'],
        ['Enfriar una cámara frigorífica', 'Antes del pico, para no enfriar durante el pico'],
      ], 'Muchos consumos pueden adelantarse o atrasarse sin perder su servicio.', { d: 2 }),
      rank('Ordená estas soluciones según cuánto tiempo suelen tardar en implementarse, de la más rápida a la más lenta.', [ // e6
        ['Tarifa por horario para cargar autos', 'meses'],
        ['Baterías junto a un transformador saturado', 'uno o dos años'],
        ['Parque eólico nuevo', 'dos o tres años'],
        ['Línea de alta tensión de cientos de kilómetros', 'muchos años'],
      ], 'Las soluciones rápidas compran tiempo mientras se construyen las lentas.', { d: 3, extremos: ['Más rápida', 'Más lenta'] }),
      vf('Una línea de transmisión nueva beneficia solo a la región donde se generan las renovables.', false, 'Permite llevar energía barata y limpia a los centros de consumo, reduce el recorte y hace más confiable todo el sistema.', { // e7
        razones: ['+Porque beneficia a todo el sistema, incluidos los consumidores', '-Porque las líneas solo sirven para exportar', '-Porque la transmisión no afecta los precios'],
        d: 2,
      }),
      mult('¿Qué herramientas aportan flexibilidad a un sistema eléctrico? Marcá todas.', [ // e8
        '+Tarifas por horario',
        '+Carga programada de autos eléctricos',
        '+Líneas que unen regiones',
        '+Baterías',
        '-Prohibir que la demanda cambie',
      ], 'La flexibilidad viene de la demanda, del almacenamiento y de la red, no solo de las centrales.', { d: 1 }),
      det('Leé esta propuesta y marcá lo que no se sostiene.', [ // e9
        ['Programaremos la carga de los colectivos eléctricos de madrugada.', false],
        ['No hacen falta líneas: la energía patagónica llegará sola a Buenos Aires.', true, 'Sin líneas de transmisión, la energía no llega.'],
        ['Ofreceremos tarifas más bajas en horas de mucho sol.', false],
        ['Todos los consumos se pueden mover sin problema.', true, 'Algunos, como un respirador o un quirófano, no se pueden mover.'],
      ], 'La flexibilidad es poderosa, pero tiene límites que hay que respetar.', { d: 2 }),
      comp('Completá.', 'Mover consumos a las horas con más sol o viento es flexibilidad de la [demanda]; las tarifas que cambian por hora se llaman tarifas por [horario]; y en Argentina muchas renovables esperan líneas de [transmisión].', ['oferta', 'color', 'teléfono'], 'Tres claves de la flexibilidad y la red.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Planificar una red limpia y confiable', 'Combinar soluciones, medir la confiabilidad y avanzar por etapas sin apagones.', [
      teoria('La confiabilidad', [
        'Una red tiene que ser limpia y barata, pero sobre todo confiable: que haya electricidad cuando se la necesita, incluso en la ola de calor más fuerte o en la semana con menos viento. Por eso los planificadores miran los peores momentos, no los promedios. Un sistema con muchas renovables necesita suficiente capacidad firme —centrales despachables, embalses, baterías, importación o demanda que se puede reducir— para cubrir esos momentos.',
      ]),
      op('¿Por qué los planificadores miran los peores momentos y no los promedios?', [ // e1
        'Un apagón en el peor momento sale muy caro',
        'Porque los promedios siempre están mal calculados',
        ['Porque los peores momentos nunca ocurren', 'Ocurren: olas de calor, semanas sin viento, fallas.'],
        'Porque así se construyen menos centrales',
      ], 'La confiabilidad se juega en las horas más exigentes del año.', { d: 2 }),
      teoria('Una cartera de soluciones', [
        'No hay una solución única. Los estudios de agencias como la Agencia Internacional de Energía y la IRENA coinciden en que los sistemas con mucha energía renovable combinan varias herramientas: diversidad de fuentes y lugares, pronósticos, redes más fuertes e interconectadas, almacenamiento de distintas duraciones, demanda flexible y centrales que puedan cubrir los momentos críticos, que con el tiempo usen menos combustible fósil.',
      ]),
      mult('¿Qué incluye una cartera de soluciones para un sistema con mucha energía renovable? Marcá todo.', [ // e2
        '+Fuentes y lugares diversos',
        '+Redes más fuertes e interconectadas',
        '+Almacenamiento de distintas duraciones',
        '+Demanda flexible',
        '-Depender de una sola tecnología',
      ], 'La diversidad hace al sistema más robusto frente a lo imprevisto.', { d: 1 }),
      ord('Ordená una estrategia por etapas para integrar más renovables a una red.', [ // e3
        'Sumar renovables donde la red todavía tiene capacidad',
        'Mejorar los pronósticos y el despacho',
        'Agregar baterías y tarifas que muevan la demanda',
        'Construir las líneas que conectan los mejores recursos',
        'Reemplazar gradualmente la generación fósil',
      ], 'Cada etapa prepara a la red para la siguiente, sin arriesgar la confiabilidad.', { d: 3 }),
      numv(3, (i) => { // e4
        const [pico, firme] = [[2000, 1700], [1500, 1350], [3000, 2400]][i];
        return {
          enunciado: `El pico de demanda esperado es de ${pico.toLocaleString('es-AR')} MW y la capacidad firme disponible es de ${firme.toLocaleString('es-AR')} MW. ¿Cuántos MW firmes faltan para cubrir el pico?`,
          valor: pico - firme,
          unidad: 'MW',
          explicacion: `${pico.toLocaleString('es-AR')} − ${firme.toLocaleString('es-AR')} = ${pico - firme} MW. Pueden venir de baterías, demanda que se reduce en el pico, importación o centrales despachables.`,
          ctx: `Pico ${pico} MW; capacidad firme ${firme} MW.`,
        };
      }, { d: 1 }),
      clas('¿Esta fuente aporta capacidad firme para el pico o no?', { // e5
        'Aporta capacidad firme': ['Batería cargada antes del pico', 'Embalse con agua disponible', 'Demanda industrial que se compromete a reducirse'],
        'No es firme por sí sola': ['Parque solar en un pico nocturno', 'Parque eólico en una tarde sin viento'],
      }, 'Lo firme es lo que está disponible cuando se lo necesita, pase lo que pase con el clima.', { d: 2 }),
      vf('Un sistema con mucha energía renovable no puede ser confiable.', false, 'Con una cartera de soluciones —redes, almacenamiento, demanda flexible y capacidad firme— puede serlo. La confiabilidad depende del diseño, no solo de la fuente.', { // e6
        razones: ['+Porque la confiabilidad depende del diseño del sistema', '-Porque las renovables no generan electricidad', '-Porque los sistemas fósiles nunca fallan'],
        d: 2,
      }),
      cad('Armá la cadena de por qué la diversidad hace más robusta a la red.', [ // e7
        'Hay sol, viento, agua y otras fuentes en distintos lugares',
        'Es poco probable que todas fallen a la vez',
        'Cuando una baja, otras compensan',
        'Se necesita menos respaldo caro',
        'La red es más confiable y más barata',
      ], ['Todas las fuentes fallan siempre al mismo tiempo'], 'No poner todos los huevos en la misma canasta, aplicado a la energía.', { d: 2 }),
      par('Uní cada problema con una solución.', [ // e8
        ['Rampa del atardecer', 'Baterías y centrales rápidas'],
        ['Recorte por líneas llenas', 'Nuevas líneas de transmisión'],
        ['Pico de demanda en ola de calor', 'Demanda que se reduce en el pico'],
        ['Semana sin viento', 'Embalses y capacidad firme'],
      ], 'Cada desafío tiene herramientas específicas.', { d: 2 }),
      rank('Ordená estos recursos de menor a mayor costo típico para cubrir unas pocas horas de pico al año.', [ // e9
        ['Pedir a grandes usuarios que reduzcan el consumo', 'muy bajo'],
        ['Descargar baterías que ya existen', 'bajo'],
        ['Encender turbinas a gasoil', 'alto'],
        ['Construir una central nueva solo para esas horas', 'muy alto'],
      ], 'Para pocas horas al año, lo más barato suele ser gestionar la demanda y usar lo que ya existe.', { d: 3, extremos: ['Más barato', 'Más caro'] }),
      det('Leé este plan energético provincial y marcá lo que conviene corregir.', [ // e10
        ['Evaluaremos la red en la peor semana del año, no solo en promedio.', false],
        ['Sumaremos parques aunque no haya líneas para llevar su energía.', true, 'Se recortaría su generación; hay que planificar la red a la par.'],
        ['Combinaremos baterías, demanda flexible y centrales de respaldo.', false],
        ['Apagaremos todas las térmicas mañana, sin respaldo.', true, 'La transición debe ser gradual y garantizar la confiabilidad.'],
      ], 'Planificar bien es avanzar rápido sin poner en riesgo el suministro.', { d: 2 }),
      comp('Completá.', 'Que haya electricidad incluso en el peor momento es la [confiabilidad] de la red; lo que está disponible pase lo que pase con el clima es capacidad [firme]; y combinar muchas herramientas es armar una [cartera] de soluciones.', ['estética', 'variable', 'receta'], 'Tres ideas para planificar una red limpia y confiable.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: una red para las renovables', 'Despacho, curva del pato, baterías, flexibilidad, transmisión y confiabilidad, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: la noche sin viento', 'Una provincia con mucho sol y viento quiere dejar de depender de sus turbinas a gasoil en las noches de verano. Con los datos, diseñá la solución.', [
      teoria('Los datos', [
        'En una noche típica de verano sin viento, entre las 19 y las 23 la provincia necesita 300 MW más de lo que pueden dar sus centrales firmes, y hoy los cubre con turbinas a gasoil. Durante el día, con mucho sol, se recortan en promedio 900 MWh de energía solar porque no hay demanda ni líneas para llevarla. La distribuidora propone baterías; una cámara industrial ofrece reducir 60 MW en esas horas a cambio de un pago.',
      ]),
      num('Si las industrias reducen 60 MW, ¿cuántos MW quedan por cubrir entre las 19 y las 23?', 240, 'MW', '300 − 60 = 240 MW. La flexibilidad de la demanda achica el problema antes de invertir.', { ctx: 'Faltan 300 MW; la industria reduce 60 MW.', d: 1 }),
      num('¿Cuántos MWh de baterías hacen falta para entregar 240 MW durante 4 horas?', 960, 'MWh', '240 MW × 4 horas = 960 MWh. Un sistema de 240 MW y 960 MWh.', { ctx: '240 MW durante 4 horas, de 19 a 23.', d: 2 }),
      num('Si esas baterías se cargan con la solar que hoy se recorta, con una eficiencia del 88 %, ¿cuántos MWh recortados harían falta para cargarlas? Redondeá al entero.', 1091, 'MWh', '960 ÷ 0,88 ≈ 1.091 MWh. Hoy se recortan unos 900 MWh: cubriría la mayor parte, y el resto se cargaría de la red en horas baratas.', { ctx: '960 MWh a entregar; eficiencia del 88 %.', d: 3 }),
      mult('¿Qué beneficios tendría la solución? Marcá todos.', [ // e4
        '+Menos gasoil quemado en las noches de verano',
        '+Aprovechar energía solar que hoy se desperdicia',
        '+Menor costo marginal en las horas pico',
        '-Más recorte de energía solar',
        '-Más emisiones en las horas pico',
      ], 'Baterías y demanda flexible atacan dos problemas a la vez: el recorte del día y el gasoil de la noche.', { d: 2 }),
      op('¿Por qué conviene sumar primero la reducción industrial antes de dimensionar las baterías?', [ // e5
        'Achica el problema y las baterías resultan más chicas',
        'Porque las baterías no sirven para las noches',
        ['Porque las industrias pagan la electricidad más cara', 'No es el motivo: se trata de reducir lo que hay que cubrir.'],
        'Porque la ley lo exige siempre',
      ], 'La flexibilidad más barata va primero; la inversión se dimensiona para lo que queda.', { d: 2 }),
      vf('Con las baterías, la provincia ya no necesita ninguna capacidad de respaldo para una semana entera sin sol ni viento.', false, 'Las baterías cubren horas. Para varios días seguidos sin sol ni viento hacen falta otras fuentes firmes, importación o reservas de más larga duración.', { // e6
        razones: ['+Porque las baterías cubren horas, no semanas', '-Porque en una semana sin viento no hay demanda', '-Porque las baterías duran para siempre'],
        d: 3,
      }),
      det('La provincia redacta su plan. Marcá lo que conviene corregir.', [ // e7
        ['Contrataremos 60 MW de reducción industrial para las noches de verano.', false],
        ['Instalaremos 240 MW de baterías, con 240 MWh de energía.', true, 'Para 4 horas hacen falta 960 MWh: confunde potencia con energía.'],
        ['Cargaremos las baterías con la solar que hoy se recorta.', false],
        ['Desmantelaremos todas las turbinas el primer año.', true, 'Conviene mantener respaldo para los días más críticos mientras se completa la transición.'],
      ], 'Un buen plan cuida los números, la confiabilidad y el ritmo de la transición.', { d: 3 }),
    ]),
  ],
});
