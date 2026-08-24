'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock, Check, Eye, EyeOff, Sprout, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SectionHeader } from '@/components/ui/section';
import { Pip } from '@/components/pip/Pip';
import { DecorationPreview } from '@/components/tienda/DecorationPreview';
import {
  fetchShopState,
  buyCosmetic,
  equipCosmetic,
  ledgerLabel,
  type CosmeticItem,
  type ShopState,
} from '@/lib/api/tienda';
import { RANKS } from '@/lib/ranks';
import { useSession } from '@/stores/session';
import { toast } from '@/stores/toast';
import { haptic } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils/cn';

const KIND_LABEL: Record<string, string> = {
  pip_body: 'Colores',
  pip_hat: 'Sombreros',
  pip_glasses: 'Anteojos',
  pip_pattern: 'Estampas',
};

const PIP_KINDS = ['pip_body', 'pip_hat', 'pip_glasses', 'pip_pattern'] as const;

function rankName(tier: number): string {
  return RANKS.find((r) => r.tier === tier)?.name_es ?? `nivel ${tier}`;
}

/**
 * La tienda (F11.2). Las Semillas se ganan jugando y se gastan sólo en cosas
 * que se ven: accesorios de Pip y decoraciones que aparecen en Tu Mundo.
 *
 * A propósito NO se venden puntos, rangos, ni nada que toque un ranking: si se
 * pudiera comprar posición, todas las tablas dejarían de significar algo.
 */
export default function TiendaPage() {
  const qc = useQueryClient();
  const profile = useSession((s) => s.profile);
  const setProfile = useSession((s) => s.setProfile);
  const [busy, setBusy] = useState<string | null>(null);

  const q = useQuery({ queryKey: ['shop'], queryFn: fetchShopState, staleTime: 30_000 });
  const shop = q.data;

  function syncBalance(balance: number) {
    if (profile) setProfile({ ...profile, semillas: balance });
  }

  async function onBuy(item: CosmeticItem) {
    if (busy) return;
    setBusy(item.slug);
    try {
      const res = await buyCosmetic(item.slug);
      if (!res.ok) {
        syncBalance(res.balance);
        if (res.reason === 'funds') {
          toast.warning('Te faltan semillas', `${item.name_es} sale ${item.price} y tenés ${res.balance}.`);
        } else if (res.reason === 'pro_only') {
          toast.warning('Es de Brote+', 'Este artículo viene con la suscripción.');
        } else if (res.reason === 'rank') {
          toast.warning('Todavía no', `Se abre cuando llegues a ${rankName(res.min_rank_tier ?? item.min_rank_tier)}.`);
        } else {
          toast.warning('Ya es tuyo');
        }
        return;
      }
      syncBalance(res.balance);
      haptic('success');
      toast.success('¡Es tuyo!', item.name_es);
      qc.invalidateQueries({ queryKey: ['shop'] });
      qc.invalidateQueries({ queryKey: ['mundo-decorations'] });
    } catch (e) {
      toast.error('No se pudo comprar', e);
    } finally {
      setBusy(null);
    }
  }

  async function onEquip(item: CosmeticItem, on: boolean) {
    if (busy) return;
    setBusy(item.slug);
    try {
      const res = await equipCosmetic(item.slug, on);
      if (!res.ok && res.reason === 'max') {
        toast.error('Tu mundo está lleno', `Podés tener ${res.max} decoraciones a la vez. Guardá alguna primero.`);
        return;
      }
      haptic('light');
      qc.invalidateQueries({ queryKey: ['shop'] });
      qc.invalidateQueries({ queryKey: ['mundo-decorations'] });
    } catch (e) {
      toast.error('No se pudo cambiar', e);
    } finally {
      setBusy(null);
    }
  }

  const balance = shop?.balance ?? profile?.semillas ?? 0;

  return (
    <div className="space-y-5 pb-6">
      <Link href="/perfil" className="inline-flex items-center gap-1.5 text-small text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Perfil
      </Link>

      <header>
        <p className="eyebrow text-primary">Tienda</p>
        <h1 className="mt-1 text-balance font-display text-display-l font-extrabold leading-tight">
          Gastá lo que ganaste
        </h1>
        <p className="mt-1.5 text-small leading-relaxed text-muted-foreground">
          Las semillas salen de retos, rachas, objetivos y mundos completos. No se compran con plata
          y no cambian tu puntaje ni tu posición: son para que esto se vea como tuyo.
        </p>
      </header>

      <Card className="flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/12 text-primary">
            <Sprout className="h-5 w-5" />
          </span>
          <div>
            <p className="eyebrow text-muted-foreground">Tenés</p>
            <p className="font-display text-h1 font-bold leading-none tabular-nums">{balance}</p>
          </div>
        </div>
        <p className="max-w-[9rem] text-right text-caption leading-snug text-muted-foreground">
          semillas para gastar
        </p>
      </Card>

      {q.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : !shop ? (
        <Card className="p-5 text-center">
          <p className="text-small text-muted-foreground">No pudimos abrir la tienda. Probá de nuevo en un momento.</p>
        </Card>
      ) : (
        <Tabs defaultValue="mundo">
          <TabsList>
            <TabsTrigger value="mundo">Tu Mundo</TabsTrigger>
            <TabsTrigger value="pip">Pip</TabsTrigger>
            <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
          </TabsList>

          <TabsContent value="mundo" className="space-y-3">
            <SectionHeader
              eyebrow="Decoraciones"
              title="Cosas que aparecen en tu isla"
              subtitle="Lo que comprás se ve de verdad en el mundo, y podés guardarlo cuando quieras."
            />
            <div className="grid grid-cols-2 gap-3">
              {shop.items
                .filter((i) => i.kind === 'mundo')
                .map((item) => (
                  <MundoCard
                    key={item.slug}
                    item={item}
                    shop={shop}
                    busy={busy === item.slug}
                    onBuy={() => onBuy(item)}
                    onEquip={(on) => onEquip(item, on)}
                  />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="pip" className="space-y-5">
            <SectionHeader
              eyebrow="Pip"
              title="Accesorios"
              subtitle="Después los combinás desde el personalizador."
              action={
                <Link href="/perfil/pip">
                  <Button variant="secondary" size="sm">
                    Personalizar
                  </Button>
                </Link>
              }
            />
            {PIP_KINDS.map((kind) => {
              const items = shop.items.filter((i) => i.kind === kind);
              if (items.length === 0) return null;
              return (
                <section key={kind}>
                  <h3 className="eyebrow mb-2 text-muted-foreground">{KIND_LABEL[kind]}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {items.map((item) => (
                      <PipCard
                        key={item.slug}
                        item={item}
                        shop={shop}
                        busy={busy === item.slug}
                        onBuy={() => onBuy(item)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </TabsContent>

          <TabsContent value="movimientos">
            {shop.recent.length === 0 ? (
              <Card className="p-5 text-center">
                <p className="text-small text-muted-foreground">Todavía no hay movimientos.</p>
              </Card>
            ) : (
              <Card className="divide-hairline p-0">
                {shop.recent.map((m, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-small font-medium">{ledgerLabel(m.source)}</p>
                      {m.note_es && (
                        <p className="truncate text-caption text-muted-foreground">{m.note_es}</p>
                      )}
                    </div>
                    <span
                      className={cn(
                        'shrink-0 text-small font-bold tabular-nums',
                        m.amount >= 0 ? 'text-primary' : 'text-muted-foreground',
                      )}
                    >
                      {m.amount >= 0 ? `+${m.amount}` : m.amount}
                    </span>
                  </div>
                ))}
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

/** Why an item cannot be bought right now, or null when it can. */
function blockedReason(item: CosmeticItem, shop: ShopState): string | null {
  if (item.pro_only && !shop.is_pro) return 'Brote+';
  if (shop.rank_tier < item.min_rank_tier) return rankName(item.min_rank_tier);
  return null;
}

function PriceRow({
  item,
  shop,
  busy,
  onBuy,
}: {
  item: CosmeticItem;
  shop: ShopState;
  busy: boolean;
  onBuy: () => void;
}) {
  if (item.owned) {
    return (
      <span className="inline-flex items-center gap-1 text-caption font-semibold text-primary">
        <Check className="h-3.5 w-3.5" /> Tuyo
      </span>
    );
  }
  const blocked = blockedReason(item, shop);
  if (blocked) {
    return (
      <span className="inline-flex items-center gap-1 text-caption text-muted-foreground">
        <Lock className="h-3.5 w-3.5" /> {blocked}
      </span>
    );
  }
  const canAfford = shop.balance >= item.price;
  return (
    <Button
      size="sm"
      variant={canAfford ? 'primary' : 'secondary'}
      loading={busy}
      onClick={onBuy}
      className="tabular-nums"
    >
      {item.price}
    </Button>
  );
}

function PipCard({
  item,
  shop,
  busy,
  onBuy,
}: {
  item: CosmeticItem;
  shop: ShopState;
  busy: boolean;
  onBuy: () => void;
}) {
  // El preview muestra el accesorio puesto, que es la única forma honesta de
  // vender algo cosmético: se ve antes de pagarlo.
  const style =
    item.kind === 'pip_body'
      ? { body: item.value ?? undefined }
      : item.kind === 'pip_hat'
        ? { hat: item.value ?? undefined }
        : item.kind === 'pip_glasses'
          ? { glasses: item.value ?? undefined }
          : { pattern: item.value ?? undefined };

  return (
    <Card className={cn('flex flex-col items-center gap-2 p-3', item.owned && 'border-primary/40')}>
      <div className="grid h-[74px] w-full place-items-center rounded-lg bg-surface-2">
        <Pip size={64} pipStyle={style} animate={false} />
      </div>
      <p className="text-center text-small font-semibold leading-tight">{item.name_es}</p>
      <PriceRow item={item} shop={shop} busy={busy} onBuy={onBuy} />
    </Card>
  );
}

function MundoCard({
  item,
  shop,
  busy,
  onBuy,
  onEquip,
}: {
  item: CosmeticItem;
  shop: ShopState;
  busy: boolean;
  onBuy: () => void;
  onEquip: (on: boolean) => void;
}) {
  return (
    <Card className={cn('flex flex-col gap-2 p-3', item.owned && 'border-primary/40')}>
      <div className="grid h-[86px] w-full place-items-center overflow-hidden rounded-lg bg-surface-2">
        <DecorationPreview slug={item.slug} />
      </div>
      <div className="min-h-[3.1rem]">
        <p className="text-small font-semibold leading-tight">{item.name_es}</p>
        {item.description_es && (
          <p className="mt-0.5 text-caption leading-snug text-muted-foreground">{item.description_es}</p>
        )}
      </div>
      {item.owned ? (
        <Button
          size="sm"
          variant={item.equipped ? 'secondary' : 'outline'}
          loading={busy}
          onClick={() => onEquip(!item.equipped)}
          block
        >
          {item.equipped ? (
            <>
              <Eye className="h-4 w-4" /> En tu mundo
            </>
          ) : (
            <>
              <EyeOff className="h-4 w-4" /> Guardada
            </>
          )}
        </Button>
      ) : (
        <div className="flex justify-start">
          <PriceRow item={item} shop={shop} busy={busy} onBuy={onBuy} />
        </div>
      )}
    </Card>
  );
}
