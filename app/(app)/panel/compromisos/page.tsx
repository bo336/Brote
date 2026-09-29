'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';
import { ArrowLeft, BadgeCheck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { CandadoPanel, usePanelPass } from '@/components/panel/PanelPass';
import { compromisoRevisar, compromisosCola, type ColaCompromisos } from '@/lib/api/mercado';
import { urlImagen } from '@/lib/mercado/imagenes';
import { useToastStore } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

/**
 * `/panel/compromisos` (Mercado v2): las tiendas nuevas y la foto de su
 * compromiso. La tienda ya está abierta —nadie espera esta revisión para
 * vender—, pero hasta que alguien mira la foto, la práctica se muestra como
 * "declarada, con foto". Revisarla la pasa a "revisado por Brote"; si la foto
 * no muestra lo que dice, se rechaza con una nota que le llega a la tienda.
 */
export default function CompromisosPage() {
  const t = useTranslations('mercado.panel.compromisos');
  const tp = useTranslations('mercado.practicas');
  const tc = useTranslations('mercado.categorias');
  const tv = useTranslations('negocio.panel');
  const tg = useTranslations('mercado.panel');
  const f = useFormatter();
  const { pass, setPass } = usePanelPass();
  const [cola, setCola] = useState<ColaCompromisos | null>(null);
  const [cargando, setCargando] = useState(false);
  const [notas, setNotas] = useState<Record<string, string>>({});
  const [ocupado, setOcupado] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!pass) return;
    setCargando(true);
    const r = await compromisosCola(pass);
    setCargando(false);
    if (!r.ok) {
      if (/autorizado/i.test(r.error)) setPass('');
      else useToastStore.getState().push({ variant: 'error', title: tg('error') });
      return;
    }
    setCola(r);
  }, [pass, setPass, tg]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function revisar(negocio: string, practica: string, decision: 'revisado' | 'rechazado') {
    if (!pass) return;
    const clave = `${negocio}:${practica}`;
    setOcupado(`${decision}-${clave}`);
    const r = await compromisoRevisar(pass, negocio, practica, decision, notas[clave] ?? '');
    setOcupado(null);
    if (!r.ok) {
      useToastStore.getState().push({ variant: 'error', title: r.error === 'falta_nota' ? t('faltaNota') : tg('error') });
      return;
    }
    useToastStore.getState().push({ variant: 'success', title: tg('hecho') });
    await cargar();
  }

  if (!pass) return <CandadoPanel verificar={async (p) => (await compromisosCola(p)).ok} />;

  return (
    <div className="space-y-5 py-4 pb-16">
      <Link href="/panel" className="inline-flex items-center gap-1.5 text-small text-muted-foreground transition-colors duration-150 hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {tv('volverPanel')}
      </Link>
      <header className="flex items-end justify-between gap-3">
        <div>
          <span className="eyebrow text-muted-foreground">{t('eyebrow')}</span>
          <h1 className="mt-1 font-display text-h1 font-bold">{t('titulo')}</h1>
          {cola && <p className="mt-1 text-small text-muted-foreground">{t('pendientesN', { n: cola.pendientes })}</p>}
        </div>
        <Button variant="secondary" size="icon-sm" onClick={() => void cargar()} aria-label={t('titulo')}>
          <RefreshCw className={cn('h-4 w-4', cargando && 'animate-spin')} />
        </Button>
      </header>
      <p className="text-caption leading-relaxed text-muted-foreground">{t('ayuda')}</p>

      {!cola ? (
        <Skeleton className="h-48 w-full" />
      ) : cola.items.length === 0 ? (
        <p className="border-y border-hairline py-8 text-center text-small text-muted-foreground">{t('vacia')}</p>
      ) : (
        <ul className="space-y-4">
          {cola.items.map((s) => (
            <li key={s.business_id} className="rounded-card border border-border bg-surface p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Link href={`/mercado/tienda/${s.slug}`} className="font-display text-h3 font-bold">
                  <span className="link-underline">{s.nombre}</span>
                </Link>
                <span className="text-caption text-muted-foreground">
                  {[s.categoria ? tc(s.categoria) : null, s.provincia, s.abierta_at ? t('abrio', { fecha: f.dateTime(new Date(s.abierta_at), { day: 'numeric', month: 'short' }) }) : null]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </div>
              {s.mp_nickname && (
                <p className="mt-1 flex items-center gap-1.5 text-caption text-muted-foreground">
                  <BadgeCheck className="h-3.5 w-3.5 text-brote-aqua" />
                  {t('mp', { cuenta: s.mp_nickname })}
                </p>
              )}
              <ul className="mt-3 space-y-3">
                {s.compromisos.map((c) => {
                  const clave = `${s.business_id}:${c.practica}`;
                  const src = urlImagen(c.foto_path);
                  return (
                    <li key={c.practica} className="flex flex-col gap-3 border-t border-hairline pt-3 sm:flex-row">
                      {src ? (
                        <a href={src} target="_blank" rel="noreferrer" className="relative block h-40 w-full shrink-0 overflow-hidden rounded-[14px] bg-surface-2 sm:h-32 sm:w-32">
                          <Image src={src} alt={tp(`${c.practica}.titulo`)} fill sizes="(max-width: 640px) 100vw, 128px" className="object-cover" />
                        </a>
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <p className="text-small font-semibold">{tp(`${c.practica}.titulo`)}</p>
                        <p className="mt-0.5 text-caption text-muted-foreground">{tp(`${c.practica}.ayuda`)}</p>
                        <p className={cn('mt-1 text-caption font-semibold', c.estado === 'revisado' ? 'text-brote-green' : c.estado === 'rechazado' ? 'text-brote-coral' : 'text-muted-foreground')}>
                          {t(`estados.${c.estado}`)}
                          {!c.foto_path && c.estado === 'declarado' ? ` · ${t('sinFoto')}` : ''}
                        </p>
                        {c.foto_path && c.estado === 'declarado' && (
                          <div className="mt-2 space-y-2">
                            <Textarea
                              value={notas[clave] ?? ''}
                              onChange={(e) => setNotas((n) => ({ ...n, [clave]: e.target.value }))}
                              placeholder={t('notaPh')}
                              aria-label={t('notaPh')}
                              className="min-h-16 text-small"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" loading={ocupado === `revisado-${clave}`} disabled={!!ocupado} onClick={() => void revisar(s.business_id, c.practica, 'revisado')}>
                                {t('aprobar')}
                              </Button>
                              <Button size="sm" variant="ghost" loading={ocupado === `rechazado-${clave}`} disabled={!!ocupado} onClick={() => void revisar(s.business_id, c.practica, 'rechazado')}>
                                {t('rechazar')}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
