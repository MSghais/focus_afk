import { PrismaClient } from '@prisma/client';
import { AgentFactory, AgentType } from './index';

/**
 * Example usage of the AI Agent System
 */
export class AgentSystemExample {
  private prisma: PrismaClient;
  private agentFactory: AgentFactory;

  constructor() {
    this.prisma = new PrismaClient();
    this.agentFactory = new AgentFactory(this.prisma);
  }

  /**
   * Example: Use the general agent to help with productivity
   */
  async exampleGeneralAgentUsage() {
    try {
      // Get the general agent
      const generalAgent = await this.agentFactory.getAgent(AgentType.GENERAL);
      
      // Example user interaction
      const userId = 'user-123';
      const sessionId = 'session-456';
      const userMessage = 'I need help organizing my tasks for today. I have a lot of work to do.';

      console.log('🤖 General Agent Example');
      console.log('User:', userMessage);
      
      // Process the message
      const response = await generalAgent.processMessage(
        userId,
        userMessage,
        sessionId
      );

      console.log('Agent Response:', response.content);
      console.log('Suggested Actions:', response.suggestedActions);
      console.log('Confidence:', response.confidence);
      console.log('Response Time:', response.metadata.responseTime, 'ms');

    } catch (error) {
      console.error('Error in general agent example:', error);
    }
  }

  /**
   * Example: Get context for a user
   */
  async exampleContextUsage() {
    try {
      const contextService = this.agentFactory.getContextService();
      
      const userId = 'user-123';
      const sessionId = 'session-456';
      
      console.log('📊 Context Service Example');
      
      // Build context for different agent types
      const generalContext = await contextService.buildContext(
        userId,
        AgentType.GENERAL,
        sessionId
      );

      const taskContext = await contextService.buildContext(
        userId,
        AgentType.TASK_MANAGEMENT,
        sessionId,
        ['tasks', 'goals'] // Only include specific sources
      );

      console.log('General Context Size:', generalContext.metadata.contextSize, 'bytes');
      console.log('Task Context Size:', taskContext.metadata.contextSize, 'bytes');
      console.log('User Level:', generalContext.user.profile?.level);
      console.log('Active Tasks:', generalContext.app.tasks?.length || 0);

    } catch (error) {
      console.error('Error in context example:', error);
    }
  }

  /**
   * Example: Get agent status and information
   */
  async exampleAgentStatus() {
    try {
      console.log('📈 Agent Status Example');
      
      // Get status of all agents
      const status = this.agentFactory.getAgentStatus();
      console.log('Agent Status:', status);

      // Get available agent types
      const availableTypes = this.agentFactory.getAvailableAgentTypes();
      console.log('Available Agent Types:', availableTypes);

      // Get cache statistics
      const contextService = this.agentFactory.getContextService();
      const cacheStats = contextService.getCacheStats();
      console.log('Cache Stats:', cacheStats);

    } catch (error) {
      console.error('Error in status example:', error);
    }
  }

  /**
   * Example: Update agent configuration
   */
  async exampleUpdateConfig() {
    try {
      console.log('⚙️ Configuration Update Example');
      
      // Update general agent configuration
      await this.agentFactory.updateAgentConfig(AgentType.GENERAL, {
        temperature: 0.8, // Make responses more creative
        maxTokens: 1500   // Allow longer responses
      });

      console.log('General agent configuration updated');

    } catch (error) {
      console.error('Error in config update example:', error);
    }
  }

  /**
   * Example: Cleanup and maintenance
   */
  async exampleCleanup() {
    try {
      console.log('🧹 Cleanup Example');
      
      // Clear agent cache
      this.agentFactory.clearAgentCache();
      console.log('Agent cache cleared');

      // Clear context cache
      const contextService = this.agentFactory.getContextService();
      contextService.clearCache();
      console.log('Context cache cleared');

      // Cleanup old context data
      await contextService.cleanupOldContext();
      console.log('Old context data cleaned up');

    } catch (error) {
      console.error('Error in cleanup example:', error);
    }
  }

  /**
   * Run all examples
   */
  async runAllExamples() {
    console.log('🚀 Running AI Agent System Examples\n');

    await this.exampleGeneralAgentUsage();
    console.log('\n' + '='.repeat(50) + '\n');

    await this.exampleContextUsage();
    console.log('\n' + '='.repeat(50) + '\n');

    await this.exampleAgentStatus();
    console.log('\n' + '='.repeat(50) + '\n');

    await this.exampleUpdateConfig();
    console.log('\n' + '='.repeat(50) + '\n');

    await this.exampleCleanup();
    console.log('\n✅ All examples completed!');
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    await this.prisma.$disconnect();
  }
}

// Example usage in a route or service
export async function handleAgentRequest(
  userId: string,
  userMessage: string,
  sessionId: string,
  agentType: AgentType = AgentType.GENERAL
) {
  const agentFactory = new AgentFactory(new PrismaClient());
  
  try {
    const agent = await agentFactory.getAgent(agentType);
    const response = await agent.processMessage(userId, userMessage, sessionId);
    
    return {
      success: true,
      response: response.content,
      suggestedActions: response.suggestedActions,
      confidence: response.confidence,
      metadata: response.metadata
    };
  } catch (error) {
    console.error('Agent request failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 