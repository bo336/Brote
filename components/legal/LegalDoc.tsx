import type { ReactNode } from 'react';

/**
 * Typographic primitives for the legal documents. Kept separate from the app's
 * component kit because these pages are intentionally conventional — they
 * should read like every other terms page on the web, not like the product.
 */

export function LegalTitle({ title, updated, intro }: { title: string; updated: string; intro: string }) {
  return (
    <div className="mb-8 border-b border-border pb-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Documento legal</p>
      <h1 className="mt-2 font-display text-display-l font-extrabold leading-tight">{title}</h1>
      <p className="mt-2 text-caption text-muted-foreground">Última actualización: {updated}</p>
      <p className="mt-4 text-body leading-relaxed text-muted-foreground">{intro}</p>
    </div>
  );
}

export function Section({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <section className="mb-8 scroll-mt-20" id={`s${n}`}>
      <h2 className="mb-2 font-display text-h2 font-bold leading-snug">
        <span className="mr-2 text-muted-foreground">{n}.</span>
        {title}
      </h2>
      <div className="space-y-3 text-body leading-relaxed [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2">
        {children}
      </div>
    </section>
  );
}

export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}

/** A highlighted plain-language summary — legal text people actually read. */
export function PlainSummary({ children }: { children: ReactNode }) {
  return (
    <div className="mb-8 rounded-card border border-primary/30 bg-primary/5 p-4">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">En criollo</p>
      <div className="space-y-2 text-small leading-relaxed">{children}</div>
    </div>
  );
}
