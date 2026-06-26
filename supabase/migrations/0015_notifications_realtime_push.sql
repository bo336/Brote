-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0015 — Notifications: Realtime + Web Push trigger (BUILD_SPEC §8.10)
-- ════════════════════════════════════════════════════════════════════════════

-- Enable Realtime for the live unread badge (RLS still scopes to the owner).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table notifications;
  end if;
end $$;

-- On a new notification, fire a Web Push (respecting notification_prefs). Uses
-- pg_net + the Vault `service_role_key` (OWNER ACTION). If the key isn't set,
-- the in-app notification still works; push is simply skipped.
create or replace function notify_push()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_prefs jsonb;
  v_allow boolean;
  v_key   text;
begin
  if new.type not in ('rank_up','streak_risk','streak_lost','title','project','challenge','points','friend') then
    return new;
  end if;

  select notification_prefs into v_prefs from profiles where id = new.user_id;
  if coalesce((v_prefs->>'push')::boolean, true) = false then return new; end if;

  v_allow := case
    when new.type in ('streak_risk','streak_lost') then coalesce((v_prefs->>'streak')::boolean, true)
    when new.type = 'challenge' then coalesce((v_prefs->>'challenges')::boolean, true)
    when new.type = 'project'   then coalesce((v_prefs->>'projects')::boolean, true)
    else true
  end;
  if not v_allow then return new; end if;

  v_key := (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key');
  if v_key is null then return new; end if;

  perform net.http_post(
    url := 'https://abnnjszxlwovpnazmbnu.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key),
    body := jsonb_build_object(
      'user_id', new.user_id,
      'title', new.title_es,
      'body', coalesce(new.body_es, ''),
      'url', coalesce(new.data->>'url', '/')
    )
  );
  return new;
end $$;

drop trigger if exists notifications_push on notifications;
create trigger notifications_push after insert on notifications
  for each row execute function notify_push();
