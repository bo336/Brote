'use client';

import { useState, useTransition } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { CornerDownRight, MessageCircleQuestion } from 'lucide-react';
import { masPreguntas, preguntar } from '@/lib/mercado/acciones';
import type { PreguntaPublica } from '@/lib/supabase/rows-mercado';
import { useToastStore } from '@/stores/toast';

/**
 * Preguntas a la tienda, en público. La respuesta la ve todo el mundo (y le
 * sirve a la próxima persona con la misma duda); quién preguntó, no. Una
 * pregunta sin responder solo la ve quien la hizo, con su estado.
 */
export function PreguntasListado({
  listingId,
  inicial,
  total,
  tienda,
  propia,
}: {
  listingId: string;
  inicial: PreguntaPublica[];
  total: number;
  tienda: string;
  /** Es la tienda mirando su propio producto: no se pregunta a sí misma. */
  propia: boolean;
}) {
  const t = useTranslations('mercado.preguntas');
  const formato = useFormatter();
  const [lista, setLista] = useState(inicial);
  const [texto, setTexto] = useState('');
  const [pendiente, startTransition] = useTransition();
  const [cargando, setCargando] = useState(false);
  const respondidas = lista.filter((p) => p.respuesta).length;

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const q = texto.trim();
    if (q.length < 5) return;
    startTransition(async () => {
      const r = await preguntar(listingId, q);
      if (!r.ok) {
        const clave = `errores.${r.error}`;
        useToastStore.getState().push({ variant: 'error', title: t.has(clave) ? t(clave) : t('errores.error') });
        return;
      }
      setLista((l) => [
        { id: r.id, texto: q, respuesta: null, respondida_at: null, created_at: new Date().toISOString(), propia: true },
        ...l,
      ]);
      setTexto('');
      useToastStore.getState().push({ variant: 'default', title: t('enviada', { tienda }) });
    });
  }

  async function verMas() {
    setCargando(true);
    const mas = await masPreguntas(listingId, lista.length);
    setLista((l) => {
      const ids = new Set(l.map((p) => p.id));
      return [...l, ...mas.filter((p) => !ids.has(p.id))];
    });
    setCargando(false);
  }

  return (
    <section id="preguntas" aria-labelledby="preguntas-titulo" className="scroll-mt-20">
      <h2 id="preguntas-titulo" className="font-display text-h3 font-bold">
        {t('titulo')}
      </h2>

      {!propia && (
        <form onSubmit={enviar} className="mt-3">
          <label htmlFor="pregunta" className="sr-only">
            {t('placeholder', { tienda })}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <textarea
              id="pregunta"
              value={texto}
              onChange={(e) => setTexto(e.target.value.slice(0, 300))}
              rows={2}
              placeholder={t('placeholder', { tienda })}
              className="min-h-[3rem] flex-1 resize-none rounded-button border border-border bg-surface px-3.5 py-2.5 text-small outline-none focus:border-primary/60"
            />
            <button
              type="submit"
              disabled={pendiente || texto.trim().length < 5}
              className="press h-11 shrink-0 rounded-pill bg-primary px-5 text-small font-semibold text-primary-foreground shadow-crisp transition-opacity disabled:opacity-40 sm:self-end"
            >
              {pendiente ? t('enviando') : t('preguntar')}
            </button>
          </div>
          <p className="mt-1.5 text-caption text-muted-foreground">{t('ayuda')}</p>
        </form>
      )}

      {lista.length === 0 ? (
        <p className="mt-4 flex items-center gap-2 text-small text-muted-foreground">
          <MessageCircleQuestion className="h-4 w-4" />
          {t('vacio')}
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-hairline border-y border-hairline">
          {lista.map((p) => (
            <li key={p.id} className="py-3.5">
              <p className="text-small font-medium">{p.texto}</p>
              {p.respuesta ? (
                <p className="mt-1.5 flex gap-1.5 text-small text-muted-foreground">
                  <CornerDownRight className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    {p.respuesta}
                    {p.respondida_at && (
                      <span className="ml-1.5 text-caption">
                        {formato.dateTime(new Date(p.respondida_at), { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </span>
                </p>
              ) : (
                <p className="mt-1 text-caption text-muted-foreground">{t('sinRespuesta')}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {respondidas < total && (
        <button
          type="button"
          onClick={verMas}
          disabled={cargando}
          className="mt-3 text-small font-semibold text-primary disabled:opacity-50"
        >
          <span className="link-underline">{t('verMas', { n: total - respondidas })}</span>
        </button>
      )}
    </section>
  );
}
