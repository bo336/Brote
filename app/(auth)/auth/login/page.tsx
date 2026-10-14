import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { safeNext } from '@/lib/supabase/route';
import { PantallaAcceso, type ModoAcceso, type PulsoPublico } from '@/components/auth/PantallaAcceso';

export const metadata: Metadata = {
  title: 'Entrar',
  description: 'Entrá a Brote: acciones reales por el ambiente, un mundo que crece con vos y gente que hace lo mismo.',
};

/**
 * The community's real totals, for the brand panel. Cached for ten minutes on
 * top of the database's own ten-minute cache, so a busy login screen costs one
 * RPC every ten minutes — and a failure only means the panel shows its value
 * proposition instead of numbers.
 */
const leerPulso = unstable_cache(
  async (): Promise<PulsoPublico | null> => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await supabase.rpc('brote_pulso_publico');
    if (error || !data) return null;
    const d = data as Record<string, unknown>;
    const n = (v: unknown) => Number(v ?? 0) || 0;
    return {
      personas: n(d.personas),
      acciones: n(d.acciones),
      acciones_hoy: n(d.acciones_hoy),
      agua_l: n(d.agua_l),
      co2_kg: n(d.co2_kg),
    };
  },
  ['brote-pulso-publico'],
  { revalidate: 600 },
);

const MODOS: ModoAcceso[] = ['entrar', 'crear', 'enlace', 'recuperar'];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string; detail?: string; modo?: string };
}) {
  const pulso = await leerPulso().catch(() => null);
  const modo = MODOS.includes(searchParams.modo as ModoAcceso) ? (searchParams.modo as ModoAcceso) : 'entrar';
  return (
    <PantallaAcceso
      pulso={pulso}
      next={safeNext(searchParams.next ?? null)}
      modoInicial={modo}
      errorKey={searchParams.error ?? null}
      errorDetail={searchParams.detail ?? null}
    />
  );
}
