'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { CircleCheck, Clock } from 'lucide-react';
import { ProgressBar } from '@/components/ui/progress';
import { getDomainColor, getDomainName } from '@/lib/domains';
import type { ObjetivoFila } from '@/lib/supabase/rows-negocio';
import { cn } from '@/lib/utils/cn';

/**
 * Las piezas compartidas de Mejora: el encabezado de una fila de objetivo, los
 * chips de ambición y esfuerzo, y la barra.
 *
 * El esfuerzo se muestra SIEMPRE, porque es la promesa del producto: esto no te
 * va a comer el día (07 §4.4).
 */

export function useNumero() {
  const f = useFormatter();
  return (n: number | null | undefined, unidad?: string) => {
    if (n == null) return '—';
    const txt = f.number(Number(n), { maximumFractionDigits: 2 });
    return unidad ? `${txt} ${unidad}` : txt;
  };
}

/** Días que faltan (positivo) o que pasaron (negativo) hasta el vencimiento. */
export function diasHasta(iso: string | null): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

export function ChipAmbicion({ ambicion }: { ambicion: ObjetivoFila['ambicion'] }) {
  const t = useTranslations('negocio.mejora.ambicion');
  return (
    <span className="rounded-pill border border-border bg-surface-2 px-2 py-px text-[11px] font-semibold text-muted-foreground">
      {t(ambicion)}
    </span>
  );
}

export function ChipEsfuerzo({ horas }: { horas: number }) {
  const t = useTranslations('negocio.mejora');
  const f = useFormatter();
  return (
    <span className="rounded-pill border border-border bg-surface-2 px-2 py-px text-[11px] font-semibold text-muted-foreground tnum">
      {t('esfuerzo', { n: f.number(Number(horas), { maximumFractionDigits: 1 }) })}
    </span>
  );
}

/** DOMINIO · TRIMESTRAL · VENCE EN 34 DÍAS — con el color del dominio. */
export function EyebrowObjetivo({ g }: { g: ObjetivoFila }) {
  const t = useTranslations('negocio.mejora');
  const dias = diasHasta(g.vence_at);
  const enRiesgo = g.status === 'en_riesgo';
  const vencido = g.status === 'incumplido' || (dias != null && dias < 0 && g.status === 'activo');

  const plazo =
    g.status === 'activo' || g.status === 'en_riesgo'
      ? dias == null
        ? t(`horizonte.${g.horizonte}`)
        : dias < 0
          ? t('vence.vencido', { n: Math.abs(dias) })
          : dias === 0
            ? t('vence.hoy')
            : t('vence.dias', { n: dias })
      : t(`horizonte.${g.horizonte}`);

  return (
    <span className="eyebrow flex flex-wrap items-center gap-x-1.5 text-muted-foreground">
      {g.dominio && (
        <span style={{ color: getDomainColor(g.dominio) }}>{getDomainName(g.dominio)}</span>
      )}
      <span aria-hidden>·</span>
      <span>{t(`horizonte.${g.horizonte}`)}</span>
      {(g.status === 'activo' || g.status === 'en_riesgo') && (
        <>
          <span aria-hidden>·</span>
          {/* En riesgo es ámbar, no rojo: es un aviso, no un fracaso. El rojo se
              reserva para lo que ya venció (07 §4.4). */}
          <span className={cn(enRiesgo && 'text-brote-sun', vencido && 'text-brote-coral')}>
            {enRiesgo ? `${t('estado.en_riesgo')} · ${plazo}` : plazo}
          </span>
        </>
      )}
      {g.status !== 'activo' && g.status !== 'en_riesgo' && (
        <>
          <span aria-hidden>·</span>
          <span className={cn(g.status === 'incumplido' && 'text-brote-coral')}>{t(`estado.${g.status}`)}</span>
        </>
      )}
    </span>
  );
}

/**
 * El avance real (0..1) y, aparte, el tiempo transcurrido (0..1).
 *
 * `avance` solo existe cuando hay un número real: el último valor que la
 * empresa informó en un check-in, o el valor final del cierre. Nunca se estima.
 * Si no hay ninguno, queda `tiempo`, que también es un dato real — pero se
 * muestra como lo que es, y por eso van separados.
 */
export function avanceDe(g: ObjetivoFila): { avance: number | null; tiempo: number | null } {
  const base = g.linea_base != null ? Number(g.linea_base) : null;
  const meta = g.objetivo != null ? Number(g.objetivo) : null;
  const valor = g.valor_final != null ? Number(g.valor_final) : g.ultimo_valor != null ? Number(g.ultimo_valor) : null;

  let avance: number | null = null;
  if (base != null && meta != null && base !== meta && valor != null) {
    avance = Math.max(0, Math.min(1, (base - valor) / (base - meta)));
  }

  const dias = diasHasta(g.vence_at);
  const total =
    g.inicia_at && g.vence_at
      ? (new Date(g.vence_at).getTime() - new Date(g.inicia_at).getTime()) / 86_400_000
      : null;
  const tiempo = total && dias != null ? Math.max(0, Math.min(1, (total - dias) / total)) : null;

  return { avance, tiempo };
}

/**
 * Antes → después, y la barra.
 *
 * `ProgressBar` toma 0..1, no un porcentaje (07 §2.1, trampa 3).
 */
export function MetricaObjetivo({ g }: { g: ObjetivoFila }) {
  const t = useTranslations('negocio.mejora');
  const num = useNumero();

  if (g.metrica_tipo === 'medicion' && g.linea_base == null) {
    return <p className="mt-1 text-small text-muted-foreground">{t('medicion')}</p>;
  }

  const base = g.linea_base != null ? Number(g.linea_base) : null;
  const meta = g.objetivo != null ? Number(g.objetivo) : null;
  const cerrado = g.valor_final != null ? Number(g.valor_final) : null;
  const { avance, tiempo } = avanceDe(g);

  return (
    <div className="mt-1">
      <p className="text-small tnum">
        {cerrado != null
          ? t('valorFinal', { valor: num(cerrado), unidad: g.unidad })
          : t('deA', { base: num(base), meta: num(meta), unidad: g.unidad })}
      </p>
      {(g.status === 'activo' || g.status === 'en_riesgo') && (avance != null || tiempo != null) && (
        <div className="mt-2 flex items-center gap-2">
          <ProgressBar
            value={avance ?? tiempo ?? 0}
            height={6}
            className="max-w-[16rem]"
            color={avance != null ? 'rgb(var(--primary))' : 'rgb(var(--border))'}
          />
          <span className="text-caption text-muted-foreground tnum">
            {avance != null ? `${Math.round(avance * 100)}%` : <Clock className="h-3.5 w-3.5" />}
          </span>
        </div>
      )}
    </div>
  );
}

/** Un tilde y una fecha. Nada más (07 §6). */
export function CerradoEl({ g }: { g: ObjetivoFila }) {
  const t = useTranslations('negocio.mejora');
  const f = useFormatter();
  return (
    <span className="flex items-center gap-1.5 text-caption text-muted-foreground">
      <CircleCheck className={cn('h-4 w-4', g.status === 'logrado' ? 'text-primary' : 'text-muted-foreground')} />
      {t(`estado.${g.status}`)}
      {g.cerrado_at && ` · ${f.dateTime(new Date(g.cerrado_at), { month: 'long', year: 'numeric' })}`}
    </span>
  );
}
