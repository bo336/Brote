-- Brote — 0074 — Un tipo de notificación más: la solicitud para seguir.
-- Feed v2 ("La Plaza") fase 3, cierre — paridad con las redes grandes.
--
-- Va sola, como 0041: `ALTER TYPE ... ADD VALUE` no se puede usar en la misma
-- transacción que lo agrega, así que el valor nuevo necesita su propia
-- migración antes de que 0075 lo utilice.

alter type notif_type add value if not exists 'follow_request';
