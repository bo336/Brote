'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock, Copy, Search, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/input';
import { Sheet } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { BRAND } from '@/lib/brand';
import {
  arrepentirmeAhora,
  bajaAhora,
  consultarPedido,
  enviarPedido,
  misServicios,
  type EstadoPedido,
  type MisServicios,
} from '@/lib/consumidor/acciones';
import {
  ATENCION,
  DIAS_ARREPENTIMIENTO,
  ERROR_PEDIDO,
  ESTADO_PEDIDO,
  PLAN_NEGOCIO,
  SERVICIOS,
  codigoValido,
  diasDesde,
  type Servicio,
  type TipoPedido,
} from '@/lib/consumidor/reglas';
import { cn } from '@/lib/utils/cn';

/**
 * El formulario de los dos botones (0147). Sin cuenta: nombre, correo y qué
 * servicio, y el código sale en el momento. Con la sesión iniciada, además, lo
 * contratado se da de baja (o se devuelve) desde acá mismo.
 */

export type Hecho = { codigo: string; mensaje?: string; hecho?: boolean };
type Accion = { titulo: string; detalle: string; boton: string; correr: () => Promise<Awaited<ReturnType<typeof bajaAhora>>> };

const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

export function PedidoConsumidor({
  tipo,
  codigoInicial,
  vista,
}: {
  tipo: TipoPedido;
  codigoInicial?: string;
  /** Datos fijos para mirar la pantalla sin cuenta (vista previa); en la app no se pasa. */
  vista?: { servicios?: MisServicios; hecho?: Hecho };
}) {
  const [ms, setMs] = useState<MisServicios | null>(vista?.servicios ?? null);
  const [cargando, setCargando] = useState(!vista?.servicios);
  const [hecho, setHecho] = useState<Hecho | null>(vista?.hecho ?? null);
  const [confirmar, setConfirmar] = useState<Accion | null>(null);
  const [corriendo, setCorriendo] = useState(false);

  const [servicio, setServicio] = useState<Servicio>('brote_plus');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [referencia, setReferencia] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (vista?.servicios) return;
    misServicios()
      .then((r) => {
        setMs(r.ok ? r : null);
        if (r.ok) {
          setNombre((n) => n || (r.nombre ?? ''));
          setEmail((e) => e || (r.email ?? ''));
        }
      })
      .catch(() => setMs(null))
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verbo = tipo === 'baja' ? 'baja' : 'arrepentimiento';

  // Lo que se puede hacer en el momento con esta cuenta.
  const acciones: Accion[] = [];
  if (ms?.ok) {
    const p = ms.brote_plus;
    if (tipo === 'baja' && p?.activa) {
      acciones.push({
        titulo: 'Brote+',
        detalle: `Contratado el ${fecha(p.alta)}. No se te vuelve a cobrar y seguís con los beneficios hasta el final de lo pagado.`,
        boton: 'Dar de baja Brote+',
        correr: () => bajaAhora('brote_plus'),
      });
    }
    if (tipo === 'arrepentimiento' && p && (p.activa || p.en_plazo)) {
      const dias = diasDesde(p.alta);
      acciones.push({
        titulo: 'Brote+',
        detalle: p.en_plazo
          ? `Lo contrataste hace ${dias === 0 ? 'menos de un día' : `${dias} ${dias === 1 ? 'día' : 'días'}`}: estás dentro de los ${DIAS_ARREPENTIMIENTO} días. Se da de baja y te devolvemos lo cobrado por Mercado Pago.`
          : `Lo contrataste el ${fecha(p.alta)}, hace más de ${DIAS_ARREPENTIMIENTO} días. Igual lo damos de baja en el momento y revisamos tu caso.`,
        boton: p.en_plazo ? 'Arrepentirme y que me devuelvan' : 'Pedir arrepentimiento',
        correr: () => arrepentirmeAhora(),
      });
    }
    if (tipo === 'baja') {
      for (const n of ms.negocios ?? []) {
        acciones.push({
          titulo: n.nombre,
          detalle: `${PLAN_NEGOCIO[n.plan] ?? n.plan}, desde el ${fecha(n.alta)}. No se te vuelve a cobrar.`,
          boton: 'Dar de baja este plan',
          correr: () => bajaAhora(n.plan === 'vendedor' ? 'tienda' : 'empresa', n.id),
        });
      }
    }
  }

  async function correr(a: Accion) {
    setCorriendo(true);
    const r = await a.correr().catch(() => ({ ok: false as const, error: 'error' }));
    setCorriendo(false);
    setConfirmar(null);
    if (!r.ok) return setError(ERROR_PEDIDO[r.error] ?? ERROR_PEDIDO.error!);
    setHecho({ codigo: r.codigo, mensaje: r.mensaje, hecho: r.hecho });
    void misServicios().then((x) => setMs(x.ok ? x : null));
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    const r = await enviarPedido({ tipo, servicio, nombre, email, referencia, mensaje }).catch(() => ({ ok: false as const, error: 'error' }));
    setEnviando(false);
    if (!r.ok) return setError(ERROR_PEDIDO[r.error] ?? ERROR_PEDIDO.error!);
    setHecho({ codigo: r.codigo });
    setReferencia('');
    setMensaje('');
  }

  return (
    <div className="space-y-6">
      {hecho && <Codigo hecho={hecho} conCuenta={!!ms?.ok} tipo={tipo} />}

      {cargando ? (
        <Skeleton className="h-24 w-full" />
      ) : ms?.ok && acciones.length > 0 ? (
        <section className="rounded-card border border-border bg-surface p-4 shadow-soft">
          <p className="flex items-center gap-2 text-small font-semibold">
            <ShieldCheck className="h-4 w-4 text-primary" /> Con tu cuenta ({ms.email}), en el momento
          </p>
          <ul className="mt-3 divide-y divide-hairline">
            {acciones.map((a) => (
              <li key={a.titulo + a.boton} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="text-small font-semibold">{a.titulo}</p>
                  <p className="text-caption leading-relaxed text-muted-foreground">{a.detalle}</p>
                </div>
                <Button variant={tipo === 'baja' ? 'secondary' : 'primary'} size="sm" className="shrink-0" onClick={() => setConfirmar(a)}>
                  {a.boton}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : ms?.ok ? (
        <p className="rounded-card border border-border bg-surface-2 p-3 text-small leading-relaxed text-muted-foreground">
          Con tu cuenta ({ms.email}) no hay nada {tipo === 'baja' ? 'para dar de baja' : 'contratado en los últimos días'}. Si lo
          contrataste con otro correo, o es otra cosa, usá el formulario de abajo.
        </p>
      ) : null}

      <form onSubmit={enviar} className="space-y-4 rounded-card border border-border bg-surface p-4 shadow-soft" noValidate>
        <div>
          <p className="text-small font-semibold">{ms?.ok ? 'O mandanos el pedido' : `Pedido de ${verbo}`}</p>
          <p className="mt-0.5 text-caption leading-relaxed text-muted-foreground">
            No hace falta tener cuenta ni iniciar sesión. Te damos el código del pedido en el momento.
          </p>
        </div>
        <Field label="¿De qué servicio?">
          <Select value={servicio} onChange={(e) => setServicio(e.target.value as Servicio)}>
            {SERVICIOS.map((s) => (
              <option key={s.v} value={s.v}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tu nombre">
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" maxLength={120} required />
          </Field>
          <Field label="Tu correo" help="El de tu cuenta de Brote o el que usaste para pagar.">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" maxLength={200} required />
          </Field>
        </div>
        <Field label="Número de operación (opcional)" help="Lo encontrás en el comprobante de Mercado Pago. Nos ayuda a encontrar el pago.">
          <Input value={referencia} onChange={(e) => setReferencia(e.target.value)} maxLength={120} />
        </Field>
        <Field label="Algo más (opcional)">
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            maxLength={1000}
            rows={3}
            className="w-full rounded-button border border-border bg-surface px-3 py-2 text-small outline-none transition-colors focus:border-primary"
          />
        </Field>
        {error && (
          <p role="alert" className="text-small text-brote-coral">
            {error}
          </p>
        )}
        <Button type="submit" block variant="primary" loading={enviando} disabled={nombre.trim().length < 2 || !email.includes('@')}>
          Enviar pedido de {verbo}
        </Button>
      </form>

      <Consulta codigoInicial={codigoInicial} />

      <p className="text-caption leading-relaxed text-muted-foreground">
        {ATENCION.area}: <a href={`mailto:${BRAND.contactEmail}`} className="font-medium text-primary underline underline-offset-2">{BRAND.contactEmail}</a>.{' '}
        {ATENCION.horario}. {ATENCION.respuesta} <Link href="/legal/atencion" className="underline underline-offset-2">Más sobre la atención</Link>.
      </p>

      <Sheet open={!!confirmar} onOpenChange={(o) => !o && setConfirmar(null)} title={confirmar ? `${confirmar.boton}` : ''}>
        {confirmar && (
          <>
            <p className="text-small leading-relaxed text-muted-foreground">{confirmar.detalle}</p>
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setConfirmar(null)}>
                Volver
              </Button>
              <Button variant={tipo === 'baja' ? 'danger' : 'primary'} className="flex-1" loading={corriendo} onClick={() => void correr(confirmar)}>
                Confirmar
              </Button>
            </div>
          </>
        )}
      </Sheet>
    </div>
  );
}

function Codigo({ hecho, conCuenta, tipo }: { hecho: Hecho; conCuenta: boolean; tipo: TipoPedido }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <section role="status" className="rounded-card border border-primary/40 bg-primary/5 p-4">
      <p className="flex items-center gap-2 text-small font-semibold">
        {hecho.hecho ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Clock className="h-4 w-4 text-primary" />}
        {hecho.hecho ? 'Listo' : 'Recibimos tu pedido'}
      </p>
      <p className="mt-2 text-caption text-muted-foreground">Código de tu pedido de {tipo === 'baja' ? 'baja' : 'arrepentimiento'}:</p>
      <div className="mt-1 flex items-center gap-2">
        <code className="font-display text-h2 font-bold tracking-wider">{hecho.codigo}</code>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Copiar el código"
          onClick={() => {
            void navigator.clipboard?.writeText(hecho.codigo);
            setCopiado(true);
          }}
        >
          {copiado ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <p className="mt-2 text-small leading-relaxed">
        {hecho.mensaje ?? 'Lo resolvemos dentro de las 24 h hábiles. Con este código y tu correo podés ver cómo va, acá abajo.'}
      </p>
      <p className="mt-1 text-caption text-muted-foreground">
        Guardalo. {conCuenta ? 'También te lo dejamos en tus avisos de Brote.' : 'Sacale una captura si querés tenerlo a mano.'}
      </p>
    </section>
  );
}

function Consulta({ codigoInicial }: { codigoInicial?: string }) {
  const [codigo, setCodigo] = useState(codigoInicial ?? '');
  const [email, setEmail] = useState('');
  const [r, setR] = useState<EstadoPedido | null>(null);
  const [buscando, setBuscando] = useState(false);

  async function buscar(e?: React.FormEvent) {
    e?.preventDefault();
    setBuscando(true);
    setR(await consultarPedido(codigo, email).catch(() => ({ ok: false, error: 'error' })));
    setBuscando(false);
  }

  // Desde un aviso de la app: con la sesión iniciada alcanza con el código.
  useEffect(() => {
    if (codigoInicial && codigoValido(codigoInicial)) void buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <form onSubmit={buscar} className="space-y-3 rounded-card border border-border p-4">
      <p className="flex items-center gap-2 text-small font-semibold">
        <Search className="h-4 w-4 text-muted-foreground" /> ¿Ya hiciste un pedido? Mirá cómo va
      </p>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label="Código">
          <Input value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} placeholder="ARR-XXXX-XXXX" maxLength={13} />
        </Field>
        <Field label="Correo del pedido">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Button type="submit" variant="secondary" loading={buscando} disabled={!codigoValido(codigo)}>
          Consultar
        </Button>
      </div>
      {r && (
        <div className={cn('rounded-button p-3 text-small', r.ok ? 'bg-surface-2' : 'text-brote-coral')}>
          {r.ok ? (
            <>
              <p>
                <span className="font-semibold">{ESTADO_PEDIDO[r.estado ?? ''] ?? r.estado}</span>
                {' · '}pedido del {r.creada ? fecha(r.creada) : '—'}
                {r.resuelta ? ` · cerrado el ${fecha(r.resuelta)}` : ''}
              </p>
              {r.resolucion && <p className="mt-1 leading-relaxed text-muted-foreground">{r.resolucion}</p>}
            </>
          ) : (
            ERROR_PEDIDO[r.error ?? ''] ?? ERROR_PEDIDO.error
          )}
        </div>
      )}
    </form>
  );
}
