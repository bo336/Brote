-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0133 — Rangos por período (docs/LANZAMIENTO.md D1–D5, F7).
--
-- Dos escaleras, una por cosa:
--   · El NIVEL (Semilla → Gaia, por puntos de por vida) queda como estaba:
--     mueve tu mundo y nunca baja.
--   · El RANGO pasa a decir qué tipo de persona que cuida el ambiente fuiste
--     en el último período (semana o mes): Aprendiz, Practicante,
--     Ambientalista, Referente, Agente de cambio, Guía, Faro.
--
-- Cómo se gana y cómo se sostiene:
--   · Cada rango pide, por semana: días activos, acciones (máx. 6 por día),
--     temas distintos, acciones con impacto medido, días con algo para la
--     comunidad y sesiones de la Academia aprobadas. En un período de N días
--     se pide ceil(valor × N / 7) (nunca más días que N; los temas no crecen
--     con un mes porque son amplitud, no cantidad).
--   · Guía pide haber sido Agente de cambio el período anterior; Faro, Guía.
--     Nadie llega arriba de un salto.
--   · Al cerrar el período: si cumpliste un rango más alto, subís; si
--     cumpliste el tuyo, lo mantenés; si te faltó poco (cumpliste el de abajo)
--     lo conservás UNA vez; si no, bajás, como mucho dos rangos por período.
--   · Semana o mes es un valor del panel (`rango_periodo`). Se aplica desde el
--     próximo período: el que está en curso termina como empezó.
--
-- Escala: los tableros del período leen `rango_puntos`, que mantiene un
-- trigger sobre `activity_completions` (una fila por persona y período). El
-- cálculo de métricas para cerrar corre una vez por período, de noche.
--
-- Las ligas semanales (0023, `user_leagues`) se retiran: "tu liga" es ahora el
-- tablero de la gente de tu mismo rango.
-- ════════════════════════════════════════════════════════════════════════════

insert into app_settings (key, value, description) values
  ('rango_periodo', '"semana"'::jsonb, 'Cada cuánto se define el rango: "semana" o "mes". El cambio rige desde el próximo período.')
on conflict (key) do nothing;

-- ── Tablas ──────────────────────────────────────────────────────────────────

create table if not exists public.rangos (
  tier        smallint primary key check (tier between 1 and 7),
  slug        text not null unique,
  nombre      text not null,
  descripcion text not null,
  color       text not null,
  requisitos  jsonb not null default '{}'::jsonb,
  previo      smallint references public.rangos (tier)
);

create table if not exists public.rango_periodos (
  id         serial primary key,
  tipo       text not null check (tipo in ('semana', 'mes')),
  inicio     date not null unique,
  fin        date not null,
  cerrado_at timestamptz,
  check (fin >= inicio)
);
create index if not exists rango_periodos_abiertos on public.rango_periodos (fin) where cerrado_at is null;

create table if not exists public.rango_usuario (
  user_id        uuid primary key references auth.users (id) on delete cascade,
  tier           smallint not null default 1 references public.rangos (tier),
  margen_usado   boolean not null default false,
  periodo_id     int references public.rango_periodos (id),
  actualizado_at timestamptz not null default now()
);
create index if not exists rango_usuario_tier on public.rango_usuario (tier);

create table if not exists public.rango_historial (
  user_id     uuid not null references auth.users (id) on delete cascade,
  periodo_id  int not null references public.rango_periodos (id) on delete cascade,
  tier_previo smallint not null,
  tier_nuevo  smallint not null,
  resultado   text not null check (resultado in ('sube', 'mantiene', 'margen', 'baja')),
  metricas    jsonb not null,
  primary key (user_id, periodo_id)
);
create index if not exists rango_historial_periodo on public.rango_historial (periodo_id, tier_nuevo);

create table if not exists public.rango_puntos (
  periodo_id int not null references public.rango_periodos (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  puntos     int not null default 0,
  primary key (periodo_id, user_id)
);
create index if not exists rango_puntos_tabla on public.rango_puntos (periodo_id, puntos desc);

alter table public.rangos enable row level security;
alter table public.rango_periodos enable row level security;
alter table public.rango_usuario enable row level security;
alter table public.rango_historial enable row level security;
alter table public.rango_puntos enable row level security;
revoke all on public.rangos, public.rango_periodos, public.rango_usuario, public.rango_historial, public.rango_puntos
  from public, anon, authenticated;

-- Los siete. Espejo exacto en `lib/rangos.ts` (un test los compara).
insert into public.rangos (tier, slug, nombre, descripcion, color, requisitos, previo) values
  (1, 'aprendiz', 'Aprendiz', 'Empieza a mirar su huella y prueba sus primeras acciones.', '#A38B6D', '{}', null),
  (2, 'practicante', 'Practicante', 'Hace algo por el ambiente varias veces por semana.', '#9CC93B',
     '{"dias":2,"acciones":3}', null),
  (3, 'ambientalista', 'Ambientalista', 'Cuidar ya es parte de su semana, en varios temas.', '#3CB371',
     '{"dias":4,"acciones":8,"temas":3,"medidas":1}', null),
  (4, 'referente', 'Referente', 'Su forma de vivir se nota y se mide.', '#1FB57A',
     '{"dias":5,"acciones":12,"temas":4,"medidas":3,"aprendizaje":1}', null),
  (5, 'agente', 'Agente de cambio', 'Mueve a otros, no sólo a sí.', '#2DB4D4',
     '{"dias":6,"acciones":16,"temas":5,"medidas":5,"comunidad":1,"aprendizaje":1}', null),
  (6, 'guia', 'Guía', 'Sostiene a su comunidad, período tras período.', '#5B6CF0',
     '{"dias":6,"acciones":20,"temas":6,"medidas":7,"comunidad":2,"aprendizaje":2}', 5),
  (7, 'faro', 'Faro', 'Lo más alto de Brote, y hay que sostenerlo.', '#FFB23E',
     '{"dias":7,"acciones":25,"temas":7,"medidas":10,"comunidad":3,"aprendizaje":3}', 6)
on conflict (tier) do nothing;

-- ── Fechas ──────────────────────────────────────────────────────────────────

create or replace function public.brote_hoy_ba()
returns date
language sql
stable
as $$ select (now() at time zone 'America/Argentina/Buenos_Aires')::date $$;

create or replace function public.brote_rango_fin(p_inicio date, p_tipo text)
returns date
language sql
immutable
as $$
  select case when p_tipo = 'mes'
              then (date_trunc('month', p_inicio) + interval '1 month - 1 day')::date
              else p_inicio + (7 - extract(isodow from p_inicio))::int end;
$$;

create or replace function public.brote_rango_tipo()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case when (select value #>> '{}' from app_settings where key = 'rango_periodo') = 'mes' then 'mes' else 'semana' end;
$$;

-- El período que cubre hoy. Si no existe (la primera vez, o el cron de cierre
-- todavía no corrió después de medianoche), lo crea a continuación del último,
-- con el tipo que diga el panel en ese momento.
create or replace function public.brote_rango_periodo()
returns public.rango_periodos
language plpgsql
security definer
set search_path = public
as $$
declare p rango_periodos%rowtype; v_hoy date := brote_hoy_ba(); v_tipo text; v_ini date; v_ult date;
begin
  select * into p from rango_periodos where v_hoy between inicio and fin order by inicio desc limit 1;
  if found then return p; end if;
  v_tipo := brote_rango_tipo();
  select max(fin) into v_ult from rango_periodos;
  loop
    if v_ult is null then
      v_ini := case when v_tipo = 'mes' then date_trunc('month', v_hoy)::date
                    else v_hoy - (extract(isodow from v_hoy)::int - 1) end;
    else
      v_ini := v_ult + 1;
    end if;
    insert into rango_periodos (tipo, inicio, fin) values (v_tipo, v_ini, brote_rango_fin(v_ini, v_tipo))
    on conflict (inicio) do nothing;
    select * into p from rango_periodos where inicio = v_ini;
    exit when p.fin >= v_hoy;
    v_ult := p.fin;
  end loop;
  return p;
end $$;

-- ── Métricas ────────────────────────────────────────────────────────────────

-- Requisitos de un rango para un período de p_dias días.
create or replace function public.brote_rango_requisitos(p_req jsonb, p_dias int)
returns jsonb
language sql
immutable
as $$
  -- `temas` es amplitud, no cantidad: no crece con un mes (hay 13 temas) y
  -- sólo se achica en un período de menos de una semana.
  select coalesce(jsonb_object_agg(k,
           case when k = 'dias' then least(ceil(v::numeric * p_dias / 7.0), p_dias)
                when k = 'temas' then least(ceil(v::numeric * least(1.0, p_dias / 7.0)), 13)
                else ceil(v::numeric * p_dias / 7.0) end), '{}'::jsonb)
    from jsonb_each_text(coalesce(p_req, '{}'::jsonb)) as e(k, v);
$$;

-- Qué cumple cada persona en [p_desde, p_hasta]. Con p_user, sólo esa persona.
create or replace function public.brote_rango_metricas(p_desde date, p_hasta date, p_user uuid default null)
returns table (user_id uuid, dias int, acciones int, temas int, medidas int, comunidad int, aprendizaje int, puntos int)
language sql
stable
security definer
set search_path = public
as $$
  with lim as (
    select (p_desde::timestamp at time zone 'America/Argentina/Buenos_Aires') as t0,
           ((p_hasta + 1)::timestamp at time zone 'America/Argentina/Buenos_Aires') as t1
  ), c as (
    select ac.user_id, ac.local_date, ac.domain_slug, ac.points_awarded,
           (coalesce(ac.impact_water_l, a.impact_water_l, 0) > 0 or coalesce(ac.impact_co2_kg, a.impact_co2_kg, 0) > 0
            or coalesce(ac.impact_waste_kg, a.impact_waste_kg, 0) > 0 or coalesce(ac.impact_energy_kwh, a.impact_energy_kwh, 0) > 0) as medida,
           row_number() over (partition by ac.user_id, ac.local_date order by ac.completed_at, ac.id) as n_dia
      from activity_completions ac
      join activities a on a.id = ac.activity_id
     where ac.local_date between p_desde and p_hasta
       and ac.status in ('honor', 'verified')
       and not ('juego' = any(a.tags))
       and (p_user is null or ac.user_id = p_user)
  ), base as (
    select c.user_id,
           count(distinct c.local_date)::int as dias,
           (count(*) filter (where c.n_dia <= 6))::int as acciones,
           count(distinct c.domain_slug)::int as temas,
           (count(*) filter (where c.medida and c.n_dia <= 6))::int as medidas,
           coalesce(sum(c.points_awarded), 0)::int as puntos
      from c group by c.user_id
  ), com as (
    -- Días con algo para la comunidad: una jornada de proyecto, sumarse a un
    -- proyecto, contar en la Plaza lo que hiciste o regalarle algo a un amigo
    -- en su mundo. Cuenta el DÍA, no la cantidad: no se puede inflar.
    select x.user_id, count(distinct x.dia)::int as n from (
      select psa.user_id, (ps.held_at at time zone 'America/Argentina/Buenos_Aires')::date as dia
        from project_session_attendees psa join project_sessions ps on ps.id = psa.session_id, lim
       where ps.held_at >= lim.t0 and ps.held_at < lim.t1
      union all
      select pp.user_id, (pp.joined_at at time zone 'America/Argentina/Buenos_Aires')::date
        from project_participants pp, lim where pp.joined_at >= lim.t0 and pp.joined_at < lim.t1
      union all
      select fp.author_id, (fp.created_at at time zone 'America/Argentina/Buenos_Aires')::date
        from feed_posts fp, lim where fp.kind = 'post' and not fp.hidden and fp.created_at >= lim.t0 and fp.created_at < lim.t1
      union all
      select wg.from_id, wg.sent_on from world_gifts wg where wg.sent_on between p_desde and p_hasta
    ) x where p_user is null or x.user_id = p_user
    group by x.user_id
  ), apr as (
    -- Sesiones de la Academia aprobadas (60 % o más de respuestas correctas).
    select s.user_id, count(*)::int as n
      from ac_sesiones s, lim
     where s.finished_at >= lim.t0 and s.finished_at < lim.t1
       and s.respondidas > 0 and s.correctas >= 0.6 * s.respondidas
       and (p_user is null or s.user_id = p_user)
     group by s.user_id
  )
  select coalesce(b.user_id, cm.user_id, ap.user_id),
         coalesce(b.dias, 0), coalesce(b.acciones, 0), coalesce(b.temas, 0), coalesce(b.medidas, 0),
         coalesce(cm.n, 0), coalesce(ap.n, 0), coalesce(b.puntos, 0)
    from base b
    full join com cm on cm.user_id = b.user_id
    full join apr ap on ap.user_id = coalesce(b.user_id, cm.user_id);
$$;

-- El rango más alto cuyos requisitos se cumplen (y cuyo rango previo se tenía).
create or replace function public.brote_rango_calificado(p_m jsonb, p_dias int, p_tier_previo smallint)
returns smallint
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(max(r.tier), 1)::smallint
    from rangos r
   where (r.previo is null or p_tier_previo >= r.previo)
     and not exists (
       select 1 from jsonb_each_text(brote_rango_requisitos(r.requisitos, p_dias)) q(k, v)
        where coalesce((p_m ->> q.k)::numeric, 0) < q.v::numeric);
$$;

-- La regla de cierre, sola, para poder probarla.
create or replace function public.brote_rango_decidir(p_previo smallint, p_calificado smallint, p_margen_usado boolean)
returns table (nuevo smallint, resultado text, margen_usado boolean)
language sql
immutable
as $$
  select case
           when p_calificado >= p_previo then p_calificado
           when p_calificado = p_previo - 1 and not p_margen_usado then p_previo
           else greatest(p_calificado, p_previo - 2, 1)::smallint end,
         case
           when p_calificado > p_previo then 'sube'
           when p_calificado = p_previo then 'mantiene'
           when p_calificado = p_previo - 1 and not p_margen_usado then 'margen'
           else 'baja' end,
         (p_calificado < p_previo and p_calificado = p_previo - 1 and not p_margen_usado);
$$;

-- ── Cerrar períodos ─────────────────────────────────────────────────────────

create or replace function public.brote_rangos_cerrar_periodo(p_periodo int, p_avisar boolean default true)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare per rango_periodos%rowtype; v_dias int; v_n int; v_quien text;
begin
  select * into per from rango_periodos where id = p_periodo for update;
  if not found or per.cerrado_at is not null then return 0; end if;
  v_dias := per.fin - per.inicio + 1;
  v_quien := case when per.tipo = 'mes' then 'este mes' else 'esta semana' end;

  drop table if exists _rango_cierre;
  create temp table _rango_cierre on commit drop as
    with m as (select * from brote_rango_metricas(per.inicio, per.fin, null)),
    cand as (
      select m.user_id from m
      union
      select ru.user_id from rango_usuario ru where ru.tier > 1
    ), base as (
      select c.user_id,
             coalesce(ru.tier, 1)::smallint as previo,
             coalesce(ru.margen_usado, false) as margen,
             jsonb_build_object('dias', coalesce(m.dias, 0), 'acciones', coalesce(m.acciones, 0), 'temas', coalesce(m.temas, 0),
                                'medidas', coalesce(m.medidas, 0), 'comunidad', coalesce(m.comunidad, 0),
                                'aprendizaje', coalesce(m.aprendizaje, 0), 'puntos', coalesce(m.puntos, 0)) as metricas,
             coalesce(m.dias, 0) > 0 as activo
        from cand c
        join profiles p on p.id = c.user_id
        left join m on m.user_id = c.user_id
        left join rango_usuario ru on ru.user_id = c.user_id
    ), cal as (
      select b.*, brote_rango_calificado(b.metricas, v_dias, b.previo) as calificado from base b
    )
    select cal.*, d.nuevo, d.resultado, d.margen_usado as margen_nuevo
      from cal cross join lateral brote_rango_decidir(cal.previo, cal.calificado, cal.margen) d;

  insert into rango_historial (user_id, periodo_id, tier_previo, tier_nuevo, resultado, metricas)
  select user_id, per.id, previo, nuevo, resultado, metricas from _rango_cierre
  on conflict (user_id, periodo_id) do nothing;

  insert into rango_usuario (user_id, tier, margen_usado, periodo_id, actualizado_at)
  select user_id, nuevo, margen_nuevo, per.id, now() from _rango_cierre
  on conflict (user_id) do update set tier = excluded.tier, margen_usado = excluded.margen_usado,
                                      periodo_id = excluded.periodo_id, actualizado_at = now();
  get diagnostics v_n = row_count;

  if p_avisar then
    -- Un aviso por período: a quien cambió de rango o lo sostuvo estando activo.
    insert into notifications (user_id, type, title_es, body_es, data)
    select x.user_id, 'rango',
           case x.resultado
             when 'sube' then 'Subiste a ' || rn.nombre || ' 🌱'
             when 'mantiene' then 'Seguís siendo ' || rn.nombre
             when 'margen' then 'Conservaste ' || rn.nombre || ' por poco'
             else 'Ahora sos ' || rn.nombre end,
           case x.resultado
             when 'sube' then initcap(left(v_quien, 1)) || substr(v_quien, 2) || ' cumpliste lo que pide ' || rn.nombre || '. Sostenelo en el próximo período.'
             when 'mantiene' then 'Cumpliste lo que pide tu rango. A sostenerlo.'
             when 'margen' then 'Te faltó poco ' || v_quien || ': el próximo período no hay margen.'
             else 'Te faltó para sostener ' || rp.nombre || '. Lo recuperás cumpliendo sus requisitos.' end,
           jsonb_build_object('url', '/ranking', 'periodo', per.id, 'resultado', x.resultado, 'tier', x.nuevo)
      from _rango_cierre x
      join rangos rn on rn.tier = x.nuevo
      join rangos rp on rp.tier = x.previo
     where x.resultado in ('sube', 'margen', 'baja') or (x.resultado = 'mantiene' and x.nuevo >= 2 and x.activo);
  end if;

  update rango_periodos set cerrado_at = now() where id = per.id;
  return v_n;
end $$;

-- El cron diario: cierra lo que terminó y deja abierto el período de hoy.
create or replace function public.brote_rangos_cerrar()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare r record; v_total int := 0; v_n int := 0;
begin
  for r in select id from rango_periodos where cerrado_at is null and fin < brote_hoy_ba() order by inicio loop
    v_total := v_total + brote_rangos_cerrar_periodo(r.id, true);
    v_n := v_n + 1;
  end loop;
  perform brote_rango_periodo();
  delete from rango_puntos where periodo_id in (
    select id from rango_periodos where cerrado_at is not null and fin < brote_hoy_ba() - 400);
  return jsonb_build_object('periodos', v_n, 'personas', v_total);
end $$;

-- ── Puntos del período, al momento ──────────────────────────────────────────

create or replace function public.brote_rango_puntos_sumar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_per int; v_hoy date := brote_hoy_ba();
begin
  if tg_op in ('UPDATE', 'DELETE') and old.status in ('honor', 'verified') then
    select id into v_per from rango_periodos where old.local_date between inicio and fin and cerrado_at is null;
    if v_per is not null then
      update rango_puntos set puntos = greatest(0, puntos - coalesce(old.points_awarded, 0))
       where periodo_id = v_per and user_id = old.user_id;
    end if;
  end if;
  if tg_op in ('INSERT', 'UPDATE') and new.status in ('honor', 'verified') then
    v_per := null;
    select id into v_per from rango_periodos where new.local_date between inicio and fin and cerrado_at is null;
    if v_per is null and new.local_date >= v_hoy - 1 then
      v_per := (brote_rango_periodo()).id;
      if not exists (select 1 from rango_periodos where id = v_per and new.local_date between inicio and fin) then v_per := null; end if;
    end if;
    if v_per is not null then
      insert into rango_puntos (periodo_id, user_id, puntos) values (v_per, new.user_id, coalesce(new.points_awarded, 0))
      on conflict (periodo_id, user_id) do update set puntos = rango_puntos.puntos + excluded.puntos;
    end if;
  end if;
  return null;
exception when others then
  return null;  -- el tablero nunca puede impedir que alguien marque una acción
end $$;

drop trigger if exists activity_completions_rango_puntos on public.activity_completions;
create trigger activity_completions_rango_puntos
  after insert or update of status, points_awarded or delete on public.activity_completions
  for each row execute function public.brote_rango_puntos_sumar();

-- ── Lo que ve cada persona ──────────────────────────────────────────────────

create or replace function public.mi_rango()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid(); per rango_periodos%rowtype; v_hoy date := brote_hoy_ba();
  v_tier smallint; v_margen boolean; v_m jsonb; v_dias int; v_camino smallint;
begin
  if v_uid is null then return jsonb_build_object('ok', false); end if;
  per := brote_rango_periodo();
  v_dias := per.fin - per.inicio + 1;
  select tier, margen_usado into v_tier, v_margen from rango_usuario where user_id = v_uid;
  v_tier := coalesce(v_tier, 1); v_margen := coalesce(v_margen, false);
  select jsonb_build_object('dias', m.dias, 'acciones', m.acciones, 'temas', m.temas, 'medidas', m.medidas,
                            'comunidad', m.comunidad, 'aprendizaje', m.aprendizaje, 'puntos', m.puntos)
    into v_m from brote_rango_metricas(per.inicio, least(per.fin, v_hoy), v_uid) m;
  v_m := coalesce(v_m, jsonb_build_object('dias', 0, 'acciones', 0, 'temas', 0, 'medidas', 0, 'comunidad', 0, 'aprendizaje', 0, 'puntos', 0));
  v_camino := brote_rango_calificado(v_m, v_dias, v_tier);

  return jsonb_build_object(
    'ok', true,
    'periodo', jsonb_build_object('id', per.id, 'tipo', per.tipo, 'inicio', per.inicio, 'fin', per.fin, 'dias', v_dias,
                                  'quedan', per.fin - v_hoy + 1, 'proximo_tipo', brote_rango_tipo()),
    'tier', v_tier,
    'margen_usado', v_margen,
    'camino', v_camino,
    'metricas', v_m,
    'rangos', (select jsonb_agg(jsonb_build_object(
                 'tier', r.tier, 'slug', r.slug, 'nombre', r.nombre, 'descripcion', r.descripcion, 'color', r.color,
                 'previo', r.previo, 'requisitos', brote_rango_requisitos(r.requisitos, v_dias),
                 'por_semana', r.requisitos) order by r.tier) from rangos r),
    'historial', coalesce((select jsonb_agg(jsonb_build_object('inicio', p.inicio, 'fin', p.fin, 'tipo', p.tipo,
                             'previo', h.tier_previo, 'nuevo', h.tier_nuevo, 'resultado', h.resultado) order by p.inicio desc)
                             from (select * from rango_historial where user_id = v_uid) h
                             join rango_periodos p on p.id = h.periodo_id
                            where p.inicio > v_hoy - 400), '[]'::jsonb)
  );
end $$;

-- Tableros del período. Los chicos no aparecen en ninguna lista pública
-- (su propio puesto sí se calcula), ni las cuentas de prueba ni suspendidas.
create or replace function public.ranking_periodo(p_ambito text default 'global', p_limite int default 50)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid(); per rango_periodos%rowtype; v_me profiles%rowtype; v_tier smallint;
  v_lim int := least(greatest(coalesce(p_limite, 50), 1), 200); v_filas jsonb; v_mios int; v_pos int;
begin
  per := brote_rango_periodo();
  select * into v_me from profiles where id = v_uid;
  select coalesce((select tier from rango_usuario where user_id = v_uid), 1) into v_tier;

  with base as (
    select rp.user_id, rp.puntos, coalesce(ru.tier, 1) as tier, p.username::text as username, p.display_name,
           p.avatar_url, p.current_rank_slug as nivel, p.city
      from rango_puntos rp
      join profiles p on p.id = rp.user_id
      left join rango_usuario ru on ru.user_id = rp.user_id
     where rp.periodo_id = per.id and rp.puntos > 0
       and p.account_type <> 'kid' and not coalesce(p.es_prueba, false)
       and (p.suspended_until is null or p.suspended_until < now())
       and case p_ambito
             when 'ciudad' then v_me.city is not null and lower(p.city) = lower(v_me.city)
             when 'rango' then coalesce(ru.tier, 1) = v_tier
             when 'amigos' then rp.user_id = v_uid or exists (
                 select 1 from friendships f where f.status = 'accepted'
                    and ((f.user_id = v_uid and f.friend_id = rp.user_id) or (f.friend_id = v_uid and f.user_id = rp.user_id)))
             else true end
  )
  select coalesce(jsonb_agg(jsonb_build_object('pos', x.pos, 'user_id', x.user_id, 'username', x.username,
                                               'display_name', x.display_name, 'avatar_url', x.avatar_url,
                                               'puntos', x.puntos, 'tier', x.tier, 'nivel', x.nivel) order by x.pos), '[]'::jsonb)
    into v_filas
    from (select b.*, row_number() over (order by b.puntos desc, b.user_id) as pos from base b order by b.puntos desc, b.user_id limit v_lim) x;

  select coalesce(puntos, 0) into v_mios from rango_puntos where periodo_id = per.id and user_id = v_uid;
  v_mios := coalesce(v_mios, 0);
  -- Mi puesto entre la misma población que muestra el tablero.
  select count(*) + 1 into v_pos
    from rango_puntos rp
    join profiles p on p.id = rp.user_id
    left join rango_usuario ru on ru.user_id = rp.user_id
   where rp.periodo_id = per.id and rp.puntos > v_mios
     and p.account_type <> 'kid' and not coalesce(p.es_prueba, false)
     and (p.suspended_until is null or p.suspended_until < now())
     and case p_ambito
           when 'ciudad' then v_me.city is not null and lower(p.city) = lower(v_me.city)
           when 'rango' then coalesce(ru.tier, 1) = v_tier
           when 'amigos' then exists (select 1 from friendships f where f.status = 'accepted'
                  and ((f.user_id = v_uid and f.friend_id = rp.user_id) or (f.friend_id = v_uid and f.user_id = rp.user_id)))
           else true end;

  return jsonb_build_object('ok', true, 'ambito', p_ambito,
    'periodo', jsonb_build_object('tipo', per.tipo, 'inicio', per.inicio, 'fin', per.fin),
    'filas', v_filas, 'yo', jsonb_build_object('puntos', v_mios, 'pos', case when v_mios > 0 then v_pos end, 'tier', v_tier));
end $$;

-- El rango de cualquiera, para su perfil y las filas de los tableros.
create or replace function public.rangos_de(p_usuarios uuid[])
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_object_agg(u, coalesce(ru.tier, 1)), '{}'::jsonb)
    from unnest(p_usuarios[1:200]) u left join rango_usuario ru on ru.user_id = u;
$$;

-- ── El panel ────────────────────────────────────────────────────────────────

create or replace function public.admin_rangos(p_pass text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare per rango_periodos%rowtype;
begin
  if not admin_check(p_pass) then return jsonb_build_object('ok', false, 'error', 'Contraseña incorrecta'); end if;
  per := brote_rango_periodo();
  return jsonb_build_object('ok', true,
    'tipo', brote_rango_tipo(),
    'periodo', jsonb_build_object('id', per.id, 'tipo', per.tipo, 'inicio', per.inicio, 'fin', per.fin),
    'rangos', (select jsonb_agg(jsonb_build_object('tier', tier, 'slug', slug, 'nombre', nombre, 'descripcion', descripcion,
                                                   'color', color, 'requisitos', requisitos, 'previo', previo) order by tier) from rangos),
    'distribucion', (select jsonb_object_agg(r.tier, (select count(*) from rango_usuario ru where ru.tier = r.tier)
                                                     + case when r.tier = 1 then (select count(*) from profiles p
                                                         where not exists (select 1 from rango_usuario ru2 where ru2.user_id = p.id)) else 0 end)
                       from rangos r),
    'cierres', coalesce((select jsonb_agg(x order by x.inicio desc) from (
        select p.inicio, p.fin, p.tipo,
               count(*) filter (where h.resultado = 'sube') as suben,
               count(*) filter (where h.resultado = 'mantiene') as mantienen,
               count(*) filter (where h.resultado = 'margen') as margen,
               count(*) filter (where h.resultado = 'baja') as bajan
          from rango_periodos p left join rango_historial h on h.periodo_id = p.id
         where p.cerrado_at is not null
         group by p.id order by p.inicio desc limit 8) x), '[]'::jsonb),
    'activos_periodo', (select count(*) from rango_puntos where periodo_id = per.id and puntos > 0));
end $$;

create or replace function public.admin_rango_guardar(p_pass text, p_tier smallint, p_nombre text, p_descripcion text, p_requisitos jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not admin_check(p_pass) then return jsonb_build_object('ok', false, 'error', 'Contraseña incorrecta'); end if;
  if length(btrim(coalesce(p_nombre, ''))) not between 3 and 30 or length(btrim(coalesce(p_descripcion, ''))) not between 10 and 160 then
    return jsonb_build_object('ok', false, 'error', 'Nombre (3 a 30 letras) y descripción (10 a 160).');
  end if;
  if jsonb_typeof(p_requisitos) <> 'object' or exists (
       select 1 from jsonb_each(p_requisitos) e
        where e.key not in ('dias', 'acciones', 'temas', 'medidas', 'comunidad', 'aprendizaje')
           or jsonb_typeof(e.value) <> 'number' or (e.value)::text::numeric not between 0 and 60
           or (e.key = 'dias' and (e.value)::text::numeric > 7)) then
    return jsonb_build_object('ok', false, 'error', 'Requisitos por semana: días (0 a 7) y el resto de 0 a 60.');
  end if;
  update rangos set nombre = btrim(p_nombre), descripcion = btrim(p_descripcion),
                    requisitos = case when p_tier = 1 then '{}'::jsonb else p_requisitos end
   where tier = p_tier;
  return jsonb_build_object('ok', found);
end $$;

create or replace function public.admin_rango_periodo(p_pass text, p_tipo text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not admin_check(p_pass) then return jsonb_build_object('ok', false, 'error', 'Contraseña incorrecta'); end if;
  if p_tipo not in ('semana', 'mes') then return jsonb_build_object('ok', false, 'error', 'semana o mes'); end if;
  insert into app_settings (key, value, description) values ('rango_periodo', to_jsonb(p_tipo), 'Cada cuánto se define el rango')
  on conflict (key) do update set value = excluded.value, updated_at = now();
  return jsonb_build_object('ok', true, 'desde', (select fin + 1 from rango_periodos where cerrado_at is null order by inicio desc limit 1));
end $$;

-- ── Permisos ────────────────────────────────────────────────────────────────

revoke all on function public.brote_rango_periodo() from public, anon, authenticated;
revoke all on function public.brote_rango_metricas(date, date, uuid) from public, anon, authenticated;
revoke all on function public.brote_rango_calificado(jsonb, int, smallint) from public, anon, authenticated;
revoke all on function public.brote_rangos_cerrar_periodo(int, boolean) from public, anon, authenticated;
revoke all on function public.brote_rangos_cerrar() from public, anon, authenticated;
revoke all on function public.brote_rango_puntos_sumar() from public, anon, authenticated;
revoke all on function public.brote_rango_tipo() from public, anon, authenticated;
revoke all on function public.mi_rango() from public, anon;
revoke all on function public.ranking_periodo(text, int) from public, anon;
revoke all on function public.rangos_de(uuid[]) from public, anon;
revoke all on function public.admin_rangos(text) from public, anon;
revoke all on function public.admin_rango_guardar(text, smallint, text, text, jsonb) from public, anon;
revoke all on function public.admin_rango_periodo(text, text) from public, anon;
grant execute on function public.mi_rango() to authenticated;
grant execute on function public.ranking_periodo(text, int) to authenticated;
grant execute on function public.rangos_de(uuid[]) to authenticated;
grant execute on function public.admin_rangos(text) to authenticated;
grant execute on function public.admin_rango_guardar(text, smallint, text, text, jsonb) to authenticated;
grant execute on function public.admin_rango_periodo(text, text) to authenticated;

-- ── Arranque ────────────────────────────────────────────────────────────────
-- Para que nadie arranque en blanco: la semana anterior se cierra como un
-- período más (sin avisos), así quien venía haciendo cosas empieza con el
-- rango que le corresponde. Guía y Faro piden un período previo: desde acá,
-- como mucho Agente de cambio.

do $$
declare per rango_periodos%rowtype; v_ini date; v_id int;
begin
  if exists (select 1 from rango_periodos) then return; end if;
  per := brote_rango_periodo();
  v_ini := per.inicio - 7;
  insert into rango_periodos (tipo, inicio, fin) values ('semana', v_ini, per.inicio - 1) returning id into v_id;
  perform brote_rangos_cerrar_periodo(v_id, false);
  -- Los puntos del período en curso hasta hoy.
  insert into rango_puntos (periodo_id, user_id, puntos)
  select per.id, ac.user_id, sum(ac.points_awarded)
    from activity_completions ac
   where ac.local_date between per.inicio and per.fin and ac.status in ('honor', 'verified')
   group by ac.user_id
  on conflict (periodo_id, user_id) do update set puntos = excluded.puntos;
end $$;

select cron.unschedule('brote-rangos-cerrar') where exists (select 1 from cron.job where jobname = 'brote-rangos-cerrar');
select cron.schedule('brote-rangos-cerrar', '20 3 * * *', $$select public.brote_rangos_cerrar()$$);
-- Las ligas semanales se retiran (el tablero de tu rango ocupa su lugar).
select cron.unschedule('brote-league-rollover') where exists (select 1 from cron.job where jobname = 'brote-league-rollover');

-- ── "Rango" pasa a ser esto; la escalera de por vida se llama "nivel" ──────
-- El aviso que escribe `complete_activity` decía "¡Subiste de rango!" al subir
-- de nivel. Se corrige al entrar, sin tocar esa función de 15 mil caracteres.
create or replace function public.brote_aviso_nivel_texto()
returns trigger
language plpgsql
as $$
begin
  if new.type = 'rank_up' and new.title_es = '¡Subiste de rango!' then
    new.title_es := '¡Subiste de nivel!';
  end if;
  return new;
end $$;
drop trigger if exists notifications_nivel_texto on public.notifications;
create trigger notifications_nivel_texto
  before insert on public.notifications
  for each row execute function public.brote_aviso_nivel_texto();

-- create_project y join_project (definición viva, 0120) con "nivel" en vez de
-- "rango" en los mensajes: el gate sigue siendo el nivel de por vida.
CREATE OR REPLACE FUNCTION public.create_project(p_title text, p_description text, p_type text, p_domain text, p_neighborhood text, p_location_text text, p_lat double precision, p_lng double precision, p_event_date timestamp with time zone, p_max_participants integer, p_image_url text, p_min_rank text DEFAULT 'semilla'::text, p_contact_info text DEFAULT NULL::text, p_contact_kind text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_tier int;
  v_need int;
  v_id uuid;
  v_name text;
  v_tipo text;
begin
  if v_uid is null then raise exception 'No autenticado'; end if;

  select coalesce(account_type::text, 'adult') into v_tipo from profiles where id = v_uid;
  if v_tipo <> 'adult' then
    raise exception 'Los proyectos los organizan personas adultas: son encuentros en persona, con lugar y contacto.';
  end if;

  select coalesce((value #>> '{}')::int, 5) into v_need
  from app_settings where key = 'project_min_rank_tier';
  v_need := coalesce(v_need, 5);

  select (brote_get_rank(total_xp)->>'tier')::int into v_tier from profiles where id = v_uid;
  if v_tier < v_need then
    -- Name the rank rather than the number: "tier 5" means nothing to a user.
    v_name := case v_need
      when 1 then 'Semilla' when 2 then 'Brote' when 3 then 'Plántula' when 4 then 'Retoño'
      when 5 then 'Arbusto' when 6 then 'Árbol' when 7 then 'Bosque' when 8 then 'Guardián'
      when 9 then 'Ecosistema' when 10 then 'Planeta' else 'Gaia' end;
    raise exception 'Podés crear proyectos desde el nivel %', v_name;
  end if;

  if p_contact_kind is not null and p_contact_kind not in ('whatsapp','email','instagram','telegram','otro') then
    raise exception 'Tipo de contacto inválido';
  end if;

  insert into projects (creator_id, title, description, type, domain_slug, neighborhood, location_text,
                        lat, lng, event_date, max_participants, image_url, min_rank_slug, status,
                        contact_info, contact_kind)
  values (v_uid, p_title, p_description, coalesce(p_type,'otro'), p_domain, p_neighborhood, p_location_text,
          p_lat, p_lng, p_event_date, p_max_participants, p_image_url, coalesce(p_min_rank,'semilla'), 'active',
          nullif(btrim(coalesce(p_contact_info,'')), ''), p_contact_kind)
  returning id into v_id;

  insert into project_participants (project_id, user_id, status)
  values (v_id, v_uid, 'organizer') on conflict do nothing;
  return v_id;
end $function$;

CREATE OR REPLACE FUNCTION public.join_project(p_project_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_uid uuid := auth.uid(); v_tier int; v_min int; v_count int; v_max int; v_tipo text;
begin
  if v_uid is null then raise exception 'No autenticado'; end if;
  select coalesce(account_type::text, 'adult') into v_tipo from profiles where id = v_uid;
  if v_tipo = 'kid' then
    raise exception 'Los proyectos son encuentros en persona: con una cuenta de chico no se puede sumar. Puede hacerlo una persona adulta de tu familia.';
  end if;
  select tier into v_min from ranks where slug = (select min_rank_slug from projects where id = p_project_id);
  select (brote_get_rank(total_xp)->>'tier')::int into v_tier from profiles where id = v_uid;
  if v_tier < coalesce(v_min, 1) then raise exception 'Este proyecto requiere un nivel mayor'; end if;
  select max_participants into v_max from projects where id = p_project_id;
  if v_max is not null then
    select count(*) into v_count from project_participants where project_id = p_project_id and status in ('joined','organizer');
    if v_count >= v_max then raise exception 'El proyecto está completo'; end if;
  end if;
  insert into project_participants (project_id, user_id, status) values (p_project_id, v_uid, 'joined')
    on conflict (project_id, user_id) do update set status = 'joined';
  return true;
end $function$;
