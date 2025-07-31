import { PrismaClient } from '@prisma/client';
import { AgentContext, AppContext, UserContext, ContextOptimization } from './types';

export class ContextService {
  private prisma: PrismaClient;
  private optimization: ContextOptimization;
  private contextCache: Map<string, { context: AgentContext; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
   * Build optimized context for an agent with caching
   */
  async buildContext(
    userId: string,
    agentType: string,
    sessionId: string,
    includeSources?: string[]
  ): Promise<AgentContext> {
    const cacheKey = `${userId}_${agentType}_${sessionId}`;
    const cached = this.contextCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log(`Using cached context for ${cacheKey}`);
      return cached.context;
    }

    const startTime = Date.now();
    
    try {
      // Get user context
      const userContext = await this.getUserContext(userId);
      
      // Get app context with optimization
      const appContext = await this.getOptimizedAppContext(userId, agentType, includeSources);
      
      // Get conversation history
      const conversation = await this.getConversationHistory(sessionId);
      
      const context: AgentContext = {
        user: userContext,
        app: appContext,
        conversation,
        sessionId,
        agentType: agentType as any,
        metadata: {
          contextSize: this.calculateContextSize(appContext),
          buildTime: Date.now() - startTime,
          sources: includeSources || this.optimization.prioritySources,
          cached: false
        }
      };

      // Cache the context
      this.contextCache.set(cacheKey, {
        context,
        timestamp: Date.now()
      });

      console.log(`Context built in ${Date.now() - startTime}ms for agent ${agentType}`);
      
      return context;
    } catch (error) {
      console.error('Error building context:', error);
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

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    return {
      userId,
      userAddress: user.userAddress,
      profile: {
        name: user.name,
        email: user.email,
        level: user.level || 1,
        totalXp: user.totalXp || 0,
        streak: user.streak || 0,
        totalFocusMinutes: user.totalFocusMinutes || 0
      },
      preferences: user.userSettings,
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
      where: { 
        userId,
        isArchived: false
      },
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
      where: { 
        userId,
        isArchived: false
      },
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
      where: { id: userId }
    });

    return {
      level: user?.level || 1,
      xp: user?.totalXp || 0,
      focusPoints: 0, // Not in schema, default to 0
      energy: 100, // Not in schema, default to 100
      maxEnergy: 100, // Not in schema, default to 100
      focusStreak: user?.streak || 0
    };
  }

  /**
   * Get user settings
   */
  private async getUserSettings(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userSettings: true
      }
    });

    return user?.userSettings;
  }

  /**
   * Get optimized quests
   */
  private async getOptimizedQuests(userId: string): Promise<any[]> {
    const quests = await this.prisma.quests.findMany({
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
      orderBy: { dateAwarded: 'desc' },
      take: 10
    });

    return this.compressBadges(badges);
  }

  /**
   * Get conversation history
   */
  private async getConversationHistory(sessionId: string): Promise<any[]> {
    const messages = await this.prisma.message.findMany({
      where: { 
        chatId: sessionId // Assuming sessionId maps to chatId
      },
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
      goalIds: task.goalIds,
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
      taskIds: goal.taskIds
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
      completed: quest.isCompleted === 'true',
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
      dateAwarded: badge.dateAwarded
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
    const { user, app } = context;
    
    let contextString = `User: ${user.profile?.name || 'User'}\n`;
    contextString += `Level: ${user.profile?.level || 1}\n`;
    contextString += `XP: ${user.profile?.totalXp || 0}\n`;
    contextString += `Focus Streak: ${user.profile?.streak || 0} days\n`;
    contextString += `Total Focus Minutes: ${user.profile?.totalFocusMinutes || 0}\n\n`;

    if (app.tasks && app.tasks.length > 0) {
      contextString += `Tasks (${app.tasks.length}):\n`;
      app.tasks.slice(0, 5).forEach(task => {
        contextString += `- ${task.title} (${task.priority}, ${task.completed ? 'completed' : 'pending'})\n`;
      });
      contextString += '\n';
    }

    if (app.goals && app.goals.length > 0) {
      contextString += `Goals (${app.goals.length}):\n`;
      app.goals.slice(0, 3).forEach(goal => {
        contextString += `- ${goal.title} (${goal.progress}% complete)\n`;
      });
      contextString += '\n';
    }

    if (app.timerSessions && app.timerSessions.length > 0) {
      const recentSessions = app.timerSessions.slice(0, 3);
      contextString += `Recent Sessions (${recentSessions.length}):\n`;
      recentSessions.forEach(session => {
        contextString += `- ${session.type} session (${session.duration}s, ${session.completed ? 'completed' : 'incomplete'})\n`;
      });
      contextString += '\n';
    }

    return contextString;
  }

  /**
   * Update context with new data
   */
  async updateContext(
    userId: string,
    sessionId: string,
    updates: Partial<AppContext>
  ): Promise<void> {
    // Clear cache for this user
    this.clearUserCache(userId);
    
    console.log('Context updated for user:', userId);
  }

  /**
   * Clear cache for a specific user
   */
  private clearUserCache(userId: string): void {
    const keysToDelete: string[] = [];
    for (const [key] of this.contextCache) {
      if (key.startsWith(`${userId}_`)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.contextCache.delete(key));
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

    // Clear expired cache entries
    this.clearExpiredCache();
  }

  /**
   * Clear expired cache entries
   */
  private clearExpiredCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, value] of this.contextCache) {
      if (now - value.timestamp > this.CACHE_TTL) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.contextCache.delete(key));
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.contextCache.size,
      ttl: this.CACHE_TTL,
      keys: Array.from(this.contextCache.keys())
    };
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.contextCache.clear();
  }
} 