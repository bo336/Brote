import Link from 'next/link';
import { Award, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

const NIVEL: Record<number, string> = { 1: 'Inicial', 2: 'Intermedio', 3: 'Avanzado' };

/**
 * Los certificados vigentes de una empresa, en su ficha pública (0132). Sin
 * cliente: se arma en el servidor. Si no tiene ninguno, no dibuja nada.
 */
export async function CertificadosPublicos({ slug }: { slug: string }) {
  const { data } = await createClient().rpc('certificados_de_empresa', { p_slug: slug });
  const lista = (data ?? []) as { codigo: string; titulo: string; nivel: number; emitido_at: string; vence_at: string }[];
  if (lista.length === 0) return null;
  return (
    <section className="mt-8 max-w-2xl">
      <h2 className="font-display text-h3 font-bold">Certificados de Brote</h2>
      <p className="mt-1 text-small text-muted-foreground">
        Desafíos que cumplió con evidencia revisada por el equipo de Brote. Cada uno se puede verificar con su código.
      </p>
      <ul className="mt-2 divide-y divide-hairline border-y border-hairline">
        {lista.map((c) => (
          <li key={c.codigo}>
            <Link href={`/certificados/${c.codigo}`} className="group flex items-center gap-3 py-3 text-small">
              <Award className="h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{c.titulo}</span>
                <span className="block text-caption text-muted-foreground">
                  Nivel {c.nivel} — {NIVEL[c.nivel]} · {c.codigo} · vigente hasta{' '}
                  {new Date(c.vence_at).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
