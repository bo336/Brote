-- Brote — 0079 — La Academia: el ensamblador de ítems derivados.
--
-- POR QUÉ ES UNA MIGRACIÓN Y NO PARTE DEL SEED. Es una función, y las funciones
-- van en migraciones: así se versiona, se revisa y se vuelve a aplicar sola en
-- una base nueva. `supabase/seed-academia.sql` carga los DATOS y termina
-- diciendo que hay que llamar a esta función una vez.
--
-- QUÉ PROBLEMA RESUELVE. Las 44 plantillas autoradas son la prueba de que la
-- abstracción funciona, pero tocan un puñado de conceptos. El criterio de
-- aceptación es más duro: "se puede componer una sesión para CUALQUIER gajo de
-- anillo 1". Con solo las autoradas, la enorme mayoría del árbol no tendría un
-- solo ejercicio para servir y `academia_start_session` devolvería
-- `sin_contenido` en casi todos lados.
--
-- Por cada concepto arma:
--   1. una microlectura con su propio enunciado,
--   2. "¿cuál de estas afirmaciones describe X?" — clave: su enunciado,
--   3. "leé esto: … ¿de qué estamos hablando?" — clave: su título,
--   4. un mito/dato, si el concepto tiene creencias falsas documentadas.
--
-- LOS DISTRACTORES. Salen de conceptos HERMANOS: misma rama, distinto gajo. Es
-- la tercera estrategia del cascade de 11-exercise-types.md §2 —vecinos
-- semánticos, la de último recurso— y es legítima acá porque cada opción es una
-- afirmación verdadera con su propia fuente. La pregunta no es "cuál es verdad"
-- sino "cuál describe ESTE concepto", así que hay una sola respuesta defendible.
-- Si no hay tres hermanos utilizables, el concepto se saltea: es mejor un
-- concepto sin ítem derivado que un ítem con dos opciones defendibles.
--
-- Idempotente: `on conflict` en todo y semillas deterministas, así que correrla
-- dos veces no duplica nada ni cambia lo ya servido.

create or replace function ac_sembrar_derivados()
returns jsonb language plpgsql volatile security definer set search_path = public as $sem$
declare
  c record; v_pl uuid; v_hermanos jsonb; v_ops jsonb; v_clave text;
  v_n int := 0; v_saltados int := 0; v_i int; v_seed bigint; v_mc record; v_k int;
begin
  for c in
    select co.id, co.slug, co.titulo_es, co.enunciado_es, co.detalle_es, co.rama_slug,
           co.anillo, co.dificultad_base, co.age_groups, co.fuente_id,
           min(h.gajo_id) as gajo_id
    from ac_conceptos co
    join ac_hoja_conceptos hc on hc.concepto_id = co.id
    join ac_hojas h on h.id = hc.hoja_id and h.status = 'aprobado'
    where co.status = 'aprobado'
    group by co.id
  loop
    -- Semilla determinista por concepto: el mismo ítem se reconstruye igual
    -- siempre, que es lo único que le pedimos al par (plantilla_id, seed).
    v_seed := abs(hashtextextended(c.slug, 42) % 2000000000);

    -- ── 1 · microlectura ────────────────────────────────────────────────────
    insert into ac_plantillas (tipo, titulo_interno, enunciado_tpl, slots, solucion_tpl,
                               age_groups, anillo_min, dificultad_base, fuente_id, generator_hash, status)
    values ('microlectura', 'Microlectura · ' || c.titulo_es, c.titulo_es,
            jsonb_build_object('derivada', true),
            jsonb_build_object('estrategia', 'derivada', 'concepto', c.slug),
            c.age_groups, c.anillo, c.dificultad_base, c.fuente_id, 'der.ml.' || c.slug, 'aprobado')
    on conflict (tipo, generator_hash) do update set titulo_interno = excluded.titulo_interno,
      age_groups = excluded.age_groups, anillo_min = excluded.anillo_min, status = 'aprobado'
    returning id into v_pl;

    insert into ac_plantilla_conceptos (plantilla_id, concepto_id, peso)
    values (v_pl, c.id, 1.0) on conflict (plantilla_id, concepto_id) do nothing;

    insert into ac_items (plantilla_id, seed, payload_publico, solucion, slot_valores,
                          age_groups, anillo_min, dificultad, status)
    values (v_pl, v_seed,
      jsonb_build_object('tipo', 'microlectura', 'enunciado', c.titulo_es,
        'cuerpo', c.enunciado_es || coalesce(' ' || c.detalle_es, ''),
        'destacado', c.titulo_es, 'ayuda', null),
      jsonb_build_object('fuente_id', c.fuente_id),
      jsonb_build_object('region', 'general'), c.age_groups, c.anillo, c.dificultad_base, 'aprobado')
    on conflict (plantilla_id, seed) do update set payload_publico = excluded.payload_publico,
      solucion = excluded.solucion, age_groups = excluded.age_groups, status = 'aprobado';

    -- ── Hermanos utilizables ────────────────────────────────────────────────
    -- `age_groups @> c.age_groups` es deliberado: el distractor tiene que ser
    -- apto para TODA edad que pueda ver el concepto, o un ítem para chicos
    -- terminaría mostrando una opción que no le corresponde.
    select jsonb_agg(x order by orden) into v_hermanos from (
      select jsonb_build_object('titulo', co2.titulo_es, 'enunciado', co2.enunciado_es) as x,
             md5(co2.slug || c.slug) as orden
      from ac_conceptos co2
      join ac_hoja_conceptos hc2 on hc2.concepto_id = co2.id
      join ac_hojas h2 on h2.id = hc2.hoja_id and h2.status = 'aprobado'
      where co2.rama_slug = c.rama_slug and co2.id <> c.id and h2.gajo_id <> c.gajo_id
        and co2.status = 'aprobado' and co2.age_groups @> c.age_groups
      group by co2.id, co2.titulo_es, co2.enunciado_es, co2.slug
      limit 3) s;

    if v_hermanos is null or jsonb_array_length(v_hermanos) < 3 then
      v_saltados := v_saltados + 1;
      continue;
    end if;

    -- ── 2 · ¿cuál afirmación describe el concepto? ──────────────────────────
    insert into ac_plantillas (tipo, titulo_interno, enunciado_tpl, slots, solucion_tpl, distractores,
                               age_groups, anillo_min, dificultad_base, fuente_id, generator_hash, status)
    values ('opcion_multiple', 'Cuál describe · ' || c.titulo_es,
            '¿Cuál de estas afirmaciones describe «' || c.titulo_es || '»?',
            jsonb_build_object('derivada', true),
            jsonb_build_object('estrategia', 'derivada', 'concepto', c.slug),
            jsonb_build_object('estrategia', 'vecinos'),
            c.age_groups, c.anillo, c.dificultad_base, c.fuente_id, 'der.om1.' || c.slug, 'aprobado')
    on conflict (tipo, generator_hash) do update set enunciado_tpl = excluded.enunciado_tpl,
      age_groups = excluded.age_groups, anillo_min = excluded.anillo_min, status = 'aprobado'
    returning id into v_pl;
    insert into ac_plantilla_conceptos (plantilla_id, concepto_id, peso)
    values (v_pl, c.id, 1.0) on conflict (plantilla_id, concepto_id) do nothing;

    -- La clave rota de posición según el concepto: ni el orden almacenado ni la
    -- posición filtran nada aunque algún día fallara el barajado por entrega.
    v_k := (v_seed % 4)::int + 1;
    v_ops := '[]'::jsonb; v_clave := null;
    for v_i in 1..4 loop
      if v_i = v_k then
        v_ops := v_ops || jsonb_build_array(jsonb_build_object('id', 'o' || v_i, 'texto', c.enunciado_es));
        v_clave := 'o' || v_i;
      else
        v_ops := v_ops || jsonb_build_array(jsonb_build_object('id', 'o' || v_i,
          'texto', v_hermanos -> (case when v_i < v_k then v_i - 1 else v_i - 2 end) ->> 'enunciado'));
      end if;
    end loop;

    insert into ac_items (plantilla_id, seed, payload_publico, solucion, slot_valores,
                          age_groups, anillo_min, dificultad, status)
    values (v_pl, v_seed,
      jsonb_build_object('tipo', 'opcion_multiple',
        'enunciado', '¿Cuál de estas afirmaciones describe «' || c.titulo_es || '»?',
        'opciones', v_ops, 'ayuda', null),
      jsonb_build_object('clave', jsonb_build_array(v_clave),
        'explicacion', c.enunciado_es || coalesce(' ' || c.detalle_es, ''),
        'fuente_id', c.fuente_id, 'por_opcion', '{}'::jsonb),
      jsonb_build_object('region', 'general'), c.age_groups, c.anillo, c.dificultad_base, 'aprobado')
    on conflict (plantilla_id, seed) do update set payload_publico = excluded.payload_publico,
      solucion = excluded.solucion, age_groups = excluded.age_groups, status = 'aprobado';

    -- ── 3 · leé la idea, ¿de qué concepto es? ───────────────────────────────
    -- Es reconocimiento en la dirección contraria. Un poco más difícil que la
    -- anterior, por eso el +0.2.
    insert into ac_plantillas (tipo, titulo_interno, enunciado_tpl, slots, solucion_tpl, distractores,
                               age_groups, anillo_min, dificultad_base, fuente_id, generator_hash, status)
    values ('opcion_multiple', 'Qué idea es · ' || c.titulo_es,
            'Leé esto: «' || c.enunciado_es || '» ¿De qué estamos hablando?',
            jsonb_build_object('derivada', true),
            jsonb_build_object('estrategia', 'derivada', 'concepto', c.slug),
            jsonb_build_object('estrategia', 'vecinos'),
            c.age_groups, c.anillo, c.dificultad_base + 0.2, c.fuente_id, 'der.om2.' || c.slug, 'aprobado')
    on conflict (tipo, generator_hash) do update set enunciado_tpl = excluded.enunciado_tpl,
      age_groups = excluded.age_groups, anillo_min = excluded.anillo_min, status = 'aprobado'
    returning id into v_pl;
    insert into ac_plantilla_conceptos (plantilla_id, concepto_id, peso)
    values (v_pl, c.id, 1.0) on conflict (plantilla_id, concepto_id) do nothing;

    v_k := ((v_seed / 4) % 4)::int + 1;
    v_ops := '[]'::jsonb; v_clave := null;
    for v_i in 1..4 loop
      if v_i = v_k then
        v_ops := v_ops || jsonb_build_array(jsonb_build_object('id', 'o' || v_i, 'texto', c.titulo_es));
        v_clave := 'o' || v_i;
      else
        v_ops := v_ops || jsonb_build_array(jsonb_build_object('id', 'o' || v_i,
          'texto', v_hermanos -> (case when v_i < v_k then v_i - 1 else v_i - 2 end) ->> 'titulo'));
      end if;
    end loop;

    insert into ac_items (plantilla_id, seed, payload_publico, solucion, slot_valores,
                          age_groups, anillo_min, dificultad, status)
    values (v_pl, v_seed + 1,
      jsonb_build_object('tipo', 'opcion_multiple',
        'enunciado', 'Leé esto: «' || c.enunciado_es || '» ¿De qué estamos hablando?',
        'opciones', v_ops, 'ayuda', null),
      jsonb_build_object('clave', jsonb_build_array(v_clave),
        'explicacion', c.titulo_es || '. ' || c.enunciado_es,
        'fuente_id', c.fuente_id, 'por_opcion', '{}'::jsonb),
      jsonb_build_object('region', 'general'), c.age_groups, c.anillo, c.dificultad_base + 0.2, 'aprobado')
    on conflict (plantilla_id, seed) do update set payload_publico = excluded.payload_publico,
      solucion = excluded.solucion, age_groups = excluded.age_groups, status = 'aprobado';

    -- ── 4 · mito o dato, si hay creencias documentadas ──────────────────────
    if exists (select 1 from ac_misconceptions where concepto_id = c.id) then
      insert into ac_plantillas (tipo, titulo_interno, enunciado_tpl, slots, solucion_tpl, distractores,
                                 age_groups, anillo_min, dificultad_base, fuente_id, generator_hash, status)
      values ('mito_o_dato', 'Mito o dato · ' || c.titulo_es, '¿Mito o dato?',
              jsonb_build_object('derivada', true),
              jsonb_build_object('estrategia', 'derivada', 'concepto', c.slug),
              jsonb_build_object('estrategia', 'misconception'),
              c.age_groups, c.anillo, c.dificultad_base, c.fuente_id, 'der.md.' || c.slug, 'aprobado')
      on conflict (tipo, generator_hash) do update set titulo_interno = excluded.titulo_interno,
        age_groups = excluded.age_groups, anillo_min = excluded.anillo_min, status = 'aprobado'
      returning id into v_pl;
      insert into ac_plantilla_conceptos (plantilla_id, concepto_id, peso)
      values (v_pl, c.id, 1.0) on conflict (plantilla_id, concepto_id) do nothing;

      for v_mc in select * from ac_misconceptions where concepto_id = c.id loop
        insert into ac_items (plantilla_id, seed, payload_publico, solucion, slot_valores,
                              age_groups, anillo_min, dificultad, status)
        values (v_pl, abs(hashtextextended(v_mc.slug, 7) % 2000000000),
          jsonb_build_object('tipo', 'mito_o_dato', 'enunciado', '¿Mito o dato?',
            'afirmacion', v_mc.creencia_es, 'ayuda', null),
          jsonb_build_object('es_dato', false, 'explicacion', v_mc.correccion_es,
            'fuente_id', coalesce(v_mc.fuente_id, c.fuente_id)),
          jsonb_build_object('region', 'general'), c.age_groups, c.anillo, c.dificultad_base, 'aprobado')
        on conflict (plantilla_id, seed) do update set payload_publico = excluded.payload_publico,
          solucion = excluded.solucion, age_groups = excluded.age_groups, status = 'aprobado';
      end loop;

      -- Y el enunciado verdadero, para que el tipo no sea "siempre mito": si
      -- todas las afirmaciones fueran falsas, contestar bien no requeriría leer.
      insert into ac_items (plantilla_id, seed, payload_publico, solucion, slot_valores,
                            age_groups, anillo_min, dificultad, status)
      values (v_pl, abs(hashtextextended(c.slug, 9) % 2000000000),
        jsonb_build_object('tipo', 'mito_o_dato', 'enunciado', '¿Mito o dato?',
          'afirmacion', c.enunciado_es, 'ayuda', null),
        jsonb_build_object('es_dato', true, 'explicacion', coalesce(c.detalle_es, c.enunciado_es),
          'fuente_id', c.fuente_id),
        jsonb_build_object('region', 'general'), c.age_groups, c.anillo, c.dificultad_base, 'aprobado')
      on conflict (plantilla_id, seed) do update set payload_publico = excluded.payload_publico,
        solucion = excluded.solucion, age_groups = excluded.age_groups, status = 'aprobado';
    end if;

    v_n := v_n + 1;
  end loop;

  return jsonb_build_object(
    'conceptos_procesados', v_n,
    'conceptos_salteados', v_saltados,
    'plantillas_totales', (select count(*) from ac_plantillas),
    'items_totales', (select count(*) from ac_items));
end $sem$;

revoke all on function ac_sembrar_derivados() from public, anon, authenticated;
