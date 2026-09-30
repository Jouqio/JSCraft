import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

// General rate limit: 100 req/15min per IP
export const globalRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Terlalu banyak permintaan. Coba lagi nanti.' },
  },
  skip: (req) => req.path === '/health',
});

// Login route limit (per IP): 200 failed attempts per 15 min per IP (mitigates distributed credential stuffing)
export const loginIpRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: 200,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMITED',
      message: 'Terlalu banyak percobaan login gagal dari IP ini. Coba lagi dalam 15 menit.',
    },
  },
});

/**
 * Normalizes email for rate limiting key generation:
 * trims whitespace, converts to lowercase, and clamps length to max 254 characters (RFC 5321).
 */
export function normalizeEmailForRateLimit(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.trim().toLowerCase().slice(0, 254);
}

// Login route limit (per IP+email): 10 failed attempts per 15 min per IP+email
// skipSuccessfulRequests is true, preventing brute-force against a specific user account
export const loginAccountRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = normalizeEmailForRateLimit(req.body?.email);
    return `${req.ip ?? 'unknown'}_${email}`;
  },
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMITED',
      message: 'Terlalu banyak percobaan login gagal untuk akun ini. Coba lagi dalam 15 menit.',
    },
  },
});

// Register route limit: 60 req per 1 hour per IP (supports shared bootcamp / classroom NAT)
export const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMITED',
      message: 'Batas pendaftaran tercapai untuk jaringan ini. Coba lagi dalam 1 jam.',
    },
  },
});

// Forgot password limit: 5 req per 1 hour per IP+email (prevents email flooding / harassment)
export const forgotPasswordRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = normalizeEmailForRateLimit(req.body?.email);
    return `${req.ip ?? 'unknown'}_${email}`;
  },
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMITED',
      message: 'Terlalu banyak permintaan reset password untuk email ini. Coba lagi dalam 1 jam.',
    },
  },
});

// Reset password limit: 10 req per 15 min per IP (strict protection against reset token brute-force)
export const resetPasswordRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMITED',
      message: 'Terlalu banyak percobaan reset password. Coba lagi dalam 15 menit.',
    },
  },
});

// General auth limit fallback: 15 req/15min per IP
export const authRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMITED',
      message: 'Terlalu banyak permintaan autentikasi. Coba lagi dalam 15 menit.',
    },
  },
});

// Refresh route limit: 120 req/15min per IP
export const refreshRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'REFRESH_RATE_LIMITED',
      message: 'Terlalu banyak permintaan refresh token. Coba lagi nanti.',
    },
  },
});

// AI routes: 30 req/15min per authenticated user (fallback to IP if anonymous)
export const aiRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = (req as any).userId as string | undefined;
    return userId ? `user_${userId}` : (req.ip ?? 'unknown');
  },
  message: {
    success: false,
    error: { code: 'AI_RATE_LIMITED', message: 'Batas penggunaan AI tercapai. Coba lagi nanti.' },
  },
});
