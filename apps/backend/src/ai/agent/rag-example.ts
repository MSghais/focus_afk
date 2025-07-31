import { PrismaClient } from '@prisma/client';
import { AgentFactory, AgentType } from './index';

/**
 * RAG System Example - Demonstrates vector search and knowledge retrieval
 */
export class RAGSystemExample {
  private prisma: PrismaClient;
  private agentFactory: AgentFactory;

  constructor() {
    this.prisma = new PrismaClient();
    this.agentFactory = new AgentFactory(this.prisma);
  }

  /**
   * Example: Index user documents for vector search
   */
  async exampleDocumentIndexing() {
    try {
      console.log('📚 Document Indexing Example');
      
      const userId = 'user-123';
      
      // Index all document types
      const mentorAgent = await this.agentFactory.getAgent(AgentType.MENTOR);
      await mentorAgent.indexUserDocuments(userId);
      
      console.log('✅ Documents indexed successfully');
      
      // Get search statistics
      const stats = await mentorAgent.getSearchStats(userId);
      console.log('📊 Search Stats:', stats);

    } catch (error) {
      console.error('Error in document indexing example:', error);
    }
  }

  /**
   * Example: Use RAG agent for personalized responses
   */
  async exampleRAGAgentUsage() {
    try {
      console.log('🤖 RAG Agent Example');
      
      const userId = 'user-123';
      const sessionId = 'session-456';
      
      // Get the mentor agent (RAG-enabled)
      const mentorAgent = await this.agentFactory.getAgent(AgentType.MENTOR);
      
      // Example queries that benefit from RAG
      const queries = [
        'What tasks am I most productive with?',
        'Show me my progress on learning goals',
        'What patterns do you see in my focus sessions?',
        'Recommend tasks based on my past performance',
        'How can I improve my productivity based on my data?'
      ];

      for (const query of queries) {
        console.log(`\n🔍 Query: "${query}"`);
        
        const response = await mentorAgent.processMessage(
          userId,
          query,
          sessionId
        );

        console.log('🤖 Response:', response.content);
        console.log('📈 Confidence:', response.confidence);
        console.log('🔍 Search Results:', response.metadata.searchResults);
        console.log('📊 Search Scores:', response.metadata.searchScores);
        console.log('📝 Search Types:', response.metadata.searchTypes);
        console.log('⚡ Response Time:', response.metadata.responseTime, 'ms');
      }

    } catch (error) {
      console.error('Error in RAG agent example:', error);
    }
  }

  /**
   * Example: Productivity analysis with RAG
   */
  async exampleProductivityAnalysis() {
    try {
      console.log('📊 Productivity Analysis Example');
      
      const userId = 'user-123';
      const sessionId = 'session-456';
      
      // Get the productivity analysis agent
      const analysisAgent = await this.agentFactory.getAgent(AgentType.PRODUCTIVITY_ANALYSIS);
      
      const analysisQueries = [
        'Analyze my task completion patterns',
        'What are my most productive focus sessions?',
        'Show me trends in my goal progress',
        'Identify areas where I can improve',
        'What time of day am I most productive?'
      ];

      for (const query of analysisQueries) {
        console.log(`\n📈 Analysis: "${query}"`);
        
        const response = await analysisAgent.processMessage(
          userId,
          query,
          sessionId
        );

        console.log('📊 Analysis:', response.content);
        console.log('🎯 Confidence:', response.confidence);
        console.log('📋 Suggested Actions:', response.suggestedActions.length);
      }

    } catch (error) {
      console.error('Error in productivity analysis example:', error);
    }
  }

  /**
   * Example: Vector search capabilities
   */
  async exampleVectorSearch() {
    try {
      console.log('🔍 Vector Search Example');
      
      const vectorStore = this.agentFactory.getContextService();
      const userId = 'user-123';
      
      const searchQueries = [
        'high priority tasks',
        'learning goals',
        'focus sessions',
        'completed quests',
        'productivity tips'
      ];

      for (const query of searchQueries) {
        console.log(`\n🔍 Searching for: "${query}"`);
        
        const context = await vectorStore.buildContextString({
          user: { userId },
          app: { tasks: [], goals: [], timerSessions: [] },
          conversation: [],
          sessionId: 'test',
          agentType: AgentType.GENERAL,
          metadata: {}
        });

        console.log('📄 Context Length:', context.length, 'characters');
      }

    } catch (error) {
      console.error('Error in vector search example:', error);
    }
  }

  /**
   * Example: Knowledge retrieval and insights
   */
  async exampleKnowledgeRetrieval() {
    try {
      console.log('🧠 Knowledge Retrieval Example');
      
      const userId = 'user-123';
      const sessionId = 'session-456';
      
      const mentorAgent = await this.agentFactory.getAgent(AgentType.MENTOR);
      
      const knowledgeQueries = [
        'What insights can you provide about my productivity patterns?',
        'Based on my data, what recommendations do you have?',
        'What are my strengths and areas for improvement?',
        'How can I optimize my focus sessions?',
        'What goals should I prioritize based on my progress?'
      ];

      for (const query of knowledgeQueries) {
        console.log(`\n🧠 Knowledge Query: "${query}"`);
        
        const response = await mentorAgent.processMessage(
          userId,
          query,
          sessionId
        );

        console.log('💡 Insights:', response.content);
        console.log('🎯 Confidence:', response.confidence);
        console.log('📋 Actions:', response.suggestedActions.map(a => a.description));
      }

    } catch (error) {
      console.error('Error in knowledge retrieval example:', error);
    }
  }

  /**
   * Example: RAG configuration and optimization
   */
  async exampleRAGConfiguration() {
    try {
      console.log('⚙️ RAG Configuration Example');
      
      const mentorAgent = await this.agentFactory.getAgent(AgentType.MENTOR);
      
      // Get current status
      const status = mentorAgent.getStatus();
      console.log('📊 Current Status:', status);
      
      // Update RAG configuration
      mentorAgent.updateRAGConfig({
        searchThreshold: 0.8, // Higher threshold for more precise results
        maxSearchResults: 12, // More results for comprehensive analysis
        rerankResults: true, // Enable reranking
        documentTypes: ['task', 'goal', 'session', 'note'] // Focus on specific types
      });
      
      console.log('✅ RAG configuration updated');
      
      // Test with new configuration
      const response = await mentorAgent.processMessage(
        'user-123',
        'What are my most successful productivity strategies?',
        'session-456'
      );
      
      console.log('🔍 Enhanced Response:', response.content);
      console.log('📈 Enhanced Confidence:', response.confidence);

    } catch (error) {
      console.error('Error in RAG configuration example:', error);
    }
  }

  /**
   * Example: Semantic similarity search
   */
  async exampleSemanticSimilarity() {
    try {
      console.log('🔗 Semantic Similarity Example');
      
      const userId = 'user-123';
      const sessionId = 'session-456';
      
      const mentorAgent = await this.agentFactory.getAgent(AgentType.MENTOR);
      
      const similarityQueries = [
        'Find tasks similar to "Learn React"',
        'What goals are related to "Improve coding skills"?',
        'Show me sessions similar to my most productive ones',
        'Find notes related to "productivity techniques"'
      ];

      for (const query of similarityQueries) {
        console.log(`\n🔗 Similarity Query: "${query}"`);
        
        const response = await mentorAgent.processMessage(
          userId,
          query,
          sessionId
        );

        console.log('🔍 Similar Items:', response.content);
        console.log('📊 Search Results:', response.metadata.searchResults);
      }

    } catch (error) {
      console.error('Error in semantic similarity example:', error);
    }
  }

  /**
   * Example: Pattern analysis and recommendations
   */
  async examplePatternAnalysis() {
    try {
      console.log('📈 Pattern Analysis Example');
      
      const userId = 'user-123';
      const sessionId = 'session-456';
      
      const analysisAgent = await this.agentFactory.getAgent(AgentType.PRODUCTIVITY_ANALYSIS);
      
      const patternQueries = [
        'Analyze my task completion patterns over time',
        'What patterns do you see in my focus sessions?',
        'How do my goals progress over time?',
        'What are the common themes in my most successful days?',
        'Identify patterns in my productivity cycles'
      ];

      for (const query of patternQueries) {
        console.log(`\n📈 Pattern Analysis: "${query}"`);
        
        const response = await analysisAgent.processMessage(
          userId,
          query,
          sessionId
        );

        console.log('📊 Pattern Analysis:', response.content);
        console.log('🎯 Confidence:', response.confidence);
        console.log('📋 Recommendations:', response.suggestedActions.length);
      }

    } catch (error) {
      console.error('Error in pattern analysis example:', error);
    }
  }

  /**
   * Run all RAG examples
   */
  async runAllRAGExamples() {
    console.log('🚀 Running RAG System Examples\n');

    await this.exampleDocumentIndexing();
    console.log('\n' + '='.repeat(60) + '\n');

    await this.exampleRAGAgentUsage();
    console.log('\n' + '='.repeat(60) + '\n');

    await this.exampleProductivityAnalysis();
    console.log('\n' + '='.repeat(60) + '\n');

    await this.exampleVectorSearch();
    console.log('\n' + '='.repeat(60) + '\n');

    await this.exampleKnowledgeRetrieval();
    console.log('\n' + '='.repeat(60) + '\n');

    await this.exampleRAGConfiguration();
    console.log('\n' + '='.repeat(60) + '\n');

    await this.exampleSemanticSimilarity();
    console.log('\n' + '='.repeat(60) + '\n');

    await this.examplePatternAnalysis();
    console.log('\n✅ All RAG examples completed!');
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    await this.prisma.$disconnect();
  }
}

// Example usage function for RAG system
export async function handleRAGRequest(
  userId: string,
  userMessage: string,
  sessionId: string,
  agentType: AgentType = AgentType.MENTOR
) {
  const agentFactory = new AgentFactory(new PrismaClient());
  
  try {
    const agent = await agentFactory.getAgent(agentType);
    
    // Index documents if needed
    if (agentType === AgentType.MENTOR || agentType === AgentType.PRODUCTIVITY_ANALYSIS) {
      await agent.indexUserDocuments(userId);
    }
    
    const response = await agent.processMessage(userId, userMessage, sessionId);
    
    return {
      success: true,
      response: response.content,
      suggestedActions: response.suggestedActions,
      confidence: response.confidence,
      metadata: {
        ...response.metadata,
        agentType,
        searchResults: response.metadata.searchResults || 0,
        searchScores: response.metadata.searchScores || []
      }
    };
  } catch (error) {
    console.error('RAG request failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 