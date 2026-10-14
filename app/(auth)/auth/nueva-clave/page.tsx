import type { Metadata } from 'next';
import Link from 'next/link';
import { KeyRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { buttonVariants } from '@/components/ui/button-variants';
import { LogoMark } from '@/components/brand/Logo';
import { BRAND } from '@/lib/brand';
import { FormularioNuevaClave } from '@/components/auth/FormularioNuevaClave';

export const metadata: Metadata = { title: 'Nueva contraseña' };
export const dynamic = 'force-dynamic';

/**
 * Where the recovery link lands (`/auth/confirm?next=/auth/nueva-clave`). The
 * link already opened a session; this screen only sets the new password. With
 * no session — an old link, or somebody typing the URL — it says so and points
 * back to asking for a new one, instead of showing a form that cannot work.
 */
export default async function NuevaClavePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex items-center gap-2">
          <LogoMark size={26} />
          <span className="font-display text-h3 font-extrabold tracking-tight">{BRAND.name}</span>
        </div>
        <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-primary/15 text-primary">
          <KeyRound className="h-6 w-6" />
        </span>
        {user ? (
          <>
            <h1 className="mt-4 font-display text-h1 font-bold">Elegí tu contraseña nueva</h1>
            <p className="mt-1.5 text-small leading-relaxed text-muted-foreground">
              Para {user.email}. Después de guardarla seguís adentro, sin volver a ingresar.
            </p>
            <FormularioNuevaClave />
          </>
        ) : (
          <>
            <h1 className="mt-4 font-display text-h1 font-bold">Este enlace ya no sirve</h1>
            <p className="mt-1.5 text-small leading-relaxed text-muted-foreground">
              Los enlaces para cambiar la contraseña se usan una sola vez y vencen en una hora. Pedí uno nuevo y
              abrilo desde el mismo teléfono o compu.
            </p>
            <Link href="/auth/login?modo=recuperar" className={buttonVariants({ variant: 'primary', block: true, className: 'mt-6 rounded-pill' })}>
              Pedir un enlace nuevo
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
