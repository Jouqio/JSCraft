import { motion } from 'framer-motion';
import { xpService } from '@lib/xp';

interface XPBarProps { xp: number; showLabel?: boolean; }

export default function XPBar({ xp, showLabel = true }: XPBarProps) {
  const info = xpService.levelFromXP(xp);
  return (
    <div className="space-y-1.5">
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Level {info.level} — {xpService.levelTitle(info.level)}
          </span>
          <span className="xp-badge">⚡ {info.xpIntoLevel}/{info.xpForNext} XP</span>
        </div>
      )}
      <div className="progress-track">
        <motion.div className="progress-fill" initial={{ width: 0 }}
          animate={{ width: `${info.progressPercent}%` }}
          transition={{ duration: 1, ease: 'easeOut' }} />
      </div>
    </div>
  );
}
