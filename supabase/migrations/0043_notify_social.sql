-- Brote — 0043 — El notificador social, que agrupa en vez de repetir.
-- Feed v2 ("La Plaza") fase 1, paso 4 de 5.
--
-- Brote ya aprendió esto una vez (ver 0033_harder_challenges_quieter_notifications):
-- una notificación por cada like convierte la campanita en ruido y la gente deja
-- de mirarla. Acá una fila por (usuario, tipo, clave) por hora, actualizada en el
-- lugar, con el contador adentro: "A Lu y 4 personas más les gustó tu publicación".

create or replace function brote_notify_social(
  p_user uuid, p_type notif_type, p_key text, p_title text, p_body text, p_data jsonb
) returns void
language plpgsql security definer set search_path = public as $fn$
declare v_id uuid; v_count int; v_actor uuid;
begin
  if p_user is null then return; end if;

  -- Nunca notificar la propia acción.
  v_actor := nullif(p_data->>'user_id','')::uuid;
  if v_actor is not null and v_actor = p_user then return; end if;

  -- Respetar silencios y bloqueos en las dos direcciones.
  if v_actor is not null and exists (
      select 1 from user_mutes where muter_id = p_user and muted_id = v_actor) then
    return;
  end if;
  if v_actor is not null and exists (
      select 1 from user_blocks
      where (blocker_id = p_user and blocked_id = v_actor)
         or (blocker_id = v_actor and blocked_id = p_user)) then
    return;
  end if;

  -- Preferencias por tipo. Si la clave no está, el default es recibirla.
  if coalesce((select (notification_prefs->>('notif_' || p_type::text))::boolean
               from profiles where id = p_user), true) = false then
    return;
  end if;

  select id, coalesce((data->>'count')::int, 1) into v_id, v_count
    from notifications
   where user_id = p_user and type = p_type and data->>'agg_key' = p_key
     and created_at > now() - interval '1 hour'
   order by created_at desc limit 1;

  if v_id is not null then
    update notifications
       set data = coalesce(p_data,'{}'::jsonb) || jsonb_build_object('agg_key', p_key, 'count', v_count + 1),
           title_es = p_title, body_es = p_body, read = false, created_at = now()
     where id = v_id;
  else
    insert into notifications (user_id, type, title_es, body_es, data)
    values (p_user, p_type, p_title, p_body,
            coalesce(p_data,'{}'::jsonb) || jsonb_build_object('agg_key', p_key, 'count', 1));
  end if;
end $fn$;

-- Solo la llaman otras funciones SECURITY DEFINER: nadie debería poder fabricar
-- una notificación para otra persona.
revoke all on function brote_notify_social(uuid, notif_type, text, text, text, jsonb)
  from public, anon, authenticated;

-- Poda de impresiones: feed_seen crece con cada scroll y solo importa 72 h.
-- Se engancha al mantenimiento diario que ya existe.
create or replace function brote_prune_feed_seen() returns int
language plpgsql security definer set search_path = public as $fn$
declare v_n int;
begin
  delete from feed_seen where seen_at < now() - interval '7 days';
  get diagnostics v_n = row_count;
  return v_n;
end $fn$;
revoke all on function brote_prune_feed_seen() from public, anon, authenticated;
