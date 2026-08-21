'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils/cn';

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: TabsPrimitive.TabsListProps) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex items-center gap-1 rounded-pill border border-border bg-surface-2 p-1',
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: TabsPrimitive.TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-pill px-3.5 py-1.5 text-small font-medium text-muted-foreground',
        'transition-[background-color,color,box-shadow] duration-200',
        'hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-crisp data-[state=active]:hover:text-primary-foreground',
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: TabsPrimitive.TabsContentProps) {
  return (
    <TabsPrimitive.Content
      className={cn('mt-4 focus-visible:outline-none', className)}
      {...props}
    />
  );
}
