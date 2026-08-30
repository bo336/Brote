-- Brote — 0061 — `brote_award_achievements` deja de chocar consigo misma.
-- Feed v2 ("La Plaza") fase 2, paso 7 (corrección).
--
-- CUARTO BUG REAL, y el peor de la tanda: SEGUIR A ALGUIEN FALLABA SIEMPRE.
--
-- La rama `replies_received` que agregó 0051 cuenta con `from feed_posts r`.
-- Pero la función ya declara `r record` para recorrer títulos e insignias, y
-- plpgsql resuelve `r.kind`, `r.hidden` y `r.author_id` contra ESA variable,
-- no contra el alias de la tabla. Como todavía no tiene valor:
--
--   55000: record "r" is not assigned yet
--
-- Y como `brote_check_social_titles` corre en un trigger AFTER INSERT sobre
-- `follows`, la excepción se propaga y aborta la transacción entera: cada
-- llamada a `follow_user` reventaba. No se había notado porque las pruebas de
-- fase 2 verificaban visibilidad de perfil, que no necesita seguir a nadie.
--
-- El arreglo es renombrar el alias. Se aprovecha para calificar `parent`
-- también, que corría el mismo riesgo si mañana alguien declara una variable
-- con ese nombre.

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
  -- El alias es `rep`, NO `r`: `r` es la variable de los bucles de abajo.
  select count(*) into v_replies
    from feed_posts rep join feed_posts par on par.id = rep.parent_id
   where rep.kind = 'reply' and not rep.hidden
     and par.author_id = p_uid and rep.author_id is distinct from p_uid;

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

-- Segunda red: que un fallo repartiendo títulos no pueda impedir que alguien
-- siga a alguien. El grafo social es lo importante; la insignia se recalcula
-- sola la próxima vez. Sin esto, cualquier error futuro acá vuelve a romper
-- `follow_user` entero.
create or replace function brote_check_social_titles() returns trigger
language plpgsql security definer set search_path = public as $fn$
begin
  begin
    perform brote_award_achievements(coalesce(new.followee_id, old.followee_id));
  exception when others then
    null;
  end;
  return null;
end $fn$;

revoke all on function brote_check_social_titles() from public, anon, authenticated;
