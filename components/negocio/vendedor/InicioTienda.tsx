import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  ExternalLink,
  Heart,
  MessageCircleQuestion,
  MousePointerClick,
  PackagePlus,
  PencilLine,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { urlImagen } from '@/lib/mercado/imagenes';
import type { EstadoVendedor } from '@/lib/negocio/vendedor';
import type { MisListados } from '@/lib/supabase/rows-mercado';
import { cn } from '@/lib/utils/cn';

/**
 * `/negocio` para una tienda abierta: cómo le va y qué hacer ahora.
 *
 * Arriba, lo urgente (una suscripción que no se pudo cobrar, preguntas sin
 * responder). Después, cuatro números que son ciertos —productos publicados,
 * personas que los guardaron, salidas hacia la tienda en 30 días, preguntas
 * pendientes— y los accesos a lo que se hace todos los días.
 */
export function InicioTienda({ estado, datos }: { estado: EstadoVendedor; datos: MisListados }) {
  const t = useTranslations('negocio.vendedor.inicio');
  const tp = useTranslations('mercado.practicas');
  const publicados = datos.listados.filter((l) => l.status === 'publicado');
  const guardados = datos.listados.reduce((a, l) => a + (l.favoritos ?? 0), 0);
  const salidas = datos.listados.reduce((a, l) => a + (l.clics_30d ?? 0), 0);
  const preguntas = datos.preguntas_pendientes ?? 0;
  const pendientes = datos.listados.filter((l) => l.status === 'pendiente').length;
  const borradores = datos.listados.filter((l) => l.status === 'draft').length;
  const sub = estado.suscripcion;
  const compromisoEnRevision = estado.compromisos.some((c) => c.foto_path && c.estado === 'declarado');
  const compromisoRevisado = estado.compromisos.some((c) => c.estado === 'revisado');

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <span className="eyebrow text-muted-foreground">{t('eyebrow')}</span>
          <h1 className="mt-1 truncate font-display text-display-l font-bold leading-tight">{estado.tienda.nombre_comercial}</h1>
        </div>
        <Link href={`/mercado/tienda/${estado.slug}`} className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'rounded-pill')}>
          <Store className="h-4 w-4" />
          {t('verTienda')}
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </header>

      {sub?.status === 'en_gracia' && (
        <Aviso tono="coral" href="/negocio/plan" texto={t('gracia')} />
      )}
      {estado.cobro && (!sub || sub.status === 'cancelada' || sub.status === 'vencida' || sub.status === 'pausada') && (
        <Aviso tono="coral" href="/negocio/plan" texto={t('sinSuscripcion')} />
      )}
      {preguntas > 0 && <Aviso tono="sol" href="/negocio/preguntas" texto={t('preguntasPendientes', { n: preguntas })} />}

      <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Numero icono={Store} valor={publicados.length} etiqueta={t('publicados')} />
        <Numero icono={Heart} valor={guardados} etiqueta={t('guardados')} />
        <Numero icono={MousePointerClick} valor={salidas} etiqueta={t('salidas')} />
        <Numero icono={MessageCircleQuestion} valor={preguntas} etiqueta={t('preguntas')} />
      </dl>

      <div className="grid gap-2.5 sm:grid-cols-3">
        <Acceso href="/negocio/listados/nuevo" icono={PackagePlus} titulo={t('publicar')} ayuda={t('publicarAyuda')} principal />
        <Acceso href="/negocio/preguntas" icono={MessageCircleQuestion} titulo={t('responder')} ayuda={t('responderAyuda')} />
        <Acceso href="/negocio/tienda" icono={PencilLine} titulo={t('editarTienda')} ayuda={t('editarTiendaAyuda')} />
      </div>

      {publicados.length === 0 ? (
        <section className="rounded-card border border-dashed border-border p-6 text-center">
          <PackagePlus className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 font-display text-h3 font-bold">{t('vacioTitulo')}</p>
          <p className="mx-auto mt-1 max-w-sm text-small text-muted-foreground">{t('vacioCuerpo')}</p>
          <Link href="/negocio/listados/nuevo" className={cn(buttonVariants({ size: 'lg' }), 'mt-4 rounded-pill')}>
            {t('publicarPrimero')}
          </Link>
        </section>
      ) : (
        <section>
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-display text-h3 font-bold">{t('tusProductos')}</h2>
            <Link href="/negocio/listados" className="text-small font-semibold text-primary">
              <span className="link-underline">{t('verTodos')}</span>
            </Link>
          </div>
          {(pendientes > 0 || borradores > 0) && (
            <p className="mt-1 text-caption text-muted-foreground">
              {[pendientes > 0 ? t('enRevisionN', { n: pendientes }) : null, borradores > 0 ? t('borradoresN', { n: borradores }) : null]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
          <ul className="mt-3 divide-y divide-hairline border-y border-hairline">
            {[...publicados]
              .sort((a, b) => (b.clics_30d ?? 0) - (a.clics_30d ?? 0))
              .slice(0, 5)
              .map((l) => {
                const img = urlImagen(l.imagen);
                return (
                  <li key={l.id}>
                    <Link href={`/negocio/listados/${l.id}`} className="flex items-center gap-3 py-3">
                      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[12px] bg-surface-2">
                        {img && <Image src={img} alt="" fill sizes="48px" className="object-cover" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-small font-semibold">{l.titulo}</span>
                        <span className="block text-caption text-muted-foreground">
                          {t('filaDatos', { salidas: l.clics_30d ?? 0, guardados: l.favoritos ?? 0 })}
                        </span>
                      </span>
                      {(l.preguntas_pendientes ?? 0) > 0 && (
                        <span className="rounded-pill bg-brote-sun/20 px-2 py-0.5 text-[11px] font-semibold">{t('preguntasN', { n: l.preguntas_pendientes ?? 0 })}</span>
                      )}
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                );
              })}
          </ul>
        </section>
      )}

      <section className="rounded-card border border-border bg-surface p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brote-green/15">
            {compromisoRevisado ? <ShieldCheck className="h-5 w-5 text-brote-green" /> : <Camera className="h-5 w-5 text-brote-green" />}
          </span>
          <div className="min-w-0">
            <p className="text-small font-semibold">{t('compromisoTitulo')}</p>
            <p className="mt-0.5 text-caption leading-relaxed text-muted-foreground">
              {compromisoRevisado ? t('compromisoRevisado') : compromisoEnRevision ? t('compromisoEnRevision') : t('compromisoSinFoto')}
            </p>
            <p className="mt-2 text-caption">
              {estado.compromisos
                .filter((c) => c.estado !== 'rechazado')
                .map((c) => tp(`${c.practica}.titulo`))
                .join(' · ')}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Aviso({ tono, href, texto }: { tono: 'coral' | 'sol'; href: string; texto: string }) {
  return (
    <Link
      href={href}
      className={cn(
        'press flex items-center gap-3 rounded-card border p-4 text-small font-medium',
        tono === 'coral' ? 'border-brote-coral/40 bg-brote-coral/10' : 'border-brote-sun/40 bg-brote-sun/10',
      )}
    >
      <AlertTriangle className={cn('h-5 w-5 shrink-0', tono === 'coral' ? 'text-brote-coral' : 'text-brote-sun')} />
      <span className="min-w-0 flex-1">{texto}</span>
      <ArrowRight className="h-4 w-4 shrink-0" />
    </Link>
  );
}

function Numero({ icono: Icono, valor, etiqueta }: { icono: React.ComponentType<{ className?: string }>; valor: number; etiqueta: string }) {
  return (
    <div className="rounded-card border border-border bg-surface p-3.5">
      <dt className="flex items-center gap-1.5 text-caption text-muted-foreground">
        <Icono className="h-3.5 w-3.5" />
        {etiqueta}
      </dt>
      <dd className="mt-1 font-display text-h1 font-bold tnum">{valor}</dd>
    </div>
  );
}

function Acceso({
  href,
  icono: Icono,
  titulo,
  ayuda,
  principal = false,
}: {
  href: string;
  icono: React.ComponentType<{ className?: string }>;
  titulo: string;
  ayuda: string;
  principal?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'press group flex items-start gap-3 rounded-card border p-4 transition-shadow duration-200 hover:shadow-lift',
        principal ? 'border-primary/40 bg-primary/10' : 'border-border bg-surface',
      )}
    >
      <Icono className={cn('mt-0.5 h-5 w-5 shrink-0', principal ? 'text-primary' : 'text-muted-foreground')} />
      <span className="min-w-0">
        <span className="block text-small font-semibold">{titulo}</span>
        <span className="mt-0.5 block text-caption leading-relaxed text-muted-foreground">{ayuda}</span>
      </span>
    </Link>
  );
}
