'use client';

import { useTranslations } from 'next-intl';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

/**
 * Impresiones y salidas, día por día. La serie es la que devuelve la base:
 * los días sin nada valen 0 y se ven como 0, que es información —no un hueco.
 */
export function SerieSalidas({ serie }: { serie: { dia: string; impresiones: number; salidas: number }[] }) {
  const t = useTranslations('negocio.analitica');
  const datos = serie.map((d) => ({
    ...d,
    etiqueta: new Date(d.dia).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
  }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={datos} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="gradImpresiones" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2DB4D4" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#2DB4D4" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradSalidas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1FB57A" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#1FB57A" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
          <XAxis dataKey="etiqueta" tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={24} stroke="currentColor" className="text-muted-foreground" />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} stroke="currentColor" className="text-muted-foreground" width={44} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12 }}
            labelFormatter={(v) => String(v)}
            formatter={(valor: number, nombre: string) => [
              valor,
              nombre === 'impresiones' ? t('impresiones') : t('salidas'),
            ]}
          />
          {/* Sin animación de entrada: el gráfico tiene que estar dibujado
              aunque el frame loop esté estrangulado (fase 4 §2.2). */}
          <Area isAnimationActive={false} type="monotone" dataKey="impresiones" stroke="#2DB4D4" fill="url(#gradImpresiones)" strokeWidth={2} />
          <Area isAnimationActive={false} type="monotone" dataKey="salidas" stroke="#1FB57A" fill="url(#gradSalidas)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
