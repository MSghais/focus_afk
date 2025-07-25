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
  ): Promise<MemoryContext | null> {
    try {
      const sessionKey = sessionId || `${userId}_${mentorId || 'default'}`;
      return await this.memoryManager.updateMemory(sessionKey, { messages, dataSources });
    } catch (error) {
      console.warn('Failed to update chat memory:', error);
      return null;
    }
  }

  // Use context helper to build context string for LLM prompt
  async generateTextWithMemory(inputs: EnhancedLlmInputs): Promise<EnhancedLlmResponse | null> {
    try {
      let finalPrompt = inputs.prompt;
      let memory: MemoryContext | null | undefined = null;
      let enhancedPrompt = inputs.prompt;
      let memoryError = false;

      // Try to get memory context, but don't fail if it doesn't work
      if (inputs.enableMemory !== false) {
        try {
          console.log(`Getting memory context for user ${inputs.userId}, mentor ${inputs.mentorId}, session ${inputs.sessionId}`);
          memory = await this.memoryManager.getOrCreateMemory(
            inputs.userId,
            inputs.mentorId,
            inputs.sessionId
          );
          console.log(`Successfully retrieved memory context with ${memory?.messages?.length || 0} messages`);
          // Use the context helper to build the context string
          const contextString = buildContextString(memory, inputs.contextSources);
          enhancedPrompt = `${contextString}\n\nCurrent User Message: ${inputs.prompt}\n\nPlease respond as the AI mentor, taking into account the user's current context and conversation history. Provide personalized, actionable advice.`;
          finalPrompt = enhancedPrompt;
        } catch (memoryError) {
          console.warn('Memory context failed, proceeding without memory:', memoryError);
          memoryError = true;
          // Fall back to simple prompt
          enhancedPrompt = `Current User Message: ${inputs.prompt}\n\nPlease respond as the AI mentor. Provide helpful, actionable advice.`;
          finalPrompt = enhancedPrompt;
        }
      }

      // Generate AI response - this is the core functionality that must work
      let text: string;
      let sources: any;
      let usage: any;
      
      try {
        const response = await generateText({
          model: openrouter(inputs.model),
          system: inputs.systemPrompt,
          prompt: finalPrompt,
        });
        text = response.text;
        sources = response.sources;
        usage = response.usage;
      } catch (aiError) {
        console.error('AI generation failed:', aiError);
        // Return a fallback response
        text = "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.";
        sources = null;
        usage = null;
      }

      // Try to update memory, but don't fail if it doesn't work
      if (inputs.enableMemory !== false && memory && !memoryError) {
        try {
          console.log(`Updating memory for session ${inputs.sessionId || `${inputs.userId}_${inputs.mentorId || 'default'}`}`);
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
          console.log(`Successfully updated memory with ${updatedMemory.messages.length} messages`);
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
        } catch (updateError) {
          console.warn('Memory update failed, returning response without memory update:', updateError);
          // Return response without memory update
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
        }
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

  // Test method to verify memory failure handling
  async testMemoryFailureHandling(inputs: EnhancedLlmInputs): Promise<EnhancedLlmResponse | null> {
    console.log('Testing memory failure handling...');
    
    // Force memory to fail by passing invalid parameters
    const testInputs = {
      ...inputs,
      userId: 'invalid_user_id',
      mentorId: 'invalid_mentor_id'
    };
    
    return this.generateTextWithMemory(testInputs);
  }

  // Get memory context for a session
  async getMemoryContext(
    userId: string,
    mentorId?: string,
    sessionId?: string
  ): Promise<MemoryContext | null | undefined> {
    try {
      return await this.memoryManager.getOrCreateMemory(userId, mentorId, sessionId);
    } catch (error) {
      console.warn('Failed to get memory context:', error);
      return null;
    }
  }

  // Update user context in memory
  async updateUserContext(
    userId: string,
    mentorId: string | undefined,
    sessionId: string | undefined,
    contextUpdates: Partial<MemoryContext['userContext']>
  ): Promise<boolean> {
    try {
      const sessionKey = sessionId || `${userId}_${mentorId || 'default'}`;
      await this.memoryManager.updateMemory(sessionKey, {
        userContext: contextUpdates
      });
      return true;
    } catch (error) {
      console.warn('Failed to update user context:', error);
      return false;
    }
  }

  // Refresh memory context from all sources
  async refreshMemoryContext(
    userId: string,
    mentorId: string | undefined,
    sessionId: string | undefined,
    requestedSources?: string[]
  ): Promise<MemoryContext | null> {
    try {
      return await this.memoryManager.refreshMemoryContext(userId, mentorId, sessionId, requestedSources);
    } catch (error) {
      console.warn('Failed to refresh memory context:', error);
      return null;
    }
  }

  // Clear memory for a session
  async clearMemory(sessionKey: string): Promise<boolean> {
    try {
      return await this.memoryManager.clearMemory(sessionKey);
    } catch (error) {
      console.warn('Failed to clear memory:', error);
      return false;
    }
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
    try {
      return await this.memoryManager.cleanup();
    } catch (error) {
      console.warn('Failed to cleanup memories:', error);
      return 0;
    }
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