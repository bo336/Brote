'use client';

import { useEffect, useState } from 'react';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pip } from '@/components/pip/Pip';
import { useSession } from '@/stores/session';
import { haptic } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils/cn';

/**
 * First-run tour (F15.18).
 *
 * Explains what the main pieces are for, once, and is skippable from the very
 * first card — a tutorial you cannot escape is worse than no tutorial. The
 * "seen" flag is per device rather than per account on purpose: it is a UI
 * orientation aid, and re-showing it on a new device is helpful rather than
 * annoying. It can also be replayed from settings.
 */
const KEY = 'brote.tour.v1';

interface Slide {
  emoji: string;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    emoji: '🌱',
    title: 'Tu mundo crece con lo que hacés',
    body: 'Cada acción que completás suma puntos y hace crecer tu isla. Cuando se llena, se abre un bioma nuevo.',
  },
  {
    emoji: '✅',
    title: 'El set de hoy',
    body: 'Todos los días te proponemos 5 acciones distintas, elegidas para vos. No se repiten por semanas, así que siempre hay algo nuevo.',
  },
  {
    emoji: '🔁',
    title: 'Tu rutina',
    body: 'Algunas acciones se pueden fijar como costumbre diaria —la ducha corta, ir en bici— y cada una lleva su propia racha.',
  },
  {
    emoji: '🏆',
    title: 'Ligas y competencias',
    body: 'Competís cada semana con gente de tu nivel. Si te va bien subís de liga; también podés crear competencias privadas con amigos.',
  },
  {
    emoji: '📰',
    title: 'Novedades y comentarios',
    body: 'En Explorar hay noticias ambientales en español, y podés comentarlas y opinar con el resto.',
  },
  {
    emoji: '📘',
    title: 'Aprendé',
    body: 'Lecciones cortas para entender de verdad lo que estás haciendo. Suman puntos la primera vez que las aprobás.',
  },
];

export function FirstRunTour({ force = false, onClose }: { force?: boolean; onClose?: () => void }) {
  const profile = useSession((s) => s.profile);
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);

  useEffect(() => {
    if (force) {
      setOpen(true);
      setI(0);
      return;
    }
    if (!profile) return;
    try {
      if (localStorage.getItem(KEY)) return;
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
  const slide = SLIDES[i]!;
  const last = i === SLIDES.length - 1;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-brote-ink/60 p-3 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-sm rounded-sheet border border-border bg-surface p-5 shadow-soft-lg">
        <div className="mb-3 flex items-start justify-between">
          <span className="text-3xl leading-none" aria-hidden>
            {slide.emoji}
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
          <Pip size={52} mood="happy" pipStyle={profile?.pipStyle} />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-h2 font-bold leading-tight">{slide.title}</h2>
            <p className="mt-1.5 text-small leading-relaxed text-muted-foreground">{slide.body}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5" aria-hidden>
          {SLIDES.map((_, n) => (
            <span
              key={n}
              className={cn(
                'h-1.5 rounded-full transition-all',
                n === i ? 'w-5 bg-primary' : 'w-1.5 bg-border',
              )}
            />
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
            {last ? '¡Arranquemos!' : 'Seguir'} {!last && <ArrowRight className="h-4 w-4" />}
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
