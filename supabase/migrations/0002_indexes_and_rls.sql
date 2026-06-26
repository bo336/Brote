-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0002 — Indexes + Row Level Security + public_profiles view (§4.2/§4.3)
-- ════════════════════════════════════════════════════════════════════════════

-- ── Indexes (FKs + leaderboard/filter columns) ──────────────────────────────
create index idx_profiles_total_xp on profiles (total_xp desc);
create index idx_profiles_neighborhood on profiles (neighborhood);
create index idx_profiles_equipped_title on profiles (equipped_title_id);

create index idx_activities_domain on activities (domain_slug);
create index idx_activities_type on activities (type);
create index idx_activities_active on activities (active);
create index idx_activities_featured on activities (is_featured, featured_week);
create index idx_activities_min_rank on activities (min_rank_slug);

create index idx_completions_user on activity_completions (user_id);
create index idx_completions_activity on activity_completions (activity_id);
create index idx_completions_local_date on activity_completions (local_date);
create index idx_completions_domain on activity_completions (domain_slug);
create index idx_completions_status on activity_completions (status);
create index idx_completions_user_date on activity_completions (user_id, local_date);

create index idx_udp_domain_points on user_domain_points (domain_slug, points desc);
create index idx_user_titles_user on user_titles (user_id);
create index idx_user_badges_user on user_badges (user_id);

create index idx_challenges_type on challenges (type, active);
create index idx_challenges_ends on challenges (ends_at);
create index idx_user_challenges_user on user_challenges (user_id);

create index idx_goals_user on goals (user_id);
create index idx_goals_ends on goals (ends_at);

create index idx_projects_creator on projects (creator_id);
create index idx_projects_domain on projects (domain_slug);
create index idx_projects_neighborhood on projects (neighborhood);
create index idx_projects_status on projects (status);
create index idx_projects_event_date on projects (event_date);
create index idx_projects_upvotes on projects (upvotes desc);
create index idx_project_participants_user on project_participants (user_id);
create index idx_project_upvotes_user on project_upvotes (user_id);

create index idx_news_active on news (active);
create index idx_news_score on news (interest_score desc);
create index idx_news_published on news (published_at desc);
create index idx_news_tags on news using gin (domain_tags);

create index idx_friendships_friend on friendships (friend_id, status);
create index idx_notifications_user on notifications (user_id, read, created_at desc);
create index idx_push_user on push_subscriptions (user_id);
create index idx_weekly_scores_week on weekly_scores (week_start, xp desc);

-- ── Enable RLS on every table ───────────────────────────────────────────────
alter table domains              enable row level security;
alter table ranks                enable row level security;
alter table titles               enable row level security;
alter table badges               enable row level security;
alter table profiles             enable row level security;
alter table activities           enable row level security;
alter table activity_completions enable row level security;
alter table user_domain_points   enable row level security;
alter table user_titles          enable row level security;
alter table user_badges          enable row level security;
alter table challenges           enable row level security;
alter table user_challenges      enable row level security;
alter table goals                enable row level security;
alter table projects             enable row level security;
alter table project_participants enable row level security;
alter table project_upvotes      enable row level security;
alter table news                 enable row level security;
alter table friendships          enable row level security;
alter table notifications        enable row level security;
alter table app_state            enable row level security;
alter table push_subscriptions   enable row level security;
alter table daily_sets           enable row level security;
alter table weekly_scores        enable row level security;

-- ── Public-read reference data ──────────────────────────────────────────────
create policy "read domains"    on domains    for select using (true);
create policy "read ranks"      on ranks      for select using (true);
create policy "read titles"     on titles     for select using (true);
create policy "read badges"     on badges     for select using (true);
create policy "read activities" on activities for select using (active = true);
create policy "read news"       on news       for select using (active = true);
create policy "read challenges" on challenges for select using (true);
create policy "read app_state"  on app_state  for select using (is_public = true);

-- ── Profiles: owner full access; public reads go through public_profiles ────
create policy "profiles owner read"   on profiles for select using (auth.uid() = id);
create policy "profiles owner update" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles owner insert" on profiles for insert with check (auth.uid() = id);

-- Safe public columns only (leaderboards + public profiles).
create view public_profiles
with (security_invoker = false) as
  select id, username, display_name, avatar_url, bio, city, neighborhood,
         total_xp, current_rank_slug, current_division, current_streak,
         longest_streak, equipped_title_id, mundo_state, created_at
  from profiles;
grant select on public_profiles to anon, authenticated;

-- ── Per-user owned data ─────────────────────────────────────────────────────
create policy "completions owner all" on activity_completions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Aggregates that feed public leaderboards/profiles are world-readable.
create policy "udp read"        on user_domain_points for select using (true);
create policy "udp owner write" on user_domain_points for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_titles read"  on user_titles  for select using (true);
create policy "user_badges read"  on user_badges  for select using (true);
create policy "weekly read"       on weekly_scores for select using (true);

create policy "user_challenges owner" on user_challenges
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "goals owner" on goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "daily_sets owner" on daily_sets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "notifications owner read"   on notifications for select using (auth.uid() = user_id);
create policy "notifications owner update" on notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "push owner" on push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Community ───────────────────────────────────────────────────────────────
create policy "projects read"          on projects for select using (true);
create policy "projects creator update" on projects for update using (auth.uid() = creator_id) with check (auth.uid() = creator_id);
create policy "projects creator delete" on projects for delete using (auth.uid() = creator_id);
-- INSERT is intentionally omitted: projects are created via create_project()
-- which enforces the min-rank gate server-side (§8.5).

create policy "participants read"  on project_participants for select using (true);
create policy "participants owner" on project_participants
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "upvotes read"  on project_upvotes for select using (true);
create policy "upvotes owner" on project_upvotes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Friendships (either side may read; owner manages own outgoing rows) ──────
create policy "friendships read" on friendships
  for select using (auth.uid() = user_id or auth.uid() = friend_id);
create policy "friendships write" on friendships
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
