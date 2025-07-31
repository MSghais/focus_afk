import { PrismaClient } from '@prisma/client';
import { PineconeService } from '../ai/memory/pinecone.service';
import { EnhancedContextManager } from '../ai/memory/enhancedContextManager';
import { GamificationService } from './gamification.service';

export interface QuestTemplate {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'special' | 'adaptive';
  category: 'focus' | 'tasks' | 'goals' | 'mentor' | 'streak' | 'learning' | 'social' | 'notes';
  requirements: string[];
  rewardXp: number;
  rewardTokens: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  vectorContextTypes?: string[];
  adaptivePrompt?: string;
  completionCriteria: {
    type: 'count' | 'duration' | 'streak' | 'custom' | 'task_count' | 'priority_task_completion' | 'overdue_task_completion' | 'goal_progress_increase' | 'goal_completion' | 'note_action_completion' | 'note_review_count' | 'focus_duration';
    target: number;
    unit?: string;
  };
  prerequisites?: string[];
  cooldown?: number; // hours
  maxCompletions?: number;
}

export interface UserQuestContext {
  userId: string;
  userAddress: string;
  level: number;
  totalXp: number;
  streak: number;
  completedQuests: string[];
  recentActivity: {
    focusSessions: number;
    completedTasks: number;
    completedGoals: number;
    mentorChats: number;
    lastActive: Date;
  };
  preferences: {
    preferredCategories: string[];
    difficultyPreference: number;
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'any';
  };
  vectorContext: any[];
}

export interface GeneratedQuest {
  id: string;
  userId: string;
  templateId: string;
  name: string;
  description: string;
  type: string;
  category: string;
  status: 'active' | 'completed' | 'failed' | 'expired';
  progress: number;
  goal: number;
  rewardXp: number;
  rewardTokens: number;
  difficulty: number;
  createdAt: Date;
  expiresAt?: Date;
  vectorContext?: any[];
  adaptiveDescription?: string;
  meta: Record<string, any>;
}

export class EnhancedQuestService {
  private questTemplates: Map<string, QuestTemplate> = new Map();
  private adaptiveQuestPrompts: Map<string, string> = new Map();

  constructor(
    private readonly prisma: PrismaClient,
    private readonly pineconeService: PineconeService,
    private readonly enhancedContextManager: EnhancedContextManager,
    private readonly gamificationService: GamificationService
  ) {
    this.initializeQuestTemplates();
    this.initializeAdaptivePrompts();
  }

  private initializeQuestTemplates(): void {
    // Basic quest templates
    const templates: QuestTemplate[] = [
      {
        id: 'daily_focus',
        name: 'Daily Focus Session',
        description: 'Complete a focused work session',
        type: 'daily',
        category: 'focus',
        requirements: [],
        rewardXp: 50,
        rewardTokens: 5,
        difficulty: 1,
        completionCriteria: { type: 'duration', target: 25, unit: 'minutes' }
      },
      {
        id: 'daily_tasks',
        name: 'Task Completion',
        description: 'Complete tasks from your list',
        type: 'daily',
        category: 'tasks',
        requirements: [],
        rewardXp: 30,
        rewardTokens: 3,
        difficulty: 1,
        completionCriteria: { type: 'count', target: 3 }
      },
      {
        id: 'weekly_goals',
        name: 'Goal Progress',
        description: 'Make progress on your goals',
        type: 'weekly',
        category: 'goals',
        requirements: [],
        rewardXp: 100,
        rewardTokens: 10,
        difficulty: 2,
        completionCriteria: { type: 'count', target: 2 }
      }
    ];

    templates.forEach(template => {
      this.questTemplates.set(template.id, template);
    });
  }

  private initializeAdaptivePrompts(): void {
    this.adaptiveQuestPrompts.set('productivity', 'Create a quest focused on improving productivity');
    this.adaptiveQuestPrompts.set('wellness', 'Create a quest focused on mental wellness and balance');
    this.adaptiveQuestPrompts.set('learning', 'Create a quest focused on skill development');
  }

  async generateQuestsForUser(userId: string, userAddress: string): Promise<GeneratedQuest[]> {
    console.log(`Generating enhanced quests for user: ${userId}`);

    // Get user context
    const userContext = await this.buildUserContext(userId, userAddress);
    
    // Get vector-based context
    const vectorContext = await this.getVectorContext(userId, userContext);
    
    // Generate quests based on templates and context
    const generatedQuests: GeneratedQuest[] = [];
    
    // Generate personalized quests based on vector context
    const personalizedQuests = await this.createVectorBasedPersonalizedQuests(userContext, vectorContext);
    generatedQuests.push(...personalizedQuests);
    
    // Generate priority quests
    const priorityQuests = await this.generatePriorityQuestSuggestions(userId, userAddress);
    generatedQuests.push(...priorityQuests);

    // Save quests to database
    await this.saveQuestsToDatabase(generatedQuests);

    return generatedQuests;
  }

  async createGenericQuest(questData: {
    userId: string;
    userAddress: string;
    name: string;
    description: string;
    category: 'focus' | 'tasks' | 'goals' | 'notes' | 'learning' | 'social' | 'custom';
    difficulty: 1 | 2 | 3 | 4 | 5;
    rewardXp: number;
    rewardTokens: number;
    completionCriteria: {
      type: 'count' | 'duration' | 'streak' | 'custom';
      target: number;
      unit?: string;
    };
    expiresAt?: Date;
    tags?: string[];
    priority?: 'low' | 'medium' | 'high';
  }): Promise<GeneratedQuest> {
    const quest: GeneratedQuest = {
      id: `generic_${questData.userId}_${Date.now()}`,
      userId: questData.userId,
      templateId: 'generic',
      name: questData.name,
      description: questData.description,
      type: 'generic',
      category: questData.category,
      status: 'active',
      progress: 0,
      goal: questData.completionCriteria.target,
      rewardXp: questData.rewardXp,
      rewardTokens: questData.rewardTokens,
      difficulty: questData.difficulty,
      createdAt: new Date(),
      expiresAt: questData.expiresAt,
      meta: {
        template: 'generic',
        completionCriteria: questData.completionCriteria,
        tags: questData.tags || [],
        priority: questData.priority || 'medium',
        createdBy: 'user'
      }
    };

    // Save to database
    await this.saveQuestsToDatabase([quest]);

    return quest;
  }

  async createSuggestionQuest(questData: {
    userId: string;
    userAddress: string;
    suggestionType: 'productivity' | 'wellness' | 'learning' | 'social' | 'custom';
    context: any[];
    aiReasoning: string;
    difficulty?: 1 | 2 | 3 | 4 | 5;
    expiresAt?: Date;
  }): Promise<GeneratedQuest> {
    const questDetails = {
      name: `${questData.suggestionType.charAt(0).toUpperCase() + questData.suggestionType.slice(1)} Challenge`,
      description: `Complete a ${questData.suggestionType} activity based on AI analysis of your patterns.`,
      category: 'custom',
      difficulty: questData.difficulty || 2,
      rewardXp: 100,
      rewardTokens: 10,
      completionCriteria: { type: 'count', target: 1 }
    };

    const quest: GeneratedQuest = {
      id: `suggestion_${questData.userId}_${Date.now()}`,
      userId: questData.userId,
      templateId: `suggestion_${questData.suggestionType}`,
      name: questDetails.name,
      description: questDetails.description,
      type: 'suggestion',
      category: questDetails.category,
      status: 'active',
      progress: 0,
      goal: questDetails.completionCriteria.target,
      rewardXp: questDetails.rewardXp,
      rewardTokens: questDetails.rewardTokens,
      difficulty: questDetails.difficulty,
      createdAt: new Date(),
      expiresAt: questData.expiresAt,
      meta: {
        template: `suggestion_${questData.suggestionType}`,
        suggestionType: questData.suggestionType,
        context: questData.context,
        aiReasoning: questData.aiReasoning,
        completionCriteria: questDetails.completionCriteria,
        createdBy: 'ai'
      }
    };

    // Save to database
    await this.saveQuestsToDatabase([quest]);

    return quest;
  }

  async generatePriorityQuestSuggestions(userId: string, userAddress: string): Promise<GeneratedQuest[]> {
    const quests: GeneratedQuest[] = [];
    const now = new Date();

    try {
      // Build comprehensive user context with both database and vector data
      const userContext = await this.buildUserContext(userId, userAddress);
      const vectorContext = await this.getVectorContext(userId, userContext);
      
      // Update user context with vector data
      userContext.vectorContext = vectorContext;

      // Get user's current tasks with priority information
      const userTasks = await this.prisma.task.findMany({
        where: {
          userId,
          completed: false
        },
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' }
        ],
        take: 10
      });

      // Get user's current level and stats
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return this.generateGenericConnectionQuests(userId, userAddress);
      }

      // If user has tasks, create priority-based quests with vector context
      if (userTasks.length > 0) {
        quests.push(...await this.createTaskBasedPriorityQuests(userTasks, user, userContext.recentActivity));
        
        // Add personalized quests based on vector context
        if (vectorContext.length > 0) {
          quests.push(...await this.createVectorBasedPersonalizedQuests(userContext, vectorContext));
        }
      }

      // If user has no tasks or very few, create generic quests
      if (userTasks.length < 2) {
        quests.push(...await this.generateGenericConnectionQuests(userId, userAddress));
      }

      // Save quests to database
      await this.saveQuestsToDatabase(quests);

      console.log(`Generated ${quests.length} priority quests for user ${userId} with ${vectorContext.length} vector context items`);
      return quests;
    } catch (error) {
      console.error('Error generating priority quest suggestions:', error);
      // Fallback to generic quests
      return this.generateGenericConnectionQuests(userId, userAddress);
    }
  }

  private async createTaskBasedPriorityQuests(
    tasks: any[], 
    user: any, 
    recentActivity: any
  ): Promise<GeneratedQuest[]> {
    const quests: GeneratedQuest[] = [];
    const now = new Date();

    // High priority tasks quest
    const highPriorityTasks = tasks.filter(t => t.priority === 'high');
    if (highPriorityTasks.length > 0) {
      quests.push({
        id: `priority_high_${user.id}_${Date.now()}`,
        userId: user.id,
        templateId: 'priority_high',
        name: '🔥 High Priority Focus',
        description: `Complete ${Math.min(2, highPriorityTasks.length)} high-priority tasks`,
        type: 'priority',
        category: 'tasks',
        status: 'active',
        progress: 0,
        goal: Math.min(2, highPriorityTasks.length),
        rewardXp: 200,
        rewardTokens: 20,
        difficulty: 3,
        createdAt: now,
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 hours
        meta: {
          template: 'priority_high',
          completionCriteria: { type: 'priority_task_completion', target: Math.min(2, highPriorityTasks.length) },
          priority: 'high',
          taskIds: highPriorityTasks.map(t => t.id)
        }
      });
    }

    // Medium priority tasks quest
    const mediumPriorityTasks = tasks.filter(t => t.priority === 'medium');
    if (mediumPriorityTasks.length > 0) {
      quests.push({
        id: `priority_medium_${user.id}_${Date.now()}`,
        userId: user.id,
        templateId: 'priority_medium',
        name: '📋 Medium Priority Tasks',
        description: `Complete ${Math.min(3, mediumPriorityTasks.length)} medium-priority tasks`,
        type: 'priority',
        category: 'tasks',
        status: 'active',
        progress: 0,
        goal: Math.min(3, mediumPriorityTasks.length),
        rewardXp: 150,
        rewardTokens: 15,
        difficulty: 2,
        createdAt: now,
        expiresAt: new Date(now.getTime() + 48 * 60 * 60 * 1000), // 48 hours
        meta: {
          template: 'priority_medium',
          completionCriteria: { type: 'priority_task_completion', target: Math.min(3, mediumPriorityTasks.length) },
          priority: 'medium',
          taskIds: mediumPriorityTasks.map(t => t.id)
        }
      });
    }

    // Overdue tasks quest
    const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now);
    if (overdueTasks.length > 0) {
      quests.push({
        id: `priority_overdue_${user.id}_${Date.now()}`,
        userId: user.id,
        templateId: 'priority_overdue',
        name: '⏰ Overdue Tasks',
        description: `Complete ${Math.min(2, overdueTasks.length)} overdue tasks`,
        type: 'priority',
        category: 'tasks',
        status: 'active',
        progress: 0,
        goal: Math.min(2, overdueTasks.length),
        rewardXp: 250,
        rewardTokens: 25,
        difficulty: 4,
        createdAt: now,
        expiresAt: new Date(now.getTime() + 12 * 60 * 60 * 1000), // 12 hours
        meta: {
          template: 'priority_overdue',
          completionCriteria: { type: 'overdue_task_completion', target: Math.min(2, overdueTasks.length) },
          priority: 'high',
          taskIds: overdueTasks.map(t => t.id)
        }
      });
    }

    return quests;
  }

  private async generateGenericConnectionQuests(userId: string, userAddress: string): Promise<GeneratedQuest[]> {
    const quests: GeneratedQuest[] = [];
    const now = new Date();

    // Generic daily quests
    quests.push({
      id: `generic_daily_${userId}_${Date.now()}`,
      userId,
      templateId: 'generic_daily',
      name: '🌅 Daily Focus',
      description: 'Complete a 25-minute focus session',
      type: 'generic',
      category: 'focus',
      status: 'active',
      progress: 0,
      goal: 25,
      rewardXp: 100,
      rewardTokens: 10,
      difficulty: 1,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      meta: {
        template: 'generic_daily',
        completionCriteria: { type: 'duration', target: 25, unit: 'minutes' },
        priority: 'medium'
      }
    });

    quests.push({
      id: `generic_task_${userId}_${Date.now()}`,
      userId,
      templateId: 'generic_task',
      name: '📝 Task Master',
      description: 'Complete 3 tasks from your list',
      type: 'generic',
      category: 'tasks',
      status: 'active',
      progress: 0,
      goal: 3,
      rewardXp: 80,
      rewardTokens: 8,
      difficulty: 1,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      meta: {
        template: 'generic_task',
        completionCriteria: { type: 'count', target: 3 },
        priority: 'medium'
      }
    });

    return quests;
  }

  private async buildUserContext(userId: string, userAddress: string): Promise<UserQuestContext> {
    // Get user data
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        tasks: { take: 20 },
        goals: { take: 20 },
        notes: { take: 20 },
        timerSessions: { take: 20 },
        quests: { take: 50 }
      }
    });

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    // Get recent activity
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentActivity = {
      focusSessions: user.timerSessions.filter(s => s.createdAt >= weekAgo).length,
      completedTasks: user.tasks.filter(t => t.completed && t.updatedAt >= weekAgo).length,
      completedGoals: user.goals.filter(g => g.completed && g.updatedAt >= weekAgo).length,
      mentorChats: 0, // Temporarily set to 0
      lastActive: user.updatedAt
    };

    // Analyze user preferences
    const preferences = await this.analyzeUserPreferences(user);

    // Get completed quests
    const completedQuests = user.quests
      .filter(q => q.isCompleted === 'true')
      .map(q => q.type);

    return {
      userId,
      userAddress,
      level: user.level || 1,
      totalXp: user.totalXp || 0,
      streak: user.streak || 0,
      completedQuests,
      recentActivity,
      preferences,
      vectorContext: [] // Will be populated by getVectorContext
    };
  }

  private async getVectorContext(userId: string, userContext: UserQuestContext): Promise<any[]> {
    try {
      // Create a comprehensive search query based on user context
      const searchQuery = this.buildVectorSearchQuery(userContext);
      
      // Use enhanced context manager to search user content
      const vectorResults = await this.enhancedContextManager.searchUserContent(
        userId,
        searchQuery,
        ['tasks', 'goals', 'notes', 'focus_sessions'],
        10
      );

      console.log(`Found ${vectorResults.length} vector context items for user ${userId}`);
      return vectorResults;
    } catch (error) {
      console.error('Error getting vector context:', error);
      // Fallback to database-only context
      return this.getFallbackVectorContext(userId, userContext);
    }
  }

  private buildVectorSearchQuery(userContext: UserQuestContext): string {
    const queryParts:any[] = [];

    // Add user level and experience
    queryParts.push(`user level ${userContext.level}, ${userContext.totalXp} total XP`);

    // Add recent activity context
    const { recentActivity } = userContext;
    if (recentActivity.focusSessions > 0) {
      queryParts.push(`${recentActivity.focusSessions} focus sessions this week`);
    }
    if (recentActivity.completedTasks > 0) {
      queryParts.push(`${recentActivity.completedTasks} tasks completed this week`);
    }
    if (recentActivity.completedGoals > 0) {
      queryParts.push(`${recentActivity.completedGoals} goals completed this week`);
    }

    // Add streak information
    if (userContext.streak > 0) {
      queryParts.push(`${userContext.streak} day streak`);
    }

    // Add preference context
    if (userContext.preferences.preferredCategories.length > 0) {
      queryParts.push(`prefers ${userContext.preferences.preferredCategories.join(', ')} activities`);
    }

    return queryParts.join(', ');
  }

  private async getFallbackVectorContext(userId: string, userContext: UserQuestContext): Promise<any[]> {
    // Get recent user data from database as fallback
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [recentTasks, recentGoals, recentNotes, recentSessions] = await Promise.all([
      this.prisma.task.findMany({
        where: {
          userId,
          updatedAt: { gte: weekAgo }
        },
        take: 10
      }),
      this.prisma.goal.findMany({
        where: {
          userId,
          updatedAt: { gte: weekAgo }
        },
        take: 10
      }),
      this.prisma.notes.findMany({
        where: {
          userId,
          updatedAt: { gte: weekAgo }
        },
        take: 10
      }),
      this.prisma.timerSession.findMany({
        where: {
          userId,
          createdAt: { gte: weekAgo }
        },
        take: 10
      })
    ]);

    // Convert to vector context format
    const fallbackContext = [
      ...recentTasks.map(task => ({
        type: 'task',
        id: task.id,
        content: task.title,
        metadata: {
          priority: task.priority,
          completed: task.completed,
          category: task.category
        }
      })),
      ...recentGoals.map(goal => ({
        type: 'goal',
        id: goal.id,
        content: goal.title,
        metadata: {
          progress: goal.progress,
          completed: goal.completed,
          category: goal.category
        }
      })),
      ...recentNotes.map(note => ({
        type: 'note',
        id: note.id,
        content: note.text?.substring(0, 200) || '',
        metadata: {
          type: note.type,
          sources: note.sources
        }
      })),
      ...recentSessions.map(session => ({
        type: 'focus_session',
        id: session.id,
        content: `Focus session: ${session.duration} minutes`,
        metadata: {
          duration: session.duration,
          type: session.type
        }
      }))
    ];

    console.log(`Using fallback context with ${fallbackContext.length} items for user ${userId}`);
    return fallbackContext;
  }

  private async analyzeUserPreferences(user: any): Promise<{
    preferredCategories: string[];
    difficultyPreference: number;
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'any';
  }> {
    const preferences = {
      preferredCategories: [] as string[],
      difficultyPreference: 2,
      timeOfDay: 'any' as const
    };

    // Analyze task categories
    const taskCategories = user.tasks.map((t: any) => t.category).filter(Boolean);
    if (taskCategories.length > 0) {
      const categoryCounts = taskCategories.reduce((acc: any, cat: string) => {
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});
      
      const sortedCategories = Object.entries(categoryCounts)
        .sort(([,a]: any, [,b]: any) => b - a)
        .slice(0, 3)
        .map(([cat]) => cat);
      
      preferences.preferredCategories = sortedCategories;
    }

    // Analyze difficulty preference based on completed quests
    const completedQuests = user.quests.filter((q: any) => q.isCompleted === 'true');
    if (completedQuests.length > 0) {
      const avgDifficulty = completedQuests.reduce((sum: number, q: any) => sum + (q.difficulty || 2), 0) / completedQuests.length;
      preferences.difficultyPreference = Math.round(avgDifficulty);
    }

    // Analyze time of day preference from focus sessions
    const focusSessions = user.timerSessions.filter((s: any) => s.type === 'focus');
    if (focusSessions.length > 0) {
      const hourCounts = focusSessions.reduce((acc: any, session: any) => {
        const hour = new Date(session.createdAt).getHours();
        const timeSlot = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
        acc[timeSlot] = (acc[timeSlot] || 0) + 1;
        return acc;
      }, {});

      const preferredTime = Object.entries(hourCounts)
        .sort(([,a]: any, [,b]: any) => b - a)[0]?.[0] as any;
      
      if (preferredTime) {
        preferences.timeOfDay = preferredTime;
      }
    }

    return preferences;
  }

  private async createVectorBasedPersonalizedQuests(userContext: UserQuestContext, vectorContext: any[]): Promise<GeneratedQuest[]> {
    const quests: GeneratedQuest[] = [];
    const now = new Date();

    try {
      // Analyze vector context for patterns and insights
      const insights = await this.analyzeVectorContextForPersonalization(vectorContext, userContext);

      // Create quests based on insights
      for (const insight of insights) {
        const quest = await this.createPersonalizedQuestFromInsight(insight, userContext);
        if (quest) {
          quests.push(quest);
        }
      }

      return quests;
    } catch (error) {
      console.error('Error creating vector-based personalized quests:', error);
      return [];
    }
  }

  private async analyzeVectorContextForPersonalization(vectorContext: any[], userContext: UserQuestContext): Promise<any[]> {
    const insights: any[] = [];

    // Group context by type
    const tasks = vectorContext.filter(ctx => ctx.type === 'task');
    const goals = vectorContext.filter(ctx => ctx.type === 'goal');
    const notes = vectorContext.filter(ctx => ctx.type === 'note');
    const focusSessions = vectorContext.filter(ctx => ctx.type === 'focus_session');

    // Analyze task patterns
    if (tasks.length > 0) {
      const incompleteTasks = tasks.filter(task => !task.metadata?.completed);
      const highPriorityTasks = tasks.filter(task => task.metadata?.priority === 'high');
      
      if (incompleteTasks.length > 3) {
        insights.push({
          type: 'task_completion_pattern',
          category: 'tasks',
          difficulty: 2,
          description: `You have ${incompleteTasks.length} incomplete tasks. Focus on completing them systematically.`,
          target: Math.min(3, incompleteTasks.length),
          rewardXp: 150,
          rewardTokens: 15,
          priority: 'medium'
        });
      }

      if (highPriorityTasks.length > 0) {
        insights.push({
          type: 'priority_focus',
          category: 'tasks',
          difficulty: 3,
          description: `You have ${highPriorityTasks.length} high-priority tasks. Focus on completing them first.`,
          target: Math.min(2, highPriorityTasks.length),
          rewardXp: 200,
          rewardTokens: 20,
          priority: 'high'
        });
      }
    }

    // Analyze goal patterns
    if (goals.length > 0) {
      const lowProgressGoals = goals.filter(goal => (goal.metadata?.progress || 0) < 30);
      
      if (lowProgressGoals.length > 0) {
        insights.push({
          type: 'goal_progress_boost',
          category: 'goals',
          difficulty: 3,
          description: `You have ${lowProgressGoals.length} goals with low progress. Let's boost them!`,
          target: 1,
          rewardXp: 250,
          rewardTokens: 25,
          priority: 'medium'
        });
      }
    }

    // Analyze note patterns
    if (notes.length > 0) {
      const actionNotes = notes.filter(note => 
        note.content?.includes('TODO') || 
        note.content?.includes('ACTION') ||
        note.content?.includes('DO')
      );
      
      if (actionNotes.length > 0) {
        insights.push({
          type: 'note_action_items',
          category: 'notes',
          difficulty: 2,
          description: `You have ${actionNotes.length} notes with action items. Let's tackle them!`,
          target: Math.min(3, actionNotes.length),
          rewardXp: 100,
          rewardTokens: 10,
          priority: 'medium'
        });
      }
    }

    // Analyze focus session patterns
    if (focusSessions.length > 0) {
      const avgDuration = focusSessions.reduce((sum, session) => sum + (session.metadata?.duration || 0), 0) / focusSessions.length;
      
      if (avgDuration < 25) {
        insights.push({
          type: 'extend_focus_sessions',
          category: 'focus',
          difficulty: 2,
          description: `Your average focus session is ${Math.round(avgDuration)} minutes. Let's extend that!`,
          target: 30,
          rewardXp: 120,
          rewardTokens: 12,
          priority: 'medium'
        });
      }
    }

    return insights;
  }

  private async createPersonalizedQuestFromInsight(insight: any, userContext: UserQuestContext): Promise<GeneratedQuest | null> {
    const now = new Date();
    
    const quest: GeneratedQuest = {
      id: `personalized_${insight.type}_${userContext.userId}_${Date.now()}`,
      userId: userContext.userId,
      templateId: `personalized_${insight.type}`,
      name: this.generatePersonalizedQuestName(insight),
      description: insight.description,
      type: 'personalized',
      category: insight.category,
      status: 'active',
      progress: 0,
      goal: insight.target,
      rewardXp: insight.rewardXp,
      rewardTokens: insight.rewardTokens,
      difficulty: insight.difficulty,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 1 week
      vectorContext: userContext.vectorContext,
      meta: {
        template: `personalized_${insight.type}`,
        insight: insight,
        priority: insight.priority,
        completionCriteria: { 
          type: insight.category === 'focus' ? 'duration' : 'count', 
          target: insight.target 
        },
        personalized: true,
        vectorBased: true
      }
    };

    return quest;
  }

  private generatePersonalizedQuestName(insight: any): string {
    const names: Record<string, string> = {
      task_completion_pattern: '📋 Task Completion Sprint',
      priority_focus: '🔥 Priority Task Focus',
      goal_progress_boost: '🎯 Goal Progress Boost',
      note_action_items: '📝 Note Action Items',
      extend_focus_sessions: '⏲️ Extended Focus Challenge'
    };

    return names[insight.type] || '🎯 Personalized Challenge';
  }

  private async saveQuestsToDatabase(quests: GeneratedQuest[]): Promise<void> {
    for (const quest of quests) {
      await this.prisma.quests.create({
        data: {
          id: quest.id,
          userId: quest.userId,
          type: quest.type,
          name: quest.name,
          description: quest.description,
          // category: quest.category,
          difficulty: quest.difficulty,
          rewardXp: quest.rewardXp,
          // rewardTokens: quest.rewardTokens,
          isCompleted: 'false',
          progress: quest.progress,
          // goal: quest.goal,
          // expiresAt: quest.expiresAt,
          meta: quest.meta
        }
      });
    }
  }

  async updateQuestProgress(userId: string): Promise<void> {
    const activeQuests = await this.prisma.quests.findMany({
      where: {
        userId,
        isCompleted: 'false'
      }
    });

    for (const quest of activeQuests) {
      const progress = await this.calculateQuestProgress(userId, quest);
      
      await this.prisma.quests.update({
        where: { id: quest.id },
        data: { progress }
      });

      // Check if quest is completed
      if (progress >= 100) {
        await this.completeQuest(quest.id, userId);
      }
    }
  }

  private async calculateQuestProgress(userId: string, quest: any): Promise<number> {
    const template = this.questTemplates.get(quest.type);
    if (!template) return 0;

    const { completionCriteria } = template;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (completionCriteria.type) {
      case 'count':
        return await this.calculateCountProgress(userId, quest, completionCriteria);
      case 'duration':
        return await this.calculateDurationProgress(userId, quest, completionCriteria);
      case 'streak':
        return await this.calculateStreakProgress(userId, quest, completionCriteria);
      default:
        return 0;
    }
  }

  private async calculateCountProgress(userId: string, quest: any, criteria: any): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let count = 0;
    
    switch (quest.type) {
      case 'daily_tasks':
        count = await this.prisma.task.count({
          where: {
            userId,
            completed: true,
            updatedAt: { gte: today }
          }
        });
        break;
      case 'weekly_goals':
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - today.getDay());
        count = await this.prisma.goal.count({
          where: {
            userId,
            completed: true,
            updatedAt: { gte: weekStart }
          }
        });
        break;
    }

    return Math.min(100, (count / criteria.target) * 100);
  }

  private async calculateDurationProgress(userId: string, quest: any, criteria: any): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalMinutes = 0;
    
    switch (quest.type) {
      case 'daily_focus':
        const todaySessions = await this.prisma.timerSession.findMany({
          where: {
            userId,
            type: 'focus',
            createdAt: { gte: today }
          }
        });
        totalMinutes = todaySessions.reduce((sum, session) => sum + (session.duration || 0), 0);
        break;
    }

    return Math.min(100, (totalMinutes / criteria.target) * 100);
  }

  private async calculateStreakProgress(userId: string, quest: any, criteria: any): Promise<number> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return 0;

    const currentStreak = user.streak || 0;
    return Math.min(100, (currentStreak / criteria.target) * 100);
  }

  private async completeQuest(questId: string, userId: string): Promise<void> {
    const quest = await this.prisma.quests.findUnique({
      where: { id: questId },
      include: { user: true }
    });

    if (!quest || quest.isCompleted === 'true') return;

    // Update quest status
    await this.prisma.quests.update({
      where: { id: questId },
      data: { 
        isCompleted: 'true',
        progress: 100,
        meta: {
          ...(quest.meta as any || {}),
          completedAt: new Date().toISOString()
        }
      }
    });

    // Award XP and tokens
    if (quest.user?.userAddress) {
      await this.gamificationService.completeQuest(
        questId,
        userId,
        quest.user.userAddress
      );
    }

    // Update user stats
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        totalXp: { increment: quest.rewardXp || 0 }
      }
    });
  }

  async sendConnectionQuests(userId: string, userAddress: string): Promise<GeneratedQuest[]> {
    const quests: GeneratedQuest[] = [];
    
    // Get user context for personalized quests
    const userContext = await this.buildUserContext(userId, userAddress);
    const vectorContext = await this.getVectorContext(userId, userContext);
    
    // Check user's last connection time
    const lastConnection = await this.getLastConnectionTime(userId);
    const daysSinceLastConnection = lastConnection ? 
      (Date.now() - lastConnection.getTime()) / (1000 * 60 * 60 * 24) : 7;

    // Send different quests based on connection frequency
    if (daysSinceLastConnection > 7) {
      // Welcome back quests for returning users
      quests.push(...await this.generateWelcomeBackQuests(userContext, vectorContext));
    } else if (daysSinceLastConnection > 1) {
      // Daily check-in quests
      quests.push(...await this.generateDailyCheckinQuests(userContext, vectorContext));
    } else {
      // Multiple connections per day - focus on quick wins
      quests.push(...await this.generateQuickWinQuests(userContext, vectorContext));
    }

    // Add generic onboarding quests for new users
    if (userContext.completedQuests.length < 3) {
      quests.push(...await this.generateOnboardingQuests(userContext));
    }

    // Save and return quests
    await this.saveQuestsToDatabase(quests);
    return quests;
  }

  async sendContextualQuests(
    userId: string, 
    userAddress: string, 
    triggerPoint: 'task_completion' | 'goal_progress' | 'focus_session' | 'note_creation' | 'streak_milestone' | 'level_up' | 'idle_detection'
  ): Promise<GeneratedQuest[]> {
    const quests: GeneratedQuest[] = [];
    const userContext = await this.buildUserContext(userId, userAddress);
    const vectorContext = await this.getVectorContext(userId, userContext);

    switch (triggerPoint) {
      case 'task_completion':
        quests.push(...await this.generateTaskCompletionQuests(userContext, vectorContext));
        break;
      case 'goal_progress':
        quests.push(...await this.generateGoalProgressQuests(userContext, vectorContext));
        break;
      case 'focus_session':
        quests.push(...await this.generateFocusSessionQuests(userContext, vectorContext));
        break;
      case 'note_creation':
        quests.push(...await this.generateNoteCreationQuests(userContext, vectorContext));
        break;
      case 'streak_milestone':
        quests.push(...await this.generateStreakMilestoneQuests(userContext, vectorContext));
        break;
      case 'level_up':
        quests.push(...await this.generateLevelUpQuests(userContext, vectorContext));
        break;
      case 'idle_detection':
        quests.push(...await this.generateIdleDetectionQuests(userContext, vectorContext));
        break;
    }

    await this.saveQuestsToDatabase(quests);
    return quests;
  }

  async generateQuestSuggestions(user: any, limit: number = 5): Promise<any[]> {
    const suggestions: any[] = [];

    // Analyze user's recent activity
    const recentTasks = user.tasks || [];
    const recentGoals = user.goals || [];
    const recentNotes = user.notes || [];
    const recentSessions = user.timerSessions || [];

    // Task-based suggestions
    if (recentTasks.length > 0) {
      const incompleteTasks = recentTasks.filter((task: any) => !task.completed);
      if (incompleteTasks.length > 3) {
        suggestions.push({
          type: 'productivity',
          title: 'Task Completion Sprint',
          description: `You have ${incompleteTasks.length} incomplete tasks. Focus on completing them systematically.`,
          difficulty: 2,
          estimatedReward: { xp: 150, tokens: 15 },
          confidence: 0.8
        });
      }
    }

    // Goal-based suggestions
    if (recentGoals.length > 0) {
      const lowProgressGoals = recentGoals.filter((goal: any) => (goal.progress || 0) < 30);
      if (lowProgressGoals.length > 0) {
        suggestions.push({
          type: 'productivity',
          title: 'Goal Progress Boost',
          description: `You have ${lowProgressGoals.length} goals with low progress. Let's boost them!`,
          difficulty: 3,
          estimatedReward: { xp: 200, tokens: 20 },
          confidence: 0.7
        });
      }
    }

    // Focus session suggestions
    if (recentSessions.length > 0) {
      const avgSessionLength = recentSessions.reduce((sum: number, session: any) => sum + (session.duration || 0), 0) / recentSessions.length;
      if (avgSessionLength < 25) {
        suggestions.push({
          type: 'productivity',
          title: 'Extend Your Focus',
          description: `Your average focus session is ${Math.round(avgSessionLength)} minutes. Let's extend that!`,
          difficulty: 2,
          estimatedReward: { xp: 120, tokens: 12 },
          confidence: 0.6
        });
      }
    }

    return suggestions.slice(0, limit);
  }

  async getQuestTemplates(
    type: string, 
    filters?: {
      category?: string;
      difficulty?: number;
    }
  ): Promise<QuestTemplate[]> {
    let templates = Array.from(this.questTemplates.values());

    // Filter by type
    if (type !== 'all') {
      templates = templates.filter(t => t.type === type);
    }

    // Filter by category
    if (filters?.category) {
      templates = templates.filter(t => t.category === filters.category);
    }

    // Filter by difficulty
    if (filters?.difficulty) {
      templates = templates.filter(t => t.difficulty === filters.difficulty);
    }

    return templates;
  }

  // Helper methods for different quest types
  private async generateWelcomeBackQuests(userContext: UserQuestContext, vectorContext: any[]): Promise<GeneratedQuest[]> {
    const quests: GeneratedQuest[] = [];
    const now = new Date();

    quests.push({
      id: `welcome_back_catchup_${userContext.userId}_${Date.now()}`,
      userId: userContext.userId,
      templateId: 'welcome_back_catchup',
      name: 'Welcome Back! Let\'s Catch Up',
      description: 'Complete 3 tasks to get back into your productive rhythm.',
      type: 'welcome_back',
      category: 'tasks',
      status: 'active',
      progress: 0,
      goal: 3,
      rewardXp: 200,
      rewardTokens: 20,
      difficulty: 2,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      meta: {
        template: 'welcome_back_catchup',
        completionCriteria: { type: 'count', target: 3 },
        priority: 'high'
      }
    });

    return quests;
  }

  private async generateDailyCheckinQuests(userContext: UserQuestContext, vectorContext: any[]): Promise<GeneratedQuest[]> {
    const quests: GeneratedQuest[] = [];
    const now = new Date();

    quests.push({
      id: `daily_planning_${userContext.userId}_${Date.now()}`,
      userId: userContext.userId,
      templateId: 'daily_planning',
      name: 'Plan Your Day',
      description: 'Create 3 tasks for today to set clear priorities.',
      type: 'daily_checkin',
      category: 'tasks',
      status: 'active',
      progress: 0,
      goal: 3,
      rewardXp: 100,
      rewardTokens: 10,
      difficulty: 1,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      meta: {
        template: 'daily_planning',
        completionCriteria: { type: 'count', target: 3 },
        priority: 'medium'
      }
    });

    return quests;
  }

  private async generateQuickWinQuests(userContext: UserQuestContext, vectorContext: any[]): Promise<GeneratedQuest[]> {
    const quests: GeneratedQuest[] = [];
    const now = new Date();

    quests.push({
      id: `quick_focus_${userContext.userId}_${Date.now()}`,
      userId: userContext.userId,
      templateId: 'quick_focus',
      name: 'Quick Focus Burst',
      description: 'Complete a 10-minute focus session for a quick productivity boost.',
      type: 'quick_win',
      category: 'focus',
      status: 'active',
      progress: 0,
      goal: 10,
      rewardXp: 50,
      rewardTokens: 5,
      difficulty: 1,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      meta: {
        template: 'quick_focus',
        completionCriteria: { type: 'duration', target: 10, unit: 'minutes' },
        priority: 'low'
      }
    });

    return quests;
  }

  private async generateOnboardingQuests(userContext: UserQuestContext): Promise<GeneratedQuest[]> {
    const quests: GeneratedQuest[] = [];
    const now = new Date();

    quests.push({
      id: `onboarding_first_task_${userContext.userId}_${Date.now()}`,
      userId: userContext.userId,
      templateId: 'onboarding_first_task',
      name: 'Create Your First Task',
      description: 'Start your productivity journey by creating your first task.',
      type: 'onboarding',
      category: 'tasks',
      status: 'active',
      progress: 0,
      goal: 1,
      rewardXp: 50,
      rewardTokens: 5,
      difficulty: 1,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      meta: {
        template: 'onboarding_first_task',
        completionCriteria: { type: 'count', target: 1 },
        priority: 'high'
      }
    });

    return quests;
  }

  private async generateTaskCompletionQuests(userContext: UserQuestContext, vectorContext: any[]): Promise<GeneratedQuest[]> {
    const quests: GeneratedQuest[] = [];
    const now = new Date();

    quests.push({
      id: `task_streak_${userContext.userId}_${Date.now()}`,
      userId: userContext.userId,
      templateId: 'task_streak',
      name: 'Task Completion Streak',
      description: 'Complete 3 more tasks today to build momentum.',
      type: 'contextual',
      category: 'tasks',
      status: 'active',
      progress: 0,
      goal: 3,
      rewardXp: 120,
      rewardTokens: 12,
      difficulty: 2,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      meta: {
        template: 'task_streak',
        completionCriteria: { type: 'count', target: 3 },
        priority: 'medium'
      }
    });

    return quests;
  }

  private async generateGoalProgressQuests(userContext: UserQuestContext, vectorContext: any[]): Promise<GeneratedQuest[]> {
    const quests: GeneratedQuest[] = [];
    const now = new Date();

    quests.push({
      id: `goal_momentum_${userContext.userId}_${Date.now()}`,
      userId: userContext.userId,
      templateId: 'goal_momentum',
      name: 'Keep the Momentum Going',
      description: 'Make progress on 2 different goals this week.',
      type: 'contextual',
      category: 'goals',
      status: 'active',
      progress: 0,
      goal: 2,
      rewardXp: 200,
      rewardTokens: 20,
      difficulty: 3,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      meta: {
        template: 'goal_momentum',
        completionCriteria: { type: 'count', target: 2 },
        priority: 'medium'
      }
    });

    return quests;
  }

  private async generateFocusSessionQuests(userContext: UserQuestContext, vectorContext: any[]): Promise<GeneratedQuest[]> {
    const quests: GeneratedQuest[] = [];
    const now = new Date();

    quests.push({
      id: `extended_focus_${userContext.userId}_${Date.now()}`,
      userId: userContext.userId,
      templateId: 'extended_focus',
      name: 'Extend Your Focus',
      description: 'Complete a 45-minute focus session to build deep concentration.',
      type: 'contextual',
      category: 'focus',
      status: 'active',
      progress: 0,
      goal: 45,
      rewardXp: 180,
      rewardTokens: 18,
      difficulty: 3,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      meta: {
        template: 'extended_focus',
        completionCriteria: { type: 'duration', target: 45, unit: 'minutes' },
        priority: 'medium'
      }
    });

    return quests;
  }

  private async generateNoteCreationQuests(userContext: UserQuestContext, vectorContext: any[]): Promise<GeneratedQuest[]> {
    const quests: GeneratedQuest[] = [];
    const now = new Date();

    quests.push({
      id: `note_organization_${userContext.userId}_${Date.now()}`,
      userId: userContext.userId,
      templateId: 'note_organization',
      name: 'Organize Your Notes',
      description: 'Add tags or categories to 3 of your recent notes.',
      type: 'contextual',
      category: 'notes',
      status: 'active',
      progress: 0,
      goal: 3,
      rewardXp: 80,
      rewardTokens: 8,
      difficulty: 1,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      meta: {
        template: 'note_organization',
        completionCriteria: { type: 'count', target: 3 },
        priority: 'low'
      }
    });

    return quests;
  }

  private async generateStreakMilestoneQuests(userContext: UserQuestContext, vectorContext: any[]): Promise<GeneratedQuest[]> {
    const quests: GeneratedQuest[] = [];
    const now = new Date();

    quests.push({
      id: `streak_extension_${userContext.userId}_${Date.now()}`,
      userId: userContext.userId,
      templateId: 'streak_extension',
      name: 'Extend Your Streak',
      description: 'Maintain your current streak for 3 more days.',
      type: 'contextual',
      category: 'streak',
      status: 'active',
      progress: 0,
      goal: 3,
      rewardXp: 300,
      rewardTokens: 30,
      difficulty: 4,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      meta: {
        template: 'streak_extension',
        completionCriteria: { type: 'streak', target: 3 },
        priority: 'high'
      }
    });

    return quests;
  }

  private async generateLevelUpQuests(userContext: UserQuestContext, vectorContext: any[]): Promise<GeneratedQuest[]> {
    const quests: GeneratedQuest[] = [];
    const now = new Date();

    quests.push({
      id: `level_celebration_${userContext.userId}_${Date.now()}`,
      userId: userContext.userId,
      templateId: 'level_celebration',
      name: 'Level Up Celebration',
      description: 'Complete 5 tasks to celebrate your new level and build momentum.',
      type: 'contextual',
      category: 'tasks',
      status: 'active',
      progress: 0,
      goal: 5,
      rewardXp: 250,
      rewardTokens: 25,
      difficulty: 3,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      meta: {
        template: 'level_celebration',
        completionCriteria: { type: 'count', target: 5 },
        priority: 'high'
      }
    });

    return quests;
  }

  private async generateIdleDetectionQuests(userContext: UserQuestContext, vectorContext: any[]): Promise<GeneratedQuest[]> {
    const quests: GeneratedQuest[] = [];
    const now = new Date();

    quests.push({
      id: `re_engagement_${userContext.userId}_${Date.now()}`,
      userId: userContext.userId,
      templateId: 're_engagement',
      name: 'Get Back on Track',
      description: 'Complete a simple 5-minute task to re-engage with your productivity.',
      type: 'contextual',
      category: 'tasks',
      status: 'active',
      progress: 0,
      goal: 1,
      rewardXp: 30,
      rewardTokens: 3,
      difficulty: 1,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      meta: {
        template: 're_engagement',
        completionCriteria: { type: 'count', target: 1 },
        priority: 'medium'
      }
    });

    return quests;
  }

  private async getLastConnectionTime(userId: string): Promise<Date | null> {
    // This would typically come from user activity tracking
    // For now, we'll use the last quest creation time as a proxy
    const lastQuest = await this.prisma.quests.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return lastQuest?.createdAt || null;
  }
} 