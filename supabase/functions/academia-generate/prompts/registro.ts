// ─────────────────────────────────────────────────────────────────────────────
// El registro de prompts, versionado.
//
// Cada fila generada guarda el `prompt_version` que la produjo. Eso no es
// contabilidad: es la única forma de contestar "¿qué prompt escribió esta
// tanda de basura?" cuando una tanda sale mal. Sin la versión, un lote malo se
// convierte en 200 ítems huérfanos que nadie sabe de dónde salieron.
//
// Al cambiar un fragmento: SUBIR la versión, no editar en el lugar. Los ítems
// viejos tienen que seguir apuntando a la versión que los hizo.
// ─────────────────────────────────────────────────────────────────────────────

export const PROMPT_VERSION = 'v1.0.0';

export interface Contexto {
  concepto: {
    id: string;
    slug: string;
    titulo_es: string;
    enunciado_es: string;
    detalle_es: string | null;
    rama_slug: string;
    anillo: number;
    age_groups: string[];
    sensible: boolean;
  };
  anillo_rubrica: { nombre: string; rubrica: string } | null;
  fuentes: { id: string; organizacion: string; titulo: string; publicado: string | null; contenido: string }[];
  misconceptions: { slug: string; creencia_es: string; correccion_es: string }[];
  ejemplos: { enunciado: string; payload_publico: unknown }[];
}

/** El rol y las reglas duras. Van SIEMPRE primero y son idénticas para los 12. */
const ROL = `Escribís ejercicios de evaluación para una app argentina de educación ambiental.

REGLAS QUE NO SE NEGOCIAN:
- Castellano rioplatense, voseo. "Vos tenés", nunca "tú tienes" ni "usted tiene".
- NUNCA inventes un dato. Si las fuentes no alcanzan para armar un ejercicio,
  devolvé MENOS ejercicios. Devolver menos es correcto; adivinar no lo es.
- Cada afirmación factual va acompañada de una cita LITERAL de la fuente: una
  subcadena exacta, copiada carácter por carácter del texto que te damos. Se
  verifica automáticamente. Una cita que no sea literal descarta el ejercicio
  entero.
- Tono: agencia y esperanza, nunca catástrofe ni culpa. Nada de "estás
  destruyendo el planeta". Nada de imperativos en segunda persona que reten.
- Sin supuestos que solo valgan en Buenos Aires. Si algo es porteño, decilo.
- Nada de emoji.`;

/** Qué varía en cada tipo: los radicales, que son lo que mueve la dificultad. */
const RADICALES: Record<string, string> = {
  opcion_multiple:
    'la dirección del reconocimiento (del concepto a su definición, o al revés), la cercanía semántica de los distractores, y el orden de magnitud si hay números.',
  elegir_la_accion:
    'el escenario cotidiano, cuán parecidas son las dos mejores opciones, y si la correcta es la obvia o la contraintuitiva.',
  mito_o_dato:
    'si la afirmación es cierta o falsa, y cuán extendida es la creencia.',
  ordenar_secuencia: 'el largo de la secuencia y cuán separados están los pasos en el tiempo.',
  ranking_impacto: 'la cantidad de opciones y qué tan cerca están sus magnitudes reales.',
  cadena_causal: 'el largo de la cadena y la cantidad de señuelos.',
  clasificar_en_cestos: 'la cantidad de cestos, las fichas de frontera y los casos límite.',
  emparejar: 'la cantidad de pares y cuán parecidas son las opciones de la derecha.',
  estimacion_numerica: 'el orden de magnitud, la unidad y el ancho del rango.',
  detectar_greenwashing: 'cuántas frases del claim son verificables y cuán sutil es la vaguedad.',
  mapa_localizar: 'la escala geográfica y cuán parecidas son las regiones alternativas.',
  completar_frase: 'la cantidad de huecos y cuán parecidas son las palabras del banco.',
};

/** La forma del payload público de cada tipo. Debe coincidir con lib/academia/schemas.ts. */
const FORMA: Record<string, string> = {
  opcion_multiple: '{ "enunciado": string, "ayuda": string|null, "opciones": [{ "id": "o1", "texto": string }] }  (4 opciones)',
  elegir_la_accion: '{ "enunciado": string, "ayuda": string|null, "escenario": string, "opciones": [{ "id": "o1", "texto": string }] }',
  mito_o_dato: '{ "enunciado": string, "ayuda": string|null, "afirmacion": string }',
  ordenar_secuencia: '{ "enunciado": string, "ayuda": string|null, "consigna": string, "fragmentos": [{ "id": "f1", "texto": string }] }',
  ranking_impacto: '{ "enunciado": string, "ayuda": string|null, "consigna": string, "opciones": [{ "id": "o1", "texto": string, "dominio": string }] }',
  cadena_causal: '{ "enunciado": string, "ayuda": string|null, "fragmentos": [{ "id": "f1", "texto": string }], "largo_cadena": number }',
  clasificar_en_cestos: '{ "enunciado": string, "ayuda": string|null, "cestos": [{ "id": "c1", "nombre": string, "color": null }], "fichas": [{ "id": "t1", "texto": string }] }',
  emparejar: '{ "enunciado": string, "ayuda": string|null, "izquierda": [{ "id": "x1", "texto": string }], "derecha": [{ "id": "d1", "texto": string }] }',
  estimacion_numerica: '{ "enunciado": string, "ayuda": string|null, "min": number, "max": number, "paso": number, "unidad": string, "escala": "lineal"|"log" }',
  detectar_greenwashing: '{ "enunciado": string, "ayuda": string|null, "claim": string, "spans": [{ "id": "s1", "texto": string }] }',
  mapa_localizar: '{ "enunciado": string, "ayuda": string|null, "centro": [number, number], "zoom": number, "capa": string, "alternativas": [{ "id": "a1", "texto": string }] }',
  completar_frase: '{ "enunciado": string, "ayuda": string|null, "frase": string, "banco": [{ "id": "b1", "texto": string }] }',
};

/** La clave, por tipo. Es lo que el corrector SQL espera encontrar. */
const CLAVE: Record<string, string> = {
  opcion_multiple: '"clave": ["o3"]  — exactamente un id',
  elegir_la_accion: '"clave": ["o1"]  — exactamente un id',
  mito_o_dato: '"es_dato": true|false',
  ordenar_secuencia: '"clave": ["f2","f1","f3"]  — TODOS los fragmentos, en orden',
  ranking_impacto: '"clave": ["o1","o3","o2"]  — de mayor a menor impacto',
  cadena_causal: '"clave": ["f1","f3"]  — solo los de la cadena, en orden',
  clasificar_en_cestos: '"clave": { "t1": "c1", "t2": "c2" }  — ficha → cesto',
  emparejar: '"clave": { "x1": "d2", "x2": "d1" }  — izquierda → derecha',
  estimacion_numerica: '"valor": 15000, "clave": 15000, "unidad": "L"',
  detectar_greenwashing: '"clave": ["s1","s3"]  — los spans SIN respaldo',
  mapa_localizar: '"clave": ["a2"], "region": "nombre de la region"',
  completar_frase: '"clave": ["b1","b2"]  — en el orden de los huecos {{0}}, {{1}}',
};

export function promptItems(ctx: Contexto, tipo: string, n: number): string {
  const c = ctx.concepto;
  const fuentes = ctx.fuentes
    .map((f, i) => `--- FUENTE ${i + 1} · id=${f.id} · ${f.organizacion}${f.publicado ? ` (${f.publicado})` : ''}\n${f.contenido}`)
    .join('\n\n');

  const creencias = ctx.misconceptions.length
    ? ctx.misconceptions
        .map((m) => `- creencia falsa: "${m.creencia_es}"\n  por qué es falsa: ${m.correccion_es}\n  slug: ${m.slug}`)
        .join('\n')
    : '(no hay creencias falsas documentadas para este concepto)';

  const ejemplos = ctx.ejemplos.length
    ? ctx.ejemplos.map((e, i) => `EJEMPLO ${i + 1}:\n${JSON.stringify(e.payload_publico, null, 1)}`).join('\n\n')
    : '(todavía no hay ejemplos aprobados de este tipo)';

  return `${ROL}

═══ CONCEPTO ═══
slug: ${c.slug}
título: ${c.titulo_es}
qué afirma: ${c.enunciado_es}
${c.detalle_es ? `detalle: ${c.detalle_es}\n` : ''}rama: ${c.rama_slug} · anillo: ${c.anillo}
edades habilitadas: ${c.age_groups.join(', ')}${c.sensible ? '\n⚠ CONCEPTO SENSIBLE: nada apto para menores.' : ''}
${ctx.anillo_rubrica ? `nivel "${ctx.anillo_rubrica.nombre}": ${ctx.anillo_rubrica.rubrica}` : ''}

═══ FUENTES ═══
Estas son las ÚNICAS fuentes permitidas. Cada cita tiene que salir literalmente
de acá.

${fuentes}

═══ CREENCIAS FALSAS (usalas como distractores) ═══
Un distractor que nadie cree no mide nada. Estos SÍ los cree la gente:

${creencias}

═══ EJEMPLOS APROBADOS DEL MISMO TIPO ═══
${ejemplos}

═══ TAREA ═══
Escribí ${n} ejercicios de tipo "${tipo}" sobre este concepto.
Variá estos radicales entre ejercicio y ejercicio: ${RADICALES[tipo] ?? 'la superficie del enunciado.'}
Los ${n} tienen que ser genuinamente distintos, no la misma pregunta reescrita.

Forma de "payload_publico" para "${tipo}":
${FORMA[tipo] ?? '(consultá lib/academia/schemas.ts)'}

En "solucion" va: ${CLAVE[tipo] ?? '"clave"'}
Además, siempre: "explicacion" (2-4 oraciones, explicando POR QUÉ, no solo cuál),
y cuando el distractor corresponda a una creencia falsa documentada,
"por_opcion": { "o2": { "misconception_slug": "...", "nota": "por qué es tentadora" } }.

═══ RESPUESTA ═══
Un único objeto JSON:
{
  "items": [
    {
      "payload_publico": { ... },
      "solucion": { ... },
      "afirmaciones": [
        { "claim": "lo que el ítem afirma",
          "fuente_id": "el id exacto de arriba",
          "cita": "subcadena LITERAL de esa fuente, mínimo 12 caracteres" }
      ],
      "dificultad_estimada": 0.4,
      "age_groups": ["teen","adult"]
    }
  ]
}`;
}

/**
 * El juez. Llamada SEPARADA y prompt DISTINTO — a propósito: pedirle al mismo
 * prompt que genere y se autoevalúe produce un sí complaciente.
 */
export const JUEZ_VERSION = 'juez-v1.0.0';

export function promptJuez(payload: unknown, solucion: unknown, ctx: Contexto): string {
  return `Sos revisor de ejercicios de educación ambiental para una app argentina.
Evaluás con dureza. Tu trabajo es encontrar problemas, no aprobar.

CONCEPTO: ${ctx.concepto.titulo_es} — ${ctx.concepto.enunciado_es}
EDADES: ${ctx.concepto.age_groups.join(', ')}

EJERCICIO:
${JSON.stringify(payload, null, 1)}

SOLUCIÓN DECLARADA:
${JSON.stringify(solucion, null, 1)}

Puntuá de 1 a 5 (5 = impecable):
- correccion_factual: ¿lo que afirma es cierto y está vigente?
- respuesta_unica: ¿hay UNA sola respuesta defendible? ¿alguna otra opción se
  puede argumentar?
- distractores: ¿son plausibles para alguien que no sabe, sin ser trampas?
- nivel_lectura: ¿el lenguaje corresponde a las edades declaradas?
- sin_sesgo_regional: ¿funciona fuera de Buenos Aires?
- tono: ¿agencia y esperanza, sin culpa ni catástrofe?

Y marcá "problema_bloqueante": true si hay CUALQUIER cosa que impida publicarlo
tal cual.

Respondé solo este JSON:
{ "correccion_factual": 1-5, "respuesta_unica": 1-5, "distractores": 1-5,
  "nivel_lectura": 1-5, "sin_sesgo_regional": 1-5, "tono": 1-5,
  "problema_bloqueante": true|false, "comentario": "una o dos oraciones" }`;
}

/** La expansión de currículum. Riesgo alto: siempre a revisión humana. */
export const CURRICULUM_VERSION = 'curriculum-v1.0.0';

export function promptCurriculum(args: {
  rama: string;
  ramaNombre: string;
  anillo: number;
  rubrica: string | null;
  gajosExistentes: { slug: string; titulo_es: string; anillo: number }[];
  conceptosExistentes: string[];
}): string {
  return `${ROL}

═══ CONTEXTO ═══
Rama: ${args.ramaNombre} (slug: ${args.rama})
Anillo a poblar: ${args.anillo}${args.rubrica ? `\nQué significa este anillo: ${args.rubrica}` : ''}

Gajos que ya existen en esta rama:
${args.gajosExistentes.map((g) => `- [anillo ${g.anillo}] ${g.slug}: ${g.titulo_es}`).join('\n')}

Slugs de conceptos que YA EXISTEN (no los repitas, pero SÍ podés usarlos como
prerrequisitos):
${args.conceptosExistentes.join(', ')}

═══ TAREA ═══
Proponé 3 gajos nuevos para el anillo ${args.anillo} de esta rama.
Cada gajo: 4 a 6 conceptos.
Cada concepto: un enunciado de una oración que afirme algo concreto y
verificable, y sus prerrequisitos.

REGLAS DURAS (se verifican en la base de datos, no acá):
- Un prerrequisito SOLO puede nombrar un slug que ya exista, o uno de los
  conceptos de esta misma propuesta.
- No se crean ramas nuevas. Las 13 son identidad del producto.
- Nada de ciclos: si A necesita B, B no puede necesitar A.
- Los slugs van como "${args.rama}.algo_en_snake_case".

═══ RESPUESTA ═══
{
  "gajos": [
    { "slug": "${args.rama}.nombre-del-gajo",
      "titulo_es": "...",
      "bajada_es": "una oración",
      "conceptos": [
        { "slug": "${args.rama}.concepto_uno",
          "titulo_es": "...",
          "enunciado_es": "...",
          "prereq": ["${args.rama}.algo_existente"],
          "plantillas": ["boceto de ejercicio 1", "boceto de ejercicio 2"] }
      ] }
  ]
}`;
}
