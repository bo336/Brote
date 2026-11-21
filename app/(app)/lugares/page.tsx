'use client';

import { useTranslations } from 'next-intl';
import { Newspaper, Sparkles, Trophy } from 'lucide-react';
import { LinkRow } from '@/components/ui/link-row';
import { Reveal } from '@/components/ui/reveal';
import {
  TarjetaAcademia,
  TarjetaAcciones,
  TarjetaImpacto,
  TarjetaMercado,
  TarjetaMundo,
  TarjetaPlaza,
  TarjetaProyectos,
} from '@/components/explorar/TarjetasLugar';
import { useMercadoDestacado, useMundoAbierto } from '@/components/inicio/datos';
import { useSession } from '@/stores/session';
import { cn } from '@/lib/utils/cn';

/**
 * Explorar — el mapa del pueblo (docs/REESTRUCTURA.md D3).
 *
 * Academia, Tu mundo, Acciones, Proyectos y el Mercado no estaban en la barra
 * del celular: se llegaba sólo por tarjetas al fondo de Hoy. Ahora tienen una
 * pestaña, y cada lugar se presenta con su color y con algo real de la persona
 * adentro (la próxima lección, su isla, el camino empezado, el próximo
 * encuentro, productos para ella). Nada de íconos sueltos: cada tarjeta es una
 * razón para entrar.
 */
export default function ExplorarPage() {
  const t = useTranslations('explorar');
  const tipo = useSession((s) => s.profile?.accountType);
  const mundo = useMundoAbierto();
  const mercado = useMercadoDestacado(tipo !== 'kid');
  const conMundo = mundo.data === true;
  const conMercado = tipo !== 'kid' && (mercado.data?.length ?? 0) >= 2;

  return (
    <div className="space-y-4">
      <header className="pb-1">
        <span className="eyebrow block text-muted-foreground">{t('eyebrow')}</span>
        <h1 className="mt-1 text-balance font-display text-display-l font-extrabold leading-[1.05]">{t('titulo')}</h1>
        <p className="mt-1.5 text-small leading-relaxed text-muted-foreground">{t('bajada')}</p>
      </header>

      <Reveal index={0}>
        <TarjetaAcademia />
      </Reveal>

      <Reveal index={1}>
        <div className={cn('grid gap-3', conMundo ? 'grid-cols-2' : 'grid-cols-1')}>
          {conMundo && <TarjetaMundo />}
          {tipo !== 'kid' && <TarjetaPlaza compacta={conMundo} />}
        </div>
      </Reveal>

      <Reveal index={2}>
        <TarjetaAcciones />
      </Reveal>

      <Reveal index={3}>
        <TarjetaProyectos />
      </Reveal>

      <Reveal index={4}>
        <TarjetaImpacto />
      </Reveal>

      {conMercado && (
        <Reveal index={5}>
          <TarjetaMercado />
        </Reveal>
      )}

      <Reveal index={6}>
        <div className="divide-hairline overflow-hidden rounded-card border border-border bg-surface">
          <LinkRow
            href="/competencias"
            icon={<Trophy className="h-5 w-5" />}
            accent="#4450C8"
            title={t('retos.titulo')}
            description={t('retos.bajada')}
            className="rounded-none border-0 shadow-none hover:translate-y-0 hover:bg-surface-2 hover:shadow-none"
          />
          {tipo !== 'kid' && (
            <LinkRow
              href="/feed?tab=novedades"
              icon={<Newspaper className="h-5 w-5" />}
              accent="#C2412F"
              title={t('noticias.titulo')}
              description={t('noticias.bajada')}
              className="rounded-none border-0 shadow-none hover:translate-y-0 hover:bg-surface-2 hover:shadow-none"
            />
          )}
          <LinkRow
            href="/brote-plus"
            icon={<Sparkles className="h-5 w-5" />}
            accent="#FFB23E"
            title={t('plus.titulo')}
            description={t('plus.bajada')}
            className="rounded-none border-0 shadow-none hover:translate-y-0 hover:bg-surface-2 hover:shadow-none"
          />
        </div>
      </Reveal>
    </div>
  );
}
