import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Flame, Medal, AlertCircle, RefreshCw } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import type { LeaderboardEntry } from '@jscraft/types';
import { apiGetList, ApiClientError } from '@lib/api';
import { useAuthStore } from '@store/authStore';
import { formatXP } from '@lib/xp';
import { initials, cn } from '@lib/utils';
import { Button } from '@components/ui/Button';

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const fetchLeaderboard = useCallback(() => {
    setLoading(true);
    setError(null);
    apiGetList<LeaderboardEntry>('/quiz/leaderboard')
      .then((data) => {
        setEntries(data);
      })
      .catch((err: unknown) => {
        const msg =
          err instanceof ApiClientError ? err.message : 'Gagal memuat data papan skor.';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const safeEntries = Array.isArray(entries) ? entries : [];
  const top3 = safeEntries.slice(0, 3);

  const podiumOrder =
    top3.length === 3
      ? [top3[1], top3[0], top3[2]] // 2nd, 1st, 3rd
      : top3;

  const medalColors = ['text-amber-500', 'text-slate-400', 'text-amber-700'];
  const podiumHeights = ['h-20', 'h-28', 'h-14'];

  return (
    <>
      <Helmet>
        <title>Papan Skor — JSCraft</title>
      </Helmet>
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="mb-10 text-center">
          <Trophy className="text-brand-500 mx-auto mb-3 h-10 w-10" />
          <h1 className="heading-2 text-slate-900 dark:text-white">Papan Skor</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Top 50 pelajar berdasarkan total XP
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center dark:border-rose-900/50 dark:bg-rose-950/30 mb-8">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/50">
              <AlertCircle
                className="h-6 w-6 text-rose-600 dark:text-rose-400"
                aria-hidden="true"
              />
            </div>
            <h2 className="mb-1 text-base font-semibold text-slate-900 dark:text-white">
              Gagal Memuat Papan Skor
            </h2>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">{error}</p>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={fetchLeaderboard}
            >
              Coba Lagi
            </Button>
          </div>
        ) : null}

        {/* Podium top 3 */}
        {!loading && !error && top3.length >= 3 && (
          <div className="mb-10 flex items-end justify-center gap-3">
            {podiumOrder.map((entry, pi) => {
              if (!entry) return null;
              const rank = entry.rank;
              const isFirst = rank === 1;
              const entryKey = entry.userId || (entry as { id?: string }).id || String(pi);
              return (
                <motion.div
                  key={entryKey}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: pi * 0.1 }}
                  className="flex flex-col items-center"
                >
                  <div
                    className={cn(
                      'mb-2 flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-lg',
                      isFirst ? 'from-brand-400 to-brand-600 bg-gradient-to-br' : 'bg-slate-600'
                    )}
                  >
                    {entry.avatarUrl ? (
                      <img
                        src={entry.avatarUrl}
                        alt=""
                        className="h-full w-full rounded-2xl object-cover"
                      />
                    ) : (
                      initials(entry.displayName ?? entry.username)
                    )}
                  </div>
                  <span className="max-w-[80px] truncate text-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {entry.displayName ?? entry.username}
                  </span>
                  <span className="xp-badge mt-1">{formatXP(entry.xpTotal)} XP</span>
                  <div
                    className={cn(
                      'mt-2 flex w-20 items-start justify-center rounded-t-lg pt-2',
                      podiumHeights[pi],
                      isFirst ? 'bg-brand-500' : rank === 2 ? 'bg-slate-400' : 'bg-amber-700'
                    )}
                  >
                    <Medal className={cn('h-5 w-5', medalColors[rank - 1])} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Full table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="space-y-px">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton h-14 rounded-none" />
              ))}
            </div>
          ) : !error && safeEntries.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                <Trophy className="h-6 w-6 text-slate-400" aria-hidden="true" />
              </div>
              <h2 className="mb-1 text-base font-semibold text-slate-900 dark:text-white">
                Belum Ada Data
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Belum ada pelajar di papan skor saat ini.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {safeEntries.map((entry, i) => {
                const entryId = entry.userId || (entry as { id?: string }).id;
                const isMe = entryId === user?.id;
                return (
                  <motion.div
                    key={entryId || i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.02, 0.3) }}
                    className={cn(
                      'flex items-center gap-4 px-4 py-3 transition-colors',
                      isMe
                        ? 'bg-brand-50 dark:bg-brand-900/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'
                    )}
                  >
                    {/* Rank */}
                    <span
                      className={cn(
                        'w-8 shrink-0 text-center font-mono text-sm font-bold',
                        entry.rank <= 3 ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'
                      )}
                    >
                      #{entry.rank}
                    </span>
                    {/* Avatar */}
                    <div className="from-brand-400 to-brand-600 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white">
                      {entry.avatarUrl ? (
                        <img
                          src={entry.avatarUrl}
                          alt=""
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        initials(entry.displayName ?? entry.username)
                      )}
                    </div>
                    {/* Name */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'truncate text-sm font-semibold',
                            isMe
                              ? 'text-brand-700 dark:text-brand-300'
                              : 'text-slate-900 dark:text-white'
                          )}
                        >
                          {entry.displayName ?? entry.username}
                          {isMe && <span className="text-2xs ml-1">(kamu)</span>}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="level-badge">Lv.{entry.level}</span>
                        {entry.streakCurrent > 0 && (
                          <span className="streak-badge">
                            <Flame className="h-3 w-3" />
                            {entry.streakCurrent}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* XP */}
                    <span className="xp-badge shrink-0">{formatXP(entry.xpTotal)} XP</span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
