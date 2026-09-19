# BROTE — NEGOCIOS · Carpeta de entrega

> **Qué es esto.** El paquete completo para incorporar empresas a Brote, dividido en
> **5 fases de desarrollo**. Al terminar la Fase 5 no queda nada pendiente.
>
> **Regla absoluta de esta carpeta:** este material describe *código nuevo a escribir*.
> Fue redactado leyendo el repo `Brote` sin modificar un solo carácter de él.

---

## 0. Cómo usar esta carpeta

### Para vos (el dueño)

Le decís al agente de código, literalmente:

```
Leé brote-negocios/00_LEEME.md y brote-negocios/fases/FASE_1_FUNDACIONES.md.
Ejecutá la Fase 1 completa. No empieces la Fase 2.
```

Y cuando termine y lo hayas probado:

```
Ejecutá la Fase 2. Leé primero 00_LEEME.md, 02, 03, 04 y fases/FASE_2_MEJORA.md.
```

Y así hasta la 5.

### Para el agente de código

**Antes de escribir una línea de la fase N, leé en este orden:**

| Siempre | `00_LEEME.md` · `02_ESPECIFICACION.md` · `03_ARQUITECTURA.md` · `04_ESQUEMA_DB.md` |
|---|---|
| Siempre (del repo) | `BROTE_DESIGN_SYSTEM.md` — es vinculante, no decorativo |
| Fase 2 | `05_ALGORITMOS.md` · `06_PROMPTS_IA.md` · `referencia/CATALOGO_PALANCAS.md` |
| Fase 3 | `05_ALGORITMOS.md` · `06_PROMPTS_IA.md` · `referencia/RUBRICA_EVIDENCIA.md` · `referencia/CERTIFICACIONES.md` · `08_LEGAL_Y_CONFIANZA.md` |
| Fase 4 | `09_MONETIZACION.md` · `08_LEGAL_Y_CONFIANZA.md` |
| Fase 5 | `referencia/QA_MATRIZ.md` · todo lo anterior |
| Diseño | `07_DISENO_UI.md` en toda fase que toque pantallas |

**Al terminar cada fase**, actualizá `CONTINUE.md` e `IMPROVEMENT_PLAN.md` del repo
siguiendo la convención que ya usan (fase `F16`, ver Fase 5).

---

## 1. Qué se está construyendo, en una página

Brote hoy es una PWA de acción ambiental para **personas**: acciones diarias, rachas,
rangos, mundo 3D, ligas, feed. Este trabajo agrega un **segundo tipo de habitante**:
la **empresa**.

Una empresa entra a Brote y obtiene dos cosas, y solo dos:

### A · Mejora — su programa de objetivos

Un espacio **formal**, sin juego, sin plaza, sin acciones diarias, sin racha, sin
mundo 3D, sin puntos. La empresa describe qué hace; una IA le propone **objetivos de
mediano y largo plazo** (trimestrales, semestrales, anuales) con **números concretos,
método de medición y evidencia de cierre**. La empresa responde ("no llego a eso",
"eso ya lo hago") y el plan se **replanifica**. Los objetivos son **chicos en esfuerzo
y reales en efecto**: como máximo ~6 h de trabajo por mes cada uno, ~12 h en total.
Nunca se convierten en la tarea principal del negocio.

### B · Mercado — su vidriera

La empresa publica **listados** de productos y servicios. Brote **no vende, no cobra
al consumidor, no maneja stock ni envíos**: el usuario que toca un listado sale hacia
el sitio o el canal de venta de la empresa. Cada listado declara **afirmaciones
ambientales tipificadas** (orgánico, reciclable, local/estacional…) y cada afirmación
tiene un **nivel de evidencia**. El nivel no censura: **ordena**.

### El puente entre las dos

Muchas acciones diarias de Brote son de sustitución ("evitá comida de supermercado",
"comprá a granel"). Esas acciones muestran, de forma discreta, **dónde conseguirlo**
apuntando al Mercado. Es la razón por la que a una empresa le conviene estar acá y no
en un directorio cualquiera: llega a alguien que en ese momento está intentando hacer
exactamente eso.

---

## 2. Las siete decisiones que no se discuten

Están acá arriba porque son las que, si se rompen, hunden el proyecto. Todo el resto
de la carpeta es consecuencia de estas.

**D1 · Brote nunca es vendedor.** Ni carrito, ni precio cobrado por nosotros, ni
stock, ni envío, ni pago del consumidor, ni intermediación de la transacción. Salida
por interstitial hacia el sitio de la empresa. Esto es lo que nos mantiene fuera de la
cadena de comercialización del art. 40 de la Ley 24.240 (`08_LEGAL_Y_CONFIANZA.md`).

**D2 · La evidencia es por afirmación, no por empresa.** Que una panadería tenga
certificación orgánica en su harina **no** vuelve creíble su línea de limpieza. El
nivel viaja pegado al *claim*, no al logo. Es el mecanismo antihalo y es el corazón
de la integridad del sistema (`05_ALGORITMOS.md` §3).

**D3 · El nivel bajo no oculta: ordena.** Un negocio nuevo publica desde el día uno,
etiquetado con honestidad ("declarado por el comercio") y con un **empujón temporal de
exploración** para que reciba impresiones reales. Lo único que saca un listado del
catálogo es una **violación de afirmación**, no la falta de trayectoria. Sin esto no
hay oferta, y sin oferta no hay mercado.

**D4 · La IA propone, la evidencia decide, vos aprobás.** Gemini puntúa, redacta y
explica. Nunca otorga un nivel, nunca publica, nunca cierra un objetivo. El nivel sale
de documentos verificables; la publicación sale de tu clic en `/panel`.

**D5 · Sin clave de Gemini, todo funciona igual.** Hoy el proyecto **no tiene
`GEMINI_API_KEY` seteada** (pendiente F4.5 del plan del repo). Cada camino con IA lleva
un camino determinista equivalente basado en reglas y en la biblioteca de palancas,
marcado `sin_ia`. La IA es una mejora de calidad, nunca una dependencia dura.

**D6 · La vista de empresa es otra app.** Layout propio: sin BottomTabBar, sin FAB de
Pip, sin mundo, sin racha, sin puntos, sin publicidad. Formal, denso, tabular. Un
usuario nunca "cae" en la vista de empresa por accidente ni al revés.

**D7 · Menores nunca.** Las cuentas `kid` y `teen` no crean ni integran empresas, no
ven superficies comerciales del Mercado, y jamás reciben publicidad de negocios. Es
coherente con la postura que el proyecto ya sostiene en feed, noticias y ads.

---

## 3. Nombres y colisiones (leer sí o sí)

El repo **ya usa** varios de estos nombres para otra cosa. Confundirlos rompe features
existentes.

| Ya existe en el repo | Significa | NO confundir con |
|---|---|---|
| `/competencias`, tabla `competitions` | Competencias **entre personas** (F12.4) | El programa **Mejora** de empresas |
| tabla `organizations` | Escuelas, clubes, familias (F12.1) | La tabla **`businesses`** |
| `profiles.plan`, `subscriptions` | Brote+ de **personas** (F13) | **`business_subscriptions`** |
| `/panel` | Consola de admin existente | Se **extiende**, no se reemplaza |
| `lib/ads/policy.ts` | Política de AdSense | El ranking del Mercado |

**Nombres nuevos, definitivos:**

- **Mercado** — el catálogo público. Rutas `/mercado/*`.
- **Mejora** — el programa de objetivos. Rutas `/negocio/mejora/*`.
- **Negocio** — el espacio de trabajo de la empresa. Rutas `/negocio/*`.
- **Nivel de Evidencia** — E0…E4. Nunca "rango" (eso es de personas).
- **Palanca** — una acción de mejora del catálogo (`referencia/CATALOGO_PALANCAS.md`).

---

## 4. Idioma

- **Prosa técnica de esta carpeta:** español.
- **Copy de producto:** español rioplatense con voseo, **literal y entre comillas** en
  los documentos. Copiálo tal cual: ya está escrito en la voz de Brote.
- **Código, columnas, enums, rutas:** en español sin acentos (`negocio`, `mejora`,
  `evidencia`), consistente con lo que el repo ya hace (`acciones`, `competencias`).
- **i18n:** todo string nuevo entra por `messages/es.json`. El `en` queda andamiado
  como ya está hoy en el proyecto.

---

## 5. Las 5 fases

| # | Nombre | Entrega | Se puede probar sola |
|---|---|---|---|
| 1 | **Fundaciones** | Empresa como entidad, membresías, cambio de contexto, shell de negocio, alta + verificación de identidad, cola de revisión en `/panel` | Sí — crear una empresa y aprobarla |
| 2 | **Mejora** | Dossier, motor de objetivos con IA, ciclo de vida, replanificación con feedback, evidencia de cierre, niveles por progreso | Sí — recibir objetivos y cerrar uno |
| 3 | **Mercado** | Listados con afirmaciones tipificadas, validador, motor de evidencia, algoritmo de orden, catálogo público, salida legal, reportes | Sí — publicar y encontrar un producto |
| 4 | **Integración y cobro** | Puente acciones↔Mercado, analítica para la empresa, suscripción MercadoPago, gating de plan, notificaciones | Sí — cobrar y ver el retorno |
| 5 | **Endurecimiento y lanzamiento** | Auditoría RLS, legales, semilla y arranque en frío, performance, accesibilidad, QA, manual del dueño | Sí — es el checklist de salida |

**Dependencias:** estrictamente secuencial. La Fase 3 no compila sin las tablas de la
Fase 1. La Fase 4 no tiene qué medir sin la 3.

---

## 6. Índice de la carpeta

```
brote-negocios/
├── 00_LEEME.md                    ← estás acá
├── 01_INVESTIGACION.md            evidencia externa y por qué cada decisión se sostiene
├── 02_ESPECIFICACION.md           el producto completo, funcionalidad por funcionalidad
├── 03_ARQUITECTURA.md             rutas, contexto, layouts, RLS, límites del sistema
├── 04_ESQUEMA_DB.md               esquema completo + SQL de migración por fase
├── 05_ALGORITMOS.md               niveles de evidencia, orden del catálogo, realismo de objetivos
├── 06_PROMPTS_IA.md               biblioteca de prompts Gemini, lista para producción
├── 07_DISENO_UI.md                pantalla por pantalla dentro de "Bitácora Viva"
├── 08_LEGAL_Y_CONFIANZA.md        postura legal, copy de badges, descargos, moderación
├── 09_MONETIZACION.md             planes, MercadoPago, gating, gracia, precios
├── fases/
│   ├── FASE_1_FUNDACIONES.md
│   ├── FASE_2_MEJORA.md
│   ├── FASE_3_MERCADO.md
│   ├── FASE_4_INTEGRACION_Y_COBRO.md
│   └── FASE_5_ENDURECIMIENTO_Y_LANZAMIENTO.md
└── referencia/
    ├── RUBRICA_EVIDENCIA.md       las 16 afirmaciones y qué prueba cada nivel
    ├── CERTIFICACIONES.md         registro de certificaciones reconocidas
    ├── CATALOGO_PALANCAS.md       biblioteca de palancas por rubro con efectos reales
    └── QA_MATRIZ.md               matriz de pruebas
```

---

## 7. Presupuesto: cero

Todo lo de acá corre en las capas gratuitas que el proyecto ya usa.

| Recurso | Uso nuevo | Techo gratuito | Margen |
|---|---|---|---|
| Supabase Postgres | ~14 tablas, volumen bajo | 500 MB | Enorme |
| Supabase Storage | Documentos de evidencia, logos | 1 GB | Requiere límite por archivo: **5 MB**, y compresión de imágenes con el `lib/utils/image-compress.ts` que ya existe |
| Supabase Edge Functions | 4 funciones nuevas | 500k inv./mes | Enorme |
| Gemini API | Ver presupuesto en `06_PROMPTS_IA.md` §1 | 1.500 req/día (2.5 Flash) | Usamos < 50/día con 100 empresas |
| Vercel | Rutas nuevas del mismo proyecto | Hobby | Sin cambio |
| MercadoPago | Comisión por cobro | — | Sale del ingreso, no del bolsillo |

El único costo variable real es el **tuyo**: aprobar altas y cierres de objetivos.
El sistema está diseñado para que eso sea **leer un puntaje y un resumen de IA y tocar
un botón**, con un objetivo de **menos de 2 minutos por empresa**.

---

## 8. Qué NO está en el alcance

Dicho explícitamente para que nadie lo agregue por iniciativa propia:

- Cobrar al consumidor, carrito, checkout, envíos, devoluciones.
- Reseñas y estrellas de usuarios sobre negocios en la v1 (llega en el backlog de
  Fase 5 §7 con su diseño antifraude; abrirlo antes es regalarle al sistema su primer
  vector de abuso).
- Chat entre usuario y empresa.
- App nativa, o cualquier cosa que requiera tienda de aplicaciones.
- Empresas fuera de Argentina (el esquema lleva `pais` desde el día uno para no
  bloquear el futuro, pero la v1 valida `AR`).
- Certificar nosotros mismos nada. Brote **constata evidencia de terceros**; no emite
  certificaciones propias. La diferencia es legal, no semántica.
