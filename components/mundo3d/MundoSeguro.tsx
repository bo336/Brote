'use client';

import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Feather, RotateCcw } from 'lucide-react';

import { LoadingState } from '@/components/mundo3d/hud/LoadingState';
import { defaultPosterFor } from '@/components/mundo3d/poster/defaultPoster';
import { registrarFallo } from '@/lib/world/arranque';
import { reportarFalloMundo } from './reportar';
import { useSettings } from '@/stores/settings';

type Motivo = 'webgl' | 'error' | 'memoria';

/** Can this browser draw the world at all? `three` r169 needs WebGL 2. */
function tieneWebGL2(): boolean {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2');
    if (!gl) return false;
    // Give the probe context back right away: low-end Android caps contexts
    // and would drop the world's own one to make room.
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * The guard around the one `<Canvas>` in the app.
 *
 * Before: a phone without WebGL 2 (iOS before 15, budget Androids whose GPU is
 * blocklisted) threw inside the renderer, nothing caught it, and the player got
 * the app's generic "algo no salió" page — or, if the tab ran out of memory,
 * a reload loop. Now:
 *
 *   · WebGL 2 is checked before anything heavy loads;
 *   · any error while the world is running lands here, is counted (so the next
 *     opening starts light, `lib/world/arranque.ts`) and reported;
 *   · the screen says what happened in one line, shows their island's picture,
 *     and offers the light mode, a retry and the way back.
 */
export function MundoSeguro({
  tier,
  snapshotUrl,
  children,
}: {
  tier: number;
  snapshotUrl?: string | null;
  children: ReactNode;
}) {
  const [soporte, setSoporte] = useState<'probando' | 'si' | 'no'>('probando');
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const ok = tieneWebGL2();
    setSoporte(ok ? 'si' : 'no');
    if (!ok) void reportarFalloMundo('sin_webgl2', 'WebGL 2 no disponible');
  }, []);

  if (soporte === 'probando') return <LoadingState />;
  if (soporte === 'no') return <MundoNoAbre motivo="webgl" tier={tier} snapshotUrl={snapshotUrl} />;

  return (
    <Guardia
      key={intento}
      fallback={(motivo) => (
        <MundoNoAbre motivo={motivo} tier={tier} snapshotUrl={snapshotUrl} onRetry={() => setIntento((n) => n + 1)} />
      )}
    >
      {children}
    </Guardia>
  );
}

class Guardia extends Component<
  { children: ReactNode; fallback: (m: Motivo) => ReactNode },
  { motivo: Motivo | null }
> {
  override state: { motivo: Motivo | null } = { motivo: null };

  static getDerivedStateFromError(error: unknown): { motivo: Motivo } {
    const msg = error instanceof Error ? error.message : String(error);
    return { motivo: /webgl|context/i.test(msg) ? 'webgl' : 'error' };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo) {
    const msg = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    registrarFallo(storage(), Date.now());
    void reportarFalloMundo('render', msg, { stack: (info.componentStack ?? '').slice(0, 600) });
  }

  override render() {
    return this.state.motivo ? this.props.fallback(this.state.motivo) : this.props.children;
  }
}

export function MundoNoAbre({
  motivo,
  tier,
  snapshotUrl,
  onRetry,
}: {
  motivo: Motivo;
  tier: number;
  snapshotUrl?: string | null;
  onRetry?: () => void;
}) {
  const t = useTranslations('mundo.noAbre');
  const setDetailMode = useSettings((s) => s.setDetailMode);
  const src = snapshotUrl || defaultPosterFor(Math.min(11, Math.max(1, tier)));

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-brote-ink text-brote-cream">
      <div className="relative h-[42dvh] w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="h-full w-full object-cover opacity-80" />
        <div aria-hidden className="absolute inset-0 bg-ink-scrim" />
      </div>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-3 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6">
        <h1 className="font-display text-h1 font-bold leading-tight">{t(`titulo_${motivo}`)}</h1>
        <p className="text-small leading-relaxed text-brote-cream/75">{t(`cuerpo_${motivo}`)}</p>
        <div className="mt-auto flex flex-col gap-2.5">
          {motivo !== 'webgl' && (
            <button
              type="button"
              onClick={() => {
                // T0 by hand: the floor, no lens, no promotion.
                setDetailMode('low');
                onRetry?.();
              }}
              className="press inline-flex h-12 items-center justify-center gap-2 rounded-pill bg-brote-green px-5 text-small font-bold text-brote-ink"
            >
              <Feather className="h-4 w-4" aria-hidden />
              {t('liviano')}
            </button>
          )}
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="press inline-flex h-12 items-center justify-center gap-2 rounded-pill border border-white/20 px-5 text-small font-semibold"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              {t('reintentar')}
            </button>
          )}
          <Link
            href="/"
            className="press inline-flex h-12 items-center justify-center gap-2 rounded-pill px-5 text-small font-medium text-brote-cream/80 hover:text-brote-cream"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t('volver')}
          </Link>
        </div>
      </div>
    </div>
  );
}
