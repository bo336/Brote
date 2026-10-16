'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { Megaphone } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useAds } from '@/components/ads/AdsProvider';
import { setAdsConsent } from '@/lib/api/monetizacion';
import { toast } from '@/stores/toast';

/**
 * La publicidad en Ajustes: lo que la política de privacidad promete (§5) —
 * que el consentimiento para anuncios personalizados se revoca desde acá.
 * A un chico no se le muestra nada (no ve publicidad); a un adolescente se le
 * explica que sus anuncios son siempre genéricos; Brote+ no ve anuncios.
 */
export function PublicidadAjustes() {
  const { monetization } = useAds();
  const qc = useQueryClient();
  const [ocupado, setOcupado] = useState(false);
  if (!monetization || monetization.account_type === 'kid') return null;

  const plus = monetization.is_pro;
  const adulto = monetization.account_type === 'adult';

  async function cambiar(v: boolean) {
    setOcupado(true);
    await setAdsConsent(v).catch(() => null);
    await qc.invalidateQueries({ queryKey: ['monetization'] });
    setOcupado(false);
    toast.success(v ? 'Anuncios personalizados' : 'Anuncios genéricos', 'Ves la misma cantidad en los dos casos.');
  }

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-surface-2 text-muted-foreground">
          <Megaphone className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-small font-semibold">Publicidad</p>
          <p className="mt-0.5 text-caption leading-relaxed text-muted-foreground">
            {plus
              ? 'Con Brote+ no ves anuncios en ninguna parte de la app.'
              : adulto
                ? 'Pocos anuncios y nunca en tu inicio, tu mundo, tu perfil ni en medio de una acción. Si permitís que sean personalizados, Google usa cookies para elegirlos; si no, son genéricos.'
                : 'En cuentas de 13 a 17 años los anuncios son siempre genéricos: nadie arma un perfil tuyo para elegirlos.'}
          </p>
          {!plus && (
            <Link href="/brote-plus" className="mt-1.5 inline-block text-caption font-medium text-primary hover:underline">
              Sacar los anuncios con Brote+
            </Link>
          )}
        </div>
        {!plus && adulto && (
          <Switch
            checked={monetization.ads_consent === true}
            disabled={ocupado}
            onCheckedChange={cambiar}
            aria-label="Anuncios personalizados"
          />
        )}
      </div>
    </Card>
  );
}
