import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Trophy, RotateCcw } from 'lucide-react';
import type { Quiz, QuizOption } from '@jscraft/types';
import { api } from '@lib/api';
import { cn } from '@lib/utils';
import { Button } from '@components/ui/Button';
import toast from 'react-hot-toast';

interface Props {
  quiz: Quiz;
}

type Phase = 'intro' | 'answering' | 'result';

interface AnswerState {
  [questionId: string]: string; // selectedOptionId
}

interface Revealed {
  [questionId: string]: { correct: boolean; correctId: string; explanation?: string };
}

export default function QuizBlock({ quiz }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [answers, setAnswers] = useState<AnswerState>({});
  const [revealed, setRevealed] = useState<Revealed>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    xpEarned: number;
    correctCount: number;
    totalCount: number;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer
  useEffect(() => {
    if (phase === 'answering') {
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase]);

  const question = quiz.questions[currentQ];
  const isLast = currentQ === quiz.questions.length - 1;
  const timeLeft = quiz.timeLimit ? Math.max(0, quiz.timeLimit - elapsed) : null;

  const handleSelect = (optionId: string) => {
    if (!question || answers[question.id]) return; // already answered

    const isCorrect =
      (question.options as QuizOption[]).find((o) => o.id === optionId)?.isCorrect ?? false;
    // find the correct one for display
    const correctId = (question.options as QuizOption[]).find((o) => o.isCorrect)?.id ?? '';

    setAnswers((a) => ({ ...a, [question.id]: optionId }));
    setRevealed((r) => ({
      ...r,
      [question.id]: { correct: isCorrect, correctId, explanation: question.explanation },
    }));
  };

  const handleNext = () => {
    if (currentQ < quiz.questions.length - 1) setCurrentQ((q) => q + 1);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSubmitting(true);
    try {
      const payload = {
        answers: Object.entries(answers).map(([questionId, selectedOptionId]) => ({
          questionId,
          selectedOptionId,
        })),
        timeTaken: elapsed,
      };
      const { data } = await api.post(`/quiz/${quiz.id}/attempt`, payload);
      setResult(data);
      setPhase('result');
      if (data.passed) toast.success(`Kuis lulus! +${data.xpEarned} XP 🎉`);
    } catch {
      toast.error('Gagal mengirim jawaban. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitRef = useRef(handleSubmit);
  handleSubmitRef.current = handleSubmit;

  // Auto-submit on time up
  useEffect(() => {
    if (timeLeft === 0) handleSubmitRef.current();
  }, [timeLeft]);

  const handleRetry = () => {
    setPhase('intro');
    setAnswers({});
    setRevealed({});
    setCurrentQ(0);
    setElapsed(0);
    setResult(null);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // ── INTRO ────────────────────────────────────────
  if (phase === 'intro')
    return (
      <div className="card space-y-4 p-6 text-center">
        <div className="bg-brand-100 dark:bg-brand-900/30 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
          <Trophy className="text-brand-600 dark:text-brand-400 h-7 w-7" />
        </div>
        <div>
          <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
            {quiz.title}
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {quiz.questions.length} pertanyaan · Nilai lulus: {quiz.passingScore}%
            {quiz.timeLimit && ` · ⏱ ${formatTime(quiz.timeLimit)}`}
          </p>
        </div>
        <Button onClick={() => setPhase('answering')}>Mulai Kuis</Button>
      </div>
    );

  // ── RESULT ───────────────────────────────────────
  if (phase === 'result' && result)
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card space-y-5 p-6 text-center"
      >
        <div
          className={cn(
            'mx-auto flex h-16 w-16 items-center justify-center rounded-2xl',
            result.passed
              ? 'bg-emerald-100 dark:bg-emerald-900/30'
              : 'bg-red-100 dark:bg-red-900/20'
          )}
        >
          {result.passed ? (
            <CheckCircle className="h-8 w-8 text-emerald-500" />
          ) : (
            <XCircle className="h-8 w-8 text-red-500" />
          )}
        </div>
        <div>
          <div className="font-heading text-4xl font-extrabold text-slate-900 dark:text-white">
            {result.score}%
          </div>
          <div
            className={cn(
              'mt-1 text-sm font-semibold',
              result.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
            )}
          >
            {result.passed ? '🎉 Lulus!' : '😔 Belum Lulus'}
          </div>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {result.correctCount}/{result.totalCount} jawaban benar
            {result.xpEarned > 0 && <span className="xp-badge ml-2">+{result.xpEarned} XP</span>}
          </p>
        </div>
        {!result.passed && (
          <Button
            variant="outline"
            leftIcon={<RotateCcw className="h-4 w-4" />}
            onClick={handleRetry}
          >
            Coba Lagi
          </Button>
        )}
      </motion.div>
    );

  // ── ANSWERING ─────────────────────────────────────
  if (!question) return null;
  const selectedId = answers[question.id];
  const revealData = revealed[question.id];
  const isAnswered = !!selectedId;

  return (
    <div className="space-y-5">
      {/* Progress & timer bar */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-mono text-slate-500 dark:text-slate-400">
          {currentQ + 1} / {quiz.questions.length}
        </span>
        {timeLeft !== null && (
          <span
            className={cn(
              'flex items-center gap-1 font-mono font-semibold',
              timeLeft < 30 ? 'animate-pulse text-red-500' : 'text-slate-500'
            )}
          >
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </span>
        )}
      </div>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${(currentQ / quiz.questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          className="space-y-4"
        >
          <h3 className="font-semibold leading-relaxed text-slate-900 dark:text-white">
            {question.text}
          </h3>

          <div className="space-y-2.5">
            {(question.options as QuizOption[]).map((opt) => {
              const isSelected = selectedId === opt.id;
              const isCorrectOpt = revealData?.correctId === opt.id;
              const isWrong = isAnswered && isSelected && !isCorrectOpt;

              return (
                <button
                  key={opt.id}
                  disabled={isAnswered}
                  onClick={() => handleSelect(opt.id)}
                  className={cn(
                    'w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all duration-150',
                    !isAnswered &&
                      'hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 cursor-pointer',
                    !isAnswered &&
                      'border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300',
                    isAnswered &&
                      !isSelected &&
                      !isCorrectOpt &&
                      'border-slate-200 text-slate-500 opacity-50 dark:border-slate-700',
                    isCorrectOpt &&
                      'border-emerald-400 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300',
                    isWrong &&
                      'border-red-400 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-current text-xs">
                      {isCorrectOpt ? '✓' : isWrong ? '✗' : opt.id.toUpperCase()}
                    </span>
                    {opt.text}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {revealData?.explanation && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-r-lg border-l-4 border-blue-400 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
            >
              💡 {revealData.explanation}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <div />
        {isAnswered &&
          (isLast ? (
            <Button onClick={handleSubmit} loading={submitting}>
              Kirim Jawaban
            </Button>
          ) : (
            <Button onClick={handleNext} variant="outline">
              Pertanyaan Berikutnya →
            </Button>
          ))}
      </div>
    </div>
  );
}
