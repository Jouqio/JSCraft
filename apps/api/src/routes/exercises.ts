import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { xpService } from '../services/xpService.js';
import { AppError } from '../middleware/errorHandler.js';
import { runExerciseCode, type TestCase } from '../services/codeRunner.js';

const router = Router();

// GET /v1/exercises/:lessonId
router.get('/:lessonId', async (req, res, next) => {
  try {
    const exercises = await prisma.exercise.findMany({
      where: { lessonId: req.params.lessonId },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        starterCode: true,
        hints: true,
        xpReward: true,
        testCases: true,
      },
    });

    const sanitizedExercises = exercises.map((ex: (typeof exercises)[0]) => ({
      id: ex.id,
      title: ex.title,
      description: ex.description,
      starterCode: ex.starterCode,
      hints: ex.hints,
      xpReward: ex.xpReward,
      testCases: Array.isArray(ex.testCases)
        ? (ex.testCases as any[])
            .filter((tc: any) => !tc.hidden && !tc.isHidden)
            .map((tc: any) => ({
              description: String(tc.description ?? ''),
              expectedOutput: String(tc.expectedOutput ?? ''),
              ...(tc.input !== undefined ? { input: String(tc.input) } : {}),
            }))
        : [],
    }));

    res.json({ success: true, data: sanitizedExercises });
  } catch (err) {
    next(err);
  }
});

// POST /v1/exercises/:id/submit
router.post(
  '/:id/submit',
  authenticate,
  validateBody(z.object({ code: z.string().max(10000) })),
  async (req, res, next) => {
    try {
      const userId = (req as any).userId as string;
      const { code } = req.body as { code: string };

      const exercise = await prisma.exercise.findUnique({
        where: { id: req.params.id },
      });
      if (!exercise) throw new AppError(404, 'NOT_FOUND', 'Latihan tidak ditemukan');

      const rawTestCases = Array.isArray(exercise.testCases)
        ? (exercise.testCases as unknown as TestCase[])
        : [];

      // Execute code against test cases in isolated sandbox
      const runResult = runExerciseCode(code, rawTestCases);

      // Check if user has already passed this exercise before (XP idempotency)
      const previousPassed = await prisma.exerciseAttempt.findFirst({
        where: { userId, exerciseId: exercise.id, passed: true },
      });

      let xpEarned = 0;
      if (runResult.passed && !previousPassed) {
        xpEarned = exercise.xpReward;
        await xpService.awardXP(userId, xpEarned);
      }

      await prisma.exerciseAttempt.create({
        data: {
          userId,
          exerciseId: exercise.id,
          code,
          passed: runResult.passed,
          xpEarned,
          results: runResult.results as any,
        },
      });

      res.json({
        success: true,
        data: {
          passed: runResult.passed,
          xpEarned,
          totalTests: runResult.totalTests,
          passedTests: runResult.passedTests,
          results: runResult.results,
          output: runResult.output,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
