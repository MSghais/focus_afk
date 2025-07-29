import { generateText } from 'ai';
import { createOpenRouter, openrouter } from '@openrouter/ai-sdk-provider';
import { PrismaClient } from '@prisma/client';
import { EnhancedContextManager, EnhancedContextOptions, EnhancedContextResult } from './memory/enhancedContextManager';
import { PineconeService } from './memory/pinecone.service';
import { MemoryManager } from './memory/memoryManager';
import { ChatService } from '../services/chat/chat.service';

interface VectorAiInputs {
  model: string;
  prompt: string;
  userId: string;
  mentorId?: string;
  sessionId?: string;
  useCase: string;
  customSystemPrompt?: string;
  extraData?: Record<string, any>;
  enableVectorSearch?: boolean;
  contextSources?: string[];
  maxVectorResults?: number;
  saveToChat?: boolean;
  chatId?: string;
}

interface VectorAiResponse {
  text: string;
  sources: any;
  usage: any;
  context: EnhancedContextResult;
  metadata: {
    model: string;
    useCase: string;
    vectorSearchUsed: boolean;
    contextSize: number;
    responseTime: number;
  };
}

export class EnhancedVectorAiService {
  private openRouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY!,
  });
  
  private prisma: PrismaClient;
  private contextManager: EnhancedContextManager;
  private chatService: ChatService;
  private pineconeService: PineconeService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.pineconeService = new PineconeService(prisma);
    this.contextManager = new EnhancedContextManager(
      prisma,
      this.pineconeService,
      new MemoryManager(prisma)
    );
    this.chatService = new ChatService(prisma);
  }

  // Main method to generate AI response with enhanced context
  async generateResponse(inputs: VectorAiInputs): Promise<VectorAiResponse | null> {
    const startTime = Date.now();
    
    try {
      // Generate enhanced context
      const contextOptions: EnhancedContextOptions = {
        userId: inputs.userId,
        mentorId: inputs.mentorId,
        sessionId: inputs.sessionId,
        useCase: inputs.useCase,
        userMessage: inputs.prompt,
        customSystemPrompt: inputs.customSystemPrompt,
        extraData: inputs.extraData,
        enableVectorSearch: inputs.enableVectorSearch,
        contextSources: inputs.contextSources,
        maxVectorResults: inputs.maxVectorResults
      };

      const context = await this.contextManager.generateEnhancedContext(contextOptions);

      // Generate AI response
      const response = await generateText({
        model: openrouter(inputs.model),
        system: context.enhancedPrompt,
        prompt: inputs.prompt,
      });

      const responseTime = Date.now() - startTime;

      // Save to chat if requested
      if (inputs.saveToChat) {
        await this.saveConversation(inputs, response.text, context);
      }

      return {
        text: response.text,
        sources: response.sources || [],
        usage: response.usage || {},
        context,
        metadata: {
          model: inputs.model,
          useCase: inputs.useCase,
          vectorSearchUsed: context.metadata.vectorSearchUsed,
          contextSize: context.metadata.totalContextSize,
          responseTime
        }
      };

    } catch (error) {
      console.error('Error generating enhanced AI response:', error);
      return null;
    }
  }

  // Save conversation to chat
  private async saveConversation(
    inputs: VectorAiInputs,
    responseText: string,
    context: EnhancedContextResult
  ): Promise<void> {
    try {
      let chatId = inputs.chatId;

      // If no chatId provided, get or create one
      if (!chatId) {
        if (inputs.mentorId) {
          const chat = await this.chatService.getOrCreateMentorChat(
            inputs.userId,
            inputs.mentorId,
            `Chat with ${inputs.useCase}`
          );
          chatId = chat.id;
        } else {
          const chat = await this.chatService.createChat(inputs.userId, {
            title: `${inputs.useCase} Chat`,
            metadata: {
              useCase: inputs.useCase,
              sessionId: inputs.sessionId,
              vectorSearchUsed: context.metadata.vectorSearchUsed,
              contextSources: context.metadata.contextSources
            }
          });
          chatId = chat.id;
        }
      }

      // Save the conversation
      await this.chatService.saveConversation(
        chatId,
        inputs.userId,
        inputs.prompt,
        responseText,
        {
          model: inputs.model,
          mentorId: inputs.mentorId,
          metadata: {
            useCase: inputs.useCase,
            vectorSearchUsed: context.metadata.vectorSearchUsed,
            contextSources: context.metadata.contextSources,
            vectorResultsCount: context.metadata.vectorResultsCount,
            totalContextSize: context.metadata.totalContextSize,
            extraData: inputs.extraData
          }
        }
      );

    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  }

  // Get available use cases
  getAvailableUseCases() {
    return this.contextManager.getAvailableUseCases();
  }

  // Update user embeddings
  async updateUserEmbeddings(userId: string, dataTypes?: string[]): Promise<void> {
    return this.contextManager.updateUserEmbeddings(userId, dataTypes);
  }

  // Search user content
  async searchUserContent(
    userId: string,
    query: string,
    types?: string[],
    limit: number = 10
  ): Promise<any[]> {
    return this.contextManager.searchUserContent(userId, query, types, limit);
  }

  // Get context statistics
  async getContextStats(userId: string) {
    return this.contextManager.getContextStats(userId);
  }

  // Specialized methods for different use cases

  // Task planning assistance
  async assistWithTaskPlanning(
    userId: string,
    prompt: string,
    mentorId?: string,
    sessionId?: string
  ): Promise<VectorAiResponse | null> {
    return this.generateResponse({
      model: 'openai/gpt-4o-mini',
      prompt,
      userId,
      mentorId,
      sessionId,
      useCase: 'task_planning',
      saveToChat: true
    });
  }

  // Goal tracking assistance
  async assistWithGoalTracking(
    userId: string,
    prompt: string,
    mentorId?: string,
    sessionId?: string
  ): Promise<VectorAiResponse | null> {
    return this.generateResponse({
      model: 'openai/gpt-4o-mini',
      prompt,
      userId,
      mentorId,
      sessionId,
      useCase: 'goal_tracking',
      saveToChat: true
    });
  }

  // Focus session optimization
  async optimizeFocusSessions(
    userId: string,
    prompt: string,
    sessionData?: any
  ): Promise<VectorAiResponse | null> {
    return this.generateResponse({
      model: 'openai/gpt-4o-mini',
      prompt,
      userId,
      useCase: 'focus_sessions',
      extraData: sessionData,
      saveToChat: true
    });
  }

  // Note analysis and insights
  async analyzeNotes(
    userId: string,
    prompt: string,
    noteContext?: any
  ): Promise<VectorAiResponse | null> {
    return this.generateResponse({
      model: 'openai/gpt-4o-mini',
      prompt,
      userId,
      useCase: 'note_analysis',
      extraData: noteContext,
      saveToChat: true
    });
  }

  // Mentor-specific conversation
  async mentorConversation(
    userId: string,
    mentorId: string,
    prompt: string,
    sessionId?: string
  ): Promise<VectorAiResponse | null> {
    return this.generateResponse({
      model: 'openai/gpt-4o-mini',
      prompt,
      userId,
      mentorId,
      sessionId,
      useCase: 'mentor_specific',
      saveToChat: true
    });
  }

  // Quick question (minimal context)
  async quickQuestion(
    userId: string,
    prompt: string
  ): Promise<VectorAiResponse | null> {
    return this.generateResponse({
      model: 'openai/gpt-4o-mini',
      prompt,
      userId,
      useCase: 'quick_question',
      saveToChat: false
    });
  }

  // Deep analysis with extensive context
  async deepAnalysis(
    userId: string,
    prompt: string,
    mentorId?: string,
    sessionId?: string
  ): Promise<VectorAiResponse | null> {
    return this.generateResponse({
      model: 'openai/gpt-4o',
      prompt,
      userId,
      mentorId,
      sessionId,
      useCase: 'deep_analysis',
      saveToChat: true
    });
  }

  // General chat with enhanced context
  async generalChat(
    userId: string,
    prompt: string,
    mentorId?: string,
    sessionId?: string
  ): Promise<VectorAiResponse | null> {
    return this.generateResponse({
      model: 'openai/gpt-4o-mini',
      prompt,
      userId,
      mentorId,
      sessionId,
      useCase: 'general_chat',
      saveToChat: true
    });
  }
} 