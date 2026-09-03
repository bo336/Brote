-- ─────────────────────────────────────────────────────────────────────────────
-- 0080 · La Academia, fase 2 — lo que la experiencia le pide al motor.
--
-- El pack numera esta migración 0039. El repo ya iba por 0079 cuando se escribió
-- la fase 1, así que se sigue la numeración real: secuencial y nunca reusada.
--
-- UNA sola cosa cambia, y cambia por una regla de 15-ui-motion.md §1: la
-- pantalla del bosque hace UNA llamada. Sin esto la cabecera necesitaba
-- `academia_estado()` aparte para dibujar la racha y las semillas del día —
-- dos viajes para pintar una sola pantalla. `academia_arbol` ya invoca a
-- `academia_estado()` internamente para la savia; lo único que faltaba era
-- devolver el resto de lo que esa llamada ya trajo.
--
-- Idempotente: es un `create or replace` y nada más. No toca datos, no toca
-- esquema, no borra nada.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function academia_arbol()
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare
  v_uid uuid := auth.uid(); v_acc text; v_anillo int; v_interests text[];
  v_ramas jsonb; v_stats jsonb; v_sig jsonb; v_marchitos jsonb; v_estado jsonb;
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  if not ac_setting_bool('academia_enabled', true) then
    return jsonb_build_object('ok', false, 'error', 'La Academia está en pausa por un momento.');
  end if;

  v_acc := brote_account_type(v_uid);
  select coalesce(interests, '{}'::text[]) into v_interests from profiles where id = v_uid;
  select coalesce(max(anillo), 1) into v_anillo from ac_user_anillo
    where user_id = v_uid and cerrado_at is null;
  v_estado := academia_estado();

  with mios as (
    select uc.concepto_id, uc.mastery_ema,
           uc.mastery_ema * ac_retrievability(uc.last_seen, uc.half_life) as fuerza,
           uc.vistas
    from ac_user_concepto uc where uc.user_id = v_uid
  ),
  -- Conceptos por gajo: los que enseñan sus hojas.
  gc as (
    select distinct g.id as gajo_id, hc.concepto_id
    from ac_gajos g
    join ac_hojas h on h.gajo_id = g.id and h.status = 'aprobado'
    join ac_hoja_conceptos hc on hc.hoja_id = h.id
    join ac_conceptos c on c.id = hc.concepto_id and c.status = 'aprobado'
    where g.status = 'aprobado' and g.age_groups @> array[v_acc] and c.age_groups @> array[v_acc]
  ),
  agg as (
    select gc.gajo_id,
           count(*) as n,
           avg(coalesce(m.mastery_ema, 0)) as m,
           avg(coalesce(m.fuerza, 0)) as f,
           count(*) filter (where coalesce(m.vistas, 0) > 0) as vistos
    from gc left join mios m on m.concepto_id = gc.concepto_id
    group by gc.gajo_id
  ),
  -- Conceptos con un prerrequisito duro sin cumplir que ADEMAS cae fuera del
  -- propio gajo. Si el prereq esta en el mismo gajo no bloquea nada: se hacen
  -- en orden ahi adentro.
  bloq as (
    select distinct gc.gajo_id, gc.concepto_id,
           gp.slug as falta_slug, gp.titulo_es as falta_titulo
    from gc
    join ac_concepto_prereq pr on pr.concepto_id = gc.concepto_id and pr.fuerza >= 0.8
    left join mios m2 on m2.concepto_id = pr.requiere_id
    left join gc gsame on gsame.gajo_id = gc.gajo_id and gsame.concepto_id = pr.requiere_id
    left join gc gotro on gotro.concepto_id = pr.requiere_id and gotro.gajo_id <> gc.gajo_id
    left join ac_gajos gp on gp.id = gotro.gajo_id
    where coalesce(m2.mastery_ema, 0) < 0.85
      and gsame.concepto_id is null
  ),
  -- MEDIDO: marcar el gajo entero como latente porque UNO de sus conceptos
  -- tenia un prereq dejaba cinco ramas sin un solo gajo disponible en una
  -- cuenta nueva, y 10-el-bosque.md §3 es explicito: "nunca se bloquea una
  -- rama entera, solo gajos individuales". Latente ahora significa lo que
  -- deberia significar: no se puede empezar por NINGUN lado.
  falta as (
    select gc.gajo_id,
           count(distinct gc.concepto_id) as n_conceptos,
           count(distinct b.concepto_id)  as n_bloqueados,
           min(b.falta_titulo) as gajo_falta,
           min(b.falta_slug)   as gajo_falta_slug
    from gc left join bloq b on b.gajo_id = gc.gajo_id and b.concepto_id = gc.concepto_id
    group by gc.gajo_id
  ),
  hojas_hechas as (
    select g.id as gajo_id,
           count(h.id) as total,
           count(uh.completed_at) as hechas
    from ac_gajos g
    join ac_hojas h on h.gajo_id = g.id and h.status = 'aprobado' and h.age_groups @> array[v_acc]
    left join ac_user_hoja uh on uh.hoja_id = h.id and uh.user_id = v_uid
    group by g.id
  ),
  gajos as (
    select g.rama_slug, g.id, g.slug, g.titulo_es, g.bajada_es, g.icono, g.anillo, g.sort_order,
           coalesce(a.n, 0) as conceptos,
           coalesce(a.f, 0)::numeric(4,3) as progreso,
           coalesce(hh.total, 0) as hojas_total,
           coalesce(hh.hechas, 0) as hojas_hechas,
           f.gajo_falta, f.gajo_falta_slug,
           case
             when g.anillo > v_anillo then 'latente'
             when f.n_conceptos > 0 and f.n_bloqueados >= f.n_conceptos then 'latente'
             when coalesce(a.m, 0) >= 0.85 and coalesce(a.f, 0) < 0.6 then 'marchito'
             when coalesce(a.m, 0) >= 0.85 then 'frondoso'
             when coalesce(a.vistos, 0) > 0 then 'en_curso'
             else 'disponible'
           end as estado
    from ac_gajos g
    left join agg a on a.gajo_id = g.id
    left join falta f on f.gajo_id = g.id
    left join hojas_hechas hh on hh.gajo_id = g.id
    where g.status = 'aprobado' and g.age_groups @> array[v_acc]
  )
  select
    coalesce(jsonb_agg(jsonb_build_object(
      'slug', r.slug, 'nombre_es', r.nombre_es, 'bajada_es', r.bajada_es,
      'es_tronco', r.es_tronco, 'sort_order', r.sort_order,
      'gajos', coalesce(gj.gajos, '[]'::jsonb)
    ) order by r.sort_order), '[]'::jsonb)
  into v_ramas
  from ac_ramas r
  left join lateral (
    select jsonb_agg(jsonb_build_object(
      'id', g.id, 'slug', g.slug, 'titulo_es', g.titulo_es, 'bajada_es', g.bajada_es,
      'icono', g.icono, 'anillo', g.anillo, 'estado', g.estado, 'progreso', g.progreso,
      'conceptos', g.conceptos, 'hojas_total', g.hojas_total, 'hojas_hechas', g.hojas_hechas,
      'falta', case when g.estado = 'latente' then
        coalesce(g.gajo_falta, 'Se abre en el anillo ' || g.anillo) end,
      'falta_slug', g.gajo_falta_slug
      ) order by g.anillo, g.sort_order) as gajos
    from gajos g where g.rama_slug = r.slug
  ) gj on true;

  -- Estadísticas de la tira oscura. Todos números reales o no van.
  select jsonb_build_object(
    'conceptos_frondosos', count(*) filter (
      where uc.mastery_ema * ac_retrievability(uc.last_seen, uc.half_life) >= 0.85),
    'conceptos_vistos', count(*),
    'conceptos_totales', (select count(*) from ac_conceptos
                          where status = 'aprobado' and age_groups @> array[v_acc]),
    'anillo', v_anillo,
    'anillo_nombre', (select nombre_es from ac_anillos where n = v_anillo),
    'hojas_completas', (select count(*) from ac_user_hoja
                        where user_id = v_uid and completed_at is not null),
    'riegos', (select count(*) from ac_sesiones
               where user_id = v_uid and tipo = 'riego' and finished_at is not null))
  into v_stats
  from ac_user_concepto uc where uc.user_id = v_uid;

  -- Los marchitos, para la lista de riego. Gratis, siempre visible.
  select coalesce(jsonb_agg(x order by x->>'titulo_es'), '[]'::jsonb) into v_marchitos
  from jsonb_array_elements(
    (select coalesce(jsonb_agg(g), '[]'::jsonb)
     from jsonb_array_elements(v_ramas) r,
          jsonb_array_elements(r->'gajos') g
     where g->>'estado' = 'marchito')) x;

  -- UNA sola recomendación, con su motivo. El orden importa: regar antes que
  -- avanzar, y seguir lo empezado antes que abrir algo nuevo.
  select jsonb_build_object('gajo', g, 'razon', razon) into v_sig
  from (
    select g,
           case
             when g->>'estado' = 'marchito' then 'Se está secando. Un riego rápido y vuelve.'
             when g->>'estado' = 'en_curso' then 'Lo dejaste empezado.'
             when r->>'slug' = any(v_interests) then 'Te interesa ' || (r->>'nombre_es') || '.'
             else 'Un buen lugar para empezar.'
           end as razon,
           (case g->>'estado' when 'marchito' then 0 when 'en_curso' then 1
                              when 'disponible' then 2 else 9 end) * 10
           + (case when r->>'slug' = any(v_interests) then 0 else 1 end) as prioridad,
           (g->>'progreso')::numeric as prog
    from jsonb_array_elements(v_ramas) r, jsonb_array_elements(r->'gajos') g
    where g->>'estado' in ('marchito','en_curso','disponible')
  ) s
  order by prioridad, prog desc, random()
  limit 1;

  -- FASE 2: la racha y las semillas viajan con el árbol. `academia_estado()` ya
  -- se llamó arriba para la savia, así que esto no cuesta una consulta más —
  -- pero le ahorra un viaje entero a la pantalla.
  return jsonb_build_object(
    'ok', true, 'anillo', v_anillo, 'ramas', v_ramas, 'stats', v_stats,
    'siguiente', v_sig, 'marchitos', v_marchitos,
    'savia', v_estado->'savia', 'pro', v_estado->'pro',
    'racha', v_estado->'racha',
    'semillas_hoy', v_estado->'semillas_hoy',
    'semillas_tope', v_estado->'semillas_tope',
    'semillas_saldo', v_estado->'semillas_saldo');
end $fn$;

revoke all on function academia_arbol() from public, anon, authenticated;
grant execute on function academia_arbol() to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- ac_rebarajar — aplicar una permutación YA GUARDADA.
--
-- `ac_barajar` sortea una permutación nueva; esta aplica la que la entrega ya
-- tiene en `perm`. Es la misma transformación, determinista: sin ella no hay
-- forma de reconstruir el payload que se le mostró a alguien sin romper la
-- corrección, porque el corrector desmapea contra ESA permutación.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function ac_rebarajar(p_payload jsonb, p_tipo ac_tipo_ejercicio, p_perm smallint[])
returns jsonb language plpgsql immutable security definer set search_path = public as $fn$
declare v_key text := ac_token_key(p_tipo); v_arr jsonb; v_n int; v_out jsonb := '[]'::jsonb; i int;
begin
  if v_key is null or coalesce(array_length(p_perm, 1), 0) = 0 then return p_payload; end if;
  v_arr := p_payload -> v_key;
  if v_arr is null or jsonb_typeof(v_arr) <> 'array' then return p_payload; end if;
  v_n := jsonb_array_length(v_arr);
  -- Si la permutación no le queda al payload, se devuelve el payload crudo: es
  -- preferible un ejercicio sin barajar que uno con los tokens corridos.
  if v_n = 0 or array_length(p_perm, 1) <> v_n then return p_payload; end if;
  for i in 1..v_n loop
    v_out := v_out || jsonb_build_array(
      ((v_arr -> (p_perm[i] - 1)) - 'id') || jsonb_build_object('id', 't' || i)
    );
  end loop;
  return jsonb_set(p_payload, array[v_key], v_out);
end $fn$;

-- ─────────────────────────────────────────────────────────────────────────────
-- academia_pendientes(sesion) — los pasos de una sesión que siguen sin responder.
--
-- BUG DE LA FASE 1 QUE ESTO CIERRA. `academia_answer` re-encola un error UNA
-- vez creando una entrega nueva en el bloque 100+, pero devolvía únicamente la
-- bandera `reencolada: true`: ni el `entrega_id` nuevo, ni el payload. Y
-- `academia_finish_session` cuenta TODAS las entregas sin responder para
-- decidir si la sesión está completa. Resultado: cualquier sesión con una
-- respuesta mal quedaba imposible de cerrar, porque el paso re-encolado no
-- había forma de pedirlo. Verificado contra la base viva antes de escribir esto.
--
-- Sirve además para lo otro que no tenía solución: recuperar una sesión después
-- de recargar la página. La savia se cobra al empezar, así que perder los pasos
-- por un F5 era perder una hoja del día. Ahora la pantalla los vuelve a pedir.
--
-- No filtra nada: devuelve `payload_publico` con la MISMA permutación guardada
-- en la entrega, que es exactamente lo que `academia_start_session` ya había
-- mandado. Ni clave, ni explicación, ni fuente.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function academia_pendientes(p_sesion_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare
  v_uid uuid := auth.uid(); v_s ac_sesiones%rowtype; v_hoja ac_hojas%rowtype;
  v_rama text := 'tronco'; v_pasos jsonb;
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;

  select * into v_s from ac_sesiones where id = p_sesion_id;
  if not found or v_s.user_id <> v_uid then
    return jsonb_build_object('ok', false, 'error', 'Esa sesión no es tuya.');
  end if;
  if v_s.finished_at is not null or v_s.abandonada_at is not null then
    return jsonb_build_object('ok', false, 'error', 'cerrada',
      'mensaje', 'Esa sesión ya está cerrada.');
  end if;
  if now() > v_s.expires_at then
    return jsonb_build_object('ok', false, 'error', 'expirada',
      'mensaje', 'Esta sesión venció. Empezá una nueva cuando quieras.');
  end if;

  if v_s.hoja_id is not null then
    select * into v_hoja from ac_hojas where id = v_s.hoja_id;
    select coalesce(g.rama_slug, 'tronco') into v_rama from ac_gajos g where g.id = v_hoja.gajo_id;
  end if;

  -- Solo entregas: los pasos de presentación (microlectura, dato_vivo) no
  -- tienen fila porque no se corrigen, y por lo tanto tampoco pueden quedar
  -- pendientes. Volver a leerlos después de recargar no aporta nada.
  select coalesce(jsonb_agg(jsonb_build_object(
      'orden', e.orden,
      'entrega_id', e.id,
      'tipo', p.tipo,
      'payload', ac_rebarajar(i.payload_publico, p.tipo, e.perm)
    ) order by e.orden), '[]'::jsonb)
    into v_pasos
    from ac_entregas e
    join ac_items i on i.id = e.item_id
    join ac_plantillas p on p.id = e.plantilla_id
   where e.sesion_id = v_s.id and e.answered_at is null;

  return jsonb_build_object(
    'ok', true, 'sesion_id', v_s.id, 'tipo', v_s.tipo,
    'hoja', case when v_s.hoja_id is not null then jsonb_build_object(
      'id', v_hoja.id, 'slug', v_hoja.slug, 'titulo_es', v_hoja.titulo_es,
      'bajada_es', v_hoja.bajada_es) end,
    'rama_slug', v_rama,
    'pasos', v_pasos,
    'total', v_s.pasos,
    'savia_gastada', v_s.savia_gastada,
    'expires_at', v_s.expires_at);
end $fn$;

revoke all on function ac_rebarajar(jsonb, ac_tipo_ejercicio, smallint[]) from public, anon, authenticated;
revoke all on function academia_pendientes(uuid)                          from public, anon, authenticated;
grant execute on function academia_pendientes(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- El valor verdadero de las estimaciones numéricas.
--
-- ACCEPTANCE fase 2 pide que `EstimacionNumerica` "revele el valor verdadero
-- contra lo que se adivinó". No se podía: `academia_answer` devuelve
-- `clave_cruda = solucion->'clave'` en los tipos sin colección de tokens, y en
-- estas la solución guardaba `valor` pero no `clave`. La pantalla solo sabía en
-- qué banda de tolerancia había caído, no cuánto era.
--
-- `clave` significa LA RESPUESTA en los otros once tipos; acá la respuesta es
-- el número. Esto lo copia, sin tocar nada más. Aditivo e idempotente:
-- `jsonb_set` sobre una clave que no existe la crea, y volver a correrlo
-- escribe el mismo valor. `scripts/academia/construir.mjs` ya lo emite, así que
-- una regeneración del seed produce lo mismo.
-- ─────────────────────────────────────────────────────────────────────────────

update ac_items i
   set solucion = jsonb_set(i.solucion, '{clave}', i.solucion->'valor', true)
  from ac_plantillas p
 where p.id = i.plantilla_id
   and p.tipo = 'estimacion_numerica'
   and i.solucion ? 'valor'
   and i.solucion->'clave' is distinct from i.solucion->'valor';
