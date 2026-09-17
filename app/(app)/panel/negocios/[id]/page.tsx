'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { CandadoPanel, usePanelPass } from '@/components/panel/PanelPass';
import { FichaRevision, VolverACola, type AccionRevision } from '@/components/panel/negocios/FichaRevision';
import {
  firmarEvidencia,
  negocioRevisar,
  negocioRevision,
  negociosCola,
  probarSitio,
} from '@/lib/api/negocios';
import type { RevisionNegocio } from '@/lib/supabase/rows-negocio';
import { useToastStore } from '@/stores/toast';

type Accion = AccionRevision;

const UN_DIA = 86_400_000;

/**
 * `/panel/negocios/[id]` — la ficha de revisión (fase 1 §7.2, 07 §4.10).
 *
 * Pensada para menos de dos minutos: todo lo decisivo arriba, tres botones y
 * una nota. Atajos `A` `P` `R` y `J`/`K`, que NO disparan si el foco está en
 * un campo: escribir "Rechazado por…" en la nota no puede rechazar nada.
 */
export default function RevisionNegocioPage() {
  const t = useTranslations('negocio');
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { pass, setPass } = usePanelPass();

  const [datos, setDatos] = useState<RevisionNegocio | null>(null);
  const [noExiste, setNoExiste] = useState(false);
  const [nota, setNota] = useState('');
  const [ocupado, setOcupado] = useState<Accion | null>(null);
  const [probando, setProbando] = useState(false);
  const [ahora, setAhora] = useState(0);
  const notaRef = useRef<HTMLTextAreaElement>(null);
  const probado = useRef(false);

  const aviso = (variant: 'success' | 'error', title: string) =>
    useToastStore.getState().push({ variant, title });

  const cargar = useCallback(async () => {
    if (!pass || !id) return;
    const r = await negocioRevision(pass, id);
    setAhora(Date.now());
    if (!r.ok) {
      if (/autorizado/i.test(r.error ?? '')) setPass('');
      else setNoExiste(true);
      return;
    }
    setDatos(r as RevisionNegocio);
  }, [pass, id, setPass]);

  useEffect(() => {
    setDatos(null);
    setNoExiste(false);
    setNota('');
    probado.current = false;
    void cargar();
  }, [cargar]);

  const probar = useCallback(async () => {
    if (!pass || !id) return;
    setProbando(true);
    await probarSitio(pass, id);
    setProbando(false);
    await cargar();
  }, [pass, id, cargar]);

  // Si nunca se chequeó el sitio (o hace más de un día), se prueba una vez al
  // abrir la ficha: abrirla es la acción explícita del revisor (03 §5).
  useEffect(() => {
    const n = datos?.negocio;
    if (!n?.sitio_web || probado.current) return;
    const viejo = !n.sitio_chequeado_at || Date.now() - new Date(n.sitio_chequeado_at).getTime() > UN_DIA;
    probado.current = true;
    if (viejo) void probar();
  }, [datos, probar]);

  const pendiente = datos?.negocio.status === 'submitted' || datos?.negocio.status === 'in_review';

  const resolver = useCallback(
    async (accion: Accion) => {
      if (!datos || !pass || ocupado || !pendiente) return;
      if (accion !== 'aprobar' && nota.trim().length < 10) {
        aviso('error', t('panel.detalle.notaFalta'));
        notaRef.current?.focus();
        return;
      }
      setOcupado(accion);
      const r = await negocioRevisar(pass, datos.negocio.id, accion, nota.trim());
      setOcupado(null);
      if (!r.ok) {
        aviso('error', r.error ?? t('panel.detalle.error'));
        return;
      }
      aviso(
        'success',
        t(accion === 'aprobar' ? 'panel.detalle.aprobado' : accion === 'pedir_datos' ? 'panel.detalle.pedido' : 'panel.detalle.rechazado'),
      );
      // La siguiente en la cola, si hay; si no, la cola.
      const siguiente = datos.siguiente ?? (await negociosCola(pass, 'pendientes')).items[0]?.id ?? null;
      router.push(siguiente && siguiente !== datos.negocio.id ? `/panel/negocios/${siguiente}` : '/panel/negocios');
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [datos, pass, ocupado, pendiente, nota, router, t],
  );

  // Atajos de teclado. Nunca con el foco en un campo, nunca con modificadores.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || el.closest('input, textarea, select, [contenteditable="true"]'))) return;
      const k = e.key.toLowerCase();
      if (k === 'a') void resolver('aprobar');
      else if (k === 'p') void resolver('pedir_datos');
      else if (k === 'r') void resolver('rechazar');
      else if (k === 'j' && datos?.siguiente) router.push(`/panel/negocios/${datos.siguiente}`);
      else if (k === 'k' && datos?.anterior) router.push(`/panel/negocios/${datos.anterior}`);
      else return;
      e.preventDefault();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [resolver, datos, router]);

  if (!pass) return <CandadoPanel verificar={async (p) => (await negociosCola(p, 'pendientes')).ok} />;

  if (noExiste) {
    return (
      <div className="space-y-4 py-6">
        <VolverACola />
        <p className="text-small text-muted-foreground">{t('panel.detalle.noExiste')}</p>
      </div>
    );
  }

  if (!datos) {
    return (
      <div className="space-y-4 py-6">
        <VolverACola />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <FichaRevision
      datos={datos}
      ahora={ahora}
      pendiente={pendiente}
      nota={nota}
      notaRef={notaRef}
      ocupado={ocupado}
      probando={probando}
      onNota={setNota}
      onResolver={(a) => void resolver(a)}
      onProbar={() => void probar()}
      onVerCaptura={async (ruta) => {
        const url = await firmarEvidencia(pass, datos.negocio.id, ruta);
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
        else aviso('error', t('panel.detalle.error'));
      }}
      onIr={(destino) => router.push(`/panel/negocios/${destino}`)}
    />
  );
}
