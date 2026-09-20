import type { Nivel } from '../mercado/claims';

/**
 * El kit de marca (fase 4 §7 y 09 §7): lo que la empresa puede poner en su
 * sitio y en sus redes.
 *
 * Las palabras son las MISMAS de `08_LEGAL_Y_CONFIANZA.md` §4.2 —las que usa
 * el badge de nivel en toda la app—, porque el sello va a estar en sitios que
 * no controlamos y ahí es donde más importa que no diga de más: describe
 * nuestro proceso, nunca la calidad del producto.
 */

export const NIVEL_PALABRA: Record<Nivel, string> = {
  e0: 'Sin nivel',
  e1: 'Declarado por el comercio',
  e2: 'Documentación revisada',
  e3: 'Certificación de tercero',
  e4: 'Referente',
};

export const NIVEL_COLOR: Record<Nivel, string> = {
  e0: '#8A8F98',
  e1: '#8A8F98',
  e2: '#2DB4D4',
  e3: '#0E7A52',
  e4: '#1FB57A',
};

export function numeroDeNivel(n: Nivel): number {
  return Number(n.slice(1));
}

/** El `<a>` + `<img>` que la empresa pega en su sitio. Cada sello es un enlace entrante. */
export function snippetSello(base: string, slug: string, nombre: string): string {
  return `<a href="${base}/mercado/negocio/${slug}?ref=sello" target="_blank" rel="noopener">
  <img src="${base}/api/sello/${slug}.svg" width="300" height="84"
       alt="${nombre} en el programa de Brote" loading="lazy" />
</a>`;
}

/**
 * El texto sugerido para anunciarlo, en voseo y listo para copiar. Sin
 * superlativos y sin prometer nada sobre los productos: lo que se anuncia es
 * estar en el programa y tener un nivel de evidencia.
 */
export function textoSugerido(nombre: string, nivel: Nivel, objetivosCerrados: number): string {
  const base = `Estamos en Brote: ${nombre} tiene su ficha pública con el Nivel ${numeroDeNivel(nivel)} de evidencia (${NIVEL_PALABRA[nivel].toLowerCase()}).`;
  const conObjetivos =
    objetivosCerrados > 0
      ? ` Ya cerramos ${objetivosCerrados} ${objetivosCerrados === 1 ? 'objetivo ambiental' : 'objetivos ambientales'} con evidencia revisada.`
      : ' Estamos trabajando en nuestros objetivos ambientales con seguimiento y evidencia.';
  return `${base}${conObjetivos} Mirá qué afirmamos y con qué lo respaldamos 👇`;
}

/**
 * El SVG del sello. Es una función pura a propósito: así se puede probar y
 * previsualizar sin una base al lado, y el route handler queda con una sola
 * responsabilidad —buscar el negocio y cachear la respuesta—.
 *
 * Sin fuentes del servidor: lo dibuja el navegador de quien visita el sitio de
 * la empresa, con la pila de fuentes del sistema.
 */
export function svgSello(nombre: string, nivel: Nivel): string {
  const n = numeroDeNivel(nivel);
  const corto = nombre.length > 28 ? `${nombre.slice(0, 27)}…` : nombre;
  const fuente = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="84" viewBox="0 0 300 84" role="img" aria-label="${escaparXml(corto)} — Nivel ${n} en el programa de Brote">
  <rect x="0.5" y="0.5" width="299" height="83" rx="14" fill="#0B0F0D" stroke="#1E2A24"/>
  <circle cx="26" cy="42" r="7" fill="${NIVEL_COLOR[nivel]}"/>
  <text x="44" y="32" font-family="${fuente}" font-size="11" font-weight="700" letter-spacing="1.2" fill="#8A8F98">PROGRAMA BROTE</text>
  <text x="44" y="51" font-family="${fuente}" font-size="15" font-weight="800" fill="#F3F1E9">Nivel ${n} · ${escaparXml(NIVEL_PALABRA[nivel])}</text>
  <text x="44" y="67" font-family="${fuente}" font-size="11" fill="#8A8F98">${escaparXml(corto)}</text>
</svg>`;
}

export function escaparXml(s: string): string {
  return s.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' })[c]!);
}
