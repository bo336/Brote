'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { CTX_COOKIE } from '@/lib/negocio/catalogo';

/**
 * Eliminar un negocio (0150, docs/REESTRUCTURA.md D7).
 *
 * 1. Se pregunta a la base si se puede (dueña, no es de muestra, sin plan pago
 *    vivo). 2. Se borran los archivos del negocio —logo, fotos, evidencia—
 *    mientras todavía es de la persona (las políticas de 0150 la dejan listar y
 *    borrar). 3. Se borra el negocio: lo demás cae en cascada. 4. El espacio
 *    vuelve a la cuenta personal.
 *
 * Los archivos van antes porque después ya no hay negocio que dé permiso. Si
 * algún archivo no se puede borrar, se sigue igual: un archivo huérfano es
 * mejor que un negocio que nadie puede eliminar.
 */

export type MotivoEliminar = 'no_autenticado' | 'no_existe' | 'solo_duenio' | 'es_demo' | 'plan_activo' | 'confirmacion' | 'error';

export interface RevisionEliminar {
  ok: boolean;
  error?: MotivoEliminar;
  nombre?: string;
  listados?: number;
  equipo?: number;
  certificados?: number;
}

const MOTIVOS = new Set<MotivoEliminar>(['no_autenticado', 'no_existe', 'solo_duenio', 'es_demo', 'plan_activo', 'confirmacion']);

function motivo(e: unknown): MotivoEliminar {
  return MOTIVOS.has(e as MotivoEliminar) ? (e as MotivoEliminar) : 'error';
}

export async function revisarEliminarNegocio(negocioId: string): Promise<RevisionEliminar> {
  const { data, error } = await createClient().rpc('negocio_eliminar_revisar', { p_business_id: negocioId });
  if (error || !data) return { ok: false, error: 'error' };
  const d = data as RevisionEliminar & { error?: string };
  return d.ok ? d : { ok: false, error: motivo(d.error) };
}

const CARPETAS = ['business-logos', 'listing-images', 'business-evidence'] as const;

/** Todas las rutas bajo `prefijo/` (las carpetas vienen sin `id`), hasta 3 niveles. */
async function rutasDe(
  supabase: ReturnType<typeof createClient>,
  bucket: string,
  prefijo: string,
  nivel = 0,
): Promise<string[]> {
  if (nivel > 3) return [];
  const { data, error } = await supabase.storage.from(bucket).list(prefijo, { limit: 1000 });
  if (error || !data) return [];
  const out: string[] = [];
  for (const f of data) {
    const ruta = `${prefijo}/${f.name}`;
    if (f.id) out.push(ruta);
    else out.push(...(await rutasDe(supabase, bucket, ruta, nivel + 1)));
  }
  return out;
}

export async function eliminarNegocio(negocioId: string, confirmacion: string): Promise<{ ok: true; nombre: string } | { ok: false; error: MotivoEliminar }> {
  const supabase = createClient();
  const rev = await revisarEliminarNegocio(negocioId);
  if (!rev.ok) return { ok: false, error: rev.error ?? 'error' };

  // Mismo criterio que la base, para no borrar archivos de un pedido que va a rebotar.
  const normal = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  if (!confirmacion.trim() || normal(confirmacion) !== normal(rev.nombre ?? '')) return { ok: false, error: 'confirmacion' };

  for (const bucket of CARPETAS) {
    try {
      const rutas = await rutasDe(supabase, bucket, negocioId);
      for (let i = 0; i < rutas.length; i += 100) {
        await supabase.storage.from(bucket).remove(rutas.slice(i, i + 100));
      }
    } catch {
      /* best effort: ver el comentario de arriba */
    }
  }

  const { data, error } = await supabase.rpc('negocio_eliminar', { p_business_id: negocioId, p_confirmacion: confirmacion });
  const d = (data ?? {}) as { ok?: boolean; error?: string; nombre?: string };
  if (error || !d.ok) return { ok: false, error: motivo(d.error) };

  cookies().set(CTX_COOKIE, 'personal', {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
  });
  return { ok: true, nombre: d.nombre ?? rev.nombre ?? '' };
}
