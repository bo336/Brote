-- ════════════════════════════════════════════════════════════════════════════
-- Brote — 0024 — News hard-retention (mirrors live).
-- News volume is tiny (~36 rows/day max ≈ 25 MB/year), but keep the table
-- permanently light: archive at 30 days (existing), HARD-DELETE at 60 days.
-- ════════════════════════════════════════════════════════════════════════════
create or replace function brote_news_retention()
returns int language plpgsql security definer set search_path = public as $$
declare v_n int;
begin
  delete from news where fetched_at < now() - interval '60 days';
  get diagnostics v_n = row_count;
  return v_n;
end $$;
revoke execute on function brote_news_retention() from public, anon, authenticated;
select cron.schedule('brote-news-retention', '30 4 * * *', $$select brote_news_retention();$$);
