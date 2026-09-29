import { useRef, useEffect } from 'react';
import { AlertCircle, Info, AlertTriangle, ChevronRight } from 'lucide-react';
import type { ConsoleEntry } from '@store/editorStore';
import { cn } from '@lib/utils';

interface ConsoleOutputProps {
  entries: ConsoleEntry[];
  maxHeight?: string;
}

const icons = {
  log: <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />,
  info: <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400" />,
  warn: <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />,
  error: <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />,
};

const rowStyles = {
  log: 'text-slate-200',
  info: 'text-blue-300',
  warn: 'text-amber-300 bg-amber-950/20',
  error: 'text-red-300 bg-red-950/30',
};

export default function ConsoleOutput({ entries, maxHeight = '200px' }: ConsoleOutputProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new output
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-4 font-mono text-xs text-slate-600">
        <ChevronRight className="h-3.5 w-3.5" />
        <span>Tekan Run atau Ctrl+Enter untuk menjalankan kode</span>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto bg-slate-950" style={{ maxHeight }}>
      {entries.map((entry, i) => (
        <div
          key={i}
          className={cn(
            'flex items-start gap-2.5 border-b border-slate-800/50 px-4 py-1.5 font-mono text-xs',
            rowStyles[entry.type]
          )}
        >
          {icons[entry.type]}
          <div className="flex-1 whitespace-pre-wrap break-all leading-relaxed">
            {entry.args.join(' ')}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
