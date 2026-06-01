import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // ── Zod validation error ──────────────────────────────────
  if (err instanceof ZodError) {
    const details: Record<string, string[]> = {};
    err.errors.forEach((e) => {
      const key = e.path.join('.');
      if (!details[key]) details[key] = [];
      details[key].push(e.message);
    });
    res.status(422).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Input tidak valid', details },
    });
    return;
  }

  // ── App-level errors ──────────────────────────────────────
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  // ── Prisma errors ─────────────────────────────────────────
  if (err instanceof Error && err.constructor.name.startsWith('Prisma')) {
    const code = (err as unknown as Record<string, unknown>)['code'] as string | undefined;
    if (code === 'P2002') {
      res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_ENTRY', message: 'Data sudah ada' },
      });
      return;
    }
    if (code === 'P2025') {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Data tidak ditemukan' },
      });
      return;
    }
  }

  // ── Unknown errors ────────────────────────────────────────
  const message = err instanceof Error ? err.message : 'Internal server error';
  if (env.NODE_ENV !== 'production') {
    console.error('Unhandled error:', err);
  }

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: env.NODE_ENV === 'production' ? 'Terjadi kesalahan server' : message,
    },
  });
};
