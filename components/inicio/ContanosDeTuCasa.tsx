'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Home, X } from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ContextoChips, contextoRespondido } from '@/components/acciones/ContextoChips';
import { guardarContexto } from '@/lib/api/acciones';
import { useSession } from '@/stores/session';
import { toast } from '@/stores/toast';

const DESCARTADA = 'brote:contexto-descartado';

/**
 * Una tarjeta chica debajo de las acciones del día, hasta que la persona
 * contesta "Tu casa y tu día": sin eso, no le ofrecemos nada que pida algo
 * (bici, balcón, auto, parrilla…), y el día se siente más genérico de lo que
 * podría. Se puede cerrar; vuelve a estar en Ajustes.
 */
export function ContanosDeTuCasa() {
  const qc = useQueryClient();
  const profile = useSession((s) => s.profile);
  const setProfile = useSession((s) => s.setProfile);
  const [abierta, setAbierta] = useState(false);
  const [valor, setValor] = useState<Record<string, unknown>>(() => ({ ...(profile?.context ?? {}) }));
  const [guardando, setGuardando] = useState(false);
  const [cerrada, setCerrada] = useState(false);
  // Después de montar, para que el HTML del servidor y el del cliente coincidan.
  useEffect(() => {
    try {
      if (localStorage.getItem(DESCARTADA) === '1') setCerrada(true);
    } catch {
      /* sin almacenamiento: se muestra */
    }
  }, []);

  if (!profile || cerrada || profile.context?.respondido === true) return null;
  const cuenta = profile.accountType ?? 'adult';

  async function guardar() {
    setGuardando(true);
    try {
      const ctx = await guardarContexto(contextoRespondido(valor, cuenta));
      if (ctx && profile) setProfile({ ...profile, context: ctx });
      // Lo que se sugiere depende del contexto; el día de hoy ya está armado.
      qc.invalidateQueries({ queryKey: ['sugeridas'] });
      qc.invalidateQueries({ queryKey: ['mis-caminos'] });
      toast.success('¡Gracias!', 'Desde mañana tus acciones van a estar hechas a tu medida.');
      setAbierta(false);
    } catch (e) {
      toast.error('No se pudo guardar', e);
    } finally {
      setGuardando(false);
    }
  }

  function descartar() {
    try {
      localStorage.setItem(DESCARTADA, '1');
    } catch {
      /* sin almacenamiento: se cierra sólo por ahora */
    }
    setCerrada(true);
  }

  return (
    <>
      <div className="flex items-center gap-3 rounded-card border border-dashed border-primary/40 bg-primary/[0.04] p-3.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-primary/15 text-primary">
          <Home className="h-5 w-5" aria-hidden />
        </span>
        <button type="button" onClick={() => setAbierta(true)} className="min-w-0 flex-1 text-left">
          <span className="block text-small font-semibold">Contanos de tu casa y tu día</span>
          <span className="mt-0.5 block text-caption leading-snug text-muted-foreground">
            30 segundos: así te damos acciones que te sirvan de verdad.
          </span>
        </button>
        <button
          type="button"
          onClick={descartar}
          aria-label="Cerrar"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-2"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <Sheet open={abierta} onOpenChange={setAbierta} title="Tu casa y tu día">
        <p className="mb-4 text-small leading-relaxed text-muted-foreground">
          Marcá lo que tenés. Sólo te vamos a ofrecer acciones que pidan algo (una bici, un balcón, una parrilla) si lo
          tenés. Lo podés cambiar cuando quieras en Ajustes.
        </p>
        <ContextoChips cuenta={cuenta} valor={valor} onChange={setValor} />
        <Button block variant="primary" className="mt-5" loading={guardando} onClick={guardar}>
          Guardar
        </Button>
      </Sheet>
    </>
  );
}
