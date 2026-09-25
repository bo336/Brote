import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// CIENCIA 3 — Fuentes y desinformación.
// Qué tipos de fuentes hay y cuánto pesa cada una, cómo evaluar una fuente
// con lectura lateral, las técnicas de la desinformación, por qué se difunde
// y cómo verificar y responder sin amplificarla. Retoma cómo avanza la
// ciencia (ciencia-1), los gráficos engañosos (ciencia-2) y hablar de
// ambiente sin pelear (tronco-3).

export default unidad({
  slug: 'ciencia-3',
  rama: 'ciencia',
  orden: 3,
  nivel: 2,
  requiereTronco: 2,
  titulo: 'Fuentes y desinformación',
  bajada: 'Estudios, notas, posteos y cadenas: cómo saber cuánto confiar en cada fuente, reconocer las trampas de la desinformación y verificar antes de compartir.',
  objetivos: [
    'Distinguir fuentes primarias, secundarias y de síntesis, y su peso como evidencia',
    'Evaluar una fuente con lectura lateral',
    'Reconocer las técnicas más comunes de la desinformación',
    'Explicar por qué lo falso se difunde más rápido',
    'Verificar un contenido y responderlo sin amplificarlo',
  ],
  repasa: ['ciencia-1', 'ciencia-2', 'tronco-3', 'consumo-2'],
  fuentes: ['chequeado', 'lectura-lateral', 'first-draft-tipos', 'flicc-cook', 'vosoughi-2018', 'inoculacion', 'cochrane', 'ipcc-ar6-syr'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('No todas las fuentes pesan igual', 'De la anécdota a la revisión sistemática: tipos de fuentes y cuánta evidencia aporta cada una.', [
      teoria('Primarias, secundarias y de síntesis', [
        'Una fuente primaria es donde aparece por primera vez un dato o un resultado: un artículo científico con una investigación original, una base de datos oficial, un informe de mediciones. Una fuente secundaria cuenta o interpreta fuentes primarias: una nota periodística, un libro de divulgación, un video explicativo. Y hay fuentes de síntesis que reúnen y evalúan muchas investigaciones a la vez, como las revisiones sistemáticas o los informes del IPCC, que evalúan miles de estudios.',
      ]),
      clas('¿Qué tipo de fuente es cada una?', { // e1
        'Primaria': ['Artículo científico con un experimento original', 'Datos de una estación que mide el CO₂'],
        'Secundaria': ['Nota de un diario sobre un estudio', 'Video de divulgación que explica una investigación'],
        'De síntesis': ['Revisión sistemática de 200 estudios', 'Informe del IPCC'],
      }, 'Cada tipo sirve para algo: la primaria para ver el dato original, la secundaria para entender, la de síntesis para saber qué dice el conjunto.', { d: 2 }),
      teoria('Una escalera de evidencia', [
        'No todas las afirmaciones tienen el mismo respaldo. En la parte más baja están las opiniones y las anécdotas ("a mi tío le pasó"). Un poco más arriba, los estudios de un solo caso. Luego, los estudios observacionales, que comparan grupos sin intervenir. Después, los experimentos controlados. Y arriba de todo, las revisiones sistemáticas y los metaanálisis, que combinan muchos estudios con un método explícito.',
        'Un estudio aislado, aunque sea bueno, puede estar equivocado. Lo más confiable es lo que muestran muchos estudios juntos.',
      ]),
      rank('Ordená estas fuentes de evidencia de la más débil a la más fuerte.', [ // e2
        ['Anécdota de un conocido', 'opinión'],
        ['Estudio de un solo caso', 'un caso'],
        ['Estudio que compara dos grupos grandes', 'observacional'],
        ['Experimento controlado', 'experimental'],
        ['Revisión sistemática de muchos estudios', 'síntesis'],
      ], 'La escalera no dice que lo de abajo sea falso: dice cuánto peso tiene como prueba.', { d: 2, extremos: ['Más débil', 'Más fuerte'] }),
      op('Un titular dice: "Un estudio demuestra que el café alarga la vida". ¿Qué conviene preguntarse primero?', [ // e3
        '¿Qué dicen los demás estudios sobre el tema?',
        '¿Cuántas veces lo compartieron en redes?',
        ['¿El periodista toma café?', 'Lo que importa es la evidencia, no los gustos de quien escribe.'],
        '¿La foto del artículo es linda?',
      ], 'Un estudio aislado es una pieza. Para saber cuánto pesa, hay que ver el conjunto de la evidencia.', { d: 2 }),
      teoria('Revisión por pares y preprints', [
        'Antes de publicarse en una revista científica, un artículo suele pasar por revisión por pares: otros especialistas lo leen, piden correcciones y pueden rechazarlo. No es perfecta, pero filtra muchos errores. Un preprint, en cambio, es un artículo que se publica antes de esa revisión: sirve para compartir resultados rápido, pero hay que leerlo con más cautela. También existen revistas "depredadoras", que cobran por publicar sin revisar en serio.',
      ]),
      par('Uní cada término con su definición.', [ // e4
        ['Revisión por pares', 'Especialistas evalúan un artículo antes de publicarlo'],
        ['Preprint', 'Artículo publicado antes de ser revisado'],
        ['Metaanálisis', 'Combina estadísticamente los datos de muchos estudios'],
        ['Revista depredadora', 'Cobra por publicar sin revisar en serio'],
      ], 'Conocer estos términos ayuda a saber cuánta confianza darle a una publicación.', { d: 2 }),
      vf('Si algo está publicado en una revista científica, es verdad y ya no se discute.', false, 'La revisión por pares filtra errores, pero no garantiza que un resultado sea correcto. La confianza crece cuando otros estudios lo confirman.', { // e5
        razones: ['+Porque un resultado se vuelve sólido cuando otros lo confirman', '-Porque las revistas científicas publican cualquier cosa', '-Porque la ciencia nunca cambia de opinión'],
        d: 2,
      }),
      numv(3, (i) => { // e6
        const [total, favor] = [[40, 36], [25, 21], [60, 57]][i];
        return {
          enunciado: `Una revisión encontró ${total} estudios sobre un tema; ${favor} muestran el mismo resultado. ¿Qué porcentaje coincide? Redondeá al entero.`,
          valor: Math.round((favor / total) * 100),
          unidad: '%',
          tol: 1,
          explicacion: `${favor} ÷ ${total} × 100 ≈ ${Math.round((favor / total) * 100)} %. Si alguien cita solo uno de los estudios que no coinciden, muestra una parte chica de la evidencia.`,
          ctx: `${favor} de ${total} estudios muestran el mismo resultado.`,
        };
      }, { d: 1 }),
      teoria('Cuidado con el "un estudio dice"', [
        'Cuando un tema tiene cientos de estudios, siempre va a haber alguno que diga lo contrario, por azar, por errores o por un diseño distinto. Elegir justo ese y presentarlo como "la prueba" es una trampa común. La pregunta útil no es "¿hay algún estudio que diga X?", sino "¿qué dice la mayoría de la evidencia de buena calidad?".',
      ]),
      cad('Armá el razonamiento correcto frente a un estudio sorprendente.', [ // e7
        'Aparece un estudio con un resultado sorprendente',
        'Se revisa cómo se hizo y quién lo hizo',
        'Se buscan otros estudios sobre el mismo tema',
        'Se compara con lo que muestra el conjunto',
        'Se le da el peso que corresponde',
      ], ['Se comparte enseguida porque es sorprendente'], 'La sorpresa es una razón para mirar mejor, no para creer más rápido.', { d: 2 }),
      mult('¿Qué señales aumentan la confianza en un resultado científico? Marcá todas.', [ // e8
        '+Otros equipos lo replicaron',
        '+Pasó revisión por pares',
        '+Coincide con revisiones de muchos estudios',
        '-Se volvió viral en redes',
        '-Lo contradice todo lo anterior sin explicar por qué',
      ], 'Lo viral no es evidencia, y un resultado que contradice todo exige pruebas extraordinarias.', { d: 2 }),
      det('Leé este comentario y marcá lo equivocado.', [ // e9
        ['Un informe del IPCC reúne y evalúa miles de estudios.', false],
        ['Un preprint ya pasó revisión por pares.', true, 'Es al revés: un preprint se publica antes de la revisión.'],
        ['Una anécdota tiene menos peso que un experimento controlado.', false],
        ['Si encuentro un estudio que dice lo que pienso, ya está probado.', true, 'Un estudio aislado puede estar equivocado; importa el conjunto.'],
      ], 'Saber cuánto pesa cada fuente evita tanto la credulidad como la desconfianza total.', { d: 2 }),
      est('Estimá cuántas referencias científicas cita el informe del Grupo de Trabajo I del IPCC (2021).', 14000, { min: 10, max: 1000000, unidad: 'referencias', escala: 'log' }, 'Más de 14.000. Por eso un informe del IPCC pesa mucho más que cualquier estudio aislado: resume la evidencia de miles.', { d: 3 }),
      comp('Completá.', 'Una nota que cuenta un estudio es una fuente [secundaria]; un artículo publicado antes de ser revisado es un [preprint]; y la evidencia más fuerte viene de revisiones [sistemáticas].', ['primaria', 'titular', 'aisladas'], 'Tres términos para ubicar cualquier fuente en la escalera de evidencia.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Leer de costado', 'Quién lo dice, cómo lo sabe y qué dicen otros: la lectura lateral que usan los verificadores profesionales.', [
      teoria('Lo que hacen los verificadores', [
        'Investigadores de la Universidad de Stanford compararon cómo evaluaban sitios web desconocidos tres grupos: historiadores, estudiantes universitarios y verificadores de datos profesionales. Los dos primeros leían el sitio de arriba abajo, miraban el diseño, el "quiénes somos" y los logos. Los verificadores, en cambio, salían enseguida del sitio y abrían otras pestañas para averiguar quién estaba detrás. Llegaron a conclusiones correctas más rápido.',
        'A esa estrategia se la llama lectura lateral: para saber si confiar en una fuente, se busca qué dicen otros sobre ella.',
      ]),
      op('¿Qué es la lectura lateral?', [ // e1
        'Salir del sitio para ver qué dicen otros de la fuente',
        'Leer el texto completo con mucha atención',
        ['Mirar si el diseño del sitio es profesional', 'Un buen diseño se compra fácil: no dice nada de la confiabilidad.'],
        'Leer solo los títulos y los subtítulos',
      ], 'Leer de arriba abajo no revela quién está detrás. Buscar afuera, sí.', { d: 1 }),
      vf('Un sitio con buen diseño, logos y un "quiénes somos" prolijo es confiable.', false, 'Cualquiera puede armar un sitio prolijo. Muchas organizaciones que defienden intereses particulares tienen sitios muy profesionales. Hay que averiguar quién está detrás.', { // e2
        razones: ['+Porque la apariencia se puede fabricar fácilmente', '-Porque los sitios prolijos siempre mienten', '-Porque el diseño no se puede evaluar'],
        d: 2,
      }),
      teoria('Tres preguntas', [
        'Para evaluar cualquier fuente sirven tres preguntas. ¿Quién está detrás? Una persona, una empresa, una ONG, un organismo público; qué experiencia tiene y qué intereses. ¿Cuál es la evidencia? Si cita datos, estudios o documentos que se puedan revisar. ¿Qué dicen otras fuentes? Si fuentes independientes y confiables confirman lo mismo.',
      ]),
      ord('Ordená los pasos para evaluar una nota que te llega.', [ // e3
        'Frenar antes de reaccionar o compartir',
        'Averiguar quién está detrás de la fuente',
        'Revisar qué evidencia presenta',
        'Buscar qué dicen otras fuentes independientes',
        'Decidir cuánto confiar y si compartir',
      ], 'El primer paso es el más difícil: frenar. Las emociones empujan a compartir rápido.', { d: 2 }),
      teoria('Intereses y conflictos', [
        'Que una fuente tenga intereses no la vuelve falsa, pero sí obliga a mirarla con más cuidado. Una empresa petrolera que financia un estudio sobre clima, un fabricante que evalúa su propio producto, una ONG que necesita donaciones: todos pueden tener sesgos. Por eso las revistas científicas piden declarar los conflictos de interés y las fuentes de financiamiento.',
      ]),
      clas('¿Hay un posible conflicto de interés?', { // e4
        'Posible conflicto': ['Una marca de agua embotellada financia un estudio sobre agua de red', 'Una empresa evalúa su propio producto', 'Un sitio que vende suplementos publica sus beneficios'],
        'Sin conflicto evidente': ['Un organismo estadístico publica datos de censo', 'Un equipo universitario sin financiamiento privado replica un estudio'],
      }, 'Detectar intereses no es acusar: es saber qué verificar con más cuidado.', { d: 2 }),
      par('Uní cada pregunta con lo que busca responder.', [ // e5
        ['¿Quién está detrás?', 'Autoría, experiencia e intereses'],
        ['¿Cuál es la evidencia?', 'Datos o estudios que se puedan revisar'],
        ['¿Qué dicen otros?', 'Confirmación por fuentes independientes'],
        ['¿De cuándo es?', 'Si la información está actualizada'],
      ], 'Cuatro preguntas rápidas que evitan la mayoría de los engaños.', { d: 1 }),
      op('Una web llamada "Instituto para la Energía Limpia y Barata" dice que los autos eléctricos contaminan más que los de nafta. ¿Qué hacés primero?', [ // e6
        'Buscar quién financia ese instituto',
        'Confiar, porque el nombre suena científico',
        ['Descartarlo sin mirar, porque seguro miente', 'No hay que creer ni descartar a ciegas: hay que averiguar.'],
        'Compartirlo para ver qué opinan tus amigos',
      ], 'Los nombres institucionales pueden esconder intereses. La lectura lateral lo revela en minutos.', { d: 2 }),
      numv(3, (i) => { // e7
        const [min, n] = [[2, 5], [3, 4], [1, 10]][i];
        return {
          enunciado: `Si chequear una fuente con lectura lateral lleva ${min} minuto${min > 1 ? 's' : ''} y hoy te llegaron ${n} notas dudosas, ¿cuántos minutos te lleva chequearlas todas?`,
          valor: min * n,
          unidad: 'minutos',
          explicacion: `${min} × ${n} = ${min * n} minutos. Un costo chico comparado con el de difundir algo falso a todos tus contactos.`,
        };
      }, { d: 1 }),
      mult('¿Qué indicios hacen dudar de una fuente? Marcá todos.', [ // e8
        '+No se sabe quién la escribió',
        '+No cita ninguna evidencia verificable',
        '+Vende un producto relacionado con lo que afirma',
        '-La publicó un organismo con datos abiertos',
        '-Otras fuentes independientes confirman lo mismo',
      ], 'Autoría oculta, falta de evidencia e intereses directos son señales de alerta.', { d: 1 }),
      det('Leé cómo evaluó una fuente un compañero y marcá los errores.', [ // e9
        ['Busqué quién financia el sitio.', false],
        ['Como el sitio se ve profesional, decidí confiar.', true, 'El diseño no dice nada de la confiabilidad.'],
        ['Revisé si otras fuentes confirman el dato.', false],
        ['Leí solo el "quiénes somos" del propio sitio.', true, 'Hay que ver qué dicen otros, no solo lo que la fuente dice de sí misma.'],
      ], 'La lectura lateral se aprende practicando: salir del sitio es el hábito clave.', { d: 2 }),
      vf('Si una fuente tiene intereses económicos en un tema, todo lo que dice es falso.', false, 'Tener intereses no vuelve falsa una afirmación: obliga a verificarla con más cuidado y a buscar confirmación independiente.', { // e10
        razones: ['+Porque los intereses piden más verificación, no descarte automático', '-Porque ninguna fuente tiene intereses', '-Porque las empresas nunca publican datos'],
        d: 2,
      }),
      comp('Completá.', 'Buscar en otras pestañas qué dicen otros de una fuente se llama lectura [lateral]; tener intereses que pueden sesgar un estudio es un conflicto de [interés]; y el primer paso ante algo que te llega es [frenar].', ['vertical', 'opinión', 'compartir'], 'Tres ideas para evaluar fuentes como lo hacen los verificadores.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('Las trampas de la desinformación', 'Contexto falso, contenido fabricado, falsos expertos y datos elegidos a dedo: cómo reconocer las técnicas.', [
      teoria('Error o engaño', [
        'Conviene distinguir la información errónea, que se comparte sin intención de engañar (alguien cree que es cierta), de la desinformación, que se crea o se difunde a propósito para engañar. La diferencia importa para responder: con quien se equivocó, alcanza con mostrar el dato; con una campaña deliberada, hace falta entender a quién beneficia.',
      ]),
      clas('¿Es información errónea o desinformación?', { // e1
        'Información errónea (sin intención)': ['Tu tía comparte una foto vieja creyendo que es de hoy', 'Un compañero repite un dato mal recordado'],
        'Desinformación (a propósito)': ['Una red de cuentas falsas difunde el mismo mensaje', 'Una empresa inventa un estudio para vender más'],
      }, 'La intención cambia la respuesta: corregir con empatía o exponer una estrategia.', { d: 2 }),
      teoria('Siete formas', [
        'La investigadora Claire Wardle propuso siete tipos de contenido problemático, de menor a mayor intención de engañar: sátira o parodia (no busca engañar, pero puede confundir); conexión falsa (el título no coincide con el contenido); contenido engañoso (usa información real para culpar o encuadrar de forma tramposa); contexto falso (contenido real con fecha, lugar o explicación falsos); contenido impostor (imita a una fuente conocida); contenido manipulado (imagen o dato real alterado); y contenido fabricado (completamente falso).',
      ]),
      par('Uní cada tipo con su ejemplo.', [ // e2
        ['Contexto falso', 'Foto real de una inundación de 2010 presentada como de ayer'],
        ['Contenido impostor', 'Un sitio que copia el logo de un diario conocido'],
        ['Conexión falsa', 'Un título alarmante que la nota no respalda'],
        ['Contenido fabricado', 'Una cita inventada atribuida a un científico'],
      ], 'El contexto falso es de los más comunes: la imagen es real, la historia no.', { d: 3 }),
      op('Una foto real de un incendio en otro país circula como si fuera de Córdoba, hoy. ¿Qué tipo de contenido es?', [ // e3
        'Contexto falso',
        'Contenido fabricado',
        ['Sátira o parodia', 'No busca hacer humor: se presenta como noticia real.'],
        'Contenido impostor',
      ], 'La imagen es real, pero el lugar y la fecha no: eso es contexto falso, una de las formas más comunes.', { d: 2 }),
      rank('Ordená estos tipos de contenido de menor a mayor intención de engañar, según Wardle.', [ // e3b
        ['Sátira o parodia', 'no busca engañar'],
        ['Conexión falsa', 'título que no coincide'],
        ['Contexto falso', 'contenido real mal ubicado'],
        ['Contenido fabricado', 'totalmente falso'],
      ], 'A mayor intención de engañar, más importante es entender quién lo difunde y para qué.', { d: 3, extremos: ['Menos intención', 'Más intención'] }),
      teoria('Las técnicas del negacionismo', [
        'El investigador John Cook resumió las técnicas más usadas para negar consensos científicos con la sigla FLICC: falsos expertos (presentar a alguien sin experiencia en el tema como autoridad); falacias lógicas (razonamientos que no se sostienen); expectativas imposibles (exigir certeza absoluta antes de actuar); selección de datos (elegir solo los datos que convienen, conocido como cherry picking); y teorías conspirativas (sostener que los científicos se ponen de acuerdo para mentir).',
      ]),
      par('Uní cada frase con la técnica que usa.', [ // e3
        ['"Un ingeniero famoso dice que el clima no cambia"', 'Falso experto'],
        ['"Hasta que no haya certeza total, no hagamos nada"', 'Expectativa imposible'],
        ['"Desde aquel año récord no se calentó"', 'Selección de datos'],
        ['"Los científicos inventan todo para cobrar subsidios"', 'Teoría conspirativa'],
        ['"El clima siempre cambió, así que ahora también es natural"', 'Falacia lógica'],
      ], 'Reconocer la técnica permite responder aunque no conozcas el dato puntual.', { d: 3 }),
      ejemplo('Datos elegidos a dedo', 'Alguien muestra la temperatura global desde 1998, un año muy cálido por El Niño, hasta 2012, y dice: "no se calentó".', [
        'Empezar la serie en un pico hace que lo que sigue parezca plano.',
        'Si se mira desde 1970 hasta hoy, la tendencia al alza es clara.',
        'Y los años posteriores a 2012 fueron todavía más cálidos.',
      ], 'Recortar el período es una forma de mentir con datos reales. Siempre conviene mirar la serie completa.'),
      op('¿Qué trampa usa quien muestra solo 1998–2012 para decir que el planeta no se calienta?', [ // e4
        'Selección de datos: elige el tramo que le conviene',
        'Contenido fabricado: los datos son inventados',
        ['Sátira: lo dice en broma', 'No es broma: se presenta como un argumento serio.'],
        'Falso experto: no cita a nadie',
      ], 'Los datos son reales; el engaño está en el recorte. Lo viste con los gráficos engañosos.', { d: 2 }),
      vf('Si todos los datos de un gráfico son reales, el gráfico no puede engañar.', false, 'Puede engañar con el recorte del período, la escala de los ejes o lo que deja afuera. Datos reales no garantizan una conclusión correcta.', { // e5
        razones: ['+Porque el recorte y la escala pueden engañar con datos reales', '-Porque todos los gráficos mienten', '-Porque los datos reales siempre están mal'],
        d: 2,
      }),
      mult('¿Qué técnicas de FLICC aparecen en este mensaje? "Un médico dice que el cambio climático es un invento de los gobiernos para cobrar impuestos." Marcá todas.', [ // e6
        '+Falso experto',
        '+Teoría conspirativa',
        '-Selección de datos',
        '-Expectativa imposible',
      ], 'Un médico no es especialista en clima, y la idea de un invento coordinado es conspirativa. El mensaje no usa datos.', { d: 3 }),
      numv(3, (i) => { // e7
        const [ini, fin] = [[14.3, 14.4], [14.5, 14.5], [14.4, 14.5]][i];
        return {
          enunciado: `En el tramo elegido, la temperatura media pasó de ${ini.toLocaleString('es-AR')} °C a ${fin.toLocaleString('es-AR')} °C. Mirando desde 1970 pasó de 14,0 °C a 15,2 °C. ¿Cuántos grados más muestra la serie completa que el tramo elegido?`,
          valor: Math.round((1.2 - (fin - ini)) * 10) / 10,
          unidad: '°C',
          dec: 1,
          tol: 0.05,
          explicacion: `Serie completa: 15,2 − 14,0 = 1,2 °C. Tramo: ${(Math.round((fin - ini) * 10) / 10).toLocaleString('es-AR')} °C. Diferencia: ${(Math.round((1.2 - (fin - ini)) * 10) / 10).toLocaleString('es-AR')} °C que el recorte esconde. Valores ficticios para practicar.`,
          ctx: `Tramo de ${ini} a ${fin} °C; serie completa de 14,0 a 15,2 °C.`,
        };
      }, { d: 3 }),
      det('Leé este posteo y marcá las trampas.', [ // e8
        ['"Este dato es del organismo oficial de estadísticas."', false],
        ['"Un actor famoso explicó que reciclar no sirve para nada."', true, 'Falso experto: la fama no es experiencia en el tema.'],
        ['"La nota enlaza el estudio original."', false],
        ['"Como la ciencia no está 100 % segura, no hay que hacer nada."', true, 'Expectativa imposible: nunca hay certeza total para actuar.'],
      ], 'Buscar las técnicas es más rápido que discutir cada dato.', { d: 2 }),
      comp('Completá.', 'Elegir solo los datos que convienen se llama [selección] de datos; una foto real con fecha falsa es un caso de contexto [falso]; y exigir certeza total antes de actuar es una expectativa [imposible].', ['recolección', 'impostor', 'razonable'], 'Tres trampas frecuentes de la desinformación.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Por qué lo falso vuela', 'Emociones, sesgos, repetición y algoritmos: por qué la desinformación se difunde más rápido que los datos.', [
      teoria('Más lejos y más rápido', [
        'Un estudio publicado en la revista Science en 2018 analizó alrededor de 126.000 historias que circularon en Twitter entre 2006 y 2017. Las noticias falsas llegaron más lejos, más rápido y a más personas que las verdaderas: tenían un 70 % más de probabilidad de ser compartidas. Las verdaderas tardaban unas seis veces más en llegar a 1.500 personas. Y no eran los bots los que marcaban la diferencia: eran las personas.',
      ], { destacado: { valor: '70 %', texto: 'más probabilidad de ser compartidas tenían las noticias falsas que las verdaderas, según un estudio de Science (2018).' } }),
      est('Estimá cuánto más probable era que se compartiera una noticia falsa que una verdadera, según el estudio de Science.', 70, { min: 0, max: 500, paso: 5, unidad: '% más' }, 'Un 70 % más. Lo falso suele ser más novedoso y sorprendente, y eso empuja a compartir.', { d: 2 }),
      teoria('Por qué pasa', [
        'Lo falso suele ser más novedoso y provocar emociones fuertes: sorpresa, miedo, indignación. Esas emociones empujan a compartir sin pensar. Además, tendemos a creer más lo que confirma lo que ya pensamos (sesgo de confirmación). Y lo que escuchamos muchas veces nos parece más cierto, aunque sea falso: es el efecto de verdad ilusoria.',
        'Los algoritmos de las redes muestran más lo que genera reacciones, así que lo indignante tiene ventaja.',
      ]),
      par('Uní cada mecanismo con su definición.', [ // e2
        ['Sesgo de confirmación', 'Creer más lo que coincide con lo que ya pensamos'],
        ['Efecto de verdad ilusoria', 'Lo repetido parece más cierto'],
        ['Novedad', 'Lo sorprendente llama más la atención'],
        ['Algoritmos de reacción', 'Muestran más lo que genera interacciones'],
      ], 'Estos mecanismos nos afectan a todos, no solo a "los demás".', { d: 2 }),
      cad('Armá la cadena de cómo se viraliza un contenido falso.', [ // e3
        'Un contenido falso provoca indignación',
        'Muchas personas reaccionan y lo comparten',
        'El algoritmo lo muestra a más gente',
        'Aparece muchas veces en distintas fuentes',
        'Por repetición, parece más creíble',
      ], ['El algoritmo verifica los datos antes de mostrarlo'], 'Emoción, algoritmo y repetición se retroalimentan.', { d: 2 }),
      vf('Solo las personas poco informadas caen en la desinformación.', false, 'Los sesgos de confirmación y de verdad ilusoria afectan a todos, incluidas personas muy educadas. Por eso sirven hábitos como frenar y verificar.', { // e4
        razones: ['+Porque los sesgos afectan a todas las personas', '-Porque la desinformación no engaña a nadie', '-Porque las personas informadas nunca comparten nada'],
        d: 2,
      }),
      op('¿Por qué un titular que te indigna es una señal para frenar?', [ // e5
        'La indignación empuja a compartir sin pensar',
        'Porque las noticias indignantes siempre son falsas',
        ['Porque indignarse está prohibido', 'No: la emoción es válida, pero conviene verificar antes de actuar.'],
        'Porque los titulares no importan',
      ], 'No todo lo indignante es falso, pero la emoción fuerte es justo cuando más conviene verificar.', { d: 2 }),
      numv(3, (i) => { // e6
        const [n, r] = [[10, 2], [5, 3], [20, 2]][i];
        return {
          enunciado: `Una persona manda un mensaje a ${n} contactos (ronda 1). Cada uno lo reenvía a ${n} personas nuevas (ronda 2), y así sigue. ¿Cuántas personas lo reciben en la ronda ${r + 1}?`,
          valor: n ** (r + 1),
          unidad: 'personas',
          explicacion: `En cada ronda se multiplica por ${n}: ${n} elevado a ${r + 1} = ${(n ** (r + 1)).toLocaleString('es-AR')}. Por eso cortar la cadena temprano tiene tanto efecto.`,
          ctx: `${n} personas nuevas por reenvío; ronda ${r + 1}.`,
        };
      }, { d: 3 }),
      teoria('Burbujas', [
        'Cuando seguimos solo a personas que piensan parecido y los algoritmos nos muestran más de lo mismo, podemos quedar en una "burbuja" donde ciertas ideas parecen universales. Diversificar las fuentes, seguir a especialistas y medios con estándares de verificación, y exponerse a argumentos distintos ayuda a ver el panorama completo.',
      ]),
      mult('¿Qué hábitos reducen el efecto de los sesgos? Marcá todos.', [ // e7
        '+Frenar antes de compartir algo que te emociona',
        '+Seguir fuentes con estándares de verificación',
        '+Buscar a propósito argumentos distintos',
        '-Compartir rápido para ser el primero',
        '-Seguir solo a quienes piensan igual',
      ], 'No se trata de desconfiar de todo, sino de tener hábitos que compensen los sesgos.', { d: 1 }),
      op('Según el estudio de Science, ¿qué explica mejor que las noticias falsas se compartan más?', [ // e7b
        'Son más novedosas y despiertan emociones fuertes',
        'Los bots las comparten mucho más que a las verdaderas',
        ['Las verdaderas están prohibidas en las redes', 'Nada impide compartir noticias verdaderas; simplemente generan menos reacción.'],
        'Las falsas siempre tienen mejores fotos',
      ], 'El estudio encontró que la novedad y la emoción, y no los bots, explicaban la diferencia.', { d: 2 }),
      rank('Ordená estos contenidos del que más probablemente se viraliza al que menos.', [ // e8
        ['Titular falso, indignante y sorprendente', 'emoción + novedad'],
        ['Noticia verdadera con una historia emotiva', 'emoción'],
        ['Noticia verdadera con datos sin contexto emocional', 'poca emoción'],
        ['Informe técnico de 200 páginas', 'casi nada'],
      ], 'La viralidad premia la emoción y la novedad, no la verdad.', { d: 2, extremos: ['Más viral', 'Menos viral'] }),
      det('Leé esta reflexión y marcá lo equivocado.', [ // e9
        ['Las noticias falsas suelen llegar más lejos que las verdaderas.', false],
        ['Si algo lo leí muchas veces, seguro es cierto.', true, 'Es el efecto de verdad ilusoria: la repetición no prueba nada.'],
        ['Los algoritmos favorecen lo que genera reacciones.', false],
        ['Los bots explican toda la difusión de lo falso.', true, 'El estudio de Science encontró que las personas eran las que más lo difundían.'],
      ], 'Entender por qué funciona la desinformación es el primer paso para no ser parte.', { d: 2 }),
      comp('Completá.', 'Creer más lo que coincide con lo que pensamos es el sesgo de [confirmación]; lo repetido parece más cierto por el efecto de verdad [ilusoria]; y las noticias falsas tenían un [70] % más de probabilidad de compartirse.', ['atención', 'absoluta', '7'], 'Tres claves para entender por qué lo falso se difunde.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Verificar y responder', 'Búsqueda del origen, imágenes, chequeadores, prebunking y cómo corregir sin darle más alcance al mito.', [
      teoria('Herramientas de verificación', [
        'Para verificar un contenido se puede buscar su origen (¿quién lo publicó primero?), hacer una búsqueda inversa de la imagen (subirla a un buscador para ver dónde y cuándo apareció antes), buscar el tema en sitios de verificación como Chequeado, y buscar el dato en la fuente original que se cita. Muchas veces, en menos de cinco minutos se descubre que una foto es vieja o que un estudio no dice lo que se afirma.',
      ]),
      par('Uní cada problema con la herramienta que lo resuelve.', [ // e1
        ['Foto que podría ser vieja', 'Búsqueda inversa de imágenes'],
        ['Dato atribuido a un estudio', 'Buscar el estudio original'],
        ['Rumor que circula mucho', 'Buscar en sitios de verificación'],
        ['Cuenta desconocida que publica algo', 'Lectura lateral sobre quién es'],
      ], 'Cada tipo de contenido tiene su herramienta de verificación.', { d: 2 }),
      teoria('Prebunking: vacunarse contra el engaño', [
        'Investigadores de la Universidad de Cambridge estudiaron una estrategia llamada inoculación o prebunking: exponer a las personas, de forma controlada, a las técnicas de manipulación antes de que se encuentren con ellas. Igual que una vacuna, conocer la técnica en versión "debilitada" ayuda a reconocerla después. Juegos y videos breves que enseñan técnicas como el falso experto o el lenguaje emocional mejoraron la capacidad de detectar contenido manipulador.',
      ]),
      op('¿Qué es el prebunking?', [ // e2
        'Enseñar las técnicas de engaño antes de que aparezcan',
        'Borrar los contenidos falsos antes de que circulen',
        ['Responder a cada mentira después de que se viraliza', 'Eso es desmentir después (debunking); el prebunking es anticiparse.'],
        'Prohibir las redes sociales',
      ], 'Conocer las trampas de antemano funciona como una vacuna contra la manipulación.', { d: 2 }),
      teoria('Corregir sin amplificar', [
        'Al desmentir un mito, hay que evitar repetirlo tanto que termine reforzándose. Una estructura recomendada por especialistas es el "sándwich de la verdad": empezar por el dato correcto, advertir que circula un mito y explicar por qué es engañoso (qué técnica usa), y terminar repitiendo el dato correcto. Así, lo que más queda es la verdad, no el mito.',
      ]),
      ord('Ordená la estructura del "sándwich de la verdad".', [ // e3
        'Empezar con el dato correcto',
        'Advertir que circula un mito',
        'Explicar por qué el mito es engañoso',
        'Cerrar repitiendo el dato correcto',
      ], 'El dato correcto va al principio y al final: es lo que más se recuerda.', { d: 2 }),
      vf('Para desmentir un mito conviene repetirlo en el título, en grande, para que todos lo vean.', false, 'Repetir el mito en el lugar más visible puede reforzarlo por el efecto de verdad ilusoria. Conviene destacar el dato correcto.', { // e4
        razones: ['+Porque repetirlo en grande puede reforzarlo', '-Porque los mitos no se pueden desmentir', '-Porque los títulos no se leen'],
        d: 2,
      }),
      clas('¿Qué conviene hacer y qué no al responder a alguien que compartió algo falso?', { // e5
        'Conviene': ['Responder en privado si es alguien cercano', 'Empezar por el dato correcto', 'Incluir una fuente confiable'],
        'No conviene': ['Burlarse en público', 'Repetir el mito en mayúsculas', 'Acusar a la persona de mentir a propósito'],
      }, 'La mayoría de quienes comparten algo falso creen que es cierto. La empatía abre la conversación.', { d: 1 }),
      numv(3, (i) => { // e6
        const [n, p] = [[200, 30], [500, 12], [150, 40]][i];
        return {
          enunciado: `Un mensaje falso llegó a ${n} personas de un grupo. Después de una respuesta bien armada, el ${p} % dejó de compartirlo. ¿Cuántas personas dejaron de compartirlo?`,
          valor: Math.round((n * p) / 100),
          unidad: 'personas',
          explicacion: `${n} × ${p} % = ${Math.round((n * p) / 100)} personas. Cada persona que corta la cadena evita que el mensaje llegue a muchas más.`,
          ctx: `${n} personas; el ${p} % deja de compartir.`,
        };
      }, { d: 1 }),
      mult('¿Qué señales de alerta tiene un mensaje de cadena? Marcá todas.', [ // e7
        '+Pide compartir "antes de que lo borren"',
        '+No dice de dónde sale el dato',
        '+Usa muchas mayúsculas y signos de exclamación',
        '-Enlaza a la fuente original y tiene fecha',
        '-Lo publicó un medio con correcciones públicas',
      ], 'La urgencia, la falta de fuente y el tono alarmista son señales clásicas.', { d: 1 }),
      op('Tu tío compartió en el grupo familiar una foto de un glaciar "derrumbado ayer", pero es de hace diez años. ¿Qué respuesta es mejor?', [ // e8
        'Contarle en privado de cuándo es la foto y darle la fuente',
        'Escribir en el grupo que siempre comparte mentiras',
        ['Ignorarlo, porque no vale la pena', 'Puede ser una opción, pero perdés la oportunidad de cortar la cadena.'],
        'Compartir otra foto falsa para equilibrar',
      ], 'Privado, con respeto y con la fuente: así es más probable que corrija sin sentirse atacado.', { d: 2 }),
      cad('Armá los pasos para verificar una foto sospechosa.', [ // e8b
        'Guardar la imagen o una captura',
        'Hacer una búsqueda inversa de la imagen',
        'Encontrar la primera vez que apareció',
        'Comparar esa fecha y lugar con lo que dice el mensaje',
        'Concluir si el contexto es real o falso',
      ], ['Contar cuántos "me gusta" tiene la foto'], 'La popularidad no dice nada; el origen de la imagen sí.', { d: 2 }),
      det('Leé esta respuesta a un mito y marcá lo que conviene cambiar.', [ // e9
        ['"Los datos de la NASA muestran que el planeta se calentó 1,2 °C."', false],
        ['"¡¡¡EL CAMBIO CLIMÁTICO ES FALSO!!! es lo que dice este mensaje."', true, 'Repite el mito en grande; conviene mencionarlo breve y sin destacar.'],
        ['"Ese mensaje usa un falso experto: no es especialista en clima."', false],
        ['"Sos un ignorante por creer eso."', true, 'El insulto cierra la conversación; la empatía la abre.'],
      ], 'Una buena respuesta es precisa, breve, respetuosa y deja el dato correcto como lo más visible.', { d: 2 }),
      comp('Completá.', 'Para saber si una foto es vieja se hace una búsqueda [inversa]; enseñar las trampas antes de que aparezcan se llama [prebunking]; y el "sándwich de la verdad" empieza y termina con el dato [correcto].', ['rápida', 'bloqueo', 'viral'], 'Tres herramientas para verificar y responder sin amplificar.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: fuentes y desinformación', 'Tipos de fuentes, lectura lateral, técnicas de engaño, viralidad y verificación, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: la cadena del grupo', 'Llega un mensaje viral a un grupo de la escuela. Analizalo, verificalo y armá la respuesta.', [
      teoria('El mensaje', [
        '"URGENTE: un ingeniero reconocido demostró que los paneles solares contaminan más de lo que ahorran. Un estudio de la Universidad Internacional de Energía lo confirma. Los medios lo ocultan. Compartilo antes de que lo borren!!!" El mensaje no tiene enlaces ni fecha. Al buscar, encontrás que la "Universidad Internacional de Energía" es un sitio creado hace dos meses, sin autores identificables, y que las revisiones de estudios sobre el ciclo de vida de los paneles solares muestran que, en pocos años de funcionamiento, compensan la energía y las emisiones de su fabricación.',
      ]),
      mult('¿Qué señales de alerta tiene el mensaje? Marcá todas.', [ // e1
        '+Pide compartir con urgencia "antes de que lo borren"',
        '+Cita un "ingeniero reconocido" sin nombre',
        '+Dice que "los medios lo ocultan"',
        '+No tiene enlaces ni fecha',
        '-Cita un estudio con autores identificables',
      ], 'Urgencia, experto anónimo, conspiración y falta de fuentes: cuatro alertas en un solo mensaje.', { d: 2 }),
      par('Uní cada parte del mensaje con la técnica que usa.', [ // e2
        ['"Un ingeniero reconocido demostró"', 'Falso experto'],
        ['"Los medios lo ocultan"', 'Teoría conspirativa'],
        ['"Universidad Internacional de Energía"', 'Contenido impostor'],
        ['"Compartilo antes de que lo borren"', 'Urgencia emocional'],
      ], 'Reconocer las técnicas permite responder aunque no seas especialista en energía.', { d: 3 }),
      ord('Ordená los pasos de verificación que conviene seguir.', [ // e3
        'Frenar y no reenviar todavía',
        'Buscar quién está detrás de la "universidad"',
        'Buscar qué dicen las revisiones de estudios sobre paneles',
        'Consultar si un sitio de verificación ya lo analizó',
      ], 'Frenar, averiguar la fuente, mirar la evidencia de conjunto y apoyarse en verificadores.', { d: 2 }),
      op('La "universidad" es un sitio creado hace dos meses, sin autores. ¿Qué conclusión es más razonable?', [ // e4
        'No es una fuente confiable para ese dato',
        'Es confiable, porque tiene la palabra "universidad"',
        ['Es falso todo lo que dice sobre cualquier tema', 'No hace falta ir tan lejos: basta con no usarla como prueba.'],
        'Hay que esperar a que la borren para saberlo',
      ], 'Sin autores, sin historia y sin evidencia verificable, no puede sostener una afirmación que contradice muchas revisiones.', { d: 2 }),
      num('Si un panel tarda 2 años en compensar las emisiones de su fabricación y funciona 25 años, ¿cuántos años funciona "en positivo"?', 23, 'años', '25 − 2 = 23 años. Durante la mayor parte de su vida útil, el panel genera energía sin las emisiones de su fabricación ya compensadas. El valor de 2 años es aproximado y varía según el lugar.', { ctx: '2 años para compensar; vida útil de 25 años.', d: 1 }),
      ord('Ordená tu respuesta al grupo con la estructura del sándwich de la verdad.', [ // e6
        'Las revisiones muestran que los paneles compensan su fabricación en pocos años',
        'Circula un mensaje que dice lo contrario',
        'Usa un experto sin nombre y una "universidad" sin autores',
        'Los paneles solares reducen emisiones a lo largo de su vida útil',
      ], 'El dato correcto abre y cierra la respuesta. El mito aparece breve, en el medio, con la explicación de por qué engaña.', { d: 3 }),
      det('Revisá la respuesta que escribió un compañero y marcá lo que conviene cambiar.', [ // e7
        ['Los paneles compensan su fabricación en pocos años de uso.', false],
        ['El que compartió esto es un burro.', true, 'El insulto cierra la conversación y no convence a nadie.'],
        ['La "universidad" no tiene autores ni historia verificable.', false],
        ['¡¡¡LOS PANELES CONTAMINAN MÁS!!! dice el mensaje, y es mentira.', true, 'Repite el mito en grande; conviene mencionarlo breve.'],
      ], 'Una respuesta efectiva es respetuosa, breve y deja el dato correcto como lo más visible.', { d: 3 }),
    ]),
  ],
});
