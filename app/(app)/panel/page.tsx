'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, RefreshCw, FlaskConical, ListChecks, BarChart3, ChevronRight, CreditCard, Award } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  adminSetPassword,
  adminDashboard,
  adminSetSetting,
  adminSetSimulatedCount,
  type AdminDashboard,
} from '@/lib/api/admin';
import { ModerationQueue } from '@/components/panel/ModerationQueue';
import { ColaAcademia } from '@/components/panel/ColaAcademia';
import { MetricasAcademia } from '@/components/panel/MetricasAcademia';
import { NegociosResumen } from '@/components/panel/NegociosResumen';
import { ObjetivosResumen } from '@/components/panel/ObjetivosResumen';
import { MercadoResumen } from '@/components/panel/MercadoResumen';
import { usePanelPass } from '@/components/panel/PanelPass';
import { AccesoPanel } from '@/components/panel/AccesoPanel';
import { PanelPendientes } from '@/components/panel/PanelPendientes';
import { CuentasPanel } from '@/components/panel/CuentasPanel';
import { EstadoAvisos } from '@/components/panel/EstadoAvisos';
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
  // La contraseña ya verificada vive en el layout de /panel, para no pedirla
  // de nuevo al volver de la cola de negocios. Lo que se tipea queda acá.
  const panel = usePanelPass();
  const [pass, setPass] = useState(panel.pass);
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [busy, setBusy] = useState(false);
  const [refresco, setRefresco] = useState(0);

  // Change passphrase
  const [changeTo, setChangeTo] = useState('');
  const [simCount, setSimCount] = useState('');

  useEffect(() => {
    if (panel.pass) void enter(panel.pass);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    panel.setPass(p);
    setPass(p);
    setData(res);
    setRefresco((n) => n + 1);
    setSimCount(String(res.stats.simulated_players ?? 0));
  }

  async function toggle(key: string, value: boolean) {
    const res = await adminSetSetting(pass, key, value);
    if (!res.ok) return toast.error('No se pudo cambiar', res.error);
    await enter();
  }

  // ── Locked: crear, entrar o recuperar ────────────────────────────────────
  if (!data) return <AccesoPanel onEntrar={(p) => enter(p)} ocupado={busy} />;

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

      <PanelPendientes pass={pass} refresco={refresco} />

      <nav aria-label="Secciones del panel" className="grid gap-2 sm:grid-cols-2">
        {[
          { href: '/panel/analitica', Icon: BarChart3, titulo: 'Analítica', bajada: 'Cuánta gente, quién usa qué, retención y embudos' },
          { href: '/panel/suscripciones', Icon: CreditCard, titulo: 'Suscripciones', bajada: 'Brote+, tiendas y empresas: precios, cobros y lo que falta' },
          { href: '/panel/desafios', Icon: Award, titulo: 'Desafíos para empresas', bajada: 'Publicar metas, revisar entregas y emitir certificados' },
        ].map(({ href, Icon, titulo, bajada }) => (
          <Link
            key={href}
            href={href}
            className="press group flex items-center gap-3 rounded-card border border-border bg-surface p-4 shadow-soft hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-primary/15 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-h3 font-bold">{titulo}</span>
              <span className="block text-caption text-muted-foreground">{bajada}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        ))}
      </nav>

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
          {Object.entries(data.settings)
            .filter(([, s]) => typeof s.value === 'boolean')
            .map(([key, s]) => (
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

      {/* Any numeric app_setting renders here automatically, so adding one
          server-side needs no change to this screen. */}
      <section>
        <h2 className="mb-2 font-display text-h3 font-bold">Valores</h2>
        <Card className="divide-y divide-border">
          {Object.entries(data.settings)
            .filter(([, s]) => typeof s.value === 'number')
            .map(([key, s]) => (
              <NumberSetting
                key={key}
                settingKey={key}
                description={s.description}
                value={s.value as number}
                busy={busy}
                onSave={async (v) => {
                  setBusy(true);
                  const res = await adminSetSetting(pass, key, v);
                  setBusy(false);
                  if (!res.ok) {
                    toast.error('No se pudo', res.error);
                    return;
                  }
                  toast.success('Guardado');
                  await enter();
                }}
              />
            ))}
        </Card>
      </section>

      {/* Moderation sits high on this screen on purpose: it is the only part
          of the panel where somebody is waiting on the other side. */}
      <div id="moderacion" className="scroll-mt-20">
        <ModerationQueue pass={pass} />
      </div>

      {/* Negocios y cierres de objetivos: igual que la moderación, del otro
          lado hay alguien esperando una respuesta. */}
      {/* Testing every account type and the island at every rank (0122). */}
      <Link
        href="/panel/pruebas"
        className="press group flex items-center gap-3 rounded-card border border-border bg-surface p-4 shadow-soft hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-primary/15 text-primary">
          <FlaskConical className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-h3 font-bold">Probar cada tipo de cuenta</span>
          <span className="block text-caption text-muted-foreground">
            Chicos, adolescentes, adultos, tiendas y empresas, el mundo en cada rango y los fallos en teléfonos
          </span>
        </span>
      </Link>
      {/* Acciones (0125): lo que se cambia, lo que no se hace, las reglas del día. */}
      <Link
        href="/panel/acciones"
        className="press group flex items-center gap-3 rounded-card border border-border bg-surface p-4 shadow-soft hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-primary/15 text-primary">
          <ListChecks className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-h3 font-bold">Cómo funcionan las acciones</span>
          <span className="block text-caption text-muted-foreground">
            Lo que la gente cambia y por qué, lo que no se hace, y las reglas del día
          </span>
        </span>
      </Link>
      <NegociosResumen pass={pass} />
      <ObjetivosResumen pass={pass} />
      <MercadoResumen pass={pass} />

      {/* La Academia. La cola va antes que los números por el mismo motivo que
          la moderación: es lo único de acá que bloquea contenido. Nada generado
          llega a nadie hasta que alguien lo mira. */}
      <div id="academia" className="scroll-mt-20">
        <ColaAcademia pass={pass} />
      </div>
      <MetricasAcademia pass={pass} />

      <section>
        <h2 className="mb-2 font-display text-h3 font-bold">Jugadores simulados</h2>
        <Card className="space-y-2.5 p-4">
          <p className="text-small text-muted-foreground">
            Cuántos jugadores simulados llenan los rankings públicos. Nunca aparecen en amigos ni en competencias.
            Poné 0 para eliminarlos por completo.
          </p>
          <div className="flex gap-2">
            <Input
              type="number"
              min={0}
              max={500}
              value={simCount}
              onChange={(e) => setSimCount(e.target.value)}
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

      <EstadoAvisos pass={pass} refresco={refresco} />

      <CuentasPanel pass={pass} />

      <section>
        <h2 className="mb-2 font-display text-h3 font-bold">Cambiar contraseña</h2>
        <Card className="space-y-2.5 p-4">
          <Input
            type="password"
            value={changeTo}
            onChange={(e) => setChangeTo(e.target.value)}
            placeholder="Contraseña nueva (mínimo 8)"
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
              panel.setPass(changeTo);
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

/**
 * One editable numeric setting. Keeps its own draft state so typing in one
 * field never re-renders or resets the others, and only offers Save once the
 * value actually differs from what is stored.
 */
function NumberSetting({
  settingKey,
  description,
  value,
  busy,
  onSave,
}: {
  settingKey: string;
  description: string | null;
  value: number;
  busy: boolean;
  onSave: (v: number) => void | Promise<void>;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const parsed = Number(draft);
  const dirty = draft.trim() !== '' && Number.isFinite(parsed) && parsed !== value;

  return (
    <div className="flex items-center gap-3 p-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-small font-medium">{description ?? settingKey}</p>
        <p className="text-caption text-muted-foreground">{settingKey}</p>
      </div>
      <Input
        type="number"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="w-24 shrink-0 text-right text-small tnum"
      />
      <Button size="sm" variant="secondary" disabled={!dirty || busy} onClick={() => onSave(parsed)}>
        Guardar
      </Button>
    </div>
  );
}
