-- 0038 — SEMILLAS + COSMÉTICOS (PLAN F5.1 / F11.2)
--
-- Hasta acá Brote solo sabía DAR: XP, rangos, títulos, insignias, mundo. No
-- había nada en qué gastar, así que el personalizador de Pip regalaba sus 864
-- combinaciones el primer día y después no quedaba motivo para volver.
--
-- Las Semillas son la moneda blanda: se ganan haciendo lo que ya importa
-- (retos, jornada completa, racha, mundo terminado, subir de rango, objetivos,
-- lecciones) y se gastan en cosas que se VEN — accesorios de Pip y
-- decoraciones que aparecen de verdad en Tu Mundo.
--
-- Reglas duras:
--   * Las Semillas NO se compran con dinero y NO afectan puntos, rangos ni
--     rankings. Son puramente cosméticas: nadie puede comprar posiciones.
--   * Todo movimiento pasa por brote_grant_semillas() y queda en semilla_ledger.
--     El saldo es un cache; el ledger es la verdad.
--   * Nadie puede escribir su propio saldo: las tablas son de solo lectura para
--     el usuario y los otorgamientos son SECURITY DEFINER con EXECUTE revocado.

-- ─────────────────────────────────────────────────────────────────────────────
-- Saldo + libro mayor
-- ─────────────────────────────────────────────────────────────────────────────

alter table profiles add column if not exists semillas int not null default 0;

create table if not exists semilla_ledger (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  amount     int  not null,           -- > 0 ganadas, < 0 gastadas
  source     text not null,           -- challenge | daily_set | streak | world | rank | goal | lesson | purchase | backfill
  ref        text,
  note_es    text,
  created_at timestamptz not null default now()
);

create index if not exists semilla_ledger_user_idx on semilla_ledger (user_id, created_at desc);

alter table semilla_ledger enable row level security;
drop policy if exists "ledger propio" on semilla_ledger;
create policy "ledger propio" on semilla_ledger for select using ((select auth.uid()) = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Catálogo de cosméticos
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists cosmetics (
  slug           text primary key,
  kind           text not null check (kind in ('pip_body','pip_hat','pip_glasses','pip_pattern','mundo')),
  -- Para los de Pip: el valor que se guarda en profiles.pip_style. Para las
  -- decoraciones del mundo es null (se identifican por slug).
  value          text,
  name_es        text not null,
  description_es text,
  price          int  not null check (price >= 0),
  pro_only       boolean not null default false,
  min_rank_tier  int  not null default 1,
  sort           int  not null default 100,
  active         boolean not null default true
);

create unique index if not exists cosmetics_kind_value_idx on cosmetics (kind, value) where value is not null;

alter table cosmetics enable row level security;
drop policy if exists "catálogo visible" on cosmetics;
create policy "catálogo visible" on cosmetics for select using (true);

create table if not exists user_cosmetics (
  user_id     uuid not null references profiles(id) on delete cascade,
  slug        text not null references cosmetics(slug) on delete cascade,
  acquired_at timestamptz not null default now(),
  equipped    boolean not null default false,
  primary key (user_id, slug)
);

create index if not exists user_cosmetics_user_idx on user_cosmetics (user_id);

alter table user_cosmetics enable row level security;
drop policy if exists "cosméticos propios" on user_cosmetics;
create policy "cosméticos propios" on user_cosmetics for select using ((select auth.uid()) = user_id);
-- Sin políticas de insert/update/delete a propósito: sólo se compra y se equipa
-- por RPC. Un PATCH directo no puede regalarse nada.

-- ─────────────────────────────────────────────────────────────────────────────
-- Otorgar (interno)
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function brote_grant_semillas(
  p_uid uuid, p_amount int, p_source text, p_ref text default null, p_note text default null
) returns int
language plpgsql security definer set search_path to 'public' as $$
declare v_balance int;
begin
  if p_uid is null or coalesce(p_amount, 0) = 0 then
    select semillas into v_balance from profiles where id = p_uid;
    return coalesce(v_balance, 0);
  end if;
  update profiles set semillas = greatest(0, semillas + p_amount) where id = p_uid
    returning semillas into v_balance;
  if not found then return 0; end if;
  insert into semilla_ledger (user_id, amount, source, ref, note_es)
  values (p_uid, p_amount, p_source, p_ref, p_note);
  return v_balance;
end $$;

revoke all on function brote_grant_semillas(uuid, int, text, text, text) from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- Comprar y equipar
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function buy_cosmetic(p_slug text) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare
  v_uid uuid := auth.uid(); v_c cosmetics%rowtype; v_prof profiles%rowtype;
  v_tier int; v_balance int;
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  select * into v_c from cosmetics where slug = p_slug and active;
  if not found then raise exception 'Ese artículo no existe'; end if;
  select * into v_prof from profiles where id = v_uid for update;
  if not found then raise exception 'Perfil no encontrado'; end if;

  if exists (select 1 from user_cosmetics where user_id = v_uid and slug = p_slug) then
    return jsonb_build_object('ok', false, 'reason', 'owned', 'balance', v_prof.semillas);
  end if;
  if v_c.pro_only and not brote_is_pro(v_uid) then
    return jsonb_build_object('ok', false, 'reason', 'pro_only', 'balance', v_prof.semillas);
  end if;
  v_tier := (brote_get_rank(v_prof.total_xp)->>'tier')::int;
  if v_tier < v_c.min_rank_tier then
    return jsonb_build_object('ok', false, 'reason', 'rank', 'balance', v_prof.semillas,
                              'min_rank_tier', v_c.min_rank_tier);
  end if;
  if v_prof.semillas < v_c.price then
    return jsonb_build_object('ok', false, 'reason', 'funds', 'balance', v_prof.semillas,
                              'price', v_c.price);
  end if;

  v_balance := brote_grant_semillas(v_uid, -v_c.price, 'purchase', v_c.slug, v_c.name_es);
  insert into user_cosmetics (user_id, slug, equipped)
  values (v_uid, v_c.slug, v_c.kind = 'mundo')
  on conflict (user_id, slug) do nothing;

  return jsonb_build_object('ok', true, 'balance', v_balance, 'slug', v_c.slug, 'kind', v_c.kind);
end $$;

-- Equipar sólo aplica a las decoraciones del mundo: lo de Pip se guarda en
-- profiles.pip_style y lo valida el trigger de más abajo.
create or replace function equip_cosmetic(p_slug text, p_on boolean) returns jsonb
language plpgsql security definer set search_path to 'public' as $$
declare v_uid uuid := auth.uid(); v_kind text; v_count int;
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  select kind into v_kind from cosmetics where slug = p_slug and active;
  if v_kind is null then raise exception 'Ese artículo no existe'; end if;
  if v_kind <> 'mundo' then raise exception 'Eso se cambia desde el personalizador de Pip'; end if;
  if not exists (select 1 from user_cosmetics where user_id = v_uid and slug = p_slug) then
    raise exception 'Todavía no es tuyo';
  end if;

  if p_on then
    select count(*) into v_count from user_cosmetics uc join cosmetics c using (slug)
      where uc.user_id = v_uid and uc.equipped and c.kind = 'mundo' and uc.slug <> p_slug;
    -- Tope por rendimiento del canvas, no por diseño de producto.
    if v_count >= 8 then
      return jsonb_build_object('ok', false, 'reason', 'max', 'max', 8);
    end if;
  end if;

  update user_cosmetics set equipped = p_on where user_id = v_uid and slug = p_slug;
  return jsonb_build_object('ok', true, 'slug', p_slug, 'equipped', p_on);
end $$;

-- Todo lo que la tienda necesita, en una sola ida y vuelta.
create or replace function shop_state() returns jsonb
language sql security definer set search_path to 'public' stable as $$
  select jsonb_build_object(
    'balance', (select semillas from profiles where id = auth.uid()),
    'rank_tier', (select (brote_get_rank(total_xp)->>'tier')::int from profiles where id = auth.uid()),
    'is_pro', brote_is_pro(auth.uid()),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'slug', c.slug, 'kind', c.kind, 'value', c.value, 'name_es', c.name_es,
        'description_es', c.description_es, 'price', c.price, 'pro_only', c.pro_only,
        'min_rank_tier', c.min_rank_tier,
        'owned', uc.user_id is not null,
        'equipped', coalesce(uc.equipped, false)
      ) order by c.kind, c.sort, c.price)
      from cosmetics c
      left join user_cosmetics uc on uc.slug = c.slug and uc.user_id = auth.uid()
      where c.active), '[]'::jsonb),
    'recent', coalesce((
      select jsonb_agg(jsonb_build_object('amount', amount, 'source', source, 'note_es', note_es,
                                          'created_at', created_at) order by created_at desc)
      from (select * from semilla_ledger where user_id = auth.uid()
            order by created_at desc limit 12) l), '[]'::jsonb)
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Nadie se pone un accesorio que no compró
-- ─────────────────────────────────────────────────────────────────────────────
--
-- pip_style se guarda con un update directo desde el cliente (política RLS de
-- perfil propio). Sin esto, cualquiera podría mandar el sombrero premium por
-- PATCH y saltearse la tienda entera. Los valores gratuitos no están en
-- `cosmetics`, así que no se tocan.

create or replace function brote_validate_pip_style() returns trigger
language plpgsql security definer set search_path to 'public' as $$
declare r record; v_val text;
begin
  if new.pip_style is not distinct from old.pip_style then return new; end if;
  for r in select kind, key from (values
      ('pip_body','body'), ('pip_hat','hat'), ('pip_glasses','glasses'), ('pip_pattern','pattern')
    ) as t(kind, key)
  loop
    v_val := new.pip_style ->> r.key;
    if v_val is null or v_val = '' or v_val = 'ninguno' then continue; end if;
    if exists (select 1 from cosmetics c where c.kind = r.kind and c.value = v_val and c.active)
       and not exists (
         select 1 from user_cosmetics uc join cosmetics c using (slug)
         where uc.user_id = new.id and c.kind = r.kind and c.value = v_val)
    then
      raise exception 'Ese accesorio todavía no es tuyo' using errcode = 'P0001';
    end if;
  end loop;
  return new;
end $$;

drop trigger if exists brote_validate_pip_style_trg on profiles;
create trigger brote_validate_pip_style_trg
  before update of pip_style on profiles
  for each row execute function brote_validate_pip_style();

-- ─────────────────────────────────────────────────────────────────────────────
-- Catálogo
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Precios pensados sobre lo que rinde jugar: un día completo con sus retos deja
-- ~40-60 semillas, así que un accesorio chico sale un par de días y una
-- decoración grande del mundo, una semana larga. Nada acá se compra con plata.

insert into cosmetics (slug, kind, value, name_es, description_es, price, pro_only, min_rank_tier, sort) values
  -- Pip · colores
  ('pip_body_aurora',      'pip_body',    'aurora',      'Aurora',      'Verdes fríos con destello violeta.',              120, false, 1, 10),
  ('pip_body_bosque',      'pip_body',    'bosque',      'Bosque',      'El verde profundo de un monte cerrado.',          120, false, 1, 11),
  ('pip_body_atardecer',   'pip_body',    'atardecer',   'Atardecer',   'Naranjas tibios de las seis de la tarde.',        150, false, 2, 12),
  ('pip_body_glaciar',     'pip_body',    'glaciar',     'Glaciar',     'Azules de hielo con la hoja escarchada.',         150, false, 2, 13),
  ('pip_body_cosmos',      'pip_body',    'cosmos',      'Cosmos',      'Violeta noche con brillos. Exclusivo de Brote+.', 250, true,  1, 14),
  -- Pip · sombreros
  ('pip_hat_sombrero',     'pip_hat',     'sombrero',    'Sombrero',    'De paja, para el sol del mediodía.',               90, false, 1, 20),
  ('pip_hat_casco',        'pip_hat',     'casco',       'Casco',       'Para pedalear tranquilo.',                         90, false, 1, 21),
  ('pip_hat_visera',      'pip_hat',     'visera',      'Gorra',       'Con visera, mirando al frente.',                  110, false, 1, 22),
  ('pip_hat_aureola',      'pip_hat',     'aureola',     'Aureola',     'Un anillo de luz que flota. Cuesta, y se nota.',  200, false, 3, 23),
  -- Pip · anteojos
  ('pip_glasses_aviador',  'pip_glasses', 'aviador',     'Aviador',     'Metálicos, con reflejo.',                          80, false, 1, 30),
  ('pip_glasses_pixel',    'pip_glasses', 'pixel',       'Pixelados',   'Ocho bits de actitud.',                            80, false, 1, 31),
  -- Pip · estampas
  ('pip_pattern_hojitas',  'pip_pattern', 'hojitas',     'Hojitas',     'Hojas chiquitas por todo el cuerpo.',              70, false, 1, 40),
  ('pip_pattern_estrellas','pip_pattern', 'estrellitas', 'Estrellitas', 'Un cielo diminuto.',                               70, false, 1, 41),
  ('pip_pattern_olitas',   'pip_pattern', 'olitas',      'Olitas',      'Ondas de agua en movimiento.',                     70, false, 1, 42),
  -- Mundo · decoraciones
  ('mundo_comedero',  'mundo', null, 'Comedero de pájaros', 'Un poste con techito. Los pájaros lo van a encontrar.',      110, false, 1, 50),
  ('mundo_banco',     'mundo', null, 'Banco del mirador',   'Madera gastada mirando al agua.',                            130, false, 1, 51),
  ('mundo_hamaca',    'mundo', null, 'Hamaca paraguaya',    'Colgada entre dos árboles, se mueve con el viento.',         160, false, 1, 52),
  ('mundo_colmena',   'mundo', null, 'Colmena',             'Cajones apilados y abejas dando vueltas.',                   180, false, 2, 53),
  ('mundo_farolitos', 'mundo', null, 'Farolitos',           'Una guirnalda sobre el sendero. De noche se prende.',        200, false, 2, 54),
  ('mundo_arco',      'mundo', null, 'Arco de flores',      'Un arco cubierto de enredaderas en flor.',                   210, false, 2, 55),
  ('mundo_huerta',    'mundo', null, 'Huerta',              'Cuatro canteros con verduras creciendo en hilera.',          230, false, 3, 56),
  ('mundo_totem',     'mundo', null, 'Tótem de piedra',     'Piedras apiladas que alguien equilibró con paciencia.',      250, false, 3, 57),
  ('mundo_carpa',     'mundo', null, 'Carpa',               'Armada junto al fuego, lista para quedarse a dormir.',       260, false, 3, 58),
  ('mundo_molino',    'mundo', null, 'Molino de viento',    'Gira de verdad, más rápido cuando sopla fuerte.',            320, false, 4, 59)
on conflict (slug) do update set
  kind = excluded.kind, value = excluded.value, name_es = excluded.name_es,
  description_es = excluded.description_es, price = excluded.price,
  pro_only = excluded.pro_only, min_rank_tier = excluded.min_rank_tier,
  sort = excluded.sort, active = true;

-- ─────────────────────────────────────────────────────────────────────────────
-- Dónde se ganan
-- ─────────────────────────────────────────────────────────────────────────────
--
-- complete_activity v4: idéntica a la v3 salvo por los otorgamientos de
-- semillas. Cada uno se registra con su propia fuente para que el ledger diga
-- POR QUÉ entró cada semilla, no sólo cuántas.

create or replace function public.complete_activity(p_activity_id uuid, p_photo_url text default null, p_note text default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare
  v_uid uuid := auth.uid(); v_act activities%rowtype; v_prof profiles%rowtype; v_local date; v_yesterday date;
  v_base int; v_points int := 0; v_first boolean := false; v_counts_streak boolean := false;
  v_status completion_status := 'honor'; v_new_streak int; v_streak_inc boolean := false; v_mult numeric := 1.0;
  v_old_rank jsonb; v_new_rank jsonb; v_rank_up boolean := false; v_div_up boolean := false;
  v_ach jsonb := jsonb_build_object('titles', '[]'::jsonb, 'badges', '[]'::jsonb); v_session_bonus int := 0;
  v_set_complete boolean := false; v_cooldown int; v_exists boolean; v_new_total bigint; v_min_tier int;
  v_set uuid[]; v_bonus_done boolean; v_done int; v_total int; v_cur_streak int;
  r_ch challenges%rowtype; v_prog int; v_was_done boolean; v_ch_completed jsonb := '[]'::jsonb;
  v_comp_total bigint; v_bonus_growth int; v_mundo jsonb; v_wp_prev jsonb; v_wp_now jsonb;
  v_world_completed jsonb := null; v_habit jsonb := null;
  v_sem int := 0; v_sem_balance int; v_sem_streak int;
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  select * into v_act from activities where id = p_activity_id and active;
  if not found then raise exception 'Acción no disponible'; end if;
  select * into v_prof from profiles where id = v_uid for update;
  if not found then raise exception 'Perfil no encontrado'; end if;
  -- Age gate: an activity must match the account type.
  if not (coalesce(v_prof.account_type::text, 'adult') = any(v_act.age_groups)) then
    raise exception 'Esta acción no está disponible para tu tipo de cuenta';
  end if;
  select tier into v_min_tier from ranks where slug = v_act.min_rank_slug;
  if (brote_get_rank(v_prof.total_xp)->>'tier')::int < coalesce(v_min_tier, 1) then
    raise exception 'Necesitás un rango mayor para esta acción'; end if;
  v_local := (now() at time zone v_prof.timezone)::date; v_yesterday := v_local - 1; v_base := v_act.base_points;
  if v_act.type = 'daily' then
    select exists(select 1 from activity_completions where user_id = v_uid and activity_id = v_act.id and local_date = v_local) into v_exists;
    if v_exists then raise exception 'Ya hiciste esta acción hoy'; end if;
    v_counts_streak := true; v_status := 'honor';
    if v_prof.last_streak_date = v_local then v_new_streak := v_prof.current_streak;
    elsif v_prof.last_streak_date = v_yesterday then v_new_streak := v_prof.current_streak + 1; v_streak_inc := true;
    else v_new_streak := 1; v_streak_inc := true; end if;
    v_mult := case when v_new_streak >= 100 then 1.3 when v_new_streak >= 30 then 1.2 when v_new_streak >= 7 then 1.1 else 1.0 end;
    v_points := round(v_base * v_mult)::int;
  else
    v_cooldown := case when v_act.frequency = 'one_time' then -1 when v_act.frequency = 'weekly' then 168
      when v_act.frequency = 'recurring' then (case when v_act.repeat_cooldown_hours > 0 then v_act.repeat_cooldown_hours else 20 end) else 0 end;
    if v_cooldown = -1 then
      select exists(select 1 from activity_completions where user_id = v_uid and activity_id = v_act.id and status in ('honor','verified','pending')) into v_exists;
      if v_exists then raise exception 'Ya completaste esta acción'; end if;
    elsif v_cooldown > 0 then
      select exists(select 1 from activity_completions where user_id = v_uid and activity_id = v_act.id and status in ('honor','verified','pending')
        and completed_at > now() - make_interval(hours => v_cooldown)) into v_exists;
      if v_exists then raise exception 'Todavía no podés repetir esta acción'; end if;
    end if;
    select not exists(select 1 from activity_completions where user_id = v_uid and activity_id = v_act.id and status in ('honor','verified')) into v_first;
    v_status := 'honor'; v_points := v_base + (case when v_first then 100 else 0 end);
  end if;
  insert into activity_completions (user_id, activity_id, activity_type, domain_slug, local_date, points_awarded, status, photo_url, note, counts_for_streak)
  values (v_uid, v_act.id, v_act.type, v_act.domain_slug, v_local, v_points, v_status, p_photo_url, p_note, v_counts_streak);
  v_old_rank := brote_get_rank(v_prof.total_xp);
  if v_points > 0 then
    update profiles set total_xp = total_xp + v_points where id = v_uid;
    insert into user_domain_points (user_id, domain_slug, points) values (v_uid, v_act.domain_slug, v_points)
      on conflict (user_id, domain_slug) do update set points = user_domain_points.points + v_points;
  end if;
  -- Habit streak (rewards ROUTINE: bonus at 7/30-day multiples).
  v_habit := brote_touch_habit(v_uid, v_act.id, v_local);
  if v_act.type = 'daily' then
    update profiles set current_streak = v_new_streak, longest_streak = greatest(longest_streak, v_new_streak), last_streak_date = v_local where id = v_uid;
    -- SEMILLAS · hitos de racha. Sólo en el día en que la racha sube, así que
    -- una racha de 7 paga una vez y no una por cada acción del día.
    if v_streak_inc then
      v_sem_streak := case v_new_streak when 7 then 30 when 30 then 100 when 100 then 300 when 365 then 1000 else 0 end;
      if v_sem_streak > 0 then
        v_sem := v_sem + v_sem_streak;
        perform brote_grant_semillas(v_uid, v_sem_streak, 'streak', v_new_streak::text,
                                     'Racha de ' || v_new_streak || ' días');
      end if;
    end if;
    select activity_ids, bonus_awarded into v_set, v_bonus_done from daily_sets where user_id = v_uid and local_date = v_local;
    if v_set is not null and coalesce(array_length(v_set, 1), 0) > 0 and not coalesce(v_bonus_done, false) then
      v_total := array_length(v_set, 1);
      select count(distinct activity_id) into v_done from activity_completions where user_id = v_uid and local_date = v_local and activity_id = any(v_set);
      if v_done >= v_total then
        v_session_bonus := 200; update profiles set total_xp = total_xp + v_session_bonus where id = v_uid;
        update daily_sets set bonus_awarded = true where user_id = v_uid and local_date = v_local; v_set_complete := true;
        v_sem := v_sem + 15;
        perform brote_grant_semillas(v_uid, 15, 'daily_set', v_local::text, 'Jornada completa');
      end if;
    end if;
  end if;
  for r_ch in select * from challenges c where c.active
      and (c.starts_at is null or c.starts_at <= now()) and (c.ends_at is null or c.ends_at > now())
      and coalesce(v_prof.account_type::text, 'adult') = any(c.age_groups)
  loop
    if r_ch.target_metric = 'daily_actions' then
      select count(*) into v_prog from activity_completions
        where user_id = v_uid and activity_type = 'daily' and local_date = v_local and status in ('honor','verified');
    elsif r_ch.target_metric = 'domain_completions' then
      if r_ch.domain_slug is null then continue; end if;
      select count(*) into v_prog from activity_completions
        where user_id = v_uid and domain_slug = r_ch.domain_slug and status in ('honor','verified')
          and completed_at >= coalesce(r_ch.starts_at, now() - interval '7 days');
    elsif r_ch.target_metric = 'completions' then
      select count(*) into v_prog from activity_completions
        where user_id = v_uid and status in ('honor','verified') and completed_at >= coalesce(r_ch.starts_at, now() - interval '7 days');
    else continue; end if;
    select completed into v_was_done from user_challenges where user_id = v_uid and challenge_id = r_ch.id;
    insert into user_challenges (user_id, challenge_id, progress) values (v_uid, r_ch.id, v_prog)
      on conflict (user_id, challenge_id) do update set progress = greatest(user_challenges.progress, excluded.progress);
    if coalesce(v_was_done, false) = false and v_prog >= r_ch.target_value then
      update user_challenges set completed = true, completed_at = now() where user_id = v_uid and challenge_id = r_ch.id;
      if r_ch.reward_points > 0 then update profiles set total_xp = total_xp + r_ch.reward_points where id = v_uid; end if;
      -- SEMILLAS · retos, escalonado por lo que cuesta cada tipo.
      v_sem_streak := case r_ch.type::text when 'daily' then 10 when 'weekly' then 25 else 60 end;
      v_sem := v_sem + v_sem_streak;
      perform brote_grant_semillas(v_uid, v_sem_streak, 'challenge', r_ch.id::text, r_ch.title_es);
      if r_ch.type <> 'daily' then
      insert into notifications (user_id, type, title_es, body_es, data)
      values (v_uid, 'challenge', '¡Reto completado! 🏆', r_ch.title_es || ' · +' || r_ch.reward_points || ' pts', jsonb_build_object('challenge', r_ch.id));
      end if;
      v_ch_completed := v_ch_completed || jsonb_build_object('title_es', r_ch.title_es, 'reward_points', r_ch.reward_points, 'type', r_ch.type);
    end if;
  end loop;
  select total_xp, current_streak, bonus_growth into v_new_total, v_cur_streak, v_bonus_growth from profiles where id = v_uid;
  select count(*) into v_comp_total from activity_completions where user_id = v_uid and status in ('honor','verified');
  v_comp_total := v_comp_total + coalesce(v_bonus_growth, 0);
  v_wp_prev := brote_world_progress(greatest(0, v_comp_total - 1));
  v_wp_now := brote_world_progress(v_comp_total);
  if (v_wp_now->>'worldIndex')::int > (v_wp_prev->>'worldIndex')::int then
    v_world_completed := jsonb_build_object('completed_index', (v_wp_prev->>'worldIndex')::int, 'new_index', (v_wp_now->>'worldIndex')::int);
    insert into notifications (user_id, type, title_es, body_es, data)
    values (v_uid, 'system', '¡Completaste un mundo! 🌍✨', 'Tu mundo ' || (v_wp_prev->>'worldIndex') || ' floreció por completo. Se abrió un bioma nuevo.', v_world_completed);
    v_sem := v_sem + 150;
    perform brote_grant_semillas(v_uid, 150, 'world', (v_wp_prev->>'worldIndex'),
                                 'Mundo ' || (v_wp_prev->>'worldIndex') || ' completo');
  end if;
  v_new_rank := brote_get_rank(v_new_total);
  v_mundo := brote_compute_mundo(v_new_total, v_cur_streak, brote_domain_points_json(v_uid), v_comp_total);
  update profiles set current_rank_slug = v_new_rank->>'slug', current_division = (v_new_rank->>'division')::int,
    mundo_state = v_mundo where id = v_uid;
  v_rank_up := (v_old_rank->>'slug') is distinct from (v_new_rank->>'slug');
  v_div_up := (not v_rank_up) and (v_old_rank->>'division')::int < (v_new_rank->>'division')::int;
  if v_points > 0 or v_set_complete then v_ach := brote_award_achievements(v_uid); end if;
  if v_rank_up then
    insert into notifications (user_id, type, title_es, body_es, data)
    values (v_uid, 'rank_up', '¡Subiste de rango!', '¡Llegaste a ' || initcap(v_new_rank->>'slug') || '!', jsonb_build_object('rank', v_new_rank->>'slug'));
    v_sem := v_sem + 50;
    perform brote_grant_semillas(v_uid, 50, 'rank', v_new_rank->>'slug', 'Rango ' || initcap(v_new_rank->>'slug'));
  end if;
  select semillas into v_sem_balance from profiles where id = v_uid;
  return jsonb_build_object('points_awarded', v_points, 'new_total', v_new_total, 'rank_up', v_rank_up,
    'new_rank_slug', case when v_rank_up then v_new_rank->>'slug' else null end, 'division_up', v_div_up,
    'new_titles', v_ach->'titles', 'new_badges', v_ach->'badges', 'streak', v_cur_streak, 'streak_incremented', v_streak_inc,
    'daily_set_complete', v_set_complete, 'session_bonus', v_session_bonus, 'first_time', v_first, 'status', v_status,
    'mundo', v_mundo, 'completions_count', v_comp_total, 'challenges_completed', v_ch_completed,
    'world_completed', v_world_completed, 'habit', v_habit,
    'semillas_earned', v_sem, 'semillas_balance', coalesce(v_sem_balance, 0),
    'impact', jsonb_build_object('water_l', v_act.impact_water_l, 'co2_kg', v_act.impact_co2_kg,
                                 'waste_kg', v_act.impact_waste_kg, 'energy_kwh', v_act.impact_energy_kwh),
    'mundo_delta', null);
end $function$;

create or replace function public.complete_goal(p_goal_id uuid) returns jsonb
language plpgsql security definer set search_path to 'public' as $function$
declare v_goal goals%rowtype; v_new_total bigint; v_new_rank jsonb; v_sem_balance int;
begin
  select * into v_goal from goals where id = p_goal_id and user_id = auth.uid();
  if not found or v_goal.completed then return jsonb_build_object('ok', false); end if;
  update goals set completed = true, progress = greatest(progress, target_value) where id = p_goal_id;
  if v_goal.reward_points > 0 then
    update profiles set total_xp = total_xp + v_goal.reward_points where id = v_goal.user_id;
    select total_xp into v_new_total from profiles where id = v_goal.user_id;
    v_new_rank := brote_get_rank(v_new_total);
    update profiles set current_rank_slug = v_new_rank->>'slug', current_division = (v_new_rank->>'division')::int,
      mundo_state = brote_mundo_for(v_goal.user_id) where id = v_goal.user_id;
  end if;
  v_sem_balance := brote_grant_semillas(v_goal.user_id, 20, 'goal', v_goal.id::text, v_goal.title_es);
  insert into notifications (user_id, type, title_es, body_es) values (v_goal.user_id, 'system', '¡Objetivo cumplido! 🎯', v_goal.title_es);
  return jsonb_build_object('ok', true, 'reward', v_goal.reward_points,
                            'semillas_earned', 20, 'semillas_balance', v_sem_balance);
end $function$;

create or replace function public.complete_lesson(p_lesson_id uuid, p_correct integer, p_total integer)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare
  v_uid uuid := auth.uid(); v_score int; v_passed boolean; v_already boolean;
  v_reward int; v_title text; v_sem_balance int;
begin
  if v_uid is null then raise exception 'No autenticado'; end if;
  select reward_points, title_es into v_reward, v_title from lessons where id = p_lesson_id and active;
  if v_reward is null then return jsonb_build_object('ok', false, 'error', 'Esa lección no existe'); end if;

  v_score := case when coalesce(p_total,0) <= 0 then 0
                  else greatest(0, least(100, round(100.0 * greatest(0, p_correct) / p_total)))::int end;
  v_passed := v_score >= 60;

  select completed_at is not null into v_already
  from user_lessons where user_id = v_uid and lesson_id = p_lesson_id;

  insert into user_lessons (user_id, lesson_id, best_score, attempts, completed_at)
  values (v_uid, p_lesson_id, v_score, 1, case when v_passed then now() else null end)
  on conflict (user_id, lesson_id) do update
    set best_score = greatest(user_lessons.best_score, excluded.best_score),
        attempts = user_lessons.attempts + 1,
        completed_at = coalesce(user_lessons.completed_at, case when v_passed then now() else null end),
        updated_at = now();

  if v_passed and not coalesce(v_already, false) then
    update profiles set total_xp = total_xp + v_reward where id = v_uid;
    v_sem_balance := brote_grant_semillas(v_uid, 10, 'lesson', p_lesson_id::text, v_title);
    insert into notifications (user_id, type, title_es, body_es)
    values (v_uid, 'system', '¡Lección completada! 📘', v_title || ' · +' || v_reward || ' pts');
    return jsonb_build_object('ok', true, 'score', v_score, 'passed', true,
                              'points_awarded', v_reward, 'first_time', true,
                              'semillas_earned', 10, 'semillas_balance', v_sem_balance);
  end if;

  return jsonb_build_object('ok', true, 'score', v_score, 'passed', v_passed,
                            'points_awarded', 0, 'first_time', false, 'semillas_earned', 0);
end $function$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Retroactivo
-- ─────────────────────────────────────────────────────────────────────────────
--
-- Quien ya venía jugando no tiene por qué empezar la tienda en cero: se le
-- reconoce lo hecho a 5 semillas por acción completada y 15 por reto, con tope
-- para que nadie abra el catálogo entero de una. Queda asentado en el ledger
-- como 'backfill', así que se distingue de lo ganado jugando de acá en más.

do $backfill$
declare r record; v_amount int;
begin
  for r in
    select p.id,
           (select count(*) from activity_completions ac
             where ac.user_id = p.id and ac.status in ('honor','verified')) as comps,
           (select count(*) from user_challenges uc where uc.user_id = p.id and uc.completed) as chs
    from profiles p
    where not exists (select 1 from semilla_ledger l where l.user_id = p.id and l.source = 'backfill')
  loop
    v_amount := least(600, (r.comps * 5 + r.chs * 15)::int);
    if v_amount > 0 then
      perform brote_grant_semillas(r.id, v_amount, 'backfill', null, 'Por todo lo que ya hiciste');
    end if;
  end loop;
end $backfill$;

-- Permisos: sólo lo que el cliente debe poder llamar. brote_grant_semillas
-- quedó revocada arriba a propósito — otorgar no es una operación de usuario.
grant execute on function buy_cosmetic(text) to authenticated;
grant execute on function equip_cosmetic(text, boolean) to authenticated;
grant execute on function shop_state() to authenticated;
grant select on cosmetics to authenticated, anon;
grant select on user_cosmetics, semilla_ledger to authenticated;
