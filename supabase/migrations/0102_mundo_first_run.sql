-- 0102 — Los primeros tres minutos: una sola marca, en el servidor.
--
-- `11-GAME-LOOP.md` §7. Si esto viviera en `localStorage` el tutorial volvería
-- a arrancar en el segundo dispositivo, que es exactamente la clase de cosa que
-- se lee como un bug, y `01-RULES.md` §2 no permite estado autoritativo ahí.
--
-- Puramente aditivo: una columna que se agrega vacía y una función nueva.
-- `world_bootstrap` devuelve `to_jsonb(user_world)` entero, así que la columna
-- llega sola y no hay que volver a escribir esa función.

alter table public.user_world
  add column if not exists onboarded_at timestamptz;

-- Las islas que ya existen ya vieron el mundo: nadie que estuvo jugando meses
-- merece un tutorial. Sólo las que nunca se entraron quedan sin marcar.
update public.user_world
   set onboarded_at = coalesce(last_entered_at, created_at)
 where onboarded_at is null
   and last_entered_at is not null;

create or replace function public.world_mark_onboarded()
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  -- `coalesce` y no un set a secas: la primera vez es la que vale, y volver a
  -- llamar no puede correr la fecha hacia adelante.
  update public.user_world
     set onboarded_at = coalesce(onboarded_at, now()), updated_at = now()
   where user_id = v_uid;
  return jsonb_build_object('ok', true);
end $fn$;

revoke all on function public.world_mark_onboarded() from public, anon;
grant execute on function public.world_mark_onboarded() to authenticated;
