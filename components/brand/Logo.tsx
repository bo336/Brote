import { BRAND } from '@/lib/brand';
import { cn } from '@/lib/utils/cn';

/** The Brote sprout mark. Pure SVG, themes with currentColor accents. */
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none" className={className} aria-hidden>
      <path d="M16 30V14" stroke="#0E7A52" strokeWidth="3" strokeLinecap="round" />
      <path
        d="M16 16C16 16 7 16 5 9C12 7 16 11 16 16Z"
        fill="#1FB57A"
      />
      <path
        d="M16 14C16 14 25 13 28 6C20 4 16 9 16 14Z"
        fill="#9CC93B"
      />
      <circle cx="16" cy="6" r="3" fill="#FFB23E" />
    </svg>
  );
}

export function Logo({ size = 28, showName = true, className }: { size?: number; showName?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark size={size} />
      {showName && (
        <span className="font-display text-h3 font-extrabold tracking-tight text-foreground">
          {BRAND.name}
        </span>
      )}
    </span>
  );
}
