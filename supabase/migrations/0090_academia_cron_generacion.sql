-- ─────────────────────────────────────────────────────────────────────────────
-- 0090 · Los dos horarios del pipeline.
--
-- No es un cronograma nuevo: es pg_cron, el mismo que ya dispara
-- `brote-refresh-news`, `brote-league-rollover` y el resto. Cada edge function
-- tiene su entrada; esta sigue el patrón exacto de las que ya existen.
--
-- El censo de pools flacos vive en `daily_maintenance()` (0084). Estos dos
-- trabajos son lo que ese censo no puede hacer desde SQL: hablar con Gemini.
--
--   00:30 BA · plan + submit  — encolar lo que falta y mandar el lote
--   06:30 BA · poll           — el lote tarda hasta 24 h; se consulta seguido
--                               y `listo: false` no es un error
--
-- Con `academia_generacion_enabled = false` los dos son no-ops: la función
-- consulta el interruptor y el presupuesto ANTES de tocar la red.
-- ─────────────────────────────────────────────────────────────────────────────

select cron.unschedule('brote-academia-plan')   where exists (select 1 from cron.job where jobname = 'brote-academia-plan');
select cron.unschedule('brote-academia-submit') where exists (select 1 from cron.job where jobname = 'brote-academia-submit');
select cron.unschedule('brote-academia-poll')   where exists (select 1 from cron.job where jobname = 'brote-academia-poll');

select cron.schedule('brote-academia-plan', '30 3 * * *', $cron$
  select net.http_post(
    url := 'https://swdwulouasdnyorfhrjt.supabase.co/functions/v1/academia-generate',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3ZHd1bG91YXNkbnlvcmZocmp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MjUyMTAsImV4cCI6MjA5ODQwMTIxMH0.KbWP_LYJ4o2H-ITyyeNPR0FovBhuy3jfijnDYmgEjF4',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3ZHd1bG91YXNkbnlvcmZocmp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MjUyMTAsImV4cCI6MjA5ODQwMTIxMH0.KbWP_LYJ4o2H-ITyyeNPR0FovBhuy3jfijnDYmgEjF4'),
    body := '{"accion":"plan","limite":40}'::jsonb);
$cron$);

select cron.schedule('brote-academia-submit', '40 3 * * *', $cron$
  select net.http_post(
    url := 'https://swdwulouasdnyorfhrjt.supabase.co/functions/v1/academia-generate',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3ZHd1bG91YXNkbnlvcmZocmp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MjUyMTAsImV4cCI6MjA5ODQwMTIxMH0.KbWP_LYJ4o2H-ITyyeNPR0FovBhuy3jfijnDYmgEjF4',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3ZHd1bG91YXNkbnlvcmZocmp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MjUyMTAsImV4cCI6MjA5ODQwMTIxMH0.KbWP_LYJ4o2H-ITyyeNPR0FovBhuy3jfijnDYmgEjF4'),
    body := '{"accion":"submit","cuantas":10}'::jsonb);
$cron$);

select cron.schedule('brote-academia-poll', '30 9 * * *', $cron$
  select net.http_post(
    url := 'https://swdwulouasdnyorfhrjt.supabase.co/functions/v1/academia-generate',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3ZHd1bG91YXNkbnlvcmZocmp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MjUyMTAsImV4cCI6MjA5ODQwMTIxMH0.KbWP_LYJ4o2H-ITyyeNPR0FovBhuy3jfijnDYmgEjF4',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3ZHd1bG91YXNkbnlvcmZocmp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MjUyMTAsImV4cCI6MjA5ODQwMTIxMH0.KbWP_LYJ4o2H-ITyyeNPR0FovBhuy3jfijnDYmgEjF4'),
    body := '{"accion":"poll"}'::jsonb);
$cron$);
