-- ============================================================================
-- MUNDO — la semilla, reducida donde todavía tiene precisión.
--
-- `user_world.seed` son 60 bits (`md5` recortado a 15 dígitos hex). Un `number`
-- de JavaScript guarda 53, así que el cliente recibe el valor **redondeado**:
--
--   1121143978883168197  ->  1121143978883168300
--
-- Los 7 bits que se pierden son los de abajo, y los de abajo son justo los que
-- un `>>> 0` conserva. `mulberry32` quiere 32 bits; de esos 32, siete llegaban
-- siempre en cero. La semilla de cada isla tenía 25 bits útiles en vez de 32, y
-- ninguna forma de notarlo desde el cliente.
--
-- El arreglo es hacer la reducción en Postgres, que sí tiene los 60 bits, y
-- mandar un entero que entra en un `number` sin redondeo. `to_jsonb(v_row)`
-- sigue llevando el `seed` completo dentro de `world` para lo que sea que lo
-- necesite en su forma original.
--
-- Todavía no hay nada generando desde este campo — la isla se arma hasheando el
-- `userId`. Se arregla ahora porque una fase que lo conecte heredaría el error
-- sin verlo.
-- ============================================================================

create or replace function public.world_bootstrap()
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_uid uuid := auth.uid(); v_row public.user_world; v_out jsonb; v_tier int;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  insert into public.user_world (user_id, seed)
  values (v_uid, ('x' || substr(md5(v_uid::text), 1, 15))::bit(60)::bigint)
  on conflict (user_id) do nothing;

  update public.user_world set last_entered_at = now(), updated_at = now()
   where user_id = v_uid returning * into v_row;

  v_tier := world_tier_of(v_uid);

  select jsonb_build_object(
    'userId',      v_uid,
    -- Reducida acá, con los 60 bits todavía a mano.
    'seed',        (v_row.seed % 2147483647)::int,
    'world',       to_jsonb(v_row),
    'mundo',       p.mundo_state,
    'pip',         coalesce(p.pip_style, '{}'::jsonb),
    'semillas',    coalesce(p.semillas, 0),
    'impact',      public.brote_user_impact(v_uid),
    'ownedCosmetics', coalesce(
                     (select jsonb_agg(uc.slug) from user_cosmetics uc where uc.user_id = v_uid),
                     '[]'::jsonb),
    'placements',  coalesce((select jsonb_agg(to_jsonb(w))
                               from public.world_placements w where w.user_id = v_uid), '[]'::jsonb),
    'journal',     coalesce((select jsonb_agg(to_jsonb(j))
                               from public.world_journal j where j.user_id = v_uid), '[]'::jsonb),
    'dailyState',  coalesce((select to_jsonb(d) from public.world_daily d
                              where d.user_id = v_uid
                                and d.local_date = (now() at time zone 'America/Argentina/Buenos_Aires')::date),
                            '{}'::jsonb),
    'pendingCeremonies', coalesce(
                     (select jsonb_agg(t order by t)
                        from generate_series(v_row.celebrated_tier + 1, v_tier) t
                       where v_tier > v_row.celebrated_tier),
                     '[]'::jsonb)
  ) into v_out from public.profiles p where p.id = v_uid;

  return v_out;
end $fn$;

revoke all on function public.world_bootstrap() from public, anon;
grant execute on function public.world_bootstrap() to authenticated;
