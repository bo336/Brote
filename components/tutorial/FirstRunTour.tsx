'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  GraduationCap,
  Home,
  MessagesSquare,
  Plus,
  Sparkles,
  Sprout,
  Store,
  TreePine,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pip } from '@/components/pip/Pip';
import { SOLIDO_LUGAR } from '@/components/nav/nav-items';
import { useSession } from '@/stores/session';
import { haptic } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils/cn';
import type { Lugar } from '@/lib/lugares';

/**
 * First-run tour (F15.18), rehecho para la reestructura (docs/REESTRUCTURA.md).
 *
 * Presenta Brote como lo que ahora es: un pueblo de lugares, cada uno con su
 * color, y el botón del centro para sumar desde cualquier lado. Se puede
 * saltear desde la primera tarjeta. La marca es por dispositivo. Subió a v2:
 * quien ya había visto el tour viejo lo ve una vez más, porque la barra y los
 * lugares cambiaron, y arranca con "Brote se renovó".
 */
const KEY = 'brote.tour.v2';
const KEY_VIEJA = 'brote.tour.v1';

interface Slide {
  lugares: { lugar: Lugar; icon: LucideIcon }[];
  title: string;
  body: string;
}

function armarSlides(tipo: 'kid' | 'teen' | 'adult' | undefined, volvio: boolean): Slide[] {
  const esChico = tipo === 'kid';
  const slides: Slide[] = [
    {
      lugares: [{ lugar: 'hoy', icon: Home }],
      title: 'Hoy: tu día',
      body: 'Tus acciones del día, tu liga de la semana en vivo y tu impacto real, dicho en cosas de todos los días.',
    },
    {
      lugares: [{ lugar: 'acciones', icon: Plus }],
      title: 'Sumá desde cualquier lado',
      body: 'El botón del centro: marcá lo que hiciste del día, o cargá otra cosa aunque no esté en la lista. Todo suma a tu semana.',
    },
    {
      lugares: [{ lugar: 'liga', icon: Trophy }],
      title: 'La Liga',
      body: 'Cada semana competís en tu grupo. Si sumás lo que pide tu liga, subís; si no llegás, bajás. Cada punto cuenta.',
    },
    {
      lugares: [{ lugar: 'plaza', icon: MessagesSquare }],
      title: 'La Plaza',
      body: esChico
        ? 'Noticias del ambiente elegidas para chicos, todos los días.'
        : 'Noticias del ambiente y lo que hace la gente: contá lo tuyo, comentá y seguí a quien te inspira.',
    },
    {
      lugares: [
        { lugar: 'academia', icon: GraduationCap },
        { lugar: 'mundo', icon: TreePine },
        { lugar: 'proyectos', icon: Users },
        ...(esChico ? [] : [{ lugar: 'mercado' as const, icon: Store }]),
      ],
      title: 'Explorá el pueblo',
      body: esChico
        ? 'La Academia para aprender, tu isla que crece con lo que hacés y los proyectos para hacer cosas en grupo.'
        : 'La Academia para aprender, tu isla que crece con lo que hacés, los proyectos en grupo y el Mercado para comprar mejor.',
    },
    {
      lugares: [{ lugar: 'impacto', icon: Sprout }],
      title: 'Tu impacto, en serio',
      body: 'Sólo lo mueven acciones medidas, y te lo contamos así: "alcanza para ducharte todos los días durante 3 semanas".',
    },
  ];
  if (volvio) {
    slides.unshift({
      lugares: [{ lugar: 'explorar', icon: Compass }],
      title: 'Brote se renovó',
      body: 'Cada lugar tiene su color, el centro de la barra ahora es Sumar, y la Liga y Explorar están a un toque. Te mostramos en un minuto.',
    });
  }
  return slides;
}

export function FirstRunTour({ force = false, onClose }: { force?: boolean; onClose?: () => void }) {
  const profile = useSession((s) => s.profile);
  const [open, setOpen] = useState(false);
  const [volvio, setVolvio] = useState(false);
  const [i, setI] = useState(0);
  const slides = useMemo(() => armarSlides(profile?.accountType, volvio), [profile?.accountType, volvio]);

  useEffect(() => {
    if (force) {
      setOpen(true);
      setI(0);
      return;
    }
    if (!profile) return;
    try {
      if (localStorage.getItem(KEY)) return;
      setVolvio(!!localStorage.getItem(KEY_VIEJA));
    } catch {
      return; // storage blocked: never risk showing it on every load
    }
    // Let the home screen paint before interrupting.
    const t = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(t);
  }, [profile, force]);

  function close() {
    try {
      localStorage.setItem(KEY, new Date().toISOString());
    } catch {
      /* nothing to do */
    }
    setOpen(false);
    onClose?.();
  }

  if (!open) return null;
  const slide = slides[Math.min(i, slides.length - 1)]!;
  const last = i >= slides.length - 1;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-brote-ink/60 p-3 backdrop-blur-sm sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-titulo"
        className="w-full max-w-sm rounded-sheet border border-border bg-surface p-5 shadow-soft-lg"
      >
        <div className="mb-4 flex items-start justify-between">
          <span className="flex items-center" aria-hidden>
            {slide.lugares.map(({ lugar, icon: Icon }, n) => (
              <span
                key={lugar}
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-full shadow-soft ring-[3px] ring-surface',
                  SOLIDO_LUGAR[lugar],
                  n > 0 && '-ml-2.5',
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={2.2} />
              </span>
            ))}
          </span>
          {/* Escapable from the very first card. */}
          <button
            onClick={close}
            className="rounded-full px-2 py-1 text-caption font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Saltear
          </button>
        </div>

        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 id="tour-titulo" className="font-display text-h2 font-bold leading-tight">
              {slide.title}
            </h2>
            <p className="mt-1.5 text-small leading-relaxed text-muted-foreground">{slide.body}</p>
          </div>
          <Pip size={48} mood={last ? 'celebrating' : 'happy'} pipStyle={profile?.pipStyle} />
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5" aria-hidden>
          {slides.map((_, n) => (
            <span key={n} className={cn('h-1.5 rounded-full transition-all duration-200', n === i ? 'w-5 bg-foreground' : 'w-1.5 bg-border')} />
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          {i > 0 && (
            <Button variant="secondary" onClick={() => setI((n) => n - 1)} aria-label="Anterior">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => {
              haptic('light');
              if (last) close();
              else setI((n) => n + 1);
            }}
          >
            {last ? (
              <>
                <Sparkles className="h-4 w-4" /> ¡Arranquemos!
              </>
            ) : (
              <>
                Seguir <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Lets settings offer "ver el tutorial de nuevo". */
export function resetTour() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to do */
  }
}
