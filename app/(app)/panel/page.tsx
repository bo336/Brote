'use client';

import { useEffect, useState } from 'react';
import { Lock, ShieldCheck, RefreshCw, KeyRound } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  adminIsConfigured,
  adminSetPassword,
  adminDashboard,
  adminSetSetting,
  adminSetSimulatedCount,
  type AdminDashboard,
} from '@/lib/api/admin';
import { toast } from '@/stores/toast';

/**
 * Hidden owner console at /panel.
 *
 * Nothing in the app links here — it is reached by typing the URL. That is
 * obscurity, not security, so the real protection is a passphrase verified
 * server-side (hashed with a per-install salt) and required again on every
 * write, so a stale open tab cannot be used to flip switches.
 *
 * The passphrase is kept in component state only: never in localStorage, so it
 * does not survive a refresh or sit around on a shared machine.
 */
const inputCls =
  'w-full rounded-button border border-border bg-surface px-3 py-2.5 text-body outline-none transition-colors focus:border-primary';

const STAT_LABELS: Record<string, string> = {
  real_users: 'Usuarios reales',
  simulated_players: 'Jugadores simulados',
  onboarded: 'Completaron el onboarding',
  pro_users: 'Suscriptores Brote+',
  active_7d: 'Activos (7 días)',
  completions_total: 'Acciones completadas',
  completions_7d: 'Acciones (7 días)',
  activities: 'Acciones en el catálogo',
  lessons: 'Lecciones',
  news_active: 'Noticias activas',
  feed_posts: 'Publicaciones del feed',
  competitions: 'Competencias',
  projects: 'Proyectos',
};

export default function PanelPage() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [pass, setPass] = useState('');
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [busy, setBusy] = useState(false);

  // First-run setup
  const [newPass, setNewPass] = useState('');
  const [newPass2, setNewPass2] = useState('');
  // Change passphrase
  const [changeTo, setChangeTo] = useState('');
  const [simCount, setSimCount] = useState('');

  useEffect(() => {
    adminIsConfigured().then(setConfigured);
  }, []);

  async function enter(p = pass) {
    if (!p) return;
    setBusy(true);
    const res = await adminDashboard(p);
    setBusy(false);
    if (!res.ok) {
      toast.error('No se pudo entrar', res.error ?? 'Contraseña incorrecta');
      return;
    }
    setData(res);
    setSimCount(String(res.stats.simulated_players ?? 0));
  }

  async function firstRun() {
    if (newPass !== newPass2) return toast.error('No coinciden', 'Las dos contraseñas tienen que ser iguales');
    setBusy(true);
    const res = await adminSetPassword(newPass);
    setBusy(false);
    if (!res.ok) return toast.error('No se pudo guardar', res.error);
    toast.success('Contraseña creada');
    setConfigured(true);
    setPass(newPass);
    await enter(newPass);
  }

  async function toggle(key: string, value: boolean) {
    const res = await adminSetSetting(pass, key, value);
    if (!res.ok) return toast.error('No se pudo cambiar', res.error);
    await enter();
  }

  if (configured === null) {
    return (
      <div className="mx-auto max-w-md space-y-3 py-10">
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // ── First run: nobody has set a passphrase yet ────────────────────────────
  if (!configured) {
    return (
      <div className="mx-auto max-w-md py-10">
        <Card className="space-y-3 p-5">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            <h1 className="font-display text-h2 font-bold">Crear contraseña del panel</h1>
          </div>
          <p className="text-small text-muted-foreground">
            Todavía no hay contraseña. La primera que pongas queda guardada (encriptada) y después vas a poder
            cambiarla desde acá.
          </p>
          <input
            type="password"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            placeholder="Contraseña nueva (mínimo 8)"
            className={inputCls}
          />
          <input
            type="password"
            value={newPass2}
            onChange={(e) => setNewPass2(e.target.value)}
            placeholder="Repetila"
            className={inputCls}
          />
          <Button block variant="primary" onClick={firstRun} loading={busy} disabled={newPass.length < 8}>
            Guardar
          </Button>
        </Card>
      </div>
    );
  }

  // ── Locked ────────────────────────────────────────────────────────────────
  if (!data) {
    return (
      <div className="mx-auto max-w-md py-10">
        <Card className="space-y-3 p-5">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <h1 className="font-display text-h2 font-bold">Panel</h1>
          </div>
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && enter()}
            placeholder="Contraseña"
            autoFocus
            className={inputCls}
          />
          <Button block variant="primary" onClick={() => enter()} loading={busy} disabled={!pass}>
            Entrar
          </Button>
          <p className="text-caption text-muted-foreground">
            Después de 8 intentos fallidos se bloquea por 15 minutos.
          </p>
        </Card>
      </div>
    );
  }

  // ── Console ───────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl space-y-5 py-6 pb-16">
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-brote-green" />
          <h1 className="font-display text-h1 font-bold">Panel</h1>
        </div>
        <Button variant="secondary" size="sm" onClick={() => enter()} loading={busy}>
          <RefreshCw className="h-4 w-4" /> Actualizar
        </Button>
      </header>

      <section>
        <h2 className="mb-2 font-display text-h3 font-bold">Números</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Object.entries(data.stats).map(([k, v]) => (
            <Card key={k} className="p-3">
              <p className="font-display text-h2 font-bold tnum">{v.toLocaleString('es-AR')}</p>
              <p className="text-caption text-muted-foreground">{STAT_LABELS[k] ?? k}</p>
            </Card>
          ))}
        </div>
        <p className="mt-2 text-caption text-muted-foreground">
          &quot;Usuarios reales&quot; nunca incluye jugadores simulados. Es el número que corresponde usar si hablás
          públicamente de cuánta gente usa Brote.
        </p>
      </section>

      <section>
        <h2 className="mb-2 font-display text-h3 font-bold">Interruptores</h2>
        <Card className="divide-y divide-border">
          {Object.entries(data.settings).map(([key, s]) => (
            <div key={key} className="flex items-center gap-3 p-3.5">
              <div className="min-w-0 flex-1">
                <p className="text-small font-medium">{s.description ?? key}</p>
                <p className="text-caption text-muted-foreground">{key}</p>
              </div>
              <Switch checked={s.value === true} onCheckedChange={(v) => toggle(key, v)} />
            </div>
          ))}
        </Card>
      </section>

      <section>
        <h2 className="mb-2 font-display text-h3 font-bold">Jugadores simulados</h2>
        <Card className="space-y-2.5 p-4">
          <p className="text-small text-muted-foreground">
            Cuántos jugadores simulados llenan los rankings públicos. Nunca aparecen en amigos ni en competencias.
            Poné 0 para eliminarlos por completo.
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              max={500}
              value={simCount}
              onChange={(e) => setSimCount(e.target.value)}
              className={inputCls}
            />
            <Button
              variant="secondary"
              loading={busy}
              onClick={async () => {
                setBusy(true);
                const res = await adminSetSimulatedCount(pass, Number(simCount) || 0);
                setBusy(false);
                if (!res.ok) return toast.error('No se pudo', res.error);
                toast.success('Listo', `Ahora hay ${res.count} jugadores simulados`);
                await enter();
              }}
            >
              Aplicar
            </Button>
          </div>
        </Card>
      </section>

      <section>
        <h2 className="mb-2 font-display text-h3 font-bold">Cambiar contraseña</h2>
        <Card className="space-y-2.5 p-4">
          <input
            type="password"
            value={changeTo}
            onChange={(e) => setChangeTo(e.target.value)}
            placeholder="Contraseña nueva (mínimo 8)"
            className={inputCls}
          />
          <Button
            variant="secondary"
            loading={busy}
            disabled={changeTo.length < 8}
            onClick={async () => {
              setBusy(true);
              const res = await adminSetPassword(changeTo, pass);
              setBusy(false);
              if (!res.ok) return toast.error('No se pudo cambiar', res.error);
              toast.success('Contraseña actualizada');
              setPass(changeTo);
              setChangeTo('');
            }}
          >
            Cambiar
          </Button>
        </Card>
      </section>
    </div>
  );
}
