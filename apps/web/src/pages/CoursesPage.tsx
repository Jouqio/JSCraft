import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle, Lock, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import type { Course } from '@jscraft/types';
import { apiGetList, ApiClientError } from '@lib/api';
import { cn } from '@lib/utils';
import { Button } from '@components/ui/Button';

type CourseItem = Course & { lessonCount: number; completedCount: number };

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = useCallback(() => {
    setLoading(true);
    setError(null);
    apiGetList<CourseItem>('/courses')
      .then((data) => {
        setCourses(data);
      })
      .catch((err: unknown) => {
        const msg = err instanceof ApiClientError ? err.message : 'Gagal memuat kurikulum kursus.';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const safeCourses = Array.isArray(courses) ? courses : [];

  const grouped = safeCourses.reduce<Record<number, CourseItem[]>>((acc, c) => {
    if (!acc[c.phase]) acc[c.phase] = [];
    acc[c.phase]!.push(c);
    return acc;
  }, {});

  const phaseLabels: Record<number, string> = {
    1: 'Fase 1 Fondasi JavaScript',
    2: 'Fase 2 JavaScript Menengah',
    3: 'Fase 3 JavaScript Modern',
  };

  return (
    <>
      <Helmet>
        <title>Kurikulum — JSCraft</title>
      </Helmet>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="mb-10">
          <h1 className="heading-2 mb-2 text-slate-900 dark:text-white">Kurikulum 42 Hari</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Dari Hello World hingga proyek nyata, satu langkah setiap hari.
          </p>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-32 rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center dark:border-rose-900/50 dark:bg-rose-950/30">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/50">
              <AlertCircle
                className="h-6 w-6 text-rose-600 dark:text-rose-400"
                aria-hidden="true"
              />
            </div>
            <h2 className="mb-1 text-base font-semibold text-slate-900 dark:text-white">
              Gagal Memuat Kurikulum
            </h2>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">{error}</p>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={fetchCourses}
            >
              Coba Lagi
            </Button>
          </div>
        ) : safeCourses.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
              <BookOpen className="h-6 w-6 text-slate-400" aria-hidden="true" />
            </div>
            <h2 className="mb-1 text-base font-semibold text-slate-900 dark:text-white">
              Belum Ada Data
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Belum ada materi kursus yang tersedia saat ini.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(grouped).map(([phase, phaseCourses]) => (
              <div key={phase}>
                <h2 className="font-heading mb-4 flex items-center gap-3 font-bold text-slate-900 dark:text-white">
                  <span className="bg-brand-500 flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white">
                    {phase}
                  </span>
                  {phaseLabels[Number(phase)]}
                </h2>
                <div className="space-y-3">
                  {phaseCourses.map((course, i) => {
                    const pct =
                      course.lessonCount > 0
                        ? Math.round((course.completedCount / course.lessonCount) * 100)
                        : 0;
                    const done = pct === 100;
                    return (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                      >
                        <Link
                          to={`/courses/${course.slug}`}
                          className="card-hover group flex items-center gap-4 p-5"
                        >
                          <div
                            className={cn(
                              'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors',
                              done
                                ? 'bg-emerald-100 dark:bg-emerald-900/30'
                                : 'bg-brand-100 dark:bg-brand-900/30'
                            )}
                          >
                            {done ? (
                              <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                            ) : course.isPremium ? (
                              <Lock className="text-brand-600 dark:text-brand-400 h-6 w-6" />
                            ) : (
                              <BookOpen className="text-brand-600 dark:text-brand-400 h-6 w-6" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-0.5 flex items-center gap-2">
                              <span className="truncate font-semibold text-slate-900 dark:text-white">
                                {course.titleId}
                              </span>
                              {course.isPremium && (
                                <span className="status-badge-premium shrink-0">Premium</span>
                              )}
                            </div>
                            <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                              {course.description}
                            </p>
                            <div className="mt-2 flex items-center gap-3">
                              <div className="progress-track h-1.5 flex-1">
                                <div
                                  className="progress-fill h-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="shrink-0 text-xs text-slate-400">
                                {course.completedCount}/{course.lessonCount}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="group-hover:text-brand-500 h-5 w-5 shrink-0 text-slate-400 transition-colors" />
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
