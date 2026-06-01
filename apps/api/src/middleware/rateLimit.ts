import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

// General rate limit: 100 req/15min per IP
export const globalRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max:      env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Terlalu banyak permintaan. Coba lagi nanti.' } },
  skip: (req) => req.path === '/health',
});

// Strict limit for auth routes: 10 req/15min per IP
export const authRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'AUTH_RATE_LIMITED', message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' } },
});

// AI routes: 30 req/15min
export const aiRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'AI_RATE_LIMITED', message: 'Batas penggunaan AI tercapai. Coba lagi nanti.' } },
});
