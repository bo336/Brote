/**
 * Las fuentes del currículum de la Academia, para la página /legal/fuentes.
 *
 * GENERADO por scripts/academia-arbol/construir.mjs desde
 * scripts/academia-arbol/fuentes.mjs y el contenido. No se edita a mano.
 *
 * Solo títulos, organizaciones y links: ninguna respuesta de ningún ejercicio
 * pasa por acá, así que puede viajar al cliente sin riesgo.
 */

export interface FuenteAcademia {
  slug: string;
  titulo: string;
  organizacion: string;
  url: string;
  publicado: string | null;
}

export interface RamaFuentes {
  slug: string;
  nombre: string;
  unidades: { slug: string; titulo: string; fuentes: string[] }[];
}

export const FUENTES_ACADEMIA: FuenteAcademia[] = [
  {
    "slug": "iucn-red-list",
    "titulo": "IUCN Red List of Threatened Species",
    "organizacion": "IUCN",
    "url": "https://www.iucnredlist.org/",
    "publicado": "2025"
  },
  {
    "slug": "ipbes-global",
    "titulo": "IPBES Global Assessment on Biodiversity and Ecosystem Services",
    "organizacion": "IPBES",
    "url": "https://www.ipbes.net/global-assessment",
    "publicado": "2019"
  },
  {
    "slug": "sib-apn",
    "titulo": "SIB — Sistema de Información de Biodiversidad",
    "organizacion": "Administración de Parques Nacionales",
    "url": "https://sib.gob.ar/",
    "publicado": "2025"
  },
  {
    "slug": "sarem-2019",
    "titulo": "Categorización de los mamíferos de Argentina según su riesgo de extinción",
    "organizacion": "SAREM — Sociedad Argentina para el Estudio de los Mamíferos",
    "url": "https://www.scielo.org.ar/scielo.php?script=sci_arttext&pid=S0327-93832022000100657",
    "publicado": "2019"
  },
  {
    "slug": "cites",
    "titulo": "Convención sobre el Comercio Internacional de Especies Amenazadas (CITES)",
    "organizacion": "CITES",
    "url": "https://cites.org/",
    "publicado": "2025"
  },
  {
    "slug": "ramsar",
    "titulo": "Convención de Ramsar sobre los Humedales",
    "organizacion": "Ramsar",
    "url": "https://www.ramsar.org/",
    "publicado": "2025"
  },
  {
    "slug": "invasoras-mayds",
    "titulo": "Lista de especies exóticas invasoras de Argentina",
    "organizacion": "Ministerio de Ambiente y Desarrollo Sostenible",
    "url": "https://www.argentina.gob.ar/ambiente/biodiversidad/exoticas-invasoras/lista",
    "publicado": "2024"
  },
  {
    "slug": "red-centros-rescate",
    "titulo": "Red Federal de Centros de Rescate y Rehabilitación de Fauna Silvestre",
    "organizacion": "Ministerio de Ambiente y Desarrollo Sostenible",
    "url": "https://www.argentina.gob.ar/interior/ambiente/accion/fauna/red-centros-rescate",
    "publicado": "2024"
  },
  {
    "slug": "crfs-ecoparque",
    "titulo": "Centro de Rescate de Fauna Silvestre del Ecoparque",
    "organizacion": "Gobierno de la Ciudad de Buenos Aires",
    "url": "https://buenosaires.gob.ar/ecoparque/programas-de-conservacion/centro-de-rescate-de-fauna-silvestre-crfs",
    "publicado": "2025"
  },
  {
    "slug": "protocolo-fauna-cba",
    "titulo": "Qué hacer si encontrás fauna silvestre",
    "organizacion": "Secretaría de Ambiente de Córdoba",
    "url": "https://ambiente.cba.gov.ar/que-debes-hacer-si-encontras-fauna-silvestre/",
    "publicado": "2024"
  },
  {
    "slug": "gcba-cinco-libertades",
    "titulo": "Las 5 libertades de nuestras mascotas",
    "organizacion": "Gobierno de la Ciudad de Buenos Aires",
    "url": "https://buenosaires.gob.ar/las-5-libertades-de-nuestras-mascotas",
    "publicado": "2024"
  },
  {
    "slug": "aves-argentinas",
    "titulo": "Aves Argentinas / Asociación Ornitológica del Plata",
    "organizacion": "Aves Argentinas",
    "url": "https://www.avesargentinas.org.ar/",
    "publicado": "2025"
  },
  {
    "slug": "conicet-carpinchos",
    "titulo": "Carpinchos: científicos y científicas del CONICET reflexionan sobre Nordelta",
    "organizacion": "CONICET",
    "url": "https://www.conicet.gov.ar/carpinchos-cientificos-y-cientificas-del-conicet-reflexionan-sobre-los-acontecimientos-de-nordelta/",
    "publicado": "2021"
  },
  {
    "slug": "ecorregiones-pba",
    "titulo": "Ecorregiones de la Argentina",
    "organizacion": "Ministerio de Ambiente de la Provincia de Buenos Aires",
    "url": "https://www.ambiente.gba.gob.ar/nativas/ecorregiones",
    "publicado": "2024"
  },
  {
    "slug": "plantas-nativas",
    "titulo": "Guía de plantas nativas — cuál es tu ecorregión",
    "organizacion": "Guía de Plantas Nativas",
    "url": "https://nativas.lanacion.com.ar/acerca/cual-es-tu-ecoregion",
    "publicado": "2024"
  },
  {
    "slug": "reserva-costanera-sur",
    "titulo": "Reserva Ecológica Costanera Sur",
    "organizacion": "Gobierno de la Ciudad de Buenos Aires",
    "url": "https://buenosaires.gob.ar/gcaba_historico/vicejefatura/ambiente/reservasecologicas/reserva-ecologica-costanera-sur",
    "publicado": "2024"
  },
  {
    "slug": "acumar",
    "titulo": "ACUMAR — Autoridad de Cuenca Matanza Riachuelo",
    "organizacion": "ACUMAR",
    "url": "https://www.acumar.gob.ar/",
    "publicado": "2025"
  },
  {
    "slug": "acuifero-puelche",
    "titulo": "Hidrogeología de la Ciudad de Buenos Aires",
    "organizacion": "Universidad Nacional de La Plata (Auge)",
    "url": "https://www.bfa.fcnym.unlp.edu.ar/catalogo/doc_num.php?explnum_id=237",
    "publicado": "2004"
  },
  {
    "slug": "nitratos-puelche",
    "titulo": "Contaminación del agua subterránea con nitratos en la provincia de Buenos Aires",
    "organizacion": "Fundación Enlaces",
    "url": "https://fundacion-enlaces.org/contaminacion-del-agua-subterranea-con-nitratos-en-la-provincia-de-buenos-aires-argentina/",
    "publicado": "2023"
  },
  {
    "slug": "huella-hidrica",
    "titulo": "Qué es y cómo se mide la huella hídrica",
    "organizacion": "Water Footprint Network",
    "url": "https://www.waterfootprint.org/",
    "publicado": "2024"
  },
  {
    "slug": "ipcc-ar6",
    "titulo": "IPCC Sixth Assessment Report (AR6)",
    "organizacion": "IPCC",
    "url": "https://www.ipcc.ch/assessment-report/ar6/",
    "publicado": "2021-2023"
  },
  {
    "slug": "iea-energia",
    "titulo": "IEA — Energy and AI",
    "organizacion": "International Energy Agency",
    "url": "https://www.iea.org/reports/energy-and-ai/executive-summary",
    "publicado": "2025"
  },
  {
    "slug": "carbon-brief",
    "titulo": "Carbon Brief — explicadores y verificación",
    "organizacion": "Carbon Brief",
    "url": "https://www.carbonbrief.org/",
    "publicado": "2025"
  },
  {
    "slug": "icct-ev",
    "titulo": "Life-cycle greenhouse gas emissions of passenger cars",
    "organizacion": "ICCT — International Council on Clean Transportation",
    "url": "https://theicct.org/wp-content/uploads/2025/07/ID-392-%E2%80%93-Life-cycle-GHG_report_final.pdf",
    "publicado": "2025"
  },
  {
    "slug": "epa",
    "titulo": "US EPA — explicadores ambientales",
    "organizacion": "US Environmental Protection Agency",
    "url": "https://www.epa.gov/",
    "publicado": "2025"
  },
  {
    "slug": "incendios-delta-2020",
    "titulo": "Incendios en el delta del río Paraná de 2020",
    "organizacion": "Registro público (Wikipedia, con fuentes citadas)",
    "url": "https://es.wikipedia.org/wiki/Incendios_en_el_delta_del_r%C3%ADo_Paran%C3%A1_de_2020",
    "publicado": "2020"
  },
  {
    "slug": "ley-1854-basura-cero",
    "titulo": "Ley 1.854 «Basura Cero» y su decreto reglamentario",
    "organizacion": "Legislatura de la Ciudad de Buenos Aires",
    "url": "https://www.cedom.gob.ar/legislacion/normas/leyes/RepoLeyes/anexos/drl1854.html",
    "publicado": "2005"
  },
  {
    "slug": "faccyr",
    "titulo": "FACCyR — Federación Argentina de Cartoneros, Carreros y Recicladores",
    "organizacion": "FACCyR",
    "url": "https://faccyr.org.ar/legislacion/",
    "publicado": "2024"
  },
  {
    "slug": "ellen-macarthur",
    "titulo": "Circular economy introduction",
    "organizacion": "Ellen MacArthur Foundation",
    "url": "https://www.ellenmacarthurfoundation.org/topics/circular-economy-introduction/overview",
    "publicado": "2024"
  },
  {
    "slug": "global-footprint",
    "titulo": "Ecological Footprint y Earth Overshoot Day",
    "organizacion": "Global Footprint Network",
    "url": "https://www.footprintnetwork.org/",
    "publicado": "2025"
  },
  {
    "slug": "yale-reciclaje",
    "titulo": "Recycling isn’t the solution to the climate crisis",
    "organizacion": "Yale Climate Connections",
    "url": "https://yaleclimateconnections.org/2024/09/recycling-isnt-the-solution-to-the-climate-crisis/",
    "publicado": "2024"
  },
  {
    "slug": "owid-alimentos",
    "titulo": "You want to reduce the carbon footprint of your food? Focus on what you eat, not whether it is local",
    "organizacion": "Our World in Data",
    "url": "https://ourworldindata.org/food-choice-vs-eating-local",
    "publicado": "2024"
  },
  {
    "slug": "owid-impactos-alimentos",
    "titulo": "Environmental impacts of food production",
    "organizacion": "Our World in Data",
    "url": "https://ourworldindata.org/environmental-impacts-of-food",
    "publicado": "2024"
  },
  {
    "slug": "fao",
    "titulo": "FAO / FAOSTAT",
    "organizacion": "FAO — Organización de las Naciones Unidas para la Alimentación y la Agricultura",
    "url": "https://www.fao.org/faostat/",
    "publicado": "2025"
  },
  {
    "slug": "inta",
    "titulo": "INTA — Instituto Nacional de Tecnología Agropecuaria",
    "organizacion": "INTA",
    "url": "https://www.argentina.gob.ar/inta",
    "publicado": "2025"
  },
  {
    "slug": "milla-201",
    "titulo": "La pesca ilegal en la milla 201 del Mar Argentino",
    "organizacion": "Chequeado",
    "url": "https://chequeado.com/el-explicador/la-pesca-ilegal-en-la-milla-201-del-mar-argentino-perdidas-millonarias-e-impacto-en-los-recursos-argentinos/",
    "publicado": "2023"
  },
  {
    "slug": "unep",
    "titulo": "UNEP — Programa de las Naciones Unidas para el Medio Ambiente",
    "organizacion": "UNEP",
    "url": "https://www.unep.org/",
    "publicado": "2025"
  },
  {
    "slug": "ley-27621-eai",
    "titulo": "Ley 27.621 de Educación Ambiental Integral",
    "organizacion": "Congreso de la Nación Argentina",
    "url": "https://www.argentina.gob.ar/normativa/nacional/ley-27621-350594/texto",
    "publicado": "2021"
  },
  {
    "slug": "ley-22421-fauna",
    "titulo": "Ley 22.421 de Conservación de la Fauna Silvestre",
    "organizacion": "Congreso de la Nación Argentina",
    "url": "https://www.argentina.gob.ar/normativa",
    "publicado": "1981"
  },
  {
    "slug": "ley-25675-ambiente",
    "titulo": "Ley 25.675 General del Ambiente",
    "organizacion": "Congreso de la Nación Argentina",
    "url": "https://www.argentina.gob.ar/normativa",
    "publicado": "2002"
  },
  {
    "slug": "ley-25831-info",
    "titulo": "Ley 25.831 de Régimen de Libre Acceso a la Información Pública Ambiental",
    "organizacion": "Congreso de la Nación Argentina",
    "url": "https://www.argentina.gob.ar/normativa",
    "publicado": "2003"
  },
  {
    "slug": "escazu",
    "titulo": "Acuerdo de Escazú (Ley 27.566)",
    "organizacion": "Congreso de la Nación Argentina / CEPAL",
    "url": "https://www.argentina.gob.ar/normativa",
    "publicado": "2020"
  },
  {
    "slug": "unesco-ods",
    "titulo": "Education for Sustainable Development Goals: Learning Objectives",
    "organizacion": "UNESCO",
    "url": "https://unesdoc.unesco.org/ark:/48223/pf0000247444",
    "publicado": "2017"
  },
  {
    "slug": "naaee-guidelines",
    "titulo": "K–12 Environmental Education: Guidelines for Excellence",
    "organizacion": "NAAEE",
    "url": "https://naaee.org/programs/guidelines-excellence",
    "publicado": "2019"
  },
  {
    "slug": "gbif",
    "titulo": "GBIF — Global Biodiversity Information Facility",
    "organizacion": "GBIF",
    "url": "https://www.gbif.org/",
    "publicado": "2025"
  },
  {
    "slug": "argentinat",
    "titulo": "ArgentiNat — iNaturalist Argentina",
    "organizacion": "ArgentiNat / iNaturalist",
    "url": "https://www.argentinat.org/",
    "publicado": "2025"
  },
  {
    "slug": "ebird",
    "titulo": "eBird Argentina",
    "organizacion": "Cornell Lab of Ornithology / Aves Argentinas",
    "url": "https://ebird.org/region/AR",
    "publicado": "2025"
  },
  {
    "slug": "chequeado",
    "titulo": "Chequeado — verificación de datos",
    "organizacion": "Chequeado",
    "url": "https://chequeado.com/",
    "publicado": "2025"
  },
  {
    "slug": "ecoansiedad-review",
    "titulo": "Eco-anxiety in children: a scoping review",
    "organizacion": "Frontiers in Psychology",
    "url": "https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2022.872544/full",
    "publicado": "2022"
  },
  {
    "slug": "ncse-ozono",
    "titulo": "Misconception Monday: the ozone hole",
    "organizacion": "National Center for Science Education",
    "url": "https://ncse.ngo/misconception-monday-oh-no-ozone-hole",
    "publicado": "2016"
  },
  {
    "slug": "ipcc-ar6-syr",
    "titulo": "AR6 Synthesis Report: Climate Change 2023",
    "organizacion": "IPCC",
    "url": "https://www.ipcc.ch/report/ar6/syr/",
    "publicado": "2023"
  },
  {
    "slug": "noaa-co2",
    "titulo": "Trends in Atmospheric Carbon Dioxide (Mauna Loa)",
    "organizacion": "NOAA Global Monitoring Laboratory",
    "url": "https://gml.noaa.gov/ccgg/trends/",
    "publicado": "2025"
  },
  {
    "slug": "nasa-evidencia",
    "titulo": "Evidence: How Do We Know Climate Change Is Real?",
    "organizacion": "NASA",
    "url": "https://science.nasa.gov/climate-change/evidence/",
    "publicado": "2024"
  },
  {
    "slug": "nasa-ciclo-carbono",
    "titulo": "The Carbon Cycle",
    "organizacion": "NASA Earth Observatory",
    "url": "https://earthobservatory.nasa.gov/features/CarbonCycle",
    "publicado": "2011"
  },
  {
    "slug": "global-carbon-budget",
    "titulo": "Global Carbon Budget",
    "organizacion": "Global Carbon Project",
    "url": "https://globalcarbonbudget.org/",
    "publicado": "2024"
  },
  {
    "slug": "owid-co2",
    "titulo": "CO₂ and Greenhouse Gas Emissions",
    "organizacion": "Our World in Data",
    "url": "https://ourworldindata.org/co2-and-greenhouse-gas-emissions",
    "publicado": "2024"
  },
  {
    "slug": "owid-energia",
    "titulo": "Energy",
    "organizacion": "Our World in Data",
    "url": "https://ourworldindata.org/energy",
    "publicado": "2024"
  },
  {
    "slug": "consenso-cook-2016",
    "titulo": "Consensus on consensus: a synthesis of consensus estimates on human-caused global warming",
    "organizacion": "Environmental Research Letters (Cook et al.)",
    "url": "https://iopscience.iop.org/article/10.1088/1748-9326/11/4/048002",
    "publicado": "2016"
  },
  {
    "slug": "wynes-nicholas-2017",
    "titulo": "The climate mitigation gap: education and government recommendations miss the most effective individual actions",
    "organizacion": "Environmental Research Letters (Wynes y Nicholas)",
    "url": "https://iopscience.iop.org/article/10.1088/1748-9326/aa7541",
    "publicado": "2017"
  },
  {
    "slug": "inventario-gei-ar",
    "titulo": "Inventario Nacional de Gases de Efecto Invernadero",
    "organizacion": "Ministerio de Ambiente de la Nación (Argentina)",
    "url": "https://inventariogei.ambiente.gob.ar/",
    "publicado": "2023"
  },
  {
    "slug": "usgs-ciclo-agua",
    "titulo": "The Water Cycle",
    "organizacion": "U.S. Geological Survey",
    "url": "https://www.usgs.gov/special-topics/water-science-school/science/water-cycle",
    "publicado": "2019"
  },
  {
    "slug": "oms-agua-potable",
    "titulo": "Drinking-water (fact sheet)",
    "organizacion": "Organización Mundial de la Salud",
    "url": "https://www.who.int/news-room/fact-sheets/detail/drinking-water",
    "publicado": "2023"
  },
  {
    "slug": "un-water",
    "titulo": "UN-Water: Water facts",
    "organizacion": "Naciones Unidas",
    "url": "https://www.unwater.org/water-facts",
    "publicado": "2024"
  },
  {
    "slug": "aysa",
    "titulo": "Agua y Saneamientos Argentinos",
    "organizacion": "AySA",
    "url": "https://www.aysa.com.ar/",
    "publicado": "2025"
  },
  {
    "slug": "water-footprint-network",
    "titulo": "Product gallery: the water footprint of products",
    "organizacion": "Water Footprint Network",
    "url": "https://www.waterfootprint.org/resources/interactive-tools/product-gallery/",
    "publicado": "2017"
  },
  {
    "slug": "ley-26639-glaciares",
    "titulo": "Ley 26.639 — Régimen de Presupuestos Mínimos para la Preservación de los Glaciares y del Ambiente Periglacial",
    "organizacion": "Congreso de la Nación Argentina",
    "url": "https://www.argentina.gob.ar/normativa/nacional/ley-26639-174117",
    "publicado": "2010"
  },
  {
    "slug": "iea-eficiencia",
    "titulo": "Energy Efficiency",
    "organizacion": "Agencia Internacional de Energía",
    "url": "https://www.iea.org/energy-system/energy-efficiency-and-demand/energy-efficiency",
    "publicado": "2024"
  },
  {
    "slug": "iea-datacenters",
    "titulo": "Data centres and data transmission networks",
    "organizacion": "Agencia Internacional de Energía",
    "url": "https://www.iea.org/energy-system/buildings/data-centres-and-data-transmission-networks",
    "publicado": "2024"
  },
  {
    "slug": "unep-plasticos",
    "titulo": "Plastic pollution",
    "organizacion": "Programa de las Naciones Unidas para el Medio Ambiente",
    "url": "https://www.unep.org/plastic-pollution",
    "publicado": "2024"
  },
  {
    "slug": "ewaste-monitor",
    "titulo": "The Global E-waste Monitor 2024",
    "organizacion": "UIT y UNITAR",
    "url": "https://ewastemonitor.info/",
    "publicado": "2024"
  },
  {
    "slug": "ceamse",
    "titulo": "Coordinación Ecológica Área Metropolitana Sociedad del Estado",
    "organizacion": "CEAMSE",
    "url": "https://www.ceamse.gov.ar/",
    "publicado": "2025"
  },
  {
    "slug": "ley-25916-residuos",
    "titulo": "Ley 25.916 — Gestión de Residuos Domiciliarios",
    "organizacion": "Congreso de la Nación Argentina",
    "url": "https://www.argentina.gob.ar/normativa/nacional/ley-25916-98327",
    "publicado": "2004"
  },
  {
    "slug": "poore-nemecek-2018",
    "titulo": "Reducing food’s environmental impacts through producers and consumers",
    "organizacion": "Science (Poore y Nemecek)",
    "url": "https://www.science.org/doi/10.1126/science.aaq0216",
    "publicado": "2018"
  },
  {
    "slug": "ley-27642-etiquetado",
    "titulo": "Ley 27.642 — Promoción de la Alimentación Saludable",
    "organizacion": "Congreso de la Nación Argentina",
    "url": "https://www.argentina.gob.ar/normativa/nacional/ley-27642-356607",
    "publicado": "2021"
  },
  {
    "slug": "guias-alimentarias-ar",
    "titulo": "Guías Alimentarias para la Población Argentina — manual de aplicación",
    "organizacion": "Ministerio de Salud de la Nación",
    "url": "https://www.argentina.gob.ar/sites/default/files/bancos/2020-08/guias-alimentarias-para-la-poblacion-argentina_manual-de-aplicacion_0.pdf",
    "publicado": "2016"
  },
  {
    "slug": "fao-suelos",
    "titulo": "Portal de Suelos de la FAO",
    "organizacion": "FAO",
    "url": "https://www.fao.org/soils-portal/es/",
    "publicado": "2024"
  },
  {
    "slug": "fao-pesca-sofia",
    "titulo": "El estado mundial de la pesca y la acuicultura",
    "organizacion": "FAO",
    "url": "https://www.fao.org/publications/home/fao-flagship-publications/the-state-of-world-fisheries-and-aquaculture/es",
    "publicado": "2024"
  },
  {
    "slug": "oms-calidad-aire",
    "titulo": "Directrices mundiales de la OMS sobre la calidad del aire",
    "organizacion": "Organización Mundial de la Salud",
    "url": "https://www.who.int/publications/i/item/9789240034228",
    "publicado": "2021"
  },
  {
    "slug": "oms-actividad-fisica",
    "titulo": "Actividad física (nota descriptiva)",
    "organizacion": "Organización Mundial de la Salud",
    "url": "https://www.who.int/es/news-room/fact-sheets/detail/physical-activity",
    "publicado": "2024"
  },
  {
    "slug": "noaa-acidificacion",
    "titulo": "Ocean acidification",
    "organizacion": "NOAA",
    "url": "https://www.noaa.gov/education/resource-collections/ocean-coasts/ocean-acidification",
    "publicado": "2023"
  },
  {
    "slug": "parques-nacionales",
    "titulo": "Administración de Parques Nacionales",
    "organizacion": "Parques Nacionales (Argentina)",
    "url": "https://www.argentina.gob.ar/parquesnacionales",
    "publicado": "2025"
  },
  {
    "slug": "vida-silvestre",
    "titulo": "Fundación Vida Silvestre Argentina",
    "organizacion": "Fundación Vida Silvestre Argentina",
    "url": "https://www.vidasilvestre.org.ar/",
    "publicado": "2025"
  },
  {
    "slug": "lally-2010-habitos",
    "titulo": "How are habits formed: Modelling habit formation in the real world",
    "organizacion": "European Journal of Social Psychology (Lally et al.)",
    "url": "https://onlinelibrary.wiley.com/doi/10.1002/ejsp.674",
    "publicado": "2010"
  },
  {
    "slug": "bit-east",
    "titulo": "EAST: Four simple ways to apply behavioural insights",
    "organizacion": "The Behavioural Insights Team",
    "url": "https://www.bi.team/publications/east-four-simple-ways-to-apply-behavioural-insights/",
    "publicado": "2014"
  },
  {
    "slug": "inventario-glaciares",
    "titulo": "Inventario Nacional de Glaciares",
    "organizacion": "IANIGLA-CONICET y Ministerio de Ambiente",
    "url": "https://www.glaciaresargentinos.gob.ar/",
    "publicado": "2018"
  },
  {
    "slug": "bar-on-biomasa-2018",
    "titulo": "The biomass distribution on Earth",
    "organizacion": "PNAS (Bar-On, Phillips y Milo)",
    "url": "https://www.pnas.org/doi/10.1073/pnas.1711842115",
    "publicado": "2018"
  },
  {
    "slug": "loss-2013-gatos",
    "titulo": "The impact of free-ranging domestic cats on wildlife of the United States",
    "organizacion": "Nature Communications (Loss, Will y Marra)",
    "url": "https://www.nature.com/articles/ncomms2380",
    "publicado": "2013"
  },
  {
    "slug": "loss-2014-vidrios",
    "titulo": "Bird–window collisions in the United States",
    "organizacion": "The Condor (Loss, Will, Loss y Marra)",
    "url": "https://academic.oup.com/condor/article/116/1/8/5153098",
    "publicado": "2014"
  },
  {
    "slug": "oms-aire-exterior",
    "titulo": "Calidad del aire ambiente (exterior) y salud (nota descriptiva)",
    "organizacion": "Organización Mundial de la Salud",
    "url": "https://www.who.int/es/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health",
    "publicado": "2024"
  },
  {
    "slug": "oms-aire-hogar",
    "titulo": "Contaminación del aire doméstico y salud (nota descriptiva)",
    "organizacion": "Organización Mundial de la Salud",
    "url": "https://www.who.int/es/news-room/fact-sheets/detail/household-air-pollution-and-health",
    "publicado": "2024"
  },
  {
    "slug": "anthony-2023-suelo",
    "titulo": "Enumerating soil biodiversity",
    "organizacion": "PNAS (Anthony, Bender y van der Heijden)",
    "url": "https://www.pnas.org/doi/10.1073/pnas.2304663120",
    "publicado": "2023"
  },
  {
    "slug": "fao-suelos-degradacion",
    "titulo": "Estado mundial del recurso suelo (resumen técnico)",
    "organizacion": "FAO y Grupo Técnico Intergubernamental de Suelos",
    "url": "https://www.fao.org/3/i5126s/i5126s.pdf",
    "publicado": "2015"
  },
  {
    "slug": "owid-transporte",
    "titulo": "Which form of transport has the smallest carbon footprint?",
    "organizacion": "Our World in Data",
    "url": "https://ourworldindata.org/travel-carbon-footprint",
    "publicado": "2023"
  },
  {
    "slug": "oms-seguridad-vial",
    "titulo": "Traumatismos causados por el tránsito (nota descriptiva)",
    "organizacion": "Organización Mundial de la Salud",
    "url": "https://www.who.int/es/news-room/fact-sheets/detail/road-traffic-injuries",
    "publicado": "2023"
  },
  {
    "slug": "emf-textiles",
    "titulo": "A new textiles economy: Redesigning fashion’s future",
    "organizacion": "Ellen MacArthur Foundation",
    "url": "https://www.ellenmacarthurfoundation.org/a-new-textiles-economy",
    "publicado": "2017"
  },
  {
    "slug": "unep-moda",
    "titulo": "Putting the brakes on fast fashion",
    "organizacion": "Programa de las Naciones Unidas para el Medio Ambiente",
    "url": "https://www.unep.org/news-and-stories/story/putting-brakes-fast-fashion",
    "publicado": "2018"
  },
  {
    "slug": "ce-green-claims",
    "titulo": "Green claims",
    "organizacion": "Comisión Europea",
    "url": "https://environment.ec.europa.eu/topics/circular-economy/green-claims_en",
    "publicado": "2023"
  },
  {
    "slug": "senasa-organicos",
    "titulo": "Producción orgánica",
    "organizacion": "SENASA",
    "url": "https://www.argentina.gob.ar/senasa/programas-sanitarios/produccion-organica",
    "publicado": "2024"
  },
  {
    "slug": "iea-streaming",
    "titulo": "The carbon footprint of streaming video: fact-checking the headlines",
    "organizacion": "Agencia Internacional de Energía (IEA)",
    "url": "https://www.iea.org/commentaries/the-carbon-footprint-of-streaming-video-fact-checking-the-headlines",
    "publicado": "2020"
  },
  {
    "slug": "global-forest-watch",
    "titulo": "Global Forest Watch",
    "organizacion": "World Resources Institute",
    "url": "https://www.globalforestwatch.org/",
    "publicado": "2024"
  },
  {
    "slug": "nasa-firms",
    "titulo": "FIRMS — Fire Information for Resource Management System",
    "organizacion": "NASA",
    "url": "https://firms.modaps.eosdis.nasa.gov/",
    "publicado": "2024"
  },
  {
    "slug": "conae",
    "titulo": "Comisión Nacional de Actividades Espaciales (CONAE)",
    "organizacion": "Gobierno de Argentina",
    "url": "https://www.argentina.gob.ar/ciencia/conae",
    "publicado": "2024"
  },
  {
    "slug": "pampa-azul",
    "titulo": "Iniciativa Pampa Azul",
    "organizacion": "Gobierno de Argentina",
    "url": "https://www.pampazul.gob.ar/",
    "publicado": "2024"
  },
  {
    "slug": "inidep",
    "titulo": "Instituto Nacional de Investigación y Desarrollo Pesquero (INIDEP)",
    "organizacion": "INIDEP",
    "url": "https://www.inidep.edu.ar/",
    "publicado": "2024"
  },
  {
    "slug": "mst-bolsas-2018",
    "titulo": "Life Cycle Assessment of grocery carrier bags",
    "organizacion": "Danish Environmental Protection Agency",
    "url": "https://www2.mst.dk/Udgiv/publications/2018/02/978-87-93614-73-4.pdf",
    "publicado": "2018"
  },
  {
    "slug": "iai-reciclaje-aluminio",
    "titulo": "Aluminium recycling",
    "organizacion": "European Aluminium",
    "url": "https://european-aluminium.eu/about-aluminium/aluminium-recycling/",
    "publicado": "2024"
  },
  {
    "slug": "oecd-plasticos",
    "titulo": "Global Plastics Outlook: Economic Drivers, Environmental Impacts and Policy Options",
    "organizacion": "OCDE",
    "url": "https://www.oecd.org/en/publications/global-plastics-outlook_de747aef-en.html",
    "publicado": "2022"
  },
  {
    "slug": "onu-ods",
    "titulo": "Objetivos de Desarrollo Sostenible",
    "organizacion": "Naciones Unidas",
    "url": "https://sdgs.un.org/goals",
    "publicado": "2015"
  }
];

export const RAMAS_FUENTES: RamaFuentes[] = [
  {
    "slug": "tronco",
    "nombre": "Tronco",
    "unidades": [
      {
        "slug": "tronco-1",
        "titulo": "Todo está conectado",
        "fuentes": [
          "unesco-ods",
          "usgs-ciclo-agua",
          "nasa-ciclo-carbono",
          "ipbes-global",
          "global-footprint",
          "invasoras-mayds",
          "unep"
        ]
      },
      {
        "slug": "tronco-2",
        "titulo": "Medir para entender",
        "fuentes": [
          "ipcc-ar6",
          "ipcc-ar6-syr",
          "owid-co2",
          "owid-energia",
          "iea-eficiencia",
          "wynes-nicholas-2017",
          "inventario-gei-ar"
        ]
      },
      {
        "slug": "tronco-3",
        "titulo": "Del saber al hacer",
        "fuentes": [
          "bit-east",
          "lally-2010-habitos",
          "wynes-nicholas-2017",
          "ecoansiedad-review",
          "unesco-ods",
          "ley-27621-eai",
          "naaee-guidelines"
        ]
      }
    ]
  },
  {
    "slug": "agua_azul",
    "nombre": "Océanos y Ríos",
    "unidades": [
      {
        "slug": "oceanos-1",
        "titulo": "El planeta azul",
        "fuentes": [
          "ipcc-ar6-syr",
          "global-carbon-budget",
          "noaa-acidificacion",
          "pampa-azul",
          "inidep",
          "ramsar",
          "parques-nacionales"
        ]
      },
      {
        "slug": "oceanos-2",
        "titulo": "Pesca y alimentos del agua",
        "fuentes": [
          "fao-pesca-sofia",
          "inidep",
          "milla-201",
          "pampa-azul",
          "vida-silvestre"
        ]
      }
    ]
  },
  {
    "slug": "agua",
    "nombre": "Agua",
    "unidades": [
      {
        "slug": "agua-1",
        "titulo": "El agua que usamos",
        "fuentes": [
          "usgs-ciclo-agua",
          "unep",
          "aysa",
          "oms-agua-potable",
          "un-water",
          "acumar",
          "acuifero-puelche"
        ]
      },
      {
        "slug": "agua-2",
        "titulo": "Cuidar el agua en casa",
        "fuentes": [
          "aysa",
          "un-water",
          "epa",
          "iea-eficiencia",
          "plantas-nativas"
        ]
      },
      {
        "slug": "agua-3",
        "titulo": "Del desagüe al río",
        "fuentes": [
          "acumar",
          "aysa",
          "unep",
          "unep-plasticos",
          "oms-agua-potable",
          "ley-25675-ambiente"
        ]
      },
      {
        "slug": "agua-4",
        "titulo": "El agua invisible",
        "fuentes": [
          "water-footprint-network",
          "huella-hidrica",
          "owid-impactos-alimentos",
          "fao",
          "un-water"
        ]
      },
      {
        "slug": "agua-5",
        "titulo": "Cuencas, humedales e inundaciones",
        "fuentes": [
          "acumar",
          "ramsar",
          "incendios-delta-2020",
          "unep",
          "un-water",
          "ipbes-global",
          "ley-25675-ambiente"
        ]
      },
      {
        "slug": "agua-6",
        "titulo": "Agua y futuro",
        "fuentes": [
          "acuifero-puelche",
          "nitratos-puelche",
          "oms-agua-potable",
          "ley-26639-glaciares",
          "inventario-glaciares",
          "ipcc-ar6",
          "un-water",
          "unep"
        ]
      }
    ]
  },
  {
    "slug": "alimentacion",
    "nombre": "Alimentación",
    "unidades": [
      {
        "slug": "alimentacion-1",
        "titulo": "Del campo al plato",
        "fuentes": [
          "guias-alimentarias-ar",
          "owid-impactos-alimentos",
          "owid-alimentos",
          "poore-nemecek-2018",
          "fao",
          "inta"
        ]
      },
      {
        "slug": "alimentacion-2",
        "titulo": "La huella de lo que comemos",
        "fuentes": [
          "poore-nemecek-2018",
          "owid-alimentos",
          "owid-impactos-alimentos",
          "guias-alimentarias-ar",
          "ipcc-ar6-syr"
        ]
      }
    ]
  },
  {
    "slug": "plantas",
    "nombre": "Plantas y Verde Urbano",
    "unidades": [
      {
        "slug": "plantas-1",
        "titulo": "Cómo vive una planta",
        "fuentes": [
          "bar-on-biomasa-2018",
          "fao-suelos",
          "ipbes-global",
          "plantas-nativas",
          "inta"
        ]
      },
      {
        "slug": "plantas-2",
        "titulo": "Nativas, exóticas e invasoras",
        "fuentes": [
          "ecorregiones-pba",
          "plantas-nativas",
          "invasoras-mayds",
          "ipbes-global",
          "sib-apn",
          "reserva-costanera-sur"
        ]
      }
    ]
  },
  {
    "slug": "animales",
    "nombre": "Animales y Vida Silvestre",
    "unidades": [
      {
        "slug": "animales-1",
        "titulo": "La trama de la vida",
        "fuentes": [
          "ipbes-global",
          "iucn-red-list",
          "sib-apn",
          "sarem-2019",
          "aves-argentinas",
          "parques-nacionales",
          "gbif"
        ]
      },
      {
        "slug": "animales-2",
        "titulo": "Vecinos silvestres",
        "fuentes": [
          "protocolo-fauna-cba",
          "red-centros-rescate",
          "crfs-ecoparque",
          "gcba-cinco-libertades",
          "ley-22421-fauna",
          "cites",
          "conicet-carpinchos",
          "loss-2013-gatos",
          "loss-2014-vidrios",
          "invasoras-mayds",
          "aves-argentinas"
        ]
      }
    ]
  },
  {
    "slug": "aire_suelo",
    "nombre": "Aire y Suelo",
    "unidades": [
      {
        "slug": "aire-suelo-1",
        "titulo": "El aire que respirás",
        "fuentes": [
          "oms-calidad-aire",
          "oms-aire-exterior",
          "oms-aire-hogar",
          "noaa-co2",
          "epa",
          "ncse-ozono"
        ]
      },
      {
        "slug": "aire-suelo-2",
        "titulo": "El suelo vivo",
        "fuentes": [
          "fao-suelos",
          "fao-suelos-degradacion",
          "anthony-2023-suelo",
          "inta",
          "ipbes-global"
        ]
      }
    ]
  },
  {
    "slug": "ciencia",
    "nombre": "Ciencia Ciudadana",
    "unidades": [
      {
        "slug": "ciencia-1",
        "titulo": "Cómo sabemos lo que sabemos",
        "fuentes": [
          "consenso-cook-2016",
          "ipcc-ar6-syr",
          "nasa-evidencia",
          "chequeado",
          "ncse-ozono",
          "naaee-guidelines"
        ]
      },
      {
        "slug": "ciencia-2",
        "titulo": "Leer gráficos y datos",
        "fuentes": [
          "noaa-co2",
          "nasa-evidencia",
          "owid-co2",
          "chequeado",
          "ipcc-ar6-syr"
        ]
      }
    ]
  },
  {
    "slug": "energia",
    "nombre": "Energía y CO₂",
    "unidades": [
      {
        "slug": "energia-1",
        "titulo": "Qué es la energía",
        "fuentes": [
          "iea-energia",
          "owid-energia",
          "owid-co2",
          "ipcc-ar6-syr",
          "iea-eficiencia"
        ]
      },
      {
        "slug": "energia-2",
        "titulo": "La energía en casa",
        "fuentes": [
          "iea-eficiencia",
          "iea-energia",
          "owid-energia"
        ]
      }
    ]
  },
  {
    "slug": "movilidad",
    "nombre": "Movilidad",
    "unidades": [
      {
        "slug": "movilidad-1",
        "titulo": "Cómo nos movemos",
        "fuentes": [
          "owid-transporte",
          "oms-seguridad-vial",
          "oms-actividad-fisica",
          "icct-ev",
          "oms-aire-exterior"
        ]
      },
      {
        "slug": "movilidad-2",
        "titulo": "Caminar y pedalear",
        "fuentes": [
          "oms-actividad-fisica",
          "oms-seguridad-vial",
          "owid-transporte",
          "oms-aire-exterior"
        ]
      }
    ]
  },
  {
    "slug": "residuos",
    "nombre": "Residuos y Reciclaje",
    "unidades": [
      {
        "slug": "residuos-1",
        "titulo": "Qué pasa con lo que tirás",
        "fuentes": [
          "ley-25916-residuos",
          "ceamse",
          "ley-1854-basura-cero",
          "faccyr",
          "epa"
        ]
      },
      {
        "slug": "residuos-2",
        "titulo": "Reducir, reutilizar, reciclar",
        "fuentes": [
          "ellen-macarthur",
          "yale-reciclaje",
          "unep-plasticos",
          "oecd-plasticos",
          "mst-bolsas-2018",
          "iai-reciclaje-aluminio",
          "ley-25916-residuos",
          "epa"
        ]
      }
    ]
  },
  {
    "slug": "consumo",
    "nombre": "Consumo Responsable",
    "unidades": [
      {
        "slug": "consumo-1",
        "titulo": "Lo que hay detrás de lo que comprás",
        "fuentes": [
          "global-footprint",
          "emf-textiles",
          "unep-moda",
          "ewaste-monitor",
          "ellen-macarthur"
        ]
      },
      {
        "slug": "consumo-2",
        "titulo": "Etiquetas, sellos y greenwashing",
        "fuentes": [
          "ley-27642-etiquetado",
          "ce-green-claims",
          "senasa-organicos",
          "unep-plasticos",
          "ellen-macarthur"
        ]
      }
    ]
  },
  {
    "slug": "digital",
    "nombre": "Digital y Tecnología",
    "unidades": [
      {
        "slug": "digital-1",
        "titulo": "La huella de lo digital",
        "fuentes": [
          "iea-datacenters",
          "iea-streaming",
          "ewaste-monitor",
          "carbon-brief"
        ]
      },
      {
        "slug": "digital-2",
        "titulo": "Tecnología que ayuda",
        "fuentes": [
          "global-forest-watch",
          "nasa-firms",
          "conae",
          "argentinat",
          "ebird",
          "gbif",
          "iea-eficiencia"
        ]
      }
    ]
  },
  {
    "slug": "comunidad",
    "nombre": "Comunidad",
    "unidades": [
      {
        "slug": "comunidad-1",
        "titulo": "Del yo al nosotros",
        "fuentes": [
          "bit-east",
          "lally-2010-habitos",
          "ecoansiedad-review",
          "onu-ods",
          "naaee-guidelines"
        ]
      },
      {
        "slug": "comunidad-2",
        "titulo": "Derechos y participación ambiental",
        "fuentes": [
          "ley-25675-ambiente",
          "ley-25831-info",
          "escazu",
          "ley-27621-eai",
          "onu-ods",
          "unesco-ods",
          "acumar"
        ]
      }
    ]
  }
];
