# TU MUNDO — el juego completo · plan maestro y estado

> **Este archivo es el punto de retome del trabajo del mundo 3D.** Una sesión nueva
> lo lee entero antes de tocar código, y lo actualiza (sección 8, y las casillas
> de la sección 5) antes de terminar. El historial anterior del mundo está en
> `C:\Users\Usuario\Downloads\BROTE-MUNDO\BROTE-MUNDO\22-PROGRESS.md` (fases 1–5,
> pases de arte). Este archivo lo **reemplaza como plan**: donde el brief viejo y
> este dicen cosas distintas, gana este, porque recoge el pedido del dueño del
> 2026-09-25.
>
> Rama: `claude/mundo-juego` (sale de `origin/main` en `5a1340f`). Migraciones
> nuevas desde `0115` (la base viva llega a `0109`; `0110`–`0114` son de Academia
> y Mercado, en otras ramas, sin aplicar).

---

## 0. Cómo retomar (leer primero, siempre)

1. Leer la sección 8 (registro) de abajo hacia arriba: la última entrada dice qué
   quedó a medias.
2. Mirar las casillas de la sección 5. La primera sin marcar de la fase en curso es
   la próxima tarea.
3. `git log --oneline origin/main..HEAD` para ver lo commiteado en la rama.
4. Servidor de preview: `npm run build`, después arrancar `next start -p 3100`
   oculto (ver memoria *brote-preview-server-detached*). Capturas con Chrome
   headless por CDP (`scratchpad/cdp.mjs`, se reescribe si no está: es un
   driver mínimo de CDP con `--use-angle=d3d11`).
5. Ruta sin cuenta: `/offline/mundo-preview` — corre el juego entero con guardado
   en `localStorage` (clave `brote.mundo.juego.v1:demo`). `?reset=1` lo borra.
6. **Lo que queda es del dueño**, en este orden: aplicar
   `supabase/migrations/0115_mundo_juego.sql` (el guardado del juego, el
   catálogo, las semillas del mundo aparte), después
   `supabase/migrations/0116_mundo_abierto.sql` (abre el mundo a todas las
   cuentas), y mergear #34. La base viva llega a `0109`; `0110`–`0114` son de
   otras ramas y no hacen falta para estas dos. Ninguna sesión las aplica sin un
   OK del dueño en ese momento.

---

## 1. Lo que pidió el dueño (2026-09-25), punto por punto

| # | Pedido | Dónde se resuelve | Estado |
|---|---|---|---|
| R1 | Los objetos (bancos, compostera, puente…) se ven "hechos en Paint": llevarlos al nivel del resto | §3.12, fase F4 | ✅ superficies de madera/piedra/metal/tela/plástico en shader; 17 modelos nuevos; estaciones rehechas y lejanas |
| R2 | El mundo no es la prioridad de la app: es una sección más, como el Mercado, la Plaza y la Academia, donde la gente quiera pasar horas | §3.13, fase F0/F6 | ✅ sección en la navegación y fila en Inicio con póster real |
| R3 | Muchas actividades/tareas de videojuego; ni infinito ni difícil; 30 min por día sin quedarse sin cosas que hacer | §3.2, §3.4–3.7, simulación §6 | ✅ simulación: sin días muertos, ~30 min/día, semanas de contenido por nivel (`game-sim`) |
| R4 | Ver mejoras en el mundo: que se vuelva un entorno mejor y más desarrollado cuanto más se juega | §3.3 (parcelas), §3.5 | ✅ parcelas que pasan de silvestre a floreciente, con flora, hábitat y pasto restaurado |
| R5 | Calidad de videojuego profesional + enseñar jugando sin ser intrusivo | §3.9, §3.12 | ✅ fichas de guía en el momento justo, diálogos cortos opcionales, cámara que encuadra |
| R6 | Desconectado de la app pero conectado: el nivel (tier) define cómo se ve; dos formas de mejorar (jugar / subir de nivel), cada una hace crecer algo distinto, una sola no alcanza | §3.1 | ✅ Descubrir (nivel real) vs Cultivar (jugar); barras Descubierto/Cuidado |
| R7 | El cambio de nivel tiene que ser MUY notorio | §3.8 | ✅ ceremonia + tarjeta "Descubriste" + aviso por división |
| R8 | Jugabilidad mucho más profunda: acciones, tareas, misiones y más | §3.4–3.7 | ✅ 11 cadenas, diarias, estaciones, tienda, censo, pesca, premio por región |
| R9 | Mejorar la idea: jugando se hacen crecer bosques, ambientes y bloques del mundo (tipo *My Little Universe*); con el nivel se descubren especies nuevas (montañas, animales, árboles) y después se trabajan jugando | §3.1, §3.3, §3.8 | ✅ se restauran bloques (parcelas) por región; el nivel descubre lugares, especies y estaciones |
| R10 | Bug: en el teléfono el juego no abre, "vuelve arriba de la página" | §3.13, fase F0 | ◐ ya no rebota: pantalla "todavía no abrió". Abrir a todos = migración 0116 (**necesita OK del dueño**) |
| R11 | Bug: no se ve la vista previa del mundo en la app; hace falta una representación real | §3.13, fase F0 | ✅ póster real (capturado por el propio juego) y pósters por defecto nuevos |
| R12 | Nada de lo que se hace en el mundo suma puntos ni premios relevantes en la app; lo único que los une es el nivel | §3.11 | ✅ el juego no toca la app (tests de grep + SQL); semillas del mundo aparte |
| R13 | Representar el impacto real del usuario en el juego, claro pero sin molestar | §3.10 | ✅ El Ceibo: una flor por acción real, agua/residuos/energía a sus pies, abre El Mojón |
| R14 | Semillas como monedas que se ganan jugando, y una tienda para comprar objetos para el mundo | §3.7 | ✅ semillas del mundo + tienda + colocar lo comprado |
| R15 | Tomarse el tiempo, dejarlo perfecto, cumplir todo | todo el plan | ◐ §5 completo; pendiente sólo lo que necesita al dueño (0115, 0116, merge) |
| R16 | Planificar y anotar cosa por cosa lo hecho y lo que falta, porque las sesiones se cortan | este archivo | ✅ |

---

## 2. Diagnóstico — dónde está hoy (2026-09-25)

**Lo que ya existe y sirve** (no se tira): la isla de 9 regiones que crecen con el
nivel, el terreno, el pasto en GPU, el agua, los árboles nativos, Pip y su
controlador, la cámara, las ceremonias de subida de nivel (uplift, grow, channel,
snowline, repaint), la Bitácora (64 especies), el elenco de cuatro voces (Inés,
Tuco, Mila, Don Beto), los seis eventos, El Mojón (impacto medido), acomodar
objetos, visitas con calcomanías, regalos, el póster, el perfil de rendimiento.

**Lo que está mal o falta:**

1. **Jugar casi no hace nada.** Tres tareas diarias, recolectar calafates, censar,
   pescar. Nada de lo que hacés cambia la isla de forma duradera: la isla crece
   *sólo* con el nivel real. En diez minutos se agota.
2. **Las semillas mezclan monedas.** El juego paga con `brote_grant_semillas` al
   mismo saldo `profiles.semillas` que pagan la Academia, la Plaza y las acciones
   reales. Viola R12. Y los objetos colocables son filas de `cosmetics` que sólo se
   compran con ese saldo de la app — no hay tienda en el juego (R14).
3. **Props y estructuras** con color plano por pieza, sin veta, sin desgaste, sin
   oclusión: al lado del pasto y los árboles se ven de juguete (R1).
4. **El póster de la app es negro.** El guardado del dueño en `world-snapshots` es
   una imagen 1920×991 toda negra (verificado el 2026-09-25). El arreglo del PR
   #29 fue revertido en #31 (sin motivo anotado), y aun con él el último póster
   subido salió negro (R11).
5. **`/mundo` redirige a `/perfil` en silencio** si la bandera está apagada para
   esa cuenta (`mundo_game_enabled=false`, allowlist sólo con el dueño). Desde el
   póster de `/perfil` eso se ve exactamente como "vuelve arriba de la página"
   (R10). En emulación de teléfono (390×844, táctil) el juego carga bien.
6. **No es una sección de la app**: no está en la navegación; sólo se entra por el
   póster (R2).
7. **El impacto real** existe como números en El Mojón y cuatro canales sutiles
   (caudal del río, aire, basura en la costa, faroles). Es poco visible, y el canal
   de residuos (basura en la costa) choca con juntar basura jugando (R13).

**Sobre el revert de #29:** ~~el dueño lo revirtió una hora después de mergearlo, sin
dejar razón~~. **Corregido el 2026-09-27:** el dueño dijo que él no revirtió
ninguna cámara y que tiene que andar normal. Lo de #29 volvió entero en `bbe926f`
(cámara que orbita, zoom con rueda/pellizco/teclas/botones, rendimiento, guía de
cómo jugar, cartel sobre la misión), adaptado al juego nuevo. Ver D5.

---

## 3. Diseño

### 3.1 Dos ejes: **Descubrir** (nivel real) y **Cultivar** (jugar)

La isla tiene dos medidas, y cada una hace crecer una cosa distinta:

| | **Descubrir** — tu nivel en Brote | **Cultivar** — jugar |
|---|---|---|
| Qué la mueve | Acciones reales verificadas (XP → rango 1–11, y sus 5 divisiones) | Lo que hacés adentro del mundo |
| Qué hace crecer | **Qué existe**: lugares nuevos (la isla se agranda, sube la montaña, aparece el río, la nieve, el islote), especies nuevas (plantas, árboles, animales), estaciones nuevas, objetos nuevos en la tienda, verbos nuevos | **Qué tan viva está**: las parcelas pasan de silvestres a restauradas y florecientes, se construyen y mejoran estaciones, se decora, llegan los animales, se llena la Bitácora y la Guía |
| Qué NO puede hacer | No restaura ni una parcela, no da semillas, no construye | No abre una región, no descubre una especie, no da XP ni puntos en la app |
| Si sólo hacés esta | Una isla grande y **silvestre**: mucho descubierto, poco vivo | Una isla chica **impecable** que se queda sin lugar donde crecer |

**"Una sola no alcanza"** se muestra en pantalla: la tarjeta *Tu isla* tiene dos
barras — *Descubierto* (lo que abrió tu nivel) y *Cuidado* (cuánto de eso está
restaurado). Y el techo es real: las parcelas, las especies para plantar, las
estaciones y la mitad de la tienda están atadas a lo descubierto.

### 3.2 El día de 30 minutos

Cada día trae cosas nuevas, y el progreso de un día se ve al día siguiente:

| Minutos | Qué pasa |
|---|---|
| 0–1 | Entrás: lo que creció desde ayer se ve de una (parcelas que brotaron, animales nuevos, flores nuevas en tu Ceibo si hiciste acciones reales). Tuco/Inés/Mila/Don Beto te dicen una línea. |
| 1–10 | **Misiones del día** (3, sorteadas según lo que tenés): juntar, separar, regar, cosechar, registrar, pescar… |
| 10–20 | **Recolección y estaciones**: residuos que trajo el mar, hojas, ramas, piedras, frutos; separar en el Punto Limpio; cargar la compostera y el vivero; retirar lo que produjeron. |
| 20–28 | **Avanzar la isla**: regar lo plantado ayer, preparar suelo, plantar, construir o mejorar una estación, la misión de historia de la región. |
| 28–30+ | Decorar con lo comprado, censar, un evento (1 cada 2 días), visitar a alguien. Abierto, sin techo. |

**No es infinito por diseño:** las estaciones producen con tiempo real (la
compostera y el vivero trabajan mientras no estás), lo plantado necesita
riego en días distintos, y los recursos del día se reponen al día siguiente. Lo que
sí es abierto (decorar, pescar, censar lo que falta) no da progreso duro.

**No es difícil por diseño:** no se pierde nada, no hay fracaso, la tarjeta de
objetivo siempre dice qué hacer y dónde, todo se hace con caminar + un botón.

### 3.3 Parcelas: los "bloques" de la isla

La isla se divide en **parcelas** orgánicas (celdas de Voronoi sobre una grilla
con jitter de ~9 m, bordes con ruido para que no se vean hexágonos). Cada parcela
pertenece a la región donde cae; se puede trabajar cuando su región está
descubierta y cae dentro de la costa del nivel actual. ~12 parcelas a nivel 1,
~40 a nivel 4, ~90 a nivel 7, ~150 a nivel 11.

**Etapas** (lo que se ve cambia en cada una — pasto, color de suelo, flores,
árboles, bichos):

| Etapa | Cómo se ve | Qué hace falta para pasar |
|---|---|---|
| 0 · **Silvestre** | Pasto ralo y seco, suelo pelado, residuos, ramas secas, alguna invasora | Juntar sus residuos y sacar la invasora |
| 1 · **Limpia** | Sin basura, suelo claro | Poner **compost** (2–6 según región) |
| 2 · **Suelo vivo** | Tierra oscura, primeros verdes | Poner **plantines** de especies descubiertas (2–6) |
| 3 · **Plantada** | Plantines chiquitos | **Regar** en 2 días distintos (con la regadera) |
| 4 · **Viva** | Pasto alto, flores, árboles jóvenes según el tipo; empiezan a llegar animales; da frutos y hojas cada día | Para florecer: diversidad (3 especies distintas del tipo) + 1 objeto de hábitat (caja nido, hotel de insectos, bebedero…) |
| 5 · **Floreciente** | Todo al máximo, especies raras, más fauna | — |

Al completar una etapa, la parcela cambia con una **ola** que corre desde el
centro (el modo `grow` de las ceremonias, reusado), sonido y partículas.

**Tipos de parcela por región:** Claro → *pradera de nativas*; Pradera →
*pastizal*; Jardín → *jardín de polinizadores*; Arboleda → *bosque nativo*; Río →
*humedal*; Monte → *monte serrano* (ladera: se estabiliza con matas); Cumbre →
*pastizal de altura*; Islote → *duna costera*; Monumento → *mirador*.

**Render:** un mapa de restauración (textura de datos 256² sobre ±90 m) que leen
el pasto (densidad, altura, color seco↔verde), el suelo (pelado↔oscuro), las
flores y los pools de vegetación (cada instancia escala con la etapa de su
parcela). Una sola textura, ningún material nuevo.

### 3.4 Materiales y recolección

| Material | De dónde sale | Para qué |
|---|---|---|
| **Residuos** | La playa (el mar trae ~10–14 por día), parcelas silvestres (fijos hasta limpiarlas) | Se separan en el Punto Limpio → **reciclado** + semillas |
| **Hojas** | Pilas bajo los árboles y en parcelas vivas (diarias) | Compostera → **compost** |
| **Ramas** | Ramas secas caídas (diarias), podar árboles viejos | Construir y mejorar |
| **Piedras** | Zonas de roca (diarias) | Construir, senderos |
| **Reciclado** | Separar bien en el Punto Limpio | Construir (el banco de plástico reciclado, los tachos…) |
| **Compost** | La compostera, con el tiempo | Suelo vivo |
| **Frutos** | Cosechar plantas de parcelas vivas y los calafates | Vivero → **plantines**; también se venden |
| **Plantines** | El vivero, con el tiempo; la tienda (sobres) | Plantar parcelas |
| **Agua** | Tanque de lluvia, charco, laguna, río | Regar (carga de la regadera) |

**Recolectar se siente como juego:** lo chico (residuos, hojas, ramas, piedras) se
junta **solo al pasar cerca** — vuela hacia Pip con un sonido y el contador salta
(como *My Little Universe*). Lo grande (podar, cosechar, sacar una invasora) es un
toque de E/botón con una acción corta. La **mochila** tiene capacidad (mejorable),
así hay viajes a las estaciones.

### 3.5 Estaciones (se construyen y se mejoran)

Se construyen en **plataformas** marcadas: parás encima y los materiales vuelan de
la mochila a la obra (la plataforma muestra lo que falta). Cada una tiene 3 niveles.

| Estación | Descubre en | Hace | Enseña |
|---|---|---|---|
| **Punto Limpio** | 1 | Separar residuos (reciclable / orgánico / resto) → reciclado + semillas | Separación en origen, qué va dónde |
| **Compostera** | 1 | Hojas → compost con el tiempo | Compostaje, verdes y secos |
| **Tanque de lluvia** | 1 | Junta agua sola; llena la regadera | Cosecha de agua de lluvia |
| **Vivero** | 1 | Frutos → plantines con el tiempo | Reproducir nativas |
| **Hotel de insectos** | 3 | Hábitat para florecer el jardín; más frutos cerca | Polinizadores |
| **Caja nido** | 5 | Hábitat para florecer el bosque; llegan aves | Aves y cavidades |
| **Puente** (reparar) | 7 | Cruzar el río | — |
| **Muelle** | 7 | Pesca mejor; el bote al islote (10) | — |
| **Refugio de montaña** | 8 | Descanso, mirador | — |
| **Faro** | 10 | La luz de Don Beto | Energía |

### 3.6 Misiones

- **Historia** (la columna del juego): una cadena por región, contada por el
  elenco. Cada región descubierta abre la suya (6–9 misiones). Guían a construir
  las estaciones, restaurar las primeras parcelas y conocer las especies nuevas.
  Cada una termina con una línea de por qué importa (≤25 palabras). Pagan
  semillas y a veces un objeto único.
- **Diarias**: 3 por día, sorteadas de un pool según lo que tenés (≥25 plantillas),
  iguales todo el día en cualquier dispositivo. Completar las tres da un bonus.
- **Colecciones**: la Bitácora (especies, con premio por región completa), la
  **Guía de campo** (fichas de lo aprendido), parcelas restauradas, estaciones al
  máximo. Cada hito paga.

### 3.7 Semillas (la moneda del juego) y la Tienda

- Las **semillas del mundo** se ganan **sólo jugando** y se gastan **sólo en el
  mundo**. Viven en `world_game`, no en `profiles.semillas`. El juego no llama más
  a `brote_grant_semillas`. En la app no aparecen nunca.
- **La Tienda** (el almacén de Don Beto): decoración (los 10 objetos de siempre +
  ~20 nuevos), herramientas (mochila, regadera, guantes, botas: mejoras de
  jugabilidad), sobres de plantines de especies descubiertas. Catálogo fijo y
  visible entero; lo no descubierto aparece con candado y "se descubre en nivel
  N". Nada aleatorio, nada que venza.
- Ganancia objetivo: ~80–150 semillas por día de 30 min. Precios: decoración
  40–400, herramientas 120–900.

### 3.8 Descubrimientos por nivel (y el cambio de nivel notorio)

| Nivel | Lugar que aparece | Descubrís (especies para plantar/atraer, estaciones, tienda) |
|---|---|---|
| 1 Semilla | El Claro | Flechilla, trébol, margarita; Punto Limpio, Compostera, Tanque, Vivero |
| 2 Brote | La Pradera (el charco) | Cortadera, hornero, tijereta; bancos, farolitos |
| 3 Plántula | El Jardín | Verbena, lantana, salvia, abejas; Hotel de insectos; colmena, arco |
| 4 Retoño | La Arboleda | Ceibo, tala; primer bosque |
| 5 Arbusto | (arbustos, nidos) | Algarrobo, aguaribay, chilca; Caja nido |
| 6 Árbol | (dosel, casita del árbol) | Carpintero, hongos; hamaca, planear |
| 7 Bosque | El Río y la Laguna | Junco, camalote, peces; puente, muelle, pescar |
| 8 Guardián | El Monte | Cardón, chaguar, cóndor; refugio, escalar |
| 9 Ecosistema | La Cumbre nevada | Yareta, huemul; rastrear |
| 10 Planeta | El Islote | Cachiyuyo, lobo marino; bote, faro |
| 11 Gaia | El Monumento | Todo en su máximo; luz dorada |

Cada **división** (5 por nivel) descubre algo chico y permanente (una especie o un
objeto de tienda), así el eje real se nota cada ~10 días y no sólo cada meses.

**El cambio de nivel notorio:** la ceremonia existente (la tierra se levanta, el río
corta, la nieve baja, la isla crece) + una tarjeta **"Descubriste"** con cada cosa
nueva (región, especies con su dibujo, estaciones, objetos) + la misión de
bienvenida de la región nueva + Pip cambia de etapa + la luz del mundo cambia de
grado. Se ve y se escucha; no se puede confundir con otra cosa.

### 3.9 Enseñar jugando (sin cortar el juego)

El conocimiento es la **entrada del verbo**, no un examen aparte:

- **Separar residuos**: cada residuo tiene su tacho correcto. Si errás, el
  residuo va igual al correcto y una línea corta dice por qué. La primera vez de
  cada tipo desbloquea su ficha.
- **Compost**: la compostera quiere verdes y secos; sólo verdes, anda lento (y
  dice por qué).
- **La planta justa en el lugar justo**: cada tipo de parcela tiene sus especies;
  una especie que no es de ahí crece más lento (nunca falla).
- **Invasoras**: reconocer y sacar la invasora (ligustro, acacia negra, zarzamora)
  en parcelas silvestres.
- **Regar**: al amanecer o al atardecer rinde más (menos evaporación); nadie lo
  obliga, la Guía lo cuenta.
- **Eventos** (el incendio, la playa con residuos) siguen siendo las evaluaciones.
- **La Guía de campo**: cada cosa aprendida queda como ficha coleccionable (≤30
  palabras, con quién te la contó). Leerla es opcional; completarla paga.

Regla: nunca un modal que frene, nunca dos lecciones seguidas, todo se puede
ignorar y el juego sigue igual.

### 3.10 Tu impacto real: **El Ceibo**

En el centro de El Claro, junto a donde aparecés, crece **tu Ceibo**: un árbol que
**sólo** crece con tus acciones reales. El juego no lo toca.

- **Cada acción real es una flor roja.** El tamaño del árbol sigue la cantidad de
  acciones (logarítmico); las flores se agrupan en racimos pasadas las primeras.
- En sus raíces, cuatro cosas: un **manantial** (litros de agua ahorrados), una
  **luz clara** alrededor de la copa (CO₂), un **cantero** donde estaba la basura
  (residuos) y **farolitos** que se prenden de noche (energía).
- **Al entrar**, si hiciste acciones desde la última vez, caen pétalos dorados
  sobre el Ceibo y una línea dice "3 acciones reales nuevas florecieron en tu
  ceibo". Tres segundos, no frena nada.
- Tocarlo abre El Mojón (los números medidos, con el método).
- El canal viejo "basura en la costa según tus residuos reales" se retira: la
  basura de la playa ahora es contenido de juego.

### 3.11 Separación estricta app ↔ juego

- Juego → app: **nada**. Ni XP, ni puntos, ni semillas de la app, ni logros, ni
  notificaciones. Test que lo verifica (grep del árbol + de las migraciones del
  mundo: ninguna llama a `brote_grant_semillas`, `complete_activity`, XP).
- App → juego: **el nivel** (y su división) define lo descubierto; **el impacto
  real** se representa en el Ceibo (representa, no premia); los proyectos reales
  siguen como mojones conmemorativos. Nada más.
- Se retiran del juego las costuras que no son esas: plantas marchitas por
  repasos vencidos de la Academia, sugerencia de acción real al completar un
  dominio del censo.

### 3.12 Arte: props y estructuras al nivel del mundo

- **Material de objetos construidos**: un material nuevo (uno solo) que recibe un
  id de material por vértice (madera, metal, piedra, tela/soga, plástico, vidrio,
  hoja) y agrega en el shader: veta de madera en espacio de objeto, poros y
  vetas de piedra, desgaste en cantos, suciedad abajo, oclusión por vértice,
  brillo especular por material. Es lo que el suelo y el pasto ya tienen.
- **Geometría**: rehacer banco, compostera, puente, muelle, carpa, colmena,
  hamaca, farolitos, molino, tótem, comedero, huerta, arco, casita del árbol, bote,
  telescopio, más las estaciones nuevas, con biseles, piezas separadas, clavos,
  sogas, ensambles.
- **Criterio**: cada objeto se juzga de cerca (primer plano a 1,5 m), a media
  distancia y de lejos, al lado de un árbol, de día y al atardecer.

### 3.13 La sección en la app, el teléfono y el póster

- **Sección**: *Tu mundo* entra en la navegación lateral (con Aprendé y
  Mercado) y en el inicio como tarjeta propia, igual que la Academia y el Mercado.
- **Teléfono**: `/mundo` deja de redirigir en silencio; si la bandera está
  apagada para esa cuenta, muestra una pantalla que lo dice. El juego arranca en
  calidad baja en táctil y sube si el aparato anda. **Encender la bandera para
  todos es decisión del dueño** (la migración del juego la deja preparada).
- **Póster**: arreglar la captura (hoy sube negro), no subir nunca un cuadro
  oscuro, y mientras no haya foto propia mostrar una **foto real** del mundo
  (capturas del juego por nivel en `public/mundo/poster-t*.jpg`), no el dibujo SVG.

---

## 4. Datos y sincronización

- **Tabla `world_game`** (una fila por usuario): `state jsonb` (el guardado del
  juego, versionado), `semillas_earned bigint`, `semillas_spent bigint`,
  `earned_day date`, `earned_today int`, `rev int`, `updated_at`.
- **El estado del juego es del cliente** (un juego de un jugador, sin efecto en la
  app ni ranking), con **topes en el servidor**: `world_game_save(p_state, p_rev)`
  rechaza versiones viejas (`rev`), topea lo ganado por día (≤ 700), exige que lo
  gastado cubra el inventario (precios de `world_items`), que nada del inventario
  supere el nivel real, y que no avance una parcela de una región no descubierta.
- **`world_items`**: el catálogo de la tienda en SQL (slug, tipo, precio, nivel),
  espejo del catálogo TS, con test que compara los dos.
- `world_bootstrap` devuelve `game` (estado + saldo + rev) y `xpProgress` (la
  división). `world_log_species` y `world_daily_chore` dejan de tocar
  `profiles.semillas`. Las colocaciones validan contra el inventario del juego.
- Guardado: debounce 3 s + al ocultar la pestaña; cola offline en `localStorage`
  (el patrón de `outbox.ts`). Conflicto de `rev` (otro dispositivo guardó antes):
  se recarga el estado del servidor.
- Visitas: `world_snapshot_for` agrega las etapas de parcelas y estaciones para
  que la isla visitada se vea como es.

---

## 5. Fases de trabajo

### F0 — Plan y arreglos urgentes
- [x] Leer y analizar todo; este plan.
- [x] Póster: diagnosticar por qué sale negro, arreglar, no subir cuadros oscuros. (`53326ca`)
- [x] Pósters por defecto: capturas reales por nivel en `public/mundo/`. (provisorias: se re-capturan en F6)
- [x] `/mundo` sin redirección silenciosa; pantalla de "todavía no abrió" si la bandera está apagada.
- [x] *Tu mundo* en la navegación lateral y tarjeta en el inicio (fila con foto, ya no es el héroe de Hoy).

### F1 — Cimientos del juego nuevo
- [x] `lib/world/game/` puro: tipos del estado, estado inicial, reducer de acciones, reloj (día local), sanitizado. (`771ceef`)
- [x] Catálogos: materiales, estaciones, tipos de parcela, plantables, tienda, herramientas.
- [x] Parcelas: generación determinística (Voronoi), región, disponibilidad por nivel.
- [x] Guardado: `useGameStore` (zustand), persistencia local + servidor (`world_game_save`), reintento; `useGameSession` guarda al ocultar la pestaña.
- [x] Migración `0115_mundo_juego.sql` + `0116_mundo_abierto.sql` escritas (`33ded78`). **Sin aplicar: necesitan OK explícito del dueño.**
- [x] Separación: el juego no llama a nada de la app; censo/pesca/recolección pagan semillas del mundo por el reducer; el HUD muestra el saldo del mundo.
- [x] Tests: reducer, topes, separación (grep), determinismo de parcelas, simulación de 60 días (`game-core`, `game-sim`).

### F2 — El ciclo central
- [x] Recolectables: residuos (playa diaria + parcelas), hojas, ramas, piedras; recoger al pasar; mochila con capacidad. Las invasoras leñosas dan ramas.
- [x] Estaciones: plataformas de obra con depósito automático (sólo si Pip se para y la historia ya pidió esa obra); Punto Limpio (+ minijuego de separar), Compostera, Tanque, Vivero; producción con tiempo real; panel de estación con cámara que la encuadra.
- [x] Parcelas en escena: restauración, estacas, etiqueta, ola, y flora plantada por especie y etapa. Fauna por parcela (`ParcelFauna.tsx`, `a213d91`): mariposas desde "viva", y en "floreciente" el animal de su refugio (pájaro en el posadero o la caja nido, abejas en su hotel).
- [x] Regar (regadera con carga; tanque, charco y laguna), plantar, cosechar frutos, sacar invasoras.

### F3 — Misiones y aprendizaje
- [x] Motor de misiones (objetivos por evento del reducer) y tarjeta de objetivo nueva; si faltan materiales el faro lleva a buscarlos y la tarjeta dice qué falta.
- [x] Cadenas de historia: escritas todas. Probado con input real el Claro de punta a punta hasta "Mañana, otra vez" (espera de un día real). Test: toda misión se puede terminar al nivel que la abre (verbos, especies, plantas, tienda, estaciones). El faro apunta a la especie a registrar, al lugar de pesca y a la parcela más avanzada.
- [x] Diarias (pool ≥25) + bonus.
- [x] Guía de campo (fichas) y los momentos que las dan; los personajes cuentan una ficha cuando no tienen capítulo.
- [x] Censo paga semillas del mundo; premio y aviso por región entera restaurada (una vez).

### F4 — Tienda, decoración y arte
- [x] Tienda (hoja, con ícono por objeto) + herramientas + sobres; colocar lo comprado con su cuenta (probado con clics reales: comprar → Colocar → Poner).
- [x] Superficies de lo construido en el shader (`materials/built.ts`): veta a lo largo de cada tabla, piedra con grano y liquen, metal, soga/tela, plástico reciclado. Etiquetado por vértice en `tangent` (lo rota `applyMatrix4`).
- [x] 17 modelos nuevos de la tienda (`props-shop.ts`, `props-habitat.ts`); estaciones lejanas (`stations-far.ts`: puente reparado, muelle, refugio, faro, 3 niveles); puente viejo roto hasta repararlo; hábitat visible en la parcela floreciente. Revisión con `?props=1` + `scratchpad/props.mjs`.
- [x] Revisión de cerca de cada objeto (capturas en el scratchpad; pirca, bebedero y sendero rehechos tras verlos).

### F5 — Nivel e impacto
- [x] Descubrimientos por nivel y división; tarjeta "Descubriste" en la ceremonia (beat `discover`); aviso cuando una división descubre algo entre niveles.
- [x] El Ceibo (impacto real) + pétalos al entrar + El Mojón desde el Ceibo.
- [x] *Tu isla*: barras Descubierto / Cuidado; *Tu camino* por nivel y división.
- [x] Retiradas: marchitas de Academia, sugerencia de dominio de la Bitácora, basura según residuos reales, línea diaria vieja de los personajes.

### F6 — Pulido y prueba
- [x] Simulación de 60 días × jugadores (activo, casual, veterano 7, gaia): en tests (`game-sim`). El bot espera timers cortos como una persona.
- [x] Bot con input real. Teclado (`scratchpad/playgame.mjs`: WASD relativo a la cámara, E, clics en paneles) juega el Claro de punta a punta. Táctil (`scratchpad/playtouch.mjs`, 390×844: pulgar en el joystick, botón de acción, toques en diálogos, tachos y hojas; ni una tecla) llega a Claro 9 en 6 minutos: Punto Limpio, compostera y tanque construidos, tres parcelas limpias. Cámara táctil (`scratchpad/touch.mjs`): joystick, un dedo gira, pellizco centrado y escalonado, caminar y girar con dos pulgares, botones ±.
- [x] Rendimiento: capa del juego aliviada para teléfono (bayas 117k→13k triángulos, basura lejana sin dibujar, estacas livianas, sin sombras de lo diminuto). Árboles resueltos con el LOD de #29: a T1 en teléfono la vegetación dibuja 5,4k triángulos por cuadro (antes ≈67k). Medido por grupo (`scratchpad/tris2.mjs`, T1 q1): 126k enviados, de los cuales el pasto son 82k — igual que en `main`, y las hojas fuera de cámara o de su anillo se colapsan en el vertex shader, así que casi no cuestan; la capa del juego suma ≈17k. Mediana 10 ms.
- [x] Capturas finales y pósters por defecto (`e7a8ba9`); docs (este archivo; CONTINUE.md ya apunta acá).
- [x] PR bo336/Brote#34. Migración 0115 probada contra la base viva en un bloque que termina en rollback (2026-09-27: 46 objetos en el catálogo, 7 funciones, bandera sin tocar). **Aplicarlas, abrir la bandera (0116) y mergear son del dueño** (ver §0).

---

## 6. Verificación

- **Pura**: tests de Node sobre `lib/world/**` (`npm test`), incluyendo la
  simulación de 60 días que mide minutos de contenido disponible por día, días
  hasta restaurar cada región y semillas por día.
- **Con input real**: harnesses CDP en el scratchpad (teclado, mouse, toque),
  siempre con `?perf=1` y un toque real después de `__pipAt`.
- **Arte**: capturas headless a 1280×720 y 390×844; primeros planos de cada objeto.
- **Base**: bloques `do $$ … raise exception 'QA_RESULT'` que terminan en
  rollback; nunca escrituras reales sin OK.

---

## 7. Decisiones y desvíos

- **D1 — El estado del juego lo guarda el cliente, con topes en el servidor.** Es
  un juego de un jugador sin efecto en la app: hacer autoritativa cada acción
  exigiría duplicar todas las reglas en SQL y una llamada por acción. Los topes
  (por día, inventario vs gastado, nivel) cubren lo que importa.
- **D2 — Las semillas del mundo son otra cuenta.** Mismo nombre que pidió el
  dueño, otro saldo. La Academia sigue mostrando "+N semillas" de la app: eso es
  de la app y queda anotado como algo para que el dueño decida (renombrar allá).
- **D3 — Parcelas procedurales, no dibujadas a mano**, porque son ~150 y la isla de
  cada uno es distinta; el carácter lo da el tipo de región.
- **D4 — Se retiran las costuras de Academia y del censo-por-dominio** del juego,
  por R12 ("lo único que los une es el nivel").
- **D5 — ~~El revert de #29 se respeta.~~ #29 vuelve (2026-09-27).** El dueño no
  lo había revertido y pidió que la cámara ande normal. Se deshizo el revert
  (`bbe926f`) quedándose con el póster nuevo de esta rama; el resto de #29 se
  adaptó al juego (el cartel nombra lo que hay donde apunta la misión, la guía
  de cómo jugar habla del juego nuevo, el puente viejo roto usa las barandas de
  #29). Probado con input real: arrastrar orbita, rueda 1,5–19,8 m, teclas y
  botones; en el teléfono joystick, un dedo gira, dos dedos acercan/alejan
  (arreglado en `beb0215`: el pellizco en el medio de la pantalla caía en el
  joystick y caminaba).
- **D6 — Contenido del juego en TS, cromo del HUD en `messages`.** Misiones,
  fichas, estaciones y diálogos viven en `lib/world/game/texto` (español, son
  contenido y se prueban con el reducer). Todo lo que es interfaz del HUD del
  juego (botones, títulos, avisos, rechazos) está en `mundo.juego.*` de
  `messages/es.json` y `en.json`, como pide el test de strings del mundo.
- **D7 — Una obra sólo toma materiales cuando la historia la pidió y Pip se
  para en ella** (`buildOpen`, `GAME.padStillSpeed`). La prueba con input real
  mostró que caminar hasta Inés pasaba por la plataforma del vivero y le vaciaba
  la mochila: nada se podía construir y no se entendía por qué.
- **D8 — El tanque se construye mientras el compost trabaja** (Claro 9). Con la
  obra atada a la historia, el día 1 se quedaba sin nada que hacer esperando el
  compost.
- **D9 — Una historia que sólo puede esperar le pasa la tarjeta a otra cosa.**
  Esperar el compost (6 min por balde en el nivel 1) o regar "otro día" dejaba
  la tarjeta clavada en una compostera o en una parcela ya regada. Ahora pasa a
  la siguiente historia que pueda avanzar, o a una diaria, o a limpiar otra
  parcela (o a mejorar la compostera si ya alcanza), y vuelve sola cuando la
  espera termina (`targets.ts`, `waitingOn` / `meanwhile`).
- **D10 — En Suelo vivo Inés presta dos baldes de compost.** Una parcela del
  Claro lleva tres; con uno propio cada seis minutos, la primera plantada del
  primer día llegaba a los veinte minutos. Con el préstamo llega a los ocho y
  la lección del compost queda (el tercero es tuyo).
- **D11 — La guía termina lo empezado.** Entre parcelas de la misma etapa elige
  la que más tiene puesto (compost, plantines), y si ninguna llegó a la etapa
  que pide la misión, la más avanzada de la región. Antes repartía el compost
  entre todas las parcelas limpiadas, y "plantá en El Jardín" sin parcela lista
  no apuntaba a ningún lado.

---

## 8. Registro de sesiones

### 2026-09-27 — sesión 4 — la cámara de #29 vuelve, fauna en las parcelas, teléfono, base
- Commits `bbe926f` … `e0819c5` (y este registro).
- El dueño: "no revertí ninguna cámara, tiene que andar normal". Se deshizo el
  revert de #29 (`bbe926f`) quedándose con el póster de esta rama y adaptando lo
  demás (D5). Cámara probada con input real en escritorio y en teléfono.
- El cartel de la misión nombra lo que hay donde apunta (`targetName`, `ee2182c`).
- Fauna en las parcelas restauradas (`a213d91`); `habitatSpot` compartido con
  la flora plantada.
- Teléfono: el pellizco en el medio de la pantalla caía en la esquina del
  joystick y caminaba en vez de acercar; ahora dos dedos juntos son pellizco
  donde caigan (`beb0215`). Partida entera con toques (sin teclado) hasta Claro 9.
- Rendimiento medido por grupo por cuadro: los árboles quedaron resueltos con el
  LOD de #29; el pasto es lo grande y es igual que en `main` (ver F6).
- 0115 probada contra la base viva con rollback: aplica limpia sobre `0109`. Las
  `0110`–`0114` de otras ramas no tocan nada del mundo, así que el orden entre
  ramas no importa.
- Partidas largas con teclado real (20–30 min a nivel 3) destaparon cuatro
  trabas y un error de lugar, todos arreglados con su test:
  - ramas, hojas, piedras y parcelas enteras caían en el mar de la bahía: la
    altura del terreno decía tierra, pero la costa dibujada (y el empuje de
    Pip) no llega ahí (`insideCoast`, `beec38b`);
  - la guía se quedaba en una compostera con 3 de los 4 orgánicos que hacen
    falta, y en "cargá la compostera" mientras una tanda se cocinaba (`68caf4f`,
    `2d6c8a4`);
  - esperas de reloj sin nada que hacer (D9), la primera plantada a los veinte
    minutos (D10), compost repartido y misiones sin destino (D11);
  - la tarjeta ahora sugiere mejorar la compostera cuando ya alcanza (si
    cualquier historia espera compost, la espera la nombra el compost);
  - tierra lista para plantar sin nada en la mochila que crezca ahí y sin
    vivero: la tarjeta dice qué plantín comprar en la Tienda y cómo abrirla;
  - mochila llena: la tarjeta nunca manda a juntar (se rechazaría); dice dónde
    vaciarla — separar en el Punto Limpio, cargar la compostera, entregar ramas
    o piedras en una obra que la historia ya abrió, o una mochila más grande en
    la Tienda. Mientras se espera, con 10 o más residuos encima, propone
    separarlos (de ahí sale el reciclado de las mejoras);
  - cuatro diarias no apuntaban a nada: hablar con alguien (ahora el personaje
    más cerca), registrar especies (la más cerca), llevar materiales a una obra
    (la obra abierta más cerca que todavía necesita) y comprar en la Tienda (sin
    lugar: la tarjeta dice cómo abrirla);
  - separar sin nada (de ese tipo) en la mochila abría el juego de separar
    vacío una y otra vez: ahora manda primero a juntar la basura justa (la
    orgánica para "separá orgánicos"), y si en toda la isla ya no queda, la
    diaria se hace a un lado hasta mañana;
  - una diaria que hoy no se puede (no quedan ramas en el piso) deja pasar a la
    siguiente;
  - el vivero sin frutos manda a cosechar una parcela viva con frutos maduros,
    o espera a mañana;
  - una parcela viva que no florece dice qué le falta: otra especie (del vivero
    o un plantín de la Tienda) o un refugio (de la Tienda); si sólo le faltan
    días, la tarjeta pasa a otra cosa.
- Tests nuevos que recorren todo: cada paso de historia y cada diaria, a cada
  nivel, apunta a algún lado (o dice cómo hacerse); nada que juntar ni ninguna
  parcela cae fuera de la costa, en tres islas distintas y a seis niveles.
- Partida de 30 minutos a nivel 3 después de todo eso (`scratchpad/playgame.mjs`):
  primera plantada a los 8 min, las tres historias abiertas se turnan mientras
  el compost trabaja, nunca "sin objetivo", ni una traba. Cada tarjeta nueva
  capturada a 390×844 (`scratchpad/cards.mjs`).
- **Queda (del dueño):** aplicar 0115 y después 0116, mergear #34.

### 2026-09-26 — sesión 3 — arte, tienda, estaciones lejanas, ceremonia, teléfono
- Commits `9400435` … `2cbec2d` (ver `git log`).
- Hecho: superficies de lo construido; 17 modelos de tienda; estaciones lejanas;
  puente roto → reparado; hábitat en parcela floreciente; pasto silvestre como
  pastura cansada (verde abajo, paja arriba); sin árboles sobre estaciones;
  colocar con inventario; íconos de tienda; "Descubriste" + aviso de división;
  premio por región; guía a lo que falta (compost, agua, plantines, especie,
  pesca, parcela más avanzada); E prefiere lo que pide la tarjeta; La Pradera 6
  ya no pide registrar antes del nivel 3; retirado lo viejo; phone: pestañas,
  guía, encuadre de estación verificados a 390×844; triángulos para teléfono.
- **Próximo:** pósters por defecto nuevos (`public/mundo/poster-t*.jpg`) con la
  isla actual; CONTINUE.md; PR; pedir al dueño OK para aplicar 0115/0116 y
  para el merge (no hacerlo sin ese OK en el momento).

### 2026-09-26 — sesión 2 — la capa del juego en escena, jugada con input real
- Commits `8c0fe7e` (escena), `5a40092` (HUD, rig propio de personajes, fuentes de
  agua), `dcadcac` (obras atadas a la historia, strings a messages, tanque antes).
- Bot con input real (`playgame.mjs`): habla con Don Beto, junta, separa, habla
  con Inés, construye la compostera parándose en la plataforma, la carga.
- Arreglado por lo que mostró el bot: `-0` que CDP no serializa (harness); la
  plataforma del vivero se comía los materiales (D7); Inés parada sobre esa
  plataforma (movida); faltaban ramas el día 1 (invasoras leñosas dan ramas; el
  faro lleva a lo que falta); fichas sin sujeto en la voz de los personajes; 4
  avisos a la vez (ahora 2 y el resto en cola); el panel de estación tapaba la
  estación (`Framing`: cámara que la encuadra arriba; caminar cierra el panel).
- Después (`ecf1c6b` + commit siguiente): flora plantada por especie y etapa
  (`planted.ts`, `Planted.tsx`) — HECHO y visto de cerca; El Ceibo (`ceibo.ts`,
  `Ceibo.tsx`, `useCeiboGreeting`) — HECHO; `Framing` (cámara en paneles/charlas,
  caminar cierra); ids de agua unificados; Escape cierra panel de estación y
  hoja de la isla (el bot quedaba trabado ahí: era la causa del "atascado en la
  compostera"). Tanque probado con bot: ordena → ramas → construye → "Suelo vivo".
- **(Superado por la sesión 3, ver arriba.)**
  1. `lib/render/materials/built.ts` + `surface()` en `build.ts`/`carpentry.ts`/
     `smoothRock`: veta de madera, piedra, metal, tela, plástico reciclado en el
     shader (`built: true` en Props, Stations, Ceibo). **Compila; falta verlo**:
     rebuild + `scratchpad/props.mjs 11 props1` (usa `?props=1` y `__frame`).
  2. `lib/render/geometry/props-shop.ts`: 11 modelos de decoración nuevos
     escritos, **sin registrar**: falta sumarlos a `BUILDERS`/`PROP_SPECS` en
     `props.ts` (footprints; `farol_solar` animates 'lantern'), mensajes
     `mundo.props.<slug>` en es/en, y revisarlos de cerca.
  3. Falta `props-habitat.ts`: posadero, bebedero, hotel_chico, caja_nido,
     refugio_ranas, pirca — y dibujar el hábitat de cada parcela floreciente (`ps.hab`).
  4. Colocación con inventario del juego: HECHA en código (`limits`, `none_left`,
     bandeja con ×n) — probar cuando existan los modelos.
  5. Revisar texturas 32–34 / materiales 15 en el overlay (techo 12/20 y 8).
  6. Luego: F3 jugar el resto de cadenas con el bot; F5 tarjeta "Descubriste";
     F6 móvil, pósters, PR, pedir OK para 0115/0116 y merge.

### 2026-09-25 — sesión 1 (cont.) — núcleo del juego
- F0 hecho: póster (causa medida: leer el canvas desde `useFrame` = búfer ya
  borrado, brillo 0), pósters por defecto reales, `/mundo` sin rebote, sección.
- Núcleo `lib/world/game/` escrito y commiteado (`771ceef`). **Cambios de diseño
  que forzó la simulación** (todos ya en el código y en esta sección):
  1. El **Punto Limpio ya está construido** al llegar (es de Don Beto). Sin eso,
     el día 1 se bloqueaba: mochila llena de residuos y sin lugar para las ramas.
  2. **Mochila vs. galpón**: la mochila (con límite) es sólo lo que se junta del
     piso (residuos, orgánicos, ramas, piedras, frutos); lo que se *hace*
     (compost, reciclado, plantines) va al galpón, sin límite.
  3. **Vender a Don Beto** lo que sobra (barato): la válvula que evita cualquier
     mochila trabada. Los residuos no se venden: se separan.
  4. **Crecer lleva días**: riegos en días distintos + días desde plantar, según
     ambiente (pradera 2/2, bosque 3/4, humedal 0/2 — "el humedal no se riega").
     Florecer pide 3 días viva + 3 especies + un hábitat.
  5. **Cuidado diario** (~24% de las parcelas vivas: rebrote de invasora,
     pulgones, basura del viento, sed). Nunca hace retroceder: sólo guarda la
     fruta hasta que la atiendas.
  6. **Estrellas de biodiversidad** (hasta 3 por parcela floreciente: 4.ª, 5.ª y
     6.ª especie) y **plantas descubiertas por división** (16 nativas nuevas): el
     eje real se nota cada ~10 días.
  7. Frutos cada dos días por parcela, cosechar no paga semillas, venta barata:
     antes se llegaba al tope de 400/día desde el día 15.
- Resultado (bot, 30 min/día): 60–170 semillas/día; cada subida de nivel da
  días de trabajo; un veterano de nivel 7 tiene semanas; nivel 11, meses.
- **Próximo:** F1 resto — `useGameStore` + guardado local/servidor + migración
  `0115`; después F2 escena (recolectables, plataformas, parcelas en el mapa).

### 2026-09-25 — sesión 1
- Análisis completo del estado (sección 2). Póster del dueño verificado negro.
  Bandera: `mundo_game_enabled=false`, allowlist `[dueño]`. Última entrada del
  dueño a `/mundo`: 2026-09-21 23:37 UTC (tier 4, 13.798 XP).
- Rama `claude/mundo-juego` desde `origin/main`.
- Plan escrito (este archivo).
