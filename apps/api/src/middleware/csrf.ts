import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { AppError } from './errorHandler.js';

export function getAllowedOrigins(): string[] {
  const origins = new Set<string>();
  try {
    origins.add(new URL(env.FRONTEND_URL).origin);
  } catch {
    // fallback if FRONTEND_URL fails parsing
  }

  if (env.ALLOWED_ORIGINS) {
    env.ALLOWED_ORIGINS.split(',').forEach((item) => {
      const trimmed = item.trim();
      if (!trimmed) return;
      try {
        origins.add(new URL(trimmed).origin);
      } catch {
        origins.add(trimmed);
      }
    });
  }

  return Array.from(origins);
}

export const csrfOriginCheck = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const allowed = getAllowedOrigins();

  let requestOrigin = req.headers.origin;

  // Use Referer only if Origin is absent
  if (!requestOrigin && req.headers.referer) {
    try {
      requestOrigin = new URL(req.headers.referer).origin;
    } catch {
      requestOrigin = undefined;
    }
  }

  if (!requestOrigin || !allowed.includes(requestOrigin)) {
    throw new AppError(403, 'FORBIDDEN_ORIGIN', 'Akses ditolak: Origin tidak diizinkan');
  }

  next();
};
