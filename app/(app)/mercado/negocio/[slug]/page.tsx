import { permanentRedirect } from 'next/navigation';

/**
 * `/mercado/negocio/[slug]` era la ficha pública de un comercio. Desde el
 * Mercado v2 es `/mercado/tienda/[slug]`. La dirección vieja sigue viva porque
 * está pegada en el sitio de cada tienda (el sello del kit de marca) y en
 * mensajes ya compartidos: redirige, para siempre.
 */
export default function NegocioPublicoPage({ params }: { params: { slug: string } }) {
  permanentRedirect(`/mercado/tienda/${encodeURIComponent(params.slug)}`);
}
