import { type ReactNode } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ShellNegocio } from '@/components/negocio/ShellNegocio';
import {
  contextoCookie,
  getActiveBusiness,
  getMisNegocios,
  getPerfilNegocio,
} from '@/lib/negocio/context';

/**
 * El shell de negocio (07 §3): otra app, a propósito.
 *
 * Sin BottomTabBar, sin Pip, sin mundo, sin racha, sin puntos, sin publicidad,
 * sin RewardLayer. Formal y denso. NO importa nada de `components/mundo3d`,
 * `components/pip`, `components/rewards`, `components/ads` ni la barra de
 * pestañas — esa lista es un criterio de aceptación de la fase 1.
 *
 * Todo lo que decide quién entra se decide acá, contra la base: el middleware
 * solo mira la cookie.
 */
export default async function BusinessLayout({ children }: { children: ReactNode }) {
  const pathname = headers().get('x-pathname') ?? '/negocio';
  const perfil = await getPerfilNegocio();
  if (!perfil) redirect(`/auth/login?next=${encodeURIComponent(pathname)}`);

  // Menores nunca (D7). Se frena acá, en el servidor, para toda ruta de negocio;
  // `create_business` lo vuelve a frenar en Postgres.
  if (perfil.accountType !== 'adult') redirect('/?aviso=negocios');
  // Antes del onboarding `account_type` todavía vale 'adult' por defecto.
  if (!perfil.onboardingCompleted) redirect('/onboarding');

  const [negocios, activo] = await Promise.all([getMisNegocios(), getActiveBusiness()]);

  // La cookie apunta a un negocio del que no es miembro: se limpia.
  if (!activo && contextoCookie()) redirect('/negocio/contexto');

  const enfocado = pathname === '/negocio/alta';
  if (!activo && !enfocado) redirect('/negocio/alta');

  return (
    <ShellNegocio perfil={perfil} negocios={negocios} activo={activo} enfocado={enfocado}>
      {children}
    </ShellNegocio>
  );
}
