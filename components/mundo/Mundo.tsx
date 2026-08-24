'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Sun,
  Moon,
  Share2,
  Droplet,
  Check,
  Loader2,
  Maximize2,
  Minimize2,
  Sprout,
} from 'lucide-react';
import { MundoHeroFallback } from './MundoHeroFallback';
import { Pip } from '@/components/pip/Pip';
import { useSettings, shouldRender3D } from '@/stores/settings';
import { useSession } from '@/stores/session';
import { isNight, dayProgress } from '@/lib/utils/dates';
import { computeMundoState, biomeFor, type MundoState } from '@/lib/mundo';
import { fetchEquippedDecorations } from '@/lib/api/tienda';
import { createClient } from '@/lib/supabase/client';
import { useTodayCompletions, useCompleteActivity } from '@/hooks/use-daily-set';
import { haptic } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils/cn';

// Lazily import the 3D canvas so three.js never blocks first paint (§9.1).
const MundoCanvas = dynamic(() => import('./MundoCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <Pip size={72} mood="sleepy" />
    </div>
  ),
});

interface MundoProps {
  mundo?: MundoState | null;
  height?: number;
  className?: string;
  /** Hide the biome/growth overlay (e.g. tiny embeds). */
  hideOverlay?: boolean;
  /** Enable the in-world "Regá tu mundo" daily action (default on). */
  interactive?: boolean;
}

/** Fetch the id of the in-world watering daily action once. */
async function fetchCuidaMundoId(): Promise<string | null> {
  const { data } = await createClient().from('activities').select('id').eq('slug', 'cuida-tu-mundo').maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

/**
 * "Tu Mundo" — the professional-grade 3D world with the Mundo Infinito overlay
 * (biome name, world number, growth) and the in-world watering interaction.
 * Falls back to a flat illustration on weak devices / reduced motion.
 */
export function Mundo({ mundo, height = 300, className, hideOverlay = false, interactive = true }: MundoProps) {
  const detailMode = useSettings((s) => s.detailMode);
  const profile = useSession((s) => s.profile);
  const setProfile = useSession((s) => s.setProfile);
  const [mounted, setMounted] = useState(false);
  const [night, setNight] = useState(false);
  const [dayT, setDayT] = useState(0.5);
  const [watering, setWatering] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  /** Preview override: users who open the app at night can still see the day look. */
  const [timeMode, setTimeMode] = useState<'auto' | 'day' | 'night'>('auto');
  const [sharing, setSharing] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const wateringTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const careBusy = useRef(false);

  const cuidaId = useQuery({ queryKey: ['cuida-mundo-id'], queryFn: fetchCuidaMundoId, staleTime: Infinity, enabled: interactive });
  // Decoraciones compradas (F11.2). Sólo en TU mundo: cuando visitás el de otra
  // persona el canvas es no interactivo, y mostrarle tus cosas en la isla ajena
  // sería mentira.
  const decorations = useQuery({
    queryKey: ['mundo-decorations'],
    queryFn: fetchEquippedDecorations,
    staleTime: 60_000,
    enabled: interactive && !!profile,
  });
  const todayDone = useTodayCompletions();
  const complete = useCompleteActivity();
  const alreadyWatered = !!cuidaId.data && !!todayDone.data?.has(cuidaId.data);

  useEffect(() => {
    setMounted(true);
    const tick = () => {
      setNight(isNight());
      setDayT(dayProgress());
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => {
      clearInterval(id);
      if (wateringTimer.current) clearTimeout(wateringTimer.current);
    };
  }, []);

  function onWater() {
    if (!cuidaId.data || alreadyWatered || complete.isPending) return;
    haptic('medium');
    setWatering(true);
    wateringTimer.current = setTimeout(() => setWatering(false), 2600);
    complete.mutate({ activityId: cuidaId.data });
  }

  // Care touch (tap a tree/bush): server grants up to +5 slow growth per day,
  // no points. Fire-and-forget; hearts always show so it always feels alive.
  async function onCare() {
    if (!profile || careBusy.current) return;
    careBusy.current = true;
    haptic('light');
    try {
      const { data } = await createClient().rpc('care_world');
      const res = data as { granted?: boolean; mundo?: MundoState } | null;
      if (res?.granted && res.mundo) {
        const p = useSession.getState().profile;
        if (p) setProfile({ ...p, mundoState: { ...p.mundoState, ...res.mundo } as MundoState });
      }
    } catch {
      /* silent — caring is best-effort */
    } finally {
      setTimeout(() => {
        careBusy.current = false;
      }, 600);
    }
  }

  const state = mundo ?? computeMundoState({ totalXp: 0, currentStreak: 0, completionsCount: 0 });
  const want3D = mounted && shouldRender3D(detailMode);
  const effNight = timeMode === 'auto' ? night : timeMode === 'night';

  /** Capture the live world + compose a branded share card (F10.2). */
  async function shareWorld() {
    if (sharing) return;
    const canvas = wrapRef.current?.querySelector('canvas');
    if (!canvas) return;
    setSharing(true);
    haptic('medium');
    try {
      const W = 1080;
      const H = 1350;
      const card = document.createElement('canvas');
      card.width = W;
      card.height = H;
      const ctx = card.getContext('2d')!;
      // World shot (cover-fit into the top ~76%).
      const shotH = Math.round(H * 0.76);
      const scale = Math.max(W / canvas.width, shotH / canvas.height);
      const dw = canvas.width * scale;
      const dh = canvas.height * scale;
      ctx.fillStyle = '#0C1A13';
      ctx.fillRect(0, 0, W, H);
      ctx.drawImage(canvas, (W - dw) / 2, (shotH - dh) / 2, dw, dh);
      // Bottom brand band.
      const grad = ctx.createLinearGradient(0, shotH - 140, 0, H);
      grad.addColorStop(0, 'rgba(12,26,19,0)');
      grad.addColorStop(0.35, 'rgba(12,26,19,0.96)');
      grad.addColorStop(1, '#0C1A13');
      ctx.fillStyle = grad;
      ctx.fillRect(0, shotH - 140, W, H - shotH + 140);
      const b = biomeFor(state.worldIndex ?? 1);
      ctx.fillStyle = '#F7F5EF';
      ctx.font = 'bold 64px system-ui, sans-serif';
      ctx.fillText(`Mundo ${state.worldIndex ?? 1} · ${b.name}`, 64, shotH + 60);
      ctx.fillStyle = '#9FB0A6';
      ctx.font = '44px system-ui, sans-serif';
      const growthTxt = `🌱 ${state.worldGrowth ?? 0}/${state.worldGoal ?? 40}`;
      const streakTxt = profile?.currentStreak ? ` · 🔥 ${profile.currentStreak} días` : '';
      ctx.fillText(growthTxt + streakTxt, 64, shotH + 130);
      ctx.fillStyle = '#1FB57A';
      ctx.font = 'bold 48px system-ui, sans-serif';
      ctx.fillText('🌱 Brote', 64, H - 72);
      ctx.fillStyle = '#9FB0A6';
      ctx.font = '36px system-ui, sans-serif';
      ctx.fillText('Hacé crecer tu mundo · brote-ft7m.vercel.app', 64, H - 24);

      const blob: Blob | null = await new Promise((res) => card.toBlob(res, 'image/png'));
      if (!blob) return;
      const file = new File([blob], 'mi-mundo-brote.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Mi mundo en Brote 🌱' });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mi-mundo-brote.png';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      /* user cancelled share — fine */
    } finally {
      setSharing(false);
    }
  }

  if (!want3D) {
    return <MundoHeroFallback mundo={mundo} height={height} className={className} />;
  }

  const golden = state.palette === 'golden';
  const biome = biomeFor(state.worldIndex ?? 1);
  const sky = effNight
    ? 'linear-gradient(180deg, #0b1f3a 0%, #16261D 75%)'
    : golden
      ? 'linear-gradient(180deg, #FFE3A8 0%, #FFC36B 60%, #BfE6C8 100%)'
      : `linear-gradient(180deg, ${biome.skyTop} 0%, ${biome.skyHorizon} 62%, ${biome.skyHorizon} 100%)`;

  const growth = state.worldGrowth ?? 0;
  const goal = state.worldGoal ?? 40;
  const pct = Math.min(100, Math.round((growth / Math.max(1, goal)) * 100));
  const showWater = interactive && !!profile && !!cuidaId.data;

  return (
    <div
      ref={wrapRef}
      className={cn(
        'relative w-full overflow-hidden border border-border',
        fullscreen ? 'fixed inset-0 z-[80] rounded-none' : 'rounded-card',
        className,
      )}
      style={{ height: fullscreen ? '100dvh' : height, background: sky }}
    >
      {effNight && (
        <div className="pointer-events-none absolute inset-0 opacity-70">
          {Array.from({ length: 16 }).map((_, i) => (
            <span
              key={i}
              className="absolute h-0.5 w-0.5 rounded-full bg-white"
              style={{ top: `${(i * 37) % 55}%`, left: `${(i * 53) % 100}%` }}
            />
          ))}
        </div>
      )}

      <MundoCanvas
        mundo={state}
        night={effNight}
        dayT={effNight ? dayT : 0.35}
        watering={watering}
        decorations={decorations.data ?? []}
        onCare={interactive && profile ? onCare : undefined}
      />

      {/* Depth of field and vignette are done for real in the 3D post stack. */}

      {!hideOverlay && (
        <>
          {/* Biome chip */}
          <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-pill bg-black/25 px-3 py-1 backdrop-blur-sm">
            <span className="text-caption font-bold text-white/95">Mundo {state.worldIndex ?? 1}</span>
            <span className="text-caption text-white/70">· {biome.name}</span>
          </div>

          {/* Right-side control column: fullscreen / day-night preview / share */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              haptic('light');
              setFullscreen((f) => !f);
            }}
            aria-label={fullscreen ? 'Salir de pantalla completa' : 'Ver en pantalla completa'}
            className="absolute bottom-16 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white/90 backdrop-blur-sm transition-transform hover:scale-105"
          >
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              haptic('light');
              setTimeMode((m) => (m === 'auto' ? (effNight ? 'day' : 'night') : m === 'day' ? 'night' : 'day'));
            }}
            aria-label="Cambiar día y noche"
            className="absolute bottom-[6.9rem] right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white/90 backdrop-blur-sm transition-transform hover:scale-105"
          >
            {effNight ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {interactive && profile && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void shareWorld();
              }}
              disabled={sharing}
              aria-label="Compartir tu mundo"
              className="absolute bottom-[9.7rem] right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white/90 backdrop-blur-sm transition-transform hover:scale-105 disabled:opacity-50"
            >
              {sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
            </button>
          )}

          {/* Regá tu mundo — the in-world daily care action */}
          {showWater && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onWater();
              }}
              disabled={alreadyWatered || complete.isPending}
              aria-label={alreadyWatered ? 'Tu mundo ya está regado hoy' : 'Regá tu mundo (+50 pts)'}
              className={cn(
                'absolute right-3 top-3 flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-caption font-bold backdrop-blur-sm transition-all',
                alreadyWatered
                  ? 'bg-black/25 text-white/60'
                  : 'bg-white/90 text-brote-ink shadow-soft-lg hover:scale-105 active:scale-95',
              )}
            >
              {alreadyWatered ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Regado hoy
                </>
              ) : watering ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Regando…
                </>
              ) : (
                <>
                  <Droplet className="h-3.5 w-3.5" /> Regar +50
                </>
              )}
            </button>
          )}

          {/* Growth bar */}
          <div className="pointer-events-none absolute inset-x-3 bottom-3">
            <div className="rounded-pill bg-black/25 px-3 py-1.5 backdrop-blur-sm">
              <div className="flex items-center justify-between text-caption text-white/90">
                <span className="inline-flex items-center gap-1 font-semibold tnum">
                  <Sprout className="h-3 w-3" /> {growth}/{goal}
                </span>
                <span>{pct}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-pill bg-white/20">
                <div
                  className="h-full rounded-pill bg-gradient-to-r from-brote-green to-brote-sun transition-[width] duration-700 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
