'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BellRing,
  Check,
  Clock,
  Leaf,
  ListChecks,
  ShieldCheck,
  Sprout,
  TreeDeciduous,
  Globe2,
} from 'lucide-react';
import { BRAND } from '@/lib/brand';
import { DOMAINS } from '@/lib/domains';
import { CITIES, OTHER_CITY } from '@/lib/data/cities';
import { Pip } from '@/components/pip/Pip';
import { Button } from '@/components/ui/button';
import { Input, Select, Field } from '@/components/ui/input';
import { DomainIcon } from '@/components/icons/DomainIcon';
import { DailyActionRow } from '@/components/acciones/DailyActionRow';
import { PipAvatar } from '@/components/pip/PipAvatar';
import { LogoMark } from '@/components/brand/Logo';
import { fetchSuggestedAccounts, followUser, type SocialAccount } from '@/lib/api/social';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';
import { completeActivity } from '@/lib/api/activities';
import { fetchAccionesDeHoy, type AccionConRazon } from '@/lib/api/acciones';
import { triggerRecommendations } from '@/lib/api/catalog';
import { pushSupported, subscribeToPush } from '@/lib/api/push';
import { razonTexto } from '@/lib/acciones/presentar';
import { celebrateCompletion } from '@/lib/rewards';
import { registrarEvento } from '@/lib/analitica';
import {
  EDADES,
  MAX_TEMAS,
  NOMBRE,
  PREGUNTAS_CASA,
  RITMOS,
  TEMAS_CHICOS,
  VINCULOS,
  contextoDeRespuestas,
  marcadasDeEntrada,
  opcionesVisibles,
  pasosPara,
  preguntaProvincia,
  type Edad,
  type PasoId,
  type Ritmo,
} from '@/lib/onboarding/preguntas';
import { toast } from '@/stores/toast';
import { autorizarCuentaChico, saveOnboardingProfile, finishOnboarding } from '@/app/onboarding/actions';

/**
 * El onboarding, distinto para cada edad (0145, `lib/onboarding/preguntas.ts`).
 *
 * Cada pregunta cambia algo que se ve: cuánto tiempo tenés arma tu día, los
 * temas ordenan lo que sale primero, y cada cosa de tu casa suma las acciones
 * que la piden (con el número al lado). El último paso es tu día de verdad,
 * armado con lo que contestaste, en vez de una acción fija igual para todos.
 *
 * Un chico no elige tiempo ni sigue a nadie, no se le pide la provincia ni el
 * nombre real, y antes de seguir una persona adulta autoriza la cuenta.
 *
 * Cada paso tiene la misma forma: título con Pip arriba, contenido que puede
 * desplazarse, y UNA barra de acción fija abajo (con el margen seguro del
 * teléfono).
 */

type Conteos = { total: number; rapidas: number; por_clave: Record<string, number> };

/** Lo que el flujo le pide al servidor: inyectable para mirarlo sin cuenta. */
export interface OnboardingAcciones {
  guardar: typeof saveOnboardingProfile;
  terminar: typeof finishOnboarding;
  autorizar: typeof autorizarCuentaChico;
  conteos: () => Promise<Conteos | null>;
  dia: () => Promise<AccionConRazon[]>;
}

async function conteosReales(): Promise<Conteos | null> {
  const { data, error } = await createClient().rpc('onboarding_conteos');
  if (error || !data) return null;
  return data as Conteos;
}

const ACCIONES_REALES: OnboardingAcciones = {
  guardar: saveOnboardingProfile,
  terminar: finishOnboarding,
  autorizar: autorizarCuentaChico,
  conteos: conteosReales,
  dia: async () => (await fetchAccionesDeHoy()).acciones,
};

const ICONO_EDAD: Record<Edad, typeof Sprout> = { kid: Sprout, teen: Leaf, adult: TreeDeciduous };

export function OnboardingFlow({
  initialName,
  acciones = ACCIONES_REALES,
}: {
  initialName: string;
  acciones?: OnboardingAcciones;
}) {
  const t = useTranslations('onboarding');
  const tc = useTranslations('common');
  const router = useRouter();
  const reduce = useReducedMotion();
  const [paso, setPaso] = useState<PasoId>('bienvenida');
  const [dir, setDir] = useState(1);
  const [edad, setEdad] = useState<Edad>('adult');
  const [name, setName] = useState(initialName);
  const [city, setCity] = useState('');
  const [otherCity, setOtherCity] = useState('');
  // Quién autoriza una cuenta de chico.
  const [adultoNombre, setAdultoNombre] = useState('');
  const [vinculo, setVinculo] = useState<(typeof VINCULOS)[number]['v'] | ''>('');
  const [acepta, setAcepta] = useState(false);
  const [ritmo, setRitmo] = useState<Ritmo | null>(null);
  const [temas, setTemas] = useState<Set<string>>(new Set());
  const [casa, setCasa] = useState<Set<string>>(new Set());
  const [conteos, setConteos] = useState<Conteos | null>(null);
  const [suggested, setSuggested] = useState<SocialAccount[] | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [following, setFollowing] = useState(false);
  const [dia, setDia] = useState<AccionConRazon[] | null>(null);
  const [hecha, setHecha] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [avisos, setAvisos] = useState<'pregunta' | 'activando' | 'listo' | 'no'>('pregunta');
  const [pending, startTransition] = useTransition();

  const pasos = useMemo(() => pasosPara(edad), [edad]);
  const indice = Math.max(0, pasos.indexOf(paso));
  const ultimo = pasos.length - 1;

  // Suggestions read the saved profile: asked for when the step opens.
  useEffect(() => {
    if (paso !== 'seguir' || suggested !== null) return;
    fetchSuggestedAccounts(6)
      .then(setSuggested)
      .catch(() => setSuggested([]));
  }, [paso, suggested]);

  // Tu día, armado con lo que contestaste: se pide al llegar al último paso.
  useEffect(() => {
    if (paso !== 'dia' || dia !== null) return;
    acciones
      .dia()
      .then((a) => setDia([...a].sort((x, y) => (x.minutos ?? 99) - (y.minutos ?? 99))))
      .catch(() => setDia([]));
  }, [paso, dia, acciones]);

  function irA(destino: PasoId, lista: PasoId[] = pasos) {
    const de = lista.indexOf(paso);
    const a = lista.indexOf(destino);
    setDir(a >= de ? 1 : -1);
    setPaso(destino);
    // Hasta qué paso llega la gente: el embudo del onboarding en el panel.
    if (a > de) registrarEvento(`onb_${destino}`);
  }

  function siguiente(lista: PasoId[] = pasos) {
    const i = lista.indexOf(paso);
    irA(lista[Math.min(lista.length - 1, i + 1)]!, lista);
  }

  function atras() {
    irA(pasos[Math.max(0, indice - 1)]!);
  }

  function alternar(set: Set<string>, valor: string, max?: number): Set<string> {
    const n = new Set(set);
    if (n.has(valor)) n.delete(valor);
    else if (!max || n.size < max) n.add(valor);
    return n;
  }

  async function guardar(datos: Parameters<OnboardingAcciones['guardar']>[0]): Promise<boolean> {
    setSaving(true);
    const r = await acciones.guardar(datos).catch(() => ({ ok: false, error: undefined as string | undefined }));
    setSaving(false);
    if (!r.ok) {
      toast.error('No pudimos guardar', 'Revisá tu conexión y tocá Continuar de nuevo.');
      return false;
    }
    return true;
  }

  // ── Los pasos que guardan ─────────────────────────────────────────────────

  async function desdeVos() {
    if (!name.trim()) return;
    const provincia = city === OTHER_CITY ? otherCity : city;
    if (preguntaProvincia(edad) && !provincia.trim()) {
      toast.warning('Elegí tu provincia');
      return;
    }
    const ok = await guardar({
      displayName: name,
      accountType: edad,
      ...(preguntaProvincia(edad) ? { city: provincia } : {}),
    });
    if (!ok) return;
    // Lo de la casa arranca con lo que casi todos tienen a esa edad.
    setCasa(marcadasDeEntrada(edad));
    // Cuántas acciones suma cada respuesta, para esta edad.
    void acciones.conteos().then(setConteos).catch(() => setConteos(null));
    siguiente(pasosPara(edad));
  }

  async function desdeAdulto() {
    if (!acepta || adultoNombre.trim().length < 2 || !vinculo) return;
    setSaving(true);
    const r = await acciones.autorizar(adultoNombre, vinculo).catch(() => ({ ok: false, error: 'error' }));
    setSaving(false);
    if (!r.ok) {
      toast.error('No pudimos guardar la autorización', r.error === 'nombre' ? 'Escribí el nombre de la persona adulta.' : 'Probá de nuevo.');
      return;
    }
    siguiente();
  }

  async function desdeCasa() {
    const ok = await guardar({
      displayName: name,
      interests: Array.from(temas),
      context: contextoDeRespuestas(edad, casa, edad === 'kid' ? null : ritmo ?? 'normal'),
    });
    if (!ok) return;
    // Recomendaciones con IA: sólo para cuentas adultas (las condiciones de Gemini no permiten menores).
    if (edad === 'adult') void triggerRecommendations();
    siguiente();
  }

  async function seguirElegidos() {
    if (following) return;
    setFollowing(true);
    await Promise.all(Array.from(picked).map((id) => followUser(id).catch(() => null)));
    setFollowing(false);
    siguiente();
  }

  async function hacerPrimera(a: AccionConRazon) {
    if (hecha) return;
    setHecha(a.id);
    try {
      const result = await completeActivity(a.id);
      celebrateCompletion(result);
    } catch {
      // Even if it was already done, proceed — onboarding shouldn't get stuck.
    }
    // Sin avisos posibles en este dispositivo no hay nada que preguntar.
    if (!pushSupported() || (typeof Notification !== 'undefined' && Notification.permission === 'denied')) {
      setAvisos('no');
      terminar();
    }
  }

  async function activarAvisos() {
    setAvisos('activando');
    const {
      data: { user },
    } = await createClient().auth.getUser();
    const r = user ? await subscribeToPush(user.id) : { ok: false };
    setAvisos(r.ok ? 'listo' : 'no');
    if (r.ok) toast.success('Avisos activados', 'Te aviso antes de que se corte tu racha. Nada más que eso, salvo que elijas.');
    terminar();
  }

  function terminar() {
    startTransition(async () => {
      const r = await acciones.terminar().catch(() => ({ ok: false, error: 'error' }));
      if (!r.ok) {
        if (r.error === 'falta_autorizacion') {
          toast.error('Falta la autorización', 'Una persona adulta tiene que autorizar la cuenta.');
          irA('adulto');
          return;
        }
        toast.error('No pudimos terminar', 'Probá de nuevo en un momento.');
        return;
      }
      registrarEvento('onb_fin');
      router.push('/');
      router.refresh();
    });
  }

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: reduce ? 0 : d * 28 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: reduce ? 0 : d * -28 }),
  };

  const continuar = (onClick: () => void, opts: { disabled?: boolean; label?: string } = {}) => (
    <Button block size="lg" variant="primary" className="rounded-pill" disabled={opts.disabled} loading={saving} onClick={onClick}>
      {opts.label ?? tc('continue')} <ArrowRight className="h-4 w-4" />
    </Button>
  );

  const temasPosibles = edad === 'kid' ? TEMAS_CHICOS : DOMAINS.map((d) => ({ slug: d.slug, label: d.name_es }));
  const accionesSumadas = Array.from(casa).reduce((n, k) => n + (conteos?.por_clave[k] ?? 0), 0);

  // `overflow-x-clip`, not `overflow-hidden`: hidden makes this div a scroll
  // container, and then neither the sticky header nor the sticky action bar
  // sticks to the screen.
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip bg-background">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-80 w-80 -translate-x-[75%] rounded-full bg-primary/15 blur-[110px]" />
      <div className="pointer-events-none absolute -bottom-40 right-0 h-72 w-72 translate-x-1/4 rounded-full bg-brote-sun/10 blur-[110px]" />

      {paso !== 'bienvenida' && (
        <header className="sticky top-0 z-20 bg-gradient-to-b from-background from-60% to-background/0 px-5 pb-4 pt-[max(env(safe-area-inset-top),0.9rem)]">
          <div className="mx-auto flex max-w-lg items-center gap-3">
            {paso !== 'dia' ? (
              <button
                onClick={atras}
                aria-label={tc('back')}
                className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-surface-2 hover:text-foreground"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            ) : (
              <span className="w-7" />
            )}
            <div className="min-w-0 flex-1">
              <p className="eyebrow text-muted-foreground">
                Paso {indice} de {ultimo}
              </p>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-pill bg-border" role="progressbar" aria-valuemin={0} aria-valuemax={ultimo} aria-valuenow={indice}>
                <motion.div
                  className="h-full rounded-pill bg-primary"
                  initial={false}
                  animate={{ width: `${(indice / ultimo) * 100}%` }}
                  transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 32 }}
                />
              </div>
            </div>
            <span className="w-7" />
          </div>
        </header>
      )}

      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col px-5">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={paso}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: reduce ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-1 flex-col"
          >
            {paso === 'bienvenida' && (
              <div className="flex flex-1 flex-col pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-[max(env(safe-area-inset-top),1.5rem)]">
                <div className="flex items-center gap-2">
                  <LogoMark size={24} />
                  <span className="font-display text-h3 font-extrabold tracking-tight">{BRAND.name}</span>
                </div>
                <div className="flex flex-1 flex-col justify-center py-8">
                  <Pip size={112} mood="happy" />
                  <span className="eyebrow mt-6 text-primary">Bienvenida</span>
                  <h1 className="mt-2 text-balance font-display text-display-l font-extrabold leading-[1.05]">
                    {t('welcomeTitle', { mascot: BRAND.mascot })}
                  </h1>
                  <p className="mt-3 max-w-sm text-balance leading-relaxed text-muted-foreground">{t('welcomeBody')}</p>
                  <ul className="mt-8 divide-y divide-hairline border-y border-hairline">
                    {[
                      { Icon: ListChecks, txt: 'Unas pocas preguntas: cada una cambia lo que te propongo.' },
                      { Icon: Leaf, txt: 'Ves tu día armado con tus respuestas, y hacés la primera acción.' },
                      { Icon: Globe2, txt: 'Arranca tu mundo, que crece con cada cosa que hacés.' },
                    ].map(({ Icon, txt }) => (
                      <li key={txt} className="flex items-center gap-3 py-3 text-small">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" />
                        </span>
                        {txt}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button block size="lg" variant="primary" className="rounded-pill" onClick={() => irA('vos')}>
                  {t('start')} <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {paso === 'vos' && (
              <Paso titulo="Primero, vos" bajada="Tu edad decide qué te mostramos y no se puede cambiar después: contestá con la verdad." accion={continuar(() => void desdeVos(), { disabled: !name.trim() })}>
                <div className="space-y-5">
                  <Field label="¿Qué edad tenés?">
                    <div className="grid gap-2" role="radiogroup" aria-label="Edad">
                      {EDADES.map((o) => {
                        const on = edad === o.key;
                        const Icon = ICONO_EDAD[o.key];
                        return (
                          <button
                            key={o.key}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            onClick={() => setEdad(o.key)}
                            className={cn(
                              'press flex items-center gap-3 rounded-card border p-3 text-left transition-[border-color,background-color,box-shadow] duration-150',
                              on ? 'border-primary bg-primary/10 ring-2 ring-primary/25' : 'border-border bg-surface hover:border-primary/40',
                            )}
                          >
                            <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] transition-colors', on ? 'bg-primary text-primary-foreground' : 'bg-surface-2 text-muted-foreground')}>
                              <Icon className="h-5 w-5" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-small font-semibold">{o.label}</span>
                              <span className="block text-caption leading-snug text-muted-foreground">{o.detalle}</span>
                            </span>
                            <Marca on={on} />
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                  <Field label={NOMBRE[edad].label} help={NOMBRE[edad].ayuda}>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={NOMBRE[edad].placeholder} autoComplete={edad === 'kid' ? 'off' : 'given-name'} maxLength={40} />
                  </Field>
                  {preguntaProvincia(edad) && (
                    <Field label={t('cityLabel')} help="Para tu ranking local y las acciones de tu región. La cambiás cuando quieras.">
                      <Select value={city} onChange={(e) => setCity(e.target.value)}>
                        <option value="" disabled>
                          {t('cityPlaceholder')}
                        </option>
                        {CITIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                        <option value={OTHER_CITY}>{t('cityOther')}</option>
                      </Select>
                      {city === OTHER_CITY && (
                        <Input value={otherCity} onChange={(e) => setOtherCity(e.target.value)} placeholder={t('cityOtherPlaceholder')} className="mt-2" />
                      )}
                    </Field>
                  )}
                </div>
              </Paso>
            )}

            {paso === 'adulto' && (
              <Paso
                titulo="Ahora, una persona grande"
                bajada="Pedile a tu mamá, a tu papá o a la persona adulta que te cuida que lea esto y lo complete."
                accion={continuar(() => void desdeAdulto(), { disabled: !acepta || adultoNombre.trim().length < 2 || !vinculo, label: 'Autorizo la cuenta' })}
              >
                <div className="rounded-card border border-border bg-surface p-4 shadow-soft">
                  <p className="flex items-center gap-2 text-small font-semibold">
                    <ShieldCheck className="h-4 w-4 text-primary" /> Así es la cuenta de {name.trim() || 'tu hijo o hija'}
                  </p>
                  <ul className="mt-2.5 space-y-1.5 text-caption leading-relaxed text-muted-foreground">
                    <li>· No ve publicidad y no puede comprar ni pagar nada.</li>
                    <li>· No publica, no sigue ni habla con otras personas, y nadie la encuentra en la búsqueda.</li>
                    <li>· Las noticias son elegidas para chicos y se leen dentro de la app, sin salir a otros sitios.</li>
                    <li>· Las acciones son seguras para su edad; las que necesitan ayuda dicen «con un adulto».</li>
                    <li>
                      · Guardamos sólo su apodo, su progreso y lo que nos cuente de su casa. Pueden pedirnos verlo o borrarlo en{' '}
                      <a href={`mailto:${BRAND.contactEmail}`} className="font-medium text-primary underline underline-offset-2">
                        {BRAND.contactEmail}
                      </a>
                      .
                    </li>
                  </ul>
                </div>
                <div className="mt-5 space-y-4">
                  <Field label="Tu nombre (de la persona adulta)">
                    <Input value={adultoNombre} onChange={(e) => setAdultoNombre(e.target.value)} autoComplete="name" maxLength={80} />
                  </Field>
                  <Field label="¿Qué sos de esta chica o este chico?">
                    <Select value={vinculo} onChange={(e) => setVinculo(e.target.value as typeof vinculo)}>
                      <option value="" disabled>
                        Elegí
                      </option>
                      {VINCULOS.map((v) => (
                        <option key={v.v} value={v.v}>
                          {v.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <label className="flex items-start gap-2.5 rounded-button border border-border p-3 text-small leading-relaxed">
                    <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[rgb(var(--primary))]" />
                    <span>
                      Soy la persona adulta responsable, leí cómo funciona esta cuenta, los{' '}
                      <Link href="/legal/terminos" target="_blank" className="font-semibold text-primary underline underline-offset-2">
                        términos
                      </Link>{' '}
                      y la{' '}
                      <Link href="/legal/privacidad" target="_blank" className="font-semibold text-primary underline underline-offset-2">
                        política de privacidad
                      </Link>
                      , y la autorizo.
                    </span>
                  </label>
                </div>
              </Paso>
            )}

            {paso === 'tiempo' && (
              <Paso titulo="¿Cuánto tiempo tenés por día?" bajada="Con esto armo tu día: cuántas acciones rápidas y cuántas más largas. Lo cambiás cuando quieras." accion={continuar(() => siguiente(), { disabled: !ritmo })}>
                <div className="grid gap-2" role="radiogroup" aria-label="Tiempo por día">
                  {RITMOS.map((r) => {
                    const on = ritmo === r.v;
                    return (
                      <button
                        key={r.v}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setRitmo(r.v)}
                        className={cn(
                          'press flex items-center gap-3 rounded-card border p-3.5 text-left transition-[border-color,background-color] duration-150',
                          on ? 'border-primary bg-primary/10 ring-2 ring-primary/25' : 'border-border bg-surface hover:border-primary/40',
                        )}
                      >
                        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]', on ? 'bg-primary text-primary-foreground' : 'bg-surface-2 text-muted-foreground')}>
                          <Clock className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-small font-semibold">{r.titulo}</span>
                          <span className="block text-caption leading-snug text-muted-foreground">{r.detalle}</span>
                        </span>
                        <Marca on={on} />
                      </button>
                    );
                  })}
                </div>
                {conteos && (
                  <p className="mt-4 text-caption leading-relaxed text-muted-foreground tnum">
                    Hay {conteos.rapidas} acciones de 5 minutos o menos para vos, de {conteos.total} en total.
                  </p>
                )}
              </Paso>
            )}

            {paso === 'temas' && (
              <Paso
                titulo={edad === 'kid' ? '¿Qué te gusta más?' : '¿Por dónde querés empezar?'}
                bajada={`Elegí hasta ${MAX_TEMAS}: esas acciones te salen primero. Si no elegís, te muestro un poco de todo.`}
                accion={continuar(() => siguiente(), { label: temas.size === 0 ? 'Un poco de todo' : undefined })}
              >
                <p className="mb-3 text-caption text-muted-foreground tnum" aria-live="polite">
                  {temas.size} de {MAX_TEMAS}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {temasPosibles.map((d) => {
                    const dom = DOMAINS.find((x) => x.slug === d.slug);
                    const active = temas.has(d.slug);
                    const lleno = !active && temas.size >= MAX_TEMAS;
                    return (
                      <button
                        key={d.slug}
                        type="button"
                        aria-pressed={active}
                        disabled={lleno}
                        onClick={() => setTemas((s) => alternar(s, d.slug, MAX_TEMAS))}
                        className={cn(
                          'press relative flex items-center gap-2.5 overflow-hidden rounded-card border p-2.5 text-left transition-[border-color,background-color,opacity] duration-150 disabled:opacity-45',
                          active ? 'bg-surface' : 'border-border bg-surface hover:border-border/60 hover:bg-surface-2',
                        )}
                        style={active && dom ? { borderColor: dom.color, backgroundColor: `${dom.color}14` } : undefined}
                      >
                        {/* The check sits on the icon, so a long single word ("Alimentación") has room. */}
                        <span className="relative shrink-0">
                          <DomainIcon domain={d.slug} size={34} />
                          {active && (
                            <span
                              className="absolute -right-1.5 -top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full text-white ring-2 ring-surface"
                              style={dom ? { backgroundColor: dom.color } : undefined}
                            >
                              <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                            </span>
                          )}
                        </span>
                        <span className="min-w-0 flex-1 text-small font-medium leading-tight">{d.label}</span>
                      </button>
                    );
                  })}
                </div>
              </Paso>
            )}

            {paso === 'casa' && (
              <Paso
                titulo={edad === 'kid' ? 'Contame de tu casa' : 'Tu casa y tu día'}
                bajada={
                  edad === 'kid'
                    ? 'Marcá lo que hay: así te propongo cosas que sí podés hacer.'
                    : 'Marcá lo que tengas. Cada cosa suma acciones que la piden; lo que no marques no te va a aparecer.'
                }
                accion={continuar(() => void desdeCasa())}
              >
                <div className="space-y-5">
                  {PREGUNTAS_CASA[edad].map((p) => {
                    const opciones = opcionesVisibles(p, conteos?.por_clave ?? null);
                    if (opciones.length === 0) return null;
                    return (
                      <div key={p.titulo}>
                        <p className="mb-2 text-small font-semibold">{p.titulo}</p>
                        <div className="flex flex-wrap gap-2">
                          {opciones.map((o) => {
                            const on = casa.has(o.clave);
                            const n = conteos?.por_clave[o.clave];
                            return (
                              <button
                                key={o.clave}
                                type="button"
                                aria-pressed={on}
                                onClick={() => setCasa((s) => alternar(s, o.clave))}
                                className={cn(
                                  'press inline-flex min-h-[40px] items-center gap-1.5 rounded-pill border px-3.5 py-2 text-small font-medium transition-colors',
                                  on ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-surface text-foreground hover:border-primary/40',
                                )}
                              >
                                {on && <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />}
                                {o.label}
                                {n ? <span className={cn('text-caption tnum', on ? 'text-primary-foreground/80' : 'text-muted-foreground')}>+{n}</span> : null}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-5 text-caption leading-relaxed text-muted-foreground tnum" aria-live="polite">
                  {accionesSumadas > 0
                    ? `Sumaste ${accionesSumadas} acciones que piden algo de esto, además de las que le sirven a cualquiera.`
                    : 'Si no marcás nada, igual tenés cientos de acciones que le sirven a cualquiera.'}
                </p>
              </Paso>
            )}

            {paso === 'seguir' && (
              <Paso
                titulo={t('followTitle')}
                bajada={t('followHelp')}
                accion={
                  <div className="flex gap-3">
                    <Button variant="ghost" size="lg" className="flex-1" onClick={() => siguiente()}>
                      {t('followSkip')}
                    </Button>
                    <Button variant="primary" size="lg" className="flex-[2] rounded-pill" loading={following} disabled={picked.size === 0} onClick={seguirElegidos}>
                      {t('followCta', { n: picked.size })}
                    </Button>
                  </div>
                }
              >
                <div className="divide-y divide-hairline overflow-hidden rounded-card border border-border bg-surface">
                  {suggested === null ? (
                    [0, 1, 2].map((i) => <div key={i} className="skeleton m-3 h-[52px] rounded-button" />)
                  ) : suggested.length === 0 ? (
                    <p className="p-4 text-small leading-relaxed text-muted-foreground">{t('followEmpty')}</p>
                  ) : (
                    suggested.map((a) => {
                      const active = picked.has(a.id);
                      return (
                        <button
                          key={a.id}
                          onClick={() => setPicked((s) => alternar(s, a.id))}
                          aria-pressed={active}
                          className={cn('flex w-full items-center gap-3 p-3 text-left transition-colors duration-150', active ? 'bg-primary/10' : 'hover:bg-surface-2')}
                        >
                          <PipAvatar pipStyle={a.pip_style} avatarUrl={a.avatar_url} name={a.display_name} rankSlug={a.rank_slug} size={40} ring />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-small font-semibold">{a.display_name ?? a.username}</span>
                            <span className="eyebrow block truncate text-muted-foreground">{['@' + (a.username ?? ''), a.city].filter(Boolean).join(' · ')}</span>
                          </span>
                          <span
                            className={cn(
                              'inline-flex h-8 shrink-0 items-center rounded-pill border px-3 text-caption font-semibold transition-colors',
                              active ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-foreground',
                            )}
                          >
                            {active ? 'Siguiendo' : 'Seguir'}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </Paso>
            )}

            {paso === 'mundo' && (
              <Paso titulo={t('mundoTitle')} bajada={t('mundoBody')} accion={continuar(() => siguiente())}>
                {/* Real frames of the game at three points of the journey, not illustrations. */}
                <figure className="leaf-clip relative overflow-hidden rounded-card shadow-soft-lg">
                  <Image src="/mundo/poster-t1.jpg" alt="Tu mundo el primer día: pasto, un pozo de agua y Pip" width={1200} height={600} className="aspect-[16/10] w-full object-cover" priority />
                  <figcaption className="absolute bottom-3 left-3 rounded-pill bg-brote-ink/75 px-3 py-1 text-caption font-semibold text-brote-cream backdrop-blur">Hoy</figcaption>
                </figure>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {[
                    { src: '/mundo/poster-t5.jpg', label: 'Con constancia', alt: 'Tu mundo después de algunas semanas' },
                    { src: '/mundo/poster-t9.jpg', label: 'Más adelante', alt: 'Tu mundo lleno de árboles en flor y agua' },
                  ].map((f) => (
                    <figure key={f.src} className="relative overflow-hidden rounded-card">
                      <Image src={f.src} alt={f.alt} width={600} height={300} className="aspect-[16/10] w-full object-cover" />
                      <figcaption className="absolute bottom-2 left-2 rounded-pill bg-brote-ink/75 px-2.5 py-0.5 text-caption font-semibold text-brote-cream backdrop-blur">{f.label}</figcaption>
                    </figure>
                  ))}
                </div>
                <p className="mt-4 text-caption leading-relaxed text-muted-foreground">
                  Lo que construís en tu mundo no se pierde nunca: crece con tus acciones y te espera si un día no entrás.
                </p>
              </Paso>
            )}

            {paso === 'dia' && (
              <Paso
                pip={hecha ? 'celebrating' : 'happy'}
                titulo={hecha ? '¡Listo, tu primera acción!' : 'Tu día, armado con tus respuestas'}
                bajada={hecha ? 'Ya empezó tu racha. Mañana, otro día nuevo.' : 'Estas son tus acciones de hoy. Elegí una y tocala cuando la hagas: Brote funciona por confianza.'}
                accion={
                  hecha && avisos === 'pregunta' ? (
                    <div className="flex gap-3">
                      <Button
                        variant="ghost"
                        size="lg"
                        className="flex-1"
                        onClick={() => {
                          setAvisos('no');
                          terminar();
                        }}
                      >
                        Ahora no
                      </Button>
                      <Button variant="primary" size="lg" className="flex-[2] rounded-pill" onClick={activarAvisos}>
                        <Bell className="h-4 w-4" /> Avisame
                      </Button>
                    </div>
                  ) : hecha ? (
                    <Button block size="lg" variant="primary" className="rounded-pill" loading>
                      {t('finishing')}
                    </Button>
                  ) : (
                    <Button block size="lg" variant="ghost" loading={pending} onClick={terminar}>
                      Las hago más tarde
                    </Button>
                  )
                }
              >
                {dia === null ? (
                  <div className="space-y-2">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="skeleton h-[68px] rounded-card" />
                    ))}
                  </div>
                ) : dia.length === 0 ? (
                  <p className="text-small text-muted-foreground">No pudimos armar tu día ahora. Lo vas a ver en el inicio.</p>
                ) : (
                  <ul className="space-y-2">
                    {dia.map((a) => {
                      const porque = razonTexto(a.razon ?? null, { dominio: (s) => DOMAINS.find((d) => d.slug === s)?.name_es });
                      return (
                        <li key={a.id}>
                          <DailyActionRow
                            title={a.title_es}
                            domain={a.domain_slug}
                            points={a.base_points}
                            done={hecha === a.id}
                            loading={pending && hecha === a.id}
                            onComplete={hecha ? undefined : () => void hacerPrimera(a)}
                          />
                          {(porque || a.minutos) && (
                            <p className="mt-1 px-1 text-caption text-muted-foreground">
                              {[a.minutos ? `${a.minutos} min` : null, porque].filter(Boolean).join(' · ')}
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}

                <AnimatePresence>
                  {hecha && avisos !== 'no' && (
                    <motion.div
                      initial={{ opacity: 0, y: reduce ? 0 : 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: reduce ? 0 : 0.35, duration: 0.3 }}
                      className="mt-6 rounded-card border border-border bg-surface p-4 shadow-soft"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-brote-sun/15 text-brote-sun">
                          <BellRing className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-small font-semibold">¿Te aviso antes de que se corte tu racha?</p>
                          <p className="mt-1 text-caption leading-relaxed text-muted-foreground">
                            Un aviso a la noche sólo si ese día no hiciste nada. En Ajustes elegís qué más te llega, y a la noche nunca suena.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Paso>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Marca({ on }: { on: boolean }) {
  return (
    <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors', on ? 'border-primary bg-primary text-primary-foreground' : 'border-border')}>
      {on && <Check className="h-3 w-3" strokeWidth={3} />}
    </span>
  );
}

/**
 * One step: title + Pip on top, content that scrolls, the action pinned at the
 * bottom above the phone's safe area.
 */
function Paso({
  titulo,
  bajada,
  pip = 'happy',
  accion,
  children,
}: {
  titulo: string;
  bajada?: string;
  pip?: 'happy' | 'celebrating';
  accion: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-start gap-3 pt-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-balance font-display text-h1 font-bold leading-tight">{titulo}</h1>
          {bajada && <p className="mt-1.5 text-balance text-small leading-relaxed text-muted-foreground">{bajada}</p>}
        </div>
        <Pip size={52} mood={pip} className="shrink-0" />
      </div>
      <div className="flex-1 pb-6 pt-5">{children}</div>
      {accion && (
        <div className="sticky bottom-0 -mx-5 mt-auto bg-gradient-to-t from-background via-background to-background/0 px-5 pb-[max(env(safe-area-inset-bottom),1rem)] pt-4">
          {accion}
        </div>
      )}
    </div>
  );
}
