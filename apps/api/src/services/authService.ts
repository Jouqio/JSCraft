import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/database.js';
import type { Prisma } from '@prisma/client';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';

interface RegisterData {
  email: string;
  username: string;
  password: string;
  displayName?: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface JWTPayload {
  sub: string;
  role: 'STUDENT' | 'ADMIN';
}

const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

// Precomputed dummy bcrypt hash with identical cost factor to equalize login response timing
const DUMMY_HASH = bcrypt.hashSync('jscraft_dummy_password_timing_mitigation', env.BCRYPT_ROUNDS);

export const authService = {
  async register(data: RegisterData) {
    const { email, username, password, displayName } = data;

    // Check uniqueness
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
      select: { email: true, username: true },
    });

    if (existing?.email === email) {
      // Simulate bcrypt comparison to equalize timing and avoid user enumeration
      await bcrypt.compare(password, DUMMY_HASH);
      throw new AppError(
        400,
        'REGISTRATION_FAILED',
        'Pendaftaran tidak dapat diproses. Silakan periksa kembali data Anda atau masuk jika sudah terdaftar.'
      );
    }
    if (existing?.username === username) {
      throw new AppError(409, 'USERNAME_TAKEN', 'Username sudah dipakai');
    }

    const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: { email, username, passwordHash, displayName: displayName ?? username },
      select: userPublicSelect,
    });

    return user;
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { ...userPublicSelect, passwordHash: true, isActive: true },
    });

    if (!user) {
      // Timing attack mitigation: always run bcrypt.compare even if user does not exist
      await bcrypt.compare(password, DUMMY_HASH);
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Email atau password salah');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Email atau password salah');
    }

    if (!user.isActive) {
      throw new AppError(401, 'ACCOUNT_DEACTIVATED', 'Akun telah dinonaktifkan. Silakan hubungi administrator.');
    }

    // Update last active
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    const { passwordHash: _, ...publicUser } = user;
    return publicUser;
  },

  generateTokenPair(userId: string, role: 'STUDENT' | 'ADMIN'): TokenPair {
    const payload: JWTPayload = { sub: userId, role };

    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      algorithm: 'HS256',
      issuer: 'jscraft-api',
      audience: 'jscraft-app',
      expiresIn: env.JWT_ACCESS_EXPIRES as jwt.SignOptions['expiresIn'],
    });

    const refreshToken = uuidv4(); // opaque raw token returned to client (stored as SHA-256 hash in DB)
    return { accessToken, refreshToken };
  },

  async saveRefreshToken(
    userId: string,
    refreshToken: string,
    userAgent?: string,
    ipAddress?: string,
    familyId?: string
  ) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7d
    const tokenHash = hashToken(refreshToken);
    const sessionFamily = familyId ?? uuidv4();

    await prisma.session.create({
      data: {
        userId,
        refreshToken: tokenHash,
        familyId: sessionFamily,
        expiresAt,
        userAgent,
        ipAddress,
        isRevoked: false,
      },
    });
  },

  /**
   * Atomic token rotation within a single transaction:
   * 1. Claims the old token atomically (where isRevoked=false and expiresAt > now).
   * 2. Checks if user is still active (if inactive, revokes all user sessions).
   * 3. Creates new session inheriting the same familyId.
   * 4. If claim failed:
   *    - If within grace window (e.g. 15s): rejects with 401 SESSION_ROTATED without revoking family.
   *    - If outside grace window: detects token reuse and revokes ONLY the compromised family.
   */
  async rotateRefreshToken(oldToken: string) {
    const oldTokenHash = hashToken(oldToken);
    const now = new Date();

    // 1. Atomic claim and new session creation within one transaction
    const rotationResult = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const claim = await tx.session.updateMany({
        where: {
          refreshToken: oldTokenHash,
          isRevoked: false,
          expiresAt: { gt: now },
        },
        data: {
          isRevoked: true,
          revokedAt: now,
        },
      });

      if (claim.count === 1) {
        const session = await tx.session.findUnique({
          where: { refreshToken: oldTokenHash },
          include: { user: { select: { ...userPublicSelect, isActive: true } } },
        });

        if (!session) {
          return { status: 'INVALID_SESSION' as const };
        }

        if (!session.user.isActive) {
          await tx.session.updateMany({
            where: { userId: session.user.id },
            data: { isRevoked: true, revokedAt: now },
          });
          return { status: 'ACCOUNT_DEACTIVATED' as const };
        }

        // Issue new token pair
        const newTokens = this.generateTokenPair(session.user.id, session.user.role);

        // Save new session in the SAME family within the same transaction
        await tx.session.create({
          data: {
            userId: session.user.id,
            refreshToken: hashToken(newTokens.refreshToken),
            familyId: session.familyId, // Inherits familyId
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            isRevoked: false,
          },
        });

        const { isActive: _isActive, ...publicUser } = session.user;
        return { status: 'SUCCESS' as const, user: publicUser, tokens: newTokens };
      }

      return { status: 'CLAIM_FAILED' as const };
    });

    if (rotationResult.status === 'SUCCESS') {
      return { user: rotationResult.user, tokens: rotationResult.tokens };
    }

    if (rotationResult.status === 'ACCOUNT_DEACTIVATED') {
      throw new AppError(401, 'ACCOUNT_DEACTIVATED', 'Akun telah dinonaktifkan. Silakan hubungi administrator.');
    }

    if (rotationResult.status === 'INVALID_SESSION') {
      throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Sesi tidak valid.');
    }

    // Claim failed: investigate reason outside transaction
    const existingSession = await prisma.session.findUnique({
      where: { refreshToken: oldTokenHash },
      select: {
        id: true,
        userId: true,
        familyId: true,
        isRevoked: true,
        revokedAt: true,
        expiresAt: true,
        user: { select: { isActive: true } },
      },
    });

    if (!existingSession) {
      throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Sesi tidak valid. Silakan login ulang.');
    }

    if (!existingSession.user.isActive) {
      await prisma.session.updateMany({
        where: { userId: existingSession.userId },
        data: { isRevoked: true, revokedAt: now },
      });
      throw new AppError(401, 'ACCOUNT_DEACTIVATED', 'Akun telah dinonaktifkan. Silakan hubungi administrator.');
    }

    if (existingSession.expiresAt <= now) {
      throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Sesi telah kadaluarsa. Silakan login ulang.');
    }

    // Token was already revoked: check grace window for concurrent requests (e.g. StrictMode, 2 tabs)
    const graceMs = (env.REFRESH_TOKEN_GRACE_SECONDS ?? 15) * 1000;
    const isWithinGrace =
      existingSession.revokedAt &&
      now.getTime() - existingSession.revokedAt.getTime() <= graceMs;

    if (isWithinGrace) {
      // Within grace window: reject without revoking family
      throw new AppError(
        401,
        'SESSION_ROTATED',
        'Sesi telah dirotasi. Silakan gunakan token terbaru.'
      );
    }

    // Outside grace window: TOKEN REUSE DETECTED!
    // Revoke ONLY the compromised family (all sessions sharing the same familyId)
    await prisma.session.deleteMany({ where: { familyId: existingSession.familyId } });
    throw new AppError(
      401,
      'TOKEN_REUSED',
      'Sesi tidak valid terdeteksi. Sesi perangkat ini telah dicabut demi keamanan.'
    );
  },

  /** Revoke a single refresh token (e.g. user logs out of current tab/device) */
  async revokeRefreshToken(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    await prisma.session.deleteMany({ where: { refreshToken: tokenHash } });
  },

  /**
   * Revoke ONLY the compromised session family (token reuse outside grace window).
   * Other devices/families belonging to the same user remain unaffected.
   */
  async revokeFamily(familyId: string) {
    await prisma.session.deleteMany({ where: { familyId } });
  },

  /**
   * Revoke ALL sessions across all families for a given user.
   * Strictly used for:
   * 1. User deactivation (admin or inactive user refresh)
   * 2. Password change
   * 3. Password reset
   */
  async revokeAllSessions(userId: string) {
    const now = new Date();
    await prisma.session.updateMany({
      where: { userId },
      data: { isRevoked: true, revokedAt: now },
    });
  },

  /**
   * Password change helper: updates password and revokes all active sessions across all devices/families.
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });
    if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User tidak ditemukan');

    const valid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!valid) throw new AppError(401, 'INVALID_CREDENTIALS', 'Password saat ini salah');

    const newPasswordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Revoke all sessions across all families upon password change
    await this.revokeAllSessions(userId);
  },

  /**
   * Scheduled cron job: cleans up expired sessions (expiresAt < now)
   * and old revoked sessions (revokedAt > 24 hours ago).
   */
  async cleanupExpiredSessions(): Promise<number> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const now = new Date();

    const { count } = await prisma.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: now } },
          { isRevoked: true, revokedAt: { lt: oneDayAgo } },
        ],
      },
    });

    return count;
  },

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: userPublicSelect,
    });
    if (!user) throw new AppError(404, 'NOT_FOUND', 'User tidak ditemukan');
    return user;
  },
};

// Fields returned to client — never include passwordHash
const userPublicSelect = {
  id: true,
  email: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  role: true,
  xpTotal: true,
  level: true,
  streakCurrent: true,
  streakMax: true,
  lastActiveAt: true,
  createdAt: true,
} as const;
