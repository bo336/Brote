-- Brote — 0056 — `repost_count` que también sabe restar.
-- Feed v2 ("La Plaza") fase 2, paso 3 (corrección).
--
-- SEGUNDO BUG REAL de la misma prueba. `create_feed_post_v2` (0044, línea 348)
-- hacía `repost_count = repost_count + 1` a mano al insertar el replante. Un
-- incremento suelto tiene dos problemas:
--
--   · nadie resta cuando el replante se borra — con el interruptor de 0054 el
--     contador quedaba en 1 después de des-replantar, y en 2 con un solo
--     replante vivo (verificado: `removed=1 reposted=false count=1`);
--   · deriva. Un borrado en cascada, un post oculto por moderación o un
--     `delete_my_account` dejan el número mintiendo para siempre, y "todo
--     número que se muestra es real" es una regla del proyecto, no un detalle.
--
-- La solución es la misma que ya usa `reply_count`: un trigger que RECUENTA
-- desde la verdad en vez de llevar la cuenta. Cuesta un índice-scan sobre
-- `idx_feed_repost_of`, que ya existe, y a cambio el número no puede
-- desincronizarse por ningún camino — ni los que todavía no escribimos.
--
-- Se saca el `+ 1` manual de `create_feed_post_v2` para no contar dos veces.

-- ═════════════════════════════════════════════════════════════════════════════
-- 1. El trigger
-- ═════════════════════════════════════════════════════════════════════════════

create or replace function feed_sync_repost_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_target uuid := coalesce(new.repost_of, old.repost_of);
begin
  if v_target is not null then
    update feed_posts p
       set repost_count = (select count(*) from feed_posts r
                            where r.repost_of = v_target and not r.hidden)
     where p.id = v_target;
  end if;
  return null;
end;
$fn$;

drop trigger if exists trg_feed_repost_count on feed_posts;
create trigger trg_feed_repost_count
after insert or delete or update of repost_of, hidden on feed_posts
for each row execute function feed_sync_repost_count();

-- ═════════════════════════════════════════════════════════════════════════════
-- 2. Sacar el incremento manual
-- ═════════════════════════════════════════════════════════════════════════════

-- (En vivo se aplicó con un reemplazo puntual del cuerpo de la función; acá
-- queda la sentencia equivalente para una base nueva, donde 0044 ya creó la
-- función con el `+ 1` adentro.)
do $mig$
declare v_src text;
begin
  select prosrc into v_src from pg_proc
   where proname = 'create_feed_post_v2'
     and pronamespace = 'public'::regnamespace
   limit 1;

  if v_src like '%repost_count = repost_count + 1%' then
    execute format(
      'create or replace function create_feed_post_v2(%s) returns jsonb language plpgsql security definer set search_path = public as %L',
      (select pg_get_function_arguments(oid) from pg_proc
        where proname='create_feed_post_v2' and pronamespace='public'::regnamespace limit 1),
      replace(v_src,
        'update feed_posts set repost_count = repost_count + 1 where id = p_repost_of;',
        '-- el contador lo lleva trg_feed_repost_count (0056)')
    );
  end if;
end;
$mig$;

-- ═════════════════════════════════════════════════════════════════════════════
-- 3. Recontar lo que ya está
-- ═════════════════════════════════════════════════════════════════════════════

update feed_posts p
   set repost_count = (select count(*) from feed_posts r
                        where r.repost_of = p.id and not r.hidden)
 where p.repost_count <> (select count(*) from feed_posts r
                           where r.repost_of = p.id and not r.hidden);
