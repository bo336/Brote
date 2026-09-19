-- Brote — 0067 — Consentimiento de publicación y borrado que borra de verdad.
-- Feed v2 ("La Plaza") fase 3, paso 4 (capa legal).
--
-- ═════════════════════════════════════════════════════════════════════════════
-- 1. Banderas de la Plaza
-- ═════════════════════════════════════════════════════════════════════════════
--
-- Dos cosas que se muestran UNA vez y hay que recordar: el aviso de que lo que
-- publicás es público y sale con tu nombre y tu Pip, y la tarjeta de "esta es
-- tu primera publicación". Van en `profiles.context->'plaza'` bajo su propio
-- espacio, para no ensuciar el blob del onboarding.
--
-- Es una RPC y no un update desde el cliente porque combinar jsonb desde el
-- navegador obliga a leer-modificar-escribir, y dos pestañas abiertas se pisan.
-- Acá el merge pasa dentro de la misma sentencia.

create or replace function set_plaza_flag(p_key text, p_value jsonb default 'true'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'Iniciá sesión');
  end if;
  -- Lista cerrada: esta función no es un almacén de datos arbitrarios.
  if p_key not in ('consent_at', 'first_post_seen') then
    return jsonb_build_object('ok', false, 'error', 'Clave inválida');
  end if;

  update profiles
     set context = jsonb_set(
           coalesce(context, '{}'::jsonb),
           array['plaza', p_key],
           p_value,
           true)
   where id = v_uid;

  return jsonb_build_object('ok', true);
end;
$fn$;

revoke all on function set_plaza_flag(text, jsonb) from public, anon, authenticated;
grant execute on function set_plaza_flag(text, jsonb) to authenticated;

-- ═════════════════════════════════════════════════════════════════════════════
-- 2. `delete_my_account` que también borra las fotos
-- ═════════════════════════════════════════════════════════════════════════════
--
-- VERIFICADO ANTES DE TOCAR NADA: las claves foráneas ya hacían lo correcto.
-- `profiles` cae en cascada desde `auth.users`, y desde `profiles` caen
-- `feed_posts`, `follows`, `feed_saves`, `feed_seen`, `feed_reactions`,
-- `user_blocks`, `user_mutes` y `content_reports.profile_id`. Las dos que NO
-- caen —`content_reports.reporter_id` y `moderation_actions.profile_id`— están
-- en SET NULL a propósito: la denuncia y la decisión sobreviven anonimizadas,
-- que es lo que hace posible una apelación (08 §4).
--
-- Lo que SÍ faltaba: los archivos. Borrar la fila no borra la imagen, así que
-- una foto que alguien subió a una publicación seguía accesible por su URL
-- pública después de que esa persona cerrara la cuenta. Eso es dato personal
-- que sobrevive al derecho de supresión.
--
-- Se borran las filas de `storage.objects` de los tres buckets donde el primer
-- segmento del camino es el id de la persona, más el bucket privado de
-- verificaciones. Nota honesta: esto saca el objeto del índice de Storage
-- —deja de servirse y de listarse— y lo deja para la limpieza del proveedor;
-- no es un borrado del blob en S3 emitido por nosotros. Es lo que se puede
-- hacer desde SQL, y es lo que corresponde documentar en la política.

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

  delete from storage.objects
   where bucket_id in ('feed', 'avatars', 'projects', 'verifications')
     and split_part(name, '/', 1) = v_uid::text;

  -- El resto viaja por las cascadas descritas arriba.
  delete from auth.users where id = v_uid;
end;
$fn$;

revoke all on function delete_my_account() from public, anon;
grant execute on function delete_my_account() to authenticated;
