import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle, Lock, ChevronRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import type { Course } from '@jscraft/types';
import { apiGet } from '@lib/api';
import { cn } from '@lib/utils';

export default function CoursesPage() {
  const [courses, setCourses] = useState<(Course & { lessonCount: number; completedCount: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<typeof courses>('/courses')
      .then(setCourses)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const grouped = courses.reduce<Record<number, typeof courses>>((acc, c) => {
    if (!acc[c.phase]) acc[c.phase] = [];
    acc[c.phase]!.push(c);
    return acc;
  }, {});

  const phaseLabels: Record<number, string> = {
    1: 'Fase 1 — Fondasi JavaScript',
    2: 'Fase 2 — JavaScript Menengah',
    3: 'Fase 3 — JavaScript Modern',
  };

  return (
    <>
      <Helmet><title>Kurikulum — JSCraft</title></Helmet>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-10">
          <h1 className="heading-2 text-slate-900 dark:text-white mb-2">Kurikulum 42 Hari</h1>
          <p className="text-slate-500 dark:text-slate-400">Dari Hello World hingga proyek nyata, satu langkah setiap hari.</p>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[1,2,3].map(i => <div key={i} className="skeleton h-32 rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(grouped).map(([phase, phaseCourses]) => (
              <div key={phase}>
                <h2 className="font-heading font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-brand-500 text-white text-xs flex items-center justify-center font-bold">{phase}</span>
                  {phaseLabels[Number(phase)]}
                </h2>
                <div className="space-y-3">
                  {phaseCourses.map((course, i) => {
                    const pct = course.lessonCount > 0 ? Math.round((course.completedCount / course.lessonCount) * 100) : 0;
                    const done = pct === 100;
                    return (
                      <motion.div key={course.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                        <Link to={`/courses/${course.slug}`}
                          className="card-hover flex items-center gap-4 p-5 group">
                          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                            done ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-brand-100 dark:bg-brand-900/30')}>
                            {done
                              ? <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                              : course.isPremium
                                ? <Lock className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                                : <BookOpen className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-semibold text-slate-900 dark:text-white truncate">{course.titleId}</span>
                              {course.isPremium && <span className="status-badge-premium shrink-0">Premium</span>}
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{course.description}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <div className="flex-1 progress-track h-1.5">
                                <div className="progress-fill h-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-slate-400 shrink-0">{course.completedCount}/{course.lessonCount}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-brand-500 transition-colors shrink-0" />
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
