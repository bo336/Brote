# ACCIONES v2 — el corazón de Brote

> Rama `claude/acciones-v2` (sale de `main` en `c78e42e`). Este archivo es el
> plan **y** el diario: cualquier sesión que toque acciones, el set del día, la
> rutina, el catálogo o `complete_activity` lo lee primero.

El pedido (2026-10-06): las acciones son lo que hace que alguien empiece a usar
Brote, y no están al nivel. Muchas no funcionan como deberían, son demasiado
simples o imposibles en un día normal. Hacen falta acciones que **cualquiera**
pueda hacer (según su categoría), muy variadas, fáciles, **bien dirigidas**,
inspiradas en listas de instituciones y en la vida real de la Argentina entera
(no sólo CABA), cada una con su descripción; mecánicas nuevas que las hagan
distintas; y un algoritmo que las reparta bien, con reglas claras.

---

## 1 · Auditoría (lo que había el 2026-10-06, medido en la base viva)

**Contenido — 460 acciones activas** (178 `daily`, 282 `catalog`) + 15 inactivas.

- **Duplicados.** ~60 pares casi idénticos, escritos en pasadas distintas:
  "Descongelá en la heladera" ×2, "Tapá la pileta" ×2, "Reportá una pérdida" ×2,
  tres formas de "revisá el medidor", "Cociná con tapa" ×3, "No abras el horno" ×2,
  "Hornalla del tamaño de la olla" ×2, "Luz natural" ×3, "Descongelá el freezer" ×2,
  "Presión de neumáticos" ×2, "Vaciá el baúl" ×2, "Mantené la bici" ×2,
  "Lavarropas lleno" ×3 (repartido entre Agua y Energía), "Aplastá envases" ×2,
  "Rechazá el ticket" ×2, "Wifi en vez de datos" ×2, "Desuscribite" ×3…
- **Títulos que no son lo que dice el slug.** Cuando se sacó el encuadre
  anti-carne (F1.2) se reescribieron los títulos pero no los números:
  `come-una-comida-sin-carne-hoy` hoy dice "Cociná con productos de estación"
  y sigue sumando 1,8 kg de CO₂ y 600 L como si fuera una comida sin carne;
  `pasa-una-semana-100-a-base-de-plantas` ("Semana de compra local") suma
  22 kg. Y quedó viva `agua-menos-carne-hoy` ("Pasá un día sin carne vacuna"),
  justo lo que el dueño pidió sacar.
- **Mal archivadas.** "Día sin carne" y "Comprá una prenda usada" en Agua;
  "Tomá agua de la canilla" en Alimentación y en Residuos; caminar en Aire.
- **Imposibles o caras para un día normal.** Paneles solares (3.000 pts),
  bomba de calor (3.000), auto eléctrico (3.000), termostato inteligente,
  "tarifa de energía renovable" (que en la Argentina casi no existe para una
  casa), inodoro nuevo, sistema de lluvia, cambiar un electrodoméstico.
  Una de esas valía lo que 60 acciones del día.
- **Ajenas a la Argentina.** Protector "amigable con arrecifes", lavavajillas
  (lo tiene una minoría), secarropas como si fuera lo normal, compost "sin turba".
- **Sin descripción.** `description_es` vacío en las 460: el detalle mostraba
  "Título. Suma un impacto concreto y sostenido." para todas.
- **Puntos arbitrarios.** El seed original pagaba 300–3.000 por acciones de
  catálogo y las pasadas nuevas 60–450 por cosas equivalentes: "Instalá un
  cabezal" 750 y "Poné aireadores" 150.
- **Impacto inflado o incoherente.** "Arreglá una canilla" 20.000 L de una
  vez; "Llevá pilas a un punto limpio" 5.000 L de agua; "Compostera de balcón"
  50 kg de residuos en un solo toque. Y como el impacto se calcula uniendo con
  `activities` al leer, cualquier corrección cambia el pasado de todos.
- **Una acción del juego en el set real.** `cuida-tu-mundo` ("Regá tu mundo")
  es una acción `daily` activa: podía ocupar uno de los cinco lugares del día.
- **Sin contexto.** "Manejá suave" a quien no tiene auto, "Usá el lavavajillas
  solo lleno" a quien no tiene, "Bajá la calefacción" en enero, "Tapá la
  pileta" en julio, "Llevá a los chicos caminando" a quien no tiene chicos.

**Algoritmo (`ensure_daily_set`).**

- No sabe nada del contexto (las respuestas del onboarding —balcón, jardín,
  auto, bici, mascota— sólo las usaba el carril del catálogo, buscando
  palabras en el slug), ni de la estación, ni del día de la semana, ni de la
  región, ni de lo que la persona hace o deja de hacer.
- **No reparte.** Toma hasta 4 candidatas por tema y elige 3 fáciles + 2,
  ordenando por "es de tus intereses" antes que por variedad: con un solo
  interés, el día puede ser 4 acciones de Agua.
- No hay forma de decir "esta no me sirve": el set queda fijo todo el día.
- "Más acciones" en Inicio salía de `fetchDailyPool()`: **sin filtro de
  edad** (un chico veía "Manejá suave" y al tocarla el servidor la rechazaba)
  y ordenada por `sort_order`, así que eran **las mismas 6 todos los días**.
- La Academia, la Plaza (`feed_ladder`) y la sugerencia de la Academia eligen
  acciones cada una con su propia regla (`order by random()`), sin contexto.
- La rutina sugiere por `base_points desc`, o sea por el número más arbitrario.
- La capa de IA (`recommend-activities`) está dormida: 0 recomendaciones
  guardadas.

## 2 · Principios

1. **Cualquiera puede hacerla hoy.** Gratis o te ahorra plata, sin comprar
   nada, en minutos. Lo que requiere algo (auto, bici, jardín, perro, pileta,
   gas, aire acondicionado, leña, parrilla…) lo dice y **sólo se ofrece a quien
   lo tiene**. Si no sabemos, no suponemos.
2. **Argentina entera.** Mate, pava y termo; calefón y piloto; garrafa; asado;
   colectivo y SUBE; feria y verdulería; sodería y retornables; recuperadores
   urbanos; tapitas y papel para el Garrahan; ProHuerta del INTA; acequias en
   Cuyo; leña en la Patagonia; quema en el campo; dengue en verano; Pelopincho.
3. **Cada una explica qué, cómo y por qué**, con un número real y su fuente
   cuando la hay (ENARGAS, Guía de Ahorro de Energía del GCBA, AySA, FAO,
   Secretaría de Energía, Ministerio de Salud, ArgentiNat…).
4. **Puntos por regla, no a ojo.** Esfuerzo × impacto, una tabla.
5. **Impacto real, nunca inflado** (§6b). Lo que sumó una acción se guarda en
   la fila de la acción hecha, con la cantidad si es medible. Cuando un
   número estaba mal, se corrige también para atrás: no se sostiene una cifra
   inflada sólo porque ya se mostró.
6. **Nada de encuadre anti-carne** (decisión del dueño, F1.2): comida de
   estación, legumbres, aprovechamiento, desperdicio cero.
7. **Sólo lo que cuida algo de verdad.** Nada que sea del juego ("Regá tu
   mundo"), de hacer crecer la app ("Invitá a alguien a Brote") o un mito
   digital sin efecto medible (borrar fotos de la nube, modo oscuro,
   desuscribirse de mails).
8. **El Mercado, sólo donde hace falta un producto** (§6c), y nunca en el
   set del día ni al completar.

## 3 · El modelo nuevo de una acción

Columnas nuevas en `activities` (todas con valor por omisión, nada se rompe):

| columna | qué es |
|---|---|
| `description_es` | (existía, vacía) qué es y por qué importa, 1–3 frases con un número |
| `instructions_es` | pasos, uno por línea |
| `formato` | `gesto` · `tarea` · `salida` · `social` · `observar` · `aprender` · `reto` |
| `minutos` | cuánto lleva de verdad (2, 5, 15, 30, 60…) |
| `costo` | `gratis` · `bajo` (algo chico, un burlete) |
| `ahorra` | te ahorra plata (luz, gas, agua, compras) |
| `requiere` | claves de contexto que hacen falta (`auto`, `bici`, `jardin`…) |
| `lugar` | `casa` · `calle` · `compras` · `trabajo` · `escuela` · `naturaleza` · `celular` |
| `estaciones` | vacío = todo el año; si no, `verano`/`otono`/`invierno`/`primavera` |
| `dias` | `null` · `habil` · `finde` |
| `regiones` | vacío = todo el país; si no, `amba`/`centro`/`cuyo`/`noa`/`nea`/`patagonia` |
| `con_adulto` | para cuentas de chicos: se hace con un adulto |
| `medida` | acciones medibles: pregunta, unidad, rango y factor de impacto por unidad |
| `fuente` / `fuente_url` | de dónde sale el número |
| `camino_slug` / `camino_paso` | en qué camino está y en qué paso |
| `tags` | palabras para buscar (mate, asado, sube, pelopincho…) |

**Contexto de la persona** (`profiles.context`, editable en Ajustes → "Tu casa
y tu día", y en el onboarding): `balcon`, `jardin`, `pileta`, `edificio`,
`auto`, `bici`, `gas`, `aire`, `secarropas`, `lena`, `parrilla`, `perro`,
`gato`, `chicos`, `trabajo`, `estudio`, `campo`, `costa`. `true` = lo tiene;
`false` o ausente = no se le ofrece lo que lo requiere.

**Región** sale de la provincia (`profiles.city`, F15.4): AMBA, Centro, Cuyo,
NOA, NEA, Patagonia.

## 4 · Mecánicas nuevas

1. **Cambiar** una acción del día (hasta 3 por día), diciendo por qué:
   - *Hoy no puedo* → se reemplaza, vuelve otro día.
   - *No aplica a mí* → no vuelve más; si la acción pedía algo ("No tengo
     auto"), se anota en tu contexto y se van todas las de auto.
   - *Ya lo hago siempre* → se reemplaza, y si se puede, te ofrece sumarla a tu
     rutina (donde cuenta igual, con su racha).
   - *No me interesa* → no vuelve más (se puede deshacer en Ajustes).
   Todo queda en `acciones_feedback` y alimenta el algoritmo y el panel.
2. **Acciones medibles.** "¿Cuántas cuadras caminaste?", "¿Cuántas prendas
   donaste?", "¿Cuántos baldes reusaste?": el impacto se calcula con lo que
   hiciste (con tope), no con un promedio. Los puntos no cambian (no se puede
   inflar el puntaje inflando la cantidad).
3. **Caminos.** Recorridos de 4–6 acciones que van de lo más fácil a lo más
   comprometido ("Cocina sin desperdicio", "Compost en casa", "Casa sin consumo
   fantasma", "Ojos de naturalista"…). La acción dice "Paso 2 de 5"; terminar
   un camino da un premio y una notificación.
4. **De temporada y efemérides.** El día sabe en qué estación está (hemisferio
   sur) y qué se celebra: Día del Agua, de la Tierra, del Reciclaje, del Medio
   Ambiente, de la Pachamama, del Árbol (29/8), de la Conciencia Ambiental
   (27/9), de la Yerba Mate (30/11)… y empuja las acciones de ese tema, con el
   motivo a la vista.
5. **El porqué a la vista.** Cada acción del día dice por qué está ahí:
   "Nueva para vos", "De temporada", "Hoy es el Día del Árbol", "Porque tenés
   bici", "Te interesa Agua".

## 5 · Las reglas del día (el algoritmo)

**Elegibles** (si una no pasa, no entra; la misma función la usan el set, "Más
acciones", Para vos, la rutina, la Plaza y la Academia):
activa · tipo `daily` (para el set) · edad · rango · todo lo que `requiere`
está en tu contexto · estación · región · día hábil/finde · no la descartaste ·
no la hiciste hoy (y en el catálogo, su enfriamiento) · no está en tu rutina.

**Puntaje** (más alto = más arriba):

| señal | peso |
|---|---|
| tema de tus intereses | +30 |
| afinidad: parte de tus acciones de 60 días en ese tema | hasta +15 |
| nunca la hiciste | +20 |
| es de esta estación (y no de todo el año) | +8 (y como mucho 2 por día) |
| efeméride de esta semana | +25 |
| pide algo que tenés (bici, balcón…) | +10 |
| impacto medio / alto | +5 / +10 |
| ya te la ofrecimos en los últimos 21 días | −25 |
| la cambiaste por "hoy no" en los últimos 7 días | −15 |
| la hiciste en los últimos 3 días | −15 |
| azar estable por persona y día | 0 a +20 |

**Composición del día** (5 lugares, en `app_settings.acciones_reglas`, se
ajusta desde el panel sin deploy): al menos 3 rápidas (≤ 5 min) · como mucho
1 larga (> 15 min) · como mucho 1 por tema (se relaja a 2 si no alcanza) · al
menos 1 nueva si existe · al menos 1 de impacto medio o alto si existe. Se
elige en orden de puntaje respetando esos topes; si con todos los filtros no
llegan 5, se relajan en orden: repetición → tope por tema → mezcla.

## 6 · Puntos

| | bajo | medio | alto |
|---|---|---|---|
| gesto fácil | 40 | 50 | 60 |
| gesto medio | 60 | 80 | 100 |
| gesto difícil | 100 | 120 | 150 |
| catálogo fácil | 80 | 100 | 130 |
| catálogo medio | 130 | 170 | 220 |
| catálogo difícil | 220 | 300 | 400 |

Sin cambios: racha ×1,1/×1,2/×1,3, +200 por set completo, +100 la primera vez
de una de catálogo. Nuevo: +300 al terminar un camino.

## 6b · Cómo se mide el impacto

Las cuatro cifras que ve la persona ("agua que no se gastó", "CO₂ que no llegó
al aire", "residuos que no fueron a la basura", "energía que no se consumió")
tienen que poder sostenerse. Reglas (las aplica `scripts/acciones/generar.mjs`
y las chequean los tests):

- **Una vez = lo que esa vez ahorra.** Lo que dura (arreglar una pérdida, poner
  un aireador, cambiar lámparas, apagar el piloto) cuenta **30 días** de
  ahorro, no la vida útil. Nada hecho una sola vez pasa de 750 L, 5 kg CO₂,
  2 kg de residuos o 30 kWh.
- **Agua es la de tu canilla o tu manguera.** La huella hídrica de la comida
  o la ropa (riego, fábrica) no la ahorraste vos: no se suma.
- **La ropa usada no reemplaza siempre una nueva**: ~la mitad de las veces
  (WRAP). Una prenda cuenta 2 kg CO₂ y 0,1 kg de textil, no 4 kg y 900 L.
- **Residuos es lo que no fue a la basura común**: lo que no se generó, se
  reusó, se recicló o se compostó (y pilas o remedios bien entregados).
  Juntar basura de la calle o de la playa es muy bueno, pero lo juntado va a
  la basura: suma puntos, no "residuos".
- **No se cuenta dos veces.** Empezar o cosechar el compost no suma encima de
  lo compostado cada día; entregarle al recuperador no suma encima de haber
  separado.
- **Aprender, observar, avisar, proponer, organizar: cero.** Plantar un árbol
  también: lo que absorbe llega en años y no todos sobreviven.
- **Sin el aparato no hay ahorro.** Lo que ahorra aire acondicionado o
  secarropas sólo se ofrece a quien lo tiene (`aire`, `secarropas`).
- **"Regá tu mundo" y lo del juego no cuentan** como acción real ni suman
  impacto (`tags` `juego`).

Factores (`scripts/acciones/dsl.mjs`): red eléctrica 0,31 kg CO₂/kWh; gas
10,8 kWh y 1,95 kg CO₂ por m³; auto 0,17 kg CO₂/km; agua de ducha 0,035 kWh/L
(38 °C desde 17 °C, calefón al 70%); comida tirada 2,5 kg CO₂e/kg (FAO);
orgánico al relleno 0,5; plástico 2,5; reciclable 0,8.

**Lo ya hecho se recalcula** al aplicar 0124: cada acción hecha pasa a contar
lo que hoy cuenta su acción (o la que la heredó); lo que se fue sin reemplazo
(paneles solares, tarifa renovable, termostato inteligente, "regá tu mundo")
queda en la historia con sus puntos y sin impacto. En la base viva esto baja,
por ejemplo, una sola "evitá la moda rápida" de 22.000 L a 0 L, y un "arreglá
una canilla" de 20.000 L a 600 L.

## 6c · El botón al Mercado

43 acciones piden un producto que el Mercado tiene (detergente biodegradable,
recargas, legumbres a granel, plantines nativos, composteras, copa menstrual,
LED, reparación…) y lo declaran en el catálogo (`mercado: [categoría,
subcategoría, texto]`). En la ficha de la acción, debajo de las
instrucciones y sólo para adultos (08 §9):

- con 3 empresas o más: 3 tarjetas (una por empresa) y el botón;
- con 1 o 2 listados: sólo el botón "Buscalo en el Mercado" a la búsqueda
  filtrada (una tarjeta sola se lee como publicidad de esa tienda);
- sin listados: nada.

Nunca en el set del día, en la hoja de Inicio ni al completar, y comprar no da
puntos. Lo decide `mercado_para_accion` (0123) en la base.

## 7 · Fases

- [x] **A · Base** — `0123_acciones_v2.sql`: columnas, `acciones_feedback`,
  `caminos`, `user_caminos`, `daily_sets.razones/cambios`, región, estación,
  efemérides, `brote_accion_apta`, generador del día v2, `acciones_de_hoy`,
  `acciones_cambiar`, `acciones_sugeridas`, `complete_activity` con cantidad +
  impacto congelado + caminos, impacto leyendo lo congelado, rutina y
  Plaza/Academia con la misma elegibilidad. Espejo en `lib/acciones/` con tests.
- [x] **B · Contenido** — catálogo nuevo en `scripts/acciones/` (una fuente de
  verdad en el repo, por tema), validador (duplicados, campos, vocabulario,
  puntos por regla, rangos de impacto) y `0124_acciones_catalogo.sql`
  generado. Se conservan los slugs que siguen (historia y rutinas intactas) y
  se desactivan los que se van.
- [x] **C · Pantallas** — Inicio (porqué, minutos, hoja de acción con
  descripción + Cambiar, medibles, "Más" desde el servidor, tarjeta "Contanos
  de tu casa"), Acciones (Caminos, De temporada, filtros: rápidas, gratis, te
  ahorra, dónde), detalle (descripción, por qué, fuente, camino, no aplica),
  onboarding y Ajustes → "Tu casa y tu día" + "Acciones ocultas".
- [x] **D · Panel** — `/panel/acciones`: catálogo por tema/formato, más
  cambiadas y "no aplica", ofrecidas vs hechas, y las reglas editables.
- [ ] **E · Verificación** — tests, typecheck, lint, build; ensayo contra la
  base en un bloque que termina en rollback; pantallas con datos de prueba a
  390×844 en claro y oscuro.

## 8 · Diario

- 2026-10-06 — Auditoría y plan (este archivo).
- 2026-10-06 — A–D hechas en la rama: 0123 (reglas y RPCs), 0124 (437 acciones,
  19 caminos, generada), 0125 (panel). 35 tests propios, 628+ en total, build ok.
  Probado contra Postgres local (PGlite): las tres migraciones aplican, 0124 es
  idempotente, rutinas y puentes al Mercado se heredan, 60 días seguidos sin
  romper una regla. Pantallas capturadas a 390×844 claro/oscuro.
  **Falta:** aplicar 0123–0125 en la base viva (pide el OK del dueño), merge,
  y un recorrido con sesión real (cambiar una acción, una medible, un camino).
- 2026-10-07 — Pedido del dueño: botón al Mercado, impacto medido de verdad,
  fuera lo que no cuida nada. Auditoría de impacto contra la base viva: 152
  acciones hechas por 5 personas sumaban 42.000+ L y 1.500+ kg CO₂ por cifras
  de "toda la vida" (paneles solares 1.500 kg de una vez, moda rápida
  22.000 L). Reglas en §6b; 112 acciones corregidas, todas a la baja; 20 fuera (las del juego,
  invitar a Brote, mitos digitales, triviales); 3 nuevas para chicos;
  contexto `secarropas`; historia recalculada en 0124; "Regá tu mundo" fuera
  de los totales. 43 acciones con botón al Mercado (§6c), sólo adultos.
  420 acciones, 39 tests propios, 633 en total, build ok, PGlite ok.
