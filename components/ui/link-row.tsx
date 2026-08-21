import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * A card-shaped row that navigates somewhere: icon, title, one line of
 * explanation, chevron.
 *
 * This exact markup was hand-written twice on the home screen alone and again
 * in settings, each copy drifting slightly (different hover, different icon
 * sizes, one of them using an emoji where the others used lucide). One
 * component keeps the affordance identical everywhere it appears.
 */
export function LinkRow({
  href,
  icon,
  title,
  description,
  accent,
  trailing,
  className,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description?: string;
  /** Hex for the icon tile tint. Defaults to the brand green. */
  accent?: string;
  trailing?: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'press group flex items-center gap-3 rounded-card border border-border bg-surface p-3.5 shadow-soft',
        'hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift',
        className,
      )}
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] transition-transform duration-200 group-hover:scale-105"
        style={{
          backgroundColor: `${accent ?? '#1FB57A'}26`,
          color: accent ?? '#1FB57A',
        }}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-small font-semibold leading-tight">
          <span className="link-underline">{title}</span>
        </span>
        {description && (
          <span className="mt-0.5 block text-caption leading-relaxed text-muted-foreground">{description}</span>
        )}
      </span>
      {trailing}
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}
