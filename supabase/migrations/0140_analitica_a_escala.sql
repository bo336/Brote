-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0140 — La analítica del panel sigue andando con miles de personas.
--
-- Probado con 8.000 personas y 160.000 acciones: las pantallas de la gente
-- responden en decenas de milisegundos, pero `admin_analitica` y
-- `admin_analitica_extra` tardaban minutos. Las dos arman tablas temporales y las
-- consultan sin que el planificador sepa cuántas filas tienen (autovacuum no
-- analiza tablas temporales), y el cruce de cada acción con cada persona salía
-- por nested loop: 1.290 millones de comparaciones para 8.000 personas. Y
-- `statement_timeout` corta a los 8 segundos para `authenticated`: el panel se
-- hubiera roto justo cuando más gente hubiera. Ese cruce ahora va por hash, y
-- las temporales tienen estadísticas para todo lo que viene después.
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.admin_analitica(p_pass text, p_dias int default 30)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hoy   date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
  v_dias  int := least(greatest(coalesce(p_dias, 30), 7), 120);
  v_desde date;
  v_out   jsonb;
begin
  if not admin_check(p_pass) then
    return jsonb_build_object('ok', false, 'error', 'Sin acceso');
  end if;
  -- Ocho semanas de cohortes necesitan al menos 63 días de actividad.
  v_desde := v_hoy - greatest(v_dias, 63);

  -- Quién cuenta: personas reales (sin cuentas de prueba).
  drop table if exists _reales;
  drop table if exists _act;
  create temp table _reales on commit drop as
    select p.id, p.created_at, (p.created_at at time zone 'America/Argentina/Buenos_Aires')::date as alta,
           p.account_type, p.city, p.onboarding_completed, p.current_streak, p.longest_streak,
           p.current_rank_slug, p.plan, p.plan_expires_at
      from profiles p
     where not coalesce(p.es_prueba, false);
  create index on _reales (id);
  -- Sin esto el planificador no sabe cuántas filas hay (autovacuum no mira las
  -- temporales) y cruza cada acción contra toda la tabla: minutos con miles de personas.
  analyze _reales;

  -- Un día activo = abrió la app (uso_diario) o marcó una acción. La segunda
  -- fuente cubre todo lo anterior a esta migración.
  perform set_config('enable_nestloop', 'off', true);
  create temp table _act on commit drop as
    select distinct x.user_id, x.dia
      from (
        select u.user_id, u.dia from uso_diario u where u.clave = 'activo' and u.dia >= v_desde
        union all
        select c.user_id, c.local_date from activity_completions c
         where c.local_date >= v_desde and c.status in ('honor', 'verified', 'pending')
      ) x
      join _reales r on r.id = x.user_id;
  perform set_config('enable_nestloop', 'on', true);
  create index on _act (dia);
  create index on _act (user_id, dia);
  analyze _act;

  select jsonb_build_object(
    'ok', true,
    'hoy', v_hoy,
    'dias', v_dias,
    'resumen', jsonb_build_object(
      'usuarios',        (select count(*) from _reales),
      'nuevos_hoy',      (select count(*) from _reales where alta = v_hoy),
      'nuevos_7d',       (select count(*) from _reales where alta > v_hoy - 7),
      'nuevos_30d',      (select count(*) from _reales where alta > v_hoy - 30),
      'onboarding',      (select count(*) from _reales where onboarding_completed),
      'activos_hoy',     (select count(distinct user_id) from _act where dia = v_hoy),
      'activos_7d',      (select count(distinct user_id) from _act where dia > v_hoy - 7),
      'activos_30d',     (select count(distinct user_id) from _act where dia > v_hoy - 30),
      'con_avisos',      (select count(distinct s.user_id) from push_subscriptions s join _reales r on r.id = s.user_id),
      'app_instalada',   (select count(*) from uso_usuario u join _reales r on r.id = u.user_id where u.instalada),
      'brote_plus',      (select count(*) from _reales where plan = 'plus' and (plan_expires_at is null or plan_expires_at > now())),
      'acciones_hoy',    (select count(*) from activity_completions c join _reales r on r.id = c.user_id
                           where c.local_date = v_hoy and c.status in ('honor','verified')),
      'acciones_7d',     (select count(*) from activity_completions c join _reales r on r.id = c.user_id
                           where c.local_date > v_hoy - 7 and c.status in ('honor','verified')),
      'empresas_mejora', (select count(*) from businesses where status = 'approved' and objetivo in ('mejorar','ambos') and slug not like 'demo-%'),
      'tiendas',         (select count(*) from businesses where status = 'approved' and objetivo in ('vender','ambos') and slug not like 'demo-%'),
      'empresas_en_alta',(select count(*) from businesses where status in ('draft','submitted','in_review') and slug not like 'demo-%')
    ),
    'serie', (
      select coalesce(jsonb_agg(jsonb_build_object('dia', d.dia, 'altas', coalesce(a.n, 0), 'activos', coalesce(ac.n, 0),
                                                   'acciones', coalesce(c.n, 0)) order by d.dia), '[]'::jsonb)
        from (select generate_series(v_hoy - v_dias + 1, v_hoy, interval '1 day')::date as dia) d
        left join (select alta as dia, count(*) n from _reales group by 1) a on a.dia = d.dia
        left join (select dia, count(distinct user_id) n from _act group by 1) ac on ac.dia = d.dia
        left join (select c.local_date as dia, count(*) n from activity_completions c join _reales r on r.id = c.user_id
                    where c.local_date > v_hoy - v_dias and c.status in ('honor','verified') group by 1) c on c.dia = d.dia
    ),
    -- Cohortes por semana de alta (lunes): qué parte volvió en cada una de las
    -- siete semanas siguientes. Una semana que todavía no empezó va en null.
    'cohortes', (
      with coh as (
        select r.id, date_trunc('week', r.alta)::date as semana
          from _reales r
         where r.alta >= date_trunc('week', v_hoy)::date - 49
      ), tam as (
        select semana, count(*) as n from coh group by semana
      ), ret as (
        select c.semana, w.w, count(distinct a.user_id) as vuelven
          from coh c
         cross join generate_series(1, 7) as w(w)
          left join _act a on a.user_id = c.id and a.dia between c.semana + w.w * 7 and c.semana + w.w * 7 + 6
         group by c.semana, w.w
      )
      select coalesce(jsonb_agg(jsonb_build_object(
               'semana', t.semana, 'tamano', t.n,
               'retencion', (select jsonb_agg(case when t.semana + r.w * 7 > v_hoy then null
                                                   else round(100.0 * r.vuelven / t.n) end order by r.w)
                               from ret r where r.semana = t.semana))
             order by t.semana desc), '[]'::jsonb)
        from tam t
    ),
    -- Embudo de quienes se registraron en el período.
    'embudo', (
      select jsonb_build_object(
        'registrados', count(*),
        'onboarding', count(*) filter (where r.onboarding_completed),
        'primera_accion', count(*) filter (where exists (select 1 from activity_completions c where c.user_id = r.id)),
        'volvio', count(*) filter (where (select count(*) from _act a where a.user_id = r.id and a.dia > r.alta) >= 1),
        'siete_dias', count(*) filter (where (select count(*) from _act a where a.user_id = r.id) >= 7),
        'racha_7', count(*) filter (where r.longest_streak >= 7))
        from _reales r where r.alta > v_hoy - v_dias
    ),
    'secciones', (
      select coalesce(jsonb_agg(jsonb_build_object('clave', s.clave, 'usuarios_7d', s.u7, 'usuarios_30d', s.u30, 'vistas_7d', s.v7)
                                order by s.u7 desc, s.u30 desc), '[]'::jsonb)
        from (select u.clave,
                     count(distinct u.user_id) filter (where u.dia > v_hoy - 7) u7,
                     count(distinct u.user_id) filter (where u.dia > v_hoy - 30) u30,
                     coalesce(sum(u.n) filter (where u.dia > v_hoy - 7), 0) v7
                from uso_diario u join _reales r on r.id = u.user_id
               where u.clave like 'sec:%' and u.dia > v_hoy - 30
               group by u.clave) s
    ),
    'eventos', (
      select coalesce(jsonb_agg(jsonb_build_object('clave', s.clave, 'usuarios_7d', s.u7, 'usuarios_30d', s.u30, 'veces_30d', s.v30)
                                order by s.u30 desc), '[]'::jsonb)
        from (select u.clave,
                     count(distinct u.user_id) filter (where u.dia > v_hoy - 7) u7,
                     count(distinct u.user_id) u30,
                     sum(u.n) v30
                from uso_diario u join _reales r on r.id = u.user_id
               where u.clave like 'ev:%' and u.dia > v_hoy - 30
               group by u.clave) s
    ),
    'segmentos', jsonb_build_object(
      'tipo', (select coalesce(jsonb_object_agg(coalesce(account_type::text, 'sin_dato'), n), '{}'::jsonb)
                 from (select account_type, count(*) n from _reales group by 1) x),
      'ciudad', (select coalesce(jsonb_agg(jsonb_build_object('ciudad', ciudad, 'usuarios', n) order by n desc), '[]'::jsonb)
                   from (select coalesce(nullif(btrim(city), ''), 'Sin dato') ciudad, count(*) n from _reales group by 1 order by 2 desc limit 12) x),
      'plataforma', (select coalesce(jsonb_object_agg(coalesce(plataforma, 'sin_dato'), n), '{}'::jsonb)
                       from (select u.plataforma, count(*) n from uso_usuario u join _reales r on r.id = u.user_id group by 1) x),
      'sistema', (select coalesce(jsonb_object_agg(coalesce(sistema, 'sin_dato'), n), '{}'::jsonb)
                    from (select u.sistema, count(*) n from uso_usuario u join _reales r on r.id = u.user_id group by 1) x),
      'navegador', (select coalesce(jsonb_object_agg(coalesce(navegador, 'sin_dato'), n), '{}'::jsonb)
                      from (select u.navegador, count(*) n from uso_usuario u join _reales r on r.id = u.user_id group by 1) x)
    ),
    'contenido', jsonb_build_object(
      'acciones_top', (select coalesce(jsonb_agg(jsonb_build_object('titulo', a.title_es, 'dominio', a.domain_slug, 'veces', x.n, 'personas', x.p) order by x.n desc), '[]'::jsonb)
                         from (select c.activity_id, count(*) n, count(distinct c.user_id) p
                                 from activity_completions c join _reales r on r.id = c.user_id
                                where c.local_date > v_hoy - 7 and c.status in ('honor','verified')
                                group by 1 order by 2 desc limit 10) x
                         join activities a on a.id = x.activity_id),
      'dominios', (select coalesce(jsonb_object_agg(domain_slug, n), '{}'::jsonb)
                     from (select c.domain_slug, count(*) n from activity_completions c join _reales r on r.id = c.user_id
                            where c.local_date > v_hoy - 7 and c.status in ('honor','verified') group by 1) x),
      'academia_sesiones_7d', (select count(*) from ac_sesiones s join _reales r on r.id = s.user_id where s.finished_at > now() - interval '7 days'),
      'academia_personas_7d', (select count(distinct s.user_id) from ac_sesiones s join _reales r on r.id = s.user_id where s.finished_at > now() - interval '7 days'),
      'plaza_publicaciones_7d', (select count(*) from feed_posts f join _reales r on r.id = f.author_id where f.kind in ('post','reply','repost') and f.created_at > now() - interval '7 days'),
      'plaza_autores_7d', (select count(distinct f.author_id) from feed_posts f join _reales r on r.id = f.author_id where f.kind in ('post','reply','repost') and f.created_at > now() - interval '7 days'),
      'plaza_reacciones_7d', (select count(*) from feed_reactions x join _reales r on r.id = x.user_id where x.created_at > now() - interval '7 days'),
      'mercado_clics_7d', (select count(*) from listing_clicks where created_at > now() - interval '7 days'),
      'mercado_impresiones_7d', (select coalesce(sum(impresiones), 0) from listing_impresiones_dia where dia > v_hoy - 7),
      'mundo_jugadores_7d', (select count(distinct u.user_id) from uso_diario u join _reales r on r.id = u.user_id where u.clave = 'sec:mundo' and u.dia > v_hoy - 7),
      'proyectos_sumados_7d', (select count(*) from project_participants pp join _reales r on r.id = pp.user_id where pp.joined_at > now() - interval '7 days')
    ),
    'rachas', (select jsonb_build_object(
                 'cero', count(*) filter (where coalesce(current_streak, 0) = 0),
                 'de_1_a_2', count(*) filter (where current_streak between 1 and 2),
                 'de_3_a_6', count(*) filter (where current_streak between 3 and 6),
                 'de_7_a_29', count(*) filter (where current_streak between 7 and 29),
                 'de_30_mas', count(*) filter (where current_streak >= 30))
                 from _reales),
    'niveles', (select coalesce(jsonb_object_agg(coalesce(current_rank_slug, 'semilla'), n), '{}'::jsonb)
                  from (select current_rank_slug, count(*) n from _reales group by 1) x),
    'avisos_7d', (select coalesce(jsonb_object_agg(type::text, n), '{}'::jsonb)
                    from (select n.type, count(*) n from notifications n join _reales r on r.id = n.user_id
                           where n.created_at > now() - interval '7 days' group by 1) x),
    'recientes', (select coalesce(jsonb_agg(x order by x.alta_at desc), '[]'::jsonb) from (
                    select r.id, p.username, p.display_name, r.created_at as alta_at, r.account_type, r.city,
                           r.onboarding_completed as onboarding,
                           (select count(*) from activity_completions c where c.user_id = r.id) as acciones,
                           (select max(dia) from _act a where a.user_id = r.id) as ultimo_dia
                      from _reales r join profiles p on p.id = r.id
                     order by r.created_at desc limit 15) x)
  ) into v_out;

  return v_out;
end $$;

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
  analyze _x_reales;
  perform set_config('enable_nestloop', 'off', true);
  create temp table _x_act on commit drop as
    select distinct x.user_id, x.dia
      from (
        select u.user_id, u.dia from uso_diario u where u.clave = 'activo' and u.dia >= v_hoy - 130
        union all
        select c.user_id, c.local_date from activity_completions c
         where c.local_date >= v_hoy - 130 and c.status in ('honor', 'verified', 'pending')
      ) x join _x_reales r on r.id = x.user_id;
  perform set_config('enable_nestloop', 'on', true);
  create index on _x_act (dia);
  create index on _x_act (user_id, dia);
  analyze _x_act;

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
