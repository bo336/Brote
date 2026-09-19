-- Brote — 0049 — Búsqueda de historias y la cola de moderación del dueño.
-- Feed v2 ("La Plaza") fase 2, pasos 4 y 6.
--
-- La contraseña del panel se pide en CADA lectura y en CADA escritura, así una
-- pestaña vieja no puede seguir moderando. Cada decisión queda registrada en
-- moderation_actions: el registro es la evidencia de que se moderó (08 §4).
--
-- NOTA: search_news se corrige después en 0052 — el LIMIT estaba fuera del
-- agregado y no recortaba nada.

create or replace function my_blocks_and_mutes() returns jsonb
language sql stable security definer set search_path = public as $fn$
  select jsonb_build_object(
    'blocked', coalesce((select jsonb_agg(jsonb_build_object(
        'id', p.id, 'username', p.username, 'display_name', p.display_name,
        'avatar_url', p.avatar_url, 'pip_style', p.pip_style, 'rank_slug', p.current_rank_slug)
      order by b.created_at desc)
      from user_blocks b join profiles p on p.id = b.blocked_id
      where b.blocker_id = auth.uid()), '[]'::jsonb),
    'muted', coalesce((select jsonb_agg(jsonb_build_object(
        'id', p.id, 'username', p.username, 'display_name', p.display_name,
        'avatar_url', p.avatar_url, 'pip_style', p.pip_style, 'rank_slug', p.current_rank_slug)
      order by m.created_at desc)
      from user_mutes m join profiles p on p.id = m.muted_id
      where m.muter_id = auth.uid()), '[]'::jsonb));
$fn$;

create or replace function admin_moderation_queue(p_pass text, p_status text default 'open')
returns jsonb language plpgsql security definer set search_path = public as $fn$
begin
  if not admin_check(p_pass) then raise exception 'No autorizado' using errcode = 'P0001'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
    'id', r.id, 'reason', r.reason, 'note', r.note, 'status', r.status,
    'created_at', r.created_at, 'resolved_at', r.resolved_at, 'resolution', r.resolution,
    'reports', (select count(*) from content_reports x
                where x.post_id is not distinct from r.post_id
                  and x.profile_id is not distinct from r.profile_id),
    'post', case when r.post_id is null then null else feed_item_json(r.post_id) end,
    'post_hidden', (select f.hidden from feed_posts f where f.id = r.post_id),
    'author', (select jsonb_build_object('id', p.id, 'username', p.username,
                 'display_name', p.display_name, 'trust_score', p.trust_score,
                 'suspended_until', p.suspended_until,
                 'upheld_30d', (select count(*) from content_reports c
                                join feed_posts f2 on f2.id = c.post_id
                                where f2.author_id = p.id and c.status = 'upheld'
                                  and c.created_at > now() - interval '30 days'))
               from profiles p
               where p.id = coalesce(r.profile_id, (select author_id from feed_posts where id = r.post_id))))
    order by r.created_at desc)
    from content_reports r where r.status = p_status limit 200), '[]'::jsonb);
end $fn$;

create or replace function admin_moderate(p_pass text, p_report_id uuid, p_action text, p_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare r content_reports%rowtype; v_author uuid; v_upheld int;
begin
  if not admin_check(p_pass) then raise exception 'No autorizado' using errcode = 'P0001'; end if;
  if p_action not in ('hide','restore','dismiss') then
    return jsonb_build_object('ok', false, 'error', 'Acción inválida');
  end if;

  select * into r from content_reports where id = p_report_id;
  if not found then return jsonb_build_object('ok', false, 'error', 'No existe'); end if;
  select author_id into v_author from feed_posts where id = r.post_id;

  if p_action = 'hide' then
    update feed_posts set hidden = true where id = r.post_id;
    update profiles set trust_score = greatest(0, coalesce(trust_score,1) - 0.15) where id = v_author;

    select count(*) into v_upheld from content_reports c
      join feed_posts f on f.id = c.post_id
     where f.author_id = v_author and c.status = 'upheld'
       and c.created_at > now() - interval '30 days';

    -- Se suspende por regla, no por humor: tres denuncias sostenidas en 30 días.
    if v_upheld >= 2 then
      update profiles set suspended_until = now() + interval '7 days' where id = v_author;
      perform brote_notify_social(v_author, 'moderation', 'mod-susp:' || v_author::text,
        'Tu cuenta quedó suspendida para publicar',
        'Podés seguir usando Brote. Revisá las normas de la comunidad.', '{}'::jsonb);
    else
      -- Avisar a quien escribió es decente, y es lo que hace posible apelar.
      perform brote_notify_social(v_author, 'moderation', 'mod:' || r.id::text,
        'Sacamos una publicación tuya',
        coalesce(p_note, 'No cumplía las normas de la comunidad.'),
        jsonb_build_object('post_id', r.post_id));
    end if;
    update content_reports set status = 'upheld', resolved_at = now(), resolution = p_note where id = r.id;

  elsif p_action = 'restore' then
    update feed_posts set hidden = false where id = r.post_id;
    update content_reports set status = 'dismissed', resolved_at = now(), resolution = p_note where id = r.id;
  else
    update content_reports set status = 'dismissed', resolved_at = now(), resolution = p_note where id = r.id;
  end if;

  insert into moderation_actions (report_id, post_id, profile_id, action, reason)
  values (r.id, r.post_id, r.profile_id, p_action, p_note);
  return jsonb_build_object('ok', true);
end $fn$;

revoke all on function my_blocks_and_mutes() from public, anon;
grant execute on function my_blocks_and_mutes() to authenticated;
revoke all on function admin_moderation_queue(text,text), admin_moderate(text,uuid,text,text) from public, anon;
grant execute on function admin_moderation_queue(text,text), admin_moderate(text,uuid,text,text) to authenticated;
