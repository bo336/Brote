'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  ArrowLeft,
  Award,
  BarChart3,
  Bell,
  Building2,
  CreditCard,
  RotateCcw,
  FileWarning,
  FlaskConical,
  GraduationCap,
  HandHeart,
  LayoutDashboard,
  ListChecks,
  Megaphone,
  Menu,
  Package,
  Settings,
  ShieldAlert,
  Target,
  Trophy,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { LogoMark } from '@/components/brand/Logo';
import { adminPendientes, CUENTA } from '@/lib/api/admin';
import { cn } from '@/lib/utils/cn';

interface Item {
  href: string;
  label: string;
  Icon: LucideIcon;
  /** De qué contadores de `admin_pendientes` sale el número rojo. */
  pendientes?: string[];
}

const GRUPOS: { titulo?: string; items: Item[] }[] = [
  { items: [{ href: '/panel', label: 'Resumen', Icon: LayoutDashboard }] },
  {
    titulo: 'Personas',
    items: [
      { href: '/panel/analitica', label: 'Analítica', Icon: BarChart3 },
      { href: '/panel/personas', label: 'Personas', Icon: Users },
      { href: '/panel/ligas', label: 'Ligas', Icon: Trophy },
    ],
  },
  {
    titulo: 'Comunidad',
    items: [
      { href: '/panel/moderacion', label: 'Moderación', Icon: ShieldAlert, pendientes: ['reportes_plaza'] },
      { href: '/panel/proyectos', label: 'Proyectos', Icon: HandHeart },
    ],
  },
  {
    titulo: 'Contenido',
    items: [
      { href: '/panel/acciones', label: 'Acciones', Icon: ListChecks },
      { href: '/panel/academia', label: 'Academia', Icon: GraduationCap, pendientes: ['academia'] },
    ],
  },
  {
    titulo: 'Empresas y Mercado',
    items: [
      { href: '/panel/negocios', label: 'Empresas', Icon: Building2, pendientes: ['negocios'] },
      { href: '/panel/desafios', label: 'Desafíos y certificados', Icon: Award, pendientes: ['desafios'] },
      { href: '/panel/objetivos', label: 'Objetivos', Icon: Target, pendientes: ['objetivos'] },
      { href: '/panel/listados', label: 'Productos', Icon: Package, pendientes: ['listados', 'auditoria'] },
      { href: '/panel/compromisos', label: 'Compromisos', Icon: HandHeart, pendientes: ['compromisos'] },
      { href: '/panel/reportes', label: 'Reportes del Mercado', Icon: FileWarning, pendientes: ['reportes_mercado'] },
    ],
  },
  {
    titulo: 'Ingresos',
    items: [
      { href: '/panel/suscripciones', label: 'Suscripciones', Icon: CreditCard, pendientes: ['pagos_fallidos'] },
      { href: '/panel/consumidor', label: 'Arrepentimiento y bajas', Icon: RotateCcw, pendientes: ['consumidor'] },
      { href: '/panel/publicidad', label: 'Publicidad', Icon: Megaphone },
    ],
  },
  {
    titulo: 'Sistema',
    items: [
      { href: '/panel/salud', label: 'Salud', Icon: Activity, pendientes: ['errores_app_24h'] },
      { href: '/panel/avisos', label: 'Avisos', Icon: Bell },
      { href: '/panel/ajustes', label: 'Ajustes', Icon: Settings },
      { href: '/panel/pruebas', label: 'Cuentas de prueba', Icon: FlaskConical },
    ],
  },
];

function Navegacion({ onElegir }: { onElegir?: () => void }) {
  const pathname = usePathname() ?? '/panel';
  const pend = useQuery({
    queryKey: ['panel', 'pendientes'],
    queryFn: () => adminPendientes(CUENTA),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const contar = (claves?: string[]) => (claves ?? []).reduce((t, k) => t + Number(pend.data?.[k] ?? 0), 0);

  return (
    <nav aria-label="Secciones del panel" className="flex-1 space-y-5 overflow-y-auto px-3 pb-6 pt-2">
      {GRUPOS.map((g, i) => (
        <div key={g.titulo ?? i}>
          {g.titulo && <p className="mb-1 px-3 text-caption font-semibold uppercase tracking-wide text-muted-foreground/70">{g.titulo}</p>}
          <ul className="space-y-0.5">
            {g.items.map(({ href, label, Icon, pendientes }) => {
              const activo = href === '/panel' ? pathname === '/panel' : pathname === href || pathname.startsWith(`${href}/`);
              const n = contar(pendientes);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onElegir}
                    aria-current={activo ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-2.5 rounded-button px-3 py-2 text-small font-medium transition-colors',
                      activo ? 'bg-primary/10 font-semibold text-foreground' : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground',
                    )}
                  >
                    <Icon className={cn('h-[18px] w-[18px] shrink-0', activo && 'text-primary')} />
                    <span className="min-w-0 flex-1 truncate">{label}</span>
                    {n > 0 && (
                      <span className="rounded-pill bg-brote-coral px-1.5 py-px text-caption font-bold leading-none text-white tnum">
                        {n > 99 ? '99+' : n}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Marca() {
  return (
    <Link href="/panel" className="flex items-center gap-2.5">
      <LogoMark size={26} />
      <span className="font-display text-h3 font-extrabold tracking-tight">Panel</span>
    </Link>
  );
}

function VolverAlApp() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 border-t border-hairline px-6 py-3.5 text-small text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" /> Volver a Brote
    </Link>
  );
}

/**
 * El marco del panel: ocupa la pantalla entera (no la columna angosta de la
 * app), con todo a la vista a la izquierda y cada sección a un toque.
 */
export function PanelShell({ children }: { children: ReactNode }) {
  const [abierto, setAbierto] = useState(false);
  const pathname = usePathname();

  useEffect(() => setAbierto(false), [pathname]);
  useEffect(() => {
    if (!abierto) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previo;
    };
  }, [abierto]);

  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-hairline bg-surface lg:flex">
        <div className="px-6 py-5">
          <Marca />
        </div>
        <Navegacion />
        <VolverAlApp />
      </aside>

      {abierto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Cerrar menú" className="absolute inset-0 bg-black/50" onClick={() => setAbierto(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-surface shadow-soft-lg">
            <div className="flex items-center justify-between px-5 py-4">
              <Marca />
              <button
                type="button"
                aria-label="Cerrar menú"
                onClick={() => setAbierto(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <Navegacion onElegir={() => setAbierto(false)} />
            <VolverAlApp />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="pt-safe sticky top-0 z-30 flex items-center gap-3 border-b border-hairline bg-background/95 px-4 py-2.5 backdrop-blur lg:hidden">
          <button
            type="button"
            aria-label="Abrir menú"
            onClick={() => setAbierto(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-2"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Marca />
        </header>
        <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-6 pb-20 sm:px-6 lg:px-10 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
