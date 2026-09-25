'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { TarjetaListado } from '@/components/mercado/TarjetaListado';
import { getPuenteAccion, marcarVistas } from '@/lib/mercado/acciones';
import type { Puente } from '@/lib/mercado/servidor';

/**
 * "Dónde conseguirlo" (02 §6.1), debajo de las instrucciones de una acción.
 *
 * Las cinco reglas duras de la fase 4 §2.2 —nunca en el camino de completar,
 * nunca para `kid`, nada de categorías sensibles para `teen`, solo con 3
 * listados o más, y cero puntos por comprar— se cumplen en la base:
 * `mercado_para_accion` devuelve null y acá no se dibuja nada. Este componente
 * NO llama a `complete_activity` ni suma un solo punto; comprar no es una
 * acción de Brote.
 *
 * Se renderiza VISIBLE y recién después anima. El repo ya perdió dos
 * componentes por arrancar en `opacity: 0` con el frame loop estrangulado
 * (CountUp y NewsNudge): acá no hay animación de entrada, y punto.
 */
export function DondeConseguirlo({ slugAccion }: { slugAccion: string }) {
  const t = useTranslations('mercado.puente');
  const [datos, setDatos] = useState<Puente | null>(null);
  const pedido = useRef(false);

  useEffect(() => {
    if (pedido.current) return;
    pedido.current = true;
    void getPuenteAccion(slugAccion).then(setDatos);
  }, [slugAccion]);

  // La impresión se cuenta una vez por sesión y por listado, con su origen:
  // así la empresa puede ver cuánto le trajo el puente y cuánto el catálogo.
  useEffect(() => {
    if (!datos?.items.length) return;
    void marcarVistas(
      datos.items.map((i) => i.id),
      'accion',
    );
  }, [datos]);

  if (!datos || datos.items.length < 3) return null;

  return (
    <section aria-labelledby="donde-conseguirlo">
      <span className="eyebrow mb-1 block text-muted-foreground" id="donde-conseguirlo">
        {t('titulo')}
      </span>
      <p className="mb-3 text-small leading-relaxed text-muted-foreground">{datos.texto ?? t('ayuda')}</p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3">
        {datos.items.slice(0, 3).map((item) => (
          <TarjetaListado key={item.id} t={item} origen="accion" />
        ))}
      </div>
      <Link
        href={`/mercado/buscar?categoria=${datos.categoria}`}
        prefetch={false}
        className="press mt-3 inline-flex items-center gap-1.5 text-small font-semibold text-primary"
      >
        {t('ver')}
        <ArrowRight className="h-4 w-4" />
      </Link>
      <p className="mt-2 text-caption leading-relaxed text-muted-foreground">{t('aclaracion')}</p>
    </section>
  );
}
