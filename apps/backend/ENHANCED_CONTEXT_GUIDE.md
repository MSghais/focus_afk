# Enhanced Context System with Vector Search

This guide explains how to use the enhanced context system that combines vector search (Pinecone) with traditional database queries to provide personalized, context-aware AI responses.

## Overview

The enhanced context system provides:

1. **Vector Search**: Semantic search across user data using Pinecone embeddings
2. **Use Case Optimization**: Predefined contexts for different scenarios
3. **Hybrid Context**: Combines vector search with traditional database queries
4. **Flexible Configuration**: Customizable context sources and search parameters

## Architecture

```
User Query → EnhancedContextManager → Vector Search (Pinecone) + Traditional Context (Database)
                                    ↓
                              Enhanced Prompt → AI Model → Response
```

## Use Cases

### 1. General Chat (`general_chat`)
- **Purpose**: General conversation with basic context
- **Vector Search**: Enabled (3 results)
- **Context Sources**: tasks, goals, sessions, profile
- **History**: Last 10 messages
- **Best For**: Casual conversation, general advice

### 2. Task Planning (`task_planning`)
- **Purpose**: Focused on task management and planning
- **Vector Search**: Enabled (5 results)
- **Context Sources**: tasks, goals, sessions
- **History**: Last 5 messages
- **Best For**: Task organization, prioritization, planning

### 3. Goal Tracking (`goal_tracking`)
- **Purpose**: Focused on goal progress and achievement
- **Vector Search**: Enabled (4 results)
- **Context Sources**: goals, tasks, sessions, badges
- **History**: Last 5 messages
- **Best For**: Goal progress, motivation, achievement tracking

### 4. Focus Sessions (`focus_sessions`)
- **Purpose**: Optimizing productivity and focus sessions
- **Vector Search**: Enabled (3 results)
- **Context Sources**: sessions, tasks, goals
- **History**: Disabled
- **Best For**: Focus optimization, productivity advice

### 5. Note Analysis (`note_analysis`)
- **Purpose**: Analyzing and working with notes
- **Vector Search**: Enabled (6 results)
- **Context Sources**: notes, tasks, goals
- **History**: Last 8 messages
- **Best For**: Note insights, knowledge extraction

### 6. Mentor Specific (`mentor_specific`)
- **Purpose**: Conversation with a specific mentor
- **Vector Search**: Enabled (4 results)
- **Context Sources**: mentor, tasks, goals, sessions
- **History**: Last 10 messages
- **Best For**: Specialized guidance, mentor interactions

### 7. Quick Question (`quick_question`)
- **Purpose**: Quick questions without extensive context
- **Vector Search**: Disabled
- **Context Sources**: profile only
- **History**: Disabled
- **Best For**: Fast answers, simple queries

### 8. Deep Analysis (`deep_analysis`)
- **Purpose**: Deep analysis with extensive context
- **Vector Search**: Enabled (8 results)
- **Context Sources**: All sources
- **History**: Last 15 messages
- **Best For**: Comprehensive analysis, detailed insights

## API Endpoints

### Base URL: `/enhanced-chat`

#### 1. Get Available Use Cases
```http
GET /enhanced-chat/use-cases
Authorization: Bearer <token>
```

#### 2. General Chat
```http
POST /enhanced-chat/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "prompt": "How can I improve my productivity?",
  "mentorId": "optional-mentor-id",
  "sessionId": "optional-session-id",
  "model": "openai/gpt-4o-mini",
  "extraData": {
    "currentTask": "Working on project X",
    "energyLevel": "high"
  }
}
```

#### 3. Use Case Specific Chat
```http
POST /enhanced-chat/chat/use-case
Authorization: Bearer <token>
Content-Type: application/json

{
  "prompt": "Help me plan my tasks for tomorrow",
  "useCase": "task_planning",
  "mentorId": "optional-mentor-id",
  "sessionId": "optional-session-id",
  "model": "openai/gpt-4o-mini",
  "customSystemPrompt": "Optional custom system prompt",
  "extraData": {
    "deadline": "2024-01-15",
    "priority": "high"
  },
  "enableVectorSearch": true,
  "contextSources": ["tasks", "goals", "sessions"],
  "maxVectorResults": 5,
  "saveToChat": true
}
```

#### 4. Task Planning Assistance
```http
POST /enhanced-chat/assist/task-planning
Authorization: Bearer <token>
Content-Type: application/json

{
  "prompt": "I have 3 hours free, what should I work on?",
  "mentorId": "optional-mentor-id",
  "sessionId": "optional-session-id"
}
```

#### 5. Goal Tracking Assistance
```http
POST /enhanced-chat/assist/goal-tracking
Authorization: Bearer <token>
Content-Type: application/json

{
  "prompt": "How am I progressing on my fitness goals?",
  "mentorId": "optional-mentor-id",
  "sessionId": "optional-session-id"
}
```

#### 6. Focus Session Optimization
```http
POST /enhanced-chat/assist/focus-sessions
Authorization: Bearer <token>
Content-Type: application/json

{
  "prompt": "How can I improve my focus sessions?",
  "sessionData": {
    "duration": 25,
    "interruptions": 2,
    "energyLevel": "medium"
  }
}
```

#### 7. Note Analysis
```http
POST /enhanced-chat/assist/note-analysis
Authorization: Bearer <token>
Content-Type: application/json

{
  "prompt": "What are the key insights from my notes?",
  "noteContext": {
    "noteId": "note-123",
    "topics": ["productivity", "focus"]
  }
}
```

#### 8. Search User Content
```http
POST /enhanced-chat/search
Authorization: Bearer <token>
Content-Type: application/json

{
  "query": "productivity tips",
  "types": ["task", "note", "session"],
  "limit": 10
}
```

#### 9. Get Context Statistics
```http
GET /enhanced-chat/context/stats
Authorization: Bearer <token>
```

#### 10. Update User Embeddings
```http
POST /enhanced-chat/context/update-embeddings
Authorization: Bearer <token>
Content-Type: application/json

{
  "dataTypes": ["tasks", "goals", "sessions", "notes"]
}
```

#### 11. Quick Question
```http
POST /enhanced-chat/quick-question
Authorization: Bearer <token>
Content-Type: application/json

{
  "prompt": "What's the weather like?"
}
```

#### 12. Deep Analysis
```http
POST /enhanced-chat/deep-analysis
Authorization: Bearer <token>
Content-Type: application/json

{
  "prompt": "Analyze my productivity patterns over the last month",
  "mentorId": "optional-mentor-id",
  "sessionId": "optional-session-id"
}
```

## Response Format

All endpoints return responses in this format:

```json
{
  "text": "AI response text",
  "metadata": {
    "model": "openai/gpt-4o-mini",
    "useCase": "task_planning",
    "vectorSearchUsed": true,
    "contextSize": 2048,
    "responseTime": 1500
  },
  "context": {
    "vectorSearchUsed": true,
    "contextSources": ["tasks", "goals", "sessions"],
    "vectorResultsCount": 3,
    "totalContextSize": 2048
  }
}
```

## Environment Variables

Add these to your `.env` file:

```env
# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=user-contexts

# OpenAI Configuration (for embeddings)
OPENAI_API_KEY=your_openai_api_key

# OpenRouter Configuration (for AI responses)
OPENROUTER_API_KEY=your_openrouter_api_key
```

## Setup Instructions

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Set up Pinecone Index
- Create a Pinecone index named `user-contexts`
- Set dimensions to `1536` (for OpenAI embeddings)
- Use cosine similarity metric

### 3. Run Database Migration
```bash
pnpm run prisma:push
```

### 4. Update User Embeddings
After setup, update embeddings for existing users:
```bash
# This will be done automatically when users interact with the system
# Or manually via the API endpoint
```

## Usage Examples

### Example 1: Task Planning
```javascript
const response = await fetch('/enhanced-chat/assist/task-planning', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: "I have a busy week ahead. Help me prioritize my tasks.",
    mentorId: "mentor-123",
    sessionId: "session-456"
  })
});

const result = await response.json();
console.log(result.text); // AI response with task planning advice
```

### Example 2: Goal Progress Analysis
```javascript
const response = await fetch('/enhanced-chat/assist/goal-tracking', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: "How am I doing with my fitness goals this month?",
    mentorId: "fitness-mentor-123"
  })
});

const result = await response.json();
console.log(result.text); // AI response with goal analysis
```

### Example 3: Custom Use Case
```javascript
const response = await fetch('/enhanced-chat/chat/use-case', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: "What should I focus on today?",
    useCase: "deep_analysis",
    contextSources: ["tasks", "goals", "sessions", "notes"],
    maxVectorResults: 8,
    extraData: {
      currentEnergy: "high",
      availableTime: "4 hours"
    }
  })
});

const result = await response.json();
console.log(result.text); // Comprehensive analysis and recommendations
```

## Best Practices

### 1. Choose the Right Use Case
- Use `quick_question` for simple queries
- Use `task_planning` for task-related questions
- Use `deep_analysis` for comprehensive insights
- Use `focus_sessions` for productivity optimization

### 2. Optimize Context Sources
- Only include relevant context sources
- Use `maxVectorResults` to control response length
- Consider `enableVectorSearch` for semantic relevance

### 3. Monitor Performance
- Check `responseTime` in metadata
- Monitor `contextSize` for token usage
- Use `vectorResultsCount` to verify search effectiveness

### 4. Update Embeddings Regularly
- Call update embeddings when user data changes
- Monitor sync status in the database
- Consider batch updates for efficiency

## Troubleshooting

### Common Issues

1. **Vector Search Fails**
   - Check Pinecone API key and index name
   - Verify index dimensions match embedding model
   - Check network connectivity

2. **High Response Times**
   - Reduce `maxVectorResults`
   - Limit `contextSources`
   - Use `quick_question` for simple queries

3. **Large Context Size**
   - Reduce `maxVectorResults`
   - Limit conversation history
   - Use more specific context sources

4. **Poor Relevance**
   - Update user embeddings
   - Adjust `contextSources`
   - Check embedding quality

### Debug Information

Enable debug logging to see:
- Vector search queries and results
- Context generation process
- Performance metrics
- Error details

## Performance Considerations

### Vector Search
- Pinecone queries are fast but have rate limits
- Consider caching for frequently accessed data
- Batch embedding updates for efficiency

### Context Size
- Monitor token usage for cost control
- Use appropriate use cases for different scenarios
- Consider context compression for large datasets

### Response Time
- Vector search adds ~100-500ms
- Context generation adds ~50-200ms
- Total overhead: ~150-700ms

## Security Considerations

1. **User Isolation**: Each user has their own Pinecone namespace
2. **Data Privacy**: Embeddings are user-specific and isolated
3. **Access Control**: All endpoints require authentication
4. **Data Retention**: Follow GDPR compliance for data deletion

## Future Enhancements

1. **Context Compression**: Reduce context size while maintaining relevance
2. **Multi-modal Embeddings**: Support for images, audio, and documents
3. **Real-time Updates**: Automatic embedding updates on data changes
4. **Context Analytics**: Insights into context usage and effectiveness
5. **Custom Embedding Models**: Domain-specific embedding models 