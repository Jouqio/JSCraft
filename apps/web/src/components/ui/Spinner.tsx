import { cn } from '@lib/utils';

interface SpinnerProps { size?: 'sm' | 'md' | 'lg'; className?: string; }

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return (
    <svg
      className={cn('animate-spin text-brand-500', sizes[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-label="Loading"
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export function PageSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-slate-950 z-50">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 font-mono">
          Loading JSCraft…
        </p>
      </div>
    </div>
  );
}

export function InlineSpinner({ className }: { className?: string }) {
  return <Spinner size="sm" className={cn('inline-block', className)} />;
}
