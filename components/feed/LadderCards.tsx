'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Users, Sprout, GraduationCap, Clock, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { DomainIcon } from '@/components/icons/DomainIcon';
import { PipAvatar } from '@/components/pip/PipAvatar';
import { FollowButton } from '@/components/social/FollowButton';
import { getDomain } from '@/lib/domains';
import { formatPoints } from '@/lib/points';
import type { LadderItem } from '@/lib/api/feed';

/**
 * The bottom of the feed, when there is no more feed.
 *
 * A social product that ends in "no hay nada más" teaches people to stop
 * scrolling. Brote has an answer that a pure social product does not: when it
 * runs out of things to *read*, it still has things to *do*. So the tail of the
 * river is people to follow, a project near you, an action you have not done,
 * and the next lesson — each one a real row from the database, never a filler
 * card. The honest end state comes after these, not instead of them.
 *
 * Each step gets its own eyebrow so it reads as a section change rather than
 * more of the same list.
 */
export function LadderCards({ items }: { items: LadderItem[] }) {
  const t = useTranslations('feed');

  if (items.length === 0) return null;

  // One eyebrow per run of the same kind, not one per card.
  let lastKind: string | null = null;

  return (
    <div className="space-y-3 pt-2">
      {items.map((item) => {
        const showEyebrow = item.ladder !== lastKind;
        lastKind = item.ladder;
        return (
          <div key={item.id}>
            {showEyebrow && (
              <span className="eyebrow mb-1.5 block text-muted-foreground">
                {item.ladder === 'discover'
                  ? t('ladderDiscover')
                  : item.ladder === 'project'
                    ? t('ladderProject')
                    : item.ladder === 'action'
                      ? t('ladderAction')
                      : t('ladderLesson')}
              </span>
            )}
            <LadderCard item={item} />
          </div>
        );
      })}
    </div>
  );
}

function LadderCard({ item }: { item: LadderItem }) {
  const t = useTranslations('feed');

  if (item.ladder === 'discover') {
    return (
      <Card className="p-4">
        <p className="mb-3 text-small leading-relaxed text-muted-foreground">{t('ladderDiscoverBody')}</p>
        <ul className="divide-y divide-hairline">
          {item.accounts.map((a) => (
            <li key={a.id} className="flex items-center gap-3 py-2.5">
              <PipAvatar
                pipStyle={a.pip_style}
                avatarUrl={a.avatar_url}
                name={a.display_name}
                rankSlug={a.rank_slug}
                size={36}
                ring
                href={a.username ? `/perfil/${a.username}` : undefined}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-small font-semibold">{a.display_name ?? a.username}</p>
                <p className="eyebrow truncate text-muted-foreground">
                  {['@' + (a.username ?? ''), a.city].filter(Boolean).join(' · ')}
                </p>
              </div>
              <FollowButton targetId={a.id} initialFollowing={a.is_following ?? false} size="sm" />
            </li>
          ))}
        </ul>
      </Card>
    );
  }

  if (item.ladder === 'project') {
    const dom = item.project.domain_slug ? getDomain(item.project.domain_slug) : undefined;
    return (
      <Link
        href={`/proyectos/${item.project.id}`}
        className="press group block overflow-hidden rounded-card border border-border bg-surface shadow-soft hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift"
      >
        {item.project.image_url && (
          // Fixed aspect box so nothing shifts while the image arrives.
          <div className="aspect-[16/9] w-full overflow-hidden bg-surface-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.project.image_url}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>
        )}
        <div className="flex items-start gap-3 p-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-small font-semibold">{item.project.title}</p>
            {item.project.description && (
              <p className="mt-0.5 line-clamp-2 text-caption leading-relaxed text-muted-foreground">
                {item.project.description}
              </p>
            )}
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-caption text-muted-foreground">
              {item.project.city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {item.project.city}
                </span>
              )}
              {item.project.participants > 0 && (
                <span className="tnum">{t('ladderPeople', { n: item.project.participants })}</span>
              )}
              {dom && (
                <Pill color={dom.color} size="sm">
                  {dom.name_es}
                </Pill>
              )}
            </p>
          </div>
        </div>
      </Link>
    );
  }

  if (item.ladder === 'action') {
    return (
      <Link
        href={`/acciones/${item.action.slug}`}
        className="press group flex items-start gap-3 rounded-card border border-border bg-surface p-3.5 shadow-soft hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift"
      >
        <span className="shrink-0 transition-transform duration-200 group-hover:scale-105">
          <DomainIcon domain={item.action.domain_slug ?? 'comunidad'} size={44} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 flex-1 text-small font-semibold">{item.action.title_es}</p>
            <span className="shrink-0 rounded-pill bg-primary/10 px-2 py-0.5 text-caption font-bold text-primary tnum">
              +{formatPoints(item.action.base_points)}
            </span>
          </div>
          {item.action.short_es && (
            <p className="mt-0.5 line-clamp-2 text-caption leading-relaxed text-muted-foreground">
              {item.action.short_es}
            </p>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link
      /*
       * La Academia (fase 2) retiró `/aprender/[slug]`, la pantalla vieja de
       * lecciones, y su ruta ahora la ocupa la rama del bosque. Este peldaño
       * sigue apuntando a la sección, que es lo que la persona espera al
       * tocarlo; el mapeo lección → hoja nueva vive en
       * `scripts/academia/plantillas/legado.mjs` y lo cierra la fase 3.
       */
      href="/aprender"
      className="press group flex items-start gap-3 rounded-card border border-border bg-surface p-3.5 shadow-soft hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-brote-sun/15">
        <GraduationCap className="h-5 w-5 text-brote-sun" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 flex-1 text-small font-semibold">{item.lesson.title_es}</p>
          {item.lesson.reward_points ? (
            <span className="shrink-0 rounded-pill bg-primary/10 px-2 py-0.5 text-caption font-bold text-primary tnum">
              +{formatPoints(item.lesson.reward_points)}
            </span>
          ) : null}
        </div>
        {item.lesson.summary_es && (
          <p className="mt-0.5 line-clamp-2 text-caption leading-relaxed text-muted-foreground">
            {item.lesson.summary_es}
          </p>
        )}
        {item.lesson.minutes ? (
          <p className="mt-1 inline-flex items-center gap-1 text-caption text-muted-foreground">
            <Clock className="h-3 w-3" />
            {t('ladderMinutes', { n: item.lesson.minutes })}
          </p>
        ) : null}
      </div>
      <Sprout className="mt-1 h-4 w-4 shrink-0 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}
