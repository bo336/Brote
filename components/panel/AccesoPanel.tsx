'use client';

import { useEffect, useState } from 'react';
import { KeyRound, Lock, LogOut, ShieldAlert } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { adminEstadoAcceso, adminRecuperarClave, adminSetPassword, type EstadoAcceso } from '@/lib/api/admin';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/stores/toast';

/**
 * La puerta del panel (0127): crear la contraseña la primera vez, entrar, y
 * recuperarla desde una cuenta vinculada.
 */
export function AccesoPanel({ onEntrar, ocupado }: { onEntrar: (pass: string) => Promise<void>; ocupado: boolean }) {
  const [estado, setEstado] = useState<EstadoAcceso | null | undefined>(undefined);
  const [pass, setPass] = useState('');
  const [modo, setModo] = useState<'entrar' | 'recuperar'>('entrar');

  useEffect(() => {
    adminEstadoAcceso().then(setEstado);
    // Vuelve del reingreso pedido para recuperar la contraseña.
    if (new URLSearchParams(window.location.search).get('recuperar') === '1') setModo('recuperar');
  }, []);

  if (estado === undefined) {
    return (
      <div className="mx-auto max-w-md space-y-3 py-10">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (estado && !estado.configurado) return <PrimeraVez estado={estado} onCreada={onEntrar} />;

  if (estado && estado.con_cuentas && !estado.soy_admin) {
    return (
      <Puerta icono={<ShieldAlert className="h-5 w-5 text-brote-coral" />} titulo="Esta cuenta no está vinculada">
        <p className="text-small leading-relaxed text-muted-foreground">
          El panel sólo se abre desde las cuentas del equipo. Salí y entrá con la cuenta vinculada; desde ella se pueden
          sumar otras.
        </p>
        <BotonSalir />
      </Puerta>
    );
  }

  if (modo === 'recuperar' && estado) return <Recuperar estado={estado} onVolver={() => setModo('entrar')} onLista={onEntrar} />;

  return (
    <Puerta icono={<Lock className="h-5 w-5 text-muted-foreground" />} titulo="Panel">
      <Input
        type="password"
        value={pass}
        onChange={(e) => setPass(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && pass && void onEntrar(pass)}
        placeholder="Contraseña"
        aria-label="Contraseña del panel"
        autoFocus
      />
      <Button block variant="primary" onClick={() => onEntrar(pass)} loading={ocupado} disabled={!pass}>
        Entrar
      </Button>
      <div className="flex items-center justify-between gap-3 pt-1">
        <p className="text-caption text-muted-foreground">Después de 8 intentos fallidos se bloquea 15 minutos.</p>
        {estado?.soy_admin && (
          <button
            type="button"
            onClick={() => setModo('recuperar')}
            className="shrink-0 rounded-sm text-caption font-medium text-primary hover:text-brote-green-deep"
          >
            <span className="link-underline">Olvidé la contraseña</span>
          </button>
        )}
      </div>
      {estado && !estado.con_cuentas && (
        <p className="border-t border-hairline pt-3 text-caption leading-relaxed text-muted-foreground">
          ¿Olvidaste la contraseña y todavía no vinculaste ninguna cuenta? Se reinicia una sola vez desde el editor SQL de
          Supabase; las instrucciones están en <code className="text-foreground">docs/LANZAMIENTO.md</code> §8.
        </p>
      )}
    </Puerta>
  );
}

function Puerta({ icono, titulo, children }: { icono: React.ReactNode; titulo: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md py-10">
      <Card className="space-y-3 p-5">
        <div className="flex items-center gap-2">
          {icono}
          <h1 className="font-display text-h2 font-bold">{titulo}</h1>
        </div>
        {children}
      </Card>
    </div>
  );
}

function BotonSalir({ label = 'Salir y entrar con otra cuenta', next = '/panel' }: { label?: string; next?: string }) {
  const [saliendo, setSaliendo] = useState(false);
  return (
    <Button
      block
      variant="secondary"
      loading={saliendo}
      onClick={async () => {
        setSaliendo(true);
        await createClient().auth.signOut();
        window.location.href = `/auth/login?next=${encodeURIComponent(next)}`;
      }}
    >
      <LogOut className="h-4 w-4" /> {label}
    </Button>
  );
}

function PrimeraVez({ estado, onCreada }: { estado: EstadoAcceso; onCreada: (pass: string) => Promise<void> }) {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [ocupado, setOcupado] = useState(false);

  async function crear() {
    if (a !== b) return toast.error('No coinciden', 'Las dos contraseñas tienen que ser iguales');
    setOcupado(true);
    const r = await adminSetPassword(a);
    setOcupado(false);
    if (!r.ok) return toast.error('No se pudo guardar', r.error);
    toast.success('Contraseña creada', 'Esta cuenta quedó vinculada al panel.');
    await onCreada(a);
  }

  if (estado.con_cuentas && !estado.soy_admin) return null;

  return (
    <Puerta icono={<KeyRound className="h-5 w-5 text-primary" />} titulo="Crear contraseña del panel">
      <p className="text-small leading-relaxed text-muted-foreground">
        La cuenta con la que la crees queda vinculada al panel: desde ahí se entra, se reciben los avisos y se puede
        recuperar si algún día la olvidás.
      </p>
      <Input type="password" value={a} onChange={(e) => setA(e.target.value)} placeholder="Contraseña nueva (mínimo 8)" />
      <Input
        type="password"
        value={b}
        onChange={(e) => setB(e.target.value)}
        placeholder="Repetila"
        invalid={b.length > 0 && a !== b}
      />
      <Button block variant="primary" onClick={crear} loading={ocupado} disabled={a.length < 8}>
        Guardar
      </Button>
    </Puerta>
  );
}

function Recuperar({
  estado,
  onVolver,
  onLista,
}: {
  estado: EstadoAcceso;
  onVolver: () => void;
  onLista: (pass: string) => Promise<void>;
}) {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [reingresar, setReingresar] = useState(!estado.ingreso_reciente);

  async function guardar() {
    if (a !== b) return toast.error('No coinciden', 'Las dos contraseñas tienen que ser iguales');
    setOcupado(true);
    const r = await adminRecuperarClave(a);
    setOcupado(false);
    if (!r.ok) {
      if (r.reingresar) setReingresar(true);
      return toast.error('No se pudo cambiar', r.error);
    }
    toast.success('Contraseña nueva guardada');
    await onLista(a);
  }

  return (
    <Puerta icono={<KeyRound className="h-5 w-5 text-primary" />} titulo="Recuperar la contraseña">
      {reingresar ? (
        <>
          <p className="text-small leading-relaxed text-muted-foreground">
            Por seguridad, para cambiarla sin saber la anterior hace falta haber entrado a Brote hace menos de 15
            minutos. Salí, volvé a entrar con esta misma cuenta y vas a volver acá directo.
          </p>
          <BotonSalir label="Salir y volver a entrar" next="/panel?recuperar=1" />
        </>
      ) : (
        <>
          <p className="text-small leading-relaxed text-muted-foreground">
            Elegí una contraseña nueva de al menos 10 caracteres. La anterior deja de funcionar en el acto.
          </p>
          <Input type="password" value={a} onChange={(e) => setA(e.target.value)} placeholder="Contraseña nueva" autoFocus />
          <Input type="password" value={b} onChange={(e) => setB(e.target.value)} placeholder="Repetila" invalid={b.length > 0 && a !== b} />
          <Button block variant="primary" onClick={guardar} loading={ocupado} disabled={a.length < 10}>
            Guardar contraseña nueva
          </Button>
        </>
      )}
      <Button block variant="ghost" onClick={onVolver}>
        Volver
      </Button>
    </Puerta>
  );
}
