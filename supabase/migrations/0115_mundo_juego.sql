-- 0115 — El juego del mundo: su propio guardado, su propia moneda, y ni una
-- línea que toque los puntos de la app.
--
-- docs/MUNDO_JUEGO.md §3.11 y §4. Lo que se juega en la isla (parcelas,
-- estaciones, misiones, la mochila, la tienda) vive en world_game.state, que
-- escribe el cliente —es un juego de un jugador sin ranking ni efecto afuera—
-- con topes que pone el servidor: lo ganado por día, la billetera que nunca
-- retrocede, y que nada del inventario supere lo que el nivel real descubrió.
--
-- Las SEMILLAS DEL MUNDO son otra cuenta. Hasta ahora el juego pagaba con
-- brote_grant_semillas al mismo saldo que la Academia y la Plaza; desde acá
-- ninguna función world_* lo toca. world_log_species y world_daily_chore
-- siguen existiendo (el censo y los contadores del día), pero sin pagar.
--
-- Sin OK explícito del dueño esta migración no se aplica.

-- ── El guardado ─────────────────────────────────────────────────────────────

create table if not exists public.world_game (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  state            jsonb not null default '{}'::jsonb,
  rev              int not null default 0,
  semillas_earned  bigint not null default 0,
  semillas_spent   bigint not null default 0,
  earned_day       date,
  earned_today     int not null default 0,
  updated_at       timestamptz not null default now()
);

-- Sin políticas: se lee y se escribe sólo por las funciones de abajo.
alter table public.world_game enable row level security;
revoke all on public.world_game from public, anon, authenticated;

-- ── El catálogo de la tienda, espejo de lib/world/game/shop.ts ─────────────
-- Un test compara las dos listas: agregar algo en un lado y no en el otro rompe.

create table if not exists public.world_items (
  slug   text primary key,
  kind   text not null check (kind in ('decor', 'habitat', 'sobre')),
  price  int  not null check (price >= 0),
  tier   int  not null check (tier between 1 and 11),
  div    int  not null default 1 check (div between 1 and 5)
);
alter table public.world_items enable row level security;
revoke all on public.world_items from public, anon, authenticated;

insert into public.world_items (slug, kind, price, tier, div) values
  ('mundo_comedero', 'decor', 60, 1, 1),
  ('mundo_banco', 'decor', 90, 1, 1),
  ('mundo_hamaca', 'decor', 150, 1, 1),
  ('banco_reciclado', 'decor', 60, 1, 1),
  ('maceta', 'decor', 30, 1, 1),
  ('cartel', 'decor', 40, 1, 1),
  ('sendero_piedra', 'decor', 20, 1, 1),
  ('mundo_colmena', 'decor', 160, 2, 1),
  ('mundo_farolitos', 'decor', 150, 2, 1),
  ('mundo_arco', 'decor', 180, 2, 1),
  ('cerco', 'decor', 25, 2, 1),
  ('mesa_picnic', 'decor', 120, 2, 1),
  ('mundo_huerta', 'decor', 200, 3, 1),
  ('mundo_totem', 'decor', 120, 3, 1),
  ('mundo_carpa', 'decor', 220, 3, 1),
  ('farol_solar', 'decor', 110, 3, 1),
  ('mundo_molino', 'decor', 320, 4, 1),
  ('hamaca_arbol', 'decor', 90, 4, 1),
  ('pergola', 'decor', 260, 5, 1),
  ('estanque', 'decor', 300, 6, 1),
  ('mirador', 'decor', 400, 8, 1),
  ('posadero', 'habitat', 40, 1, 1),
  ('bebedero', 'habitat', 80, 2, 1),
  ('hotel_chico', 'habitat', 70, 3, 1),
  ('caja_nido', 'habitat', 60, 5, 1),
  ('refugio_ranas', 'habitat', 70, 7, 1),
  ('pirca', 'habitat', 60, 8, 1),
  ('sobre_flechilla', 'sobre', 22, 1, 1),
  ('sobre_margarita_pampa', 'sobre', 22, 1, 1),
  ('sobre_chilca', 'sobre', 25, 1, 1),
  ('sobre_cortadera', 'sobre', 27, 2, 1),
  ('sobre_verbena', 'sobre', 29, 3, 1),
  ('sobre_lantana', 'sobre', 29, 3, 1),
  ('sobre_salvia_azul', 'sobre', 32, 3, 1),
  ('sobre_jazmin_pais', 'sobre', 32, 3, 1),
  ('sobre_tala', 'sobre', 43, 4, 1),
  ('sobre_ceibo', 'sobre', 47, 4, 1),
  ('sobre_algarrobo', 'sobre', 50, 5, 1),
  ('sobre_aguaribay', 'sobre', 50, 5, 1),
  ('sobre_junco', 'sobre', 36, 7, 1),
  ('sobre_camalote', 'sobre', 36, 7, 1),
  ('sobre_cardon', 'sobre', 54, 8, 1),
  ('sobre_chaguar', 'sobre', 43, 8, 1),
  ('sobre_yareta', 'sobre', 65, 9, 1),
  ('sobre_llareta_flor', 'sobre', 47, 9, 1),
  ('sobre_cachiyuyo', 'sobre', 47, 10, 1)
on conflict (slug) do update
  set kind = excluded.kind, price = excluded.price, tier = excluded.tier, div = excluded.div;

-- ── Guardar ─────────────────────────────────────────────────────────────────

create or replace function public.world_game_save(p_state jsonb, p_rev int)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  v_uid    uuid := auth.uid();
  v_row    public.world_game;
  v_today  date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
  v_earned bigint;
  v_spent  bigint;
  v_delta  bigint;
  v_total  int;
  v_tier   int;
  v_bad    text;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if p_state is null or jsonb_typeof(p_state) <> 'object' then
    return jsonb_build_object('ok', false, 'reason', 'bad_state');
  end if;
  if pg_column_size(p_state) > 262144 then
    return jsonb_build_object('ok', false, 'reason', 'too_big');
  end if;

  insert into public.world_game (user_id) values (v_uid) on conflict (user_id) do nothing;
  select * into v_row from public.world_game where user_id = v_uid for update;

  -- Otro dispositivo guardó antes: gana el servidor y el cliente recarga.
  if p_rev is distinct from v_row.rev then
    return jsonb_build_object('ok', false, 'reason', 'conflict', 'rev', v_row.rev, 'state', v_row.state);
  end if;

  begin
    v_earned := coalesce((p_state #>> '{sem,earned}')::bigint, 0);
    v_spent  := coalesce((p_state #>> '{sem,spent}')::bigint, 0);
  exception when others then
    return jsonb_build_object('ok', false, 'reason', 'bad_wallet');
  end;
  if v_earned < 0 or v_spent < 0 or v_spent > v_earned then
    return jsonb_build_object('ok', false, 'reason', 'bad_wallet');
  end if;
  -- La billetera nunca va para atrás: lo ganado y lo gastado son acumulados.
  if v_earned < v_row.semillas_earned or v_spent < v_row.semillas_spent then
    return jsonb_build_object('ok', false, 'reason', 'wallet_backwards');
  end if;

  -- El tope del día. 400 en las reglas; 50 de margen para un guardado que
  -- cruza la medianoche con lo de ayer adentro.
  v_delta := v_earned - v_row.semillas_earned;
  v_total := (case when v_row.earned_day = v_today then v_row.earned_today else 0 end) + v_delta;
  if v_total > 450 then
    return jsonb_build_object('ok', false, 'reason', 'over_daily_cap');
  end if;

  -- Nada del inventario puede estar más allá de lo que el nivel real descubrió.
  v_tier := world_tier_of(v_uid);
  select e.key into v_bad
    from jsonb_each(coalesce(p_state->'inv', '{}'::jsonb)) e
    left join public.world_items i on i.slug = e.key
   where i.slug is null or i.tier > v_tier
   limit 1;
  if v_bad is not null then
    return jsonb_build_object('ok', false, 'reason', 'item:' || v_bad);
  end if;

  update public.world_game
     set state = p_state,
         rev = rev + 1,
         semillas_earned = v_earned,
         semillas_spent = v_spent,
         earned_day = v_today,
         earned_today = v_total,
         updated_at = now()
   where user_id = v_uid;

  return jsonb_build_object('ok', true, 'rev', v_row.rev + 1);
end $fn$;

revoke all on function public.world_game_save(jsonb, int) from public, anon;
grant execute on function public.world_game_save(jsonb, int) to authenticated;

-- ── El censo y los contadores del día: sin pagar semillas de la app ─────────

create or replace function public.world_log_species(p_slug text, p_region text, p_tod text)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  v_uid   uuid := auth.uid();
  v_tier  int;
  v_min   int;
  v_first boolean := false;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  v_tier := world_tier_of(v_uid);

  select min_tier into v_min from world_species where slug = p_slug and active;
  if v_min is null then
    return jsonb_build_object('ok', false, 'reason', 'unknown_species');
  end if;
  if v_min > v_tier then
    return jsonb_build_object('ok', false, 'reason', 'above_tier');
  end if;

  insert into public.world_journal (user_id, species_slug, region, time_of_day, count)
  values (v_uid, p_slug, p_region, p_tod, 1)
  on conflict (user_id, species_slug) do update
    set count = world_journal.count + 1
  returning (xmax::text::bigint = 0) into v_first;

  -- El premio del primer avistaje lo paga el juego, en semillas del mundo.
  return jsonb_build_object('ok', true, 'first', v_first);
end $fn$;

create or replace function public.world_daily_chore(p_kind text)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  v_uid   uuid := auth.uid();
  v_today date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if p_kind not in ('chore', 'forage', 'event') then
    return jsonb_build_object('ok', false, 'reason', 'bad_kind');
  end if;
  insert into public.world_daily (user_id, local_date) values (v_uid, v_today)
  on conflict (user_id, local_date) do nothing;
  update public.world_daily
     set chores_done = chores_done + (case when p_kind = 'chore' then 1 else 0 end),
         forage_done = forage_done + (case when p_kind = 'forage' then 1 else 0 end),
         event_done  = event_done or p_kind = 'event'
   where user_id = v_uid and local_date = v_today;
  -- Ya no paga: los premios del juego son del juego.
  return jsonb_build_object('ok', true, 'awarded', 0);
end $fn$;

-- ── Colocar: lo que se compró en la tienda del mundo, o lo que ya se tenía ──

create or replace function public.world_placement_cap(p_tier int)
returns int language sql immutable set search_path = '' as $fn$
  select 8 + greatest(1, least(11, p_tier)) * 4;
$fn$;

create or replace function public.world_placements_reason(p_uid uuid, p_placements jsonb)
returns text language plpgsql stable security definer set search_path = public as $fn$
declare
  v_tier  int := world_tier_of(p_uid);
  v_item  jsonb;
  v_r     real := world_island_radius(v_tier);
  v_inv   jsonb := coalesce((select g.state->'inv' from world_game g where g.user_id = p_uid), '{}'::jsonb);
  v_slug  text;
  v_n     int;
begin
  if jsonb_typeof(p_placements) is distinct from 'array' then
    return 'payload_not_array';
  end if;
  if jsonb_array_length(p_placements) > world_placement_cap(v_tier) then
    return 'over_cap';
  end if;

  -- Cada objeto, cuántas veces se tiene: comprado en el mundo (con su cuenta)
  -- o una fila vieja de user_cosmetics (sin cuenta, como hasta ahora).
  for v_slug, v_n in
    select e->>'prop_slug', count(*) from jsonb_array_elements(p_placements) e group by 1
  loop
    if not exists (select 1 from user_cosmetics uc where uc.user_id = p_uid and uc.slug = v_slug)
       and coalesce((v_inv->>v_slug)::int, 0) < v_n then
      return 'prop_not_owned:' || coalesce(v_slug, '?');
    end if;
  end loop;

  for v_item in select * from jsonb_array_elements(p_placements) loop
    if world_region_tier(v_item->>'region') > v_tier then
      return 'region_locked:' || coalesce(v_item->>'region', '?');
    end if;
    -- El islote queda afuera del radio de la isla principal; 1,4 lo cubre.
    if sqrt(power((v_item->>'x')::real, 2) + power((v_item->>'z')::real, 2)) > v_r * 1.4 then
      return 'off_island';
    end if;
  end loop;

  return null;
end $fn$;

revoke all on function public.world_placement_cap(int) from public, anon;
revoke all on function public.world_placements_reason(uuid, jsonb) from public, anon, authenticated;

-- ── Visitar: la isla de otro se ve como está, con sus parcelas y estaciones ──

create or replace function public.world_snapshot_for(p_username text)
returns jsonb language plpgsql stable security definer set search_path = public as $fn$
declare
  v_me   uuid := auth.uid();
  v_them uuid;
  v_vis  text;
begin
  if v_me is null then raise exception 'not authenticated'; end if;

  select id, coalesce(profile_visibility, 'public') into v_them, v_vis
    from profiles where username = p_username;
  if v_them is null then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if exists (select 1 from user_blocks b
              where (b.blocker_id = v_them and b.blocked_id = v_me)
                 or (b.blocker_id = v_me and b.blocked_id = v_them))
     or exists (select 1 from user_mutes m where m.muter_id = v_me and m.muted_id = v_them)
  then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if v_vis <> 'public' and v_them <> v_me then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  return coalesce((
    select jsonb_build_object(
      'ok', true,
      'tier',        greatest(1, least(11, coalesce((p.mundo_state->>'rankTier')::int, 1))),
      'seed',        w.seed,
      'palette',     coalesce(p.mundo_state->>'palette', 'default'),
      'worldIndex',  coalesce((p.mundo_state->>'worldIndex')::int, 1),
      'pipStyle',    coalesce(p.pip_style, '{}'::jsonb),
      'displayName', p.display_name,
      'placements',  coalesce((select jsonb_agg(jsonb_build_object(
                                 'prop_slug', pl.prop_slug, 'region', pl.region,
                                 'x', pl.x, 'z', pl.z, 'rot_y', pl.rot_y, 'variant', pl.variant))
                                 from world_placements pl where pl.user_id = v_them), '[]'::jsonb),
      -- Sólo lo que se ve: etapas de parcelas y niveles de estaciones. Ni la
      -- mochila, ni la billetera, ni las misiones de nadie.
      'game',        coalesce((select jsonb_build_object(
                                 'parcels', coalesce(g.state->'parcels', '{}'::jsonb),
                                 'stations', coalesce(g.state->'stations', '{}'::jsonb))
                                 from world_game g where g.user_id = v_them), '{}'::jsonb))
      from profiles p join user_world w on w.user_id = p.id
     where p.id = v_them
  ), jsonb_build_object('ok', false, 'reason', 'no_world'));
end $fn$;

-- ── El arranque: el juego y el progreso real llegan en el mismo viaje ───────

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
    'world',       to_jsonb(v_row),
    'mundo',       p.mundo_state,
    'pip',         coalesce(p.pip_style, '{}'::jsonb),
    -- Las semillas que ve el mundo son las del mundo. Nunca profiles.semillas.
    'semillas',    coalesce((select g.semillas_earned - g.semillas_spent from world_game g where g.user_id = v_uid), 0),
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
                     '[]'::jsonb),
    'projectMarkers', public.world_project_markers(),
    -- El juego: el guardado y su versión, o nada la primera vez.
    'game',        (select jsonb_build_object('state', g.state, 'rev', g.rev)
                      from world_game g where g.user_id = v_uid),
    -- El eje real, con su división: lo único de la app que decide qué hay.
    'progress',    jsonb_build_object(
                     'tier', v_tier,
                     'div',  greatest(1, least(5, coalesce(p.current_division, 1))))
  ) into v_out from public.profiles p where p.id = v_uid;

  return v_out;
end $fn$;

revoke all on function public.world_bootstrap() from public, anon;
grant execute on function public.world_bootstrap() to authenticated;

-- ── Tres especies que ahora se plantan desde el nivel 1 ─────────────────────
-- La chilca es la pionera: es la primera en volver a un suelo pelado. Que el
-- juego la ofrezca en El Claro y el censo no la acepte hasta el nivel 5 sería
-- una contradicción que se ve.

update public.world_species set min_tier = 1, region = 'claro'
 where slug in ('flechilla', 'margarita_pampa', 'chilca');
