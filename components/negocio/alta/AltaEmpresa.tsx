'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight, Store, Target } from 'lucide-react';

/**
 * Dos cuentas de empresa distintas (0121), y la primera pregunta es para qué.
 *
 * Una TIENDA vende en el Mercado: es todo lo que necesita y es lo que ve. Una
 * EMPRESA QUE MEJORA viene a bajar su huella: cuenta cómo trabaja, recibe
 * objetivos y acciones a su medida y compite en la Liga. Mezclarlas en un solo
 * alta era lo que confundía a las dos.
 */
export function ElegirTipoNegocio() {
  const t = useTranslations('negocio.tipo');
  return (
    <div className="pt-2">
      <span className="eyebrow text-muted-foreground">{t('eyebrow')}</span>
      <h1 className="mt-1.5 font-display text-display-l font-bold leading-tight">{t('titulo')}</h1>
      <p className="mt-2 max-w-prose text-body leading-relaxed text-muted-foreground">{t('bajada')}</p>

      <div className="mt-6 grid gap-3">
        <Opcion
          href="/negocio/alta?nuevo=1&tipo=vender"
          icono={<Store className="h-6 w-6" aria-hidden />}
          color="#FFB23E"
          titulo={t('venderTitulo')}
          cuerpo={t('venderCuerpo')}
          puntos={[t('vender1'), t('vender2'), t('vender3')]}
        />
        <Opcion
          href="/negocio/alta?nuevo=1&tipo=mejorar"
          icono={<Target className="h-6 w-6" aria-hidden />}
          color="#1FB57A"
          titulo={t('mejorarTitulo')}
          cuerpo={t('mejorarCuerpo')}
          puntos={[t('mejorar1'), t('mejorar2'), t('mejorar3')]}
        />
      </div>
      <p className="mt-4 text-caption text-muted-foreground">{t('ambas')}</p>
    </div>
  );
}

function Opcion({
  href,
  icono,
  color,
  titulo,
  cuerpo,
  puntos,
}: {
  href: string;
  icono: React.ReactNode;
  color: string;
  titulo: string;
  cuerpo: string;
  puntos: string[];
}) {
  return (
    <Link
      href={href}
      className="press group block rounded-card border border-border bg-surface p-4 shadow-soft hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift"
      style={{ borderLeftColor: color, borderLeftWidth: 4 }}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px]"
          style={{ background: `${color}1f`, color }}
        >
          {icono}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-h3 font-bold leading-snug">{titulo}</p>
          <p className="mt-0.5 text-small leading-relaxed text-muted-foreground">{cuerpo}</p>
          <ul className="mt-2 space-y-1">
            {puntos.map((p) => (
              <li key={p} className="flex items-start gap-2 text-small">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
    </Link>
  );
}
