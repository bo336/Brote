-- 0118 — Las noticias que ya estaban guardadas con una "imagen" que no es una
-- imagen.
--
-- `refresh-news` guardaba como `image_url` lo primero que declaraba el feed:
-- muchas veces el reproductor de un video (youtube.com/embed/…, player.vimeo.com),
-- un archivo de video o un emoji de WordPress (s.w.org). En la Plaza eso se veía
-- como el ícono de imagen rota. La función ya filtra (supabase/functions/_shared/
-- imagen.ts); esto arregla lo que quedó guardado, con las mismas reglas:
--
--   · un video de YouTube pasa a su miniatura (i.ytimg.com/vi/<id>/hqdefault.jpg);
--   · un reproductor, un video o un emoji deja la noticia sin imagen (la app
--     pone el color del tema, que es lo que hace con cualquier noticia sin foto);
--   · `&#038;` que el feed dejó escapado vuelve a ser `&`;
--   · `http:` pasa a `https:` (en la app publicada una imagen http se bloquea).
--
-- Idempotente: correrla dos veces no cambia nada la segunda.

update public.news
   set image_url = 'https://i.ytimg.com/vi/'
                   || substring(image_url from '(?:youtube(?:-nocookie)?\.com/(?:embed/|watch\?(?:.*&)?v=|shorts/|v/)|youtu\.be/)([A-Za-z0-9_-]{6,})')
                   || '/hqdefault.jpg'
 where image_url ~* '(youtube(-nocookie)?\.com/(embed/|watch\?(.*&)?v=|shorts/|v/)|youtu\.be/)[A-Za-z0-9_-]{6,}';

update public.news
   set image_url = null
 where image_url ~* '^https?://([a-z0-9-]+\.)*(vimeo\.com|s\.w\.org|videos\.files\.wordpress\.com|feeds\.feedburner\.com|pixel\.wp\.com|stats\.wp\.com|gravatar\.com)/'
    or image_url ~* '\.(mp4|m4v|webm|mov|ogv|ogg|mp3|m4a|wav|pdf|html?|php)(\?|#|$)'
    or image_url ~* '/(wp-includes/images/smilies|images/core/emoji)/'
    or image_url ~* '^https?://(www\.)?youtube(-nocookie)?\.com/';

update public.news
   set image_url = replace(replace(image_url, '&#038;', '&'), '&amp;', '&')
 where image_url like '%&#038;%' or image_url like '%&amp;%';

update public.news
   set image_url = 'https://' || substring(image_url from 8)
 where image_url like 'http://%';
