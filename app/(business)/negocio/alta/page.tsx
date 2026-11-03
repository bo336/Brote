import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ElegirNegocio } from '@/components/negocio/alta/AltaNegocio';
import { AltaVendedor } from '@/components/negocio/vendedor/AltaVendedor';
import { ElegirTipoNegocio } from '@/components/negocio/alta/AltaEmpresa';
import { EstadoSolicitud, NuevaSolicitud } from '@/components/negocio/alta/Solicitud';
import { getActiveBusiness, getMisNegocios, getSolicitud } from '@/lib/negocio/context';
import { estadoConfigMp, getEstadoVendedor } from '@/lib/negocio/vendedor-acciones';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('negocio.vendedor');
  return { title: t('tituloPagina') };
}

const MAX_TIENDAS_OWNER = 3;

/**
 * `/negocio/alta` — entrar a Brote como negocio. Primero la solicitud, igual
 * para los dos planes (0143): hasta que el equipo la aprueba no se arma nada.
 * Una vez aprobada, la tienda sigue acá con sus pasos (cada uno se guarda: volver
 * otro día, desde otro teléfono, retoma donde quedó); la empresa va a su plan.
 *
 * `?mp=` es la vuelta de Mercado Pago (vincular o pagar); `?listo=1`, la
 * pantalla de "tu tienda está abierta" justo después de abrirla.
 */
export default async function AltaPage({
  searchParams,
}: {
  searchParams: { nuevo?: string; mp?: string; motivo?: string; listo?: string; tipo?: string };
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
    // Two different business accounts (0121): first, what it is for. Then the
    // same request for both (0143).
    if (searchParams.tipo === 'mejorar' || searchParams.tipo === 'vender') return <NuevaSolicitud objetivo={searchParams.tipo} />;
    return <ElegirTipoNegocio />;
  }

  // Sin aprobar (o suspendida), lo único que hay es el estado de la solicitud.
  if (activo.status !== 'approved' && activo.modelo !== 'legacy') {
    const solicitud = await getSolicitud(activo.id);
    if (!solicitud) redirect('/negocio/contexto');
    return <EstadoSolicitud s={solicitud} nombre={activo.nombre} />;
  }

  const estado = await getEstadoVendedor(activo.id);
  if (!estado) redirect('/negocio/contexto');
  // Lo dado de alta con el flujo anterior, y las empresas que mejoran, no pasan por acá.
  if (estado.modelo !== 'vendedor') redirect('/negocio');
  if (estado.rol !== 'owner' && estado.rol !== 'admin') redirect('/negocio');
  // Abierta: la pantalla de festejo solo justo después; si no, al panel.
  if (estado.abierta && searchParams.listo !== '1' && searchParams.mp !== 'volvio') redirect('/negocio');

  return <AltaVendedor estado={estado} mp={mp} aviso={aviso} />;
}
