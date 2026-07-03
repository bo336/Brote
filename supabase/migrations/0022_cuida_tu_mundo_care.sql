-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0022 — In-world interactions (PLAN F8.7 + care touches).
-- Mirrors live migrations 0013_cuida_tu_mundo and 0014_care_world.
-- ════════════════════════════════════════════════════════════════════════════

-- "Regá tu mundo": watering daily action triggered from inside the 3D world.
insert into activities (slug, type, domain_slug, title_es, short_es, effort, impact, verification, base_points, frequency, icon, impact_equivalency_es, active, sort_order)
values ('cuida-tu-mundo', 'daily', 'plantas', 'Regá tu mundo', 'Un mimo diario a tu mundo.', 'easy', 'low', 'honor', 50, 'daily', 'plantas', 'Tu mundo crece con vos', true, 0)
on conflict (slug) do nothing;

-- Care touches: tapping trees/bushes grows the world WITHOUT points (5/day).
alter table profiles add column if not exists bonus_growth int not null default 0;
alter table profiles add column if not exists care jsonb not null default '{}';

create or replace function brote_mundo_for(p_uid uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_xp bigint; v_streak int; v_count bigint; v_bonus int;
begin
  select total_xp, current_streak, bonus_growth into v_xp, v_streak, v_bonus from profiles where id = p_uid;
  select count(*) into v_count from activity_completions where user_id = p_uid and status in ('honor','verified');
  return brote_compute_mundo(coalesce(v_xp,0), coalesce(v_streak,0), brote_domain_points_json(p_uid),
                             coalesce(v_count,0) + coalesce(v_bonus,0));
end $$;
revoke execute on function brote_mundo_for(uuid) from public, anon, authenticated;

create or replace function care_world()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid(); v_prof profiles%rowtype; v_local date; v_day text; v_taps int;
  v_mundo jsonb; v_granted boolean := false;
begin
  if v_uid is null then raise exception 'No autenticado'; end if;
  select * into v_prof from profiles where id = v_uid for update;
  v_local := (now() at time zone v_prof.timezone)::date;
  v_day := coalesce(v_prof.care->>'day', '');
  v_taps := case when v_day = v_local::text then coalesce((v_prof.care->>'taps')::int, 0) else 0 end;
  if v_taps < 5 then
    v_taps := v_taps + 1;
    v_granted := true;
    update profiles set bonus_growth = bonus_growth + 1,
      care = jsonb_build_object('day', v_local::text, 'taps', v_taps)
      where id = v_uid;
  end if;
  v_mundo := brote_mundo_for(v_uid);
  update profiles set mundo_state = v_mundo where id = v_uid;
  return jsonb_build_object('granted', v_granted, 'taps_today', v_taps, 'mundo', v_mundo);
end $$;
revoke execute on function care_world() from public, anon;
grant execute on function care_world() to authenticated;

-- NOTE: complete_activity was also recreated live (0014) to fold bonus_growth
-- into the world-progress math (v_comp_total + bonus_growth). See live schema;
-- the authoritative body ships in the next consolidated repo mirror.
