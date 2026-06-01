import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Lock, PlayCircle, ChevronLeft, BookOpen, Zap } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import type { Course, Lesson } from '@jscraft/types';
import { apiGet } from '@lib/api';
import { useProgress } from '@hooks/useProgress';
import { cn } from '@lib/utils';
import { Spinner } from '@components/ui/Spinner';

type CourseWithLessons = Course & { lessons: Pick<Lesson, 'id' | 'slug' | 'title' | 'titleId' | 'type' | 'dayNumber' | 'order' | 'xpReward'>[] };

export default function CoursePage() {
  const { slug } = useParams<{ slug: string }>();
  const [course, setCourse] = useState<CourseWithLessons | null>(null);
  const [loading, setLoading] = useState(true);
  const { isCompleted, courseProgress } = useProgress();

  useEffect(() => {
    if (!slug) return;
    apiGet<CourseWithLessons>(`/courses/${slug}`)
      .then(setCourse).catch(console.error).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size="lg" /></div>;
  if (!course) return (
    <div className="max-w-2xl mx-auto px-6 py-16 text-center">
      <p className="text-slate-500 mb-4">Kursus tidak ditemukan.</p>
      <Link to="/courses" className="text-brand-600 hover:underline">← Kembali ke daftar kursus</Link>
    </div>
  );

  const lessonIds = course.lessons.map((l) => l.id);
  const progress  = courseProgress(lessonIds);

  return (
    <>
      <Helmet><title>{course.titleId} — JSCraft</title></Helmet>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <Link to="/courses" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600 transition-colors mb-6">
          <ChevronLeft className="w-4 h-4" /> Semua Kursus
        </Link>

        {/* Header */}
        <div className="card p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
              <BookOpen className="w-7 h-7 text-brand-600 dark:text-brand-400" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="tag">Fase {course.phase}</span>
                <span className="tag">Minggu {course.week}</span>
                {course.isPremium && <span className="status-badge-premium">Premium</span>}
              </div>
              <h1 className="font-heading text-xl font-bold text-slate-900 dark:text-white">{course.titleId}</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{course.description}</p>
            </div>
          </div>
          {/* Progress */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-600 dark:text-slate-400">{progress.completed}/{progress.total} pelajaran selesai</span>
              <span className="xp-badge">⚡ {progress.percent}%</span>
            </div>
            <div className="progress-track">
              <motion.div className="progress-fill" initial={{ width: 0 }}
                animate={{ width: `${progress.percent}%` }} transition={{ duration: 0.8 }} />
            </div>
          </div>
        </div>

        {/* Lesson list */}
        <div className="space-y-2">
          {course.lessons.map((lesson, i) => {
            const done = isCompleted(lesson.id);
            const typeLabel = { THEORY: 'Teori', PRACTICE: 'Praktik', PROJECT: 'Proyek' }[lesson.type];
            const isLocked = course.isPremium && i > 1; // first 2 free in premium
            return (
              <motion.div key={lesson.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}>
                <Link to={isLocked ? '#' : `/courses/${slug}/${lesson.id}`}
                  className={cn('flex items-center gap-4 p-4 rounded-xl border transition-all duration-150',
                    isLocked
                      ? 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 cursor-not-allowed opacity-60'
                      : 'card-hover group'
                  )}>
                  {/* Day number */}
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-mono font-bold text-sm transition-colors',
                    done ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                         : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-brand-100 group-hover:text-brand-600')}>
                    {done ? <CheckCircle className="w-5 h-5" /> : lesson.dayNumber}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900 dark:text-white text-sm truncate">{lesson.titleId}</span>
                    </div>
                    <span className="text-2xs text-slate-400">{typeLabel}</span>
                  </div>

                  {/* Right */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="xp-badge hidden sm:inline-flex">+{lesson.xpReward} XP</span>
                    {isLocked ? <Lock className="w-4 h-4 text-slate-400" /> : <PlayCircle className="w-4 h-4 text-slate-300 group-hover:text-brand-500 transition-colors" />}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </>
  );
}
