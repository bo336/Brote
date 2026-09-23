import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// ENERGÍA 4 — Energías renovables.
// Sol, viento, agua, biomasa y calor de la Tierra: cómo funcionan, cuánto
// generan (factor de capacidad), cómo se maneja su variabilidad, cuánto
// cuestan y qué impactos tienen. Retoma la red y la demanda (energia-3) y la
// eficiencia (energia-1).

export default unidad({
  slug: 'energia-4',
  rama: 'energia',
  orden: 4,
  nivel: 2,
  requiereTronco: 2,
  titulo: 'Energías renovables',
  bajada: 'El sol de la Puna y el viento patagónico están entre los mejores del mundo. Cómo se aprovechan, qué pasa cuando no hay sol ni viento y cuánto cuestan.',
  objetivos: [
    'Explicar cómo funcionan la energía solar, eólica, hidráulica, biomasa y geotérmica',
    'Calcular la energía que genera una instalación usando el factor de capacidad',
    'Describir estrategias para manejar la variabilidad de sol y viento',
    'Interpretar la caída de costos de las renovables',
    'Evaluar impactos y beneficios locales de los proyectos renovables',
  ],
  repasa: ['energia-3', 'energia-1', 'tronco-2'],
  fuentes: ['irena', 'cammesa', 'ley-27424-generacion', 'iea-energia', 'owid-energia'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('La energía del sol', 'Paneles fotovoltaicos, termotanques solares y por qué el noroeste argentino es un lugar privilegiado.', [
      teoria('Dos formas de usar el sol', [
        'El sol se puede usar para producir electricidad, con paneles fotovoltaicos, o para calentar agua o aire directamente, con colectores solares térmicos como los termotanques solares. Los dos aprovechan una fuente gratuita e inagotable, pero de formas distintas.',
        'Un termotanque solar puede cubrir buena parte del agua caliente de una casa durante gran parte del año, y ahorrar mucho gas o electricidad.',
      ]),
      clas('¿Es energía solar fotovoltaica o térmica?', { // e1
        'Fotovoltaica': ['Paneles en el techo que alimentan la heladera', 'Parque solar en la Puna conectado a la red', 'Cargador solar de celular'],
        'Térmica': ['Termotanque solar para la ducha', 'Colector que calienta el agua de una pileta', 'Cocina solar parabólica'],
      }, 'La fotovoltaica produce electricidad; la térmica, calor. Las dos usan el mismo sol.', { d: 1 }),
      teoria('El sol de Argentina', [
        'La cantidad de energía solar que llega al suelo se llama irradiación. En la Puna y el noroeste argentino está entre las más altas del mundo, por la altura, el aire seco y los cielos despejados. Por eso allí se construyeron grandes parques solares, como el de Cauchari, en Jujuy, a más de 4.000 metros de altura.',
        'Pero el sol sirve en casi todo el país: incluso en la región pampeana o en ciudades como Córdoba o Mendoza, un panel bien orientado genera mucha energía a lo largo del año.',
      ]),
      op('¿Por qué la Puna es uno de los mejores lugares del mundo para la energía solar?', [ // e2
        'Por la altura, el aire seco y los cielos despejados',
        'Porque allí el sol sale dos veces por día',
        ['Porque hace mucho calor todo el año', 'En la Puna hace frío: lo que importa es la radiación, no la temperatura.'],
        'Porque hay mucha agua para enfriar los paneles',
      ], 'La radiación solar importa más que el calor. De hecho, los paneles rinden mejor con frío.', { d: 2 }),
      vf('Los paneles solares rinden mejor cuanto más calor hace.', false, 'Los paneles fotovoltaicos pierden algo de eficiencia con el calor. Lo que los hace rendir es la cantidad de luz, no la temperatura.', { // e3
        razones: ['+Porque lo que importa es la luz; el calor los hace rendir un poco menos', '-Porque los paneles funcionan con el calor del aire', '-Porque de noche rinden más'],
        d: 3,
      }),
      teoria('Orientación e inclinación', [
        'En el hemisferio sur, los paneles rinden más si miran hacia el norte, con una inclinación parecida a la latitud del lugar. Las sombras de árboles, edificios o tanques de agua pueden bajar mucho la producción, incluso si tapan una parte chica del panel.',
      ]),
      mult('¿Qué hace que un panel solar en una casa genere más? Marcá todo.', [ // e4
        '+Que mire hacia el norte, en el hemisferio sur',
        '+Que no tenga sombras durante el día',
        '+Que tenga una inclinación adecuada',
        '+Que esté limpio de polvo',
        '-Que mire hacia el sur',
      ], 'Norte, sin sombras, bien inclinado y limpio.', { d: 2 }),
      ejemplo('Cuánto genera un techo', 'Un sistema de 3 kW está en un lugar donde el sol equivale, en promedio, a 4,5 horas por día de luz plena.', [
        'Por día: 3 kW × 4,5 h = 13,5 kWh.',
        'Por año: 13,5 × 365 ≈ 4.930 kWh.',
        'Con pérdidas del sistema de un 15 %: 4.930 × 0,85 ≈ 4.190 kWh.',
      ], 'Más de lo que usa en electricidad una casa típica con gas en un año. Las "horas de sol pleno" resumen cuánta luz llega en promedio.'),
      numv(3, (i) => { // e5
        const kw = [3, 5, 2][i];
        const h = [4.5, 5, 4][i];
        return {
          enunciado: `Un sistema solar de ${kw} kW está en un lugar con ${h.toLocaleString('es-AR')} horas de sol pleno por día en promedio. Sin contar pérdidas, ¿cuántos kWh genera por año? Redondeá al entero.`,
          valor: Math.round(kw * h * 365),
          unidad: 'kWh',
          tol: 5,
          explicacion: `${kw} × ${h.toLocaleString('es-AR')} × 365 ≈ ${Math.round(kw * h * 365).toLocaleString('es-AR')} kWh por año, antes de descontar pérdidas del sistema.`,
        };
      }, { d: 2 }),
      cad('Armá la cadena de cómo un termotanque solar ahorra gas.', [ // e6
        'El sol calienta el agua en el colector',
        'El agua caliente se guarda en un tanque aislado',
        'La ducha usa esa agua ya caliente',
        'El calefón o termotanque a gas se enciende mucho menos',
        'Se quema menos gas y se emite menos CO₂',
      ], ['El termotanque solar genera gas con el sol'], 'Una tecnología simple y probada que ataca uno de los grandes consumos de una casa: el agua caliente.', { d: 2 }),
      vf('Un termotanque solar produce electricidad para la casa.', false, 'Produce calor: calienta agua directamente con el sol. La electricidad la producen los paneles fotovoltaicos.', {
        razones: ['+Porque calienta agua, no genera electricidad', '-Porque tiene paneles fotovoltaicos adentro', '-Porque funciona a gas'],
        d: 1,
      }),
      numv(3, (i) => {
        const m3 = [20, 25, 15][i];
        const pct = [60, 50, 70][i];
        return {
          enunciado: `Una casa usa ${m3} m³ de gas por mes para calentar agua. Si un termotanque solar cubre el ${pct} % del agua caliente, ¿cuántos m³ de gas ahorra por año?`,
          valor: m3 * (pct / 100) * 12,
          unidad: 'm³',
          dec: 1,
          explicacion: `${m3} × ${(pct / 100).toLocaleString('es-AR')} × 12 = ${(m3 * (pct / 100) * 12).toLocaleString('es-AR')} m³ por año. Con 1,9 kg de CO₂ por m³, más de ${Math.floor(m3 * (pct / 100) * 12 * 1.9)} kg de CO₂ evitados.`,
        };
      }, { d: 2 }),
      det('Leé esta publicidad y marcá lo equivocado.', [ // e7
        ['Nuestros paneles rinden más orientados al norte.', false],
        ['Funcionan igual de bien a la sombra de un árbol.', true, 'Las sombras bajan mucho la producción.'],
        ['El termotanque solar ahorra gas en el agua caliente.', false],
        ['Los paneles generan más en los días de más calor, aunque esté nublado.', true, 'Lo que importa es la luz; con nubes generan menos.'],
      ], 'Conocer cómo funciona el sol evita promesas engañosas.', { d: 2 }),
      comp('Completá.', 'La energía solar que llega al suelo se llama [irradiación]; en el hemisferio sur los paneles conviene orientarlos al [norte]; y un termotanque solar ahorra [gas].', ['evaporación', 'sur', 'agua'], 'Tres ideas para aprovechar bien la energía del sol.', { d: 2 }),
      rank('Ordená estas ubicaciones por la energía solar que suelen recibir por año, de más a menos.', [ // e9
        ['Puna jujeña', 'de las más altas del mundo'],
        ['Mendoza', 'muy alta'],
        ['Buenos Aires', 'buena'],
        ['Ushuaia', 'más baja'],
      ], 'El noroeste y Cuyo son privilegiados, pero el sol sirve en casi todo el país.', { d: 2, extremos: ['Más', 'Menos'] }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('La energía del viento', 'Aerogeneradores, el viento patagónico y el factor de capacidad.', [
      teoria('Cómo funciona un aerogenerador', [
        'Un aerogenerador moderno tiene una torre de más de 100 metros y palas enormes. El viento hace girar las palas, que mueven un generador en la góndola, arriba de la torre. La potencia que se puede sacar del viento crece muchísimo con la velocidad: si el viento sopla el doble de rápido, la energía disponible es unas ocho veces mayor.',
        'Por eso importa tanto dónde se instalan: unos pocos kilómetros por hora de diferencia en el viento promedio cambian mucho la producción.',
      ]),
      numv(3, (i) => { // e1
        const f = [2, 1.5, 3][i];
        return {
          enunciado: `La energía disponible en el viento crece con el cubo de la velocidad. Si el viento sopla ${f.toLocaleString('es-AR')} veces más rápido, ¿cuántas veces más energía hay disponible? Redondeá a un decimal.`,
          valor: Math.round(f ** 3 * 10) / 10,
          unidad: 'veces',
          dec: 1,
          tol: 0.1,
          explicacion: `${f.toLocaleString('es-AR')}³ = ${(Math.round(f ** 3 * 10) / 10).toLocaleString('es-AR')}. Por eso los mejores lugares de viento valen tanto.`,
        };
      }, { d: 3 }),
      teoria('El viento patagónico', [
        'La Patagonia tiene algunos de los vientos más fuertes y constantes del mundo. Allí, algunos parques eólicos producen en un año cerca de la mitad de lo que producirían si funcionaran a plena potencia todo el tiempo, un rendimiento muy alto a nivel mundial. También hay parques en la provincia de Buenos Aires y en otras regiones.',
      ]),
      teoria('El factor de capacidad', [
        'Ningún generador funciona siempre a su potencia máxima. El factor de capacidad es la energía que produce en un año dividida por la que produciría a potencia máxima las 8.760 horas del año. Un parque solar puede tener un factor de 20 a 30 %; un buen parque eólico patagónico, cerca del 45 al 50 %; una central nuclear, más del 80 %.',
      ], { destacado: { valor: 'Factor de capacidad', texto: '= energía real del año ÷ (potencia máxima × 8.760 horas).' } }),
      ejemplo('Cuánto genera un parque eólico', 'Un parque de 100 MW en la Patagonia tiene un factor de capacidad del 45 %.', [
        'A potencia máxima todo el año: 100 MW × 8.760 h = 876.000 MWh.',
        'Con factor 45 %: 876.000 × 0,45 = 394.200 MWh.',
        'Si una casa usa 3 MWh por año: 394.200 ÷ 3 ≈ 131.400 casas.',
      ], 'Un solo parque puede abastecer el consumo eléctrico de más de cien mil hogares.'),
      numv(3, (i) => { // e2
        const mw = [100, 50, 200][i];
        const fc = [45, 40, 50][i];
        return {
          enunciado: `Un parque eólico de ${mw} MW tiene un factor de capacidad del ${fc} %. ¿Cuántos MWh genera por año? (8.760 horas)`,
          valor: mw * 8760 * (fc / 100),
          unidad: 'MWh',
          explicacion: `${mw} × 8.760 × ${(fc / 100).toLocaleString('es-AR')} = ${(mw * 8760 * (fc / 100)).toLocaleString('es-AR')} MWh por año: el consumo de miles de hogares.`,
        };
      }, { d: 3 }),
      rank('Ordená estas centrales por su factor de capacidad típico, de mayor a menor.', [ // e3
        ['Central nuclear', 'más del 80 %'],
        ['Parque eólico patagónico', '≈ 45-50 %'],
        ['Parque solar en la Puna', '≈ 25-30 %'],
        ['Paneles en un techo de la llanura', '≈ 15-20 %'],
      ], 'El factor de capacidad no dice si una fuente es buena o mala: dice cuántas horas equivalentes genera.', { d: 3 }),
      vf('Un parque eólico de 100 MW genera 100 MW todo el tiempo.', false, 'Genera según el viento. En un año, produce una fracción de lo que produciría a potencia máxima: esa fracción es el factor de capacidad.', { // e4
        razones: ['+Porque depende del viento: el factor de capacidad resume cuánto genera', '-Porque los parques eólicos nunca generan', '-Porque 100 MW es la energía de todo el año'],
        d: 2,
      }),
      par('Uní cada concepto con su significado.', [ // e5
        ['Potencia instalada', 'Lo máximo que puede generar en un momento'],
        ['Factor de capacidad', 'Fracción de la energía máxima que genera en un año'],
        ['Energía anual', 'Lo que efectivamente genera en un año'],
        ['Horas de sol pleno', 'Equivalente diario de luz a máxima intensidad'],
      ], 'Potencia y energía otra vez, como en el tronco: la potencia es la capacidad; la energía, lo que realmente se genera.', { d: 2 }),
      mult('¿Qué hace que un lugar sea bueno para un parque eólico? Marcá todo.', [ // e6
        '+Vientos fuertes y constantes',
        '+Pocas turbulencias',
        '+Acceso a una línea eléctrica cercana',
        '+Evitar rutas migratorias importantes de aves',
        '-Muchos árboles altos alrededor',
      ], 'Buen viento, conexión a la red y cuidado de la fauna.', { d: 2 }),
      op('¿Qué significa que un parque eólico tenga un factor de capacidad del 50 %?', [
        'Que en el año genera la mitad de su máximo posible',
        'Que la mitad de los aerogeneradores está rota',
        ['Que funciona solo la mitad de los días del año', 'Funciona casi todos los días, pero a distintas potencias según el viento.'],
        'Que genera el 50 % de la electricidad del país',
      ], 'El factor de capacidad resume la variabilidad del viento en un solo número anual.', { d: 2 }),
      clas('¿Es un dato de potencia o de energía?', {
        'Potencia (kW, MW)': ['Parque eólico de 100 MW', 'Paneles de 3 kW en un techo'],
        'Energía (kWh, MWh)': ['394.200 MWh generados en un año', '4.190 kWh generados por los paneles'],
      }, 'Como en el tronco: la potencia es la capacidad en un momento; la energía, lo que se genera en un tiempo.', { d: 2 }),
      det('Leé este comentario y marcá lo equivocado.', [ // e7
        ['La Patagonia tiene vientos de los mejores del mundo.', false],
        ['Si el viento sopla el doble de rápido, el parque genera el doble.', true, 'La energía disponible crece con el cubo: unas ocho veces más.'],
        ['El factor de capacidad resume cuánto genera en el año.', false],
        ['Un parque de 100 MW genera 876.000 MWh por año siempre.', true, 'Eso sería a potencia máxima todo el año; con el factor real, bastante menos.'],
      ], 'Velocidad al cubo y factor de capacidad: las dos claves del viento.', { d: 3 }),
      comp('Completá.', 'La energía disponible en el viento crece con el [cubo] de su velocidad; la fracción de la energía máxima que genera una central en un año es su factor de [capacidad].', ['doble', 'emisión'], 'Las dos ideas clave de la energía eólica.', { d: 2 }),
      est('Estimá cuántas horas tiene un año, para calcular la energía máxima de una central.', 8760, { min: 100, max: 50000, unidad: 'horas', escala: 'log' }, '365 × 24 = 8.760 horas. Es la base para calcular el factor de capacidad.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Agua, biomasa y calor de la Tierra', 'Pequeños aprovechamientos hidráulicos, biogás, biomasa y geotermia: las otras renovables.', [
      teoria('Hidráulica chica y grande', [
        'Las grandes represas generan mucha electricidad sin emitir CO₂ al funcionar, pero tienen impactos importantes: inundan valles, cortan ríos y afectan a peces migradores, como viste en la rama de Agua. Por eso la ley argentina de promoción de renovables considera renovables promovidas solo a los pequeños aprovechamientos hidráulicos, hasta cierta potencia.',
        'Los pequeños aprovechamientos, en ríos y canales de riego, tienen menos impacto y sirven a pueblos y regiones.',
      ]),
      vf('Las grandes represas no tienen ningún impacto ambiental porque no emiten CO₂ al generar.', false, 'No emiten al generar, pero inundan valles, cortan ríos y afectan la fauna. Toda fuente tiene impactos; la pregunta es cuáles y cuánto.', { // e1
        razones: ['+Porque inundan valles y cortan ríos, aunque no emitan al generar', '-Porque las represas emiten más CO₂ que el carbón', '-Porque las represas no usan agua'],
        d: 2,
      }),
      teoria('Biomasa y biogás', [
        'La biomasa es materia orgánica que se usa como energía: leña, restos de aserraderos, cáscaras de maní o de arroz, bagazo de caña. Se quema para generar calor o electricidad. Es renovable si lo que se usa vuelve a crecer y si no se desmontan bosques para obtenerla.',
        'El biogás se produce cuando microbios descomponen residuos orgánicos sin oxígeno —estiércol, restos de alimentos, efluentes de industrias—, en equipos llamados biodigestores. Tiene metano, que se quema para generar energía. Así se evita que ese metano llegue a la atmósfera y se reemplaza gas fósil.',
      ]),
      cad('Armá la cadena de un biodigestor en un tambo.', [ // e2
        'Se junta el estiércol de las vacas',
        'Se carga en un biodigestor sin oxígeno',
        'Los microbios producen biogás con metano',
        'El biogás se quema para generar electricidad o calor',
        'Lo que queda se usa como fertilizante',
      ], ['El biodigestor convierte el estiércol en nafta'], 'Un residuo que era un problema se convierte en energía y abono, y se evita metano.', { d: 2 }),
      clas('¿Es biomasa o biogás?', { // e3
        'Biomasa': ['Cáscaras de maní quemadas en una caldera', 'Restos de un aserradero', 'Bagazo de caña de azúcar'],
        'Biogás': ['Gas de un biodigestor con estiércol', 'Gas captado en un relleno sanitario', 'Gas de efluentes de una industria láctea'],
      }, 'La biomasa se quema directamente; el biogás se produce primero con microbios.', { d: 2 }),
      teoria('El calor de la Tierra', [
        'La geotermia aprovecha el calor del interior de la Tierra. En zonas volcánicas, como Copahue en Neuquén, hay agua y vapor a alta temperatura que podrían mover turbinas. Y en cualquier lugar, a pocos metros de profundidad, el suelo tiene una temperatura bastante estable, que las bombas de calor geotérmicas usan para calefaccionar y refrescar.',
      ]),
      par('Uní cada fuente con un ejemplo argentino.', [ // e4
        ['Geotermia', 'Copahue, en Neuquén'],
        ['Biogás', 'Biodigestores en tambos'],
        ['Biomasa', 'Cáscaras de maní en Córdoba'],
        ['Pequeño aprovechamiento hidráulico', 'Minicentral en un canal de riego'],
      ], 'Las "otras renovables" también tienen lugar en el país.', { d: 3 }),
      op('¿En qué caso la biomasa NO sería sostenible?', [ // e5
        'Si se desmonta bosque nativo para quemar la leña',
        'Si se usan restos de un aserradero',
        ['Si se usan cáscaras que sobran de una industria', 'Aprovechar un residuo que ya existe suele ser sostenible.'],
        'Si se replanta lo que se cosecha',
      ], 'Quemar bosque nativo libera carbono guardado por siglos y destruye biodiversidad.', { d: 2 }),
      numv(3, (i) => { // e6
        const vacas = [200, 500, 100][i];
        const m3 = [1.5, 1.2, 1.8][i];
        return {
          enunciado: `En un tambo con ${vacas} vacas, el estiércol de cada vaca produce unos ${m3.toLocaleString('es-AR')} m³ de biogás por día. ¿Cuántos m³ de biogás por día produce el tambo?`,
          valor: Math.round(vacas * m3 * 10) / 10,
          unidad: 'm³',
          dec: 1,
          explicacion: `${vacas} × ${m3.toLocaleString('es-AR')} = ${(vacas * m3).toLocaleString('es-AR')} m³ por día de un combustible renovable que antes era un problema.`,
        };
      }, { d: 2 }),
      mult('¿Qué beneficios tiene el biogás de residuos? Marcá todos.', [ // e7
        '+Evita que el metano llegue a la atmósfera',
        '+Reemplaza gas fósil',
        '+Deja un fertilizante',
        '+Reduce olores y contaminación de los residuos',
        '-Aumenta el metano en el aire',
      ], 'Energía, abono y menos contaminación en una sola tecnología.', { d: 2 }),
      vf('Captar el biogás de un relleno sanitario y usarlo para generar electricidad evita que parte del metano llegue a la atmósfera.', true, 'El metano se quema y se convierte en CO₂, que calienta mucho menos, y además se aprovecha su energía.', {
        razones: ['+Porque el metano se quema y se aprovecha en lugar de escaparse', '-Porque los rellenos no producen metano', '-Porque quemar metano produce más metano'],
        d: 2,
      }),
      op('¿Por qué la ley argentina de promoción de renovables incluye solo los pequeños aprovechamientos hidráulicos?', [
        'Porque las grandes represas tienen impactos mayores',
        'Porque las grandes represas no generan electricidad',
        ['Porque el agua de los ríos grandes no es renovable', 'El agua es renovable; lo que pesa son los impactos de las obras grandes.'],
        'Porque en Argentina no hay ríos grandes',
      ], 'La ley busca promover fuentes con menos impacto; las grandes represas ya tienen su propio esquema.', { d: 3 }),
      det('Leé este comentario y marcá lo equivocado.', [ // e8
        ['El biogás se produce con microbios sin oxígeno.', false],
        ['Toda la biomasa es sostenible, venga de donde venga.', true, 'No si se desmontan bosques nativos para obtenerla.'],
        ['En Copahue hay recursos geotérmicos.', false],
        ['La geotermia solo existe en otros países.', true, 'Argentina tiene recursos geotérmicos, como en Neuquén.'],
      ], 'Las renovables también tienen condiciones para ser sostenibles.', { d: 2 }),
      comp('Completá.', 'La materia orgánica que se usa como energía es [biomasa]; el gas que se obtiene de residuos en un biodigestor es [biogás]; y el calor de la Tierra se aprovecha con la [geotermia].', ['petróleo', 'propano', 'hidráulica'], 'Tres renovables menos conocidas, en una línea.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Cuando no hay sol ni viento', 'Variabilidad, complementariedad, almacenamiento y redes: cómo se sostiene un sistema con muchas renovables.', [
      teoria('Variables, pero predecibles', [
        'El sol y el viento varían: el sol no genera de noche y baja con nubes; el viento cambia de un día a otro. Pero son bastante predecibles con pronósticos, y se complementan: en muchos lugares el viento sopla más de noche o en invierno, cuando el sol rinde menos.',
        'Un sistema eléctrico con muchas renovables combina varias herramientas: diversidad de fuentes y lugares, redes que las conecten, almacenamiento, centrales flexibles de respaldo y gestión de la demanda.',
      ]),
      mult('¿Qué herramientas ayudan a integrar mucha energía solar y eólica a la red? Marcá todas.', [ // e1
        '+Combinar fuentes y lugares distintos',
        '+Redes que conecten regiones',
        '+Almacenamiento en baterías o bombeo',
        '+Mover consumos a las horas de más generación',
        '-Apagar la red cuando no hay sol',
      ], 'Diversidad, redes, almacenamiento y demanda flexible: las cuatro patas del sistema.', { d: 2 }),
      teoria('Almacenar energía', [
        'Las baterías guardan electricidad para usarla horas después: se cargan al mediodía con solar y se descargan a la noche. Las centrales hidroeléctricas de bombeo hacen algo parecido a gran escala: cuando sobra energía, bombean agua a un embalse alto; cuando falta, la dejan caer y generan. En Córdoba, el complejo Río Grande funciona así desde hace décadas.',
      ]),
      cad('Armá el ciclo de una central de bombeo.', [ // e2
        'Sobra electricidad en la red, por ejemplo de noche',
        'Se usa para bombear agua a un embalse alto',
        'El agua queda guardada arriba',
        'Cuando falta electricidad, el agua baja por las turbinas',
        'Se genera electricidad en el momento de más demanda',
      ], ['El agua sube sola al embalse de noche'], 'Una "batería de agua": guarda energía como altura.', { d: 2 }),
      vf('Una central de bombeo produce más energía de la que usa para bombear.', false, 'Pierde una parte en el proceso: devuelve alrededor del 70 a 80 % de lo que usó. Su valor está en mover energía de cuando sobra a cuando falta.', { // e3
        razones: ['+Porque pierde una parte: su valor es mover energía en el tiempo', '-Porque el agua genera energía de la nada', '-Porque el bombeo no usa electricidad'],
        d: 3,
      }),
      numv(3, (i) => { // e4
        const e = [100, 250, 80][i];
        const ef = [75, 80, 70][i];
        return {
          enunciado: `Una central de bombeo usa ${e} MWh para subir agua y devuelve el ${ef} % al generar. ¿Cuántos MWh devuelve?`,
          valor: (e * ef) / 100,
          unidad: 'MWh',
          explicacion: `${e} × ${ef} ÷ 100 = ${(e * ef) / 100} MWh. Se pierden ${e - (e * ef) / 100}, pero se gana poder usar la energía cuando más se necesita.`,
        };
      }, { d: 2 }),
      clas('¿Esta herramienta es almacenamiento, respaldo o gestión de la demanda?', { // e5
        'Almacenamiento': ['Baterías junto a un parque solar', 'Central de bombeo'],
        'Respaldo': ['Turbina de gas que se enciende rápido', 'Represa que regula cuánta agua turbina'],
        'Gestión de la demanda': ['Cargar autos eléctricos al mediodía', 'Tarifas más baratas cuando sobra viento'],
      }, 'Tres formas distintas de equilibrar un sistema con mucho sol y viento.', { d: 3 }),
      teoria('Redes que conectan', [
        'Cuando hay viento en la Patagonia pero no en Buenos Aires, o sol en el norte pero nubes en el centro, una red bien interconectada permite llevar la energía de donde sobra a donde falta. Por eso ampliar las líneas de transmisión es clave para sumar renovables: en Argentina, la falta de capacidad de transmisión llegó a limitar la construcción de nuevos parques.',
      ]),
      op('¿Por qué la capacidad de las líneas de transmisión puede frenar nuevos parques eólicos?', [ // e6
        'Porque sin líneas no se puede llevar su energía a las ciudades',
        'Porque las líneas generan viento en contra',
        ['Porque los parques eólicos no se conectan a la red', 'Sí se conectan; el problema es que las líneas existentes pueden estar al límite.'],
        'Porque las líneas solo transportan gas',
      ], 'Generar donde hay viento sirve si se puede transportar la energía hasta donde se consume.', { d: 2 }),
      par('Uní cada problema con su solución.', [ // e7
        ['No hay sol a la noche', 'Baterías cargadas al mediodía'],
        ['Una región sin viento hoy', 'Energía de otra región por la red'],
        ['Pico de demanda de pocas horas', 'Central de respaldo que se enciende rápido'],
        ['Sobra energía al mediodía', 'Mover consumos flexibles a esa hora'],
      ], 'Cada desafío de la variabilidad tiene una o varias respuestas.', { d: 2 }),
      est('Estimá qué porcentaje de la energía usada para bombear devuelve una central de bombeo al generar.', 75, { min: 0, max: 100, paso: 5, unidad: '%' }, 'Alrededor del 70 al 80 %. Se pierde una parte, pero se gana poder usar la energía cuando más falta.', { d: 3 }),
      vf('En muchos lugares, el viento y el sol se complementan: el viento suele soplar más de noche o en invierno, cuando el sol rinde menos.', true, 'Combinar fuentes que generan en momentos distintos hace más estable el sistema.', {
        razones: ['+Porque generan en momentos distintos y se compensan', '-Porque el viento solo sopla al mediodía', '-Porque sol y viento generan siempre a la vez'],
        d: 2,
      }),
      det('Leé esta opinión y marcá lo equivocado.', [ // e8
        ['El sol y el viento varían, pero se pueden pronosticar.', false],
        ['Como el sol no sale de noche, las renovables nunca podrán aportar mucho.', true, 'Con almacenamiento, redes, diversidad y demanda flexible, pueden aportar una parte muy grande.'],
        ['Las centrales de bombeo guardan energía como agua en altura.', false],
        ['Las baterías generan energía por sí mismas.', true, 'Guardan energía generada antes; no la producen.'],
      ], 'La variabilidad es un desafío técnico con soluciones conocidas.', { d: 3 }),
      comp('Completá.', 'Las centrales de [bombeo] guardan energía como agua en altura; las [baterías] se cargan con sol al mediodía; y las líneas de [transmisión] llevan energía de una región a otra.', ['carbón', 'turbinas', 'agua'], 'Tres piezas para sostener un sistema con muchas renovables.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Costos, beneficios e impactos', 'Por qué las renovables se volvieron tan baratas, qué empleos generan y qué impactos locales hay que cuidar.', [
      teoria('Una caída de costos histórica', [
        'Según IRENA, la agencia internacional de energías renovables, entre 2010 y 2023 el costo de generar electricidad con paneles solares a gran escala cayó alrededor de un 90 % en promedio en el mundo, y el de la eólica en tierra, alrededor de un 70 %. Hoy, en muchos lugares, construir solar o eólica nueva es más barato que construir centrales fósiles nuevas.',
        'La razón principal es la curva de aprendizaje: cada vez que se duplica la cantidad instalada, la tecnología mejora y se abarata.',
      ], { destacado: { valor: '≈ 90 %', texto: 'bajó el costo de la electricidad solar a gran escala entre 2010 y 2023, según IRENA.' } }),
      est('Estimá cuánto bajó el costo de la electricidad solar a gran escala entre 2010 y 2023, según IRENA.', 90, { min: 0, max: 100, paso: 5, unidad: '%' }, 'Alrededor del 90 %. Una de las caídas de costos más rápidas de la historia de la energía.', { d: 2 }),
      numv(3, (i) => { // e1
        const c1 = [0.46, 0.4, 0.5][i];
        const baja = [90, 85, 88][i];
        return {
          enunciado: `Si generar un kWh solar costaba ${c1.toLocaleString('es-AR')} dólares y el costo bajó un ${baja} %, ¿cuánto cuesta ahora? Redondeá a tres decimales.`,
          valor: Math.round(c1 * (1 - baja / 100) * 1000) / 1000,
          unidad: 'dólares por kWh',
          dec: 3,
          tol: 0.002,
          explicacion: `${c1.toLocaleString('es-AR')} × ${(1 - baja / 100).toLocaleString('es-AR')} ≈ ${(Math.round(c1 * (1 - baja / 100) * 1000) / 1000).toLocaleString('es-AR')} dólares por kWh: una fracción de lo que costaba.`,
        };
      }, { d: 3 }),
      cad('Armá la cadena de la curva de aprendizaje.', [ // e2
        'Se instalan más paneles en el mundo',
        'Las fábricas producen a mayor escala',
        'Mejoran la tecnología y los procesos',
        'Baja el costo de cada panel',
        'Se instalan todavía más paneles',
      ], ['Cuantos más paneles se fabrican, más caros se vuelven'], 'Un círculo virtuoso que explica por qué las renovables se abarataron tanto.', { d: 2 }),
      teoria('Impactos locales', [
        'Las renovables también tienen impactos que hay que evaluar y reducir: los parques eólicos pueden afectar a aves y murciélagos, sobre todo si se ubican en rutas migratorias; los grandes parques solares ocupan superficie y pueden afectar ambientes frágiles; las represas cortan ríos; y la fabricación de paneles, turbinas y baterías usa minerales cuya extracción tiene impactos, como verás en la rama Digital.',
        'Por eso los proyectos renovables también pasan por evaluación de impacto ambiental, y se eligen ubicaciones y diseños que reduzcan esos efectos.',
      ]),
      par('Uní cada fuente con un impacto a cuidar.', [ // e3
        ['Eólica', 'Aves y murciélagos en rutas migratorias'],
        ['Solar a gran escala', 'Ocupación de superficie en ambientes frágiles'],
        ['Gran hidráulica', 'Ríos cortados y peces migradores'],
        ['Baterías', 'Extracción de minerales como el litio'],
      ], 'Ninguna fuente es impacto cero. Lo importante es comparar y reducir.', { d: 2 }),
      vf('Como las renovables no emiten CO₂ al generar, no necesitan evaluación de impacto ambiental.', false, 'Tienen otros impactos —sobre fauna, suelo, agua y paisaje— que hay que evaluar y reducir antes de construir.', { // e4
        razones: ['+Porque tienen otros impactos que hay que evaluar', '-Porque la ley prohíbe evaluarlas', '-Porque no ocupan ningún espacio'],
        d: 2,
      }),
      teoria('Beneficios más allá del clima', [
        'Además de bajar emisiones, las renovables mejoran la calidad del aire (menos combustión), reducen la dependencia de importar combustibles, generan empleo en instalación y mantenimiento, y pueden llevar energía a lugares aislados, como escuelas rurales con paneles solares.',
        'Cuando las comunidades locales participan y se benefician —con empleo, energía más barata o participación en los proyectos—, los proyectos suelen tener más apoyo.',
      ]),
      mult('¿Qué beneficios pueden traer las renovables? Marcá todos.', [ // e5
        '+Aire más limpio',
        '+Menos importación de combustibles',
        '+Empleo local',
        '+Energía para lugares aislados',
        '-Cero impactos de ningún tipo',
      ], 'Muchos beneficios, sin olvidar que también tienen impactos a cuidar.', { d: 1 }),
      clas('¿Esta decisión reduce el impacto de un proyecto renovable o lo aumenta?', { // e6
        'Lo reduce': ['Ubicar el parque eólico lejos de rutas migratorias', 'Instalar paneles sobre techos y estacionamientos', 'Detener turbinas en momentos de paso de aves'],
        'Lo aumenta': ['Desmontar bosque nativo para un parque solar', 'Instalar aerogeneradores en un corredor de aves', 'No consultar a las comunidades cercanas'],
      }, 'Dónde y cómo se construye decide gran parte del impacto.', { d: 2 }),
      op('Para instalar paneles solares en una ciudad, ¿qué lugar suele tener menor impacto?', [ // e7
        'Techos y playas de estacionamiento',
        'Una plaza con árboles nativos',
        ['Un humedal urbano', 'Rellenar o cubrir un humedal destruye un ecosistema valioso.'],
        'Un parque público con césped',
      ], 'Los techos y estacionamientos ya son superficies construidas: aprovecharlos no quita espacio verde.', { d: 2 }),
      det('Leé este comentario y marcá lo equivocado.', [ // e8
        ['La solar y la eólica se abarataron mucho en la última década.', false],
        ['Por eso ya no hace falta evaluar sus impactos.', true, 'Siguen necesitando evaluación: tienen impactos locales.'],
        ['Las renovables pueden llevar energía a escuelas rurales aisladas.', false],
        ['La curva de aprendizaje hace que las tecnologías se encarezcan con el tiempo.', true, 'Al revés: al instalarse más, se abaratan.'],
      ], 'Beneficios grandes, impactos que se pueden reducir.', { d: 2 }),
      comp('Completá.', 'Según IRENA, el costo de la solar a gran escala bajó cerca del [90] %; esa baja se explica por la curva de [aprendizaje].', ['10', 'demanda'], 'La historia económica de las renovables, en una línea.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: energías renovables', 'Sol, viento, otras renovables, almacenamiento y costos, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: el techo solar de la escuela', 'Una escuela de Córdoba quiere instalar paneles solares. Con los números, evaluá el proyecto.', [
      teoria('El proyecto', [
        'La escuela consume 12.000 kWh de electricidad por año, casi todo de día. Tiene un techo que mira al norte, sin sombras, donde entran paneles por 8 kW. En su zona, el sol equivale a unas 5 horas de sol pleno por día en promedio, y el sistema pierde un 15 % entre cables, inversor y suciedad.',
        'Con la ley de generación distribuida, lo que no consume puede volcarlo a la red. El factor de emisión de la red es de 0,35 kg de CO₂ por kWh.',
      ]),
      num('¿Cuántos kWh por año generarían los paneles antes de las pérdidas? (8 kW × 5 h × 365)', 14600, 'kWh', '8 × 5 × 365 = 14.600 kWh por año antes de descontar pérdidas.', { ctx: '8 kW de paneles; 5 horas de sol pleno por día.', d: 2 }),
      num('Con un 15 % de pérdidas, ¿cuántos kWh por año generarían?', 12410, 'kWh', '14.600 × 0,85 = 12.410 kWh: un poco más de lo que consume la escuela en un año.', { ctx: '14.600 kWh antes de pérdidas; 15 % de pérdidas.', d: 2 }),
      num('¿Cuántos kg de CO₂ por año se evitarían con esa generación? (0,35 kg por kWh) Redondeá al entero.', 4344, 'kg de CO₂', '12.410 × 0,35 ≈ 4.344 kg de CO₂ por año: más de 4 toneladas.', { ctx: '12.410 kWh por año; 0,35 kg de CO₂ por kWh.', tol: 5, d: 2 }),
      op('Como la escuela casi no consume en vacaciones, ¿qué pasa con la energía de enero?', [ // e4
        'Se vuelca a la red y se compensa',
        'Se pierde sin que nadie la use',
        ['Los paneles se apagan solos en vacaciones', 'Siguen generando: la ley permite volcar el excedente a la red.'],
        'Se guarda en los cables hasta marzo',
      ], 'La generación distribuida permite aprovechar los excedentes: otras casas los consumen.', { d: 3 }),
      mult('¿Qué conviene revisar antes de instalar? Marcá todo.', [ // e5
        '+Que el techo resista el peso de los paneles',
        '+Que no haya sombras a lo largo del año',
        '+Los trámites de conexión con la distribuidora',
        '+Quién se encarga de la limpieza y el mantenimiento',
        '-Que los paneles miren al sur',
      ], 'Estructura, sombras, trámites y mantenimiento: lo que asegura que el proyecto funcione años.', { d: 2 }),
      clas('Clasificá los argumentos que aparecen en la reunión de padres.', { // e6
        'Con fundamento': ['La escuela consume sobre todo de día, cuando hay sol', 'Evitaría más de 4 toneladas de CO₂ por año', 'Los chicos pueden aprender con los datos de generación'],
        'Sin fundamento': ['En invierno los paneles no generan nada', 'Los paneles funcionan mejor mirando al sur', 'Si hay un día nublado, se rompen'],
      }, 'Decidir con datos concretos y sin mitos sobre los paneles.', { d: 3 }),
      det('La escuela escribe el proyecto. Marcá lo que no conviene.', [ // e7
        ['Instalaremos 8 kW en el techo que mira al norte.', false],
        ['Plantaremos árboles altos delante de los paneles para que se vean lindos.', true, 'Las sombras bajarían mucho la generación.'],
        ['Mostraremos en un pizarrón cuánto generan por día.', false],
        ['No haremos mantenimiento porque los paneles no se ensucian nunca.', true, 'El polvo baja el rendimiento: conviene limpiarlos periódicamente.'],
      ], 'Un buen proyecto solar se diseña para rendir y para enseñar.', { d: 3 }),
    ]),
  ],
});
