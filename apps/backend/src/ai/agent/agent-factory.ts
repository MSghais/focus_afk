import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatOpenAI } from '@langchain/openai';
import { PrismaClient } from '@prisma/client';
import { AgentType, AgentConfig } from './types';
import { GeneralAgent } from './general-agent';
import { RAGAgent } from './rag-agent';
import { ContextService } from './context-service';
import { VectorStoreManager } from './vector-store';
import { CreateTaskTool, UpdateTaskTool, DeleteTaskTool, GetTasksTool, ToggleTaskCompleteTool } from './tools/task-tools';
import { VectorSearchTool, IndexDocumentsTool, GetSearchContextTool, GetSearchStatsTool, ClearUserDocumentsTool, SemanticSimilarityTool, KnowledgeRetrievalTool } from './tools/rag-tools';

export class AgentFactory {
  private prisma: PrismaClient;
  private contextService: ContextService;
  private vectorStore: VectorStoreManager;
  private agents: Map<AgentType, any> = new Map();

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.contextService = new ContextService(prisma);
    this.vectorStore = new VectorStoreManager(prisma);
  }

  /**
   * Create or get an agent of the specified type
   */
  async getAgent(agentType: AgentType): Promise<any> {
    if (this.agents.has(agentType)) {
      return this.agents.get(agentType);
    }

    const agent = await this.createAgent(agentType);
    this.agents.set(agentType, agent);
    return agent;
  }

  /**
   * Create a new agent of the specified type
   */
  private async createAgent(agentType: AgentType): Promise<any> {
    const config = await this.createAgentConfig(agentType);
    
    switch (agentType) {
      case AgentType.GENERAL:
        return new GeneralAgent(config, this.contextService, this.prisma);
      
      case AgentType.MENTOR:
        return new RAGAgent(config, this.contextService, this.vectorStore, this.prisma, {
          enableVectorSearch: true,
          searchThreshold: 0.7,
          maxSearchResults: 8,
          includeSearchContext: true,
          documentTypes: ['task', 'goal', 'note', 'session', 'quest', 'badge'],
          rerankResults: true
        });
      
      case AgentType.PRODUCTIVITY_ANALYSIS:
        return new RAGAgent(config, this.contextService, this.vectorStore, this.prisma, {
          enableVectorSearch: true,
          searchThreshold: 0.6,
          maxSearchResults: 10,
          includeSearchContext: true,
          documentTypes: ['task', 'goal', 'session', 'note'],
          rerankResults: true
        });
      
      // Add other agent types here as they are implemented
      // case AgentType.TASK_MANAGEMENT:
      //   return new TaskManagementAgent(config, this.contextService, this.prisma);
      
      default:
        throw new Error(`Agent type ${agentType} not implemented`);
    }
  }

  /**
   * Create configuration for an agent type
   */
  private async createAgentConfig(agentType: AgentType): Promise<AgentConfig> {
    const model = this.createModel();
    const tools = await this.createTools(agentType);

    const configs: Record<AgentType, Partial<AgentConfig>> = {
      [AgentType.GENERAL]: {
        name: 'General Assistant',
        description: 'A general-purpose AI assistant for productivity and focus',
        systemPrompt: `You are a helpful AI assistant for the Focus AFK productivity app. Help users with tasks, goals, focus sessions, and productivity.`,
        temperature: 0.7,
        maxTokens: 1000
      },
      [AgentType.TASK_MANAGEMENT]: {
        name: 'Task Manager',
        description: 'Specialized agent for task management',
        systemPrompt: `You are a task management specialist. Help users create, organize, and complete tasks effectively.`,
        temperature: 0.5,
        maxTokens: 800
      },
      [AgentType.GOAL_TRACKING]: {
        name: 'Goal Tracker',
        description: 'Specialized agent for goal setting and tracking',
        systemPrompt: `You are a goal tracking specialist. Help users set meaningful goals and track their progress.`,
        temperature: 0.6,
        maxTokens: 800
      },
      [AgentType.FOCUS_TIMER]: {
        name: 'Focus Timer',
        description: 'Specialized agent for focus sessions and time management',
        systemPrompt: `You are a focus and time management specialist. Help users optimize their focus sessions and time usage.`,
        temperature: 0.5,
        maxTokens: 600
      },
      [AgentType.GAMIFICATION]: {
        name: 'Gamification Coach',
        description: 'Specialized agent for gamification and motivation',
        systemPrompt: `You are a gamification coach. Help users stay motivated through quests, badges, and progress tracking.`,
        temperature: 0.8,
        maxTokens: 800
      },
      [AgentType.PRODUCTIVITY_ANALYSIS]: {
        name: 'Productivity Analyst',
        description: 'Specialized agent for productivity analysis and insights',
        systemPrompt: `You are a productivity analyst. Provide insights and recommendations based on user data and patterns.`,
        temperature: 0.4,
        maxTokens: 1000
      },
      [AgentType.MENTOR]: {
        name: 'AI Mentor',
        description: 'Personal mentor and coach for productivity and focus',
        systemPrompt: `You are a personal mentor and coach. Provide guidance, motivation, and personalized advice for productivity and focus.`,
        temperature: 0.7,
        maxTokens: 1200
      },
      [AgentType.ORCHESTRATOR]: {
        name: 'Agent Orchestrator',
        description: 'Coordinates between different specialized agents',
        systemPrompt: `You are an agent orchestrator. Route user requests to the most appropriate specialized agent.`,
        temperature: 0.3,
        maxTokens: 500
      }
    };

    return {
      type: agentType,
      model,
      tools,
      ...configs[agentType]
    } as AgentConfig;
  }

  /**
   * Create the language model
   */
  private createModel(): BaseChatModel {
    // Use environment variables for configuration
    const modelName = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    return new ChatOpenAI({
      modelName,
      openAIApiKey: apiKey,
      temperature: 0.7,
      maxTokens: 1000
    });
  }

  /**
   * Create tools for an agent type
   */
  private async createTools(agentType: AgentType): Promise<any[]> {
    const baseTools = [
      new CreateTaskTool(this.prisma),
      new UpdateTaskTool(this.prisma),
      new DeleteTaskTool(this.prisma),
      new GetTasksTool(this.prisma),
      new ToggleTaskCompleteTool(this.prisma)
    ];

    const ragTools = [
      new VectorSearchTool(this.prisma, this.vectorStore),
      new IndexDocumentsTool(this.prisma, this.vectorStore),
      new GetSearchContextTool(this.prisma, this.vectorStore),
      new GetSearchStatsTool(this.prisma, this.vectorStore),
      new ClearUserDocumentsTool(this.prisma, this.vectorStore),
      new SemanticSimilarityTool(this.prisma, this.vectorStore),
      new KnowledgeRetrievalTool(this.prisma, this.vectorStore)
    ];

    // Add specialized tools based on agent type
    switch (agentType) {
      case AgentType.GENERAL:
        return baseTools;
      
      case AgentType.TASK_MANAGEMENT:
        return baseTools; // Task management agents get all task tools
      
      case AgentType.GOAL_TRACKING:
        return baseTools; // Goal tracking agents also need task tools
      
      case AgentType.FOCUS_TIMER:
        return baseTools; // Timer agents need task tools for session management
      
      case AgentType.GAMIFICATION:
        return baseTools; // Gamification agents need task tools for quest completion
      
      case AgentType.PRODUCTIVITY_ANALYSIS:
        return [...baseTools, ...ragTools]; // Analysis agents get RAG tools
      
      case AgentType.MENTOR:
        return [...baseTools, ...ragTools]; // Mentors get RAG tools for personalized guidance
      
      case AgentType.ORCHESTRATOR:
        return []; // Orchestrators don't need tools, they delegate
      
      default:
        return baseTools;
    }
  }

  /**
   * Get all available agent types
   */
  getAvailableAgentTypes(): AgentType[] {
    return Object.values(AgentType);
  }

  /**
   * Get agent status
   */
  getAgentStatus(): Record<string, any> {
    const status: Record<string, any> = {};
    
    for (const [type, agent] of this.agents) {
      status[type] = agent.getStatus();
    }
    
    return status;
  }

  /**
   * Clear agent cache
   */
  clearAgentCache(): void {
    this.agents.clear();
  }

  /**
   * Get context service for direct access
   */
  getContextService(): ContextService {
    return this.contextService;
  }

  /**
   * Update agent configuration
   */
  async updateAgentConfig(agentType: AgentType, newConfig: Partial<AgentConfig>): Promise<void> {
    const agent = this.agents.get(agentType);
    if (agent) {
      await agent.updateConfig(newConfig);
    }
  }
} 