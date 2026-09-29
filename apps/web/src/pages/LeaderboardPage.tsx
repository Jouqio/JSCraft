import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Flame, Medal } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import type { LeaderboardEntry } from '@jscraft/types';
import { apiGet } from '@lib/api';
import { useAuthStore } from '@store/authStore';
import { formatXP } from '@lib/xp';
import { initials, cn } from '@lib/utils';

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    apiGet<LeaderboardEntry[]>('/quiz/leaderboard')
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const top3 = entries.slice(0, 3);

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

        {/* Podium top 3 */}
        {!loading && top3.length >= 3 && (
          <div className="mb-10 flex items-end justify-center gap-3">
            {podiumOrder.map((entry, pi) => {
              if (!entry) return null;
              const rank = entry.rank;
              const isFirst = rank === 1;
              return (
                <motion.div
                  key={entry.userId}
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
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {entries.map((entry, i) => {
                const isMe = entry.userId === user?.id;
                return (
                  <motion.div
                    key={entry.userId}
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
                    <span className="xp-badge shrink-0">⚡ {formatXP(entry.xpTotal)}</span>
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
