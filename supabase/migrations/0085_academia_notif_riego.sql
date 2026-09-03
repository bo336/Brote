-- ─────────────────────────────────────────────────────────────────────────────
-- 0085 · Un tipo de notificación para el riego.
--
-- `notifications.type` es el enum `notif_type`, no texto libre, así que el
-- aviso nocturno de la Academia reventaba con `invalid input value for enum`.
-- Encontrado corriendo `academia_mantenimiento_diario()` contra la base viva.
--
-- Va en su propia migración porque agregar un valor a un enum y USARLO no se
-- puede hacer en la misma transacción: Postgres no ve el valor nuevo hasta que
-- la transacción que lo agregó termina.
-- ─────────────────────────────────────────────────────────────────────────────

alter type notif_type add value if not exists 'academia_riego';
