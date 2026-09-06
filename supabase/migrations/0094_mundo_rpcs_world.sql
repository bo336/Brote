-- ============================================================================
-- MUNDO — las RPC del mundo: arranque, colocación y ceremonias.
--
-- Todas `security definer`, todas revocadas de `public` y `anon`, todas
-- validando del lado del servidor. **Nunca se le cree al cliente** una entrega
-- de semillas, un tope de placements ni un desbloqueo (15-DATA-MODEL.md §4).
--
-- Las de jugar (bitácora, tareas, visitas, contador colectivo) van en 0095.
-- ============================================================================

-- ---------------------------------------------------------------- Helpers
-- Estos tres espejan `lib/world/progression.ts`. Son la misma escalera vista
-- desde el otro lado: el cliente la usa para dibujar y el servidor para
-- decidir, y si alguna vez se separan gana el servidor. Si cambia la
-- generación, cambian las dos — no hay forma de que Postgres importe el módulo.

create or replace function public.world_region_tier(p_region text)
returns int language sql immutable as $fn$
  select case p_region
    when 'claro' then 1 when 'pradera' then 2 when 'jardin' then 3
    when 'arboleda' then 4 when 'rio' then 7 when 'monte' then 8
    when 'cumbre' then 9 when 'islote' then 10 when 'monumento' then 11
    else 99 end;
$fn$;

create or replace function public.world_island_radius(p_tier int)
returns real language sql immutable as $fn$
  select (array[18,24,30,34,38,42,48,54,57,60,60])[greatest(1, least(11, p_tier))]::real;
$fn$;

-- El tope de piezas colocadas: cuatro de arranque y tres por nivel.
create or replace function public.world_placement_cap(p_tier int)
returns int language sql immutable as $fn$
  select 4 + greatest(1, least(11, p_tier)) * 3;
$fn$;

-- El nivel del jugador sale de `profiles.mundo_state`, que es propiedad de
-- Postgres y contrato cerrado. El mundo lo lee; el mundo no lo escribe nunca.
create or replace function public.world_tier_of(p_uid uuid)
returns int language sql stable security definer set search_path = public as $fn$
  select greatest(1, least(11, coalesce((mundo_state->>'rankTier')::int, 1)))
  from profiles where id = p_uid;
$fn$;

-- ------------------------------------------------------------- Validación
-- Un solo lugar decide si un lote de placements es legal, porque
-- `world_save_placements` y `world_save_layout` tienen que decidir igual.
-- Devuelve null si está todo bien, o el motivo del rechazo.
create or replace function public.world_placements_reason(p_uid uuid, p_placements jsonb)
returns text language plpgsql stable security definer set search_path = public as $fn$
declare
  v_tier int := world_tier_of(p_uid);
  v_item jsonb;
  v_r real := world_island_radius(v_tier);
begin
  if jsonb_typeof(p_placements) is distinct from 'array' then
    return 'payload_not_array';
  end if;
  if jsonb_array_length(p_placements) > world_placement_cap(v_tier) then
    return 'over_cap';
  end if;

  for v_item in select * from jsonb_array_elements(p_placements) loop
    -- La pieza tiene que ser suya. Se compra con semillas; no se coloca lo que
    -- no se compró.
    if not exists (
      select 1 from user_cosmetics uc
      where uc.user_id = p_uid and uc.slug = (v_item->>'prop_slug')
    ) then
      return 'prop_not_owned:' || coalesce(v_item->>'prop_slug', '?');
    end if;

    -- La región tiene que estar abierta para su nivel.
    if world_region_tier(v_item->>'region') > v_tier then
      return 'region_locked:' || coalesce(v_item->>'region', '?');
    end if;

    -- Y las coordenadas, dentro de la isla que ese nivel realmente tiene.
    if sqrt(power((v_item->>'x')::real, 2) + power((v_item->>'z')::real, 2)) > v_r then
      return 'off_island';
    end if;
  end loop;

  return null;
end $fn$;

-- ------------------------------------------------------------ Arranque
-- Crea la fila en la primera visita y devuelve todo lo que el juego necesita,
-- en UN viaje. Durante la partida no hay más llamadas a Supabase que el
-- autoguardado con debounce y las RPC de interacción.
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
                     '[]'::jsonb)
  ) into v_out from public.profiles p where p.id = v_uid;

  return v_out;
end $fn$;

-- ------------------------------------------------------- Guardar la isla
-- Reemplaza los placements del jugador de forma atómica. Rechaza el lote
-- entero ante cualquier fallo y dice por qué: media isla guardada es peor que
-- ninguna.
create or replace function public.world_save_placements(p_placements jsonb)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare v_uid uuid := auth.uid(); v_reason text;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  v_reason := world_placements_reason(v_uid, p_placements);
  if v_reason is not null then
    return jsonb_build_object('ok', false, 'reason', v_reason);
  end if;

  delete from public.world_placements where user_id = v_uid;
  insert into public.world_placements (user_id, prop_slug, region, x, z, rot_y, variant)
  select v_uid,
         e->>'prop_slug',
         e->>'region',
         (e->>'x')::real,
         (e->>'z')::real,
         coalesce((e->>'rot_y')::real, 0),
         coalesce((e->>'variant')::smallint, 0)
    from jsonb_array_elements(p_placements) e;

  update public.user_world set updated_at = now() where user_id = v_uid;

  return jsonb_build_object('ok', true, 'count', jsonb_array_length(p_placements));
end $fn$;

-- --------------------------------------------------------- Guardar arreglo
-- Hasta tres arreglos guardados sin plan. Misma validación que arriba: un
-- arreglo que no se puede colocar no se puede guardar.
create or replace function public.world_save_layout(p_name text, p_placements jsonb)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  v_uid uuid := auth.uid();
  v_reason text;
  v_layouts jsonb;
  v_max int;
  v_name text := left(btrim(coalesce(p_name, '')), 40);
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if v_name = '' then return jsonb_build_object('ok', false, 'reason', 'name_empty'); end if;

  v_reason := world_placements_reason(v_uid, p_placements);
  if v_reason is not null then
    return jsonb_build_object('ok', false, 'reason', v_reason);
  end if;

  select coalesce(layouts, '[]'::jsonb) into v_layouts
    from public.user_world where user_id = v_uid;
  select case when plan = 'free' then 3 else 10 end into v_max
    from public.profiles where id = v_uid;

  -- Guardar sobre un nombre que ya existe lo pisa; sólo un nombre nuevo cuenta
  -- contra el tope.
  v_layouts := coalesce(
    (select jsonb_agg(l) from jsonb_array_elements(v_layouts) l where l->>'name' is distinct from v_name),
    '[]'::jsonb);

  if jsonb_array_length(v_layouts) >= v_max then
    return jsonb_build_object('ok', false, 'reason', 'layout_cap', 'max', v_max);
  end if;

  v_layouts := v_layouts || jsonb_build_array(
    jsonb_build_object('name', v_name, 'placements', p_placements, 'saved_at', now()));

  update public.user_world
     set layouts = v_layouts, updated_at = now()
   where user_id = v_uid;

  return jsonb_build_object('ok', true, 'layouts', jsonb_array_length(v_layouts), 'max', v_max);
end $fn$;

-- ----------------------------------------------------------- Ceremonias
-- Monótona: sólo sube. Es lo único que impide que una ceremonia se repita cada
-- vez que se entra a la isla.
create or replace function public.world_mark_celebrated(p_tier int, p_world int)
returns void language plpgsql security definer set search_path = public as $fn$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  update public.user_world
     set celebrated_tier  = greatest(celebrated_tier, coalesce(p_tier, 0)),
         celebrated_world = greatest(celebrated_world, coalesce(p_world, 0)),
         updated_at       = now()
   where user_id = v_uid;
end $fn$;

-- -------------------------------------------------------------- El póster
-- La URL tiene que estar bajo el prefijo de este usuario. Sin eso, cualquiera
-- podría apuntar su póster al archivo de otra persona.
create or replace function public.world_set_snapshot(p_url text)
returns void language plpgsql security definer set search_path = public as $fn$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if p_url is null or position(('/' || v_uid::text || '/') in p_url) = 0 then
    raise exception 'snapshot url must live under this user prefix';
  end if;
  update public.user_world
     set last_snapshot_url = p_url, updated_at = now()
   where user_id = v_uid;
end $fn$;

-- ------------------------------------------------------------- Permisos
revoke all on function public.world_region_tier(text)               from public, anon;
revoke all on function public.world_island_radius(int)              from public, anon;
revoke all on function public.world_placement_cap(int)              from public, anon;
revoke all on function public.world_tier_of(uuid)                   from public, anon;
revoke all on function public.world_placements_reason(uuid, jsonb)  from public, anon;
revoke all on function public.world_bootstrap()                     from public, anon;
revoke all on function public.world_save_placements(jsonb)          from public, anon;
revoke all on function public.world_save_layout(text, jsonb)        from public, anon;
revoke all on function public.world_mark_celebrated(int, int)       from public, anon;
revoke all on function public.world_set_snapshot(text)              from public, anon;

grant execute on function public.world_bootstrap()                  to authenticated;
grant execute on function public.world_save_placements(jsonb)       to authenticated;
grant execute on function public.world_save_layout(text, jsonb)     to authenticated;
grant execute on function public.world_mark_celebrated(int, int)    to authenticated;
grant execute on function public.world_set_snapshot(text)           to authenticated;
