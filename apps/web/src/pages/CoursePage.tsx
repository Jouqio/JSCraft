import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Lock, PlayCircle, ChevronLeft, BookOpen } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import type { Course, Lesson } from '@jscraft/types';
import { apiGet } from '@lib/api';
import { useProgress } from '@hooks/useProgress';
import { cn } from '@lib/utils';
import { Spinner } from '@components/ui/Spinner';

type CourseWithLessons = Course & {
  lessons: Pick<
    Lesson,
    'id' | 'slug' | 'title' | 'titleId' | 'type' | 'dayNumber' | 'order' | 'xpReward'
  >[];
};

export default function CoursePage() {
  const { slug } = useParams<{ slug: string }>();
  const [course, setCourse] = useState<CourseWithLessons | null>(null);
  const [loading, setLoading] = useState(true);
  const { isCompleted, courseProgress } = useProgress();

  useEffect(() => {
    if (!slug) return;
    apiGet<CourseWithLessons>(`/courses/${slug}`)
      .then(setCourse)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading)
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  if (!course)
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="mb-4 text-slate-500">Kursus tidak ditemukan.</p>
        <Link to="/courses" className="text-brand-600 hover:underline">
          ← Kembali ke daftar kursus
        </Link>
      </div>
    );

  const lessons = Array.isArray(course.lessons) ? course.lessons : [];
  const lessonIds = lessons.map((l) => l.id);
  const progress = courseProgress(lessonIds);

  return (
    <>
      <Helmet>
        <title>{course.titleId} — JSCraft</title>
      </Helmet>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Back */}
        <Link
          to="/courses"
          className="hover:text-brand-600 mb-6 flex items-center gap-1.5 text-sm text-slate-500 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Semua Kursus
        </Link>

        {/* Header */}
        <div className="card mb-6 p-6">
          <div className="flex items-start gap-4">
            <div className="bg-brand-100 dark:bg-brand-900/30 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl">
              <BookOpen className="text-brand-600 dark:text-brand-400 h-7 w-7" />
            </div>
            <div className="flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="tag">Fase {course.phase}</span>
                <span className="tag">Minggu {course.week}</span>
                {course.isPremium && <span className="status-badge-premium">Premium</span>}
              </div>
              <h1 className="font-heading text-xl font-bold text-slate-900 dark:text-white">
                {course.titleId}
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {course.description}
              </p>
            </div>
          </div>
          {/* Progress */}
          <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">
                {progress.completed}/{progress.total} pelajaran selesai
              </span>
              <span className="xp-badge">⚡ {progress.percent}%</span>
            </div>
            <div className="progress-track">
              <motion.div
                className="progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${progress.percent}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>
        </div>

        {/* Lesson list */}
        <div className="space-y-2">
          {lessons.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">Belum ada materi pelajaran untuk kursus ini.</p>
            </div>
          ) : (
            lessons.map((lesson, i) => {
            const done = isCompleted(lesson.id);
            const typeLabel = { THEORY: 'Teori', PRACTICE: 'Praktik', PROJECT: 'Proyek' }[
              lesson.type
            ];
            const isLocked = course.isPremium && i > 1; // first 2 free in premium
            return (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  to={isLocked ? '#' : `/courses/${slug}/${lesson.id}`}
                  className={cn(
                    'flex items-center gap-4 rounded-xl border p-4 transition-all duration-150',
                    isLocked
                      ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60 dark:border-slate-800 dark:bg-slate-900/50'
                      : 'card-hover group'
                  )}
                >
                  {/* Day number */}
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-bold transition-colors',
                      done
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'
                        : 'group-hover:bg-brand-100 group-hover:text-brand-600 bg-slate-100 text-slate-500 dark:bg-slate-800'
                    )}
                  >
                    {done ? <CheckCircle className="h-5 w-5" /> : lesson.dayNumber}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-slate-900 dark:text-white">
                        {lesson.titleId}
                      </span>
                    </div>
                    <span className="text-2xs text-slate-400">{typeLabel}</span>
                  </div>

                  {/* Right */}
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="xp-badge hidden sm:inline-flex">+{lesson.xpReward} XP</span>
                    {isLocked ? (
                      <Lock className="h-4 w-4 text-slate-400" />
                    ) : (
                      <PlayCircle className="group-hover:text-brand-500 h-4 w-4 text-slate-300 transition-colors" />
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })
        )}
        </div>
      </div>
    </>
  );
}
