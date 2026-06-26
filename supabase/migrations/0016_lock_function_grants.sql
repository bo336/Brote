-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0016 — Lock down function EXECUTE grants.
-- Postgres grants EXECUTE to PUBLIC by default; revoking from anon/authenticated
-- alone left point-granting internals (award_verified, auto_approve_completion,
-- daily_maintenance) reachable via PUBLIC. Revoke PUBLIC everywhere, then
-- re-grant only the intended API surface.
-- ════════════════════════════════════════════════════════════════════════════

-- Internal / trigger / service-only — no client access at all.
revoke execute on function set_updated_at() from public;
revoke execute on function handle_new_user() from public;
revoke execute on function sync_project_upvotes() from public;
revoke execute on function notify_push() from public;
revoke execute on function brote_compute_mundo(bigint, int, jsonb) from public;
revoke execute on function brote_award_achievements(uuid) from public, anon, authenticated;
revoke execute on function award_verified(uuid, jsonb, boolean) from public, anon, authenticated;
revoke execute on function auto_approve_completion(uuid) from public, anon, authenticated;
revoke execute on function daily_maintenance() from public, anon, authenticated;
revoke execute on function brote_domain_points_json(uuid) from public;

-- Authenticated-only RPCs (revoke PUBLIC + anon, keep authenticated).
revoke execute on function complete_activity(uuid, text, text) from public, anon;
revoke execute on function ensure_daily_set() from public, anon;
revoke execute on function use_streak_freeze() from public, anon;
revoke execute on function create_project(text, text, text, text, text, text, double precision, double precision, timestamptz, int, text, text) from public, anon;
revoke execute on function join_project(uuid) from public, anon;
revoke execute on function upvote_project(uuid) from public, anon;
revoke execute on function friend_leaderboard(uuid) from public, anon;
revoke execute on function complete_goal(uuid) from public, anon;
revoke execute on function delete_my_account() from public, anon;
revoke execute on function get_my_recommendations() from public, anon;
grant execute on function complete_activity(uuid, text, text) to authenticated;
grant execute on function ensure_daily_set() to authenticated;
grant execute on function use_streak_freeze() to authenticated;
grant execute on function create_project(text, text, text, text, text, text, double precision, double precision, timestamptz, int, text, text) to authenticated;
grant execute on function join_project(uuid) to authenticated;
grant execute on function upvote_project(uuid) to authenticated;
grant execute on function friend_leaderboard(uuid) to authenticated;
grant execute on function complete_goal(uuid) to authenticated;
grant execute on function delete_my_account() to authenticated;
grant execute on function get_my_recommendations() to authenticated;

-- Public (anon + authenticated) read RPCs — revoke PUBLIC, grant explicitly.
revoke execute on function global_leaderboard(int, int) from public;
revoke execute on function domain_leaderboard(text, int, int) from public;
revoke execute on function neighborhood_leaderboard(text, int) from public;
revoke execute on function weekly_leaderboard(int) from public;
revoke execute on function get_user_global_position(uuid) from public;
revoke execute on function get_public_profile(text) from public;
revoke execute on function get_profiles_brief(uuid[]) from public;
revoke execute on function brote_get_rank(bigint) from public;
grant execute on function global_leaderboard(int, int) to anon, authenticated;
grant execute on function domain_leaderboard(text, int, int) to anon, authenticated;
grant execute on function neighborhood_leaderboard(text, int) to anon, authenticated;
grant execute on function weekly_leaderboard(int) to anon, authenticated;
grant execute on function get_user_global_position(uuid) to anon, authenticated;
grant execute on function get_public_profile(text) to anon, authenticated;
grant execute on function get_profiles_brief(uuid[]) to anon, authenticated;
grant execute on function brote_get_rank(bigint) to anon, authenticated;
grant execute on function brote_domain_points_json(uuid) to authenticated;
