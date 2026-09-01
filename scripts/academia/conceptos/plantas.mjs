// Rama `plantas` — 32 conceptos, 7 gajos (4 en anillo 1, 3 en anillo 2).
// Puro dato. Sin lógica. Ver scripts/academia/CONTRATO.md.

export default {
  rama: 'plantas',
  gajos: [
    // ───────────────────────────────────────────────────────────── anillo 1
    {
      slug: 'plantas.como-vive-una-planta',
      anillo: 1,
      titulo_es: 'Cómo vive una planta',
      bajada_es: 'Se hace su propia comida con luz y aire, y abajo tiene socios.',
      icono: 'Leaf',
      age_groups: ['kid', 'teen', 'adult'],
      sort_order: 1,
      conceptos: [
        {
          slug: 'plantas.fotosintesis',
          titulo_es: 'La planta se fabrica la comida',
          enunciado_es:
            'Una planta no saca su comida del suelo: la fabrica ella misma con luz del sol, agua y el dióxido de carbono que toma del aire.',
          detalle_es:
            'Del suelo saca agua y minerales, nada más. Buena parte del cuerpo de un árbol es carbono que antes andaba dando vueltas en el aire.',
          fuente: 'naaee-guidelines',
          anillo: 1,
          dificultad_base: -1.2,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [],
        },
        {
          slug: 'plantas.planta_guarda_carbono',
          titulo_es: 'Dónde queda ese carbono',
          enunciado_es:
            'Al fabricar su alimento la planta guarda carbono en su madera, sus raíces y el suelo, y ahí se queda mientras la planta siga en pie.',
          detalle_es:
            'Por eso un árbol viejo no es intercambiable por un plantín: lo que acumuló tardó décadas en acumularse.',
          fuente: 'ipcc-ar6',
          anillo: 1,
          dificultad_base: -0.6,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['plantas.fotosintesis', 'tronco.ciclos_materia'],
        },
        {
          slug: 'plantas.suelo_esta_vivo',
          titulo_es: 'El suelo está vivo',
          enunciado_es:
            'El suelo no es tierra muerta: es un ecosistema lleno de hongos, bacterias, lombrices y bichos que desarman lo que cae y dejan los nutrientes a mano.',
          detalle_es:
            'Un puñado de suelo sano tiene más seres vivos que los que ves en toda la cuadra.',
          fuente: 'fao',
          anillo: 1,
          dificultad_base: -0.9,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [],
        },
        {
          slug: 'plantas.micorrizas',
          titulo_es: 'Socios bajo tierra',
          enunciado_es:
            'La mayoría de las plantas viven asociadas a hongos del suelo: el hongo les acerca agua y nutrientes, y la planta le devuelve azúcares.',
          detalle_es:
            'Esa sociedad se llama micorriza. Es tan común que una planta sola, sin sus hongos, es media planta.',
          fuente: 'fao',
          anillo: 1,
          dificultad_base: -0.4,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['plantas.suelo_esta_vivo', 'tronco.todo_esta_conectado'],
        },
        {
          slug: 'plantas.banco_de_semillas',
          titulo_es: 'Semillas dormidas',
          enunciado_es:
            'Debajo de un pastizal o de un monte hay semillas esperando: se quedan dormidas en el suelo hasta que les llega luz, agua o calor, y ahí germinan.',
          detalle_es:
            'Se lo llama banco de semillas del suelo. Es la memoria del lugar, y es lo primero que se pierde cuando el suelo se raspa o se tapa.',
          fuente: 'inta',
          anillo: 1,
          dificultad_base: -0.3,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['plantas.suelo_esta_vivo'],
        },
      ],
      hojas: [
        {
          slug: 'plantas.como-vive-una-planta.1',
          titulo_es: 'Comida hecha de luz',
          bajada_es: 'De dónde sale, en serio, el cuerpo de un árbol.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 1,
          conceptos: ['plantas.fotosintesis', 'plantas.planta_guarda_carbono'],
        },
        {
          slug: 'plantas.como-vive-una-planta.2',
          titulo_es: 'Abajo también hay vida',
          bajada_es: 'Un puñado de tierra, mirado de cerca.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 2,
          conceptos: ['plantas.suelo_esta_vivo', 'plantas.micorrizas'],
        },
        {
          slug: 'plantas.como-vive-una-planta.3',
          titulo_es: 'Lo que espera bajo tierra',
          bajada_es: 'Semillas dormidas, y por qué conviene no raspar el suelo.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 3,
          conceptos: [
            'plantas.banco_de_semillas',
            'plantas.suelo_esta_vivo',
            'plantas.fotosintesis',
          ],
        },
      ],
    },

    {
      slug: 'plantas.nativas-y-exoticas',
      anillo: 1,
      titulo_es: 'Nativas, exóticas e invasoras',
      bajada_es: 'De acá, de allá, y las que se van de mambo.',
      icono: 'Flower2',
      age_groups: ['kid', 'teen', 'adult'],
      sort_order: 2,
      conceptos: [
        {
          slug: 'plantas.que_es_nativa',
          titulo_es: 'Qué es una planta nativa',
          enunciado_es:
            'Una planta nativa es la que ya vivía en tu región antes de que la trajéramos nosotros: se hizo ahí, junto con los bichos, los pájaros y el suelo del lugar.',
          detalle_es:
            'Por eso una nativa suele alimentar y alojar a mucha más fauna local que una traída de lejos.',
          fuente: 'plantas-nativas',
          anillo: 1,
          dificultad_base: -1.1,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [],
        },
        {
          slug: 'plantas.exotica_no_es_invasora',
          titulo_es: 'Exótica no es lo mismo que invasora',
          enunciado_es:
            'Exótica es la que vino de otro lado; invasora es la exótica que además se escapa del jardín, se reproduce sola y va desplazando a las nativas.',
          detalle_es:
            'El jacarandá que pinta la ciudad de violeta es exótico y está naturalizado hace más de un siglo, y no por eso se comió el monte.',
          fuente: 'invasoras-mayds',
          anillo: 1,
          dificultad_base: -0.5,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['plantas.que_es_nativa'],
        },
        {
          slug: 'plantas.ceibo_y_compania',
          titulo_es: 'Ceibo, sauce criollo y compañía',
          enunciado_es:
            'La flora nativa rioplatense tiene nombre y apellido: el ceibo —nuestra flor nacional—, el sauce criollo, el aliso de río, el curupí, el laurel blanco y el timbó.',
          detalle_es:
            'Son las que crecen solas en la costa y en las islas del Paraná, sin que nadie las riegue.',
          fuente: 'plantas-nativas',
          anillo: 1,
          dificultad_base: -0.8,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [],
        },
        {
          slug: 'plantas.ombu_no_es_arbol',
          titulo_es: 'El ombú no es un árbol',
          enunciado_es:
            'El ombú no es un árbol: es una hierba gigante. Su tronco no tiene madera dura, está cargado de agua, y por eso se raja y se dobla como se dobla.',
          detalle_es:
            'Fijate la próxima vez que pases por uno: parece derretido. Esa forma es la pista.',
          fuente: 'plantas-nativas',
          anillo: 1,
          dificultad_base: -0.7,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [],
        },
        {
          slug: 'plantas.tu_ecorregion',
          titulo_es: 'En qué ecorregión estás',
          enunciado_es:
            'Antes de elegir qué plantar conviene saber en qué ecorregión vivís: el AMBA cae entre el Pastizal Pampeano y el Delta e Islas del Paraná, y cada uno tiene su propia lista de nativas.',
          detalle_es:
            '"Nativa de Argentina" no alcanza: una especie de la Selva Paranaense es tan forastera en la Pampa como una traída de otro continente.',
          fuente: 'ecorregiones-pba',
          anillo: 1,
          dificultad_base: -0.4,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['plantas.que_es_nativa', 'tronco.escala_local_global'],
        },
        {
          slug: 'plantas.plantar_la_correcta',
          titulo_es: 'Plantar bien, no plantar y ya',
          enunciado_es:
            'Plantar suma cuando la especie es la que corresponde a esa ecorregión y a ese lugar; con la especie equivocada, la misma pala puede restar.',
          detalle_es:
            'Elegí nativa de tu ecorregión, mirá cuánto sol tiene el lugar y cuánto va a crecer en veinte años. Con eso ya estás jugando bien.',
          fuente: 'plantas-nativas',
          anillo: 1,
          dificultad_base: -0.3,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['plantas.exotica_no_es_invasora', 'plantas.tu_ecorregion'],
          misconceptions: [
            {
              slug: 'plantas.mito_cualquier_arbol',
              creencia_es: 'Sembrar cualquier árbol es bueno para el ambiente.',
              correccion_es:
                'Es tentador porque plantar se siente siempre como sumar, y un árbol es un árbol. Pero plantar exóticas como el ligustro o la acacia negra puede terminar invadiendo ecosistemas nativos y bajando la biodiversidad del lugar: lo que decide el resultado es la especie, no el gesto.',
              fuente: 'invasoras-mayds',
            },
          ],
        },
      ],
      hojas: [
        {
          slug: 'plantas.nativas-y-exoticas.1',
          titulo_es: 'De acá o de allá',
          bajada_es: 'Tres palabras que la gente usa como si fueran una sola.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 1,
          conceptos: ['plantas.que_es_nativa', 'plantas.exotica_no_es_invasora'],
        },
        {
          slug: 'plantas.nativas-y-exoticas.2',
          titulo_es: 'Las de la costa y las islas',
          bajada_es: 'Ceibo, sauce criollo, curupí, y un ombú que no es árbol.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 2,
          conceptos: ['plantas.ceibo_y_compania', 'plantas.ombu_no_es_arbol'],
        },
        {
          slug: 'plantas.nativas-y-exoticas.3',
          titulo_es: 'Tu ecorregión',
          bajada_es: 'Pastizal o Delta: dos listas distintas a media hora una de otra.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 3,
          conceptos: ['plantas.tu_ecorregion', 'plantas.que_es_nativa'],
        },
        {
          slug: 'plantas.nativas-y-exoticas.4',
          titulo_es: 'Antes de agarrar la pala',
          bajada_es: 'Cómo elegir la especie para que el esfuerzo rinda.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 4,
          conceptos: [
            'plantas.plantar_la_correcta',
            'plantas.exotica_no_es_invasora',
            'plantas.tu_ecorregion',
          ],
        },
      ],
    },

    {
      slug: 'plantas.el-arbol-de-tu-cuadra',
      anillo: 1,
      titulo_es: 'El árbol de tu cuadra',
      bajada_es: 'Sombra, lluvia y unos grados menos: lo que hace mientras no lo mirás.',
      icono: 'Trees',
      age_groups: ['kid', 'teen', 'adult'],
      sort_order: 3,
      conceptos: [
        {
          slug: 'plantas.arbolado_urbano',
          titulo_es: 'El arbolado trabaja para la cuadra',
          enunciado_es:
            'El árbol de la vereda hace trabajo para todos: da sombra, frena el viento, intercepta parte del polvo fino del aire y baja la temperatura de la calle.',
          detalle_es:
            'En las veredas porteñas conviven tipa, palo borracho y jacarandá, cada uno con su tamaño y su época de flor.',
          fuente: 'ipbes-global',
          anillo: 1,
          dificultad_base: -1.0,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [],
        },
        {
          slug: 'plantas.isla_de_calor',
          titulo_es: 'La isla de calor urbana',
          enunciado_es:
            'Una zona con mucho asfalto, techo y cemento y poca vegetación queda más caliente que su entorno: es la isla de calor urbana.',
          detalle_es:
            'El asfalto guarda calor todo el día y lo suelta de noche. Vegetación y sombra son la forma más barata de bajar esa diferencia.',
          fuente: 'epa',
          anillo: 1,
          dificultad_base: -0.5,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [],
        },
        {
          slug: 'plantas.arboles_y_lluvia',
          titulo_es: 'Cuando llueve fuerte',
          enunciado_es:
            'Las copas frenan la lluvia antes de que toque el piso y las raíces la ayudan a entrar en la tierra: así llega menos agua de golpe a la boca de tormenta.',
          detalle_es:
            'Cada cantero sin baldosa es una entrada de agua. Muchos canteros seguidos son una esquina que se inunda menos.',
          fuente: 'epa',
          anillo: 1,
          dificultad_base: -0.3,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [{ slug: 'plantas.arbolado_urbano', fuerza: 0.5 }],
        },
        {
          slug: 'plantas.techos_y_muros_verdes',
          titulo_es: 'Verde donde no hay suelo',
          enunciado_es:
            'Un techo o un muro verde mete vegetación donde no hay tierra: aísla del calor, retiene parte del agua de lluvia y da de comer a los polinizadores.',
          detalle_es:
            'No reemplaza a un árbol grande, pero en una ciudad con poco suelo libre es metros cuadrados que antes no jugaban.',
          fuente: 'epa',
          anillo: 1,
          dificultad_base: -0.2,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['plantas.isla_de_calor'],
        },
      ],
      hojas: [
        {
          slug: 'plantas.el-arbol-de-tu-cuadra.1',
          titulo_es: 'Unos grados menos',
          bajada_es: 'Por qué la vereda con árboles se siente otra cosa en enero.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 1,
          conceptos: ['plantas.arbolado_urbano', 'plantas.isla_de_calor'],
        },
        {
          slug: 'plantas.el-arbol-de-tu-cuadra.2',
          titulo_es: 'Dónde va el agua del chaparrón',
          bajada_es: 'Copas, raíces y la boca de tormenta de la esquina.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 2,
          conceptos: ['plantas.arboles_y_lluvia', 'plantas.arbolado_urbano'],
        },
        {
          slug: 'plantas.el-arbol-de-tu-cuadra.3',
          titulo_es: 'Techos y muros que respiran',
          bajada_es: 'Verde en la ciudad cuando no queda tierra libre.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 3,
          conceptos: ['plantas.techos_y_muros_verdes', 'plantas.isla_de_calor'],
        },
      ],
    },

    {
      slug: 'plantas.huerta-y-semillas',
      anillo: 1,
      titulo_es: 'Huerta y semillas',
      bajada_es: 'Un cajón, sol unas horas, y tierra que vuelve a ser tierra.',
      icono: 'Carrot',
      age_groups: ['kid', 'teen', 'adult'],
      sort_order: 4,
      conceptos: [
        {
          slug: 'plantas.huerta_urbana',
          titulo_es: 'Una huerta entra en un balcón',
          enunciado_es:
            'Para arrancar una huerta alcanza con un cajón, unas horas de sol directo, tierra viva y agua: lechuga, acelga, rúcula y aromáticas andan bien en poco espacio.',
          detalle_es:
            'Empezá por lo que ya comés. Una planta que cosechás es una planta que vas a seguir cuidando.',
          fuente: 'inta',
          anillo: 1,
          dificultad_base: -1.0,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [],
        },
        {
          slug: 'plantas.prohuerta',
          titulo_es: 'ProHuerta existe y es gratis',
          enunciado_es:
            'ProHuerta, del INTA, acompaña huertas familiares, escolares y comunitarias en todo el país con semillas y capacitación sin costo.',
          detalle_es:
            'Si en tu escuela o tu barrio quieren armar una huerta, ese es el teléfono al que conviene llamar primero.',
          fuente: 'inta',
          anillo: 1,
          dificultad_base: -0.7,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [],
        },
        {
          slug: 'plantas.compost_cierra_ciclo',
          titulo_es: 'El compost cierra el ciclo',
          enunciado_es:
            'Las cáscaras de fruta y verdura no son basura: compostadas vuelven a ser suelo y alimentan a la próxima planta.',
          detalle_es:
            'Es el ciclo de la materia haciéndose en un balde, a la vista, en tu casa.',
          fuente: 'ellen-macarthur',
          anillo: 1,
          dificultad_base: -0.6,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['plantas.suelo_esta_vivo', 'tronco.ciclos_materia'],
        },
        {
          slug: 'plantas.asociacion_y_rotacion',
          titulo_es: 'Asociar y rotar',
          enunciado_es:
            'Poner juntos cultivos que se ayudan, y cambiarlos de cantero cada temporada, corta el ciclo de las plagas y evita que el suelo se agote siempre del mismo nutriente.',
          detalle_es:
            'Es la misma idea que en un ecosistema: la mezcla aguanta mejor que el monocultivo.',
          fuente: 'inta',
          anillo: 1,
          dificultad_base: -0.3,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['plantas.huerta_urbana', 'plantas.suelo_esta_vivo'],
        },
        {
          slug: 'plantas.semilla_criolla',
          titulo_es: 'Criolla, híbrida, transgénica',
          enunciado_es:
            'Una semilla criolla la guardás de tu propia cosecha y vuelve a dar una planta parecida; una híbrida no: su descendencia sale despareja, por eso hay que comprarla de nuevo cada año.',
          detalle_es:
            'Transgénica es otra cosa: lleva un gen agregado en laboratorio y se usa sobre todo en cultivos extensivos, no en el cajón del balcón.',
          fuente: 'inta',
          anillo: 1,
          dificultad_base: -0.2,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: [{ slug: 'plantas.huerta_urbana', fuerza: 0.5 }],
        },
      ],
      hojas: [
        {
          slug: 'plantas.huerta-y-semillas.1',
          titulo_es: 'Arrancar con un cajón',
          bajada_es: 'Lo mínimo que hace falta, y quién te da una mano.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 1,
          conceptos: ['plantas.huerta_urbana', 'plantas.prohuerta'],
        },
        {
          slug: 'plantas.huerta-y-semillas.2',
          titulo_es: 'Que el suelo no se canse',
          bajada_es: 'Compost, asociación y rotación: tres movimientos, un mismo suelo.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 2,
          conceptos: ['plantas.compost_cierra_ciclo', 'plantas.asociacion_y_rotacion'],
        },
        {
          slug: 'plantas.huerta-y-semillas.3',
          titulo_es: 'Guardar semilla',
          bajada_es: 'Por qué de algunas se guarda y de otras no.',
          minutos: 4,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 3,
          conceptos: ['plantas.semilla_criolla', 'plantas.huerta_urbana'],
        },
      ],
    },

    // ───────────────────────────────────────────────────────────── anillo 2
    {
      slug: 'plantas.pastizal-y-monte',
      anillo: 2,
      titulo_es: 'Pastizal y monte',
      bajada_es: 'Los ecosistemas de acá, los que casi nadie llama ecosistemas.',
      icono: 'Wheat',
      age_groups: ['kid', 'teen', 'adult'],
      sort_order: 5,
      conceptos: [
        {
          slug: 'plantas.pastizal_pampeano',
          titulo_es: 'La Pampa es un pastizal',
          enunciado_es:
            'La Pampa no es un campo vacío esperando algo: es un pastizal, un ecosistema hecho de decenas de gramíneas nativas, y ocupa la mayor parte del territorio bonaerense.',
          detalle_es:
            'Como es bajo y sin árboles, cuesta verlo como bosque o como selva. Pero es un ecosistema completo, con sus lagunas y su fauna.',
          fuente: 'ecorregiones-pba',
          anillo: 2,
          dificultad_base: -0.2,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['plantas.que_es_nativa', 'tronco.que_es_ecosistema'],
        },
        {
          slug: 'plantas.raices_del_pastizal',
          titulo_es: 'La mitad que está abajo',
          enunciado_es:
            'Buena parte del pastizal vive bajo tierra: sus raíces profundas sostienen el suelo, guardan materia orgánica y carbono, y por eso el suelo pampeano es tan rico.',
          detalle_es:
            'Cuando se da vuelta ese suelo, lo que se pierde primero es lo que no se veía.',
          fuente: 'ecorregiones-pba',
          anillo: 2,
          dificultad_base: 0.2,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['plantas.pastizal_pampeano', 'plantas.suelo_esta_vivo'],
        },
        {
          slug: 'plantas.monte_blanco_delta',
          titulo_es: 'El monte blanco del Delta',
          enunciado_es:
            'El "monte blanco" es el bosque ribereño propio del Delta del Paraná: varias capas de nativas —sauce criollo, aliso de río, curupí, laurel blanco— sobre un suelo que se inunda y se seca.',
          detalle_es:
            'Está muy reducido, y donde queda es la mejor referencia de qué plantar cuando se restaura la ribera.',
          fuente: 'ecorregiones-pba',
          anillo: 2,
          dificultad_base: 0.0,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['plantas.ceibo_y_compania', 'plantas.tu_ecorregion'],
        },
        {
          slug: 'plantas.sucesion_ecologica',
          titulo_es: 'Lo que pasa si nadie toca',
          enunciado_es:
            'Un terreno que queda quieto no se queda quieto: primero llegan las pioneras, después otras, y la comunidad va cambiando durante años. Eso es la sucesión ecológica.',
          detalle_es:
            'La Reserva Ecológica Costanera Sur es el caso a la vista: un relleno costero al lado del centro que se fue cubriendo de vegetación y hoy es reserva.',
          fuente: 'reserva-costanera-sur',
          anillo: 2,
          dificultad_base: 0.1,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['plantas.banco_de_semillas', 'tronco.que_es_ecosistema'],
        },
      ],
      hojas: [
        {
          slug: 'plantas.pastizal-y-monte.1',
          titulo_es: 'El pastizal que no se ve',
          bajada_es: 'Un ecosistema entero disfrazado de campo.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 1,
          conceptos: ['plantas.pastizal_pampeano', 'plantas.raices_del_pastizal'],
        },
        {
          slug: 'plantas.pastizal-y-monte.2',
          titulo_es: 'El bosque de la ribera',
          bajada_es: 'Qué había en el Delta antes, y qué queda.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 2,
          conceptos: ['plantas.monte_blanco_delta', 'plantas.pastizal_pampeano'],
        },
        {
          slug: 'plantas.pastizal-y-monte.3',
          titulo_es: 'Un relleno que se hizo reserva',
          bajada_es: 'La sucesión ecológica, contada por la Costanera Sur.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 3,
          conceptos: ['plantas.sucesion_ecologica', 'plantas.monte_blanco_delta'],
        },
      ],
    },

    {
      slug: 'plantas.invasoras-y-restauracion',
      anillo: 2,
      titulo_es: 'Invasoras y restauración',
      bajada_es: 'Las tres que ya conocés de vista, y qué se hace después de sacarlas.',
      icono: 'Sprout',
      age_groups: ['kid', 'teen', 'adult'],
      sort_order: 6,
      conceptos: [
        {
          slug: 'plantas.ligustro_mora_acacia',
          titulo_es: 'Ligustro, mora y acacia negra',
          enunciado_es:
            'En el Delta y en el AMBA hay tres invasoras que ya conocés de vista aunque no supieras el nombre: el ligustro, la mora y la acacia negra.',
          detalle_es:
            'Crecen rápido, dan muchísima semilla y los pájaros se la llevan lejos. Por eso aparecen solas en cualquier terreno.',
          fuente: 'invasoras-mayds',
          anillo: 2,
          dificultad_base: -0.3,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['plantas.exotica_no_es_invasora'],
        },
        {
          slug: 'plantas.por_que_invade',
          titulo_es: 'Por qué una planta invade',
          enunciado_es:
            'Una exótica se vuelve invasora cuando llega a un lugar donde no están los hongos, insectos y herbívoros que la mantenían a raya en su tierra: crece sin freno y le va ganando el lugar a las nativas.',
          detalle_es:
            'No es que la planta sea mala: es que le falta la mitad de sus relaciones. La invasión es un problema de red, no de especie.',
          fuente: 'invasoras-mayds',
          anillo: 2,
          dificultad_base: 0.3,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['plantas.ligustro_mora_acacia', 'tronco.todo_esta_conectado'],
        },
        {
          slug: 'plantas.restaurar_no_es_deshacer',
          titulo_es: 'Restaurar no es apretar deshacer',
          enunciado_es:
            'Volver a armar un ambiente que se perdió lleva años y nunca queda idéntico: el suelo, sus hongos y las relaciones entre especies no vuelven porque uno plante.',
          detalle_es:
            'Restaurar se hace por etapas y con seguimiento: sacar lo invasor, reponer nativas, volver el año siguiente a ver qué prendió.',
          fuente: 'ipbes-global',
          anillo: 2,
          dificultad_base: 0.5,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['plantas.sucesion_ecologica', 'plantas.micorrizas'],
          misconceptions: [
            {
              slug: 'plantas.mito_replantar_queda_igual',
              creencia_es:
                'Si un ecosistema se destruye, después se replanta y queda igual.',
              correccion_es:
                'La trampa es que las plantas se ven y vuelven: en dos años hay verde otra vez y parece resuelto. Lo que no vuelve a pedido es lo que no se ve — el banco de semillas, los hongos del suelo, quién poliniza a quién. La restauración es lenta, parcial y cara, y por eso cuidar lo que sigue en pie rinde muchísimo más que repararlo después.',
              fuente: 'ipbes-global',
            },
          ],
        },
        {
          slug: 'plantas.corredores_y_polinizadores',
          titulo_es: 'Canteros que conectan',
          enunciado_es:
            'Un cantero con nativas floridas es una parada de comida para abejas nativas y mariposas; varios canteros cerca uno de otro arman un corredor por el que la fauna puede moverse.',
          detalle_es:
            'Un balcón solo alcanza para poco. Un balcón, la plaza y el cantero de la escuela ya son un recorrido.',
          fuente: 'plantas-nativas',
          anillo: 2,
          dificultad_base: 0.0,
          age_groups: ['kid', 'teen', 'adult'],
          sensible: false,
          requiere: ['plantas.plantar_la_correcta', 'tronco.individual_y_colectivo'],
        },
      ],
      hojas: [
        {
          slug: 'plantas.invasoras-y-restauracion.1',
          titulo_es: 'Tres que ya conocés de vista',
          bajada_es: 'Ligustro, mora y acacia negra, y por qué les va tan bien acá.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 1,
          conceptos: ['plantas.ligustro_mora_acacia', 'plantas.por_que_invade'],
        },
        {
          slug: 'plantas.invasoras-y-restauracion.2',
          titulo_es: 'Después de sacarlas',
          bajada_es: 'Qué se repone, cuánto tarda y por qué hay que volver.',
          minutos: 6,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 2,
          conceptos: ['plantas.restaurar_no_es_deshacer', 'plantas.por_que_invade'],
        },
        {
          slug: 'plantas.invasoras-y-restauracion.3',
          titulo_es: 'Un corredor hecho de canteros',
          bajada_es: 'Tu balcón, la plaza y la escuela como un mismo recorrido.',
          minutos: 5,
          age_groups: ['kid', 'teen', 'adult'],
          sort_order: 3,
          conceptos: ['plantas.corredores_y_polinizadores', 'plantas.ligustro_mora_acacia'],
        },
      ],
    },

    {
      slug: 'plantas.bosques-y-ley',
      anillo: 2,
      titulo_es: 'Bosques y ley',
      bajada_es: 'Qué dice la Ley de Bosques, qué es el OTBN y de qué color es tu parcela.',
      icono: 'Scale',
      age_groups: ['teen', 'adult'],
      sort_order: 7,
      conceptos: [
        {
          slug: 'plantas.deforestacion_chaco',
          titulo_es: 'El Gran Chaco, la frontera abierta',
          enunciado_es:
            'El Gran Chaco es la frontera de desmonte más activa de la Argentina: se abre monte xerófilo de quebracho para agricultura y ganadería.',
          detalle_es:
            'Cuando se va el monte no se va solo el árbol: se van el suelo que sostenía, el agua que infiltraba y las especies que vivían ahí.',
          fuente: 'ipbes-global',
          anillo: 2,
          dificultad_base: 0.2,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: ['plantas.tu_ecorregion', 'tronco.escala_local_global'],
        },
        {
          slug: 'plantas.ley_bosques',
          titulo_es: 'La Ley de Bosques y sus tres colores',
          enunciado_es:
            'La Ley 26.331 fija presupuestos mínimos para los bosques nativos y obliga a cada provincia a clasificarlos en tres categorías: rojo, que no se puede transformar; amarillo, de uso sostenible; y verde, transformable.',
          detalle_es:
            'También creó un fondo nacional para conservar y enriquecer bosque. Es una ley de piso: cada provincia puede ser más exigente, no menos.',
          fuente: 'ley-bosques-26331',
          anillo: 2,
          dificultad_base: 0.4,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: ['plantas.deforestacion_chaco', 'tronco.presupuestos_minimos'],
          misconceptions: [
            {
              slug: 'plantas.mito_deforestacion_frenada',
              creencia_es:
                'La deforestación en Argentina ya se frenó con la Ley de Bosques.',
              correccion_es:
                'Es tentador porque la ley existe, es buena y efectivamente hizo caer el ritmo de desmonte: parece un problema con la casilla ya tildada. Pero una ley sancionada no es una ley cumplida: sigue habiendo desmonte ilegal, sobre todo en el Chaco, y las recategorizaciones del OTBN provincial se discuten caso por caso. Que exista la norma es el principio del control, no el final.',
              fuente: 'ley-bosques-26331',
            },
          ],
        },
        {
          slug: 'plantas.otbn_es_un_mapa',
          titulo_es: 'El OTBN es un mapa que podés mirar',
          enunciado_es:
            'El Ordenamiento Territorial de Bosques Nativos es el mapa provincial que dice de qué categoría es cada parcela de bosque, y es información pública.',
          detalle_es:
            'Antes de opinar sobre un desmonte se puede mirar el mapa y ver de qué color estaba pintado ese lote. Eso cambia bastante la conversación.',
          fuente: 'ley-bosques-26331',
          anillo: 2,
          dificultad_base: 0.6,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: ['plantas.ley_bosques', 'tronco.acceso_informacion'],
        },
        {
          slug: 'plantas.plantar_no_compensa_desmontar',
          titulo_es: 'Plantar no borra desmontar',
          enunciado_es:
            'Una plantación no reemplaza a un bosque nativo: puede dar madera, sombra y algo de carbono guardado, pero no devuelve la trama de especies ni el suelo que había.',
          detalle_es:
            'Por eso "planto mil árboles allá" no cancela "desmonto acá": son ecosistemas distintos, en lugares distintos, con historias distintas.',
          fuente: 'ipbes-global',
          anillo: 2,
          dificultad_base: 0.6,
          age_groups: ['teen', 'adult'],
          sensible: false,
          requiere: [
            'plantas.restaurar_no_es_deshacer',
            'tronco.compensacion_no_es_evitar',
          ],
        },
      ],
      hojas: [
        {
          slug: 'plantas.bosques-y-ley.1',
          titulo_es: 'Dónde se desmonta',
          bajada_es: 'El Chaco, y qué ley se escribió por eso.',
          minutos: 6,
          age_groups: ['teen', 'adult'],
          sort_order: 1,
          conceptos: ['plantas.deforestacion_chaco', 'plantas.ley_bosques'],
        },
        {
          slug: 'plantas.bosques-y-ley.2',
          titulo_es: 'Rojo, amarillo y verde',
          bajada_es: 'Cómo leer el mapa que decide qué se puede tocar.',
          minutos: 6,
          age_groups: ['teen', 'adult'],
          sort_order: 2,
          conceptos: ['plantas.ley_bosques', 'plantas.otbn_es_un_mapa'],
        },
        {
          slug: 'plantas.bosques-y-ley.3',
          titulo_es: 'La cuenta que no cierra',
          bajada_es: 'Por qué plantar en otro lado no cancela lo que se desmontó acá.',
          minutos: 6,
          age_groups: ['teen', 'adult'],
          sort_order: 3,
          conceptos: ['plantas.plantar_no_compensa_desmontar', 'plantas.deforestacion_chaco'],
        },
      ],
    },
  ],
};
