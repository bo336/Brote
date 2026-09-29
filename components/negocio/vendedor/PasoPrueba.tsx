'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CheckCircle2, Leaf, RotateCcw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { empezarPrueba, responderPrueba } from '@/lib/negocio/vendedor-acciones';
import type { EstadoVendedor, PreguntaPrueba, RespuestaPrueba } from '@/lib/negocio/vendedor';
import { useToastStore } from '@/stores/toast';
import { cn } from '@/lib/utils/cn';

const NECESARIAS = 5;
const MAX_ERRORES = 3;

/**
 * Paso 3: la prueba verde. Cinco respuestas correctas sobre cómo hablar de
 * ambiente sin exagerar — son las mismas reglas que después aplica el Mercado
 * a cada producto, así que la prueba enseña lo que la tienda va a necesitar.
 *
 * Una pregunta por vez. Al responder, se dice si estuvo bien y POR QUÉ, en los
 * dos casos. Con tres errores se vuelve a empezar, con las preguntas en otro
 * orden: no es un examen para dejar a nadie afuera, es para que las reglas
 * queden claras antes de publicar.
 */
export function PasoPrueba({ estado }: { estado: EstadoVendedor }) {
  const t = useTranslations('negocio.vendedor.prueba');
  const router = useRouter();
  const [intento, setIntento] = useState<string | null>(null);
  const [pregunta, setPregunta] = useState<PreguntaPrueba | null>(null);
  const [marcador, setMarcador] = useState({ correctas: 0, incorrectas: 0 });
  const [elegida, setElegida] = useState<string | null>(null);
  const [respuesta, setRespuesta] = useState<RespuestaPrueba | null>(null);
  const [cargando, setCargando] = useState(false);

  if (estado.prueba_verde_at) {
    return (
      <div className="rounded-card border border-border bg-surface p-5 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-brote-green" />
        <p className="mt-2 font-display text-h3 font-bold">{t('yaAprobada')}</p>
      </div>
    );
  }

  async function empezar() {
    setCargando(true);
    const r = await empezarPrueba(estado.id);
    setCargando(false);
    if (!r.ok || !r.intento || !r.pregunta) {
      if (r.aprobada) return router.refresh();
      useToastStore.getState().push({ variant: 'error', title: t(r.error === 'demasiados_intentos' ? 'demasiados' : 'error') });
      return;
    }
    setIntento(r.intento);
    setPregunta(r.pregunta);
    setMarcador({ correctas: r.correctas ?? 0, incorrectas: r.incorrectas ?? 0 });
    setElegida(null);
    setRespuesta(null);
  }

  async function responder(opcion: string) {
    if (!intento || !pregunta || respuesta) return;
    setElegida(opcion);
    setCargando(true);
    const r = await responderPrueba(intento, pregunta.id, opcion);
    setCargando(false);
    if (!('correcta' in r)) {
      setElegida(null);
      useToastStore.getState().push({ variant: 'error', title: t('error') });
      return;
    }
    setRespuesta(r);
    setMarcador({ correctas: r.correctas, incorrectas: r.incorrectas });
  }

  function seguir() {
    if (!respuesta) return;
    if (respuesta.estado === 'aprobada') return router.refresh();
    if (respuesta.estado === 'fallida') {
      setIntento(null);
      setPregunta(null);
      setRespuesta(null);
      setElegida(null);
      return;
    }
    setPregunta(respuesta.siguiente);
    setRespuesta(null);
    setElegida(null);
  }

  // Antes de empezar (o después de un intento fallido).
  if (!pregunta) {
    const reintento = marcador.incorrectas >= MAX_ERRORES;
    return (
      <div className="rounded-card border border-border bg-surface p-5">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brote-green/15">
          {reintento ? <RotateCcw className="h-6 w-6 text-brote-green" /> : <Leaf className="h-6 w-6 text-brote-green" />}
        </span>
        <h2 className="mt-3 font-display text-h3 font-bold">{reintento ? t('otraVez') : t('introTitulo')}</h2>
        <p className="mt-1.5 text-small leading-relaxed text-muted-foreground">
          {reintento ? t('otraVezCuerpo') : t('introCuerpo', { n: NECESARIAS, e: MAX_ERRORES })}
        </p>
        <ul className="mt-3 space-y-1 text-small">
          {(['regla1', 'regla2', 'regla3'] as const).map((r) => (
            <li key={r} className="flex gap-2">
              <span aria-hidden className="text-brote-green">·</span>
              {t(r)}
            </li>
          ))}
        </ul>
        <Button onClick={empezar} loading={cargando} block size="lg" className="mt-5 rounded-pill">
          {reintento ? t('reintentar') : t('empezar')}
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3" aria-live="polite">
        <div className="flex gap-1.5" aria-label={t('correctasDe', { n: marcador.correctas, total: NECESARIAS })}>
          {Array.from({ length: NECESARIAS }, (_, i) => (
            <span key={i} className={cn('h-2.5 w-7 rounded-full transition-colors duration-300', i < marcador.correctas ? 'bg-brote-green' : 'bg-border')} />
          ))}
        </div>
        <span className="text-caption text-muted-foreground tnum">{t('errores', { n: marcador.incorrectas, max: MAX_ERRORES })}</span>
      </div>

      <div className="mt-5 rounded-card border border-border bg-surface p-5">
        <p className="font-display text-h3 font-bold leading-snug">{pregunta.enunciado}</p>
        <ul className="mt-4 space-y-2">
          {pregunta.opciones.map((o) => {
            const esElegida = elegida === o.id;
            const esCorrecta = respuesta?.correcta_id === o.id;
            return (
              <li key={o.id}>
                <button
                  type="button"
                  disabled={!!respuesta || cargando}
                  onClick={() => responder(o.id)}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-button border p-3.5 text-left text-small transition-colors duration-150',
                    !respuesta && 'border-border bg-background hover:border-primary/60 hover:bg-surface-2',
                    !respuesta && esElegida && 'border-primary',
                    respuesta && esCorrecta && 'border-brote-green bg-brote-green/10',
                    respuesta && esElegida && !esCorrecta && 'border-brote-coral bg-brote-coral/10',
                    respuesta && !esElegida && !esCorrecta && 'border-border opacity-60',
                  )}
                >
                  <span className="min-w-0 flex-1">{o.texto}</span>
                  {respuesta && esCorrecta && <CheckCircle2 className="h-5 w-5 shrink-0 text-brote-green" />}
                  {respuesta && esElegida && !esCorrecta && <XCircle className="h-5 w-5 shrink-0 text-brote-coral" />}
                </button>
              </li>
            );
          })}
        </ul>

        {respuesta && (
          <div className={cn('mt-4 rounded-button p-3.5 text-small leading-relaxed', respuesta.correcta ? 'bg-brote-green/10' : 'bg-brote-coral/10')}>
            <p className="font-semibold">{respuesta.correcta ? t('bien') : t('mal')}</p>
            <p className="mt-1">{respuesta.explicacion}</p>
          </div>
        )}
      </div>

      {respuesta && (
        <Button onClick={seguir} block size="lg" className="mt-4 rounded-pill">
          {respuesta.estado === 'aprobada' ? t('aprobadaSeguir') : respuesta.estado === 'fallida' ? t('fallidaSeguir') : t('siguiente')}
        </Button>
      )}
      {respuesta?.estado === 'aprobada' && <p className="mt-3 text-center text-small font-semibold text-brote-green">{t('aprobada')}</p>}
    </div>
  );
}
