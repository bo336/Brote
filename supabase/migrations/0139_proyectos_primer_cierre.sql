-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0139 — El aviso de "tu rango ya no alcanza" espera al primer cierre.
--
-- Los rangos arrancaron el 2 de noviembre: hoy todo el mundo es Aprendiz, porque
-- todavía nadie tuvo un período para demostrar nada. Sin esto, quienes ya tenían
-- un proyecto recibirían esta misma noche un aviso de que su rango no alcanza,
-- por una regla que recién empieza a correr. La revisión empieza con el primer
-- cierre de verdad (lunes 9); desde ahí corre la gracia de siempre.
-- ════════════════════════════════════════════════════════════════════════════

select cron.unschedule('brote-proyectos-revisar') where exists (select 1 from cron.job where jobname = 'brote-proyectos-revisar');
select cron.schedule('brote-proyectos-revisar', '30 3 * * *',
  $$select public.brote_proyectos_revisar() where public.brote_hoy_ba() >= date '2026-11-09'$$);
