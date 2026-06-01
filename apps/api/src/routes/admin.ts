import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();
router.use(authenticate, requireAdmin);

// GET /v1/admin/stats
router.get('/stats', async (_req, res, next) => {
  try {
    const [totalUsers, totalLessons, totalCompleted] = await Promise.all([
      prisma.user.count(),
      prisma.lesson.count({ where: { isPublished: true } }),
      prisma.progress.count({ where: { status: 'COMPLETED' } }),
    ]);
    const activeToday = await prisma.user.count({
      where: { lastActiveAt: { gte: new Date(Date.now() - 86400000) } },
    });
    res.json({ success: true, data: { totalUsers, totalLessons, totalCompleted, activeToday } });
  } catch (err) { next(err); }
});

// GET /v1/admin/users
router.get('/users', async (req, res, next) => {
  try {
    const page = parseInt(req.query['page'] as string ?? '1');
    const perPage = 20;
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip: (page - 1) * perPage, take: perPage,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, username: true, displayName: true, role: true, xpTotal: true, level: true, isActive: true, createdAt: true },
      }),
      prisma.user.count(),
    ]);
    res.json({ success: true, data: { items: users, total, page, perPage, totalPages: Math.ceil(total / perPage) } });
  } catch (err) { next(err); }
});

// POST /v1/admin/courses
router.post('/courses', validateBody(z.object({
  slug: z.string(), title: z.string(), titleId: z.string(),
  description: z.string(), phase: z.number().int(), week: z.number().int(), order: z.number().int(),
  isPremium: z.boolean().default(false),
})), async (req, res, next) => {
  try {
    const course = await prisma.course.create({ data: req.body });
    res.status(201).json({ success: true, data: course });
  } catch (err) { next(err); }
});

// PATCH /v1/admin/courses/:id
router.patch('/courses/:id', async (req, res, next) => {
  try {
    const course = await prisma.course.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: course });
  } catch (err) { next(err); }
});

// POST /v1/admin/lessons
router.post('/lessons', validateBody(z.object({
  courseId: z.string(), slug: z.string(), title: z.string(), titleId: z.string(),
  type: z.enum(['THEORY', 'PRACTICE', 'PROJECT']), dayNumber: z.number().int(),
  order: z.number().int(), xpReward: z.number().int().default(10),
  content: z.record(z.any()), starterCode: z.string().optional(), solutionCode: z.string().optional(),
})), async (req, res, next) => {
  try {
    const lesson = await prisma.lesson.create({ data: req.body });
    res.status(201).json({ success: true, data: lesson });
  } catch (err) { next(err); }
});

// PATCH /v1/admin/lessons/:id
router.patch('/lessons/:id', async (req, res, next) => {
  try {
    const lesson = await prisma.lesson.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: lesson });
  } catch (err) { next(err); }
});

// PATCH /v1/admin/users/:id
router.patch('/users/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id }, data: req.body,
      select: { id: true, email: true, username: true, role: true, isActive: true },
    });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

export default router;
