'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, BellOff, Link2, UserMinus, UserPlus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  adminCuentas,
  adminDesvincularCuenta,
  adminVincularCuenta,
  type CuentaPanel,
} from '@/lib/api/admin';
import { toast } from '@/stores/toast';

/**
 * Las cuentas del equipo (0127). Con al menos una vinculada, la contraseña del
 * panel sólo sirve desde estas cuentas, y son las que reciben los avisos de lo
 * que espera una respuesta.
 */
export function CuentasPanel({ pass }: { pass: string }) {
  const [cuentas, setCuentas] = useState<CuentaPanel[] | null>(null);
  const [email, setEmail] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const cargar = useCallback(async () => {
    const r = await adminCuentas(pass);
    setCuentas(r.ok ? (r.cuentas ?? []) : []);
  }, [pass]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function vincular(mail?: string) {
    setOcupado(true);
    const r = await adminVincularCuenta(pass, mail);
    setOcupado(false);
    if (!r.ok) return toast.error('No se pudo vincular', r.error);
    toast.success('Cuenta vinculada', mail ? `${mail} ya puede entrar al panel.` : 'Esta cuenta queda atada al panel.');
    setEmail('');
    await cargar();
  }

  async function desvincular(c: CuentaPanel) {
    setOcupado(true);
    const r = await adminDesvincularCuenta(pass, c.user_id);
    setOcupado(false);
    if (!r.ok) return toast.error('No se pudo', r.error);
    await cargar();
  }

  const soyParte = cuentas?.some((c) => c.soy_yo) ?? false;

  return (
    <section aria-labelledby="cuentas-titulo">
      <h2 id="cuentas-titulo" className="mb-1 font-display text-h3 font-bold">
        Cuentas del panel
      </h2>
      <p className="mb-2 text-caption leading-relaxed text-muted-foreground">
        Con una cuenta vinculada, la contraseña sola ya no abre el panel: también hay que estar con una de estas cuentas.
        Son las que reciben los avisos de lo que espera una respuesta, y desde ellas se puede recuperar la contraseña.
      </p>
      <Card className="divide-y divide-hairline overflow-hidden p-0">
        {cuentas === null ? (
          <div className="skeleton m-4 h-10 rounded-button" />
        ) : cuentas.length === 0 ? (
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <p className="flex-1 text-small text-muted-foreground">
              Todavía no hay ninguna cuenta vinculada: el panel se abre sólo con la contraseña, desde cualquier cuenta.
            </p>
            <Button size="sm" variant="primary" loading={ocupado} onClick={() => vincular()}>
              <Link2 className="h-4 w-4" /> Vincular esta cuenta
            </Button>
          </div>
        ) : (
          cuentas.map((c) => (
            <div key={c.user_id} className="flex items-center gap-3 px-4 py-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-small font-semibold">
                  {c.nombre ?? c.username ?? c.email} {c.soy_yo && <span className="text-primary">· vos</span>}
                </span>
                <span className="block truncate text-caption text-muted-foreground">{c.email}</span>
              </span>
              <span
                title={c.avisos ? 'Recibe avisos en el teléfono' : 'Sin avisos activados en ningún dispositivo'}
                className={c.avisos ? 'text-primary' : 'text-muted-foreground'}
              >
                {c.avisos ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              </span>
              {cuentas.length > 1 && (
                <Button size="icon-sm" variant="ghost" aria-label={`Desvincular ${c.email}`} onClick={() => desvincular(c)}>
                  <UserMinus className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))
        )}
        {cuentas && cuentas.length > 0 && (
          <form
            className="flex gap-2 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (email.trim()) void vincular(email.trim());
            }}
          >
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo de otra cuenta de Brote"
              aria-label="Correo de la cuenta a vincular"
              className="h-9 text-small"
            />
            <Button type="submit" size="sm" variant="secondary" loading={ocupado} disabled={!email.trim()}>
              <UserPlus className="h-4 w-4" /> Vincular
            </Button>
          </form>
        )}
      </Card>
      {cuentas && cuentas.length > 0 && !soyParte && (
        <p className="mt-2 text-caption text-brote-coral">Esta cuenta no figura: no deberías estar viendo esto.</p>
      )}
      {cuentas?.some((c) => c.soy_yo && !c.avisos) && (
        <p className="mt-2 text-caption text-muted-foreground">
          Activá los avisos en Ajustes → Notificaciones desde tu teléfono para enterarte apenas llega algo.
        </p>
      )}
    </section>
  );
}
