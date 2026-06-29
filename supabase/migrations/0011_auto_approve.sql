-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0011 — Graceful AI-fallback: approve a pending photo completion at
-- honor level (base points + first-time, NO verification bonus). Used by the
-- verify-completion Edge Function when Gemini is unavailable, and by the
-- nightly maintenance job for stale pending completions (BUILD_SPEC §11.3).
-- ════════════════════════════════════════════════════════════════════════════
create or replace function auto_approve_completion(p_completion_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_comp      activity_completions%rowtype;
  v_act       activities%rowtype;
  v_first     boolean;
  v_award     int := 0;
  v_new_total bigint;
  v_cur_streak int;
  v_new_rank  jsonb;
begin
  select * into v_comp from activity_completions where id = p_completion_id;
  if not found or v_comp.status <> 'pending' then
    return jsonb_build_object('ok', false);
  end if;
  select * into v_act from activities where id = v_comp.activity_id;

  select not exists(select 1 from activity_completions
    where user_id = v_comp.user_id and activity_id = v_comp.activity_id
      and status in ('honor','verified') and id <> v_comp.id) into v_first;
  v_award := v_act.base_points + (case when v_first then 100 else 0 end);

  update activity_completions
    set status = 'verified', points_awarded = v_award, ai_result = '{"fallback":true,"verified":true,"bonus":false}'
    where id = p_completion_id;

  update profiles set total_xp = total_xp + v_award where id = v_comp.user_id;
  insert into user_domain_points (user_id, domain_slug, points)
    values (v_comp.user_id, v_comp.domain_slug, v_award)
    on conflict (user_id, domain_slug) do update set points = user_domain_points.points + v_award;

  select total_xp, current_streak into v_new_total, v_cur_streak from profiles where id = v_comp.user_id;
  v_new_rank := brote_get_rank(v_new_total);
  update profiles set current_rank_slug = v_new_rank->>'slug', current_division = (v_new_rank->>'division')::int,
    mundo_state = brote_compute_mundo(v_new_total, v_cur_streak, brote_domain_points_json(v_comp.user_id))
  where id = v_comp.user_id;

  perform brote_award_achievements(v_comp.user_id);

  insert into notifications (user_id, type, title_es, body_es, data)
  values (v_comp.user_id, 'points', '¡Acción registrada! ✅',
          'Sumaste ' || v_award || ' puntos por «' || v_act.title_es || '».',
          jsonb_build_object('completion', p_completion_id, 'points', v_award));

  return jsonb_build_object('ok', true, 'points_awarded', v_award);
end $$;
-- Service-role only (called by Edge Functions / cron).
revoke execute on function auto_approve_completion(uuid) from anon, authenticated;
