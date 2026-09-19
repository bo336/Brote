'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Sparkles,
  Ban,
  Globe2,
  Shirt,
  ShieldCheck,
  FlaskConical,
  BarChart3,
  Droplet,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pip } from '@/components/pip/Pip';
import { useAds } from '@/components/ads/AdsProvider';
import { startSubscription } from '@/lib/api/monetizacion';
import { useSession } from '@/stores/session';
import { toast } from '@/stores/toast';
import { haptic } from '@/lib/utils/haptics';

/**
 * Perks. These were six emoji, which §0 forbids for functional iconography —
 * and on the one screen asking for money, emoji icons are exactly what makes
 * a product read as unfinished. Each now has a lucide glyph and its own tint.
 */
const PERKS = [
  { Icon: Ban, tint: '#FF6B5E', title: 'Cero publicidad', body: 'Nunca más un anuncio en toda la app.' },
  {
    Icon: Droplet,
    tint: '#2DB4D4',
    title: 'Savia ilimitada en la Academia',
    body: 'Todas las hojas que quieras por día. Regar sigue siendo gratis para todo el mundo.',
  },
  { Icon: Globe2, tint: '#2DB4D4', title: 'Biomas exclusivos', body: 'Paletas y mundos que solo tienen los suscriptores.' },
  { Icon: Shirt, tint: '#9CC93B', title: 'Accesorios premium para Pip', body: 'Sombreros, anteojos y estampas exclusivas.' },
  { Icon: ShieldCheck, tint: '#1FB57A', title: '2 protectores de racha por mes', body: 'Para esos días en los que la vida se complica.' },
  { Icon: FlaskConical, tint: '#B07CD6', title: 'Eco-Experto sin límites', body: 'Preguntas ambientales con IA, sin tope diario.' },
  { Icon: BarChart3, tint: '#FFB23E', title: 'Estadísticas avanzadas', body: 'Tu impacto en detalle, mes a mes.' },
];

/**
 * Brote+ paywall (PLAN F13.6). Deliberately ad-free itself, and honest about
 * what is and is not included — the core loop stays free forever.
 */
export default function BrotePlusPage() {
  const { monetization, refresh } = useAds();
  const profile = useSession((s) => s.profile);
  const [busy, setBusy] = useState(false);
  const isPro = monetization?.is_pro ?? false;
  const isKid = (monetization?.account_type ?? profile?.accountType) === 'kid';

  async function subscribe() {
    if (busy) return;
    setBusy(true);
    haptic('medium');
    const res = await startSubscription();
    setBusy(false);
    if (res.ok && res.init_point) {
      window.location.href = res.init_point;
    } else {
      toast.error('No se pudo iniciar', res.message ?? 'Probá de nuevo en un rato.');
    }
  }

  return (
    <div className="space-y-5 pb-8">
      <Link href="/perfil" className="inline-flex items-center gap-1.5 text-small text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Perfil
      </Link>

      <Card className="relative flex flex-col items-center gap-2 overflow-hidden bg-gradient-to-b from-primary/15 to-transparent p-6 text-center shadow-soft-lg">
        {/* Warm wash behind Pip so the hero has a light source rather than a
            flat vertical fade. */}
        <div className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-brote-sun/20 blur-3xl" />
        <Pip size={96} mood="celebrating" aura pipStyle={profile?.pipStyle} />
        {/* The one gradient headline this screen is allowed (§1). */}
        <h1 className="bg-brand-gradient bg-clip-text font-display text-display-l font-extrabold text-transparent">
          Brote+
        </h1>
        <p className="max-w-xs text-balance text-small leading-relaxed text-muted-foreground">
          Apoyás el proyecto, sacás la publicidad y desbloqueás extras. Todo lo que hace crecer tu mundo sigue siendo
          gratis, siempre.
        </p>
      </Card>

      {isPro ? (
        <Card className="p-5 text-center">
          <p className="font-display text-h2 font-bold text-brote-green">Ya sos Brote+ 🌟</p>
          <p className="mt-1 text-small text-muted-foreground">
            {monetization?.plan_expires_at
              ? `Tu plan está activo hasta el ${new Date(monetization.plan_expires_at).toLocaleDateString('es-AR')}.`
              : 'Tu plan está activo.'}
          </p>
          <p className="mt-3 text-caption text-muted-foreground">
            Podés cancelar cuando quieras. Vas a seguir teniendo Brote+ hasta que termine el período que ya pagaste.
          </p>
        </Card>
      ) : (
        <>
          {/* Hairline-divided group rather than six separate bordered cards
              (§3): this is one list of what you get, not six objects. */}
          <Card className="divide-y divide-hairline overflow-hidden p-0">
            {PERKS.map(({ Icon, tint, title, body }) => (
              <div key={title} className="flex items-start gap-3 p-3.5">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]"
                  style={{ backgroundColor: `${tint}22`, color: tint }}
                >
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-small font-semibold leading-tight">{title}</p>
                  <p className="mt-0.5 text-caption leading-relaxed text-muted-foreground">{body}</p>
                </div>
                <Check className="mt-1 h-4 w-4 shrink-0 text-brote-green" />
              </div>
            ))}
          </Card>

          {isKid ? (
            <Card className="p-4 text-center">
              <p className="text-small font-semibold">Esta cuenta es de una persona menor de 13 🌱</p>
              <p className="mt-1 text-small text-muted-foreground">
                Las cuentas de chicos nunca ven publicidad y no pueden suscribirse. Si querés apoyar el proyecto, puede
                hacerlo una persona adulta desde su propia cuenta.
              </p>
            </Card>
          ) : (
            <>
              <Button block variant="primary" size="lg" loading={busy} onClick={subscribe}>
                {/* No processor name here: people pay with a card and seeing
                    an unexpected brand on the button reads as a redirect. */}
                <Sparkles className="h-4 w-4" /> Suscribirme
              </Button>
              <p className="text-center text-caption text-muted-foreground">
                Se cobra todos los meses. Cancelás cuando quieras, sin vueltas.
              </p>
            </>
          )}
        </>
      )}

      <button onClick={() => refresh()} className="mx-auto block text-caption text-muted-foreground underline-offset-2 hover:underline">
        ¿Pagaste y no se actualizó? Tocá acá
      </button>
    </div>
  );
}
