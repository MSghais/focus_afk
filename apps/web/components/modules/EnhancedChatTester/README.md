# Enhanced Chat Tester Component

A comprehensive UI component for testing the enhanced chat endpoints with different use cases and configurations.

## Features

- **Multiple Use Cases**: Test different chat scenarios (general chat, task planning, goal tracking, etc.)
- **Context Source Selection**: Choose which data sources to include in the context
- **Vector Search Configuration**: Enable/disable vector search and configure result limits
- **Custom System Prompts**: Override default system prompts for specific use cases
- **Mentor Selection**: Choose a specific mentor for the conversation
- **Response Metadata**: View detailed information about each response including:
  - Model used
  - Use case applied
  - Response time
  - Vector search usage
  - Context sources used
  - Context size

## Usage

### Access the Tester

Navigate to `/enhanced-chat-tester` in your application to access the component.

### Configuration Options

1. **Use Case Selection**
   - Choose from 8 predefined use cases
   - Each use case has different context sources and vector search settings
   - Use cases include: General Chat, Task Planning, Goal Tracking, Focus Sessions, Note Analysis, Mentor Specific, Quick Question, Deep Analysis

2. **Context Sources**
   - Select which data sources to include in the AI context
   - Options: Tasks, Goals, Sessions, Notes, Badges, Quests, Profile, Mentor, Settings
   - Multiple sources can be selected simultaneously

3. **Vector Search Settings**
   - Enable/disable vector search functionality
   - Configure maximum number of vector results (1-20)
   - Vector search provides semantic similarity matching across user data

4. **Custom System Prompt**
   - Override the default system prompt for the selected use case
   - Useful for testing specific scenarios or instructions

5. **Mentor Selection**
   - Choose a specific mentor for the conversation
   - Mentors provide specialized knowledge and personality

### Testing Workflow

1. **Configure Settings**: Set up your desired use case, context sources, and other options
2. **Enter Prompt**: Type your question or request in the text area
3. **Send Message**: Click "Send Message" or press Ctrl+Enter
4. **Review Response**: View the AI response with detailed metadata
5. **Iterate**: Adjust settings and try different prompts to test various scenarios

### Response Information

Each response includes:

- **AI Response**: The main response text with markdown rendering
- **Model**: Which AI model was used
- **Use Case**: Which use case was applied
- **Response Time**: How long the request took
- **Vector Search**: Whether vector search was used
- **Vector Results**: Number of vector search results found
- **Context Size**: Total size of the context provided to the AI
- **Context Sources**: Which data sources were included

## API Endpoints Used

The component uses the following enhanced chat endpoints:

- `POST /enhanced-chat/chat/use-case` - Main endpoint for use case specific chat
- `GET /enhanced-chat/use-cases` - Get available use cases
- `POST /enhanced-chat/chat` - General chat endpoint
- `POST /enhanced-chat/deep-analysis` - Deep analysis endpoint
- `POST /enhanced-chat/assist/task-planning` - Task planning assistance
- `POST /enhanced-chat/search` - Search user content

## Example Use Cases

### Task Planning
- **Use Case**: Task Planning
- **Context Sources**: Tasks, Goals, Sessions
- **Prompt**: "I have 3 hours free, what should I work on?"
- **Expected**: AI will analyze your tasks and goals to suggest priorities

### Goal Tracking
- **Use Case**: Goal Tracking
- **Context Sources**: Goals, Tasks, Sessions, Badges
- **Prompt**: "How am I progressing on my fitness goals?"
- **Expected**: AI will analyze your goal progress and provide insights

### Deep Analysis
- **Use Case**: Deep Analysis
- **Context Sources**: All sources
- **Prompt**: "Analyze my productivity patterns over the last month"
- **Expected**: Comprehensive analysis using all available data

## Troubleshooting

### Authentication Issues
- Ensure you're logged in with a valid JWT token
- Check that the backend is running and accessible
- Verify the `NEXT_PUBLIC_BACKEND_URL` environment variable is set correctly

### No Responses
- Check that you have data in the selected context sources
- Verify that the backend enhanced chat service is properly configured
- Check browser console for any error messages

### Vector Search Issues
- Ensure Pinecone is properly configured in the backend
- Check that user data has been embedded and indexed
- Verify vector search is enabled for the selected use case

## Development

### Component Structure

```
EnhancedChatTester/
├── index.tsx              # Main component
├── EnhancedChatTester.module.scss  # Styles
└── README.md              # This documentation
```

### Key Dependencies

- `useApi` hook for API communication
- `useAuthStore` for authentication state
- `useMentorsStore` for mentor data
- `useUIStore` for toast notifications
- `tryMarkdownToHtml` for markdown rendering

### Styling

The component uses CSS Modules with SCSS and follows the application's design system:
- CSS variables for theming
- Responsive design with mobile breakpoints
- Consistent spacing and typography
- Accessible form controls and interactions 