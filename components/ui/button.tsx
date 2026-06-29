'use client';

import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { haptic } from '@/lib/utils/haptics';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-button font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] select-none',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground shadow-soft hover:bg-brote-green-deep',
        secondary: 'bg-surface-2 text-foreground border border-border hover:bg-muted',
        ghost: 'bg-transparent text-foreground hover:bg-surface-2',
        danger: 'bg-brote-coral text-white hover:brightness-95',
        sun: 'bg-brote-sun text-brote-ink shadow-soft hover:brightness-95',
        outline: 'border border-primary/50 text-primary hover:bg-primary/10',
      },
      size: {
        sm: 'h-9 px-3.5 text-small',
        md: 'h-11 px-5 text-body',
        lg: 'h-13 px-6 text-body h-[3.25rem]',
        icon: 'h-11 w-11',
        'icon-sm': 'h-9 w-9',
      },
      block: { true: 'w-full', false: '' },
    },
    defaultVariants: { variant: 'primary', size: 'md', block: false },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  /** Fire a light haptic on press (default true for primary/sun). */
  withHaptic?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, block, asChild, loading, withHaptic = true, children, onClick, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, block }), className)}
        onClick={(e) => {
          if (withHaptic) haptic('light');
          onClick?.(e as React.MouseEvent<HTMLButtonElement>);
        }}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
