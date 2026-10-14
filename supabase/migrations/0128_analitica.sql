-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0128 — Analítica del panel (docs/LANZAMIENTO.md D9, F2).
--
-- Qué se guarda y por qué así:
--
--   · `uso_diario (dia, user_id, clave, n)`: una fila por persona, día y cosa
--     usada. "sec:mundo" = abrió Tu mundo ese día (n = cuántas vistas);
--     "ev:push_activado" = hizo eso. Nada de eventos crudos con hora y página:
--     el plan gratis de Supabase tiene 500 MB, y con mil personas activas los
--     eventos crudos llenarían la base en tres meses. Esto ocupa ~5 filas por
--     persona y día, alcanza para DAU/WAU/MAU, retención, embudos y "quién usa
--     qué", y se borra solo a los 400 días.
--   · `uso_usuario`: lo último de cada persona (cuándo entró, desde qué
--     dispositivo, si instaló la app). Una fila por persona.
--   · Las cuentas de chicos sólo registran secciones, nunca eventos.
--   · `registrar_uso()` es la única puerta: valida cada clave, topea cuántas
--     claves por llamada (40), cuánto suma cada una (50) y cuántas llamadas
--     por hora (240). Una cuenta no puede inflar la analítica de nadie más,
--     porque escribe siempre con su propio `auth.uid()`.
--
-- Lo que el panel muestra sale de `admin_analitica()` y
-- `admin_analitica_usuarios()`, ambas detrás de `admin_check` (0127).
-- `admin_pendientes()` arma la bandeja de arriba del panel.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.uso_diario (
  dia     date not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  clave   text not null,
  n       int  not null default 1,
  primary key (dia, user_id, clave)
);
create index if not exists uso_diario_usuario_dia on public.uso_diario (user_id, dia);
create index if not exists uso_diario_clave_dia on public.uso_diario (clave, dia);
alter table public.uso_diario enable row level security;
revoke all on public.uso_diario from public, anon, authenticated;

create table if not exists public.uso_usuario (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  primera_vez timestamptz not null default now(),
  ultima_vez  timestamptz not null default now(),
  plataforma  text check (plataforma in ('telefono', 'tablet', 'compu')),
  navegador   text check (navegador in ('chrome', 'safari', 'firefox', 'edge', 'samsung', 'otro')),
  sistema     text check (sistema in ('android', 'ios', 'windows', 'mac', 'linux', 'otro')),
  instalada   boolean not null default false
);
create index if not exists uso_usuario_ultima on public.uso_usuario (ultima_vez desc);
alter table public.uso_usuario enable row level security;
revoke all on public.uso_usuario from public, anon, authenticated;

-- ── La puerta de entrada ────────────────────────────────────────────────────

create or replace function public.registrar_uso(p_claves jsonb, p_meta jsonb default '{}'::jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_hoy date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
  v_kid boolean;
  v_n int;
  e record;
  v_plat text := p_meta ->> 'plataforma';
  v_nav  text := p_meta ->> 'navegador';
  v_sis  text := p_meta ->> 'sistema';
begin
  if v_uid is null or p_claves is null or jsonb_typeof(p_claves) <> 'object' then return; end if;
  if not brote_rate_limit('uso:' || v_uid, 240, interval '1 hour') then return; end if;

  select account_type = 'kid' into v_kid from profiles where id = v_uid;

  for e in select key, value from jsonb_each(p_claves) limit 40 loop
    continue when e.key !~ '^(sec|ev):[a-z0-9_]{1,40}$';
    continue when coalesce(v_kid, false) and e.key like 'ev:%';
    v_n := case when jsonb_typeof(e.value) = 'number' then least(greatest((e.value)::text::numeric::int, 1), 50) else 1 end;
    insert into uso_diario (dia, user_id, clave, n) values (v_hoy, v_uid, e.key, v_n)
    on conflict (dia, user_id, clave) do update set n = least(uso_diario.n + excluded.n, 100000);
  end loop;

  -- El marcador del día: con él, "activos hoy" es un conteo por índice.
  insert into uso_diario (dia, user_id, clave, n) values (v_hoy, v_uid, 'activo', 1)
  on conflict (dia, user_id, clave) do update set n = least(uso_diario.n + 1, 100000);

  insert into uso_usuario (user_id, plataforma, navegador, sistema, instalada)
  values (v_uid,
          case when v_plat in ('telefono', 'tablet', 'compu') then v_plat end,
          case when v_nav in ('chrome', 'safari', 'firefox', 'edge', 'samsung', 'otro') then v_nav end,
          case when v_sis in ('android', 'ios', 'windows', 'mac', 'linux', 'otro') then v_sis end,
          coalesce((p_meta ->> 'instalada')::boolean, false))
  on conflict (user_id) do update set
    ultima_vez = now(),
    plataforma = coalesce(excluded.plataforma, uso_usuario.plataforma),
    navegador  = coalesce(excluded.navegador, uso_usuario.navegador),
    sistema    = coalesce(excluded.sistema, uso_usuario.sistema),
    -- Una vez instalada queda marcada: se abre a veces desde el navegador igual.
    instalada  = uso_usuario.instalada or excluded.instalada;
exception when others then
  -- La analítica nunca puede romper una pantalla.
  return;
end $$;

revoke all on function public.registrar_uso(jsonb, jsonb) from public, anon;
grant execute on function public.registrar_uso(jsonb, jsonb) to authenticated;

-- ── Limpieza ────────────────────────────────────────────────────────────────

create or replace function public.brote_analitica_limpieza()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_uso int; v_rl int;
begin
  delete from uso_diario where dia < (now() at time zone 'America/Argentina/Buenos_Aires')::date - 400;
  get diagnostics v_uso = row_count;
  -- `rate_limits` (0109) nunca se limpiaba: cada ventana de cada persona quedaba para siempre.
  delete from rate_limits where ventana < now() - interval '3 days';
  get diagnostics v_rl = row_count;
  return jsonb_build_object('uso_diario', v_uso, 'rate_limits', v_rl);
end $$;
revoke all on function public.brote_analitica_limpieza() from public, anon, authenticated;

select cron.unschedule('brote-analitica-limpieza') where exists (select 1 from cron.job where jobname = 'brote-analitica-limpieza');
select cron.schedule('brote-analitica-limpieza', '45 4 * * *', $$select public.brote_analitica_limpieza()$$);

-- ── El tablero ──────────────────────────────────────────────────────────────

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
    return jsonb_build_object('ok', false, 'error', 'Contraseña incorrecta');
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

  -- Un día activo = abrió la app (uso_diario) o marcó una acción. La segunda
  -- fuente cubre todo lo anterior a esta migración.
  create temp table _act on commit drop as
    select distinct x.user_id, x.dia
      from (
        select u.user_id, u.dia from uso_diario u where u.clave = 'activo' and u.dia >= v_desde
        union all
        select c.user_id, c.local_date from activity_completions c
         where c.local_date >= v_desde and c.status in ('honor', 'verified', 'pending')
      ) x
      join _reales r on r.id = x.user_id;
  create index on _act (dia);
  create index on _act (user_id, dia);

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

revoke all on function public.admin_analitica(text, int) from public, anon;
grant execute on function public.admin_analitica(text, int) to authenticated;

-- ── Personas, una por una ───────────────────────────────────────────────────

create or replace function public.admin_analitica_usuarios(
  p_pass text, p_q text default null, p_orden text default 'recientes', p_limite int default 50)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hoy date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
  v_q text := nullif(btrim(coalesce(p_q, '')), '');
  v_lim int := least(greatest(coalesce(p_limite, 50), 1), 500);
begin
  if not admin_check(p_pass) then
    return jsonb_build_object('ok', false, 'error', 'Contraseña incorrecta');
  end if;
  return jsonb_build_object('ok', true, 'usuarios', coalesce((
    -- Primero se eligen los candidatos con una consulta barata y por índice;
    -- recién sobre esos (como mucho 500) se arma la ficha completa. Con decenas
    -- de miles de cuentas, armar la ficha de todas para después ordenar no
    -- terminaría nunca.
    with cand as (
      select p.id, row_number() over () as ord
        from (
          select p.id
            from profiles p
            join auth.users u on u.id = p.id
           where v_q is not null
             and (p.username::text ilike '%' || v_q || '%' or p.display_name ilike '%' || v_q || '%'
                  or u.email ilike '%' || v_q || '%' or p.city ilike '%' || v_q || '%')
           order by p.created_at desc
           limit v_lim
        ) p
      union all
      select x.user_id, row_number() over (order by x.dias desc, x.user_id) from (
        select d.user_id, count(distinct d.dia) dias from (
          select ud.user_id, ud.dia from uso_diario ud
           where ud.clave = 'activo' and ud.dia > v_hoy - 30
          union all
          select ac.user_id, ac.local_date from activity_completions ac
           where ac.local_date > v_hoy - 30 and ac.status in ('honor','verified')
        ) d
         where v_q is null and p_orden = 'activos'
         group by d.user_id order by 2 desc limit v_lim) x
      union all
      -- Lo más inactivo es lo que nunca volvió a abrir: sin fila en uso_usuario
      -- cuenta desde el alta.
      select pr.id, row_number() over (order by pr.visto asc) from (
        select p2.id, coalesce(uu.ultima_vez, p2.created_at) as visto
          from profiles p2 left join uso_usuario uu on uu.user_id = p2.id
         where v_q is null and p_orden = 'inactivos'
         order by 2 asc limit v_lim) pr
      union all
      select p.id, row_number() over (order by p.created_at desc) from (
        select id, created_at from profiles
         where v_q is null and coalesce(p_orden, 'recientes') not in ('activos', 'inactivos')
         order by created_at desc limit v_lim) p
    )
    select jsonb_agg(f order by case when p_orden = 'activos' then -f.dias_activos_30d else f.ord end, f.ord)
      from (
        select c.ord, p.id, p.username::text as username, p.display_name, u.email,
               p.created_at as alta_at, p.account_type, p.city, p.plan, p.es_prueba,
               p.onboarding_completed as onboarding, p.current_streak as racha, p.current_rank_slug as nivel,
               p.total_xp as puntos,
               coalesce(uu.ultima_vez,
                        (select max(ac.completed_at) from activity_completions ac where ac.user_id = p.id)) as ultima_vez,
               uu.plataforma, uu.sistema, uu.instalada,
               exists (select 1 from push_subscriptions s where s.user_id = p.id) as avisos,
               (select count(distinct d.dia) from (
                  select ud.dia from uso_diario ud where ud.user_id = p.id and ud.clave = 'activo' and ud.dia > v_hoy - 30
                  union select ac.local_date from activity_completions ac where ac.user_id = p.id and ac.local_date > v_hoy - 30
                ) d) as dias_activos_30d,
               (select count(*) from activity_completions ac where ac.user_id = p.id and ac.local_date > v_hoy - 30
                  and ac.status in ('honor','verified')) as acciones_30d,
               (select coalesce(jsonb_object_agg(substr(ud.clave, 5), ud.dias), '{}'::jsonb) from (
                  select clave, count(*) dias from uso_diario
                   where user_id = p.id and clave like 'sec:%' and dia > v_hoy - 30 group by clave) ud) as secciones_30d,
               (select count(*) from business_members m where m.user_id = p.id) as negocios
          from cand c
          join profiles p on p.id = c.id
          join auth.users u on u.id = p.id
          left join uso_usuario uu on uu.user_id = p.id
      ) f), '[]'::jsonb));
end $$;

revoke all on function public.admin_analitica_usuarios(text, text, text, int) from public, anon;
grant execute on function public.admin_analitica_usuarios(text, text, text, int) to authenticated;

-- ── La bandeja: todo lo que espera una respuesta ────────────────────────────

create or replace function public.admin_pendientes(p_pass text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not admin_check(p_pass) then
    return jsonb_build_object('ok', false, 'error', 'Contraseña incorrecta');
  end if;
  return jsonb_build_object(
    'ok', true,
    'reportes_plaza', (select count(*) from content_reports where status = 'open'),
    'negocios',       (select count(*) from businesses where status in ('submitted','in_review') and revision_note is null),
    'listados',       (select count(*) from listings where status = 'pendiente'),
    'auditoria',      (select count(*) from listings where acelerada and auditado_at is null and status = 'publicado'),
    'reportes_mercado', (select count(*) from listing_reports where estado = 'abierto'),
    'objetivos',      (select count(*) from improvement_goals where status = 'en_revision'),
    'compromisos',    (select count(*) from tienda_compromisos c join businesses b on b.id = c.business_id
                        where c.estado = 'declarado' and c.foto_path is not null and b.status = 'approved'),
    'academia',       (select count(*) from ac_revision_cola where estado = 'pendiente'),
    'errores_mundo_24h', (select count(*) from world_client_errors where created_at > now() - interval '24 hours')
  );
end $$;

revoke all on function public.admin_pendientes(text) from public, anon;
grant execute on function public.admin_pendientes(text) to authenticated;
