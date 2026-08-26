-- Brote — 0041 — Valores de enum para el feed social.
--
-- Va SOLO en su propia migración: `alter type ... add value` no puede usarse en
-- la misma transacción que lo agrega, y apply_migration envuelve todo en una.
-- Si esto viviera junto a create_feed_post_v2, la primera inserción de un
-- 'repost' fallaría.

alter type feed_kind  add value if not exists 'repost';
alter type feed_kind  add value if not exists 'milestone';

alter type notif_type add value if not exists 'reply';
alter type notif_type add value if not exists 'like';
alter type notif_type add value if not exists 'follow';
alter type notif_type add value if not exists 'mention';
alter type notif_type add value if not exists 'repost';
alter type notif_type add value if not exists 'moderation';
