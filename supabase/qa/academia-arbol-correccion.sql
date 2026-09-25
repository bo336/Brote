-- Corrección de todo el currículum del Árbol. NO es una migración.
--
-- Dos consultas de solo lectura (no escriben nada). Cada una baraja cada paso
-- aprobado como en una entrega real, arma una respuesta con la misma
-- permutación y la pasa por `ac_corregir`:
--
--   1. La respuesta correcta. Esperado: `mal` = 0 en todas las filas.
--   2. Respuestas equivocadas a propósito (otra opción, el valor opuesto,
--      el orden invertido, un número lejano, marcas vacías). Esperado:
--      `aceptadas_mal` = 0 en todas las filas.
--
-- Correrlas después de cada carga de semillas. Al cierre del Árbol (septiembre
-- de 2026): 5.942 de 5.942 correctas aceptadas y 0 equivocadas aceptadas.

-- ═══ 1 · La respuesta correcta se acepta ═══
with p as (
  select id, tipo, tipo::text as t, payload_publico pub, solucion sol, ac_barajar_paso(payload_publico, tipo, null) bar
  from ac_pasos where status = 'aprobado'
    and tipo::text in ('opcion','multiple','vf','ordenar','ranking','cadena','clasificar','emparejar','completar','numero','estimar','detectar')
), q as (
  select *, coalesce((select array_agg(e::smallint) from jsonb_array_elements_text(bar -> 'perm') e), '{}'::smallint[]) perm from p
), r as (
  select q.*, case t
    when 'opcion' then jsonb_build_object('elegido', ac_ficha_token(pub, tipo, perm, sol -> 'clave' ->> 0))
    when 'multiple' then jsonb_build_object('marcados', coalesce((select jsonb_agg(ac_ficha_token(pub, tipo, perm, k)) from jsonb_array_elements_text(sol -> 'clave') k), '[]'))
    when 'detectar' then jsonb_build_object('marcados', coalesce((select jsonb_agg(ac_ficha_token(pub, tipo, perm, k)) from jsonb_array_elements_text(sol -> 'clave') k), '[]'))
    when 'vf' then jsonb_build_object('valor', sol -> 'valor') || case when pub ? 'razones' then jsonb_build_object('razon', ac_ficha_token(pub, tipo, perm, sol -> 'clave' ->> 0)) else '{}'::jsonb end
    when 'clasificar' then jsonb_build_object('asignacion', (select jsonb_object_agg(ac_ficha_token(pub, tipo, perm, key), value) from jsonb_each_text(sol -> 'clave')))
    when 'emparejar' then jsonb_build_object('pares', (select jsonb_object_agg(key, ac_ficha_token(pub, tipo, perm, value)) from jsonb_each_text(sol -> 'clave')))
    when 'completar' then jsonb_build_object('huecos', (select jsonb_agg(ac_ficha_token(pub, tipo, perm, k) order by o) from jsonb_array_elements_text(sol -> 'clave') with ordinality e(k, o)))
    when 'numero' then jsonb_build_object('valor', sol -> 'valor')
    when 'estimar' then jsonb_build_object('valor', sol -> 'valor')
    else jsonb_build_object('orden', (select jsonb_agg(ac_ficha_token(pub, tipo, perm, k) order by o) from jsonb_array_elements_text(sol -> 'clave') with ordinality e(k, o)))
  end resp from q
)
select coalesce(t, 'TOTAL') as tipo, count(*) as n,
  count(*) filter (where (ac_corregir(t, pub, sol, perm, resp) ->> 'correcto')::boolean) as bien,
  count(*) filter (where not coalesce((ac_corregir(t, pub, sol, perm, resp) ->> 'correcto')::boolean, false)) as mal
from r group by rollup(t) order by t nulls last;

-- ═══ 2 · Una respuesta equivocada no se acepta ═══
with p as (
  select id, tipo, tipo::text as t, payload_publico pub, solucion sol, ac_barajar_paso(payload_publico, tipo, null) bar
  from ac_pasos where status = 'aprobado'
    and tipo::text in ('opcion','multiple','vf','ordenar','ranking','cadena','clasificar','emparejar','completar','numero','estimar','detectar')
), q as (
  select *, coalesce((select array_agg(e::smallint) from jsonb_array_elements_text(bar -> 'perm') e), '{}'::smallint[]) perm from p
), r as (
  select q.*, case t
    when 'opcion' then jsonb_build_object('elegido', ac_ficha_token(pub, tipo, perm, (select o ->> 'id' from jsonb_array_elements(pub -> 'opciones') o where o ->> 'id' <> sol -> 'clave' ->> 0 limit 1)))
    when 'multiple' then jsonb_build_object('marcados', '[]'::jsonb)
    when 'detectar' then jsonb_build_object('marcados', '[]'::jsonb)
    when 'vf' then jsonb_build_object('valor', to_jsonb(not (sol ->> 'valor')::boolean)) || case when pub ? 'razones' then jsonb_build_object('razon', ac_ficha_token(pub, tipo, perm, sol -> 'clave' ->> 0)) else '{}'::jsonb end
    when 'clasificar' then jsonb_build_object('asignacion', '{}'::jsonb)
    when 'emparejar' then jsonb_build_object('pares', '{}'::jsonb)
    when 'completar' then jsonb_build_object('huecos', (select jsonb_agg(ac_ficha_token(pub, tipo, perm, k) order by o desc) from jsonb_array_elements_text(sol -> 'clave') with ordinality e(k, o)))
    when 'numero' then jsonb_build_object('valor', (sol ->> 'valor')::numeric * 10 + 7)
    when 'estimar' then jsonb_build_object('valor', (sol ->> 'valor')::numeric * 50 + 999)
    else jsonb_build_object('orden', (select jsonb_agg(ac_ficha_token(pub, tipo, perm, k) order by o desc) from jsonb_array_elements_text(sol -> 'clave') with ordinality e(k, o)))
  end resp from q
)
select coalesce(t, 'TOTAL') as tipo, count(*) as n,
  count(*) filter (where coalesce((ac_corregir(t, pub, sol, perm, resp) ->> 'correcto')::boolean, false)) as aceptadas_mal
from r group by rollup(t) order by t nulls last;
