// ─────────────────────────────────────────────────────────────────────────────
// ac_fuentes — the grounding backbone of the Academia.
//
// Nothing factual exists in this section without a row here. Every concepto,
// every misconception and every plantilla points at a `slug` from this file,
// and `gen-academia-seed.mjs` FAILS THE BUILD if one of them points at a slug
// that is not defined here. That check is the whole point of the file.
//
// `contenido` is the passage used for grounding. It is transcribed from
// `ACADEMIA/research/03-environmental-curriculum.md`, which AGENT-RULES §4
// names as the content source for Phase 1 ("Use it. Do not paraphrase from
// memory."). It is NOT a scrape of the cited URL, so `verificado_at` is left
// null on purpose: Phase 3's pipeline re-fetches each URL and stamps the date
// once the passage has been checked against the live source. A null there
// means "not yet verified against the original", which is the truth, and the
// generation gate in 14-generation-pipeline.md §5 depends on it being honest.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} Fuente
 * @property {string} slug
 * @property {string} titulo
 * @property {string} organizacion
 * @property {string} url
 * @property {string|null} publicado
 * @property {string|null} licencia
 * @property {string|null} contenido  passage used to ground claims
 */

/** @type {Fuente[]} */
export const FUENTES = [
  // ── Global biodiversity and conservation status ────────────────────────────
  {
    slug: 'iucn-red-list',
    titulo: 'IUCN Red List of Threatened Species',
    organizacion: 'IUCN',
    url: 'https://www.iucnredlist.org/',
    publicado: '2025',
    licencia: 'Uso con atribución',
    contenido:
      'Categorías de la Lista Roja: EX (Extinta), EW (Extinta en Estado Silvestre), CR (En Peligro Crítico), EN (En Peligro), VU (Vulnerable), NT (Casi Amenazada), LC (Preocupación Menor), DD (Datos Insuficientes), NE (No Evaluada). DD significa que no hay información suficiente para evaluar el riesgo: no significa que la especie esté bien.',
  },
  {
    slug: 'iucn-categorias',
    titulo: 'IUCN Red List Categories and Criteria, versión 3.1',
    organizacion: 'IUCN',
    url: 'https://portals.iucn.org/library/sites/library/files/documents/RL-2001-001.pdf',
    publicado: '2001',
    licencia: 'Uso con atribución',
    contenido:
      'Las categorías de amenaza son En Peligro Crítico, En Peligro y Vulnerable. Una especie puede estar categorizada de forma distinta a nivel global y a nivel nacional: la categorización nacional evalúa la población dentro del país.',
  },
  {
    slug: 'ipbes-global',
    titulo: 'IPBES Global Assessment on Biodiversity and Ecosystem Services',
    organizacion: 'IPBES',
    url: 'https://www.ipbes.net/global-assessment',
    publicado: '2019',
    licencia: 'Uso con atribución',
    contenido:
      'Alrededor de un millón de especies animales y vegetales están amenazadas de extinción. Los cinco impulsores directos del cambio en la naturaleza, ordenados por impacto: cambio de uso de la tierra y el mar, explotación directa de organismos, cambio climático, contaminación e invasión de especies exóticas.',
  },
  {
    slug: 'sib-apn',
    titulo: 'SIB — Sistema de Información de Biodiversidad',
    organizacion: 'Administración de Parques Nacionales',
    url: 'https://sib.gob.ar/',
    publicado: '2025',
    licencia: 'Datos públicos',
    contenido:
      'Registros de especies en las áreas protegidas nacionales argentinas, fichas de especie y distribución por área protegida.',
  },
  {
    slug: 'sarem-2019',
    titulo: 'Categorización de los mamíferos de Argentina según su riesgo de extinción',
    organizacion: 'SAREM — Sociedad Argentina para el Estudio de los Mamíferos',
    url: 'https://www.scielo.org.ar/scielo.php?script=sci_arttext&pid=S0327-93832022000100657',
    publicado: '2019',
    licencia: 'Acceso abierto',
    contenido:
      'La categorización 2019 evaluó 417 especies de mamíferos nativos: 98 quedaron amenazadas (7 En Peligro Crítico, 26 En Peligro, 65 Vulnerables), 40 Casi Amenazadas y 80 con Datos Insuficientes. El 92,7 % de las especies enfrenta al menos una amenaza. Amenazas ordenadas: pérdida y degradación del hábitat (cerca del 80 % de las especies), caza ilegal (26 %), atropellamientos en ruta (22 %) y depredación por perros (22 %), especies invasoras (15 %).',
  },
  {
    slug: 'aves-argentinas-amenazadas',
    titulo: 'Categorización de las aves de Argentina según su estado de conservación',
    organizacion: 'Aves Argentinas / AOP',
    url: 'https://www.avesargentinas.org.ar/aves-amenazadas',
    publicado: '2024',
    licencia: 'Uso con atribución',
    contenido:
      'Alrededor del 12 % de las aves silvestres de Argentina —113 especies— están amenazadas, frente a 80 especies en la década de 1990.',
  },
  {
    slug: 'cites',
    titulo: 'Convención sobre el Comercio Internacional de Especies Amenazadas (CITES)',
    organizacion: 'CITES',
    url: 'https://cites.org/',
    publicado: '2025',
    licencia: 'Documento público',
    contenido:
      'CITES regula el comercio internacional de especies mediante tres apéndices. El Apéndice I prohíbe el comercio internacional con fines comerciales; el Apéndice II lo permite bajo permiso; el Apéndice III lista especies protegidas por un país que pide cooperación a los demás.',
  },
  {
    slug: 'ramsar',
    titulo: 'Convención de Ramsar sobre los Humedales',
    organizacion: 'Ramsar',
    url: 'https://www.ramsar.org/',
    publicado: '2025',
    licencia: 'Documento público',
    contenido:
      'La Convención de Ramsar designa humedales de importancia internacional. La Reserva Ecológica Costanera Sur es sitio Ramsar urbano desde 2005.',
  },
  {
    slug: 'invasoras-mayds',
    titulo: 'Lista de especies exóticas invasoras de Argentina',
    organizacion: 'Ministerio de Ambiente y Desarrollo Sostenible',
    url: 'https://www.argentina.gob.ar/ambiente/biodiversidad/exoticas-invasoras/lista',
    publicado: '2024',
    licencia: 'Datos públicos',
    contenido:
      'Especies exóticas invasoras registradas en Argentina: castor canadiense, visón americano, ciervo colorado, jabalí europeo, ardilla de vientre rojo, estornino pinto, paloma doméstica, mejillón dorado, caracol gigante africano, mosquito tigre. Entre las plantas: ligustro, mora, acacia negra, rosa mosqueta, gleditsia y tamarisco.',
  },

  // ── Argentine wildlife handling, welfare and rescue ────────────────────────
  {
    slug: 'red-centros-rescate',
    titulo: 'Red Federal de Centros de Rescate y Rehabilitación de Fauna Silvestre',
    organizacion: 'Ministerio de Ambiente y Desarrollo Sostenible',
    url: 'https://www.argentina.gob.ar/interior/ambiente/accion/fauna/red-centros-rescate',
    publicado: '2024',
    licencia: 'Documento público',
    contenido:
      'La Red Federal articula los centros de rescate y rehabilitación de fauna silvestre del país. Ante un animal silvestre herido corresponde contactar a la autoridad de fauna, no intentar la crianza ni la rehabilitación por cuenta propia.',
  },
  {
    slug: 'crfs-ecoparque',
    titulo: 'Centro de Rescate de Fauna Silvestre del Ecoparque',
    organizacion: 'Gobierno de la Ciudad de Buenos Aires',
    url: 'https://buenosaires.gob.ar/ecoparque/programas-de-conservacion/centro-de-rescate-de-fauna-silvestre-crfs',
    publicado: '2025',
    licencia: 'Documento público',
    contenido:
      'El Centro de Rescate de Fauna Silvestre del Ecoparque recibe animales silvestres decomisados del tráfico, heridos o entregados voluntariamente, y trabaja en su rehabilitación y derivación.',
  },
  {
    slug: 'protocolo-fauna-cba',
    titulo: 'Qué hacer si encontrás fauna silvestre',
    organizacion: 'Secretaría de Ambiente de Córdoba',
    url: 'https://ambiente.cba.gov.ar/que-debes-hacer-si-encontras-fauna-silvestre/',
    publicado: '2024',
    licencia: 'Documento público',
    contenido:
      'Ante un animal silvestre herido: no manipularlo sin protección, no darle agua ni comida, colocarlo en una caja de cartón ventilada, oscura y silenciosa, no exhibirlo ni fotografiarlo de cerca, no intentar criarlo, y contactar a la autoridad de fauna. La mayoría de los pichones encontrados en el suelo son volantones que todavía reciben alimento de sus padres: corresponde dejarlos donde están o subirlos a una rama cercana.',
  },
  {
    slug: 'gcba-cinco-libertades',
    titulo: 'Las 5 libertades de nuestras mascotas',
    organizacion: 'Gobierno de la Ciudad de Buenos Aires',
    url: 'https://buenosaires.gob.ar/las-5-libertades-de-nuestras-mascotas',
    publicado: '2024',
    licencia: 'Documento público',
    contenido:
      'Las cinco libertades del bienestar animal: libre de hambre y sed; libre de incomodidad; libre de dolor, lesión y enfermedad; libre para expresar un comportamiento natural; libre de miedo y angustia.',
  },
  {
    slug: 'ecoparque-conservacion',
    titulo: 'Ecoparque Buenos Aires — programas de conservación',
    organizacion: 'Gobierno de la Ciudad de Buenos Aires',
    url: 'https://buenosaires.gob.ar/gcaba_historico/ecoparque/conservacion',
    publicado: '2024',
    licencia: 'Documento público',
    contenido:
      'El antiguo Zoológico de Buenos Aires fue transformado en Ecoparque, con programas de conservación, rescate, investigación y educación, y el traslado de animales a santuarios y centros de referencia.',
  },
  {
    slug: 'rewilding-argentina',
    titulo: 'Fundación Rewilding Argentina — quiénes somos',
    organizacion: 'Fundación Rewilding Argentina',
    url: 'https://rewildingargentina.org/quienes-somos/',
    publicado: '2025',
    licencia: 'Uso con atribución',
    contenido:
      'Proyectos de reintroducción de yaguareté, oso hormiguero, venado de las pampas, lobo gargantilla, pecarí de collar, guacamayo rojo, chuña de patas rojas, ocelote, muitú, tortuga yabotí, paca, ciervo de los pantanos, chinchillón anaranjado y coipo, en Iberá, El Impenetrable, Patagonia y Patagonia Azul. El guacamayo rojo estuvo extinto en Argentina durante más de 150 años y fue reintroducido en Iberá.',
  },
  {
    slug: 'aves-argentinas',
    titulo: 'Aves Argentinas / Asociación Ornitológica del Plata',
    organizacion: 'Aves Argentinas',
    url: 'https://www.avesargentinas.org.ar/',
    publicado: '2025',
    licencia: 'Uso con atribución',
    contenido:
      'Fundada en 1916, es una de las organizaciones de conservación más antiguas de América. Programas de aves amenazadas (macá tobiano, cardenal amarillo, loro pecho vinoso) y ciencia ciudadana a través de los Clubes de Observadores de Aves (COA), eBird Argentina y el Censo Neotropical de Aves Acuáticas.',
  },
  {
    slug: 'conicet-carpinchos',
    titulo: 'Carpinchos: científicos y científicas del CONICET reflexionan sobre Nordelta',
    organizacion: 'CONICET',
    url: 'https://www.conicet.gov.ar/carpinchos-cientificos-y-cientificas-del-conicet-reflexionan-sobre-los-acontecimientos-de-nordelta/',
    publicado: '2021',
    licencia: 'Uso con atribución',
    contenido:
      'El carpincho es un roedor herbívoro, social y no agresivo. En Nordelta el barrio se construyó sobre el humedal donde los carpinchos ya vivían: el conflicto es una cuestión de uso del suelo, no una invasión de la fauna.',
  },

  // ── Ecoregions, plants, forests ────────────────────────────────────────────
  {
    slug: 'ecorregiones-pba',
    titulo: 'Ecorregiones de la Argentina',
    organizacion: 'Ministerio de Ambiente de la Provincia de Buenos Aires',
    url: 'https://www.ambiente.gba.gob.ar/nativas/ecorregiones',
    publicado: '2024',
    licencia: 'Documento público',
    contenido:
      'Argentina tiene 18 ecorregiones: 15 continentales más Islas del Atlántico Sur, Antártida y Mar Argentino. Entre las continentales: Selva Paranaense, Yungas, Chaco Húmedo, Chaco Seco, Esteros del Iberá, Delta e Islas del Paraná, Espinal, Pampa, Monte de Llanuras y Mesetas, Monte de Sierras y Bolsones, Estepa Patagónica, Bosque Patagónico, Altos Andes, Puna y Campos y Malezales.',
  },
  {
    slug: 'plantas-nativas',
    titulo: 'Guía de plantas nativas — cuál es tu ecorregión',
    organizacion: 'Guía de Plantas Nativas',
    url: 'https://nativas.lanacion.com.ar/acerca/cual-es-tu-ecoregion',
    publicado: '2024',
    licencia: 'Uso con atribución',
    contenido:
      'Flora nativa rioplatense: ceibo (Erythrina crista-galli, flor nacional), aliso de río (Tessaria integrifolia), sauce criollo (Salix humboldtiana), laurel blanco, curupí, timbó, ombú (Phytolacca dioica, que no es un árbol sino una hierba gigante), tipa, palo borracho (Ceiba speciosa) y algarrobo (Prosopis spp.).',
  },
  {
    slug: 'ley-bosques-26331',
    titulo: 'Ley 26.331 de Presupuestos Mínimos de Protección Ambiental de los Bosques Nativos',
    organizacion: 'Congreso de la Nación Argentina',
    url: 'https://www.derecho.uba.ar/academica/derecho-abierto/archivos/Ley-26331.pdf',
    publicado: '2007',
    licencia: 'Norma pública',
    contenido:
      'La ley obliga a cada provincia a realizar un Ordenamiento Territorial de Bosques Nativos con tres categorías: categoría I (rojo), sectores de muy alto valor de conservación que no deben transformarse; categoría II (amarillo), de valor medio, con uso sostenible; categoría III (verde), sectores que pueden transformarse. Crea el Fondo Nacional para el Enriquecimiento y la Conservación de los Bosques Nativos.',
  },
  {
    slug: 'reserva-costanera-sur',
    titulo: 'Reserva Ecológica Costanera Sur',
    organizacion: 'Gobierno de la Ciudad de Buenos Aires',
    url: 'https://buenosaires.gob.ar/gcaba_historico/vicejefatura/ambiente/reservasecologicas/reserva-ecologica-costanera-sur',
    publicado: '2024',
    licencia: 'Documento público',
    contenido:
      'La Reserva Ecológica Costanera Sur ocupa unas 350 hectáreas sobre un relleno hecho con escombros de demoliciones en los años setenta. Los ecosistemas se regeneraron espontáneamente durante décadas de abandono; está protegida desde 1986 y es sitio Ramsar desde 2005. Registra 343 especies de aves, alrededor de un tercio de la avifauna argentina, además de 10 mamíferos y 23 reptiles, incluido el lagarto overo.',
  },

  // ── Water ─────────────────────────────────────────────────────────────────
  {
    slug: 'acumar',
    titulo: 'ACUMAR — Autoridad de Cuenca Matanza Riachuelo',
    organizacion: 'ACUMAR',
    url: 'https://www.acumar.gob.ar/',
    publicado: '2025',
    licencia: 'Datos públicos',
    contenido:
      'ACUMAR es el organismo tripartito (Nación, Provincia de Buenos Aires y Ciudad de Buenos Aires) creado tras el fallo Mendoza de la Corte Suprema en 2008 para el saneamiento de la Cuenca Matanza-Riachuelo, donde viven alrededor de dos millones de personas.',
  },
  {
    slug: 'acuifero-puelche',
    titulo: 'Hidrogeología de la Ciudad de Buenos Aires',
    organizacion: 'Universidad Nacional de La Plata (Auge)',
    url: 'https://www.bfa.fcnym.unlp.edu.ar/catalogo/doc_num.php?explnum_id=237',
    publicado: '2004',
    licencia: 'Acceso abierto',
    contenido:
      'El acuífero Puelche es la principal reserva de agua subterránea del noreste bonaerense, ubicado bajo el acuífero Pampeano, del que recibe su recarga. Su vulnerabilidad depende de la protección que le da el sedimento superior.',
  },
  {
    slug: 'nitratos-puelche',
    titulo: 'Contaminación del agua subterránea con nitratos en la provincia de Buenos Aires',
    organizacion: 'Fundación Enlaces',
    url: 'https://fundacion-enlaces.org/contaminacion-del-agua-subterranea-con-nitratos-en-la-provincia-de-buenos-aires-argentina/',
    publicado: '2023',
    licencia: 'Uso con atribución',
    contenido:
      'La contaminación por nitratos del agua subterránea bonaerense se asocia a pozos ciegos, efluentes y fertilizantes. Es una de las causas principales por las que el agua de pozo deja de ser apta para consumo.',
  },
  {
    slug: 'huella-hidrica',
    titulo: 'Qué es y cómo se mide la huella hídrica',
    organizacion: 'Water Footprint Network',
    url: 'https://www.waterfootprint.org/',
    publicado: '2024',
    licencia: 'Uso con atribución',
    contenido:
      'La huella hídrica se divide en verde (agua de lluvia almacenada en el suelo y consumida por los cultivos), azul (agua superficial y subterránea consumida) y gris (agua necesaria para diluir la contaminación generada). El agua virtual es el agua utilizada para producir un bien, incorporada en él aunque no se vea. Producir un kilo de carne vacuna requiere del orden de 15.000 litros de agua contando toda la cadena; una remera de algodón, alrededor de 2.700 litros.',
  },

  // ── Climate, energy, air ──────────────────────────────────────────────────
  {
    slug: 'ipcc-ar6',
    titulo: 'IPCC Sixth Assessment Report (AR6)',
    organizacion: 'IPCC',
    url: 'https://www.ipcc.ch/assessment-report/ar6/',
    publicado: '2021-2023',
    licencia: 'Uso con atribución',
    contenido:
      'El efecto invernadero natural mantiene la Tierra habitable; el problema es su intensificación por el aumento de gases de efecto invernadero de origen humano. Los principales son dióxido de carbono, metano, óxido nitroso y gases fluorados. El metano tiene un potencial de calentamiento global mucho mayor que el CO₂ en un horizonte de 100 años, pero permanece menos tiempo en la atmósfera. Una fracción importante del CO₂ emitido permanece en la atmósfera durante siglos.',
  },
  {
    slug: 'iea-energia',
    titulo: 'IEA — Energy and AI',
    organizacion: 'International Energy Agency',
    url: 'https://www.iea.org/reports/energy-and-ai/executive-summary',
    publicado: '2025',
    licencia: 'Uso con atribución',
    contenido:
      'La IEA proyecta que la demanda eléctrica de los centros de datos se duplique hacia 2030, hasta alrededor de 945 TWh, algo menos del 3 % de la electricidad mundial.',
  },
  {
    slug: 'carbon-brief',
    titulo: 'Carbon Brief — explicadores y verificación',
    organizacion: 'Carbon Brief',
    url: 'https://www.carbonbrief.org/',
    publicado: '2025',
    licencia: 'Uso con atribución',
    contenido:
      'La huella digital individual está dominada por la fabricación de los dispositivos y por la electricidad de los centros de datos, no por el envío de correos electrónicos. Alargar la vida útil de un teléfono dos años más pesa mucho más que cualquier higiene de correo.',
  },
  {
    slug: 'icct-ev',
    titulo: 'Life-cycle greenhouse gas emissions of passenger cars',
    organizacion: 'ICCT — International Council on Clean Transportation',
    url: 'https://theicct.org/wp-content/uploads/2025/07/ID-392-%E2%80%93-Life-cycle-GHG_report_final.pdf',
    publicado: '2025',
    licencia: 'Uso con atribución',
    contenido:
      'Los autos eléctricos no tienen emisiones por el caño de escape, pero sí emisiones de ciclo de vida por la fabricación de la batería y por la electricidad de la red. Considerando todo el ciclo de vida emiten sustancialmente menos que un auto de combustión comparable en prácticamente todas las redes eléctricas estudiadas.',
  },
  {
    slug: 'epa',
    titulo: 'US EPA — explicadores ambientales',
    organizacion: 'US Environmental Protection Agency',
    url: 'https://www.epa.gov/',
    publicado: '2025',
    licencia: 'Documento público',
    contenido:
      'La jerarquía de gestión de residuos ordena las opciones de mayor a menor preferencia: prevención y reducción en origen, reutilización, reciclado y compostaje, recuperación de energía y, por último, tratamiento y disposición final.',
  },
  {
    slug: 'incendios-delta-2020',
    titulo: 'Incendios en el delta del río Paraná de 2020',
    organizacion: 'Registro público (Wikipedia, con fuentes citadas)',
    url: 'https://es.wikipedia.org/wiki/Incendios_en_el_delta_del_r%C3%ADo_Paran%C3%A1_de_2020',
    publicado: '2020',
    licencia: 'CC BY-SA',
    contenido:
      'Los incendios del delta del Paraná de 2020 arrasaron cientos de miles de hectáreas de humedal y llevaron humo a Rosario y al AMBA. Se convirtieron en el principal impulso político del proyecto de Ley de Humedales, que sigue sin sancionarse.',
  },

  // ── Waste, consumption, circularity ───────────────────────────────────────
  {
    slug: 'ley-1854-basura-cero',
    titulo: 'Ley 1854 de Gestión Integral de Residuos Sólidos Urbanos (Basura Cero)',
    organizacion: 'Legislatura de la Ciudad de Buenos Aires',
    url: 'http://www2.cedom.gov.ar/es/legislacion/normas/leyes/ley1854.html',
    publicado: '2005',
    licencia: 'Norma pública',
    contenido:
      'La ley Basura Cero establece metas progresivas de reducción del enterramiento de residuos en la Ciudad de Buenos Aires y la separación en origen entre reciclables y no reciclables, con Puntos Verdes, campanas verdes y Centros Verdes operados por cooperativas de recuperadores urbanos.',
  },
  {
    slug: 'faccyr',
    titulo: 'FACCyR — Federación Argentina de Cartoneros, Carreros y Recicladores',
    organizacion: 'FACCyR',
    url: 'https://faccyr.org.ar/legislacion/',
    publicado: '2024',
    licencia: 'Uso con atribución',
    contenido:
      'Los recuperadores urbanos organizados en cooperativas son parte del sistema formal de reciclado de la Ciudad de Buenos Aires y operan los Centros Verdes. Los proyectos de Ley de Envases con Responsabilidad Extendida del Productor incluyen la inclusión social de recuperadores.',
  },
  {
    slug: 'rep-envases',
    titulo: 'Ley de Envases y Responsabilidad Extendida del Productor',
    organizacion: 'Fundación Metropolitana',
    url: 'https://metropolitana.org.ar/idm/ley-de-envases-y-responsabilidad-extendida-del-productor/',
    publicado: '2024',
    licencia: 'Uso con atribución',
    contenido:
      'La Responsabilidad Extendida del Productor traslada al fabricante el costo de la gestión del envase una vez terminada su vida útil. El proyecto argentino de Ley de Envases fue presentado en repetidas oportunidades y nunca sancionado.',
  },
  {
    slug: 'ellen-macarthur',
    titulo: 'Circular economy introduction',
    organizacion: 'Ellen MacArthur Foundation',
    url: 'https://www.ellenmacarthurfoundation.org/topics/circular-economy-introduction/overview',
    publicado: '2024',
    licencia: 'Uso con atribución',
    contenido:
      'La economía circular se apoya en tres principios: eliminar los residuos y la contaminación desde el diseño, mantener los productos y materiales en uso en su mayor valor posible, y regenerar la naturaleza. Distingue ciclos técnicos (materiales que se recuperan) de ciclos biológicos (materiales que vuelven al suelo).',
  },
  {
    slug: 'global-footprint',
    titulo: 'Ecological Footprint y Earth Overshoot Day',
    organizacion: 'Global Footprint Network',
    url: 'https://www.footprintnetwork.org/',
    publicado: '2025',
    licencia: 'Uso con atribución',
    contenido:
      'El Día de Sobregiro de la Tierra marca la fecha en la que la humanidad consumió todos los recursos que los ecosistemas pueden regenerar en un año. A partir de esa fecha el consumo del año se sostiene sobre stock, no sobre renovación.',
  },
  {
    slug: 'yale-reciclaje',
    titulo: 'Recycling isn’t the solution to the climate crisis',
    organizacion: 'Yale Climate Connections',
    url: 'https://yaleclimateconnections.org/2024/09/recycling-isnt-the-solution-to-the-climate-crisis/',
    publicado: '2024',
    licencia: 'Uso con atribución',
    contenido:
      'El reciclado es la tercera opción, después de evitar y de reducir. La mayor parte del plástico producido en la historia nunca fue reciclada, y el plástico pierde calidad en cada ciclo de reciclado, por lo que la reducción y el rediseño pesan más que el reciclado.',
  },

  // ── Food and agriculture ──────────────────────────────────────────────────
  {
    slug: 'owid-alimentos',
    titulo: 'You want to reduce the carbon footprint of your food? Focus on what you eat, not whether it is local',
    organizacion: 'Our World in Data',
    url: 'https://ourworldindata.org/food-choice-vs-eating-local',
    publicado: '2024',
    licencia: 'CC BY',
    contenido:
      'El transporte representa una fracción pequeña de las emisiones de la mayoría de los alimentos. Qué se come pesa mucho más que la distancia que recorrió. La carne vacuna genera del orden de 27 kg de CO₂ equivalente por kilo producido; las legumbres, cerca de 0,9 kg por kilo.',
  },
  {
    slug: 'owid-impactos-alimentos',
    titulo: 'Environmental impacts of food production',
    organizacion: 'Our World in Data',
    url: 'https://ourworldindata.org/environmental-impacts-of-food',
    publicado: '2024',
    licencia: 'CC BY',
    contenido:
      'La producción de alimentos ocupa cerca de la mitad de la tierra habitable del planeta y es responsable de alrededor de un cuarto de las emisiones globales de gases de efecto invernadero. Alrededor de un tercio de los alimentos producidos en el mundo se pierde o se desperdicia.',
  },
  {
    slug: 'fao',
    titulo: 'FAO / FAOSTAT',
    organizacion: 'FAO — Organización de las Naciones Unidas para la Alimentación y la Agricultura',
    url: 'https://www.fao.org/faostat/',
    publicado: '2025',
    licencia: 'Datos públicos',
    contenido:
      'Datos de alimentación, uso de la tierra, pesca (informe SOFIA) y bosques (evaluación FRA) por país y por producto.',
  },
  {
    slug: 'inta',
    titulo: 'INTA — Instituto Nacional de Tecnología Agropecuaria',
    organizacion: 'INTA',
    url: 'https://www.argentina.gob.ar/inta',
    publicado: '2025',
    licencia: 'Documento público',
    contenido:
      'El INTA publica calendarios estacionales de frutas y verduras, materiales de agroecología, suelos y el programa ProHuerta de huertas familiares, escolares y comunitarias.',
  },

  // ── Oceans and rivers ─────────────────────────────────────────────────────
  {
    slug: 'milla-201',
    titulo: 'La pesca ilegal en la milla 201 del Mar Argentino',
    organizacion: 'Chequeado',
    url: 'https://chequeado.com/el-explicador/la-pesca-ilegal-en-la-milla-201-del-mar-argentino-perdidas-millonarias-e-impacto-en-los-recursos-argentinos/',
    publicado: '2023',
    licencia: 'Uso con atribución',
    contenido:
      'Frente al límite de la Zona Económica Exclusiva argentina, en la llamada milla 201, opera una flota internacional de pesca de altura sobre recursos que migran desde aguas argentinas. El área conocida como Agujero Azul concentra buena parte de esa actividad.',
  },
  {
    slug: 'unep',
    titulo: 'UNEP — Programa de las Naciones Unidas para el Medio Ambiente',
    organizacion: 'UNEP',
    url: 'https://www.unep.org/',
    publicado: '2025',
    licencia: 'Uso con atribución',
    contenido:
      'La gran mayoría de la basura marina se origina en tierra y llega al mar a través de ríos, desagües y viento. Los cinco impulsores de la crisis de la naturaleza son el cambio de uso de la tierra y el mar, la explotación directa, el cambio climático, la contaminación y las especies invasoras.',
  },

  // ── Law, civics, education frameworks ─────────────────────────────────────
  {
    slug: 'ley-27621-eai',
    titulo: 'Ley 27.621 de Educación Ambiental Integral',
    organizacion: 'Congreso de la Nación Argentina',
    url: 'https://www.argentina.gob.ar/normativa/nacional/ley-27621-350594/texto',
    publicado: '2021',
    licencia: 'Norma pública',
    contenido:
      'La ley establece la educación ambiental integral como obligatoria y transversal en todos los niveles y crea la Estrategia Nacional de Educación Ambiental Integral. Sus principios incluyen el abordaje holístico, el respeto y valor de la biodiversidad, la equidad, la perspectiva de género, el respeto por la diversidad cultural y los saberes de los pueblos indígenas, la participación ciudadana, la perspectiva histórica, la educación en valores y el derecho a un ambiente sano.',
  },
  {
    slug: 'ley-22421-fauna',
    titulo: 'Ley 22.421 de Conservación de la Fauna Silvestre',
    organizacion: 'Congreso de la Nación Argentina',
    url: 'https://www.argentina.gob.ar/normativa',
    publicado: '1981',
    licencia: 'Norma pública',
    contenido:
      'La ley declara de interés público la fauna silvestre y su protección, y regula la caza, el transporte, el comercio y la exportación. Es la base de la fiscalización contra el tráfico de fauna, complementada por la Ley 14.346 de maltrato animal, de 1954.',
  },
  {
    slug: 'ley-25675-ambiente',
    titulo: 'Ley 25.675 General del Ambiente',
    organizacion: 'Congreso de la Nación Argentina',
    url: 'https://www.argentina.gob.ar/normativa',
    publicado: '2002',
    licencia: 'Norma pública',
    contenido:
      'Ley marco de presupuestos mínimos. Establece los principios de congruencia, prevención, precautorio, equidad intergeneracional, progresividad, responsabilidad, subsidiariedad, sustentabilidad, solidaridad y cooperación, además de la evaluación de impacto ambiental y el seguro ambiental.',
  },
  {
    slug: 'ley-25831-info',
    titulo: 'Ley 25.831 de Régimen de Libre Acceso a la Información Pública Ambiental',
    organizacion: 'Congreso de la Nación Argentina',
    url: 'https://www.argentina.gob.ar/normativa',
    publicado: '2003',
    licencia: 'Norma pública',
    contenido:
      'Garantiza el derecho de acceso a la información ambiental que esté en poder del Estado. El acceso es libre y gratuito, y no hace falta acreditar razones ni interés determinado para pedirla.',
  },
  {
    slug: 'escazu',
    titulo: 'Acuerdo de Escazú (Ley 27.566)',
    organizacion: 'Congreso de la Nación Argentina / CEPAL',
    url: 'https://www.argentina.gob.ar/normativa',
    publicado: '2020',
    licencia: 'Norma pública',
    contenido:
      'El Acuerdo de Escazú garantiza los derechos de acceso a la información ambiental, la participación pública en las decisiones ambientales y el acceso a la justicia ambiental, e incluye obligaciones de protección para las personas defensoras de derechos humanos en asuntos ambientales.',
  },
  {
    slug: 'unesco-ods',
    titulo: 'Education for Sustainable Development Goals: Learning Objectives',
    organizacion: 'UNESCO',
    url: 'https://unesdoc.unesco.org/ark:/48223/pf0000247444',
    publicado: '2017',
    licencia: 'CC BY-SA',
    contenido:
      'UNESCO define, para cada Objetivo de Desarrollo Sostenible, objetivos de aprendizaje cognitivos, socioemocionales y conductuales, y ocho competencias transversales: pensamiento sistémico, anticipatorio, normativo, estratégico, colaboración, pensamiento crítico, autoconciencia y resolución integrada de problemas.',
  },
  {
    slug: 'naaee-guidelines',
    titulo: 'K–12 Environmental Education: Guidelines for Excellence',
    organizacion: 'NAAEE',
    url: 'https://naaee.org/programs/guidelines-excellence',
    publicado: '2019',
    licencia: 'Uso con atribución',
    contenido:
      'Cuatro ejes: habilidades de indagación, análisis e interpretación; procesos y sistemas ambientales; habilidades para comprender y abordar problemas ambientales; y responsabilidad personal y cívica, que incluye el reconocimiento de la propia eficacia y capacidad de acción.',
  },

  // ── Citizen science and data ──────────────────────────────────────────────
  {
    slug: 'gbif',
    titulo: 'GBIF — Global Biodiversity Information Facility',
    organizacion: 'GBIF',
    url: 'https://www.gbif.org/',
    publicado: '2025',
    licencia: 'CC BY',
    contenido:
      'GBIF agrega registros georreferenciados de presencia de especies publicados con el estándar Darwin Core, que define los campos mínimos de un registro: qué se observó, dónde, cuándo y quién lo registró.',
  },
  {
    slug: 'argentinat',
    titulo: 'ArgentiNat — iNaturalist Argentina',
    organizacion: 'ArgentiNat / iNaturalist',
    url: 'https://www.argentinat.org/',
    publicado: '2025',
    licencia: 'CC BY-NC',
    contenido:
      'ArgentiNat permite registrar observaciones de especies con foto y ubicación; las identificaciones son verificadas por la comunidad y los registros de calidad investigativa se publican en GBIF.',
  },
  {
    slug: 'ebird',
    titulo: 'eBird Argentina',
    organizacion: 'Cornell Lab of Ornithology / Aves Argentinas',
    url: 'https://ebird.org/region/AR',
    publicado: '2025',
    licencia: 'Uso con atribución',
    contenido:
      'eBird recopila listados de aves con fecha, lugar y esfuerzo de observación. La Reserva Ecológica Costanera Sur es uno de los hotspots más registrados de la Argentina.',
  },
  {
    slug: 'chequeado',
    titulo: 'Chequeado — verificación de datos',
    organizacion: 'Chequeado',
    url: 'https://chequeado.com/',
    publicado: '2025',
    licencia: 'Uso con atribución',
    contenido:
      'Chequeado verifica afirmaciones públicas en Argentina, incluidas las ambientales, y publica el método y las fuentes de cada verificación.',
  },

  // ── Education / psychology of climate communication ───────────────────────
  {
    slug: 'ecoansiedad-review',
    titulo: 'Eco-anxiety in children: a scoping review',
    organizacion: 'Frontiers in Psychology',
    url: 'https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2022.872544/full',
    publicado: '2022',
    licencia: 'CC BY',
    contenido:
      'La preocupación y la ansiedad son las emociones más reportadas en la infancia frente a la crisis ambiental, junto con el miedo y también la esperanza. Los adolescentes muestran más pesimismo que los niños. Son factores protectores la agencia, el afrontamiento centrado en el sentido, la esperanza y la participación en la acción colectiva. Se recomienda acompañar cada contenido sobre problemas con soluciones accionables y enfatizar la responsabilidad colectiva por sobre la individual.',
  },
  {
    slug: 'ncse-ozono',
    titulo: 'Misconception Monday: the ozone hole',
    organizacion: 'National Center for Science Education',
    url: 'https://ncse.ngo/misconception-monday-oh-no-ozone-hole',
    publicado: '2016',
    licencia: 'Uso con atribución',
    contenido:
      'El agotamiento de la capa de ozono y el calentamiento global son dos problemas distintos. El primero se debe a los CFC, ocurre en la estratósfera y afecta la radiación ultravioleta que llega a la superficie; el segundo se debe a los gases de efecto invernadero, ocurre en la tropósfera y atrapa calor. Es la confusión más persistente de la enseñanza de temas ambientales.',
  },
];

export const FUENTE_SLUGS = new Set(FUENTES.map((f) => f.slug));
