-- Brote — 0064 — Índices que faltaban en las tablas nuevas.
-- Feed v2 ("La Plaza") fase 2, paso 8 (cierre).
--
-- Sale de la segunda pasada de `get_advisors` (performance). Dos cosas:
--
-- 1. ÍNDICE DUPLICADO. En 0044 creé `idx_feed_author_created` sobre
--    `(author_id, created_at desc)` sin ver que ya existía `idx_feed_author`
--    sobre lo mismo. Dos índices idénticos se mantienen los dos en cada
--    escritura y sirven exactamente igual. Se va el que agregué yo.
--
-- 2. CLAVES FORÁNEAS SIN ÍNDICE. `feed_saves.post_id` y `feed_seen.post_id`
--    no tienen uno porque la primaria es `(user_id, post_id)` y esa sólo
--    cubre búsquedas que empiecen por `user_id`. Se nota justo donde más
--    duele: borrar una publicación dispara el ON DELETE CASCADE, que sin
--    índice recorre la tabla entera — y `feed_seen` crece con cada scroll de
--    cada persona. Lo mismo para las tres de `moderation_actions` y las dos
--    de `content_reports`, que además son las columnas por las que la cola
--    del panel agrupa.
--
-- Todos parciales o chicos; el costo de escritura es despreciable al lado de
-- un seq scan por borrado.

drop index if exists idx_feed_author_created;

create index if not exists idx_feed_saves_post on feed_saves (post_id);
create index if not exists idx_feed_seen_post  on feed_seen  (post_id);

create index if not exists idx_reports_reporter on content_reports (reporter_id);
create index if not exists idx_reports_profile  on content_reports (profile_id) where profile_id is not null;

create index if not exists idx_modactions_report  on moderation_actions (report_id)  where report_id is not null;
create index if not exists idx_modactions_post    on moderation_actions (post_id)    where post_id is not null;
create index if not exists idx_modactions_profile on moderation_actions (profile_id) where profile_id is not null;
