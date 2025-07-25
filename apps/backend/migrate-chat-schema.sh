#!/bin/bash

echo "🔄 Updating database schema for chat system..."

# Format the Prisma schema
echo "📝 Formatting Prisma schema..."
npx prisma format

# Generate Prisma client with new schema
echo "🔧 Generating Prisma client..."
npx prisma generate

# Create and apply migration
echo "🚀 Creating migration..."
npx prisma migrate dev --name add_chat_model

echo "✅ Chat schema migration completed!"
echo ""
echo "📋 Summary of changes:"
echo "- Added Chat model for conversation containers"
echo "- Updated Message model to optionally link to chats"
echo "- Messages can now be standalone or part of a chat"
echo "- Chats can be linked to mentors or be standalone"
echo "- Added ChatService for managing chats and messages"
echo "- Updated mentor routes to use new chat structure"
echo "- Added new chat routes for chat management"
echo ""
echo "🎯 Next steps:"
echo "1. Test the new chat endpoints"
echo "2. Update frontend to use new chat structure"
echo "3. Migrate existing messages to chats if needed" 