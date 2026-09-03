// Las 10 lecciones y los 47 pasos de la pantalla vieja de `/aprender`,
// convertidos al modelo nuevo. PHASE-1 §5: nada de lo escrito se pierde.
//
// La conversión es la que pide el prompt, y es la natural:
//   `info`      → microlectura (cuerpo + destacado, tal cual estaban)
//   `quiz`      → opcion_multiple, con sus opciones y su explicación originales
//   `truefalse` → mito_o_dato, donde `es_dato` es el `answer` de antes
//
// Los pasos de una misma lección entran como VARIANTES de una sola plantilla:
// comparten tema, fuente y dificultad, que es exactamente lo que una plantilla
// agrupa. Así las diez lecciones se vuelven 26 plantillas en vez de 47 objetos
// sueltos, y siguen dando los mismos 47 ejercicios.
//
// El texto está transcripto literal. Donde la lección vieja no citaba fuente
// —ninguna lo hacía— se le asignó la del concepto que ahora enseña, que es la
// que la nueva Academia exige para cualquier afirmación.
//
// Las tablas `lessons`, `lesson_steps` y `user_lessons` NO se tocan: siguen en
// pie como camino de rollback hasta que la fase 3 las retire.

export default [
  // ── 1 · El agua que no ves → agua.agua_virtual ────────────────────────────
  {
    slug: 'legado.agua-invisible.ml',
    tipo: 'microlectura',
    titulo_interno: 'Legado · El agua que no ves',
    enunciado_tpl: 'El agua que no ves',
    variantes: [
      {
        cuerpo:
          'Cuando pensás en cuánta agua usás, pensás en la ducha y la canilla. Pero eso es apenas una parte chica. La mayor parte del agua que consumís está escondida en las cosas que comprás y comés: se usó para producirlas, en otro lugar, antes de que llegaran a vos.',
        destacado: 'A eso se lo llama agua virtual.',
      },
      {
        cuerpo:
          'Esto no significa que cerrar la canilla no sirva. Significa que hay dos palancas: los gestos diarios, que son fáciles y suman constancia, y las decisiones grandes —qué ropa comprás, cada cuánto, qué comés— que mueven mucho más de una sola vez.',
        destacado: 'Las dos palancas se complementan.',
      },
    ],
    conceptos: [['agua.agua_virtual', 1.0]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 1,
    dificultad_base: -0.6,
    fuente: 'huella-hidrica',
  },
  {
    slug: 'legado.agua-invisible.om',
    tipo: 'opcion_multiple',
    titulo_interno: 'Legado · Agua virtual, dos preguntas',
    enunciado_tpl: '{{q.texto}}',
    variantes: [
      {
        q: { texto: '¿Qué se lleva más agua?' },
        clave: 'Una remera de algodón',
        distractores: ['Una ducha de 8 minutos', 'Diez descargas de inodoro'],
        d: -0.2,
        explicacion:
          'Una remera de algodón necesita unos 2.700 litros para producirse. Una ducha ronda los 70. La ropa pesa muchísimo más de lo que parece.',
      },
      {
        q: { texto: 'Querés bajar en serio tu consumo de agua este año. ¿Qué tiene más efecto?' },
        clave: 'Usar la ropa que ya tenés en vez de comprar nueva',
        distractores: ['Duchas un minuto más cortas', 'Cerrar la canilla al enjabonarte'],
        d: 0.1,
        explicacion:
          'Las tres suman, pero no comprar una prenda nueva evita miles de litros de una sola vez. Los gestos diarios construyen el hábito; las compras mueven el número.',
      },
    ],
    distractores: { estrategia: 'lista' },
    conceptos: [['agua.agua_virtual', 1.0]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 1,
    dificultad_base: -0.1,
    fuente: 'huella-hidrica',
  },
  {
    slug: 'legado.agua-invisible.md',
    tipo: 'mito_o_dato',
    titulo_interno: 'Legado · La canilla mientras te cepillás',
    enunciado_tpl: '¿Mito o dato?',
    variantes: [
      {
        afirmacion: 'Cerrar la canilla mientras te cepillás no cambia nada porque es muy poca agua.',
        es_dato: false,
        d: -0.3,
        explicacion:
          'Son unos 6 litros por vez. Dos veces por día, todo el año, son más de 4.000 litros: alrededor de 60 duchas.',
      },
    ],
    conceptos: [['agua.agua_virtual', 1.0]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 1,
    dificultad_base: -0.3,
    fuente: 'huella-hidrica',
  },

  // ── 2 · ¿Qué pasa con lo que tirás? → residuos ────────────────────────────
  {
    slug: 'legado.residuos-que-pasa.ml',
    tipo: 'microlectura',
    titulo_interno: 'Legado · Qué pasa con lo que tirás',
    enunciado_tpl: '¿Qué pasa con lo que tirás?',
    variantes: [
      {
        cuerpo:
          'Lo que ponés en el tacho no desaparece: va a un camión, después a una planta de separación o directo a un relleno sanitario. En un relleno, la basura queda enterrada durante décadas y, al pudrirse sin oxígeno, genera metano.',
        destacado: 'El metano calienta mucho más que el CO₂.',
      },
      {
        cuerpo:
          'El orden importa y no es el que se suele repetir. Primero evitar (no generar el residuo), después reducir, después reutilizar, y recién al final reciclar. Reciclar es la última opción, no la primera.',
        destacado: 'El mejor residuo es el que no existe.',
      },
    ],
    conceptos: [['residuos.metano_de_relleno', 1.0], ['residuos.jerarquia_residuos', 0.3]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 1,
    dificultad_base: -0.6,
    fuente: 'epa',
  },
  {
    slug: 'legado.residuos-que-pasa.om',
    tipo: 'opcion_multiple',
    titulo_interno: 'Legado · Orgánicos y jerarquía',
    enunciado_tpl: '{{q.texto}}',
    variantes: [
      {
        q: { texto: '¿Qué parte de la basura de una casa suele ser orgánica (restos de comida, yerba, cáscaras)?' },
        clave: 'Cerca de la mitad',
        distractores: ['Alrededor del 10%', 'Alrededor del 25%'],
        d: -0.1,
        explicacion:
          'Cerca de la mitad. Por eso compostar es la medida que más reduce el volumen real de basura de un hogar.',
      },
      {
        q: { texto: 'Comprás algo con mucho envase. ¿Cuál es la mejor decisión, según ese orden?' },
        clave: 'Elegir la próxima vez una opción con menos envase',
        distractores: ['Reciclar el envase', 'Reutilizarlo como recipiente'],
        d: 0.0,
        explicacion:
          'Evitar está antes que reutilizar y que reciclar. Las otras dos están bien, pero actúan cuando el residuo ya existe.',
      },
    ],
    distractores: { estrategia: 'lista' },
    conceptos: [['residuos.fraccion_organica', 1.0], ['residuos.jerarquia_residuos', 0.6]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 1,
    dificultad_base: -0.05,
    fuente: 'epa',
  },
  {
    slug: 'legado.residuos-que-pasa.md',
    tipo: 'mito_o_dato',
    titulo_interno: 'Legado · Lo que va al contenedor',
    enunciado_tpl: '¿Mito o dato?',
    variantes: [
      {
        afirmacion: 'Si pongo algo en el contenedor de reciclaje, seguro se recicla.',
        es_dato: false,
        d: -0.2,
        explicacion:
          'Solo si está limpio, seco y separado. Un envase con restos de comida puede contaminar todo el lote y hacer que termine igual en el relleno.',
      },
    ],
    conceptos: [['residuos.contaminacion_cruzada', 1.0]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 1,
    dificultad_base: -0.2,
    fuente: 'yale-reciclaje',
  },

  // ── 3 · El consumo que no notás → energia.consumo_fantasma ────────────────
  {
    slug: 'legado.energia-fantasma.ml',
    tipo: 'microlectura',
    titulo_interno: 'Legado · El consumo que no notás',
    enunciado_tpl: 'El consumo que no notás',
    variantes: [
      {
        cuerpo:
          'Muchos aparatos siguen consumiendo aunque estén apagados: la tele en espera, el microondas con el reloj, el cargador enchufado sin nada. Se lo llama consumo fantasma o consumo en espera.',
        destacado: 'Puede ser entre el 5% y el 10% de la factura.',
      },
    ],
    conceptos: [['energia.consumo_fantasma', 1.0]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 1,
    dificultad_base: -0.5,
    fuente: 'epa',
  },
  {
    slug: 'legado.energia-fantasma.om',
    tipo: 'opcion_multiple',
    titulo_interno: 'Legado · Consumo en espera',
    enunciado_tpl: '{{q.texto}}',
    variantes: [
      {
        q: { texto: 'Un cargador de celular enchufado, sin el celular conectado…' },
        clave: 'Consume una cantidad chica pero constante',
        distractores: ['No consume nada', 'Consume igual que cargando'],
        d: -0.3,
        explicacion:
          'Consume poco por hora, pero está enchufado todo el día, todos los días. Lo que suma es el tiempo, no la potencia.',
      },
      {
        q: { texto: '¿Cuál es la forma más práctica de cortar el consumo fantasma de un escritorio entero?' },
        clave: 'Usar una regleta con interruptor',
        distractores: ['Desenchufar cada cosa por separado', 'Comprar aparatos nuevos'],
        d: -0.2,
        explicacion:
          'Una regleta apaga todo con un solo gesto. Lo que falla en la práctica no es la idea, es el esfuerzo repetido.',
      },
    ],
    distractores: { estrategia: 'lista' },
    conceptos: [['energia.consumo_fantasma', 1.0]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 1,
    dificultad_base: -0.25,
    fuente: 'epa',
  },
  {
    slug: 'legado.energia-fantasma.md',
    tipo: 'mito_o_dato',
    titulo_interno: 'Legado · Apagar con el control',
    enunciado_tpl: '¿Mito o dato?',
    variantes: [
      {
        afirmacion: 'Apagar la tele con el control remoto es lo mismo que apagarla del todo.',
        es_dato: false,
        d: -0.3,
        explicacion:
          'Con el control queda en espera, esperando la señal. Apagarla del botón o cortar la regleta sí corta el consumo.',
      },
    ],
    conceptos: [['energia.consumo_fantasma', 1.0]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 1,
    dificultad_base: -0.3,
    fuente: 'epa',
  },

  // ── 4 · Cómo funciona el efecto invernadero → aire_suelo + tronco ─────────
  {
    slug: 'legado.clima-basico.ml',
    tipo: 'microlectura',
    titulo_interno: 'Legado · Cómo funciona el efecto invernadero',
    enunciado_tpl: 'Cómo funciona el efecto invernadero',
    variantes: [
      {
        cuerpo:
          'La Tierra recibe energía del sol y devuelve parte al espacio como calor. Algunos gases de la atmósfera —vapor de agua, CO₂, metano— atrapan una parte de ese calor. Sin ellos, el planeta sería mucho más frío y no sería habitable.',
        destacado: 'El efecto invernadero no es el problema. Es la vida.',
      },
      {
        cuerpo:
          'Por eso se habla de acumulación y no de caudal: no alcanza con emitir un poco menos cada año, hay que llegar a no agregar más de lo que se absorbe. Eso es lo que significa neutralidad de carbono.',
        destacado: 'Es un stock, no un flujo.',
      },
    ],
    conceptos: [['aire_suelo.efecto_invernadero_natural', 1.0], ['tronco.stock_vs_flujo', 0.3]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 1,
    dificultad_base: -0.5,
    fuente: 'ipcc-ar6',
  },
  {
    slug: 'legado.clima-basico.om',
    tipo: 'opcion_multiple',
    titulo_interno: 'Legado · Acumulación de CO₂',
    enunciado_tpl: '{{q.texto}}',
    variantes: [
      {
        q: { texto: 'Entonces, ¿cuál es el problema con el efecto invernadero?' },
        clave: 'Que aumentó mucho la cantidad de esos gases',
        distractores: ['Que exista el efecto invernadero', 'Que el sol emite más energía'],
        d: -0.2,
        explicacion:
          'Al quemar combustibles fósiles agregamos CO₂ mucho más rápido de lo que el planeta lo absorbe, así que se atrapa más calor del que solía.',
      },
      {
        q: { texto: 'Un país baja sus emisiones un 20% y las mantiene ahí. ¿Qué pasa con la concentración de CO₂?' },
        clave: 'Sigue subiendo, más lento',
        distractores: ['Baja', 'Se mantiene igual'],
        d: 0.5,
        explicacion:
          'Mientras se siga emitiendo más de lo que se absorbe, la concentración sigue creciendo. Emitir menos frena la subida, no la revierte.',
      },
    ],
    distractores: { estrategia: 'lista' },
    conceptos: [['aire_suelo.efecto_intensificado', 1.0], ['tronco.stock_vs_flujo', 0.6]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 1,
    dificultad_base: 0.15,
    fuente: 'ipcc-ar6',
  },
  {
    slug: 'legado.clima-basico.md',
    tipo: 'mito_o_dato',
    titulo_interno: 'Legado · Cuánto dura el CO₂',
    enunciado_tpl: '¿Mito o dato?',
    variantes: [
      {
        afirmacion: 'El CO₂ que emitimos hoy desaparece de la atmósfera en pocos años.',
        es_dato: false,
        d: 0.1,
        explicacion:
          'Una parte importante permanece durante siglos. Por eso lo que se emite hoy sigue influyendo mucho después.',
      },
    ],
    conceptos: [['tronco.stock_vs_flujo', 1.0]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 1,
    dificultad_base: 0.1,
    fuente: 'ipcc-ar6',
  },

  // ── 5 · Reciclar bien, no reciclar más → residuos ─────────────────────────
  {
    slug: 'legado.reciclaje-bien.ml',
    tipo: 'microlectura',
    titulo_interno: 'Legado · Reciclar bien, no reciclar más',
    enunciado_tpl: 'Reciclar bien, no reciclar más',
    variantes: [
      {
        cuerpo:
          'En una planta de separación, el material va por cintas y se clasifica por tipo. Si llega mojado, sucio o mezclado, no se puede recuperar y baja la calidad de todo el fardo. Por eso reciclar BIEN vale más que reciclar mucho.',
        destacado: 'Limpio, seco y separado.',
      },
      {
        cuerpo:
          'El vidrio es el caso más noble: se recicla infinitas veces sin perder calidad. El plástico, en cambio, se degrada en cada ciclo y termina en productos de menor valor. Por eso al plástico conviene evitarlo antes que reciclarlo.',
        destacado: 'No todos los materiales se reciclan igual.',
      },
    ],
    conceptos: [['residuos.contaminacion_cruzada', 1.0], ['residuos.reciclar_no_es_infinito', 0.6]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 1,
    dificultad_base: -0.3,
    fuente: 'yale-reciclaje',
  },
  {
    slug: 'legado.reciclaje-bien.om',
    tipo: 'opcion_multiple',
    titulo_interno: 'Legado · Qué va y qué no va al reciclaje',
    enunciado_tpl: '{{q.texto}}',
    variantes: [
      {
        q: { texto: '¿Cuál de estos NO va al reciclaje?' },
        clave: 'Caja de pizza con grasa',
        distractores: ['Botella de plástico enjuagada', 'Lata de tomate enjuagada'],
        d: -0.2,
        explicacion:
          'El cartón engrasado no se puede reciclar: la grasa arruina la fibra. Esa parte va a compost o a basura; la parte limpia de la caja sí se recicla.',
      },
      {
        q: { texto: '¿Qué conviene hacer antes de tirar una botella?' },
        clave: 'Aplastarla y ponerle la tapa',
        distractores: ['Dejarla entera con líquido', 'Sacarle la etiqueta obligatoriamente'],
        d: -0.1,
        explicacion:
          'Aplastada ocupa menos y se transporta mejor. La tapa es de otro plástico pero hoy se separa en planta, así que conviene dejarla puesta.',
      },
    ],
    distractores: { estrategia: 'lista' },
    conceptos: [['residuos.que_es_reciclable', 1.0], ['residuos.contaminacion_cruzada', 0.6]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 1,
    dificultad_base: -0.15,
    fuente: 'ley-1854-basura-cero',
  },
  {
    slug: 'legado.reciclaje-bien.md',
    tipo: 'mito_o_dato',
    titulo_interno: 'Legado · Los tickets de compra',
    enunciado_tpl: '¿Mito o dato?',
    variantes: [
      {
        afirmacion: 'Los tickets de compra son papel y se reciclan.',
        es_dato: false,
        d: 0.0,
        explicacion:
          'La mayoría son papel térmico, con un recubrimiento químico que impide reciclarlo. Lo mejor es pedir el comprobante digital.',
      },
    ],
    conceptos: [['residuos.que_es_reciclable', 1.0]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 1,
    dificultad_base: 0.0,
    fuente: 'yale-reciclaje',
  },

  // ── 6 · Qué mueve realmente tu huella → movilidad ─────────────────────────
  {
    slug: 'legado.movilidad-real.ml',
    tipo: 'microlectura',
    titulo_interno: 'Legado · Qué mueve realmente tu huella',
    enunciado_tpl: 'Qué mueve realmente tu huella',
    variantes: [
      {
        cuerpo:
          'En transporte, lo que define la huella no es solo la distancia: es cuánta gente viaja y con qué. Un auto con una sola persona es de lo más caro por kilómetro; el mismo auto con cuatro divide esa huella entre cuatro.',
        destacado: 'La ocupación importa tanto como el vehículo.',
      },
    ],
    conceptos: [['movilidad.pasajero_km', 1.0]],
    age_groups: ['teen', 'adult'],
    anillo_min: 1,
    dificultad_base: -0.3,
    fuente: 'icct-ev',
  },
  {
    slug: 'legado.movilidad-real.om',
    tipo: 'opcion_multiple',
    titulo_interno: 'Legado · Emisiones por persona y por kilómetro',
    enunciado_tpl: '{{q.texto}}',
    variantes: [
      {
        q: { texto: '¿Cuál emite MENOS por persona y por kilómetro?' },
        clave: 'Colectivo lleno',
        distractores: ['Auto con una persona', 'Auto eléctrico con una persona'],
        d: -0.1,
        explicacion:
          'Un colectivo lleno reparte su consumo entre muchas personas. El eléctrico es mejor que el naftero, pero sigue moviendo una tonelada para trasladar a una.',
      },
      {
        q: { texto: 'Un vuelo largo ida y vuelta puede equivaler, en emisiones, a…' },
        clave: 'Casi medio año de auto',
        distractores: ['Un mes de auto', 'Un día de auto'],
        d: 0.3,
        explicacion:
          'Un ida y vuelta transatlántico ronda 1,8 t de CO₂; un auto promedio emite unas 4,6 t por año. Volar menos es de las decisiones individuales que más pesan.',
      },
    ],
    distractores: { estrategia: 'lista' },
    conceptos: [['movilidad.pasajero_km', 1.0], ['movilidad.volar_pesa', 0.6]],
    age_groups: ['teen', 'adult'],
    anillo_min: 1,
    dificultad_base: 0.1,
    fuente: 'icct-ev',
  },
  {
    slug: 'legado.movilidad-real.md',
    tipo: 'mito_o_dato',
    titulo_interno: 'Legado · Los viajes cortos en auto',
    enunciado_tpl: '¿Mito o dato?',
    variantes: [
      {
        afirmacion: 'Los viajes cortos en auto son los menos dañinos porque son cortos.',
        es_dato: false,
        d: 0.1,
        explicacion:
          'Son los peores por kilómetro: el motor frío consume mucho más en el primer par de kilómetros. Son justo los que más conviene hacer a pie o en bici.',
      },
    ],
    conceptos: [['movilidad.pasajero_km', 1.0]],
    age_groups: ['teen', 'adult'],
    anillo_min: 1,
    dificultad_base: 0.1,
    fuente: 'icct-ev',
  },

  // ── 7 · La huella de lo que comés → alimentacion ──────────────────────────
  {
    slug: 'legado.comida-huella.ml',
    tipo: 'microlectura',
    titulo_interno: 'Legado · La huella de lo que comés',
    enunciado_tpl: 'La huella de lo que comés',
    variantes: [
      {
        cuerpo:
          'Producir comida usa tierra, agua y energía, pero no todas las comidas cuestan lo mismo. La carne vacuna es la más intensiva: hace falta cultivar el alimento del animal, sostenerlo durante años y además emite metano.',
        destacado: 'No es lo mismo un kilo que un kilo.',
      },
      {
        cuerpo:
          'Y hay un factor que aplica a todo: el desperdicio. Un tercio de la comida producida en el mundo no se come. Toda esa agua, tierra y energía se gastaron para nada.',
        destacado: 'Lo que no se tira es la comida más eficiente.',
      },
    ],
    conceptos: [['alimentacion.huella_por_alimento', 1.0], ['alimentacion.desperdicio_un_tercio', 0.6]],
    age_groups: ['teen', 'adult'],
    anillo_min: 1,
    dificultad_base: -0.3,
    fuente: 'owid-alimentos',
  },
  {
    slug: 'legado.comida-huella.om',
    tipo: 'opcion_multiple',
    titulo_interno: 'Legado · Huella de la comida',
    enunciado_tpl: '{{q.texto}}',
    variantes: [
      {
        q: { texto: 'Aproximadamente, ¿cuánto CO₂ genera producir un kilo de carne vacuna?' },
        clave: 'Alrededor de 27 kg',
        distractores: ['Menos de 1 kg', 'Unos 5 kg'],
        d: 0.0,
        explicacion:
          'Cerca de 27 kg por kilo. Las lentejas rondan 0,9 kg. Es una diferencia de casi treinta veces.',
      },
      {
        q: { texto: '¿Qué cambio reduce más la huella de tu comida?' },
        clave: 'Reemplazar algunas comidas con carne por legumbres',
        distractores: ['Comprar todo local', 'Evitar el packaging'],
        d: 0.2,
        explicacion:
          'Cambiar qué comés supera con claridad al origen y al envase. No hace falta dejar la carne: bajar la frecuencia ya mueve el número.',
      },
    ],
    distractores: { estrategia: 'lista' },
    conceptos: [['alimentacion.huella_por_alimento', 1.0], ['alimentacion.que_comes_vs_donde', 0.6]],
    age_groups: ['teen', 'adult'],
    anillo_min: 1,
    dificultad_base: 0.1,
    fuente: 'owid-alimentos',
  },
  {
    slug: 'legado.comida-huella.md',
    tipo: 'mito_o_dato',
    titulo_interno: 'Legado · Importado y huella',
    enunciado_tpl: '¿Mito o dato?',
    variantes: [
      {
        afirmacion: 'Que un alimento sea importado es lo que más define su huella.',
        es_dato: false,
        d: 0.2,
        explicacion:
          'El transporte suele ser menos del 10% del total. Pesa mucho más QUÉ es que de dónde viene. Un tomate local de invernadero puede superar a uno de estación traído de lejos.',
      },
    ],
    conceptos: [['alimentacion.transporte_es_poco', 1.0]],
    age_groups: ['teen', 'adult'],
    anillo_min: 1,
    dificultad_base: 0.2,
    fuente: 'owid-alimentos',
  },

  // ── 8 · Cómo detectar el verde falso → consumo ────────────────────────────
  {
    slug: 'legado.greenwashing.ml',
    tipo: 'microlectura',
    titulo_interno: 'Legado · Cómo detectar el verde falso',
    enunciado_tpl: 'Cómo detectar el verde falso',
    variantes: [
      {
        cuerpo:
          'Greenwashing es presentar algo como más ecológico de lo que es. No siempre es mentira: muchas veces es una verdad chiquita puesta adelante para tapar el resto.',
        destacado: 'El truco no suele ser mentir, es desviar la atención.',
      },
      {
        cuerpo:
          'Tres preguntas rápidas: ¿el dato es medible? ¿dice respecto de qué y desde cuándo? ¿lo verifica alguien independiente? Si las tres fallan, es marketing.',
        destacado: 'Medible, comparable y verificado.',
      },
    ],
    conceptos: [['consumo.greenwashing', 1.0], ['consumo.sellos_y_certificaciones', 0.3]],
    age_groups: ['teen', 'adult'],
    anillo_min: 1,
    dificultad_base: -0.2,
    fuente: 'global-footprint',
  },
  {
    slug: 'legado.greenwashing.om',
    tipo: 'opcion_multiple',
    titulo_interno: 'Legado · Leer una promesa verde',
    enunciado_tpl: '{{q.texto}}',
    variantes: [
      {
        q: { texto: 'Una botella dice: 100% RECICLABLE. ¿Qué te dice realmente?' },
        clave: 'Que podría reciclarse si existe el sistema',
        distractores: ['Que está hecha con material reciclado', 'Que se va a reciclar seguro'],
        d: 0.0,
        explicacion:
          'Reciclable describe una posibilidad, no un hecho. Distinto es reciclado, que sí dice de qué está hecha. Es la confusión más común del rubro.',
      },
      {
        q: { texto: '¿Cuál de estas afirmaciones es la más confiable?' },
        clave: 'Reducimos un 40% el agua por unidad desde 2020',
        distractores: ['Amigable con el planeta', 'Eco-friendly'],
        d: -0.1,
        explicacion:
          'Es la única con número, alcance y fecha. Las otras dos no se pueden comprobar ni desmentir, que es exactamente para lo que sirven.',
      },
    ],
    distractores: { estrategia: 'lista' },
    conceptos: [['consumo.greenwashing', 1.0], ['consumo.pecados_del_greenwashing', 0.6]],
    age_groups: ['teen', 'adult'],
    anillo_min: 1,
    dificultad_base: -0.05,
    fuente: 'global-footprint',
  },
  {
    slug: 'legado.greenwashing.md',
    tipo: 'mito_o_dato',
    titulo_interno: 'Legado · El envase verde con hojitas',
    enunciado_tpl: '¿Mito o dato?',
    variantes: [
      {
        afirmacion: 'Que un envase sea verde y tenga hojitas dice algo sobre su impacto.',
        es_dato: false,
        d: -0.2,
        explicacion:
          'El color y las imágenes no están regulados. Cualquiera puede usarlos. Lo que vale es el dato concreto y verificable.',
      },
    ],
    conceptos: [['consumo.greenwashing', 1.0]],
    age_groups: ['teen', 'adult'],
    anillo_min: 1,
    dificultad_base: -0.2,
    fuente: 'global-footprint',
  },

  // ── 9 · Por qué importa la biodiversidad → animales ───────────────────────
  {
    slug: 'legado.biodiversidad.ml',
    tipo: 'microlectura',
    titulo_interno: 'Legado · Por qué importa la biodiversidad',
    enunciado_tpl: 'Por qué importa la biodiversidad',
    variantes: [
      {
        cuerpo:
          'La biodiversidad no es una lista de especies lindas: es la red de relaciones que sostiene el sistema. Cada especie cumple una función, y muchas sostienen a otras sin que se note hasta que faltan.',
        destacado: 'Es una red, no una colección.',
      },
    ],
    conceptos: [['animales.biodiversidad_tres_niveles', 1.0], ['animales.cadena_vs_red', 0.6]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 1,
    dificultad_base: -0.2,
    fuente: 'ipbes-global',
  },
  {
    slug: 'legado.biodiversidad.om',
    tipo: 'opcion_multiple',
    titulo_interno: 'Legado · Polinizadores y pérdida de hábitat',
    enunciado_tpl: '{{q.texto}}',
    variantes: [
      {
        q: { texto: '¿Qué proporción de los cultivos del mundo depende de polinizadores?' },
        clave: 'Alrededor de un 75%',
        distractores: ['Cerca de un 5%', 'Prácticamente ninguno'],
        d: -0.1,
        explicacion:
          'Cerca de tres cuartos de los cultivos dependen en alguna medida de la polinización animal. Sin insectos, buena parte de lo que comemos se complica.',
      },
      {
        q: { texto: '¿Cuál es hoy la principal causa de pérdida de biodiversidad?' },
        clave: 'La pérdida y fragmentación de hábitat',
        distractores: ['La caza', 'El turismo'],
        d: 0.0,
        explicacion:
          'Cuando un ambiente se parte en pedazos aislados, las poblaciones quedan chicas y separadas. Por eso los corredores verdes importan tanto.',
      },
    ],
    distractores: { estrategia: 'lista' },
    conceptos: [['animales.polinizacion', 1.0], ['animales.perdida_de_habitat', 0.6]],
    age_groups: ['teen', 'adult'],
    anillo_min: 1,
    dificultad_base: -0.05,
    fuente: 'ipbes-global',
  },
  {
    slug: 'legado.biodiversidad.md',
    tipo: 'mito_o_dato',
    titulo_interno: 'Legado · Una especie poco conocida',
    enunciado_tpl: '¿Mito o dato?',
    variantes: [
      {
        afirmacion: 'Si desaparece una especie poco conocida, el resto sigue igual.',
        es_dato: false,
        d: -0.1,
        explicacion:
          'Muchas especies discretas son claves: descomponen materia, airean el suelo o controlan plagas. Su ausencia se nota tarde y cuesta mucho revertirla.',
      },
    ],
    conceptos: [['animales.especie_clave', 1.0]],
    age_groups: ['kid', 'teen', 'adult'],
    anillo_min: 1,
    dificultad_base: -0.1,
    fuente: 'ipbes-global',
  },

  // ── 10 · De la basura al recurso → consumo.economia_circular ──────────────
  {
    slug: 'legado.economia-circular.ml',
    tipo: 'microlectura',
    titulo_interno: 'Legado · De la basura al recurso',
    enunciado_tpl: 'De la basura al recurso',
    variantes: [
      {
        cuerpo:
          'El modelo habitual es lineal: extraer, fabricar, usar, tirar. La economía circular busca que los materiales vuelvan a entrar al ciclo en vez de terminar en un relleno.',
        destacado: 'Extraer, fabricar, usar… y volver a empezar.',
      },
      {
        cuerpo:
          'Como consumidor tenés dos palancas circulares muy concretas: alargar la vida de lo que ya tenés, y elegir sistemas que recuperen el producto (retornables, recambios, reparación oficial).',
        destacado: 'Lo más circular que tenés es lo que ya está en tu casa.',
      },
    ],
    conceptos: [['consumo.economia_circular', 1.0], ['residuos.lineal_vs_circular', 0.6]],
    age_groups: ['teen', 'adult'],
    anillo_min: 1,
    dificultad_base: -0.1,
    fuente: 'ellen-macarthur',
  },
  {
    slug: 'legado.economia-circular.om',
    tipo: 'opcion_multiple',
    titulo_interno: 'Legado · Estrategias circulares',
    enunciado_tpl: '{{q.texto}}',
    variantes: [
      {
        q: { texto: '¿Cuál de estas es la estrategia circular MÁS valiosa?' },
        clave: 'Diseñar el producto para que dure y se pueda reparar',
        distractores: ['Reciclar el material', 'Compostar'],
        d: 0.1,
        explicacion:
          'Cuanto más cerca del uso original se cierra el ciclo, menos energía se pierde. Reparar conserva mucho más valor que fundir y rehacer.',
      },
      {
        q: { texto: 'Un envase retornable que la marca lava y vuelve a llenar es un ejemplo de…' },
        clave: 'Reutilización en ciclo cerrado',
        distractores: ['Reciclaje', 'Compostaje'],
        d: 0.2,
        explicacion:
          'El envase conserva su forma y su función: no hay que fundirlo ni rehacerlo. Es de los sistemas más eficientes que existen.',
      },
    ],
    distractores: { estrategia: 'lista' },
    conceptos: [['consumo.economia_circular', 1.0], ['consumo.derecho_a_reparar', 0.6]],
    age_groups: ['teen', 'adult'],
    anillo_min: 1,
    dificultad_base: 0.15,
    fuente: 'ellen-macarthur',
  },
  {
    slug: 'legado.economia-circular.md',
    tipo: 'mito_o_dato',
    titulo_interno: 'Legado · Circular no es reciclar más',
    enunciado_tpl: '¿Mito o dato?',
    variantes: [
      {
        afirmacion: 'Economía circular es básicamente reciclar más.',
        es_dato: false,
        d: 0.1,
        explicacion:
          'Reciclar es el último anillo. Lo circular arranca mucho antes: en el diseño, en la duración, en la reparabilidad y en compartir en vez de comprar.',
      },
    ],
    conceptos: [['consumo.economia_circular', 1.0]],
    age_groups: ['teen', 'adult'],
    anillo_min: 1,
    dificultad_base: 0.1,
    fuente: 'ellen-macarthur',
  },
];
