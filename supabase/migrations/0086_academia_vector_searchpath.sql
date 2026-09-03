-- ─────────────────────────────────────────────────────────────────────────────
-- 0086 · Las dos funciones que usan pgvector necesitan ver sus operadores.
--
-- ENCONTRADO CORRIENDO EL PIPELINE CONTRA LA BASE VIVA. `academia_gen_contexto`
-- devolvía `sin contexto` y el lote no se armaba nunca. El motivo:
--
--     ERROR: operator does not exist: extensions.vector <=> extensions.vector
--
-- pgvector se instala en el esquema `extensions` (así lo hace Supabase), y
-- todas las funciones de la Academia declaran `set search_path = public` —
-- que es la regla correcta y la que evita el secuestro de search_path. Pero
-- con `public` a secas, el operador `<=>` no se resuelve: el tipo se encuentra
-- por su nombre calificado y el OPERADOR no.
--
-- Se arregla nombrando los dos esquemas, que sigue siendo un search_path fijo
-- y explícito. Solo estas dos funciones lo necesitan: son las únicas que
-- comparan vectores. El resto queda con `public` solo.
--
-- Forward-only: 0082 queda como está y esto lo reemplaza, igual que 0080
-- reemplazó a `academia_arbol` de 0078. `scripts/check-academia-parity.mjs`
-- toma la última definición.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function academia_gen_contexto(p_concepto_id uuid, p_tipo ac_tipo_ejercicio)
returns jsonb language plpgsql stable security definer set search_path = public, extensions as $fn$
declare v_c ac_conceptos%rowtype; v_ref extensions.vector(768);
begin
  select * into v_c from ac_conceptos where id = p_concepto_id;
  if not found then return jsonb_build_object('ok', false, 'error', 'concepto inexistente'); end if;

  select i.embedding into v_ref
    from ac_items i
    join ac_plantilla_conceptos pc on pc.plantilla_id = i.plantilla_id
   where pc.concepto_id = p_concepto_id and i.embedding is not null
   order by pc.peso desc limit 1;

  return jsonb_build_object(
    'ok', true,
    'concepto', jsonb_build_object(
      'id', v_c.id, 'slug', v_c.slug, 'titulo_es', v_c.titulo_es,
      'enunciado_es', v_c.enunciado_es, 'detalle_es', v_c.detalle_es,
      'rama_slug', v_c.rama_slug, 'anillo', v_c.anillo,
      'age_groups', to_jsonb(v_c.age_groups), 'sensible', v_c.sensible),
    'anillo_rubrica', (select jsonb_build_object('nombre', nombre_es, 'rubrica', rubrica)
                       from ac_anillos where n = v_c.anillo),
    'fuentes', coalesce((select jsonb_agg(jsonb_build_object(
        'id', f.id, 'organizacion', f.organizacion, 'titulo', f.titulo,
        'publicado', f.publicado, 'contenido', f.contenido))
      from ac_fuentes f
      where f.id = v_c.fuente_id
         or f.id in (select m.fuente_id from ac_misconceptions m where m.concepto_id = v_c.id)
      limit 4), '[]'::jsonb),
    -- Las creencias falsas documentadas son LA fuente de distractores: un
    -- distractor que nadie cree no mide nada.
    'misconceptions', coalesce((select jsonb_agg(jsonb_build_object(
        'slug', m.slug, 'creencia_es', m.creencia_es, 'correccion_es', m.correccion_es))
      from ac_misconceptions m where m.concepto_id = v_c.id), '[]'::jsonb),
    'ejemplos', coalesce((select jsonb_agg(jsonb_build_object(
        'enunciado', i.payload_publico->>'enunciado', 'payload_publico', i.payload_publico))
      from (
        select i.payload_publico, i.created_at, i.embedding
        from ac_items i
        join ac_plantillas p on p.id = i.plantilla_id and p.tipo = p_tipo
        where i.status = 'aprobado'
        order by case when v_ref is not null and i.embedding is not null
                      then i.embedding <=> v_ref else null end nulls last,
                 i.created_at desc
        limit 3) i), '[]'::jsonb));
end $fn$;

create or replace function academia_dedupe(p_concepto_id uuid, p_tipo ac_tipo_ejercicio,
                                           p_embedding extensions.vector(768))
returns jsonb language plpgsql stable security definer set search_path = public, extensions as $fn$
declare v_umbral real := coalesce((select (value #>> '{}')::real from app_settings
                                    where key = 'academia_dedupe_umbral'), 0.93);
        v_id uuid; v_sim real;
begin
  if p_embedding is null then
    return jsonb_build_object('ok', true, 'motivo', 'sin_embedding', 'umbral', v_umbral);
  end if;

  select i.id, (1 - (i.embedding <=> p_embedding))::real
    into v_id, v_sim
    from ac_items i
    join ac_plantillas p on p.id = i.plantilla_id and p.tipo = p_tipo
    join ac_plantilla_conceptos pc on pc.plantilla_id = i.plantilla_id and pc.concepto_id = p_concepto_id
   where i.embedding is not null and i.status in ('aprobado', 'en_revision', 'borrador')
   order by i.embedding <=> p_embedding
   limit 1;

  return jsonb_build_object(
    'ok', v_sim is null or v_sim <= v_umbral,
    'similitud', v_sim, 'umbral', v_umbral, 'parecido_a', v_id);
end $fn$;

revoke all on function academia_gen_contexto(uuid, ac_tipo_ejercicio) from public, anon, authenticated;
revoke all on function academia_dedupe(uuid, ac_tipo_ejercicio, extensions.vector) from public, anon, authenticated;

-- La solicitud que murió con "sin contexto" vuelve a la cola: el fallo era
-- nuestro, no del contenido.
update ac_generacion_solicitudes
   set estado = 'pendiente', error = null
 where estado = 'fallido' and error = 'sin contexto';
