-- ─────────────────────────────────────────────────────────────────────────────
-- 0089 · El camino viejo de lecciones queda marcado como obsoleto.
--
-- NO SE BORRA NADA. `user_lessons` tiene filas de gente real: cuántas lecciones
-- hizo y cuándo. Eso es historia de una persona, no basura de esquema, y una
-- tabla borrada no se recupera con un `git revert`.
--
-- Lo que sí se hace es dejarlo escrito, para que el próximo que abra el esquema
-- no tenga que adivinar cuál de los dos sistemas de aprendizaje está vivo.
--
-- La UI ya no tiene rama de fallback: se retiró en la fase 2 junto con
-- `LessonPlayer`. `academia_enabled = false` muestra una pausa, no la pantalla
-- vieja. El borrado definitivo queda como decisión del dueño, anotada en
-- CONTINUE.md, y conviene hacerlo recién después de exportar `user_lessons`.
-- ─────────────────────────────────────────────────────────────────────────────

comment on table lessons is
  'OBSOLETA (0089, Academia fase 3). Reemplazada por ac_hojas/ac_conceptos/ac_items. Sin UI desde la fase 2. No borrar sin exportar user_lessons primero.';
comment on table lesson_steps is
  'OBSOLETA (0089, Academia fase 3). Reemplazada por ac_items + ac_entregas.';
comment on table user_lessons is
  'OBSOLETA (0089, Academia fase 3) pero CON DATOS DE USUARIOS REALES. Reemplazada por ac_user_hoja. No borrar sin exportar.';

comment on function learning_path() is
  'OBSOLETA (0089). La reemplaza academia_arbol().';
comment on function lesson_detail(p_slug text) is
  'OBSOLETA (0089). La reemplaza academia_gajo() + academia_start_session().';
comment on function complete_lesson(p_lesson_id uuid, p_correct integer, p_total integer) is
  'OBSOLETA (0089). La reemplaza academia_finish_session().';
