import type { ReactNode } from 'react';
import { cn } from '@lib/utils';

type BadgeVariant = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'slate';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

const variants: Record<BadgeVariant, string> = {
  brand:   'bg-brand-100 dark:bg-brand-900/30 text-brand-800 dark:text-brand-300',
  success: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300',
  warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300',
  danger:  'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
  info:    'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300',
  slate:   'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
};

export function Badge({ variant = 'slate', size = 'sm', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-semibold',
        size === 'sm' ? 'px-2 py-0.5 text-2xs' : 'px-2.5 py-1 text-xs',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
