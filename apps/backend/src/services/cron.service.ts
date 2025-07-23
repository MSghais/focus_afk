import { PrismaClient } from '@prisma/client';
import { BadgeService } from './badge.service';

export class CronService {
  constructor(private prisma: PrismaClient) {}

  // Award daily connection badges to all users who have logged in today
  async awardDailyConnectionBadgesForAllUsers() {
    const badgeService = new BadgeService(this.prisma);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Find all users with a session created today
    const sessions = await this.prisma.session.findMany({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
        isActive: true,
      },
      select: { userId: true },
    });
    const userIds = Array.from(new Set(sessions.map(s => s.userId)));
    for (const userId of userIds) {
      await badgeService.awardDailyConnectionBadge(userId);
    }
    return { awarded: userIds.length };
  }
} 