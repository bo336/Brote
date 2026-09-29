'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Estante } from '@/components/mercado/Estante';
import { getMercadoDestacado } from '@/lib/mercado/acciones';
import { useSession } from '@/stores/session';

/**
 * "Ponelo en práctica": al pie de una unidad de la Academia, productos del
 * Mercado del mismo tema. Va DEBAJO de todo, después de las sesiones y del
 * repaso: primero se aprende, y comprar no suma nada en Brote. Con menos de
 * cuatro productos del tema no aparece — un estante flaco se lee como relleno.
 */
export function EnElMercado({ dominio }: { dominio: string }) {
  const t = useTranslations('mercado.entrada');
  const tipo = useSession((s) => s.profile?.accountType);
  const q = useQuery({
    queryKey: ['mercado', 'dominio', dominio],
    queryFn: () => getMercadoDestacado(10, dominio),
    staleTime: 10 * 60_000,
    enabled: !!tipo && tipo !== 'kid',
  });
  if (!tipo || tipo === 'kid' || !q.data || q.data.length < 4) return null;
  return (
    <div className="border-t border-hairline pt-6">
      <Estante titulo={t('practica')} subtitulo={t('practicaSub')} verTodo="/mercado" items={q.data} />
    </div>
  );
}
