'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pip, PIP_PALETTES, PIP_HATS, type PipStyle } from '@/components/pip/Pip';
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
};

const HAT_NAMES: Record<string, string> = {
  ninguno: 'Sin nada',
  brotecito: 'Brotecito',
  flor: 'Flor',
  gorro: 'Gorro',
  corona: 'Corona',
};

/**
 * Pip customizer (PLAN F9.1) — your companion, your style. Body palettes +
 * accessories, live preview, persisted in profiles.pip_style and reflected
 * everywhere Pip represents YOU (home, chat, profile).
 */
export default function PipCustomizerPage() {
  const profile = useSession((s) => s.profile);
  const setProfile = useSession((s) => s.setProfile);
  const [style, setStyle] = useState<PipStyle>(profile?.pipStyle ?? {});
  const [saving, setSaving] = useState(false);

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

      {/* Body palette */}
      <section>
        <h2 className="mb-2 font-display text-h3 font-bold">Color</h2>
        <div className="grid grid-cols-3 gap-2.5">
          {Object.entries(PIP_PALETTES).map(([key, [body, , leaf]]) => {
            const active = (style.body ?? 'clasico') === key;
            return (
              <button
                key={key}
                onClick={() => {
                  haptic('light');
                  setStyle((s) => ({ ...s, body: key }));
                }}
                className={cn(
                  'flex items-center gap-2 rounded-card border p-3 transition-all',
                  active ? 'border-primary bg-primary/10' : 'border-border bg-surface',
                )}
              >
                <span className="relative h-8 w-8 shrink-0 rounded-full" style={{ background: body }}>
                  <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full" style={{ background: leaf }} />
                </span>
                <span className="flex-1 text-left text-small font-medium">{PALETTE_NAMES[key]}</span>
                {active && <Check className="h-4 w-4 shrink-0 text-primary" />}
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
            return (
              <button
                key={hat}
                onClick={() => {
                  haptic('light');
                  setStyle((s) => ({ ...s, hat }));
                }}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-card border p-3 transition-all',
                  active ? 'border-primary bg-primary/10' : 'border-border bg-surface',
                )}
              >
                <Pip size={52} mood="happy" animate={false} pipStyle={{ body: style.body, hat }} />
                <span className="text-caption font-medium">{HAT_NAMES[hat]}</span>
              </button>
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
