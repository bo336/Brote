-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0004 — Core RPCs (BUILD_SPEC §4.3, §6, §7, §11, §13).
-- ALL point/rank/streak mutations live here so the client can't forge them.
-- ════════════════════════════════════════════════════════════════════════════

-- Helper: a user's domain points as a jsonb object {slug: points}.
create or replace function brote_domain_points_json(p_uid uuid)
returns jsonb language sql stable as $$
  select coalesce(jsonb_object_agg(domain_slug, points), '{}'::jsonb)
  from user_domain_points where user_id = p_uid;
$$;

-- ── complete_activity — the core transactional RPC ──────────────────────────
create or replace function complete_activity(
  p_activity_id uuid,
  p_photo_url   text default null,
  p_note        text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid           uuid := auth.uid();
  v_act           activities%rowtype;
  v_prof          profiles%rowtype;
  v_local         date;
  v_yesterday     date;
  v_base          int;
  v_points        int := 0;
  v_first         boolean := false;
  v_counts_streak boolean := false;
  v_status        completion_status := 'honor';
  v_new_streak    int;
  v_streak_inc    boolean := false;
  v_mult          numeric := 1.0;
  v_old_rank      jsonb;
  v_new_rank      jsonb;
  v_rank_up       boolean := false;
  v_div_up        boolean := false;
  v_ach           jsonb := jsonb_build_object('titles', '[]'::jsonb, 'badges', '[]'::jsonb);
  v_session_bonus int := 0;
  v_set_complete  boolean := false;
  v_cooldown      int;
  v_exists        boolean;
  v_new_total     bigint;
  v_min_tier      int;
  v_set           uuid[];
  v_bonus_done    boolean;
  v_done          int;
  v_total         int;
  v_cur_streak    int;
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;

  select * into v_act from activities where id = p_activity_id and active;
  if not found then raise exception 'Acción no disponible'; end if;

  select * into v_prof from profiles where id = v_uid for update;
  if not found then raise exception 'Perfil no encontrado'; end if;

  -- min-rank gate (§5, §8.4)
  select tier into v_min_tier from ranks where slug = v_act.min_rank_slug;
  if (brote_get_rank(v_prof.total_xp)->>'tier')::int < coalesce(v_min_tier, 1) then
    raise exception 'Necesitás un rango mayor para esta acción';
  end if;

  v_local := (now() at time zone v_prof.timezone)::date;
  v_yesterday := v_local - 1;
  v_base := v_act.base_points;

  if v_act.type = 'daily' then
    select exists(
      select 1 from activity_completions
      where user_id = v_uid and activity_id = v_act.id and local_date = v_local
    ) into v_exists;
    if v_exists then raise exception 'Ya hiciste esta acción hoy'; end if;

    v_counts_streak := true;
    v_status := 'honor';

    -- streak (§13.2): continue if last action was yesterday, else restart.
    if v_prof.last_streak_date = v_local then
      v_new_streak := v_prof.current_streak;             -- already counted today
    elsif v_prof.last_streak_date = v_yesterday then
      v_new_streak := v_prof.current_streak + 1; v_streak_inc := true;
    else
      v_new_streak := 1; v_streak_inc := true;
    end if;

    v_mult := case
      when v_new_streak >= 100 then 1.3
      when v_new_streak >= 30  then 1.2
      when v_new_streak >= 7   then 1.1
      else 1.0 end;
    v_points := round(v_base * v_mult)::int;
  else
    -- catalog cooldown (§6.3)
    v_cooldown := case
      when v_act.frequency = 'one_time'  then -1
      when v_act.frequency = 'weekly'    then 168
      when v_act.frequency = 'recurring' then (case when v_act.repeat_cooldown_hours > 0 then v_act.repeat_cooldown_hours else 20 end)
      else 0 end;

    if v_cooldown = -1 then
      select exists(select 1 from activity_completions
        where user_id = v_uid and activity_id = v_act.id and status in ('honor','verified','pending')) into v_exists;
      if v_exists then raise exception 'Ya completaste esta acción'; end if;
    elsif v_cooldown > 0 then
      select exists(select 1 from activity_completions
        where user_id = v_uid and activity_id = v_act.id and status in ('honor','verified','pending')
        and completed_at > now() - make_interval(hours => v_cooldown)) into v_exists;
      if v_exists then raise exception 'Todavía no podés repetir esta acción'; end if;
    end if;

    select not exists(select 1 from activity_completions
      where user_id = v_uid and activity_id = v_act.id and status in ('honor','verified')) into v_first;

    if v_act.verification = 'photo_ai' then
      if p_photo_url is null then raise exception 'Esta acción necesita una foto'; end if;
      v_status := 'pending';
      v_points := 0;                                     -- granted on verification (§11.3)
    else
      v_status := 'honor';
      v_points := v_base + (case when v_first then 100 else 0 end);
    end if;
  end if;

  insert into activity_completions
    (user_id, activity_id, activity_type, domain_slug, local_date, points_awarded, status, photo_url, note, counts_for_streak)
  values
    (v_uid, v_act.id, v_act.type, v_act.domain_slug, v_local, v_points, v_status, p_photo_url, p_note, v_counts_streak);

  v_old_rank := brote_get_rank(v_prof.total_xp);

  if v_points > 0 then
    update profiles set total_xp = total_xp + v_points where id = v_uid;
    insert into user_domain_points (user_id, domain_slug, points)
      values (v_uid, v_act.domain_slug, v_points)
      on conflict (user_id, domain_slug) do update set points = user_domain_points.points + v_points;
  end if;

  if v_act.type = 'daily' then
    update profiles set
      current_streak  = v_new_streak,
      longest_streak  = greatest(longest_streak, v_new_streak),
      last_streak_date = v_local
    where id = v_uid;

    -- daily-set completion bonus (§6.2)
    select activity_ids, bonus_awarded into v_set, v_bonus_done
      from daily_sets where user_id = v_uid and local_date = v_local;
    if v_set is not null and coalesce(array_length(v_set, 1), 0) > 0 and not coalesce(v_bonus_done, false) then
      v_total := array_length(v_set, 1);
      select count(distinct activity_id) into v_done from activity_completions
        where user_id = v_uid and local_date = v_local and activity_id = any(v_set);
      if v_done >= v_total then
        v_session_bonus := 200;
        update profiles set total_xp = total_xp + v_session_bonus where id = v_uid;
        update daily_sets set bonus_awarded = true where user_id = v_uid and local_date = v_local;
        v_set_complete := true;
      end if;
    end if;
  end if;

  select total_xp, current_streak into v_new_total, v_cur_streak from profiles where id = v_uid;
  v_new_rank := brote_get_rank(v_new_total);

  update profiles set
    current_rank_slug = v_new_rank->>'slug',
    current_division  = (v_new_rank->>'division')::int,
    mundo_state       = brote_compute_mundo(v_new_total, v_cur_streak, brote_domain_points_json(v_uid))
  where id = v_uid;

  v_rank_up := (v_old_rank->>'slug') is distinct from (v_new_rank->>'slug');
  v_div_up  := (not v_rank_up) and (v_old_rank->>'division')::int < (v_new_rank->>'division')::int;

  if v_points > 0 or v_set_complete then
    v_ach := brote_award_achievements(v_uid);
  end if;

  if v_rank_up then
    insert into notifications (user_id, type, title_es, body_es, data)
    values (v_uid, 'rank_up', '¡Subiste de rango!',
            '¡Llegaste a ' || initcap(v_new_rank->>'slug') || '!',
            jsonb_build_object('rank', v_new_rank->>'slug'));
  end if;

  return jsonb_build_object(
    'points_awarded', v_points,
    'new_total', v_new_total,
    'rank_up', v_rank_up,
    'new_rank_slug', case when v_rank_up then v_new_rank->>'slug' else null end,
    'division_up', v_div_up,
    'new_titles', v_ach->'titles',
    'new_badges', v_ach->'badges',
    'streak', v_cur_streak,
    'streak_incremented', v_streak_inc,
    'daily_set_complete', v_set_complete,
    'session_bonus', v_session_bonus,
    'first_time', v_first,
    'status', v_status,
    'mundo_delta', null
  );
end $$;

-- ── award_verified — flip a pending photo_ai completion (§10.1, §11.3) ───────
create or replace function award_verified(
  p_completion_id uuid,
  p_ai_result     jsonb,
  p_verified      boolean
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_comp       activity_completions%rowtype;
  v_act        activities%rowtype;
  v_base       int;
  v_bonus      int;
  v_first      boolean;
  v_award      int := 0;
  v_new_total  bigint;
  v_cur_streak int;
  v_new_rank   jsonb;
  v_ach        jsonb := jsonb_build_object('titles', '[]'::jsonb, 'badges', '[]'::jsonb);
begin
  select * into v_comp from activity_completions where id = p_completion_id;
  if not found then raise exception 'Completion no encontrada'; end if;
  if v_comp.status <> 'pending' then
    return jsonb_build_object('already', true, 'status', v_comp.status);
  end if;
  select * into v_act from activities where id = v_comp.activity_id;

  if p_verified then
    v_base := v_act.base_points;
    v_bonus := round((v_base * 0.25) / 10.0) * 10;        -- +25% rounded to 10 (§6.2)
    select not exists(select 1 from activity_completions
      where user_id = v_comp.user_id and activity_id = v_comp.activity_id
        and status in ('honor','verified') and id <> v_comp.id) into v_first;
    v_award := v_base + v_bonus + (case when v_first then 100 else 0 end);

    update activity_completions
      set status = 'verified', points_awarded = v_award, ai_result = p_ai_result
      where id = p_completion_id;

    update profiles set total_xp = total_xp + v_award where id = v_comp.user_id;
    insert into user_domain_points (user_id, domain_slug, points)
      values (v_comp.user_id, v_comp.domain_slug, v_award)
      on conflict (user_id, domain_slug) do update set points = user_domain_points.points + v_award;

    select total_xp, current_streak into v_new_total, v_cur_streak from profiles where id = v_comp.user_id;
    v_new_rank := brote_get_rank(v_new_total);
    update profiles set
      current_rank_slug = v_new_rank->>'slug',
      current_division  = (v_new_rank->>'division')::int,
      mundo_state       = brote_compute_mundo(v_new_total, v_cur_streak, brote_domain_points_json(v_comp.user_id))
    where id = v_comp.user_id;

    v_ach := brote_award_achievements(v_comp.user_id);

    insert into notifications (user_id, type, title_es, body_es, data)
    values (v_comp.user_id, 'points', '¡Acción verificada! ✅',
            'Sumaste ' || v_award || ' puntos por «' || v_act.title_es || '».',
            jsonb_build_object('completion', p_completion_id, 'points', v_award));
  else
    update activity_completions set status = 'rejected', ai_result = p_ai_result where id = p_completion_id;
    insert into notifications (user_id, type, title_es, body_es, data)
    values (v_comp.user_id, 'system', 'No pudimos verificar tu foto',
            'Probá de nuevo con una foto más clara de «' || v_act.title_es || '».',
            jsonb_build_object('completion', p_completion_id));
  end if;

  return jsonb_build_object(
    'verified', p_verified,
    'points_awarded', v_award,
    'new_titles', v_ach->'titles',
    'new_badges', v_ach->'badges'
  );
end $$;

-- ── ensure_daily_set — lazy per-day set generation (§7.3, §13.1) ─────────────
create or replace function ensure_daily_set()
returns setof activities
language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_prof  profiles%rowtype;
  v_local date;
  v_ids   uuid[];
begin
  if v_uid is null then raise exception 'No autenticado'; end if;
  select * into v_prof from profiles where id = v_uid;
  v_local := (now() at time zone v_prof.timezone)::date;

  select activity_ids into v_ids from daily_sets where user_id = v_uid and local_date = v_local;

  if v_ids is null then
    -- One activity per domain (variety), preferring the user's interests,
    -- deterministic per (user, day). Cap at 5.
    select array_agg(id) into v_ids from (
      select id from (
        select a.id, a.domain_slug,
          row_number() over (
            partition by a.domain_slug
            order by md5(a.id::text || v_local::text || v_uid::text)
          ) rn,
          (a.domain_slug = any(v_prof.interests)) as is_interest
        from activities a
        where a.type = 'daily' and a.active
      ) per_domain
      where rn = 1
      order by is_interest desc, md5(id::text || v_local::text)
      limit 5
    ) picked;

    insert into daily_sets (user_id, local_date, activity_ids)
      values (v_uid, v_local, coalesce(v_ids, '{}'))
      on conflict (user_id, local_date) do update set activity_ids = excluded.activity_ids
      returning activity_ids into v_ids;
  end if;

  return query select * from activities where id = any(v_ids);
end $$;

-- ── use_streak_freeze — consume one held freeze (§13.2) ──────────────────────
create or replace function use_streak_freeze()
returns int language plpgsql security definer set search_path = public as $$
declare v_left int;
begin
  update profiles set streak_freezes = greatest(0, streak_freezes - 1)
  where id = auth.uid() and streak_freezes > 0
  returning streak_freezes into v_left;
  return coalesce(v_left, 0);
end $$;

-- ── Projects: create (rank ≥ Plántula), join, upvote (§8.5) ──────────────────
create or replace function create_project(
  p_title text, p_description text, p_type text, p_domain text,
  p_neighborhood text, p_location_text text, p_lat double precision, p_lng double precision,
  p_event_date timestamptz, p_max_participants int, p_image_url text, p_min_rank text default 'semilla'
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_tier int; v_id uuid;
begin
  if v_uid is null then raise exception 'No autenticado'; end if;
  select (brote_get_rank(total_xp)->>'tier')::int into v_tier from profiles where id = v_uid;
  if v_tier < 3 then
    raise exception 'Podés crear proyectos desde el rango Plántula';
  end if;

  insert into projects (creator_id, title, description, type, domain_slug, neighborhood,
                        location_text, lat, lng, event_date, max_participants, image_url,
                        min_rank_slug, status)
  values (v_uid, p_title, p_description, coalesce(p_type,'otro'), p_domain, p_neighborhood,
          p_location_text, p_lat, p_lng, p_event_date, p_max_participants, p_image_url,
          coalesce(p_min_rank,'semilla'), 'active')
  returning id into v_id;

  insert into project_participants (project_id, user_id, status)
    values (v_id, v_uid, 'organizer') on conflict do nothing;
  return v_id;
end $$;

create or replace function join_project(p_project_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_tier int; v_min int; v_count int; v_max int;
begin
  if v_uid is null then raise exception 'No autenticado'; end if;
  select tier into v_min from ranks where slug = (select min_rank_slug from projects where id = p_project_id);
  select (brote_get_rank(total_xp)->>'tier')::int into v_tier from profiles where id = v_uid;
  if v_tier < coalesce(v_min, 1) then raise exception 'Este proyecto requiere un rango mayor'; end if;

  select max_participants into v_max from projects where id = p_project_id;
  if v_max is not null then
    select count(*) into v_count from project_participants where project_id = p_project_id and status in ('joined','organizer');
    if v_count >= v_max then raise exception 'El proyecto está completo'; end if;
  end if;

  insert into project_participants (project_id, user_id, status)
    values (p_project_id, v_uid, 'joined')
    on conflict (project_id, user_id) do update set status = 'joined';
  return true;
end $$;

create or replace function upvote_project(p_project_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_had boolean; v_count int;
begin
  if v_uid is null then raise exception 'No autenticado'; end if;
  select exists(select 1 from project_upvotes where project_id = p_project_id and user_id = v_uid) into v_had;
  if v_had then
    delete from project_upvotes where project_id = p_project_id and user_id = v_uid;
  else
    insert into project_upvotes (project_id, user_id) values (p_project_id, v_uid) on conflict do nothing;
  end if;
  select upvotes into v_count from projects where id = p_project_id;
  return jsonb_build_object('upvoted', not v_had, 'upvotes', v_count);
end $$;

-- Grants
grant execute on function complete_activity(uuid, text, text) to authenticated;
grant execute on function ensure_daily_set() to authenticated;
grant execute on function use_streak_freeze() to authenticated;
grant execute on function create_project(text, text, text, text, text, text, double precision, double precision, timestamptz, int, text, text) to authenticated;
grant execute on function join_project(uuid) to authenticated;
grant execute on function upvote_project(uuid) to authenticated;
grant execute on function brote_award_achievements(uuid) to authenticated;
grant execute on function brote_get_rank(bigint) to authenticated, anon;
grant execute on function brote_domain_points_json(uuid) to authenticated;
-- award_verified is service-role only (called by the verify Edge Function).
revoke execute on function award_verified(uuid, jsonb, boolean) from authenticated, anon;
