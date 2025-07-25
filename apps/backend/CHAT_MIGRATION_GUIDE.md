# Chat System Migration Guide

## Overview
This guide covers the migration from the old message system to the new chat-based system that supports conversation containers with multiple messages.

## Changes Made

### 1. Database Schema Updates (`prisma/schema.prisma`)

#### New Chat Model
```prisma
model Chat {
  id          String   @id @default(cuid())
  userId      String
  mentorId    String?  // Optional - can be linked to a mentor or not
  title       String?  // Optional title for the conversation
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  metadata    Json?    // Additional metadata for the chat

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  mentor Mentor? @relation(fields: [mentorId], references: [id], onDelete: SetNull)
  messages Message[]  // One chat can have multiple messages

  @@map("chats")
}
```

#### Updated Message Model
```prisma
model Message {
  id        String   @id @default(cuid())
  chatId    String?  // Optional - messages can exist without a chat
  role      String   // user, assistant, system
  content   String   // The message content
  prompt    String?
  model     String?  // AI model used for response
  tokens    Int?     // Token count for cost tracking
  metadata  Json?    // Additional metadata
  createdAt DateTime @default(now())
  taskId    String?

  // Relations
  chat Chat? @relation(fields: [chatId], references: [id], onDelete: SetNull)

  @@map("messages")
}
```

### 2. New Services

#### ChatService (`src/services/chat/chat.service.ts`)
- `createChat()` - Create new chat conversations
- `getUserChats()` - Get user's chats with filtering options
- `getChat()` - Get specific chat with all messages
- `updateChat()` - Update chat properties
- `deleteChat()` - Soft delete chats
- `createMessage()` - Add message to a chat
- `createStandaloneMessage()` - Create message without chat
- `saveConversation()` - Save user + assistant message pair
- `getOrCreateMentorChat()` - Get or create chat for mentor
- `getChatStats()` - Get chat statistics

### 3. New Routes

#### Chat Routes (`src/routes/chat/index.ts`)
- `POST /chat/chats` - Create new chat
- `GET /chat/chats` - Get user's chats
- `GET /chat/chats/:id` - Get specific chat with messages
- `PUT /chat/chats/:id` - Update chat
- `DELETE /chat/chats/:id` - Delete chat
- `GET /chat/chats/:id/messages` - Get messages for chat
- `POST /chat/chats/:id/messages` - Add message to chat
- `GET /chat/chats/stats` - Get chat statistics

### 4. Updated Mentor Routes

#### Enhanced Chat Endpoint (`src/routes/mentor/index.ts`)
- Now creates/uses chat containers for conversations
- Automatically creates mentor-specific chats
- Supports standalone chats for general conversations
- Returns chat ID along with message ID

#### Legacy Message Endpoint
- Updated to return only standalone messages
- Maintains backward compatibility

### 5. Migration Scripts

#### Schema Migration (`migrate-chat-schema.sh`)
```bash
#!/bin/bash
npx prisma format
npx prisma generate
npx prisma migrate dev --name add_chat_model
```

#### Data Migration (`src/scripts/migrate-messages-to-chats.ts`)
- Migrates existing messages to new chat structure
- Groups messages by user and mentor
- Creates appropriate chat containers
- Updates message references

## Migration Steps

### Step 1: Update Database Schema
```bash
cd apps/backend
chmod +x migrate-chat-schema.sh
./migrate-chat-schema.sh
```

### Step 2: Migrate Existing Data (Optional)
```bash
cd apps/backend
npx ts-node src/scripts/migrate-messages-to-chats.ts
```

### Step 3: Test New Endpoints
```bash
# Test chat creation
curl -X POST http://localhost:3000/chat/chats \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mentorId": "mentor_id", "title": "My Chat"}'

# Test getting chats
curl -X GET http://localhost:3000/chat/chats \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test mentor chat
curl -X POST http://localhost:3000/mentor/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello", "mentorId": "mentor_id"}'
```

## Key Features

### 1. Flexible Chat Structure
- **Mentor Chats**: Linked to specific mentors
- **Standalone Chats**: General conversations without mentors
- **Standalone Messages**: Messages not linked to any chat

### 2. Conversation Management
- Multiple messages per chat
- Chat titles and metadata
- Active/inactive chat status
- Automatic chat creation for mentors

### 3. Backward Compatibility
- Legacy message endpoints still work
- Existing messages can be migrated
- Gradual transition support

### 4. Enhanced AI Integration
- Chat-based memory management
- Context-aware conversations
- Mentor-specific chat sessions

## API Changes

### New Chat Endpoints
- All chat operations under `/chat` prefix
- Full CRUD operations for chats
- Message management within chats

### Updated Mentor Endpoints
- `/mentor/chat` now returns `chatId` in response
- `/mentor/messages` returns only standalone messages
- `/mentor/chats` returns user's chats

### Response Format Changes
```json
{
  "success": true,
  "data": {
    "response": "AI response text",
    "chatId": "chat_id_here",
    "messageId": "message_id_here",
    "memory": { ... },
    "usage": { ... }
  }
}
```

## Frontend Integration

### New Chat Components Needed
- Chat list component
- Chat detail view
- Message input within chats
- Chat creation/management UI

### Updated Mentor Components
- Use chat ID for conversation context
- Display chat history
- Support multiple chat sessions

## Benefits

1. **Better Organization**: Messages grouped into logical conversations
2. **Improved UX**: Users can have multiple chat sessions
3. **Enhanced AI**: Better context management per conversation
4. **Scalability**: Easier to manage large numbers of messages
5. **Flexibility**: Support for both mentor and general chats

## Troubleshooting

### Common Issues
1. **Prisma Client Errors**: Run `npx prisma generate` after schema changes
2. **Migration Failures**: Check database connection and permissions
3. **Data Loss**: Always backup before running migrations

### Rollback Plan
1. Keep old message structure as backup
2. Migration script can be reversed
3. Gradual rollout with feature flags

## Next Steps

1. ✅ Complete database migration
2. 🔄 Test new endpoints
3. 🔄 Update frontend components
4. 🔄 Migrate existing data
5. 🔄 Deploy to production
6. 🔄 Monitor and optimize 