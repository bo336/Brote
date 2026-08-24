-- 0039 — LOS RETOS DIARIOS MORÍAN A LAS 21:00
--
-- daily_maintenance armaba la ventana de los retos así:
--
--     update challenges set starts_at = v_ba_date::timestamptz,
--                           ends_at   = (v_ba_date + 1)::timestamptz
--
-- v_ba_date es la fecha del calendario de Buenos Aires, pero castear un `date`
-- a `timestamptz` lo interpreta en la zona de la SESIÓN, que es UTC. O sea que
-- '2026-08-23'::timestamptz da 2026-08-23 00:00+00 = 22/08 21:00 en Argentina.
--
-- Resultado: la ventana del reto del día iba de las 21:00 de ayer a las 21:00
-- de hoy. Desde las 21:00 hasta pasada la medianoche —las horas en que la gente
-- efectivamente abre la app— TODOS los retos diarios figuraban vencidos, el
-- filtro `ends_at > now()` los dejaba afuera del bucle de complete_activity y el
-- "Reto del día" no sumaba nada por más acciones que hicieras. Lo mismo con los
-- semanales, que se cortaban a las 21:00 del domingo.
--
-- Verificado en vivo antes de tocar nada: a las 01:21 UTC del 24/08 los 10 retos
-- diarios y los 6 semanales tenían vigente=false, y tres acciones diarias
-- seguidas completaron cero retos.
--
-- La corrección es anclar la ventana a la medianoche LOCAL:
--   (v_ba_date::timestamp at time zone 'America/Argentina/Buenos_Aires')
-- convierte una marca sin zona, leída como hora de Buenos Aires, al instante
-- correcto (03:00 UTC). La ventana pasa a cubrir el día que el usuario vive.

create or replace function public.daily_maintenance() returns jsonb
language plpgsql security definer set search_path to 'public' as $function$
declare
  v_ba_date date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
  -- Medianoche local expresada como instante real. TODA ventana diaria o
  -- semanal se arma desde acá; nunca desde un cast directo de `date`.
  v_day_start timestamptz := (v_ba_date::timestamp at time zone 'America/Argentina/Buenos_Aires');
  v_yesterday date := v_ba_date - 1;
  v_dow int := extract(dow from v_ba_date);
  v_reset int := 0; v_frozen int := 0; r record;
begin
  -- 1) Streak maintenance.
  for r in select id, total_xp, streak_freezes from profiles where current_streak > 0 and (last_streak_date is null or last_streak_date < v_yesterday) loop
    if r.streak_freezes > 0 then
      update profiles set streak_freezes = streak_freezes - 1, last_streak_date = v_yesterday where id = r.id;
      insert into notifications (user_id, type, title_es, body_es) values (r.id, 'streak_risk', 'Usaste un protector de racha 🛡️', 'Tu racha sigue viva. ¡Hacé una acción hoy!');
      v_frozen := v_frozen + 1;
    else
      update profiles set current_streak = 0 where id = r.id;
      update profiles set mundo_state = brote_mundo_for(r.id) where id = r.id;
      insert into notifications (user_id, type, title_es, body_es) values (r.id, 'streak_lost', 'Perdiste tu racha 😶‍🌫️', 'No pasa nada. Empezá una nueva hoy con una acción.');
      v_reset := v_reset + 1;
    end if;
  end loop;

  -- 2) Rolling challenge windows (+ per-window progress reset).
  -- Daily: la ventana cubre el día LOCAL completo, de medianoche a medianoche.
  with ref as (
    update challenges set starts_at = v_day_start, ends_at = v_day_start + interval '1 day'
    where type = 'daily' and active returning id
  )
  delete from user_challenges where challenge_id in (select id from ref);
  -- Weekly: refresh on Mondays, or self-heal whenever expired.
  with ref as (
    update challenges set starts_at = v_day_start, ends_at = v_day_start + interval '7 days'
    where type = 'weekly' and active and (v_dow = 1 or ends_at < now()) returning id
  )
  delete from user_challenges where challenge_id in (select id from ref);
  -- Seasonal: regenerate a fresh 21-day season when expired.
  with ref as (
    update challenges set starts_at = now(), ends_at = now() + interval '21 days'
    where type = 'seasonal' and active and ends_at < now() returning id
  )
  delete from user_challenges where challenge_id in (select id from ref);

  -- 3) Daily challenge rotation (avoid immediate repeat).
  update app_state set value = (select jsonb_build_object('id', id) from challenges where type = 'daily' and active
      and id <> coalesce((select (value->>'id')::uuid from app_state where key = 'current_daily_challenge'), '00000000-0000-0000-0000-000000000000'::uuid) order by random() limit 1) where key = 'current_daily_challenge';

  -- 4) Weekly featured rotation (Mondays).
  if v_dow = 1 then
    declare v_ptr int; v_total int; v_ids uuid[];
    begin
      select coalesce((value->>'pointer')::int, 0) into v_ptr from app_state where key = 'featured_rotation';
      select count(*) into v_total from activities where type = 'catalog' and active;
      update activities set is_featured = false, featured_week = null where is_featured;
      select array_agg(id) into v_ids from (select id from activities where type = 'catalog' and active order by sort_order offset (v_ptr % greatest(v_total, 1)) limit 2) x;
      update activities set is_featured = true, featured_week = v_ba_date where id = any(v_ids);
      update app_state set value = jsonb_build_object('pointer', v_ptr + 2) where key = 'featured_rotation';
    end;
  end if;

  -- 5) Goal rollover + weekly snapshot + stale-pending safety net.
  update goals set completed = true where not completed and progress >= target_value;
  if v_dow = 1 then
    insert into weekly_scores (user_id, week_start, xp) select user_id, v_ba_date, sum(points_awarded)::bigint from activity_completions where local_date >= v_ba_date - 7 group by user_id
    on conflict (user_id, week_start) do update set xp = excluded.xp;
  end if;
  for r in select id from activity_completions where status = 'pending' and completed_at < now() - interval '15 minutes' loop perform auto_approve_completion(r.id); end loop;

  return jsonb_build_object('reset', v_reset, 'frozen', v_frozen, 'date', v_ba_date, 'dow', v_dow);
end $function$;

-- Reparar las ventanas YA. Sin esto quedarían vencidas hasta que el cron corra
-- a las 03:05 UTC, que es justamente el agujero que este arreglo cierra.
-- Sólo se tocan las ventanas: no se borra progreso de nadie.
do $fix$
declare
  v_ba_date date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
  v_day_start timestamptz := (v_ba_date::timestamp at time zone 'America/Argentina/Buenos_Aires');
begin
  update challenges set starts_at = v_day_start, ends_at = v_day_start + interval '1 day'
   where type = 'daily' and active and ends_at <= now();
  update challenges set starts_at = v_day_start, ends_at = v_day_start + interval '7 days'
   where type = 'weekly' and active and ends_at <= now();
end $fix$;
