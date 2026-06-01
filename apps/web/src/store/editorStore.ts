import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface ConsoleEntry {
  type: 'log' | 'error' | 'warn' | 'info';
  args: string[];
  timestamp: number;
}

interface EditorState {
  code: string;
  language: 'javascript' | 'html' | 'css';
  starterCode: string;
  output: ConsoleEntry[];
  hasError: boolean;
  isRunning: boolean;
  runCount: number; // for playground_user achievement

  // Actions
  setCode: (code: string) => void;
  setLanguage: (lang: EditorState['language']) => void;
  setStarterCode: (code: string) => void;
  runCode: () => void;
  resetCode: () => void;
  clearOutput: () => void;
}

export const useEditorStore = create<EditorState>()(
  devtools(
    (set, get) => ({
      code: '',
      language: 'javascript',
      starterCode: '',
      output: [],
      hasError: false,
      isRunning: false,
      runCount: 0,

      setCode: (code) => set({ code }),

      setLanguage: (language) => set({ language }),

      setStarterCode: (starterCode) =>
        set({ starterCode, code: starterCode }),

      clearOutput: () => set({ output: [], hasError: false }),

      resetCode: () =>
        set((state) => ({
          code: state.starterCode,
          output: [],
          hasError: false,
        })),

      runCode: () => {
        const { code, language } = get();

        set({ isRunning: true, output: [], hasError: false });

        if (language !== 'javascript') {
          // HTML/CSS runs in preview iframe — handled by PreviewPane component
          set({ isRunning: false });
          return;
        }

        // Sandboxed JS execution via hidden iframe + postMessage
        const iframe = document.createElement('iframe');
        iframe.setAttribute('sandbox', 'allow-scripts');
        iframe.style.display = 'none';

        const entries: ConsoleEntry[] = [];
        let settled = false;

        const handleMessage = (event: MessageEvent) => {
          if (event.source !== iframe.contentWindow) return;
          const msg = event.data as
            | { type: 'log'; level: ConsoleEntry['type']; args: string[] }
            | { type: 'done' }
            | { type: 'error'; message: string; line?: number };

          if (msg.type === 'log') {
            entries.push({ type: msg.level, args: msg.args, timestamp: Date.now() });
          } else if (msg.type === 'error') {
            entries.push({
              type: 'error',
              args: [msg.line ? `Line ${msg.line}: ${msg.message}` : msg.message],
              timestamp: Date.now(),
            });
            if (!settled) {
              settled = true;
              cleanup();
              set({ output: entries, hasError: true, isRunning: false });
            }
          } else if (msg.type === 'done') {
            if (!settled) {
              settled = true;
              cleanup();
              set((s) => ({
                output: entries,
                isRunning: false,
                runCount: s.runCount + 1,
              }));
            }
          }
        };

        const cleanup = () => {
          window.removeEventListener('message', handleMessage);
          if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        };

        // Timeout after 5 seconds
        const timeout = setTimeout(() => {
          if (!settled) {
            settled = true;
            cleanup();
            set({
              output: [{ type: 'error', args: ['Execution timed out (5s)'], timestamp: Date.now() }],
              hasError: true,
              isRunning: false,
            });
          }
        }, 5000);

        window.addEventListener('message', handleMessage);

        // Escape user code for template literal injection
        const escaped = code.replace(/`/g, '\\`').replace(/\$/g, '\\$');

        iframe.srcdoc = `<!DOCTYPE html><html><body><script>
(function() {
  var _LEVELS = ['log','warn','error','info'];
  _LEVELS.forEach(function(l) {
    var orig = console[l];
    console[l] = function() {
      var args = Array.prototype.slice.call(arguments).map(function(a) {
        return typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a);
      });
      parent.postMessage({ type: 'log', level: l, args: args }, '*');
      orig.apply(console, arguments);
    };
  });
  window.onerror = function(msg, src, line) {
    parent.postMessage({ type: 'error', message: String(msg), line: line }, '*');
    return true;
  };
  try {
    eval(\`${escaped}\`);
    parent.postMessage({ type: 'done' }, '*');
  } catch(e) {
    parent.postMessage({ type: 'error', message: e.message }, '*');
  }
})();
<\/script></body></html>`;

        document.body.appendChild(iframe);

        // Clear timeout ref if not needed
        const origCleanup = cleanup;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _timeoutRef = timeout;
      },
    }),
    { name: 'EditorStore' }
  )
);
