'use client';

import { createClient } from '@/lib/supabase/client';

export type CosmeticKind = 'pip_body' | 'pip_hat' | 'pip_glasses' | 'pip_pattern' | 'mundo';

export interface CosmeticItem {
  slug: string;
  kind: CosmeticKind;
  /** For Pip items: the value stored in profiles.pip_style. Null for world decorations. */
  value: string | null;
  name_es: string;
  description_es: string | null;
  price: number;
  pro_only: boolean;
  min_rank_tier: number;
  owned: boolean;
  equipped: boolean;
}

export interface ShopState {
  balance: number;
  rank_tier: number;
  is_pro: boolean;
  items: CosmeticItem[];
  recent: { amount: number; source: string; note_es: string | null; created_at: string }[];
}

/** Everything the tienda needs, in one round trip (`shop_state()` RPC). */
export async function fetchShopState(): Promise<ShopState> {
  const { data, error } = await createClient().rpc('shop_state');
  if (error) throw error;
  const s = (data ?? {}) as Partial<ShopState>;
  return {
    balance: s.balance ?? 0,
    rank_tier: s.rank_tier ?? 1,
    is_pro: s.is_pro ?? false,
    items: s.items ?? [],
    recent: s.recent ?? [],
  };
}

export type BuyReason = 'owned' | 'pro_only' | 'rank' | 'funds';

export interface BuyResult {
  ok: boolean;
  reason?: BuyReason;
  balance: number;
  slug?: string;
  kind?: CosmeticKind;
  price?: number;
  min_rank_tier?: number;
}

/**
 * Buys a cosmetic. Every check that matters (funds, ownership, rank, Brote+)
 * lives in the RPC — this is just the call. A refusal comes back as
 * `ok: false` with a reason, not as an exception, so the UI can explain it.
 */
export async function buyCosmetic(slug: string): Promise<BuyResult> {
  const { data, error } = await createClient().rpc('buy_cosmetic', { p_slug: slug });
  if (error) throw error;
  return data as BuyResult;
}

/** Shows or hides a world decoration you already own. */
export async function equipCosmetic(slug: string, on: boolean) {
  const { data, error } = await createClient().rpc('equip_cosmetic', { p_slug: slug, p_on: on });
  if (error) throw error;
  return data as { ok: boolean; reason?: 'max'; max?: number; slug: string; equipped: boolean };
}

/** The world decorations the signed-in user has switched on, for the 3D scene. */
export async function fetchEquippedDecorations(): Promise<string[]> {
  const { data, error } = await createClient()
    .from('user_cosmetics')
    .select('slug, cosmetics!inner(kind)')
    .eq('equipped', true);
  if (error) throw error;
  return ((data ?? []) as { slug: string; cosmetics: { kind: string } | { kind: string }[] }[])
    .filter((r) => {
      const c = Array.isArray(r.cosmetics) ? r.cosmetics[0] : r.cosmetics;
      return c?.kind === 'mundo';
    })
    .map((r) => r.slug);
}

/** Human label for a ledger line. */
export function ledgerLabel(source: string): string {
  switch (source) {
    case 'challenge': return 'Reto completado';
    case 'daily_set': return 'Jornada completa';
    case 'streak': return 'Hito de racha';
    case 'world': return 'Mundo completado';
    case 'rank': return 'Subiste de rango';
    case 'goal': return 'Objetivo cumplido';
    case 'lesson': return 'Lección aprobada';
    case 'purchase': return 'Compra';
    case 'backfill': return 'Por lo que ya habías hecho';
    default: return 'Movimiento';
  }
}
