import { useEffect } from 'react';
import { Play } from 'lucide-react';
import { useEditorStore } from '@store/editorStore';
import { Button } from '@components/ui/Button';

interface RunButtonProps { className?: string; }

export default function RunButton({ className }: RunButtonProps) {
  const { runCode, isRunning } = useEditorStore();

  // Listen for keyboard shortcut from Monaco
  useEffect(() => {
    const handler = () => runCode();
    document.addEventListener('jscraft:run', handler);
    return () => document.removeEventListener('jscraft:run', handler);
  }, [runCode]);

  return (
    <Button size="sm" onClick={runCode} loading={isRunning}
      leftIcon={!isRunning ? <Play className="w-3.5 h-3.5" /> : undefined}
      className={className}>
      Run
    </Button>
  );
}
