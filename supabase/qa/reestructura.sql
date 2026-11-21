-- QA de 0150 (docs/REESTRUCTURA.md) contra la base viva, SIN dejar rastro:
-- todo corre en un bloque que termina con `raise exception 'QA_RESULT …'`, así
-- que el usuario temporal, sus acciones y sus puntos se deshacen.
-- Correr con execute_sql y leer el JSON del mensaje de error.
do $$
declare
  v_uid uuid := gen_random_uuid();
  r jsonb := '{}'::jsonb;
  a jsonb; b jsonb; c jsonb; d jsonb; e jsonb;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at, email_confirmed_at)
  values (v_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
          'qa-0150-' || v_uid || '@brote.test', '{}'::jsonb, now(), now(), now());
  if not exists (select 1 from profiles where id = v_uid) then
    raise exception 'QA_RESULT {"error":"handle_new_user no creó el perfil"}';
  end if;
  perform set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);

  a := accion_propia_registrar('Llevé bolsas al súper', 'residuos', null);
  r := r || jsonb_build_object('registrar', a);
  b := accion_propia_registrar('LLEVÉ bolsas al super!!', 'residuos', null);
  r := r || jsonb_build_object('repetida', b->>'error');
  c := accion_propia_registrar('asdfasdf', 'agua', null);
  r := r || jsonb_build_object('basura', c->>'error');
  r := r || jsonb_build_object('xp', (select total_xp from profiles where id = v_uid),
                               'puntos_tema', (select points from user_domain_points where user_id = v_uid and domain_slug = 'residuos'),
                               'completions', (select count(*) from activity_completions where user_id = v_uid));
  d := mis_acciones_propias(10);
  r := r || jsonb_build_object('hoy', d->'hoy', 'lista', jsonb_array_length(d->'acciones'));
  e := accion_propia_borrar((a->>'id')::uuid);
  r := r || jsonb_build_object('borrar', e, 'xp_despues', (select total_xp from profiles where id = v_uid));
  r := r || jsonb_build_object('negocio_ajeno', negocio_eliminar_revisar((select id from businesses order by created_at limit 1)));
  r := r || jsonb_build_object('panel_sin_permiso', admin_acciones_propias('x')->>'ok');
  raise exception 'QA_RESULT %', r;
end $$;
