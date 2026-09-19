# Contrato de autoría del contenido de la Academia

Este archivo describe la forma **exacta** de los módulos que `gen-academia-seed.mjs`
lee para emitir `supabase/seed-academia.sql`. El generador **valida y falla** si algo
no cumple: un `fuente` inexistente, un `requiere` que apunta a la nada, un slug
repetido, un ciclo en el DAG, o contenido `sensible` marcado como apto para `kid`.

No es documentación aspiracional. Es el contrato que corre.

---

## 1 · Un módulo de rama

`scripts/academia/conceptos/<rama>.mjs`, un `export default` con esta forma:

```js
export default {
  rama: 'agua',                       // debe existir en estructura.mjs
  gajos: [ /* ver §2 */ ],
};
```

## 2 · Gajo

```js
{
  slug: 'agua.ciclo-y-cuenca',        // '<rama>.<kebab-case>', único en todo el árbol
  anillo: 1,                          // 1..4
  titulo_es: 'El ciclo y la cuenca',
  bajada_es: 'De dónde viene el agua que sale de tu canilla.',
  icono: 'Droplets',                  // nombre de un ícono de lucide-react. NUNCA un emoji.
  age_groups: ['kid', 'teen', 'adult'],
  sort_order: 1,
  conceptos: [ /* ver §3 */ ],
  hojas: [ /* ver §5 */ ],
}
```

## 3 · Concepto — la unidad de maestría

```js
{
  slug: 'agua.huella_virtual',        // '<rama>.<snake_case>', único en todo el árbol
  titulo_es: 'El agua virtual',
  // UNA sola oración: exactamente lo que la persona tiene que quedarse sabiendo.
  enunciado_es: 'La mayor parte del agua que consumís no sale de tu canilla: se usó para producir lo que comprás y comés.',
  detalle_es: null,                   // opcional, 1–2 oraciones más
  fuente: 'huella-hidrica',           // slug de fuentes.mjs. OBLIGATORIO.
  anillo: 1,                          // ≤ el anillo del gajo no es obligatorio, pero sé coherente
  dificultad_base: -0.4,              // logit. −1.6 lo más fácil · 0 medio · +1.6 lo más difícil
  age_groups: ['kid', 'teen', 'adult'],
  sensible: false,                    // crueldad, muerte, catástrofe, tráfico, faena
  requiere: ['tronco.leer_un_numero'],// prerrequisitos (ver §4)
  misconceptions: [ /* opcional, ver §6 */ ],
}
```

Reglas duras:

- **Nada inventado.** Cada `enunciado_es` tiene que poder sostenerse con la fuente que
  declara. La fuente de verdad del contenido es `ACADEMIA/research/03-environmental-curriculum.md`.
  Si no podés sostener un número, no pongas el número.
- **`sensible: true` ⟹ `age_groups` no puede incluir `'kid'`.** El generador lo verifica.
- Contenido `kid` en marco de agencia y esperanza. Nunca cierra en una amenaza.
- `dificultad_base` sube con el anillo: anillo 1 ≈ −1.2…−0.2, anillo 2 ≈ −0.4…+0.6,
  anillo 3 ≈ +0.2…+1.2, anillo 4 ≈ +0.8…+1.6.

## 4 · Prerrequisitos (`requiere`)

```js
requiere: [
  'tronco.leer_un_numero',                    // arista dura, fuerza 1.0
  { slug: 'agua.ciclo_agua', fuerza: 0.5 },   // sugerencia (punteada en la UI)
]
```

- Solo puede apuntar a un concepto **de la misma rama** o a uno de **`tronco.*`**.
  Esa restricción es lo que garantiza que el DAG no tenga ciclos entre módulos que
  se escriben por separado.
- `fuerza >= 0.8` es una compuerta real; por debajo es una sugerencia.
- Un DAG, no una cadena: la mayoría de los conceptos de anillo 1 no requieren nada.

## 5 · Hoja — el nodo de lección

```js
{
  slug: 'agua.ciclo-y-cuenca.1',      // '<gajo-slug>.<n>'
  titulo_es: 'De la nube a la canilla',
  bajada_es: 'El recorrido completo, sin saltarse la parte aburrida.',
  minutos: 4,
  age_groups: ['kid', 'teen', 'adult'],
  sort_order: 1,
  conceptos: ['agua.ciclo_agua', 'agua.cuenca_hidrografica'],  // 2–4, del mismo gajo
}
```

Una hoja **no tiene contenido propio**: nombra conceptos, y la sesión se compone en
el servidor. Un concepto puede aparecer en varias hojas — eso es currículum en
espiral, no un error.

## 6 · Misconception (opcional, dentro de un concepto)

```js
misconceptions: [
  {
    slug: 'agua.mito_embotellada',    // '<rama>.mito_<snake>', único
    creencia_es: 'El agua embotellada es más segura que la de la canilla.',
    correccion_es: 'En CABA el agua de red se trata y se controla. La embotellada suma plástico y transporte, y no es sistemáticamente más segura.',
    fuente: 'acumar',
  },
]
```

Son el combustible principal del generador de distractores: un distractor nacido de
una creencia documentada es el que la gente realmente elige. Si tu rama tiene un mito
asignado en la lista de §5 del dossier de investigación, **tenés que escribirlo**.

## 7 · Plantillas (`scripts/academia/plantillas/<tipo>.mjs`)

Una plantilla es `radicales × incidentales`, y de ahí sale el rendimiento
combinatorio. Un `export default` con un array de plantillas:

```js
{
  slug: 'agua.huella_virtual.om1',
  tipo: 'opcion_multiple',
  titulo_interno: 'Agua virtual por alimento',
  // {{x}} toma el campo `texto` del valor; {{x.campo}} toma un campo concreto.
  enunciado_tpl: '¿Cuánta agua hace falta, aproximadamente, para producir 1 kg de {{alimento}}?',
  ayuda: null,                        // pista que NO revela la respuesta, o null

  // RADICALES: cambian el ítem y su dificultad. Cada entrada es un ítem distinto.
  variantes: [
    { alimento: { texto: 'carne vacuna' }, clave: 15400, unidad: 'L', d: 0.2 },
    { alimento: { texto: 'pollo' },        clave: 4300,  unidad: 'L', d: 0.3 },
  ],

  // INCIDENTALES: la misma pregunta con otra ropa. Multiplican el rendimiento.
  // `contexto`, `region` y `registro` los usa el compositor para personalizar:
  //   contexto ∈ balcon|jardin|auto|bici|mascota|compra|general
  //   region   ∈ delta|riachuelo|pampa|costa|patagonia|chaco|general
  //   registro ∈ kid|teen|adult|general
  incidentales: {
    marco: [
      { k: 'general', texto: 'En promedio' },
      { k: 'compra',  texto: 'Cuando lo ponés en el changuito', contexto: 'compra' },
    ],
  },

  distractores: { estrategia: 'perturbacion', ops: ['/10', 'x10', '/100'] },
  conceptos: [['agua.huella_virtual', 1.0]],
  age_groups: ['teen', 'adult'],
  anillo_min: 1,
  dificultad_base: 0.2,
  fuente: 'huella-hidrica',
}
```

### Estrategias de distractor

| estrategia | qué hace |
|---|---|
| `misconception` | usa `creencia_es` de las misconceptions del concepto. **La mejor: usala siempre que se pueda.** |
| `perturbacion` | numérico: `x10`, `/10`, `x100`, `/100`, `+50%`, `-50%`, `unidad` |
| `lista` | distractores escritos a mano en la variante (`distractores: [...]`) |

### Forma de `variantes` por tipo

```jsonc
opcion_multiple      { ...slots, clave: 'texto o número', distractores?: [...] }
elegir_la_accion     { escenario: '...', clave: '...', distractores: ['...','...','...'] }
mito_o_dato          { afirmacion: '...', es_dato: true|false, explicacion: '...' }
ordenar_secuencia    { consigna: '...', orden: ['primero','segundo','tercero','cuarto'] }
ranking_impacto      { consigna: '...', orden: [{texto,dominio,valor,unidad}, ...] }  // de mayor a menor
cadena_causal        { cadena: ['a','b','c','d'], decoys: ['x','y'] }
clasificar_en_cestos { cestos: [{nombre,color?}], fichas: [{texto, cesto: 'nombre'}] }
emparejar            { pares: [['izq','der'], ...] }
estimacion_numerica  { pregunta?: '...', valor: 15400, unidad: 'L', min: 0, max: 50000, paso: 100, escala: 'log'|'lineal' }
detectar_greenwashing{ claim: '...', spans: [{texto, sin_respaldo: true|false}] }
mapa_localizar       { region: 'Delta del Paraná', centro: [lat,lng], zoom: 6, alternativas: ['...','...','...'] }
completar_frase      { frase: 'El {{0}} es ...', huecos: ['ombú'], banco: ['ceibo','tipa','jacarandá','timbó','sauce'] }
microlectura         { cuerpo: '40–70 palabras', destacado: 'una línea' }
dato_vivo            { valor: 343, unidad: 'especies de aves', que_significa: '...' }
```

Toda variante puede llevar `explicacion` (obligatoria salvo en presentación) y
`nota_por_opcion: { 'texto del distractor': 'por qué la gente elige esta' }`.

## 8 · Lo que el generador verifica antes de emitir SQL

1. Todo `fuente` existe en `fuentes.mjs`.
2. Todo slug es único (gajo, hoja, concepto, misconception, plantilla).
3. Todo `requiere` apunta a un concepto existente y el grafo resultante es acíclico.
4. `sensible: true` ⟹ sin `'kid'` en `age_groups`.
5. Las `age_groups` de una hoja son subconjunto de las de su gajo, y las de un
   concepto no son más amplias que las de la hoja que lo enseña.
6. Toda plantilla apunta a conceptos existentes y declara al menos una variante.
7. Cada uno de los 12 tipos evaluados tiene **≥3 plantillas**.
8. Cada concepto que aparece en alguna hoja tiene **al menos un ítem servible**.
