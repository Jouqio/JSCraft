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
      completions.forEach((c: { courseId: string; _count: { lessonId: number } }) => {
        completionMap[c.courseId] = (c._count as { lessonId: number }).lessonId;
      });
    }

    const data = courses.map((c: (typeof courses)[0]) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      titleId: c.titleId,
      description: c.description,
      phase: c.phase,
      week: c.week,
      order: c.order,
      isPublished: c.isPublished,
      isPremium: c.isPremium,
      lessonCount: c._count.lessons,
      completedCount: completionMap[c.id] ?? 0,
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /v1/courses/:slug
router.get('/:slug', optionalAuth, async (req, res, next) => {
  try {
    const course = await prisma.course.findUnique({
      where: { slug: req.params.slug },
      select: {
        id: true,
        slug: true,
        title: true,
        titleId: true,
        description: true,
        descriptionId: true,
        phase: true,
        week: true,
        order: true,
        isPublished: true,
        isPremium: true,
        thumbnailUrl: true,
        createdAt: true,
        updatedAt: true,
        lessons: {
          where: { isPublished: true },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            slug: true,
            title: true,
            titleId: true,
            type: true,
            dayNumber: true,
            order: true,
            xpReward: true,
          },
        },
      },
    });

    if (!course?.isPublished) throw new AppError(404, 'NOT_FOUND', 'Kursus tidak ditemukan');

    res.json({ success: true, data: course });
  } catch (err) {
    next(err);
  }
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
      select: {
        id: true,
        courseId: true,
        slug: true,
        title: true,
        titleId: true,
        type: true,
        dayNumber: true,
        order: true,
        xpReward: true,
        content: true,
        starterCode: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
            isPremium: true,
          },
        },
        quiz: {
          select: {
            id: true,
            title: true,
            timeLimit: true,
            passingScore: true,
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
        },
        exercises: {
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
        },
      },
    });

    if (!lesson) throw new AppError(404, 'NOT_FOUND', 'Pelajaran tidak ditemukan');

    // D.11: Kursus isPremium butuh login (wajib login)
    if (lesson.course.isPremium && !(req as any).userId) {
      throw new AppError(401, 'UNAUTHORIZED', 'Pelajaran ini membutuhkan login untuk diakses');
    }

    // Whitelist serializer untuk kuis dan latihan (mencegah kebocoran kunci jawaban/solusi)
    const sanitizedQuiz = lesson.quiz
      ? {
          id: lesson.quiz.id,
          title: lesson.quiz.title,
          timeLimit: lesson.quiz.timeLimit,
          passingScore: lesson.quiz.passingScore,
          questions: lesson.quiz.questions.map((q: (typeof lesson.quiz.questions)[0]) => ({
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
        }
      : null;

    const sanitizedExercises = lesson.exercises.map((ex: (typeof lesson.exercises)[0]) => ({
      id: ex.id,
      title: ex.title,
      description: ex.description,
      starterCode: ex.starterCode,
      hints: ex.hints,
      xpReward: ex.xpReward,
      testCases: Array.isArray(ex.testCases)
        ? (ex.testCases as any[])
            .filter((tc) => !tc.hidden && !tc.isHidden)
            .map((tc) => ({
              description: String(tc.description ?? ''),
              expectedOutput: String(tc.expectedOutput ?? ''),
              ...(tc.input !== undefined ? { input: String(tc.input) } : {}),
            }))
        : [],
    }));

    const responseData = {
      id: lesson.id,
      courseId: lesson.courseId,
      slug: lesson.slug,
      title: lesson.title,
      titleId: lesson.titleId,
      type: lesson.type,
      dayNumber: lesson.dayNumber,
      order: lesson.order,
      xpReward: lesson.xpReward,
      content: lesson.content,
      starterCode: lesson.starterCode,
      isPublished: lesson.isPublished,
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
      course: {
        id: lesson.course.id,
        slug: lesson.course.slug,
        title: lesson.course.title,
      },
      quiz: sanitizedQuiz,
      exercises: sanitizedExercises,
    };

    res.json({ success: true, data: responseData });
  } catch (err) {
    next(err);
  }
});

export default router;
