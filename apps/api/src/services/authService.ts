import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/database.js';
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

export const authService = {
  async register(data: RegisterData) {
    const { email, username, password, displayName } = data;

    // Check uniqueness
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
      select: { email: true, username: true },
    });
    if (existing?.email === email) {
      throw new AppError(409, 'EMAIL_TAKEN', 'Email sudah terdaftar');
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

    if (!user || !user.isActive) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Email atau password salah');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Email atau password salah');
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
      expiresIn: env.JWT_ACCESS_EXPIRES as jwt.SignOptions['expiresIn'],
    });

    const refreshToken = uuidv4(); // opaque token — stored in DB
    return { accessToken, refreshToken };
  },

  async saveRefreshToken(
    userId: string,
    refreshToken: string,
    userAgent?: string,
    ipAddress?: string
  ) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7d
    await prisma.session.create({
      data: { userId, refreshToken, expiresAt, userAgent, ipAddress },
    });
  },

  async rotateRefreshToken(oldToken: string) {
    const session = await prisma.session.findUnique({
      where: { refreshToken: oldToken },
      include: { user: { select: userPublicSelect } },
    });

    if (!session || session.expiresAt < new Date()) {
      // Delete expired session
      if (session) {
        await prisma.session.delete({ where: { id: session.id } });
      }
      throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Sesi tidak valid. Silakan login ulang.');
    }

    // Issue new token pair
    const newTokens = this.generateTokenPair(session.user.id, session.user.role);

    // Replace old session with new refresh token (rotation)
    await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshToken: newTokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { user: session.user, tokens: newTokens };
  },

  async revokeRefreshToken(refreshToken: string) {
    await prisma.session.deleteMany({ where: { refreshToken } });
  },

  async revokeAllSessions(userId: string) {
    await prisma.session.deleteMany({ where: { userId } });
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
