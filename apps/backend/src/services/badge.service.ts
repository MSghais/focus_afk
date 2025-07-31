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

  // Award a specific badge to a user
  async awardBadge(userId: string, badgeType: string, metadata?: any) {
    // Check if badge already awarded
    const existing = await this.prisma.badge.findFirst({
      where: {
        userId,
        type: badgeType,
      },
    });
    
    if (existing) return existing;

    // Define badge configurations
    const badgeConfigs: Record<string, { name: string; description: string; icon: string }> = {
      'focus_5min': {
        name: 'Focused Beginner',
        description: 'Complete 5 minutes of focused work',
        icon: '🎯'
      },
      'focus_15min': {
        name: 'Focused Warrior',
        description: 'Complete 15 minutes of focused work',
        icon: '⚔️'
      },
      'focus_30min': {
        name: 'Deep Diver',
        description: 'Complete 30 minutes of focused work',
        icon: '🌊'
      },
      'focus_1hour': {
        name: 'Legendary Focus',
        description: 'Complete 1 hour of focused work',
        icon: '👑'
      },
      'deep_5min': {
        name: 'Deep Initiate',
        description: 'Complete 5 minutes of deep work',
        icon: '🔮'
      },
      'deep_15min': {
        name: 'Deep Explorer',
        description: 'Complete 15 minutes of deep work',
        icon: '⚡'
      },
      'deep_30min': {
        name: 'Deep Master',
        description: 'Complete 30 minutes of deep work',
        icon: '🌟'
      },
      'deep_1hour': {
        name: 'Deep Legend',
        description: 'Complete 1 hour of deep work',
        icon: '💎'
      },
      'break_5min': {
        name: 'Restful Soul',
        description: 'Take a 5-minute restorative break',
        icon: '🛡️'
      },
      'break_15min': {
        name: 'Wellness Warrior',
        description: 'Take a 15-minute restorative break',
        icon: '🧘'
      }
    };

    const config = badgeConfigs[badgeType];
    if (!config) {
      throw new Error(`Unknown badge type: ${badgeType}`);
    }

    // Award badge
    return await this.prisma.badge.create({
      data: {
        userId,
        type: badgeType,
        name: config.name,
        description: config.description,
        icon: config.icon,
        dateAwarded: new Date(),
        meta: metadata
      },
    });
  }

  // Add more badge logic here (streaks, quests, etc.)
} 