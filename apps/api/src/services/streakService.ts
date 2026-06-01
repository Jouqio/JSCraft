import { prisma } from '../config/database.js';
import { xpService, XP_REWARDS } from './xpService.js';

export const streakService = {
  async recordActivity(userId: string): Promise<{
    streakCurrent: number;
    streakMax: number;
    bonusXP: number;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { streakCurrent: true, streakMax: true, lastActiveAt: true },
    });
    if (!user) return { streakCurrent: 0, streakMax: 0, bonusXP: 0 };

    const now = new Date();
    const lastActive = user.lastActiveAt;
    let bonusXP = 0;
    let newStreak = user.streakCurrent;

    if (lastActive) {
      const daysDiff = Math.floor(
        (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === 0) {
        // Already active today — no change
      } else if (daysDiff === 1) {
        // Consecutive day — extend streak
        newStreak = user.streakCurrent + 1;

        // Award streak milestone XP
        if (newStreak === 3)  bonusXP = XP_REWARDS.streak_3_days;
        if (newStreak === 7)  bonusXP = XP_REWARDS.streak_7_days;
        if (newStreak === 14) bonusXP = XP_REWARDS.streak_14_days;
        if (newStreak === 30) bonusXP = XP_REWARDS.streak_30_days;
      } else {
        // Streak broken
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    const newMax = Math.max(newStreak, user.streakMax);

    await prisma.user.update({
      where: { id: userId },
      data: {
        streakCurrent: newStreak,
        streakMax: newMax,
        lastActiveAt: now,
      },
    });

    if (bonusXP > 0) {
      await xpService.awardXP(userId, bonusXP);
    }

    return { streakCurrent: newStreak, streakMax: newMax, bonusXP };
  },

  async resetExpiredStreaks(): Promise<number> {
    const yesterday = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const result = await prisma.user.updateMany({
      where: {
        streakCurrent: { gt: 0 },
        lastActiveAt: { lt: yesterday },
      },
      data: { streakCurrent: 0 },
    });
    return result.count;
  },

  async getStreakInfo(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { streakCurrent: true, streakMax: true, lastActiveAt: true },
    });

    const completedDates = await prisma.progress.findMany({
      where: { userId, status: 'COMPLETED', completedAt: { not: null } },
      select: { completedAt: true },
      orderBy: { completedAt: 'desc' },
    });

    return {
      current: user?.streakCurrent ?? 0,
      max: user?.streakMax ?? 0,
      lastActiveAt: user?.lastActiveAt?.toISOString() ?? null,
      completedDates: completedDates
        .map((p: { completedAt: Date | null }) => p.completedAt?.toISOString().split('T')[0])
        .filter(Boolean) as string[],
    };
  },
};
