'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PauseCircle, UserRoundCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/input';
import { cederProyecto, fetchOrganizacionProyecto } from '@/lib/api/ligas';
import { toast } from '@/stores/toast';

/**
 * Lo que ve quien organiza cuando su liga ya no alcanza para este proyecto, y
 * la forma de pasárselo a alguien. Nadie que se sumó pierde su lugar: el
 * proyecto sigue, y sólo se pausa si se termina el plazo sin resolverlo.
 */
export function OrganizarProyecto({ proyectoId }: { proyectoId: string }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['proyecto-organizacion', proyectoId],
    queryFn: () => fetchOrganizacionProyecto(proyectoId),
  });
  const [elegido, setElegido] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [abierto, setAbierto] = useState(false);

  const d = q.data;
  if (!d?.ok) return null;

  const candidatos = d.candidatos ?? [];
  const pausado = !!d.pausado_at;
  const enGracia = !pausado && d.dias_restantes != null;
  const minimo = d.cupo?.min_nombre ?? '';

  async function ceder() {
    if (!elegido) return;
    setOcupado(true);
    const r = await cederProyecto(proyectoId, elegido);
    setOcupado(false);
    if (!r.ok) return toast.error('No se pudo pasar', r.error);
    toast.success('Listo', 'El proyecto ya tiene quien lo organice.');
    void qc.invalidateQueries({ queryKey: ['project', proyectoId] });
    void qc.invalidateQueries({ queryKey: ['proyecto-organizacion', proyectoId] });
    void qc.invalidateQueries({ queryKey: ['proyecto-cupo'] });
    void qc.invalidateQueries({ queryKey: ['projects'] });
  }

  const ceder_ui = (
    <div className="mt-3">
      {candidatos.length === 0 ? (
        <p className="text-caption leading-relaxed text-muted-foreground">
          Se lo podés pasar a una persona adulta que se haya sumado y tenga cupo libre. Por ahora no hay nadie así.
        </p>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={elegido} onChange={(e) => setElegido(e.target.value)} aria-label="Elegí quién lo organiza" className="flex-1">
            <option value="">Elegí a quién…</option>
            {candidatos.map((c) => (
              <option key={c.user_id} value={c.user_id}>
                {c.nombre}
              </option>
            ))}
          </Select>
          <Button variant="secondary" disabled={!elegido} loading={ocupado} onClick={() => void ceder()}>
            <UserRoundCheck className="h-4 w-4" /> Pasárselo
          </Button>
        </div>
      )}
    </div>
  );

  if (pausado || enGracia) {
    return (
      <Card className="border-brote-coral/40 bg-brote-coral/10 p-4">
        <p className="flex items-center gap-2 font-semibold">
          <PauseCircle className="h-5 w-5 shrink-0 text-brote-coral" />
          {pausado ? 'Este proyecto está en pausa' : 'Este proyecto ya no entra en tu liga'}
        </p>
        <p className="mt-1.5 text-small leading-relaxed text-muted-foreground">
          {pausado
            ? `No aparece en las listas y nadie nuevo se puede sumar; quienes ya estaban conservan su lugar. Vuelve solo cuando tengas cupo${minimo ? ` (desde ${minimo})` : ''}, o pasáselo a alguien.`
            : `Tenés ${d.dias_restantes} ${d.dias_restantes === 1 ? 'día' : 'días'} para recuperar tu liga${minimo ? ` (desde ${minimo})` : ''} o pasárselo a alguien. Si no, se pone en pausa. Mientras tanto sigue igual y nadie pierde su lugar.`}
        </p>
        {ceder_ui}
      </Card>
    );
  }

  return (
    <div>
      <button type="button" onClick={() => setAbierto((v) => !v)} className="text-caption font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground">
        Pasarle el proyecto a otra persona
      </button>
      {abierto && ceder_ui}
    </div>
  );
}
