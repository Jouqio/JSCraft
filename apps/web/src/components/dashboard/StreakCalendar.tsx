import { cn } from '@lib/utils';

interface StreakCalendarProps {
  completedDates: string[];
  days?: number;
}

export default function StreakCalendar({ completedDates, days = 35 }: StreakCalendarProps) {
  const today = new Date();
  const cells = Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (days - 1 - i));
    const dateStr = d.toISOString().split('T')[0]!;
    const isToday = i === days - 1;
    const done    = completedDates.includes(dateStr);
    return { dateStr, isToday, done };
  });

  const weeks = Array.from({ length: Math.ceil(days / 7) }, (_, w) =>
    cells.slice(w * 7, w * 7 + 7)
  );

  return (
    <div className="space-y-1">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex gap-1">
          {week.map(({ dateStr, isToday, done }) => (
            <div key={dateStr}
              title={dateStr}
              className={cn(
                'w-5 h-5 rounded-sm transition-colors',
                done ? 'bg-brand-500' : 'bg-slate-100 dark:bg-slate-800',
                isToday && done && 'ring-2 ring-brand-300 ring-offset-1 dark:ring-offset-slate-900',
                isToday && !done && 'ring-2 ring-slate-300 dark:ring-slate-600 ring-offset-1 dark:ring-offset-slate-900',
              )}
            />
          ))}
        </div>
      ))}
      <div className="flex items-center gap-2 pt-1">
        <span className="text-2xs text-slate-400">Kurang</span>
        {[0.2, 0.4, 0.7, 1].map((o) => (
          <div key={o} className="w-3.5 h-3.5 rounded-sm bg-brand-500" style={{ opacity: o }} />
        ))}
        <span className="text-2xs text-slate-400">Lebih</span>
      </div>
    </div>
  );
}
