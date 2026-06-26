-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0008 — Fix brote_compute_mundo: loop var must be text (the elements
-- come from jsonb_array_elements_text), not jsonb.
-- ════════════════════════════════════════════════════════════════════════════
create or replace function brote_compute_mundo(p_xp bigint, p_streak int, p_domain_points jsonb)
returns jsonb language plpgsql stable set search_path = public as $$
declare
  v_tier      int;
  v_elements  text[] := '{}';
  v_live      numeric;
  v_dom       text := null;
  v_best      numeric := 0;
  v_palette   text;
  v_pip       text;
  v_cosmetics text[] := '{}';
  k           text;
  v           numeric;
  tier_map    jsonb := jsonb_build_object(
    '1', jsonb_build_array('soil'),
    '2', jsonb_build_array('grass','sprout'),
    '3', jsonb_build_array('flowers'),
    '4', jsonb_build_array('small_tree'),
    '5', jsonb_build_array('shrubs','bird'),
    '6', jsonb_build_array('full_tree'),
    '7', jsonb_build_array('grove','pond','butterflies'),
    '8', jsonb_build_array('guardian_aura'),
    '9', jsonb_build_array('rich_biome'),
    '10', jsonb_build_array('globe'),
    '11', jsonb_build_array('golden')
  );
  t  int;
  el text;
begin
  v_tier := (brote_get_rank(p_xp)->>'tier')::int;

  for t in 1..v_tier loop
    if tier_map ? t::text then
      for el in select value from jsonb_array_elements_text(tier_map->t::text) as value loop
        v_elements := array_append(v_elements, el);
      end loop;
    end if;
  end loop;

  v_live := round(0.35 + 0.65 * least(1.0, greatest(0, p_streak) / 30.0), 3);

  if p_domain_points is not null then
    for k, v in select key, value::numeric from jsonb_each_text(p_domain_points) loop
      if v > v_best then v_best := v; v_dom := k; end if;
    end loop;
  end if;
  if v_best <= 0 then v_dom := null; end if;

  if v_tier >= 11 then v_palette := 'golden';
  elsif v_dom in ('agua','agua_azul') then v_palette := 'aqua';
  elsif v_tier >= 5 then v_palette := 'lush';
  else v_palette := 'default';
  end if;

  if v_tier >= 8  then v_cosmetics := array_append(v_cosmetics, 'guardian_aura'); end if;
  if v_tier >= 10 then v_cosmetics := array_append(v_cosmetics, 'globe_form'); end if;
  if v_tier >= 11 then v_cosmetics := array_append(v_cosmetics, 'golden_world'); end if;

  if    v_tier >= 11 then v_pip := 'radiant';
  elsif v_tier >= 8  then v_pip := 'guardian';
  elsif v_tier >= 4  then v_pip := 'leafy';
  elsif v_tier >= 2  then v_pip := 'sprout';
  else  v_pip := 'seed';
  end if;

  return jsonb_build_object(
    'rankTier', v_tier,
    'structuralElements', to_jsonb(v_elements),
    'liveliness', v_live,
    'dominantDomain', v_dom,
    'palette', v_palette,
    'unlockedCosmetics', to_jsonb(v_cosmetics),
    'pipStage', v_pip,
    'lastComputed', to_jsonb(now())
  );
end $$;
