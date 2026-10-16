import type { ReactNode } from 'react';
import Link from 'next/link';
import { LogoMark } from '@/components/brand/Logo';
import { BRAND } from '@/lib/brand';
import { buttonVariants } from '@/components/ui/button-variants';

/**
 * El marco de la guía pública: liviano, sin la barra de la app (quien llega
 * de un buscador no tiene cuenta), con una puerta clara para crearla.
 */
export default function GuiaLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 border-b border-hairline bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Link href="/guia" className="flex items-center gap-2">
            <LogoMark size={24} />
            <span className="font-display text-h3 font-extrabold tracking-tight">{BRAND.name}</span>
            <span className="hidden text-small text-muted-foreground sm:inline">· Guía de acciones</span>
          </Link>
          <span className="flex-1" />
          <Link href="/auth/login" className="text-small font-medium text-muted-foreground transition-colors hover:text-foreground">
            Entrar
          </Link>
          <Link href="/auth/login?modo=crear" className={buttonVariants({ variant: 'primary', size: 'sm', className: 'rounded-pill' })}>
            Crear cuenta
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-6">{children}</main>
      <footer className="border-t border-hairline">
        <div className="mx-auto flex max-w-3xl flex-wrap gap-x-4 gap-y-2 px-4 py-6 text-caption text-muted-foreground">
          <span>© {new Date().getFullYear()} {BRAND.name}</span>
          <Link href="/legal/terminos" className="hover:text-foreground">Términos</Link>
          <Link href="/legal/privacidad" className="hover:text-foreground">Privacidad</Link>
          <Link href="/legal/fuentes" className="hover:text-foreground">Fuentes</Link>
          <Link href="/negocios" className="hover:text-foreground">Para empresas</Link>
        </div>
      </footer>
    </div>
  );
}
