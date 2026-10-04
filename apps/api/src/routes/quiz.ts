import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { xpService, XP_REWARDS } from '../services/xpService.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

const submitSchema = z.object({
  answers: z.array(z.object({ questionId: z.string(), selectedOptionId: z.string() })),
  timeTaken: z.number().int().positive().optional(),
});

// GET /v1/quiz/leaderboard
router.get('/leaderboard', async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      orderBy: { xpTotal: 'desc' },
      take: 50,
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        xpTotal: true,
        level: true,
        streakCurrent: true,
      },
    });
    const data = users.map((u: (typeof users)[0], i: number) => ({ rank: i + 1, ...u }));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /v1/quiz/:lessonId
router.get('/:lessonId', authenticate, async (req, res, next) => {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { lessonId: req.params.lessonId },
      select: {
        id: true,
        lessonId: true,
        title: true,
        timeLimit: true,
        passingScore: true,
        createdAt: true,
        updatedAt: true,
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            text: true,
            type: true,
            order: true,
            options: true,
          },
        },
      },
    });
    if (!quiz) throw new AppError(404, 'NOT_FOUND', 'Kuis tidak ditemukan');

    const sanitized = {
      id: quiz.id,
      lessonId: quiz.lessonId,
      title: quiz.title,
      timeLimit: quiz.timeLimit,
      passingScore: quiz.passingScore,
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt,
      questions: quiz.questions.map((q: (typeof quiz.questions)[0]) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        order: q.order,
        options: Array.isArray(q.options)
          ? (q.options as Array<{ id: string; text: string }>).map((opt) => ({
              id: String(opt.id),
              text: String(opt.text ?? ''),
            }))
          : [],
      })),
    };

    res.json({ success: true, data: sanitized });
  } catch (err) {
    next(err);
  }
});

// POST /v1/quiz/:id/attempt
router.post('/:id/attempt', authenticate, validateBody(submitSchema), async (req, res, next) => {
  try {
    const userId = (req as any).userId as string;
    const { answers, timeTaken } = req.body as z.infer<typeof submitSchema>;

    const quiz = await prisma.quiz.findUnique({
      where: { id: req.params.id },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          select: { id: true, options: true, explanation: true },
        },
      },
    });
    if (!quiz) throw new AppError(404, 'NOT_FOUND', 'Kuis tidak ditemukan');

    // 1. Batasi jumlah jawaban agar tidak melebihi jumlah pertanyaan kuis
    if (answers.length > quiz.questions.length) {
      throw new AppError(400, 'BAD_REQUEST', 'Jumlah jawaban melebihi jumlah pertanyaan');
    }

    // 2. Cegah duplikasi questionId dalam satu submisi
    const answeredQuestionIds = new Set<string>();
    for (const ans of answers) {
      if (answeredQuestionIds.has(ans.questionId)) {
        throw new AppError(400, 'BAD_REQUEST', 'Pertanyaan dijawab lebih dari satu kali');
      }
      answeredQuestionIds.add(ans.questionId);
    }

    // 3. Validasi questionId dan tolak selectedOptionId yang bukan milik soal
    for (const ans of answers) {
      const question = quiz.questions.find((q: (typeof quiz.questions)[0]) => q.id === ans.questionId);
      if (!question) {
        throw new AppError(400, 'BAD_REQUEST', `Pertanyaan ${ans.questionId} tidak valid untuk kuis ini`);
      }
      const options = question.options as Array<{ id: string; text: string; isCorrect: boolean }>;
      const optionExists = options.some((o) => o.id === ans.selectedOptionId);
      if (!optionExists) {
        throw new AppError(
          400,
          'BAD_REQUEST',
          `Pilihan ${ans.selectedOptionId} tidak valid untuk pertanyaan ${ans.questionId}`
        );
      }
    }

    // 4. Mencegah kirim ganda (idempotency / cooldown guard 3 detik)
    const recentAttempt = await prisma.quizAttempt.findFirst({
      where: {
        userId,
        quizId: quiz.id,
        createdAt: { gte: new Date(Date.now() - 3000) },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (recentAttempt) {
      throw new AppError(429, 'TOO_MANY_REQUESTS', 'Percobaan kuis sedang diproses. Mohon tunggu sejenak.');
    }

    // 5. Grade answers di sisi server (mengabaikan skor/isCorrect dari klien)
    let correctCount = 0;
    const results = quiz.questions.map((question: (typeof quiz.questions)[0]) => {
      const userAnswer = answers.find((a) => a.questionId === question.id);
      const options = question.options as Array<{ id: string; text: string; isCorrect: boolean }>;
      const correctOption = options.find((o) => o.isCorrect);
      const isCorrect = Boolean(
        userAnswer && correctOption && userAnswer.selectedOptionId === correctOption.id
      );

      if (isCorrect) correctCount++;

      return {
        questionId: question.id,
        selectedOptionId: userAnswer?.selectedOptionId ?? null,
        isCorrect,
        correctOptionId: correctOption?.id ?? '',
        explanation: question.explanation ?? null,
      };
    });

    const score = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = score >= quiz.passingScore;
    const isPerfect = score === 100;

    let xpEarned = 0;
    if (passed) xpEarned += XP_REWARDS.quiz_pass;
    if (isPerfect) xpEarned += XP_REWARDS.quiz_perfect - XP_REWARDS.quiz_pass; // additive

    if (xpEarned > 0) await xpService.awardXP(userId, xpEarned);

    const attempt = await prisma.quizAttempt.create({
      data: { userId, quizId: quiz.id, score, answers, timeTaken, passed, xpEarned },
    });

    res.json({
      success: true,
      data: {
        score,
        passed,
        xpEarned,
        correctCount,
        totalCount: quiz.questions.length,
        timeTaken,
        attemptId: attempt.id,
        results,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
