import { PrismaClient } from '@prisma/client';

export class ChatService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Create a new chat
  async createChat(userId: string, chatData: {
    mentorId?: string;
    title?: string;
    metadata?: any;
  }) {
    return this.prisma.chat.create({
      data: {
        userId,
        ...chatData,
      },
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  // Get user's chats
  async getUserChats(userId: string, options: {
    mentorId?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  } = {}) {
    const { mentorId, isActive = true, limit = 50, offset = 0 } = options;

    const whereClause: any = { userId, isActive };
    if (mentorId) {
      whereClause.mentorId = mentorId;
    }

    return this.prisma.chat.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Get only the latest message for preview
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });
  }

  // Get a specific chat with all messages
  async getChat(chatId: string, userId: string) {
    return this.prisma.chat.findFirst({
      where: { id: chatId, userId },
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  // Update chat
  async updateChat(chatId: string, userId: string, updateData: {
    title?: string;
    isActive?: boolean;
    metadata?: any;
  }) {
    const result = await this.prisma.chat.updateMany({
      where: { id: chatId, userId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    if (result.count === 0) {
      throw new Error('Chat not found');
    }

    return this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });
  }

  // Delete chat (soft delete)
  async deleteChat(chatId: string, userId: string) {
    const result = await this.prisma.chat.updateMany({
      where: { id: chatId, userId },
      data: { isActive: false },
    });

    if (result.count === 0) {
      throw new Error('Chat not found');
    }

    return { message: 'Chat deleted successfully' };
  }

  // Create a message in a chat
  async createMessage(chatId: string, userId: string, messageData: {
    role: string;
    content: string;
    prompt?: string;
    model?: string;
    tokens?: number;
    metadata?: any;
    taskId?: string;
  }) {
    return this.prisma.message.create({
      data: {
        chat: {
          connect: { id: chatId }
        },
        user: {
          connect: { id: userId }
        },
        ...messageData,
      },
    });
  }

  // Create a standalone message (not linked to any chat)
  async createStandaloneMessage(userId: string, messageData: {
    role: string;
    content: string;
    prompt?: string;
    model?: string;
    tokens?: number;
    metadata?: any;
    taskId?: string;
  }) {
    return this.prisma.message.create({
      data: {
        user: {
          connect: { id: userId }
        },
        ...messageData,
      },
    });
  }

  // Get messages for a chat
  async getChatMessages(chatId: string, userId: string, options: {
    limit?: number;
    offset?: number;
  } = {}) {
    const { limit = 50, offset = 0 } = options;

    console.log(`ChatService: Getting messages for chat ${chatId}, user ${userId}`);

    // Verify the chat belongs to the user
    const chat = await this.prisma.chat.findFirst({
      where: { id: chatId, userId },
    });

    if (!chat) {
      console.log(`ChatService: Chat ${chatId} not found for user ${userId}`);
      throw new Error('Chat not found');
    }

    console.log(`ChatService: Found chat ${chatId}, getting messages`);

    const messages = await this.prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: offset,
    });

    console.log(`ChatService: Found ${messages.length} messages for chat ${chatId}`);
    if (messages.length > 0) {
      console.log(`ChatService: First message: ${messages[0].id} - ${messages[0].role} - ${messages[0].content.substring(0, 50)}...`);
      console.log(`ChatService: Last message: ${messages[messages.length - 1].id} - ${messages[messages.length - 1].role} - ${messages[messages.length - 1].content.substring(0, 50)}...`);
    }

    return messages;
  }

  // Save a conversation (user message + assistant response) to a chat
  async saveConversation(
    chatId: string,
    userId: string,
    userMessage: string,
    assistantResponse: string,
    options: {
      model?: string;
      tokens?: number;
      metadata?: any;
      taskId?: string;
      mentorId?: string;
    } = {}
  ) {
    const { model, tokens, metadata, taskId, mentorId } = options;

    // Get the chat to find the mentorId if not provided
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      select: { mentorId: true }
    });

    const messageMentorId = mentorId || chat?.mentorId;

    console.log(`ChatService: Saving user message to chat ${chatId} with mentorId: ${messageMentorId}`);
    // Save user message
    const userMsg = await this.prisma.message.create({
      data: {
        chatId,
        userId,
        ...(messageMentorId && { mentorId: messageMentorId }),
        role: 'user',
        content: userMessage,
        model,
        metadata,
        taskId,
      },
    });
    console.log(`ChatService: Saved user message with ID: ${userMsg.id}`);

    console.log(`ChatService: Saving assistant message to chat ${chatId} with mentorId: ${messageMentorId}`);
    // Save assistant response
    const assistantMsg = await this.prisma.message.create({
      data: {
        chatId,
        userId,
        ...(messageMentorId && { mentorId: messageMentorId }),
        role: 'assistant',
        content: assistantResponse,
        model,
        tokens,
        metadata,
        taskId,
      },
    });
    console.log(`ChatService: Saved assistant message with ID: ${assistantMsg.id}`);

    // Update chat's updatedAt timestamp
    await this.prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    return {
      userMessage: userMsg,
      assistantMessage: assistantMsg,
    };
  }

  // Get or create a chat for a mentor
  async getOrCreateMentorChat(userId: string, mentorId: string, title?: string) {
    // Try to find an existing active chat for this mentor
    let chat = await this.prisma.chat.findFirst({
      where: {
        userId,
        mentorId,
        isActive: true,
      },
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // If no chat exists, create a new one
    if (!chat) {
      chat = await this.createChat(userId, {
        mentorId,
        title: title || `Chat with ${mentorId}`,
      });
    }

    return chat;
  }

  // Get chat statistics
  async getChatStats(userId: string) {
    const totalChats = await this.prisma.chat.count({
      where: { userId, isActive: true },
    });

    const totalMessages = await this.prisma.message.count({
      where: {
        chat: {
          userId,
          isActive: true,
        },
      },
    });

    const mentorChats = await this.prisma.chat.count({
      where: {
        userId,
        isActive: true,
        mentorId: { not: null },
      },
    });

    const standaloneChats = await this.prisma.chat.count({
      where: {
        userId,
        isActive: true,
        mentorId: null,
      },
    });

    return {
      totalChats,
      totalMessages,
      mentorChats,
      standaloneChats,
    };
  }
} 