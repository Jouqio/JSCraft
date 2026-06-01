import type { LevelInfo, XPRewards } from '@jscraft/types';

export const XP_REWARDS: XPRewards = {
  lesson_complete:    10,
  quiz_pass:          20,
  quiz_perfect:       50,
  exercise_complete:   5,
  streak_3_days:      15,
  streak_7_days:      30,
  streak_14_days:     75,
  streak_30_days:    200,
  first_lesson:       25,
};

export const xpService = {
  /**
   * Calculate level and progress from raw XP total.
   * Level 1 = 0 XP, each level requires 20% more XP than the previous.
   */
  levelFromXP(totalXP: number): LevelInfo {
    let xp = totalXP;
    let level = 1;
    let required = 100;

    while (xp >= required) {
      xp -= required;
      required = Math.floor(required * 1.2);
      level++;
    }

    return {
      level,
      xpIntoLevel: xp,
      xpForNext: required,
      progressPercent: Math.round((xp / required) * 100),
    };
  },

  /** XP required to reach a specific level from zero */
  xpForLevel(level: number): number {
    let total = 0;
    let required = 100;
    for (let i = 1; i < level; i++) {
      total += required;
      required = Math.floor(required * 1.2);
    }
    return total;
  },

  /** Human-readable level title */
  levelTitle(level: number): string {
    if (level <= 3)  return 'Pemula';
    if (level <= 7)  return 'Pelajar';
    if (level <= 12) return 'Pengembang';
    if (level <= 20) return 'Hacker';
    if (level <= 30) return 'Craftsman';
    return 'Grandmaster';
  },
};

/** Format XP with K suffix for display */
export function formatXP(xp: number): string {
  if (xp >= 1_000_000) return `${(xp / 1_000_000).toFixed(1)}M`;
  if (xp >= 1000)      return `${(xp / 1000).toFixed(1)}K`;
  return String(xp);
}
