'use client';

import { createClient } from '@/lib/supabase/client';

export type StepKind = 'info' | 'quiz' | 'truefalse';

export interface InfoPayload {
  body: string;
  highlight?: string;
}
export interface QuizPayload {
  question: string;
  options: string[];
  correct: number;
  explain: string;
}
export interface TrueFalsePayload {
  statement: string;
  answer: boolean;
  explain: string;
}

export interface LessonStep {
  kind: StepKind;
  payload: InfoPayload | QuizPayload | TrueFalsePayload;
}

export interface LessonCard {
  id: string;
  slug: string;
  title_es: string;
  summary_es: string;
  domain_slug: string;
  level: number;
  minutes: number;
  reward_points: number;
  steps: number;
  best_score: number;
  completed: boolean;
  unlocked: boolean;
}

export interface LessonDetail {
  id: string;
  slug: string;
  title_es: string;
  summary_es: string;
  domain_slug: string;
  minutes: number;
  reward_points: number;
  steps: LessonStep[];
  best_score: number;
}

export async function fetchLearningPath(): Promise<LessonCard[]> {
  const { data, error } = await createClient().rpc('learning_path');
  if (error) throw error;
  return (data ?? []) as LessonCard[];
}

export async function fetchLesson(slug: string): Promise<LessonDetail | null> {
  const { data, error } = await createClient().rpc('lesson_detail', { p_slug: slug });
  if (error) throw error;
  return (data ?? null) as LessonDetail | null;
}

export interface LessonResult {
  ok: boolean;
  score: number;
  passed: boolean;
  points_awarded: number;
  first_time: boolean;
  error?: string;
}

/** Points are awarded only the first time a lesson is passed (server-enforced). */
export async function completeLesson(lessonId: string, correct: number, total: number): Promise<LessonResult> {
  const { data, error } = await createClient().rpc('complete_lesson', {
    p_lesson_id: lessonId,
    p_correct: correct,
    p_total: total,
  });
  if (error) return { ok: false, score: 0, passed: false, points_awarded: 0, first_time: false, error: error.message };
  return data as LessonResult;
}
