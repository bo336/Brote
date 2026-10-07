'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DomainIcon } from '@/components/icons/DomainIcon';
import { ContextoChips, contextoRespondido } from '@/components/acciones/ContextoChips';
import { fetchOcultas, guardarContexto, mostrarDeNuevo } from '@/lib/api/acciones';
import { useSession } from '@/stores/session';
import { toast } from '@/stores/toast';

const MOTIVO: Record<string, string> = {
  no_aplica: 'No aplica a vos',
  no_me_gusta: 'No te interesa',
  ya_lo_hago: 'Ya la hacés siempre (vuelve sola en unas semanas)',
};

/**
 * Ajustes → "Tu casa y tu día": lo que tenés (y por eso lo que te ofrecemos) y
 * las acciones que sacaste, con la forma de volver a verlas.
 */
export default function AjustesAccionesPage() {
  const qc = useQueryClient();
  const profile = useSession((s) => s.profile);
  const setProfile = useSession((s) => s.setProfile);
  const [valor, setValor] = useState<Record<string, unknown>>({});
  const [guardando, setGuardando] = useState(false);
  const ocultasQ = useQuery({ queryKey: ['acciones-ocultas'], queryFn: fetchOcultas });

  useEffect(() => {
    setValor({ ...(profile?.context ?? {}) });
  }, [profile?.context]);

  if (!profile) return <Skeleton className="h-64 w-full" />;
  const cuenta = profile.accountType ?? 'adult';

  async function guardar() {
    setGuardando(true);
    try {
      const ctx = await guardarContexto(contextoRespondido(valor, cuenta));
      if (ctx && profile) setProfile({ ...profile, context: ctx });
      qc.invalidateQueries({ queryKey: ['sugeridas'] });
      qc.invalidateQueries({ queryKey: ['mis-caminos'] });
      toast.success('Guardado', 'Desde mañana tus acciones del día lo tienen en cuenta.');
    } catch (e) {
      toast.error('No se pudo guardar', e);
    } finally {
      setGuardando(false);
    }
  }

  async function volver(id: string) {
    try {
      await mostrarDeNuevo(id);
      qc.invalidateQueries({ queryKey: ['acciones-ocultas'] });
      qc.invalidateQueries({ queryKey: ['sugeridas'] });
      toast.success('Vuelve a aparecer');
    } catch (e) {
      toast.error('No se pudo', e);
    }
  }

  return (
    <div className="space-y-6 pb-6">
      <Link href="/perfil/ajustes" className="inline-flex items-center gap-1.5 text-small text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Ajustes
      </Link>

      <section>
        <h1 className="font-display text-h1 font-bold leading-tight">Tu casa y tu día</h1>
        <p className="mt-1 text-small leading-relaxed text-muted-foreground">
          Sólo te ofrecemos acciones que piden algo (una bici, un balcón, una parrilla, un auto) si lo tenés. Todo lo
          demás le sirve a cualquiera.
        </p>
        <Card className="mt-4 p-4">
          <ContextoChips cuenta={cuenta} valor={valor} onChange={setValor} />
          <Button block variant="primary" className="mt-5" loading={guardando} onClick={guardar}>
            Guardar
          </Button>
        </Card>
      </section>

      <section>
        <h2 className="font-display text-h3 font-bold leading-tight">Acciones que sacaste</h2>
        <p className="mt-1 text-small leading-relaxed text-muted-foreground">
          Las que cambiaste diciendo que no aplican, que no te interesan o que ya hacés. Volvé a mostrar las que quieras.
        </p>
        <div className="mt-3">
          {ocultasQ.isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (ocultasQ.data ?? []).length === 0 ? (
            <Card className="p-4 text-small text-muted-foreground">No sacaste ninguna.</Card>
          ) : (
            <Card className="divide-y divide-hairline overflow-hidden p-0">
              {(ocultasQ.data ?? []).map((o) => (
                <div key={o.activity_id} className="flex items-center gap-3 p-3.5">
                  <DomainIcon domain={o.domain_slug} size={34} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/acciones/${o.slug}`} className="block truncate text-small font-medium hover:underline">
                      {o.title_es}
                    </Link>
                    <span className="block text-caption text-muted-foreground">{MOTIVO[o.motivo] ?? o.motivo}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => volver(o.activity_id)}>
                    <Eye className="h-4 w-4" /> Mostrar
                  </Button>
                </div>
              ))}
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
