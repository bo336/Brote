import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ElegirNegocio } from '@/components/negocio/alta/AltaNegocio';
import { AltaVendedor } from '@/components/negocio/vendedor/AltaVendedor';
import { getActiveBusiness, getMisNegocios } from '@/lib/negocio/context';
import { estadoConfigMp, getEstadoVendedor } from '@/lib/negocio/vendedor-acciones';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('negocio.vendedor');
  return { title: t('tituloPagina') };
}

const MAX_TIENDAS_OWNER = 3;

/**
 * `/negocio/alta` — abrir una tienda (Mercado v2). Cuatro pasos, cada uno se
 * guarda; el estado viene del servidor en cada visita, así que volver otro
 * día, desde otro teléfono, retoma exactamente donde quedó.
 *
 * `?mp=` es la vuelta de Mercado Pago (vincular o pagar); `?listo=1`, la
 * pantalla de "tu tienda está abierta" justo después de abrirla.
 */
export default async function AltaPage({
  searchParams,
}: {
  searchParams: { nuevo?: string; mp?: string; motivo?: string; listo?: string };
}) {
  const [negocios, activo, mp] = await Promise.all([getMisNegocios(), getActiveBusiness(), estadoConfigMp()]);
  const propios = negocios.filter((n) => n.role === 'owner').length;
  const nuevo = searchParams.nuevo === '1';
  const aviso = {
    mp: ['ok', 'error', 'volvio'].includes(searchParams.mp ?? '') ? searchParams.mp! : null,
    motivo: searchParams.motivo && /^[a-z_]{2,30}$/.test(searchParams.motivo) ? searchParams.motivo : null,
  };

  if (!activo || nuevo) {
    // Tiene tiendas pero no eligió ninguna: primero elegir; crear es la segunda opción.
    if (!nuevo && negocios.length > 0) {
      return <ElegirNegocio negocios={negocios} puedeCrear={propios < MAX_TIENDAS_OWNER} />;
    }
    if (propios >= MAX_TIENDAS_OWNER) return <ElegirNegocio negocios={negocios} puedeCrear={false} />;
    return <AltaVendedor estado={null} mp={mp} aviso={{ mp: null, motivo: null }} />;
  }

  const estado = await getEstadoVendedor(activo.id);
  if (!estado) redirect('/negocio/contexto');
  // Lo dado de alta con el flujo anterior no pasa por acá.
  if (estado.modelo === 'legacy') redirect('/negocio');
  if (estado.rol !== 'owner' && estado.rol !== 'admin') redirect('/negocio');
  // Abierta: la pantalla de festejo solo justo después; si no, al panel.
  if (estado.abierta && searchParams.listo !== '1' && searchParams.mp !== 'volvio') redirect('/negocio');

  return <AltaVendedor estado={estado} mp={mp} aviso={aviso} />;
}
