import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Flame, Medal } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import type { LeaderboardEntry } from '@jscraft/types';
import { apiGet } from '@lib/api';
import { useAuthStore } from '@store/authStore';
import { xpService, formatXP } from '@lib/xp';
import { initials, cn } from '@lib/utils';

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    apiGet<LeaderboardEntry[]>('/quiz/leaderboard')
      .then(setEntries).catch(console.error).finally(() => setLoading(false));
  }, []);

  const top3 = entries.slice(0, 3);
  const rest  = entries.slice(3);

  const podiumOrder = top3.length === 3
    ? [top3[1], top3[0], top3[2]] // 2nd, 1st, 3rd
    : top3;

  const medalColors = ['text-amber-500', 'text-slate-400', 'text-amber-700'];
  const podiumHeights = ['h-20', 'h-28', 'h-14'];

  return (
    <>
      <Helmet><title>Papan Skor — JSCraft</title></Helmet>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="text-center mb-10">
          <Trophy className="w-10 h-10 text-brand-500 mx-auto mb-3" />
          <h1 className="heading-2 text-slate-900 dark:text-white">Papan Skor</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Top 50 pelajar berdasarkan total XP</p>
        </div>

        {/* Podium top 3 */}
        {!loading && top3.length >= 3 && (
          <div className="flex items-end justify-center gap-3 mb-10">
            {podiumOrder.map((entry, pi) => {
              if (!entry) return null;
              const rank = entry.rank;
              const isFirst = rank === 1;
              return (
                <motion.div key={entry.userId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: pi * 0.1 }} className="flex flex-col items-center">
                  <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg mb-2 shadow-lg',
                    isFirst ? 'bg-gradient-to-br from-brand-400 to-brand-600' : 'bg-slate-600')}>
                    {entry.avatarUrl
                      ? <img src={entry.avatarUrl} alt="" className="w-full h-full rounded-2xl object-cover" />
                      : initials(entry.displayName ?? entry.username)
                    }
                  </div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 max-w-[80px] truncate text-center">
                    {entry.displayName ?? entry.username}
                  </span>
                  <span className="xp-badge mt-1">{formatXP(entry.xpTotal)} XP</span>
                  <div className={cn('w-20 rounded-t-lg mt-2 flex items-start justify-center pt-2', podiumHeights[pi],
                    isFirst ? 'bg-brand-500' : rank === 2 ? 'bg-slate-400' : 'bg-amber-700')}>
                    <Medal className={cn('w-5 h-5', medalColors[rank - 1])} />
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
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-14 rounded-none" />)}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {entries.map((entry, i) => {
                const isMe = entry.userId === user?.id;
                return (
                  <motion.div key={entry.userId} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.02, 0.3) }}
                    className={cn('flex items-center gap-4 px-4 py-3 transition-colors',
                      isMe ? 'bg-brand-50 dark:bg-brand-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-900/50')}>
                    {/* Rank */}
                    <span className={cn('w-8 text-center font-mono font-bold text-sm shrink-0',
                      entry.rank <= 3 ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400')}>
                      #{entry.rank}
                    </span>
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {entry.avatarUrl
                        ? <img src={entry.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                        : initials(entry.displayName ?? entry.username)
                      }
                    </div>
                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn('font-semibold text-sm truncate', isMe ? 'text-brand-700 dark:text-brand-300' : 'text-slate-900 dark:text-white')}>
                          {entry.displayName ?? entry.username}
                          {isMe && <span className="ml-1 text-2xs">(kamu)</span>}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="level-badge">Lv.{entry.level}</span>
                        {entry.streakCurrent > 0 && (
                          <span className="streak-badge"><Flame className="w-3 h-3" />{entry.streakCurrent}</span>
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
