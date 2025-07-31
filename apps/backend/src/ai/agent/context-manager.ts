import { PrismaClient } from '@prisma/client';
import { AgentContext, AppContext, UserContext, ContextOptimization } from './types';
import { buildContextString } from '../../services/helpers/contextHelper';

export class ContextManager {
  private prisma: PrismaClient;
  private optimization: ContextOptimization;

  constructor(prisma: PrismaClient, optimization?: Partial<ContextOptimization>) {
    this.prisma = prisma;
    this.optimization = {
      maxContextSize: 1024 * 1024, // 1MB
      compressionEnabled: true,
      prioritySources: ['tasks', 'goals', 'currentSession', 'gamification'],
      retentionPolicy: {
        tasks: 30,
        goals: 90,
        sessions: 7,
        conversations: 1
      },
      ...optimization
    };
  }

  /**
   * Build optimized context for an agent
   */
  async buildOptimizedContext(
    userId: string,
    agentType: string,
    sessionId: string,
    includeSources?: string[]
  ): Promise<AgentContext> {
    const startTime = Date.now();
    
    try {
      // Get user context
      const userContext = await this.getUserContext(userId);
      
      // Get app context with optimization
      const appContext = await this.getOptimizedAppContext(userId, agentType, includeSources);
      
      // Get conversation history
      const conversation = await this.getConversationHistory(sessionId);
      
      console.log(`Context built in ${Date.now() - startTime}ms for agent ${agentType}`);
      
      return {
        user: userContext,
        app: appContext,
        conversation,
        sessionId,
        agentType: agentType as any,
        metadata: {
          contextSize: this.calculateContextSize(appContext),
          buildTime: Date.now() - startTime,
          sources: includeSources || this.optimization.prioritySources
        }
      };
    } catch (error) {
      console.error('Error building optimized context:', error);
      throw error;
    }
  }

  /**
   * Get user context with profile and preferences
   */
  private async getUserContext(userId: string): Promise<UserContext> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userSettings: true
      }
    });

    return {
      userId,
      userAddress: user?.userAddress,
      profile: {
        name: user?.name,
        email: user?.email,
        level: user?.level || 1,
        totalXp: user?.totalXp || 0,
        streak: user?.streak || 0,
        totalFocusMinutes: user?.totalFocusMinutes || 0
      },
      preferences: user?.userSettings,
      currentSession: await this.getCurrentSession(userId)
    };
  }

  /**
   * Get optimized app context based on agent type and priorities
   */
  private async getOptimizedAppContext(
    userId: string,
    agentType: string,
    includeSources?: string[]
  ): Promise<AppContext> {
    const sources = includeSources || this.getPrioritySourcesForAgent(agentType);
    const context: Partial<AppContext> = {};

    // Load data based on priority sources
    for (const source of sources) {
      switch (source) {
        case 'tasks':
          context.tasks = await this.getOptimizedTasks(userId);
          break;
        case 'goals':
          context.goals = await this.getOptimizedGoals(userId);
          break;
        case 'sessions':
          context.timerSessions = await this.getOptimizedSessions(userId);
          break;
        case 'quests':
          context.quests = await this.getOptimizedQuests(userId);
          break;
        case 'badges':
          context.badges = await this.getOptimizedBadges(userId);
          break;
        case 'settings':
          context.settings = await this.getUserSettings(userId);
          break;
        case 'gamification':
          context.gamification = await this.getGamificationData(userId);
          break;
      }
    }

    return context as AppContext;
  }

  /**
   * Get priority sources based on agent type
   */
  private getPrioritySourcesForAgent(agentType: string): string[] {
    const agentPriorities: Record<string, string[]> = {
      'task_management': ['tasks', 'goals', 'currentSession', 'settings'],
      'goal_tracking': ['goals', 'tasks', 'gamification', 'settings'],
      'focus_timer': ['currentSession', 'tasks', 'goals', 'gamification'],
      'gamification': ['gamification', 'quests', 'badges', 'sessions'],
      'productivity_analysis': ['sessions', 'tasks', 'goals', 'gamification'],
      'mentor': ['tasks', 'goals', 'currentSession', 'gamification', 'settings'],
      'general': this.optimization.prioritySources,
      'orchestrator': this.optimization.prioritySources
    };

    return agentPriorities[agentType] || this.optimization.prioritySources;
  }

  /**
   * Get optimized tasks with smart filtering
   */
  private async getOptimizedTasks(userId: string): Promise<any[]> {
    const tasks = await this.prisma.task.findMany({
      where: { userId },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
        { updatedAt: 'desc' }
      ],
      take: 20, // Limit to most relevant tasks
      include: {
        timerSessions: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return this.compressTasks(tasks);
  }

  /**
   * Get optimized goals with progress tracking
   */
  private async getOptimizedGoals(userId: string): Promise<any[]> {
    const goals = await this.prisma.goal.findMany({
      where: { userId },
      orderBy: [
        { targetDate: 'asc' },
        { progress: 'desc' },
        { updatedAt: 'desc' }
      ],
      take: 10
    });

    return this.compressGoals(goals);
  }

  /**
   * Get optimized timer sessions
   */
  private async getOptimizedSessions(userId: string): Promise<any[]> {
    const sessions = await this.prisma.timerSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50, // More sessions for analysis
      include: {
        task: true,
        goal: true
      }
    });

    return this.compressSessions(sessions);
  }

  /**
   * Get current active session
   */
  private async getCurrentSession(userId: string): Promise<any> {
    return await this.prisma.timerSession.findFirst({
      where: {
        userId,
        completed: false
      },
      include: {
        task: true,
        goal: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get gamification data
   */
  private async getGamificationData(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        gamification: true
      }
    });

    return user?.gamification || {
      level: 1,
      xp: 0,
      focusPoints: 0,
      energy: 100,
      maxEnergy: 100,
      focusStreak: 0
    };
  }

  /**
   * Get user settings
   */
  private async getUserSettings(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        settings: true
      }
    });

    return user?.settings;
  }

  /**
   * Get optimized quests
   */
  private async getOptimizedQuests(userId: string): Promise<any[]> {
    const quests = await this.prisma.quest.findMany({
      where: { userId },
      orderBy: [
        { difficulty: 'asc' },
        { createdAt: 'desc' }
      ],
      take: 10
    });

    return this.compressQuests(quests);
  }

  /**
   * Get optimized badges
   */
  private async getOptimizedBadges(userId: string): Promise<any[]> {
    const badges = await this.prisma.badge.findMany({
      where: { userId },
      orderBy: { earnedAt: 'desc' },
      take: 10
    });

    return this.compressBadges(badges);
  }

  /**
   * Get conversation history
   */
  private async getConversationHistory(sessionId: string): Promise<any[]> {
    const messages = await this.prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: 20 // Limit conversation history
    });

    return messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.createdAt
    }));
  }

  /**
   * Compress tasks to reduce context size
   */
  private compressTasks(tasks: any[]): any[] {
    return tasks.map(task => ({
      id: task.id,
      title: task.title,
      priority: task.priority,
      completed: task.completed,
      dueDate: task.dueDate,
      estimatedMinutes: task.estimatedMinutes,
      actualMinutes: task.actualMinutes,
      goalId: task.goalId,
      recentSessions: task.timerSessions?.length || 0
    }));
  }

  /**
   * Compress goals to reduce context size
   */
  private compressGoals(goals: any[]): any[] {
    return goals.map(goal => ({
      id: goal.id,
      title: goal.title,
      progress: goal.progress,
      targetDate: goal.targetDate,
      completed: goal.completed,
      taskCount: goal.tasks?.length || 0
    }));
  }

  /**
   * Compress sessions to reduce context size
   */
  private compressSessions(sessions: any[]): any[] {
    return sessions.map(session => ({
      id: session.id,
      type: session.type,
      duration: session.duration,
      completed: session.completed,
      taskId: session.taskId,
      goalId: session.goalId,
      createdAt: session.createdAt
    }));
  }

  /**
   * Compress quests to reduce context size
   */
  private compressQuests(quests: any[]): any[] {
    return quests.map(quest => ({
      id: quest.id,
      name: quest.name,
      difficulty: quest.difficulty,
      progress: quest.progress,
      completed: quest.completed,
      rewardXp: quest.rewardXp
    }));
  }

  /**
   * Compress badges to reduce context size
   */
  private compressBadges(badges: any[]): any[] {
    return badges.map(badge => ({
      id: badge.id,
      name: badge.name,
      description: badge.description,
      earnedAt: badge.earnedAt
    }));
  }

  /**
   * Calculate context size in bytes
   */
  private calculateContextSize(context: AppContext): number {
    return JSON.stringify(context).length;
  }

  /**
   * Check if context needs compression
   */
  private needsCompression(contextSize: number): boolean {
    return contextSize > this.optimization.maxContextSize && this.optimization.compressionEnabled;
  }

  /**
   * Build context string for LLM prompt
   */
  async buildContextString(context: AgentContext): Promise<string> {
    return buildContextString({
      userContext: context.user,
      appContext: context.app,
      conversation: context.conversation
    }, ['tasks', 'goals', 'sessions', 'profile', 'mentor', 'badges', 'quests', 'settings']);
  }

  /**
   * Update context with new data
   */
  async updateContext(
    userId: string,
    sessionId: string,
    updates: Partial<AppContext>
  ): Promise<void> {
    // This would typically update the context cache
    // For now, we'll just log the updates
    console.log('Context updates:', updates);
  }

  /**
   * Clear old context data based on retention policy
   */
  async cleanupOldContext(): Promise<void> {
    const now = new Date();
    
    // Clean up old sessions
    const sessionRetention = new Date(now.getTime() - this.optimization.retentionPolicy.sessions * 24 * 60 * 60 * 1000);
    await this.prisma.timerSession.deleteMany({
      where: {
        createdAt: { lt: sessionRetention }
      }
    });

    // Clean up old conversations
    const conversationRetention = new Date(now.getTime() - this.optimization.retentionPolicy.conversations * 24 * 60 * 60 * 1000);
    await this.prisma.message.deleteMany({
      where: {
        createdAt: { lt: conversationRetention }
      }
    });
  }
} 