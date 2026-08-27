-- Brote — 0050 — Push social, autopost de hitos y títulos sociales.
-- Feed v2 ("La Plaza") fase 2, pasos 5 y 7.
--
-- Push suma reply, mention, follow y moderation. `like` NO empuja: cinco likes
-- en una tarde vibrando el teléfono es exactamente cómo la gente apaga las
-- notificaciones para siempre. Los likes se ven al abrir la app.
--
-- El enlace profundo se arma desde data->post_id / data->user_id. Antes sólo se
-- usaba data->>'url', que las notificaciones sociales no traen: tocarlas habría
-- llevado a la home.

create or replace function notify_push() returns trigger
language plpgsql security definer set search_path = public as $fn$
declare v_prefs jsonb; v_allow boolean; v_key text; v_url text;
begin
  if new.type not in ('rank_up','streak_risk','streak_lost','title','project','challenge',
                      'points','friend','reply','mention','follow','moderation') then
    return new;
  end if;

  select notification_prefs into v_prefs from profiles where id = new.user_id;
  if coalesce((v_prefs->>'push')::boolean, true) = false then return new; end if;

  v_allow := case
    when new.type in ('streak_risk','streak_lost') then coalesce((v_prefs->>'streak')::boolean, true)
    when new.type = 'challenge' then coalesce((v_prefs->>'challenges')::boolean, true)
    when new.type = 'project'   then coalesce((v_prefs->>'projects')::boolean, true)
    when new.type = 'reply'     then coalesce((v_prefs->>'notif_reply')::boolean, true)
    when new.type = 'mention'   then coalesce((v_prefs->>'notif_mention')::boolean, true)
    when new.type = 'follow'    then coalesce((v_prefs->>'notif_follow')::boolean, true)
    else true end;
  if not v_allow then return new; end if;

  v_url := coalesce(
    new.data->>'url',
    case
      when new.data ? 'post_id' then '/feed/p/' || (new.data->>'post_id')
      when new.data ? 'user_id' then
        coalesce('/perfil/' || (select username::text from profiles where id = (new.data->>'user_id')::uuid), '/feed')
      else '/'
    end);

  v_key := current_setting('app.anon_key', true);
  if v_key is null then
    v_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3ZHd1bG91YXNkbnlvcmZocmp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MjUyMTAsImV4cCI6MjA5ODQwMTIxMH0.KbWP_LYJ4o2H-ITyyeNPR0FovBhuy3jfijnDYmgEjF4';
  end if;

  perform net.http_post(
    url := 'https://swdwulouasdnyorfhrjt.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object('Content-Type','application/json','apikey', v_key,
                                  'Authorization','Bearer ' || v_key),
    body := jsonb_build_object('user_id', new.user_id, 'title', new.title_es,
                               'body', coalesce(new.body_es, ''), 'url', v_url));
  return new;
end $fn$;
revoke all on function notify_push() from public, anon, authenticated;

-- Autopost de hitos. Se genera desde las notificaciones que YA existen, así el
-- núcleo (complete_activity) no se toca. APAGADO por defecto: publicar en nombre
-- de alguien sin que lo haya pedido es lo peor que puede hacer un feed.
create or replace function brote_autopost_from_notification() returns trigger
language plpgsql security definer set search_path = public as $fn$
declare v_age text; v_prefs jsonb; v_body text;
begin
  if new.type not in ('rank_up','title') then return new; end if;
  select coalesce(account_type::text,'adult'), coalesce(notification_prefs,'{}'::jsonb)
    into v_age, v_prefs from profiles where id = new.user_id;
  if v_age = 'kid' then return new; end if;
  if coalesce((v_prefs->'autopost'->>new.type::text)::boolean, false) = false then return new; end if;

  v_body := new.title_es || case when new.body_es is null then '' else ' · ' || new.body_es end;
  insert into feed_posts (kind, author_id, body, domain_tags, age_groups)
  values ('milestone', new.user_id, v_body, '{}', array['teen','adult']);
  update profiles set posts_count = posts_count + 1 where id = new.user_id;
  return new;
end $fn$;

drop trigger if exists trg_autopost on notifications;
create trigger trg_autopost after insert on notifications
for each row execute function brote_autopost_from_notification();
revoke all on function brote_autopost_from_notification() from public, anon, authenticated;

-- Títulos sociales, por el camino de logros que ya existe.
insert into titles (slug, name_es, name_en, requirement_type, requirement_value, rarity, icon, description_es)
values
  ('vocero-barrio',   'Vocera/o del barrio', 'Neighbourhood voice', 'replies_received', 50,  'rare',   'megaphone', 'Recibiste 50 respuestas en la Plaza.'),
  ('sembrador-ideas', 'Sembrador/a de ideas','Idea sower',          'posts_made',       25,  'common', 'sprout',    'Publicaste 25 veces en la Plaza.'),
  ('antena',          'Antena',              'Antenna',             'followers',        100, 'epic',   'radio',     '100 personas te siguen.')
on conflict (slug) do nothing;
