/**
 * Qué se le pregunta a cada edad al empezar (0145), y en qué orden.
 *
 * Cada pregunta existe porque cambia algo: el tiempo cambia cómo se arma el día
 * (`context.ritmo` en `brote_armar_dia`), los temas pesan en qué acciones salen
 * primero, y cada cosa de la casa habilita las acciones que la piden
 * (`activities.requiere`). Lo que no cambiaba nada ("¿dónde comprás la comida?")
 * se fue. La pantalla muestra cuántas acciones suma cada respuesta, con los
 * números de la base (`onboarding_conteos`).
 *
 * Sin red y sin alias de rutas: lo compila el runner de tests.
 */

import type { ContextoClave } from '../acciones/reglas';

export type Edad = 'kid' | 'teen' | 'adult';

export type PasoId = 'bienvenida' | 'vos' | 'adulto' | 'tiempo' | 'temas' | 'casa' | 'seguir' | 'mundo' | 'dia';

/**
 * Un chico no elige cuánto tiempo (su día ya es corto y seguro), no sigue a
 * nadie, y antes de seguir una persona adulta autoriza la cuenta.
 */
export function pasosPara(edad: Edad): PasoId[] {
  if (edad === 'kid') return ['bienvenida', 'vos', 'adulto', 'temas', 'casa', 'mundo', 'dia'];
  return ['bienvenida', 'vos', 'tiempo', 'temas', 'casa', 'seguir', 'mundo', 'dia'];
}

export const EDADES: { key: Edad; label: string; detalle: string }[] = [
  { key: 'kid', label: 'Hasta 12', detalle: 'Cuenta cuidada: sin publicidad, sin compras y sin hablar con desconocidos. La autoriza una persona adulta.' },
  { key: 'teen', label: '13 a 17', detalle: 'Publicás, seguís y te sumás a proyectos, con cuidados.' },
  { key: 'adult', label: '18 o más', detalle: 'Todo Brote: organizar proyectos, el Mercado y más.' },
];

/** Cómo se llama el campo del nombre: a un menor no le pedimos su nombre real. */
export const NOMBRE: Record<Edad, { label: string; ayuda: string; placeholder: string }> = {
  kid: { label: 'Tu apodo', ayuda: 'Así te va a llamar Pip. No pongas tu nombre completo ni tu apellido.', placeholder: 'Por ejemplo: Tomi' },
  teen: { label: 'Tu nombre o apodo', ayuda: 'Lo ven quienes te siguen. No hace falta tu apellido.', placeholder: 'Tu nombre o apodo' },
  adult: { label: 'Tu nombre', ayuda: 'Lo ven las personas que te siguen.', placeholder: 'Tu nombre o apodo' },
};

/** La provincia ordena el ranking local y algunas acciones regionales; a un chico no se la pedimos. */
export function preguntaProvincia(edad: Edad): boolean {
  return edad !== 'kid';
}

export type Ritmo = 'corto' | 'normal' | 'mas';

export const RITMOS: { v: Ritmo; titulo: string; detalle: string }[] = [
  { v: 'corto', titulo: 'Poquito', detalle: 'Sólo acciones rápidas, de 5 minutos o menos.' },
  { v: 'normal', titulo: 'Un rato', detalle: 'Sobre todo rápidas y, a veces, una más larga.' },
  { v: 'mas', titulo: 'Me copa', detalle: 'Le puedo dedicar más: hasta dos acciones largas por día.' },
];

/** Temas: un adulto o un adolescente elige entre todos; a un chico, en sus palabras. */
export const TEMAS_CHICOS: { slug: string; label: string }[] = [
  { slug: 'animales', label: 'Animales' },
  { slug: 'plantas', label: 'Plantas' },
  { slug: 'agua', label: 'Agua' },
  { slug: 'residuos', label: 'Reciclar' },
  { slug: 'energia', label: 'Ahorrar energía' },
  { slug: 'ciencia', label: 'Experimentos' },
  { slug: 'alimentacion', label: 'Comida' },
];

export const MAX_TEMAS = 3;

export interface PreguntaCasa {
  titulo: string;
  opciones: { clave: ContextoClave; label: string }[];
}

/**
 * Lo de la casa y el día, por edad. Sólo lo que alguna acción pide: con 0
 * acciones para esa edad, la opción no se muestra (`opcionesVisibles`).
 */
export const PREGUNTAS_CASA: Record<Edad, PreguntaCasa[]> = {
  adult: [
    {
      titulo: '¿Qué hay en tu casa?',
      opciones: [
        { clave: 'balcon', label: 'Balcón, terraza o patio' },
        { clave: 'jardin', label: 'Jardín o tierra' },
        { clave: 'huerta', label: 'Huerta o macetas' },
        { clave: 'compost', label: 'Compostera' },
        { clave: 'pileta', label: 'Pileta' },
        { clave: 'aire', label: 'Aire acondicionado' },
        { clave: 'gas', label: 'Calefón o estufa a gas' },
        { clave: 'lena', label: 'Leña' },
        { clave: 'parrilla', label: 'Parrilla' },
      ],
    },
    {
      titulo: '¿Cómo te movés?',
      opciones: [
        { clave: 'auto', label: 'Auto o moto' },
        { clave: 'bici', label: 'Bici' },
      ],
    },
    {
      titulo: '¿Con quién vivís?',
      opciones: [
        { clave: 'chicos', label: 'Chicos' },
        { clave: 'perro', label: 'Perro' },
        { clave: 'gato', label: 'Gato' },
      ],
    },
    {
      titulo: 'Tu día y tu lugar',
      opciones: [
        { clave: 'trabajo', label: 'Trabajo fuera de casa' },
        { clave: 'estudio', label: 'Estudio (escuela, facu o cursos)' },
        { clave: 'campo', label: 'Campo o pueblo chico' },
        { clave: 'costa', label: 'Cerca del mar, un río o una laguna' },
      ],
    },
  ],
  teen: [
    {
      titulo: '¿Qué hay en tu casa?',
      opciones: [
        { clave: 'balcon', label: 'Balcón, terraza o patio' },
        { clave: 'jardin', label: 'Jardín o tierra' },
        { clave: 'huerta', label: 'Huerta o macetas' },
        { clave: 'compost', label: 'Compostera' },
        { clave: 'pileta', label: 'Pileta' },
        { clave: 'aire', label: 'Aire acondicionado' },
        { clave: 'lena', label: 'Leña' },
        { clave: 'parrilla', label: 'Parrilla' },
      ],
    },
    {
      titulo: '¿Cómo te movés?',
      opciones: [
        { clave: 'bici', label: 'Tengo bici' },
        { clave: 'auto', label: 'En casa hay auto o moto' },
      ],
    },
    {
      titulo: '¿Tenés mascota?',
      opciones: [
        { clave: 'perro', label: 'Perro' },
        { clave: 'gato', label: 'Gato' },
      ],
    },
    {
      titulo: 'Tu día y tu lugar',
      opciones: [
        { clave: 'estudio', label: 'Voy a la escuela o a la facu' },
        { clave: 'campo', label: 'Campo o pueblo chico' },
        { clave: 'costa', label: 'Cerca del mar, un río o una laguna' },
      ],
    },
  ],
  kid: [
    {
      titulo: '¿Tu casa tiene…?',
      opciones: [
        { clave: 'balcon', label: 'Patio, balcón o terraza' },
        { clave: 'jardin', label: 'Jardín' },
        { clave: 'huerta', label: 'Plantas o huerta' },
        { clave: 'pileta', label: 'Pileta' },
        { clave: 'aire', label: 'Aire acondicionado' },
        { clave: 'parrilla', label: 'Parrilla' },
      ],
    },
    {
      titulo: '¿Y vos tenés…?',
      opciones: [
        { clave: 'bici', label: 'Bici' },
        { clave: 'perro', label: 'Perro' },
        { clave: 'gato', label: 'Gato' },
        { clave: 'estudio', label: 'Voy a la escuela' },
      ],
    },
  ],
};

/** Lo que casi todos tienen a esa edad, ya marcado (se puede desmarcar). */
export function marcadasDeEntrada(edad: Edad): Set<string> {
  return new Set(edad === 'adult' ? [] : ['estudio']);
}

/** Las opciones que suman algo para esta edad. Sin conteos todavía, todas. */
export function opcionesVisibles(p: PreguntaCasa, conteos: Record<string, number> | null): PreguntaCasa['opciones'] {
  if (!conteos) return p.opciones;
  return p.opciones.filter((o) => (conteos[o.clave] ?? 0) > 0);
}

/** Todas las claves que pregunta una edad: las no marcadas se guardan como `false`. */
export function clavesDe(edad: Edad): ContextoClave[] {
  return PREGUNTAS_CASA[edad].flatMap((p) => p.opciones.map((o) => o.clave));
}

/**
 * Lo que se guarda del paso de la casa: marcado = true, preguntado y no
 * marcado = false, el ritmo si se eligió. Lo que esta edad no ve no se toca.
 */
export function contextoDeRespuestas(edad: Edad, marcadas: ReadonlySet<string>, ritmo: Ritmo | null): Record<string, unknown> {
  const out: Record<string, unknown> = { respondido: true };
  for (const k of clavesDe(edad)) out[k] = marcadas.has(k);
  if (ritmo) out.ritmo = ritmo;
  return out;
}

/** El vínculo de quien autoriza una cuenta de chico (`autorizaciones_adultas.vinculo`). */
export const VINCULOS: { v: 'madre_padre' | 'tutor' | 'otro_familiar'; label: string }[] = [
  { v: 'madre_padre', label: 'Mamá o papá' },
  { v: 'tutor', label: 'Tutor o tutora legal' },
  { v: 'otro_familiar', label: 'Otro familiar a cargo' },
];
