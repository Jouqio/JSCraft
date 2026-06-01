import { cn } from '@lib/utils';

interface ProgressRingProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  className?: string;
}

export default function ProgressRing({
  percent, size = 100, strokeWidth = 8, label, sublabel, className,
}: ProgressRingProps) {
  const r     = (size - strokeWidth) / 2;
  const circ  = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="currentColor" strokeWidth={strokeWidth}
          className="text-slate-200 dark:text-slate-700" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="currentColor" strokeWidth={strokeWidth}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-brand-500 transition-all duration-700 ease-out" />
      </svg>
      {(label || sublabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {label && <span className="font-heading font-bold text-slate-900 dark:text-white leading-none">{label}</span>}
          {sublabel && <span className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">{sublabel}</span>}
        </div>
      )}
    </div>
  );
}
