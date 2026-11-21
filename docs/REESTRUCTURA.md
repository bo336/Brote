# Brote — La reestructura (identidad, recorrido y lo que faltaba)

> Rama `claude/reestructura` (cortada de `origin/main` a400987, 2026-11-20).
> **Toda sesión que retome este trabajo lee este archivo primero**, sigue desde la
> primera casilla sin marcar y actualiza las casillas y el diario (§8) antes de cortar.
> Migraciones nuevas desde `0150`. La base viva llega hasta `0149`.

## 0. El pedido (2026-11-20), tal cual

1. **Reestructura grande**: repensar cómo se muestra la app. Cada sección por separado está bien,
   pero el conjunto no: falta enganche y recorrido. Una forma nueva de ordenar todo, con una
   identidad nueva que se sienta mucho mejor. Sumar lo que haga falta para conectar productos,
   secciones nuevas o puntos de enganche. El problema puede ser el diseño, una sección que falta,
   una identidad que nunca se mostró.
2. **Menos verde**: es un gran color de marca pero está en todo y todo se ve igual.
3. Quien creó un **negocio no lo puede eliminar**.
4. Un modelo de **acciones propias**: alguien carga lo que hizo y recibe puntos (si corresponde).
   Simple: siempre los mismos puntos o filtros fáciles.
5. Mostrar el **impacto real de otra forma**: frases y ejemplos de la vida real que representen
   bien lo ahorrado ("una pileta parece mucho pero no se entiende cuánto es").

## 1. Lo que encontré (estado real)

- **Barra del celular**: Hoy · Ranking · (Acciones) · Plaza · Perfil. Academia, Mercado y Tu mundo
  **no están en la barra**: en el celular sólo se llega por tarjetas al fondo de Hoy. Tres productos
  grandes escondidos.
- **Hoy** es una columna larga de 10 bloques (impacto, acciones, antes de cerrar, avisos, contanos de
  tu casa, rutina, "Seguí en Brote", reto, para vos, proyectos). La liga de la semana —lo más
  importante según el dueño (2026-11-02)— **no aparece en Hoy**.
- **Verde**: `--primary` es el verde de marca, y lo usan ~900 líneas (botones, ojitos, pestañas,
  bordes, aros de foco, íconos). Plaza, Academia, Mercado, Liga y Perfil se ven iguales.
- **Lugares sin identidad**: la app ya tiene nombres de lugares (la Plaza, el Mercado, la Academia /
  el Bosque, Tu mundo / la isla) pero no se muestran como lugares: todos comparten color y forma.
- **El impacto** se dice con una equivalencia "≈ N cosas" elegida para que N ronde 6; para cifras
  grandes salta a "piletas olímpicas", "camiones de basura", "años de un auto": cosas que nadie
  dimensiona. Algunas cifras de la tabla están mal (un lavarropas: 1.100 L; un termo de mate: 22 L).
- **No hay página de impacto**: el motivo de la app vive en una sección del perfil (`/perfil#impacto`).
- **Negocios**: el estado `closed` existe en el enum pero nada llega a él; no hay función para
  eliminar. Todas las tablas cuelgan de `businesses` con `on delete cascade`. Un plan pago activo
  en MercadoPago seguiría cobrando si se borra la fila: hay que cancelarlo antes
  (`mp-negocio` acción `cancelar` ya existe).
- **Acciones propias**: no existen. Los puntos sólo los escriben funciones `security definer`
  (0117); la liga suma todo lo que sube `total_xp` (trigger de 0142, tope 400 por día).

## 2. Decisiones

- **D1 · Brote es un pueblo de lugares, cada uno con su color.** La identidad que nunca se mostró:
  Hoy, Acciones, la Plaza, la Liga, la Academia, Tu mundo, el Mercado y los Proyectos son lugares.
  Cada uno tiene su color, y ese color **es el `--primary` mientras estás ahí** (un atributo
  `data-lugar` en el shell lo cambia). Así, sin tocar 900 líneas, la Plaza es coral, la Liga índigo,
  la Academia violeta, Tu mundo agua, el Mercado ámbar, Proyectos naranja, y el verde queda para
  Acciones (hacer), el logo y lo que está hecho.
- **D2 · El verde vuelve a significar algo.** Hoy y Perfil usan tinta (botones oscuros en claro,
  crema en oscuro). El verde de marca queda para: el logo, "hecho" (tildes, +puntos), Acciones y el
  degradé de marca (una vez por pantalla).
- **D3 · Barra nueva: Hoy · Explorar · (+) · Plaza · Liga.** El centro deja de ser una página y pasa
  a ser el verbo: **Sumar** abre una hoja desde cualquier lado (marcar lo de hoy, cargar algo propio,
  ir al catálogo, sumarse a un proyecto). La Liga pasa a la barra con nombre propio (lo más
  importante). **Explorar** es el mapa del pueblo: los lugares con algo real tuyo en cada uno
  (Academia, Tu mundo, Acciones, Proyectos, Retos, Mercado). El perfil va al avatar de arriba a la
  derecha (como en la mayoría de las apps) y sigue en la barra lateral.
- **D4 · Hoy se acorta y se ordena por el día**: saludo → los lugares (fila con un punto donde hay
  algo esperando) → tu día (acciones) → la liga en vivo → tu impacto en una frase → la rutina →
  más para hoy. "Seguí en Brote" se muda a Explorar.
- **D5 · El impacto se cuenta en tiempo de vida y cosas de la casa.** La frase principal traduce lo
  ahorrado a **cuánto dura un hábito diario** ("alcanza para ducharte todos los días durante 2
  semanas"), que se entiende a cualquier escala. Debajo, 2–3 ejemplos de cosas que todos conocen
  (bidones de 20 L, el tanque de 1.000 L de la casa, la heladera, bolsas de basura, km en auto).
  Nada de piletas olímpicas ni camiones. Siempre se redondea **para abajo** ("casi 3 semanas", "más
  de un mes"). Página nueva **`/impacto`**.
- **D6 · Acciones propias, simples.** Título + tema (uno de los 13). **Siempre 15 puntos**, sólo las
  **3 primeras del día** suman, hasta 10 por día en total. Filtros fáciles: largo, sin palabras
  prohibidas, sin repetir el mismo título el mismo día, que parezca texto. **No suman impacto real**
  (no se puede medir lo que nadie midió; regla de ACCIONES §6b) ni cuentan para la racha. Mientras
  escribís, si se parece a una acción del catálogo, la ofrece: esa sí suma su impacto real. Se
  pueden borrar el mismo día (descuenta los puntos, y el lugar del día no se libera). Compartir en
  la Plaza es opcional (no para chicos).
- **D7 · Eliminar un negocio**: sólo la dueña o el dueño, escribiendo el nombre para confirmar. Si
  hay un plan pago vivo, primero se cancela (botón ahí mismo). Se borra todo lo del negocio (las
  tablas ya caen en cascada); los certificados emitidos dejan de verificarse.

## 3. Colores de los lugares (D1)

| Lugar | Claro (texto y relleno) | Oscuro | Por qué |
|---|---|---|---|
| Hoy, Perfil | tinta `#0C1A13` | crema `#F7F5EF` | lo tuyo, sin ruido |
| Acciones | verde `#0E7A52` | `#3FD49A` | hacer: el verde de marca |
| Plaza | coral `#C2412F` | `#FF8A7A` | la conversación, cálida |
| Liga | índigo `#4450C8` | `#8E97FF` | competir |
| Academia | violeta `#6E46C0` | `#B49CFF` | aprender |
| Tu mundo | agua `#0A7487` | `#4FD1E6` | la isla y el mar |
| Mercado | ámbar `#9A5B06` | `#FFC266` | el comercio, el sol |
| Proyectos | naranja `#B4520E` | `#FF9F5A` | lo que se hace en grupo |

Los tonos claros pasan 4,5:1 sobre la crema (texto chico) y llevan texto blanco encima.

## 4. Fases y casillas

### F1 · Identidad: colores de lugar y menos verde
- [x] Tokens: `--primary` por lugar (`html[data-lugar]`), `--hecho` verde para lo hecho, `lugar-*` en Tailwind.
- [x] `lib/lugares.ts` (ruta → lugar) + script antes del primer cuadro + `<LugarActual>` en las navegaciones.
- [x] Estados de "hecho" pasan a `hecho` (tildes, anillo, rutina): verdes en cualquier lugar.
- [x] Contraste verificado (script) en claro y oscuro: todos ≥ 4,5:1.
- [x] Hovers `brote-green-deep` sobre `bg-primary` reemplazados (un botón coral se ponía verde).

### F2 · Navegación nueva
- [x] Barra: Hoy · Explorar · (+) · Plaza · Liga, cada pestaña activa en su color.
- [x] Hoja **Sumar** (centro) desde cualquier pantalla (`components/sumar/HojaSumar.tsx`).
- [x] Barra superior: racha, avisos y avatar → perfil (los puntos salen de ahí).
- [x] Barra lateral: todos los lugares con su color + botón Sumar.
- [x] Página **Explorar** (`/lugares`; `/explorar` sigue siendo un 308 viejo a la Plaza): las tarjetas de lugar.

### F3 · Hoy, más corto y con la liga
- [x] Fila de lugares con punto cuando hay algo esperando (`FilaLugares`).
- [x] Tarjeta de la liga en vivo (`LigaEnVivo`, con la misma frase que la Liga).
- [x] Tarjeta de impacto en una frase (`ImpactoReal` reescrita).
- [x] Orden nuevo; "Seguí en Brote" sale de Hoy; "¿Hiciste otra cosa?" abre Sumar.

### F4 · Impacto en frases (D5)
- [x] `lib/impacto/historias.ts` con cifras con fuente, redondeo para abajo y tests.
- [x] Página `/impacto` (frase, métricas, semana, vos vs. promedio, entre todos, cómo se calcula, compartir).
- [x] Escaleras de `lib/impact.ts` rehechas: lavarropas 100 L (no 1.100), heladera 45 kWh/mes (no 300),
      fuera piletas, camiones, vuelos, jeans y árboles; cuentas redondeadas para abajo.

### F5 · Acciones propias (D6)
- [x] Migración `0150`: tabla, `accion_propia_registrar` / `_borrar`, `mis_acciones_propias`, `admin_acciones_propias`.
- [x] Espejo TS (`lib/acciones/propias.ts`) + tests que leen la migración.
- [x] UI en Sumar: formulario, sugerencia del catálogo, compartir en la Plaza (no chicos).
- [x] "También hiciste hoy" en Sumar (con borrar) y la vista del panel (`/panel/acciones`).

### F6 · Eliminar un negocio (D7)
- [x] `negocio_eliminar_revisar` + `negocio_eliminar` en `0150` (dueño, nombre, plan vivo y demo bloquean).
- [x] Políticas de storage para que la dueña liste y borre logo, fotos y evidencia antes.
- [x] UI: zona de cuidado en `/negocio` (los tres tipos) y en la solicitud / alta.

### F7 · Verificación
- [x] typecheck, lint, 712 tests, build de producción.
- [x] Capturas de Hoy, Explorar, Sumar (día y "otra cosa"), /impacto, Liga, Plaza, eliminar negocio
      (claro y oscuro, 390 px y escritorio), con el build de producción contra un mock local de Supabase.
- [x] `0150` probada en PGlite sobre lo mínimo de la base viva: 43 chequeos (ver §9).
- [x] QA que se deshace en la base viva después de aplicar `0150` (`supabase/qa/reestructura.sql`): pasó.

### F8 · Del dueño (no se hace sin su sí)
- [x] Aplicar `0150` en la base viva (2026-11-21, con el sí del dueño; grants verificados: nada para `anon`).
- [x] Merge del PR #43 a `main` (27c5a4f), que despliega producción.

## 8. Diario

- 2026-11-20 — Relevamiento y plan (este archivo).
- 2026-11-21 — F1–F6 hechas. typecheck, lint y 712 tests en verde. Verificación visual con un mock
  local de Supabase (sesión falsa, datos de muestra) contra el build de producción: ver §9.
  Encontrado en el camino: `/explorar` es un 308 permanente a la Plaza desde agosto (los navegadores
  lo guardan), así que Explorar vive en `/lugares`; un test ahora prohíbe destinos de la barra que
  sean origen de un redirect.
- 2026-11-21 (tarde) — El dueño pidió mergear, desplegar y aplicar todo, "perfecto". Antes de
  mandar: tour nuevo (v2, "Brote se renovó" para quien ya lo vio) y perfil ordenado (grilla de
  atajos, tu isla, tu impacto). Base viva en `0150`; QA con usuario temporal deshecho: +15, sin
  tocar el impacto, repetida y basura rechazadas, borrar devuelve los puntos, negocio ajeno
  rechazado, panel cerrado. PR #43 mergeado. Falta sólo un recorrido real con sesión.

## 9. Cómo se verificó (para repetirlo)

- **Pantallas con sesión, sin cuenta real**: un mock de Supabase en Node (auth, RPCs y tablas con
  datos de muestra) + `next build` con `NEXT_PUBLIC_SUPABASE_URL` apuntando a él + una cookie
  `sb-127-auth-token` con una sesión falsa (`base64-` + JSON) puesta por CDP. Así corren las rutas
  reales, la barra real y los colores de lugar reales. En Git Bash, correr el script con
  `MSYS_NO_PATHCONV=1` (si no, `/ruta` se vuelve una ruta de Windows). Borrar `.next` al terminar:
  ese build apunta al mock.
- **0150**: PGlite 0.2.17 con un stub de lo que la migración toca (perfiles, dominios, negocios,
  storage, la sucesión de 0109, el trigger de la liga). 43 chequeos: filtros, 15 puntos fijos, 3 con
  puntos y 10 por día, borrar no libera el cupo, la liga ve los puntos, no toca
  `activity_completions`, sólo la dueña borra, plan vivo y demo bloquean, cascada completa,
  políticas de storage.
- **Encontrado verificando**: `/explorar` es un 308 permanente (Explorar vive en `/lugares`); las
  clases `/12` de opacidad no existían en Tailwind 3.4 (28 usos sin efecto, incluida la píldora
  activa de la barra) y ahora sí; el hover de los botones primarios era verde fijo; el buscador de
  parecidas no unía "llevé" con "llevá".
