-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0018 — F1 block (IMPROVEMENT_PLAN): challenge progress + trust model
-- + food reframe + city leaderboard + MUNDO INFINITO.
-- Mirrors live migrations 0007_challenges_trust_reframe, 0008_city_leaderboard
-- and 0009_mundo_infinito already applied to the São Paulo project
-- (swdwulouasdnyorfhrjt). Keep this file as the single source of truth.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1) Trust model: retire photo verification (infra stays dormant) ─────────
update activities set verification = 'honor' where verification = 'photo_ai';

-- ── 2) Food reframe: seasonal/local/artisanal instead of meat-reduction ─────
update activities set title_es = 'Cociná hoy con productos de estación', short_es = 'Local y de temporada.', impact_equivalency_es = 'Menos food-miles y emisiones' where slug = 'come-una-comida-sin-carne-hoy';
update activities set title_es = 'Elegí un producto artesanal o de productor local', short_es = 'Comercio justo y cercano.', impact_equivalency_es = 'Apoyás producción local con menos huella' where slug = 'reduci-los-lacteos-hoy';
update activities set title_es = 'Hacé una comida 100% de estación cada semana', short_es = 'Cocina de temporada.', impact_equivalency_es = 'Menos food-miles y emisiones' where slug = 'hace-un-lunes-sin-carne-cada-semana';
update activities set title_es = 'Semana de compra local: feria, almacén o productor', short_es = 'Comprá cerca, comé mejor.', impact_equivalency_es = 'Apoyás la economía local y bajás emisiones' where slug = 'pasa-una-semana-100-a-base-de-plantas';
update challenges set title_es = 'Cocina de estación' where title_es = 'Plato a base de plantas';

-- ── 3) City leaderboard (cities replace neighborhoods in the product) ───────
create index if not exists idx_profiles_city on profiles (lower(city));

create or replace function city_leaderboard(p_city text, p_limit int default 50)
returns table(pos bigint, user_id uuid, username text, display_name text, avatar_url text,
              neighborhood text, total_xp bigint, rank_slug text, division int, title_es text)
language sql stable security definer set search_path = public as $$
  select row_number() over (order by p.total_xp desc), p.id, p.username::text, p.display_name, p.avatar_url,
         p.city, p.total_xp, p.current_rank_slug, p.current_division, t.name_es
  from profiles p left join titles t on t.id = p.equipped_title_id
  where p.city is not null and lower(p.city) = lower(p_city)
  order by p.total_xp desc limit p_limit;
$$;
revoke execute on function city_leaderboard(text, int) from public;
grant execute on function city_leaderboard(text, int) to anon, authenticated;

-- ── 4) Mundo Infinito: world progression from lifetime completions ──────────
create or replace function brote_world_goal(p_index int)
returns int language sql immutable as $$
  select round(40 * power(1.55, greatest(0, p_index - 1)))::int
$$;

create or replace function brote_world_progress(p_completions bigint)
returns jsonb language plpgsql immutable as $$
declare v_n bigint := greatest(0, coalesce(p_completions, 0)); v_idx int := 1; v_goal int;
begin
  loop
    v_goal := brote_world_goal(v_idx);
    exit when v_n < v_goal;
    v_n := v_n - v_goal; v_idx := v_idx + 1;
  end loop;
  return jsonb_build_object('worldIndex', v_idx, 'worldGrowth', v_n, 'worldGoal', v_goal);
end $$;

drop function if exists brote_compute_mundo(bigint, int, jsonb);
create or replace function brote_compute_mundo(p_xp bigint, p_streak int, p_domain_points jsonb, p_completions bigint default 0)
returns jsonb language plpgsql stable set search_path = public as $$
declare
  v_tier int; v_elements text[] := '{}'; v_live numeric; v_dom text := null; v_best numeric := 0;
  v_palette text; v_pip text; v_cosmetics text[] := '{}'; k text; v numeric;
  tier_map jsonb := jsonb_build_object('1', jsonb_build_array('soil'), '2', jsonb_build_array('grass','sprout'),
    '3', jsonb_build_array('flowers'), '4', jsonb_build_array('small_tree'), '5', jsonb_build_array('shrubs','bird'),
    '6', jsonb_build_array('full_tree'), '7', jsonb_build_array('grove','pond','butterflies'), '8', jsonb_build_array('guardian_aura'),
    '9', jsonb_build_array('rich_biome'), '10', jsonb_build_array('globe'), '11', jsonb_build_array('golden'));
  t int; el text; v_wp jsonb;
begin
  v_tier := (brote_get_rank(p_xp)->>'tier')::int;
  for t in 1..v_tier loop
    if tier_map ? t::text then
      for el in select value from jsonb_array_elements_text(tier_map->t::text) as value loop
        v_elements := array_append(v_elements, el);
      end loop;
    end if;
  end loop;
  v_live := round(0.35 + 0.65 * least(1.0, greatest(0, p_streak) / 30.0), 3);
  if p_domain_points is not null then
    for k, v in select key, value::numeric from jsonb_each_text(p_domain_points) loop
      if v > v_best then v_best := v; v_dom := k; end if;
    end loop;
  end if;
  if v_best <= 0 then v_dom := null; end if;
  if v_tier >= 11 then v_palette := 'golden'; elsif v_dom in ('agua','agua_azul') then v_palette := 'aqua';
  elsif v_tier >= 5 then v_palette := 'lush'; else v_palette := 'default'; end if;
  if v_tier >= 8 then v_cosmetics := array_append(v_cosmetics, 'guardian_aura'); end if;
  if v_tier >= 10 then v_cosmetics := array_append(v_cosmetics, 'globe_form'); end if;
  if v_tier >= 11 then v_cosmetics := array_append(v_cosmetics, 'golden_world'); end if;
  if v_tier >= 11 then v_pip := 'radiant'; elsif v_tier >= 8 then v_pip := 'guardian'; elsif v_tier >= 4 then v_pip := 'leafy';
  elsif v_tier >= 2 then v_pip := 'sprout'; else v_pip := 'seed'; end if;
  v_wp := brote_world_progress(p_completions);
  return jsonb_build_object('rankTier', v_tier, 'structuralElements', to_jsonb(v_elements), 'liveliness', v_live,
    'dominantDomain', v_dom, 'palette', v_palette, 'unlockedCosmetics', to_jsonb(v_cosmetics), 'pipStage', v_pip,
    'lastComputed', to_jsonb(now()), 'completions', greatest(0, coalesce(p_completions, 0)),
    'worldIndex', v_wp->'worldIndex', 'worldGrowth', v_wp->'worldGrowth', 'worldGoal', v_wp->'worldGoal');
end $$;
revoke execute on function brote_compute_mundo(bigint, int, jsonb, bigint) from public, anon, authenticated;

create or replace function brote_mundo_for(p_uid uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_xp bigint; v_streak int; v_count bigint;
begin
  select total_xp, current_streak into v_xp, v_streak from profiles where id = p_uid;
  select count(*) into v_count from activity_completions where user_id = p_uid and status in ('honor','verified');
  return brote_compute_mundo(coalesce(v_xp,0), coalesce(v_streak,0), brote_domain_points_json(p_uid), coalesce(v_count,0));
end $$;
revoke execute on function brote_mundo_for(uuid) from public, anon, authenticated;

-- ── 5) complete_activity v3: challenge progress + Mundo Infinito payload ─────
create or replace function complete_activity(p_activity_id uuid, p_photo_url text default null, p_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid(); v_act activities%rowtype; v_prof profiles%rowtype; v_local date; v_yesterday date;
  v_base int; v_points int := 0; v_first boolean := false; v_counts_streak boolean := false;
  v_status completion_status := 'honor'; v_new_streak int; v_streak_inc boolean := false; v_mult numeric := 1.0;
  v_old_rank jsonb; v_new_rank jsonb; v_rank_up boolean := false; v_div_up boolean := false;
  v_ach jsonb := jsonb_build_object('titles', '[]'::jsonb, 'badges', '[]'::jsonb); v_session_bonus int := 0;
  v_set_complete boolean := false; v_cooldown int; v_exists boolean; v_new_total bigint; v_min_tier int;
  v_set uuid[]; v_bonus_done boolean; v_done int; v_total int; v_cur_streak int;
  r_ch challenges%rowtype; v_prog int; v_was_done boolean; v_ch_completed jsonb := '[]'::jsonb;
  v_comp_total bigint; v_mundo jsonb; v_wp_prev jsonb; v_wp_now jsonb; v_world_completed jsonb := null;
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  select * into v_act from activities where id = p_activity_id and active;
  if not found then raise exception 'Acción no disponible'; end if;
  select * into v_prof from profiles where id = v_uid for update;
  if not found then raise exception 'Perfil no encontrado'; end if;
  select tier into v_min_tier from ranks where slug = v_act.min_rank_slug;
  if (brote_get_rank(v_prof.total_xp)->>'tier')::int < coalesce(v_min_tier, 1) then
    raise exception 'Necesitás un rango mayor para esta acción'; end if;
  v_local := (now() at time zone v_prof.timezone)::date; v_yesterday := v_local - 1; v_base := v_act.base_points;
  if v_act.type = 'daily' then
    select exists(select 1 from activity_completions where user_id = v_uid and activity_id = v_act.id and local_date = v_local) into v_exists;
    if v_exists then raise exception 'Ya hiciste esta acción hoy'; end if;
    v_counts_streak := true; v_status := 'honor';
    if v_prof.last_streak_date = v_local then v_new_streak := v_prof.current_streak;
    elsif v_prof.last_streak_date = v_yesterday then v_new_streak := v_prof.current_streak + 1; v_streak_inc := true;
    else v_new_streak := 1; v_streak_inc := true; end if;
    v_mult := case when v_new_streak >= 100 then 1.3 when v_new_streak >= 30 then 1.2 when v_new_streak >= 7 then 1.1 else 1.0 end;
    v_points := round(v_base * v_mult)::int;
  else
    v_cooldown := case when v_act.frequency = 'one_time' then -1 when v_act.frequency = 'weekly' then 168
      when v_act.frequency = 'recurring' then (case when v_act.repeat_cooldown_hours > 0 then v_act.repeat_cooldown_hours else 20 end) else 0 end;
    if v_cooldown = -1 then
      select exists(select 1 from activity_completions where user_id = v_uid and activity_id = v_act.id and status in ('honor','verified','pending')) into v_exists;
      if v_exists then raise exception 'Ya completaste esta acción'; end if;
    elsif v_cooldown > 0 then
      select exists(select 1 from activity_completions where user_id = v_uid and activity_id = v_act.id and status in ('honor','verified','pending')
        and completed_at > now() - make_interval(hours => v_cooldown)) into v_exists;
      if v_exists then raise exception 'Todavía no podés repetir esta acción'; end if;
    end if;
    select not exists(select 1 from activity_completions where user_id = v_uid and activity_id = v_act.id and status in ('honor','verified')) into v_first;
    v_status := 'honor'; v_points := v_base + (case when v_first then 100 else 0 end);
  end if;
  insert into activity_completions (user_id, activity_id, activity_type, domain_slug, local_date, points_awarded, status, photo_url, note, counts_for_streak)
  values (v_uid, v_act.id, v_act.type, v_act.domain_slug, v_local, v_points, v_status, p_photo_url, p_note, v_counts_streak);
  v_old_rank := brote_get_rank(v_prof.total_xp);
  if v_points > 0 then
    update profiles set total_xp = total_xp + v_points where id = v_uid;
    insert into user_domain_points (user_id, domain_slug, points) values (v_uid, v_act.domain_slug, v_points)
      on conflict (user_id, domain_slug) do update set points = user_domain_points.points + v_points;
  end if;
  if v_act.type = 'daily' then
    update profiles set current_streak = v_new_streak, longest_streak = greatest(longest_streak, v_new_streak), last_streak_date = v_local where id = v_uid;
    select activity_ids, bonus_awarded into v_set, v_bonus_done from daily_sets where user_id = v_uid and local_date = v_local;
    if v_set is not null and coalesce(array_length(v_set, 1), 0) > 0 and not coalesce(v_bonus_done, false) then
      v_total := array_length(v_set, 1);
      select count(distinct activity_id) into v_done from activity_completions where user_id = v_uid and local_date = v_local and activity_id = any(v_set);
      if v_done >= v_total then
        v_session_bonus := 200; update profiles set total_xp = total_xp + v_session_bonus where id = v_uid;
        update daily_sets set bonus_awarded = true where user_id = v_uid and local_date = v_local; v_set_complete := true;
      end if;
    end if;
  end if;

  -- Challenge progress (daily/weekly/seasonal) for every live challenge.
  for r_ch in select * from challenges c where c.active
      and (c.starts_at is null or c.starts_at <= now())
      and (c.ends_at is null or c.ends_at > now())
  loop
    if r_ch.target_metric = 'daily_actions' then
      select count(*) into v_prog from activity_completions
        where user_id = v_uid and activity_type = 'daily' and local_date = v_local and status in ('honor','verified');
    elsif r_ch.target_metric = 'domain_completions' then
      if r_ch.domain_slug is null then continue; end if;
      select count(*) into v_prog from activity_completions
        where user_id = v_uid and domain_slug = r_ch.domain_slug and status in ('honor','verified')
          and completed_at >= coalesce(r_ch.starts_at, now() - interval '7 days');
    elsif r_ch.target_metric = 'completions' then
      select count(*) into v_prog from activity_completions
        where user_id = v_uid and status in ('honor','verified')
          and completed_at >= coalesce(r_ch.starts_at, now() - interval '7 days');
    else
      continue;
    end if;
    select completed into v_was_done from user_challenges where user_id = v_uid and challenge_id = r_ch.id;
    insert into user_challenges (user_id, challenge_id, progress) values (v_uid, r_ch.id, v_prog)
      on conflict (user_id, challenge_id) do update set progress = greatest(user_challenges.progress, excluded.progress);
    if coalesce(v_was_done, false) = false and v_prog >= r_ch.target_value then
      update user_challenges set completed = true, completed_at = now() where user_id = v_uid and challenge_id = r_ch.id;
      if r_ch.reward_points > 0 then update profiles set total_xp = total_xp + r_ch.reward_points where id = v_uid; end if;
      insert into notifications (user_id, type, title_es, body_es, data)
      values (v_uid, 'challenge', '¡Reto completado! 🏆', r_ch.title_es || ' · +' || r_ch.reward_points || ' pts', jsonb_build_object('challenge', r_ch.id));
      v_ch_completed := v_ch_completed || jsonb_build_object('title_es', r_ch.title_es, 'reward_points', r_ch.reward_points, 'type', r_ch.type);
    end if;
  end loop;

  select total_xp, current_streak into v_new_total, v_cur_streak from profiles where id = v_uid;
  select count(*) into v_comp_total from activity_completions where user_id = v_uid and status in ('honor','verified');

  -- Mundo Infinito: did this completion finish a world?
  v_wp_prev := brote_world_progress(greatest(0, v_comp_total - 1));
  v_wp_now := brote_world_progress(v_comp_total);
  if (v_wp_now->>'worldIndex')::int > (v_wp_prev->>'worldIndex')::int then
    v_world_completed := jsonb_build_object('completed_index', (v_wp_prev->>'worldIndex')::int, 'new_index', (v_wp_now->>'worldIndex')::int);
    insert into notifications (user_id, type, title_es, body_es, data)
    values (v_uid, 'system', '¡Completaste un mundo! 🌍✨', 'Tu mundo ' || (v_wp_prev->>'worldIndex') || ' floreció por completo. Se abrió un bioma nuevo.', v_world_completed);
  end if;

  v_new_rank := brote_get_rank(v_new_total);
  v_mundo := brote_compute_mundo(v_new_total, v_cur_streak, brote_domain_points_json(v_uid), v_comp_total);
  update profiles set current_rank_slug = v_new_rank->>'slug', current_division = (v_new_rank->>'division')::int,
    mundo_state = v_mundo where id = v_uid;
  v_rank_up := (v_old_rank->>'slug') is distinct from (v_new_rank->>'slug');
  v_div_up := (not v_rank_up) and (v_old_rank->>'division')::int < (v_new_rank->>'division')::int;
  if v_points > 0 or v_set_complete then v_ach := brote_award_achievements(v_uid); end if;
  if v_rank_up then
    insert into notifications (user_id, type, title_es, body_es, data)
    values (v_uid, 'rank_up', '¡Subiste de rango!', '¡Llegaste a ' || initcap(v_new_rank->>'slug') || '!', jsonb_build_object('rank', v_new_rank->>'slug'));
  end if;
  return jsonb_build_object('points_awarded', v_points, 'new_total', v_new_total, 'rank_up', v_rank_up,
    'new_rank_slug', case when v_rank_up then v_new_rank->>'slug' else null end, 'division_up', v_div_up,
    'new_titles', v_ach->'titles', 'new_badges', v_ach->'badges', 'streak', v_cur_streak, 'streak_incremented', v_streak_inc,
    'daily_set_complete', v_set_complete, 'session_bonus', v_session_bonus, 'first_time', v_first, 'status', v_status,
    'mundo', v_mundo, 'completions_count', v_comp_total, 'challenges_completed', v_ch_completed,
    'world_completed', v_world_completed, 'mundo_delta', null);
end $$;

-- ── 6) Keep every other mundo writer consistent via brote_mundo_for() ───────
create or replace function complete_goal(p_goal_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_goal goals%rowtype; v_new_total bigint; v_new_rank jsonb;
begin
  select * into v_goal from goals where id = p_goal_id and user_id = auth.uid();
  if not found or v_goal.completed then return jsonb_build_object('ok', false); end if;
  update goals set completed = true, progress = greatest(progress, target_value) where id = p_goal_id;
  if v_goal.reward_points > 0 then
    update profiles set total_xp = total_xp + v_goal.reward_points where id = v_goal.user_id;
    select total_xp into v_new_total from profiles where id = v_goal.user_id;
    v_new_rank := brote_get_rank(v_new_total);
    update profiles set current_rank_slug = v_new_rank->>'slug', current_division = (v_new_rank->>'division')::int,
      mundo_state = brote_mundo_for(v_goal.user_id) where id = v_goal.user_id;
  end if;
  insert into notifications (user_id, type, title_es, body_es) values (v_goal.user_id, 'system', '¡Objetivo cumplido! 🎯', v_goal.title_es);
  return jsonb_build_object('ok', true, 'reward', v_goal.reward_points);
end $$;

create or replace function auto_approve_completion(p_completion_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_comp activity_completions%rowtype; v_act activities%rowtype; v_first boolean; v_award int := 0; v_new_total bigint; v_new_rank jsonb;
begin
  select * into v_comp from activity_completions where id = p_completion_id;
  if not found or v_comp.status <> 'pending' then return jsonb_build_object('ok', false); end if;
  select * into v_act from activities where id = v_comp.activity_id;
  select not exists(select 1 from activity_completions where user_id = v_comp.user_id and activity_id = v_comp.activity_id and status in ('honor','verified') and id <> v_comp.id) into v_first;
  v_award := v_act.base_points + (case when v_first then 100 else 0 end);
  update activity_completions set status = 'verified', points_awarded = v_award, ai_result = '{"fallback":true,"verified":true,"bonus":false}' where id = p_completion_id;
  update profiles set total_xp = total_xp + v_award where id = v_comp.user_id;
  insert into user_domain_points (user_id, domain_slug, points) values (v_comp.user_id, v_comp.domain_slug, v_award)
    on conflict (user_id, domain_slug) do update set points = user_domain_points.points + v_award;
  select total_xp into v_new_total from profiles where id = v_comp.user_id;
  v_new_rank := brote_get_rank(v_new_total);
  update profiles set current_rank_slug = v_new_rank->>'slug', current_division = (v_new_rank->>'division')::int,
    mundo_state = brote_mundo_for(v_comp.user_id) where id = v_comp.user_id;
  perform brote_award_achievements(v_comp.user_id);
  insert into notifications (user_id, type, title_es, body_es, data)
  values (v_comp.user_id, 'points', '¡Acción registrada! ✅', 'Sumaste ' || v_award || ' puntos por «' || v_act.title_es || '».', jsonb_build_object('completion', p_completion_id, 'points', v_award));
  return jsonb_build_object('ok', true, 'points_awarded', v_award);
end $$;
revoke execute on function auto_approve_completion(uuid) from public, anon, authenticated;

create or replace function daily_maintenance()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_ba_date date := (now() at time zone 'America/Argentina/Buenos_Aires')::date; v_yesterday date := v_ba_date - 1; v_dow int := extract(dow from v_ba_date); v_reset int := 0; v_frozen int := 0; r record;
begin
  for r in select id, total_xp, streak_freezes from profiles where current_streak > 0 and (last_streak_date is null or last_streak_date < v_yesterday) loop
    if r.streak_freezes > 0 then
      update profiles set streak_freezes = streak_freezes - 1, last_streak_date = v_yesterday where id = r.id;
      insert into notifications (user_id, type, title_es, body_es) values (r.id, 'streak_risk', 'Usaste un protector de racha 🛡️', 'Tu racha sigue viva. ¡Hacé una acción hoy!');
      v_frozen := v_frozen + 1;
    else
      update profiles set current_streak = 0 where id = r.id;
      update profiles set mundo_state = brote_mundo_for(r.id) where id = r.id;
      insert into notifications (user_id, type, title_es, body_es) values (r.id, 'streak_lost', 'Perdiste tu racha 😶‍🌫️', 'No pasa nada. Empezá una nueva hoy con una acción.');
      v_reset := v_reset + 1;
    end if;
  end loop;
  update app_state set value = (select jsonb_build_object('id', id) from challenges where type = 'daily' and active
      and id <> coalesce((select (value->>'id')::uuid from app_state where key = 'current_daily_challenge'), '00000000-0000-0000-0000-000000000000'::uuid) order by random() limit 1) where key = 'current_daily_challenge';
  if v_dow = 1 then
    declare v_ptr int; v_total int; v_ids uuid[];
    begin
      select coalesce((value->>'pointer')::int, 0) into v_ptr from app_state where key = 'featured_rotation';
      select count(*) into v_total from activities where type = 'catalog' and active;
      update activities set is_featured = false, featured_week = null where is_featured;
      select array_agg(id) into v_ids from (select id from activities where type = 'catalog' and active order by sort_order offset (v_ptr % greatest(v_total, 1)) limit 2) x;
      update activities set is_featured = true, featured_week = v_ba_date where id = any(v_ids);
      update app_state set value = jsonb_build_object('pointer', v_ptr + 2) where key = 'featured_rotation';
    end;
  end if;
  update goals set completed = true where not completed and progress >= target_value;
  if v_dow = 1 then
    insert into weekly_scores (user_id, week_start, xp) select user_id, v_ba_date, sum(points_awarded)::bigint from activity_completions where local_date >= v_ba_date - 7 group by user_id
    on conflict (user_id, week_start) do update set xp = excluded.xp;
  end if;
  for r in select id from activity_completions where status = 'pending' and completed_at < now() - interval '15 minutes' loop perform auto_approve_completion(r.id); end loop;
  return jsonb_build_object('reset', v_reset, 'frozen', v_frozen, 'date', v_ba_date, 'dow', v_dow);
end $$;
revoke execute on function daily_maintenance() from public, anon, authenticated;

-- ── 7) Backfill: recompute mundo_state for all users under the v2 model ─────
update profiles set mundo_state = brote_mundo_for(id);
