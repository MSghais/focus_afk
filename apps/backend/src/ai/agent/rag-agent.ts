import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { StructuredTool } from '@langchain/core/tools';
import { AgentType, AgentConfig, AgentResponse, AgentContext, SuggestedAction } from './types';
import { ContextService } from './context-service';
import { VectorStoreManager, SearchResult } from './vector-store';
import { PrismaClient } from '@prisma/client';

export interface RAGConfig {
  enableVectorSearch: boolean;
  searchThreshold: number;
  maxSearchResults: number;
  includeSearchContext: boolean;
  documentTypes: string[];
  rerankResults: boolean;
}

export class RAGAgent {
  private config: AgentConfig;
  private contextService: ContextService;
  private vectorStore: VectorStoreManager;
  private model: BaseChatModel;
  private ragConfig: RAGConfig;

  constructor(
    config: AgentConfig,
    contextService: ContextService,
    vectorStore: VectorStoreManager,
    prisma: PrismaClient,
    ragConfig?: Partial<RAGConfig>
  ) {
    this.config = config;
    this.contextService = contextService;
    this.vectorStore = vectorStore;
    this.model = config.model;
    this.ragConfig = {
      enableVectorSearch: true,
      searchThreshold: 0.7,
      maxSearchResults: 5,
      includeSearchContext: true,
      documentTypes: ['task', 'goal', 'note', 'session', 'quest', 'badge'],
      rerankResults: false,
      ...ragConfig
    };
  }

  async processMessage(
    userId: string,
    userMessage: string,
    sessionId: string,
    context?: Partial<AgentContext>
  ): Promise<AgentResponse> {
    const startTime = Date.now();

    try {
      // Build optimized context
      const fullContext = await this.contextService.buildContext(
        userId,
        this.config.type,
        sessionId
      );

      // Perform vector search if enabled
      let searchResults: SearchResult[] = [];
      let searchContext = '';

      if (this.ragConfig.enableVectorSearch) {
        searchResults = await this.performVectorSearch(userMessage, userId);
        if (this.ragConfig.includeSearchContext && searchResults.length > 0) {
          searchContext = this.formatSearchContext(searchResults);
        }
      }

      // Create enhanced prompt with search context
      const prompt = this.buildEnhancedPrompt(userMessage, fullContext, searchContext);

      // Get response from model
      const result = await this.model.invoke([
        new SystemMessage(prompt),
        new HumanMessage(userMessage)
      ]);

      // Parse the response
      const response = this.parseAgentResponse(result, startTime, searchResults);

      return response;
    } catch (error) {
      console.error('Error in RAG agent:', error);
      return this.createErrorResponse(error, startTime);
    }
  }

  /**
   * Perform vector search for relevant documents
   */
  private async performVectorSearch(query: string, userId: string): Promise<SearchResult[]> {
    try {
      const results = await this.vectorStore.search(
        query,
        userId,
        this.ragConfig.documentTypes,
        this.ragConfig.maxSearchResults
      );

      // Filter by threshold
      const filteredResults = results.filter(result => 
        result.score >= this.ragConfig.searchThreshold
      );

      // Rerank if enabled
      if (this.ragConfig.rerankResults) {
        return this.rerankResults(filteredResults, query);
      }

      return filteredResults;
    } catch (error) {
      console.error('Vector search failed:', error);
      return [];
    }
  }

  /**
   * Rerank search results based on relevance
   */
  private rerankResults(results: SearchResult[], query: string): SearchResult[] {
    // Simple reranking based on content relevance
    return results.sort((a, b) => {
      const aRelevance = this.calculateRelevance(a.content, query);
      const bRelevance = this.calculateRelevance(b.content, query);
      return bRelevance - aRelevance;
    });
  }

  /**
   * Calculate relevance score between content and query
   */
  private calculateRelevance(content: string, query: string): number {
    const contentLower = content.toLowerCase();
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);
    
    let score = 0;
    for (const word of queryWords) {
      if (word.length > 2 && contentLower.includes(word)) {
        score += 1;
      }
    }
    
    return score / queryWords.length;
  }

  /**
   * Format search results into context string
   */
  private formatSearchContext(searchResults: SearchResult[]): string {
    if (searchResults.length === 0) return '';

    let context = '\n\nRelevant Information from Your Data:\n';
    context += '='.repeat(50) + '\n';

    for (const result of searchResults) {
      const type = result.document.type.toUpperCase();
      const score = (result.score * 100).toFixed(1);
      context += `[${type}] (Relevance: ${score}%)\n`;
      context += `${result.content}\n\n`;
    }

    return context;
  }

  /**
   * Build enhanced prompt with search context
   */
  private buildEnhancedPrompt(userMessage: string, context: AgentContext, searchContext: string): string {
    const { user, app } = context;
    
    let prompt = `You are a RAG-enhanced AI assistant for the Focus AFK productivity app. You have access to both real-time context and semantic search results from the user's data.

Key Responsibilities:
- Help users manage their tasks, goals, focus sessions, and productivity
- Use semantic search to provide personalized, context-aware responses
- Leverage the user's historical data for better recommendations
- Provide actionable insights based on patterns in their data

Current User Status:
- Name: ${user.profile?.name || 'User'}
- Level: ${user.profile?.level || 1}
- XP: ${user.profile?.totalXp || 0}
- Focus Streak: ${user.profile?.streak || 0} days
- Total Focus Minutes: ${user.profile?.totalFocusMinutes || 0}

Current Tasks: ${app.tasks?.length || 0} tasks
- Pending: ${app.tasks?.filter(t => !t.completed).length || 0}
- Completed: ${app.tasks?.filter(t => t.completed).length || 0}

Current Goals: ${app.goals?.length || 0} goals
- Active: ${app.goals?.filter(g => !g.completed).length || 0}
- Completed: ${app.goals?.filter(g => g.completed).length || 0}

Current Session: ${app.timerSessions?.find(s => !s.completed) ? 'Active' : 'None'}

Guidelines:
- Be encouraging and supportive
- Use the search results to provide personalized advice
- Reference specific tasks, goals, or sessions when relevant
- Suggest actions based on patterns in their data
- Keep responses concise but helpful
- If the user wants to perform actions, let them know they can use the app's interface

Available Tools: ${this.config.tools.map(tool => tool.name).join(', ')}

${searchContext}

Use the search results and context above to provide the most relevant and personalized response.`;

    return prompt;
  }

  /**
   * Parse agent response with search metadata
   */
  private parseAgentResponse(result: any, startTime: number, searchResults: SearchResult[]): AgentResponse {
    const responseTime = Date.now() - startTime;
    
    return {
      content: result.content || result.text || 'I understand. How can I help you further?',
      agentType: this.config.type,
      confidence: this.calculateConfidence(searchResults),
      suggestedActions: this.extractSuggestedActions(result, searchResults),
      contextUpdates: {},
      metadata: {
        responseTime,
        toolCalls: 0,
        model: this.config.model.constructor.name,
        searchResults: searchResults.length,
        searchScores: searchResults.map(r => r.score),
        searchTypes: searchResults.map(r => r.document.type)
      }
    };
  }

  /**
   * Calculate confidence based on search results
   */
  private calculateConfidence(searchResults: SearchResult[]): number {
    if (searchResults.length === 0) return 0.6; // Base confidence without search
    
    const avgScore = searchResults.reduce((sum, r) => sum + r.score, 0) / searchResults.length;
    const resultCount = Math.min(searchResults.length, 5); // Cap at 5 results
    
    // Higher confidence with more relevant results
    return Math.min(0.9, 0.6 + (avgScore * 0.2) + (resultCount * 0.02));
  }

  /**
   * Extract suggested actions with search context
   */
  private extractSuggestedActions(result: any, searchResults: SearchResult[]): SuggestedAction[] {
    const actions: SuggestedAction[] = [];
    const content = result.content || result.text || '';

    // Add actions based on search results
    for (const searchResult of searchResults) {
      const type = searchResult.document.type;
      
      switch (type) {
        case 'task':
          actions.push({
            type: 'task',
            action: 'view_task',
            parameters: { taskId: searchResult.document.metadata.taskId },
            priority: 'high',
            description: `View task: ${searchResult.content.substring(0, 50)}...`
          });
          break;
        case 'goal':
          actions.push({
            type: 'goal',
            action: 'view_goal',
            parameters: { goalId: searchResult.document.metadata.goalId },
            priority: 'high',
            description: `View goal: ${searchResult.content.substring(0, 50)}...`
          });
          break;
        case 'session':
          actions.push({
            type: 'timer',
            action: 'view_session',
            parameters: { sessionId: searchResult.document.metadata.sessionId },
            priority: 'medium',
            description: `View session details`
          });
          break;
      }
    }

    // Add general actions based on content
    if (content.toLowerCase().includes('task')) {
      actions.push({
        type: 'task',
        action: 'view_tasks',
        parameters: {},
        priority: 'medium',
        description: 'View your current tasks'
      });
    }

    if (content.toLowerCase().includes('goal')) {
      actions.push({
        type: 'goal',
        action: 'view_goals',
        parameters: {},
        priority: 'medium',
        description: 'View your current goals'
      });
    }

    if (content.toLowerCase().includes('timer') || content.toLowerCase().includes('focus')) {
      actions.push({
        type: 'timer',
        action: 'start_focus_session',
        parameters: {},
        priority: 'medium',
        description: 'Start a focus session'
      });
    }

    return actions;
  }

  /**
   * Create error response
   */
  private createErrorResponse(error: any, startTime: number): AgentResponse {
    const responseTime = Date.now() - startTime;
    
    return {
      content: 'I apologize, but I encountered an error while processing your request. Please try again or rephrase your question.',
      agentType: this.config.type,
      confidence: 0.0,
      suggestedActions: [],
      contextUpdates: {},
      metadata: {
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: 'rag_agent_error'
      }
    };
  }

  /**
   * Index user documents for vector search
   */
  async indexUserDocuments(userId: string, documentTypes?: string[]): Promise<void> {
    await this.vectorStore.indexUserDocuments(userId, documentTypes);
  }

  /**
   * Get search statistics
   */
  async getSearchStats(userId: string): Promise<{
    totalDocuments: number;
    searchableTypes: string[];
    lastIndexed: Date;
  }> {
    const stats = await this.vectorStore.getIndexingStats();
    return {
      totalDocuments: stats.totalDocuments,
      searchableTypes: this.ragConfig.documentTypes,
      lastIndexed: new Date()
    };
  }

  /**
   * Update RAG configuration
   */
  updateRAGConfig(newConfig: Partial<RAGConfig>): void {
    this.ragConfig = { ...this.ragConfig, ...newConfig };
  }

  /**
   * Get agent status with RAG info
   */
  getStatus() {
    return {
      type: this.config.type,
      name: this.config.name,
      isActive: true,
      tools: this.config.tools.map(t => t.name),
      model: this.config.model.constructor.name,
      ragEnabled: this.ragConfig.enableVectorSearch,
      searchThreshold: this.ragConfig.searchThreshold,
      maxSearchResults: this.ragConfig.maxSearchResults
    };
  }
} 