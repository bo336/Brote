import { z } from 'zod';
import { PROVINCES } from '@/lib/data/cities';
import { RUBROS, TAMANOS } from '@/lib/negocio/catalogo';
import {
  cuitValido,
  emailValido,
  limpiarCuit,
  normalizarInstagram,
  normalizarSitio,
  normalizarWhatsapp,
} from '@/lib/negocio/normalizar';

/**
 * Los esquemas del alta, uno por paso. Los usa el formulario (con
 * react-hook-form) y el server action (para no confiar en el cliente).
 *
 * Los mensajes son CLAVES de `negocio.alta.errores.*`, no texto: el mismo
 * esquema corre en el servidor, donde no hay traducciones a mano.
 */

const texto = (max: number) => z.string().trim().max(max, 'largo');

export const esquemaPaso1 = z.object({
  nombre_comercial: z.string().trim().min(2, 'nombre').max(80, 'largo'),
  razon_social: texto(120),
  cuit: z
    .string()
    .trim()
    .refine((v) => v === '' || cuitValido(v), 'cuit'),
  rubro: z.enum(RUBROS, { errorMap: () => ({ message: 'rubro' }) }),
  tamano: z.enum(TAMANOS as [string, ...string[]], { errorMap: () => ({ message: 'tamano' }) }),
  provincia: z.enum(PROVINCES, { errorMap: () => ({ message: 'provincia' }) }),
  ciudad: texto(80),
});

export const esquemaPaso2 = z
  .object({
    sitio_web: z
      .string()
      .trim()
      .refine((v) => v === '' || normalizarSitio(v) !== null, 'sitio'),
    instagram: z
      .string()
      .trim()
      .refine((v) => v === '' || normalizarInstagram(v) !== null, 'instagram'),
    whatsapp: z
      .string()
      .trim()
      .refine((v) => v === '' || normalizarWhatsapp(v) !== null, 'whatsapp'),
    email_contacto: z.string().trim().refine(emailValido, 'email'),
  })
  .refine((v) => v.sitio_web !== '' || v.instagram !== '', {
    message: 'sitio_o_instagram',
    path: ['sitio_web'],
  });

export const MIN_DESCRIPCION = 120;
/** Por debajo de esto aparecen los chips que inyectan preguntas (fase 1 §5.1). */
export const DESCRIPCION_POBRE = 200;

export const esquemaPaso3 = z.object({
  descripcion: z.string().trim().min(MIN_DESCRIPCION, 'descripcion').max(4000, 'largo'),
});

export const esquemaPaso4 = z.object({
  intereses: z.array(z.enum(['mejora', 'mercado'])).min(1, 'intereses'),
});

export type Paso1 = z.infer<typeof esquemaPaso1>;
export type Paso2 = z.infer<typeof esquemaPaso2>;
export type Paso3 = z.infer<typeof esquemaPaso3>;
export type Paso4 = z.infer<typeof esquemaPaso4>;

export type DatosAlta = Paso1 & Paso2 & Paso3 & Paso4;

/** Lo que va a `negocio_guardar_alta` para un paso ya validado. */
export function payloadDePaso(paso: 1 | 2 | 3 | 4, datos: unknown): Record<string, unknown> | null {
  if (paso === 1) {
    const r = esquemaPaso1.safeParse(datos);
    if (!r.success) return null;
    return {
      nombre_comercial: r.data.nombre_comercial,
      razon_social: r.data.razon_social,
      cuit: limpiarCuit(r.data.cuit) ?? '',
      rubro: r.data.rubro,
      tamano: r.data.tamano,
      provincia: r.data.provincia,
      ciudad: r.data.ciudad,
    };
  }
  if (paso === 2) {
    const r = esquemaPaso2.safeParse(datos);
    if (!r.success) return null;
    return {
      sitio_web: r.data.sitio_web ? normalizarSitio(r.data.sitio_web) : '',
      instagram: r.data.instagram ? normalizarInstagram(r.data.instagram) : '',
      whatsapp: r.data.whatsapp ? normalizarWhatsapp(r.data.whatsapp) : '',
      email_contacto: r.data.email_contacto.toLowerCase(),
    };
  }
  if (paso === 3) {
    const r = esquemaPaso3.safeParse(datos);
    return r.success ? { descripcion: r.data.descripcion } : null;
  }
  const r = esquemaPaso4.safeParse(datos);
  return r.success ? { intereses: r.data.intereses } : null;
}
