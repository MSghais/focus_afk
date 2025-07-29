import { MemoryManager } from './memoryManager';
import { PineconeService } from './pinecone.service';
import { PrismaClient } from '@prisma/client';
import { MemoryConfig } from './memoryManager';

export class VectorMemoryManager extends MemoryManager {
  private pineconeService: PineconeService;

  constructor(prisma: PrismaClient, pineconeService: PineconeService, config?: Partial<MemoryConfig>) {
    super(prisma, config);
    this.pineconeService = pineconeService;
  }

  // Enhanced prompt generation with vector search
  async generateEnhancedPromptWithVectorSearch(
    userId: string,
    mentorId: string | undefined,
    userMessage: string,
    sessionId?: string,
    includeHistory: boolean = true,
    requestedSources?: string[]
  ): Promise<string> {
    // Get traditional context
    const basePrompt = await this.generateEnhancedPrompt(
      userId, mentorId, userMessage, sessionId, includeHistory, requestedSources
    );

    // Get vector-based relevant context
    const relevantContext = await this.pineconeService.retrieveUserContext(
      userId,
      userMessage,
      3, // top 3 most relevant items
      requestedSources
    );

    // Add vector-based context to prompt
    if (relevantContext.length > 0) {
      const vectorContext = relevantContext.map(ctx => 
        `[${ctx.type.toUpperCase()}] ${ctx.content}`
      ).join('\n');
      
      return `${basePrompt}\n\nMost Relevant Context:\n${vectorContext}\n\nPlease consider this relevant information when responding.`;
    }

    return basePrompt;
  }

  // Update vector embeddings when user data changes
  async updateUserEmbeddings(userId: string): Promise<void> {
    await this.pineconeService.batchStoreUserData(userId);
  }
}