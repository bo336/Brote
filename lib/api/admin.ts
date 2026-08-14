'use client';

import { createClient } from '@/lib/supabase/client';

export interface AdminSetting {
  value: boolean | number | string;
  description: string | null;
}

export interface AdminDashboard {
  ok: boolean;
  error?: string;
  settings: Record<string, AdminSetting>;
  stats: Record<string, number>;
}

export async function adminIsConfigured(): Promise<boolean> {
  const { data, error } = await createClient().rpc('admin_is_configured');
  if (error) return false;
  return Boolean(data);
}

/** First run sets the passphrase; later changes require the current one. */
export async function adminSetPassword(next: string, current?: string): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await createClient().rpc('admin_set_password', {
    p_new: next,
    p_current: current ?? null,
  });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; error?: string };
}

export async function adminDashboard(pass: string): Promise<AdminDashboard> {
  const { data, error } = await createClient().rpc('admin_dashboard', { p_pass: pass });
  if (error) return { ok: false, error: error.message, settings: {}, stats: {} };
  return data as AdminDashboard;
}

export async function adminSetSetting(
  pass: string,
  key: string,
  value: boolean | number | string,
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await createClient().rpc('admin_set_setting', {
    p_pass: pass,
    p_key: key,
    p_value: value,
  });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; error?: string };
}

export async function adminSetSimulatedCount(
  pass: string,
  target: number,
): Promise<{ ok: boolean; error?: string; count?: number }> {
  const { data, error } = await createClient().rpc('admin_set_simulated_count', {
    p_pass: pass,
    p_target: target,
  });
  if (error) return { ok: false, error: error.message };
  return data as { ok: boolean; error?: string; count?: number };
}
