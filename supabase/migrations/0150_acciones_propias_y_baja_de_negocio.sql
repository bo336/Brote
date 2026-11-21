-- 0150 — La reestructura (docs/REESTRUCTURA.md): acciones propias y eliminar un negocio.
--
-- 1. ACCIONES PROPIAS (D6). Alguien carga algo que hizo y no está en el
--    catálogo. Simple a propósito:
--      · título (2+ palabras, 6–90 letras) + uno de los 13 temas;
--      · SIEMPRE los mismos puntos (15), y sólo las 3 primeras del día suman;
--        hasta 10 por día en total (las demás quedan anotadas en 0);
--      · filtros fáciles: largo, la lista de palabras de la Plaza, que parezca
--        texto (sin "aaaaa"), sin repetir el mismo título el mismo día;
--      · NO suman impacto real (nadie midió lo que hiciste: ACCIONES §6b) ni
--        cuentan para la racha. No escriben `activity_completions`, así que
--        "Tu impacto real" sigue moviéndose sólo por acciones medidas (0117).
--      · se pueden borrar el mismo día: descuenta los puntos, pero el lugar del
--        día NO se libera (si no, borrar y volver a cargar sumaría de nuevo).
--    Los puntos suben `total_xp`, así que la liga los cuenta sola (trigger de
--    0142, con su tope de 400 por día) y el rango y el mundo se recalculan
--    como en `complete_activity`.
--
-- 2. ELIMINAR UN NEGOCIO (D7). Sólo quien es dueña o dueño, escribiendo el
--    nombre para confirmar. Un plan pago vivo lo bloquea (MercadoPago seguiría
--    cobrando): primero se cancela. Los negocios de muestra (`demo-*`) no se
--    borran desde la app. Todo lo del negocio cae en cascada (todas las tablas
--    lo tienen); queda una fila mínima en `negocios_eliminados` para soporte.
--    Políticas nuevas de storage dejan a la dueña listar y borrar los archivos
--    del negocio antes de eliminarlo (logos, fotos, evidencia).
--
-- 3. El panel ve las acciones propias: lo más cargado es la lista de acciones
--    que le faltan al catálogo, y lo raro salta a la vista.

-- ── 1 · Acciones propias ─────────────────────────────────────────────────────

create or replace function public.brote_propias_reglas()
returns jsonb
language sql
immutable
set search_path = public
as $$
  -- ESPEJO de REGLAS_PROPIAS en lib/acciones/propias.ts (un test los compara).
  select jsonb_build_object(
    'puntos', 15,
    'con_puntos_por_dia', 3,
    'max_por_dia', 10,
    'min_largo', 6,
    'max_largo', 90,
    'min_palabras', 2,
    'max_nota', 280
  );
$$;

create table if not exists public.acciones_propias (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  titulo      text not null check (char_length(titulo) between 6 and 90),
  titulo_norm text not null,
  dominio     text not null references public.domains (slug),
  nota        text check (nota is null or char_length(nota) <= 280),
  local_date  date not null,
  puntos      int not null default 0 check (puntos >= 0),
  borrada_at  timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists acciones_propias_usuario on public.acciones_propias (user_id, local_date desc);
create index if not exists acciones_propias_reciente on public.acciones_propias (created_at desc);
-- El mismo título el mismo día, una vez (las borradas no cuentan).
create unique index if not exists acciones_propias_unica
  on public.acciones_propias (user_id, local_date, titulo_norm) where borrada_at is null;

alter table public.acciones_propias enable row level security;
revoke all on public.acciones_propias from public, anon, authenticated;

/** "Llevé  las BOLSAS al súper!!" → "llevé las bolsas al súper" (para comparar). */
create or replace function public.brote_propia_normalizar(p text)
returns text
language sql
immutable
set search_path = public
as $$
  select btrim(regexp_replace(lower(unaccent_safe(coalesce(p, ''))), '[^a-z0-9ñ]+', ' ', 'g'));
$$;

/**
 * Por qué un título no sirve, o null si sirve. ESPEJO de `motivoTituloPropio`
 * en lib/acciones/propias.ts.
 */
create or replace function public.brote_propia_motivo(p_titulo text)
returns text
language plpgsql
stable
set search_path = public
as $$
declare
  r jsonb := brote_propias_reglas();
  t text := btrim(regexp_replace(coalesce(p_titulo, ''), '\s+', ' ', 'g'));
  n text := brote_propia_normalizar(t);
begin
  if char_length(t) < (r ->> 'min_largo')::int then return 'corto'; end if;
  if char_length(t) > (r ->> 'max_largo')::int then return 'largo'; end if;
  if coalesce(array_length(regexp_split_to_array(n, ' '), 1), 0) < (r ->> 'min_palabras')::int then return 'palabras'; end if;
  if n !~ '[a-zñ]{3,}' or n ~ '(.)\1{4,}' then return 'texto'; end if;
  if brote_matches_blocklist(t) then return 'palabras_prohibidas'; end if;
  return null;
end $$;

/** Rango y mundo después de mover puntos por fuera de `complete_activity`. */
create or replace function public.brote_propia_refrescar(p_uid uuid, p_total_antes bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total bigint; v_racha int; v_bonus int; v_comp bigint;
  v_viejo jsonb := brote_get_rank(p_total_antes); v_nuevo jsonb; v_mundo jsonb; v_sube boolean;
begin
  select total_xp, current_streak, bonus_growth into v_total, v_racha, v_bonus from profiles where id = p_uid;
  select count(*) into v_comp from activity_completions where user_id = p_uid and status in ('honor', 'verified');
  v_comp := v_comp + coalesce(v_bonus, 0);
  v_nuevo := brote_get_rank(v_total);
  v_mundo := brote_compute_mundo(v_total, v_racha, brote_domain_points_json(p_uid), v_comp);
  update profiles
     set current_rank_slug = v_nuevo ->> 'slug', current_division = (v_nuevo ->> 'division')::int, mundo_state = v_mundo
   where id = p_uid;
  v_sube := v_total > p_total_antes and (v_viejo ->> 'slug') is distinct from (v_nuevo ->> 'slug');
  if v_sube then
    insert into notifications (user_id, type, title_es, body_es, data)
    values (p_uid, 'rank_up', '¡Subiste de rango!', '¡Llegaste a ' || initcap(v_nuevo ->> 'slug') || '!',
            jsonb_build_object('rank', v_nuevo ->> 'slug'));
    perform brote_grant_semillas(p_uid, 50, 'rank', v_nuevo ->> 'slug', 'Rango ' || initcap(v_nuevo ->> 'slug'));
  end if;
  return jsonb_build_object('new_total', v_total, 'rank_up', v_sube,
                            'new_rank_slug', case when v_sube then v_nuevo ->> 'slug' else null end);
end $$;

create or replace function public.accion_propia_registrar(p_titulo text, p_dominio text, p_nota text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid(); v_prof profiles%rowtype; r jsonb := brote_propias_reglas();
  v_titulo text := btrim(regexp_replace(coalesce(p_titulo, ''), '\s+', ' ', 'g'));
  v_nota text := nullif(btrim(coalesce(p_nota, '')), '');
  v_hoy date; v_motivo text; v_cargadas int; v_con_puntos int; v_puntos int := 0; v_id uuid; v_ref jsonb := null;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'no_autenticado'); end if;
  select * into v_prof from profiles where id = v_uid for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'no_autenticado'); end if;
  if not exists (select 1 from domains where slug = p_dominio) then
    return jsonb_build_object('ok', false, 'error', 'tema');
  end if;
  v_motivo := brote_propia_motivo(v_titulo);
  if v_motivo is not null then return jsonb_build_object('ok', false, 'error', v_motivo); end if;
  if v_nota is not null and (char_length(v_nota) > (r ->> 'max_nota')::int or brote_matches_blocklist(v_nota)) then
    return jsonb_build_object('ok', false, 'error', 'nota');
  end if;

  v_hoy := (now() at time zone coalesce(v_prof.timezone, 'America/Argentina/Buenos_Aires'))::date;
  -- Las borradas cuentan para los dos topes: borrar no devuelve el lugar.
  select count(*), count(*) filter (where puntos > 0)
    into v_cargadas, v_con_puntos
    from acciones_propias where user_id = v_uid and local_date = v_hoy;
  if v_cargadas >= (r ->> 'max_por_dia')::int then
    return jsonb_build_object('ok', false, 'error', 'tope_dia');
  end if;
  if exists (select 1 from acciones_propias
              where user_id = v_uid and local_date = v_hoy and borrada_at is null
                and titulo_norm = brote_propia_normalizar(v_titulo)) then
    return jsonb_build_object('ok', false, 'error', 'repetida');
  end if;

  if v_con_puntos < (r ->> 'con_puntos_por_dia')::int then v_puntos := (r ->> 'puntos')::int; end if;

  insert into acciones_propias (user_id, titulo, titulo_norm, dominio, nota, local_date, puntos)
  values (v_uid, v_titulo, brote_propia_normalizar(v_titulo), p_dominio, v_nota, v_hoy, v_puntos)
  returning id into v_id;

  if v_puntos > 0 then
    update profiles set total_xp = total_xp + v_puntos where id = v_uid;
    insert into user_domain_points (user_id, domain_slug, points) values (v_uid, p_dominio, v_puntos)
      on conflict (user_id, domain_slug) do update set points = user_domain_points.points + v_puntos;
    v_ref := brote_propia_refrescar(v_uid, v_prof.total_xp);
  end if;

  return jsonb_build_object(
    'ok', true, 'id', v_id, 'puntos', v_puntos,
    'con_puntos_restantes', greatest((r ->> 'con_puntos_por_dia')::int - v_con_puntos - (case when v_puntos > 0 then 1 else 0 end), 0),
    'restantes', greatest((r ->> 'max_por_dia')::int - v_cargadas - 1, 0),
    'new_total', coalesce((v_ref ->> 'new_total')::bigint, v_prof.total_xp),
    'rank_up', coalesce((v_ref ->> 'rank_up')::boolean, false),
    'new_rank_slug', v_ref ->> 'new_rank_slug');
end $$;

create or replace function public.accion_propia_borrar(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid(); a acciones_propias%rowtype; v_prof profiles%rowtype; v_hoy date;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'no_autenticado'); end if;
  select * into v_prof from profiles where id = v_uid for update;
  select * into a from acciones_propias where id = p_id and user_id = v_uid and borrada_at is null for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'no_existe'); end if;
  v_hoy := (now() at time zone coalesce(v_prof.timezone, 'America/Argentina/Buenos_Aires'))::date;
  if a.local_date <> v_hoy then return jsonb_build_object('ok', false, 'error', 'otro_dia'); end if;

  update acciones_propias set borrada_at = now() where id = a.id;
  if a.puntos > 0 then
    update profiles set total_xp = greatest(total_xp - a.puntos, 0) where id = v_uid;
    update user_domain_points set points = greatest(points - a.puntos, 0)
     where user_id = v_uid and domain_slug = a.dominio;
    perform brote_propia_refrescar(v_uid, v_prof.total_xp);
  end if;
  return jsonb_build_object('ok', true, 'puntos', a.puntos);
end $$;

/** Lo que cargaste (lo más nuevo primero), y cómo viene el día. */
create or replace function public.mis_acciones_propias(p_limite int default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid(); r jsonb := brote_propias_reglas(); v_hoy date; v_cargadas int; v_con int;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'no_autenticado'); end if;
  select (now() at time zone coalesce(timezone, 'America/Argentina/Buenos_Aires'))::date into v_hoy
    from profiles where id = v_uid;
  select count(*), count(*) filter (where puntos > 0) into v_cargadas, v_con
    from acciones_propias where user_id = v_uid and local_date = v_hoy;
  return jsonb_build_object(
    'ok', true,
    'reglas', r,
    'hoy', jsonb_build_object(
      'fecha', v_hoy,
      'cargadas', v_cargadas,
      'con_puntos_restantes', greatest((r ->> 'con_puntos_por_dia')::int - v_con, 0),
      'restantes', greatest((r ->> 'max_por_dia')::int - v_cargadas, 0)),
    'acciones', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', a.id, 'titulo', a.titulo, 'dominio', a.dominio, 'nota', a.nota,
               'fecha', a.local_date, 'puntos', a.puntos, 'created_at', a.created_at,
               'borrable', a.local_date = v_hoy) order by a.created_at desc)
        from (select * from acciones_propias
               where user_id = v_uid and borrada_at is null
               order by created_at desc
               limit greatest(1, least(coalesce(p_limite, 30), 100))) a), '[]'::jsonb));
end $$;

/** El panel: lo último, lo más repetido (lo que le falta al catálogo) y quién carga mucho. */
create or replace function public.admin_acciones_propias(p_pass text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not admin_check(p_pass) then
    return jsonb_build_object('ok', false, 'error', 'Contraseña incorrecta');
  end if;
  return jsonb_build_object(
    'ok', true,
    'reglas', brote_propias_reglas(),
    'semana', (select jsonb_build_object(
                 'cargadas', count(*),
                 'personas', count(distinct user_id),
                 'puntos', coalesce(sum(puntos), 0))
                 from acciones_propias where created_at > now() - interval '7 days' and borrada_at is null),
    'repetidas', coalesce((
      select jsonb_agg(row_to_json(t)::jsonb order by t.veces desc)
        from (select titulo_norm, min(titulo) as ejemplo, mode() within group (order by dominio) as dominio,
                     count(*) as veces, count(distinct user_id) as personas
                from acciones_propias
               where created_at > now() - interval '30 days' and borrada_at is null
               group by titulo_norm
              having count(distinct user_id) >= 2
               order by count(*) desc
               limit 30) t), '[]'::jsonb),
    'ultimas', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', a.id, 'titulo', a.titulo, 'dominio', a.dominio, 'puntos', a.puntos,
               'fecha', a.local_date, 'created_at', a.created_at, 'borrada', a.borrada_at is not null,
               'usuario', p.username, 'cuenta', p.account_type) order by a.created_at desc)
        from (select * from acciones_propias order by created_at desc limit 80) a
        join profiles p on p.id = a.user_id), '[]'::jsonb));
end $$;

revoke all on function public.brote_propias_reglas() from public, anon;
revoke all on function public.brote_propia_normalizar(text) from public, anon, authenticated;
revoke all on function public.brote_propia_motivo(text) from public, anon, authenticated;
revoke all on function public.brote_propia_refrescar(uuid, bigint) from public, anon, authenticated;
revoke all on function public.accion_propia_registrar(text, text, text) from public, anon;
revoke all on function public.accion_propia_borrar(uuid) from public, anon;
revoke all on function public.mis_acciones_propias(int) from public, anon;
revoke all on function public.admin_acciones_propias(text) from public, anon;
grant execute on function public.brote_propias_reglas() to authenticated;
grant execute on function public.accion_propia_registrar(text, text, text) to authenticated;
grant execute on function public.accion_propia_borrar(uuid) to authenticated;
grant execute on function public.mis_acciones_propias(int) to authenticated;
grant execute on function public.admin_acciones_propias(text) to authenticated;

-- ── 2 · Eliminar un negocio ──────────────────────────────────────────────────

create table if not exists public.negocios_eliminados (
  business_id      uuid primary key,
  nombre_comercial text not null,
  slug             text not null,
  eliminado_por    uuid references public.profiles (id) on delete set null,
  eliminado_at     timestamptz not null default now()
);
alter table public.negocios_eliminados enable row level security;
revoke all on public.negocios_eliminados from public, anon, authenticated;

/**
 * ¿Se puede eliminar? Lo mismo que mira `negocio_eliminar`, sin borrar nada:
 * la pantalla lo pregunta antes de borrar los archivos.
 */
create or replace function public.negocio_eliminar_revisar(p_business_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare v_uid uuid := auth.uid(); b businesses%rowtype;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'no_autenticado'); end if;
  select * into b from businesses where id = p_business_id;
  if not found then return jsonb_build_object('ok', false, 'error', 'no_existe'); end if;
  if brote_biz_role(b.id) is distinct from 'owner' then return jsonb_build_object('ok', false, 'error', 'solo_duenio'); end if;
  if b.slug like 'demo-%' then return jsonb_build_object('ok', false, 'error', 'es_demo'); end if;
  if exists (select 1 from business_subscriptions s
              where s.business_id = b.id and s.status in ('activa', 'en_gracia', 'pausada')
                and s.external_id is not null and coalesce(s.monto, 0) > 0) then
    return jsonb_build_object('ok', false, 'error', 'plan_activo');
  end if;
  return jsonb_build_object(
    'ok', true, 'nombre', b.nombre_comercial,
    'listados', (select count(*) from listings where business_id = b.id),
    'equipo', (select count(*) from business_members where business_id = b.id),
    'certificados', (select count(*) from empresa_certificados where business_id = b.id and revocado_at is null));
end $$;

create or replace function public.negocio_eliminar(p_business_id uuid, p_confirmacion text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_uid uuid := auth.uid(); b businesses%rowtype; v_rev jsonb;
begin
  v_rev := negocio_eliminar_revisar(p_business_id);
  if not coalesce((v_rev ->> 'ok')::boolean, false) then return v_rev; end if;
  select * into b from businesses where id = p_business_id for update;
  if brote_nombre_normalizado(coalesce(p_confirmacion, '')) is distinct from brote_nombre_normalizado(b.nombre_comercial)
     or btrim(coalesce(p_confirmacion, '')) = '' then
    return jsonb_build_object('ok', false, 'error', 'confirmacion');
  end if;

  insert into negocios_eliminados (business_id, nombre_comercial, slug, eliminado_por)
  values (b.id, b.nombre_comercial, b.slug, v_uid)
  on conflict (business_id) do nothing;
  -- Todo lo demás cae en cascada (miembros, listados, objetivos, planes,
  -- desafíos, certificados, avisos). `brote_biz_sucesion` ve que el negocio ya
  -- no existe y no intenta pasar la titularidad.
  delete from businesses where id = b.id;
  return jsonb_build_object('ok', true, 'nombre', b.nombre_comercial);
end $$;

revoke all on function public.negocio_eliminar_revisar(uuid) from public, anon;
revoke all on function public.negocio_eliminar(uuid, text) from public, anon;
grant execute on function public.negocio_eliminar_revisar(uuid) to authenticated;
grant execute on function public.negocio_eliminar(uuid, text) to authenticated;

-- La dueña lista y borra los archivos del negocio antes de eliminarlo. Antes
-- nadie podía listar las fotos ni borrar la evidencia, así que quedaban para
-- siempre en el almacenamiento.
drop policy if exists "negocios dueño lista archivos" on storage.objects;
create policy "negocios dueño lista archivos" on storage.objects for select to authenticated
  using (bucket_id in ('business-logos', 'listing-images') and brote_storage_negocio(name, 'owner'));

drop policy if exists "negocios dueño borra evidencia" on storage.objects;
create policy "negocios dueño borra evidencia" on storage.objects for delete to authenticated
  using (bucket_id = 'business-evidence' and brote_storage_negocio(name, 'owner'));
