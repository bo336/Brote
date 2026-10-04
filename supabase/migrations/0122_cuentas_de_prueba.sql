-- 0122 — Cuentas de prueba, configurables desde /panel.
--
-- El dueño necesita ver la app como la ve cada tipo de cuenta (chico,
-- adolescente, adulto, tienda, empresa que mejora) y el mundo en cada rango,
-- sin tocar SQL. El camino simple:
--
--   1. Crea las cuentas él mismo, con alias de Gmail que llegan a su misma
--      casilla: tucorreo+chico@gmail.com, tucorreo+adolescente@gmail.com…
--      (entrar con el enlace por mail: sin contraseñas).
--   2. En /panel → Pruebas elige, para cada una, el tipo de cuenta, el rango y si
--      tiene una tienda o una empresa. Un toque.
--
-- Sólo se puede configurar una cuenta cuyo mail tenga un "+" (o que ya esté
-- marcada de prueba): así nunca se le cambian los puntos o el tipo a una
-- cuenta real por un error de tipeo. Quedan marcadas `es_prueba`, con el
-- perfil privado, y se pueden borrar del todo desde el mismo lugar.

alter table public.profiles add column if not exists es_prueba boolean not null default false;

create or replace function public.admin_cuenta_prueba(
  p_pass text, p_email text, p_tipo text, p_tier int, p_negocio text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_uid uuid; v_email text := lower(trim(coalesce(p_email, ''))); v_xp bigint; v_rank jsonb;
  v_prof profiles%rowtype; v_biz uuid; v_dom jsonb; v_comp bigint; v_nombre text;
begin
  if not admin_check(p_pass) then
    return jsonb_build_object('ok', false, 'error', 'Contraseña incorrecta');
  end if;
  if p_tipo not in ('kid', 'teen', 'adult') then
    return jsonb_build_object('ok', false, 'error', 'Tipo de cuenta inválido');
  end if;
  if p_tier is null or p_tier not between 1 and 11 then
    return jsonb_build_object('ok', false, 'error', 'El rango va de 1 a 11');
  end if;
  if coalesce(p_negocio, 'ninguno') not in ('ninguno', 'vender', 'mejorar', 'ambos') then
    return jsonb_build_object('ok', false, 'error', 'Negocio inválido');
  end if;
  if p_negocio in ('vender', 'mejorar', 'ambos') and p_tipo <> 'adult' then
    return jsonb_build_object('ok', false, 'error', 'Sólo una cuenta adulta puede tener una tienda o una empresa');
  end if;

  select id into v_uid from auth.users where lower(email) = v_email;
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'No hay ninguna cuenta con ese mail. Creala primero entrando a la app con ese mail.');
  end if;
  select * into v_prof from profiles where id = v_uid;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'La cuenta todavía no tiene perfil: entrá una vez con ese mail.');
  end if;
  if position('+' in v_email) = 0 and not v_prof.es_prueba then
    return jsonb_build_object('ok', false, 'error',
      'Por seguridad sólo se configuran mails con un "+" (por ejemplo tucorreo+chico@gmail.com). Así nunca se toca una cuenta real.');
  end if;

  select xp_threshold into v_xp from ranks where tier = p_tier;
  v_xp := coalesce(v_xp, 0) + 1;
  v_rank := brote_get_rank(v_xp);
  select coalesce(jsonb_object_agg(domain_slug, points), '{}'::jsonb) into v_dom from user_domain_points where user_id = v_uid;
  select count(*) into v_comp from activity_completions where user_id = v_uid and status in ('honor', 'verified');

  update profiles
     set account_type = p_tipo::account_type,
         onboarding_completed = true,
         display_name = coalesce(nullif(display_name, ''),
                                 'Prueba ' || case p_tipo when 'kid' then 'chico' when 'teen' then 'adolescente' else 'adulto' end),
         total_xp = v_xp,
         current_rank_slug = v_rank->>'slug',
         current_division = coalesce((v_rank->>'division')::int, 1),
         mundo_state = brote_compute_mundo(v_xp, coalesce(current_streak, 0), v_dom, v_comp),
         profile_visibility = 'private',
         es_prueba = true
   where id = v_uid;

  if p_negocio in ('vender', 'mejorar', 'ambos') then
    select b.id into v_biz from business_members m join businesses b on b.id = m.business_id
     where m.user_id = v_uid and m.role = 'owner' order by b.created_at limit 1;
    v_nombre := case p_negocio when 'vender' then '(PRUEBA) Tienda' when 'mejorar' then '(PRUEBA) Empresa' else '(PRUEBA) Tienda y empresa' end;
    if v_biz is null then
      insert into businesses (slug, nombre_comercial, rubro, tamano, provincia, modelo, objetivo, status, tier,
                              intereses, created_by, alta_paso, activa_at)
      values (brote_slugify(v_nombre || ' ' || substr(v_uid::text, 1, 6)), v_nombre, 'comercio-minorista', '2-10',
              'Buenos Aires',
              case p_negocio when 'mejorar' then 'empresa' else 'vendedor' end,
              p_negocio, 'approved', 'e1',
              case p_negocio when 'vender' then '{mercado}'::text[] when 'mejorar' then '{mejora}'::text[] else '{mejora,mercado}'::text[] end,
              v_uid, 5, now())
      returning id into v_biz;
      insert into business_members (business_id, user_id, role) values (v_biz, v_uid, 'owner');
      insert into improvement_dossiers (business_id) values (v_biz) on conflict (business_id) do nothing;
    else
      update businesses set objetivo = p_negocio, status = 'approved', updated_at = now() where id = v_biz;
    end if;
  end if;

  return jsonb_build_object('ok', true, 'usuario', v_prof.username, 'xp', v_xp, 'rango', v_rank->>'slug', 'negocio', v_biz);
end $fn$;

create or replace function public.admin_cuentas_prueba(p_pass text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if not admin_check(p_pass) then
    return jsonb_build_object('ok', false, 'error', 'Contraseña incorrecta');
  end if;
  return jsonb_build_object('ok', true, 'cuentas', coalesce((
    select jsonb_agg(jsonb_build_object(
             'email', u.email, 'usuario', p.username, 'nombre', p.display_name,
             'tipo', p.account_type, 'rango', p.current_rank_slug,
             'tier', (brote_get_rank(p.total_xp)->>'tier')::int,
             'negocios', (select coalesce(jsonb_agg(jsonb_build_object('nombre', b.nombre_comercial, 'objetivo', b.objetivo)), '[]'::jsonb)
                            from business_members m join businesses b on b.id = m.business_id
                           where m.user_id = p.id and m.role = 'owner'))
           order by u.email)
      from profiles p join auth.users u on u.id = p.id
     where p.es_prueba), '[]'::jsonb));
end $fn$;

-- Borrar del todo una cuenta de prueba (y lo que creó: tiendas, objetivos,
-- acciones, su isla). Sólo cuentas marcadas de prueba.
create or replace function public.admin_cuenta_prueba_borrar(p_pass text, p_email text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $fn$
declare v_uid uuid;
begin
  if not admin_check(p_pass) then
    return jsonb_build_object('ok', false, 'error', 'Contraseña incorrecta');
  end if;
  select u.id into v_uid from auth.users u join profiles p on p.id = u.id
   where lower(u.email) = lower(trim(coalesce(p_email, ''))) and p.es_prueba;
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'No es una cuenta de prueba');
  end if;
  delete from businesses b
   where exists (select 1 from business_members m where m.business_id = b.id and m.user_id = v_uid and m.role = 'owner')
     and not exists (select 1 from business_members m where m.business_id = b.id and m.user_id <> v_uid);
  delete from auth.users where id = v_uid;
  return jsonb_build_object('ok', true);
end $fn$;

revoke all on function public.admin_cuenta_prueba(text, text, text, int, text) from public, anon;
revoke all on function public.admin_cuentas_prueba(text) from public, anon;
revoke all on function public.admin_cuenta_prueba_borrar(text, text) from public, anon;
grant execute on function public.admin_cuenta_prueba(text, text, text, int, text) to authenticated;
grant execute on function public.admin_cuentas_prueba(text) to authenticated;
grant execute on function public.admin_cuenta_prueba_borrar(text, text) to authenticated;
