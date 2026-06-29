-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0007 — Security hardening (from Supabase advisors)
-- ════════════════════════════════════════════════════════════════════════════

-- 1) Replace the SECURITY DEFINER view with a SECURITY DEFINER RPC that returns
--    only safe columns (clears the security_definer_view ERROR; the RPC is the
--    single public read path for other users' profiles).
drop view if exists public_profiles;

create or replace function get_public_profile(p_username text)
returns table(id uuid, username text, display_name text, avatar_url text, bio text,
              city text, neighborhood text, total_xp bigint, rank_slug text, division int,
              current_streak int, longest_streak int, title_es text, mundo_state jsonb,
              created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id, p.username::text, p.display_name, p.avatar_url, p.bio, p.city, p.neighborhood,
         p.total_xp, p.current_rank_slug, p.current_division, p.current_streak, p.longest_streak,
         t.name_es, p.mundo_state, p.created_at
  from profiles p
  left join titles t on t.id = p.equipped_title_id
  where lower(p.username) = lower(p_username);
$$;
grant execute on function get_public_profile(text) to anon, authenticated;

-- 2) Pin search_path on the remaining functions (function_search_path_mutable).
alter function brote_get_rank(bigint) set search_path = public;
alter function brote_compute_mundo(bigint, int, jsonb) set search_path = public;
alter function brote_domain_points_json(uuid) set search_path = public;
alter function set_updated_at() set search_path = public;
alter function sync_project_upvotes() set search_path = public;

-- 3) Trigger functions must not be in the public API surface.
revoke execute on function handle_new_user() from anon, authenticated;
revoke execute on function set_updated_at() from anon, authenticated;
revoke execute on function sync_project_upvotes() from anon, authenticated;

-- 4) Internal helper — only reachable from SECURITY DEFINER callers.
revoke execute on function brote_award_achievements(uuid) from anon, authenticated;

-- 5) Mutating RPCs require auth; anon calls would error anyway. Drop anon execute
--    to shrink the public API surface (authenticated keeps access).
revoke execute on function complete_activity(uuid, text, text) from anon;
revoke execute on function ensure_daily_set() from anon;
revoke execute on function use_streak_freeze() from anon;
revoke execute on function create_project(text, text, text, text, text, text, double precision, double precision, timestamptz, int, text, text) from anon;
revoke execute on function join_project(uuid) from anon;
revoke execute on function upvote_project(uuid) from anon;

-- 6) Public storage buckets serve objects via public URL without a SELECT policy;
--    the broad listing policies expose file listings unnecessarily.
drop policy if exists "avatars public read" on storage.objects;
drop policy if exists "projects public read" on storage.objects;
