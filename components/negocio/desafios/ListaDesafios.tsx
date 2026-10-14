'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Award, ChevronRight, Clock, ShieldAlert } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ChipRail } from '@/components/ui/chip-rail';
import {
  CATEGORIA,
  ESTADO_INSCRIPCION,
  NIVEL,
  desafiosEmpresa,
  type DesafioListado,
} from '@/lib/api/desafios';
import { cn } from '@/lib/utils/cn';

/**
 * Los desafíos de Brote para esta empresa: arriba lo que ya está en marcha y
 * los certificados; abajo, lo que se puede empezar, por tema.
 */
export function ListaDesafios({ negocioId }: { negocioId: string }) {
  const [datos, setDatos] = useState<Awaited<ReturnType<typeof desafiosEmpresa>> | null>(null);
  const [tema, setTema] = useState('todos');

  useEffect(() => {
    desafiosEmpresa(negocioId).then(setDatos);
  }, [negocioId]);

  const { enMarcha, certificados, disponibles } = useMemo(() => {
    const lista = datos?.desafios ?? [];
    return {
      enMarcha: lista.filter((d) => d.inscripcion && ['en_curso', 'enviada', 'observada'].includes(d.inscripcion.estado)),
      certificados: lista.filter((d) => d.certificado),
      disponibles: lista.filter(
        (d) => (!d.inscripcion || ['vencida', 'abandonada', 'rechazada'].includes(d.inscripcion.estado)) && !d.certificado?.vigente,
      ),
    };
  }, [datos]);

  const temas = useMemo(() => {
    const presentes = Array.from(new Set(disponibles.map((d) => d.categoria)));
    return [{ value: 'todos', label: 'Todos' }, ...presentes.map((c) => ({ value: c, label: CATEGORIA[c].nombre }))];
  }, [disponibles]);

  if (!datos) return <Skeleton className="h-96 w-full" />;
  if (!datos.ok) return <p className="text-small text-muted-foreground">No pudimos cargar los desafíos.</p>;

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow text-primary">Desafíos y certificados</p>
        <h1 className="font-display text-h1 font-bold">Metas concretas, revisadas por Brote</h1>
        <p className="mt-1 max-w-2xl text-small leading-relaxed text-muted-foreground">
          Cada desafío pide cosas que se pueden comprobar: una foto, una factura, un dato. Cargan la evidencia, la revisamos
          y, si está todo, emitimos un certificado con un código que cualquiera puede verificar.
        </p>
      </header>

      {!datos.verificada && (
        <div className="flex gap-3 rounded-card border border-brote-sun/40 bg-brote-sun/10 p-4 text-small">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-brote-sun" />
          <p>
            Para inscribirse en un desafío la empresa tiene que estar verificada.{' '}
            <Link href="/negocio/verificacion" className="font-semibold underline underline-offset-2">
              Ver la verificación
            </Link>
          </p>
        </div>
      )}

      {enMarcha.length > 0 && (
        <section>
          <h2 className="mb-2 font-display text-h3 font-bold">En marcha</h2>
          <Lista items={enMarcha} />
        </section>
      )}

      {certificados.length > 0 && (
        <section>
          <h2 className="mb-2 font-display text-h3 font-bold">Certificados</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {certificados.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/negocio/desafios/${d.slug}`}
                  className="press group flex items-center gap-3 rounded-card border border-border bg-surface p-3.5 hover:border-primary/30 hover:shadow-soft"
                >
                  <span
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]',
                      d.certificado!.vigente ? 'bg-primary/15 text-primary' : 'bg-surface-2 text-muted-foreground',
                    )}
                  >
                    <Award className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-small font-semibold">{d.titulo}</span>
                    <span className="block text-caption text-muted-foreground">
                      {d.certificado!.codigo} · {d.certificado!.vigente ? `vigente hasta ${new Date(d.certificado!.vence_at).toLocaleDateString('es-AR')}` : 'no vigente'}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h2 className="font-display text-h3 font-bold">Para empezar</h2>
          <span className="text-caption text-muted-foreground tnum">{disponibles.length} desafíos</span>
        </div>
        {temas.length > 2 && (
          <div className="mb-3">
            <ChipRail options={temas} value={tema} onChange={setTema} layoutId="desafios-tema" />
          </div>
        )}
        <Lista items={disponibles.filter((d) => tema === 'todos' || d.categoria === tema)} />
      </section>
    </div>
  );
}

function Lista({ items }: { items: DesafioListado[] }) {
  if (items.length === 0) return <p className="text-small text-muted-foreground">Nada por acá.</p>;
  return (
    <ul className="divide-y divide-hairline overflow-hidden rounded-card border border-border bg-surface">
      {items.map((d) => {
        const c = CATEGORIA[d.categoria];
        const insc = d.inscripcion && ['en_curso', 'enviada', 'observada'].includes(d.inscripcion.estado) ? d.inscripcion : null;
        return (
          <li key={d.id}>
            <Link href={`/negocio/desafios/${d.slug}`} className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2">
              <span className="h-10 w-1 shrink-0 rounded-pill" style={{ backgroundColor: c.color }} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="eyebrow block text-muted-foreground">
                  {c.nombre} · {NIVEL[d.nivel]}
                </span>
                <span className="block text-small font-semibold">{d.titulo}</span>
                <span className="block truncate text-caption text-muted-foreground">{d.resumen}</span>
              </span>
              <span className="hidden shrink-0 text-right text-caption sm:block">
                {insc ? (
                  <>
                    <span
                      className={cn(
                        'inline-block rounded-pill px-2 py-0.5 font-semibold',
                        insc.estado === 'observada' ? 'bg-brote-coral/15 text-brote-coral' : 'bg-primary/15 text-primary',
                      )}
                    >
                      {ESTADO_INSCRIPCION[insc.estado]}
                    </span>
                    <span className="mt-1 block text-muted-foreground tnum">
                      {insc.hechos} de {d.requisitos} requisitos
                    </span>
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> {d.dias} días · {d.requisitos} requisitos
                  </span>
                )}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
