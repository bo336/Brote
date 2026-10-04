-- 0120 — Proyectos: quién los crea, quién se suma y quién ve el contacto.
--
-- Un proyecto es un encuentro en persona, con un lugar, una fecha y un teléfono
-- o mail para coordinar. Hasta acá:
--
--   · cualquiera desde el rango Retoño (7.000 puntos) podía crear uno, también
--     una cuenta de chico o adolescente;
--   · una cuenta de chico podía sumarse a un encuentro con desconocidos;
--   · `project_participants` tenía INSERT y UPDATE para el propio usuario: se
--     podía entrar a cualquier proyecto salteando `join_project` (rango mínimo,
--     cupo) con un insert desde la consola;
--   · el contacto del organizador (`contact_info`) lo leía cualquiera, sin
--     sesión incluida.
--
-- Ahora:
--   1. Crear: sólo cuentas adultas y desde el rango que fija
--      `project_min_rank_tier` (sube de 4 · Retoño a 5 · Arbusto, 15.000 puntos).
--      Sigue editable desde /panel.
--   2. Sumarse: adolescentes y adultos. Una cuenta de chico, no.
--   3. Entrar a un proyecto sólo por `join_project`; salir por `leave_project`.
--   4. El contacto sale por `project_contact`: lo ve quien organiza y quien ya
--      se sumó, nunca una cuenta de chico.

update public.app_settings
   set value = '5'::jsonb,
       description = 'Rango mínimo para crear un proyecto (1 Semilla … 11 Gaia). Además, sólo cuentas adultas.'
 where key = 'project_min_rank_tier';

-- ── 1 · Crear ────────────────────────────────────────────────────────────────

create or replace function public.create_project(
  p_title text, p_description text, p_type text, p_domain text, p_neighborhood text,
  p_location_text text, p_lat double precision, p_lng double precision,
  p_event_date timestamp with time zone, p_max_participants integer, p_image_url text,
  p_min_rank text default 'semilla', p_contact_info text default null, p_contact_kind text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_uid uuid := auth.uid();
  v_tier int;
  v_need int;
  v_id uuid;
  v_name text;
  v_tipo text;
begin
  if v_uid is null then raise exception 'No autenticado'; end if;

  select coalesce(account_type::text, 'adult') into v_tipo from profiles where id = v_uid;
  if v_tipo <> 'adult' then
    raise exception 'Los proyectos los organizan personas adultas: son encuentros en persona, con lugar y contacto.';
  end if;

  select coalesce((value #>> '{}')::int, 5) into v_need
  from app_settings where key = 'project_min_rank_tier';
  v_need := coalesce(v_need, 5);

  select (brote_get_rank(total_xp)->>'tier')::int into v_tier from profiles where id = v_uid;
  if v_tier < v_need then
    -- Name the rank rather than the number: "tier 5" means nothing to a user.
    v_name := case v_need
      when 1 then 'Semilla' when 2 then 'Brote' when 3 then 'Plántula' when 4 then 'Retoño'
      when 5 then 'Arbusto' when 6 then 'Árbol' when 7 then 'Bosque' when 8 then 'Guardián'
      when 9 then 'Ecosistema' when 10 then 'Planeta' else 'Gaia' end;
    raise exception 'Podés crear proyectos desde el rango %', v_name;
  end if;

  if p_contact_kind is not null and p_contact_kind not in ('whatsapp','email','instagram','telegram','otro') then
    raise exception 'Tipo de contacto inválido';
  end if;

  insert into projects (creator_id, title, description, type, domain_slug, neighborhood, location_text,
                        lat, lng, event_date, max_participants, image_url, min_rank_slug, status,
                        contact_info, contact_kind)
  values (v_uid, p_title, p_description, coalesce(p_type,'otro'), p_domain, p_neighborhood, p_location_text,
          p_lat, p_lng, p_event_date, p_max_participants, p_image_url, coalesce(p_min_rank,'semilla'), 'active',
          nullif(btrim(coalesce(p_contact_info,'')), ''), p_contact_kind)
  returning id into v_id;

  insert into project_participants (project_id, user_id, status)
  values (v_id, v_uid, 'organizer') on conflict do nothing;
  return v_id;
end $fn$;

-- ── 2 · Sumarse ──────────────────────────────────────────────────────────────

create or replace function public.join_project(p_project_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $fn$
declare v_uid uuid := auth.uid(); v_tier int; v_min int; v_count int; v_max int; v_tipo text;
begin
  if v_uid is null then raise exception 'No autenticado'; end if;
  select coalesce(account_type::text, 'adult') into v_tipo from profiles where id = v_uid;
  if v_tipo = 'kid' then
    raise exception 'Los proyectos son encuentros en persona: con una cuenta de chico no se puede sumar. Puede hacerlo una persona adulta de tu familia.';
  end if;
  select tier into v_min from ranks where slug = (select min_rank_slug from projects where id = p_project_id);
  select (brote_get_rank(total_xp)->>'tier')::int into v_tier from profiles where id = v_uid;
  if v_tier < coalesce(v_min, 1) then raise exception 'Este proyecto requiere un rango mayor'; end if;
  select max_participants into v_max from projects where id = p_project_id;
  if v_max is not null then
    select count(*) into v_count from project_participants where project_id = p_project_id and status in ('joined','organizer');
    if v_count >= v_max then raise exception 'El proyecto está completo'; end if;
  end if;
  insert into project_participants (project_id, user_id, status) values (p_project_id, v_uid, 'joined')
    on conflict (project_id, user_id) do update set status = 'joined';
  return true;
end $fn$;

-- ── 3 · Sin atajos a la tabla ───────────────────────────────────────────────

drop policy if exists "participants owner insert" on public.project_participants;
drop policy if exists "participants owner update" on public.project_participants;
revoke insert, update, truncate on public.project_participants from anon, authenticated;

-- ── 4 · El contacto ─────────────────────────────────────────────────────────

-- Revocar el SELECT de tabla revoca también los de columna; después se da
-- todo menos el contacto.
revoke select on public.projects from anon, authenticated;
grant select (
  id, creator_id, title, description, type, domain_slug, image_url, neighborhood, city,
  lat, lng, location_text, event_date, status, min_rank_slug, max_participants, reward_points,
  upvotes, created_at, updated_at, completed_at, group_activity_id, session_points
) on public.projects to anon, authenticated;

create or replace function public.project_contact(p_project uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_uid uuid := auth.uid();
  v_tipo text;
  p projects%rowtype;
begin
  if v_uid is null then return null; end if;
  select coalesce(account_type::text, 'adult') into v_tipo from profiles where id = v_uid;
  if v_tipo = 'kid' then return null; end if;
  select * into p from projects where id = p_project;
  if not found or p.contact_info is null then return null; end if;
  if p.creator_id = v_uid
     or exists (select 1 from project_participants pp
                 where pp.project_id = p_project and pp.user_id = v_uid and pp.status in ('joined', 'organizer')) then
    return jsonb_build_object('contact_info', p.contact_info, 'contact_kind', p.contact_kind);
  end if;
  return null;
end $fn$;

revoke all on function public.project_contact(uuid) from public, anon;
grant execute on function public.project_contact(uuid) to authenticated;
