-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0017 — Covering indexes for remaining foreign keys (perf advisor).
-- ════════════════════════════════════════════════════════════════════════════
create index if not exists idx_challenges_domain on challenges (domain_slug);
create index if not exists idx_goals_domain on goals (domain_slug);
create index if not exists idx_titles_domain on titles (domain_slug);
create index if not exists idx_user_titles_title on user_titles (title_id);
create index if not exists idx_user_badges_badge on user_badges (badge_id);
create index if not exists idx_user_challenges_challenge on user_challenges (challenge_id);
