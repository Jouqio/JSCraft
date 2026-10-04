import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// All bookmark routes require auth; every query is scoped to req.userId
router.use(authenticate);

const idSchema = z.string().min(1).max(100);

function parseLessonId(raw: string): string {
  const parsed = idSchema.safeParse(raw);
  if (!parsed.success) throw new AppError(404, 'NOT_FOUND', 'Pelajaran tidak ditemukan');
  return parsed.data;
}

// GET /v1/bookmarks
router.get('/', async (req, res, next) => {
  try {
    const userId = (req as any).userId as string;

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId, lesson: { isPublished: true } },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        lessonId: true,
        createdAt: true,
        lesson: {
          select: {
            id: true,
            slug: true,
            title: true,
            titleId: true,
            dayNumber: true,
            course: { select: { slug: true, title: true, titleId: true } },
          },
        },
      },
    });

    res.json({ success: true, data: bookmarks });
  } catch (err) {
    next(err);
  }
});

// PUT /v1/bookmarks/:lessonId (idempotent)
router.put('/:lessonId', async (req, res, next) => {
  try {
    const userId = (req as any).userId as string;
    const lessonId = parseLessonId(req.params.lessonId);

    const lesson = await prisma.lesson.findFirst({
      where: { id: lessonId, isPublished: true },
      select: { id: true },
    });
    if (!lesson) throw new AppError(404, 'NOT_FOUND', 'Pelajaran tidak ditemukan');

    const bookmark = await prisma.bookmark.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: {},
      create: { userId, lessonId },
      select: { lessonId: true, createdAt: true },
    });

    res.json({ success: true, data: bookmark });
  } catch (err) {
    next(err);
  }
});

// DELETE /v1/bookmarks/:lessonId (idempotent)
router.delete('/:lessonId', async (req, res, next) => {
  try {
    const userId = (req as any).userId as string;
    const lessonId = parseLessonId(req.params.lessonId);

    await prisma.bookmark.deleteMany({ where: { userId, lessonId } });
    res.json({ success: true, data: { lessonId } });
  } catch (err) {
    next(err);
  }
});

export default router;
