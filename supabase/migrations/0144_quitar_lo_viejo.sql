-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0144 — Lo que quedó sin uso con las ligas y la solicitud.
--
-- SE APLICA DESPUÉS del deploy: hasta ese momento el cliente anterior todavía
-- llama a `mi_rango` y `admin_rangos`. Nada de esto guarda datos.
--
-- La tabla `user_leagues` (la liga de antes) y las columnas `rangos.requisitos`,
-- `rangos.previo` y `rango_usuario.margen_usado` no se tocan: no estorban, y
-- borrar datos no se deshace.
-- ════════════════════════════════════════════════════════════════════════════

drop function if exists public.mi_rango();
drop function if exists public.admin_rangos(text);
drop function if exists public.admin_rango_guardar(text, smallint, text, text, jsonb);
drop function if exists public.brote_rango_calificado(jsonb, int, smallint);
drop function if exists public.brote_rango_decidir(smallint, smallint, boolean);
drop function if exists public.brote_rango_metricas(date, date, uuid);
drop function if exists public.brote_rango_requisitos(jsonb, int);

drop function if exists public.weekly_league(uuid);
drop function if exists public.brote_league_rollover();
drop function if exists public.brote_league_name(smallint);

drop function if exists public.vendedor_crear(text);
drop function if exists public.empresa_crear(text, text, business_size, text, text, text);
