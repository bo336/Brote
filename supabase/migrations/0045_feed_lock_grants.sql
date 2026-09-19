-- Brote — 0045 — Cerrar el acceso de `anon` y sacar pg_trgm de public.
-- Feed v2 ("La Plaza") fase 1 — corrección salida de get_advisors(security).
--
-- Supabase tiene un ALTER DEFAULT PRIVILEGES que le da EXECUTE a `anon` sobre
-- toda función nueva. Revocar solo de `public` no lo saca: hay que nombrar al
-- rol. Es el mismo cierre que hizo 0016_lock_function_grants en su momento, y
-- se vuelve a abrir con cada función nueva que se crea.
--
-- Lo importante no era follow_user (sin sesión auth.uid() es null y corta sola)
-- sino feed_item_json: al ser SECURITY DEFINER, un visitante sin sesión podía
-- pedir cualquier publicación por id y recibir el cuerpo y los datos del autor.

revoke execute on function
  feed_timeline_v2(text,text,integer,timestamptz,numeric,timestamptz,uuid),
  feed_item_json(uuid),
  feed_thread_v2(uuid),
  feed_pulse(),
  create_feed_post_v2(text,uuid,uuid,text,uuid),
  edit_feed_post(uuid,text),
  toggle_save_post(uuid),
  mark_feed_seen(uuid[]),
  react_to_post(uuid,smallint),
  follow_user(uuid),
  unfollow_user(uuid),
  suggested_accounts(integer),
  search_profiles(text,integer),
  my_following_ids(),
  report_content(uuid,uuid,text,text),
  block_user(uuid,boolean),
  mute_user(uuid,boolean),
  brote_matches_blocklist(text)
from anon;

-- Funciones internas: nadie las llama por REST, ni con sesión ni sin ella.
revoke all on function brote_sync_follow_counts() from public, anon, authenticated;
revoke all on function brote_notify_social(uuid, notif_type, text, text, text, jsonb) from public, anon, authenticated;
revoke all on function brote_prune_feed_seen() from public, anon, authenticated;
revoke all on function brote_matches_blocklist(text) from public, anon, authenticated;

-- pg_trgm fuera de public, igual que pgcrypto ya vive en `extensions`.
-- El índice se recrea con el opclass calificado porque el search_path de las
-- funciones está fijado en `public` y no vería gin_trgm_ops de otro modo.
drop index if exists idx_profiles_display_trgm;
alter extension pg_trgm set schema extensions;
create index if not exists idx_profiles_display_trgm
  on profiles using gin (display_name extensions.gin_trgm_ops);
