-- Brote — 0046 — Buscar los Pip de un conjunto de cuentas.
-- Feed v2 ("La Plaza") fase 1 — soporte para el barrido de identidad.
--
-- La identidad ahora es el Pip, así que toda lista de personas necesita
-- pip_style. Trece RPCs de ranking, competencias y amigos no lo devuelven, y
-- cada una tiene su propia forma de retorno: cambiarlas todas significa
-- drop + recreate de las funciones que sostienen los rankings — la columna
-- vertebral del producto, y algo que ya se rompió una vez.
--
-- En su lugar, una sola búsqueda por lote. El feed sí lleva pip_style adentro
-- de feed_item_json, que es donde el rendimiento importa de verdad (20 autores
-- por página, en scroll infinito); esto resuelve las superficies secundarias
-- con una consulta extra por lista.

create or replace function pip_styles_for(p_ids uuid[]) returns jsonb
language sql stable security definer set search_path = public as $fn$
  select coalesce(jsonb_object_agg(p.id::text, jsonb_build_object(
           'pip_style', p.pip_style,
           'rank_slug', p.current_rank_slug,
           'is_verified', p.is_verified,
           'username', p.username
         )), '{}'::jsonb)
  from profiles p
  where p.id = any(coalesce(p_ids, '{}'::uuid[]));
$fn$;

revoke all on function pip_styles_for(uuid[]) from public, anon;
grant execute on function pip_styles_for(uuid[]) to authenticated;
