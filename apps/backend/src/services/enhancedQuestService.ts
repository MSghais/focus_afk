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
   * Create a generic quest manually
   */
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

  /**
   * Create a suggestion quest based on AI analysis
   */
  async createSuggestionQuest(questData: {
    userId: string;
    userAddress: string;
    suggestionType: 'productivity' | 'wellness' | 'learning' | 'social' | 'custom';
    context: any[];
    aiReasoning: string;
    difficulty?: 1 | 2 | 3 | 4 | 5;
    expiresAt?: Date;
  }): Promise<GeneratedQuest> {
    // Generate quest details based on suggestion type
    const questDetails = await this.generateSuggestionQuestDetails(
      questData.suggestionType,
      questData.context,
      questData.aiReasoning
    );

    const quest: GeneratedQuest = {
      id: `suggestion_${questData.userId}_${Date.now()}`,
      userId: questData.userId,
      templateId: 'suggestion',
      name: questDetails.name,
      description: questDetails.description,
      type: 'suggestion',
      category: questDetails.category,
      status: 'active',
      progress: 0,
      goal: questDetails.completionCriteria.target,
      rewardXp: questDetails.rewardXp,
      rewardTokens: questDetails.rewardTokens,
      difficulty: questData.difficulty || questDetails.difficulty,
      createdAt: new Date(),
      expiresAt: questData.expiresAt,
      vectorContext: questData.context,
      meta: {
        template: 'suggestion',
        suggestionType: questData.suggestionType,
        aiReasoning: questData.aiReasoning,
        completionCriteria: questDetails.completionCriteria,
        generatedBy: 'ai',
        confidence: questDetails.confidence
      }
    };

    // Save to database
    await this.saveQuestsToDatabase([quest]);

    return quest;
  }

  /**
   * Generate quest details for suggestion quests
   */
  private async generateSuggestionQuestDetails(
    suggestionType: string,
    context: any[],
    aiReasoning: string
  ): Promise<{
    name: string;
    description: string;
    category: string;
    difficulty: number;
    rewardXp: number;
    rewardTokens: number;
    completionCriteria: any;
    confidence: number;
  }> {
    // Use AI to generate quest details based on context and reasoning
    const prompt = `
      Based on the following context and AI reasoning, generate a quest suggestion:
      
      Context: ${JSON.stringify(context)}
      AI Reasoning: ${aiReasoning}
      Suggestion Type: ${suggestionType}
      
      Generate a quest with:
      - Name (engaging and specific)
      - Description (clear and motivating)
      - Category (focus, tasks, goals, notes, learning, social, custom)
      - Difficulty (1-5, where 1 is easy, 5 is very challenging)
      - Reward XP (10-500 based on difficulty)
      - Reward Tokens (1-50 based on difficulty)
      - Completion Criteria (type: count/duration/streak/custom, target: number, unit: optional)
      - Confidence (0-1, how confident the AI is in this suggestion)
      
      Return as JSON:
      {
        "name": "Quest Name",
        "description": "Quest description",
        "category": "category",
        "difficulty": 3,
        "rewardXp": 150,
        "rewardTokens": 15,
        "completionCriteria": {"type": "count", "target": 5},
        "confidence": 0.8
      }
    `;

    try {
      const response = await this.enhancedContextManager.generateResponse(
        'quest_generation',
        prompt,
        context
      );

      // Parse AI response
      const questDetails = JSON.parse(response.text);
      return {
        name: questDetails.name,
        description: questDetails.description,
        category: questDetails.category,
        difficulty: questDetails.difficulty,
        rewardXp: questDetails.rewardXp,
        rewardTokens: questDetails.rewardTokens,
        completionCriteria: questDetails.completionCriteria,
        confidence: questDetails.confidence
      };
    } catch (error) {
      console.error('Error generating suggestion quest details:', error);
      
      // Fallback quest details
      return {
        name: `${suggestionType.charAt(0).toUpperCase() + suggestionType.slice(1)} Challenge`,
        description: `Complete a ${suggestionType} activity based on AI analysis of your patterns.`,
        category: 'custom',
        difficulty: 2,
        rewardXp: 100,
        rewardTokens: 10,
        completionCriteria: { type: 'count', target: 1 },
        confidence: 0.5
      };
    }
  }

  /**
   * Send quests at user connection
   */
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

  /**
   * Send quests at specific app usage points
   */
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

  /**
   * Generate welcome back quests for returning users
   */
  private async generateWelcomeBackQuests(userContext: UserQuestContext, vectorContext: any[]): Promise<GeneratedQuest[]> {
    const quests: GeneratedQuest[] = [];
    const now = new Date();

    // Catch-up quest
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
      expiresAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days
      meta: {
        template: 'welcome_back_catchup',
        completionCriteria: { type: 'count', target: 3 },
        priority: 'high'
      }
    });

    // Focus restart quest
    quests.push({
      id: `welcome_back_focus_${userContext.userId}_${Date.now()}`,
      userId: userContext.userId,
      templateId: 'welcome_back_focus',
      name: 'Restart Your Focus Engine',
      description: 'Complete a 25-minute focus session to rebuild your concentration.',
      type: 'welcome_back',
      category: 'focus',
      status: 'active',
      progress: 0,
      goal: 25,
      rewardXp: 150,
      rewardTokens: 15,
      difficulty: 2,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days
      meta: {
        template: 'welcome_back_focus',
        completionCriteria: { type: 'duration', target: 25, unit: 'minutes' },
        priority: 'high'
      }
    });

    return quests;
  }

  /**
   * Generate daily check-in quests
   */
  private async generateDailyCheckinQuests(userContext: UserQuestContext, vectorContext: any[]): Promise<GeneratedQuest[]> {
    const quests: GeneratedQuest[] = [];
    const now = new Date();

    // Daily planning quest
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
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 1 day
      meta: {
        template: 'daily_planning',
        completionCriteria: { type: 'count', target: 3 },
        priority: 'medium'
      }
    });

    return quests;
  }

  /**
   * Generate quick win quests for frequent users
   */
  private async generateQuickWinQuests(userContext: UserQuestContext, vectorContext: any[]): Promise<GeneratedQuest[]> {
    const quests: GeneratedQuest[] = [];
    const now = new Date();

    // Micro focus quest
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
      expiresAt: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours
      meta: {
        template: 'quick_focus',
        completionCriteria: { type: 'duration', target: 10, unit: 'minutes' },
        priority: 'low'
      }
    });

    return quests;
  }

  /**
   * Generate onboarding quests for new users
   */
  private async generateOnboardingQuests(userContext: UserQuestContext): Promise<GeneratedQuest[]> {
    const quests: GeneratedQuest[] = [];
    const now = new Date();

    // First task quest
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
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days
      meta: {
        template: 'onboarding_first_task',
        completionCriteria: { type: 'count', target: 1 },
        priority: 'high'
      }
    });

    // First focus session quest
    quests.push({
      id: `onboarding_first_focus_${userContext.userId}_${Date.now()}`,
      userId: userContext.userId,
      templateId: 'onboarding_first_focus',
      name: 'Try Your First Focus Session',
      description: 'Experience the power of focused work with a 15-minute session.',
      type: 'onboarding',
      category: 'focus',
      status: 'active',
      progress: 0,
      goal: 15,
      rewardXp: 75,
      rewardTokens: 8,
      difficulty: 1,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days
      meta: {
        template: 'onboarding_first_focus',
        completionCriteria: { type: 'duration', target: 15, unit: 'minutes' },
        priority: 'high'
      }
    });

    return quests;
  }

  /**
   * Generate quests based on vector search recommendations
   */
  private async generateRecommendedQuests(
    userContext: UserQuestContext, 
    vectorContext: any[], 
    recentQuests: any[], 
    recentActivities: any[]
  ): Promise<GeneratedQuest[]> {
    const quests: GeneratedQuest[] = [];
    const now = new Date();

    // Analyze vector context for patterns and recommendations
    const recommendations = await this.analyzeVectorContextForRecommendations(
      vectorContext, 
      userContext, 
      recentQuests, 
      recentActivities
    );

    for (const recommendation of recommendations) {
      // Create quest template based on recommendation
      const questTemplate = await this.createAdaptiveQuestTemplate(recommendation);
      
      if (!questTemplate) continue;

      const quest: GeneratedQuest = {
        id: `adaptive_${recommendation.type}_${userContext.userId}_${Date.now()}`,
        userId: userContext.userId,
        templateId: questTemplate.id,
        name: questTemplate.name,
        description: questTemplate.description,
        type: 'adaptive',
        category: recommendation.category,
        status: 'active',
        progress: 0,
        goal: questTemplate.completionCriteria.target,
        rewardXp: questTemplate.rewardXp,
        rewardTokens: questTemplate.rewardTokens,
        difficulty: recommendation.difficulty,
        createdAt: now,
        expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days
        vectorContext: recommendation.relevantContext,
        meta: {
          template: questTemplate.id,
          recommendation: recommendation.reason,
          requirements: questTemplate.requirements,
          completionCriteria: questTemplate.completionCriteria,
          similarityScore: recommendation.similarityScore
        }
      };

      quests.push(quest);
    }

    return quests;
  }

  /**
   * Analyze vector context for quest recommendations
   */
  private async analyzeVectorContextForRecommendations(
    vectorContext: any[], 
    userContext: UserQuestContext, 
    recentQuests: any[], 
    recentActivities: any[]
  ): Promise<any[]> {
    const recommendations: any[] = [];

    // Group vector context by type
    const tasks = vectorContext.filter(ctx => ctx.type === 'task');
    const goals = vectorContext.filter(ctx => ctx.type === 'goal');
    const notes = vectorContext.filter(ctx => ctx.type === 'note');
    const focusSessions = vectorContext.filter(ctx => ctx.type === 'focus_session');

    // Analyze task patterns
    if (tasks.length > 0) {
      const taskRecommendations = await this.analyzeTaskPatterns(tasks, recentQuests, recentActivities);
      recommendations.push(...taskRecommendations);
    }

    // Analyze goal patterns
    if (goals.length > 0) {
      const goalRecommendations = await this.analyzeGoalPatterns(goals, recentQuests, recentActivities);
      recommendations.push(...goalRecommendations);
    }

    // Analyze note patterns
    if (notes.length > 0) {
      const noteRecommendations = await this.analyzeNotePatterns(notes, recentQuests, recentActivities);
      recommendations.push(...noteRecommendations);
    }

    // Analyze focus session patterns
    if (focusSessions.length > 0) {
      const focusRecommendations = await this.analyzeFocusPatterns(focusSessions, recentQuests, recentActivities);
      recommendations.push(...focusRecommendations);
    }

    // Sort by relevance and remove duplicates
    return this.deduplicateAndSortRecommendations(recommendations);
  }

  /**
   * Analyze task patterns for quest recommendations
   */
  private async analyzeTaskPatterns(tasks: any[], recentQuests: any[], recentActivities: any[]): Promise<any[]> {
    const recommendations: any[] = [];

    // Find incomplete tasks
    const incompleteTasks = tasks.filter(task => !task.completed);
    
    // Find high-priority tasks
    const highPriorityTasks = tasks.filter(task => task.priority === 'high');
    
    // Find overdue tasks
    const overdueTasks = tasks.filter(task => {
      if (!task.dueDate) return false;
      return new Date(task.dueDate) < new Date();
    });

    // Generate recommendations based on patterns
    if (incompleteTasks.length > 5) {
      recommendations.push({
        type: 'task_completion',
        category: 'tasks',
        difficulty: 2,
        reason: `You have ${incompleteTasks.length} incomplete tasks. Focus on completing them systematically.`,
        relevantContext: incompleteTasks.slice(0, 3),
        similarityScore: 0.8
      });
    }

    if (highPriorityTasks.length > 0) {
      recommendations.push({
        type: 'priority_focus',
        category: 'tasks',
        difficulty: 3,
        reason: `You have ${highPriorityTasks.length} high-priority tasks. Focus on completing them first.`,
        relevantContext: highPriorityTasks.slice(0, 2),
        similarityScore: 0.9
      });
    }

    if (overdueTasks.length > 0) {
      recommendations.push({
        type: 'catch_up',
        category: 'tasks',
        difficulty: 4,
        reason: `You have ${overdueTasks.length} overdue tasks. Time to catch up!`,
        relevantContext: overdueTasks.slice(0, 2),
        similarityScore: 0.95
      });
    }

    return recommendations;
  }

  /**
   * Analyze goal patterns for quest recommendations
   */
  private async analyzeGoalPatterns(goals: any[], recentQuests: any[], recentActivities: any[]): Promise<any[]> {
    const recommendations: any[] = [];

    // Find active goals
    const activeGoals = goals.filter(goal => goal.status === 'active' || !goal.completed);
    
    // Find goals with low progress
    const lowProgressGoals = goals.filter(goal => {
      const progress = goal.progress || 0;
      return progress < 30; // Less than 30% complete
    });

    // Find goals nearing deadline
    const deadlineGoals = goals.filter(goal => {
      if (!goal.dueDate) return false;
      const daysUntilDeadline = (new Date(goal.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
      return daysUntilDeadline <= 7 && daysUntilDeadline > 0;
    });

    if (lowProgressGoals.length > 0) {
      recommendations.push({
        type: 'goal_progress',
        category: 'goals',
        difficulty: 3,
        reason: `You have ${lowProgressGoals.length} goals with low progress. Let's boost them!`,
        relevantContext: lowProgressGoals.slice(0, 2),
        similarityScore: 0.85
      });
    }

    if (deadlineGoals.length > 0) {
      recommendations.push({
        type: 'deadline_push',
        category: 'goals',
        difficulty: 4,
        reason: `You have ${deadlineGoals.length} goals with upcoming deadlines. Time to push hard!`,
        relevantContext: deadlineGoals,
        similarityScore: 0.95
      });
    }

    return recommendations;
  }

  /**
   * Analyze note patterns for quest recommendations
   */
  private async analyzeNotePatterns(notes: any[], recentQuests: any[], recentActivities: any[]): Promise<any[]> {
    const recommendations: any[] = [];

    // Find notes with action items
    const actionNotes = notes.filter(note => 
      note.text?.includes('TODO') || 
      note.text?.includes('ACTION') || 
      note.text?.includes('DO') ||
      note.text?.includes('REVIEW')
    );

    // Find notes that haven't been reviewed recently
    const unreviewedNotes = notes.filter(note => {
      const lastReview = note.lastReviewed || note.createdAt;
      const daysSinceReview = (new Date().getTime() - new Date(lastReview).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceReview > 7;
    });

    if (actionNotes.length > 0) {
      recommendations.push({
        type: 'note_actions',
        category: 'notes',
        difficulty: 2,
        reason: `You have ${actionNotes.length} notes with action items. Let's tackle them!`,
        relevantContext: actionNotes.slice(0, 3),
        similarityScore: 0.8
      });
    }

    if (unreviewedNotes.length > 5) {
      recommendations.push({
        type: 'note_review',
        category: 'notes',
        difficulty: 1,
        reason: `You have ${unreviewedNotes.length} notes that haven't been reviewed recently. Time for a review session!`,
        relevantContext: unreviewedNotes.slice(0, 5),
        similarityScore: 0.7
      });
    }

    return recommendations;
  }

  /**
   * Analyze focus session patterns for quest recommendations
   */
  private async analyzeFocusPatterns(focusSessions: any[], recentQuests: any[], recentActivities: any[]): Promise<any[]> {
    const recommendations: any[] = [];

    // Calculate average session length
    const sessionLengths = focusSessions.map(session => session.duration || 0);
    const avgSessionLength = sessionLengths.reduce((sum, length) => sum + length, 0) / sessionLengths.length;

    // Find short sessions
    const shortSessions = focusSessions.filter(session => (session.duration || 0) < 25);

    // Find long sessions
    const longSessions = focusSessions.filter(session => (session.duration || 0) > 60);

    if (avgSessionLength < 25) {
      recommendations.push({
        type: 'extend_focus',
        category: 'focus',
        difficulty: 2,
        reason: `Your average focus session is ${Math.round(avgSessionLength)} minutes. Let's extend that!`,
        relevantContext: shortSessions.slice(0, 3),
        similarityScore: 0.8
      });
    }

    if (longSessions.length > 0) {
      recommendations.push({
        type: 'maintain_momentum',
        category: 'focus',
        difficulty: 3,
        reason: `You've had ${longSessions.length} long focus sessions. Keep up the momentum!`,
        relevantContext: longSessions.slice(0, 2),
        similarityScore: 0.85
      });
    }

    return recommendations;
  }

  /**
   * Create adaptive quest template based on recommendation
   */
  private async createAdaptiveQuestTemplate(recommendation: any): Promise<QuestTemplate | null> {
    const templates: Record<string, QuestTemplate> = {
      task_completion: {
        id: 'adaptive_task_completion',
        name: 'Task Completion Sprint',
        description: recommendation.reason,
        type: 'adaptive',
        category: 'tasks',
        difficulty: recommendation.difficulty,
        rewardXp: 150,
        rewardTokens: 15,
        cooldown: 24, // 24 hours
        maxCompletions: 1,
        requirements: ['active_tasks'],
        completionCriteria: {
          type: 'task_count',
          target: 3,
          timeframe: '24h'
        },
        vectorContextTypes: ['task']
      },
      priority_focus: {
        id: 'adaptive_priority_focus',
        name: 'Priority Task Focus',
        description: recommendation.reason,
        type: 'adaptive',
        category: 'tasks',
        difficulty: recommendation.difficulty,
        rewardXp: 200,
        rewardTokens: 20,
        cooldown: 48, // 48 hours
        maxCompletions: 1,
        requirements: ['high_priority_tasks'],
        completionCriteria: {
          type: 'priority_task_completion',
          target: 2,
          timeframe: '48h'
        },
        vectorContextTypes: ['task']
      },
      catch_up: {
        id: 'adaptive_catch_up',
        name: 'Overdue Task Catch-up',
        description: recommendation.reason,
        type: 'adaptive',
        category: 'tasks',
        difficulty: recommendation.difficulty,
        rewardXp: 300,
        rewardTokens: 30,
        cooldown: 72, // 72 hours
        maxCompletions: 1,
        requirements: ['overdue_tasks'],
        completionCriteria: {
          type: 'overdue_task_completion',
          target: 2,
          timeframe: '72h'
        },
        vectorContextTypes: ['task']
      },
      goal_progress: {
        id: 'adaptive_goal_progress',
        name: 'Goal Progress Boost',
        description: recommendation.reason,
        type: 'adaptive',
        category: 'goals',
        difficulty: recommendation.difficulty,
        rewardXp: 250,
        rewardTokens: 25,
        cooldown: 168, // 1 week
        maxCompletions: 1,
        requirements: ['active_goals'],
        completionCriteria: {
          type: 'goal_progress_increase',
          target: 20, // 20% progress increase
          timeframe: '168h'
        },
        vectorContextTypes: ['goal']
      },
      deadline_push: {
        id: 'adaptive_deadline_push',
        name: 'Deadline Push',
        description: recommendation.reason,
        type: 'adaptive',
        category: 'goals',
        difficulty: recommendation.difficulty,
        rewardXp: 400,
        rewardTokens: 40,
        cooldown: 168, // 1 week
        maxCompletions: 1,
        requirements: ['deadline_goals'],
        completionCriteria: {
          type: 'goal_completion',
          target: 1,
          timeframe: '168h'
        },
        vectorContextTypes: ['goal']
      },
      note_actions: {
        id: 'adaptive_note_actions',
        name: 'Note Action Items',
        description: recommendation.reason,
        type: 'adaptive',
        category: 'notes',
        difficulty: recommendation.difficulty,
        rewardXp: 100,
        rewardTokens: 10,
        cooldown: 48, // 48 hours
        maxCompletions: 1,
        requirements: ['action_notes'],
        completionCriteria: {
          type: 'note_action_completion',
          target: 3,
          timeframe: '48h'
        },
        vectorContextTypes: ['note']
      },
      note_review: {
        id: 'adaptive_note_review',
        name: 'Note Review Session',
        description: recommendation.reason,
        type: 'adaptive',
        category: 'notes',
        difficulty: recommendation.difficulty,
        rewardXp: 75,
        rewardTokens: 8,
        cooldown: 24, // 24 hours
        maxCompletions: 1,
        requirements: ['unreviewed_notes'],
        completionCriteria: {
          type: 'note_review_count',
          target: 5,
          timeframe: '24h'
        },
        vectorContextTypes: ['note']
      },
      extend_focus: {
        id: 'adaptive_extend_focus',
        name: 'Extended Focus Session',
        description: recommendation.reason,
        type: 'adaptive',
        category: 'focus',
        difficulty: recommendation.difficulty,
        rewardXp: 120,
        rewardTokens: 12,
        cooldown: 24, // 24 hours
        maxCompletions: 1,
        requirements: ['focus_sessions'],
        completionCriteria: {
          type: 'focus_duration',
          target: 45, // 45 minutes
          timeframe: '24h'
        },
        vectorContextTypes: ['focus_session']
      },
      maintain_momentum: {
        id: 'adaptive_maintain_momentum',
        name: 'Maintain Focus Momentum',
        description: recommendation.reason,
        type: 'adaptive',
        category: 'focus',
        difficulty: recommendation.difficulty,
        rewardXp: 180,
        rewardTokens: 18,
        cooldown: 48, // 48 hours
        maxCompletions: 1,
        requirements: ['focus_sessions'],
        completionCriteria: {
          type: 'focus_duration',
          target: 60, // 60 minutes
          timeframe: '48h'
        },
        vectorContextTypes: ['focus_session']
      }
    };

    return templates[recommendation.type] || null;
  }

  /**
   * Get recent user quests
   */
  private async getRecentUserQuests(userId: string, days: number): Promise<any[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return await this.prisma.quests.findMany({
      where: {
        userId,
        dateAwarded: {
          gte: cutoffDate
        }
      },
      orderBy: { dateAwarded: 'desc' }
    });
  }

  /**
   * Get recent user activities
   */
  private async getRecentUserActivities(userId: string, days: number): Promise<any[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get recent tasks, goals, notes, and focus sessions
    const [tasks, goals, notes, focusSessions] = await Promise.all([
      this.prisma.task.findMany({
        where: {
          userId,
          updatedAt: { gte: cutoffDate }
        }
      }),
      this.prisma.goal.findMany({
        where: {
          userId,
          updatedAt: { gte: cutoffDate }
        }
      }),
      this.prisma.notes.findMany({
        where: {
          userId,
          updatedAt: { gte: cutoffDate }
        }
      }),
      this.prisma.timerSession.findMany({
        where: {
          userId,
          createdAt: { gte: cutoffDate }
        }
      })
    ]);

    return [...tasks, ...goals, ...notes, ...focusSessions];
  }

  /**
   * Check if quest is similar to recent quests
   */
  private async isQuestSimilarToRecent(quest: GeneratedQuest, recentQuests: any[]): Promise<boolean> {
    const similarityThreshold = 0.7;

    for (const recentQuest of recentQuests) {
      const similarity = this.calculateQuestSimilarity(quest, recentQuest);
      if (similarity > similarityThreshold) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate similarity between two quests
   */
  private calculateQuestSimilarity(quest1: GeneratedQuest, quest2: any): number {
    let similarity = 0;
    let factors = 0;

    // Compare categories
    if (quest1.category === quest2.type) {
      similarity += 0.3;
    }
    factors += 0.3;

    // Compare difficulty
    if (quest1.difficulty === quest2.difficulty) {
      similarity += 0.2;
    }
    factors += 0.2;

    // Compare reward ranges
    const rewardDiff = Math.abs((quest1.rewardXp || 0) - (quest2.rewardXp || 0));
    if (rewardDiff < 50) {
      similarity += 0.2;
    }
    factors += 0.2;

    // Compare descriptions (basic text similarity)
    const desc1 = quest1.description?.toLowerCase() || '';
    const desc2 = quest2.description?.toLowerCase() || '';
    const commonWords = desc1.split(' ').filter(word => desc2.includes(word)).length;
    const totalWords = Math.max(desc1.split(' ').length, desc2.split(' ').length);
    
    if (totalWords > 0) {
      similarity += (commonWords / totalWords) * 0.3;
    }
    factors += 0.3;

    return factors > 0 ? similarity / factors : 0;
  }

  /**
   * Check if quest conflicts with recent activities
   */
  private async doesQuestConflictWithActivities(quest: GeneratedQuest, recentActivities: any[]): Promise<boolean> {
    // Check if the quest type conflicts with recent activities
    const conflictingActivities = recentActivities.filter(activity => {
      switch (quest.category) {
        case 'tasks':
          return activity.completed === true; // Don't suggest task quests if tasks were just completed
        case 'goals':
          return activity.completed === true; // Don't suggest goal quests if goals were just completed
        case 'focus':
          return activity.duration > 60; // Don't suggest focus quests if user just had long sessions
        default:
          return false;
      }
    });

    return conflictingActivities.length > 0;
  }

  /**
   * Deduplicate and sort recommendations
   */
  private deduplicateAndSortRecommendations(recommendations: any[]): any[] {
    // Remove duplicates based on type and category
    const uniqueRecommendations = recommendations.filter((rec, index, self) => 
      index === self.findIndex(r => r.type === rec.type && r.category === rec.category)
    );

    // Sort by similarity score (higher is better) and difficulty
    return uniqueRecommendations.sort((a, b) => {
      if (a.similarityScore !== b.similarityScore) {
        return b.similarityScore - a.similarityScore;
      }
      return a.difficulty - b.difficulty; // Lower difficulty first
    });
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

  /**
   * Generate welcome back quests for returning users
   */
  private async generateWelcomeBackQuests(userContext: UserQuestContext, vectorContext: any[]): Promise<GeneratedQuest[]> {
    const quests: GeneratedQuest[] = [];
    const now = new Date();

    // Catch-up quest
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
      expiresAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days
      meta: {
        template: 'welcome_back_catchup',
        completionCriteria: { type: 'count', target: 3 },
        priority: 'high'
      }
    });

    // Focus restart quest
    quests.push({
      id: `welcome_back_focus_${userContext.userId}_${Date.now()}`,
      userId: userContext.userId,
      templateId: 'welcome_back_focus',
      name: 'Restart Your Focus Engine',
      description: 'Complete a 25-minute focus session to rebuild your concentration.',
      type: 'welcome_back',
      category: 'focus',
      status: 'active',
      progress: 0,
      goal: 25,
      rewardXp: 150,
      rewardTokens: 15,
      difficulty: 2,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days
      meta: {
        template: 'welcome_back_focus',
        completionCriteria: { type: 'duration', target: 25, unit: 'minutes' },
        priority: 'high'
      }
    });

    return quests;
  }

  /**
   * Generate daily check-in quests
   */
  private async generateDailyCheckinQuests(userContext: UserQuestContext, vectorContext: any[]): Promise<GeneratedQuest[]> {
    const quests: GeneratedQuest[] = [];
    const now = new Date();

    // Daily planning quest
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
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 1 day
      meta: {
        template: 'daily_planning',
        completionCriteria: { type: 'count', target: 3 },
        priority: 'medium'
      }
    });

    return quests;
  }

  /**
   * Generate quick win quests for frequent users
   */
  private async generateQuickWinQuests(userContext: UserQuestContext, vectorContext: any[]): Promise<GeneratedQuest[]> {
    const quests: GeneratedQuest[] = [];
    const now = new Date();

    // Micro focus quest
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
      expiresAt: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours
      meta: {
        template: 'quick_focus',
        completionCriteria: { type: 'duration', target: 10, unit: 'minutes' },
        priority: 'low'
      }
    });

    return quests;
  }

  /**
   * Generate onboarding quests for new users
   */
  private async generateOnboardingQuests(userContext: UserQuestContext): Promise<GeneratedQuest[]> {
    const quests: GeneratedQuest[] = [];
    const now = new Date();

    // First task quest
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
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days
      meta: {
        template: 'onboarding_first_task',
        completionCriteria: { type: 'count', target: 1 },
        priority: 'high'
      }
    });

    // First focus session quest
    quests.push({
      id: `onboarding_first_focus_${userContext.userId}_${Date.now()}`,
      userId: userContext.userId,
      templateId: 'onboarding_first_focus',
      name: 'Try Your First Focus Session',
      description: 'Experience the power of focused work with a 15-minute session.',
      type: 'onboarding',
      category: 'focus',
      status: 'active',
      progress: 0,
      goal: 15,
      rewardXp: 75,
      rewardTokens: 8,
      difficulty: 1,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days
      meta: {
        template: 'onboarding_first_focus',
        completionCriteria: { type: 'duration', target: 15, unit: 'minutes' },
        priority: 'high'
      }
    });

    return quests;
  }

  /**
   * Generate quests for different trigger points
   */
  private async generateTaskCompletionQuests(userContext: UserQuestContext, vectorContext: any[]): Promise<GeneratedQuest[]> {
    const quests: GeneratedQuest[] = [];
    const now = new Date();

    // Task streak quest
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
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 1 day
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

    // Goal momentum quest
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
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 1 week
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

    // Extended focus quest
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
      expiresAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days
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

    // Note organization quest
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
      expiresAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days
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

    // Streak extension quest
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
      expiresAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days
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

    // Level celebration quest
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
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 1 week
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

    // Re-engagement quest
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
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 1 day
      meta: {
        template: 're_engagement',
        completionCriteria: { type: 'count', target: 1 },
        priority: 'medium'
      }
    });

    return quests;
  }

  /**
   * Get user's last connection time
   */
  private async getLastConnectionTime(userId: string): Promise<Date | null> {
    // This would typically come from user activity tracking
    // For now, we'll use the last quest creation time as a proxy
    const lastQuest = await this.prisma.quests.findFirst({
      where: { userId },
      orderBy: { dateAwarded: 'desc' }
    });

    return lastQuest?.dateAwarded || null;
  }

  /**
   * Generate quest suggestions based on user data
   */
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

    // Note-based suggestions
    if (recentNotes.length > 0) {
      const actionNotes = recentNotes.filter((note: any) => 
        note.text?.includes('TODO') || note.text?.includes('ACTION')
      );
      if (actionNotes.length > 0) {
        suggestions.push({
          type: 'productivity',
          title: 'Note Action Items',
          description: `You have ${actionNotes.length} notes with action items. Let's tackle them!`,
          difficulty: 2,
          estimatedReward: { xp: 100, tokens: 10 },
          confidence: 0.7
        });
      }
    }

    // Wellness suggestions
    if (recentSessions.length > 5) {
      suggestions.push({
        type: 'wellness',
        title: 'Take a Break',
        description: 'You\'ve been working hard. Consider taking a short break to recharge.',
        difficulty: 1,
        estimatedReward: { xp: 50, tokens: 5 },
        confidence: 0.5
      });
    }

    // Learning suggestions
    if (recentNotes.length > 3) {
      suggestions.push({
        type: 'learning',
        title: 'Review Your Notes',
        description: 'Review and organize your recent notes to reinforce your learning.',
        difficulty: 1,
        estimatedReward: { xp: 75, tokens: 8 },
        confidence: 0.6
      });
    }

    return suggestions.slice(0, limit);
  }

  /**
   * Get quest templates for different types
   */
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

  /**
   * Create a quest from template
   */
  async createQuestFromTemplate(
    userId: string,
    userAddress: string,
    templateId: string,
    customizations?: {
      name?: string;
      description?: string;
      difficulty?: number;
      rewardXp?: number;
      rewardTokens?: number;
      expiresAt?: Date;
    }
  ): Promise<GeneratedQuest | null> {
    const template = this.questTemplates.get(templateId);
    if (!template) return null;

    const quest: GeneratedQuest = {
      id: `${templateId}_${userId}_${Date.now()}`,
      userId,
      templateId,
      name: customizations?.name || template.name,
      description: customizations?.description || template.description,
      type: template.type,
      category: template.category,
      status: 'active',
      progress: 0,
      goal: template.completionCriteria.target,
      rewardXp: customizations?.rewardXp || template.rewardXp,
      rewardTokens: customizations?.rewardTokens || template.rewardTokens,
      difficulty: customizations?.difficulty || template.difficulty,
      createdAt: new Date(),
      expiresAt: customizations?.expiresAt,
      meta: {
        template: templateId,
        requirements: template.requirements,
        completionCriteria: template.completionCriteria,
        createdFromTemplate: true
      }
    };

    await this.saveQuestsToDatabase([quest]);
    return quest;
  }

  /**
   * Generate priority-based quest suggestions from user tasks at connection
   */
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

      // Add onboarding quests for new users
      if ((user.completedQuests || 0) < 3) {
        quests.push(...await this.generateOnboardingQuests(userContext));
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

  /**
   * Create priority-based quests from user tasks
   */
  private async createTaskBasedPriorityQuests(
    tasks: any[], 
    user: any, 
    recentActivity: any
  ): Promise<GeneratedQuest[]> {
    const quests: GeneratedQuest[] = [];
    const now = new Date();

    // Group tasks by priority
    const highPriorityTasks = tasks.filter(task => task.priority === 'high');
    const mediumPriorityTasks = tasks.filter(task => task.priority === 'medium');
    const lowPriorityTasks = tasks.filter(task => task.priority === 'low');
    const overdueTasks = tasks.filter(task => task.dueDate && new Date(task.dueDate) < now);

    // High Priority Task Quest
    if (highPriorityTasks.length > 0) {
      quests.push({
        id: `priority_high_${user.id}_${Date.now()}`,
        userId: user.id,
        templateId: 'priority_high',
        name: '🔥 High Priority Sprint',
        description: `Complete ${Math.min(3, highPriorityTasks.length)} high-priority tasks to maintain momentum.`,
        type: 'priority',
        category: 'tasks',
        status: 'active',
        progress: 0,
        goal: Math.min(3, highPriorityTasks.length),
        rewardXp: 200,
        rewardTokens: 20,
        difficulty: 3,
        createdAt: now,
        expiresAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days
        meta: {
          template: 'priority_high',
          completionCriteria: { type: 'count', target: Math.min(3, highPriorityTasks.length) },
          priority: 'high',
          taskIds: highPriorityTasks.slice(0, 3).map(t => t.id)
        }
      });
    }

    // Overdue Task Quest
    if (overdueTasks.length > 0) {
      quests.push({
        id: `priority_overdue_${user.id}_${Date.now()}`,
        userId: user.id,
        templateId: 'priority_overdue',
        name: '⏰ Catch Up Quest',
        description: `Complete ${Math.min(2, overdueTasks.length)} overdue tasks to get back on track.`,
        type: 'priority',
        category: 'tasks',
        status: 'active',
        progress: 0,
        goal: Math.min(2, overdueTasks.length),
        rewardXp: 250,
        rewardTokens: 25,
        difficulty: 4,
        createdAt: now,
        expiresAt: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // 1 day
        meta: {
          template: 'priority_overdue',
          completionCriteria: { type: 'count', target: Math.min(2, overdueTasks.length) },
          priority: 'high',
          taskIds: overdueTasks.slice(0, 2).map(t => t.id)
        }
      });
    }

    // Medium Priority Task Quest
    if (mediumPriorityTasks.length > 0) {
      quests.push({
        id: `priority_medium_${user.id}_${Date.now()}`,
        userId: user.id,
        templateId: 'priority_medium',
        name: '📋 Steady Progress',
        description: `Complete ${Math.min(4, mediumPriorityTasks.length)} medium-priority tasks for consistent progress.`,
        type: 'priority',
        category: 'tasks',
        status: 'active',
        progress: 0,
        goal: Math.min(4, mediumPriorityTasks.length),
        rewardXp: 150,
        rewardTokens: 15,
        difficulty: 2,
        createdAt: now,
        expiresAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days
        meta: {
          template: 'priority_medium',
          completionCriteria: { type: 'count', target: Math.min(4, mediumPriorityTasks.length) },
          priority: 'medium',
          taskIds: mediumPriorityTasks.slice(0, 4).map(t => t.id)
        }
      });
    }

    // Task Organization Quest
    if (tasks.length > 5) {
      quests.push({
        id: `priority_organize_${user.id}_${Date.now()}`,
        userId: user.id,
        templateId: 'priority_organize',
        name: '🗂️ Task Organization',
        description: 'Organize your tasks by adding due dates, priorities, or categories to 5 tasks.',
        type: 'priority',
        category: 'tasks',
        status: 'active',
        progress: 0,
        goal: 5,
        rewardXp: 100,
        rewardTokens: 10,
        difficulty: 1,
        createdAt: now,
        expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 1 week
        meta: {
          template: 'priority_organize',
          completionCriteria: { type: 'count', target: 5 },
          priority: 'low'
        }
      });
    }

    // Focus Session Quest based on task count
    if (tasks.length > 3) {
      const focusDuration = Math.min(45, Math.max(25, tasks.length * 10));
      quests.push({
        id: `priority_focus_${user.id}_${Date.now()}`,
        userId: user.id,
        templateId: 'priority_focus',
        name: '🎯 Focus on Priorities',
        description: `Complete a ${focusDuration}-minute focus session to tackle your priority tasks.`,
        type: 'priority',
        category: 'focus',
        status: 'active',
        progress: 0,
        goal: focusDuration,
        rewardXp: 120,
        rewardTokens: 12,
        difficulty: 2,
        createdAt: now,
        expiresAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days
        meta: {
          template: 'priority_focus',
          completionCriteria: { type: 'duration', target: focusDuration, unit: 'minutes' },
          priority: 'medium'
        }
      });
    }

    return quests;
  }

  /**
   * Generate generic connection quests when no task data is available
   */
  private async generateGenericConnectionQuests(userId: string, userAddress: string): Promise<GeneratedQuest[]> {
    const quests: GeneratedQuest[] = [];
    const now = new Date();

    // Welcome Quest
    quests.push({
      id: `generic_welcome_${userId}_${Date.now()}`,
      userId,
      templateId: 'generic_welcome',
      name: '👋 Welcome Back!',
      description: 'Create your first task to get started with your productivity journey.',
      type: 'generic',
      category: 'tasks',
      status: 'active',
      progress: 0,
      goal: 1,
      rewardXp: 50,
      rewardTokens: 5,
      difficulty: 1,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 1 week
      meta: {
        template: 'generic_welcome',
        completionCriteria: { type: 'count', target: 1 },
        priority: 'high'
      }
    });

    // Focus Introduction Quest
    quests.push({
      id: `generic_focus_intro_${userId}_${Date.now()}`,
      userId,
      templateId: 'generic_focus_intro',
      name: '⏲️ Try Focus Mode',
      description: 'Complete a 15-minute focus session to experience the power of concentrated work.',
      type: 'generic',
      category: 'focus',
      status: 'active',
      progress: 0,
      goal: 15,
      rewardXp: 75,
      rewardTokens: 8,
      difficulty: 1,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 1 week
      meta: {
        template: 'generic_focus_intro',
        completionCriteria: { type: 'duration', target: 15, unit: 'minutes' },
        priority: 'medium'
      }
    });

    // Goal Setting Quest
    quests.push({
      id: `generic_goal_setting_${userId}_${Date.now()}`,
      userId,
      templateId: 'generic_goal_setting',
      name: '🎯 Set Your First Goal',
      description: 'Create a goal to give direction to your productivity efforts.',
      type: 'generic',
      category: 'goals',
      status: 'active',
      progress: 0,
      goal: 1,
      rewardXp: 100,
      rewardTokens: 10,
      difficulty: 1,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
      meta: {
        template: 'generic_goal_setting',
        completionCriteria: { type: 'count', target: 1 },
        priority: 'medium'
      }
    });

    // Note Taking Quest
    quests.push({
      id: `generic_note_taking_${userId}_${Date.now()}`,
      userId,
      templateId: 'generic_note_taking',
      name: '📝 Start Note Taking',
      description: 'Create your first note to capture ideas and thoughts.',
      type: 'generic',
      category: 'notes',
      status: 'active',
      progress: 0,
      goal: 1,
      rewardXp: 50,
      rewardTokens: 5,
      difficulty: 1,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 1 week
      meta: {
        template: 'generic_note_taking',
        completionCriteria: { type: 'count', target: 1 },
        priority: 'low'
      }
    });

    return quests;
  }

  /**
   * Get recent user activity for context
   */
  private async getRecentUserActivity(userId: string): Promise<any> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [focusSessions, completedTasks, completedGoals, mentorChats] = await Promise.all([
      this.prisma.timerSession.count({
        where: {
          userId,
          createdAt: { gte: weekAgo }
        }
      }),
      this.prisma.task.count({
        where: {
          userId,
          completed: true,
          updatedAt: { gte: weekAgo }
        }
      }),
      this.prisma.goal.count({
        where: {
          userId,
          completed: true,
          updatedAt: { gte: weekAgo }
        }
      }),
      this.prisma.chatMessage.count({
        where: {
          userId,
          createdAt: { gte: weekAgo }
        }
      })
    ]);

    return {
      focusSessions,
      completedTasks,
      completedGoals,
      mentorChats,
      lastActive: now
    };
  }

  /**
   * Build comprehensive user context from database
   */
  private async buildUserContext(userId: string, userAddress: string): Promise<UserQuestContext> {
    // Get user data
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        tasks: { take: 20 },
        goals: { take: 20 },
        notes: { take: 20 },
        timerSessions: { take: 20 },
        quests: { take: 50 },
        chatMessages: { take: 10 }
      }
    });

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    // Get recent activity
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentActivity = {
      focusSessions: user.timerSessions.filter(s => s.createdAt >= weekAgo).length,
      completedTasks: user.tasks.filter(t => t.completed && t.updatedAt >= weekAgo).length,
      completedGoals: user.goals.filter(g => g.completed && g.updatedAt >= weekAgo).length,
      mentorChats: user.chatMessages.filter(m => m.createdAt >= weekAgo).length,
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

  /**
   * Get vector-based context from Pinecone
   */
  private async getVectorContext(userId: string, userContext: UserQuestContext): Promise<any[]> {
    try {
      // Create a comprehensive search query based on user context
      const searchQuery = this.buildVectorSearchQuery(userContext);
      
      // Use enhanced context manager to search user content
      const vectorResults = await this.enhancedContextManager.searchUserContent(
        userId,
        searchQuery,
        ['tasks', 'goals', 'notes', 'focus_sessions', 'chat_messages'],
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

  /**
   * Build search query for vector search
   */
  private buildVectorSearchQuery(userContext: UserQuestContext): string {
    const queryParts = [];

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

  /**
   * Fallback vector context when Pinecone is unavailable
   */
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
          source: note.source
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

  /**
   * Analyze user preferences from their data
   */
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

  /**
   * Create personalized quests based on vector context analysis
   */
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

  /**
   * Analyze vector context for personalization insights
   */
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

  /**
   * Create a personalized quest from an insight
   */
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

  /**
   * Generate personalized quest name based on insight
   */
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
} 