import { prisma } from '../config/database.js';

export const XP_REWARDS = {
  lesson_complete:    10,
  quiz_pass:          20,
  quiz_perfect:       50,
  exercise_complete:   5,
  streak_3_days:      15,
  streak_7_days:      30,
  streak_14_days:     75,
  streak_30_days:    200,
  first_lesson:       25,
} as const;

export function levelFromXP(totalXP: number): { level: number; xpIntoLevel: number; xpForNext: number } {
  let xp = totalXP;
  let level = 1;
  let required = 100;
  while (xp >= required) {
    xp -= required;
    required = Math.floor(required * 1.2);
    level++;
  }
  return { level, xpIntoLevel: xp, xpForNext: required };
}

export const xpService = {
  async awardXP(userId: string, amount: number): Promise<{ newTotal: number; newLevel: number }> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { xpTotal: { increment: amount } },
      select: { xpTotal: true },
    });

    const { level } = levelFromXP(user.xpTotal);

    // Update level if changed
    await prisma.user.update({
      where: { id: userId },
      data: { level },
    });

    return { newTotal: user.xpTotal, newLevel: level };
  },

  async checkAndAwardAchievements(userId: string): Promise<string[]> {
    const earned: string[] = [];

    const [user, progressCount, existingAchs] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { streakCurrent: true, xpTotal: true } }),
      prisma.progress.count({ where: { userId, status: 'COMPLETED' } }),
      prisma.userAchievement.findMany({ where: { userId }, select: { achievementId: true } }),
    ]);

    if (!user) return earned;
    const alreadyEarned = new Set(existingAchs.map((a: { achievementId: string }) => a.achievementId));

    // Define achievement triggers
    const triggers: Array<{ key: string; condition: boolean }> = [
      { key: 'first_lesson',    condition: progressCount >= 1 },
      { key: 'week_1_done',     condition: progressCount >= 7 },
      { key: 'completionist',   condition: progressCount >= 42 },
      { key: 'streak_3',        condition: (user.streakCurrent ?? 0) >= 3 },
      { key: 'streak_7',        condition: (user.streakCurrent ?? 0) >= 7 },
      { key: 'streak_30',       condition: (user.streakCurrent ?? 0) >= 30 },
    ];

    for (const { key, condition } of triggers) {
      if (!condition) continue;

      const achievement = await prisma.achievement.findUnique({
        where: { key }, select: { id: true, xpReward: true },
      });
      if (!achievement || alreadyEarned.has(achievement.id)) continue;

      await prisma.userAchievement.create({
        data: { userId, achievementId: achievement.id },
      });

      if (achievement.xpReward > 0) {
        await this.awardXP(userId, achievement.xpReward);
      }

      earned.push(key);
    }

    return earned;
  },
};
