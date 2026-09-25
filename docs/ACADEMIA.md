# La Academia — cómo funciona el Árbol

> Para quien tenga que tocar esto sin haberlo escrito. Qué hace cada pieza, por
> qué está así, dónde están las constantes y cómo se agrega o corrige una
> unidad sin romper nada. El modelo anterior (el Bosque) está al final, en el
> apéndice: sus tablas siguen vivas porque alimentan la cola de `/panel`.

---

## 1. El modelo en una pantalla

```
Árbol ── Rama (14: el tronco + 13 dominios)
           └─ Unidad (81: 3 del tronco + 6 por rama) ── Sesión (567) ── Paso (7.381)
                                                                          ├─ teoría / ejemplo (1.439)
                                                                          └─ ejercicio (5.942)
```

- **Unidad** — un tema con arco propio (por ejemplo, «Tierras secas y
  desertificación»). Tiene 5 lecciones, una práctica y un desafío final:
  7 sesiones. Declara `objetivos`, `fuentes` y qué unidades anteriores `repasa`.
- **Sesión** — una lección escrita: empieza enseñando (tarjetas de teoría y
  ejemplos resueltos) y practica de lo simple a lo complejo. La práctica y el
  desafío no tienen contenido propio fijo: se completan en el momento con
  ejercicios de la unidad (§4).
- **Paso** — una tarjeta. Hay 12 tipos de ejercicio: opción única, selección
  múltiple, verdadero o falso (con razón), ordenar, ranking, cadena causal,
  clasificar, emparejar, completar, número, estimar y detectar el error.
- **Niveles.** Cada rama tiene seis unidades en tres niveles: órdenes 1–2
  (nivel 1, piden la unidad 1 del tronco), 3–4 (nivel 2, piden la 2) y 5–6
  (nivel 3, piden la 3). El árbol usa el nivel para ubicar cada unidad en la
  copa.

Números al cierre (septiembre de 2026): 81 unidades, 567 sesiones, 7.381
pasos, 5.942 ejercicios, unas 440.000 palabras y 350 fuentes citadas. Toda
lección tiene al menos 10 ejercicios de al menos 4 tipos distintos.

## 2. Lo que no se negocia

1. **La respuesta nunca llega al cliente antes de contestar.**
   `ac_pasos.solucion` es inalcanzable por PostgREST; lo que viaja es
   `payload_publico`. El constructor rechaza cualquier payload público que
   traiga la clave, la explicación o el valor (§6).
2. **Fichas opacas y barajadas por entrega.** `ac_barajar_paso` baraja
   opciones, ítems y fichas en cada entrega y `ac_ficha_token` las reetiqueta;
   la permutación queda en `ac_intento_pasos.perm`. Reconocer una respuesta por
   su identificador no sirve.
3. **Cada respuesta se corrige una sola vez**, del lado del servidor, con
   `ac_corregir`. Responder dos veces devuelve `ya_respondida`.
4. **Toda unidad tiene fuentes, y las fuentes no están en la lección.** Se
   consultan en `/legal/fuentes`, enlazada desde el pie legal y desde Ajustes,
   con el aviso de que las eligió y organizó un modelo de IA. Ninguna pantalla
   de sesión muestra fuentes.
5. **La savia limita territorio nuevo, nunca la retención.** Rehacer una
   sesión hecha y repasar son siempre gratis.
6. **Contenido original.** Nada del árbol, de las mecánicas ni del texto copia
   productos existentes. Las cifras vienen de fuentes públicas citadas, y lo
   que es un valor de ejemplo lo dice.

## 3. Qué está abierto: el desbloqueo

Una sola función decide qué está abierto para cada persona:
`ac_estado_unidades(user, grupo_de_edad)` (0111). La usan el mapa, la unidad,
empezar y terminar.

- **Tronco:** la unidad *n* abre cuando la *n − 1* está completa.
- **Rama:** una unidad abre cuando la anterior de la misma rama está completa
  **y** la unidad del tronco que pide (`requiere_tronco`) también. Si falta
  algo, el campo `falta` lo dice (por ejemplo, `tronco:Del saber al hacer`).
- **Sesión:** la primera de una unidad abierta está disponible y cada una abre
  la siguiente. Rehacer siempre se puede.
- **Unidad completa:** cuando todas sus sesiones están hechas. Como el desafío
  es la última, en la práctica es «aprobar el desafío». Queda registrado en
  `ac_user_unidad`, y eso es lo que hace crecer la rama en el árbol.

## 4. Cómo se arma una sesión

`academia_empezar(leccion_id)` llama a `ac_componer`, que es SQL puro:

1. **Los pasos escritos**, en orden. Si una posición tiene variantes (los
   cálculos se escriben con 3 o 4 juegos de números), sale una al azar.
2. **Relleno adaptativo.** La práctica suma 12 ejercicios de toda la unidad y
   el desafío 6, eligiendo primero lo que salió mal la última vez, después lo
   más débil (y, en el desafío, lo más difícil).
3. **Repaso espaciado intercalado.** Una lección suma 3 pasos de repaso, la
   práctica 2, el desafío 3 y el repaso libre 12. Nunca algo visto en las
   últimas 12 horas. La prioridad es la fuerza de memoria (maestría ×
   retrievability, lo más olvidado primero), con bonificaciones para las
   unidades que la unidad actual declara en `repasa` (−0,35), para la misma
   rama (−0,15) y para lo que salió mal (−0,2), más un poco de azar.
4. Cobra la savia al empezar (si es territorio nuevo), baraja y devuelve. La
   savia se devuelve sola si la sesión no tiene nada para corregir o si la
   persona sale en los primeros 90 segundos sin haber respondido nada
   (`academia_salir`): un mal toque no cuesta una sesión.

## 5. Cómo se corrige y cómo se aprueba

- `academia_responder(intento_paso, respuesta)` corrige con `ac_corregir` según
  el tipo. Todos dan crédito parcial menos opción única y número: los
  ordenamientos se miden con la distancia de Kendall, y un verdadero o falso
  con el valor bien y la razón mal vale medio.
- **Números:** la tolerancia la escribe el currículum. Por defecto `num()` usa
  el 2 % del valor o media unidad del último decimal pedido, lo que sea mayor
  (si faltara, el corrector usa el 1 %). Un resultado corrido una potencia de
  diez recibe una nota específica: el razonamiento va bien y el error está en
  las unidades.
- **Estimar:** en banda lineal, hasta ±15 % vale entero y hasta ±40 % vale
  medio. En banda logarítmica se mide el cociente: hasta 1,5 veces vale entero
  y hasta 3 veces vale medio.
- Un ejercicio que sale mal se vuelve a poner una vez al final de la sesión,
  hasta 6 por sesión. `academia_terminar` rechaza una sesión con pasos sin
  responder (`incompleta`).
- `academia_terminar` calcula el puntaje sobre la **primera vuelta**, con
  crédito parcial: los reencolados sirven para aprender, no para subir la nota.
  Se aprueba con 60 en lecciones y prácticas, y con 75 en el desafío
  (`app_settings`).
- La memoria de cada grupo de pasos vive en `ac_user_memoria` y alimenta el
  repaso y el aviso nocturno (0112).

## 6. El currículum es código

Todo el contenido vive en `scripts/academia-arbol/`:

| Archivo | Qué es |
|---|---|
| `dsl.mjs` | El lenguaje para escribir unidades: `unidad`, `leccion`, `practica`, `desafio`, `teoria`, `ejemplo` y un constructor por tipo de ejercicio (`op`, `mult`, `vf`, `ord`, `rank`, `cad`, `clas`, `par`, `comp`, `num`, `numv`, `est`, `det`), más `barras` y `tabla` para datos. |
| `contenido/*.mjs` | Una unidad por archivo (`energia-5.mjs`, `tronco-2.mjs`…). |
| `fuentes.mjs` | Las fuentes nuevas (se suman a las de `scripts/academia/fuentes.mjs`). |
| `ramas.mjs` | Nombres y bajadas de las ramas. |
| `construir.mjs` | Valida todo y genera `supabase/seed/academia-arbol/*.sql` y `lib/academia/fuentes-academia.ts`. |
| `verificar-fuentes.mjs` | Comprueba que cada link responda. |

### Lo que el constructor rechaza (`node scripts/academia-arbol/construir.mjs --check`)

- Unidades sin fuentes, con fuentes desconocidas, con menos de tres objetivos,
  con menos de 5 o más de 10 sesiones, o sin un único desafío al final.
- Lecciones que no empiezan con teoría, con menos de dos tarjetas de teoría o
  ejemplo, con **menos de 10 ejercicios**, con menos de 4 tipos distintos, o
  que terminan en teoría. Desafíos con menos de 6 ejercicios propios.
- Teoría de menos de 120 caracteres, explicaciones de menos de 40, contextos
  de cálculo de menos de 20, tuteo, marcadores sueltos.
- Por tipo: opción única con 3 a 5 opciones; múltiple con 4 a 7 y no todas
  correctas; clasificar con 2 a 4 grupos y 4 a 10 fichas; emparejar con 3 a 6
  pares sin repetir el lado derecho; completar con al menos dos distractores y
  un banco sin palabras repetidas; estimar con el valor dentro del rango;
  detectar con algo marcable y algo que no.
- Cualquier payload público que filtre la solución.
- Dos ejercicios idénticos en todo el currículum (incluidas dos variantes de un
  cálculo que salieron con los mismos números).

Además informa cuántas consignas se repiten con otro contenido (hoy 192, todas
del estilo «Uní cada concepto con su definición.», que es normal) y en cuántas
preguntas de opción única la correcta es claramente la más larga (más de 1,25
veces el distractor más largo), porque eso es una pista. Hoy es 0 de 584; si
pasa del 30 % avisa.

### Cómo escribir o corregir una unidad

1. Editá o creá `contenido/<rama>-<n>.mjs`. Toda cifra lleva su fuente en
   `fuentes` de la unidad (y, si es nueva, en `fuentes.mjs`). Los valores
   inventados para practicar una cuenta se aclaran como «valores de ejemplo».
2. `node scripts/academia-arbol/construir.mjs --check` hasta que diga «Sin
   errores».
3. `node scripts/academia-arbol/verificar-fuentes.mjs --solo-nuevas` si sumaste
   fuentes (403 de revistas y organismos = bloquean robots, se miran a mano).
4. `node scripts/academia-arbol/construir.mjs` para regenerar semillas y
   `lib/academia/fuentes-academia.ts`. Commit y push.
5. Cargá las semillas (§7) y corré la verificación (§8).

## 7. Cómo se carga a la base

Las semillas son idempotentes: cargar dos veces deja lo mismo. `00-base.sql`
carga fuentes y ramas, `01..14` cada rama y `99-cierre.sql` retira (no borra)
las unidades que ya no están en el currículum; va siempre último.

Como los archivos pesan varios cientos de KB, se cargan desde la base misma con
`pg_net`, apuntando al commit exacto:

```sql
select f, net.http_get('https://raw.githubusercontent.com/bo336/Brote/<SHA>/supabase/seed/academia-arbol/' || f,
                       timeout_milliseconds => 60000)
from unnest(array['00-base.sql', '01-tronco.sql', /* … */ '99-cierre.sql']) f;
-- después: comparar md5(content) de net._http_response con el md5 local de cada archivo,
-- y ejecutar en orden dentro de un DO que vuelve a chequear el md5 antes de cada `execute`.
```

Las migraciones 0110, 0111 y 0112 se aplicaron así, sin fila en
`supabase_migrations.schema_migrations`. Un `db push` las vería como
pendientes: son idempotentes (`create … if not exists`, `create or replace`),
pero conviene registrarlas antes de usar la CLI.

## 8. Cómo verificar que sigue sano

- **`supabase/qa/academia-arbol.sql`**, bloque 1: una persona de prueba juega
  la unidad 1 del tronco entera contra los RPC (mapa, bloqueo, empezar,
  responder bien y mal, reencolado, terminar, savia y reembolso, práctica,
  desafío, apertura de ramas, repaso, retomar). Termina en
  `raise exception 'QA_RESULT …'`, así que todo se deshace. Bloque 2: por
  PostgREST, nadie lee pasos, soluciones, intentos ni ejecuta el corrector o el
  cargador (todo `denegado`).
- **`supabase/qa/academia-arbol-correccion.sql`** — corrección de todo el
  currículum, de solo lectura. Baraja cada ejercicio aprobado como en una
  entrega real, le pasa la respuesta correcta a `ac_corregir` y después una
  equivocada (otra opción, el valor opuesto, el orden invertido, un número
  lejano, marcas vacías). Al cierre: 5.942 de 5.942 correctas aceptadas y 0
  equivocadas aceptadas.
- **Desbloqueo por nivel.** Con las unidades 1–4 de una rama y los troncos 1–2
  completos, la unidad 5 dice `falta: tronco:Del saber al hacer`; al completar
  el tronco 3 se abre, y la 6 sigue cerrada hasta completar la 5.

## 9. Las constantes, y dónde están

En `app_settings` (se cambian desde `/panel`, sin deploy):

| Clave | Por defecto | Qué hace |
|---|---|---|
| `academia_enabled` | `true` | Apaga toda la Academia (la pantalla muestra «en pausa»). |
| `academia_savia_libre` | 5 | Sesiones nuevas por día sin costo. |
| `academia_semillas_dia` | 15 | Tope diario de semillas. |
| `academia_umbral_leccion` | 60 | Puntaje para aprobar lecciones y prácticas. |
| `academia_umbral_desafio` | 75 | Puntaje para aprobar el desafío. |

En SQL (0111): en `ac_componer`, 12 y 6 pasos de relleno para práctica y
desafío, 3/2/3/12 pasos de repaso, 12 horas mínimas antes de repasar algo y
los pesos de prioridad del repaso; en `academia_responder`, el tope de 6
reencolados; en `academia_salir`, los 90 segundos del reembolso; en
`ac_corregir` (0110), las bandas de estimar.

## 10. Mapa de archivos

| Dónde | Qué |
|---|---|
| `supabase/migrations/0110_academia_arbol.sql` | Esquema del Árbol, corrector y cargador. |
| `supabase/migrations/0111_academia_arbol_motor.sql` | Desbloqueo, compositor y los RPC `academia_*`. |
| `supabase/migrations/0112_academia_arbol_aviso.sql` | El aviso nocturno de repaso con la memoria nueva. |
| `supabase/seed/academia-arbol/` | Semillas generadas (no se editan a mano). |
| `supabase/qa/academia-arbol.sql` | QA de punta a punta y de aislamiento. |
| `supabase/qa/academia-arbol-correccion.sql` | La corrección de todo el currículum. |
| `app/(app)/aprender/page.tsx` | El árbol. |
| `app/(app)/aprender/[rama]/page.tsx` | Una rama con sus unidades. |
| `app/(app)/aprender/u/[unidad]/page.tsx` | Una unidad por dentro. |
| `app/(app)/aprender/sesion/[id]/page.tsx` | El jugador de sesiones. |
| `app/(app)/aprender/repaso/page.tsx` | El repaso libre. |
| `app/legal/fuentes/page.tsx` | Las fuentes, con el aviso de IA. |
| `components/academia/Arbol.tsx` + `lib/academia/geometria.ts` | El árbol de copa ancha: ramas con color, unidades como cápsulas, candados y crecimiento. |
| `components/academia/Jugador.tsx`, `pasos/*` | El jugador y un componente por familia de ejercicio. |
| `lib/api/academia.ts`, `lib/academia/modelo.ts`, `lib/academia/validar.ts` | Cliente de los RPC, tipos y validación de respuestas. |
| `scripts/academia-arbol/` | El currículum como código (§6). |

---

# Apéndice — El modelo anterior (el Bosque)

> Ya no es lo que ve una persona en `/aprender`: lo reemplazó el Árbol. Sus
> tablas y su pipeline siguen corriendo porque tienen historial y alimentan la
> cola de revisión de `/panel`. Lo que sigue es la documentación original,
> sin cambios.

## Bosque · 1. El modelo en una pantalla

```
tronco ─┬─ rama (14: el tronco + 13 dominios)
        └─ gajo (105) ── hoja (360) ── concepto (491)
                                          │
                                   plantilla (2.570)
                                          │
                                      ítem (5.638)
```

- **Concepto** — una afirmación verificable con su fuente. Es la unidad de
  conocimiento: todo lo demás existe para enseñar o medir conceptos.
- **Hoja** — una sesión. **No tiene contenido propio**: nombra conceptos, y la
  sesión se compone en el momento en que alguien la abre.
- **Plantilla** — la forma de un ejercicio, con huecos. Un ítem es una plantilla
  con los huecos llenos y una semilla.
- **Anillo** — cuán profundo se llegó. Los anillos crecen hacia afuera y el
  árbol gana uno cuando todos los gajos alcanzables del actual están frondosos.

Las **13 ramas son identidad de producto**, no contenido. Nada —ni una persona
apurada, ni el pipeline— puede crear una rama nueva; está impedido en SQL.

## Bosque · 2. Las cinco cosas que no se negocian

1. **La respuesta nunca llega al cliente.** `payload_publico` no contiene la
   clave, ni el índice, ni la explicación, ni la fuente. Todo eso vuelve recién
   en `academia_answer`, después de contestar. `lib/academia/schemas.ts` tiene
   `sinRespuesta()`, que recorre el payload rechazando cualquier campo de
   solución: es la regla escrita como código en vez de como comentario.
2. **Los tokens son opacos y por entrega.** Las opciones se rebautizan `t1..tn`
   en orden barajado en cada entrega (`ac_barajar`), y `ac_entregas.perm` guarda
   la permutación. Quien ya vio el ejercicio no puede reconocer la respuesta por
   el identificador.
3. **Cada afirmación tiene su fuente.** Sin excepción, y en el contenido
   generado se verifica con una comparación de strings (§5).
4. **Edad, del lado del servidor.** `sensible: true` ⟹ nunca `kid`, filtrado en
   SQL. Ningún ítem apto para chicos se aprueba sin que una persona lo lea.
5. **La savia limita territorio nuevo, nunca la retención.** Regar es gratis y
   va a seguir siendo gratis.

## Bosque · 3. Cómo se arma una sesión

`academia_start_session(hoja_id)` — SQL puro, sin red, sin modelo:

1. Cobra la savia **al empezar**. Si se cobrara al final, abandonar sería gratis
   y el límite no existiría.
2. Elige conceptos: 50 % repaso (retrievability < 0,90), 30 % débiles
   (maestría entre 0,3 y 0,7), 20 % nuevos.
3. Por concepto elige un ítem con `ac_elegir_item`: apunta a
   `b* = θ − ln(P*/(1−P*))`, ordena por `−|b − b*|`, toma los **ocho mejores** y
   sortea entre ellos (control de exposición *randomesque*).
4. Baraja, reetiqueta, escribe `ac_entregas` y devuelve 7 a 12 pasos.

Interleaving obligatorio: nunca dos seguidos de la misma plantilla, nunca más de
dos del mismo concepto.

## Bosque · 4. Cómo se corrige, y cómo decae

`academia_answer(entrega_id, respuesta)` — de un solo uso. Reintentar la misma
entrega devuelve `ya_respondida`, no una segunda corrección.

```
maestría:   mastery_ema ← mastery_ema + α·(correcto − mastery_ema)      α = 0,30
olvido:     half_life   ← clamp(half_life × (correcto ? 2,2 : 0,45), 0,25, 365)
al leer:    R = 2^(−días_desde_last_seen / half_life)
            fuerza = mastery_ema × R
```

**El decaimiento no tiene job.** `fuerza` se calcula al leer, así que un gajo se
marchita solo con que pase el tiempo: nadie escribe una fila. Medido: un gajo con
maestría 0,95 y `half_life` 30 pasa de **frondoso (95 %)** a **marchito (34 %)**
en 45 días sin tocarlo.

Elo con piso de adivinanza: `P = g + (1−g)·σ(θ−b)` con `g = 1/k` si hay k ≥ 2
opciones y `g = 0` en los tipos abiertos. **Desviación documentada del spec**,
que escribe `k = 1` para los abiertos — con eso `P = 1` siempre y acertar
*bajaría* theta.

Un error se **re-encola una vez** al final de la sesión, en el bloque de órdenes
100+. El cliente pide esos pasos con `academia_pendientes`, que también es lo que
permite recargar la página en medio de una sesión sin perder la savia.

## Bosque · 5. El pipeline de generación

**Ninguna llamada a un modelo ocurre en el camino de pedido.** Nunca.

```
piso de pool → lote a Gemini → compuertas → revisión → aprobado → el pool
                                                                     ↓
                              academia_start_session (SQL puro, sin red)
```

Se genera **contra la demanda**: `academia_pool_hambriento()` busca los
`(concepto, tipo)` con menos de 40 ítems aprobados y los ordena por cuánta gente
está a dos saltos de prerrequisito. Generar contra un cronograma fabrica
contenido que nadie ve.

### Las ocho compuertas, y dónde vive cada una

| # | Compuerta | Dónde | Por qué ahí |
|---|---|---|---|
| 1 | Esquema JSON | Gemini | `responseSchema`, plano |
| 2 | Zod | edge function | necesita la semántica del tipo |
| 3 | Determinísticas | edge function | ídem; gratis y atajan la mayoría |
| 4 | **Grounding** | **Postgres** | `ac_fuentes.contenido` está acá, y ningún deploy la puede saltear |
| 5 | Deduplicado | **Postgres** | pgvector está acá |
| 6 | Juez | edge function | otra llamada, otro prompt |
| 7 | **Cola humana** | **Postgres** | el ruteo obligatorio es regla de negocio |
| 8 | Cribado en vivo | Postgres, de noche | es la única que ve usuarios reales |

**La compuerta 4 es la que importa.** Cada `cita` tiene que ser subcadena
**literal** del `contenido` de la fuente que declara. Una comparación de strings,
gratis, y mata las citas inventadas de raíz. No se "arregla" una cita que falla:
se rechaza el ítem entero. Medido contra la base viva: cita real → pasa; cita
inventada → `cita_no_literal`; una real y una inventada → rechazado; sin
afirmaciones → rechazado.

**Ruteo obligatorio a revisión humana**, sin excepciones: lo que el juez marcó,
un 5 % de auditoría al azar, todo lo que toca un concepto `sensible`, **todo lo
apto `kid`**, y **todas** las propuestas de currículum. `academia_ingerir_item`
es el único camino a `aprobado`, y no hay forma de llegar ahí sin pasar por él.

### Idempotencia y reintentos

```
idempotency_key = sha256(model || prompt_version || concepto || tipo || params || seed)
```

Único-indexada. Re-correr un lote a ciegas es un no-op — medido: la primera
corrida encoló 1, la segunda encoló 0.

Escalera de reintentos, **tope 2**: violación de esquema → prompt de reparación →
regeneración completa a +0,2 de temperatura → carta muerta con la respuesta
cruda guardada. Un tercer intento no sale nunca y solo quema presupuesto.

### Presupuesto

`ac_generacion_presupuesto`, una fila por mes, consultada **antes** de enviar.
Cuando el tope se alcanza la generación **para y lo registra**: no baja una
compuerta, no acorta el prompt, no cambia de modelo.

## Bosque · 6. Cómo crece el currículum

Al cerrar un anillo, si quedan menos de 3 gajos en el siguiente de su rama más
fuerte, se encola una propuesta: 3 gajos, 4–6 conceptos cada uno, prerrequisitos
**solo** de slugs que ya existan.

Las barandas están **en SQL**, no en el prompt (`academia_validar_propuesta`).
Un prompt puede pedir por favor; una restricción se cumple. Medido: rama que no
existe → rechazada; anillo 99 con techo 6 → rechazado; prerrequisito fantasma →
rechazado; propuesta válida → sin problemas.

Todo nace `status = 'propuesto'` y es invisible. `academia_arbol` y
`academia_start_session` filtran por `aprobado` desde la fase 1, así que esto no
necesitó ningún filtro nuevo: necesitó **no tocar** el que ya existía.

## Bosque · 7. Las constantes, y dónde están

### En `app_settings` — se cambian desde `/panel`, sin deploy

| clave | valor | qué hace |
|---|---|---|
| `academia_enabled` | `true` | apaga la sección entera; `/aprender` muestra una pausa |
| `academia_generacion_enabled` | `false` | apaga el pipeline |
| `academia_savia_libre` | `5` | hojas nuevas por día sin Brote+ |
| `academia_semillas_dia` | `15` | tope diario de semillas |
| `academia_pool_piso` | `40` | ítems mínimos por (concepto, tipo) |
| `academia_anillo_techo` | `6` | anillo máximo que puede proponerse |
| `academia_presupuesto_centavos` | `2000` | tope mensual de generación (US$ 20) |
| `academia_dedupe_umbral` | `0.93` | similitud coseno que marca repetido |

`/panel` dibuja **cualquier** `app_settings` booleano o numérico, así que agregar
un interruptor no requiere tocar la pantalla.

### En SQL, dentro de las funciones

| constante | valor | dónde |
|---|---|---|
| `α` de la maestría | `0.30` | `academia_answer` |
| factores de `half_life` | `×2.2` / `×0.45` | `academia_answer` |
| `P*` (acierto objetivo) | `0.82` | `ac_elegir_item` |
| ventana randomesque | top **8** | `ac_elegir_item` |
| umbral de frondoso | maestría `≥ 0.85` | `academia_arbol`, `academia_cerrar_anillo` |
| umbral de marchito | fuerza `< 0.6` | `academia_arbol` |
| exclusión por persona | 14 días | `ac_elegir_item` |
| encogimiento de dificultad | `n/(n+100)` | `academia_dificultad_encogida` |
| cribado: mínimo de entregas | 50 | `academia_cribado_psicometrico` |
| cribado: bandas | `p<0.15`, `p>0.95`, `disc<0.10` | ídem |
| auditoría al azar | 5 % | `academia_ingerir_item` |

### En el cliente

| constante | valor | dónde |
|---|---|---|
| geometría del árbol | ancho 1000, paso 178 | `lib/academia/bosque.ts` |
| zoom | 0,65 a 2,6 | `components/academia/ArbolBosque.tsx` |
| apariciones de Pip | **3** por sesión | `components/academia/Jugador.tsx` |
| versión del prompt | `v1.0.0` | `supabase/functions/academia-generate/prompts/registro.ts` |

## Bosque · 8. Qué corre de noche

`daily_maintenance()` a las 00:05 de Buenos Aires (pg_cron
`brote-daily-maintenance`) llama a `academia_mantenimiento_diario()`, que hace:

1. **Cribado psicométrico** — retira (nunca borra) los ítems que dejaron de
   informar.
2. **Censo de pools flacos** — para que el pipeline sepa qué pedir.
3. **Un aviso de riego, como máximo uno**, y solo a quien tiene 3 o más
   conceptos apagándose, respeta `notification_prefs` y no recibió el empujón de
   racha en las últimas 20 horas. Nunca los dos, nunca un tercero.

El enganche es un parche de una línea sobre el cuerpo que haya
(`0084_academia_daily_hook.sql`), no una copia: `daily_maintenance` es de otro
linaje y pegar una copia acá fijaría la versión de hoy.

## Bosque · 9. Mapa de archivos

```
supabase/migrations/
  0077 esquema · 0078 motor · 0079 sembrador
  0080 experiencia (fase 2) · 0081 esquema del pipeline · 0082 motor infinito
  0083 panel · 0084 enganche nocturno · 0085 tipo de aviso
  0086 pgvector en el search_path · 0087 text[] || literal · 0088 anillos
  0089 legado deprecado
supabase/functions/academia-generate/
  index.ts        plan · submit · poll · propose · estado
  compuertas.ts   Zod + determinísticas (compuertas 2 y 3)
  prompts/registro.ts   el registro versionado
lib/academia/
  types.ts  schemas.ts  bosque.ts  sesion-store.ts
lib/api/academia.ts, lib/api/academia-admin.ts
components/academia/          el bosque, el jugador, los resultados
components/academia/ejercicios/  los 14 renderers
components/panel/ColaAcademia.tsx, MetricasAcademia.tsx
scripts/academia/             el contenido de la semilla
scripts/check-academia-parity.mjs   repo ↔ base viva, md5 por función
```

## Bosque · 10. Cómo verificar que sigue sano

```bash
node scripts/check-academia-parity.mjs
```

Imprime el md5 del cuerpo de cada función tal como está en las migraciones.
Comparalo contra la base:

```sql
select proname, md5(prosrc) from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and (proname like 'ac\_%' or proname like 'academia\_%')
 order by proname;
```

Tienen que coincidir las 45. Si una no coincide, alguien aplicó algo sin
commitearlo (o al revés) y eso es un bug, no un detalle.

El resto de la salud está en `/panel`: cola de revisión, acierto de primera
vuelta (banda objetivo **0,78–0,86**), tasa de toques del gancho, pools bajo el
piso y gasto del mes.
