'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/input';
import { Sheet } from '@/components/ui/sheet';
import { Barras } from '@/components/panel/analitica/piezas';
import { Cargando, ErrorCarga, Etiqueta, PageHeader, Section, Stat, StatGrid, Tabla, Td, Th, Vacio, fecha, fechaHora, hace, num } from '@/components/panel/ui';
import { getDomainName } from '@/lib/domains';
import { RANK_BY_SLUG } from '@/lib/ranks';
import { LIGAS } from '@/lib/ligas';
import { CUENTA, adminPersona, adminPersonaAccion } from '@/lib/api/admin';
import { adminPersonaLiga } from '@/lib/api/ligas';
import { NOMBRE_NAVEGADOR, NOMBRE_PLATAFORMA, NOMBRE_SECCION, NOMBRE_SISTEMA } from '@/lib/panel/nombres';
import { toast } from '@/stores/toast';

/** `/panel/personas/[id]` — la ficha: quién es, cómo usa Brote y qué se puede hacer. */

const TIPO: Record<string, string> = { adult: 'Adulto', teen: 'Adolescente (13–17)', kid: 'Chico (hasta 12)' };

type Pedido = { accion: 'suspender' | 'levantar' | 'dar_plus' | 'quitar_plus'; dias?: number; titulo: string; cuerpo: string; peligro?: boolean };

export default function PersonaPage() {
  const id = useParams<{ id: string }>()?.id ?? '';
  const q = useQuery({ queryKey: ['panel', 'persona', id], queryFn: () => adminPersona(CUENTA, id), enabled: !!id });
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [liga, setLiga] = useState<number | null>(null);
  const [guardandoLiga, setGuardandoLiga] = useState(false);

  async function confirmar() {
    if (!pedido) return;
    setOcupado(true);
    const r = await adminPersonaAccion(CUENTA, id, pedido.accion, pedido.dias);
    setOcupado(false);
    setPedido(null);
    if (!r.ok) return toast.error('No se pudo', r.error);
    toast.success('Listo');
    void q.refetch();
  }

  const volver = (
    <Link href="/panel/personas" className="mb-4 inline-flex items-center gap-1.5 text-small text-muted-foreground hover:text-foreground">
      <ArrowLeft className="h-4 w-4" /> Personas
    </Link>
  );

  if (q.isLoading) return <div>{volver}<Cargando /></div>;
  if (q.isError || !q.data) return <div>{volver}<ErrorCarga onReintentar={() => void q.refetch()} mensaje="No se pudo traer esta ficha." /></div>;

  const { persona: p, rango, uso, totales: t, secciones_30d, actividad_30d, ultimas_acciones, negocios } = q.data;
  const suspendida = !!p.suspendida_hasta && new Date(p.suspendida_hasta) > new Date();
  const nombre = p.nombre ?? p.usuario ?? 'Sin nombre';
  const secciones = Object.entries(secciones_30d)
    .map(([k, v]) => ({ etiqueta: NOMBRE_SECCION[k] ?? k, valor: Number(v), detalle: 'días' }))
    .sort((a, b) => b.valor - a.valor);

  return (
    <div>
      {volver}
      <PageHeader
        title={nombre}
        description={
          <>
            {p.usuario ? `@${p.usuario} · ` : ''}
            {p.email ?? 'sin correo'} · {p.ciudad ?? 'sin ciudad'}
          </>
        }
        actions={
          p.usuario ? (
            <Button variant="secondary" size="sm" asChild>
              <Link href={`/perfil/${p.usuario}`} target="_blank">
                <ExternalLink className="h-4 w-4" /> Ver perfil
              </Link>
            </Button>
          ) : undefined
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-1.5">
        <Etiqueta>{TIPO[p.tipo] ?? p.tipo}</Etiqueta>
        <span className="inline-flex items-center gap-1.5 rounded-pill border border-border px-2.5 py-0.5 text-caption font-semibold">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: rango.color }} aria-hidden /> Liga {rango.nombre}
        </span>
        <Etiqueta>Rango {RANK_BY_SLUG[p.nivel]?.name_es ?? p.nivel}</Etiqueta>
        {p.es_plus && <Etiqueta tono="ok">Brote+{p.plan_hasta ? ` hasta ${fecha(p.plan_hasta)}` : ''}</Etiqueta>}
        {p.es_prueba && <Etiqueta tono="info">Cuenta de prueba</Etiqueta>}
        {p.es_admin && <Etiqueta tono="info">Dueño del panel</Etiqueta>}
        {!p.onboarding && <Etiqueta tono="atencion">Sin onboarding</Etiqueta>}
        {suspendida && <Etiqueta tono="mal">Suspendida hasta {fecha(p.suspendida_hasta)}</Etiqueta>}
      </div>

      <div className="space-y-6">
        <StatGrid>
          <Stat label="Última vez" value={<span className="text-[1.5rem]">{hace(uso?.ultima_vez)}</span>} hint={`Se sumó el ${fecha(p.alta_at)}`} />
          <Stat label="Días activos" value={num(t.dias_activos_30d)} hint="de los últimos 30" />
          <Stat label="Acciones" value={num(t.acciones)} hint={`${num(t.acciones_30d)} en 30 días`} />
          <Stat label="Racha" value={num(p.racha)} hint={`Récord: ${num(p.racha_max)} · ${num(p.puntos)} puntos`} />
        </StatGrid>

        <Section title="Últimos 30 días" description="Cada cuadradito es un día: más oscuro, más acciones.">
          <div className="flex flex-wrap gap-1">
            {actividad_30d.map((d) => {
              const n = Number(d.acciones);
              return (
                <span
                  key={d.dia}
                  title={`${fecha(d.dia)}: ${d.activo ? 'entró' : 'no entró'}, ${n} acciones`}
                  className="h-6 w-6 rounded-[5px]"
                  style={{ backgroundColor: n > 0 ? `rgb(31 181 122 / ${Math.min(0.35 + n * 0.15, 1)})` : d.activo ? 'rgb(31 181 122 / 0.15)' : 'rgb(var(--surface-2))' }}
                />
              );
            })}
          </div>
        </Section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="Qué usa" description="Días que entró a cada parte, últimos 30.">
            <Barras filas={secciones} vacio="Sin registros todavía." />
          </Section>
          <Section title="Datos">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-small">
              <Dato k="Lecciones hechas" v={num(t.lecciones)} />
              <Dato k="Publicaciones" v={num(t.publicaciones)} />
              <Dato k="Proyectos" v={num(t.proyectos)} />
              <Dato k="Semillas" v={num(p.semillas)} />
              <Dato k="Dispositivos con avisos" v={num(t.dispositivos)} />
              <Dato k="Reportes recibidos" v={num(t.reportes_recibidos)} />
              <Dato k="Dispositivo" v={uso?.plataforma ? (NOMBRE_PLATAFORMA[uso.plataforma] ?? uso.plataforma) : '—'} />
              <Dato k="Sistema" v={uso?.sistema ? (NOMBRE_SISTEMA[uso.sistema] ?? uso.sistema) : '—'} />
              <Dato k="Navegador" v={uso?.navegador ? (NOMBRE_NAVEGADOR[uso.navegador] ?? uso.navegador) : '—'} />
              <Dato k="App instalada" v={uso?.instalada ? 'Sí' : 'No'} />
            </dl>
          </Section>
        </div>

        <Section
          title="Liga"
          description="La liga se gana sola cada semana. Ponerla a mano sirve para arrancar, por ejemplo con alguien que ya sabés que organiza bien: desde Referente puede crear proyectos. El cierre del lunes la sigue moviendo."
        >
          <div className="flex max-w-sm gap-2">
            <Select aria-label="Liga de esta persona" value={liga ?? rango.tier} onChange={(e) => setLiga(Number(e.target.value))} className="flex-1">
              {LIGAS.map((l) => (
                <option key={l.tier} value={l.tier}>
                  {l.nombre}
                </option>
              ))}
            </Select>
            <Button
              variant="secondary"
              disabled={liga == null || liga === rango.tier}
              loading={guardandoLiga}
              onClick={async () => {
                setGuardandoLiga(true);
                const r = await adminPersonaLiga(CUENTA, p.id, liga ?? rango.tier);
                setGuardandoLiga(false);
                if (!r.ok) return toast.error('No se pudo', r.error);
                toast.success(`Ahora está en ${r.nombre ?? 'esa liga'}`);
                setLiga(null);
                void q.refetch();
              }}
            >
              Guardar
            </Button>
          </div>
        </Section>

        <Section title="Últimas acciones" sinPadding>
          {ultimas_acciones.length === 0 ? (
            <Vacio>Todavía no hizo ninguna.</Vacio>
          ) : (
            <Tabla minimo={480}>
              <thead>
                <tr>
                  <Th>Acción</Th>
                  <Th>Tema</Th>
                  <Th>Cuándo</Th>
                  <Th derecha>Puntos</Th>
                </tr>
              </thead>
              <tbody>
                {ultimas_acciones.map((a, i) => (
                  <tr key={i}>
                    <Td className="max-w-[320px] truncate font-medium">{a.titulo}</Td>
                    <Td>{getDomainName(a.tema)}</Td>
                    <Td className="whitespace-nowrap">{fechaHora(a.at)}</Td>
                    <Td derecha>{num(a.puntos)}</Td>
                  </tr>
                ))}
              </tbody>
            </Tabla>
          )}
        </Section>

        {negocios.length > 0 && (
          <Section title="Empresas">
            <ul className="space-y-2 text-small">
              {negocios.map((b) => (
                <li key={b.id} className="flex items-center gap-2">
                  <Link href={`/panel/negocios/${b.id}`} className="font-semibold hover:underline">
                    {b.nombre}
                  </Link>
                  <Etiqueta>{b.rol}</Etiqueta>
                  <Etiqueta tono={b.estado === 'approved' ? 'ok' : 'neutro'}>{b.estado}</Etiqueta>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title="Acciones sobre la cuenta" description="Cada una pide confirmación.">
          <div className="flex flex-wrap gap-2">
            {p.es_plus ? (
              <Button variant="secondary" size="sm" onClick={() => setPedido({ accion: 'quitar_plus', titulo: 'Quitar Brote+', cuerpo: `${nombre} vuelve al plan gratis ahora. Si paga una suscripción, seguí la baja en Mercado Pago.` })}>
                Quitar Brote+
              </Button>
            ) : (
              <>
                <Button variant="secondary" size="sm" onClick={() => setPedido({ accion: 'dar_plus', dias: 30, titulo: 'Regalar 30 días de Brote+', cuerpo: `${nombre} recibe un aviso con el regalo.` })}>
                  Regalar 30 días de Brote+
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setPedido({ accion: 'dar_plus', dias: 365, titulo: 'Regalar un año de Brote+', cuerpo: `${nombre} recibe un aviso con el regalo.` })}>
                  Regalar un año
                </Button>
              </>
            )}
            {suspendida ? (
              <Button variant="secondary" size="sm" onClick={() => setPedido({ accion: 'levantar', titulo: 'Levantar la suspensión', cuerpo: `${nombre} vuelve a poder usar todo.` })}>
                Levantar la suspensión
              </Button>
            ) : (
              !p.es_admin && (
                <>
                  <Button variant="secondary" size="sm" onClick={() => setPedido({ accion: 'suspender', dias: 7, peligro: true, titulo: 'Suspender 7 días', cuerpo: `${nombre} no va a poder publicar ni interactuar por 7 días.` })}>
                    Suspender 7 días
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setPedido({ accion: 'suspender', dias: 30, peligro: true, titulo: 'Suspender 30 días', cuerpo: `${nombre} no va a poder publicar ni interactuar por 30 días.` })}>
                    Suspender 30 días
                  </Button>
                </>
              )
            )}
          </div>
        </Section>
      </div>

      <Sheet open={!!pedido} onOpenChange={(v) => !v && setPedido(null)} title={pedido?.titulo ?? ''} description={pedido?.cuerpo}>
        <div className="flex flex-col gap-2 pt-2">
          <Button block variant={pedido?.peligro ? 'danger' : 'primary'} loading={ocupado} onClick={() => void confirmar()}>
            Confirmar
          </Button>
          <Button block variant="ghost" onClick={() => setPedido(null)}>
            Cancelar
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

function Dato({ k, v }: { k: string; v: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-caption text-muted-foreground">{k}</dt>
      <dd className="truncate font-semibold tnum">{v}</dd>
    </div>
  );
}
