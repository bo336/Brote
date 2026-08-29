-- Brote — 0068 — El borrado también se lleva los archivos.
-- Feed v2 ("La Plaza") fase 3, paso 4 (corrección de 0067).
--
-- 0067 intentaba borrar las filas de `storage.objects` desde `delete_my_account`.
-- No se puede: Supabase tiene un trigger `storage.protect_delete()` que corta
-- cualquier DELETE directo sobre esas tablas —
--
--   42501: Direct deletion from storage tables is not allowed.
--          Use the Storage API instead.
--
-- y hace bien: borrar la fila dejaría el blob huérfano en S3 pagando espacio
-- para siempre. El camino correcto es la API de Storage, o sea el cliente, con
-- la sesión de la persona. Así que:
--
-- 1. `delete_my_account` vuelve a ser solo base de datos, con el comentario que
--    explica por qué (verificado: las cascadas ya cubren todas las tablas).
-- 2. Se agregan las políticas de borrado que FALTABAN. Había DELETE propio para
--    `avatars` y `feed`, pero NO para `projects` ni `verifications`. O sea que
--    hasta acá una persona no podía borrar sus propias fotos de verificación
--    —fotos de su casa y de lo que hizo, en un bucket privado— ni siquiera al
--    cerrar la cuenta. Eso es un agujero del derecho de supresión, no una
--    omisión menor.
-- 3. El cliente barre los cuatro buckets ANTES de llamar a `delete_my_account`
--    (ver `deleteMyAccount` en lib/api/profile.ts).

-- ═════════════════════════════════════════════════════════════════════════════
-- 1. Borrado de archivos propios en los dos buckets que faltaban
-- ═════════════════════════════════════════════════════════════════════════════

drop policy if exists "projects owner delete" on storage.objects;
create policy "projects owner delete" on storage.objects for delete
  using (bucket_id = 'projects' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "verifications owner delete" on storage.objects;
create policy "verifications owner delete" on storage.objects for delete
  using (bucket_id = 'verifications' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Sin SELECT no se puede listar para barrer. `feed` y `avatars` ya son
-- públicos de lectura; `projects` no tenía política de lectura propia.
drop policy if exists "projects owner list" on storage.objects;
create policy "projects owner list" on storage.objects for select
  using (bucket_id = 'projects');

-- ═════════════════════════════════════════════════════════════════════════════
-- 2. `delete_my_account`: solo base de datos
-- ═════════════════════════════════════════════════════════════════════════════
--
-- VERIFICADO consultando `pg_constraint` antes de tocar nada: `profiles` cae en
-- cascada desde `auth.users`, y desde `profiles` caen `feed_posts`, `follows`,
-- `feed_saves`, `feed_seen`, `feed_reactions`, `user_blocks`, `user_mutes` y
-- `content_reports.profile_id`. Las dos que quedan en SET NULL
-- —`content_reports.reporter_id` y `moderation_actions.profile_id`— son a
-- propósito: la denuncia y la decisión sobreviven anonimizadas, que es lo que
-- hace posible una apelación (08 §4).

create or replace function delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Iniciá sesión' using errcode = 'P0001';
  end if;
  -- Los archivos los borra el cliente por la API de Storage antes de llegar
  -- acá; desde SQL no se puede (trigger storage.protect_delete).
  delete from auth.users where id = v_uid;
end;
$fn$;

revoke all on function delete_my_account() from public, anon;
grant execute on function delete_my_account() to authenticated;
