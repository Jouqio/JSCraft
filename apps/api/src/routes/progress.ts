import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { progressService } from '../services/progressService.js';
import { streakService } from '../services/streakService.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// All progress routes require auth
router.use(authenticate);

// GET /v1/progress
router.get('/', async (req, res, next) => {
  try {
    const data = await progressService.getUserProgress((req as any).userId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// GET /v1/progress/streak
router.get('/streak', async (req, res, next) => {
  try {
    const streak = await streakService.getStreakInfo((req as any).userId);
    res.json({ success: true, data: streak });
  } catch (err) { next(err); }
});

// POST /v1/progress/:lessonId/start
router.post('/:lessonId/start', async (req, res, next) => {
  try {
    await progressService.startLesson((req as any).userId, req.params.lessonId);
    res.json({ success: true, data: { message: 'Lesson dimulai' } });
  } catch (err) { next(err); }
});

// POST /v1/progress/:lessonId/complete
router.post('/:lessonId/complete', async (req, res, next) => {
  try {
    const result = await progressService.completeLesson((req as any).userId, req.params.lessonId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

export default router;
