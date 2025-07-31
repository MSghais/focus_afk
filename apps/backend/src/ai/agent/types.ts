import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { StructuredTool } from '@langchain/core/tools';
import { RunnableSequence } from '@langchain/core/runnables';
import { PrismaClient } from '@prisma/client';

// Agent Types
export enum AgentType {
  ORCHESTRATOR = 'orchestrator',
  GENERAL = 'general',
  TASK_MANAGEMENT = 'task_management',
  GOAL_TRACKING = 'goal_tracking',
  FOCUS_TIMER = 'focus_timer',
  GAMIFICATION = 'gamification',
  PRODUCTIVITY_ANALYSIS = 'productivity_analysis',
  MENTOR = 'mentor'
}

// Context Types
export interface UserContext {
  userId: string;
  userAddress?: string;
  profile?: any;
  preferences?: any;
  currentSession?: any;
}

export interface AppContext {
  tasks: any[];
  goals: any[];
  timerSessions: any[];
  quests: any[];
  badges: any[];
  settings: any;
  gamification: {
    level: number;
    xp: number;
    focusPoints: number;
    energy: number;
    maxEnergy: number;
    focusStreak: number;
  };
}

export interface AgentContext {
  user: UserContext;
  app: AppContext;
  conversation: BaseMessage[];
  sessionId: string;
  agentType: AgentType;
  metadata: Record<string, any>;
}

// Agent Configuration
export interface AgentConfig {
  type: AgentType;
  name: string;
  description: string;
  systemPrompt: string;
  tools: StructuredTool[];
  model: BaseChatModel;
  maxTokens?: number;
  temperature?: number;
  contextWindow?: number;
}

// Agent Response Types
export interface AgentResponse {
  content: string;
  agentType: AgentType;
  confidence: number;
  suggestedActions: SuggestedAction[];
  contextUpdates: Partial<AppContext>;
  metadata: Record<string, any>;
}

export interface SuggestedAction {
  type: 'task' | 'goal' | 'timer' | 'quest' | 'setting' | 'analysis';
  action: string;
  parameters: Record<string, any>;
  priority: 'low' | 'medium' | 'high';
  description: string;
}

// Tool Types
export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

// Orchestrator Types
export interface OrchestrationRequest {
  userId: string;
  userMessage: string;
  sessionId: string;
  context?: Partial<AgentContext>;
  preferredAgent?: AgentType;
  enableMultiAgent?: boolean;
}

export interface OrchestrationResponse {
  primaryResponse: AgentResponse;
  secondaryResponses?: AgentResponse[];
  agentChain: AgentType[];
  reasoning: string;
  contextUpdates: Partial<AppContext>;
}

// Memory and Context Management
export interface ContextOptimization {
  maxContextSize: number;
  compressionEnabled: boolean;
  prioritySources: string[];
  retentionPolicy: {
    tasks: number; // days
    goals: number;
    sessions: number;
    conversations: number;
  };
}

// Agent Registry
export interface AgentRegistry {
  [key: string]: {
    config: AgentConfig;
    instance: any;
    isActive: boolean;
    lastUsed: Date;
  };
}

// Performance Metrics
export interface AgentMetrics {
  responseTime: number;
  tokenUsage: number;
  toolCalls: number;
  contextSize: number;
  userSatisfaction?: number;
  successRate: number;
}

// Error Types
export enum AgentErrorType {
  CONTEXT_OVERFLOW = 'context_overflow',
  TOOL_FAILURE = 'tool_failure',
  MODEL_ERROR = 'model_error',
  INSUFFICIENT_CONTEXT = 'insufficient_context',
  AGENT_NOT_FOUND = 'agent_not_found',
  ORCHESTRATION_FAILURE = 'orchestration_failure'
}

export interface AgentError {
  type: AgentErrorType;
  message: string;
  agentType?: AgentType;
  context?: any;
  recoverable: boolean;
} 