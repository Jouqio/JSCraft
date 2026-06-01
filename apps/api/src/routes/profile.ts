import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// GET /v1/profile/:username — public profile
router.get('/:username', optionalAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username: req.params.username },
      select: {
        id: true, username: true, displayName: true, avatarUrl: true,
        xpTotal: true, level: true, streakCurrent: true, streakMax: true, createdAt: true,
        achievements: {
          include: { achievement: true },
          orderBy: { earnedAt: 'desc' },
        },
        certificates: { select: { id: true, courseSlug: true, issuedAt: true, verifyCode: true } },
        _count: { select: { progress: { where: { status: 'COMPLETED' } } } },
      },
    });
    if (!user) throw new AppError(404, 'NOT_FOUND', 'Profil tidak ditemukan');
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// PATCH /v1/profile — update own profile
router.patch('/', authenticate, validateBody(z.object({
  displayName: z.string().min(2).max(50).optional(),
  avatarUrl:   z.string().url().optional(),
})), async (req, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: (req as any).userId },
      data: req.body,
      select: { id: true, username: true, displayName: true, avatarUrl: true, email: true, xpTotal: true, level: true },
    });
    res.json({ success: true, data: { user } });
  } catch (err) { next(err); }
});

// GET /v1/profile/achievements (own)
router.get('/me/achievements', authenticate, async (req, res, next) => {
  try {
    const all = await prisma.achievement.findMany({ orderBy: { xpReward: 'desc' } });
    const earned = await prisma.userAchievement.findMany({
      where: { userId: (req as any).userId },
      select: { achievementId: true, earnedAt: true },
    });
    const earnedMap = Object.fromEntries(earned.map((e: { achievementId: string; earnedAt: Date }) => [e.achievementId, e.earnedAt]));
    const data = all.map((a: typeof all[0]) => ({ ...a, earnedAt: earnedMap[a.id] ?? null }));
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

export default router;
