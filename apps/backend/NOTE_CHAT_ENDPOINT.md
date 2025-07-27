# Note Chat Endpoint Documentation

## Overview
The note chat endpoint allows users to have AI-powered conversations about their notes and associated sources. This feature enables users to ask questions, get clarifications, and explore insights from their notes and their linked sources.

## Endpoints

### 1. Chat About a Note
**POST** `/notes/chat`

Start a conversation about a specific note and its sources.

#### Request Body
```json
{
  "noteId": "string",     // Required: ID of the note to chat about
  "prompt": "string",     // Required: User's question or message
  "mentorId": "string"    // Optional: Specific mentor ID to use for the conversation
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "response": "AI response text",
    "chatId": "chat_id",
    "messageId": "message_id",
    "note": {
      "id": "note_id",
      "title": "Note title",
      "type": "user|ai",
      "sourcesCount": 3
    },
    "memory": {
      "sessionId": "session_id",
      "contextVersion": 1,
      "memorySize": 1024
    },
    "usage": {
      "total_tokens": 1500,
      "prompt_tokens": 800,
      "completion_tokens": 700
    }
  }
}
```

### 2. Get Chat Messages for a Note
**GET** `/notes/:id/chat`

Retrieve the conversation history for a specific note.

#### Query Parameters
- `limit` (optional): Number of messages to return (default: 50)
- `offset` (optional): Number of messages to skip (default: 0)

#### Response
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "message_id",
        "role": "user|assistant",
        "content": "Message content",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "chat": {
      "id": "chat_id",
      "title": "Chat title",
      "mentor": {
        "id": "mentor_id",
        "name": "Mentor name",
        "role": "Mentor role"
      }
    },
    "note": {
      "id": "note_id",
      "title": "Note title"
    }
  }
}
```

## Features

### Context-Aware Conversations
The AI has access to:
- Note content (text, description, summary)
- Note metadata (topics, difficulty, type)
- Associated sources (links, files, websites, etc.)
- Source content and metadata
- Conversation history for the note

### Source Integration
When a note has associated sources, the AI can:
- Reference specific sources in responses
- Provide insights based on source content
- Suggest related information from sources
- Help users understand connections between notes and sources

### Memory and Continuity
- Conversations maintain context across multiple messages
- AI remembers previous questions and responses
- Session-based memory for ongoing conversations
- Integration with user's broader context (tasks, goals, etc.)

## Usage Examples

### Example 1: Ask about note content
```json
POST /notes/chat
{
  "noteId": "note_123",
  "prompt": "Can you explain the main concepts in this note?"
}
```

### Example 2: Ask about specific sources
```json
POST /notes/chat
{
  "noteId": "note_123",
  "prompt": "What does the research paper linked in the sources say about this topic?"
}
```

### Example 3: Get clarification
```json
POST /notes/chat
{
  "noteId": "note_123",
  "prompt": "I'm confused about the third point. Can you break it down further?"
}
```

### Example 4: Use with specific mentor
```json
POST /notes/chat
{
  "noteId": "note_123",
  "prompt": "Help me understand this from a technical perspective",
  "mentorId": "tech_mentor_456"
}
```

## Error Responses

### Note Not Found
```json
{
  "message": "Note not found"
}
```

### Invalid Request
```json
{
  "message": "Validation error details"
}
```

### AI Service Error
```json
{
  "message": "Failed to generate response"
}
```

## Implementation Details

### AI Context Building
The system builds a comprehensive context string including:
1. Note metadata (title, type, difficulty, creation date)
2. Note content (text, description, summary)
3. Topics and tags
4. Source information (title, type, content preview, URLs)
5. Previous conversation history

### Chat Management
- Each note can have its own dedicated chat conversation
- Chats are automatically created when first used
- Conversations are persisted and can be resumed later
- Integration with the existing chat system for consistency

### Security
- Users can only chat about their own notes
- Authentication required for all endpoints
- Note ownership verification on every request 