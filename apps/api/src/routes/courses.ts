import { Router } from 'express';
import { prisma } from '../config/database.js';
import { optionalAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// GET /v1/courses — list all published courses
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const userId = (req as any).userId as string | undefined;

    const courses = await prisma.course.findMany({
      where: { isPublished: true },
      orderBy: [{ phase: 'asc' }, { week: 'asc' }, { order: 'asc' }],
      include: {
        _count: { select: { lessons: { where: { isPublished: true } } } },
      },
    });

    // If authenticated, include completion counts
    let completionMap: Record<string, number> = {};
    if (userId) {
      const completions = await prisma.progress.groupBy({
        by: ['courseId'],
        where: { userId, status: 'COMPLETED' },
        _count: { lessonId: true },
      });
      completions.forEach((c: { courseId: string; _count: { lessonId: number } }) => { completionMap[c.courseId] = (c._count as { lessonId: number }).lessonId; });
    }

    const data = courses.map((c: (typeof courses)[0]) => ({
      id: c.id, slug: c.slug, title: c.title, titleId: c.titleId,
      description: c.description, phase: c.phase, week: c.week, order: c.order,
      isPublished: c.isPublished, isPremium: c.isPremium,
      lessonCount: c._count.lessons,
      completedCount: completionMap[c.id] ?? 0,
    }));

    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// GET /v1/courses/:slug
router.get('/:slug', optionalAuth, async (req, res, next) => {
  try {
    const course = await prisma.course.findUnique({
      where: { slug: req.params.slug },
      include: {
        lessons: {
          where: { isPublished: true },
          orderBy: { order: 'asc' },
          select: {
            id: true, slug: true, title: true, titleId: true,
            type: true, dayNumber: true, order: true, xpReward: true,
          },
        },
      },
    });

    if (!course?.isPublished) throw new AppError(404, 'NOT_FOUND', 'Kursus tidak ditemukan');

    res.json({ success: true, data: course });
  } catch (err) { next(err); }
});

// GET /v1/courses/:slug/lessons/:lessonId
router.get('/:slug/lessons/:lessonId', optionalAuth, async (req, res, next) => {
  try {
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: req.params.lessonId,
        course: { slug: req.params.slug },
        isPublished: true,
      },
      include: {
        quiz: {
          select: { id: true, title: true, timeLimit: true, passingScore: true,
            questions: {
              orderBy: { order: 'asc' },
              select: {
                id: true, text: true, type: true, order: true, explanation: true,
                options: true, // isCorrect stripped server-side below
              },
            },
          },
        },
        exercises: {
          orderBy: { order: 'asc' },
          select: { id: true, title: true, description: true, starterCode: true, hints: true, xpReward: true, testCases: true },
        },
        course: { select: { id: true, slug: true, title: true } },
      },
    });

    if (!lesson) throw new AppError(404, 'NOT_FOUND', 'Pelajaran tidak ditemukan');

    // Strip isCorrect from options (students don't get answers upfront)
    if (lesson.quiz) {
      lesson.quiz.questions = lesson.quiz.questions.map((q: (typeof lesson.quiz.questions)[0]) => ({
        ...q,
        options: (q.options as any[]).map(({ isCorrect: _ic, ...opt }: { isCorrect: boolean; id: string; text: string }) => opt),
      }));
    }

    res.json({ success: true, data: lesson });
  } catch (err) { next(err); }
});

export default router;
