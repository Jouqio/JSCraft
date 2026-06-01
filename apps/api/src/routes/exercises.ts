import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { xpService, XP_REWARDS } from '../services/xpService.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// GET /v1/exercises/:lessonId
router.get('/:lessonId', async (req, res, next) => {
  try {
    const exercises = await prisma.exercise.findMany({
      where: { lessonId: req.params.lessonId },
      orderBy: { order: 'asc' },
      select: { id: true, title: true, description: true, starterCode: true, hints: true, xpReward: true, testCases: true },
    });
    res.json({ success: true, data: exercises });
  } catch (err) { next(err); }
});

// POST /v1/exercises/:id/submit
router.post('/:id/submit', authenticate, validateBody(z.object({ code: z.string().max(10000) })), async (req, res, next) => {
  try {
    const exercise = await prisma.exercise.findUnique({ where: { id: req.params.id } });
    if (!exercise) throw new AppError(404, 'NOT_FOUND', 'Latihan tidak ditemukan');

    // NOTE: Real code execution happens in a sandboxed worker process.
    // For now we return a placeholder — implement with vm2 or isolated-vm in production.
    await xpService.awardXP((req as any).userId, XP_REWARDS.exercise_complete);

    res.json({
      success: true,
      data: { passed: true, xpEarned: exercise.xpReward, results: [] },
    });
  } catch (err) { next(err); }
});

export default router;
