-- ─────────────────────────────────────────────────────────────────────────────
-- 0084 · La Academia entra al mantenimiento nocturno.
--
-- `daily_maintenance()` ya corre a las 00:05 de Buenos Aires por pg_cron
-- (`brote-daily-maintenance`, `5 3 * * *` UTC). La fase 3 pide enganchar el
-- decaimiento y el cribado ahí adentro y NO agregar un segundo cronograma.
--
-- POR QUÉ ESTO ES UN PARCHE Y NO UNA COPIA DE LA FUNCIÓN. `daily_maintenance`
-- no es de la Academia: nace en 0013 y la redefinen 0016, 0018 y 0019. Si acá
-- se pegara una copia completa de su cuerpo actual, esta migración quedaría
-- fijando la versión de hoy — y el día que alguien toque la de 0019, correr
-- las migraciones en orden revertiría ese cambio sin que nadie se entere.
--
-- Entonces se agrega UNA línea al cuerpo que haya, sea cual sea. Es idempotente
-- (si la línea ya está, no hace nada), no depende de cómo esté escrito el resto
-- y no puede pisar el trabajo de otro. Si el anclaje no aparece, falla ruidosa
-- en vez de dejar el enganche a medias.
--
-- El decaimiento en sí NO necesita un job: `fuerza` se calcula al leer
-- (`mastery × ac_retrievability(last_seen, half_life)`), así que un gajo se
-- marchita solo con que pase el tiempo. Lo que corre de noche es lo que sí
-- necesita alguien que lo dispare: el cribado psicométrico, el censo de pools
-- flacos y el aviso de riego.
-- ─────────────────────────────────────────────────────────────────────────────

do $$
declare
  v_src text;
  v_nuevo text;
  v_linea constant text := E'\n  -- La Academia (0084): cribado psicométrico, censo de pools y aviso de riego.\n  perform academia_mantenimiento_diario();\n';
begin
  select p.prosrc into v_src
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'daily_maintenance';

  if v_src is null then
    raise exception 'daily_maintenance() no existe: 0013 tiene que haber corrido antes';
  end if;

  if position('academia_mantenimiento_diario' in v_src) > 0 then
    raise notice 'daily_maintenance ya llama a la Academia; no se toca';
    return;
  end if;

  -- Se inserta antes del `return` final, que es la última sentencia del cuerpo.
  if v_src !~ 'return jsonb_build_object\(''reset''' then
    raise exception 'no se encontró el return final de daily_maintenance(); revisá el enganche a mano';
  end if;

  v_nuevo := regexp_replace(v_src, '(\s*return jsonb_build_object\(''reset'')',
                            v_linea || '\1');

  execute format(
    'create or replace function daily_maintenance() returns jsonb '
    'language plpgsql security definer set search_path = public as %L',
    v_nuevo);

  raise notice 'daily_maintenance enganchado a la Academia';
end $$;

-- Comprobación: si el enganche no quedó, esto revienta la migración.
do $$
begin
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'daily_maintenance'
       and p.prosrc like '%academia_mantenimiento_diario%')
  then
    raise exception 'el enganche nocturno de la Academia no quedó aplicado';
  end if;
end $$;
