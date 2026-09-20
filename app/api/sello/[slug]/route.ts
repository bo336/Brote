import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { svgSello } from '@/lib/negocio/sello';
import type { Nivel } from '@/lib/mercado/claims';

export const dynamic = 'force-dynamic';

/**
 * El sello para el sitio de la empresa (fase 4 §7): `/api/sello/mi-negocio.svg`.
 *
 * Se actualiza solo —si el nivel baja porque venció un certificado, el sello
 * del sitio de la empresa baja con él— y por eso se cachea una hora, no más.
 *
 * Dice el NIVEL DE EVIDENCIA y el programa, nunca "verificado" ni
 * "garantizado" sobre un producto (08 §2.3). El dibujo vive en
 * `lib/negocio/sello.ts`, que es una función pura y tiene sus tests.
 */
export async function GET(_request: NextRequest, { params }: { params: { slug: string } }) {
  const slug = params.slug.replace(/\.svg$/i, '');

  const { data } = await createClient().rpc('mercado_negocio', { p_slug: slug });
  const negocio = (data as { negocio?: { nombre?: string; tier?: Nivel } } | null)?.negocio;
  if (!negocio?.nombre) return new NextResponse('no encontrado', { status: 404 });

  return new NextResponse(svgSello(negocio.nombre, (negocio.tier ?? 'e1') as Nivel), {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
