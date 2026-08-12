import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { BRAND } from '@/lib/brand';

/**
 * Shell for the public legal documents. Deliberately plain and readable —
 * long-form legal text, generous line height, no app chrome, and reachable
 * without an account (see PUBLIC_PREFIXES in lib/supabase/middleware.ts).
 */
export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-3.5">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1.5 text-small text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
          <span className="ml-auto font-display text-small font-bold">{BRAND.name}</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8 pb-20">{children}</main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-3xl flex-wrap gap-x-5 gap-y-2 px-5 py-6 text-caption text-muted-foreground">
          <Link href="/legal/terminos" className="hover:text-foreground">
            Términos y Condiciones
          </Link>
          <Link href="/legal/privacidad" className="hover:text-foreground">
            Política de Privacidad
          </Link>
          <span className="ml-auto">
            {BRAND.name} · {BRAND.contactEmail}
          </span>
        </div>
      </footer>
    </div>
  );
}
