-- ============================================================================
-- MUNDO — las RPC de jugar: bitácora, tareas del día, visitas y el contador
-- colectivo.
--
-- **Toda semilla se entrega por `brote_grant_semillas`**, que escribe en
-- `semilla_ledger`. No hay una segunda vía de moneda: si el mundo pudiera
-- sumar semillas por su cuenta, la economía dejaría de ser auditable
-- (15-DATA-MODEL.md §4).
--
-- Y al revés: **el mundo no entrega XP jamás**. El XP sale sólo de acciones
-- reales verificadas en la app. `lib/world/__tests__/no-xp.test.ts` vigila el
-- lado del cliente; acá no hay una sola escritura a nada de XP.
-- ============================================================================

-- Los montos, de `lib/world/config.ts` (SEMILLAS / DAILY_CAPS). Repetidos acá
-- porque el servidor decide, no el cliente.
create or replace function public.world_semillas_for(p_kind text)
returns int language sql immutable as $fn$
  select case p_kind
    when 'chore'     then 5
    when 'chore_set' then 15   -- las tres del día completas
    when 'forage'    then 3    -- entre 2 y 4; el promedio, sin azar del cliente
    when 'event'     then 35   -- entre 25 y 50
    when 'census'    then 5    -- primer avistaje de una especie, una sola vez
    when 'cache'     then 10
    else 0 end;
$fn$;

-- --------------------------------------------------------------- Bitácora
-- Registrar una especie. Paga UNA vez en la vida por especie: la bitácora
-- premia descubrir, no volver a mirar.
create or replace function public.world_log_species(p_slug text, p_region text, p_tod text)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  v_uid uuid := auth.uid();
  v_tier int;
  v_min int;
  v_first boolean := false;
  v_balance int;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  v_tier := world_tier_of(v_uid);

  select min_tier into v_min from world_species where slug = p_slug and active;
  if v_min is null then
    return jsonb_build_object('ok', false, 'reason', 'unknown_species');
  end if;
  if v_min > v_tier then
    return jsonb_build_object('ok', false, 'reason', 'above_tier');
  end if;

  insert into public.world_journal (user_id, species_slug, region, time_of_day, count)
  values (v_uid, p_slug, p_region, p_tod, 1)
  on conflict (user_id, species_slug) do update
    set count = world_journal.count + 1
  -- `xmax = 0` distingue el INSERT del UPDATE en un upsert. Se castea a texto
  -- porque `xid` no compara contra un entero en todas las versiones.
  returning (xmax::text::bigint = 0) into v_first;

  if v_first then
    v_balance := public.brote_grant_semillas(
      v_uid, world_semillas_for('census'), 'mundo:censo', p_slug,
      'Primer avistaje en la bitácora');
  else
    select coalesce(semillas, 0) into v_balance from profiles where id = v_uid;
  end if;

  return jsonb_build_object('ok', true, 'first', v_first, 'semillas', v_balance);
end $fn$;

-- ------------------------------------------------------- Tareas del día
-- Tres tareas, ocho recolecciones, un evento. Los topes los pone el servidor;
-- el cliente sólo los pre-chequea para no ofrecer un botón que no va a andar.
create or replace function public.world_daily_chore(p_kind text)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  v_uid uuid := auth.uid();
  v_today date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
  v_row public.world_daily;
  v_award int := 0;
  v_balance int;
  v_set boolean := false;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if p_kind not in ('chore', 'forage', 'event') then
    return jsonb_build_object('ok', false, 'reason', 'bad_kind');
  end if;

  insert into public.world_daily (user_id, local_date)
  values (v_uid, v_today)
  on conflict (user_id, local_date) do nothing;

  select * into v_row from public.world_daily
   where user_id = v_uid and local_date = v_today for update;

  if p_kind = 'chore' then
    if v_row.chores_done >= 3 then
      return jsonb_build_object('ok', false, 'reason', 'cap_reached');
    end if;
    v_row.chores_done := v_row.chores_done + 1;
    v_award := world_semillas_for('chore');
    -- La tercera paga también el bono del set.
    if v_row.chores_done = 3 then
      v_award := v_award + world_semillas_for('chore_set');
      v_set := true;
    end if;
  elsif p_kind = 'forage' then
    if v_row.forage_done >= 8 then
      return jsonb_build_object('ok', false, 'reason', 'cap_reached');
    end if;
    v_row.forage_done := v_row.forage_done + 1;
    v_award := world_semillas_for('forage');
  else
    if v_row.event_done then
      return jsonb_build_object('ok', false, 'reason', 'cap_reached');
    end if;
    v_row.event_done := true;
    v_award := world_semillas_for('event');
  end if;

  update public.world_daily
     set chores_done      = v_row.chores_done,
         forage_done      = v_row.forage_done,
         event_done       = v_row.event_done,
         semillas_awarded = v_row.semillas_awarded + v_award
   where user_id = v_uid and local_date = v_today;

  v_balance := public.brote_grant_semillas(
    v_uid, v_award, 'mundo:' || p_kind, v_today::text,
    case p_kind when 'chore' then 'Tarea del día en la isla'
                when 'forage' then 'Recolección en la isla'
                else 'Evento de la isla' end);

  return jsonb_build_object(
    'ok', true, 'semillas', v_balance, 'awarded', v_award, 'choreSet', v_set,
    'remaining', jsonb_build_object(
      'chores', 3 - v_row.chores_done,
      'forage', 8 - v_row.forage_done,
      'events', case when v_row.event_done then 0 else 1 end));
end $fn$;

-- ---------------------------------------------------------------- Visitar
-- Devuelve SÓLO nivel, semilla, paleta, placements, pip_style y nombre. Sin
-- impacto, sin bitácora, sin semillas, sin ajustes. La isla de alguien se
-- puede mirar; su vida no.
create or replace function public.world_snapshot_for(p_username text)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare
  v_me uuid := auth.uid();
  v_them uuid;
  v_vis text;
begin
  if v_me is null then raise exception 'not authenticated'; end if;

  select id, coalesce(profile_visibility, 'public') into v_them, v_vis
    from profiles where username = p_username;
  if v_them is null then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  -- Un bloqueo corta en las dos direcciones; un silencio, sólo para quien lo
  -- puso. Ninguno de los dos devuelve un motivo distinto de "no está": decir
  -- "te bloquearon" sería contarle a alguien algo que no le corresponde.
  if exists (select 1 from user_blocks b
              where (b.blocker_id = v_them and b.blocked_id = v_me)
                 or (b.blocker_id = v_me and b.blocked_id = v_them))
     or exists (select 1 from user_mutes m where m.muter_id = v_me and m.muted_id = v_them)
  then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if v_vis <> 'public' and v_them <> v_me then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  return coalesce((
    select jsonb_build_object(
      'ok', true,
      'tier',        greatest(1, least(11, coalesce((p.mundo_state->>'rankTier')::int, 1))),
      'seed',        w.seed,
      'palette',     coalesce(p.mundo_state->>'palette', 'default'),
      'worldIndex',  coalesce((p.mundo_state->>'worldIndex')::int, 1),
      'pipStyle',    coalesce(p.pip_style, '{}'::jsonb),
      'displayName', p.display_name,
      'placements',  coalesce((select jsonb_agg(jsonb_build_object(
                                 'prop_slug', pl.prop_slug, 'region', pl.region,
                                 'x', pl.x, 'z', pl.z, 'rot_y', pl.rot_y, 'variant', pl.variant))
                                 from world_placements pl where pl.user_id = v_them), '[]'::jsonb))
      from profiles p join user_world w on w.user_id = p.id
     where p.id = v_them
  ), jsonb_build_object('ok', false, 'reason', 'no_world'));
end $fn$;

-- ------------------------------------------------------ Contador colectivo
-- Un agregado de toda la comunidad, refrescado como mucho una vez por hora.
-- Vive en su propia tabla porque es caché, no ajuste.
create table if not exists public.world_collective (
  id           smallint primary key default 1 check (id = 1),
  water_l      numeric  not null default 0,
  co2_kg       numeric  not null default 0,
  waste_kg     numeric  not null default 0,
  energy_kwh   numeric  not null default 0,
  people       integer  not null default 0,
  refreshed_at timestamptz not null default 'epoch'
);
insert into public.world_collective (id) values (1) on conflict (id) do nothing;
alter table public.world_collective enable row level security;
-- Sin policies: se lee sólo por la RPC de abajo.

create or replace function public.world_collective_impact()
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_row public.world_collective;
begin
  select * into v_row from public.world_collective where id = 1;

  if v_row.refreshed_at < now() - interval '1 hour' then
    update public.world_collective c
       set water_l = agg.water_l, co2_kg = agg.co2_kg, waste_kg = agg.waste_kg,
           energy_kwh = agg.energy_kwh, people = agg.people, refreshed_at = now()
      from (
        select coalesce(sum(a.impact_water_l), 0)    as water_l,
               coalesce(sum(a.impact_co2_kg), 0)     as co2_kg,
               coalesce(sum(a.impact_waste_kg), 0)   as waste_kg,
               coalesce(sum(a.impact_energy_kwh), 0) as energy_kwh,
               count(distinct ac.user_id)            as people
          from activity_completions ac
          join activities a on a.id = ac.activity_id
         where ac.status in ('honor', 'verified')
      ) agg
     where c.id = 1
    returning c.* into v_row;
  end if;

  return jsonb_build_object(
    'water_l', v_row.water_l, 'co2_kg', v_row.co2_kg, 'waste_kg', v_row.waste_kg,
    'energy_kwh', v_row.energy_kwh, 'people', v_row.people,
    'refreshed_at', v_row.refreshed_at);
end $fn$;

-- ------------------------------------------------------------- Permisos
revoke all on function public.world_semillas_for(text)                    from public, anon;
revoke all on function public.world_log_species(text, text, text)         from public, anon;
revoke all on function public.world_daily_chore(text)                     from public, anon;
revoke all on function public.world_snapshot_for(text)                    from public, anon;
revoke all on function public.world_collective_impact()                   from public, anon;

grant execute on function public.world_log_species(text, text, text)      to authenticated;
grant execute on function public.world_daily_chore(text)                  to authenticated;
grant execute on function public.world_snapshot_for(text)                 to authenticated;
grant execute on function public.world_collective_impact()                to authenticated;
