-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0012 — Expose the per-user cached Gemini recommendations to the owner
-- (the client blends them over the always-on content-based score, §10.2).
-- ════════════════════════════════════════════════════════════════════════════
create or replace function get_my_recommendations()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce((select value->'recommendations' from app_state where key = 'recs:' || auth.uid()::text), '[]'::jsonb);
$$;
grant execute on function get_my_recommendations() to authenticated;
