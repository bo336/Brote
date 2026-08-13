-- Brote — 0030 — Explorar becomes a social feed (F14.11).
-- Mirrors live migrations 0026_social_feed and 0027_social_feed_rpcs.
--
-- DESIGN: one table (feed_posts) holds news cards, user opinions and replies,
-- so reactions, threading and ranking work uniformly instead of needing a
-- polymorphic target on every query. A news row is mirrored into a post by
-- trigger; the post is what people react to and reply to, while the news row
-- stays the source of truth for the article itself. A CHECK constraint enforces
-- the shape of each kind (a news card has no author; a post/reply must have an
-- author and a body between 1 and 1000 characters).
--
-- RANKING: feed_timeline blends freshness (36h half-life, floored so good older
-- items stay reachable) with conversation (likes, replies, minus dislikes) and
-- the reader's domain interests — so a story people are actually discussing
-- does not vanish under newer but ignored items.
--
-- CHILD SAFETY — the one decision here that cannot be walked back later:
-- user-written text is age-gated to {teen,adult} and kid accounts cannot post.
-- Children read and react to news only. Broadcasting unmoderated free text from
-- or to minors is off by default; widen it deliberately, never by accident.
-- Verified: a kid account sees 0 user posts and 92 news items, and posting
-- returns a clear refusal while reacting still works.
--
-- Counters (like/dislike/reply) are maintained by trigger rather than computed
-- per read, and a 10-per-hour flood guard sits in create_feed_post.
--
-- The authoritative bodies of feed_timeline, feed_thread, create_feed_post,
-- react_to_post and delete_feed_post are applied live in migration 0027.

do $$ begin create type feed_kind as enum ('news', 'post', 'reply');
exception when duplicate_object then null; end $$;

create table if not exists feed_posts (
  id uuid primary key default gen_random_uuid(),
  kind feed_kind not null,
  author_id uuid references profiles(id) on delete cascade,
  news_id uuid references news(id) on delete cascade,
  parent_id uuid references feed_posts(id) on delete cascade,
  body text,
  domain_tags text[] not null default '{}',
  age_groups text[] not null default '{teen,adult}',
  like_count int not null default 0,
  dislike_count int not null default 0,
  reply_count int not null default 0,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feed_shape check (
    (kind = 'news'  and news_id is not null and author_id is null and parent_id is null) or
    (kind = 'post'  and author_id is not null and coalesce(length(btrim(body)),0) between 1 and 1000) or
    (kind = 'reply' and author_id is not null and parent_id is not null
                    and coalesce(length(btrim(body)),0) between 1 and 1000)
  )
);

create table if not exists feed_reactions (
  post_id uuid not null references feed_posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table feed_posts enable row level security;
alter table feed_reactions enable row level security;
-- Read policy gates on the reader's account_type against age_groups; write
-- policies restrict inserts/updates/deletes to the author. See migration 0026.
