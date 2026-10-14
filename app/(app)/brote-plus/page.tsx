'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  Ban,
  BarChart3,
  Check,
  Droplet,
  FlaskConical,
  Loader2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Pip } from '@/components/pip/Pip';
import { Sheet } from '@/components/ui/sheet';
import { useAds } from '@/components/ads/AdsProvider';
import { fetchEstadoPlus, type EstadoPlus } from '@/lib/api/plus';
import { cancelarBrotePlus, iniciarBrotePlus } from '@/lib/pagos/plus-acciones';
import { registrarEvento } from '@/lib/analitica';
import { useSession } from '@/stores/session';
import { toast } from '@/stores/toast';
import { haptic } from '@/lib/utils/haptics';
import { cn } from '@/lib/utils/cn';

/**
 * Brote+ (LANZAMIENTO F5). Lo que se promete acá existe y está medido:
 * cada beneficio tiene su lugar en la base (0131) o en la app. Lo que no
 * existía (biomas exclusivos) se sacó en vez de dejarlo escrito.
 */
const PERKS = [
  { Icon: Ban, tint: '#FF6B5E', title: 'Cero publicidad', body: 'Nunca más un anuncio en toda la app.' },
  {
    Icon: Droplet,
    tint: '#2DB4D4',
    title: 'Savia ilimitada en la Academia',
    body: 'Todas las hojas nuevas que quieras por día. Repasar sigue siendo gratis para todo el mundo.',
  },
  {
    Icon: ShieldCheck,
    tint: '#1FB57A',
    title: '2 protectores de racha por mes',
    body: 'Se suman solos cada mes (hasta 4 guardados), para los días en que la vida se complica.',
  },
  {
    Icon: FlaskConical,
    tint: '#B07CD6',
    title: 'Pip Eco-Experto',
    body: 'Respuestas más profundas sobre ambiente y cinco veces más charlas por día.',
  },
  { Icon: BarChart3, tint: '#FFB23E', title: 'Tu impacto mes a mes', body: 'Los últimos 12 meses de agua, CO₂, residuos y energía, mes por mes.' },
  { Icon: Sparkles, tint: '#5B6CF0', title: 'Pip Cosmos y la insignia Brote+', body: 'Un estilo exclusivo para Pip y la marca de quien sostiene el proyecto.' },
];

const ERRORES: Record<string, string> = {
  no_configurado: 'Los pagos se están habilitando. Probá de nuevo más tarde.',
  venta_cerrada: 'Brote+ todavía no está a la venta.',
  ya_suscripta: 'Ya tenés una suscripción activa.',
  menor: 'Brote+ lo contrata una persona adulta.',
  sin_cotizacion: 'No pudimos calcular el precio de hoy. Probá en un rato.',
  mp_error: 'Mercado Pago no respondió. Probá de nuevo en un rato.',
  no_autenticado: 'Volvé a entrar a tu cuenta y probá de nuevo.',
};

const pesos = (n: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
const dolares = (n: number) => `USD ${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

export default function BrotePlusPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <BrotePlus />
    </Suspense>
  );
}

function BrotePlus() {
  const params = useSearchParams();
  const volvio = params.get('estado') === 'volvio';
  const reduce = useReducedMotion();
  const { refresh } = useAds();
  const profile = useSession((s) => s.profile);
  const [estado, setEstado] = useState<EstadoPlus | null | undefined>(undefined);
  const [periodo, setPeriodo] = useState<'mes' | 'anio'>('anio');
  const [busy, setBusy] = useState(false);
  const [confirmarBaja, setConfirmarBaja] = useState(false);

  const cargar = useCallback(async () => {
    const e = await fetchEstadoPlus();
    setEstado(e);
    return e;
  }, []);

  useEffect(() => {
    registrarEvento('plus_visto');
    void cargar();
  }, [cargar]);

  // Volvió de Mercado Pago: el webhook tarda unos segundos. Se consulta cada
  // 4 s durante un minuto, y apenas se confirma se refresca la publicidad.
  useEffect(() => {
    if (!volvio) return;
    let vueltas = 0;
    const id = setInterval(async () => {
      vueltas++;
      const e = await cargar();
      if (e?.es_plus || vueltas >= 15) {
        clearInterval(id);
        if (e?.es_plus) void refresh();
      }
    }, 4000);
    return () => clearInterval(id);
  }, [volvio, cargar, refresh]);

  async function suscribir() {
    if (busy) return;
    setBusy(true);
    haptic('medium');
    registrarEvento('plus_iniciar');
    const r = await iniciarBrotePlus(periodo);
    if (r.ok && r.init_point) {
      window.location.href = r.init_point;
      return;
    }
    setBusy(false);
    toast.error('No se pudo iniciar', ERRORES[r.ok ? 'mp_error' : r.error] ?? 'Probá de nuevo en un rato.');
  }

  async function darDeBaja() {
    setBusy(true);
    const r = await cancelarBrotePlus();
    setBusy(false);
    setConfirmarBaja(false);
    if (!r.ok) return toast.error('No se pudo', ERRORES[r.error] ?? 'Probá de nuevo en un rato.');
    toast.success('Listo', 'No se te va a cobrar de nuevo. Seguís con Brote+ hasta el final de lo pagado.');
    await cargar();
  }

  const tipo = estado?.tipo ?? profile?.accountType;
  const mes = estado?.precios.mes;
  const anio = estado?.precios.anio;
  const ahorro =
    mes?.ars && anio?.ars ? Math.max(0, Math.round(100 - (100 * anio.ars) / (mes.ars * 12))) : null;
  const sub = estado?.suscripcion;
  const activa = sub?.estado === 'authorized';
  const elegido = periodo === 'anio' ? anio : mes;

  return (
    <div className="space-y-5 pb-8">
      <Link
        href="/perfil"
        className="inline-flex items-center gap-1.5 text-small text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Perfil
      </Link>

      <Card className="relative flex flex-col items-center gap-2 overflow-hidden bg-gradient-to-b from-primary/15 to-transparent p-6 text-center shadow-soft-lg">
        <div className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-brote-sun/20 blur-3xl" />
        <Pip size={96} mood="celebrating" aura pipStyle={profile?.pipStyle} />
        <h1 className="bg-brand-gradient bg-clip-text font-display text-display-l font-extrabold text-transparent">Brote+</h1>
        <p className="max-w-xs text-balance text-small leading-relaxed text-muted-foreground">
          Sostenés el proyecto, se va la publicidad y sumás extras. Todo lo que hace crecer tu mundo sigue siendo gratis,
          siempre.
        </p>
      </Card>

      {volvio && !estado?.es_plus && (
        <Card className="flex items-center gap-3 p-4" role="status">
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
          <p className="text-small">Estamos confirmando el pago con Mercado Pago. Tarda unos segundos.</p>
        </Card>
      )}

      {estado === undefined ? (
        <Skeleton className="h-64 w-full" />
      ) : estado?.es_plus ? (
        <Card className="space-y-3 p-5">
          <p className="font-display text-h2 font-bold text-brote-green">Sos Brote+ 🌟</p>
          <dl className="divide-y divide-hairline text-small">
            {estado.hasta && (
              <div className="flex justify-between gap-3 py-2">
                <dt className="text-muted-foreground">{activa ? 'Próximo cobro' : 'Brote+ hasta'}</dt>
                <dd className="font-medium">{fecha(activa && sub?.proximo ? sub.proximo : estado.hasta)}</dd>
              </div>
            )}
            {sub && (
              <div className="flex justify-between gap-3 py-2">
                <dt className="text-muted-foreground">Plan</dt>
                <dd className="font-medium">
                  {sub.periodo === 'anio' ? 'Anual' : 'Mensual'}
                  {sub.monto ? ` · ${pesos(sub.monto)}` : ''}
                </dd>
              </div>
            )}
            <div className="flex justify-between gap-3 py-2">
              <dt className="text-muted-foreground">Protectores de racha guardados</dt>
              <dd className="font-medium tnum">{estado.protectores}</dd>
            </div>
          </dl>
          {activa ? (
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setConfirmarBaja(true)}>
              Darme de baja
            </Button>
          ) : (
            <p className="text-caption text-muted-foreground">
              Te diste de baja: no se te vuelve a cobrar y seguís con todo hasta esa fecha.
            </p>
          )}
        </Card>
      ) : null}

      {estado !== undefined && !estado?.es_plus && (
        <>
          <Card className="divide-y divide-hairline overflow-hidden p-0">
            {PERKS.map(({ Icon, tint, title, body }) => (
              <div key={title} className="flex items-start gap-3 p-3.5">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px]"
                  style={{ backgroundColor: `${tint}22`, color: tint }}
                >
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-small font-semibold leading-tight">{title}</p>
                  <p className="mt-0.5 text-caption leading-relaxed text-muted-foreground">{body}</p>
                </div>
                <Check className="mt-1 h-4 w-4 shrink-0 text-brote-green" />
              </div>
            ))}
          </Card>

          {tipo === 'kid' ? (
            <Card className="p-4 text-center">
              <p className="text-small font-semibold">Esta cuenta es de una persona menor de 13 🌱</p>
              <p className="mt-1 text-small text-muted-foreground">
                Las cuentas de chicos nunca ven publicidad y no pueden suscribirse. Si querés apoyar el proyecto, puede
                hacerlo una persona adulta desde su propia cuenta.
              </p>
            </Card>
          ) : tipo === 'teen' ? (
            <Card className="p-4 text-center">
              <p className="text-small font-semibold">Brote+ lo contrata una persona adulta</p>
              <p className="mt-1 text-small text-muted-foreground">
                Es un pago que se repite, así que una cuenta adolescente no se suscribe sola. Si en tu casa quieren
                apoyar el proyecto, pueden hacerlo desde la cuenta de una persona adulta.
              </p>
            </Card>
          ) : !estado?.venta_activa ? (
            <Card className="p-4 text-center">
              <p className="text-small font-semibold">Brote+ abre muy pronto</p>
              <p className="mt-1 text-small text-muted-foreground">
                Estamos terminando de prepararlo. Cuando abra, te enterás por acá.
              </p>
            </Card>
          ) : (
            <>
              <div role="radiogroup" aria-label="Cada cuánto pagar" className="grid grid-cols-2 gap-2">
                {(['mes', 'anio'] as const).map((p) => {
                  const pr = p === 'anio' ? anio : mes;
                  const on = periodo === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setPeriodo(p)}
                      className={cn(
                        'press relative rounded-card border p-3.5 text-left transition-[border-color,background-color,box-shadow]',
                        on ? 'border-primary bg-primary/10 ring-2 ring-primary/25' : 'border-border bg-surface hover:border-primary/40',
                      )}
                    >
                      {p === 'anio' && ahorro ? (
                        <span className="absolute -top-2.5 right-3 rounded-pill bg-brote-sun px-2 py-0.5 text-[11px] font-bold text-brote-ink">
                          Ahorrás {ahorro} %
                        </span>
                      ) : null}
                      <span className="eyebrow block text-muted-foreground">{p === 'anio' ? 'Anual' : 'Mensual'}</span>
                      <span className="mt-1 block font-display text-h2 font-bold tnum">
                        {pr?.ars ? pesos(pr.ars) : '—'}
                      </span>
                      <span className="block text-caption text-muted-foreground">
                        {p === 'anio' ? 'por año' : 'por mes'}
                        {pr?.ars && p === 'anio' ? ` · ${pesos(Math.round(pr.ars / 12))} por mes` : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
              <motion.div initial={false} animate={{ opacity: 1 }} transition={{ duration: reduce ? 0 : 0.2 }}>
                <Button block variant="primary" size="lg" loading={busy} onClick={suscribir} disabled={!elegido?.ars}>
                  <Sparkles className="h-4 w-4" /> Suscribirme {periodo === 'anio' ? 'por un año' : 'por mes'}
                </Button>
              </motion.div>
              <p className="text-center text-caption leading-relaxed text-muted-foreground">
                {elegido?.ars
                  ? `${dolares(elegido.usd)} al dólar oficial de hoy. Se renueva solo y te das de baja cuando quieras, desde acá.`
                  : 'No pudimos calcular el precio de hoy. Probá en un rato.'}{' '}
                El pago lo procesa Mercado Pago.
              </p>
            </>
          )}
        </>
      )}

      <Sheet open={confirmarBaja} onOpenChange={setConfirmarBaja} title="¿Darte de baja de Brote+?">
        <p className="text-small leading-relaxed text-muted-foreground">
          No se te vuelve a cobrar. Seguís con todos los beneficios hasta el final del período que ya pagaste, y todo lo
          que hiciste en Brote sigue siendo tuyo.
        </p>
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setConfirmarBaja(false)}>
            Seguir con Brote+
          </Button>
          <Button variant="danger" className="flex-1" loading={busy} onClick={darDeBaja}>
            Darme de baja
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
