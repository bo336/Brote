'use client';

import { createClient } from '@/lib/supabase/client';
import type { GameState } from '@/lib/world/game/types';

/**
 * Where the game's save lives: this device (always) and the server (when there
 * is a session and the island is ours).
 *
 * The device copy is a safety net and the whole story for the account-less
 * preview. It records which server revision it was based on and whether it has
 * changes the server has not seen, so a reload after a dropped connection keeps
 * the afternoon's work instead of the server's older copy.
 */
export interface LocalSave {
  state: GameState;
  /** The server revision this copy started from. */
  rev: number;
  /** It holds changes the server has not acknowledged. */
  dirty: boolean;
}

const KEY = (who: string) => `brote.mundo.juego.v1:${who}`;

export function loadLocal(who: string): LocalSave | null {
  try {
    const raw = localStorage.getItem(KEY(who));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalSave;
    if (!parsed || typeof parsed !== 'object' || !parsed.state) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveLocal(who: string, save: LocalSave): void {
  try {
    localStorage.setItem(KEY(who), JSON.stringify(save));
  } catch {
    // Private mode or a full quota: the server copy still exists.
  }
}

export function clearLocal(who: string): void {
  try {
    localStorage.removeItem(KEY(who));
  } catch {
    /* nothing to clear */
  }
}

export type ServerSaveResult =
  | { ok: true; rev: number }
  | { ok: false; reason: 'conflict'; rev: number; state: unknown }
  | { ok: false; reason: 'offline' }
  | { ok: false; reason: string };

/** One save. Never throws: a failed save is a retry later, not an error on screen. */
export async function saveServer(state: GameState, rev: number): Promise<ServerSaveResult> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc('world_game_save', { p_state: state, p_rev: rev });
    if (error) return { ok: false, reason: typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'error' };
    const reply = data as { ok?: boolean; rev?: number; reason?: string; state?: unknown } | null;
    if (reply?.ok && typeof reply.rev === 'number') return { ok: true, rev: reply.rev };
    if (reply?.reason === 'conflict' && typeof reply.rev === 'number') {
      return { ok: false, reason: 'conflict', rev: reply.rev, state: reply.state };
    }
    return { ok: false, reason: reply?.reason ?? 'error' };
  } catch {
    return { ok: false, reason: 'offline' };
  }
}
