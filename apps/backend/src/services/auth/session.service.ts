import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { config } from '../../config';

export class SessionService {
  constructor(private prisma: PrismaClient) {}

  async createSession(userId: string, userAgent?: string, ipAddress?: string) {
    const accessToken = jwt.sign(
      { id: userId },
      config.jwt.secret,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: userId, type: 'refresh' },
      config.jwt.secret,
      { expiresIn: '7d' }
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const session = await this.prisma.session.create({
      data: {
        userId,
        token: accessToken,
        refreshToken,
        expiresAt,
        userAgent,
        ipAddress,
      },
    });

    return {
      accessToken,
      refreshToken,
      session,
    };
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.secret) as any;
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      const session = await this.prisma.session.findFirst({
        where: {
          refreshToken,
          isActive: true,
          expiresAt: { gt: new Date() },
        },
      });

      if (!session) {
        throw new Error('Session not found or expired');
      }

      // Create new access token
      const newAccessToken = jwt.sign(
        { id: decoded.id },
        config.jwt.secret,
        { expiresIn: '15m' }
      );

      // Update session with new access token
      await this.prisma.session.update({
        where: { id: session.id },
        data: { token: newAccessToken },
      });

      return { accessToken: newAccessToken };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async revokeSession(sessionId: string, userId: string) {
    await this.prisma.session.updateMany({
      where: {
        id: sessionId,
        userId,
      },
      data: {
        isActive: false,
      },
    });
  }

  async revokeAllUserSessions(userId: string) {
    await this.prisma.session.updateMany({
      where: {
        userId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });
  }

  async getActiveSessions(userId: string) {
    return await this.prisma.session.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cleanupExpiredSessions() {
    await this.prisma.session.updateMany({
      where: {
        expiresAt: { lt: new Date() },
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });
  }
}