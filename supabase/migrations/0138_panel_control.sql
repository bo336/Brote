-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0138 — Lo que el panel necesita para manejar la app de verdad.
--
--   · `app_errores`: los errores del navegador de la gente, agrupados por día y
--     huella (mensaje + ruta), sin datos de quién. El bug de la lección en blanco
--     estuvo semanas sin que nadie lo viera porque no había dónde verlo.
--   · `admin_analitica_extra`: comparado con el período anterior, pegajosidad,
--     contabilidad de crecimiento (nuevos, retenidos, recuperados, perdidos),
--     retención D1/D7/D30, mapa de horarios, profundidad de uso, embudo de la
--     Academia (dónde se abandona), avisos, ingresos, gente en riesgo.
--   · `admin_salud`: tamaño de la base contra el tope del plan, crons y sus
--     fallos, cola de avisos, llamadas a funciones que fallaron, errores.
--   · `admin_persona` y `admin_persona_accion`: la ficha de una persona y lo que
--     se puede hacer con ella (suspender, levantar, regalar Brote+).
-- ════════════════════════════════════════════════════════════════════════════

-- ── Errores del cliente ─────────────────────────────────────────────────────

create table if not exists public.app_errores (
  dia        date not null,
  huella     text not null,
  mensaje    text not null,
  ruta       text,
  n          int not null default 1,
  personas   int not null default 1,
  primero_at timestamptz not null default now(),
  ultimo_at  timestamptz not null default now(),
  primary key (dia, huella)
);
create index if not exists app_errores_ultimo on public.app_errores (ultimo_at desc);
alter table public.app_errores enable row level security;
revoke all on public.app_errores from public, anon, authenticated;

create or replace function public.registrar_error(p_mensaje text, p_ruta text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hoy date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
  v_quien text := coalesce(auth.uid()::text, 'anon');
  v_msg text := left(btrim(coalesce(p_mensaje, '')), 300);
  -- La ruta sin ids: /aprender/sesion/<uuid> tiene que agrupar como una sola.
  v_ruta text := left(regexp_replace(split_part(coalesce(p_ruta, ''), '?', 1), '[0-9a-f]{8}-[0-9a-f-]{27,}', ':id', 'g'), 120);
  v_huella text;
begin
  if v_msg = '' then return; end if;
  -- Un navegador en un bucle de errores no puede llenar la tabla.
  if not brote_rate_limit('error:' || v_quien, 30, interval '1 hour') then return; end if;
  v_huella := md5(v_msg || '|' || v_ruta);
  insert into app_errores (dia, huella, mensaje, ruta) values (v_hoy, v_huella, v_msg, nullif(v_ruta, ''))
  on conflict (dia, huella) do update
    set n = app_errores.n + 1, ultimo_at = now(),
        -- Una aproximación barata: una persona por tope horario agotado no cuenta doble.
        personas = app_errores.personas + case when app_errores.ultimo_at < now() - interval '10 minutes' then 1 else 0 end;
exception when others then
  return;  -- reportar un error nunca puede ser otro error
end $$;
revoke all on function public.registrar_error(text, text) from public;
grant execute on function public.registrar_error(text, text) to anon, authenticated;

create or replace function public.brote_analitica_limpieza()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_uso int; v_rl int; v_err int;
begin
  delete from uso_diario where dia < (now() at time zone 'America/Argentina/Buenos_Aires')::date - 400;
  get diagnostics v_uso = row_count;
  delete from rate_limits where ventana < now() - interval '3 days';
  get diagnostics v_rl = row_count;
  delete from app_errores where dia < (now() at time zone 'America/Argentina/Buenos_Aires')::date - 60;
  get diagnostics v_err = row_count;
  delete from panel_intentos where at < now() - interval '180 days';
  return jsonb_build_object('uso_diario', v_uso, 'rate_limits', v_rl, 'errores', v_err);
end $$;

-- ── Analítica: lo que faltaba ───────────────────────────────────────────────

create or replace function public.admin_analitica_extra(p_pass text, p_dias int default 30)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hoy   date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
  v_dias  int := least(greatest(coalesce(p_dias, 30), 7), 120);
  v_out   jsonb;
begin
  if not admin_check(p_pass) then return jsonb_build_object('ok', false, 'error', 'Sin acceso'); end if;

  drop table if exists _x_reales;
  drop table if exists _x_act;
  create temp table _x_reales on commit drop as
    select p.id, (p.created_at at time zone 'America/Argentina/Buenos_Aires')::date as alta
      from profiles p where not coalesce(p.es_prueba, false);
  create index on _x_reales (id);
  create temp table _x_act on commit drop as
    select distinct x.user_id, x.dia
      from (
        select u.user_id, u.dia from uso_diario u where u.clave = 'activo' and u.dia >= v_hoy - 130
        union all
        select c.user_id, c.local_date from activity_completions c
         where c.local_date >= v_hoy - 130 and c.status in ('honor', 'verified', 'pending')
      ) x join _x_reales r on r.id = x.user_id;
  create index on _x_act (dia);
  create index on _x_act (user_id, dia);

  select jsonb_build_object(
    'ok', true,

    -- Este período contra el anterior: la flecha que dice si va mejor o peor.
    'comparado', jsonb_build_object(
      'activos_hoy', (select count(distinct user_id) from _x_act where dia = v_hoy),
      'activos_ayer', (select count(distinct user_id) from _x_act where dia = v_hoy - 1),
      'activos_7d', (select count(distinct user_id) from _x_act where dia > v_hoy - 7),
      'activos_7d_prev', (select count(distinct user_id) from _x_act where dia > v_hoy - 14 and dia <= v_hoy - 7),
      'activos_30d', (select count(distinct user_id) from _x_act where dia > v_hoy - 30),
      'activos_30d_prev', (select count(distinct user_id) from _x_act where dia > v_hoy - 60 and dia <= v_hoy - 30),
      'nuevos_7d', (select count(*) from _x_reales where alta > v_hoy - 7),
      'nuevos_7d_prev', (select count(*) from _x_reales where alta > v_hoy - 14 and alta <= v_hoy - 7),
      'nuevos_30d', (select count(*) from _x_reales where alta > v_hoy - 30),
      'nuevos_30d_prev', (select count(*) from _x_reales where alta > v_hoy - 60 and alta <= v_hoy - 30),
      'acciones_hoy', (select count(*) from activity_completions c join _x_reales r on r.id = c.user_id where c.local_date = v_hoy and c.status in ('honor','verified')),
      'acciones_ayer', (select count(*) from activity_completions c join _x_reales r on r.id = c.user_id where c.local_date = v_hoy - 1 and c.status in ('honor','verified')),
      'acciones_7d', (select count(*) from activity_completions c join _x_reales r on r.id = c.user_id where c.local_date > v_hoy - 7 and c.status in ('honor','verified')),
      'acciones_7d_prev', (select count(*) from activity_completions c join _x_reales r on r.id = c.user_id where c.local_date > v_hoy - 14 and c.local_date <= v_hoy - 7 and c.status in ('honor','verified'))),

    -- DAU / MAU: qué parte de quienes vienen en el mes vienen cada día.
    'pegajosidad', (select jsonb_build_object(
        'dau_promedio', round(coalesce(avg(d.n), 0), 1),
        'mau', (select count(distinct user_id) from _x_act where dia > v_hoy - 30),
        'porcentaje', case when (select count(distinct user_id) from _x_act where dia > v_hoy - 30) = 0 then 0
                           else round(100.0 * coalesce(avg(d.n), 0) / (select count(distinct user_id) from _x_act where dia > v_hoy - 30), 1) end)
      from (select g::date as dia, (select count(distinct user_id) from _x_act a where a.dia = g::date) as n
              from generate_series(v_hoy - 6, v_hoy, interval '1 day') g) d),

    -- Contabilidad de crecimiento, por semana (lunes).
    'contabilidad', (select coalesce(jsonb_agg(z order by z.semana), '[]'::jsonb) from (
      select s.semana,
             count(distinct e.user_id) filter (where r.alta >= s.semana) as nuevos,
             count(distinct e.user_id) filter (where r.alta < s.semana and exists (
                select 1 from _x_act a where a.user_id = e.user_id and a.dia between s.semana - 7 and s.semana - 1)) as retenidos,
             count(distinct e.user_id) filter (where r.alta < s.semana and not exists (
                select 1 from _x_act a where a.user_id = e.user_id and a.dia between s.semana - 7 and s.semana - 1)) as recuperados,
             (select count(distinct a2.user_id) from _x_act a2
               where a2.dia between s.semana - 7 and s.semana - 1
                 and not exists (select 1 from _x_act a3 where a3.user_id = a2.user_id and a3.dia between s.semana and s.semana + 6)) as perdidos
        from (select (date_trunc('week', v_hoy)::date - (7 * w)) as semana from generate_series(0, 7) w) s
        left join _x_act e on e.dia between s.semana and s.semana + 6
        left join _x_reales r on r.id = e.user_id
       group by s.semana) z),

    -- Volvieron el día 1, el 7 y el 30 (± ventana), entre quienes ya pasaron ese día.
    'retencion', (select jsonb_build_object(
        'd1', jsonb_build_object('base', count(*) filter (where alta <= v_hoy - 1),
              'vuelven', count(*) filter (where alta <= v_hoy - 1 and exists (select 1 from _x_act a where a.user_id = id and a.dia = alta + 1))),
        'd7', jsonb_build_object('base', count(*) filter (where alta <= v_hoy - 7),
              'vuelven', count(*) filter (where alta <= v_hoy - 7 and exists (select 1 from _x_act a where a.user_id = id and a.dia between alta + 6 and alta + 8))),
        'd30', jsonb_build_object('base', count(*) filter (where alta <= v_hoy - 30),
              'vuelven', count(*) filter (where alta <= v_hoy - 30 and exists (select 1 from _x_act a where a.user_id = id and a.dia between alta + 28 and alta + 32))))
      from _x_reales where alta > v_hoy - 120),

    -- A qué hora y qué día se hacen las cosas (acciones, hora de Buenos Aires).
    'horarios', (select coalesce(jsonb_agg(jsonb_build_object('dow', x.dow, 'hora', x.hora, 'n', x.n)), '[]'::jsonb) from (
        select extract(isodow from c.completed_at at time zone 'America/Argentina/Buenos_Aires')::int as dow,
               extract(hour from c.completed_at at time zone 'America/Argentina/Buenos_Aires')::int as hora,
               count(*) n
          from activity_completions c join _x_reales r on r.id = c.user_id
         where c.completed_at > now() - interval '30 days' and c.status in ('honor','verified')
         group by 1, 2) x),

    -- Cuánto usa cada persona activa cuando viene.
    'profundidad', (select jsonb_build_object(
        'vistas_por_persona_dia', round(coalesce(avg(t.vistas), 0), 1),
        'secciones_por_persona_dia', round(coalesce(avg(t.secciones), 0), 1))
      from (select u.user_id, u.dia, sum(u.n) vistas, count(*) secciones
              from uso_diario u join _x_reales r on r.id = u.user_id
             where u.clave like 'sec:%' and u.dia > v_hoy - 14 group by 1, 2) t),
    'acciones_por_activo_7d', (select round(
        coalesce((select count(*)::numeric from activity_completions c join _x_reales r on r.id = c.user_id where c.local_date > v_hoy - 7 and c.status in ('honor','verified')), 0)
        / nullif((select count(distinct user_id) from _x_act where dia > v_hoy - 7), 0), 1)),

    -- La Academia: cuánto se empieza, cuánto se termina y dónde se abandona.
    'academia', jsonb_build_object(
      'empezadas', (select count(*) from ac_intentos i join _x_reales r on r.id = i.user_id where i.started_at > now() - make_interval(days => v_dias)),
      'terminadas', (select count(*) from ac_intentos i join _x_reales r on r.id = i.user_id where i.started_at > now() - make_interval(days => v_dias) and i.finished_at is not null),
      'personas', (select count(distinct i.user_id) from ac_intentos i join _x_reales r on r.id = i.user_id where i.started_at > now() - make_interval(days => v_dias)),
      'aciertos_pct', (select round(100.0 * sum(i.correctas) / nullif(sum(i.respondidas), 0), 1) from ac_intentos i join _x_reales r on r.id = i.user_id where i.started_at > now() - make_interval(days => v_dias)),
      'por_tipo', (select coalesce(jsonb_agg(x order by x.respuestas desc), '[]'::jsonb) from (
          select p.tipo, count(*) as respuestas, round(100.0 * count(*) filter (where ip.correcto) / count(*), 1) as aciertos_pct
            from ac_intento_pasos ip join ac_pasos p on p.id = ip.paso_id join ac_intentos i on i.id = ip.intento_id
            join _x_reales r on r.id = i.user_id
           where ip.answered_at > now() - make_interval(days => v_dias)
           group by p.tipo) x),
      -- Las lecciones más abandonadas, y el último tipo de paso que se respondió.
      'abandonos', (select coalesce(jsonb_agg(x order by x.sin_terminar desc, x.empezadas desc), '[]'::jsonb) from (
          select l.slug, l.titulo_es as titulo, count(*) as empezadas,
                 count(*) filter (where i.finished_at is null) as sin_terminar,
                 round(avg(i.respondidas)::numeric, 1) as respondidas_prom,
                 (select p.tipo from ac_intento_pasos ip join ac_pasos p on p.id = ip.paso_id
                   where ip.intento_id = (array_agg(i.id order by i.started_at desc))[1] and ip.answered_at is not null
                   order by ip.orden desc limit 1) as ultimo_tipo
            from ac_intentos i join ac_lecciones l on l.id = i.leccion_id join _x_reales r on r.id = i.user_id
           where i.started_at > now() - make_interval(days => greatest(v_dias, 60))
           group by l.id, l.slug, l.titulo_es
          having count(*) filter (where i.finished_at is null) > 0
           order by count(*) filter (where i.finished_at is null) desc limit 10) x)),

    'avisos', jsonb_build_object(
      'enviados_7d', (select count(*) from notifications n join _x_reales r on r.id = n.user_id where n.push_estado = 'enviada' and n.push_enviada_at > now() - interval '7 days'),
      'abiertos_7d', (select coalesce(sum(u.n), 0) from uso_diario u join _x_reales r on r.id = u.user_id where u.clave = 'ev:aviso_abierto' and u.dia > v_hoy - 7),
      'activaron_30d', (select count(distinct u.user_id) from uso_diario u join _x_reales r on r.id = u.user_id where u.clave = 'ev:avisos_activados' and u.dia > v_hoy - 30),
      'rechazaron_30d', (select count(distinct u.user_id) from uso_diario u join _x_reales r on r.id = u.user_id where u.clave = 'ev:avisos_rechazados' and u.dia > v_hoy - 30)),

    'negocio', jsonb_build_object(
      'plus_vieron_30d', (select count(distinct u.user_id) from uso_diario u join _x_reales r on r.id = u.user_id where u.clave = 'ev:plus_visto' and u.dia > v_hoy - 30),
      'plus_iniciaron_30d', (select count(distinct u.user_id) from uso_diario u join _x_reales r on r.id = u.user_id where u.clave = 'ev:plus_iniciar' and u.dia > v_hoy - 30),
      'plus_activas', (select count(*) from subscriptions where status = 'authorized'),
      'mrr_ars', (select coalesce(sum(case when coalesce((raw #>> '{auto_recurring,frequency}')::int, 1) >= 12 then amount / 12 else amount end), 0)
                    from subscriptions where status = 'authorized')
                 + (select coalesce(sum(monto), 0) from business_subscriptions where status in ('activa', 'en_gracia'))),

    'comunidad', jsonb_build_object(
      'proyectos_activos', (select count(*) from projects where status in ('active', 'proposed') and pausado_at is null),
      'proyectos_creados_30d', (select count(*) from projects where created_at > now() - interval '30 days'),
      'sumados_30d', (select count(*) from project_participants where joined_at > now() - interval '30 days'),
      'publicaciones_30d', (select count(*) from feed_posts where kind in ('post', 'reply', 'repost') and created_at > now() - interval '30 days'),
      'seguimientos_30d', (select count(*) from follows where created_at > now() - interval '30 days')),

    -- Quienes venían y dejaron de venir: a tiempo de recuperarlos.
    'en_riesgo', (select jsonb_build_object(
        'n', count(*),
        'rachas_perdidas', count(*) filter (where p.longest_streak >= 7),
        'lista', coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'nombre', coalesce(p.display_name, p.username::text), 'usuario', p.username::text,
                                                       'ultimo', x.ultimo, 'dias', x.dias, 'racha', p.longest_streak) order by x.dias desc)
                          filter (where x.fila <= 12), '[]'::jsonb))
      from (select a.user_id, max(a.dia) as ultimo, count(*) as dias,
                   row_number() over (order by count(*) desc) as fila
              from _x_act a where a.dia > v_hoy - 37
             group by a.user_id
            having max(a.dia) <= v_hoy - 7 and count(*) >= 3) x
      join profiles p on p.id = x.user_id),

    -- Los que más empujan.
    'mas_activos', (select coalesce(jsonb_agg(x order by x.dias desc, x.acciones desc), '[]'::jsonb) from (
        select p.id, coalesce(p.display_name, p.username::text) as nombre, p.username::text as usuario,
               count(distinct a.dia) as dias,
               (select count(*) from activity_completions c where c.user_id = p.id and c.local_date > v_hoy - 30 and c.status in ('honor','verified')) as acciones,
               p.current_streak as racha
          from _x_act a join profiles p on p.id = a.user_id
         where a.dia > v_hoy - 30
         group by p.id order by 4 desc limit 10) x)
  ) into v_out;
  return v_out;
end $$;
revoke all on function public.admin_analitica_extra(text, int) from public, anon;
grant execute on function public.admin_analitica_extra(text, int) to authenticated;

-- ── Salud del sistema ───────────────────────────────────────────────────────

create or replace function public.admin_salud(p_pass text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_cron jsonb := '[]'::jsonb; v_http jsonb := '{}'::jsonb; v_tablas jsonb := '[]'::jsonb; v_bytes bigint := 0;
begin
  if not admin_check(p_pass) then return jsonb_build_object('ok', false, 'error', 'Sin acceso'); end if;

  begin
    v_bytes := pg_database_size(current_database());
    select coalesce(jsonb_agg(jsonb_build_object('tabla', relname, 'bytes', bytes, 'filas', filas) order by bytes desc), '[]'::jsonb) into v_tablas
      from (select c.relname, pg_total_relation_size(c.oid) as bytes, c.reltuples::bigint as filas
              from pg_class c join pg_namespace n on n.oid = c.relnamespace
             where n.nspname = 'public' and c.relkind = 'r'
             order by 2 desc limit 8) t;
  exception when others then null;
  end;

  begin
    execute $q$
      select coalesce(jsonb_agg(jsonb_build_object(
               'nombre', j.jobname, 'horario', j.schedule, 'activo', j.active,
               'ultimo_at', d.ultimo_at, 'ultimo_estado', d.ultimo_estado, 'ultimo_error', left(d.ultimo_error, 160),
               'fallos_24h', coalesce(d.fallos, 0)) order by coalesce(d.fallos, 0) desc, j.jobname), '[]'::jsonb)
        from cron.job j
        left join lateral (
          select max(r.start_time) as ultimo_at,
                 (array_agg(r.status order by r.start_time desc))[1] as ultimo_estado,
                 (array_agg(r.return_message order by r.start_time desc) filter (where r.status <> 'succeeded'))[1] as ultimo_error,
                 count(*) filter (where r.status <> 'succeeded' and r.start_time > now() - interval '24 hours') as fallos
            from cron.job_run_details r
           where r.jobid = j.jobid and r.start_time > now() - interval '8 days') d on true
    $q$ into v_cron;
  exception when others then v_cron := '[]'::jsonb;
  end;

  begin
    execute $q$
      select jsonb_build_object('total', count(*), 'fallidas', count(*) filter (where status_code is null or status_code >= 400))
        from net._http_response where created > now() - interval '24 hours'
    $q$ into v_http;
  exception when others then v_http := '{}'::jsonb;
  end;

  return jsonb_build_object(
    'ok', true,
    'base', jsonb_build_object('bytes', v_bytes, 'tope_bytes', 500 * 1024 * 1024, 'tablas', v_tablas),
    'crons', v_cron,
    'llamadas_24h', v_http,
    'avisos', jsonb_build_object(
      'claves', exists (select 1 from push_config),
      'dispositivos', (select count(*) from push_subscriptions),
      'pendientes', (select count(*) from notifications where push_estado in ('pendiente', 'enviando')),
      'vencidas', (select count(*) from notifications where push_estado = 'pendiente' and push_programada_at <= now() - interval '5 minutes'),
      'enviadas_24h', (select count(*) from notifications where push_estado = 'enviada' and push_enviada_at > now() - interval '24 hours'),
      'fallidas_24h', (select count(*) from notifications where push_estado = 'fallida' and created_at > now() - interval '24 hours')),
    'noticias', jsonb_build_object(
      'ultima_at', (select max(fetched_at) from news),
      'activas', (select count(*) from news where active)),
    'tipo_cambio', (select brote_tipo_cambio_actual()),
    'errores', jsonb_build_object(
      'hoy', (select coalesce(sum(n), 0) from app_errores where dia = (now() at time zone 'America/Argentina/Buenos_Aires')::date),
      'semana', (select coalesce(sum(n), 0) from app_errores where dia > (now() at time zone 'America/Argentina/Buenos_Aires')::date - 7),
      'lista', coalesce((select jsonb_agg(x order by x.ultimo_at desc) from (
          select mensaje, ruta, sum(n) as veces, max(ultimo_at) as ultimo_at
            from app_errores where dia > (now() at time zone 'America/Argentina/Buenos_Aires')::date - 7
           group by mensaje, ruta order by max(ultimo_at) desc limit 25) x), '[]'::jsonb)),
    'mundo_errores_24h', (select count(*) from world_client_errors where created_at > now() - interval '24 hours'),
    'accesos', jsonb_build_object(
      'ultimo_tuyo', (select max(ultimo_acceso_at) from brote_admins),
      'intentos_30d', (select count(*) from panel_intentos where at > now() - interval '30 days'),
      'intentos', coalesce((select jsonb_agg(x order by x.at desc) from (
          select i.at, coalesce(p.display_name, p.username::text, 'Alguien') as quien
            from panel_intentos i left join profiles p on p.id = i.user_id
           order by i.at desc limit 10) x), '[]'::jsonb)));
end $$;
revoke all on function public.admin_salud(text) from public, anon;
grant execute on function public.admin_salud(text) to authenticated;

-- ── La ficha de una persona ─────────────────────────────────────────────────

create or replace function public.admin_persona(p_pass text, p_user uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_hoy date := (now() at time zone 'America/Argentina/Buenos_Aires')::date; p profiles%rowtype;
begin
  if not admin_check(p_pass) then return jsonb_build_object('ok', false, 'error', 'Sin acceso'); end if;
  select * into p from profiles where id = p_user;
  if not found then return jsonb_build_object('ok', false, 'error', 'No existe'); end if;
  return jsonb_build_object(
    'ok', true,
    'persona', jsonb_build_object(
      'id', p.id, 'usuario', p.username::text, 'nombre', p.display_name, 'email', (select email from auth.users where id = p.id),
      'tipo', p.account_type, 'ciudad', p.city, 'barrio', p.neighborhood, 'alta_at', p.created_at,
      'onboarding', p.onboarding_completed, 'plan', p.plan, 'plan_hasta', p.plan_expires_at, 'es_plus', brote_is_pro(p.id),
      'es_prueba', p.es_prueba, 'suspendida_hasta', p.suspended_until,
      'puntos', p.total_xp, 'semillas', p.semillas, 'nivel', p.current_rank_slug,
      'racha', p.current_streak, 'racha_max', p.longest_streak, 'es_admin', brote_es_admin(p.id)),
    'rango', (select jsonb_build_object('tier', r.tier, 'nombre', r.nombre, 'color', r.color)
                from rangos r where r.tier = coalesce((select tier from rango_usuario where user_id = p.id), 1)),
    'uso', (select jsonb_build_object('primera_vez', u.primera_vez, 'ultima_vez', u.ultima_vez, 'plataforma', u.plataforma,
                                      'sistema', u.sistema, 'navegador', u.navegador, 'instalada', u.instalada)
              from uso_usuario u where u.user_id = p.id),
    'totales', jsonb_build_object(
      'acciones', (select count(*) from activity_completions where user_id = p.id and status in ('honor','verified')),
      'acciones_30d', (select count(*) from activity_completions where user_id = p.id and local_date > v_hoy - 30 and status in ('honor','verified')),
      'dias_activos_30d', (select count(*) from uso_diario where user_id = p.id and clave = 'activo' and dia > v_hoy - 30),
      'lecciones', (select count(*) from ac_user_leccion where user_id = p.id and completada_at is not null),
      'publicaciones', (select count(*) from feed_posts where author_id = p.id),
      'proyectos', (select count(*) from project_participants where user_id = p.id),
      'dispositivos', (select count(*) from push_subscriptions where user_id = p.id),
      'reportes_recibidos', (select count(*) from content_reports cr where cr.profile_id = p.id or cr.post_id in (select f.id from feed_posts f where f.author_id = p.id))),
    'secciones_30d', (select coalesce(jsonb_object_agg(substr(clave, 5), dias), '{}'::jsonb) from (
        select clave, count(*) dias from uso_diario where user_id = p.id and clave like 'sec:%' and dia > v_hoy - 30 group by clave) s),
    'actividad_30d', (select coalesce(jsonb_agg(jsonb_build_object('dia', g::date, 'activo', exists (select 1 from uso_diario u where u.user_id = p.id and u.clave = 'activo' and u.dia = g::date),
                                                                   'acciones', (select count(*) from activity_completions c where c.user_id = p.id and c.local_date = g::date and c.status in ('honor','verified'))) order by g), '[]'::jsonb)
                        from generate_series(v_hoy - 29, v_hoy, interval '1 day') g),
    'ultimas_acciones', (select coalesce(jsonb_agg(x order by x.at desc), '[]'::jsonb) from (
        select a.title_es as titulo, c.domain_slug as tema, c.completed_at as at, c.points_awarded as puntos
          from activity_completions c join activities a on a.id = c.activity_id
         where c.user_id = p.id order by c.completed_at desc limit 8) x),
    'negocios', (select coalesce(jsonb_agg(jsonb_build_object('id', b.id, 'nombre', b.nombre_comercial, 'estado', b.status, 'rol', m.role)), '[]'::jsonb)
                   from business_members m join businesses b on b.id = m.business_id where m.user_id = p.id));
end $$;
revoke all on function public.admin_persona(text, uuid) from public, anon;
grant execute on function public.admin_persona(text, uuid) to authenticated;

create or replace function public.admin_persona_accion(p_pass text, p_user uuid, p_accion text, p_dias int default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_dias int := least(greatest(coalesce(p_dias, 0), 1), 3650);
begin
  if not admin_check(p_pass) then return jsonb_build_object('ok', false, 'error', 'Sin acceso'); end if;
  if brote_es_admin(p_user) and p_accion = 'suspender' then
    return jsonb_build_object('ok', false, 'error', 'Es tu propia cuenta: si la suspendés, no entrás más al panel.');
  end if;
  if p_accion = 'suspender' then
    update profiles set suspended_until = now() + make_interval(days => v_dias) where id = p_user;
  elsif p_accion = 'levantar' then
    update profiles set suspended_until = null where id = p_user;
  elsif p_accion = 'dar_plus' then
    update profiles set plan = 'plus'::plan_tier,
                        plan_expires_at = greatest(coalesce(plan_expires_at, now()), now()) + make_interval(days => v_dias)
     where id = p_user;
    insert into notifications (user_id, type, title_es, body_es, data)
    values (p_user, 'system', 'Te regalamos Brote+ 🌟', 'Por ' || v_dias || ' días, sin publicidad y con todo lo de Brote+.', jsonb_build_object('url', '/brote-plus'));
  elsif p_accion = 'quitar_plus' then
    update profiles set plan = 'free'::plan_tier, plan_expires_at = null where id = p_user;
  else
    return jsonb_build_object('ok', false, 'error', 'Acción desconocida');
  end if;
  return jsonb_build_object('ok', found);
end $$;
revoke all on function public.admin_persona_accion(text, uuid, text, int) from public, anon;
grant execute on function public.admin_persona_accion(text, uuid, text, int) to authenticated;

-- La bandeja suma los errores de hoy (no bloquea a nadie, pero hay que mirarlos).
create or replace function public.admin_pendientes(p_pass text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not admin_check(p_pass) then
    return jsonb_build_object('ok', false, 'error', 'Sin acceso');
  end if;
  return jsonb_build_object(
    'ok', true,
    'reportes_plaza', (select count(*) from content_reports where status = 'open'),
    'negocios',       (select count(*) from businesses where status in ('submitted','in_review') and revision_note is null),
    'desafios',       (select count(*) from empresa_desafio_inscripciones where estado = 'enviada'),
    'listados',       (select count(*) from listings where status = 'pendiente'),
    'auditoria',      (select count(*) from listings where acelerada and auditado_at is null and status = 'publicado'),
    'reportes_mercado', (select count(*) from listing_reports where estado = 'abierto'),
    'objetivos',      (select count(*) from improvement_goals where status = 'en_revision'),
    'compromisos',    (select count(*) from tienda_compromisos c join businesses b on b.id = c.business_id
                        where c.estado = 'declarado' and c.foto_path is not null and b.status = 'approved'),
    'academia',       (select count(*) from ac_revision_cola where estado = 'pendiente'),
    'pagos_fallidos', (select count(*) from business_subscriptions where status = 'en_gracia')
                    + (select count(*) from subscriptions where status = 'paused')
                    + (select count(*) from pagos_eventos where procesado_at is null and recibido_at < now() - interval '10 minutes'),
    'errores_mundo_24h', (select count(*) from world_client_errors where created_at > now() - interval '24 hours'),
    'errores_app_24h', (select coalesce(sum(n), 0) from app_errores where ultimo_at > now() - interval '24 hours'));
end $$;

-- Nadie sin sesión llama a estas (ya exigían auth.uid(), pero no hace falta ofrecerlas).
do $$
declare f record;
begin
  for f in select p.oid::regprocedure as firma from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public' and p.proname in ('buy_cosmetic', 'equip_cosmetic') loop
    execute format('revoke execute on function %s from anon', f.firma);
  end loop;
end $$;
