import 'server-only';

import { cache } from 'react';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { CTX_COOKIE } from '@/lib/negocio/catalogo';
import type {
  BusinessRole,
  BusinessStatus,
  DetalleObjetivo,
  EvidenceTier,
  MejoraEstado,
  MiNegocio,
  NegocioDetalle,
} from '@/lib/supabase/rows-negocio';

export type ActiveBusiness = {
  id: string;
  nombre: string;
  slug: string;
  role: BusinessRole;
  status: BusinessStatus;
  tier: EvidenceTier;
};

/** Lo mínimo de la persona que necesita el shell de negocio. */
export interface PerfilNegocio {
  id: string;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
  accountType: 'kid' | 'teen' | 'adult';
  onboardingCompleted: boolean;
}

/** Lo que dice la cookie, sin validar. `null` = contexto personal. */
export function contextoCookie(): string | null {
  const v = cookies().get(CTX_COOKIE)?.value ?? '';
  const m = v.match(/^biz:([0-9a-f-]{36})$/);
  return m?.[1] ?? null;
}

/**
 * La persona con sesión, o null. Una consulta propia en lugar de
 * `getSessionData()`: el shell de negocio no necesita puntos, racha ni mundo.
 */
export const getPerfilNegocio = cache(async (): Promise<PerfilNegocio | null> => {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, username, avatar_url, account_type, onboarding_completed')
    .eq('id', session.user.id)
    .maybeSingle();
  // Igual que el shell de persona: una consulta caída no es "no hay sesión".
  if (error) throw new Error(`Failed to load profile: ${error.message}`);
  if (!data) return null;

  return {
    id: data.id as string,
    displayName: (data.display_name as string | null) ?? null,
    username: (data.username as string | null) ?? null,
    avatarUrl: (data.avatar_url as string | null) ?? null,
    accountType: ((data.account_type as PerfilNegocio['accountType'] | null) ?? 'adult'),
    onboardingCompleted: Boolean(data.onboarding_completed),
  };
});

/** Los negocios de la persona (`my_businesses`), para el selector. */
export const getMisNegocios = cache(async (): Promise<MiNegocio[]> => {
  const { data, error } = await createClient().rpc('my_businesses');
  if (error) throw new Error(`Failed to load businesses: ${error.message}`);
  return (data ?? []) as MiNegocio[];
});

/**
 * El negocio activo, o null.
 *
 * SIEMPRE valida membresía contra la base: la cookie es una preferencia. Si
 * apunta a un negocio del que la persona no es miembro, devuelve null — y el
 * layout manda a `/negocio/contexto`, que limpia la cookie (acá no se puede:
 * durante el render de un Server Component las cookies son de solo lectura).
 */
export const getActiveBusiness = cache(async (): Promise<ActiveBusiness | null> => {
  const id = contextoCookie();
  if (!id) return null;
  const negocios = await getMisNegocios();
  return negocios.find((n) => n.id === id) ?? null;
});

/** El registro completo del negocio activo (`negocio_detalle`), o null. */
export const getNegocioDetalle = cache(async (id: string): Promise<NegocioDetalle | null> => {
  const { data, error } = await createClient().rpc('negocio_detalle', { p_business: id });
  if (error) throw new Error(`Failed to load business: ${error.message}`);
  return (data ?? null) as NegocioDetalle | null;
});

/** El estado de Mejora del negocio activo (`mejora_estado`), o null. */
export const getMejoraEstado = cache(async (id: string): Promise<MejoraEstado | null> => {
  const { data, error } = await createClient().rpc('mejora_estado', { p_business: id });
  if (error) throw new Error(`Failed to load improvement state: ${error.message}`);
  return (data ?? null) as MejoraEstado | null;
});

/** Un objetivo con su historial (`objetivo_detalle`), o null si no es suyo. */
export const getObjetivoDetalle = cache(async (goalId: string): Promise<DetalleObjetivo | null> => {
  const { data, error } = await createClient().rpc('objetivo_detalle', { p_goal: goalId });
  if (error) throw new Error(`Failed to load goal: ${error.message}`);
  return (data ?? null) as DetalleObjetivo | null;
});
