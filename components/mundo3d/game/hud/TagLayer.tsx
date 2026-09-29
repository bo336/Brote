'use client';

import { tagElements, useTags, type TagTone } from '../tags';

/**
 * The DOM half of the world tags: one small card per tag, positioned every
 * frame by `TagProjector`. This component only re-renders when a tag's *text*
 * changes, never when the camera moves.
 */
const TONE: Record<TagTone, string> = {
  site: 'bg-brote-ink/70 text-white ring-1 ring-brote-sun/60',
  parcel: 'bg-brote-ink/60 text-white',
  cast: 'bg-brote-cream/95 text-brote-ink',
  station: 'bg-brote-ink/60 text-white',
  alert: 'bg-brote-sun text-brote-ink',
};

export function TagLayer() {
  const tags = useTags((s) => s.tags);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {[...tags.values()].map((tag) => (
        <div
          key={tag.id}
          ref={(el) => {
            if (el) tagElements.set(tag.id, el);
            else tagElements.delete(tag.id);
          }}
          className="absolute left-0 top-0 will-change-transform"
          style={{ opacity: 0, visibility: 'hidden' }}
        >
          <div className={`relative whitespace-nowrap rounded-xl px-2.5 py-1 text-center shadow-soft backdrop-blur-sm ${TONE[tag.tone]}`}>
            {tag.badge && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-brote-sun px-1 text-[11px] font-black text-brote-ink shadow">
                {tag.badge}
              </span>
            )}
            <p className="text-[12px] font-bold leading-tight">{tag.title}</p>
            {tag.lines?.map((l) => (
              <p key={l} className="tnum text-[11px] leading-tight opacity-85">{l}</p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
