-- Brote — 0078 — La Academia: El Bosque, parte 2 (el motor).
-- Compositor de sesión, corrector, economía y gancho de acción.
-- Implementa ACADEMIA/design/10-el-bosque.md §4–§6, 11-exercise-types.md §2–§4,
-- 12-economy-savia-semillas.md §1–§3 y 13-data-model.md §4 y §6.
--
-- LA REGLA QUE MANDA SOBRE TODAS: la respuesta correcta no cruza el cable antes
-- de corregir. Ni la clave, ni el índice, ni la explicación, ni un orden de
-- opciones que se correlacione con la respuesta. Todo lo que sale de acá pasó
-- por `ac_barajar`, que reetiqueta los tokens a `t1..tn` en orden aleatorio POR
-- ENTREGA y borra los ids del ítem. Si los ids del ítem salieran, cualquiera
-- que ya vio ese ítem sabría la respuesta de memoria.
--
-- DESVIACIÓN DOCUMENTADA (piso de adivinanza). 13-data-model.md §4 escribe
-- `P = 1/k + (1 − 1/k)·σ(θ − b)` con "k = cantidad de opciones, 1 para tipos
-- abiertos". Con k = 1 esa fórmula da P = 1 siempre, y entonces acertar BAJA
-- theta. Es un error del spec, no una sutileza: para tipos abiertos no hay
-- adivinanza, así que el piso es 0. Implementado como
-- `g = case when k >= 2 then 1.0/k else 0 end`.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1 · Helpers de payload
-- ─────────────────────────────────────────────────────────────────────────────

-- Qué colección de un payload porta la respuesta y por lo tanto hay que barajar
-- y reetiquetar. Si un tipo devuelve null, no hay nada que ocultar en el orden
-- (un binario o un número no filtran nada por su posición).
create or replace function ac_token_key(p_tipo ac_tipo_ejercicio)
returns text language sql immutable security definer set search_path = public as $fn$
  select case p_tipo
    when 'opcion_multiple'      then 'opciones'
    when 'elegir_la_accion'     then 'opciones'
    when 'ranking_impacto'      then 'opciones'
    when 'ordenar_secuencia'    then 'fragmentos'
    when 'cadena_causal'        then 'fragmentos'
    when 'clasificar_en_cestos' then 'fichas'
    when 'emparejar'            then 'derecha'
    when 'detectar_greenwashing' then 'spans'
    when 'completar_frase'      then 'banco'
    when 'mapa_localizar'       then 'alternativas'
    else null
  end;
$fn$;

-- Baraja por entrega. Devuelve {payload, perm}.
-- `perm[k]` = índice 1-based del token original que quedó en la posición k.
create or replace function ac_barajar(p_payload jsonb, p_tipo ac_tipo_ejercicio)
returns jsonb language plpgsql volatile security definer set search_path = public as $fn$
declare
  v_key text := ac_token_key(p_tipo);
  v_arr jsonb; v_n int; v_perm smallint[]; v_out jsonb := '[]'::jsonb; i int;
begin
  if v_key is null then
    return jsonb_build_object('payload', p_payload, 'perm', '[]'::jsonb);
  end if;
  v_arr := p_payload -> v_key;
  if v_arr is null or jsonb_typeof(v_arr) <> 'array' or jsonb_array_length(v_arr) = 0 then
    return jsonb_build_object('payload', p_payload, 'perm', '[]'::jsonb);
  end if;
  v_n := jsonb_array_length(v_arr);
  select array_agg(x order by random())::smallint[] into v_perm from generate_series(1, v_n) x;
  for i in 1..v_n loop
    v_out := v_out || jsonb_build_array(
      ((v_arr -> (v_perm[i] - 1)) - 'id') || jsonb_build_object('id', 't' || i)
    );
  end loop;
  return jsonb_build_object('payload', jsonb_set(p_payload, array[v_key], v_out),
                            'perm', to_jsonb(v_perm));
end $fn$;

-- 't3' + perm + payload original ⇒ el id real del token. Es la única manera de
-- volver del token opaco al ítem, y vive solo del lado del servidor.
create or replace function ac_desmapear(p_payload jsonb, p_tipo ac_tipo_ejercicio,
                                        p_perm smallint[], p_token text)
returns text language plpgsql immutable security definer set search_path = public as $fn$
declare v_key text := ac_token_key(p_tipo); v_k int; v_idx int;
begin
  if p_token is null then return null; end if;
  if v_key is null then return p_token; end if;
  if left(p_token, 1) <> 't' then return null; end if;
  begin v_k := substring(p_token from 2)::int; exception when others then return null; end;
  if v_k is null or v_k < 1 or v_k > coalesce(array_length(p_perm, 1), 0) then return null; end if;
  v_idx := p_perm[v_k];
  return p_payload -> v_key -> (v_idx - 1) ->> 'id';
end $fn$;

-- Distancia de Kendall normalizada, para el crédito parcial de las secuencias.
-- 1.0 = orden exacto; 0 = orden invertido o respuesta mal formada.
create or replace function ac_kendall(p_resp text[], p_clave text[])
returns real language plpgsql immutable security definer set search_path = public as $fn$
declare n int; i int; j int; d int := 0; pa int; pb int;
begin
  n := coalesce(array_length(p_clave, 1), 0);
  if n < 2 then return 0; end if;
  if coalesce(array_length(p_resp, 1), 0) <> n then return 0; end if;
  for i in 1..n - 1 loop
    for j in i + 1..n loop
      pa := array_position(p_resp, p_clave[i]);
      pb := array_position(p_resp, p_clave[j]);
      if pa is null or pb is null then return 0; end if;
      if pa > pb then d := d + 1; end if;
    end loop;
  end loop;
  return greatest(0.0, 1.0 - (2.0 * d) / (n * (n - 1)))::real;
end $fn$;

-- Los "contextos" activos de una persona, sacados de profiles.context.
-- La clave `plaza` (del feed) y cualquier otra ajena se ignoran: solo cuentan
-- las seis del onboarding.
create or replace function ac_contextos(p_context jsonb)
returns text[] language sql immutable security definer set search_path = public as $fn$
  select coalesce(array_agg(k), '{}'::text[])
  from jsonb_each(coalesce(p_context, '{}'::jsonb)) as e(k, v)
  where k in ('balcon','jardin','auto','bici','mascota','compra')
    and (v = 'true'::jsonb or (jsonb_typeof(v) = 'string' and (v #>> '{}') <> ''));
$fn$;

-- La ecorregión que le toca a una ciudad, para elegir el ejemplo local. Es un
-- mapeo grueso a propósito: alcanza para no hablarle del Delta a alguien de
-- Bariloche, y no pretende ser un SIG.
create or replace function ac_region_de(p_city text, p_neighborhood text)
returns text language sql immutable security definer set search_path = public as $fn$
  select case
    when p_city is null then 'general'
    when lower(p_city) ~ 'buenos aires|caba|capital|vicente lópez|vicente lopez|san isidro|tigre|quilmes|avellaneda|lanús|lanus|la plata|morón|moron|matanza'
      then 'rioplatense'
    when lower(p_city) ~ 'rosario|santa fe|paraná|parana|entre ríos|entre rios' then 'delta'
    when lower(p_city) ~ 'córdoba|cordoba|san luis|la pampa' then 'espinal'
    when lower(p_city) ~ 'mendoza|san juan|la rioja|catamarca' then 'monte'
    when lower(p_city) ~ 'salta|jujuy|tucumán|tucuman|santiago' then 'yungas'
    when lower(p_city) ~ 'chaco|formosa|corrientes|misiones' then 'chaco'
    when lower(p_city) ~ 'neuquén|neuquen|río negro|rio negro|chubut|santa cruz|fuego|bariloche' then 'patagonia'
    when lower(p_city) ~ 'mar del plata|necochea|bahía blanca|bahia blanca|pinamar|madryn' then 'costa'
    else 'general'
  end;
$fn$;

revoke all on function ac_token_key(ac_tipo_ejercicio) from public, anon, authenticated;
revoke all on function ac_barajar(jsonb, ac_tipo_ejercicio) from public, anon, authenticated;
revoke all on function ac_desmapear(jsonb, ac_tipo_ejercicio, smallint[], text) from public, anon, authenticated;
revoke all on function ac_kendall(text[], text[]) from public, anon, authenticated;
revoke all on function ac_contextos(jsonb) from public, anon, authenticated;
revoke all on function ac_region_de(text, text) from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2 · academia_estado() — barato, lo consulta el encabezado.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function academia_estado()
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare
  v_uid uuid := auth.uid(); v_pro boolean; v_libre int; v_tope int;
  v_dia date; v_hojas int := 0; v_extra int := 0; v_sem int := 0;
  v_tz text; v_streak int; v_semillas int;
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  v_pro   := brote_is_pro(v_uid);
  v_libre := ac_setting_int('academia_savia_libre', 5);
  v_tope  := ac_setting_int('academia_semillas_dia', 15);
  v_dia   := ac_dia_local(v_uid);
  select coalesce(nullif(timezone, ''), 'America/Argentina/Buenos_Aires'), current_streak, semillas
    into v_tz, v_streak, v_semillas from profiles where id = v_uid;
  select hojas, savia_extra, semillas into v_hojas, v_extra, v_sem
    from ac_uso_diario where user_id = v_uid and dia_local = v_dia;

  return jsonb_build_object(
    'ok', true,
    'habilitada', ac_setting_bool('academia_enabled', true),
    'pro', v_pro,
    'savia', case when v_pro then null else
      jsonb_build_object(
        'restante', greatest(0, v_libre + coalesce(v_extra, 0) - coalesce(v_hojas, 0)),
        'max', v_libre + coalesce(v_extra, 0),
        'base', v_libre,
        'extra', coalesce(v_extra, 0),
        -- Medianoche local expresada como instante real, para el contador.
        'reset_at', ((v_dia + 1)::timestamp at time zone v_tz))
    end,
    'semillas_hoy', coalesce(v_sem, 0),
    'semillas_tope', v_tope,
    'semillas_saldo', coalesce(v_semillas, 0),
    'racha', coalesce(v_streak, 0));
end $fn$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3 · academia_arbol() — TODO el árbol en una sola llamada.
--
-- La pantalla /aprender hace exactamente una llamada. Si necesita una segunda,
-- el RPC está mal y se arregla el RPC, no la pantalla.
--
-- Estado de un gajo, calculado y nunca almacenado:
--   m = promedio de mastery_ema de sus conceptos (0 los no vistos)
--   f = promedio de mastery_ema · R  (la fuerza que se muestra)
--   latente    prerrequisito duro sin cumplir, o anillo todavía cerrado
--   marchito   m ≥ 0.85 pero f < 0.6  — lo supiste y se te está secando
--   frondoso   m ≥ 0.85
--   en_curso   ya viste algún concepto
--   disponible el resto
-- `marchito` es el motor de retención: mastery_ema recuerda que lo dominaste y
-- R es lo que se cae solo. Regarlo es gratis.
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

  return jsonb_build_object(
    'ok', true, 'anillo', v_anillo, 'ramas', v_ramas, 'stats', v_stats,
    'siguiente', v_sig, 'marchitos', v_marchitos,
    'savia', v_estado->'savia', 'pro', v_estado->'pro');
end $fn$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4 · academia_gajo(slug) — las hojas de un gajo y la fuerza por concepto.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function academia_gajo(p_slug text)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare v_uid uuid := auth.uid(); v_acc text; v_g ac_gajos%rowtype; v_hojas jsonb; v_conceptos jsonb;
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  v_acc := brote_account_type(v_uid);
  select * into v_g from ac_gajos
   where slug = p_slug and status = 'aprobado' and age_groups @> array[v_acc];
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Ese gajo no existe o no está disponible para tu cuenta.');
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', h.id, 'slug', h.slug, 'titulo_es', h.titulo_es, 'bajada_es', h.bajada_es,
    'minutos', h.minutos, 'sort_order', h.sort_order,
    'mejor_score', coalesce(uh.mejor_score, 0),
    'intentos', coalesce(uh.intentos, 0),
    'completada', uh.completed_at is not null,
    'conceptos', (select coalesce(jsonb_agg(c.titulo_es order by c.titulo_es), '[]'::jsonb)
                  from ac_hoja_conceptos hc join ac_conceptos c on c.id = hc.concepto_id
                  where hc.hoja_id = h.id and c.status = 'aprobado' and c.age_groups @> array[v_acc])
    ) order by h.sort_order), '[]'::jsonb)
  into v_hojas
  from ac_hojas h
  left join ac_user_hoja uh on uh.hoja_id = h.id and uh.user_id = v_uid
  where h.gajo_id = v_g.id and h.status = 'aprobado' and h.age_groups @> array[v_acc];

  select coalesce(jsonb_agg(distinct jsonb_build_object(
    'slug', c.slug, 'titulo_es', c.titulo_es, 'enunciado_es', c.enunciado_es,
    'fuerza', round((coalesce(uc.mastery_ema, 0)
                     * ac_retrievability(uc.last_seen, uc.half_life))::numeric, 3),
    'mastery', round(coalesce(uc.mastery_ema, 0)::numeric, 3),
    'fuente', (select jsonb_build_object('titulo', f.titulo, 'organizacion', f.organizacion,
                                         'url', f.url, 'publicado', f.publicado)
               from ac_fuentes f where f.id = c.fuente_id))), '[]'::jsonb)
  into v_conceptos
  from ac_hojas h
  join ac_hoja_conceptos hc on hc.hoja_id = h.id
  join ac_conceptos c on c.id = hc.concepto_id and c.status = 'aprobado' and c.age_groups @> array[v_acc]
  left join ac_user_concepto uc on uc.concepto_id = c.id and uc.user_id = v_uid
  where h.gajo_id = v_g.id and h.status = 'aprobado';

  return jsonb_build_object('ok', true,
    'gajo', jsonb_build_object('id', v_g.id, 'slug', v_g.slug, 'titulo_es', v_g.titulo_es,
      'bajada_es', v_g.bajada_es, 'icono', v_g.icono, 'anillo', v_g.anillo,
      'rama_slug', v_g.rama_slug),
    'hojas', v_hojas, 'conceptos', v_conceptos);
end $fn$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5 · El compositor. El corazón intelectual de la fase.
--
-- Mezcla objetivo (10-el-bosque.md §4): 1 microlectura de apertura si la sesión
-- introduce un concepto nuevo, después ≈45 % conceptos nuevos, ≈30 % repaso
-- vencido (R < 0.9, el más olvidado primero) y ≈25 % puntos débiles
-- (mastery entre 0.3 y 0.7). Cuando una tajada está vacía —y en una cuenta
-- nueva SIEMPRE lo está— el resto se reparte el cupo y la sesión sale llena
-- igual. Una sesión a medias por falta de historial sería el peor primer día
-- posible.
--
-- Selección: b* = θ − ln(P*/(1−P*)) con P* = 0.82; se ordena por −|b − b*|, se
-- toman los 8 mejores y se elige UNO al azar entre esos ocho (control de
-- exposición "randomesque"). Elegir siempre el mejor colapsa el pool.
-- La personalización desempata DENTRO de esos ocho: entre isomorfos de igual
-- dificultad gana el que le habla a esta persona (su contexto, su región).
-- ─────────────────────────────────────────────────────────────────────────────

-- Elige UN ítem para un concepto, con control de exposición.
--
-- b* viene de afuera. Se ordena por −|b − b*|, se toman los OCHO mejores y se
-- sortea entre esos ocho (randomesque, Kingsbury & Zara). Elegir siempre el
-- mejor colapsa el pool: todo el mundo vería los mismos ítems.
--
-- La personalización desempata DENTRO de esos ocho, nunca antes: entre isomorfos
-- de la misma dificultad gana el que le habla a esta persona (su contexto de
-- onboarding, su ecorregión). Ordenar por personalización primero rompería el
-- objetivo de dificultad, que es lo que sostiene el 82 % de acierto.
create or replace function ac_elegir_item(
  p_uid uuid, p_concepto uuid, p_b_objetivo real, p_acc text, p_anillo int,
  p_contextos text[], p_region text,
  p_items_usados uuid[], p_plantillas_usadas uuid[], p_ultima_plantilla uuid)
returns jsonb language plpgsql volatile security definer set search_path = public as $fn$
declare v_row record;
begin
  select x.id, x.plantilla_id, x.seed, x.dificultad, x.payload_publico, x.tipo into v_row
  from (
    select i.id, i.plantilla_id, i.seed, i.dificultad, i.payload_publico, p.tipo,
           (case when i.slot_valores->>'contexto' = any(p_contextos) then 0 else 1 end) as c_fit,
           (case when i.slot_valores->>'region' in (p_region, 'general') then 0 else 1 end) as r_fit
    from ac_items i
    join ac_plantillas p on p.id = i.plantilla_id
    join ac_plantilla_conceptos pc on pc.plantilla_id = p.id
    where pc.concepto_id = p_concepto
      and pc.peso >= 0.8
      and i.status = 'aprobado' and p.status = 'aprobado'
      and p.tipo not in ('microlectura','dato_vivo')
      and i.age_groups @> array[p_acc]
      and i.anillo_min <= p_anillo
      and not (i.id = any(p_items_usados))
      -- Nunca dos hermanos de la misma plantilla en una sesión: cuatro isomorfos
      -- seguidos son "variedad" solo en el papel.
      and not (i.plantilla_id = any(p_plantillas_usadas))
      -- Y nunca dos consecutivos de la misma plantilla: el intercalado propiamente
      -- dicho, que es la decisión de secuenciación con mejor retorno que existe.
      and i.plantilla_id is distinct from p_ultima_plantilla
      -- Ventana de exclusión: nada que haya visto en los últimos 14 días.
      and not exists (
        select 1 from ac_entregas e
        join ac_sesiones s on s.id = e.sesion_id
        where s.user_id = p_uid and e.item_id = i.id
          and e.issued_at > now() - interval '14 days')
    order by abs(i.dificultad - p_b_objetivo)
    limit 8
  ) x
  order by x.c_fit, x.r_fit, random()
  limit 1;

  if not found then return null; end if;

  return jsonb_build_object('item_id', v_row.id, 'plantilla_id', v_row.plantilla_id,
    'seed', v_row.seed, 'dificultad', v_row.dificultad, 'tipo', v_row.tipo,
    'payload', v_row.payload_publico, 'concepto_id', p_concepto);
end $fn$;

revoke all on function ac_elegir_item(uuid,uuid,real,text,int,text[],text,uuid[],uuid[],uuid)
  from public, anon, authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 6 · academia_start_session — el compositor
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function academia_start_session(p_hoja_id uuid, p_tipo text default 'hoja')
returns jsonb language plpgsql volatile security definer set search_path = public as $fn$
declare
  v_uid uuid := auth.uid(); v_prof profiles%rowtype; v_acc text; v_anillo int;
  v_pro boolean; v_libre int; v_dia date; v_hojas int; v_savia int := 0;
  v_hoja ac_hojas%rowtype; v_rama text; v_tipo text := coalesce(p_tipo, 'hoja');
  v_theta real; v_b_star real; v_b real; v_contextos text[]; v_region text;
  v_nuevos uuid[] := '{}'; v_repaso uuid[] := '{}'; v_debiles uuid[] := '{}';
  v_relleno uuid[] := '{}'; v_multi uuid[] := '{}'; v_plan uuid[] := '{}';
  v_items uuid[] := '{}'; v_plantillas uuid[] := '{}'; v_ultima uuid;
  v_sesion uuid; v_orden int := 0; v_pasos jsonb := '[]'::jsonb;
  v_c uuid; v_pick jsonb; v_bar jsonb; v_entrega uuid; v_intro record;
  v_objetivo int := 9; v_graded int := 0; v_pase int;
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  if not ac_setting_bool('academia_enabled', true) then
    return jsonb_build_object('ok', false, 'error', 'La Academia está en pausa por un momento.');
  end if;
  if v_tipo not in ('hoja','riego') then
    return jsonb_build_object('ok', false, 'error', 'Tipo de sesión inválido.');
  end if;

  select * into v_prof from profiles where id = v_uid;
  if not found then raise exception 'Perfil no encontrado' using errcode = 'P0001'; end if;
  v_acc := coalesce(v_prof.account_type::text, 'adult');
  v_pro := brote_is_pro(v_uid);
  v_contextos := ac_contextos(v_prof.context);
  v_region := ac_region_de(v_prof.city, v_prof.neighborhood);

  insert into ac_user_anillo (user_id, anillo) values (v_uid, 1) on conflict do nothing;
  select coalesce(max(anillo), 1) into v_anillo from ac_user_anillo
    where user_id = v_uid and cerrado_at is null;

  if v_tipo = 'hoja' then
    select * into v_hoja from ac_hojas
     where id = p_hoja_id and status = 'aprobado' and age_groups @> array[v_acc];
    if not found then
      return jsonb_build_object('ok', false, 'error',
        'Esa hoja no está disponible para tu cuenta.');
    end if;
    select g.rama_slug into v_rama from ac_gajos g where g.id = v_hoja.gajo_id;
  else
    v_rama := 'tronco';
  end if;

  -- ── Savia. Se consume al EMPEZAR, nunca al terminar: si se cobrara al final,
  -- abandonar sería gratis y el límite no existiría. El riego no cuesta nada
  -- por diseño — el limitador nunca bloquea la retención, solo el territorio nuevo.
  if v_tipo = 'hoja' and not v_pro then
    v_libre := ac_setting_int('academia_savia_libre', 5);
    if v_libre <= 0 then
      return jsonb_build_object('ok', false, 'error', 'sin_savia',
        'mensaje', 'La Academia está en pausa por un momento.');
    end if;
    v_dia := ac_dia_local(v_uid);
    -- UNA sentencia atómica: chequea y suma sin leer antes. Sin esto hay una
    -- carrera y con dos pestañas abiertas la cuota del día se duplica.
    insert into ac_uso_diario (user_id, dia_local, hojas)
    values (v_uid, v_dia, 1)
    on conflict (user_id, dia_local) do update
      set hojas = ac_uso_diario.hojas + 1
      where ac_uso_diario.hojas < (v_libre + ac_uso_diario.savia_extra)
    returning hojas into v_hojas;
    if v_hojas is null then
      return jsonb_build_object('ok', false, 'error', 'sin_savia',
        'mensaje', 'Se te terminó la savia por hoy. Vuelve a subir a la medianoche.');
    end if;
    v_savia := 1;
  end if;

  -- ── Elo de la rama y dificultad objetivo.
  -- b* = θ − ln(P*/(1−P*)) con P* = 0.82 ⇒ ln(0.82/0.18) = 1.5163
  select theta into v_theta from ac_user_rama where user_id = v_uid and rama_slug = v_rama;
  v_theta := coalesce(v_theta, 0);
  v_b_star := v_theta - 1.5163;

  -- ── Las tres tajadas (10-el-bosque.md §4).
  if v_tipo = 'hoja' then
    select coalesce(array_agg(c.id order by c.dificultad_base), '{}') into v_nuevos
    from ac_hoja_conceptos hc
    join ac_conceptos c on c.id = hc.concepto_id
    left join ac_user_concepto uc on uc.concepto_id = c.id and uc.user_id = v_uid
    where hc.hoja_id = v_hoja.id and c.status = 'aprobado' and c.age_groups @> array[v_acc]
      and coalesce(uc.vistas, 0) = 0;

    select coalesce(array_agg(c.id order by c.dificultad_base), '{}') into v_relleno
    from ac_hoja_conceptos hc
    join ac_conceptos c on c.id = hc.concepto_id
    where hc.hoja_id = v_hoja.id and c.status = 'aprobado' and c.age_groups @> array[v_acc];

    -- Y detras, los demas conceptos del MISMO gajo. Van al final del relleno, o
    -- sea que solo entran cuando los de la hoja no alcanzan para llenar la
    -- sesion. Pasa de verdad al repetir una hoja: la ventana de exclusion de 14
    -- dias saca todo lo ya visto y una hoja nombra dos conceptos en promedio,
    -- asi que la segunda vuelta se quedaba en seis pasos. El gajo es la unidad
    -- tematica coherente, asi que completar con sus vecinos no desvia la sesion.
    select v_relleno || coalesce(array_agg(c.id order by c.dificultad_base), '{}')
      into v_relleno
    from ac_hojas h2
    join ac_hoja_conceptos hc2 on hc2.hoja_id = h2.id
    join ac_conceptos c on c.id = hc2.concepto_id
    where h2.gajo_id = v_hoja.gajo_id and h2.status = 'aprobado'
      and c.status = 'aprobado' and c.age_groups @> array[v_acc]
      and not (c.id = any(v_relleno));
  end if;

  -- repaso vencido: R < 0.9, el más olvidado primero
  select coalesce(array_agg(x.id order by x.r), '{}') into v_repaso from (
    select c.id, ac_retrievability(uc.last_seen, uc.half_life) as r
    from ac_user_concepto uc
    join ac_conceptos c on c.id = uc.concepto_id
    where uc.user_id = v_uid and uc.vistas > 0
      and c.status = 'aprobado' and c.age_groups @> array[v_acc]
      and ac_retrievability(uc.last_seen, uc.half_life) < 0.9
    order by 2 limit 40) x;

  -- puntos débiles: mastery entre 0.3 y 0.7
  select coalesce(array_agg(c.id order by uc.mastery_ema), '{}') into v_debiles
  from ac_user_concepto uc
  join ac_conceptos c on c.id = uc.concepto_id
  where uc.user_id = v_uid and uc.mastery_ema between 0.3 and 0.7
    and c.status = 'aprobado' and c.age_groups @> array[v_acc];

  -- Cupos ≈45/30/25 sobre 8 pasos evaluados. Si una tajada está vacía —y en una
  -- cuenta nueva las dos de historial SIEMPRE lo están— el resto se queda el
  -- cupo. Una sesión a medias por falta de historial sería el peor primer día.
  if v_tipo = 'hoja' then
    v_multi := (select coalesce(array_agg(x), '{}') from unnest(v_nuevos)  with ordinality t(x, n) where n <= 4)
            || (select coalesce(array_agg(x), '{}') from unnest(v_repaso)  with ordinality t(x, n) where n <= 2)
            || (select coalesce(array_agg(x), '{}') from unnest(v_debiles) with ordinality t(x, n) where n <= 2);
  else
    v_multi := (select coalesce(array_agg(x), '{}') from unnest(v_repaso)  with ordinality t(x, n) where n <= 6)
            || (select coalesce(array_agg(x), '{}') from unnest(v_debiles) with ordinality t(x, n) where n <= 3);
    v_relleno := v_repaso || v_debiles;
  end if;

  -- Relleno hasta el objetivo, repitiendo conceptos si hace falta. Son ÍTEMS
  -- distintos del mismo concepto, no el mismo ejercicio dos veces: `ac_elegir_item`
  -- excluye las plantillas ya usadas en esta sesión.
  v_pase := 0;
  while coalesce(array_length(v_multi, 1), 0) < v_objetivo
        and coalesce(array_length(v_relleno, 1), 0) > 0 and v_pase < 5 loop
    v_multi := v_multi || v_relleno;
    v_pase := v_pase + 1;
  end loop;

  if coalesce(array_length(v_multi, 1), 0) = 0 then
    if v_savia > 0 then
      update ac_uso_diario set hojas = greatest(0, hojas - 1)
       where user_id = v_uid and dia_local = v_dia;
    end if;
    return jsonb_build_object('ok', false, 'error', 'sin_contenido',
      'mensaje', case when v_tipo = 'riego'
        then 'Todavía no tenés nada para regar. Volvé después de aprender un par de hojas.'
        else 'Todavía no hay ejercicios para esta hoja.' end);
  end if;

  -- Round-robin sobre los conceptos distintos: garantiza el intercalado y que
  -- nunca haya más de dos seguidos del mismo concepto.
  with ms as (
    select x as c, n as i from unnest(v_multi) with ordinality t(x, n)
  ), ranked as (
    select c, i, row_number() over (partition by c order by i) as k,
           min(i) over (partition by c) as primero
    from ms
  )
  select coalesce(array_agg(c order by k, primero), '{}') into v_plan from ranked;

  -- ── La sesión existe antes que sus entregas.
  insert into ac_sesiones (user_id, hoja_id, tipo, pasos, savia_gastada)
  values (v_uid, case when v_tipo = 'hoja' then v_hoja.id end, v_tipo, 0, v_savia)
  returning id into v_sesion;

  -- ── Microlectura de apertura, SOLO si la sesión introduce algo nuevo. No es
  -- una entrega: no se corrige, así que no ocupa una fila de ac_entregas ni
  -- puede quedar "sin responder" bloqueando el cierre de la sesión.
  if coalesce(array_length(v_nuevos, 1), 0) > 0 then
    select i.id as item_id, i.payload_publico as payload into v_intro
    from ac_items i
    join ac_plantillas p on p.id = i.plantilla_id
    join ac_plantilla_conceptos pc on pc.plantilla_id = p.id
    where pc.concepto_id = any(v_nuevos)
      and p.tipo = 'microlectura' and i.status = 'aprobado' and p.status = 'aprobado'
      and i.age_groups @> array[v_acc] and i.anillo_min <= v_anillo
    order by random() limit 1;
    if found then
      v_orden := v_orden + 1;
      v_pasos := v_pasos || jsonb_build_array(jsonb_build_object(
        'orden', v_orden, 'entrega_id', null, 'tipo', 'microlectura',
        'payload', v_intro.payload));
    end if;
  end if;

  -- ── Los pasos evaluados.
  foreach v_c in array v_plan loop
    exit when v_graded >= v_objetivo - (case when v_orden > v_graded then 1 else 0 end);
    exit when v_orden >= 12;
    -- Abrir un poco más fácil que el objetivo y cerrar en algo que probablemente
    -- salga bien. Entre medio, el objetivo.
    v_b := case
             when v_graded = 0 then v_b_star - 0.4
             when v_graded >= v_objetivo - 2 then v_b_star - 0.3
             else v_b_star end;
    v_pick := ac_elegir_item(v_uid, v_c, v_b, v_acc, v_anillo, v_contextos, v_region,
                             v_items, v_plantillas, v_ultima);
    if v_pick is null then continue; end if;

    v_bar := ac_barajar(v_pick->'payload', (v_pick->>'tipo')::ac_tipo_ejercicio);
    v_orden := v_orden + 1; v_graded := v_graded + 1;

    insert into ac_entregas (sesion_id, orden, item_id, plantilla_id, seed, perm,
                             dificultad, theta_previo)
    values (v_sesion, v_orden, (v_pick->>'item_id')::uuid, (v_pick->>'plantilla_id')::uuid,
            (v_pick->>'seed')::bigint,
            coalesce((select array_agg(e::smallint) from jsonb_array_elements_text(v_bar->'perm') e),
                     '{}'::smallint[]),
            (v_pick->>'dificultad')::real, v_theta)
    returning id into v_entrega;

    v_items := v_items || (v_pick->>'item_id')::uuid;
    v_plantillas := v_plantillas || (v_pick->>'plantilla_id')::uuid;
    v_ultima := (v_pick->>'plantilla_id')::uuid;

    -- Lo único que sale: tipo y payload barajado. Ni clave, ni explicación, ni
    -- fuente. La fuente es parte de la respuesta, no de la pregunta.
    v_pasos := v_pasos || jsonb_build_array(jsonb_build_object(
      'orden', v_orden, 'entrega_id', v_entrega, 'tipo', v_pick->>'tipo',
      'payload', v_bar->'payload'));
  end loop;

  if v_graded = 0 then
    -- No se pudo armar nada: se devuelve la savia en el acto. Cobrar por una
    -- sesión vacía sería el peor error posible del limitador.
    delete from ac_sesiones where id = v_sesion;
    if v_savia > 0 then
      update ac_uso_diario set hojas = greatest(0, hojas - 1)
       where user_id = v_uid and dia_local = v_dia;
    end if;
    return jsonb_build_object('ok', false, 'error', 'sin_contenido',
      'mensaje', 'Todavía no hay ejercicios nuevos acá. Probá con otra hoja.');
  end if;

  update ac_sesiones set pasos = v_orden where id = v_sesion;

  return jsonb_build_object('ok', true, 'sesion_id', v_sesion, 'tipo', v_tipo,
    'hoja', case when v_tipo = 'hoja' then jsonb_build_object(
      'id', v_hoja.id, 'slug', v_hoja.slug, 'titulo_es', v_hoja.titulo_es,
      'bajada_es', v_hoja.bajada_es) end,
    'rama_slug', v_rama, 'pasos', v_pasos, 'total', v_orden,
    'savia_gastada', v_savia,
    'expires_at', (select expires_at from ac_sesiones where id = v_sesion));
end $fn$;

-- Regar es gratis y siempre lo va a ser. Es el mismo compositor con la mezcla
-- invertida: todo repaso, intercalado entre ramas, sin costo de savia.
create or replace function academia_riego()
returns jsonb language plpgsql volatile security definer set search_path = public as $fn$
begin
  return academia_start_session(null, 'riego');
end $fn$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7 · academia_answer — corrige UNA entrega, atómicamente y de un solo uso.
--
-- El `update ... where answered_at is null` es a la vez el candado de repetición
-- y la garantía de una respuesta por entrega. Sin él, un MCQ de 4 opciones es un
-- oráculo de cuatro intentos.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function academia_answer(p_entrega_id uuid, p_respuesta jsonb)
returns jsonb language plpgsql volatile security definer set search_path = public as $fn$
declare
  v_uid uuid := auth.uid(); v_e ac_entregas%rowtype; v_s ac_sesiones%rowtype;
  v_item ac_items%rowtype; v_tipo ac_tipo_ejercicio; v_rama text;
  v_lat int; v_correcto boolean := false; v_parcial real := 0;
  v_clave jsonb; v_sol jsonb; v_k int := 0; v_g real := 0;
  v_resp_ids text[]; v_clave_ids text[]; v_ok int; v_tot int;
  v_elegido text; v_nota text; v_misc text;
  v_theta real; v_resp int; v_kk real; v_p real; v_fuerza real := 0;
  v_seguidas int; v_requeue boolean := false; v_nuevo_orden int;
  v_clave_tokens jsonb; v_id text; v_val numeric; v_obj numeric;
  v_tol numeric; v_rec boolean := false;
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;

  select * into v_e from ac_entregas where id = p_entrega_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Esa respuesta no existe.');
  end if;
  select * into v_s from ac_sesiones where id = v_e.sesion_id;
  if v_s.user_id <> v_uid then
    return jsonb_build_object('ok', false, 'error', 'Esa sesión no es tuya.');
  end if;
  if v_s.finished_at is not null or v_s.abandonada_at is not null then
    return jsonb_build_object('ok', false, 'error', 'Esa sesión ya está cerrada.');
  end if;
  if now() > v_s.expires_at then
    return jsonb_build_object('ok', false, 'error', 'expirada',
      'mensaje', 'Esta sesión venció. Empezá una nueva cuando quieras.');
  end if;

  -- clock_timestamp() y NO now(): now() esta congelado en el instante en que
  -- arranco la transaccion, asi que si varias respuestas cayeran alguna vez en
  -- la misma transaccion todas medirian 0 ms y las marcaria a todas como
  -- imposibles. La latencia es tiempo de pared, no tiempo de transaccion.
  v_lat := greatest(0, (extract(epoch from (clock_timestamp() - v_e.issued_at)) * 1000)::int);

  -- El candado. Si otra llamada llegó primero, `found` es falso y no se corrige
  -- dos veces ni se premia dos veces.
  update ac_entregas
     set answered_at = now(), elegido = p_respuesta, latency_ms = v_lat
   where id = p_entrega_id and answered_at is null
  returning * into v_e;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'ya_respondida',
      'mensaje', 'Ese paso ya lo respondiste.');
  end if;

  select * into v_item from ac_items where id = v_e.item_id;
  select tipo into v_tipo from ac_plantillas where id = v_e.plantilla_id;
  v_sol := v_item.solucion;
  v_clave := v_sol -> 'clave';

  -- ── Corrección por tipo.
  if v_tipo in ('opcion_multiple','elegir_la_accion') then
    v_k := coalesce(jsonb_array_length(v_item.payload_publico->'opciones'), 0);
    v_elegido := ac_desmapear(v_item.payload_publico, v_tipo, v_e.perm, p_respuesta->>'elegido');
    v_correcto := v_elegido is not null and v_clave ? v_elegido;
    v_parcial := case when v_correcto then 1 else 0 end;
    if not v_correcto and v_elegido is not null then
      v_nota := v_sol #>> array['por_opcion', v_elegido, 'nota'];
      v_misc := v_sol #>> array['por_opcion', v_elegido, 'misconception_slug'];
    end if;

  elsif v_tipo = 'mito_o_dato' then
    v_k := 2;
    v_correcto := (p_respuesta->'es_dato') = (v_sol->'es_dato');
    v_parcial := case when v_correcto then 1 else 0 end;

  elsif v_tipo in ('ordenar_secuencia','ranking_impacto','cadena_causal') then
    select coalesce(array_agg(
             ac_desmapear(v_item.payload_publico, v_tipo, v_e.perm, t)), '{}')
      into v_resp_ids
      from jsonb_array_elements_text(coalesce(p_respuesta->'orden', p_respuesta->'cadena', '[]'::jsonb)) t;
    select coalesce(array_agg(t), '{}') into v_clave_ids
      from jsonb_array_elements_text(coalesce(v_clave, '[]'::jsonb)) t;
    v_parcial := ac_kendall(v_resp_ids, v_clave_ids);
    -- Una cadena causal es exacta o no es: media cadena causal no explica nada.
    v_correcto := (v_resp_ids = v_clave_ids);
    if v_tipo = 'cadena_causal' then
      v_parcial := case when v_correcto then 1 else 0 end;
    end if;

  elsif v_tipo = 'clasificar_en_cestos' then
    -- Crédito por ficha; ≥80 % cuenta como correcta.
    v_tot := 0; v_ok := 0;
    for v_id, v_elegido in
      select key, value #>> '{}' from jsonb_each(coalesce(p_respuesta->'asignacion', '{}'::jsonb))
    loop
      v_tot := v_tot + 1;
      if (v_clave ->> ac_desmapear(v_item.payload_publico, v_tipo, v_e.perm, v_id)) = v_elegido then
        v_ok := v_ok + 1;
      end if;
    end loop;
    v_tot := greatest(v_tot, coalesce(jsonb_array_length(v_item.payload_publico->'fichas'), 1));
    v_parcial := (v_ok::real / v_tot);
    v_correcto := v_parcial >= 0.8;

  elsif v_tipo = 'emparejar' then
    -- Todo o nada: emparejar tres de cinco no demuestra la relación.
    v_tot := 0; v_ok := 0;
    for v_id, v_elegido in
      select key, value #>> '{}' from jsonb_each(coalesce(p_respuesta->'pares', '{}'::jsonb))
    loop
      v_tot := v_tot + 1;
      if (v_clave ->> v_id) = ac_desmapear(v_item.payload_publico, v_tipo, v_e.perm, v_elegido) then
        v_ok := v_ok + 1;
      end if;
    end loop;
    v_correcto := v_tot > 0 and v_ok = v_tot
                  and v_tot = coalesce(jsonb_array_length(v_item.payload_publico->'derecha'), 0);
    v_parcial := case when v_correcto then 1 else 0 end;

  elsif v_tipo = 'estimacion_numerica' then
    -- Bandas de tolerancia: ±15 % completo, ±40 % parcial. La intuición de
    -- magnitud es el objetivo; el número exacto no.
    v_val := (p_respuesta->>'valor')::numeric;
    v_obj := (v_sol->>'valor')::numeric;
    if v_val is null or v_obj is null or v_obj = 0 then
      v_parcial := 0; v_correcto := false;
    else
      v_tol := abs(v_val - v_obj) / abs(v_obj);
      if v_tol <= 0.15 then v_parcial := 1; v_correcto := true;
      elsif v_tol <= 0.40 then v_parcial := 0.5; v_correcto := false;
      else v_parcial := 0; v_correcto := false; end if;
    end if;

  elsif v_tipo = 'detectar_greenwashing' then
    -- Por span: aciertos = marcados sin respaldo + no marcados con respaldo.
    v_tot := coalesce(jsonb_array_length(v_item.payload_publico->'spans'), 0);
    select coalesce(array_agg(
             ac_desmapear(v_item.payload_publico, v_tipo, v_e.perm, t)), '{}')
      into v_resp_ids
      from jsonb_array_elements_text(coalesce(p_respuesta->'marcados', '[]'::jsonb)) t;
    select coalesce(array_agg(t), '{}') into v_clave_ids
      from jsonb_array_elements_text(coalesce(v_clave, '[]'::jsonb)) t;
    select count(*) into v_ok
      from jsonb_array_elements(v_item.payload_publico->'spans') s
     where ((s->>'id') = any(v_resp_ids)) = ((s->>'id') = any(v_clave_ids));
    v_parcial := case when v_tot = 0 then 0 else (v_ok::real / v_tot) end;
    v_correcto := v_parcial >= 0.8;

  elsif v_tipo = 'mapa_localizar' then
    v_k := coalesce(jsonb_array_length(v_item.payload_publico->'alternativas'), 0);
    v_elegido := ac_desmapear(v_item.payload_publico, v_tipo, v_e.perm, p_respuesta->>'region');
    v_correcto := v_elegido is not null and v_clave ? v_elegido;
    v_parcial := case when v_correcto then 1 else 0 end;

  elsif v_tipo = 'completar_frase' then
    select coalesce(array_agg(
             ac_desmapear(v_item.payload_publico, v_tipo, v_e.perm, t)), '{}')
      into v_resp_ids
      from jsonb_array_elements_text(coalesce(p_respuesta->'huecos', '[]'::jsonb)) t;
    select coalesce(array_agg(t), '{}') into v_clave_ids
      from jsonb_array_elements_text(coalesce(v_clave, '[]'::jsonb)) t;
    v_k := coalesce(jsonb_array_length(v_item.payload_publico->'banco'), 0);
    v_correcto := v_resp_ids = v_clave_ids and coalesce(array_length(v_clave_ids,1),0) > 0;
    v_parcial := case when v_correcto then 1 else 0 end;

  else
    return jsonb_build_object('ok', false, 'error', 'Ese tipo de ejercicio no se corrige acá.');
  end if;

  update ac_entregas set correcto = v_correcto, parcial = v_parcial where id = v_e.id;
  update ac_sesiones
     set respondidas = respondidas + 1,
         correctas = correctas + case when v_correcto then 1 else 0 end,
         -- Responder en menos de 600 ms no es leer: se marca, NO se bloquea, y
         -- nunca se le dice nada a la persona. Tres marcas y la sesión da XP
         -- pero no semillas, en silencio.
         banderas = banderas + case when v_lat < 600 then 1 else 0 end
   where id = v_s.id;

  -- ── Estado: maestría por concepto (Q-matrix) y Elo por rama.
  update ac_items
     set veces_servido = veces_servido + 1,
         veces_correcto = veces_correcto + case when v_correcto then 1 else 0 end
   where id = v_item.id;

  for v_id, v_kk in
    select pc.concepto_id::text, pc.peso from ac_plantilla_conceptos pc
    where pc.plantilla_id = v_e.plantilla_id
  loop
    insert into ac_user_concepto (user_id, concepto_id, mastery_ema, half_life, vistas, aciertos, last_seen)
    values (v_uid, v_id::uuid,
            0.30 * v_kk * (case when v_correcto then 1 else 0 end),
            greatest(0.25, least(365, 1.0 * (case when v_correcto then 2.2 else 0.45 end))),
            1, case when v_correcto then 1 else 0 end, now())
    on conflict (user_id, concepto_id) do update set
      -- α = 0.30, escalado por el peso de la Q-matrix: un concepto incidental
      -- se mueve menos que el que el ítem realmente evalúa.
      mastery_ema = ac_user_concepto.mastery_ema
                    + (0.30 * v_kk) * ((case when v_correcto then 1 else 0 end) - ac_user_concepto.mastery_ema),
      half_life = greatest(0.25, least(365,
                    ac_user_concepto.half_life * (case when v_correcto then 2.2 else 0.45 end))),
      vistas = ac_user_concepto.vistas + 1,
      aciertos = ac_user_concepto.aciertos + case when v_correcto then 1 else 0 end,
      last_seen = now();
  end loop;

  select c.rama_slug into v_rama
    from ac_plantilla_conceptos pc join ac_conceptos c on c.id = pc.concepto_id
   where pc.plantilla_id = v_e.plantilla_id order by pc.peso desc limit 1;
  v_rama := coalesce(v_rama, 'tronco');

  select theta, respuestas into v_theta, v_resp
    from ac_user_rama where user_id = v_uid and rama_slug = v_rama;
  v_theta := coalesce(v_theta, 0); v_resp := coalesce(v_resp, 0);
  -- Piso de adivinanza: 1/k con k opciones, 0 en los tipos abiertos. Ver la
  -- nota de cabecera: el spec escribe k = 1 para abiertos, lo que daría P = 1.
  v_g := case when v_k >= 2 then 1.0 / v_k else 0 end;
  v_p := v_g + (1 - v_g) * (1.0 / (1 + exp(-(v_theta - v_e.dificultad))));
  v_kk := 1.0 / (1 + 0.05 * v_resp);
  insert into ac_user_rama (user_id, rama_slug, theta, respuestas)
  values (v_uid, v_rama, v_theta + v_kk * ((case when v_correcto then 1 else 0 end) - v_p), 1)
  on conflict (user_id, rama_slug) do update set
    theta = ac_user_rama.theta + v_kk * ((case when v_correcto then 1 else 0 end) - v_p),
    respuestas = ac_user_rama.respuestas + 1;

  -- La dificultad del ítem se mueve en sentido contrario, más despacio.
  update ac_items set dificultad = dificultad + 0.6 * v_kk * (v_p - (case when v_correcto then 1 else 0 end))
   where id = v_item.id;

  -- ── Re-encolar el error UNA vez, al final de la sesión. Los pasos agregados
  -- van al bloque 100+ para que (sesion_id, orden) nunca haya que renumerar:
  -- el cliente ya tiene los órdenes originales en la mano.
  if not v_correcto and not v_e.requeue then
    select coalesce(max(orden), 99) + 1 into v_nuevo_orden
      from ac_entregas where sesion_id = v_s.id and orden >= 100;
    v_nuevo_orden := greatest(v_nuevo_orden, 100);
    insert into ac_entregas (sesion_id, orden, item_id, plantilla_id, seed, perm,
                             dificultad, theta_previo, requeue)
    values (v_s.id, v_nuevo_orden, v_e.item_id, v_e.plantilla_id, v_e.seed, v_e.perm,
            v_e.dificultad, v_theta, true);
    update ac_sesiones set pasos = pasos + 1 where id = v_s.id;
    v_requeue := true;
  end if;

  -- Tres seguidas mal: Pip aparece UNA vez en toda la sesión. La bandera se
  -- calcula acá porque el servidor es el único que sabe el historial real.
  select count(*) into v_seguidas from (
    select correcto from ac_entregas
     where sesion_id = v_s.id and answered_at is not null
     order by answered_at desc limit 3) x
   where correcto is false;
  v_rec := (v_seguidas = 3);

  -- La fuerza que se muestra: maestría × retrievability, del concepto principal.
  select uc.mastery_ema * ac_retrievability(uc.last_seen, uc.half_life) into v_fuerza
    from ac_plantilla_conceptos pc
    join ac_user_concepto uc on uc.concepto_id = pc.concepto_id and uc.user_id = v_uid
   where pc.plantilla_id = v_e.plantilla_id order by pc.peso desc limit 1;

  -- La clave se devuelve en el espacio de tokens de ESTA entrega, para que la
  -- pantalla pueda marcar lo correcto sin saber nada del ítem.
  --
  -- Dos formas de clave, y las dos importan:
  --   ARRAY  la lista de ids correctos. En las secuencias el ORDEN es la
  --          respuesta, así que se mapea recorriendo la clave y no filtrando
  --          por pertenencia: filtrar devolvía los tokens en orden de posición
  --          y la pantalla habría mostrado una secuencia correcta mal ordenada.
  --   OBJETO `emparejar` y `clasificar_en_cestos` mapean una cosa con otra. Una
  --          de las dos puntas es un token de esta entrega y la otra no.
  -- La versión anterior asumía siempre array y reventaba con
  -- "cannot extract elements from an object" en esos dos tipos.
  if ac_token_key(v_tipo) is null then
    v_clave_tokens := null;
  elsif jsonb_typeof(v_clave) = 'array' then
    select coalesce(jsonb_agg(tok order by ord), '[]'::jsonb) into v_clave_tokens
    from (
      select c.ord, 't' || s.k as tok
      from jsonb_array_elements_text(v_clave) with ordinality c(cid, ord)
      join (select generate_subscripts(v_e.perm, 1) as k) s
        on (v_item.payload_publico -> ac_token_key(v_tipo) -> (v_e.perm[s.k] - 1) ->> 'id') = c.cid
    ) z;
  elsif jsonb_typeof(v_clave) = 'object' and v_tipo = 'emparejar' then
    -- izquierda (id estable del ítem) → token de la derecha barajada
    select coalesce(jsonb_object_agg(kv.key, 't' || s.k), '{}'::jsonb) into v_clave_tokens
    from jsonb_each_text(v_clave) kv
    join (select generate_subscripts(v_e.perm, 1) as k) s
      on (v_item.payload_publico -> 'derecha' -> (v_e.perm[s.k] - 1) ->> 'id') = kv.value;
  elsif jsonb_typeof(v_clave) = 'object' then
    -- ficha (token barajado) → cesto (id estable, su nombre ya está a la vista)
    select coalesce(jsonb_object_agg('t' || s.k, kv.value), '{}'::jsonb) into v_clave_tokens
    from jsonb_each_text(v_clave) kv
    join (select generate_subscripts(v_e.perm, 1) as k) s
      on (v_item.payload_publico -> 'fichas' -> (v_e.perm[s.k] - 1) ->> 'id') = kv.key;
  end if;

  return jsonb_build_object(
    'ok', true,
    'correcto', v_correcto,
    'parcial', round(v_parcial::numeric, 3),
    -- La explicación va SIEMPRE, se haya acertado o no: la explicación es el
    -- contenido, no un premio.
    'explicacion', v_sol->>'explicacion',
    'clave', v_clave_tokens,
    'clave_cruda', case when ac_token_key(v_tipo) is null then v_clave end,
    'nota_opcion', v_nota,
    'misconception', v_misc,
    'fuerza_concepto', round(coalesce(v_fuerza, 0)::numeric, 3),
    'fuente', (select jsonb_build_object('titulo', f.titulo, 'organizacion', f.organizacion,
                                         'url', f.url, 'publicado', f.publicado)
               from ac_fuentes f where f.id = (v_sol->>'fuente_id')::uuid),
    'reencolada', v_requeue,
    'recuperacion', v_rec);
end $fn$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8 · academia_accion_sugerida — el gancho que ninguna app de idiomas tiene.
--
-- Devuelve null antes que una acción mala. Nunca inventa una acción.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function academia_accion_sugerida(p_hoja_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare
  v_uid uuid := auth.uid(); v_acc text; v_xp bigint; v_tier int; v_rama text;
  v_local date; v_a activities%rowtype;
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  select coalesce(account_type::text, 'adult'), total_xp into v_acc, v_xp
    from profiles where id = v_uid;
  v_tier := (brote_get_rank(coalesce(v_xp, 0))->>'tier')::int;
  v_local := ac_dia_local(v_uid);

  select g.rama_slug into v_rama
    from ac_hojas h join ac_gajos g on g.id = h.gajo_id where h.id = p_hoja_id;

  -- El tronco no es un dominio, así que no tiene acciones propias. Se cae al
  -- dominio donde la persona ya viene actuando, que es la sugerencia honesta.
  if v_rama is null or v_rama = 'tronco' then
    select domain_slug into v_rama from user_domain_points
     where user_id = v_uid order by points desc limit 1;
    if v_rama is null then
      select unnest(interests) into v_rama from profiles where id = v_uid limit 1;
    end if;
  end if;
  if v_rama is null then return null; end if;

  select * into v_a from activities a
   where a.active
     and a.domain_slug = v_rama
     and a.age_groups @> array[v_acc]
     and coalesce((select r.tier from ranks r where r.slug = a.min_rank_slug), 1) <= v_tier
     -- Respeta la frecuencia real de la acción: una acción en enfriamiento es
     -- un link roto disfrazado de sugerencia.
     and not exists (
       select 1 from activity_completions ac
        where ac.user_id = v_uid and ac.activity_id = a.id
          and ac.status in ('honor','verified','pending')
          and (
            (a.frequency = 'one_time')
            or (a.type = 'daily' and ac.local_date = v_local)
            or (a.frequency = 'weekly' and ac.completed_at > now() - interval '168 hours')
            or (a.frequency = 'recurring' and ac.completed_at > now() -
                make_interval(hours => greatest(coalesce(a.repeat_cooldown_hours, 20), 1)))
          ))
   order by random()
   limit 1;

  if not found then return null; end if;

  return jsonb_build_object(
    'id', v_a.id, 'slug', v_a.slug, 'titulo_es', v_a.title_es, 'short_es', v_a.short_es,
    'domain_slug', v_a.domain_slug, 'base_points', v_a.base_points, 'icon', v_a.icon,
    'impact_water_l', v_a.impact_water_l, 'impact_co2_kg', v_a.impact_co2_kg,
    'impact_waste_kg', v_a.impact_waste_kg, 'impact_energy_kwh', v_a.impact_energy_kwh,
    'equivalencia_es', v_a.impact_equivalency_es);
end $fn$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9 · academia_finish_session — puntaje, XP, semillas, racha y el gancho.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function academia_finish_session(p_sesion_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = public as $fn$
declare
  v_uid uuid := auth.uid(); v_s ac_sesiones%rowtype; v_pend int;
  v_score int; v_primera_tanda int; v_primeras_ok int; v_acierto_primera real := 0;
  v_xp int := 0; v_correctas int; v_incorrectas int; v_primer_clear boolean := false;
  v_sem int := 0; v_sem_quiere int := 0; v_tope int; v_hoy int; v_permitido int;
  v_dia date; v_gajo uuid; v_rama text; v_anillo int; v_acc text;
  v_gajo_completo boolean := false; v_rama_completa boolean := false;
  v_prof profiles%rowtype; v_local date; v_streak int; v_streak_inc boolean := false;
  v_ach jsonb; v_conceptos jsonb; v_accion jsonb; v_sem_balance int;
  v_regado boolean := false;
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  select * into v_s from ac_sesiones where id = p_sesion_id;
  if not found or v_s.user_id <> v_uid then
    return jsonb_build_object('ok', false, 'error', 'Esa sesión no es tuya.');
  end if;
  if v_s.finished_at is not null then
    return jsonb_build_object('ok', false, 'error', 'Esa sesión ya está cerrada.');
  end if;

  -- No se cierra una sesión con pasos sin responder: sin esto, "terminar" en el
  -- paso 1 sería una sesión completa con puntaje perfecto.
  select count(*) into v_pend from ac_entregas
   where sesion_id = v_s.id and answered_at is null;
  if v_pend > 0 then
    return jsonb_build_object('ok', false, 'error', 'incompleta',
      'pendientes', v_pend, 'mensaje', 'Todavía te quedan pasos por responder.');
  end if;

  select * into v_prof from profiles where id = v_uid for update;
  v_acc := coalesce(v_prof.account_type::text, 'adult');
  v_local := (now() at time zone coalesce(nullif(v_prof.timezone, ''), 'America/Argentina/Buenos_Aires'))::date;
  v_dia := v_local;

  -- Puntaje sobre la PRIMERA vuelta. Los re-encolados son práctica, no examen:
  -- si contaran, bastaría con equivocarse en todo y acertar la segunda vez.
  select count(*), count(*) filter (where correcto), coalesce(avg(coalesce(parcial, 0)), 0)
    into v_primera_tanda, v_primeras_ok, v_acierto_primera
    from ac_entregas where sesion_id = v_s.id and not requeue;
  v_score := case when v_primera_tanda = 0 then 0
                  else round(100 * v_acierto_primera)::int end;
  v_acierto_primera := case when v_primera_tanda = 0 then 0
                            else v_primeras_ok::real / v_primera_tanda end;

  select count(*) filter (where correcto), count(*) filter (where not correcto)
    into v_correctas, v_incorrectas
    from ac_entregas where sesion_id = v_s.id and answered_at is not null;

  -- XP: 8 por acierto, 3 por error. Equivocarse también es practicar.
  v_xp := 8 * coalesce(v_correctas, 0) + 3 * coalesce(v_incorrectas, 0);

  if v_s.tipo = 'riego' then
    v_xp := v_xp + 35;
  elsif v_score >= 70 then
    v_xp := v_xp + 60;
    select completed_at is null into v_primer_clear
      from ac_user_hoja where user_id = v_uid and hoja_id = v_s.hoja_id;
    v_primer_clear := coalesce(v_primer_clear, true);
    if v_primer_clear then v_xp := v_xp + 40; end if;
  end if;

  if v_s.hoja_id is not null then
    insert into ac_user_hoja (user_id, hoja_id, mejor_score, intentos, completed_at)
    values (v_uid, v_s.hoja_id, v_score, 1, case when v_score >= 70 then now() end)
    on conflict (user_id, hoja_id) do update set
      mejor_score = greatest(ac_user_hoja.mejor_score, excluded.mejor_score),
      intentos = ac_user_hoja.intentos + 1,
      completed_at = coalesce(ac_user_hoja.completed_at, case when v_score >= 70 then now() end),
      updated_at = now();

    select g.id, g.rama_slug, g.anillo into v_gajo, v_rama, v_anillo
      from ac_hojas h join ac_gajos g on g.id = h.gajo_id where h.id = v_s.hoja_id;

    select count(*) = 0 into v_gajo_completo
      from ac_hojas h
      left join ac_user_hoja uh on uh.hoja_id = h.id and uh.user_id = v_uid
     where h.gajo_id = v_gajo and h.status = 'aprobado' and h.age_groups @> array[v_acc]
       and uh.completed_at is null;

    if v_gajo_completo then
      select count(*) = 0 into v_rama_completa
        from ac_gajos g
        join ac_hojas h on h.gajo_id = g.id and h.status = 'aprobado' and h.age_groups @> array[v_acc]
        left join ac_user_hoja uh on uh.hoja_id = h.id and uh.user_id = v_uid
       where g.rama_slug = v_rama and g.anillo = v_anillo
         and g.status = 'aprobado' and g.age_groups @> array[v_acc]
         and uh.completed_at is null;
    end if;
  end if;

  -- ── Semillas. Solo primer clear, con tope diario, y en silencio si la sesión
  -- quedó marcada tres veces por tiempos imposibles.
  if v_s.banderas < 3 then
    if v_s.tipo = 'hoja' and v_score >= 70 and v_primer_clear then
      v_sem_quiere := v_sem_quiere + 2;
      if v_acierto_primera >= 0.9 then v_sem_quiere := v_sem_quiere + 1; end if;
    end if;
    if v_gajo_completo then v_sem_quiere := v_sem_quiere + 10; end if;
    if v_rama_completa then v_sem_quiere := v_sem_quiere + 40; end if;
    if v_s.tipo = 'riego' and v_score >= 85 then
      v_regado := true; v_sem_quiere := v_sem_quiere + 3;
    end if;

    if v_sem_quiere > 0 then
      v_tope := ac_setting_int('academia_semillas_dia', 15);
      -- El tope se comprueba contra el libro mayor, que es la fuente de verdad,
      -- y DENTRO de la misma transacción que otorga. Sin tope, el árbol se
      -- convierte en una granja de semillas y la economía de cosméticos muere.
      select coalesce(sum(amount), 0) into v_hoy from semilla_ledger
       where user_id = v_uid and source = 'academia'
         and created_at >= (v_dia::timestamp at time zone
              coalesce(nullif(v_prof.timezone, ''), 'America/Argentina/Buenos_Aires'));
      v_permitido := greatest(0, v_tope - v_hoy);
      v_sem := least(v_sem_quiere, v_permitido);
      if v_sem > 0 then
        -- Una fila por premio: la clave primaria es la que garantiza
        -- "una sola vez, jamás dos", y no una promesa del código.
        insert into ac_user_premios (user_id, clave, semillas)
        values (v_uid,
          case when v_s.tipo = 'riego' then 'riego:' || v_s.id::text
               else 'hoja:' || v_s.hoja_id::text end, v_sem)
        on conflict (user_id, clave) do nothing;
        if found then
          perform brote_grant_semillas(v_uid, v_sem, 'academia', v_s.id::text,
            case when v_s.tipo = 'riego' then 'Riego de la Academia' else 'Hoja aprendida' end);
          insert into ac_uso_diario (user_id, dia_local, semillas)
          values (v_uid, v_dia, v_sem)
          on conflict (user_id, dia_local) do update
            set semillas = ac_uso_diario.semillas + v_sem;
        else
          v_sem := 0;   -- ya se había premiado este hito
        end if;
      end if;
    end if;
  end if;

  -- ── XP, racha y logros por los caminos que ya existen.
  if v_xp > 0 then
    update profiles set total_xp = total_xp + v_xp where id = v_uid;
    if v_rama is not null and v_rama <> 'tronco' then
      insert into user_domain_points (user_id, domain_slug, points)
      values (v_uid, v_rama, v_xp)
      on conflict (user_id, domain_slug) do update
        set points = user_domain_points.points + v_xp;
    end if;
  end if;

  -- Aprender también mantiene viva la racha: es actividad real del día.
  if v_prof.last_streak_date is distinct from v_local then
    if v_prof.last_streak_date = v_local - 1 then
      v_streak := v_prof.current_streak + 1;
    else
      v_streak := 1;
    end if;
    v_streak_inc := true;
    update profiles set current_streak = v_streak,
      longest_streak = greatest(longest_streak, v_streak), last_streak_date = v_local
     where id = v_uid;
  else
    v_streak := v_prof.current_streak;
  end if;

  v_ach := brote_award_achievements(v_uid);
  update ac_sesiones set finished_at = now() where id = v_s.id;

  -- Los conceptos que se reforzaron, con su fuerza nueva. Números reales.
  select coalesce(jsonb_agg(distinct jsonb_build_object(
    'slug', c.slug, 'titulo_es', c.titulo_es,
    'fuerza', round((uc.mastery_ema * ac_retrievability(uc.last_seen, uc.half_life))::numeric, 3))),
    '[]'::jsonb)
  into v_conceptos
  from ac_entregas e
  join ac_plantilla_conceptos pc on pc.plantilla_id = e.plantilla_id and pc.peso >= 0.8
  join ac_conceptos c on c.id = pc.concepto_id
  join ac_user_concepto uc on uc.concepto_id = c.id and uc.user_id = v_uid
  where e.sesion_id = v_s.id;

  if v_s.hoja_id is not null then
    v_accion := academia_accion_sugerida(v_s.hoja_id);
  end if;

  select semillas into v_sem_balance from profiles where id = v_uid;

  return jsonb_build_object('ok', true,
    'score', v_score, 'aprobada', v_score >= 70, 'tipo', v_s.tipo,
    'correctas', v_correctas, 'total', v_primera_tanda,
    'acierto_primera', round(v_acierto_primera::numeric, 3),
    'xp', v_xp, 'semillas', v_sem, 'semillas_balance', coalesce(v_sem_balance, 0),
    'primer_clear', coalesce(v_primer_clear, false),
    'gajo_completo', v_gajo_completo, 'rama_completa', v_rama_completa,
    'regado', v_regado,
    'racha', v_streak, 'racha_sumo', v_streak_inc,
    'conceptos', v_conceptos,
    'accion', v_accion,
    'nuevos_titulos', v_ach->'titles', 'nuevas_insignias', v_ach->'badges');
end $fn$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 10 · academia_abandonar — salir sin haber empezado no puede costar savia.
--
-- No está en la lista de RPC de 13-data-model.md §6, pero 12-economy §1 exige el
-- reembolso y ACCEPTANCE lo pide explícitamente. Un mal toque no puede costar un
-- quinto del día.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function academia_abandonar(p_sesion_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = public as $fn$
declare v_uid uuid := auth.uid(); v_s ac_sesiones%rowtype; v_resp int; v_reembolso boolean := false;
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  select * into v_s from ac_sesiones where id = p_sesion_id;
  if not found or v_s.user_id <> v_uid then
    return jsonb_build_object('ok', false, 'error', 'Esa sesión no es tuya.');
  end if;
  if v_s.finished_at is not null or v_s.abandonada_at is not null then
    return jsonb_build_object('ok', true, 'reembolso', false);
  end if;

  select count(*) into v_resp from ac_entregas
   where sesion_id = v_s.id and answered_at is not null;

  if v_s.savia_gastada > 0 and v_resp = 0 and v_s.started_at > now() - interval '60 seconds' then
    update ac_uso_diario set hojas = greatest(0, hojas - 1)
     where user_id = v_uid and dia_local = ac_dia_local(v_uid);
    v_reembolso := true;
  end if;

  update ac_sesiones set abandonada_at = now() where id = v_s.id;
  return jsonb_build_object('ok', true, 'reembolso', v_reembolso);
end $fn$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 11 · Permisos. Todo definer, todo revocado de public/anon, todo concedido
--      solo a authenticated.
-- ─────────────────────────────────────────────────────────────────────────────

revoke all on function academia_estado()                        from public, anon, authenticated;
revoke all on function academia_arbol()                         from public, anon, authenticated;
revoke all on function academia_gajo(text)                      from public, anon, authenticated;
revoke all on function academia_start_session(uuid, text)       from public, anon, authenticated;
revoke all on function academia_riego()                         from public, anon, authenticated;
revoke all on function academia_answer(uuid, jsonb)             from public, anon, authenticated;
revoke all on function academia_finish_session(uuid)            from public, anon, authenticated;
revoke all on function academia_accion_sugerida(uuid)           from public, anon, authenticated;
revoke all on function academia_abandonar(uuid)                 from public, anon, authenticated;

grant execute on function academia_estado()                     to authenticated;
grant execute on function academia_arbol()                      to authenticated;
grant execute on function academia_gajo(text)                   to authenticated;
grant execute on function academia_start_session(uuid, text)    to authenticated;
grant execute on function academia_riego()                      to authenticated;
grant execute on function academia_answer(uuid, jsonb)          to authenticated;
grant execute on function academia_finish_session(uuid)         to authenticated;
grant execute on function academia_accion_sugerida(uuid)        to authenticated;
grant execute on function academia_abandonar(uuid)              to authenticated;
