'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress';
import { Sheet } from '@/components/ui/sheet';
import { Pip } from '@/components/pip/Pip';
import { Ejercicio } from '@/components/academia/ejercicios';
import { Retroalimentacion } from '@/components/academia/Retroalimentacion';
import { Resultados } from '@/components/academia/Resultados';
import { abandonarSesion, fetchPendientes, responder, terminarSesion } from '@/lib/api/academia';
import { esFallo, type RespuestaEnviada, type ResultadoSesion, type Sesion } from '@/lib/academia/types';
import { useJugada } from '@/lib/academia/sesion-store';
import { haptic } from '@/lib/utils/haptics';
import { toast } from '@/stores/toast';

/**
 * El jugador de una hoja.
 *
 * A pantalla completa y sin la barra de pestañas: una sesión es una cosa por
 * vez, y dejar la navegación a la vista invita a irse justo cuando conviene
 * quedarse. Salir se sale por la ✕, que pregunta.
 *
 * TRES APARICIONES DE PIP EN TODA LA SESIÓN, ni una más (15-ui-motion.md §4):
 * al abrir, cuando el servidor avisa `recuperacion` (tres seguidas mal), y en
 * los resultados. Una mascota que comenta cada respuesta deja de significar
 * algo a los cuarenta segundos.
 */
export function Jugador({ sesion }: { sesion: Sesion }) {
  const t = useTranslations('academia');
  const router = useRouter();
  const qc = useQueryClient();

  const { indice, correcciones, avanzar, corregir, agregarPasos, cerrar, pipUsado, usarPip } = useJugada();

  const [respuesta, setRespuesta] = useState<RespuestaEnviada | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [preguntandoSalida, setPreguntandoSalida] = useState(false);
  const [resultado, setResultado] = useState<ResultadoSesion | null>(null);
  const [pipInicial, setPipInicial] = useState(true);
  const cuerpo = useRef<HTMLDivElement>(null);

  const pasos = sesion.pasos;
  const paso = pasos[indice];
  const correccion = paso ? (correcciones[paso.orden] ?? null) : null;
  const total = Math.max(sesion.total, pasos.length);

  // Cada paso empieza arriba de todo: nadie quiere leer el enunciado nuevo
  // desde la mitad del scroll del anterior.
  //
  // Acá NO se hace `setRespuesta(null)`, y no es un olvido. Los efectos de los
  // hijos corren ANTES que los del padre, así que ese reset pisaría el valor
  // inicial que acaba de reportar el renderer nuevo — y hay dos que reportan
  // uno válido apenas montan: `estimacion_numerica` (el rango arranca en el
  // medio) y `detectar_greenwashing` (no marcar nada es una respuesta, quiere
  // decir "acá no hay nada turbio"). El `key={paso.orden}` ya remonta el
  // renderer, así que su estado arranca limpio solo.
  useEffect(() => {
    cuerpo.current?.scrollTo({ top: 0 });
  }, [indice]);

  // El saludo de Pip dura lo que tarda alguien en mirar la primera consigna.
  useEffect(() => {
    const id = setTimeout(() => setPipInicial(false), 2600);
    return () => clearTimeout(id);
  }, []);

  const onCambio = useCallback((r: RespuestaEnviada | null) => setRespuesta(r), []);

  async function comprobar() {
    if (!paso || !paso.entrega_id || respuesta === null || enviando) return;
    setEnviando(true);
    const r = await responder(paso.entrega_id, respuesta);
    setEnviando(false);

    if (esFallo(r)) {
      // `ya_respondida` no es un error de la persona: es una doble llamada o
      // una vuelta atrás del navegador. Se avanza y listo.
      if (r.error === 'ya_respondida') return avanzar();
      toast.show({ title: r.mensaje ?? r.error, variant: 'error' });
      return;
    }

    corregir(paso.orden, r);
    // Verde y un golpecito corto cuando salió bien; coral y el toque más suave
    // que existe cuando no. Nunca una vibración de error: no falló nada.
    haptic(r.correcto ? 'success' : 'light');
    if (r.recuperacion && pipUsado < 1) usarPip();
  }

  async function seguir() {
    if (enviando) return;
    if (indice < pasos.length - 1) return avanzar();

    // Último paso local. Antes de cerrar hay que ver si el servidor sumó
    // alguno: un error se re-encola UNA vez, y esa entrega nueva existe del
    // lado del servidor aunque el cliente no la tenga.
    setEnviando(true);
    const pend = await fetchPendientes(sesion.sesion_id);
    if (!esFallo(pend) && pend.pasos.length > 0) {
      agregarPasos(pend.pasos);
      setEnviando(false);
      return avanzar();
    }

    const fin = await terminarSesion(sesion.sesion_id);
    setEnviando(false);
    if (esFallo(fin)) {
      toast.show({ title: fin.mensaje ?? fin.error, variant: 'error' });
      return;
    }
    setResultado(fin);
    qc.invalidateQueries({ queryKey: ['academia'] });
    haptic('success');
  }

  async function salir() {
    setPreguntandoSalida(false);
    const r = await abandonarSesion(sesion.sesion_id);
    if (!esFallo(r) && r.reembolso) toast.show({ title: t('reembolsada'), variant: 'default' });
    cerrar();
    qc.invalidateQueries({ queryKey: ['academia'] });
    router.replace('/aprender');
  }

  if (resultado) {
    return (
      <Resultados
        resultado={resultado}
        sesionId={sesion.sesion_id}
        ramaSlug={sesion.rama_slug}
        onCerrar={() => {
          cerrar();
          router.replace('/aprender');
        }}
      />
    );
  }

  if (!paso) {
    return (
      <div className="fixed inset-0 z-[45] flex flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <Pip size={72} mood="sleepy" />
        <p className="text-small text-muted-foreground">{t('sinPasos')}</p>
        <Button variant="secondary" onClick={salir}>
          {t('volverAlBosque')}
        </Button>
      </div>
    );
  }

  const listo = paso.entrega_id === null || respuesta !== null;
  const esUltimo = indice >= pasos.length - 1;

  return (
    <div className="fixed inset-0 z-[45] flex flex-col overflow-hidden bg-background">
      <header className="pt-safe shrink-0 border-b border-hairline px-4 py-3">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
          <button
            type="button"
            onClick={() => setPreguntandoSalida(true)}
            aria-label={t('salirEtiqueta')}
            className="-ml-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
          <div className="min-w-0 flex-1">
            <ProgressBar value={(indice + (correccion ? 1 : 0)) / total} height={8} />
          </div>
          <span className="tnum shrink-0 text-caption text-muted-foreground">
            {t('pasoDe', { i: indice + 1, n: total })}
          </span>
        </div>
        <span className="sr-only" aria-live="polite">
          {t('progresoEtiqueta', { i: indice + 1, n: total })}
        </span>
      </header>

      <div ref={cuerpo} className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        <div className="mx-auto w-full max-w-2xl pb-40">
          {pipInicial && indice === 0 ? (
            <div className="mb-4 flex items-center gap-2.5">
              <Pip size={40} mood="happy" />
              <p className="text-small text-muted-foreground">{sesion.hoja?.titulo_es ?? t('riegoTitulo')}</p>
            </div>
          ) : null}

          <Ejercicio
            key={paso.orden}
            payload={paso.payload}
            onCambio={onCambio}
            bloqueado={correccion !== null}
            correccion={correccion}
          />
        </div>
      </div>

      {/* Mientras no hay corrección, el pie es el botón. Cuando la hay, el panel
          de retroalimentación sube y se lo come — el botón vive adentro. */}
      {!correccion ? (
        <footer className="pb-safe shrink-0 border-t border-hairline px-4 py-3">
          <div className="mx-auto w-full max-w-2xl">
            <Button
              block
              disabled={!listo || enviando}
              onClick={() => (paso.entrega_id === null ? avanzar() : comprobar())}
            >
              {enviando ? t('cargandoSesion') : paso.entrega_id === null ? t('entendido') : t('comprobar')}
            </Button>
          </div>
        </footer>
      ) : null}

      <Retroalimentacion
        correccion={correccion}
        ultima={esUltimo}
        mostrarPip={correccion?.recuperacion === true}
        onSeguir={seguir}
        cargando={enviando}
      />

      <Sheet
        open={preguntandoSalida}
        onOpenChange={setPreguntandoSalida}
        title={t('salirTitulo')}
        description={Object.keys(correcciones).length === 0 ? t('salirCuerpoReembolso') : t('salirCuerpo')}
      >
        <div className="flex flex-col gap-2 pt-2">
          <Button block variant="secondary" onClick={() => setPreguntandoSalida(false)}>
            {t('salirCancelar')}
          </Button>
          <Button block variant="ghost" onClick={salir}>
            {t('salirConfirmar')}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
