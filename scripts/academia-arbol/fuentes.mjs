// ─────────────────────────────────────────────────────────────────────────────
// Las fuentes del Árbol.
//
// Son las 56 del currículum anterior (scripts/academia/fuentes.mjs, que sigue
// siendo la fuente de verdad de esas filas) más las que el currículum nuevo
// necesita. Cada unidad nombra las suyas por slug y `construir.mjs` falla si
// una unidad cita un slug que no está acá.
//
// DÓNDE SE VEN. Ya no en la lección: desde esta versión las fuentes viven en
// una página propia (`/legal/fuentes`), a la que se llega desde Ajustes o
// desde el pie. Esa página se genera desde este archivo.
//
// CÓMO SE ELIGIERON. Las seleccionó un modelo de IA al escribir el
// currículum, priorizando organismos públicos, agencias de Naciones Unidas,
// normas argentinas y literatura revisada por pares. Cada URL se comprueba con
// `node scripts/academia-arbol/verificar-fuentes.mjs` antes de publicar.
// ─────────────────────────────────────────────────────────────────────────────

import { FUENTES as ANTERIORES } from '../academia/fuentes.mjs';

/** @type {import('../academia/fuentes.mjs').Fuente[]} */
const NUEVAS = [
  // ── Clima y carbono ─────────────────────────────────────────────────────────
  {
    slug: 'ipcc-ar6-syr',
    titulo: 'AR6 Synthesis Report: Climate Change 2023',
    organizacion: 'IPCC',
    url: 'https://www.ipcc.ch/report/ar6/syr/',
    publicado: '2023',
  },
  {
    slug: 'noaa-co2',
    titulo: 'Trends in Atmospheric Carbon Dioxide (Mauna Loa)',
    organizacion: 'NOAA Global Monitoring Laboratory',
    url: 'https://gml.noaa.gov/ccgg/trends/',
    publicado: '2025',
  },
  {
    slug: 'nasa-evidencia',
    titulo: 'Evidence: How Do We Know Climate Change Is Real?',
    organizacion: 'NASA',
    url: 'https://science.nasa.gov/climate-change/evidence/',
    publicado: '2024',
  },
  {
    slug: 'nasa-ciclo-carbono',
    titulo: 'The Carbon Cycle',
    organizacion: 'NASA Earth Observatory',
    url: 'https://earthobservatory.nasa.gov/features/CarbonCycle',
    publicado: '2011',
  },
  {
    slug: 'global-carbon-budget',
    titulo: 'Global Carbon Budget',
    organizacion: 'Global Carbon Project',
    url: 'https://globalcarbonbudget.org/',
    publicado: '2024',
  },
  {
    slug: 'owid-co2',
    titulo: 'CO₂ and Greenhouse Gas Emissions',
    organizacion: 'Our World in Data',
    url: 'https://ourworldindata.org/co2-and-greenhouse-gas-emissions',
    publicado: '2024',
  },
  {
    slug: 'owid-energia',
    titulo: 'Energy',
    organizacion: 'Our World in Data',
    url: 'https://ourworldindata.org/energy',
    publicado: '2024',
  },
  {
    slug: 'consenso-cook-2016',
    titulo: 'Consensus on consensus: a synthesis of consensus estimates on human-caused global warming',
    organizacion: 'Environmental Research Letters (Cook et al.)',
    url: 'https://iopscience.iop.org/article/10.1088/1748-9326/11/4/048002',
    publicado: '2016',
  },
  {
    slug: 'wynes-nicholas-2017',
    titulo: 'The climate mitigation gap: education and government recommendations miss the most effective individual actions',
    organizacion: 'Environmental Research Letters (Wynes y Nicholas)',
    url: 'https://iopscience.iop.org/article/10.1088/1748-9326/aa7541',
    publicado: '2017',
  },
  {
    slug: 'inventario-gei-ar',
    titulo: 'Inventario Nacional de Gases de Efecto Invernadero',
    organizacion: 'Ministerio de Ambiente de la Nación (Argentina)',
    url: 'https://inventariogei.ambiente.gob.ar/',
    publicado: '2023',
  },
  // ── Agua ────────────────────────────────────────────────────────────────────
  {
    slug: 'usgs-ciclo-agua',
    titulo: 'The Water Cycle',
    organizacion: 'U.S. Geological Survey',
    url: 'https://www.usgs.gov/special-topics/water-science-school/science/water-cycle',
    publicado: '2019',
  },
  {
    slug: 'oms-agua-potable',
    titulo: 'Drinking-water (fact sheet)',
    organizacion: 'Organización Mundial de la Salud',
    url: 'https://www.who.int/news-room/fact-sheets/detail/drinking-water',
    publicado: '2023',
  },
  {
    slug: 'un-water',
    titulo: 'UN-Water: Water facts',
    organizacion: 'Naciones Unidas',
    url: 'https://www.unwater.org/water-facts',
    publicado: '2024',
  },
  {
    slug: 'aysa',
    titulo: 'Agua y Saneamientos Argentinos',
    organizacion: 'AySA',
    url: 'https://www.aysa.com.ar/',
    publicado: '2025',
  },
  {
    slug: 'water-footprint-network',
    titulo: 'Product gallery: the water footprint of products',
    organizacion: 'Water Footprint Network',
    url: 'https://www.waterfootprint.org/resources/interactive-tools/product-gallery/',
    publicado: '2017',
  },
  {
    slug: 'ley-26639-glaciares',
    titulo: 'Ley 26.639 — Régimen de Presupuestos Mínimos para la Preservación de los Glaciares y del Ambiente Periglacial',
    organizacion: 'Congreso de la Nación Argentina',
    url: 'https://www.argentina.gob.ar/normativa/nacional/ley-26639-174117',
    publicado: '2010',
  },
  // ── Energía ─────────────────────────────────────────────────────────────────
  {
    slug: 'cammesa',
    titulo: 'Compañía Administradora del Mercado Mayorista Eléctrico',
    organizacion: 'CAMMESA',
    url: 'https://www.cammesa.com/',
    publicado: '2025',
  },
  {
    slug: 'ley-27424-generacion',
    titulo: 'Ley 27.424 — Régimen de Fomento a la Generación Distribuida de Energía Renovable',
    organizacion: 'Congreso de la Nación Argentina',
    url: 'https://www.argentina.gob.ar/normativa/nacional/ley-27424-305179',
    publicado: '2017',
  },
  {
    slug: 'iea-eficiencia',
    titulo: 'Energy Efficiency',
    organizacion: 'Agencia Internacional de Energía',
    url: 'https://www.iea.org/energy-system/energy-efficiency-and-demand/energy-efficiency',
    publicado: '2024',
  },
  {
    slug: 'irena',
    titulo: 'International Renewable Energy Agency',
    organizacion: 'IRENA',
    url: 'https://www.irena.org/',
    publicado: '2025',
  },
  {
    slug: 'iea-datacenters',
    titulo: 'Data centres and data transmission networks',
    organizacion: 'Agencia Internacional de Energía',
    url: 'https://www.iea.org/energy-system/buildings/data-centres-and-data-transmission-networks',
    publicado: '2024',
  },
  // ── Residuos, plásticos y consumo ───────────────────────────────────────────
  {
    slug: 'unep-plasticos',
    titulo: 'Plastic pollution',
    organizacion: 'Programa de las Naciones Unidas para el Medio Ambiente',
    url: 'https://www.unep.org/plastic-pollution',
    publicado: '2024',
  },
  {
    slug: 'ewaste-monitor',
    titulo: 'The Global E-waste Monitor 2024',
    organizacion: 'UIT y UNITAR',
    url: 'https://ewastemonitor.info/',
    publicado: '2024',
  },
  {
    slug: 'ceamse',
    titulo: 'Coordinación Ecológica Área Metropolitana Sociedad del Estado',
    organizacion: 'CEAMSE',
    url: 'https://www.ceamse.gov.ar/',
    publicado: '2025',
  },
  {
    slug: 'ley-25916-residuos',
    titulo: 'Ley 25.916 — Gestión de Residuos Domiciliarios',
    organizacion: 'Congreso de la Nación Argentina',
    url: 'https://www.argentina.gob.ar/normativa/nacional/ley-25916-98327',
    publicado: '2004',
  },
  {
    slug: 'unep-food-waste-2024',
    titulo: 'Food Waste Index Report 2024',
    organizacion: 'Programa de las Naciones Unidas para el Medio Ambiente',
    url: 'https://www.unep.org/resources/publication/food-waste-index-report-2024',
    publicado: '2024',
  },
  // ── Alimentación y suelo ────────────────────────────────────────────────────
  {
    slug: 'poore-nemecek-2018',
    titulo: 'Reducing food’s environmental impacts through producers and consumers',
    organizacion: 'Science (Poore y Nemecek)',
    url: 'https://www.science.org/doi/10.1126/science.aaq0216',
    publicado: '2018',
  },
  {
    slug: 'ley-27642-etiquetado',
    titulo: 'Ley 27.642 — Promoción de la Alimentación Saludable',
    organizacion: 'Congreso de la Nación Argentina',
    url: 'https://www.argentina.gob.ar/normativa/nacional/ley-27642-356607',
    publicado: '2021',
  },
  {
    slug: 'guias-alimentarias-ar',
    titulo: 'Guías Alimentarias para la Población Argentina — manual de aplicación',
    organizacion: 'Ministerio de Salud de la Nación',
    url: 'https://www.argentina.gob.ar/sites/default/files/bancos/2020-08/guias-alimentarias-para-la-poblacion-argentina_manual-de-aplicacion_0.pdf',
    publicado: '2016',
  },
  {
    slug: 'fao-suelos',
    titulo: 'Portal de Suelos de la FAO',
    organizacion: 'FAO',
    url: 'https://www.fao.org/soils-portal/es/',
    publicado: '2024',
  },
  {
    slug: 'fao-pesca-sofia',
    titulo: 'El estado mundial de la pesca y la acuicultura',
    organizacion: 'FAO',
    url: 'https://www.fao.org/publications/home/fao-flagship-publications/the-state-of-world-fisheries-and-aquaculture/es',
    publicado: '2024',
  },
  // ── Aire, salud y movilidad ─────────────────────────────────────────────────
  {
    slug: 'oms-calidad-aire',
    titulo: 'Directrices mundiales de la OMS sobre la calidad del aire',
    organizacion: 'Organización Mundial de la Salud',
    url: 'https://www.who.int/publications/i/item/9789240034228',
    publicado: '2021',
  },
  {
    slug: 'oms-actividad-fisica',
    titulo: 'Actividad física (nota descriptiva)',
    organizacion: 'Organización Mundial de la Salud',
    url: 'https://www.who.int/es/news-room/fact-sheets/detail/physical-activity',
    publicado: '2024',
  },
  {
    slug: 'noaa-acidificacion',
    titulo: 'Ocean acidification',
    organizacion: 'NOAA',
    url: 'https://www.noaa.gov/education/resource-collections/ocean-coasts/ocean-acidification',
    publicado: '2023',
  },
  // ── Biodiversidad ───────────────────────────────────────────────────────────
  {
    slug: 'ipbes-polinizadores',
    titulo: 'Assessment Report on Pollinators, Pollination and Food Production',
    organizacion: 'IPBES',
    url: 'https://www.ipbes.net/assessment-reports/pollinators',
    publicado: '2016',
  },
  {
    slug: 'parques-nacionales',
    titulo: 'Administración de Parques Nacionales',
    organizacion: 'Parques Nacionales (Argentina)',
    url: 'https://www.argentina.gob.ar/parquesnacionales',
    publicado: '2025',
  },
  {
    slug: 'vida-silvestre',
    titulo: 'Fundación Vida Silvestre Argentina',
    organizacion: 'Fundación Vida Silvestre Argentina',
    url: 'https://www.vidasilvestre.org.ar/',
    publicado: '2025',
  },
  // ── Hábitos y acción ────────────────────────────────────────────────────────
  {
    slug: 'lally-2010-habitos',
    titulo: 'How are habits formed: Modelling habit formation in the real world',
    organizacion: 'European Journal of Social Psychology (Lally et al.)',
    url: 'https://onlinelibrary.wiley.com/doi/10.1002/ejsp.674',
    publicado: '2010',
  },
  {
    slug: 'bit-east',
    titulo: 'EAST: Four simple ways to apply behavioural insights',
    organizacion: 'The Behavioural Insights Team',
    url: 'https://www.bi.team/publications/east-four-simple-ways-to-apply-behavioural-insights/',
    publicado: '2014',
  },
  {
    slug: 'inventario-glaciares',
    titulo: 'Inventario Nacional de Glaciares',
    organizacion: 'IANIGLA-CONICET y Ministerio de Ambiente',
    url: 'https://www.glaciaresargentinos.gob.ar/',
    publicado: '2018',
  },
  // ── Plantas ─────────────────────────────────────────────────────────────────
  {
    slug: 'bar-on-biomasa-2018',
    titulo: 'The biomass distribution on Earth',
    organizacion: 'PNAS (Bar-On, Phillips y Milo)',
    url: 'https://www.pnas.org/doi/10.1073/pnas.1711842115',
    publicado: '2018',
  },
  // ── Animales ────────────────────────────────────────────────────────────────
  {
    slug: 'loss-2013-gatos',
    titulo: 'The impact of free-ranging domestic cats on wildlife of the United States',
    organizacion: 'Nature Communications (Loss, Will y Marra)',
    url: 'https://www.nature.com/articles/ncomms2380',
    publicado: '2013',
  },
  {
    slug: 'loss-2014-vidrios',
    titulo: 'Bird–window collisions in the United States',
    organizacion: 'The Condor (Loss, Will, Loss y Marra)',
    url: 'https://academic.oup.com/condor/article/116/1/8/5153098',
    publicado: '2014',
  },
  // ── Aire y suelo ────────────────────────────────────────────────────────────
  {
    slug: 'oms-aire-exterior',
    titulo: 'Calidad del aire ambiente (exterior) y salud (nota descriptiva)',
    organizacion: 'Organización Mundial de la Salud',
    url: 'https://www.who.int/es/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health',
    publicado: '2024',
  },
  {
    slug: 'oms-aire-hogar',
    titulo: 'Contaminación del aire doméstico y salud (nota descriptiva)',
    organizacion: 'Organización Mundial de la Salud',
    url: 'https://www.who.int/es/news-room/fact-sheets/detail/household-air-pollution-and-health',
    publicado: '2024',
  },
  {
    slug: 'anthony-2023-suelo',
    titulo: 'Enumerating soil biodiversity',
    organizacion: 'PNAS (Anthony, Bender y van der Heijden)',
    url: 'https://www.pnas.org/doi/10.1073/pnas.2304663120',
    publicado: '2023',
  },
  {
    slug: 'fao-suelos-degradacion',
    titulo: 'Estado mundial del recurso suelo (resumen técnico)',
    organizacion: 'FAO y Grupo Técnico Intergubernamental de Suelos',
    url: 'https://www.fao.org/3/i5126s/i5126s.pdf',
    publicado: '2015',
  },
  // ── Movilidad ───────────────────────────────────────────────────────────────
  {
    slug: 'owid-transporte',
    titulo: 'Which form of transport has the smallest carbon footprint?',
    organizacion: 'Our World in Data',
    url: 'https://ourworldindata.org/travel-carbon-footprint',
    publicado: '2023',
  },
  {
    slug: 'oms-seguridad-vial',
    titulo: 'Traumatismos causados por el tránsito (nota descriptiva)',
    organizacion: 'Organización Mundial de la Salud',
    url: 'https://www.who.int/es/news-room/fact-sheets/detail/road-traffic-injuries',
    publicado: '2023',
  },
  // ── Consumo ─────────────────────────────────────────────────────────────────
  {
    slug: 'emf-textiles',
    titulo: 'A new textiles economy: Redesigning fashion’s future',
    organizacion: 'Ellen MacArthur Foundation',
    url: 'https://www.ellenmacarthurfoundation.org/a-new-textiles-economy',
    publicado: '2017',
  },
  {
    slug: 'unep-moda',
    titulo: 'Putting the brakes on fast fashion',
    organizacion: 'Programa de las Naciones Unidas para el Medio Ambiente',
    url: 'https://www.unep.org/news-and-stories/story/putting-brakes-fast-fashion',
    publicado: '2018',
  },
  {
    slug: 'ce-green-claims',
    titulo: 'Green claims',
    organizacion: 'Comisión Europea',
    url: 'https://environment.ec.europa.eu/topics/circular-economy/green-claims_en',
    publicado: '2023',
  },
  {
    slug: 'senasa-organicos',
    titulo: 'Producción orgánica',
    organizacion: 'SENASA',
    url: 'https://www.argentina.gob.ar/senasa/programas-sanitarios/produccion-organica',
    publicado: '2024',
  },
  // ── Digital ─────────────────────────────────────────────────────────────────
  {
    slug: 'iea-streaming',
    titulo: 'The carbon footprint of streaming video: fact-checking the headlines',
    organizacion: 'Agencia Internacional de Energía (IEA)',
    url: 'https://www.iea.org/commentaries/the-carbon-footprint-of-streaming-video-fact-checking-the-headlines',
    publicado: '2020',
  },
  {
    slug: 'global-forest-watch',
    titulo: 'Global Forest Watch',
    organizacion: 'World Resources Institute',
    url: 'https://www.globalforestwatch.org/',
    publicado: '2024',
  },
  {
    slug: 'nasa-firms',
    titulo: 'FIRMS — Fire Information for Resource Management System',
    organizacion: 'NASA',
    url: 'https://firms.modaps.eosdis.nasa.gov/',
    publicado: '2024',
  },
  {
    slug: 'conae',
    titulo: 'Comisión Nacional de Actividades Espaciales (CONAE)',
    organizacion: 'Gobierno de Argentina',
    url: 'https://www.argentina.gob.ar/ciencia/conae',
    publicado: '2024',
  },
  // ── Océanos y ríos ──────────────────────────────────────────────────────────
  {
    slug: 'pampa-azul',
    titulo: 'Iniciativa Pampa Azul',
    organizacion: 'Gobierno de Argentina',
    url: 'https://www.pampazul.gob.ar/',
    publicado: '2024',
  },
  {
    slug: 'inidep',
    titulo: 'Instituto Nacional de Investigación y Desarrollo Pesquero (INIDEP)',
    organizacion: 'INIDEP',
    url: 'https://www.inidep.edu.ar/',
    publicado: '2024',
  },
  // ── Residuos y materiales ───────────────────────────────────────────────────
  {
    slug: 'mst-bolsas-2018',
    titulo: 'Life Cycle Assessment of grocery carrier bags',
    organizacion: 'Danish Environmental Protection Agency',
    url: 'https://www2.mst.dk/Udgiv/publications/2018/02/978-87-93614-73-4.pdf',
    publicado: '2018',
  },
  {
    slug: 'iai-reciclaje-aluminio',
    titulo: 'Aluminium recycling',
    organizacion: 'European Aluminium',
    url: 'https://european-aluminium.eu/about-aluminium/aluminium-recycling/',
    publicado: '2024',
  },
  {
    slug: 'oecd-plasticos',
    titulo: 'Global Plastics Outlook: Economic Drivers, Environmental Impacts and Policy Options',
    organizacion: 'OCDE',
    url: 'https://www.oecd.org/en/publications/global-plastics-outlook_de747aef-en.html',
    publicado: '2022',
  },
  {
    slug: 'onu-ods',
    titulo: 'Objetivos de Desarrollo Sostenible',
    organizacion: 'Naciones Unidas',
    url: 'https://sdgs.un.org/goals',
    publicado: '2015',
  },
];

// Links de la lista anterior que ya no responden (verificado con
// verificar-fuentes.mjs el 2026-09-22). Se corrigen acá y no en el archivo
// viejo, que describe lo que se cargó en su momento.
const CORRECCIONES = {
  'rewilding-argentina': { url: 'https://rewildingargentina.org/' },
  'ley-1854-basura-cero': {
    titulo: 'Ley 1.854 «Basura Cero» y su decreto reglamentario',
    url: 'https://www.cedom.gob.ar/legislacion/normas/leyes/RepoLeyes/anexos/drl1854.html',
  },
};

// El orden de las anteriores se respeta; las nuevas van detrás.
export const FUENTES = [...ANTERIORES.map((f) => ({ ...f, ...(CORRECCIONES[f.slug] ?? {}) })), ...NUEVAS];
