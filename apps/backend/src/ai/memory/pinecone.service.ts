import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PrismaClient } from "@prisma/client";

interface UserEmbedding {
  userId: string;
  content: string;
  type: 'task' | 'goal' | 'session' | 'note' | 'message' | 'profile';
  metadata: Record<string, any>;
  timestamp: Date;
  score?: number;
}

export class PineconeService {
  private pinecone: Pinecone;
  private embeddings: OpenAIEmbeddings;
  private prisma: PrismaClient;
  private indexName: string;

  constructor(prisma: PrismaClient) {
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    this.prisma = prisma;
    this.indexName = process.env.PINECONE_INDEX_NAME || "user-contexts";
  }

  private getIndex() {
    return this.pinecone.index(this.indexName);
  }

  // Create user-specific namespace
  private getUserNamespace(userId: string): string {
    return `user_${userId}`;
  }

  // Embed and store user context
  async storeUserContext(embedding: UserEmbedding): Promise<void> {
    const index = this.getIndex();
    const namespace = this.getUserNamespace(embedding.userId);
    
    // Generate embedding
    const vector = await this.embeddings.embedQuery(embedding.content);
    
    // Store in Pinecone with user-specific namespace
    await index.namespace(namespace).upsert([{
      id: `${embedding.type}_${embedding.userId}_${Date.now()}`,
      values: vector,
      metadata: {
        userId: embedding.userId,
        type: embedding.type,
        content: embedding.content,
        timestamp: embedding.timestamp.toISOString(),
        ...embedding.metadata
      }
    }]);
  }

  // Retrieve relevant context for a user query
  async retrieveUserContext(
    userId: string, 
    query: string, 
    topK: number = 5,
    types?: string[]
  ): Promise<UserEmbedding[]> {
    const index = this.getIndex();
    const namespace = this.getUserNamespace(userId);
    
    // Generate query embedding
    const queryVector = await this.embeddings.embedQuery(query);
    
    // Build filter for specific types if provided
    const filter: any = {};
    if (types && types.length > 0) {
      filter.type = { $in: types };
    }
    
    // Query Pinecone
    const results = await index.namespace(namespace).query({
      vector: queryVector,
      topK,
      filter,
      includeMetadata: true
    });

    return results.matches?.map(match => ({
      userId: match.metadata?.userId as string,
      content: match.metadata?.content as string,
      type: match.metadata?.type as "goal" | "task" | "session" | "note" | "message" | "profile",
      metadata: match.metadata || {},
      timestamp: new Date(match.metadata?.timestamp as string),
      score: match.score
    })) || [];
  }

  // Batch store user data
  async batchStoreUserData(userId: string): Promise<void> {
    // Store tasks
    const tasks = await this.prisma.task.findMany({
      where: { userId, isArchived: false }
    });
    
    for (const task of tasks) {
      await this.storeUserContext({
        userId,
        content: `Task: ${task.title}. ${task.description || ''}. Priority: ${task.priority}. Status: ${task.completed ? 'completed' : 'pending'}`,
        type: 'task',
        metadata: {
          taskId: task.id,
          priority: task.priority,
          completed: task.completed,
          category: task.category
        },
        timestamp: task.updatedAt
      });
    }

    // Store goals
    const goals = await this.prisma.goal.findMany({
      where: { userId, isArchived: false }
    });
    
    for (const goal of goals) {
      await this.storeUserContext({
        userId,
        content: `Goal: ${goal.title}. ${goal.description || ''}. Progress: ${goal.progress}%. Topics: ${goal.topics.join(', ')}`,
        type: 'goal',
        metadata: {
          goalId: goal.id,
          progress: goal.progress,
          topics: goal.topics
        },
        timestamp: goal.updatedAt
      });
    }

    // Store recent sessions
    const sessions = await this.prisma.timerSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    
    for (const session of sessions) {
      await this.storeUserContext({
        userId,
        content: `Focus session: ${session.type} for ${Math.round(session.duration / 60)} minutes. Notes: ${session.note || 'No notes'}. Activities: ${session.activities.join(', ')}`,
        type: 'session',
        metadata: {
          sessionId: session.id,
          duration: session.duration,
          type: session.type,
          activities: session.activities
        },
        timestamp: session.createdAt
      });
    }

    // Store notes
    const notes = await this.prisma.notes.findMany({
      where: { userId }
    });
    
    for (const note of notes) {
      await this.storeUserContext({
        userId,
        content: `Note: ${note.title || 'Untitled'}. ${note.text || ''}. Topics: ${note.topics.join(', ')}`,
        type: 'note',
        metadata: {
          noteId: note.id,
          topics: note.topics,
          type: note.type
        },
        timestamp: note.updatedAt
      });
    }
  }

  // Delete user data (for GDPR compliance)
  async deleteUserData(userId: string): Promise<void> {
    const index = this.getIndex();
    const namespace = this.getUserNamespace(userId);
    
    // Delete all vectors in user namespace
    await index.namespace(namespace).deleteAll();
  }
}