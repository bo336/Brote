/**
 * Imágenes de los listados de DEMOSTRACIÓN (`public/demo/`).
 *
 * Son abstractas a propósito: formas y color, sin fotos ni texto. Una foto de
 * producto real sería de alguien, y un texto necesitaría fuentes que en un
 * entorno serverless no están. Cada una sale de un `seed` fijo, así que el
 * resultado es reproducible.
 *
 * Correr con: node scripts/gen-demo-images.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const SALIDA = join(process.cwd(), 'public', 'demo');
const LADO = 800;

/** La paleta de Brote, para que el catálogo de demo no desentone con la app. */
const PALETAS = [
  ['#0E7A52', '#1FB57A'],
  ['#1A3324', '#2DB4D4'],
  ['#2F4A2E', '#8FD694'],
  ['#3A2E1F', '#F4A62A'],
  ['#1F3A34', '#4FC3A1'],
  ['#2A3B4D', '#7EC8E3'],
  ['#42301F', '#E0A96D'],
  ['#233A2B', '#A8D5BA'],
  ['#1C2E3A', '#5BA3C7'],
  ['#34402A', '#C3D98B'],
];

function svg(i) {
  const [oscuro, claro] = PALETAS[i % PALETAS.length];
  const r = (n) => ((Math.sin((i + 1) * n) + 1) / 2).toFixed(3);
  const cx = 200 + Number(r(3)) * 400;
  const cy = 200 + Number(r(5)) * 400;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${LADO}" height="${LADO}" viewBox="0 0 ${LADO} ${LADO}">
    <defs>
      <linearGradient id="f" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${oscuro}"/>
        <stop offset="100%" stop-color="${claro}" stop-opacity="0.85"/>
      </linearGradient>
      <radialGradient id="l" cx="${(cx / LADO).toFixed(3)}" cy="${(cy / LADO).toFixed(3)}" r="0.7">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.30"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${LADO}" height="${LADO}" fill="url(#f)"/>
    <rect width="${LADO}" height="${LADO}" fill="url(#l)"/>
    <g fill="none" stroke="#ffffff" stroke-opacity="0.16" stroke-width="2">
      <circle cx="${cx}" cy="${cy}" r="${120 + Number(r(2)) * 90}"/>
      <circle cx="${cx}" cy="${cy}" r="${200 + Number(r(7)) * 120}"/>
    </g>
    <path d="M ${LADO * 0.5} ${LADO * 0.62} C ${LADO * 0.28} ${LADO * 0.58}, ${LADO * 0.3} ${LADO * 0.3}, ${LADO * 0.5} ${LADO * 0.26}
             C ${LADO * 0.7} ${LADO * 0.3}, ${LADO * 0.72} ${LADO * 0.58}, ${LADO * 0.5} ${LADO * 0.62} Z"
          fill="#ffffff" fill-opacity="0.14"/>
    <line x1="${LADO * 0.5}" y1="${LADO * 0.26}" x2="${LADO * 0.5}" y2="${LADO * 0.74}"
          stroke="#ffffff" stroke-opacity="0.22" stroke-width="3"/>
  </svg>`;
}

mkdirSync(SALIDA, { recursive: true });
for (let i = 0; i < PALETAS.length; i++) {
  const img = await sharp(Buffer.from(svg(i))).webp({ quality: 82, effort: 6 }).toBuffer();
  writeFileSync(join(SALIDA, `${i + 1}.webp`), img);
  console.log('demo/%d.webp  %d kB', i + 1, Math.round(img.length / 1024));
}
