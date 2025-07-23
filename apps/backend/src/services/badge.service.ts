import { PrismaClient } from '@prisma/client';

export class BadgeService {
  constructor(private prisma: PrismaClient) {}

  // Award a badge to a user if not already awarded for the day/type
  async awardDailyConnectionBadge(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Check if badge already awarded today
    const existing = await this.prisma.badge.findFirst({
      where: {
        userId,
        type: 'daily_connection',
        dateAwarded: {
          gte: today,
          lt: tomorrow,
        },
      },
    });
    if (existing) return existing;

    // Award badge
    return await this.prisma.badge.create({
      data: {
        userId,
        type: 'daily_connection',
        name: 'Daily Connection',
        description: 'Logged in today',
        icon: '🔥',
        dateAwarded: new Date(),
      },
    });
  }

  // Get all badges for a user
  async getUserBadges(userId: string) {
    return this.prisma.badge.findMany({
      where: { userId },
      orderBy: { dateAwarded: 'desc' },
    });
  }

  // Add more badge logic here (streaks, quests, etc.)
} 