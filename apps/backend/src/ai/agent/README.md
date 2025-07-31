# AI Agent System for Focus AFK

A comprehensive AI agent system built with Langchain for the Focus AFK productivity app. This system provides intelligent assistance for task management, goal tracking, focus sessions, and productivity optimization.

## 🏗️ Architecture

The AI agent system follows a modular architecture with the following components:

### Core Components

1. **Agent Factory** (`agent-factory.ts`)
   - Creates and manages different types of agents
   - Handles agent configuration and tool assignment
   - Provides centralized agent access

2. **Context Service** (`context-service.ts`)
   - Optimizes and manages context for AI agents
   - Implements intelligent caching and compression
   - Provides context-aware data loading

3. **General Agent** (`general-agent.ts`)
   - Simple, general-purpose AI assistant
   - Handles basic productivity queries
   - Suggests relevant actions based on context

4. **Tools** (`tools/`)
   - Structured tools for database operations
   - Task management tools (create, update, delete, get)
   - Extensible tool system for specialized agents

### Agent Types

- **General**: All-purpose productivity assistant
- **Task Management**: Specialized for task operations
- **Goal Tracking**: Focused on goal setting and progress
- **Focus Timer**: Optimizes focus sessions and time management
- **Gamification**: Handles quests, badges, and motivation
- **Productivity Analysis**: Provides insights and recommendations
- **Mentor**: Personal coaching and guidance
- **Orchestrator**: Coordinates between specialized agents

## 🚀 Quick Start

### Basic Usage

```typescript
import { AgentFactory, AgentType } from './ai/agent';
import { PrismaClient } from '@prisma/client';

// Initialize
const prisma = new PrismaClient();
const agentFactory = new AgentFactory(prisma);

// Get an agent
const generalAgent = await agentFactory.getAgent(AgentType.GENERAL);

// Use the agent
const response = await generalAgent.processMessage(
  'user-123',
  'Help me organize my tasks for today',
  'session-456'
);

console.log(response.content);
```

### Environment Setup

```bash
# Required environment variables
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-3.5-turbo  # Optional, defaults to gpt-3.5-turbo
```

## 📊 Context Management

The context service provides intelligent context optimization:

### Features

- **Smart Caching**: 5-minute TTL for context data
- **Compression**: Reduces context size for better performance
- **Priority Loading**: Loads data based on agent type
- **Retention Policy**: Automatic cleanup of old data

### Usage

```typescript
const contextService = agentFactory.getContextService();

// Build optimized context
const context = await contextService.buildContext(
  userId,
  AgentType.TASK_MANAGEMENT,
  sessionId,
  ['tasks', 'goals'] // Specific sources only
);

// Get context string for LLM
const contextString = await contextService.buildContextString(context);
```

## 🛠️ Tools System

The system includes structured tools for database operations:

### Available Tools

- `CreateTaskTool`: Create new tasks
- `UpdateTaskTool`: Update existing tasks
- `DeleteTaskTool`: Delete tasks
- `GetTasksTool`: Retrieve tasks with filtering
- `ToggleTaskCompleteTool`: Mark tasks as complete/incomplete

### Adding New Tools

```typescript
import { StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

export class CustomTool extends StructuredTool {
  name = 'custom_tool';
  description = 'Description of what this tool does';
  schema = z.object({
    // Define your schema
  });

  async _call(input: z.infer<typeof this.schema>): Promise<string> {
    // Implement tool logic
    return JSON.stringify({ success: true, data: result });
  }
}
```

## 🎯 Agent Configuration

Each agent type has specific configuration:

```typescript
const config = {
  type: AgentType.GENERAL,
  name: 'General Assistant',
  description: 'A general-purpose AI assistant',
  systemPrompt: 'You are a helpful AI assistant...',
  temperature: 0.7,
  maxTokens: 1000,
  tools: [/* tool instances */],
  model: /* Langchain model instance */
};
```

## 📈 Performance Optimization

### Context Optimization

- **Size Limits**: 1MB max context size
- **Compression**: Automatic data compression
- **Caching**: 5-minute cache TTL
- **Priority Sources**: Load only relevant data

### Agent Optimization

- **Lazy Loading**: Agents created on-demand
- **Caching**: Agent instances cached
- **Tool Filtering**: Only relevant tools per agent

## 🔧 Advanced Usage

### Custom Agent Types

```typescript
// Create custom agent configuration
const customConfig = {
  type: AgentType.GENERAL,
  name: 'Custom Agent',
  systemPrompt: 'Custom system prompt...',
  temperature: 0.5,
  tools: [new CustomTool()]
};

// Update existing agent
await agentFactory.updateAgentConfig(AgentType.GENERAL, customConfig);
```

### Context Customization

```typescript
// Custom context optimization
const optimization = {
  maxContextSize: 2 * 1024 * 1024, // 2MB
  compressionEnabled: true,
  prioritySources: ['tasks', 'goals'],
  retentionPolicy: {
    tasks: 60, // 60 days
    goals: 180, // 180 days
    sessions: 14, // 14 days
    conversations: 7 // 7 days
  }
};

const contextService = new ContextService(prisma, optimization);
```

### Error Handling

```typescript
try {
  const response = await agent.processMessage(userId, message, sessionId);
  // Handle success
} catch (error) {
  if (error.type === AgentErrorType.CONTEXT_OVERFLOW) {
    // Handle context overflow
  } else if (error.type === AgentErrorType.TOOL_FAILURE) {
    // Handle tool failure
  }
}
```

## 🧹 Maintenance

### Cleanup Operations

```typescript
// Clear agent cache
agentFactory.clearAgentCache();

// Clear context cache
contextService.clearCache();

// Cleanup old data
await contextService.cleanupOldContext();
```

### Monitoring

```typescript
// Get agent status
const status = agentFactory.getAgentStatus();

// Get cache statistics
const cacheStats = contextService.getCacheStats();

// Get available agent types
const types = agentFactory.getAvailableAgentTypes();
```

## 📝 Examples

See `example-usage.ts` for comprehensive examples of:

- Basic agent usage
- Context management
- Configuration updates
- Error handling
- Cleanup operations

## 🔮 Future Enhancements

### Planned Features

1. **Specialized Agents**: Task management, goal tracking, focus timer agents
2. **Orchestrator Agent**: Intelligent routing between specialized agents
3. **Advanced Tools**: Goal management, timer control, gamification tools
4. **Memory Management**: Long-term conversation memory
5. **Performance Monitoring**: Detailed metrics and analytics

### Extensibility

The system is designed to be easily extensible:

- Add new agent types in `AgentType` enum
- Implement new agents following the `GeneralAgent` pattern
- Create new tools extending `StructuredTool`
- Customize context optimization per agent type

## 🤝 Contributing

When adding new features:

1. Follow the existing patterns in `GeneralAgent`
2. Add proper TypeScript types in `types.ts`
3. Include error handling and logging
4. Add examples in `example-usage.ts`
5. Update this documentation

## 📄 License

This AI agent system is part of the Focus AFK project and follows the same licensing terms. 