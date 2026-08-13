'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pip } from '@/components/pip/Pip';
import { useAds } from '@/components/ads/AdsProvider';
import { startSubscription } from '@/lib/api/monetizacion';
import { useSession } from '@/stores/session';
import { toast } from '@/stores/toast';
import { haptic } from '@/lib/utils/haptics';

const PERKS = [
  { icon: '🚫', title: 'Cero publicidad', body: 'Nunca más un anuncio en toda la app.' },
  { icon: '🌍', title: 'Biomas exclusivos', body: 'Paletas y mundos que solo tienen los suscriptores.' },
  { icon: '🌱', title: 'Accesorios premium para Pip', body: 'Sombreros, anteojos y estampas exclusivas.' },
  { icon: '🛡️', title: '2 protectores de racha por mes', body: 'Para esos días en los que la vida se complica.' },
  { icon: '🧪', title: 'Eco-Experto sin límites', body: 'Preguntas ambientales con IA, sin tope diario.' },
  { icon: '📊', title: 'Estadísticas avanzadas', body: 'Tu impacto en detalle, mes a mes.' },
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

      <Card className="flex flex-col items-center gap-2 bg-gradient-to-b from-primary/15 to-transparent p-6 text-center">
        <Pip size={96} mood="celebrating" aura pipStyle={profile?.pipStyle} />
        <h1 className="font-display text-display-l font-extrabold">Brote+</h1>
        <p className="max-w-xs text-balance text-small text-muted-foreground">
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
          <div className="space-y-2">
            {PERKS.map((p) => (
              <Card key={p.title} className="flex items-start gap-3 p-3.5">
                <span className="text-xl leading-none">{p.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-small font-semibold">{p.title}</p>
                  <p className="text-caption text-muted-foreground">{p.body}</p>
                </div>
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brote-green" />
              </Card>
            ))}
          </div>

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
