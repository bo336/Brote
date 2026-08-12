-- Brote — 0029 — Spanish-first news + kid-safe tagging (F14.10).
-- Mirrors live migration 0025_kid_safe_news, the app_state feed rewrite, and
-- refresh-news v2.
--
-- WHY: measured on the live database, 426 of 431 active items had title_es
-- identical to original_title and every single row had interest_score = 50 —
-- the exact signature of the AI fallback path. The Gemini step had never once
-- succeeded, so every English-source item was published untranslated. That is
-- why the feed read as an English wire service.
--
-- FIX (in refresh-news v2): feeds now declare a language. Spanish sources need
-- no AI at all. A non-Spanish item is published ONLY if it was genuinely
-- rewritten; otherwise it is skipped rather than shown in English.
-- Feed set widened to 9 Spanish sources covering the topics that were missing:
-- eco building (Construible), eco technology and innovation (EcoInventos),
-- waste (Residuos Profesional), nature (La Vanguardia Natural), plus EFEverde,
-- Climática, Ambientum, Ecoticias and Mongabay Latam.
--
-- A heuristic interest score replaces the flat 50 when AI is unavailable: it
-- rewards solutions, innovation and practical advice, and penalises pure
-- disaster coverage — the feed was almost entirely tragedy before.

create or replace function brote_news_is_kid_safe(p_title text, p_summary text, p_tags text[])
returns boolean language sql immutable as $$
  select
    (p_tags && array['animales','plantas','ciencia','residuos','agua','comunidad','alimentacion'])
    and lower(coalesce(p_title,'') || ' ' || coalesce(p_summary,'')) !~
      '(muert|fallec|v[ií]ctim|tragedia|cat[áa]strofe|desastre|masacre|guerra|conflicto armado|asesin|suicid|violaci|c[áa]ncer|enfermedad grave|colapso|devasta|extermin|matanza|crisis human|hambruna|died|death|killed|victims|disaster|war|massacre)';
$$;

/**
 * The kid news feed was empty: news defaults to '{teen,adult}' and nothing
 * ever promoted an item. This opts items IN only when the subject is one a
 * child can engage with AND no distressing language appears anywhere.
 * Conservative on purpose — a child seeing nothing is a bug; a child seeing a
 * death toll is a much worse one. Also demotes anything that no longer
 * qualifies, so a re-tagged item cannot be stranded in the kid feed.
 */
create or replace function brote_tag_kid_safe_news()
returns int language plpgsql security definer set search_path = public as $$
declare v_n int;
begin
  update news set age_groups = array['kid','teen','adult']
  where active and not ('kid' = any(age_groups))
    and brote_news_is_kid_safe(title_es, summary_es, domain_tags);
  get diagnostics v_n = row_count;

  update news set age_groups = array['teen','adult']
  where 'kid' = any(age_groups)
    and not brote_news_is_kid_safe(title_es, summary_es, domain_tags);

  return v_n;
end $$;
revoke execute on function brote_tag_kid_safe_news() from public, anon, authenticated;

-- Runs 20 minutes after each news refresh (refresh is every 8h).
-- select cron.schedule('brote-tag-kid-news', '20 */8 * * *', $$select brote_tag_kid_safe_news();$$);
