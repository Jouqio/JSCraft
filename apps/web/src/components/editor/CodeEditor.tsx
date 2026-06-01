import { useRef } from 'react';
import MonacoEditor, { type OnMount } from '@monaco-editor/react';
import { useThemeStore } from '@store/themeStore';
import { Spinner } from '@components/ui/Spinner';

interface CodeEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language?: string;
  height?: string;
  readOnly?: boolean;
  fontSize?: number;
}

export default function CodeEditor({
  value,
  onChange,
  language = 'javascript',
  height = '100%',
  readOnly = false,
  fontSize = 14,
}: CodeEditorProps) {
  const { resolvedTheme } = useThemeStore();
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Custom JSCraft dark theme
    monaco.editor.defineTheme('jscraft-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment',    foreground: '546e7a', fontStyle: 'italic' },
        { token: 'keyword',    foreground: 'c792ea' },
        { token: 'string',     foreground: 'c3e88d' },
        { token: 'number',     foreground: 'f78c6c' },
        { token: 'identifier', foreground: '82aaff' },
        { token: 'type',       foreground: 'ffcb6b' },
      ],
      colors: {
        'editor.background':          '#0f172a',
        'editor.foreground':          '#e2e8f0',
        'editor.lineHighlightBackground': '#1e293b80',
        'editorCursor.foreground':    '#f59e0b',
        'editor.selectionBackground': '#f59e0b30',
        'editorLineNumber.foreground':'#475569',
        'editorLineNumber.activeForeground': '#94a3b8',
        'editor.inactiveSelectionBackground': '#f59e0b18',
      },
    });

    monaco.editor.defineTheme('jscraft-light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#f8fafc',
        'editor.foreground': '#1e293b',
        'editorCursor.foreground': '#f59e0b',
        'editor.selectionBackground': '#f59e0b30',
      },
    });

    monaco.editor.setTheme(resolvedTheme === 'dark' ? 'jscraft-dark' : 'jscraft-light');

    // Editor keyboard shortcuts
    editor.addAction({
      id: 'run-code',
      label: 'Run Code',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => {
        // Trigger run via store — dispatched externally via the Run button
        document.dispatchEvent(new CustomEvent('jscraft:run'));
      },
    });
  };

  return (
    <MonacoEditor
      height={height}
      language={language}
      value={value}
      onChange={onChange}
      theme={resolvedTheme === 'dark' ? 'jscraft-dark' : 'jscraft-light'}
      onMount={handleMount}
      loading={
        <div className="flex items-center justify-center h-full bg-slate-950">
          <Spinner size="md" />
        </div>
      }
      options={{
        fontSize,
        fontFamily: '"JetBrains Mono", ui-monospace, monospace',
        fontLigatures: true,
        lineHeight: 1.7,
        minimap:       { enabled: false },
        scrollBeyondLastLine: false,
        readOnly,
        automaticLayout: true,
        padding:       { top: 16, bottom: 16 },
        tabSize:       2,
        wordWrap:      'on',
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        renderLineHighlight: 'line',
        suggest: { showKeywords: true, showSnippets: true },
        quickSuggestions: { other: true, comments: false, strings: false },
        bracketPairColorization: { enabled: true },
        formatOnPaste: true,
        formatOnType:  false,
        scrollbar: {
          verticalScrollbarSize: 4,
          horizontalScrollbarSize: 4,
        },
      }}
    />
  );
}
