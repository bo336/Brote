-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0010 — Account deletion + goal helpers (BUILD_SPEC §8.1, §8.8)
-- ════════════════════════════════════════════════════════════════════════════

-- Full account deletion: removing the auth.users row cascades to profiles and
-- all user-owned data (on delete cascade). SECURITY DEFINER so the user can
-- delete only their own account.
create or replace function delete_my_account()
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from auth.users where id = auth.uid();
end $$;
grant execute on function delete_my_account() to authenticated;

-- Award a completed goal's reward (called when a goal hits its target). Grants
-- XP (no domain) + a celebratory notification. Idempotent via the completed flag.
create or replace function complete_goal(p_goal_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_goal goals%rowtype;
  v_new_total bigint;
  v_new_rank jsonb;
begin
  select * into v_goal from goals where id = p_goal_id and user_id = auth.uid();
  if not found or v_goal.completed then return jsonb_build_object('ok', false); end if;

  update goals set completed = true, progress = greatest(progress, target_value) where id = p_goal_id;

  if v_goal.reward_points > 0 then
    update profiles set total_xp = total_xp + v_goal.reward_points where id = v_goal.user_id;
    select total_xp into v_new_total from profiles where id = v_goal.user_id;
    v_new_rank := brote_get_rank(v_new_total);
    update profiles set current_rank_slug = v_new_rank->>'slug', current_division = (v_new_rank->>'division')::int,
      mundo_state = brote_compute_mundo(v_new_total, (select current_streak from profiles where id = v_goal.user_id),
        brote_domain_points_json(v_goal.user_id))
    where id = v_goal.user_id;
  end if;

  insert into notifications (user_id, type, title_es, body_es)
  values (v_goal.user_id, 'system', '¡Objetivo cumplido! 🎯', v_goal.title_es);

  return jsonb_build_object('ok', true, 'reward', v_goal.reward_points);
end $$;
grant execute on function complete_goal(uuid) to authenticated;
