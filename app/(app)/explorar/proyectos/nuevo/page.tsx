'use client';

import dynamic from 'next/dynamic';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Lock, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pill } from '@/components/ui/pill';
import { Pip } from '@/components/pip/Pip';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/stores/session';
import { meetsRank, RANKS } from '@/lib/ranks';
import { DOMAINS } from '@/lib/domains';
import { BARRIOS } from '@/lib/data/barrios';
import { createProject, uploadProjectImage } from '@/lib/api/explorar';
import { toast } from '@/stores/toast';

const ProjectMap = dynamic(() => import('@/components/explorar/ProjectMap'), {
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

const inputCls =
  'w-full rounded-button border border-border bg-surface px-4 py-2.5 text-body outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-ring';

export default function NuevoProyectoPage() {
  const t = useTranslations('explorar');
  const tc = useTranslations('common');
  const router = useRouter();
  const profile = useSession((s) => s.profile);
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('limpieza');
  const [domain, setDomain] = useState('comunidad');
  const [neighborhood, setNeighborhood] = useState(profile?.neighborhood ?? '');
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [eventDate, setEventDate] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [minRank, setMinRank] = useState('semilla');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (profile && !meetsRank(profile.totalXp, 'plantula')) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Pip size={80} mood="neutral" />
        <h1 className="font-display text-h2 font-bold">{t('createGated', { rank: 'Plántula' })}</h1>
        <p className="max-w-xs text-small text-muted-foreground">
          Subí de rango completando acciones y vas a poder crear proyectos para tu comunidad.
        </p>
        <Button variant="secondary" asChild>
          <Link href="/explorar">{tc('back')}</Link>
        </Button>
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
        minRank,
      });
      toast.success('¡Proyecto creado!');
      router.push(`/explorar/proyectos/${id}`);
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
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="Ej: Limpieza en la plaza" />
      </Field>
      <Field label="Descripción">
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputCls} min-h-24`} placeholder="Contá de qué se trata" />
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

      <Field label="Tema">
        <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
          {DOMAINS.map((d) => (
            <button key={d.slug} onClick={() => setDomain(d.slug)} type="button" className="shrink-0">
              <Pill color={d.color} active={domain === d.slug} size="sm">
                {d.name_es}
              </Pill>
            </button>
          ))}
        </div>
      </Field>

      <Field label="Barrio">
        <input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} list="barrios" className={inputCls} />
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
          <input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Cupos (opcional)">
          <input type="number" min={1} value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} className={inputCls} />
        </Field>
      </div>

      <Field label="Rango mínimo para sumarse" help="Podés crear un proyecto exclusivo para rangos altos.">
        <select value={minRank} onChange={(e) => setMinRank(e.target.value)} className={inputCls}>
          {RANKS.map((r) => (
            <option key={r.slug} value={r.slug}>
              {r.name_es}
            </option>
          ))}
        </select>
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

function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-small font-medium">{label}</span>
      {children}
      {help && <span className="mt-1 block text-caption text-muted-foreground">{help}</span>}
    </label>
  );
}
