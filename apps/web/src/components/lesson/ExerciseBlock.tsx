import { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Exercise, ExerciseSubmitResponse, ExerciseTestCaseResult } from '@jscraft/types';
import { apiPost, ApiClientError } from '@lib/api';
import { useAuthStore } from '@store/authStore';
import { useEditorStore } from '@store/editorStore';
import { Button } from '@components/ui/Button';
import { cn } from '@lib/utils';

interface ExerciseBlockProps {
  exercise: Exercise;
}

export default function ExerciseBlock({ exercise }: ExerciseBlockProps) {
  const { user } = useAuthStore();
  const { code, setCode } = useEditorStore();
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<ExerciseSubmitResponse | null>(null);
  const [showHints, setShowHints] = useState(false);
  // Set once the server reports the runner is disabled; we do not retry automatically.
  const [runnerDisabled, setRunnerDisabled] = useState(false);

  const handleLoadStarter = () => {
    if (exercise.starterCode) {
      setCode(exercise.starterCode);
      toast.success('Kode awal berhasil dimuat ke editor');
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Silakan masuk untuk mengumpulkan latihan');
      return;
    }

    if (!code.trim()) {
      toast.error('Editor kode masih kosong');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiPost<ExerciseSubmitResponse>(`/exercises/${exercise.id}/submit`, {
        code,
      });
      setSubmitResult(res);

      if (res.passed) {
        if (res.xpEarned > 0) {
          toast.success(`Latihan berhasil! +${res.xpEarned} XP`);
        } else {
          toast.success('Semua pengujian lulus!');
        }
      } else {
        toast.error(`${res.passedTests} dari ${res.totalTests} pengujian berhasil`);
      }
    } catch (err) {
      if (
        err instanceof ApiClientError &&
        err.status === 503 &&
        err.code === 'CODE_RUNNER_DISABLED'
      ) {
        setRunnerDisabled(true);
        setSubmitResult(null);
      } else if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error('Gagal menjalankan pengujian latihan');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const hints = Array.isArray(exercise.hints) ? (exercise.hints as string[]) : [];

  return (
    <div className="card space-y-5 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
        <div>
          <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
            {exercise.title}
          </h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{exercise.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="xp-badge">
            <Zap className="h-3.5 w-3.5" /> +{exercise.xpReward} XP
          </span>
          {exercise.starterCode && (
            <Button
              variant="outline"
              size="xs"
              onClick={handleLoadStarter}
              leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
              title="Muat kode awal ke editor"
            >
              Reset Kode
            </Button>
          )}
        </div>
      </div>

      {/* Hints Accordion */}
      {hints.length > 0 && (
        <div className="rounded-lg border border-amber-200/60 bg-amber-50/50 p-3.5 dark:border-amber-900/30 dark:bg-amber-950/20">
          <button
            type="button"
            onClick={() => setShowHints(!showHints)}
            className="flex w-full items-center justify-between text-left text-xs font-semibold text-amber-900 dark:text-amber-300"
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span>Petunjuk Pengerjaan ({hints.length})</span>
            </div>
            {showHints ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          {showHints && (
            <ul className="mt-3 space-y-1.5 pl-6 text-xs text-amber-950/80 dark:text-amber-200/80">
              {hints.map((hint, idx) => (
                <li key={idx} className="list-disc">
                  {hint}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Action CTA */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Tuliskan solusi Anda di panel editor sebelah kanan, lalu klik periksa.
        </p>
        <Button
          id={`exercise-submit-${exercise.id}`}
          onClick={handleSubmit}
          loading={submitting}
          disabled={submitting || runnerDisabled}
          leftIcon={<Play className="h-4 w-4" />}
        >
          Periksa Jawaban
        </Button>
      </div>

      {runnerDisabled && (
        <div
          role="status"
          id={`exercise-runner-disabled-${exercise.id}`}
          className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        >
          <p className="font-semibold">Eksekusi di server dinonaktifkan</p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Pemeriksaan otomatis latihan sedang dimatikan. Anda tetap dapat menulis dan menjalankan
            kode di editor; XP latihan belum dapat diberikan untuk sementara.
          </p>
        </div>
      )}

      {/* Test Case Evaluation Results */}
      {submitResult && (
        <div
          className={cn(
            'space-y-4 rounded-xl border p-4 transition-all',
            submitResult.passed
              ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20'
              : 'border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold">
              {submitResult.passed ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm text-emerald-900 dark:text-emerald-200">
                    Semua Pengujian Lulus!
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm text-amber-900 dark:text-amber-200">
                    Sebagian Pengujian Belum Lulus
                  </span>
                </>
              )}
            </div>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {submitResult.passedTests} / {submitResult.totalTests} pengujian berhasil
            </span>
          </div>

          {/* Test cases breakdown */}
          <div className="space-y-2.5">
            {submitResult.results.map((res: ExerciseTestCaseResult, i: number) => (
              <div
                key={i}
                className={cn(
                  'rounded-lg border p-3 text-xs',
                  res.passed
                    ? 'border-emerald-200 bg-white dark:border-emerald-900/50 dark:bg-slate-900'
                    : 'border-red-200 bg-white dark:border-red-900/50 dark:bg-slate-900'
                )}
              >
                <div className="flex items-start gap-2">
                  {res.passed ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="font-medium text-slate-900 dark:text-white">
                      {res.description}
                      {res.hidden && (
                        <span className="text-2xs ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          Uji Tersembunyi
                        </span>
                      )}
                    </div>

                    {!res.passed && !res.hidden && (
                      <div className="text-2xs mt-2 space-y-1 font-mono">
                        {res.expectedOutput !== undefined && (
                          <div className="text-emerald-700 dark:text-emerald-400">
                            Ekspektasi: {res.expectedOutput}
                          </div>
                        )}
                        {res.actualOutput !== undefined && (
                          <div className="text-red-600 dark:text-red-400">
                            Hasil aktual: {res.actualOutput || '(tanpa output)'}
                          </div>
                        )}
                        {res.error && (
                          <div className="text-amber-700 dark:text-amber-400">
                            Error: {res.error}
                          </div>
                        )}
                      </div>
                    )}

                    {!res.passed && res.hidden && res.error && (
                      <div className="text-2xs mt-1 font-mono text-amber-700 dark:text-amber-400">
                        {res.error}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
