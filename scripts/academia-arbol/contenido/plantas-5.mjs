import { unidad, leccion, practica, desafio, teoria, ejemplo, op, mult, vf, ord, rank, cad, clas, par, comp, num, numv, est, det, barras, tabla } from '../dsl.mjs';

// PLANTAS 5 — Bosques nativos.
// Los grandes bosques de Argentina y lo que hacen, la Ley de Bosques en
// profundidad (ordenamiento, fondo y resultados), el fuego y cómo se
// previene, y el uso sostenible del bosque. Retoma las ecorregiones y las
// nativas (plantas-2), el desmonte y la fragmentación (animales-4) y las
// cadenas libres de desmonte (alimentacion-5).

export default unidad({
  slug: 'plantas-5',
  rama: 'plantas',
  orden: 5,
  nivel: 3,
  requiereTronco: 3,
  titulo: 'Bosques nativos',
  bajada: 'Selva misionera, yungas, monte chaqueño, espinal y bosque andino: lo que hacen los bosques, cómo los protege la ley, por qué se queman y cómo usarlos sin destruirlos.',
  objetivos: [
    'Reconocer las grandes regiones forestales de Argentina y sus rasgos',
    'Explicar los servicios que brindan los bosques nativos',
    'Analizar el ordenamiento territorial, el fondo y los resultados de la Ley de Bosques',
    'Explicar las causas de los incendios forestales y las herramientas para prevenirlos',
    'Distinguir el uso sostenible del bosque del desmonte encubierto',
  ],
  repasa: ['plantas-2', 'animales-4', 'alimentacion-5', 'aire-suelo-2'],
  fuentes: ['ley-bosques-26331', 'chequeado-fondo-bosques', 'farn-bosques-fondo', 'global-forest-watch', 'snmf-origen', 'chequeado-incendios', 'ley-27604-fuego', 'nasa-firms', 'parques-nacionales'],
  lecciones: [
    // ─────────────────────────────────────────────────────────────── S1
    leccion('Los bosques de Argentina', 'Seis grandes regiones forestales, muy distintas entre sí, y lo que las hace únicas.', [
      teoria('Seis regiones', [
        'Argentina tiene bosques muy distintos. La selva paranaense, en Misiones, es parte del Bosque Atlántico, uno de los más biodiversos del planeta. Las yungas, en las laderas del noroeste, son selvas de montaña con nubes y lluvias abundantes. El parque chaqueño es la región forestal más extensa del país, con quebrachos, algarrobos y palos santos. El espinal forma un arco de algarrobos, caldenes y ñandubays alrededor de la llanura pampeana. El monte es un arbustal de zonas secas del oeste. Y el bosque andino patagónico tiene lengas, coihues, cipreses y alerces a lo largo de la cordillera.',
      ]),
      par('Uní cada región forestal con un árbol característico.', [ // e1
        ['Parque chaqueño', 'Quebracho colorado'],
        ['Bosque andino patagónico', 'Lenga'],
        ['Espinal', 'Caldén'],
        ['Yungas', 'Cedro salteño'],
        ['Selva paranaense', 'Palo rosa'],
      ], 'Cada región tiene especies propias: por eso perder una región es perder algo irreemplazable.', { d: 3 }),
      clas('¿En qué región forestal está cada rasgo?', { // e2
        'Selva paranaense': ['Parte del Bosque Atlántico, muy biodiverso', 'Selva subtropical de Misiones'],
        'Yungas': ['Selva de montaña con nubes', 'Laderas del noroeste'],
        'Bosque andino patagónico': ['Bosques de lenga y coihue', 'Alerces milenarios'],
      }, 'Cada bosque responde a su clima y su relieve.', { d: 2 }),
      teoria('El más extenso y el más amenazado', [
        'El parque chaqueño, que se extiende por Santiago del Estero, Chaco, Formosa, Salta y otras provincias, es la región forestal más extensa de Argentina. También es la que más bosque perdió en las últimas décadas: la mayor parte del desmonte del país ocurrió allí, para ampliar la agricultura y la ganadería. En su interior viven comunidades indígenas y criollas que dependen del bosque para vivir.',
      ]),
      op('¿Qué región forestal de Argentina perdió más bosque en las últimas décadas?', [ // e3
        'El parque chaqueño',
        'El bosque andino patagónico',
        ['La selva paranaense, porque es la más extensa', 'La más extensa es la chaqueña, y es la que más perdió.'],
        'El monte de las zonas secas',
      ], 'La expansión agropecuaria concentró el desmonte en el Chaco.', { d: 1 }),
      teoria('Árboles que viven siglos', [
        'Algunos árboles argentinos viven muchísimo. Los alerces de la cordillera patagónica pueden superar los 2.000 años: el Parque Nacional Los Alerces protege algunos de los más antiguos. Un quebracho colorado puede tardar más de un siglo en alcanzar un tronco grande. Por eso, un bosque maduro no se reemplaza plantando árboles: su estructura, su suelo y sus especies llevan siglos en formarse.',
      ]),
      vf('Un bosque nativo maduro se puede reemplazar en pocos años plantando árboles nuevos.', false, 'Un bosque maduro tiene árboles de siglos, un suelo desarrollado y una red de especies que no se reconstruye en pocos años. Plantar ayuda, pero no reemplaza lo perdido.', { // e4
        razones: ['+Porque su estructura y su red de especies llevan siglos', '-Porque los bosques no tienen árboles viejos', '-Porque plantar árboles no sirve para nada'],
        d: 2,
      }),
      numv(3, (i) => { // e5
        const [edad, vida] = [[2600, 80], [1500, 75], [800, 80]][i];
        return {
          enunciado: `Un alerce tiene ${edad.toLocaleString('es-AR')} años. ¿Cuántas veces más vivió que una persona de ${vida} años? Redondeá a un decimal.`,
          valor: Math.round((edad / vida) * 10) / 10,
          unidad: 'veces',
          dec: 1,
          tol: 0.1,
          explicacion: `${edad.toLocaleString('es-AR')} ÷ ${vida} ≈ ${(Math.round((edad / vida) * 10) / 10).toLocaleString('es-AR')} vidas humanas. Un árbol así no se reemplaza plantando otro.`,
          ctx: `Alerce de ${edad} años; persona de ${vida} años.`,
        };
      }, { d: 1 }),
      ord('Ordená estos bosques de norte a sur.', [ // e6
        'Yungas de Jujuy',
        'Espinal del norte de Córdoba',
        'Caldenal de La Pampa',
        'Bosque andino de Tierra del Fuego',
      ], 'De las selvas de montaña de la frontera norte a los bosques fríos del extremo sur.', { d: 2, extremos: ['Más al norte', 'Más al sur'] }),
      mult('¿Qué árboles son nativos de Argentina? Marcá todos.', [ // e7
        '+Quebracho colorado',
        '+Algarrobo',
        '+Lenga',
        '+Palo borracho',
        '-Eucalipto',
      ], 'El eucalipto es originario de Australia: se planta mucho, pero no es nativo.', { d: 1 }),
      est('Estimá cuántos años pueden superar algunos alerces de la cordillera patagónica.', 2000, { min: 50, max: 100000, unidad: 'años', escala: 'log' }, 'Más de 2.000 años: están entre los seres vivos más longevos del planeta.', { d: 2 }),
      vf('El palo rosa es un árbol de la selva paranaense.', true, 'Es uno de los grandes árboles de la selva misionera, muy explotado por su madera y hoy protegido.', { // e7c
        razones: ['+Porque es un árbol característico de la selva misionera', '-Porque crece solo en la estepa patagónica', '-Porque es una especie exótica de Australia'],
        d: 1,
      }),
      det('Leé esta nota y marcá lo equivocado.', [ // e8
        ['La selva paranaense es parte del Bosque Atlántico.', false],
        ['El parque chaqueño es la región forestal más chica del país.', true, 'Es la más extensa, y también la que más bosque perdió.'],
        ['Algunos alerces patagónicos superan los 2.000 años.', false],
        ['Las yungas son bosques de la estepa patagónica.', true, 'Son selvas de montaña del noroeste.'],
      ], 'Conocer los bosques del país es el primer paso para defenderlos.', { d: 2 }),
      comp('Completá.', 'La región forestal más extensa del país es el parque [chaqueño]; las selvas de montaña del noroeste son las [yungas]; y el árbol más longevo de la cordillera es el [alerce].', ['pampeano', 'marismas', 'eucalipto'], 'Tres datos clave de los bosques argentinos.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S2
    leccion('Lo que hacen los bosques', 'Agua, suelo, clima, biodiversidad, alimentos y culturas: los servicios de los bosques nativos.', [
      teoria('Servicios ecosistémicos', [
        'Los bosques nativos prestan servicios de los que dependen muchas personas, aunque no siempre se vean. Regulan el agua: las yungas, por ejemplo, retienen las lluvias en sus laderas y alimentan ríos que abastecen ciudades y riegos del noroeste. Protegen el suelo de la erosión. Guardan carbono en sus troncos, raíces y suelos. Albergan gran parte de la biodiversidad del país. Y dan alimentos, medicinas, leña, madera y materiales a comunidades que viven en ellos o cerca.',
      ]),
      clas('¿Qué tipo de servicio es cada uno?', { // e1
        'Regulación': ['Retener lluvias y alimentar ríos', 'Proteger el suelo de la erosión', 'Guardar carbono'],
        'Provisión': ['Miel del monte', 'Harina de algarroba', 'Madera con manejo sostenible'],
        'Cultural': ['Lugares sagrados de comunidades indígenas', 'Paisajes para el turismo de naturaleza'],
      }, 'Los servicios de regulación suelen ser los más invisibles y los más valiosos.', { d: 2 }),
      cad('Armá la cadena de cómo un bosque de montaña regula el agua.', [ // e2
        'Llueve sobre las laderas con bosque',
        'Las hojas, el mantillo y las raíces frenan el agua',
        'El agua se infiltra en el suelo',
        'Se libera de a poco hacia los arroyos',
        'Los ríos tienen agua más pareja y menos crecidas violentas',
      ], ['El bosque hace que el agua corra más rápido ladera abajo'], 'Sin bosque, la lluvia corre de golpe: más crecidas en lluvias y menos agua en la seca.', { d: 2 }),
      op('¿Qué puede pasar aguas abajo si se desmonta una ladera de yungas?', [ // e3
        'Más crecidas violentas y más arrastre de sedimentos',
        'Más agua limpia y pareja todo el año',
        ['Nada, porque el bosque no tiene relación con el agua', 'El bosque retiene y regula el agua de lluvia.'],
        'Menos lluvias en toda la región',
      ], 'La pérdida de bosque en las cuencas altas puede aumentar el riesgo de aluviones y erosión.', { d: 2 }),
      teoria('Comunidades del bosque', [
        'En los bosques argentinos viven comunidades indígenas y criollas cuyo modo de vida depende del monte: recolectan frutos como la algarroba y el chañar, miel, fibras, plantas medicinales; crían animales; pescan y cazan. Para ellas el bosque no es solo un recurso: es territorio, cultura y memoria. Por eso los desmontes suelen generar conflictos con estas comunidades, que muchas veces no fueron consultadas.',
      ]),
      mult('¿Qué obtienen del monte chaqueño muchas comunidades que viven en él? Marcá todo.', [ // e4
        '+Frutos como la algarroba y el chañar',
        '+Miel silvestre',
        '+Fibras y plantas medicinales',
        '+Leña y materiales para construir',
        '-Nada, porque el monte no tiene recursos',
      ], 'El bosque en pie sostiene economías y culturas enteras.', { d: 1 }),
      numv(3, (i) => { // e5
        const [ha, tc] = [[1000, 100], [5000, 80], [200, 150]][i];
        return {
          enunciado: `Si un bosque guarda en promedio ${tc} toneladas de carbono por hectárea entre troncos, raíces y suelo, ¿cuántas toneladas de carbono guardan ${ha.toLocaleString('es-AR')} hectáreas?`,
          valor: ha * tc,
          unidad: 'toneladas de carbono',
          explicacion: `${ha.toLocaleString('es-AR')} × ${tc} = ${(ha * tc).toLocaleString('es-AR')} toneladas de carbono. Si se desmonta y se quema, gran parte se libera como CO₂. Valores de ejemplo.`,
          ctx: `${ha} ha; ${tc} t de carbono por hectárea.`,
        };
      }, { d: 1 }),
      numv(3, (i) => { // e6
        const tc = [100, 80, 150][i];
        return {
          enunciado: `Cada tonelada de carbono equivale a unas 3,67 toneladas de CO₂. ¿Cuántas toneladas de CO₂ equivalen a ${tc} toneladas de carbono? Redondeá al entero.`,
          valor: Math.round(tc * 3.67),
          unidad: 't de CO₂',
          tol: 1,
          explicacion: `${tc} × 3,67 ≈ ${Math.round(tc * 3.67)} t de CO₂. El oxígeno que se une al carbono al quemarse agrega peso: lo viste con la nafta.`,
          ctx: `${tc} t de carbono; factor 3,67.`,
        };
      }, { d: 2 }),
      op('¿Quién se beneficia del carbono que guarda un bosque del Chaco?', [ // e6b
        'Todo el planeta, porque el clima es uno solo',
        'Solo el dueño del campo donde está el bosque',
        ['Nadie, porque el carbono no tiene efectos', 'El carbono liberado calienta el clima de todos.'],
        'Solo las ciudades más cercanas al bosque',
      ], 'Algunos servicios del bosque son locales; el del carbono es global.', { d: 1 }),
      par('Uní cada servicio con quién se beneficia.', [ // e7
        ['Regulación del agua de las yungas', 'Ciudades y riegos del noroeste'],
        ['Carbono guardado', 'Todo el planeta'],
        ['Frutos del monte', 'Comunidades que viven en el bosque'],
        ['Hábitat del yaguareté', 'La biodiversidad del país'],
      ], 'Los beneficios del bosque llegan a escalas muy distintas: del hogar al planeta.', { d: 2 }),
      vf('Un bosque solo tiene valor cuando se lo tala y se vende su madera.', false, 'El bosque en pie regula el agua, protege el suelo, guarda carbono, sostiene la biodiversidad y a comunidades enteras. Muchos de esos valores se pierden al talarlo.', { // e8
        razones: ['+Porque en pie presta muchos servicios que se pierden al talarlo', '-Porque la madera no tiene ningún valor', '-Porque los bosques no prestan servicios'],
        d: 1,
      }),
      det('Leé este comentario y marcá lo equivocado.', [ // e9
        ['Las yungas ayudan a regular el agua de los ríos del noroeste.', false],
        ['Desmontar una ladera reduce las crecidas.', true, 'Suele aumentarlas: el agua corre más rápido y arrastra suelo.'],
        ['Muchas comunidades obtienen alimentos y medicinas del monte.', false],
        ['El carbono de un bosque está solo en las hojas.', true, 'Está en troncos, raíces y, en gran parte, en el suelo.'],
      ], 'El bosque trabaja para nosotros de muchas maneras invisibles.', { d: 2 }),
      comp('Completá.', 'Los beneficios que da la naturaleza se llaman servicios [ecosistémicos]; el bosque de montaña frena el agua y reduce las [crecidas]; y la harina de [algarroba] es un alimento del monte.', ['publicitarios', 'sequías', 'soja'], 'Tres ideas sobre lo que hacen los bosques nativos.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S3
    leccion('La Ley de Bosques en profundidad', 'Ordenamiento participativo, compensaciones, un fondo que nunca llegó completo y lo que cambió desde 2007.', [
      teoria('El ordenamiento', [
        'La Ley 26.331, de 2007, obligó a cada provincia a hacer su Ordenamiento Territorial de Bosques Nativos, con participación de la sociedad, y a clasificar sus bosques en tres categorías. Rojo: muy alto valor de conservación, no se transforma. Amarillo: valor medio, se permite un uso sostenible, pero no el desmonte. Verde: bajo valor, puede transformarse con evaluación de impacto ambiental y audiencia pública. En la mayoría de las provincias, la mayor parte del bosque quedó en categoría amarilla. Los ordenamientos deben actualizarse periódicamente.',
      ]),
      clas('¿Qué se permite en cada categoría del ordenamiento?', { // e1
        'Roja': ['Investigación científica', 'Conservación estricta'],
        'Amarilla': ['Aprovechamiento sostenible de madera', 'Turismo y recolección de frutos', 'Ganadería integrada al bosque'],
        'Verde': ['Desmonte con evaluación de impacto y audiencia pública'],
      }, 'La ley no prohíbe todo: ordena qué se puede hacer y dónde.', { d: 2 }),
      teoria('El fondo', [
        'La ley creó el Fondo Nacional para el Enriquecimiento y la Conservación de los Bosques Nativos, para compensar a quienes conservan bosques y fortalecer los controles provinciales. Según la ley, debe recibir al menos el 0,3 % del presupuesto nacional, más el 2 % de las retenciones a las exportaciones agropecuarias y forestales. Pero, según análisis de Chequeado y de organizaciones como FARN, ningún gobierno cumplió ese monto desde 2007: en los últimos presupuestos se asignó apenas alrededor del 3 al 4 % de lo que manda la ley.',
      ], { destacado: { valor: '≈ 3 %', texto: 'de lo que establece la ley recibió el fondo de bosques en presupuestos recientes, según Chequeado y FARN.' } }),
      numv(3, (i) => { // e2
        const [debe, recibe] = [[600, 18], [500, 20], [800, 28]][i];
        return {
          enunciado: `Si por ley el fondo de bosques debería recibir ${debe} mil millones de pesos y recibe ${recibe} mil millones, ¿qué porcentaje de lo establecido recibe? Redondeá al entero.`,
          valor: Math.round((recibe / debe) * 100),
          unidad: '%',
          tol: 1,
          explicacion: `${recibe} ÷ ${debe} × 100 ≈ ${Math.round((recibe / debe) * 100)} %. Con tan poco, las compensaciones a quienes conservan y los controles se debilitan. Valores de ejemplo, del orden de los presupuestos recientes.`,
          ctx: `${recibe} de ${debe} mil millones.`,
        };
      }, { d: 1 }),
      cad('Armá la cadena de por qué el desfinanciamiento debilita la ley.', [ // e3
        'El fondo recibe mucho menos de lo que manda la ley',
        'Las compensaciones a quienes conservan son muy bajas',
        'Conservar deja de ser atractivo frente a desmontar',
        'Las provincias tienen menos recursos para controlar',
        'Crece el riesgo de desmontes, incluso ilegales',
      ], ['Con menos fondos, los controles mejoran'], 'Una ley sin presupuesto pierde gran parte de su fuerza.', { d: 2 }),
      teoria('Lo que cambió', [
        'Después de la sanción de la ley, el ritmo de desmonte bajó respecto de los años previos, pero no se detuvo. Una parte de la pérdida siguió ocurriendo en zonas rojas y amarillas, donde el desmonte está prohibido, y los incendios también causaron pérdidas. El monitoreo satelital permite detectar esos desmontes casi en tiempo real; el desafío es que los controles y las sanciones funcionen.',
      ]),
      vf('Desde que existe la Ley de Bosques, no hubo más desmontes en zonas rojas o amarillas.', false, 'Siguieron ocurriendo desmontes, algunos ilegales, en zonas donde la ley los prohíbe. El monitoreo satelital los detecta; el problema es el control y la sanción.', { // e4
        razones: ['+Porque hubo desmontes ilegales en zonas prohibidas', '-Porque la ley permite desmontar en rojo', '-Porque los satélites no pueden ver bosques'],
        d: 2,
      }),
      op('¿Qué herramienta permite detectar un desmonte casi en tiempo real?', [ // e5
        'El monitoreo con imágenes satelitales',
        'Una encuesta anual a los productores',
        ['El censo nacional de población', 'No mide bosques.'],
        'Las declaraciones juradas de los propietarios',
      ], 'Lo viste en la rama digital: los satélites cambiaron la forma de vigilar los bosques.', { d: 1 }),
      teoria('Participación y actualización', [
        'Los ordenamientos deben hacerse con participación de comunidades, productores, científicos y organizaciones, y actualizarse cada cierto tiempo. En esas actualizaciones hay tensiones: algunos sectores piden pasar zonas de amarillo a verde para poder desmontar. La ley establece el principio de no regresión: las actualizaciones no deberían disminuir la protección sin fundamentos sólidos.',
      ]),
      op('Una provincia propone pasar muchas zonas de amarillo a verde en su actualización. ¿Qué principio ambiental entra en juego?', [ // e6
        'El de no regresión en la protección',
        'El de libre comercio internacional',
        ['El de propiedad intelectual', 'No tiene relación con los bosques.'],
        'El de prioridad del turismo',
      ], 'Bajar la protección sin fundamentos contradice el objetivo de la ley.', { d: 3 }),
      rank('Ordená las categorías de la Ley de Bosques de mayor a menor protección.', [ // e6b
        ['Roja', 'no se transforma'],
        ['Amarilla', 'uso sostenible, sin desmonte'],
        ['Verde', 'puede transformarse con evaluación'],
      ], 'Del bosque intocable al que puede cambiar de uso con controles.', { d: 1, extremos: ['Más protección', 'Menos protección'] }),
      par('Uní cada elemento de la ley con su función.', [ // e7
        ['Ordenamiento territorial', 'Clasificar los bosques en tres categorías'],
        ['Fondo Nacional', 'Compensar a quienes conservan y fortalecer controles'],
        ['Audiencia pública', 'Escuchar a la sociedad antes de un desmonte en zona verde'],
        ['Monitoreo satelital', 'Detectar desmontes'],
      ], 'Cada herramienta cumple un papel; si una falla, la ley se debilita.', { d: 2 }),
      mult('¿Qué haría más efectiva la Ley de Bosques? Marcá todo.', [ // e8
        '+Financiar el fondo como manda la ley',
        '+Sancionar los desmontes ilegales detectados',
        '+Actualizar los ordenamientos con participación real',
        '+Apoyar el uso sostenible del bosque en zona amarilla',
        '-Pasar todo el bosque a categoría verde',
      ], 'Presupuesto, control, participación y alternativas productivas: la ley necesita todo eso.', { d: 2 }),
      det('Leé este resumen y marcá lo equivocado.', [ // e9
        ['La Ley 26.331 es de 2007.', false],
        ['El fondo de bosques recibió siempre el 100 % de lo que manda la ley.', true, 'Ningún gobierno cumplió: en presupuestos recientes, alrededor del 3 %.'],
        ['En zona verde se puede desmontar con evaluación de impacto y audiencia pública.', false],
        ['Las actualizaciones pueden bajar la protección sin ninguna justificación.', true, 'Rige el principio de no regresión.'],
      ], 'La ley es una herramienta poderosa, con deudas pendientes en su aplicación.', { d: 2 }),
      comp('Completá.', 'La Ley de Bosques ordena los bosques en rojo, amarillo y [verde]; su fondo debería recibir al menos el [0,3] % del presupuesto nacional; y bajar la protección sin fundamentos contradice el principio de no [regresión].', ['azul', '30', 'retorno'], 'Tres claves de la Ley de Bosques en profundidad.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S4
    leccion('Fuego en el bosque', 'Por qué se queman los bosques, qué dice la ley sobre las tierras incendiadas y cómo se previene.', [
      teoria('El origen del fuego', [
        'Según el Servicio Nacional de Manejo del Fuego, alrededor del 95 % de los incendios forestales y rurales en Argentina son causados por las personas: fogatas mal apagadas, quemas de basura o de pastizales que se descontrolan, colillas, chispas de máquinas o incendios intencionales. Las condiciones climáticas —sequía, calor y viento— determinan cuánto se propaga un incendio, y con el calentamiento esas condiciones se vuelven más frecuentes.',
      ], { destacado: { valor: '≈ 95 %', texto: 'de los incendios forestales y rurales en Argentina son de origen humano, según el Servicio Nacional de Manejo del Fuego.' } }),
      clas('¿El factor influye en que el fuego empiece o en cuánto se propaga?', { // e1
        'En que empiece': ['Una fogata mal apagada', 'Una quema de pastizales', 'Una colilla tirada al costado de la ruta'],
        'En cuánto se propaga': ['Una sequía prolongada', 'Viento fuerte', 'Temperaturas muy altas'],
      }, 'Casi siempre alguien enciende el fuego; el clima decide cuán grande se vuelve.', { d: 2 }),
      est('Estimá qué porcentaje de los incendios forestales y rurales en Argentina tiene origen humano.', 95, { min: 0, max: 100, paso: 5, unidad: '%' }, 'Alrededor del 95 %. Por eso la prevención es tan eficaz: la mayoría de los incendios podría evitarse.', { d: 1 }),
      cad('Armá la cadena de cómo el calentamiento agrava los incendios.', [ // e3
        'Suben las temperaturas y se alargan las sequías',
        'La vegetación se seca más',
        'Hay más combustible seco disponible',
        'Un fuego iniciado se propaga más rápido',
        'Los incendios son más grandes y difíciles de controlar',
      ], ['El calor humedece la vegetación'], 'El clima no enciende el fuego, pero multiplica su poder.', { d: 2 }),
      teoria('La ley después del fuego', [
        'Para evitar que los incendios se usen para cambiar el uso de la tierra, en 2020 la Ley 27.604 modificó la Ley de Manejo del Fuego. Estableció que en bosques nativos o implantados, áreas naturales protegidas y humedales afectados por incendios no se puede modificar el uso que tenían antes del fuego durante 60 años; y en zonas agrícolas, praderas, pastizales y áreas de interfase, durante 30 años.',
      ]),
      op('¿Qué busca prohibir la Ley 27.604 en las tierras incendiadas?', [ // e4
        'Cambiar el uso que tenían antes del incendio',
        'Volver a plantar árboles nativos',
        ['Que los bomberos entren a apagar el fuego', 'Al contrario: busca proteger las tierras, no impedir apagar el fuego.'],
        'Que se estudie la biodiversidad del lugar',
      ], 'Si quemar no permite cambiar el uso, desaparece el incentivo a provocar incendios para lotear o desmontar.', { d: 2 }),
      clas('¿Qué plazo fija la ley para cada tipo de tierra incendiada?', { // e5
        '60 años': ['Bosque nativo', 'Humedal', 'Área natural protegida'],
        '30 años': ['Pastizal', 'Zona agrícola', 'Área de interfase'],
      }, 'Los plazos largos buscan que la tierra quemada pueda restaurarse, y quitan el incentivo a quemar.', { d: 2 }),
      numv(3, (i) => { // e6
        const anio = [2021, 2025, 2023][i];
        return {
          enunciado: `Si un bosque nativo se incendió en ${anio}, ¿hasta qué año no se podría cambiar su uso, según el plazo de 60 años?`,
          valor: anio + 60,
          unidad: 'año',
          explicacion: `${anio} + 60 = ${anio + 60}. Un plazo tan largo le quita todo sentido económico a quemar un bosque para cambiarle el uso.`,
          ctx: `Incendio en ${anio}; plazo de 60 años.`,
        };
      }, { d: 1 }),
      teoria('Prevenir', [
        'La prevención combina educación (no hacer fuego en días de riesgo, apagar bien las fogatas), manejo del combustible (cortafuegos, limpieza de la vegetación seca cerca de las casas), alerta temprana con índices de peligro y detección satelital de focos, brigadas preparadas y control de las quemas. En las zonas de interfase, donde las casas están mezcladas con el bosque, preparar las viviendas y sus alrededores salva vidas.',
      ]),
      op('¿Qué conviene hacer con una fogata antes de irse de un camping?', [ // e6b
        'Apagarla con agua y tierra hasta que no quede calor',
        'Dejarla con poca leña para que se apague sola',
        ['Taparla solo con hojas secas', 'Las hojas secas son combustible: pueden reavivarla.'],
        'Dejarla encendida si no hay viento',
      ], 'Muchas fogatas "apagadas" conservan brasas que se reavivan horas después.', { d: 1 }),
      mult('¿Qué medidas previenen incendios forestales o reducen su daño? Marcá todas.', [ // e7
        '+No hacer fuego en días de alto riesgo',
        '+Cortafuegos y limpieza de vegetación seca cerca de las casas',
        '+Detección satelital de focos',
        '+Brigadas capacitadas y equipadas',
        '-Quemar pastizales en días de viento',
      ], 'La mayor parte de los incendios se puede evitar; el resto se puede limitar con preparación.', { d: 1 }),
      rank('Ordená estas acciones frente al fuego según su momento, de la más anticipada a la más tardía.', [ // e8
        ['Educar y controlar las quemas antes de la temporada', 'prevención'],
        ['Detectar un foco con satélites', 'detección'],
        ['Enviar brigadas al incendio', 'combate'],
        ['Restaurar el bosque quemado', 'recuperación'],
      ], 'Cada etapa importa, pero la prevención es la más barata y efectiva.', { d: 1, extremos: ['Más anticipada', 'Más tardía'] }),
      det('Leé este volante de temporada de incendios y marcá lo equivocado.', [ // e9
        ['La mayoría de los incendios forestales los provocan personas.', false],
        ['Una fogata se apaga sola si se deja de alimentar.', true, 'Hay que apagarla con agua y tierra hasta que no quede calor.'],
        ['En días de viento y calor, no hay que hacer fuego al aire libre.', false],
        ['Después de un incendio, el bosque se puede lotear al año siguiente.', true, 'La ley prohíbe cambiar su uso durante 60 años.'],
      ], 'Prevenir incendios es una responsabilidad de cada persona y de todo el sistema.', { d: 2 }),
      comp('Completá.', 'Alrededor del [95] % de los incendios forestales tiene origen humano; en un bosque nativo quemado no se puede cambiar el uso durante [60] años; y las zonas donde las casas se mezclan con el bosque se llaman de [interfase].', ['5', '6', 'reserva'], 'Tres claves sobre el fuego en los bosques.', { d: 1 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S5
    leccion('Usar el bosque sin destruirlo', 'Manejo forestal sostenible, productos no madereros, turismo y el riesgo del desmonte disfrazado.', [
      teoria('Manejo forestal sostenible', [
        'Usar el bosque sin destruirlo es posible. El manejo forestal sostenible saca madera sin superar lo que el bosque puede reponer: se extraen algunos árboles seleccionados, se dejan los árboles semilleros y los renovales, se respetan los tiempos de recuperación, se protegen arroyos y especies amenazadas, y se planifica a largo plazo. Existen certificaciones independientes, como la del Consejo de Administración Forestal (FSC), que verifican ese manejo.',
      ]),
      clas('¿Esta práctica corresponde a un manejo sostenible o a una sobreexplotación?', { // e1
        'Manejo sostenible': ['Extraer solo algunos árboles seleccionados', 'Dejar los árboles semilleros', 'Respetar los tiempos de recuperación'],
        'Sobreexplotación': ['Talar todos los árboles grandes a la vez', 'Sacar madera cada año del mismo lote', 'Talar junto a los arroyos'],
      }, 'Lo que se saca no puede superar lo que el bosque repone.', { d: 1 }),
      numv(3, (i) => { // e2
        const [ha, crec] = [[1000, 2], [500, 1.5], [2000, 1]][i];
        return {
          enunciado: `Si un bosque de ${ha.toLocaleString('es-AR')} hectáreas crece ${crec.toLocaleString('es-AR')} m³ de madera por hectárea por año, ¿cuántos m³ por año se podrían extraer como máximo sin achicar el bosque?`,
          valor: ha * crec,
          unidad: 'm³ por año',
          explicacion: `${ha.toLocaleString('es-AR')} × ${crec.toLocaleString('es-AR')} = ${(ha * crec).toLocaleString('es-AR')} m³ por año. Extraer más que el crecimiento empobrece el bosque. Lo viste con los recursos renovables en el tronco.`,
          ctx: `${ha} ha; crecimiento de ${crec} m³ por hectárea por año.`,
        };
      }, { d: 1 }),
      teoria('Más allá de la madera', [
        'Los productos forestales no madereros —miel, frutos como la algarroba o el chañar, hongos, resinas, fibras, plantas medicinales, semillas— pueden generar ingresos sin talar árboles. El turismo de naturaleza y el avistaje de aves también dan valor al bosque en pie. Cuando el bosque vivo genera ingresos para quienes lo cuidan, conservarlo se vuelve una opción económica, no solo un deber.',
      ]),
      mult('¿Qué productos o actividades dan valor al bosque en pie? Marcá todos.', [ // e3
        '+Miel del monte',
        '+Harina de algarroba',
        '+Turismo de avistaje de aves',
        '+Semillas nativas para restauración',
        '-Carbón vegetal de desmontes totales',
      ], 'El bosque en pie puede ser una fuente de trabajo y de ingresos.', { d: 1 }),
      cad('Armá la cadena de cómo los ingresos del bosque en pie ayudan a conservarlo.', [ // e4
        'Una comunidad vende miel y harina de algarroba del monte',
        'Obtiene ingresos del bosque vivo',
        'El bosque vale más en pie que desmontado',
        'La comunidad lo cuida y denuncia los desmontes',
        'El bosque se conserva',
      ], ['Los ingresos del monte obligan a desmontarlo'], 'Conservar es más fácil cuando conservar paga.', { d: 1 }),
      teoria('El desmonte disfrazado', [
        'En zona amarilla se permite el uso sostenible, pero a veces se presentan como "manejo" prácticas que en la realidad eliminan el bosque: se rola todo el sotobosque, se sacan casi todos los árboles y se dejan pocos aislados para siembra de pasturas. Lo viste con la ganadería en el bosque. Para distinguirlo hay que mirar la estructura que queda: si el bosque puede seguir regenerándose o se convirtió en un pastizal con árboles sueltos.',
      ]),
      op('¿Cómo se distingue un manejo sostenible de un desmonte disfrazado?', [ // e5
        'Mirando si queda un bosque que puede regenerarse',
        'Leyendo el nombre que tiene el proyecto',
        ['Contando cuántas vacas entraron', 'Importa, pero lo decisivo es la estructura del bosque que queda.'],
        'Mirando el color de los carteles del campo',
      ], 'Los nombres pueden engañar; la estructura del bosque, no.', { d: 2 }),
      vf('Si un proyecto se llama "manejo sostenible", seguro conserva el bosque.', false, 'Hay que verificar en el terreno y con imágenes satelitales qué estructura queda. Algunos proyectos con ese nombre funcionaron como desmontes disfrazados.', { // e6
        razones: ['+Porque hay que verificar qué bosque queda en el terreno', '-Porque ningún manejo es sostenible', '-Porque el nombre obliga a conservar'],
        d: 2,
      }),
      par('Uní cada herramienta con lo que verifica.', [ // e7
        ['Certificación FSC', 'Que el manejo forestal sea responsable'],
        ['Imágenes satelitales', 'Cuánta cobertura de bosque queda'],
        ['Inventario forestal', 'Qué árboles y cuántos hay'],
        ['Plan de manejo aprobado', 'Qué se puede extraer y cuándo'],
      ], 'Verificar el manejo protege al bosque y a quienes lo hacen bien.', { d: 2 }),
      vf('Un bosque que genera ingresos estando en pie tiene más chances de conservarse.', true, 'Cuando conservar da trabajo e ingresos a quienes viven del bosque, cuidarlo se vuelve una opción económica y no solo un deber.', { // e7b
        razones: ['+Porque conservar pasa a ser una opción económica', '-Porque los ingresos obligan a desmontar', '-Porque un bosque en pie nunca genera ingresos'],
        d: 1,
      }),
      rank('Ordená estos usos de un bosque en zona amarilla, del más compatible con la conservación al menos.', [ // e8
        ['Recolección de frutos y miel', 'muy compatible'],
        ['Aprovechamiento selectivo de madera con plan', 'compatible'],
        ['Ganadería integrada con carga moderada', 'compatible si se controla'],
        ['Rolado total del sotobosque para pasturas', 'incompatible'],
      ], 'Los usos que mantienen la estructura del bosque son los que permite la zona amarilla.', { d: 2, extremos: ['Más compatible', 'Menos compatible'] }),
      det('Leé este proyecto para una zona amarilla y marcá lo que no corresponde.', [ // e9
        ['Extraeremos solo árboles seleccionados según el plan de manejo.', false],
        ['Rolaremos todo el sotobosque y dejaremos diez árboles por hectárea.', true, 'Eso elimina el bosque: es un desmonte disfrazado.'],
        ['Venderemos miel y harina de algarroba.', false],
        ['Talaremos junto al arroyo porque los árboles son más grandes.', true, 'Las márgenes de arroyos deben protegerse.'],
      ], 'Un buen proyecto en zona amarilla produce y conserva a la vez.', { d: 2 }),
      comp('Completá.', 'Sacar madera sin superar lo que el bosque repone es un manejo [sostenible]; la miel y los frutos del monte son productos no [madereros]; y una certificación independiente de manejo forestal es la [FSC].', ['intensivo', 'comestibles', 'ISO'], 'Tres claves para usar el bosque sin destruirlo.', { d: 2 }),
    ]),

    // ─────────────────────────────────────────────────────────────── S6
    practica('Práctica: bosques nativos', 'Regiones forestales, servicios, Ley de Bosques, fuego y uso sostenible, mezclados.'),

    // ─────────────────────────────────────────────────────────────── S7
    desafio('Desafío: la actualización del ordenamiento', 'Una provincia chaqueña actualiza su Ordenamiento Territorial de Bosques Nativos. Evaluá las propuestas con los datos.', [
      teoria('La situación', [
        'La provincia tiene 4 millones de hectáreas de bosque nativo: 600.000 en rojo, 2.800.000 en amarillo y 600.000 en verde. En los últimos cinco años, el monitoreo satelital detectó 50.000 hectáreas desmontadas en zonas amarillas, donde está prohibido. Un grupo de productores propone pasar 500.000 hectáreas de amarillo a verde. Comunidades indígenas del norte de la provincia piden que sus territorios pasen a rojo. El fondo de bosques le transfiere a la provincia solo una fracción de lo que debería.',
      ]),
      num('¿Qué porcentaje del bosque de la provincia está en categoría amarilla?', 70, '%', '2.800.000 ÷ 4.000.000 × 100 = 70 %. Como en muchas provincias, la mayor parte del bosque quedó en amarillo.', { ctx: '2,8 millones de 4 millones de hectáreas.', d: 1 }),
      num('Si se aprobara el pase de 500.000 hectáreas de amarillo a verde, ¿cuántas hectáreas quedarían en verde?', 1100000, 'hectáreas', '600.000 + 500.000 = 1.100.000 hectáreas en verde, casi el doble: una fuerte baja de la protección.', { ctx: '600.000 ha en verde; se suman 500.000.', d: 1 }),
      op('¿Qué principio pone en cuestión la propuesta de pasar 500.000 hectáreas a verde?', [ // e3
        'El de no regresión en la protección ambiental',
        'El de libre tránsito entre provincias',
        ['El de la propiedad privada de la tierra', 'La ley regula el uso de la tierra, no quién es dueño.'],
        'El de igualdad ante los impuestos',
      ], 'Bajar la protección sin fundamentos sólidos va contra la lógica de la ley.', { d: 2 }),
      mult('¿Qué debería considerar la actualización? Marcá todo.', [ // e4
        '+Los desmontes ilegales detectados en zona amarilla',
        '+Los pedidos de las comunidades indígenas sobre sus territorios',
        '+La conectividad entre bosques para la fauna',
        '+Una audiencia pública con participación real',
        '-Solo la opinión del sector que quiere desmontar',
      ], 'Una actualización legítima mira datos, derechos y participación.', { d: 2 }),
      numv(3, (i) => { // e5
        const [ha, anos] = [[50000, 5], [50000, 5], [50000, 5]][i];
        return {
          enunciado: [
            `Si se desmontaron ilegalmente ${ha.toLocaleString('es-AR')} hectáreas en ${anos} años, ¿cuántas hectáreas por año fueron en promedio?`,
            `En ${anos} años se detectaron ${ha.toLocaleString('es-AR')} hectáreas desmontadas en zona amarilla. ¿Cuál es el promedio anual?`,
            `¿Cuántas hectáreas por año se desmontaron en promedio, si fueron ${ha.toLocaleString('es-AR')} en ${anos} años?`,
          ][i],
          valor: ha / anos,
          unidad: 'hectáreas por año',
          explicacion: `${ha.toLocaleString('es-AR')} ÷ ${anos} = ${(ha / anos).toLocaleString('es-AR')} hectáreas por año de desmonte ilegal: un dato que exige reforzar controles y sanciones.`,
          ctx: `${ha} ha desmontadas en ${anos} años.`,
        };
      }, { d: 1 }),
      vf('Como hubo desmontes ilegales en zona amarilla, lo lógico es pasar esas zonas a verde para "regularizarlos".', false, 'Eso premiaría la ilegalidad y bajaría la protección. Lo que corresponde es sancionar, exigir restauración y reforzar los controles.', { // e6
        razones: ['+Porque premiaría la ilegalidad en lugar de sancionarla', '-Porque en zona verde no se puede producir', '-Porque los desmontes ilegales no existen'],
        d: 2,
      }),
      det('La provincia redacta su propuesta. Marcá lo que conviene corregir.', [ // e7
        ['Haremos audiencias públicas en el norte y el sur de la provincia.', false],
        ['Pasaremos a verde las zonas desmontadas ilegalmente para regularizarlas.', true, 'Premia la ilegalidad: hay que sancionar y restaurar.'],
        ['Evaluaremos pasar a rojo los territorios que piden las comunidades indígenas.', false],
        ['No usaremos el monitoreo satelital porque es caro.', true, 'Es la herramienta clave para detectar desmontes, y hay datos públicos.'],
      ], 'Una actualización del ordenamiento es una decisión de largo plazo: tiene que basarse en datos, derechos y participación.', { d: 3 }),
    ]),
  ],
});
