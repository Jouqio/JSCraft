import { useCallback, useEffect } from 'react';
import { useEditorStore } from '@store/editorStore';

/** Convenience hook for code editor with keyboard shortcut binding */
export function useEditor(starterCode?: string) {
  const store = useEditorStore();
  const setStarterCode = useEditorStore((s) => s.setStarterCode);
  const runCode = useEditorStore((s) => s.runCode);

  // Initialise starter code when provided
  useEffect(() => {
    if (starterCode !== undefined) {
      setStarterCode(starterCode);
    }
  }, [starterCode, setStarterCode]);

  const runWithShortcut = useCallback(() => runCode(), [runCode]);

  // Ctrl/Cmd + Enter global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        runWithShortcut();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [runWithShortcut]);

  return {
    code: store.code,
    language: store.language,
    output: store.output,
    hasError: store.hasError,
    isRunning: store.isRunning,
    runCount: store.runCount,
    setCode: store.setCode,
    setLanguage: store.setLanguage,
    runCode: store.runCode,
    resetCode: store.resetCode,
    clearOutput: store.clearOutput,
  };
}
