import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Zap, CheckCircle, BookOpen, Terminal, HelpCircle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import type { Lesson, ContentSection } from '@jscraft/types';
import { apiGet } from '@lib/api';
import { useProgressStore } from '@store/progressStore';
import { useEditorStore } from '@store/editorStore';
import { cn } from '@lib/utils';
import { Button } from '@components/ui/Button';
import { Spinner } from '@components/ui/Spinner';
import CodeEditor from '@components/editor/CodeEditor';
import ConsoleOutput from '@components/editor/ConsoleOutput';
import QuizBlock from '@components/lesson/QuizBlock';

type Tab = 'materi' | 'latihan' | 'kuis';

function ContentRenderer({ sections }: { sections: ContentSection[] }) {
  return (
    <div className="lesson-prose space-y-4">
      {sections.map((s, i) => {
        if (s.type === 'prose') return (
          <div key={i} dangerouslySetInnerHTML={{ __html: s.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/`(.*?)`/g, '<code>$1</code>') }} />
        );
        if (s.type === 'code') return (
          <div key={i} className="code-block-wrapper">
            <div className="code-block-header">
              <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">{s.language}</span>
              {s.filename && <span className="text-xs text-slate-500 font-mono">{s.filename}</span>}
            </div>
            <pre className="p-5 font-mono text-sm text-slate-200 overflow-x-auto leading-relaxed">
              <code>{s.code}</code>
            </pre>
          </div>
        );
        if (s.type === 'callout') {
          const styles: Record<string, string> = {
            tip:     'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400 text-emerald-800 dark:text-emerald-300',
            warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-400 text-amber-800 dark:text-amber-300',
            info:    'bg-blue-50 dark:bg-blue-900/20 border-blue-400 text-blue-800 dark:text-blue-300',
            danger:  'bg-red-50 dark:bg-red-900/20 border-red-400 text-red-800 dark:text-red-300',
          };
          return (
            <div key={i} className={`border-l-4 px-4 py-3 rounded-r-lg text-sm ${styles[s.variant]}`}>
              {s.text}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

export default function LessonPage() {
  const { slug, lessonId } = useParams<{ slug: string; lessonId: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('materi');
  const [completing, setCompleting] = useState(false);
  const [showXP, setShowXP] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);

  const { getLessonStatus, completeLesson, startLesson } = useProgressStore();
  const { setCode, setStarterCode, runCode, isRunning, output, code } = useEditorStore();

  useEffect(() => {
    if (!slug || !lessonId) return;
    setLoading(true);
    apiGet<Lesson>(`/courses/${slug}/lessons/${lessonId}`)
      .then((data) => {
        setLesson(data);
        const starter = data.starterCode ?? '// Tulis kode JavaScript-mu di sini\n';
        setStarterCode(starter);
        startLesson(lessonId, data.courseId);
      })
      .catch(() => toast.error('Gagal memuat pelajaran'))
      .finally(() => setLoading(false));
  }, [slug, lessonId]);

  const isCompleted = lessonId ? getLessonStatus(lessonId) === 'COMPLETED' : false;

  const handleComplete = useCallback(async () => {
    if (!lessonId || !lesson || isCompleted) return;
    setCompleting(true);
    try {
      const { xpEarned } = await completeLesson(lessonId, lesson.courseId);
      setEarnedXP(xpEarned);
      setShowXP(true);
      setTimeout(() => setShowXP(false), 3000);
      toast.success(`Pelajaran selesai! +${xpEarned} XP ⚡`);
    } catch { toast.error('Gagal menyelesaikan pelajaran'); }
    finally { setCompleting(false); }
  }, [lessonId, lesson, isCompleted, completeLesson]);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <Spinner size="lg" />
    </div>
  );
  if (!lesson) return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <p className="text-slate-500 mb-4">Pelajaran tidak ditemukan.</p>
        <Link to="/courses"><Button variant="outline">Kembali ke Kursus</Button></Link>
      </div>
    </div>
  );

  const tabs: Array<{ id: Tab; icon: React.ReactNode; label: string }> = [
    { id: 'materi',  icon: <BookOpen className="w-4 h-4" />,    label: 'Materi' },
    { id: 'latihan', icon: <Terminal className="w-4 h-4" />,    label: 'Latihan' },
    { id: 'kuis',    icon: <HelpCircle className="w-4 h-4" />,  label: 'Kuis' },
  ];

  return (
    <>
      <Helmet><title>{lesson.titleId} — JSCraft</title></Helmet>

      {/* XP pop animation */}
      <AnimatePresence>
        {showXP && (
          <motion.div initial={{ opacity: 0, y: 0, scale: 0.8 }} animate={{ opacity: 1, y: -24, scale: 1 }}
            exit={{ opacity: 0 }} className="fixed top-20 right-6 z-50 xp-badge text-base px-4 py-2 shadow-lg">
            +{earnedXP} XP ⚡
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-60px)]">
        {/* ── Left: Lesson content ── */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Lesson header */}
          <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
              <Link to={`/courses/${slug}`} className="hover:text-brand-500 transition-colors">Kursus</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-slate-900 dark:text-white font-medium truncate">{lesson.titleId}</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="tag">Hari {lesson.dayNumber}</span>
              <span className="tag">{lesson.type === 'THEORY' ? 'Teori' : lesson.type === 'PRACTICE' ? 'Praktik' : '🏗 Proyek'}</span>
              <span className="xp-badge">⚡ +{lesson.xpReward} XP</span>
              {isCompleted && <span className="status-badge-completed"><CheckCircle className="w-3 h-3" /> Selesai</span>}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-200 dark:border-slate-800 px-6">
            <div className="flex gap-0">
              {tabs.map((t) => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                    activeTab === t.id
                      ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  )}>
                  {t.icon}{t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="p-6">

                {activeTab === 'materi' && lesson.content && (
                  <ContentRenderer sections={lesson.content.sections} />
                )}

                {activeTab === 'latihan' && (
                  <div className="space-y-4">
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Gunakan editor di sebelah kanan untuk latihan. Klik <strong>Run</strong> untuk menjalankan kode.</p>
                    {lesson.exercises && lesson.exercises.length > 0 ? (
                      lesson.exercises.map((ex) => (
                        <div key={ex.id} className="card p-5">
                          <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{ex.title}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{ex.description}</p>
                          {ex.hints && (ex.hints as string[]).length > 0 && (
                            <details className="text-sm">
                              <summary className="cursor-pointer text-brand-600 dark:text-brand-400 font-medium">💡 Lihat petunjuk</summary>
                              <ul className="mt-2 space-y-1 text-slate-500 dark:text-slate-400">
                                {(ex.hints as string[]).map((h, i) => <li key={i}>• {h}</li>)}
                              </ul>
                            </details>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400 text-sm italic">Belum ada latihan untuk pelajaran ini.</p>
                    )}
                  </div>
                )}

                {activeTab === 'kuis' && lesson.quiz ? (
                  <QuizBlock quiz={lesson.quiz} />
                ) : activeTab === 'kuis' ? (
                  <p className="text-slate-400 text-sm italic">Belum ada kuis untuk pelajaran ini.</p>
                ) : null}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom nav */}
          <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
            <Button variant="ghost" size="sm" leftIcon={<ChevronLeft className="w-4 h-4" />}
              onClick={() => navigate(-1)}>
              Sebelumnya
            </Button>
            <Button loading={completing} disabled={isCompleted}
              onClick={handleComplete}
              leftIcon={isCompleted ? <CheckCircle className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
              className={isCompleted ? 'bg-emerald-500 hover:bg-emerald-500 cursor-default shadow-none' : ''}>
              {isCompleted ? 'Sudah Selesai' : 'Selesai & Lanjut'}
            </Button>
          </div>
        </div>

        {/* ── Right: Code editor panel ── */}
        <div className="w-full lg:w-[480px] xl:w-[560px] border-l border-slate-200 dark:border-slate-800 flex flex-col bg-slate-950">
          {/* Editor topbar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900">
            <span className="text-xs font-mono text-slate-400 font-semibold">▶ Coba Sendiri</span>
            <div className="flex gap-2">
              <button onClick={() => useEditorStore.getState().resetCode()}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors font-mono">
                ↺ Reset
              </button>
              <Button size="xs" onClick={runCode} loading={isRunning}
                className="font-mono">
                ▶ Run
              </Button>
            </div>
          </div>

          {/* Monaco editor */}
          <div className="flex-1 min-h-[300px]">
            <CodeEditor
              value={code}
              onChange={(val) => setCode(val ?? '')}
              language="javascript"
              height="100%"
            />
          </div>

          {/* Console output */}
          <div className="border-t border-slate-800">
            <div className="px-4 py-2 bg-slate-900 border-b border-slate-800">
              <span className="text-2xs font-mono text-slate-500 uppercase tracking-wider font-semibold">Output</span>
            </div>
            <ConsoleOutput entries={output} />
          </div>
        </div>
      </div>
    </>
  );
}
