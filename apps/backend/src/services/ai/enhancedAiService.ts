import { generateText } from 'ai';
import { createOpenRouter, openrouter } from '@openrouter/ai-sdk-provider';
import { MemoryManager, MemoryContext } from '../memory/memoryManager';
import { PrismaClient } from '@prisma/client';
import { buildContextString } from '../helpers/contextHelper';

interface EnhancedLlmInputs {
  model: string;
  systemPrompt?: string;
  prompt: string;
  userId: string;
  mentorId?: string;
  sessionId?: string;
  enableMemory?: boolean;
  contextSources?: ('tasks' | 'goals' | 'sessions' | 'profile' | 'mentor' | 'badges' | 'quests' | 'settings')[];
  includeHistory?: boolean;
}

interface EnhancedLlmResponse {
  text: string;
  sources: any;
  usage: any;
  memory: {
    sessionId: string;
    contextVersion: number;
    memorySize: number;
    dataSources: string[];
  };
  originalPrompt: string;
  enhancedPrompt: string;
}

export class EnhancedAiService {
  private openRouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY!,
  });

  public memoryManager: MemoryManager;

  constructor(prisma: PrismaClient) {
    this.memoryManager = new MemoryManager(prisma, {
      maxMessages: 50,
      maxContextSize: 1024 * 1024, // 1MB
      retentionPeriod: 24, // 24 hours
      enableCompression: true,
      contextSources: ['tasks', 'goals', 'sessions', 'profile', 'mentor', 'badges', 'quests', 'settings'],
      maxItemsPerSource: 10
    });
  }

  // New: Update chat memory (messages) for a session
  async updateChatMemory(
    userId: string,
    mentorId: string | undefined,
    sessionId: string | undefined,
    messages: any[],
    dataSources?: string[]
  ): Promise<MemoryContext> {
    const sessionKey = sessionId || `${userId}_${mentorId || 'default'}`;
    return this.memoryManager.updateMemory(sessionKey, { messages, dataSources });
  }

  // Use context helper to build context string for LLM prompt
  async generateTextWithMemory(inputs: EnhancedLlmInputs): Promise<EnhancedLlmResponse | null> {
    try {
      let finalPrompt = inputs.prompt;
      let memory: MemoryContext | null = null;
      let enhancedPrompt = inputs.prompt;

      if (inputs.enableMemory !== false) {
        memory = await this.memoryManager.getOrCreateMemory(
          inputs.userId,
          inputs.mentorId,
          inputs.sessionId
        );
        // Use the context helper to build the context string
        const contextString = buildContextString(memory, inputs.contextSources);
        enhancedPrompt = `${contextString}\n\nCurrent User Message: ${inputs.prompt}\n\nPlease respond as the AI mentor, taking into account the user's current context and conversation history. Provide personalized, actionable advice.`;
        finalPrompt = enhancedPrompt;
      }

      const { text, sources, usage } = await generateText({
        model: openrouter(inputs.model),
        system: inputs.systemPrompt,
        prompt: finalPrompt,
      });

      if (inputs.enableMemory !== false && memory) {
        const sessionKey = inputs.sessionId || `${inputs.userId}_${inputs.mentorId || 'default'}`;
        const updatedMemory = await this.memoryManager.updateMemory(sessionKey, {
          messages: [
            ...memory.messages,
            {
              id: `temp_${Date.now()}`,
              role: 'user',
              content: inputs.prompt,
              createdAt: new Date()
            },
            {
              id: `temp_${Date.now() + 1}`,
              role: 'assistant',
              content: text,
              createdAt: new Date()
            }
          ]
        });
        return {
          text,
          sources,
          usage,
          memory: {
            sessionId: updatedMemory.sessionId,
            contextVersion: updatedMemory.metadata.contextVersion,
            memorySize: updatedMemory.metadata.memorySize,
            dataSources: updatedMemory.metadata.dataSources
          },
          originalPrompt: inputs.prompt,
          enhancedPrompt: enhancedPrompt
        };
      }

      return {
        text,
        sources,
        usage,
        memory: {
          sessionId: inputs.sessionId || `${inputs.userId}_${inputs.mentorId || 'default'}`,
          contextVersion: 0,
          memorySize: 0,
          dataSources: []
        },
        originalPrompt: inputs.prompt,
        enhancedPrompt: enhancedPrompt
      };
    } catch (error) {
      console.error('Error in generateTextWithMemory:', error);
      return null;
    }
  }

  // Get memory context for a session
  async getMemoryContext(
    userId: string,
    mentorId?: string,
    sessionId?: string
  ): Promise<MemoryContext | null> {
    return await this.memoryManager.getOrCreateMemory(userId, mentorId, sessionId);
  }

  // Update user context in memory
  async updateUserContext(
    userId: string,
    mentorId: string | undefined,
    sessionId: string | undefined,
    contextUpdates: Partial<MemoryContext['userContext']>
  ): Promise<void> {
    const sessionKey = sessionId || `${userId}_${mentorId || 'default'}`;
    await this.memoryManager.updateMemory(sessionKey, {
      userContext: contextUpdates
    });
  }

  // Refresh memory context from all sources
  async refreshMemoryContext(
    userId: string,
    mentorId: string | undefined,
    sessionId: string | undefined,
    requestedSources?: string[]
  ): Promise<MemoryContext> {
    return await this.memoryManager.refreshMemoryContext(userId, mentorId, sessionId, requestedSources);
  }

  // Clear memory for a session
  async clearMemory(sessionKey: string): Promise<boolean> {
    return await this.memoryManager.clearMemory(sessionKey);
  }

  // Get memory statistics
  getMemoryStats() {
    return this.memoryManager.getMemoryStats();
  }

  // Get available data sources
  getAvailableDataSources(): string[] {
    return this.memoryManager.getAvailableDataSources();
  }

  // Clean up expired memories
  async cleanupMemories(): Promise<number> {
    return await this.memoryManager.cleanup();
  }

  // Generate a simple response without memory (fallback)
  async generateSimpleResponse(
    model: string,
    systemPrompt: string | undefined,
    prompt: string
  ): Promise<{ text: string; sources: any; usage: any } | null> {
    try {
      const { text, sources, usage } = await generateText({
        model: openrouter(model),
        system: systemPrompt,
        prompt: prompt,
      });

      return { text, sources, usage };
    } catch (error) {
      console.error('Error in generateSimpleResponse:', error);
      return null;
    }
  }
}