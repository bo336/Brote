// ─────────────────────────────────────────────────────────────────────────────
// Los caminos (docs/ACCIONES.md §4.3): recorridos de 3 a 6 acciones que van
// de lo más fácil a lo más comprometido. Cada acción está en un solo camino,
// y ninguno usa acciones de temporada o regionales (se tienen que poder
// recorrer todo el año, en todo el país). Un camino se le muestra a quien
// puede hacer todos sus pasos por edad y contexto (compost y huerta no
// cuentan: se ganan en el mismo camino).
// ─────────────────────────────────────────────────────────────────────────────

export const CAMINOS = [
  {
    slug: 'ducha-y-bano', dom: 'agua', titulo: 'El agua del baño',
    desc: 'Del gesto de la canilla a encontrar la pérdida que nadie ve: el baño es donde más agua se va en una casa.',
    pasos: ['cerra-la-canilla-mientras-te-cepillas-o-enjabona', 'agua-cerrar-mientras-shampoo', 'ducha-corta-5-min', 'agua-balde-ducha-fria', 'agua-medi-tu-ducha', 'agua-revisar-perdida-inodoro'],
  },
  {
    slug: 'separar-en-serio', dom: 'residuos', titulo: 'Separar en serio',
    desc: 'Saber cuándo pasa el camión, tener dónde separar, hacerlo bien y que llegue a quien lo recupera.',
    pasos: ['res-averigua-dia-reciclables', 'arma-una-estacion-de-separacion-de-residuos-en-c', 'separa-bien-tus-residuos-hoy', 'res-enjuagar-reciclables', 'res-recuperador-urbano'],
  },
  {
    slug: 'compost-en-casa', dom: 'residuos', titulo: 'Compost en casa',
    desc: 'De la yerba en la maceta a tu propia tierra negra: la mitad de tu basura puede volver a ser suelo.',
    pasos: ['res-yerba-a-la-planta', 'empeza-a-compostar-en-casa', 'composta-tus-restos-de-comida', 'res-compost-cosecha', 'arma-un-cantero-alimentado-con-compost'],
  },
  {
    slug: 'cocina-sin-desperdicio', dom: 'alimentacion', titulo: 'Cocina sin desperdicio',
    desc: 'Que no se pierda nada de lo que comprás: primero lo que vence, porciones justas, freezer, heladera ordenada y un menú.',
    pasos: ['res-primero-lo-que-vence', 'ali-porcion-justa', 'alim-congela-lo-que-sobro', 'ali-heladera-ordenada', 'planifica-tus-comidas-para-no-comprar-de-mas', 'ali-caldo-con-restos'],
  },
  {
    slug: 'casa-sin-consumo-fantasma', dom: 'energia', titulo: 'Casa sin consumo fantasma',
    desc: 'Lo que queda enchufado sin usarse puede ser hasta el 15% de la luz del año. Cazalo de a poco.',
    pasos: ['energia-desenchufar-cargadores', 'desenchufa-los-aparatos-que-no-estas-usando', 'energia-regleta-al-salir', 'ene-apagar-router-noche', 'activa-los-modos-de-ahorro-de-energia', 'cambia-todas-las-lamparas-a-led'],
  },
  {
    slug: 'cocina-eficiente', dom: 'energia', titulo: 'La cocina que gasta menos gas',
    desc: 'Tapa, llama justa, el horno sólo cuando vale la pena, y una heladera bien regulada.',
    pasos: ['cocina-con-tapa-y-aprovecha-el-calor', 'ener-elegi-la-hornalla-del-tamano-justo', 'ene-apagar-antes', 'energia-microondas-vs-horno', 'ene-llama-azul', 'ene-heladera-temperatura'],
  },
  {
    slug: 'mate-bien-hecho', dom: 'energia', titulo: 'El mate, bien hecho',
    desc: 'La pava justa, sin hervir, el termo para toda la tarde y una pava sin sarro: el ritual de todos los días, sin gastar de más.',
    pasos: ['energia-pava-justa', 'ene-mate-sin-hervir', 'ene-termo-no-recalentar', 'ene-pava-sin-sarro'],
  },
  {
    slug: 'moverte-liviano', dom: 'movilidad', titulo: 'Moverte liviano',
    desc: 'De bajarte una parada antes a una semana entera yendo a pie o en bici a todo lo cercano.',
    pasos: ['mov-bajar-una-parada-antes', 'camina-un-trayecto-en-vez-de-ir-en-auto', 'mov-caminar-a-comprar', 'usa-transporte-publico-hoy', 'mov-semana-a-pie-o-bici'],
  },
  {
    slug: 'en-bici', dom: 'movilidad', titulo: 'La bici, de verdad',
    desc: 'Una bici lista, una ruta segura, los primeros viajes y saber arreglarla: hasta poder enseñarle a otro.',
    pasos: ['mov-mantene-la-bici', 'mov-ensenar-ruta-segura', 'anda-en-bici-a-algun-lado-hoy', 'mov-taller-de-bici', 'mov-ensenar-a-andar-en-bici'],
  },
  {
    slug: 'balcon-vivo', dom: 'plantas', titulo: 'Balcón vivo',
    desc: 'De una semilla de lo que comiste a un balcón con plantas nativas, agua para las aves y refugio para abejas.',
    pasos: ['pla-semillas-de-lo-que-comes', 'ali-huerta-aromaticas', 'plant-multiplica-por-esqueje', 'pla-nativa-en-vez-de-exotica', 'pone-un-comedero-o-bebedero-para-aves', 'construi-un-hotel-de-insectos-o-casa-para-abejas'],
  },
  {
    slug: 'huerta-en-casa', dom: 'plantas', titulo: 'Tu primera huerta',
    desc: 'Armarla, cuidar la tierra, sembrar de estación, cosechar y guardar tus propias semillas.',
    pasos: ['empeza-una-huerta-en-el-balcon-o-ventana', 'cubri-los-canteros-con-mantillo', 'cultiva-tus-propias-verduras-o-hierbas', 'pla-huerta-cosecha', 'plant-guarda-semillas'],
  },
  {
    slug: 'amigo-de-las-aves', dom: 'animales', titulo: 'Amigo de las aves',
    desc: 'Vidrios que no matan, qué hacer con un pichón, a quién llamar, nunca comprar fauna y noches más oscuras.',
    pasos: ['pone-calcomanias-anti-choque-en-las-ventanas', 'ani-pichon-caido', 'reporta-fauna-herida-a-un-centro-de-rescate', 'ani-no-comprar-fauna-silvestre', 'anim-apaga-las-luces-de-noche'],
  },
  {
    slug: 'ojos-de-naturalista', dom: 'ciencia', titulo: 'Ojos de naturalista',
    desc: 'Mirar, reconocer y registrar: de cinco minutos en la ventana a tus primeros datos para la ciencia.',
    pasos: ['cie-cinco-minutos-ventana', 'anim-identifica-las-aves-de-tu-cuadra', 'cie-fotografiar-planta', 'registra-una-observacion-de-biodiversidad', 'hace-un-conteo-de-aves'],
  },
  {
    slug: 'pequeno-naturalista', dom: 'ciencia', titulo: 'Pequeño naturalista',
    desc: 'Un poroto que nace, un metro cuadrado lleno de vida, tu primer dibujo de un animal y un cuaderno propio.',
    pasos: ['pla-germinar-poroto', 'mision-un-metro-cuadrado', 'mision-dibuja-un-animal', 'cie-cuaderno-de-campo', 'ciencia-mide-la-contaminacion-luminica'],
  },
  {
    slug: 'guardian-de-casa', dom: 'energia', titulo: 'Guardián de tu casa',
    desc: 'Cinco misiones para chicos: las luces, el agua, el stand-by, los carteles y la basura de tu casa.',
    pasos: ['mision-guardian-de-luces', 'agua-guardian-del-dia', 'ene-detective-stand-by', 'mision-cartel-en-casa', 'mision-detective-basura'],
  },
  {
    slug: 'comprar-mejor', dom: 'consumo', titulo: 'Comprar mejor',
    desc: 'La lista, esperar un día, usar lo que ya tenés, lo usado, reparar e intercambiar.',
    pasos: ['con-lista-y-nada-mas', 'con-espera-24-horas', 'con-usa-lo-que-ya-tenes', 'compra-ropa-de-segunda-mano-o-vintage', 'repara-algo-en-vez-de-tirarlo', 'organiza-o-participa-de-un-intercambio-de-ropa'],
  },
  {
    slug: 'vecino-activo', dom: 'comunidad', titulo: 'Vecino activo',
    desc: 'De levantar una botella de la vereda a organizar la limpieza del barrio.',
    pasos: ['recoge-un-poco-de-basura-que-viste-en-la-calle', 'com-agradecer-a-quien-cuida', 'com-ayudar-vecino-reciclar', 'com-reportar-basural', 'organiza-o-sumate-a-una-limpieza-del-barrio'],
  },
  {
    slug: 'escuela-verde', dom: 'comunidad', titulo: 'Escuela verde',
    desc: 'La colación sin envoltorios, el papel de los dos lados, las luces del recreo y una propuesta para toda la escuela.',
    pasos: ['escuela-colacion-sin-envoltorio', 'res-papel-de-los-dos-lados', 'ene-aula-luces-recreo', 'com-propone-el-tema-en-la-escuela'],
  },
  {
    slug: 'oficina-verde', dom: 'comunidad', titulo: 'Trabajo verde',
    desc: 'Tu taza, tu puesto apagado, la impresora, la heladera compartida y una propuesta para todo el equipo.',
    pasos: ['trabajo-taza-propia', 'ene-oficina-apagar-puesto', 'trabajo-impresora-doble-faz', 'trabajo-heladera-compartida', 'com-proponer-en-el-trabajo'],
  },
];
