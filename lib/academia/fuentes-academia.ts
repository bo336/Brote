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
    "slug": "iucn-categorias",
    "titulo": "IUCN Red List Categories and Criteria, versión 3.1",
    "organizacion": "IUCN",
    "url": "https://portals.iucn.org/library/sites/library/files/documents/RL-2001-001.pdf",
    "publicado": "2001"
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
    "slug": "aves-argentinas-amenazadas",
    "titulo": "Categorización de las aves de Argentina según su estado de conservación",
    "organizacion": "Aves Argentinas / AOP",
    "url": "https://www.avesargentinas.org.ar/aves-amenazadas",
    "publicado": "2024"
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
    "slug": "rewilding-argentina",
    "titulo": "Fundación Rewilding Argentina — quiénes somos",
    "organizacion": "Fundación Rewilding Argentina",
    "url": "https://rewildingargentina.org/",
    "publicado": "2025"
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
    "slug": "ley-bosques-26331",
    "titulo": "Ley 26.331 de Presupuestos Mínimos de Protección Ambiental de los Bosques Nativos",
    "organizacion": "Congreso de la Nación Argentina",
    "url": "https://www.derecho.uba.ar/academica/derecho-abierto/archivos/Ley-26331.pdf",
    "publicado": "2007"
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
    "slug": "rep-envases",
    "titulo": "Ley de Envases y Responsabilidad Extendida del Productor",
    "organizacion": "Fundación Metropolitana",
    "url": "https://metropolitana.org.ar/idm/ley-de-envases-y-responsabilidad-extendida-del-productor/",
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
    "slug": "cammesa",
    "titulo": "Compañía Administradora del Mercado Mayorista Eléctrico",
    "organizacion": "CAMMESA",
    "url": "https://www.cammesa.com/",
    "publicado": "2025"
  },
  {
    "slug": "ley-27424-generacion",
    "titulo": "Ley 27.424 — Régimen de Fomento a la Generación Distribuida de Energía Renovable",
    "organizacion": "Congreso de la Nación Argentina",
    "url": "https://www.argentina.gob.ar/normativa/nacional/ley-27424-305179",
    "publicado": "2017"
  },
  {
    "slug": "iea-eficiencia",
    "titulo": "Energy Efficiency",
    "organizacion": "Agencia Internacional de Energía",
    "url": "https://www.iea.org/energy-system/energy-efficiency-and-demand/energy-efficiency",
    "publicado": "2024"
  },
  {
    "slug": "irena",
    "titulo": "International Renewable Energy Agency",
    "organizacion": "IRENA",
    "url": "https://www.irena.org/",
    "publicado": "2025"
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
    "slug": "unep-food-waste-2024",
    "titulo": "Food Waste Index Report 2024",
    "organizacion": "Programa de las Naciones Unidas para el Medio Ambiente",
    "url": "https://www.unep.org/resources/publication/food-waste-index-report-2024",
    "publicado": "2024"
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
    "slug": "ipbes-polinizadores",
    "titulo": "Assessment Report on Pollinators, Pollination and Food Production",
    "organizacion": "IPBES",
    "url": "https://www.ipbes.net/assessment-reports/pollinators",
    "publicado": "2016"
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
    "slug": "fao-agroecologia",
    "titulo": "Centro de conocimientos sobre agroecología",
    "organizacion": "FAO",
    "url": "https://www.fao.org/agroecology/overview/es/",
    "publicado": "2024"
  },
  {
    "slug": "red-bancos-alimentos",
    "titulo": "Red Argentina de Bancos de Alimentos",
    "organizacion": "Red Argentina de Bancos de Alimentos",
    "url": "https://www.redbda.org.ar/",
    "publicado": "2024"
  },
  {
    "slug": "epa-isla-calor",
    "titulo": "Using Trees and Vegetation to Reduce Heat Islands",
    "organizacion": "US EPA",
    "url": "https://www.epa.gov/heatislands/using-trees-and-vegetation-reduce-heat-islands",
    "publicado": "2024"
  },
  {
    "slug": "oms-espacios-verdes",
    "titulo": "Urban green spaces: a brief for action",
    "organizacion": "Organización Mundial de la Salud (Europa)",
    "url": "https://www.who.int/europe/publications/i/item/9789289052498",
    "publicado": "2017"
  },
  {
    "slug": "noaa-co2-historia",
    "titulo": "Climate Change: Atmospheric Carbon Dioxide",
    "organizacion": "NOAA Climate.gov",
    "url": "https://www.climate.gov/news-features/understanding-climate/climate-change-atmospheric-carbon-dioxide",
    "publicado": "2025"
  },
  {
    "slug": "nasa-gistemp",
    "titulo": "GISS Surface Temperature Analysis (GISTEMP v4)",
    "organizacion": "NASA Goddard Institute for Space Studies",
    "url": "https://data.giss.nasa.gov/gistemp/",
    "publicado": "2025"
  },
  {
    "slug": "copernicus-clima-2024",
    "titulo": "Global Climate Highlights 2024",
    "organizacion": "Copernicus Climate Change Service",
    "url": "https://climate.copernicus.eu/global-climate-highlights-2024",
    "publicado": "2025"
  },
  {
    "slug": "wmo-clima-2024",
    "titulo": "State of the Global Climate 2024",
    "organizacion": "Organización Meteorológica Mundial",
    "url": "https://wmo.int/publication-series/state-of-global-climate/state-of-global-climate-2024",
    "publicado": "2025"
  },
  {
    "slug": "noaa-nivel-mar",
    "titulo": "Climate Change: Global Sea Level",
    "organizacion": "NOAA Climate.gov",
    "url": "https://www.climate.gov/news-features/understanding-climate/climate-change-global-sea-level",
    "publicado": "2024"
  },
  {
    "slug": "wwa-atribucion",
    "titulo": "World Weather Attribution",
    "organizacion": "World Weather Attribution",
    "url": "https://www.worldweatherattribution.org/",
    "publicado": "2025"
  },
  {
    "slug": "ipcc-sr15",
    "titulo": "Global Warming of 1.5 °C",
    "organizacion": "IPCC",
    "url": "https://www.ipcc.ch/sr15/",
    "publicado": "2018"
  },
  {
    "slug": "acuerdo-paris",
    "titulo": "The Paris Agreement",
    "organizacion": "Convención Marco de las Naciones Unidas sobre el Cambio Climático",
    "url": "https://unfccc.int/process-and-meetings/the-paris-agreement",
    "publicado": "2015"
  },
  {
    "slug": "vosoughi-2018",
    "titulo": "The spread of true and false news online",
    "organizacion": "Science (Vosoughi, Roy y Aral)",
    "url": "https://www.science.org/doi/10.1126/science.aap9559",
    "publicado": "2018"
  },
  {
    "slug": "flicc-cook",
    "titulo": "The history of FLICC: the 5 techniques of science denial",
    "organizacion": "Skeptical Science (John Cook)",
    "url": "https://skepticalscience.com/history-FLICC-5-techniques-science-denial.html",
    "publicado": "2020"
  },
  {
    "slug": "first-draft-tipos",
    "titulo": "Fake news. It’s complicated.",
    "organizacion": "First Draft (Claire Wardle)",
    "url": "https://firstdraftnews.org/articles/fake-news-complicated/",
    "publicado": "2017"
  },
  {
    "slug": "inoculacion",
    "titulo": "Inoculation Science",
    "organizacion": "Cambridge Social Decision-Making Lab",
    "url": "https://inoculation.science/",
    "publicado": "2025"
  },
  {
    "slug": "lectura-lateral",
    "titulo": "Civic Online Reasoning",
    "organizacion": "Digital Inquiry Group (ex Stanford History Education Group)",
    "url": "https://cor.inquirygroup.org/",
    "publicado": "2025"
  },
  {
    "slug": "cochrane",
    "titulo": "About Cochrane",
    "organizacion": "Cochrane",
    "url": "https://www.cochrane.org/about-us",
    "publicado": "2025"
  },
  {
    "slug": "ecsa-principios",
    "titulo": "Ten Principles of Citizen Science",
    "organizacion": "European Citizen Science Association",
    "url": "https://www.ecsa.ngo/10-principles/",
    "publicado": "2015"
  },
  {
    "slug": "inaturalist-calidad",
    "titulo": "What is the Data Quality Assessment and how do observations qualify to become Research Grade?",
    "organizacion": "iNaturalist",
    "url": "https://help.inaturalist.org/en/support/solutions/articles/151000169936-what-is-the-data-quality-assessment-and-how-do-observations-qualify-to-become-research-grade-",
    "publicado": "2025"
  },
  {
    "slug": "geovin",
    "titulo": "GeoVin: el proyecto de ciencia ciudadana sobre vinchucas",
    "organizacion": "Proyecto GeoVin (investigadores del CONICET)",
    "url": "https://geovin.com.ar/",
    "publicado": "2025"
  },
  {
    "slug": "red-sube",
    "titulo": "Red SUBE",
    "organizacion": "Gobierno de la República Argentina",
    "url": "https://www.argentina.gob.ar/redsube",
    "publicado": "2025"
  },
  {
    "slug": "metrobus-gcba",
    "titulo": "Metrobus",
    "organizacion": "Gobierno de la Ciudad de Buenos Aires",
    "url": "https://buenosaires.gob.ar/gcaba_historico/metrobus",
    "publicado": "2024"
  },
  {
    "slug": "itdp-brt",
    "titulo": "The Bus Rapid Transit Standard",
    "organizacion": "Institute for Transportation and Development Policy",
    "url": "https://itdp.org/library/standards-and-guides/the-bus-rapid-transit-standard/",
    "publicado": "2024"
  },
  {
    "slug": "human-transit",
    "titulo": "Explainer: The Transit Ridership Recipe",
    "organizacion": "Human Transit (Jarrett Walker)",
    "url": "https://humantransit.org/2015/07/mega-explainer-the-ridership-recipe.html",
    "publicado": "2015"
  },
  {
    "slug": "epa-auto-tipico",
    "titulo": "Greenhouse Gas Emissions from a Typical Passenger Vehicle",
    "organizacion": "Agencia de Protección Ambiental de EE. UU. (EPA)",
    "url": "https://www.epa.gov/greenvehicles/greenhouse-gas-emissions-typical-passenger-vehicle",
    "publicado": "2024"
  },
  {
    "slug": "icct-ev-global",
    "titulo": "A global comparison of the life-cycle greenhouse gas emissions of combustion engine and electric passenger cars",
    "organizacion": "ICCT — International Council on Clean Transportation",
    "url": "https://theicct.org/publication/a-global-comparison-of-the-life-cycle-greenhouse-gas-emissions-of-combustion-engine-and-electric-passenger-cars/",
    "publicado": "2021"
  },
  {
    "slug": "iea-ev-outlook",
    "titulo": "Global EV Outlook 2025",
    "organizacion": "Agencia Internacional de Energía",
    "url": "https://www.iea.org/reports/global-ev-outlook-2025",
    "publicado": "2025"
  },
  {
    "slug": "oecd-no-escape",
    "titulo": "Non-exhaust Particulate Emissions from Road Transport",
    "organizacion": "OCDE",
    "url": "https://www.oecd.org/en/publications/non-exhaust-particulate-emissions-from-road-transport_4a4dc6ca-en.html",
    "publicado": "2020"
  },
  {
    "slug": "doe-eficiencia-ev",
    "titulo": "All-Electric Vehicles",
    "organizacion": "Departamento de Energía de EE. UU. (fueleconomy.gov)",
    "url": "https://www.fueleconomy.gov/feg/evtech.shtml",
    "publicado": "2025"
  },
  {
    "slug": "ley-27640-biocombustibles",
    "titulo": "Ley 27.640 — Marco regulatorio de biocombustibles",
    "organizacion": "Congreso de la Nación Argentina",
    "url": "https://www.argentina.gob.ar/normativa/nacional/ley-27640-352587",
    "publicado": "2021"
  },
  {
    "slug": "circularity-gap-2025",
    "titulo": "Circularity Gap Report 2025",
    "organizacion": "Circle Economy y Deloitte",
    "url": "https://circularity-gap.world/2025",
    "publicado": "2025"
  },
  {
    "slug": "emf-mariposa",
    "titulo": "The butterfly diagram: visualising the circular economy",
    "organizacion": "Ellen MacArthur Foundation",
    "url": "https://www.ellenmacarthurfoundation.org/circular-economy-diagram",
    "publicado": "2024"
  },
  {
    "slug": "ue-ecodiseno",
    "titulo": "Ecodesign for Sustainable Products Regulation",
    "organizacion": "Comisión Europea",
    "url": "https://environment.ec.europa.eu/strategy/circular-economy/ecodesign-sustainable-products-regulation_en",
    "publicado": "2024"
  },
  {
    "slug": "ue-derecho-reparar",
    "titulo": "Right to repair: making repair easier and more appealing to consumers",
    "organizacion": "Parlamento Europeo",
    "url": "https://www.europarl.europa.eu/news/en/press-room/20240419IPR20590/right-to-repair-making-repair-easier-and-more-appealing-to-consumers",
    "publicado": "2024"
  },
  {
    "slug": "bm-precio-carbono",
    "titulo": "State and Trends of Carbon Pricing",
    "organizacion": "Banco Mundial",
    "url": "https://www.worldbank.org/en/publication/state-and-trends-of-carbon-pricing",
    "publicado": "2026"
  },
  {
    "slug": "fmi-subsidios",
    "titulo": "IMF Fossil Fuel Subsidies Data: 2023 Update",
    "organizacion": "Fondo Monetario Internacional",
    "url": "https://www.imf.org/en/Publications/WP/Issues/2023/08/22/IMF-Fossil-Fuel-Subsidies-Data-2023-Update-537281",
    "publicado": "2023"
  },
  {
    "slug": "fao-sofa-2023",
    "titulo": "El estado mundial de la agricultura y la alimentación 2023: los costos ocultos de los sistemas agroalimentarios",
    "organizacion": "FAO",
    "url": "https://www.fao.org/publications/fao-flagship-publications/the-state-of-food-and-agriculture/2023/en",
    "publicado": "2023"
  },
  {
    "slug": "ley-27430-impuesto-co2",
    "titulo": "Ley 27.430 — Impuesto al dióxido de carbono sobre los combustibles",
    "organizacion": "Congreso de la Nación Argentina",
    "url": "https://www.argentina.gob.ar/normativa/nacional/ley-27430-305262",
    "publicado": "2017"
  },
  {
    "slug": "iea-energia-ia",
    "titulo": "Energy and AI",
    "organizacion": "Agencia Internacional de Energía",
    "url": "https://www.iea.org/reports/energy-and-ai/energy-demand-from-ai",
    "publicado": "2025"
  },
  {
    "slug": "uptime-2024",
    "titulo": "Uptime Institute Global Data Center Survey Results 2024",
    "organizacion": "Uptime Institute",
    "url": "https://uptimeinstitute.com/resources/research-and-reports/uptime-institute-global-data-center-survey-results-2024",
    "publicado": "2024"
  },
  {
    "slug": "google-ia-2025",
    "titulo": "Measuring the environmental impact of delivering AI at Google Scale",
    "organizacion": "Google (Elsworth y otros), arXiv",
    "url": "https://arxiv.org/abs/2508.15734",
    "publicado": "2025"
  },
  {
    "slug": "usgs-litio-2025",
    "titulo": "Mineral Commodity Summaries 2025: Lithium",
    "organizacion": "Servicio Geológico de EE. UU. (USGS)",
    "url": "https://pubs.usgs.gov/periodicals/mcs2025/mcs2025-lithium.pdf",
    "publicado": "2025"
  },
  {
    "slug": "usgs-cobalto-2025",
    "titulo": "Mineral Commodity Summaries 2025: Cobalt",
    "organizacion": "Servicio Geológico de EE. UU. (USGS)",
    "url": "https://pubs.usgs.gov/periodicals/mcs2025/mcs2025-cobalt.pdf",
    "publicado": "2025"
  },
  {
    "slug": "iea-minerales-2025",
    "titulo": "Global Critical Minerals Outlook 2025",
    "organizacion": "Agencia Internacional de Energía",
    "url": "https://www.iea.org/reports/global-critical-minerals-outlook-2025",
    "publicado": "2025"
  },
  {
    "slug": "amnistia-cobalto",
    "titulo": "\"This is what we die for\": human rights abuses in the Democratic Republic of the Congo power the global trade in cobalt",
    "organizacion": "Amnistía Internacional",
    "url": "https://www.amnesty.org/en/documents/afr62/3183/2016/en/",
    "publicado": "2016"
  },
  {
    "slug": "ley-24196-mineria",
    "titulo": "Ley 24.196 — Inversiones mineras (tope de regalías provinciales)",
    "organizacion": "Congreso de la Nación Argentina",
    "url": "https://www.argentina.gob.ar/normativa/nacional/ley-24196-594",
    "publicado": "1993"
  },
  {
    "slug": "ue-minerales-conflicto",
    "titulo": "Conflict Minerals Regulation",
    "organizacion": "Comisión Europea",
    "url": "https://policy.trade.ec.europa.eu/development-and-sustainability/conflict-minerals-regulation_en",
    "publicado": "2021"
  },
  {
    "slug": "ocde-diligencia-minerales",
    "titulo": "OECD Due Diligence Guidance for Responsible Supply Chains of Minerals from Conflict-Affected and High-Risk Areas",
    "organizacion": "OCDE",
    "url": "https://www.oecd.org/en/publications/oecd-due-diligence-guidance-for-responsible-supply-chains-of-minerals-from-conflict-affected-and-high-risk-areas_9789264252479-en.html",
    "publicado": "2016"
  },
  {
    "slug": "ley-24071-oit-169",
    "titulo": "Ley 24.071 — Aprueba el Convenio 169 de la OIT sobre pueblos indígenas y tribales",
    "organizacion": "Congreso de la Nación Argentina",
    "url": "https://www.argentina.gob.ar/normativa/nacional/ley-24071-470",
    "publicado": "1992"
  },
  {
    "slug": "oxfam-clima-2023",
    "titulo": "Climate Equality: A planet for the 99%",
    "organizacion": "Oxfam y Stockholm Environment Institute",
    "url": "https://www.oxfam.org/en/research/climate-equality-planet-99",
    "publicado": "2023"
  },
  {
    "slug": "cij-clima-2025",
    "titulo": "Obligations of States in respect of Climate Change (opinión consultiva)",
    "organizacion": "Corte Internacional de Justicia",
    "url": "https://www.icj-cij.org/case/187",
    "publicado": "2025"
  },
  {
    "slug": "acumar-causa-mendoza",
    "titulo": "Causa Mendoza",
    "organizacion": "ACUMAR",
    "url": "https://www.acumar.gob.ar/institucional/causa-mendoza/",
    "publicado": "2024"
  },
  {
    "slug": "ejatlas",
    "titulo": "Environmental Justice Atlas",
    "organizacion": "EJAtlas (Universitat Autònoma de Barcelona)",
    "url": "https://ejatlas.org/",
    "publicado": "2025"
  },
  {
    "slug": "ejatlas-esquel",
    "titulo": "Meridian Gold Mine in Esquel, Argentina",
    "organizacion": "EJAtlas",
    "url": "https://ejatlas.org/conflict/esquel-meridian-gold-mine-argentina",
    "publicado": "2024"
  },
  {
    "slug": "global-witness-defensores",
    "titulo": "Land and Environmental Defenders",
    "organizacion": "Global Witness",
    "url": "https://globalwitness.org/en/campaigns/land-and-environmental-defenders/",
    "publicado": "2026"
  },
  {
    "slug": "cij-papeleras-2010",
    "titulo": "Pulp Mills on the River Uruguay (Argentina v. Uruguay)",
    "organizacion": "Corte Internacional de Justicia",
    "url": "https://www.icj-cij.org/case/135",
    "publicado": "2010"
  },
  {
    "slug": "diaz-rosenberg-2008",
    "titulo": "Spreading dead zones and consequences for marine ecosystems",
    "organizacion": "Science (Diaz y Rosenberg)",
    "url": "https://www.science.org/doi/10.1126/science.1156401",
    "publicado": "2008"
  },
  {
    "slug": "un-water-aguas-residuales",
    "titulo": "Progress on wastewater treatment – 2024 update",
    "organizacion": "ONU-Agua (UN-Water)",
    "url": "https://www.unwater.org/publications/progress-wastewater-treatment-2024-update",
    "publicado": "2024"
  },
  {
    "slug": "minamata",
    "titulo": "Convenio de Minamata sobre el Mercurio",
    "organizacion": "Programa de las Naciones Unidas para el Medio Ambiente",
    "url": "https://minamataconvention.org/es",
    "publicado": "2013"
  },
  {
    "slug": "ley-27490-amp",
    "titulo": "Ley 27.490 — Áreas marinas protegidas Yaganes y Namuncurá-Banco Burdwood II",
    "organizacion": "Congreso de la Nación Argentina",
    "url": "https://www.argentina.gob.ar/normativa/nacional/ley-27490-317651",
    "publicado": "2018"
  },
  {
    "slug": "cdb-meta-3",
    "titulo": "Marco Mundial de Biodiversidad Kunming-Montreal: Meta 3",
    "organizacion": "Convenio sobre la Diversidad Biológica",
    "url": "https://www.cbd.int/gbf/targets/3",
    "publicado": "2022"
  },
  {
    "slug": "mpatlas",
    "titulo": "Marine Protection Atlas",
    "organizacion": "Marine Conservation Institute",
    "url": "https://mpatlas.org/",
    "publicado": "2026"
  },
  {
    "slug": "mci-10-3",
    "titulo": "10% Protected. 3% Effective. The Widening Gap We Can’t Ignore",
    "organizacion": "Marine Conservation Institute",
    "url": "https://marine-conservation.org/on-the-tide/ten-percent-protected-three-percent-effective/",
    "publicado": "2026"
  },
  {
    "slug": "edgar-2014-neoli",
    "titulo": "Global conservation outcomes depend on marine protected areas with five key features",
    "organizacion": "Nature (Edgar y otros)",
    "url": "https://www.nature.com/articles/nature13022",
    "publicado": "2014"
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
      },
      {
        "slug": "oceanos-3",
        "titulo": "Ríos y mares contaminados",
        "fuentes": [
          "un-water-aguas-residuales",
          "diaz-rosenberg-2008",
          "oecd-plasticos",
          "unep-plasticos",
          "minamata",
          "acumar",
          "aysa",
          "vida-silvestre"
        ]
      },
      {
        "slug": "oceanos-4",
        "titulo": "Áreas protegidas del mar y la costa",
        "fuentes": [
          "cdb-meta-3",
          "mpatlas",
          "mci-10-3",
          "edgar-2014-neoli",
          "ley-27490-amp",
          "parques-nacionales",
          "ramsar",
          "pampa-azul"
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
      },
      {
        "slug": "alimentacion-3",
        "titulo": "La comida que se tira",
        "fuentes": [
          "unep-food-waste-2024",
          "fao",
          "owid-alimentos",
          "red-bancos-alimentos",
          "guias-alimentarias-ar"
        ]
      },
      {
        "slug": "alimentacion-4",
        "titulo": "De estación, cerca y agroecológico",
        "fuentes": [
          "fao-agroecologia",
          "fao",
          "inta",
          "owid-alimentos",
          "ipbes-polinizadores",
          "guias-alimentarias-ar"
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
      },
      {
        "slug": "plantas-3",
        "titulo": "Verde urbano",
        "fuentes": [
          "epa-isla-calor",
          "oms-espacios-verdes",
          "plantas-nativas",
          "ecorregiones-pba",
          "ipcc-ar6-syr"
        ]
      },
      {
        "slug": "plantas-4",
        "titulo": "La huerta",
        "fuentes": [
          "inta",
          "fao-agroecologia",
          "fao-suelos",
          "ipbes-polinizadores"
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
      },
      {
        "slug": "animales-3",
        "titulo": "Especies en peligro",
        "fuentes": [
          "iucn-red-list",
          "iucn-categorias",
          "sarem-2019",
          "aves-argentinas-amenazadas",
          "ipbes-global",
          "rewilding-argentina",
          "parques-nacionales"
        ]
      },
      {
        "slug": "animales-4",
        "titulo": "Qué amenaza a la biodiversidad",
        "fuentes": [
          "ipbes-global",
          "ley-bosques-26331",
          "global-forest-watch",
          "invasoras-mayds",
          "cites",
          "ley-22421-fauna",
          "red-centros-rescate",
          "ipcc-ar6",
          "ipbes-polinizadores"
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
      },
      {
        "slug": "aire-suelo-3",
        "titulo": "El efecto invernadero",
        "fuentes": [
          "nasa-evidencia",
          "noaa-co2",
          "noaa-co2-historia",
          "global-carbon-budget",
          "ipcc-ar6",
          "nasa-gistemp",
          "copernicus-clima-2024",
          "wmo-clima-2024",
          "inventario-gei-ar",
          "consenso-cook-2016"
        ]
      },
      {
        "slug": "aire-suelo-4",
        "titulo": "El clima que cambia",
        "fuentes": [
          "ipcc-ar6",
          "ipcc-ar6-syr",
          "ipcc-sr15",
          "noaa-nivel-mar",
          "wmo-clima-2024",
          "wwa-atribucion",
          "inventario-glaciares",
          "ley-26639-glaciares",
          "acuerdo-paris",
          "carbon-brief"
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
      },
      {
        "slug": "ciencia-3",
        "titulo": "Fuentes y desinformación",
        "fuentes": [
          "chequeado",
          "lectura-lateral",
          "first-draft-tipos",
          "flicc-cook",
          "vosoughi-2018",
          "inoculacion",
          "cochrane",
          "ipcc-ar6-syr"
        ]
      },
      {
        "slug": "ciencia-4",
        "titulo": "Ciencia ciudadana",
        "fuentes": [
          "ecsa-principios",
          "ebird",
          "argentinat",
          "inaturalist-calidad",
          "gbif",
          "geovin",
          "aves-argentinas"
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
      },
      {
        "slug": "energia-3",
        "titulo": "De dónde sale la electricidad",
        "fuentes": [
          "cammesa",
          "iea-energia",
          "owid-energia",
          "ley-27424-generacion",
          "irena"
        ]
      },
      {
        "slug": "energia-4",
        "titulo": "Energías renovables",
        "fuentes": [
          "irena",
          "cammesa",
          "ley-27424-generacion",
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
      },
      {
        "slug": "movilidad-3",
        "titulo": "Transporte público",
        "fuentes": [
          "human-transit",
          "itdp-brt",
          "metrobus-gcba",
          "red-sube",
          "owid-transporte",
          "oms-aire-exterior",
          "oms-seguridad-vial"
        ]
      },
      {
        "slug": "movilidad-4",
        "titulo": "Autos, eléctricos y combustibles",
        "fuentes": [
          "epa-auto-tipico",
          "doe-eficiencia-ev",
          "icct-ev-global",
          "icct-ev",
          "iea-ev-outlook",
          "oecd-no-escape",
          "ley-27640-biocombustibles",
          "owid-transporte",
          "oms-aire-exterior",
          "cammesa"
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
      },
      {
        "slug": "residuos-3",
        "titulo": "Compostar: la mitad de la bolsa",
        "fuentes": [
          "fao-suelos",
          "epa",
          "ley-1854-basura-cero",
          "unep-food-waste-2024"
        ]
      },
      {
        "slug": "residuos-4",
        "titulo": "El problema del plástico",
        "fuentes": [
          "oecd-plasticos",
          "unep-plasticos",
          "ellen-macarthur",
          "rep-envases",
          "emf-textiles"
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
      },
      {
        "slug": "consumo-3",
        "titulo": "Economía circular",
        "fuentes": [
          "ellen-macarthur",
          "emf-mariposa",
          "circularity-gap-2025",
          "ue-ecodiseno",
          "ue-derecho-reparar",
          "faccyr",
          "rep-envases",
          "emf-textiles"
        ]
      },
      {
        "slug": "consumo-4",
        "titulo": "Lo que el precio no dice",
        "fuentes": [
          "fao-sofa-2023",
          "bm-precio-carbono",
          "fmi-subsidios",
          "ley-27430-impuesto-co2",
          "ley-25675-ambiente",
          "ipbes-polinizadores",
          "fao-pesca-sofia",
          "oms-aire-exterior"
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
      },
      {
        "slug": "digital-3",
        "titulo": "Centros de datos e inteligencia artificial",
        "fuentes": [
          "iea-energia-ia",
          "iea-datacenters",
          "uptime-2024",
          "google-ia-2025",
          "carbon-brief",
          "iea-streaming"
        ]
      },
      {
        "slug": "digital-4",
        "titulo": "De la mina al celular",
        "fuentes": [
          "usgs-litio-2025",
          "usgs-cobalto-2025",
          "iea-minerales-2025",
          "ley-24196-mineria",
          "ley-24071-oit-169",
          "amnistia-cobalto",
          "ocde-diligencia-minerales",
          "ue-minerales-conflicto",
          "ewaste-monitor"
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
      },
      {
        "slug": "comunidad-3",
        "titulo": "Justicia ambiental",
        "fuentes": [
          "acumar",
          "acumar-causa-mendoza",
          "oxfam-clima-2023",
          "cij-clima-2025",
          "ley-25675-ambiente",
          "escazu",
          "acuerdo-paris",
          "oms-aire-exterior"
        ]
      },
      {
        "slug": "comunidad-4",
        "titulo": "Conflictos ambientales",
        "fuentes": [
          "ejatlas",
          "ejatlas-esquel",
          "cij-papeleras-2010",
          "escazu",
          "ley-25675-ambiente",
          "ley-25831-info",
          "global-witness-defensores",
          "ley-24071-oit-169"
        ]
      }
    ]
  }
];
