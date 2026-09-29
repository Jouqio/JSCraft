import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftAddon?: ReactNode;
  rightAddon?: ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftAddon, rightAddon, fullWidth, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftAddon && (
            <div className="pointer-events-none absolute left-3 flex items-center text-slate-400">
              {leftAddon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'block rounded-xl border bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100',
              'placeholder:text-slate-400 dark:placeholder:text-slate-500',
              'transition-colors duration-150',
              'focus:ring-brand-500 focus:border-transparent focus:outline-none focus:ring-2',
              error
                ? 'border-red-400 focus:ring-red-400 dark:border-red-500'
                : 'border-slate-300 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-600',
              leftAddon ? 'pl-10' : 'pl-4',
              rightAddon ? 'pr-10' : 'pr-4',
              'w-full py-2.5 text-sm',
              className
            )}
            {...props}
          />
          {rightAddon && (
            <div className="absolute right-3 flex items-center text-slate-400">{rightAddon}</div>
          )}
        </div>
        {error && (
          <p className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400">
            <span>⚠</span> {error}
          </p>
        )}
        {hint && !error && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
