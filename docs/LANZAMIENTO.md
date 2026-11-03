# Brote — Lanzamiento al público

> Rama `claude/lanzamiento` (cortada de `origin/main` d11e59e, 2026-10-14).
> **Toda sesión que retome este trabajo lee este archivo primero**, sigue desde la
> primera casilla sin marcar y actualiza las casillas y el diario (§9) antes de cortar.
> Migraciones nuevas desde `0126`. La base viva llega hasta `0140` (aplicada y verificada el 2026-11-02).

## 0. El pedido (2026-10-14), tal cual

1. Rehacer el estilo del **login y el onboarding**: mejor calidad, más fiel al tema.
2. **Analítica en el panel**: cuántos usuarios, quién usa qué, todo lo posible para medir y mejorar.
   Y: el dueño **olvidó la contraseña del panel** → decirle cómo resolverlo.
3. **Notificaciones reales**: que lleguen de verdad (salvar la racha, algo nuevo en la Plaza, lo necesario).
4. **Todas las suscripciones** funcionando: Brote+ (personas), el Mercado (tiendas) y las PyMEs que mejoran.
5. En el panel, una sección para publicar **desafíos/requisitos para PyMEs** y entregar **certificados**
   a las que cumplen. Dejar varios hechos, razonables.
6. **Avisos para el dueño**: notificaciones reales en su cuenta vinculada al panel cada vez que algo
   necesita su acción (una propuesta de empresa, etc.).
7. **Rehacer el sistema de rangos**: semanal o mensual, fácil de cambiar de uno a otro; se puede
   mantener un rango, pero nadie está arriba sin hacer el trabajo de ese rango; cada rango
   representa un tipo de persona que cuida el ambiente.
8. **Pulido final**: que todo siga funcionando, lista para abrir al público y aguantar el uso.

## 1. Lo que encontré antes de empezar (estado real, no supuesto)

- 6 usuarios, todos con onboarding. **0 suscripciones push** y 0 notificaciones en 7 días.
- Push: el trigger `notify_push` llama a `send-push` **una vez por notificación** con la anon key, y
  `send-push` acepta `{user_id, title, body, url}` de cualquiera → **cualquiera con la anon key
  (pública) puede mandar un push con cualquier texto a cualquier usuario**. Además `system` (el
  resumen semanal) no está en la lista de tipos que se empujan, y no hay aviso de racha en riesgo a
  la noche (solo el de racha perdida a las 00:05).
- No hay claves VAPID verificables desde acá (sin acceso a env de Vercel ni secretos de funciones).
- Supabase **plan free**: 200 conexiones Realtime simultáneas, 500 MB de base, 500k invocaciones de
  edge functions/mes. Todo lo nuevo se diseña para eso (sin eventos crudos sin límite, sin una
  invocación por notificación, Realtime con plan B).
- Panel: contraseña con sal + SHA-256 en `admin_config`, bloqueo tras 8 intentos. **No está atada a
  ninguna cuenta**: con la contraseña se entra desde cualquier cuenta, y si se olvida no hay
  recuperación salvo SQL.
- Rangos: 11 rangos de por vida por XP (Semilla→Gaia), nunca bajan, y **mueven el mundo 3D**. Hay
  además ligas semanales (`user_leagues`, 6 niveles, top 4 suben) y tableros "Esta semana".
  `simulated_players_enabled = true`: los tableros públicos muestran 80 jugadores inventados.
- Brote+: `mp-subscribe` y `mp-webhook` existen sólo como edge functions vivas (no están en el repo);
  `mp-webhook` tiene Verify JWT prendido, así que MercadoPago no puede llamarla. El webhook de
  Next (`/api/pagos/mercadopago/webhook`) ya atiende personas y empresas. No hay forma de cancelar
  Brote+ desde la app.
- Empresas: planes semilla/raíz/bosque (0108) con precios en 0 y `negocios_cobro_activo = false`
  (modo fundador); tiendas con plan `vendedor` USD 5 (0114). Datos DEMO todavía en producción.
- Login: sin "olvidé mi contraseña". Onboarding: `persist()` ignora los errores de guardado.

## 2. Decisiones (las que cambian el producto)

> **Corrección del dueño, 2026-11-02.** D1, D2, D3 y D5 quedaron reemplazadas por §2a: el rango es el de
> los puntos totales, y las ligas semanales vuelven y son lo más importante.

- **D1 · Dos escaleras, una por cosa.** El **Nivel** (Semilla→Gaia, por XP de por vida) queda como
  está: mueve tu mundo y nunca baja — perder mundo por una semana floja sería castigar lo que la
  gente construyó. El **Rango** pasa a ser por período (semana o mes) y dice qué tipo de persona
  que cuida el ambiente fuiste en ese período. Es el modelo nivel de cuenta + rango competitivo.
- **D2 · Los siete rangos** (sustantivos que sirven para cualquier persona):
  1 Aprendiz · 2 Practicante · 3 Ambientalista · 4 Referente · 5 Agente de cambio · 6 Guía · 7 Faro.
  Requisitos por semana (en un mes se prorratean por días): días activos, acciones (máx. 6 por día
  cuentan), temas distintos, acciones con impacto medido, comunidad, aprendizaje. Guía y Faro
  además piden haber tenido el rango anterior el período previo: nadie llega arriba de un salto.
- **D3 · Mantener sin regalar.** Al cerrar el período: rango nuevo = el más alto cuyos requisitos
  cumpliste. Si no llegaste al tuyo pero sí al de abajo, lo conservás **una vez** (margen); el
  período siguiente sin cumplirlo, bajás — como mucho dos rangos por período, así una semana de
  vacaciones no te tira al fondo, pero nadie se queda arriba sin hacer el trabajo. Nada se paga:
  Brote+ no protege rangos.
- **D4 · Cambiar semana ↔ mes** es un valor en el panel; se aplica desde el próximo período, sin
  romper el que está en curso.
- **D5 · Las ligas viejas se retiran**: "tu liga" pasa a ser el tablero de la gente de tu mismo rango
  en este período.
- **D6 · Push sin invocación por notificación**: las notificaciones entran a una cola
  (`push_estado`), un cron por minuto la vacía. Tope de invocaciones fijo (~43k/mes), horario de
  silencio 22–9 h (lo no urgente espera a las 9), tope de 2 avisos de enganche por día por persona.
  `send-push` sólo manda notificaciones que existen en la base: no acepta textos de afuera.
- **D7 · Claves VAPID sin paso del dueño**: si no hay secretos, `send-push` genera el par la primera
  vez y lo guarda en una tabla sin acceso desde el cliente; la clave pública se pide por RPC. Si el
  dueño pone secretos, ganan los secretos.
- **D8 · Panel atado a cuentas**: tabla `brote_admins`. Con al menos una cuenta vinculada, la
  contraseña sola ya no alcanza: hace falta además estar con una de esas cuentas. Recuperar la
  contraseña desde una cuenta vinculada con sesión reciente (≤ 15 min).
- **D9 · Analítica agregada al entrar**: nada de eventos crudos eternos. Cada evento suma en
  `uso_diario (dia, usuario, clave)`; con eso salen DAU/WAU/MAU, retención, quién usa qué, embudos.
  Retención de 400 días; las cuentas de chicos sólo cuentan secciones.
- **D10 · Certificados Brote** son distintos del nivel de evidencia de los listados y de las
  certificaciones de terceros: los emite Brote por cumplir un desafío, tienen código público
  verificable, vencen al año y se pueden revocar.
- **D11 · Cobro**: un solo webhook (Next) y credenciales en un solo lugar (Vercel). Brote+ deja de
  depender de `mp-subscribe`. Precios en el panel; cada producto con su interruptor de venta.

## 2a. Rango y liga (0142, reemplaza D1, D2, D3 y D5)

- **Rango** (Semilla → Gaia): por puntos totales, nunca baja, mueve el mundo. Se llama rango en toda la app.
- **Liga**: un ranking que se mide cada semana. Son siete, con los nombres de "tipo de persona" que pidió el
  dueño en octubre (se editan en `/panel/ligas`). El dueño pidió que mantenerse o subir no sea difícil ni
  regalado, y que lo pueda lograr cualquiera con esfuerzo: por eso la regla principal son metas de puntos, y
  que suba otra persona nunca te impide subir a vos.

| Liga | Para seguir | Para subir | En acciones (unos 70 puntos cada una) |
|---|---|---|---|
| Aprendiz | no se baja | 150 | 2 o 3 |
| Practicante | 100 | 300 | 2 para seguir, 5 para subir |
| Ambientalista | 200 | 500 | 3 y 7 |
| Referente | 350 | 750 | 5 y 11 |
| Agente de cambio | 500 | 1.000 | 7 y 15 |
| Guía | 700 | 1.300 | 10 y 19 |
| Faro | 900 | es la última | 13 |

- **Al cerrar** (domingo a medianoche): con la meta, subís una; con menos que el piso, bajás una; en el medio,
  seguís. De a una por semana: nadie llega arriba de un salto.
- **Los primeros:** en un grupo de 10 o más, los 3 primeros también suben si llegaron a su piso.
- **Puntos:** todo lo que suma a `total_xp`, hasta 400 por día. Un solo día de empujón no alcanza.
- **Grupos:** de hasta 30, se entra al sumar el primer punto de la semana. Chicos y cuentas de prueba se miden
  contra sus metas y no aparecen en ninguna tabla. Los jugadores simulados no entran: la liga mueve algo real.
- **Arranque:** todos en Aprendiz. El dueño puede poner a alguien en una liga desde su ficha.

## 2b. Proyectos por liga — las reglas

Sumarse es libre, sea cual sea tu liga (sólo los chicos no, porque son encuentros en persona). Crear y manejar
uno pide una liga alta, para que nadie arme proyectos para farmear puntos.

- **Cupo:** Aprendiz, Practicante y Ambientalista 0 · Referente 1 · Agente de cambio 2 · Guía 3 · Faro 5.
  Mira la liga en la que estás: subir se gana al cierre.
- **Jornadas:** cerrar una es lo que reparte puntos. Una por proyecto por día, 3 por organizador por semana,
  ninguna con el proyecto en pausa; y los puntos cuentan con el tope diario de la liga.
- **Si bajás:** nada se corta. Quien se sumó conserva su lugar. No podés abrir otro hasta tener cupo.
  Siguen en regla los más próximos; los que sobran tienen 28 días de gracia, con un aviso.
- **Pasada la gracia:** en pausa (fuera de las listas, sin gente nueva, con aviso a quienes están), salvo
  que tenga fecha dentro de 14 días. Volver al rango lo reabre solo. Nada se borra.
- **En cualquier momento:** se le puede pasar a una persona adulta que se sumó y tiene cupo.
- **Arranque:** la revisión de la noche empieza el 23 de noviembre: lo más rápido que se llega a Referente son
  tres cierres (9, 16 y 23). Antes de eso nadie podría cumplir.

## 2c. Empresas: primero la solicitud (0143)

Antes ninguna solicitud llegaba al panel, porque ninguna empresa pasaba por `submitted`: la que mejora nacía
aprobada y la tienda se abría sola al pagar. Ahora las dos hacen lo mismo:

1. Elige qué quiere y manda un formulario corto con lo necesario para ver que es real.
2. Queda `submitted`: el dueño recibe el aviso y la solicitud aparece en `/panel/negocios`. Quien pide ve "en
   revisión" y nada más; cada RPC lo vuelve a frenar en la base.
3. El dueño aprueba, pide datos o rechaza. Con datos pedidos se corrige y se reenvía; rechazada, a los 30 días.
4. Recién aprobada se arma: la tienda con compromiso, prueba verde y Mercado Pago (abrir sigue siendo
   `activa_at`, con el primer cobro); la empresa con su diagnóstico y objetivos.

## 2d. Datos de demostración (0141)

`simulated_players_enabled` manda sobre todo lo que no es real: jugadores simulados, tiendas y productos DEMO,
proyectos de ejemplo. Apagado desaparece de una, prendido vuelve igual, nada se borra. Está en `/panel/ajustes`.

## 3. Fases y casillas

### F1 · Login y onboarding
- [x] Login nuevo: panel de marca (tinta, Pip, titular con el degradado, números reales vía RPC
      pública), pestañas Entrar/Crear cuenta con píldora deslizante, mostrar/ocultar contraseña,
      errores de Supabase traducidos, enlace mágico como alternativa.
- [x] Olvidé mi contraseña: pedir enlace + `/auth/nueva-clave` para fijarla.
- [x] Onboarding: barra de progreso con "Paso N de M", CTA fijo abajo con safe-area, pasos con la
      misma estructura, guardado que **sí** reporta errores, paso final con la primera acción y el
      pedido de avisos ("¿Te avisamos antes de que se corte tu racha?").
- [x] Capturas a 390 px y 1280 px, claro y oscuro.

### F2 · Panel: cuentas, contraseña y analítica
- [x] `brote_admins` + `admin_check` que exige cuenta vinculada cuando hay alguna + vincular cuenta +
      recuperar contraseña con sesión reciente. Texto para el dueño (cómo volver a entrar hoy).
- [x] `uso_diario` + `registrar_uso()` + rastreador en el cliente (secciones y eventos clave).
- [x] `admin_analitica(p_pass, p_dias)`: usuarios, altas, DAU/WAU/MAU, retención por cohortes,
      embudo, secciones, eventos, tipos de cuenta, ciudades, plataformas, avisos, planes, rachas,
      rangos, top acciones, Academia, Plaza, Mercado; ficha por usuario.
- [x] `/panel/analitica` con gráficos (recharts), tablas y exportar CSV.
- [x] Bandeja "Pendientes" arriba del panel (todas las colas con su número).

### F3 · Notificaciones reales
- [x] Cola de push (`push_estado`, `push_programada_at`), trigger nuevo, `send-push` v2 (por id,
      drenado, VAPID propia), cron por minuto. Cerrar el agujero del push con texto libre.
- [x] Tipos nuevos: `racha` 20 h, `plaza` (novedades de gente que seguís), `rango` (cierre de
      período), `recap` empujado, `reenganche` (3 y 14 días), `admin`, `empresa`.
- [x] Preferencias por categoría + horario de silencio en Ajustes; tope diario de enganche.
- [x] Pedido de permiso en buenos momentos (primera acción, Inicio una vez, Ajustes) y guía para
      iPhone (sólo con la app instalada).
- [x] Realtime con plan B (si el canal falla, consulta cada 60 s) por el límite de 200 conexiones.

### F4 · Avisos para el dueño
- [x] `brote_avisar_admins()` y enganches: alta/verificación de empresa, listado a revisar, cierre de
      objetivo, compromiso, reporte de contenido, entrega de desafío, alta/baja/fallo de pago de
      cualquier suscripción, errores del mundo en racha, hitos de usuarios. `notificar_revisores`
      pasa a ir a las cuentas admin.

### F5 · Suscripciones
- [x] Brote+ mensual y anual por servidor (Next), cancelar desde la app, estado y próximo cobro,
      interruptor de venta y precios en el panel. Revisar cada beneficio: lo que no existe no se
      promete.
- [x] Tiendas (vendedor) y Empresas (semilla/raíz/bosque): revisar el circuito completo contra el
      webhook unificado.
- [x] `/panel/suscripciones`: estado de la configuración (sin mostrar secretos), precios, altas,
      bajas, en gracia, ingresos mensuales estimados por producto, lista.

### F6 · Desafíos y certificados para PyMEs
- [x] Tablas, RPC y RLS: desafíos, inscripciones, evidencias, certificados.
- [x] Panel: crear/editar/publicar desafíos, cola de entregas, aprobar/observar/rechazar, revocar.
- [x] Empresa: `/negocio/desafios` (lista, detalle, inscribirse, subir evidencia, enviar, estado).
- [x] Certificado: página pública `/certificados/[codigo]`, versión imprimible, sello SVG.
- [x] Sembrar ~15 desafíos razonables por categoría y nivel.

### F7 · Rangos por período
- [x] Tablas `rangos`, `rango_periodos`, `rango_usuario`, `rango_historial`, `rango_puntos`
      (mantenida por trigger), funciones de métricas, cierre, `mi_rango()`, tableros del período.
- [x] Cron diario de cierre (`brote-rangos-cerrar`); RPC del panel (`admin_rangos`, `admin_rango_guardar`, `admin_rango_periodo`) y su pantalla `/panel/rangos`.
- [x] UI: tarjeta "Tu rango" con requisitos y progreso, `/ranking` nuevo (este período: global,
      ciudad, amigos, tu rango; historial), chip de rango en perfil; "rango" → "nivel" donde se
      habla de la escalera de por vida.
- [x] Tests espejo (TS ↔ SQL) de requisitos y prorrateo (`lib/rangos.ts`, `lib/rangos/__tests__`).

### F8 · Pulido y lanzamiento
- [x] Errores del cliente a `app_errores`, visibles en `/panel/salud`.
- [x] Asesores de Supabase revisados sobre lo nuevo; índices.
- [x] Prueba de carga en el banco PGlite (`test_carga.sql`, 8.000 personas, 160.000 acciones). Lo de la gente
      responde en menos de 50 ms; `admin_analitica` tardaba 148 s por un nested loop de 1.290 millones
      de comparaciones → 0140 (1,1 s y 2,8 s). No se probó contra la base viva: tiene 6 personas.
- [x] `npm run typecheck`, `npm test` (652), `npm run build`, lint.
- [x] Capturas del panel y de `/ranking` (compu y teléfono, claro y oscuro, lleno y casi vacío) contra datos inventados.
- [ ] Lista del dueño (§8) y pedido único de luz verde: migraciones, funciones, merge.

### F10 · El panel de nuevo, sólo con tu cuenta (pedido del 2026-11-01)
- [x] 0136: `admin_check` ignora la contraseña y mira la cuenta (`brote_es_admin(auth.uid())`). Un
      intento de otra cuenta queda en `panel_intentos` (con tope) y te avisa. `app/panel/layout.tsx`
      corta en el servidor: sin sesión va al login, otra cuenta recibe un 404.
- [x] El bug de los certificados: `/panel/desafios` llamaba a una función que no existía todavía
      (0132 sin aplicar) y el fallo se trataba como contraseña mala. Ahora los fallos se dicen.
- [x] Fuera del contenedor de la app (`app/panel/*`), con menú agrupado, pendientes en vivo, cajón en
      el teléfono y un solo kit de piezas (`components/panel/ui.tsx`).
- [x] Secciones nuevas: Resumen, Analítica en pestañas, Personas y ficha (suspender, regalar Brote+),
      Rangos, Moderación, Proyectos, Academia, Salud, Avisos, Ajustes. 0138 agrega lo que faltaba.
- [x] 0140: la analítica aguanta miles de personas (ver F8).

### F11 · Proyectos por liga (pedido del 2026-11-01)
- [x] 0137 + 0139: cuántos proyectos se pueden organizar a la vez lo decide el rango del período, no
      el nivel de por vida. Reglas en §2b. Editable en `/panel/proyectos`.
- [x] Cliente: `proyecto_cupo`, formulario y bloqueos por `min_rango`, aviso de gracia o pausa y
      pasarle la organización a alguien (`components/plaza/OrganizarProyecto.tsx`).

### F13 · Ligas, solicitudes y demo (pedido del 2026-11-02)
- [x] 0142: vuelve el rango por puntos totales y las ligas semanales (§2a). `/ranking` con tu liga y tu grupo,
      `/panel/ligas`, la liga en `/panel/personas/[id]` y `/panel/pruebas`.
- [x] 0142: sumarse a proyectos es libre; crear y manejar pide liga; las jornadas tienen tope (§2b).
- [x] 0143: la solicitud primero, igual para los dos planes, con aviso al dueño (§2c).
- [x] 0141: las tiendas DEMO no se borran: quedan bajo el interruptor de demostración (§2d).
- [x] La ventana centrada (`components/ui/sheet.tsx`) quedaba corrida: framer-motion pisa el `translate` de
      Tailwind. Afectaba al editor de desafíos y a la salida del Mercado.
- [x] Las fechas sin hora del panel mostraban el día anterior (`fecha` en `components/panel/ui.tsx`).
- [ ] 0144 limpia lo que quedó sin uso: se aplica después del deploy.

### F12 · Lecciones en blanco (pedido del 2026-11-01)
- [x] Causa: `AnimatePresence mode="wait"` en `components/academia/Jugador.tsx`. Las fichas con
      `layoutId` (clasificar, ordenar, cadena, ranking) registran su salida y a veces nunca la cierran:
      el paso viejo quedaba en opacidad 0 y el nuevo no se montaba. Se sacó, cada paso tiene su
      `LayoutGroup` y su `PasoSeguro`. Hay un test que lo cuida.
- [x] Revisados los 7.381 pasos en el navegador (sin caídas ni pantallas vacías) y 1.701 sesiones
      contra el SQL, deshechas después (22.383 pasos corregidos bien).

### F9 · Publicidad (pedido del 2026-10-16) — guía del dueño en `docs/PUBLICIDAD.md`
- [x] 0134: el interruptor `ads_enabled` por fin se lee (nace apagado; antes ninguna migración lo
      creaba), reglas en `publicidad_config` (topes, días de gracia, lugar por lugar y quién lo llena),
      anuncios directos con sorteo por peso, provincias, público, fechas y tope de vistas; métricas
      sin identificar a nadie; `/api/anuncio/[id]` cuenta el clic y redirige con UTM.
- [x] Cliente: AdSense se descarga recién cuando un espacio está por verse, espacios vacíos que se
      pliegan, topes por día y sesión, momento sólo con directos (política de AdSense).
- [x] `/ads.txt` y `/app-ads.txt` servidos desde la variable (antes `/ads.txt` redirigía al login),
      metaetiqueta de verificación, el service worker ya no guarda imágenes de anuncios.
- [x] 0135 + `/guia` y `/guia/[slug]`: las acciones públicas, sin cuenta (lo que revisa Google),
      sitemap con cada acción, `robots.txt` que deja pasar a `Mediapartners-Google`, entrada
      `/auth/crawler` para el rastreador.
- [x] `/panel/publicidad`: interruptor, qué falta de AdSense (sin secretos), reglas, números,
      anuncios directos con imagen y vista previa. Ajustes → Publicidad (consentimiento).
- [x] Privacidad §5 y Términos §10 al día (Google, directos, cómo desactivar la personalización).

## 4. Ligas — la tabla

En §2a. Fuente: `lib/ligas.ts`, con espejo en `0142_ligas_semanales.sql` y un test que los compara.

## 5. Notificaciones — qué llega, cuándo y por qué

| tipo | cuándo | tope |
|---|---|---|
| racha (`streak_risk`) | 20:00 si tenés racha ≥ 1 y hoy nada | 1/día |
| racha perdida (`streak_lost`) | 00:05, ya existía | 1/día |
| plaza | 18:00 si hay publicaciones nuevas de gente que seguís desde tu última visita | 1/día |
| rango | al cerrar el período | 1/período |
| recap | lunes 10:00 | 1/semana |
| reenganche | 3 y 14 días sin abrir | 1 c/u |
| social, proyectos, retos, academia, empresa | al ocurrir | sin tope extra |
| admin | al ocurrir | sin tope ni silencio |

Enganche = racha, plaza, rango, recap, reenganche: máximo 2 por día; entre 22 y 9 h esperan a las 9.

## 6. Certificados — los desafíos sembrados

17 desafíos en `0132_desafios_empresas.sql`, todos publicados: Energía (Luz eficiente, Apagado
inteligente, Medir para bajar, Energía renovable), Residuos (Separación en origen, Reciclado con
destino, Cero descartables, Compostaje), Agua (Agua sin pérdidas, Agua medida), Compras (Compras
locales y responsables, Envases que vuelven), Movilidad (Movilidad del equipo, Logística limpia),
Equipo (Equipo que sabe) y Gestión (Huella de carbono básica, Comunicación honesta). Niveles 1 a 3.
Cada requisito pide foto, documento, dato, enlace o declaración. Se inscriben empresas
verificadas (máximo 5 en curso), el certificado vence a los 12 meses y su página pública dice qué
es y qué no es (no es auditoría ni certificación oficial).

## 7. Analítica — de dónde sale cada número

`admin_analitica` y `admin_analitica_usuarios` en `0128_analitica.sql`. Día activo = `uso_diario`
con clave `activo` (abrir la app) o una acción marcada. Las cuentas `es_prueba` no cuentan.

## 8. Lo que queda del dueño (se completa al cerrar)

### 8.1 · Entrar al panel

Ya no hay contraseña. Entrás a Brote con tu cuenta y vas a `/panel`. Cualquier otra cuenta ve un 404, y
el intento te llega como aviso y queda en `/panel/salud`. Como ahora la llave es tu cuenta, cuidá el
correo con el que entrás.

### 8.2 · Publicidad

Todo en `docs/PUBLICIDAD.md`. En corto: (1) 0134 y 0135 ya están aplicadas; (2) dominio propio
(recomendado); (3) cuenta de AdSense (mayor de 18) y `NEXT_PUBLIC_ADSENSE_CLIENT` en Vercel; (4) pedir
la revisión verificando con la metaetiqueta; (5) aprobada: **apagar los anuncios automáticos**, crear
los bloques y cargar `NEXT_PUBLIC_ADSLOT_*`; (6) mensaje para Europa; (7) prender en
`/panel/publicidad`.

- (el resto, al cierre)

## 9. Diario

- 2026-10-14 — Relevamiento (§1), decisiones (§2), plan. Rama creada.
- 2026-10-14 — F1 hecha (849de47): login nuevo + recuperar contraseña + onboarding. Verificado a
  390 px y 1280 px, claro y oscuro, con `scratchpad/cdp-shot.mjs` (CDP) y una ruta de prueba
  temporal con las acciones del servidor inyectadas (`OnboardingFlow acciones=`). Hallazgo: un
  `overflow-hidden` en un ancestro rompe `position: sticky` (la barra de acción quedaba abajo).
- 2026-10-14 — F2 hecha: 0127 (cuentas del panel + recuperar) y 0128 (analítica, bandeja).
  **Banco de pruebas local:** `scratchpad/pgtest/` arma una copia de la base viva en PGlite (esquema
  de `information_schema`/`pg_constraint`, las 483 funciones con `pg_get_functiondef`, triggers y
  vistas; sin datos) y corre migraciones + tests con NOTICE. Así se prueban las migraciones sin
  tocar producción. Las funciones que llevan la anon key o leen vault se excluyen a propósito.
  `verify-business` pasa a verificar la contraseña como la persona (redeploy pendiente).
- 2026-10-14 — F3 hecha: 0129 (cola de avisos, reglas, silencio, tope, VAPID propia, racha 20 h,
  Plaza 18 h, reenganche 3/14 días, `registrar_dispositivo`, prueba desde Ajustes, estado en el
  panel) + `send-push` v2 (sólo manda lo que está en la cola; ya no acepta textos). Probado en
  PGlite: dispositivos que cambian de cuenta, tope diario, horario de silencio, reintentos, cierre
  y generadores sin duplicar. **Falta en vivo:** aplicar 0129 y desplegar `send-push` v2 (las
  claves se generan solas en el primer minuto).
- 2026-10-14 — F4 hecha: 0130 (avisos al equipo). Empresas que piden revisión, productos, objetivos,
  reportes, compromisos, altas/bajas/cobros rechazados de Brote+ y de empresas, y un resumen a las
  9 h. Una ráfaga se junta en un solo aviso (misma clave, sin leer, < 30 min). Probado en PGlite.
- 2026-10-14 — F5 hecha: 0131 + servidor. Brote+ mensual/anual en USD al oficial (2,99 / 24,99 por
  omisión, `plus_venta_activa` apagado hasta que el dueño lo prenda), alta y baja desde la app
  (`lib/pagos/plus-acciones.ts`), planes de empresa cobrados desde Next como la tienda (una sola
  credencial, en Vercel; `mp-subscribe`, `mp-webhook` y `mp-negocio` quedan retiradas),
  `/panel/suscripciones`. Beneficios que no existían: protectores mensuales (`brote_plus_protectores`),
  impacto mes a mes (`mi_impacto_mensual`), Eco-Experto real y 5× charlas en `pip-chat`; "biomas
  exclusivos" se sacó de la lista. **Bugs de producción encontrados:** `apply_subscription_event`
  fallaba en toda baja (enum sin castear) y mandaba la bienvenida con cada cobro; `pip-chat` y
  `_shared/gemini.ts` usaban `gemini-1.5-flash`, retirado por Google (todo caía al respaldo).
- 2026-10-14 — F6 hecha: 0132 (desafíos, inscripciones, evidencias, certificados con código
  BRT-XXXX-XXXX, vencimiento y revocación, cron de vencimiento) + `/negocio/desafios`,
  `/negocio/desafios/[slug]`, `/certificados/[codigo]` (pública, imprimible), certificados en la
  ficha de la tienda, `/panel/desafios` (cola, editor, certificados). Probado en PGlite.
- 2026-10-14 — F7 (base) hecha: 0133 probado en PGlite (decisión, calificación con rango previo,
  prorrateo, arranque desde la semana anterior, puntos en vivo, tableros sin chicos, cierre y paso
  a mensual, textos "nivel" en proyectos y en el aviso de subir de nivel). **SIGUIENTE (retomar
  acá):** UI de F7 — `lib/api/rangos.ts` (`mi_rango`, `ranking_periodo`, `rangos_de`), tarjeta
  "Tu rango" + `/ranking` nuevo (pestaña Tu rango; tableros del período: todos / provincia /
  amigos / tu rango / de siempre), `/panel/rangos`, y renombrar en la interfaz la escalera de por
  vida a "nivel" (`/perfil/rangos`, RankBadge, RewardLayer, TopBar, Ajustes, proyectos/nuevo,
  panel/pruebas, `common.rank`). Después F8 completo.
- 2026-10-16 — F9 (publicidad) hecha, pedida aparte: ver la casilla F9 y `docs/PUBLICIDAD.md`.
  0134 y 0135 probados en PGlite (sorteo 146/54 sobre 200 con pesos 3:1, chicos y Brote+ sin
  anuncio, adolescente sólo con «todos», clic anónimo, interruptor, momento sin AdSense, guía sin
  acciones internas ni de juego, relacionadas del mismo camino primero). **Bug encontrado:**
  `ads_enabled` no existía en ninguna migración, así que prenderlo desde el panel no hacía nada.
- 2026-11-01/02 — Pedido nuevo: todo desplegado, lecciones en blanco, proyectos por liga, panel de nuevo.
  **Aplicadas en vivo 0126–0140 y desplegadas las funciones** (hashes comparados contra los archivos).
  `ads_enabled` estaba prendido en vivo: lo apagué, como dice `docs/PUBLICIDAD.md`. Al releer 0137 antes
  de aplicarla aparecieron tres agujeros: la revisión de la noche miraba sólo el rango cerrado (quien
  ya cumplió Referente creaba un proyecto y esa noche recibía "tu rango no alcanza"), un proyecto en pausa
  liberaba cupo, y `proyecto_organizacion` calculaba el cupo de todos en cada visita. PR #38 se mergeó el
  2026-11-02 (57c88e1).
- 2026-11-02 — El dueño probó en vivo y corrigió cuatro cosas: las ligas (§2a), los proyectos (§2b), las
  empresas (§2c) y el demo (§2d). **Error mío:** escribí que el cambio de semana de la liga vieja nunca había
  estado programado; el cron existía y corrió hasta el 26 de octubre, y lo apagué yo en 0133. La regla vieja
  (los 4 primeros suben) tampoco servía con pocos usuarios: en grupos chicos subían todos sin hacer nada.
