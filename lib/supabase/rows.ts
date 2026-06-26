/**
 * Precise row types for the tables/RPCs the UI builds against (mirrors the
 * schema in supabase/migrations). Kept hand-maintained and small.
 */
import type { DomainSlug } from '@/lib/domains';

export type ActivityType = 'daily' | 'catalog';
export type Effort = 'easy' | 'medium' | 'hard';
export type Impact = 'low' | 'medium' | 'high';
export type Verification = 'honor' | 'photo_ai' | 'photo_peer' | 'geo';
export type Frequency = 'one_time' | 'daily' | 'weekly' | 'recurring';
export type CompletionStatus = 'honor' | 'pending' | 'verified' | 'rejected';
export type ProjectStatus = 'proposed' | 'active' | 'completed' | 'cancelled';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface ActivityRow {
  id: string;
  slug: string;
  type: ActivityType;
  domain_slug: DomainSlug;
  title_es: string;
  short_es: string | null;
  description_es: string | null;
  instructions_es: string | null;
  effort: Effort;
  impact: Impact;
  verification: Verification;
  base_points: number;
  frequency: Frequency;
  icon: string | null;
  min_rank_slug: string;
  is_featured: boolean;
  featured_week: string | null;
  impact_equivalency_es: string | null;
  active: boolean;
  sort_order: number;
}

export interface CompletionRow {
  id: string;
  user_id: string;
  activity_id: string;
  activity_type: ActivityType;
  domain_slug: string;
  completed_at: string;
  local_date: string;
  points_awarded: number;
  status: CompletionStatus;
  photo_url: string | null;
  note: string | null;
  counts_for_streak: boolean;
}

export interface ProjectRow {
  id: string;
  creator_id: string | null;
  title: string;
  description: string | null;
  type: string;
  domain_slug: DomainSlug | null;
  image_url: string | null;
  neighborhood: string | null;
  city: string;
  lat: number | null;
  lng: number | null;
  location_text: string | null;
  event_date: string | null;
  status: ProjectStatus;
  min_rank_slug: string;
  max_participants: number | null;
  reward_points: number;
  upvotes: number;
  created_at: string;
}

export interface ChallengeRow {
  id: string;
  type: 'daily' | 'weekly' | 'seasonal';
  title_es: string;
  description_es: string | null;
  domain_slug: DomainSlug | null;
  target_metric: string;
  target_value: number;
  reward_points: number;
  min_rank_slug: string;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
}

export interface NewsRow {
  id: string;
  source: string | null;
  source_url: string;
  title_es: string | null;
  summary_es: string | null;
  image_url: string | null;
  domain_tags: string[];
  interest_score: number;
  published_at: string | null;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title_es: string;
  body_es: string | null;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export interface GoalRow {
  id: string;
  user_id: string;
  title_es: string;
  metric: string;
  domain_slug: DomainSlug | null;
  target_value: number;
  period: 'weekly' | 'monthly';
  starts_at: string;
  ends_at: string;
  progress: number;
  completed: boolean;
  reward_points: number;
}

export interface TitleRow {
  id: string;
  slug: string;
  name_es: string;
  domain_slug: string | null;
  requirement_type: string;
  requirement_value: number;
  requirement_domain: string | null;
  rarity: Rarity;
  icon: string | null;
  description_es: string | null;
}

export interface BadgeRow {
  id: string;
  slug: string;
  name_es: string;
  description_es: string | null;
  icon: string | null;
  rarity: Rarity;
  requirement_type: string;
  requirement_value: number;
  requirement_domain: string | null;
}

/** Shared shape returned by the leaderboard RPCs. */
export interface LeaderboardEntry {
  pos: number;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  neighborhood: string | null;
  total_xp?: number;
  points?: number;
  xp?: number;
  rank_slug: string;
  division: number;
  title_es: string | null;
}
