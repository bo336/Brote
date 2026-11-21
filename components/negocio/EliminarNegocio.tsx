'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { eliminarNegocio, revisarEliminarNegocio, type MotivoEliminar, type RevisionEliminar } from '@/lib/negocio/eliminar-acciones';
import { toast } from '@/stores/toast';

const TEXTO: Record<MotivoEliminar, string> = {
  no_autenticado: 'Tu sesión venció. Volvé a entrar.',
  no_existe: 'Este negocio ya no existe.',
  solo_duenio: 'Sólo quien es dueña o dueño del negocio puede eliminarlo.',
  es_demo: 'Los negocios de muestra no se eliminan desde la app.',
  plan_activo: 'Tenés un plan pago activo. Cancelalo primero para que no se te cobre más, y después volvé acá.',
  confirmacion: 'El nombre no coincide. Escribilo tal cual aparece.',
  error: 'No se pudo eliminar. Probá de nuevo en un rato.',
};

/**
 * Zona de cuidado: eliminar el negocio (docs/REESTRUCTURA.md D7).
 *
 * Antes no había forma: quien creaba un negocio no podía borrarlo. Ahora la
 * dueña o el dueño lo elimina escribiendo su nombre. Con un plan pago vivo, se
 * cancela primero (si no, MercadoPago seguiría cobrando).
 */
export function EliminarNegocio({ negocioId, nombre }: { negocioId: string; nombre: string }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [rev, setRev] = useState<RevisionEliminar | null>(null);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<MotivoEliminar | null>(null);

  async function abrir() {
    setAbierto(true);
    setRev(null);
    setTexto('');
    setError(null);
    setRev(await revisarEliminarNegocio(negocioId));
  }

  async function confirmar() {
    setEnviando(true);
    setError(null);
    const r = await eliminarNegocio(negocioId, texto);
    setEnviando(false);
    if (!r.ok) return setError(r.error);
    setAbierto(false);
    toast.success('Negocio eliminado', `"${r.nombre}" y todo lo suyo se borraron.`);
    router.replace('/');
    router.refresh();
  }

  return (
    <section aria-labelledby="zona-cuidado" className="mt-10 max-w-3xl rounded-card border border-brote-coral/30 p-4">
      <h2 id="zona-cuidado" className="flex items-center gap-2 text-small font-semibold text-brote-coral">
        <AlertTriangle className="h-4 w-4" aria-hidden />
        Zona de cuidado
      </h2>
      <p className="mt-1 text-small leading-relaxed text-muted-foreground">
        Eliminar el negocio borra para siempre sus productos, su equipo, sus objetivos, sus desafíos y certificados, y sus números.
      </p>
      <Button variant="ghost" size="sm" className="mt-3 text-brote-coral hover:bg-brote-coral/10" onClick={() => void abrir()}>
        <Trash2 className="h-4 w-4" aria-hidden />
        Eliminar este negocio
      </Button>

      <Sheet open={abierto} onOpenChange={setAbierto} side="center" title={`Eliminar "${nombre}"`} description="No se puede deshacer.">
        {!rev ? (
          <Skeleton className="mt-3 h-24 w-full" />
        ) : !rev.ok ? (
          <div className="mt-3 space-y-3 text-small">
            <p className="leading-relaxed">{TEXTO[rev.error ?? 'error']}</p>
            {rev.error === 'plan_activo' && (
              <Link
                href="/negocio/plan"
                onClick={() => setAbierto(false)}
                className="press inline-flex h-10 items-center rounded-pill bg-primary px-4 font-semibold text-primary-foreground"
              >
                Ir a cancelar el plan
              </Link>
            )}
          </div>
        ) : (
          <form
            className="mt-3 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void confirmar();
            }}
          >
            <ul className="list-disc space-y-1 pl-5 text-small text-muted-foreground">
              <li>{rev.listados === 1 ? '1 producto o listado.' : `${rev.listados ?? 0} productos o listados.`}</li>
              <li>{rev.equipo ?? 1} {rev.equipo === 1 ? 'persona' : 'personas'} en el equipo pierden el acceso.</li>
              {(rev.certificados ?? 0) > 0 && (
                <li>{rev.certificados === 1 ? '1 certificado deja' : `${rev.certificados} certificados dejan`} de poder verificarse.</li>
              )}
              <li>Las fotos, el logo y la evidencia que subiste.</li>
            </ul>
            <div>
              <label htmlFor="eliminar-nombre" className="text-small font-semibold">
                Escribí <span className="font-bold">{rev.nombre ?? nombre}</span> para confirmar
              </label>
              <input
                id="eliminar-nombre"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                autoComplete="off"
                className="mt-1.5 h-11 w-full rounded-button border border-border bg-surface px-3 text-body outline-none focus:border-brote-coral/60"
              />
            </div>
            {error && <p className="text-small font-medium text-brote-coral">{TEXTO[error]}</p>}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" className="flex-1" onClick={() => setAbierto(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-brote-coral text-white hover:bg-brote-coral/90"
                loading={enviando}
                disabled={!texto.trim()}
              >
                Sí, eliminar
              </Button>
            </div>
          </form>
        )}
      </Sheet>
    </section>
  );
}
