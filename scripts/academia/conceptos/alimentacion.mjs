// Rama `alimentacion` — 7 gajos, 30 conceptos.
// Contenido puro: sin lógica, sin imports. Ver scripts/academia/CONTRATO.md.

export default {
  rama: 'alimentacion',
  gajos: [
    // ───────────────────────────── ANILLO 1 ─────────────────────────────
    {
      slug: 'alimentacion.lo-que-hay-en-el-plato',
      anillo: 1,
      titulo_es: 'Lo que hay en el plato',
      bajada_es: 'Empezamos por lo más cercano: la comida que ya estás comiendo.',
      icono: 'Utensils',
      age_groups: ['kid', 'teen', 'adult'],
      sort_order: 1,
      conceptos: [
        {
          slug: 'alimentacion.grupos_de_alimentos',
          titulo_es: 'Cómo se arma un plato',
          enunciado_es:
            'Las guías alimentarias argentinas ordenan la comida en grupos y proponen que las verduras y frutas ocupen alrededor de la mitad del plato diario.',
          detalle_es:
            'No es una lista de prohibiciones: es una proporción. Lo que cambia el conjunto es qué ocupa más lugar, no qué desaparece.',
          fuente: 'fao',
          anillo: 1,
          dificultad_base: -1.2,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [],
        },
        {
          slug: 'alimentacion.ultraprocesados',
          titulo_es: 'Qué es un ultraprocesado',
          enunciado_es:
            'Un ultraprocesado no es cualquier alimento envasado: es una formulación industrial armada con ingredientes y aditivos que no tenés en tu cocina.',
          detalle_es:
            'Un paquete de arroz está procesado. Una galletita rellena está ultraprocesada. La diferencia es cuánto se rearmó el alimento, no si viene en bolsa.',
          fuente: 'fao',
          anillo: 1,
          dificultad_base: -0.7,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [],
          misconceptions: [
            {
              slug: 'alimentacion.mito_light_es_sano',
              creencia_es:
                'Si el frente del envase dice "natural" o "light", es una opción saludable.',
              correccion_es:
                'La trampa es que el frente del envase lo escribe quien vende, y está diseñado para tranquilizarte en dos segundos. La información con reglas está en otro lado: en los octógonos y en la lista de ingredientes. Un producto puede ser light en grasas y tener exceso de azúcares al mismo tiempo.',
              fuente: 'fao',
            },
          ],
        },
        {
          slug: 'alimentacion.octogonos_negros',
          titulo_es: 'Los octógonos negros',
          enunciado_es:
            'La ley argentina de etiquetado frontal obliga a poner octógonos negros en el frente del envase cuando un producto tiene exceso de azúcares, sodio, grasas o calorías.',
          detalle_es:
            'El octógono no dice "no lo comas": dice "acá hay exceso". Es información puesta justo donde se decide, en la góndola.',
          fuente: 'fao',
          anillo: 1,
          dificultad_base: -0.9,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [],
        },
        {
          slug: 'alimentacion.comer_es_una_decision_ambiental',
          titulo_es: 'Comer es una decisión ambiental',
          enunciado_es:
            'Cada comida conecta tu mesa con un suelo, un agua y un clima: el sistema alimentario es una de las mayores presiones humanas sobre el ambiente.',
          detalle_es:
            'Lo bueno de eso es la frecuencia. Es una decisión que volvés a tomar dos o tres veces por día, así que hay muchísimas oportunidades de mejorarla.',
          fuente: 'owid-impactos-alimentos',
          anillo: 1,
          dificultad_base: -0.4,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['tronco.todo_esta_conectado'],
        },
      ],
      hojas: [
        {
          slug: 'alimentacion.lo-que-hay-en-el-plato.1',
          titulo_es: 'La mitad del plato',
          bajada_es: 'Una proporción sencilla que ordena todo lo demás.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 1,
          conceptos: ['alimentacion.grupos_de_alimentos', 'alimentacion.comer_es_una_decision_ambiental'],
        },
        {
          slug: 'alimentacion.lo-que-hay-en-el-plato.2',
          titulo_es: 'Comida y producto',
          bajada_es: 'Dónde está la línea entre procesado y ultraprocesado.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 2,
          conceptos: ['alimentacion.ultraprocesados', 'alimentacion.grupos_de_alimentos'],
        },
        {
          slug: 'alimentacion.lo-que-hay-en-el-plato.3',
          titulo_es: 'Leer el frente del envase',
          bajada_es: 'Qué te dice un octógono y qué no te dice.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 3,
          conceptos: ['alimentacion.octogonos_negros', 'alimentacion.ultraprocesados'],
        },
        {
          slug: 'alimentacion.lo-que-hay-en-el-plato.4',
          titulo_es: 'Tres veces por día',
          bajada_es: 'Comer también es una manera de decidir sobre el ambiente.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 4,
          conceptos: ['alimentacion.comer_es_una_decision_ambiental', 'alimentacion.octogonos_negros'],
        },
      ],
    },

    {
      slug: 'alimentacion.de-donde-sale',
      anillo: 1,
      titulo_es: 'De dónde sale la verdura',
      bajada_es: 'Temporada, quintas del conurbano y las manos que hay detrás.',
      icono: 'Carrot',
      age_groups: ['kid', 'teen', 'adult'],
      sort_order: 2,
      conceptos: [
        {
          slug: 'alimentacion.estacionalidad',
          titulo_es: 'Cada cosa a su tiempo',
          enunciado_es:
            'Cada fruta y verdura tiene su temporada: en temporada rinde más, cuesta menos y necesita menos invernadero, cámara de frío y viaje.',
          detalle_es:
            'En el AMBA el invierno es de cítricos, zapallo y hojas verdes; el verano, de tomate, durazno y ciruela. Fijate en la verdulería qué está barato: eso suele ser lo que está de estación.',
          fuente: 'inta',
          anillo: 1,
          dificultad_base: -1.0,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [],
        },
        {
          slug: 'alimentacion.cinturon_horticola',
          titulo_es: 'La quinta del conurbano',
          enunciado_es:
            'Buena parte de la verdura fresca que se come en el AMBA se produce en el propio conurbano, en las quintas del cinturón hortícola bonaerense.',
          detalle_es:
            'La Plata, Florencio Varela y Berazategui abastecen las verdulerías de la ciudad todos los días. El campo está más cerca de lo que parece.',
          fuente: 'inta',
          anillo: 1,
          dificultad_base: -0.6,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [],
        },
        {
          slug: 'alimentacion.agricultura_familiar',
          titulo_es: 'Agricultura familiar',
          enunciado_es:
            'La agricultura familiar produce una parte importante de los alimentos frescos que llegan a las mesas argentinas, en unidades chicas y con trabajo de la propia familia.',
          detalle_es:
            'Las ferias de la agricultura familiar acortan la cadena: quien produce y quien compra se ven la cara. De esa idea sale la palabra soberanía alimentaria.',
          fuente: 'inta',
          anillo: 1,
          dificultad_base: -0.5,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [],
        },
        {
          slug: 'alimentacion.comercio_justo',
          titulo_es: 'Comercio justo',
          enunciado_es:
            'El comercio justo es un acuerdo sobre el precio y las condiciones de trabajo de quien produce, no una promesa sobre el sabor del producto.',
          detalle_es:
            'Es una de las pocas etiquetas que habla de personas y no de nutrientes. Como toda certificación, vale lo que valga quien la controla.',
          fuente: 'unesco-ods',
          anillo: 1,
          dificultad_base: -0.2,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['tronco.evidencia_y_fuente'],
        },
      ],
      hojas: [
        {
          slug: 'alimentacion.de-donde-sale.1',
          titulo_es: 'Lo que está de estación',
          bajada_es: 'Cómo se nota, en el precio y en el gusto.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 1,
          conceptos: ['alimentacion.estacionalidad', 'alimentacion.cinturon_horticola'],
        },
        {
          slug: 'alimentacion.de-donde-sale.2',
          titulo_es: 'Verdura del conurbano',
          bajada_es: 'Las quintas que abastecen al AMBA todos los días.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 2,
          conceptos: ['alimentacion.cinturon_horticola', 'alimentacion.agricultura_familiar'],
        },
        {
          slug: 'alimentacion.de-donde-sale.3',
          titulo_es: 'Quién está del otro lado',
          bajada_es: 'Ferias, cadenas cortas y qué promete una etiqueta.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 3,
          conceptos: ['alimentacion.agricultura_familiar', 'alimentacion.comercio_justo', 'alimentacion.estacionalidad'],
        },
      ],
    },

    {
      slug: 'alimentacion.lo-que-se-tira',
      anillo: 1,
      titulo_es: 'Lo que se tira',
      bajada_es: 'Un tercio de la comida no llega a comerse. Dónde se pierde y cómo cortarlo.',
      icono: 'Trash2',
      age_groups: ['kid', 'teen', 'adult'],
      sort_order: 3,
      conceptos: [
        {
          slug: 'alimentacion.desperdicio_un_tercio',
          titulo_es: 'Un tercio en el camino',
          enunciado_es:
            'Alrededor de un tercio de los alimentos que se producen en el mundo nunca llegan a comerse.',
          detalle_es:
            'Cuando se tira comida se tira además todo lo que hizo falta para producirla: agua, suelo, trabajo y combustible.',
          fuente: 'fao',
          anillo: 1,
          dificultad_base: -0.8,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['tronco.leer_un_numero'],
        },
        {
          slug: 'alimentacion.donde_se_pierde',
          titulo_es: 'En qué eslabón se pierde',
          enunciado_es:
            'La comida se pierde a lo largo de toda la cadena —campo, transporte, góndola— y también se desperdicia en la última etapa, adentro de las casas.',
          detalle_es:
            'Saber en qué eslabón pasa es lo que decide qué conviene hacer: en casa se resuelve planificando la compra, en el campo con logística y frío.',
          fuente: 'fao',
          anillo: 1,
          dificultad_base: -0.4,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['alimentacion.desperdicio_un_tercio'],
        },
        {
          slug: 'alimentacion.fechas_de_vencimiento',
          titulo_es: 'Las dos fechas del envase',
          enunciado_es:
            '"Consumir antes de" es una fecha de seguridad; "consumir preferentemente antes de" es una fecha de calidad, y muchos alimentos siguen estando buenos después.',
          detalle_es:
            'Confundirlas manda a la basura comida en buen estado. Con carne, pescado y lácteos frescos, en cambio, la fecha manda: ahí no se improvisa.',
          fuente: 'fao',
          anillo: 1,
          dificultad_base: -0.5,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['tronco.leer_un_numero'],
          misconceptions: [
            {
              slug: 'alimentacion.mito_fecha_vencida',
              creencia_es:
                'Si pasó la fecha impresa en el envase, el alimento ya no se puede comer.',
              correccion_es:
                'La trampa es que las dos fechas se escriben parecido y en el mismo lugar, así que el cerebro las lee como una sola. Pero "preferentemente antes de" habla de textura, color y sabor, no de seguridad: un paquete de fideos o una lata siguen siendo comida. La que sí es una fecha límite es "consumir antes de", la de los frescos.',
              fuente: 'fao',
            },
          ],
        },
        {
          slug: 'alimentacion.compostaje_de_comida',
          titulo_es: 'De la cáscara a la tierra',
          enunciado_es:
            'Los restos de comida son una de las fracciones más pesadas de la basura doméstica, y compostados dejan de ser basura para volver a ser tierra.',
          detalle_es:
            'En CABA la ley Basura Cero apunta justamente a sacar del enterramiento ese tipo de material. Un balde con tapa en la cocina alcanza para arrancar.',
          fuente: 'ley-1854-basura-cero',
          anillo: 1,
          dificultad_base: -0.3,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['tronco.ciclos_materia'],
        },
      ],
      hojas: [
        {
          slug: 'alimentacion.lo-que-se-tira.1',
          titulo_es: 'Un tercio se queda en el camino',
          bajada_es: 'El número más grande de esta rama, y qué esconde.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 1,
          conceptos: ['alimentacion.desperdicio_un_tercio', 'alimentacion.donde_se_pierde'],
        },
        {
          slug: 'alimentacion.lo-que-se-tira.2',
          titulo_es: 'Del campo a la heladera',
          bajada_es: 'Cada eslabón pierde distinto, y por eso se arregla distinto.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 2,
          conceptos: ['alimentacion.donde_se_pierde', 'alimentacion.fechas_de_vencimiento'],
        },
        {
          slug: 'alimentacion.lo-que-se-tira.3',
          titulo_es: 'Qué dice la fecha',
          bajada_es: 'Seguridad y calidad no son lo mismo, aunque estén juntas.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 3,
          conceptos: ['alimentacion.fechas_de_vencimiento', 'alimentacion.desperdicio_un_tercio'],
        },
        {
          slug: 'alimentacion.lo-que-se-tira.4',
          titulo_es: 'Cerrar el círculo en la cocina',
          bajada_es: 'Compostar los restos y devolverlos al suelo.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 4,
          conceptos: ['alimentacion.compostaje_de_comida', 'alimentacion.donde_se_pierde'],
        },
      ],
    },

    {
      slug: 'alimentacion.la-huella-del-plato',
      anillo: 1,
      titulo_es: 'La huella del plato',
      bajada_es: 'Qué pesa de verdad en la comida: el alimento, no los kilómetros.',
      icono: 'Footprints',
      age_groups: ['kid', 'teen', 'adult'],
      sort_order: 4,
      conceptos: [
        {
          slug: 'alimentacion.huella_por_alimento',
          titulo_es: 'No todo pesa igual',
          enunciado_es:
            'El impacto ambiental cambia muchísimo de un alimento a otro: por kilo, los de origen animal pesan bastante más que los vegetales.',
          detalle_es:
            'Es la diferencia más grande de toda la rama. Antes de afinar detalles, conviene mirar qué grupo de alimentos ocupa el plato.',
          fuente: 'owid-impactos-alimentos',
          anillo: 1,
          dificultad_base: -0.6,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['tronco.no_todo_pesa_igual'],
        },
        {
          slug: 'alimentacion.transporte_es_poco',
          titulo_es: 'Los kilómetros pesan poco',
          enunciado_es:
            'En la mayoría de los alimentos el transporte explica una porción chica de las emisiones: el grueso se genera en la producción, antes de que el alimento se suba a un camión.',
          detalle_es:
            'La excepción son los pocos alimentos que viajan en avión, algo raro y caro. Casi todo lo demás viaja en barco o camión, que mueven mucha carga con poco combustible por kilo.',
          fuente: 'owid-alimentos',
          anillo: 1,
          dificultad_base: -0.3,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['tronco.no_todo_pesa_igual'],
          misconceptions: [
            {
              slug: 'alimentacion.mito_comer_local',
              creencia_es:
                'Comer local siempre reduce más emisiones que cambiar de dieta.',
              correccion_es:
                'La trampa es que la distancia se puede imaginar: un camión cruzando el país es una imagen nítida, y el metano de una vaca o el desmonte de una hectárea no lo son. Pero en la mayoría de los alimentos el transporte es una porción chica de las emisiones y el grueso ya se generó en la producción. Comprar cerca suma por otros motivos; para bajar emisiones pesa más qué ponés en el plato que cuántos kilómetros hizo.',
              fuente: 'owid-alimentos',
            },
          ],
        },
        {
          slug: 'alimentacion.que_comes_vs_donde',
          titulo_es: 'Qué comés antes que de dónde viene',
          enunciado_es:
            'Para bajar la huella de tu comida, cambiar qué comés mueve mucho más el número que cambiar de dónde viene.',
          detalle_es:
            'No es que lo local no importe: es que la palanca grande está en el tipo de alimento. Empezá por ahí y después afiná.',
          fuente: 'owid-alimentos',
          anillo: 1,
          dificultad_base: -0.2,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [
            'alimentacion.transporte_es_poco',
            { slug: 'alimentacion.huella_por_alimento', fuerza: 0.6 },
          ],
        },
        {
          slug: 'alimentacion.local_igual_sirve',
          titulo_es: 'Comprar cerca igual sirve',
          enunciado_es:
            'Comprar cerca tiene ventajas reales —dinero que queda en el barrio, verdura más fresca, variedades que no aguantan el viaje— aunque no sea la palanca climática principal.',
          detalle_es:
            'Un argumento puede ser flojo para una cosa y bueno para otra. Eso no lo vuelve mentira: lo vuelve preciso.',
          fuente: 'owid-alimentos',
          anillo: 1,
          dificultad_base: -0.2,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['alimentacion.que_comes_vs_donde'],
        },
        {
          slug: 'alimentacion.agua_y_tierra_del_plato',
          titulo_es: 'Además de emitir, ocupa',
          enunciado_es:
            'La comida no solo emite gases: también ocupa tierra y usa agua, y a escala mundial el sistema alimentario es el principal usuario de las dos cosas.',
          detalle_es:
            'Por eso una decisión alimentaria se mide en varias unidades a la vez, y a veces lo mejor para una no es lo mejor para otra.',
          fuente: 'owid-impactos-alimentos',
          anillo: 1,
          dificultad_base: -0.2,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['tronco.no_todo_pesa_igual'],
        },
      ],
      hojas: [
        {
          slug: 'alimentacion.la-huella-del-plato.1',
          titulo_es: 'No todo pesa igual en el plato',
          bajada_es: 'La diferencia más grande de esta rama, en una imagen.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 1,
          conceptos: ['alimentacion.huella_por_alimento', 'alimentacion.agua_y_tierra_del_plato'],
        },
        {
          slug: 'alimentacion.la-huella-del-plato.2',
          titulo_es: 'Los kilómetros que no eran',
          bajada_es: 'Por qué la distancia engaña tanto.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 2,
          conceptos: ['alimentacion.transporte_es_poco', 'alimentacion.huella_por_alimento'],
        },
        {
          slug: 'alimentacion.la-huella-del-plato.3',
          titulo_es: 'Qué mueve la aguja',
          bajada_es: 'Dónde conviene poner el esfuerzo primero.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 3,
          conceptos: ['alimentacion.que_comes_vs_donde', 'alimentacion.transporte_es_poco'],
        },
        {
          slug: 'alimentacion.la-huella-del-plato.4',
          titulo_es: 'Lo local, en su justa medida',
          bajada_es: 'Buenos motivos para comprar cerca, sin exagerar ninguno.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 4,
          conceptos: ['alimentacion.local_igual_sirve', 'alimentacion.que_comes_vs_donde', 'alimentacion.agua_y_tierra_del_plato'],
        },
      ],
    },

    // ───────────────────────────── ANILLO 2 ─────────────────────────────
    {
      slug: 'alimentacion.carne-metano-y-pastizal',
      anillo: 2,
      titulo_es: 'Carne, metano y pastizal',
      bajada_es: 'La conversación más argentina de todas, con los números adelante.',
      icono: 'Beef',
      age_groups: ['kid', 'teen', 'adult'],
      sort_order: 5,
      conceptos: [
        {
          slug: 'alimentacion.metano_enterico',
          titulo_es: 'El metano de la digestión',
          enunciado_es:
            'Las vacas, ovejas y cabras producen metano al digerir pasto, y el metano es un gas de efecto invernadero potente que dura pocas décadas en la atmósfera.',
          detalle_es:
            'Potente y de vida corta a la vez: por eso bajarlo se nota rápido en la temperatura, al revés del CO₂, que se queda muchísimo más tiempo.',
          fuente: 'ipcc-ar6',
          anillo: 2,
          dificultad_base: -0.1,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['tronco.ciclos_materia'],
        },
        {
          slug: 'alimentacion.pastizal_vs_feedlot',
          titulo_es: 'Pasto o corral',
          enunciado_es:
            'La misma vaca deja huellas distintas según cómo se críe: a pasto sobre pastizal, a corral con grano, o combinando las dos etapas, como es habitual en Argentina.',
          detalle_es:
            'A corral se engorda más rápido y con menos metano por kilo, pero se necesita grano, y ese grano ocupa tierra en otro lado. No hay una respuesta única.',
          fuente: 'inta',
          anillo: 2,
          dificultad_base: 0.3,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: ['alimentacion.metano_enterico'],
        },
        {
          slug: 'alimentacion.pastizal_guarda_carbono',
          titulo_es: 'El carbono que vive abajo',
          enunciado_es:
            'El pastizal pampeano guarda la mayor parte de su carbono bajo tierra, en raíces y suelo, y sostiene pastos y aves que no viven en ningún otro lado.',
          detalle_es:
            'Ganadería sobre pastizal bien manejado es una de las pocas maneras de que ese ecosistema siga existiendo en vez de convertirse en cultivo.',
          fuente: 'inta',
          anillo: 2,
          dificultad_base: 0.1,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['tronco.servicios_ecosistemicos'],
        },
        {
          slug: 'alimentacion.carne_en_argentina',
          titulo_es: 'La carne acá',
          enunciado_es:
            'En Argentina la carne es alimento, trabajo, exportación y también identidad, así que la discusión no se resuelve con un sí o un no.',
          detalle_es:
            'Las preguntas útiles son otras: cuánta, cada cuánto, criada dónde y a costa de qué. Con esas cuatro se avanza más que con una consigna.',
          fuente: 'inta',
          anillo: 2,
          dificultad_base: 0.2,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [],
        },
        {
          slug: 'alimentacion.flexitariana',
          titulo_es: 'Menos veces, no nunca',
          enunciado_es:
            'No hace falta dejar la carne para bajar la huella de lo que comés: bajar la frecuencia ya mueve el número, y ahí está la mayor parte del efecto.',
          detalle_es:
            'En eso se apoyan las dietas flexitarianas: menos veces por semana, no nunca más. Es un cambio que la gente sostiene en el tiempo, y sostenerlo es lo que cuenta.',
          fuente: 'owid-impactos-alimentos',
          anillo: 2,
          dificultad_base: 0.0,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['alimentacion.huella_por_alimento'],
        },
      ],
      hojas: [
        {
          slug: 'alimentacion.carne-metano-y-pastizal.1',
          titulo_es: 'De dónde sale el metano',
          bajada_es: 'Un gas potente y corto, y qué significa eso.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 1,
          conceptos: ['alimentacion.metano_enterico', 'alimentacion.carne_en_argentina'],
        },
        {
          slug: 'alimentacion.carne-metano-y-pastizal.2',
          titulo_es: 'Pasto o corral',
          bajada_es: 'Dos sistemas de cría, dos huellas distintas.',
          minutos: 6,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 2,
          conceptos: ['alimentacion.pastizal_vs_feedlot', 'alimentacion.metano_enterico'],
        },
        {
          slug: 'alimentacion.carne-metano-y-pastizal.3',
          titulo_es: 'El pastizal como aliado',
          bajada_es: 'Carbono, aves y un ecosistema que casi no se ve.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 3,
          conceptos: ['alimentacion.pastizal_guarda_carbono', 'alimentacion.pastizal_vs_feedlot'],
        },
        {
          slug: 'alimentacion.carne-metano-y-pastizal.4',
          titulo_es: 'Menos veces, no nunca',
          bajada_es: 'El cambio chico que se sostiene y el grande que no.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 4,
          conceptos: ['alimentacion.flexitariana', 'alimentacion.carne_en_argentina'],
        },
      ],
    },

    {
      slug: 'alimentacion.el-campo-y-la-frontera',
      anillo: 2,
      titulo_es: 'El campo y la frontera',
      bajada_es: 'Soja, bosque chaqueño, agroquímicos y otra manera de producir.',
      icono: 'Tractor',
      age_groups: ['kid', 'teen', 'adult'],
      sort_order: 6,
      conceptos: [
        {
          slug: 'alimentacion.soja_y_frontera',
          titulo_es: 'La frontera que se corrió',
          enunciado_es:
            'La soja empujó la frontera agrícola argentina hacia el norte, y buena parte de esa producción sale del país como alimento para animales.',
          detalle_es:
            'Cuando comés pollo o cerdo, en gran medida estás comiendo grano. Ese grano ocupó tierra en algún lado, y ese lado tiene nombre.',
          fuente: 'fao',
          anillo: 2,
          dificultad_base: 0.3,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: ['tronco.todo_esta_conectado'],
        },
        {
          slug: 'alimentacion.desmonte_chaco',
          titulo_es: 'La Ley de Bosques y el Chaco',
          enunciado_es:
            'La Ley de Bosques obligó a cada provincia a zonificar sus bosques nativos y frenó parte del desmonte, pero en el Chaco el desmonte continúa, sobre todo el ilegal.',
          detalle_es:
            'La ley existe y sirve; lo que se discute es cómo se aplica y cómo se recategorizan las zonas. Ahí hay lugar concreto para participación pública y acceso a la información.',
          fuente: 'ley-bosques-26331',
          anillo: 2,
          dificultad_base: 0.5,
          age_groups: ['teen', 'adult'],
          sensible: true,
          requiere: ['alimentacion.soja_y_frontera'],
        },
        {
          slug: 'alimentacion.agroquimicos_distancias',
          titulo_es: 'Las distancias de aplicación',
          enunciado_es:
            'Las aplicaciones de agroquímicos cerca de casas y escuelas están reguladas por normas provinciales y ordenanzas municipales que fijan distancias mínimas.',
          detalle_es:
            'El principio precautorio de la ley ambiental argentina es lo que sostiene esos límites: cuando hay riesgo de daño grave y falta certeza, se actúa igual.',
          fuente: 'ley-25675-ambiente',
          anillo: 2,
          dificultad_base: 0.4,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: ['tronco.principio_precautorio'],
        },
        {
          slug: 'alimentacion.agroecologia',
          titulo_es: 'Producir con el ecosistema',
          enunciado_es:
            'La agroecología produce apoyándose en procesos del propio ecosistema —rotaciones, cultivos de cobertura, control biológico— para depender menos de insumos comprados.',
          detalle_es:
            'No es una idea de escritorio: el INTA acompaña experiencias agroecológicas en todo el país, incluidas quintas del cinturón hortícola bonaerense.',
          fuente: 'inta',
          anillo: 2,
          dificultad_base: 0.1,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['tronco.servicios_ecosistemicos'],
        },
      ],
      hojas: [
        {
          slug: 'alimentacion.el-campo-y-la-frontera.1',
          titulo_es: 'Adónde fue la frontera',
          bajada_es: 'Soja, grano para animales y tierra que cambia de uso.',
          minutos: 6,
          age_groups: ['teen', 'adult'],
          sort_order: 1,
          conceptos: ['alimentacion.soja_y_frontera', 'alimentacion.desmonte_chaco'],
        },
        {
          slug: 'alimentacion.el-campo-y-la-frontera.2',
          titulo_es: 'Reglas sobre el territorio',
          bajada_es: 'Zonificación, distancias y quién las controla.',
          minutos: 6,
          age_groups: ['teen', 'adult'],
          sort_order: 2,
          conceptos: ['alimentacion.desmonte_chaco', 'alimentacion.agroquimicos_distancias'],
        },
        {
          slug: 'alimentacion.el-campo-y-la-frontera.3',
          titulo_es: 'Otra forma de producir',
          bajada_es: 'Agroecología: menos insumos comprados, más procesos vivos.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 3,
          conceptos: ['alimentacion.agroecologia', 'alimentacion.soja_y_frontera'],
        },
      ],
    },

    {
      slug: 'alimentacion.del-mar-al-plato',
      anillo: 2,
      titulo_es: 'Del mar al plato',
      bajada_es: 'Merluza, cuotas, la milla 201 y qué promete un sello.',
      icono: 'Fish',
      age_groups: ['kid', 'teen', 'adult'],
      sort_order: 7,
      conceptos: [
        {
          slug: 'alimentacion.merluza_y_cuota',
          titulo_es: 'Cuánto se puede sacar',
          enunciado_es:
            'La merluza común es la pesquería más importante del Mar Argentino y se administra con cuotas: cuánto se puede pescar por año y quién puede hacerlo.',
          detalle_es:
            'La cuota existe para que la pesca no se coma su propio stock. Funciona si el número está bien puesto y si alguien controla que se cumpla.',
          fuente: 'fao',
          anillo: 2,
          dificultad_base: 0.2,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['tronco.stock_vs_flujo'],
        },
        {
          slug: 'alimentacion.milla_201',
          titulo_es: 'La milla 201',
          enunciado_es:
            'Justo afuera de la zona económica exclusiva argentina, en lo que se conoce como la milla 201, se concentra cada año una flota extranjera enorme pescando en aguas internacionales.',
          detalle_es:
            'Ahí no rige la cuota argentina, y los peces no saben de líneas en el mapa. Es tanto un problema de gobernanza como de pesca.',
          fuente: 'milla-201',
          anillo: 2,
          dificultad_base: 0.6,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: ['alimentacion.merluza_y_cuota'],
        },
        {
          slug: 'alimentacion.sellos_pesca',
          titulo_es: 'Qué promete un sello',
          enunciado_es:
            'Un sello de pesca sostenible es una certificación de un tercero sobre cómo se pescó, no una opinión de la marca sobre sí misma.',
          detalle_es:
            'La vieira patagónica es una de las pesquerías argentinas que consiguió ese tipo de certificación. Un sello vale lo que valga la auditoría que tiene detrás.',
          fuente: 'fao',
          anillo: 2,
          dificultad_base: 0.3,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['tronco.evidencia_y_fuente'],
        },
        {
          slug: 'alimentacion.acuicultura',
          titulo_es: 'Criar en vez de pescar',
          enunciado_es:
            'Alrededor de la mitad del pescado que se come en el mundo ya no se pesca: se cría, en agua dulce o en el mar.',
          detalle_es:
            'La acuicultura saca presión del mar salvaje, pero trae sus propios temas: con qué se alimenta a los peces, qué sale con el agua y dónde se instalan las jaulas.',
          fuente: 'fao',
          anillo: 2,
          dificultad_base: 0.4,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['alimentacion.merluza_y_cuota'],
        },
      ],
      hojas: [
        {
          slug: 'alimentacion.del-mar-al-plato.1',
          titulo_es: 'La merluza y su cuota',
          bajada_es: 'Un stock, un número anual y una pregunta difícil.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 1,
          conceptos: ['alimentacion.merluza_y_cuota', 'alimentacion.acuicultura'],
        },
        {
          slug: 'alimentacion.del-mar-al-plato.2',
          titulo_es: 'Una línea en el agua',
          bajada_es: 'Qué pasa donde termina la jurisdicción argentina.',
          minutos: 6,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 2,
          conceptos: ['alimentacion.milla_201', 'alimentacion.merluza_y_cuota'],
        },
        {
          slug: 'alimentacion.del-mar-al-plato.3',
          titulo_es: 'Leer la etiqueta del pescado',
          bajada_es: 'Certificaciones: quién las da y qué garantizan.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 3,
          conceptos: ['alimentacion.sellos_pesca', 'alimentacion.merluza_y_cuota'],
        },
        {
          slug: 'alimentacion.del-mar-al-plato.4',
          titulo_es: 'Criar peces',
          bajada_es: 'Lo que la acuicultura resuelve y lo que abre.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 4,
          conceptos: ['alimentacion.acuicultura', 'alimentacion.sellos_pesca'],
        },
      ],
    },
  ],
};
