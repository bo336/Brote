-- ============================================================================
-- MUNDO — completar el censo de una región
--
-- `11-GAME-LOOP.md` §3.3: "Completar el censo de una región paga un cosmético
-- y una página de la Bitácora." La página ya existe del lado del cliente; esto
-- es el cosmético.
--
-- **El servidor verifica, el cliente sólo avisa.** El cliente sabe cuándo se
-- completó una región porque dibuja la Bitácora, pero saberlo no es poder
-- cobrarlo: acá se vuelve a contar contra `world_species` y `world_journal`, y
-- si no está completa no se entrega nada.
--
-- Puramente aditivo: una función nueva. Ninguna tabla cambia.
-- ============================================================================

-- Un cosmético de Pip por región. Los props se compran con semillas; estos se
-- ganan mirando, que es otra cosa y se tiene que sentir distinto.
create or replace function public.world_region_cosmetic(p_region text)
returns text language sql immutable as $fn$
  select case p_region
    when 'claro'     then 'pip_pattern_hojitas'
    when 'pradera'   then 'pip_hat_sombrero'
    when 'jardin'    then 'pip_pattern_estrellas'
    when 'arboleda'  then 'pip_body_bosque'
    when 'rio'       then 'pip_pattern_olitas'
    when 'monte'     then 'pip_hat_casco'
    when 'cumbre'    then 'pip_body_glaciar'
    when 'islote'    then 'pip_glasses_aviador'
    when 'monumento' then 'pip_body_aurora'
  end;
$fn$;

-- Entrega el cosmético de una región si el censo está realmente completo.
--
-- Idempotente: `on conflict do nothing`, así que llamarla cinco veces entrega
-- una vez. Nunca escribe XP ni semillas — un cosmético ganado no es moneda.
create or replace function public.world_region_census(p_region text)
returns jsonb language plpgsql security definer set search_path = public as $fn$
declare
  v_uid uuid := auth.uid();
  v_tier int;
  v_total int;
  v_seen int;
  v_slug text;
  v_granted boolean := false;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  v_slug := world_region_cosmetic(p_region);
  if v_slug is null then
    return jsonb_build_object('ok', false, 'reason', 'unknown_region');
  end if;

  v_tier := world_tier_of(v_uid);

  -- Sólo lo que este jugador puede alcanzar hoy. Decirle que completó algo que
  -- todavía no puede completar sería mentirle, y la costura con la app vive de
  -- que no le mintamos.
  select count(*) into v_total
    from public.world_species s
   where s.region = p_region and s.active and s.min_tier <= v_tier;

  if v_total = 0 then
    return jsonb_build_object('ok', false, 'reason', 'nothing_to_see');
  end if;

  select count(*) into v_seen
    from public.world_species s
    join public.world_journal j
      on j.species_slug = s.slug and j.user_id = v_uid
   where s.region = p_region and s.active and s.min_tier <= v_tier;

  if v_seen < v_total then
    return jsonb_build_object('ok', false, 'reason', 'incomplete',
                              'seen', v_seen, 'total', v_total);
  end if;

  insert into public.user_cosmetics (user_id, slug)
  values (v_uid, v_slug)
  on conflict do nothing;
  v_granted := found;

  return jsonb_build_object('ok', true, 'granted', v_granted, 'cosmetic', v_slug);
end $fn$;

revoke all on function public.world_region_cosmetic(text) from public, anon, authenticated;
revoke all on function public.world_region_census(text)   from public, anon;
grant execute on function public.world_region_census(text) to authenticated;
