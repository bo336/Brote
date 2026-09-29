// ─────────────────────────────────────────────────────────────────────────────
// El lenguaje con el que se escribe el currículum del Árbol.
//
// POR QUÉ UN DSL Y NO JSON A MANO. El currículum son miles de pasos. Escritos
// como objetos completos, la mitad del archivo serían llaves, ids y campos
// repetidos, y un error de tipeo en un id rompe una pregunta en silencio. Acá
// cada constructor recibe solo lo que un autor piensa —el enunciado, las
// opciones, la explicación— y el constructor pone los ids, separa lo público
// de la solución y valida la forma. `construir.mjs` hace el resto.
//
// CONVENCIONES QUE HAY QUE SABER PARA ESCRIBIR:
//   · En `op`, la PRIMERA opción es la correcta. El servidor baraja en cada
//     entrega, así que el orden escrito nunca llega a la pantalla.
//   · En `mult`, las correctas empiezan con '+' y las incorrectas con '-'.
//   · En `vf`, las razones siguen la misma regla: '+' la que explica, '-' las
//     que no.
//   · En `ord`, `rank` y `cad`, los ítems se escriben EN el orden correcto.
//   · En `comp`, los huecos van entre corchetes: 'El agua se [evapora].'
//   · Una opción puede ser ['texto', 'nota'] para explicar por qué tienta.
//   · El último argumento opcional es `m` (meta): { d: dificultad 1-5,
//     c: concepto, ctx: caso de contexto, datos: gráfico, ayuda, r: repasable }.
// ─────────────────────────────────────────────────────────────────────────────

/** Separa '+texto' / '-texto'. Sin signo, se asume incorrecta. */
function signo(s) {
  if (Array.isArray(s)) {
    const [t, nota] = s;
    const r = signo(t);
    return { ...r, nota };
  }
  if (typeof s !== 'string') throw new Error(`opción inválida: ${JSON.stringify(s)}`);
  if (s.startsWith('+')) return { ok: true, texto: s.slice(1).trim() };
  if (s.startsWith('-')) return { ok: false, texto: s.slice(1).trim() };
  return { ok: false, texto: s.trim() };
}

/** Una opción de `op`: string o [texto, nota]. */
function opcion(o) {
  if (Array.isArray(o)) return { texto: o[0], nota: o[1] ?? null };
  return { texto: o, nota: null };
}

function meta(m = {}) {
  const out = {};
  if (m.ctx) out.contexto = m.ctx;
  if (m.datos) out.datos = m.datos;
  if (m.ayuda) out.ayuda = m.ayuda;
  return out;
}

function base(tipo, payload, solucion, m = {}) {
  return {
    tipo,
    payload: { tipo, ...payload, ...meta(m) },
    solucion,
    dificultad: m.d ?? null,
    concepto: m.c ?? null,
    repasable: m.r ?? true,
  };
}

// ── Presentación ─────────────────────────────────────────────────────────────

/**
 * Una tarjeta de teoría. `cuerpo` es un párrafo o una lista de párrafos.
 * extra: { destacado: { valor, texto }, lista: [...], nota }
 */
export function teoria(titulo, cuerpo, extra = {}) {
  const payload = { titulo, cuerpo: Array.isArray(cuerpo) ? cuerpo : [cuerpo] };
  if (extra.destacado) payload.destacado = extra.destacado;
  if (extra.lista) payload.lista = extra.lista;
  if (extra.nota) payload.nota = extra.nota;
  if (extra.datos) payload.datos = extra.datos;
  return { tipo: 'teoria', payload: { tipo: 'teoria', ...payload }, solucion: {}, dificultad: 1, concepto: null, repasable: false };
}

/** Un ejemplo resuelto: el planteo, los pasos, y el resultado. */
export function ejemplo(titulo, planteo, pasos, resultado, extra = {}) {
  const payload = { titulo, planteo, pasos, resultado };
  if (extra.datos) payload.datos = extra.datos;
  return { tipo: 'ejemplo', payload: { tipo: 'ejemplo', ...payload }, solucion: {}, dificultad: 1, concepto: null, repasable: false };
}

// ── Ejercicios ───────────────────────────────────────────────────────────────

/** Opción única. La primera opción es la correcta. */
export function op(enunciado, opciones, explicacion, m) {
  const os = opciones.map(opcion);
  const ops = os.map((o, i) => ({ id: `o${i + 1}`, texto: o.texto }));
  const por_opcion = {};
  os.forEach((o, i) => {
    if (o.nota) por_opcion[`o${i + 1}`] = o.nota;
  });
  const sol = { clave: ['o1'], explicacion };
  if (Object.keys(por_opcion).length) sol.por_opcion = por_opcion;
  return base('opcion', { enunciado, opciones: ops }, sol, m);
}

/** Selección múltiple: '+correcta', '-incorrecta'. */
export function mult(enunciado, opciones, explicacion, m) {
  const os = opciones.map(signo);
  const ops = os.map((o, i) => ({ id: `o${i + 1}`, texto: o.texto }));
  const por_opcion = {};
  os.forEach((o, i) => {
    if (o.nota) por_opcion[`o${i + 1}`] = o.nota;
  });
  const sol = { clave: os.flatMap((o, i) => (o.ok ? [`o${i + 1}`] : [])), explicacion };
  if (Object.keys(por_opcion).length) sol.por_opcion = por_opcion;
  return base('multiple', { enunciado: enunciado, opciones: ops }, sol, m);
}

/**
 * Verdadero o falso. Con `m.razones` ('+la que explica', '-otras'), además
 * hay que elegir POR QUÉ: acertar sin saber por qué es media respuesta.
 */
export function vf(afirmacion, valor, explicacion, m = {}) {
  const payload = { enunciado: m.enunciado ?? '¿Verdadero o falso?', afirmacion };
  const sol = { valor: !!valor, explicacion };
  if (m.razones) {
    const rs = m.razones.map(signo);
    payload.razones = rs.map((r, i) => ({ id: `r${i + 1}`, texto: r.texto }));
    sol.clave = rs.flatMap((r, i) => (r.ok ? [`r${i + 1}`] : []));
    const por_opcion = {};
    rs.forEach((r, i) => {
      if (r.nota) por_opcion[`r${i + 1}`] = r.nota;
    });
    if (Object.keys(por_opcion).length) sol.por_opcion = por_opcion;
  }
  return base('vf', payload, sol, m);
}

/** Ordenar. Los ítems van escritos en el orden correcto. */
export function ord(enunciado, items, explicacion, m = {}) {
  const its = items.map((t, i) => ({ id: `i${i + 1}`, texto: t }));
  const payload = { enunciado, items: its };
  if (m.extremos) payload.extremos = m.extremos;
  return base('ordenar', payload, { clave: its.map((x) => x.id), explicacion }, m);
}

/**
 * Ranking por magnitud. items: [[texto, 'valor que se revela'], ...] de
 * mayor a menor (o en el orden que diga `m.extremos`).
 */
export function rank(enunciado, items, explicacion, m = {}) {
  const its = items.map(([t], i) => ({ id: `i${i + 1}`, texto: t }));
  const valores = {};
  items.forEach(([, v], i) => {
    if (v) valores[`i${i + 1}`] = v;
  });
  const payload = { enunciado, items: its, extremos: m.extremos ?? ['Más', 'Menos'] };
  const sol = { clave: its.map((x) => x.id), explicacion };
  if (Object.keys(valores).length) sol.valores = valores;
  return base('ranking', payload, sol, m);
}

/** Cadena causal: eslabones en orden + señuelos que no pertenecen. */
export function cad(enunciado, cadena, senuelos, explicacion, m = {}) {
  const todos = [...cadena, ...senuelos];
  const its = todos.map((t, i) => ({ id: `i${i + 1}`, texto: t }));
  const payload = { enunciado, items: its, largo: cadena.length };
  if (m.extremos) payload.extremos = m.extremos;
  return base('cadena', payload, { clave: cadena.map((_, i) => `i${i + 1}`), explicacion }, m);
}

/** Clasificar: { 'Grupo A': [items], 'Grupo B': [items] }. */
export function clas(enunciado, grupos, explicacion, m = {}) {
  const gs = Object.keys(grupos).map((nombre, i) => ({ id: `g${i + 1}`, nombre }));
  const its = [];
  const clave = {};
  let k = 0;
  // Se intercalan los grupos al escribir los ítems: si no, el orden de
  // escritura quedaría agrupado (aunque el servidor baraja igual).
  const colas = Object.values(grupos).map((arr) => [...arr]);
  let quedan = true;
  while (quedan) {
    quedan = false;
    colas.forEach((cola, gi) => {
      if (cola.length) {
        quedan = true;
        const texto = cola.shift();
        k += 1;
        its.push({ id: `i${k}`, texto });
        clave[`i${k}`] = gs[gi].id;
      }
    });
  }
  return base('clasificar', { enunciado, grupos: gs, items: its }, { clave, explicacion }, m);
}

/** Emparejar: [[izquierda, derecha], ...]. */
export function par(enunciado, pares, explicacion, m = {}) {
  const izq = pares.map(([a], i) => ({ id: `a${i + 1}`, texto: a }));
  const der = pares.map(([, b], i) => ({ id: `b${i + 1}`, texto: b }));
  const clave = {};
  pares.forEach((_, i) => {
    clave[`a${i + 1}`] = `b${i + 1}`;
  });
  return base('emparejar', { enunciado, izquierda: izq, derecha: der }, { clave, explicacion }, m);
}

/** Completar: 'texto con [hueco] y [otro]' + distractores para el banco. */
export function comp(enunciado, texto, distractores, explicacion, m = {}) {
  const huecos = [];
  let n = 0;
  const frase = texto.replace(/\[([^\]]+)\]/g, (_, palabra) => {
    huecos.push(palabra.trim());
    return `{{${n++}}}`;
  });
  const banco = [...huecos, ...distractores].map((t, i) => ({ id: `w${i + 1}`, texto: t }));
  return base('completar', { enunciado, texto: frase, banco }, { clave: huecos.map((_, i) => `w${i + 1}`), explicacion }, m);
}

/**
 * Un cálculo con respuesta numérica exacta (dentro de una tolerancia).
 * m: { tol, dec (decimales que admite el campo) }
 */
export function num(enunciado, valor, unidad, explicacion, m = {}) {
  const dec = m.dec ?? (Number.isInteger(valor) ? 0 : Math.min(3, String(valor).split('.')[1]?.length ?? 1));
  const tol = m.tol ?? Math.max(Math.abs(valor) * 0.02, 0.5 * 10 ** -dec);
  return base('numero', { enunciado, unidad, decimales: dec }, { valor, tolerancia: tol, explicacion }, m);
}

/**
 * Variantes de un cálculo: `n` versiones con otros números. `gen(i)` devuelve
 * { enunciado, valor, unidad, explicacion, ctx?, tol?, dec? }. Comparten
 * posición y grupo: el servidor sirve una al azar, y repasar cualquiera
 * cuenta como repasar el grupo.
 */
export function numv(n, gen, m = {}) {
  const vs = [];
  for (let i = 0; i < n; i++) {
    const g = gen(i);
    vs.push(num(g.enunciado, g.valor, g.unidad, g.explicacion, { ...m, ctx: g.ctx ?? m.ctx, tol: g.tol ?? m.tol, dec: g.dec ?? m.dec }));
  }
  return { variantes: vs };
}

/** Estimación con deslizador. o: { min, max, paso, unidad, escala: 'lineal'|'log' } */
export function est(enunciado, valor, o, explicacion, m = {}) {
  const escala = o.escala ?? 'lineal';
  return base(
    'estimar',
    { enunciado, min: o.min, max: o.max, paso: o.paso ?? 1, unidad: o.unidad, escala },
    { valor, banda: escala === 'log' ? 'log' : 'lineal', explicacion },
    m,
  );
}

/**
 * Detectar: segmentos de un texto; se marcan los problemáticos.
 * segs: [['texto', false], ['texto con problema', true, 'nota opcional'], ...]
 */
export function det(enunciado, segs, explicacion, m = {}) {
  const ss = segs.map(([t], i) => ({ id: `s${i + 1}`, texto: t }));
  const por_opcion = {};
  segs.forEach(([, , nota], i) => {
    if (nota) por_opcion[`s${i + 1}`] = nota;
  });
  const sol = { clave: segs.flatMap(([, mal], i) => (mal ? [`s${i + 1}`] : [])), explicacion };
  if (Object.keys(por_opcion).length) sol.por_opcion = por_opcion;
  return base('detectar', { enunciado, segmentos: ss }, sol, m);
}

// ── Datos para gráficos ──────────────────────────────────────────────────────

/** Un gráfico de barras: filas [[etiqueta, valor], ...]. */
export function barras(titulo, unidad, filas, nota) {
  const d = { tipo: 'barras', titulo, unidad, filas: filas.map(([etiqueta, valor]) => ({ etiqueta, valor })) };
  if (nota) d.nota = nota;
  return d;
}

/** Una tabla: columnas y filas de texto. */
export function tabla(titulo, columnas, filas, nota) {
  const d = { tipo: 'tabla', titulo, columnas, filas };
  if (nota) d.nota = nota;
  return d;
}

// ── Estructura ───────────────────────────────────────────────────────────────

export function leccion(titulo, bajada, pasos, o = {}) {
  return { tipo: 'leccion', titulo, bajada, pasos, minutos: o.minutos ?? null };
}

/**
 * La práctica de la unidad: una tarjeta de entrada escrita y el resto lo arma
 * el servidor con los pasos de toda la unidad, empezando por lo más débil.
 */
export function practica(titulo, bajada, pasos = [], o = {}) {
  return { tipo: 'practica', titulo, bajada, pasos, minutos: o.minutos ?? 8 };
}

/** El desafío que cierra la unidad: pasos propios, más difíciles, + relleno. */
export function desafio(titulo, bajada, pasos, o = {}) {
  return { tipo: 'desafio', titulo, bajada, pasos, minutos: o.minutos ?? 10 };
}

export function unidad(u) {
  return u;
}
