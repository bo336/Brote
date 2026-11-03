-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0142 — Vuelven las ligas semanales, y el rango vuelve a ser el rango.
--
-- Pedido del dueño (2026-11-02), que corrige lo de 0133:
--   · RANGO (Semilla → Gaia): por puntos totales, nunca baja. Vuelve a llamarse
--     rango en toda la app.
--   · LIGA: lo más importante. Un ranking que se mide cada semana, y cada semana
--     se sube, se baja o se mantiene según lo que hiciste.
--   · Mantenerse o subir no es difícil ni regalado: lo puede lograr cualquiera
--     con esfuerzo. Por eso la regla principal son metas de puntos, no un cupo
--     de ganadores: que suba otra persona nunca te impide subir a vos.
--
-- CÓMO SE JUEGA. Siete ligas (`rangos`, con los nombres de "tipo de persona" que
-- pidió el dueño en octubre; se editan en /panel/ligas). Cada una tiene:
--     puntos_mantener  menos que esto en la semana: bajás una liga
--     puntos_subir     esto o más: subís una liga
-- En el medio, seguís donde estás. Además, en un grupo de al menos
-- `grupo_minimo` personas, las `top_suben` primeras suben si llegaron a
-- mantenerse: para que siga siendo una carrera. Se sube o se baja de a una por
-- semana, así que nadie llega arriba de un salto.
--
-- LOS PUNTOS DE LA SEMANA son los mismos del rango: todo lo que suma a
-- `total_xp` (acciones, lecciones, Academia, jornadas, hábitos). Por día cuentan
-- hasta `tope_diario`: no alcanza con un solo día de empujón, y una jornada
-- inflada no te sube de liga.
--
-- GRUPOS. Se entra a un grupo de hasta `tamano_grupo` personas de tu liga al
-- sumar el primer punto de la semana: nadie compite contra cuentas dormidas.
-- Chicos y cuentas de prueba tienen grupo 0: se miden contra sus metas y no
-- aparecen en la tabla de nadie. Los jugadores simulados tampoco entran acá: la
-- liga mueve algo de verdad, así que sólo juega gente real.
--
-- PROYECTOS. Sumarse es libre. Crear y manejar uno pide estar en una liga alta
-- (por omisión desde Referente: tres subidas), para que nadie arme proyectos
-- para farmear puntos. Las jornadas, que son lo que reparte puntos, tienen tope.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Las metas de cada liga ──────────────────────────────────────────────────

alter table public.rangos
  add column if not exists puntos_mantener int not null default 0 check (puntos_mantener >= 0),
  add column if not exists puntos_subir int check (puntos_subir is null or puntos_subir > 0);

-- Una acción típica da unos 70 puntos. En acciones por semana:
-- Practicante se mantiene con 2 · Referente con 5 · Faro con 13.
update public.rangos set puntos_mantener = 0,   puntos_subir = 150  where tier = 1;
update public.rangos set puntos_mantener = 100, puntos_subir = 300  where tier = 2;
update public.rangos set puntos_mantener = 200, puntos_subir = 500  where tier = 3;
update public.rangos set puntos_mantener = 350, puntos_subir = 750  where tier = 4;
update public.rangos set puntos_mantener = 500, puntos_subir = 1000 where tier = 5;
update public.rangos set puntos_mantener = 700, puntos_subir = 1300 where tier = 6;
update public.rangos set puntos_mantener = 900, puntos_subir = null where tier = 7;

update public.rangos set descripcion = 'Sostiene a su comunidad, semana tras semana.'
 where tier = 6 and descripcion = 'Sostiene a su comunidad, período tras período.';

insert into app_settings (key, value, description) values
  ('liga_reglas',
   '{"tope_diario": 400, "tamano_grupo": 30, "top_suben": 3, "grupo_minimo": 10}'::jsonb,
   'Reglas de las ligas: puntos que cuentan por día, tamaño de cada grupo, cuántos primeros suben y desde qué tamaño de grupo. Se editan en /panel/ligas.')
on conflict (key) do nothing;

create or replace function public.brote_liga_reglas()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select '{"tope_diario": 400, "tamano_grupo": 30, "top_suben": 3, "grupo_minimo": 10}'::jsonb
         || coalesce((select value from app_settings where key = 'liga_reglas'), '{}'::jsonb);
$$;
revoke all on function public.brote_liga_reglas() from public, anon, authenticated;

-- Las metas son por semana; un período más largo (modo mensual) las escala.
create or replace function public.brote_liga_meta(p_puntos int, p_dias int)
returns int
language sql
immutable
as $$ select case when p_puntos is null then null else ceil(p_puntos * p_dias / 7.0)::int end $$;

-- La regla de cierre, sola, para poder probarla. Espejo en `lib/ligas.ts`.
create or replace function public.brote_liga_decidir(
  p_tier smallint, p_puntos int, p_pos int, p_tam int, p_mantener int, p_subir int, p_top int, p_minimo int)
returns table (nuevo smallint, resultado text)
language sql
immutable
as $$
  select case
           when p_subir is not null and p_puntos >= p_subir then p_tier + 1
           when p_subir is not null and p_pos is not null and p_pos <= p_top and p_tam >= p_minimo
                and p_puntos >= p_mantener and p_puntos > 0 then p_tier + 1
           when p_puntos >= p_mantener then p_tier
           else greatest(p_tier - 1, 1) end::smallint,
         case
           when p_subir is not null and p_puntos >= p_subir then 'sube'
           when p_subir is not null and p_pos is not null and p_pos <= p_top and p_tam >= p_minimo
                and p_puntos >= p_mantener and p_puntos > 0 then 'sube'
           when p_puntos >= p_mantener or p_tier = 1 then 'mantiene'
           else 'baja' end;
$$;

-- ── Los puntos: todo lo que suma a total_xp, con tope por día ───────────────

alter table public.rango_puntos
  add column if not exists tier smallint,
  add column if not exists grupo int not null default 0;
create index if not exists rango_puntos_grupo on public.rango_puntos (periodo_id, tier, grupo, puntos desc);

create table if not exists public.liga_puntos_dia (
  user_id uuid not null references auth.users (id) on delete cascade,
  dia     date not null,
  puntos  int not null default 0,
  primary key (user_id, dia)
);
alter table public.liga_puntos_dia enable row level security;
revoke all on public.liga_puntos_dia from public, anon, authenticated;

-- Suma `p_delta` puntos de hoy a la liga de la persona, respetando el tope.
create or replace function public.brote_liga_sumar(p_user uuid, p_delta int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hoy date := brote_hoy_ba(); v_reglas jsonb := brote_liga_reglas();
  v_tope int := greatest(coalesce((v_reglas ->> 'tope_diario')::int, 400), 1);
  v_antes int; v_ahora int; v_suma int; v_per int; v_tier smallint; v_grupo int; v_n int; v_tam int;
begin
  if p_delta = 0 then return; end if;
  select puntos into v_antes from liga_puntos_dia where user_id = p_user and dia = v_hoy for update;
  v_antes := coalesce(v_antes, 0);
  v_ahora := greatest(v_antes + p_delta, 0);
  insert into liga_puntos_dia (user_id, dia, puntos) values (p_user, v_hoy, v_ahora)
  on conflict (user_id, dia) do update set puntos = excluded.puntos;
  v_suma := least(v_ahora, v_tope) - least(v_antes, v_tope);
  if v_suma = 0 then return; end if;

  v_per := (brote_rango_periodo()).id;
  if exists (select 1 from rango_puntos where periodo_id = v_per and user_id = p_user) then
    update rango_puntos set puntos = greatest(puntos + v_suma, 0) where periodo_id = v_per and user_id = p_user;
    return;
  end if;
  if v_suma < 0 then return; end if;

  -- Primer punto de la semana: entra a un grupo de su liga.
  v_tier := coalesce((select tier from rango_usuario where user_id = p_user), 1);
  if exists (select 1 from profiles where id = p_user and (account_type = 'kid' or coalesce(es_prueba, false))) then
    v_grupo := 0;
  else
    v_tam := greatest(coalesce((v_reglas ->> 'tamano_grupo')::int, 30), 2);
    select count(*) into v_n from rango_puntos where periodo_id = v_per and tier = v_tier and grupo > 0;
    v_grupo := v_n / v_tam + 1;
  end if;
  insert into rango_puntos (periodo_id, user_id, puntos, tier, grupo) values (v_per, p_user, v_suma, v_tier, v_grupo)
  on conflict (periodo_id, user_id) do update set puntos = rango_puntos.puntos + excluded.puntos;
end $$;
revoke all on function public.brote_liga_sumar(uuid, int) from public, anon, authenticated;

create or replace function public.brote_liga_xp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Configurar una cuenta de prueba le pone puntos: eso no es jugar.
  if coalesce(current_setting('brote.sin_liga', true), '') = '1' then return null; end if;
  perform brote_liga_sumar(new.id, (new.total_xp - old.total_xp)::int);
  return null;
exception when others then
  return null;  -- la liga nunca puede impedir que alguien sume puntos
end $$;
revoke all on function public.brote_liga_xp() from public, anon, authenticated;

drop trigger if exists profiles_liga_xp on public.profiles;
create trigger profiles_liga_xp
  after update of total_xp on public.profiles
  for each row when (new.total_xp is distinct from old.total_xp)
  execute function public.brote_liga_xp();

-- El contador viejo sólo miraba las acciones.
drop trigger if exists activity_completions_rango_puntos on public.activity_completions;
drop function if exists public.brote_rango_puntos_sumar();

-- Lo que ya se hizo esta semana.
do $$
declare per rango_periodos%rowtype; v_tope int := (brote_liga_reglas() ->> 'tope_diario')::int;
begin
  per := brote_rango_periodo();
  insert into liga_puntos_dia (user_id, dia, puntos)
  select ac.user_id, ac.local_date, sum(ac.points_awarded)::int
    from activity_completions ac
   where ac.local_date between per.inicio and per.fin and ac.status in ('honor', 'verified')
   group by 1, 2
  on conflict (user_id, dia) do update set puntos = excluded.puntos;

  delete from rango_puntos where periodo_id = per.id;
  insert into rango_puntos (periodo_id, user_id, puntos, tier, grupo)
  select per.id, d.user_id, sum(least(d.puntos, v_tope))::int, 1,
         case when bool_or(p.account_type = 'kid' or coalesce(p.es_prueba, false)) then 0 else 1 end
    from liga_puntos_dia d join profiles p on p.id = d.user_id
   where d.dia between per.inicio and per.fin
   group by d.user_id;
end $$;

-- Se empieza de cero: en la primera semana, todo el mundo arranca en la primera
-- liga y sube jugando. Las posiciones de la liga vieja venían de grupos tan
-- chicos que los primeros cuatro subían sin hacer nada.
update public.rango_usuario set tier = 1, margen_usado = false, actualizado_at = now();

-- ── Cerrar la semana ────────────────────────────────────────────────────────

create or replace function public.brote_rangos_cerrar_periodo(p_periodo int, p_avisar boolean default true)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  per rango_periodos%rowtype; v_dias int; v_n int; v_cuando text; v_reglas jsonb := brote_liga_reglas();
  v_top int := coalesce((v_reglas ->> 'top_suben')::int, 3);
  v_min int := coalesce((v_reglas ->> 'grupo_minimo')::int, 10);
begin
  select * into per from rango_periodos where id = p_periodo for update;
  if not found or per.cerrado_at is not null then return 0; end if;
  v_dias := per.fin - per.inicio + 1;
  v_cuando := case when per.tipo = 'mes' then 'este mes' else 'esta semana' end;

  drop table if exists _liga_cierre;
  create temp table _liga_cierre on commit drop as
    with cand as (
      select rp.user_id from rango_puntos rp where rp.periodo_id = per.id
      union
      select ru.user_id from rango_usuario ru where ru.tier > 1
    ), base as (
      select c.user_id, coalesce(ru.tier, 1)::smallint as previo,
             coalesce(rp.puntos, 0) as puntos, coalesce(rp.grupo, 0) as grupo
        from cand c
        join profiles p on p.id = c.user_id
        left join rango_puntos rp on rp.periodo_id = per.id and rp.user_id = c.user_id
        left join rango_usuario ru on ru.user_id = c.user_id
    ), pos as (
      select b.*,
             case when b.grupo > 0 then row_number() over (partition by b.previo, b.grupo order by b.puntos desc, b.user_id) end::int as pos,
             case when b.grupo > 0 then count(*) over (partition by b.previo, b.grupo) else 1 end::int as tam
        from base b
    )
    select pos.*, l.nombre as liga_previa, d.nuevo, d.resultado,
           brote_liga_meta(l.puntos_mantener, v_dias) as mantener
      from pos
      join rangos l on l.tier = pos.previo
      cross join lateral brote_liga_decidir(pos.previo, pos.puntos, pos.pos, pos.tam,
                                            brote_liga_meta(l.puntos_mantener, v_dias),
                                            brote_liga_meta(l.puntos_subir, v_dias), v_top, v_min) d;

  insert into rango_historial (user_id, periodo_id, tier_previo, tier_nuevo, resultado, metricas)
  select user_id, per.id, previo, nuevo, resultado,
         jsonb_build_object('puntos', puntos, 'pos', pos, 'tam', tam, 'grupo', grupo)
    from _liga_cierre
  on conflict (user_id, periodo_id) do nothing;

  insert into rango_usuario (user_id, tier, margen_usado, periodo_id, actualizado_at)
  select user_id, nuevo, false, per.id, now() from _liga_cierre
  on conflict (user_id) do update set tier = excluded.tier, margen_usado = false,
                                      periodo_id = excluded.periodo_id, actualizado_at = now();
  get diagnostics v_n = row_count;

  if p_avisar then
    insert into notifications (user_id, type, title_es, body_es, data)
    select x.user_id, 'rango',
           case x.resultado
             when 'sube' then 'Subiste a la liga ' || rn.nombre || ' 🌱'
             when 'mantiene' then 'Seguís en la liga ' || rn.nombre
             else 'Bajaste a la liga ' || rn.nombre end,
           case x.resultado
             when 'sube' then 'Hiciste ' || x.puntos || ' puntos ' || v_cuando || '. Arranca otra semana, con metas nuevas.'
             when 'mantiene' then 'Hiciste ' || x.puntos || ' puntos ' || v_cuando || '. A sostenerlo.'
             else 'Te faltaron ' || greatest(x.mantener - x.puntos, 0) || ' puntos para seguir en ' || x.liga_previa || '. La podés recuperar la semana que viene.' end,
           jsonb_build_object('url', '/ranking', 'periodo', per.id, 'resultado', x.resultado, 'tier', x.nuevo)
      from _liga_cierre x
      join rangos rn on rn.tier = x.nuevo
     where x.resultado in ('sube', 'baja') or (x.resultado = 'mantiene' and x.puntos > 0);
  end if;

  update rango_periodos set cerrado_at = now() where id = per.id;
  return v_n;
end $$;
revoke all on function public.brote_rangos_cerrar_periodo(int, boolean) from public, anon, authenticated;

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
  delete from liga_puntos_dia where dia < brote_hoy_ba() - 60;
  return jsonb_build_object('periodos', v_n, 'personas', v_total);
end $$;
revoke all on function public.brote_rangos_cerrar() from public, anon, authenticated;

-- La liga vieja queda quieta: su cron ya está apagado (0133) y nada la lee.

-- ── Lo que ve cada persona ──────────────────────────────────────────────────

create or replace function public.mi_liga()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid(); per rango_periodos%rowtype; v_hoy date := brote_hoy_ba(); v_dias int;
  v_tier smallint; v_reglas jsonb := brote_liga_reglas(); r rango_puntos%rowtype; v_filas jsonb; v_pos int; v_tam int;
  v_hoy_pts int;
begin
  if v_uid is null then return jsonb_build_object('ok', false); end if;
  per := brote_rango_periodo();
  v_dias := per.fin - per.inicio + 1;
  v_tier := coalesce((select tier from rango_usuario where user_id = v_uid), 1);
  select * into r from rango_puntos where periodo_id = per.id and user_id = v_uid;
  select puntos into v_hoy_pts from liga_puntos_dia where user_id = v_uid and dia = v_hoy;

  if r.user_id is not null and r.grupo > 0 then
    select count(*) into v_tam from rango_puntos rp join profiles p on p.id = rp.user_id
     where rp.periodo_id = per.id and rp.tier = r.tier and rp.grupo = r.grupo;
    with g as (
      select rp.user_id, rp.puntos, p.username::text as username, p.display_name, p.avatar_url,
             p.current_rank_slug as rank_slug, p.current_division as division,
             row_number() over (order by rp.puntos desc, rp.user_id)::int as pos
        from rango_puntos rp join profiles p on p.id = rp.user_id
       where rp.periodo_id = per.id and rp.tier = r.tier and rp.grupo = r.grupo
         and (p.suspended_until is null or p.suspended_until < now() or rp.user_id = v_uid)
    )
    select jsonb_agg(jsonb_build_object('pos', g.pos, 'user_id', g.user_id, 'username', g.username,
                                        'display_name', g.display_name, 'avatar_url', g.avatar_url,
                                        'rank_slug', g.rank_slug, 'division', g.division, 'puntos', g.puntos) order by g.pos),
           max(case when g.user_id = v_uid then g.pos end)
      into v_filas, v_pos from g;
  end if;

  return jsonb_build_object(
    'ok', true,
    'periodo', jsonb_build_object('id', per.id, 'tipo', per.tipo, 'inicio', per.inicio, 'fin', per.fin, 'dias', v_dias,
                                  'quedan', per.fin - v_hoy + 1, 'proximo_tipo', brote_rango_tipo()),
    'tier', v_tier,
    'puntos', coalesce(r.puntos, 0),
    'hoy', coalesce(v_hoy_pts, 0),
    'grupo', coalesce(r.grupo, 0),
    'en_grupo', r.user_id is not null and r.grupo > 0,
    'pos', v_pos,
    'tam', coalesce(v_tam, 0),
    'filas', coalesce(v_filas, '[]'::jsonb),
    'reglas', v_reglas,
    'ligas', (select jsonb_agg(jsonb_build_object(
                 'tier', l.tier, 'slug', l.slug, 'nombre', l.nombre, 'descripcion', l.descripcion, 'color', l.color,
                 'mantener', brote_liga_meta(l.puntos_mantener, v_dias), 'subir', brote_liga_meta(l.puntos_subir, v_dias)) order by l.tier)
                from rangos l),
    'historial', coalesce((select jsonb_agg(jsonb_build_object('inicio', p.inicio, 'fin', p.fin, 'tipo', p.tipo,
                             'previo', h.tier_previo, 'nuevo', h.tier_nuevo, 'resultado', h.resultado,
                             'puntos', h.metricas -> 'puntos') order by p.inicio desc)
                             from (select * from rango_historial where user_id = v_uid) h
                             join rango_periodos p on p.id = h.periodo_id
                            where p.inicio > v_hoy - 70), '[]'::jsonb));
end $$;
revoke all on function public.mi_liga() from public, anon;
grant execute on function public.mi_liga() to authenticated;

-- Los tableros de la semana vuelven a tener a los jugadores simulados (si el
-- interruptor está prendido), igual que antes de 0133. Nunca entre amigos.
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

  with reales as (
    select rp.user_id, rp.puntos::bigint as puntos, coalesce(ru.tier, 1)::int as tier, p.username::text as username, p.display_name,
           p.avatar_url, p.current_rank_slug as nivel, p.current_division as division
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
  ), simulados as (
    select b.user_id, b.weekly_xp::bigint as puntos, null::int as tier, b.username, b.display_name,
           b.avatar_url, b.rank_slug as nivel, b.division
      from simulated_board b
     where b.weekly_xp > 0 and p_ambito in ('global', 'ciudad')
       and (p_ambito = 'global' or (v_me.city is not null and lower(b.city) = lower(v_me.city)))
  ), base as (
    select * from reales union all select * from simulados
  )
  select coalesce(jsonb_agg(jsonb_build_object('pos', x.pos, 'user_id', x.user_id, 'username', x.username,
                                               'display_name', x.display_name, 'avatar_url', x.avatar_url,
                                               'puntos', x.puntos, 'tier', x.tier, 'nivel', x.nivel, 'division', x.division) order by x.pos), '[]'::jsonb)
    into v_filas
    from (select b.*, row_number() over (order by b.puntos desc, b.user_id) as pos from base b order by b.puntos desc, b.user_id limit v_lim) x;

  select coalesce(puntos, 0) into v_mios from rango_puntos where periodo_id = per.id and user_id = v_uid;
  v_mios := coalesce(v_mios, 0);
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
  if p_ambito in ('global', 'ciudad') then
    v_pos := v_pos + (select count(*) from simulated_board b
                       where b.weekly_xp > v_mios
                         and (p_ambito = 'global' or (v_me.city is not null and lower(b.city) = lower(v_me.city))));
  end if;

  return jsonb_build_object('ok', true, 'ambito', p_ambito,
    'periodo', jsonb_build_object('tipo', per.tipo, 'inicio', per.inicio, 'fin', per.fin),
    'filas', v_filas, 'yo', jsonb_build_object('puntos', v_mios, 'pos', case when v_mios > 0 then v_pos end, 'tier', v_tier));
end $$;
revoke all on function public.ranking_periodo(text, int) from public, anon;
grant execute on function public.ranking_periodo(text, int) to authenticated;

-- ── Proyectos: sumarse es libre; crear y manejar pide liga ──────────────────

-- El cupo mira la liga en la que estás, sin adelantos: subir se gana al cierre.
create or replace function public.brote_proyecto_cupo_de(p_uid uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reglas jsonb := brote_proyectos_reglas();
  v_tier smallint; v_cupo int; v_activos int; v_min smallint;
begin
  v_tier := coalesce((select tier from rango_usuario where user_id = p_uid), 1);
  v_cupo := coalesce((v_reglas -> 'cupos' ->> v_tier::text)::int, 0);
  select count(*) into v_activos from projects p
   where p.creator_id = p_uid and p.status in ('active', 'proposed')
     and (p.event_date is null or p.event_date > now() - interval '1 day');
  select min(k::smallint) into v_min from jsonb_each_text(v_reglas -> 'cupos') e(k, v) where v::int > 0;
  return jsonb_build_object(
    'tier', v_tier, 'camino', v_tier, 'efectivo', v_tier, 'cupo', v_cupo, 'activos', v_activos,
    'libres', greatest(v_cupo - v_activos, 0), 'min_tier', v_min,
    'min_nombre', (select nombre from rangos where tier = v_min),
    'efectivo_nombre', (select nombre from rangos where tier = v_tier),
    'cupos', v_reglas -> 'cupos', 'gracia_dias', v_reglas -> 'gracia_dias',
    'adulto', coalesce((select account_type = 'adult' from profiles where id = p_uid), false));
end $$;
revoke all on function public.brote_proyecto_cupo_de(uuid) from public, anon, authenticated;

create or replace function public.create_project(
  p_title text, p_description text, p_type text, p_domain text, p_neighborhood text,
  p_location_text text, p_lat double precision, p_lng double precision,
  p_event_date timestamp with time zone, p_max_participants integer, p_image_url text,
  p_min_rank text default null, p_contact_info text default null, p_contact_kind text default null,
  p_min_rango smallint default 1)
returns uuid
language plpgsql
security definer
set search_path = public
as $fn$
declare v_uid uuid := auth.uid(); v_c jsonb; v_id uuid;
begin
  if v_uid is null then raise exception 'No autenticado'; end if;
  v_c := brote_proyecto_cupo_de(v_uid);

  if not (v_c ->> 'adulto')::boolean then
    raise exception 'Los proyectos los organizan personas adultas: son encuentros en persona, con lugar y contacto.';
  end if;
  if (v_c ->> 'cupo')::int = 0 then
    raise exception 'Podés organizar proyectos desde la liga %. Sumarte a los que ya existen es libre.', v_c ->> 'min_nombre';
  end if;
  if (v_c ->> 'libres')::int = 0 then
    raise exception 'En tu liga podés organizar % a la vez y ya tenés %. Terminá uno, pasalo o subí de liga.',
      v_c ->> 'cupo', v_c ->> 'activos';
  end if;
  if p_contact_kind is not null and p_contact_kind not in ('whatsapp', 'email', 'instagram', 'telegram', 'otro') then
    raise exception 'Tipo de contacto inválido';
  end if;

  insert into projects (creator_id, title, description, type, domain_slug, neighborhood, location_text,
                        lat, lng, event_date, max_participants, image_url, min_rango, status,
                        contact_info, contact_kind)
  values (v_uid, p_title, p_description, coalesce(p_type, 'otro'), p_domain, p_neighborhood, p_location_text,
          p_lat, p_lng, p_event_date, p_max_participants, p_image_url, 1, 'active',
          nullif(btrim(coalesce(p_contact_info, '')), ''), p_contact_kind)
  returning id into v_id;

  insert into project_participants (project_id, user_id, status)
  values (v_id, v_uid, 'organizer') on conflict do nothing;
  return v_id;
end $fn$;

-- Sumarse: cualquiera, sin importar la liga ni el rango. Sólo los chicos quedan
-- afuera, porque son encuentros en persona.
create or replace function public.join_project(p_project_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $fn$
declare v_uid uuid := auth.uid(); v_count int; p projects%rowtype; v_tipo text;
begin
  if v_uid is null then raise exception 'No autenticado'; end if;
  select coalesce(account_type::text, 'adult') into v_tipo from profiles where id = v_uid;
  if v_tipo = 'kid' then
    raise exception 'Los proyectos son encuentros en persona: con una cuenta de chico no se puede sumar. Puede hacerlo una persona adulta de tu familia.';
  end if;
  select * into p from projects where id = p_project_id;
  if not found or p.status not in ('active', 'proposed') then raise exception 'Este proyecto ya no está abierto.'; end if;
  if p.pausado_at is not null then raise exception 'Este proyecto está en pausa por ahora.'; end if;
  if p.max_participants is not null then
    select count(*) into v_count from project_participants where project_id = p_project_id and status in ('joined', 'organizer');
    if v_count >= p.max_participants then raise exception 'El proyecto está completo'; end if;
  end if;
  insert into project_participants (project_id, user_id, status) values (p_project_id, v_uid, 'joined')
    on conflict (project_id, user_id) do update set status = 'joined';
  return true;
end $fn$;

-- Lo que reparte puntos es cerrar una jornada, así que es lo que tiene tope: una
-- por proyecto por día, `jornadas_semana` por organizador en 7 días, y ninguna
-- con el proyecto en pausa. Además, en la liga los puntos cuentan con tope diario.
create or replace function public.complete_project_session(p_project_id uuid, p_title text, p_attendee_ids uuid[] default null::uuid[], p_notes text default null::text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_uid uuid := auth.uid();
  v_proj projects%rowtype;
  v_ids uuid[];
  v_n int;
  v_points int;
  v_session uuid;
  v_activity uuid;
  v_uid_each uuid;
  v_today date;
  v_tope int := coalesce((brote_proyectos_reglas() ->> 'jornadas_semana')::int, 3);
begin
  if v_uid is null then raise exception 'No autenticado'; end if;
  select * into v_proj from projects where id = p_project_id;
  if not found then return jsonb_build_object('ok', false, 'error', 'El proyecto no existe'); end if;
  if v_proj.creator_id is distinct from v_uid then
    return jsonb_build_object('ok', false, 'error', 'Solo quien organiza puede cerrar una jornada');
  end if;
  if v_proj.pausado_at is not null then
    return jsonb_build_object('ok', false, 'error', 'El proyecto está en pausa: volvé a la liga que pide, o pasale la organización a alguien.');
  end if;
  if coalesce(trim(p_title), '') = '' then
    return jsonb_build_object('ok', false, 'error', 'Poné un nombre a la jornada');
  end if;
  if exists (select 1 from project_sessions s where s.project_id = p_project_id and s.held_at > now() - interval '20 hours') then
    return jsonb_build_object('ok', false, 'error', 'Este proyecto ya tuvo una jornada hoy. Se puede cerrar una por día.');
  end if;
  if (select count(*) from project_sessions s where s.organizer_id = v_uid and s.held_at > now() - interval '7 days') >= v_tope then
    return jsonb_build_object('ok', false, 'error', format('Se pueden cerrar hasta %s jornadas por semana.', v_tope));
  end if;

  if p_attendee_ids is null or array_length(p_attendee_ids, 1) is null then
    select coalesce(array_agg(pp.user_id), '{}') into v_ids
    from project_participants pp where pp.project_id = p_project_id;
  else
    select coalesce(array_agg(pp.user_id), '{}') into v_ids
    from project_participants pp
    where pp.project_id = p_project_id and pp.user_id = any(p_attendee_ids);
  end if;

  v_n := coalesce(array_length(v_ids, 1), 0);
  if v_n = 0 then return jsonb_build_object('ok', false, 'error', 'No hay participantes para acreditar'); end if;

  -- Single universal amount. No per-project override, no turnout multiplier.
  select coalesce((value #>> '{}')::int, 120) into v_points
  from app_settings where key = 'session_points_universal';
  v_points := greatest(1, coalesce(v_points, 120));

  insert into project_sessions (project_id, organizer_id, title, notes, points_each, attendees)
  values (p_project_id, v_uid, trim(p_title), nullif(trim(coalesce(p_notes,'')), ''), v_points, v_n)
  returning id into v_session;

  insert into project_session_attendees (session_id, user_id)
  select v_session, u from unnest(v_ids) u on conflict do nothing;

  select id into v_activity from activities where slug = 'accion-grupal-proyecto' and active limit 1;
  if v_activity is null then
    insert into activities (slug, type, domain_slug, title_es, short_es, effort, impact,
                            verification, base_points, frequency, min_rank_slug, age_groups, active, sort_order)
    values ('accion-grupal-proyecto', 'catalog', 'comunidad', 'Jornada de un proyecto comunitario',
            'Participaste de una jornada organizada en tu barrio.', 'medium', 'high', 'honor',
            120, 'recurring', 'semilla', '{kid,teen,adult}', true, 900)
    returning id into v_activity;
  end if;

  v_today := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
  foreach v_uid_each in array v_ids loop
    insert into activity_completions (user_id, activity_id, activity_type, domain_slug,
                                      completed_at, local_date, points_awarded, status, note)
    values (v_uid_each, v_activity, 'catalog', 'comunidad', now(), v_today, v_points, 'honor',
            'Jornada: ' || trim(p_title));
    update profiles set total_xp = total_xp + v_points where id = v_uid_each;
    insert into notifications (user_id, type, title_es, body_es)
    values (v_uid_each, 'system', '¡Jornada acreditada! 🌱',
            format('Sumaste %s puntos por "%s".', v_points, trim(p_title)));
  end loop;

  return jsonb_build_object('ok', true, 'session_id', v_session, 'attendees', v_n, 'points_each', v_points);
end $function$;

-- Lo que se pide para pasarle un proyecto a alguien y los avisos de la noche
-- hablan de ligas. Las reglas no cambian: nada se corta de golpe, 28 días de
-- gracia, pausa, y vuelve solo.
create or replace function public.brote_proyectos_revisar()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reglas jsonb := brote_proyectos_reglas();
  v_gracia int := coalesce((v_reglas ->> 'gracia_dias')::int, 28);
  v_hoy date := brote_hoy_ba();
  r record; v_cupo int; v_avisos int := 0; v_pausas int := 0; v_vueltas int := 0;
begin
  for r in
    select p.id, p.title, p.creator_id, p.event_date, p.pausado_at, p.organizador_bajo_desde, c.cupo,
           row_number() over (partition by p.creator_id
                              order by (p.event_date is null), p.event_date, p.created_at) as n
      from projects p
      join (select o.creator_id, (brote_proyecto_cupo_de(o.creator_id) ->> 'cupo')::int as cupo
              from (select distinct creator_id from projects
                     where status in ('active', 'proposed') and creator_id is not null) o) c
        on c.creator_id = p.creator_id
     where p.status in ('active', 'proposed') and p.creator_id is not null
       and (p.event_date is null or p.event_date > now() - interval '1 day')
  loop
    v_cupo := coalesce(r.cupo, 0);

    if r.n <= v_cupo then
      if r.organizador_bajo_desde is not null or r.pausado_at is not null then
        update projects set organizador_bajo_desde = null, pausado_at = null, updated_at = now() where id = r.id;
        if r.pausado_at is not null then
          v_vueltas := v_vueltas + 1;
          insert into notifications (user_id, type, title_es, body_es, data)
          select pp.user_id, 'project', 'Volvió «' || r.title || '»', 'El proyecto está abierto de nuevo.',
                 jsonb_build_object('url', '/proyectos/' || r.id)
            from project_participants pp where pp.project_id = r.id;
        end if;
      end if;

    elsif r.organizador_bajo_desde is null then
      update projects set organizador_bajo_desde = v_hoy, updated_at = now() where id = r.id;
      v_avisos := v_avisos + 1;
      insert into notifications (user_id, type, title_es, body_es, data)
      values (r.creator_id, 'project', 'Tu liga ya no alcanza para «' || r.title || '»',
              'El proyecto sigue en pie y nadie pierde su lugar. Tenés ' || v_gracia || ' días para volver a la liga o pasarle la organización a alguien.',
              jsonb_build_object('url', '/proyectos/' || r.id));

    elsif r.pausado_at is null and r.organizador_bajo_desde <= v_hoy - v_gracia
          and (r.event_date is null or r.event_date > now() + interval '14 days') then
      update projects set pausado_at = now(), updated_at = now() where id = r.id;
      v_pausas := v_pausas + 1;
      insert into notifications (user_id, type, title_es, body_es, data)
      select pp.user_id, 'project', '«' || r.title || '» quedó en pausa',
             case when pp.user_id = r.creator_id
                  then 'Vuelve solo en cuanto recuperes la liga, o pasale la organización a alguien.'
                  else 'Quien lo organiza no sostuvo su liga. Vuelve cuando la recupere; tu lugar sigue siendo tuyo.' end,
             jsonb_build_object('url', '/proyectos/' || r.id)
        from project_participants pp where pp.project_id = r.id;
    end if;
  end loop;
  return jsonb_build_object('avisos', v_avisos, 'pausas', v_pausas, 'vueltas', v_vueltas);
end $$;
revoke all on function public.brote_proyectos_revisar() from public, anon, authenticated;

-- Todos arrancan en la primera liga, y lo más rápido que se llega a Referente son
-- tres cierres: 9, 16 y 23 de noviembre. Antes de eso nadie podría cumplir.
select cron.schedule('brote-proyectos-revisar', '30 3 * * *',
  $$select public.brote_proyectos_revisar() where public.brote_hoy_ba() >= date '2026-11-23'$$);

-- Lo que ya pedía un mínimo deja de pedirlo.
update public.projects set min_rango = 1, min_rank_slug = 'semilla' where min_rango > 1 or min_rank_slug is distinct from 'semilla';

update public.app_settings
   set value = value || '{"jornadas_semana": 3}'::jsonb,
       description = 'Cuántos proyectos puede organizar a la vez cada liga, días de gracia al bajar y jornadas por semana. Se edita en /panel/proyectos.'
 where key = 'proyectos_reglas' and not (value ? 'jornadas_semana');

create or replace function public.admin_proyectos_reglas_guardar(p_pass text, p_reglas jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_gracia int; v_jornadas int; v_cupos jsonb := p_reglas -> 'cupos';
begin
  if not admin_check(p_pass) then return jsonb_build_object('ok', false, 'error', 'Sin acceso'); end if;
  v_gracia := (p_reglas ->> 'gracia_dias')::int;
  v_jornadas := coalesce((p_reglas ->> 'jornadas_semana')::int, (brote_proyectos_reglas() ->> 'jornadas_semana')::int, 3);
  if v_gracia is null or v_gracia not between 0 and 180 then
    return jsonb_build_object('ok', false, 'error', 'La gracia va de 0 a 180 días.');
  end if;
  if v_jornadas not between 1 and 21 then
    return jsonb_build_object('ok', false, 'error', 'Las jornadas por semana van de 1 a 21.');
  end if;
  if jsonb_typeof(v_cupos) <> 'object' or exists (
       select 1 from generate_series(1, 7) t
        where coalesce((v_cupos ->> t::text)::int, -1) not between 0 and 50) then
    return jsonb_build_object('ok', false, 'error', 'Cada liga necesita un cupo entre 0 y 50.');
  end if;
  insert into app_settings (key, value, description)
  values ('proyectos_reglas', jsonb_build_object('cupos', v_cupos, 'gracia_dias', v_gracia, 'jornadas_semana', v_jornadas),
          'Cuántos proyectos puede organizar a la vez cada liga, días de gracia al bajar y jornadas por semana. Se edita en /panel/proyectos.')
  on conflict (key) do update set value = excluded.value, updated_at = now();
  return jsonb_build_object('ok', true);
exception when invalid_text_representation then
  return jsonb_build_object('ok', false, 'error', 'Los cupos tienen que ser números enteros.');
end $$;

-- ── El panel ────────────────────────────────────────────────────────────────

create or replace function public.admin_ligas(p_pass text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare per rango_periodos%rowtype;
begin
  if not admin_check(p_pass) then return jsonb_build_object('ok', false, 'error', 'Sin acceso'); end if;
  per := brote_rango_periodo();
  return jsonb_build_object('ok', true,
    'tipo', brote_rango_tipo(),
    'reglas', brote_liga_reglas(),
    'periodo', jsonb_build_object('id', per.id, 'tipo', per.tipo, 'inicio', per.inicio, 'fin', per.fin),
    'ligas', (select jsonb_agg(jsonb_build_object('tier', tier, 'slug', slug, 'nombre', nombre, 'descripcion', descripcion,
                                                  'color', color, 'mantener', puntos_mantener, 'subir', puntos_subir) order by tier) from rangos),
    'distribucion', (select jsonb_object_agg(r.tier, (select count(*) from rango_usuario ru join profiles p on p.id = ru.user_id
                                                       where ru.tier = r.tier and not coalesce(p.es_prueba, false))
                                                     + case when r.tier = 1 then (select count(*) from profiles p
                                                         where not coalesce(p.es_prueba, false)
                                                           and not exists (select 1 from rango_usuario ru2 where ru2.user_id = p.id)) else 0 end)
                       from rangos r),
    'cierres', coalesce((select jsonb_agg(x order by x.inicio desc) from (
        select p.inicio, p.fin, p.tipo,
               count(*) filter (where h.resultado = 'sube') as suben,
               count(*) filter (where h.resultado in ('mantiene', 'margen')) as mantienen,
               count(*) filter (where h.resultado = 'baja') as bajan,
               coalesce(round(avg((h.metricas ->> 'puntos')::numeric) filter (where (h.metricas ->> 'puntos')::numeric > 0)), 0) as promedio
          from rango_periodos p left join rango_historial h on h.periodo_id = p.id
         where p.cerrado_at is not null
         group by p.id order by p.inicio desc limit 8) x), '[]'::jsonb),
    'activos_periodo', (select count(*) from rango_puntos where periodo_id = per.id and puntos > 0));
end $$;
revoke all on function public.admin_ligas(text) from public, anon;
grant execute on function public.admin_ligas(text) to authenticated;

create or replace function public.admin_liga_guardar(
  p_pass text, p_tier smallint, p_nombre text, p_descripcion text, p_mantener int, p_subir int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not admin_check(p_pass) then return jsonb_build_object('ok', false, 'error', 'Sin acceso'); end if;
  if length(btrim(coalesce(p_nombre, ''))) not between 3 and 30 or length(btrim(coalesce(p_descripcion, ''))) not between 10 and 160 then
    return jsonb_build_object('ok', false, 'error', 'Nombre (3 a 30 letras) y descripción (10 a 160).');
  end if;
  if coalesce(p_mantener, -1) not between 0 and 20000 then
    return jsonb_build_object('ok', false, 'error', 'Los puntos para mantenerse van de 0 a 20.000.');
  end if;
  if p_tier < 7 and (p_subir is null or p_subir <= p_mantener or p_subir > 20000) then
    return jsonb_build_object('ok', false, 'error', 'Los puntos para subir tienen que ser más que los de mantenerse.');
  end if;
  update rangos set nombre = btrim(p_nombre), descripcion = btrim(p_descripcion),
                    puntos_mantener = case when p_tier = 1 then 0 else p_mantener end,
                    puntos_subir = case when p_tier = 7 then null else p_subir end
   where tier = p_tier;
  return jsonb_build_object('ok', found);
end $$;
revoke all on function public.admin_liga_guardar(text, smallint, text, text, int, int) from public, anon;
grant execute on function public.admin_liga_guardar(text, smallint, text, text, int, int) to authenticated;

create or replace function public.admin_liga_reglas_guardar(p_pass text, p_tope int, p_tamano int, p_top int, p_minimo int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not admin_check(p_pass) then return jsonb_build_object('ok', false, 'error', 'Sin acceso'); end if;
  if coalesce(p_tope, 0) not between 50 and 5000 then return jsonb_build_object('ok', false, 'error', 'El tope por día va de 50 a 5.000.'); end if;
  if coalesce(p_tamano, 0) not between 5 and 100 then return jsonb_build_object('ok', false, 'error', 'El grupo va de 5 a 100 personas.'); end if;
  if coalesce(p_top, -1) not between 0 and 10 then return jsonb_build_object('ok', false, 'error', 'Los primeros que suben van de 0 a 10.'); end if;
  if coalesce(p_minimo, 0) not between 2 and 100 then return jsonb_build_object('ok', false, 'error', 'El tamaño mínimo va de 2 a 100.'); end if;
  insert into app_settings (key, value, description)
  values ('liga_reglas', jsonb_build_object('tope_diario', p_tope, 'tamano_grupo', p_tamano, 'top_suben', p_top, 'grupo_minimo', p_minimo),
          'Reglas de las ligas: puntos que cuentan por día, tamaño de cada grupo, cuántos primeros suben y desde qué tamaño de grupo. Se editan en /panel/ligas.')
  on conflict (key) do update set value = excluded.value, updated_at = now();
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.admin_liga_reglas_guardar(text, int, int, int, int) from public, anon;
grant execute on function public.admin_liga_reglas_guardar(text, int, int, int, int) to authenticated;

-- Poner a alguien en una liga a mano. Sirve para arrancar: la primera persona que
-- organice no tiene que esperar tres semanas si el dueño ya la conoce.
create or replace function public.admin_persona_liga(p_pass text, p_user uuid, p_tier smallint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_per int; v_grupo int; v_n int; v_tam int;
begin
  if not admin_check(p_pass) then return jsonb_build_object('ok', false, 'error', 'Sin acceso'); end if;
  if p_tier is null or p_tier not between 1 and 7 then return jsonb_build_object('ok', false, 'error', 'Liga inválida'); end if;
  if not exists (select 1 from profiles where id = p_user) then return jsonb_build_object('ok', false, 'error', 'No existe'); end if;
  insert into rango_usuario (user_id, tier, margen_usado, actualizado_at) values (p_user, p_tier, false, now())
  on conflict (user_id) do update set tier = excluded.tier, actualizado_at = now();
  -- Si ya jugó esta semana, sigue jugando en un grupo de la liga nueva.
  v_per := (brote_rango_periodo()).id;
  if exists (select 1 from rango_puntos where periodo_id = v_per and user_id = p_user and grupo > 0) then
    v_tam := greatest(coalesce((brote_liga_reglas() ->> 'tamano_grupo')::int, 30), 2);
    select count(*) into v_n from rango_puntos where periodo_id = v_per and tier = p_tier and grupo > 0;
    v_grupo := v_n / v_tam + 1;
    update rango_puntos set tier = p_tier, grupo = v_grupo where periodo_id = v_per and user_id = p_user;
  else
    update rango_puntos set tier = p_tier where periodo_id = v_per and user_id = p_user;
  end if;
  return jsonb_build_object('ok', true, 'nombre', (select nombre from rangos where tier = p_tier));
end $$;
revoke all on function public.admin_persona_liga(text, uuid, smallint) from public, anon;
grant execute on function public.admin_persona_liga(text, uuid, smallint) to authenticated;

-- Configurar una cuenta de prueba: además del rango, la liga.
drop function if exists public.admin_cuenta_prueba(text, text, text, int, text);
create or replace function public.admin_cuenta_prueba(
  p_pass text, p_email text, p_tipo text, p_tier int, p_negocio text, p_liga smallint default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_uid uuid; v_email text := lower(trim(coalesce(p_email, ''))); v_xp bigint; v_rank jsonb;
  v_prof profiles%rowtype; v_biz uuid; v_dom jsonb; v_comp bigint; v_nombre text;
begin
  if not admin_check(p_pass) then
    return jsonb_build_object('ok', false, 'error', 'Sin acceso');
  end if;
  if p_tipo not in ('kid', 'teen', 'adult') then
    return jsonb_build_object('ok', false, 'error', 'Tipo de cuenta inválido');
  end if;
  if p_tier is null or p_tier not between 1 and 11 then
    return jsonb_build_object('ok', false, 'error', 'El rango va de 1 a 11');
  end if;
  if p_liga is not null and p_liga not between 1 and 7 then
    return jsonb_build_object('ok', false, 'error', 'La liga va de 1 a 7');
  end if;
  if coalesce(p_negocio, 'ninguno') not in ('ninguno', 'vender', 'mejorar', 'ambos') then
    return jsonb_build_object('ok', false, 'error', 'Negocio inválido');
  end if;
  if p_negocio in ('vender', 'mejorar', 'ambos') and p_tipo <> 'adult' then
    return jsonb_build_object('ok', false, 'error', 'Sólo una cuenta adulta puede tener una tienda o una empresa');
  end if;

  select id into v_uid from auth.users where lower(email) = v_email;
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'No hay ninguna cuenta con ese mail. Creala primero entrando a la app con ese mail.');
  end if;
  select * into v_prof from profiles where id = v_uid;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'La cuenta todavía no tiene perfil: entrá una vez con ese mail.');
  end if;
  if position('+' in v_email) = 0 and not v_prof.es_prueba then
    return jsonb_build_object('ok', false, 'error',
      'Por seguridad sólo se configuran mails con un "+" (por ejemplo tucorreo+chico@gmail.com). Así nunca se toca una cuenta real.');
  end if;

  select xp_threshold into v_xp from ranks where tier = p_tier;
  v_xp := coalesce(v_xp, 0) + 1;
  v_rank := brote_get_rank(v_xp);
  select coalesce(jsonb_object_agg(domain_slug, points), '{}'::jsonb) into v_dom from user_domain_points where user_id = v_uid;
  select count(*) into v_comp from activity_completions where user_id = v_uid and status in ('honor', 'verified');

  perform set_config('brote.sin_liga', '1', true);
  update profiles
     set account_type = p_tipo::account_type,
         onboarding_completed = true,
         display_name = coalesce(nullif(display_name, ''),
                                 'Prueba ' || case p_tipo when 'kid' then 'chico' when 'teen' then 'adolescente' else 'adulto' end),
         total_xp = v_xp,
         current_rank_slug = v_rank->>'slug',
         current_division = coalesce((v_rank->>'division')::int, 1),
         mundo_state = brote_compute_mundo(v_xp, coalesce(current_streak, 0), v_dom, v_comp),
         profile_visibility = 'private',
         es_prueba = true
   where id = v_uid;
  perform set_config('brote.sin_liga', '', true);

  if p_liga is not null then
    insert into rango_usuario (user_id, tier, margen_usado, actualizado_at) values (v_uid, p_liga, false, now())
    on conflict (user_id) do update set tier = excluded.tier, actualizado_at = now();
  end if;

  if p_negocio in ('vender', 'mejorar', 'ambos') then
    select b.id into v_biz from business_members m join businesses b on b.id = m.business_id
     where m.user_id = v_uid and m.role = 'owner' order by b.created_at limit 1;
    v_nombre := case p_negocio when 'vender' then '(PRUEBA) Tienda' when 'mejorar' then '(PRUEBA) Empresa' else '(PRUEBA) Tienda y empresa' end;
    if v_biz is null then
      insert into businesses (slug, nombre_comercial, rubro, tamano, provincia, modelo, objetivo, status, tier,
                              intereses, created_by, alta_paso, activa_at)
      values (brote_slugify(v_nombre || ' ' || substr(v_uid::text, 1, 6)), v_nombre, 'comercio-minorista', '2-10',
              'Buenos Aires',
              case p_negocio when 'mejorar' then 'empresa' else 'vendedor' end,
              p_negocio, 'approved', 'e1',
              case p_negocio when 'vender' then '{mercado}'::text[] when 'mejorar' then '{mejora}'::text[] else '{mejora,mercado}'::text[] end,
              v_uid, 5, now())
      returning id into v_biz;
      insert into business_members (business_id, user_id, role) values (v_biz, v_uid, 'owner');
      insert into improvement_dossiers (business_id) values (v_biz) on conflict (business_id) do nothing;
    else
      update businesses set objetivo = p_negocio, status = 'approved', activa_at = coalesce(activa_at, now()), updated_at = now() where id = v_biz;
    end if;
  end if;

  return jsonb_build_object('ok', true, 'usuario', v_prof.username, 'xp', v_xp, 'rango', v_rank->>'slug', 'negocio', v_biz);
end $fn$;
revoke all on function public.admin_cuenta_prueba(text, text, text, int, text, smallint) from public, anon;
grant execute on function public.admin_cuenta_prueba(text, text, text, int, text, smallint) to authenticated;

-- El perfil público muestra la liga de la semana (antes, la de `user_leagues`).
do $mig$
declare v_src text; v_args text; v_new text;
begin
  select p.prosrc, pg_get_function_arguments(p.oid) into v_src, v_args
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'get_public_profile_v2';
  if v_src is null or v_src not like '%brote_league_name%' then return; end if;
  v_new := regexp_replace(v_src,
    $re$'league', \(select jsonb_build_object\('name', brote_league_name\(ul\.tier\), 'tier', ul\.tier,.*?from user_leagues ul where ul\.user_id = p\.id limit 1\)$re$,
    $rep$'league', (select jsonb_build_object('name', r.nombre, 'tier', r.tier, 'group_index', 1, 'last_result', null) from rangos r where r.tier = coalesce((select ru.tier from rango_usuario ru where ru.user_id = p.id), 1))$rep$);
  if v_new = v_src then raise exception 'El bloque de la liga no coincide: revisar get_public_profile_v2'; end if;
  execute format('create or replace function get_public_profile_v2(%s) returns jsonb '
                 'language plpgsql stable security definer set search_path = public as %L', v_args, v_new);
end
$mig$;
revoke all on function public.get_public_profile_v2(text) from public, anon;
grant execute on function public.get_public_profile_v2(text) to authenticated;

-- ── "Rango" vuelve a ser el de los puntos totales ───────────────────────────
drop trigger if exists notifications_nivel_texto on public.notifications;
drop function if exists public.brote_aviso_nivel_texto();
