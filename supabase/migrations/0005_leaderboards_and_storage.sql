-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0005 — Leaderboard RPCs (§8.6) + Storage buckets/policies (§16)
-- ════════════════════════════════════════════════════════════════════════════

create or replace function global_leaderboard(p_limit int default 50, p_offset int default 0)
returns table(pos bigint, user_id uuid, username text, display_name text, avatar_url text,
              neighborhood text, total_xp bigint, rank_slug text, division int, title_es text)
language sql stable security definer set search_path = public as $$
  select row_number() over (order by p.total_xp desc, p.created_at asc),
         p.id, p.username::text, p.display_name, p.avatar_url, p.neighborhood,
         p.total_xp, p.current_rank_slug, p.current_division, t.name_es
  from profiles p
  left join titles t on t.id = p.equipped_title_id
  order by p.total_xp desc, p.created_at asc
  limit p_limit offset p_offset;
$$;

create or replace function domain_leaderboard(p_domain text, p_limit int default 50, p_offset int default 0)
returns table(pos bigint, user_id uuid, username text, display_name text, avatar_url text,
              neighborhood text, points bigint, rank_slug text, division int, title_es text)
language sql stable security definer set search_path = public as $$
  select row_number() over (order by udp.points desc),
         p.id, p.username::text, p.display_name, p.avatar_url, p.neighborhood,
         udp.points, p.current_rank_slug, p.current_division, t.name_es
  from user_domain_points udp
  join profiles p on p.id = udp.user_id
  left join titles t on t.id = p.equipped_title_id
  where udp.domain_slug = p_domain and udp.points > 0
  order by udp.points desc
  limit p_limit offset p_offset;
$$;

create or replace function neighborhood_leaderboard(p_neighborhood text, p_limit int default 50)
returns table(pos bigint, user_id uuid, username text, display_name text, avatar_url text,
              neighborhood text, total_xp bigint, rank_slug text, division int, title_es text)
language sql stable security definer set search_path = public as $$
  select row_number() over (order by p.total_xp desc),
         p.id, p.username::text, p.display_name, p.avatar_url, p.neighborhood,
         p.total_xp, p.current_rank_slug, p.current_division, t.name_es
  from profiles p
  left join titles t on t.id = p.equipped_title_id
  where p.neighborhood is not null and lower(p.neighborhood) = lower(p_neighborhood)
  order by p.total_xp desc
  limit p_limit;
$$;

create or replace function friend_leaderboard(p_uid uuid)
returns table(pos bigint, user_id uuid, username text, display_name text, avatar_url text,
              neighborhood text, total_xp bigint, rank_slug text, division int, title_es text)
language sql stable security definer set search_path = public as $$
  with friends as (
    select case when user_id = p_uid then friend_id else user_id end as fid
    from friendships
    where status = 'accepted' and (user_id = p_uid or friend_id = p_uid)
    union select p_uid
  )
  select row_number() over (order by p.total_xp desc),
         p.id, p.username::text, p.display_name, p.avatar_url, p.neighborhood,
         p.total_xp, p.current_rank_slug, p.current_division, t.name_es
  from profiles p
  join friends f on f.fid = p.id
  left join titles t on t.id = p.equipped_title_id
  order by p.total_xp desc;
$$;

create or replace function weekly_leaderboard(p_limit int default 50)
returns table(pos bigint, user_id uuid, username text, display_name text, avatar_url text,
              neighborhood text, xp bigint, rank_slug text, division int, title_es text)
language sql stable security definer set search_path = public as $$
  with wk as (
    select user_id, sum(points_awarded)::bigint as xp
    from activity_completions
    where local_date >= ((now() at time zone 'America/Argentina/Buenos_Aires')::date - 6)
    group by user_id
  )
  select row_number() over (order by wk.xp desc),
         p.id, p.username::text, p.display_name, p.avatar_url, p.neighborhood,
         wk.xp, p.current_rank_slug, p.current_division, t.name_es
  from wk
  join profiles p on p.id = wk.user_id
  left join titles t on t.id = p.equipped_title_id
  where wk.xp > 0
  order by wk.xp desc
  limit p_limit;
$$;

create or replace function get_user_global_position(p_uid uuid)
returns bigint language sql stable security definer set search_path = public as $$
  select count(*) + 1 from profiles
  where total_xp > (select total_xp from profiles where id = p_uid);
$$;

grant execute on function global_leaderboard(int, int) to authenticated, anon;
grant execute on function domain_leaderboard(text, int, int) to authenticated, anon;
grant execute on function neighborhood_leaderboard(text, int) to authenticated, anon;
grant execute on function friend_leaderboard(uuid) to authenticated;
grant execute on function weekly_leaderboard(int) to authenticated, anon;
grant execute on function get_user_global_position(uuid) to authenticated, anon;

-- ── Storage buckets (BUILD_SPEC §16; owner confirms in dashboard) ────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/png','image/jpeg','image/webp']),
  ('projects', 'projects', true, 8388608, array['image/png','image/jpeg','image/webp']),
  ('verifications', 'verifications', false, 8388608, array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

-- Public read for avatars + projects.
create policy "avatars public read" on storage.objects
  for select using (bucket_id = 'avatars');
create policy "projects public read" on storage.objects
  for select using (bucket_id = 'projects');

-- Owner-scoped writes (path = "<uid>/..." enforces per-user folders).
create policy "avatars owner write" on storage.objects
  for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars owner update" on storage.objects
  for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars owner delete" on storage.objects
  for delete using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "projects owner write" on storage.objects
  for insert with check (bucket_id = 'projects' and (storage.foldername(name))[1] = auth.uid()::text);

-- Verifications are private: owner read/write own folder only.
create policy "verifications owner read" on storage.objects
  for select using (bucket_id = 'verifications' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "verifications owner write" on storage.objects
  for insert with check (bucket_id = 'verifications' and (storage.foldername(name))[1] = auth.uid()::text);
