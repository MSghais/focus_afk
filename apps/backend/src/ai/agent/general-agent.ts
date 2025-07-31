import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { StructuredTool } from '@langchain/core/tools';
import { AgentType, AgentConfig, AgentResponse, AgentContext, SuggestedAction } from './types';
import { ContextService } from './context-service';
import { PrismaClient } from '@prisma/client';

export class GeneralAgent {
  private config: AgentConfig;
  private contextService: ContextService;
  private model: BaseChatModel;

  constructor(
    config: AgentConfig,
    contextService: ContextService,
    prisma: PrismaClient
  ) {
    this.config = config;
    this.contextService = contextService;
    this.model = config.model;
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

      // Create simple prompt with context
      const prompt = this.buildPrompt(userMessage, fullContext);

      // Get response from model
      const result = await this.model.invoke([
        new SystemMessage(prompt),
        new HumanMessage(userMessage)
      ]);

      // Parse the response
      const response = this.parseAgentResponse(result, startTime);

      return response;
    } catch (error) {
      console.error('Error in general agent:', error);
      return this.createErrorResponse(error, startTime);
    }
  }

  private buildPrompt(userMessage: string, context: AgentContext): string {
    const { user, app } = context;
    
    return `You are a helpful AI assistant for the Focus AFK productivity app. Your role is to help users manage their tasks, goals, focus sessions, and overall productivity.

Key Responsibilities:
- Help users create, update, and manage tasks
- Assist with goal setting and progress tracking
- Provide guidance on focus sessions and time management
- Offer productivity insights and recommendations
- Support gamification features (quests, badges, XP)

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
- Provide actionable advice
- Suggest relevant actions based on their context
- Keep responses concise but helpful
- If the user wants to perform actions (create tasks, update goals, etc.), let them know they can use the app's interface for those features

Available Tools: ${this.config.tools.map(tool => tool.name).join(', ')}

Respond to the user's message in a helpful and encouraging way.`;
  }

  private parseAgentResponse(result: any, startTime: number): AgentResponse {
    const responseTime = Date.now() - startTime;
    
    return {
      content: result.content || result.text || 'I understand. How can I help you further?',
      agentType: this.config.type,
      confidence: 0.8, // Default confidence for general agent
      suggestedActions: this.extractSuggestedActions(result),
      contextUpdates: {},
      metadata: {
        responseTime,
        toolCalls: 0, // Simple agent doesn't use tools directly
        model: this.config.model.constructor.name
      }
    };
  }

  private extractSuggestedActions(result: any): SuggestedAction[] {
    const actions: SuggestedAction[] = [];

    // For a simple agent, we'll suggest common actions based on the response
    const content = result.content || result.text || '';
    
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
        errorType: 'agent_error'
      }
    };
  }

  // Method to update agent configuration
  async updateConfig(newConfig: Partial<AgentConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.model = this.config.model;
  }

  // Method to get agent status
  getStatus() {
    return {
      type: this.config.type,
      name: this.config.name,
      isActive: true,
      tools: this.config.tools.map(t => t.name),
      model: this.config.model.constructor.name
    };
  }

  // Method to get available tools
  getTools() {
    return this.config.tools;
  }
} 