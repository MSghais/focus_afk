import { PrismaClient } from "@prisma/client";
import { ethers } from "ethers";
import { EnhancedQuestService } from "./enhancedQuestService";
import { PineconeService } from "../ai/memory/pinecone.service";
import { EnhancedContextManager } from "../ai/memory/enhancedContextManager";

export interface GamificationEvent {
  type: 'quest_completed' | 'streak_updated' | 'level_up' | 'badge_earned' | 'focus_session' | 'task_completed' | 'goal_completed';
  userId: string;
  userAddress: string;
  data: Record<string, any>;
  timestamp: Date;
  rewards?: {
    xp: number;
    tokens: number;
    badges?: string[];
  };
}

export interface UserGamificationStats {
  userId: string;
  userAddress: string;
  level: number;
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  totalFocusMinutes: number;
  completedQuests: number;
  earnedBadges: number;
  totalTokens: number;
  achievements: Achievement[];
  recentActivity: RecentActivity[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  earnedAt: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
  tokenReward: number;
}

export interface RecentActivity {
  type: string;
  description: string;
  timestamp: Date;
  xpGained: number;
  tokensGained: number;
}

export interface GamificationConfig {
  xpPerMinute: number;
  streakBonus: number;
  levelThresholds: number[];
  questRewardMultiplier: number;
  badgeRewardMultiplier: number;
  achievementRewardMultiplier: number;
}

export class EnhancedGamificationService {
  private config: GamificationConfig;
  private eventQueue: GamificationEvent[] = [];

  constructor(
    private readonly prisma: PrismaClient,
    private readonly questService: EnhancedQuestService,
    private readonly pineconeService: PineconeService,
    private readonly enhancedContextManager: EnhancedContextManager,
    private readonly rpcUrl: string,
    private readonly privateKey: string,
    private readonly focusTokenAddress: string,
    private readonly questNFTAddress: string,
    private readonly focusSBTAddress: string
  ) {
    this.config = {
      xpPerMinute: 1,
      streakBonus: 0.1, // 10% bonus per streak day
      levelThresholds: [0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000], // XP thresholds
      questRewardMultiplier: 1.5,
      badgeRewardMultiplier: 2.0,
      achievementRewardMultiplier: 3.0
    };
  }

  /**
   * Process a gamification event
   */
  async processEvent(event: GamificationEvent): Promise<void> {
    console.log(`Processing gamification event: ${event.type} for user ${event.userId}`);

    // Add to event queue
    this.eventQueue.push(event);

    // Process the event
    switch (event.type) {
      case 'quest_completed':
        await this.handleQuestCompleted(event);
        break;
      case 'streak_updated':
        await this.handleStreakUpdated(event);
        break;
      case 'level_up':
        await this.handleLevelUp(event);
        break;
      case 'badge_earned':
        await this.handleBadgeEarned(event);
        break;
      case 'focus_session':
        await this.handleFocusSession(event);
        break;
      case 'task_completed':
        await this.handleTaskCompleted(event);
        break;
      case 'goal_completed':
        await this.handleGoalCompleted(event);
        break;
    }

    // Update quest progress
    await this.questService.updateQuestProgress(event.userId);

    // Generate new quests if needed
    await this.generateNewQuestsIfNeeded(event.userId, event.userAddress);

    // Update vector embeddings
    await this.updateUserEmbeddings(event.userId);
  }

  /**
   * Handle quest completion event
   */
  private async handleQuestCompleted(event: GamificationEvent): Promise<void> {
    const { userId, userAddress, data } = event;
    
    // Calculate rewards
    const baseXp = data.rewardXp || 0;
    const baseTokens = data.rewardTokens || 0;
    
    const xpReward = Math.floor(baseXp * this.config.questRewardMultiplier);
    const tokenReward = Math.floor(baseTokens * this.config.questRewardMultiplier);

    // Update user stats
    await this.updateUserStats(userId, {
      totalXp: { increment: xpReward },
      completedQuests: { increment: 1 }
    });

    // Mint tokens
    await this.mintTokens(userAddress, tokenReward, 'quest_completion');

    // Check for level up
    await this.checkForLevelUp(userId);

    // Create achievement record
    await this.createAchievement(userId, {
      type: 'quest_completed',
      name: data.questName || 'Quest Completed',
      description: `Completed quest: ${data.questName || 'Unknown Quest'}`,
      xpReward,
      tokenReward
    });

    // Update event with rewards
    event.rewards = {
      xp: xpReward,
      tokens: tokenReward
    };
  }

  /**
   * Handle streak update event
   */
  private async handleStreakUpdated(event: GamificationEvent): Promise<void> {
    const { userId, data } = event;
    
    const newStreak = data.streak || 0;
    const previousStreak = data.previousStreak || 0;

    // Update user streak
    await this.updateUserStats(userId, {
      streak: newStreak,
      longestStreak: { increment: newStreak > previousStreak ? 1 : 0 }
    });

    // Award streak milestones
    if (newStreak >= 7 && previousStreak < 7) {
      await this.awardStreakMilestone(userId, 7);
    }
    if (newStreak >= 30 && previousStreak < 30) {
      await this.awardStreakMilestone(userId, 30);
    }
    if (newStreak >= 100 && previousStreak < 100) {
      await this.awardStreakMilestone(userId, 100);
    }
  }

  /**
   * Handle level up event
   */
  private async handleLevelUp(event: GamificationEvent): Promise<void> {
    const { userId, userAddress, data } = event;
    
    const newLevel = data.newLevel || 1;
    const previousLevel = data.previousLevel || 0;

    // Award level up rewards
    const levelUpXp = newLevel * 50;
    const levelUpTokens = newLevel * 10;

    await this.updateUserStats(userId, {
      level: newLevel,
      totalXp: { increment: levelUpXp }
    });

    await this.mintTokens(userAddress, levelUpTokens, 'level_up');

    // Create level up achievement
    await this.createAchievement(userId, {
      type: 'level_up',
      name: `Level ${newLevel} Achieved!`,
      description: `Reached level ${newLevel}`,
      xpReward: levelUpXp,
      tokenReward: levelUpTokens,
      rarity: newLevel >= 10 ? 'legendary' : newLevel >= 5 ? 'epic' : 'rare'
    });

    // Generate special level-up quests
    await this.generateLevelUpQuests(userId, newLevel);
  }

  /**
   * Handle badge earned event
   */
  private async handleBadgeEarned(event: GamificationEvent): Promise<void> {
    const { userId, userAddress, data } = event;
    
    const badgeXp = (data.badgeXp || 0) * this.config.badgeRewardMultiplier;
    const badgeTokens = (data.badgeTokens || 0) * this.config.badgeRewardMultiplier;

    await this.updateUserStats(userId, {
      totalXp: { increment: badgeXp },
      earnedBadges: { increment: 1 }
    });

    await this.mintTokens(userAddress, badgeTokens, 'badge_earned');

    // Create badge achievement
    await this.createAchievement(userId, {
      type: 'badge_earned',
      name: data.badgeName || 'Badge Earned',
      description: `Earned badge: ${data.badgeName || 'Unknown Badge'}`,
      xpReward: badgeXp,
      tokenReward: badgeTokens
    });
  }

  /**
   * Handle focus session event
   */
  private async handleFocusSession(event: GamificationEvent): Promise<void> {
    const { userId, userAddress, data } = event;
    
    const sessionMinutes = data.duration || 0;
    const streak = data.streak || 0;

    // Calculate XP and tokens
    const baseXp = sessionMinutes * this.config.xpPerMinute;
    const streakBonus = baseXp * this.config.streakBonus * streak;
    const totalXp = Math.floor(baseXp + streakBonus);

    const baseTokens = Math.floor(sessionMinutes / 10); // 1 token per 10 minutes
    const totalTokens = baseTokens + Math.floor(streakBonus / 10);

    // Update user stats
    await this.updateUserStats(userId, {
      totalXp: { increment: totalXp },
      totalFocusMinutes: { increment: sessionMinutes }
    });

    await this.mintTokens(userAddress, totalTokens, 'focus_session');

    // Check for focus milestones
    await this.checkFocusMilestones(userId, sessionMinutes);

    // Update event with rewards
    event.rewards = {
      xp: totalXp,
      tokens: totalTokens
    };
  }

  /**
   * Handle task completion event
   */
  private async handleTaskCompleted(event: GamificationEvent): Promise<void> {
    const { userId, data } = event;
    
    const taskXp = data.priority === 'high' ? 20 : data.priority === 'medium' ? 15 : 10;
    
    await this.updateUserStats(userId, {
      totalXp: { increment: taskXp }
    });

    // Check for task completion milestones
    await this.checkTaskMilestones(userId);
  }

  /**
   * Handle goal completion event
   */
  private async handleGoalCompleted(event: GamificationEvent): Promise<void> {
    const { userId, userAddress, data } = event;
    
    const goalXp = 100; // Base XP for goal completion
    const goalTokens = 20; // Base tokens for goal completion

    await this.updateUserStats(userId, {
      totalXp: { increment: goalXp }
    });

    await this.mintTokens(userAddress, goalTokens, 'goal_completed');

    // Create goal achievement
    await this.createAchievement(userId, {
      type: 'goal_completed',
      name: 'Goal Achiever',
      description: `Completed goal: ${data.goalName || 'Unknown Goal'}`,
      xpReward: goalXp,
      tokenReward: goalTokens
    });
  }

  /**
   * Award streak milestone
   */
  private async awardStreakMilestone(userId: string, streakDays: number): Promise<void> {
    const milestoneXp = streakDays * 10;
    const milestoneTokens = Math.floor(streakDays / 7) * 5;

    await this.updateUserStats(userId, {
      totalXp: { increment: milestoneXp }
    });

    await this.createAchievement(userId, {
      type: 'streak_milestone',
      name: `${streakDays}-Day Streak!`,
      description: `Maintained a ${streakDays}-day focus streak`,
      xpReward: milestoneXp,
      tokenReward: milestoneTokens,
      rarity: streakDays >= 100 ? 'legendary' : streakDays >= 30 ? 'epic' : 'rare'
    });
  }

  /**
   * Check for level up
   */
  private async checkForLevelUp(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const currentLevel = user.level || 1;
    const totalXp = user.totalXp || 0;

    // Find the highest level the user can achieve
    let newLevel = currentLevel;
    for (let i = currentLevel; i < this.config.levelThresholds.length; i++) {
      if (totalXp >= this.config.levelThresholds[i]) {
        newLevel = i + 1;
      } else {
        break;
      }
    }

    if (newLevel > currentLevel) {
      await this.processEvent({
        type: 'level_up',
        userId,
        userAddress: user.userAddress,
        data: {
          previousLevel: currentLevel,
          newLevel,
          totalXp
        },
        timestamp: new Date()
      });
    }
  }

  /**
   * Check focus milestones
   */
  private async checkFocusMilestones(userId: string, sessionMinutes: number): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const totalFocusMinutes = (user.totalFocusMinutes || 0) + sessionMinutes;

    // Check for focus milestones
    const milestones = [60, 300, 600, 1200, 2400]; // 1h, 5h, 10h, 20h, 40h
    const previousMinutes = user.totalFocusMinutes || 0;

    for (const milestone of milestones) {
      if (totalFocusMinutes >= milestone && previousMinutes < milestone) {
        await this.createAchievement(userId, {
          type: 'focus_milestone',
          name: `${milestone} Minutes of Focus`,
          description: `Completed ${milestone} minutes of focused work`,
          xpReward: milestone / 10,
          tokenReward: Math.floor(milestone / 60),
          rarity: milestone >= 2400 ? 'legendary' : milestone >= 1200 ? 'epic' : 'rare'
        });
      }
    }
  }

  /**
   * Check task completion milestones
   */
  private async checkTaskMilestones(userId: string): Promise<void> {
    const completedTasks = await this.prisma.task.count({
      where: {
        userId,
        completed: true
      }
    });

    const milestones = [10, 50, 100, 500, 1000];
    const previousCount = completedTasks - 1; // Subtract current task

    for (const milestone of milestones) {
      if (completedTasks >= milestone && previousCount < milestone) {
        await this.createAchievement(userId, {
          type: 'task_milestone',
          name: `${milestone} Tasks Completed`,
          description: `Completed ${milestone} tasks`,
          xpReward: milestone * 2,
          tokenReward: Math.floor(milestone / 10),
          rarity: milestone >= 1000 ? 'legendary' : milestone >= 500 ? 'epic' : 'rare'
        });
      }
    }
  }

  /**
   * Generate new quests if needed
   */
  private async generateNewQuestsIfNeeded(userId: string, userAddress: string): Promise<void> {
    const activeQuests = await this.prisma.quests.count({
      where: {
        userId,
        isCompleted: 'false'
      }
    });

    // Generate new quests if user has less than 5 active quests
    if (activeQuests < 5) {
      await this.questService.generateQuestsForUser(userId, userAddress);
    }
  }

  /**
   * Generate level-up quests
   */
  private async generateLevelUpQuests(userId: string, newLevel: number): Promise<void> {
    // Generate special quests for level milestones
    if (newLevel === 5 || newLevel === 10 || newLevel === 20) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) return;

      await this.questService.generateQuestsForUser(userId, user.userAddress);
    }
  }

  /**
   * Update user stats
   */
  private async updateUserStats(userId: string, updates: Record<string, any>): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: updates
    });
  }

  /**
   * Mint tokens
   */
  private async mintTokens(userAddress: string, amount: number, reason: string): Promise<void> {
    try {
      // This would integrate with your token contract
      console.log(`Minting ${amount} tokens to ${userAddress} for ${reason}`);
      
      // For now, just log the minting
      // In production, this would call the actual smart contract
    } catch (error) {
      console.error('Error minting tokens:', error);
    }
  }

  /**
   * Create achievement
   */
  private async createAchievement(userId: string, achievement: {
    type: string;
    name: string;
    description: string;
    xpReward: number;
    tokenReward: number;
    rarity?: string;
  }): Promise<void> {
    await this.prisma.badge.create({
      data: {
        userId,
        type: achievement.type,
        name: achievement.name,
        description: achievement.description,
        icon: this.getAchievementIcon(achievement.type),
        rarity: achievement.rarity || 'common',
        xpReward: achievement.xpReward,
        tokenReward: achievement.tokenReward,
        meta: {
          earnedAt: new Date().toISOString(),
          type: achievement.type
        }
      }
    });
  }

  /**
   * Get achievement icon
   */
  private getAchievementIcon(type: string): string {
    const icons: Record<string, string> = {
      quest_completed: '🏆',
      level_up: '⭐',
      badge_earned: '🏅',
      streak_milestone: '🔥',
      focus_milestone: '⏲️',
      task_milestone: '✅',
      goal_completed: '🎯'
    };
    return icons[type] || '🏆';
  }

  /**
   * Update user embeddings
   */
  private async updateUserEmbeddings(userId: string): Promise<void> {
    try {
      await this.pineconeService.batchStoreUserData(userId);
    } catch (error) {
      console.warn('Failed to update user embeddings:', error);
    }
  }

  /**
   * Get user gamification stats
   */
  async getUserStats(userId: string): Promise<UserGamificationStats | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        badges: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        quests: {
          where: { isCompleted: 'true' }
        }
      }
    });

    if (!user) return null;

    const achievements: Achievement[] = user.badges.map(badge => ({
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      category: badge.type,
      earnedAt: badge.createdAt,
      rarity: (badge.rarity as any) || 'common',
      xpReward: badge.xpReward || 0,
      tokenReward: badge.tokenReward || 0
    }));

    const recentActivity: RecentActivity[] = this.eventQueue
      .filter(event => event.userId === userId)
      .slice(-10)
      .map(event => ({
        type: event.type,
        description: this.getActivityDescription(event),
        timestamp: event.timestamp,
        xpGained: event.rewards?.xp || 0,
        tokensGained: event.rewards?.tokens || 0
      }));

    return {
      userId: user.id,
      userAddress: user.userAddress,
      level: user.level || 1,
      totalXp: user.totalXp || 0,
      currentStreak: user.streak || 0,
      longestStreak: user.longestStreak || 0,
      totalFocusMinutes: user.totalFocusMinutes || 0,
      completedQuests: user.quests.length,
      earnedBadges: user.badges.length,
      totalTokens: 0, // TODO: Get from token contract
      achievements,
      recentActivity
    };
  }

  /**
   * Get activity description
   */
  private getActivityDescription(event: GamificationEvent): string {
    switch (event.type) {
      case 'quest_completed':
        return `Completed quest: ${event.data.questName || 'Unknown Quest'}`;
      case 'streak_updated':
        return `Updated streak to ${event.data.streak} days`;
      case 'level_up':
        return `Reached level ${event.data.newLevel}`;
      case 'badge_earned':
        return `Earned badge: ${event.data.badgeName || 'Unknown Badge'}`;
      case 'focus_session':
        return `Completed ${event.data.duration} minute focus session`;
      case 'task_completed':
        return `Completed task: ${event.data.taskName || 'Unknown Task'}`;
      case 'goal_completed':
        return `Completed goal: ${event.data.goalName || 'Unknown Goal'}`;
      default:
        return 'Unknown activity';
    }
  }

  /**
   * Get leaderboard data
   */
  async getLeaderboard(limit: number = 10): Promise<any[]> {
    return await this.prisma.user.findMany({
      select: {
        id: true,
        userAddress: true,
        level: true,
        totalXp: true,
        streak: true,
        totalFocusMinutes: true,
        completedQuests: true,
        earnedBadges: true
      },
      orderBy: [
        { totalXp: 'desc' },
        { level: 'desc' },
        { streak: 'desc' }
      ],
      take: limit
    });
  }

  /**
   * Get user's next level progress
   */
  async getNextLevelProgress(userId: string): Promise<{
    currentLevel: number;
    currentXp: number;
    nextLevelXp: number;
    progress: number;
  } | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    const currentLevel = user.level || 1;
    const currentXp = user.totalXp || 0;
    const nextLevelXp = this.config.levelThresholds[currentLevel] || 0;
    const progress = nextLevelXp > 0 ? (currentXp / nextLevelXp) * 100 : 0;

    return {
      currentLevel,
      currentXp,
      nextLevelXp,
      progress: Math.min(100, progress)
    };
  }
} 