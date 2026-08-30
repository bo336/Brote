-- Brote — 0048 — Que toda cuenta tenga un @handle.
-- Feed v2 ("La Plaza") fase 2 — bug de fondo encontrado al empezar la fase.
--
-- `profiles.username` existe desde 0001 y NADA lo escribía nunca: las cuatro
-- cuentas reales lo tenían en null. Mientras el feed no mostraba perfiles no se
-- notaba — el código hacía `username ? href : undefined` y el enlace
-- simplemente no aparecía. Pero toda la fase 2 se apoya en el handle:
--   · /perfil/[username] es inalcanzable
--   · get_public_profile_v2(p_username) nunca encuentra a nadie
--   · las menciones @alguien no resuelven (create_feed_post_v2 busca por username)
--   · la búsqueda por handle no devuelve nada
--   · las listas de seguidores no enlazan a ningún lado
--
-- El handle se genera solo desde el nombre visible y se puede cambiar después.
-- Debe coincidir con la regex de menciones: [A-Za-z0-9_.]{3,24}.

create or replace function brote_slugify_handle(p_text text) returns text
language sql immutable set search_path = public as $fn$
  select nullif(
    substring(
      regexp_replace(
        regexp_replace(
          lower(translate(coalesce(p_text,''),
            'áàäâãéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ',
            'aaaaaeeeeiiiiooooouuuuncAAAAAEEEEIIIIOOOOOUUUUNC')),
          '[^a-z0-9._]+', '', 'g'),      -- fuera lo que la regex de menciones no acepta
        '^[._]+|[._]+$', '', 'g'),        -- sin puntos ni guiones al borde
      1, 20),
    '');
$fn$;

-- Elige un handle libre. El sufijo numérico sólo aparece si hace falta.
create or replace function brote_pick_username(p_uid uuid, p_seed text) returns text
language plpgsql security definer set search_path = public as $fn$
declare v_base text; v_try text; v_n int := 0;
begin
  v_base := brote_slugify_handle(p_seed);
  -- Un nombre de dos letras, o uno que era todo emoji, no sirve de base.
  if v_base is null or length(v_base) < 3 then
    v_base := 'brote' || substring(replace(p_uid::text, '-', ''), 1, 6);
  end if;
  loop
    v_try := case when v_n = 0 then v_base else v_base || v_n::text end;
    exit when not exists (select 1 from profiles where lower(username::text) = lower(v_try) and id <> p_uid);
    v_n := v_n + 1;
    if v_n > 9999 then
      v_try := 'brote' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 10);
      exit;
    end if;
  end loop;
  return v_try;
end $fn$;

create or replace function brote_ensure_username() returns trigger
language plpgsql security definer set search_path = public as $fn$
begin
  if new.username is null or btrim(new.username::text) = '' then
    new.username := brote_pick_username(new.id, coalesce(new.display_name, ''));
  end if;
  return new;
end $fn$;

drop trigger if exists trg_ensure_username_ins on profiles;
create trigger trg_ensure_username_ins before insert on profiles
for each row execute function brote_ensure_username();

drop trigger if exists trg_ensure_username_upd on profiles;
create trigger trg_ensure_username_upd before update of display_name on profiles
for each row when (new.username is null) execute function brote_ensure_username();

-- Backfill de las cuentas que ya existen.
do $blk$
declare r record;
begin
  for r in select id, display_name from profiles where username is null or btrim(username::text) = '' loop
    update profiles set username = brote_pick_username(r.id, coalesce(r.display_name, '')) where id = r.id;
  end loop;
end $blk$;

-- Cambiar el propio handle desde Ajustes.
create or replace function set_my_username(p_username text) returns jsonb
language plpgsql security definer set search_path = public as $fn$
declare v_uid uuid := auth.uid(); v_clean text;
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  v_clean := lower(btrim(coalesce(p_username, '')));
  if v_clean !~ '^[a-z0-9._]{3,24}$' then
    return jsonb_build_object('ok', false,
      'error', 'Usá entre 3 y 24 caracteres: letras, números, punto o guión bajo.');
  end if;
  if v_clean ~ '^[._]|[._]$' then
    return jsonb_build_object('ok', false, 'error', 'No puede empezar ni terminar con punto o guión bajo.');
  end if;
  if exists (select 1 from profiles where lower(username::text) = v_clean and id <> v_uid) then
    return jsonb_build_object('ok', false, 'error', 'Ese usuario ya está tomado.');
  end if;
  update profiles set username = v_clean where id = v_uid;
  return jsonb_build_object('ok', true, 'username', v_clean);
end $fn$;

revoke all on function set_my_username(text) from public, anon;
grant execute on function set_my_username(text) to authenticated;
revoke all on function brote_pick_username(uuid,text), brote_ensure_username() from public, anon, authenticated;
