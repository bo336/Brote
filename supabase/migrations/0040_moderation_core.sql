-- Brote — 0040 — Moderación: bloqueos, silencios, reportes y lista de palabras.
-- Feed v2 ("La Plaza") fase 1, paso 1 de 5.
--
-- NUMERACIÓN: este archivo va en 0040 y no en 0038 como decía el pack, porque
-- 0038 y 0039 ya están tomados por la rama de Semillas (todavía sin mergear).
-- Duplicar un número deja dos archivos distintos con el mismo nombre cuando las
-- dos ramas se junten, que es exactamente el tipo de choque silencioso que
-- después nadie encuentra.
--
-- ESTADO: este contenido YA ESTÁ APLICADO en el proyecto vivo (migración
-- `moderation_core`, 2026-08-26). Este archivo existe para que el repo y la base
-- digan lo mismo. Todo es idempotente, así que volver a correrlo no rompe nada.
--
-- POR QUÉ ESTO VA PRIMERO: en el momento en que el feed acepta contenido de
-- gente real, Brote deja de ser una app de hábitos y pasa a ser una plataforma.
-- Con eso vienen tres deberes (ver 08_LEGAL_SAFETY): mantener a los chicos fuera
-- del espacio social adulto, respetar derechos de autor ajenos, y poder actuar
-- sobre denuncias — y demostrar que se actuó. Nada de lo que sigue en fase 1
-- puede existir sin esta base.

-- ─────────────────────────────────────────────────────────────────────────────
-- Bloqueos y silencios: la gente se protege sola, sin esperar a que moderemos
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists user_blocks (
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

create table if not exists user_mutes (
  muter_id uuid not null references profiles(id) on delete cascade,
  muted_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (muter_id, muted_id)
);

create index if not exists idx_blocks_blocked on user_blocks (blocked_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Denuncias y registro de decisiones
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists content_reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id) on delete set null,
  post_id     uuid references feed_posts(id) on delete cascade,
  profile_id  uuid references profiles(id) on delete cascade,
  reason      text not null check (reason in ('spam','odio','acoso','desinformacion','sexual','violencia','menores','otro')),
  note        text,
  status      text not null default 'open' check (status in ('open','upheld','dismissed')),
  resolved_at timestamptz,
  resolution  text,
  created_at  timestamptz not null default now(),
  constraint report_has_target check (post_id is not null or profile_id is not null)
);

create index if not exists idx_reports_open on content_reports (status, created_at desc);

-- El registro es lo que separa "moderamos" de "podemos mostrarte que moderamos".
create table if not exists moderation_actions (
  id         uuid primary key default gen_random_uuid(),
  report_id  uuid references content_reports(id) on delete set null,
  post_id    uuid references feed_posts(id) on delete set null,
  profile_id uuid references profiles(id) on delete set null,
  action     text not null,     -- hide | restore | suspend | warn | dismiss
  reason     text,
  created_at timestamptz not null default now()
);

alter table user_blocks        enable row level security;
alter table user_mutes         enable row level security;
alter table content_reports    enable row level security;
alter table moderation_actions enable row level security;

drop policy if exists "blocks own" on user_blocks;
create policy "blocks own" on user_blocks for all
  using ((select auth.uid()) = blocker_id) with check ((select auth.uid()) = blocker_id);

drop policy if exists "mutes own" on user_mutes;
create policy "mutes own" on user_mutes for all
  using ((select auth.uid()) = muter_id) with check ((select auth.uid()) = muter_id);

-- Se puede crear y leer la propia denuncia, nunca la de otro: saber quién
-- denunció a quién es justamente lo que habilita las represalias.
drop policy if exists "reports insert own" on content_reports;
create policy "reports insert own" on content_reports for insert
  with check ((select auth.uid()) = reporter_id);

drop policy if exists "reports read own" on content_reports;
create policy "reports read own" on content_reports for select
  using ((select auth.uid()) = reporter_id);

-- moderation_actions: RLS activa y CERO policies a propósito. Solo las
-- funciones SECURITY DEFINER pueden leerla o escribirla.

-- ─────────────────────────────────────────────────────────────────────────────
-- Lista de patrones. Vive en SQL para poder ajustarse sin un deploy.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists moderation_blocklist (
  pattern  text primary key,   -- regex POSIX, sin distinguir mayúsculas
  severity text not null default 'hold' check (severity in ('hold','block'))
);
alter table moderation_blocklist enable row level security;  -- sin policies: definer-only

create or replace function brote_matches_blocklist(p_text text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from moderation_blocklist b where coalesce(p_text,'') ~* b.pattern);
$$;

-- Semilla inicial: insultos y patrones de spam frecuentes en español rioplatense
-- más los clásicos de estafa. `hold` = la publicación entra pero oculta y va a la
-- cola; nunca se descarta en silencio. Un falso positivo que se come un texto sin
-- avisar es peor que uno que lo demora.
insert into moderation_blocklist (pattern, severity) values
  ('\m(put[oa]s?|forr[oa]s?|pelotud[oa]s?|boluda?zo)\M', 'hold'),
  ('\m(negr[oa] de mierda|villero de mierda|muerto de hambre)\M', 'hold'),
  ('\m(mogólic[oa]|mongolic[oa]|retrasad[oa] mental)\M', 'hold'),
  ('\m(traval?o|travesti de mierda|maric[oó]n)\M', 'hold'),
  ('\m(judí[oa] de mierda|nazi de mierda|sudaca)\M', 'hold'),
  ('\m(and[aá] a morirte|matate|ojal[aá] te mueras)\M', 'hold'),
  ('\m(te voy a matar|te cago a trompadas|sé d[oó]nde vivís)\M', 'hold'),
  ('gan[aá] (dinero|plata) (f[aá]cil|desde casa|r[aá]pido)', 'hold'),
  ('(inversi[oó]n|trading|cripto).{0,20}(garantizad[oa]|sin riesgo|100%)', 'hold'),
  ('\m(bitcoin|usdt|binance)\M.{0,30}(regalo|gratis|duplic)', 'hold'),
  ('(dupl[ií]c|multiplic).{0,15}(tu|su) (dinero|plata|inversi[oó]n)', 'hold'),
  ('trabaj[aá] desde casa.{0,25}(whatsapp|wsp|telegram)', 'hold'),
  ('(escribime|mandame|contactame).{0,20}(whats?app|wsp|\+54\s?9)', 'hold'),
  ('\m(pas[aá]me|dejame) tu (n[uú]mero|whats?app|tel[eé]fono)\M', 'hold'),
  ('(seguidores|likes|followers) (gratis|baratos|por|garantizados)', 'hold'),
  ('click(e[aá])? (ac[aá]|aqu[ií]).{0,20}(gan[aá]|premio|gratis)', 'hold'),
  ('(ganaste|sos el ganador).{0,25}(premio|sorteo|iphone)', 'hold'),
  ('\m(onlyfans|packs?|contenido \+18|xxx)\M', 'hold'),
  ('\m(vendo|compro) (armas?|drogas?|falopa|merca|marihuana)\M', 'hold'),
  ('\m(dni|cbu|cvu|c[oó]digo de seguridad).{0,25}(mandame|pasame|enviame)', 'hold'),
  ('\m(clave|contrase[nñ]a|token).{0,20}(mandame|pasame|enviame)', 'hold'),
  ('\m(fuck(ing)?|shit|bitch|asshole|cunt)\M', 'hold'),
  ('\m(kill yourself|kys)\M', 'hold'),
  ('\m(free money|make money fast|work from home)\M', 'hold'),
  ('(https?://)?(bit\.ly|tinyurl|cutt\.ly|acortar)', 'hold'),
  ('\m(prestamos?|cr[eé]ditos?) (sin|con) (veraz|requisitos)', 'hold'),
  ('\m(hackeo|hackear) (cuentas?|whats?app|instagram)', 'hold'),
  ('\m(curaci[oó]n|cura) (milagrosa|natural).{0,20}(c[aá]ncer|covid)', 'hold')
on conflict (pattern) do nothing;

-- ─────────────────────────────────────────────────────────────────────────────
-- Acciones del usuario
-- ─────────────────────────────────────────────────────────────────────────────

-- Reportar. Idempotente por 24 h para que tocar dos veces no infle el contador,
-- y con la baja provisional automática que pide el deber de "notice and action":
-- 3 personas distintas en 24 h ocultan la publicación hasta que la mire alguien.
create or replace function report_content(
  p_post_id uuid, p_profile_id uuid, p_reason text, p_note text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_nil uuid := '00000000-0000-0000-0000-000000000000';
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  if p_post_id is null and p_profile_id is null then
    return jsonb_build_object('ok', false, 'error', 'Falta qué reportar.');
  end if;

  if exists (select 1 from content_reports
             where reporter_id = v_uid
               and coalesce(post_id, v_nil) = coalesce(p_post_id, v_nil)
               and coalesce(profile_id, v_nil) = coalesce(p_profile_id, v_nil)
               and created_at > now() - interval '24 hours') then
    return jsonb_build_object('ok', true, 'already', true);
  end if;

  insert into content_reports (reporter_id, post_id, profile_id, reason, note)
  values (v_uid, p_post_id, p_profile_id, p_reason, left(coalesce(p_note,''), 500));

  if p_post_id is not null and (
       select count(distinct reporter_id) from content_reports
       where post_id = p_post_id and created_at > now() - interval '24 hours') >= 3 then
    update feed_posts set hidden = true where id = p_post_id;
    insert into moderation_actions (post_id, action, reason)
    values (p_post_id, 'hide', 'auto:3-reportes');
  end if;

  return jsonb_build_object('ok', true);
end $$;

-- Bloquear corta el vínculo en las dos direcciones: si te bloqueo, ni yo te sigo
-- ni vos me seguís. Dejar el follow vivo sería dejar una puerta abierta.
create or replace function block_user(p_target uuid, p_on boolean default true) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  if v_uid = p_target then return jsonb_build_object('ok', false, 'error', 'No podés bloquearte.'); end if;
  if p_on then
    insert into user_blocks (blocker_id, blocked_id) values (v_uid, p_target) on conflict do nothing;
    delete from follows where (follower_id = v_uid and followee_id = p_target)
                           or (follower_id = p_target and followee_id = v_uid);
  else
    delete from user_blocks where blocker_id = v_uid and blocked_id = p_target;
  end if;
  return jsonb_build_object('ok', true, 'blocked', p_on);
end $$;

-- Silenciar es unilateral y callado: la otra persona no se entera.
create or replace function mute_user(p_target uuid, p_on boolean default true) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'No autenticado' using errcode = 'P0001'; end if;
  if v_uid = p_target then return jsonb_build_object('ok', false, 'error', 'No podés silenciarte.'); end if;
  if p_on then
    insert into user_mutes (muter_id, muted_id) values (v_uid, p_target) on conflict do nothing;
  else
    delete from user_mutes where muter_id = v_uid and muted_id = p_target;
  end if;
  return jsonb_build_object('ok', true, 'muted', p_on);
end $$;

revoke all on function report_content(uuid,uuid,text,text), block_user(uuid,boolean),
  mute_user(uuid,boolean), brote_matches_blocklist(text) from public;
grant execute on function report_content(uuid,uuid,text,text), block_user(uuid,boolean),
  mute_user(uuid,boolean) to authenticated;
