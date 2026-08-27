-- Brote — 0055 — `feed_shape` conoce a `repost` y a `milestone`.
-- Feed v2 ("La Plaza") fase 2, paso 3 (corrección).
--
-- BUG REAL, encontrado al probar el interruptor de replantar.
--
-- `feed_shape` es de cuando el feed tenía tres formas: news, post y reply. En
-- 0041 agregamos `repost` y `milestone` al enum `feed_kind`, pero el CHECK
-- quedó igual — y un CHECK con tres ramas OR no acepta un cuarto valor: lo
-- rechaza. O sea que hasta acá:
--
--   · TODO replante fallaba, puro o citado (`23514 feed_shape`), y
--   · TODO logro autopublicado fallaba también, así que el trigger
--     `brote_autopost_from_notification` de 0050 no podía publicar nunca.
--
-- No se notó porque no había forma de replantar desde la interfaz todavía y
-- porque el trigger se traga sus errores. La forma correcta de cada fila:
--
--   news      → tiene novedad, no tiene autor ni padre
--   post      → tiene autor y cuerpo (1..1000)
--   reply     → tiene autor, padre y cuerpo (1..1000)
--   repost    → tiene autor y original; el cuerpo es OPCIONAL, y esa es
--               exactamente la diferencia entre "Replantar" (vacío) y
--               "Citar" (con comentario)
--   milestone → tiene autor y cuerpo; lo escribe el trigger, no una persona

alter table feed_posts drop constraint if exists feed_shape;

alter table feed_posts add constraint feed_shape check (
     (kind = 'news'      and news_id   is not null and author_id is null and parent_id is null)
  or (kind = 'post'      and author_id is not null
        and coalesce(length(btrim(body)),0) between 1 and 1000)
  or (kind = 'reply'     and author_id is not null and parent_id is not null
        and coalesce(length(btrim(body)),0) between 1 and 1000)
  or (kind = 'repost'    and author_id is not null and repost_of is not null
        and coalesce(length(btrim(body)),0) between 0 and 1000)
  or (kind = 'milestone' and author_id is not null
        and coalesce(length(btrim(body)),0) between 1 and 1000)
);
