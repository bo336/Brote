-- ============================================================================
-- MUNDO — los mojones de proyecto
--
-- `11-GAME-LOOP.md` §5 pilar 5: cada proyecto real al que el usuario fue deja
-- un pequeño mojón conmemorativo en la isla, con la fecha y el lugar. Te
-- acercás y te cuenta qué hiciste. **El vínculo emocional más fuerte del
-- diseño, y casi gratis de construir.**
--
-- Puramente aditivo: una función nueva que sólo lee, y `world_bootstrap`
-- devolviendo un campo más. Ninguna tabla cambia, ningún dato existente se
-- toca, y acá no se escribe XP ni semillas por ningún lado.
-- ============================================================================

-- Los proyectos a los que este usuario **fue**, más recientes primero.
--
-- Fue, no se anotó: un mojón por una intención sería un recuerdo inventado, y
-- la isla no inventa recuerdos por la misma razón por la que no inventa cifras
-- (`13-IMPACT-MIRROR.md` §1).
--
-- Uno por proyecto aunque haya ido cinco veces: la isla es chica, y cinco
-- piedras iguales en fila no cuentan una historia mejor que una.
create or replace function public.world_project_markers()
returns jsonb language sql stable security definer set search_path = public as $fn$
  select coalesce(jsonb_agg(to_jsonb(q) order by q.date desc), '[]'::jsonb)
  from (
    select distinct on (p.id)
      p.id::text                                                        as id,
      p.title                                                           as title,
      coalesce(nullif(btrim(p.neighborhood), ''), nullif(btrim(p.city), '')) as place,
      to_char(s.held_at at time zone 'America/Argentina/Buenos_Aires', 'YYYY-MM-DD') as date
    from public.project_session_attendees a
    join public.project_sessions s on s.id = a.session_id
    join public.projects p on p.id = s.project_id
    where a.user_id = auth.uid()
    order by p.id, s.held_at desc
  ) q;
$fn$;

revoke all on function public.world_project_markers() from public, anon;
grant execute on function public.world_project_markers() to authenticated;

-- ------------------------------------------------------------- El bootstrap
-- Idéntico a 0094 más una línea: un solo viaje de ida y vuelta sigue siendo un
-- solo viaje (`20-ACCEPTANCE.md` 4B).
create or replace function public.world_bootstrap()
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_uid uuid := auth.uid(); v_row public.user_world; v_out jsonb; v_tier int;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  -- La semilla sale del id, así que la isla de alguien es siempre la misma
  -- isla, en cualquier dispositivo y sin guardar geometría en ningún lado.
  insert into public.user_world (user_id, seed)
  values (v_uid, ('x' || substr(md5(v_uid::text), 1, 15))::bit(60)::bigint)
  on conflict (user_id) do nothing;

  update public.user_world set last_entered_at = now(), updated_at = now()
   where user_id = v_uid returning * into v_row;

  v_tier := world_tier_of(v_uid);

  select jsonb_build_object(
    'userId',      v_uid,
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
    -- Los niveles que subió y todavía no se celebraron, en orden. La ceremonia
    -- se encola sola; no hay forma de que se pierda una subida por no estar
    -- mirando la pantalla en ese momento.
    'pendingCeremonies', coalesce(
                     (select jsonb_agg(t order by t)
                        from generate_series(v_row.celebrated_tier + 1, v_tier) t
                       where v_tier > v_row.celebrated_tier),
                     '[]'::jsonb),
    -- Lo único que la isla aprende del resto de la app además del impacto.
    'projectMarkers', public.world_project_markers()
  ) into v_out from public.profiles p where p.id = v_uid;

  return v_out;
end $fn$;

revoke all on function public.world_bootstrap() from public, anon;
grant execute on function public.world_bootstrap() to authenticated;
