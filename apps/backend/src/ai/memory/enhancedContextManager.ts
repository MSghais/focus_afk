import { PrismaClient } from '@prisma/client';
import { PineconeService } from './pinecone.service';
import { MemoryManager, MemoryContext } from './memoryManager';
import { buildContextString } from '../../services/helpers/contextHelper';

export interface ContextUseCase {
  name: string;
  description: string;
  vectorSearchEnabled: boolean;
  contextSources: string[];
  maxVectorResults: number;
  systemPrompt: string;
  includeHistory: boolean;
  maxHistoryMessages: number;
}

export interface EnhancedContextOptions {
  userId: string;
  mentorId?: string;
  sessionId?: string;
  useCase: string;
  userMessage: string;
  customSystemPrompt?: string;
  extraData?: Record<string, any>;
  enableVectorSearch?: boolean;
  contextSources?: string[];
  maxVectorResults?: number;
}

export interface EnhancedContextResult {
  enhancedPrompt: string;
  vectorContext: any[];
  traditionalContext: MemoryContext | null;
  useCase: ContextUseCase;
  metadata: {
    vectorSearchUsed: boolean;
    contextSources: string[];
    totalContextSize: number;
    vectorResultsCount: number;
  };
}

export class EnhancedContextManager {
  private prisma: PrismaClient;
  private pineconeService: PineconeService;
  private memoryManager: MemoryManager;

  // Predefined use cases for different scenarios
  private useCases: Map<string, ContextUseCase> = new Map([
    ['general_chat', {
      name: 'General Chat',
      description: 'General conversation with basic context',
      vectorSearchEnabled: true,
      contextSources: ['tasks', 'goals', 'sessions', 'profile'],
      maxVectorResults: 3,
      systemPrompt: 'You are an AI mentor helping with productivity and focus. Be friendly, helpful, and provide actionable advice.',
      includeHistory: true,
      maxHistoryMessages: 10
    }],
    ['task_planning', {
      name: 'Task Planning',
      description: 'Focused on task management and planning',
      vectorSearchEnabled: true,
      contextSources: ['tasks', 'goals', 'sessions'],
      maxVectorResults: 5,
      systemPrompt: 'You are a task planning expert. Help users organize, prioritize, and plan their tasks effectively.',
      includeHistory: true,
      maxHistoryMessages: 5
    }],
    ['goal_tracking', {
      name: 'Goal Tracking',
      description: 'Focused on goal progress and achievement',
      vectorSearchEnabled: true,
      contextSources: ['goals', 'tasks', 'sessions', 'badges'],
      maxVectorResults: 4,
      systemPrompt: 'You are a goal achievement coach. Help users track progress, overcome obstacles, and stay motivated.',
      includeHistory: true,
      maxHistoryMessages: 5
    }],
    ['focus_sessions', {
      name: 'Focus Sessions',
      description: 'Focused on productivity and focus sessions',
      vectorSearchEnabled: true,
      contextSources: ['sessions', 'tasks', 'goals'],
      maxVectorResults: 3,
      systemPrompt: 'You are a focus and productivity expert. Help users optimize their focus sessions and improve productivity.',
      includeHistory: false,
      maxHistoryMessages: 0
    }],
    ['note_analysis', {
      name: 'Note Analysis',
      description: 'Analyzing and working with notes',
      vectorSearchEnabled: true,
      contextSources: ['notes', 'tasks', 'goals'],
      maxVectorResults: 6,
      systemPrompt: 'You are a knowledge management expert. Help users analyze, organize, and extract insights from their notes.',
      includeHistory: true,
      maxHistoryMessages: 8
    }],
    ['mentor_specific', {
      name: 'Mentor Specific',
      description: 'Conversation with a specific mentor',
      vectorSearchEnabled: true,
      contextSources: ['mentor', 'tasks', 'goals', 'sessions'],
      maxVectorResults: 4,
      systemPrompt: 'You are a specialized mentor. Use your expertise to provide targeted guidance and support.',
      includeHistory: true,
      maxHistoryMessages: 10
    }],
    ['quick_question', {
      name: 'Quick Question',
      description: 'Quick questions without extensive context',
      vectorSearchEnabled: false,
      contextSources: ['profile'],
      maxVectorResults: 0,
      systemPrompt: 'You are a helpful AI assistant. Provide concise, accurate answers to user questions.',
      includeHistory: false,
      maxHistoryMessages: 0
    }],
    ['deep_analysis', {
      name: 'Deep Analysis',
      description: 'Deep analysis with extensive context',
      vectorSearchEnabled: true,
      contextSources: ['tasks', 'goals', 'sessions', 'notes', 'badges', 'quests', 'profile'],
      maxVectorResults: 8,
      systemPrompt: 'You are an analytical AI mentor. Provide deep insights and comprehensive analysis based on all available context.',
      includeHistory: true,
      maxHistoryMessages: 15
    }]
  ]);

  constructor(prisma: PrismaClient, pineconeService: PineconeService, memoryManager: MemoryManager) {
    this.prisma = prisma;
    this.pineconeService = pineconeService;
    this.memoryManager = memoryManager;
  }

  // Get available use cases
  getAvailableUseCases(): ContextUseCase[] {
    return Array.from(this.useCases.values());
  }

  // Get specific use case
  getUseCase(useCaseName: string): ContextUseCase | undefined {
    return this.useCases.get(useCaseName);
  }

  // Add custom use case
  addUseCase(useCase: ContextUseCase): void {
    this.useCases.set(useCase.name, useCase);
  }

  // Generate enhanced context for a specific use case
  async generateEnhancedContext(options: EnhancedContextOptions): Promise<EnhancedContextResult> {
    const useCase = this.useCases.get(options.useCase) || this.useCases.get('general_chat')!;
    
    // Override use case settings with options if provided
    const finalUseCase: ContextUseCase = {
      ...useCase,
      contextSources: options.contextSources || useCase.contextSources,
      maxVectorResults: options.maxVectorResults || useCase.maxVectorResults,
      systemPrompt: options.customSystemPrompt || useCase.systemPrompt,
      vectorSearchEnabled: options.enableVectorSearch !== undefined ? options.enableVectorSearch : useCase.vectorSearchEnabled
    };

    let vectorContext: any[] = [];
    let traditionalContext: MemoryContext | null = null;

    // Get vector-based context if enabled
    if (finalUseCase.vectorSearchEnabled) {
      try {
        vectorContext = await this.pineconeService.retrieveUserContext(
          options.userId,
          options.userMessage,
          finalUseCase.maxVectorResults,
          finalUseCase.contextSources
        );
      } catch (error) {
        console.warn('Vector search failed, continuing without vector context:', error);
      }
    }

    // Get traditional context
    try {
      traditionalContext = await this.memoryManager.getOrCreateMemory(
        options.userId,
        options.mentorId,
        options.sessionId
      );
    } catch (error) {
      console.warn('Traditional context failed, continuing without memory context:', error);
    }

    // Build enhanced prompt
    const enhancedPrompt = await this.buildEnhancedPrompt(
      options.userMessage,
      finalUseCase,
      vectorContext,
      traditionalContext,
      options.extraData
    );

    return {
      enhancedPrompt,
      vectorContext,
      traditionalContext,
      useCase: finalUseCase,
      metadata: {
        vectorSearchUsed: finalUseCase.vectorSearchEnabled && vectorContext.length > 0,
        contextSources: finalUseCase.contextSources,
        totalContextSize: enhancedPrompt.length,
        vectorResultsCount: vectorContext.length
      }
    };
  }

  // Build the final enhanced prompt
  private async buildEnhancedPrompt(
    userMessage: string,
    useCase: ContextUseCase,
    vectorContext: any[],
    traditionalContext: MemoryContext | null,
    extraData?: Record<string, any>
  ): Promise<string> {
    let prompt = `${useCase.systemPrompt}\n\n`;

    // Add vector-based context
    if (vectorContext.length > 0) {
      prompt += `Most Relevant Context (Vector Search):\n`;
      vectorContext.forEach((ctx, index) => {
        prompt += `${index + 1}. [${ctx.type.toUpperCase()}] ${ctx.content}\n`;
      });
      prompt += '\n';
    }

    // Add traditional context
    if (traditionalContext) {
      const contextString = buildContextString(traditionalContext, useCase.contextSources);
      if (contextString) {
        prompt += `User Context:\n${contextString}\n\n`;
      }

      // Add conversation history if enabled
      if (useCase.includeHistory && traditionalContext.messages.length > 0) {
        const historyMessages = traditionalContext.messages.slice(-useCase.maxHistoryMessages);
        const conversationHistory = historyMessages.map(m => 
          `${m.role}: ${m.content}`
        ).join('\n');
        
        prompt += `Recent Conversation History:\n${conversationHistory}\n\n`;
      }
    }

    // Add extra data if provided
    if (extraData) {
      prompt += `Additional Context:\n`;
      Object.entries(extraData).forEach(([key, value]) => {
        if (typeof value === 'string') {
          prompt += `${key}: ${value}\n`;
        } else if (Array.isArray(value)) {
          prompt += `${key}: ${value.join(', ')}\n`;
        } else if (typeof value === 'object') {
          prompt += `${key}: ${JSON.stringify(value)}\n`;
        }
      });
      prompt += '\n';
    }

    prompt += `Current User Message: ${userMessage}\n\n`;
    prompt += `Please respond as the AI mentor, taking into account all the provided context. Provide personalized, actionable advice that aligns with the user's current situation and goals.`;

    return prompt;
  }

  // Update user embeddings when data changes
  async updateUserEmbeddings(userId: string, dataTypes?: string[]): Promise<void> {
    try {
      await this.pineconeService.batchStoreUserData(userId);
      console.log(`Updated embeddings for user ${userId}`);
    } catch (error) {
      console.error(`Failed to update embeddings for user ${userId}:`, error);
    }
  }

  // Get context statistics for a user
  async getContextStats(userId: string): Promise<{
    totalTasks: number;
    totalGoals: number;
    totalSessions: number;
    totalNotes: number;
    totalMessages: number;
    vectorContexts: number;
  }> {
    const [
      tasks,
      goals,
      sessions,
      notes,
      messages
    ] = await Promise.all([
      this.prisma.task.count({ where: { userId } }),
      this.prisma.goal.count({ where: { userId } }),
      this.prisma.timerSession.count({ where: { userId } }),
      this.prisma.notes.count({ where: { userId } }),
      this.prisma.message.count({ where: { userId } })
    ]);

    return {
      totalTasks: tasks,
      totalGoals: goals,
      totalSessions: sessions,
      totalNotes: notes,
      totalMessages: messages,
      vectorContexts: 0 // This would require querying Pinecone for actual count
    };
  }

  // Search for specific content across all user data
  async searchUserContent(
    userId: string,
    query: string,
    types?: string[],
    limit: number = 10
  ): Promise<any[]> {
    const results = await this.pineconeService.retrieveUserContext(
      userId,
      query,
      limit,
      types
    );

    return results.map(result => ({
      id: result.metadata.id || result.metadata.taskId || result.metadata.goalId || result.metadata.noteId,
      type: result.type,
      content: result.content,
      score: result.score,
      metadata: result.metadata,
      timestamp: result.timestamp
    }));
  }
} 