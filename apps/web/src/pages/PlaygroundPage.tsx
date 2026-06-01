import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Play, RotateCcw, Copy, Check, Code2 } from 'lucide-react';
import { useEditor } from '@hooks/useEditor';
import { useEditorStore } from '@store/editorStore';
import CodeEditor from '@components/editor/CodeEditor';
import ConsoleOutput from '@components/editor/ConsoleOutput';
import { Button } from '@components/ui/Button';
import { cn } from '@lib/utils';
import toast from 'react-hot-toast';

const SNIPPETS = [
  { label: 'Hello World',   code: 'console.log("Hello, World! 🚀");\nconsole.log("Selamat bermain di JSCraft Playground!");' },
  { label: 'Array Methods', code: 'const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];\n\nconst genap   = numbers.filter(n => n % 2 === 0);\nconst kuadrat = numbers.map(n => n ** 2);\nconst total   = numbers.reduce((acc, n) => acc + n, 0);\n\nconsole.log("Genap:", genap);\nconsole.log("Kuadrat:", kuadrat);\nconsole.log("Total:", total);' },
  { label: 'Arrow Function',code: 'const sapa = (nama, kota = "Jakarta") =>\n  `Halo ${nama} dari ${kota}! 👋`;\n\nconsole.log(sapa("Budi"));\nconsole.log(sapa("Ani", "Surabaya"));\nconsole.log(sapa("Dewi", "Bandung"));' },
  { label: 'Async/Await',   code: 'async function getData(id) {\n  // Simulasi fetch API\n  await new Promise(r => setTimeout(r, 500));\n  return { id, name: "User " + id, level: Math.ceil(id / 2) };\n}\n\nasync function main() {\n  const user = await getData(5);\n  console.log("User:", user);\n  console.log("Level:", user.level);\n}\n\nmain();' },
  { label: 'Closure',       code: 'function buatCounter(awal = 0) {\n  let count = awal;\n  return {\n    tambah: () => ++count,\n    kurang: () => --count,\n    reset:  () => { count = awal; },\n    nilai:  () => count,\n  };\n}\n\nconst c = buatCounter(10);\nconsole.log(c.tambah()); // 11\nconsole.log(c.tambah()); // 12\nconsole.log(c.kurang()); // 11\nconsole.log(c.nilai());  // 11\nc.reset();\nconsole.log(c.nilai());  // 10' },
  { label: 'FizzBuzz',      code: 'for (let i = 1; i <= 20; i++) {\n  if (i % 15 === 0)      console.log("FizzBuzz");\n  else if (i % 3 === 0)  console.log("Fizz");\n  else if (i % 5 === 0)  console.log("Buzz");\n  else                   console.log(i);\n}' },
];

const STARTER = '// 🖥️ JSCraft Playground\n// Tulis kode JavaScript-mu di sini\n// Ctrl+Enter untuk run\n\nconsole.log("Halo dari Playground! 🚀");\n';

export default function PlaygroundPage() {
  const { code, output, hasError, isRunning, setCode, runCode, resetCode } = useEditor(STARTER);
  const [copied, setCopied] = useState(false);
  const [activeSnippet, setActiveSnippet] = useState<string | null>(null);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadSnippet = (s: typeof SNIPPETS[0]) => {
    setCode(s.code);
    useEditorStore.getState().clearOutput();
    setActiveSnippet(s.label);
    toast.success(`Contoh "${s.label}" dimuat`);
  };

  return (
    <>
      <Helmet><title>Playground — JSCraft</title></Helmet>
      <div className="h-[calc(100vh-60px)] flex flex-col">
        {/* Topbar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-brand-500" />
            <span className="font-heading font-bold text-slate-900 dark:text-white">Playground</span>
            <span className="text-slate-400 text-sm hidden sm:inline">— Eksperimen bebas tanpa batas</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Snippet loader */}
            <select className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
              value={activeSnippet ?? ''}
              onChange={(e) => { const s = SNIPPETS.find(x => x.label === e.target.value); if (s) loadSnippet(s); }}>
              <option value="">📦 Contoh kode</option>
              {SNIPPETS.map(s => <option key={s.label} value={s.label}>{s.label}</option>)}
            </select>
            <button onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              {copied ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> Disalin</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
            </button>
            <button onClick={resetCode}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
            <Button size="sm" onClick={runCode} loading={isRunning}
              leftIcon={!isRunning ? <Play className="w-3.5 h-3.5" /> : undefined}>
              Run
            </Button>
          </div>
        </div>

        {/* Editor + output */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Editor */}
          <div className="flex-1 min-h-[40vh] lg:min-h-0 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800">
            <CodeEditor value={code} onChange={(v) => setCode(v ?? '')} language="javascript" height="100%" />
          </div>

          {/* Output panel */}
          <div className="w-full lg:w-[420px] xl:w-[500px] flex flex-col bg-slate-950">
            <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
              <span className="text-2xs font-mono text-slate-500 uppercase tracking-wider font-semibold">Console Output</span>
              {hasError && <span className="text-2xs text-red-400 font-mono">● Error</span>}
              {!hasError && output.length > 0 && <span className="text-2xs text-emerald-400 font-mono">● OK</span>}
            </div>
            <div className="flex-1 overflow-y-auto">
              <ConsoleOutput entries={output} maxHeight="100%" />
            </div>
            <div className="p-3 border-t border-slate-800 bg-slate-900">
              <p className="text-2xs font-mono text-slate-600 text-center">Ctrl+Enter untuk run · kode berjalan di sandbox aman</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
