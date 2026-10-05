import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { xpService } from '../services/xpService.js';
import { AppError } from '../middleware/errorHandler.js';
import { runExerciseCode, type TestCase } from '../services/codeRunner.js';
import type { Prisma } from '@prisma/client';

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

// Guard: server-side execution is disabled unless ENABLE_CODE_RUNNER=true.
function requireCodeRunner(_req: Request, _res: Response, next: NextFunction) {
  if (!env.ENABLE_CODE_RUNNER) {
    return next(
      new AppError(
        503,
        'CODE_RUNNER_DISABLED',
        'Eksekusi di server dinonaktifkan. Latihan belum dapat diperiksa untuk sementara.'
      )
    );
  }
  next();
}

// POST /v1/exercises/:id/submit
router.post(
  '/:id/submit',
  authenticate,
  requireCodeRunner,
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

      let xpEarned = 0;
      if (runResult.passed) {
        try {
          xpEarned = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 1. Sisipkan penyelesaian ke tabel berkonstrain unik (userId, exerciseId)
            await tx.exerciseCompletion.create({
              data: {
                userId,
                exerciseId: exercise.id,
                xpEarned: exercise.xpReward,
              },
            });
            // 2. Hanya jika berhasil tanpa pelanggaran unik (P2002), tambahkan XP secara atomik
            await xpService.awardXP(userId, exercise.xpReward, tx);
            return exercise.xpReward;
          });
        } catch (err: any) {
          if (err?.code === 'P2002') {
            // Sudah pernah lulus exercise ini sebelumnya; idempotensi terjamin
            xpEarned = 0;
          } else {
            throw err;
          }
        }
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
