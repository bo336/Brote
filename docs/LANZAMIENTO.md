# Brote — Lanzamiento al público

> Rama `claude/lanzamiento` (cortada de `origin/main` d11e59e, 2026-10-14).
> **Toda sesión que retome este trabajo lee este archivo primero**, sigue desde la
> primera casilla sin marcar y actualiza las casillas y el diario (§9) antes de cortar.
> Migraciones nuevas desde `0126`. La base viva llega hasta `0125`.

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
  período siguiente sin cumplirlo, bajás. Nada se paga: Brote+ no protege rangos.
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

## 3. Fases y casillas

### F1 · Login y onboarding
- [ ] Login nuevo: panel de marca (tinta, Pip, titular con el degradado, números reales vía RPC
      pública), pestañas Entrar/Crear cuenta con píldora deslizante, mostrar/ocultar contraseña,
      errores de Supabase traducidos, enlace mágico como alternativa.
- [ ] Olvidé mi contraseña: pedir enlace + `/auth/nueva-clave` para fijarla.
- [ ] Onboarding: barra de progreso con "Paso N de M", CTA fijo abajo con safe-area, pasos con la
      misma estructura, guardado que **sí** reporta errores, paso final con la primera acción y el
      pedido de avisos ("¿Te avisamos antes de que se corte tu racha?").
- [ ] Capturas a 390 px y 1280 px, claro y oscuro.

### F2 · Panel: cuentas, contraseña y analítica
- [ ] `brote_admins` + `admin_check` que exige cuenta vinculada cuando hay alguna + vincular cuenta +
      recuperar contraseña con sesión reciente. Texto para el dueño (cómo volver a entrar hoy).
- [ ] `uso_diario` + `registrar_uso()` + rastreador en el cliente (secciones y eventos clave).
- [ ] `admin_analitica(p_pass, p_dias)`: usuarios, altas, DAU/WAU/MAU, retención por cohortes,
      embudo, secciones, eventos, tipos de cuenta, ciudades, plataformas, avisos, planes, rachas,
      rangos, top acciones, Academia, Plaza, Mercado; ficha por usuario.
- [ ] `/panel/analitica` con gráficos (recharts), tablas y exportar CSV.
- [ ] Bandeja "Pendientes" arriba del panel (todas las colas con su número).

### F3 · Notificaciones reales
- [ ] Cola de push (`push_estado`, `push_programada_at`), trigger nuevo, `send-push` v2 (por id,
      drenado, VAPID propia), cron por minuto. Cerrar el agujero del push con texto libre.
- [ ] Tipos nuevos: `racha` 20 h, `plaza` (novedades de gente que seguís), `rango` (cierre de
      período), `recap` empujado, `reenganche` (3 y 14 días), `admin`, `empresa`.
- [ ] Preferencias por categoría + horario de silencio en Ajustes; tope diario de enganche.
- [ ] Pedido de permiso en buenos momentos (primera acción, Inicio una vez, Ajustes) y guía para
      iPhone (sólo con la app instalada).
- [ ] Realtime con plan B (si el canal falla, consulta cada 60 s) por el límite de 200 conexiones.

### F4 · Avisos para el dueño
- [ ] `brote_avisar_admins()` y enganches: alta/verificación de empresa, listado a revisar, cierre de
      objetivo, compromiso, reporte de contenido, entrega de desafío, alta/baja/fallo de pago de
      cualquier suscripción, errores del mundo en racha, hitos de usuarios. `notificar_revisores`
      pasa a ir a las cuentas admin.

### F5 · Suscripciones
- [ ] Brote+ mensual y anual por servidor (Next), cancelar desde la app, estado y próximo cobro,
      interruptor de venta y precios en el panel. Revisar cada beneficio: lo que no existe no se
      promete.
- [ ] Tiendas (vendedor) y Empresas (semilla/raíz/bosque): revisar el circuito completo contra el
      webhook unificado.
- [ ] `/panel/suscripciones`: estado de la configuración (sin mostrar secretos), precios, altas,
      bajas, en gracia, ingresos mensuales estimados por producto, lista.

### F6 · Desafíos y certificados para PyMEs
- [ ] Tablas, RPC y RLS: desafíos, inscripciones, evidencias, certificados.
- [ ] Panel: crear/editar/publicar desafíos, cola de entregas, aprobar/observar/rechazar, revocar.
- [ ] Empresa: `/negocio/desafios` (lista, detalle, inscribirse, subir evidencia, enviar, estado).
- [ ] Certificado: página pública `/certificados/[codigo]`, versión imprimible, sello SVG.
- [ ] Sembrar ~15 desafíos razonables por categoría y nivel.

### F7 · Rangos por período
- [ ] Tablas `rangos`, `rango_periodos`, `rango_usuario`, `rango_historial`, `rango_puntos`
      (mantenida por trigger), funciones de métricas, cierre, `mi_rango()`, tableros del período.
- [ ] Cron diario de cierre; interruptor semana/mes y edición de rangos en el panel.
- [ ] UI: tarjeta "Tu rango" con requisitos y progreso, `/ranking` nuevo (este período: global,
      ciudad, amigos, tu rango; historial), chip de rango en perfil; "rango" → "nivel" donde se
      habla de la escalera de por vida.
- [ ] Tests espejo (TS ↔ SQL) de requisitos y prorrateo.

### F8 · Pulido y lanzamiento
- [ ] Errores del cliente a `app_errores`, visibles en el panel.
- [ ] Asesores de Supabase (seguridad y rendimiento) en cero de lo nuevo; índices.
- [ ] Prueba de carga dentro de una transacción que se deshace (miles de usuarios, cientos de miles
      de acciones) midiendo los RPC calientes.
- [ ] `npm run typecheck`, `npm test`, `npm run build`, lint.
- [ ] Recorrido de pantallas con capturas.
- [ ] Lista del dueño (§8) y pedido único de luz verde: migraciones, funciones, merge.

## 4. Rangos — la tabla (fuente: `lib/rangos.ts`, espejo en SQL)

Requisitos **por semana**. En un período de N días se piden `ceil(valor × N / 7)`, y los días
activos nunca más que N.

| # | Rango | Qué tipo de persona es | días | acciones | temas | medidas | comunidad | aprendizaje | previo |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Aprendiz | Empieza a mirar su huella. | – | – | – | – | – | – | – |
| 2 | Practicante | Hace algo por el ambiente varias veces por semana. | 2 | 3 | – | – | – | – | – |
| 3 | Ambientalista | Cuidar ya es parte de su semana, en varios temas. | 4 | 8 | 3 | 1 | – | – | – |
| 4 | Referente | Su forma de vivir se nota y se mide. | 5 | 12 | 4 | 3 | – | 1 | – |
| 5 | Agente de cambio | Mueve a otros, no sólo a sí. | 6 | 16 | 5 | 5 | 1 | 1 | – |
| 6 | Guía | Sostiene a su comunidad, período tras período. | 6 | 20 | 6 | 7 | 2 | 2 | 5 |
| 7 | Faro | Lo más alto de Brote, y hay que sostenerlo. | 7 | 25 | 7 | 10 | 3 | 3 | 6 |

- **acciones**: completadas `honor`/`verified`, máximo 6 por día.
- **medidas**: acciones con impacto medido (agua, CO₂, residuos, energía > 0).
- **comunidad**: asistir a una jornada de proyecto, sumarse a un proyecto, publicar en la Plaza una
  acción hecha, regalar en el mundo a un amigo (máx. 1 por día).
- **aprendizaje**: sesiones de la Academia aprobadas.

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

Ver `supabase/migrations/0130_desafios_empresas.sql` (se llena en F6).

## 7. Analítica — de dónde sale cada número

Ver `admin_analitica` en `0127_panel_analitica.sql` (se llena en F2).

## 8. Lo que queda del dueño (se completa al cerrar)

- (al cierre)

## 9. Diario

- 2026-10-14 — Relevamiento (§1), decisiones (§2), plan. Rama creada.
