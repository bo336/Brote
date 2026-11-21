/**
 * Los lugares de Brote (docs/REESTRUCTURA.md D1).
 *
 * Brote es un pueblo: Hoy, Acciones, la Plaza, la Liga, la Academia, Tu mundo,
 * el Mercado y los Proyectos son lugares, y cada uno tiene su color. Mientras
 * estás en un lugar, su color ES el `--primary` de la app: `<html data-lugar>`
 * lo cambia (ver `app/globals.css`), así los botones, las pestañas, los ojitos
 * y los anillos de foco de la Plaza son coral sin que ningún componente lo sepa.
 *
 * El verde de marca queda para Acciones (hacer), el logo y lo que está hecho.
 * Hoy y el perfil son tinta: lo tuyo, sin ruido.
 *
 * Este archivo es la única fuente de la relación ruta → lugar. El script que
 * pinta el lugar antes del primer cuadro (`scriptLugar`) se arma desde acá.
 */

export type Lugar =
  | 'hoy'
  | 'explorar'
  | 'acciones'
  | 'plaza'
  | 'liga'
  | 'academia'
  | 'mundo'
  | 'mercado'
  | 'proyectos'
  | 'impacto'
  | 'vos'
  | 'marca';

export interface InfoLugar {
  key: Lugar;
  /** Cómo se llama el lugar en pantalla. */
  nombre: string;
  /** Color en tema claro: texto chico sobre la crema y relleno con texto blanco (≥ 4,5:1). */
  claro: string;
  /** Color en tema oscuro: texto sobre la tinta y relleno con texto tinta. */
  oscuro: string;
}

/**
 * Los colores (docs/REESTRUCTURA.md §3). Verificados: todos pasan 4,5:1 sobre
 * la crema y llevan texto blanco; los oscuros pasan sobre la tinta y llevan
 * texto tinta. `hoy`, `explorar`, `impacto` y `vos` son tinta / crema.
 */
export const LUGARES: Record<Lugar, InfoLugar> = {
  hoy: { key: 'hoy', nombre: 'Hoy', claro: '#0C1A13', oscuro: '#F7F5EF' },
  explorar: { key: 'explorar', nombre: 'Explorar', claro: '#0C1A13', oscuro: '#F7F5EF' },
  impacto: { key: 'impacto', nombre: 'Tu impacto', claro: '#0C1A13', oscuro: '#F7F5EF' },
  vos: { key: 'vos', nombre: 'Vos', claro: '#0C1A13', oscuro: '#F7F5EF' },
  acciones: { key: 'acciones', nombre: 'Acciones', claro: '#0E7A52', oscuro: '#3FD49A' },
  marca: { key: 'marca', nombre: 'Brote', claro: '#0E7A52', oscuro: '#3FD49A' },
  plaza: { key: 'plaza', nombre: 'La Plaza', claro: '#C2412F', oscuro: '#FF8A7A' },
  liga: { key: 'liga', nombre: 'La Liga', claro: '#4450C8', oscuro: '#8E97FF' },
  academia: { key: 'academia', nombre: 'La Academia', claro: '#6E46C0', oscuro: '#B49CFF' },
  mundo: { key: 'mundo', nombre: 'Tu mundo', claro: '#0A7487', oscuro: '#4FD1E6' },
  mercado: { key: 'mercado', nombre: 'El Mercado', claro: '#9A5B06', oscuro: '#FFC266' },
  proyectos: { key: 'proyectos', nombre: 'Proyectos', claro: '#B4520E', oscuro: '#FF9F5A' },
};

/** Lo del perfil propio: lo demás bajo `/perfil/…` es el perfil público de alguien (la Plaza). */
const PERFIL_PROPIO = ['ajustes', 'estadisticas', 'guardados', 'logros', 'objetivos', 'rangos', 'pip'];

/**
 * Prefijos en orden: gana el primero que coincide. Una ruta coincide con un
 * prefijo si es igual o sigue con `/`.
 */
export const RUTAS_LUGAR: [string, Lugar][] = [
  ['/lugares', 'explorar'],
  ['/acciones', 'acciones'],
  ['/competencias', 'acciones'],
  ['/feed', 'plaza'],
  ['/buscar', 'plaza'],
  ['/ranking', 'liga'],
  ['/aprender', 'academia'],
  ['/mundo', 'mundo'],
  ['/mercado', 'mercado'],
  ['/proyectos', 'proyectos'],
  ['/impacto', 'impacto'],
  ['/auth', 'marca'],
  ['/onboarding', 'marca'],
];

/** El lugar de una ruta, o null fuera de la app (panel, negocio, legales). */
export function lugarDe(pathname: string): Lugar | null {
  const p = pathname.split('?')[0]!.replace(/\/+$/, '') || '/';
  if (p === '/') return 'hoy';
  if (p === '/perfil') return 'vos';
  if (p.startsWith('/perfil/')) {
    const seg = p.split('/')[2] ?? '';
    return PERFIL_PROPIO.includes(seg) ? 'vos' : 'plaza';
  }
  for (const [pre, lugar] of RUTAS_LUGAR) {
    if (p === pre || p.startsWith(pre + '/')) return lugar;
  }
  return null;
}

/**
 * El script que pone `data-lugar` en `<html>` antes de pintar, para que la
 * primera carga no arranque en tinta y salte al color del lugar. Las
 * navegaciones del cliente las sigue `<LugarActual>`. Se arma desde
 * `RUTAS_LUGAR` para que no haya dos copias de la relación.
 */
export function scriptLugar(): string {
  return `(function(){try{var R=${JSON.stringify(RUTAS_LUGAR)},P=${JSON.stringify(PERFIL_PROPIO)};var p=location.pathname.replace(/\\/+$/,'')||'/';var l=null;if(p==='/')l='hoy';else if(p==='/perfil')l='vos';else if(p.indexOf('/perfil/')===0){l=P.indexOf(p.split('/')[2]||'')>=0?'vos':'plaza'}else{for(var i=0;i<R.length;i++){var r=R[i][0];if(p===r||p.indexOf(r+'/')===0){l=R[i][1];break}}}if(l)document.documentElement.setAttribute('data-lugar',l)}catch(e){}})();`;
}
