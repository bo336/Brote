import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight, PackagePlus, PartyPopper, Store } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button-variants';
import type { EstadoVendedor } from '@/lib/negocio/vendedor';
import { cn } from '@/lib/utils/cn';

/** El final del alta: la tienda está abierta, y lo que sigue es publicar. */
export function TiendaAbierta({ estado }: { estado: EstadoVendedor }) {
  const t = useTranslations('negocio.vendedor.abierta');
  return (
    <div className="mx-auto max-w-xl pb-16 text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-gradient shadow-soft-lg">
        <PartyPopper className="h-8 w-8 text-white" />
      </span>
      <h1 className="mt-4 font-display text-display-l font-bold leading-tight">{t('titulo')}</h1>
      <p className="mt-2 text-body leading-relaxed text-muted-foreground">{t('cuerpo', { tienda: estado.tienda.nombre_comercial })}</p>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Link href="/negocio/listados/nuevo" className={cn(buttonVariants({ size: 'lg' }), 'rounded-pill')}>
          <PackagePlus className="h-5 w-5" />
          {t('publicar')}
        </Link>
        <Link href={`/mercado/tienda/${estado.slug}`} className={cn(buttonVariants({ variant: 'secondary', size: 'lg' }), 'rounded-pill')}>
          <Store className="h-5 w-5" />
          {t('verTienda')}
        </Link>
      </div>

      <ul className="mx-auto mt-8 max-w-md space-y-3 text-left">
        {(['consejo1', 'consejo2', 'consejo3'] as const).map((k, i) => (
          <li key={k} className="flex gap-3 rounded-card border border-border bg-surface p-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-caption font-bold text-primary tnum">{i + 1}</span>
            <span className="text-small leading-relaxed">{t(k)}</span>
          </li>
        ))}
      </ul>

      <Link href="/negocio" className="mt-6 inline-flex items-center gap-1 text-small font-semibold text-primary">
        <span className="link-underline">{t('irAlPanel')}</span>
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
