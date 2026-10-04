import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../config/database.js';
import { AppError } from './errorHandler.js';

export interface AuthenticatedRequest extends Request {
  userId: string;
  userRole: 'STUDENT' | 'ADMIN';
}

interface JWTPayload {
  sub: string; // user id
  role: 'STUDENT' | 'ADMIN';
  iat: number;
  exp: number;
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(401, 'UNAUTHORIZED', 'Token tidak ditemukan');
    }

    const token = authHeader.slice(7);
    let payload: JWTPayload;

    try {
      payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
        algorithms: ['HS256'],
        issuer: 'jscraft-api',
        audience: 'jscraft-app',
      }) as JWTPayload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new AppError(401, 'TOKEN_EXPIRED', 'Token sudah kadaluarsa');
      }
      throw new AppError(401, 'INVALID_TOKEN', 'Token tidak valid');
    }

    // Verify user still exists in DB and is active (deactivation check)
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, isActive: true },
    });

    if (!user) {
      throw new AppError(401, 'USER_NOT_FOUND', 'Akun tidak ditemukan');
    }

    if (!user.isActive) {
      throw new AppError(
        401,
        'ACCOUNT_DEACTIVATED',
        'Akun telah dinonaktifkan. Silakan hubungi administrator.'
      );
    }

    // Attach to request
    (req as AuthenticatedRequest).userId = user.id;
    (req as AuthenticatedRequest).userRole = user.role;
    next();
  } catch (err) {
    next(err);
  }
};

export const requireAdmin = (req: Request, _res: Response, next: NextFunction): void => {
  const { userRole } = req as AuthenticatedRequest;
  if (userRole !== 'ADMIN') {
    next(new AppError(403, 'FORBIDDEN', 'Akses ditolak. Hanya admin.'));
    return;
  }
  next();
};

/** Optional auth — attaches user info if valid token present, otherwise treats as anonymous guest */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }

  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256'],
      issuer: 'jscraft-api',
      audience: 'jscraft-app',
    }) as JWTPayload;

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, isActive: true },
    });

    if (user && user.isActive) {
      (req as AuthenticatedRequest).userId = user.id;
      (req as AuthenticatedRequest).userRole = user.role;
    }
  } catch {
    // Expired, invalid, or malformed tokens in optional auth routes are treated as anonymous guest without error
  }

  next();
};
