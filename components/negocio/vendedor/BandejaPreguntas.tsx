'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFormatter, useTranslations } from 'next-intl';
import { CornerDownRight, EyeOff, Eye, MessageCircleQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChipRail } from '@/components/ui/chip-rail';
import { EmptyState } from '@/components/ui/empty-state';
import { ocultarPregunta, responderPregunta } from '@/lib/mercado/acciones';
import { urlImagen } from '@/lib/mercado/imagenes';
import type { PreguntasTienda } from '@/lib/supabase/rows-mercado';
import { useToastStore } from '@/stores/toast';

type Estado = 'pendientes' | 'respondidas' | 'ocultas';

/**
 * `/negocio/preguntas` — lo que la gente le pregunta a la tienda. Sin responder
 * primero, con el producto al lado. La respuesta se publica en la ficha (y le
 * llega a quien preguntó); una pregunta fuera de lugar se oculta.
 *
 * Responder rápido no es un truco de ranking: es lo que hace que alguien
 * compre. Por eso el número de sin responder está arriba de todo en el panel.
 */
export function BandejaPreguntas({ datos, estado }: { datos: PreguntasTienda; estado: Estado }) {
  const t = useTranslations('negocio.vendedor.preguntas');
  const router = useRouter();
  const formato = useFormatter();

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-h1 font-bold">{t('titulo')}</h1>
      <p className="mt-1 text-small text-muted-foreground">{t('bajada')}</p>

      <ChipRail
        layoutId="preguntas-estado"
        value={estado}
        onChange={(v) => router.push(v === 'pendientes' ? '/negocio/preguntas' : `/negocio/preguntas?estado=${v}`)}
        options={[
          { value: 'pendientes', label: t('estados.pendientes', { n: datos.pendientes }) },
          { value: 'respondidas', label: t('estados.respondidas') },
          { value: 'ocultas', label: t('estados.ocultas') },
        ]}
        className="mt-4"
      />

      {datos.items.length === 0 ? (
        <EmptyState title={t(`vacio.${estado}Titulo`)} message={t(`vacio.${estado}`)} pipMood="happy" className="mt-4" />
      ) : (
        <ul className="mt-5 space-y-3">
          {datos.items.map((p) => (
            <Pregunta key={p.id} p={p} formato={formato} />
          ))}
        </ul>
      )}
    </div>
  );
}

function Pregunta({ p, formato }: { p: PreguntasTienda['items'][number]; formato: ReturnType<typeof useFormatter> }) {
  const t = useTranslations('negocio.vendedor.preguntas');
  const te = useTranslations('negocio.vendedor.preguntas.errores');
  const router = useRouter();
  const [texto, setTexto] = useState(p.respuesta ?? '');
  const [editando, setEditando] = useState(!p.respuesta);
  const [pendiente, startTransition] = useTransition();
  const img = urlImagen(p.listado.imagen);

  function responder(e: React.FormEvent) {
    e.preventDefault();
    if (texto.trim().length < 2) return;
    startTransition(async () => {
      const r = await responderPregunta(p.id, texto);
      if (!r.ok) {
        useToastStore.getState().push({ variant: 'error', title: te.has(r.error) ? te(r.error) : te('error') });
        return;
      }
      useToastStore.getState().push({ variant: 'success', title: t('respondida') });
      setEditando(false);
      router.refresh();
    });
  }

  function alternarOculta() {
    startTransition(async () => {
      const r = await ocultarPregunta(p.id, p.estado === 'visible');
      if (!r.ok) useToastStore.getState().push({ variant: 'error', title: te('error') });
      router.refresh();
    });
  }

  return (
    <li className="rounded-card border border-border bg-surface p-4">
      <Link href={`/mercado/${p.listado.slug}`} className="flex items-center gap-2.5 text-caption text-muted-foreground hover:text-foreground">
        <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-[8px] bg-surface-2">
          {img && <Image src={img} alt="" fill sizes="32px" className="object-cover" />}
        </span>
        <span className="truncate">{p.listado.titulo}</span>
        <span className="ml-auto shrink-0">{formato.relativeTime(new Date(p.created_at))}</span>
      </Link>
      <p className="mt-2.5 flex gap-2 text-body font-medium">
        <MessageCircleQuestion className="mt-0.5 h-4.5 w-4.5 shrink-0 text-muted-foreground" />
        {p.texto}
      </p>

      {editando ? (
        <form onSubmit={responder} className="mt-3">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value.slice(0, 1000))}
            rows={3}
            placeholder={t('respuestaPh')}
            aria-label={t('respuestaPh')}
            className="w-full resize-none rounded-button border border-border bg-background px-3.5 py-2.5 text-small outline-none focus:border-primary/60"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-caption text-muted-foreground">{t('respuestaAyuda')}</span>
            <Button type="submit" size="sm" loading={pendiente} disabled={texto.trim().length < 2} className="rounded-pill">
              {p.respuesta ? t('guardar') : t('responder')}
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-2.5 flex gap-2 text-small text-muted-foreground">
          <CornerDownRight className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1 whitespace-pre-line">{p.respuesta}</span>
          <button type="button" onClick={() => setEditando(true)} className="shrink-0 text-caption font-semibold text-primary">
            {t('editar')}
          </button>
        </div>
      )}

      <div className="mt-3 flex justify-end border-t border-hairline pt-2.5">
        <button type="button" onClick={alternarOculta} disabled={pendiente} className="inline-flex items-center gap-1.5 text-caption font-semibold text-muted-foreground hover:text-foreground">
          {p.estado === 'visible' ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {p.estado === 'visible' ? t('ocultar') : t('mostrar')}
        </button>
      </div>
    </li>
  );
}
