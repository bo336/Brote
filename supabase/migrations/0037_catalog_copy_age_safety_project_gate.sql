-- Brote — 0037 — Catalog copy + expansion, age-gate fixes, project rank gate.
-- Mirrors live migrations activity_copy_batch1..3, catalog_expansion_a..c,
-- kid_safe_news_widen, feed_thread_age_gate, project_min_rank_configurable.

-- ── REAL COPY FOR THE SEEDED CATALOG ────────────────────────────────────────
-- 155 of the 369 activities shipped with NO instructions and a per-DOMAIN
-- boilerplate short_es — every one of the 56 water actions said "Cada gota
-- suma.", every waste action said "Menos basura, más vueltas." So a detail
-- page showed a title and nothing that explained what to actually do.
-- Each now has a specific hook (with a real figure where one exists) and one
-- concrete imperative instruction, in the same Rioplatense voice as the
-- hand-written energy actions. Verified: 0 missing, 369 distinct shorts.

-- ── CATALOG EXPANSION ───────────────────────────────────────────────────────
-- +91 activities (369 → 460) covering angles the seed missed: defrosting,
-- washing the car with a bucket, meter leak-testing, mate water, delivery
-- cutlery, dog waste, light pollution, nest boxes, rain logging, moth nights,
-- consortium proposals, mapping recycling points, eco-driving, roof racks,
-- propagation, seed saving, cork, textiles, receipts, retornables.
--
-- age_groups follows what a person that age can actually DO alone: anything
-- needing a purchase, an installation, a vehicle or contacting an institution
-- is teen/adult, never kid. All inserts are `on conflict (slug) do nothing`
-- so re-running is safe.

-- ── KID-SAFE NEWS: THE FILTER HAD A HOLE THE SIZE OF THE FEED ───────────────
-- brote_news_is_kid_safe blocked death/war/"desastre" but had no pattern for
-- FIRE, EARTHQUAKE or EVACUATION — the three subjects that dominate this
-- feed. Kid accounts were being shown "Un nuevo incendio obliga a desalojar
-- dos municipios", "Seis terremotos vuelven a hacer temblar la madrugada"
-- and "Los incendios devoran el campo español".
--
-- The topic allowlist was not protecting anything either: upstream domain
-- tagging files most items under 'agua' regardless of subject, so an
-- earthquake article was tagged Agua and passed the allowlist unchallenged.
-- The blocklist therefore has to carry the weight, and now covers fire,
-- seismic events, floods/storms, evacuation and confinement, illness and
-- body-image topics, toxicity, and collapse/extinction framing.
--
-- Result: kid feed 309 → 238 items, and 0 rows matching the distressing
-- pattern remain. Still 238 items, so the feed is not empty.

-- ── feed_thread WAS NOT AGE-GATED ───────────────────────────────────────────
-- feed_timeline filtered posts by the viewer's account_type; feed_thread did
-- not. A post correctly hidden from a kid's timeline was still fully readable
-- by opening the thread directly (notification, shared link, or a reply on
-- their own post). An age gate that only covers the list view is not a gate.
-- The post is now returned only if it matches the viewer's age group, and
-- replies inherit the same rule.

-- ── PROJECT CREATION: HIGHER BAR, AND TUNABLE ───────────────────────────────
-- A project organiser publishes contact details, coordinates real-world
-- meetups with strangers, and credits points to everyone who joins. Plántula
-- (3.000 XP) is a couple of days of use — too low for that. Default is now
-- Retoño (tier 4, 7.000 XP).
--
-- Stored in app_settings rather than hardcoded, because the right bar depends
-- on how big the user base is: too high at launch and nobody can organise
-- anything, too low later and it gets abused. Changeable from /panel.
-- project_min_rank_tier() lets the client gate the UI on the same number the
-- server enforces, so the two can never drift.

insert into app_settings (key, value, description)
values ('project_min_rank_tier', to_jsonb(4),
        'Rango mínimo para crear un proyecto (1 Semilla · 2 Brote · 3 Plántula · 4 Retoño · 5 Arbusto · 6 Árbol).')
on conflict (key) do nothing;

-- Also dropped: a stale 12-argument create_project overload left from before
-- the contact fields existed. With both present PostgREST refused the call
-- outright ("Could not choose the best candidate function") whenever the
-- contact arguments were omitted.
drop function if exists public.create_project(text,text,text,text,text,text,double precision,double precision,timestamptz,integer,text,text);

-- Authoritative bodies for brote_news_is_kid_safe, feed_thread, create_project
-- and project_min_rank_tier are applied in the live migrations named above.
