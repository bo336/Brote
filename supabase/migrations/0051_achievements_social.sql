-- Brote — 0051 — Tres requisitos sociales en el camino de logros que ya existe.
-- Feed v2 ("La Plaza") fase 2, paso 7.
--
-- Se agregan ramas a brote_award_achievements, no se reescribe: el resto de la
-- función reparte todos los títulos e insignias del producto.
--   replies_received = respuestas que otras personas dejaron en mis publicaciones
--   posts_made       = profiles.posts_count
--   followers        = profiles.followers_count

create or replace function brote_award_achievements(p_uid uuid) returns jsonb
language plpgsql security definer set search_path = public as $function$
declare
  v_prof profiles%rowtype; v_tier int; v_completions bigint; v_verified bigint;
  v_new_titles jsonb := '[]'; v_new_badges jsonb := '[]'; r record; v_ok boolean; v_dompts bigint;
  v_replies bigint;
begin
  select * into v_prof from profiles where id = p_uid;
  if not found then return jsonb_build_object('titles', '[]'::jsonb, 'badges', '[]'::jsonb); end if;
  v_tier := (brote_get_rank(v_prof.total_xp)->>'tier')::int;
  select count(*) into v_completions from activity_completions where user_id = p_uid and status in ('honor','verified');
  select count(*) into v_verified from activity_completions where user_id = p_uid and status = 'verified';

  -- Respuestas de OTRAS personas: responderse a uno mismo no cuenta.
  select count(*) into v_replies
    from feed_posts r join feed_posts parent on parent.id = r.parent_id
   where r.kind = 'reply' and not r.hidden
     and parent.author_id = p_uid and r.author_id is distinct from p_uid;

  for r in select t.* from titles t where not exists (select 1 from user_titles ut where ut.user_id = p_uid and ut.title_id = t.id) loop
    v_ok := false;
    if r.requirement_type = 'rank' then v_ok := v_tier >= r.requirement_value;
    elsif r.requirement_type = 'streak' then v_ok := v_prof.longest_streak >= r.requirement_value;
    elsif r.requirement_type = 'activity_count' then v_ok := v_completions >= r.requirement_value;
    elsif r.requirement_type = 'verified' then v_ok := v_verified >= r.requirement_value;
    elsif r.requirement_type = 'replies_received' then v_ok := v_replies >= r.requirement_value;
    elsif r.requirement_type = 'posts_made' then v_ok := coalesce(v_prof.posts_count,0) >= r.requirement_value;
    elsif r.requirement_type = 'followers' then v_ok := coalesce(v_prof.followers_count,0) >= r.requirement_value;
    elsif r.requirement_type = 'domain_points' and r.requirement_domain is not null then
      select coalesce(points,0) into v_dompts from user_domain_points where user_id = p_uid and domain_slug = r.requirement_domain;
      v_ok := coalesce(v_dompts,0) >= r.requirement_value; end if;
    if v_ok then insert into user_titles (user_id, title_id) values (p_uid, r.id) on conflict do nothing;
      v_new_titles := v_new_titles || jsonb_build_object('slug', r.slug, 'name_es', r.name_es, 'rarity', r.rarity); end if;
  end loop;

  for r in select b.* from badges b where not exists (select 1 from user_badges ub where ub.user_id = p_uid and ub.badge_id = b.id) loop
    v_ok := false;
    if r.requirement_type = 'rank' then v_ok := v_tier >= r.requirement_value;
    elsif r.requirement_type = 'streak' then v_ok := v_prof.longest_streak >= r.requirement_value;
    elsif r.requirement_type = 'activity_count' then v_ok := v_completions >= r.requirement_value;
    elsif r.requirement_type = 'verified' then v_ok := v_verified >= r.requirement_value;
    elsif r.requirement_type = 'replies_received' then v_ok := v_replies >= r.requirement_value;
    elsif r.requirement_type = 'posts_made' then v_ok := coalesce(v_prof.posts_count,0) >= r.requirement_value;
    elsif r.requirement_type = 'followers' then v_ok := coalesce(v_prof.followers_count,0) >= r.requirement_value;
    elsif r.requirement_type = 'domain_points' and r.requirement_domain is not null then
      select coalesce(points,0) into v_dompts from user_domain_points where user_id = p_uid and domain_slug = r.requirement_domain;
      v_ok := coalesce(v_dompts,0) >= r.requirement_value; end if;
    if v_ok then insert into user_badges (user_id, badge_id) values (p_uid, r.id) on conflict do nothing;
      v_new_badges := v_new_badges || jsonb_build_object('slug', r.slug, 'name_es', r.name_es, 'rarity', r.rarity); end if;
  end loop;

  return jsonb_build_object('titles', v_new_titles, 'badges', v_new_badges);
end $function$;

-- Los títulos sociales se revisan cuando cambia el grafo, no sólo al completar
-- una acción — si no, "Antena" llegaría recién la próxima vez que hicieras algo.
create or replace function brote_check_social_titles() returns trigger
language plpgsql security definer set search_path = public as $fn$
begin
  perform brote_award_achievements(coalesce(new.followee_id, old.followee_id));
  return null;
end $fn$;

drop trigger if exists trg_social_titles on follows;
create trigger trg_social_titles after insert on follows
for each row execute function brote_check_social_titles();
revoke all on function brote_check_social_titles() from public, anon, authenticated;
