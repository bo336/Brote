-- Brote — 0057 — Las respuestas viven a un solo nivel.
-- Feed v2 ("La Plaza") fase 2, paso 2.
--
-- TERCER BUG REAL de esta tanda, y el más silencioso.
--
-- `feed_thread_v2` trae las respuestas con `where r.parent_id = p_post_id`, o
-- sea SOLO las hijas directas de la publicación raíz. Pero
-- `create_feed_post_v2` guarda el `parent_id` tal cual se lo pasan. Entonces,
-- si alguien respondía a una respuesta, la nueva quedaba colgando de esa
-- respuesta y desaparecía del único lugar donde el hilo se muestra: se
-- guardaba bien, no daba error, y no la veía nadie. Nunca más.
--
-- La decisión de producto ya estaba tomada (03 §3 y el comentario que encabeza
-- `ThreadReply`): los hilos son PLANOS. Anidar es ilegible en un teléfono y
-- vuelve caro el `feed_thread`. Lo que faltaba era que el almacenamiento
-- respetara esa decisión.
--
-- Va como trigger BEFORE INSERT y no adentro de `create_feed_post_v2` a
-- propósito: así vale para cualquier camino de escritura, incluidos los que
-- todavía no escribimos. Con un solo salto alcanza, por inducción — si el
-- padre es una respuesta, ya fue reenraizado, así que su `parent_id` ES la
-- raíz.
--
-- A quién le respondés se sigue viendo: la interfaz precarga "@usuario " en el
-- cuadro de texto, que es también lo que dispara la notificación de mención.

create or replace function feed_reroot_reply()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if new.kind = 'reply' and new.parent_id is not null then
    select coalesce(p.parent_id, new.parent_id)
      into new.parent_id
      from feed_posts p
     where p.id = new.parent_id;
  end if;
  return new;
end;
$fn$;

drop trigger if exists trg_feed_reroot_reply on feed_posts;
create trigger trg_feed_reroot_reply
before insert on feed_posts
for each row execute function feed_reroot_reply();

-- Enderezar lo que ya está guardado mal. Se repite hasta que no queda ninguna
-- respuesta colgando de otra respuesta (en la práctica, una o dos vueltas).
do $fix$
declare v_moved integer;
begin
  loop
    update feed_posts r
       set parent_id = p.parent_id
      from feed_posts p
     where r.parent_id = p.id
       and r.kind = 'reply'
       and p.kind = 'reply'
       and p.parent_id is not null;
    get diagnostics v_moved = row_count;
    exit when v_moved = 0;
  end loop;
end;
$fix$;
