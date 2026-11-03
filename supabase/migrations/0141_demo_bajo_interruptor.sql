-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0141 — Todo lo que no es real, bajo un solo interruptor.
--
-- `simulated_players_enabled` ya vaciaba los tableros de jugadores simulados.
-- Ahora también manda sobre el resto de lo inventado: apagado, desaparece todo
-- lo que no es real, y prendido vuelve igual. Nada se borra.
--
--   · Jugadores simulados: como siempre (`simulated_board` mira el interruptor).
--   · Tiendas DEMO (`slug like 'demo-%'`) y sus productos: la tienda queda
--     suspendida. Todas las lecturas del Mercado piden `status = 'approved'`, y
--     la lectura directa de la tabla `listings` pasa a pedirlo también.
--   · Proyectos de ejemplo (`es_demo`): en pausa, que los saca de las listas.
--
-- Va con un trigger sobre `app_settings`: da igual desde dónde se cambie.
-- ════════════════════════════════════════════════════════════════════════════

alter table public.businesses add column if not exists demo_oculta boolean not null default false;
alter table public.projects add column if not exists es_demo boolean not null default false;
alter table public.projects add column if not exists demo_oculto boolean not null default false;
grant select (es_demo) on public.projects to anon, authenticated;

-- Los proyectos sembrados: los cuatro sin organizador y con la misma fecha de
-- carga. Una cuenta borrada también deja un proyecto sin organizador, pero
-- ninguna de las que existen hoy viene de ahí.
update public.projects set es_demo = true
 where creator_id is null and created_at < date '2026-11-03';

-- La cuenta que figura como dueña de las tiendas DEMO no es una persona: que no
-- cuente en la analítica ni en los tableros.
update public.profiles p set es_prueba = true
 where p.display_name = 'Comercios de demostración'
   and exists (select 1 from public.businesses b where b.created_by = p.id and b.slug like 'demo-%');

-- Las tiendas suspendidas no se ven tampoco leyendo la tabla directo.
drop policy if exists "listings publicos" on public.listings;
create policy "listings publicos" on public.listings for select to authenticated
  using (status = 'publicado'::listing_status
         and brote_mercado_puede_ver(categoria)
         and exists (select 1 from public.businesses b where b.id = business_id and b.status = 'approved'::business_status));

-- Volver a prender no puede gastar lugares de fundadora: son para negocios reales.
create or replace function public.brote_biz_marcar_fundador()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if new.status = 'approved' and coalesce(old.status::text, '') <> 'approved' and not new.fundador
     and new.slug not like 'demo-%' then
    if (select count(*) from businesses where fundador and slug not like 'demo-%') < 30 then
      new.fundador := true;
    end if;
  end if;
  return new;
end $fn$;
revoke all on function public.brote_biz_marcar_fundador() from public, anon, authenticated;

-- ── Aplicar el interruptor ──────────────────────────────────────────────────

create or replace function public.brote_demo_aplicar(p_visible boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_tiendas int := 0; v_proyectos int := 0;
begin
  if p_visible then
    update businesses set status = 'approved', demo_oculta = false, updated_at = now()
     where demo_oculta;
    get diagnostics v_tiendas = row_count;
    update projects set pausado_at = null, demo_oculto = false, updated_at = now()
     where demo_oculto;
    get diagnostics v_proyectos = row_count;
  else
    update businesses set status = 'suspended', demo_oculta = true, updated_at = now()
     where slug like 'demo-%' and status = 'approved';
    get diagnostics v_tiendas = row_count;
    update projects set pausado_at = now(), demo_oculto = true, updated_at = now()
     where es_demo and pausado_at is null;
    get diagnostics v_proyectos = row_count;
  end if;
  return jsonb_build_object('tiendas', v_tiendas, 'proyectos', v_proyectos);
end $$;
revoke all on function public.brote_demo_aplicar(boolean) from public, anon, authenticated;

create or replace function public.brote_demo_interruptor()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or old.value is distinct from new.value then
    perform brote_demo_aplicar(coalesce((new.value #>> '{}')::boolean, false));
  end if;
  return null;
end $$;
revoke all on function public.brote_demo_interruptor() from public, anon, authenticated;

drop trigger if exists app_settings_demo on public.app_settings;
create trigger app_settings_demo
  after insert or update of value on public.app_settings
  for each row when (new.key = 'simulated_players_enabled')
  execute function public.brote_demo_interruptor();

update public.app_settings
   set description = 'Datos de demostración: jugadores simulados, tiendas y productos DEMO y proyectos de ejemplo. Apagado, desaparece todo lo que no es real. Nada se borra.'
 where key = 'simulated_players_enabled';

-- Lo que el panel muestra al lado del interruptor.
create or replace function public.admin_demo_resumen(p_pass text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not admin_check(p_pass) then return jsonb_build_object('ok', false, 'error', 'Sin acceso'); end if;
  return jsonb_build_object(
    'ok', true,
    'visible', coalesce((select (value #>> '{}')::boolean from app_settings where key = 'simulated_players_enabled'), false),
    'jugadores', (select count(*) from simulated_players),
    'tiendas', (select count(*) from businesses where slug like 'demo-%'),
    'productos', (select count(*) from listings l join businesses b on b.id = l.business_id
                   where b.slug like 'demo-%' and l.status = 'publicado'),
    'proyectos', (select count(*) from projects where es_demo));
end $$;
revoke all on function public.admin_demo_resumen(text) from public, anon;
grant execute on function public.admin_demo_resumen(text) to authenticated;

-- La lista de cuentas de prueba es para probar la app: la cuenta de las tiendas
-- DEMO no se configura ni se borra desde ahí.
create or replace function public.admin_cuentas_prueba(p_pass text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if not admin_check(p_pass) then
    return jsonb_build_object('ok', false, 'error', 'Sin acceso');
  end if;
  return jsonb_build_object('ok', true, 'cuentas', coalesce((
    select jsonb_agg(jsonb_build_object(
             'email', u.email, 'usuario', p.username, 'nombre', p.display_name,
             'tipo', p.account_type, 'rango', p.current_rank_slug,
             'tier', (brote_get_rank(p.total_xp)->>'tier')::int,
             'liga', coalesce((select ru.tier from rango_usuario ru where ru.user_id = p.id), 1),
             'negocios', (select coalesce(jsonb_agg(jsonb_build_object('nombre', b.nombre_comercial, 'objetivo', b.objetivo)), '[]'::jsonb)
                            from business_members m join businesses b on b.id = m.business_id
                           where m.user_id = p.id and m.role = 'owner'))
           order by u.email)
      from profiles p join auth.users u on u.id = p.id
     where p.es_prueba
       and not exists (select 1 from businesses d where d.created_by = p.id and d.slug like 'demo-%')), '[]'::jsonb));
end $fn$;
