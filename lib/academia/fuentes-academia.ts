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
    "slug": "ipbes-global",
    "titulo": "IPBES Global Assessment on Biodiversity and Ecosystem Services",
    "organizacion": "IPBES",
    "url": "https://www.ipbes.net/global-assessment",
    "publicado": "2019"
  },
  {
    "slug": "invasoras-mayds",
    "titulo": "Lista de especies exóticas invasoras de Argentina",
    "organizacion": "Ministerio de Ambiente y Desarrollo Sostenible",
    "url": "https://www.argentina.gob.ar/ambiente/biodiversidad/exoticas-invasoras/lista",
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
    "slug": "unep",
    "titulo": "UNEP — Programa de las Naciones Unidas para el Medio Ambiente",
    "organizacion": "UNEP",
    "url": "https://www.unep.org/",
    "publicado": "2025"
  },
  {
    "slug": "unesco-ods",
    "titulo": "Education for Sustainable Development Goals: Learning Objectives",
    "organizacion": "UNESCO",
    "url": "https://unesdoc.unesco.org/ark:/48223/pf0000247444",
    "publicado": "2017"
  },
  {
    "slug": "nasa-ciclo-carbono",
    "titulo": "The Carbon Cycle",
    "organizacion": "NASA Earth Observatory",
    "url": "https://earthobservatory.nasa.gov/features/CarbonCycle",
    "publicado": "2011"
  },
  {
    "slug": "usgs-ciclo-agua",
    "titulo": "The Water Cycle",
    "organizacion": "U.S. Geological Survey",
    "url": "https://www.usgs.gov/special-topics/water-science-school/science/water-cycle",
    "publicado": "2019"
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
      }
    ]
  }
];
