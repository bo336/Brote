'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Barras } from '@/components/panel/analitica/piezas';
import { Actualizar, Cargando, ErrorCarga, PageHeader, Section, Stat, StatGrid, num } from '@/components/panel/ui';
import { CUENTA, adminAvisosEstado } from '@/lib/api/admin';

/**
 * `/panel/avisos` — si los avisos están llegando (0129). Lo único que hay que
 * mirar: que haya claves, que nada quede atrasado y cuántos salieron.
 */

const CATEGORIA: Record<string, string> = {
  racha: 'Racha en riesgo',
  social: 'Seguidores y respuestas',
  reacciones: 'Reacciones',
  plaza: 'Novedades de la Plaza',
  rango: 'Rango y nivel',
  recap: 'Resumen semanal',
  reenganche: 'Te extrañamos',
  academia: 'Academia',
  proyectos: 'Proyectos',
  retos: 'Retos',
  cuenta: 'Cuenta',
  empresa: 'Empresas',
  admin: 'Para vos, del panel',
  otros: 'Otros',
};

export default function AvisosPanelPage() {
  const q = useQuery({ queryKey: ['panel', 'avisos'], queryFn: () => adminAvisosEstado(CUENTA) });

  const cabecera = (
    <PageHeader
      eyebrow="Sistema"
      title="Avisos"
      description="Lo que llega al teléfono de la gente: racha, Plaza, proyectos, y lo que te llega a vos cuando algo espera respuesta."
      actions={<Actualizar onClick={() => void q.refetch()} cargando={q.isFetching} />}
    />
  );
  if (q.isError || (q.isFetched && !q.data)) return <div>{cabecera}<ErrorCarga onReintentar={() => void q.refetch()} /></div>;
  if (!q.data) return <div>{cabecera}<Cargando /></div>;

  const e = q.data;
  const problema = !e.claves
    ? 'Todavía no hay claves: se generan solas en el primer minuto.'
    : e.vencidas > 0
      ? `${num(e.vencidas)} avisos esperan hace más de 5 minutos. Mirá las tareas en Salud.`
      : null;

  return (
    <div>
      {cabecera}
      <div className="space-y-6">
        <p className={`flex items-start gap-2.5 rounded-card border p-4 text-small ${problema ? 'border-brote-coral/40 bg-brote-coral/10' : 'border-brote-green/30 bg-brote-green/10'}`}>
          {problema ? <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-brote-coral" /> : <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brote-green" />}
          <span className="font-medium">{problema ?? 'Los avisos están saliendo bien.'}</span>
        </p>

        <StatGrid>
          <Stat label="Personas con avisos" value={num(e.personas_con_avisos)} hint={`${num(e.dispositivos)} dispositivos`} />
          <Stat label="Enviados en 24 h" value={num(e.enviadas_24h)} />
          <Stat label="En cola" value={num(e.pendientes)} hint="Los de noche esperan a las 9" />
          <Stat label="Fallidos en 24 h" value={num(e.fallidas_24h)} hint={`${num(e.omitidas_24h)} frenados por el tope diario`} tone={e.fallidas_24h > 0 ? 'mal' : undefined} />
        </StatGrid>

        <Section title="Qué se mandó" description="Últimos 7 días.">
          <Barras
            filas={Object.entries(e.por_categoria_7d ?? {})
              .map(([k, v]) => ({ etiqueta: CATEGORIA[k] ?? k, valor: Number(v) }))
              .sort((a, b) => b.valor - a.valor)}
            vacio="Todavía no salió ningún aviso."
          />
        </Section>

        <Section title="Cómo funcionan">
          <ul className="list-inside list-disc space-y-1.5 text-small leading-relaxed text-muted-foreground">
            <li>Racha en riesgo a las 20 h, novedades de la Plaza a las 18 h, «te extrañamos» a los 3 y 14 días sin entrar.</li>
            <li>Como mucho dos de estos por día y por persona; de 22 a 9 h esperan (salvo lo tuyo y lo de las empresas).</li>
            <li>Cada persona elige qué recibir en Ajustes. A vos te llega todo lo que espera respuesta y un resumen a las 9.</li>
          </ul>
        </Section>
      </div>
    </div>
  );
}
