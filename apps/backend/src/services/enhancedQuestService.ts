import { PrismaClient } from "@prisma/client";
import { PineconeService } from "../ai/memory/pinecone.service";
import { EnhancedContextManager } from "../ai/memory/enhancedContextManager";
import { GamificationService } from "./gamification.service";

export interface QuestTemplate {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'special' | 'adaptive';
  category: 'focus' | 'tasks' | 'goals' | 'mentor' | 'streak' | 'learning' | 'social';
  requirements: string[];
  rewardXp: number;
  rewardTokens: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  vectorContextTypes?: string[];
  adaptivePrompt?: string;
  completionCriteria: {
    type: 'count' | 'duration' | 'streak' | 'custom';
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
    // Daily Quests
    this.questTemplates.set('daily_focus_30', {
      id: 'daily_focus_30',
      name: 'Daily Focus',
      description: 'Complete 30 minutes of focused work today',
      type: 'daily',
      category: 'focus',
      requirements: ['focus_30_min'],
      rewardXp: 100,
      rewardTokens: 10,
      difficulty: 1,
      vectorContextTypes: ['sessions', 'tasks'],
      completionCriteria: { type: 'duration', target: 30, unit: 'minutes' }
    });

    this.questTemplates.set('daily_tasks_3', {
      id: 'daily_tasks_3',
      name: 'Task Master',
      description: 'Complete 3 tasks today',
      type: 'daily',
      category: 'tasks',
      requirements: ['complete_3_tasks'],
      rewardXp: 150,
      rewardTokens: 15,
      difficulty: 2,
      vectorContextTypes: ['tasks', 'goals'],
      completionCriteria: { type: 'count', target: 3 }
    });

    this.questTemplates.set('daily_mentor_chat', {
      id: 'daily_mentor_chat',
      name: 'Mentor Connection',
      description: 'Have a meaningful conversation with your AI mentor',
      type: 'daily',
      category: 'mentor',
      requirements: ['mentor_chat'],
      rewardXp: 50,
      rewardTokens: 5,
      difficulty: 1,
      vectorContextTypes: ['messages', 'profile'],
      completionCriteria: { type: 'count', target: 1 }
    });

    // Weekly Quests
    this.questTemplates.set('weekly_focus_300', {
      id: 'weekly_focus_300',
      name: 'Focus Warrior',
      description: 'Complete 5 hours of focused work this week',
      type: 'weekly',
      category: 'focus',
      requirements: ['focus_300_min'],
      rewardXp: 500,
      rewardTokens: 50,
      difficulty: 3,
      vectorContextTypes: ['sessions', 'tasks'],
      completionCriteria: { type: 'duration', target: 300, unit: 'minutes' }
    });

    this.questTemplates.set('weekly_goals_2', {
      id: 'weekly_goals_2',
      name: 'Goal Achiever',
      description: 'Complete 2 goals this week',
      type: 'weekly',
      category: 'goals',
      requirements: ['complete_2_goals'],
      rewardXp: 300,
      rewardTokens: 30,
      difficulty: 3,
      vectorContextTypes: ['goals', 'tasks'],
      completionCriteria: { type: 'count', target: 2 }
    });

    // Special Quests
    this.questTemplates.set('special_streak_7', {
      id: 'special_streak_7',
      name: 'Week Warrior',
      description: 'Maintain a 7-day focus streak',
      type: 'special',
      category: 'streak',
      requirements: ['streak_7_days'],
      rewardXp: 1000,
      rewardTokens: 100,
      difficulty: 4,
      vectorContextTypes: ['sessions', 'profile'],
      completionCriteria: { type: 'streak', target: 7, unit: 'days' },
      maxCompletions: 1
    });

    this.questTemplates.set('special_deep_dive', {
      id: 'special_deep_dive',
      name: 'Deep Dive Master',
      description: 'Complete a 90-minute deep focus session',
      type: 'special',
      category: 'focus',
      requirements: ['deep_focus_90'],
      rewardXp: 200,
      rewardTokens: 20,
      difficulty: 4,
      vectorContextTypes: ['sessions'],
      completionCriteria: { type: 'duration', target: 90, unit: 'minutes' }
    });

    // Adaptive Quests
    this.questTemplates.set('adaptive_personalized', {
      id: 'adaptive_personalized',
      name: 'Personalized Challenge',
      description: 'Complete a challenge tailored to your current situation',
      type: 'adaptive',
      category: 'learning',
      requirements: ['adaptive_challenge'],
      rewardXp: 200,
      rewardTokens: 20,
      difficulty: 3,
      vectorContextTypes: ['tasks', 'goals', 'sessions', 'messages', 'profile'],
      adaptivePrompt: 'Generate a personalized quest based on the user\'s current context, goals, and recent activity patterns.',
      completionCriteria: { type: 'custom', target: 1 }
    });
  }

  private initializeAdaptivePrompts(): void {
    this.adaptiveQuestPrompts.set('morning_person', 
      'Create a morning-focused quest that encourages early productivity and sets a positive tone for the day.');
    
    this.adaptiveQuestPrompts.set('evening_owl',
      'Design an evening quest that helps wind down while still maintaining productivity and reflection.');
    
    this.adaptiveQuestPrompts.set('weekend_warrior',
      'Generate a weekend quest that balances relaxation with meaningful progress on personal projects.');
    
    this.adaptiveQuestPrompts.set('stress_relief',
      'Create a quest focused on stress management and mental well-being through mindful productivity.');
    
    this.adaptiveQuestPrompts.set('skill_development',
      'Design a quest that encourages learning and skill development based on the user\'s interests and goals.');
  }

  /**
   * Generate quests for a user with enhanced context and personalization
   */
  async generateQuestsForUser(userId: string, userAddress: string): Promise<GeneratedQuest[]> {
    console.log(`Generating enhanced quests for user: ${userId}`);

    // Get user context
    const userContext = await this.buildUserContext(userId, userAddress);
    
    // Get vector-based context
    const vectorContext = await this.getVectorContext(userId, userContext);
    
    // Generate quests based on templates and context
    const generatedQuests: GeneratedQuest[] = [];
    
    // Generate daily quests
    const dailyQuests = await this.generateDailyQuests(userContext, vectorContext);
    generatedQuests.push(...dailyQuests);
    
    // Generate weekly quests
    const weeklyQuests = await this.generateWeeklyQuests(userContext, vectorContext);
    generatedQuests.push(...weeklyQuests);
    
    // Generate special quests
    const specialQuests = await this.generateSpecialQuests(userContext, vectorContext);
    generatedQuests.push(...specialQuests);
    
    // Generate adaptive quests
    const adaptiveQuests = await this.generateAdaptiveQuests(userContext, vectorContext);
    generatedQuests.push(...adaptiveQuests);

    // Save quests to database
    await this.saveQuestsToDatabase(generatedQuests);

    return generatedQuests;
  }

  /**
   * Build comprehensive user context for quest generation
   */
  private async buildUserContext(userId: string, userAddress: string): Promise<UserQuestContext> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        timerSessions: {
          where: {
            startTime: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          },
          orderBy: { startTime: 'desc' }
        },
        tasks: {
          where: {
            updatedAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        },
        goals: {
          where: {
            updatedAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        },
        quests: true,
        badges: true
      }
    });

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    // Calculate user stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayFocusSessions = user.timerSessions.filter(s => 
      s.startTime >= today && s.type === 'focus'
    );
    
    const todayCompletedTasks = user.tasks.filter(t => 
      t.completed && t.updatedAt >= today
    );
    
    const todayCompletedGoals = user.goals.filter(g => 
      g.completed && g.updatedAt >= today
    );

    // Determine user preferences based on activity patterns
    const preferences = this.analyzeUserPreferences(user.timerSessions, user.tasks, user.goals);

    return {
      userId,
      userAddress,
      level: user.level || 1,
      totalXp: user.totalXp || 0,
      streak: user.streak || 0,
      completedQuests: user.quests.filter(q => q.isCompleted === 'true').map(q => q.type),
      recentActivity: {
        focusSessions: todayFocusSessions.length,
        completedTasks: todayCompletedTasks.length,
        completedGoals: todayCompletedGoals.length,
        mentorChats: 0, // TODO: Get from chat history
        lastActive: user.updatedAt
      },
      preferences,
      vectorContext: []
    };
  }

  /**
   * Get vector-based context for quest personalization
   */
  private async getVectorContext(userId: string, userContext: UserQuestContext): Promise<any[]> {
    try {
      // Create a context query based on user's recent activity
      const contextQuery = this.buildContextQuery(userContext);
      
      const vectorContext = await this.pineconeService.retrieveUserContext(
        userId,
        contextQuery,
        5, // Get top 5 most relevant items
        ['tasks', 'goals', 'sessions', 'messages', 'profile']
      );

      return vectorContext;
    } catch (error) {
      console.warn('Vector context retrieval failed:', error);
      return [];
    }
  }

  /**
   * Build a context query for vector search based on user activity
   */
  private buildContextQuery(userContext: UserQuestContext): string {
    const { recentActivity, preferences } = userContext;
    
    let query = 'user activity context: ';
    
    if (recentActivity.focusSessions > 0) {
      query += `focus sessions: ${recentActivity.focusSessions}, `;
    }
    
    if (recentActivity.completedTasks > 0) {
      query += `completed tasks: ${recentActivity.completedTasks}, `;
    }
    
    if (recentActivity.completedGoals > 0) {
      query += `completed goals: ${recentActivity.completedGoals}, `;
    }
    
    if (preferences.preferredCategories.length > 0) {
      query += `preferred categories: ${preferences.preferredCategories.join(', ')}, `;
    }
    
    query += `level: ${userContext.level}, streak: ${userContext.streak}`;
    
    return query;
  }

  /**
   * Analyze user preferences based on activity patterns
   */
  private analyzeUserPreferences(sessions: any[], tasks: any[], goals: any[]): UserQuestContext['preferences'] {
    const categories = {
      focus: sessions.filter(s => s.type === 'focus').length,
      tasks: tasks.length,
      goals: goals.length,
      mentor: 0, // TODO: Get from chat history
      streak: 0,
      learning: 0,
      social: 0
    };

    const preferredCategories = Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);

    // Determine time of day preference
    const sessionHours = sessions.map(s => new Date(s.startTime).getHours());
    const avgHour = sessionHours.length > 0 ? 
      sessionHours.reduce((sum, hour) => sum + hour, 0) / sessionHours.length : 12;
    
    let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'any';
    if (avgHour < 12) timeOfDay = 'morning';
    else if (avgHour < 17) timeOfDay = 'afternoon';
    else timeOfDay = 'evening';

    return {
      preferredCategories,
      difficultyPreference: Math.min(5, Math.max(1, Math.floor(sessions.length / 5) + 1)),
      timeOfDay
    };
  }

  /**
   * Generate daily quests with context awareness
   */
  private async generateDailyQuests(userContext: UserQuestContext, vectorContext: any[]): Promise<GeneratedQuest[]> {
    const quests: GeneratedQuest[] = [];
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    // Get daily quest templates
    const dailyTemplates = Array.from(this.questTemplates.values())
      .filter(t => t.type === 'daily');

    for (const template of dailyTemplates) {
      // Check if user already has this quest today
      const existingQuest = await this.prisma.quests.findFirst({
        where: {
          userId: userContext.userId,
          type: template.id,
          createdAt: {
            gte: today
          }
        }
      });

      if (existingQuest) continue;

      // Check cooldown
      if (template.cooldown) {
        const lastCompletion = await this.prisma.quests.findFirst({
          where: {
            userId: userContext.userId,
            type: template.id,
            isCompleted: 'true'
          },
          orderBy: { updatedAt: 'desc' }
        });

        if (lastCompletion && 
            Date.now() - lastCompletion.updatedAt!.getTime() < template.cooldown * 60 * 60 * 1000) {
          continue;
        }
      }

      // Check max completions
      if (template.maxCompletions) {
        const completionCount = await this.prisma.quests.count({
          where: {
            userId: userContext.userId,
            type: template.id,
            isCompleted: 'true'
          }
        });

        if (completionCount >= template.maxCompletions) continue;
      }

      // Personalize quest description based on vector context
      const personalizedDescription = await this.personalizeQuestDescription(
        template,
        userContext,
        vectorContext
      );

      const quest: GeneratedQuest = {
        id: `${template.id}_${userContext.userId}_${Date.now()}`,
        userId: userContext.userId,
        templateId: template.id,
        name: template.name,
        description: personalizedDescription,
        type: template.type,
        category: template.category,
        status: 'active',
        progress: 0,
        goal: template.completionCriteria.target,
        rewardXp: template.rewardXp,
        rewardTokens: template.rewardTokens,
        difficulty: template.difficulty,
        createdAt: today,
        expiresAt: tomorrow,
        vectorContext: vectorContext.filter(ctx => 
          template.vectorContextTypes?.includes(ctx.type)
        ),
        meta: {
          template: template.id,
          requirements: template.requirements,
          completionCriteria: template.completionCriteria
        }
      };

      quests.push(quest);
    }

    return quests;
  }

  /**
   * Generate weekly quests
   */
  private async generateWeeklyQuests(userContext: UserQuestContext, vectorContext: any[]): Promise<GeneratedQuest[]> {
    const quests: GeneratedQuest[] = [];
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()));
    weekEnd.setHours(23, 59, 59, 999);

    const weeklyTemplates = Array.from(this.questTemplates.values())
      .filter(t => t.type === 'weekly');

    for (const template of weeklyTemplates) {
      const existingQuest = await this.prisma.quests.findFirst({
        where: {
          userId: userContext.userId,
          type: template.id,
          createdAt: {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      });

      if (existingQuest) continue;

      const personalizedDescription = await this.personalizeQuestDescription(
        template,
        userContext,
        vectorContext
      );

      const quest: GeneratedQuest = {
        id: `${template.id}_${userContext.userId}_${Date.now()}`,
        userId: userContext.userId,
        templateId: template.id,
        name: template.name,
        description: personalizedDescription,
        type: template.type,
        category: template.category,
        status: 'active',
        progress: 0,
        goal: template.completionCriteria.target,
        rewardXp: template.rewardXp,
        rewardTokens: template.rewardTokens,
        difficulty: template.difficulty,
        createdAt: now,
        expiresAt: weekEnd,
        vectorContext: vectorContext.filter(ctx => 
          template.vectorContextTypes?.includes(ctx.type)
        ),
        meta: {
          template: template.id,
          requirements: template.requirements,
          completionCriteria: template.completionCriteria
        }
      };

      quests.push(quest);
    }

    return quests;
  }

  /**
   * Generate special quests
   */
  private async generateSpecialQuests(userContext: UserQuestContext, vectorContext: any[]): Promise<GeneratedQuest[]> {
    const quests: GeneratedQuest[] = [];
    const specialTemplates = Array.from(this.questTemplates.values())
      .filter(t => t.type === 'special');

    for (const template of specialTemplates) {
      // Check if user already completed this special quest
      const existingQuest = await this.prisma.quests.findFirst({
        where: {
          userId: userContext.userId,
          type: template.id,
          isCompleted: 'true'
        }
      });

      if (existingQuest) continue;

      // Check prerequisites
      if (template.prerequisites) {
        const hasPrerequisites = await this.checkPrerequisites(
          userContext.userId,
          template.prerequisites
        );
        if (!hasPrerequisites) continue;
      }

      const personalizedDescription = await this.personalizeQuestDescription(
        template,
        userContext,
        vectorContext
      );

      const quest: GeneratedQuest = {
        id: `${template.id}_${userContext.userId}_${Date.now()}`,
        userId: userContext.userId,
        templateId: template.id,
        name: template.name,
        description: personalizedDescription,
        type: template.type,
        category: template.category,
        status: 'active',
        progress: 0,
        goal: template.completionCriteria.target,
        rewardXp: template.rewardXp,
        rewardTokens: template.rewardTokens,
        difficulty: template.difficulty,
        createdAt: new Date(),
        vectorContext: vectorContext.filter(ctx => 
          template.vectorContextTypes?.includes(ctx.type)
        ),
        meta: {
          template: template.id,
          requirements: template.requirements,
          completionCriteria: template.completionCriteria
        }
      };

      quests.push(quest);
    }

    return quests;
  }

  /**
   * Generate adaptive quests using AI
   */
  private async generateAdaptiveQuests(userContext: UserQuestContext, vectorContext: any[]): Promise<GeneratedQuest[]> {
    const quests: GeneratedQuest[] = [];

    try {
      // Use enhanced context manager to generate personalized quest
      const enhancedContext = await this.enhancedContextManager.generateEnhancedContext({
        userId: userContext.userId,
        userMessage: 'Generate a personalized quest based on my current context and goals',
        useCase: 'quest_generation',
        contextSources: ['tasks', 'goals', 'sessions', 'messages', 'profile'],
        enableVectorSearch: true,
        maxVectorResults: 5,
        extraData: {
          userLevel: userContext.level,
          userStreak: userContext.streak,
          recentActivity: userContext.recentActivity,
          preferences: userContext.preferences
        }
      });

      // Generate adaptive quest using AI
      const adaptiveQuest = await this.generateAdaptiveQuestWithAI(
        enhancedContext.enhancedPrompt,
        userContext,
        vectorContext
      );

      if (adaptiveQuest) {
        quests.push(adaptiveQuest);
      }
    } catch (error) {
      console.error('Failed to generate adaptive quest:', error);
    }

    return quests;
  }

  /**
   * Generate adaptive quest using AI
   */
  private async generateAdaptiveQuestWithAI(
    enhancedPrompt: string,
    userContext: UserQuestContext,
    vectorContext: any[]
  ): Promise<GeneratedQuest | null> {
    // This would integrate with your AI service to generate personalized quests
    // For now, we'll create a template-based adaptive quest
    
    const adaptiveTemplate = this.questTemplates.get('adaptive_personalized');
    if (!adaptiveTemplate) return null;

    const personalizedDescription = await this.personalizeQuestDescription(
      adaptiveTemplate,
      userContext,
      vectorContext
    );

    return {
      id: `adaptive_${userContext.userId}_${Date.now()}`,
      userId: userContext.userId,
      templateId: adaptiveTemplate.id,
      name: 'Personalized Challenge',
      description: personalizedDescription,
      type: 'adaptive',
      category: 'learning',
      status: 'active',
      progress: 0,
      goal: 1,
      rewardXp: adaptiveTemplate.rewardXp,
      rewardTokens: adaptiveTemplate.rewardTokens,
      difficulty: adaptiveTemplate.difficulty,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      vectorContext,
      adaptiveDescription: personalizedDescription,
      meta: {
        template: adaptiveTemplate.id,
        aiGenerated: true,
        enhancedPrompt,
        requirements: adaptiveTemplate.requirements,
        completionCriteria: adaptiveTemplate.completionCriteria
      }
    };
  }

  /**
   * Personalize quest description based on user context
   */
  private async personalizeQuestDescription(
    template: QuestTemplate,
    userContext: UserQuestContext,
    vectorContext: any[]
  ): Promise<string> {
    let description = template.description;

    // Add personalization based on vector context
    if (vectorContext.length > 0 && template.vectorContextTypes) {
      const relevantContext = vectorContext.filter(ctx => 
        template.vectorContextTypes?.includes(ctx.type)
      );

      if (relevantContext.length > 0) {
        const contextInfo = relevantContext[0];
        description += `\n\nBased on your recent ${contextInfo.type}: "${contextInfo.content.substring(0, 100)}..."`;
      }
    }

    // Add level-appropriate language
    if (userContext.level < 3) {
      description += '\n\nThis is a great starting point for your productivity journey!';
    } else if (userContext.level > 7) {
      description += '\n\nYou\'re a productivity veteran - this should be a breeze!';
    }

    // Add streak motivation
    if (userContext.streak > 0) {
      description += `\n\nKeep your ${userContext.streak}-day streak going!`;
    }

    return description;
  }

  /**
   * Check if user meets quest prerequisites
   */
  private async checkPrerequisites(userId: string, prerequisites: string[]): Promise<boolean> {
    for (const prerequisite of prerequisites) {
      const [type, value] = prerequisite.split('_');
      
      switch (type) {
        case 'level':
          const user = await this.prisma.user.findUnique({ where: { id: userId } });
          if (!user || (user.level || 1) < parseInt(value)) return false;
          break;
        case 'quest':
          const quest = await this.prisma.quests.findFirst({
            where: {
              userId,
              type: value,
              isCompleted: 'true'
            }
          });
          if (!quest) return false;
          break;
        // Add more prerequisite types as needed
      }
    }
    return true;
  }

  /**
   * Save generated quests to database
   */
  private async saveQuestsToDatabase(quests: GeneratedQuest[]): Promise<void> {
    for (const quest of quests) {
      await this.prisma.quests.create({
        data: {
          id: quest.id,
          userId: quest.userId,
          type: quest.templateId,
          name: quest.name,
          description: quest.description,
          requirements: quest.meta.requirements,
          rewardXp: quest.rewardXp,
          difficulty: quest.difficulty,
          progress: quest.progress,
          isCompleted: 'false',
          meta: quest.meta as any
        }
      });
    }
  }

  /**
   * Update quest progress based on user activity
   */
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

  /**
   * Calculate quest progress based on user activity
   */
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
      case 'daily_tasks_3':
        count = await this.prisma.task.count({
          where: {
            userId,
            completed: true,
            updatedAt: { gte: today }
          }
        });
        break;
      case 'weekly_goals_2':
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
      case 'daily_focus_30':
        const todaySessions = await this.prisma.timerSession.findMany({
          where: {
            userId,
            type: 'focus',
            startTime: { gte: today }
          }
        });
        totalMinutes = todaySessions.reduce((sum, session) => sum + session.duration / 60, 0);
        break;
      case 'weekly_focus_300':
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - today.getDay());
        const weekSessions = await this.prisma.timerSession.findMany({
          where: {
            userId,
            type: 'focus',
            startTime: { gte: weekStart }
          }
        });
        totalMinutes = weekSessions.reduce((sum, session) => sum + session.duration / 60, 0);
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

  /**
   * Complete a quest and award rewards
   */
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
} 