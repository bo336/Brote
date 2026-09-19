# La Academia — cómo funciona El Bosque

> Para quien tenga que tocar esto sin haberlo escrito. Qué hace cada pieza, por
> qué está así, y dónde están las constantes que vas a querer mover.

---

## 1. El modelo en una pantalla

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

## 2. Las cinco cosas que no se negocian

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

## 3. Cómo se arma una sesión

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

## 4. Cómo se corrige, y cómo decae

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

## 5. El pipeline de generación

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

## 6. Cómo crece el currículum

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

## 7. Las constantes, y dónde están

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

## 8. Qué corre de noche

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

## 9. Mapa de archivos

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

## 10. Cómo verificar que sigue sano

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
