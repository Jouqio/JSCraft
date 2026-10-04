import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Zap, BookOpen, Trophy, ArrowRight, Bookmark, Trash2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import type { Bookmark as BookmarkType } from '@jscraft/types';
import { apiGet, apiDel } from '@lib/api';
import { useAuthStore } from '@store/authStore';
import { useProgressStore } from '@store/progressStore';
import { xpService, formatXP } from '@lib/xp';
import { Button } from '@components/ui/Button';
import { PageSpinner } from '@components/ui/Spinner';

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div className="card p-5">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
        {icon}
      </div>
      <div className="font-heading text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
      <div className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  );
}

const ACHIEVEMENTS = [
  { key: 'first_lesson', icon: '🌟', title: 'Langkah Pertama', earned: true },
  { key: 'streak_3', icon: '🔥', title: '3 Hari Streak', earned: true },
  { key: 'perfect_quiz', icon: '💯', title: 'Nilai Sempurna', earned: false },
  { key: 'week_1_done', icon: '🏅', title: 'Minggu Pertama', earned: false },
  { key: 'streak_7', icon: '💪', title: 'Seminggu Penuh', earned: false },
  { key: 'completionist', icon: '🏆', title: 'Completionist', earned: false },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { getCompletedCount, streak, syncFromServer } = useProgressStore();
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(true);

  const fetchBookmarks = useCallback(async () => {
    try {
      setLoadingBookmarks(true);
      const data = await apiGet<BookmarkType[]>('/bookmarks');
      setBookmarks(data);
    } catch {
      // silent
    } finally {
      setLoadingBookmarks(false);
    }
  }, []);

  useEffect(() => {
    syncFromServer();
    fetchBookmarks();
  }, [syncFromServer, fetchBookmarks]);

  const handleRemoveBookmark = async (e: React.MouseEvent, lessonId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await apiDel(`/bookmarks/${lessonId}`);
      setBookmarks((prev) => prev.filter((b) => b.lessonId !== lessonId));
      toast.success('Bookmark dihapus');
    } catch {
      toast.error('Gagal menghapus bookmark');
    }
  };

  if (!user) {
    return <PageSpinner />;
  }

  const levelInfo = xpService.levelFromXP(user.xpTotal);
  const completed = getCompletedCount();

  // Build 7-day activity grid
  const today = new Date();
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0]!;
    const isToday = i === 6;
    const done = streak.completedDates?.includes(dateStr) ?? false;
    return { dateStr, isToday, done, label: d.toLocaleDateString('id-ID', { weekday: 'short' }) };
  });

  return (
    <>
      <Helmet>
        <title>Dashboard — JSCraft</title>
      </Helmet>
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
            Halo, {user.displayName ?? user.username}! 👋
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            {streak.current > 0
              ? `🔥 Kamu sudah belajar ${streak.current} hari berturut-turut. Pertahankan!`
              : 'Mulai belajar hari ini untuk memulai streak-mu!'}
          </p>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            icon={<Zap className="text-brand-600 h-5 w-5" />}
            value={formatXP(user.xpTotal) + ' XP'}
            label="Total XP"
            color="bg-brand-100 dark:bg-brand-900/30"
          />
          <StatCard
            icon={<Flame className="h-5 w-5 text-orange-500" />}
            value={`${streak.current} Hari`}
            label="Streak Sekarang"
            color="bg-orange-100 dark:bg-orange-900/30"
          />
          <StatCard
            icon={<BookOpen className="h-5 w-5 text-blue-500" />}
            value={`${completed}/42`}
            label="Pelajaran Selesai"
            color="bg-blue-100 dark:bg-blue-900/30"
          />
          <StatCard
            icon={<Trophy className="h-5 w-5 text-purple-500" />}
            value={`Lv. ${user.level}`}
            label="Level Sekarang"
            color="bg-purple-100 dark:bg-purple-900/30"
          />
        </div>

        {/* XP Progress */}
        <div className="card p-6">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-900 dark:text-white">
                Level {levelInfo.level} → Level {levelInfo.level + 1}
              </div>
              <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {xpService.levelTitle(levelInfo.level)}
              </div>
            </div>
            <span className="xp-badge">
              ⚡ {levelInfo.xpIntoLevel} / {levelInfo.xpForNext} XP
            </span>
          </div>
          <div className="progress-track">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${levelInfo.progressPercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          <div className="mt-2 text-right text-xs text-slate-400">
            {levelInfo.progressPercent}% menuju level berikutnya
          </div>
        </div>

        {/* 7-day activity */}
        <div className="card p-6">
          <h2 className="font-heading mb-4 font-semibold text-slate-900 dark:text-white">
            Aktivitas 7 Hari Terakhir
          </h2>
          <div className="flex gap-2">
            {last7.map(({ isToday, done, label }) => (
              <div key={label} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className={`aspect-square w-full rounded-lg transition-colors ${
                    done
                      ? isToday
                        ? 'bg-brand-500 ring-brand-300 ring-2 ring-offset-1'
                        : 'bg-brand-400 dark:bg-brand-600'
                      : 'bg-slate-100 dark:bg-slate-800'
                  }`}
                />
                <span className="text-2xs text-slate-400 dark:text-slate-500">{label}</span>
              </div>
            ))}
          </div>
          {streak.max > 0 && (
            <p className="mt-3 text-xs text-slate-400">
              🏆 Streak terpanjangmu:{' '}
              <strong className="text-slate-600 dark:text-slate-300">{streak.max} hari</strong>
            </p>
          )}
        </div>

        {/* Bookmarks */}
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-amber-500" />
              <h2 className="font-heading font-semibold text-slate-900 dark:text-white">
                Pelajaran Disimpan
              </h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {bookmarks.length} pelajaran
            </span>
          </div>

          {loadingBookmarks ? (
            <div className="py-6 text-center text-sm text-slate-400">Memuat bookmark...</div>
          ) : bookmarks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-6 text-center dark:border-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Belum ada pelajaran yang disimpan.
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                Klik tombol Bookmark pada halaman pelajaran untuk menyimpannya di sini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {bookmarks.map((b) => (
                <div
                  key={b.lessonId}
                  className="hover:border-brand-500 hover:shadow-card-sm dark:hover:border-brand-500 group relative flex items-center justify-between rounded-xl border border-slate-200 p-4 transition-all dark:border-slate-800"
                >
                  <Link
                    to={`/courses/${b.lesson.course.slug}/lessons/${b.lesson.id}`}
                    className="min-w-0 flex-1 pr-3"
                  >
                    <div className="text-2xs text-brand-600 dark:text-brand-400 font-semibold uppercase tracking-wider">
                      {b.lesson.course.titleId || b.lesson.course.title}
                    </div>
                    <div className="group-hover:text-brand-600 dark:group-hover:text-brand-400 mt-1 truncate text-sm font-medium text-slate-900 dark:text-white">
                      Hari {b.lesson.dayNumber}: {b.lesson.titleId || b.lesson.title}
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => handleRemoveBookmark(e, b.lessonId)}
                    className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                    title="Hapus bookmark"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Achievements */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading font-semibold text-slate-900 dark:text-white">
              Pencapaian
            </h2>
            <span className="text-sm text-slate-500">
              {ACHIEVEMENTS.filter((a) => a.earned).length}/{ACHIEVEMENTS.length} diraih
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {ACHIEVEMENTS.map((a) => (
              <div
                key={a.key}
                className={`card p-3 text-center transition-all ${!a.earned ? 'opacity-40 grayscale' : 'hover:shadow-card-md'}`}
              >
                <div className="mb-1.5 text-2xl">{a.icon}</div>
                <div className="text-2xs font-medium leading-tight text-slate-600 dark:text-slate-400">
                  {a.title}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="card from-brand-50 dark:from-brand-950/20 border-brand-200 dark:border-brand-800/50 bg-gradient-to-br to-white p-6 dark:to-slate-900">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-heading mb-1 font-bold text-slate-900 dark:text-white">
                {completed === 0 ? 'Mulai pelajaran pertamamu!' : `Lanjutkan Hari ${completed + 1}`}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {completed === 0
                  ? 'Hello World menunggumu 👋'
                  : `${42 - completed} pelajaran tersisa`}
              </p>
            </div>
            <Link to="/courses/javascript-fundamentals">
              <Button rightIcon={<ArrowRight className="h-4 w-4" />}>
                {completed === 0 ? 'Mulai Belajar' : 'Lanjutkan'}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
