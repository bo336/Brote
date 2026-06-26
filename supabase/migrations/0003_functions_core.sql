-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0003 — Core functions: rank math, mundo state, achievements,
-- new-user trigger, upvote-count trigger. Mirrors lib/ranks.ts + lib/mundo.ts.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Rank for a given XP (BUILD_SPEC §5.2) → {tier, slug, division} ───────────
create or replace function brote_get_rank(p_xp bigint)
returns jsonb language plpgsql stable as $$
declare
  v_xp        bigint := greatest(0, coalesce(p_xp, 0));
  v_cur       ranks%rowtype;
  v_next      ranks%rowtype;
  v_span      bigint;
  v_into      bigint;
  v_div       int := 1;
  d           int;
  v_boundary  bigint;
begin
  select * into v_cur from ranks where xp_threshold <= v_xp order by tier desc limit 1;
  if not found then
    select * into v_cur from ranks order by tier asc limit 1;
  end if;
  select * into v_next from ranks where tier = v_cur.tier + 1;

  if not found then
    -- Gaia (or beyond): cosmetic divisions every 250k XP.
    v_div := least(5, 1 + floor((v_xp - v_cur.xp_threshold) / 250000.0)::int);
    return jsonb_build_object('tier', v_cur.tier, 'slug', v_cur.slug, 'division', v_div);
  end if;

  v_span := v_next.xp_threshold - v_cur.xp_threshold;
  v_into := v_xp - v_cur.xp_threshold;
  for d in 0..4 loop
    v_boundary := floor((v_span * d) / 5.0);
    if v_into >= v_boundary then v_div := d + 1; end if;
  end loop;

  return jsonb_build_object('tier', v_cur.tier, 'slug', v_cur.slug, 'division', v_div);
end $$;

-- ── Deterministic "Tu Mundo" state (BUILD_SPEC §9.5) — mirrors lib/mundo.ts ──
create or replace function brote_compute_mundo(p_xp bigint, p_streak int, p_domain_points jsonb)
returns jsonb language plpgsql stable as $$
declare
  v_tier      int;
  v_elements  text[] := '{}';
  v_live      numeric;
  v_dom       text := null;
  v_best      numeric := 0;
  v_palette   text;
  v_pip       text;
  v_cosmetics text[] := '{}';
  k           text;
  v           numeric;
  tier_map    jsonb := jsonb_build_object(
    '1', jsonb_build_array('soil'),
    '2', jsonb_build_array('grass','sprout'),
    '3', jsonb_build_array('flowers'),
    '4', jsonb_build_array('small_tree'),
    '5', jsonb_build_array('shrubs','bird'),
    '6', jsonb_build_array('full_tree'),
    '7', jsonb_build_array('grove','pond','butterflies'),
    '8', jsonb_build_array('guardian_aura'),
    '9', jsonb_build_array('rich_biome'),
    '10', jsonb_build_array('globe'),
    '11', jsonb_build_array('golden')
  );
  t int;
  el jsonb;
begin
  v_tier := (brote_get_rank(p_xp)->>'tier')::int;

  for t in 1..v_tier loop
    if tier_map ? t::text then
      for el in select * from jsonb_array_elements_text(tier_map->t::text) loop
        v_elements := array_append(v_elements, el #>> '{}');
      end loop;
    end if;
  end loop;

  v_live := round(0.35 + 0.65 * least(1.0, greatest(0, p_streak) / 30.0), 3);

  if p_domain_points is not null then
    for k, v in select key, value::numeric from jsonb_each_text(p_domain_points) loop
      if v > v_best then v_best := v; v_dom := k; end if;
    end loop;
  end if;
  if v_best <= 0 then v_dom := null; end if;

  if v_tier >= 11 then v_palette := 'golden';
  elsif v_dom in ('agua','agua_azul') then v_palette := 'aqua';
  elsif v_tier >= 5 then v_palette := 'lush';
  else v_palette := 'default';
  end if;

  if v_tier >= 8  then v_cosmetics := array_append(v_cosmetics, 'guardian_aura'); end if;
  if v_tier >= 10 then v_cosmetics := array_append(v_cosmetics, 'globe_form'); end if;
  if v_tier >= 11 then v_cosmetics := array_append(v_cosmetics, 'golden_world'); end if;

  if    v_tier >= 11 then v_pip := 'radiant';
  elsif v_tier >= 8  then v_pip := 'guardian';
  elsif v_tier >= 4  then v_pip := 'leafy';
  elsif v_tier >= 2  then v_pip := 'sprout';
  else  v_pip := 'seed';
  end if;

  return jsonb_build_object(
    'rankTier', v_tier,
    'structuralElements', to_jsonb(v_elements),
    'liveliness', v_live,
    'dominantDomain', v_dom,
    'palette', v_palette,
    'unlockedCosmetics', to_jsonb(v_cosmetics),
    'pipStage', v_pip,
    'lastComputed', to_jsonb(now())
  );
end $$;

-- ── Award any newly-earned titles + badges (BUILD_SPEC §7) ───────────────────
-- Returns { titles:[{slug,name_es,rarity}], badges:[...] } of NEW awards only.
create or replace function brote_award_achievements(p_uid uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_prof        profiles%rowtype;
  v_tier        int;
  v_completions bigint;
  v_verified    bigint;
  v_new_titles  jsonb := '[]';
  v_new_badges  jsonb := '[]';
  r             record;
  v_ok          boolean;
  v_dompts      bigint;
begin
  select * into v_prof from profiles where id = p_uid;
  if not found then return jsonb_build_object('titles', '[]'::jsonb, 'badges', '[]'::jsonb); end if;

  v_tier := (brote_get_rank(v_prof.total_xp)->>'tier')::int;
  select count(*) into v_completions from activity_completions
    where user_id = p_uid and status in ('honor','verified');
  select count(*) into v_verified from activity_completions
    where user_id = p_uid and status = 'verified';

  -- Titles
  for r in
    select t.* from titles t
    where not exists (select 1 from user_titles ut where ut.user_id = p_uid and ut.title_id = t.id)
  loop
    v_ok := false;
    if r.requirement_type = 'rank' then
      v_ok := v_tier >= r.requirement_value;
    elsif r.requirement_type = 'streak' then
      v_ok := v_prof.longest_streak >= r.requirement_value;
    elsif r.requirement_type = 'activity_count' then
      v_ok := v_completions >= r.requirement_value;
    elsif r.requirement_type = 'verified' then
      v_ok := v_verified >= r.requirement_value;
    elsif r.requirement_type = 'domain_points' and r.requirement_domain is not null then
      select coalesce(points,0) into v_dompts from user_domain_points
        where user_id = p_uid and domain_slug = r.requirement_domain;
      v_ok := coalesce(v_dompts,0) >= r.requirement_value;
    end if;

    if v_ok then
      insert into user_titles (user_id, title_id) values (p_uid, r.id)
        on conflict do nothing;
      v_new_titles := v_new_titles || jsonb_build_object('slug', r.slug, 'name_es', r.name_es, 'rarity', r.rarity);
    end if;
  end loop;

  -- Badges (same requirement vocabulary)
  for r in
    select b.* from badges b
    where not exists (select 1 from user_badges ub where ub.user_id = p_uid and ub.badge_id = b.id)
  loop
    v_ok := false;
    if r.requirement_type = 'rank' then
      v_ok := v_tier >= r.requirement_value;
    elsif r.requirement_type = 'streak' then
      v_ok := v_prof.longest_streak >= r.requirement_value;
    elsif r.requirement_type = 'activity_count' then
      v_ok := v_completions >= r.requirement_value;
    elsif r.requirement_type = 'verified' then
      v_ok := v_verified >= r.requirement_value;
    elsif r.requirement_type = 'domain_points' and r.requirement_domain is not null then
      select coalesce(points,0) into v_dompts from user_domain_points
        where user_id = p_uid and domain_slug = r.requirement_domain;
      v_ok := coalesce(v_dompts,0) >= r.requirement_value;
    end if;

    if v_ok then
      insert into user_badges (user_id, badge_id) values (p_uid, r.id)
        on conflict do nothing;
      v_new_badges := v_new_badges || jsonb_build_object('slug', r.slug, 'name_es', r.name_es, 'rarity', r.rarity);
    end if;
  end loop;

  return jsonb_build_object('titles', v_new_titles, 'badges', v_new_badges);
end $$;

-- ── New-user trigger: create the profile row on signup (BUILD_SPEC §8.1) ─────
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_name text;
  v_avatar text;
begin
  v_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );
  v_avatar := coalesce(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture'
  );

  insert into profiles (id, display_name, avatar_url, mundo_state)
  values (new.id, v_name, v_avatar, brote_compute_mundo(0, 0, '{}'::jsonb))
  on conflict (id) do nothing;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── Maintain projects.upvotes from project_upvotes (BUILD_SPEC §4.2) ─────────
create or replace function sync_project_upvotes()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update projects set upvotes = upvotes + 1 where id = new.project_id;
  elsif tg_op = 'DELETE' then
    update projects set upvotes = greatest(0, upvotes - 1) where id = old.project_id;
  end if;
  return null;
end $$;

create trigger project_upvotes_count
  after insert or delete on project_upvotes
  for each row execute function sync_project_upvotes();
