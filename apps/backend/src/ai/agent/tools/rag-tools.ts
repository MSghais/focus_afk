import { StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { VectorStoreManager } from '../vector-store';

export class VectorSearchTool extends StructuredTool {
  name = 'vector_search';
  description = 'Search for relevant information in the user\'s data using semantic search';
  schema = z.object({
    query: z.string().describe('The search query to find relevant information'),
    documentTypes: z.array(z.enum(['task', 'goal', 'note', 'session', 'quest', 'badge', 'user_profile'])).optional().describe('Types of documents to search in'),
    maxResults: z.number().optional().describe('Maximum number of results to return'),
    userId: z.string().describe('ID of the user to search for')
  });

  constructor(
    private prisma: PrismaClient,
    private vectorStore: VectorStoreManager
  ) {
    super();
  }

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const results = await this.vectorStore.search(
        input.query,
        input.userId,
        input.documentTypes,
        input.maxResults
      );

      if (results.length === 0) {
        return JSON.stringify({
          success: true,
          results: [],
          message: 'No relevant information found for your query.'
        });
      }

      const formattedResults = results.map(result => ({
        type: result.document.type,
        content: result.content,
        score: result.score,
        metadata: {
          id: result.document.metadata.taskId || result.document.metadata.goalId || result.document.metadata.noteId || result.document.metadata.sessionId || result.document.metadata.questId || result.document.metadata.badgeId,
          ...result.document.metadata
        }
      }));

      return JSON.stringify({
        success: true,
        results: formattedResults,
        totalResults: results.length,
        query: input.query
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export class IndexDocumentsTool extends StructuredTool {
  name = 'index_documents';
  description = 'Index user documents for vector search';
  schema = z.object({
    userId: z.string().describe('ID of the user whose documents to index'),
    documentTypes: z.array(z.enum(['task', 'goal', 'note', 'session', 'quest', 'badge', 'user_profile'])).optional().describe('Types of documents to index')
  });

  constructor(
    private prisma: PrismaClient,
    private vectorStore: VectorStoreManager
  ) {
    super();
  }

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      await this.vectorStore.indexUserDocuments(input.userId, input.documentTypes);
      
      return JSON.stringify({
        success: true,
        message: `Successfully indexed documents for user ${input.userId}`,
        documentTypes: input.documentTypes || ['task', 'goal', 'note', 'session', 'quest', 'badge']
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export class GetSearchContextTool extends StructuredTool {
  name = 'get_search_context';
  description = 'Get contextual information from search results for a query';
  schema = z.object({
    query: z.string().describe('The query to get context for'),
    userId: z.string().describe('ID of the user'),
    documentTypes: z.array(z.enum(['task', 'goal', 'note', 'session', 'quest', 'badge', 'user_profile'])).optional().describe('Types of documents to search in'),
    maxResults: z.number().optional().describe('Maximum number of results to include in context')
  });

  constructor(
    private prisma: PrismaClient,
    private vectorStore: VectorStoreManager
  ) {
    super();
  }

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const context = await this.vectorStore.getContextFromSearch(
        input.query,
        input.userId,
        input.documentTypes,
        input.maxResults
      );

      return JSON.stringify({
        success: true,
        context,
        query: input.query,
        userId: input.userId
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export class GetSearchStatsTool extends StructuredTool {
  name = 'get_search_stats';
  description = 'Get statistics about the vector search system';
  schema = z.object({
    userId: z.string().optional().describe('ID of the user to get stats for (optional)')
  });

  constructor(
    private prisma: PrismaClient,
    private vectorStore: VectorStoreManager
  ) {
    super();
  }

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const stats = await this.vectorStore.getIndexingStats();

      return JSON.stringify({
        success: true,
        stats: {
          totalDocuments: stats.totalDocuments,
          totalChunks: stats.totalChunks,
          users: stats.users,
          userId: input.userId
        }
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export class ClearUserDocumentsTool extends StructuredTool {
  name = 'clear_user_documents';
  description = 'Clear all indexed documents for a user';
  schema = z.object({
    userId: z.string().describe('ID of the user whose documents to clear')
  });

  constructor(
    private prisma: PrismaClient,
    private vectorStore: VectorStoreManager
  ) {
    super();
  }

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      await this.vectorStore.clearUserDocuments(input.userId);
      
      return JSON.stringify({
        success: true,
        message: `Successfully cleared documents for user ${input.userId}`
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export class SemanticSimilarityTool extends StructuredTool {
  name = 'semantic_similarity';
  description = 'Find semantically similar content in the user\'s data';
  schema = z.object({
    content: z.string().describe('The content to find similar items for'),
    userId: z.string().describe('ID of the user'),
    documentTypes: z.array(z.enum(['task', 'goal', 'note', 'session', 'quest', 'badge', 'user_profile'])).optional().describe('Types of documents to search in'),
    similarityThreshold: z.number().optional().describe('Minimum similarity score (0-1)'),
    maxResults: z.number().optional().describe('Maximum number of similar items to return')
  });

  constructor(
    private prisma: PrismaClient,
    private vectorStore: VectorStoreManager
  ) {
    super();
  }

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      const results = await this.vectorStore.search(
        input.content,
        input.userId,
        input.documentTypes,
        input.maxResults
      );

      // Filter by similarity threshold if provided
      const filteredResults = input.similarityThreshold 
        ? results.filter(r => r.score >= input.similarityThreshold!)
        : results;

      const similarItems = filteredResults.map(result => ({
        type: result.document.type,
        content: result.content,
        similarity: result.score,
        metadata: result.document.metadata
      }));

      return JSON.stringify({
        success: true,
        similarItems,
        totalFound: similarItems.length,
        originalContent: input.content
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export class KnowledgeRetrievalTool extends StructuredTool {
  name = 'knowledge_retrieval';
  description = 'Retrieve knowledge and insights from the user\'s data';
  schema = z.object({
    topic: z.string().describe('The topic or area to retrieve knowledge about'),
    userId: z.string().describe('ID of the user'),
    includePatterns: z.boolean().optional().describe('Whether to include pattern analysis'),
    includeRecommendations: z.boolean().optional().describe('Whether to include recommendations'),
    maxResults: z.number().optional().describe('Maximum number of knowledge items to retrieve')
  });

  constructor(
    private prisma: PrismaClient,
    private vectorStore: VectorStoreManager
  ) {
    super();
  }

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    try {
      // Search for relevant information
      const searchResults = await this.vectorStore.search(
        input.topic,
        input.userId,
        undefined, // All document types
        input.maxResults
      );

      // Analyze patterns if requested
      let patterns = null;
      if (input.includePatterns) {
        patterns = this.analyzePatterns(searchResults);
      }

      // Generate recommendations if requested
      let recommendations = null;
      if (input.includeRecommendations) {
        recommendations = this.generateRecommendations(searchResults, input.topic);
      }

      const knowledge = {
        topic: input.topic,
        relevantData: searchResults.map(r => ({
          type: r.document.type,
          content: r.content,
          relevance: r.score,
          metadata: r.document.metadata
        })),
        patterns,
        recommendations,
        totalItems: searchResults.length
      };

      return JSON.stringify({
        success: true,
        knowledge
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private analyzePatterns(searchResults: any[]): any {
    const patterns = {
      taskCompletion: 0,
      goalProgress: 0,
      sessionDuration: 0,
      productivityTrends: [],
      commonThemes: []
    };

    // Analyze task completion patterns
    const tasks = searchResults.filter(r => r.document.type === 'task');
    if (tasks.length > 0) {
      const completedTasks = tasks.filter(t => t.document.metadata.completed);
      patterns.taskCompletion = completedTasks.length / tasks.length;
    }

    // Analyze goal progress patterns
    const goals = searchResults.filter(r => r.document.type === 'goal');
    if (goals.length > 0) {
      const avgProgress = goals.reduce((sum, g) => sum + g.document.metadata.progress, 0) / goals.length;
      patterns.goalProgress = avgProgress;
    }

    // Analyze session patterns
    const sessions = searchResults.filter(r => r.document.type === 'session');
    if (sessions.length > 0) {
      const avgDuration = sessions.reduce((sum, s) => sum + s.document.metadata.duration, 0) / sessions.length;
      patterns.sessionDuration = avgDuration;
    }

    return patterns;
  }

  private generateRecommendations(searchResults: any[], topic: string): string[] {
    const recommendations = [];

    // Analyze task-related recommendations
    const tasks = searchResults.filter(r => r.document.type === 'task');
    if (tasks.length > 0) {
      const pendingTasks = tasks.filter(t => !t.document.metadata.completed);
      if (pendingTasks.length > 0) {
        recommendations.push(`You have ${pendingTasks.length} pending tasks related to "${topic}". Consider prioritizing them.`);
      }
    }

    // Analyze goal-related recommendations
    const goals = searchResults.filter(r => r.document.type === 'goal');
    if (goals.length > 0) {
      const lowProgressGoals = goals.filter(g => g.document.metadata.progress < 50);
      if (lowProgressGoals.length > 0) {
        recommendations.push(`You have ${lowProgressGoals.length} goals with low progress related to "${topic}". Consider breaking them down into smaller tasks.`);
      }
    }

    // Analyze session patterns
    const sessions = searchResults.filter(r => r.document.type === 'session');
    if (sessions.length > 0) {
      const avgDuration = sessions.reduce((sum, s) => sum + s.document.metadata.duration, 0) / sessions.length;
      if (avgDuration < 1500) { // Less than 25 minutes
        recommendations.push(`Your average focus sessions for "${topic}" are short. Consider longer, more focused sessions for better productivity.`);
      }
    }

    return recommendations;
  }
} 