import { type ReactNode } from 'react';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { PanelShell } from '@/components/panel/PanelShell';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Panel',
  robots: { index: false, follow: false },
};

/**
 * La puerta del panel, del lado del servidor, antes de mandar una sola línea.
 *
 * `getUser()` valida la sesión contra Supabase (no confía en la cookie), y
 * `admin_check` decide (0136): sólo la cuenta del dueño pasa. Para cualquier otra
 * el panel no existe: un 404, no un "acceso denegado", y queda anotado el intento.
 *
 * Esto es la primera cerradura. La segunda y la que importa es que cada función
 * del panel vuelve a preguntarle lo mismo a la base en cada llamada.
 */
export default async function PanelLayout({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?next=/panel');

  const { data: esDueno } = await supabase.rpc('admin_check', { p_pass: '' });
  if (esDueno !== true) notFound();

  return <PanelShell>{children}</PanelShell>;
}
