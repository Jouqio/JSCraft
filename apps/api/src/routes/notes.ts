import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// All note routes require auth; every query is scoped to req.userId
router.use(authenticate);

const MAX_NOTES_PER_LESSON = 50;

const idSchema = z.string().min(1).max(100);

const listQuerySchema = z.object({
  lessonId: idSchema.optional(),
});

const createSchema = z.object({
  lessonId: idSchema,
  content: z.string().trim().min(1, 'Catatan tidak boleh kosong').max(5000),
});

const updateSchema = z.object({
  content: z.string().trim().min(1, 'Catatan tidak boleh kosong').max(5000),
});

const noteSelect = {
  id: true,
  lessonId: true,
  content: true,
  createdAt: true,
  updatedAt: true,
} as const;

function parseId(raw: string): string {
  const parsed = idSchema.safeParse(raw);
  if (!parsed.success) throw new AppError(404, 'NOT_FOUND', 'Catatan tidak ditemukan');
  return parsed.data;
}

// GET /v1/notes?lessonId=...
router.get('/', validateQuery(listQuerySchema), async (req, res, next) => {
  try {
    const userId = (req as any).userId as string;
    const { lessonId } = req.query as z.infer<typeof listQuerySchema>;

    const notes = await prisma.note.findMany({
      where: { userId, ...(lessonId ? { lessonId } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: noteSelect,
    });

    res.json({ success: true, data: notes });
  } catch (err) {
    next(err);
  }
});

// POST /v1/notes
router.post('/', validateBody(createSchema), async (req, res, next) => {
  try {
    const userId = (req as any).userId as string;
    const { lessonId, content } = req.body as z.infer<typeof createSchema>;

    const lesson = await prisma.lesson.findFirst({
      where: { id: lessonId, isPublished: true },
      select: { id: true },
    });
    if (!lesson) throw new AppError(404, 'NOT_FOUND', 'Pelajaran tidak ditemukan');

    const existing = await prisma.note.count({ where: { userId, lessonId } });
    if (existing >= MAX_NOTES_PER_LESSON) {
      throw new AppError(
        400,
        'NOTE_LIMIT_REACHED',
        `Maksimal ${MAX_NOTES_PER_LESSON} catatan per pelajaran`
      );
    }

    const note = await prisma.note.create({
      data: { userId, lessonId, content },
      select: noteSelect,
    });

    res.status(201).json({ success: true, data: note });
  } catch (err) {
    next(err);
  }
});

// PATCH /v1/notes/:id
router.patch('/:id', validateBody(updateSchema), async (req, res, next) => {
  try {
    const userId = (req as any).userId as string;
    const id = parseId(req.params.id);
    const { content } = req.body as z.infer<typeof updateSchema>;

    // updateMany scoped by userId: another user's note id yields count 0 (404, no existence leak)
    const result = await prisma.note.updateMany({ where: { id, userId }, data: { content } });
    if (result.count === 0) throw new AppError(404, 'NOT_FOUND', 'Catatan tidak ditemukan');

    const note = await prisma.note.findFirst({ where: { id, userId }, select: noteSelect });
    res.json({ success: true, data: note });
  } catch (err) {
    next(err);
  }
});

// DELETE /v1/notes/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = (req as any).userId as string;
    const id = parseId(req.params.id);

    const result = await prisma.note.deleteMany({ where: { id, userId } });
    if (result.count === 0) throw new AppError(404, 'NOT_FOUND', 'Catatan tidak ditemukan');

    res.json({ success: true, data: { id } });
  } catch (err) {
    next(err);
  }
});

export default router;
