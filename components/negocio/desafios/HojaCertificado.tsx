import { Award, CheckCircle2, ShieldAlert } from 'lucide-react';
import { BRAND } from '@/lib/brand';

/**
 * La hoja del certificado (0132): presentacional, sin datos propios, para que
 * la use la página pública y se pueda mirar con datos de ejemplo.
 */

export interface CertificadoPublico {
  ok: boolean;
  codigo: string;
  titulo: string;
  nivel: number;
  categoria: string;
  requisitos: string[];
  emitido_at: string;
  vence_at: string;
  estado: 'vigente' | 'vencido' | 'revocado';
  motivo_revocacion: string | null;
  empresa: { nombre: string; slug: string; logo: string | null; ciudad: string | null; provincia: string | null };
  resumen: string;
}

const CATEGORIA: Record<string, string> = {
  energia: 'Energía',
  residuos: 'Residuos',
  agua: 'Agua',
  compras: 'Compras',
  movilidad: 'Movilidad',
  comunidad: 'Equipo y comunidad',
  gestion: 'Gestión',
};
const NIVEL: Record<number, string> = { 1: 'Inicial', 2: 'Intermedio', 3: 'Avanzado' };

const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' });

export function HojaCertificado({ c }: { c: CertificadoPublico }) {
  const vigente = c.estado === 'vigente';
  const lugar = [c.empresa.ciudad, c.empresa.provincia].filter(Boolean).join(', ');
  return (
    <article className="relative overflow-hidden rounded-card border border-border bg-surface shadow-soft-lg print:rounded-none print:border-2 print:shadow-none">
          <div className="h-2 bg-brand-gradient" aria-hidden />
          <div className="p-6 sm:p-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow text-primary">Certificado {BRAND.name}</p>
                <p className="mt-1 text-caption text-muted-foreground">
                  {CATEGORIA[c.categoria] ?? c.categoria} · Nivel {c.nivel} — {NIVEL[c.nivel]}
                </p>
              </div>
              <span
                className={
                  'inline-flex shrink-0 items-center gap-1.5 rounded-pill px-3 py-1 text-caption font-bold ' +
                  (vigente ? 'bg-primary/15 text-primary' : 'bg-brote-coral/15 text-brote-coral')
                }
              >
                {vigente ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                {vigente ? 'Vigente' : c.estado === 'vencido' ? 'Vencido' : 'Revocado'}
              </span>
            </div>

            <h1 className="mt-6 text-balance font-display text-display-l font-extrabold leading-tight">{c.empresa.nombre}</h1>
            {lugar && <p className="mt-1 text-small text-muted-foreground">{lugar}</p>}

            <p className="mt-6 text-small text-muted-foreground">cumplió el desafío</p>
            <p className="flex items-center gap-2 font-display text-h1 font-bold">
              <Award className="h-6 w-6 shrink-0 text-primary" /> {c.titulo}
            </p>
            <p className="mt-1 text-small leading-relaxed">{c.resumen}</p>

            <h2 className="mt-8 text-small font-semibold">Lo que se revisó</h2>
            <ul className="mt-2 divide-y divide-hairline border-y border-hairline">
              {c.requisitos.map((r) => (
                <li key={r} className="flex items-start gap-2 py-2 text-small">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {r}
                </li>
              ))}
            </ul>

            {c.estado === 'revocado' && c.motivo_revocacion && (
              <p className="mt-4 rounded-button border border-brote-coral/40 bg-brote-coral/10 p-3 text-small">
                <span className="font-semibold">Revocado:</span> {c.motivo_revocacion}
              </p>
            )}

            <dl className="mt-8 grid gap-4 text-small sm:grid-cols-3">
              <div>
                <dt className="text-caption text-muted-foreground">Código</dt>
                <dd className="font-mono font-semibold tracking-wide">{c.codigo}</dd>
              </div>
              <div>
                <dt className="text-caption text-muted-foreground">Emitido</dt>
                <dd className="font-medium">{fecha(c.emitido_at)}</dd>
              </div>
              <div>
                <dt className="text-caption text-muted-foreground">Válido hasta</dt>
                <dd className="font-medium">{fecha(c.vence_at)}</dd>
              </div>
            </dl>

            <p className="mt-8 border-t border-hairline pt-4 text-caption leading-relaxed text-muted-foreground">
              Qué dice este certificado: que el equipo de {BRAND.name} revisó la evidencia que mandó la empresa para cada uno de
              estos requisitos y la encontró completa, en la fecha de emisión. Qué no dice: no es una auditoría, no es una
              certificación de un organismo oficial ni de un tercero, y no habla de la calidad de los productos. Se puede
              verificar en cualquier momento en esta dirección.
            </p>
          </div>
    </article>
  );
}
