'use client';

import dynamic from 'next/dynamic';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/ui/pill';
import { Input, Textarea, Select, Field } from '@/components/ui/input';
import { Pip } from '@/components/pip/Pip';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/stores/session';
import { useCupoProyectos, useNombreRango } from '@/hooks/use-rango';
import { DOMAINS } from '@/lib/domains';
import { BARRIOS } from '@/lib/data/barrios';
import { createProject, uploadProjectImage } from '@/lib/api/plaza';
import { toast } from '@/stores/toast';

const ProjectMap = dynamic(() => import('@/components/plaza/ProjectMap'), {
  ssr: false,
  loading: () => <Skeleton className="h-[200px] w-full" />,
});

const TYPES = [
  { v: 'limpieza', l: 'Limpieza' },
  { v: 'plantacion', l: 'Plantación' },
  { v: 'educacion', l: 'Educación' },
  { v: 'reciclaje', l: 'Reciclaje' },
  { v: 'otro', l: 'Otro' },
];

export default function NuevoProyectoPage() {
  const t = useTranslations('proyectos');
  const tc = useTranslations('common');
  const router = useRouter();
  const profile = useSession((s) => s.profile);
  const fileRef = useRef<HTMLInputElement>(null);
  const cupoQ = useCupoProyectos();
  const nombreRango = useNombreRango();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('limpieza');
  const [domain, setDomain] = useState('comunidad');
  const [neighborhood, setNeighborhood] = useState(profile?.neighborhood ?? '');
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [eventDate, setEventDate] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [minRango, setMinRango] = useState(1);
  const [contactInfo, setContactInfo] = useState('');
  const [contactKind, setContactKind] = useState<'whatsapp' | 'email' | 'instagram' | 'telegram' | 'otro'>('whatsapp');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Organising is for adult accounts (0120): the server refuses anyone else.
  if (profile && (profile.accountType ?? 'adult') !== 'adult') {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Pip size={80} mood="neutral" />
        <h1 className="font-display text-h2 font-bold">{t('createAdults')}</h1>
        <p className="max-w-xs text-small text-muted-foreground">{t('createAdultsBody')}</p>
        <Button variant="secondary" asChild>
          <Link href="/acciones?tab=proyectos">{tc('back')}</Link>
        </Button>
      </div>
    );
  }
  // Gate read from the server, so this screen and create_project() can never
  // disagree about who is allowed to organise (0137).
  const cupo = cupoQ.data;
  if (profile && cupoQ.isLoading) return <Skeleton className="h-64 w-full" />;
  if (profile && cupo && cupo.libres <= 0) {
    const periodo = 'este período';
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Pip size={80} mood="neutral" />
        <h1 className="font-display text-h2 font-bold">
          {cupo.cupo > 0 ? `Ya estás organizando lo que da ${cupo.efectivo_nombre}` : t('createGated', { rank: cupo.min_nombre })}
        </h1>
        <p className="max-w-xs text-small text-muted-foreground">
          {cupo.cupo > 0
            ? `Como ${cupo.efectivo_nombre} podés tener ${cupo.cupo === 1 ? '1 proyecto' : `${cupo.cupo} proyectos`} a la vez. Cuando termine uno, o si subís de rango, podés abrir otro.`
            : `Organizar significa coordinar gente en persona, así que depende de lo que venís haciendo: ${periodo} sos ${cupo.efectivo_nombre}, y hace falta llegar a ${cupo.min_nombre}.`}
        </p>
        <div className="flex gap-2">
          <Button variant="primary" asChild>
            <Link href="/ranking">Ver mi rango</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/acciones?tab=proyectos">{tc('back')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      setImageFile(f);
      setImagePreview(URL.createObjectURL(f));
    }
  }

  async function submit() {
    if (!title.trim() || !profile?.id || saving) return;
    setSaving(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile) imageUrl = await uploadProjectImage(profile.id, imageFile);
      const id = await createProject({
        title: title.trim(),
        description: description.trim(),
        type,
        domain,
        neighborhood: neighborhood.trim(),
        locationText: neighborhood.trim(),
        lat: pos?.lat ?? null,
        lng: pos?.lng ?? null,
        eventDate: eventDate ? new Date(eventDate).toISOString() : null,
        maxParticipants: maxParticipants ? Number(maxParticipants) : null,
        imageUrl,
        minRango,
        contactInfo: contactInfo.trim() || null,
        contactKind: contactInfo.trim() ? contactKind : null,
      });
      toast.success('¡Proyecto creado!');
      router.push(`/proyectos/${id}`);
    } catch (e) {
      toast.error('No se pudo crear', e instanceof Error ? e.message : '');
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 pb-6">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-small text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> {tc('back')}
      </button>
      <h1 className="font-display text-h1 font-bold">{t('createProject')}</h1>

      <Field label="Título">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Limpieza en la plaza" />
      </Field>
      <Field label="Descripción">
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Contá de qué se trata" />
      </Field>

      <Field label="Tipo">
        <div className="flex flex-wrap gap-2">
          {TYPES.map((ty) => (
            <button key={ty.v} onClick={() => setType(ty.v)} type="button">
              <Pill active={type === ty.v} size="sm">
                {ty.l}
              </Pill>
            </button>
          ))}
        </div>
      </Field>

      {/*
        These wrap instead of scrolling horizontally. With a hidden scrollbar
        there was nothing indicating more existed, so only about four of the
        thirteen themes were ever discovered.
      */}
      <Field label="Tema">
        <div className="flex flex-wrap gap-1.5">
          {DOMAINS.map((d) => (
            <button key={d.slug} onClick={() => setDomain(d.slug)} type="button">
              <Pill color={d.color} active={domain === d.slug} size="sm">
                {d.name_es}
              </Pill>
            </button>
          ))}
        </div>
      </Field>

      <Field label="Barrio">
        <Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} list="barrios" />
        <datalist id="barrios">
          {BARRIOS.map((b) => (
            <option key={b} value={b} />
          ))}
        </datalist>
      </Field>

      <Field label="Ubicación (tocá el mapa)" help={pos ? `${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}` : 'Opcional'}>
        <ProjectMap lat={pos?.lat ?? null} lng={pos?.lng ?? null} height={200} onPick={(lat, lng) => setPos({ lat, lng })} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Fecha">
          <Input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
        </Field>
        <Field label="Cupos (opcional)">
          <Input type="number" min={1} value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} />
        </Field>
      </div>

      {/* A project nobody can coordinate with never actually happens (F14.8). */}
      <div className="grid grid-cols-[110px_1fr] gap-2">
        <Field label="Contacto">
          <Select value={contactKind} onChange={(e) => setContactKind(e.target.value as typeof contactKind)}>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email</option>
            <option value="instagram">Instagram</option>
            <option value="telegram">Telegram</option>
            <option value="otro">Otro</option>
          </Select>
        </Field>
        <Field label="Para coordinar (opcional)" help="Lo ven quienes se suman, para organizar los encuentros.">
          <Input
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            placeholder="Ej: +54 9 11 5555-5555"
            maxLength={120}
          />
        </Field>
      </div>

      <Field label="Quién se puede sumar" help="Se mira al sumarse: si alguien baja de rango después, no pierde su lugar.">
        <Select value={minRango} onChange={(e) => setMinRango(Number(e.target.value))}>
          <option value={1}>Cualquier persona</option>
          {[2, 3, 4, 5, 6, 7]
            .filter((t) => t <= (cupo?.efectivo ?? 1))
            .map((t) => (
              <option key={t} value={t}>
                Desde {nombreRango(t)}
              </option>
            ))}
        </Select>
      </Field>

      <Field label="Imagen (opcional)">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickImage} />
        {imagePreview ? (
          <button onClick={() => fileRef.current?.click()} className="block w-full overflow-hidden rounded-card border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="" className="h-40 w-full object-cover" />
          </button>
        ) : (
          <Button variant="secondary" block onClick={() => fileRef.current?.click()}>
            <ImagePlus className="h-4 w-4" /> Agregar imagen
          </Button>
        )}
      </Field>

      <Button block variant="primary" size="lg" loading={saving} disabled={!title.trim()} onClick={submit}>
        {t('createProject')}
      </Button>
    </div>
  );
}

