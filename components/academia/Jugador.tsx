'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { History, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress';
import { Sheet } from '@/components/ui/sheet';
import { Pip } from '@/components/pip/Pip';
import { PasoVista } from '@/components/academia/pasos';
import { Retroalimentacion } from '@/components/academia/Retroalimentacion';
import { Resultados } from '@/components/academia/Resultados';
import { responder, retomarSesion, salirDeSesion, terminarSesion } from '@/lib/api/academia';
import { esFallo, type Respuesta, type Resultado, type Sesion } from '@/lib/academia/modelo';
import { useJugada } from '@/lib/academia/jugada';
import { getDomainColor } from '@/lib/domains';
import { haptic } from '@/lib/utils/haptics';
import { toast } from '@/stores/toast';

const COLOR_TRONCO = '#1FB57A';

/**
 * El jugador de una sesión.
 *
 * A pantalla completa y sin la barra de pestañas: una sesión es una cosa por
 * vez. Salir se sale por la ✕, que pregunta.
 *
 * Pip aparece tres veces en toda la sesión y ni una más: al abrir, si el
 * servidor avisa `recuperacion` (tres seguidas mal), y en los resultados. Una
 * mascota que comenta cada respuesta deja de significar algo al minuto.
 */
export function Jugador({ sesion }: { sesion: Sesion }) {
  const t = useTranslations('arbol');
  const router = useRouter();
  const qc = useQueryClient();
  const quieto = useReducedMotion();
  const { indice, correcciones, avanzar, corregir, sumarPasos, cerrar, pipUsado, usarPip } = useJugada();

  const [respuesta, setRespuesta] = useState<Respuesta | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [preguntandoSalida, setPreguntandoSalida] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [reencoladas, setReencoladas] = useState(0);
  /** El paso en el que Pip apareció por una racha de errores: solo ese. */
  const [pipEn, setPipEn] = useState<string | null>(null);
  const cuerpo = useRef<HTMLDivElement>(null);

  const pasos = sesion.pasos;
  const paso = pasos[indice];
  const correccion = paso ? (correcciones[paso.entrega_id] ?? null) : null;
  const ramaSlug = sesion.unidad?.rama_slug ?? sesion.rama_slug;
  const color = ramaSlug === 'tronco' ? COLOR_TRONCO : getDomainColor(ramaSlug);
  // El total visible incluye los errores que el servidor ya re-encoló y el
  // cliente todavía no bajó: si no, la barra llegaría al final y retrocedería.
  const total = pasos.length + reencoladas;

  useEffect(() => {
    cuerpo.current?.scrollTo({ top: 0 });
  }, [indice]);

  const onCambio = useCallback((r: Respuesta | null) => setRespuesta(r), []);

  async function comprobar() {
    if (!paso || !paso.graduable || respuesta === null || enviando) return;
    setEnviando(true);
    const r = await responder(paso.entrega_id, respuesta);
    setEnviando(false);
    if (esFallo(r)) {
      // `ya_respondida` no es un error de la persona: es una doble llamada.
      if (r.error === 'ya_respondida') return avanzar();
      toast.show({ title: r.mensaje ?? t('errorCuerpo'), variant: 'error' });
      return;
    }
    corregir(paso.entrega_id, r);
    if (r.reencolada) setReencoladas((n) => n + 1);
    // Un golpecito cuando salió bien; el toque más suave cuando no. Nunca una
    // vibración de error: equivocarse no es un fallo del sistema.
    haptic(r.correcto ? 'success' : 'light');
    if (r.recuperacion && pipUsado < 1) {
      usarPip();
      setPipEn(paso.entrega_id);
    }
  }

  async function seguir() {
    if (enviando) return;
    if (indice < pasos.length - 1) {
      setRespuesta(null);
      return avanzar();
    }
    // Último paso local: puede haber re-encolados del lado del servidor.
    setEnviando(true);
    const r = await retomarSesion(sesion.intento_id);
    if (!esFallo(r)) {
      const conocidos = new Set(pasos.map((p) => p.entrega_id));
      const nuevos = r.pasos.filter((p) => !conocidos.has(p.entrega_id) && !p.respondido);
      if (nuevos.length) {
        sumarPasos(nuevos);
        setReencoladas(0);
        setEnviando(false);
        setRespuesta(null);
        return avanzar();
      }
    }
    const fin = await terminarSesion(sesion.intento_id);
    setEnviando(false);
    if (esFallo(fin)) {
      toast.show({ title: fin.mensaje ?? t('errorCuerpo'), variant: 'error' });
      return;
    }
    setReencoladas(0);
    setResultado(fin);
    qc.invalidateQueries({ queryKey: ['academia'] });
    haptic('success');
  }

  async function salir() {
    setPreguntandoSalida(false);
    const r = await salirDeSesion(sesion.intento_id);
    if (!esFallo(r) && r.reembolso) toast.show({ title: t('reembolsada'), variant: 'default' });
    cerrar();
    qc.invalidateQueries({ queryKey: ['academia'] });
    router.replace(sesion.unidad ? `/aprender/u/${sesion.unidad.slug}` : '/aprender');
  }

  function volver() {
    cerrar();
    router.replace(sesion.unidad ? `/aprender/u/${sesion.unidad.slug}` : '/aprender');
  }

  if (resultado) {
    return <Resultados resultado={resultado} sesion={sesion} color={color} onCerrar={volver} />;
  }

  if (sesion.terminado) {
    return (
      <div className="fixed inset-0 z-[45] flex flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <Pip size={80} mood="happy" />
        <p className="max-w-xs text-small text-muted-foreground">{t('sesionYaTerminada')}</p>
        <Button asChild variant="secondary">
          <Link href={sesion.unidad ? `/aprender/u/${sesion.unidad.slug}` : '/aprender'} onClick={() => cerrar()}>
            {t('volver')}
          </Link>
        </Button>
      </div>
    );
  }

  if (!paso) {
    return (
      <div className="fixed inset-0 z-[45] flex flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <Pip size={72} mood="sleepy" />
        <p className="text-small text-muted-foreground">{t('sinPasos')}</p>
        <Button variant="secondary" onClick={volver}>
          {t('volverAlArbol')}
        </Button>
      </div>
    );
  }

  const listo = !paso.graduable || respuesta !== null;
  const esUltimo = indice >= pasos.length - 1 && reencoladas === 0;
  const hechos = indice + (correccion || !paso.graduable ? 1 : 0);
  const titulo = sesion.leccion?.titulo_es ?? t('repasoTituloSesion');

  return (
    <div className="fixed inset-0 z-[45] flex flex-col overflow-hidden bg-background">
      <header className="pt-safe shrink-0 border-b border-hairline px-4 py-3">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
          <button
            type="button"
            onClick={() => setPreguntandoSalida(true)}
            aria-label={t('salirEtiqueta')}
            className="-ml-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-caption font-semibold text-muted-foreground">
              {sesion.unidad ? `${sesion.unidad.titulo_es} · ` : ''}
              {titulo}
            </p>
            <ProgressBar value={total ? hechos / total : 0} height={8} color={color} className="mt-1" />
          </div>
          <span className="tnum shrink-0 text-caption font-semibold text-muted-foreground">
            {Math.min(indice + 1, total)}/{total}
          </span>
        </div>
        <span className="sr-only" aria-live="polite">
          {t('progresoEtiqueta', { i: indice + 1, n: total })}
        </span>
      </header>

      <div ref={cuerpo} className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        <div className="mx-auto w-full max-w-2xl pb-48">
          {indice === 0 && !correccion ? (
            <div className="mb-5 flex items-center gap-3">
              <Pip size={44} mood="happy" />
              <div className="min-w-0">
                <p className="eyebrow" style={{ color }}>
                  {t(`tipoSesion_${sesion.tipo}`)}
                </p>
                <p className="truncate font-display text-h3 font-bold leading-tight">{titulo}</p>
              </div>
            </div>
          ) : null}

          {paso.repaso || paso.requeue ? (
            <p className="mb-3 flex flex-wrap items-center gap-2">
              {paso.repaso ? (
                <span className="inline-flex items-center gap-1.5 rounded-pill bg-brote-aqua/15 px-2.5 py-1 text-caption font-semibold text-brote-aqua">
                  <History className="h-3.5 w-3.5" aria-hidden />
                  {t('chipRepaso', { unidad: paso.repaso.unidad })}
                </span>
              ) : null}
              {paso.requeue ? (
                <span className="inline-flex items-center gap-1.5 rounded-pill bg-brote-sun/15 px-2.5 py-1 text-caption font-semibold text-brote-sun">
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                  {t('chipOtraVez')}
                </span>
              ) : null}
            </p>
          ) : null}

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={paso.entrega_id}
              initial={quieto ? false : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={quieto ? undefined : { opacity: 0, x: -24 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <PasoVista payload={paso.payload} onCambio={onCambio} bloqueado={correccion !== null} correccion={correccion} color={color} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {!correccion ? (
        <footer className="pb-safe shrink-0 border-t border-hairline bg-background px-4 py-3">
          <div className="mx-auto w-full max-w-2xl">
            <Button
              block
              size="lg"
              disabled={!listo}
              loading={enviando}
              onClick={() => (paso.graduable ? void comprobar() : void seguir())}
            >
              {paso.graduable ? t('comprobar') : esUltimo ? t('terminar') : t('entendido')}
            </Button>
          </div>
        </footer>
      ) : null}

      <Retroalimentacion
        correccion={correccion}
        ultima={esUltimo}
        mostrarPip={pipEn !== null && pipEn === paso.entrega_id}
        onSeguir={() => void seguir()}
        cargando={enviando}
      />

      <Sheet
        open={preguntandoSalida}
        onOpenChange={setPreguntandoSalida}
        title={t('salirTitulo')}
        description={Object.keys(correcciones).length === 0 && sesion.savia_gastada > 0 ? t('salirCuerpoReembolso') : t('salirCuerpo')}
      >
        <div className="flex flex-col gap-2 pt-2">
          <Button block variant="secondary" onClick={() => setPreguntandoSalida(false)}>
            {t('salirCancelar')}
          </Button>
          <Button block variant="ghost" onClick={() => void salir()}>
            {t('salirConfirmar')}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
