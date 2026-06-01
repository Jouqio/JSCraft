import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { xpService, XP_REWARDS } from '../services/xpService.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

const submitSchema = z.object({
  answers:   z.array(z.object({ questionId: z.string(), selectedOptionId: z.string() })),
  timeTaken: z.number().int().positive().optional(),
});

// GET /v1/quiz/leaderboard
router.get('/leaderboard', async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      orderBy: { xpTotal: 'desc' },
      take: 50,
      select: { id: true, username: true, displayName: true, avatarUrl: true, xpTotal: true, level: true, streakCurrent: true },
    });
    const data = users.map((u: typeof users[0], i: number) => ({ rank: i + 1, ...u }));
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// GET /v1/quiz/:lessonId
router.get('/:lessonId', authenticate, async (req, res, next) => {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { lessonId: req.params.lessonId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          select: { id: true, text: true, type: true, order: true,
            options: true, // isCorrect stripped below
          },
        },
      },
    });
    if (!quiz) throw new AppError(404, 'NOT_FOUND', 'Kuis tidak ditemukan');

    const sanitized = {
      ...quiz,
      questions: quiz.questions.map((q: typeof quiz.questions[0]) => ({
        ...q,
        options: (q.options as any[]).map(({ isCorrect: _ic, ...opt }: { isCorrect: boolean; id: string; text: string }) => opt),
      })),
    };

    res.json({ success: true, data: sanitized });
  } catch (err) { next(err); }
});

// POST /v1/quiz/:id/attempt
router.post('/:id/attempt', authenticate, validateBody(submitSchema), async (req, res, next) => {
  try {
    const userId = (req as any).userId as string;
    const { answers, timeTaken } = req.body as z.infer<typeof submitSchema>;

    const quiz = await prisma.quiz.findUnique({
      where: { id: req.params.id },
      include: {
        questions: { select: { id: true, options: true } },
      },
    });
    if (!quiz) throw new AppError(404, 'NOT_FOUND', 'Kuis tidak ditemukan');

    // Grade answers
    let correctCount = 0;
    for (const answer of answers) {
      const question = quiz.questions.find((q: (typeof quiz.questions)[0]) => q.id === answer.questionId);
      if (!question) continue;
      const options = question.options as Array<{ id: string; isCorrect: boolean }>;
      const selected = options.find((o: { id: string; isCorrect: boolean }) => o.id === answer.selectedOptionId);
      if (selected?.isCorrect) correctCount++;
    }

    const score = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = score >= quiz.passingScore;
    const isPerfect = score === 100;

    let xpEarned = 0;
    if (passed)    xpEarned += XP_REWARDS.quiz_pass;
    if (isPerfect) xpEarned += XP_REWARDS.quiz_perfect - XP_REWARDS.quiz_pass; // additive

    if (xpEarned > 0) await xpService.awardXP(userId, xpEarned);

    const attempt = await prisma.quizAttempt.create({
      data: { userId, quizId: quiz.id, score, answers, timeTaken, passed, xpEarned },
    });

    res.json({
      success: true,
      data: { score, passed, xpEarned, correctCount, totalCount: quiz.questions.length, timeTaken, attemptId: attempt.id },
    });
  } catch (err) { next(err); }
});

export default router;
