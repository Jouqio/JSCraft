import { prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { xpService } from './xpService.js';
import { streakService } from './streakService.js';

export const progressService = {
  async startLesson(userId: string, lessonId: string) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, courseId: true, isPublished: true },
    });
    if (!lesson?.isPublished) {
      throw new AppError(404, 'LESSON_NOT_FOUND', 'Pelajaran tidak ditemukan');
    }

    await prisma.progress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: { userId, lessonId, courseId: lesson.courseId, status: 'IN_PROGRESS' },
      update: { status: 'IN_PROGRESS' },
    });
  },

  async completeLesson(userId: string, lessonId: string) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, courseId: true, xpReward: true, isPublished: true },
    });
    if (!lesson?.isPublished) {
      throw new AppError(404, 'LESSON_NOT_FOUND', 'Pelajaran tidak ditemukan');
    }

    // Check if already completed (idempotent)
    const existing = await prisma.progress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });

    let xpEarned = 0;

    if (existing?.status !== 'COMPLETED') {
      xpEarned = lesson.xpReward;

      await prisma.progress.upsert({
        where: { userId_lessonId: { userId, lessonId } },
        create: {
          userId, lessonId, courseId: lesson.courseId,
          status: 'COMPLETED', completedAt: new Date(), xpEarned,
        },
        update: { status: 'COMPLETED', completedAt: new Date(), xpEarned },
      });

      await xpService.awardXP(userId, xpEarned);
    }

    // Record activity for streak (even if already completed)
    const streak = await streakService.recordActivity(userId);

    // Check achievements
    const newAchievements = await xpService.checkAndAwardAchievements(userId);

    return {
      xpEarned: xpEarned + streak.bonusXP,
      streak,
      newAchievements,
    };
  },

  async getUserProgress(userId: string) {
    const progressList = await prisma.progress.findMany({
      where: { userId },
      select: {
        lessonId: true, courseId: true, status: true,
        completedAt: true, xpEarned: true,
      },
    });

    const map: Record<string, (typeof progressList)[0]> = {};
    progressList.forEach((p: typeof progressList[0]) => { map[p.lessonId] = p; });

    const streak = await streakService.getStreakInfo(userId);

    return { progress: map, streak };
  },
};
