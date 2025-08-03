# ElevenLabs Conversation Setup Guide

This guide explains how to set up and use the ElevenLabs conversation functionality in the Focus AFK application.

## Overview

The ElevenLabs conversation feature enables real-time voice conversations with an AI assistant. It uses:
- **ElevenLabs ConvAI API** for voice conversation capabilities
- **WebSocket connections** for real-time communication
- **Backend API** for secure signed URL generation
- **Database tracking** for conversation sessions

## Prerequisites

1. **ElevenLabs Account**: Sign up at [elevenlabs.io](https://elevenlabs.io)
2. **ElevenLabs API Key**: Get your API key from the ElevenLabs dashboard
3. **ElevenLabs Agent**: Create a conversation agent in the ElevenLabs platform

## Environment Variables

### Frontend (.env.local)
```bash
# ElevenLabs Configuration
NEXT_PUBLIC_ELEVENLABS_AGENT_ID="your_elevenlabs_agent_id"
```

### Backend (.env)
```bash
# ElevenLabs Configuration
ELEVENLABS_API_KEY="your_elevenlabs_api_key"
ELEVENLABS_AGENT_ID="your_elevenlabs_agent_id"
```

## Setup Steps

### 1. Create ElevenLabs Agent

1. Go to [ElevenLabs ConvAI](https://elevenlabs.io/convai)
2. Create a new conversation agent
3. Configure the agent's personality and knowledge
4. Note down the Agent ID

### 2. Configure Environment Variables

1. Add the environment variables to your `.env.local` (frontend) and `.env` (backend) files
2. Replace the placeholder values with your actual ElevenLabs credentials

### 3. Database Migration

Run the database migration to create the conversation sessions table:

```bash
cd apps/backend
npx prisma migrate dev --name add_conversation_sessions
```

### 4. Start the Application

1. Start the backend server:
```bash
cd apps/backend
npm run dev
```

2. Start the frontend application:
```bash
cd apps/web
npm run dev
```

## Usage

### Accessing the Conversation Feature

1. Navigate to `/conversation` in your browser
2. Ensure you're authenticated (the feature requires login)
3. Click "Start Conversation" to begin
4. Grant microphone permissions when prompted
5. Speak naturally with the AI assistant
6. Click "Stop Conversation" when finished

### Features

- **Real-time Voice Conversation**: Speak and receive responses in real-time
- **Session Tracking**: All conversations are tracked in the database
- **WebSocket Integration**: Real-time communication with the backend
- **Authentication**: Secure access with JWT authentication
- **Error Handling**: Comprehensive error handling and user feedback

## Architecture

### Frontend Components

- `ConversationAiAgent.tsx`: Main conversation component
- `WebSocketProvider.tsx`: WebSocket connection management
- `conversation/page.tsx`: Conversation page

### Backend Routes

- `GET /conversation/signed-url`: Get signed URL for ElevenLabs
- `POST /conversation/start-session`: Start a conversation session
- `POST /conversation/end-session`: End a conversation session

### WebSocket Events

- `conversation_start`: Start a conversation session
- `conversation_end`: End a conversation session
- `conversation_message`: Send/receive conversation messages
- `conversation_started`: Session started confirmation
- `conversation_ended`: Session ended confirmation
- `conversation_error`: Error handling

### Database Schema

```sql
model ConversationSession {
  id        String   @id @default(cuid())
  userId    String
  sessionId String   @unique
  status    String   @default("active")
  metadata  Json?
  startedAt DateTime @default(now())
  endedAt   DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("conversation_sessions")
}
```

## Troubleshooting

### Common Issues

1. **Microphone Permission Denied**
   - Ensure your browser has permission to access the microphone
   - Check browser settings for microphone permissions

2. **WebSocket Connection Failed**
   - Verify the backend server is running
   - Check the `NEXT_PUBLIC_BACKEND_WS_URL` environment variable
   - Ensure you're authenticated

3. **ElevenLabs API Errors**
   - Verify your API key is correct
   - Check your ElevenLabs account status
   - Ensure the agent ID is valid

4. **Database Errors**
   - Run the migration: `npx prisma migrate dev`
   - Check database connection
   - Verify environment variables

### Debug Mode

Enable debug logging by checking the browser console and backend logs for detailed error information.

## Security Considerations

- All API calls require authentication
- WebSocket connections are authenticated with JWT tokens
- Conversation sessions are tied to user accounts
- API keys are stored securely on the backend

## Performance Optimization

- WebSocket connections are reused for multiple conversations
- Session data is cached for better performance
- Error handling prevents connection issues from affecting the UI

## Future Enhancements

- Conversation history and playback
- Multiple agent support
- Advanced conversation analytics
- Integration with other AI services
- Mobile app support

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the browser console for errors
3. Check backend logs for server-side issues
4. Verify all environment variables are set correctly 