'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Check, Lock, Sprout, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pip, PIP_PALETTES, PIP_HATS, PIP_GLASSES, PIP_PATTERNS, type PipStyle } from '@/components/pip/Pip';
import { fetchShopState, type CosmeticKind, type CosmeticItem } from '@/lib/api/tienda';
import { useSession } from '@/stores/session';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/stores/toast';
import { haptic } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils/cn';

const PALETTE_NAMES: Record<string, string> = {
  clasico: 'Clásico',
  cielo: 'Cielo',
  coral: 'Coral',
  lavanda: 'Lavanda',
  sol: 'Sol',
  noche: 'Noche',
  aurora: 'Aurora',
  bosque: 'Bosque',
  atardecer: 'Atardecer',
  glaciar: 'Glaciar',
  cosmos: 'Cosmos',
};

const HAT_NAMES: Record<string, string> = {
  ninguno: 'Sin nada',
  brotecito: 'Brotecito',
  flor: 'Flor',
  gorro: 'Gorro',
  corona: 'Corona',
  hongo: 'Honguito',
  mono: 'Moño',
  vincha: 'Vincha',
  estrella: 'Estrella',
  sombrero: 'Sombrero',
  casco: 'Casco',
  visera: 'Gorra',
  aureola: 'Aureola',
};

const GLASSES_NAMES: Record<string, string> = {
  ninguno: 'Sin anteojos',
  redondos: 'Redondos',
  sol: 'De sol',
  corazones: 'Corazones',
  aviador: 'Aviador',
  pixel: 'Pixelados',
};

const PATTERN_NAMES: Record<string, string> = {
  ninguno: 'Liso',
  pecas: 'Pecas',
  lunares: 'Lunares',
  rayitas: 'Rayitas',
  hojitas: 'Hojitas',
  estrellitas: 'Estrellitas',
  olitas: 'Olitas',
};

/**
 * Pip customizer (F9.1) — your companion, your style.
 *
 * Desde F11.2 una parte del catálogo se compra con semillas. Lo que ya era
 * gratis SIGUE siendo gratis: nada de lo que alguien podía elegir ayer quedó
 * detrás de un candado. Los items premium simplemente no están en la lista
 * gratuita, y acá se muestran bloqueados con su precio en lugar de esconderse,
 * porque una opción que no sabés que existe no motiva nada.
 *
 * El candado de la UI es comodidad, no seguridad: el trigger
 * brote_validate_pip_style de la migración 0038 rechaza en la base cualquier
 * accesorio que no sea tuyo, aunque alguien mande el update a mano.
 */
export default function PipCustomizerPage() {
  const profile = useSession((s) => s.profile);
  const setProfile = useSession((s) => s.setProfile);
  const [style, setStyle] = useState<PipStyle>(profile?.pipStyle ?? {});
  const [saving, setSaving] = useState(false);

  const shopQ = useQuery({ queryKey: ['shop'], queryFn: fetchShopState, staleTime: 30_000 });
  const items = shopQ.data?.items ?? [];

  /** The catalogue entry for an option, or undefined when it is free. */
  function cosmeticFor(kind: CosmeticKind, value: string): CosmeticItem | undefined {
    return items.find((i) => i.kind === kind && i.value === value);
  }

  function isLocked(kind: CosmeticKind, value: string): CosmeticItem | null {
    const c = cosmeticFor(kind, value);
    return c && !c.owned ? c : null;
  }

  function pick(kind: CosmeticKind, value: string, apply: () => void) {
    const locked = isLocked(kind, value);
    if (locked) {
      haptic('light');
      toast.warning(
        `${locked.name_es} · ${locked.price} semillas`,
        'Conseguilo en la tienda y volvé para ponérselo.',
      );
      return;
    }
    haptic('light');
    apply();
  }

  async function save() {
    if (!profile || saving) return;
    setSaving(true);
    const { error } = await createClient().from('profiles').update({ pip_style: style }).eq('id', profile.id);
    setSaving(false);
    if (error) {
      toast.error('No se pudo guardar', error.message);
      return;
    }
    setProfile({ ...profile, pipStyle: style });
    haptic('success');
    toast.success('¡Pip renovado! 🌱');
  }

  return (
    <div className="space-y-5 pb-6">
      <Link href="/perfil" className="inline-flex items-center gap-1.5 text-small text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Perfil
      </Link>
      <h1 className="font-display text-h1 font-bold">Personalizá a Pip</h1>

      {/* Live preview */}
      <Card className="flex flex-col items-center gap-2 bg-primary/5 p-6">
        <Pip size={140} mood="happy" pipStyle={style} />
        <p className="text-small text-muted-foreground">Así se ve tu Pip</p>
      </Card>

      <Link
        href="/tienda"
        className="press group flex items-center gap-2.5 rounded-button border border-primary/30 bg-primary/8 px-3 py-2.5 text-small font-semibold text-primary hover:bg-primary/12"
      >
        <Sprout className="h-4 w-4 shrink-0" />
        <span className="tabular-nums">{profile?.semillas ?? 0} semillas</span>
        <span className="min-w-0 flex-1 truncate font-medium text-muted-foreground">
          conseguí más accesorios
        </span>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
      </Link>

      {/* Body palette */}
      <section>
        <h2 className="mb-2 font-display text-h3 font-bold">Color</h2>
        <div className="grid grid-cols-3 gap-2.5">
          {Object.entries(PIP_PALETTES).map(([key, [body, , leaf]]) => {
            const active = (style.body ?? 'clasico') === key;
            const locked = isLocked('pip_body', key);
            return (
              <button
                key={key}
                onClick={() => pick('pip_body', key, () => setStyle((s) => ({ ...s, body: key })))}
                className={cn(
                  'relative flex items-center gap-2 rounded-card border p-3 transition-all',
                  active ? 'border-primary bg-primary/10' : 'border-border bg-surface',
                  locked && 'opacity-70',
                )}
              >
                <span className="relative h-8 w-8 shrink-0 rounded-full" style={{ background: body }}>
                  <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full" style={{ background: leaf }} />
                </span>
                <span className="flex-1 text-left text-small font-medium">{PALETTE_NAMES[key] ?? key}</span>
                {active && !locked && <Check className="h-4 w-4 shrink-0 text-primary" />}
                {locked && <PriceTag price={locked.price} />}
              </button>
            );
          })}
        </div>
      </section>

      {/* Hats */}
      <section>
        <h2 className="mb-2 font-display text-h3 font-bold">Accesorio</h2>
        <div className="grid grid-cols-3 gap-2.5">
          {PIP_HATS.map((hat) => {
            const active = (style.hat ?? 'ninguno') === hat;
            const locked = isLocked('pip_hat', hat);
            return (
              <OptionTile
                key={hat}
                active={active}
                locked={locked?.price}
                label={HAT_NAMES[hat] ?? hat}
                onClick={() => pick('pip_hat', hat, () => setStyle((s) => ({ ...s, hat })))}
              >
                <Pip size={52} mood="happy" animate={false} pipStyle={{ body: style.body, hat }} />
              </OptionTile>
            );
          })}
        </div>
      </section>

      {/* Glasses */}
      <section>
        <h2 className="mb-2 font-display text-h3 font-bold">Anteojos</h2>
        <div className="grid grid-cols-4 gap-2.5">
          {PIP_GLASSES.map((g) => {
            const active = (style.glasses ?? 'ninguno') === g;
            const locked = isLocked('pip_glasses', g);
            return (
              <OptionTile
                key={g}
                active={active}
                locked={locked?.price}
                label={GLASSES_NAMES[g] ?? g}
                compact
                onClick={() => pick('pip_glasses', g, () => setStyle((s) => ({ ...s, glasses: g })))}
              >
                <Pip size={46} mood="happy" animate={false} pipStyle={{ body: style.body, glasses: g }} />
              </OptionTile>
            );
          })}
        </div>
      </section>

      {/* Body pattern */}
      <section>
        <h2 className="mb-2 font-display text-h3 font-bold">Estampa</h2>
        <div className="grid grid-cols-4 gap-2.5">
          {PIP_PATTERNS.map((p) => {
            const active = (style.pattern ?? 'ninguno') === p;
            const locked = isLocked('pip_pattern', p);
            return (
              <OptionTile
                key={p}
                active={active}
                locked={locked?.price}
                label={PATTERN_NAMES[p] ?? p}
                compact
                onClick={() => pick('pip_pattern', p, () => setStyle((s) => ({ ...s, pattern: p })))}
              >
                <Pip size={46} mood="happy" animate={false} pipStyle={{ body: style.body, pattern: p }} />
              </OptionTile>
            );
          })}
        </div>
      </section>

      <Button block variant="primary" loading={saving} onClick={save}>
        Guardar
      </Button>
    </div>
  );
}

function PriceTag({ price }: { price: number }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-surface-2 px-1.5 py-0.5 text-caption font-semibold tabular-nums text-muted-foreground">
      <Lock className="h-3 w-3" />
      {price}
    </span>
  );
}

function OptionTile({
  active,
  locked,
  label,
  compact,
  onClick,
  children,
}: {
  active: boolean;
  locked?: number;
  label: string;
  compact?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center gap-1 rounded-card border transition-all',
        compact ? 'p-2.5' : 'p-3',
        active && !locked ? 'border-primary bg-primary/10' : 'border-border bg-surface',
        locked && 'opacity-70',
      )}
    >
      {children}
      <span className="text-caption font-medium">{label}</span>
      {locked !== undefined && (
        <span className="absolute right-1 top-1">
          <PriceTag price={locked} />
        </span>
      )}
    </button>
  );
}
