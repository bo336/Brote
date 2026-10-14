import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { LogoMark } from '@/components/brand/Logo';
import { BRAND } from '@/lib/brand';
import { BotonImprimir } from '@/components/negocio/desafios/BotonImprimir';
import { HojaCertificado, type CertificadoPublico } from '@/components/negocio/desafios/HojaCertificado';

/**
 * La página pública de un certificado de Brote (0132). La abre cualquiera, sin
 * cuenta, con el enlace o el código. Dice lo que el certificado es y lo que no
 * es, con esas palabras. Se puede imprimir (A4, sin la interfaz).
 */

export const revalidate = 300;

async function leer(codigo: string): Promise<CertificadoPublico | null> {
  if (!/^BRT-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}$/.test(codigo)) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data } = await supabase.rpc('certificado_publico', { p_codigo: codigo });
  return (data as CertificadoPublico | null)?.ok ? (data as CertificadoPublico) : null;
}

export async function generateMetadata({ params }: { params: { codigo: string } }): Promise<Metadata> {
  const c = await leer(params.codigo.toUpperCase());
  if (!c) return { title: 'Certificado no encontrado' };
  return {
    title: `${c.titulo} · ${c.empresa.nombre}`,
    description: `Certificado ${c.codigo} de ${BRAND.name}: ${c.empresa.nombre} cumplió "${c.titulo}" (${c.estado}).`,
    robots: { index: false },
  };
}

export default async function CertificadoPage({ params }: { params: { codigo: string } }) {
  const c = await leer(params.codigo.toUpperCase());
  if (!c) notFound();

  return (
    <main className="min-h-dvh bg-background px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark size={24} />
            <span className="font-display text-h3 font-extrabold tracking-tight">{BRAND.name}</span>
          </Link>
          <BotonImprimir />
        </div>

        <HojaCertificado c={c} />

        {c.empresa.slug && (
          <p className="mt-4 text-center text-small print:hidden">
            <Link href={`/mercado/negocio/${c.empresa.slug}`} className="font-semibold text-primary underline-offset-2 hover:underline">
              Ver la ficha de {c.empresa.nombre} en {BRAND.name}
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
