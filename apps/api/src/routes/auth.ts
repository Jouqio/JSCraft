import { Router } from 'express';
import { z } from 'zod';
import { authService } from '../services/authService.js';
import { authenticate } from '../middleware/auth.js';
import { authRateLimit } from '../middleware/rateLimit.js';
import { validateBody } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

const registerSchema = z.object({
  email:       z.string().email(),
  username:    z.string().min(3).max(20).regex(/^[a-z0-9_-]+$/),
  password:    z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  displayName: z.string().min(2).max(50).optional(),
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

// POST /v1/auth/register
router.post('/register', authRateLimit, validateBody(registerSchema), async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    const { accessToken, refreshToken } = authService.generateTokenPair(user.id, user.role);
    await authService.saveRefreshToken(user.id, refreshToken, req.headers['user-agent'], req.ip);

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ success: true, data: { user, accessToken } });
  } catch (err) { next(err); }
});

// POST /v1/auth/login
router.post('/login', authRateLimit, validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const user = await authService.login(email, password);
    const { accessToken, refreshToken } = authService.generateTokenPair(user.id, user.role);
    await authService.saveRefreshToken(user.id, refreshToken, req.headers['user-agent'], req.ip);

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, data: { user, accessToken } });
  } catch (err) { next(err); }
});

// POST /v1/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies['refresh_token'] as string | undefined;
    if (!token) throw new AppError(401, 'NO_REFRESH_TOKEN', 'Tidak ada refresh token');

    const { user, tokens } = await authService.rotateRefreshToken(token);

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, data: { user, accessToken: tokens.accessToken } });
  } catch (err) { next(err); }
});

// POST /v1/auth/logout
router.post('/logout', async (req, res, next) => {
  try {
    const token = req.cookies['refresh_token'] as string | undefined;
    if (token) await authService.revokeRefreshToken(token);
    res.clearCookie('refresh_token');
    res.json({ success: true, data: { message: 'Berhasil logout' } });
  } catch (err) { next(err); }
});

// GET /v1/auth/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await authService.getUserById((req as any).userId);
    res.json({ success: true, data: { user } });
  } catch (err) { next(err); }
});

export default router;

// POST /v1/auth/forgot-password
router.post('/forgot-password', authRateLimit, validateBody(z.object({
  email: z.string().email(),
})), async (req, res, next) => {
  try {
    const { email } = req.body as { email: string };
    const { prisma: db2 } = await import('../config/database.js');
    const user = await db2.user.findUnique({ where: { email }, select: { id: true, email: true, displayName: true } });

    // Always return 200 to prevent email enumeration
    if (user) {
      const { randomToken } = await import('../utils/crypto.js');
      const { emailService } = await import('../services/emailService.js');
      const { env } = await import('../config/env.js');
      const { prisma: db } = await import('../config/database.js');

      const token     = randomToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.passwordReset.create({ data: { userId: user.id, token, expiresAt } });

      const resetLink = `${env.FRONTEND_URL}/reset-password?token=${token}`;
      await emailService.sendPasswordReset(user.email, resetLink);
    }

    res.json({ success: true, data: { message: 'Jika email terdaftar, link reset telah dikirim.' } });
  } catch (err) { next(err); }
});

// POST /v1/auth/reset-password
router.post('/reset-password', authRateLimit, validateBody(z.object({
  token:    z.string().min(1),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
})), async (req, res, next) => {
  try {
    const { token, password } = req.body as { token: string; password: string };
    const { prisma: db } = await import('../config/database.js');
    const bcrypt         = await import('bcryptjs');
    const { env }        = await import('../config/env.js');

    const reset = await db.passwordReset.findUnique({ where: { token } });

    if (!reset || reset.expiresAt < new Date() || reset.usedAt) {
      throw new AppError(400, 'INVALID_RESET_TOKEN', 'Token tidak valid atau sudah kadaluarsa');
    }

    const passwordHash = await bcrypt.default.hash(password, env.BCRYPT_ROUNDS);

    await db.$transaction([
      db.user.update({ where: { id: reset.userId }, data: { passwordHash } }),
      db.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
      db.session.deleteMany({ where: { userId: reset.userId } }), // revoke all sessions
    ]);

    res.json({ success: true, data: { message: 'Password berhasil direset.' } });
  } catch (err) { next(err); }
});
