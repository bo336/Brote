-- 0116 — Tu mundo abre para todos.
--
-- La bandera global estaba en false a propósito: el mundo se probaba sólo con
-- la cuenta del dueño (0104). Con el juego completo (0115) el mundo es una
-- sección más de la app, como la Academia o el Mercado, y abre para todas las
-- cuentas. La lista de 0104 queda como estaba; ya no hace falta.
--
-- Separada de 0115 a propósito: encenderla es la decisión de lanzar, y es del
-- dueño. Apagarla otra vez es la misma línea con false.

update public.app_settings
   set value = 'true'::jsonb
 where key = 'mundo_game_enabled';
