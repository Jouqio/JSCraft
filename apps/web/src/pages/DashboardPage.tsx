import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Zap, BookOpen, Trophy, ArrowRight, Star } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useAuthStore } from '@store/authStore';
import { useProgressStore } from '@store/progressStore';
import { xpService, formatXP } from '@lib/xp';
import { Button } from '@components/ui/Button';

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: string; label: string; color: string }) {
  return (
    <div className="card p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        {icon}
      </div>
      <div className="font-heading text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
      <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{label}</div>
    </div>
  );
}

const ACHIEVEMENTS = [
  { key: 'first_lesson', icon: '🌟', title: 'Langkah Pertama', earned: true },
  { key: 'streak_3',     icon: '🔥', title: '3 Hari Streak',   earned: true },
  { key: 'perfect_quiz', icon: '💯', title: 'Nilai Sempurna',  earned: false },
  { key: 'week_1_done',  icon: '🏅', title: 'Minggu Pertama',  earned: false },
  { key: 'streak_7',     icon: '💪', title: 'Seminggu Penuh',  earned: false },
  { key: 'completionist',icon: '🏆', title: 'Completionist',   earned: false },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { getCompletedCount, streak, syncFromServer } = useProgressStore();

  useEffect(() => { syncFromServer(); }, []);

  if (!user) return null;

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
      <Helmet><title>Dashboard — JSCraft</title></Helmet>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">
            Halo, {user.displayName ?? user.username}! 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {streak.current > 0
              ? `🔥 Kamu sudah belajar ${streak.current} hari berturut-turut. Pertahankan!`
              : 'Mulai belajar hari ini untuk memulai streak-mu!'}
          </p>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={<Zap className="w-5 h-5 text-brand-600" />} value={formatXP(user.xpTotal) + ' XP'} label="Total XP" color="bg-brand-100 dark:bg-brand-900/30" />
          <StatCard icon={<Flame className="w-5 h-5 text-orange-500" />} value={`${streak.current} Hari`} label="Streak Sekarang" color="bg-orange-100 dark:bg-orange-900/30" />
          <StatCard icon={<BookOpen className="w-5 h-5 text-blue-500" />} value={`${completed}/42`} label="Pelajaran Selesai" color="bg-blue-100 dark:bg-blue-900/30" />
          <StatCard icon={<Trophy className="w-5 h-5 text-purple-500" />} value={`Lv. ${user.level}`} label="Level Sekarang" color="bg-purple-100 dark:bg-purple-900/30" />
        </div>

        {/* XP Progress */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-semibold text-slate-900 dark:text-white">
                Level {levelInfo.level} → Level {levelInfo.level + 1}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {xpService.levelTitle(levelInfo.level)}
              </div>
            </div>
            <span className="xp-badge">⚡ {levelInfo.xpIntoLevel} / {levelInfo.xpForNext} XP</span>
          </div>
          <div className="progress-track">
            <motion.div className="progress-fill" initial={{ width: 0 }}
              animate={{ width: `${levelInfo.progressPercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }} />
          </div>
          <div className="text-xs text-slate-400 mt-2 text-right">{levelInfo.progressPercent}% menuju level berikutnya</div>
        </div>

        {/* 7-day activity */}
        <div className="card p-6">
          <h2 className="font-heading font-semibold text-slate-900 dark:text-white mb-4">Aktivitas 7 Hari Terakhir</h2>
          <div className="flex gap-2">
            {last7.map(({ isToday, done, label }) => (
              <div key={label} className="flex-1 flex flex-col items-center gap-2">
                <div className={`w-full aspect-square rounded-lg transition-colors ${
                  done
                    ? isToday ? 'bg-brand-500 ring-2 ring-brand-300 ring-offset-1' : 'bg-brand-400 dark:bg-brand-600'
                    : 'bg-slate-100 dark:bg-slate-800'
                }`} />
                <span className="text-2xs text-slate-400 dark:text-slate-500">{label}</span>
              </div>
            ))}
          </div>
          {streak.max > 0 && (
            <p className="text-xs text-slate-400 mt-3">
              🏆 Streak terpanjangmu: <strong className="text-slate-600 dark:text-slate-300">{streak.max} hari</strong>
            </p>
          )}
        </div>

        {/* Achievements */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-slate-900 dark:text-white">Pencapaian</h2>
            <span className="text-sm text-slate-500">{ACHIEVEMENTS.filter(a => a.earned).length}/{ACHIEVEMENTS.length} diraih</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {ACHIEVEMENTS.map((a) => (
              <div key={a.key} className={`card p-3 text-center transition-all ${!a.earned ? 'opacity-40 grayscale' : 'hover:shadow-card-md'}`}>
                <div className="text-2xl mb-1.5">{a.icon}</div>
                <div className="text-2xs text-slate-600 dark:text-slate-400 leading-tight font-medium">{a.title}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="card p-6 bg-gradient-to-br from-brand-50 to-white dark:from-brand-950/20 dark:to-slate-900 border-brand-200 dark:border-brand-800/50">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-heading font-bold text-slate-900 dark:text-white mb-1">
                {completed === 0 ? 'Mulai pelajaran pertamamu!' : `Lanjutkan Hari ${completed + 1}`}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {completed === 0 ? 'Hello World menunggumu 👋' : `${42 - completed} pelajaran tersisa`}
              </p>
            </div>
            <Link to="/courses/javascript-fundamentals">
              <Button rightIcon={<ArrowRight className="w-4 h-4" />}>
                {completed === 0 ? 'Mulai Belajar' : 'Lanjutkan'}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
