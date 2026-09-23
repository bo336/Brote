'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { empezarRepaso, empezarSesion } from '@/lib/api/academia';
import { esFallo, type Res, type Sesion } from '@/lib/academia/modelo';
import { useJugada } from '@/lib/academia/jugada';
import { haptic } from '@/lib/utils/haptics';
import { toast } from '@/stores/toast';

/**
 * Empezar una sesión desde cualquier lugar: el árbol, la unidad, la tarjeta de
 * "seguí donde quedaste" o el final de otra sesión.
 *
 * Es un solo lugar a propósito: empezar cobra savia, y las cuatro puertas
 * tienen que tratar igual el "sin savia", el "bloqueada" y el error de red.
 * `sin_savia` no se grita con un toast de error: es un estado, y la pantalla
 * que lo muestra se entera refrescando el mapa.
 */
export function useEmpezar() {
  const t = useTranslations('arbol');
  const router = useRouter();
  const qc = useQueryClient();
  const abrir = useJugada((s) => s.abrir);
  const [arrancando, setArrancando] = useState<string | null>(null);

  const lanzar = useCallback(
    async (clave: string, pedir: () => Promise<Res<Sesion>>) => {
      if (arrancando) return false;
      setArrancando(clave);
      const r = await pedir();
      if (esFallo(r)) {
        setArrancando(null);
        haptic('warning');
        if (r.error === 'sin_savia') {
          qc.invalidateQueries({ queryKey: ['academia'] });
          toast.show({ title: t('saviaVaciaTitulo'), description: t('saviaVaciaCuerpo'), variant: 'warning' });
          return false;
        }
        toast.show({ title: r.mensaje ?? t('errorCuerpo'), variant: r.error === 'bloqueada' ? 'warning' : 'error' });
        return false;
      }
      if (!r.pasos.length) {
        setArrancando(null);
        toast.show({ title: t('sinPasos'), variant: 'warning' });
        return false;
      }
      abrir(r);
      // La savia y el estado de las sesiones cambiaron: que la próxima vuelta
      // al árbol no muestre el número viejo.
      qc.invalidateQueries({ queryKey: ['academia'] });
      haptic('medium');
      router.push(`/aprender/sesion/${r.intento_id}`);
      return true;
    },
    [arrancando, abrir, qc, router, t],
  );

  const empezar = useCallback((leccionId: string) => lanzar(leccionId, () => empezarSesion(leccionId)), [lanzar]);
  const repasar = useCallback(() => lanzar('repaso', () => empezarRepaso()), [lanzar]);

  return { empezar, repasar, arrancando };
}
