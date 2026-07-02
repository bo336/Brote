-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0020 — News cron keyless + weekly recap (IMPROVEMENT_PLAN F4.4/F6.2).
-- Mirrors live migration 0011_news_cron_keyless_weekly_recap.
--
-- The news cron used a Vault secret (`service_role_key`) that was never set,
-- so news NEVER refreshed. The edge function only needs a valid JWT to pass
-- verify_jwt — the PUBLIC anon key is one — and it uses its own injected
-- service-role env internally. Rescheduled keyless: zero owner setup.
-- NOTE: replace <ANON_KEY> with the project's public anon key when re-running
-- against a fresh project (it is public by design).
-- ════════════════════════════════════════════════════════════════════════════

-- 1) Keyless news cron (every 8h).
select cron.unschedule('brote-refresh-news');
select cron.schedule('brote-refresh-news', '0 */8 * * *', $$
  select net.http_post(
    url := 'https://swdwulouasdnyorfhrjt.supabase.co/functions/v1/refresh-news',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', '<ANON_KEY>',
      'Authorization', 'Bearer <ANON_KEY>'
    ),
    body := '{}'::jsonb
  );
$$);

-- 2) Keyless push trigger (was also Vault-dependent).
create or replace function notify_push()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_prefs jsonb; v_allow boolean; v_key text;
begin
  if new.type not in ('rank_up','streak_risk','streak_lost','title','project','challenge','points','friend') then return new; end if;
  select notification_prefs into v_prefs from profiles where id = new.user_id;
  if coalesce((v_prefs->>'push')::boolean, true) = false then return new; end if;
  v_allow := case when new.type in ('streak_risk','streak_lost') then coalesce((v_prefs->>'streak')::boolean, true)
    when new.type = 'challenge' then coalesce((v_prefs->>'challenges')::boolean, true)
    when new.type = 'project' then coalesce((v_prefs->>'projects')::boolean, true) else true end;
  if not v_allow then return new; end if;
  v_key := '<ANON_KEY>';
  perform net.http_post(url := 'https://swdwulouasdnyorfhrjt.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'apikey', v_key, 'Authorization', 'Bearer ' || v_key),
    body := jsonb_build_object('user_id', new.user_id, 'title', new.title_es, 'body', coalesce(new.body_es, ''), 'url', coalesce(new.data->>'url', '/')));
  return new;
end $$;
revoke execute on function notify_push() from public, anon, authenticated;

-- 3) Weekly recap: Mondays 13:00 UTC (10:00 BA), personal numbers, zero AI deps.
create or replace function brote_weekly_recap()
returns int language plpgsql security definer set search_path = public as $$
declare r record; v_count int := 0; v_ba_date date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
begin
  for r in
    select p.id, p.display_name, p.current_streak,
           count(ac.id) as acts, coalesce(sum(ac.points_awarded), 0) as pts,
           count(distinct ac.domain_slug) as doms
    from profiles p
    join activity_completions ac on ac.user_id = p.id
      and ac.local_date >= v_ba_date - 7 and ac.status in ('honor','verified')
    group by p.id
    having count(ac.id) > 0
  loop
    insert into notifications (user_id, type, title_es, body_es, data)
    values (r.id, 'system', 'Tu semana en Brote 🌱',
      'Hiciste ' || r.acts || ' acciones (+' || r.pts || ' pts) en ' || r.doms ||
      case when r.doms = 1 then ' tema' else ' temas' end ||
      case when r.current_streak >= 7 then ' y tu racha sigue viva con ' || r.current_streak || ' días 🔥' else '. ¡Esta semana, por más!' end,
      jsonb_build_object('recap_week', v_ba_date));
    v_count := v_count + 1;
  end loop;
  return v_count;
end $$;
revoke execute on function brote_weekly_recap() from public, anon, authenticated;

select cron.schedule('brote-weekly-recap', '0 13 * * 1', $$select brote_weekly_recap();$$);
