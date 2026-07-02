-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0021 — RLS performance hardening (IMPROVEMENT_PLAN F6.5).
-- Mirrors live migration 0012_rls_perf_hardening.
-- Wrap auth.uid() in (select …) so RLS evaluates once per query (not per row),
-- and split "owner ALL" policies into write-only commands where a
-- world-readable SELECT policy already exists.
-- ════════════════════════════════════════════════════════════════════════════

drop policy "profiles owner read" on profiles;
drop policy "profiles owner update" on profiles;
drop policy "profiles owner insert" on profiles;
create policy "profiles owner read" on profiles for select using ((select auth.uid()) = id);
create policy "profiles owner update" on profiles for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "profiles owner insert" on profiles for insert with check ((select auth.uid()) = id);

drop policy "completions owner all" on activity_completions;
create policy "completions owner all" on activity_completions
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy "udp owner write" on user_domain_points;
create policy "udp owner insert" on user_domain_points for insert with check ((select auth.uid()) = user_id);
create policy "udp owner update" on user_domain_points for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "udp owner delete" on user_domain_points for delete using ((select auth.uid()) = user_id);

drop policy "user_challenges owner" on user_challenges;
create policy "user_challenges owner" on user_challenges
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy "goals owner" on goals;
create policy "goals owner" on goals
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy "daily_sets owner" on daily_sets;
create policy "daily_sets owner" on daily_sets
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy "notifications owner read" on notifications;
drop policy "notifications owner update" on notifications;
create policy "notifications owner read" on notifications for select using ((select auth.uid()) = user_id);
create policy "notifications owner update" on notifications for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy "push owner" on push_subscriptions;
create policy "push owner" on push_subscriptions
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy "projects creator update" on projects;
drop policy "projects creator delete" on projects;
create policy "projects creator update" on projects for update using ((select auth.uid()) = creator_id) with check ((select auth.uid()) = creator_id);
create policy "projects creator delete" on projects for delete using ((select auth.uid()) = creator_id);

drop policy "participants owner" on project_participants;
create policy "participants owner insert" on project_participants for insert with check ((select auth.uid()) = user_id);
create policy "participants owner update" on project_participants for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "participants owner delete" on project_participants for delete using ((select auth.uid()) = user_id);

drop policy "upvotes owner" on project_upvotes;
create policy "upvotes owner insert" on project_upvotes for insert with check ((select auth.uid()) = user_id);
create policy "upvotes owner delete" on project_upvotes for delete using ((select auth.uid()) = user_id);

drop policy "friendships read" on friendships;
drop policy "friendships write" on friendships;
create policy "friendships read" on friendships
  for select using ((select auth.uid()) = user_id or (select auth.uid()) = friend_id);
create policy "friendships insert" on friendships for insert with check ((select auth.uid()) = user_id);
create policy "friendships update" on friendships for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "friendships delete" on friendships for delete using ((select auth.uid()) = user_id);
