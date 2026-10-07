// ─────────────────────────────────────────────────────────────────────────────
// De dónde salen los números de las acciones.
//
// Primero las fuentes de la Academia (ya verificadas con
// scripts/academia-arbol/verificar-fuentes.mjs): una acción las cita por slug.
// Después las propias de las acciones, que se comprueban con
// `node scripts/acciones/verificar-fuentes.mjs`.
// ─────────────────────────────────────────────────────────────────────────────

import { FUENTES as ACADEMIA } from '../academia-arbol/fuentes.mjs';

/** @type {{ slug: string, organizacion: string, titulo: string, url: string }[]} */
export const PROPIAS = [
  {
    slug: 'gcba-energia',
    organizacion: 'Gobierno de la Ciudad de Buenos Aires',
    titulo: 'Guía de Ahorro de Energía en el Hogar (2026)',
    url: 'https://static.buenosaires.gob.ar/sites/default/files/2026-04/Gu%C3%ADa%20de%20ahorro%20de%20energ%C3%ADa%20en%20el%20hogar.pdf',
  },
  {
    slug: 'metrogas-consejos',
    organizacion: 'MetroGAS (con datos de ENARGAS)',
    titulo: 'Con poco hacés mucho: consejos para un uso racional del gas natural',
    url: 'https://www.metrogas.com.ar/assets/media/2022/11/Consejos-para-un-uso-racional-del-gas-natural-2-Abril.pdf',
  },
  {
    slug: 'metrogas-seguridad',
    organizacion: 'MetroGAS',
    titulo: '10 tips para un uso seguro del gas en el hogar',
    url: 'https://www.metrogas.com.ar/assets/media/2022/11/10-tips-para-un-uso-seguro-del-gas-en-el-hogar-Junio.pdf',
  },
  {
    slug: 'educar-energia',
    organizacion: 'Educ.ar · Ministerio de Educación',
    titulo: 'Uso responsable de la energía',
    url: 'https://www.educ.ar/recursos/132531/uso-responsable-de-la-energia',
  },
  {
    slug: 'prohuerta',
    organizacion: 'INTA · ProHuerta',
    titulo: 'ProHuerta: semillas y acompañamiento para la huerta agroecológica',
    url: 'https://www.argentina.gob.ar/node/212297',
  },
  {
    slug: 'garrahan-reciclado',
    organizacion: 'Fundación Garrahan',
    titulo: 'Programa de Reciclado: papel, tapitas y llaves',
    url: 'https://www.fundaciongarrahan.org.ar/',
  },
];

/** slug → { organizacion, titulo, url } */
export const FUENTES = new Map(
  [...ACADEMIA, ...PROPIAS].map((f) => [f.slug, { organizacion: f.organizacion, titulo: f.titulo, url: f.url }]),
);
