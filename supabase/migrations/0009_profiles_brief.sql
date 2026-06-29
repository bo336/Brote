-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0009 — Safe public profile briefs by id (participant lists, etc.)
-- ════════════════════════════════════════════════════════════════════════════
create or replace function get_profiles_brief(p_ids uuid[])
returns table(id uuid, username text, display_name text, avatar_url text, rank_slug text, division int)
language sql stable security definer set search_path = public as $$
  select p.id, p.username::text, p.display_name, p.avatar_url, p.current_rank_slug, p.current_division
  from profiles p
  where p.id = any(p_ids);
$$;
grant execute on function get_profiles_brief(uuid[]) to anon, authenticated;
